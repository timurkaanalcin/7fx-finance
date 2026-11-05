/**
 * Reception notes and ticket statuses.
 * Run: npx tsx tests/crmv3-round123.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RX_AR, RX_DE, RX_EN, RX_RU, RX_TR } from "../src/lib/crmv3/copy-reception";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { RECEPTION_KEY, TICKET_STATUS_KEY } from "../src/lib/crmv3/reception";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeStatus,
  addNote,
  namedStatuses,
  noteText,
  paneLabel,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleNotes,
  visibleStatuses,
  visibleTickets,
} from "../src/lib/crmv3/reception";

function main() {
  assert.equal(RECEPTION_KEY, "crmv3-reception-notes");
  assert.equal(TICKET_STATUS_KEY, "crmv3-tkt-stat-hide");
  assert.equal(noteText("  Guest\nA  "), "Guest A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(paneLabel("  Window 1  "), "Window 1");
  assert.equal(paneLabel("   "), "");
  assert.equal(paneLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Waiting", pane: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Waiting", pane: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Front window ", pane: " Desk 1 " });
  assert.deepEqual(saved, [{ id: "a", text: "Front window", pane: "Desk 1", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Front window" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other desk" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "front").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "desk"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, pane: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(statusText(" OPEN "), "OPEN");
  assert.equal(statusText({ status: " CLOSED " }), "CLOSED");
  assert.equal(statusText(""), "");
  assert.equal(statusText(1 as never), "");
  assert.equal(statusText({ kind: "DEPOSIT" } as never), "");
  const rows = [
    { id: "t1", label: "Ada", status: "OPEN" },
    { id: "t2", label: "Bea", status: { status: "CLOSED" } },
    { id: "t3", label: "Cid", status: "OPEN" },
    { id: "t4", label: "Dot", status: "" },
    { id: "t5", label: "Eve", status: { kind: "WITHDRAW" } as never },
  ];
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "CLOSED", count: 1 },
    { status: "OPEN", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["CLOSED", "OPEN"]);
  assert.deepEqual(visibleTickets(rows, "OPEN", false, "ada").map((row) => row.id), ["t1"]);
  assert.deepEqual(visibleTickets(rows, "", true, "").map((row) => row.id), ["t4", "t5"]);
  assert.deepEqual(visibleTickets(rows, "OPEN", false, "100"), []);
  assert.deepEqual(readHiddenStatuses(["OPEN", "NEW", ""], ["OPEN", "CLOSED"]), ["OPEN"]);
  assert.deepEqual(toggleStatus(["OPEN"], "NEW", ["OPEN"]), ["OPEN"]);
  assert.deepEqual(visibleStatuses(["OPEN", "CLOSED"], ["CLOSED"], false), ["OPEN"]);
  assert.equal(activeStatus("CLOSED", ["OPEN"]), "");
  assert.equal(statusLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(RX_EN).sort();
  for (const table of [RX_TR, RX_DE, RX_RU, RX_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "rxnTitle"), "Reception notes");
  assert.equal(crmv3Text("tr", "tksTitle"), RX_TR.tksTitle);
  assert.equal(crmv3Text("de", "rxnPane"), RX_DE.rxnPane);
  assert.equal(crmv3Text("ru", "tksBlank"), RX_RU.tksBlank);
  assert.equal(crmv3Text("ar", "tksBoard"), RX_AR.tksBoard);
  assert.equal(keyTitle("crmv3-reception-notes", "de"), "Empfangsnotizen");
  assert.equal(keyTitle("crmv3-tkt-stat-hide", "ar"), "حالات التذاكر");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "reception"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "tktsg"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("reception"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("tktsg"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("reception")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("tktsg")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-reception/);
  assert.match(css, /\.c3-tkt-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/reception.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("kind"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-reception/);
  assert.match(view, /data-tkt-stat/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /support/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "reception"/);
  assert.match(app, /view === "tktsg"/);
  console.log("crmv3 round123 tests passed");
}

main();
