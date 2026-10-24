/**
 * Trader detail scopes, picker rows, and masked grid money.
 * Run: npx tsx tests/round12.test.ts
 */
import assert from "node:assert/strict";
import { displayCrmMoney } from "../src/lib/security/mask";
import {
  serializeTraderPickerRow,
  traderDetailScope,
  wantTraderPicker,
  TRADER_PICKER_SELECT,
} from "../src/lib/trader-list";

function main() {
  assert.equal(traderDetailScope(null), "full");
  assert.equal(traderDetailScope("positions"), "positions");
  assert.equal(traderDetailScope("finance"), "finance");
  assert.equal(traderDetailScope("notes"), "full");
  assert.equal(wantTraderPicker("picker"), true);
  assert.equal(wantTraderPicker("table"), false);

  const row = serializeTraderPickerRow({
    id: "u1",
    name: "Ada",
    email: "a@b.co",
    accountLoginId: "123",
    role: "TRADER",
    address: "secret",
    passwordHash: "nope",
    account: { balance: 10, currency: "EUR", margin: 99, freeMargin: 4, id: "acc" },
  });
  assert.equal(row.balance, 10);
  assert.equal(row.currency, "EUR");
  assert.equal(row.accountLoginId, "123");
  assert.equal("address" in row, false);
  assert.equal("passwordHash" in row, false);
  assert.equal("margin" in row, false);
  assert.equal("tradingAccountId" in row, false);

  const empty = serializeTraderPickerRow({ id: "u2", name: "No", email: "c@d.co", account: null });
  assert.equal(empty.balance, 0);
  assert.equal(empty.currency, "USD");
  assert.equal(empty.role, "TRADER");

  const keys = Object.keys(TRADER_PICKER_SELECT);
  assert.equal(keys.includes("passwordHash"), false);
  assert.equal(keys.includes("address"), false);
  assert.equal(keys.includes("phone"), false);
  assert.deepEqual(keys.sort(), ["account", "accountLoginId", "email", "id", "name", "role"]);

  assert.equal(displayCrmMoney(null), "••••");
  assert.equal(displayCrmMoney(undefined), "••••");
  assert.equal(displayCrmMoney(12.5, "USD"), "$12.50");
  assert.equal(displayCrmMoney(10, "not-a-code"), "$10.00");

  console.log("round12 tests passed");
}

main();
