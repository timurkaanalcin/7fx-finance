/** Loaded deposit and withdrawal history. Totals stay inside one currency. */
import { methodName } from "@/lib/crmv3/bridge";
import { sumsByCurrency, type CurrencySum } from "@/lib/crmv3/review";

export type LedgerSide = "all" | "deposit" | "withdrawal";

export type LedgerRow = {
  id: string;
  side: "deposit" | "withdrawal";
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  createdAt?: string | null;
  method?: unknown;
};

export function ledgerDay(value: unknown): string {
  const at = Date.parse(String(value || ""));
  if (!Number.isFinite(at)) return "";
  return new Date(at).toISOString().slice(0, 10);
}

export function filterLedger(
  rows: LedgerRow[],
  opts: { from: string; to: string; side: LedgerSide; status: string; q: string; newest: boolean },
): LedgerRow[] {
  const q = opts.q.trim().toLowerCase();
  const status = opts.status.trim().toUpperCase();
  const kept = rows.filter((row) => {
    if (opts.side !== "all" && row.side !== opts.side) return false;
    if (status && String(row.status || "").toUpperCase() !== status) return false;
    const day = ledgerDay(row.createdAt);
    if ((opts.from || opts.to) && !day) return false;
    if (opts.from && day < opts.from) return false;
    if (opts.to && day > opts.to) return false;
    if (!q) return true;
    const blob = `${row.status || ""} ${methodName(row.method)} ${row.currency || ""} ${row.side}`.toLowerCase();
    return blob.includes(q);
  });
  kept.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  if (opts.newest) kept.reverse();
  return kept;
}

export function statusChoices(rows: { status?: string | null }[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const status = String(row.status || "").trim().toUpperCase();
    if (status) set.add(status);
  }
  const list: string[] = [];
  set.forEach((status) => list.push(status));
  return list.sort();
}

export function sideSums(rows: LedgerRow[], side: "deposit" | "withdrawal"): CurrencySum[] {
  return sumsByCurrency(
    rows.filter((row) => row.side === side).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency })),
  );
}

/** Deposit minus withdrawal inside one currency. Currencies are never added. */
export function windowGap(deposits: CurrencySum[], withdrawals: CurrencySum[]): { currency: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const row of deposits) map.set(row.currency, (map.get(row.currency) || 0) + row.amount);
  for (const row of withdrawals) {
    map.set(row.currency, Math.round(((map.get(row.currency) || 0) - row.amount) * 100) / 100);
  }
  const out: { currency: string; amount: number }[] = [];
  map.forEach((amount, currency) => out.push({ currency, amount: Math.round(amount * 100) / 100 }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}
