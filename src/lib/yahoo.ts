/**
 * Yahoo Finance chart API proxy helpers (no API key).
 * Server-side only — brief in-memory cache to avoid rate limits.
 */

export type YahooCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type YahooQuote = {
  symbol: string;
  yahoo: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  ts: number;
};

type CacheEntry<T> = { expires: number; value: T; error?: string };

const quoteCache = new Map<string, CacheEntry<YahooQuote>>();
const ohlcCache = new Map<string, CacheEntry<YahooCandle[]>>();

const QUOTE_TTL_MS = 750;
const OHLC_TTL_MS = 20_000;
const YAHOO_UA =
  "Mozilla/5.0 (compatible; M1FinanceDemo/1.0; +https://deskflow-trade.netlify.app)";

/** Map app timeframe → Yahoo interval + range */
export function mapTimeframe(tf: string): { interval: string; range: string } {
  switch (tf) {
    case "1m":
      return { interval: "1m", range: "1d" };
    case "5m":
      return { interval: "5m", range: "5d" };
    case "15m":
      return { interval: "15m", range: "5d" };
    case "1h":
      return { interval: "60m", range: "1mo" };
    case "4h":
      // Yahoo has no native 4h; fetch 60m and aggregate
      return { interval: "60m", range: "3mo" };
    case "1D":
      return { interval: "1d", range: "1y" };
    case "1W":
      return { interval: "1wk", range: "5y" };
    default:
      return { interval: "5m", range: "5d" };
  }
}

