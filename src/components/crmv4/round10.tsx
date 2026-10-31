"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { zoneFor } from "@/lib/crmv4/round3";
import { anomalyRows, bestCallHours, leadScore, offsetFor, payoutOf, roiOf, snoozeAt, toIcs, type ScoreRule } from "@/lib/crmv4/round10";
import { sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const COST_KEY = "crmv4-campaign-cost";
const SCORE_KEY = "crmv4-score-rules";
const HOLIDAY_KEY = "crmv4-holidays";
const PRESET_KEY = "crmv4-export-presets";
const BRAND_KEY = "crmv4-brand";
const KPI_KEY = "crmv4-kpis";
const PAY_KEY = "crmv4-payout-rate";
const DEFAULT_RULES: ScoreRule[] = [
  { field: "ftd", op: "eq", value: "true", points: 40 },
  { field: "balance", op: "gte", value: "1000", points: 30 },
  { field: "sale", op: "eq", value: "CALLBACK", points: 20 },
];

type LogRow = { id: string; action?: string; actor?: string; target?: string; at?: string; detail?: unknown };

function ipOf(detail: unknown): string {
  if (!detail || typeof detail !== "object") return "";
  const bag = detail as Record<string, unknown>;
  return String(bag.ip || bag.lastIp || "");
}

export function ActivityStream({ v4 }: { v4: V4 }) {
  const data = useJson<{ rows?: LogRow[] }>("/api/admin/control?part=logs&source=audit&level=all&take=30");
  const [actor, setActor] = useState("");
  const rows = data.data?.rows || [];
  const names: string[] = [];
  for (const row of rows) {
    const name = row.actor || "—";
    if (!names.includes(name)) names.push(name);
  }
  const shown = actor ? rows.filter((row) => (row.actor || "—") === actor) : rows;
  return (
    <section className="c4-card c4-audit-luxe">
      <div className="c4-card-h"><h3 className="c4-title">{v4("activityStream")}</h3></div>
      <label className="c4-lab c4-pad"><span>{v4("staffAudit")}</span>
        <select className="c4-select" aria-label={v4("staffAudit")} value={actor} onChange={(event) => setActor(event.target.value)}>
          <option value="">{v4("activityStream")}</option>
          {names.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <ul>{shown.slice(0, 12).map((row) => <li key={row.id} className="c4-pad">{row.actor || "—"} · {row.action} · {row.target || ""}</li>)}</ul>
    </section>
  );
}

export function LoginAnomalies({ v4 }: { v4: V4 }) {
  const data = useJson<{ rows?: LogRow[] }>("/api/admin/control?part=logs&source=login&level=all&take=40");
  const flagged = anomalyRows((data.data?.rows || []).map((row) => ({ actor: row.actor, ip: ipOf(row.detail), at: row.at })));
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("loginAnomaly")}</h3></div>
      {flagged.map((row) => <p key={row.actor} className="c4-pad">{row.actor} · {row.ips.join(", ")}</p>)}
      {!flagged.length && <p className="c4-muted c4-pad">{v4("loginAnomaly")}</p>}
    </section>
  );
}

export function PresenceFacts({ row, v4 }: { row: UserRow; v4: V4 }) {
  const extra = row as UserRow & { lastIp?: string | null; lastDevice?: string | null; lastBrowser?: string | null; lastOs?: string | null };
  return (
    <p className="c4-muted c4-meta">
      {v4("ipHistory")} {extra.lastIp || "—"} · {v4("deviceInfo")} {[extra.lastDevice, extra.lastBrowser, extra.lastOs].filter(Boolean).join(" / ") || "—"}
    </p>
  );
}

export function PayoutCard({ amount, v4 }: { amount: number; v4: V4 }) {
  const [rate, setRate] = useState(0);
  useEffect(() => { setRate(Number(readJson(PAY_KEY, 0)) || 0); }, []);
  return (
    <label className="c4-lab c4-pad"><span>{v4("payoutEstimate")}</span>
      <input className="c4-field" type="number" min={0} aria-label={v4("payoutEstimate")} value={rate || ""} onChange={(event) => {
        const next = Number(event.target.value) || 0;
        setRate(next);
        writeJson(PAY_KEY, next);
      }} />
      <span>{payoutOf(amount, rate).toFixed(2)}</span>
    </label>
  );
}

export function IbTree({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const parent = row.affiliateA || "—";
    map.set(parent, [...(map.get(parent) || []), row.name || row.email || row.id]);
  }
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("ibTree")}</h3></div>
      {Array.from(map.entries()).slice(0, 6).map(([parent, names]) => (
        <div key={parent} className="c4-pad"><strong>{parent}</strong>{names.slice(0, 4).map((name) => <div key={name} className="c4-rich-item">{name}</div>)}</div>
      ))}
    </section>
  );
}

