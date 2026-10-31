/** Pure helpers for CRM v4 round 25. Targets and history stay in the browser. */

export type MonthTargets = { ftd: number; traders: number; deposits: Record<string, number> };

export type ViewKind = "customer" | "ticket" | "finance";

export type ViewItem = { kind: ViewKind; id: string; title: string; href: string; at: string };

export type CashRow = {
  createdAt?: string | null;
  amount?: number | null;
  currency?: string | null;
  userId?: string | null;
  user?: { id?: string | null } | null;
};

export function monthStamp(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function inMonth(value: string | null | undefined, month: string): boolean {
  return String(value || "").slice(0, 7) === month;
}

export function monthSpan(now: Date): { day: number; days: number } {
  const day = now.getUTCDate();
  const days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  return { day, days };
}

export function readTargets(raw: unknown): MonthTargets {
  const row = raw && typeof raw === "object" ? raw as { ftd?: unknown; traders?: unknown; deposits?: unknown } : {};
  const deposits: Record<string, number> = {};
  if (row.deposits && typeof row.deposits === "object" && !Array.isArray(row.deposits)) {
    for (const [key, value] of Object.entries(row.deposits as Record<string, unknown>)) {
      const currency = key.toUpperCase();
      const amount = Number(value);
      if (currency && Number.isFinite(amount) && amount >= 0) deposits[currency] = amount;
    }
  }
  return {
    ftd: Math.max(0, Number(row.ftd) || 0),
    traders: Math.max(0, Number(row.traders) || 0),
    deposits,
  };
}

export function mtdByCurrency(rows: CashRow[], month: string): { currency: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!inMonth(row.createdAt, month)) continue;
    const currency = String(row.currency || "").toUpperCase();
    if (!currency) continue;
    map.set(currency, (map.get(currency) || 0) + (Number(row.amount) || 0));
  }
  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function mtdFtd(rows: CashRow[], month: string): number {
  const first = new Map<string, string>();
  for (const row of rows) {
    const id = String(row.user?.id || row.userId || "");
    const at = String(row.createdAt || "");
    if (!id || !at) continue;
    const prev = first.get(id);
    if (!prev || at < prev) first.set(id, at);
  }
  let count = 0;
  for (const at of Array.from(first.values())) if (inMonth(at, month)) count += 1;
  return count;
}

export function mtdTraders(rows: { userId?: string | null; openedAt?: string | null }[], month: string): number {
  const ids = new Set<string>();
  for (const row of rows) {
    const id = String(row.userId || "");
    if (id && inMonth(row.openedAt, month)) ids.add(id);
  }
  return ids.size;
}

export function runRate(actual: number, day: number, days: number): number | null {
  if (day <= 0 || days <= 0) return null;
  return Math.round((actual / day) * days * 100) / 100;
}

export function paceOf(actual: number, target: number, day: number, days: number): "ahead" | "behind" | "even" | "none" {
  if (!(target > 0) || day <= 0 || days <= 0) return "none";
  const expected = (target * day) / days;
  if (actual > expected + 0.001) return "ahead";
  if (actual < expected - 0.001) return "behind";
  return "even";
}

export function progressPct(actual: number, target: number): number | null {
  if (!(target > 0)) return null;
  return Math.round((actual / target) * 100);
}

export function stillToGo(actual: number, target: number): number | null {
  if (!(target > 0)) return null;
  return Math.round((target - actual) * 100) / 100;
}

export function pushItem(list: ViewItem[], item: Omit<ViewItem, "at">, at: string, limit = 12): ViewItem[] {
  const next = [{ ...item, at }, ...list.filter((row) => !(row.kind === item.kind && row.id === item.id))];
  return next.slice(0, limit);
}
