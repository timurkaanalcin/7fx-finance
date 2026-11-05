/**
 * CRM v3 customer health and the scratchboard.
 * Run: npx tsx tests/crmv3-round60.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HEALTH_AR, HEALTH_DE, HEALTH_EN, HEALTH_RU, HEALTH_TR } from "../src/lib/crmv3/copy-health";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  SCRATCH_KEY,
  WATCH_KEY,
  addNote,
  archiveNote,
  balanceTotals,
  filterHealth,
  healthMark,
  removeNote,
  togglePin,
  visibleHealth,
  visibleNotes,
} from "../src/lib/crmv3/health";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const recent = new Date(now - 2 * 86400000).toISOString();
  const old = new Date(now - 20 * 86400000).toISOString();
  const rows = [
    { id: "a", name: "Ada", documentsStatus: "APPROVED", ftd: true, lastSeenAt: recent, balance: 10, currency: "USD" },
    { id: "b", name: "Bea", documentsStatus: "PENDING", ftd: false, lastLoginAt: old, balance: 20, currency: "TRY" },
    { id: "c", name: "Cem", documentsStatus: "", ftd: false, balance: 4, currency: "USD" },
    { id: "d", name: "Den", documentsStatus: "REJECTED", ftd: false, balance: 7, currency: "" },
  ];
  assert.equal(healthMark(rows[0], now).score, 3);
  assert.equal(healthMark(rows[1], now).activity, "quiet");
  assert.equal(healthMark(rows[1], now).score, 0);
  assert.equal(healthMark(rows[2], now).activity, "none");
  assert.equal(healthMark({ id: "x", documentsStatus: "NONE" }, now).score, 0);
  assert.deepEqual(filterHealth(rows, "ada", "", now).map((row) => row.id), ["a"]);
  assert.deepEqual(filterHealth(rows, "", "3", now).map((row) => row.id), ["a"]);
  assert.equal(visibleHealth(rows, "", "", ["b"], now)[0].id, "b");
  const totals = balanceTotals(rows);
  assert.equal(totals.find((line) => line.currency === "USD")?.amount, 14);
  assert.equal(totals.find((line) => line.currency === "TRY")?.amount, 20);
  assert.equal(totals.some((line) => line.currency === ""), true);
  assert.notEqual(totals.find((line) => line.currency === "USD")?.amount, 41);
  assert.equal(WATCH_KEY, "crmv3-health-watch");
  assert.equal(SCRATCH_KEY, "crmv3-scratchboard");

  assert.equal(addNote([], { id: "n1", body: "   ", at: "t" }).length, 0);
  const notes = addNote([], { id: "n1", body: " Call Mehmet ", at: "2026-11-05T10:00:00Z" });
  assert.equal(notes[0].body, "Call Mehmet");
  const pinned = togglePin(notes, "n1");
  assert.equal(pinned[0].pinned, true);
  const archived = archiveNote(pinned, "n1", true);
  assert.equal(visibleNotes(archived, "", false).length, 0);
  assert.equal(visibleNotes(archived, "mehmet", true)[0].id, "n1");
  assert.equal(removeNote(archived, "n1").length, 0);

  const copy = Object.keys(HEALTH_EN).sort();
  assert.deepEqual(Object.keys(HEALTH_TR).sort(), copy);
  assert.deepEqual(Object.keys(HEALTH_DE).sort(), copy);
  assert.deepEqual(Object.keys(HEALTH_RU).sort(), copy);
  assert.deepEqual(Object.keys(HEALTH_AR).sort(), copy);
  assert.notEqual(HEALTH_TR.hlTitle, HEALTH_EN.hlTitle);
  assert.notEqual(HEALTH_DE.sbHint, HEALTH_EN.sbHint);
  assert.notEqual(HEALTH_RU.hlWatch, HEALTH_EN.hlWatch);
  assert.notEqual(HEALTH_AR.sbBlank, HEALTH_EN.sbBlank);
  assert.equal(crmv3Text("en", "hlTitle"), "Customer health");
  assert.equal(crmv3Text("tr", "sbTitle"), HEALTH_TR.sbTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-scratchboard", "tr"), "Not tahtası");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "health"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "scratch"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("health"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("scratch"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("health")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("scratch")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-health-strip/);
  assert.match(css, /\.c3-scratch-board/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/health.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-health-strip/);
  assert.match(view, /data-scratch-board/);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-health-watch/);
  assert.match(view, /role=TRADER/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "health"/);
  assert.match(app, /view === "scratch"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round60 tests passed");
}

main();
