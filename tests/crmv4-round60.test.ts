/**
 * Customer health and the scratchboard.
 * Run: npx tsx tests/crmv4-round60.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND60_COPY } from "../src/lib/crmv4/copy-round60";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addNote,
  archiveNote,
  balanceTotals,
  filterHealth,
  healthMark,
  removeNote,
  togglePin,
  visibleHealth,
  visibleNotes,
} from "../src/lib/crmv4/round60";

function main() {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const recent = new Date(now - 2 * 86400000).toISOString();
  const old = new Date(now - 20 * 86400000).toISOString();
  const rows = [
    { id: "a", name: "Ada", documentsStatus: "APPROVED", ftd: true, lastSeenAt: recent, balance: 10, currency: "USD" },
    { id: "b", name: "Bea", documentsStatus: "PENDING", ftd: false, lastLoginAt: old, balance: 20, currency: "TRY" },
    { id: "c", name: "Cem", documentsStatus: "", ftd: false, balance: 4, currency: "USD" },
    { id: "d", name: "Den", documentsStatus: "REJECTED", ftd: false, balance: 7, currency: "" },
  ];
  assert.equal(healthMark(rows[0], now).score, 3);
  assert.equal(healthMark(rows[1], now).activity, "quiet");
  assert.equal(healthMark(rows[1], now).score, 0);
  assert.equal(healthMark(rows[2], now).activity, "none");
  assert.equal(healthMark({ id: "x", documentsStatus: "NONE" }, now).score, 0);
  assert.deepEqual(filterHealth(rows, "ada", "", now).map((row) => row.id), ["a"]);
  assert.deepEqual(filterHealth(rows, "", "3", now).map((row) => row.id), ["a"]);
  assert.equal(visibleHealth(rows, "", "", ["b"], now)[0].id, "b");
  const totals = balanceTotals(rows);
  assert.equal(totals.find((line) => line.currency === "USD")?.amount, 14);
  assert.equal(totals.find((line) => line.currency === "TRY")?.amount, 20);
  assert.equal(totals.some((line) => line.currency === ""), true);
  assert.notEqual(totals.find((line) => line.currency === "USD")?.amount, 41);

  assert.equal(addNote([], { id: "n1", body: "   ", at: "t" }).length, 0);
  const notes = addNote([], { id: "n1", body: " Call Mehmet ", at: "2026-11-05T10:00:00Z" });
  assert.equal(notes[0].body, "Call Mehmet");
  const pinned = togglePin(notes, "n1");
  assert.equal(pinned[0].pinned, true);
  const archived = archiveNote(pinned, "n1", true);
  assert.equal(visibleNotes(archived, "", false).length, 0);
  assert.equal(visibleNotes(archived, "mehmet", true)[0].id, "n1");
  assert.equal(removeNote(archived, "n1").length, 0);

  const copy = Object.keys(ROUND60_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND60_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hlTitle"), "Customer health");
  assert.equal(crmv4Text("tr", "sbTitle"), ROUND60_COPY.tr.sbTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-health-strip/);
  assert.match(css, /\.c4-scratch-board/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round60.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-health-strip/);
  assert.match(view, /data-scratch-board/);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-health-watch/);
  assert.match(view, /role=TRADER/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "health"/);
  assert.match(app, /view === "scratch"/);
  console.log("crmv4 round60 tests passed");
}

main();
