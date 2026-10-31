"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { exposureBySymbol } from "@/lib/crmv4/round3";
import {
  ageBuckets,
  agentTotals,
  cohortLtv,
  deskTotals,
  holdersOf,
  overThreshold,
  pnlMovers,
  watchDiffs,
  withdrawRatio,
} from "@/lib/crmv4/round8";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, sendJson, useJson, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const WATCH_KEY = "crmv4-watch";
const SNAP_KEY = "crmv4-watch-snap";
const LIMIT_KEY = "crmv4-exposure-limit";
const BOARD_KEY = "crmv4-boards";
const FONT_KEY = "crmv4-font";
const CONTRAST_KEY = "crmv4-contrast";
const FREEZE_KEY = "crmv4-freeze";
const THEME_KEY = "crmv4-theme-mode";

export function QuickCreate({ v4, tx }: { v4: V4; tx: Tx }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="c4-quick-create">
      <button type="button" className="c4-btn c4-btn-hot" aria-expanded={open} onClick={() => setOpen((on) => !on)}>{v4("quickCreate")}</button>
      {open && (
        <form className="c4-card c4-pad" onSubmit={async (event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          const kind = String(fd.get("kind") || "reminder");
          const text = String(fd.get("body") || "").trim();
          const userId = String(fd.get("userId") || "").trim();
          if (!text) return;
          let res = { ok: false, error: "" };
          if (kind === "note" && userId) res = await sendJson(`/api/admin/users/${encodeURIComponent(userId)}`, "PATCH", { addNote: text });
          else if (kind === "reply" && userId) res = await sendJson("/api/admin/chat", "POST", { userId, message: text });
          else res = await sendJson("/api/admin/calendar", "POST", { body: text, remindAt: new Date(Date.now() + 3600000).toISOString(), userId: userId || undefined });
          setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
          if (res.ok) event.currentTarget.reset();
        }}>
          <label className="c4-lab"><span>{v4("quickCreate")}</span>
            <select className="c4-select" name="kind" aria-label={v4("quickCreate")}>
              <option value="reminder">reminder</option>
              <option value="note">note</option>
              <option value="reply">reply</option>
            </select>
          </label>
          <input className="c4-field" name="userId" aria-label={tx("userId")} placeholder={tx("userId")} />
          <input className="c4-field" name="body" required aria-label={tx("description")} />
          <button type="submit" className="c4-btn">{tx("save")}</button>
          {msg && <p className="c4-muted">{msg}</p>}
        </form>
      )}
    </div>
  );
}

export function watchIds(): string[] {
  return readJson<string[]>(WATCH_KEY, []);
}

export function toggleWatch(id: string) {
  const current = watchIds();
  writeJson(WATCH_KEY, current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}

export function WatchAlerts({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const ids = watchIds();
  const watched = rows.filter((row) => ids.includes(row.id));
  const [alerts, setAlerts] = useState<{ id: string; name: string; kind: string }[]>([]);
  const watchKey = rows.map((row) => `${row.id}:${row.balance ?? ""}:${row.saleStatus ?? ""}`).join("|");
  useEffect(() => {
    const ids = watchIds();
    const picked = rows.filter((row) => ids.includes(row.id));
    const prev = readJson<Record<string, { balance: number; status: string }>>(SNAP_KEY, {});
    const diffs = Object.keys(prev).length ? watchDiffs(prev, picked.map((row) => ({ id: row.id, name: row.name, balance: row.balance ?? row.account?.balance, saleStatus: row.saleStatus }))) : [];
    const next: Record<string, { balance: number; status: string }> = { ...prev };
    for (const row of picked) next[row.id] = { balance: Number(row.balance ?? row.account?.balance) || 0, status: row.saleStatus || "" };
    writeJson(SNAP_KEY, next);
    setAlerts(diffs);
  }, [watchKey, rows]);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("watchlist")} {watched.length}</h3></div>
      {alerts.map((row) => <p key={`${row.id}-${row.kind}`} className="c4-pad">{row.name} · {row.kind}</p>)}
      {!alerts.length && <p className="c4-muted c4-pad">{v4("watchlist")}</p>}
    </section>
  );
}

export function ExposureAlert({ v4 }: { v4: V4 }) {
  const data = useJson<{ positions?: { symbol?: string; volume?: number; status?: string }[] }>("/api/admin/positions?status=OPEN&take=80");
  const [limit, setLimit] = useState(0);
  useEffect(() => { setLimit(Number(readJson(LIMIT_KEY, 0)) || 0); }, []);
  const hot = overThreshold(exposureBySymbol(data.data?.positions || []), limit);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("exposureLimit")}</h3></div>
      <label className="c4-lab c4-pad"><span>{v4("exposureLimit")}</span>
        <input className="c4-field" type="number" min={0} value={limit || ""} aria-label={v4("exposureLimit")} onChange={(event) => {
          const next = Number(event.target.value) || 0;
          setLimit(next);
          writeJson(LIMIT_KEY, next);
        }} />
      </label>
      {hot.map((row) => <p key={row.symbol} className="c4-pad">{row.symbol} · {row.exposure.toFixed(2)}</p>)}
    </section>
  );
}

