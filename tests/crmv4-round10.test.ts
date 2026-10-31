/**
 * CRM v4 round 10 helpers.
 * Run: npx tsx tests/crmv4-round10.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { anomalyRows, bestCallHours, leadScore, payoutOf, roiOf, snoozeAt, toIcs } from "../src/lib/crmv4/round10";

function main() {
  const flagged = anomalyRows([
    { actor: "Ada", ip: "1.1.1.1" },
    { actor: "Ada", ip: "2.2.2.2" },
    { actor: "Ken", ip: "9.9.9.9" },
  ]);
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].actor, "Ada");
  assert.deepEqual(flagged[0].ips.sort(), ["1.1.1.1", "2.2.2.2"]);

  const score = leadScore(
    { balance: 1500, ftd: true, country: "TR", saleStatus: "CALLBACK" },
    [
      { field: "ftd", op: "eq", value: "true", points: 40 },
      { field: "balance", op: "gte", value: "1000", points: 30 },
      { field: "sale", op: "eq", value: "CALLBACK", points: 20 },
    ],
  );
  assert.equal(score, 90);
  assert.equal(bestCallHours(3), "07:00–15:00 UTC");
  assert.equal(roiOf(150, 100), 50);
  assert.equal(roiOf(10, 0), null);
  assert.equal(payoutOf(200, 12.5), 25);
  const ics = toIcs([{ id: "r1", body: "Call Ada", remindAt: "2026-10-31T10:00:00.000Z" }]);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /UID:r1@7fx/);
  assert.match(ics, /SUMMARY:Call Ada/);
  const snoozed = new Date(snoozeAt(new Date("2026-10-31T10:00:00.000Z"))).toISOString();
  assert.equal(snoozed, "2026-10-31T11:00:00.000Z");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-audit-luxe/);
  assert.match(css, /\.c4-staff-luxe/);
  assert.match(css, /\.c4-toast\[data-ok="0"\]/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round10 tests passed");
}

main();
