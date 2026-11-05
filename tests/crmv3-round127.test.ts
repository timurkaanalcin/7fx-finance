/**
 * Lounge notes and lead statuses.
 * Run: npx tsx tests/crmv3-round127.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LG_AR, LG_DE, LG_EN, LG_RU, LG_TR } from "../src/lib/crmv3/copy-lounge";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { LEAD_STATUS_KEY, LOUNGE_KEY } from "../src/lib/crmv3/lounge";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/lounge";

function main() {
  assert.equal(LOUNGE_KEY, "crmv3-lounge-notes");
  assert.equal(LEAD_STATUS_KEY, "crmv3-lead-stat-hide");
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

  const copy = Object.keys(LG_EN).sort();
  for (const table of [LG_TR, LG_DE, LG_RU, LG_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "lngTitle"), "Lounge notes");
  assert.equal(crmv3Text("tr", "ldsTitle"), LG_TR.ldsTitle);
  assert.equal(crmv3Text("de", "lngZone"), LG_DE.lngZone);
  assert.equal(crmv3Text("ru", "ldsBlank"), LG_RU.ldsBlank);
  assert.equal(crmv3Text("ar", "ldsBoard"), LG_AR.ldsBoard);
  assert.equal(keyTitle("crmv3-lounge-notes", "de"), "Loungebotizen");
  assert.equal(keyTitle("crmv3-lead-stat-hide", "ar"), "حالات العملاء المحتملين");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "lounge"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "leadstat"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("lounge"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("leadstat"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("lounge")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("leadstat")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-lounge/);
  assert.match(css, /\.c3-lead-stat/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/lounge.tsx"), "utf8");
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
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "lounge"/);
  assert.match(app, /view === "leadstat"/);
  console.log("crmv3 round127 tests passed");
}

main();
