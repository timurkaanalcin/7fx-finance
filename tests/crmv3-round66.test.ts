/**
 * CRM v3 desk compare and the end-of-day list.
 * Run: npx tsx tests/crmv3-round66.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { COMPARE_AR, COMPARE_DE, COMPARE_EN, COMPARE_RU, COMPARE_TR } from "../src/lib/crmv3/copy-compare";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  EOD_KEY,
  HIDE_KEY,
  addStep,
  clearTicks,
  compareDesks,
  progress,
  starterSteps,
  stepsFromStorage,
  toggleHidden,
  toggleStep,
} from "../src/lib/crmv3/compare";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const people = [
    { id: "a", name: "Ada", desk: "Istanbul A" },
    { id: "b", name: "Bea", desk: "Istanbul A" },
    { id: "c", name: "Cem", desk: "" },
  ];
  const deposits = [
    { id: "d1", amount: 10, currency: "USD", user: { id: "a" } },
    { id: "d2", amount: 5, currency: "USD", userId: "b" },
    { id: "d3", amount: 20, currency: "TRY", user: { id: "a" } },
    { id: "d4", amount: 7, currency: "EUR", user: { id: "missing" } },
    { id: "d5", amount: 3, currency: "", user: { id: "c" } },
  ];
  const columns = compareDesks(people, deposits, "", [], false);
  const istanbul = columns.find((column) => column.desk === "Istanbul A");
  assert.equal(istanbul?.count, 2);
  assert.equal(istanbul?.lines.find((line) => line.currency === "USD")?.amount, 15);
  assert.equal(istanbul?.lines.find((line) => line.currency === "TRY")?.amount, 20);
  assert.equal(istanbul?.lines.some((line) => line.currency === "EUR"), false);
  const none = columns.find((column) => column.desk === "");
  assert.equal(none?.lines.find((line) => line.currency === "")?.amount, 3);
  assert.equal(compareDesks(people, deposits, "ada", [], false)[0].desk, "Istanbul A");
  const hidden = toggleHidden([], "Istanbul A");
  assert.equal(compareDesks(people, deposits, "", hidden, false).some((column) => column.desk === "Istanbul A"), false);
  assert.equal(compareDesks(people, deposits, "", hidden, true)[0].desk, "Istanbul A");
  assert.equal(HIDE_KEY, "crmv3-desk-hide");
  assert.equal(EOD_KEY, "crmv3-eod-steps");

  const seeded = stepsFromStorage(null);
  assert.equal(seeded.seeded, true);
  assert.deepEqual(seeded.steps.map((step) => step.id), ["close-support", "clear-pins", "export-digest"]);
  assert.equal(stepsFromStorage("[]").seeded, false);
  const ticked = toggleStep(starterSteps(), "close-support");
  assert.equal(progress(ticked).done, 1);
  assert.equal(progress(clearTicks(ticked)).done, 0);
  assert.equal(addStep(ticked, "s1", "   ").length, ticked.length);
  assert.equal(addStep(ticked, "s1", " Lock the drawer ").at(-1)?.label, "Lock the drawer");

  const copy = Object.keys(COMPARE_EN).sort();
  assert.deepEqual(Object.keys(COMPARE_TR).sort(), copy);
  assert.deepEqual(Object.keys(COMPARE_DE).sort(), copy);
  assert.deepEqual(Object.keys(COMPARE_RU).sort(), copy);
  assert.deepEqual(Object.keys(COMPARE_AR).sort(), copy);
  assert.notEqual(COMPARE_TR.mcTitle, COMPARE_EN.mcTitle);
  assert.notEqual(COMPARE_DE.eodHint, COMPARE_EN.eodHint);
  assert.notEqual(COMPARE_RU.mcHide, COMPARE_EN.mcHide);
  assert.notEqual(COMPARE_AR.eodBlank, COMPARE_EN.eodBlank);
  assert.equal(crmv3Text("en", "mcTitle"), "Desk compare");
  assert.equal(crmv3Text("de", "eodTitle"), COMPARE_DE.eodTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-eod-steps", "tr"), "Gün sonu adımları");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "compare"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "eod"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("compare"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("eod"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("compare")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("eod")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-compare-strip/);
  assert.match(css, /\.c3-eod-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/compare.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-compare-strip/);
  assert.match(view, /data-eod-pad/);
  assert.match(view, /data-confirm/);
  const eod = view.slice(view.indexOf("export function EodList"));
  assert.equal(eod.includes("fetch("), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "compare"/);
  assert.match(app, /view === "eod"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round66 tests passed");
}

main();
