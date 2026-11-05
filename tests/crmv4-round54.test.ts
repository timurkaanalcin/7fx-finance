/**
 * Compliance queue and the shortcut rail.
 * Run: npx tsx tests/crmv4-round54.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND54_COPY } from "../src/lib/crmv4/copy-round54";
import {
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
} from "../src/lib/crmv4/round54";

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

  const copy = Object.keys(ROUND54_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND54_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-case-queue/);
  assert.match(css, /\.c4-shortcut-rail/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round54.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /data-case-queue/);
  assert.match(view, /data-shortcut-rail/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /storedRole/);
  const queue = view.slice(0, view.indexOf("export function ShortcutRail"));
  assert.match(queue, /sendJson/);
  assert.match(queue, /reviewBody/);
  const railView = view.slice(view.indexOf("export function ShortcutRail"));
  assert.equal(railView.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cases"/);
  assert.match(app, /view === "shortcuts"/);
  console.log("crmv4 round54 tests passed");
}

main();
