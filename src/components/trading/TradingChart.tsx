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
      setUtcClock(`${h}:${m}:${s} (UTC)`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1a2332" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#243044" },
        horzLines: { color: "#243044" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#3a4658" },
      timeScale: { borderColor: "#3a4658", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    seriesRef.current = candle;

    const line = chart.addSeries(LineSeries, {
      color: "#3b82f6",
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
        const res = await fetch(`/api/market/ohlc?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
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
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#1a2332]">
      <div className="absolute left-3 top-2 z-10 flex items-start gap-3">
        <span className="rounded bg-blue-600 px-2 py-0.5 text-[11px] font-bold tracking-wide">LIVE</span>
        <div>
          <div className="text-sm font-semibold">{symbol}</div>
          {ohlc && (
            <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-slate-400 tabular-nums">
              <span>Aç {fmt(ohlc.o)}</span>
              <span>Y {fmt(ohlc.h)}</span>
              <span>D {fmt(ohlc.l)}</span>
              <span>K {fmt(ohlc.c)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-10 top-2 z-10 flex items-center gap-2">
        <span className="text-xs tabular-nums text-slate-300">{utcClock}</span>
        <div className="flex overflow-hidden rounded-md border border-[#3a4658] bg-[#0f172a]/60">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframe(tf.id)}
              className={`px-2 py-1 text-[11px] ${
                timeframe === tf.id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-[#334155]"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-md border border-[#3a4658]">
          <button
            onClick={() => setChartType("candle")}
            className={`px-2 py-1 text-[11px] ${chartType === "candle" ? "bg-blue-600" : "hover:bg-[#334155]"}`}
          >
            Mum
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`px-2 py-1 text-[11px] ${chartType === "line" ? "bg-blue-600" : "hover:bg-[#334155]"}`}
          >
            Çizgi
          </button>
        </div>
      </div>

      {feedError && (
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md bg-amber-500/90 px-3 py-1.5 text-[11px] font-medium text-black shadow">
          {feedError}
        </div>
      )}

      <div ref={containerRef} className="min-h-0 flex-1" />
    </div>
  );
}
