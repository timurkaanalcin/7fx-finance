/**
 * Desk clocks and local snippets.
 * Run: npx tsx tests/crmv4-round71.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND71_COPY } from "../src/lib/crmv4/copy-round71";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addSnippet,
  deskClocks,
  readZones,
  setSnippetHidden,
  toggleZone,
  visibleSnippets,
  zoneParts,
} from "../src/lib/crmv4/round71";

const NOW = new Date("2026-11-05T12:00:00Z");

function main() {
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

  const copy = Object.keys(ROUND71_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND71_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "ckTitle"), "Desk clocks");
  assert.equal(crmv4Text("tr", "snTitle"), ROUND71_COPY.tr.snTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-clock-strip/);
  assert.match(css, /\.c4-snip-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round71.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("mailto:"), false);
  assert.match(view, /clipboard\.writeText/);
  assert.match(view, /data-clock-strip/);
  assert.match(view, /data-snip-pad/);
  assert.match(view, /data-quiet/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "clocks"/);
  assert.match(app, /view === "snippets"/);
  console.log("crmv4 round71 tests passed");
}

main();
