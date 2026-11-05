/**
 * CRM v3 trade blotter and the local desk pad.
 * Run: npx tsx tests/crmv3-round53.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PAD_KEY,
  addNote,
  currencyLines,
  currencyMap,
  filterBlotter,
  isFill,
  isOpenOrder,
  readNotes,
  removeNote,
  rowPrice,
  sortPad,
  toggleArchive,
  togglePin,
  visibleNotes,
} from "../src/lib/crmv3/blotter";
import { BLOT_AR, BLOT_DE, BLOT_EN, BLOT_RU, BLOT_TR } from "../src/lib/crmv3/copy-blotter";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const orders = [
    { id: "f1", userId: "a", symbol: "EURUSD", side: "BUY", type: "MARKET", volume: 1, price: 1.1, status: "FILLED", traderName: "Ada" },
    { id: "o1", userId: "b", symbol: "XAUUSD", side: "SELL", type: "LIMIT", volume: 2, price: 2400, status: "PENDING", traderName: "Bea" },
    { id: "c1", userId: "a", symbol: "EURUSD", side: "BUY", status: "CANCELLED", traderName: "Ada" },
  ];
  assert.equal(isFill(orders[0]), true);
  assert.equal(isOpenOrder(orders[1]), true);
  assert.deepEqual(filterBlotter(orders, "", "").map((row) => row.id), ["f1", "o1"]);
  assert.deepEqual(filterBlotter(orders, "fill", "eur").map((row) => row.id), ["f1"]);
  assert.deepEqual(filterBlotter(orders, "open", "").map((row) => row.id), ["o1"]);
  assert.equal(filterBlotter(orders, "all", "bea").length, 1);
  assert.equal(filterBlotter(orders, "fill", "missing").length, 0);
  assert.equal(rowPrice(orders[0]), "1.1");
  assert.equal(rowPrice({ id: "x" }), "");
  assert.equal(PAD_KEY, "crmv3-desk-pad");

  const currencies = currencyMap([
    { id: "a", currency: "usd" },
    { id: "b", account: { currency: "TRY" } },
  ]);
  const lines = currencyLines(
    [
      { userId: "a", status: "CLOSED", closeProfit: 1.5, profit: 9 },
      { userId: "a", status: "CLOSED", closeProfit: 2.5 },
      { userId: "b", status: "CLOSED", closeProfit: 10 },
      { userId: "c", status: "CLOSED", closeProfit: 4 },
      { userId: "a", status: "OPEN", profit: 100 },
    ],
    currencies,
  );
  assert.deepEqual(lines.find((line) => line.currency === "USD"), { currency: "USD", profit: 4, count: 2 });
  assert.deepEqual(lines.find((line) => line.currency === "TRY"), { currency: "TRY", profit: 10, count: 1 });
  assert.equal(lines.find((line) => line.currency === "")?.profit, 4);
  assert.equal(lines.some((line) => line.currency === "USD" && line.profit === 104), false);

  const customers = [{ id: "a", name: "Ada" }, { id: "b", name: "Bea" }];
  let notes = addNote([], { id: "n1", customerId: "a", body: "  Call Ada  ", at: "2026-11-05T10:00:00Z" });
  notes = addNote(notes, { id: "n2", customerId: "b", body: "Gold check", at: "2026-11-05T11:00:00Z" });
  notes = addNote(notes, { id: "n3", customerId: "missing", body: "Skip", at: "2026-11-05T12:00:00Z" });
  assert.equal(addNote(notes, { id: "n1", customerId: "a", body: "again", at: "x" }).length, notes.length);
  assert.equal(notes.find((note) => note.id === "n1")?.body, "Call Ada");
  notes = togglePin(notes, "n1");
  assert.equal(sortPad(notes)[0].id, "n1");
  assert.deepEqual(visibleNotes(notes, customers, "", false).map((note) => note.id), ["n1", "n2"]);
  assert.deepEqual(visibleNotes(notes, customers, "gold", false).map((note) => note.id), ["n2"]);
  notes = toggleArchive(notes, "n2");
  assert.equal(visibleNotes(notes, customers, "", false).some((note) => note.id === "n2"), false);
  assert.equal(visibleNotes(notes, customers, "", true)[0].id, "n2");
  assert.equal(removeNote(notes, "n1").some((note) => note.id === "n1"), false);
  assert.equal(readNotes([{ id: "n9", customerId: "a", body: "Hi", pinned: true }])[0].pinned, true);
  assert.equal(readNotes("nope").length, 0);

  const copy = Object.keys(BLOT_EN).sort();
  assert.deepEqual(Object.keys(BLOT_TR).sort(), copy);
  assert.deepEqual(Object.keys(BLOT_DE).sort(), copy);
  assert.deepEqual(Object.keys(BLOT_RU).sort(), copy);
  assert.deepEqual(Object.keys(BLOT_AR).sort(), copy);
  assert.notEqual(BLOT_TR.blTitle, BLOT_EN.blTitle);
  assert.notEqual(BLOT_DE.pdHint, BLOT_EN.pdHint);
  assert.notEqual(BLOT_RU.blPnl, BLOT_EN.blPnl);
  assert.notEqual(BLOT_AR.pdNone, BLOT_EN.pdNone);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-desk-pad", "tr"), "Masa notu");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "blotter"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "pad"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("blotter"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("pad"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("blotter")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("pad")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-blotter/);
  assert.match(css, /\.c3-desk-pad/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/blotter.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("PATCH"), false);
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-blotter/);
  assert.match(view, /data-desk-pad/);
  assert.match(view, /status=CLOSED/);
  assert.equal(view.includes("status=OPEN"), false);
  assert.equal(view.includes("status=ALL"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "blotter"/);
  assert.match(app, /view === "pad"/);
  console.log("crmv3 round53 tests passed");
}

main();
