/**
 * CRM v3 compliance queue and the shortcut rail.
 * Run: npx tsx tests/crmv3-round54.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PIN_KEY,
  SHORTCUT_KEY,
  addShortcut,
  filterCases,
  moveVisible,
  readShortcuts,
  removeShortcut,
  reviewBody,
  sortCases,
  toggleHidden,
  toggleId,
  visibleShortcuts,
} from "../src/lib/crmv3/cases";
import { CASE_AR, CASE_DE, CASE_EN, CASE_RU, CASE_TR } from "../src/lib/crmv3/copy-cases";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const cases = [
    { id: "c1", name: "Passport", docType: "ID", status: "PENDING", trader: "Ada", traderId: "a", desk: "Istanbul" },
    { id: "c2", name: "Bill", docType: "ADDRESS", status: "APPROVED", trader: "Bea", traderId: "b", desk: "EU" },
    { id: "c3", name: "Selfie", docType: "SELFIE", status: "rejected", trader: "Ada", traderId: "a" },
  ];
  assert.deepEqual(filterCases(cases, "PENDING", "").map((row) => row.id), ["c1"]);
  assert.deepEqual(filterCases(cases, "", "ada").map((row) => row.id), ["c1", "c3"]);
  assert.equal(filterCases(cases, "APPROVED", "passport").length, 0);
  const pinned = sortCases(cases, toggleId([], "c3"));
  assert.equal(pinned[0].id, "c3");
  assert.equal(toggleId(["c3"], "c3").includes("c3"), false);
  assert.equal(PIN_KEY, "crmv3-case-pins");
  assert.equal(SHORTCUT_KEY, "crmv3-shortcuts");

  const blank = reviewBody("c1", "APPROVED", "   ");
  assert.deepEqual(blank, { action: "review", id: "c1", status: "APPROVED" });
  assert.equal(blank && "note" in blank, false);
  assert.equal(reviewBody("c1", "REJECTED", " blurry ")?.note, "blurry");
  assert.equal(reviewBody("c1", "", "reason"), null);
  assert.equal(reviewBody("", "PENDING", ""), null);

  const allowed = ["customers", "blotter", "cases"];
  let rail = addShortcut([], "customers", allowed);
  rail = addShortcut(rail, "blotter", allowed);
  rail = addShortcut(rail, "nope", allowed);
  assert.deepEqual(rail.map((row) => row.id), ["customers", "blotter"]);
  assert.equal(addShortcut(rail, "customers", allowed).length, rail.length);
  rail = moveVisible(rail, "blotter", -1);
  assert.deepEqual(rail.map((row) => row.id), ["blotter", "customers"]);
  rail = toggleHidden(rail, "customers");
  assert.deepEqual(visibleShortcuts(rail).map((row) => row.id), ["blotter"]);
  assert.equal(readShortcuts([{ id: "cases", hidden: true }, "nope"], allowed)[0].hidden, true);
  assert.equal(removeShortcut(rail, "blotter").some((row) => row.id === "blotter"), false);
  assert.equal(readShortcuts("nope", allowed).length, 0);

  const copy = Object.keys(CASE_EN).sort();
  assert.deepEqual(Object.keys(CASE_TR).sort(), copy);
  assert.deepEqual(Object.keys(CASE_DE).sort(), copy);
  assert.deepEqual(Object.keys(CASE_RU).sort(), copy);
  assert.deepEqual(Object.keys(CASE_AR).sort(), copy);
  assert.notEqual(CASE_TR.cqTitle, CASE_EN.cqTitle);
  assert.notEqual(CASE_DE.scHint, CASE_EN.scHint);
  assert.notEqual(CASE_RU.cqViewer, CASE_EN.cqViewer);
  assert.notEqual(CASE_AR.scEmpty, CASE_EN.scEmpty);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-case-pins", "tr"), "Dosya sabitleme");
  assert.equal(keyTitle("crmv3-shortcuts", "de"), "Kurzleiste");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "cases"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "shortcuts"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("cases"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("shortcuts"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("cases")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("shortcuts")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-case-queue/);
  assert.match(css, /\.c3-shortcut-rail/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/cases.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-case-queue/);
  assert.match(view, /data-shortcut-rail/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /deskRole/);
  const queue = view.slice(0, view.indexOf("export function ShortcutRail"));
  assert.match(queue, /sendJson/);
  assert.match(queue, /reviewBody/);
  const railView = view.slice(view.indexOf("export function ShortcutRail"));
  assert.equal(railView.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "cases"/);
  assert.match(app, /view === "shortcuts"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round54 tests passed");
}

main();
