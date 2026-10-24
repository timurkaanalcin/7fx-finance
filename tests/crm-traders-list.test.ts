/**
 * Traders list search, sort, paging, and URL filters.
 * Run: npx tsx tests/crm-traders-list.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  nextTraderSort,
  parseTraderListQuery,
  traderListOrderBy,
  traderListSearchString,
  traderPageRange,
  traderPageSkip,
  traderTextSearch,
} from "../src/lib/crm-trader-query";

function main() {
  const text = traderTextSearch(" 7803 ");
  assert.ok(text && "OR" in text && Array.isArray(text.OR));
  const fields = (text.OR as { email?: unknown; name?: unknown; accountLoginId?: unknown }[]).map(
    (row) => Object.keys(row)[0]
  );
  assert.ok(fields.includes("email"));
  assert.ok(fields.includes("name"));
  assert.ok(fields.includes("accountLoginId"));
  assert.equal(traderTextSearch("   "), null);
  assert.equal(traderTextSearch("x".repeat(200))?.OR?.[0] && "email" in (traderTextSearch("x".repeat(200))!.OR![0] as object), true);

  assert.equal(nextTraderSort("", "name"), "name_asc");
  assert.equal(nextTraderSort("name_asc", "name"), "name_desc");
  assert.equal(nextTraderSort("name_desc", "name"), "name_asc");
  assert.equal(nextTraderSort("", "balance"), "balance_desc");
  assert.equal(nextTraderSort("balance_desc", "balance"), "balance_asc");
  assert.equal(nextTraderSort("", "nope"), "");

  const byName = traderListOrderBy("name_asc", false);
  assert.deepEqual(byName[0], { name: "asc" });
  const byBalance = traderListOrderBy("balance_desc", true);
  assert.deepEqual(byBalance[0], { account: { balance: "desc" } });
  const fallback = traderListOrderBy("not-a-sort", true);
  assert.deepEqual(fallback[0], { retentionFollowUpAt: "asc" });
  assert.deepEqual(traderListOrderBy("", false)[0], { createdAt: "desc" });

  assert.equal(traderPageSkip(1), 0);
  assert.equal(traderPageSkip(2), 50);
  assert.equal(traderPageSkip(0), 0);
  assert.deepEqual(traderPageRange(1, 9), { from: 1, to: 9 });
  assert.deepEqual(traderPageRange(2, 0), { from: 0, to: 0 });
  assert.deepEqual(traderPageRange(3, 10), { from: 101, to: 110 });

  const parsed = parseTraderListQuery("?q=mehmet&status=frozen&sort=name_asc&page=3&ftd=1&saleStatus=NEW");
  assert.equal(parsed.q, "mehmet");
  assert.equal(parsed.status, "frozen");
  assert.equal(parsed.sort, "name_asc");
  assert.equal(parsed.page, 3);
  assert.equal(parsed.ftdOnly, true);
  assert.equal(parsed.saleStatus, "NEW");
  assert.equal(parseTraderListQuery("?sort=drop-table&page=-4").sort, "");
  assert.equal(parseTraderListQuery("?page=0").page, 1);
  const roundTrip = parseTraderListQuery(`?${traderListSearchString(parsed)}`);
  assert.equal(roundTrip.q, parsed.q);
  assert.equal(roundTrip.status, parsed.status);
  assert.equal(roundTrip.sort, parsed.sort);
  assert.equal(roundTrip.page, parsed.page);
  assert.equal(roundTrip.ftdOnly, true);
  assert.equal(traderListSearchString({ ...parsed, page: 1, q: "", status: "all", sort: "", ftdOnly: false, saleStatus: "" }), "");

  const page = fs.readFileSync(new URL("../src/app/(admin)/izcrm/traders/page.tsx", import.meta.url), "utf8");
  assert.match(page, /data-fx-trader-search/);
  assert.match(page, /data-fx-trader-pager/);
  assert.match(page, /e\.key !== "\/"/);
  assert.match(page, /history\.replaceState/);
  assert.match(page, /fetch\("\/api\/auth\/me", \{ credentials: "include" \}\)/);
  assert.match(page, /href=\{`\/izcrm\/traders\/\$\{u\.id\}`\}/);
  assert.equal(page.includes("OpenTerminalButton"), false);
  assert.match(page, /colSpan=\{13\}/);

  const route = fs.readFileSync(new URL("../src/app/api/admin/users/route.ts", import.meta.url), "utf8");
  assert.match(route, /traderTextSearch\(q\)/);
  assert.match(route, /traderListOrderBy\(sort, followUpActive\)/);
  assert.match(route, /prisma\.user\.count\(\{ where: listWhere \}\)/);
  assert.match(route, /action === "create"/);
  const dict = fs.readFileSync(new URL("../src/lib/i18n/dictionaries/crm-ui.ts", import.meta.url), "utf8");
  const auto = dict.indexOf('["crm.chat.automatic"');
  const recent = dict.indexOf("// CRM recently viewed customers");
  if (auto !== -1) assert.ok(auto < recent);
  assert.ok(dict.indexOf("crm.traders.searchKey") > recent);

  console.log("crm-traders-list tests passed");
}

main();
