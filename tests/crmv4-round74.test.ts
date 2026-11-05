/**
 * Quiet shield and customer stickies.
 * Run: npx tsx tests/crmv4-round74.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND74_COPY } from "../src/lib/crmv4/copy-round74";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addSticky,
  pauseOn,
  readPause,
  shieldOn,
  tomorrowUtc,
  visibleStickies,
} from "../src/lib/crmv4/round74";

const NOON = new Date("2026-11-05T12:00:00Z");

function main() {
  assert.equal(tomorrowUtc(NOON), "2026-11-06");
  assert.equal(readPause("2026-11-06"), "2026-11-06");
  assert.equal(readPause({ until: "2026-11-06" }), "2026-11-06");
  assert.equal(readPause("soon"), "");
  assert.equal(pauseOn("2026-11-06", NOON), true);
  assert.equal(pauseOn("2026-11-06", new Date("2026-11-06T00:00:00Z")), false);
  const noonLocal = new Date(2026, 10, 5, 12, 0, 0);
  const eveningLocal = new Date(2026, 10, 5, 23, 0, 0);
  assert.equal(shieldOn({ start: "", end: "" }, "", noonLocal), false);
  assert.equal(shieldOn({ start: "09:00", end: "09:00" }, "", noonLocal), false);
  assert.equal(shieldOn({ start: "09:00", end: "17:00" }, "", noonLocal), true);
  assert.equal(shieldOn({ start: "22:00", end: "06:00" }, "", eveningLocal), true);
  assert.equal(shieldOn({ start: "", end: "" }, "2026-11-06", NOON), true);

  assert.equal(addSticky([], { id: "n1", customerId: "a", body: "   ", at: "t" }).length, 0);
  assert.equal(addSticky([], { id: "n1", customerId: "", body: "Call", at: "t" }).length, 0);
  const notes = addSticky([], { id: "n1", customerId: "ada", body: " Call after lunch ", at: "2026-11-05T10:00:00Z" });
  assert.equal(visibleStickies(notes, "ada", false).length, 0);
  assert.equal(visibleStickies(notes, "lunch", false)[0].customerId, "ada");
  assert.equal(JSON.stringify(notes).includes("EUR"), false);

  const copy = Object.keys(ROUND74_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND74_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "qhTitle"), "Quiet shield");
  assert.equal(crmv4Text("tr", "cnTitle"), ROUND74_COPY.tr.cnTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-shield-pad/);
  assert.match(css, /\.c4-sticky-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round74.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /QUIET_KEY/);
  assert.match(view, /data-shield-pad/);
  assert.match(view, /data-sticky-pad/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "shield"/);
  assert.match(app, /view === "stickies"/);
  assert.match(app, /view === "alerts"/);
  assert.match(app, /shieldOn\(/);
  assert.match(app, /quiet=\{shield\}/);
  assert.match(app, /resume && !shield/);
  const alerts = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round59.tsx"), "utf8");
  assert.equal(alerts.includes("shieldOn"), false);
  console.log("crmv4 round74 tests passed");
}

main();