export function RoiTable({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const [costs, setCosts] = useState<Record<string, number>>({});
  useEffect(() => { setCosts(readJson(COST_KEY, {})); }, []);
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = row.campaign || "—";
    groups.set(key, (groups.get(key) || 0) + (Number(row.balance ?? row.account?.balance) || 0));
  }
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("campaignRoi")}</h3></div>
      {Array.from(groups.entries()).slice(0, 6).map(([name, value]) => (
        <div key={name} className="c4-row c4-pad">
          <span>{name}</span>
          <input className="c4-field" type="number" min={0} aria-label={`${v4("costInput")} ${name}`} defaultValue={costs[name] || ""} onBlur={(event) => {
            const next = { ...costs, [name]: Number(event.target.value) || 0 };
            setCosts(next);
            writeJson(COST_KEY, next);
          }} />
          <span>{roiOf(value, costs[name] || 0) ?? "—"}%</span>
        </div>
      ))}
    </section>
  );
}

export function readScoreRules(): ScoreRule[] {
  return readJson<ScoreRule[]>(SCORE_KEY, DEFAULT_RULES);
}

export function scoreOf(row: UserRow): number {
  return leadScore({ balance: row.balance ?? row.account?.balance, ftd: row.ftd, country: row.country, saleStatus: row.saleStatus }, readScoreRules());
}

export function ScoreEditor({ v4 }: { v4: V4 }) {
  const [rules, setRules] = useState<ScoreRule[]>(DEFAULT_RULES);
  useEffect(() => { setRules(readScoreRules()); }, []);
  return (
    <div className="c4-stack">
      <h3 className="c4-title">{v4("scoreRules")}</h3>
      {rules.map((rule, index) => (
        <label key={`${rule.field}-${index}`} className="c4-row"><span>{rule.field}</span>
          <input className="c4-field" aria-label={v4("scoreRules")} defaultValue={rule.points} onBlur={(event) => {
            const next = rules.map((item, i) => i === index ? { ...item, points: Number(event.target.value) || 0 } : item);
            setRules(next);
            writeJson(SCORE_KEY, next);
          }} />
        </label>
      ))}
    </div>
  );
}

export function CallWindow({ country, v4 }: { country?: string | null; v4: V4 }) {
  const zone = zoneFor(country, null);
  return <span className="c4-muted">{v4("callWindow")} {bestCallHours(offsetFor(zone))}</span>;
}

export function nextCallId(rows: UserRow[]): string {
  const ranked = [...rows].sort((a, b) => scoreOf(b) - scoreOf(a));
  const open = ranked.find((row) => ["NEW", "CALLBACK", "NO_ANSWER"].includes(String(row.saleStatus || "")));
  return open?.id || ranked[0]?.id || "";
}

export function HolidayEditor({ v4 }: { v4: V4 }) {
  const [days, setDays] = useState<string[]>([]);
  const [value, setValue] = useState("");
  useEffect(() => { setDays(readJson(HOLIDAY_KEY, [])); }, []);
  return (
    <div className="c4-stack">
      <h3 className="c4-title">{v4("holidays")}</h3>
      <div className="c4-row">
        <input className="c4-field" type="date" aria-label={v4("holidays")} value={value} onChange={(event) => setValue(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => {
          if (!value || days.includes(value)) return;
          const next = [...days, value];
          setDays(next);
          writeJson(HOLIDAY_KEY, next);
          window.dispatchEvent(new Event("crmv4:holidays"));
        }}>{v4("holidays")}</button>
      </div>
      {days.map((day) => <span key={day} className="c4-chip">{day}</span>)}
    </div>
  );
}

export function ReminderTools({ v4, tx }: { v4: V4; tx: Tx }) {
  const data = useJson<{ reminders?: { id: string; body?: string; remindAt?: string }[] }>("/api/admin/calendar?take=40");
  const [picked, setPicked] = useState<string[]>([]);
  const rows = data.data?.reminders || [];
  async function snooze(row: { id: string; body?: string }) {
    await sendJson("/api/admin/calendar", "POST", { body: row.body || v4("snooze"), remindAt: snoozeAt() });
    await sendJson("/api/admin/calendar", "POST", { action: "delete", id: row.id });
    data.reload();
  }
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("exportIcs")}</h3>
        <button type="button" className="c4-btn" onClick={() => {
          const blob = new Blob([toIcs(rows.filter((row) => !picked.length || picked.includes(row.id)))], { type: "text/calendar" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "reminders.ics";
          link.click();
        }}>{v4("exportIcs")}</button>
      </div>
      {rows.slice(0, 8).map((row) => (
        <label key={row.id} className="c4-row c4-pad">
          <input type="checkbox" checked={picked.includes(row.id)} aria-label={row.body || row.id} onChange={() => setPicked((list) => list.includes(row.id) ? list.filter((item) => item !== row.id) : [...list, row.id])} />
          <span>{row.body}</span>
          <button type="button" className="c4-btn" onClick={() => void snooze(row)}>{v4("snooze")}</button>
        </label>
      ))}
      {picked.length > 1 && <button type="button" className="c4-btn" onClick={() => void Promise.all(rows.filter((row) => picked.includes(row.id)).map((row) => snooze(row)))}>{v4("snooze")}</button>}
      <p className="c4-sr">{tx("save")}</p>
    </section>
  );
}

export function ExportColumns({ v4, onExport }: { v4: V4; onExport: (columns: string[]) => void }) {
  const all = ["name", "email", "country", "desk", "sale", "balance"];
  const [cols, setCols] = useState<string[]>(all);
  const [name, setName] = useState("");
  const [presets, setPresets] = useState<{ name: string; cols: string[] }[]>([]);
  useEffect(() => { setPresets(readJson(PRESET_KEY, [])); }, []);
  return (
    <div className="c4-tools" aria-label={v4("exportColumns")}>
      {all.map((col) => (
        <label key={col} className="c4-chip" data-on={cols.includes(col) ? "1" : "0"}>
          <input type="checkbox" checked={cols.includes(col)} onChange={() => setCols((list) => list.includes(col) ? list.filter((item) => item !== col) : [...list, col])} />
          {col}
        </label>
      ))}
      <button type="button" className="c4-btn" onClick={() => onExport(cols.length ? cols : all)}>{v4("exportColumns")}</button>
      <input className="c4-field" aria-label={v4("exportPreset")} value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" className="c4-btn" onClick={() => {
        const label = name.trim();
        if (!label) return;
        const next = [...presets.filter((row) => row.name !== label), { name: label, cols }];
        setPresets(next);
        writeJson(PRESET_KEY, next);
        setName("");
      }}>{v4("exportPreset")}</button>
      {presets.map((row) => <button key={row.name} type="button" className="c4-chip" onClick={() => setCols(row.cols)}>{row.name}</button>)}
    </div>
  );
}

