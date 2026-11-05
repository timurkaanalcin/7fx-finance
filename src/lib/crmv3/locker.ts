/** Local locker notes, and trade counts grouped by the symbol already on each row. */

export const LOCKER_KEY = "crmv3-locker-notes";
export const TRADE_SYMBOL_KEY = "crmv3-trade-symbol-hide";

export type Note = {
  id: string;
  text: string;
  tag: string;
  pinned: boolean;
  hidden: boolean;
};

export type SymbolValue = { symbol?: unknown } | string | null | undefined;

export type SymbolRow = { symbol?: SymbolValue; label?: string | null };

export type SymbolLine = { symbol: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank key or tag label stays blank. It is not filled in. */
export function tagLabel(raw: unknown): string {
  return clip(raw, 40);
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
    out.push({ id, text, tag: tagLabel(row.tag), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; tag?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const tag = tagLabel(note.tag);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, tag, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The key or tag label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The symbol string already on the row. A number or a price is not a symbol. */
export function symbolText(value: SymbolValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && typeof value.symbol === "string") return value.symbol.replace(/\s+/g, " ").trim();
  return "";
}

export function symbolLines(rows: readonly SymbolRow[]): SymbolLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const symbol = symbolText(row.symbol);
    map.set(symbol, (map.get(symbol) || 0) + 1);
  }
  const out: SymbolLine[] = [];
  map.forEach((count, symbol) => out.push({ symbol, count }));
  return out.sort((a, b) => {
    if (!a.symbol) return -1;
    if (!b.symbol) return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}

export function namedSymbols(rows: readonly SymbolRow[]): string[] {
  return symbolLines(rows).map((line) => line.symbol).filter(Boolean);
}

export function readHiddenSymbols(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => symbolText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const symbol = symbolText(String(item || ""));
    if (!symbol || !allow.has(symbol) || out.includes(symbol)) continue;
    out.push(symbol);
  }
  return out;
}

export function toggleSymbol(hidden: readonly string[], symbol: string, present: readonly string[]): string[] {
  const current = readHiddenSymbols(hidden, present);
  const next = symbolText(symbol);
  if (!next || !present.map((item) => symbolText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSymbols(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSymbols(hidden, present));
  return namedSymbols(present.map((symbol) => ({ symbol }))).filter((symbol) => (showHidden ? gone.has(symbol) : !gone.has(symbol)));
}

export function activeSymbol(selected: string, visible: readonly string[]): string {
  const symbol = symbolText(selected);
  if (!symbol) return "";
  return visible.some((item) => symbolText(item) === symbol) ? symbol : "";
}

export function visibleTrades<T extends SymbolRow>(rows: readonly T[], symbol: string, blank: boolean, query: string): T[] {
  const want = symbolText(symbol);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = symbolText(row.symbol);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
