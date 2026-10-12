"use client";

import { useFxTheme } from "@/components/theme/ThemeToggle";
import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import type { PriceTick } from "./types";

const TIMEFRAMES = [
  { id: "1m", label: "1′" },
  { id: "5m", label: "5′" },
  { id: "15m", label: "15′" },
  { id: "1h", label: "1s" },
  { id: "4h", label: "4s" },
  { id: "1D", label: "1G" },
  { id: "1W", label: "W" },
];

function timeframeSeconds(tf: string): number {
  switch (tf) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "1h":
      return 3600;
    case "4h":
      return 14400;
    case "1D":
      return 86400;
    case "1W":
      return 604800;
    default:
      return 300;
  }
}

/** Snap unix seconds to interval open.
 * Daily/weekly: bucket to period start so live mid does not invent a "now" stamp
 * ahead of Yahoo's weekly/daily bar (which caused forming-bar distortion).
 */
function alignTime(unixSec: number, tf: string): number {
  if (tf === "1D") {
    return Math.floor(unixSec / 86400) * 86400;
  }
  if (tf === "1W") {
    // Align to Monday 00:00 UTC (Yahoo weekly bars typically start Monday)
    const day = Math.floor(unixSec / 86400);
    const thursdayOffset = 4; // 1970-01-01 was Thursday
    const daysSinceMonday = (day + thursdayOffset) % 7;
    return (day - daysSinceMonday) * 86400;
  }
  const step = timeframeSeconds(tf);
  return Math.floor(unixSec / step) * step;
}

/** Prefer extending last Yahoo bar when still inside the same D/W period. */
function formingBarTime(nowSec: number, tf: string, lastBarTime: number | null): number {
  const aligned = alignTime(nowSec, tf);
  if (lastBarTime == null) return aligned;
  if (tf === "1D" || tf === "1W") {
    // Stay on Yahoo's last stamp until a new period bucket starts
    if (aligned <= lastBarTime) return lastBarTime;
    const period = tf === "1W" ? 604800 : 86400;
    if (nowSec - lastBarTime < period) return lastBarTime;
  }
  if (aligned < lastBarTime) return lastBarTime;
  return aligned;
}

