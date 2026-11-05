/**
 * CRM v3 priority lane and document pulse counts.
 * Run: npx tsx tests/crmv3-round76.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LANE_AR, LANE_DE, LANE_EN, LANE_RU, LANE_TR } from "../src/lib/crmv3/copy-lane";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  DOC_BOARD,
  DOC_LIST,
  HIDE_KEY,
  LANE_KEY,
  addLane,
  moveLane,
  pulseCounts,
  readLane,
  toggleKind,
  visibleKinds,
  visibleLane,
  windowDays,
} from "../src/lib/crmv3/lane";

const ROOT = path.resolve(__dirname, "..");
const NOW = Date.parse("2026-11-05T12:00:00Z");

function main() {
  assert.equal(LANE_KEY, "crmv3-priority-lane");
  assert.equal(HIDE_KEY, "crmv3-docpulse-hide");
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

  const copy = Object.keys(LANE_EN).sort();
  assert.deepEqual(Object.keys(LANE_TR).sort(), copy);
  assert.deepEqual(Object.keys(LANE_DE).sort(), copy);
  assert.deepEqual(Object.keys(LANE_RU).sort(), copy);
  assert.deepEqual(Object.keys(LANE_AR).sort(), copy);
  assert.notEqual(LANE_TR.lnTitle, LANE_EN.lnTitle);
  assert.notEqual(LANE_DE.xpHint, LANE_EN.xpHint);
  assert.notEqual(LANE_RU.lnUp, LANE_EN.lnUp);
  assert.notEqual(LANE_AR.lnBlank, LANE_EN.lnBlank);
  assert.equal(crmv3Text("en", "lnTitle"), "Priority lane");
  assert.equal(crmv3Text("tr", "xpTitle"), LANE_TR.xpTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-priority-lane", "de"), "Prioritätsliste");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "lane"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "docpulse"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("lane"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("docpulse"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("lane")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("docpulse")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-lane-pad/);
  assert.match(css, /\.c3-docpulse/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/lane.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.match(view, /DOC_LIST/);
  assert.match(view, /data-lane-pad/);
  assert.match(view, /data-docpulse/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "lane"/);
  assert.match(app, /view === "docpulse"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round76 tests passed");
}

main();
