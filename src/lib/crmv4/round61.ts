/** Introducer deposits and the local route history. Currencies are never added together. */

export const MARK_KEY = "crmv4-ib-marks";
export const JUMP_KEY = "crmv4-jump-history";

export const COMM_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  affiliateA?: string | null;
  affiliateB?: string | null;
  affiliateC?: string | null;
};

export type Cash = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  createdAt?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null } | null;
};

export type CommRow = {
  id: string;
  affiliate: string;
  name: string;
  userId: string;
  amount: number | null;
  currency: string;
  status: string;
  createdAt: string;
};

export type CurrencyTotal = { currency: string; count: number; amount: number };

export type PayoutMark = { id: string; reason?: string; at: string };

export type Jump = { sectionId: string; pinned: boolean; at: string };

export function introducerOf(person: Person | undefined): string {
  if (!person) return "";
  return String(person.affiliateA || person.affiliateB || person.affiliateC || "").trim();
}

/** A card is a loaded deposit whose customer is on the loaded page and has an introducer code. */
export function commissionRows(people: readonly Person[], deposits: readonly Cash[]): CommRow[] {
  const byId = new Map<string, Person>();
  for (const person of people) if (person.id) byId.set(person.id, person);
  const out: CommRow[] = [];
  for (const row of deposits) {
    const id = String(row.id || "").trim();
    const userId = String(row.user?.id || row.userId || "").trim();
    if (!id || !userId) continue;
    const person = byId.get(userId);
    const affiliate = introducerOf(person);
    if (!person || !affiliate) continue;
    const amount = Number(row.amount);
    out.push({
      id,
      affiliate,
      name: String(person.name || person.email || "").trim(),
      userId,
      amount: Number.isFinite(amount) ? amount : null,
      currency: String(row.currency || "").trim().toUpperCase(),
      status: String(row.status || "").trim().toUpperCase(),
      createdAt: String(row.createdAt || ""),
    });
  }
  return out;
}

export function filterComm(rows: readonly CommRow[], status: string, query: string): CommRow[] {
  const want = status.trim().toUpperCase();
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (want && row.status !== want) return false;
    if (!text) return true;
    return `${row.affiliate} ${row.name} ${row.currency} ${row.status}`.toLowerCase().includes(text);
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** One total per currency. A missing currency stays on its own line. */
export function currencyTotals(rows: readonly CommRow[]): CurrencyTotal[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const prev = map.get(row.currency) || { count: 0, amount: 0 };
    prev.count += 1;
    if (row.amount != null) prev.amount = round2(prev.amount + row.amount);
    map.set(row.currency, prev);
  }
  const out: CurrencyTotal[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function readMarks(raw: unknown): PayoutMark[] {
  if (!Array.isArray(raw)) return [];
  const out: PayoutMark[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PayoutMark>;
    const id = String(row.id || "").trim();
    if (!id || out.some((mark) => mark.id === id)) continue;
    const reason = cleanLine(String(row.reason || ""));
    out.push({ id, ...(reason ? { reason } : {}), at: String(row.at || "") });
  }
  return out.slice(0, 200);
}

/** A blank reason is left out. The mark stays in this browser and does not pay. */
export function markPayout(marks: readonly PayoutMark[], id: string, reason: string, at: string): PayoutMark[] {
  const nextId = String(id || "").trim();
  if (!nextId) return marks.slice();
  const text = cleanLine(reason);
  const rest = marks.filter((mark) => mark.id !== nextId);
  return [{ id: nextId, ...(text ? { reason: text } : {}), at }, ...rest].slice(0, 200);
}

export function readJumps(raw: unknown): Jump[] {
  if (!Array.isArray(raw)) return [];
  const out: Jump[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Jump>;
    const sectionId = String(row.sectionId || "").trim();
    if (!sectionId || out.some((jump) => jump.sectionId === sectionId)) continue;
    out.push({ sectionId, pinned: row.pinned === true, at: String(row.at || "") });
  }
  return out.slice(0, 24);
}

/** A route that is not a desk section is ignored. A repeat updates the time and keeps the pin. */
export function pushJump(jumps: readonly Jump[], sectionId: string, at: string, allowed: readonly string[]): Jump[] {
  const id = String(sectionId || "").trim();
  if (!id || !allowed.includes(id)) return jumps.slice();
  const current = jumps.find((jump) => jump.sectionId === id);
  const next: Jump = { sectionId: id, pinned: current?.pinned === true, at };
  return [next, ...jumps.filter((jump) => jump.sectionId !== id)].slice(0, 24);
}

export function toggleJumpPin(jumps: readonly Jump[], sectionId: string): Jump[] {
  return jumps.map((jump) => (jump.sectionId === sectionId ? { ...jump, pinned: !jump.pinned } : jump));
}

/** Clear removes unpinned routes. Pinned routes stay. */
export function clearUnpinned(jumps: readonly Jump[]): Jump[] {
  return jumps.filter((jump) => jump.pinned);
}

export function visibleJumps(jumps: readonly Jump[], query: string): Jump[] {
  const text = query.trim().toLowerCase();
  return jumps
    .filter((jump) => !text || jump.sectionId.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
