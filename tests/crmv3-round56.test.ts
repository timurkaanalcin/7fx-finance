/**
 * CRM v3 lead pipeline and desk quiet prefs.
 * Run: npx tsx tests/crmv3-round56.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LEAD_AR, LEAD_DE, LEAD_EN, LEAD_RU, LEAD_TR } from "../src/lib/crmv3/copy-leads";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import {
  FOCUS_FLAG,
  MUTE_KEY,
  QUIET_KEY,
  WATCH_KEY,
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
} from "../src/lib/crmv3/leads";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(WATCH_KEY, "crmv3-lead-watch");
  assert.equal(MUTE_KEY, "crmv3-alert-mute");
  assert.equal(FOCUS_FLAG, "crmv3-focus-flag");
  assert.equal(QUIET_KEY, "crmv3-quiet-hours");

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

  const copy = Object.keys(LEAD_EN).sort();
  assert.deepEqual(Object.keys(LEAD_TR).sort(), copy);
  assert.deepEqual(Object.keys(LEAD_DE).sort(), copy);
  assert.deepEqual(Object.keys(LEAD_RU).sort(), copy);
  assert.deepEqual(Object.keys(LEAD_AR).sort(), copy);
  assert.notEqual(LEAD_TR.ldTitle, LEAD_EN.ldTitle);
  assert.notEqual(LEAD_DE.qfHint, LEAD_EN.qfHint);
  assert.notEqual(LEAD_RU.ldViewer, LEAD_EN.ldViewer);
  assert.notEqual(LEAD_AR.qfSame, LEAD_EN.qfSame);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-lead-watch", "tr"), "Aday izleme");
  assert.equal(keyTitle("crmv3-quiet-hours", "de"), "Ruhezeiten");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "leads"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "quiet"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("leads"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("quiet"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("leads")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("quiet")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-pipe-desk/);
  assert.match(css, /\.c3-quiet-desk/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/leads.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-lead-board/);
  assert.match(view, /data-quiet-desk/);
  assert.match(view, /stageBody/);
  assert.match(view, /PATCH/);
  assert.match(view, /deskRole/);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/leads.ts"), "utf8");
  assert.match(lib, /saleStatus/);
  const quiet = view.slice(view.indexOf("export function QuietDesk"));
  assert.equal(quiet.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "leads"/);
  assert.match(app, /view === "quiet"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round56 tests passed");
}

main();
