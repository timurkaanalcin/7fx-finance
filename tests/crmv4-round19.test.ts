/**
 * CRM v4 round 19 helpers.
 * Run: npx tsx tests/crmv4-round19.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  dormantThenActive,
  largeDeposits,
  manyWithdrawals,
  missingKyc,
  rapidDeposits,
  toggleColumn,
  visibleHits,
} from "../src/lib/crmv4/round19";

function main() {
  const people = [
    { id: "a", name: "Ada", documentsStatus: "NONE", createdAt: "2026-08-01T00:00:00Z" },
    { id: "b", name: "Ken", documentsStatus: "APPROVED", createdAt: "2026-10-30T00:00:00Z" },
  ];
  assert.equal(missingKyc(people).length, 1);
  assert.equal(missingKyc(people)[0].kind, "kyc");
  const deposits = [
    { id: "d1", amount: 1800, createdAt: "2026-10-30T09:00:00Z", user: { id: "a", name: "Ada" } },
    { id: "d2", amount: 200, createdAt: "2026-10-30T20:00:00Z", user: { id: "a", name: "Ada" } },
    { id: "d3", amount: 50, createdAt: "2026-10-31T08:00:00Z", user: { id: "b", name: "Ken" } },
  ];
  assert.equal(largeDeposits(deposits, 1000).length, 1);
  assert.equal(rapidDeposits(deposits).length, 1);
  assert.equal(rapidDeposits(deposits)[0].userId, "a");
  const withdrawals = [
    { id: "w1", amount: 10, createdAt: "2026-10-29T00:00:00Z", user: { id: "a", name: "Ada" } },
    { id: "w2", amount: 20, createdAt: "2026-10-30T00:00:00Z", user: { id: "a", name: "Ada" } },
  ];
  assert.equal(manyWithdrawals(withdrawals).length, 1);
  assert.equal(manyWithdrawals(withdrawals, 3).length, 0);
  const quiet = dormantThenActive(people, deposits, new Date("2026-10-31T12:00:00Z").getTime());
  assert.equal(quiet.length, 1);
  assert.equal(quiet[0].userId, "a");
  const hits = missingKyc(people);
  assert.equal(visibleHits(hits, ["kyc:a"], "", "").length, 0);
  assert.equal(visibleHits(hits, [], "kyc", "ada").length, 1);
  assert.deepEqual(toggleColumn(["rule", "detail"], "detail", ["rule", "detail", "amount"]), ["rule"]);
  assert.deepEqual(toggleColumn(["rule"], "rule", ["rule", "detail"]), ["rule"]);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-watch-luxe/);
  assert.match(css, /\.c4-list-sticky thead th/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round19 tests passed");
}

main();
