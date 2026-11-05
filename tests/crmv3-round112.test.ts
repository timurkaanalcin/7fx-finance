/**
 * Shift handoff notes and deposit currencies.
 * Run: npx tsx tests/crmv3-round112.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HP_AR, HP_DE, HP_EN, HP_RU, HP_TR } from "../src/lib/crmv3/copy-handoffpolish";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { CCY_HIDE_KEY, NOTE_KEY } from "../src/lib/crmv3/handoffpolish";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeCurrency,
  addNote,
  currencyCode,
  currencyLines,
  namedCurrencies,
  noteText,
  readHiddenCurrencies,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleCurrency,
  toggleNotePin,
  visibleCurrencies,
  visibleDeposits,
  visibleNotes,
} from "../src/lib/crmv3/handoffpolish";

function main() {
  assert.equal(NOTE_KEY, "crmv3-handoff-polish");
  assert.equal(CCY_HIDE_KEY, "crmv3-deposit-currency-hide");
  assert.equal(noteText("  Watch\nAda  "), "Watch Ada");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Watch", pinned: 1 }]), [
    { id: "2", text: "Watch", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Watch Ada " });
  assert.deepEqual(saved, [{ id: "a", text: "Watch Ada", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Watch Ada" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "ada").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(resetNotes(), []);

  assert.equal(currencyCode(" usd "), "USD");
  assert.equal(currencyCode("eur"), "EUR");
  assert.equal(currencyCode(""), "");
  assert.equal(currencyCode("12"), "");
  assert.equal(currencyCode(10 as never), "");
  assert.equal(currencyCode({ currency: " try " }), "TRY");
  assert.equal(currencyCode({ amount: 50 } as never), "");
  const rows = [
    { id: "d1", label: "Ada PENDING", currency: "usd" },
    { id: "d2", label: "Bea PENDING", currency: "EUR" },
    { id: "d3", label: "Cid APPROVED", currency: "usd" },
    { id: "d4", label: "Dot", currency: "" },
    { id: "d5", label: "Eve", currency: 10 as never },
  ];
  assert.deepEqual(currencyLines(rows), [
    { currency: "", count: 2 },
    { currency: "EUR", count: 1 },
    { currency: "USD", count: 2 },
  ]);
  assert.deepEqual(namedCurrencies(rows), ["EUR", "USD"]);
  assert.deepEqual(visibleDeposits(rows, "USD", false, "ada").map((row) => row.id), ["d1"]);
  assert.deepEqual(visibleDeposits(rows, "", true, "").map((row) => row.id), ["d4", "d5"]);
  assert.deepEqual(readHiddenCurrencies(["USD", "GBP", ""], ["USD", "EUR"]), ["USD"]);
  assert.deepEqual(toggleCurrency(["USD"], "GBP", ["USD"]), ["USD"]);
  assert.deepEqual(visibleCurrencies(["USD", "EUR"], ["EUR"], false), ["USD"]);
  assert.equal(activeCurrency("EUR", ["USD"]), "");
  const counts = currencyLines(rows);
  assert.equal(counts.every((line) => !("amount" in line)), true);

  const copy = Object.keys(HP_EN).sort();
  for (const table of [HP_TR, HP_DE, HP_RU, HP_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "hpTitle"), "Shift handoff");
  assert.equal(crmv3Text("tr", "qcTitle"), HP_TR.qcTitle);
  assert.equal(keyTitle("crmv3-handoff-polish", "de"), "Schichtübergabe");
  assert.equal(keyTitle("crmv3-deposit-currency-hide", "ar"), "عملات الإيداع");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "handoffpolish"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "depcurrency"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("handoffpolish"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("depcurrency"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("handoffpolish")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("depcurrency")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-handoff-polish/);
  assert.match(css, /\.c3-ccy-glance/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/handoffpolish.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "USD"'), false);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-handoff-polish/);
  assert.match(view, /data-ccy-glance/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /handoff/);
  assert.match(view, /deposit/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "handoffpolish"/);
  assert.match(app, /view === "depcurrency"/);
  console.log("crmv3 round112 tests passed");
}

main();
