"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/symbols";
import type { PriceTick, SymbolDef } from "./types";
import SymbolIcon from "@/components/ui/SymbolIcon";

type Props = {
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  selected: string;
  onSelect: (symbol: string) => void;
  className?: string;
};

const FAV_KEY = "fx-watch-favs";
const RECENT_KEY = "fx-watch-recent";
const RECENT_MAX = 12;

const FILTERS = [
  { id: "FAV", label: "★" },
  { id: "RECENT", label: "Recent" },
  { id: "ALL", label: "All" },
  { id: "STOCK", label: "Stocks" },
  { id: "FX", label: "FX" },
  { id: "CRYPTO", label: "Crypto" },
  { id: "COMMODITY", label: "Commodities" },
  { id: "INDEX", label: "Indices" },
];

export default function Watchlist({ symbols, prices, selected, onSelect, className = "" }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  /** Favourites (★) — per device, localStorage; shown first in every list. */
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      if (Array.isArray(v)) setFavs(v.filter((x) => typeof x === "string").slice(0, 200));
    } catch {}
  }, []);
  const toggleFav = (sym: string) => {
    setFavs((prev) => {
      const next = prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  /** Recently viewed symbols (most-recent-first) — per device, localStorage. */
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    let stored: string[] = [];
    try {
      const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(v)) stored = v.filter((x) => typeof x === "string").slice(0, RECENT_MAX);
    } catch {}
    setRecent(stored);
  }, []);
  useEffect(() => {
    if (!selected) return;
    setRecent((prev) => {
      let base = prev;
      if (!base.length) {
        try {
          const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
          if (Array.isArray(v)) base = v.filter((x) => typeof x === "string");
        } catch {}
      }
      if (base[0] === selected) return base;
      const next = [selected, ...base.filter((x) => x !== selected)].slice(0, RECENT_MAX);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [selected]);

  const list = useMemo(() => {
    const qq = q.toLowerCase();
    const match = (s: SymbolDef) => !q || s.symbol.toLowerCase().includes(qq) || s.name.toLowerCase().includes(qq);
    if (filter === "RECENT") {
      const bySym = new Map(symbols.map((s) => [s.symbol, s] as const));
      return recent.map((r) => bySym.get(r)).filter((s): s is SymbolDef => !!s && match(s));
    }
    const out = symbols.filter((s) => {
      if (filter === "FAV") {
        if (!favs.includes(s.symbol)) return false;
      } else if (filter !== "ALL" && s.class !== filter) return false;
      return match(s);
    });
    if (!favs.length) return out;
    return [...out.filter((s) => favs.includes(s.symbol)), ...out.filter((s) => !favs.includes(s.symbol))];
  }, [symbols, q, filter, favs, recent]);

  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-r border-desk-border bg-desk-panel md:w-[232px] ${className}`}
    >
      <div className="border-b border-desk-border/80 px-3 py-2.5 md:px-2.5 md:py-2">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-desk-muted"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symbol…"
            data-fx-watchlist-search=""
            aria-label="Search symbol"
            aria-keyshortcuts="/"
            className="w-full rounded-[12px] border border-desk-border/80 bg-desk-bg py-2 pl-7 pr-2 text-xs text-desk-text outline-none placeholder:text-desk-muted/70 focus:border-desk-accent md:rounded-control md:py-1.5"
          />
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-[8px] px-2 py-1 text-[10px] font-semibold transition-colors md:rounded-[7px] md:px-1.5 md:py-0.5 md:font-medium ${
                filter === f.id
                  ? "bg-desk-accent text-desk-accent-ink shadow-accent-glow-sm"
                  : "bg-desk-elev/80 text-desk-muted hover:bg-desk-hover hover:text-desk-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filter === "FAV" && list.length === 0 && (
          <p className="mt-2 text-[11px] text-desk-muted">Tap ☆ next to a symbol to add it to favourites.</p>
        )}
        {filter === "RECENT" && recent.length === 0 && (
          <p className="mt-2 text-[11px] text-desk-muted">Symbols you open will appear here.</p>
        )}
        <div className="hidden">
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-desk-muted/80 md:px-2.5 md:py-1 md:font-medium md:tracking-[0.08em]">
        <span>Symbol</span>
        <span>BID / ASK · %</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.map((s) => {
          const p = prices[s.symbol];
          const up = (p?.change ?? 0) >= 0;
          const active = selected === s.symbol;
          return (
            <button
              key={s.symbol}
              onClick={() => onSelect(s.symbol)}
              className={`relative flex w-full items-center gap-2.5 border-b border-desk-border/30 px-3 py-2.5 text-left transition-colors hover:bg-desk-hover/80 md:gap-2 md:px-2.5 md:py-1.5 ${
                active ? "bg-desk-elev/90" : "bg-transparent"
              }`}
            >
              {active && (
                <span
                  className="absolute bottom-1 left-0 top-1 w-[3px] rounded-r-full bg-desk-accent shadow-[0_0_8px_rgba(255,255,255,0.5)] md:bottom-0.5 md:top-0.5"
                  aria-hidden
                />
              )}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-desk-bg md:h-5 md:w-5 md:rounded-full md:bg-transparent">
                <SymbolIcon symbol={s.symbol} fallback={s.flag || "•"} size={20} className="md:!h-4 md:!w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={`flex items-center truncate text-[13px] font-semibold tracking-tight md:text-[12px] ${
                        active ? "text-desk-accent" : "text-desk-text"
                      }`}
                    >
                      {s.symbol}
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={favs.includes(s.symbol) ? "Remove from favourites" : "Add to favourites"}
                        aria-pressed={favs.includes(s.symbol)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(s.symbol);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFav(s.symbol);
                          }
                        }}
                        className={`fx-fav ml-1.5 inline-flex h-6 w-6 -my-1 items-center justify-center rounded-full align-middle text-[13px] leading-none md:h-4 md:w-4 md:text-[11px] ${
                          favs.includes(s.symbol) ? "fx-fav--on text-[#c8a96a]" : "text-desk-muted/60 hover:text-desk-text"
                        }`}
                      >
                        {favs.includes(s.symbol) ? "★" : "☆"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-desk-muted/70 md:hidden">
                      {s.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
                    <div className="flex items-baseline gap-1.5 text-[11px] font-medium text-desk-text/80 md:gap-1 md:text-[10px]">
                      <span title="Bid">{p ? formatPrice(s.symbol, p.bid) : "—"}</span>
                      <span className="text-desk-muted/50">/</span>
                      <span title="Ask">{p ? formatPrice(s.symbol, p.ask) : "—"}</span>
                    </div>
                    <span
                      className={`rounded-[6px] px-1.5 py-0.5 text-[11px] font-semibold md:rounded md:px-1 md:py-px md:text-[10px] ${
                        !p
                          ? "text-desk-muted"
                          : up
                            ? "bg-desk-buy/12 text-desk-buy"
                            : "bg-desk-sell/12 text-desk-sell"
                      }`}
                      title="Daily change %"
                    >
                      {p ? `${up ? "+" : ""}${p.changePct.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && !(filter === "RECENT" && recent.length === 0) && (
          <div className="px-3 py-8 text-center text-xs text-desk-muted">Symbol not found</div>
        )}
      </div>
    </aside>
  );
}
