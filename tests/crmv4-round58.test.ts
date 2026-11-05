/**
 * Deposit review and the checklist pad.
 * Run: npx tsx tests/crmv4-round58.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { ROUND58_COPY } from "../src/lib/crmv4/copy-round58";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addList,
  addStep,
  clearTicks,
  currencyTotals,
  filterDeposits,
  listsFromStorage,
  progress,
  searchLists,
  starterLists,
  togglePin,
  toggleStep,
} from "../src/lib/crmv4/round58";

function main() {
  const rows = [
    { id: "a", amount: 10, currency: "USD", status: "PENDING", method: { label: "Wire" }, user: { name: "Ada" }, note: "first" },
    { id: "b", amount: 20, currency: "TRY", status: "APPROVED", method: { label: "Card" }, user: { name: "Bea" } },
    { id: "c", amount: 5, currency: "USD", status: "PENDING", user: { name: "Cem" } },
    { id: "d", amount: 7, currency: "", status: "REJECTED", user: { name: "Den" } },
  ];
  assert.deepEqual(filterDeposits(rows, "PENDING", "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(filterDeposits(rows, "", "wire").map((row) => row.id), ["a"]);
  const totals = currencyTotals(filterDeposits(rows, "PENDING", ""));
  assert.deepEqual(totals, [{ currency: "USD", count: 2, amount: 15 }]);
  const all = currencyTotals(rows);
  assert.equal(all.some((line) => line.currency === ""), true);
  assert.equal(all.find((line) => line.currency === "USD")?.amount, 15);
  assert.equal(all.find((line) => line.currency === "TRY")?.amount, 20);
  assert.notEqual(all.find((line) => line.currency === "USD")?.amount, 42);

  const blank = approvalBody("dep-1", "reject", "   ");
  assert.deepEqual(blank, { id: "dep-1", action: "reject" });
  assert.equal("approvalReason" in blank, false);
  assert.equal(approvalBody("dep-1", "approve", " rate ")?.approvalReason, "rate");

  const seeded = listsFromStorage(null);
  assert.equal(seeded.seeded, true);
  assert.deepEqual(seeded.lists.map((list) => list.id), ["onboarding", "kyc"]);
  assert.equal(listsFromStorage("[]").seeded, false);
  assert.equal(listsFromStorage("[]").lists.length, 0);
  const lists = starterLists();
  const ticked = toggleStep(lists, "onboarding", "ob-name");
  assert.equal(progress(ticked[0]).done, 1);
  assert.equal(progress(clearTicks(ticked, "onboarding")[0]).done, 0);
  const blankList = addList(lists, "list-1", "   ");
  assert.equal(blankList.length, lists.length);
  const named = addList(lists, "list-1", " Night desk ");
  assert.equal(named[0].title, "Night desk");
  const blankStep = addStep(named, "kyc", "step-1", "  ");
  assert.equal(blankStep.find((list) => list.id === "kyc")?.steps.length, 3);
  const withStep = addStep(named, "kyc", "step-1", " Call back ");
  assert.equal(withStep.find((list) => list.id === "kyc")?.steps.at(-1)?.label, "Call back");
  assert.equal(togglePin(lists, "kyc").find((list) => list.id === "kyc")?.pinned, true);
  assert.equal(searchLists(lists, "kyc")[0].id, "kyc");

  const copy = Object.keys(ROUND58_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND58_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "dbTitle"), "Deposit review");
  assert.equal(crmv4Text("tr", "sopTitle"), ROUND58_COPY.tr.sopTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dep-board/);
  assert.match(css, /\.c4-sop-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round58.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /data-dep-board/);
  assert.match(view, /data-sop-pad/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /storedRole/);
  assert.match(view, /approvalBody/);
  assert.match(view, /approvalEndpoint\("DEPOSIT"\)/);
  assert.match(view, /PENDING/);
  const pad = view.slice(view.indexOf("export function SopPad"));
  assert.equal(pad.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "depboard"/);
  assert.match(app, /view === "sop"/);
  console.log("crmv4 round58 tests passed");
}

main();
