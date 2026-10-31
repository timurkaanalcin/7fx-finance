"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { sparkPath } from "@/lib/crmv4/round4";
import {
  copyLine,
  forecast,
  goalProgress,
  journeyOf,
  mentionParts,
  moneyTone,
  pushCapped,
  segmentOf,
  symbolPopularity,
  upcomingBirthdays,
  winLoss,
  type Segment,
} from "@/lib/crmv4/round5";
import { money, sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const GOALS_KEY = "crmv4-desk-goals";
const PINS_KEY = "crmv4-note-pins";
const SEARCH_KEY = "crmv4-search-history";
const EXPORT_KEY = "crmv4-exports";
const ROLE_KEY = "crmv4-role-preview";
const ZEBRA_KEY = "crmv4-zebra";
const FORMAT_KEY = "crmv4-format";
const SEGMENT_KEY = "crmv4-segments";

const STEP_KEY: Record<string, CrmV4CopyKey> = {
  signup: "stepSignup",
  kyc: "stepKyc",
  ftd: "stepFtd",
  trades: "stepTrades",
  cashout: "stepCashout",
};

export function readSegmentRules(): { vipBalance: number; dormantDays: number } {
  return readJson(SEGMENT_KEY, { vipBalance: 10000, dormantDays: 30 });
}

export function JourneyMap({ id, v4 }: { id: string; v4: V4 }) {
  const user = useJson<{ user?: UserRow & { birthDate?: string | null } }>(`/api/admin/users/${encodeURIComponent(id)}?view=profile`);
  const trades = useJson<{ positions?: { id: string }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=20`);
  const cash = useJson<{ requests?: { id: string }[] }>(`/api/admin/withdrawals?take=20&q=${encodeURIComponent(user.data?.user?.email || " ")}`);
  const row = user.data?.user;
  const steps = journeyOf({
    createdAt: row?.createdAt,
    documentsStatus: row?.documentsStatus,
    ftd: row?.ftd,
    trades: (trades.data?.positions || []).length,
    withdrawals: (cash.data?.requests || []).length,
  });
  return (
    <section className="c4-card c4-journey">
      <div className="c4-card-h"><h3 className="c4-title">{v4("journey")}</h3></div>
      <ol className="c4-journey-list">
        {steps.map((step) => (
          <li key={step.key} data-done={step.done ? "1" : "0"}>{v4(STEP_KEY[step.key])}</li>
        ))}
      </ol>
    </section>
  );
}

export function ForecastLine({ v4, locale }: { v4: V4; locale: string }) {
  const data = useJson<{ requests?: { amount?: number; createdAt?: string }[] }>("/api/admin/deposits?take=40&status=APPROVED");
  const rows = [...(data.data?.requests || [])].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  let running = 0;
  const points = rows.map((row) => {
    running += Math.abs(Number(row.amount) || 0);
    return Math.round(running * 100) / 100;
  });
  const next = forecast(points, 3);
  const path = sparkPath([...points, ...next]);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("forecast")}</h3></div>
      <p className="c4-pad">{next.map((value) => money(value, "USD", locale)).join(" · ") || "—"}</p>
      {path && <svg className="c4-spark" viewBox="0 0 120 32" role="img" aria-label={v4("forecast")}><path d={path} /></svg>}
    </section>
  );
}

export function MiniChart({ points, label }: { points: number[]; label: string }) {
  const path = sparkPath(points);
  if (!path) return null;
  return <svg className="c4-mini" viewBox="0 0 120 32" role="img" aria-label={label}><path d={path} /></svg>;
}

export function DeskGoals({ v4 }: { v4: V4 }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const rows = data.data?.users || [];
  const [goals, setGoals] = useState<Record<string, number>>({});
  useEffect(() => { setGoals(readJson(GOALS_KEY, {})); }, []);
  const names: string[] = [];
  for (const row of rows) {
    const name = row.desk || "—";
    if (!names.includes(name)) names.push(name);
  }
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("deskGoals")}</h3></div>
      {names.slice(0, 6).map((name) => {
        const current = rows.filter((row) => (row.desk || "—") === name).length;
        const target = goals[name] || 0;
        return (
          <div key={name} className="c4-pad">
            <div className="c4-row c4-between"><span>{name}</span><span>{goalProgress(current, target)}%</span></div>
            <label className="c4-lab"><span>{v4("goalTarget")}</span>
              <input className="c4-field" type="number" min={0} defaultValue={target || ""} aria-label={`${v4("goalTarget")} ${name}`} onBlur={(event) => {
                const next = { ...goals, [name]: Number(event.target.value) || 0 };
                setGoals(next);
                writeJson(GOALS_KEY, next);
              }} />
            </label>
          </div>
        );
      })}
    </section>
  );
}

export function DailySheet({ v4, tx, locale }: { v4: V4; tx: Tx; locale: string }) {
  const data = useJson<{ users?: UserRow[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const rows = data.data?.users || [];
  const names: string[] = [];
  for (const row of rows) {
    const name = row.assigneeName || "—";
    if (!names.includes(name)) names.push(name);
  }
  const [agent, setAgent] = useState("");
  const picked = rows.filter((row) => (row.assigneeName || "—") === (agent || names[0] || "—"));
  const ftd = picked.filter((row) => row.ftd).length;
  return (
    <section className="c4-card c4-daily">
      <div className="c4-card-h"><h3 className="c4-title">{v4("dailyReport")}</h3>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("printReport")}</button>
      </div>
      <label className="c4-lab c4-pad"><span>{v4("dailyReport")}</span>
        <select className="c4-select" value={agent || names[0] || ""} onChange={(event) => setAgent(event.target.value)}>
          {names.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <p className="c4-pad">{tx("customers")} {picked.length} · {tx("ftd")} {ftd} · {tx("balance")} {money(picked.reduce((sum, row) => sum + (Number(row.balance ?? row.account?.balance) || 0), 0), "USD", locale)}</p>
    </section>
  );
}

export function BonusHistory({ v4, locale }: { v4: V4; locale: string }) {
  const bonus = useJson<{ transactions?: { id: string; amount?: number; type?: string; trader?: string; createdAt?: string }[] }>("/api/admin/transactions?type=BONUS&limit=20");
  const credit = useJson<{ transactions?: { id: string; amount?: number; type?: string; trader?: string; createdAt?: string }[] }>("/api/admin/transactions?type=CREDIT&limit=20");
  const rows = [...(bonus.data?.transactions || []), ...(credit.data?.transactions || [])];
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("bonusHistory")}</h3></div>
      <ul>
        {rows.slice(0, 12).map((row) => (
          <li key={row.id} className="c4-pad c4-row c4-between"><span>{row.trader || "—"} · {row.type}</span><span>{money(row.amount, "USD", locale)}</span></li>
        ))}
      </ul>
      {!rows.length && !bonus.loading && !credit.loading && <p className="c4-muted c4-pad">{v4("bonusHistory")}</p>}
    </section>
  );
}

export function SymbolPop({ v4 }: { v4: V4 }) {
  const data = useJson<{ positions?: { symbol?: string }[] }>("/api/admin/positions?status=ALL&take=80");
  const rows = symbolPopularity(data.data?.positions || []).slice(0, 6);
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("symbolPop")}</h3></div>
      {rows.map((row) => (
        <div key={row.symbol} className="c4-funnel-row"><span>{row.symbol}</span><div className="c4-risk-track"><div className="c4-bar" style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }} /></div><strong>{row.count}</strong></div>
      ))}
    </section>
  );
}

export function WinLossCard({ id, v4 }: { id: string; v4: V4 }) {
  const data = useJson<{ positions?: { profit?: number }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=40`);
  const book = winLoss(data.data?.positions || []);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("winLoss")}</h3></div>
      <p className="c4-pad">{book.wins} / {book.losses} · {book.ratio}%</p>
    </section>
  );
}

