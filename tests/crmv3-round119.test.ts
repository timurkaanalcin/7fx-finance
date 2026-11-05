/**
 * Locker notes and trade symbols.
 * Run: npx tsx tests/crmv3-round119.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LK_AR, LK_DE, LK_EN, LK_RU, LK_TR } from "../src/lib/crmv3/copy-locker";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { LOCKER_KEY, TRADE_SYMBOL_KEY } from "../src/lib/crmv3/locker";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/locker";

function main() {
  assert.equal(LOCKER_KEY, "crmv3-locker-notes");
  assert.equal(TRADE_SYMBOL_KEY, "crmv3-trade-symbol-hide");
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

  const copy = Object.keys(LK_EN).sort();
  for (const table of [LK_TR, LK_DE, LK_RU, LK_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "lokTitle"), "Locker notes");
  assert.equal(crmv3Text("tr", "tsyTitle"), LK_TR.tsyTitle);
  assert.equal(crmv3Text("de", "lokTag"), LK_DE.lokTag);
  assert.equal(crmv3Text("ru", "tsyBlank"), LK_RU.tsyBlank);
  assert.equal(crmv3Text("ar", "tsyBoard"), LK_AR.tsyBoard);
  assert.equal(keyTitle("crmv3-locker-notes", "de"), "Schließfachnotizen");
  assert.equal(keyTitle("crmv3-trade-symbol-hide", "ar"), "رموز الصفقات");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "locker"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "tradesym"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("locker"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("tradesym"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("locker")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("tradesym")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-locker/);
  assert.match(css, /\.c3-trade-sym/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/locker.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "locker"/);
  assert.match(app, /view === "tradesym"/);
  console.log("crmv3 round119 tests passed");
}

main();
