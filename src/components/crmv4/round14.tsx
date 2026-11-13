"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ageHours,
  changedKeys,
  deskRanks,
  dueToday,
  isDormant,
  loginBucket,
  nextRecur,
  simulateAssign,
  slaLeft,
  snoozeUntil,
  type AssignRule,
  type RecurEvery,
} from "@/lib/crmv4/round14";
import { slaLimit } from "./round1";
import { downloadCsv, money, sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const RECUR_KEY = "crmv4-recur";
const TEMPLATE_KEY = "crmv4-task-templates";
const RULE_KEY = "crmv4-assign-rules";

type Reminder = { id: string; body?: string; remindAt?: string };

export function ViewerHint({ v4 }: { v4: V4 }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(document.querySelector("[data-crmv4-root]")?.getAttribute("data-role") === "viewer");
  }, []);
  if (!on) return null;
  return <p className="c4-viewer-hint" role="status">{v4("viewerHint")}</p>;
}

export function TaskDesk({ locale, v4, tx }: { locale: string; v4: V4; tx: Tx }) {
  const data = useJson<{ reminders?: Reminder[] }>("/api/admin/calendar?take=80");
  const rows = data.data?.reminders || [];
  const [dueOnly, setDueOnly] = useState(false);
  const [templates, setTemplates] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [recur, setRecur] = useState<{ id: string; body: string; every: RecurEvery; hour: number }[]>([]);
  const [every, setEvery] = useState<RecurEvery>("day");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    setTemplates(readJson(TEMPLATE_KEY, []));
    setRecur(readJson(RECUR_KEY, []));
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "d" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const root = document.getElementById("c4-tasks");
      if (!root || !root.contains(event.target as Node)) return;
      setDueOnly((on) => !on);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const today = dueToday(rows);
  const shown = dueOnly ? rows.filter((row) => String(row.remindAt || "").slice(0, 10) === new Date().toISOString().slice(0, 10)) : rows;
  async function create(text: string, remindAt: string) {
    const res = await sendJson("/api/admin/calendar", "POST", { body: text, remindAt });
    setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
    if (res.ok) data.reload();
  }
  async function snooze(row: Reminder, preset: "15m" | "tomorrow") {
    await sendJson("/api/admin/calendar", "POST", { body: row.body || v4("dueToday"), remindAt: snoozeUntil(preset) });
    await sendJson("/api/admin/calendar", "POST", { action: "delete", id: row.id });
    data.reload();
  }
  return (
    <section className="c4-task-desk c4-task-atelier" id="c4-tasks" aria-label={v4("dueToday")} data-atelier="1">
      <header className="c4-task-atelier-mast">
        <p className="c4-task-atelier-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-task-atelier-kicker">{v4("tskAtelierKicker")}</p>
          <h3 className="c4-title">{v4("dueToday")}</h3>
        </div>
        <strong className="c4-task-atelier-count" aria-live="polite">{today}</strong>
      </header>
      <p className="c4-task-atelier-lead">{v4("tskAtelierLead")}</p>
      <ol className="c4-task-atelier-index" aria-label={v4("dueToday")}>
        <li data-tone="gold">{v4("dueToday")}</li>
        <li data-tone="ink">{v4("snooze15")}</li>
        <li data-tone="ivory">{v4("recur")}</li>
      </ol>
      <div className="c4-task-hero">
        <button type="button" className="c4-chip" data-on={dueOnly ? "1" : "0"} onClick={() => setDueOnly((on) => !on)}>{v4("dueToday")}</button>
      </div>
      <ViewerHint v4={v4} />
      <p className="c4-muted c4-pad">{v4("taskKeys")} · d · {v4("dueToday")}</p>
      <form className="c4-row c4-pad c4-task-atelier-form" onSubmit={(event) => {
        event.preventDefault();
        const name = body.trim();
        if (!name) return;
        const next = [name, ...templates.filter((item) => item !== name)].slice(0, 8);
        setTemplates(next);
        writeJson(TEMPLATE_KEY, next);
        setBody("");
      }}>
        <input className="c4-field" aria-label={v4("taskTemplate")} value={body} onChange={(event) => setBody(event.target.value)} />
        <button type="submit" className="c4-btn">{v4("taskTemplate")}</button>
      </form>
      <div className="c4-row c4-pad">
        {templates.map((item) => (
          <button key={item} type="button" className="c4-chip" onClick={() => void create(item, new Date(Date.now() + 60 * 60 * 1000).toISOString())}>{item}</button>
        ))}
      </div>
      <form className="c4-row c4-pad c4-task-atelier-form" onSubmit={(event) => {
        event.preventDefault();
        const text = body.trim() || v4("recur");
        const next = [...recur, { id: String(Date.now()), body: text, every, hour: 9 }];
        setRecur(next);
        writeJson(RECUR_KEY, next);
      }}>
        <select className="c4-select" aria-label={v4("recur")} value={every} onChange={(event) => setEvery(event.target.value as RecurEvery)}>
          <option value="day">day</option>
          <option value="week">week</option>
        </select>
        <button type="submit" className="c4-btn">{v4("recur")}</button>
      </form>
      {recur.map((rule) => (
        <div key={rule.id} className="c4-row c4-pad">
          <span>{rule.body} · {rule.every}</span>
          <button type="button" className="c4-btn" onClick={() => void create(rule.body, nextRecur(rule.every, rule.hour))}>{v4("recurRun")}</button>
        </div>
      ))}
      <ul className="c4-task-list">
        {shown.map((row) => (
          <li key={row.id} className="c4-task-row c4-task-atelier-row" tabIndex={0}>
            <div className="c4-row c4-between">
              <span>{row.body}</span>
              <span className="c4-muted">{row.remindAt ? new Date(row.remindAt).toLocaleString(locale) : ""}</span>
            </div>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => void snooze(row, "15m")}>{v4("snooze15")}</button>
              <button type="button" className="c4-btn" onClick={() => void snooze(row, "tomorrow")}>{v4("snoozeTomorrow")}</button>
            </div>
          </li>
        ))}
      </ul>
      {!shown.length && <p className="c4-empty-gold c4-task-atelier-empty">{v4("emptyTasks")}</p>}
      {msg && <p className="c4-muted c4-pad">{msg}</p>}
    </section>
  );
}

