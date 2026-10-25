/**
 * Deposit and withdrawal queue search, sort, paging, money format, and CSV.
 * Approve and reject stay on the existing POST handlers.
 * Run: npx tsx tests/crm-money-queue.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  formatQueueMoney,
  moneyQueueCsv,
  moneyQueueOrderBy,
  moneyQueueRange,
  moneyQueueSearchString,
  moneyQueueStatus,
  moneyQueueTextWhere,
  nextMoneySort,
  parseMoneyQueueQuery,
  type QueueCsvRow,
} from "../src/lib/crm-money-queue";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

function orKeys(where: { OR?: object[] } | null): string[] {
  return (where?.OR || []).map((row) => Object.keys(row)[0] || "");
}

function main() {
  const deposit = moneyQueueTextWhere("deposit", " 7803 ");
  assert.ok(deposit);
  assert.deepEqual(orKeys(deposit).sort(), ["method", "note", "user"]);
  const depositMethod = (deposit.OR as { method?: { OR?: object[] } }[]).find((row) => row.method);
  assert.deepEqual(orKeys(depositMethod?.method || null).sort(), ["label", "type"]);
  const depositUser = (deposit.OR as { user?: { OR?: object[] } }[]).find((row) => row.user);
  assert.ok(orKeys(depositUser?.user || null).includes("accountLoginId"));
  assert.ok(orKeys(depositUser?.user || null).includes("email"));
  assert.ok(orKeys(depositUser?.user || null).includes("name"));

  const withdrawal = moneyQueueTextWhere("withdrawal", "bank");
  assert.ok(withdrawal);
  assert.deepEqual(orKeys(withdrawal).sort(), ["method", "note", "user"]);
  const withdrawalMethod = (withdrawal.OR as { method?: { contains?: string } }[]).find((row) => row.method);
  assert.equal(withdrawalMethod?.method?.contains, "bank");
  assert.equal(moneyQueueTextWhere("deposit", "   "), null);
  const long = moneyQueueTextWhere("withdrawal", "x".repeat(200));
  const longNote = (long?.OR as { note?: { contains?: string } }[] | undefined)?.find((row) => row.note);
  assert.equal(longNote?.note?.contains?.length, 80);

  assert.equal(moneyQueueStatus("all"), null);
  assert.equal(moneyQueueStatus(""), null);
  assert.equal(moneyQueueStatus("DROP"), null);
  assert.equal(moneyQueueStatus(" pending "), "PENDING");
  assert.equal(moneyQueueStatus("APPROVED"), "APPROVED");

  assert.deepEqual(moneyQueueOrderBy("not-a-sort"), [{ createdAt: "desc" }]);
  assert.deepEqual(moneyQueueOrderBy(""), [{ createdAt: "desc" }]);
  assert.deepEqual(moneyQueueOrderBy("amount_desc"), [{ amount: "desc" }, { createdAt: "desc" }]);
  assert.deepEqual(moneyQueueOrderBy("name_asc")[0], { user: { name: "asc" } });
  assert.equal(nextMoneySort("", "created"), "created_asc");
  assert.equal(nextMoneySort("created_desc", "created"), "created_asc");
  assert.equal(nextMoneySort("created_asc", "created"), "created_desc");
  assert.equal(nextMoneySort("", "name"), "name_asc");
  assert.equal(nextMoneySort("", "amount"), "amount_desc");

  const pending = { q: "", status: "PENDING", sort: "", page: 1, take: 50 };
  assert.equal(moneyQueueSearchString(pending), "");
  assert.equal(moneyQueueSearchString({ ...pending, status: "ALL", page: 2 }), "status=ALL&page=2");
  assert.equal(moneyQueueSearchString({ ...pending, take: 25 }), "take=25");
  const filters = { q: "mehmet", status: "APPROVED", sort: "amount_desc", page: 3, take: 50 };
  const roundTrip = parseMoneyQueueQuery(`?${moneyQueueSearchString(filters)}`);
  assert.deepEqual(roundTrip, filters);
  assert.equal(parseMoneyQueueQuery("?status=DROP&sort=drop-table&page=-4").status, "PENDING");
  assert.equal(parseMoneyQueueQuery("?status=DROP&sort=drop-table&page=-4").sort, "");
  assert.equal(parseMoneyQueueQuery("?status=DROP&sort=drop-table&page=-4").page, 1);
  assert.equal(parseMoneyQueueQuery("?status=ALL").status, "ALL");

  assert.deepEqual(moneyQueueRange(2, 0), { from: 0, to: 0 });
  assert.deepEqual(moneyQueueRange(1, 3), { from: 1, to: 3 });
  assert.deepEqual(moneyQueueRange(2, 10), { from: 51, to: 60 });

  const trUsd = formatQueueMoney(1250.5, "USD", "tr-TR");
  assert.notEqual(trUsd, "1250.5");
  assert.match(trUsd, /1\.250,50|1,250\.50/);
  const enTry = formatQueueMoney(1500, "TRY", "en-US");
  assert.match(enTry, /1,500\.00/);
  assert.match(enTry, /TRY|₺/);
  assert.equal(formatQueueMoney(Number.NaN, "USD", "en"), "—");

  const row: QueueCsvRow = {
    createdAt: "2026-10-24T00:00:00.000Z",
    name: "Demo Trader",
    email: "trader@deskflow.local",
    accountLoginId: "7803216786542631",
    method: "IBAN",
    amount: 1250.5,
    currency: "USD",
    note: "Wire, personal",
    status: "PENDING",
  };
  const csv = moneyQueueCsv([row]);
  assert.match(csv, /^createdAt,name,email,accountId,method,amount,currency,note,status/);
  assert.match(csv, /7803216786542631/);
  assert.match(csv, /"Wire, personal"/);
  assert.match(csv, /,1250\.50,USD,/);

  for (const rel of ["src/app/(admin)/izcrm/deposits/page.tsx", "src/app/(admin)/izcrm/withdrawals/page.tsx"]) {
    const src = read(rel);
    assert.match(src, /take: "50"/);
    assert.match(src, /JSON\.stringify\(\{ id, action \}\)/);
    assert.match(src, /className="fx-crm-table /);
    assert.match(src, /className="fx-crm-num /);
    assert.match(src, /LOCALE_META\[locale\]\.htmlLang/);
    assert.match(src, /data-fx-queue-status=/);
    assert.match(src, /data-fx-queue-sort=/);
    assert.equal(src.includes('toLocaleTimeString("tr-TR")'), false);
  }

  const chrome = read("src/components/crm/MoneyQueueChrome.tsx");
  assert.match(chrome, /data-fx-queue-pager/);
  assert.match(chrome, /data-fx-queue-search/);
  assert.match(chrome, /data-fx-queue-csv/);
  assert.match(chrome, /data-fx-queue-chip/);
  const hook = read("src/components/crm/use-money-queue.ts");
  assert.match(hook, /e\.key !== "\/"/);
  assert.match(hook, /history\.replaceState/);
  assert.match(hook, /deposits\.csv/);
  assert.match(hook, /withdrawals\.csv/);
  assert.equal(hook.includes('method: "POST"'), false);

  const deposits = read("src/app/api/admin/deposits/route.ts");
  const withdrawals = read("src/app/api/admin/withdrawals/route.ts");
  assert.match(deposits, /CRM_MONEY_LIST_LEGACY/);
  assert.match(withdrawals, /CRM_MONEY_LIST_LEGACY/);
  assert.match(deposits, /export async function POST/);
  assert.match(withdrawals, /export async function POST/);
  const depositPost = deposits.slice(deposits.indexOf("export async function POST"));
  const withdrawalPost = withdrawals.slice(withdrawals.indexOf("export async function POST"));
  assert.equal(depositPost.includes("moneyQueue"), false);
  assert.equal(withdrawalPost.includes("moneyQueue"), false);
  assert.match(depositPost, /convertAmountToUsd/);
  assert.match(withdrawalPost, /recordLedger/);
  assert.match(read("src/lib/i18n/dictionaries/crm-ui.ts"), /"crm\.queue\.csv"/);

  console.log("crm money queue tests passed");
}

main();
