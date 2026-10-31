"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { Card, Chip, Lab, Pager, Sheet, State, Status, TAKE, money, sendJson, statusTone, useJson, when, type Tx } from "../kit";

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
      <p className="cv-muted" style={{ padding: "12px 16px 0" }}>{tx("financeLead")}</p>
      <div className="cv-tools">
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
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      {tab === "ledger" ? <Ledger rows={rows as LedgerRow[]} locale={locale} /> : (
        <ul>
          {(rows as MoneyRow[]).map((row) => (
            <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--cv-line)" }}>
              <div>
                <div>{row.user?.name || "—"}</div>
                <div className="cv-muted">{money(row.amount, row.currency, locale)} · {when(row.createdAt, locale)} · {row.method || ""}</div>
              </div>
              <div className="cv-row">
                <Status tone={statusTone(row.status)}>{row.status}</Status>
                {row.status === "PENDING" && (
                  <>
                    <button type="button" className="cv-btn" disabled={busy === row.id} onClick={() => setSheet({ id: row.id, kind: tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT", action: "approve" })}>{tx("approve")}</button>
                    <button type="button" className="cv-btn" disabled={busy === row.id} onClick={() => setSheet({ id: row.id, kind: tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT", action: "reject" })}>{tx("reject")}</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
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
    <form className="cv-form" onSubmit={(event) => { event.preventDefault(); onSubmit(reason); }}>
      <Lab label={`${tx("reason")} (${tx("optional")})`}>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} aria-required={false} rows={3} className="cv-field" />
      </Lab>
      <p className="cv-muted">{tx("optionalReason")}</p>
      <button type="submit" disabled={busy} className="cv-btn cv-btn-hot">{busy ? tx("loading") : tx("save")}</button>
    </form>
  );
}

function Ledger({ rows, locale }: { rows: LedgerRow[]; locale: string }) {
  if (!rows.length) return null;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id} className="cv-row" style={{ justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--cv-line)" }}>
          <div>
            <div>{row.trader || "—"} · {row.type}</div>
            <div className="cv-muted">{when(row.createdAt, locale)} {row.comment || ""}</div>
          </div>
          <span>{money(row.amount, row.currency, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
