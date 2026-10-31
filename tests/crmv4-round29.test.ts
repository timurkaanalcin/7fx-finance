/**
 * CRM v4 round 29 helpers.
 * Run: npx tsx tests/crmv4-round29.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND29_COPY } from "../src/lib/crmv4/copy-round29";
import {
  addCanned,
  depDone,
  depositReviewBody,
  matchDeposits,
  pendingDeposits,
  readCanned,
  setDepCheck,
  threadMark,
} from "../src/lib/crmv4/round29";

function main() {
  const rows = pendingDeposits([
    { id: "d1", amount: 400, currency: "TRY", status: "PENDING", user: { name: "Mehmet" } },
    { id: "d2", amount: 250, currency: "USD", status: "APPROVED", user: { name: "Ada" } },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(matchDeposits(rows, "try").length, 1);
  const checks = setDepCheck({}, "d1", "amount", true);
  assert.equal(depDone(checks.d1), 1);
  const blank = depositReviewBody("d1", "reject", "  ", "  ");
  assert.deepEqual(blank, { id: "d1", action: "reject" });
  assert.equal("approvalReason" in blank, false);
  assert.equal("sourceUserId" in blank, false);
  const filled = depositReviewBody("d1", "approve", "checked", "acct-1");
  assert.equal(filled.approvalReason, "checked");
  assert.equal(filled.sourceUserId, "acct-1");
  assert.equal(threadMark([{ id: "m", workerId: null, automatic: false }], "2026-10-31"), "waiting");
  assert.equal(threadMark([{ id: "m", workerId: "staff", automatic: false }], null), "unread");
  assert.equal(threadMark([{ id: "m", workerId: "staff", automatic: true }], "2026-10-31"), "answered");
  const canned = addCanned([], "Hello", "We received it");
  assert.equal(readCanned(canned)[0].body, "We received it");
  assert.equal(addCanned(canned, "", "  ").length, 1);
  const keys = Object.keys(ROUND29_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND29_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dep-luxe/);
  assert.match(css, /\.c4-inbox-luxe/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round29.tsx"), "utf8");
  assert.match(page, /crmv4-dep-review/);
  assert.match(page, /crmv4-inbox-canned/);
  assert.match(page, /aria-required=\{false\}/);
  assert.equal(page.includes("crmv4-reply-templates"), false);
  console.log("crmv4 round29 tests passed");
}

main();
