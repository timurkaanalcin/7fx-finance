/**
 * CRM v4 round 7 helpers.
 * Run: npx tsx tests/crmv4-round7.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { commissionOf, completeness, duplicateLeads, filterActivity, parseLeadCsv, sameDay, sourceMix, staleCallbacks, statusDiffs, weekKeys } from "../src/lib/crmv4/round7";

function main() {
  const profile = completeness({ name: "Ada", phone: "", country: "TR", email: "a@b.c", language: "en", documentsStatus: "PENDING" });
  assert.equal(profile.missing.includes("phone"), true);
  assert.equal(profile.missing.includes("documentsStatus"), true);
  assert.ok(profile.score < 100);
  assert.equal(filterActivity([{ kind: "LOGIN" }, { kind: "NOTE" }], "note").length, 1);
  const leads = parseLeadCsv("email,name\nada@desk.test,Ada\nbad,Leo");
  assert.equal(leads[0].error, "");
  assert.equal(leads[1].error, "email");
  assert.deepEqual(duplicateLeads([{ email: "Ada@desk.test" }, { email: "ada@desk.test" }], ["ada@desk.test"]), ["ada@desk.test", "ada@desk.test"]);
  assert.equal(sourceMix([{ utmSource: "ads" }, { campaign: "mail" }]).length, 2);
  assert.equal(sourceMix([{ campaign: "ads" }, { campaign: "ads" }])[0].count, 2);
  const now = new Date("2026-10-30T00:00:00Z").getTime();
  assert.equal(staleCallbacks([{ id: "a", retentionFollowUpAt: "2026-10-01" }], now).length, 1);
  assert.equal(statusDiffs({ a: "NEW" }, [{ id: "a", name: "Ada", saleStatus: "CALLBACK" }])[0].to, "CALLBACK");
  assert.equal(commissionOf(200, 10), 20);
  assert.equal(weekKeys(new Date("2026-10-30T00:00:00Z")).length, 7);
  assert.equal(sameDay("2026-10-30T15:00:00Z", "2026-10-30"), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-detail-luxe/);
  assert.match(css, /\.c4-money-drawer/);
  assert.match(css, /\.c4-tabs-luxe/);
  assert.match(css, /safe-area-inset-bottom/);
  console.log("crmv4 round7 tests passed");
}

main();
