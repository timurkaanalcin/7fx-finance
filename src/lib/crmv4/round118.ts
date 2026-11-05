/** Local parking notes, and lead counts grouped by the source already on each row. */

export const PARK_KEY = "crmv4-parking-notes";
export const LEAD_SOURCE_KEY = "crmv4-lead-src-hide";

/** Fields the loaded membership row already carries. A missing field is not filled in. */
export const SOURCE_FIELDS = ["campaign", "affiliateA", "affiliateB", "affiliateC", "referralCodeUsed"] as const;

export type Note = {
  id: string;
  text: string;
  bay: string;
  pinned: boolean;
  hidden: boolean;
};

export type SourceValue = { campaign?: unknown; affiliateA?: unknown; affiliateB?: unknown; affiliateC?: unknown; referralCodeUsed?: unknown } | string | null | undefined;

export type SourceRow = { source?: SourceValue; label?: string | null };

export type SourceLine = { source: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank bay or lot label stays blank. It is not filled in. */
export function bayLabel(raw: unknown): string {
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
    out.push({ id, text, bay: bayLabel(row.bay), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; bay?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const bay = bayLabel(note.bay);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, bay, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The bay or lot label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The first source string already on the row. A number or an absent field is not a source. */
export function sourceText(value: SourceValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  for (const field of SOURCE_FIELDS) {
    const raw = row[field];
    if (typeof raw !== "string") continue;
    const text = raw.replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

export function sourceLines(rows: readonly SourceRow[]): SourceLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const source = sourceText(row.source);
    map.set(source, (map.get(source) || 0) + 1);
  }
  const out: SourceLine[] = [];
  map.forEach((count, source) => out.push({ source, count }));
  return out.sort((a, b) => {
    if (!a.source) return -1;
    if (!b.source) return 1;
    return a.source.localeCompare(b.source);
  });
}

export function namedSources(rows: readonly SourceRow[]): string[] {
  return sourceLines(rows).map((line) => line.source).filter(Boolean);
}

export function readHiddenSources(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => sourceText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const source = sourceText(String(item || ""));
    if (!source || !allow.has(source) || out.includes(source)) continue;
    out.push(source);
  }
  return out;
}

export function toggleSource(hidden: readonly string[], source: string, present: readonly string[]): string[] {
  const current = readHiddenSources(hidden, present);
  const next = sourceText(source);
  if (!next || !present.map((item) => sourceText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSources(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSources(hidden, present));
  return namedSources(present.map((source) => ({ source }))).filter((source) => (showHidden ? gone.has(source) : !gone.has(source)));
}

export function activeSource(selected: string, visible: readonly string[]): string {
  const source = sourceText(selected);
  if (!source) return "";
  return visible.some((item) => sourceText(item) === source) ? source : "";
}

export function visibleLeads<T extends SourceRow>(rows: readonly T[], source: string, blank: boolean, query: string): T[] {
  const want = sourceText(source);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = sourceText(row.source);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
