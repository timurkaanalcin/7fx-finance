/**
 * Herbarium sheets for the press desk, and the address already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_herbarium_sheet (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   day integer,
 *   press text not null default '',
 *   shelf text not null default '',
 *   ink text not null default '',
 *   grade integer,
 *   width integer,
 *   pinned boolean not null default false,
 *   pressed boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_address_lane_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_address_lane_review (
 *   customer_id text primary key
 * );
 */

export const SHEET_KEY = "crmv4-herbarium-sheets";
export const SHEET_VIEW_KEY = "crmv4-herbarium-views";
export const LANE_KEY = "crmv4-address-lane-hide";
export const LANE_REVIEW_KEY = "crmv4-address-lane-review";

export type SheetInk = "blank" | "ash" | "straw" | "soot";

export type SheetPress = "blank" | "flat" | "fold" | "roll";

export type SheetTray = "open" | "pressed" | "filed";

export type SheetPick = "blank" | "dawn" | "noon" | "dusk" | "bloom" | "leaf";

export type Sheet = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  day: number | null;
  press: string;
  shelf: string;
  ink: string;
  grade: number | null;
  width: number | null;
  pinned: boolean;
  pressed: boolean;
  filed: boolean;
  audit: string;
};

export type SheetView = {
  id: string;
  name: string;
  tray: SheetTray;
  query: string;
  keeper: string;
  press: string;
  shelf: string;
  ink: string;
  day: string;
  grade: string;
  width: string;
};

export type SheetCounts = {
  open: number;
  pressed: number;
  filed: number;
  pinned: number;
  bloom: number;
  late: number;
  soon: number;
  partner: number;
};

export type LaneState = "" | "set" | "clear";

export type LaneBand = "" | "brief" | "street" | "estate" | "atlas";

export type LaneDepth = "" | "near" | "mid" | "far";

export type LaneShape = "all" | "hash" | "odd";

export type LaneValue =
  | {
      address?: unknown;
      failedLoginCount?: unknown;
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
      country?: unknown;
      desk?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      validationStatus?: unknown;
      registrationDate?: unknown;
      birthDate?: unknown;
      lastContactAt?: unknown;
      lastSeenAt?: unknown;
      retentionNote?: unknown;
      city?: unknown;
      phone?: unknown;
      lastCountry?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type LaneRow = { id?: string; note?: LaneValue; label?: string | null };

export type LaneBandLine = { band: string; count: number };

export type LaneDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "ink", "pin", "unpin", "press", "release", "file", "restore", "shift"] as const;

const PRESSES = ["flat", "fold", "roll"] as const;

const INKS = ["ash", "straw", "soot"] as const;

const INK_ORDER = ["", "ash", "straw", "soot"] as const;

const PICKS = ["blank", "dawn", "noon", "dusk", "bloom", "leaf"] as const;

const BLOOMS = new Set([1, 7]);

const LEAVES = new Set([3, 4, 5]);

const GRADES = [1, 2, 3] as const;

const WIDTHS = [2, 4, 6] as const;

const LANE_BANDS = ["brief", "street", "estate", "atlas"] as const;

const DEPTHS = ["near", "mid", "far"] as const;

const STATES = ["set", "clear"] as const;

const LANE_BLOCK = [
  "failedLoginCount",
  "loginBlockedAt",
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
  "name",
  "email",
  "country",
  "desk",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "validationStatus",
  "registrationDate",
  "birthDate",
  "lastContactAt",
  "lastSeenAt",
  "retentionNote",
  "city",
  "phone",
  "lastCountry",
] as const;

const SHEET_CAP = 8;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SheetTray {
  return raw === "pressed" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function pressName(raw: unknown): Exclude<SheetPress, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PRESSES as readonly string[]).includes(text) ? (text as Exclude<SheetPress, "blank">) : "";
}

function inkName(raw: unknown): Exclude<SheetInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<SheetInk, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function sheetLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function sheetNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank shelf stays blank. Letters are stored in capitals. */
export function sheetShelf(raw: unknown): string {
  return clip(raw, 6).toUpperCase();
}

