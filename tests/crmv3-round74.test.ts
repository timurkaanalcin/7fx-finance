/**
 * CRM v3 quiet shield and customer stickies.
 * Run: npx tsx tests/crmv3-round74.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SHIELD_AR, SHIELD_DE, SHIELD_EN, SHIELD_RU, SHIELD_TR } from "../src/lib/crmv3/copy-shield";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NOTE_KEY, PAUSE_KEY, addSticky, pauseOn, readPause, shieldOn, tomorrowUtc, visibleStickies } from "../src/lib/crmv3/shield";

const ROOT = path.resolve(__dirname, "..");
const NOON = new Date("2026-11-05T12:00:00Z");

function main() {
  assert.equal(PAUSE_KEY, "crmv3-quiet-pause");
  assert.equal(NOTE_KEY, "crmv3-sticky-notes");
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

  const copy = Object.keys(SHIELD_EN).sort();
  assert.deepEqual(Object.keys(SHIELD_TR).sort(), copy);
  assert.deepEqual(Object.keys(SHIELD_DE).sort(), copy);
  assert.deepEqual(Object.keys(SHIELD_RU).sort(), copy);
  assert.deepEqual(Object.keys(SHIELD_AR).sort(), copy);
  assert.notEqual(SHIELD_TR.qhTitle, SHIELD_EN.qhTitle);
  assert.notEqual(SHIELD_DE.cnHint, SHIELD_EN.cnHint);
  assert.notEqual(SHIELD_RU.qhPause, SHIELD_EN.qhPause);
  assert.notEqual(SHIELD_AR.cnBlank, SHIELD_EN.cnBlank);
  assert.equal(crmv3Text("en", "qhTitle"), "Quiet shield");
  assert.equal(crmv3Text("tr", "cnTitle"), SHIELD_TR.cnTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-sticky-notes", "de"), "Kundennotizen");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "shield"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "stickies"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("shield"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("stickies"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("shield")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("stickies")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-shield-pad/);
  assert.match(css, /\.c3-sticky-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/shield.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /QUIET_KEY/);
  assert.match(view, /data-shield-pad/);
  assert.match(view, /data-sticky-pad/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "shield"/);
  assert.match(app, /view === "stickies"/);
  assert.match(app, /view === "alerts"/);
  assert.match(app, /shieldOn\(/);
  assert.match(app, /offline && !shield/);
  assert.match(app, /idle && !shield/);
  const alerts = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/alerts.tsx"), "utf8");
  assert.equal(alerts.includes("shieldOn"), false);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round74 tests passed");
}

main();
