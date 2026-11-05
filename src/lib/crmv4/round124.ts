/** Local supply notes, and customer counts grouped by the KYC status already on each row. */

export const SUPPLY_KEY = "crmv4-supply-notes";
export const KYC_STATUS_KEY = "crmv4-kyc-sg-hide";

export type Note = {
  id: string;
  text: string;
  bin: string;
  pinned: boolean;
  hidden: boolean;
};

export type StatusValue = { status?: unknown } | string | null | undefined;

export type StatusRow = { status?: StatusValue; label?: string | null };

export type StatusLine = { status: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank shelf or bin label stays blank. It is not filled in. */
export function binLabel(raw: unknown): string {
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
    out.push({ id, text, bin: binLabel(row.bin), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; bin?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const bin = binLabel(note.bin);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, bin, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** The KYC status string already on the row. A number or another field is not a status. */
export function statusText(value: StatusValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && typeof value.status === "string") return value.status.replace(/\s+/g, " ").trim();
  return "";
}

export function statusLines(rows: readonly StatusRow[]): StatusLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const status = statusText(row.status);
    map.set(status, (map.get(status) || 0) + 1);
  }
  const out: StatusLine[] = [];
  map.forEach((count, status) => out.push({ status, count }));
  return out.sort((a, b) => {
    if (!a.status) return -1;
    if (!b.status) return 1;
    return a.status.localeCompare(b.status);
  });
}

export function namedStatuses(rows: readonly StatusRow[]): string[] {
  return statusLines(rows).map((line) => line.status).filter(Boolean);
}

export function readHiddenStatuses(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => statusText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const status = statusText(String(item || ""));
    if (!status || !allow.has(status) || out.includes(status)) continue;
    out.push(status);
  }
  return out;
}

export function toggleStatus(hidden: readonly string[], status: string, present: readonly string[]): string[] {
  const current = readHiddenStatuses(hidden, present);
  const next = statusText(status);
  if (!next || !present.map((item) => statusText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleStatuses(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStatuses(hidden, present));
  return namedStatuses(present.map((status) => ({ status }))).filter((status) => (showHidden ? gone.has(status) : !gone.has(status)));
}

export function activeStatus(selected: string, visible: readonly string[]): string {
  const status = statusText(selected);
  if (!status) return "";
  return visible.some((item) => statusText(item) === status) ? status : "";
}

export function visibleCustomers<T extends StatusRow>(rows: readonly T[], status: string, blank: boolean, query: string): T[] {
  const want = statusText(status);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = statusText(row.status);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
