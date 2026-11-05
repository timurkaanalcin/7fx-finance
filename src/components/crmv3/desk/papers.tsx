"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import {
  CHECK_KEYS,
  EMPTY_CHECKS,
  GALLERY_KEY,
  auditLevels,
  checkCount,
  docTypes,
  filterAudit,
  filterDocs,
  findDay,
  groupAudit,
  historyCsv,
  moneyLines,
  moneyOf,
  personOf,
  readChecks,
  setCheck,
  type AuditRow,
  type Checks,
  type DocCard,
  type Person,
} from "@/lib/crmv3/papers";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { crmv3Href } from "@/lib/crmv3/sections";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const CHECK_LABEL: Record<keyof Checks, CrmV3CopyKey> = {
  name: "glCheckName",
  photo: "glCheckPhoto",
  expiry: "glCheckExpiry",
  readable: "glCheckRead",
};

export function GalleryDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const docs = useJson<{ documents?: DocCard[] }>("/api/admin/documents?status=PENDING&take=40");
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [checks, setChecks] = useState<Record<string, Checks>>({});
  const [viewer, setViewer] = useState(false);
  const [pending, setPending] = useState<{ id: string; name: string; doc: string; status: "APPROVED" | "REJECTED" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setChecks(readChecks(readJson(GALLERY_KEY, {})));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = docs.data?.documents || [];
  const shown = filterDocs(loaded, type, query);
  const types = docTypes(loaded);
  const open = shown.find((row) => row.id === openId) || shown[0] || null;
  const person = open ? personOf(people.data?.users || [], String(open.traderId || "")) : null;
  const box = open ? checks[open.id] || EMPTY_CHECKS : EMPTY_CHECKS;

  function tick(key: keyof Checks, on: boolean) {
    if (!open) return;
    const next = setCheck(checks, open.id, key, on);
    setChecks(next);
    writeJson(GALLERY_KEY, next);
  }

  async function confirmReview() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const note = reason.trim();
      const res = await sendJson("/api/admin/documents", "POST", {
        action: "review",
        id: pending.id,
        status: pending.status,
        ...(note ? { note } : {}),
      });
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        setPending(null);
        setReason("");
        docs.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-payout c3-papers" aria-label={v3("glTitle")} data-doc-gallery="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("glSub")}</p>
          <h2 className="c3-title">{v3("glTitle")}</h2>
        </div>
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("glDeskLink")}</Link>
      </header>
      <p className="c3-muted">{v3("glHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("glViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("glSearch")}</span>
        <input className="c3-field" aria-label={v3("glSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("glAllTypes")}>
        <button type="button" className="c3-chip" data-on={type ? "0" : "1"} onClick={() => setType("")}>{v3("glAllTypes")}</button>
        {types.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={type === item ? "1" : "0"} onClick={() => setType(item)}>{item}</button>
        ))}
      </div>
      {!shown.length && <p className="c3-empty">{v3("glEmpty")}</p>}
      <div className="c3-fund-split">
        <ul className="c3-paper-grid">
          {shown.map((row) => (
            <li key={row.id}>
              <button type="button" className="c3-pay-row" data-on={open?.id === row.id ? "1" : "0"} onClick={() => setOpenId(row.id)}>
                <strong>{row.name || row.docType || row.id}</strong>
                <span className="c3-muted">{row.trader || "—"}</span>
                <span className="c3-sla" data-status="PENDING">{row.docType || "—"}</span>
                <span className="c3-muted">{checkCount(checks[row.id] || EMPTY_CHECKS)}/{CHECK_KEYS.length}</span>
              </button>
            </li>
          ))}
        </ul>
        {open && (
          <aside className="c3-pay-detail" aria-label={v3("glSummary")}>
            <h3 className="c3-title">{open.name || open.docType || open.id}</h3>
            <p className="c3-muted">{open.trader || "—"} · {open.traderEmail || "—"}</p>
            <p className="c3-muted">{open.createdAt ? when(open.createdAt, locale) : "—"}</p>
            <h4 className="c3-title">{v3("glSummary")}</h4>
            {!person && <p className="c3-muted">{v3("glNoPerson")}</p>}
            {person && (
              <>
                <p>{person.name || "—"}</p>
                <p className="c3-muted">{person.email || "—"}</p>
                <p className="c3-muted">{v3("glCountry")} {person.country || "—"}</p>
                <p className="c3-muted">{v3("glDesk")} {person.desk || "—"}</p>
                <p className="c3-muted">{v3("glKyc")} {person.documentsStatus || "—"}</p>
                {open.traderId && <Link className="c3-btn" href={crmv3Href(base, `customers/${open.traderId}`)}>{v3("glPerson")}</Link>}
              </>
            )}
            <fieldset className="c3-paper-checks">
              <legend className="c3-muted">{v3("glChecks")} {checkCount(box)}/{CHECK_KEYS.length}</legend>
              <p className="c3-muted">{v3("glCheckHint")}</p>
              {CHECK_KEYS.map((key) => (
                <label key={key} className="c3-row">
                  <input type="checkbox" checked={box[key]} aria-label={v3(CHECK_LABEL[key])} onChange={(event) => tick(key, event.target.checked)} />
                  <span>{v3(CHECK_LABEL[key])}</span>
                </label>
              ))}
            </fieldset>
            {!viewer && (
              <div className="c3-row">
                <button type="button" className="c3-btn c3-btn-hot" onClick={() => setPending({ id: open.id, name: open.trader || "—", doc: open.name || open.docType || open.id, status: "APPROVED" })}>{v3("glApprove")}</button>
                <button type="button" className="c3-btn" onClick={() => setPending({ id: open.id, name: open.trader || "—", doc: open.name || open.docType || open.id, status: "REJECTED" })}>{v3("glReject")}</button>
              </div>
            )}
          </aside>
        )}
      </div>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("glConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.doc} · {pending.status === "APPROVED" ? v3("glApprove") : v3("glReject")}</p>
          <label className="c3-lab">
            <span>{v3("glReason")}</span>
            <input className="c3-field" aria-label={v3("glReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("glReasonHint")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirmReview()}>{v3("glConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("glCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function HistoryDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const data = useJson<{ rows?: AuditRow[] }>("/api/admin/control?part=logs&source=audit&level=all&take=40");
  const [level, setLevel] = useState("");
  const [jump, setJump] = useState("");
  const [miss, setMiss] = useState(false);
  const [msg, setMsg] = useState("");
  const loaded = data.data?.rows || [];
  const shown = filterAudit(loaded, level);
  const levels = auditLevels(loaded);
  const groups = groupAudit(shown);
  const lines = moneyLines(shown);
  function go() {
    const day = findDay(groups.map((group) => group.day).filter(Boolean), jump);
    if (!day) {
      setMiss(true);
      return;
    }
    setMiss(false);
    const node = document.getElementById(`c3-audit-${day}`);
    const panel = document.querySelector(".c3-main");
    if (node && panel) {
      const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
      panel.scrollTop = Math.max(0, top - 8);
    }
  }
  async function exportCsv() {
    const ok = await auditExport("history-loaded", shown.length, `${base}/history`);
    if (!ok) {
      setMsg(tx("failed"));
      return;
    }
    downloadCsv("history-loaded.csv", ["at", "action", "actor", "target", "level", "currency", "amount"], historyCsv(shown));
  }
  return (
    <section className="c3-payout c3-history" aria-label={v3("hsTitle")} data-history="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("hsSub")}</p>
          <h2 className="c3-title">{v3("hsTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("hsHint")}</p>
      <p className="c3-muted">{v3("hsShowing")} {shown.length}</p>
      <div className="c3-pay-kpis" aria-label={v3("hsMoney")}>
        {lines.map((line) => (
          <article key={line.currency} className="c3-pay-kpi">
            <span className="c3-muted">{v3("hsMoney")} · {line.currency}</span>
            <strong>{money(line.amount, line.currency, locale)}</strong>
            <span className="c3-muted">{line.count}</span>
          </article>
        ))}
        {!lines.length && (
          <article className="c3-pay-kpi">
            <span className="c3-muted">{v3("hsMoney")}</span>
            <strong>{v3("hsNoMoney")}</strong>
          </article>
        )}
      </div>
      <div className="c3-row" role="group" aria-label={v3("hsAll")}>
        <button type="button" className="c3-chip" data-on={level ? "0" : "1"} onClick={() => setLevel("")}>{v3("hsAll")}</button>
        {levels.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={level === item ? "1" : "0"} onClick={() => setLevel(item)}>{item}</button>
        ))}
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("hsJump")}</span>
          <input className="c3-field" type="date" aria-label={v3("hsJump")} value={jump} onChange={(event) => { setJump(event.target.value); setMiss(false); }} />
        </label>
        <button type="button" className="c3-btn" onClick={go}>{v3("hsGo")}</button>
        <button type="button" className="c3-btn" onClick={() => void exportCsv()}>{v3("hsCsv")}</button>
      </div>
      <p className="c3-muted">{v3("hsCsvHint")}</p>
      {miss && <p className="c3-muted">{v3("hsMissing")}</p>}
      {!shown.length && <p className="c3-empty">{v3("hsEmpty")}</p>}
      {groups.map((group) => (
        <section key={group.day || "none"} className="c3-tl-group" id={group.day ? `c3-audit-${group.day}` : undefined}>
          <h3 className="c3-title">{group.day || v3("hsUndated")}</h3>
          <ol className="c3-thread-list">
            {group.rows.map((row) => {
              const cash = moneyOf(row.detail);
              return (
                <li key={row.id} className="c3-thread-line" data-level={row.level || ""}>
                  <strong>{row.action || "—"}</strong>
                  <span className="c3-muted">{row.actor || "—"} · {row.target || "—"}</span>
                  <span className="c3-sla" data-status={row.level === "warn" ? "REJECTED" : "PENDING"}>{row.level || "—"}</span>
                  {cash && <span>{money(cash.amount, cash.currency, locale)}</span>}
                  <span className="c3-muted">{row.at ? when(row.at, locale) : v3("hsUndated")}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}
