/**
 * CRM v4 round 43 helpers.
 * Run: npx tsx tests/crmv4-round43.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND43_COPY } from "../src/lib/crmv4/copy-round43";
import {
  assignedTo,
  compareWindows,
  currencyCompare,
  datedCount,
  flatTasks,
  leftOut,
  overdueFollows,
  readPins,
  togglePin,
} from "../src/lib/crmv4/round43";

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

  const copy = Object.keys(ROUND43_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND43_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-report-table/);
  assert.match(css, /\.c4-day/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round43.tsx"), "utf8");
  const day = view.slice(view.indexOf("export function DayDesk"));
  assert.equal(day.includes("sendJson"), false);
  assert.equal(day.includes("auditExport"), false);
  assert.equal(day.includes("fetch("), false);
  assert.match(view, /data-print/);
  const nav = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round30.ts"), "utf8");
  assert.match(nav, /"day"/);
  console.log("crmv4 round43 tests passed");
}

main();
