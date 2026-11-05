/**
 * Support triage and the accent strip.
 * Run: npx tsx tests/crmv4-round57.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND57_COPY } from "../src/lib/crmv4/copy-round57";
import {
  assignBody,
  clearSnooze,
  closePlan,
  filterThreads,
  isSnoozed,
  isUnread,
  readChrome,
  readGold,
  snoozeUntil,
  sortThreads,
  visibleThreads,
  withSnooze,
} from "../src/lib/crmv4/round57";

function main() {
  const threads = [
    { traderId: "a", trader: "Ada", desk: "Istanbul", lastAt: "2026-11-05T10:00:00Z", messages: [{ body: "Need a person", workerId: null, automatic: false }], presence: { adminLastReadAt: null } },
    { traderId: "b", trader: "Bea", desk: "EU", lastAt: "2026-11-05T11:00:00Z", messages: [{ body: "Thanks", workerId: "staff", automatic: false }], presence: { adminLastReadAt: "2026-11-05T11:05:00Z" } },
  ];
  assert.equal(isUnread(threads[0]), true);
  assert.equal(isUnread(threads[1]), false);
  assert.deepEqual(filterThreads(threads, "need", false).map((row) => row.traderId), ["a"]);
  assert.deepEqual(filterThreads(threads, "", true).map((row) => row.traderId), ["a"]);
  const until = snoozeUntil(Date.parse("2026-11-05T10:00:00Z"), 60);
  assert.equal(isSnoozed(until, Date.parse("2026-11-05T10:30:00Z")), true);
  assert.equal(isSnoozed(until, Date.parse("2026-11-05T12:00:00Z")), false);
  const snooze = withSnooze({}, "a", until);
  assert.deepEqual(visibleThreads(threads, "", false, snooze, false, Date.parse("2026-11-05T10:30:00Z")).map((row) => row.traderId), ["b"]);
  assert.equal(visibleThreads(threads, "", false, snooze, true, Date.parse("2026-11-05T10:30:00Z"))[0].traderId, "a");
  assert.equal(clearSnooze(snooze, "a").a, undefined);
  assert.equal(sortThreads(threads, ["b"])[0].traderId, "b");

  const blank = assignBody("staff-1", "   ");
  assert.deepEqual(blank, { assigneeId: "staff-1" });
  assert.equal(blank && "retentionNote" in blank, false);
  assert.equal(assignBody("  ", "hello"), null);
  assert.equal(assignBody("staff-1", " watch ")?.retentionNote, "watch");
  const close = closePlan("a", "  ");
  assert.deepEqual(close?.presence, { userId: "a", markRead: true });
  assert.equal(close?.note, null);
  assert.equal(closePlan("a", " done ")?.note?.retentionNote, "done");
  assert.equal(closePlan("", "x"), null);

  assert.equal(readGold("deep"), "deep");
  assert.equal(readGold("nope"), "desk");
  assert.equal(readChrome("dense"), "dense");
  assert.equal(readChrome("wide"), "roomy");

  const copy = Object.keys(ROUND57_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND57_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-triage-desk/);
  assert.match(css, /\.c4-accent-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round57.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /data-triage/);
  assert.match(view, /data-accent-strip/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /storedRole/);
  const strip = view.slice(view.indexOf("export function AccentStrip"));
  assert.equal(strip.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "triage"/);
  assert.match(app, /view === "accents"/);
  assert.match(app, /data-gold=/);
  assert.match(app, /data-chrome=/);
  console.log("crmv4 round57 tests passed");
}

main();
