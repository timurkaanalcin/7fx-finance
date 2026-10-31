/**
 * CRM v3 round 44: risk review and activity timeline.
 * Run: npx tsx tests/crmv3-round44.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RISK_AR, RISK_DE, RISK_EN, RISK_RU, RISK_TR } from "../src/lib/crmv3/copy-risk";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
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
} from "../src/lib/crmv3/risk";
import { CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

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

  const copy = Object.keys(RISK_EN).sort();
  assert.deepEqual(Object.keys(RISK_TR).sort(), copy);
  assert.deepEqual(Object.keys(RISK_DE).sort(), copy);
  assert.deepEqual(Object.keys(RISK_RU).sort(), copy);
  assert.deepEqual(Object.keys(RISK_AR).sort(), copy);
  assert.notEqual(RISK_TR.rkTitle, RISK_EN.rkTitle);
  assert.notEqual(RISK_DE.rkConfirm, RISK_EN.rkConfirm);
  assert.notEqual(RISK_RU.tlTitle, RISK_EN.tlTitle);
  assert.notEqual(RISK_AR.rkLarge, RISK_EN.rkLarge);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-risk-thresholds", "en"), "Risk thresholds");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "risk"), true);
  assert.equal(NAV_SECTIONS.some((group) => (group.ids as readonly string[]).includes("risk")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-risk/);
  assert.match(css, /\.c3-timeline/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/risk.tsx"), "utf8");
  const risk = view.slice(view.indexOf("export function RiskDesk"), view.indexOf("function Flag"));
  const note = risk.slice(risk.indexOf("function saveNote"), risk.indexOf("async function confirmReview"));
  assert.equal(note.includes("sendJson"), false);
  assert.match(risk, /action: "review"/);
  const day = view.slice(view.indexOf("export function DayTimeline"));
  assert.equal(day.includes("sendJson"), false);
  assert.match(day, /groupDays/);
  assert.match(day, /findDay/);
  assert.match(view, /crmv3-risk-thresholds/);
  assert.match(view, /crmv3-risk-notes/);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/risk.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "risk"/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round44 tests passed");
}

main();
