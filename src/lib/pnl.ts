/**
 * Trade-engine PnL: volume × contractSize × price delta (BUY/SELL).
 * Shared by terminal refresh, CRM edit form, and admin PATCH.
 */

export type TradeSide = "BUY" | "SELL";

function dir(side: TradeSide): 1 | -1 {
  return side === "BUY" ? 1 : -1;
}

/** Floating / realized profit from open → exit. */
export function calcTradeProfit(
  side: TradeSide,
  volume: number,
  openPrice: number,
  exitPrice: number,
  contractSize: number
): number {
  return (exitPrice - openPrice) * dir(side) * contractSize * volume;
}

/**
 * Solve openPrice so that PnL equals `profit` at the given exit (mark/close).
 * open = exit − dir × profit / (contractSize × volume)
 */
export function calcOpenPriceForProfit(
  side: TradeSide,
  volume: number,
  exitPrice: number,
  profit: number,
  contractSize: number
): number | null {
  const notional = contractSize * volume;
  if (
    !Number.isFinite(notional) ||
    notional === 0 ||
    !Number.isFinite(exitPrice) ||
    !Number.isFinite(profit)
  ) {
    return null;
  }
  return exitPrice - (dir(side) * profit) / notional;
}

/**
 * Solve exit (current/close) so that PnL equals `profit` at the given open.
 * exit = open + dir × profit / (contractSize × volume)
 */
export function calcExitPriceForProfit(
  side: TradeSide,
  volume: number,
  openPrice: number,
  profit: number,
  contractSize: number
): number | null {
  const notional = contractSize * volume;
  if (
    !Number.isFinite(notional) ||
    notional === 0 ||
    !Number.isFinite(openPrice) ||
    !Number.isFinite(profit)
  ) {
    return null;
  }
  return openPrice + (dir(side) * profit) / notional;
}

export function normalizeSide(side: unknown): TradeSide {
  return String(side ?? "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY";
}
