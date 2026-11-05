"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CHECK_KEYS,
  EMPTY_CHECKS,
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
} from "@/lib/crmv4/round50";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const CHECK_KEY = "crmv4-gallery-checks";
const CHECK_LABEL: Record<keyof Checks, CrmV4CopyKey> = {
  name: "glCheckName",
  photo: "glCheckPhoto",
  expiry: "glCheckExpiry",
  readable: "glCheckRead",
};

export function GalleryDesk({ base, v4, tx, locale }: { base: string; v4: V4; tx: Tx; locale: string }) {
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
    setChecks(readChecks(readJson(CHECK_KEY, {})));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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
    writeJson(CHECK_KEY, next);
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
    <section className="c4-gallery-desk" aria-label={v4("glTitle")} data-gallery="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("glSub")}</p>
          <h2 className="c4-title">{v4("glTitle")}</h2>
        </div>
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("glDeskLink")}</Link>
      </header>
      <p className="c4-meta">{v4("glHint")}</p>
      {viewer && <p className="c4-meta">{v4("glViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("glSearch")}</span>
        <input className="c4-field" aria-label={v4("glSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("glAllTypes")}>
        <button type="button" className="c4-chip" data-on={type ? "0" : "1"} onClick={() => setType("")}>{v4("glAllTypes")}</button>
        {types.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={type === item ? "1" : "0"} onClick={() => setType(item)}>{item}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("glEmpty")}</p>}
      <div className="c4-gallery-split">
        <ul className="c4-gallery-grid">
          {shown.map((row) => (
            <li key={row.id}>
              <button type="button" className="c4-gallery-card" data-on={open?.id === row.id ? "1" : "0"} onClick={() => setOpenId(row.id)}>
                <strong>{row.name || row.docType || row.id}</strong>
                <span className="c4-meta">{row.trader || "—"}</span>
                <span className="c4-status-pill" data-status="PENDING">{row.docType || "—"}</span>
                <span className="c4-meta">{checkCount(checks[row.id] || EMPTY_CHECKS)}/{CHECK_KEYS.length}</span>
              </button>
            </li>
          ))}
        </ul>
        {open && (
          <aside className="c4-pay-detail" aria-label={v4("glSummary")}>
            <h3 className="c4-title">{open.name || open.docType || open.id}</h3>
            <p className="c4-meta">{open.trader || "—"} · {open.traderEmail || "—"}</p>
            <p className="c4-meta">{open.createdAt ? when(open.createdAt, locale) : "—"}</p>
            <h4 className="c4-title">{v4("glSummary")}</h4>
            {!person && <p className="c4-meta">{v4("glNoPerson")}</p>}
            {person && (
              <>
                <p>{person.name || "—"}</p>
                <p className="c4-meta">{person.email || "—"}</p>
                <p className="c4-meta">{v4("glCountry")} {person.country || "—"}</p>
                <p className="c4-meta">{v4("glDesk")} {person.desk || "—"}</p>
                <p className="c4-meta">{v4("glKyc")} {person.documentsStatus || "—"}</p>
                {open.traderId && <Link className="c4-btn" href={crmv4Href(base, `customers/${open.traderId}`)}>{v4("glPerson")}</Link>}
              </>
            )}
            <fieldset className="c4-kyc-checks">
              <legend className="c4-meta">{v4("glChecks")} {checkCount(box)}/{CHECK_KEYS.length}</legend>
              <p className="c4-meta">{v4("glCheckHint")}</p>
              {CHECK_KEYS.map((key) => (
                <label key={key} className="c4-row">
                  <input type="checkbox" checked={box[key]} aria-label={v4(CHECK_LABEL[key])} onChange={(event) => tick(key, event.target.checked)} />
                  <span>{v4(CHECK_LABEL[key])}</span>
                </label>
              ))}
            </fieldset>
            {!viewer && (
              <div className="c4-row">
                <button type="button" className="c4-btn c4-btn-hot" onClick={() => setPending({ id: open.id, name: open.trader || "—", doc: open.name || open.docType || open.id, status: "APPROVED" })}>{v4("glApprove")}</button>
                <button type="button" className="c4-btn" onClick={() => setPending({ id: open.id, name: open.trader || "—", doc: open.name || open.docType || open.id, status: "REJECTED" })}>{v4("glReject")}</button>
              </div>
            )}
          </aside>
        )}
      </div>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("glConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.doc} · {pending.status === "APPROVED" ? v4("glApprove") : v4("glReject")}</p>
          <label className="c4-lab">
            <span>{v4("glReason")}</span>
            <input className="c4-field" aria-label={v4("glReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("glReasonHint")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirmReview()}>{v4("glConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("glCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function HistoryDesk({ v4, tx, locale }: { v4: V4; tx: Tx; locale: string }) {
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
    document.getElementById(`c4-audit-${day}`)?.scrollIntoView({ block: "nearest" });
  }
  async function exportCsv() {
    const ok = await auditExport("history-loaded", shown.length, "/crmv4/history");
    if (!ok) {
      setMsg(tx("failed"));
      return;
    }
    downloadCsv("history-loaded.csv", ["at", "action", "actor", "target", "level", "currency", "amount"], historyCsv(shown));
  }
  return (
    <section className="c4-history-desk" aria-label={v4("hsTitle")} data-history="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("hsSub")}</p>
          <h2 className="c4-title">{v4("hsTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("hsHint")}</p>
      <p className="c4-meta">{v4("hsShowing")} {shown.length}</p>
      <div className="c4-pay-kpis" aria-label={v4("hsMoney")}>
        {lines.map((line) => (
          <article key={line.currency} className="c4-pay-kpi">
            <span className="c4-meta">{v4("hsMoney")} · {line.currency}</span>
            <strong>{money(line.amount, line.currency, locale)}</strong>
            <span className="c4-meta">{line.count}</span>
          </article>
        ))}
        {!lines.length && (
          <article className="c4-pay-kpi">
            <span className="c4-meta">{v4("hsMoney")}</span>
            <strong>{v4("hsNoMoney")}</strong>
          </article>
        )}
      </div>
      <div className="c4-row" role="group" aria-label={v4("hsAll")}>
        <button type="button" className="c4-chip" data-on={level ? "0" : "1"} onClick={() => setLevel("")}>{v4("hsAll")}</button>
        {levels.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={level === item ? "1" : "0"} onClick={() => setLevel(item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("hsJump")}</span>
          <input className="c4-field" type="date" aria-label={v4("hsJump")} value={jump} onChange={(event) => { setJump(event.target.value); setMiss(false); }} />
        </label>
        <button type="button" className="c4-btn" onClick={go}>{v4("hsGo")}</button>
        <button type="button" className="c4-btn" onClick={() => void exportCsv()}>{v4("hsCsv")}</button>
      </div>
      <p className="c4-meta">{v4("hsCsvHint")}</p>
      {miss && <p className="c4-meta">{v4("hsMissing")}</p>}
      {!shown.length && <p className="c4-pay-empty">{v4("hsEmpty")}</p>}
      {groups.map((group) => (
        <section key={group.day || "none"} className="c4-day-group" id={group.day ? `c4-audit-${group.day}` : undefined}>
          <h3 className="c4-title">{group.day || v4("hsUndated")}</h3>
          <ol className="c4-history-list">
            {group.rows.map((row) => {
              const cash = moneyOf(row.detail);
              return (
                <li key={row.id} className="c4-history-line" data-level={row.level || ""}>
                  <strong>{row.action || "—"}</strong>
                  <span className="c4-meta">{row.actor || "—"} · {row.target || "—"}</span>
                  <span className="c4-status-pill" data-status={row.level === "warn" ? "REJECTED" : "PENDING"}>{row.level || "—"}</span>
                  {cash && <span>{money(cash.amount, cash.currency, locale)}</span>}
                  <span className="c4-meta">{row.at ? when(row.at, locale) : v4("hsUndated")}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}
