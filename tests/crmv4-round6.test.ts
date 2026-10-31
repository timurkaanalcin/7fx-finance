/**
 * CRM v4 round 6 helpers.
 * Run: npx tsx tests/crmv4-round6.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { agingBucket, categorize, columnTotal, conversionDays, depositStreak, domainGroups, equityCurve, expirySoon, flagEmoji, formatAmount, formatPhone, redepositDue, riskScore, shareQuery, slaHeat, topDepositors } from "../src/lib/crmv4/round6";

function main() {
  assert.equal(riskScore({ active: false, documentsStatus: "NONE", balance: 100, equity: 50, ftd: false }), 90);
  assert.deepEqual(equityCurve([{ amount: 10, createdAt: "2026-01-01" }, { balanceAfter: 40, createdAt: "2026-01-02" }]), [10, 40]);
  assert.equal(depositStreak(["2026-10-30T01:00:00Z", "2026-10-29T01:00:00Z"], new Date("2026-10-30T12:00:00Z")), 2);
  assert.equal(redepositDue([{ id: "a", ftd: true, lastDepositAt: "2026-01-01" }], new Date("2026-10-30").getTime()).length, 1);
  assert.equal(slaHeat(["2026-10-30T00:00:00Z"], new Date("2026-10-30T12:00:00Z"))[6], 1);
  assert.equal(categorize("Need a deposit", [{ word: "deposit", label: "money" }]), "money");
  assert.equal(flagEmoji("TR").length > 0, true);
  assert.equal(flagEmoji("Turkey"), "");
  assert.equal(formatPhone("5551112233", "TR"), "+90 555 111 2233");
  assert.equal(domainGroups([{ email: "a@desk.test" }, { email: "b@desk.test" }])[0].domain, "desk.test");
  assert.equal(agingBucket("2026-10-28", new Date("2026-10-30").getTime()), "fresh");
  assert.equal(conversionDays("2026-10-01", "2026-10-11"), 10);
  assert.equal(topDepositors([{ id: "a", balance: 1 }, { id: "b", balance: 9 }])[0].id, "b");
  assert.equal(columnTotal([1.5, 2.5]), 4);
  assert.equal(formatAmount(1.2, 0), "1");
  assert.equal(shareQuery({ status: "active", q: "" }), "?status=active");
  assert.equal(expirySoon("2026-01-01", new Date("2026-10-30").getTime()), "expired");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-phone-card/);
  assert.match(css, /\.c4-rail-luxe/);
  assert.match(css, /\.c4-search-luxe/);
  assert.match(css, /data-motion="reduce"/);
  console.log("crmv4 round6 tests passed");
}

main();
