/**
 * CRM v3 shift checklist and ledger glance counts.
 * Run: npx tsx tests/crmv3-round75.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LIST_AR, LIST_DE, LIST_EN, LIST_RU, LIST_TR } from "../src/lib/crmv3/copy-shiftlist";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  GLANCE_BOARDS,
  GLANCE_LISTS,
  HIDE_KEY,
  LIST_KEY,
  addStep,
  readShift,
  splitCounts,
  toggleKind,
  toggleStep,
  visibleKinds,
} from "../src/lib/crmv3/shiftlist";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(LIST_KEY, "crmv3-shift-check");
  assert.equal(HIDE_KEY, "crmv3-glance-hide");
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
    { id: "a", status: "PENDING" },
    { id: "b", status: "APPROVED" },
    { id: "c", status: "REJECTED" },
    { id: "", status: "PENDING" },
    { id: "d", status: "" },
  ];
  assert.deepEqual(splitCounts(rows, "deposits"), { pending: 1, settled: 1 });
  const orders = [
    { id: "o1", status: "PENDING" },
    { id: "o2", status: "FILLED" },
    { id: "o3", status: "CANCELLED" },
  ];
  assert.deepEqual(splitCounts(orders, "trades"), { pending: 1, settled: 1 });
  assert.equal(JSON.stringify(splitCounts(rows, "withdrawals")).includes("EUR"), false);
  assert.equal(GLANCE_LISTS.deposits, "/api/admin/deposits?take=40");
  assert.equal(GLANCE_LISTS.withdrawals, "/api/admin/withdrawals?take=40");
  assert.equal(GLANCE_LISTS.trades, "/api/admin/positions?tab=orders&take=40");
  assert.equal(GLANCE_BOARDS.deposits, "depboard");
  assert.equal(GLANCE_BOARDS.withdrawals, "payboard");
  assert.equal(GLANCE_BOARDS.trades, "blotter");
  const hidden = toggleKind([], "trades");
  assert.deepEqual(visibleKinds(hidden, false), ["deposits", "withdrawals"]);
  assert.deepEqual(visibleKinds(hidden, true), ["trades"]);

  const copy = Object.keys(LIST_EN).sort();
  assert.deepEqual(Object.keys(LIST_TR).sort(), copy);
  assert.deepEqual(Object.keys(LIST_DE).sort(), copy);
  assert.deepEqual(Object.keys(LIST_RU).sort(), copy);
  assert.deepEqual(Object.keys(LIST_AR).sort(), copy);
  assert.notEqual(LIST_TR.sfTitle, LIST_EN.sfTitle);
  assert.notEqual(LIST_DE.gcHint, LIST_EN.gcHint);
  assert.notEqual(LIST_RU.gcPending, LIST_EN.gcPending);
  assert.notEqual(LIST_AR.sfBlank, LIST_EN.sfBlank);
  assert.equal(crmv3Text("en", "sfTitle"), "Shift checklist");
  assert.equal(crmv3Text("tr", "gcTitle"), LIST_TR.gcTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-shift-check", "de"), "Schichtliste");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "shiftlist"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "glance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("shiftlist"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("glance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("shiftlist")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("glance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-shift-check/);
  assert.match(css, /\.c3-glance-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/shiftlist.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /GLANCE_LISTS/);
  assert.match(view, /data-shift-check/);
  assert.match(view, /data-glance-strip/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "shiftlist"/);
  assert.match(app, /view === "glance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round75 tests passed");
}

main();
