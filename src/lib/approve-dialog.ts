/** Shared CRM approve dialog (deposit, withdrawal, margin). Reason and scenario never block. */

export type ApproveDialogInput = {
  reason: string;
  scenario: string;
  /** True while the approve request is in flight. */
  busy?: boolean;
};

export type ApproveDialogDecision = {
  ok: true;
  /** Trimmed text sent to the API. An empty string is allowed and stored as null. */
  approvalReason: string;
  eventScenario: string;
  /** Disabled only while a request is in flight. Empty fields do not disable it. */
  buttonDisabled: boolean;
  errorKey: null;
};

export function validateApproveDialog(input: ApproveDialogInput): ApproveDialogDecision {
  return {
    ok: true,
    approvalReason: input.reason.trim(),
    eventScenario: input.scenario.trim(),
    buttonDisabled: Boolean(input.busy),
    errorKey: null,
  };
}

/**
 * Enter confirms the dialog except while a text control or another button has focus.
 * The approve button confirms through its own click, so it is not handled here.
 */
export function approveConfirmOnEnter(target: { tagName?: string | null } | null | undefined): boolean {
  const tag = String(target?.tagName || "").toUpperCase();
  if (!tag) return false;
  if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || tag === "BUTTON" || tag === "A") return false;
  return true;
}

export function approveToastLine(template: string, customer: string, amount: string): string {
  return template.split("{customer}").join(customer).split("{amount}").join(amount);
}

export function patchQueueRow<T extends { id: string }>(rows: T[], id: string, patch: Partial<T>): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

type TicketIdentity = { id: string; kind: string };
type ApproveResponse = {
  request?: {
    status?: string;
    approvalReason?: string | null;
    eventScenario?: string | null;
    reviewedAt?: string | null;
  } | null;
};

export function patchTicketAfterApprove<T extends TicketIdentity & {
  status: string;
  approvalReason?: string | null;
  eventScenario?: string | null;
  closedAt?: string | null;
}>(
  rows: T[],
  ticket: TicketIdentity,
  sent: { approvalReason: string; eventScenario: string },
  response: ApproveResponse | null
): T[] {
  const req = response?.request;
  return rows.map((row) => {
    if (row.id !== ticket.id || row.kind !== ticket.kind) return row;
    return {
      ...row,
      status: req?.status || "APPROVED",
      approvalReason: req?.approvalReason ?? (sent.approvalReason || null),
      eventScenario: req?.eventScenario ?? (sent.eventScenario || null),
      closedAt: req?.reviewedAt || row.closedAt || null,
    };
  });
}
