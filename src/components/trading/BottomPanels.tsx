"use client";

import { useEffect, useMemo, useState, useCallback, type ReactNode, type ReactElement } from "react";
import { calcPipDistance, formatPrice, getSymbol } from "@/lib/symbols";
import { fmtDateTime, fmtNum } from "@/lib/format";
import type { OrderRow, PositionRow } from "./types";

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
    result?: ResultFilter;
  }
): PositionRow[] {
  return rows.filter((p) => {
    if (!matchesSide(p.side, opts.side)) return false;
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
  opts: { side: SideFilter; symbolQ: string; period: PeriodFilter }
): OrderRow[] {
  return rows.filter((o) => {
    if (!matchesSide(o.side, opts.side)) return false;
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
          <div className="mt-1 text-[10px] text-desk-muted">{fmtDateTime(p.openedAt)}</div>
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
}: {
  o: OrderRow;
  onCancel: (id: string) => void;
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
          <div className="mt-1 text-[10px] text-desk-muted">{fmtDateTime(o.createdAt)}</div>
        </div>
        <div className="text-right text-[12px] font-semibold tabular-nums text-desk-text">
          {fmtNum(o.volume, 2)} lot
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="rounded-[8px] bg-desk-bg/60 px-2 py-1.5">
          <span className="text-desk-muted">Price </span>
          <span className="font-medium tabular-nums">
            {o.price != null ? formatPrice(o.symbol, o.price) : "—"}
          </span>
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
  className = "",
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("ALL");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [openSort, setOpenSort] = useState<SortState>(null);
  const [closedSort, setClosedSort] = useState<SortState>(null);
  const [pendingSort, setPendingSort] = useState<SortState>(null);


  const tabs: { id: Tab; label: string; shortLabel: string; count?: number }[] = [
    { id: "open", label: "Open Trades", shortLabel: "Open", count: openPositions.length || undefined },
    { id: "closed", label: "Closed", shortLabel: "Closed", count: closedPositions.length || undefined },
    { id: "pending", label: "Pending", shortLabel: "Pending", count: pendingOrders.length || undefined },
  ];

  const filterOpts = useMemo(
    () => ({ side: sideFilter, symbolQ: symbolFilter, period: periodFilter }),
    [sideFilter, symbolFilter, periodFilter]
  );

  const filteredOpen = useMemo(
    () => filterPositions(openPositions, filterOpts),
    [openPositions, filterOpts]
  );
  const filteredClosed = useMemo(
    () => filterPositions(closedPositions, { ...filterOpts, result: resultFilter }),
    [closedPositions, filterOpts, resultFilter]
  );
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
    (tab === "closed" && resultFilter !== "ALL");

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
    for (const p of filteredClosed) {
      const v = Number(p.closeProfit ?? p.profit) || 0;
      pnl += v;
      if (v > 0) wins++;
    }
    const count = filteredClosed.length;
    return { count, pnl, wins, winRate: count > 0 ? (wins / count) * 100 : 0 };
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
      </div>
    ) : null;

  const emptyFiltered = (
    <div className="px-3 py-10 text-center text-xs text-desk-muted">
      Filtreye uyan işlem yok
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
              onClick={() => {
                setSideFilter("ALL");
                setSymbolFilter("");
                setResultFilter("ALL");
                setPeriodFilter("ALL");
              }}
              className="ml-auto rounded-[7px] border border-desk-border px-2 py-0.5 text-[10px] font-medium text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      {/* P&L summary strip (filtered) — shared by mobile + desktop */}
      {summaryStrip}

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
              <PendingCard key={o.id} o={o} onCancel={onCancelOrder} />
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
                    <td className="px-2 py-1.5 text-desk-muted">{i + 1}</td>
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
                      {p.stopLoss != null ? formatPrice(p.symbol, p.stopLoss) : "—"}
                    </td>
                    <td className="px-2 py-1.5 tabular-nums text-desk-muted">
                      {p.takeProfit != null ? formatPrice(p.symbol, p.takeProfit) : "—"}
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
                  <td className="px-2 py-1.5 text-desk-muted">{i + 1}</td>
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
                <th className="px-2 py-2">SL</th>
                <th className="px-2 py-2">TP</th>
                <th className="px-2 py-2">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-desk-muted">
                    Pending emir yok
                  </td>
                </tr>
              )}
              {pendingOrders.length > 0 && filteredPending.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-desk-muted">
                    Filtreye uyan işlem yok
                  </td>
                </tr>
              )}
              {sortedPending.map((o, i) => (
                <tr
                  key={o.id}
                  className="border-t border-desk-border/50 transition-colors hover:bg-desk-hover/40"
                >
                  <td className="px-2 py-1.5 text-desk-muted">{i + 1}</td>
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
