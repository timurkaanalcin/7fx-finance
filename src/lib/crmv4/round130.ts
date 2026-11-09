/** Local concierge notes, and customer counts grouped by the retention status already on each row. */

export const CONCIERGE_KEY = "crmv4-concierge-notes";
export const RETAIN_KEY = "crmv4-ret-hide";

export type Note = {
  id: string;
  text: string;
  errand: string;
  pinned: boolean;
  hidden: boolean;
};

export type RetainValue =
  | { retain?: unknown; saleStatus?: unknown; documentsStatus?: unknown; status?: unknown; role?: unknown }
  | string
  | null
  | undefined;

export type RetainRow = { retain?: RetainValue; label?: string | null };

export type RetainLine = { retain: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank errand label stays blank. It is not filled in. */
export function errandLabel(raw: unknown): string {
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
    out.push({ id, text, errand: errandLabel(row.errand), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; errand?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const errand = errandLabel(note.errand);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, errand, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The errand label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/**
 * The retention status already on the trader row.
 * A sale status, a KYC status, a role, or a number is not retention.
 */
export function retainText(value: RetainValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if ("saleStatus" in value || "documentsStatus" in value || "status" in value || "role" in value) return "";
  return typeof value.retain === "string" ? value.retain.replace(/\s+/g, " ").trim() : "";
}

export function retainLines(rows: readonly RetainRow[]): RetainLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const retain = retainText(row.retain);
    map.set(retain, (map.get(retain) || 0) + 1);
  }
  const out: RetainLine[] = [];
  map.forEach((count, retain) => out.push({ retain, count }));
  return out.sort((a, b) => {
    if (!a.retain) return -1;
    if (!b.retain) return 1;
    return a.retain.localeCompare(b.retain);
  });
}

export function namedRetains(rows: readonly RetainRow[]): string[] {
  return retainLines(rows).map((line) => line.retain).filter(Boolean);
}

export function readHiddenRetains(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => retainText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const retain = retainText(String(item || ""));
    if (!retain || !allow.has(retain) || out.includes(retain)) continue;
    out.push(retain);
  }
  return out;
}

export function toggleRetain(hidden: readonly string[], retain: string, present: readonly string[]): string[] {
  const current = readHiddenRetains(hidden, present);
  const next = retainText(retain);
  if (!next || !present.map((item) => retainText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleRetains(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenRetains(hidden, present));
  return namedRetains(present.map((retain) => ({ retain }))).filter((retain) => (showHidden ? gone.has(retain) : !gone.has(retain)));
}

export function activeRetain(selected: string, visible: readonly string[]): string {
  const retain = retainText(selected);
  if (!retain) return "";
  return visible.some((item) => retainText(item) === retain) ? retain : "";
}

export function visibleCustomers<T extends RetainRow>(rows: readonly T[], retain: string, blank: boolean, query: string): T[] {
  const want = retainText(retain);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = retainText(row.retain);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
