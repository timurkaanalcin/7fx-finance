/**
 * Margin-call & balance-reset config (M1 Finance demo).
 *
 * Detection (any of):
 *   - equity <= 0
 *   - freeMargin <= 0 while margin is used
 *   - marginLevel < threshold (default 50%) while margin > 0
 *
 * On admin APPROVE of type RESET:
 *   - force-close all OPEN positions (PnL not applied to balance)
 *   - cancel PENDING orders
 *   - set balance/equity/freeMargin to DEFAULT_RESET_BALANCE (10_000)
 */

export const DEFAULT_RESET_BALANCE = 10_000;

/** Default margin level (%) below which margin call triggers (when used margin > 0). */
export const MARGIN_CALL_LEVEL = 50;

export type MarginSnapshot = {
  equity: number;
  freeMargin: number;
  margin: number;
  marginLevel: number;
};

export function isMarginCall(m: MarginSnapshot, thresholdPct: number = MARGIN_CALL_LEVEL): boolean {
  if (m.equity <= 0) return true;
  if (m.margin > 0 && m.freeMargin <= 0) return true;
  if (m.margin > 0 && m.marginLevel < thresholdPct) return true;
  return false;
}

export const MARGIN_CALL_RULE_EN = `Margin call: equity ≤ 0, or when margin is used free margin ≤ 0 / margin level < %${MARGIN_CALL_LEVEL}. Balance reset approval → ${DEFAULT_RESET_BALANCE.toLocaleString("en-US")} USD + open positions are closed.`;
