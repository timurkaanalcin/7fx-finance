/**
 * Ink folios for the document review desk, and document grades already stored as documentsStatus on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_ink_folio (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   shelf integer,
 *   ink text not null default '',
 *   grade text not null default '',
 *   hours integer,
 *   weight integer not null default 0,
 *   ticks text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_doc_grade_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_doc_grade_review (
 *   customer_id text primary key
 * );
 */

export const IFL_KEY = "crmv4-ink-folio";
export const IFL_VIEW_KEY = "crmv4-ink-views";
export const IFL_DENSITY_KEY = "crmv4-ink-density";
export const DGR_KEY = "crmv4-doc-grade-hide";
export const DGR_REVIEW_KEY = "crmv4-doc-grade-review";

export type InkName = "blank" | "soot" | "gall" | "gold";

export type GradeName = "blank" | "hold" | "pass" | "fail";

export type FolioTray = "open" | "paused" | "filed";

export type ShelfPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type FolioDensity = "tall" | "low";

export type FolioSort = "shelf" | "reader";

export type InkFolio = {
  id: string;
  title: string;
  note: string;
  reader: string;
  shelf: number | null;
  ink: string;
  grade: string;
  hours: number | null;
  weight: number;
  ticks: string[];
  pinned: boolean;
  paused: boolean;
  filed: boolean;
  audit: string;
};

export type FolioView = {
  id: string;
  name: string;
  tray: FolioTray;
  query: string;
  reader: string;
  ink: string;
  grade: string;
  shelf: string;
  hours: string;
  weight: string;
};

export type FolioCounts = {
  open: number;
  paused: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  weight: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "grade", "pin", "unpin", "pause", "resume", "file", "open", "ink", "tick", "weight", "hours"] as const;

const INKS = ["soot", "gall", "gold"] as const;

const GRADES = ["hold", "pass", "fail"] as const;

const GRADE_CYCLE = ["hold", "pass", "fail"] as const;

const PEAK_SHELVES = new Set([3, 7]);

const QUIET_SHELVES = new Set([8]);

const HOUSE = new Set(["GALL", "GOLD"]);

const FOLIO_CAP = 8;

const VIEW_CAP = 6;

const TICK_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FolioTray {
  return raw === "paused" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function gradeName(raw: unknown): Exclude<GradeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GRADES as readonly string[]).includes(text) ? (text as Exclude<GradeName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function folioLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function folioNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** An ink is SOOT, GALL, or GOLD. Anything else stays blank. Letters are stored in capitals. */
export function inkOf(raw: unknown): string {
  const name = inkName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A shelf is an integer from 1 through 8.
 * A blank value stays unset. 0 is not a shelf.
 * A second digit other than the shelf itself is not a shelf.
 */
export function shelfOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** Hours are 4, 8, or 16. A blank value stays unset. A leading zero is not a span of hours. */
export function hoursOf(raw: unknown): 4 | 8 | 16 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  if (raw === 16 || raw === "16") return 16;
  const text = clip(raw, 2);
  if (text === "4") return 4;
  if (text === "8") return 8;
  if (text === "16") return 16;
  return null;
}

/** Weight is 0, 2, or 5. Anything else is not a weight. 0 clears the weight. */
export function weightOf(raw: unknown): 0 | 2 | 5 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

export function shelfBand(shelf: unknown): "blank" | "early" | "mid" | "late" {
  const value = shelfOf(shelf);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak shelves are 3 and 7. An unset shelf is not a peak shelf. */
export function peakShelf(shelf: unknown): boolean {
  const value = shelfOf(shelf);
  return value !== null && PEAK_SHELVES.has(value);
}

/** The quiet shelf is 8. A peak shelf is not quiet. An unset shelf is not quiet. */
export function quietShelf(shelf: unknown): boolean {
  const value = shelfOf(shelf);
  return value !== null && QUIET_SHELVES.has(value);
}

/**
 * How far a shelf sits behind the desk shelf.
 * A positive gap means the folio is behind. A negative gap means it is ahead.
 * A gap of zero means the same shelf. An unset shelf has no gap. Shelves do not wrap.
 */
export function shelfGap(shelf: unknown, desk: unknown): number | null {
  const from = shelfOf(shelf);
  const at = shelfOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** GALL and GOLD are house inks. SOOT is a guest ink. A blank ink is not a house ink. */
export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

/** Tall or low. Anything else stays tall. */
export function densityOf(raw: unknown): FolioDensity {
  return raw === "low" ? "low" : "tall";
}

/** Shelf or reader. Anything else stays on the shelf. */
export function sortMode(raw: unknown): FolioSort {
  return raw === "reader" ? "reader" : "shelf";
}

function tickOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-f]$/.test(text) ? text : "";
}

function ticksOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tick = tickOf(part);
    if (tick && !out.includes(tick)) out.push(tick);
    if (out.length >= TICK_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): InkFolio | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<InkFolio>;
  const id = clip(row.id, 24);
  const title = folioLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: folioNote(row.note),
    reader: readerLabel(row.reader),
    shelf: shelfOf(row.shelf),
    ink: inkOf(row.ink),
    grade: gradeName(row.grade),
    hours: hoursOf(row.hours),
    weight: weight === null ? 0 : weight,
    ticks: ticksOf(row.ticks),
    pinned: row.pinned === true,
    paused: row.paused === true,
    filed: row.filed === true,
    audit: auditCode(row.audit),
  };
}

