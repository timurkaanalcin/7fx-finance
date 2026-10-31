"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { LIST_KEY, countList, readLists } from "@/lib/crmv3/lists";
import {
  amountGap,
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
} from "@/lib/crmv3/period";
import { crmv3Href } from "@/lib/crmv3/sections";
import { TASK_KEY, readTasks, toggleTask } from "@/lib/crmv3/table";
import { auditExport, downloadCsv, money, useJson, when } from "../kit";
import { useV3 } from "./store";

const PIN_KEY = "crmv3-list-pins";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  assigneeName?: string | null;
  createdAt?: string | null;
  retentionFollowUpAt?: string | null;
  documentsStatus?: string | null;
  saleStatus?: string | null;
  country?: string | null;
  ftd?: boolean | null;
};

type Stamp = MoneyStamp & { id: string; name?: string | null; status?: string | null; kind?: string | null };

function printReport() {
  const root = document.querySelector("[data-crmv3-root]");
  root?.setAttribute("data-print", "report");
  window.print();
  window.setTimeout(() => root?.removeAttribute("data-print"), 400);
}

async function saveCsv(kind: string, filename: string, header: string[], lines: string[][]) {
  const ok = await auditExport(kind, lines.length, "/crmv3/reports");
  if (!ok) return;
  downloadCsv(filename, header, lines);
}

export function PeriodCards({ locale, users, deposits, withdrawals, tickets }: {
  locale: string;
  users: { createdAt?: string | null }[];
  deposits: Stamp[];
  withdrawals: Stamp[];
  tickets: Stamp[];
}) {
  const v3 = useV3();
  const [kind, setKind] = useState<WindowKind>("week");
  const today = new Date().toISOString().slice(0, 10);
  const windows = compareWindows(today, kind);
  const regsNow = datedCount(users.map((row) => ({ at: row.createdAt })), windows.currentFrom, windows.currentTo);
  const regsThen = datedCount(users.map((row) => ({ at: row.createdAt })), windows.previousFrom, windows.previousTo);
  return (
    <section className="c3-period" aria-label={v3("rpWindow")} data-period={kind}>
      <h2 className="c3-title">{v3("rpWindow")}</h2>
      <p className="c3-muted">{v3("rpHint")}</p>
      <div className="c3-row c3-no-print">
        <button type="button" className="c3-chip" data-on={kind === "week" ? "1" : "0"} onClick={() => setKind("week")}>{v3("rpWeek")}</button>
        <button type="button" className="c3-chip" data-on={kind === "month" ? "1" : "0"} onClick={() => setKind("month")}>{v3("rpMonth")}</button>
        <button type="button" className="c3-btn" onClick={printReport}>{v3("reportsPrint")}</button>
      </div>
      <p className="c3-muted">{v3("rpWindow")} {windows.currentFrom} – {windows.currentTo}</p>
      <p className="c3-muted">{v3("rpPrevious")} {windows.previousFrom} – {windows.previousTo}</p>
      <p className="c3-muted">{v3("rpDiffHint")}</p>
      <article className="c3-period-card" data-report="registrations">
        <h3 className="c3-title">{v3("rpRegs")}</h3>
        <p className="c3-muted">{v3("rpRegsHint")}</p>
        <p>{v3("rpWindow")} {regsNow} · {v3("rpPrevious")} {regsThen} · {v3("reportsRows")} {users.length}</p>
      </article>
      <CompareCard title={v3("reportsDeposits")} rows={deposits} windows={windows} locale={locale} kind="deposits" filename="deposits.csv" />
      <CompareCard title={v3("reportsWithdrawals")} rows={withdrawals} windows={windows} locale={locale} kind="withdrawals" filename="withdrawals.csv" />
      <CompareCard title={v3("reportsTickets")} rows={tickets} windows={windows} locale={locale} kind="tickets" filename="tickets.csv" />
    </section>
  );
}

