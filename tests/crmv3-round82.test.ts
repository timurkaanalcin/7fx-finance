/**
 * CRM v3 desk focus and support pulse.
 * Run: npx tsx tests/crmv3-round82.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FM_AR, FM_DE, FM_EN, FM_RU, FM_TR } from "../src/lib/crmv3/copy-focus";
import { crmv3Text } from "../src/lib/crmv3/copy";
import {
  FOCUS_KEY,
  QUEUE_KEY,
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
} from "../src/lib/crmv3/deskfocus";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(FOCUS_KEY, "crmv3-desk-focus");
  assert.equal(QUEUE_KEY, "crmv3-queue-hide");
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

  const copy = Object.keys(FM_EN).sort();
  assert.deepEqual(Object.keys(FM_TR).sort(), copy);
  assert.deepEqual(Object.keys(FM_DE).sort(), copy);
  assert.deepEqual(Object.keys(FM_RU).sort(), copy);
  assert.deepEqual(Object.keys(FM_AR).sort(), copy);
  assert.notEqual(FM_TR.fmTitle, FM_EN.fmTitle);
  assert.notEqual(FM_DE.qpHint, FM_EN.qpHint);
  assert.notEqual(FM_RU.qpWaiting, FM_EN.qpWaiting);
  assert.notEqual(FM_AR.fmHint, FM_EN.fmHint);
  assert.equal(crmv3Text("en", "fmTitle"), "Desk focus");
  assert.equal(crmv3Text("tr", "qpTitle"), FM_TR.qpTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-desk-focus", "de"), "Tischfokus");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "focusmode"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "suppulse"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("focusmode"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("suppulse"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("focusmode")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("suppulse")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-focus-desk/);
  assert.match(css, /\.c3-queue-pulse/);
  assert.match(css, /data-focus-sections="1"/);
  assert.match(css, /data-focus-rail="1"/);
  assert.match(css, /data-focus-tools="1"/);
  assert.match(css, /\.c3-logo \{\s*filter: none;/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/focus.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("/api/admin/tickets?take=40"), true);
  assert.equal(view.includes("tickets?status"), false);
  assert.equal(view.includes("status=PENDING"), false);
  assert.match(view, /FOCUS_KEY/);
  assert.match(view, /crmv3:desk-focus/);
  assert.match(view, /data-focus-desk/);
  assert.match(view, /data-queue-pulse/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "focusmode"/);
  assert.match(app, /view === "suppulse"/);
  assert.match(app, /data-focus-sections=/);
  assert.match(app, /data-focus-rail=/);
  assert.match(app, /data-focus-tools=/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round82 tests passed");
}

main();
