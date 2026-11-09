/** Local valet notes, and customer counts grouped by the potential status already on each row. */

export const VALET_KEY = "crmv4-valet-notes";
export const POTENTIAL_KEY = "crmv4-pot-hide";

export type Note = {
  id: string;
  text: string;
  stand: string;
  pinned: boolean;
  hidden: boolean;
};

export type PotentialValue =
  | {
      potential?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      validationStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      role?: unknown;
    }
  | string
  | null
  | undefined;

export type PotentialRow = { potential?: PotentialValue; label?: string | null };

export type PotentialLine = { potential: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank stand label stays blank. It is not filled in. */
export function standLabel(raw: unknown): string {
  return clip(raw, 24);
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
    out.push({ id, text, stand: standLabel(row.stand), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; stand?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const stand = standLabel(note.stand);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, stand, pinned: false, hidden: false }, ...current].slice(0, 40);
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

function csvCell(value: string): string {
  if (/[",]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the notes saved in this browser. The stand stays a column, not a search field. */
export function notesCsv(raw: unknown): string {
  const lines = ["text,stand,pinned,hidden"];
  for (const note of readNotes(raw)) {
    lines.push([csvCell(note.text), csvCell(note.stand), note.pinned ? "1" : "0", note.hidden ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}

/** Search stays on the note text. The stand label is not part of the query. */
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
 * The potential status already on the trader row.
 * A sale status, a retention status, a validation status, a KYC status, an account type, a role, or a number is not potential.
 */
export function potentialText(value: PotentialValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if (
    "saleStatus" in value
    || "retentionStatus" in value
    || "validationStatus" in value
    || "documentsStatus" in value
    || "accountType" in value
    || "role" in value
  ) return "";
  return typeof value.potential === "string" ? value.potential.replace(/\s+/g, " ").trim() : "";
}

export function potentialLines(rows: readonly PotentialRow[]): PotentialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const potential = potentialText(row.potential);
    map.set(potential, (map.get(potential) || 0) + 1);
  }
  const out: PotentialLine[] = [];
  map.forEach((count, potential) => out.push({ potential, count }));
  return out.sort((a, b) => {
    if (!a.potential) return -1;
    if (!b.potential) return 1;
    return a.potential.localeCompare(b.potential);
  });
}

export function namedPotentials(rows: readonly PotentialRow[]): string[] {
  return potentialLines(rows).map((line) => line.potential).filter(Boolean);
}

export function readHiddenPotentials(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => potentialText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const potential = potentialText(String(item || ""));
    if (!potential || !allow.has(potential) || out.includes(potential)) continue;
    out.push(potential);
  }
  return out;
}

export function togglePotential(hidden: readonly string[], potential: string, present: readonly string[]): string[] {
  const current = readHiddenPotentials(hidden, present);
  const next = potentialText(potential);
  if (!next || !present.map((item) => potentialText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visiblePotentials(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenPotentials(hidden, present));
  return namedPotentials(present.map((potential) => ({ potential }))).filter((potential) => (showHidden ? gone.has(potential) : !gone.has(potential)));
}

export function activePotential(selected: string, visible: readonly string[]): string {
  const potential = potentialText(selected);
  if (!potential) return "";
  return visible.some((item) => potentialText(item) === potential) ? potential : "";
}

export function visibleCustomers<T extends PotentialRow>(rows: readonly T[], potential: string, blank: boolean, query: string): T[] {
  const want = potentialText(potential);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = potentialText(row.potential);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
