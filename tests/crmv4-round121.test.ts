/**
 * Visitor notes and deposit methods.
 * Run: npx tsx tests/crmv4-round121.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND121_COPY } from "../src/lib/crmv4/copy-round121";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  METHOD_FIELDS,
  activeMethod,
  addNote,
  badgeLabel,
  methodLines,
  methodText,
  namedMethods,
  noteText,
  readHiddenMethods,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleMethod,
  toggleNotePin,
  visibleDeposits,
  visibleMethods,
  visibleNotes,
} from "../src/lib/crmv4/round121";

function main() {
  assert.equal(noteText("  Guest\nA  "), "Guest A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(badgeLabel("  Pass 4  "), "Pass 4");
  assert.equal(badgeLabel("   "), "");
  assert.equal(badgeLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Visited", badge: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Visited", badge: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Front door ", badge: " Badge 2 " });
  assert.deepEqual(saved, [{ id: "a", text: "Front door", badge: "Badge 2", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Front door" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other guest" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "front").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "badge"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, badge: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(methodText(" CARD "), "CARD");
  assert.equal(methodText({ label: "  Wire " }), "Wire");
  assert.equal(methodText({ label: "  ", type: "IBAN" }), "IBAN");
  assert.equal(methodText({ label: "", type: "  ", network: "TRC20" }), "TRC20");
  assert.equal(methodText(""), "");
  assert.equal(methodText(1 as never), "");
  assert.equal(methodText({ iban: "TR00", address: "wallet" } as never), "");
  assert.deepEqual(METHOD_FIELDS.includes("network" as never), true);
  assert.deepEqual(METHOD_FIELDS.includes("iban" as never), false);
  const rows = [
    { id: "d1", label: "Ada", method: { label: "Wire" } },
    { id: "d2", label: "Bea", method: { type: "CRYPTO", network: "ERC20" } },
    { id: "d3", label: "Cid", method: { label: "Wire" } },
    { id: "d4", label: "Dot", method: "" },
    { id: "d5", label: "Eve", method: { iban: "TR00" } as never },
  ];
  assert.deepEqual(methodLines(rows), [
    { method: "", count: 2 },
    { method: "CRYPTO", count: 1 },
    { method: "Wire", count: 2 },
  ]);
  assert.deepEqual(namedMethods(rows), ["CRYPTO", "Wire"]);
  assert.deepEqual(visibleDeposits(rows, "Wire", false, "ada").map((row) => row.id), ["d1"]);
  assert.deepEqual(visibleDeposits(rows, "", true, "").map((row) => row.id), ["d4", "d5"]);
  assert.deepEqual(visibleDeposits(rows, "Wire", false, "100"), []);
  assert.deepEqual(readHiddenMethods(["Wire", "NEW", ""], ["Wire", "CRYPTO"]), ["Wire"]);
  assert.deepEqual(toggleMethod(["Wire"], "NEW", ["Wire"]), ["Wire"]);
  assert.deepEqual(visibleMethods(["Wire", "CRYPTO"], ["CRYPTO"], false), ["Wire"]);
  assert.equal(activeMethod("CRYPTO", ["Wire"]), "");
  assert.equal(methodLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND121_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND121_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "bdgTitle"), "Badge marks");
  assert.equal(crmv4Text("tr", "dmgTitle"), ROUND121_COPY.tr.dmgTitle);
  assert.equal(crmv4Text("de", "bdgBadge"), ROUND121_COPY.de.bdgBadge);
  assert.equal(crmv4Text("ru", "dmgBlank"), ROUND121_COPY.ru.dmgBlank);
  assert.equal(crmv4Text("ar", "dmgBoard"), ROUND121_COPY.ar.dmgBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-visitor/);
  assert.match(css, /\.c4-dep-glance/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round121.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("iban"), false);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-visitor/);
  assert.match(view, /data-dep-glance/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /deposit/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "visitor"/);
  assert.match(app, /view === "depglance"/);
  console.log("crmv4 round121 tests passed");
}

main();
