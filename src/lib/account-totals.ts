/** Stored Account columns the admin summary headline adds. Read-only. */
export type StoredAccountFields = {
  balance: number;
  equity: number;
  margin: number;
};

export type AggregateSum = {
  balance: number | null;
  equity: number | null;
  margin: number | null;
};

/**
 * Sum every stored balance, equity, and margin.
 * Nulls are skipped, which is what SQL SUM does.
 */
export function sumStoredAccountFields(
  rows: Array<{ balance: number | null; equity: number | null; margin: number | null }>
): StoredAccountFields {
  let balance = 0;
  let equity = 0;
  let margin = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.balance != null) balance += row.balance;
    if (row.equity != null) equity += row.equity;
    if (row.margin != null) margin += row.margin;
  }
  return { balance, equity, margin };
}

/** Prisma `_sum` is null when the table is empty. The headline then shows zero. */
export function headlineFromAggregate(sum: AggregateSum | null | undefined): StoredAccountFields {
  return {
    balance: sum?.balance ?? 0,
    equity: sum?.equity ?? 0,
    margin: sum?.margin ?? 0,
  };
}
