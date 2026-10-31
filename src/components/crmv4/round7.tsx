"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  commissionOf,
  completeness,
  duplicateLeads,
  parseLeadCsv,
  sameDay,
  sourceMix,
  staleCallbacks,
  statusDiffs,
  weekKeys,
  type ProfileBits,
} from "@/lib/crmv4/round7";
import { capitalizeName, phoneIssue } from "@/lib/crmv4/round11";
import { methodName } from "@/lib/crmv4/round15";
import { exportCurrent, readTags } from "./round1";
import { pushEdit } from "./round11";
import { money, sendJson, useJson, when, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const RATE_KEY = "crmv4-commission-rate";
const SOUND_KEY = "crmv4-sound";
const TICKET_KEY = "crmv4-ticket-notify";
const STATUS_KEY = "crmv4-status-snap";
const PRIORITY_KEY = "crmv4-task-priority";
const LAST_KEY = "crmv4-last-view";

export function CompletenessMeter({ row, v4 }: { row: ProfileBits; v4: V4 }) {
  const result = completeness(row);
  return (
    <section className="c4-card c4-meter">
      <div className="c4-card-h"><h3 className="c4-title">{v4("complete")} {result.score}%</h3></div>
      <div className="c4-meter-bar" aria-hidden><span style={{ width: `${result.score}%` }} /></div>
      <p className="c4-muted c4-pad">{v4("missing")}</p>
      <ul>{result.missing.map((key) => <li key={key} className="c4-pad">{key}</li>)}</ul>
      {!result.missing.length && <p className="c4-pad">{v4("complete")}</p>}
    </section>
  );
}

export function InlineProfile({ id, user, tx, v4, onDone }: { id: string; user: UserRow; tx: Tx; v4: V4; onDone: () => void }) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [country, setCountry] = useState(user.country || "");
  const [msg, setMsg] = useState("");
  const [undo, setUndo] = useState<null | { name: string; phone: string; country: string }>(null);
  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), 10000);
    return () => window.clearTimeout(timer);
  }, [undo]);
  async function save(next: { name: string; phone: string; country: string }, previous: { name: string; phone: string; country: string }) {
    const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { name: next.name, phone: next.phone, country: next.country });
    setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
    if (!res.ok) return;
    setUndo(previous);
    const at = new Date().toISOString();
    if (previous.name !== next.name) pushEdit({ at, id, field: "name", from: previous.name, to: next.name });
    if (previous.phone !== next.phone) pushEdit({ at, id, field: "phone", from: previous.phone, to: next.phone });
    if (previous.country !== next.country) pushEdit({ at, id, field: "country", from: previous.country, to: next.country });
    onDone();
  }
  return (
    <form className="c4-row c4-pad" onSubmit={(event) => {
      event.preventDefault();
      void save({ name, phone, country }, { name: user.name || "", phone: user.phone || "", country: user.country || "" });
    }}>
      <input className="c4-field" aria-label={tx("name")} value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" className="c4-btn" onClick={() => {
        const next = capitalizeName(name);
        setName(next);
        void save({ name: next, phone, country }, { name, phone, country });
      }}>{v4("nameCase")}</button>
      <input className="c4-field" aria-label={tx("phone")} value={phone} onChange={(event) => setPhone(event.target.value)} />
      {phoneIssue(phone) && <span className="c4-muted">{v4("phoneHint")}</span>}
      <input className="c4-field" aria-label={tx("country")} value={country} onChange={(event) => setCountry(event.target.value)} />
      <button type="submit" className="c4-btn c4-btn-hot">{v4("inlineSave")}</button>
      {undo && <button type="button" className="c4-btn" onClick={() => {
        setName(undo.name);
        setPhone(undo.phone);
        setCountry(undo.country);
        void save(undo, { name, phone, country });
      }}>{v4("undoEdit")}</button>}
      {msg && <span className="c4-muted">{msg}</span>}
    </form>
  );
}

export function LangBadge({ language, v4 }: { language?: string | null; v4: V4 }) {
  if (!language) return null;
  return <span className="c4-status" data-tone="info">{v4("langBadge")} {language}</span>;
}

