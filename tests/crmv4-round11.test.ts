/**
 * CRM v4 round 11 helpers.
 * Run: npx tsx tests/crmv4-round11.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  backlogDays,
  capitalizeName,
  cityOf,
  emailHint,
  fillGreeting,
  isChurn,
  meanMinutes,
  phoneIssue,
  qualityRows,
  similarCustomers,
  tryAmount,
  wordCloud,
} from "../src/lib/crmv4/round11";

function main() {
  const ada = { id: "a", name: "Ada", country: "TR", desk: "Sale", campaign: "spring", address: "Levent, İstanbul" };
  const ken = { id: "b", name: "Ken", country: "TR", desk: "Retention", campaign: "other" };
  const sam = { id: "c", name: "Sam", country: "DE", desk: "Sale", campaign: "winter" };
  assert.equal(similarCustomers(ada, [ada, ken, sam]).length, 2);
  assert.equal(cityOf(ada), "İstanbul");
  assert.equal(cityOf({ id: "m", address: "Moscow" }), "Moscow");
  assert.equal(cityOf({ id: "x" }), "");
  const old = new Date(Date.now() - 20 * 86400000).toISOString();
  assert.equal(isChurn({ id: "a", balance: 200, equity: 100, lastLoginAt: old }), true);
  assert.equal(isChurn({ id: "a", balance: 200, equity: 200, lastLoginAt: old }), false);
  assert.equal(phoneIssue("123"), "short");
  assert.equal(phoneIssue("+90 555 111 2233"), null);
  assert.equal(emailHint("ada@gmial.com")?.fix, "ada@gmail.com");
  assert.equal(emailHint("ada@gmail.com"), null);
  assert.equal(capitalizeName("ada demir"), "Ada Demir");
  assert.equal(fillGreeting("Happy {{holiday}}, {{name}}.", { name: "Ada", holiday: "Bayram" }), "Happy Bayram, Ada.");
  assert.equal(meanMinutes([{ status: "APPROVED", openedAt: "2026-10-31T10:00:00Z", closedAt: "2026-10-31T10:30:00Z" }]), 30);
  assert.deepEqual(backlogDays([{ status: "PENDING", openedAt: "2026-10-31T10:00:00Z" }]), [{ day: "2026-10-31", count: 1 }]);
  assert.equal(wordCloud("call call margin the").length, 2);
  assert.equal(tryAmount(10, 34.5), 345);
  assert.equal(qualityRows([{ id: "a", name: "Ada", email: "ada@gmial.com", phone: "12" }]).length, 1);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-exec-hero/);
  assert.match(css, /\.c4-hover-tip/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round11 tests passed");
}

main();
