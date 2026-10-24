/**
 * Public English labels, bid/ask display copy, and admin document paging.
 * Run: npx tsx tests/round16.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translate } from "../src/lib/i18n/dictionaries";
import { CRM_DOCS_LEGACY, customerDocsWindow } from "../src/lib/trader-list";

function main() {
  assert.equal(translate("en", "term.bid"), "Bid");
  assert.equal(translate("en", "term.ask"), "Ask");
  assert.equal(translate("en", "term.pricePh"), "Price");
  assert.equal(translate("en", "term.deposit.ref"), "Transaction reference / tx hash");
  assert.equal(translate("tr", "term.bid"), "Alış");
  assert.equal(translate("tr", "term.ask"), "Satış");
  assert.equal(translate("tr", "term.pricePh"), "Fiyat");
  assert.equal(translate("de", "term.pricePh"), "Preis");
  assert.equal(translate("ru", "term.deposit.ref").includes("Референс"), true);
  assert.equal(translate("en", "auth.loginLead"), "Return to your account");
  assert.equal(translate("en", "landing.footer.blurb").includes("international"), true);
  assert.equal(translate("en", "landing.ctaTitle"), "Ready to start?");

  assert.equal(CRM_DOCS_LEGACY, 500);
  assert.deepEqual(customerDocsWindow(null, null, false), { take: 500, skip: 0, paged: false });
  assert.deepEqual(customerDocsWindow("50", "0", true), { take: 50, skip: 0, paged: true });
  assert.deepEqual(customerDocsWindow("50", "50", true), { take: 50, skip: 50, paged: true });
  assert.equal(customerDocsWindow("500", "0", true).take, 100);

  const route = fs.readFileSync(
    path.resolve(__dirname, "../src/app/api/admin/customer-documents/route.ts"),
    "utf8"
  );
  assert.match(route, /customerDocsWindow/);
  assert.match(route, /page\.paged \? page\.take \+ 1 : page\.take/);
  assert.match(route, /hasMore/);
  const page = fs.readFileSync(
    path.resolve(__dirname, "../src/app/(admin)/izcrm/evrak/page.tsx"),
    "utf8"
  );
  assert.match(page, /take: "50"/);
  assert.match(page, /load\("more"\)/);
  assert.match(page, /T\[locale\] \?\? T\.tr/);

  console.log("round16 tests passed");
}

main();
