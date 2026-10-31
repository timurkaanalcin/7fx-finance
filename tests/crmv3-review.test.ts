/**
 * CRM v3 document review and reports. Checklist stays in the browser.
 * Run: npx tsx tests/crmv3-review.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  checksDone,
  emptyChecks,
  fileFor,
  isPdf,
  matchQuery,
  readChecks,
  reviewQueue,
  rowsForCurrency,
  setCheck,
  sumsByCurrency,
} from "../src/lib/crmv3/review";

const ROOT = path.resolve(__dirname, "..");

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
  const file = fileFor("a", [{ id: "f1", userId: "b" }, { id: "f2", userId: "a", mime: "application/pdf" }]);
  assert.equal(file?.id, "f2");
  assert.equal(isPdf(file), true);
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

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-kyc-split/);
  assert.match(css, /data-print="report"/);
  assert.equal(css.includes("overflow-x: auto"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/review.tsx"), "utf8");
  assert.match(page, /crmv3-doc-review/);
  assert.match(page, /action: "review"/);
  assert.match(page, /aria-required=\{false\}/);
  assert.equal(page.includes("crmv4-"), false);

  console.log("crmv3 review tests passed");
}

main();
