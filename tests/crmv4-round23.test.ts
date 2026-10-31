/**
 * CRM v4 round 23 helpers.
 * Run: npx tsx tests/crmv4-round23.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ALERT_DEFAULTS,
  followAlerts,
  largeAlerts,
  lastStamp,
  quietAlerts,
  sameCurrencyHigher,
  slaAlerts,
  visibleAlerts,
} from "../src/lib/crmv4/round23";

function main() {
  const now = new Date("2026-10-31T12:00:00Z").getTime();
  const large = largeAlerts([{ id: "d1", amount: 1800, user: { id: "a", name: "Ada" } }, { id: "d2", amount: 20, user: { id: "b", name: "Ken" } }], 1000);
  assert.equal(large.length, 1);
  assert.equal(large[0].name, "Ada");
  const sla = slaAlerts([
    { id: "t1", customer: "Ada", openedAt: "2026-10-29T00:00:00Z", status: "PENDING" },
    { id: "t2", customer: "Ken", openedAt: "2026-10-31T11:00:00Z", status: "PENDING" },
  ], 24, now);
  assert.equal(sla.length, 1);
  const follow = followAlerts([{ id: "a", name: "Ada", follow: "2026-10-01" }, { id: "b", name: "Ken", follow: "2026-11-01" }], "2026-10-31");
  assert.equal(follow.length, 1);
  const quiet = quietAlerts(
    [{ id: "a", name: "Ada", createdAt: "2026-08-01T00:00:00Z" }, { id: "b", name: "Ken", createdAt: "2026-10-30T00:00:00Z" }],
    [{ createdAt: "2026-10-30T00:00:00Z", user: { id: "a" } }],
    now,
  );
  assert.equal(quiet.length, 1);
  const shown = visibleAlerts([...large, ...sla], { ...ALERT_DEFAULTS, large: false, muted: [sla[0].id] });
  assert.equal(shown.length, 0);
  assert.equal(lastStamp(["2026-10-01", "", "2026-10-03"]), "2026-10-03");
  assert.equal(sameCurrencyHigher([{ id: "a", currency: "USD", balance: 10 }, { id: "b", currency: "USD", balance: 20 }]), "b");
  assert.equal(sameCurrencyHigher([{ id: "a", currency: "USD", balance: 10 }, { id: "b", currency: "TRY", balance: 20 }]), "");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-alert-luxe/);
  assert.match(css, /\.c4-compare-row/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round23 tests passed");
}

main();
