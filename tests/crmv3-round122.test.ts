/**
 * Mail notes and withdrawal statuses.
 * Run: npx tsx tests/crmv3-round122.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ML_AR, ML_DE, ML_EN, ML_RU, ML_TR } from "../src/lib/crmv3/copy-mailroom";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { MAIL_KEY, WD_STATUS_KEY } from "../src/lib/crmv3/mailroom";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/mailroom";

function main() {
  assert.equal(MAIL_KEY, "crmv3-mail-notes");
  assert.equal(WD_STATUS_KEY, "crmv3-wd-stat-hide");
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

  const copy = Object.keys(ML_EN).sort();
  for (const table of [ML_TR, ML_DE, ML_RU, ML_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "mlrTitle"), "Mail notes");
  assert.equal(crmv3Text("tr", "wsgTitle"), ML_TR.wsgTitle);
  assert.equal(crmv3Text("de", "mlrSlot"), ML_DE.mlrSlot);
  assert.equal(crmv3Text("ru", "wsgBlank"), ML_RU.wsgBlank);
  assert.equal(crmv3Text("ar", "wsgBoard"), ML_AR.wsgBoard);
  assert.equal(keyTitle("crmv3-mail-notes", "de"), "Postnotizen");
  assert.equal(keyTitle("crmv3-wd-stat-hide", "ar"), "حالات السحب");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "mailroom"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "wdsg"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("mailroom"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("wdsg"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("mailroom")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("wdsg")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-mail-room/);
  assert.match(css, /\.c3-wd-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/mailroom.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "mailroom"/);
  assert.match(app, /view === "wdsg"/);
  console.log("crmv3 round122 tests passed");
}

main();
