/** Payout review board and the local shift sheet. Currencies are never added together. */

export const SHIFT_KEY = "crmv4-shift-handoff";

export const PAY_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export type PayRow = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  method?: string | null;
  createdAt?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

export type CurrencyTotal = { currency: string; count: number; amount: number };

export type ShiftNote = {
  id: string;
  open: string;
  watch: string;
  pinned: boolean;
  at: string;
};

export function payStatus(row: { status?: string | null }): string {
  return String(row.status || "").trim().toUpperCase();
}

export function filterPays(rows: readonly PayRow[], status: string, query: string): PayRow[] {
  const want = status.trim().toUpperCase();
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!row.id) return false;
    if (want && payStatus(row) !== want) return false;
    if (!text) return true;
    return `${row.user?.name || ""} ${row.user?.email || ""} ${row.method || ""} ${row.currency || ""}`.toLowerCase().includes(text);
  });
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** One total per currency. A missing currency stays on its own line. */
export function currencyTotals(rows: readonly PayRow[]): CurrencyTotal[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: CurrencyTotal[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function payLabel(row: PayRow): string {
  const name = String(row.user?.name || row.user?.email || "").trim();
  const amount = Number(row.amount);
  const money = Number.isFinite(amount) ? String(amount) : "";
  const currency = String(row.currency || "").trim().toUpperCase();
  return [name, money, currency].filter(Boolean).join(" · ");
}

export function cleanLine(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function readShift(raw: unknown): ShiftNote[] {
  if (!Array.isArray(raw)) return [];
  const out: ShiftNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ShiftNote>;
    const id = String(row.id || "").trim();
    const open = cleanLine(String(row.open || ""));
    const watch = cleanLine(String(row.watch || ""));
    if (!id || (!open && !watch)) continue;
    if (out.some((note) => note.id === id)) continue;
    out.push({ id, open, watch, pinned: row.pinned === true, at: String(row.at || "") });
  }
  return out.slice(0, 80);
}

export function addShift(notes: readonly ShiftNote[], note: { id: string; open: string; watch: string; at: string }): ShiftNote[] {
  const id = String(note.id || "").trim();
  const open = cleanLine(note.open);
  const watch = cleanLine(note.watch);
  if (!id || (!open && !watch) || notes.some((item) => item.id === id)) return notes.slice();
  return [{ id, open, watch, pinned: false, at: note.at }, ...notes].slice(0, 80);
}

export function toggleShiftPin(notes: readonly ShiftNote[], id: string): ShiftNote[] {
  return notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function clearShift(notes: readonly ShiftNote[], id: string): ShiftNote[] {
  return notes.filter((note) => note.id !== id);
}

export function sortShift(notes: readonly ShiftNote[]): ShiftNote[] {
  return notes.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return String(b.at).localeCompare(String(a.at));
  });
}

export function searchShift(notes: readonly ShiftNote[], query: string): ShiftNote[] {
  const text = query.trim().toLowerCase();
  const rows = text
    ? notes.filter((note) => `${note.open} ${note.watch}`.toLowerCase().includes(text))
    : notes.slice();
  return sortShift(rows);
}