export function segmentLabel(kind: Segment, v4: V4) {
  if (kind === "vip") return v4("segmentVip");
  if (kind === "dormant") return v4("segmentDormant");
  return v4("segmentRegular");
}

export function customerSegment(row: UserRow): Segment {
  const extra = row as UserRow & { lastSeenAt?: string | null; lastLoginAt?: string | null };
  return segmentOf({ balance: row.balance ?? row.account?.balance, lastSeenAt: extra.lastSeenAt, lastLoginAt: extra.lastLoginAt }, readSegmentRules());
}

export function BirthdayList({ rows, v4 }: { rows: (UserRow & { birthDate?: string | null })[]; v4: V4 }) {
  const found = upcomingBirthdays(rows);
  if (!found.length) return null;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("birthdays")}</h3></div>
      {found.map((row) => <p key={row.id} className="c4-pad">{row.name} · {row.inDays}</p>)}
    </section>
  );
}

export function CallbackButton({ id, name, v4, tx }: { id: string; name: string; v4: V4; tx: Tx }) {
  const [msg, setMsg] = useState("");
  return (
    <div>
      <button type="button" className="c4-btn" onClick={async () => {
        const whenAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const res = await sendJson("/api/admin/calendar", "POST", { body: `${v4("scheduleCallback")} · ${name}`, remindAt: whenAt, userId: id });
        setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      }}>{v4("scheduleCallback")}</button>
      {msg && <p className="c4-muted c4-meta">{msg}</p>}
    </div>
  );
}

