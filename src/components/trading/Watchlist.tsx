"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatPrice } from "@/lib/symbols";
import type { PositionRow, PriceTick, SymbolDef } from "./types";
import SymbolIcon from "@/components/ui/SymbolIcon";

type Props = {
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  selected: string;
  onSelect: (symbol: string) => void;
  className?: string;
  /** Optional open positions — shows a per-symbol count + floating P&L badge and an "Açık" filter. */
  openPositions?: PositionRow[];
};


function FlashPrice({
  value,
  text,
  title,
}: {
  value: number | undefined;
  text: string;
  title: string;
}) {
  const prev = useRef<number | null>(null);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) return;
    if (prev.current == null) {
      prev.current = value;
      return;
    }
    if (value === prev.current) return;
    const nextDir = value > prev.current ? "up" : "down";
    prev.current = value;
    setDir(nextDir);
    setFlashKey((k) => k + 1);
    const t = window.setTimeout(() => setDir(null), 500);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <span
      key={flashKey}
      title={title}
      className={
        dir === "up" ? "fx-px-flash-up" : dir === "down" ? "fx-px-flash-down" : undefined
      }
    >
      {text}
    </span>
  );
}

const FAV_KEY = "fx-watch-favs";
const RECENT_KEY = "fx-watch-recent";
const RECENT_MAX = 12;
const SORT_KEY = "fx-watch-sort";

type SortMode = "DEFAULT" | "GAIN" | "LOSS" | "AZ";
const SORT_CYCLE: SortMode[] = ["DEFAULT", "GAIN", "LOSS", "AZ"];
const SORT_ICON: Record<SortMode, string> = { DEFAULT: "⇅", GAIN: "▲%", LOSS: "▼%", AZ: "A–Z" };
const FILTER_IDS = ["FAV", "RECENT", "ALL", "STOCK", "FX", "CRYPTO", "COMMODITY", "INDEX"] as const;

function filterLabel(id: string, t: (key: string) => string): string {
  switch (id) {
    case "RECENT":
      return t("term.watch.recent");
    case "STOCK":
      return t("term.stocks");
    case "FX":
      return t("term.fx");
    case "CRYPTO":
      return t("term.crypto");
    case "COMMODITY":
      return t("term.commodities");
    case "INDEX":
      return t("term.indices");
    default:
      return t("term.all");
  }
}

function sortLabel(mode: SortMode, t: (key: string) => string): string {
  if (mode === "GAIN") return t("term.watch.sortGain");
  if (mode === "LOSS") return t("term.watch.sortLoss");
  if (mode === "AZ") return t("term.watch.sortAz");
  return t("term.watch.sortDefault");
}

type OpenAgg = { count: number; profit: number; buyLots: number; sellLots: number };

function fmtSignedMoney(n: number): string {
  const abs = Math.abs(n);
  const txt = abs >= 1000 ? abs.toLocaleString("en-US", { maximumFractionDigits: 0 }) : abs.toFixed(2);
  return `${n >= 0 ? "+" : "−"}${txt}`;
}

