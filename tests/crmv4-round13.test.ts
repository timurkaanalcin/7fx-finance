/**
 * CRM v4 round 13 helpers.
 * Run: npx tsx tests/crmv4-round13.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  anniversaries,
  campaignStats,
  cohortOf,
  cpa,
  cpl,
  funnelOf,
  heatDays,
  landingBreakdown,
  pacing,
  rankAffiliates,
  segmentHit,
  smsParts,
  sourceTrend,
} from "../src/lib/crmv4/round13";

function main() {
  const rows = [
    { id: "1", campaign: "facebook_ads", ftd: true, balance: 100, createdAt: "2026-10-31T04:00:00Z", affiliateA: "AFF-100", saleStatus: "DEPOSITED", country: "TR" },
    { id: "2", campaign: "google_search", ftd: false, balance: 0, createdAt: "2026-10-30T04:00:00Z", referralCodeUsed: "FRIEND", saleStatus: "CONTACTED", country: "RU", retentionFollowUpAt: "2026-10-28T10:00:00Z" },
  ];
  const stats = campaignStats(rows);
  assert.equal(stats[0].campaign, "facebook_ads");
  assert.equal(stats[0].ftd, 1);
  assert.equal(sourceTrend(rows).length, 2);
  assert.equal(landingBreakdown(rows)[0].label, "AFF-100");
  assert.equal(cpl(80, 4), 20);
  assert.equal(cpl(0, 4), null);
  assert.equal(cpa(90, 3), 30);
  assert.equal(pacing(25, 100), 25);
  assert.equal(pacing(10, 0), null);
  assert.equal(funnelOf(rows, "facebook_ads")[0].status, "DEPOSITED");
  assert.equal(cohortOf(rows, "google_search")[0].month, "2026-10");
  assert.equal(segmentHit(rows[0], { name: "tr", field: "country", value: "tr" }), true);
  assert.equal(segmentHit(rows[0], { name: "f", field: "ftd", value: "true" }), true);
  assert.equal(heatDays(rows)[3], 1);
  assert.equal(anniversaries(rows, new Date("2026-10-31T12:00:00Z")).length, 1);
  assert.deepEqual(smsParts("a".repeat(161)), { length: 161, parts: 2 });
  assert.equal(smsParts("").parts, 0);
  assert.equal(rankAffiliates([{ name: "a", deposits: 1, leads: 9 }, { name: "b", deposits: 4, leads: 1 }])[0].name, "b");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mkt-hero/);
  assert.match(css, /\.c4-aff-board/);
  assert.match(css, /\.c4-mkt-bar/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round13 tests passed");
}

main();
