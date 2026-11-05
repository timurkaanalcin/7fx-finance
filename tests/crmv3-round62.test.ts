/**
 * CRM v3 document watch and panel density.
 * Run: npx tsx tests/crmv3-round62.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EXPIRY_AR, EXPIRY_DE, EXPIRY_EN, EXPIRY_RU, EXPIRY_TR } from "../src/lib/crmv3/copy-expiry";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  PANEL_KEY,
  SNOOZE_KEY,
  WINDOW_KEY,
  clearSnooze,
  dateSource,
  dueState,
  isSnoozed,
  loadedDate,
  readPanel,
  readWindow,
  reviewPlan,
  snoozeUntil,
  visibleDocs,
  withSnooze,
} from "../src/lib/crmv3/expiry";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const old = new Date(now - 40 * 86400000).toISOString();
  const fresh = new Date(now - 2 * 86400000).toISOString();
  const rows = [
    { id: "a", name: "Passport", docType: "ID", status: "PENDING", trader: "Ada", createdAt: old, reviewedAt: null },
    { id: "b", name: "Bill", docType: "ADDRESS", status: "APPROVED", trader: "Bea", createdAt: old, reviewedAt: fresh },
    { id: "c", name: "Blank", status: "PENDING", trader: "Cem" },
  ];
  assert.equal(dateSource(rows[0]), "created");
  assert.equal(dateSource(rows[1]), "reviewed");
  assert.equal(loadedDate(rows[1]), new Date(fresh).toISOString());
  assert.equal(dueState(rows[0], now, 30), "due");
  assert.equal(dueState(rows[0], now, 90), "fresh");
  assert.equal(dueState(rows[1], now, 30), "fresh");
  assert.equal(dueState(rows[2], now, 30), "none");
  assert.equal(loadedDate(rows[2]), null);
  assert.deepEqual(visibleDocs(rows, "ada", false, {}, false, now, 30).map((row) => row.id), ["a"]);
  assert.deepEqual(visibleDocs(rows, "", true, {}, false, now, 30).map((row) => row.id), ["a"]);
  const until = snoozeUntil(now, 60);
  assert.equal(isSnoozed(until, now + 1000), true);
  const snooze = withSnooze({}, "a", until);
  assert.deepEqual(visibleDocs(rows, "", false, snooze, false, now + 1000, 30).map((row) => row.id), ["b", "c"]);
  assert.equal(visibleDocs(rows, "", false, snooze, true, now + 1000, 30)[0].id, "a");
  assert.equal(clearSnooze(snooze, "a").a, undefined);
  assert.equal(SNOOZE_KEY, "crmv3-doc-snooze");
  assert.equal(WINDOW_KEY, "crmv3-doc-window");
  assert.equal(PANEL_KEY, "crmv3-panel-density");

  const blank = reviewPlan("doc-1", "APPROVED", "   ");
  assert.deepEqual(blank, { action: "review", id: "doc-1", status: "APPROVED" });
  assert.equal(blank && "note" in blank, false);
  assert.equal(reviewPlan("doc-1", "REJECTED", " watch ")?.note, "watch");
  assert.equal(reviewPlan("doc-1", "PENDING", "x"), null);
  assert.equal(readWindow("90"), 90);
  assert.equal(readWindow("nope"), 30);
  assert.equal(readPanel("compact"), "compact");
  assert.equal(readPanel("wide"), "desk");

  const copy = Object.keys(EXPIRY_EN).sort();
  assert.deepEqual(Object.keys(EXPIRY_TR).sort(), copy);
  assert.deepEqual(Object.keys(EXPIRY_DE).sort(), copy);
  assert.deepEqual(Object.keys(EXPIRY_RU).sort(), copy);
  assert.deepEqual(Object.keys(EXPIRY_AR).sort(), copy);
  assert.notEqual(EXPIRY_TR.exTitle, EXPIRY_EN.exTitle);
  assert.notEqual(EXPIRY_DE.lyHint, EXPIRY_EN.lyHint);
  assert.notEqual(EXPIRY_RU.exSnooze, EXPIRY_EN.exSnooze);
  assert.notEqual(EXPIRY_AR.lyPad, EXPIRY_EN.lyPad);
  assert.equal(crmv3Text("en", "exTitle"), "Document watch");
  assert.equal(crmv3Text("ar", "lyTitle"), EXPIRY_AR.lyTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-panel-density", "tr"), "Panel yoğunluğu");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "expiry"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "density"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("expiry"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("density"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("expiry")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("density")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-expiry-desk/);
  assert.match(css, /\.c3-panel-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/expiry.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-expiry-desk/);
  assert.match(view, /data-panel-strip/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /reviewPlan/);
  assert.match(view, /deskRole/);
  const strip = view.slice(view.indexOf("export function PanelDensityStrip"));
  assert.equal(strip.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "expiry"/);
  assert.match(app, /view === "density"/);
  assert.match(app, /data-panel=/);
  assert.match(app, /crmv3:panel/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round62 tests passed");
}

main();
