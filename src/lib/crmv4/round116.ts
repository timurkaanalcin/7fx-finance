/** Local callback notes, and ticket counts grouped by the priority already on each row. */

export const CALLBACK_KEY = "crmv4-callback-polish";
export const PRIORITY_HIDE_KEY = "crmv4-case-priority-polish-hide";

export type Note = {
  id: string;
  text: string;
  when: string;
  pinned: boolean;
  hidden: boolean;
};

export type PriorityValue = { priority?: unknown } | string | number | null | undefined;

export type PriorityRow = { priority?: PriorityValue; label?: string | null };

export type PriorityLine = { priority: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank phone or time label stays blank. It is not filled in. */
export function whenLabel(raw: unknown): string {
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
    out.push({ id, text, when: whenLabel(row.when), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; when?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const when = whenLabel(note.when);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, when, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The priority already on the row. Kind and status are not a priority. */
export function priorityText(value: PriorityValue): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && "priority" in value) return priorityText(value.priority as PriorityValue);
  return "";
}

export function priorityLines(rows: readonly PriorityRow[]): PriorityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const priority = priorityText(row.priority);
    map.set(priority, (map.get(priority) || 0) + 1);
  }
  const out: PriorityLine[] = [];
  map.forEach((count, priority) => out.push({ priority, count }));
  return out.sort((a, b) => {
    if (!a.priority) return -1;
    if (!b.priority) return 1;
    return a.priority.localeCompare(b.priority);
  });
}

export function namedPriorities(rows: readonly PriorityRow[]): string[] {
  return priorityLines(rows).map((line) => line.priority).filter(Boolean);
}

export function readHiddenPriorities(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => priorityText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const priority = priorityText(String(item || ""));
    if (!priority || !allow.has(priority) || out.includes(priority)) continue;
    out.push(priority);
  }
  return out;
}

export function togglePriority(hidden: readonly string[], priority: string, present: readonly string[]): string[] {
  const current = readHiddenPriorities(hidden, present);
  const next = priorityText(priority);
  if (!next || !present.map((item) => priorityText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visiblePriorities(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenPriorities(hidden, present));
  return namedPriorities(present.map((priority) => ({ priority }))).filter((priority) => (showHidden ? gone.has(priority) : !gone.has(priority)));
}

export function activePriority(selected: string, visible: readonly string[]): string {
  const priority = priorityText(selected);
  if (!priority) return "";
  return visible.some((item) => priorityText(item) === priority) ? priority : "";
}

export function visibleCases<T extends PriorityRow>(rows: readonly T[], priority: string, blank: boolean, query: string): T[] {
  const want = priorityText(priority);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = priorityText(row.priority);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
