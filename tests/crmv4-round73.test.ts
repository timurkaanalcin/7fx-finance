/**
 * UTC week agenda and the panel text scale.
 * Run: npx tsx tests/crmv4-round73.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND73_COPY } from "../src/lib/crmv4/copy-round73";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { DONE_KEY } from "../src/lib/crmv4/round51";
import { readScale, weekBoard, weekDays, weekStart } from "../src/lib/crmv4/round73";

function main() {
  assert.equal(weekStart("2026-11-05"), "2026-11-02");
  assert.equal(weekStart("2026-11-08"), "2026-11-02");
  assert.equal(weekStart("2026-11-02"), "2026-11-02");
  assert.equal(weekStart("not-a-day"), "");
  const days = weekDays("2026-11-05");
  assert.equal(days.length, 7);
  assert.equal(days[0], "2026-11-02");
  assert.equal(days[6], "2026-11-08");
  const follows = [
    { id: "a", name: "Ada", at: "2026-11-05T09:00:00.000Z", balance: 40, currency: "EUR" },
    { id: "b", name: "Bea", at: "nope" },
  ] as Parameters<typeof weekBoard>[0];
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
  assert.equal(DONE_KEY, "crmv4-day-done");

  const copy = Object.keys(ROUND73_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND73_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "wkTitle"), "Week agenda");
  assert.equal(crmv4Text("tr", "tyTitle"), ROUND73_COPY.tr.tyTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-week-strip/);
  assert.match(css, /\.c4-scale-strip/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round73.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.match(view, /DONE_KEY/);
  assert.match(view, /data-week-strip/);
  assert.match(view, /data-week-today/);
  assert.match(view, /data-scale-strip/);
  assert.match(view, /wkEmpty/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "week"/);
  assert.match(app, /view === "scale"/);
  assert.match(app, /data-scale=\{scale\}/);
  console.log("crmv4 round73 tests passed");
}

main();
