/**
 * Pantry notes and account types.
 * Run: npx tsx tests/crmv4-round128.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND128_COPY } from "../src/lib/crmv4/copy-round128";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeType,
  addNote,
  namedTypes,
  noteText,
  readHiddenTypes,
  readNotes,
  resetNotes,
  setNoteHidden,
  shelfLabel,
  toggleNotePin,
  toggleType,
  typeLines,
  typeText,
  visibleNotes,
  visibleTypes,
  visibleUsers,
} from "../src/lib/crmv4/round128";

function main() {
  assert.equal(noteText("  Shelf\nA  "), "Shelf A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(shelfLabel("  Bin B  "), "Bin B");
  assert.equal(shelfLabel("   "), "");
  assert.equal(shelfLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Rice", shelf: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Rice", shelf: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Rice is low ", shelf: " Bin 4 " });
  assert.deepEqual(saved, [{ id: "a", text: "Rice is low", shelf: "Bin 4", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Rice is low" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other shelf" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "rice").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "bin"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, shelf: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(typeText(" VIP "), "VIP");
  assert.equal(typeText({ type: " PRO " }), "PRO");
  assert.equal(typeText(""), "");
  assert.equal(typeText(1 as never), "");
  assert.equal(typeText({ saleStatus: "NEW" } as never), "");
  assert.equal(typeText({ role: "TRADER" } as never), "");
  const rows = [
    { id: "u1", label: "Ada", type: "STANDARD" },
    { id: "u2", label: "Bea", type: { type: "PRO" } },
    { id: "u3", label: "Cid", type: "STANDARD" },
    { id: "u4", label: "Dot", type: "" },
    { id: "u5", label: "Eve", type: { role: "ADMIN" } as never },
  ];
  assert.deepEqual(typeLines(rows), [
    { type: "", count: 2 },
    { type: "PRO", count: 1 },
    { type: "STANDARD", count: 2 },
  ]);
  assert.deepEqual(namedTypes(rows), ["PRO", "STANDARD"]);
  assert.deepEqual(visibleUsers(rows, "STANDARD", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleUsers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleUsers(rows, "STANDARD", false, "100"), []);
  assert.deepEqual(readHiddenTypes(["STANDARD", "OLD", ""], ["STANDARD", "PRO"]), ["STANDARD"]);
  assert.deepEqual(toggleType(["STANDARD"], "OLD", ["STANDARD"]), ["STANDARD"]);
  assert.deepEqual(visibleTypes(["STANDARD", "PRO"], ["PRO"], false), ["STANDARD"]);
  assert.equal(activeType("PRO", ["STANDARD"]), "");
  assert.equal(typeLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND128_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND128_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "pntTitle"), "Pantry notes");
  assert.equal(crmv4Text("tr", "atyTitle"), ROUND128_COPY.tr.atyTitle);
  assert.equal(crmv4Text("de", "pntShelf"), ROUND128_COPY.de.pntShelf);
  assert.equal(crmv4Text("ru", "atyBlank"), ROUND128_COPY.ru.atyBlank);
  assert.equal(crmv4Text("ar", "atyBoard"), ROUND128_COPY.ar.atyBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pantry/);
  assert.match(css, /\.c4-acct-type/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round128.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("STANDARD"), false);
  assert.match(view, /accountType/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-pantry/);
  assert.match(view, /data-acct-type/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pantry"/);
  assert.match(app, /view === "accttype"/);
  console.log("crmv4 round128 tests passed");
}

main();
