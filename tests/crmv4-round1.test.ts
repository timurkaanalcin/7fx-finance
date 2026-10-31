/**
 * CRM v4 round 1 helpers: health, filters, SLA, conversion.
 * Run: npx tsx tests/crmv4-round1.test.ts
 */
import assert from "node:assert/strict";
import { applyRules, conversionRate, duplicateEmails, formatAge, healthOf, moveItem, relativeFrom, slaHours } from "../src/lib/crmv4/round1";

function main() {
  assert.equal(healthOf({ active: false, ftd: true, balance: 10 }), "risk");
  assert.equal(healthOf({ documentsStatus: "PENDING", balance: 5 }), "review");
  assert.equal(healthOf({ ftd: false, balance: 0 }), "watch");
  assert.equal(healthOf({ ftd: true, balance: 0 }), "healthy");

  const rows = [
    { id: "a", name: "Ada", email: "ada@desk.test", country: "TR", balance: 10, saleStatus: "NEW" },
    { id: "b", name: "Leo", email: "ada@desk.test", country: "GB", balance: 2, saleStatus: "FTD" },
  ];
  assert.deepEqual(applyRules(rows, [{ id: "1", field: "country", op: "eq", value: "TR" }], {}).map((row) => row.id), ["a"]);
  assert.deepEqual(applyRules(rows, [{ id: "2", field: "balance", op: "gt", value: "5" }], {}).map((row) => row.id), ["a"]);
  assert.deepEqual(applyRules(rows, [{ id: "3", field: "tag", op: "contains", value: "vip" }], { b: ["vip"] }).map((row) => row.id), ["b"]);
  assert.equal(duplicateEmails(rows).has("ada@desk.test"), true);
  assert.deepEqual(moveItem(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
  assert.equal(conversionRate(1, 4), "25%");
  assert.equal(conversionRate(0, 0), "—");
  assert.equal(formatAge(0.2).endsWith("m"), true);
  assert.equal(formatAge(3), "3h");
  assert.equal(formatAge(72), "3d");
  const past = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  assert.ok(slaHours(past) > 1.5);
  assert.equal(relativeFrom(new Date(Date.now() - 90 * 1000).toISOString()).endsWith("m"), true);

  console.log("crmv4 round1 tests passed");
}

main();
