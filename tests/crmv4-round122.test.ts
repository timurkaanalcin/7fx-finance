/**
 * Mail notes and withdrawal statuses.
 * Run: npx tsx tests/crmv4-round122.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND122_COPY } from "../src/lib/crmv4/copy-round122";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeStatus,
  addNote,
  namedStatuses,
  noteText,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  slotLabel,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleNotes,
  visibleStatuses,
  visibleWithdrawals,
} from "../src/lib/crmv4/round122";

function main() {
  assert.equal(noteText("  Parcel\nA  "), "Parcel A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(slotLabel("  Box 2  "), "Box 2");
  assert.equal(slotLabel("   "), "");
  assert.equal(slotLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Sorted", slot: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Sorted", slot: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Front slot ", slot: " Box 2 " });
  assert.deepEqual(saved, [{ id: "a", text: "Front slot", slot: "Box 2", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Front slot" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other mail" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "front").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "box"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, slot: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText({ status: " APPROVED " }), "APPROVED");
  assert.equal(statusText(""), "");
  assert.equal(statusText(1 as never), "");
  assert.equal(statusText({ method: "IBAN" } as never), "");
  const rows = [
    { id: "w1", label: "Ada", status: "PENDING" },
    { id: "w2", label: "Bea", status: { status: "APPROVED" } },
    { id: "w3", label: "Cid", status: "PENDING" },
    { id: "w4", label: "Dot", status: "" },
    { id: "w5", label: "Eve", status: { method: "CARD" } as never },
  ];
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.deepEqual(visibleWithdrawals(rows, "PENDING", false, "ada").map((row) => row.id), ["w1"]);
  assert.deepEqual(visibleWithdrawals(rows, "", true, "").map((row) => row.id), ["w4", "w5"]);
  assert.deepEqual(visibleWithdrawals(rows, "PENDING", false, "100"), []);
  assert.deepEqual(readHiddenStatuses(["PENDING", "NEW", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "NEW", ["PENDING"]), ["PENDING"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");
  assert.equal(statusLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND122_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND122_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "mlrTitle"), "Mail notes");
  assert.equal(crmv4Text("tr", "wsgTitle"), ROUND122_COPY.tr.wsgTitle);
  assert.equal(crmv4Text("de", "mlrSlot"), ROUND122_COPY.de.mlrSlot);
  assert.equal(crmv4Text("ru", "wsgBlank"), ROUND122_COPY.ru.wsgBlank);
  assert.equal(crmv4Text("ar", "wsgBoard"), ROUND122_COPY.ar.wsgBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mail-room/);
  assert.match(css, /\.c4-wd-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round122.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("method"), false);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-mail-room/);
  assert.match(view, /data-wd-stat/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /withdraw/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mailroom"/);
  assert.match(app, /view === "wdsg"/);
  console.log("crmv4 round122 tests passed");
}

main();
