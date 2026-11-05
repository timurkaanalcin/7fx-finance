/**
 * Risk watch and mail density.
 * Run: npx tsx tests/crmv4-round78.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND78_COPY } from "../src/lib/crmv4/copy-round78";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { addWatch, readDensity, readWatch, visibleWatch } from "../src/lib/crmv4/round78";

function main() {
  const known = ["a", "b"];
  assert.equal(addWatch([], { id: "", reason: "File", at: "t" }, known).length, 0);
  assert.equal(addWatch([], { id: "z", reason: "File", at: "t" }, known).length, 0);
  const blank = addWatch([], { id: "a", reason: "   ", at: "2026-11-05T10:00:00Z" }, known);
  assert.equal(blank[0].reason, "");
  const watch = addWatch(blank, { id: "a", reason: "Again", at: "t" }, known);
  assert.equal(watch.length, 1);
  const withReason = addWatch([], { id: "b", reason: " Open file ", at: "2026-11-05T11:00:00Z" }, known);
  assert.equal(withReason[0].reason, "Open file");
  assert.equal(visibleWatch(withReason, "Ada", false).length, 0);
  assert.equal(visibleWatch(withReason, "file", false)[0].id, "b");
  assert.deepEqual(readWatch([{ id: "z", reason: "Gone" }, { id: "b", reason: "Open file" }], known).map((item) => item.id), ["b"]);
  assert.equal(readDensity("compact"), "compact");
  assert.equal(readDensity("roomy"), "roomy");
  assert.equal(readDensity("giant"), "desk");

  const copy = Object.keys(ROUND78_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND78_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "rwTitle"), "Risk watch");
  assert.equal(crmv4Text("tr", "mdTitle"), ROUND78_COPY.tr.mdTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-risk-watch/);
  assert.match(css, /\.c4-mail-density/);
  assert.match(css, /data-mail="compact"/);
  assert.match(css, /data-mail="roomy"/);
  assert.match(css, /\.c4-notice-card/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round78.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.match(view, /data-risk-watch/);
  assert.match(view, /data-mail-density/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "riskwatch"/);
  assert.match(app, /view === "maildense"/);
  assert.match(app, /data-mail=\{mail\}/);
  console.log("crmv4 round78 tests passed");
}

main();
