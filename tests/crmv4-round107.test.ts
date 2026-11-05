/**
 * Saved desk views and KYC statuses.
 * Run: npx tsx tests/crmv4-round107.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND107_COPY } from "../src/lib/crmv4/copy-round107";
import { crmv4Text } from "../src/lib/crmv4/copy";
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
} from "../src/lib/crmv4/round107";

function main() {
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

  const copy = Object.keys(ROUND107_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND107_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "dvTitle"), "Saved views");
  assert.equal(crmv4Text("tr", "kyTitle"), ROUND107_COPY.tr.kyTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-saved-views/);
  assert.match(css, /\.c4-kyc-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round107.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "PENDING"'), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-saved-views/);
  assert.match(view, /data-kyc-status/);
  assert.match(view, /crmv4:desk-focus/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "savedviews"/);
  assert.match(app, /view === "kycstatus"/);
  console.log("crmv4 round107 tests passed");
}

main();
