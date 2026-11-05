/**
 * Visit notes and document statuses.
 * Run: npx tsx tests/crmv3-round117.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { VL_AR, VL_DE, VL_EN, VL_RU, VL_TR } from "../src/lib/crmv3/copy-visitlog";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { DOC_STATUS_KEY, VISIT_KEY } from "../src/lib/crmv3/visitlog";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeStatus,
  addNote,
  namedStatuses,
  noteText,
  placeLabel,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleDocs,
  visibleNotes,
  visibleStatuses,
} from "../src/lib/crmv3/visitlog";

function main() {
  assert.equal(VISIT_KEY, "crmv3-visit-log");
  assert.equal(DOC_STATUS_KEY, "crmv3-kyc-doc-status-hide");
  assert.equal(noteText("  Desk\nvisit  "), "Desk visit");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(placeLabel("  HQ  "), "HQ");
  assert.equal(placeLabel("   "), "");
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Visit", place: "  ", pinned: 1 }]), [
    { id: "2", text: "Visit", place: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Desk visit ", place: " HQ " });
  assert.deepEqual(saved, [{ id: "a", text: "Desk visit", place: "HQ", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Desk visit" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "desk").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "hq"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(resetNotes(), []);

  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: " APPROVED " }), "APPROVED");
  assert.equal(statusText(""), "");
  assert.equal(statusText(1 as never), "");
  assert.equal(statusText({ docType: "PASSPORT" } as never), "");
  const rows = [
    { id: "d1", label: "Ada passport", status: "PENDING" },
    { id: "d2", label: "Bea id", status: { status: "APPROVED" } },
    { id: "d3", label: "Cid passport", status: "PENDING" },
    { id: "d4", label: "Dot", status: "" },
    { id: "d5", label: "Eve", status: { docType: "ID" } as never },
  ];
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.deepEqual(visibleDocs(rows, "PENDING", false, "ada").map((row) => row.id), ["d1"]);
  assert.deepEqual(visibleDocs(rows, "", true, "").map((row) => row.id), ["d4", "d5"]);
  assert.deepEqual(readHiddenStatuses(["PENDING", "NEW", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "NEW", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");
  assert.equal(statusLines(rows).every((line) => !("amount" in line)), true);

  const copy = Object.keys(VL_EN).sort();
  for (const table of [VL_TR, VL_DE, VL_RU, VL_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "vlTitle"), "Visit log");
  assert.equal(crmv3Text("tr", "ydTitle"), VL_TR.ydTitle);
  assert.equal(keyTitle("crmv3-visit-log", "de"), "Besuchsprotokoll");
  assert.equal(keyTitle("crmv3-kyc-doc-status-hide", "ar"), "حالات المستندات");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "visitlog"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "kycdocstat"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("visitlog"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("kycdocstat"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("visitlog")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("kycdocstat")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-visit-log/);
  assert.match(css, /\.c3-kyc-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/visitlog.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("docType"), false);
  assert.match(view, /\/api\/admin\/documents\?take=40/);
  assert.match(view, /data-visit-log/);
  assert.match(view, /data-kyc-stat/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /kyc/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "visitlog"/);
  assert.match(app, /view === "kycdocstat"/);
  console.log("crmv3 round117 tests passed");
}

main();
