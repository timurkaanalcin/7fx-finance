"use client";

import Link from "next/link";
import { useState } from "react";
import { ledgerBody } from "@/lib/crmv2/payload";
import { crmv3Href } from "@/lib/crmv3/sections";
import { Bars, Card, Chip, Field, Kpi, Lab, Msg, Sheet, State, auditExport, downloadCsv, fmtNum, money, sendJson, useJson, when, type Tx, type UserRow } from "../kit";
import { HomeDesk } from "../desk/panels";
import { RiskWatch, TeamBoard } from "../desk/later";
import { EntryQuality, emailOk } from "../desk/feed";
import { useV3 } from "../desk/store";

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
    <div className="c3-stack">
      <div className="c3-row">
        <Chip on={tab === "home"} onClick={() => setTab("home")}>{tx("overview")}</Chip>
        <Chip on={tab === "insights"} onClick={() => setTab("insights")}>{tx("insights")}</Chip>
      </div>
      <p className="c3-muted">{tx("overviewLead")}</p>
      <div className="c3-kpis">
        <Kpi tone="violet" label={tx("kpiCustomers")} value={fmtNum(kpis?.users, locale)} href={crmv3Href(base, "customers")} />
        <Kpi tone="cyan" label={tx("kpiAum")} value={money(aum, "USD", locale)} href={crmv3Href(base, "finance", { tab: "ledger" })} />
        <Kpi tone="amber" label={tx("kpiVolume")} value={fmtNum(kpis?.totalVolume, locale)} href={crmv3Href(base, "positions")} />
        <Kpi tone="emerald" label={tx("kpiPending")} value={fmtNum(pending, locale)} href={crmv3Href(base, "finance", { status: "PENDING" })} />
      </div>
      {tab === "insights" ? (
        <Insights tx={tx} locale={locale} finance={finance.data} report={r} />
      ) : (
        <div className="c3-split">
          <Card title={tx("recentCustomers")} extra={<Link href={crmv3Href(base, "customers")}>{tx("seeAll")}</Link>}>
            <State loading={users.loading} error={users.error} empty={!users.loading && !(users.data?.users || []).length} tx={tx} onRetry={users.reload} />
            <UserList base={base} rows={users.data?.users || []} tx={tx} locale={locale} />
          </Card>
          <div className="c3-stack">
            <Card title={tx("quick")}>
              <div className="c3-row" style={{ padding: 16 }}>
                <button type="button" className="c3-btn-hot c3-btn" onClick={() => setSheet("add")}>{tx("addCustomer")}</button>
                <button type="button" className="c3-btn" onClick={() => void exportPage(tx, users.data?.users || [])}>{tx("quickExport")}</button>
                <button type="button" className="c3-btn" onClick={() => setSheet("transfer")}>{tx("transfer")}</button>
                <Link href={crmv3Href(base, "marketing")} className="c3-btn">{tx("mailShortcut")}</Link>
              </div>
            </Card>
            <Card title={tx("chart")}>
              <Bars rows={(finance.data?.byType || []).slice(0, 6).map((row) => ({ label: row.type, value: row.amount }))} />
              <State loading={finance.loading} error={finance.error} empty={!finance.loading && !(finance.data?.byType || []).length} tx={tx} onRetry={finance.reload} />
            </Card>
            <Card title={tx("alerts")}>
              <div style={{ padding: 16 }}>
                {stats.loading && <p className="c3-muted">{tx("loading")}</p>}
                {!stats.loading && pending === 0 && <p className="c3-muted">{tx("noAlerts")}</p>}
                {pending > 0 && (
                  <Link href={crmv3Href(base, "finance", { status: "PENDING" })} className="c3-status" data-tone="warn">
                    {tx("alertPending")}: {pending}
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
      <HomeDesk base={base} locale={locale} />
      <RiskWatch base={base} />
      <TeamBoard base={base} />
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
    <div className="c3-stack">
      <div className="c3-kpis">
        <Kpi tone="violet" label={tx("income")} value={money(k.income, "USD", locale)} href="#" />
        <Kpi tone="cyan" label={tx("outcome")} value={money(k.outcome, "USD", locale)} href="#" />
        <Kpi tone="amber" label={tx("net")} value={money(k.net, "USD", locale)} href="#" />
        <Kpi tone="emerald" label={tx("floating")} value={money(k.floatingPnL, "USD", locale)} href="#" />
      </div>
      <Card title={tx("report")}>
        <div className="c3-form c3-form-2" style={{ padding: 16 }}>
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
            <li key={row.object} className="c3-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <span>{row.object}</span>
              <span className="c3-muted">{tx("traders")} {row.traders || 0} · {tx("net")} {money(row.netDeposit, "USD", locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={tx("summary")} extra={<span className="c3-muted">{tx("equitySum")} {money(summary.data?.headline?.equity, "USD", locale)}</span>}>
        <State loading={summary.loading} error={summary.error} empty={!summary.loading && !(summary.data?.accounts || []).length} tx={tx} onRetry={summary.reload} />
        <div className="c3-desk">
          <table className="c3-table">
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
                  <td>{row.name}<div className="c3-muted">{row.email}</div></td>
                  <td>{money(row.balance, "USD", locale)}</td>
                  <td>{money(row.equity, "USD", locale)}</td>
                  <td>{money(row.margin, "USD", locale)}</td>
                  <td>{row.openPositions || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="c3-mob-list">
          {(summary.data?.accounts || []).slice(0, 12).map((row) => (
            <li key={row.email} style={{ padding: "8px 16px", borderTop: "1px solid var(--c3-line)" }}>
              <div>{row.name}</div>
              <div className="c3-muted">{money(row.balance, "USD", locale)} · {tx("openCount")} {row.openPositions || 0}</div>
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
      <div className="c3-desk">
        <table className="c3-table">
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
                  <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                  <div className="c3-muted">{row.email}</div>
                </td>
                <td className="c3-muted">{when(row.createdAt, locale)}</td>
                <td>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</td>
                <td>{row.active === false ? tx("frozen") : tx("active")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="c3-mob-list">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={crmv3Href(base, `customers/${row.id}`)} style={{ display: "block", padding: "8px 16px" }}>
              <div>{row.name || "—"}</div>
              <div className="c3-muted">{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.active === false ? tx("frozen") : tx("active")}</div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

async function exportPage(tx: Tx, rows: UserRow[]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv3");
  if (!ok) return;
  downloadCsv("customers.csv", ["name", "email", "balance", "active"], rows.map((row) => [String(row.name || ""), String(row.email || ""), String(row.balance ?? row.account?.balance ?? ""), row.active === false ? "frozen" : "active"]));
  void tx;
}

function AddCustomer({ tx, onClose, onDone }: { tx: Tx; onClose: () => void; onDone: () => void }) {
  const v3 = useV3();
  const [err, setErr] = useState("");
  const [fields, setFields] = useState({ name: "", email: "", phone: "", country: "" });
  const [password, setPassword] = useState("");
  const dirty = Boolean(fields.name || fields.email || fields.phone || fields.country || password);
  function close() {
    if (dirty && !window.confirm(v3("discardEdit"))) return;
    onClose();
  }
  return (
    <Sheet title={tx("addCustomerTitle")} onClose={close} closeLabel={tx("close")}>
      <form
        className="c3-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (fields.email && !emailOk(fields.email)) {
            setErr(v3("emailCheck"));
            return;
          }
          const res = await sendJson("/api/admin/users", "POST", { name: fields.name, email: fields.email, password, role: "TRADER" });
          if (!res.ok) {
            setErr(res.error || tx("failed"));
            return;
          }
          onDone();
          onClose();
        }}
      >
        <EntryQuality fields={fields} password={password} />
        <p className="c3-muted">{v3("phoneNotPosted")}</p>
        <Lab label={tx("name")}><input name="name" required value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} className="c3-field" /></Lab>
        <Lab label={tx("email")}><input name="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} className="c3-field" /></Lab>
        <Lab label={tx("phone")}><input value={fields.phone} onChange={(event) => setFields({ ...fields, phone: event.target.value })} className="c3-field" aria-label={tx("phone")} /></Lab>
        <Lab label={tx("country")}><input value={fields.country} onChange={(event) => setFields({ ...fields, country: event.target.value })} className="c3-field" aria-label={tx("country")} /></Lab>
        <Lab label={tx("password")}><input name="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="c3-field" /></Lab>
        <p className="c3-muted">{v3("passwordStay")}</p>
        <Msg text={err} />
        <button type="submit" className="c3-btn c3-btn-hot">{tx("save")}</button>
      </form>
    </Sheet>
  );
}

function TransferSheet({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const [err, setErr] = useState("");
  return (
    <Sheet title={tx("transfer")} onClose={onClose} closeLabel={tx("close")}>
      <form
        className="c3-form"
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
        <Lab label={tx("transferCustomer")}><input name="userId" required className="c3-field" /></Lab>
        <Lab label={`${tx("sourceAccount")} (${tx("optional")})`}>
          <input name="sourceUserId" className="c3-field" aria-required={false} />
        </Lab>
        <p className="c3-muted">{tx("optionalSource")}</p>
        <Lab label={tx("amount")}><input name="amount" inputMode="decimal" required className="c3-field" /></Lab>
        <Lab label={`${tx("comment")} (${tx("optional")})`}><input name="comment" className="c3-field" /></Lab>
        <Msg text={err} />
        <button type="submit" className="c3-btn c3-btn-hot">{tx("save")}</button>
      </form>
    </Sheet>
  );
}
