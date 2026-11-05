/**
 * Color tags and trade sides.
 * Run: npx tsx tests/crmv4-round106.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND106_COPY } from "../src/lib/crmv4/copy-round106";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeSide,
  addTag,
  assignTag,
  clearAssignment,
  namedSides,
  readAssignments,
  readHiddenSides,
  readTags,
  sideLines,
  sideText,
  tagText,
  toggleSide,
  visibleOrders,
  visibleSides,
  visibleTags,
} from "../src/lib/crmv4/round106";

function main() {
  assert.equal(tagText("  "), "");
  assert.equal(tagText(" Desk\ngold "), "Desk gold");
  assert.equal(tagText("x".repeat(50)).length, 40);
  assert.equal(addTag([], { id: "1", text: "   ", color: "ivory", at: "t" }).length, 0);
  assert.equal(addTag([], { id: "1", text: "Gold", color: "#7a5e30", at: "t" }).length, 0);
  const saved = addTag([], { id: "1", text: "Gold", color: "champagne", at: "2026-11-05T10:00:00Z" });
  assert.equal(addTag(saved, { id: "2", text: "Gold", color: "ivory", at: "t" }).length, 1);
  const later = addTag(saved, { id: "2", text: "Ink", color: "ink", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((tag) => (tag.id === "1" ? { ...tag, pinned: true } : tag));
  assert.equal(visibleTags(pinned, "", false)[0].id, "1");
  assert.equal(visibleTags(pinned, "ink", false)[0].text, "Ink");
  assert.deepEqual(readTags([{ id: "9", text: "  ", color: "ivory" }, { id: "1", text: "Gold", color: "nope" }, { id: "2", text: "Gold", color: "champagne" }]).map((tag) => tag.id), ["2"]);
  const present = ["ada", "bea"];
  const tags = saved.map((tag) => tag.id);
  assert.deepEqual(readAssignments([{ id: "nope", tagId: "1" }, { id: "ada", tagId: "missing" }, { id: "ada", tagId: "1" }], present, tags), [{ id: "ada", tagId: "1" }]);
  assert.equal(assignTag([], "nope", "1", present, tags).length, 0);
  assert.equal(assignTag([], "", "1", present, tags).length, 0);
  const assigned = assignTag([], "ada", "1", present, tags);
  assert.equal(assignTag(assigned, "ada", "1", present, tags).length, 1);
  assert.deepEqual(clearAssignment(assigned, "ada", present, tags), []);

  const rows = [
    { id: "a", label: "EURUSD", side: " BUY " },
    { id: "b", label: "GBPUSD", side: "BUY" },
    { id: "c", label: "XAUUSD", side: "SELL" },
    { id: "d", label: "USDJPY", side: "" },
    { id: "e", label: "EURGBP", side: null, type: "LIMIT" },
  ];
  assert.equal(sideText(" BUY "), "BUY");
  assert.equal(sideText({ side: "SELL", type: "LIMIT" }), "SELL");
  assert.equal(sideText({ type: "LIMIT" }), "");
  assert.deepEqual(sideLines(rows), [
    { side: "", count: 2 },
    { side: "BUY", count: 2 },
    { side: "SELL", count: 1 },
  ]);
  assert.deepEqual(namedSides(rows), ["BUY", "SELL"]);
  assert.equal(namedSides([{ side: null }]).includes("BUY"), false);
  assert.deepEqual(visibleOrders(rows, "BUY", false, "gbp").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleOrders(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.deepEqual(readHiddenSides(["BUY", "HOLD", ""], ["BUY", "SELL"]), ["BUY"]);
  assert.deepEqual(toggleSide(["BUY"], "HOLD", ["BUY"]), ["BUY"]);
  assert.deepEqual(visibleSides(["BUY", "SELL"], ["SELL"], false), ["BUY"]);
  assert.equal(activeSide("SELL", ["BUY"]), "");

  const copy = Object.keys(ROUND106_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND106_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qaTitle"), "Color tags");
  assert.equal(crmv4Text("tr", "ysTitle"), ROUND106_COPY.tr.ysTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-color-tags/);
  assert.match(css, /\.c4-trade-side/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round106.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("price"), false);
  assert.equal(view.includes('?? "BUY"'), false);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/positions\?tab=orders&take=40/);
  assert.match(view, /data-color-tags/);
  assert.match(view, /data-trade-side/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "colortags"/);
  assert.match(app, /view === "tradeside"/);
  console.log("crmv4 round106 tests passed");
}

main();
