/**
 * CRM v4 round 5 helpers.
 * Run: npx tsx tests/crmv4-round5.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { copyLine, forecast, goalProgress, journeyOf, mentionParts, moneyTone, pushCapped, segmentOf, symbolPopularity, upcomingBirthdays, winLoss } from "../src/lib/crmv4/round5";

function main() {
  const steps = journeyOf({ createdAt: "2026-01-01", documentsStatus: "APPROVED", ftd: true, trades: 2, withdrawals: 0 });
  assert.equal(steps.filter((step) => step.done).length, 4);
  assert.equal(steps[4].key, "cashout");
  const next = forecast([10, 20, 30], 2);
  assert.equal(next.length, 2);
  assert.ok(next[0] > 30);
  assert.equal(segmentOf({ balance: 20000, lastSeenAt: "2026-10-01" }, { vipBalance: 10000, dormantDays: 30 }, new Date("2026-10-30").getTime()), "vip");
  assert.equal(segmentOf({ balance: 10, lastSeenAt: "2026-01-01" }, { vipBalance: 10000, dormantDays: 30 }, new Date("2026-10-30").getTime()), "dormant");
  assert.equal(winLoss([{ profit: 5 }, { profit: -2 }, { profit: 0 }]).ratio, 50);
  assert.equal(symbolPopularity([{ symbol: "EURUSD" }, { symbol: "EURUSD" }, { symbol: "XAUUSD" }])[0].symbol, "EURUSD");
  const birth = upcomingBirthdays([{ id: "a", name: "Ada", birthDate: "1990-11-02" }], new Date("2026-10-30T00:00:00Z"), 7);
  assert.equal(birth[0].id, "a");
  assert.equal(mentionParts("Hi @Ada today")[1].mention, true);
  assert.equal(copyLine(["Ada", "", "TR"]), "Ada · TR");
  assert.equal(goalProgress(5, 10), 50);
  assert.equal(goalProgress(1, 0), 0);
  assert.deepEqual(pushCapped(["b"], "a", 2), ["a", "b"]);
  assert.equal(moneyTone(20, 10, 0), "high");
  assert.equal(moneyTone(-1, 10, 0), "low");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-aff-luxe/);
  assert.match(css, /\.c4-logs-luxe/);
  assert.match(css, /\.c4-report-luxe/);
  assert.match(css, /c4-filter-sheet/);
  console.log("crmv4 round5 tests passed");
}

main();
