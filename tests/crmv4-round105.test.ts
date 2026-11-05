/**
 * Checklist items and case priorities.
 * Run: npx tsx tests/crmv4-round105.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND105_COPY } from "../src/lib/crmv4/copy-round105";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activePriority,
  addItem,
  itemText,
  namedPriorities,
  priorityLines,
  priorityText,
  readHiddenPriorities,
  readItems,
  setItemDone,
  togglePriority,
  visibleCases,
  visibleItems,
  visiblePriorities,
} from "../src/lib/crmv4/round105";

function main() {
  assert.equal(itemText("  "), "");
  assert.equal(itemText(" Call\nAda "), "Call Ada");
  assert.equal(itemText("x".repeat(50)).length, 40);
  assert.equal(addItem([], { id: "1", text: "   ", at: "t" }).length, 0);
  const saved = addItem([], { id: "1", text: "Call Ada", at: "2026-11-05T10:00:00Z" });
  assert.equal(addItem(saved, { id: "2", text: "Call Ada", at: "t" }).length, 1);
  const later = addItem(saved, { id: "2", text: "File the note", at: "2026-11-05T11:00:00Z" });
  const pinned = later.map((item) => (item.id === "1" ? { ...item, pinned: true } : item));
  assert.equal(visibleItems(pinned, "", false)[0].id, "1");
  assert.equal(visibleItems(pinned, "file", false)[0].text, "File the note");
  assert.equal(visibleItems(pinned, "file", false).some((item) => item.id === "1"), false);
  const done = setItemDone(saved, "1", true);
  assert.equal(done[0].done, true);
  assert.equal(setItemDone(done, "1", false)[0].done, false);
  assert.equal(visibleItems(done, "", false)[0].done, true);
  assert.deepEqual(readItems([{ id: "9", text: "  " }, { id: "1", text: "Call Ada" }, { id: "3", text: "Call Ada" }]).map((item) => item.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", priority: " high " },
    { id: "b", label: "Bea", priority: "high" },
    { id: "c", label: "Cid", priority: null, kind: "DEPOSIT", status: "PENDING" },
    { id: "d", label: "Dot" },
  ];
  assert.equal(priorityText(" high "), "high");
  assert.equal(priorityText({ priority: "low", kind: "DEPOSIT" }), "low");
  assert.equal(priorityText({ kind: "DEPOSIT" }), "");
  assert.equal(priorityText({ status: "PENDING" }), "");
  assert.deepEqual(priorityLines(rows), [
    { priority: "", count: 2 },
    { priority: "high", count: 2 },
  ]);
  assert.deepEqual(namedPriorities(rows), ["high"]);
  assert.equal(namedPriorities([{ priority: null }]).includes("normal"), false);
  assert.deepEqual(visibleCases(rows, "high", false, "bea").map((row) => row.id), ["b"]);
  assert.deepEqual(visibleCases(rows, "", true, "").map((row) => row.id), ["c", "d"]);
  assert.deepEqual(readHiddenPriorities(["high", "normal", ""], ["high"]), ["high"]);
  assert.deepEqual(togglePriority(["high"], "normal", ["high"]), ["high"]);
  assert.deepEqual(visiblePriorities(["high"], ["high"], false), []);
  assert.equal(activePriority("high", []), "");

  const copy = Object.keys(ROUND105_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND105_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hkTitle"), "Checklist");
  assert.equal(crmv4Text("tr", "zqTitle"), ROUND105_COPY.tr.zqTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-check-polish/);
  assert.match(css, /\.c4-case-priority/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round105.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes('?? "normal"'), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-check-polish/);
  assert.match(view, /data-case-priority/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "checkpolish"/);
  assert.match(app, /view === "casepriority"/);
  console.log("crmv4 round105 tests passed");
}

main();
