"use client";

import Link from "next/link";
import { useState } from "react";
import { ledgerBody } from "@/lib/crmv2/payload";
import { crmv4Text } from "@/lib/crmv4/copy";
import { DeskBoard, TasksBoard } from "../round1";
import { crmv4Href } from "@/lib/crmv4/sections";
import { Bars, Card, Chip, Field, Kpi, Lab, Msg, Sheet, State, auditExport, downloadCsv, fmtNum, localeTag, money, sendJson, useJson, when, type Tx, type UserRow } from "../kit";

type Props = { base: string; tx: Tx; locale: string };

export default function Overview({ base, tx, locale }: Props) {
  const stats = useJson<{ kpis?: { users?: number; totalVolume?: number; pendingDeposits?: number; pendingBalanceRequests?: number; openPositions?: number } }>("/api/admin/stats");
  const finance = useJson<{ kpis?: { totalEquity?: number; totalBalance?: number; income?: number; outcome?: number; net?: number; floatingPnL?: number }; byType?: { type: string; amount: number; count: number }[] }>("/api/admin/analytics/finance");
  const report = useJson<{ report?: Record<string, number | string> }>("/api/admin/analytics/report");
  const users = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=8&meta=0&role=TRADER");
  const [sheet, setSheet] = useState<null | "add" | "transfer">(null);
  const [tab, setTab] = useState<"home" | "insights" | "desks">("home");
  const kpis = stats.data?.kpis;
  const pending = (kpis?.pendingDeposits || 0) + (kpis?.pendingBalanceRequests || 0);
  const aum = finance.data?.kpis?.totalEquity ?? finance.data?.kpis?.totalBalance;
  const r = report.data?.report || {};

  const mix = (finance.data?.byType || []).slice(0, 6).map((row) => ({ label: row.type, value: row.amount }));
  const banner = finance.data?.kpis?.income ?? aum;
  return (
    <div className="c4-stack">
      <section className="c4-banner">
        <div className="c4-banner-value">{money(banner, "USD", locale)}</div>
        <div className="c4-banner-label">{tx("income")}</div>
      </section>
      <div className="c4-row">
        <Chip on={tab === "home"} onClick={() => setTab("home")}>{tx("overview")}</Chip>
        <Chip on={tab === "insights"} onClick={() => setTab("insights")}>{tx("insights")}</Chip>
        <Chip on={tab === "desks"} onClick={() => setTab("desks")}>{crmv4Text(locale, "deskBoard")}</Chip>
      </div>
      <p className="c4-muted">{tx("overviewLead")}</p>
      <div className="c4-kpis">
        <Kpi tone="violet" label={tx("kpiCustomers")} value={fmtNum(kpis?.users, locale)} href={crmv4Href(base, "customers")} />
        <Kpi tone="cyan" label={tx("kpiAum")} value={money(aum, "USD", locale)} href={crmv4Href(base, "finance", { tab: "ledger" })} />
        <Kpi tone="amber" label={tx("kpiVolume")} value={fmtNum(kpis?.totalVolume, locale)} href={crmv4Href(base, "positions")} />
        <Kpi tone="emerald" label={tx("kpiPending")} value={fmtNum(pending, locale)} href={crmv4Href(base, "finance", { status: "PENDING" })} />
      </div>
      {tab === "insights" ? (
        <Insights tx={tx} locale={locale} finance={finance.data} report={r} />
      ) : tab === "desks" ? (
        <DeskBoard locale={locale} v4={(key) => crmv4Text(locale, key)} tx={tx} />
      ) : (
        <div className="c4-stack">
        <div className="c4-dash">
          <Card title={crmv4Text(locale, "mix")}>
            <Donut rows={mix} />
            <State loading={finance.loading} error={finance.error} empty={!finance.loading && mix.length === 0} tx={tx} onRetry={finance.reload} />
          </Card>
          <Card title={tx("chart")}>
            <Bars rows={mix} />
          </Card>
        </div>
        <MonthBoard locale={locale} />
        <TasksBoard locale={locale} v4={(key) => crmv4Text(locale, key)} tx={tx} />
        <div className="c4-split">
          <Card title={tx("recentCustomers")} extra={<Link href={crmv4Href(base, "customers")}>{tx("seeAll")}</Link>}>
            <State loading={users.loading} error={users.error} empty={!users.loading && !(users.data?.users || []).length} tx={tx} onRetry={users.reload} />
            <UserList base={base} rows={users.data?.users || []} tx={tx} locale={locale} />
          </Card>
          <div className="c4-stack">
            <Card title={tx("quick")}>
              <div className="c4-row" style={{ padding: 16 }}>
                <button type="button" className="c4-btn-hot c4-btn" onClick={() => setSheet("add")}>{tx("addCustomer")}</button>
                <button type="button" className="c4-btn" onClick={() => void exportPage(tx, users.data?.users || [])}>{tx("quickExport")}</button>
                <button type="button" className="c4-btn" onClick={() => setSheet("transfer")}>{tx("transfer")}</button>
                <Link href={crmv4Href(base, "marketing")} className="c4-btn">{tx("mailShortcut")}</Link>
              </div>
            </Card>
            <Card title={tx("alerts")}>
              <div style={{ padding: 16 }}>
                {stats.loading && <p className="c4-muted">{tx("loading")}</p>}
                {!stats.loading && pending === 0 && <p className="c4-muted">{tx("noAlerts")}</p>}
                {pending > 0 && (
                  <Link href={crmv4Href(base, "finance", { status: "PENDING" })} className="c4-status" data-tone="warn">
                    {tx("alertPending")}: {pending}
                  </Link>
                )}
              </div>
            </Card>
          </div>
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
    <div className="c4-stack">
      <div className="c4-kpis">
        <Kpi tone="violet" label={tx("income")} value={money(k.income, "USD", locale)} href="#" />
        <Kpi tone="cyan" label={tx("outcome")} value={money(k.outcome, "USD", locale)} href="#" />
        <Kpi tone="amber" label={tx("net")} value={money(k.net, "USD", locale)} href="#" />
        <Kpi tone="emerald" label={tx("floating")} value={money(k.floatingPnL, "USD", locale)} href="#" />
      </div>
      <Card title={tx("report")}>
        <div className="c4-form c4-form-2" style={{ padding: 16 }}>
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
            <li key={row.object} className="c4-row" style={{ justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <span>{row.object}</span>
              <span className="c4-muted">{tx("traders")} {row.traders || 0} · {tx("net")} {money(row.netDeposit, "USD", locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={tx("summary")} extra={<span className="c4-muted">{tx("equitySum")} {money(summary.data?.headline?.equity, "USD", locale)}</span>}>
        <State loading={summary.loading} error={summary.error} empty={!summary.loading && !(summary.data?.accounts || []).length} tx={tx} onRetry={summary.reload} />
        <div className="c4-desk">
          <table className="c4-table">
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
                  <td>{row.name}<div className="c4-muted">{row.email}</div></td>
                  <td>{money(row.balance, "USD", locale)}</td>
                  <td>{money(row.equity, "USD", locale)}</td>
                  <td>{money(row.margin, "USD", locale)}</td>
                  <td>{row.openPositions || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="c4-mob-list">
          {(summary.data?.accounts || []).slice(0, 12).map((row) => (
            <li key={row.email} style={{ padding: "8px 16px", borderTop: "1px solid var(--c4-line)" }}>
              <div>{row.name}</div>
              <div className="c4-muted">{money(row.balance, "USD", locale)} · {tx("openCount")} {row.openPositions || 0}</div>
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
      <div className="c4-desk">
        <table className="c4-table">
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
                  <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
                  <div className="c4-muted">{row.email}</div>
                </td>
                <td className="c4-muted">{when(row.createdAt, locale)}</td>
                <td>{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)}</td>
                <td>{row.active === false ? tx("frozen") : tx("active")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="c4-mob-list">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={crmv4Href(base, `customers/${row.id}`)} style={{ display: "block", padding: "8px 16px" }}>
              <div>{row.name || "—"}</div>
              <div className="c4-muted">{money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale)} · {row.active === false ? tx("frozen") : tx("active")}</div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

async function exportPage(tx: Tx, rows: UserRow[]) {
  const ok = await auditExport("customers-page", rows.length, "/crmv4");
  if (!ok) return;
  downloadCsv("customers.csv", ["name", "email", "balance", "active"], rows.map((row) => [String(row.name || ""), String(row.email || ""), String(row.balance ?? row.account?.balance ?? ""), row.active === false ? "frozen" : "active"]));
  void tx;
}

function AddCustomer({ tx, onClose, onDone }: { tx: Tx; onClose: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  return (
    <Sheet title={tx("addCustomerTitle")} onClose={onClose} closeLabel={tx("close")}>
      <form
        className="c4-form"
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
        <Lab label={tx("name")}><input name="name" required className="c4-field" /></Lab>
        <Lab label={tx("email")}><input name="email" type="email" required className="c4-field" /></Lab>
        <Lab label={tx("password")}><input name="password" type="password" required minLength={6} className="c4-field" /></Lab>
        <Msg text={err} />
        <button type="submit" className="c4-btn c4-btn-hot">{tx("save")}</button>
      </form>
    </Sheet>
  );
}

function TransferSheet({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const [err, setErr] = useState("");
  return (
    <Sheet title={tx("transfer")} onClose={onClose} closeLabel={tx("close")}>
      <form
        className="c4-form"
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
        <Lab label={tx("transferCustomer")}><input name="userId" required className="c4-field" /></Lab>
        <Lab label={`${tx("sourceAccount")} (${tx("optional")})`}>
          <input name="sourceUserId" className="c4-field" aria-required={false} />
        </Lab>
        <p className="c4-muted">{tx("optionalSource")}</p>
        <Lab label={tx("amount")}><input name="amount" inputMode="decimal" required className="c4-field" /></Lab>
        <Lab label={`${tx("comment")} (${tx("optional")})`}><input name="comment" className="c4-field" /></Lab>
        <Msg text={err} />
        <button type="submit" className="c4-btn c4-btn-hot">{tx("save")}</button>
      </form>
    </Sheet>
  );
}

const MIX_COLORS = ["#2c3e6b", "#3d6cb3", "#8a7a55", "#3ebeb0", "#6b5bd6", "#c4b8a6"];

function Donut({ rows }: { rows: { label: string; value: number }[] }) {
  if (!rows.length) return null;
  const total = rows.reduce((sum, row) => sum + Math.abs(row.value), 0) || 1;
  let cursor = 0;
  const stops = rows.map((row, index) => {
    const start = cursor;
    cursor += (Math.abs(row.value) / total) * 100;
    return `${MIX_COLORS[index % MIX_COLORS.length]} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <div className="c4-donut-wrap">
      <div className="c4-donut" style={{ background: `conic-gradient(${stops})` }} />
      <ul className="c4-legend">
        {rows.map((row, index) => (
          <li key={row.label}>
            <i className="c4-swatch" style={{ background: MIX_COLORS[index % MIX_COLORS.length] }} />
            <span>{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function dayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function MonthBoard({ locale }: { locale: string }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [picked, setPicked] = useState("");
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=200");
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const pad = first.getDay();
  const title = new Intl.DateTimeFormat(localeTag(locale), { month: "long", year: "numeric" }).format(first);
  const week = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(localeTag(locale), { weekday: "short" }).format(new Date(2026, 9, 4 + index)));
  const today = dayKey(new Date().toISOString());
  const items = data.data?.reminders || [];
  function iso(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const selected = items.filter((row) => dayKey(String(row.remindAt || "")) === picked);
  return (
    <Card title={title}>
      <div className="c4-cal-h">
        <button type="button" className="c4-btn c4-pill" aria-label={crmv4Text(locale, "monthPrev")} onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(new Date())}>{crmv4Text(locale, "today")}</button>
        <button type="button" className="c4-btn c4-pill" aria-label={crmv4Text(locale, "monthNext")} onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="c4-cal-grid">
        {week.map((label) => <div key={label} className="c4-cal-wd">{label}</div>)}
        {Array.from({ length: pad }, (_, index) => <div key={`pad-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const key = iso(index + 1);
          const hits = items.filter((row) => dayKey(String(row.remindAt || "")) === key);
          return (
            <button key={key} type="button" className="c4-cal-day" data-today={key === today ? "1" : "0"} data-on={picked === key ? "1" : "0"} data-has={hits.length ? "1" : "0"} onClick={() => setPicked(key)}>
              <span>{index + 1}</span>
              {hits[0]?.body && <em>{hits[0].body}</em>}
            </button>
          );
        })}
      </div>
      <div className="c4-pad">
        {picked && selected.length === 0 && <p className="c4-muted">{crmv4Text(locale, "noEvents")}</p>}
        {selected.map((row) => <p key={row.id}>{row.body}</p>)}
      </div>
    </Card>
  );
}
