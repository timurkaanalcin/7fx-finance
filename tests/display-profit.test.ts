/**
 * Display-only open P&L. Does not touch the stored profit or the engine formula.
 * Run: npx tsx tests/display-profit.test.ts
 */
import assert from "node:assert/strict";
import { displayOpenProfit } from "../src/lib/display-profit";

function main() {
  const base = { side: "BUY", volume: 1, openPrice: 100, currentPrice: 110, profit: 50 };
  assert.equal(displayOpenProfit(base, 110, 1), 50);
  assert.equal(displayOpenProfit(base, 120, 1), 100);
  assert.equal(displayOpenProfit(base, 105, 1), 25);
  assert.equal(displayOpenProfit({ ...base, side: "SELL", profit: -50 }, 120, 1), -100);

  const fresh = { side: "BUY", volume: 2, openPrice: 10, currentPrice: 10, profit: 0 };
  assert.equal(displayOpenProfit(fresh, 11, 5), 10);
  assert.equal(displayOpenProfit(fresh, 11), 0);
  assert.equal(displayOpenProfit(base, Number.NaN, 1), 50);

  console.log("display-profit tests passed");
}

main();