export function CustomerQr({ url, v4 }: { url: string; v4: V4 }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    type QrMod = { toString?: (text: string, options?: { type?: "svg"; margin?: number; width?: number }) => Promise<string>; default?: QrMod };
    void import("qrcode").then((mod) => {
      const qr = mod as QrMod;
      const api = typeof qr.toString === "function" ? qr : qr.default;
      return api?.toString ? api.toString(url, { type: "svg", margin: 1, width: 96 }) : "";
    }).then((out) => { if (live) setSvg(out || ""); }).catch(() => { if (live) setSvg(""); });
    return () => { live = false; };
  }, [url]);
  return (
    // eslint-disable-next-line react/no-danger -- QR SVG is produced locally by the qrcode library
    <div className="c4-qr" aria-label={v4("shareLink")} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

export function readBrand(): string {
  return readJson<{ text?: string }>(BRAND_KEY, {}).text || "";
}

export function BrandField({ v4 }: { v4: V4 }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(readBrand()); }, []);
  return (
    <label className="c4-lab"><span>{v4("brandText")}</span>
      <input className="c4-field" aria-label={v4("brandText")} value={text} onChange={(event) => {
        setText(event.target.value);
        writeJson(BRAND_KEY, { text: event.target.value });
        window.dispatchEvent(new CustomEvent("crmv4:brand", { detail: event.target.value }));
      }} />
    </label>
  );
}

export const KPI_IDS = ["customers", "aum", "volume", "pending"] as const;

export function readKpis(): string[] {
  const stored = readJson<string[]>(KPI_KEY, [...KPI_IDS]);
  return stored.length ? stored : [...KPI_IDS];
}

export function KpiPicker({ v4 }: { v4: V4 }) {
  const [ids, setIds] = useState<string[]>([...KPI_IDS]);
  useEffect(() => { setIds(readKpis()); }, []);
  return (
    <div className="c4-row" aria-label={v4("kpiPick")}>
      {KPI_IDS.map((id) => (
        <label key={id} className="c4-chip" data-on={ids.includes(id) ? "1" : "0"}>
          <input type="checkbox" checked={ids.includes(id)} onChange={() => {
            const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
            const safe = next.length ? next : [id];
            setIds(safe);
            writeJson(KPI_KEY, safe);
            window.dispatchEvent(new Event("crmv4:kpis"));
          }} />
          {id}
        </label>
      ))}
    </div>
  );
}

export function applyThemePreset(name: "ivory" | "night" | "champagne") {
  const accent = name === "night" ? "graphite" : "champagne";
  const mode = name === "night" ? "dark" : "light";
  window.localStorage.setItem("crmv4-theme-mode", mode);
  window.localStorage.setItem("crmv4-accent", accent);
  window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: mode }));
  window.dispatchEvent(new CustomEvent("crmv4:accent", { detail: accent }));
}

export function ThemePresets({ v4 }: { v4: V4 }) {
  return (
    <div className="c4-row" aria-label={v4("themePreset")}>
      {(["ivory", "night", "champagne"] as const).map((name) => (
        <button key={name} type="button" className="c4-chip" onClick={() => applyThemePreset(name)}>{name}</button>
      ))}
    </div>
  );
}
