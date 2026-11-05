/**
 * Introducer review and the jump history.
 * Run: npx tsx tests/crmv4-round61.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND61_COPY } from "../src/lib/crmv4/copy-round61";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  clearUnpinned,
  commissionRows,
  currencyTotals,
  filterComm,
  markPayout,
  pushJump,
  toggleJumpPin,
  visibleJumps,
} from "../src/lib/crmv4/round61";

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

  const copy = Object.keys(ROUND61_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND61_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cmTitle"), "Introducer review");
  assert.equal(crmv4Text("de", "jpTitle"), ROUND61_COPY.de.jpTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ib-board/);
  assert.match(css, /\.c4-jump-pad/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round61.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.match(view, /data-ib-board/);
  assert.match(view, /data-jump-pad/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ibpay"/);
  assert.match(app, /view === "jumps"/);
  assert.match(app, /crmv4:jumps/);
  console.log("crmv4 round61 tests passed");
}

main();
