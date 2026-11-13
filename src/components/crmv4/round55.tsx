"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round55";
import { crmv4Href } from "@/lib/crmv4/sections";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const STATUS_LABEL: Record<string, CrmV4CopyKey> = {
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

export function PayoutBoard({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
  const data = useJson<{ requests?: PayRow[] }>("/api/admin/withdrawals?take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const loaded = data.data?.requests || [];
  const shown = filterPays(loaded, status, query);
  const totals = currencyTotals(shown);

  async function confirm() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint("WITHDRAW"), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(`${pending.name} · ${res.ok ? v4("pbSaved") : `${v4("pbNotSaved")} ${res.error || ""}`}`);
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
    <section className="c4-payout-board c4-payout-vestibule" aria-label={v4("pbTitle")} data-pay-board="1" data-desk="vestibule" data-viewer={viewer ? "1" : "0"}>
      <header className="c4-pay-head c4-payout-vestibule-mast">
        <p className="c4-payout-vestibule-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-payout-vestibule-kicker">{v4("pbSub")}</p>
          <h2 className="c4-title c4-payout-vestibule-title">{v4("pbTitle")}</h2>
        </div>
        <ol className="c4-payout-vestibule-index" aria-label={v4("pbTitle")}>
          <li data-tone="gold">{v4("vslChampagne")}</li>
          <li data-tone="ink">{v4("vslGraphite")}</li>
          <li data-tone="ivory">{v4("vslIvory")}</li>
        </ol>
      </header>
      <p className="c4-payout-vestibule-lead">{v4("pbVestLead")}</p>
      <p className="c4-meta">{v4("pbCount")} {shown.length}</p>
      <p className="c4-meta">{v4("pbHint")}</p>
      {viewer && <p className="c4-meta">{v4("pbViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("pbSearch")}</span>
        <input className="c4-field" aria-label={v4("pbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("pbAll")}>
        <button type="button" className="c4-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v4("pbAll")}</button>
        {PAY_STATUSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v4(STATUS_LABEL[item])}</button>
        ))}
      </div>
      <div className="c4-payout-totals" aria-label={v4("pbTotals")}>
        <p className="c4-meta">{v4("pbTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v4("pbNoCurrency")}</span>
              <strong>{line.currency.length === 3 ? money(line.amount, line.currency, locale) : line.amount.toFixed(2)}</strong>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("pbLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("pbFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("pbNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("pbEmpty")}</p>}
      <ul className="c4-payout-cards">
        {shown.map((row) => {
          const current = payStatus(row);
          const name = row.user?.name || row.user?.email || "—";
          return (
            <li key={row.id} className="c4-payout-card" data-status={current || "none"}>
              <div className="c4-row c4-between">
                <strong>{name}</strong>
                <span className="c4-payout-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v4(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p>{amountText(row, locale, v4("pbNoCurrency"))}</p>
              <p className="c4-meta">{v4("pbMethod")} {row.method || "—"} · {when(row.createdAt, locale)}</p>
              <div className="c4-row">
                {row.user?.id && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.user.id}`)}>{v4("pbOpen")}</Link>}
                {!viewer && current === "PENDING" && (
                  <>
                    <button type="button" className="c4-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "approve" }); }}>{v4("pbApprove")}</button>
                    <button type="button" className="c4-btn" onClick={() => { setReason(""); setPending({ id: row.id, name, action: "reject" }); }}>{v4("pbReject")}</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("pbConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "approve" ? v4("pbApprove") : v4("pbReject")}</p>
          <label className="c4-lab">
            <span>{v4("pbReason")}</span>
            <input className="c4-field" aria-label={v4("pbReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("pbReasonOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirm()}>{v4("pbConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("pbCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function ShiftSheet({ v4, tx }: { v4: V4; tx: Tx }) {
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

  return (
    <section className="c4-handoff c4-handoff-vestibule" aria-label={v4("shTitle")} data-handoff="1" data-desk="vestibule">
      <header className="c4-pay-head c4-handoff-vestibule-mast">
        <p className="c4-handoff-vestibule-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-handoff-vestibule-kicker">{v4("shSub")}</p>
          <h2 className="c4-title c4-handoff-vestibule-title">{v4("shTitle")}</h2>
        </div>
        <ol className="c4-handoff-vestibule-index" aria-label={v4("shTitle")}>
          <li data-tone="gold">{v4("vslChampagne")}</li>
          <li data-tone="ink">{v4("vslGraphite")}</li>
          <li data-tone="ivory">{v4("vslIvory")}</li>
        </ol>
      </header>
      <p className="c4-handoff-vestibule-lead">{v4("shVestLead")}</p>
      <p className="c4-meta">{shown.length}</p>
      <p className="c4-meta">{v4("shHint")}</p>
      <label className="c4-lab">
        <span>{v4("shSearch")}</span>
        <input className="c4-field" aria-label={v4("shSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addShift(notes, { id: `shift-${Date.now()}`, open, watch, at: new Date().toISOString() });
        if (next.every((note, index) => note.id === notes[index]?.id)) return;
        store(next);
        setOpen("");
        setWatch("");
      }}>
        <label className="c4-lab">
          <span>{v4("shOpen")}</span>
          <select className="c4-select" aria-label={v4("shOpen")} value={open} onChange={(event) => setOpen(event.target.value)}>
            <option value="">{v4("shOpen")}</option>
            {pendingPays.map((row) => {
              const label = payLabel(row);
              return <option key={row.id} value={label}>{label}</option>;
            })}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("shWatch")}</span>
          <select className="c4-select" aria-label={v4("shWatch")} value={watch} onChange={(event) => setWatch(event.target.value)}>
            <option value="">{v4("shWatch")}</option>
            {loadedPeople.map((row) => {
              const label = row.name || row.email || row.id;
              return <option key={row.id} value={label}>{label}</option>;
            })}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("shAdd")}</button>
        <span className="c4-meta">{v4("shLocal")}</span>
      </form>
      {!pendingPays.length && !pays.loading && <p className="c4-meta">{v4("shNoOpen")}</p>}
      {!loadedPeople.length && !people.loading && <p className="c4-meta">{v4("shNoWatch")}</p>}
      {loading && <p className="c4-meta">{v4("shLoading")}</p>}
      {(pays.error || people.error) && <p className="c4-meta">{v4("shFailed")} {tx("failed")}</p>}
      {!notes.length && <p className="c4-pay-empty">{v4("shNone")}</p>}
      {notes.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("shEmpty")}</p>}
      <ul className="c4-shift-notes">
        {shown.map((note) => (
          <li key={note.id} className="c4-shift-note" data-pinned={note.pinned ? "1" : "0"}>
            <p><span className="c4-meta">{v4("shOpen")}</span> {note.open || "—"}</p>
            <p><span className="c4-meta">{v4("shWatch")}</span> {note.watch || "—"}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" aria-pressed={note.pinned} onClick={() => store(toggleShiftPin(notes, note.id))}>{note.pinned ? v4("shUnpin") : v4("shPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(clearShift(notes, note.id))}>{v4("shClear")}</button>
            </div>
          </li>
        ))}
      </ul>
      {notes.length > 0 && <button type="button" className="c4-btn" onClick={() => setClearing(true)}>{v4("shClearAll")}</button>}
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-shift-clear="">
          <p>{v4("shClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn" onClick={() => { store([]); setClearing(false); }}>{v4("shConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(false)}>{v4("shCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
