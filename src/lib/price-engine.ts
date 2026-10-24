/**
 * Market price facade — real Yahoo Finance quotes/OHLCV.
 * Bid/ask use admin-configurable effective spreads.
 */
import { SYMBOLS, getSymbol } from "./symbols";
import { fetchOhlc, fetchQuotesBatch } from "./yahoo";
import { publicErrorText } from "@/lib/security/public-error";
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
  const ticks = await getPrices([symbol]);
  return ticks.get(symbol);
}

/**
 * One quote snapshot for many symbols. Same bid/ask rules as getPrice.
 * Callers that loop fills or SL/TP use this so Yahoo is hit per symbol, not per row.
 */
export async function getPrices(
  symbols: string[],
  opts?: { liveOnly?: boolean }
): Promise<Map<string, Tick>> {
  await ensureSymbolCatalog();
  const wanted: string[] = [];
  const seen = new Set<string>();
  for (const symbol of symbols) {
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    wanted.push(symbol);
  }

  const pairs: { symbol: string; yahoo: string }[] = [];
  const queued = new Set<string>();
  const ready: { key: string; catalog: string }[] = [];
  for (const symbol of wanted) {
    const def = getSymbol(symbol);
    if (!def) continue;
    const rates = await getEffectiveRates(symbol);
    if (rates && !rates.enabled) continue;
    ready.push({ key: symbol, catalog: def.symbol });
    if (queued.has(def.symbol)) continue;
    queued.add(def.symbol);
    pairs.push({ symbol: def.symbol, yahoo: def.yahoo });
  }

  const { quotes } = await fetchQuotesBatch(pairs);
  const byCatalog = new Map(quotes.map((q) => [q.symbol, q]));
  const out = new Map<string, Tick>();
  for (const row of ready) {
    const quote = byCatalog.get(row.catalog);
    if (quote) {
      out.set(row.key, await tickFromQuote(row.key, quote.price, quote.change, quote.changePct, quote.ts));
      continue;
    }
    // Catalog base prices are not a live feed. Callers that pass liveOnly leave the symbol out.
    if (opts?.liveOnly) continue;
    const fallback = await fallbackTick(row.key);
    if (fallback) out.set(row.key, fallback);
  }
  return out;
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
    error: result.error ? publicErrorText(result.error, "Quote unavailable") : undefined,
    stale: result.stale,
  };
}

/** Kept for call-site compatibility; real fetch happens in getPrice/tickAll. */
export async function ensureTicked() {
  // no-op: quotes are fetched on demand with short TTL cache
}
