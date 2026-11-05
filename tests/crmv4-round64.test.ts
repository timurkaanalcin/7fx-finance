/**
 * Customer counts and the cheat sheet.
 * Run: npx tsx tests/crmv4-round64.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND64_COPY } from "../src/lib/crmv4/copy-round64";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  addTip,
  heatCells,
  hideTip,
  pinId,
  readMode,
  removeTip,
  visibleTips,
} from "../src/lib/crmv4/round64";

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

  assert.equal(addTip([], { id: "t1", keys: "g", body: "   ", at: "t" }).length, 0);
  const tips = addTip([], { id: "t1", keys: " g then c ", body: " Open customers ", at: "2026-11-05T10:00:00Z" });
  assert.equal(tips[0].body, "Open customers");
  assert.equal(tips[0].keys, "g then c");
  const hidden = hideTip(tips, "t1", true);
  assert.equal(visibleTips(hidden, "", false).length, 0);
  assert.equal(visibleTips(hidden, "customers", true)[0].id, "t1");
  assert.equal(removeTip(hidden, "t1").length, 0);

  const copy = Object.keys(ROUND64_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND64_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "htTitle"), "Desk heatmap");
  assert.equal(crmv4Text("de", "csTitle"), ROUND64_COPY.de.csTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-heat-strip/);
  assert.match(css, /\.c4-cheat-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round64.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("money("), false);
  assert.match(view, /data-heat-strip/);
  assert.match(view, /data-cheat-pad/);
  assert.match(view, /data-confirm/);
  assert.match(view, /role=TRADER/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "heatmap"/);
  assert.match(app, /view === "cheats"/);
  console.log("crmv4 round64 tests passed");
}

main();