function dedupeBars(bars: CandlestickData<Time>[]): CandlestickData<Time>[] {
  const map = new Map<number, CandlestickData<Time>>();
  for (const b of bars) {
    const t = b.time as number;
    const prev = map.get(t);
    if (!prev) {
      map.set(t, b);
    } else {
      map.set(t, {
        time: b.time,
        open: prev.open,
        high: Math.max(prev.high, b.high),
        low: Math.min(prev.low, b.low),
        close: b.close,
      });
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

type Props = {
  symbol: string;
  timeframe: string;
  onTimeframe: (tf: string) => void;
  price?: PriceTick;
};

type LiveBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function TradingChart({ symbol, timeframe, onTimeframe, price }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const liveBarRef = useRef<LiveBar | null>(null);
  const lastBarTimeRef = useRef<number | null>(null);
  const lastMidRef = useRef<number | null>(null);
  const priceRef = useRef<PriceTick | undefined>(price);
  const lastTickAtRef = useRef<number>(0);
  const timeframeRef = useRef(timeframe);
  const [ohlc, setOhlc] = useState<{ o: number; h: number; l: number; c: number } | null>(null);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [utcClock, setUtcClock] = useState("");
  const [feedError, setFeedError] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const [liveFresh, setLiveFresh] = useState(false);
  const [mounted, setMounted] = useState(false);

  timeframeRef.current = timeframe;
  priceRef.current = price;

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeUpdate = (bar: LiveBar) => {
    const candle: CandlestickData<Time> = {
      time: bar.time as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    };
    const lastT = lastBarTimeRef.current;
    // lightweight-charts throws if update time < last series time
    if (lastT != null && bar.time < lastT) {
      return false;
    }
    try {
      seriesRef.current?.update(candle);
      lineRef.current?.update({ time: bar.time as Time, value: bar.close });
      lastBarTimeRef.current = bar.time;
      liveBarRef.current = bar;
      setOhlc({ o: bar.open, h: bar.high, l: bar.low, c: bar.close });
      return true;
    } catch {
      return false;
    }
  };

  /** Drive forming candle from real mid only (no synthetic drift). */
  const pushRealMid = (mid: number) => {
    if (!Number.isFinite(mid) || mid <= 0 || !seriesRef.current) return;
    lastMidRef.current = mid;

    const tf = timeframeRef.current;
    const nowSec = Math.floor(Date.now() / 1000);
    const lastT = lastBarTimeRef.current;
    const t = formingBarTime(nowSec, tf, lastT);

    const prev = liveBarRef.current;
    if (!prev || prev.time !== t) {
      const open = prev && prev.time < t ? prev.close : mid;
      safeUpdate({
        time: t,
        open,
        high: Math.max(open, mid),
        low: Math.min(open, mid),
        close: mid,
      });
      return;
    }

    safeUpdate({
      time: t,
      open: prev.open,
      high: Math.max(prev.high, mid),
      low: Math.min(prev.low, mid),
      close: mid,
    });
  };

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcClock(`${h}:${m}:${s} UTC`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fxTheme = useFxTheme();
  const [chartGen, setChartGen] = useState(0);
  useEffect(() => {
    const c = chartRef.current;
    if (!c) return;
    const L = fxTheme === "light";
    c.applyOptions({
      layout: { background: { type: ColorType.Solid, color: L ? "#ffffff" : "#000000" }, textColor: L ? "#5b5e66" : "#8b97b0" },
      grid: { vertLines: { color: L ? "#f1efe9" : "#141414" }, horzLines: { color: L ? "#f1efe9" : "#141414" } },
      rightPriceScale: { borderColor: L ? "#e6e2d8" : "#2a2a2a" },
      timeScale: { borderColor: L ? "#e6e2d8" : "#2a2a2a" },
    });
    seriesRef.current?.applyOptions({
      upColor: L ? "#0f9d76" : "#26a69a", downColor: L ? "#d63c34" : "#ef5350",
      borderUpColor: L ? "#0f9d76" : "#26a69a", borderDownColor: L ? "#d63c34" : "#ef5350",
      wickUpColor: L ? "#0f9d76" : "#26a69a", wickDownColor: L ? "#d63c34" : "#ef5350",
    });
    lineRef.current?.applyOptions({ color: L ? "#111111" : "#ffffff" });
  }, [fxTheme, mounted, chartGen]);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (typeof window === "undefined") return;

    const el = containerRef.current;
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#8b97b0",
      },
      grid: {
        vertLines: { color: "#141414" },
        horzLines: { color: "#141414" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2a2a2a" },
      timeScale: { borderColor: "#2a2a2a", timeVisible: true, secondsVisible: false },
      width: el.clientWidth || 300,
      height: el.clientHeight || 240,
    });
    chartRef.current = chart;

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    seriesRef.current = candle;

    const line = chart.addSeries(LineSeries, {
      color: "#ffffff",
      lineWidth: 2,
      visible: false,
    });
    lineRef.current = line;
    setChartGen((g) => g + 1);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (containerRef.current && chartRef.current) {
              chartRef.current.applyOptions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
              });
            }
          })
        : null;
    ro?.observe(el);

    return () => {
      ro?.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lineRef.current = null;
      liveBarRef.current = null;
      lastBarTimeRef.current = null;
    };
  }, [mounted]);

  // Historical backbone; re-sync periodically. Live mid overlays forming candle.
  useEffect(() => {
    let cancelled = false;

    async function load(fit = false) {
      try {
        const res = await fetch(
          `/api/market/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`
        );
        const data = await res.json();
        if (cancelled || !seriesRef.current) return;

        const raw: CandlestickData<Time>[] = (data.candles || []).map(
          (c: { time: number; open: number; high: number; low: number; close: number }) => ({
            time: alignTime(c.time, timeframe) as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })
        );
        let bars = dedupeBars(raw);

        const mid = lastMidRef.current ?? (price?.mid != null && Number.isFinite(price.mid) ? price.mid : null);
        if (bars.length && mid != null && mid > 0) {
          const last = bars[bars.length - 1];
          const nowSec = Math.floor(Date.now() / 1000);
          const lastT = last.time as number;
          const t = formingBarTime(nowSec, timeframe, lastT);

          if (t === lastT) {
            bars = [
              ...bars.slice(0, -1),
              {
                time: last.time,
                open: last.open,
                high: Math.max(last.high, mid),
                low: Math.min(last.low, mid),
                close: mid,
              },
            ];
          } else {
            bars = [
              ...bars,
              {
                time: t as Time,
                open: last.close,
                high: Math.max(last.close, mid),
                low: Math.min(last.close, mid),
                close: mid,
              },
            ];
          }
        }

        if (bars.length) {
          try {
            seriesRef.current.setData(bars);
            if (lineRef.current) {
              lineRef.current.setData(bars.map((b) => ({ time: b.time, value: b.close })));
            }
            const last = bars[bars.length - 1];
            lastBarTimeRef.current = last.time as number;
            liveBarRef.current = {
              time: last.time as number,
              open: last.open,
              high: last.high,
              low: last.low,
              close: last.close,
            };
            if (lastMidRef.current == null && mid != null) lastMidRef.current = mid;
            setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close });
            if (fit) chartRef.current?.timeScale().fitContent();
          } catch {
            setFeedError("Could not update chart");
          }
        }

        if (data.error) {
          setFeedError(data.stale ? `Veri gecikmeli: ${data.error}` : `Market verisi: ${data.error}`);
        } else {
          setFeedError(null);
        }
      } catch {
        if (!cancelled) setFeedError("Could not load chart data");
      }
    }

    liveBarRef.current = null;
    lastBarTimeRef.current = null;
    load(true);
    const id = setInterval(() => load(false), 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  // Stream forming candle from live mid ≤1s (real Yahoo mid only — no synthetic drift).
  useEffect(() => {
    let lastApplied: number | null = null;
    const tick = () => {
      const mid = priceRef.current?.mid;
      if (mid == null || !Number.isFinite(mid) || mid <= 0) {
        setLiveFresh(Date.now() - lastTickAtRef.current < 2500);
        return;
      }
      const changed = lastApplied == null || Math.abs(mid - lastApplied) > 0;
      pushRealMid(mid);
      if (changed) {
        lastApplied = mid;
        lastTickAtRef.current = Date.now();
        setLivePulse(true);
        window.setTimeout(() => setLivePulse(false), 280);
      } else if (liveBarRef.current && liveBarRef.current.close !== mid) {
        // mid equal numerically but bar close stale after history reload
        pushRealMid(mid);
        lastTickAtRef.current = Date.now();
      }
      setLiveFresh(Date.now() - lastTickAtRef.current < 2500);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  // Immediate apply when parent mid/ts updates (active-symbol 800ms poll).
  useEffect(() => {
    if (!price?.mid || !Number.isFinite(price.mid) || price.mid <= 0) return;
    pushRealMid(price.mid);
    lastTickAtRef.current = Date.now();
    setLiveFresh(true);
    setLivePulse(true);
    const t = window.setTimeout(() => setLivePulse(false), 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price?.mid, price?.ts, symbol]);

  useEffect(() => {
    if (seriesRef.current) seriesRef.current.applyOptions({ visible: chartType === "candle" });
    if (lineRef.current) lineRef.current.applyOptions({ visible: chartType === "line" });
  }, [chartType]);

  const digits =
    price?.mid != null && price.mid >= 100
      ? 2
      : price?.mid != null && price.mid < 1
        ? 6
        : price?.mid != null && price.mid < 10
          ? 5
          : 2;
  const fmt = (n: number) => n.toFixed(digits);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-desk-bg">
      <div className="absolute left-3 top-3 z-10 flex items-start gap-2 md:left-3 md:top-2.5 md:gap-2.5">
        <span
          className={`mt-0.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] ring-1 md:gap-1 md:px-2 md:py-0.5 md:tracking-wide ${
            liveFresh
              ? `bg-desk-accent/15 text-desk-accent ring-desk-accent/35 ${livePulse ? "ring-desk-accent/70 bg-desk-accent/25" : ""}`
              : "bg-desk-elev/80 text-desk-muted ring-desk-border/60"
          }`}
          title={liveFresh ? "Live Yahoo mid" : "Waiting…"}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              liveFresh
                ? "animate-pulse bg-desk-accent shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                : "bg-desk-muted"
            }`}
          />
          LIVE
        </span>
        <div>
          <div className="text-[15px] font-semibold tracking-tight text-desk-text md:text-sm">
            {symbol}
          </div>
          {ohlc && (
            <div className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] tabular-nums text-desk-muted">
              <span>
                O <span className="text-desk-text/80">{fmt(ohlc.o)}</span>
              </span>
              <span>
                H <span className="text-desk-buy">{fmt(ohlc.h)}</span>
              </span>
              <span>
                L <span className="text-desk-sell">{fmt(ohlc.l)}</span>
              </span>
              <span>
                C <span className="text-desk-text/80">{fmt(ohlc.c)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute left-2 right-[calc(0.5rem+1.5cm)] top-[3.6rem] z-10 flex items-center justify-start gap-1.5 sm:left-auto sm:top-2.5 sm:justify-end sm:right-[calc(0.75rem+1.5cm)] sm:max-w-none md:right-[calc(0.75rem+1.5cm)] md:top-2">
        <span className="hidden rounded-control border border-desk-border/60 bg-desk-panel/70 px-2 py-1 text-[10px] tabular-nums text-desk-muted sm:inline">
          {utcClock}
        </span>
        <div className="flex max-w-full overflow-x-auto rounded-[12px] border border-desk-border/70 bg-desk-panel/95 p-0.5 shadow-desk-panel [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:rounded-control">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframe(tf.id)}
              className={`fx-tap-compact shrink-0 rounded-[9px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors md:rounded-[8px] md:px-2 md:py-1 md:font-medium ${
                timeframe === tf.id
                  ? "bg-desk-accent text-desk-accent-ink shadow-accent-glow-sm"
                  : "text-desk-muted hover:bg-desk-hover hover:text-desk-text"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-control border border-desk-border bg-desk-panel/90 p-0.5 sm:flex">
          <button
            onClick={() => setChartType("candle")}
            className={`rounded-[8px] px-2 py-1 text-[11px] font-medium ${
              chartType === "candle" ? "bg-desk-elev text-desk-text" : "text-desk-muted hover:text-desk-text"
            }`}
          >
            Mum
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`rounded-[8px] px-2 py-1 text-[11px] font-medium ${
              chartType === "line" ? "bg-desk-elev text-desk-text" : "text-desk-muted hover:text-desk-text"
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {feedError && (
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-control bg-desk-warn/95 px-3 py-1.5 text-[11px] font-medium text-black shadow-lg">
          {feedError}
        </div>
      )}

      <div ref={containerRef} className="min-h-0 flex-1" />
    </div>
  );
}
