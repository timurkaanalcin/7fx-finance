"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/symbols";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  symbol: string;
  symbols: SymbolDef[];
  price?: PriceTick;
  onPlaced: () => void;
  className?: string;
};

export default function OrderTicket({ symbol, symbols, price, onPlaced, className = "" }: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
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

  useEffect(() => {
    if (price) setLimitPrice(formatPrice(symbol, price.mid));
    setSl("");
    setTp("");
    setShowSl(false);
    setShowTp(false);
  }, [symbol, price]);

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          type,
          volume: Number(volume),
          price: type === "MARKET" ? undefined : Number(limitPrice),
          stopLoss: showSl && sl ? Number(sl) : undefined,
          takeProfit: showTp && tp ? Number(tp) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Hata");
        return;
      }
      setMsg(type === "MARKET" ? "Pozisyon açıldı" : "Bekleyen emir oluşturuldu");
      onPlaced();
    } catch {
      setMsg("Bağlantı hatası");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-[12px] border border-desk-border/80 bg-desk-bg px-3 py-2.5 text-sm text-desk-text outline-none transition-colors focus:border-desk-accent md:rounded-control md:px-2.5 md:py-2";

  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-l border-desk-border bg-desk-panel md:w-[268px] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-desk-border/80 px-3.5 py-3 md:px-3 md:py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-desk-muted">
          Emir Bileti
        </span>
        <span className="rounded-full border border-desk-border/60 bg-desk-elev/80 px-2.5 py-0.5 text-[10px] font-semibold text-desk-text">
          {def?.flag} {symbol}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5 md:space-y-3 md:p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-desk-border/60 bg-desk-bg/80 px-2.5 py-2.5 text-center md:rounded-control md:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-desk-muted">Alış</div>
            <div className="mt-0.5 text-[15px] font-bold tabular-nums text-desk-buy md:text-sm md:font-semibold">
              {price ? formatPrice(symbol, price.ask) : "—"}
            </div>
          </div>
          <div className="rounded-[12px] border border-desk-border/60 bg-desk-bg/80 px-2.5 py-2.5 text-center md:rounded-control md:py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-desk-muted">Satış</div>
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
            Emir Türü
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "MARKET" | "LIMIT" | "STOP")}
            className={inputCls}
          >
            <option value="MARKET">Piyasa</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP">Stop</option>
          </select>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
            Hacim (Lot)
          </div>
          <div className="flex items-center gap-2 md:gap-1.5">
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
        </div>

        {type !== "MARKET" && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-desk-muted">
              Fiyat
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
            onClick={() => {
              setShowSl((v) => {
                if (v) setSl("");
                return !v;
              });
            }}
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
            onClick={() => {
              setShowTp((v) => {
                if (v) setTp("");
                return !v;
              });
            }}
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
              placeholder="Fiyat"
              autoFocus
              className="w-full rounded-[12px] border border-desk-sell/40 bg-desk-bg px-3 py-2.5 text-sm tabular-nums text-desk-text outline-none focus:border-desk-sell md:rounded-control md:px-2.5 md:py-2"
            />
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
              placeholder="Fiyat"
              className="w-full rounded-[12px] border border-desk-buy/40 bg-desk-bg px-3 py-2.5 text-sm tabular-nums text-desk-text outline-none focus:border-desk-buy md:rounded-control md:px-2.5 md:py-2"
            />
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
          {busy ? "Gönderiliyor…" : side === "BUY" ? "Alış Emri Gönder" : "Satış Emri Gönder"}
        </button>
        {msg && (
          <div className="rounded-[12px] bg-desk-accent/10 px-2.5 py-2 text-center text-xs font-medium text-desk-accent md:rounded-control md:px-2 md:py-1.5">
            {msg}
          </div>
        )}
      </div>
    </aside>
  );
}
