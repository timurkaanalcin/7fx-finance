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

type Props = {
  symbol: string;
  timeframe: string;
  onTimeframe: (tf: string) => void;
  price?: PriceTick;
};

export default function TradingChart({ symbol, timeframe, onTimeframe, price }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [ohlc, setOhlc] = useState<{ o: number; h: number; l: number; c: number } | null>(null);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [utcClock, setUtcClock] = useState("");
  const [feedError, setFeedError] = useState<string | null>(null);

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
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
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
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
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

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lineRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/market/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`
        );
        const data = await res.json();
        if (cancelled || !seriesRef.current) return;
        const bars: CandlestickData<Time>[] = (data.candles || []).map(
          (c: { time: number; open: number; high: number; low: number; close: number }) => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })
        );
        if (bars.length) {
          seriesRef.current.setData(bars);
          if (lineRef.current) {
            lineRef.current.setData(bars.map((b) => ({ time: b.time, value: b.close })));
          }
          const last = bars[bars.length - 1];
          setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close });
          chartRef.current?.timeScale().fitContent();
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
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, timeframe]);

  useEffect(() => {
    void price;
  }, [price]);

  useEffect(() => {
    if (seriesRef.current) seriesRef.current.applyOptions({ visible: chartType === "candle" });
    if (lineRef.current) lineRef.current.applyOptions({ visible: chartType === "line" });
  }, [chartType]);

  const digits = price?.mid != null && price.mid > 100 ? 2 : price?.mid != null && price.mid < 10 ? 5 : 2;
  const fmt = (n: number) => n.toFixed(digits);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-desk-bg">
      {/* Symbol + LIVE — more breathing room on mobile */}
      <div className="absolute left-3 top-3 z-10 flex items-start gap-2 md:left-3 md:top-2.5 md:gap-2.5">
        <span className="mt-0.5 flex items-center gap-1.5 rounded-full bg-desk-accent/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-desk-accent ring-1 ring-desk-accent/35 md:gap-1 md:px-2 md:py-0.5 md:tracking-wide">
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

      {/* TF pills — scroll cleanly on mobile, hide clutter */}
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
              chartType === "candle"
                ? "bg-desk-elev text-desk-text"
                : "text-desk-muted hover:text-desk-text"
            }`}
          >
            Mum
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`rounded-[8px] px-2 py-1 text-[11px] font-medium ${
              chartType === "line"
                ? "bg-desk-elev text-desk-text"
                : "text-desk-muted hover:text-desk-text"
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
