/**
 * Display-only open P&L. Does not touch the stored profit or the engine formula.
 * Run: npx tsx tests/display-profit.test.ts
 */
import assert from "node:assert/strict";
import { displayBookDelta, displayOpenProfit } from "../src/lib/display-profit";
import { positionMark } from "../src/lib/mark-price";

function main() {
  const base = { symbol: "AAPL", side: "BUY", volume: 1, openPrice: 100, currentPrice: 110, profit: 50 };
  assert.equal(displayOpenProfit(base, 110, 1), 50);
  assert.equal(displayOpenProfit(base, 120, 1), 100);
  assert.equal(displayOpenProfit(base, 105, 1), 25);
  assert.equal(displayOpenProfit({ ...base, side: "SELL", profit: -50 }, 120, 1), -100);

  const fresh = { side: "BUY", volume: 2, openPrice: 10, currentPrice: 10, profit: 0 };
  assert.equal(displayOpenProfit(fresh, 11, 5), 10);
  assert.equal(displayOpenProfit(fresh, 11), 0);
  assert.equal(displayOpenProfit(base, Number.NaN, 1), 50);

  const book = [
    base,
    { side: "SELL", volume: 1, openPrice: 100, currentPrice: 90, profit: 20, symbol: "EURUSD" },
  ];
  const delta = displayBookDelta(
    book,
    (position) => (position.side === "SELL" ? 80 : 120),
    () => 1
  );
  assert.equal(delta, 70);
  assert.equal(displayBookDelta([base], () => Number.NaN, () => 1), 0);

  const buy = { symbol: "AAPL", chartSymbol: null, side: "BUY", currentPrice: 10, openPrice: 9 };
  assert.equal(positionMark(buy, { AAPL: { bid: 12, ask: 13, mid: 12.5 } }), 12);
  const sell = { ...buy, side: "SELL", chartSymbol: "EURUSD" };
  assert.equal(positionMark({ ...sell, symbol: "MISSING" }, { EURUSD: { bid: 1.1, ask: 1.2, mid: 1.15 } }), 1.2);
  assert.equal(positionMark(buy, { AAPL: { bid: 0, ask: 0, mid: 4 } }), 4);
  assert.equal(positionMark(buy, {}), 10);

  console.log("display-profit tests passed");
}

main();
