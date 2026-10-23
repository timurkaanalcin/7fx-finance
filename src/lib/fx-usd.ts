/**
 * Convert staff-entered amounts into the USD trading balance.
 * Account.balance is USD. A TRY (or other non-USD) deposit must not be posted 1:1.
 *
 * Primary quotes come from the same Yahoo feed the terminal already uses (USDTRY = TRY=X).
 * If Yahoo is down, fall back to open.er-api.com (units of currency per 1 USD), cached briefly.
 */
import { fetchQuoteFromChart } from "./yahoo";

const CACHE_MS = 60_000;

/** Yahoo price is "USD per 1 unit" (multiply) or "units per 1 USD" (divide). */
const YAHOO: Record<string, { pair: string; yahoo: string; usdPerUnit: boolean; digits: number }> = {
  EUR: { pair: "EURUSD", yahoo: "EURUSD=X", usdPerUnit: true, digits: 5 },
  GBP: { pair: "GBPUSD", yahoo: "GBPUSD=X", usdPerUnit: true, digits: 5 },
  AUD: { pair: "AUDUSD", yahoo: "AUDUSD=X", usdPerUnit: true, digits: 5 },
  TRY: { pair: "USDTRY", yahoo: "TRY=X", usdPerUnit: false, digits: 4 },
  JPY: { pair: "USDJPY", yahoo: "USDJPY=X", usdPerUnit: false, digits: 3 },
  CAD: { pair: "USDCAD", yahoo: "USDCAD=X", usdPerUnit: false, digits: 5 },
  CHF: { pair: "USDCHF", yahoo: "USDCHF=X", usdPerUnit: false, digits: 5 },
};

export class FxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FxError";
  }
}

export type UsdConversion = {
  sourceAmount: number;
  sourceCurrency: string;
  /** Signed USD amount posted to Account.balance (2 decimals when converted). */
  usdAmount: number;
  /** Market quote actually used (Yahoo-style: EURUSD or USDTRY). */
  quote: number;
  pair: string;
  source: "identity" | "yahoo" | "er-api";
};

type CacheEntry = {
  expires: number;
  unitsPerUsd: number;
  quote: number;
  pair: string;
  source: UsdConversion["source"];
  /** Full USD-based table from the er-api fallback, cached once per TTL. */
  rates?: Record<string, number>;
};
const cache = new Map<string, CacheEntry>();

/** Test hook. Pass null to restore live quotes. */
let quoteOverride: ((currency: string) => { unitsPerUsd: number; quote: number; pair: string } | null) | null = null;
export function setFxQuoteOverrideForTests(
  fn: ((currency: string) => { unitsPerUsd: number; quote: number; pair: string } | null) | null
) {
  quoteOverride = fn;
  cache.clear();
}

export function roundUsd(n: number): number {
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(n) * 100)) / 100;
}

export function fmtFxAmount(n: number): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Human-readable ledger note. Empty when the source amount is already USD. */
export function fxLedgerNote(c: UsdConversion): string {
  if (c.sourceCurrency === "USD" || c.source === "identity") return "";
  const digits = YAHOO[c.sourceCurrency]?.digits ?? 4;
  return `${fmtFxAmount(c.sourceAmount)} ${c.sourceCurrency} = ${fmtFxAmount(c.usdAmount)} USD @ ${c.quote.toFixed(digits)} ${c.pair} (${c.source})`;
}

function withNote(base: string | null | undefined, conv: UsdConversion): string {
  const note = fxLedgerNote(conv);
  const head = String(base || "").trim();
  if (!note) return head;
  if (!head) return note;
  if (head.includes(note)) return head;
  return `${head} · ${note}`.slice(0, 2000);
}

export function appendFxNote(base: string | null | undefined, conv: UsdConversion): string {
  return withNote(base, conv);
}

async function unitsFromYahoo(currency: string): Promise<CacheEntry | null> {
  const spec = YAHOO[currency];
  if (!spec) return null;
  const q = await fetchQuoteFromChart(spec.pair, spec.yahoo);
  const price = q.quote?.price;
  if (!price || !Number.isFinite(price) || price <= 0) return null;
  const unitsPerUsd = spec.usdPerUnit ? 1 / price : price;
  return {
    expires: Date.now() + CACHE_MS,
    unitsPerUsd,
    quote: price,
    pair: spec.pair,
    source: "yahoo",
  };
}

async function unitsFromErApi(currency: string): Promise<CacheEntry | null> {
  const cachedAll = cache.get("er-api:USD");
  let rates: Record<string, number> | null = null;
  if (cachedAll && cachedAll.expires > Date.now()) {
    rates = cachedAll.rates ?? null;
  }
  if (!rates) {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (body.result !== "success" || !body.rates) return null;
    rates = body.rates;
    const entry = {
      expires: Date.now() + CACHE_MS,
      unitsPerUsd: 1,
      quote: 1,
      pair: "USD",
      source: "er-api" as const,
      rates,
    };
    cache.set("er-api:USD", entry);
  }
  const units = rates[currency];
  if (!units || !Number.isFinite(units) || units <= 0) return null;
  return {
    expires: Date.now() + CACHE_MS,
    unitsPerUsd: units,
    quote: units,
    pair: `USD${currency}`,
    source: "er-api",
  };
}

async function lookup(currency: string): Promise<CacheEntry> {
  const hit = cache.get(currency);
  if (hit && hit.expires > Date.now()) return hit;
  if (quoteOverride) {
    const o = quoteOverride(currency);
    if (!o || !(o.unitsPerUsd > 0)) throw new FxError(`No test quote for ${currency}`);
    const entry: CacheEntry = { expires: Date.now() + CACHE_MS, ...o, source: "yahoo" };
    cache.set(currency, entry);
    return entry;
  }
  const yahoo = await unitsFromYahoo(currency).catch(() => null);
  const entry = yahoo || (await unitsFromErApi(currency).catch(() => null));
  if (!entry) {
    throw new FxError(`Could not load a live USD rate for ${currency}. The balance was not changed.`);
  }
  cache.set(currency, entry);
  return entry;
}

/**
 * Convert a signed amount in `currency` into USD.
 * USD is returned unchanged (no rounding) so existing USD credits stay exact.
 */
export async function convertAmountToUsd(amount: number, currency: string | null | undefined): Promise<UsdConversion> {
  if (!Number.isFinite(amount)) throw new FxError("Amount is not a number");
  const cur = String(currency || "USD").trim().toUpperCase();
  if (cur === "USD") {
    return {
      sourceAmount: amount,
      sourceCurrency: "USD",
      usdAmount: amount,
      quote: 1,
      pair: "USD",
      source: "identity",
    };
  }
  if (!YAHOO[cur]) {
    throw new FxError(`Unsupported currency ${cur}. The balance was not changed.`);
  }
  const q = await lookup(cur);
  const usdAmount = roundUsd(amount / q.unitsPerUsd);
  return {
    sourceAmount: amount,
    sourceCurrency: cur,
    usdAmount,
    quote: q.quote,
    pair: q.pair,
    source: q.source,
  };
}