export function readFolios(raw: unknown): InkFolio[] {
  if (!Array.isArray(raw)) return [];
  const out: InkFolio[] = [];
  for (const item of raw) {
    const folio = readOne(item);
    if (!folio || out.some((row) => row.id === folio.id || row.title === folio.title)) continue;
    out.push(folio);
  }
  return out.slice(0, FOLIO_CAP);
}

export function addFolio(
  folios: readonly InkFolio[],
  folio: {
    id: string;
    title: string;
    note?: string;
    reader?: string;
    shelf?: unknown;
    ink?: string;
    grade?: string;
    hours?: unknown;
    weight?: unknown;
    ticks?: unknown;
  },
): InkFolio[] {
  const current = readFolios(folios);
  const id = String(folio.id || "").trim();
  const title = folioLine(folio.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(folio.weight);
  const next: InkFolio = {
    id,
    title,
    note: folioNote(folio.note),
    reader: readerLabel(folio.reader),
    shelf: shelfOf(folio.shelf),
    ink: inkOf(folio.ink),
    grade: gradeName(folio.grade),
    hours: hoursOf(folio.hours),
    weight: weight === null ? 0 : weight,
    ticks: ticksOf(folio.ticks),
    pinned: false,
    paused: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, FOLIO_CAP);
}

/** A blank grade becomes hold, hold becomes pass, pass becomes fail, and fail returns to hold. */
export function cycleGrade(folios: readonly InkFolio[], id: string): InkFolio[] {
  return readFolios(folios).map((folio) => {
    if (folio.id !== id) return folio;
    const at = GRADE_CYCLE.indexOf(folio.grade as (typeof GRADE_CYCLE)[number]);
    const next = at < 0 ? GRADE_CYCLE[0] : GRADE_CYCLE[(at + 1) % GRADE_CYCLE.length];
    if (!next || next === folio.grade) return folio;
    return { ...folio, grade: next, audit: "grade" };
  });
}

/** A blank title is left as it is. */
export function editFolio(folios: readonly InkFolio[], id: string, title: unknown): InkFolio[] {
  const next = folioLine(title);
  if (!next) return readFolios(folios);
  const current = readFolios(folios);
  if (current.some((folio) => folio.id !== id && folio.title === next)) return current;
  return current.map((folio) => (folio.id === id && folio.title !== next ? { ...folio, title: next, audit: "edit" } : folio));
}

/** A blank note is left as it is. */
export function editFolioNote(folios: readonly InkFolio[], id: string, note: unknown): InkFolio[] {
  const next = folioNote(note);
  if (!next) return readFolios(folios);
  return readFolios(folios).map((folio) => (folio.id === id && folio.note !== next ? { ...folio, note: next, audit: "edit" } : folio));
}

/** A tick that is already on the folio, or a fourth tick, is left out. A tick is one letter from a to f. */
export function addFolioTick(folios: readonly InkFolio[], id: string, tick: unknown): InkFolio[] {
  const next = tickOf(tick);
  if (!next) return readFolios(folios);
  return readFolios(folios).map((folio) => {
    if (folio.id !== id || folio.ticks.includes(next) || folio.ticks.length >= TICK_CAP) return folio;
    return { ...folio, ticks: [...folio.ticks, next], audit: "tick" };
  });
}

/** An unknown weight is left as it is. 0 clears the weight. */
export function setFolioWeight(folios: readonly InkFolio[], id: string, weight: unknown): InkFolio[] {
  const next = weightOf(weight);
  if (next === null) return readFolios(folios);
  return readFolios(folios).map((folio) => (folio.id === id && folio.weight !== next ? { ...folio, weight: next, audit: "weight" } : folio));
}

/** Four hours become 8, eight hours become 16, and sixteen hours stay. An unset span becomes 4. */
export function snoozeFolio(folios: readonly InkFolio[], id: string): InkFolio[] {
  return readFolios(folios).map((folio) => {
    if (folio.id !== id) return folio;
    const next = folio.hours === 4 ? 8 : folio.hours === 8 ? 16 : folio.hours === 16 ? 16 : 4;
    if (next === folio.hours) return folio;
    return { ...folio, hours: next, audit: "hours" };
  });
}

export function setFolioPin(folios: readonly InkFolio[], id: string, pinned: boolean): InkFolio[] {
  return readFolios(folios).map((folio) => (folio.id === id && folio.pinned !== pinned ? { ...folio, pinned, audit: pinned ? "pin" : "unpin" } : folio));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(folios: readonly InkFolio[], shownIds: readonly string[], index: number): InkFolio[] {
  if (!shownIds.length) return readFolios(folios);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readFolios(folios).find((folio) => folio.id === id);
  if (!row) return readFolios(folios);
  return setFolioPin(folios, id, !row.pinned);
}

/** S lengthens the hours on the focused folio. */
export function snoozeFocused(folios: readonly InkFolio[], shownIds: readonly string[], index: number): InkFolio[] {
  if (!shownIds.length) return readFolios(folios);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readFolios(folios).some((folio) => folio.id === id)) return readFolios(folios);
  return snoozeFolio(folios, id);
}

/** H toggles the pause on the focused row. */
export function pauseFocused(folios: readonly InkFolio[], shownIds: readonly string[], index: number): InkFolio[] {
  if (!shownIds.length) return readFolios(folios);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readFolios(folios).find((folio) => folio.id === id);
  if (!row) return readFolios(folios);
  return setFolioPause(folios, id, !row.paused);
}

/** G cycles the grade on the focused folio. */
export function gradeFocused(folios: readonly InkFolio[], shownIds: readonly string[], index: number): InkFolio[] {
  if (!shownIds.length) return readFolios(folios);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readFolios(folios).some((folio) => folio.id === id)) return readFolios(folios);
  return cycleGrade(folios, id);
}

