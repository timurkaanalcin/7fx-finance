import { prisma } from "./prisma";

export const AI_PLANS = [
  { id: "MONTHLY", days: 30, priceUsd: 29 },
  { id: "QUARTERLY", days: 90, priceUsd: 79 },
  { id: "YEARLY", days: 365, priceUsd: 249 },
] as const;
export type AiPlanId = (typeof AI_PLANS)[number]["id"];
export function planById(id: unknown) {
  return AI_PLANS.find((p) => p.id === id) ?? null;
}

/** Admin/staff accounts are always unlimited. */
export function isUnlimited(user: { role?: string | null }) {
  return user.role === "ADMIN";
}

export async function activeMembership(userId: string) {
  return prisma.aiMembership.findFirst({
    where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
}

export async function membershipState(user: { id: string; role?: string | null }) {
  if (isUnlimited(user)) return { active: true, unlimited: true, expiresAt: null as Date | null, plan: "UNLIMITED", pending: false };
  const [act, pend] = await Promise.all([
    activeMembership(user.id),
    prisma.aiMembership.findFirst({ where: { userId: user.id, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
  ]);
  return { active: !!act, unlimited: false, expiresAt: act?.expiresAt ?? null, plan: act?.plan ?? null, pending: !!pend, pendingPlan: pend?.plan ?? null };
}
