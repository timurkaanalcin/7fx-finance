/** Pure helpers for CRM v4 round 44. Flags and the timeline use loaded rows only. */

export type CashRow = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  userId?: string | null;
  name?: string | null;
};

export type CurrencySum = { currency: string; count: number; amount: number };

export type PersonFlag = { userId: string; name: string; count: number; sums: CurrencySum[] };

export type KycFlag = { id: string; name: string; sums: CurrencySum[] };

export type ReviewNote = { body: string; at: string };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function readThresholds(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const currency = key.trim().toUpperCase();
    const amount = Number(value);
    if (!currency || !Number.isFinite(amount) || amount <= 0) continue;
    out[currency] = amount;
  }
  return out;
}

export function setThreshold(map: Record<string, number>, currency: string, amount: number): Record<string, number> {
  const code = currency.trim().toUpperCase();
  if (!code) return map;
  const next = { ...map };
  if (!Number.isFinite(amount) || amount <= 0) delete next[code];
  else next[code] = amount;
  return next;
}

/** A deposit is large only against the threshold of its own currency. */
export function largeDeposits(rows: readonly CashRow[], thresholds: Record<string, number>): CashRow[] {
  const out: CashRow[] = [];
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    const limit = thresholds[currency];
    if (!currency || limit == null) continue;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount < limit) continue;
    out.push(row);
  }
  return out;
}

export function readCount(raw: unknown): number {
  const count = Number(raw);
  if (!Number.isFinite(count) || count < 2) return 3;
  return Math.min(99, Math.floor(count));
}

function sumsOf(rows: readonly CashRow[]): CurrencySum[] {
  const map: Record<string, CurrencySum> = {};
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    if (!currency) continue;
    const amount = Number(row.amount);
    if (!map[currency]) map[currency] = { currency, count: 0, amount: 0 };
    map[currency].count += 1;
    if (Number.isFinite(amount)) map[currency].amount = round2(map[currency].amount + amount);
  }
  const keys = Object.keys(map).sort();
  const out: CurrencySum[] = [];
  for (const key of keys) out.push(map[key]);
  return out;
}

export function frequentPeople(rows: readonly CashRow[], minCount: number): PersonFlag[] {
  const limit = readCount(minCount);
  const grouped: Record<string, CashRow[]> = {};
  const names: Record<string, string> = {};
  for (const row of rows) {
    const userId = String(row.userId || "");
    if (!userId) continue;
    if (!grouped[userId]) grouped[userId] = [];
    grouped[userId].push(row);
    if (row.name) names[userId] = String(row.name);
  }
  const out: PersonFlag[] = [];
  for (const userId of Object.keys(grouped)) {
    const list = grouped[userId];
    if (list.length < limit) continue;
    out.push({ userId, name: names[userId] || userId, count: list.length, sums: sumsOf(list) });
  }
  return out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function kycWithDeposits(
  people: readonly { id: string; name?: string | null; documentsStatus?: string | null }[],
  deposits: readonly CashRow[],
): KycFlag[] {
  const out: KycFlag[] = [];
  for (const person of people) {
    if (String(person.documentsStatus || "").toUpperCase() !== "PENDING") continue;
    const mine = deposits.filter((row) => row.userId === person.id);
    if (!mine.length) continue;
    out.push({ id: person.id, name: String(person.name || person.id), sums: sumsOf(mine) });
  }
  return out;
}

export function readNotes(raw: unknown): Record<string, ReviewNote> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, ReviewNote> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as { body?: unknown; at?: unknown };
    const body = String(row.body || "").trim();
    if (!body) continue;
    out[key] = { body, at: String(row.at || "") };
  }
  return out;
}

export function writeNote(map: Record<string, ReviewNote>, id: string, body: string, at: string): Record<string, ReviewNote> {
  const text = body.trim().slice(0, 500);
  const next = { ...map };
  if (!id || !text) delete next[id];
  else next[id] = { body: text, at };
  return next;
}

export type RiskKind = "large" | "frequent" | "kyc";

export type RiskFlag = { kind: RiskKind; id: string; name: string };

/** Kind and name stay on the flags already built. Neither asks for another list. */
export function filterFlags(flags: readonly RiskFlag[], kind: "" | RiskKind, text: string): RiskFlag[] {
  const query = text.trim().toLowerCase();
  return flags.filter((flag) => {
    if (kind && flag.kind !== kind) return false;
    if (!query) return true;
    return flag.name.toLowerCase().includes(query);
  });
}

export function pendingDoc<T extends { traderId?: string | null; status?: string | null }>(docs: readonly T[], userId: string): T | null {
  return docs.find((doc) => String(doc.traderId || "") === userId && String(doc.status || "").toUpperCase() === "PENDING") || null;
}

export function filterKind<T extends { kind: string }>(items: readonly T[], kind: string): T[] {
  if (!kind) return items.slice();
  return items.filter((item) => item.kind === kind);
}

export function groupDays<T extends { at: string }>(items: readonly T[]): { day: string; items: T[] }[] {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const day = String(item.at || "").slice(0, 10);
    const key = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }
  const keys = Object.keys(map).sort((a, b) => {
    if (!a) return 1;
    if (!b) return -1;
    return b.localeCompare(a);
  });
  const out: { day: string; items: T[] }[] = [];
  for (const key of keys) out.push({ day: key, items: map[key] });
  return out;
}

export function findDay(days: readonly string[], query: string): string {
  const day = query.slice(0, 10);
  return days.includes(day) ? day : "";
}
