/** Pure helpers for CRM v4 round 15. Display and local review only. */

export type MoneyLite = { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; user?: { email?: string | null; name?: string | null } | null };

export function methodName(method: unknown): string {
  if (!method) return "—";
  if (typeof method === "string") return method;
  if (typeof method === "object" && method && "label" in method) return String((method as { label?: string }).label || "—");
  return "—";
}

export function pendingSum(rows: MoneyLite[]): number {
  return rows.reduce((sum, row) => sum + (String(row.status || "").toUpperCase() === "PENDING" ? Math.abs(Number(row.amount) || 0) : 0), 0);
}

export function pendingCount(rows: MoneyLite[]): number {
  return rows.filter((row) => String(row.status || "").toUpperCase() === "PENDING").length;
}

export function byAge<T extends MoneyLite>(rows: T[], oldestFirst: boolean): T[] {
  const copy = [...rows];
  copy.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  return oldestFirst ? copy : copy.reverse();
}

export function inBand(amount: number, band: "" | "small" | "large"): boolean {
  if (band === "small") return Math.abs(amount) < 500;
  if (band === "large") return Math.abs(amount) >= 500;
  return true;
}

export function sameCustomer(rows: MoneyLite[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = String(row.user?.email || row.user?.name || "");
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [key, count] of Array.from(counts.entries())) if (count > 1) dupes.add(key);
  return dupes;
}

export function largestPendingId(rows: MoneyLite[]): string {
  let best = "";
  let max = -1;
  for (const row of rows) {
    if (String(row.status || "").toUpperCase() !== "PENDING") continue;
    const amount = Math.abs(Number(row.amount) || 0);
    if (amount > max) { max = amount; best = row.id; }
  }
  return best;
}

export function queueAgeHours(createdAt: string | null | undefined, now = Date.now()): number | null {
  if (!createdAt) return null;
  const time = new Date(createdAt).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((now - time) / 3600000));
}

export function currencyMix(rows: MoneyLite[]): { currency: string; count: number; total: number }[] {
  const map = new Map<string, { currency: string; count: number; total: number }>();
  for (const row of rows) {
    const currency = String(row.currency || "USD");
    const current = map.get(currency) || { currency, count: 0, total: 0 };
    current.count += 1;
    current.total += Math.abs(Number(row.amount) || 0);
    map.set(currency, current);
  }
  return Array.from(map.values());
}

export function noteDuplicate(body: string, notes: { body?: string | null }[]): boolean {
  const text = body.trim().toLowerCase();
  if (!text) return false;
  return notes.some((note) => String(note.body || "").trim().toLowerCase() === text);
}

export function orderNotes<T extends { createdAt?: string | null }>(rows: T[], newestFirst: boolean): T[] {
  const copy = [...rows].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  return newestFirst ? copy.reverse() : copy;
}

export function groupByAuthor<T extends { authorName?: string | null }>(rows: T[]): { author: string; rows: T[] }[] {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const author = String(row.authorName || "—");
    map.set(author, [...(map.get(author) || []), row]);
  }
  return Array.from(map.entries()).map(([author, list]) => ({ author, rows: list }));
}

export function docCounts(rows: { status?: string | null }[]): { pending: number; approved: number; rejected: number } {
  const out = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) {
    const status = String(row.status || "").toUpperCase();
    if (status === "PENDING") out.pending += 1;
    else if (status === "APPROVED") out.approved += 1;
    else if (status === "REJECTED") out.rejected += 1;
  }
  return out;
}
