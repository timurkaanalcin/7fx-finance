/**
 * CRM v4 round 24 helpers.
 * Run: npx tsx tests/crmv4-round24.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND24_COPY } from "../src/lib/crmv4/copy-round24";
import { cohortOf, filterQuery, gaps, onboardSteps, weekKey } from "../src/lib/crmv4/round24";

function main() {
  const steps = onboardSteps({
    createdAt: "2026-10-01T00:00:00Z",
    documentsStatus: "APPROVED",
    deposits: [{ createdAt: "2026-10-11T00:00:00Z" }, { createdAt: "2026-10-21T00:00:00Z" }],
    trades: [{ openedAt: "2026-10-16T00:00:00Z" }],
  });
  assert.deepEqual(steps.map((step) => step.key), ["registered", "kyc", "firstDeposit", "firstTrade", "secondDeposit"]);
  assert.equal(steps[1].done, true);
  assert.equal(steps[1].at, "");
  assert.equal(steps[2].at, "2026-10-11T00:00:00Z");
  assert.equal(steps[4].at, "2026-10-21T00:00:00Z");
  const spans = gaps(steps);
  assert.equal(spans[0].days, null);
  assert.equal(spans[1].days, null);
  assert.equal(spans[2].days, 5);
  assert.equal(spans[3].days, 5);
  const open = onboardSteps({ createdAt: "", documentsStatus: "NONE", deposits: [], trades: [] });
  assert.equal(open[0].done, false);
  assert.equal(open[2].done, false);
  assert.equal(weekKey("2026-10-31T12:00:00Z"), "2026-W44");
  assert.equal(weekKey(""), "");
  const weeks = cohortOf([
    { week: "2026-W44", kyc: true, ftd: true, traded: false, second: true },
    { week: "2026-W44", kyc: false, ftd: false, traded: true, second: false },
    { week: "", kyc: true, ftd: true, traded: true, second: true },
  ]);
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].registered, 2);
  assert.equal(weeks[0].kyc, 1);
  assert.equal(weeks[0].ftd, 1);
  assert.equal(weeks[0].traded, 1);
  assert.equal(weeks[0].second, 1);
  assert.deepEqual(filterQuery("?saleStatus=NEW&country="), { saleStatus: "NEW" });
  const keys = Object.keys(ROUND24_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND24_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-onboard-luxe/);
  assert.match(css, /\.c4-cohort-luxe/);
  assert.match(css, /\.c4-staff-luxe/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round24.tsx"), "utf8");
  assert.match(app, /crmv4-staff-prefs/);
  assert.equal(app.includes("password"), false);
  console.log("crmv4 round24 tests passed");
}

main();
