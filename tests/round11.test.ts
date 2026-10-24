/**
 * Traders table column shape. Run: npx tsx tests/round11.test.ts
 */
import assert from "node:assert/strict";
import { serializeTraderTableRow, TRADER_TABLE_SELECT, wantTraderTable } from "../src/lib/trader-list";

function main() {
  assert.equal(wantTraderTable("table"), true);
  assert.equal(wantTraderTable(null), false);
  assert.equal(wantTraderTable("1"), false);

  const row = serializeTraderTableRow({
    id: "u1",
    email: "a@b.co",
    accountLoginId: "123",
    name: "Ada",
    role: "TRADER",
    active: true,
    tradingEnabled: false,
    phone: "+1",
    country: "TR",
    accountType: "STANDARD",
    desk: "Istanbul",
    saleStatus: "NEW",
    retentionStatus: "ACTIVE",
    brokerName: "B",
    assigneeName: "C",
    retentionNote: "n",
    ftd: true,
    lastLoginAt: new Date("2026-01-02T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    retentionFollowUpAt: new Date("2026-01-03T00:00:00.000Z"),
    lastContactAt: new Date("2026-01-04T00:00:00.000Z"),
    lastSeenAt: new Date("2026-01-05T00:00:00.000Z"),
    lastIp: "1.1.1.1",
    lastCountry: "TR",
    lastCountryName: "Turkey",
    lastCity: "Istanbul",
    address: "secret street",
    username: "ada",
    passwordHash: "nope",
    account: {
      id: "acc",
      balance: 10,
      equity: 12,
      credit: 1,
      bonus: 2,
      currency: "USD",
      margin: 99,
      freeMargin: 88,
      leverage: 100,
    },
  });

  assert.equal(row.tradingAccountId, "acc");
  assert.equal(row.balance, 10);
  assert.equal(row.equity, 12);
  assert.equal(row.credit, 1);
  assert.equal(row.bonus, 2);
  assert.equal(row.currency, "USD");
  assert.equal(row.tradingEnabled, false);
  assert.equal(row.ftd, true);
  assert.equal(row.lastLoginAt, "2026-01-02T00:00:00.000Z");
  assert.equal(row.createdAt, "2026-01-01T00:00:00.000Z");
  assert.equal(row.retentionFollowUpAt, "2026-01-03T00:00:00.000Z");
  assert.equal(row.lastContactAt, "2026-01-04T00:00:00.000Z");
  assert.equal(row.lastSeenAt, "2026-01-05T00:00:00.000Z");
  assert.equal(row.lastIp, "1.1.1.1");
  assert.equal("margin" in row, false);
  assert.equal("freeMargin" in row, false);
  assert.equal("address" in row, false);
  assert.equal("passwordHash" in row, false);
  assert.equal("username" in row, false);
  assert.equal("leverage" in row, false);

  const empty = serializeTraderTableRow({
    id: "u2",
    email: "c@d.co",
    name: "No",
    role: "TRADER",
    account: null,
  });
  assert.equal(empty.balance, 0);
  assert.equal(empty.equity, 0);
  assert.equal(empty.tradingAccountId, null);
  assert.equal(empty.currency, "USD");
  assert.equal(empty.accountType, "STANDARD");
  assert.equal(empty.active, true);
  assert.equal(empty.lastSeenAt, null);

  const keys = Object.keys(TRADER_TABLE_SELECT);
  assert.equal(keys.includes("passwordHash"), false);
  assert.equal(keys.includes("address"), false);
  assert.equal(keys.includes("username"), false);
  assert.equal(keys.includes("email"), true);
  assert.equal(keys.includes("ftd"), true);
  assert.equal(keys.includes("account"), true);

  console.log("round11 tests passed");
}

main();