export function MoneyHistory({ row, tx, v4, locale, onClose }: { row: { id: string; amount?: number; currency?: string; status?: string; method?: unknown; createdAt?: string; user?: { name?: string; email?: string } }; tx: Tx; v4: V4; locale: string; onClose: () => void }) {
  const email = row.user?.email || "";
  const ledger = useJson<{ transactions?: { id: string; type?: string; amount?: number; createdAt?: string; comment?: string }[] }>(email ? `/api/admin/transactions?q=${encodeURIComponent(email)}&limit=12` : null);
  return (
    <div className="c4-drawer-back" role="presentation" onClick={onClose}>
      <aside className="c4-drawer c4-money-drawer" role="dialog" aria-modal="true" aria-label={v4("moneyHistory")} onClick={(event) => event.stopPropagation()}>
        <div className="c4-row c4-between"><h2 className="c4-title">{v4("moneyHistory")}</h2><button type="button" className="c4-btn" onClick={onClose}>{tx("close")}</button></div>
        <p>{row.user?.name || "—"} · {money(row.amount, row.currency, locale)}</p>
        <p className="c4-muted">{row.status} · {methodName(row.method) || "—"} · {when(row.createdAt, locale)}</p>
        <ul>
          {(ledger.data?.transactions || []).map((item) => (
            <li key={item.id} className="c4-pad">{item.type} · {money(item.amount, row.currency, locale)} · {when(item.createdAt, locale)}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export function useQueueCursor(count: number, onApprove: (index: number) => void, onReject: (index: number) => void) {
  const [cursor, setCursor] = useState(0);
  const cursorRef = useRef(0);
  cursorRef.current = cursor;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "j") setCursor((index) => Math.min(Math.max(count - 1, 0), index + 1));
    if (event.key === "k") setCursor((index) => Math.max(0, index - 1));
    if (event.key.toLowerCase() === "a") onApprove(cursorRef.current);
    if (event.key.toLowerCase() === "r") onReject(cursorRef.current);
  };
  return { cursor, onKeyDown };
}

export function CommissionCard({ amount, v4, locale }: { amount: number; v4: V4; locale: string }) {
  const [rate, setRate] = useState(0);
  useEffect(() => { setRate(Number(readJson(RATE_KEY, 0)) || 0); }, []);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("commission")}</h3></div>
      <label className="c4-lab c4-pad"><span>{v4("rate")}</span>
        <input className="c4-field" type="number" min={0} value={rate || ""} onChange={(event) => {
          const next = Number(event.target.value) || 0;
          setRate(next);
          writeJson(RATE_KEY, next);
        }} />
      </label>
      <p className="c4-pad">{money(commissionOf(amount, rate), "USD", locale)}</p>
    </section>
  );
}

export function ImportPreview({ known, v4 }: { known: string[]; v4: V4 }) {
  const [text, setText] = useState("");
  const rows = text.trim() ? parseLeadCsv(text) : [];
  const dups = duplicateLeads(rows.filter((row) => !row.error), known);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("importPreview")}</h3></div>
      <textarea className="c4-field" rows={4} aria-label={v4("importPreview")} placeholder="email,name,phone,country" value={text} onChange={(event) => setText(event.target.value)} />
      <ul>
        {rows.map((row) => <li key={row.line} className="c4-pad">{row.line}. {row.email || "—"} {row.error ? `· ${row.error}` : ""} {dups.includes(row.email.toLowerCase()) ? `· ${v4("importDup")}` : ""}</li>)}
      </ul>
    </section>
  );
}

export function SourceBoard({ rows, v4 }: { rows: { campaign?: string | null; utmSource?: string | null }[]; v4: V4 }) {
  const mix = sourceMix(rows).slice(0, 6);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("sources")}</h3></div>
      {mix.map((row) => <p key={row.source} className="c4-pad">{row.source} · {row.count}</p>)}
    </section>
  );
}

export function TagCloud({ v4, onPick }: { v4: V4; onPick: (tag: string) => void }) {
  const [tags, setTags] = useState<string[]>([]);
  useEffect(() => {
    const map = readTags();
    const names: string[] = [];
    for (const list of Object.values(map)) {
      for (const tag of list) if (!names.includes(tag)) names.push(tag);
    }
    setTags(names);
  }, []);
  if (!tags.length) return null;
  return (
    <div className="c4-cloud" aria-label={v4("tagCloud")}>
      {tags.map((tag) => <button key={tag} type="button" className="c4-chip" onClick={() => onPick(tag)}>{tag}</button>)}
    </div>
  );
}

export function rememberStatuses(rows: { id: string; saleStatus?: string | null; name?: string | null }[]): { id: string; name: string; from: string; to: string }[] {
  const prev = readJson<Record<string, string>>(STATUS_KEY, {});
  const diffs = Object.keys(prev).length ? statusDiffs(prev, rows) : [];
  const next: Record<string, string> = {};
  for (const row of rows) next[row.id] = row.saleStatus || "";
  writeJson(STATUS_KEY, next);
  return diffs;
}

export function StatusWatch({ rows, v4 }: { rows: { id: string; saleStatus?: string | null; name?: string | null }[]; v4: V4 }) {
  const [diffs, setDiffs] = useState<{ id: string; name: string; from: string; to: string }[]>([]);
  useEffect(() => { setDiffs(rememberStatuses(rows)); }, [rows]);
  if (!diffs.length) return null;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("statusChanged")}</h3></div>
      {diffs.map((row) => <p key={row.id} className="c4-pad">{row.name} · {row.from} → {row.to}</p>)}
    </section>
  );
}

