"use client";

import { useState } from "react";
import { methodName } from "@/lib/crmv3/bridge";
import { filterLedger, sideSums, statusChoices, windowGap, type LedgerRow, type LedgerSide } from "@/lib/crmv3/ledger";
import { money, Status, statusTone, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

type Cash = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  createdAt?: string | null;
  method?: unknown;
};

export function FinanceBook({ id, locale, tx }: { id: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const pack = useJson<{ deposits?: Cash[]; withdrawals?: Cash[] }>(
    `/api/admin/users/${encodeURIComponent(id)}?view=tickets&take=40`,
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [side, setSide] = useState<LedgerSide>("all");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [newest, setNewest] = useState(true);
  const loaded: LedgerRow[] = [
    ...(pack.data?.deposits || []).map((row) => ({ ...row, side: "deposit" as const })),
    ...(pack.data?.withdrawals || []).map((row) => ({ ...row, side: "withdrawal" as const })),
  ];
  const rows = filterLedger(loaded, { from, to, side, status, q, newest });
  const deposits = sideSums(rows, "deposit");
  const withdrawals = sideSums(rows, "withdrawal");
  const gap = windowGap(deposits, withdrawals);
  const choices = statusChoices(loaded);
  return (
    <section className="c3-ledger" aria-label={v3("ledgerTitle")} data-ledger="1">
      <h2 className="c3-title">{v3("ledgerTitle")}</h2>
      <p className="c3-muted">{v3("ledgerHint")}</p>
      {pack.loading && <LedgerSkeleton />}
      {!pack.loading && pack.error && (
        <div className="c3-error-card" role="alert" data-error="1">
          <p className="c3-title">{v3("errorTitle")}</p>
          <p className="c3-muted">{v3("errorHint")}</p>
          <button type="button" className="c3-btn" onClick={pack.reload}>{tx("retryLoad")}</button>
        </div>
      )}
      {!pack.loading && !pack.error && loaded.length === 0 && (
        <div className="c3-empty-card" role="status" data-empty="1">
          <p className="c3-title">{v3("emptyTitle")}</p>
          <p className="c3-muted">{v3("ledgerEmpty")}</p>
        </div>
      )}
      {!pack.loading && !pack.error && loaded.length > 0 && (
        <>
          <div className="c3-ledger-filters">
            <label className="c3-lab">
              <span>{v3("ledgerFrom")}</span>
              <input className="c3-field" type="date" aria-label={v3("ledgerFrom")} value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="c3-lab">
              <span>{v3("ledgerTo")}</span>
              <input className="c3-field" type="date" aria-label={v3("ledgerTo")} value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <div className="c3-tools" role="group" aria-label={v3("ledgerSide")}>
              {(["all", "deposit", "withdrawal"] as const).map((item) => (
                <button key={item} type="button" className="c3-chip" data-on={side === item ? "1" : "0"} onClick={() => setSide(item)}>
                  {v3(item === "all" ? "ledgerAll" : item === "deposit" ? "ledgerDeposits" : "ledgerWithdrawals")}
                </button>
              ))}
            </div>
            <label className="c3-lab">
              <span>{v3("ledgerStatus")}</span>
              <select className="c3-select" aria-label={v3("ledgerStatus")} value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">{v3("ledgerAny")}</option>
                {choices.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="c3-lab">
              <span>{v3("ledgerSearch")}</span>
              <input className="c3-field" aria-label={v3("ledgerSearch")} value={q} onChange={(event) => setQ(event.target.value)} />
            </label>
            <button type="button" className="c3-chip" data-on={newest ? "1" : "0"} onClick={() => setNewest((value) => !value)}>
              {newest ? v3("ledgerNewest") : v3("ledgerOldest")}
            </button>
          </div>
          <p className="c3-muted">{v3("ledgerRows")} · {rows.length}</p>
          <div className="c3-ledger-sums">
            <div>
              <h3 className="c3-title">{v3("ledgerDepSum")}</h3>
              {!deposits.length && <p className="c3-muted">{v3("ledgerNone")}</p>}
              <ul>{deposits.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
            </div>
            <div>
              <h3 className="c3-title">{v3("ledgerWdSum")}</h3>
              {!withdrawals.length && <p className="c3-muted">{v3("ledgerNone")}</p>}
              <ul>{withdrawals.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
            </div>
            <div>
              <h3 className="c3-title">{v3("ledgerGap")}</h3>
              <p className="c3-muted">{v3("ledgerGapHint")}</p>
              {!gap.length && <p className="c3-muted">{v3("ledgerNone")}</p>}
              <ul>{gap.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)}</li>)}</ul>
            </div>
          </div>
          {!rows.length && <p className="c3-empty-card" role="status">{v3("ledgerEmpty")}</p>}
          <ul className="c3-ledger-rows">
            {rows.map((row) => (
              <li key={`${row.side}-${row.id}`}>
                <Status tone={statusTone(row.status)}>{row.status || "—"}</Status>
                <span>{v3(row.side === "deposit" ? "ledgerDeposits" : "ledgerWithdrawals")}</span>
                <strong>{money(row.amount, row.currency, locale)}</strong>
                <span>{methodName(row.method)}</span>
                <span className="c3-muted">{when(row.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function LedgerSkeleton() {
  return (
    <div className="c3-skel-card" aria-busy="true" data-skel="1">
      <div className="c3-skel c3-skel-title" />
      <div className="c3-skel-row">
        <div className="c3-skel c3-skel-chip" />
        <div className="c3-skel c3-skel-chip" />
      </div>
      <div className="c3-skel" />
      <div className="c3-skel" />
      <div className="c3-skel c3-skel-short" />
    </div>
  );
}
