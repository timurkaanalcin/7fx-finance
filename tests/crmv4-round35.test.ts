/**
 * CRM v4 round 35 helpers.
 * Run: npx tsx tests/crmv4-round35.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND35_COPY } from "../src/lib/crmv4/copy-round35";
import { filterLoad, groupByDesk, kycOpen, overdueFollows, pendingCount, readLoad, staffCards, unassignedCount, unreadThreads } from "../src/lib/crmv4/round35";

function main() {
  assert.equal(pendingCount([{ status: "PENDING" }, { status: "APPROVED" }, {}]), 2);
  assert.equal(kycOpen([{ documentsStatus: "APPROVED" }, { documentsStatus: "NONE" }, {}]), 2);
  assert.equal(overdueFollows([{ retentionFollowUpAt: "2026-10-27T10:00:00Z" }, { retentionFollowUpAt: "2026-11-02T10:00:00Z" }], "2026-10-31"), 1);
  assert.equal(unreadThreads([{ messages: [{ workerId: null, automatic: false }], presence: { adminLastReadAt: "x" } }, { messages: [{ workerId: "s" }], presence: { adminLastReadAt: "x" } }]), 1);
  const cards = staffCards(
    [{ id: "a", name: "Ada", desk: "Istanbul" }, { id: "b", name: "Bo", desk: "" }],
    [{ assigneeName: "Ada" }, { assigneeName: "ada" }, { assigneeName: "Nobody" }],
  );
  assert.equal(cards[0].assigned, 2);
  assert.equal(cards[1].assigned, 0);
  assert.equal(unassignedCount([{ assigneeName: "Nobody" }, { assigneeName: "Ada" }], [{ name: "Ada" }]), 1);
  assert.equal(filterLoad(cards, "busy").length, 1);
  assert.equal(filterLoad(cards, "clear")[0].name, "Bo");
  assert.equal(groupByDesk(cards)[0].desk, "");
  assert.equal(readLoad("busy"), "busy");
  assert.equal(readLoad("nope"), "all");
  const copy = Object.keys(ROUND35_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND35_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-today-hero/);
  assert.match(css, /\.c4-staff-luxe/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round35.ts"), "utf8");
  assert.match(page, /crmv4-staff-load/);
  console.log("crmv4 round35 tests passed");
}

main();
