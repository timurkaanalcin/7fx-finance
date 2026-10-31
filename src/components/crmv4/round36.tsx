"use client";

import { useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { methodName } from "@/lib/crmv4/round15";
import { filterLedger, sideSums, statusChoices, windowGap, type LedgerRow, type LedgerSide } from "@/lib/crmv4/round36";
import { money, State, Status, statusTone, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Cash = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  createdAt?: string | null;
  method?: unknown;
};

export function FinanceBook({ id, v4, locale, tx }: { id: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-ledger-luxe" aria-label={v4("ledgerTitle")} data-ledger="1">
      <h2 className="c4-title">{v4("ledgerTitle")}</h2>
      <p className="c4-muted">{v4("ledgerHint")}</p>
      <State loading={pack.loading} error={pack.error} empty={!pack.loading && !pack.error && loaded.length === 0} tx={tx} onRetry={pack.reload} hint={v4("ledgerEmpty")} />
      {!pack.loading && !pack.error && loaded.length > 0 && (
        <>
          <div className="c4-ledger-filters">
            <label className="c4-lab">
              <span>{v4("ledgerFrom")}</span>
              <input className="c4-field" type="date" aria-label={v4("ledgerFrom")} value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="c4-lab">
              <span>{v4("ledgerTo")}</span>
              <input className="c4-field" type="date" aria-label={v4("ledgerTo")} value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <div className="c4-line-filters" role="group" aria-label={v4("ledgerSide")}>
              {(["all", "deposit", "withdrawal"] as const).map((item) => (
                <button key={item} type="button" className="c4-chip" data-on={side === item ? "1" : "0"} onClick={() => setSide(item)}>
                  {v4(item === "all" ? "ledgerAll" : item === "deposit" ? "ledgerDeposits" : "ledgerWithdrawals")}
                </button>
              ))}
            </div>
            <label className="c4-lab">
              <span>{v4("ledgerStatus")}</span>
              <select className="c4-select" aria-label={v4("ledgerStatus")} value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">{v4("ledgerAny")}</option>
                {choices.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="c4-lab">
              <span>{v4("ledgerSearch")}</span>
              <input className="c4-field" aria-label={v4("ledgerSearch")} value={q} onChange={(event) => setQ(event.target.value)} />
            </label>
            <button type="button" className="c4-chip" data-on={newest ? "1" : "0"} onClick={() => setNewest((value) => !value)}>
              {newest ? v4("ledgerNewest") : v4("ledgerOldest")}
            </button>
          </div>
          <p className="c4-muted">{v4("ledgerRows")} · {rows.length}</p>
          <div className="c4-ledger-sums">
            <div>
              <h3 className="c4-title">{v4("ledgerDepSum")}</h3>
              {!deposits.length && <p>{v4("ledgerNone")}</p>}
              <ul>{deposits.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
            </div>
            <div>
              <h3 className="c4-title">{v4("ledgerWdSum")}</h3>
              {!withdrawals.length && <p>{v4("ledgerNone")}</p>}
              <ul>{withdrawals.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
            </div>
            <div>
              <h3 className="c4-title">{v4("ledgerGap")}</h3>
              <p className="c4-muted">{v4("ledgerGapHint")}</p>
              {!gap.length && <p>{v4("ledgerNone")}</p>}
              <ul>{gap.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)}</li>)}</ul>
            </div>
          </div>
          {!rows.length && <p className="c4-empty c4-empty-luxe c4-empty-card" role="status">{v4("ledgerEmpty")}</p>}
          <ul className="c4-ledger-rows">
            {rows.map((row) => (
              <li key={`${row.side}-${row.id}`}>
                <Status tone={statusTone(row.status)}>{row.status || "—"}</Status>
                <span>{v4(row.side === "deposit" ? "ledgerDeposits" : "ledgerWithdrawals")}</span>
                <strong>{money(row.amount, row.currency, locale)}</strong>
                <span>{methodName(row.method)}</span>
                <span className="c4-muted">{when(row.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
