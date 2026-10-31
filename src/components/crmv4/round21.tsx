"use client";

import { useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import {
  approvalShare,
  byCurrency,
  inDates,
  methodStats,
  noteSummary,
  statusCounts,
  type MoneyLite,
} from "@/lib/crmv4/round21";
import { methodName } from "@/lib/crmv4/round15";
import { money, useJson, when } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Cash = { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null };
type Position = { id: string; symbol?: string | null; side?: string | null; volume?: number | null; status?: string | null };
type Note = { body?: string | null; createdAt?: string | null };

function mine(rows: Cash[], id: string) {
  return rows.filter((row) => String(row.user?.id || row.userId || "") === id);
}

export function StatementSheet({ id, name, email, country, desk, balance, equity, sale, notes, v4, locale }: {
  id: string;
  name: string;
  email: string;
  country: string;
  desk: string;
  balance: string;
  equity: string;
  sale: string;
  notes: Note[];
  v4: V4;
  locale: string;
}) {
  const deposits = useJson<{ requests?: Cash[] }>(email ? `/api/admin/deposits?take=80&q=${encodeURIComponent(email)}` : null);
  const withdrawals = useJson<{ requests?: Cash[] }>(email ? `/api/admin/withdrawals?take=80&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: Position[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=20`);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [msg, setMsg] = useState("");
  const deps = mine(deposits.data?.requests || [], id).filter((row) => inDates(row.createdAt, from, to));
  const wds = mine(withdrawals.data?.requests || [], id).filter((row) => inDates(row.createdAt, from, to));
  const positions = book.data?.positions || [];
  const note = noteSummary(notes);
  const depCounts = statusCounts(deps);
  const wdCounts = statusCounts(wds);
  const printed = new Date().toLocaleString(locale);

  function show(count: number) {
    return !hideEmpty || count > 0;
  }

  function printSheet() {
    const root = document.querySelector("[data-crmv4-root]");
    root?.setAttribute("data-print", "statement");
    const clear = () => root?.removeAttribute("data-print");
    window.addEventListener("afterprint", clear, { once: true });
    window.print();
  }

  const summary = [
    name,
    email,
    balance,
    equity,
    `${v4("statementDeposits")} ${deps.length}`,
    `${v4("statementWithdrawals")} ${wds.length}`,
    `${v4("statementPositions")} ${positions.length}`,
    `${v4("statementNotes")} ${note.count}`,
  ].join("\n");

  return (
    <section className="c4-statement-sheet" aria-label={v4("statementSheet")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("statementSheet")}</span><strong>{name || "—"}</strong></div>
        <div className="c4-fin-metric"><span>{v4("statementDeposits")}</span><strong>{deps.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("statementWithdrawals")}</span><strong>{wds.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("statementPositions")}</span><strong>{positions.length}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("statementHint")}</p>
      <div className="c4-row c4-pad c4-statement-tools">
        <label className="c4-lab"><span>{v4("statementFrom")}</span><input className="c4-field" type="date" aria-label={v4("statementFrom")} value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("statementTo")}</span><input className="c4-field" type="date" aria-label={v4("statementTo")} value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <button type="button" className="c4-chip" data-on={hideEmpty ? "1" : "0"} onClick={() => setHideEmpty((on) => !on)}>{v4("statementHideEmpty")}</button>
        <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(summary); setMsg(v4("statementCopied")); }}>{v4("statementCopy")}</button>
        <button type="button" className="c4-btn c4-btn-hot" onClick={printSheet}>{v4("statementPrint")}</button>
      </div>
      <div className="c4-statement-body">
        <p>{email} · {country} · {desk} · {sale}</p>
        <p>{balance} · {equity}</p>
        <p className="c4-muted">{v4("statementPrinted")} {printed}</p>
        <p>{v4("statementPending")} {depCounts.pending + wdCounts.pending} · {v4("statementApproved")} {depCounts.approved + wdCounts.approved}</p>
        <p>{byCurrency([...deps, ...wds]).map((row) => `${row.currency} ${row.total}`).join(" · ") || "—"}</p>
        {show(deps.length) && <CashList title={v4("statementDeposits")} rows={deps} locale={locale} />}
        {show(wds.length) && <CashList title={v4("statementWithdrawals")} rows={wds} locale={locale} />}
        {show(positions.length) && (
          <div>
            <h3 className="c4-title">{v4("statementPositions")}</h3>
            <ul>{positions.map((row) => <li key={row.id}>{row.symbol || "—"} · {row.side || "—"} · {row.volume ?? "—"} · {row.status || "—"}</li>)}</ul>
          </div>
        )}
        <p>{v4("statementNotes")} {note.count}</p>
        {note.latest && <p>{v4("statementLatest")} {note.latest}</p>}
      </div>
      {msg && <p className="c4-muted c4-pad" role="status">{msg}</p>}
    </section>
  );
}

function CashList({ title, rows, locale }: { title: string; rows: Cash[]; locale: string }) {
  return (
    <div>
      <h3 className="c4-title">{title}</h3>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>{when(row.createdAt, locale)} · {money(row.amount, row.currency, locale)} · {row.status || "—"}</li>
        ))}
      </ul>
    </div>
  );
}

export function PayMethods({ rows, v4 }: { rows: { amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; method?: unknown }[]; v4: V4 }) {
  const [highFirst, setHighFirst] = useState(true);
  const prepared: MoneyLite[] = rows.map((row) => ({ ...row, method: methodName(row.method) }));
  const stats = methodStats(prepared);
  const shown = highFirst ? stats : [...stats].reverse();
  const top = stats[0]?.method || "";
  return (
    <section className="c4-pay-luxe" aria-label={v4("payMethods")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("payMethods")}</span><strong>{stats.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("payCount")}</span><strong>{stats.reduce((sum, row) => sum + row.count, 0)}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("payHint")}</p>
      <div className="c4-row c4-pad">
        <button type="button" className="c4-chip" data-on={highFirst ? "1" : "0"} onClick={() => setHighFirst((on) => !on)}>{v4("paySort")}</button>
      </div>
      {!shown.length && <p className="c4-empty-gold">{v4("payEmpty")}</p>}
      <ul className="c4-pay-list">
        {shown.map((row) => {
          const share = approvalShare(row.approved, row.count);
          return (
            <li key={row.method} className="c4-pay-card" data-top={row.method === top ? "1" : "0"}>
              <strong>{row.method}</strong>
              {row.method === top && <span className="c4-status" data-tone="ok">{v4("payLargest")}</span>}
              <span>{v4("payCount")} {row.count}</span>
              <span>{row.byCurrency.map((item) => `${item.currency} ${item.total}`).join(" · ") || "—"}</span>
              <span>{v4("payApproval")} {share == null ? "—" : `${share}%`}</span>
              <span>{v4("payPending")} {row.pending}</span>
              <span>{v4("payAge")} {row.avgAgeHours == null ? "—" : `${row.avgAgeHours}h`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