export default function Watchlist({ symbols, prices, selected, onSelect, className = "", openPositions }: Props) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  /** Open positions grouped by catalog symbol (matches both symbol and chartSymbol). */
  const openBySymbol = useMemo(() => {
    const m = new Map<string, OpenAgg>();
    if (!openPositions?.length) return m;
    const known = new Set(symbols.map((s) => s.symbol.toUpperCase()));
    for (const p of openPositions) {
      const a = (p.symbol || "").trim().toUpperCase();
      const b = (p.chartSymbol || "").trim().toUpperCase();
      const key = known.has(a) ? a : known.has(b) ? b : a;
      if (!key) continue;
      const cur = m.get(key) || { count: 0, profit: 0, buyLots: 0, sellLots: 0 };
      cur.count += 1;
      const pr = Number(p.profit);
      if (Number.isFinite(pr)) cur.profit += pr;
      const vol = Number(p.volume) || 0;
      if (p.side === "SELL") cur.sellLots += vol;
      else cur.buyLots += vol;
      m.set(key, cur);
    }
    return m;
  }, [openPositions, symbols]);
  const hasOpen = openBySymbol.size > 0;
  useEffect(() => {
    if (filter === "OPEN" && !hasOpen) setFilter("ALL");
  }, [filter, hasOpen]);
  /** Favourites (★) — per device, localStorage; shown first in every list. */
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      if (Array.isArray(v)) setFavs(v.filter((x) => typeof x === "string").slice(0, 40));
    } catch {}
  }, []);
  const toggleFav = (sym: string) => {
    setFavs((prev) => {
      let next = prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym];
      if (next.length > 40) next = next.slice(-40);
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

  /** Sort mode — per device. Change-% sorts use a snapshot refreshed every 3s so rows don't jump on every tick. */
  const [sortMode, setSortMode] = useState<SortMode>("DEFAULT");
  useEffect(() => {
    try {
      const v = localStorage.getItem(SORT_KEY) as SortMode | null;
      if (v && SORT_CYCLE.includes(v)) setSortMode(v);
    } catch {}
  }, []);
  const cycleSort = () => {
    setSortMode((prev) => {
      const next = SORT_CYCLE[(SORT_CYCLE.indexOf(prev) + 1) % SORT_CYCLE.length];
      try {
        localStorage.setItem(SORT_KEY, next);
      } catch {}
      return next;
    });
  };
  const pricesRef = useRef(prices);
  pricesRef.current = prices;
  const [pctSnap, setPctSnap] = useState<Record<string, number>>({});
  useEffect(() => {
    if (sortMode !== "GAIN" && sortMode !== "LOSS") return;
    const take = () => {
      const snap: Record<string, number> = {};
      for (const [k, v] of Object.entries(pricesRef.current)) {
        const n = Number(v?.changePct);
        if (Number.isFinite(n)) snap[k] = n;
      }
      setPctSnap(snap);
    };
    take();
    const t = window.setInterval(take, 3000);
    return () => window.clearInterval(t);
  }, [sortMode]);

  const baseList = useMemo(() => {
    const qq = q.toLowerCase();
    const match = (s: SymbolDef) => !q || s.symbol.toLowerCase().includes(qq) || s.name.toLowerCase().includes(qq);
    if (filter === "RECENT") {
      const bySym = new Map(symbols.map((s) => [s.symbol, s] as const));
      return recent.map((r) => bySym.get(r)).filter((s): s is SymbolDef => !!s && match(s));
    }
    const out = symbols.filter((s) => {
      if (filter === "FAV") {
        if (!favs.includes(s.symbol)) return false;
      } else if (filter === "OPEN") {
        if (!openBySymbol.has(s.symbol.toUpperCase())) return false;
      } else if (filter !== "ALL" && s.class !== filter) return false;
      return match(s);
    });
    if (!favs.length) return out;
    return [...out.filter((s) => favs.includes(s.symbol)), ...out.filter((s) => !favs.includes(s.symbol))];
  }, [symbols, q, filter, favs, recent, openBySymbol]);

  const list = useMemo(() => {
    // Favourites always float to the top; sortMode applies within fav / non-fav groups.
    if (sortMode === "DEFAULT") return baseList; // baseList already favs-first
    const arr = [...baseList];
    const secondary = (a: SymbolDef, b: SymbolDef) => {
      if (sortMode === "AZ") return a.symbol.localeCompare(b.symbol);
      const dir = sortMode === "GAIN" ? -1 : 1;
      const pa = pctSnap[a.symbol];
      const pb = pctSnap[b.symbol];
      const ha = Number.isFinite(pa);
      const hb = Number.isFinite(pb);
      if (ha !== hb) return ha ? -1 : 1; // symbols without a price go last
      if (!ha) return 0;
      return dir * ((pa as number) - (pb as number));
    };
    if (!favs.length) return arr.sort(secondary);
    const favsPart = arr.filter((s) => favs.includes(s.symbol)).sort(secondary);
    const restPart = arr.filter((s) => !favs.includes(s.symbol)).sort(secondary);
    return [...favsPart, ...restPart];
  }, [baseList, sortMode, pctSnap, favs]);

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
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) {
                e.preventDefault();
                e.stopPropagation();
                setQ("");
              }
            }}
            placeholder={t("term.watch.search")}
            data-fx-watchlist-search=""
            aria-label={t("term.watch.search")}
            aria-keyshortcuts="/"
            className="w-full rounded-[12px] border border-desk-border/80 bg-desk-bg py-2 pl-7 pr-7 text-xs text-desk-text outline-none placeholder:text-desk-muted/70 focus:border-desk-accent md:rounded-control md:py-1.5"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              title={t("term.watch.clear")}
              aria-label={t("term.watch.clear")}
              data-fx-watch-clear=""
              className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[12px] leading-none text-desk-muted hover:bg-desk-hover hover:text-desk-text"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
          {(hasOpen
            ? [
                { id: FILTER_IDS[0], label: "★" },
                { id: "OPEN", label: `${t("term.watch.open")} · ${openBySymbol.size}` },
                ...FILTER_IDS.slice(1).map((id) => ({ id, label: filterLabel(id, t) })),
              ]
            : FILTER_IDS.map((id) => ({ id, label: id === "FAV" ? "★" : filterLabel(id, t) }))
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              title={f.id === "OPEN" ? t("term.watch.open") : undefined}
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
          <p className="mt-2 text-[11px] text-desk-muted">{t("term.watch.favEmpty")}</p>
        )}
        {filter === "RECENT" && recent.length === 0 && (
          <p className="mt-2 text-[11px] text-desk-muted">{t("term.watch.recentEmpty")}</p>
        )}
        <div className="hidden">
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-desk-muted/80 md:px-2.5 md:py-1 md:font-medium md:tracking-[0.08em]">
        <button
          type="button"
          onClick={cycleSort}
          title={sortLabel(sortMode, t)}
          aria-label={sortLabel(sortMode, t)}
          data-fx-watch-sort={sortMode}
          className={`-mx-1 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 uppercase transition-colors hover:bg-desk-hover hover:text-desk-text ${
            sortMode !== "DEFAULT" ? "text-desk-accent" : ""
          }`}
        >
          <span>Symbol</span>
          <span className="normal-case tracking-normal" aria-hidden>
            {SORT_ICON[sortMode]}
          </span>
          {sortMode !== "DEFAULT" && (
            <span className="normal-case tracking-normal text-desk-muted/80">· {sortLabel(sortMode, t)}</span>
          )}
        </button>
        <span>BID / ASK · SPR · %</span>
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
                        title={favs.includes(s.symbol) ? "Favorilerden çıkar" : "Favori"}
                        aria-label={favs.includes(s.symbol) ? "Favorilerden çıkar" : "Favori"}
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
                    {s.name && s.name.toUpperCase() !== s.symbol.toUpperCase() && (
                      <span className="mt-0.5 block truncate text-[10px] text-desk-muted/70" title={s.name}>
                        {s.name}
                      </span>
                    )}
                    {(() => {
                      const agg = openBySymbol.get(s.symbol.toUpperCase());
                      if (!agg) return null;
                      const lots = [
                        agg.buyLots > 0 ? `Alış ${+agg.buyLots.toFixed(2)} lot` : "",
                        agg.sellLots > 0 ? `Satış ${+agg.sellLots.toFixed(2)} lot` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <span
                          data-fx-watch-open={agg.count}
                          title={`${agg.count} açık pozisyon${lots ? ` (${lots})` : ""} · Anlık K/Z ${fmtSignedMoney(agg.profit)}`}
                          className={`mt-0.5 inline-flex max-w-full items-center gap-1 rounded-[6px] px-1 py-px text-[9.5px] font-semibold tabular-nums leading-tight ${
                            agg.profit >= 0 ? "bg-desk-buy/10 text-desk-buy" : "bg-desk-sell/10 text-desk-sell"
                          }`}
                        >
                          <span aria-hidden>●</span>
                          <span>{agg.count}</span>
                          <span className="truncate">{fmtSignedMoney(agg.profit)}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
                    <div className="flex items-baseline gap-1.5 text-[11px] font-medium text-desk-text/80 md:gap-1 md:text-[10px]">
                      <FlashPrice
                        title="Bid"
                        value={p?.bid}
                        text={p ? formatPrice(s.symbol, p.bid) : "—"}
                      />
                      <span className="text-desk-muted/50">/</span>
                      <FlashPrice
                        title="Ask"
                        value={p?.ask}
                        text={p ? formatPrice(s.symbol, p.ask) : "—"}
                      />
                    </div>
                    <span
                      className="text-[10px] tabular-nums text-desk-muted/70 md:text-[9px]"
                      title="Spread (ask − bid)"
                    >
                      {p && Number.isFinite(p.bid) && Number.isFinite(p.ask)
                        ? formatPrice(s.symbol, Number(p.ask) - Number(p.bid))
                        : "—"}
                    </span>
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
          <div className="px-3 py-8 text-center text-xs text-desk-muted">
            <div>Symbol not found</div>
            {(q || filter !== "ALL") && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {filter !== "ALL" && q && (
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className="rounded-[8px] bg-desk-elev/80 px-2 py-1 text-[10px] font-semibold text-desk-text hover:bg-desk-hover"
                  >
                    Tüm piyasalarda ara
                  </button>
                )}
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="rounded-[8px] bg-desk-elev/80 px-2 py-1 text-[10px] font-semibold text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                  >
                    Aramayı temizle
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
