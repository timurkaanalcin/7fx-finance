/**
 * Lounge notes and lead statuses.
 * Run: npx tsx tests/crmv4-round127.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND127_COPY } from "../src/lib/crmv4/copy-round127";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeStatus,
  addNote,
  namedStatuses,
  noteText,
  readHiddenStatuses,
  readNotes,
  resetNotes,
  setNoteHidden,
  statusLines,
  statusText,
  toggleNotePin,
  toggleStatus,
  visibleLeads,
  visibleNotes,
  visibleStatuses,
  zoneLabel,
} from "../src/lib/crmv4/round127";

function main() {
  assert.equal(noteText("  Sofa\nA  "), "Sofa A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(zoneLabel("  Zone B  "), "Zone B");
  assert.equal(zoneLabel("   "), "");
  assert.equal(zoneLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Quiet", zone: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Quiet", zone: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Left sofa ", zone: " Zone B " });
  assert.deepEqual(saved, [{ id: "a", text: "Left sofa", zone: "Zone B", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Left sofa" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other zone" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "left").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "zone"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, zone: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(statusText(" NEW "), "NEW");
  assert.equal(statusText({ status: " CALL " }), "CALL");
  assert.equal(statusText(""), "");
  assert.equal(statusText(1 as never), "");
  assert.equal(statusText({ documentsStatus: "APPROVED" } as never), "");
  const rows = [
    { id: "u1", label: "Ada", status: "NEW" },
    { id: "u2", label: "Bea", status: { status: "CALL" } },
    { id: "u3", label: "Cid", status: "NEW" },
    { id: "u4", label: "Dot", status: "" },
    { id: "u5", label: "Eve", status: { retentionStatus: "ACTIVE" } as never },
  ];
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "CALL", count: 1 },
    { status: "NEW", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["CALL", "NEW"]);
  assert.deepEqual(visibleLeads(rows, "NEW", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleLeads(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleLeads(rows, "NEW", false, "100"), []);
  assert.deepEqual(readHiddenStatuses(["NEW", "OLD", ""], ["NEW", "CALL"]), ["NEW"]);
  assert.deepEqual(toggleStatus(["NEW"], "OLD", ["NEW"]), ["NEW"]);
  assert.deepEqual(visibleStatuses(["NEW", "CALL"], ["CALL"], false), ["NEW"]);
  assert.equal(activeStatus("CALL", ["NEW"]), "");
  assert.equal(statusLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND127_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND127_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "lngTitle"), "Language plates");
  assert.equal(crmv4Text("tr", "ldsTitle"), ROUND127_COPY.tr.ldsTitle);
  assert.equal(crmv4Text("de", "lngZone"), ROUND127_COPY.de.lngZone);
  assert.equal(crmv4Text("ru", "ldsBlank"), ROUND127_COPY.ru.ldsBlank);
  assert.equal(crmv4Text("ar", "ldsBoard"), ROUND127_COPY.ar.ldsBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lounge/);
  assert.match(css, /\.c4-lead-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round127.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.match(view, /saleStatus/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-lounge/);
  assert.match(view, /data-lead-stat/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /leads/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lounge"/);
  assert.match(app, /view === "leadstat"/);
  console.log("crmv4 round127 tests passed");
}

main();
