/**
 * CRM v3 round 30: grouped navigation and small-text contrast.
 * Run: npx tsx tests/crmv3-round30.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NAV_AR, NAV_DE, NAV_EN, NAV_RU, NAV_TR } from "../src/lib/crmv3/copy-nav";
import { NAV_SECTIONS, activeGroup, filterSection, listedIds, matchedCount, readFold, sectionPath } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS, CRM_V3_TABS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function lin(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(lin);
    return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
  };
  const hi = Math.max(lum(fg), lum(bg));
  const lo = Math.min(lum(fg), lum(bg));
  return (hi + 0.05) / (lo + 0.05);
}

function main() {
  const ids = NAV_SECTIONS.flatMap((group) => [...group.ids]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.slice().sort(), CRM_V3_SECTIONS.map((item) => item.id).slice().sort());
  const more = new Set<string>(CRM_V3_MORE);
  for (const tab of CRM_V3_TABS) assert.equal(more.has(tab), false);
  for (const id of CRM_V3_MORE) assert.equal(ids.includes(id), true);
  assert.equal(sectionPath("overview"), "");
  assert.equal(sectionPath("deposit"), "deposit");
  assert.equal(activeGroup("kyc"), "compliance");
  assert.equal(activeGroup("reports"), "insights");
  assert.equal(activeGroup("finance"), "money");
  assert.equal(activeGroup("missing"), "");
  assert.deepEqual(listedIds(["overview", "positions", "inbox"], CRM_V3_MORE), ["positions", "inbox"]);
  const names = { deposit: "Deposit review", inbox: "Support inbox" };
  assert.deepEqual(filterSection(["deposit", "inbox"], names, "support"), ["inbox"]);
  assert.equal(matchedCount({ overview: "Overview" }, ""), ids.length);
  assert.equal(matchedCount(names, "support", CRM_V3_MORE), 1);
  assert.equal(readFold("1"), true);
  assert.equal(readFold("0"), false);
  assert.equal(readFold(null), false);

  const keys = Object.keys(NAV_EN).sort();
  assert.deepEqual(Object.keys(NAV_TR).sort(), keys);
  assert.deepEqual(Object.keys(NAV_DE).sort(), keys);
  assert.deepEqual(Object.keys(NAV_RU).sort(), keys);
  assert.deepEqual(Object.keys(NAV_AR).sort(), keys);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-rail-group/);
  assert.match(css, /data-fold="1"/);
  assert.match(css, /\.c3-nav:focus-visible/);
  assert.match(css, /--c3-gold:\s*#7a5c26/);
  assert.equal(css.includes("#8c6a2b"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  assert.ok(contrast("#7a5c26", "#f4f1ea") >= 4.5);
  assert.ok(contrast("#7a5c26", "#ebe6dc") >= 4.5);
  assert.ok(contrast("#7a5c26", "#fffcf7") >= 4.5);
  assert.ok(contrast("#fffaf2", "#7a5c26") >= 4.5);
  assert.ok(contrast("#b7b1a6", "#0e0e0c") >= 4.5);
  assert.ok(contrast("#5e584e", "#f4f1ea") >= 4.5);
  assert.ok(contrast("#d4bc86", "#0e0e0c") >= 4.5);

  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /RAIL_KEY/);
  assert.match(app, /RailNav/);
  assert.match(app, /MoreNav/);
  assert.match(app, /aria-current/);
  const kit = fs.readFileSync(path.join(ROOT, "src/components/crmv3/kit.tsx"), "utf8");
  assert.match(kit, /trapFocus/);
  assert.match(kit, /Escape/);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/nav.ts"), "utf8");
  assert.match(lib, /crmv3-rail-fold/);
  assert.equal(lib.includes("crmv4"), false);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }

  console.log("crmv3 round30 tests passed");
}

main();
