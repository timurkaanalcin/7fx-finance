/**
 * CRM v4 round 8 helpers.
 * Run: npx tsx tests/crmv4-round8.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ageBuckets, agentTotals, cohortLtv, deskTotals, fuzzyHit, holdersOf, overThreshold, pnlMovers, watchDiffs, withdrawRatio } from "../src/lib/crmv4/round8";

function main() {
  assert.equal(fuzzyHit("ada", "Ada Demir"), true);
  assert.equal(fuzzyHit("demi", "Ada Demir"), true);
  assert.equal(fuzzyHit("zzzz", "Ada"), false);
  assert.equal(watchDiffs({ a: { balance: 1, status: "NEW" } }, [{ id: "a", name: "Ada", balance: 5, saleStatus: "NEW" }])[0].kind, "balance");
  const now = new Date("2026-10-30T00:00:00Z").getTime();
  assert.equal(ageBuckets(["2026-10-30T00:00:00Z", "2026-09-01T00:00:00Z"], now)[0].count, 1);
  assert.equal(pnlMovers([{ profit: 1 }, { profit: -9 }, { profit: 3 }])[0].profit, -9);
  assert.equal(withdrawRatio(100, 25), 0.25);
  assert.equal(withdrawRatio(0, 10), null);
  assert.equal(cohortLtv([{ createdAt: "2026-01-02", balance: 10 }, { createdAt: "2026-01-20", balance: 5 }])[0].balance, 15);
  assert.equal(deskTotals([{ desk: "A", balance: 2 }, { desk: "A", balance: 3 }])[0].traders, 2);
  assert.equal(agentTotals([{ assigneeName: "Ada", balance: 4, ftd: true }])[0].ftd, 1);
  assert.equal(holdersOf([{ symbol: "EURUSD" }, { symbol: "XAUUSD" }], "EURUSD").length, 1);
  assert.equal(overThreshold([{ symbol: "EURUSD", exposure: 3 }], 2)[0].symbol, "EURUSD");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dialog-luxe/);
  assert.match(css, /\.c4-toast/);
  assert.match(css, /data-contrast/);
  assert.match(css, /orientation: landscape/);
  console.log("crmv4 round8 tests passed");
}

main();
