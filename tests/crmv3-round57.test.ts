/**
 * CRM v3 support triage and the accent strip.
 * Run: npx tsx tests/crmv3-round57.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TRIAGE_AR, TRIAGE_DE, TRIAGE_EN, TRIAGE_RU, TRIAGE_TR } from "../src/lib/crmv3/copy-triage";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  CHROME_KEY,
  GOLD_KEY,
  PIN_KEY,
  SNOOZE_KEY,
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
} from "../src/lib/crmv3/triage";

const ROOT = path.resolve(__dirname, "..");

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
  assert.equal(PIN_KEY, "crmv3-triage-pins");
  assert.equal(SNOOZE_KEY, "crmv3-triage-snooze");
  assert.equal(GOLD_KEY, "crmv3-gold-intensity");
  assert.equal(CHROME_KEY, "crmv3-chrome-density");

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

  const copy = Object.keys(TRIAGE_EN).sort();
  assert.deepEqual(Object.keys(TRIAGE_TR).sort(), copy);
  assert.deepEqual(Object.keys(TRIAGE_DE).sort(), copy);
  assert.deepEqual(Object.keys(TRIAGE_RU).sort(), copy);
  assert.deepEqual(Object.keys(TRIAGE_AR).sort(), copy);
  assert.notEqual(TRIAGE_TR.trTitle, TRIAGE_EN.trTitle);
  assert.notEqual(TRIAGE_DE.acHint, TRIAGE_EN.acHint);
  assert.notEqual(TRIAGE_RU.trViewer, TRIAGE_EN.trViewer);
  assert.notEqual(TRIAGE_AR.acDense, TRIAGE_EN.acDense);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-gold-intensity", "tr"), "Altın yoğunluğu");
  assert.equal(keyTitle("crmv3-chrome-density", "de"), "Chromdichte");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "triage"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "accents"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("triage"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("accents"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("triage")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("accents")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-triage-desk/);
  assert.match(css, /\.c3-accent-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  assert.equal(css.includes("#8c6a2b"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/triage.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.match(view, /data-confirm/);
  assert.match(view, /data-triage/);
  assert.match(view, /data-accent-strip/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /deskRole/);
  assert.match(view, /assignBody/);
  assert.match(view, /closePlan/);
  const strip = view.slice(view.indexOf("export function AccentStrip"));
  assert.equal(strip.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "triage"/);
  assert.match(app, /view === "accents"/);
  assert.match(app, /data-gold=/);
  assert.match(app, /data-chrome=/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round57 tests passed");
}

main();
