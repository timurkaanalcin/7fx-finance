/**
 * CRM v3 stale accounts and call scripts.
 * Run: npx tsx tests/crmv3-round67.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { STALE_AR, STALE_DE, STALE_EN, STALE_RU, STALE_TR } from "../src/lib/crmv3/copy-stale";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  SCRIPT_KEY,
  WATCH_KEY,
  WINDOW_KEY,
  activityState,
  addScript,
  balanceTotals,
  hideScript,
  readWindow,
  removeScript,
  visiblePeople,
  visibleScripts,
} from "../src/lib/crmv3/stale";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const old = new Date(now - 40 * 86400000).toISOString();
  const fresh = new Date(now - 2 * 86400000).toISOString();
  const rows = [
    { id: "a", name: "Ada", desk: "EU", lastSeenAt: old, balance: 10, currency: "EUR" },
    { id: "b", name: "Bea", desk: "EU", lastLoginAt: fresh, balance: 5, currency: "EUR" },
    { id: "c", name: "Cem", desk: "Mena", balance: 20, currency: "TRY" },
    { id: "d", name: "Den", lastContactAt: old, balance: 4, currency: "" },
  ];
  assert.equal(activityState(rows[0], now, 30), "stale");
  assert.equal(activityState(rows[0], now, 90), "fresh");
  assert.equal(activityState(rows[1], now, 30), "fresh");
  assert.equal(activityState(rows[2], now, 30), "none");
  assert.deepEqual(visiblePeople(rows, "", "stale", ["d"], now, 30).map((row) => row.id), ["d", "a"]);
  assert.deepEqual(visiblePeople(rows, "ada", "stale", [], now, 30).map((row) => row.id), ["a"]);
  const totals = balanceTotals(visiblePeople(rows, "", "stale", [], now, 30));
  assert.equal(totals.find((line) => line.currency === "EUR")?.amount, 10);
  assert.equal(totals.find((line) => line.currency === "")?.amount, 4);
  assert.equal(totals.some((line) => line.currency === "TRY"), false);
  assert.equal(readWindow("90"), 90);
  assert.equal(readWindow(30), 30);
  assert.equal(WINDOW_KEY, "crmv3-stale-window");
  assert.equal(WATCH_KEY, "crmv3-stale-watch");
  assert.equal(SCRIPT_KEY, "crmv3-call-scripts");

  assert.equal(addScript([], { id: "s1", title: "Open", body: "   ", at: "t" }).length, 0);
  const scripts = addScript([], { id: "s1", title: " Morning ", body: " Good morning, this is the desk. ", at: "2026-11-05T10:00:00Z" });
  assert.equal(scripts[0].body, "Good morning, this is the desk.");
  const hidden = hideScript(scripts, "s1", true);
  assert.equal(visibleScripts(hidden, "", false).length, 0);
  assert.equal(visibleScripts(hidden, "morning", true)[0].id, "s1");
  assert.equal(removeScript(hidden, "s1").length, 0);

  const copy = Object.keys(STALE_EN).sort();
  assert.deepEqual(Object.keys(STALE_TR).sort(), copy);
  assert.deepEqual(Object.keys(STALE_DE).sort(), copy);
  assert.deepEqual(Object.keys(STALE_RU).sort(), copy);
  assert.deepEqual(Object.keys(STALE_AR).sort(), copy);
  assert.notEqual(STALE_TR.slTitle, STALE_EN.slTitle);
  assert.notEqual(STALE_DE.tkHint, STALE_EN.tkHint);
  assert.notEqual(STALE_RU.slStale, STALE_EN.slStale);
  assert.notEqual(STALE_AR.tkBlank, STALE_EN.tkBlank);
  assert.equal(crmv3Text("en", "slTitle"), "Stale accounts");
  assert.equal(crmv3Text("ar", "tkTitle"), STALE_AR.tkTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-call-scripts", "tr"), "Arama metinleri");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "stale"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "scripts"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("stale"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("scripts"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("stale")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("scripts")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-stale-desk/);
  assert.match(css, /\.c3-script-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/stale.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-stale-desk/);
  assert.match(view, /data-script-pad/);
  assert.match(view, /data-confirm/);
  const scriptsView = view.slice(view.indexOf("export function CallScripts"));
  assert.equal(scriptsView.includes("fetch("), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "stale"/);
  assert.match(app, /view === "scripts"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round67 tests passed");
}

main();
