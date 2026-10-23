/**
 * CRM record ↔ balance consistency.
 *
 * Rule ("bakiyeye yansıt"): editing / adding / deleting a CRM record NEVER
 * touches the trader's Account by default. Only when the admin explicitly
 * ticks "Reflect to balance" (applyToBalance=true) the server computes the
 * record's balance effect before and after the change and moves the Account
 * by the delta (effectAfter − effectBefore), writing a BalanceLedger row so
 * history stays consistent. This prevents silent double-crediting when an
 * already-approved deposit is edited.
 *
 * Effects:
 *  - DepositRequest     APPROVED → +amount, otherwise 0
 *  - WithdrawalRequest  APPROVED → −amount, otherwise 0
 *  - BalanceRequest ADD APPROVED → +amount; RESET → 0 (not reversible)
 *  - Position           CLOSED   → realized P/L (closeProfit ?? profit); OPEN → 0
 *                       (floating P/L of open positions lives in equity only)
 *  - BalanceLedger row  amount (BONUS rows move Account.bonus, CREDIT rows
 *                       move Account.credit, every other type moves balance)
 */
import { prisma } from "./prisma";
import { recordLedger, type LedgerType } from "./ledger";
import { refreshAccountMetrics } from "./trading";

export type AdminRef = { id: string; name: string };

export function depositEffect(r: { status: string; amount: number } | null | undefined): number {
  if (!r) return 0;
  return r.status === "APPROVED" ? Number(r.amount) || 0 : 0;
}

export function withdrawalEffect(r: { status: string; amount: number } | null | undefined): number {
  if (!r) return 0;
  return r.status === "APPROVED" ? -(Number(r.amount) || 0) : 0;
}

export function balanceRequestEffect(
  r: { status: string; type: string; amount: number | null } | null | undefined
): number {
  if (!r) return 0;
  if (r.status !== "APPROVED" || r.type !== "ADD") return 0;
  return Number(r.amount) || 0;
}

export function positionEffect(
  p: { status: string; closeProfit: number | null; profit: number } | null | undefined
): number {
  if (!p || p.status !== "CLOSED") return 0;
  const v = p.closeProfit ?? p.profit;
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/** Which Account field a ledger row type moves when reflected. */
export function ledgerTarget(type: string): "balance" | "bonus" | "credit" {
  const t = String(type || "").toUpperCase();
  if (t === "BONUS") return "bonus";
  if (t === "CREDIT") return "credit";
  return "balance";
}

/**
 * Move Account.balance by delta and write a ledger row describing it.
 * Returns the balance before/after (or null when nothing changed).
 */
export async function applyBalanceDelta(opts: {
  userId: string;
  delta: number;
  type: LedgerType;
  comment: string;
  admin: AdminRef;
  refType?: string | null;
  refId?: string | null;
  /** Ledger currency label. Account.balance is USD, so converted credits pass "USD". */
  currency?: string;
}) {
  const delta = Number(opts.delta);
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-9) return null;
  const account = await prisma.account.findUnique({ where: { userId: opts.userId } });
  if (!account) throw new Error("ACCOUNT_NOT_FOUND");
  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore + delta;
  await prisma.account.update({ where: { userId: opts.userId }, data: { balance: balanceAfter } });
  await recordLedger({
    userId: opts.userId,
    type: opts.type,
    amount: delta,
    balanceBefore,
    balanceAfter,
    currency: opts.currency || "USD",
    comment: opts.comment.slice(0, 2000),
    createdById: opts.admin.id,
    createdByName: opts.admin.name,
    refType: opts.refType ?? null,
    refId: opts.refId ?? null,
  });
  await refreshAccountMetrics(opts.userId).catch(() => null);
  return { balanceBefore, balanceAfter, delta };
}

/** Move the Account field a ledger row drives, WITHOUT writing another ledger row. */
export async function applyLedgerRowDelta(userId: string, type: string, delta: number) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-9) return null;
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new Error("ACCOUNT_NOT_FOUND");
  const field = ledgerTarget(type);
  const before = account[field];
  await prisma.account.update({ where: { userId }, data: { [field]: before + delta } });
  await refreshAccountMetrics(userId).catch(() => null);
  return { field, before, after: before + delta, delta };
}
