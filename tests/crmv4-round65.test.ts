/**
 * Overnight digest and panel glass.
 * Run: npx tsx tests/crmv4-round65.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND65_COPY } from "../src/lib/crmv4/copy-round65";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { digestCsv, hideItems, readDigest, readGlass, visibleDigest } from "../src/lib/crmv4/round65";

function main() {
  const bag = {
    "crmv4-health-watch": ["ada"],
    "crmv4-doc-snooze": { passport: "2026-11-06T00:00:00Z" },
    "crmv4-ib-marks": [{ id: "d1", reason: "desk" }],
    "crmv4-scratchboard": [
      { id: "n1", body: "Shift handoff", pinned: true },
      { id: "n2", body: "Loose", pinned: false },
    ],
    "crmv4-vault-hints": [{ id: "h1", label: "CRM admin", pinned: true }],
    "crmv4-bookmark-folders": { folders: [{ id: "f1", name: "Morning", pinned: true }] },
    "crmv4-gold-intensity": "deep",
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

  const copy = Object.keys(ROUND65_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND65_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "odTitle"), "Overnight digest");
  assert.equal(crmv4Text("ru", "gsTitle"), ROUND65_COPY.ru.gsTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-digest-desk/);
  assert.match(css, /\.c4-glass-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round65.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.match(view, /data-digest-desk/);
  assert.match(view, /data-glass-strip/);
  assert.match(view, /data-confirm/);
  assert.match(view, /digestCsv/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "digest"/);
  assert.match(app, /view === "glass"/);
  assert.match(app, /data-glass=/);
  console.log("crmv4 round65 tests passed");
}

main();
