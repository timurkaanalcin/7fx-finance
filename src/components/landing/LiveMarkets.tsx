"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import SymbolIcon from "@/components/ui/SymbolIcon";
import { FeedDot, type FeedState } from "@/components/trading/FeedStatus";

const QUOTE_SYMS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AAPL",
  "NVDA",
  "XOM",
  "CVX",
  "BTCUSD",
  "ETHUSD",
  "XAUUSD",
  "UKOIL",
] as const;

const CHART_SYMS = ["EURUSD", "AAPL", "XOM", "BTCUSD", "XAUUSD"] as const;

export const MARKET_GROUPS: { id: string; labelKey: string; symbols: string[]; chart: string }[] = [
  { id: "forex", labelKey: "landing.markets.forex", symbols: ["EURUSD", "GBPUSD", "USDJPY"], chart: "EURUSD" },
  { id: "stocks", labelKey: "landing.markets.stocks", symbols: ["AAPL", "NVDA"], chart: "AAPL" },
  { id: "energy", labelKey: "landing.markets.energy", symbols: ["XOM", "CVX"], chart: "XOM" },
  { id: "crypto", labelKey: "landing.markets.crypto", symbols: ["BTCUSD", "ETHUSD"], chart: "BTCUSD" },
  { id: "commodities", labelKey: "landing.markets.commodities", symbols: ["XAUUSD", "UKOIL"], chart: "XAUUSD" },
];

const DIGITS: Record<string, number> = {
  EURUSD: 5,
  GBPUSD: 5,
  USDJPY: 3,
  AAPL: 2,
  NVDA: 2,
  XOM: 2,
  CVX: 2,
  BTCUSD: 2,
  ETHUSD: 2,
  XAUUSD: 2,
  UKOIL: 2,
};

type Tick = { symbol: string; bid: number; ask: number; mid: number; changePct: number };

type Feed = {
  status: "loading" | "live" | "delayed" | "unavailable";
  ticks: Record<string, Tick>;
  series: Record<string, number[]>;
  chartStale: boolean;
};

const EMPTY: Feed = { status: "loading", ticks: {}, series: {}, chartStale: false };

let feed: Feed = EMPTY;
let timer: ReturnType<typeof setInterval> | null = null;
let inflight = false;
const listeners = new Set<(f: Feed) => void>();
const extraCharts = new Set<string>();

function emit(next: Feed) {
  feed = next;
  listeners.forEach((fn) => fn(feed));
}

function localeTag(locale: string) {
  if (locale === "ar") return "ar";
  if (locale === "tr" || locale === "de" || locale === "ru") return locale;
  return "en";
}

