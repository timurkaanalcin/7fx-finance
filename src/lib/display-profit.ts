import { calcTradeProfit, normalizeSide } from "./pnl";

/**
 * On-screen open P&L at the live mark. Does not change the stored profit.
 * When the server snapshot already moved off the open price, scale that booked
 * profit by the live distance so admin contract size stays inside the number.
 * A fresh fill still at the open price uses the same calcTradeProfit with the
 * catalog contract size until the next snapshot has a price delta.
 */
export function displayOpenProfit(
  position: {
    side: string;
    volume: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
  },
  mark: number,
  contractSize?: number
): number {
  const stored = Number(position.profit);
  const safeStored = Number.isFinite(stored) ? stored : 0;
  const open = Number(position.openPrice);
  const current = Number(position.currentPrice);
  if (!Number.isFinite(mark) || !(mark > 0) || !Number.isFinite(open)) return safeStored;
  const serverMove = current - open;
  const liveMove = mark - open;
  const floor = Math.max(1e-8, Math.abs(open) * 1e-8);
  if (Number.isFinite(serverMove) && Math.abs(serverMove) > floor) {
    const scaled = safeStored * (liveMove / serverMove);
    return Number.isFinite(scaled) ? scaled : safeStored;
  }
  const size = Number(contractSize);
  const volume = Number(position.volume);
  if (Number.isFinite(size) && size > 0 && Number.isFinite(volume) && volume > 0) {
    return calcTradeProfit(normalizeSide(position.side), volume, open, mark, size);
  }
  return safeStored;
}

/**
 * Header Equity and P/L adjustment so those two chips match the blotter's
 * live marks. Margin, free margin, and the stored account snapshot stay put.
 */
export function displayBookDelta<
  T extends {
    symbol: string;
    side: string;
    volume: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
  },
>(
  positions: readonly T[],
  markFor: (position: T) => number,
  contractSizeFor?: (symbol: string) => number | undefined
): number {
  let delta = 0;
  for (const position of positions) {
    const stored = Number(position.profit);
    const safeStored = Number.isFinite(stored) ? stored : 0;
    const shown = displayOpenProfit(position, markFor(position), contractSizeFor?.(position.symbol));
    const part = shown - safeStored;
    if (Number.isFinite(part)) delta += part;
  }
  return delta;
}

/**
 * Header chips that stay in step with the live equity delta.
 * Free margin moves with equity because used margin is unchanged.
 * Margin level is equity / used margin, the same identity the server snapshot uses.
 * This does not write the account.
 */
export function displayAccountChips(
  account: { equity: number; freeMargin: number; margin: number; profitLoss: number },
  delta: number
): { equity: number; freeMargin: number; profitLoss: number; marginLevel: number } {
  const num = (value: number) => (Number.isFinite(value) ? value : 0);
  const shift = Number.isFinite(delta) ? delta : 0;
  const equity = num(account.equity) + shift;
  const freeMargin = num(account.freeMargin) + shift;
  const profitLoss = num(account.profitLoss) + shift;
  const margin = num(account.margin);
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  return { equity, freeMargin, profitLoss, marginLevel };
}
