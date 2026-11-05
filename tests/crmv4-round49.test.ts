/**
 * Support thread and today's loaded work.
 * Run: npx tsx tests/crmv4-round49.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND49_COPY } from "../src/lib/crmv4/copy-round49";
import {
  countOnDay,
  dropCanned,
  enterSends,
  filterMessages,
  isOnDay,
  readDrafts,
  saveCanned,
  sumsOnDay,
  utcDay,
  whoOf,
  writeDraft,
} from "../src/lib/crmv4/round49";

function main() {
  const day = "2026-11-05";
  assert.equal(utcDay(Date.parse("2026-11-05T23:30:00Z")), day);
  assert.equal(isOnDay("2026-11-05T01:00:00Z", day), true);
  assert.equal(isOnDay("2026-11-04T23:00:00Z", day), false);
  assert.equal(isOnDay("", day), false);
  assert.equal(isOnDay(null, day), false);
  const rows = [
    { amount: 10, currency: "TRY", createdAt: "2026-11-05T01:00:00Z" },
    { amount: 5, currency: "USD", createdAt: "2026-11-05T02:00:00Z" },
    { amount: 80, currency: "TRY", createdAt: "2026-11-04T02:00:00Z" },
    { amount: 3, currency: "", createdAt: "2026-11-05T03:00:00Z" },
  ];
  const sums = sumsOnDay(rows, day);
  assert.equal(sums.find((row) => row.currency === "TRY")?.amount, 10);
  assert.equal(sums.find((row) => row.currency === "USD")?.amount, 5);
  assert.equal(sums.some((row) => row.amount === 15), false);
  assert.equal(sums.some((row) => row.amount === 90), false);
  assert.equal(countOnDay([{ at: "2026-11-05T01:00:00Z" }, { at: "" }, { at: "2026-11-01T00:00:00Z" }], day), 1);
  assert.equal(countOnDay([], day), 0);

  assert.equal(whoOf({ automatic: true, workerId: "s" }), "auto");
  assert.equal(whoOf({ workerId: "s" }), "staff");
  assert.equal(whoOf({}), "customer");
  assert.equal(filterMessages([{ id: "1", body: "Hello Ada" }, { id: "2", body: "Later" }], "ada").length, 1);
  assert.equal(enterSends("Enter"), false);
  assert.equal(enterSends("a"), false);
  const drafts = writeDraft(readDrafts({ u1: " hold " }), "u1", "");
  assert.equal(drafts.u1, undefined);
  assert.equal(writeDraft({}, "u2", "note").u2, "note");
  const canned = saveCanned([], "Hold", "We will look");
  assert.equal(canned.length, 1);
  assert.equal(saveCanned(canned, "", "x").length, 1);
  assert.equal(dropCanned(canned, canned[0].id).length, 0);

  const copy = Object.keys(ROUND49_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND49_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-thread-desk/);
  assert.match(css, /\.c4-today-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round49.tsx"), "utf8");
  assert.match(view, /if \(event\.key === "Enter"\) event\.preventDefault\(\)/);
  assert.equal(view.includes("<form"), false);
  const home = view.slice(view.indexOf("export function TodayStrip"));
  assert.equal(home.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "thread"/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /ThreadPanel/);
  const overview = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Overview.tsx"), "utf8");
  assert.match(overview, /TodayStrip/);
  console.log("crmv4 round49 tests passed");
}

main();
