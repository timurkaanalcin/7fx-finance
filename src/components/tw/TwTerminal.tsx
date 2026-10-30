"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { localizeTradeError } from "@/lib/trade-errors";
import { formatPrice } from "@/lib/symbols";
import type { OrderRow, PositionRow, PriceTick, SymbolDef, UserInfo } from "@/components/trading/types";
import TwChart, {
  type TwBar,
  type TwChartType,
  type TwDrawing,
  type TwIndicators,
  type TwTool,
} from "./TwChart";
import "./tw.css";

const Watchlist = dynamic(() => import("@/components/trading/Watchlist"));
const BottomPanels = dynamic(() => import("@/components/trading/BottomPanels"));
const OrderTicket = dynamic(() => import("@/components/trading/OrderTicket"));

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1D", "1W"] as const;
const PREFS_KEY = "7fx_tw_v1";
const DRAW_KEY = "7fx_tw_draw_v1";

type Tab = "open" | "closed" | "pending";
type Sheet = "watch" | "book" | "tools" | null;

type Prefs = {
  symbol?: string;
  timeframe?: string;
  chartType?: TwChartType;
  indicators?: TwIndicators;
};

const TOOLS: { id: TwTool; key: string; icon: ReactNode }[] = [
  { id: "cursor", key: "tw.tool.cursor", icon: <CursorIcon /> },
  { id: "trend", key: "tw.tool.trend", icon: <TrendIcon /> },
  { id: "hline", key: "tw.tool.hline", icon: <HLineIcon /> },
  { id: "vline", key: "tw.tool.vline", icon: <VLineIcon /> },
  { id: "ray", key: "tw.tool.ray", icon: <RayIcon /> },
  { id: "rect", key: "tw.tool.rect", icon: <RectIcon /> },
  { id: "erase", key: "tw.tool.erase", icon: <EraseIcon /> },
];

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") as Prefs;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function readDrawings(symbol: string): TwDrawing[] {
  try {
    const all = JSON.parse(localStorage.getItem(DRAW_KEY) || "{}") as Record<string, TwDrawing[]>;
    const rows = all[symbol];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeDrawings(symbol: string, rows: TwDrawing[]) {
  try {
    const all = JSON.parse(localStorage.getItem(DRAW_KEY) || "{}") as Record<string, TwDrawing[]>;
    all[symbol] = rows.slice(-80);
    localStorage.setItem(DRAW_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

async function postTrade(url: string, body: unknown, fallback: string, t: (key: string) => string) {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true as const };
    const data = await res.json().catch(() => ({}));
    const raw = data && typeof data.error === "string" && data.error.trim() ? data.error.trim() : fallback;
    return { ok: false as const, error: localizeTradeError(raw, t) };
  } catch {
    return { ok: false as const, error: fallback };
  }
}

export default function TwTerminal() {
  const { t } = useI18n();
  const [desk, setDesk] = useState(false);
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<(typeof INTERVALS)[number]>("1h");
  const [chartType, setChartType] = useState<TwChartType>("candle");
  const [indicators, setIndicators] = useState<TwIndicators>({ sma: false, ema: false, bb: false });
  const [tool, setTool] = useState<TwTool>("cursor");
  const [drawings, setDrawings] = useState<TwDrawing[]>([]);
  const [symbols, setSymbols] = useState<SymbolDef[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const [bars, setBars] = useState<TwBar[]>([]);
  const [chartError, setChartError] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<"unknown" | "in" | "out">("unknown");
  const [openPositions, setOpenPositions] = useState<PositionRow[]>([]);
  const [closedPositions, setClosedPositions] = useState<PositionRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState<Tab>("open");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<"type" | "ind" | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [actionError, setActionError] = useState<string | null>(null);
  const [boot, setBoot] = useState(0);
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  useEffect(() => {
    const prefs = readPrefs();
    if (prefs.symbol) setSymbol(prefs.symbol);
    if (prefs.timeframe && (INTERVALS as readonly string[]).includes(prefs.timeframe)) {
      setTimeframe(prefs.timeframe as (typeof INTERVALS)[number]);
    }
    if (prefs.chartType === "candle" || prefs.chartType === "bar" || prefs.chartType === "line" || prefs.chartType === "area") {
      setChartType(prefs.chartType);
    }
    if (prefs.indicators) setIndicators(prefs.indicators);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setDesk(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    try {
      const prev = readPrefs();
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, symbol, timeframe, chartType, indicators }));
    } catch {
      /* ignore */
    }
  }, [symbol, timeframe, chartType, indicators]);

  useEffect(() => {
    setDrawings(readDrawings(symbol));
  }, [symbol]);

  const saveDrawings = useCallback(
    (next: TwDrawing[]) => {
      setDrawings(next);
      writeDrawings(symbolRef.current, next);
    },
    []
  );

  const loadChart = useCallback(async (sym: string, tf: string) => {
    try {
      const res = await fetch(`/api/market/ohlc?symbol=${encodeURIComponent(sym)}&timeframe=${encodeURIComponent(tf)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (symbolRef.current !== sym) return;
      const candles = Array.isArray(data.candles) ? (data.candles as TwBar[]) : [];
      setBars(candles);
      setChartError(!res.ok && candles.length === 0);
    } catch {
      if (symbolRef.current === sym) setChartError(true);
    }
  }, []);

  const loadBook = useCallback(async () => {
    const tz = new Date().getTimezoneOffset();
    const [me, symRes, openRes, closedRes, ordersRes] = await Promise.all([
      fetch("/api/auth/me", { credentials: "include", cache: "no-store" }),
      fetch("/api/symbols", { cache: "no-store" }),
      fetch("/api/positions?status=OPEN&skip=0", { credentials: "include", cache: "no-store" }),
      fetch(`/api/positions?status=CLOSED&skip=0&tzOffset=${tz}&calendar=0`, { credentials: "include", cache: "no-store" }),
      fetch("/api/orders?status=PENDING", { credentials: "include", cache: "no-store" }),
    ]);
    if (symRes.ok) {
      const list = await symRes.json();
      if (Array.isArray(list)) setSymbols(list as SymbolDef[]);
    }
    if (me.ok) {
      const body = await me.json();
      if (body.user) {
        setUser(body.user as UserInfo);
        setSession("in");
      } else setSession("out");
    } else {
      setUser(null);
      setSession("out");
    }
    if (openRes.ok) {
      const body = await openRes.json();
      setOpenPositions(Array.isArray(body.positions) ? body.positions : Array.isArray(body) ? body : []);
    }
    if (closedRes.ok) {
      const body = await closedRes.json();
      setClosedPositions(Array.isArray(body.positions) ? body.positions : []);
    }
    if (ordersRes.ok) {
      const body = await ordersRes.json();
      setPendingOrders(Array.isArray(body) ? body : []);
    }
  }, []);

  useEffect(() => {
    void loadBook();
    const id = window.setInterval(() => void loadBook(), 20000);
    return () => window.clearInterval(id);
  }, [loadBook, boot]);

  useEffect(() => {
    void loadChart(symbol, timeframe);
    const id = window.setInterval(() => void loadChart(symbol, timeframe), 20000);
    return () => window.clearInterval(id);
  }, [symbol, timeframe, loadChart, boot]);

  useEffect(() => {
    let stop = false;
    async function pull() {
      if (document.hidden) return;
      const res = await fetch("/api/market/quote", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (stop || !Array.isArray(data.prices)) return;
      const next: Record<string, PriceTick> = {};
      for (const tick of data.prices as PriceTick[]) next[tick.symbol] = tick;
      setPrices(next);
      const live = next[symbolRef.current];
      if (!live || !Number.isFinite(live.mid)) return;
      setBars((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const close = live.mid;
        return [
          ...prev.slice(0, -1),
          { ...last, close, high: Math.max(last.high, close), low: Math.min(last.low, close) },
        ];
      });
    }
    void pull();
    const id = window.setInterval(() => void pull(), 3000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [boot]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setSheet(null);
        setSearchOpen(false);
        setMenu(null);
        setTool("cursor");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? symbols.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      : symbols;
    return list.slice(0, 40);
  }, [symbols, query]);

  const price = prices[symbol];
  const up = (price?.change ?? 0) >= 0;
  const blocked = user?.tradingEnabled === false || user?.mustChangePassword === true || !!user?.impersonatedBy;

  async function closeOne(id: string, volume?: number) {
    if (user?.impersonatedBy) return { ok: false as const, error: t("term.impersonationReadOnly") };
    const body: { id: string; volume?: number } = { id };
    if (volume != null && Number.isFinite(volume)) body.volume = volume;
    const result = await postTrade("/api/positions/close", body, t("common.error"), t);
    if (result.ok) {
      setActionError(null);
      await loadBook();
    }
    return result;
  }

  async function modifyOne(id: string, levels: { stopLoss: number | null; takeProfit: number | null }) {
    if (user?.impersonatedBy) return { ok: false as const, error: t("term.impersonationReadOnly") };
    const result = await postTrade("/api/positions/modify", { id, ...levels }, t("common.error"), t);
    if (result.ok) {
      setActionError(null);
      await loadBook();
    }
    return result;
  }

  async function closeMany(ids: string[]) {
    if (user?.impersonatedBy) {
      setActionError(t("term.impersonationReadOnly"));
      return;
    }
    let first = "";
    for (const id of ids) {
      const result = await postTrade("/api/positions/close", { id }, t("common.error"), t);
      if (!result.ok && !first) first = result.error;
    }
    await loadBook();
    setActionError(first || null);
  }

  async function cancelOne(id: string) {
    if (user?.impersonatedBy) return { ok: false as const, error: t("term.impersonationReadOnly") };
    const result = await postTrade("/api/orders/cancel", { id }, t("common.error"), t);
    if (result.ok) {
      setActionError(null);
      await loadBook();
    } else setActionError(result.error);
    return result;
  }

  async function cancelMany(ids: string[]) {
    if (user?.impersonatedBy) {
      setActionError(t("term.impersonationReadOnly"));
      return;
    }
    let first = "";
    for (const id of ids) {
      const result = await postTrade("/api/orders/cancel", { id }, t("common.error"), t);
      if (!result.ok && !first) first = result.error;
    }
    await loadBook();
    setActionError(first || null);
  }

  function pickSymbol(next: string) {
    setSymbol(next);
    setSearchOpen(false);
    setQuery("");
    if (!desk) setSheet(null);
  }

  const book = (
    <BottomPanels
      className="h-full min-h-0 border-t-0"
      tab={tab}
      onTab={setTab}
      openPositions={openPositions}
      closedPositions={closedPositions}
      pendingOrders={pendingOrders}
      prices={prices}
      currency="USD"
      onClosePosition={closeOne}
      onClosePositions={closeMany}
      onModifySlTp={modifyOne}
      onCancelOrder={cancelOne}
      onCancelOrders={cancelMany}
      onSelectSymbol={pickSymbol}
      onReopenTrade={(draft) => {
        setSymbol(draft.symbol);
        setOrderSide(draft.side);
        setOrderOpen(true);
      }}
      onBrowseMarkets={() => {
        if (desk) return;
        setSheet("watch");
      }}
    />
  );

  const watch = (
    <Watchlist
      className="h-full min-h-0 border-r-0"
      symbols={symbols}
      prices={prices}
      openPositions={openPositions}
      selected={symbol}
      onSelect={pickSymbol}
    />
  );

  return (
    <div className="tw">
      <header className="tw-toolbar">
        <Link href="/trade" aria-label="7FX" className="inline-flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- monochrome bitmap mark */}
          <img src="/7fx-logo.png" alt="" width={28} height={28} className="fx-logo-paper h-7 w-7" />
        </Link>
        <div className="tw-search">
          <button
            type="button"
            className="tw-chip"
            aria-expanded={searchOpen}
            aria-label={t("tw.search")}
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenu(null);
            }}
          >
            <span>{symbol}</span>
          </button>
          {searchOpen && (
            <div className="tw-pop" role="listbox" aria-label={t("tw.symbol")}>
              <input
                autoFocus
                value={query}
                placeholder={t("tw.search")}
                aria-label={t("tw.search")}
                onChange={(ev) => setQuery(ev.target.value)}
              />
              {matches.length === 0 && <p className="px-3 py-3 text-xs text-desk-muted">{t("tw.searchEmpty")}</p>}
              {matches.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  aria-current={item.symbol === symbol}
                  onClick={() => pickSymbol(item.symbol)}
                >
                  <span>{item.symbol}</span>
                  <span className="truncate text-desk-muted">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="tw-quote" aria-label={t("term.liveQuote")}>
          <span className={up ? "up" : "down"}>
            {price && Number.isFinite(price.bid) ? formatPrice(symbol, price.bid) : "—"}
          </span>
          <span>/</span>
          <span className={up ? "up" : "down"}>
            {price && Number.isFinite(price.ask) ? formatPrice(symbol, price.ask) : "—"}
          </span>
          <span className={up ? "up" : "down"}>
            {price && Number.isFinite(price.changePct) ? `${up ? "+" : ""}${price.changePct.toFixed(2)}%` : ""}
          </span>
        </div>
        <div className="tw-seg" role="group" aria-label={t("tw.interval")}>
          {INTERVALS.map((tf) => (
            <button key={tf} type="button" aria-pressed={timeframe === tf} onClick={() => setTimeframe(tf)}>
              {tf}
            </button>
          ))}
        </div>
        <div className="tw-search">
          <button
            type="button"
            className="tw-chip"
            aria-expanded={menu === "type"}
            aria-label={t("tw.chartType")}
            onClick={() => setMenu(menu === "type" ? null : "type")}
          >
            {t(chartType === "candle" ? "tw.candle" : chartType === "bar" ? "tw.bars" : chartType === "line" ? "tw.line" : "tw.area")}
          </button>
          {menu === "type" && (
            <div className="tw-pop">
              {(["candle", "bar", "line", "area"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-current={chartType === kind}
                  onClick={() => {
                    setChartType(kind);
                    setMenu(null);
                  }}
                >
                  {t(kind === "candle" ? "tw.candle" : kind === "bar" ? "tw.bars" : kind === "line" ? "tw.line" : "tw.area")}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="tw-search">
          <button
            type="button"
            className="tw-chip"
            aria-expanded={menu === "ind"}
            aria-label={t("tw.indicators")}
            onClick={() => setMenu(menu === "ind" ? null : "ind")}
          >
            {t("tw.indicators")}
          </button>
          {menu === "ind" && (
            <div className="tw-pop">
              {(
                [
                  ["sma", "tw.sma"],
                  ["ema", "tw.ema"],
                  ["bb", "tw.bb"],
                ] as const
              ).map(([id, key]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={indicators[id]}
                  onClick={() => setIndicators((prev) => ({ ...prev, [id]: !prev[id] }))}
                >
                  <span>{t(key)}</span>
                  <span>{indicators[id] ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="tw-iconbtn tw-only-mobile" aria-label={t("tw.draw")} onClick={() => setSheet("tools")}>
          <TrendIcon />
        </button>
        <button
          type="button"
          className="tw-chip"
          disabled={blocked}
          onClick={() => {
            setOrderSide("BUY");
            setOrderOpen(true);
          }}
        >
          {t("tw.trade")}
        </button>
      </header>

      {session === "out" && (
        <div className="tw-banner" role="status">
          <span>{t("tw.signIn")}</span>
          <Link href="/login" className="underline">
            {t("common.signIn")}
          </Link>
        </div>
      )}
      {chartError && (
        <div className="tw-banner" role="alert">
          <span>{t("tw.loadFail")}</span>
          <button type="button" className="tw-chip" onClick={() => setBoot((n) => n + 1)}>
            {t("tw.retry")}
          </button>
        </div>
      )}
      {actionError && (
        <div className="tw-banner" role="alert">
          <span>{actionError}</span>
          <button type="button" className="tw-chip" onClick={() => setActionError(null)}>
            {t("tw.close")}
          </button>
        </div>
      )}

      <div className="tw-body">
        <nav className="tw-rail" aria-label={t("tw.draw")}>
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tw-tool"
              aria-pressed={tool === item.id}
              aria-label={t(item.key)}
              title={t(item.key)}
              onClick={() => setTool(item.id)}
            >
              {item.icon}
            </button>
          ))}
        </nav>
        <div className="tw-stage">
          <TwChart
            bars={bars}
            chartType={chartType}
            indicators={indicators}
            tool={tool}
            drawings={drawings}
            onDrawings={saveDrawings}
          />
        </div>
        {desk && <aside className="tw-watch">{watch}</aside>}
        {desk && <section className="tw-book">{book}</section>}
      </div>

      <nav className="tw-tabs" aria-label={t("tw.terminal")}>
        <button type="button" aria-current={sheet == null ? "page" : undefined} onClick={() => setSheet(null)}>
          {t("term.chart")}
        </button>
        <button type="button" aria-current={sheet === "watch" ? "page" : undefined} onClick={() => setSheet("watch")}>
          {t("tw.watchlist")}
        </button>
        <button type="button" aria-current={sheet === "book" ? "page" : undefined} onClick={() => setSheet("book")}>
          {t("tw.positions")}
        </button>
        <button type="button" onClick={() => setOrderOpen(true)} disabled={blocked}>
          {t("tw.trade")}
        </button>
      </nav>

      {!desk && sheet === "watch" && (
        <Sheet title={t("tw.sheet.watch")} closeLabel={t("tw.close")} onClose={() => setSheet(null)}>
          <div className="h-[68dvh]">{watch}</div>
        </Sheet>
      )}
      {!desk && sheet === "book" && (
        <Sheet title={t("tw.sheet.book")} closeLabel={t("tw.close")} onClose={() => setSheet(null)}>
          <div className="h-[68dvh]">{book}</div>
        </Sheet>
      )}
      {!desk && sheet === "tools" && (
        <Sheet title={t("tw.sheet.tools")} closeLabel={t("tw.close")} onClose={() => setSheet(null)}>
          <div className="tw-tools">
            {TOOLS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tw-chip justify-start"
                aria-pressed={tool === item.id}
                onClick={() => {
                  setTool(item.id);
                  setSheet(null);
                }}
              >
                {item.icon}
                <span>{t(item.key)}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {orderOpen && (
        <OrderTicket
          modal
          symbol={symbol}
          symbols={symbols}
          price={price}
          initialSide={orderSide}
          onPlaced={() => void loadBook()}
          onClose={() => setOrderOpen(false)}
        />
      )}
    </div>
  );
}

function Sheet({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="tw-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="tw-sheet-back" aria-label={closeLabel} onClick={onClose} />
      <div className="tw-sheet-panel">
        <div className="tw-sheet-head">
          <span>{title}</span>
          <button type="button" className="tw-iconbtn" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div className="tw-sheet-body">{children}</div>
      </div>
    </div>
  );
}

function CursorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 3l6 16 2.2-6.2L20 11z" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 18 L20 6" />
    </svg>
  );
}
function HLineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 12h16" />
    </svg>
  );
}
function VLineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 4v16" />
    </svg>
  );
}
function RayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 17l8-8" />
      <path d="M13 9h6M19 9v6" />
    </svg>
  );
}
function RectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5" y="6" width="14" height="12" rx="1" />
    </svg>
  );
}
function EraseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 16l6-8 8 6-4 5H8z" />
    </svg>
  );
}
