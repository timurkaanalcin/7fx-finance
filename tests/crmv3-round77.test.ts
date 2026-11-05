/**
 * CRM v3 chrome edge and call outcome tags.
 * Run: npx tsx tests/crmv3-round77.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EDGE_AR, EDGE_DE, EDGE_EN, EDGE_RU, EDGE_TR } from "../src/lib/crmv3/copy-edge";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { CALL_LIST, EDGE_KEY, TAG_KEY, addTag, callPeople, readEdge, visibleTags } from "../src/lib/crmv3/edge";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(EDGE_KEY, "crmv3-accent");
  assert.equal(TAG_KEY, "crmv3-call-tags");
  assert.equal(readEdge("ivory"), "ivory");
  assert.equal(readEdge("graphite"), "graphite");
  assert.equal(readEdge("nope"), "champagne");
  const calls = [
    { id: "c1", traderId: "a", trader: "Ada" },
    { id: "c2", traderId: "a", trader: "Ada" },
    { id: "", traderId: "b", trader: "Bea" },
  ];
  const people = callPeople(calls);
  assert.deepEqual(people.map((person) => person.id), ["a"]);
  assert.equal(addTag([], { id: "t1", customerId: "a", callId: "c1", kind: "missed", body: "   ", at: "t" }, people).length, 0);
  assert.equal(addTag([], { id: "t1", customerId: "z", callId: "c1", kind: "missed", body: "No reply", at: "t" }, people).length, 0);
  assert.equal(addTag([], { id: "t1", customerId: "a", callId: "c1", kind: "other", body: "No reply", at: "t" }, people).length, 0);
  const tags = addTag([], { id: "t1", customerId: "a", callId: "c1", kind: "missed", body: " No reply ", at: "2026-11-05T10:00:00Z" }, people);
  assert.equal(tags[0].body, "No reply");
  assert.equal(visibleTags(tags, "Ada", false).length, 0);
  assert.equal(visibleTags(tags, "missed", false)[0].customerId, "a");
  assert.equal(CALL_LIST, "/api/admin/communications?type=CALL&take=40");

  const copy = Object.keys(EDGE_EN).sort();
  assert.deepEqual(Object.keys(EDGE_TR).sort(), copy);
  assert.deepEqual(Object.keys(EDGE_DE).sort(), copy);
  assert.deepEqual(Object.keys(EDGE_RU).sort(), copy);
  assert.deepEqual(Object.keys(EDGE_AR).sort(), copy);
  assert.notEqual(EDGE_TR.egTitle, EDGE_EN.egTitle);
  assert.notEqual(EDGE_DE.ocHint, EDGE_EN.ocHint);
  assert.notEqual(EDGE_RU.ocMissed, EDGE_EN.ocMissed);
  assert.notEqual(EDGE_AR.ocBlank, EDGE_EN.ocBlank);
  assert.equal(crmv3Text("en", "egTitle"), "Chrome edge");
  assert.equal(crmv3Text("tr", "ocTitle"), EDGE_TR.ocTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-accent", "de"), "Chromkante");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "edge"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "outcomes"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("edge"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("outcomes"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("edge")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("outcomes")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-edge-strip/);
  assert.match(css, /\.c3-outcome-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.match(css, /\.c3-logo \{\s*filter: none;/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/edge.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /EDGE_KEY/);
  assert.match(view, /crmv3:accent/);
  assert.match(view, /data-edge-strip/);
  assert.match(view, /data-outcome-pad/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "edge"/);
  assert.match(app, /view === "outcomes"/);
  assert.match(app, /data-edge=\{edge\}/);
  assert.match(app, /BrandLogo/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round77 tests passed");
}

main();
