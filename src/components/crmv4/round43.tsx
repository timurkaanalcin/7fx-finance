"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { TASK_KEY, readTasks, toggleTask } from "@/lib/crmv4/round34";
import { LIST_KEY, countList, readLists, type ListRow } from "@/lib/crmv4/round31";
import {
  assignedTo,
  compareWindows,
  currencyCompare,
  datedCount,
  flatTasks,
  leftOut,
  overdueFollows,
  readPins,
  togglePin,
  type MoneyStamp,
  type WindowKind,
} from "@/lib/crmv4/round43";
import { crmv4Href } from "@/lib/crmv4/sections";
import { auditExport, downloadCsv, money, useJson, when } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const PIN_KEY = "crmv4-list-pins";

type Person = ListRow & {
  id: string;
  name?: string | null;
  email?: string | null;
  desk?: string | null;
  assigneeName?: string | null;
  createdAt?: string | null;
  retentionFollowUpAt?: string | null;
  documentsStatus?: string | null;
  saleStatus?: string | null;
  country?: string | null;
  ftd?: boolean | null;
};

type Cash = { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; user?: { name?: string | null } | null };
type Ticket = { id: string; kind?: string | null; amount?: number | null; currency?: string | null; status?: string | null; customer?: string | null; openedAt?: string | null };

function printReport() {
  const root = document.querySelector("[data-crmv4-root]");
  root?.setAttribute("data-print", "report");
  window.print();
  window.setTimeout(() => root?.removeAttribute("data-print"), 400);
}

async function saveCsv(kind: string, filename: string, header: string[], lines: string[][]) {
  const ok = await auditExport(kind, lines.length, "/crmv4/reports");
  if (!ok) return;
  downloadCsv(filename, header, lines);
}

