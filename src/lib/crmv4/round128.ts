/** Local pantry notes, and account counts grouped by the type already on each row. */

export const PANTRY_KEY = "crmv4-pantry-notes";
export const ACCOUNT_TYPE_KEY = "crmv4-acct-type-hide";

export type Note = {
  id: string;
  text: string;
  shelf: string;
  pinned: boolean;
  hidden: boolean;
};

export type TypeValue = { type?: unknown } | string | null | undefined;

export type TypeRow = { type?: TypeValue; label?: string | null };

export type TypeLine = { type: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank shelf or bin label stays blank. It is not filled in. */
export function shelfLabel(raw: unknown): string {
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
    out.push({ id, text, shelf: shelfLabel(row.shelf), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; shelf?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const shelf = shelfLabel(note.shelf);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, shelf, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The shelf or bin label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The account type string already on the row. A number, a role, or another field is not a type. */
export function typeText(value: TypeValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && typeof value.type === "string") return value.type.replace(/\s+/g, " ").trim();
  return "";
}

export function typeLines(rows: readonly TypeRow[]): TypeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const type = typeText(row.type);
    map.set(type, (map.get(type) || 0) + 1);
  }
  const out: TypeLine[] = [];
  map.forEach((count, type) => out.push({ type, count }));
  return out.sort((a, b) => {
    if (!a.type) return -1;
    if (!b.type) return 1;
    return a.type.localeCompare(b.type);
  });
}

export function namedTypes(rows: readonly TypeRow[]): string[] {
  return typeLines(rows).map((line) => line.type).filter(Boolean);
}

export function readHiddenTypes(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => typeText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const type = typeText(String(item || ""));
    if (!type || !allow.has(type) || out.includes(type)) continue;
    out.push(type);
  }
  return out;
}

export function toggleType(hidden: readonly string[], type: string, present: readonly string[]): string[] {
  const current = readHiddenTypes(hidden, present);
  const next = typeText(type);
  if (!next || !present.map((item) => typeText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleTypes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTypes(hidden, present));
  return namedTypes(present.map((type) => ({ type }))).filter((type) => (showHidden ? gone.has(type) : !gone.has(type)));
}

export function activeType(selected: string, visible: readonly string[]): string {
  const type = typeText(selected);
  if (!type) return "";
  return visible.some((item) => typeText(item) === type) ? type : "";
}

export function visibleUsers<T extends TypeRow>(rows: readonly T[], type: string, blank: boolean, query: string): T[] {
  const want = typeText(type);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = typeText(row.type);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
