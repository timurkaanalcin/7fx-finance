/**
 * CRM v3 round 32: insights funnel and saved browser keys.
 * Run: npx tsx tests/crmv3-round32.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { INSIGHTS_AR, INSIGHTS_DE, INSIGHTS_EN, INSIGHTS_RU, INSIGHTS_TR } from "../src/lib/crmv3/copy-insights";
import { barShare, catalogLocalesComplete, firstTradesInPeriod, funnelCounts, inPeriod, keyTitle, listedKeys, moneyGroups } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

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
    { amount: 9, currency: "", at: "2026-10-21T00:00:00Z", label: "Card" },
  ], 30, now);
  assert.deepEqual(groups.map((group) => group.currency), ["TRY", "USD"]);
  assert.equal(groups.find((group) => group.currency === "USD")?.rows[0].amount, 12);
  assert.deepEqual(barShare([{ amount: 0, count: 1 }, { amount: 0, count: 3 }]), [33, 100]);
  const keys = listedKeys([{ key: "theme", value: "x", where: "browser" }, { key: "crmv3-theme", value: "dark", where: "browser" }]);
  assert.equal(keys.length, 1);
  assert.equal(keys[0].bytes, 4);
  assert.equal(keyTitle("crmv3-theme", "tr"), "Tema");
  assert.equal(keyTitle("crmv3-unknown", "en"), "");
  assert.equal(catalogLocalesComplete(), true);
  const ids = NAV_SECTIONS.flatMap((group) => [...group.ids]);
  assert.equal(ids.includes("insights"), true);
  assert.equal(ids.includes("prefs"), true);
  assert.deepEqual(ids.slice().sort(), CRM_V3_SECTIONS.map((item) => item.id).slice().sort());
  const copy = Object.keys(INSIGHTS_EN).sort();
  assert.deepEqual(Object.keys(INSIGHTS_TR).sort(), copy);
  assert.deepEqual(Object.keys(INSIGHTS_DE).sort(), copy);
  assert.deepEqual(Object.keys(INSIGHTS_RU).sort(), copy);
  assert.deepEqual(Object.keys(INSIGHTS_AR).sort(), copy);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-insight/);
  assert.match(css, /\.c3-prefs/);
  assert.match(css, /\.c3-bar-fill/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/insights.ts"), "utf8");
  assert.match(lib, /crmv3-/);
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/insights.tsx"), "utf8");
  assert.match(page, /data-insights/);
  assert.match(page, /data-prefs/);
  assert.match(page, /prefResetAllAsk/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "insights"/);
  assert.match(app, /view === "prefs"/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round32 tests passed");
}

main();
