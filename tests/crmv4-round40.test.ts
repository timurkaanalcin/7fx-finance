/**
 * CRM v4 round 40 helpers.
 * Run: npx tsx tests/crmv4-round40.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND40_COPY } from "../src/lib/crmv4/copy-round40";
import { clipText, followMark, latestActivity } from "../src/lib/crmv4/round40";

function main() {
  const latest = latestActivity(
    [{ createdAt: "2026-10-27T10:00:00Z", body: "Call about the file" }],
    [{ createdAt: "2026-10-30T10:00:00Z", kind: "PAGE", path: "/trade" }],
  );
  assert.equal(latest?.kind, "event");
  assert.equal(latest?.text, "PAGE · /trade");
  assert.equal(followMark("2026-10-27T10:00:00Z", "2026-10-31"), "overdue");
  assert.equal(followMark("2026-10-31T10:00:00Z", "2026-10-31"), "today");
  assert.equal(followMark("2026-11-02T10:00:00Z", "2026-10-31"), "later");
  assert.equal(followMark("", "2026-10-31"), "none");
  assert.equal(clipText("a".repeat(90)).endsWith("…"), true);
  const copy = Object.keys(ROUND40_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND40_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dossier/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("color: #7d7368"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round40.tsx"), "utf8");
  assert.match(view, /Escape/);
  assert.equal(view.includes("sendJson"), false);
  const dialog = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round1.tsx"), "utf8");
  assert.match(dialog, /useEscape\(true, onClose\)/);
  console.log("crmv4 round40 tests passed");
}

main();