export function ReportDesk({ v4, locale }: { v4: V4; locale: string }) {
  const path = usePathname() || "";
  const root = path.includes("/izcrm/crmv4") ? "/izcrm/crmv4" : "/crmv4";
  const people = useJson<{ users?: Person[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?take=80");
  const tickets = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [kind, setKind] = useState<WindowKind>("week");
  const today = new Date().toISOString().slice(0, 10);
  const windows = compareWindows(today, kind);
  const users = people.data?.users || [];
  const depositRows = (deposits.data?.requests || []).map((row) => ({ amount: row.amount, currency: row.currency, at: row.createdAt, name: row.user?.name, status: row.status, id: row.id }));
  const withdrawalRows = (withdrawals.data?.requests || []).map((row) => ({ amount: row.amount, currency: row.currency, at: row.createdAt, name: row.user?.name, status: row.status, id: row.id }));
  const ticketRows = (tickets.data?.tickets || []).map((row) => ({ amount: row.amount, currency: row.currency, at: row.openedAt, name: row.customer, status: row.status, id: row.id, kind: row.kind }));
  const regsNow = datedCount(users.map((row) => ({ at: row.createdAt })), windows.currentFrom, windows.currentTo);
  const regsThen = datedCount(users.map((row) => ({ at: row.createdAt })), windows.previousFrom, windows.previousTo);
  const peak = Math.max(regsNow, regsThen, 1);
  const nowBar = Math.max(12, Math.round((regsNow / peak) * 96));
  const thenBar = Math.max(12, Math.round((regsThen / peak) * 96));
  return (
    <section className="c4-report-center c4-report-luxe c4-report-salon c4-report-pastry c4-report-chartroom" aria-label={v4("reportsTitle")} data-reports="1" data-period={kind} data-desk="chartroom">
      <header className="c4-report-chart-mast">
        <p className="c4-report-chart-seal" data-logo="mono">{v4("rptRoomMark")}</p>
        <div>
          <p className="c4-report-chart-kicker">{v4("rptRoomKicker")}</p>
          <h2 className="c4-title c4-report-chart-title">{v4("reportsTitle")}</h2>
          <p className="c4-report-chart-lead">{v4("rptRoomLead")}</p>
        </div>
        <ol className="c4-report-chart-index" aria-label={v4("reportsTitle")}>
          <li data-tone="gold">{v4("rpWeek")}</li>
          <li data-tone="ink">{v4("rpMonth")}</li>
          <li data-tone="ivory">{v4("reportsPrint")}</li>
        </ol>
      </header>
      <nav className="c4-report-chart-links" aria-label={v4("crsTitle")}>
        <Link href={crmv4Href(root, "crs")}>{v4("crsTitle")}</Link>
        <Link href={crmv4Href(root, "svr")}>{v4("svrTitle")}</Link>
      </nav>
      <ul className="c4-report-chart-kpis" aria-label={v4("rptRoomKicker")}>
        <li data-tone="gold"><span>{v4("rptRoomNow")}</span><strong>{regsNow}</strong></li>
        <li data-tone="ink"><span>{v4("rptRoomThen")}</span><strong>{regsThen}</strong></li>
        <li data-tone="ivory"><span>{v4("reportsCustomers")}</span><strong>{users.length}</strong></li>
        <li data-tone="mist"><span>{v4("reportsTickets")}</span><strong>{ticketRows.length}</strong></li>
      </ul>
      <div className="c4-report-chart-bars" aria-label={v4("rptRoomKicker")}>
        <div className="c4-report-chart-col" data-tone="now">
          <i style={{ height: nowBar }} />
          <span>{v4("rptRoomNow")}</span>
          <strong>{regsNow}</strong>
        </div>
        <div className="c4-report-chart-col" data-tone="then">
          <i style={{ height: thenBar }} />
          <span>{v4("rptRoomThen")}</span>
          <strong>{regsThen}</strong>
        </div>
      </div>
      <div className="c4-report-salon-tools c4-row c4-no-print">
        <button type="button" className="c4-chip" data-on={kind === "week" ? "1" : "0"} onClick={() => setKind("week")}>{v4("rpWeek")}</button>
        <button type="button" className="c4-chip" data-on={kind === "month" ? "1" : "0"} onClick={() => setKind("month")}>{v4("rpMonth")}</button>
        <button type="button" className="c4-btn" onClick={printReport}>{v4("reportsPrint")}</button>
      </div>
      <p className="c4-meta">{v4("rpWindow")} {windows.currentFrom} – {windows.currentTo}</p>
      <p className="c4-meta">{v4("rpPrevious")} {windows.previousFrom} – {windows.previousTo}</p>
      <p className="c4-meta">{v4("rpDiffHint")}</p>
      <article className="c4-report-card c4-report-salon-card c4-report-chart-card" data-report="registrations">
        <h3 className="c4-title">{v4("rpRegs")}</h3>
        <p className="c4-meta">{v4("rpRegsHint")}</p>
        <p>{v4("rpWindow")} {regsNow} · {v4("rpPrevious")} {regsThen} · {v4("reportsRows")} {users.length}</p>
      </article>
      <CompareCard title={v4("reportsDeposits")} rows={depositRows} windows={windows} locale={locale} v4={v4} kind="deposits" filename="deposits.csv" />
      <CompareCard title={v4("reportsWithdrawals")} rows={withdrawalRows} windows={windows} locale={locale} v4={v4} kind="withdrawals" filename="withdrawals.csv" />
      <CompareCard title={v4("reportsTickets")} rows={ticketRows} windows={windows} locale={locale} v4={v4} kind="tickets" filename="tickets.csv" />
    </section>
  );
}

function CompareCard({ title, rows, windows, locale, v4, kind, filename }: {
  title: string;
  rows: (MoneyStamp & { id: string; name?: string | null; status?: string | null; kind?: string | null })[];
  windows: ReturnType<typeof compareWindows>;
  locale: string;
  v4: V4;
  kind: string;
  filename: string;
}) {
  const table = currencyCompare(rows, windows);
  const aside = leftOut(rows, windows);
  return (
    <article className="c4-report-card c4-report-salon-card c4-report-chart-card" data-report={kind}>
      <h3 className="c4-title">{title}</h3>
      <p className="c4-meta">{v4("reportsRows")} {rows.length}</p>
      {!table.length && <p className="c4-meta c4-report-chart-empty">{v4("rptRoomEmpty")}</p>}
      <table className="c4-report-table c4-report-chart-table">
        <thead>
          <tr>
            <th>{v4("rpCurrency")}</th>
            <th>{v4("rpNowCount")}</th>
            <th>{v4("rpNowAmount")}</th>
            <th>{v4("rpPrevCount")}</th>
            <th>{v4("rpPrevAmount")}</th>
            <th>{v4("rpDiff")}</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row) => (
            <tr key={row.currency}>
              <td data-label={v4("rpCurrency")}>{row.currency}</td>
              <td data-label={v4("rpNowCount")}>{row.currentCount}</td>
              <td data-label={v4("rpNowAmount")}>{money(row.currentAmount, row.currency, locale)}</td>
              <td data-label={v4("rpPrevCount")}>{row.previousCount}</td>
              <td data-label={v4("rpPrevAmount")}>{money(row.previousAmount, row.currency, locale)}</td>
              <td data-label={v4("rpDiff")}>{money(Math.round((row.currentAmount - row.previousAmount) * 100) / 100, row.currency, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="c4-meta">{v4("rpLeft")} · {v4("rpNoDate")} {aside.noDate} · {v4("rpOutside")} {aside.outside} · {v4("rpNoCurrency")} {aside.noCurrency}</p>
      <button type="button" className="c4-btn c4-no-print" onClick={() => void saveCsv(kind, filename, ["name", "amount", "currency", "status", "at"], rows.map((row) => [String(row.name || row.kind || ""), String(row.amount ?? ""), String(row.currency || ""), String(row.status || ""), String(row.at || "")]))}>{v4("reportsCsv")}</button>
    </article>
  );
}

export function DayDesk({ base, name, v4, locale }: { base: string; name: string; v4: V4; locale: string }) {
  const people = useJson<{ users?: Person[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const [tasks, setTasks] = useState<ReturnType<typeof readTasks>>({});
  const [pins, setPins] = useState<string[]>([]);
  const [lists, setLists] = useState(readLists([]));
  useEffect(() => {
    setTasks(readTasks(readJson(TASK_KEY, {})));
    setPins(readPins(readJson(PIN_KEY, [])));
    setLists(readLists(readJson(LIST_KEY, [])));
  }, []);
  const today = new Date().toISOString().slice(0, 10);
  const users = people.data?.users || [];
  const mine = assignedTo(users, name);
  const late = overdueFollows(mine, today);
  const flat = flatTasks(tasks);
  const names: Record<string, string> = {};
  for (const row of users) names[row.id] = row.name || row.email || row.id;
  return (
    <section className="c4-day c4-day-oratory" aria-label={v4("dayTitle")} data-day="" data-desk="oratory">
      <header className="c4-day-oratory-mast">
        <p className="c4-day-oratory-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-day-oratory-kicker">{v4("daySub")}</p>
          <h2 className="c4-title c4-day-oratory-title">{v4("dayTitle")}</h2>
        </div>
        <ol className="c4-day-oratory-index" aria-label={v4("dayTitle")}>
          <li data-tone="gold">{v4("dayAssigned")}</li>
          <li data-tone="ink">{v4("dayOverdue")}</li>
          <li data-tone="ivory">{v4("dayTasks")}</li>
        </ol>
      </header>
      <p className="c4-day-oratory-links">
        <Link href={crmv4Href(base, "lnw")}>{v4("lnwTitle")}</Link>
        <Link href={crmv4Href(base, "hmk")}>{v4("hmkTitle")}</Link>
        <Link href={crmv4Href(base, "prefs")}>{v4("prefTitle")}</Link>
      </p>
      <p className="c4-meta c4-day-oratory-lead">{v4("dayHint")}</p>
      <p className="c4-meta">{v4("dayName")} {name || "—"} · {v4("dayLoaded")} {users.length}</p>
      <ul className="c4-day-oratory-kpis" aria-label={v4("dayTitle")}>
        <li data-tone="gold"><span>{v4("dayAssigned")}</span><strong>{mine.length}</strong></li>
        <li data-tone="late"><span>{v4("dayOverdue")}</span><strong>{late.length}</strong></li>
        <li data-tone="ink"><span>{v4("dayTasks")}</span><strong>{flat.length}</strong></li>
        <li data-tone="ivory"><span>{v4("dayLists")}</span><strong>{pins.length}</strong></li>
      </ul>
      <article className="c4-day-card c4-day-oratory-card" data-day-block="assigned">
        <h3 className="c4-title">{v4("dayAssigned")} <span className="c4-count">{mine.length}</span></h3>
        {!mine.length && <p className="c4-meta c4-day-oratory-empty">{v4("dayNone")}</p>}
        <ul>
          {mine.map((row) => (
            <li key={row.id}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.email || row.id}</Link>
              <span className="c4-meta">{row.saleStatus || "—"} · {row.country || "—"}</span>
            </li>
          ))}
        </ul>
      </article>
      <article className="c4-day-card c4-day-oratory-card" data-day-block="overdue">
        <h3 className="c4-title">{v4("dayOverdue")} <span className="c4-count">{late.length}</span></h3>
        {!late.length && <p className="c4-meta c4-day-oratory-empty">{v4("dayNoOver")}</p>}
        <ul>
          {late.map((row) => (
            <li key={row.id}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || row.id}</Link>
              <span className="c4-meta">{v4("dayFollow")} {when(row.retentionFollowUpAt, locale)}</span>
            </li>
          ))}
        </ul>
      </article>
      <article className="c4-day-card c4-day-oratory-card" data-day-block="tasks">
        <h3 className="c4-title">{v4("dayTasks")} <span className="c4-count">{flat.length}</span></h3>
        {!flat.length && <p className="c4-meta c4-day-oratory-empty">{v4("dayNoTasks")}</p>}
        <ul>
          {flat.map((task) => (
            <li key={`${task.customerId}-${task.id}`} data-done={task.done ? "1" : "0"}>
              <span>{task.text}</span>
              <span className="c4-meta">{names[task.customerId] || task.customerId} · {task.done ? v4("dayDone") : v4("dayOpen")}</span>
              <button type="button" className="c4-btn" onClick={() => {
                const next = toggleTask(tasks, task.customerId, task.id);
                setTasks(next);
                writeJson(TASK_KEY, next);
              }}>{task.done ? v4("dayOpen") : v4("dayDone")}</button>
            </li>
          ))}
        </ul>
      </article>
      <article className="c4-day-card c4-day-oratory-card" data-day-block="lists">
        <h3 className="c4-title">{v4("dayLists")}</h3>
        {!pins.length && <p className="c4-meta c4-day-oratory-empty">{v4("dayNoLists")}</p>}
        <ul>
          {lists.map((list) => {
            const on = pins.includes(list.id);
            const count = countList(users, list.rules);
            return (
              <li key={list.id} data-pin={on ? "1" : "0"}>
                <Link href={crmv4Href(base, "customers", { list: list.id })}>{list.name}</Link>
                <span className="c4-meta">{v4("dayMatch")} {count}</span>
                <button type="button" className="c4-btn" onClick={() => {
                  const next = togglePin(pins, list.id);
                  setPins(next);
                  writeJson(PIN_KEY, next);
                }}>{on ? v4("dayUnpin") : v4("dayPin")}</button>
              </li>
            );
          })}
        </ul>
        {pins.filter((id) => !lists.some((list) => list.id === id)).map((id) => (
          <p key={id} className="c4-meta">{id} · {v4("dayMissing")}</p>
        ))}
      </article>
    </section>
  );
}
