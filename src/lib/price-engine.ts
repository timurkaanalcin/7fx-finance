/**
 * Market price facade — real Yahoo Finance quotes/OHLCV.
 * Bid/ask use admin-configurable effective spreads.
 */
import { SYMBOLS, getSymbol } from "./symbols";
import { fetchOhlc, fetchQuoteFromChart, fetchQuotesBatch } from "./yahoo";
import { applySpread, ensureSymbolCatalog, getEffectiveRates } from "./trading-settings";

export type Tick = {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  change: number;
  changePct: number;
  ts: number;
  spread?: number;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

async function tickFromQuote(
  symbol: string,
  mid: number,
  change: number,
  changePct: number,
  ts: number
): Promise<Tick> {
  const rates = await getEffectiveRates(symbol);
  const full = rates?.spread ?? getSymbol(symbol)?.spread ?? 0;
  const { bid, ask } = applySpread(mid, full);
  return {
    symbol,
    bid,
    ask,
    mid,
    change,
    changePct,
    ts,
    spread: full,
  };
}

async function fallbackTick(symbol: string): Promise<Tick | undefined> {
  const def = getSymbol(symbol);
  // No live quote and no usable fallback price (e.g. new custom symbol) → no tick.
  if (!def || !(def.basePrice > 0)) return undefined;
  return tickFromQuote(symbol, def.basePrice, 0, 0, Date.now());
}

/** Refresh all symbol quotes from Yahoo (cached briefly server-side). */
export async function tickAll(): Promise<Tick[]> {
  await ensureSymbolCatalog(); // refresh the live (admin-editable) symbol catalog, cached ≤ 5 s
  const catalog = [...SYMBOLS];
  const pairs = catalog.map((s) => ({ symbol: s.symbol, yahoo: s.yahoo }));
  const { quotes } = await fetchQuotesBatch(pairs);
  const bySym = new Map(quotes.map((q) => [q.symbol, q]));
  const ticks: Tick[] = [];
  for (const def of catalog) {
    const rates = await getEffectiveRates(def.symbol);
    if (rates && !rates.enabled) continue;
    const q = bySym.get(def.symbol);
    if (q) {
      ticks.push(await tickFromQuote(def.symbol, q.price, q.change, q.changePct, q.ts));
    } else {
      const fb = await fallbackTick(def.symbol);
      if (fb) ticks.push(fb);
    }
  }
  return ticks;
}

export async function getTicks(): Promise<Tick[]> {
  return tickAll();
}

export async function getPrice(symbol: string): Promise<Tick | undefined> {
  await ensureSymbolCatalog();
  const def = getSymbol(symbol);
  if (!def) return undefined;
  const rates = await getEffectiveRates(symbol);
  if (rates && !rates.enabled) return undefined;
  const { quote } = await fetchQuoteFromChart(def.symbol, def.yahoo);
  if (quote) {
    return tickFromQuote(symbol, quote.price, quote.change, quote.changePct, quote.ts);
  }
  return fallbackTick(symbol);
}

export async function getCandles(symbol: string, timeframe: string): Promise<{
  candles: Candle[];
  error?: string;
  stale?: boolean;
}> {
  await ensureSymbolCatalog();
  const def = getSymbol(symbol);
  if (!def) return { candles: [], error: "Unknown symbol" };
  const result = await fetchOhlc(def.yahoo, timeframe);
  return {
    candles: result.candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })),
    error: result.error,
    stale: result.stale,
  };
}

/** Kept for call-site compatibility; real fetch happens in getPrice/tickAll. */
export async function ensureTicked() {
  // no-op: quotes are fetched on demand with short TTL cache
}
