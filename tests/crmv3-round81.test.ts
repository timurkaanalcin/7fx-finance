/**
 * CRM v3 follow-up snooze and trade side glance.
 * Run: npx tsx tests/crmv3-round81.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SZ_AR, SZ_DE, SZ_EN, SZ_RU, SZ_TR } from "../src/lib/crmv3/copy-snooze";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  FOLLOW_KEY,
  SIDE_KEY,
  activeSide,
  clearSnooze,
  followRows,
  otherSides,
  presentSides,
  readHiddenSides,
  readSnoozes,
  setSnooze,
  sideKind,
  sideSplit,
  snoozeActive,
  toggleSide,
  utcInstant,
  visibleFollows,
  visibleOrders,
  visibleSides,
} from "../src/lib/crmv3/snooze";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(FOLLOW_KEY, "crmv3-follow-snooze");
  assert.equal(SIDE_KEY, "crmv3-side-hide");
  assert.equal(utcInstant(""), "");
  assert.equal(utcInstant("   "), "");
  assert.equal(utcInstant("nope"), "");
  assert.equal(utcInstant("2026-11-05T18:00"), "2026-11-05T18:00:00.000Z");
  assert.equal(utcInstant("2026-11-05T18:00:30Z"), "2026-11-05T18:00:30.000Z");
  const follows = followRows([
    { id: "a", name: "Ada", at: "2026-11-05T09:00:00Z" },
    { id: "b", name: "Bea", at: "" },
    { id: "", name: "Blank", at: "2026-11-05T09:00:00Z" },
  ]);
  assert.deepEqual(follows.map((row) => row.id), ["a"]);
  assert.equal(setSnooze([], "a", "", ["a"], "t").length, 0);
  assert.equal(setSnooze([], "a", "nope", ["a"], "t").length, 0);
  assert.equal(setSnooze([], "z", "2026-11-05T18:00", ["a"], "t").length, 0);
  const saved = setSnooze([], "a", "2026-11-05T18:00", ["a"], "2026-11-05T10:00:00Z");
  assert.equal(saved[0].until, "2026-11-05T18:00:00.000Z");
  const now = Date.parse("2026-11-05T12:00:00Z");
  assert.equal(snoozeActive(saved[0], now), true);
  assert.equal(snoozeActive({ id: "a", until: "2026-11-05T11:00:00.000Z", at: "t" }, now), false);
  assert.equal(visibleFollows(follows, saved, now, "", false).length, 0);
  assert.equal(visibleFollows(follows, saved, now, "", true)[0].id, "a");
  assert.equal(visibleFollows(follows, saved, now, "zzz", true).length, 0);
  assert.equal(clearSnooze(saved, "a").length, 0);
  assert.deepEqual(readSnoozes([{ id: "z", until: "2026-11-05T18:00:00Z" }, { id: "a", until: "" }, { id: "a", until: "2026-11-05T18:00" }], ["a"]).map((item) => item.id), ["a"]);

  const orders = [
    { id: "1", label: "EURUSD Ada", side: "BUY" },
    { id: "2", label: "GBPUSD Bea", side: " sell " },
    { id: "3", label: "XAU Cid", side: "" },
    { id: "4", label: "XAG Dot", side: "LONG" },
    { id: "5", label: "EURUSD Fay", side: "buy" },
  ];
  assert.equal(sideKind("LONG"), "");
  assert.equal(sideKind(""), "");
  assert.deepEqual(sideSplit(orders), { buy: 2, sell: 1 });
  assert.deepEqual(otherSides(orders), [{ side: "LONG", count: 1 }]);
  assert.deepEqual(presentSides(orders), ["buy", "sell"]);
  assert.deepEqual(visibleOrders(orders, "buy", "ada").map((row) => row.id), ["1"]);
  assert.equal(visibleOrders(orders, "sell", "").some((row) => row.id === "4"), false);
  assert.deepEqual(readHiddenSides(["buy", "long", ""]), ["buy"]);
  assert.deepEqual(toggleSide(["buy"], "sell"), ["buy", "sell"]);
  assert.deepEqual(visibleSides(["buy", "sell"], ["sell"], false), ["buy"]);
  assert.equal(activeSide("sell", ["buy"]), "");
  assert.equal(activeSide("BUY", ["buy"]), "buy");

  const copy = Object.keys(SZ_EN).sort();
  assert.deepEqual(Object.keys(SZ_TR).sort(), copy);
  assert.deepEqual(Object.keys(SZ_DE).sort(), copy);
  assert.deepEqual(Object.keys(SZ_RU).sort(), copy);
  assert.deepEqual(Object.keys(SZ_AR).sort(), copy);
  assert.notEqual(SZ_TR.szTitle, SZ_EN.szTitle);
  assert.notEqual(SZ_DE.sdHint, SZ_EN.sdHint);
  assert.notEqual(SZ_RU.sdSell, SZ_EN.sdSell);
  assert.notEqual(SZ_AR.szBlank, SZ_EN.szBlank);
  assert.equal(crmv3Text("en", "szTitle"), "Follow-up snooze");
  assert.equal(crmv3Text("tr", "sdTitle"), SZ_TR.sdTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-follow-snooze", "de"), "Nachfass-Pause");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "snooze"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "sideglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("snooze"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("sideglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("snooze")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "work" && (group.ids as readonly string[]).includes("sideglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-snooze-strip/);
  assert.match(css, /\.c3-side-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/snooze.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("/api/admin/positions?tab=orders&take=40"), true);
  assert.match(view, /FOLLOW_KEY/);
  assert.match(view, /data-snooze-strip/);
  assert.match(view, /data-side-glance/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "snooze"/);
  assert.match(app, /view === "sideglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round81 tests passed");
}

main();
