"use client";

import { useFxTheme } from "@/components/theme/ThemeToggle";
import { useEffect, useRef, useState } from "react";
import type {
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CandlestickData,
  Time,
} from "lightweight-charts";
import { quotesSeenAt } from "./quote-clock";
import type { PriceTick } from "./types";
import { chartReconcilePlan, type OhlcBar } from "@/lib/chart-reconcile";
import { formatPrice, getSymbol } from "@/lib/symbols";
import SymbolIcon from "@/components/ui/SymbolIcon";
import { useI18n } from "@/lib/i18n/context";
import { HIDDEN_CANDLE, HIDDEN_LINE, paintChartOverlay } from "./chart-paint";

const TIMEFRAMES = [
  { id: "1m", label: "1′" },
  { id: "5m", label: "5′" },
  { id: "15m", label: "15′" },
  { id: "1h", label: "term.tf.1h" },
  { id: "4h", label: "term.tf.4h" },
  { id: "1D", label: "term.tf.1D" },
  { id: "1W", label: "term.tf.1W" },
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

export type ChartLevel = {
  id: string;
  side: "BUY" | "SELL";
  openPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
};

type Props = {
  symbol: string;
  /** Catalog display name (falls back to the built-in symbol list). */
  symbolName?: string;
  symbolFlag?: string;
  timeframe: string;
  onTimeframe: (tf: string) => void;
  price?: PriceTick;
  /** Open positions for the current chart symbol (entry / SL / TP lines). */
  levels?: ChartLevel[];
};

type LiveBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function TradingChart({
  symbol,
  symbolName,
  symbolFlag,
  timeframe,
  onTimeframe,
  price,
  levels,
}: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const chartsMod = useRef<typeof import("./chart-engine") | null>(null);
  const liveBarRef = useRef<LiveBar | null>(null);
  const lastBarTimeRef = useRef<number | null>(null);
  /** Bars last applied to the series, so a history refresh can patch instead of setData. */
  const barsRef = useRef<OhlcBar[]>([]);
  /** True after the current symbol/timeframe history request settles (success or failure). */
  const historySettledRef = useRef(false);
  /** True only after this symbol's history has been painted. Live mids wait so they cannot rewrite the previous symbol. */
  const symbolReadyRef = useRef(false);
  /** Ask the history effect to refetch when bars are missing. No-op until that effect is mounted. */
  const requestHistoryRef = useRef<() => void>(() => {});
  const lastMidRef = useRef<number | null>(null);
  const priceRef = useRef<PriceTick | undefined>(price);
  const lastTickAtRef = useRef<number>(0);
  const timeframeRef = useRef(timeframe);
  const [ohlc, setOhlc] = useState<{ o: number; h: number; l: number; c: number } | null>(null);
  /** Bar under the crosshair (null = show live/last bar). */
  const [hoverBar, setHoverBar] = useState<{ o: number; h: number; l: number; c: number; t: number } | null>(null);
  /** True when the user has scrolled the chart away from the live edge. */
  const [awayFromLive, setAwayFromLive] = useState(false);
  const [chartType, setChartType] = useState<"candle" | "line">(() => {
    try {
      const v = localStorage.getItem("7fx_chart_type");
      return v === "line" || v === "candle" ? v : "candle";
    } catch {
      return "candle";
    }
  });
  const [utcClock, setUtcClock] = useState("");
  const [feedError, setFeedError] = useState<{ k: "load" | "update" | "stale" | "feed"; d?: string } | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const [liveFresh, setLiveFresh] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chartTypeRef = useRef(chartType);
  const themeLightRef = useRef(false);
  const paintOverlayRef = useRef<() => void>(() => {});

  timeframeRef.current = timeframe;
  priceRef.current = price;
  chartTypeRef.current = chartType;
  paintOverlayRef.current = () => {
    const canvas = overlayRef.current;
    const chart = chartRef.current;
    const candle = seriesRef.current;
    const line = lineRef.current;
    if (!canvas || !chart || !candle || !line) return;
    paintChartOverlay({
      canvas,
      chart,
      candle,
      line,
      mode: chartTypeRef.current,
      light: themeLightRef.current,
    });
  };

  /** True when the last bar is more than one timeframe behind the clock (a hidden-tab gap). */
  const candleGap = () => {
    const lastT = lastBarTimeRef.current;
    if (lastT == null) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    const tf = timeframeRef.current;
    const next = formingBarTime(nowSec, tf, lastT);
    return next > lastT && next - lastT > timeframeSeconds(tf);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("7fx_chart_type", chartType);
    } catch {
      /* ignore */
    }
  }, [chartType]);

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
      setOhlc((prev) =>
        prev && prev.o === bar.open && prev.h === bar.high && prev.l === bar.low && prev.c === bar.close
          ? prev
          : { o: bar.open, h: bar.high, l: bar.low, c: bar.close }
      );
      paintOverlayRef.current();
      return true;
    } catch {
      return false;
    }
  };

  /** Drive forming candle from real mid only (no synthetic drift). */
  const pushRealMid = (mid: number) => {
    if (!symbolReadyRef.current) return;
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
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      const next = `${h}:${m}:${s} UTC`;
      setUtcClock((prev) => (prev === next ? prev : next));
    };
    tick();
    const t = setInterval(tick, 1000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const fxTheme = useFxTheme();
  themeLightRef.current = fxTheme === "light";
  const [chartGen, setChartGen] = useState(0);
  useEffect(() => {
    const c = chartRef.current;
    const lc = chartsMod.current;
    if (!c || !lc) return;
    const L = fxTheme === "light";
    c.applyOptions({
      layout: { background: { type: lc.ColorType.Solid, color: L ? "#ffffff" : "#000000" }, textColor: L ? "#5b5e66" : "#8b97b0" },
      grid: { vertLines: { color: L ? "#f1efe9" : "#141414" }, horzLines: { color: L ? "#f1efe9" : "#141414" } },
      rightPriceScale: { borderColor: L ? "#e6e2d8" : "#2a2a2a" },
      timeScale: { borderColor: L ? "#e6e2d8" : "#2a2a2a" },
    });
    seriesRef.current?.applyOptions(HIDDEN_CANDLE);
    lineRef.current?.applyOptions(HIDDEN_LINE);
  }, [fxTheme, mounted, chartGen]);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (typeof window === "undefined") return;

    const el = containerRef.current;
    let cancelled = false;
    let chart: IChartApi | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let idleId = 0;
    let usedIdle = false;
    let onCrosshair: ((param: { time?: Time; seriesData: Map<unknown, unknown> }) => void) | null = null;
    let onRange: (() => void) | null = null;

    const boot = () => {
      void import("./chart-engine").then((lc) => {
        if (cancelled || !containerRef.current) return;
        chartsMod.current = lc;
        const host = containerRef.current;
        const light = themeLightRef.current;
        chart = lc.createChart(host, {
          layout: {
            background: { type: lc.ColorType.Solid, color: light ? "#ffffff" : "#000000" },
            textColor: light ? "#5b5e66" : "#8b97b0",
          },
          grid: {
            vertLines: { color: light ? "#f1efe9" : "#141414" },
            horzLines: { color: light ? "#f1efe9" : "#141414" },
          },
          crosshair: { mode: lc.CrosshairMode.Normal },
          rightPriceScale: { borderColor: light ? "#e6e2d8" : "#2a2a2a" },
          timeScale: { borderColor: light ? "#e6e2d8" : "#2a2a2a", timeVisible: true, secondsVisible: false },
          width: host.clientWidth || 300,
          height: host.clientHeight || 240,
        });
        chartRef.current = chart;

        const candle = chart.addSeries(lc.CandlestickSeries, HIDDEN_CANDLE);
        seriesRef.current = candle;

        const line = chart.addSeries(lc.LineSeries, {
          ...HIDDEN_LINE,
          lineWidth: 2,
          visible: false,
        });
        lineRef.current = line;
        setChartGen((g) => g + 1);

        onCrosshair = (param) => {
          if (param.time == null) {
            setHoverBar(null);
            return;
          }
          const d = param.seriesData.get(candle) as CandlestickData<Time> | undefined;
          if (d && typeof d.open === "number") {
            setHoverBar({ o: d.open, h: d.high, l: d.low, c: d.close, t: param.time as number });
            return;
          }
          const ld = param.seriesData.get(line) as { value?: number } | undefined;
          if (ld && typeof ld.value === "number") {
            setHoverBar({ o: ld.value, h: ld.value, l: ld.value, c: ld.value, t: param.time as number });
            return;
          }
          setHoverBar(null);
        };
        chart.subscribeCrosshairMove(onCrosshair as never);

        onRange = () => {
          try {
            const pos = chart?.timeScale().scrollPosition();
            setAwayFromLive(pos != null && Number.isFinite(pos) && pos < -3);
          } catch {
            /* ignore */
          }
          paintOverlayRef.current();
        };
        chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);

        ro =
          typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => {
                if (containerRef.current && chartRef.current) {
                  chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                  });
                  paintOverlayRef.current();
                }
              })
            : null;
        ro?.observe(host);
      });
    };

    const arm = () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") {
        usedIdle = true;
        idleId = ric(() => boot(), { timeout: 500 });
      } else {
        idleId = window.setTimeout(boot, 1);
      }
    };

    const box = el.getBoundingClientRect();
    const onScreen = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
    if (onScreen) {
      arm();
    } else if (typeof IntersectionObserver === "function") {
      io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io?.disconnect();
        io = null;
        arm();
      });
      io.observe(el);
    } else {
      arm();
    }

    return () => {
      cancelled = true;
      if (usedIdle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      io?.disconnect();
      ro?.disconnect();
      try {
        if (chart && onCrosshair) chart.unsubscribeCrosshairMove(onCrosshair as never);
        if (chart && onRange) chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
      } catch {
        /* ignore */
      }
      priceLinesRef.current = [];
      chart?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lineRef.current = null;
      liveBarRef.current = null;
      lastBarTimeRef.current = null;
      barsRef.current = [];
    };
  }, [mounted]);

  // Historical backbone on symbol/timeframe change. Live mid updates the forming bar.
  // Refetch only when a bar is missing (gap larger than one timeframe, or history never landed).
  useEffect(() => {
    if (!seriesRef.current) return;
    let cancelled = false;
    let gapAt = 0;
    historySettledRef.current = false;

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
          const plain: OhlcBar[] = bars.map((bar) => ({
            time: bar.time as number,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          }));
          const plan =
            fit || barsRef.current.length === 0
              ? { kind: "replace" as const }
              : chartReconcilePlan(barsRef.current, plain);
          const paintLast = () => {
            const last = plain[plain.length - 1];
            symbolReadyRef.current = true;
            lastBarTimeRef.current = last.time;
            liveBarRef.current = last;
            if (lastMidRef.current == null && mid != null) lastMidRef.current = mid;
            setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close });
            barsRef.current = plain;
          };
          const replaceSeries = () => {
            const ts = chartRef.current?.timeScale();
            let restore: { from: number; to: number } | null = null;
            let atLive = true;
            if (!fit && ts) {
              try {
                const pos = ts.scrollPosition();
                atLive = !Number.isFinite(pos) || (pos >= -1 && pos <= 1);
                const range = ts.getVisibleLogicalRange();
                if (!atLive && range) restore = { from: range.from, to: range.to };
              } catch {
                /* ignore */
              }
            }
            seriesRef.current?.setData(bars);
            if (lineRef.current) {
              lineRef.current.setData(bars.map((b) => ({ time: b.time, value: b.close })));
            }
            paintLast();
            if (fit) ts?.fitContent();
            else if (restore) ts?.setVisibleLogicalRange(restore);
            else ts?.scrollToPosition(0, false);
            paintOverlayRef.current();
          };
          try {
            if (plan.kind === "patch") {
              for (const bar of plan.updates) {
                seriesRef.current?.update({
                  time: bar.time as Time,
                  open: bar.open,
                  high: bar.high,
                  low: bar.low,
                  close: bar.close,
                });
                lineRef.current?.update({ time: bar.time as Time, value: bar.close });
              }
              paintLast();
              paintOverlayRef.current();
            } else {
              replaceSeries();
            }
          } catch {
            try {
              replaceSeries();
            } catch {
              setFeedError({ k: "update" });
            }
          }
        } else if (fit && !data.error) {
          try {
            seriesRef.current?.setData([]);
            lineRef.current?.setData([]);
          } catch {
            /* chart not ready */
          }
          barsRef.current = [];
          liveBarRef.current = null;
          lastBarTimeRef.current = null;
          symbolReadyRef.current = true;
          setOhlc(null);
        }

        if (data.error) {
          setFeedError({ k: data.stale ? "stale" : "feed", d: String(data.error || "") });
        } else {
          setFeedError(null);
        }
      } catch {
        if (!cancelled) setFeedError({ k: "load" });
      } finally {
        if (!cancelled) historySettledRef.current = true;
      }
    }

    const requestHistory = () => {
      if (cancelled) return;
      const now = Date.now();
      if (now - gapAt < 10_000) return;
      const missing = lastBarTimeRef.current == null ? historySettledRef.current : candleGap();
      if (!missing) return;
      gapAt = now;
      void load(false);
    };
    requestHistoryRef.current = requestHistory;

    // Keep the previous symbol on screen until this history replaces it.
    // Clearing the live-bar pointers (without setData([])) stops a new mid from updating those candles.
    symbolReadyRef.current = false;
    liveBarRef.current = null;
    lastBarTimeRef.current = null;
    lastMidRef.current = null;
    barsRef.current = [];
    void load(true);
    const onVis = () => {
      if (!document.hidden) requestHistory();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      historySettledRef.current = false;
      requestHistoryRef.current = () => {};
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload history only when the symbol, timeframe, or chart instance changes
  }, [symbol, timeframe, chartGen]);

  // Stream forming candle from live mid ≤1s (real Yahoo mid only — no synthetic drift).
  useEffect(() => {
    let lastApplied: number | null = null;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      requestHistoryRef.current();
      if (candleGap()) return;
      const mid = priceRef.current?.mid;
      if (mid == null || !Number.isFinite(mid) || mid <= 0) {
        const next = Date.now() - lastTickAtRef.current < 2500;
        setLiveFresh((prev) => (prev === next ? prev : next));
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
      const seen = quotesSeenAt();
      if (seen > lastTickAtRef.current) lastTickAtRef.current = seen;
      const fresh = Date.now() - lastTickAtRef.current < 2500;
      setLiveFresh((prev) => (prev === fresh ? prev : fresh));
    };
    tick();
    const id = window.setInterval(tick, 500);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the interval reads the mid from a ref so price ticks do not restart it
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply the parent mid immediately; the push helper is stable for this effect
  }, [price?.mid, price?.ts, symbol]);

  useEffect(() => {
    if (seriesRef.current) seriesRef.current.applyOptions({ visible: chartType === "candle" });
    if (lineRef.current) lineRef.current.applyOptions({ visible: chartType === "line" });
    paintOverlayRef.current();
  }, [chartType, fxTheme, chartGen]);

  // Open-position entry / SL / TP price lines for the current symbol.
  useEffect(() => {
    const series = seriesRef.current;
    // Clear previous lines (series may be gone after chart recreate)
    for (const pl of priceLinesRef.current) {
      try {
        series?.removePriceLine(pl);
      } catch {
        /* ignore */
      }
    }
    priceLinesRef.current = [];
    const lc = chartsMod.current;
    if (!series || !levels?.length || !lc) return;

    const L = fxTheme === "light";
    const buyColor = L ? "#0f9d76" : "#26a69a";
    const sellColor = L ? "#d63c34" : "#ef5350";
    const next: IPriceLine[] = [];

    const ticketSuffix = (id: string) => {
      const s = String(id || "");
      return s.length <= 4 ? s : s.slice(-4);
    };

    for (const lv of levels) {
      if (!Number.isFinite(lv.openPrice) || lv.openPrice <= 0) continue;
      const entryColor = lv.side === "BUY" ? buyColor : sellColor;
      const sideLabel = lv.side === "BUY" ? t("term.buy") : t("term.sell");
      const suffix = levels.length > 1 ? ` ·${ticketSuffix(lv.id)}` : "";
      try {
        next.push(
          series.createPriceLine({
            price: lv.openPrice,
            color: entryColor,
            lineWidth: 1,
            lineStyle: lc.LineStyle.Solid,
            axisLabelVisible: true,
            title: `${sideLabel} · ${t("term.chart.entry")}${suffix}`,
          })
        );
      } catch {
        /* ignore */
      }
      if (lv.stopLoss != null && Number.isFinite(lv.stopLoss) && lv.stopLoss > 0) {
        try {
          next.push(
            series.createPriceLine({
              price: lv.stopLoss,
              color: sellColor,
              lineWidth: 1,
              lineStyle: lc.LineStyle.Dashed,
              axisLabelVisible: true,
              title: `SL${suffix}`,
            })
          );
        } catch {
          /* ignore */
        }
      }
      if (lv.takeProfit != null && Number.isFinite(lv.takeProfit) && lv.takeProfit > 0) {
        try {
          next.push(
            series.createPriceLine({
              price: lv.takeProfit,
              color: buyColor,
              lineWidth: 1,
              lineStyle: lc.LineStyle.Dashed,
              axisLabelVisible: true,
              title: `TP${suffix}`,
            })
          );
        } catch {
          /* ignore */
        }
      }
    }
    priceLinesRef.current = next;

    return () => {
      const s = seriesRef.current;
      for (const pl of priceLinesRef.current) {
        try {
          s?.removePriceLine(pl);
        } catch {
          /* ignore */
        }
      }
      priceLinesRef.current = [];
    };
  }, [levels, symbol, fxTheme, chartGen, mounted, t]);

  const fmt = (n: number) => formatPrice(symbol, n);
  const legend = hoverBar ?? ohlc;
  const legendChg = legend && legend.o > 0 ? ((legend.c - legend.o) / legend.o) * 100 : null;
  const hoverLabel = (() => {
    if (!hoverBar) return null;
    const d = new Date(hoverBar.t * 1000);
    const p2 = (n: number) => String(n).padStart(2, "0");
    const date = `${p2(d.getDate())}.${p2(d.getMonth() + 1)}${timeframe === "1D" || timeframe === "1W" ? `.${d.getFullYear()}` : ""}`;
    return timeframe === "1D" || timeframe === "1W" ? date : `${date} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  })();

  const catalog = getSymbol(symbol);
  const company = (symbolName || catalog?.name || "").trim();
  const showName = company.length > 0 && company.toUpperCase() !== symbol.toUpperCase();
  const flag = symbolFlag || catalog?.flag;
  const hasQuote =
    price != null && Number.isFinite(price.bid) && Number.isFinite(price.ask) && price.bid > 0 && price.ask > 0;
  const quoteUp = (price?.change ?? 0) >= 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-desk-bg">
      {/* Phones: chrome is in normal flow so the quote block cannot cover the timeframe bar.
          sm+: overlay so the canvas stays full-bleed. */}
      <div className="fx-chart-chrome z-10 flex shrink-0 flex-col gap-1.5 border-b border-desk-border/50 bg-desk-bg px-2 py-1.5 sm:pointer-events-none sm:absolute sm:inset-x-2 sm:top-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 md:inset-x-2.5">
      <div
        className="flex min-w-0 items-start gap-1.5 sm:max-w-[calc(100%-22rem)] sm:flex-1"
        data-fx-chart-head=""
      >
        <span
          className={`mt-1 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-normal tracking-[0.08em] ring-1 md:gap-1 md:px-2 md:py-0.5 md:tracking-wide ${
            liveFresh
              ? `bg-desk-accent/15 text-desk-accent ring-desk-accent/35 ${livePulse ? "ring-desk-accent/70 bg-desk-accent/25" : ""}`
              : "bg-desk-elev/80 text-desk-muted ring-desk-border/60"
          }`}
          title={liveFresh ? t("term.chart.liveQuote") : t("term.chart.waiting")}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              liveFresh
                ? "animate-pulse bg-desk-accent shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                : "bg-desk-muted"
            }`}
          />
          {t("term.chart.liveBadge")}
        </span>
        <div className="flex min-w-0 items-start gap-1.5 rounded-[12px] bg-desk-bg/80 px-1.5 py-1 ring-1 ring-desk-border/40 backdrop-blur-[2px] md:gap-2 md:px-2">
          <SymbolIcon symbol={symbol} fallback={flag || "•"} size={28} className="mt-0.5 md:!h-6 md:!w-6" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <span className="shrink-0 text-[15px] font-normal tracking-tight text-desk-text md:text-sm">
                {symbol}
              </span>
              {showName && (
                <span className="min-w-0 truncate text-[11px] font-normal text-desk-muted md:text-[12px]" title={company}>
                  {company}
                </span>
              )}
            </div>
            <div
              className="mt-0.5 flex min-h-[18px] flex-nowrap items-baseline gap-x-1 overflow-hidden text-[11px] font-normal tabular-nums leading-tight sm:gap-x-1.5 md:text-[12px]"
              data-fx-chart-quote=""
              title={t("term.liveQuote")}
              aria-live="off"
            >
              <span className="text-[9px] font-normal uppercase tracking-wide text-desk-muted">{t("term.bid")}</span>
              <span className="min-w-[4.25rem] text-desk-sell">{hasQuote && price ? formatPrice(symbol, price.bid) : "—"}</span>
              <span className="text-desk-muted/40">/</span>
              <span className="text-[9px] font-normal uppercase tracking-wide text-desk-muted">{t("term.ask")}</span>
              <span className="min-w-[4.25rem] text-desk-buy">{hasQuote && price ? formatPrice(symbol, price.ask) : "—"}</span>
              <span className={`min-w-[3.5rem] ${hasQuote && price && Number.isFinite(price.changePct) ? (quoteUp ? "text-desk-buy" : "text-desk-sell") : "text-transparent"}`}>
                {hasQuote && price && Number.isFinite(price.changePct)
                  ? `${quoteUp ? "+" : ""}${price.changePct.toFixed(2)}%`
                  : "+0.00%"}
              </span>
            </div>
            {legend && (
              <div
                className="fx-chart-legend mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] tabular-nums text-desk-muted"
                aria-live="off"
                title={hoverBar ? t("term.chart.barUnder") : t("term.chart.latestBar")}
              >
                {hoverLabel && (
                  <span className="rounded-[5px] bg-desk-elev/80 px-1 text-desk-text/80 ring-1 ring-desk-border/60">
                    {hoverLabel}
                  </span>
                )}
                <span>
                  O <span className="text-desk-text/80">{fmt(legend.o)}</span>
                </span>
                <span>
                  H <span className="text-desk-buy">{fmt(legend.h)}</span>
                </span>
                <span>
                  L <span className="text-desk-sell">{fmt(legend.l)}</span>
                </span>
                <span>
                  C <span className="text-desk-text/80">{fmt(legend.c)}</span>
                </span>
                {legendChg != null && Number.isFinite(legendChg) && (
                  <span className={legendChg >= 0 ? "text-desk-buy" : "text-desk-sell"}>
                    {legendChg >= 0 ? "+" : ""}
                    {legendChg.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fx-chart-tools flex min-w-0 items-center gap-1.5 sm:pointer-events-auto sm:mr-[1.5cm] sm:shrink-0 sm:justify-end">
        <span className="hidden rounded-control border border-desk-border/60 bg-desk-panel/70 px-2 py-1 text-[10px] tabular-nums text-desk-muted sm:inline">
          {utcClock}
        </span>
        <div
          className="flex min-w-0 max-w-full flex-1 overflow-x-auto rounded-[12px] border border-desk-border/70 bg-desk-panel/95 p-0.5 shadow-desk-panel [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-none md:rounded-control"
          role="group"
          aria-label={t("term.chart.timeframe")}
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              aria-pressed={timeframe === tf.id}
              onClick={() => onTimeframe(tf.id)}
              className={`fx-tap-compact shrink-0 rounded-[9px] px-2.5 py-1.5 text-[11px] font-normal transition-colors md:rounded-[8px] md:px-2 md:py-1 ${
                timeframe === tf.id
                  ? "bg-desk-accent text-desk-accent-ink shadow-accent-glow-sm"
                  : "text-desk-muted hover:bg-desk-hover hover:text-desk-text"
              }`}
            >
              {tf.label.includes(".") ? t(tf.label) : tf.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-control border border-desk-border bg-desk-panel/90 p-0.5" role="group" aria-label={t("term.chart.type")}>
          <button
            type="button"
            aria-pressed={chartType === "candle"}
            onClick={() => setChartType("candle")}
            className={`fx-tap-compact rounded-[8px] px-2 py-1 text-[11px] font-normal ${
              chartType === "candle" ? "bg-desk-elev text-desk-text" : "text-desk-muted hover:text-desk-text"
            }`}
          >
            {t("term.chart.candle")}
          </button>
          <button
            type="button"
            aria-pressed={chartType === "line"}
            onClick={() => setChartType("line")}
            className={`fx-tap-compact rounded-[8px] px-2 py-1 text-[11px] font-normal ${
              chartType === "line" ? "bg-desk-elev text-desk-text" : "text-desk-muted hover:text-desk-text"
            }`}
          >
            {t("term.chart.line")}
          </button>
        </div>
      </div>
      </div>

      {feedError && (
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-control bg-desk-warn/95 px-3 py-1.5 text-[11px] font-medium text-black shadow-lg">
          {feedError.k === "load"
            ? t("term.chart.loadFail")
            : feedError.k === "update"
              ? t("term.chart.updateFail")
              : t(feedError.k === "stale" ? "term.chart.stale" : "term.chart.feed").replace("{error}", feedError.d || "")}
        </div>
      )}

      {awayFromLive && (
        <button
          type="button"
          onClick={() => {
            try {
              chartRef.current?.timeScale().scrollToRealTime();
            } catch {
              /* ignore */
            }
          }}
          className="fx-tap-compact absolute bottom-10 right-[4.5rem] z-20 flex items-center gap-1 rounded-full border border-desk-border/70 bg-desk-panel/95 px-3 py-1.5 text-[11px] font-normal text-desk-text shadow-desk-panel hover:bg-desk-hover"
          title={t("term.chart.live")}
          aria-label={t("term.chart.live")}
        >
          {t("term.chart.live")}
          <span aria-hidden="true">⇥</span>
        </button>
      )}

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden="true" />
      </div>
    </div>
  );
}
