/**
 * CRM v4 round 28 helpers.
 * Run: npx tsx tests/crmv4-round28.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { approvalBody } from "../src/lib/crmv2/payload";
import { ROUND28_COPY } from "../src/lib/crmv4/copy-round28";
import {
  groupHits,
  matchWithdrawals,
  moveIndex,
  pageHits,
  pendingOnly,
  pushRecent,
  readWdChecks,
  sameCurrency,
  setWdCheck,
  wdDone,
} from "../src/lib/crmv4/round28";

function main() {
  const rows = pendingOnly([
    { id: "w1", amount: 120, currency: "USD", status: "PENDING", user: { name: "Mehmet", email: "m@demo" } },
    { id: "w2", amount: 40, currency: "TRY", status: "APPROVED", user: { name: "Ada" } },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(matchWithdrawals(rows, "mehmet").length, 1);
  assert.equal(sameCurrency("usd", "USD"), true);
  assert.equal(sameCurrency("USD", "TRY"), false);
  const checks = setWdCheck({}, "w1", "kyc", true);
  assert.equal(wdDone(checks.w1), 1);
  assert.equal(readWdChecks({ w1: { kyc: true, balance: 1 } }).w1.balance, false);
  const hits = groupHits([
    { group: "page", id: "finance", label: "Finance", detail: "", href: "/crmv4/finance" },
    { group: "customer", id: "a", label: "Ada", detail: "", href: "/crmv4/customers/a" },
    { group: "finance", id: "d1", label: "Ada", detail: "US$10", href: "/crmv4/finance" },
  ]);
  assert.deepEqual(hits.map((row) => row.group), ["customer", "finance", "page"]);
  assert.equal(pageHits("rep", [{ id: "reports", label: "Reports", href: "/crmv4/reports" }, { id: "kyc", label: "Review", href: "/crmv4/kyc" }]).length, 1);
  assert.equal(moveIndex(0, -1, 3), 2);
  assert.equal(moveIndex(2, 1, 3), 0);
  assert.deepEqual(pushRecent(["Ada"], "ada"), ["ada"]);
  assert.deepEqual(pushRecent(["Ada"], "mehmet"), ["mehmet", "Ada"]);
  assert.deepEqual(approvalBody("w1", "reject", "  "), { id: "w1", action: "reject" });
  assert.equal("approvalReason" in approvalBody("w1", "approve", ""), false);
  const keys = Object.keys(ROUND28_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND28_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wd-luxe/);
  assert.match(css, /\.c4-find-luxe/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round28.tsx"), "utf8");
  assert.match(page, /crmv4-wd-review/);
  assert.match(page, /crmv4-palette-recent/);
  assert.match(page, /approvalBody/);
  assert.equal(page.includes("crmv4-search-history"), false);
  console.log("crmv4 round28 tests passed");
}

main();
