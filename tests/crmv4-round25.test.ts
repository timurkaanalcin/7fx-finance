/**
 * CRM v4 round 25 helpers.
 * Run: npx tsx tests/crmv4-round25.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND25_COPY } from "../src/lib/crmv4/copy-round25";
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
} from "../src/lib/crmv4/round25";

function main() {
  const now = new Date("2026-10-31T12:00:00Z");
  assert.equal(monthStamp(now), "2026-10");
  assert.deepEqual(monthSpan(now), { day: 31, days: 31 });
  const cash = [
    { createdAt: "2026-10-01T00:00:00Z", amount: 10, currency: "USD", user: { id: "a" } },
    { createdAt: "2026-10-20T00:00:00Z", amount: 5, currency: "usd", user: { id: "a" } },
    { createdAt: "2026-09-01T00:00:00Z", amount: 99, currency: "USD", user: { id: "b" } },
    { createdAt: "2026-10-05T00:00:00Z", amount: 400, currency: "TRY", user: { id: "b" } },
    { createdAt: "2026-10-28T00:00:00Z", amount: 250, currency: "USD", user: { id: "c" } },
  ];
  const totals = mtdByCurrency(cash, "2026-10");
  assert.deepEqual(totals, [
    { currency: "TRY", amount: 400 },
    { currency: "USD", amount: 265 },
  ]);
  assert.equal(totals.some((row) => row.currency === "USDTRY"), false);
  assert.equal(mtdFtd(cash, "2026-10"), 2);
  assert.equal(mtdTraders([
    { userId: "a", openedAt: "2026-10-02T00:00:00Z" },
    { userId: "a", openedAt: "2026-10-03T00:00:00Z" },
    { userId: "b", openedAt: "2026-09-02T00:00:00Z" },
  ], "2026-10"), 1);
  assert.equal(runRate(10, 15, 30), 20);
  assert.equal(runRate(2050, 31, 31), 2050);
  assert.equal(paceOf(20, 10, 31, 31), "ahead");
  assert.equal(paceOf(2, 10, 31, 31), "behind");
  assert.equal(paceOf(5, 0, 31, 31), "none");
  assert.equal(progressPct(5, 0), null);
  assert.equal(stillToGo(250, 1000), 750);
  assert.deepEqual(readTargets({ ftd: 3, traders: "4", deposits: { usd: 10, TRY: -1 } }), { ftd: 3, traders: 4, deposits: { USD: 10 } });
  const history = pushItem([], { kind: "customer", id: "a", title: "Ada", href: "/crmv4/customers/a" }, "2026-10-31T00:00:00Z");
  const again = pushItem(history, { kind: "customer", id: "a", title: "Ada Lane", href: "/crmv4/customers/a" }, "2026-10-31T01:00:00Z");
  assert.equal(again.length, 1);
  assert.equal(again[0].title, "Ada Lane");
  const keys = Object.keys(ROUND25_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND25_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-goals-luxe/);
  assert.match(css, /\.c4-trail-luxe/);
  assert.match(css, /scroll-snap-type:\s*x mandatory/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round25.tsx"), "utf8");
  assert.match(page, /crmv4-month-targets/);
  assert.match(page, /crmv4-view-history/);
  assert.match(page, /goalEstimate/);
  assert.equal(page.includes("password"), false);
  console.log("crmv4 round25 tests passed");
}

main();
