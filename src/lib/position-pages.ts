/** Open blotter page size. The first page is the only one that runs fills and SL/TP. */
export const OPEN_PAGE = 200;
/** Closed-history page size for load-more and the first paint. */
export const CLOSED_PAGE = 50;
/**
 * 30s closed refresh reloads already shown rows up to this cap.
 * The full ledger stays on the first load and when the tab becomes visible.
 */
export const CLOSED_REFRESH_CAP = 200;

export function pageSkip(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100_000, Math.trunc(n));
}

/** Pending fills and SL/TP run on the first open page only. */
export function engineOnOpenPage(skip: number): boolean {
  return skip === 0;
}

/** How many closed rows a calendar=0 refresh should return. */
export function closedRefreshTake(loadedRaw: string | null): number {
  const n = Number(loadedRaw);
  const loaded = Number.isFinite(n) && n > 0 ? Math.trunc(n) : CLOSED_PAGE;
  return Math.max(CLOSED_PAGE, Math.min(CLOSED_REFRESH_CAP, loaded));
}

/** Keep server page order and drop duplicate ids from a later page. */
export function concatUniqueById<T extends { id: string }>(pages: readonly (readonly T[])[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const page of pages) {
    for (const row of page) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
}
