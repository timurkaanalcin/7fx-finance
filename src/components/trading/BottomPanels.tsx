"use client";

import { useEffect, useMemo, useState, useCallback, type ReactNode, type ReactElement, type MouseEvent as ReactMouseEvent } from "react";
import { calcPipDistance, formatPrice, getSymbol } from "@/lib/symbols";
import { fmtDateTime, fmtNum } from "@/lib/format";
import type { OrderRow, PositionRow, PriceTick } from "./types";
import PnlCalendar, { closedDayKey } from "./PnlCalendar";
import AccountStatement from "./AccountStatement";
import { useI18n } from "@/lib/i18n/context";

type Tab = "open" | "closed" | "pending";
type SideFilter = "ALL" | "BUY" | "SELL";
type ResultFilter = "ALL" | "PROFIT" | "LOSS";
type PeriodFilter = "ALL" | "TODAY" | "7D" | "30D";

function csvCell(v: unknown): string {
  if (v == null) return "";
  const str = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "") : String(v);
  if (/[",\r\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function localDateStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function downloadCsv(filename: string, header: string[], rows: unknown[][]) {
  if (typeof window === "undefined") return;
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function periodCutoff(period: PeriodFilter): Date | null {
  if (period === "ALL") return null;
  const today = startOfLocalDay();
  if (period === "TODAY") return today;
  const days = period === "7D" ? 7 : 30;
  const cut = new Date(today);
  cut.setDate(cut.getDate() - (days - 1));
  return cut;
}

function matchesPeriod(iso: string | null | undefined, period: PeriodFilter): boolean {
  const cut = periodCutoff(period);
  if (!cut) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= cut.getTime();
}

function matchesSymbol(
  symbol: string,
  chartSymbol: string | null | undefined,
  q: string
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (symbol.toLowerCase().includes(needle)) return true;
  if (chartSymbol && chartSymbol.toLowerCase().includes(needle)) return true;
  return false;
}

/** Short ticket shown in UI (last 8 chars of id, upper-case) — searchable as displayed. */
function ticketLabel(id: string): string {
  return `#${String(id).slice(-8).toUpperCase()}`;
}

/**
 * Click-to-copy ticket chip: shows the short ticket, copies the FULL id.
 * Uses a real <button> (Enter/Space for free) and stops propagation so row/card actions don't fire.
 */
function CopyTicket({
  id,
  variant = "card",
}: {
  id: string;
  variant?: "card" | "table";
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);
  const onClick = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      const full = String(id);
      let ok = false;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(full);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        try {
          const ta = document.createElement("textarea");
          ta.value = full;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {
          ok = false;
        }
      }
      if (ok) setCopied(true);
    },
    [id]
  );
  const title = copied ? "Kopyalandı · Copied" : `Bileti kopyala · Copy ticket (${id})`;
  const sizeCls =
    variant === "table"
      ? "text-[9px] px-0.5 -mx-0.5 py-px"
      : "text-[9.5px] min-h-[28px] px-1.5 -mx-1 py-1 touch-manipulation";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-0.5 rounded-[5px] font-mono transition-colors hover:bg-desk-hover/70 hover:text-desk-text focus:outline-none focus-visible:ring-1 focus-visible:ring-desk-accent/60 ${sizeCls} ${
        copied ? "text-desk-buy opacity-100" : "opacity-80"
      }`}
    >
      {copied ? (
        <>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
            <path d="M5 12l5 5L20 7" />
          </svg>
          <span>Kopyalandı</span>
        </>
      ) : (
        <span>{ticketLabel(id)}</span>
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Kopyalandı · Copied" : ""}
      </span>
    </button>
  );
}

/**
 * Case-insensitive substring match on ticket / order id (full id, displayed
 * short ticket with or without "#") and any comment / note text on the row.
 */
function matchesTicketText(row: { id: string } & Record<string, unknown>, q: string): boolean {
  const needle = q.trim().toLowerCase().replace(/^#+/, "");
  if (!needle) return true;
  const id = String(row.id ?? "").toLowerCase();
  if (id.includes(needle)) return true;
  if (ticketLabel(String(row.id ?? "")).toLowerCase().includes(needle)) return true;
  for (const key of ["comment", "note", "notes", "ticket", "orderId", "positionId"]) {
    const v = row[key];
    if (v == null) continue;
    if (String(v).toLowerCase().includes(needle)) return true;
  }
  return false;
}

function matchesSide(side: string, filter: SideFilter): boolean {
  if (filter === "ALL") return true;
  return side.toUpperCase() === filter;
}

function filterPositions(
  rows: PositionRow[],
  opts: {
    side: SideFilter;
    symbolQ: string;
    period: PeriodFilter;
    textQ?: string;
    result?: ResultFilter;
  }
): PositionRow[] {
  return rows.filter((p) => {
    if (!matchesSide(p.side, opts.side)) return false;
    if (opts.textQ && !matchesTicketText(p as PositionRow & Record<string, unknown>, opts.textQ))
      return false;
    if (!matchesSymbol(p.symbol, p.chartSymbol, opts.symbolQ)) return false;
    if (!matchesPeriod(p.openedAt, opts.period)) return false;
    if (opts.result && opts.result !== "ALL") {
      const pnl = p.closeProfit ?? p.profit;
      if (opts.result === "PROFIT" && !(pnl > 0)) return false;
      if (opts.result === "LOSS" && !(pnl < 0)) return false;
    }
    return true;
  });
}

function filterOrders(
  rows: OrderRow[],
  opts: { side: SideFilter; symbolQ: string; period: PeriodFilter; textQ?: string }
): OrderRow[] {
  return rows.filter((o) => {
    if (!matchesSide(o.side, opts.side)) return false;
    if (opts.textQ && !matchesTicketText(o as OrderRow & Record<string, unknown>, opts.textQ))
      return false;
    if (!matchesSymbol(o.symbol, undefined, opts.symbolQ)) return false;
    if (!matchesPeriod(o.createdAt, opts.period)) return false;
    return true;
  });
}

type SortDir = "asc" | "desc";
type SortKey = "symbol" | "side" | "type" | "profit" | "time";
type SortState = { key: SortKey; dir: SortDir } | null;

function cycleSort(prev: SortState, key: SortKey): SortState {
  if (!prev || prev.key !== key) return { key, dir: "asc" };
  if (prev.dir === "asc") return { key, dir: "desc" };
  return null;
}

function cmpStr(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function cmpNum(a: number, b: number): number {
  const an = Number.isFinite(a) ? a : 0;
  const bn = Number.isFinite(b) ? b : 0;
  return an - bn;
}

function cmpTime(a: string | null | undefined, b: string | null | undefined): number {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  const aa = Number.isFinite(ta) ? ta : 0;
  const bb = Number.isFinite(tb) ? tb : 0;
  return aa - bb;
}

function sortPositions(rows: PositionRow[], sort: SortState, mode: "open" | "closed"): PositionRow[] {
  if (!sort) return rows;
  const mul = sort.dir === "asc" ? 1 : -1;
  const out = rows.slice();
  out.sort((a, b) => {
    let d = 0;
    if (sort.key === "symbol") d = cmpStr(a.symbol, b.symbol);
    else if (sort.key === "side") d = cmpStr(a.side, b.side);
    else if (sort.key === "profit") {
      const pa = mode === "closed" ? Number(a.closeProfit ?? a.profit) : Number(a.profit);
      const pb = mode === "closed" ? Number(b.closeProfit ?? b.profit) : Number(b.profit);
      d = cmpNum(pa, pb);
    } else if (sort.key === "time") {
      d =
        mode === "closed"
          ? cmpTime(a.closedAt ?? a.openedAt, b.closedAt ?? b.openedAt)
          : cmpTime(a.openedAt, b.openedAt);
    }
    return d * mul;
  });
  return out;
}

function sortOrders(rows: OrderRow[], sort: SortState): OrderRow[] {
  if (!sort) return rows;
  const mul = sort.dir === "asc" ? 1 : -1;
  const out = rows.slice();
  out.sort((a, b) => {
    let d = 0;
    if (sort.key === "symbol") d = cmpStr(a.symbol, b.symbol);
    else if (sort.key === "side") d = cmpStr(a.side, b.side);
    else if (sort.key === "type") d = cmpStr(a.type, b.type);
    else if (sort.key === "time") d = cmpTime(a.createdAt, b.createdAt);
    return d * mul;
  });
  return out;
}

function SortTh({
  label,
  col,
  sort,
  onSort,
  className = "",
}: {
  label: string;
  col: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}): ReactElement {
  const active = sort?.key === col;
  const indicator = active ? (sort!.dir === "asc" ? " ▲" : " ▼") : "";
  return (
    <th className={`px-2 py-2 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-0.5 rounded px-0.5 -mx-0.5 font-medium uppercase tracking-wider transition-colors hover:text-desk-text ${
          active ? "text-desk-text" : "text-desk-muted"
        }`}
        aria-label={`Sort by ${label}${active ? `, ${sort!.dir}ending` : ""}`}
      >
        {label}
        <span className="tabular-nums text-[8px] opacity-80" aria-hidden>
          {indicator || " "}
        </span>
      </button>
    </th>
  );
}


function Chip({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "buy" | "sell" | "neutral";
}) {
  const activeCls =
    tone === "buy"
      ? "border-desk-buy/50 bg-desk-buy/15 text-desk-buy"
      : tone === "sell"
        ? "border-desk-sell/50 bg-desk-sell/15 text-desk-sell"
        : "border-desk-accent/50 bg-desk-accent/15 text-desk-text";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[7px] border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
        active
          ? activeCls
          : "border-desk-border bg-desk-elev/40 text-desk-muted hover:bg-desk-hover hover:text-desk-text"
      }`}
    >
      {children}
    </button>
  );
}

