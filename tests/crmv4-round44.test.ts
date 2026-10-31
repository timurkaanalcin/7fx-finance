/**
 * CRM v4 round 44 helpers.
 * Run: npx tsx tests/crmv4-round44.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND44_COPY } from "../src/lib/crmv4/copy-round44";
import {
  findDay,
  frequentPeople,
  groupDays,
  kycWithDeposits,
  largeDeposits,
  readCount,
  readThresholds,
  setThreshold,
  writeNote,
} from "../src/lib/crmv4/round44";

function main() {
  const thresholds = setThreshold(readThresholds({ usd: 100, TRY: 0, EUR: "no" }), "TRY", 500);
  assert.equal(thresholds.USD, 100);
  assert.equal(thresholds.TRY, 500);
  assert.equal(thresholds.EUR, undefined);
  const deposits = [
    { id: "1", amount: 600, currency: "TRY", userId: "a", name: "Ada" },
    { id: "2", amount: 50, currency: "USD", userId: "a", name: "Ada" },
    { id: "3", amount: 80, currency: "USD", userId: "b", name: "Bea" },
    { id: "4", amount: 9000, currency: "", userId: "c", name: "Cy" },
  ];
  const large = largeDeposits(deposits, thresholds);
  assert.deepEqual(large.map((row) => row.id), ["1"]);
  assert.equal(largeDeposits(deposits, {}).length, 0);
  const withdrawals = [
    { id: "w1", amount: 10, currency: "TRY", userId: "a", name: "Ada" },
    { id: "w2", amount: 5, currency: "USD", userId: "a", name: "Ada" },
    { id: "w3", amount: 1, currency: "TRY", userId: "b", name: "Bea" },
  ];
  const frequent = frequentPeople(withdrawals, 2);
  assert.equal(frequent.length, 1);
  assert.equal(frequent[0].userId, "a");
  assert.equal(frequent[0].count, 2);
  assert.deepEqual(frequent[0].sums.map((row) => row.currency), ["TRY", "USD"]);
  assert.equal(frequent[0].sums[0].amount, 10);
  assert.equal(frequent[0].sums[1].amount, 5);
  assert.equal(readCount(1), 3);
  const kyc = kycWithDeposits(
    [{ id: "a", name: "Ada", documentsStatus: "PENDING" }, { id: "b", name: "Bea", documentsStatus: "APPROVED" }],
    deposits,
  );
  assert.deepEqual(kyc.map((row) => row.id), ["a"]);
  assert.equal(kyc[0].sums.find((row) => row.currency === "TRY")?.amount, 600);
  assert.equal(kyc[0].sums.find((row) => row.currency === "USD")?.amount, 50);
  const notes = writeNote({}, "large-1", "  Look later  ", "2026-10-31T00:00:00Z");
  assert.equal(notes["large-1"].body, "Look later");
  assert.equal(writeNote(notes, "large-1", " ", "2026-10-31")["large-1"], undefined);
  const groups = groupDays([
    { at: "2026-10-31T10:00:00Z", id: "new" },
    { at: "2026-10-30T10:00:00Z", id: "old" },
    { at: "", id: "none" },
  ]);
  assert.deepEqual(groups.map((group) => group.day), ["2026-10-31", "2026-10-30", ""]);
  assert.equal(findDay(groups.map((group) => group.day), "2026-10-30"), "2026-10-30");
  assert.equal(findDay(groups.map((group) => group.day), "2026-01-01"), "");

  const copy = Object.keys(ROUND44_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND44_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-risk/);
  assert.match(css, /\.c4-timeline/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round44.tsx"), "utf8");
  const risk = view.slice(view.indexOf("export function RiskDesk"), view.indexOf("function Flag"));
  const note = risk.slice(risk.indexOf("function saveNote"), risk.indexOf("async function confirmReview"));
  assert.equal(note.includes("sendJson"), false);
  assert.match(risk, /action: "review"/);
  const day = view.slice(view.indexOf("export function DayTimeline"));
  assert.equal(day.includes("sendJson"), false);
  assert.match(day, /groupDays/);
  assert.match(day, /findDay/);
  console.log("crmv4 round44 tests passed");
}

main();
