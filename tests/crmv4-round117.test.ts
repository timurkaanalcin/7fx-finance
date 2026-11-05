/**
 * Visit notes and document statuses.
 * Run: npx tsx tests/crmv4-round117.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND117_COPY } from "../src/lib/crmv4/copy-round117";
import { crmv4Text } from "../src/lib/crmv4/copy";
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
} from "../src/lib/crmv4/round117";

function main() {
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

  const copy = Object.keys(ROUND117_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND117_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "vlTitle"), "Visit log");
  assert.equal(crmv4Text("tr", "ydTitle"), ROUND117_COPY.tr.ydTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-visit-log/);
  assert.match(css, /\.c4-kyc-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round117.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "visitlog"/);
  assert.match(app, /view === "kycdocstat"/);
  console.log("crmv4 round117 tests passed");
}

main();
