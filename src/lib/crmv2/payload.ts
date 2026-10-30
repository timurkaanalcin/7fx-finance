/** Approve/reject body. A blank reason is omitted so the server treats it as optional. */
export function approvalBody(id: string, action: "approve" | "reject", reason: string): Record<string, string> {
  const body: Record<string, string> = { id, action };
  const trimmed = reason.trim();
  if (trimmed) body.approvalReason = trimmed;
  return body;
}

export function approvalEndpoint(kind: string): string {
  const k = kind.toUpperCase();
  if (k === "WITHDRAW" || k === "WITHDRAWAL") return "/api/admin/withdrawals";
  if (k === "MARGIN" || k === "BALANCE") return "/api/admin/balance-requests";
  return "/api/admin/deposits";
}

/**
 * Ledger create. Source account is optional: it is sent only when the field has a value.
 * A transfer with a source uses the existing two-sided transfer; without one, the API
 * writes a single ledger row.
 */
export function ledgerBody(input: {
  type: string;
  amount: string;
  sourceUserId: string;
  comment: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    entity: "ledger",
    type: input.type.trim() || "ADJUSTMENT",
    amount: Number(input.amount),
    applyToBalance: true,
  };
  const source = input.sourceUserId.trim();
  if (source) body.sourceUserId = source;
  const comment = input.comment.trim();
  if (comment) body.comment = comment;
  return body;
}
