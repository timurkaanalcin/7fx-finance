"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { Card, Chip, Lab, Pager, Sheet, State, Status, SwipeRow, TAKE, money, sendJson, statusTone, useJson, when, type Tx } from "../kit";
import { FinanceChrome, ReviewChecks, methodName, queueMarks, readLastReason, rememberReason, rowAge, rowFlags, shapeQueue, useSecondLook, type FinanceRow } from "../desk/finance";
import { ListBar } from "../desk/later";
import { PayMethods } from "../desk/statement";
import { rememberView } from "../desk/goals";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "../desk/store";

type MoneyRow = FinanceRow & { method?: unknown; user?: { name?: string; email?: string; createdAt?: string | null } | null };
type LedgerRow = { id: string; amount?: number; type?: string; currency?: string; trader?: string; createdAt?: string; comment?: string };

export default function Finance({ base, tx, locale, q }: { base: string; tx: Tx; locale: string; q: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "deposits";
  const status = params.get("status") || "";
  const skip = Number(params.get("skip") || 0) || 0;
  const v3 = useV3();
  const [busy, setBusy] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | { id: string; kind: string; action: "approve" | "reject" }>(null);
  const [oldest, setOldest] = useState(false);
  const [band, setBand] = useState<"" | "small" | "large">("");
  const [picked, setPicked] = useState<string | null>(null);
  const [bulk, setBulk] = useState<string[]>([]);
  const look = useSecondLook();
  const openId = params.get("open") || "";
  const opened = useRef("");
  const finCols = ["name", "amount", "age", "status"];
  const [finShow, setFinShow] = useState(finCols);
  const endpoint = tab === "withdrawals" ? "/api/admin/withdrawals" : tab === "balance" ? "/api/admin/balance-requests" : tab === "ledger" ? "/api/admin/transactions" : "/api/admin/deposits";
  const url = tab === "ledger"
    ? `/api/admin/transactions?limit=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}`
    : `${endpoint}?take=${TAKE}&skip=${skip}&q=${encodeURIComponent(q)}${status ? `&status=${encodeURIComponent(status)}` : ""}`;
  const data = useJson<Record<string, unknown>>(url);
  const openMoney = useCallback((row: FinanceRow) => {
    setPicked(row.id);
    const financeTab = tab === "withdrawals" ? "withdrawals" : tab === "balance" ? "balance" : "deposits";
    rememberView({
      kind: "finance",
      id: row.id,
      title: `${row.user?.name || row.id}${row.currency ? ` ${row.currency}` : ""}`,
      href: crmv3Href(base, "finance", { tab: financeTab === "deposits" ? "" : financeTab, open: row.id }),
    });
  }, [base, tab]);
  useEffect(() => {
    if (!openId || opened.current === openId || tab === "ledger") return;
    const row = ((data.data?.requests as MoneyRow[]) || []).find((item) => item.id === openId);
    if (!row) return;
    opened.current = openId;
    openMoney(row);
  }, [openId, tab, data.data, openMoney]);

  function setQuery(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) p.set(key, value);
      else p.delete(key);
    }
    if (!("skip" in next)) p.delete("skip");
    router.replace(`?${p.toString()}`);
  }

  const raw = tab === "ledger"
    ? ((data.data?.transactions as LedgerRow[]) || [])
    : ((data.data?.requests as MoneyRow[]) || []);
  const rows = raw;
  const moneyRows = tab === "ledger" ? [] : shapeQueue(rows as MoneyRow[], oldest, band);
  const marks = queueMarks(moneyRows);

  return (
    <Card title={tx("finance")}>
      <p className="c3-muted" style={{ padding: "8px 16px 0" }}>{tx("financeLead")}</p>
      <div className="c3-tools">
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
      {tab !== "ledger" && <FinanceChrome rows={rows as MoneyRow[]} band={band} oldest={oldest} onBand={setBand} onOldest={() => setOldest((on) => !on)} />}
      {tab !== "ledger" && (
        <ListBar
          id="finance"
          defaults={finCols}
          onChange={(next) => setFinShow(next)}
          labels={{ name: tx("customer"), amount: tx("amount"), age: v3("queueAge"), status: tx("status") }}
        />
      )}
      {tab !== "ledger" && <p className="c3-muted c3-pad">{v3("rowsShowing")} {moneyRows.length}</p>}
      {tab !== "ledger" && <PayMethods rows={moneyRows} />}
      {tab !== "ledger" && (
        <div className="c3-tools">
          <button type="button" className="c3-btn" disabled={!bulk.length} onClick={() => void runBulk(bulk, tab, "approve", data.reload, setBulk)}>{v3("bulkApprove")}</button>
          <button type="button" className="c3-btn" disabled={!bulk.length} onClick={() => void runBulk(bulk, tab, "reject", data.reload, setBulk)}>{v3("bulkReject")}</button>
          <p className="c3-muted">{v3("reasonOptional")}</p>
        </div>
      )}
      <State loading={data.loading} error={data.error} empty={!data.loading && (tab === "ledger" ? rows.length === 0 : moneyRows.length === 0)} tx={tx} onRetry={data.reload} />
      {tab !== "ledger" && !data.loading && moneyRows.length === 0 && <p className="c3-muted c3-pad">{v3("financeEmpty")}</p>}
      {tab === "ledger" ? <Ledger rows={rows as LedgerRow[]} locale={locale} /> : (
        <ul>
          {moneyRows.map((row) => {
            const kind = tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT";
            const who = String(row.user?.email || row.user?.name || "");
            const age = rowAge(row);
            const flags = rowFlags(row);
            return (
              <li key={row.id} data-large={marks.largest === row.id ? "1" : "0"}>
                <SwipeRow
                  actions={row.status === "PENDING" ? [
                    { key: "ok", label: tx("approve"), tone: "ok", onClick: () => setSheet({ id: row.id, kind, action: "approve" }) },
                    { key: "no", label: tx("reject"), tone: "bad", onClick: () => setSheet({ id: row.id, kind, action: "reject" }) },
                  ] : []}
                >
                  <div className="c3-swipe-link">
                    <div className="c3-row c3-between">
                      <label className="c3-row">
                        <input type="checkbox" checked={bulk.includes(row.id)} onChange={() => setBulk(bulk.includes(row.id) ? bulk.filter((id) => id !== row.id) : [...bulk, row.id])} aria-label={row.user?.name || row.id} />
                        {finShow.includes("name") && <span>{row.user?.name || "—"}</span>}
                      </label>
                      {finShow.includes("status") && <Status tone={statusTone(row.status)}>{row.status}</Status>}
                    </div>
                    <div className="c3-muted">{finShow.includes("amount") ? money(row.amount, row.currency, locale) : ""} · {when(row.createdAt, locale)} · {methodName(row.method)}</div>
                    <div className="c3-row">
                      {marks.dupes.has(who) && <span className="c3-status" data-tone="warn">{v3("samePerson")}</span>}
                      {marks.largest === row.id && String(row.status || "").toUpperCase() === "PENDING" && <span className="c3-status" data-tone="info">{v3("largestPending")}</span>}
                      {age != null && age >= 24 && <span className="c3-status" data-tone="bad">{v3("lateMark")}</span>}
                      {finShow.includes("age") && <span className="c3-muted">{v3("queueAge")} {age ?? "—"}</span>}
                      {flags.includes("new") && <span className="c3-muted">{v3("flagNew")}</span>}
                      {flags.includes("kyc") && <span className="c3-muted">{v3("flagKyc")}</span>}
                      <button type="button" className="c3-btn" onClick={() => { void navigator.clipboard.writeText(String(row.amount ?? "")); }}>{v3("copyAmount")}</button>
                      <button type="button" className="c3-btn" onClick={() => { openMoney(row); setQuery({ open: row.id }); }}>{tx("open")}</button>
                      <button type="button" className="c3-btn" onClick={() => { look.toggle(row.id); setPicked(row.id); }}>{v3("secondLook")}</button>
                    </div>
                    {picked === row.id && (
                      <div>
                        <ReviewChecks id={row.id} />
                        <p className="c3-muted">{v3("checkLocal")} · {look.ids.includes(row.id) ? v3("secondLook") : ""}</p>
                      </div>
                    )}
                  </div>
                </SwipeRow>
              </li>
            );
          })}
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

async function runBulk(ids: string[], tab: string, action: "approve" | "reject", reload: () => void, clear: (ids: string[]) => void) {
  const kind = tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT";
  const reason = readLastReason();
  for (const id of ids) {
    const res = await sendJson(approvalEndpoint(kind), "POST", approvalBody(id, action, reason));
    if (!res.ok) return;
  }
  clear([]);
  reload();
}

function ApproveForm({ tx, busy, onSubmit }: { tx: Tx; busy: boolean; onSubmit: (reason: string) => void }) {
  const v3 = useV3();
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(readLastReason()); }, []);
  return (
    <form className="c3-form" onSubmit={(event) => { event.preventDefault(); rememberReason(reason); onSubmit(reason); }}>
      <Lab label={`${tx("reason")} (${tx("optional")})`}>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} aria-required={false} rows={3} className="c3-field" />
      </Lab>
      <p className="c3-muted">{tx("optionalReason")}</p>
      <p className="c3-muted">{v3("reasonLocal")}</p>
      <button type="button" className="c3-btn" onClick={() => { setReason(""); rememberReason(""); }}>{v3("clearReason")}</button>
      <button type="submit" disabled={busy} className="c3-btn c3-btn-hot">{busy ? tx("loading") : tx("save")}</button>
    </form>
  );
}

function Ledger({ rows, locale }: { rows: LedgerRow[]; locale: string }) {
  if (!rows.length) return null;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
          <div>
            <div>{row.trader || "—"} · {row.type}</div>
            <div className="c3-muted">{when(row.createdAt, locale)} {row.comment || ""}</div>
          </div>
          <span>{money(row.amount, row.currency, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
