/**
 * Shift handoff notes and deposit currencies.
 * Run: npx tsx tests/crmv4-round112.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND112_COPY } from "../src/lib/crmv4/copy-round112";
import { crmv4Text } from "../src/lib/crmv4/copy";
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
} from "../src/lib/crmv4/round112";

function main() {
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

  const copy = Object.keys(ROUND112_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND112_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hpTitle"), "Shift handoff");
  assert.equal(crmv4Text("tr", "qcTitle"), ROUND112_COPY.tr.qcTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-handoff-polish/);
  assert.match(css, /\.c4-ccy-glance/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round112.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "handoffpolish"/);
  assert.match(app, /view === "depcurrency"/);
  console.log("crmv4 round112 tests passed");
}

main();
