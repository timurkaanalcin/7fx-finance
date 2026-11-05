/**
 * CRM v3 introducer review and the route history.
 * Run: npx tsx tests/crmv3-round61.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { INTRO_AR, INTRO_DE, INTRO_EN, INTRO_RU, INTRO_TR } from "../src/lib/crmv3/copy-intro";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  JUMP_KEY,
  MARK_KEY,
  clearUnpinned,
  commissionRows,
  currencyTotals,
  filterComm,
  markPayout,
  pushJump,
  toggleJumpPin,
  visibleJumps,
} from "../src/lib/crmv3/introducer";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const people = [
    { id: "u1", name: "Mehmet", affiliateA: "AFF-100" },
    { id: "u2", name: "Elena", affiliateB: "AFF-200" },
    { id: "u3", name: "Ada" },
  ];
  const deposits = [
    { id: "d1", amount: 25, currency: "TRY", status: "PENDING", user: { id: "u1" } },
    { id: "d2", amount: 40, currency: "EUR", status: "APPROVED", userId: "u2" },
    { id: "d3", amount: 10, currency: "USD", status: "PENDING", user: { id: "u3" } },
    { id: "d4", amount: 5, currency: "TRY", status: "PENDING", user: { id: "missing" } },
    { id: "d5", amount: 7, currency: "", status: "REJECTED", user: { id: "u1" } },
  ];
  const rows = commissionRows(people, deposits);
  assert.deepEqual(rows.map((row) => row.id), ["d1", "d2", "d5"]);
  assert.equal(rows[1].affiliate, "AFF-200");
  assert.deepEqual(filterComm(rows, "", "aff-100").map((row) => row.id), ["d1", "d5"]);
  assert.deepEqual(filterComm(rows, "PENDING", "aff-100").map((row) => row.id), ["d1"]);
  const totals = currencyTotals(rows);
  assert.equal(totals.find((line) => line.currency === "TRY")?.amount, 25);
  assert.equal(totals.find((line) => line.currency === "EUR")?.amount, 40);
  assert.equal(totals.find((line) => line.currency === "")?.amount, 7);
  assert.notEqual(totals.find((line) => line.currency === "TRY")?.amount, 72);
  assert.equal(MARK_KEY, "crmv3-ib-marks");
  assert.equal(JUMP_KEY, "crmv3-jump-history");

  const blank = markPayout([], "d1", "   ", "2026-11-05T12:00:00Z");
  assert.equal("reason" in blank[0], false);
  assert.equal(markPayout(blank, "d1", " desk ", "2026-11-05T12:01:00Z")[0].reason, "desk");
  assert.equal(markPayout(blank, "d1", " desk ", "2026-11-05T12:01:00Z").length, 1);

  const allowed = ["health", "ibpay", "jumps"];
  let jumps = pushJump([], "https://evil", "t0", allowed);
  assert.equal(jumps.length, 0);
  jumps = pushJump(jumps, "health", "t1", allowed);
  jumps = toggleJumpPin(jumps, "health");
  jumps = pushJump(jumps, "ibpay", "t2", allowed);
  jumps = pushJump(jumps, "health", "t3", allowed);
  assert.equal(jumps.find((jump) => jump.sectionId === "health")?.pinned, true);
  assert.equal(jumps.filter((jump) => jump.sectionId === "health").length, 1);
  assert.deepEqual(clearUnpinned(jumps).map((jump) => jump.sectionId), ["health"]);
  assert.equal(visibleJumps(jumps, "ib")[0].sectionId, "ibpay");

  const copy = Object.keys(INTRO_EN).sort();
  assert.deepEqual(Object.keys(INTRO_TR).sort(), copy);
  assert.deepEqual(Object.keys(INTRO_DE).sort(), copy);
  assert.deepEqual(Object.keys(INTRO_RU).sort(), copy);
  assert.deepEqual(Object.keys(INTRO_AR).sort(), copy);
  assert.notEqual(INTRO_TR.cmTitle, INTRO_EN.cmTitle);
  assert.notEqual(INTRO_DE.jpHint, INTRO_EN.jpHint);
  assert.notEqual(INTRO_RU.cmMark, INTRO_EN.cmMark);
  assert.notEqual(INTRO_AR.jpClear, INTRO_EN.jpClear);
  assert.equal(crmv3Text("en", "cmTitle"), "Introducer review");
  assert.equal(crmv3Text("de", "jpTitle"), INTRO_DE.jpTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-jump-history", "tr"), "Son yollar");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "ibpay"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "jumps"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("ibpay"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("jumps"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("ibpay")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("jumps")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-ib-board/);
  assert.match(css, /\.c3-jump-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/introducer.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-ib-board/);
  assert.match(view, /data-jump-pad/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "ibpay"/);
  assert.match(app, /view === "jumps"/);
  assert.match(app, /crmv3:jumps/);
  assert.equal(app.includes("crmv4"), false);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round61 tests passed");
}

main();
