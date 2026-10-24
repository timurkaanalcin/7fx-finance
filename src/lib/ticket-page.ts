/** Kinds merged by GET /api/admin/tickets. */
export type TicketKind = "DEPOSIT" | "MARGIN" | "WITHDRAW";

/** Rows already consumed from each source, in createdAt desc order. */
export type TicketCursors = {
  deposit: number;
  margin: number;
  withdraw: number;
};

type Part<T extends { kind: TicketKind }> = {
  kind: TicketKind;
  rows: T[];
  /** True when the source has at least one row past `rows`. */
  extra: boolean;
};

/**
 * Merge one page of deposit, margin, and withdrawal rows.
 * Each source is already ordered newest-first and clipped to the page size.
 * Cursors advance only by the rows included in this page, so the next request
 * repeats anything that was too old to fit.
 */
export function mergeTicketWindow<T extends { kind: TicketKind; openedAt: string | Date }>(
  parts: readonly Part<T>[],
  cursors: TicketCursors,
  take: number
): { tickets: T[]; hasMore: boolean; cursors: TicketCursors } {
  const limit = Number.isFinite(take) && take > 0 ? Math.trunc(take) : 0;
  const merged = parts
    .flatMap((part) => part.rows)
    .sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt));
  const tickets = limit > 0 ? merged.slice(0, limit) : [];
  const used: Record<TicketKind, number> = { DEPOSIT: 0, MARGIN: 0, WITHDRAW: 0 };
  for (const row of tickets) used[row.kind] += 1;
  const leftover = merged.length > tickets.length;
  const sourceContinues = parts.some((part) => part.extra && used[part.kind] === part.rows.length && part.rows.length > 0);
  return {
    tickets,
    hasMore: leftover || sourceContinues,
    cursors: {
      deposit: cursors.deposit + used.DEPOSIT,
      margin: cursors.margin + used.MARGIN,
      withdraw: cursors.withdraw + used.WITHDRAW,
    },
  };
}
