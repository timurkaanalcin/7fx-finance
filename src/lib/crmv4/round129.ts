/** Local coat check notes, and document counts grouped by the owner's KYC file status. */

export const COAT_KEY = "crmv4-coat-notes";
export const KYC_FILE_KEY = "crmv4-kyc-file-hide";

export type Note = {
  id: string;
  text: string;
  hook: string;
  pinned: boolean;
  hidden: boolean;
};

export type FileValue = { kyc?: unknown; file?: unknown; status?: unknown; docType?: unknown; type?: unknown } | string | null | undefined;

export type FileRow = { file?: FileValue; label?: string | null };

export type FileLine = { file: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank hook or ticket label stays blank. It is not filled in. */
export function hookLabel(raw: unknown): string {
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
    out.push({ id, text, hook: hookLabel(row.hook), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; hook?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const hook = hookLabel(note.hook);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, hook, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The hook or ticket label is not part of the query. */
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
 * The owner's KYC file status already on the document row.
 * A document review status, a document type, or a number is not that status.
 */
export function fileText(value: FileValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if ("status" in value || "docType" in value || "type" in value) return "";
  const nested = typeof value.kyc === "string" ? value.kyc : typeof value.file === "string" ? value.file : "";
  return nested.replace(/\s+/g, " ").trim();
}

export function fileLines(rows: readonly FileRow[]): FileLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const file = fileText(row.file);
    map.set(file, (map.get(file) || 0) + 1);
  }
  const out: FileLine[] = [];
  map.forEach((count, file) => out.push({ file, count }));
  return out.sort((a, b) => {
    if (!a.file) return -1;
    if (!b.file) return 1;
    return a.file.localeCompare(b.file);
  });
}

export function namedFiles(rows: readonly FileRow[]): string[] {
  return fileLines(rows).map((line) => line.file).filter(Boolean);
}

export function readHiddenFiles(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => fileText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const file = fileText(String(item || ""));
    if (!file || !allow.has(file) || out.includes(file)) continue;
    out.push(file);
  }
  return out;
}

export function toggleFile(hidden: readonly string[], file: string, present: readonly string[]): string[] {
  const current = readHiddenFiles(hidden, present);
  const next = fileText(file);
  if (!next || !present.map((item) => fileText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleFiles(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenFiles(hidden, present));
  return namedFiles(present.map((file) => ({ file }))).filter((file) => (showHidden ? gone.has(file) : !gone.has(file)));
}

export function activeFile(selected: string, visible: readonly string[]): string {
  const file = fileText(selected);
  if (!file) return "";
  return visible.some((item) => fileText(item) === file) ? file : "";
}

export function visibleDocs<T extends FileRow>(rows: readonly T[], file: string, blank: boolean, query: string): T[] {
  const want = fileText(file);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = fileText(row.file);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
