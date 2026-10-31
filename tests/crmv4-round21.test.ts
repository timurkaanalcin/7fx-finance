/**
 * CRM v4 round 21 helpers.
 * Run: npx tsx tests/crmv4-round21.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  approvalShare,
  averageAgeHours,
  byCurrency,
  inDates,
  methodStats,
  noteSummary,
  statusCounts,
} from "../src/lib/crmv4/round21";

function main() {
  const rows = [
    { method: "Bank", amount: 1800, currency: "USD", status: "PENDING", createdAt: "2026-10-30T09:00:00Z" },
    { method: "Bank", amount: 200, currency: "TRY", status: "APPROVED", createdAt: "2026-10-31T09:00:00Z" },
    { method: "Card", amount: 50, currency: "USD", status: "REJECTED", createdAt: "2026-10-31T08:00:00Z" },
  ];
  const now = new Date("2026-10-31T11:00:00Z").getTime();
  const stats = methodStats(rows, now);
  assert.equal(stats[0].method, "Bank");
  assert.equal(stats[0].count, 2);
  assert.equal(stats[0].approved, 1);
  assert.equal(stats[0].pending, 1);
  assert.equal(stats[0].byCurrency.length, 2);
  assert.equal(approvalShare(1, 2), 50);
  assert.equal(approvalShare(0, 0), null);
  assert.equal(averageAgeHours(["2026-10-31T09:00:00Z"], now), 2);
  assert.deepEqual(statusCounts(rows), { pending: 1, approved: 1, rejected: 1 });
  assert.equal(byCurrency(rows).find((row) => row.currency === "USD")?.total, 1850);
  assert.equal(inDates("2026-10-30T09:00:00Z", "2026-10-30", "2026-10-30"), true);
  assert.equal(inDates("2026-10-29T09:00:00Z", "2026-10-30", ""), false);
  assert.deepEqual(noteSummary([{ body: "old", createdAt: "2026-10-01" }, { body: "new", createdAt: "2026-10-02" }]), { count: 2, latest: "new" });
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-statement-sheet/);
  assert.match(css, /\.c4-pay-luxe/);
  assert.match(css, /data-print="statement"/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round21 tests passed");
}

main();
