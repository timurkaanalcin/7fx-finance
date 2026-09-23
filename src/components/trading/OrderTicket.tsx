"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/symbols";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  symbol: string;
  symbols: SymbolDef[];
  price?: PriceTick;
  onPlaced: () => void;
};

export default function OrderTicket({ symbol, symbols, price, onPlaced }: Props) {
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

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-l border-[#3a4658] bg-[#1e293b]">
      <div className="border-b border-[#3a4658] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        Emir Bileti
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <div className="mb-1 text-[10px] uppercase text-slate-400">Varlık</div>
          <div className="rounded-md border border-[#3a4658] bg-[#0f172a] px-2 py-1.5 text-sm font-semibold">
            {def?.flag} {symbol}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-md bg-[#0f172a] p-2">
            <div className="text-[10px] text-slate-400">ALIŞ</div>
            <div className="font-semibold text-emerald-400 tabular-nums">
              {price ? formatPrice(symbol, price.ask) : "—"}
            </div>
          </div>
          <div className="rounded-md bg-[#0f172a] p-2">
            <div className="text-[10px] text-slate-400">SATIŞ</div>
            <div className="font-semibold text-red-400 tabular-nums">
              {price ? formatPrice(symbol, price.bid) : "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`rounded-md py-2 text-sm font-semibold ${
              side === "BUY" ? "bg-emerald-600" : "bg-[#2a3648] text-slate-300"
            }`}
          >
            AL
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`rounded-md py-2 text-sm font-semibold ${
              side === "SELL" ? "bg-red-600" : "bg-[#2a3648] text-slate-300"
            }`}
          >
            SAT
          </button>
        </div>

        <div>
          <div className="mb-1 text-[10px] uppercase text-slate-400">Emir Türü</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "MARKET" | "LIMIT" | "STOP")}
            className="w-full rounded-md border border-[#3a4658] bg-[#0f172a] px-2 py-1.5 text-sm"
          >
            <option value="MARKET">Piyasa</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP">Stop</option>
          </select>
        </div>

        <div>
          <div className="mb-1 text-[10px] uppercase text-slate-400">Hacim (Lot)</div>
          <input
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-full rounded-md border border-[#3a4658] bg-[#0f172a] px-2 py-1.5 text-sm tabular-nums"
          />
        </div>

        {type !== "MARKET" && (
          <div>
            <div className="mb-1 text-[10px] uppercase text-slate-400">Fiyat</div>
            <input
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full rounded-md border border-[#3a4658] bg-[#0f172a] px-2 py-1.5 text-sm tabular-nums"
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
            className={`rounded-md py-2 text-xs font-semibold ${
              showSl ? "bg-red-600/90 text-white" : "bg-[#2a3648] text-slate-300 hover:bg-[#334155]"
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
            className={`rounded-md py-2 text-xs font-semibold ${
              showTp ? "bg-emerald-600/90 text-white" : "bg-[#2a3648] text-slate-300 hover:bg-[#334155]"
            }`}
          >
            TP {showTp ? "✓" : ""}
          </button>
        </div>

        {showSl && (
          <div>
            <div className="mb-1 text-[10px] uppercase text-slate-400">Stop Loss</div>
            <input
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder="Fiyat"
              autoFocus
              className="w-full rounded-md border border-red-500/40 bg-[#0f172a] px-2 py-1.5 text-sm tabular-nums"
            />
          </div>
        )}

        {showTp && (
          <div>
            <div className="mb-1 text-[10px] uppercase text-slate-400">Take Profit</div>
            <input
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="Fiyat"
              className="w-full rounded-md border border-emerald-500/40 bg-[#0f172a] px-2 py-1.5 text-sm tabular-nums"
            />
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className={`w-full rounded-md py-2.5 text-sm font-semibold disabled:opacity-60 ${
            side === "BUY" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {busy ? "Gönderiliyor…" : side === "BUY" ? "Alış Emri" : "Satış Emri"}
        </button>
        {msg && <div className="text-center text-xs text-blue-300">{msg}</div>}
      </div>
    </aside>
  );
}
