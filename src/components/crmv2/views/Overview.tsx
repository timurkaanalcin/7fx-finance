"use client";

import Link from "next/link";
import { useState } from "react";
import { ledgerBody } from "@/lib/crmv2/payload";
import { crmv2Href } from "@/lib/crmv2/sections";
import { Bars, Card, Chip, Field, Kpi, Lab, Msg, Sheet, State, auditExport, downloadCsv, fmtNum, money, sendJson, useJson, when, type Tx, type UserRow } from "../kit";

type Props = { base: string; tx: Tx; locale: string };

export default function Overview({ base, tx, locale }: Props) {
  const stats = useJson<{ kpis?: { users?: number; totalVolume?: number; pendingDeposits?: number; pendingBalanceRequests?: number; openPositions?: number } }>("/api/admin/stats");
  const finance = useJson<{ kpis?: { totalEquity?: number; totalBalance?: number; income?: number; outcome?: number; net?: number; floatingPnL?: number }; byType?: { type: string; amount: number; count: number }[] }>("/api/admin/analytics/finance");
  const report = useJson<{ report?: Record<string, number | string> }>("/api/admin/analytics/report");
  const users = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=8&meta=0&role=TRADER");
  const [sheet, setSheet] = useState<null | "add" | "transfer">(null);
  const [tab, setTab] = useState<"home" | "insights">("home");
  const kpis = stats.data?.kpis;
  const pending = (kpis?.pendingDeposits || 0) + (kpis?.pendingBalanceRequests || 0);
  const aum = finance.data?.kpis?.totalEquity ?? finance.data?.kpis?.totalBalance;
  const r = report.data?.report || {};

  return (
    <div className="cv-stack">
      <div className="cv-row">
        <Chip on={tab === "home"} onClick={() => setTab("home")}>{tx("overview")}</Chip>
        <Chip on={tab === "insights"} onClick={() => setTab("insights")}>{tx("insights")}</Chip>
      </div>
      <p className="cv-muted">{tx("overviewLead")}</p>
      <div className="cv-kpis">
        <Kpi tone="violet" label={tx("kpiCustomers")} value={fmtNum(kpis?.users, locale)} href={crmv2Href(base, "customers")} />
        <Kpi tone="cyan" label={tx("kpiAum")} value={money(aum, "USD", locale)} href={crmv2Href(base, "finance", { tab: "ledger" })} />
        <Kpi tone="amber" label={tx("kpiVolume")} value={fmtNum(kpis?.totalVolume, locale)} href={crmv2Href(base, "positions")} />
        <Kpi tone="emerald" label={tx("kpiPending")} value={fmtNum(pending, locale)} href={crmv2Href(base, "finance", { status: "PENDING" })} />
      </div>
      {tab === "insights" ? (
        <Insights tx={tx} locale={locale} finance={finance.data} report={r} />
      ) : (
        <div className="cv-split">
          <Card title={tx("recentCustomers")} extra={<Link href={crmv2Href(base, "customers")}>{tx("seeAll")}</Link>}>
            <State loading={users.loading} error={users.error} empty={!users.loading && !(users.data?.users || []).length} tx={tx} onRetry={users.reload} />
            <UserList base={base} rows={users.data?.users || []} tx={tx} locale={locale} />
          </Card>
          <div className="cv-stack">
            <Card title={tx("quick")}>
              <div className="cv-row" style={{ padding: 16 }}>
                <button type="button" className="cv-btn-hot cv-btn" onClick={() => setSheet("add")}>{tx("addCustomer")}</button>
                <button type="button" className="cv-btn" onClick={() => void exportPage(tx, users.data?.users || [])}>{tx("quickExport")}</button>
                <button type="button" className="cv-btn" onClick={() => setSheet("transfer")}>{tx("transfer")}</button>
                <Link href={crmv2Href(base, "marketing")} className="cv-btn">{tx("mailShortcut")}</Link>
              </div>
            </Card>
            <Card title={tx("chart")}>
              <Bars rows={(finance.data?.byType || []).slice(0, 6).map((row) => ({ label: row.type, value: row.amount }))} />
              <State loading={finance.loading} error={finance.error} empty={!finance.loading && !(finance.data?.byType || []).length} tx={tx} onRetry={finance.reload} />
            </Card>
            <Card title={tx("alerts")}>
              <div style={{ padding: 16 }}>
                {stats.loading && <p className="cv-muted">{tx("loading")}</p>}
                {!stats.loading && pending === 0 && <p className="cv-muted">{tx("noAlerts")}</p>}
                {pending > 0 && (
                  <Link href={crmv2Href(base, "finance", { status: "PENDING" })} className="cv-status" data-tone="warn">
                    {tx("alertPending")}: {pending}
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
      {sheet === "add" && <AddCustomer tx={tx} onClose={() => setSheet(null)} onDone={users.reload} />}
      {sheet === "transfer" && <TransferSheet tx={tx} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Insights({ tx, locale, finance, report }: { tx: Tx; locale: string; finance: { kpis?: Record<string, number> } | null; report: Record<string, number | string> }) {
  const board = useJson<{ rows?: { object?: string; traders?: number; ftdCount?: number; depositAmount?: number; withdrawalAmount?: number; netDeposit?: number }[] }>("/api/admin/analytics/scoreboard");
  const summary = useJson<{ headline?: { balance?: number; equity?: number; margin?: number }; accounts?: { name?: string; email?: string; balance?: number; equity?: number; margin?: number; openPositions?: number }[] }>("/api/admin/summary");
  const k = finance?.kpis || {};
  return (
    <div className="cv-stack">
      <div className="cv-kpis">
        <Kpi tone="violet" label={tx("income")} value={money(k.income, "USD", locale)} href="#" />
        <Kpi tone="cyan" label={tx("outcome")} value={money(k.outcome, "USD", locale)} href="#" />
        <Kpi tone="amber" label={tx("net")} value={money(k.net, "USD", locale)} href="#" />
        <Kpi tone="emerald" label={tx("floating")} value={money(k.floatingPnL, "USD", locale)} href="#" />
      </div>
      <Card title={tx("report")}>
        <div className="cv-form cv-form-2" style={{ padding: 16 }}>
          <Field label={tx("depositsAmount")} value={money(report.depositsAmount, "USD", locale)} />
          <Field label={tx("withdrawalsAmount")} value={money(report.withdrawalsAmount, "USD", locale)} />
          <Field label={tx("activeTraders")} value={fmtNum(report.activeTraders, locale)} />
          <Field label={tx("frozenTraders")} value={fmtNum(report.frozenTraders, locale)} />
          <Field label={tx("openPositionsShort")} value={fmtNum(report.openPositions, locale)} />
          <Field label={tx("pendingDocs")} value={fmtNum(report.pendingDocs, locale)} />
          <Field label={tx("activeDesks")} value={fmtNum(report.activeDesks, locale)} />
          <Field label={tx("ftd")} value={fmtNum(report.ftdCount, locale)} />
        </div>
      </Card>
      <Card title={tx("scoreboard")}>
        <State loading={board.loading} error={board.error} empty={!board.loading && !(board.data?.rows || []).length} tx={tx} onRetry={board.reload} />
        <ul>
          {(board.data?.rows || []).map((row) => (
            <li key={row.object} className="cv-row" style={{ justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--cv-line)" }}>
              <span>{row.object}</span>
              <span className="cv-muted">{tx("traders")} {row.traders || 0} · {tx("net")} {money(row.netDeposit, "USD", locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={tx("summary")} extra={<span className="cv-muted">{tx("equitySum")} {money(summary.data?.headline?.equity, "USD", locale)}</span>}>
        <State loading={summary.loading} error={summary.error} empty={!summary.loading && !(summary.data?.accounts || []).length} tx={tx} onRetry={summary.reload} />
        <div className="cv-desk">
          <table className="cv-table">
            <thead>
              <tr>
                <th>{tx("customer")}</th>
                <th>{tx("accountBalance")}</th>
                <th>{tx("accountEquity")}</th>
                <th>{tx("accountMargin")}</th>
                <th>{tx("openCount")}</th>
              </tr>
            </thead>
            <tbody>
              {(summary.data?.accounts || []).slice(0, 12).map((row) => (
                <tr key={row.email}>
                  <td>{row.name}<div className="cv-muted">{row.email}</div></td>
                  <td>{money(row.balance, "USD", locale)}</td>
                  <td>{money(row.equity, "USD", locale)}</td>
                  <td>{money(row.margin, "USD", locale)}</td>
                  <td>{row.openPositions || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="cv-mob-list">
          {(summary.data?.accounts || []).slice(0, 12).map((row) => (
            <li key={row.email} style={{ padding: "12px 16px", borderTop: "1px solid var(--cv-line)" }}>
              <div>{row.name}</div>
              <div className="cv-muted">{money(row.balance, "USD", locale)} · {tx("openCount")} {row.openPositions || 0}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function UserList({ base, rows, tx, locale }: { base: string; rows: UserRow[]; tx: Tx; locale: string }) {
  if (!rows.length) return null;
  return (
    <>
      <div className="cv-desk">
        <table className="cv-table">
          <thead>
            <tr>
              <th>{tx("customer")}</th>
              <th>{tx("registered")}</th>
              <th>{tx("balance")}</th>
              <th>{tx("status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={crmv2Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                  <div className="cv-muted">{row.email}</div>
                </td>
                <td className="cv-muted">{when(row.createdAt, locale)}</td>
                <td>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</td>
                <td>{row.active === false ? tx("frozen") : tx("active")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="cv-mob-list md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={crmv2Href(base, `customers/${row.id}`)} style={{ display: "block", padding: "12px 16px" }}>
              <div>{row.name || "—"}</div>
              <div className="cv-muted">{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.active === false ? tx("frozen") : tx("active")}</div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

async function exportPage(tx: Tx, rows: UserRow[]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv2");
  if (!ok) return;
  downloadCsv("customers.csv", ["name", "email", "balance", "active"], rows.map((row) => [String(row.name || ""), String(row.email || ""), String(row.balance ?? row.account?.balance ?? ""), row.active === false ? "frozen" : "active"]));
  void tx;
}

function AddCustomer({ tx, onClose, onDone }: { tx: Tx; onClose: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  return (
    <Sheet title={tx("addCustomerTitle")} onClose={onClose} closeLabel={tx("close")}>
      <form
        className="cv-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const res = await sendJson("/api/admin/users", "POST", { name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: "TRADER" });
          if (!res.ok) {
            setErr(res.error || tx("failed"));
            return;
          }
          onDone();
          onClose();
        }}
      >
        <Lab label={tx("name")}><input name="name" required className="cv-field" /></Lab>
        <Lab label={tx("email")}><input name="email" type="email" required className="cv-field" /></Lab>
        <Lab label={tx("password")}><input name="password" type="password" required minLength={6} className="cv-field" /></Lab>
        <Msg text={err} />
        <button type="submit" className="cv-btn cv-btn-hot">{tx("save")}</button>
      </form>
    </Sheet>
  );
}

function TransferSheet({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const [err, setErr] = useState("");
  return (
    <Sheet title={tx("transfer")} onClose={onClose} closeLabel={tx("close")}>
      <form
        className="cv-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const userId = String(fd.get("userId") || "").trim();
          const res = await sendJson(`/api/admin/users/${encodeURIComponent(userId)}/records`, "POST", ledgerBody({
            type: "TRANSFER",
            amount: String(fd.get("amount") || ""),
            sourceUserId: String(fd.get("sourceUserId") || ""),
            comment: String(fd.get("comment") || ""),
          }));
          if (!res.ok) {
            setErr(res.error || tx("failed"));
            return;
          }
          onClose();
        }}
      >
        <Lab label={tx("transferCustomer")}><input name="userId" required className="cv-field" /></Lab>
        <Lab label={`${tx("sourceAccount")} (${tx("optional")})`}>
          <input name="sourceUserId" className="cv-field" aria-required={false} />
        </Lab>
        <p className="cv-muted">{tx("optionalSource")}</p>
        <Lab label={tx("amount")}><input name="amount" inputMode="decimal" required className="cv-field" /></Lab>
        <Lab label={`${tx("comment")} (${tx("optional")})`}><input name="comment" className="cv-field" /></Lab>
        <Msg text={err} />
        <button type="submit" className="cv-btn cv-btn-hot">{tx("save")}</button>
      </form>
    </Sheet>
  );
}
