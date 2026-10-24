/**
 * Round 23: summary headline sums every account, and the remaining silent
 * lists report a further page.
 * Run: npx tsx tests/round23.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { headlineFromAggregate, sumStoredAccountFields } from "../src/lib/account-totals";
import { PUBLIC_DEFAULT_LOCALE } from "../src/lib/i18n/locales";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");

  const fixtures = [];
  for (let i = 0; i < 120; i++) {
    fixtures.push({ balance: i + 1, equity: i * 2, margin: i % 3 });
  }
  const fullBalance = (120 * 121) / 2;
  let fullEquity = 0;
  let fullMargin = 0;
  for (let i = 0; i < fixtures.length; i++) {
    fullEquity += fixtures[i].equity;
    fullMargin += fixtures[i].margin;
  }
  const full = { balance: fullBalance, equity: fullEquity, margin: fullMargin };
  assert.deepEqual(sumStoredAccountFields(fixtures), full);
  assert.deepEqual(headlineFromAggregate(full), full);
  assert.deepEqual(headlineFromAggregate(null), { balance: 0, equity: 0, margin: 0 });
  assert.deepEqual(headlineFromAggregate({ balance: null, equity: null, margin: null }), {
    balance: 0,
    equity: 0,
    margin: 0,
  });

  const byBalance = fixtures.slice().sort((a, b) => b.balance - a.balance);
  const top100 = sumStoredAccountFields(byBalance.slice(0, 100));
  assert.notEqual(top100.balance, full.balance);
  assert.notEqual(top100.equity, full.equity);
  assert.ok(full.balance - top100.balance > 0);

  const withGaps = [
    { balance: 10, equity: null, margin: 1 },
    { balance: null, equity: 4, margin: 2 },
  ];
  assert.deepEqual(sumStoredAccountFields(withGaps), { balance: 10, equity: 4, margin: 3 });
  assert.deepEqual(headlineFromAggregate(sumStoredAccountFields(withGaps)), { balance: 10, equity: 4, margin: 3 });

  const summary = read("src/app/api/admin/summary/route.ts");
  assert.match(summary, /prisma\.account\.aggregate/);
  assert.match(summary, /_sum:\s*\{\s*balance:\s*true,\s*equity:\s*true,\s*margin:\s*true\s*\}/);
  assert.match(summary, /headlineFromAggregate/);
  assert.equal(summary.includes("accounts.reduce"), false);
  assert.match(summary, /accountsPartial/);

  const notes = read("src/app/api/notifications/route.ts");
  assert.match(notes, /hasMore/);
  assert.match(notes, /take:\s*take\s*\+\s*1/);
  assert.equal(/findMany\([\s\S]*?take:\s*30/.test(notes), false);
  const bell = read("src/components/notifications/NotificationBell.tsx");
  assert.match(bell, /load\("more"\)/);

  for (const rel of ["src/app/api/deposit/route.ts", "src/app/api/withdraw/route.ts", "src/app/api/balance-requests/route.ts"]) {
    const src = read(rel);
    assert.match(src, /crmPageWindow/, rel);
    assert.match(src, /hasMore/, rel);
    assert.match(src, /take:\s*page\.take\s*\+\s*1/, rel);
    assert.equal(/take:\s*50\b/.test(src), false, rel);
  }
  assert.match(read("src/app/api/balance-requests/route.ts"), /pending/);
  assert.match(read("src/app/(terminal)/profile/page.tsx"), /loadWithdrawals\("more"\)/);
  assert.match(read("src/components/trading/DepositModal.tsx"), /loadHistory\("more"\)/);

  const docs = read("src/app/api/admin/documents/route.ts");
  assert.match(docs, /pendingUsersPartial/);
  assert.match(docs, /lookup"\) === "pending"/);
  assert.equal(docs.includes("take: 100"), false);
  assert.match(read("src/app/(admin)/izcrm/documents/page.tsx"), /pendingQ/);

  const users = read("src/app/api/admin/users/route.ts");
  assert.match(users, /desksPartial/);
  assert.match(users, /lookup"\) === "desks"/);
  assert.equal(users.includes("take: 100"), false);
  assert.equal(users.includes("take: 200"), false);
  assert.match(read("src/app/(admin)/izcrm/traders/page.tsx"), /deskQ/);

  console.log("round23 tests passed");
}

main();
