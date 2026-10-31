/**
 * CRM v4 round 38 helpers.
 * Run: npx tsx tests/crmv4-round38.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND38_COPY } from "../src/lib/crmv4/copy-round38";
import { buildNotices, currencyCounts, readIds, segmentLines, segmentRows, unreadCount, withRead } from "../src/lib/crmv4/round38";

function main() {
  const notes = buildNotices({
    deposits: [{ id: "d1", amount: 10, currency: "USD", status: "PENDING", user: { name: "Ada" } }, { id: "d2", status: "APPROVED", currency: "TRY" }],
    withdrawals: [{ id: "w1", amount: 4, currency: "TRY", status: "PENDING", user: { name: "Bo" } }],
    people: [{ id: "p1", name: "Cy", documentsStatus: "NONE" }, { id: "p2", name: "Ok", documentsStatus: "APPROVED" }],
    threads: [{ traderId: "t1", trader: "Dee", messages: [{ workerId: null, automatic: false }], presence: { adminLastReadAt: "x" } }, { traderId: "t2", trader: "Staff", messages: [{ workerId: "s", automatic: false }], presence: { adminLastReadAt: "x" } }],
  });
  assert.deepEqual(notes.map((row) => row.id), ["dep:d1", "wd:w1", "kyc:p1", "chat:t1"]);
  assert.equal(notes[0].currency, "USD");
  assert.equal(notes[1].currency, "TRY");
  const read = withRead(readIds(null), "dep:d1");
  assert.equal(unreadCount(notes, read), 3);
  assert.deepEqual(readIds(JSON.stringify(read)), ["dep:d1"]);

  const people = [
    { id: "1", name: "Ada", country: "TR", saleStatus: "DEPOSITED", documentsStatus: "APPROVED", ftd: true, currency: "USD" },
    { id: "2", name: "Bo", country: "TR", saleStatus: "NEW", documentsStatus: "NONE", ftd: false, currency: "TRY" },
    { id: "3", name: "Cy", country: "DE", saleStatus: "DEPOSITED", documentsStatus: "APPROVED", ftd: true, currency: "USD" },
  ];
  const seg = segmentRows(people, { country: "TR", stage: "", kyc: "", deposit: "yes", currency: "" });
  assert.deepEqual(seg.map((row) => row.id), ["1"]);
  assert.deepEqual(currencyCounts(segmentRows(people, { country: "", stage: "DEPOSITED", kyc: "", deposit: "", currency: "" })), [{ currency: "USD", count: 2 }]);
  assert.equal(segmentLines(seg)[0][4], "yes");

  const copy = Object.keys(ROUND38_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND38_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-desk-bar/);
  assert.match(css, /\.c4-note-desk/);
  assert.match(css, /\.c4-seg-desk/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round38.tsx"), "utf8");
  const lib = fs.readFileSync(path.join(__dirname, "../src/lib/crmv4/round38.ts"), "utf8");
  assert.match(lib, /crmv4-notif-read/);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("PATCH"), false);
  console.log("crmv4 round38 tests passed");
}

main();
