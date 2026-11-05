/**
 * Meeting notes and order statuses.
 * Run: npx tsx tests/crmv4-round114.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND114_COPY } from "../src/lib/crmv4/copy-round114";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeStatus,
  addNote,
  attendeeLabel,
  namedStatuses,
  noteText,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleNotes,
  visibleOrders,
  visibleStatuses,
} from "../src/lib/crmv4/round114";

function main() {
  assert.equal(noteText("  Review\nAda  "), "Review Ada");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(attendeeLabel("  Ada  "), "Ada");
  assert.equal(attendeeLabel("   "), "");
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Review", attendee: "  ", pinned: 1 }]), [
    { id: "2", text: "Review", attendee: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Review ", attendee: " Ada " });
  assert.deepEqual(saved, [{ id: "a", text: "Review", attendee: "Ada", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Review" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "rev").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "ada"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(resetNotes(), []);

  assert.equal(statusText(" FILLED "), "FILLED");
  assert.equal(statusText({ status: " OPEN " }), "OPEN");
  assert.equal(statusText(""), "");
  assert.equal(statusText(1 as never), "");
  assert.equal(statusText({ price: 10 } as never), "");
  const rows = [
    { id: "o1", label: "EURUSD Ada", status: "FILLED" },
    { id: "o2", label: "GBPUSD Bea", status: { status: "OPEN" } },
    { id: "o3", label: "EURUSD Cid", status: "FILLED" },
    { id: "o4", label: "XAU Dot", status: "" },
    { id: "o5", label: "Eve", status: 2 as never },
  ];
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "FILLED", count: 2 },
    { status: "OPEN", count: 1 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["FILLED", "OPEN"]);
  assert.deepEqual(visibleOrders(rows, "FILLED", false, "ada").map((row) => row.id), ["o1"]);
  assert.deepEqual(visibleOrders(rows, "", true, "").map((row) => row.id), ["o4", "o5"]);
  assert.deepEqual(readHiddenStatuses(["FILLED", "NEW", ""], ["FILLED", "OPEN"]), ["FILLED"]);
  assert.deepEqual(toggleStatus(["FILLED"], "NEW", ["FILLED"]), ["FILLED"]);
  assert.deepEqual(visibleStatuses(["FILLED", "OPEN"], ["OPEN"], false), ["FILLED"]);
  assert.equal(activeStatus("OPEN", ["FILLED"]), "");
  assert.equal(statusLines(rows).every((line) => !("price" in line)), true);

  const copy = Object.keys(ROUND114_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND114_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "mnTitle"), "Meeting notes");
  assert.equal(crmv4Text("tr", "jqTitle"), ROUND114_COPY.tr.jqTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-meet-notes/);
  assert.match(css, /\.c4-order-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round114.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-meet-notes/);
  assert.match(view, /data-order-stat/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /blotter/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "meetnotes"/);
  assert.match(app, /view === "orderstat"/);
  console.log("crmv4 round114 tests passed");
}

main();
