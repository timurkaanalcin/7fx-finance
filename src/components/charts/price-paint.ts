/** Shared candle and line painter for the landing hero and the trade chart. */

export type PaintBar = { o: number; h: number; l: number; c: number };

export const CANDLE_UP = "#3ddc97";
export const CANDLE_DOWN = "#ff5d73";
export const CANDLE_UP_LIGHT = "#0f9d76";
export const CANDLE_DOWN_LIGHT = "#d63c34";

export type CandleColors = { up: string; down: string };

export function candleColors(light: boolean): CandleColors {
  return light
    ? { up: CANDLE_UP_LIGHT, down: CANDLE_DOWN_LIGHT }
    : { up: CANDLE_UP, down: CANDLE_DOWN };
}

function isFlat(bar: PaintBar, tiny: number, anchor: number): boolean {
  return bar.h - bar.l <= tiny && Math.abs(bar.c - anchor) <= tiny && Math.abs(bar.o - anchor) <= tiny;
}

/**
 * Display-only. Open and close stay put. A long wick beside a flat right-edge
 * run is shortened so the shelf does not end in a vertical spike.
 * Returns the same array when nothing changes.
 */
export function easeRightEdge(bars: readonly PaintBar[]): readonly PaintBar[] {
  const n = bars.length;
  if (n < 8) return bars;
  const anchor = bars[n - 1].c;
  if (!Number.isFinite(anchor)) return bars;
  const tiny = Math.max(Math.abs(anchor) * 0.00008, 1e-9);
  const start = Math.max(0, n - 10);
  let flatCount = 0;
  for (let i = start; i < n; i += 1) {
    if (isFlat(bars[i], tiny, anchor)) flatCount += 1;
  }
  if (flatCount < 4) return bars;

  const wicks: number[] = [];
  const bodies: number[] = [];
  const sampleFrom = Math.max(0, n - 24);
  for (let i = sampleFrom; i < n; i += 1) {
    const bar = bars[i];
    const top = Math.max(bar.o, bar.c);
    const bot = Math.min(bar.o, bar.c);
    wicks.push(Math.max(bar.h - top, bot - bar.l));
    bodies.push(Math.abs(bar.o - bar.c));
  }
  wicks.sort((a, b) => a - b);
  bodies.sort((a, b) => a - b);
  const medWick = wicks[Math.floor(wicks.length / 2)] ?? tiny;
  const medBody = bodies[Math.floor(bodies.length / 2)] ?? tiny;
  const capWick = Math.max(medWick * 1.15, tiny);
  const capBody = Math.max(medBody * 1.5, tiny);

  const out = bars.slice();
  let changed = false;
  for (let i = start; i < n; i += 1) {
    const bar = out[i];
    let o = bar.o;
    const body = Math.abs(o - bar.c);
    if (body > capBody) {
      const dir = o >= bar.c ? 1 : -1;
      const easedBody = capBody + (body - capBody) * 0.15;
      o = bar.c + dir * easedBody;
    }
    const top = Math.max(o, bar.c);
    const bot = Math.min(o, bar.c);
    let h = Math.max(bar.h, top);
    let l = Math.min(bar.l, bot);
    if (h - top > capWick) h = top + capWick + (h - top - capWick) * 0.12;
    if (bot - l > capWick) l = bot - capWick - (bot - l - capWick) * 0.12;
    if (o !== bar.o || h !== bar.h || l !== bar.l) {
      out[i] = { o, h, l, c: bar.c };
      changed = true;
    }
  }
  return changed ? out : bars;
}

export function viewRange(low: number, high: number): { min: number; max: number } {
  const mid = (low + high) / 2;
  const span = high - low;
  const floor = Math.max(Math.abs(mid) * 0.0008, 1e-6);
  if (!(span > floor)) {
    return { min: mid - floor / 2, max: mid + floor / 2 };
  }
  const pad = span * 0.12;
  return { min: low - pad, max: high + pad };
}

function smoothCloses(values: readonly number[]): readonly number[] {
  if (values.length < 5) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const a = values[Math.max(0, i - 2)];
    const b = values[Math.max(0, i - 1)];
    const c = values[i];
    const d = values[Math.min(values.length - 1, i + 1)];
    const e = values[Math.min(values.length - 1, i + 2)];
    out.push((a + b + c + d + e) / 5);
  }
  return out;
}

