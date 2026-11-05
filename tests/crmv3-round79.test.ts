/**
 * CRM v3 call pack and currency chips.
 * Run: npx tsx tests/crmv3-round79.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PACK_AR, PACK_DE, PACK_EN, PACK_RU, PACK_TR } from "../src/lib/crmv3/copy-pack";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  CHIP_KEY,
  PACK_KEY,
  activeCode,
  addNote,
  currencyCodes,
  currencyLines,
  filterRows,
  readHidden,
  readNotes,
  singleTotal,
  toggleCode,
  visibleCodes,
  visibleMoney,
  visibleNotes,
} from "../src/lib/crmv3/pack";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(PACK_KEY, "crmv3-call-pack");
  assert.equal(CHIP_KEY, "crmv3-currency-hide");
  const known = ["a", "b"];
  assert.equal(addNote([], { id: "1", customerId: "", body: "Ask", when: "Tue", at: "t" }, known).length, 0);
  assert.equal(addNote([], { id: "1", customerId: "z", body: "Ask", when: "Tue", at: "t" }, known).length, 0);
  assert.equal(addNote([], { id: "1", customerId: "a", body: "   ", when: "Tue", at: "t" }, known).length, 0);
  const saved = addNote([], { id: "1", customerId: "a", body: " Ask about the call ", when: " Tue 10 ", at: "2026-11-05T10:00:00Z" }, known);
  assert.equal(saved[0].body, "Ask about the call");
  assert.equal(saved[0].when, "Tue 10");
  assert.equal(addNote(saved, { id: "1", customerId: "a", body: "Again", when: "", at: "t" }, known).length, 1);
  const later = addNote(saved, { id: "2", customerId: "b", body: "Pinned later", when: "", at: "2026-11-05T11:00:00Z" }, known);
  const pinned = later.map((note) => (note.id === "2" ? { ...note, pinned: true } : note));
  assert.equal(visibleNotes(pinned, "", false)[0].id, "2");
  assert.equal(visibleNotes(pinned, "Ada", false).length, 0);
  assert.equal(visibleNotes(pinned, "call", false, { a: "Ada" })[0].id, "1");
  assert.equal(visibleNotes(pinned.map((note) => ({ ...note, hidden: note.id === "1" })), "", true)[0].id, "1");
  assert.deepEqual(readNotes([{ id: "9", customerId: "z", body: "Gone" }, { id: "1", customerId: "a", body: "Ask" }, { id: "3", customerId: "a", body: "  " }], known).map((note) => note.id), ["1"]);

  const rows = [
    { id: "1", label: "Ada", currency: "usd", amount: 10 },
    { id: "2", label: "Bea", currency: "eur", amount: 5 },
    { id: "3", label: "Cid", currency: "", amount: 100 },
    { id: "4", label: "Ada USD", currency: "USD", amount: 2.5 },
    { id: "5", label: "Bad", currency: "US", amount: 9 },
  ];
  assert.deepEqual(currencyCodes(rows), ["EUR", "USD"]);
  assert.deepEqual(filterRows(rows, "USD").map((row) => row.id), ["1", "4"]);
  assert.equal(filterRows(rows, "US").length, 0);
  assert.equal(singleTotal(rows, "USD"), null);
  assert.deepEqual(singleTotal(filterRows(rows, "USD"), "USD"), { currency: "USD", count: 2, amount: 12.5 });
  assert.deepEqual(singleTotal(filterRows(rows, "EUR"), "EUR"), { currency: "EUR", count: 1, amount: 5 });
  const lines = currencyLines(rows);
  assert.equal(lines.find((line) => line.currency === "USD")?.amount, 12.5);
  assert.equal(lines.find((line) => line.currency === "EUR")?.amount, 5);
  assert.equal(lines.find((line) => line.currency === "")?.amount, 0);
  assert.equal(lines.find((line) => line.currency === "")?.count, 2);
  assert.deepEqual(visibleMoney(rows, "USD", "ada").map((row) => row.id), ["1", "4"]);
  assert.deepEqual(readHidden(["eur", "gbp", "US"], ["USD", "EUR"]), ["EUR"]);
  assert.deepEqual(toggleCode(["EUR"], "USD", ["USD", "EUR"]), ["EUR", "USD"]);
  assert.deepEqual(visibleCodes(["USD", "EUR"], ["EUR"], false), ["USD"]);
  assert.equal(activeCode("EUR", ["USD"]), "");
  assert.equal(activeCode("usd", ["USD"]), "USD");

  const copy = Object.keys(PACK_EN).sort();
  assert.deepEqual(Object.keys(PACK_TR).sort(), copy);
  assert.deepEqual(Object.keys(PACK_DE).sort(), copy);
  assert.deepEqual(Object.keys(PACK_RU).sort(), copy);
  assert.deepEqual(Object.keys(PACK_AR).sort(), copy);
  assert.notEqual(PACK_TR.cpTitle, PACK_EN.cpTitle);
  assert.notEqual(PACK_DE.ccHint, PACK_EN.ccHint);
  assert.notEqual(PACK_RU.ccTotal, PACK_EN.ccTotal);
  assert.notEqual(PACK_AR.cpBlank, PACK_EN.cpBlank);
  assert.equal(crmv3Text("en", "cpTitle"), "Call pack");
  assert.equal(crmv3Text("tr", "ccTitle"), PACK_TR.ccTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-call-pack", "de"), "Anrufpaket");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "callpack"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "curchips"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("callpack"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("curchips"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("callpack")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("curchips")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-call-pack/);
  assert.match(css, /\.c3-currency-chips/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/pack.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("/api/admin/deposits?take=40"), true);
  assert.equal(view.includes("/api/admin/withdrawals?take=40"), true);
  assert.match(view, /PACK_KEY/);
  assert.match(view, /data-call-pack/);
  assert.match(view, /data-currency-chips/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "callpack"/);
  assert.match(app, /view === "curchips"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round79 tests passed");
}

main();
