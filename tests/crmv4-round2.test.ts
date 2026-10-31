/**
 * CRM v4 round 2 helpers.
 * Run: npx tsx tests/crmv4-round2.test.ts
 */
import assert from "node:assert/strict";
import { cohortsOf, detailPairs, duplicateGroups, fillTemplate, funnelOf, inRange, leaderboardOf, moveWidget, presetRange, roundRobin, sumAmounts } from "../src/lib/crmv4/round2";

function main() {
  const today = presetRange("today", new Date("2026-10-30T12:00:00Z"));
  assert.equal(today.from <= "2026-10-30" && today.to >= "2026-10-30", true);
  assert.equal(inRange("2026-10-15T00:00:00Z", "2026-10-01", "2026-10-20"), true);
  assert.equal(inRange("2026-09-01", "2026-10-01", "2026-10-20"), false);
  assert.equal(sumAmounts([{ amount: 10, createdAt: "2026-10-02" }, { amount: 5, createdAt: "2026-09-01" }], "2026-10-01", "2026-10-31"), 10);

  const people = [
    { id: "1", ftd: true, balance: 20, active: true, createdAt: "2026-01-02", assigneeName: "Ada", email: "a@x.test", phone: "+90 555 000 11 22" },
    { id: "2", ftd: false, balance: 0, active: false, createdAt: "2026-01-03", assigneeName: "Ada", email: "a@x.test", phone: "5550001122" },
    { id: "3", ftd: true, balance: 0, active: true, createdAt: "2026-02-01", assigneeName: "Leo", email: "b@x.test" },
  ];
  assert.deepEqual(funnelOf(people), { leads: 3, ftd: 2, redeposit: 1 });
  assert.equal(cohortsOf(people).find((row) => row.month === "2026-01")?.joined, 2);
  assert.equal(leaderboardOf(people)[0].name, "Ada");
  assert.deepEqual(roundRobin(["a", "b", "c"], ["North", "South"]), [
    { id: "a", desk: "North" },
    { id: "b", desk: "South" },
    { id: "c", desk: "North" },
  ]);
  const dups = duplicateGroups(people);
  assert.equal(dups.some((row) => row.kind === "email" && row.ids.length === 2), true);
  assert.equal(dups.some((row) => row.kind === "phone"), true);
  assert.equal(detailPairs('{"note":"ok"}')[0].value, "ok");
  assert.equal(fillTemplate("Hello {{ name }}", { name: "Ada" }), "Hello Ada");
  assert.deepEqual(moveWidget(["funnel", "cohort"], "cohort", -1), ["cohort", "funnel"]);
  console.log("crmv4 round2 tests passed");
}

main();
