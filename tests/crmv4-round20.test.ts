/**
 * CRM v4 round 20 helpers.
 * Run: npx tsx tests/crmv4-round20.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { groupedNav, importableKeys, keyCount, packKeys } from "../src/lib/crmv4/round20";

function main() {
  const pack = packKeys([["crmv4-motion", "reduce"], ["theme", "dark"], ["crmv4-pins", "[\"a\"]"]], "2026-10-31T00:00:00Z");
  assert.equal(pack.kind, "crmv4-local");
  assert.equal(pack.keys["crmv4-motion"], "reduce");
  assert.equal("theme" in pack.keys, false);
  assert.equal(importableKeys(pack)?.["crmv4-pins"], "[\"a\"]");
  assert.equal(importableKeys({ kind: "other", keys: {} }), null);
  assert.equal(importableKeys({ kind: "crmv4-local", keys: { "crmv4-a": "1", token: "no", "crmv4-b": 2 } })?.["crmv4-a"], "1");
  assert.equal("token" in (importableKeys({ kind: "crmv4-local", keys: { token: "no" } }) || {}), false);
  assert.equal(keyCount(["crmv4-a", "theme", "crmv4-b"]), 2);
  const groups = groupedNav(["positions", "marketing", "settings", "logs", "control"]);
  assert.deepEqual(groups.work, ["positions", "marketing"]);
  assert.deepEqual(groups.records, ["logs", "control"]);
  assert.deepEqual(groups.desk, ["settings"]);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-more-luxe/);
  assert.match(css, /\.c4-local-luxe/);
  assert.match(css, /\.c4-state-error/);
  assert.match(css, /--c4-muted:\s*#5f564e/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const segments = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(segments, /crmv4-segment-rules/);
  assert.equal(segments.includes('const SEG_KEY = "crmv4-segments"'), false);
  console.log("crmv4 round20 tests passed");
}

main();
