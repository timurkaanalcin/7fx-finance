/**
 * Trader account statement: date range, stored amounts, per-currency running total.
 * Run: npx tsx tests/account-statement.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildStatement,
  inStatementRange,
  statementRangeInverted,
} from "../src/lib/account-statement";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

function main() {
  const local = new Date(2026, 9, 23, 15, 30, 0);
  assert.equal(inStatementRange(local.toISOString(), "2026-10-23", "2026-10-23"), true);
  assert.equal(inStatementRange(local.toISOString(), "2026-10-24", "2026-10-25"), false);
  assert.equal(inStatementRange(local.toISOString(), "", ""), true);
  assert.equal(statementRangeInverted("2026-10-24", "2026-10-01"), true);
  assert.equal(statementRangeInverted("", "2026-10-01"), false);

  const built = buildStatement({
    accountCurrency: "USD",
    from: "",
    to: "",
    trades: [
      {
        id: "t1",
        symbol: "EURUSD",
        side: "BUY",
        volume: 0.1,
        profit: 42.5,
        at: "2026-10-23T15:30:00.000Z",
      },
    ],
    cash: [
      {
        id: "d1",
        kind: "deposit",
        amount: 800,
        currency: "USD",
        status: "approved",
        at: "2026-10-21T09:00:00.000Z",
        label: "wire",
      },
      {
        id: "d2",
        kind: "deposit",
        amount: 1250.5,
        currency: "USD",
        status: "PENDING",
        at: "2026-10-24T23:12:00.000Z",
        label: "pending wire",
      },
      {
        id: "w1",
        kind: "withdrawal",
        amount: 400,
        currency: "USD",
        status: "PENDING",
        at: "2026-10-24T22:00:00.000Z",
        label: "bank",
      },
      {
        id: "w2",
        kind: "withdrawal",
        amount: 90.25,
        currency: "EUR",
        status: "APPROVED",
        at: "2026-10-22T12:00:00.000Z",
        label: "card",
      },
    ],
  });

  assert.deepEqual(
    built.lines.map((line) => [line.id, line.signed, line.included, line.running, line.currency]),
    [
      ["deposit:d1", 800, true, 800, "USD"],
      ["withdrawal:w2", -90.25, true, -90.25, "EUR"],
      ["trade:t1", 42.5, true, 842.5, "USD"],
      ["withdrawal:w1", -400, false, null, "USD"],
      ["deposit:d2", 1250.5, false, null, "USD"],
    ]
  );
  assert.deepEqual(built.totals, [
    { currency: "EUR", total: -90.25 },
    { currency: "USD", total: 842.5 },
  ]);
  assert.deepEqual(buildStatement({ trades: [], cash: [], accountCurrency: "USD", from: "2026-10-10", to: "2026-10-01" }), {
    lines: [],
    totals: [],
  });

  const lib = read("src/lib/account-statement.ts");
  const view = read("src/components/trading/AccountStatement.tsx");
  const blotter = read("src/components/trading/BottomPanels.tsx");
  assert.equal(lib.includes("recordLedger"), false);
  assert.equal(lib.includes("convertAmountToUsd"), false);
  assert.equal(view.includes("recordLedger"), false);
  assert.equal(view.includes("convertAmountToUsd"), false);
  assert.match(view, /@media print/);
  assert.match(view, /data-fx-stmt-from/);
  assert.match(view, /data-fx-stmt-print/);
  assert.match(view, /data-fx-stmt-running/);
  assert.match(view, /\/api\/deposit/);
  assert.match(view, /\/api\/withdraw/);
  assert.equal(view.includes('method: "POST"'), false);
  assert.match(blotter, /data-fx-statement/);
  const en = read("src/lib/i18n/dictionaries/en.ts");
  const tr = read("src/lib/i18n/dictionaries/tr.ts");
  assert.match(en, /"term\.stmt\.print": "Print"/);
  assert.match(tr, /"term\.stmt\.print": "Yazdır"/);
  assert.match(tr, /"term\.stmt\.running": "Yürüyen toplam"/);
  assert.match(en, /does not recalculate balance/);

  console.log("account statement tests passed");
}

main();
