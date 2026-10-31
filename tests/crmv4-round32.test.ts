/**
 * CRM v4 round 32 helpers.
 * Run: npx tsx tests/crmv4-round32.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND32_COPY } from "../src/lib/crmv4/copy-round32";
import { barShare, catalogLocalesComplete, firstTradesInPeriod, funnelCounts, inPeriod, keyTitle, listedKeys, moneyGroups } from "../src/lib/crmv4/round32";

function main() {
  const now = Date.parse("2026-10-31T00:00:00Z");
  assert.equal(inPeriod("2026-10-30T00:00:00Z", 7, now), true);
  assert.equal(inPeriod("2026-09-01T00:00:00Z", 7, now), false);
  const people = [
    { id: "a", createdAt: "2026-10-20T00:00:00Z", documentsStatus: "APPROVED", ftd: true },
    { id: "b", createdAt: "2026-10-20T00:00:00Z", documentsStatus: "NONE", ftd: true },
    { id: "c", createdAt: "2026-01-01T00:00:00Z", documentsStatus: "APPROVED", ftd: true },
  ];
  const trades = firstTradesInPeriod([{ userId: "a", openedAt: "2026-10-21T00:00:00Z" }, { userId: "a", openedAt: "2026-10-28T00:00:00Z" }], 30, now);
  assert.deepEqual(trades, ["a"]);
  const funnel = funnelCounts(people, trades, 30, now);
  assert.equal(funnel.registered, 2);
  assert.equal(funnel.kyc, 1);
  assert.equal(funnel.deposit, 1);
  assert.equal(funnel.trade, 1);
  assert.ok(funnel.kyc <= funnel.registered && funnel.deposit <= funnel.kyc && funnel.trade <= funnel.deposit);
  const groups = moneyGroups([
    { amount: 10, currency: "USD", at: "2026-10-20T00:00:00Z", label: "Card" },
    { amount: 5, currency: "TRY", at: "2026-10-20T00:00:00Z", label: "Card" },
    { amount: 2, currency: "USD", at: "2026-10-21T00:00:00Z", label: "Card" },
  ], 30, now);
  assert.deepEqual(groups.map((group) => group.currency), ["TRY", "USD"]);
  assert.equal(groups.find((group) => group.currency === "USD")?.rows[0].amount, 12);
  assert.deepEqual(barShare([{ amount: 0, count: 1 }, { amount: 0, count: 3 }]), [33, 100]);
  const keys = listedKeys([{ key: "theme", value: "x", where: "browser" }, { key: "crmv4-theme-mode", value: "dark", where: "browser" }]);
  assert.equal(keys.length, 1);
  assert.equal(keys[0].bytes, 4);
  assert.equal(keyTitle("crmv4-theme-mode", "tr"), "Tema");
  assert.equal(keyTitle("crmv4-unknown", "en"), "");
  assert.equal(catalogLocalesComplete(), true);
  const copy = Object.keys(ROUND32_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND32_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-insight-luxe/);
  assert.match(css, /\.c4-pref-luxe/);
  assert.match(css, /--c4-accent-ink:\s*#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round32 tests passed");
}

main();