export function setFolioPause(folios: readonly InkFolio[], id: string, paused: boolean): InkFolio[] {
  return readFolios(folios).map((folio) => (folio.id === id && folio.paused !== paused ? { ...folio, paused, audit: paused ? "pause" : "resume" } : folio));
}

export function setFolioFile(folios: readonly InkFolio[], id: string, filed: boolean): InkFolio[] {
  return readFolios(folios).map((folio) => (folio.id === id && folio.filed !== filed ? { ...folio, filed, audit: filed ? "file" : "open" } : folio));
}

export function bulkFolioInk(folios: readonly InkFolio[], ids: readonly string[], ink: unknown): InkFolio[] {
  const next = inkOf(ink);
  if (!next) return readFolios(folios);
  const picked = new Set(ids);
  return readFolios(folios).map((folio) => (picked.has(folio.id) && folio.ink !== next ? { ...folio, ink: next, audit: "ink" } : folio));
}

export function bulkFolioPin(folios: readonly InkFolio[], ids: readonly string[], pinned: boolean): InkFolio[] {
  const picked = new Set(ids);
  return readFolios(folios).map((folio) => (picked.has(folio.id) && folio.pinned !== pinned ? { ...folio, pinned, audit: pinned ? "pin" : "unpin" } : folio));
}

export function bulkFolioFile(folios: readonly InkFolio[], ids: readonly string[], filed: boolean): InkFolio[] {
  const picked = new Set(ids);
  return readFolios(folios).map((folio) => (picked.has(folio.id) && folio.filed !== filed ? { ...folio, filed, audit: filed ? "file" : "open" } : folio));
}

export function bulkFolioGrade(folios: readonly InkFolio[], ids: readonly string[], grade: unknown): InkFolio[] {
  const next = gradeName(grade);
  if (!next) return readFolios(folios);
  const picked = new Set(ids);
  return readFolios(folios).map((folio) => (picked.has(folio.id) && folio.grade !== next ? { ...folio, grade: next, audit: "grade" } : folio));
}

export function bulkFolioTick(folios: readonly InkFolio[], ids: readonly string[], tick: unknown): InkFolio[] {
  return ids.reduce((rows, id) => addFolioTick(rows, id, tick), readFolios(folios));
}

export function resetFolios(): InkFolio[] {
  return [];
}

function inTray(folio: InkFolio, tray: FolioTray): boolean {
  if (tray === "filed") return folio.filed;
  if (tray === "paused") return folio.paused && !folio.filed;
  return !folio.paused && !folio.filed;
}

function shelfHit(shelf: number | null, exact: number | null, pick: ShelfPick | null): boolean {
  if (exact !== null) return shelf === exact;
  if (pick === null) return true;
  if (pick === "blank") return shelf === null;
  if (pick === "peak") return peakShelf(shelf);
  if (pick === "quiet") return quietShelf(shelf);
  return shelfBand(shelf) === pick;
}

