/** Local visitor notes, and deposit counts grouped by the method already on each row. */

export const VISITOR_KEY = "crmv4-visitor-notes";
export const DEP_METHOD_KEY = "crmv4-dep-glance-hide";

/** Label, then method type, then network channel. An amount is not a method. */
export const METHOD_FIELDS = ["label", "type", "network"] as const;

export type Note = {
  id: string;
  text: string;
  badge: string;
  pinned: boolean;
  hidden: boolean;
};

export type MethodValue = { label?: unknown; type?: unknown; network?: unknown } | string | null | undefined;

export type MethodRow = { method?: MethodValue; label?: string | null };

export type MethodLine = { method: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank badge or pass label stays blank. It is not filled in. */
export function badgeLabel(raw: unknown): string {
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
    out.push({ id, text, badge: badgeLabel(row.badge), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; badge?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const badge = badgeLabel(note.badge);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, badge, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The badge or pass label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The method label, then the type, then the network channel. A number is not a method. */
export function methodText(value: MethodValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  for (const field of METHOD_FIELDS) {
    const text = plain(row[field]);
    if (text) return text;
  }
  return "";
}

export function methodLines(rows: readonly MethodRow[]): MethodLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const method = methodText(row.method);
    map.set(method, (map.get(method) || 0) + 1);
  }
  const out: MethodLine[] = [];
  map.forEach((count, method) => out.push({ method, count }));
  return out.sort((a, b) => {
    if (!a.method) return -1;
    if (!b.method) return 1;
    return a.method.localeCompare(b.method);
  });
}

export function namedMethods(rows: readonly MethodRow[]): string[] {
  return methodLines(rows).map((line) => line.method).filter(Boolean);
}

export function readHiddenMethods(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => methodText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const method = methodText(String(item || ""));
    if (!method || !allow.has(method) || out.includes(method)) continue;
    out.push(method);
  }
  return out;
}

export function toggleMethod(hidden: readonly string[], method: string, present: readonly string[]): string[] {
  const current = readHiddenMethods(hidden, present);
  const next = methodText(method);
  if (!next || !present.map((item) => methodText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleMethods(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMethods(hidden, present));
  return namedMethods(present.map((method) => ({ method }))).filter((method) => (showHidden ? gone.has(method) : !gone.has(method)));
}

export function activeMethod(selected: string, visible: readonly string[]): string {
  const method = methodText(selected);
  if (!method) return "";
  return visible.some((item) => methodText(item) === method) ? method : "";
}

export function visibleDeposits<T extends MethodRow>(rows: readonly T[], method: string, blank: boolean, query: string): T[] {
  const want = methodText(method);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = methodText(row.method);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
