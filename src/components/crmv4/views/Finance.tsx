"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { exportCurrent } from "../round1";
import { MoneyTools } from "../round2";
import { MethodChart, WithdrawFlags } from "../round4";
import { Card, Chip, Lab, Pager, Sheet, State, Status, SwipeRow, TAKE, money, sendJson, statusTone, useJson, when, type Tx } from "../kit";
import { crmv4Text } from "@/lib/crmv4/copy";

type MoneyRow = { id: string; amount?: number; currency?: string; status?: string; createdAt?: string; method?: string; user?: { name?: string; email?: string } };
type LedgerRow = { id: string; amount?: number; type?: string; currency?: string; trader?: string; createdAt?: string; comment?: string };

export default function Finance({ tx, locale, q }: { tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "deposits";
  const status = params.get("status") || "";
  const skip = Number(params.get("skip") || 0) || 0;
  const [busy, setBusy] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | { id: string; kind: string; action: "approve" | "reject" }>(null);
  const endpoint = tab === "withdrawals" ? "/api/admin/withdrawals" : tab === "balance" ? "/api/admin/balance-requests" : tab === "ledger" ? "/api/admin/transactions" : "/api/admin/deposits";
  const url = tab === "ledger"
    ? `/api/admin/transactions?limit=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}`
    : `${endpoint}?take=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}${status ? `&status=${encodeURIComponent(status)}` : ""}`;
  const data = useJson<Record<string, unknown>>(url);

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }

  const rows = tab === "ledger"
    ? ((data.data?.transactions as LedgerRow[]) || [])
    : ((data.data?.requests as MoneyRow[]) || []);

  return (
    <Card title={tx("finance")}>
      <p className="c4-muted" style={{ padding: "8px 16px 0" }}>{tx("financeLead")}</p>
      <div className="c4-tools">
        {(["deposits", "withdrawals", "balance", "ledger"] as const).map((item) => (
          <Chip key={item} on={tab === item || (item === "deposits" && !params.get("tab"))} onClick={() => setQuery({ tab: item === "deposits" ? "" : item })}>
            {tx(item === "balance" ? "balanceRequests" : item)}
          </Chip>
        ))}
        {tab !== "ledger" && (["", "PENDING", "APPROVED", "REJECTED"] as const).map((item) => (
          <Chip key={item || "all"} on={status === item} onClick={() => setQuery({ status: item })}>
            {tx(item === "" ? "all" : item === "PENDING" ? "pendingTab" : item === "APPROVED" ? "approved" : "rejected")}
          </Chip>
        ))}
      </div>
      <div className="c4-tools">
        <button type="button" className="c4-btn" onClick={() => void exportCurrent("finance-page", "finance.csv", ["name", "amount", "status", "type"], (rows as MoneyRow[]).map((row) => [String(row.user?.name || (row as unknown as LedgerRow).trader || ""), String(row.amount ?? ""), String(row.status || (row as unknown as LedgerRow).type || ""), String((row as unknown as LedgerRow).type || "")]))}>{crmv4Text(locale, "exportCsv")}</button>
      </div>
      {tab !== "ledger" && (
        <MoneyTools rows={rows as MoneyRow[]} kind={tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT"} tx={tx} v4={(key) => crmv4Text(locale, key)} locale={locale} onDone={data.reload} />
      )}
      {(tab === "deposits" || !params.get("tab")) && tab !== "withdrawals" && tab !== "balance" && tab !== "ledger" && (
        <MethodChart rows={rows as MoneyRow[]} v4={(key) => crmv4Text(locale, key)} locale={locale} />
      )}
      {tab === "withdrawals" && <WithdrawFlags v4={(key) => crmv4Text(locale, key)} />}
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      {tab === "ledger" ? <Ledger rows={rows as LedgerRow[]} tx={tx} locale={locale} /> : (
        <>
          <div className="c4-desk c4-table-wrap">
            <table className="c4-table">
              <thead>
                <tr>
                  <th>{tx("customer")}</th>
                  <th>{tx("amount")}</th>
                  <th>{tx("method")}</th>
                  <th>{tx("date")}</th>
                  <th>{tx("status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(rows as MoneyRow[]).map((row) => {
                  const kind = tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT";
                  return (
                    <tr key={row.id}>
                      <td>{row.user?.name || "—"}</td>
                      <td>{money(row.amount, row.currency, locale)}</td>
                      <td>{row.method || "—"}</td>
                      <td>{when(row.createdAt, locale)}</td>
                      <td><Status tone={statusTone(row.status)}>{row.status}</Status></td>
                      <td>
                        {row.status === "PENDING" && (
                          <div className="c4-row">
                            <button type="button" className="c4-btn" data-tone="ok" onClick={() => setSheet({ id: row.id, kind, action: "approve" })}>{tx("approve")}</button>
                            <button type="button" className="c4-btn c4-btn-coral" onClick={() => setSheet({ id: row.id, kind, action: "reject" })}>{tx("reject")}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="c4-mob-list">
            {(rows as MoneyRow[]).map((row) => {
              const kind = tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT";
              return (
                <li key={row.id}>
                  <SwipeRow
                    actions={row.status === "PENDING" ? [
                      { key: "ok", label: tx("approve"), tone: "ok", onClick: () => setSheet({ id: row.id, kind, action: "approve" }) },
                      { key: "no", label: tx("reject"), tone: "bad", onClick: () => setSheet({ id: row.id, kind, action: "reject" }) },
                    ] : []}
                  >
                    <div className="c4-swipe-link">
                      <div className="c4-row c4-between">
                        <span>{row.user?.name || "—"}</span>
                        <Status tone={statusTone(row.status)}>{row.status}</Status>
                      </div>
                      <div className="c4-muted">{money(row.amount, row.currency, locale)} · {when(row.createdAt, locale)} · {row.method || ""}</div>
                    </div>
                  </SwipeRow>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      {sheet && (
        <Sheet title={sheet.action === "approve" ? tx("approve") : tx("reject")} onClose={() => setSheet(null)} closeLabel={tx("close")}>
          <ApproveForm
            tx={tx}
            busy={busy === sheet.id}
            onSubmit={async (reason) => {
              setBusy(sheet.id);
              const res = await sendJson(approvalEndpoint(sheet.kind), "POST", approvalBody(sheet.id, sheet.action, reason));
              setBusy(null);
              if (res.ok) {
                setSheet(null);
                data.reload();
              }
            }}
          />
        </Sheet>
      )}
    </Card>
  );
}

function ApproveForm({ tx, busy, onSubmit }: { tx: Tx; busy: boolean; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <form className="c4-form" onSubmit={(event) => { event.preventDefault(); onSubmit(reason); }}>
      <Lab label={`${tx("reason")} (${tx("optional")})`}>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} aria-required={false} rows={3} className="c4-field" />
      </Lab>
      <p className="c4-muted">{tx("optionalReason")}</p>
      <button type="submit" disabled={busy} className="c4-btn c4-btn-hot">{busy ? tx("loading") : tx("save")}</button>
    </form>
  );
}

function Ledger({ rows, tx, locale }: { rows: LedgerRow[]; tx: Tx; locale: string }) {
  if (!rows.length) return null;
  return (
    <>
    <div className="c4-desk c4-table-wrap">
      <table className="c4-table">
        <thead>
          <tr>
            <th>{tx("customer")}</th>
            <th>{tx("type")}</th>
            <th>{tx("amount")}</th>
            <th>{tx("date")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.trader || "—"}</td>
              <td>{row.type}</td>
              <td>{money(row.amount, row.currency, locale)}</td>
              <td>{when(row.createdAt, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <ul className="c4-mob-list">
      {rows.map((row) => (
        <li key={row.id} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
          <div>
            <div>{row.trader || "—"} · {row.type}</div>
            <div className="c4-muted">{when(row.createdAt, locale)} {row.comment || ""}</div>
          </div>
          <span>{money(row.amount, row.currency, locale)}</span>
        </li>
      ))}
    </ul>
    </>
  );
}
