/**
 * CRM v3 deposit review and support inbox.
 * Checklist and canned replies stay in the browser. Nothing is sent until staff press send.
 * Run: npx tsx tests/crmv3-deposit.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  addCanned,
  depDone,
  depositReviewBody,
  emptyDepChecks,
  matchDeposits,
  pendingDeposits,
  readCanned,
  readDepChecks,
  setDepCheck,
  threadMark,
} from "../src/lib/crmv3/deposit";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const rows = pendingDeposits([
    { id: "d1", status: "PENDING", amount: 20, currency: "USD", note: "wire", user: { name: "Ada", email: "a@demo" } },
    { id: "d2", status: "APPROVED", amount: 5, currency: "TRY", user: { name: "Bea" } },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(matchDeposits(rows, "wire").length, 1);
  const checks = setDepCheck({}, "d1", "amount", true);
  assert.equal(depDone(checks.d1), 1);
  assert.equal(depDone(emptyDepChecks()), 0);
  assert.equal(readDepChecks({ d1: { amount: true, receipt: "yes" } }).d1.receipt, false);

  const blank = depositReviewBody("d1", "approve", "  ", "  ");
  assert.equal("approvalReason" in blank, false);
  assert.equal("sourceUserId" in blank, false);
  const filled = depositReviewBody("d1", "reject", "late", "acct-1");
  assert.equal(filled.approvalReason, "late");
  assert.equal(filled.sourceUserId, "acct-1");

  assert.equal(threadMark([{ id: "m", workerId: null, automatic: false }], "2026-01-01"), "waiting");
  assert.equal(threadMark([{ id: "m", workerId: "staff", automatic: false }], null), "unread");
  assert.equal(threadMark([{ id: "m", workerId: "staff", automatic: true }], "2026-01-01"), "answered");
  assert.equal(addCanned([], "Hi", "  ").length, 0);
  const canned = addCanned([], "", "Hello there");
  assert.equal(canned[0].title, "Hello there");
  assert.equal(readCanned([{ body: "  " }, { id: "1", title: "Saved", body: "Hello" }]).length, 1);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.equal(css.includes("overflow-x: auto"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/deposit.tsx"), "utf8");
  assert.match(page, /crmv3-dep-review/);
  assert.match(page, /crmv3-inbox-canned/);
  assert.match(page, /depositReviewBody/);
  assert.match(page, /aria-required=\{false\}/);
  assert.match(page, /\/api\/admin\/chat/);
  assert.equal(page.includes("crmv4-"), false);

  console.log("crmv3 deposit tests passed");
}

main();