export function StaleList({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const late = staleCallbacks(rows);
  if (!late.length) return null;
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("staleCallbacks")}</h3></div>
      {late.slice(0, 6).map((row) => <p key={row.id} className="c4-pad">{row.name || row.email}</p>)}
    </section>
  );
}

export function taskPriority(id: string): "high" | "normal" | "low" {
  return readJson<Record<string, "high" | "normal" | "low">>(PRIORITY_KEY, {})[id] || "normal";
}

export function setTaskPriority(id: string, value: "high" | "normal" | "low") {
  const map = readJson<Record<string, "high" | "normal" | "low">>(PRIORITY_KEY, {});
  map[id] = value;
  writeJson(PRIORITY_KEY, map);
}

export function WeekBoard({ v4, locale }: { v4: V4; locale: string }) {
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=80");
  const [mode, setMode] = useState<"week" | "day">("week");
  const [picked, setPicked] = useState(new Date().toISOString().slice(0, 10));
  const days = weekKeys();
  const rows = data.data?.reminders || [];
  const shown = mode === "day" ? rows.filter((row) => sameDay(row.remindAt, picked)) : rows.filter((row) => days.some((day) => sameDay(row.remindAt, day)));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{mode === "day" ? v4("dayView") : v4("weekView")}</h3></div>
      <div className="c4-row c4-pad">
        <button type="button" className="c4-chip" data-on={mode === "week" ? "1" : "0"} onClick={() => setMode("week")}>{v4("weekView")}</button>
        <button type="button" className="c4-chip" data-on={mode === "day" ? "1" : "0"} onClick={() => setMode("day")}>{v4("dayView")}</button>
      </div>
      <div className="c4-week">
        {days.map((day) => (
          <button key={day} type="button" className="c4-chip" data-on={picked === day ? "1" : "0"} onDragOver={(event) => event.preventDefault()} onDrop={async (event) => {
            const id = event.dataTransfer.getData("text/plain");
            const body = rows.find((row) => row.id === id)?.body;
            if (!id || !body) return;
            await sendJson("/api/admin/calendar", "POST", { body, remindAt: `${day}T09:00:00.000Z` });
            await sendJson("/api/admin/calendar", "POST", { action: "delete", id });
            data.reload();
          }} onClick={() => { setPicked(day); setMode("day"); }}>{day.slice(8)}</button>
        ))}
      </div>
      <ul>
        {shown.map((row) => (
          <li key={row.id} className="c4-pad" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", row.id)} data-priority={taskPriority(row.id)}>
            {row.body} · {when(row.remindAt, locale)}
            <select className="c4-select" aria-label={v4("taskPriority")} defaultValue={taskPriority(row.id)} onChange={(event) => setTaskPriority(row.id, event.target.value as "high" | "normal" | "low")}>
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function soundEnabled(): boolean {
  return readJson<boolean>(SOUND_KEY, false) === true;
}

export function SoundToggle({ v4 }: { v4: V4 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(soundEnabled()); }, []);
  return (
    <button type="button" className="c4-chip" data-on={on ? "1" : "0"} onClick={() => {
      const next = !on;
      setOn(next);
      writeJson(SOUND_KEY, next);
    }}>{v4("soundOn")}</button>
  );
}

export function playPing() {
  if (!soundEnabled() || typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 660;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
  window.setTimeout(() => void ctx.close(), 200);
}

export function ticketAlertsOn(): boolean {
  return readJson<boolean>(TICKET_KEY, false) === true;
}

export function TicketAlertToggle({ v4 }: { v4: V4 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(ticketAlertsOn()); }, []);
  return (
    <button type="button" className="c4-chip" data-on={on ? "1" : "0"} onClick={async () => {
      const next = !on;
      if (next && typeof Notification !== "undefined") await Notification.requestPermission();
      setOn(next);
      writeJson(TICKET_KEY, next);
    }}>{v4("ticketNotify")}</button>
  );
}

export function rememberView(path: string) {
  try { window.sessionStorage.setItem(LAST_KEY, path); } catch { /* session may be blocked */ }
}

export function lastView(): string {
  try { return window.sessionStorage.getItem(LAST_KEY) || ""; } catch { return ""; }
}

export async function exportTimeline(rows: { kind?: string; path?: string | null; createdAt?: string }[]) {
  await exportCurrent("activity-timeline", "timeline.csv", ["kind", "path", "at"], rows.map((row) => [String(row.kind || ""), String(row.path || ""), String(row.createdAt || "")]));
}
