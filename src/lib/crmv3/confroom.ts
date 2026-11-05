/** Local room notes, and trade counts grouped by the side already on each row. */

export const ROOM_KEY = "crmv3-room-notes";
export const TRADE_SIDE_KEY = "crmv3-side-sg-hide";

export type Note = {
  id: string;
  text: string;
  floor: string;
  pinned: boolean;
  hidden: boolean;
};

export type SideValue = { side?: unknown } | string | null | undefined;

export type SideRow = { side?: SideValue; label?: string | null };

export type SideLine = { side: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank note is left out. The saved text stays short. */
export function noteText(raw: unknown): string {
  return clip(raw, 120);
}

/** A blank room or floor label stays blank. It is not filled in. */
export function floorLabel(raw: unknown): string {
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
    out.push({ id, text, floor: floorLabel(row.floor), pinned: row.pinned === true, hidden: row.hidden === true });
  }
  return out.slice(0, 40);
}

export function addNote(notes: readonly Note[], note: { id: string; text: string; floor?: string }): Note[] {
  const current = readNotes(notes);
  const id = String(note.id || "").trim();
  const text = noteText(note.text);
  const floor = floorLabel(note.floor);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, floor, pinned: false, hidden: false }, ...current].slice(0, 40);
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

/** Search stays on the note text. The room or floor label is not part of the query. */
export function visibleNotes(notes: readonly Note[], hidden: boolean, query: string): Note[] {
  const text = query.trim().toLowerCase();
  return readNotes(notes)
    .filter((note) => note.hidden === hidden && (!text || note.text.toLowerCase().includes(text)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The side string already on the row. A number or a symbol is not a side. */
export function sideText(value: SideValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (value && typeof value === "object" && typeof value.side === "string") return value.side.replace(/\s+/g, " ").trim();
  return "";
}

export function sideLines(rows: readonly SideRow[]): SideLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const side = sideText(row.side);
    map.set(side, (map.get(side) || 0) + 1);
  }
  const out: SideLine[] = [];
  map.forEach((count, side) => out.push({ side, count }));
  return out.sort((a, b) => {
    if (!a.side) return -1;
    if (!b.side) return 1;
    return a.side.localeCompare(b.side);
  });
}

export function namedSides(rows: readonly SideRow[]): string[] {
  return sideLines(rows).map((line) => line.side).filter(Boolean);
}

export function readHiddenSides(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => sideText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const side = sideText(String(item || ""));
    if (!side || !allow.has(side) || out.includes(side)) continue;
    out.push(side);
  }
  return out;
}

export function toggleSide(hidden: readonly string[], side: string, present: readonly string[]): string[] {
  const current = readHiddenSides(hidden, present);
  const next = sideText(side);
  if (!next || !present.map((item) => sideText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleSides(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSides(hidden, present));
  return namedSides(present.map((side) => ({ side }))).filter((side) => (showHidden ? gone.has(side) : !gone.has(side)));
}

export function activeSide(selected: string, visible: readonly string[]): string {
  const side = sideText(selected);
  if (!side) return "";
  return visible.some((item) => sideText(item) === side) ? side : "";
}

export function visibleTrades<T extends SideRow>(rows: readonly T[], side: string, blank: boolean, query: string): T[] {
  const want = sideText(side);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = sideText(row.side);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
