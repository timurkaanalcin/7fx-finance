/** Support thread and today's loaded work. Counts use loaded rows only. */

export const DRAFT_KEY = "crmv3-thread-drafts";
export const CANNED_KEY = "crmv3-thread-canned";

export type ThreadMessage = {
  id: string;
  body?: string | null;
  workerId?: string | null;
  automatic?: boolean | null;
  createdAt?: string | null;
};

export type ThreadWho = "customer" | "staff" | "auto";

export type Canned = { id: string; title: string; body: string };

export type MoneyRow = { amount?: number | null; currency?: string | null; createdAt?: string | null };
export type Dated = { at?: string | null };

export function utcDay(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function dayOf(value: string | null | undefined): string {
  const day = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

export function isOnDay(value: string | null | undefined, day: string): boolean {
  if (!day) return false;
  return dayOf(value) === day;
}

export function whoOf(message: { workerId?: string | null; automatic?: boolean | null }): ThreadWho {
  if (message.automatic) return "auto";
  if (message.workerId) return "staff";
  return "customer";
}

export function filterMessages(rows: readonly ThreadMessage[], query: string): ThreadMessage[] {
  const text = query.trim().toLowerCase();
  if (!text) return rows.slice();
  return rows.filter((row) => String(row.body || "").toLowerCase().includes(text));
}

/** Enter never sends. Only the Send button posts. */
export function enterSends(key: string): boolean {
  return key.length < 0;
}

export function readDrafts(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = key.trim();
    const text = String(value || "");
    if (id && text) out[id] = text.slice(0, 2000);
  }
  return out;
}

export function writeDraft(map: Record<string, string>, id: string, body: string): Record<string, string> {
  const next = { ...map };
  const text = body.slice(0, 2000);
  if (!id || !text) delete next[id];
  else next[id] = text;
  return next;
}

export function readCanned(raw: unknown): Canned[] {
  if (!Array.isArray(raw)) return [];
  const out: Canned[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; title?: unknown; body?: unknown };
    const body = String(row.body || "").trim();
    const title = String(row.title || "").trim();
    if (!body || !title) continue;
    out.push({ id: String(row.id || title), title: title.slice(0, 40), body: body.slice(0, 500) });
  }
  return out;
}

export function saveCanned(list: readonly Canned[], title: string, body: string): Canned[] {
  const name = title.trim().slice(0, 40);
  const text = body.trim().slice(0, 500);
  if (!name || !text) return list.slice();
  return [...list, { id: `${name}:${list.length}`, title: name, body: text }];
}

export function dropCanned(list: readonly Canned[], id: string): Canned[] {
  return list.filter((item) => item.id !== id);
}

export function countOnDay(rows: readonly Dated[], day: string): number {
  let count = 0;
  for (const row of rows) if (isOnDay(row.at, day)) count += 1;
  return count;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Today's loaded amounts, one line per currency. */
export function sumsOnDay(rows: readonly MoneyRow[], day: string): { currency: string; count: number; amount: number }[] {
  const map: Record<string, { currency: string; count: number; amount: number }> = {};
  for (const row of rows) {
    if (!isOnDay(row.createdAt, day)) continue;
    const currency = String(row.currency || "").trim().toUpperCase();
    if (!currency) continue;
    if (!map[currency]) map[currency] = { currency, count: 0, amount: 0 };
    map[currency].count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) map[currency].amount = round2(map[currency].amount + amount);
  }
  return Object.keys(map).sort().map((key) => map[key]);
}
