import { isMarginCall } from "@/lib/margin-call";
import type { AccountMetrics } from "@/components/trading/types";

/** Stored account columns. profitLoss and marginLevel are not columns. */
export type StoredAccount = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  credit?: number | null;
  bonus?: number | null;
};

/**
 * Display metrics from the last stored snapshot.
 * profitLoss is equity − balance (the last refresh stored equity as balance + floating P/L).
 * Does not read prices and does not write.
 */
export function metricsFromStoredAccount(account: StoredAccount): AccountMetrics {
  const balance = account.balance;
  const equity = account.equity;
  const margin = account.margin;
  const freeMargin = account.freeMargin;
  const profitLoss = equity - balance;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  return {
    balance,
    equity,
    margin,
    freeMargin,
    leverage: account.leverage,
    currency: account.currency || "USD",
    profitLoss,
    marginLevel,
    credit: account.credit ?? 0,
    bonus: account.bonus ?? 0,
    marginCall: isMarginCall({ equity, freeMargin, margin, marginLevel }),
  };
}
