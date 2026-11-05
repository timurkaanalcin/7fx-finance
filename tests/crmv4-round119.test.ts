/**
 * Locker notes and trade symbols.
 * Run: npx tsx tests/crmv4-round119.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND119_COPY } from "../src/lib/crmv4/copy-round119";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeSymbol,
  addNote,
  namedSymbols,
  noteText,
  readHiddenSymbols,
  readNotes,
  resetNotes,
  setNoteHidden,
  symbolLines,
  symbolText,
  tagLabel,
  toggleNotePin,
  toggleSymbol,
  visibleNotes,
  visibleSymbols,
  visibleTrades,
} from "../src/lib/crmv4/round119";

function main() {
  assert.equal(noteText("  Locker\nA  "), "Locker A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(tagLabel("  Key 4  "), "Key 4");
  assert.equal(tagLabel("   "), "");
  assert.equal(tagLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Locked", tag: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Locked", tag: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Desk key ", tag: " Tag 4 " });
  assert.deepEqual(saved, [{ id: "a", text: "Desk key", tag: "Tag 4", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Desk key" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other key" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "desk").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "tag"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, tag: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(symbolText(" EURUSD "), "EURUSD");
  assert.equal(symbolText({ symbol: " XAUUSD " }), "XAUUSD");
  assert.equal(symbolText(""), "");
  assert.equal(symbolText(1 as never), "");
  assert.equal(symbolText({ price: 1.2, volume: 1 } as never), "");
  assert.equal(symbolText({ chartSymbol: "EURUSD" } as never), "");
  const rows = [
    { id: "o1", label: "Ada", symbol: "EURUSD" },
    { id: "p1", label: "Bea", symbol: { symbol: "XAUUSD" } },
    { id: "o2", label: "Cid", symbol: "EURUSD" },
    { id: "p2", label: "Dot", symbol: "" },
    { id: "o3", label: "Eve", symbol: { price: 10 } as never },
  ];
  assert.deepEqual(symbolLines(rows), [
    { symbol: "", count: 2 },
    { symbol: "EURUSD", count: 2 },
    { symbol: "XAUUSD", count: 1 },
  ]);
  assert.deepEqual(namedSymbols(rows), ["EURUSD", "XAUUSD"]);
  assert.deepEqual(visibleTrades(rows, "EURUSD", false, "ada").map((row) => row.id), ["o1"]);
  assert.deepEqual(visibleTrades(rows, "", true, "").map((row) => row.id), ["p2", "o3"]);
  assert.deepEqual(visibleTrades(rows, "EURUSD", false, "1.2"), []);
  assert.deepEqual(readHiddenSymbols(["EURUSD", "NEW", ""], ["EURUSD", "XAUUSD"]), ["EURUSD"]);
  assert.deepEqual(toggleSymbol(["EURUSD"], "NEW", ["EURUSD"]), ["EURUSD"]);
  assert.deepEqual(visibleSymbols(["EURUSD", "XAUUSD"], ["XAUUSD"], false), ["EURUSD"]);
  assert.equal(activeSymbol("XAUUSD", ["EURUSD"]), "");
  assert.equal(symbolLines(rows).every((line) => !("price" in line) && !("amount" in line) && !("volume" in line)), true);

  const copy = Object.keys(ROUND119_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND119_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "lokTitle"), "Locker notes");
  assert.equal(crmv4Text("tr", "tsyTitle"), ROUND119_COPY.tr.tsyTitle);
  assert.equal(crmv4Text("de", "lokTag"), ROUND119_COPY.de.lokTag);
  assert.equal(crmv4Text("ru", "tsyBlank"), ROUND119_COPY.ru.tsyBlank);
  assert.equal(crmv4Text("ar", "tsyBoard"), ROUND119_COPY.ar.tsyBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-locker/);
  assert.match(css, /\.c4-trade-sym/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round119.tsx"), "utf8");
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
  assert.match(view, /data-locker/);
  assert.match(view, /data-trade-sym/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /blotter/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "locker"/);
  assert.match(app, /view === "tradesym"/);
  console.log("crmv4 round119 tests passed");
}

main();
