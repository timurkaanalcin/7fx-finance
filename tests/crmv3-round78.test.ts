/**
 * CRM v3 risk watch and inbox density.
 * Run: npx tsx tests/crmv3-round78.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RW_AR, RW_DE, RW_EN, RW_RU, RW_TR } from "../src/lib/crmv3/copy-riskwatch";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { MAIL_KEY, RISK_KEY, addWatch, readDensity, readWatch, visibleWatch } from "../src/lib/crmv3/risklist";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(RISK_KEY, "crmv3-risk-watch");
  assert.equal(MAIL_KEY, "crmv3-mail-density");
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

  const copy = Object.keys(RW_EN).sort();
  assert.deepEqual(Object.keys(RW_TR).sort(), copy);
  assert.deepEqual(Object.keys(RW_DE).sort(), copy);
  assert.deepEqual(Object.keys(RW_RU).sort(), copy);
  assert.deepEqual(Object.keys(RW_AR).sort(), copy);
  assert.notEqual(RW_TR.rwTitle, RW_EN.rwTitle);
  assert.notEqual(RW_DE.mdHint, RW_EN.mdHint);
  assert.notEqual(RW_RU.mdRoomy, RW_EN.mdRoomy);
  assert.notEqual(RW_AR.rwBlank, RW_EN.rwBlank);
  assert.equal(crmv3Text("en", "rwTitle"), "Risk watch");
  assert.equal(crmv3Text("tr", "mdTitle"), RW_TR.mdTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-risk-watch", "de"), "Risikobeobachtung");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "riskwatch"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "maildense"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("riskwatch"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("maildense"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("riskwatch")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("maildense")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-risk-watch/);
  assert.match(css, /\.c3-mail-density/);
  assert.match(css, /data-mail="compact"/);
  assert.match(css, /data-mail="roomy"/);
  assert.match(css, /\.c3-notice-card/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/watch.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("setInterval"), false);
  assert.match(view, /RISK_KEY/);
  assert.match(view, /crmv3:mail/);
  assert.match(view, /data-risk-watch/);
  assert.match(view, /data-mail-density/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "riskwatch"/);
  assert.match(app, /view === "maildense"/);
  assert.match(app, /data-mail=\{mail\}/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round78 tests passed");
}

main();