/**
 * A day is an integer from 1 through 7.
 * A blank value stays unset. 0 and 8 are not days.
 * A leading zero is the same day: 01 is 1, and 07 is 7. 08 is not a day.
 */
export function dayOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 7) return raw;
  if (typeof raw === "string" && /^(?:[1-7]|0[1-7])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A grade is an integer from 1 through 3.
 * A blank value stays unset. 0 and 4 are not grades.
 * A leading zero is the same grade: 01 is 1, and 03 is 3. 04 is not a grade.
 */
export function gradeOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && (GRADES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-3]|0[1-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A width is 2, 4, or 6. A blank value stays unset. A leading zero is not a width. */
export function widthOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WIDTHS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|6)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Flat, fold, roll, or blank. Anything else is blank. */
export function pressOf(raw: unknown): SheetPress {
  return pressName(raw) || "blank";
}

/** Ash, straw, soot, or blank. Anything else is blank. */
export function inkOf(raw: unknown): SheetInk {
  return inkName(raw) || "blank";
}

/** Dawn is 1–2. Noon is 3–4. Dusk is 5–7. An unset day is blank. */
export function dayBand(day: unknown): "blank" | "dawn" | "noon" | "dusk" {
  const value = dayOf(day);
  if (value === null) return "blank";
  if (value <= 2) return "dawn";
  if (value <= 4) return "noon";
  return "dusk";
}

/** Bloom days are 1 and 7. An unset day is not a bloom. */
export function bloomDay(day: unknown): boolean {
  const value = dayOf(day);
  return value !== null && BLOOMS.has(value);
}

/** Leaf days are 3, 4, and 5. 2 and 6 are not leaf. An unset day is not leaf. */
export function leafDay(day: unknown): boolean {
  const value = dayOf(day);
  return value !== null && LEAVES.has(value);
}

/**
 * The shortest signed step from the saved day to the typed day.
 * The week wraps at 7. A step of 3 stays. A step of -3 stays.
 * A positive step means the typed day is ahead of the sheet.
 */
export function dayGap(day: unknown, desk: unknown): number | null {
  const from = dayOf(day);
  const at = dayOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 3) diff -= 7;
  if (diff < -3) diff += 7;
  return diff;
}

/** A shelf that starts with IB is a partner shelf. A blank shelf is not. */
export function partnerShelf(shelf: unknown): boolean {
  return sheetShelf(shelf).startsWith("IB");
}

export function readSheets(raw: unknown): Sheet[] {
  if (!Array.isArray(raw)) return [];
  const out: Sheet[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Sheet>;
    const id = String(row.id || "").trim();
    const title = sheetLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: sheetNote(row.note),
      keeper: keeperLabel(row.keeper),
      day: dayOf(row.day),
      press: pressName(row.press),
      shelf: sheetShelf(row.shelf),
      ink: inkName(row.ink),
      grade: gradeOf(row.grade),
      width: widthOf(row.width),
      pinned: row.pinned === true,
      pressed: row.pressed === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SHEET_CAP);
}

export function addSheet(
  cards: readonly Sheet[],
  card: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    day?: unknown;
    press?: string;
    shelf?: string;
    ink?: string;
    grade?: unknown;
    width?: unknown;
  },
): Sheet[] {
  const current = readSheets(cards);
  const id = String(card.id || "").trim();
  const title = sheetLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Sheet = {
    id,
    title,
    note: sheetNote(card.note),
    keeper: keeperLabel(card.keeper),
    day: dayOf(card.day),
    press: pressName(card.press),
    shelf: sheetShelf(card.shelf),
    ink: inkName(card.ink),
    grade: gradeOf(card.grade),
    width: widthOf(card.width),
    pinned: false,
    pressed: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SHEET_CAP);
}

