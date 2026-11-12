"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round54";
import { CRM_V4_SECTIONS, crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const ALLOWED = CRM_V4_SECTIONS.map((item) => item.id);

const ROUTE_LABEL: Record<string, CrmV4CopyKey> = {
  overview: "subOverview",
  customers: "subCustomers",
  finance: "financeNav",
  positions: "subPositions",
  support: "subSupport",
  marketing: "subMarketing",
  settings: "subSettings",
  logs: "subLogs",
  control: "subControl",
  kyc: "kycDesk",
  reports: "reportsTitle",
  inbox: "inboxTitle",
  blotter: "blTitle",
  pad: "pdTitle",
  cases: "cqTitle",
  shortcuts: "scTitle",
  notices: "ibTitle",
  tags: "tgTitle",
  dense: "dnTitle",
};

const STATUS_LABEL: Record<string, CrmV4CopyKey> = {
  PENDING: "cqPending",
  APPROVED: "cqApproved",
  REJECTED: "cqRejected",
};

function routeName(id: string, v4: V4): string {
  const key = ROUTE_LABEL[id];
  return key ? v4(key) : id;
}

export function CaseQueue({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setPins(readIds(readJson(PIN_KEY, [])));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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
      setMsg(`${pending.name} · ${res.ok ? v4("cqSaved") : `${v4("cqNotSaved")} ${res.error || ""}`}`);
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
    <section className="c4-case-queue c4-case-gallery" aria-label={v4("cqTitle")} data-case-queue="1" data-desk="gallery" data-viewer={viewer ? "1" : "0"}>
      <header className="c4-case-mast">
        <p className="c4-case-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker">{v4("cqSub")}</p>
          <h2 className="c4-title">{v4("cqTitle")}</h2>
        </div>
        <p className="c4-case-count">{v4("cqCount")} {shown.length}</p>
      </header>
      <p className="c4-case-legend" aria-label={v4("cqAll")}>
        <span data-status="PENDING">{v4("cqPending")}</span>
        <span data-status="APPROVED">{v4("cqApproved")}</span>
        <span data-status="REJECTED">{v4("cqRejected")}</span>
      </p>
      <p className="c4-case-links">
        <Link href={crmv4Href(base, "trc")}>{v4("trcTitle")}</Link>
        <Link href={crmv4Href(base, "clp")}>{v4("clpTitle")}</Link>
      </p>
      <p className="c4-meta">{v4("cqHint")}</p>
      {viewer && <p className="c4-meta">{v4("cqViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("cqSearch")}</span>
        <input className="c4-field" aria-label={v4("cqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cqAll")}>
        <button type="button" className="c4-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v4("cqAll")}</button>
        {CASE_STATUSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v4(STATUS_LABEL[item])}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("cqLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("cqFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty c4-case-empty">{v4("cqNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty c4-case-empty">{v4("cqEmpty")}</p>}
      <ul className="c4-case-cards">
        {shown.map((row) => {
          const current = caseStatus(row);
          const picked = choice[row.id] || "";
          return (
            <li key={row.id} className="c4-case-card c4-case-docket" data-pinned={pins.includes(row.id) ? "1" : "0"} data-status={current || "none"}>
              <div className="c4-row c4-between">
                <strong>{row.name || "—"}</strong>
                <span className="c4-case-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v4(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p className="c4-meta">{row.docType || "—"} · {row.trader || "—"} · {row.desk || "—"}</p>
              <p className="c4-meta">{when(row.createdAt, locale)}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" aria-pressed={pins.includes(row.id)} onClick={() => storePins(toggleId(pins, row.id))}>{pins.includes(row.id) ? v4("cqUnpin") : v4("cqPin")}</button>
                {row.traderId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.traderId}`)}>{v4("cqOpen")}</Link>}
              </div>
              {!viewer && (
                <div className="c4-row">
                  <label className="c4-lab">
                    <span>{v4("cqStatus")}</span>
                    <select className="c4-select" aria-label={v4("cqStatus")} value={picked} onChange={(event) => setChoice({ ...choice, [row.id]: event.target.value })}>
                      <option value="">{v4("cqNeedStatus")}</option>
                      {CASE_STATUSES.map((item) => <option key={item} value={item}>{v4(STATUS_LABEL[item])}</option>)}
                    </select>
                  </label>
                  <button type="button" className="c4-btn" disabled={!picked} onClick={() => { setReason(""); setPending({ id: row.id, name: row.name || row.trader || row.id, status: picked }); }}>{v4("cqSet")}</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("cqConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {STATUS_LABEL[pending.status] ? v4(STATUS_LABEL[pending.status]) : pending.status}</p>
          <label className="c4-lab">
            <span>{v4("cqReason")}</span>
            <input className="c4-field" aria-label={v4("cqReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("cqReasonOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy || !pending.status} onClick={() => void confirm()}>{v4("cqConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("cqCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function ShortcutRail({ base, v4 }: { base: string; v4: V4 }) {
  const [rows, setRows] = useState<Shortcut[]>([]);
  const [route, setRoute] = useState("");
  useEffect(() => { setRows(readShortcuts(readJson(SHORTCUT_KEY, []), ALLOWED)); }, []);
  const shown = visibleShortcuts(rows);
  const hidden = rows.filter((item) => item.hidden);

  function store(next: Shortcut[]) {
    setRows(next);
    writeJson(SHORTCUT_KEY, next);
  }

  return (
    <section className="c4-shortcut-rail c4-shortcut-gallery" aria-label={v4("scTitle")} data-shortcut-rail="1" data-desk="gallery">
      <header className="c4-shortcut-mast">
        <p className="c4-shortcut-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker">{v4("scSub")}</p>
          <h2 className="c4-title">{v4("scTitle")}</h2>
        </div>
        <p className="c4-shortcut-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("scHint")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addShortcut(rows, route, ALLOWED);
        if (next.every((item, index) => item.id === rows[index]?.id)) return;
        store(next);
        setRoute("");
      }}>
        <label className="c4-lab">
          <span>{v4("scRoute")}</span>
          <select className="c4-select" aria-label={v4("scRoute")} value={route} onChange={(event) => setRoute(event.target.value)}>
            <option value="">{v4("scRoute")}</option>
            {ALLOWED.map((id) => <option key={id} value={id}>{routeName(id, v4)}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("scAdd")}</button>
        <span className="c4-meta">{v4("scLocal")}</span>
      </form>
      {!rows.length && <p className="c4-pay-empty c4-shortcut-empty">{v4("scEmpty")}</p>}
      <ol className="c4-shortcut-list">
        {shown.map((item, index) => (
          <li key={item.id}>
            <Link href={crmv4Href(base, item.id === "overview" ? "" : item.id)}>{routeName(item.id, v4)}</Link>
            <div className="c4-row">
              <button type="button" className="c4-btn" disabled={index === 0} onClick={() => store(moveVisible(rows, item.id, -1))}>{v4("scUp")}</button>
              <button type="button" className="c4-btn" disabled={index === shown.length - 1} onClick={() => store(moveVisible(rows, item.id, 1))}>{v4("scDown")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleHidden(rows, item.id))}>{v4("scHide")}</button>
              <button type="button" className="c4-btn" onClick={() => store(removeShortcut(rows, item.id))}>{v4("scRemove")}</button>
            </div>
          </li>
        ))}
      </ol>
      <div className="c4-row" role="group" aria-label={v4("scHidden")}>
        <span className="c4-meta">{v4("scHidden")}</span>
        {!hidden.length && <span className="c4-meta">{v4("scNoneHidden")}</span>}
        {hidden.map((item) => (
          <button key={item.id} type="button" className="c4-chip" onClick={() => store(toggleHidden(rows, item.id))}>{routeName(item.id, v4)} · {v4("scShow")}</button>
        ))}
      </div>
    </section>
  );
}
