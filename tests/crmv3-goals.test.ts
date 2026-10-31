/**
 * CRM v3 monthly goals and recent trail. Targets stay in the browser.
 * Run: npx tsx tests/crmv3-goals.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { methodName } from "../src/lib/crmv3/bridge";
import {
  monthSpan,
  monthStamp,
  mtdByCurrency,
  mtdFtd,
  mtdTraders,
  paceOf,
  progressPct,
  pushItem,
  readTargets,
  runRate,
  stillToGo,
} from "../src/lib/crmv3/goals";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const now = new Date("2026-10-31T12:00:00.000Z");
  assert.equal(monthStamp(now), "2026-10");
  assert.deepEqual(monthSpan(now), { day: 31, days: 31 });

  const rows = [
    { createdAt: "2026-10-02T00:00:00.000Z", amount: 10, currency: "usd", userId: "a" },
    { createdAt: "2026-10-20T00:00:00.000Z", amount: 5, currency: "TRY", userId: "a" },
    { createdAt: "2026-09-01T00:00:00.000Z", amount: 99, currency: "USD", userId: "b" },
    { createdAt: "2026-10-03T00:00:00.000Z", amount: 7, currency: "USD", user: { id: "b" } },
  ];
  const mix = mtdByCurrency(rows, "2026-10");
  assert.deepEqual(mix, [
    { currency: "TRY", amount: 5 },
    { currency: "USD", amount: 17 },
  ]);
  assert.equal(mtdFtd(rows, "2026-10"), 1);
  assert.equal(mtdTraders([
    { userId: "a", openedAt: "2026-10-04" },
    { userId: "a", openedAt: "2026-10-05" },
    { userId: "b", openedAt: "2026-09-01" },
  ], "2026-10"), 1);

  assert.equal(runRate(10, 10, 30), 30);
  assert.equal(runRate(10, 0, 30), null);
  assert.equal(paceOf(20, 30, 10, 30), "ahead");
  assert.equal(paceOf(5, 30, 10, 30), "behind");
  assert.equal(paceOf(10, 0, 10, 30), "none");
  assert.equal(progressPct(15, 30), 50);
  assert.equal(progressPct(15, 0), null);
  assert.equal(stillToGo(15, 30), 15);
  assert.equal(stillToGo(40, 30), -10);

  const saved = pushItem([], { kind: "customer", id: "a", title: "Ada", href: "/crmv3/customers/a" }, "2026-10-31T00:00:00.000Z");
  const again = pushItem(saved, { kind: "customer", id: "a", title: "Ada", href: "/crmv3/customers/a" }, "2026-10-31T01:00:00.000Z");
  assert.equal(again.length, 1);
  assert.equal(again[0].at, "2026-10-31T01:00:00.000Z");
  assert.deepEqual(readTargets({ ftd: 4, traders: -2, deposits: { usd: 10, bad: "x" } }), {
    ftd: 4,
    traders: 0,
    deposits: { USD: 10 },
  });

  assert.equal(methodName({ label: "TRY Bank" }), "TRY Bank");
  assert.equal(methodName("BANK"), "BANK");
  assert.equal(methodName(null), "—");

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-goal-grid/);
  assert.equal(css.includes("overflow-x: auto"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/goals.tsx"), "utf8");
  assert.match(page, /crmv3-month-targets/);
  assert.match(page, /crmv3-view-history/);
  assert.equal(page.includes("crmv4-"), false);
  const finance = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Finance.tsx"), "utf8");
  assert.match(finance, /methodName\(row\.method\)/);

  console.log("crmv3 goals tests passed");
}

main();
