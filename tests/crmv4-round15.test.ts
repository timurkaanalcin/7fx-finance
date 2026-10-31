/**
 * CRM v4 round 15 helpers.
 * Run: npx tsx tests/crmv4-round15.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  byAge,
  currencyMix,
  docCounts,
  groupByAuthor,
  inBand,
  largestPendingId,
  methodName,
  noteDuplicate,
  orderNotes,
  pendingCount,
  pendingSum,
  queueAgeHours,
  sameCustomer,
} from "../src/lib/crmv4/round15";

function main() {
  const rows = [
    { id: "a", amount: 250, currency: "USD", status: "PENDING", createdAt: "2026-10-28T09:00:00Z", user: { email: "ada@x.com", name: "Ada" } },
    { id: "b", amount: 1800, currency: "USD", status: "PENDING", createdAt: "2026-10-30T09:00:00Z", user: { email: "ada@x.com", name: "Ada" } },
    { id: "c", amount: 400, currency: "TRY", status: "APPROVED", createdAt: "2026-10-31T08:00:00Z", user: { email: "ken@x.com", name: "Ken" } },
  ];
  assert.equal(pendingCount(rows), 2);
  assert.equal(pendingSum(rows), 2050);
  assert.equal(byAge(rows, true)[0].id, "a");
  assert.equal(byAge(rows, false)[0].id, "c");
  assert.equal(inBand(250, "small"), true);
  assert.equal(inBand(1800, "small"), false);
  assert.equal(inBand(1800, "large"), true);
  assert.equal(sameCustomer(rows).has("ada@x.com"), true);
  assert.equal(largestPendingId(rows), "b");
  assert.equal(methodName({ label: "TRY Bank" }), "TRY Bank");
  assert.equal(methodName("BANK"), "BANK");
  assert.equal(methodName(null), "—");
  assert.equal(queueAgeHours("2026-10-31T08:00:00Z", new Date("2026-10-31T11:00:00Z").getTime()), 3);
  assert.equal(currencyMix(rows).length, 2);
  assert.equal(noteDuplicate("Hello", [{ body: " hello " }]), true);
  assert.equal(noteDuplicate("Hello", [{ body: "other" }]), false);
  assert.equal(orderNotes([{ createdAt: "2026-10-01" }, { createdAt: "2026-10-02" }], true)[0].createdAt, "2026-10-02");
  assert.equal(groupByAuthor([{ authorName: "Ada" }, { authorName: "Ada" }, { authorName: null }]).length, 2);
  assert.deepEqual(docCounts([{ status: "PENDING" }, { status: "APPROVED" }, { status: "REJECTED" }]), { pending: 1, approved: 1, rejected: 1 });
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fin-hero/);
  assert.match(css, /\.c4-fin-row/);
  assert.match(css, /\.c4-doc-line/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round15 tests passed");
}

main();
