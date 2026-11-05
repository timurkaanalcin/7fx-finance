/**
 * Meeting notes and order statuses.
 * Run: npx tsx tests/crmv3-round114.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MN_AR, MN_DE, MN_EN, MN_RU, MN_TR } from "../src/lib/crmv3/copy-meetnotes";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { MEET_KEY, ORDER_STATUS_KEY } from "../src/lib/crmv3/meetnotes";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/meetnotes";

function main() {
  assert.equal(MEET_KEY, "crmv3-meeting-notes");
  assert.equal(ORDER_STATUS_KEY, "crmv3-order-status-polish-hide");
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

  const copy = Object.keys(MN_EN).sort();
  for (const table of [MN_TR, MN_DE, MN_RU, MN_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "mnTitle"), "Meeting notes");
  assert.equal(crmv3Text("tr", "jqTitle"), MN_TR.jqTitle);
  assert.equal(keyTitle("crmv3-meeting-notes", "de"), "Besprechungsnotizen");
  assert.equal(keyTitle("crmv3-order-status-polish-hide", "ar"), "حالات الأوامر");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "meetnotes"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "orderstat"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("meetnotes"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("orderstat"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("meetnotes")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("orderstat")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-meet-notes/);
  assert.match(css, /\.c3-order-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/meetnotes.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "meetnotes"/);
  assert.match(app, /view === "orderstat"/);
  console.log("crmv3 round114 tests passed");
}

main();
