import { prisma } from "@/lib/prisma";

/** Staff contact happened now → bump User.lastContactAt (never moves it backwards). */
export async function touchLastContact(userId: string, at: Date = new Date()): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: { id: userId, OR: [{ lastContactAt: null }, { lastContactAt: { lt: at } }] },
      data: { lastContactAt: at },
    });
  } catch {
    /* best-effort */
  }
}

/** Recompute from the newest remaining Communication (used after delete). */
export async function recomputeLastContact(userId: string): Promise<void> {
  try {
    const last = await prisma.communication.findFirst({
      where: { userId, workerId: { not: null }, NOT: { title: "Live support" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    await prisma.user.update({ where: { id: userId }, data: { lastContactAt: last?.createdAt ?? null } });
  } catch {
    /* best-effort */
  }
}

let backfilled: Promise<void> | null = null;
/**
 * One-time (per process) backfill: users whose lastContactAt is still null but who have
 * communications get MAX(Communication.createdAt). Only fills NULLs — never overwrites data.
 */
export function ensureLastContactBackfill(): Promise<void> {
  if (!backfilled) {
    backfilled = prisma
      .$executeRawUnsafe(
        "UPDATE `User` u JOIN (SELECT userId, MAX(createdAt) m FROM `Communication` WHERE workerId IS NOT NULL AND (title IS NULL OR title <> 'Live support') GROUP BY userId) c ON c.userId = u.id SET u.lastContactAt = c.m WHERE u.lastContactAt IS NULL",
      )
      .then(() => undefined)
      .catch(() => undefined);
  }
  return backfilled;
}
