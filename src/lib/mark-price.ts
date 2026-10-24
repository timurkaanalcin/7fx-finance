export type MarkTick = {
  bid: number;
  ask: number;
  mid: number;
};

/**
 * Live position mark shared by the blotter and the header chips.
 * Buy uses the bid, sell uses the ask, then mid, then the server snapshot.
 */
export function positionMark(
  position: {
    symbol: string;
    chartSymbol?: string | null;
    side: string;
    currentPrice: number;
    openPrice: number;
  },
  prices?: Record<string, MarkTick>
): number {
  const keys = [position.symbol, position.chartSymbol || ""];
  for (const key of keys) {
    if (!key || !prices) continue;
    const tick = prices[key] || prices[key.toUpperCase()];
    if (!tick) continue;
    const quote = String(position.side).toUpperCase() === "SELL" ? tick.ask : tick.bid;
    if (Number.isFinite(quote) && quote > 0) return quote;
    if (Number.isFinite(tick.mid) && tick.mid > 0) return tick.mid;
  }
  return Number.isFinite(position.currentPrice) && position.currentPrice > 0
    ? position.currentPrice
    : position.openPrice;
}
