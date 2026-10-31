/**
 * CRM v4 round 14 helpers.
 * Run: npx tsx tests/crmv4-round14.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ageHours,
  changedKeys,
  deskRanks,
  dueToday,
  isDormant,
  loginBucket,
  nextRecur,
  simulateAssign,
  slaLeft,
  snoozeUntil,
} from "../src/lib/crmv4/round14";

function main() {
  const morning = new Date("2026-10-31T08:00:00Z");
  assert.equal(nextRecur("day", 9, morning), "2026-10-31T09:00:00.000Z");
  assert.equal(nextRecur("day", 9, new Date("2026-10-31T10:00:00Z")), "2026-11-01T09:00:00.000Z");
  assert.equal(nextRecur("week", 9, new Date("2026-10-31T10:00:00Z")), "2026-11-07T09:00:00.000Z");
  assert.equal(dueToday([{ remindAt: "2026-10-31T12:00:00Z" }, { remindAt: "2026-10-30T12:00:00Z" }], new Date("2026-10-31T18:00:00Z")), 1);
  assert.equal(snoozeUntil("15m", new Date("2026-10-31T10:00:00Z")), "2026-10-31T10:15:00.000Z");
  assert.equal(snoozeUntil("tomorrow", new Date("2026-10-31T22:00:00Z")), "2026-11-01T09:00:00.000Z");
  const left = slaLeft("2026-10-31T10:00:00Z", 2, new Date("2026-10-31T11:00:00Z").getTime());
  assert.equal(left, 60);
  assert.equal(slaLeft("2026-10-31T10:00:00Z", 1, new Date("2026-10-31T12:00:00Z").getTime()), -60);
  assert.equal(loginBucket(null), "never");
  assert.equal(loginBucket(new Date(Date.now() - 2 * 86400000).toISOString()), "week");
  assert.equal(loginBucket(new Date(Date.now() - 30 * 86400000).toISOString()), "dormant");
  assert.equal(isDormant(new Date(Date.now() - 30 * 86400000).toISOString(), null), true);
  assert.equal(isDormant(new Date().toISOString(), null), false);
  assert.equal(simulateAssign({ country: "TR", desk: "Sale" }, [{ country: "tr", desk: "Retention" }]), "Retention");
  assert.equal(simulateAssign({ country: "DE", desk: "Sale" }, [{ country: "TR", desk: "Retention" }]), "Sale");
  const ranks = deskRanks([{ desk: "A", ftd: true, balance: 10 }, { desk: "A", ftd: false, balance: 5 }, { desk: "B", ftd: true, balance: 1 }]);
  assert.equal(ranks[0].desk, "A");
  assert.equal(ranks[0].ftd, 1);
  assert.deepEqual(changedKeys({ before: { name: "Ada" }, after: { name: "Ada Demir" } }), [{ key: "name", before: "Ada", after: "Ada Demir" }]);
  assert.equal(changedKeys({ note: "x" }).length, 0);
  assert.equal(ageHours("2026-10-31T08:00:00Z", new Date("2026-10-31T11:30:00Z").getTime()), 4);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-task-desk/);
  assert.match(css, /\.c4-sla-badge/);
  assert.match(css, /\.c4-empty-gold/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round14 tests passed");
}

main();
