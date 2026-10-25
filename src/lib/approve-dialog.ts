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
