/**
 * Admin-configurable trading rates: spreads, commission, contract/lot sizing, volume bounds.
 * Applied to order ticket pricing (bid/ask), margin, and P/L.
 */
import { prisma } from "./prisma";
import {
  BUILTIN_SYMBOLS,
  SYMBOLS,
  getSymbol,
  replaceSymbolCatalog,
  type AssetClass,
  type SymbolDef,
} from "./symbols";
import {
  calcExitPriceForProfit,
  calcOpenPriceForProfit,
  calcTradeProfit,
  type TradeSide,
} from "./pnl";

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
  name?: string | null;
  assetClass?: string | null;
  digits?: number | null;
  pipSize?: number | null;
  contractSize?: number | null;
  basePrice?: number | null;
  volumeStep?: number | null;
  yahoo?: string | null;
  flag?: string | null;
  isCustom?: boolean;
  deleted?: boolean;
};

export type EffectiveSymbolRates = {
  symbol: string;
  enabled: boolean;
  /** Full bid↔ask spread in price units */
  spread: number;
  contractSize: number;
  minVolume: number;
  maxVolume: number;
  /** Lot step; null = no step enforcement */
  volumeStep: number | null;
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

type Bundle = {
  at: number;
  global: TradingSettingsRow;
  bySymbol: Map<string, SymbolSettingsRow>;
};

// Lives on globalThis so every server bundle shares one cache and one invalidation.
const store = globalThis as unknown as { __7fxRatesCache?: Bundle | null; __7fxRatesLoading?: Promise<Bundle> | null };

const TTL_MS = 5_000;

export const ASSET_CLASSES: AssetClass[] = ["STOCK", "FX", "CRYPTO", "INDEX", "COMMODITY"];

/** Drop the rates + symbol-catalog cache (call after any SymbolSettings / TradingSettings write). */
export function invalidateTradingSettingsCache() {
  store.__7fxRatesCache = null;
}

function finiteOr<T>(v: number | null | undefined, fallback: T): number | T {
  return v != null && Number.isFinite(v) ? v : fallback;
}

/** Merge built-ins with DB catalog overrides + admin-created symbols. */
export function buildSymbolCatalog(rows: SymbolSettingsRow[]): SymbolDef[] {
  const byS = new Map(rows.map((r) => [r.symbol, r]));
  const out: SymbolDef[] = [];
  for (const b of BUILTIN_SYMBOLS) {
    const r = byS.get(b.symbol);
    if (r?.deleted) continue;
    out.push(r ? mergeDef(b, r) : { ...b });
  }
  const builtinSet = new Set(BUILTIN_SYMBOLS.map((b) => b.symbol));
  for (const r of rows) {
    if (builtinSet.has(r.symbol) || r.deleted || !r.isCustom) continue;
    const base: SymbolDef = {
      symbol: r.symbol,
      name: r.name || r.symbol,
      class: "FX",
      digits: 5,
      pipSize: 0.0001,
      contractSize: 1,
      basePrice: 0,
      spread: 0,
      yahoo: r.symbol,
      custom: true,
    };
    out.push({ ...mergeDef(base, r), custom: true });
  }
  return out;
}

function mergeDef(b: SymbolDef, r: SymbolSettingsRow): SymbolDef {
  const cls = r.assetClass && (ASSET_CLASSES as string[]).includes(r.assetClass) ? (r.assetClass as AssetClass) : b.class;
  const def: SymbolDef = {
    ...b,
    name: r.name?.trim() || b.name,
    class: cls,
    digits: r.digits != null && Number.isFinite(r.digits) ? Math.max(0, Math.min(10, Math.round(r.digits))) : b.digits,
    pipSize: finiteOr(r.pipSize, b.pipSize) as number,
    contractSize: finiteOr(r.contractSize, b.contractSize) as number,
    basePrice: finiteOr(r.basePrice, b.basePrice) as number,
    spread: b.custom || r.isCustom ? (finiteOr(r.spreadAbs, b.spread) as number) : b.spread,
    yahoo: r.yahoo?.trim() || b.yahoo,
    flag: r.flag != null && r.flag !== "" ? r.flag : b.flag,
  };
  if (r.volumeStep != null && Number.isFinite(r.volumeStep) && r.volumeStep > 0) def.volumeStep = r.volumeStep;
  else delete def.volumeStep;
  return def;
}

async function loadBundle(): Promise<Bundle> {
  const now = Date.now();
  const cached = store.__7fxRatesCache;
  if (cached && now - cached.at < TTL_MS) return cached;
  if (store.__7fxRatesLoading) return store.__7fxRatesLoading;
  const p = (async () => {
    const [global, symbols] = await Promise.all([
      ensureTradingSettings(),
      prisma.symbolSettings.findMany().catch(() => null as SymbolSettingsRow[] | null),
    ]);
    const rows = symbols ?? [];
    // Only rebuild the live catalog when the DB read succeeded (keep last good catalog otherwise).
    if (symbols) replaceSymbolCatalog(buildSymbolCatalog(rows));
    const bySymbol = new Map(rows.map((s) => [s.symbol, s]));
    const bundle: Bundle = { at: Date.now(), global, bySymbol };
    store.__7fxRatesCache = bundle;
    return bundle;
  })();
  store.__7fxRatesLoading = p;
  try {
    return await p;
  } finally {
    store.__7fxRatesLoading = null;
  }
}

/** Make sure the live symbol catalog (SYMBOLS / getSymbol) reflects the DB (≤ 5 s stale). */
export async function ensureSymbolCatalog(force = false) {
  if (force) invalidateTradingSettingsCache();
  await loadBundle();
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

export async function getTradingSettings(): Promise<TradingSettingsRow> {
  const b = await loadBundle();
  return b.global;
}

export async function getSymbolSettingsMap(): Promise<Map<string, SymbolSettingsRow>> {
  const b = await loadBundle();
  return b.bySymbol;
}

export async function getEffectiveRates(symbol: string): Promise<EffectiveSymbolRates | null> {
  const { global, bySymbol } = await loadBundle();
  const base = getSymbol(symbol);
  if (!base) return null;
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
    volumeStep: base.volumeStep && base.volumeStep > 0 ? base.volumeStep : null,
    commissionPerLot: ov?.commissionPerLot ?? global.commissionPerLot,
    digits: base.digits,
    pipSize: base.pipSize,
    base,
  };
}

export async function getAllEffectiveRates(): Promise<EffectiveSymbolRates[]> {
  await loadBundle();
  const out: EffectiveSymbolRates[] = [];
  for (const s of [...SYMBOLS]) {
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
  return calcTradeProfit(side, volume, openPrice, currentPrice, rates.contractSize);
}

export function calcOpenPriceWithRates(
  rates: EffectiveSymbolRates,
  side: TradeSide,
  volume: number,
  exitPrice: number,
  profit: number
): number | null {
  return calcOpenPriceForProfit(side, volume, exitPrice, profit, rates.contractSize);
}

export function calcExitPriceWithRates(
  rates: EffectiveSymbolRates,
  side: TradeSide,
  volume: number,
  openPrice: number,
  profit: number
): number | null {
  return calcExitPriceForProfit(side, volume, openPrice, profit, rates.contractSize);
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
