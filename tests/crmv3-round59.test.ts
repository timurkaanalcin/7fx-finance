/**
 * CRM v3 risk alerts and bookmark folders.
 * Run: npx tsx tests/crmv3-round59.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ALERT_AR, ALERT_DE, ALERT_EN, ALERT_RU, ALERT_TR } from "../src/lib/crmv3/copy-alerts";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  ACK_KEY,
  FOLDER_KEY,
  MUTE_KEY,
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
} from "../src/lib/crmv3/riskdesk";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(MUTE_KEY, "crmv3-risk-mute");
  assert.equal(ACK_KEY, "crmv3-risk-ack");
  assert.equal(FOLDER_KEY, "crmv3-bookmark-folders");

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

  const copy = Object.keys(ALERT_EN).sort();
  assert.deepEqual(Object.keys(ALERT_TR).sort(), copy);
  assert.deepEqual(Object.keys(ALERT_DE).sort(), copy);
  assert.deepEqual(Object.keys(ALERT_RU).sort(), copy);
  assert.deepEqual(Object.keys(ALERT_AR).sort(), copy);
  assert.notEqual(ALERT_TR.raTitle, ALERT_EN.raTitle);
  assert.notEqual(ALERT_DE.bmHint, ALERT_EN.bmHint);
  assert.notEqual(ALERT_RU.raAck, ALERT_EN.raAck);
  assert.notEqual(ALERT_AR.bmDepth, ALERT_EN.bmDepth);
  assert.equal(crmv3Text("en", "raTitle"), "Risk alerts");
  assert.equal(crmv3Text("de", "bmTitle"), ALERT_DE.bmTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-bookmark-folders", "tr"), "Yer imi klasörleri");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "alerts"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "folders"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("alerts"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("folders"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("alerts")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("folders")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-alert-desk/);
  assert.match(css, /\.c3-folder-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/alerts.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-alert-desk/);
  assert.match(view, /data-folder-pad/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /part=logs/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "alerts"/);
  assert.match(app, /view === "folders"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round59 tests passed");
}

main();
