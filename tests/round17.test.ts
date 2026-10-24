/**
 * Round 17: English terminal copy and paged customer/CRM lists.
 * Run: npx tsx tests/round17.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translate } from "../src/lib/i18n/dictionaries";
import { CRM_DEFAULT_LOCALE, PUBLIC_DEFAULT_LOCALE } from "../src/lib/i18n/locales";
import {
  CRM_MEMBERSHIP_LEGACY,
  CRM_MONEY_LIST_LEGACY,
  CUSTOMER_DOCS_LEGACY,
  pagedOrLegacy,
} from "../src/lib/trader-list";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");
  assert.equal(CRM_DEFAULT_LOCALE, "tr");
  assert.equal(CUSTOMER_DOCS_LEGACY, 200);
  assert.equal(CRM_MEMBERSHIP_LEGACY, 500);
  assert.equal(CRM_MONEY_LIST_LEGACY, 200);

  assert.deepEqual(pagedOrLegacy(null, null, false, CUSTOMER_DOCS_LEGACY), {
    take: 200,
    skip: 0,
    paged: false,
  });
  assert.deepEqual(pagedOrLegacy(null, null, false, CRM_MEMBERSHIP_LEGACY), {
    take: 500,
    skip: 0,
    paged: false,
  });
  assert.deepEqual(pagedOrLegacy("50", "0", true, CRM_MONEY_LIST_LEGACY), {
    take: 50,
    skip: 0,
    paged: true,
  });
  assert.deepEqual(pagedOrLegacy("500", "40", true, CRM_MEMBERSHIP_LEGACY), {
    take: 100,
    skip: 40,
    paged: true,
  });
  assert.deepEqual(pagedOrLegacy(null, "10", true, CUSTOMER_DOCS_LEGACY), {
    take: 50,
    skip: 10,
    paged: true,
  });

  assert.equal(translate("en", "term.blotter.openPnl"), "Open P&L");
  assert.equal(translate("en", "term.deposit.amount"), "Amount (USD)");
  assert.equal(translate("en", "term.deposit.send"), "Send notification");
  assert.equal(translate("en", "term.notify.title"), "Notifications");
  assert.equal(translate("en", "docs.download"), "Download");
  assert.ok(/[çğıöşüÇĞİÖŞÜıİ]/.test(translate("tr", "term.blotter.openPnl")));
  assert.ok(/[çğıöşüÇĞİÖŞÜıİ]/.test(translate("tr", "term.deposit.note")));
  assert.equal(translate("tr", "term.deposit.amount"), "Tutar (USD)");
  assert.equal(translate("tr", "term.notify.title"), "Bildirimler");

  const docs = read("src/app/api/documents/route.ts");
  assert.match(docs, /CUSTOMER_DOCS_LEGACY/);
  assert.match(docs, /pagedOrLegacy/);
  assert.doesNotMatch(docs, /take:\s*200/);

  const memberships = read("src/app/api/admin/ai-memberships/route.ts");
  assert.match(memberships, /CRM_MEMBERSHIP_LEGACY/);
  assert.match(memberships, /updateMany/);
  assert.match(memberships, /export async function PATCH/);

  const deposits = read("src/app/api/admin/deposits/route.ts");
  const withdrawals = read("src/app/api/admin/withdrawals/route.ts");
  assert.match(deposits, /CRM_MONEY_LIST_LEGACY/);
  assert.match(withdrawals, /CRM_MONEY_LIST_LEGACY/);
  assert.match(deposits, /convertAmountToUsd/);
  assert.match(withdrawals, /recordLedger/);
  assert.match(deposits, /export async function POST/);
  assert.match(withdrawals, /export async function POST/);

  assert.match(read("src/app/(terminal)/documents/page.tsx"), /take: "50"/);
  assert.match(read("src/app/(admin)/izcrm/uyelikler/page.tsx"), /take: "50"/);
  assert.match(read("src/app/(admin)/izcrm/deposits/page.tsx"), /take: "50"/);
  assert.match(read("src/app/(admin)/izcrm/withdrawals/page.tsx"), /take: "50"/);
  assert.match(read("src/components/trading/DepositModal.tsx"), /term\.deposit\.amount/);
  assert.match(read("src/components/trading/TerminalShell.tsx"), /if \(!lang\) return/);

  console.log("round17 tests passed");
}

main();
