/**
 * CRM v4 round 12 helpers.
 * Run: npx tsx tests/crmv4-round12.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  channelCounts,
  countActive,
  decodeView,
  displayPnl,
  encodeView,
  headerHit,
  inDateRange,
  inNumberRange,
  lastChannel,
  marginLevel,
  monthKey,
  multiSort,
  neighborId,
} from "../src/lib/crmv4/round12";

function main() {
  assert.equal(neighborId(["a", "b", "c"], "b", 1), "c");
  assert.equal(neighborId(["a", "b", "c"], "b", -1), "a");
  assert.equal(neighborId(["a"], "a", 1), "");
  const encoded = encodeView({ status: "active", sort: "name" });
  assert.deepEqual(decodeView(encoded), { status: "active", sort: "name" });
  assert.equal(decodeView("%%%"), null);
  assert.equal(countActive({ a: "1", b: "", c: "x" }), 2);
  assert.equal(inNumberRange(10, "5", "12"), true);
  assert.equal(inNumberRange(10, "11", ""), false);
  assert.equal(inDateRange("2026-10-02T00:00:00Z", "2026-10-01", "2026-10-03"), true);
  assert.equal(inDateRange("2026-09-01", "2026-10-01", ""), false);
  const sorted = multiSort(
    [{ name: "Ken", balance: 2 }, { name: "Ada", balance: 9 }, { name: "Ada", balance: 1 }],
    ["name", "balance"],
    (row, key) => key === "name" ? row.name : row.balance,
  );
  assert.equal(sorted[0].name, "Ada");
  assert.equal(sorted[0].balance, 9);
  assert.equal(marginLevel(1500, 500), 300);
  assert.equal(marginLevel(10, 0), null);
  assert.equal(displayPnl("BUY", 1.1, 1.2, 2), 0.2);
  assert.equal(displayPnl("SELL", 1.2, 1.1, 2), 0.2);
  assert.equal(monthKey("2026-10-31T00:00:00Z"), "2026-10");
  assert.deepEqual(channelCounts([{ type: "CALL" }, { type: "CALL" }, { type: "NOTE" }]), [
    { type: "CALL", count: 2 },
    { type: "NOTE", count: 1 },
  ]);
  assert.equal(lastChannel([{ type: "NOTE", createdAt: "2026-10-01" }, { type: "CALL", createdAt: "2026-10-02" }]), "CALL");
  assert.equal(headerHit({ name: "Ada Demir", email: "ada@x.com", country: "TR", active: true }, { customer: "ada" }), true);
  assert.equal(headerHit({ name: "Ada", country: "TR", active: true }, { country: "de" }), false);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-profile-split/);
  assert.match(css, /\.c4-mini-nav/);
  assert.match(css, /\.c4-gauge/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round12 tests passed");
}

main();
