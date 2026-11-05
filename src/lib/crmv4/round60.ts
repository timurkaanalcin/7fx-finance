/** Customer health from loaded fields, and the local scratchboard. Currencies are never added together. */

export const WATCH_KEY = "crmv4-health-watch";
export const SCRATCH_KEY = "crmv4-scratchboard";
export const ACTIVITY_DAYS = 14;

export type HealthRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  desk?: string | null;
  documentsStatus?: string | null;
  ftd?: boolean | null;
  lastSeenAt?: string | null;
  lastLoginAt?: string | null;
  lastContactAt?: string | null;
  balance?: number | null;
  currency?: string | null;
};

export type HealthMark = {
  score: number;
  max: 3;
  kyc: string;
  deposit: boolean;
  activity: "recent" | "quiet" | "none";
};

export type CurrencyTotal = { currency: string; count: number; amount: number };

export type ScratchNote = {
  id: string;
  body: string;
  pinned: boolean;
  archived: boolean;
  at: string;
};

export function kycStatus(row: { documentsStatus?: string | null }): string {
  return String(row.documentsStatus || "").trim().toUpperCase();
}

export function latestActivity(row: Pick<HealthRow, "lastSeenAt" | "lastLoginAt" | "lastContactAt">): number | null {
  const times = [row.lastSeenAt, row.lastLoginAt, row.lastContactAt]
    .map((value) => Date.parse(String(value || "")))
    .filter((value) => Number.isFinite(value));
  if (!times.length) return null;
  return Math.max(...times);
}

/** One point for approved KYC, one for the loaded first-deposit flag, one for activity inside the window. */
export function healthMark(row: HealthRow, now = Date.now(), days = ACTIVITY_DAYS): HealthMark {
  const kyc = kycStatus(row);
  const deposit = row.ftd === true;
  const latest = latestActivity(row);
  const activity = latest == null ? "none" : latest >= now - days * 86400000 ? "recent" : "quiet";
  let score = 0;
  if (kyc === "APPROVED") score += 1;
  if (deposit) score += 1;
  if (activity === "recent") score += 1;
  return { score, max: 3, kyc, deposit, activity };
}

export function filterHealth(rows: readonly HealthRow[], query: string, score: string, now = Date.now()): HealthRow[] {
  const text = query.trim().toLowerCase();
  const want = score.trim();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (want && String(healthMark(row, now).score) !== want) return false;
    if (!text) return true;
    return `${row.name || ""} ${row.email || ""} ${row.desk || ""} ${kycStatus(row)} ${row.currency || ""}`.toLowerCase().includes(text);
  });
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

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function sortHealth(rows: readonly HealthRow[], pins: readonly string[], now = Date.now()): HealthRow[] {
  return rows.slice().sort((a, b) => {
    const ap = pins.includes(a.id);
    const bp = pins.includes(b.id);
    if (ap !== bp) return ap ? -1 : 1;
    const score = healthMark(b, now).score - healthMark(a, now).score;
    if (score) return score;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function visibleHealth(rows: readonly HealthRow[], query: string, score: string, pins: readonly string[], now = Date.now()): HealthRow[] {
  return sortHealth(filterHealth(rows, query, score, now), pins, now);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** One total per currency. A missing currency stays on its own line. */
export function balanceTotals(rows: readonly HealthRow[]): CurrencyTotal[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(row.balance);
    if (Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: CurrencyTotal[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 280);
}

export function readNotes(raw: unknown): ScratchNote[] {
  if (!Array.isArray(raw)) return [];
  const out: ScratchNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ScratchNote>;
    const id = String(row.id || "").trim();
    const body = cleanLine(String(row.body || ""));
    if (!id || !body || out.some((note) => note.id === id)) continue;
    out.push({ id, body, pinned: row.pinned === true, archived: row.archived === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addNote(notes: readonly ScratchNote[], note: { id: string; body: string; at: string }): ScratchNote[] {
  const id = String(note.id || "").trim();
  const body = cleanLine(note.body);
  if (!id || !body || notes.some((item) => item.id === id)) return notes.slice();
  return [{ id, body, pinned: false, archived: false, at: note.at }, ...notes].slice(0, 80);
}

export function togglePin(notes: readonly ScratchNote[], id: string): ScratchNote[] {
  return notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function archiveNote(notes: readonly ScratchNote[], id: string, archived: boolean): ScratchNote[] {
  return notes.map((note) => (note.id === id ? { ...note, archived } : note));
}

export function removeNote(notes: readonly ScratchNote[], id: string): ScratchNote[] {
  return notes.filter((note) => note.id !== id);
}

export function visibleNotes(notes: readonly ScratchNote[], query: string, archived: boolean): ScratchNote[] {
  const text = query.trim().toLowerCase();
  return notes
    .filter((note) => note.archived === archived && (!text || note.body.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
