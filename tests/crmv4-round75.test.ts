/**
 * Shift checklist and ledger glance counts.
 * Run: npx tsx tests/crmv4-round75.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND75_COPY } from "../src/lib/crmv4/copy-round75";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  GLANCE_BOARDS,
  GLANCE_LISTS,
  addStep,
  readShift,
  splitCounts,
  toggleKind,
  toggleStep,
  visibleKinds,
} from "../src/lib/crmv4/round75";

function main() {
  const today = "2026-11-05";
  assert.deepEqual(readShift({ day: "2026-11-04", steps: [{ id: "a", label: "Old", done: true }] }, today).steps, []);
  assert.equal(readShift({ day: "2026-11-04", steps: [{ id: "a", label: "Old", done: true }] }, today).day, today);
  const empty = readShift(null, today);
  assert.equal(addStep(empty, { id: "s1", label: "   " }).steps.length, 0);
  const list = addStep(empty, { id: "s1", label: " Close the queue " });
  assert.equal(list.steps[0].label, "Close the queue");
  assert.equal(list.steps[0].done, false);
  assert.equal(toggleStep(list, "s1").steps[0].done, true);
  assert.equal(toggleStep(toggleStep(list, "s1"), "s1").steps[0].done, false);

  const rows = [
    { id: "a", status: "PENDING", amount: 80, currency: "EUR" },
    { id: "b", status: "APPROVED", amount: 10, currency: "USD" },
    { id: "c", status: "REJECTED", amount: 4, currency: "TRY" },
    { id: "", status: "PENDING", amount: 3, currency: "USD" },
    { id: "d", status: "", amount: 9, currency: "EUR" },
  ] as unknown as Parameters<typeof splitCounts>[0];
  assert.deepEqual(splitCounts(rows, "deposits"), { pending: 1, settled: 1 });
  const orders = [
    { id: "o1", status: "PENDING", price: 1 },
    { id: "o2", status: "FILLED", price: 2 },
    { id: "o3", status: "CANCELLED", price: 3 },
  ] as unknown as Parameters<typeof splitCounts>[0];
  assert.deepEqual(splitCounts(orders, "trades"), { pending: 1, settled: 1 });
  assert.equal(JSON.stringify(splitCounts(rows, "withdrawals")).includes("EUR"), false);
  assert.equal(GLANCE_LISTS.deposits, "/api/admin/deposits?take=40");
  assert.equal(GLANCE_LISTS.withdrawals, "/api/admin/withdrawals?take=40");
  assert.equal(GLANCE_LISTS.trades, "/api/admin/positions?tab=orders&take=40");
  assert.equal(GLANCE_BOARDS.trades, "blotter");
  const hidden = toggleKind([], "trades");
  assert.deepEqual(visibleKinds(hidden, false), ["deposits", "withdrawals"]);
  assert.deepEqual(visibleKinds(hidden, true), ["trades"]);

  const copy = Object.keys(ROUND75_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND75_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "sfTitle"), "Shift checklist");
  assert.equal(crmv4Text("tr", "gcTitle"), ROUND75_COPY.tr.gcTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-shift-check/);
  assert.match(css, /\.c4-glance-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round75.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /GLANCE_LISTS/);
  assert.match(view, /data-shift-check/);
  assert.match(view, /data-glance-strip/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "shiftlist"/);
  assert.match(app, /view === "glance"/);
  console.log("crmv4 round75 tests passed");
}

main();
