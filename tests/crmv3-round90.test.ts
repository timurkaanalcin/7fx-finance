/**
 * CRM v3 scratch pad and order status glance.
 * Run: npx tsx tests/crmv3-round90.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NP_AR, NP_DE, NP_EN, NP_RU, NP_TR } from "../src/lib/crmv3/copy-notepad";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  PAD_KEY,
  STATUS_KEY,
  activeStatus,
  addPad,
  namedStatuses,
  padText,
  readHiddenStatuses,
  readPads,
  statusLines,
  statusText,
  toggleStatus,
  visibleOrders,
  visiblePads,
  visibleStatuses,
} from "../src/lib/crmv3/notepad";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(PAD_KEY, "crmv3-scratch-pads");
  assert.equal(STATUS_KEY, "crmv3-order-status-hide");
  assert.equal(padText("  \n  "), "");
  assert.equal(padText(" Call Ada\r\nThen pack "), "Call Ada\nThen pack");
  assert.equal(padText("x".repeat(2100)).length, 2000);
  assert.equal(addPad([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addPad([], { id: "1", text: "Call Ada\nThen pack", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].text.includes("\n"), true);
  const later = addPad(saved, { id: "2", text: "Rates note", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((pad) => (pad.id === "1" ? { ...pad, pinned: true } : pad));
  assert.equal(visiblePads(pinned, "", false)[0].id, "1");
  assert.equal(visiblePads(pinned, "rates", false)[0].text, "Rates note");
  assert.equal(visiblePads(pinned, "then pack", false)[0].id, "1");
  assert.equal(visiblePads(pinned.map((pad) => ({ ...pad, hidden: pad.id === "2" })), "", true)[0].text, "Rates note");
  assert.deepEqual(readPads([{ id: "9", text: "  " }, { id: "1", text: "Call Ada" }, { id: "1", text: "Again" }]).map((pad) => pad.id), ["1"]);

  const rows = [
    { id: "a", label: "EURUSD Ada", status: " FILLED " },
    { id: "b", label: "EURUSD Bea", status: "FILLED" },
    { id: "c", label: "GBPUSD Cid", status: { status: "PENDING" } },
    { id: "d", label: "USDJPY Dot", status: null },
    { id: "e", label: "XAUUSD Eve" },
  ];
  assert.equal(statusText(" FILLED "), "FILLED");
  assert.equal(statusText({ status: "PENDING" }), "PENDING");
  assert.equal(statusText(undefined), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "FILLED", count: 2 },
    { status: "PENDING", count: 1 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["FILLED", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("OPEN"), false);
  assert.deepEqual(visibleOrders(rows, "FILLED", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleOrders(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleOrders(rows, "PENDING", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenStatuses(["FILLED", "Invented", ""], ["FILLED", "PENDING"]), ["FILLED"]);
  assert.deepEqual(toggleStatus(["FILLED"], "PENDING", ["FILLED", "PENDING"]), ["FILLED", "PENDING"]);
  assert.deepEqual(visibleStatuses(["FILLED", "PENDING"], ["PENDING"], false), ["FILLED"]);
  assert.equal(activeStatus("PENDING", ["FILLED"]), "");

  const copy = Object.keys(NP_EN).sort();
  assert.deepEqual(Object.keys(NP_TR).sort(), copy);
  assert.deepEqual(Object.keys(NP_DE).sort(), copy);
  assert.deepEqual(Object.keys(NP_RU).sort(), copy);
  assert.deepEqual(Object.keys(NP_AR).sort(), copy);
  assert.notEqual(NP_TR.npTitle, NP_EN.npTitle);
  assert.notEqual(NP_DE.ogHint, NP_EN.ogHint);
  assert.notEqual(NP_RU.ogBlank, NP_EN.ogBlank);
  assert.notEqual(NP_AR.npBlank, NP_EN.npBlank);
  assert.equal(crmv3Text("en", "npTitle"), "Scratch pad");
  assert.equal(crmv3Text("tr", "ogTitle"), NP_TR.ogTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-scratch-pads", "de"), "Notizblock");
  assert.equal(keyTitle("crmv3-order-status-hide", "tr"), "Durum bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "scratchpad"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "orderstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("scratchpad"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("orderstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("scratchpad")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("orderstatus")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-scratch-pads/);
  assert.match(css, /\.c3-order-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/notepad.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("profit"), false);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-scratch-pads/);
  assert.match(view, /data-order-glance/);
  assert.match(view, /PAD_KEY/);
  assert.match(view, /STATUS_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "scratchpad"/);
  assert.match(app, /view === "orderstatus"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round90 tests passed");
}

main();
