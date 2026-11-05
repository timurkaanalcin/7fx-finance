/** Risk flags and the day timeline. Both use loaded rows only. Currencies are never added. */

export type CashRow = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  userId?: string | null;
  name?: string | null;
};

export type CurrencySum = { currency: string; count: number; amount: number };

export type ReviewNote = { body: string; at: string };

export type RiskKind = "large" | "frequent" | "kyc";

export type RiskFlag = {
  kind: RiskKind;
  id: string;
  name: string;
  count: number;
  sums: CurrencySum[];
};

export type DayItem = { id: string; kind: string; at: string; title: string; detail: string };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function currencyOf(row: { currency?: string | null }): string {
  return String(row.currency || "").trim().toUpperCase();
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
  if (!code) return { ...map };
  const next = { ...map };
  if (!Number.isFinite(amount) || amount <= 0) delete next[code];
  else next[code] = amount;
  return next;
}

export function sumsOf(rows: readonly CashRow[]): CurrencySum[] {
  const map: Record<string, CurrencySum> = {};
  for (const row of rows) {
    const currency = currencyOf(row);
    if (!currency) continue;
    if (!map[currency]) map[currency] = { currency, count: 0, amount: 0 };
    map[currency].count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) map[currency].amount = round2(map[currency].amount + amount);
  }
  return Object.keys(map).sort().map((key) => map[key]);
}

/** A deposit is large only against the threshold saved for that same currency. */
export function largeFlags(rows: readonly CashRow[], thresholds: Record<string, number>): RiskFlag[] {
  const out: RiskFlag[] = [];
  for (const row of rows) {
    const currency = currencyOf(row);
    const limit = thresholds[currency];
    if (!currency || limit == null) continue;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount < limit) continue;
    out.push({
      kind: "large",
      id: row.id,
      name: String(row.name || row.userId || row.id),
      count: 1,
      sums: [{ currency, count: 1, amount: round2(amount) }],
    });
  }
  return out;
}

export function readCount(raw: unknown): number {
  const count = Number(raw);
  if (!Number.isFinite(count) || count < 2) return 3;
  return Math.min(99, Math.floor(count));
}

export function frequentFlags(rows: readonly CashRow[], minCount: number): RiskFlag[] {
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
  const out: RiskFlag[] = [];
  for (const userId of Object.keys(grouped)) {
    const list = grouped[userId];
    if (list.length < limit) continue;
    out.push({ kind: "frequent", id: userId, name: names[userId] || userId, count: list.length, sums: sumsOf(list) });
  }
  return out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function kycFlags(
  people: readonly { id: string; name?: string | null; documentsStatus?: string | null }[],
  deposits: readonly CashRow[],
): RiskFlag[] {
  const out: RiskFlag[] = [];
  for (const person of people) {
    if (String(person.documentsStatus || "").toUpperCase() !== "PENDING") continue;
    const mine = deposits.filter((row) => row.userId === person.id);
    if (!mine.length) continue;
    out.push({ kind: "kyc", id: person.id, name: String(person.name || person.id), count: mine.length, sums: sumsOf(mine) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterFlags(flags: readonly RiskFlag[], kind: "" | RiskKind, text: string): RiskFlag[] {
  const query = text.trim().toLowerCase();
  return flags.filter((flag) => {
    if (kind && flag.kind !== kind) return false;
    if (!query) return true;
    return flag.name.toLowerCase().includes(query);
  });
}

export function readNotes(raw: unknown): Record<string, ReviewNote> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, ReviewNote> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as { body?: unknown; at?: unknown };
    const body = String(row.body || "").trim();
    if (!body) continue;
    out[key] = { body: body.slice(0, 500), at: String(row.at || "") };
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

export function pendingDoc<T extends { traderId?: string | null; status?: string | null }>(docs: readonly T[], userId: string): T | null {
  return docs.find((doc) => String(doc.traderId || "") === userId && String(doc.status || "").toUpperCase() === "PENDING") || null;
}

export function dayKey(at: string): string {
  const day = String(at || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

export function groupDays<T extends { at: string }>(items: readonly T[]): { day: string; items: T[] }[] {
  const map: Record<string, T[]> = {};
  const sorted = [...items].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  for (const item of sorted) {
    const key = dayKey(item.at);
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  const keys = Object.keys(map).sort((a, b) => {
    if (!a) return 1;
    if (!b) return -1;
    return b.localeCompare(a);
  });
  return keys.map((key) => ({ day: key, items: map[key] }));
}

export function findDay(days: readonly string[], query: string): string {
  const day = String(query || "").slice(0, 10);
  return days.includes(day) ? day : "";
}

export function filterKind<T extends { kind: string }>(items: readonly T[], kind: string): T[] {
  if (!kind) return items.slice();
  return items.filter((item) => item.kind === kind);
}
