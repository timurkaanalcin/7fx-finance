"use client";

import { formatPrice } from "@/lib/symbols";
import type { PriceTick, SymbolDef } from "./types";

type Props = {
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  onSelect: (symbol: string) => void;
};

export default function FooterTicker({ symbols, prices, onSelect }: Props) {
  const items = [...symbols, ...symbols];
  return (
    <footer className="flex h-8 shrink-0 items-center overflow-hidden border-t border-[#3a4658] bg-[#0f172a]">
      <div className="ticker-track flex whitespace-nowrap">
        {items.map((s, idx) => {
          const p = prices[s.symbol];
          const up = (p?.change ?? 0) >= 0;
          return (
            <button
              key={`${s.symbol}-${idx}`}
              onClick={() => onSelect(s.symbol)}
              className="mx-3 inline-flex items-center gap-1.5 text-[11px] hover:text-white"
            >
              <span>{s.flag}</span>
              <span className="font-medium text-slate-200">{s.symbol}</span>
              <span className={`tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                {p ? formatPrice(s.symbol, p.mid) : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
