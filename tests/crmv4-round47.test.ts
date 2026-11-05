/**
 * Risk review and the customer day timeline.
 * Run: npx tsx tests/crmv4-round47.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND47_COPY } from "../src/lib/crmv4/copy-round47";
import {
  filterFlags,
  filterKind,
  findDay,
  frequentFlags,
  groupDays,
  kycFlags,
  largeFlags,
  pendingDoc,
  readNotes,
  readThresholds,
  setThreshold,
  sumsOf,
  writeNote,
} from "../src/lib/crmv4/round47";

function main() {
  const thresholds = setThreshold(readThresholds({ try: 50, usd: 0, bad: "x" }), "EUR", 20);
  assert.equal(thresholds.TRY, 50);
  assert.equal(thresholds.USD, undefined);
  assert.equal(thresholds.EUR, 20);
  assert.equal(setThreshold(thresholds, "EUR", 0).EUR, undefined);

  const deposits = [
    { id: "d1", amount: 80, currency: "TRY", userId: "u1", name: "Ada" },
    { id: "d2", amount: 10, currency: "TRY", userId: "u1", name: "Ada" },
    { id: "d3", amount: 5000, currency: "USD", userId: "u2", name: "Bea" },
  ];
  const large = largeFlags(deposits, { TRY: 50 });
  assert.deepEqual(large.map((row) => row.id), ["d1"]);
  assert.equal(large[0].sums[0].currency, "TRY");
  assert.equal(largeFlags(deposits, {}).length, 0);

  const withdrawals = [
    { id: "w1", amount: 10, currency: "TRY", userId: "u1", name: "Ada" },
    { id: "w2", amount: 5, currency: "USD", userId: "u1", name: "Ada" },
    { id: "w3", amount: 1, currency: "TRY", userId: "u2", name: "Bea" },
  ];
  const frequent = frequentFlags(withdrawals, 2);
  assert.equal(frequent.length, 1);
  assert.equal(frequent[0].id, "u1");
  assert.equal(frequent[0].sums.find((row) => row.currency === "TRY")?.amount, 10);
  assert.equal(frequent[0].sums.find((row) => row.currency === "USD")?.amount, 5);
  assert.equal(frequent[0].sums.some((row) => row.amount === 15), false);
  assert.equal(sumsOf(withdrawals).some((row) => row.amount === 16), false);

  const kyc = kycFlags(
    [
      { id: "u1", name: "Ada", documentsStatus: "PENDING" },
      { id: "u2", name: "Bea", documentsStatus: "APPROVED" },
      { id: "u3", name: "Cem", documentsStatus: "PENDING" },
    ],
    deposits,
  );
  assert.deepEqual(kyc.map((row) => row.id), ["u1"]);
  assert.equal(kyc[0].sums.find((row) => row.currency === "TRY")?.amount, 90);
  assert.equal(kyc[0].sums.some((row) => row.currency === "USD"), false);
  const mixed = filterFlags([...large, ...frequent, ...kyc], "kyc", "ada");
  assert.equal(mixed.length, 1);
  assert.equal(filterFlags(large, "frequent", "").length, 0);

  const notes = writeNote(readNotes({ a: { body: "  desk  ", at: "2026-11-05" } }), "a", " ", "2026-11-05");
  assert.equal(notes.a, undefined);
  const kept = writeNote({}, "b", "hold", "2026-11-05T00:00:00Z");
  assert.equal(kept.b.body, "hold");
  assert.equal(pendingDoc([{ id: "doc", traderId: "u1", status: "APPROVED" }], "u1"), null);
  assert.equal(pendingDoc([{ id: "doc", traderId: "u1", status: "PENDING" }], "u1")?.id, "doc");

  const days = groupDays([
    { id: "1", at: "2026-11-04T01:00:00Z" },
    { id: "2", at: "2026-11-05T01:00:00Z" },
    { id: "3", at: "" },
    { id: "4", at: "not-a-date" },
  ]);
  assert.equal(days[0].day, "2026-11-05");
  assert.equal(days[days.length - 1].day, "");
  assert.equal(days[days.length - 1].items.length, 2);
  assert.equal(findDay(days.map((row) => row.day), "2026-11-04"), "2026-11-04");
  assert.equal(findDay(days.map((row) => row.day), "2026-01-01"), "");
  assert.equal(filterKind([{ kind: "note" }, { kind: "money" }], "money").length, 1);
  assert.equal(filterKind([{ kind: "note" }], "").length, 1);

  const copy = Object.keys(ROUND47_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND47_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-risk-desk/);
  assert.match(css, /\.c4-dayline/);
  assert.match(css, /\.c4-type-icon/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round47.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /data-dayline/);
  const timeline = view.slice(view.indexOf("export function RecordTimeline"));
  assert.equal(timeline.includes("sendJson"), false);
  assert.equal(timeline.includes("fetch("), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "risk"/);
  const feed = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round17.tsx"), "utf8");
  assert.match(feed, /RecordTimeline/);
  console.log("crmv4 round47 tests passed");
}

main();
