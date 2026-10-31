/**
 * CRM v4 round 22 helpers.
 * Run: npx tsx tests/crmv4-round22.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { convert, currencyMix, largestCurrency, toUsd, withMids } from "../src/lib/crmv4/round22";

function main() {
  const pairs = withMids([
    { symbol: "USDTRY", mid: 40 },
    { symbol: "EURUSD", bid: 1.1 },
    { symbol: "GBPUSD", mid: 0 },
  ]);
  assert.equal(pairs.find((row) => row.code === "TRY")?.mid, 40);
  assert.equal(pairs.find((row) => row.code === "EUR")?.mid, 1.1);
  assert.equal(pairs.find((row) => row.code === "GBP")?.mid, null);
  assert.equal(pairs.find((row) => row.code === "JPY")?.mid, null);
  assert.equal(toUsd(100, "USD", pairs), 100);
  assert.equal(convert(100, "USD", "TRY", pairs), 4000);
  assert.equal(convert(100, "TRY", "USD", pairs), 2.5);
  assert.equal(convert(10, "EUR", "USD", pairs), 11);
  assert.equal(convert(11, "USD", "EUR", pairs), 10);
  assert.equal(convert(10, "GBP", "USD", pairs), null);
  const mix = currencyMix([{ currency: "USD", amount: 10 }, { currency: "TRY", amount: 5 }, { currency: "USD", amount: 3 }]);
  assert.equal(mix[0].currency, "USD");
  assert.equal(mix[0].count, 2);
  assert.equal(mix[0].total, 13);
  assert.equal(largestCurrency(mix), "USD");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fx-desk/);
  assert.match(css, /\.c4-quick-luxe/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round22 tests passed");
}

main();
