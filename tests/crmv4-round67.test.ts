/**
 * Stale accounts and call scripts.
 * Run: npx tsx tests/crmv4-round67.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND67_COPY } from "../src/lib/crmv4/copy-round67";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activityState,
  addScript,
  balanceTotals,
  hideScript,
  readWindow,
  removeScript,
  visiblePeople,
  visibleScripts,
} from "../src/lib/crmv4/round67";

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

  assert.equal(addScript([], { id: "s1", title: "Open", body: "   ", at: "t" }).length, 0);
  const scripts = addScript([], { id: "s1", title: " Morning ", body: " Good morning, this is the desk. ", at: "2026-11-05T10:00:00Z" });
  assert.equal(scripts[0].body, "Good morning, this is the desk.");
  const hidden = hideScript(scripts, "s1", true);
  assert.equal(visibleScripts(hidden, "", false).length, 0);
  assert.equal(visibleScripts(hidden, "morning", true)[0].id, "s1");
  assert.equal(removeScript(hidden, "s1").length, 0);

  const copy = Object.keys(ROUND67_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND67_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "slTitle"), "Stale accounts");
  assert.equal(crmv4Text("ar", "tkTitle"), ROUND67_COPY.ar.tkTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-stale-desk/);
  assert.match(css, /\.c4-script-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round67.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-stale-desk/);
  assert.match(view, /data-script-pad/);
  assert.match(view, /data-confirm/);
  const scriptsView = view.slice(view.indexOf("export function CallScripts"));
  assert.equal(scriptsView.includes("fetch("), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "stale"/);
  assert.match(app, /view === "scripts"/);
  console.log("crmv4 round67 tests passed");
}

main();
