/**
 * CRM v3 round 38: loaded notices and customer segments.
 * Run: npx tsx tests/crmv3-round38.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NOTICE_AR, NOTICE_DE, NOTICE_EN, NOTICE_RU, NOTICE_TR } from "../src/lib/crmv3/copy-notices";
import { buildNotices, currencyCounts, readIds, segmentLines, segmentRows, unreadCount, withRead } from "../src/lib/crmv3/notices";

const ROOT = path.resolve(__dirname, "..");

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

  const copy = Object.keys(NOTICE_EN).sort();
  assert.deepEqual(Object.keys(NOTICE_TR).sort(), copy);
  assert.deepEqual(Object.keys(NOTICE_DE).sort(), copy);
  assert.deepEqual(Object.keys(NOTICE_RU).sort(), copy);
  assert.deepEqual(Object.keys(NOTICE_AR).sort(), copy);

  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/notices.ts"), "utf8");
  assert.match(lib, /crmv3-notif-read/);
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/notices.tsx"), "utf8");
  assert.match(page, /READ_KEY/);
  assert.match(page, /data-notes-desk="1"/);
  assert.match(page, /data-seg="1"/);
  assert.equal(page.includes("sendJson"), false);
  assert.equal(page.includes("PATCH"), false);
  assert.equal(page.includes("crmv4"), false);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-desk-name/);
  assert.match(css, /\.c3-note-desk/);
  assert.match(css, /\.c3-seg-desk/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /data-bar="1"/);
  assert.match(app, /NoticeDesk/);
  assert.equal(app.includes("/api/notifications"), false);
  const market = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Marketing.tsx"), "utf8");
  assert.match(market, /SegmentDesk/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round38 tests passed");
}

main();
