/**
 * Client-side CRM draft sync: keep profit ↔ open/close prices consistent
 * with the trade-engine formula (base symbol contractSize).
 */
import { getSymbol } from "./symbols";
import {
  calcExitPriceForProfit,
  calcOpenPriceForProfit,
  calcTradeProfit,
  normalizeSide,
  type TradeSide,
} from "./pnl";

export type PositionEditDraft = {
  id: string;
  symbol: string;
  side: string;
  volume: string;
  openPrice: string;
  currentPrice: string;
  closePrice: string;
  profit: string;
  closeProfit: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string;
};

export type RecalcFrom = "profit" | "prices";

function contractSizeFor(symbol: string): number {
  return getSymbol(symbol.trim().toUpperCase())?.contractSize ?? 1;
}

function digitsFor(symbol: string): number {
  return getSymbol(symbol.trim().toUpperCase())?.digits ?? 5;
}

function fmtPrice(n: number, digits: number): string {
  if (!Number.isFinite(n)) return "";
  return n.toFixed(Math.max(0, Math.min(8, digits)));
}

function fmtProfit(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return (Math.round(n * 100) / 100).toFixed(2);
}

function parseSide(draft: PositionEditDraft): TradeSide {
  return normalizeSide(draft.side);
}

function markExit(draft: PositionEditDraft): number {
  if (draft.status === "CLOSED" && draft.closePrice !== "") {
    return Number(draft.closePrice);
  }
  return Number(draft.currentPrice);
}

/** When open / current / close / volume / side change → recompute profit. */
export function syncDraftFromPrices(draft: PositionEditDraft): PositionEditDraft {
  const side = parseSide(draft);
  const volume = Number(draft.volume);
  const open = Number(draft.openPrice);
  const exit = markExit(draft);
  const cs = contractSizeFor(draft.symbol);
  if (![volume, open, exit].every(Number.isFinite) || volume <= 0) return draft;
  const profit = calcTradeProfit(side, volume, open, exit, cs);
  const p = fmtProfit(profit);
  return {
    ...draft,
    profit: p,
    closeProfit: draft.status === "CLOSED" ? p : draft.closeProfit,
  };
}

/**
 * When profit (or realized) changes → solve openPrice (OPEN) or closePrice (CLOSED)
 * so engine PnL matches the typed amount.
 */
export function syncDraftFromProfit(
  draft: PositionEditDraft,
  source: "profit" | "closeProfit" = "profit"
): PositionEditDraft {
  const side = parseSide(draft);
  const volume = Number(draft.volume);
  const raw =
    source === "closeProfit" && draft.closeProfit !== ""
      ? Number(draft.closeProfit)
      : Number(draft.profit);
  const cs = contractSizeFor(draft.symbol);
  const digits = digitsFor(draft.symbol);
  if (![volume, raw].every(Number.isFinite) || volume <= 0) return draft;

  if (draft.status === "CLOSED") {
    const open = Number(draft.openPrice);
    if (!Number.isFinite(open) || open <= 0) return draft;
    const exit = calcExitPriceForProfit(side, volume, open, raw, cs);
    if (exit == null || exit < 0) return draft;
    const e = fmtPrice(exit, digits);
    const p = fmtProfit(raw);
    return {
      ...draft,
      closePrice: e,
      currentPrice: e,
      profit: p,
      closeProfit: p,
    };
  }

  const exit = Number(draft.currentPrice);
  if (!Number.isFinite(exit) || exit < 0) return draft;
  const open = calcOpenPriceForProfit(side, volume, exit, raw, cs);
  if (open == null || open <= 0) return draft;
  return {
    ...draft,
    openPrice: fmtPrice(open, digits),
    profit: fmtProfit(raw),
  };
}
