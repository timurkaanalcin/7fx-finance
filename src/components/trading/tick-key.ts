type Tick = { bid?: number; ask?: number; mid?: number };
type Row = { id: string; symbol: string; chartSymbol?: string | null };

/** Stable key of the quotes a set of rows actually displays. Unrelated ticks do not change it. */
export function positionTickKey(rows: readonly Row[], prices: Record<string, Tick | undefined>): string {
  let out = "";
  for (const row of rows) {
    const tick = prices[row.symbol] || (row.chartSymbol ? prices[row.chartSymbol] : undefined);
    out += row.id;
    out += ":";
    out += tick?.bid ?? "";
    out += ":";
    out += tick?.ask ?? "";
    out += ":";
    out += tick?.mid ?? "";
    out += "|";
  }
  return out;
}
