/**
 * Dense customer rows and the agenda day strip.
 * Run: npx tsx tests/crmv4-round51.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND51_COPY } from "../src/lib/crmv4/copy-round51";
import {
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
} from "../src/lib/crmv4/round51";

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

  const copy = Object.keys(ROUND51_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND51_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dense-desk/);
  assert.match(css, /\.c4-daystrip/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round51.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /saleStatus/);
  const strip = view.slice(view.indexOf("export function DayStrip"));
  assert.equal(strip.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dense"/);
  assert.match(app, /DayStrip/);
  console.log("crmv4 round51 tests passed");
}

main();
