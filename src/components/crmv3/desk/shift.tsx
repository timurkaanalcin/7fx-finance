"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  PAY_STATUSES,
  SHIFT_KEY,
  addShift,
  clearShift,
  currencyTotals,
  filterPays,
  payLabel,
  payStatus,
  readShift,
  searchShift,
  toggleShiftPin,
  type PayRow,
  type ShiftNote,
} from "@/lib/crmv3/shift";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const STATUS_LABEL: Record<string, CrmV3CopyKey> = {
  PENDING: "pbPending",
  APPROVED: "pbApproved",
  REJECTED: "pbRejected",
};

function amountText(row: PayRow, locale: string, none: string): string {
  const currency = String(row.currency || "").trim().toUpperCase();
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) return "—";
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
}

export function PayoutBoard({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ requests?: PayRow[] }>("/api/admin/withdrawals?take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending) && !busy, () => setPending(null));
  useEffect(() => {
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.requests || [];
  const shown = filterPays(loaded, status, query);
  const totals = currencyTotals(shown);

  async function confirm() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint("WITHDRAW"), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(`${pending.name} · ${res.ok ? v3("pbSaved") : `${v3("pbNotSaved")} ${res.error || ""}`}`);
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
    <section className="c3-payout-board" aria-label={v3("pbTitle")} data-pay-board="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("pbSub")}</p>
          <h2 className="c3-title">{v3("pbTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("pbCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("pbHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("pbViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("pbSearch")}</span>
        <input className="c3-field" aria-label={v3("pbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("pbAll")}>
        <button type="button" className="c3-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v3("pbAll")}</button>
        {PAY_STATUSES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v3(STATUS_LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-payout-totals" aria-label={v3("pbTotals")}>
        <p className="c3-muted">{v3("pbTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("pbNoCurrency")}</span>
              <strong>{line.amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("pbLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("pbFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("pbNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("pbEmpty")}</p>}
      <ul className="c3-payout-cards">
        {shown.map((row) => {
          const current = payStatus(row);
          const name = row.user?.name || row.user?.email || "—";
          return (
            <li key={row.id} className="c3-payout-card" data-status={current || "none"}>
              <div className="c3-row c3-between">
                <strong>{name}</strong>
                <span className="c3-payout-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v3(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p>{amountText(row, locale, v3("pbNoCurrency"))}</p>
              <p className="c3-muted">{v3("pbMethod")} {row.method || "—"} · {when(row.createdAt, locale)}</p>
              <div className="c3-row">
                {row.user?.id && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.user.id}`)}>{v3("pbOpen")}</Link>}
                {!viewer && current === "PENDING" && (
                  <>
                    <button type="button" className="c3-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "approve" }); }}>{v3("pbApprove")}</button>
                    <button type="button" className="c3-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "reject" }); }}>{v3("pbReject")}</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("pbConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "approve" ? v3("pbApprove") : v3("pbReject")}</p>
          <label className="c3-lab">
            <span>{v3("pbReason")}</span>
            <input className="c3-field" aria-label={v3("pbReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("pbReasonOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirm()}>{v3("pbConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("pbCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function ShiftSheet({ tx }: { tx: Tx }) {
  const v3 = useV3();
  const pays = useJson<{ requests?: PayRow[] }>("/api/admin/withdrawals?take=40");
  const people = useJson<{ users?: { id: string; name?: string | null; email?: string | null }[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState("");
  const [watch, setWatch] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => { setNotes(readShift(readJson(SHIFT_KEY, []))); }, []);
  const pendingPays = filterPays(pays.data?.requests || [], "PENDING", "");
  const loadedPeople = people.data?.users || [];
  const shown = searchShift(notes, query);
  const loading = (pays.loading && !pays.data) || (people.loading && !people.data);

  function store(next: ShiftNote[]) {
    setNotes(next);
    writeJson(SHIFT_KEY, next);
  }

  function add() {
    const next = addShift(notes, { id: `shift-${Date.now()}`, open, watch, at: new Date().toISOString() });
    if (next.every((note, index) => note.id === notes[index]?.id)) return;
    store(next);
    setOpen("");
    setWatch("");
  }

  return (
    <section className="c3-handoff" aria-label={v3("shTitle")} data-handoff="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("shSub")}</p>
          <h2 className="c3-title">{v3("shTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("shHint")}</p>
      <label className="c3-lab">
        <span>{v3("shSearch")}</span>
        <input className="c3-field" aria-label={v3("shSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("shOpen")}</span>
          <select className="c3-select" aria-label={v3("shOpen")} aria-required={false} value={open} onChange={(event) => setOpen(event.target.value)}>
            <option value="">{v3("shOpen")}</option>
            {pendingPays.map((row) => {
              const label = payLabel(row);
              return <option key={row.id} value={label}>{label}</option>;
            })}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("shWatch")}</span>
          <select className="c3-select" aria-label={v3("shWatch")} aria-required={false} value={watch} onChange={(event) => setWatch(event.target.value)}>
            <option value="">{v3("shWatch")}</option>
            {loadedPeople.map((row) => {
              const label = row.name || row.email || row.id;
              return <option key={row.id} value={label}>{label}</option>;
            })}
          </select>
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("shAdd")}</button>
        <span className="c3-muted">{v3("shLocal")}</span>
      </div>
      {!pendingPays.length && !pays.loading && <p className="c3-muted">{v3("shNoOpen")}</p>}
      {!loadedPeople.length && !people.loading && <p className="c3-muted">{v3("shNoWatch")}</p>}
      {loading && <p className="c3-muted">{v3("shLoading")}</p>}
      {(pays.error || people.error) && <p className="c3-muted">{v3("shFailed")} {tx("failed")}</p>}
      {!notes.length && <p className="c3-empty">{v3("shNone")}</p>}
      {notes.length > 0 && !shown.length && <p className="c3-empty">{v3("shEmpty")}</p>}
      <ul className="c3-shift-notes">
        {shown.map((note) => (
          <li key={note.id} className="c3-shift-note" data-pinned={note.pinned ? "1" : "0"}>
            <p><span className="c3-muted">{v3("shOpen")}</span> {note.open || "—"}</p>
            <p><span className="c3-muted">{v3("shWatch")}</span> {note.watch || "—"}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" aria-pressed={note.pinned} onClick={() => store(toggleShiftPin(notes, note.id))}>{note.pinned ? v3("shUnpin") : v3("shPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(clearShift(notes, note.id))}>{v3("shClear")}</button>
            </div>
          </li>
        ))}
      </ul>
      {notes.length > 0 && <button type="button" className="c3-btn" onClick={() => setClearing(true)}>{v3("shClearAll")}</button>}
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-shift-clear="">
          <p>{v3("shClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn" onClick={() => { store([]); setClearing(false); }}>{v3("shConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(false)}>{v3("shCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
