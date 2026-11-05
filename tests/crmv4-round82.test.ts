/**
 * Desk focus and support queue pulse.
 * Run: npx tsx tests/crmv4-round82.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND82_COPY } from "../src/lib/crmv4/copy-round82";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeQueue,
  otherStatuses,
  presentQueues,
  queueKind,
  queueSplit,
  readFocus,
  readHiddenQueues,
  togglePanel,
  toggleQueue,
  visiblePanels,
  visibleQueues,
  visibleTickets,
} from "../src/lib/crmv4/round82";

function main() {
  assert.deepEqual(readFocus(["sections", "logo", "pad", "rail"]), ["sections", "rail"]);
  assert.deepEqual(togglePanel(["sections"], "nope"), ["sections"]);
  assert.deepEqual(togglePanel(["sections"], "rail"), ["sections", "rail"]);
  assert.deepEqual(togglePanel(["sections", "rail"], "rail"), ["sections"]);
  const names = { sections: "Section rail", rail: "Icon rail", tools: "Top tools" };
  assert.deepEqual(visiblePanels(["rail"], "", false, names), ["sections", "tools"]);
  assert.deepEqual(visiblePanels(["rail"], "icon", true, names), ["rail"]);
  assert.deepEqual(visiblePanels([], "zzz", false, names), []);

  const rows = [
    { id: "1", label: "Ada DEPOSIT", status: "OPEN" },
    { id: "2", label: "Bea MARGIN", status: " waiting " },
    { id: "3", label: "Cid WITHDRAW", status: "PENDING" },
    { id: "4", label: "Dot", status: "" },
    { id: "5", label: "Eve", status: "APPROVED" },
    { id: "6", label: "Fay", status: "open" },
  ];
  assert.equal(queueKind("PENDING"), "");
  assert.equal(queueKind(""), "");
  assert.equal(queueKind("APPROVED"), "");
  assert.deepEqual(queueSplit(rows), { open: 2, waiting: 1 });
  assert.deepEqual(otherStatuses(rows), [{ status: "APPROVED", count: 1 }, { status: "PENDING", count: 1 }]);
  assert.deepEqual(presentQueues(rows), ["open", "waiting"]);
  assert.deepEqual(visibleTickets(rows, "open", "ada").map((row) => row.id), ["1"]);
  assert.equal(visibleTickets(rows, "waiting", "").some((row) => row.id === "3"), false);
  assert.deepEqual(readHiddenQueues(["open", "pending", ""]), ["open"]);
  assert.deepEqual(toggleQueue(["open"], "waiting"), ["open", "waiting"]);
  assert.deepEqual(visibleQueues(["open", "waiting"], ["waiting"], false), ["open"]);
  assert.equal(activeQueue("waiting", ["open"]), "");
  assert.equal(activeQueue("OPEN", ["open"]), "open");

  const copy = Object.keys(ROUND82_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND82_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "fmTitle"), "Desk focus");
  assert.equal(crmv4Text("tr", "qpTitle"), ROUND82_COPY.tr.qpTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-focus-desk/);
  assert.match(css, /\.c4-queue-pulse/);
  assert.match(css, /data-focus-sections="1"/);
  assert.match(css, /data-focus-rail="1"/);
  assert.match(css, /data-focus-tools="1"/);
  assert.match(css, /\.c4-logo \{ filter: none; \}/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round82.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("/api/admin/tickets?take=40"), true);
  assert.equal(view.includes("tickets?status"), false);
  assert.equal(view.includes("status=PENDING"), false);
  assert.match(view, /data-focus-desk/);
  assert.match(view, /data-queue-pulse/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "focusmode"/);
  assert.match(app, /view === "suppulse"/);
  assert.match(app, /data-focus-sections=/);
  assert.match(app, /data-focus-rail=/);
  assert.match(app, /data-focus-tools=/);
  console.log("crmv4 round82 tests passed");
}

main();
