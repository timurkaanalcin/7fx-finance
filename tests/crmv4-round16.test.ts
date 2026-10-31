/**
 * CRM v4 round 16 helpers.
 * Run: npx tsx tests/crmv4-round16.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  boardQuery,
  countryMix,
  daysInStage,
  followCounts,
  followTone,
  idsInStage,
  invertIds,
  stageCounts,
  stageFor,
  stuckIds,
  valueByCurrency,
  winShare,
} from "../src/lib/crmv4/round16";

function main() {
  const rows = [
    { id: "a", name: "Ada", email: "ada@x.com", country: "TR", saleStatus: "NEW", balance: 100, currency: "USD" },
    { id: "b", name: "Ken", email: "ken@x.com", country: "TR", saleStatus: "CONVERTED", balance: 50, currency: "USD" },
    { id: "c", name: "Noor", email: "noor@x.com", country: "DE", saleStatus: "LOST", balance: 20, currency: "EUR" },
  ];
  assert.equal(stageFor(rows[0], {}), "inbox");
  assert.equal(stageFor(rows[0], { a: "qualified" }), "qualified");
  assert.equal(stageCounts(rows, {}).won, 1);
  assert.equal(stageCounts(rows, {}).lost, 1);
  assert.equal(daysInStage("2026-10-24T00:00:00Z", new Date("2026-10-31T00:00:00Z").getTime()), 7);
  assert.equal(followTone("2026-10-31", "2026-10-31"), "today");
  assert.equal(followTone("2026-10-30", "2026-10-31"), "late");
  assert.deepEqual(followCounts({ a: "2026-10-31", b: "2026-10-01" }, ["a", "b"], "2026-10-31"), { today: 1, late: 1 });
  assert.equal(winShare(rows, {}), 50);
  assert.equal(valueByCurrency(rows).length, 2);
  assert.deepEqual(stuckIds(rows, { a: "contacted" }, { a: "2026-10-01T00:00:00Z" }, new Date("2026-10-31T00:00:00Z").getTime()), ["a"]);
  assert.equal(boardQuery(rows, "ken").length, 1);
  assert.equal(countryMix(rows)[0].country, "TR");
  assert.deepEqual(invertIds(["a", "b", "c"], ["b"]), ["a", "c"]);
  assert.deepEqual(idsInStage(rows, {}, "won"), ["b"]);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lead-board/);
  assert.match(css, /\.c4-lead-bulk/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round16 tests passed");
}

main();
