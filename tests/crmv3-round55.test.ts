/**
 * CRM v3 payout board and the shift handoff.
 * Run: npx tsx tests/crmv3-round55.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { SHIFT_AR, SHIFT_DE, SHIFT_EN, SHIFT_RU, SHIFT_TR } from "../src/lib/crmv3/copy-shift";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  SHIFT_KEY,
  addShift,
  clearShift,
  currencyTotals,
  filterPays,
  payLabel,
  readShift,
  searchShift,
  toggleShiftPin,
} from "../src/lib/crmv3/shift";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(SHIFT_KEY, "crmv3-shift-handoff");

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

  const copy = Object.keys(SHIFT_EN).sort();
  assert.deepEqual(Object.keys(SHIFT_TR).sort(), copy);
  assert.deepEqual(Object.keys(SHIFT_DE).sort(), copy);
  assert.deepEqual(Object.keys(SHIFT_RU).sort(), copy);
  assert.deepEqual(Object.keys(SHIFT_AR).sort(), copy);
  assert.notEqual(SHIFT_TR.pbTitle, SHIFT_EN.pbTitle);
  assert.notEqual(SHIFT_DE.shHint, SHIFT_EN.shHint);
  assert.notEqual(SHIFT_RU.pbViewer, SHIFT_EN.pbViewer);
  assert.notEqual(SHIFT_AR.shNone, SHIFT_EN.shNone);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-shift-handoff", "tr"), "Vardiya devri");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "payboard"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "handoff"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("payboard"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("handoff"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("payboard")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("handoff")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-payout-board/);
  assert.match(css, /\.c3-handoff/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/shift.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-pay-board/);
  assert.match(view, /data-handoff/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /approvalBody/);
  assert.match(view, /deskRole/);
  const sheet = view.slice(view.indexOf("export function ShiftSheet"));
  assert.equal(sheet.includes("sendJson"), false);
  assert.match(sheet, /data-shift-clear/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "payboard"/);
  assert.match(app, /view === "handoff"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round55 tests passed");
}

main();