function aggregateTo4h(candles: YahooCandle[]): YahooCandle[] {
  const buckets = new Map<number, YahooCandle>();
  const sec = 14400;
  for (const c of candles) {
    const t = Math.floor(c.time / sec) * sec;
    const existing = buckets.get(t);
    if (!existing) {
      buckets.set(t, { ...c, time: t });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
      if (c.volume != null) existing.volume = (existing.volume || 0) + c.volume;
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
}


function timeframeStepSec(tf: string): number {
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

/** Bucket intraday Yahoo stamps so live series.update() never goes backwards. */
function alignOhlcTime(time: number, timeframe: string): number {
  if (timeframe === "1D" || timeframe === "1W") return time;
  const step = timeframeStepSec(timeframe);
  return Math.floor(time / step) * step;
}

function dedupeAligned(candles: YahooCandle[]): YahooCandle[] {
  const map = new Map<number, YahooCandle>();
  for (const c of candles) {
    const prev = map.get(c.time);
    if (!prev) map.set(c.time, c);
    else {
      map.set(c.time, {
        time: c.time,
        open: prev.open,
        high: Math.max(prev.high, c.high),
        low: Math.min(prev.low, c.low),
        close: c.close,
        volume: c.volume != null || prev.volume != null ? (prev.volume || 0) + (c.volume || 0) : undefined,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

async function fetchYahooChart(yahooTicker: string, interval: string, range: string) {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}`
  );
  url.searchParams.set("interval", interval);
  url.searchParams.set("range", range);
  url.searchParams.set("includePrePost", "false");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": YAHOO_UA,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Yahoo HTTP ${res.status} for ${yahooTicker}`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    const err = json?.chart?.error?.description || "No chart result";
    throw new Error(err);
  }
  return result;
}

export async function fetchOhlc(
  yahooTicker: string,
  timeframe: string
): Promise<{ candles: YahooCandle[]; error?: string; stale?: boolean }> {
  const cacheKey = `${yahooTicker}|${timeframe}`;
  const cached = ohlcCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return { candles: cached.value, error: cached.error, stale: !!cached.error };
  }

  try {
    const { interval, range } = mapTimeframe(timeframe);
    const result = await fetchYahooChart(yahooTicker, interval, range);
    const ts: number[] = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const opens: (number | null)[] = q.open || [];
    const highs: (number | null)[] = q.high || [];
    const lows: (number | null)[] = q.low || [];
    const closes: (number | null)[] = q.close || [];
    const volumes: (number | null)[] = q.volume || [];

    let candles: YahooCandle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      if (o == null || h == null || l == null || c == null) continue;
      if (![o, h, l, c].every((n) => Number.isFinite(n))) continue;
      candles.push({
        time: ts[i],
        open: o,
        high: h,
        low: l,
        close: c,
        volume: volumes[i] ?? undefined,
      });
    }

    if (timeframe === "4h") {
      candles = aggregateTo4h(candles);
    }

    candles = dedupeAligned(
      candles.map((c) => ({ ...c, time: alignOhlcTime(c.time, timeframe) }))
    );

    ohlcCache.set(cacheKey, {
      expires: Date.now() + OHLC_TTL_MS,
      value: candles,
    });
    return { candles };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yahoo OHLC failed";
    if (cached?.value?.length) {
      ohlcCache.set(cacheKey, {
        expires: Date.now() + Math.min(OHLC_TTL_MS, 15_000),
        value: cached.value,
        error: msg,
      });
      return { candles: cached.value, error: msg, stale: true };
    }
    return { candles: [], error: msg };
  }
}

/** Derive a quote from chart meta (works for FX/futures/indices/crypto/stocks). */
export async function fetchQuoteFromChart(
  internalSymbol: string,
  yahooTicker: string
): Promise<{ quote?: YahooQuote; error?: string; stale?: boolean }> {
  const cached = quoteCache.get(internalSymbol);
  if (cached && cached.expires > Date.now()) {
    return { quote: cached.value, error: cached.error, stale: !!cached.error };
  }

  try {
    // Prefer 1m chart meta — regularMarketPrice updates more often during RTH/crypto
    // than a daily chart, so forming candles can track live mid ≤1s.
    let result;
    try {
      result = await fetchYahooChart(yahooTicker, "1m", "1d");
    } catch {
      result = await fetchYahooChart(yahooTicker, "1d", "5d");
    }
    const meta = result.meta || {};
    const quote0 = result.indicators?.quote?.[0];
    const closes: (number | null)[] = quote0?.close || [];
    let lastClose = 0;
    for (let i = closes.length - 1; i >= 0; i--) {
      const c = closes[i];
      if (c != null && Number.isFinite(c) && c > 0) {
        lastClose = c;
        break;
      }
    }
    const price =
      Number(meta.regularMarketPrice) ||
      lastClose ||
      Number(meta.chartPreviousClose) ||
      0;
    const previousClose =
      Number(meta.chartPreviousClose) ||
      Number(meta.previousClose) ||
      price;
    if (!price || !Number.isFinite(price)) {
      throw new Error(`No price for ${yahooTicker}`);
    }
    const change = price - previousClose;
    const changePct = previousClose ? (change / previousClose) * 100 : 0;
    const quote: YahooQuote = {
      symbol: internalSymbol,
      yahoo: yahooTicker,
      price,
      previousClose,
      change,
      changePct,
      ts: Date.now(),
    };
    quoteCache.set(internalSymbol, {
      expires: Date.now() + QUOTE_TTL_MS,
      value: quote,
    });
    return { quote };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yahoo quote failed";
    if (cached?.value) {
      quoteCache.set(internalSymbol, {
        expires: Date.now() + Math.min(QUOTE_TTL_MS, 5_000),
        value: cached.value,
        error: msg,
      });
      return { quote: cached.value, error: msg, stale: true };
    }
    return { error: msg };
  }
}

/** Batch quotes with limited concurrency to stay friendly to Yahoo. */
export async function fetchQuotesBatch(
  pairs: { symbol: string; yahoo: string }[]
): Promise<{ quotes: YahooQuote[]; errors: string[] }> {
  const quotes: YahooQuote[] = [];
  const errors: string[] = [];
  const concurrency = 8;
  for (let i = 0; i < pairs.length; i += concurrency) {
    const chunk = pairs.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map((p) => fetchQuoteFromChart(p.symbol, p.yahoo))
    );
    for (const r of results) {
      if (r.quote) quotes.push(r.quote);
      if (r.error) errors.push(r.error);
    }
  }
  return { quotes, errors };
}
