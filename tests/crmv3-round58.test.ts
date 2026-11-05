/**
 * CRM v3 deposit review and the checklist pad.
 * Run: npx tsx tests/crmv3-round58.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { SOP_AR, SOP_DE, SOP_EN, SOP_RU, SOP_TR } from "../src/lib/crmv3/copy-sop";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  SOP_KEY,
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
} from "../src/lib/crmv3/sop";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(SOP_KEY, "crmv3-sop-lists");

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

  const copy = Object.keys(SOP_EN).sort();
  assert.deepEqual(Object.keys(SOP_TR).sort(), copy);
  assert.deepEqual(Object.keys(SOP_DE).sort(), copy);
  assert.deepEqual(Object.keys(SOP_RU).sort(), copy);
  assert.deepEqual(Object.keys(SOP_AR).sort(), copy);
  assert.notEqual(SOP_TR.dbTitle, SOP_EN.dbTitle);
  assert.notEqual(SOP_DE.sopHint, SOP_EN.sopHint);
  assert.notEqual(SOP_RU.dbViewer, SOP_EN.dbViewer);
  assert.notEqual(SOP_AR.sopBlank, SOP_EN.sopBlank);
  assert.equal(crmv3Text("en", "dbTitle"), "Deposit review");
  assert.equal(crmv3Text("tr", "sopTitle"), SOP_TR.sopTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-sop-lists", "tr"), "Masa listeleri");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "depboard"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "sop"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("depboard"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("sop"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("depboard")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("sop")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-dep-board/);
  assert.match(css, /\.c3-sop-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/sop.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-dep-board/);
  assert.match(view, /data-sop-pad/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /deskRole/);
  assert.match(view, /approvalBody/);
  assert.match(view, /approvalEndpoint\("DEPOSIT"\)/);
  assert.match(view, /PENDING/);
  const pad = view.slice(view.indexOf("export function SopPad"));
  assert.equal(pad.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "depboard"/);
  assert.match(app, /view === "sop"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round58 tests passed");
}

main();
