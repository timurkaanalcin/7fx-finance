/**
 * Priority lane and document pulse counts.
 * Run: npx tsx tests/crmv4-round76.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND76_COPY } from "../src/lib/crmv4/copy-round76";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  DOC_BOARD,
  DOC_LIST,
  addLane,
  moveLane,
  pulseCounts,
  readLane,
  toggleKind,
  visibleKinds,
  visibleLane,
  windowDays,
} from "../src/lib/crmv4/round76";

const NOW = Date.parse("2026-11-05T12:00:00Z");

function main() {
  const known = ["a", "b"];
  assert.deepEqual(readLane(["", "z", "a", { id: "b", pinned: true }, { id: "a" }], known).map((item) => item.id), ["a", "b"]);
  assert.equal(addLane([], "", known).length, 0);
  assert.equal(addLane([], "z", known).length, 0);
  const lane = addLane(addLane([], "a", known), "b", known);
  assert.equal(addLane(lane, "a", known).length, 2);
  const moved = moveLane(lane, "b", -1);
  assert.deepEqual(moved.map((item) => item.id), ["b", "a"]);
  assert.equal(moveLane(moved, "b", -1)[0].id, "b");
  const pinned = visibleLane(moved.map((item) => (item.id === "a" ? { ...item, pinned: true } : item)), false);
  assert.equal(pinned[0].id, "a");

  const docs = [
    { id: "old", reviewedAt: "2026-10-01T00:00:00Z", createdAt: "2026-01-01T00:00:00Z" },
    { id: "ahead", reviewedAt: null, createdAt: "2026-11-20T00:00:00Z" },
    { id: "far", reviewedAt: "2027-06-01T00:00:00Z" },
    { id: "blank", reviewedAt: null, createdAt: null },
    { id: "", reviewedAt: "2026-01-01T00:00:00Z" },
  ];
  assert.deepEqual(pulseCounts(docs, NOW, 30), { expired: 1, soon: 1 });
  assert.equal(pulseCounts([{ id: "x" }], NOW, 30).expired, 0);
  assert.equal(windowDays(90), 90);
  assert.equal(windowDays("nope"), 30);
  assert.equal(DOC_LIST, "/api/admin/documents?take=40");
  assert.equal(DOC_BOARD, "expiry");
  const hidden = toggleKind([], "soon");
  assert.deepEqual(visibleKinds(hidden, false), ["expired"]);
  assert.deepEqual(visibleKinds(hidden, true), ["soon"]);

  const copy = Object.keys(ROUND76_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND76_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "lnTitle"), "Priority lane");
  assert.equal(crmv4Text("tr", "xpTitle"), ROUND76_COPY.tr.xpTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lane-pad/);
  assert.match(css, /\.c4-docpulse/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round76.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.match(view, /DOC_LIST/);
  assert.match(view, /data-lane-pad/);
  assert.match(view, /data-docpulse/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lane"/);
  assert.match(app, /view === "docpulse"/);
  console.log("crmv4 round76 tests passed");
}

main();
