/**
 * CRM v4 round 4 helpers.
 * Run: npx tsx tests/crmv4-round4.test.ts
 */
import assert from "node:assert/strict";
import { accentOf, countryHeat, hourHeat, lifetimeValue, mergeSuggestions, methodMix, nextAction, rowStep, smartSplit, sparkPath, withdrawalFlags, workloadOf } from "../src/lib/crmv4/round4";

function main() {
  const book = lifetimeValue([
    { amount: 100, type: "DEPOSIT", createdAt: "2026-01-01" },
    { amount: 40, type: "WITHDRAW", createdAt: "2026-01-02" },
  ]);
  assert.equal(book.net, 60);
  assert.equal(book.points.length, 2);
  assert.match(sparkPath([0, 10, 4]), /^M/);
  assert.equal(countryHeat([{ country: "TR" }, { country: "TR" }, { country: "DE" }])[0].country, "TR");
  const hours = hourHeat(["2026-10-30T09:15:00Z", "2026-10-30T09:40:00Z"]);
  assert.equal(hours[9], 2);
  assert.equal(hours.length, 24);
  const load = workloadOf([{ assigneeName: "Ada" }, { assigneeName: "Ada" }, { assigneeName: "Leo" }]);
  assert.equal(load[0].name, "Ada");
  assert.equal(load[0].share, 67);
  const now = new Date("2026-10-30T00:00:00Z").getTime();
  const split = smartSplit([
    { id: "old", lastSeenAt: "2026-01-01T00:00:00Z", balance: 10 },
    { id: "rich", balance: 5000, ftd: false, lastSeenAt: "2026-10-29T00:00:00Z" },
    { id: "kyc", documentsStatus: "PENDING", createdAt: "2026-10-01T00:00:00Z", lastSeenAt: "2026-10-29T00:00:00Z" },
  ], now);
  assert.equal(split.inactive[0].id, "old");
  assert.equal(split.richIdle[0].id, "rich");
  assert.equal(split.kycStale[0].id, "kyc");
  assert.equal(nextAction({ id: "a", documentsStatus: "PENDING" }), "kyc");
  assert.equal(nextAction({ id: "b", saleStatus: "NEW" }), "call");
  assert.deepEqual(mergeSuggestions([{ id: "1", name: "Ada Demir" }, { id: "2", name: "Ada Demir" }]).map((row) => row.ids.join(",")), ["1,2"]);
  assert.equal(methodMix([{ method: "Card", amount: 10 }, { method: "Card", amount: 5 }])[0].amount, 15);
  assert.deepEqual(withdrawalFlags({ createdAt: new Date(now - 2 * 86400000).toISOString(), kycAt: new Date(now - 86400000).toISOString() }, now), ["new", "kyc"]);
  assert.equal(rowStep(0, 3, "j"), 1);
  assert.equal(rowStep(0, 3, "k"), 0);
  assert.equal(accentOf("nope"), "champagne");
  assert.equal(accentOf("graphite"), "graphite");
  console.log("crmv4 round4 tests passed");
}

main();
