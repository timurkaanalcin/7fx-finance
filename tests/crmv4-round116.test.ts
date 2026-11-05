/**
 * Callback notes and case priorities.
 * Run: npx tsx tests/crmv4-round116.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND116_COPY } from "../src/lib/crmv4/copy-round116";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activePriority,
  addNote,
  namedPriorities,
  noteText,
  priorityLines,
  priorityText,
  readHiddenPriorities,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleNotePin,
  togglePriority,
  visibleCases,
  visibleNotes,
  visiblePriorities,
  whenLabel,
} from "../src/lib/crmv4/round116";

function main() {
  assert.equal(noteText("  Call\nAda  "), "Call Ada");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(whenLabel("  214  "), "214");
  assert.equal(whenLabel("   "), "");
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call", when: "  ", pinned: 1 }]), [
    { id: "2", text: "Call", when: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Call back ", when: " 14:30 " });
  assert.deepEqual(saved, [{ id: "a", text: "Call back", when: "14:30", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Call back" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "call").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "14:30"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(resetNotes(), []);

  assert.equal(priorityText(" HIGH "), "HIGH");
  assert.equal(priorityText({ priority: " LOW " }), "LOW");
  assert.equal(priorityText(2), "2");
  assert.equal(priorityText(""), "");
  assert.equal(priorityText(Number.NaN), "");
  assert.equal(priorityText({ status: "OPEN", kind: "ticket" } as never), "");
  const rows = [
    { id: "c1", label: "Ada", priority: "HIGH" },
    { id: "c2", label: "Bea", priority: { priority: "LOW" } },
    { id: "c3", label: "Cid", priority: "HIGH" },
    { id: "c4", label: "Dot", priority: "" },
    { id: "c5", label: "Eve", priority: { status: "OPEN" } as never },
  ];
  assert.deepEqual(priorityLines(rows), [
    { priority: "", count: 2 },
    { priority: "HIGH", count: 2 },
    { priority: "LOW", count: 1 },
  ]);
  assert.deepEqual(namedPriorities(rows), ["HIGH", "LOW"]);
  assert.deepEqual(visibleCases(rows, "HIGH", false, "ada").map((row) => row.id), ["c1"]);
  assert.deepEqual(visibleCases(rows, "", true, "").map((row) => row.id), ["c4", "c5"]);
  assert.deepEqual(readHiddenPriorities(["HIGH", "NEW", ""], ["HIGH", "LOW"]), ["HIGH"]);
  assert.deepEqual(togglePriority(["HIGH"], "NEW", ["HIGH"]), ["HIGH"]);
  assert.deepEqual(visiblePriorities(["HIGH", "LOW"], ["LOW"], false), ["HIGH"]);
  assert.equal(activePriority("LOW", ["HIGH"]), "");
  assert.equal(priorityLines(rows).every((line) => !("amount" in line)), true);

  const copy = Object.keys(ROUND116_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND116_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cbTitle"), "Callback queue");
  assert.equal(crmv4Text("tr", "zpTitle"), ROUND116_COPY.tr.zpTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-callback-queue/);
  assert.match(css, /\.c4-case-prio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round116.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("tel:"), false);
  assert.match(view, /\/api\/admin\/tickets\?take=40/);
  assert.match(view, /data-callback-queue/);
  assert.match(view, /data-case-prio/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /support/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "callbackqueue"/);
  assert.match(app, /view === "casepriopolish"/);
  console.log("crmv4 round116 tests passed");
}

main();
