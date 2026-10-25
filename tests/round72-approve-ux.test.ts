/**
 * Approve stays an explicit confirm. Enter skips text areas, the row
 * updates in place, and the toast names the amount and customer.
 * Run: npx tsx tests/round72-approve-ux.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  approveConfirmOnEnter,
  approveToastLine,
  patchQueueRow,
  patchTicketAfterApprove,
  validateApproveDialog,
} from "../src/lib/approve-dialog";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(approveConfirmOnEnter({ tagName: "TEXTAREA" }), false);
  assert.equal(approveConfirmOnEnter({ tagName: "INPUT" }), false);
  assert.equal(approveConfirmOnEnter({ tagName: "SELECT" }), false);
  assert.equal(approveConfirmOnEnter({ tagName: "BUTTON" }), false);
  assert.equal(approveConfirmOnEnter({ tagName: "A" }), false);
  assert.equal(approveConfirmOnEnter(null), false);
  assert.equal(approveConfirmOnEnter({ tagName: "DIV" }), true);
  assert.equal(approveConfirmOnEnter({ tagName: "P" }), true);

  assert.equal(approveToastLine("Approved {amount} for {customer}.", "Ada", "$10.00"), "Approved $10.00 for Ada.");
  assert.equal(validateApproveDialog({ reason: "", scenario: "", busy: false }).buttonDisabled, false);
  assert.equal(validateApproveDialog({ reason: "", scenario: "", busy: true }).buttonDisabled, true);

  const rows = [
    { id: "a", kind: "DEPOSIT", status: "PENDING", approvalReason: null, eventScenario: null, closedAt: null },
    { id: "b", kind: "DEPOSIT", status: "PENDING", approvalReason: null, eventScenario: null, closedAt: null },
  ];
  const patched = patchTicketAfterApprove(rows, { id: "a", kind: "DEPOSIT" }, { approvalReason: "", eventScenario: "" }, {
    request: { status: "APPROVED", approvalReason: null, eventScenario: null, reviewedAt: "2026-10-25T00:00:00.000Z" },
  });
  assert.equal(patched[0].status, "APPROVED");
  assert.equal(patched[0].closedAt, "2026-10-25T00:00:00.000Z");
  assert.equal(patched[1].status, "PENDING");
  const otherKind = patchTicketAfterApprove(rows, { id: "a", kind: "WITHDRAW" }, { approvalReason: "x", eventScenario: "" }, null);
  assert.equal(otherKind[0].status, "PENDING");

  const queue = patchQueueRow(
    [{ id: "a", status: "PENDING" }, { id: "b", status: "PENDING" }],
    "a",
    { status: "APPROVED" }
  );
  assert.deepEqual(queue.map((row) => row.status), ["APPROVED", "PENDING"]);

  const dialog = read("src/components/crm/ApproveSaveDialog.tsx");
  assert.match(dialog, /data-fx-approve-save=""/);
  assert.match(dialog, /useDialogFocus\(open, onCancel, ref, "\[data-fx-approve-save\]"\)/);
  assert.match(dialog, /data-fx-approve-toast=""/);
  assert.equal(dialog.includes("font-semibold"), false);
  assert.equal(dialog.includes("undo"), false);
  assert.equal(dialog.includes("onConfirm()"), true);
  assert.equal(/useEffect\(\(\) => \{\s*onConfirm/.test(dialog), false);

  for (const file of [
    "src/app/(admin)/izcrm/tickets/page.tsx",
    "src/app/(admin)/izcrm/deposits/page.tsx",
    "src/app/(admin)/izcrm/withdrawals/page.tsx",
    "src/app/(admin)/izcrm/balance-requests/page.tsx",
  ]) {
    const src = read(file);
    assert.match(src, /ApproveSaveDialog/);
    assert.match(src, /crm\.tickets\.confirmApprove/);
    assert.match(src, /crm\.tickets\.approvedToast/);
    assert.match(src, /<ApproveToast/);
    assert.equal(src.includes("bulk"), false);
  }

  const tickets = read("src/app/(admin)/izcrm/tickets/page.tsx");
  assert.match(tickets, /patchTicketAfterApprove/);
  assert.match(tickets, /validateApproveDialog/);
  assert.match(tickets, /action: "approve"/);
  assert.doesNotMatch(tickets, /setTickets[\s\S]{0,240}await load\(\)/);

  const deposits = read("src/app/(admin)/izcrm/deposits/page.tsx");
  assert.match(deposits, /JSON\.stringify\(\{ id, action \}\)/);
  assert.match(deposits, /const action = "approve"/);
  assert.match(deposits, /queue\.patchRow/);
  assert.doesNotMatch(deposits, /patchRow[\s\S]{0,200}queue\.load\(\)/);

  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    const src = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    assert.match(src, /"crm\.tickets\.approvedToast":/);
    assert.match(src, /\{amount\}/);
    assert.match(src, /\{customer\}/);
  }

  console.log("round72 tests passed");
}

main();
