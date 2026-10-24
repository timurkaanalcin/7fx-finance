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