function formatPx(n: number, symbol: string, locale: string) {
  const digits = DIGITS[symbol] ?? 2;
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function formatPct(n: number, locale: string) {
  if (!Number.isFinite(n)) return "";
  const body = new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(n);
  return `${body}%`;
}

async function fetchCloses(symbol: string): Promise<{ closes: number[]; stale: boolean } | null> {
  const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&timeframe=5m`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const rows = Array.isArray(data.candles) ? data.candles : [];
  const closes = rows
    .map((c: { close?: number }) => c?.close)
    .filter((n: unknown): n is number => typeof n === "number" && Number.isFinite(n));
  if (closes.length < 2) return null;
  return { closes: closes.slice(-90), stale: Boolean(data.stale || data.error) };
}

async function refresh() {
  if (inflight || typeof window === "undefined") return;
  inflight = true;
  try {
    const wanted: string[] = [];
    const seen = new Set<string>();
    const take = (sym: string) => {
      if (seen.has(sym)) return;
      seen.add(sym);
      wanted.push(sym);
    };
    for (let i = 0; i < CHART_SYMS.length; i += 1) take(CHART_SYMS[i]);
    for (const sym of Array.from(extraCharts)) take(sym);
    const candleTask = Promise.all(wanted.map(async (symbol) => ({ symbol, row: await fetchCloses(symbol) })));
    const [symRes, quoteRes] = await Promise.all([
      fetch("/api/symbols", { cache: "no-store" }),
      fetch(`/api/market/quote?live=1&symbols=${QUOTE_SYMS.join(",")}`, { cache: "no-store" }),
    ]);
    if (!symRes.ok || !quoteRes.ok) throw new Error("feed");
    const catalog = await symRes.json();
    if (!Array.isArray(catalog) || catalog.length === 0) throw new Error("catalog");
    const body = await quoteRes.json();
    const prices = Array.isArray(body.prices) ? body.prices : [];
    const ticks: Record<string, Tick> = {};
    for (const p of prices) {
      if (!p || typeof p.symbol !== "string" || typeof p.mid !== "number" || !Number.isFinite(p.mid)) continue;
      if (!(QUOTE_SYMS as readonly string[]).includes(p.symbol)) continue;
      ticks[p.symbol] = {
        symbol: p.symbol,
        bid: Number(p.bid),
        ask: Number(p.ask),
        mid: p.mid,
        changePct: Number(p.changePct),
      };
    }
    // Paint quotes before the candle history finishes. The chart fills in on the second emit.
    if (Object.keys(ticks).length > 0) {
      emit({ status: "live", ticks, series: feed.series, chartStale: Object.keys(feed.series).length === 0 });
    }
    const candleRows = await candleTask;
    const series: Record<string, number[]> = {};
    let chartStale = false;
    for (const item of candleRows) {
      if (!item.row) continue;
      const closes = item.row.closes.slice();
      const live = ticks[item.symbol];
      if (live) closes[closes.length - 1] = live.mid;
      series[item.symbol] = closes;
      if (item.row.stale) chartStale = true;
    }
    const anyTick = Object.keys(ticks).length > 0;
    const anySeries = Object.values(series).some((s) => s.length > 1);
    if (!anyTick && !anySeries) {
      emit({ status: "unavailable", ticks: {}, series: {}, chartStale: false });
      return;
    }
    emit({
      status: anyTick ? "live" : "delayed",
      ticks,
      series,
      chartStale: chartStale || !anyTick,
    });
  } catch {
    if (feed.status === "live" || feed.status === "delayed") {
      emit({ ...feed, status: "delayed", chartStale: true });
    } else {
      emit({ status: "unavailable", ticks: {}, series: {}, chartStale: false });
    }
  } finally {
    inflight = false;
  }
}

function useLiveFeed() {
  const [snap, setSnap] = useState<Feed>(feed);
  useEffect(() => {
    listeners.add(setSnap);
    if (!timer) {
      void refresh();
      timer = setInterval(() => void refresh(), 15000);
    }
    return () => {
      listeners.delete(setSnap);
    };
  }, []);
  return snap;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

function drawSeries(canvas: HTMLCanvasElement, values: number[], pulse: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 160;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx || values.length < 2) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) * 0.002 || 1;
  const padX = 8;
  const padY = 16;
  const pts = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (v - min) / span) * (h - padY * 2);
    return [x, y] as const;
  });
  const up = values[values.length - 1] >= values[0];
  const color = up ? "#3ddc97" : "#ff5d73";
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = padY + ((h - padY * 2) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
  }
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.lineTo(pts[pts.length - 1][0], h - 4);
  ctx.lineTo(pts[0][0], h - 4);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, up ? "rgba(61,220,151,0.28)" : "rgba(255,93,115,0.24)");
  g.addColorStop(1, "rgba(61,220,151,0)");
  ctx.fillStyle = g;
  ctx.fill();
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last[0], last[1], 3 + pulse * 3.2, 0, Math.PI * 2);
  ctx.fillStyle = up ? "rgba(61,220,151,0.25)" : "rgba(255,93,115,0.25)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last[0], last[1], 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function HeroCanvas({ values, label }: { values: number[]; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let frame = 0;
    const paint = () => {
      const pulse = reduce ? 0 : (Math.sin(frame / 16) + 1) / 2;
      drawSeries(canvas, values, pulse);
      if (!reduce) {
        frame += 1;
        raf = requestAnimationFrame(paint);
      }
    };
    paint();
    const onResize = () => paint();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [values, reduce]);
  return <canvas ref={ref} className="fx-hero-canvas" role="img" aria-label={label} />;
}

function MiniCanvas({ values }: { values: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    drawSeries(canvas, values, 0);
  }, [values]);
  return <canvas ref={ref} className="fx-mini-canvas" aria-hidden />;
}

const SPARK_SYMS = ["EURUSD", "AAPL", "BTCUSD", "XAUUSD"] as const;

function Spark({ values }: { values: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    drawSeries(canvas, values, 0);
  }, [values]);
  return <canvas ref={ref} className="fx-spark" aria-hidden />;
}

function feedState(status: Feed["status"]): FeedState {
  if (status === "live") return "live";
  if (status === "delayed") return "stale";
  return "offline";
}

function Note({ status, stale, t }: { status: Feed["status"]; stale: boolean; t: (k: string) => string }) {
  if (status === "loading") return <p className="fx-live-note">{t("landing.live.loading")}</p>;
  if (status === "unavailable") return <p className="fx-live-note">{t("landing.live.unavailable")}</p>;
  if (status === "delayed" || stale) return <p className="fx-live-note">{t("landing.live.delayed")}</p>;
  return null;
}

export function LiveHeroChart() {
  const { t, locale } = useI18n();
  const snap = useLiveFeed();
  const [symbol, setSymbol] = useState("EURUSD");
  const series = snap.series[symbol];
  const tick = snap.ticks[symbol];
  const up = tick ? tick.changePct >= 0 : series ? series[series.length - 1] >= series[0] : true;

  useEffect(() => {
    if (snap.series[symbol] || snap.status === "loading") return;
    if (!extraCharts.has(symbol)) {
      extraCharts.add(symbol);
      void refresh();
    }
  }, [symbol, snap.series, snap.status]);

  const badge = snap.status === "live" ? t("landing.live.badge") : "—";

  return (
    <div className="fx-chart-card fx-terminal">
      <div className="fx-terminal-bar">
        <span className="fx-terminal-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="fx-terminal-name">{t("landing.live.terminal")}</span>
        <FeedDot state={feedState(snap.status)} />
        <span className="fx-terminal-badge">{badge}</span>
      </div>
      <div className="fx-chart-card-head">
        <div>
          <p className="fx-kicker">{t("landing.live.chartAria")}</p>
          <p className="fx-chart-symbol">{symbol}</p>
        </div>
        {tick ? (
          <div className="text-right">
            <p className={`fx-chart-px ${up ? "is-up" : "is-down"}`}>{formatPx(tick.mid, symbol, locale)}</p>
            <p className={`fx-chart-chg ${up ? "is-up" : "is-down"}`}>{formatPct(tick.changePct, locale)}</p>
          </div>
        ) : null}
      </div>
      <div className="fx-chart-stage">
        {series && series.length > 1 ? (
          <HeroCanvas values={series} label={`${t("landing.live.chartAria")} ${symbol}`} />
        ) : (
          <Note status={snap.status === "loading" ? "loading" : "unavailable"} stale={false} t={t} />
        )}
      </div>
      {tick ? (
        <div className="fx-quote-strip">
          <p>
            <span>{t("landing.desk.bid")}</span>
            <strong className="is-down">{formatPx(tick.bid, symbol, locale)}</strong>
          </p>
          <p>
            <span>{t("landing.desk.ask")}</span>
            <strong className="is-up">{formatPx(tick.ask, symbol, locale)}</strong>
          </p>
          <p>
            <span>{t("landing.desk.spread")}</span>
            <strong>{formatPx(Math.abs(tick.ask - tick.bid), symbol, locale)}</strong>
          </p>
        </div>
      ) : null}
      <div className="fx-spark-row">
        {SPARK_SYMS.map((sym) => {
          const row = snap.ticks[sym];
          const spark = snap.series[sym];
          const sparkUp = row ? row.changePct >= 0 : true;
          return (
            <button
              key={sym}
              type="button"
              className={`fx-spark-card ${sym === symbol ? "is-on" : ""}`}
              onClick={() => setSymbol(sym)}
            >
              <span className="fx-spark-sym">{sym}</span>
              <span className={`fx-spark-px ${sparkUp ? "is-up" : "is-down"}`}>
                {row ? formatPx(row.mid, sym, locale) : "—"}
              </span>
              {spark && spark.length > 1 ? <Spark values={spark} /> : <span className="fx-spark fx-spark--empty" />}
            </button>
          );
        })}
      </div>
      <div className="fx-chip-row" role="tablist" aria-label={t("landing.live.chartAria")}>
        {QUOTE_SYMS.map((sym) => (
          <button
            key={sym}
            type="button"
            role="tab"
            aria-selected={sym === symbol}
            className={`fx-chip ${sym === symbol ? "is-on" : ""}`}
            onClick={() => setSymbol(sym)}
          >
            {sym}
          </button>
        ))}
      </div>
      <Note status={snap.status} stale={snap.chartStale && snap.status === "live"} t={t} />
    </div>
  );
}

export function LiveTape() {
  const { t, locale } = useI18n();
  const snap = useLiveFeed();
  const rows = QUOTE_SYMS.map((sym) => snap.ticks[sym]).filter((row): row is Tick => Boolean(row));
  if (snap.status === "loading") {
    return (
      <div className="fx-ticker" aria-busy="true">
        <p className="fx-live-note fx-live-note--tape">{t("landing.live.loading")}</p>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="fx-ticker">
        <p className="fx-live-note fx-live-note--tape">{t("landing.live.unavailable")}</p>
      </div>
    );
  }
  const loop = [...rows, ...rows];
  return (
    <div className="fx-ticker" aria-label={t("landing.live.tapeAria")}>
      <div className="fx-ticker-fade fx-ticker-fade--l" aria-hidden />
      <div className="fx-ticker-fade fx-ticker-fade--r" aria-hidden />
      <div className="fx-ticker-track">
        {loop.map((row, i) => {
          const up = row.changePct >= 0;
          return (
            <span className="fx-ticker-item" key={`${row.symbol}-${i}`} aria-hidden={i >= rows.length ? true : undefined}>
              <SymbolIcon symbol={row.symbol} size={16} />
              <span className="fx-ticker-sym">{row.symbol}</span>
              <span className="fx-ticker-px">{formatPx(row.mid, row.symbol, locale)}</span>
              <span className={up ? "is-up" : "is-down"}>{formatPct(row.changePct, locale)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const FEATURE_CHARTS = [
  { title: "landing.card.markets.title", body: "landing.card.markets.body", symbol: "EURUSD" },
  { title: "landing.card.orders.title", body: "landing.card.orders.body", symbol: "AAPL" },
  { title: "landing.card.security.title", body: "landing.card.security.body", symbol: "XAUUSD" },
] as const;

const DESK_WATCH = ["EURUSD", "GBPUSD", "XAUUSD", "AAPL", "BTCUSD"] as const;

export function FeatureDeck() {
  const { t } = useI18n();
  const snap = useLiveFeed();
  return (
    <>
      {FEATURE_CHARTS.map((card) => {
        const series = snap.series[card.symbol];
        return (
          <article key={card.symbol} className="fx-feature-card">
            {series && series.length > 1 ? <MiniCanvas values={series} /> : <div className="fx-mini-canvas" aria-hidden />}
            <p className="fx-feature-sym">{card.symbol}</p>
            <h3 className="font-medium">{t(card.title)}</h3>
            <p>{t(card.body)}</p>
          </article>
        );
      })}
    </>
  );
}

export function TerminalDesk() {
  const { t, locale } = useI18n();
  const snap = useLiveFeed();
  const symbol = "EURUSD";
  const series = snap.series[symbol];
  const tick = snap.ticks[symbol];
  return (
    <div className="fx-desk-mock">
      <section className="fx-desk-col" aria-label={t("landing.desk.watch")}>
        <p className="fx-desk-label">{t("landing.desk.watch")}</p>
        <ul className="fx-desk-watch">
          {DESK_WATCH.map((sym) => {
            const row = snap.ticks[sym];
            const up = row ? row.changePct >= 0 : true;
            return (
              <li key={sym}>
                <SymbolIcon symbol={sym} size={16} />
                <span className="fx-desk-sym">{sym}</span>
                <span className={up ? "is-up" : "is-down"}>{row ? formatPx(row.mid, sym, locale) : "—"}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="fx-desk-chart">
        <div className="fx-desk-chart-head">
          <span>{symbol}</span>
          <FeedDot state={feedState(snap.status)} />
        </div>
        {series && series.length > 1 ? (
          <HeroCanvas values={series} label={`${t("landing.live.chartAria")} ${symbol}`} />
        ) : (
          <Note status={snap.status === "loading" ? "loading" : "unavailable"} stale={false} t={t} />
        )}
      </div>
      <section className="fx-desk-col" aria-label={t("landing.desk.ticket")}>
        <p className="fx-desk-label">{t("landing.desk.ticket")}</p>
        {tick ? (
          <div className="fx-quote-strip fx-quote-strip--stack">
            <p>
              <span>{t("landing.desk.bid")}</span>
              <strong className="is-down">{formatPx(tick.bid, symbol, locale)}</strong>
            </p>
            <p>
              <span>{t("landing.desk.ask")}</span>
              <strong className="is-up">{formatPx(tick.ask, symbol, locale)}</strong>
            </p>
          </div>
        ) : (
          <Note status={snap.status === "loading" ? "loading" : "unavailable"} stale={false} t={t} />
        )}
        <Link href="/register" className="fx-desk-side fx-desk-side--buy">
          {t("landing.desk.buy")}
        </Link>
        <Link href="/register" className="fx-desk-side fx-desk-side--sell">
          {t("landing.desk.sell")}
        </Link>
        <p className="fx-desk-note">{t("landing.desk.note")}</p>
      </section>
    </div>
  );
}

export function MarketBoard() {
  const { t, locale } = useI18n();
  const snap = useLiveFeed();
  return (
    <div className="fx-market-grid">
      {MARKET_GROUPS.map((group) => {
        const series = snap.series[group.chart];
        return (
          <article key={group.id} className="fx-market-card">
            <header className="fx-market-card-head">
              <h3>{t(group.labelKey)}</h3>
            </header>
            {series && series.length > 1 ? (
              <MiniCanvas values={series} />
            ) : (
              <div className="fx-mini-empty">
                <Note status={snap.status === "loading" ? "loading" : "unavailable"} stale={false} t={t} />
              </div>
            )}
            <ul className="fx-market-list">
              {group.symbols.map((sym) => {
                const tick = snap.ticks[sym];
                const up = tick ? tick.changePct >= 0 : true;
                return (
                  <li key={sym}>
                    <span className="fx-market-sym">
                      <SymbolIcon symbol={sym} size={18} />
                      {sym}
                    </span>
                    {tick ? (
                      <>
                        <span className="fx-market-px">{formatPx(tick.mid, sym, locale)}</span>
                        <span className={up ? "is-up" : "is-down"}>{formatPct(tick.changePct, locale)}</span>
                      </>
                    ) : (
                      <span className="fx-market-miss">{snap.status === "loading" ? "…" : "—"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
