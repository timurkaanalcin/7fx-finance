/**
 * Chrome edge and call outcome tags.
 * Run: npx tsx tests/crmv4-round77.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND77_COPY } from "../src/lib/crmv4/copy-round77";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  CALL_LIST,
  addTag,
  callPeople,
  readEdge,
  visibleTags,
} from "../src/lib/crmv4/round77";

function main() {
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

  const copy = Object.keys(ROUND77_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND77_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "egTitle"), "Chrome edge");
  assert.equal(crmv4Text("tr", "ocTitle"), ROUND77_COPY.tr.ocTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-edge-strip/);
  assert.match(css, /\.c4-outcome-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.match(css, /\.c4-logo \{\s*filter: none;/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round77.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /EDGE_KEY/);
  assert.match(view, /crmv4:accent/);
  assert.match(view, /data-edge-strip/);
  assert.match(view, /data-outcome-pad/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "edge"/);
  assert.match(app, /view === "outcomes"/);
  assert.match(app, /BrandLogo/);
  console.log("crmv4 round77 tests passed");
}

main();
