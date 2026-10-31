/**
 * CRM v3 withdrawal review and grouped search.
 * Checklist and recent searches stay in the browser.
 * Run: npx tsx tests/crmv3-withdraw.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  emptyWdChecks,
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
} from "../src/lib/crmv3/withdraw";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const rows = pendingOnly([
    { id: "w1", status: "PENDING", amount: 40, currency: "TRY", user: { id: "a", name: "Ada", email: "a@demo" } },
    { id: "w2", status: "APPROVED", amount: 10, currency: "USD", user: { name: "Bea" } },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(matchWithdrawals(rows, "ada").length, 1);
  assert.equal(matchWithdrawals(rows, "usd").length, 0);
  assert.equal(sameCurrency("usd", "USD"), true);
  assert.equal(sameCurrency("USD", "TRY"), false);
  const checks = setWdCheck({}, "w1", "kyc", true);
  assert.equal(wdDone(checks.w1), 1);
  assert.equal(wdDone(emptyWdChecks()), 0);
  assert.equal(readWdChecks({ w1: { kyc: true, balance: "yes" } }).w1.balance, false);

  assert.deepEqual(pushRecent(["Ada"], "ada"), ["ada"]);
  assert.deepEqual(pushRecent(["Ada"], "a"), ["Ada"]);
  assert.equal(moveIndex(0, -1, 3), 2);
  assert.equal(moveIndex(2, 1, 3), 0);
  const groups = groupHits([
    { group: "page", id: "overview", label: "Overview", detail: "", href: "/crmv3" },
    { group: "customer", id: "a", label: "Ada", detail: "", href: "/crmv3/customers/a" },
    { group: "finance", id: "d-1", label: "Ada", detail: "USD 10", href: "/crmv3/finance" },
  ]);
  assert.deepEqual(groups.map((row) => row.group), ["customer", "finance", "page"]);
  assert.equal(pageHits("rep", [{ id: "reports", label: "Reports", href: "/crmv3/reports" }, { id: "kyc", label: "Review", href: "/crmv3/kyc" }]).length, 1);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.equal(css.includes("overflow-x: auto"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/withdraw.tsx"), "utf8");
  assert.match(page, /crmv3-wd-review/);
  assert.match(page, /approvalBody/);
  assert.match(page, /aria-required=\{false\}/);
  assert.equal(page.includes("crmv4-"), false);
  const palette = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/command.tsx"), "utf8");
  assert.match(palette, /crmv3-palette-recent/);
  assert.match(palette, /ArrowDown/);
  assert.equal(palette.includes("crmv4-"), false);

  console.log("crmv3 withdraw tests passed");
}

main();
