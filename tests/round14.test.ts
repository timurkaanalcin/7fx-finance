/**
 * Positions rows, exposure totals, chat pages, desk-free worker login, and save scopes.
 * Run: npx tsx tests/round14.test.ts
 */
import assert from "node:assert/strict";
import {
  CHAT_THREAD_CAP,
  CHAT_THREAD_PAGE,
  chatThreadWindow,
  exposureFromPositionGroups,
  serializeOrderListRow,
  serializePositionListRow,
  traderDetailScopeForEntity,
  workerLastLogin,
} from "../src/lib/trader-list";

function main() {
  assert.equal(traderDetailScopeForEntity("communication"), "comms");
  assert.equal(traderDetailScopeForEntity("deposit"), "tickets");
  assert.equal(traderDetailScopeForEntity("withdrawal"), "tickets");
  assert.equal(traderDetailScopeForEntity("balanceRequest"), "tickets");
  assert.equal(traderDetailScopeForEntity("ledger"), "ledger");
  assert.equal(traderDetailScopeForEntity("document"), "documents");
  assert.equal(traderDetailScopeForEntity("reminder"), "reminders");
  assert.equal(traderDetailScopeForEntity("note"), "profile");
  assert.equal(traderDetailScopeForEntity("position"), "positions");
  assert.equal(traderDetailScopeForEntity("order"), "positions");
  assert.equal(traderDetailScopeForEntity("other"), "full");

  assert.deepEqual(chatThreadWindow(null, null), { take: CHAT_THREAD_PAGE, skip: 0 });
  assert.deepEqual(chatThreadWindow("100", "5"), { take: CHAT_THREAD_CAP, skip: 5 });
  assert.equal(chatThreadWindow("0", "-1").take, CHAT_THREAD_PAGE);

  const exposure = exposureFromPositionGroups([
    { symbol: "eurusd", side: "BUY", volume: 1.5, profit: 10, count: 2 },
    { symbol: "EURUSD", side: "SELL", volume: 0.5, profit: -4, count: 1 },
    { symbol: "XAUUSD", side: "BUY", volume: 0.2, profit: 3, count: 1 },
  ]);
  assert.equal(exposure[0].symbol, "EURUSD");
  assert.equal(exposure[0].buy, 1.5);
  assert.equal(exposure[0].sell, 0.5);
  assert.equal(exposure[0].count, 3);
  assert.equal(exposure[0].pnl, 6);
  assert.equal(exposure[1].symbol, "XAUUSD");

  const position = serializePositionListRow({
    id: "p1",
    userId: "u1",
    symbol: "EURUSD",
    chartSymbol: null,
    side: "BUY",
    volume: 1,
    openPrice: 1.1,
    currentPrice: 1.2,
    stopLoss: null,
    takeProfit: null,
    profit: 10,
    margin: 100,
    status: "OPEN",
    openedAt: "2026-01-01T00:00:00.000Z",
    closedAt: null,
    closePrice: null,
    closeProfit: null,
    user: {
      id: "u1",
      name: "Ada",
      email: "a@b.co",
      brokerName: "7FX",
      desk: "Istanbul",
      account: { id: "acc1" },
    },
  });
  assert.equal(position.traderName, "Ada");
  assert.equal(position.tradingAccountId, "acc1");
  assert.equal("balance" in position, false);
  assert.equal("balance" in position.user, false);
  assert.equal(position.user.name, "Ada");

  const order = serializeOrderListRow({
    id: "o1",
    userId: "u1",
    symbol: "EURUSD",
    side: "SELL",
    type: "LIMIT",
    volume: 0.2,
    price: 1.2,
    openPrice: null,
    stopLoss: null,
    takeProfit: null,
    status: "PENDING",
    filledAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    positionId: null,
    user: { id: "u1", name: "Ada", email: "a@b.co", brokerName: null },
  });
  assert.equal(order.traderName, "Ada");
  assert.equal("passwordHash" in order, false);

  const login = workerLastLogin({
    lastLoginAt: new Date("2026-02-01T00:00:00.000Z"),
    lastIp: "1.2.3.4",
    lastCity: "Istanbul",
    lastRegion: "34",
    lastCountry: "TR",
    lastCountryName: "Turkey",
    lastDevice: "desktop",
    lastBrowser: "Chrome",
    lastOs: "Windows",
  });
  assert.equal(login?.at, "2026-02-01T00:00:00.000Z");
  assert.equal(login?.browser, "Chrome");
  assert.equal(login?.os, "Windows");
  assert.equal(login?.method, null);
  assert.equal(
    workerLastLogin({
      lastLoginAt: null,
      lastIp: null,
      lastCity: null,
      lastRegion: null,
      lastCountry: null,
      lastCountryName: null,
      lastDevice: null,
      lastBrowser: null,
      lastOs: null,
    }),
    null
  );

  console.log("round14 tests passed");
}

main();
