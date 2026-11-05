/**
 * Saved desk views and KYC statuses.
 * Run: npx tsx tests/crmv3-round107.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DV_AR, DV_DE, DV_EN, DV_RU, DV_TR } from "../src/lib/crmv3/copy-savedviews";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { KYC_STATUS_KEY, VIEW_KEY } from "../src/lib/crmv3/savedviews";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeStatus,
  addView,
  clearView,
  deskFilters,
  hiddenPanels,
  namedStatuses,
  panelList,
  readHiddenStatuses,
  readViews,
  statusLines,
  statusText,
  toggleStatus,
  viewName,
  visibleDocs,
  visibleStatuses,
  visibleViews,
} from "../src/lib/crmv3/savedviews";

function main() {
  assert.equal(VIEW_KEY, "crmv3-saved-views");
  assert.equal(KYC_STATUS_KEY, "crmv3-kyc-status-hide");
  assert.equal(viewName("  "), "");
  assert.equal(viewName(" Quiet\nrail "), "Quiet rail");
  assert.equal(viewName("x".repeat(50)).length, 40);
  assert.deepEqual(panelList(["rail", "logo", "rail", "sections"]), ["rail", "sections"]);
  assert.deepEqual(deskFilters({ q: " Ada ", marked: "yes", extra: "no" }), { q: "Ada" });
  assert.deepEqual(deskFilters({ marked: "1" }), { marked: "1" });
  assert.equal(addView([], { id: "1", name: "   ", panels: ["rail"], filters: {}, at: "t" }).length, 0);
  const saved = addView([], { id: "1", name: "Quiet rail", panels: ["sections", "tools", "nope"], filters: { q: "Ada", marked: "1", extra: "x" }, at: "2026-11-05T10:00:00Z" });
  assert.deepEqual(saved[0].panels, ["sections", "tools"]);
  assert.deepEqual(saved[0].filters, { q: "Ada", marked: "1" });
  assert.deepEqual(hiddenPanels(saved[0]), ["rail"]);
  assert.equal(addView(saved, { id: "2", name: "Quiet rail", panels: [], filters: {}, at: "t" }).length, 1);
  assert.equal(clearView(saved, "1").length, 0);
  assert.equal(visibleViews(saved, "quiet")[0].id, "1");
  assert.equal(visibleViews(saved, "zzz").length, 0);
  assert.deepEqual(readViews([{ id: "9", name: "  ", panels: ["rail"] }, { id: "1", name: "Quiet rail", panels: ["logo"] }]).map((view) => view.id), ["1"]);

  const rows = [
    { id: "a", label: "Passport", status: " PENDING " },
    { id: "b", label: "Utility", status: "PENDING" },
    { id: "c", label: "Selfie", status: "APPROVED" },
    { id: "d", label: "Blank", status: "", docType: "ID" },
    { id: "e", label: "None", status: null },
  ];
  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: "REJECTED", docType: "ID" }), "REJECTED");
  assert.equal(statusText({ docType: "ID" }), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("PENDING"), false);
  assert.deepEqual(visibleDocs(rows, "PENDING", false, "utility").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleDocs(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenStatuses(["PENDING", "FILLED", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "FILLED", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");

  const copy = Object.keys(DV_EN).sort();
  for (const table of [DV_TR, DV_DE, DV_RU, DV_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "dvTitle"), "Saved views");
  assert.equal(crmv3Text("tr", "kyTitle"), DV_TR.kyTitle);
  assert.equal(keyTitle("crmv3-saved-views", "de"), "Gespeicherte Ansichten");
  assert.equal(keyTitle("crmv3-kyc-status-hide", "ar"), "حالة التحقق");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "savedviews"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "kycstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("savedviews"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("kycstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("savedviews")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("kycstatus")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-saved-views/);
  assert.match(css, /\.c3-kyc-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/savedviews.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "PENDING"'), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-saved-views/);
  assert.match(view, /data-kyc-status/);
  assert.match(view, /crmv3:desk-focus/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "savedviews"/);
  assert.match(app, /view === "kycstatus"/);
  console.log("crmv3 round107 tests passed");
}

main();
