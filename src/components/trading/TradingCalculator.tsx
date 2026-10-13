"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { calcTradeProfit } from "@/lib/pnl";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  symbol: string;
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  leverage?: number;
  currency?: string;
};

function fmtMoney(n: number, cur: string): string {
  if (!Number.isFinite(n)) return "—";
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "−" : ""}${s} ${cur}`;
}

function num(v: string): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Client-only trading calculator: margin, pip value, notional and P&L estimate.
 * Uses the same formulas as the trade engine (volume × contract × price / leverage;
 * Δprice × contract × volume). Read-only — never places or changes anything.
 */
export default function TradingCalculator({ open, onClose, symbol, symbols, prices, leverage, currency }: Props) {
  const { t } = useI18n();
  const cur = currency || "USD";
  const closeRef = useRef<HTMLButtonElement>(null);

  const [sym, setSym] = useState(symbol);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [volume, setVolume] = useState("1");
  const [lev, setLev] = useState(String(leverage || 100));
  const [openPx, setOpenPx] = useState("");
  const [closePx, setClosePx] = useState("");

  const def = useMemo(() => symbols.find((s) => s.symbol === sym), [symbols, sym]);
  const tick = prices[sym];
  const digits = def?.digits ?? 5;

  // Reset to the chart symbol + live price each time the calculator opens
  useEffect(() => {
    if (!open) return;
    setSym(symbol);
    setLev(String(leverage || 100));
  }, [open, symbol, leverage]);

  // Prefill prices from the live quote when symbol/side changes
  useEffect(() => {
    if (!open) return;
    const p = prices[sym];
    const d = symbols.find((s) => s.symbol === sym);
    const dg = d?.digits ?? 5;
    const pip = d?.pipSize ?? 0.0001;
    const entry = p ? (side === "BUY" ? p.ask : p.bid) || p.mid : d?.basePrice || 0;
    if (entry > 0) {
      setOpenPx(entry.toFixed(dg));
      const target = entry + (side === "BUY" ? 1 : -1) * pip * 20;
      setClosePx(target.toFixed(dg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sym, side]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      try {
        prev?.focus?.();
      } catch {
        /* ignore */
      }
    };
  }, [open, onClose]);

  const res = useMemo(() => {
    const vol = num(volume);
    const lv = Math.max(1, num(lev) || 1);
    const op = num(openPx);
    const cp = num(closePx);
    const cs = def?.contractSize ?? 1;
    const pip = def?.pipSize ?? 0.0001;
    if (!(vol > 0) || !(op > 0)) return null;
    const notional = vol * cs * op;
    const margin = notional / lv;
    const pipValue = pip * cs * vol;
    const profit = cp > 0 ? calcTradeProfit(side, vol, op, cp, cs) : NaN;
    const pips = cp > 0 && pip > 0 ? ((cp - op) * (side === "BUY" ? 1 : -1)) / pip : NaN;
    return { notional, margin, pipValue, profit, pips };
  }, [volume, lev, openPx, closePx, def, side]);

  if (!open) return null;

  const inputCls =
    "w-full rounded-[8px] border border-desk-border bg-desk-bg px-2.5 py-1.5 font-mono text-[13px] text-desk-text outline-none focus:border-desk-accent";
  const labelCls = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-desk-muted";

  return (
    <div
      className="fx-lx-overlay fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fx-calc-title"
        onClick={(e) => e.stopPropagation()}
        className="fx-lx-modal max-h-[92vh] w-full overflow-y-auto rounded-t-modal border border-desk-border bg-desk-panel text-desk-text shadow-desk-panel sm:max-w-md sm:rounded-modal"
      >
        <div className="flex items-center justify-between border-b border-desk-border/80 px-4 py-3">
          <h2 id="fx-calc-title" className="text-sm font-semibold tracking-wide">
            {t("term.calc.title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-8 w-8 items-center justify-center rounded-[7px] text-desk-muted transition-colors hover:bg-desk-elev hover:text-desk-text focus:outline-none focus-visible:ring-1 focus-visible:ring-desk-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 py-3">
          <div className="col-span-2">
            <label className={labelCls} htmlFor="fx-calc-sym">
              {t("term.calc.symbol")}
            </label>
            <select id="fx-calc-sym" value={sym} onChange={(e) => setSym(e.target.value)} className={inputCls}>
              {symbols.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name}
                </option>
              ))}
            </select>
            {tick && (
              <p className="mt-1 font-mono text-[11px] text-desk-muted">
                Bid {tick.bid.toFixed(digits)} · Ask {tick.ask.toFixed(digits)}
              </p>
            )}
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-1 rounded-[9px] border border-desk-border bg-desk-bg p-1">
            {(["BUY", "SELL"] as const).map((sd) => (
              <button
                key={sd}
                type="button"
                onClick={() => setSide(sd)}
                aria-pressed={side === sd}
                className={`min-h-[34px] rounded-[7px] text-[12px] font-bold tracking-wider transition ${
                  side === sd
                    ? sd === "BUY"
                      ? "bg-desk-buy text-white"
                      : "bg-desk-sell text-white"
                    : "text-desk-muted hover:text-desk-text"
                }`}
              >
                {sd === "BUY" ? t("term.calc.buy") : t("term.calc.sell")}
              </button>
            ))}
          </div>

          <div>
            <label className={labelCls} htmlFor="fx-calc-vol">
              {t("term.calc.volume")}
            </label>
            <input id="fx-calc-vol" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="fx-calc-lev">
              {t("term.calc.leverage")}
            </label>
            <input id="fx-calc-lev" inputMode="numeric" value={lev} onChange={(e) => setLev(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="fx-calc-open">
              {t("term.calc.open")}
            </label>
            <input id="fx-calc-open" inputMode="decimal" value={openPx} onChange={(e) => setOpenPx(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="fx-calc-close">
              {t("term.calc.close")}
            </label>
            <input id="fx-calc-close" inputMode="decimal" value={closePx} onChange={(e) => setClosePx(e.target.value)} className={inputCls} />
          </div>
        </div>

        <dl className="mx-4 mb-3 divide-y divide-desk-border/50 rounded-[10px] border border-desk-border bg-desk-bg text-[12px]">
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-desk-muted">{t("term.calc.margin")}</dt>
            <dd className="font-mono font-semibold">{res ? fmtMoney(res.margin, cur) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-desk-muted">{t("term.calc.pipValue")}</dt>
            <dd className="font-mono font-semibold">{res ? fmtMoney(res.pipValue, cur) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-desk-muted">{t("term.calc.notional")}</dt>
            <dd className="font-mono">{res ? fmtMoney(res.notional, cur) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-desk-muted">{t("term.calc.pips")}</dt>
            <dd className="font-mono">{res && Number.isFinite(res.pips) ? res.pips.toFixed(1) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="font-semibold">{t("term.calc.profit")}</dt>
            <dd
              className={`font-mono text-[14px] font-bold ${
                res && Number.isFinite(res.profit) ? (res.profit >= 0 ? "text-desk-buy" : "text-desk-sell") : ""
              }`}
            >
              {res && Number.isFinite(res.profit) ? `${res.profit >= 0 ? "+" : ""}${fmtMoney(res.profit, cur)}` : "—"}
            </dd>
          </div>
        </dl>
        <p className="border-t border-desk-border/80 px-4 py-2.5 text-[10px] text-desk-muted">{t("term.calc.note")}</p>
      </div>
    </div>
  );
}
