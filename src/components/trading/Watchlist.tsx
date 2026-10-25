"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatPrice } from "@/lib/symbols";
import { displayOpenProfit } from "@/lib/display-profit";
import type { PositionRow, PriceTick, SymbolDef } from "./types";
import SymbolIcon from "@/components/ui/SymbolIcon";

type Props = {
  symbols: SymbolDef[];
  prices: Record<string, PriceTick>;
  selected: string;
  onSelect: (symbol: string) => void;
  className?: string;
  /** Optional open positions — shows a per-symbol count + floating P&L badge and an open-only filter. */
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

const WatchRow = memo(function WatchRow({
  symbol,
  name,
  flag,
  active,
  fav,
  price,
  openCount,
  openProfit,
  openLots,
  onSelect,
  onToggleFav,
  onKeyNav,
}: {
  symbol: string;
  name: string;
  flag: string;
  active: boolean;
  fav: boolean;
  price: PriceTick | undefined;
  openCount: number;
  openProfit: number;
  openLots: string;
  onSelect: (symbol: string) => void;
  onToggleFav: (symbol: string) => void;
  onKeyNav: (key: "ArrowDown" | "ArrowUp" | "Home" | "End") => void;
}) {
  const { t } = useI18n();
  const up = (price?.change ?? 0) >= 0;
  const showName = name.length > 0 && name.toUpperCase() !== symbol.toUpperCase();
  const openTitle =
    openCount > 0
      ? `${t("term.watch.openPos").replace("{n}", String(openCount))}${openLots ? ` (${openLots})` : ""} · ${t("term.watch.livePnl")} ${fmtSignedMoney(openProfit)}`
      : "";
  return (
    <button
      type="button"
      data-fx-watch-row={symbol}
      tabIndex={active ? 0 : -1}
      onClick={() => onSelect(symbol)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
          e.preventDefault();
          onKeyNav(e.key);
        }
      }}
      className={`fx-watch-row relative flex w-full items-center gap-2.5 border-b border-desk-border/30 px-3 py-2.5 text-left transition-colors hover:bg-desk-hover/80 md:gap-2 md:px-2.5 md:py-1.5 ${
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
        <SymbolIcon symbol={symbol} fallback={flag || "•"} size={20} className="md:!h-4 md:!w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span
              className={`flex items-center truncate text-[13px] font-normal tracking-tight md:text-[12px] ${
                active ? "text-desk-accent" : "text-desk-text"
              }`}
            >
              {symbol}
              <span
                role="button"
                tabIndex={active ? 0 : -1}
                title={fav ? t("term.watch.unfav") : t("term.watch.fav")}
                aria-label={fav ? t("term.watch.unfav") : t("term.watch.fav")}
                aria-pressed={fav}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFav(symbol);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFav(symbol);
                  }
                }}
                className={`fx-fav ml-1.5 inline-flex h-6 w-6 -my-1 items-center justify-center rounded-full align-middle text-[13px] leading-none md:h-4 md:w-4 md:text-[11px] ${
                  fav ? "fx-fav--on text-[#c8a96a]" : "text-desk-muted/60 hover:text-desk-text"
                }`}
              >
                {fav ? "★" : "☆"}
              </span>
            </span>
            {showName && (
              <span className="mt-0.5 block truncate text-[10px] text-desk-muted" title={name}>
                {name}
              </span>
            )}
            {openCount > 0 && (
              <span
                data-fx-watch-open={openCount}
                title={openTitle}
                className={`mt-0.5 inline-flex max-w-full items-center gap-1 rounded-[6px] px-1 py-px text-[9.5px] font-normal tabular-nums leading-tight ${
                  openProfit >= 0 ? "bg-desk-buy/10 text-desk-buy" : "bg-desk-sell/10 text-desk-sell"
                }`}
              >
                <span aria-hidden>●</span>
                <span>{openCount}</span>
                <span className="truncate">{fmtSignedMoney(openProfit)}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
            <div className="flex items-baseline gap-1.5 text-[11px] font-normal tabular-nums text-desk-text/80 md:gap-1 md:text-[10px]">
              <FlashPrice title={t("term.bid")} value={price?.bid} text={price ? formatPrice(symbol, price.bid) : "—"} />
              <span className="text-desk-muted/50">/</span>
              <FlashPrice title={t("term.ask")} value={price?.ask} text={price ? formatPrice(symbol, price.ask) : "—"} />
            </div>
            <span className="text-[10px] tabular-nums text-desk-muted/70 md:text-[9px]" title={t("term.watch.spread")}>
              {price && Number.isFinite(price.bid) && Number.isFinite(price.ask)
                ? formatPrice(symbol, Number(price.ask) - Number(price.bid))
                : "—"}
            </span>
            <span
              className={`rounded-[6px] px-1.5 py-0.5 text-[11px] font-normal tabular-nums md:rounded md:px-1 md:py-px md:text-[10px] ${
                !price ? "text-desk-muted" : up ? "bg-desk-buy/12 text-desk-buy" : "bg-desk-sell/12 text-desk-sell"
              }`}
              title={t("term.watch.day")}
            >
              {price ? `${up ? "+" : ""}${price.changePct.toFixed(2)}%` : "—"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
});

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
      const tick = prices[key] || prices[a] || prices[b];
      const quoted = tick ? (p.side === "SELL" ? tick.ask : tick.bid) : Number.NaN;
      const live = Number.isFinite(quoted) && quoted > 0 ? quoted : tick?.mid;
      const mark = Number.isFinite(live) && live > 0 ? live : Number(p.currentPrice) || Number(p.openPrice);
      const size = symbols.find((s) => s.symbol.toUpperCase() === key)?.contractSize;
      cur.profit += displayOpenProfit(p, mark, size);
      const vol = Number(p.volume) || 0;
      if (p.side === "SELL") cur.sellLots += vol;
      else cur.buyLots += vol;
      m.set(key, cur);
    }
    return m;
  }, [openPositions, symbols, prices]);
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
  const toggleFav = useCallback((sym: string) => {
    setFavs((prev) => {
      let next = prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym];
      if (next.length > 40) next = next.slice(-40);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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

  const listRef = useRef<HTMLDivElement>(null);
  const focusRow = useCallback((symbol: string) => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-fx-watch-row="${CSS.escape(symbol)}"]`);
    el?.focus();
  }, []);
  const onKeyNav = useCallback(
    (key: "ArrowDown" | "ArrowUp" | "Home" | "End") => {
      if (!list.length) return;
      const current = list.findIndex((s) => s.symbol === selected);
      const start = current >= 0 ? current : 0;
      let next = start;
      if (key === "ArrowDown") next = Math.min(list.length - 1, start + 1);
      if (key === "ArrowUp") next = Math.max(0, start - 1);
      if (key === "Home") next = 0;
      if (key === "End") next = list.length - 1;
      const symbol = list[next].symbol;
      onSelect(symbol);
      window.requestAnimationFrame(() => focusRow(symbol));
    },
    [list, selected, onSelect, focusRow]
  );

  return (
    <aside
      className={`fx-watchlist flex w-full shrink-0 flex-col border-r border-desk-border bg-desk-panel ${className}`}
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
              if (e.key === "ArrowDown" && list.length) {
                e.preventDefault();
                const symbol = list.some((s) => s.symbol === selected) ? selected : list[0].symbol;
                onSelect(symbol);
                window.requestAnimationFrame(() => focusRow(symbol));
              }
            }}
            placeholder={t("term.watch.search")}
            data-fx-watchlist-search=""
            aria-label={t("term.watch.search")}
            aria-keyshortcuts="/"
            className="w-full rounded-[12px] border border-desk-border/80 bg-desk-bg py-2 pl-7 pr-11 text-xs font-normal text-desk-text outline-none placeholder:text-desk-muted focus:border-desk-accent md:rounded-control md:py-1.5 md:pr-7"
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
              className={`fx-watch-filter shrink-0 rounded-[8px] px-2 py-1 text-[10px] font-normal transition-colors md:rounded-[7px] md:px-1.5 md:py-0.5 ${
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
      <div className="flex items-center justify-between px-3 py-1.5 text-[9px] font-normal uppercase tracking-[0.1em] text-desk-muted/80 md:px-2.5 md:py-1 md:tracking-[0.08em]">
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
          <span>{t("term.col.symbol")}</span>
          <span className="normal-case tracking-normal" aria-hidden>
            {SORT_ICON[sortMode]}
          </span>
          {sortMode !== "DEFAULT" && (
            <span className="normal-case tracking-normal text-desk-muted/80">· {sortLabel(sortMode, t)}</span>
          )}
        </button>
        <span>{t("term.watch.quote")}</span>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto" aria-keyshortcuts="ArrowUp ArrowDown">
        {list.map((s) => {
          const agg = openBySymbol.get(s.symbol.toUpperCase());
          const openLots = agg
            ? [
                agg.buyLots > 0 ? `${t("term.bid")} ${+agg.buyLots.toFixed(2)} ${t("term.unit.lot")}` : "",
                agg.sellLots > 0 ? `${t("term.ask")} ${+agg.sellLots.toFixed(2)} ${t("term.unit.lot")}` : "",
              ]
                .filter(Boolean)
                .join(" · ")
            : "";
          return (
            <WatchRow
              key={s.symbol}
              symbol={s.symbol}
              name={s.name || ""}
              flag={s.flag || "•"}
              active={selected === s.symbol}
              fav={favs.includes(s.symbol)}
              price={prices[s.symbol]}
              openCount={agg?.count ?? 0}
              openProfit={agg?.profit ?? 0}
              openLots={openLots}
              onSelect={onSelect}
              onToggleFav={toggleFav}
              onKeyNav={onKeyNav}
            />
          );
        })}
        {list.length === 0 && !(filter === "RECENT" && recent.length === 0) && (
          <div className="px-3 py-8 text-center text-xs text-desk-muted">
            <div>{t("term.watch.notFound")}</div>
            {(q || filter !== "ALL") && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {filter !== "ALL" && q && (
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className="fx-watch-filter rounded-[8px] bg-desk-elev/80 px-2 py-1 text-[10px] font-normal text-desk-text hover:bg-desk-hover"
                  >
                    {t("term.watch.searchAll")}
                  </button>
                )}
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="fx-watch-filter rounded-[8px] bg-desk-elev/80 px-2 py-1 text-[10px] font-normal text-desk-muted hover:bg-desk-hover hover:text-desk-text"
                  >
                    {t("term.watch.clear")}
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
