/**
 * Read-only account statement lines.
 * Amounts are the numbers already stored on each row. The running figure is a
 * same-currency sum of those numbers. It does not convert FX or recompute balance.
 */

export type StatementTrade = {
  id: string;
  symbol: string;
  side: string;
  volume: number;
  /** Stored closed P&L (closeProfit, or profit when closeProfit is absent). */
  profit: number;
  at: string;
};

export type StatementCash = {
  id: string;
  kind: "deposit" | "withdrawal";
  /** Stored request amount, always the positive figure from the row. */
  amount: number;
  currency: string;
  status: string;
  at: string;
  label: string;
};

export type StatementLine = {
  id: string;
  at: string;
  kind: "trade" | "deposit" | "withdrawal";
  currency: string;
  /** Direction of the stored amount. Withdrawals are shown as money out. */
  signed: number;
  included: boolean;
  /** Same-currency sum after this line. Blank when the row is not settled. */
  running: number | null;
  status: string;
  title: string;
  detail: string;
};

export type StatementTotals = { currency: string; total: number };

function currencyOf(raw: string, fallback: string): string {
  const code = (raw || fallback || "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

/** Inclusive local dates. Blank bounds do not narrow the range. */
export function inStatementRange(iso: string, from: string, to: string): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  if (from) {
    const start = Date.parse(`${from}T00:00:00`);
    if (Number.isFinite(start) && t < start) return false;
  }
  if (to) {
    const end = Date.parse(`${to}T23:59:59.999`);
    if (Number.isFinite(end) && t > end) return false;
  }
  return true;
}

export function statementRangeInverted(from: string, to: string): boolean {
  if (!from || !to) return false;
  const start = Date.parse(`${from}T00:00:00`);
  const end = Date.parse(`${to}T23:59:59.999`);
  return Number.isFinite(start) && Number.isFinite(end) && start > end;
}

/**
 * Chronological lines. Approved deposits add the stored amount, approved
 * withdrawals subtract it, and closed trades add the stored P&L. Pending and
 * rejected cash stays on the page and does not move the running total.
 */
export function buildStatement(opts: {
  trades: StatementTrade[];
  cash: StatementCash[];
  accountCurrency: string;
  from: string;
  to: string;
}): { lines: StatementLine[]; totals: StatementTotals[] } {
  if (statementRangeInverted(opts.from, opts.to)) return { lines: [], totals: [] };
  const accountCurrency = currencyOf(opts.accountCurrency, "USD");
  const draft: StatementLine[] = [];

  for (const trade of opts.trades) {
    if (!inStatementRange(trade.at, opts.from, opts.to)) continue;
    const signed = Number(trade.profit);
    const included = Number.isFinite(signed);
    draft.push({
      id: `trade:${trade.id}`,
      at: trade.at,
      kind: "trade",
      currency: accountCurrency,
      signed: included ? signed : 0,
      included,
      running: null,
      status: "CLOSED",
      title: `${String(trade.side || "").toUpperCase()} ${trade.symbol}`.trim(),
      detail: Number.isFinite(trade.volume) ? String(trade.volume) : "",
    });
  }

  for (const row of opts.cash) {
    if (!inStatementRange(row.at, opts.from, opts.to)) continue;
    const status = String(row.status || "").toUpperCase();
    const amount = Number(row.amount);
    const finite = Number.isFinite(amount);
    const included = finite && status === "APPROVED";
    const direction = row.kind === "withdrawal" ? -1 : 1;
    draft.push({
      id: `${row.kind}:${row.id}`,
      at: row.at,
      kind: row.kind,
      currency: currencyOf(row.currency, accountCurrency),
      signed: finite ? direction * amount : 0,
      included,
      running: null,
      status,
      title: row.label || row.kind,
      detail: "",
    });
  }

  draft.sort((a, b) => {
    const at = (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0);
    if (at !== 0) return at;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const running = new Map<string, number>();
  for (const line of draft) {
    if (!line.included) continue;
    const next = (running.get(line.currency) || 0) + line.signed;
    running.set(line.currency, next);
    line.running = next;
  }

  const totals = Array.from(running.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => (a.currency < b.currency ? -1 : a.currency > b.currency ? 1 : 0));

  return { lines: draft, totals };
}
