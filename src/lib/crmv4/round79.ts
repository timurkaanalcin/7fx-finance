/** Local call notes for a loaded customer, and a single-currency filter over loaded money rows. */

export const PACK_KEY = "crmv4-call-pack";
export const CHIP_KEY = "crmv4-currency-hide";

export type Note = {
  id: string;
  customerId: string;
  body: string;
  when: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type AmountRow = {
  currency?: string | null;
  amount?: number | null;
};

export type CurrencyLine = {
  currency: string;
  count: number;
  amount: number;
};

export function cleanNote(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function cleanWhen(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 40);
}

export function currencyCode(raw: string | null | undefined): string {
  const code = String(raw || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function readNotes(raw: unknown, known: readonly string[]): Note[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(known.map((id) => String(id || "").trim()).filter(Boolean));
  const out: Note[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Note>;
    const id = String(row.id || "").trim();
    const customerId = String(row.customerId || "").trim();
    const body = cleanNote(String(row.body || ""));
    if (!id || !customerId || !body || !allow.has(customerId) || out.some((note) => note.id === id)) continue;
    out.push({
      id,
      customerId,
      body,
      when: cleanWhen(String(row.when || "")),
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      at: String(row.at || ""),
    });
  }
  return out.slice(0, 80);
}

export function addNote(
  notes: readonly Note[],
  note: { id: string; customerId: string; body: string; when: string; at: string },
  known: readonly string[],
): Note[] {
  const id = String(note.id || "").trim();
  const customerId = String(note.customerId || "").trim();
  const body = cleanNote(note.body);
  if (!id || !customerId || !body || !known.includes(customerId) || notes.some((item) => item.id === id)) return notes.slice();
  return [{ id, customerId, body, when: cleanWhen(note.when), pinned: false, hidden: false, at: note.at }, ...notes].slice(0, 80);
}

export function toggleNotePin(notes: readonly Note[], id: string): Note[] {
  return notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note));
}

export function setNoteHidden(notes: readonly Note[], id: string, hidden: boolean): Note[] {
  return notes.map((note) => (note.id === id ? { ...note, hidden } : note));
}

export function visibleNotes(notes: readonly Note[], query: string, hidden: boolean, names: Record<string, string> = {}): Note[] {
  const text = query.trim().toLowerCase();
  return notes
    .filter((note) => {
      if (note.hidden !== hidden) return false;
      if (!text) return true;
      const name = names[note.customerId] || "";
      return `${note.body} ${note.when} ${name}`.toLowerCase().includes(text);
    })
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}

/** Codes that appear on the loaded rows. A blank or malformed code never becomes a chip. */
export function currencyCodes(rows: readonly AmountRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const code = currencyCode(row.currency);
    if (code && !out.includes(code)) out.push(code);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function readHidden(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(currencyCodes(present.map((code) => ({ currency: code }))));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const code = currencyCode(String(item || ""));
    if (!code || !allow.has(code) || out.includes(code)) continue;
    out.push(code);
  }
  return out;
}

export function toggleCode(hidden: readonly string[], code: string, present: readonly string[]): string[] {
  const current = readHidden(hidden, present);
  const next = currencyCode(code);
  const allow = present.map((item) => currencyCode(item));
  if (!next || !allow.includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleCodes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHidden(hidden, present));
  return currencyCodes(present.map((code) => ({ currency: code }))).filter((code) => (showHidden ? gone.has(code) : !gone.has(code)));
}

/** A selected code that is not on the open chips is cleared, so a hidden chip cannot stay active. */
export function activeCode(selected: string, visible: readonly string[]): string {
  const code = currencyCode(selected);
  if (!code) return "";
  return visible.some((item) => currencyCode(item) === code) ? code : "";
}

export function filterRows<T extends AmountRow>(rows: readonly T[], code: string): T[] {
  if (!String(code || "").trim()) return rows.slice();
  const currency = currencyCode(code);
  if (!currency) return [];
  return rows.filter((row) => currencyCode(row.currency) === currency);
}

/** One line per code. A row with no code is counted apart and its amount is not added. */
export function currencyLines(rows: readonly AmountRow[]): CurrencyLine[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const currency = currencyCode(row.currency);
    const prev = map.get(currency) || { count: 0, amount: 0 };
    prev.count += 1;
    const amount = Number(row.amount);
    if (currency && Number.isFinite(amount)) prev.amount = round2(prev.amount + amount);
    map.set(currency, prev);
  }
  const out: CurrencyLine[] = [];
  map.forEach((value, currency) => out.push({ currency, count: value.count, amount: value.amount }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

/** A total only when every row shares the given code. Mixed rows return null. */
export function singleTotal(rows: readonly AmountRow[], code: string): { currency: string; count: number; amount: number } | null {
  const currency = currencyCode(code);
  if (!currency) return null;
  let count = 0;
  let amount = 0;
  for (const row of rows) {
    if (currencyCode(row.currency) !== currency) return null;
    count += 1;
    const value = Number(row.amount);
    if (Number.isFinite(value)) amount = round2(amount + value);
  }
  return { currency, count, amount };
}

export function visibleMoney<T extends AmountRow & { label?: string | null }>(rows: readonly T[], code: string, query: string): T[] {
  const text = query.trim().toLowerCase();
  return filterRows(rows, code).filter((row) => !text || String(row.label || "").toLowerCase().includes(text));
}