/** An open folio whose shelf sits more than two shelves behind the desk. Weight, a pause, or a file is not late. */
export function lateFolio(folio: InkFolio, desk: unknown): boolean {
  const gap = shelfGap(folio.shelf, desk);
  return inTray(folio, "open") && folio.weight === 0 && gap !== null && gap > 2;
}

/** An open folio with 4 hours is due now. Weight, a pause, or a file is not. */
export function soonFolio(folio: InkFolio): boolean {
  return inTray(folio, "open") && folio.weight === 0 && folio.hours === 4;
}

/** Open folios that are late or due now. A weighted folio stays off the reminder list. */
export function reminderFolios(folios: readonly InkFolio[], desk: unknown): InkFolio[] {
  return readFolios(folios).filter((folio) => lateFolio(folio, desk) || soonFolio(folio));
}

/** Open folios whose shelf sits within two shelves of the desk. Weight, a pause, or a file stays out. */
export function windowFolios(folios: readonly InkFolio[], desk: unknown): InkFolio[] {
  return readFolios(folios).filter((folio) => {
    const gap = shelfGap(folio.shelf, desk);
    return inTray(folio, "open") && folio.weight === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Open light folios whose shelf is the desk shelf. */
export function matchedFolios(folios: readonly InkFolio[], desk: unknown): number {
  const at = shelfOf(desk);
  if (at === null) return 0;
  return readFolios(folios).filter((folio) => inTray(folio, "open") && folio.weight === 0 && folio.shelf === at).length;
}

/** Search matches the title, the note, the reader, and the ticks. */
export function visibleFolios(
  folios: readonly InkFolio[],
  tray: FolioTray,
  query: string,
  reader: string | null,
  ink: string | null,
  grade: string | null,
  exact: number | null,
  pick: ShelfPick | null,
  hours: number | "blank" | null,
  weight: number | "blank" | null,
  failOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): InkFolio[] {
  const text = query.trim().toLowerCase();
  return readFolios(folios).filter((folio) => {
    if (!inTray(folio, tray)) return false;
    if (text) {
      const hay = `${folio.title} ${folio.note} ${folio.reader} ${folio.ticks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (reader !== null && folio.reader !== reader) return false;
    if (ink === "blank" ? Boolean(folio.ink) : ink && folio.ink !== ink) return false;
    if (grade === "blank" ? Boolean(folio.grade) : grade && folio.grade !== grade) return false;
    if (!shelfHit(folio.shelf, exact, pick)) return false;
    if (hours === "blank" ? folio.hours !== null : hours !== null && folio.hours !== hours) return false;
    if (weight === "blank" ? folio.weight !== 0 : weight !== null && folio.weight !== weight) return false;
    if (failOnly && folio.grade !== "fail") return false;
    if (peakOnly && !peakShelf(folio.shelf)) return false;
    if (houseOnly && !houseInk(folio.ink)) return false;
    if (quietOnly && !quietShelf(folio.shelf)) return false;
    if (lightOnly && folio.weight !== 0) return false;
    return true;
  });
}

export function sortFolios(folios: readonly InkFolio[], mode: FolioSort): InkFolio[] {
  const rows = folios.slice();
  if (mode === "reader") return rows.sort((a, b) => a.reader.localeCompare(b.reader) || (a.shelf ?? 99) - (b.shelf ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.shelf ?? 99) - (b.shelf ?? 99) || a.title.localeCompare(b.title));
}

export function folioLedger(folios: readonly InkFolio[], query: string): InkFolio[] {
  const text = query.trim().toLowerCase();
  return sortFolios(
    readFolios(folios).filter((folio) => folio.shelf !== null && (!text || folio.title.toLowerCase().includes(text))),
    "shelf",
  );
}

export function folioCounts(folios: readonly InkFolio[], desk: unknown): FolioCounts {
  const rows = readFolios(folios);
  return {
    open: rows.filter((folio) => inTray(folio, "open")).length,
    paused: rows.filter((folio) => inTray(folio, "paused")).length,
    filed: rows.filter((folio) => inTray(folio, "filed")).length,
    pinned: rows.filter((folio) => folio.pinned).length,
    peak: rows.filter((folio) => inTray(folio, "open") && folio.weight === 0 && peakShelf(folio.shelf)).length,
    late: rows.filter((folio) => lateFolio(folio, desk)).length,
    soon: rows.filter((folio) => soonFolio(folio)).length,
    weight: rows.filter((folio) => inTray(folio, "open") && folio.weight > 0).length,
    house: rows.filter((folio) => inTray(folio, "open") && houseInk(folio.ink)).length,
    window: windowFolios(rows, desk).length,
    matched: matchedFolios(rows, desk),
  };
}

export function folioShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open folios as a share of every open folio. */
export function lateShare(folios: readonly InkFolio[], desk: unknown): number {
  const rows = readFolios(folios);
  const open = rows.filter((folio) => inTray(folio, "open")).length;
  const late = rows.filter((folio) => lateFolio(folio, desk)).length;
  return folioShare(late, open);
}

/** Distinct shelves on open folios. */
export function usedShelves(folios: readonly InkFolio[]): number {
  const shelves = new Set<number>();
  for (const folio of readFolios(folios)) {
    if (inTray(folio, "open") && folio.shelf !== null) shelves.add(folio.shelf);
  }
  return shelves.size;
}

/** Open folios that share a shelf and an ink. A different ink on the same shelf is not a clash. */
export function clashShelfCount(folios: readonly InkFolio[]): number {
  const groups = new Map<string, number>();
  for (const folio of readFolios(folios)) {
    if (!inTray(folio, "open") || folio.shelf === null || !folio.ink) continue;
    const key = `${folio.shelf}:${folio.ink}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open folios that share a span of hours. An unset span is not a clash. */
export function hoursClashCount(folios: readonly InkFolio[]): number {
  const groups = new Map<number, number>();
  for (const folio of readFolios(folios)) {
    if (!inTray(folio, "open") || folio.hours === null) continue;
    groups.set(folio.hours, (groups.get(folio.hours) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open folios in the same ink whose shelves differ by three.
 * The count is the folios that have at least one neighbor.
 */
export function adjacentFolioCount(folios: readonly InkFolio[]): number {
  const open = readFolios(folios).filter((folio) => inTray(folio, "open") && folio.shelf !== null && folio.ink);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.ink === right.ink && Math.abs((left.shelf ?? 0) - (right.shelf ?? 0)) === 3) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The ink with the fewest open folios.
 * A tie keeps GALL, then GOLD, then SOOT.
 * An empty desk still suggests GALL.
 */
export function suggestInk(folios: readonly InkFolio[]): "GALL" | "GOLD" | "SOOT" {
  const rows = readFolios(folios).filter((folio) => inTray(folio, "open"));
  const order = ["GALL", "GOLD", "SOOT"] as const;
  let best: "GALL" | "GOLD" | "SOOT" = "GALL";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ink of order) {
    const count = rows.filter((folio) => folio.ink === ink).length;
    if (count < bestCount) {
      best = ink;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The hours with the fewest open folios.
 * A tie keeps 8, then 4, then 16.
 * An empty desk still suggests 8.
 */
export function suggestHours(folios: readonly InkFolio[]): 4 | 8 | 16 {
  const rows = readFolios(folios).filter((folio) => inTray(folio, "open"));
  const order = [8, 4, 16] as const;
  let best: 4 | 8 | 16 = 8;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const hours of order) {
    const count = rows.filter((folio) => folio.hours === hours).length;
    if (count < bestCount) {
      best = hours;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open reader. A blank reader is skipped. An empty desk stays blank. */
export function suggestReader(folios: readonly InkFolio[]): string {
  const found = readFolios(folios).find((folio) => inTray(folio, "open") && folio.reader);
  return found ? found.reader : "";
}

/**
 * The reader carrying the fewest open folios.
 * A tie keeps the earlier name. A blank reader is not a load.
 * An empty roster falls back to the newest reader.
 */
export function fairReader(folios: readonly InkFolio[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = readerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestReader(folios);
  const open = readFolios(folios).filter((folio) => inTray(folio, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((folio) => folio.reader === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The reader with the most open folios. A tie keeps the newer name on the desk. */
export function busiestReader(folios: readonly InkFolio[]): string {
  const rows = readFolios(folios).filter((folio) => inTray(folio, "open") && folio.reader);
  const names: string[] = [];
  for (const folio of rows) if (!names.includes(folio.reader)) names.push(folio.reader);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((folio) => folio.reader === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function folioReaders(folios: readonly InkFolio[]): string[] {
  const out: string[] = [];
  for (const folio of readFolios(folios)) {
    if (folio.reader && !out.includes(folio.reader)) out.push(folio.reader);
  }
  return out;
}

export function folioInks(folios: readonly InkFolio[]): string[] {
  const out: string[] = [];
  for (const folio of readFolios(folios)) {
    if (folio.ink && !out.includes(folio.ink)) out.push(folio.ink);
  }
  return out;
}

/** Open folios whose reader also keeps another open folio on a different shelf. */
export function pairReaderCount(folios: readonly InkFolio[]): number {
  const open = readFolios(folios).filter((folio) => inTray(folio, "open") && folio.reader && folio.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].reader === open[j].reader && open[i].shelf !== open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open folios that share an ink on different shelves. */
export function sharedInkCount(folios: readonly InkFolio[]): number {
  const open = readFolios(folios).filter((folio) => inTray(folio, "open") && folio.ink && folio.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].ink === open[j].ink && open[i].shelf !== open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The weight of open folios. A clear weight adds nothing. */
export function weightLoad(folios: readonly InkFolio[]): number {
  return readFolios(folios).filter((folio) => inTray(folio, "open")).reduce((sum, folio) => sum + folio.weight, 0);
}

/** Open folios that are both the quiet shelf and a house ink. */
export function quietHouseCount(folios: readonly InkFolio[]): number {
  return readFolios(folios).filter((folio) => inTray(folio, "open") && quietShelf(folio.shelf) && houseInk(folio.ink)).length;
}

/** Open folios whose grade is fail. */
export function failLoad(folios: readonly InkFolio[]): number {
  return readFolios(folios).filter((folio) => inTray(folio, "open") && folio.grade === "fail").length;
}

/** The span from the lowest open shelf to the highest. Fewer than two shelves span nothing. */
export function shelfSpan(folios: readonly InkFolio[]): number {
  const shelves = readFolios(folios).filter((folio) => inTray(folio, "open") && folio.shelf !== null).map((folio) => folio.shelf as number);
  if (shelves.length < 2) return 0;
  return Math.max(...shelves) - Math.min(...shelves);
}

/**
 * The next open folio at or after the desk shelf.
 * A fail grade, weight, a pause, and a file stay off the list.
 * When every open shelf is behind, the earliest shelf is next.
 */
export function nextFolio(folios: readonly InkFolio[], desk: unknown): string {
  const now = shelfOf(desk);
  if (now === null) return "";
  const waiting = readFolios(folios).filter((folio) => inTray(folio, "open") && folio.shelf !== null && folio.grade !== "fail" && folio.weight === 0);
  if (!waiting.length) return "";
  const byShelf = (a: InkFolio, b: InkFolio) => (a.shelf ?? 0) - (b.shelf ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((folio) => (folio.shelf ?? 0) >= now).sort(byShelf);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byShelf)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function folioCopy(folio: InkFolio, desk: unknown): string {
  const gap = shelfGap(folio.shelf, desk);
  return [folio.title, folio.reader, folio.shelf ?? "", folio.ink, folio.grade, folio.hours ?? "", folio.weight, folio.ticks.join(" "), folio.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the folios saved in this browser. The gap and the late mark use the shelf you pass. */
export function foliosCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,reader,shelf,ink,grade,hours,weight,ticks,pinned,paused,filed,gap,late,soon,house,window,matched,note,audit"];
  const rows = readFolios(raw);
  const windowIds = new Set(windowFolios(rows, desk).map((folio) => folio.id));
  const at = shelfOf(desk);
  for (const folio of rows) {
    const gap = shelfGap(folio.shelf, desk);
    lines.push([
      folio.title,
      folio.reader,
      folio.shelf === null ? "" : String(folio.shelf),
      folio.ink,
      folio.grade,
      folio.hours === null ? "" : String(folio.hours),
      String(folio.weight),
      folio.ticks.join(" "),
      folio.pinned ? "1" : "0",
      folio.paused ? "1" : "0",
      folio.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateFolio(folio, desk) ? "1" : "0",
      soonFolio(folio) ? "1" : "0",
      houseInk(folio.ink) ? "1" : "0",
      windowIds.has(folio.id) ? "1" : "0",
      at !== null && folio.shelf === at && folio.weight === 0 && inTray(folio, "open") ? "1" : "0",
      folio.note,
      folio.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeReader(raw: string, readers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return readers.includes(raw) ? raw : "all";
}

export function activeInk(raw: string, inks: readonly string[]): string {
  if (raw === "blank") return "blank";
  return inkOf(raw) && inks.includes(inkOf(raw)) ? inkOf(raw) : "all";
}

export function activeGrade(raw: string, grades: readonly string[]): string {
  if (raw === "blank") return "blank";
  const grade = gradeName(raw);
  return grade && grades.includes(grade) ? grade : "all";
}

export function activeShelf(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const shelf = shelfOf(raw);
  return shelf === null ? "all" : String(shelf);
}

export function activeHours(raw: string): string {
  if (raw === "blank") return "blank";
  const hours = hoursOf(raw);
  return hours === null ? "all" : String(hours);
}

export function activeWeight(raw: string): string {
  if (raw === "blank") return "blank";
  const weight = weightOf(raw);
  return weight === null ? "all" : String(weight);
}

export function readerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function inkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return inkOf(filter) || null;
}

export function gradeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return gradeName(filter) || null;
}

export function shelfArg(filter: string): { exact: number | null; pick: ShelfPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: shelfOf(filter), pick: null };
}

export function hoursArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return hoursOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): FolioView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<FolioView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    reader: row.reader === "blank" ? "blank" : clip(row.reader, 18) || "all",
    ink: row.ink === "blank" || row.ink === "all" ? (row.ink === "blank" ? "blank" : "all") : inkOf(row.ink) || "all",
    grade: row.grade === "blank" || row.grade === "all" ? (row.grade === "blank" ? "blank" : "all") : gradeName(row.grade) || "all",
    shelf: activeShelf(String(row.shelf || "all")),
    hours: activeHours(String(row.hours || "all")),
    weight: activeWeight(String(row.weight || "all")),
  };
}

export function readFolioViews(raw: unknown): FolioView[] {
  if (!Array.isArray(raw)) return [];
  const out: FolioView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addFolioView(views: readonly FolioView[], view: FolioView): FolioView[] {
  const current = readFolioViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropFolioView(views: readonly FolioView[], id: string): FolioView[] {
  return readFolioViews(views).filter((view) => view.id !== id);
}

export type GradeState = "" | "set" | "clear";

export type GradeLane = "" | "shelf" | "queue" | "vault" | "return";

export type GradeTone = "" | "ivory" | "gilt" | "gold" | "ink";

export type GradeShape = "all" | "catalog" | "wide" | "gold";

export type GradeValue =
  | string
  | { documentsStatus?: unknown; language?: unknown; address?: unknown; country?: unknown; email?: unknown; phone?: unknown; city?: unknown; desk?: unknown; name?: unknown; username?: unknown; accountType?: unknown; lastBrowser?: unknown; isResident?: unknown }
  | null
  | undefined;

export type GradeRow = { id: string; label?: string; note: GradeValue };

export type GradeLaneLine = { lane: string; count: number };

const GRADE_LANES = ["shelf", "queue", "vault", "return"] as const;

const GRADE_TONES = ["ivory", "gilt", "gold", "ink"] as const;

const GRADE_BLOCK = ["language", "address", "country", "email", "phone", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident"] as const;

type StatusKind = "" | "none" | "wait" | "pass" | "back";

function statusKind(raw: unknown): { kind: StatusKind; word: string; explicit: boolean } {
  if (raw == null) return { kind: "", word: "", explicit: true };
  if (typeof raw !== "string") return { kind: "", word: "", explicit: false };
  const text = clip(raw, 16).toUpperCase();
  if (!text) return { kind: "", word: "", explicit: true };
  if (text === "NONE") return { kind: "none", word: "NONE", explicit: true };
  if (text === "PENDING") return { kind: "wait", word: "PENDING", explicit: true };
  if (text === "APPROVED") return { kind: "pass", word: "APPROVED", explicit: true };
  if (text === "REJECTED") return { kind: "back", word: "REJECTED", explicit: true };
  return { kind: "", word: "", explicit: false };
}

function gradeText(value: GradeValue): { kind: StatusKind; word: string; explicit: boolean } {
  if (typeof value === "string" || value == null) return statusKind(value);
  if (typeof value !== "object" || Array.isArray(value)) return { kind: "", word: "", explicit: false };
  if (GRADE_BLOCK.some((key) => key in value)) return { kind: "", word: "", explicit: false };
  if (!("documentsStatus" in value)) return { kind: "", word: "", explicit: false };
  return statusKind(value.documentsStatus);
}

export function gradeState(value: GradeValue): GradeState {
  const found = gradeText(value);
  if (!found.explicit) return "";
  return found.kind ? "set" : "clear";
}

export function gradeCopy(value: GradeValue): string {
  const found = gradeText(value);
  return found.explicit ? found.kind : "";
}

/** NONE is NON, PENDING is PND, APPROVED is APR, and REJECTED is REJ. An unset status stays blank. */
export function gradeOf(value: GradeValue): string {
  const kind = gradeCopy(value);
  if (kind === "none") return "NON";
  if (kind === "wait") return "PND";
  if (kind === "pass") return "APR";
  if (kind === "back") return "REJ";
  return "";
}

/** NONE sits on the shelf, PENDING in the queue, APPROVED in the vault, and REJECTED on the return. */
export function gradeLane(value: GradeValue): GradeLane {
  const kind = gradeCopy(value);
  if (kind === "none") return "shelf";
  if (kind === "wait") return "queue";
  if (kind === "pass") return "vault";
  if (kind === "back") return "return";
  return "";
}

/** NONE is ivory, PENDING is gilt, APPROVED is gold, and REJECTED is ink. */
export function gradeTone(value: GradeValue): GradeTone {
  const kind = gradeCopy(value);
  if (kind === "none") return "ivory";
  if (kind === "wait") return "gilt";
  if (kind === "pass") return "gold";
  if (kind === "back") return "ink";
  return "";
}

/** Only an approved file belongs to the vault catalog. */
export function catalogGrade(value: GradeValue): boolean {
  return gradeCopy(value) === "pass";
}

export function catalogGradeCount(rows: readonly GradeRow[]): number {
  return rows.filter((row) => catalogGrade(row.note)).length;
}

/** PENDING, APPROVED, and REJECTED are wider than six letters. NONE is not. */
export function wideGrade(value: GradeValue): boolean {
  return gradeText(value).word.length > 6;
}

export function wideGradeCount(rows: readonly GradeRow[]): number {
  return rows.filter((row) => wideGrade(row.note)).length;
}

export function goldGradeCount(rows: readonly GradeRow[]): number {
  return rows.filter((row) => gradeTone(row.note) === "gold").length;
}

/** Customers whose grade monogram is shared with at least one other customer. */
export function sharedGradeCount(rows: readonly GradeRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = gradeOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function gradeLanes(rows: readonly GradeRow[]): GradeLaneLine[] {
  return GRADE_LANES.map((lane) => ({ lane, count: rows.filter((row) => gradeLane(row.note) === lane).length }));
}

/** The lane with the most set grades. A tie keeps shelf, then queue, then vault, then return. */
export function leadingGrade(rows: readonly GradeRow[]): string {
  const lines = gradeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || GRADE_LANES.indexOf(a.lane as (typeof GRADE_LANES)[number]) - GRADE_LANES.indexOf(b.lane as (typeof GRADE_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set grades. A tie keeps ivory, then gilt, then gold, then ink. */
export function leadingGradeTone(rows: readonly GradeRow[]): string {
  const counts = GRADE_TONES.map((tone) => ({ tone, count: rows.filter((row) => gradeTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || GRADE_TONES.indexOf(a.tone) - GRADE_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function gradeShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Step on the document timeline. A clear status is 0. NONE is 1, PENDING is 2, and a decision is 3. */
export function gradeStep(value: GradeValue): 0 | 1 | 2 | 3 {
  const kind = gradeCopy(value);
  if (kind === "none") return 1;
  if (kind === "wait") return 2;
  if (kind === "pass" || kind === "back") return 3;
  return 0;
}

export function presentGrades(rows: readonly GradeRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = gradeState(row.note);
    const lane = state === "set" ? gradeLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenGrades(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedGrades(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleGrade(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGradeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGradeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGradeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleGradeCustomers(
  rows: readonly GradeRow[],
  lane: GradeLane | "blank" | null,
  tone: GradeTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: GradeShape,
): GradeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = gradeState(row.note);
    const mark = state === "set" ? gradeLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && gradeTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogGrade(row.note)) return false;
    if (shape === "wide" && !wideGrade(row.note)) return false;
    if (shape === "gold" && gradeTone(row.note) !== "gold") return false;
    if (text) {
      const hay = `${row.label || ""} ${gradeCopy(row.note)} ${gradeOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeGradeLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeGradeTone(raw: string): string {
  return raw === "ivory" || raw === "gilt" || raw === "gold" || raw === "ink" ? raw : "all";
}

export function gradeLaneArg(filter: string): GradeLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "shelf" || filter === "queue" || filter === "vault" || filter === "return") return filter;
  return null;
}

export function gradeToneArg(filter: string): GradeTone | null {
  if (filter === "ivory" || filter === "gilt" || filter === "gold" || filter === "ink") return filter;
  return null;
}

export function gradesCsv(rows: readonly GradeRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of gradeLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogGradeCount(rows)}`);
  lines.push(`wide,wide,${wideGradeCount(rows)}`);
  lines.push(`tone,gold,${goldGradeCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => gradeTone(row.note) === "ink").length}`);
  lines.push(`shared,shared,${sharedGradeCount(rows)}`);
  return lines.join("\n");
}

export function gradeRowsCsv(rows: readonly GradeRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,grade,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = gradeState(row.note);
    const lane = state === "set" ? gradeLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      gradeOf(row.note),
      lane,
      state === "set" ? gradeTone(row.note) : "",
      String(gradeStep(row.note)),
      catalogGrade(row.note) ? "1" : "0",
      wideGrade(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
