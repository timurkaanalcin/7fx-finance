/** Dense customer rows and the agenda day strip. Both use loaded rows only. */

export const DONE_KEY = "crmv4-day-done";

export const DENSE_FIELDS = ["email", "country", "desk", "saleStatus", "documentsStatus", "currency"] as const;
export type DenseField = (typeof DENSE_FIELDS)[number];

export type DenseRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
  documentsStatus?: string | null;
  currency?: string | null;
};

export type DayItem = { id: string; kind: "follow" | "task"; name: string; day: string };

export function readColumns(raw: unknown): DenseField[] {
  if (!Array.isArray(raw)) return ["email", "country", "desk"];
  const out: DenseField[] = [];
  for (const item of raw) {
    const key = String(item || "") as DenseField;
    if ((DENSE_FIELDS as readonly string[]).includes(key) && !out.includes(key)) out.push(key);
  }
  return out.length ? out : ["email"];
}

export function toggleColumn(columns: readonly DenseField[], key: DenseField): DenseField[] {
  if (columns.includes(key)) {
    const next = columns.filter((item) => item !== key);
    return next.length ? next : columns.slice();
  }
  return [...columns, key];
}

export function cell(row: DenseRow, key: DenseField): string {
  return String(row[key] || "");
}

export function filterRows(rows: readonly DenseRow[], text: string): DenseRow[] {
  const query = text.trim().toLowerCase();
  if (!query) return rows.slice();
  return rows.filter((row) => `${row.name || ""} ${row.email || ""} ${row.country || ""} ${row.desk || ""}`.toLowerCase().includes(query));
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function allIds(rows: readonly { id: string }[], on: boolean): string[] {
  return on ? rows.map((row) => row.id).filter(Boolean) : [];
}

export function utcToday(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function shiftDay(day: string, by: number): string {
  const at = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(at)) return day;
  return new Date(at + by * 86_400_000).toISOString().slice(0, 10);
}

export function dayWindow(start: string, count: number): string[] {
  const size = Math.max(1, Math.min(7, Math.floor(count)));
  const out: string[] = [];
  for (let i = 0; i < size; i += 1) out.push(shiftDay(start, i));
  return out;
}

export function dayKey(value: string | null | undefined): string {
  const day = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

export function isOverdue(day: string, today: string): boolean {
  if (!day || !today) return false;
  return day < today;
}

export function dayItems(
  follows: readonly { id: string; name?: string | null; at?: string | null }[],
  tasks: readonly { id: string; name?: string | null; at?: string | null }[],
): DayItem[] {
  const out: DayItem[] = [];
  for (const row of follows) {
    const day = dayKey(row.at);
    if (!day || !row.id) continue;
    out.push({ id: `follow:${row.id}`, kind: "follow", name: String(row.name || row.id), day });
  }
  for (const row of tasks) {
    const day = dayKey(row.at);
    if (!day || !row.id) continue;
    out.push({ id: `task:${row.id}`, kind: "task", name: String(row.name || row.id), day });
  }
  return out;
}

export function itemsOn(items: readonly DayItem[], day: string): DayItem[] {
  return items.filter((item) => item.day === day);
}

export function toggleDone(ids: readonly string[], id: string): string[] {
  return toggleId(ids, id);
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 200);
}
