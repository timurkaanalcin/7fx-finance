/**
 * CRM v4 round 18 helpers.
 * Run: npx tsx tests/crmv4-round18.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  behindTarget,
  buildBoard,
  callCounts,
  callPace,
  fundedShare,
  gapTo,
  hideIdle,
  progressTo,
  rankBoard,
  searchBoard,
} from "../src/lib/crmv4/round18";

function main() {
  const board = buildBoard({
    workers: [{ id: "w1", name: "Ada" }, { id: "w2", name: "Ken" }],
    customers: [
      { id: "c1", assigneeName: "Ada", ftd: true },
      { id: "c2", assigneeName: "Ada", ftd: false },
      { id: "c3", assigneeName: "Ken", ftd: true },
    ],
    calls: { c1: 2, c2: 1 },
    ticketNames: ["Ada", "Ada", "Sam"],
  });
  const ada = board.find((row) => row.id === "w1");
  assert.equal(ada?.assigned, 2);
  assert.equal(ada?.funded, 1);
  assert.equal(ada?.calls, 3);
  assert.equal(ada?.tickets, 2);
  const extra = buildBoard({
    workers: [{ id: "w1", name: "Ada" }],
    customers: [{ id: "c9", assigneeName: "Noor", ftd: true }],
    calls: { c9: 1 },
    ticketNames: ["Noor"],
  });
  const noor = extra.find((row) => row.name === "Noor");
  assert.equal(extra.length, 2);
  assert.equal(noor?.assigned, 1);
  assert.equal(noor?.calls, 1);
  assert.equal(noor?.tickets, 1);
  assert.equal(rankBoard(board, "calls", true)[0].id, "w1");
  assert.equal(searchBoard(board, "ken").length, 1);
  assert.equal(hideIdle([{ id: "x", name: "X", assigned: 0, funded: 0, calls: 0, tickets: 0 }], true).length, 0);
  assert.equal(behindTarget(board, { w1: { assigned: 5, funded: 0, calls: 0, tickets: 0 } }, "assigned", true).length, 1);
  assert.equal(progressTo(1, 4), 25);
  assert.equal(progressTo(1, 0), null);
  assert.equal(gapTo(1, 4), 3);
  assert.equal(callPace({ id: "w1", name: "Ada", assigned: 2, funded: 1, calls: 3, tickets: 0 }), 1.5);
  assert.equal(fundedShare({ id: "w1", name: "Ada", assigned: 2, funded: 1, calls: 0, tickets: 0 }), 50);
  assert.deepEqual(callCounts({ a: [{}, {}], b: [] }), { a: 2, b: 0 });
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-perf-luxe/);
  assert.match(css, /\.c4-foot-luxe/);
  assert.match(css, /\.c4-help-luxe/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round18 tests passed");
}

main();
