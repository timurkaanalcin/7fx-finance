"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/symbols";
import { calcTradeProfit } from "@/lib/pnl";
import SymbolIcon from "@/components/ui/SymbolIcon";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  symbol: string;
  symbols: SymbolDef[];
  price?: PriceTick;
  onPlaced: () => void;
  onClose?: () => void;
  /** When true, render as centered modal overlay */
  modal?: boolean;
  initialSide?: "BUY" | "SELL";
  className?: string;
};

function defaultSlTp(
  side: "BUY" | "SELL",
  mid: number,
  digits: number
): { sl: string; tp: string } {
  if (!mid || !Number.isFinite(mid)) return { sl: "", tp: "" };
  // ~0.5% buffer from mid as a sensible starter (user can edit)
  const pct = 0.005;
  const slRaw = side === "BUY" ? mid * (1 - pct) : mid * (1 + pct);
  const tpRaw = side === "BUY" ? mid * (1 + pct) : mid * (1 - pct);
  return {
    sl: slRaw.toFixed(digits),
    tp: tpRaw.toFixed(digits),
  };
}

const LOT_PRESETS = ["0.01", "0.10", "0.50", "1.00"];

function fmtSignedUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "−" : "+"}$${abs}`;
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  // Full amount — never abbreviate as K / M
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderTicket({
  symbol,
  symbols,
  price,
  onPlaced,
  onClose,
  modal = false,
  initialSide = "BUY",
  className = "",
}: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [type, setType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [volume, setVolume] = useState("0.10");
  const [limitPrice, setLimitPrice] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [showSl, setShowSl] = useState(false);
  const [showTp, setShowTp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const def = symbols.find((s) => s.symbol === symbol);
  const digits = def?.digits ?? 5;

  // Reset form only when symbol (or initial side) changes — NOT on every live tick
  useEffect(() => {
    setSide(initialSide);
    setType("MARKET");
    setVolume("0.10");
    setSl("");
    setTp("");
    setShowSl(false);
    setShowTp(false);
    setMsg("");
    if (price?.mid) setLimitPrice(formatPrice(symbol, price.mid));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally ignore live price ticks
  }, [symbol, initialSide]);

  // Keep limit field roughly synced while editing MARKET→LIMIT without wiping SL/TP
  useEffect(() => {
    if (type !== "MARKET" && price?.mid && !limitPrice) {
      setLimitPrice(formatPrice(symbol, price.mid));
    }
  }, [type, price?.mid, symbol, limitPrice]);

  const notional = useMemo(() => {
    const vol = Number(volume);
    const mid = price?.mid ?? 0;
    const contract = def?.contractSize ?? 1;
    if (!Number.isFinite(vol) || vol <= 0 || !mid) return 0;
    return vol * contract * mid;
  }, [volume, price?.mid, def?.contractSize]);

  // Estimated entry: ask for BUY / bid for SELL on market, else the entered price
  const entry = useMemo(() => {
    if (type !== "MARKET") {
      const p = Number(limitPrice);
      return Number.isFinite(p) && p > 0 ? p : 0;
    }
    return (side === "BUY" ? price?.ask : price?.bid) ?? price?.mid ?? 0;
  }, [type, limitPrice, side, price?.ask, price?.bid, price?.mid]);

  const preview = useMemo(() => {
    const vol = Number(volume);
    const cs = def?.contractSize ?? 1;
    if (!entry || !Number.isFinite(vol) || vol <= 0) return { sl: null, tp: null, rr: null };
    const slN = Number(sl);
    const tpN = Number(tp);
    const slPnl =
      showSl && sl.trim() !== "" && Number.isFinite(slN) && slN > 0
        ? calcTradeProfit(side, vol, entry, slN, cs)
        : null;
    const tpPnl =
      showTp && tp.trim() !== "" && Number.isFinite(tpN) && tpN > 0
        ? calcTradeProfit(side, vol, entry, tpN, cs)
        : null;
    const rr =
      slPnl != null && tpPnl != null && slPnl < 0 && tpPnl > 0 ? tpPnl / Math.abs(slPnl) : null;
    return { sl: slPnl, tp: tpPnl, rr };
  }, [entry, volume, def?.contractSize, side, sl, tp, showSl, showTp]);

  // Escape closes the ticket (modal / mobile sheet)
  useEffect(() => {
    if (!onClose || !modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, modal]);

  function enableSl() {
    setShowSl((v) => {
      if (v) {
        setSl("");
        return false;
      }
      const mid = (price?.mid ?? Number(limitPrice)) || 0;
      const d = defaultSlTp(side, mid, digits);
      setSl(d.sl);
      return true;
    });
  }

  function enableTp() {
    setShowTp((v) => {
      if (v) {
        setTp("");
        return false;
      }
      const mid = (price?.mid ?? Number(limitPrice)) || 0;
      const d = defaultSlTp(side, mid, digits);
      setTp(d.tp);
      return true;
    });
  }

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      const stopLoss =
        showSl && sl.trim() !== "" && Number.isFinite(Number(sl)) ? Number(sl) : undefined;
      const takeProfit =
        showTp && tp.trim() !== "" && Number.isFinite(Number(tp)) ? Number(tp) : undefined;

      if (showSl && stopLoss == null) {
        setMsg("Enter Stop Loss price");
        setBusy(false);
        return;
      }
      if (showTp && takeProfit == null) {
        setMsg("Enter Take Profit price");
        setBusy(false);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          type,
          volume: Number(volume),
          price: type === "MARKET" ? undefined : Number(limitPrice),
          stopLoss,
          takeProfit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Error");
        if (res.status === 401) {
          setMsg("No session — please sign in again");
        }
        return;
      }
      setMsg(type === "MARKET" ? "Position opened" : "Pending order created");
      onPlaced();
      if (onClose) {
        window.setTimeout(() => onClose(), 650);
      }
    } catch {
      setMsg("Connection error");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-[12px] border border-desk-border/80 bg-desk-bg px-3 py-2.5 text-sm text-desk-text outline-none transition-colors focus:border-desk-accent md:rounded-control md:px-2.5 md:py-2";

  const body = (
    <>
      <div className="flex items-center justify-between border-b border-desk-border/80 px-3.5 py-3 md:px-3 md:py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-desk-muted">
          Order Ticket
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-desk-border/60 bg-desk-elev/80 px-2.5 py-0.5 text-[10px] font-semibold text-desk-text">
            <SymbolIcon symbol={symbol} fallback={def?.flag || "•"} size={16} />
            {symbol}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-desk-border/60 text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5 md:space-y-3 md:p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-desk-border/60 bg-desk-bg/80 px-2.5 py-2.5 text-center md:rounded-control md:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-desk-muted">Buy</div>
            <div className="mt-0.5 text-[15px] font-bold tabular-nums text-desk-buy md:text-sm md:font-semibold">
              {price ? formatPrice(symbol, price.ask) : "—"}
            </div>
          </div>
          <div className="rounded-[12px] border border-desk-border/60 bg-desk-bg/80 px-2.5 py-2.5 text-center md:rounded-control md:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-desk-muted">Sell</div>
            <div className="mt-0.5 text-[15px] font-bold tabular-nums text-desk-sell md:text-sm md:font-semibold">
              {price ? formatPrice(symbol, price.bid) : "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:gap-2">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`rounded-[12px] py-3.5 text-[15px] font-bold tracking-wide transition md:rounded-control md:py-3 md:text-sm ${
              side === "BUY"
                ? "bg-desk-buy text-white shadow-buy-glow"
                : "border border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            }`}
          >
            AL
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`rounded-[12px] py-3.5 text-[15px] font-bold tracking-wide transition md:rounded-control md:py-3 md:text-sm ${
              side === "SELL"
                ? "bg-desk-sell text-white shadow-sell-glow"
                : "border border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            }`}
          >
            SAT
          </button>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
            Order Type
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "MARKET" | "LIMIT" | "STOP")}
            className={inputCls}
          >
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP">Stop</option>
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-end justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              Volume (Lot)
            </span>
            <span
              className="text-[10px] font-semibold tabular-nums text-desk-muted"
              title="Approx. trade size (lot × contract × price)"
            >
              ≈ {fmtUsd(notional)}
            </span>
          </div>
          <div className="relative flex items-center gap-2 md:gap-1.5">
            <button
              type="button"
              onClick={() =>
                setVolume((v) => {
                  const n = Number(v);
                  const base = Number.isFinite(n) ? n : 0.1;
                  return Math.max(0.01, Math.round((base - 0.01) * 100) / 100).toFixed(2);
                })
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-desk-border/80 bg-desk-elev text-base font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text md:h-9 md:w-9 md:rounded-control md:text-sm"
            >
              −
            </button>
            <input
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={`${inputCls} text-center text-base font-semibold tabular-nums md:text-sm`}
            />
            <button
              type="button"
              onClick={() =>
                setVolume((v) => {
                  const n = Number(v);
                  const base = Number.isFinite(n) ? n : 0.1;
                  return (Math.round((base + 0.01) * 100) / 100).toFixed(2);
                })
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-desk-border/80 bg-desk-elev text-base font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text md:h-9 md:w-9 md:rounded-control md:text-sm"
            >
              +
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex gap-1" role="group" aria-label="Quick lot size">
              {LOT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVolume(p)}
                  aria-pressed={Number(volume) === Number(p)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums transition ${
                    Number(volume) === Number(p)
                      ? "border-desk-accent/60 bg-desk-accent/15 text-desk-accent"
                      : "border-desk-border/70 bg-desk-elev text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                  }`}
                >
                  {Number(p)}
                </button>
              ))}
            </div>
            <span className="text-[10px] tabular-nums text-desk-muted/80">
              Notional {fmtUsd(notional)}
            </span>
          </div>
        </div>

        {type !== "MARKET" && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              Price
            </div>
            <input
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className={`${inputCls} tabular-nums`}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={enableSl}
            className={`rounded-[12px] border py-2.5 text-xs font-semibold transition md:rounded-control md:py-2 ${
              showSl
                ? "border-desk-sell/50 bg-desk-sell/90 text-white"
                : "border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover"
            }`}
          >
            SL {showSl ? "✓" : ""}
          </button>
          <button
            type="button"
            onClick={enableTp}
            className={`rounded-[12px] border py-2.5 text-xs font-semibold transition md:rounded-control md:py-2 ${
              showTp
                ? "border-desk-buy/50 bg-desk-buy/90 text-white"
                : "border-desk-border bg-desk-elev text-desk-muted hover:bg-desk-hover"
            }`}
          >
            TP {showTp ? "✓" : ""}
          </button>
        </div>

        {showSl && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              Stop Loss
            </div>
            <input
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder="Price"
              autoFocus
              className="w-full rounded-[12px] border border-desk-sell/40 bg-desk-bg px-3 py-2.5 text-sm tabular-nums text-desk-text outline-none focus:border-desk-sell md:rounded-control md:px-2.5 md:py-2"
            />
            {preview.sl != null && (
              <div
                className={`mt-1 text-right text-[10px] font-semibold tabular-nums ${
                  preview.sl < 0 ? "text-desk-sell" : "text-desk-buy"
                }`}
                title="Estimated P&L if Stop Loss is hit"
              >
                ≈ {fmtSignedUsd(preview.sl)}
              </div>
            )}
          </div>
        )}

        {showTp && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              Take Profit
            </div>
            <input
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="Price"
              className="w-full rounded-[12px] border border-desk-buy/40 bg-desk-bg px-3 py-2.5 text-sm tabular-nums text-desk-text outline-none focus:border-desk-buy md:rounded-control md:px-2.5 md:py-2"
            />
            {preview.tp != null && (
              <div
                className={`mt-1 text-right text-[10px] font-semibold tabular-nums ${
                  preview.tp < 0 ? "text-desk-sell" : "text-desk-buy"
                }`}
                title="Estimated P&L if Take Profit is hit"
              >
                ≈ {fmtSignedUsd(preview.tp)}
              </div>
            )}
          </div>
        )}

        {preview.rr != null && (
          <div className="flex items-center justify-between rounded-[12px] border border-desk-border/60 bg-desk-bg/70 px-3 py-2 text-[11px] md:rounded-control md:px-2.5 md:py-1.5">
            <span className="font-semibold uppercase tracking-wider text-desk-muted">Risk / Reward</span>
            <span
              className={`font-bold tabular-nums ${preview.rr >= 1 ? "text-desk-buy" : "text-desk-text"}`}
            >
              1 : {preview.rr.toFixed(2)}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className={`w-full rounded-[14px] py-3.5 text-[15px] font-bold tracking-wide text-white disabled:opacity-60 md:rounded-control md:py-3 md:text-sm ${
            side === "BUY"
              ? "bg-desk-buy shadow-buy-glow hover:brightness-110"
              : "bg-desk-sell shadow-sell-glow hover:brightness-110"
          }`}
        >
          {busy ? "Submitting…" : side === "BUY" ? "Submit Buy Order" : "Submit Sell Order"}
        </button>
        {msg && (
          <div className="rounded-[12px] bg-desk-accent/10 px-2.5 py-2 text-center text-xs font-medium text-desk-accent md:rounded-control md:px-2 md:py-1.5">
            {msg}
          </div>
        )}
      </div>
    </>
  );

  if (modal) {
    return (
      <div
        className="fx-lx-overlay fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Order ticket"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div
          className={`flex max-h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[20px] border border-desk-border bg-desk-panel shadow-2xl sm:rounded-[16px] ${className}`}
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-l border-desk-border bg-desk-panel md:w-[268px] ${className}`}
    >
      {body}
    </aside>
  );
}
