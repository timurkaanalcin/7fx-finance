/** Pure helpers for CRM v4 round 21. Display of loaded rows only. */

export type MoneyLite = {
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  createdAt?: string | null;
  method?: string | null;
};

export type MethodStat = {
  method: string;
  count: number;
  approved: number;
  pending: number;
  byCurrency: { currency: string; total: number }[];
  avgAgeHours: number | null;
};

export function byCurrency(rows: { amount?: number | null; currency?: string | null }[]): { currency: string; total: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const currency = String(row.currency || "USD");
    map.set(currency, (map.get(currency) || 0) + Math.abs(Number(row.amount) || 0));
  }
  return Array.from(map.entries()).map(([currency, total]) => ({ currency, total: Math.round(total) }));
}

export function statusCounts(rows: { status?: string | null }[]): { pending: number; approved: number; rejected: number } {
  const out = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) {
    const status = String(row.status || "").toUpperCase();
    if (status === "PENDING") out.pending += 1;
    else if (status === "APPROVED") out.approved += 1;
    else if (status === "REJECTED") out.rejected += 1;
  }
  return out;
}

export function inDates(at: string | null | undefined, from: string, to: string): boolean {
  const day = String(at || "").slice(0, 10);
  if (!day) return !from && !to;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function approvalShare(approved: number, count: number): number | null {
  if (count <= 0) return null;
  return Math.round((approved / count) * 100);
}

export function averageAgeHours(dates: (string | null | undefined)[], now = Date.now()): number | null {
  const ages: number[] = [];
  for (const value of dates) {
    const time = new Date(String(value || "")).getTime();
    if (!Number.isFinite(time)) continue;
    ages.push(Math.max(0, (now - time) / 3600000));
  }
  if (!ages.length) return null;
  return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
}

export function methodStats(rows: MoneyLite[], now = Date.now()): MethodStat[] {
  const map = new Map<string, MoneyLite[]>();
  for (const row of rows) {
    const method = String(row.method || "—");
    map.set(method, [...(map.get(method) || []), row]);
  }
  return Array.from(map.entries()).map(([method, list]) => {
    const counts = statusCounts(list);
    return {
      method,
      count: list.length,
      approved: counts.approved,
      pending: counts.pending,
      byCurrency: byCurrency(list),
      avgAgeHours: averageAgeHours(list.map((row) => row.createdAt), now),
    };
  }).sort((a, b) => b.count - a.count || a.method.localeCompare(b.method));
}

export function noteSummary(notes: { body?: string | null; createdAt?: string | null }[]): { count: number; latest: string } {
  const ordered = [...notes].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return { count: notes.length, latest: String(ordered[0]?.body || "") };
}
