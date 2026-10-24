import { prisma } from "./prisma";
import { checkSlTp, processPendingOrders } from "./trading";
import { ENGINE_CRON_BUDGET_MS, engineUserIds, rotateIds, runEngineBatch } from "./engine-schedule";

/**
 * Pending fills and SL/TP for every account that has an open position or a
 * working order. Uses the same functions as the open-position poll.
 * Accounts are visited one at a time so quote cache and account locks stay serial.
 */
export async function runTradingEngineCron(nowMs = Date.now()) {
  const [openRows, pendingRows] = await Promise.all([
    prisma.position.findMany({
      where: { status: "OPEN" },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.order.findMany({
      where: { status: "PENDING" },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  const ids = rotateIds(
    engineUserIds(
      openRows.map((row) => row.userId),
      pendingRows.map((row) => row.userId)
    ),
    nowMs
  );
  const result = await runEngineBatch({
    ids,
    budgetMs: ENGINE_CRON_BUDGET_MS,
    startedMs: nowMs,
    now: () => Date.now(),
    runUser: async (userId) => {
      try {
        await processPendingOrders(userId);
        await checkSlTp(userId);
      } catch (err) {
        console.error(
          "engine cron account failed",
          userId,
          err instanceof Error ? err.message : "error"
        );
        throw err;
      }
    },
  });
  return { accounts: ids.length, ...result };
}
