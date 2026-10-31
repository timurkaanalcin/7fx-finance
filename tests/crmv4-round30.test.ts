/**
 * CRM v4 round 30 helpers.
 * Run: npx tsx tests/crmv4-round30.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND30_COPY } from "../src/lib/crmv4/copy-round30";
import { CRM_V4_SECTIONS } from "../src/lib/crmv4/sections";
import { NAV_SECTIONS, activeGroup, filterSection, matchedCount, readFold, sectionPath } from "../src/lib/crmv4/round30";

function main() {
  const ids = NAV_SECTIONS.flatMap((group) => [...group.ids]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.slice().sort(), CRM_V4_SECTIONS.map((item) => item.id).slice().sort());
  assert.equal(sectionPath("overview"), "");
  assert.equal(sectionPath("deposit"), "deposit");
  assert.equal(activeGroup("kyc"), "compliance");
  assert.equal(activeGroup("reports"), "insights");
  assert.equal(activeGroup("missing"), "");
  const names = { deposit: "Deposit review", inbox: "Support inbox" };
  assert.deepEqual(filterSection(["deposit", "inbox"], names, "support"), ["inbox"]);
  assert.equal(matchedCount({ ...names, overview: "Overview" }, ""), NAV_SECTIONS.reduce((sum, group) => sum + group.ids.length, 0));
  assert.equal(readFold("1"), true);
  assert.equal(readFold("0"), false);
  assert.equal(readFold(null), false);
  const keys = Object.keys(ROUND30_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND30_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-page-rail/);
  assert.match(css, /--c4-accent-ink:\s*#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(page, /RAIL_KEY/);
  const lib = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round30.ts"), "utf8");
  assert.match(lib, /crmv4-rail-fold/);
  assert.match(page, /GroupedMenu/);
  console.log("crmv4 round30 tests passed");
}

main();
