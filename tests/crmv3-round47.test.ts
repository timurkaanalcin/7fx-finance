/**
 * CRM v3 round 47: compliance flags and the UTC day timeline.
 * Run: npx tsx tests/crmv3-round47.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RISK_AR, RISK_DE, RISK_EN, RISK_RU, RISK_TR } from "../src/lib/crmv3/copy-risk";
import { catalogLocalesComplete } from "../src/lib/crmv3/insights";
import {
  filterFlags,
  filterKind,
  findDay,
  frequentPeople,
  groupDays,
  kycWithDeposits,
  largeDeposits,
  pendingDoc,
  readNotes,
  readThresholds,
  setThreshold,
  writeNote,
} from "../src/lib/crmv3/risk";

const ROOT = path.resolve(__dirname, "..");

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
  const large = largeDeposits(deposits, { TRY: 50 });
  assert.deepEqual(large.map((row) => row.id), ["d1"]);
  assert.equal(largeDeposits(deposits, {}).length, 0);

  const withdrawals = [
    { id: "w1", amount: 10, currency: "TRY", userId: "u1", name: "Ada" },
    { id: "w2", amount: 5, currency: "USD", userId: "u1", name: "Ada" },
    { id: "w3", amount: 1, currency: "TRY", userId: "u2", name: "Bea" },
  ];
  const frequent = frequentPeople(withdrawals, 2);
  assert.equal(frequent.length, 1);
  assert.equal(frequent[0].sums.find((row) => row.currency === "TRY")?.amount, 10);
  assert.equal(frequent[0].sums.find((row) => row.currency === "USD")?.amount, 5);
  assert.equal(frequent[0].sums.some((row) => row.amount === 15), false);

  const kyc = kycWithDeposits(
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
  const flags = [
    ...large.map((row) => ({ kind: "large" as const, id: row.id, name: String(row.name || "") })),
    ...frequent.map((row) => ({ kind: "frequent" as const, id: row.userId, name: row.name })),
    ...kyc.map((row) => ({ kind: "kyc" as const, id: row.id, name: row.name })),
  ];
  assert.equal(filterFlags(flags, "kyc", "ada").length, 1);
  assert.equal(filterFlags(flags, "frequent", "").length, 1);
  assert.equal(filterFlags(flags, "", "missing").length, 0);

  const notes = writeNote(readNotes({ a: { body: "  desk  ", at: "2026-11-05" } }), "a", " ", "2026-11-05");
  assert.equal(notes.a, undefined);
  const kept = writeNote({}, "b", "hold", "2026-11-05T00:00:00Z");
  assert.equal(kept.b.body, "hold");
  assert.equal(writeNote({}, "b", "x".repeat(600), "2026-11-05").b.body.length, 500);
  assert.equal(pendingDoc([{ id: "doc", traderId: "u1", status: "APPROVED" }], "u1"), null);
  assert.equal(pendingDoc([{ id: "doc", traderId: "u1", status: "PENDING" }], "u1")?.id, "doc");

  const days = groupDays([
    { id: "1", at: "2026-11-04T01:00:00Z" },
    { id: "2", at: "2026-11-05T01:00:00Z" },
    { id: "3", at: "" },
    { id: "4", at: "not-a-date" },
    { id: "5", at: "2026-11-05T09:00:00Z" },
  ]);
  assert.equal(days[0].day, "2026-11-05");
  assert.equal(days[0].items[0].id, "5");
  assert.equal(days[days.length - 1].day, "");
  assert.equal(days[days.length - 1].items.length, 2);
  assert.equal(findDay(days.map((row) => row.day), "2026-11-04"), "2026-11-04");
  assert.equal(findDay(days.map((row) => row.day), "2026-01-01"), "");
  assert.equal(filterKind([{ kind: "note" }, { kind: "money" }], "money").length, 1);
  assert.equal(filterKind([{ kind: "note" }], "").length, 1);

  const copy = Object.keys(RISK_EN).sort();
  assert.deepEqual(Object.keys(RISK_TR).sort(), copy);
  assert.deepEqual(Object.keys(RISK_DE).sort(), copy);
  assert.deepEqual(Object.keys(RISK_RU).sort(), copy);
  assert.deepEqual(Object.keys(RISK_AR).sort(), copy);
  assert.notEqual(RISK_TR.rkEmpty, RISK_EN.rkEmpty);
  assert.notEqual(RISK_DE.tlGo, RISK_EN.tlGo);
  assert.notEqual(RISK_RU.rkViewer, RISK_EN.rkViewer);
  assert.notEqual(RISK_AR.tlMoney, RISK_EN.tlMoney);
  assert.equal(catalogLocalesComplete(), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-risk/);
  assert.match(css, /\.c3-timeline/);
  assert.match(css, /\.c3-type-mark/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/risk.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /filterFlags/);
  assert.match(view, /pendingDoc/);
  assert.match(view, /ROLE_KEY/);
  const role = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/inbox-sla.ts"), "utf8");
  assert.match(role, /crmv3-desk-role/);
  assert.equal(view.includes("crmv4"), false);
  const timeline = view.slice(view.indexOf("export function DayTimeline"));
  assert.equal(timeline.includes("sendJson"), false);
  assert.equal(timeline.includes("fetch("), false);
  assert.match(timeline, /groupDays/);
  assert.match(timeline, /findDay/);
  assert.match(timeline, /tlGo/);
  assert.match(timeline, /c3-type-mark/);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/risk.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  console.log("crmv3 round47 tests passed");
}

main();