export function SymbolDrill({ v4 }: { v4: V4 }) {
  const data = useJson<{ positions?: { symbol?: string; traderName?: string; user?: { name?: string }; status?: string }[] }>("/api/admin/positions?status=OPEN&take=80");
  const rows = (data.data?.positions || []).filter((row) => !row.status || row.status === "OPEN");
  const symbols = Array.from(new Set(rows.map((row) => row.symbol || "—")));
  const [symbol, setSymbol] = useState(symbols[0] || "");
  const holders = holdersOf(rows, symbol || symbols[0] || "");
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("symbolHolders")}</h3></div>
      <select className="c4-select" aria-label={v4("symbolHolders")} value={symbol || symbols[0] || ""} onChange={(event) => setSymbol(event.target.value)}>
        {symbols.map((item) => <option key={item}>{item}</option>)}
      </select>
      {holders.map((row, index) => <p key={`${row.symbol}-${index}`} className="c4-pad">{row.traderName || row.user?.name || "—"}</p>)}
    </section>
  );
}

export function PositionAge({ v4 }: { v4: V4 }) {
  const data = useJson<{ positions?: { openedAt?: string; status?: string }[] }>("/api/admin/positions?status=OPEN&take=80");
  const buckets = ageBuckets((data.data?.positions || []).map((row) => row.openedAt));
  return (
    <section className="c4-card c4-chart">
      <div className="c4-card-h"><h3 className="c4-title">{v4("positionAge")}</h3></div>
      {buckets.map((row) => <p key={row.label} className="c4-pad c4-tip" data-tip={row.label}>{row.label} · {row.count}</p>)}
    </section>
  );
}

export function PnlMovers({ v4 }: { v4: V4 }) {
  const data = useJson<{ positions?: { id: string; symbol?: string; profit?: number; traderName?: string; status?: string }[] }>("/api/admin/positions?status=OPEN&take=80");
  const rows = pnlMovers(data.data?.positions || []);
  return (
    <section className="c4-card">
      <div className="c4-card-h"><h3 className="c4-title">{v4("pnlMovers")}</h3></div>
      {rows.map((row) => <p key={row.id} className={Number(row.profit) >= 0 ? "c4-pl-pos c4-pad" : "c4-pl-neg c4-pad"}>{row.symbol} · {row.traderName || "—"} · {row.profit}</p>)}
    </section>
  );
}

