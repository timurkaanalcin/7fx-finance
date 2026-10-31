/** Pure helpers for CRM v4 round 22. Conversion is display only. */

export type FxPair = { code: string; symbol: string; usdPerUnit: boolean; mid: number | null };

export const FX_PAIRS: { code: string; symbol: string; usdPerUnit: boolean }[] = [
  { code: "TRY", symbol: "USDTRY", usdPerUnit: false },
  { code: "EUR", symbol: "EURUSD", usdPerUnit: true },
  { code: "GBP", symbol: "GBPUSD", usdPerUnit: true },
  { code: "JPY", symbol: "USDJPY", usdPerUnit: false },
];

export function withMids(quotes: { symbol?: string | null; mid?: number | null; bid?: number | null }[]): FxPair[] {
  return FX_PAIRS.map((pair) => {
    const hit = quotes.find((row) => String(row.symbol || "").toUpperCase() === pair.symbol);
    const mid = Number(hit?.mid || hit?.bid || 0);
    return { ...pair, mid: mid > 0 ? mid : null };
  });
}

export function toUsd(amount: number, code: string, pairs: FxPair[]): number | null {
  if (!Number.isFinite(amount)) return null;
  if (code === "USD") return amount;
  const pair = pairs.find((row) => row.code === code);
  if (!pair || pair.mid == null) return null;
  return pair.usdPerUnit ? amount * pair.mid : amount / pair.mid;
}

export function fromUsd(amount: number, code: string, pairs: FxPair[]): number | null {
  if (!Number.isFinite(amount)) return null;
  if (code === "USD") return amount;
  const pair = pairs.find((row) => row.code === code);
  if (!pair || pair.mid == null) return null;
  return pair.usdPerUnit ? amount / pair.mid : amount * pair.mid;
}

export function convert(amount: number, from: string, to: string, pairs: FxPair[]): number | null {
  const usd = toUsd(amount, from, pairs);
  if (usd == null) return null;
  const out = fromUsd(usd, to, pairs);
  if (out == null) return null;
  return Math.round(out * 100) / 100;
}

export type MixRow = { currency: string; count: number; total: number };

export function currencyMix(rows: { currency?: string | null; amount?: number | null }[]): MixRow[] {
  const map = new Map<string, MixRow>();
  for (const row of rows) {
    const currency = String(row.currency || "USD");
    const current = map.get(currency) || { currency, count: 0, total: 0 };
    current.count += 1;
    current.total += Math.abs(Number(row.amount) || 0);
    map.set(currency, current);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total || a.currency.localeCompare(b.currency));
}

export function largestCurrency(rows: MixRow[]): string {
  return rows[0]?.currency || "";
}
