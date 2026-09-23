import { prisma } from "./prisma";

export type LedgerType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "BONUS"
  | "CREDIT"
  | "ADJUSTMENT"
  | "RESET"
  | "MARGIN_ADD"
  | "TRADE_PNL"
  | "FINANCE_SET";

/** Record a balance-affecting event against the trader's 1:1 trading Account. */
export async function recordLedger(opts: {
  userId: string;
  type: LedgerType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency?: string;
  comment?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  refType?: string | null;
  refId?: string | null;
}) {
  const account = await prisma.account.findUnique({ where: { userId: opts.userId } });
  try {
    return await prisma.balanceLedger.create({
      data: {
        userId: opts.userId,
        tradingAccountId: account?.id ?? null,
        type: opts.type,
        amount: opts.amount,
        balanceBefore: opts.balanceBefore,
        balanceAfter: opts.balanceAfter,
        currency: opts.currency || account?.currency || "USD",
        comment: opts.comment || null,
        createdById: opts.createdById || null,
        createdByName: opts.createdByName || null,
        refType: opts.refType || null,
        refId: opts.refId || null,
      },
    });
  } catch (e) {
    console.error("[ledger]", e);
    return null;
  }
}