function leadOf(row: UserRow) {
  const extra = row as UserRow & { lastLoginAt?: string | null };
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    country: row.country,
    desk: row.desk,
    ftd: row.ftd,
    balance: row.balance ?? row.account?.balance,
    lastLoginAt: extra.lastLoginAt,
    createdAt: row.createdAt,
  };
}

export function DeskTools({ v4, locale }: { v4: V4; locale: string }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const rows = (data.data?.users || []).map(leadOf);
  const ranks = deskRanks(rows);
  const [desk, setDesk] = useState("");
  const [rules, setRules] = useState<AssignRule[]>([]);
  const [country, setCountry] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => { setRules(readJson(RULE_KEY, [])); }, []);
  const current = desk || ranks[0]?.desk || "";
  const mine = rows.filter((row) => (row.desk || "—") === current);
  const buckets = { fresh: 0, week: 0, month: 0, dormant: 0, never: 0 };
  for (const row of rows) buckets[loginBucket(row.lastLoginAt)] += 1;
  const dormant = rows.filter((row) => isDormant(row.lastLoginAt, row.createdAt));
  const calls = [...dormant].filter((row) => row.phone).sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
  return (
    <div className="c4-mkt-grid">
      <section className="c4-card">
        <div className="c4-card-h"><h3 className="c4-title">{v4("deskRank")}</h3></div>
        <table className="c4-table">
          <tbody>
            {ranks.map((row) => (
              <tr key={row.desk}><td>{row.desk}</td><td>{row.traders}</td><td>{row.ftd}</td><td>{money(row.balance, "USD", locale)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="c4-card c4-pad">
        <h3 className="c4-title">{v4("deskPick")}</h3>
        <select className="c4-select" aria-label={v4("deskPick")} value={current} onChange={(event) => setDesk(event.target.value)}>
          {ranks.map((row) => <option key={row.desk}>{row.desk}</option>)}
        </select>
        <p>{mine.length} · {money(mine.reduce((sum, row) => sum + (Number(row.balance) || 0), 0), "USD", locale)}</p>
      </section>
      <section className="c4-card c4-pad">
        <h3 className="c4-title">{v4("assignSim")}</h3>
        <div className="c4-row">
          <input className="c4-field" aria-label={v4("assignSim")} value={country} onChange={(event) => setCountry(event.target.value)} />
          <input className="c4-field" aria-label={v4("deskPick")} value={target} onChange={(event) => setTarget(event.target.value)} />
          <button type="button" className="c4-btn" onClick={() => {
            if (!country.trim() || !target.trim()) return;
            const next = [...rules.filter((rule) => rule.country.toUpperCase() !== country.trim().toUpperCase()), { country: country.trim(), desk: target.trim() }];
            setRules(next);
            writeJson(RULE_KEY, next);
          }}>{v4("assignSim")}</button>
        </div>
        {rows.slice(0, 5).map((row) => <p key={row.id}>{row.name || row.id} · {simulateAssign(row, rules)}</p>)}
      </section>
      <section className="c4-card c4-pad">
        <h3 className="c4-title">{v4("loginBuckets")}</h3>
        <p>{v4("loginBuckets")} {buckets.fresh} / {buckets.week} / {buckets.month} / {buckets.dormant} / {buckets.never}</p>
        <h3 className="c4-title">{v4("dormant")}</h3>
        {dormant.slice(0, 6).map((row) => <p key={row.id}>{row.name || row.id}</p>)}
        {!dormant.length && <p className="c4-muted">{v4("dormant")}</p>}
      </section>
      <section className="c4-card c4-pad">
        <h3 className="c4-title">{v4("winbackCalls")}</h3>
        {calls.slice(0, 6).map((row) => <p key={row.id}>{row.name || row.id} · {row.phone}</p>)}
        {!calls.length && <p className="c4-muted">{v4("winbackCalls")}</p>}
      </section>
    </div>
  );
}

export function SlaBadge({ openedAt, v4 }: { openedAt?: string; v4: V4 }) {
  const left = slaLeft(openedAt, slaLimit());
  const late = left != null && left < 0;
  const hours = ageHours(openedAt);
  return (
    <span className="c4-sla-badge" data-late={late ? "1" : "0"}>
      {late ? v4("slaOver") : v4("slaLeft")} {left == null ? "—" : `${left} ${v4("minutesShort")}`}
      {hours != null ? ` · ${v4("ticketAge")} ${hours} ${v4("hoursShort")}` : ""}
    </span>
  );
}

export function AuditChanges({ detail, v4 }: { detail: unknown; v4: V4 }) {
  const rows = changedKeys(detail);
  if (!rows.length) return null;
  return (
    <ul className="c4-diff" aria-label={v4("auditChange")}>
      {rows.map((row) => <li key={row.key}>{row.key}: {row.before || "—"} → {row.after || "—"}</li>)}
    </ul>
  );
}

export function ticketExport(rows: { customer?: string; kind?: string; amount?: number; status?: string; openedAt?: string }[], columns: string[]) {
  const fields = columns.length ? columns : ["customer", "kind", "amount", "status", "opened"];
  downloadCsv("tickets.csv", fields, rows.map((row) => fields.map((column) => {
    if (column === "customer") return String(row.customer || "");
    if (column === "kind") return String(row.kind || "");
    if (column === "amount") return String(row.amount ?? "");
    if (column === "status") return String(row.status || "");
    return String(row.openedAt || "");
  })));
}
