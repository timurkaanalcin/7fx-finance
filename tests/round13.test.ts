/**
 * Trader-detail tab scopes, CRM list windows, and desk member rows.
 * Run: npx tsx tests/round13.test.ts
 */
import assert from "node:assert/strict";
import {
  CRM_LIST_LEGACY,
  CRM_LIST_PAGE,
  CRM_LIST_TAKE_CAP,
  crmListWindow,
  crmPageWindow,
  serializeDeskTrader,
  serializeDeskWorker,
  traderDetailScope,
  traderDetailScopeForTab,
} from "../src/lib/trader-list";

function main() {
  assert.equal(traderDetailScope(null), "full");
  assert.equal(traderDetailScope("notes"), "full");
  assert.equal(traderDetailScope("bogus"), "full");
  for (const scope of ["profile", "positions", "finance", "comms", "tickets", "ledger", "documents", "reminders"]) {
    assert.equal(traderDetailScope(scope), scope);
  }

  assert.equal(traderDetailScopeForTab("profil"), null);
  assert.equal(traderDetailScopeForTab("notlar"), null);
  assert.equal(traderDetailScopeForTab("izinler"), null);
  assert.equal(traderDetailScopeForTab("iletisim"), "comms");
  assert.equal(traderDetailScopeForTab("biletler"), "tickets");
  assert.equal(traderDetailScopeForTab("pozisyonlar"), "positions");
  assert.equal(traderDetailScopeForTab("ledger"), "ledger");
  assert.equal(traderDetailScopeForTab("bonus"), "ledger");
  assert.equal(traderDetailScopeForTab("belgeler"), "documents");
  assert.equal(traderDetailScopeForTab("takvim"), "reminders");
  assert.equal(traderDetailScopeForTab("finans"), "finance");

  assert.deepEqual(crmListWindow(null, null), { take: CRM_LIST_LEGACY, skip: 0, legacy: true });
  assert.deepEqual(crmListWindow("", "4"), { take: 300, skip: 4, legacy: true });
  assert.deepEqual(crmListWindow("50", "0"), { take: CRM_LIST_PAGE, skip: 0, legacy: false });
  assert.deepEqual(crmListWindow("500", "10"), { take: CRM_LIST_TAKE_CAP, skip: 10, legacy: false });
  assert.deepEqual(crmListWindow("0", "5"), { take: CRM_LIST_PAGE, skip: 5, legacy: false });
  assert.equal(crmListWindow("abc", "-3").take, CRM_LIST_PAGE);
  assert.equal(crmListWindow("abc", "-3").skip, 0);

  assert.deepEqual(crmPageWindow(null, "20"), { take: CRM_LIST_PAGE, skip: 20 });
  assert.deepEqual(crmPageWindow("80", null), { take: 80, skip: 0 });
  assert.deepEqual(crmPageWindow("1000", "-3"), { take: CRM_LIST_TAKE_CAP, skip: 0 });

  const trader = serializeDeskTrader({
    id: "t1",
    name: "Ada",
    account: { balance: 12.5, currency: "EUR" },
  });
  assert.deepEqual(trader, { id: "t1", name: "Ada", balance: 12.5, currency: "EUR" });
  assert.equal("email" in trader, false);
  assert.equal("margin" in trader, false);
  const empty = serializeDeskTrader({ id: "t2", name: "No", account: null });
  assert.equal(empty.balance, 0);
  assert.equal(empty.currency, "USD");

  const worker = serializeDeskWorker({ id: "w1", name: "Sam", email: "s@b.co" });
  assert.deepEqual(worker, { id: "w1", name: "Sam", email: "s@b.co" });
  assert.equal("balance" in worker, false);

  console.log("round13 tests passed");
}

main();
