/**
 * CRM v3 UTC week agenda and the panel text scale.
 * Run: npx tsx tests/crmv3-round73.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { WEEK_AR, WEEK_DE, WEEK_EN, WEEK_RU, WEEK_TR } from "../src/lib/crmv3/copy-week";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { DONE_KEY } from "../src/lib/crmv3/dense";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { SCALE_KEY, readScale, weekBoard, weekDays, weekStart } from "../src/lib/crmv3/week";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(SCALE_KEY, "crmv3-panel-scale");
  assert.equal(DONE_KEY, "crmv3-day-done");
  assert.equal(weekStart("2026-11-05"), "2026-11-02");
  assert.equal(weekStart("2026-11-08"), "2026-11-02");
  assert.equal(weekStart("2026-11-02"), "2026-11-02");
  assert.equal(weekStart("not-a-day"), "");
  const days = weekDays("2026-11-05");
  assert.equal(days.length, 7);
  assert.equal(days[0], "2026-11-02");
  assert.equal(days[6], "2026-11-08");
  const follows = [
    { id: "a", name: "Ada", at: "2026-11-05T09:00:00.000Z" },
    { id: "b", name: "Bea", at: "nope" },
  ];
  const board = weekBoard(
    follows,
    [{ id: "r1", name: "Call back", at: "2026-11-03T12:00:00.000Z" }],
    "2026-11-05",
    "",
  );
  assert.equal(board.length, 7);
  assert.equal(board.find((day) => day.day === "2026-11-02")?.items.length, 0);
  assert.equal(board.find((day) => day.day === "2026-11-05")?.items[0].id, "follow:a");
  assert.equal(board.find((day) => day.day === "2026-11-03")?.items[0].kind, "task");
  assert.equal(board.some((day) => day.items.some((item) => item.name === "Bea")), false);
  assert.equal(JSON.stringify(board).includes("EUR"), false);
  assert.equal(weekBoard([{ id: "a", name: "Ada", at: "2026-11-05T09:00:00.000Z" }], [], "2026-11-05", "zzz").every((day) => day.items.length === 0), true);
  assert.equal(readScale("small"), "small");
  assert.equal(readScale("large"), "large");
  assert.equal(readScale("giant"), "desk");
  assert.equal(readScale(null), "desk");

  const copy = Object.keys(WEEK_EN).sort();
  assert.deepEqual(Object.keys(WEEK_TR).sort(), copy);
  assert.deepEqual(Object.keys(WEEK_DE).sort(), copy);
  assert.deepEqual(Object.keys(WEEK_RU).sort(), copy);
  assert.deepEqual(Object.keys(WEEK_AR).sort(), copy);
  assert.notEqual(WEEK_TR.wkTitle, WEEK_EN.wkTitle);
  assert.notEqual(WEEK_DE.tyHint, WEEK_EN.tyHint);
  assert.notEqual(WEEK_RU.wkFollow, WEEK_EN.wkFollow);
  assert.notEqual(WEEK_AR.tyPad, WEEK_EN.tyPad);
  assert.equal(crmv3Text("en", "wkTitle"), "Week agenda");
  assert.equal(crmv3Text("tr", "tyTitle"), WEEK_TR.tyTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-panel-scale", "de"), "Paneltext");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "week"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "scale"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("week"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("scale"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("week")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("scale")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-week-strip/);
  assert.match(css, /\.c3-scale-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/week.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.match(view, /DONE_KEY/);
  assert.match(view, /data-week-strip/);
  assert.match(view, /data-week-today/);
  assert.match(view, /data-scale-strip/);
  assert.match(view, /wkEmpty/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "week"/);
  assert.match(app, /view === "scale"/);
  assert.match(app, /data-scale=\{scale\}/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round73 tests passed");
}

main();
