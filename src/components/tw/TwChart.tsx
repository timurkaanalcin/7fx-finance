"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useI18n } from "@/lib/i18n/context";
import { bollinger, ema, sma } from "./indicators";

export type TwBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type TwChartType = "candle" | "bar" | "line" | "area";
export type TwTool = "cursor" | "trend" | "hline" | "vline" | "ray" | "rect" | "erase";
export type TwIndicators = { sma: boolean; ema: boolean; bb: boolean };

export type TwDrawing = {
  id: string;
  kind: "trend" | "hline" | "vline" | "ray" | "rect";
  a: { time: number; price: number };
  b?: { time: number; price: number };
};

type Props = {
  bars: TwBar[];
  chartType: TwChartType;
  indicators: TwIndicators;
  tool: TwTool;
  drawings: TwDrawing[];
  onDrawings: (next: TwDrawing[]) => void;
};

const UP = "#26a69a";
const DOWN = "#ef5350";

function unix(time: Time | null): number | null {
  return typeof time === "number" ? time : null;
}

function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  if (len === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export default function TwChart({ bars, chartType, indicators, tool, drawings, onDrawings }: Props) {
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const extraRef = useRef<ISeriesApi<SeriesType>[]>([]);
  const appliedRef = useRef<TwBar[] | null>(null);
  const indKeyRef = useRef("");
  const barsRef = useRef(bars);
  const indicatorsRef = useRef(indicators);
  const drawingsRef = useRef(drawings);
  const toolRef = useRef(tool);
  barsRef.current = bars;
  indicatorsRef.current = indicators;
  drawingsRef.current = drawings;
  toolRef.current = tool;
  const [draft, setDraft] = useState<TwDrawing | null>(null);
  const draftRef = useRef<TwDrawing | null>(null);
  draftRef.current = draft;
  const [ready, setReady] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#d1d4dc",
        fontFamily: "Inter, system-ui, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#141414" },
        horzLines: { color: "#141414" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2a2a2a" },
      timeScale: { borderColor: "#2a2a2a", timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    volumeRef.current = volume;
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    chart.priceScale("right").applyOptions({ scaleMargins: { top: 0.08, bottom: 0.24 } });
    const paint = () => paintDrawings();
    chart.timeScale().subscribeVisibleLogicalRangeChange(paint);
    setReady((n) => n + 1);
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(paint);
      chart.remove();
      chartRef.current = null;
      mainRef.current = null;
      volumeRef.current = null;
      extraRef.current = [];
      appliedRef.current = null;
    };
    // Chart instance is created once. Series type swaps in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create the chart once; series swaps do not rebuild it
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !ready) return;
    if (mainRef.current) {
      chart.removeSeries(mainRef.current);
      mainRef.current = null;
    }
    const common = { priceLineVisible: true, lastValueVisible: true };
    if (chartType === "line") {
      mainRef.current = chart.addSeries(LineSeries, { ...common, color: "#d1d4dc", lineWidth: 2 });
    } else if (chartType === "area") {
      mainRef.current = chart.addSeries(AreaSeries, {
        ...common,
        lineColor: "#d1d4dc",
        topColor: "rgba(209,212,220,0.28)",
        bottomColor: "rgba(209,212,220,0.02)",
        lineWidth: 2,
      });
    } else if (chartType === "bar") {
      mainRef.current = chart.addSeries(BarSeries, { ...common, upColor: UP, downColor: DOWN });
    } else {
      mainRef.current = chart.addSeries(CandlestickSeries, {
        ...common,
        upColor: UP,
        downColor: DOWN,
        borderVisible: false,
        wickUpColor: UP,
        wickDownColor: DOWN,
      });
    }
    appliedRef.current = null;
    applySeries(true);
    paintDrawings();
    // applySeries and paintDrawings close over the latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- swap the price series when the chart type changes
  }, [chartType, ready]);

  useEffect(() => {
    if (!ready) return;
    applySeries(false);
    paintDrawings();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paint reads the latest series through refs
  }, [bars, indicators, drawings, draft, ready]);

  function applySeries(fit: boolean) {
    const chart = chartRef.current;
    const main = mainRef.current;
    const volume = volumeRef.current;
    if (!chart || !main || !volume) return;
    const rows = barsRef.current;
    const ind = indicatorsRef.current;
    const prev = appliedRef.current;
    const last = rows[rows.length - 1];
    const prevLast = prev?.[prev.length - 1];
    const canUpdate =
      !fit &&
      !!prev &&
      prev.length === rows.length &&
      prev.length > 0 &&
      prev[0].time === rows[0].time &&
      prevLast?.time === last?.time;
    const lineLike = chartType === "line" || chartType === "area";
    if (canUpdate && last) {
      if (lineLike) main.update({ time: last.time as UTCTimestamp, value: last.close });
      else {
        main.update({
          time: last.time as UTCTimestamp,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        });
      }
      volume.update({
        time: last.time as UTCTimestamp,
        value: last.volume && last.volume > 0 ? last.volume : 0,
        color: last.close >= last.open ? "rgba(38,166,154,0.45)" : "rgba(239,83,80,0.45)",
      });
    } else {
    if (lineLike) {
      main.setData(rows.map((b) => ({ time: b.time as UTCTimestamp, value: b.close })));
    } else {
      main.setData(
        rows.map((b) => ({
          time: b.time as UTCTimestamp,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      );
    }
    volume.setData(
      rows.map((b) => ({
        time: b.time as UTCTimestamp,
        value: b.volume && b.volume > 0 ? b.volume : 0,
        color: b.close >= b.open ? "rgba(38,166,154,0.45)" : "rgba(239,83,80,0.45)",
      }))
    );
    if (fit || !prev) {
      try {
        chart.timeScale().fitContent();
      } catch {
        /* ignore */
      }
    }
    }
    appliedRef.current = rows;
    const indKey = `${ind.sma}:${ind.ema}:${ind.bb}:${rows.length}:${rows[0]?.time ?? 0}`;
    if (canUpdate && indKey === indKeyRef.current) return;
    indKeyRef.current = indKey;
    for (const series of extraRef.current) chart.removeSeries(series);
    extraRef.current = [];
    const closes = rows.map((b) => b.close);
    const addLine = (values: (number | null)[], color: string) => {
      const data = rows
        .map((b, i) => (values[i] == null ? null : { time: b.time as UTCTimestamp, value: values[i] as number }))
        .filter((row): row is { time: UTCTimestamp; value: number } => row != null);
      if (!data.length) return;
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      series.setData(data);
      extraRef.current.push(series);
    };
    if (ind.sma) addLine(sma(closes, 20), "#d1d4dc");
    if (ind.ema) addLine(ema(closes, 20), "#787b86");
    if (ind.bb) {
      const bands = bollinger(closes, 20, 2);
      addLine(bands.upper, "rgba(209,212,220,0.55)");
      addLine(bands.lower, "rgba(209,212,220,0.55)");
    }
  }

  function paintDrawings() {
    const canvas = drawRef.current;
    const chart = chartRef.current;
    const main = mainRef.current;
    if (!canvas || !chart || !main) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = "#d1d4dc";
    ctx.fillStyle = "rgba(209,212,220,0.08)";
    const items = draftRef.current ? [...drawingsRef.current, draftRef.current] : drawingsRef.current;
    for (const item of items) strokeDrawing(ctx, chart, main, item, width, height);
  }

  function locate(x: number, y: number): { time: number; price: number } | null {
    const chart = chartRef.current;
    const main = mainRef.current;
    if (!chart || !main) return null;
    const time = unix(chart.timeScale().coordinateToTime(x));
    const price = main.coordinateToPrice(y);
    if (time == null || price == null || !Number.isFinite(price)) return null;
    return { time, price };
  }

  function onPointerDown(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (toolRef.current === "cursor") return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    if (toolRef.current === "erase") {
      const hit = hitTest(x, y);
      if (hit) onDrawings(drawingsRef.current.filter((item) => item.id !== hit));
      return;
    }
    const point = locate(x, y);
    if (!point) return;
    if (toolRef.current === "hline" || toolRef.current === "vline") {
      onDrawings([
        ...drawingsRef.current,
        { id: cryptoId(), kind: toolRef.current, a: point },
      ]);
      return;
    }
    const next: TwDrawing = { id: cryptoId(), kind: toolRef.current, a: point, b: point };
    setDraft(next);
    ev.currentTarget.setPointerCapture(ev.pointerId);
  }

  function onPointerMove(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (!draftRef.current) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const point = locate(ev.clientX - rect.left, ev.clientY - rect.top);
    if (!point) return;
    setDraft({ ...draftRef.current, b: point });
  }

  function onPointerUp() {
    const current = draftRef.current;
    if (!current?.b) return;
    setDraft(null);
    onDrawings([...drawingsRef.current, current]);
  }

  function hitTest(x: number, y: number): string | null {
    const chart = chartRef.current;
    const main = mainRef.current;
    if (!chart || !main) return null;
    let best: { id: string; dist: number } | null = null;
    for (const item of drawingsRef.current) {
      const box = drawingBox(chart, main, item, drawRef.current?.clientWidth || 0, drawRef.current?.clientHeight || 0);
      if (!box) continue;
      const dist =
        item.kind === "hline"
          ? Math.abs(y - box.y1)
          : item.kind === "vline"
            ? Math.abs(x - box.x1)
            : item.kind === "rect"
              ? Math.min(
                  distToSeg(x, y, box.x1, box.y1, box.x2, box.y1),
                  distToSeg(x, y, box.x2, box.y1, box.x2, box.y2),
                  distToSeg(x, y, box.x2, box.y2, box.x1, box.y2),
                  distToSeg(x, y, box.x1, box.y2, box.x1, box.y1)
                )
              : distToSeg(x, y, box.x1, box.y1, box.x2, box.y2);
      if (dist <= 12 && (!best || dist < best.dist)) best = { id: item.id, dist };
    }
    return best?.id ?? null;
  }

  return (
    <div className="tw-chart">
      <div ref={hostRef} className="tw-chart-host" />
      <canvas
        ref={drawRef}
        className={tool === "cursor" ? "tw-draw is-idle" : "tw-draw"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-hidden={tool === "cursor"}
      />
      <a className="tw-credit" href="https://www.npmjs.com/package/lightweight-charts" target="_blank" rel="noreferrer">
        {t("tw.chartsCredit")}
      </a>
    </div>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function xy(
  chart: IChartApi,
  series: ISeriesApi<SeriesType>,
  time: number,
  price: number
): { x: number; y: number } | null {
  const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
  const y = series.priceToCoordinate(price);
  if (x == null || y == null) return null;
  return { x, y };
}

function drawingBox(
  chart: IChartApi,
  series: ISeriesApi<SeriesType>,
  item: TwDrawing,
  width: number,
  height: number
): { x1: number; y1: number; x2: number; y2: number } | null {
  const a = xy(chart, series, item.a.time, item.a.price);
  if (item.kind === "hline") {
    const y = series.priceToCoordinate(item.a.price);
    if (y == null) return null;
    return { x1: 0, y1: y, x2: width, y2: y };
  }
  if (item.kind === "vline") {
    const x = chart.timeScale().timeToCoordinate(item.a.time as UTCTimestamp);
    if (x == null) return null;
    return { x1: x, y1: 0, x2: x, y2: height };
  }
  if (!item.b || !a) return null;
  const b = xy(chart, series, item.b.time, item.b.price);
  if (!b) return null;
  if (item.kind === "ray") {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const scale = (Math.hypot(width, height) * 2) / len;
    return { x1: a.x, y1: a.y, x2: a.x + dx * scale, y2: a.y + dy * scale };
  }
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

function strokeDrawing(
  ctx: CanvasRenderingContext2D,
  chart: IChartApi,
  series: ISeriesApi<SeriesType>,
  item: TwDrawing,
  width: number,
  height: number
) {
  const box = drawingBox(chart, series, item, width, height);
  if (!box) return;
  ctx.beginPath();
  if (item.kind === "rect") {
    ctx.rect(Math.min(box.x1, box.x2), Math.min(box.y1, box.y2), Math.abs(box.x2 - box.x1), Math.abs(box.y2 - box.y1));
    ctx.fill();
    ctx.stroke();
    return;
  }
  ctx.moveTo(box.x1, box.y1);
  ctx.lineTo(box.x2, box.y2);
  ctx.stroke();
}