type Props = {
  tab: Tab;
  onTab: (t: Tab) => void;
  openPositions: PositionRow[];
  closedPositions: PositionRow[];
  pendingOrders: OrderRow[];
  onClosePosition: (id: string, volume?: number) => void;
  /** Close several open positions (one refresh at end). */
  onClosePositions?: (ids: string[]) => Promise<void> | void;
  /** Edit SL/TP on an open position without closing. */
  onModifySlTp?: (
    id: string,
    levels: { stopLoss: number | null; takeProfit: number | null }
  ) => void | Promise<void>;
  onCancelOrder: (id: string) => void;
  /** Cancel several pending orders (one refresh at end). */
  onCancelOrders?: (ids: string[]) => Promise<void> | void;
  /** Switch chart to position chartSymbol || symbol */
  onSelectSymbol?: (symbol: string) => void;
  /** Account currency (statement totals label). */
  currency?: string;
  /** Live prices (for pending-order distance to trigger). */
  prices?: Record<string, PriceTick>;
  className?: string;
};

function moneyCls(n: number) {
  if (n > 0) return "text-desk-buy";
  if (n < 0) return "text-desk-sell";
  return "text-desk-muted";
}

function SummaryStat({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <span className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">
        {label}
      </span>
      <span className={`truncate text-[12px] font-bold tabular-nums ${className}`}>{children}</span>
    </div>
  );
}

/** Tiny cumulative P&L curve (equity-style) for the closed-trades summary strip. */
function PnlSparkline({ values }: { values: number[] }) {
  const W = 96;
  const H = 22;
  const pad = 2;
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1] ?? 0;
  const tone = last > 0 ? "text-desk-buy" : last < 0 ? "text-desk-sell" : "text-desk-muted";
  const zy = y(0).toFixed(1);
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={`shrink-0 ${tone}`}
      role="img"
      aria-label={`Kümülatif K/Z eğrisi, son değer ${last.toFixed(2)}`}
    >
      <line x1={pad} x2={W - pad} y1={zy} y2={zy} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 2" strokeWidth={1} />
      <polygon points={`${x(0).toFixed(1)},${zy} ${pts} ${x(values.length - 1).toFixed(1)},${zy}`} fill="currentColor" fillOpacity={0.12} />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={1.8} fill="currentColor" />
    </svg>
  );
}

const DEFAULT_VOLUME_STEP = 0.01;

function snapLot(vol: number, step = DEFAULT_VOLUME_STEP): number {
  if (!Number.isFinite(vol) || vol <= 0) return step;
  if (!(step > 0)) return Math.round(vol * 100) / 100;
  const steps = Math.round(vol / step);
  return Math.max(step, Math.round(steps * step * 1e8) / 1e8);
}

function lotPreset(full: number, pct: number, step = DEFAULT_VOLUME_STEP): number {
  if (pct >= 100) return snapLot(full, step);
  return snapLot(full * (pct / 100), step);
}

/* ---------- Holding time (open positions) ---------- */

function fmtHoldTime(fromIso: string | Date | null | undefined, now: number): string {
  if (!fromIso) return "";
  const start = new Date(fromIso).getTime();
  if (!Number.isFinite(start)) return "";
  const sec = Math.max(0, Math.floor((now - start) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ${min % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

/** Live "time held" label; re-renders every 5s for the first minute, then every 30s. */
function HoldTime({
  openedAt,
  className = "",
}: {
  openedAt: string | Date | null | undefined;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  const start = openedAt ? new Date(openedAt).getTime() : NaN;
  const young = Number.isFinite(start) && now - start < 60_000;
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), young ? 5_000 : 30_000);
    return () => window.clearInterval(id);
  }, [young]);
  const label = fmtHoldTime(openedAt, now);
  if (!label) return null;
  return (
    <span
      suppressHydrationWarning
      title="Açık kalma süresi · Time held"
      className={`tabular-nums text-desk-muted ${className}`}
    >
      ⏱ {label}
    </span>
  );
}

/* ---------- SL/TP quick presets (input-only; user still presses Save) ---------- */

function symbolPipSize(symbol: string): number {
  const def = getSymbol(symbol);
  if (def && Number.isFinite(def.pipSize) && def.pipSize > 0) return def.pipSize;
  const digits = def?.digits ?? 5;
  // Fallback: forex-style pip = one digit above the last quoted decimal.
  return digits >= 3 ? Math.pow(10, -(digits - 1)) : Math.pow(10, -digits);
}

const PIP_PRESETS = [10, 20, 50] as const;

/** Absolute distance (pips) from current market price to an SL/TP level; null if unset/invalid. */
function levelDistancePips(p: PositionRow, level: number | null | undefined): number | null {
  if (level == null || !Number.isFinite(level) || level <= 0) return null;
  const ref = Number.isFinite(p.currentPrice) && p.currentPrice > 0 ? p.currentPrice : p.openPrice;
  const size = symbolPipSize(p.symbol);
  if (!Number.isFinite(ref) || !(size > 0)) return null;
  return Math.abs(ref - level) / size;
}

/** Small "SL 12.3p" / "TP 45.0p" distance-to-level hint (client-only display). */
function LevelDistance({ p, kind, className = "" }: { p: PositionRow; kind: "sl" | "tp"; className?: string }) {
  const d = levelDistancePips(p, kind === "sl" ? p.stopLoss : p.takeProfit);
  if (d == null) return null;
  return (
    <span
      className={`tabular-nums text-[9.5px] ${kind === "sl" ? "text-desk-sell/80" : "text-desk-buy/90"} ${className}`}
      title={kind === "sl" ? "Stop Loss seviyesine uzaklık (güncel fiyattan, pip)" : "Take Profit seviyesine uzaklık (güncel fiyattan, pip)"}
    >
      {kind === "sl" ? "SL" : "TP"} {fmtNum(d, 1)}p
    </span>
  );
}

/** Live mid (or bid/ask fallback) for a symbol from the price map. */
function liveMid(prices: Record<string, PriceTick> | undefined, symbol: string): number | null {
  if (!prices) return null;
  const t = prices[symbol];
  if (!t) return null;
  if (Number.isFinite(t.mid) && t.mid > 0) return t.mid;
  if (Number.isFinite(t.bid) && Number.isFinite(t.ask) && t.bid > 0 && t.ask > 0) return (t.bid + t.ask) / 2;
  if (Number.isFinite(t.bid) && t.bid > 0) return t.bid;
  if (Number.isFinite(t.ask) && t.ask > 0) return t.ask;
  return null;
}

/** Absolute distance (pips) from current market to pending order trigger; null if unknown. */
function pendingTriggerDistancePips(
  o: OrderRow,
  prices: Record<string, PriceTick> | undefined
): number | null {
  const trigger = o.price != null && Number.isFinite(o.price) && o.price > 0
    ? o.price
    : o.openPrice != null && Number.isFinite(o.openPrice) && o.openPrice > 0
      ? o.openPrice
      : null;
  if (trigger == null) return null;
  const mid = liveMid(prices, o.symbol);
  if (mid == null) return null;
  const size = symbolPipSize(o.symbol);
  if (!(size > 0)) return null;
  return Math.abs(mid - trigger) / size;
}

/** "12.3 pip" distance-to-trigger hint for pending orders (client-only). */
function PendingTriggerDistance({
  o,
  prices,
  className = "",
}: {
  o: OrderRow;
  prices?: Record<string, PriceTick>;
  className?: string;
}) {
  const d = pendingTriggerDistancePips(o, prices);
  if (d == null) return <span className={`tabular-nums text-[9.5px] text-desk-muted/60 ${className}`}>—</span>;
  return (
    <span
      className={`tabular-nums text-[9.5px] text-desk-accent/90 ${className}`}
      title="Tetik fiyatına uzaklık (güncel piyasadan, pip) · Distance to trigger"
    >
      {fmtNum(d, 1)} pip
    </span>
  );
}

/**
 * Price `pips` away from reference in the protective (SL) or profit (TP) direction.
 * BUY: SL below, TP above. SELL: SL above, TP below.
 */
function pipOffsetPrice(
  p: PositionRow,
  kind: "sl" | "tp",
  pips: number
): string {
  const ref = Number.isFinite(p.currentPrice) && p.currentPrice > 0 ? p.currentPrice : p.openPrice;
  const dist = pips * symbolPipSize(p.symbol);
  const isBuy = p.side === "BUY";
  const down = kind === "sl" ? isBuy : !isBuy;
  const price = down ? ref - dist : ref + dist;
  return formatPrice(p.symbol, Math.max(0, price));
}

/** Breakeven is only accepted by the server when the position is already in profit. */
function breakevenAllowed(p: PositionRow): boolean {
  if (!Number.isFinite(p.currentPrice) || !(p.currentPrice > 0)) return false;
  return p.side === "BUY" ? p.openPrice < p.currentPrice : p.openPrice > p.currentPrice;
}

function QuickChip({
  onClick,
  children,
  title,
  disabled,
  tone = "neutral",
  size = "md",
}: {
  onClick: () => void;
  children: ReactNode;
  title?: string;
  disabled?: boolean;
  tone?: "neutral" | "buy" | "sell" | "accent";
  size?: "sm" | "md";
}) {
  const toneCls =
    tone === "buy"
      ? "text-desk-buy border-desk-buy/30 hover:bg-desk-buy/10"
      : tone === "sell"
        ? "text-desk-sell border-desk-sell/30 hover:bg-desk-sell/10"
        : tone === "accent"
          ? "text-desk-text border-desk-accent/40 hover:bg-desk-accent/10"
          : "text-desk-muted border-desk-border/50 hover:text-desk-text hover:bg-desk-hover";
  const sizeCls =
    size === "sm" ? "rounded px-1 py-0 text-[8.5px]" : "rounded-[6px] px-1.5 py-0.5 text-[9.5px]";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`border bg-desk-elev/50 font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${toneCls} ${sizeCls}`}
    >
      {children}
    </button>
  );
}

