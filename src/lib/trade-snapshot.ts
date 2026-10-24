import { flagsFromUser } from "@/lib/account-perms";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { metricsFromStoredAccount } from "@/lib/trade-metrics";
import type { AccountMetrics, UserInfo } from "@/components/trading/types";

export type TradeSnapshot = {
  user: UserInfo;
  account: AccountMetrics | null;
};

/**
 * Read-only header snapshot for the signed-in terminal.
 * Session check matches the signed-in user rules, without seeding, presence writes, or an account update.
 */
export async function readTradeSnapshot(): Promise<TradeSnapshot | null> {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { account: true },
  });
  if (!user) return null;
  if (user.active === false) return null;
  if (user.expiresAt && user.expiresAt.getTime() <= Date.now()) return null;
  if (user.loginEnabled === false && !session.impersonatedBy) return null;
  if (
    user.passwordChangedAt &&
    session.iat &&
    session.iat * 1000 + 1000 <= user.passwordChangedAt.getTime()
  ) {
    return null;
  }
  const flags = flagsFromUser(user);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "TRADER",
      impersonatedBy: session.impersonatedBy ?? null,
      tradingEnabled: flags.tradingEnabled,
      withdrawalsEnabled: flags.withdrawalsEnabled,
      loginEnabled: flags.loginEnabled,
      mustChangePassword: user.mustChangePassword === true,
      language: user.language || "en",
    },
    account: user.account ? metricsFromStoredAccount(user.account) : null,
  };
}