/** Blank becomes ash. Ash becomes straw, straw becomes soot, and soot returns to ash. */
export function cycleInk(cards: readonly Sheet[], id: string): Sheet[] {
  return readSheets(cards).map((card) => {
    if (card.id !== id) return card;
    const at = INK_ORDER.indexOf(card.ink as (typeof INK_ORDER)[number]);
    const next = at < 0 || at >= INKS.length ? INKS[0] : INKS[at % INKS.length];
    if (!next || next === card.ink) return card;
    return { ...card, ink: next, audit: "ink" };
  });
}

export function setSheetPin(cards: readonly Sheet[], id: string, pinned: boolean): Sheet[] {
  return readSheets(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setSheetPress(cards: readonly Sheet[], id: string, pressed: boolean): Sheet[] {
  return readSheets(cards).map((card) => (card.id === id ? { ...card, pressed, audit: pressed ? "press" : "release" } : card));
}

export function setSheetFiled(cards: readonly Sheet[], id: string, filed: boolean): Sheet[] {
  return readSheets(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "restore" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSheet(cards: readonly Sheet[], id: string, title: string): Sheet[] {
  const current = readSheets(cards);
  const next = sheetLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editSheetNote(cards: readonly Sheet[], id: string, note: string): Sheet[] {
  const current = readSheets(cards);
  const next = sheetNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkSheetPin(cards: readonly Sheet[], ids: readonly string[], pinned: boolean): Sheet[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSheets(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkSheetFile(cards: readonly Sheet[], ids: readonly string[], filed: boolean): Sheet[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSheets(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "restore" } : card));
}

/** A blank or unknown press is left out. A sheet already at that press is left as it is. */
export function bulkSheetPress(cards: readonly Sheet[], ids: readonly string[], press: string): Sheet[] {
  const name = pressName(press);
  const current = readSheets(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.press !== name ? { ...card, press: name, audit: "shift" } : card));
}

export function resetSheets(): Sheet[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function sheetCopy(raw: unknown): string {
  return sheetLine(raw);
}

function inTray(card: Sheet, tray: SheetTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "pressed") return card.pressed && !card.filed;
  return !card.pressed && !card.filed;
}

function dayHit(day: number | null, exact: number | null, pick: SheetPick | null): boolean {
  if (exact !== null) return day === exact;
  if (pick === null) return true;
  if (pick === "blank") return day === null;
  if (pick === "bloom") return bloomDay(day);
  if (pick === "leaf") return leafDay(day);
  return dayBand(day) === pick;
}

function inkScore(ink: string): number {
  if (ink === "soot") return 3;
  if (ink === "straw") return 2;
  if (ink === "ash") return 1;
  return 0;
}

function waitingBloom(card: Sheet): boolean {
  return bloomDay(card.day) && inTray(card, "open");
}

function haystack(card: Sheet): string {
  return `${card.title}\n${card.note}\n${card.shelf}`.toLowerCase();
}

/** An open sheet is late when the desk day is more than one step ahead. */
export function lateSheet(card: Sheet, desk: unknown): boolean {
  const gap = dayGap(card.day, desk);
  return inTray(card, "open") && gap !== null && gap > 1;
}

/** An open sheet with a width of 2 is due soon. A pressed or filed sheet is not. */
export function soonSheet(card: Sheet): boolean {
  return inTray(card, "open") && card.width === 2;
}

/** Search matches the title, the note, and the shelf. The keeper, the day, and the press are not part of the query. */
export function visibleSheets(
  cards: readonly Sheet[],
  tray: SheetTray,
  query: string,
  keeper: string | null,
  press: SheetPress | null,
  shelf: string | null,
  ink: SheetInk | null,
  exact: number | null,
  pick: SheetPick | null,
  grade: number | "blank" | null,
  width: number | "blank" | null,
  sootOnly: boolean,
  bloomOnly: boolean,
  partnerOnly: boolean,
): Sheet[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  const wantShelf = shelf === null ? null : sheetShelf(shelf);
  return readSheets(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (sootOnly && card.ink !== "soot") return false;
      if (wantKeeper !== null && keeperLabel(card.keeper) !== wantKeeper) return false;
      if (press !== null && pressOf(card.press) !== press) return false;
      if (wantShelf !== null && sheetShelf(card.shelf) !== wantShelf) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (!dayHit(card.day, exact, pick)) return false;
      if (grade === "blank" && card.grade !== null) return false;
      if (typeof grade === "number" && card.grade !== grade) return false;
      if (width === "blank" && card.width !== null) return false;
      if (typeof width === "number" && card.width !== width) return false;
      if (bloomOnly && !waitingBloom(card)) return false;
      if (partnerOnly && !partnerShelf(card.shelf)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (inkScore(a.ink) !== inkScore(b.ink)) return inkScore(b.ink) - inkScore(a.ink);
      return a.title.localeCompare(b.title);
    });
}

/** The day orders the press. An unset day stays at the end. Search matches the title, the note, and the shelf. */
export function dayTimeline(cards: readonly Sheet[], query: string): Sheet[] {
  const text = query.trim().toLowerCase();
  return readSheets(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.day === null && b.day !== null) return 1;
      if (a.day !== null && b.day === null) return -1;
      if (a.day !== null && b.day !== null && a.day !== b.day) return a.day - b.day;
      return a.title.localeCompare(b.title);
    });
}

export function sheetCounts(cards: readonly Sheet[], desk: unknown): SheetCounts {
  const rows = readSheets(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    pressed: rows.filter((card) => inTray(card, "pressed")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    bloom: rows.filter((card) => waitingBloom(card)).length,
    late: rows.filter((card) => lateSheet(card, desk)).length,
    soon: rows.filter((card) => soonSheet(card)).length,
    partner: rows.filter((card) => partnerShelf(card.shelf)).length,
  };
}

/** How many distinct days the saved sheets already use. An unset day is not counted. */
export function usedDays(cards: readonly Sheet[]): number {
  const seen = new Set<number>();
  for (const card of readSheets(cards)) if (card.day !== null) seen.add(card.day);
  return seen.size;
}

/** Share of the saved sheets. A zero total stays at zero. */
export function sheetShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function sheetKeepers(cards: readonly Sheet[]): string[] {
  const out: string[] = [];
  for (const card of readSheets(cards)) {
    if (card.keeper && !out.includes(card.keeper)) out.push(card.keeper);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function sheetShelves(cards: readonly Sheet[]): string[] {
  const out: string[] = [];
  for (const card of readSheets(cards)) {
    if (card.shelf && !out.includes(card.shelf)) out.push(card.shelf);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function sheetPresses(cards: readonly Sheet[]): Exclude<SheetPress, "blank">[] {
  const seen = new Set<string>();
  for (const card of readSheets(cards)) if (card.press) seen.add(card.press);
  return PRESSES.filter((press) => seen.has(press));
}

export function sheetInks(cards: readonly Sheet[]): Exclude<SheetInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readSheets(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

/** Open sheets already assigned to this keeper. A blank keeper is not a load. */
export function keeperLoad(cards: readonly Sheet[], keeper: string): number {
  const name = keeperLabel(keeper);
  if (!name) return 0;
  return readSheets(cards).filter((card) => card.keeper === name && inTray(card, "open")).length;
}

/** Three presses. Index 0 is flat. Index 2 is roll. */
export function pressCounts(cards: readonly Sheet[]): number[] {
  const rows = readSheets(cards);
  return PRESSES.map((press) => rows.filter((card) => pressOf(card.press) === press).length);
}

/** "all" and "blank" stay. A keeper that is no longer on a sheet falls back to all. */
export function activeKeeper(filter: string, keepers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const keeper = keeperLabel(filter);
  return keeper && keepers.includes(keeper) ? keeper : "all";
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return keeperLabel(filter) || null;
}

/** "all" and "blank" stay. A press that is no longer on a sheet falls back to all. */
export function activePress(filter: string, presses: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const press = pressName(filter);
  return press && presses.includes(press) ? press : "all";
}

export function pressArg(filter: string): SheetPress | null {
  if (filter === "blank") return "blank";
  return pressName(filter) || null;
}

/** "all" and "blank" stay. A shelf that is no longer on a sheet falls back to all. */
export function activeShelf(filter: string, shelves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shelf = sheetShelf(filter);
  return shelf && shelves.includes(shelf) ? shelf : "all";
}

export function shelfArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return sheetShelf(filter) || null;
}

/** "all" and "blank" stay. An ink that is no longer on a sheet falls back to all. */
export function activeInk(filter: string, inks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ink = inkName(filter);
  return ink && inks.includes(ink) ? ink : "all";
}

export function inkArg(filter: string): SheetInk | null {
  if (filter === "blank") return "blank";
  return inkName(filter) || null;
}

/** All, blank, the bands, bloom, leaf, and the days 1 through 7 stay. Anything else is all. */
export function activeDay(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const day = dayOf(filter);
  return day === null ? "all" : String(day);
}

export function dayArg(filter: string): { exact: number | null; pick: SheetPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as SheetPick };
  const day = dayOf(filter);
  return day === null ? { exact: null, pick: null } : { exact: day, pick: null };
}

/** All, blank, and the grades 1 through 3 stay. Anything else is all. */
export function activeGrade(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const grade = gradeOf(filter);
  return grade === null ? "all" : String(grade);
}

export function gradeArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return gradeOf(filter);
}

/** All, blank, and the widths 2, 4, and 6 stay. Anything else is all. */
export function activeWidth(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const width = widthOf(filter);
  return width === null ? "all" : String(width);
}

export function widthArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return widthOf(filter);
}

/** Other sheets with the same press and the same day. A blank press or a blank day clashes with nothing. */
export function dayClashIds(cards: readonly Sheet[], id: string): string[] {
  const rows = readSheets(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.press || card.day === null) return [];
  return rows
    .filter((item) => item.id !== id && item.press === card.press && item.day === card.day)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved sheets share a press and a day with another sheet. */
export function clashDayCount(cards: readonly Sheet[]): number {
  const rows = readSheets(cards);
  return rows.filter((card) => dayClashIds(rows, card.id).length > 0).length;
}

/** Other sheets with the same press and the same grade. A blank press or a blank grade clashes with nothing. */
export function gradeClashIds(cards: readonly Sheet[], id: string): string[] {
  const rows = readSheets(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.press || card.grade === null) return [];
  return rows
    .filter((item) => item.id !== id && item.press === card.press && item.grade === card.grade)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved sheets share a press and a grade with another sheet. */
export function gradeClashCount(cards: readonly Sheet[]): number {
  const rows = readSheets(cards);
  return rows.filter((card) => gradeClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open sheet at or after the day you type, skipping soot.
 * After 7, the week wraps to the earliest open sheet that is not soot.
 */
export function nextSheet(cards: readonly Sheet[], desk: unknown): string {
  const now = dayOf(desk);
  if (now === null) return "";
  const waiting = readSheets(cards).filter((card) => inTray(card, "open") && card.day !== null && card.ink !== "soot");
  if (!waiting.length) return "";
  const byDay = (a: Sheet, b: Sheet) => (a.day ?? 0) - (b.day ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.day ?? 0) >= now).sort(byDay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byDay)[0].id;
}

/**
 * The press with the fewest open sheets.
 * A tie keeps the earlier press: flat, then fold, then roll.
 * Sheets with no press are not a load. An empty desk still suggests flat.
 */
export function suggestPress(cards: readonly Sheet[]): Exclude<SheetPress, "blank"> {
  const rows = readSheets(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<SheetPress, "blank"> = "flat";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const press of PRESSES) {
    const count = rows.filter((card) => card.press === press).length;
    if (count < bestCount) {
      best = press;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The keeper with the fewest open sheets.
 * A tie keeps the earlier name. A blank keeper is not a candidate.
 * A desk with no named keeper suggests nothing.
 */
export function suggestKeeper(cards: readonly Sheet[]): string {
  const rows = readSheets(cards).filter((card) => inTray(card, "open") && card.keeper);
  const keepers: string[] = [];
  for (const card of rows) {
    if (!keepers.includes(card.keeper)) keepers.push(card.keeper);
  }
  keepers.sort((a, b) => a.localeCompare(b));
  if (!keepers.length) return "";
  let best = keepers[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const keeper of keepers) {
    const count = rows.filter((card) => card.keeper === keeper).length;
    if (count < bestCount) {
      best = keeper;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The width with the fewest open sheets.
 * A tie keeps 4, then 2, then 6, so a width of 2 is not the first choice.
 * An empty desk still suggests 4.
 */
export function suggestWidth(cards: readonly Sheet[]): (typeof WIDTHS)[number] {
  const rows = readSheets(cards).filter((card) => inTray(card, "open"));
  const order = [4, 2, 6] as const;
  let best: (typeof WIDTHS)[number] = 4;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const width of order) {
    const count = rows.filter((card) => card.width === width).length;
    if (count < bestCount) {
      best = width;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the sheets saved in this browser. The gap and the late mark use the day you pass. */
export function sheetsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,day,press,shelf,ink,grade,width,band,pinned,pressed,filed,gap,late,soon,partner,note,audit"];
  for (const card of readSheets(raw)) {
    const gap = dayGap(card.day, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.day === null ? "" : String(card.day),
      card.press,
      csvCell(card.shelf),
      card.ink,
      card.grade === null ? "" : String(card.grade),
      card.width === null ? "" : String(card.width),
      dayBand(card.day),
      card.pinned ? "1" : "0",
      card.pressed ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSheet(card, desk) ? "1" : "0",
      soonSheet(card) ? "1" : "0",
      partnerShelf(card.shelf) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function keeperSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keeperLabel(raw) || "all";
}

function pressSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return pressName(raw) || "all";
}

function shelfSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return sheetShelf(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

export function readSheetViews(raw: unknown): SheetView[] {
  if (!Array.isArray(raw)) return [];
  const out: SheetView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SheetView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      keeper: keeperSlot(row.keeper),
      press: pressSlot(row.press),
      shelf: shelfSlot(row.shelf),
      ink: inkSlot(row.ink),
      day: activeDay(String(row.day || "all")),
      grade: activeGrade(String(row.grade || "all")),
      width: activeWidth(String(row.width || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSheetView(views: readonly SheetView[], view: SheetView): SheetView[] {
  const current = readSheetViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    keeper: keeperSlot(view.keeper),
    press: pressSlot(view.press),
    shelf: shelfSlot(view.shelf),
    ink: inkSlot(view.ink),
    day: activeDay(view.day),
    grade: activeGrade(view.grade),
    width: activeWidth(view.width),
  }].slice(0, VIEW_CAP);
}

export function dropSheetView(views: readonly SheetView[], id: string): SheetView[] {
  return readSheetViews(views).filter((view) => view.id !== id);
}

function laneText(raw: unknown): string {
  return clip(raw, 80);
}

function laneBody(value: LaneValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: laneText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (LANE_BLOCK.some((key) => key in value)) return null;
  if (!("address" in value)) return { text: "", explicit: false };
  const inner = value.address;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: laneText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set address is text. A clear address is an explicit blank. A missing field stays unmarked.
 * A name, a phone, and the other blocked fields are not an address.
 */
export function laneState(value: LaneValue): LaneState {
  const body = laneBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped address. A clear or unmarked value stays blank. */
export function laneCopy(value: LaneValue): string {
  const body = laneBody(value);
  return body?.text || "";
}

/** Digits in the address, capped at 12. A clear or unmarked value stays unset. */
export function laneDigits(value: LaneValue): string {
  const body = laneBody(value);
  if (!body || !body.text) return "";
  return body.text.replace(/\D/g, "").slice(0, 12);
}

/**
 * Brief is 1–12 characters. Street is 13–36. Estate is 37–64. Sixty-five and above is atlas.
 * A blank address has no band.
 */
export function laneBand(value: LaneValue): LaneBand {
  const text = laneCopy(value);
  if (!text) return "";
  const length = text.length;
  if (length <= 12) return "brief";
  if (length <= 36) return "street";
  if (length <= 64) return "estate";
  return "atlas";
}

/**
 * Near is one comma part. Mid is two. Three and above is far.
 * A blank address has no depth.
 */
export function laneDepth(value: LaneValue): LaneDepth {
  const text = laneCopy(value);
  if (!text) return "";
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean).length;
  if (parts <= 1) return "near";
  if (parts === 2) return "mid";
  return "far";
}

/** How many comma parts the address carries. A blank address stays at zero. */
export function laneParts(value: LaneValue): number {
  const text = laneCopy(value);
  if (!text) return 0;
  return text.split(",").map((part) => part.trim()).filter(Boolean).length;
}

/** An address that contains # is a hash lane. Other marks are not. */
export function hashLane(value: LaneValue): boolean {
  return laneCopy(value).includes("#");
}

/** A set address with an odd digit count. An even count is not odd. */
export function oddLane(value: LaneValue): boolean {
  const digits = laneDigits(value);
  return Boolean(digits) && digits.length % 2 === 1;
}

export function laneBands(rows: readonly LaneRow[]): LaneBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = laneState(row.note);
    if (state === "") continue;
    const band = state === "set" ? laneBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: LaneBandLine[] = [];
  for (const band of ["", ...LANE_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function laneDepths(rows: readonly LaneRow[]): LaneDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = laneDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: LaneDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps brief, then street, estate, and atlas. An unmarked field is not a lead. */
export function leadingLane(rows: readonly LaneRow[]): string {
  const named = laneBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["brief", "street", "estate", "atlas"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps near, then mid, then far. A blank address is not a lead. */
export function leadingLaneDepth(rows: readonly LaneRow[]): string {
  const named = laneDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** How many set addresses have an odd digit count. */
export function oddLaneCount(rows: readonly LaneRow[]): number {
  return rows.filter((row) => laneState(row.note) === "set" && oddLane(row.note)).length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function laneShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((LANE_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentLanes(rows: readonly LaneRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = laneState(row.note);
    const token = state === "set" ? laneBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenLanes(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandToken(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleLane(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenLanes(hidden, present);
  const current = readHiddenLanes(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleLaneBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenLanes(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeLane(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (LANE_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function laneArg(filter: string): LaneBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (LANE_BANDS as readonly string[]).includes(filter) ? (filter as LaneBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeLaneDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function laneDepthArg(filter: string): LaneDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as LaneDepth) : null;
}

function rowId(row: LaneRow): string {
  return String(row.id || "").trim();
}

export function readReviewed(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 40);
}

export function toggleReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewed(reviewed, present);
  const current = readReviewed(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewed(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 40);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the address are not part of the query. */
export function visibleLaneCustomers<T extends LaneRow>(
  rows: readonly T[],
  band: LaneBand | "blank" | null,
  depth: LaneDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: LaneShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = laneState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && laneBand(row.note) !== band) return false;
    if (depth !== null && laneDepth(row.note) !== depth) return false;
    if (shape === "hash" && !hashLane(row.note)) return false;
    if (shape === "odd" && (state !== "set" || !oddLane(row.note))) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function lanesCsv(rows: readonly LaneRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = laneState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of laneBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of laneDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "odd", String(oddLaneCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function laneRowsCsv(rows: readonly LaneRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,parts,hash,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(laneBand(row.note)),
      csvCell(laneDepth(row.note)),
      String(laneParts(row.note)),
      hashLane(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const SHEET_PRESSES = PRESSES;
export const LANE_BAND_NAMES = ["brief", "street", "estate", "atlas"] as const;