export function strokeMonotone(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>) {
  const n = pts.length;
  if (n < 2) return;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    slope[i] = dx[i] === 0 ? 0 : dy / dx[i];
  }
  const tan: number[] = new Array(n);
  tan[0] = slope[0];
  tan[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    tan[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  for (let i = 0; i < n - 1; i += 1) {
    if (Math.abs(slope[i]) < 1e-6) {
      tan[i] = 0;
      tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / slope[i];
    const b = tan[i + 1] / slope[i];
    const hyp = a * a + b * b;
    if (hyp > 9) {
      const tau = 3 / Math.sqrt(hyp);
      tan[i] = tau * a * slope[i];
      tan[i + 1] = tau * b * slope[i];
    }
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i];
    ctx.bezierCurveTo(
      pts[i][0] + h / 3,
      pts[i][1] + (tan[i] * h) / 3,
      pts[i + 1][0] - h / 3,
      pts[i + 1][1] - (tan[i + 1] * h) / 3,
      pts[i + 1][0],
      pts[i + 1][1]
    );
  }
}

export type PlacedBar = { x: number; slot: number; o: number; h: number; l: number; c: number };

/** One candle loop. Callers supply pixel x and a price-to-y map. */
export function strokeCandles(
  ctx: CanvasRenderingContext2D,
  placed: readonly PlacedBar[],
  yOf: (price: number) => number,
  colors: CandleColors
) {
  for (let i = 0; i < placed.length; i += 1) {
    const bar = placed[i];
    const yH = yOf(bar.h);
    const yL = yOf(bar.l);
    const yO = yOf(bar.o);
    const yC = yOf(bar.c);
    if (!Number.isFinite(yH) || !Number.isFinite(yL) || !Number.isFinite(yO) || !Number.isFinite(yC)) continue;
    const up = bar.c >= bar.o;
    const color = up ? colors.up : colors.down;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bar.x, yH);
    ctx.lineTo(bar.x, yL);
    ctx.stroke();
    const top = Math.min(yO, yC);
    const bot = Math.max(yO, yC);
    const raw = bot - top;
    const flat = raw < 0.6 && Math.abs(yH - yL) < 2.5;
    const body = flat ? 1 : Math.max(1.25, raw);
    const bw = Math.max(1.5, Math.min(bar.slot * 0.56, 28));
    ctx.globalAlpha = flat ? 0.75 : 0.92;
    ctx.fillRect(bar.x - bw / 2, top, bw, body);
    ctx.globalAlpha = 1;
  }
}

function sizeCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 160;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, padX: number, padY: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  const plotH = Math.max(20, h - padY * 2);
  for (let i = 1; i <= 3; i += 1) {
    const y = padY + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
  }
}

export function paintCandles(canvas: HTMLCanvasElement, bars: readonly PaintBar[], pulse: number) {
  const sized = sizeCanvas(canvas);
  if (!sized || bars.length < 2) return;
  const { ctx, w, h } = sized;
  const shown = bars.length > 96 ? bars.slice(bars.length - 96) : bars;
  const eased = easeRightEdge(shown);
  let low = eased[0].l;
  let high = eased[0].h;
  for (let i = 1; i < eased.length; i += 1) {
    if (eased[i].l < low) low = eased[i].l;
    if (eased[i].h > high) high = eased[i].h;
  }
  const range = viewRange(low, high);
  const span = range.max - range.min || 1;
  const padX = 8;
  const padY = 12;
  const plotW = Math.max(20, w - padX * 2);
  const plotH = Math.max(20, h - padY * 2);
  const slot = plotW / eased.length;
  const yOf = (v: number) => padY + (1 - (v - range.min) / span) * plotH;
  drawGrid(ctx, w, h, padX, padY);
  const placed: PlacedBar[] = [];
  for (let i = 0; i < eased.length; i += 1) {
    const bar = eased[i];
    placed.push({ x: padX + (i + 0.5) * slot, slot, o: bar.o, h: bar.h, l: bar.l, c: bar.c });
  }
  strokeCandles(ctx, placed, yOf, candleColors(false));
  const last = eased[eased.length - 1];
  const lx = padX + (eased.length - 0.5) * slot;
  const ly = yOf(last.c);
  const up = last.c >= eased[0].o;
  ctx.beginPath();
  ctx.arc(lx, ly, 3 + pulse * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = up ? "rgba(61,220,151,0.22)" : "rgba(255,93,115,0.22)";
  ctx.fill();
}

export function paintLine(canvas: HTMLCanvasElement, values: readonly number[], pulse: number) {
  const sized = sizeCanvas(canvas);
  if (!sized || values.length < 2) return;
  const { ctx, w, h } = sized;
  const smooth = smoothCloses(values);
  let low = smooth[0];
  let high = smooth[0];
  for (let i = 1; i < smooth.length; i += 1) {
    if (smooth[i] < low) low = smooth[i];
    if (smooth[i] > high) high = smooth[i];
  }
  const range = viewRange(low, high);
  const span = range.max - range.min || 1;
  const padX = 8;
  const padY = 12;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < smooth.length; i += 1) {
    const x = padX + (i / (smooth.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (smooth[i] - range.min) / span) * (h - padY * 2);
    pts.push([x, y]);
  }
  const up = values[values.length - 1] >= values[0];
  const color = up ? CANDLE_UP : CANDLE_DOWN;
  drawGrid(ctx, w, h, padX, padY);
  strokeMonotone(ctx, pts);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.75;
  ctx.lineJoin = "round";
  ctx.stroke();
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], h - 4);
  ctx.lineTo(pts[0][0], h - 4);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, up ? "rgba(61,220,151,0.22)" : "rgba(255,93,115,0.2)");
  g.addColorStop(1, "rgba(61,220,151,0)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last[0], last[1], 3 + pulse * 2.4, 0, Math.PI * 2);
  ctx.fillStyle = up ? "rgba(61,220,151,0.25)" : "rgba(255,93,115,0.25)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last[0], last[1], 2.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
