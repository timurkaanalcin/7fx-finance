/**
 * CRM v3 dense customer rows and the agenda day strip.
 * Run: npx tsx tests/crmv3-round51.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DENSE_AR, DENSE_DE, DENSE_EN, DENSE_RU, DENSE_TR } from "../src/lib/crmv3/copy-dense";
import {
  COLUMN_KEY,
  DONE_KEY,
  allIds,
  dayItems,
  dayWindow,
  filterRows,
  isOverdue,
  itemsOn,
  readColumns,
  toggleColumn,
  toggleDone,
  utcToday,
} from "../src/lib/crmv3/dense";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const columns = toggleColumn(readColumns(["email", "nope"]), "country");
  assert.deepEqual(columns, ["email", "country"]);
  assert.deepEqual(toggleColumn(columns, "email"), ["country"]);
  assert.deepEqual(toggleColumn(["desk"], "desk"), ["desk"]);
  const rows = [
    { id: "1", name: "Ada", email: "ada@desk.test", country: "TR", currency: "TRY" },
    { id: "2", name: "Bea", email: "bea@desk.test", country: "DE", currency: "USD" },
  ];
  assert.equal(filterRows(rows, "ada").length, 1);
  assert.deepEqual(allIds(rows, true), ["1", "2"]);
  assert.deepEqual(allIds(rows, false), []);
  assert.equal(COLUMN_KEY, "crmv3-dense-columns");
  assert.equal(DONE_KEY, "crmv3-day-done");

  const today = "2026-11-05";
  assert.equal(utcToday(Date.parse("2026-11-05T23:00:00Z")), today);
  assert.equal(isOverdue("2026-11-04", today), true);
  assert.equal(isOverdue(today, today), false);
  assert.equal(isOverdue("", today), false);
  const items = dayItems(
    [{ id: "1", name: "Ada", at: "2026-11-04T01:00:00Z" }, { id: "2", name: "Bea", at: "" }],
    [{ id: "r1", name: "Call", at: "2026-11-05T09:00:00Z" }],
  );
  assert.equal(items.length, 2);
  assert.equal(itemsOn(items, "2026-11-04")[0].kind, "follow");
  assert.equal(itemsOn(items, "2026-11-05")[0].kind, "task");
  assert.equal(dayWindow(today, 7).length, 7);
  assert.equal(dayWindow(today, 7)[0], today);
  const done = toggleDone(["follow:1"], "follow:1");
  assert.equal(done.includes("follow:1"), false);
  assert.equal(toggleDone(done, "task:r1").includes("task:r1"), true);

  const copy = Object.keys(DENSE_EN).sort();
  assert.deepEqual(Object.keys(DENSE_TR).sort(), copy);
  assert.deepEqual(Object.keys(DENSE_DE).sort(), copy);
  assert.deepEqual(Object.keys(DENSE_RU).sort(), copy);
  assert.deepEqual(Object.keys(DENSE_AR).sort(), copy);
  assert.notEqual(DENSE_TR.dnTitle, DENSE_EN.dnTitle);
  assert.notEqual(DENSE_DE.dyHint, DENSE_EN.dyHint);
  assert.notEqual(DENSE_RU.dnViewer, DENSE_EN.dnViewer);
  assert.notEqual(DENSE_AR.dyEmpty, DENSE_EN.dyEmpty);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-dense-columns", "tr"), "Sıkı sütunlar");
  assert.equal(keyTitle("crmv3-day-done", "de"), "Tag erledigt");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "dense"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("dense"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("dense")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-dense-table/);
  assert.match(css, /\.c3-daystrip/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/dense.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /saleStatus/);
  assert.equal(view.includes("crmv4"), false);
  const strip = view.slice(view.indexOf("export function DayStrip"));
  assert.equal(strip.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "dense"/);
  const agenda = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/book.tsx"), "utf8");
  assert.match(agenda, /DayStrip/);
  console.log("crmv3 round51 tests passed");
}

main();
