/**
 * Shared /crmx table and filter helpers.
 * Run: npx tsx tests/crmx-filters.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { activeFilterCount, bucketSeries, filterRows, queryString, uniqueSorted } from "../src/lib/crmx/filters";

const source = fs.readFileSync(path.join(__dirname, "../src/lib/crmx/filters.ts"), "utf8");

function main() {
  const rows = [
    { name: "Ada Lovelace", email: "ada@desk.test", desk: "London" },
    { name: "Grace Hopper", email: "grace@desk.test", desk: "Ankara" },
    { name: "Alan Turing", email: "alan@desk.test", desk: "London" },
  ];
  const all = filterRows(rows, "  ", (row) => [row.name, row.email]);
  assert.equal(all.length, 3);
  const ada = filterRows(rows, "ADA", (row) => [row.name, row.email, row.desk]);
  assert.deepEqual(ada.map((row) => row.name), ["Ada Lovelace"]);
  const london = filterRows(rows, "london", (row) => [row.desk]);
  assert.equal(london.length, 2);
  const none = filterRows(rows, "zzz", (row) => [row.name]);
  assert.equal(none.length, 0);

  assert.equal(activeFilterCount({ q: "ada", status: "PENDING", desk: "  ", from: "" }, ["q"]), 1);
  assert.equal(activeFilterCount({ q: "", status: "", kind: "deposit" }), 1);
  assert.equal(activeFilterCount({}), 0);

  assert.deepEqual(uniqueSorted([" London ", "Ankara", "London", "", "  ankara "]), ["ankara", "Ankara", "London"]);

  const flat = bucketSeries([], 4);
  assert.deepEqual(flat, [0, 0, 0, 0]);
  const series = bucketSeries(
    [
      { t: 0, v: 10 },
      { t: 10, v: 5 },
      { t: 20, v: 1 },
      { t: 30, v: 4 },
    ],
    4
  );
  assert.equal(series.length, 4);
  assert.equal(series.reduce((sum, n) => sum + n, 0), 20);
  assert.equal(series[0], 10);
  assert.equal(series[3], 4);

  assert.equal(queryString({ q: " ada ", status: "", take: 50, skip: 0 }), "?q=ada&take=50&skip=0");
  assert.equal(queryString({ q: " " }), "");

  assert.match(source, /Array\.from\(seen\)/);
  assert.match(source, /Array\.from\(\{ length: n \}/);
  assert.equal(source.includes("[...seen]"), false);
  assert.equal(source.includes("[..."), false);

  console.log("crmx filter tests passed");
}

main();
