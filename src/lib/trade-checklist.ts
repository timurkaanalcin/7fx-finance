/** First-run checklist on /trade. Dismissal is a local flag only. */
export const TRADE_CHECKLIST_KEY = "fx-trade-checklist-dismissed";

/**
 * The checklist stays visible until the trader dismisses it.
 * Only the literal "1" counts, so a cleared or partial value shows it again.
 */
export function checklistDismissed(raw: string | null | undefined): boolean {
  return raw === "1";
}
