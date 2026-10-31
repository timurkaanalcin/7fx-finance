/**
 * CRM v4 round 3 helpers.
 * Run: npx tsx tests/crmv4-round3.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { bookTotals, exposureBySymbol, localClock, marginWatch, parseOperators, presenceOf, zoneFor } from "../src/lib/crmv4/round3";

function main() {
  assert.equal(zoneFor("TR"), "Europe/Istanbul");
  assert.equal(zoneFor("ZZ", "Europe/Paris"), "Europe/Paris");
  assert.equal(localClock("TR", null, new Date("2026-10-30T09:00:00Z")).length, 5);
  assert.equal(presenceOf(new Date().toISOString(), null), "online");
  assert.equal(presenceOf(null, null), "offline");
  const book = [
    { symbol: "EURUSD", side: "BUY", volume: 1.5, profit: 10, status: "OPEN" },
    { symbol: "EURUSD", side: "SELL", volume: 0.5, profit: -4, status: "OPEN" },
    { symbol: "XAUUSD", side: "BUY", volume: 2, profit: 1, status: "CLOSED" },
  ];
  assert.equal(bookTotals(book).open, 2);
  assert.equal(bookTotals(book).exposure, 2);
  assert.equal(exposureBySymbol(book)[0].symbol, "EURUSD");
  assert.deepEqual(marginWatch([{ id: "a", name: "A", balance: 100, equity: 80 }]).map((row) => row.id), ["a"]);
  assert.equal(marginWatch([{ id: "b", name: "B", balance: 100, equity: 99 }]).length, 0);
  const parsed = parseOperators("ada email:desk.test country:TR");
  assert.equal(parsed.ops.email, "desk.test");
  assert.equal(parsed.ops.country, "TR");
  assert.equal(parsed.text.includes("ada"), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\[dir="rtl"\]/);
  assert.match(css, /@media print/);
  console.log("crmv4 round3 tests passed");
}

main();
