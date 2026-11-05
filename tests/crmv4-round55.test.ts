/**
 * Payout board and the shift handoff.
 * Run: npx tsx tests/crmv4-round55.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { ROUND55_COPY } from "../src/lib/crmv4/copy-round55";
import {
  addShift,
  clearShift,
  currencyTotals,
  filterPays,
  payLabel,
  readShift,
  searchShift,
  toggleShiftPin,
} from "../src/lib/crmv4/round55";

function main() {
  const rows = [
    { id: "w1", amount: 10, currency: "usd", status: "PENDING", method: "BANK", user: { id: "a", name: "Ada", email: "ada@desk.test" } },
    { id: "w2", amount: 2.5, currency: "USD", status: "APPROVED", method: "BANK", user: { id: "a", name: "Ada" } },
    { id: "w3", amount: 7, currency: "TRY", status: "PENDING", method: "CRYPTO", user: { id: "b", name: "Bea" } },
    { id: "w4", amount: 4, currency: "", status: "PENDING", method: "BANK", user: { id: "c", name: "Cy" } },
  ];
  assert.deepEqual(filterPays(rows, "PENDING", "ada").map((row) => row.id), ["w1"]);
  assert.equal(filterPays(rows, "REJECTED", "").length, 0);
  const totals = currencyTotals(filterPays(rows, "", ""));
  assert.deepEqual(totals.find((line) => line.currency === "USD"), { currency: "USD", count: 2, amount: 12.5 });
  assert.deepEqual(totals.find((line) => line.currency === "TRY"), { currency: "TRY", count: 1, amount: 7 });
  assert.equal(totals.find((line) => line.currency === "")?.amount, 4);
  assert.equal(totals.some((line) => line.currency === "USD" && line.amount === 16.5), false);
  assert.equal(payLabel(rows[2]), "Bea · 7 · TRY");

  const blank = approvalBody("w1", "approve", "  ");
  assert.equal("approvalReason" in blank, false);
  assert.equal(approvalBody("w1", "reject", " late ").approvalReason, "late");

  let notes = addShift([], { id: "s1", open: "Ada · 10 · USD", watch: "  Bea  ", at: "2026-11-05T10:00:00Z" });
  notes = addShift(notes, { id: "s2", open: "", watch: "", at: "2026-11-05T11:00:00Z" });
  assert.equal(notes.length, 1);
  assert.equal(notes[0].watch, "Bea");
  notes = toggleShiftPin(notes, "s1");
  assert.equal(searchShift(notes, "usd")[0].pinned, true);
  assert.equal(searchShift(notes, "missing").length, 0);
  assert.equal(clearShift(notes, "s1").length, 0);
  assert.equal(readShift([{ id: "s9", open: "Open", watch: "", pinned: true }])[0].pinned, true);
  assert.equal(readShift("nope").length, 0);

  const copy = Object.keys(ROUND55_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND55_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-payout-board/);
  assert.match(css, /\.c4-handoff/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round55.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /data-pay-board/);
  assert.match(view, /data-handoff/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /approvalBody/);
  assert.match(view, /storedRole/);
  const sheet = view.slice(view.indexOf("export function ShiftSheet"));
  assert.equal(sheet.includes("sendJson"), false);
  assert.match(sheet, /data-shift-clear/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "payboard"/);
  assert.match(app, /view === "handoff"/);
  console.log("crmv4 round55 tests passed");
}

main();
