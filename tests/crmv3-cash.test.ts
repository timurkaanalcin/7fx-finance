/**
 * CRM v3 statement and currency desk. Display math only.
 * Run: npx tsx tests/crmv3-cash.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalShare, methodStats, noteSummary } from "../src/lib/crmv3/statement";
import { convert, currencyMix, largestCurrency, withMids } from "../src/lib/crmv3/fx";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const pairs = withMids([
    { symbol: "USDTRY", mid: 40 },
    { symbol: "EURUSD", bid: 1.1 },
    { symbol: "GBPUSD", mid: 1.25 },
  ]);
  assert.equal(pairs.find((row) => row.code === "JPY")?.mid, null);
  assert.equal(convert(1, "USD", "TRY", pairs), 40);
  assert.equal(convert(10, "EUR", "USD", pairs), 11);
  assert.equal(convert(100, "USD", "JPY", pairs), null);
  assert.equal(convert(5, "USD", "USD", pairs), 5);

  const mix = currencyMix([{ currency: "TRY", amount: 10 }, { currency: "USD", amount: 40 }, { currency: "USD", amount: 5 }]);
  assert.equal(largestCurrency(mix), "USD");
  assert.equal(mix.find((row) => row.currency === "USD")?.count, 2);

  const methods = methodStats([
    { method: "Wire", amount: 100, currency: "USD", status: "APPROVED", createdAt: new Date().toISOString() },
    { method: "Wire", amount: 50, currency: "TRY", status: "PENDING", createdAt: new Date().toISOString() },
  ]);
  assert.equal(methods[0].method, "Wire");
  assert.equal(methods[0].count, 2);
  assert.equal(methods[0].pending, 1);
  assert.equal(approvalShare(1, 2), 50);
  assert.equal(noteSummary([{ body: "older", createdAt: "2020-01-01" }, { body: "newer", createdAt: "2024-01-01" }]).latest, "newer");

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /data-print="statement"/);
  assert.equal(css.includes("overflow-x: auto"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/statement.tsx"), "utf8");
  assert.match(app, /crmv3-call-log/);
  assert.equal(app.includes("crmv4-"), false);

  console.log("crmv3 cash tests passed");
}

main();
