/**
 * CRM v3 customer counts and the cheat sheet.
 * Run: npx tsx tests/crmv3-round64.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HEAT_AR, HEAT_DE, HEAT_EN, HEAT_RU, HEAT_TR } from "../src/lib/crmv3/copy-heatmap";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  MODE_KEY,
  PIN_KEY,
  TIP_KEY,
  addTip,
  heatCells,
  hideTip,
  pinId,
  readMode,
  removeTip,
  visibleTips,
} from "../src/lib/crmv3/heatmap";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const people = [
    { id: "a", name: "Ada", country: "DE", desk: "Istanbul A" },
    { id: "b", name: "Bea", country: "DE", desk: "Istanbul A" },
    { id: "c", name: "Cem", country: "", desk: "Mena" },
    { id: "d", name: "Den", country: "TR", desk: "" },
  ];
  const byCountry = heatCells(people, "country", "", []);
  assert.equal(byCountry[0].key, "DE");
  assert.equal(byCountry[0].count, 2);
  assert.equal(byCountry.find((cell) => cell.key === "")?.count, 1);
  const pinned = heatCells(people, "desk", "", [pinId("desk", "")]);
  assert.equal(pinned[0].key, "");
  assert.deepEqual(heatCells(people, "country", "ada", []).map((cell) => cell.key), ["DE"]);
  assert.equal(readMode("desk"), "desk");
  assert.equal(readMode("money"), "country");
  assert.equal(PIN_KEY, "crmv3-heat-pins");
  assert.equal(MODE_KEY, "crmv3-heat-mode");
  assert.equal(TIP_KEY, "crmv3-cheat-sheet");

  assert.equal(addTip([], { id: "t1", keys: "g", body: "   ", at: "t" }).length, 0);
  const tips = addTip([], { id: "t1", keys: " g then c ", body: " Open customers ", at: "2026-11-05T10:00:00Z" });
  assert.equal(tips[0].body, "Open customers");
  assert.equal(tips[0].keys, "g then c");
  const hidden = hideTip(tips, "t1", true);
  assert.equal(visibleTips(hidden, "", false).length, 0);
  assert.equal(visibleTips(hidden, "customers", true)[0].id, "t1");
  assert.equal(removeTip(hidden, "t1").length, 0);

  const copy = Object.keys(HEAT_EN).sort();
  assert.deepEqual(Object.keys(HEAT_TR).sort(), copy);
  assert.deepEqual(Object.keys(HEAT_DE).sort(), copy);
  assert.deepEqual(Object.keys(HEAT_RU).sort(), copy);
  assert.deepEqual(Object.keys(HEAT_AR).sort(), copy);
  assert.notEqual(HEAT_TR.htTitle, HEAT_EN.htTitle);
  assert.notEqual(HEAT_DE.csHint, HEAT_EN.csHint);
  assert.notEqual(HEAT_RU.htNoDesk, HEAT_EN.htNoDesk);
  assert.notEqual(HEAT_AR.csBlank, HEAT_EN.csBlank);
  assert.equal(crmv3Text("en", "htTitle"), "Desk heatmap");
  assert.equal(crmv3Text("de", "csTitle"), HEAT_DE.csTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-cheat-sheet", "tr"), "Masa ipuçları");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "heatmap"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "cheats"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("heatmap"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("cheats"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("heatmap")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("cheats")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-heat-strip/);
  assert.match(css, /\.c3-cheat-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/heatmap.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("money("), false);
  assert.match(view, /data-heat-strip/);
  assert.match(view, /data-cheat-pad/);
  assert.match(view, /data-confirm/);
  assert.match(view, /role=TRADER/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "heatmap"/);
  assert.match(app, /view === "cheats"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round64 tests passed");
}

main();