export function RatioCard({ id, v4 }: { id: string; v4: V4 }) {
  const data = useJson<{ transactions?: { amount?: number; type?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=40`);
  let deposits = 0;
  let withdrawals = 0;
  for (const row of data.data?.transactions || []) {
    const type = String(row.type || "").toUpperCase();
    const amount = Math.abs(Number(row.amount) || 0);
    if (type.includes("WITHDRAW")) withdrawals += amount;
    else if (type.includes("DEPOSIT")) deposits += amount;
  }
  const ratio = withdrawRatio(deposits, withdrawals);
  return <p className="c4-pad">{v4("wdRatio")} {ratio == null ? "—" : ratio}</p>;
}

export function CohortTable({ rows, v4, locale }: { rows: UserRow[]; v4: V4; locale: string }) {
  const table = cohortLtv(rows.map((row) => ({ createdAt: row.createdAt, balance: row.balance ?? row.account?.balance })));
  return (
    <section className="c4-card c4-chart">
      <div className="c4-card-h"><h3 className="c4-title">{v4("cohortLtv")}</h3></div>
      <table className="c4-table"><tbody>
        {table.slice(-6).map((row) => <tr key={row.month}><td>{row.month}</td><td>{row.traders}</td><td>{money(row.balance, "USD", locale)}</td></tr>)}
      </tbody></table>
    </section>
  );
}

export function AgentChart({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const agents = agentTotals(rows.map((row) => ({ assigneeName: row.assigneeName, balance: row.balance ?? row.account?.balance, ftd: row.ftd }))).slice(0, 5);
  const max = Math.max(1, ...agents.map((row) => row.balance));
  return (
    <section className="c4-card c4-chart">
      <div className="c4-card-h"><h3 className="c4-title">{v4("agentCompare")}</h3></div>
      {agents.map((row) => (
        <div key={row.name} className="c4-chart-row" title={`${row.name} · ${row.ftd}`}>
          <span>{row.name}</span>
          <i style={{ width: `${Math.max(8, (row.balance / max) * 100)}%` }} />
        </div>
      ))}
    </section>
  );
}

export function DeskChart({ rows, v4 }: { rows: UserRow[]; v4: V4 }) {
  const desks = deskTotals(rows.map((row) => ({ desk: row.desk, balance: row.balance ?? row.account?.balance }))).slice(0, 5);
  const max = Math.max(1, ...desks.map((row) => row.balance));
  return (
    <section className="c4-card c4-chart">
      <div className="c4-card-h"><h3 className="c4-title">{v4("deskTrend")}</h3></div>
      {desks.map((row) => (
        <div key={row.desk} className="c4-chart-row" title={`${row.desk} · ${row.traders}`}>
          <span>{row.desk}</span>
          <i style={{ width: `${Math.max(8, (row.balance / max) * 100)}%` }} />
        </div>
      ))}
    </section>
  );
}

export function readBoards(): { name: string; span: number }[] {
  return readJson(BOARD_KEY, []);
}

export function BoardSaver({ v4 }: { v4: V4 }) {
  const [name, setName] = useState("");
  const [boards, setBoards] = useState<{ name: string; span: number }[]>([]);
  const [span, setSpan] = useState(1);
  useEffect(() => { setBoards(readBoards()); }, []);
  return (
    <section className="c4-card" data-span={span}>
      <div className="c4-card-h"><h3 className="c4-title">{v4("savedBoards")}</h3></div>
      <div className="c4-row c4-pad">
        <input className="c4-field" aria-label={v4("savedBoards")} value={name} onChange={(event) => setName(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => {
          const label = name.trim();
          if (!label) return;
          const next = [...boards.filter((row) => row.name !== label), { name: label, span }];
          setBoards(next);
          writeJson(BOARD_KEY, next);
          setName("");
        }}>{v4("savedBoards")}</button>
        <button type="button" className="c4-chip" data-on={span === 2 ? "1" : "0"} onClick={() => setSpan(span === 2 ? 1 : 2)}>{v4("widgetSpan")}</button>
      </div>
      {boards.map((row) => <button key={row.name} type="button" className="c4-chip" onClick={() => setSpan(row.span)}>{row.name}</button>)}
    </section>
  );
}

export function storedFont(): "sm" | "md" | "lg" {
  const value = typeof window === "undefined" ? "md" : window.localStorage.getItem(FONT_KEY);
  return value === "sm" || value === "lg" ? value : "md";
}

export function storedContrast(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(CONTRAST_KEY) === "1";
}

export function storedFreeze(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(FREEZE_KEY) === "1";
}

export function themeMode(): "system" | "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const value = window.localStorage.getItem(THEME_KEY);
  if (value === "system" || value === "dark" || value === "light") return value;
  const legacy = window.localStorage.getItem("crmv4-theme");
  if (legacy === "dark" || legacy === "light") return legacy;
  return "light";
}

export function resolvedTheme(mode: "system" | "light" | "dark"): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function DeskPrefs({ v4 }: { v4: V4 }) {
  const [font, setFont] = useState<"sm" | "md" | "lg">("md");
  const [contrast, setContrast] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [mode, setMode] = useState<"system" | "light" | "dark">("light");
  useEffect(() => {
    setFont(storedFont());
    setContrast(storedContrast());
    setFreeze(storedFreeze());
    setMode(themeMode());
  }, []);
  return (
    <div className="c4-stack">
      <label className="c4-lab"><span>{v4("fontScale")}</span>
        <select className="c4-select" aria-label={v4("fontScale")} value={font} onChange={(event) => {
          const next = event.target.value === "sm" || event.target.value === "lg" ? event.target.value : "md";
          setFont(next);
          window.localStorage.setItem(FONT_KEY, next);
          window.dispatchEvent(new CustomEvent("crmv4:font", { detail: next }));
        }}>
          <option value="sm">S</option>
          <option value="md">M</option>
          <option value="lg">L</option>
        </select>
      </label>
      <button type="button" className="c4-chip" data-on={contrast ? "1" : "0"} onClick={() => {
        const next = !contrast;
        setContrast(next);
        window.localStorage.setItem(CONTRAST_KEY, next ? "1" : "0");
        window.dispatchEvent(new CustomEvent("crmv4:contrast", { detail: next }));
      }}>{v4("contrast")}</button>
      <button type="button" className="c4-chip" data-on={freeze ? "1" : "0"} onClick={() => {
        const next = !freeze;
        setFreeze(next);
        window.localStorage.setItem(FREEZE_KEY, next ? "1" : "0");
        window.dispatchEvent(new CustomEvent("crmv4:freeze", { detail: next }));
      }}>{v4("freezeCol")}</button>
      <button type="button" className="c4-chip" data-on={mode === "system" ? "1" : "0"} onClick={() => {
        const next = mode === "system" ? "light" : "system";
        setMode(next);
        window.localStorage.setItem(THEME_KEY, next);
        window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: next }));
      }}>{v4("themeSystem")}</button>
    </div>
  );
}

export function emptySuggestions(base: string) {
  return ["customers", "finance", "positions", "support"].map((path) => ({ href: crmv4Href(base, path), label: path }));
}
