/**
 * CRM v3 alert rules, compare, onboarding, and staff preferences.
 * Display and browser storage only. Nothing is sent.
 * Run: npx tsx tests/crmv3-people.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { followAlerts, largeAlerts, quietAlerts, sameCurrencyHigher, slaAlerts, visibleAlerts, type AlertHit } from "../src/lib/crmv3/alerts";
import { cohortOf, filterQuery, gaps, onboardSteps, weekKey } from "../src/lib/crmv3/cohort";

const ROOT = path.resolve(__dirname, "..");
const NOW = Date.parse("2026-10-31T12:00:00.000Z");

function main() {
  assert.equal(largeAlerts([{ id: "d1", amount: 1500, user: { id: "u1", name: "Ada" } }], 1000)[0].userId, "u1");
  assert.equal(largeAlerts([{ id: "d2", amount: 10 }], 1000).length, 0);

  const old = new Date(NOW - 48 * 36e5).toISOString();
  assert.equal(slaAlerts([{ id: "t1", customer: "Ada", openedAt: old, status: "PENDING" }], 24, NOW).length, 1);
  assert.equal(slaAlerts([{ id: "t2", customer: "Ada", openedAt: old, status: "APPROVED" }], 24, NOW).length, 0);

  assert.equal(followAlerts([{ id: "u1", name: "Ada", follow: "2026-10-01" }], "2026-10-31").length, 1);
  assert.equal(followAlerts([{ id: "u1", name: "Ada", follow: "2026-11-01" }], "2026-10-31").length, 0);

  const quiet = quietAlerts(
    [{ id: "u1", name: "Ada", createdAt: new Date(NOW - 40 * 86400000).toISOString() }],
    [{ userId: "u1", createdAt: new Date(NOW - 2 * 86400000).toISOString() }],
    NOW,
  );
  assert.equal(quiet.length, 1);
  assert.equal(quietAlerts(
    [{ id: "u2", name: "Bea", createdAt: new Date(NOW - 5 * 86400000).toISOString() }],
    [{ userId: "u2", createdAt: new Date(NOW - 86400000).toISOString() }],
    NOW,
  ).length, 0);

  const hits: AlertHit[] = [
    { id: "large:1", rule: "large", name: "Ada", detail: "1000", userId: "u1" },
    { id: "sla:1", rule: "sla", name: "Ada", detail: "24", userId: "" },
  ];
  assert.equal(visibleAlerts(hits, { large: true, sla: false, follow: true, watch: true, quiet: true, largeAt: 1000, slaHours: 24, muted: ["large:1"] }).length, 0);

  assert.equal(sameCurrencyHigher([{ id: "a", currency: "USD", balance: 10 }, { id: "b", currency: "USD", balance: 40 }]), "b");
  assert.equal(sameCurrencyHigher([{ id: "a", currency: "USD", balance: 10 }, { id: "b", currency: "TRY", balance: 40 }]), "");

  const steps = onboardSteps({
    createdAt: "2024-01-01T00:00:00.000Z",
    documentsStatus: "APPROVED",
    deposits: [{ createdAt: "2024-01-11T00:00:00.000Z" }, { createdAt: "2024-02-01T00:00:00.000Z" }],
    trades: [{ openedAt: "2024-01-20T00:00:00.000Z" }],
  });
  assert.equal(steps.filter((step) => step.done).length, 5);
  const span = gaps(steps);
  assert.equal(span[0].days, null);
  assert.equal(span[2].days, 9);

  assert.equal(weekKey("2026-10-31T12:00:00.000Z"), "2026-W44");
  assert.equal(weekKey(""), "");
  const weeks = cohortOf([
    { week: "2026-W44", kyc: true, ftd: true, traded: false, second: false },
    { week: "2026-W44", kyc: false, ftd: false, traded: true, second: true },
    { week: "", kyc: true, ftd: true, traded: true, second: true },
  ]);
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].registered, 2);
  assert.equal(weeks[0].kyc, 1);
  assert.equal(weeks[0].second, 1);
  assert.deepEqual(filterQuery("?saleStatus=NEW&empty="), { saleStatus: "NEW" });

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-compare-row/);
  assert.equal(css.includes("overflow-x: auto"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/people.tsx"), "utf8");
  assert.match(app, /crmv3-alert-rules/);
  assert.match(app, /crmv3-staff-prefs/);
  assert.match(app, /crmv3-call-log/);
  assert.equal(app.includes("crmv4-"), false);

  console.log("crmv3 people tests passed");
}

main();