export function NoteBody({ body }: { body: string }) {
  const parts = mentionParts(body);
  return <div>{parts.map((part, index) => part.mention ? <mark key={`${part.text}-${index}`} className="c4-mention">{part.text}</mark> : <span key={`${part.text}-${index}`}>{part.text}</span>)}</div>;
}

export function notePinned(id: string): boolean {
  return readJson<string[]>(PINS_KEY, []).includes(id);
}

export function toggleNotePin(id: string): string[] {
  const current = readJson<string[]>(PINS_KEY, []);
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  writeJson(PINS_KEY, next);
  return next;
}

export function rememberSearch(query: string) {
  const text = query.trim();
  if (!text) return;
  writeJson(SEARCH_KEY, pushCapped(readJson<string[]>(SEARCH_KEY, []), text, 8));
}

export function searchHistory(): string[] {
  return readJson<string[]>(SEARCH_KEY, []);
}

export function SearchHistory({ v4, onPick }: { v4: V4; onPick: (query: string) => void }) {
  const [rows, setRows] = useState<string[]>([]);
  useEffect(() => { setRows(searchHistory()); }, []);
  if (!rows.length) return null;
  return (
    <div className="c4-tools" aria-label={v4("searchHistory")}>
      <span className="c4-muted">{v4("searchHistory")}</span>
      {rows.map((row) => <button key={row} type="button" className="c4-chip" onClick={() => onPick(row)}>{row}</button>)}
    </div>
  );
}

export function rememberExport(name: string) {
  const text = name.trim();
  if (!text) return;
  writeJson(EXPORT_KEY, pushCapped(readJson<string[]>(EXPORT_KEY, []), text, 8));
}

export function RecentExports({ v4 }: { v4: V4 }) {
  const [rows, setRows] = useState<string[]>([]);
  useEffect(() => { setRows(readJson<string[]>(EXPORT_KEY, [])); }, []);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("recentExports")}</h3></div>
      {rows.map((row) => <p key={row} className="c4-pad">{row}</p>)}
      {!rows.length && <p className="c4-muted c4-pad">{v4("recentExports")}</p>}
    </section>
  );
}

export function DeskSwitch({ desks, current, v4, onPick }: { desks: string[]; current: string; v4: V4; onPick: (desk: string) => void }) {
  if (!desks.length) return null;
  return (
    <div className="c4-tools" aria-label={v4("deskSwitch")}>
      <button type="button" className="c4-chip" data-on={current ? "0" : "1"} onClick={() => onPick("")}>{v4("deskSwitch")}</button>
      {desks.map((desk) => <button key={desk} type="button" className="c4-chip" data-on={current === desk ? "1" : "0"} onClick={() => onPick(current === desk ? "" : desk)}>{desk}</button>)}
    </div>
  );
}

export function storedRole(): "desk" | "viewer" {
  if (typeof window === "undefined") return "desk";
  return window.localStorage.getItem(ROLE_KEY) === "viewer" ? "viewer" : "desk";
}

