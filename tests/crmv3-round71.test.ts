/**
 * CRM v3 desk clocks and local snippets.
 * Run: npx tsx tests/crmv3-round71.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CLOCK_AR, CLOCK_DE, CLOCK_EN, CLOCK_RU, CLOCK_TR } from "../src/lib/crmv3/copy-clocks";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  CLOCK_KEY,
  SNIP_KEY,
  addSnippet,
  deskClocks,
  readZones,
  setSnippetHidden,
  toggleZone,
  visibleSnippets,
  zoneParts,
} from "../src/lib/crmv3/clocks";

const ROOT = path.resolve(__dirname, "..");
const NOW = new Date("2026-11-05T12:00:00Z");

function main() {
  assert.equal(CLOCK_KEY, "crmv3-desk-clocks");
  assert.equal(SNIP_KEY, "crmv3-snippets");
  assert.equal(readZones(["istanbul", "nope", "istanbul"]).join(","), "istanbul");
  assert.deepEqual(toggleZone(["istanbul"], "mars"), ["istanbul"]);
  const utc = zoneParts("UTC", NOW);
  assert.equal(utc?.time, "12:00");
  assert.equal(utc?.minutes, 12 * 60);
  assert.equal(zoneParts("Not/AZone", NOW), null);
  const open = deskClocks(["london", "utc"], { start: "", end: "" }, NOW);
  assert.equal(open.length, 2);
  assert.equal(open.every((clock) => clock.quiet), false);
  assert.match(open[0].time, /^\d{2}:\d{2}$/);
  assert.equal(JSON.stringify(open).includes("price"), false);
  const quiet = deskClocks(["utc"], { start: "11:00", end: "13:00" }, NOW);
  assert.equal(quiet[0].quiet, true);
  assert.equal(deskClocks(["utc"], { start: "13:00", end: "14:00" }, NOW)[0].quiet, false);
  assert.equal(deskClocks(["utc"], { start: "09:00", end: "09:00" }, NOW)[0].quiet, false);

  assert.equal(addSnippet([], { id: "s1", kind: "thanks", body: "   ", at: "t" }).length, 0);
  assert.equal(addSnippet([], { id: "s1", kind: "mail", body: "Hello", at: "t" }).length, 0);
  const snippets = addSnippet([], { id: "s1", kind: "thanks", body: " Thank you for the call ", at: "2026-11-05T10:00:00Z" });
  const follow = addSnippet(snippets, { id: "s2", kind: "follow", body: "I will call tomorrow", at: "2026-11-05T11:00:00Z" });
  assert.equal(visibleSnippets(follow, "thanks", "call", false).length, 1);
  const hidden = setSnippetHidden(follow, "s1", true);
  assert.equal(visibleSnippets(hidden, "", "", false).some((snippet) => snippet.id === "s1"), false);
  assert.equal(visibleSnippets(hidden, "", "", true)[0].id, "s1");

  const copy = Object.keys(CLOCK_EN).sort();
  assert.deepEqual(Object.keys(CLOCK_TR).sort(), copy);
  assert.deepEqual(Object.keys(CLOCK_DE).sort(), copy);
  assert.deepEqual(Object.keys(CLOCK_RU).sort(), copy);
  assert.deepEqual(Object.keys(CLOCK_AR).sort(), copy);
  assert.notEqual(CLOCK_TR.ckTitle, CLOCK_EN.ckTitle);
  assert.notEqual(CLOCK_DE.snHint, CLOCK_EN.snHint);
  assert.notEqual(CLOCK_RU.ckMoscow, CLOCK_EN.ckMoscow);
  assert.notEqual(CLOCK_AR.snBlank, CLOCK_EN.snBlank);
  assert.equal(crmv3Text("en", "ckTitle"), "Desk clocks");
  assert.equal(crmv3Text("tr", "snTitle"), CLOCK_TR.snTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-desk-clocks", "de"), "Tischuhren");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "clocks"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "snippets"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("clocks"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("snippets"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("clocks")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("snippets")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-clock-strip/);
  assert.match(css, /\.c3-snip-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/clocks.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("mailto:"), false);
  assert.match(view, /clipboard\.writeText/);
  assert.match(view, /data-clock-strip/);
  assert.match(view, /data-snip-pad/);
  assert.match(view, /data-quiet/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "clocks"/);
  assert.match(app, /view === "snippets"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round71 tests passed");
}

main();
