/**
 * CRM v3 overnight digest and panel glass.
 * Run: npx tsx tests/crmv3-round65.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DIGEST_AR, DIGEST_DE, DIGEST_EN, DIGEST_RU, DIGEST_TR } from "../src/lib/crmv3/copy-digest";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { GLASS_KEY, HIDE_KEY, digestCsv, hideItems, readDigest, readGlass, visibleDigest } from "../src/lib/crmv3/digest";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const bag = {
    "crmv3-health-watch": ["ada"],
    "crmv3-doc-snooze": { passport: "2026-11-06T00:00:00Z" },
    "crmv3-ib-marks": [{ id: "d1", reason: "desk" }],
    "crmv3-scratchboard": [
      { id: "n1", body: "Shift handoff", pinned: true },
      { id: "n2", body: "Loose", pinned: false },
    ],
    "crmv3-vault-hints": [{ id: "h1", label: "CRM admin", pinned: true }],
    "crmv3-bookmark-folders": { folders: [{ id: "f1", name: "Morning", pinned: true }] },
    "crmv3-gold-intensity": "deep",
  };
  const items = readDigest(bag);
  assert.equal(items.some((item) => item.id === "health:pin:ada"), true);
  assert.equal(items.some((item) => item.kind === "snooze" && item.label === "passport"), true);
  assert.equal(items.some((item) => item.kind === "mark" && item.label === "desk"), true);
  assert.equal(items.some((item) => item.label === "Shift handoff"), true);
  assert.equal(items.some((item) => item.label === "Loose"), false);
  assert.equal(items.some((item) => item.label === "CRM admin"), true);
  assert.equal(items.some((item) => item.label === "Morning"), true);
  assert.equal(items.some((item) => item.label === "deep"), false);
  const hidden = hideItems([], ["health:pin:ada"]);
  assert.equal(visibleDigest(items, "ada", "", hidden).length, 0);
  assert.equal(visibleDigest(items, "", "mark", []).every((item) => item.kind === "mark"), true);
  const csv = digestCsv(visibleDigest(items, "", "pin", []));
  assert.match(csv, /^source,kind,label/);
  assert.equal(csv.includes("USD"), false);
  assert.equal(readGlass("solid"), "solid");
  assert.equal(readGlass("glass"), "soft");
  assert.equal(HIDE_KEY, "crmv3-digest-hide");
  assert.equal(GLASS_KEY, "crmv3-panel-glass");

  const copy = Object.keys(DIGEST_EN).sort();
  assert.deepEqual(Object.keys(DIGEST_TR).sort(), copy);
  assert.deepEqual(Object.keys(DIGEST_DE).sort(), copy);
  assert.deepEqual(Object.keys(DIGEST_RU).sort(), copy);
  assert.deepEqual(Object.keys(DIGEST_AR).sort(), copy);
  assert.notEqual(DIGEST_TR.odTitle, DIGEST_EN.odTitle);
  assert.notEqual(DIGEST_DE.gsHint, DIGEST_EN.gsHint);
  assert.notEqual(DIGEST_RU.odClearLead, DIGEST_EN.odClearLead);
  assert.notEqual(DIGEST_AR.gsSolid, DIGEST_EN.gsSolid);
  assert.equal(crmv3Text("en", "odTitle"), "Overnight digest");
  assert.equal(crmv3Text("ru", "gsTitle"), DIGEST_RU.gsTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-panel-glass", "tr"), "Pano camı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "digest"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "glass"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("digest"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("glass"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("digest")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("glass")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-digest-desk/);
  assert.match(css, /\.c3-glass-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/digest.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /data-digest-desk/);
  assert.match(view, /data-glass-strip/);
  assert.match(view, /data-confirm/);
  assert.match(view, /digestCsv/);
  assert.match(view, /crmv3-overnight\.csv/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "digest"/);
  assert.match(app, /view === "glass"/);
  assert.match(app, /data-glass=/);
  assert.match(app, /crmv3:glass/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round65 tests passed");
}

main();
