/**
 * CRM v3 filter presets and document status glance.
 * Run: npx tsx tests/crmv3-round94.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FP_AR, FP_DE, FP_EN, FP_RU, FP_TR } from "../src/lib/crmv3/copy-preset";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  DOC_STATUS_KEY,
  PRESET_KEY,
  activeStatus,
  addPreset,
  boardFilters,
  namedStatuses,
  presetName,
  readHiddenStatuses,
  readPresets,
  statusLines,
  statusText,
  toggleStatus,
  visibleDocs,
  visiblePresets,
  visibleStatuses,
} from "../src/lib/crmv3/preset";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(PRESET_KEY, "crmv3-filter-presets");
  assert.equal(DOC_STATUS_KEY, "crmv3-doc-status-hide");
  assert.equal(presetName("  "), "");
  assert.equal(presetName(" Morning\nset "), "Morning set");
  assert.equal(presetName("x".repeat(50)).length, 40);
  assert.deepEqual(boardFilters({ q: " desk ", marked: "1", status: "APPROVED" }), { q: "desk", marked: "1" });
  assert.deepEqual(boardFilters({ marked: "yes" }), {});
  assert.equal(addPreset([], { id: "1", name: "   ", filters: { q: "desk" }, at: "t" }).length, 0);
  const saved = addPreset([], { id: "1", name: "Morning", filters: { q: "desk", marked: "1", status: "APPROVED" }, at: "2026-11-05T10:00:00Z" });
  assert.deepEqual(saved[0].filters, { q: "desk", marked: "1" });
  assert.equal(addPreset(saved, { id: "2", name: "Morning", filters: {}, at: "t" }).length, 1);
  const later = addPreset(saved, { id: "2", name: "Night", filters: {}, at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((preset) => (preset.id === "1" ? { ...preset, pinned: true } : preset));
  assert.equal(visiblePresets(pinned, "", false)[0].id, "1");
  assert.equal(visiblePresets(pinned, "night", false)[0].name, "Night");
  assert.equal(visiblePresets(pinned.map((preset) => ({ ...preset, hidden: preset.id === "2" })), "", true)[0].name, "Night");
  assert.deepEqual(readPresets([{ id: "9", name: "", filters: {} }, { id: "1", name: "Morning", filters: { extra: "no" } }, { id: "1", name: "Again", filters: {} }]).map((preset) => preset.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", status: " PENDING " },
    { id: "b", label: "Bea", status: "PENDING" },
    { id: "c", label: "Cid", status: { status: "APPROVED" } },
    { id: "d", label: "Dot", status: null },
    { id: "e", label: "Eve" },
  ];
  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: "APPROVED" }), "APPROVED");
  assert.equal(statusText(undefined), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("REJECTED"), false);
  assert.deepEqual(visibleDocs(rows, "PENDING", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleDocs(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleDocs(rows, "APPROVED", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenStatuses(["PENDING", "Invented", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "APPROVED", ["PENDING", "APPROVED"]), ["PENDING", "APPROVED"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");

  const copy = Object.keys(FP_EN).sort();
  assert.deepEqual(Object.keys(FP_TR).sort(), copy);
  assert.deepEqual(Object.keys(FP_DE).sort(), copy);
  assert.deepEqual(Object.keys(FP_RU).sort(), copy);
  assert.deepEqual(Object.keys(FP_AR).sort(), copy);
  assert.notEqual(FP_TR.fpTitle, FP_EN.fpTitle);
  assert.notEqual(FP_DE.dsHint, FP_EN.dsHint);
  assert.notEqual(FP_RU.dsBlank, FP_EN.dsBlank);
  assert.notEqual(FP_AR.fpBlank, FP_EN.fpBlank);
  assert.equal(crmv3Text("en", "fpTitle"), "Filter presets");
  assert.equal(crmv3Text("tr", "dsTitle"), FP_TR.dsTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-filter-presets", "de"), "Filtervorlagen");
  assert.equal(keyTitle("crmv3-doc-status-hide", "tr"), "Durum bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "filterpresets"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "docstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("filterpresets"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("docstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("filterpresets")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("docstatus")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-filter-presets/);
  assert.match(css, /\.c3-doc-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/preset.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-filter-presets/);
  assert.match(view, /data-doc-status/);
  assert.match(view, /PRESET_KEY/);
  assert.match(view, /DOC_STATUS_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "filterpresets"/);
  assert.match(app, /view === "docstatus"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round94 tests passed");
}

main();
