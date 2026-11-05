/**
 * CRM v3 conversation and today's UTC strip.
 * Run: npx tsx tests/crmv3-round49.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { THREAD_AR, THREAD_DE, THREAD_EN, THREAD_RU, THREAD_TR } from "../src/lib/crmv3/copy-thread";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  CANNED_KEY,
  DRAFT_KEY,
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
} from "../src/lib/crmv3/thread";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const day = "2026-11-05";
  assert.equal(utcDay(Date.parse("2026-11-05T23:30:00Z")), day);
  assert.equal(isOnDay("2026-11-05T01:00:00Z", day), true);
  assert.equal(isOnDay("2026-11-04T23:00:00Z", day), false);
  assert.equal(isOnDay("", day), false);
  assert.equal(isOnDay(null, day), false);
  assert.equal(DRAFT_KEY, "crmv3-thread-drafts");
  assert.equal(CANNED_KEY, "crmv3-thread-canned");
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

  const copy = Object.keys(THREAD_EN).sort();
  assert.deepEqual(Object.keys(THREAD_TR).sort(), copy);
  assert.deepEqual(Object.keys(THREAD_DE).sort(), copy);
  assert.deepEqual(Object.keys(THREAD_RU).sort(), copy);
  assert.deepEqual(Object.keys(THREAD_AR).sort(), copy);
  assert.notEqual(THREAD_TR.cvTitle, THREAD_EN.cvTitle);
  assert.notEqual(THREAD_DE.hmHint, THREAD_EN.hmHint);
  assert.notEqual(THREAD_RU.cvEnter, THREAD_EN.cvEnter);
  assert.notEqual(THREAD_AR.hmEmpty, THREAD_EN.hmEmpty);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-thread-drafts", "en"), "Thread drafts");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "thread"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("thread"), true);
  assert.equal(NAV_SECTIONS.some((group) => (group.ids as readonly string[]).includes("thread")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-thread/);
  assert.match(css, /\.c3-today-strip/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/thread.tsx"), "utf8");
  assert.match(view, /if \(event\.key === "Enter"\) event\.preventDefault\(\)/);
  assert.equal(view.includes("<form"), false);
  assert.equal(view.includes("crmv4"), false);
  const home = view.slice(view.indexOf("export function TodayStrip"));
  assert.equal(home.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "thread"/);
  const support = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Support.tsx"), "utf8");
  assert.match(support, /ThreadPanel/);
  const overview = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Overview.tsx"), "utf8");
  assert.match(overview, /TodayStrip/);
  console.log("crmv3 round49 tests passed");
}

main();
