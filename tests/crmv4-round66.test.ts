/**
 * Desk compare and the end-of-day list.
 * Run: npx tsx tests/crmv4-round66.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND66_COPY } from "../src/lib/crmv4/copy-round66";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addStep,
  clearTicks,
  compareDesks,
  progress,
  starterSteps,
  stepsFromStorage,
  toggleHidden,
  toggleStep,
} from "../src/lib/crmv4/round66";

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

  const seeded = stepsFromStorage(null);
  assert.equal(seeded.seeded, true);
  assert.deepEqual(seeded.steps.map((step) => step.id), ["close-support", "clear-pins", "export-digest"]);
  assert.equal(stepsFromStorage("[]").seeded, false);
  const ticked = toggleStep(starterSteps(), "close-support");
  assert.equal(progress(ticked).done, 1);
  assert.equal(progress(clearTicks(ticked)).done, 0);
  assert.equal(addStep(ticked, "s1", "   ").length, ticked.length);
  assert.equal(addStep(ticked, "s1", " Lock the drawer ").at(-1)?.label, "Lock the drawer");

  const copy = Object.keys(ROUND66_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND66_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "mcTitle"), "Desk compare");
  assert.equal(crmv4Text("de", "eodTitle"), ROUND66_COPY.de.eodTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-compare-strip/);
  assert.match(css, /\.c4-eod-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round66.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-compare-strip/);
  assert.match(view, /data-eod-pad/);
  assert.match(view, /data-confirm/);
  const eod = view.slice(view.indexOf("export function EodList"));
  assert.equal(eod.includes("fetch("), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "compare"/);
  assert.match(app, /view === "eod"/);
  console.log("crmv4 round66 tests passed");
}

main();
