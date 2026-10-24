/**
 * Chart reconcile plan and trader list windows.
 * Run: npx tsx tests/round10.test.ts
 */
import assert from "node:assert/strict";
import { chartReconcilePlan, type OhlcBar } from "../src/lib/chart-reconcile";
import { traderListWindow, wantTraderCounts, TRADER_LEGACY_TAKE, TRADER_PAGE, TRADER_TAKE_CAP } from "../src/lib/trader-list";

function bar(time: number, close: number, high = close): OhlcBar {
  return { time, open: close, high, low: close, close };
}

function main() {
  const existing = [bar(1, 10), bar(2, 11), bar(3, 12)];
  assert.equal(chartReconcilePlan([], existing).kind, "replace");
  assert.deepEqual(chartReconcilePlan(existing, existing), { kind: "patch", updates: [] });

  const lastMoved = chartReconcilePlan(existing, [bar(1, 10), bar(2, 11), bar(3, 13)]);
  assert.equal(lastMoved.kind, "patch");
  if (lastMoved.kind === "patch") assert.deepEqual(lastMoved.updates, [bar(3, 13)]);

  const appended = chartReconcilePlan(existing, [...existing, bar(4, 14)]);
  assert.equal(appended.kind, "patch");
  if (appended.kind === "patch") assert.deepEqual(appended.updates, [bar(4, 14)]);

  assert.equal(chartReconcilePlan(existing, [bar(1, 10), bar(2, 99), bar(3, 12)]).kind, "replace");
  assert.equal(chartReconcilePlan(existing, [bar(2, 11), bar(3, 12)]).kind, "replace");
  assert.equal(chartReconcilePlan(existing, [bar(1, 10), bar(2, 11)]).kind, "replace");

  assert.deepEqual(traderListWindow(null, null), { take: TRADER_LEGACY_TAKE, skip: 0 });
  assert.deepEqual(traderListWindow("50", "50"), { take: TRADER_PAGE, skip: 50 });
  assert.deepEqual(traderListWindow("9999", "-3"), { take: TRADER_TAKE_CAP, skip: 0 });
  assert.equal(wantTraderCounts("1"), true);
  assert.equal(wantTraderCounts(null), false);
  assert.equal(wantTraderCounts("0"), false);

  console.log("round10 tests passed");
}

main();
