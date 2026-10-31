/**
 * CRM v3 round 43: period cards and My day.
 * Run: npx tsx tests/crmv3-round43.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PERIOD_AR, PERIOD_DE, PERIOD_EN, PERIOD_RU, PERIOD_TR } from "../src/lib/crmv3/copy-period";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  amountGap,
  assignedTo,
  compareWindows,
  currencyCompare,
  datedCount,
  flatTasks,
  leftOut,
  overdueFollows,
  readPins,
  togglePin,
} from "../src/lib/crmv3/period";
import { CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const week = compareWindows("2026-10-31", "week");
  assert.equal(week.currentFrom, "2026-10-26");
  assert.equal(week.currentTo, "2026-10-31");
  assert.equal(week.previousTo, "2026-10-25");
  assert.equal(week.previousFrom, "2026-10-20");
  const month = compareWindows("2026-10-31", "month");
  assert.equal(month.currentFrom, "2026-10-01");
  assert.equal(month.currentTo, "2026-10-31");
  assert.equal(month.previousTo, "2026-09-30");
  const rows = [
    { amount: 10, currency: "TRY", at: "2026-10-28" },
    { amount: 5, currency: "usd", at: "2026-10-02" },
    { amount: 2, currency: "TRY", at: "2026-10-21" },
    { amount: 9, currency: "USD", at: "2026-09-15" },
    { amount: 4, currency: "", at: "2026-10-28" },
    { amount: 1, currency: "TRY", at: "" },
  ];
  const compared = currencyCompare(rows, month);
  const tryRow = compared.find((row) => row.currency === "TRY");
  const usd = compared.find((row) => row.currency === "USD");
  assert.equal(tryRow?.currentCount, 2);
  assert.equal(tryRow?.currentAmount, 12);
  assert.equal(tryRow?.previousCount, 0);
  assert.equal(usd?.currentAmount, 5);
  assert.equal(usd?.previousAmount, 9);
  assert.equal(compared.some((row) => row.currency === ""), false);
  assert.equal(amountGap(12, 5), 7);
  assert.equal(amountGap(usd?.currentAmount || 0, usd?.previousAmount || 0), -4);
  const aside = leftOut(rows, month);
  assert.equal(aside.noCurrency, 1);
  assert.equal(aside.noDate, 1);
  assert.equal(aside.outside, 0);
  assert.equal(datedCount([{ at: "2026-10-03" }, { at: "2026-09-01" }, { at: "" }], month.currentFrom, month.currentTo), 1);
  const people = [
    { id: "a", name: "Ada", assigneeName: "7FX Admin", retentionFollowUpAt: "2026-10-01" },
    { id: "b", name: "Bea", assigneeName: "Other", retentionFollowUpAt: "2026-10-01" },
    { id: "c", name: "Cy", assigneeName: "7fx admin", retentionFollowUpAt: "2026-11-02" },
    { id: "d", name: "Di", assigneeName: "7FX Admin" },
  ];
  const mine = assignedTo(people, "7FX Admin");
  assert.deepEqual(mine.map((row) => row.id), ["a", "c", "d"]);
  assert.deepEqual(overdueFollows(mine, "2026-10-31").map((row) => row.id), ["a"]);
  assert.equal(assignedTo(people, "  ").length, 0);
  assert.deepEqual(flatTasks({ b: [{ id: "1", text: "Call", done: false }], a: [{ id: "2", text: "Note", done: true }] }).map((row) => row.customerId), ["a", "b"]);
  assert.deepEqual(togglePin(["a"], "b"), ["a", "b"]);
  assert.deepEqual(togglePin(["a", "b"], "a"), ["b"]);
  assert.deepEqual(readPins(["a", "a", ""]), ["a"]);

  const copy = Object.keys(PERIOD_EN).sort();
  assert.deepEqual(Object.keys(PERIOD_TR).sort(), copy);
  assert.deepEqual(Object.keys(PERIOD_DE).sort(), copy);
  assert.deepEqual(Object.keys(PERIOD_RU).sort(), copy);
  assert.deepEqual(Object.keys(PERIOD_AR).sort(), copy);
  assert.notEqual(PERIOD_TR.dayTitle, PERIOD_EN.dayTitle);
  assert.notEqual(PERIOD_DE.rpDiff, PERIOD_EN.rpDiff);
  assert.notEqual(PERIOD_RU.rpWeek, PERIOD_EN.rpWeek);
  assert.notEqual(PERIOD_AR.dayOverdue, PERIOD_EN.dayOverdue);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-list-pins", "en"), "Pinned lists");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "day"), true);
  assert.equal(NAV_SECTIONS.some((group) => (group.ids as readonly string[]).includes("day")), true);

  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/period.tsx"), "utf8");
  const day = view.slice(view.indexOf("export function DayDesk"));
  assert.equal(day.includes("sendJson"), false);
  assert.equal(day.includes("auditExport"), false);
  assert.equal(day.includes("fetch("), false);
  assert.match(view, /data-print/);
  assert.match(view, /crmv3-list-pins/);
  assert.match(view, /TASK_KEY/);
  const tasks = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/table.ts"), "utf8");
  assert.match(tasks, /crmv3-tasks/);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-period-table/);
  assert.match(css, /\.c3-day/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/period.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "day"/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round43 tests passed");
}

main();
