/**
 * Valet notes and potential statuses.
 * Run: npx tsx tests/crmv4-round131.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND131_COPY } from "../src/lib/crmv4/copy-round131";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activePotential,
  addNote,
  namedPotentials,
  noteText,
  notesCsv,
  potentialLines,
  potentialText,
  readHiddenPotentials,
  readNotes,
  resetNotes,
  setNoteHidden,
  standLabel,
  toggleNotePin,
  togglePotential,
  visibleCustomers,
  visibleNotes,
  visiblePotentials,
} from "../src/lib/crmv4/round131";

function main() {
  assert.equal(noteText("  Keys\nA  "), "Keys A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(standLabel("  Bay 2  "), "Bay 2");
  assert.equal(standLabel("   "), "");
  assert.equal(standLabel("y".repeat(40)).length, 24);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Hold the car", stand: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Hold the car", stand: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Hold the car ", stand: " Door A " });
  assert.deepEqual(saved, [{ id: "a", text: "Hold the car", stand: "Door A", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Hold the car" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other car" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "car").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "door"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, stand: "" }));
  assert.equal(readNotes(many).length, 40);
  assert.equal(notesCsv([{ id: "", text: "skip" }, { id: "a", text: 'Hold "the" car', stand: "Bay, 2", pinned: true, hidden: false }]), 'text,stand,pinned,hidden\n"Hold ""the"" car","Bay, 2",1,0');
  assert.equal(notesCsv([]), "text,stand,pinned,hidden");
  assert.equal(notesCsv(saved).includes("amount"), false);

  assert.equal(potentialText(" HIGH "), "HIGH");
  assert.equal(potentialText({ potential: " HOT " }), "HOT");
  assert.equal(potentialText(""), "");
  assert.equal(potentialText(1 as never), "");
  assert.equal(potentialText({ saleStatus: "NEW" }), "");
  assert.equal(potentialText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(potentialText({ validationStatus: "VERIFIED" }), "");
  assert.equal(potentialText({ documentsStatus: "APPROVED" }), "");
  assert.equal(potentialText({ accountType: "VIP" }), "");
  assert.equal(potentialText({ role: "TRADER" }), "");
  const rows = [
    { id: "u1", label: "Ada", potential: "HIGH" },
    { id: "u2", label: "Bea", potential: { potential: "HOT" } },
    { id: "u3", label: "Cid", potential: "HIGH" },
    { id: "u4", label: "Dot", potential: "" },
    { id: "u5", label: "Eve", potential: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(potentialLines(rows), [
    { potential: "", count: 2 },
    { potential: "HIGH", count: 2 },
    { potential: "HOT", count: 1 },
  ]);
  assert.deepEqual(namedPotentials(rows), ["HIGH", "HOT"]);
  assert.deepEqual(visibleCustomers(rows, "HIGH", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleCustomers(rows, "HIGH", false, "100"), []);
  assert.deepEqual(readHiddenPotentials(["HIGH", "OLD", ""], ["HIGH", "HOT"]), ["HIGH"]);
  assert.deepEqual(togglePotential(["HIGH"], "OLD", ["HIGH"]), ["HIGH"]);
  assert.deepEqual(visiblePotentials(["HIGH", "HOT"], ["HOT"], false), ["HIGH"]);
  assert.equal(activePotential("HOT", ["HIGH"]), "");
  assert.equal(potentialLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND131_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND131_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "vltTitle"), "Valet notes");
  assert.equal(crmv4Text("tr", "potTitle"), ROUND131_COPY.tr.potTitle);
  assert.equal(crmv4Text("de", "vltStand"), ROUND131_COPY.de.vltStand);
  assert.equal(crmv4Text("ru", "potBlank"), ROUND131_COPY.ru.potBlank);
  assert.equal(crmv4Text("ar", "potBoard"), ROUND131_COPY.ar.potBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-valet/);
  assert.match(css, /\.c4-potential/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round131.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("validationStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.match(view, /potentialStatus/);
  assert.match(view, /notesCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-valet/);
  assert.match(view, /data-potential/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "valet"/);
  assert.match(app, /view === "potstat"/);
  console.log("crmv4 round131 tests passed");
}

main();