function SlQuickChips({
  p,
  onSet,
  size = "md",
}: {
  p: PositionRow;
  onSet: (v: string) => void;
  size?: "sm" | "md";
}) {
  const beOk = breakevenAllowed(p);
  return (
    <div className="mt-1 flex flex-wrap gap-0.5">
      <QuickChip
        size={size}
        tone="accent"
        disabled={!beOk}
        onClick={() => onSet(formatPrice(p.symbol, p.openPrice))}
        title={
          beOk
            ? "Başabaş: SL = açılış fiyatı · Breakeven: SL at open price"
            : "Başabaş için pozisyon kârda olmalı · Position must be in profit for breakeven"
        }
      >
        BE
      </QuickChip>
      {PIP_PRESETS.map((n) => (
        <QuickChip
          key={n}
          size={size}
          tone="sell"
          onClick={() => onSet(pipOffsetPrice(p, "sl", n))}
          title={`SL ${n} pip (güncel fiyattan · from current price)`}
        >
          {p.side === "BUY" ? "−" : "+"}
          {n}
        </QuickChip>
      ))}
      <QuickChip size={size} onClick={() => onSet("")} title="SL temizle · Clear SL">
        ✕
      </QuickChip>
    </div>
  );
}

function TpQuickChips({
  p,
  onSet,
  size = "md",
}: {
  p: PositionRow;
  onSet: (v: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-0.5">
      {PIP_PRESETS.map((n) => (
        <QuickChip
          key={n}
          size={size}
          tone="buy"
          onClick={() => onSet(pipOffsetPrice(p, "tp", n))}
          title={`TP ${n} pip (güncel fiyattan · from current price)`}
        >
          {p.side === "BUY" ? "+" : "−"}
          {n}
        </QuickChip>
      ))}
      <QuickChip size={size} onClick={() => onSet("")} title="TP temizle · Clear TP">
        ✕
      </QuickChip>
    </div>
  );
}

function OpenCard({
  p,
  onClose,
  onModifySlTp,
  onSelectSymbol,
}: {
  p: PositionRow;
  onSelectSymbol?: (symbol: string) => void;
  onClose: (id: string, volume?: number) => void;
  onModifySlTp?: (
    id: string,
    levels: { stopLoss: number | null; takeProfit: number | null }
  ) => void | Promise<void>;
}) {
  const [closeOpen, setCloseOpen] = useState(false);
  const [editSlTp, setEditSlTp] = useState(false);
  const [closeVol, setCloseVol] = useState(String(p.volume));
  const [slInput, setSlInput] = useState(p.stopLoss != null ? String(p.stopLoss) : "");
  const [tpInput, setTpInput] = useState(p.takeProfit != null ? String(p.takeProfit) : "");
  const [busy, setBusy] = useState(false);
  const pip =
    calcPipDistance(p.symbol, p.openPrice, p.currentPrice) *
    (p.side === "BUY" ? 1 : -1);

  const openClosePanel = () => {
    setEditSlTp(false);
    setCloseVol(String(snapLot(p.volume)));
    setCloseOpen(true);
  };

  const openEditPanel = () => {
    setCloseOpen(false);
    setSlInput(p.stopLoss != null ? String(p.stopLoss) : "");
    setTpInput(p.takeProfit != null ? String(p.takeProfit) : "");
    setEditSlTp(true);
  };

  const confirmClose = async () => {
    const v = Number(closeVol);
    if (!Number.isFinite(v) || v <= 0) return;
    const vol = snapLot(Math.min(v, p.volume));
    setBusy(true);
    try {
      if (vol >= p.volume - 1e-9) onClose(p.id);
      else onClose(p.id, vol);
      setCloseOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const saveSlTp = async () => {
    if (!onModifySlTp) return;
    const slRaw = slInput.trim();
    const tpRaw = tpInput.trim();
    const stopLoss = slRaw === "" ? null : Number(slRaw);
    const takeProfit = tpRaw === "" ? null : Number(tpRaw);
    if (stopLoss != null && !Number.isFinite(stopLoss)) return;
    if (takeProfit != null && !Number.isFinite(takeProfit)) return;
    setBusy(true);
    try {
      await onModifySlTp(p.id, { stopLoss, takeProfit });
      setEditSlTp(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-desk-border/60 bg-desk-elev/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[13px] font-bold tracking-tight text-desk-text hover:underline"
              onClick={() =>
                onSelectSymbol?.((p.chartSymbol || p.symbol).trim().toUpperCase())
              }
              title="Show chart"
            >
              {p.symbol}
              {p.chartSymbol && p.chartSymbol !== p.symbol ? (
                <span className="ml-1 text-[10px] font-normal text-desk-muted">
                  ({p.chartSymbol})
                </span>
              ) : null}
            </button>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                p.side === "BUY"
                  ? "bg-desk-buy/15 text-desk-buy"
                  : "bg-desk-sell/15 text-desk-sell"
              }`}
            >
              {p.side === "BUY" ? "AL" : "SAT"}
            </span>
            <span className="text-[11px] tabular-nums text-desk-muted">
              {fmtNum(p.volume, 2)} lot
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-desk-muted">
            <span>{fmtDateTime(p.openedAt)}</span>
            <CopyTicket id={p.id} />
            <HoldTime openedAt={p.openedAt} className="rounded-[5px] bg-desk-bg/60 px-1 py-px text-[9.5px]" />
          </div>
        </div>
        <div className="text-right">
          <div className={`text-[14px] font-bold tabular-nums ${moneyCls(p.profit)}`}>
            {fmtNum(p.profit, 2)}
          </div>
          <div className={`text-[10px] tabular-nums ${moneyCls(pip)}`}>
            {fmtNum(pip, 1)} pip
          </div>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Open</div>
          <div className="mt-0.5 font-medium tabular-nums text-desk-text">
            {formatPrice(p.symbol, p.openPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Current</div>
          <div className="mt-0.5 font-medium tabular-nums text-desk-text">
            {formatPrice(p.symbol, p.currentPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">SL / TP</div>
          <div className="mt-0.5 truncate font-medium tabular-nums text-desk-muted">
            {p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}
            {" / "}
            {p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}
          </div>
          {(p.stopLoss != null || p.takeProfit != null) && (
            <div className="mt-0.5 flex flex-wrap gap-x-1.5 leading-tight">
              <LevelDistance p={p} kind="sl" />
              <LevelDistance p={p} kind="tp" />
            </div>
          )}
        </div>
      </div>

      {!closeOpen && !editSlTp && (
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={openClosePanel}
            className="flex-1 rounded-[10px] bg-desk-sell/90 py-2 text-[12px] font-bold text-white hover:bg-desk-sell"
          >
            Close / Kapat
          </button>
          {onModifySlTp && (
            <button
              type="button"
              onClick={openEditPanel}
              className="rounded-[10px] border border-desk-border/70 bg-desk-bg/50 px-3 py-2 text-[11px] font-semibold text-desk-text hover:bg-desk-hover"
              title="Edit SL/TP"
            >
              SL/TP
            </button>
          )}
        </div>
      )}

      {closeOpen && (
        <div className="mt-2.5 rounded-[10px] border border-desk-border/60 bg-desk-bg/50 p-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-desk-muted">
            Volume · Kısmi kapat
          </div>
          <input
            type="number"
            step={DEFAULT_VOLUME_STEP}
            min={DEFAULT_VOLUME_STEP}
            max={p.volume}
            value={closeVol}
            onChange={(e) => setCloseVol(e.target.value)}
            className="mt-1.5 w-full rounded-[8px] border border-desk-border/60 bg-desk-elev px-2 py-1.5 text-[12px] tabular-nums text-desk-text outline-none focus:border-desk-accent"
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setCloseVol(String(lotPreset(p.volume, pct)))}
                className="rounded-[6px] border border-desk-border/50 bg-desk-elev/60 px-2 py-0.5 text-[10px] font-semibold text-desk-muted hover:text-desk-text"
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={confirmClose}
              className="flex-1 rounded-[8px] bg-desk-sell/90 py-1.5 text-[11px] font-bold text-white hover:bg-desk-sell disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCloseOpen(false)}
              className="rounded-[8px] border border-desk-border/60 px-3 py-1.5 text-[11px] font-semibold text-desk-muted hover:text-desk-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editSlTp && (
        <div className="mt-2.5 rounded-[10px] border border-desk-border/60 bg-desk-bg/50 p-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-desk-muted">
            Düzenle · Edit SL / TP
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[9px] text-desk-muted">Stop Loss</span>
              <input
                type="number"
                value={slInput}
                onChange={(e) => setSlInput(e.target.value)}
                placeholder="—"
                className="mt-0.5 w-full rounded-[8px] border border-desk-border/60 bg-desk-elev px-2 py-1.5 text-[12px] tabular-nums text-desk-text outline-none focus:border-desk-accent"
              />
              <SlQuickChips p={p} onSet={setSlInput} />
            </label>
            <label className="block">
              <span className="text-[9px] text-desk-muted">Take Profit</span>
              <input
                type="number"
                value={tpInput}
                onChange={(e) => setTpInput(e.target.value)}
                placeholder="—"
                className="mt-0.5 w-full rounded-[8px] border border-desk-border/60 bg-desk-elev px-2 py-1.5 text-[12px] tabular-nums text-desk-text outline-none focus:border-desk-accent"
              />
              <TpQuickChips p={p} onSet={setTpInput} />
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveSlTp}
              className="flex-1 rounded-[8px] bg-desk-accent py-1.5 text-[11px] font-bold text-desk-accent-ink hover:brightness-110 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditSlTp(false)}
              className="rounded-[8px] border border-desk-border/60 px-3 py-1.5 text-[11px] font-semibold text-desk-muted hover:text-desk-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function OpenRowActions({
  p,
  onClose,
  onModifySlTp,
}: {
  p: PositionRow;
  onClose: (id: string, volume?: number) => void;
  onModifySlTp?: (
    id: string,
    levels: { stopLoss: number | null; takeProfit: number | null }
  ) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"idle" | "close" | "edit">("idle");
  const [closeVol, setCloseVol] = useState(String(p.volume));
  const [slInput, setSlInput] = useState(p.stopLoss != null ? String(p.stopLoss) : "");
  const [tpInput, setTpInput] = useState(p.takeProfit != null ? String(p.takeProfit) : "");
  const [busy, setBusy] = useState(false);

  if (mode === "close") {
    return (
      <div className="min-w-[140px] rounded-[8px] border border-desk-border/60 bg-desk-elev/80 p-1.5 shadow-sm">
        <input
          type="number"
          step={DEFAULT_VOLUME_STEP}
          min={DEFAULT_VOLUME_STEP}
          max={p.volume}
          value={closeVol}
          onChange={(e) => setCloseVol(e.target.value)}
          className="w-full rounded-[6px] border border-desk-border/50 bg-desk-bg px-1.5 py-0.5 text-[10px] tabular-nums text-desk-text outline-none"
        />
        <div className="mt-1 flex flex-wrap gap-0.5">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setCloseVol(String(lotPreset(p.volume, pct)))}
              className="rounded px-1 text-[9px] font-semibold text-desk-muted hover:text-desk-text"
            >
              {pct}%
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              const v = Number(closeVol);
              if (!Number.isFinite(v) || v <= 0) return;
              const vol = snapLot(Math.min(v, p.volume));
              setBusy(true);
              try {
                if (vol >= p.volume - 1e-9) onClose(p.id);
                else onClose(p.id, vol);
                setMode("idle");
              } finally {
                setBusy(false);
              }
            }}
            className="flex-1 rounded-[6px] bg-desk-sell/85 px-1.5 py-0.5 text-[9px] font-bold text-white"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-[6px] px-1.5 py-0.5 text-[9px] font-semibold text-desk-muted"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="min-w-[200px] rounded-[8px] border border-desk-border/60 bg-desk-elev/80 p-1.5 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <div className="min-w-0">
            <input
              type="number"
              value={slInput}
              onChange={(e) => setSlInput(e.target.value)}
              placeholder="SL"
              className="w-full rounded-[6px] border border-desk-border/50 bg-desk-bg px-1.5 py-0.5 text-[10px] tabular-nums text-desk-text outline-none"
            />
            <SlQuickChips p={p} onSet={setSlInput} size="sm" />
          </div>
          <div className="min-w-0">
            <input
              type="number"
              value={tpInput}
              onChange={(e) => setTpInput(e.target.value)}
              placeholder="TP"
              className="w-full rounded-[6px] border border-desk-border/50 bg-desk-bg px-1.5 py-0.5 text-[10px] tabular-nums text-desk-text outline-none"
            />
            <TpQuickChips p={p} onSet={setTpInput} size="sm" />
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <button
            type="button"
            disabled={busy || !onModifySlTp}
            onClick={async () => {
              if (!onModifySlTp) return;
              const slRaw = slInput.trim();
              const tpRaw = tpInput.trim();
              const stopLoss = slRaw === "" ? null : Number(slRaw);
              const takeProfit = tpRaw === "" ? null : Number(tpRaw);
              if (stopLoss != null && !Number.isFinite(stopLoss)) return;
              if (takeProfit != null && !Number.isFinite(takeProfit)) return;
              setBusy(true);
              try {
                await onModifySlTp(p.id, { stopLoss, takeProfit });
                setMode("idle");
              } finally {
                setBusy(false);
              }
            }}
            className="flex-1 rounded-[6px] bg-desk-accent px-1.5 py-0.5 text-[9px] font-bold text-desk-accent-ink"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-[6px] px-1.5 py-0.5 text-[9px] font-semibold text-desk-muted"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setCloseVol(String(snapLot(p.volume)));
          setMode("close");
        }}
        className="rounded-[7px] bg-desk-sell/85 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-desk-sell"
      >
        Close
      </button>
      {onModifySlTp && (
        <button
          type="button"
          onClick={() => {
            setSlInput(p.stopLoss != null ? String(p.stopLoss) : "");
            setTpInput(p.takeProfit != null ? String(p.takeProfit) : "");
            setMode("edit");
          }}
          className="rounded-[7px] border border-desk-border/60 bg-desk-bg/40 px-1.5 py-0.5 text-[10px] font-semibold text-desk-muted hover:text-desk-text"
          title="Düzenle SL/TP"
        >
          ✎
        </button>
      )}
    </div>
  );
}

function ClosedCard({ p }: { p: PositionRow }) {
  const profit = p.closeProfit ?? p.profit;
  return (
    <div className="rounded-[14px] border border-desk-border/60 bg-desk-elev/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-tight text-desk-text">
              {p.symbol}
            </span>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                p.side === "BUY"
                  ? "bg-desk-buy/15 text-desk-buy"
                  : "bg-desk-sell/15 text-desk-sell"
              }`}
            >
              {p.side === "BUY" ? "AL" : "SAT"}
            </span>
            <span className="text-[11px] tabular-nums text-desk-muted">
              {fmtNum(p.volume, 2)} lot
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-desk-muted">
            <span>{fmtDateTime(p.openedAt)}</span>
            <CopyTicket id={p.id} />
          </div>
        </div>
        <div className={`text-[14px] font-bold tabular-nums ${moneyCls(profit)}`}>
          {fmtNum(profit, 2)}
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Open</div>
          <div className="mt-0.5 font-medium tabular-nums">
            {formatPrice(p.symbol, p.openPrice)}
          </div>
        </div>
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Close</div>
          <div className="mt-0.5 font-medium tabular-nums">
            {p.closePrice != null ? formatPrice(p.symbol, p.closePrice) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingCard({
  o,
  onCancel,
  prices,
}: {
  o: OrderRow;
  onCancel: (id: string) => void;
  prices?: Record<string, PriceTick>;
}) {
  return (
    <div className="rounded-[14px] border border-desk-border/60 bg-desk-elev/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-tight text-desk-text">
              {o.symbol}
            </span>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                o.side === "BUY"
                  ? "bg-desk-buy/15 text-desk-buy"
                  : "bg-desk-sell/15 text-desk-sell"
              }`}
            >
              {o.side === "BUY" ? "AL" : "SAT"}
            </span>
            <span className="rounded-[6px] bg-desk-bg px-1.5 py-0.5 text-[10px] font-medium text-desk-muted">
              {o.type}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-desk-muted">
            <span>{fmtDateTime(o.createdAt)}</span>
            <CopyTicket id={o.id} />
          </div>
        </div>
        <div className="text-right text-[12px] font-semibold tabular-nums text-desk-text">
          {fmtNum(o.volume, 2)} lot
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <div className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">Price</div>
          <div className="mt-0.5 font-medium tabular-nums">
            {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
          </div>
          <div className="mt-0.5 leading-tight">
            <PendingTriggerDistance o={o} prices={prices} />
          </div>
        </div>
        <button
          onClick={() => onCancel(o.id)}
          className="rounded-[10px] border border-desk-border bg-desk-elev px-3 py-1.5 text-[11px] font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function BottomPanels({
  tab,
  onTab,
  openPositions,
  closedPositions,
  pendingOrders,
  onClosePosition,
  onClosePositions,
  onModifySlTp,
  onCancelOrder,
  onCancelOrders,
  onSelectSymbol,
  currency,
  prices,
  className = "",
}: Props) {
  const { t } = useI18n();
  // Monthly account statement (Hesap özeti) — client-only, from closed trades
  const [showStatement, setShowStatement] = useState(false);
  const closeStatement = useCallback(() => setShowStatement(false), []);
  const [showFilters, setShowFilters] = useState(false);
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("ALL");
  const [textFilter, setTextFilter] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [openSort, setOpenSort] = useState<SortState>(null);
  const [closedSort, setClosedSort] = useState<SortState>(null);
  const [pendingSort, setPendingSort] = useState<SortState>(null);
  // Open tab: exact-symbol quick filter chip ("" = all)
  const [openSymbolChip, setOpenSymbolChip] = useState("");
  // Closed tab: exact-symbol quick filter chip ("" = all)
  const [closedSymbolChip, setClosedSymbolChip] = useState("");
  // Closed tab: daily P&L calendar (per-device open state) + selected day ("" = all days)
  const [showPnlCal, setShowPnlCal] = useState(false);
  const [closedDay, setClosedDay] = useState("");
  useEffect(() => {
    try {
      if (localStorage.getItem("7fx.pnlCal.open") === "1") setShowPnlCal(true);
    } catch { /* ignore */ }
  }, []);
  const togglePnlCal = useCallback(() => {
    setShowPnlCal((v) => {
      const n = !v;
      try { localStorage.setItem("7fx.pnlCal.open", n ? "1" : "0"); } catch { /* ignore */ }
      return n;
    });
  }, []);


  const tabs: { id: Tab; label: string; shortLabel: string; count?: number }[] = [
    { id: "open", label: "Open Trades", shortLabel: "Open", count: openPositions.length || undefined },
    { id: "closed", label: "Closed", shortLabel: "Closed", count: closedPositions.length || undefined },
    { id: "pending", label: "Pending", shortLabel: "Pending", count: pendingOrders.length || undefined },
  ];

  const filterOpts = useMemo(
    () => ({ side: sideFilter, symbolQ: symbolFilter, period: periodFilter, textQ: textFilter }),
    [sideFilter, symbolFilter, periodFilter, textFilter]
  );

  // Distinct symbols across all open positions (independent of other filters), most positions first
  const openSymbolCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of openPositions) m.set(p.symbol, (m.get(p.symbol) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]));
  }, [openPositions]);
  const showOpenSymbolChips = openSymbolCounts.length >= 2;

  // Drop a stale chip when that symbol has no open positions anymore
  useEffect(() => {
    if (openSymbolChip && !openSymbolCounts.some(([sym]) => sym === openSymbolChip)) {
      setOpenSymbolChip("");
    }
  }, [openSymbolChip, openSymbolCounts]);

  const filteredOpen = useMemo(() => {
    const rows = filterPositions(openPositions, filterOpts);
    return openSymbolChip ? rows.filter((p) => p.symbol === openSymbolChip) : rows;
  }, [openPositions, filterOpts, openSymbolChip]);
  // Calendar input: closed trades after the regular filters (before the day / symbol chips)
  const calendarClosed = useMemo(
    () => filterPositions(closedPositions, { ...filterOpts, result: resultFilter }),
    [closedPositions, filterOpts, resultFilter]
  );
  // Distinct symbols among filtered closed rows (period/result/text), most first
  const closedSymbolCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of calendarClosed) m.set(p.symbol, (m.get(p.symbol) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]));
  }, [calendarClosed]);
  const showClosedSymbolChips = closedSymbolCounts.length >= 2;

  // Drop a stale closed chip when that symbol disappears from the filtered set
  useEffect(() => {
    if (closedSymbolChip && !closedSymbolCounts.some(([sym]) => sym === closedSymbolChip)) {
      setClosedSymbolChip("");
    }
  }, [closedSymbolChip, closedSymbolCounts]);

  const filteredClosed = useMemo(() => {
    let rows = calendarClosed;
    if (closedDay) rows = rows.filter((p) => closedDayKey(p) === closedDay);
    if (closedSymbolChip) rows = rows.filter((p) => p.symbol === closedSymbolChip);
    return rows;
  }, [calendarClosed, closedDay, closedSymbolChip]);
  const filteredPending = useMemo(
    () => filterOrders(pendingOrders, filterOpts),
    [pendingOrders, filterOpts]
  );

  const sortedOpen = useMemo(
    () => sortPositions(filteredOpen, openSort, "open"),
    [filteredOpen, openSort]
  );
  const sortedClosed = useMemo(
    () => sortPositions(filteredClosed, closedSort, "closed"),
    [filteredClosed, closedSort]
  );
  const sortedPending = useMemo(
    () => sortOrders(filteredPending, pendingSort),
    [filteredPending, pendingSort]
  );

  const onOpenSort = useCallback((key: SortKey) => {
    setOpenSort((prev) => cycleSort(prev, key));
  }, []);
  const onClosedSort = useCallback((key: SortKey) => {
    setClosedSort((prev) => cycleSort(prev, key));
  }, []);
  const onPendingSort = useCallback((key: SortKey) => {
    setPendingSort((prev) => cycleSort(prev, key));
  }, []);

  const filtersActive =
    sideFilter !== "ALL" ||
    symbolFilter.trim() !== "" ||
    periodFilter !== "ALL" ||
    textFilter.trim() !== "" ||
    (tab === "open" && openSymbolChip !== "") ||
    (tab === "closed" && (resultFilter !== "ALL" || closedDay !== "" || closedSymbolChip !== ""));

  const clearAllFilters = useCallback(() => {
    setSideFilter("ALL");
    setSymbolFilter("");
    setResultFilter("ALL");
    setPeriodFilter("ALL");
    setTextFilter("");
    setOpenSymbolChip("");
    setClosedSymbolChip("");
    setClosedDay("");
  }, []);

  // Esc clears the open/closed-symbol chip (unless typing in a field or a dialog is open)
  useEffect(() => {
    const chip =
      tab === "open" ? openSymbolChip : tab === "closed" ? closedSymbolChip : "";
    if (!chip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return;
      if (tab === "open") setOpenSymbolChip("");
      else if (tab === "closed") setClosedSymbolChip("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, openSymbolChip, closedSymbolChip]);

  const exportRows =
    tab === "open" ? sortedOpen : tab === "closed" ? sortedClosed : sortedPending;
  const canExport = exportRows.length > 0;

  const handleCloseAllFiltered = useCallback(async () => {
    if (bulkBusy || filteredOpen.length === 0) return;
    const n = filteredOpen.length;
    const ok = window.confirm(
      filtersActive
        ? `Filtreye uyan ${n} açık pozisyon kapatılsın mı?`
        : `${n} açık pozisyonun tümü kapatılsın mı?`
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      const ids = filteredOpen.map((p) => p.id);
      if (onClosePositions) await onClosePositions(ids);
      else {
        for (const id of ids) onClosePosition(id);
      }
    } finally {
      setBulkBusy(false);
    }
  }, [bulkBusy, filteredOpen, filtersActive, onClosePositions, onClosePosition]);

  const handleCancelAllFiltered = useCallback(async () => {
    if (bulkBusy || filteredPending.length === 0) return;
    const n = filteredPending.length;
    const ok = window.confirm(
      filtersActive
        ? `Filtreye uyan ${n} bekleyen emir iptal edilsin mi?`
        : `${n} bekleyen emirin tümü iptal edilsin mi?`
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      const ids = filteredPending.map((o) => o.id);
      if (onCancelOrders) await onCancelOrders(ids);
      else {
        for (const id of ids) onCancelOrder(id);
      }
    } finally {
      setBulkBusy(false);
    }
  }, [bulkBusy, filteredPending, filtersActive, onCancelOrders, onCancelOrder]);

  const handleExportCsv = () => {
    if (!canExport) return;
    const stamp = localDateStamp();
    if (tab === "open") {
      downloadCsv(
        `7fx-open-${stamp}.csv`,
        ["id", "symbol", "side", "volume", "openPrice", "currentPrice", "stopLoss", "takeProfit", "profit", "margin", "openedAt"],
        sortedOpen.map((p) => [
          p.id, p.symbol, p.side, p.volume, p.openPrice, p.currentPrice,
          p.stopLoss, p.takeProfit, p.profit, p.margin, p.openedAt,
        ])
      );
    } else if (tab === "closed") {
      downloadCsv(
        `7fx-closed-${stamp}.csv`,
        ["id", "symbol", "side", "volume", "openPrice", "closePrice", "closeProfit", "stopLoss", "takeProfit", "openedAt", "closedAt"],
        sortedClosed.map((p) => [
          p.id, p.symbol, p.side, p.volume, p.openPrice, p.closePrice ?? p.currentPrice,
          p.closeProfit ?? p.profit, p.stopLoss, p.takeProfit, p.openedAt, p.closedAt ?? "",
        ])
      );
    } else {
      downloadCsv(
        `7fx-pending-${stamp}.csv`,
        ["id", "symbol", "side", "type", "volume", "price", "openPrice", "stopLoss", "takeProfit", "status", "createdAt"],
        sortedPending.map((o) => [
          o.id, o.symbol, o.side, o.type, o.volume, o.price, o.openPrice,
          o.stopLoss, o.takeProfit, o.status, o.createdAt,
        ])
      );
    }
  };

  const openSummary = useMemo(() => {
    let pnl = 0;
    let buys = 0;
    let sells = 0;
    for (const p of filteredOpen) {
      pnl += Number(p.profit) || 0;
      if (p.side.toUpperCase() === "BUY") buys++;
      else sells++;
    }
    return { count: filteredOpen.length, pnl, buys, sells };
  }, [filteredOpen]);

  const closedSummary = useMemo(() => {
    let pnl = 0;
    let wins = 0;
    let losses = 0;
    let grossWin = 0;
    let grossLoss = 0;
    let best = -Infinity;
    let worst = Infinity;
    const timed: { t: number; v: number }[] = [];
    for (const p of filteredClosed) {
      const v = Number(p.closeProfit ?? p.profit) || 0;
      pnl += v;
      if (v > 0) {
        wins++;
        grossWin += v;
      } else if (v < 0) {
        losses++;
        grossLoss += -v;
      }
      if (v > best) best = v;
      if (v < worst) worst = v;
      const t = Date.parse(String(p.closedAt ?? p.openedAt ?? "")) || 0;
      timed.push({ t, v });
    }
    timed.sort((a, b) => a.t - b.t);
    let run = 0;
    const curve: number[] = [0];
    for (const x of timed) {
      run += x.v;
      curve.push(run);
    }
    const count = filteredClosed.length;
    return {
      count,
      pnl,
      wins,
      winRate: count > 0 ? (wins / count) * 100 : 0,
      avgWin: wins > 0 ? grossWin / wins : 0,
      avgLoss: losses > 0 ? grossLoss / losses : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
      best: count > 0 ? best : 0,
      worst: count > 0 ? worst : 0,
      curve,
    };
  }, [filteredClosed]);

  const summaryStrip =
    tab === "open" && openPositions.length > 0 ? (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-desk-border/60 bg-desk-elev/20 px-2.5 py-1.5">
        <SummaryStat label={filtersActive ? "Pozisyon (filtre)" : "Pozisyon"} className="text-desk-text">
          {openSummary.count}
        </SummaryStat>
        <SummaryStat label="Açık K/Z" className={moneyCls(openSummary.pnl)}>
          {openSummary.pnl > 0 ? "+" : ""}
          {fmtNum(openSummary.pnl, 2)}
        </SummaryStat>
        <SummaryStat label="AL / SAT" className="text-desk-muted">
          <span className="text-desk-buy">{openSummary.buys}</span>
          {" / "}
          <span className="text-desk-sell">{openSummary.sells}</span>
        </SummaryStat>
      </div>
    ) : tab === "closed" && closedPositions.length > 0 ? (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-desk-border/60 bg-desk-elev/20 px-2.5 py-1.5">
        <SummaryStat label={filtersActive ? "İşlem (filtre)" : "İşlem"} className="text-desk-text">
          {closedSummary.count}
        </SummaryStat>
        <SummaryStat label="Gerçekleşen K/Z" className={moneyCls(closedSummary.pnl)}>
          {closedSummary.pnl > 0 ? "+" : ""}
          {fmtNum(closedSummary.pnl, 2)}
        </SummaryStat>
        <SummaryStat
          label="Kazanma oranı"
          className={
            closedSummary.count === 0
              ? "text-desk-muted"
              : closedSummary.winRate >= 50
              ? "text-desk-buy"
              : "text-desk-sell"
          }
        >
          {closedSummary.count > 0
            ? `${fmtNum(closedSummary.winRate, 0)}% (${closedSummary.wins}/${closedSummary.count})`
            : "—"}
        </SummaryStat>
        {closedSummary.count > 0 && (
          <>
            <SummaryStat
              label="Kâr faktörü"
              className={
                closedSummary.profitFactor >= 1 ? "text-desk-buy" : "text-desk-sell"
              }
            >
              {Number.isFinite(closedSummary.profitFactor)
                ? fmtNum(closedSummary.profitFactor, 2)
                : "∞"}
            </SummaryStat>
            <SummaryStat label="Ort. kâr / zarar" className="text-desk-muted">
              <span className="text-desk-buy">+{fmtNum(closedSummary.avgWin, 2)}</span>
              {" / "}
              <span className="text-desk-sell">-{fmtNum(closedSummary.avgLoss, 2)}</span>
            </SummaryStat>
            <SummaryStat label="En iyi / kötü" className="text-desk-muted">
              <span className={moneyCls(closedSummary.best)}>
                {closedSummary.best > 0 ? "+" : ""}
                {fmtNum(closedSummary.best, 2)}
              </span>
              {" / "}
              <span className={moneyCls(closedSummary.worst)}>
                {closedSummary.worst > 0 ? "+" : ""}
                {fmtNum(closedSummary.worst, 2)}
              </span>
            </SummaryStat>
            {closedSummary.curve.length > 2 && (
              <div
                className="flex items-center gap-1.5"
                title="Kümülatif gerçekleşen K/Z (kapanış sırasına göre) · Cumulative realised P&L"
              >
                <span className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">
                  Eğri
                </span>
                <PnlSparkline values={closedSummary.curve} />
              </div>
            )}
          </>
        )}
      </div>
    ) : null;

  const emptyFiltered = (
    <div className="px-3 py-10 text-center text-xs text-desk-muted">
      <div>Filtreye uyan işlem yok</div>
      <button
        type="button"
        onClick={clearAllFilters}
        className="mt-2 rounded-[7px] border border-desk-border px-2.5 py-1 text-[11px] font-medium text-desk-muted hover:bg-desk-hover hover:text-desk-text"
      >
        Filtreleri temizle · Clear filters
      </button>
    </div>
  );

  return (
    <div
      className={`flex h-full min-h-0 flex-col border-t border-desk-border bg-desk-panel md:border-t md:border-r-0 ${className}`}
    >
      <div className="flex items-end gap-0 overflow-x-auto border-b border-desk-border/80 px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold tracking-wide transition-colors ${
              tab === t.id
                ? "text-desk-text"
                : "text-desk-muted hover:text-desk-text"
            }`}
          >
            <span className="md:hidden">{t.shortLabel}</span>
            <span className="hidden md:inline">{t.label}</span>
            {t.count != null && t.count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  tab === t.id
                    ? "bg-desk-accent text-desk-accent-ink"
                    : "bg-desk-elev text-desk-muted"
                }`}
              >
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-desk-accent" />
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 self-center pb-1.5">
          {tab === "open" && filteredOpen.length > 0 ? (
            <button
              type="button"
              onClick={handleCloseAllFiltered}
              disabled={bulkBusy}
              title={
                filtersActive
                  ? "Filtrelenmiş açık pozisyonları kapat"
                  : "Tümünü kapat"
              }
              aria-label="Açık pozisyonları kapat"
              className="rounded-control border border-desk-sell/40 px-2.5 py-1 text-[11px] font-semibold text-desk-sell transition-colors hover:bg-desk-sell/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {bulkBusy ? "…" : filtersActive ? "Filtreyi kapat" : "Tümünü kapat"}
            </button>
          ) : null}
          {tab === "pending" && filteredPending.length > 0 ? (
            <button
              type="button"
              onClick={handleCancelAllFiltered}
              disabled={bulkBusy}
              title={
                filtersActive
                  ? "Filtrelenmiş bekleyen emirleri iptal et"
                  : "Tüm bekleyen emirleri iptal et"
              }
              aria-label="Bekleyen emirleri iptal et"
              className="rounded-control border border-desk-warn/50 px-2.5 py-1 text-[11px] font-semibold text-desk-warn transition-colors hover:bg-desk-warn/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {bulkBusy ? "…" : filtersActive ? "Filtreyi iptal" : "Tümünü iptal"}
            </button>
          ) : null}
          {tab === "closed" && closedPositions.length > 0 ? (
            <button
              type="button"
              onClick={togglePnlCal}
              aria-pressed={showPnlCal}
              aria-label="Günlük K/Z takvimi"
              title="Günlük K/Z takvimi · Daily P&L calendar"
              className={`rounded-control border px-2.5 py-1 text-[11px] transition-colors ${
                showPnlCal || closedDay
                  ? "border-desk-accent/50 bg-desk-accent/10 text-desk-text"
                  : "border-desk-border text-desk-muted hover:bg-desk-hover hover:text-desk-text"
              }`}
            >
              Takvim
            </button>
          ) : null}
          {tab === "closed" && closedPositions.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowStatement(true)}
              aria-label={t("term.stmt.title")}
              title={t("term.stmt.title")}
              className="rounded-control border border-desk-border px-2.5 py-1 text-[11px] text-desk-muted transition-colors hover:bg-desk-hover hover:text-desk-text"
            >
              {t("term.stmt.button")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!canExport}
            title={canExport ? "Filtrelenmiş işlemleri CSV indir" : "İndirilecek işlem yok"}
            aria-label="Filtrelenmiş işlemleri CSV indir"
            className="rounded-control border border-desk-border px-2.5 py-1 text-[11px] text-desk-muted transition-colors hover:bg-desk-hover hover:text-desk-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-desk-muted"
          >
            CSV
          </button>
          {filtersActive && !showFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              title="Filtreleri temizle · Clear filters"
              aria-label="Filtreleri temizle · Clear filters"
              className="rounded-control border border-desk-border px-2 py-1 text-[11px] text-desk-muted transition-colors hover:bg-desk-hover hover:text-desk-text"
            >
              ✕<span className="ml-1 hidden sm:inline">Temizle</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-control border px-2.5 py-1 text-[11px] transition-colors ${
              showFilters || filtersActive
                ? "border-desk-accent/50 bg-desk-accent/10 text-desk-text"
                : "border-desk-border text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            }`}
          >
            Filtre
            {filtersActive ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-desk-accent align-middle" />
            ) : null}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 border-b border-desk-border/60 bg-desk-elev/30 px-2.5 py-2">
          <div className="flex items-center gap-1">
            <span className="mr-0.5 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
              Side
            </span>
            <Chip active={sideFilter === "ALL"} onClick={() => setSideFilter("ALL")}>
              Tümü
            </Chip>
            <Chip
              active={sideFilter === "BUY"}
              onClick={() => setSideFilter("BUY")}
              tone="buy"
            >
              AL
            </Chip>
            <Chip
              active={sideFilter === "SELL"}
              onClick={() => setSideFilter("SELL")}
              tone="sell"
            >
              SAT
            </Chip>
          </div>
          <div className="flex min-w-[120px] flex-1 items-center gap-1 sm:max-w-[180px]">
            <span className="text-[9px] font-medium uppercase tracking-wider text-desk-muted">
              Symbol
            </span>
            <input
              type="text"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="EURUSD…"
              className="min-w-0 flex-1 rounded-[7px] border border-desk-border bg-desk-bg px-2 py-1 text-[11px] text-desk-text outline-none placeholder:text-desk-muted/60 focus:border-desk-accent/50"
            />
          </div>
          <div className="flex min-w-[140px] flex-1 items-center gap-1 sm:max-w-[220px]">
            <span
              className="text-[9px] font-medium uppercase tracking-wider text-desk-muted"
              title="Bilet / yorum ara · Search ticket / comment"
            >
              Ara
            </span>
            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                spellCheck={false}
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && textFilter) {
                    e.stopPropagation();
                    setTextFilter("");
                  }
                }}
                placeholder="Bilet # / yorum · Ticket / comment"
                aria-label="Bilet veya yorum ara · Search ticket or comment"
                className="w-full min-w-0 rounded-[7px] border border-desk-border bg-desk-bg py-1 pl-2 pr-6 text-[11px] text-desk-text outline-none placeholder:text-desk-muted/60 focus:border-desk-accent/50 [&::-webkit-search-cancel-button]:hidden"
              />
              {textFilter ? (
                <button
                  type="button"
                  onClick={() => setTextFilter("")}
                  aria-label="Aramayı temizle · Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 text-[11px] leading-none text-desk-muted hover:text-desk-text"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>
          {tab === "closed" && (
            <div className="flex items-center gap-1">
              <span className="mr-0.5 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
                Sonuç
              </span>
              <Chip active={resultFilter === "ALL"} onClick={() => setResultFilter("ALL")}>
                Tümü
              </Chip>
              <Chip
                active={resultFilter === "PROFIT"}
                onClick={() => setResultFilter("PROFIT")}
                tone="buy"
              >
                Kâr
              </Chip>
              <Chip
                active={resultFilter === "LOSS"}
                onClick={() => setResultFilter("LOSS")}
                tone="sell"
              >
                Zarar
              </Chip>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="mr-0.5 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
              Period
            </span>
            <Chip active={periodFilter === "ALL"} onClick={() => setPeriodFilter("ALL")}>
              Tümü
            </Chip>
            <Chip active={periodFilter === "TODAY"} onClick={() => setPeriodFilter("TODAY")}>
              Bugün
            </Chip>
            <Chip active={periodFilter === "7D"} onClick={() => setPeriodFilter("7D")}>
              7 gün
            </Chip>
            <Chip active={periodFilter === "30D"} onClick={() => setPeriodFilter("30D")}>
              30 gün
            </Chip>
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={clearAllFilters}
              title="Tüm filtreleri sıfırla · Reset all filters"
              className="ml-auto rounded-[7px] border border-desk-border px-2 py-0.5 text-[10px] font-medium text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              Filtreleri temizle · Clear filters
            </button>
          )}
        </div>
      )}

      {tab === "open" && showOpenSymbolChips && (
        <div
          className="flex items-center gap-1 overflow-x-auto border-b border-desk-border/60 px-2.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Sembole göre filtrele · Filter by symbol"
        >
          <span className="mr-0.5 shrink-0 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
            Sembol
          </span>
          <span className="shrink-0">
            <Chip active={openSymbolChip === ""} onClick={() => setOpenSymbolChip("")}>
              Tümü · All <span className="tabular-nums opacity-70">{openPositions.length}</span>
            </Chip>
          </span>
          {openSymbolCounts.map(([sym, n]) => (
            <span key={sym} className="shrink-0">
              <Chip
                active={openSymbolChip === sym}
                onClick={() => setOpenSymbolChip((cur) => (cur === sym ? "" : sym))}
              >
                {sym} <span className="tabular-nums opacity-70">{n}</span>
              </Chip>
            </span>
          ))}
        </div>
      )}

      {tab === "closed" && showClosedSymbolChips && (
        <div
          className="flex items-center gap-1 overflow-x-auto border-b border-desk-border/60 px-2.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Sembole göre filtrele · Filter by symbol"
        >
          <span className="mr-0.5 shrink-0 text-[9px] font-medium uppercase tracking-wider text-desk-muted">
            Sembol
          </span>
          <span className="shrink-0">
            <Chip active={closedSymbolChip === ""} onClick={() => setClosedSymbolChip("")}>
              Tümü · All <span className="tabular-nums opacity-70">{calendarClosed.length}</span>
            </Chip>
          </span>
          {closedSymbolCounts.map(([sym, n]) => (
            <span key={sym} className="shrink-0">
              <Chip
                active={closedSymbolChip === sym}
                onClick={() => setClosedSymbolChip((cur) => (cur === sym ? "" : sym))}
              >
                {sym} <span className="tabular-nums opacity-70">{n}</span>
              </Chip>
            </span>
          ))}
        </div>
      )}

      {/* P&L summary strip (filtered) — shared by mobile + desktop */}
      {summaryStrip}

      {/* Daily realised P&L calendar (closed tab) — click a day to filter the list */}
      {tab === "closed" && showPnlCal && closedPositions.length > 0 && (
        <PnlCalendar rows={calendarClosed} selectedDay={closedDay} onSelectDay={setClosedDay} />
      )}

      <AccountStatement
        open={showStatement}
        onClose={closeStatement}
        rows={closedPositions}
        currency={currency}
      />

      {/* Mobile card list — elite dense cards */}
      <div className="flex-1 space-y-2 overflow-auto p-2.5 md:hidden">
        {tab === "open" && (
          <>
            {openPositions.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">No open trades</div>
            )}
            {openPositions.length > 0 && filteredOpen.length === 0 && emptyFiltered}
            {sortedOpen.map((p) => (
              <OpenCard key={p.id} p={p} onClose={onClosePosition} onModifySlTp={onModifySlTp} onSelectSymbol={onSelectSymbol} />
            ))}
          </>
        )}
        {tab === "closed" && (
          <>
            {closedPositions.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">
                No closed positions
              </div>
            )}
            {closedPositions.length > 0 && filteredClosed.length === 0 && emptyFiltered}
            {sortedClosed.map((p) => (
              <ClosedCard key={p.id} p={p} />
            ))}
          </>
        )}
        {tab === "pending" && (
          <>
            {pendingOrders.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-desk-muted">Pending emir yok</div>
            )}
            {pendingOrders.length > 0 && filteredPending.length === 0 && emptyFiltered}
            {sortedPending.map((o) => (
              <PendingCard key={o.id} o={o} onCancel={onCancelOrder} prices={prices} />
            ))}
          </>
        )}
      </div>

      {/* Desktop tables — unchanged structure */}
      <div className="hidden flex-1 overflow-auto md:block">
        {tab === "open" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-[1] bg-desk-bg/95 text-[9px] font-medium uppercase tracking-wider text-desk-muted backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2">#</th>
                <SortTh label="Zaman" col="time" sort={openSort} onSort={onOpenSort} />
                <SortTh label="Type" col="side" sort={openSort} onSort={onOpenSort} />
                <SortTh label="Asset" col="symbol" sort={openSort} onSort={onOpenSort} />
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Pip</th>
                <th className="px-2 py-2">Open</th>
                <th className="px-2 py-2">Current</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Takas</th>
                <th className="px-2 py-2">Commission</th>
                <th className="px-2 py-2">Tic. Kom.</th>
                <SortTh label="Profit" col="profit" sort={openSort} onSort={onOpenSort} />
                <th className="px-2 py-2">Net Profit</th>
                <th className="px-2 py-2">Close</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-desk-muted">
                    No open trades
                  </td>
                </tr>
              )}
              {openPositions.length > 0 && filteredOpen.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {sortedOpen.map((p, i) => {
                const pip =
                  calcPipDistance(p.symbol, p.openPrice, p.currentPrice) *
                  (p.side === "BUY" ? 1 : -1);
                return (
                  <tr
                    key={p.id}
                    className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/50"
                  >
                    <td className="px-2 py-1.5 text-desk-muted" title={`Ticket ${p.id}`}>
                      <div>{i + 1}</div>
                      <div className="opacity-90"><CopyTicket id={p.id} variant="table" /></div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-desk-muted">
                      <div>{fmtDateTime(p.openedAt)}</div>
                      <HoldTime openedAt={p.openedAt} className="text-[9.5px] opacity-80" />
                    </td>
                    <td
                      className={`px-2 py-1.5 font-semibold ${
                        p.side === "BUY" ? "text-desk-buy" : "text-desk-sell"
                      }`}
                    >
                      {p.side === "BUY" ? "Buy" : "Sell"}
                    </td>
                    <td className="px-2 py-1.5 font-medium text-desk-text">{p.symbol}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtNum(p.volume, 2)}</td>
                    <td className={`px-2 py-1.5 tabular-nums ${moneyCls(pip)}`}>
                      {fmtNum(pip, 1)}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">
                      {formatPrice(p.symbol, p.openPrice)}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums">
                      {formatPrice(p.symbol, p.currentPrice)}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums text-desk-muted">
                      <div>{p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}</div>
                      <LevelDistance p={p} kind="sl" className="block leading-tight" />
                    </td>
                    <td className="px-2 py-1.5 tabular-nums text-desk-muted">
                      <div>{p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}</div>
                      <LevelDistance p={p} kind="tp" className="block leading-tight" />
                    </td>
                    <td className="px-2 py-1.5 text-desk-muted">0.00</td>
                    <td className="px-2 py-1.5 text-desk-muted">0.00</td>
                    <td className="px-2 py-1.5 text-desk-muted">0.00</td>
                    <td className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(p.profit)}`}>
                      {fmtNum(p.profit, 2)}
                    </td>
                    <td className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(p.profit)}`}>
                      {fmtNum(p.profit, 2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <OpenRowActions
                        p={p}
                        onClose={onClosePosition}
                        onModifySlTp={onModifySlTp}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "closed" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-[1] bg-desk-bg/95 text-[9px] font-medium uppercase tracking-wider text-desk-muted backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2">#</th>
                <SortTh label="Zaman" col="time" sort={closedSort} onSort={onClosedSort} />
                <SortTh label="Type" col="side" sort={closedSort} onSort={onClosedSort} />
                <SortTh label="Asset" col="symbol" sort={closedSort} onSort={onClosedSort} />
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Open</th>
                <th className="px-2 py-2">Close</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <SortTh label="Profit" col="profit" sort={closedSort} onSort={onClosedSort} />
                <th className="px-2 py-2">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {closedPositions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    No closed positions
                  </td>
                </tr>
              )}
              {closedPositions.length > 0 && filteredClosed.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {sortedClosed.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/40"
                >
                  <td className="px-2 py-1.5 text-desk-muted" title={`Ticket ${p.id}`}>
                    <div>{i + 1}</div>
                    <div className="opacity-90"><CopyTicket id={p.id} variant="table" /></div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-desk-muted">
                    {fmtDateTime(p.openedAt)}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold ${
                      p.side === "BUY" ? "text-desk-buy" : "text-desk-sell"
                    }`}
                  >
                    {p.side === "BUY" ? "Buy" : "Sell"}
                  </td>
                  <td className="px-2 py-1.5 font-medium">{p.symbol}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtNum(p.volume, 2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {formatPrice(p.symbol, p.openPrice)}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {p.closePrice != null ? formatPrice(p.symbol, p.closePrice) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(
                      p.closeProfit ?? p.profit
                    )}`}
                  >
                    {fmtNum(p.closeProfit ?? p.profit, 2)}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold tabular-nums ${moneyCls(
                      p.closeProfit ?? p.profit
                    )}`}
                  >
                    {fmtNum(p.closeProfit ?? p.profit, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "pending" && (
          <table className="min-w-full text-left text-[11px]">
            <thead className="sticky top-0 z-[1] bg-desk-bg/95 text-[9px] font-medium uppercase tracking-wider text-desk-muted backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2">#</th>
                <SortTh label="Zaman" col="time" sort={pendingSort} onSort={onPendingSort} />
                <SortTh label="Type" col="side" sort={pendingSort} onSort={onPendingSort} />
                <SortTh label="Order" col="type" sort={pendingSort} onSort={onPendingSort} />
                <SortTh label="Asset" col="symbol" sort={pendingSort} onSort={onPendingSort} />
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2" title="Tetik fiyatına uzaklık (pip)">Uzaklık</th>
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    Pending emir yok
                  </td>
                </tr>
              )}
              {pendingOrders.length > 0 && filteredPending.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {sortedPending.map((o, i) => (
                <tr
                  key={o.id}
                  className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/40"
                >
                  <td className="px-2 py-1.5 text-desk-muted" title={`Ticket ${o.id}`}>
                    <div>{i + 1}</div>
                    <div className="opacity-90"><CopyTicket id={o.id} variant="table" /></div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-desk-muted">
                    {fmtDateTime(o.createdAt)}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-semibold ${
                      o.side === "BUY" ? "text-desk-buy" : "text-desk-sell"
                    }`}
                  >
                    {o.side === "BUY" ? "Buy" : "Sell"}
                  </td>
                  <td className="px-2 py-1.5">{o.type}</td>
                  <td className="px-2 py-1.5 font-medium">{o.symbol}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtNum(o.volume, 2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    <PendingTriggerDistance o={o} prices={prices} />
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {o.stopLoss != null ? formatPrice(o.symbol, o.stopLoss) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-desk-muted">
                    {o.takeProfit != null ? formatPrice(o.symbol, o.takeProfit) : "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => onCancelOrder(o.id)}
                      className="rounded-[7px] border border-desk-border bg-desk-elev px-2 py-0.5 text-[10px] font-medium text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
