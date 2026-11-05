/**
 * Risk alerts and bookmark folders.
 * Run: npx tsx tests/crmv4-round59.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND59_COPY } from "../src/lib/crmv4/copy-round59";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  acknowledge,
  addFolder,
  addLink,
  emptyMarks,
  filterAlerts,
  nestFolder,
  readAcks,
  removeFolder,
  renameFolder,
  searchMarks,
  severity,
  toggleMute,
  visibleAlerts,
} from "../src/lib/crmv4/round59";

function main() {
  const rows = [
    { id: "a", level: "error", action: "DELETE_ORDER", actor: "Ada", target: "book" },
    { id: "b", level: "warn", action: "REJECT_DEPOSIT", actor: "Bea", target: "try" },
    { id: "c", level: "info", action: "STAFF_NOTE", actor: "Cem", target: "desk" },
    { id: "d", level: "other", action: "PING", actor: "Den", target: "x" },
  ];
  assert.equal(severity(rows[0]), "error");
  assert.equal(severity(rows[3]), "");
  assert.deepEqual(filterAlerts(rows, "bea").map((row) => row.id), ["b"]);
  const muted = toggleMute(toggleMute([], "error"), "nope");
  assert.deepEqual(muted, ["error"]);
  assert.deepEqual(visibleAlerts(rows, "", muted, false).map((row) => row.id), ["b", "c", "d"]);
  assert.deepEqual(visibleAlerts(rows, "", muted, true).map((row) => row.id), ["a"]);

  const blank = acknowledge([], "a", "   ", "2026-11-05T12:00:00Z");
  assert.equal(blank[0].note, undefined);
  assert.equal("note" in blank[0], false);
  const noted = acknowledge(blank, "a", " watch ", "2026-11-05T12:01:00Z");
  assert.equal(noted[0].note, "watch");
  assert.equal(noted.length, 1);
  assert.equal(readAcks([{ id: "a", note: "   " }])[0].note, undefined);

  let store = emptyMarks();
  assert.equal(addFolder(store, "a", "   "), store);
  store = addFolder(store, "a", " Morning ");
  store = addFolder(store, "b", "Leads");
  store = addFolder(store, "c", "Deep");
  store = addFolder(store, "d", "Fourth");
  assert.equal(renameFolder(store, "a", "  "), store);
  store = renameFolder(store, "a", " Desk ");
  assert.equal(store.folders.find((folder) => folder.id === "a")?.name, "Desk");
  store = nestFolder(store, "b", "a");
  store = nestFolder(store, "c", "b");
  assert.equal(nestFolder(store, "d", "c").folders.find((folder) => folder.id === "d")?.parentId, null);
  assert.equal(nestFolder(store, "a", "c").folders.find((folder) => folder.id === "a")?.parentId, null);
  store = addLink(store, "l1", "customers", "b", ["customers", "risk"]);
  assert.equal(addLink(store, "l2", "https://evil", null, ["customers"]).links.length, 1);
  const removed = removeFolder(store, "b");
  assert.equal(removed.folders.find((folder) => folder.id === "c")?.parentId, "a");
  assert.equal(removed.links[0].folderId, "a");
  assert.equal(searchMarks(store, "customers").links[0].sectionId, "customers");

  const copy = Object.keys(ROUND59_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND59_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "raTitle"), "Risk alerts");
  assert.equal(crmv4Text("de", "bmTitle"), ROUND59_COPY.de.bmTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-alert-desk/);
  assert.match(css, /\.c4-folder-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round59.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-alert-desk/);
  assert.match(view, /data-folder-pad/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /part=logs/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "alerts"/);
  assert.match(app, /view === "folders"/);
  console.log("crmv4 round59 tests passed");
}

main();
