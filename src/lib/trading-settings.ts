/**
 * Admin-configurable trading rates: spreads, commission, contract/lot sizing, volume bounds.
 * Applied to order ticket pricing (bid/ask), margin, and P/L.
 */
import { prisma } from "./prisma";
import { SYMBOLS, getSymbol, type SymbolDef } from "./symbols";

export type TradingSettingsRow = {
  id: string;
  spreadMultiplier: number;
  commissionPerLot: number;
  defaultLeverage: number;
  marginCallThresholdPct: number;
  defaultMinVolume: number;
  defaultMaxVolume: number;
  defaultContractMult: number;
};

export type SymbolSettingsRow = {
  id: string;
  symbol: string;
  spreadAbs: number | null;
  spreadMultiplier: number | null;
  contractMultiplier: number | null;
  minVolume: number | null;
  maxVolume: number | null;
  commissionPerLot: number | null;
  enabled: boolean;
};

export type EffectiveSymbolRates = {
  symbol: string;
  enabled: boolean;
  /** Full bid↔ask spread in price units */
  spread: number;
  contractSize: number;
  minVolume: number;
  maxVolume: number;
  commissionPerLot: number;
  digits: number;
  pipSize: number;
  base: SymbolDef;
};

const DEFAULTS: TradingSettingsRow = {
  id: "default",
  spreadMultiplier: 1,
  commissionPerLot: 0,
  defaultLeverage: 100,
  marginCallThresholdPct: 50,
  defaultMinVolume: 0.01,
  defaultMaxVolume: 100,
  defaultContractMult: 1,
};

let cache: {
  at: number;
  global: TradingSettingsRow;
  bySymbol: Map<string, SymbolSettingsRow>;
} | null = null;

const TTL_MS = 5_000;

export function invalidateTradingSettingsCache() {
  cache = null;
}

export async function ensureTradingSettings(): Promise<TradingSettingsRow> {
  try {
    const row = await prisma.tradingSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { ...DEFAULTS },
    });
    return row;
  } catch {
    return { ...DEFAULTS };
  }
}

async function loadBundle() {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache;
  const [global, symbols] = await Promise.all([
    ensureTradingSettings(),
    prisma.symbolSettings.findMany().catch(() => [] as SymbolSettingsRow[]),
  ]);
  const bySymbol = new Map(symbols.map((s) => [s.symbol, s]));
  cache = { at: now, global, bySymbol };
  return cache;
}

export async function getTradingSettings(): Promise<TradingSettingsRow> {
  const b = await loadBundle();
  return b.global;
}

export async function getSymbolSettingsMap(): Promise<Map<string, SymbolSettingsRow>> {
  const b = await loadBundle();
  return b.bySymbol;
}

export async function getEffectiveRates(symbol: string): Promise<EffectiveSymbolRates | null> {
  const base = getSymbol(symbol);
  if (!base) return null;
  const { global, bySymbol } = await loadBundle();
  const ov = bySymbol.get(symbol);
  const enabled = ov?.enabled ?? true;
  const spreadMult = ov?.spreadMultiplier ?? global.spreadMultiplier;
  const spread =
    ov?.spreadAbs != null && Number.isFinite(ov.spreadAbs)
      ? ov.spreadAbs
      : base.spread * spreadMult;
  const contractMult = ov?.contractMultiplier ?? global.defaultContractMult;
  return {
    symbol,
    enabled,
    spread: Math.max(0, spread),
    contractSize: base.contractSize * Math.max(0.0001, contractMult),
    minVolume: ov?.minVolume ?? global.defaultMinVolume,
    maxVolume: ov?.maxVolume ?? global.defaultMaxVolume,
    commissionPerLot: ov?.commissionPerLot ?? global.commissionPerLot,
    digits: base.digits,
    pipSize: base.pipSize,
    base,
  };
}

export async function getAllEffectiveRates(): Promise<EffectiveSymbolRates[]> {
  const out: EffectiveSymbolRates[] = [];
  for (const s of SYMBOLS) {
    const r = await getEffectiveRates(s.symbol);
    if (r) out.push(r);
  }
  return out;
}

export function calcProfitWithRates(
  rates: EffectiveSymbolRates,
  side: "BUY" | "SELL",
  volume: number,
  openPrice: number,
  currentPrice: number
): number {
  const dir = side === "BUY" ? 1 : -1;
  const diff = (currentPrice - openPrice) * dir;
  return diff * rates.contractSize * volume;
}

export function calcMarginWithRates(
  rates: EffectiveSymbolRates,
  volume: number,
  price: number,
  leverage: number
): number {
  const lev = Math.max(1, leverage);
  return (volume * rates.contractSize * price) / lev;
}

export function calcCommission(rates: EffectiveSymbolRates, volume: number): number {
  return Math.max(0, rates.commissionPerLot) * volume;
}

/** Apply effective full spread around mid → bid/ask */
export function applySpread(mid: number, fullSpread: number): { bid: number; ask: number; mid: number } {
  const half = Math.max(0, fullSpread) / 2;
  return { bid: mid - half, ask: mid + half, mid };
}
