import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";
import {
  candleColors,
  easeRightEdge,
  strokeCandles,
  strokeMonotone,
  type PaintBar,
  type PlacedBar,
} from "@/components/charts/price-paint";

const HIDDEN = "rgba(0,0,0,0)";

/** Series stay on the scale for crosshair, autoscale, and order lines. Pixels come from price-paint. */
export const HIDDEN_CANDLE = {
  upColor: HIDDEN,
  downColor: HIDDEN,
  borderUpColor: HIDDEN,
  borderDownColor: HIDDEN,
  wickUpColor: HIDDEN,
  wickDownColor: HIDDEN,
};

export const HIDDEN_LINE = { color: HIDDEN };

/**
 * Draw the trade chart with the landing candle/line painter, in the chart's own
 * price coordinates so order lines and the OHLC legend stay on the real prices.
 */
export function paintChartOverlay(opts: {
  canvas: HTMLCanvasElement;
  chart: IChartApi;
  candle: ISeriesApi<"Candlestick">;
  line: ISeriesApi<"Line">;
  mode: "candle" | "line";
  light: boolean;
}) {
  const { canvas, chart, candle, line, mode, light } = opts;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 0;
  const h = canvas.clientHeight || 0;
  if (w < 2 || h < 2) return;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const raw = candle.data() as readonly CandlestickData<Time>[];
  if (raw.length < 2) return;
  const bars: PaintBar[] = [];
  const times: Time[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const bar = raw[i];
    if (typeof bar.open !== "number" || typeof bar.close !== "number") continue;
    bars.push({ o: bar.open, h: bar.high, l: bar.low, c: bar.close });
    times.push(bar.time);
  }
  if (bars.length < 2) return;
  const eased = easeRightEdge(bars);
  const ySeries = mode === "line" ? line : candle;
  const yOf = (price: number) => {
    const y = ySeries.priceToCoordinate(price);
    return y == null ? Number.NaN : y;
  };

  let priceW = 0;
  let timeH = 0;
  try {
    priceW = chart.priceScale("right").width();
    timeH = chart.timeScale().height();
  } catch {
    priceW = 0;
    timeH = 0;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, Math.max(1, w - priceW), Math.max(1, h - timeH));
  ctx.clip();

  const ts = chart.timeScale();
  const xs: number[] = [];
  for (let i = 0; i < times.length; i += 1) {
    const x = ts.timeToCoordinate(times[i]);
    xs.push(x == null ? Number.NaN : x);
  }
  if (mode === "line") {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < bars.length; i += 1) {
      const y = yOf(bars[i].c);
      if (!Number.isFinite(xs[i]) || !Number.isFinite(y)) continue;
      pts.push([xs[i], y]);
    }
    if (pts.length >= 2) {
      const colors = candleColors(light);
      const up = bars[bars.length - 1].c >= bars[0].c;
      strokeMonotone(ctx, pts);
      ctx.strokeStyle = up ? colors.up : colors.down;
      ctx.lineWidth = 1.75;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  } else {
    const placed: PlacedBar[] = [];
    let prevSlot = 6;
    for (let i = 0; i < eased.length; i += 1) {
      if (!Number.isFinite(xs[i])) continue;
      let slot = prevSlot;
      for (let j = i + 1; j < xs.length; j += 1) {
        if (!Number.isFinite(xs[j])) continue;
        const gap = Math.abs(xs[j] - xs[i]);
        if (gap > 0.5) slot = gap;
        break;
      }
      prevSlot = slot;
      const bar = eased[i];
      placed.push({ x: xs[i], slot, o: bar.o, h: bar.h, l: bar.l, c: bar.c });
    }
    strokeCandles(ctx, placed, yOf, candleColors(light));
  }
  ctx.restore();
}
