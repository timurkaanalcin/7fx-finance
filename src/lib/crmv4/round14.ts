/** Pure helpers for CRM v4 round 14. No schema writes. */

export type RecurEvery = "day" | "week";

export function nextRecur(every: RecurEvery, hour: number, now = new Date()): string {
  const next = new Date(now.getTime());
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(hour);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + (every === "week" ? 7 : 1));
  }
  return next.toISOString();
}

export function dueToday(rows: { remindAt?: string | null }[], now = new Date()): number {
  const day = now.toISOString().slice(0, 10);
  return rows.filter((row) => String(row.remindAt || "").slice(0, 10) === day).length;
}

export function snoozeUntil(preset: "15m" | "tomorrow", now = new Date()): string {
  if (preset === "15m") return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  const next = new Date(now.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(9, 0, 0, 0);
  return next.toISOString();
}

export function slaLeft(openedAt: string | null | undefined, hours: number, now = Date.now()): number | null {
  if (!openedAt) return null;
  const open = new Date(openedAt).getTime();
  if (!Number.isFinite(open) || !(hours > 0)) return null;
  return Math.round((open + hours * 3600000 - now) / 60000);
}

export type LoginBucket = "fresh" | "week" | "month" | "dormant" | "never";

export function loginBucket(lastLogin: string | null | undefined, now = Date.now()): LoginBucket {
  if (!lastLogin) return "never";
  const stamp = new Date(lastLogin).getTime();
  if (!Number.isFinite(stamp)) return "never";
  const days = (now - stamp) / 86400000;
  if (days < 1) return "fresh";
  if (days < 7) return "week";
  if (days < 21) return "month";
  return "dormant";
}

export function isDormant(lastLogin: string | null | undefined, createdAt: string | null | undefined, days = 21, now = Date.now()): boolean {
  const stamp = lastLogin || createdAt;
  if (!stamp) return false;
  const time = new Date(stamp).getTime();
  if (!Number.isFinite(time)) return false;
  return (now - time) / 86400000 >= days;
}

export type AssignRule = { country: string; desk: string };

export function simulateAssign(row: { country?: string | null; desk?: string | null }, rules: AssignRule[]): string {
  const code = String(row.country || "").trim().toUpperCase();
  const hit = rules.find((rule) => rule.country.trim().toUpperCase() === code && rule.desk.trim());
  return hit?.desk || String(row.desk || "—");
}

export function deskRanks(rows: { desk?: string | null; ftd?: boolean; balance?: number | null }[]): { desk: string; traders: number; ftd: number; balance: number }[] {
  const map = new Map<string, { desk: string; traders: number; ftd: number; balance: number }>();
  for (const row of rows) {
    const desk = String(row.desk || "—");
    const current = map.get(desk) || { desk, traders: 0, ftd: 0, balance: 0 };
    current.traders += 1;
    if (row.ftd) current.ftd += 1;
    current.balance += Number(row.balance) || 0;
    map.set(desk, current);
  }
  return Array.from(map.values()).sort((a, b) => b.ftd - a.ftd || b.traders - a.traders);
}

export function changedKeys(detail: unknown): { key: string; before: string; after: string }[] {
  if (!detail || typeof detail !== "object") return [];
  const bag = detail as { before?: unknown; after?: unknown };
  if (!bag.before || !bag.after || typeof bag.before !== "object" || typeof bag.after !== "object") return [];
  const before = bag.before as Record<string, unknown>;
  const after = bag.after as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map((key) => ({
    key,
    before: before[key] == null ? "" : String(before[key]),
    after: after[key] == null ? "" : String(after[key]),
  }));
}

export function ageHours(openedAt: string | null | undefined, now = Date.now()): number | null {
  if (!openedAt) return null;
  const open = new Date(openedAt).getTime();
  if (!Number.isFinite(open)) return null;
  return Math.max(0, Math.round((now - open) / 3600000));
}

export const TICKET_COLUMNS = ["customer", "kind", "amount", "status", "opened"] as const;

export function ticketCells(row: { customer?: string; kind?: string; amount?: number; status?: string; openedAt?: string }, columns: string[]): string[] {
  const bag: Record<string, string> = {
    customer: String(row.customer || ""),
    kind: String(row.kind || ""),
    amount: String(row.amount ?? ""),
    status: String(row.status || ""),
    opened: String(row.openedAt || ""),
  };
  const picked = columns.filter((column) => bag[column] != null);
  return (picked.length ? picked : [...TICKET_COLUMNS]).map((column) => bag[column] || "");
}
