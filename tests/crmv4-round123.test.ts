/**
 * Reception notes and ticket statuses.
 * Run: npx tsx tests/crmv4-round123.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND123_COPY } from "../src/lib/crmv4/copy-round123";
import { crmv4Text } from "../src/lib/crmv4/copy";
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
} from "../src/lib/crmv4/round123";

function main() {
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

  const copy = Object.keys(ROUND123_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND123_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rxnTitle"), "Reception notes");
  assert.equal(crmv4Text("tr", "tksTitle"), ROUND123_COPY.tr.tksTitle);
  assert.equal(crmv4Text("de", "rxnPane"), ROUND123_COPY.de.rxnPane);
  assert.equal(crmv4Text("ru", "tksBlank"), ROUND123_COPY.ru.tksBlank);
  assert.equal(crmv4Text("ar", "tksBoard"), ROUND123_COPY.ar.tksBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-reception/);
  assert.match(css, /\.c4-tkt-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round123.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "reception"/);
  assert.match(app, /view === "tktsg"/);
  console.log("crmv4 round123 tests passed");
}

main();
