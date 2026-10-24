/** Stop the run before the function hits its max duration. */
export const ENGINE_CRON_BUDGET_MS = 20_000;

/** Rotation step. The next minute starts one account further into the book. */
export const ENGINE_CRON_ROTATE_MS = 60_000;

export function engineUserIds(
  openUserIds: readonly string[],
  pendingUserIds: readonly string[]
): string[] {
  return Array.from(new Set([...openUserIds, ...pendingUserIds])).sort();
}

export function rotateIds<T>(ids: readonly T[], nowMs: number, periodMs = ENGINE_CRON_ROTATE_MS): T[] {
  if (ids.length === 0) return [];
  const period = periodMs > 0 ? periodMs : ENGINE_CRON_ROTATE_MS;
  const start = Math.floor(nowMs / period) % ids.length;
  if (start <= 0) return [...ids];
  return [...ids.slice(start), ...ids.slice(0, start)];
}

export async function runEngineBatch(opts: {
  ids: readonly string[];
  budgetMs: number;
  startedMs: number;
  now: () => number;
  runUser: (userId: string) => Promise<void>;
}): Promise<{ processed: number; remaining: number; timedOut: boolean; errors: number }> {
  let processed = 0;
  let errors = 0;
  for (const id of opts.ids) {
    if (opts.now() - opts.startedMs >= opts.budgetMs) {
      return { processed, remaining: opts.ids.length - processed, timedOut: true, errors };
    }
    try {
      await opts.runUser(id);
    } catch {
      errors += 1;
    }
    processed += 1;
  }
  return { processed, remaining: 0, timedOut: false, errors };
}
