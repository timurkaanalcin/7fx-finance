"use client";

import { useEffect, useMemo, useState } from "react";
import type { PositionRow } from "./types";

/** Local-time YYYY-MM-DD key for an ISO timestamp ("" when unparseable). */
export function localDayKey(iso: string | null | undefined): string {
  const t = Date.parse(String(iso ?? ""));
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Day a closed trade is booked on (close time, falling back to open time). */
export function closedDayKey(p: PositionRow): string {
  return localDayKey(p.closedAt ?? p.openedAt);
}

function closedValue(p: PositionRow): number {
  return Number(p.closeProfit ?? p.profit) || 0;
}

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const WEEKDAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function compact(v: number): string {
  const a = Math.abs(v);
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 10_000) return `${sign}${Math.round(a / 1000)}k`;
  if (a >= 1000) return `${sign}${(a / 1000).toFixed(1)}k`;
  if (a >= 100) return `${sign}${Math.round(a)}`;
  return `${sign}${a.toFixed(a >= 10 ? 1 : 2)}`;
}

function full(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tint(v: number, maxAbs: number): string {
  if (v === 0 || maxAbs <= 0) return "";
  const r = Math.abs(v) / maxAbs;
  if (v > 0) {
    if (r > 0.66) return "bg-desk-buy/40";
    if (r > 0.33) return "bg-desk-buy/25";
    return "bg-desk-buy/10";
  }
  if (r > 0.66) return "bg-desk-sell/40";
  if (r > 0.33) return "bg-desk-sell/25";
  return "bg-desk-sell/10";
}

type DayAgg = { pnl: number; n: number; wins: number };

/**
 * Monthly realised-P&L calendar for the customer's own closed trades (client-only).
 * Each day shows net P&L + trade count; clicking a day filters the closed list to it.
 */
export default function PnlCalendar({
  rows,
  selectedDay,
  onSelectDay,
}: {
  rows: PositionRow[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const byDay = useMemo(() => {
    const m = new Map<string, DayAgg>();
    for (const p of rows) {
      const k = closedDayKey(p);
      if (!k) continue;
      const v = closedValue(p);
      const a = m.get(k) ?? { pnl: 0, n: 0, wins: 0 };
      a.pnl += v;
      a.n += 1;
      if (v > 0) a.wins += 1;
      m.set(k, a);
    }
    return m;
  }, [rows]);

  // Default month: the latest month that has trades (or the current month).
  const latestKey = useMemo(() => {
    let best = "";
    byDay.forEach((_v, k) => {
      if (k > best) best = k;
    });
    return best;
  }, [byDay]);

  const [ym, setYm] = useState<{ y: number; m: number }>(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || !latestKey) return;
    const [y, m] = latestKey.split("-").map(Number);
    setYm({ y, m: m - 1 });
  }, [latestKey, touched]);

  // Keep the selected day's month in view
  useEffect(() => {
    if (!selectedDay) return;
    const [y, m] = selectedDay.split("-").map(Number);
    if (y && m) setYm({ y, m: m - 1 });
  }, [selectedDay]);

  const shift = (delta: number) => {
    setTouched(true);
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const grid = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const cells: ({ day: number; key: string; agg?: DayAgg } | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, key, agg: byDay.get(key) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    let maxAbs = 0;
    let total = 0;
    let trades = 0;
    let green = 0;
    let red = 0;
    for (const c of cells) {
      if (!c?.agg) continue;
      maxAbs = Math.max(maxAbs, Math.abs(c.agg.pnl));
      total += c.agg.pnl;
      trades += c.agg.n;
      if (c.agg.pnl > 0) green++;
      else if (c.agg.pnl < 0) red++;
    }
    return { weeks, maxAbs, total, trades, green, red };
  }, [ym, byDay]);

  const todayKey = localDayKey(new Date().toISOString());
  const moneyCls = (v: number) =>
    v > 0 ? "text-desk-buy" : v < 0 ? "text-desk-sell" : "text-desk-muted";

  return (
    <div
      className="fx-pnlcal max-h-[260px] shrink-0 overflow-auto border-b border-desk-border/60 bg-desk-elev/10 px-2.5 py-2"
      aria-label="Günlük K/Z takvimi"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Önceki ay"
            className="rounded-control border border-desk-border px-1.5 py-0.5 text-[11px] text-desk-muted hover:bg-desk-hover hover:text-desk-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-desk-accent"
          >
            ‹
          </button>
          <span className="min-w-[96px] text-center text-[11px] font-semibold text-desk-text" aria-live="polite">
            {MONTHS_TR[ym.m]} {ym.y}
          </span>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Sonraki ay"
            className="rounded-control border border-desk-border px-1.5 py-0.5 text-[11px] text-desk-muted hover:bg-desk-hover hover:text-desk-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-desk-accent"
          >
            ›
          </button>
        </div>
        <span className="text-[10px] text-desk-muted">
          Ay K/Z{" "}
          <b className={`tabular-nums ${moneyCls(grid.total)}`}>{full(grid.total)}</b>
        </span>
        <span className="text-[10px] text-desk-muted">
          İşlem <b className="tabular-nums text-desk-text">{grid.trades}</b>
        </span>
        <span className="text-[10px] text-desk-muted">
          Gün <b className="tabular-nums text-desk-buy">{grid.green}</b>
          {" / "}
          <b className="tabular-nums text-desk-sell">{grid.red}</b>
        </span>
        {selectedDay && (
          <button
            type="button"
            onClick={() => onSelectDay("")}
            className="ml-auto rounded-control border border-desk-accent/50 bg-desk-accent/10 px-2 py-0.5 text-[10px] font-medium text-desk-text hover:bg-desk-accent/20"
          >
            {selectedDay.split("-").reverse().join(".")} ✕
          </button>
        )}
      </div>

      <table className="w-full table-fixed border-separate border-spacing-[3px] text-[10px]">
        <thead>
          <tr>
            {WEEKDAYS_TR.map((w) => (
              <th key={w} scope="col" className="font-medium text-desk-muted">
                {w}
              </th>
            ))}
            <th scope="col" className="hidden font-medium text-desk-muted sm:table-cell">
              Hafta
            </th>
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week, wi) => {
            let wk = 0;
            let wn = 0;
            for (const c of week) {
              if (c?.agg) {
                wk += c.agg.pnl;
                wn += c.agg.n;
              }
            }
            return (
              <tr key={wi}>
                {week.map((c, ci) => {
                  if (!c) return <td key={ci} />;
                  const a = c.agg;
                  const sel = selectedDay === c.key;
                  const label = a
                    ? `${c.key.split("-").reverse().join(".")}: ${full(a.pnl)} · ${a.n} işlem · ${a.wins} kârlı`
                    : `${c.key.split("-").reverse().join(".")}: işlem yok`;
                  return (
                    <td key={ci} className="p-0">
                      <button
                        type="button"
                        disabled={!a}
                        onClick={() => onSelectDay(sel ? "" : c.key)}
                        title={label}
                        aria-label={label}
                        aria-pressed={sel}
                        className={`flex h-[38px] w-full flex-col items-stretch justify-between rounded-[5px] border px-1 py-0.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-desk-accent ${
                          a ? `${tint(a.pnl, grid.maxAbs)} hover:brightness-110` : "cursor-default opacity-60"
                        } ${
                          sel
                            ? "border-desk-accent ring-1 ring-desk-accent"
                            : c.key === todayKey
                            ? "border-desk-accent/50"
                            : "border-desk-border/50"
                        }`}
                      >
                        <span className="flex items-center justify-between leading-none">
                          <span className="text-[9px] text-desk-muted">{c.day}</span>
                          {a && <span className="text-[8px] text-desk-muted tabular-nums">{a.n}</span>}
                        </span>
                        {a && (
                          <span className={`truncate text-[10px] font-bold leading-none tabular-nums ${moneyCls(a.pnl)}`}>
                            {compact(a.pnl)}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="hidden p-0 align-middle sm:table-cell">
                  {wn > 0 ? (
                    <div className="text-center leading-tight" title={`Hafta: ${full(wk)} · ${wn} işlem`}>
                      <div className={`font-bold tabular-nums ${moneyCls(wk)}`}>{compact(wk)}</div>
                      <div className="text-[8px] text-desk-muted">{wn} işlem</div>
                    </div>
                  ) : (
                    <div className="text-center text-desk-muted/60">—</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-[9px] text-desk-muted">
        Kapanış gününe göre gerçekleşen K/Z (yerel saat). Güne tıklayın → liste o güne filtrelenir.
      </p>
    </div>
  );
}
