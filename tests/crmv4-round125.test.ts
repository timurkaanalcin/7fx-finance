/**
 * Room notes and trade sides.
 * Run: npx tsx tests/crmv4-round125.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND125_COPY } from "../src/lib/crmv4/copy-round125";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeSide,
  addNote,
  floorLabel,
  namedSides,
  noteText,
  readHiddenSides,
  readNotes,
  resetNotes,
  setNoteHidden,
  sideLines,
  sideText,
  toggleNotePin,
  toggleSide,
  visibleNotes,
  visibleSides,
  visibleTrades,
} from "../src/lib/crmv4/round125";

function main() {
  assert.equal(noteText("  Board\nA  "), "Board A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(floorLabel("  Floor 2  "), "Floor 2");
  assert.equal(floorLabel("   "), "");
  assert.equal(floorLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Booked", floor: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Booked", floor: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " North room ", floor: " Floor 2 " });
  assert.deepEqual(saved, [{ id: "a", text: "North room", floor: "Floor 2", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "North room" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other room" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "north").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "floor"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, floor: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(sideText(" BUY "), "BUY");
  assert.equal(sideText({ side: " SELL " }), "SELL");
  assert.equal(sideText(""), "");
  assert.equal(sideText(1 as never), "");
  assert.equal(sideText({ symbol: "EURUSD" } as never), "");
  const rows = [
    { id: "o1", label: "Ada", side: "BUY" },
    { id: "p1", label: "Bea", side: { side: "SELL" } },
    { id: "o2", label: "Cid", side: "BUY" },
    { id: "p2", label: "Dot", side: "" },
    { id: "o3", label: "Eve", side: { symbol: "XAUUSD" } as never },
  ];
  assert.deepEqual(sideLines(rows), [
    { side: "", count: 2 },
    { side: "BUY", count: 2 },
    { side: "SELL", count: 1 },
  ]);
  assert.deepEqual(namedSides(rows), ["BUY", "SELL"]);
  assert.deepEqual(visibleTrades(rows, "BUY", false, "ada").map((row) => row.id), ["o1"]);
  assert.deepEqual(visibleTrades(rows, "", true, "").map((row) => row.id), ["p2", "o3"]);
  assert.deepEqual(visibleTrades(rows, "BUY", false, "1.2"), []);
  assert.deepEqual(readHiddenSides(["BUY", "NEW", ""], ["BUY", "SELL"]), ["BUY"]);
  assert.deepEqual(toggleSide(["BUY"], "NEW", ["BUY"]), ["BUY"]);
  assert.deepEqual(visibleSides(["BUY", "SELL"], ["SELL"], false), ["BUY"]);
  assert.equal(activeSide("SELL", ["BUY"]), "");
  assert.equal(sideLines(rows).every((line) => !("price" in line) && !("amount" in line) && !("volume" in line)), true);

  const copy = Object.keys(ROUND125_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND125_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rmnTitle"), "Room notes");
  assert.equal(crmv4Text("tr", "sdgTitle"), ROUND125_COPY.tr.sdgTitle);
  assert.equal(crmv4Text("de", "rmnFloor"), ROUND125_COPY.de.rmnFloor);
  assert.equal(crmv4Text("ru", "sdgBlank"), ROUND125_COPY.ru.sdgBlank);
  assert.equal(crmv4Text("ar", "sdgBoard"), ROUND125_COPY.ar.sdgBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-room/);
  assert.match(css, /\.c4-trade-side/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round125.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes("profit"), false);
  assert.equal(view.includes("volume"), false);
  assert.equal(view.includes("currency"), false);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /\/api\/admin\/positions\?status=CLOSED&take=40/);
  assert.equal(view.includes("status=OPEN"), false);
  assert.match(view, /data-room/);
  assert.match(view, /data-trade-side/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /blotter/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "confroom"/);
  assert.match(app, /view === "sidesg"/);
  console.log("crmv4 round125 tests passed");
}

main();
