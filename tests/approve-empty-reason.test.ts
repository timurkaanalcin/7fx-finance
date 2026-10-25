/**
 * Approving a deposit, withdrawal, or margin ticket does not require a reason
 * or an event scenario. Empty and missing reasons parse, store as null, and
 * still produce the ledger comment the audit row is written with.
 * Run: npx tsx tests/approve-empty-reason.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateApproveDialog } from "../src/lib/approve-dialog";
import { translate } from "../src/lib/i18n/dictionaries";
import {
  approvalAuditComment,
  approvalPayloadSchema,
  readApprovalPayload,
} from "../src/lib/ticket-scenario";
import "./preload-dicts";

const OPTIONAL: Record<string, string> = {
  en: "optional",
  tr: "opsiyonel",
  de: "optional",
  ru: "необязательно",
  ar: "اختياري",
};

function main() {
  const emptyFields = validateApproveDialog({ reason: "", scenario: "" });
  assert.equal(emptyFields.ok, true);
  assert.equal(emptyFields.errorKey, null);
  assert.equal(emptyFields.buttonDisabled, false);
  assert.equal(emptyFields.approvalReason, "");
  assert.equal(emptyFields.eventScenario, "");

  const whitespace = validateApproveDialog({ reason: "   \n", scenario: "  " });
  assert.equal(whitespace.ok, true);
  assert.equal(whitespace.errorKey, null);
  assert.equal(whitespace.buttonDisabled, false);
  assert.equal(whitespace.approvalReason, "");
  assert.equal(whitespace.eventScenario, "");

  const onlyScenarioMissing = validateApproveDialog({ reason: "paid", scenario: "" });
  assert.equal(onlyScenarioMissing.ok, true);
  assert.equal(onlyScenarioMissing.buttonDisabled, false);
  assert.equal(onlyScenarioMissing.approvalReason, "paid");
  assert.equal(onlyScenarioMissing.eventScenario, "");

  const inFlight = validateApproveDialog({ reason: "", scenario: "", busy: true });
  assert.equal(inFlight.buttonDisabled, true);
  assert.equal(inFlight.errorKey, null);

  for (const body of [
    {},
    { id: "dep_1", action: "approve" },
    { approvalReason: "" },
    { approvalReason: "   " },
    { approvalReason: null },
    { eventScenario: "" },
    { approvalReason: "", eventScenario: "" },
    { approvalReason: null, eventScenario: null },
  ]) {
    const parsed = approvalPayloadSchema.safeParse(body);
    assert.equal(parsed.success, true, JSON.stringify(body));
    if (!parsed.success) continue;
    assert.equal(parsed.data.approvalReason, null);
    assert.equal(parsed.data.adminNote, null);
    assert.equal(parsed.data.eventScenario, null);
    const viaHelper = readApprovalPayload(body);
    assert.deepEqual(viaHelper, parsed.data);
    assert.equal(approvalAuditComment(viaHelper.adminNote, "CRM deposit approved"), "CRM deposit approved");
    assert.equal(approvalAuditComment(viaHelper.adminNote, "Withdrawal via BANK"), "Withdrawal via BANK");
    assert.equal(approvalAuditComment(viaHelper.adminNote, "Margin-call ADD approved"), "Margin-call ADD approved");
  }

  const kept = readApprovalPayload({
    approvalReason: "  wire received  ",
    eventScenario: "  customer paid  ",
  });
  assert.equal(kept.approvalReason, "wire received");
  assert.equal(kept.eventScenario, "customer paid");
  assert.equal(kept.adminNote, "wire received");
  assert.equal(approvalAuditComment(kept.adminNote, "CRM deposit approved"), "wire received");

  const omittedReasonUsesNote = readApprovalPayload({ adminNote: "legacy note" });
  assert.equal(omittedReasonUsesNote.approvalReason, "legacy note");
  assert.equal(omittedReasonUsesNote.adminNote, "legacy note");

  const explicitEmptyDoesNotBorrowNote = readApprovalPayload({
    approvalReason: "",
    adminNote: "should not become the reason",
  });
  assert.equal(explicitEmptyDoesNotBorrowNote.approvalReason, null);
  assert.equal(explicitEmptyDoesNotBorrowNote.adminNote, null);

  const long = "x".repeat(4500);
  const sliced = readApprovalPayload({ approvalReason: long, eventScenario: "y".repeat(13000) });
  assert.equal(sliced.approvalReason?.length, 4000);
  assert.equal(sliced.adminNote?.length, 500);
  assert.equal(sliced.eventScenario?.length, 12000);

  for (const [locale, word] of Object.entries(OPTIONAL)) {
    assert.equal(translate(locale as "en", "crm.tickets.optional"), word);
  }

  const page = readFileSync("src/app/(admin)/izcrm/tickets/page.tsx", "utf8");
  assert.match(page, /validateApproveDialog/);
  assert.doesNotMatch(page, /crm\.tickets\.reasonRequired/);
  assert.doesNotMatch(page, /if\s*\(\s*!reason\.trim\(\)/);
  assert.match(page, /aria-required=\{false\}/);
  assert.doesNotMatch(page, /required=\{true\}[^>]*approve-reason/);

  for (const file of [
    "src/app/api/admin/deposits/route.ts",
    "src/app/api/admin/withdrawals/route.ts",
    "src/app/api/admin/balance-requests/route.ts",
  ]) {
    const src = readFileSync(file, "utf8");
    assert.match(src, /readApprovalPayload/);
    assert.match(src, /approvalAuditComment/);
    assert.match(src, /recordLedger\(/);
    assert.match(src, /createdById: admin\.id/);
    assert.match(src, /createdByName: admin\.name/);
    assert.doesNotMatch(src, /approvalReason.{0,40}required/i);
    assert.doesNotMatch(src, /if\s*\(\s*!approval\.approvalReason/);
  }

  const deposit = readFileSync("src/app/api/admin/deposits/route.ts", "utf8");
  assert.match(deposit, /amount: usdAmount/);
  const withdrawal = readFileSync("src/app/api/admin/withdrawals/route.ts", "utf8");
  assert.match(withdrawal, /amount: -usdAmount/);
  const margin = readFileSync("src/app/api/admin/balance-requests/route.ts", "utf8");
  assert.match(margin, /amount: balanceAfter - balanceBefore/);

  console.log("approve-empty-reason tests passed");
}

main();
