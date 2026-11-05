/** Local shift handoff notes, and deposit counts grouped by the currency already on each row. */

export const NOTE_KEY = "crmv4-handoff-polish";
export const CCY_HIDE_KEY = "crmv4-deposit-currency-hide";

export type Note = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
};

export type CashValue = { currency?: unknown } | string | null | undefined;

export type CashRow = { currency?: CashValue; label?: string | null };

export type CurrencyLine = { currency: string; count: number };

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function readNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const out: Note[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Note>;
    const id = String(row.id || "").trim();
    const text = noteText(row.text);
    if (!id || !text || out.some((note) => note.id === id)) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, pinned: false, hidden: false }, ...current].slice(0, 40);
}

export function toggleNotePin(notes: readonly Note[], id: string): Note[] {
  return readNotes(notes).map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function setNoteHidden(notes: readonly Note[], id: string, hidden: boolean): Note[] {
  return readNotes(notes).map((note) => (note.id === id ? { ...note, hidden } : note));
}

export function resetNotes(): Note[] {
  return [];
}

export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The currency already on the row. A missing or unreadable value stays blank. */
export function currencyCode(value: CashValue): string {
  const raw = typeof value === "string" || value == null
    ? value
    : value && typeof value === "object"
      ? value.currency
      : "";
  if (typeof raw !== "string") return "";
  const text = raw.replace(/\s+/g, "").trim();
  return /^[A-Za-z]{3,8}$/.test(text) ? text.toUpperCase() : "";
}

export function currencyLines(rows: readonly CashRow[]): CurrencyLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const currency = currencyCode(row.currency);
    map.set(currency, (map.get(currency) || 0) + 1);
  }
  const out: CurrencyLine[] = [];
  map.forEach((count, currency) => out.push({ currency, count }));
  return out.sort((a, b) => {
    if (!a.currency) return -1;
    if (!b.currency) return 1;
    return a.currency.localeCompare(b.currency);
  });
}

export function namedCurrencies(rows: readonly CashRow[]): string[] {
  return currencyLines(rows).map((line) => line.currency).filter(Boolean);
}

export function readHiddenCurrencies(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => currencyCode(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const currency = currencyCode(String(item || ""));
    if (!currency || !allow.has(currency) || out.includes(currency)) continue;
    out.push(currency);
  }
  return out;
}

export function toggleCurrency(hidden: readonly string[], currency: string, present: readonly string[]): string[] {
  const current = readHiddenCurrencies(hidden, present);
  const next = currencyCode(currency);
  if (!next || !present.map((item) => currencyCode(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleCurrencies(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCurrencies(hidden, present));
  return namedCurrencies(present.map((currency) => ({ currency }))).filter((currency) => (showHidden ? gone.has(currency) : !gone.has(currency)));
}

export function activeCurrency(selected: string, visible: readonly string[]): string {
  const currency = currencyCode(selected);
  if (!currency) return "";
  return visible.some((item) => currencyCode(item) === currency) ? currency : "";
}

export function visibleDeposits<T extends CashRow>(rows: readonly T[], currency: string, blank: boolean, query: string): T[] {
  const want = currencyCode(currency);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = currencyCode(row.currency);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
