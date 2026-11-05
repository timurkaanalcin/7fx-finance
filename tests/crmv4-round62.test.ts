/**
 * Document watch and panel density.
 * Run: npx tsx tests/crmv4-round62.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND62_COPY } from "../src/lib/crmv4/copy-round62";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  clearSnooze,
  dateSource,
  dueState,
  isSnoozed,
  loadedDate,
  readPanel,
  readWindow,
  reviewPlan,
  snoozeUntil,
  visibleDocs,
  withSnooze,
} from "../src/lib/crmv4/round62";

function main() {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const old = new Date(now - 40 * 86400000).toISOString();
  const fresh = new Date(now - 2 * 86400000).toISOString();
  const rows = [
    { id: "a", name: "Passport", docType: "ID", status: "PENDING", trader: "Ada", createdAt: old, reviewedAt: null },
    { id: "b", name: "Bill", docType: "ADDRESS", status: "APPROVED", trader: "Bea", createdAt: old, reviewedAt: fresh },
    { id: "c", name: "Blank", status: "PENDING", trader: "Cem" },
  ];
  assert.equal(dateSource(rows[0]), "created");
  assert.equal(dateSource(rows[1]), "reviewed");
  assert.equal(loadedDate(rows[1]), new Date(fresh).toISOString());
  assert.equal(dueState(rows[0], now, 30), "due");
  assert.equal(dueState(rows[0], now, 90), "fresh");
  assert.equal(dueState(rows[1], now, 30), "fresh");
  assert.equal(dueState(rows[2], now, 30), "none");
  assert.equal(loadedDate(rows[2]), null);
  assert.deepEqual(visibleDocs(rows, "ada", false, {}, false, now, 30).map((row) => row.id), ["a"]);
  assert.deepEqual(visibleDocs(rows, "", true, {}, false, now, 30).map((row) => row.id), ["a"]);
  const until = snoozeUntil(now, 60);
  assert.equal(isSnoozed(until, now + 1000), true);
  const snooze = withSnooze({}, "a", until);
  assert.deepEqual(visibleDocs(rows, "", false, snooze, false, now + 1000, 30).map((row) => row.id), ["b", "c"]);
  assert.equal(visibleDocs(rows, "", false, snooze, true, now + 1000, 30)[0].id, "a");
  assert.equal(clearSnooze(snooze, "a").a, undefined);

  const blank = reviewPlan("doc-1", "APPROVED", "   ");
  assert.deepEqual(blank, { action: "review", id: "doc-1", status: "APPROVED" });
  assert.equal(blank && "note" in blank, false);
  assert.equal(reviewPlan("doc-1", "REJECTED", " watch ")?.note, "watch");
  assert.equal(reviewPlan("doc-1", "PENDING", "x"), null);
  assert.equal(readWindow("90"), 90);
  assert.equal(readWindow("nope"), 30);
  assert.equal(readPanel("compact"), "compact");
  assert.equal(readPanel("wide"), "desk");

  const copy = Object.keys(ROUND62_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND62_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "exTitle"), "Document watch");
  assert.equal(crmv4Text("ar", "lyTitle"), ROUND62_COPY.ar.lyTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-expiry-desk/);
  assert.match(css, /\.c4-panel-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round62.tsx"), "utf8");
  assert.match(view, /data-expiry-desk/);
  assert.match(view, /data-panel-strip/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /reviewPlan/);
  assert.match(view, /storedRole/);
  const strip = view.slice(view.indexOf("export function PanelDensityStrip"));
  assert.equal(strip.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "expiry"/);
  assert.match(app, /view === "density"/);
  assert.match(app, /data-panel=/);
  console.log("crmv4 round62 tests passed");
}

main();
