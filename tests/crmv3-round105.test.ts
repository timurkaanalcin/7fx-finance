/**
 * CRM v3 checklist items and case priority glance.
 * Run: npx tsx tests/crmv3-round105.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HK_AR, HK_DE, HK_EN, HK_RU, HK_TR } from "../src/lib/crmv3/copy-checkpolish";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  CHECK_KEY,
  PRIORITY_KEY,
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
} from "../src/lib/crmv3/checkpolish";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(CHECK_KEY, "crmv3-check-polish");
  assert.equal(PRIORITY_KEY, "crmv3-case-priority-hide");
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

  const copy = Object.keys(HK_EN).sort();
  assert.deepEqual(Object.keys(HK_TR).sort(), copy);
  assert.deepEqual(Object.keys(HK_DE).sort(), copy);
  assert.deepEqual(Object.keys(HK_RU).sort(), copy);
  assert.deepEqual(Object.keys(HK_AR).sort(), copy);
  assert.notEqual(HK_TR.hkTitle, HK_EN.hkTitle);
  assert.notEqual(HK_DE.zqHint, HK_EN.zqHint);
  assert.notEqual(HK_RU.zqBlank, HK_EN.zqBlank);
  assert.notEqual(HK_AR.hkBlank, HK_EN.hkBlank);
  assert.equal(crmv3Text("en", "hkTitle"), "Checklist");
  assert.equal(crmv3Text("tr", "zqTitle"), HK_TR.zqTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-check-polish", "de"), "Checkliste");
  assert.equal(keyTitle("crmv3-case-priority-hide", "tr"), "Vaka önceliği");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "checkpolish"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "casepriority"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("checkpolish"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("casepriority"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("checkpolish")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("casepriority")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-check-polish/);
  assert.match(css, /\.c3-case-priority/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/checkpolish.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("row.kind"), false);
  assert.equal(view.includes("row.status"), false);
  assert.equal(view.includes('?? "normal"'), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-check-polish/);
  assert.match(view, /data-case-priority/);
  assert.match(view, /CHECK_KEY/);
  assert.match(view, /PRIORITY_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "checkpolish"/);
  assert.match(app, /view === "casepriority"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round105 tests passed");
}

main();
