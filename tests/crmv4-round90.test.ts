/**
 * Scratch pads and order statuses.
 * Run: npx tsx tests/crmv4-round90.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND90_COPY } from "../src/lib/crmv4/copy-round90";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round90";

function main() {
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

  const copy = Object.keys(ROUND90_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND90_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "npTitle"), "Scratch pad");
  assert.equal(crmv4Text("tr", "ogTitle"), ROUND90_COPY.tr.ogTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-scratch-pads/);
  assert.match(css, /\.c4-order-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round90.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("profit"), false);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-scratch-pads/);
  assert.match(view, /data-order-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "scratchpad"/);
  assert.match(app, /view === "orderstatus"/);
  console.log("crmv4 round90 tests passed");
}

main();
