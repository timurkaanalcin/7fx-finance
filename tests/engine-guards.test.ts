/**
 * Engine guards for pending fills and SL/TP closes.
 * These cover the pure decisions the trading engine branches on.
 * Prisma races need a database; see the PR manual verification section.
 * Run: npx tsx tests/engine-guards.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { localizeTradeError } from "../src/lib/trade-errors";
import {
  POSITION_NOT_FOUND,
  isPositionNotFound,
  pendingFillBlockedByMargin,
  positionLevelHit,
} from "../src/lib/trading";

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

async function main() {
  assert.equal(pendingFillBlockedByMargin(99, 100, "LIMIT"), true);
  assert.equal(pendingFillBlockedByMargin(99, 100, "STOP"), true);
  assert.equal(pendingFillBlockedByMargin(0, 1, "LIMIT"), true);
  assert.equal(pendingFillBlockedByMargin(100, 100, "LIMIT"), false);
  assert.equal(pendingFillBlockedByMargin(100, 100, "STOP"), false);
  assert.equal(pendingFillBlockedByMargin(150, 100, "LIMIT"), false);
  assert.equal(pendingFillBlockedByMargin(10, 100, "MARKET"), false);
  assert.equal(pendingFillBlockedByMargin(0, 100, "MARKET"), false);

  assert.equal(positionLevelHit("BUY", 100, 100, null), true);
  assert.equal(positionLevelHit("BUY", 99.9, 100, null), true);
  assert.equal(positionLevelHit("BUY", 100.1, 100, null), false);
  assert.equal(positionLevelHit("BUY", 110, null, 110), true);
  assert.equal(positionLevelHit("BUY", 110.1, null, 110), true);
  assert.equal(positionLevelHit("BUY", 109.9, null, 110), false);
  assert.equal(positionLevelHit("BUY", 105, 100, 110), false);
  assert.equal(positionLevelHit("BUY", 100, null, null), false);

  assert.equal(positionLevelHit("SELL", 100, 100, null), true);
  assert.equal(positionLevelHit("SELL", 100.1, 100, null), true);
  assert.equal(positionLevelHit("SELL", 99.9, 100, null), false);
  assert.equal(positionLevelHit("SELL", 90, null, 90), true);
  assert.equal(positionLevelHit("SELL", 89.9, null, 90), true);
  assert.equal(positionLevelHit("SELL", 90.1, null, 90), false);
  assert.equal(positionLevelHit("SELL", 95, 100, 90), false);
  assert.equal(positionLevelHit("SELL", 95, null, null), false);

  assert.equal(POSITION_NOT_FOUND, "Position not found");
  assert.equal(isPositionNotFound(new Error(POSITION_NOT_FOUND)), true);
  assert.equal(isPositionNotFound(new Error("Position not found")), true);
  assert.equal(isPositionNotFound(new Error("Price yok")), false);
  assert.equal(isPositionNotFound(new Error("Account not found")), false);
  assert.equal(isPositionNotFound("Position not found"), false);
  assert.equal(isPositionNotFound(null), false);
  assert.equal(localizeTradeError(POSITION_NOT_FOUND, (key) => key), "term.err.noPosition");

  const positions = readSrc("src/app/api/positions/route.ts");
  const openAt = positions.indexOf('if (status === "OPEN")');
  assert.ok(openAt >= 0);
  assert.ok(positions.indexOf("await processPendingOrders", openAt) > openAt);
  assert.ok(positions.indexOf("await checkSlTp", openAt) > openAt);
  assert.equal(count(positions, "processPendingOrders"), 2);
  assert.equal(count(positions, "checkSlTp"), 2);

  for (const rel of [
    "src/app/api/orders/route.ts",
    "src/app/api/auth/me/route.ts",
    "src/app/api/account/route.ts",
    "src/app/api/balance-requests/route.ts",
  ]) {
    const text = readSrc(rel);
    assert.equal(count(text, "processPendingOrders"), 0, rel);
    assert.equal(count(text, "checkSlTp"), 0, rel);
  }

  const trading = readSrc("src/lib/trading.ts");
  assert.match(trading, /pendingFillBlockedByMargin\(account\.freeMargin, margin, order\.type\)/);
  assert.match(trading, /status: "PENDING"/);
  assert.match(trading, /status: "OPEN", volume: pos\.volume/);
  assert.equal(count(trading, "calcProfitWithRates("), 5);
  assert.equal(count(trading, "calcMarginWithRates("), 3);

  console.log("engine-guards tests passed");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