export function RolePreview({ v4 }: { v4: V4 }) {
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  useEffect(() => { setRole(storedRole()); }, []);
  function pick(next: "desk" | "viewer") {
    setRole(next);
    window.localStorage.setItem(ROLE_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:role", { detail: next }));
  }
  return (
    <div className="c4-row">
      <button type="button" className="c4-chip" data-on={role === "desk" ? "1" : "0"} onClick={() => pick("desk")}>{v4("deskRole")}</button>
      <button type="button" className="c4-chip" data-on={role === "viewer" ? "1" : "0"} onClick={() => pick("viewer")}>{v4("viewerRole")}</button>
    </div>
  );
}

export function IdleWarning({ v4 }: { v4: V4 }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let last = Date.now();
    const mark = () => { last = Date.now(); setOpen(false); };
    const tick = window.setInterval(() => {
      if (Date.now() - last > 12 * 60 * 1000) setOpen(true);
    }, 30000);
    window.addEventListener("pointerdown", mark);
    window.addEventListener("keydown", mark);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);
  if (!open) return null;
  return (
    <p className="c4-idle" role="status">
      {v4("timeoutWarn")}
      <button type="button" className="c4-btn" onClick={() => setOpen(false)}>{v4("timeoutStay")}</button>
    </p>
  );
}

export async function copyRowText(fields: (string | number | null | undefined)[]) {
  const text = copyLine(fields);
  try { await navigator.clipboard.writeText(text); } catch { /* the text stays on the row */ }
  return text;
}

export function BulkNote({ ids, v4, tx, onDone }: { ids: string[]; v4: V4; tx: Tx; onDone: () => void }) {
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  if (!ids.length) return null;
  return (
    <form className="c4-row c4-pad" onSubmit={async (event) => {
      event.preventDefault();
      const text = body.trim();
      if (!text) return;
      let failed = 0;
      for (const id of ids) {
        const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: text });
        if (!res.ok) failed += 1;
      }
      setMsg(failed ? tx("failed") : tx("saved"));
      if (!failed) { setBody(""); onDone(); }
    }}>
      <input className="c4-field" aria-label={v4("bulkNote")} value={body} onChange={(event) => setBody(event.target.value)} />
      <button type="submit" className="c4-btn" data-write="1">{v4("bulkNote")}</button>
      {msg && <span className="c4-muted">{msg}</span>}
    </form>
  );
}

export function storedZebra(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ZEBRA_KEY) === "1";
}

export function ZebraToggle({ v4 }: { v4: V4 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(storedZebra()); }, []);
  return (
    <button type="button" className="c4-chip" data-on={on ? "1" : "0"} onClick={() => {
      const next = !on;
      setOn(next);
      window.localStorage.setItem(ZEBRA_KEY, next ? "1" : "0");
      window.dispatchEvent(new CustomEvent("crmv4:zebra", { detail: next }));
    }}>{v4("zebraRows")}</button>
  );
}

export function readFormat(): { high: number; low: number } {
  return readJson(FORMAT_KEY, { high: 10000, low: 0 });
}

export function FormatRules({ v4 }: { v4: V4 }) {
  const [rules, setRules] = useState({ high: 10000, low: 0 });
  useEffect(() => { setRules(readFormat()); }, []);
  function save(next: { high: number; low: number }) {
    setRules(next);
    writeJson(FORMAT_KEY, next);
  }
  return (
    <div className="c4-row">
      <label className="c4-lab"><span>{v4("formatHigh")}</span>
        <input className="c4-field" type="number" value={rules.high} onChange={(event) => save({ ...rules, high: Number(event.target.value) || 0 })} />
      </label>
      <label className="c4-lab"><span>{v4("formatLow")}</span>
        <input className="c4-field" type="number" value={rules.low} onChange={(event) => save({ ...rules, low: Number(event.target.value) || 0 })} />
      </label>
    </div>
  );
}

export function balanceTone(value: number): "high" | "low" | "" {
  const rules = readFormat();
  return moneyTone(value, rules.high, rules.low);
}

export function FocusButton({ v4 }: { v4: V4 }) {
  const [on, setOn] = useState(false);
  return (
    <button type="button" className="c4-chip" data-on={on ? "1" : "0"} onClick={() => {
      const next = !on;
      setOn(next);
      window.dispatchEvent(new CustomEvent("crmv4:focus", { detail: next }));
    }}>{v4("focusMode")}</button>
  );
}
