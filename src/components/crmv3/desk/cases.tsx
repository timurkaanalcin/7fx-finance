"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV2CopyKey } from "@/lib/crmv2/copy";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  CASE_STATUSES,
  PIN_KEY,
  SHORTCUT_KEY,
  addShortcut,
  caseStatus,
  filterCases,
  moveVisible,
  readIds,
  readShortcuts,
  removeShortcut,
  reviewBody,
  sortCases,
  toggleHidden,
  toggleId,
  visibleShortcuts,
  type CaseRow,
  type Shortcut,
} from "@/lib/crmv3/cases";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { CRM_V3_SECTIONS, crmv3Href } from "@/lib/crmv3/sections";
import { sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const ALLOWED = CRM_V3_SECTIONS.map((item) => item.id);

const ROUTE_LABEL: Partial<Record<string, CrmV3CopyKey>> = {
  finance: "money",
  me: "staffProfile",
  goals: "goalsTitle",
  kyc: "kycDesk",
  gallery: "glTitle",
  dense: "dnTitle",
  notices: "ibTitle",
  tags: "tgTitle",
  blotter: "blTitle",
  pad: "pdTitle",
  history: "hsTitle",
  risk: "rkTitle",
  withdraw: "wdDesk",
  payout: "pqTitle",
  deposit: "depDesk",
  funding: "fuTitle",
  inbox: "inboxTitle",
  thread: "cvTitle",
  reports: "reportsTitle",
  insights: "insTitle",
  affiliates: "afTitle",
  agenda: "agTitle",
  day: "dayTitle",
  roster: "staffTitle",
  access: "axTitle",
  prefs: "prefTitle",
  cases: "cqTitle",
  shortcuts: "scTitle",
};

const STATUS_LABEL: Record<string, CrmV3CopyKey> = {
  PENDING: "cqPending",
  APPROVED: "cqApproved",
  REJECTED: "cqRejected",
};

function routeName(id: string, v3: (key: CrmV3CopyKey) => string, tx: Tx): string {
  const key = ROUTE_LABEL[id];
  return key ? v3(key) : tx(id as CrmV2CopyKey);
}

export function CaseQueue({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ documents?: CaseRow[] }>("/api/admin/documents?take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState<string[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ id: string; name: string; status: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending) && !busy, () => setPending(null));
  useEffect(() => {
    setPins(readIds(readJson(PIN_KEY, [])));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.documents || [];
  const shown = sortCases(filterCases(loaded, status, query), pins);

  function storePins(next: string[]) {
    setPins(next);
    writeJson(PIN_KEY, next);
  }

  async function confirm() {
    if (!pending || busy || viewer) return;
    const body = reviewBody(pending.id, pending.status, reason);
    if (!body) return;
    setBusy(true);
    try {
      const res = await sendJson("/api/admin/documents", "POST", body);
      setMsg(`${pending.name} · ${res.ok ? v3("cqSaved") : `${v3("cqNotSaved")} ${res.error || ""}`}`);
      if (res.ok) {
        setPending(null);
        setReason("");
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-case-queue" aria-label={v3("cqTitle")} data-case-queue="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cqSub")}</p>
          <h2 className="c3-title">{v3("cqTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("cqCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("cqHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("cqViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("cqSearch")}</span>
        <input className="c3-field" aria-label={v3("cqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("cqAll")}>
        <button type="button" className="c3-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v3("cqAll")}</button>
        {CASE_STATUSES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v3(STATUS_LABEL[item])}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("cqLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("cqFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("cqNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("cqEmpty")}</p>}
      <ul className="c3-case-cards">
        {shown.map((row) => {
          const current = caseStatus(row);
          const picked = choice[row.id] || "";
          return (
            <li key={row.id} className="c3-case-card" data-pinned={pins.includes(row.id) ? "1" : "0"} data-status={current || "none"}>
              <div className="c3-row c3-between">
                <strong>{row.name || "—"}</strong>
                <span className="c3-case-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v3(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p className="c3-muted">{row.docType || "—"} · {row.trader || "—"} · {row.desk || "—"}</p>
              <p className="c3-muted">{when(row.createdAt, locale)}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" aria-pressed={pins.includes(row.id)} onClick={() => storePins(toggleId(pins, row.id))}>{pins.includes(row.id) ? v3("cqUnpin") : v3("cqPin")}</button>
                {row.traderId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.traderId}`)}>{v3("cqOpen")}</Link>}
              </div>
              {!viewer && (
                <div className="c3-row">
                  <label className="c3-lab">
                    <span>{v3("cqStatus")}</span>
                    <select className="c3-select" aria-label={v3("cqStatus")} value={picked} onChange={(event) => setChoice({ ...choice, [row.id]: event.target.value })}>
                      <option value="">{v3("cqNeedStatus")}</option>
                      {CASE_STATUSES.map((item) => <option key={item} value={item}>{v3(STATUS_LABEL[item])}</option>)}
                    </select>
                  </label>
                  <button type="button" className="c3-btn" disabled={!picked} onClick={() => { setReason(""); setPending({ id: row.id, name: row.name || row.trader || row.id, status: picked }); }}>{v3("cqSet")}</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("cqConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {STATUS_LABEL[pending.status] ? v3(STATUS_LABEL[pending.status]) : pending.status}</p>
          <label className="c3-lab">
            <span>{v3("cqReason")}</span>
            <input className="c3-field" aria-label={v3("cqReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("cqReasonOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy || !pending.status} onClick={() => void confirm()}>{v3("cqConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("cqCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function ShortcutRail({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
  const [rows, setRows] = useState<Shortcut[]>([]);
  const [route, setRoute] = useState("");
  useEffect(() => { setRows(readShortcuts(readJson(SHORTCUT_KEY, []), ALLOWED)); }, []);
  const shown = visibleShortcuts(rows);
  const hidden = rows.filter((item) => item.hidden);

  function store(next: Shortcut[]) {
    setRows(next);
    writeJson(SHORTCUT_KEY, next);
  }

  function add() {
    const next = addShortcut(rows, route, ALLOWED);
    if (next.every((item, index) => item.id === rows[index]?.id)) return;
    store(next);
    setRoute("");
  }

  return (
    <section className="c3-shortcut-rail" aria-label={v3("scTitle")} data-shortcut-rail="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("scSub")}</p>
          <h2 className="c3-title">{v3("scTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("scHint")}</p>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("scRoute")}</span>
          <select className="c3-select" aria-label={v3("scRoute")} aria-required={false} value={route} onChange={(event) => setRoute(event.target.value)}>
            <option value="">{v3("scRoute")}</option>
            {ALLOWED.map((id) => <option key={id} value={id}>{routeName(id, v3, tx)}</option>)}
          </select>
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("scAdd")}</button>
        <span className="c3-muted">{v3("scLocal")}</span>
      </div>
      {!rows.length && <p className="c3-empty">{v3("scEmpty")}</p>}
      <ol className="c3-shortcut-list">
        {shown.map((item, index) => (
          <li key={item.id}>
            <Link href={crmv3Href(base, item.id === "overview" ? "" : item.id)}>{routeName(item.id, v3, tx)}</Link>
            <div className="c3-row">
              <button type="button" className="c3-btn" disabled={index === 0} onClick={() => store(moveVisible(rows, item.id, -1))}>{v3("scUp")}</button>
              <button type="button" className="c3-btn" disabled={index === shown.length - 1} onClick={() => store(moveVisible(rows, item.id, 1))}>{v3("scDown")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleHidden(rows, item.id))}>{v3("scHide")}</button>
              <button type="button" className="c3-btn" onClick={() => store(removeShortcut(rows, item.id))}>{v3("scRemove")}</button>
            </div>
          </li>
        ))}
      </ol>
      <div className="c3-row" role="group" aria-label={v3("scHidden")}>
        <span className="c3-muted">{v3("scHidden")}</span>
        {!hidden.length && <span className="c3-muted">{v3("scNoneHidden")}</span>}
        {hidden.map((item) => (
          <button key={item.id} type="button" className="c3-chip" onClick={() => store(toggleHidden(rows, item.id))}>{routeName(item.id, v3, tx)} · {v3("scShow")}</button>
        ))}
      </div>
    </section>
  );
}
