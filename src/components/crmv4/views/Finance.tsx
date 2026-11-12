"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { exportCurrent } from "../round1";
import { MoneyTools } from "../round2";
import { MethodChart, WithdrawFlags } from "../round4";
import { BonusHistory } from "../round5";
import { CommissionCard, MoneyHistory, useQueueCursor } from "../round7";
import { Card, Chip, Lab, Pager, Sheet, State, Status, SwipeRow, TAKE, money, sendJson, statusTone, useJson, when, type Tx } from "../kit";
import { crmv4Text } from "@/lib/crmv4/copy";
import { DailyClose } from "../round11";
import { byAge, inBand, methodName } from "@/lib/crmv4/round15";
import { FinanceChrome, ReviewChecks, queueAgeHours, queueMarks, readLastReason, rememberReason, useSecondLook } from "../round15";
import { useListBar } from "../round19";
import { PayMethods } from "../round21";
import { rememberView } from "../round25";
import { crmv4Href } from "@/lib/crmv4/sections";

const FINANCE_COLS = ["amount", "method", "date", "status"];
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
  const [history, setHistory] = useState<MoneyRow | null>(null);
  const opened = useRef("");
  const [band, setBand] = useState<"" | "small" | "large">("");
  const [oldest, setOldest] = useState(false);
  const look = useSecondLook();
  const v4 = (key: Parameters<typeof crmv4Text>[1]) => crmv4Text(locale, key);
  const list = useListBar("finance", FINANCE_COLS, { amount: tx("amount"), method: tx("method"), date: tx("date"), status: tx("status") }, v4);
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

  const queue = useQueueCursor((tab === "ledger" ? [] : ((data.data?.requests as MoneyRow[]) || [])).filter((row) => row.status === "PENDING").length, (index) => {
    const pending = ((data.data?.requests as MoneyRow[]) || []).filter((row) => row.status === "PENDING");
    const row = pending[index];
    if (row) setSheet({ id: row.id, kind: tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT", action: "approve" });
  }, (index) => {
    const pending = ((data.data?.requests as MoneyRow[]) || []).filter((row) => row.status === "PENDING");
    const row = pending[index];
    if (row) setSheet({ id: row.id, kind: tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT", action: "reject" });
  });
  const openId = params.get("open") || "";
  const openMoney = useCallback((row: MoneyRow) => {
    setHistory(row);
    const financeTab = tab === "withdrawals" ? "withdrawals" : tab === "balance" ? "balance" : "deposits";
    const root = window.location.pathname.includes("/izcrm/crmv4") ? "/izcrm/crmv4" : "/crmv4";
    rememberView({
      kind: "finance",
      id: row.id,
      title: `${row.user?.name || row.id}${row.currency ? ` ${row.currency}` : ""}`,
      href: crmv4Href(root, "finance", { tab: financeTab, open: row.id }),
    });
  }, [tab]);
  useEffect(() => {
    if (!openId || opened.current === openId || tab === "ledger") return;
    const row = ((data.data?.requests as MoneyRow[]) || []).find((item) => item.id === openId);
    if (!row) return;
    opened.current = openId;
    openMoney(row);
  }, [openId, tab, data.data, openMoney]);
  const rows = tab === "ledger"
    ? ((data.data?.transactions as LedgerRow[]) || [])
    : ((data.data?.requests as MoneyRow[]) || []);
  const moneyRows = rows as MoneyRow[];
  const visible = tab === "ledger" ? moneyRows : byAge(moneyRows.filter((row) => inBand(Number(row.amount) || 0, band)), oldest);
  const marks = queueMarks(visible);

  return (
    <div className="c4-stack c4-fin-luxe c4-fin-atelier c4-fin-nave">
    <header className="c4-fin-atelier-mast c4-fin-nave-mast">
      <p className="c4-fin-atelier-mark c4-fin-nave-mark" data-logo="mono">7FX</p>
      <div>
        <p className="c4-fin-atelier-kicker c4-fin-nave-kicker">{tx("financeLead")}</p>
        <h2 className="c4-fin-atelier-title c4-fin-nave-title">{tx("finance")}</h2>
      </div>
      <ol className="c4-fin-nave-index" aria-label={tx("finance")}>
        <li data-tone="gold">{tx("deposits")}</li>
        <li data-tone="ink">{tx("withdrawals")}</li>
        <li data-tone="mist">{tx("ledger")}</li>
      </ol>
    </header>
    <DailyClose locale={locale} v4={(key) => crmv4Text(locale, key)} />
    <Card title={tx("finance")}>
      {tab !== "ledger" && (
        <FinanceChrome rows={visible} v4={v4} band={band} oldest={oldest} onBand={setBand} onOldest={() => setOldest((on) => !on)} />
      )}
      {tab !== "ledger" && <PayMethods rows={visible} v4={v4} />}
      <p className="c4-muted c4-pad">{crmv4Text(locale, "queueKeys")} j / k / a / r</p>
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
      {tab === "ledger" && <BonusHistory v4={(key) => crmv4Text(locale, key)} locale={locale} />}
      {tab !== "ledger" && <CommissionCard amount={(rows as MoneyRow[]).reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0)} v4={(key) => crmv4Text(locale, key)} locale={locale} />}
      <State loading={data.loading} error={data.error} empty={!data.loading && rows.length === 0} tx={tx} onRetry={data.reload} />
      {!data.loading && tab !== "ledger" && visible.length === 0 && <p className="c4-empty-gold">{v4("emptyQueue")}</p>}
      {tab === "ledger" ? <Ledger rows={rows as LedgerRow[]} tx={tx} locale={locale} /> : (
        <>
          {list.bar}
          <div className="c4-desk c4-table-wrap c4-list-sticky" data-dense={list.prefs.dense ? "1" : "0"} tabIndex={0} onKeyDown={queue.onKeyDown}>
            <table className="c4-table">
              <thead>
                <tr>
                  <th>{tx("customer")}</th>
                  {list.prefs.show("amount") && <th>{tx("amount")}</th>}
                  {list.prefs.show("method") && <th>{tx("method")}</th>}
                  {list.prefs.show("date") && <th>{tx("date")}</th>}
                  {list.prefs.show("status") && <th>{tx("status")}</th>}
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const kind = tab === "withdrawals" ? "WITHDRAW" : tab === "balance" ? "MARGIN" : "DEPOSIT";
                  const who = String(row.user?.email || row.user?.name || "");
                  const age = queueAgeHours(row.createdAt);
                  return (
                    <tr key={row.id} className="c4-fin-row" data-status={row.status || ""} data-top={marks.largest === row.id ? "1" : "0"} data-look={look.ids.includes(row.id) ? "1" : "0"}>
                      <td>
                        <button type="button" className="c4-btn" onClick={() => openMoney(row)}>{row.user?.name || "—"}</button>
                        {marks.dupes.has(who) && <span className="c4-status" data-tone="warn">{v4("sameCustomer")}</span>}
                        {marks.largest === row.id && row.status === "PENDING" && <span className="c4-status" data-tone="ok">{v4("largest")}</span>}
                        {age != null && <span className="c4-muted"> {v4("queueAge")} {age}h</span>}
                        <button type="button" className="c4-btn" onClick={() => void navigator.clipboard.writeText(String(row.amount ?? ""))}>{v4("copyAmount")}</button>
                        <button type="button" className="c4-chip" data-on={look.ids.includes(row.id) ? "1" : "0"} onClick={() => look.toggle(row.id)}>{v4("secondLook")}</button>
                        <ReviewChecks id={row.id} v4={v4} />
                      </td>
                      {list.prefs.show("amount") && <td>{money(row.amount, row.currency, locale)}</td>}
                      {list.prefs.show("method") && <td>{methodName(row.method as unknown)}</td>}
                      {list.prefs.show("date") && <td>{when(row.createdAt, locale)}</td>}
                      {list.prefs.show("status") && <td><Status tone={statusTone(row.status)}>{row.status}</Status></td>}
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
            {visible.map((row) => {
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
                      <div className="c4-muted">{money(row.amount, row.currency, locale)} · {when(row.createdAt, locale)} · {methodName(row.method as unknown)}</div>
                    </div>
                  </SwipeRow>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <Pager skip={skip} take={TAKE} hasMore={Boolean(data.data?.hasMore)} tx={tx} onPage={(next) => setQuery({ skip: next ? String(next) : "" })} />
      {history && (
        <section className="c4-fin-detail" aria-label={v4("reviewDetail")}>
          <h3 className="c4-title">{v4("reviewDetail")} · {history.user?.name || "—"}</h3>
          <p>{money(history.amount, history.currency, locale)} · {methodName(history.method as unknown)} · {v4("queueAge")} {queueAgeHours(history.createdAt) ?? "—"}h</p>
          <p className="c4-muted">{v4("lastReason")} {readLastReason() || "—"}</p>
          <ReviewChecks id={history.id} v4={v4} />
        </section>
      )}
      {history && <MoneyHistory row={history} tx={tx} v4={(key) => crmv4Text(locale, key)} locale={locale} onClose={() => setHistory(null)} />}
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
    </div>
  );
}

function ApproveForm({ tx, busy, onSubmit }: { tx: Tx; busy: boolean; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(readLastReason()); }, []);
  return (
    <form className="c4-form" onSubmit={(event) => { event.preventDefault(); rememberReason(reason); onSubmit(reason); }}>
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
