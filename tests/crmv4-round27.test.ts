/**
 * CRM v4 round 27 helpers.
 * Run: npx tsx tests/crmv4-round27.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND27_COPY } from "../src/lib/crmv4/copy-round27";
import {
  checksDone,
  emptyChecks,
  fileFor,
  matchQuery,
  readChecks,
  reviewQueue,
  rowsForCurrency,
  setCheck,
  sumsByCurrency,
} from "../src/lib/crmv4/round27";

function main() {
  const people = reviewQueue([
    { id: "d1", name: "ID Back", docType: "ID", status: "PENDING", traderId: "a", trader: "Mehmet", traderEmail: "m@demo", desk: "Istanbul" },
    { id: "d2", name: "Proof", docType: "ADDRESS", status: "PENDING", traderId: "b", trader: "Ada", traderEmail: "a@demo", desk: "Ankara" },
    { id: "d3", name: "Old", docType: "ID", status: "APPROVED", traderId: "a", trader: "Mehmet" },
    { id: "d4", status: "PENDING" },
  ]);
  assert.equal(people.length, 2);
  assert.equal(people[0].name, "Ada");
  assert.equal(people.find((row) => row.id === "a")?.docs.length, 1);
  assert.equal(matchQuery(people, "istanbul").length, 1);
  const checks = setCheck({}, "d1", "name", true);
  assert.equal(checksDone(checks.d1), 1);
  assert.equal(checksDone(emptyChecks()), 0);
  assert.equal(readChecks({ d1: { name: true, photo: "yes" } }).d1.photo, false);
  assert.equal(fileFor("a", [{ id: "f1", userId: "b" }, { id: "f2", userId: "a", mime: "application/pdf" }])?.id, "f2");
  assert.equal(fileFor("missing", []), null);
  const sums = sumsByCurrency([
    { id: "1", amount: 250, currency: "USD" },
    { id: "2", amount: 400, currency: "TRY" },
    { id: "3", amount: 120, currency: "usd" },
  ]);
  assert.deepEqual(sums, [
    { currency: "TRY", amount: 400, count: 1 },
    { currency: "USD", amount: 370, count: 2 },
  ]);
  assert.equal(rowsForCurrency([{ id: "1", currency: "USD" }, { id: "2", currency: "TRY" }], "TRY").length, 1);
  const keys = Object.keys(ROUND27_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND27_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kyc-luxe/);
  assert.match(css, /\.c4-report-center/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round27.tsx"), "utf8");
  assert.match(page, /crmv4-doc-review/);
  assert.match(page, /action: "review"/);
  assert.match(page, /aria-required=\{false\}/);
  assert.equal(page.includes("crmv4-kyc-check"), false);
  console.log("crmv4 round27 tests passed");
}

main();
