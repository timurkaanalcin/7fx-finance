"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/symbols";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  selected: string;
  onSelect: (symbol: string) => void;
};

const FILTERS = [
  { id: "ALL", label: "Tümü" },
  { id: "STOCK", label: "Hisse" },
  { id: "FX", label: "FX" },
  { id: "CRYPTO", label: "Kripto" },
  { id: "COMMODITY", label: "Emtia" },
  { id: "INDEX", label: "Endeks" },
];

export default function Watchlist({ symbols, prices, selected, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const list = useMemo(() => {
    return symbols.filter((s) => {
      if (filter !== "ALL" && s.class !== filter) return false;
      if (!q) return true;
      const qq = q.toLowerCase();
      return s.symbol.toLowerCase().includes(qq) || s.name.toLowerCase().includes(qq);
    });
  }, [symbols, q, filter]);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[#3a4658] bg-[#1a2332]">
      <div className="border-b border-[#3a4658] p-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sembol ara…"
          className="w-full rounded-md border border-[#3a4658] bg-[#0f172a] px-2 py-1.5 text-xs outline-none focus:border-blue-500"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                filter === f.id ? "bg-blue-600 text-white" : "bg-[#2a3648] text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.map((s) => {
          const p = prices[s.symbol];
          const up = (p?.change ?? 0) >= 0;
          return (
            <button
              key={s.symbol}
              onClick={() => onSelect(s.symbol)}
              className={`flex w-full items-center gap-2 border-b border-[#2a3648] px-2 py-2 text-left hover:bg-[#243044] ${
                selected === s.symbol ? "bg-[#2a3648]" : ""
              }`}
            >
              <span className="text-sm">{s.flag || "•"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold">{s.symbol}</span>
                  <span className={`text-[10px] tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {p ? `${up ? "+" : ""}${p.changePct.toFixed(2)}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 tabular-nums">
                  <span>{p ? formatPrice(s.symbol, p.bid) : "—"}</span>
                  <span>{p ? formatPrice(s.symbol, p.ask) : "—"}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