function CompareCard({ title, rows, windows, locale, kind, filename }: {
  title: string;
  rows: Stamp[];
  windows: ReturnType<typeof compareWindows>;
  locale: string;
  kind: string;
  filename: string;
}) {
  const v3 = useV3();
  const table = currencyCompare(rows, windows);
  const aside = leftOut(rows, windows);
  return (
    <article className="c3-period-card" data-report={kind}>
      <h3 className="c3-title">{title}</h3>
      <p className="c3-muted">{v3("reportsRows")} {rows.length}</p>
      {!table.length && <p className="c3-muted">{v3("rpEmpty")}</p>}
      <table className="c3-period-table">
        <thead>
          <tr>
            <th>{v3("rpCurrency")}</th>
            <th>{v3("rpNowCount")}</th>
            <th>{v3("rpNowAmount")}</th>
            <th>{v3("rpPrevCount")}</th>
            <th>{v3("rpPrevAmount")}</th>
            <th>{v3("rpDiff")}</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row) => (
            <tr key={row.currency}>
              <td data-label={v3("rpCurrency")}>{row.currency}</td>
              <td data-label={v3("rpNowCount")}>{row.currentCount}</td>
              <td data-label={v3("rpNowAmount")}>{money(row.currentAmount, row.currency, locale)}</td>
              <td data-label={v3("rpPrevCount")}>{row.previousCount}</td>
              <td data-label={v3("rpPrevAmount")}>{money(row.previousAmount, row.currency, locale)}</td>
              <td data-label={v3("rpDiff")}>{money(amountGap(row.currentAmount, row.previousAmount), row.currency, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="c3-muted">{v3("rpLeft")} · {v3("rpNoDate")} {aside.noDate} · {v3("rpOutside")} {aside.outside} · {v3("rpNoCurrency")} {aside.noCurrency}</p>
      <button type="button" className="c3-btn c3-no-print" onClick={() => void saveCsv(kind, filename, ["name", "amount", "currency", "status", "at"], rows.map((row) => [String(row.name || row.kind || ""), String(row.amount ?? ""), String(row.currency || ""), String(row.status || ""), String(row.at || "")]))}>{v3("reportsCsv")}</button>
    </article>
  );
}

export function DayDesk({ base, name, locale }: { base: string; name: string; locale: string }) {
  const v3 = useV3();
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
    <section className="c3-day" aria-label={v3("dayTitle")} data-day="">
      <h2 className="c3-title">{v3("dayTitle")}</h2>
      <p className="c3-muted">{v3("dayHint")}</p>
      <p className="c3-muted">{v3("dayName")} {name || "—"} · {v3("dayLoaded")} {users.length}</p>
      <article className="c3-day-card" data-day-block="assigned">
        <h3 className="c3-title">{v3("dayAssigned")} <span className="c3-count">{mine.length}</span></h3>
        {!mine.length && <p className="c3-muted">{v3("dayNone")}</p>}
        <ul>
          {mine.map((row) => (
            <li key={row.id}>
              <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.email || row.id}</Link>
              <span className="c3-muted">{row.saleStatus || "—"} · {row.country || "—"}</span>
            </li>
          ))}
        </ul>
      </article>
      <article className="c3-day-card" data-day-block="overdue">
        <h3 className="c3-title">{v3("dayOverdue")} <span className="c3-count">{late.length}</span></h3>
        {!late.length && <p className="c3-muted">{v3("dayNoOver")}</p>}
        <ul>
          {late.map((row) => (
            <li key={row.id}>
              <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || row.id}</Link>
              <span className="c3-muted">{v3("dayFollow")} {when(row.retentionFollowUpAt, locale)}</span>
            </li>
          ))}
        </ul>
      </article>
      <article className="c3-day-card" data-day-block="tasks">
        <h3 className="c3-title">{v3("dayTasks")} <span className="c3-count">{flat.length}</span></h3>
        {!flat.length && <p className="c3-muted">{v3("dayNoTasks")}</p>}
        <ul>
          {flat.map((task) => (
            <li key={`${task.customerId}-${task.id}`} data-done={task.done ? "1" : "0"}>
              <span>{task.text}</span>
              <span className="c3-muted">{names[task.customerId] || task.customerId} · {task.done ? v3("dayDone") : v3("dayOpen")}</span>
              <button type="button" className="c3-btn" onClick={() => {
                const next = toggleTask(tasks, task.customerId, task.id);
                setTasks(next);
                writeJson(TASK_KEY, next);
              }}>{task.done ? v3("dayOpen") : v3("dayDone")}</button>
            </li>
          ))}
        </ul>
      </article>
      <article className="c3-day-card" data-day-block="lists">
        <h3 className="c3-title">{v3("dayLists")}</h3>
        {!pins.length && <p className="c3-muted">{v3("dayNoLists")}</p>}
        <ul>
          {lists.map((list) => {
            const on = pins.includes(list.id);
            const count = countList(users, list.rules);
            return (
              <li key={list.id} data-pin={on ? "1" : "0"}>
                <Link href={crmv3Href(base, "customers", { list: list.id })}>{list.name}</Link>
                <span className="c3-muted">{v3("dayMatch")} {count}</span>
                <button type="button" className="c3-btn" onClick={() => {
                  const next = togglePin(pins, list.id);
                  setPins(next);
                  writeJson(PIN_KEY, next);
                }}>{on ? v3("dayUnpin") : v3("dayPin")}</button>
              </li>
            );
          })}
        </ul>
        {pins.filter((id) => !lists.some((list) => list.id === id)).map((id) => (
          <p key={id} className="c3-muted">{id} · {v3("dayMissing")}</p>
        ))}
      </article>
    </section>
  );
}
