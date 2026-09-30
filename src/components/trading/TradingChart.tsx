"use client";

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
    default:
      return 300;
  }
}

/** Snap unix seconds to interval open. Daily keeps Yahoo session stamps. */
function alignTime(unixSec: number, tf: string): number {
  if (tf === "1D") return unixSec;
  const step = timeframeSeconds(tf);
  return Math.floor(unixSec / step) * step;
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
  const timeframeRef = useRef(timeframe);
  const [ohlc, setOhlc] = useState<{ o: number; h: number; l: number; c: number } | null>(null);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [utcClock, setUtcClock] = useState("");
  const [feedError, setFeedError] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const [mounted, setMounted] = useState(false);

  timeframeRef.current = timeframe;

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
    let t = alignTime(nowSec, tf);
    const lastT = lastBarTimeRef.current;

    // Yahoo often stamps the last historical bar with "now" (unbucketed).
    // Never update with an older time — extend that bar instead.
    if (lastT != null && t < lastT) {
      t = lastT;
    }

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
      upColor: "#16c784",
      downColor: "#ea3943",
      borderUpColor: "#16c784",
      borderDownColor: "#ea3943",
      wickUpColor: "#16c784",
      wickDownColor: "#ea3943",
    });
    seriesRef.current = candle;

    const line = chart.addSeries(LineSeries, {
      color: "#68F848",
      lineWidth: 2,
      visible: false,
    });
    lineRef.current = line;

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
          let t = alignTime(nowSec, timeframe);
          const lastT = last.time as number;
          if (t < lastT) t = lastT;

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
            setFeedError("Grafik güncellenemedi");
          }
        }

        if (data.error) {
          setFeedError(data.stale ? `Veri gecikmeli: ${data.error}` : `Piyasa verisi: ${data.error}`);
        } else {
          setFeedError(null);
        }
      } catch {
        if (!cancelled) setFeedError("Grafik verisi alınamadı");
      }
    }

    liveBarRef.current = null;
    lastBarTimeRef.current = null;
    load(true);
    const id = setInterval(() => load(false), 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  // Real Yahoo/mid ticks from parent → update forming candle 1:1
  useEffect(() => {
    if (!price?.mid || !Number.isFinite(price.mid) || price.mid <= 0) return;
    pushRealMid(price.mid);
    setLivePulse(true);
    const t = setTimeout(() => setLivePulse(false), 350);
    return () => clearTimeout(t);
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
          className={`mt-0.5 flex items-center gap-1.5 rounded-full bg-desk-accent/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-desk-accent ring-1 ring-desk-accent/35 md:gap-1 md:px-2 md:py-0.5 md:tracking-wide ${
            livePulse ? "ring-desk-accent/70 bg-desk-accent/25" : ""
          }`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-desk-accent shadow-[0_0_6px_rgba(104,248,72,0.8)]" />
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

      <div className="absolute right-2 top-2.5 z-10 flex max-w-[62%] items-center justify-end gap-1.5 sm:right-3 sm:max-w-none md:right-3 md:top-2">
        <span className="hidden rounded-control border border-desk-border/60 bg-desk-panel/70 px-2 py-1 text-[10px] tabular-nums text-desk-muted sm:inline">
          {utcClock}
        </span>
        <div className="flex max-w-full overflow-x-auto rounded-[12px] border border-desk-border/70 bg-desk-panel/95 p-0.5 shadow-desk-panel [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:rounded-control">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframe(tf.id)}
              className={`shrink-0 rounded-[9px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors md:rounded-[8px] md:px-2 md:py-1 md:font-medium ${
                timeframe === tf.id
                  ? "bg-desk-accent text-white shadow-accent-glow-sm"
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
            Çizgi
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
