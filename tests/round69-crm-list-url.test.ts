/**
 * CRM list URL parsers. They do not fetch and they drop unknown sort, page, and page-size values.
 * Run: npx tsx tests/round69-crm-list-url.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  chatListSearchString,
  clipListPage,
  clipListTake,
  ledgerListSearchString,
  listPageRange,
  listPageSkip,
  parseChatListQuery,
  parseLedgerListQuery,
  parsePositionListQuery,
  parseTicketListQuery,
  positionListSearchString,
  ticketListSearchString,
  CRM_LIST_TAKES,
  CHAT_LIST_TAKES,
} from "../src/lib/crm-list-url";
import { parseMoneyQueueQuery, moneyQueueSearchString, moneyAriaSort } from "../src/lib/crm-money-queue";
import { parseTraderListQuery, traderListSearchString } from "../src/lib/crm-trader-query";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

function main() {
  assert.equal(clipListPage("3"), 3);
  assert.equal(clipListPage("0"), 1);
  assert.equal(clipListPage("-4"), 1);
  assert.equal(clipListPage("nope"), 1);
  assert.equal(clipListTake("25", CRM_LIST_TAKES, 50), 25);
  assert.equal(clipListTake("40", CRM_LIST_TAKES, 50), 50);
  assert.equal(clipListTake("40", CHAT_LIST_TAKES, 20), 40);
  assert.equal(listPageSkip(1, 25), 0);
  assert.equal(listPageSkip(3, 25), 50);
  assert.deepEqual(listPageRange(2, 50, 10), { from: 51, to: 60 });
  assert.deepEqual(listPageRange(2, 50, 0), { from: 0, to: 0 });

  const ledger = parseLedgerListQuery("?q=ada&type=deposit&userId=u1&from=2026-01-01&to=2026-01-31&page=2&take=25");
  assert.equal(ledger.type, "DEPOSIT");
  assert.equal(ledger.take, 25);
  assert.equal(ledger.page, 2);
  assert.deepEqual(parseLedgerListQuery(`?${ledgerListSearchString(ledger)}`), ledger);
  assert.equal(ledgerListSearchString({ ...ledger, q: "", type: "", userId: "", from: "", to: "", page: 1, take: 50 }), "");
  assert.equal(parseLedgerListQuery("?take=999&page=-1").take, 50);

  const positions = parsePositionListQuery("?q=eur&tab=orders&page=4&take=100");
  assert.equal(positions.tab, "ORDERS");
  assert.equal(positions.take, 100);
  assert.deepEqual(parsePositionListQuery(`?${positionListSearchString(positions)}`), positions);
  assert.equal(parsePositionListQuery("?tab=nope").tab, "OPEN");
  assert.equal(positionListSearchString({ q: "", tab: "OPEN", page: 1, take: 50 }), "");

  const tickets = parseTicketListQuery(
    "?q=ada&status=ALL&kind=withdraw&take=25&depSkip=10&marginSkip=0&wdSkip=4&stack=0-0-0.5-0-1"
  );
  assert.equal(tickets.status, "");
  assert.equal(tickets.kind, "withdraw");
  assert.equal(tickets.take, 25);
  assert.deepEqual(tickets.cursor, { deposit: 10, margin: 0, withdraw: 4 });
  assert.equal(tickets.stack.length, 2);
  assert.deepEqual(tickets.stack[0], { deposit: 0, margin: 0, withdraw: 0 });
  assert.deepEqual(parseTicketListQuery(`?${ticketListSearchString(tickets)}`), tickets);
  assert.equal(parseTicketListQuery("?status=DROP&kind=nope").status, "PENDING");
  assert.equal(parseTicketListQuery("?status=DROP&kind=nope").kind, "all");
  assert.equal(
    ticketListSearchString({
      q: "",
      status: "PENDING",
      kind: "all",
      from: "",
      to: "",
      take: 50,
      cursor: { deposit: 0, margin: 0, withdraw: 0 },
      stack: [],
    }),
    ""
  );

  const chat = parseChatListQuery("?q=ada&tab=unanswered&page=2&take=40&user=user_1");
  assert.equal(chat.tab, "unanswered");
  assert.equal(chat.take, 40);
  assert.equal(chat.user, "user_1");
  assert.deepEqual(parseChatListQuery(`?${chatListSearchString(chat)}`), chat);
  assert.equal(parseChatListQuery("?tab=pinned&take=25").tab, "all");
  assert.equal(parseChatListQuery("?tab=pinned&take=25").take, 20);
  assert.equal(chatListSearchString({ q: "", tab: "all", page: 1, take: 20, user: "" }), "");

  const traders = parseTraderListQuery("?q=ada&sort=name_asc&page=2&take=100");
  assert.equal(traders.take, 100);
  assert.equal(parseTraderListQuery("?take=30").take, 50);
  assert.equal(traderListSearchString(traders).includes("take=100"), true);
  assert.equal(moneyAriaSort("", "created"), "descending");
  assert.equal(moneyAriaSort("amount_asc", "amount"), "ascending");
  assert.equal(moneyAriaSort("", "name"), "none");
  const queue = parseMoneyQueueQuery("?q=ada&status=APPROVED&sort=amount_desc&page=2&take=25");
  assert.equal(queue.take, 25);
  assert.deepEqual(parseMoneyQueueQuery(`?${moneyQueueSearchString(queue)}`), queue);
  assert.equal(parseMoneyQueueQuery("?take=15").take, 50);

  for (const rel of [
    "src/app/(admin)/izcrm/transactions/page.tsx",
    "src/app/(admin)/izcrm/positions/page.tsx",
    "src/app/(admin)/izcrm/tickets/page.tsx",
    "src/app/(admin)/izcrm/chat/page.tsx",
  ]) {
    const src = read(rel);
    assert.match(src, /useListQueryUrl/);
    assert.match(src, /CrmListPager/);
  }
  assert.match(read("src/components/crm/CrmListBar.tsx"), /crm\.list\.clear/);
  assert.match(read("src/app/(admin)/izcrm/positions/page.tsx"), /crm\.list\.clear/);
  assert.match(read("src/components/crm/MoneyQueueChrome.tsx"), /crm\.list\.clear/);
  assert.match(read("src/app/(admin)/izcrm/deposits/page.tsx"), /aria-sort=\{moneyAriaSort/);
  assert.match(read("src/app/(admin)/izcrm/withdrawals/page.tsx"), /aria-sort=\{moneyAriaSort/);
  assert.match(read("src/app/(admin)/izcrm/traders/page.tsx"), /data-fx-list-take/);
  assert.match(read("src/lib/i18n/dictionaries/crm-ui.ts"), /crm\.list\.showing/);
  assert.equal(read("src/app/api/admin/transactions/route.ts").includes("crm-list-url"), false);
  assert.equal(read("src/app/api/admin/positions/route.ts").includes("sort"), false);

  console.log("round69 crm list url ok");
}

main();
