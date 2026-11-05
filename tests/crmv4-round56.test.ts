/**
 * Lead pipeline and desk quiet prefs.
 * Run: npx tsx tests/crmv4-round56.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND56_COPY } from "../src/lib/crmv4/copy-round56";
import {
  affiliateOf,
  currencyOf,
  filterLeads,
  inQuiet,
  minutes,
  readQuiet,
  shouldAlert,
  sortLeads,
  stageBody,
  stagesOn,
  toggleId,
  toggleMute,
} from "../src/lib/crmv4/round56";

function main() {
  const rows = [
    { id: "a", name: "Ada", email: "ada@desk.test", saleStatus: "NEW", affiliateA: "North", currency: "TRY" },
    { id: "b", name: "Bea", email: "bea@desk.test", saleStatus: "INTERESTED", affiliateB: "South", currency: "EUR" },
    { id: "c", name: "Cy", email: "cy@desk.test", saleStatus: "", campaign: "", currency: "USD" },
  ];
  assert.equal(affiliateOf(rows[1]), "South");
  assert.equal(affiliateOf(rows[2]), "");
  assert.equal(currencyOf(rows[0]), "TRY");
  assert.deepEqual(stagesOn(rows), ["INTERESTED", "NEW"]);
  assert.deepEqual(filterLeads(rows, "NEW", "").map((row) => row.id), ["a"]);
  assert.deepEqual(filterLeads(rows, "none", "").map((row) => row.id), ["c"]);
  assert.deepEqual(filterLeads(rows, "", "south").map((row) => row.id), ["b"]);
  assert.equal(filterLeads(rows, "NEW", "bea").length, 0);
  assert.equal(sortLeads(rows, toggleId([], "c"))[0].id, "c");
  assert.equal(stageBody("  "), null);
  assert.deepEqual(stageBody(" NEW "), { saleStatus: "NEW" });
  assert.equal(rows.reduce((sum, row) => sum + row.currency.length, 0) > 3, true);

  assert.equal(minutes("09:30"), 570);
  assert.equal(minutes("24:00"), null);
  assert.equal(inQuiet(600, "09:00", "17:00"), true);
  assert.equal(inQuiet(500, "09:00", "17:00"), false);
  assert.equal(inQuiet(600, "09:00", "09:00"), false);
  assert.equal(inQuiet(23 * 60, "22:00", "07:00"), true);
  assert.equal(inQuiet(12 * 60, "22:00", "07:00"), false);
  assert.deepEqual(readQuiet({ start: "22:00", end: "bad" }), { start: "22:00", end: "" });
  const open = { kind: "chat", muted: [], focus: false, start: "", end: "", nowMin: 600 };
  assert.equal(shouldAlert(open), true);
  assert.equal(shouldAlert({ ...open, muted: toggleMute([], "chat") }), false);
  assert.equal(shouldAlert({ ...open, focus: true }), false);
  assert.equal(shouldAlert({ ...open, start: "09:00", end: "17:00" }), false);
  assert.equal(shouldAlert({ ...open, kind: "ticket", muted: ["chat"] }), true);

  const copy = Object.keys(ROUND56_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND56_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pipe-desk/);
  assert.match(css, /\.c4-quiet-desk/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round56.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /data-lead-board/);
  assert.match(view, /data-quiet-desk/);
  assert.match(view, /stageBody/);
  assert.match(view, /PATCH/);
  const lib = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round56.ts"), "utf8");
  assert.match(lib, /saleStatus/);
  assert.match(view, /storedRole/);
  const quiet = view.slice(view.indexOf("export function QuietDesk"));
  assert.equal(quiet.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "leads"/);
  assert.match(app, /view === "quiet"/);
  assert.match(app, /shouldAlert/);
  assert.match(app, /FOCUS_FLAG/);
  console.log("crmv4 round56 tests passed");
}

main();
