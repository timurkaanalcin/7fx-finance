/**
 * Folio warrants for the document gallery, and mail monograms already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_folio_warrant (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   day integer,
 *   shelf text not null default '',
 *   rank text not null default '',
 *   tone integer,
 *   span integer,
 *   marks text not null default '',
 *   wait integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   sealed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_mono_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_mono_review (
 *   customer_id text primary key
 * );
 */

export const FLW_KEY = "crmv4-folio-warrant";
export const FLW_VIEW_KEY = "crmv4-folio-views";
export const FLW_DENSITY_KEY = "crmv4-folio-density";
export const MONO_KEY = "crmv4-mono-hide";
export const MONO_REVIEW_KEY = "crmv4-mono-review";

export type FlwShelf = "blank" | "vellum" | "linen" | "slate";

export type FlwRank = "blank" | "open" | "marked" | "filed";

export type FlwTray = "open" | "held" | "sealed";

export type DayPick = "blank" | "early" | "mid" | "late" | "press" | "quiet";

export type FlwDensity = "roomy" | "tight";

export type FlwSort = "day" | "title";

export type FolioWarrant = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  day: number | null;
  shelf: string;
  rank: string;
  tone: number | null;
  span: number | null;
  marks: string[];
  wait: number;
  pinned: boolean;
  held: boolean;
  sealed: boolean;
  audit: string;
};

export type FlwView = {
  id: string;
  name: string;
  tray: FlwTray;
  query: string;
  clerk: string;
  shelf: string;
  rank: string;
  day: string;
  tone: string;
  span: string;
};

export type FlwCounts = {
  open: number;
  held: number;
  sealed: number;
  pinned: number;
  press: number;
  late: number;
  soon: number;
  wait: number;
  house: number;
};

export type MonoState = "" | "set" | "clear";

export type MonoBand = "" | "seed" | "pair";

export type MonoTone = "" | "gilt" | "ink";

export type MonoShape = "all" | "catalog" | "pair" | "gilt";

export type MonoValue =
  | { email?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type MonoRow = { id: string; note?: MonoValue; label?: string | null };

export type MonoBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "rank", "pin", "unpin", "hold", "lift", "seal", "unseal", "shelf", "mark", "wait"] as const;

const SHELVES = ["vellum", "linen", "slate"] as const;

const RANKS = ["open", "marked", "filed"] as const;

const RANK_ORDER = ["", "open", "marked", "filed"] as const;

const PRESS_DAYS = new Set([2, 4, 6]);

const QUIET_DAYS = new Set([1, 7]);

const HOUSE = new Set(["VELLUM", "SLATE"]);

const MONO_BANDS = ["seed", "pair"] as const;

const CATALOG = new Set(["AE", "IO", "UX"]);

const MONO_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const WARRANT_CAP = 7;

const VIEW_CAP = 4;

const MARK_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FlwTray {
  return raw === "held" || raw === "sealed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function shelfName(raw: unknown): Exclude<FlwShelf, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHELVES as readonly string[]).includes(text) ? (text as Exclude<FlwShelf, "blank">) : "";
}

function rankName(raw: unknown): Exclude<FlwRank, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (RANKS as readonly string[]).includes(text) ? (text as Exclude<FlwRank, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function warrantLine(raw: unknown): string {
  return clip(raw, 24);
}

/** A blank note stays blank. It is not filled in. */
export function warrantNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A shelf is VELLUM, LINEN, or SLATE. Anything else stays blank. Letters are stored in capitals. */
export function shelfOf(raw: unknown): string {
  const name = shelfName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A day is an integer from 1 through 7.
 * A blank value stays unset. 0 and 8 are not days.
 * A leading zero is not a day.
 */
export function dayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 7) return null;
    return raw;
  }
  const text = clip(raw, 3);
  if (!/^[1-7]$/.test(text)) return null;
  return Number(text);
}

/** A tone is 2, 4, or 8. A blank value stays unset. A leading zero is not a tone. */
export function toneOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

/** A span is 15, 30, or 45 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 15 | 30 | 45 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** A wait is 0, 15, or 30. Anything else is not a wait. */
export function waitOf(raw: unknown): 0 | 15 | 30 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  return null;
}

export function dayBand(day: unknown): "blank" | "early" | "mid" | "late" {
  const value = dayOf(day);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Press days are 2, 4, and 6. An unset day is not a press day. */
export function pressDay(day: unknown): boolean {
  const value = dayOf(day);
  return value !== null && PRESS_DAYS.has(value);
}

/** Quiet days are 1 and 7. A press day is not quiet. An unset day is not quiet. */
export function quietDay(day: unknown): boolean {
  const value = dayOf(day);
  return value !== null && QUIET_DAYS.has(value);
}

/**
 * How far a day sits behind the desk day, on a week of 7.
 * A positive gap means the warrant day is behind. A negative gap means it is ahead.
 * A gap of zero means the same day. An unset day has no gap.
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

/** VELLUM and SLATE are house shelves. LINEN is a guest shelf. A blank shelf is not a house shelf. */
export function houseShelf(shelf: unknown): boolean {
  return HOUSE.has(shelfOf(shelf));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): FlwDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Day or title. Anything else stays on the day. */
export function sortMode(raw: unknown): FlwSort {
  return raw === "title" ? "title" : "day";
}

function markOf(raw: unknown): string {
  const text = clip(raw, 4).toLowerCase();
  return /^[a-z]$/.test(text) ? text : "";
}

function marksOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const mark = markOf(part);
    if (mark && !out.includes(mark)) out.push(mark);
    if (out.length >= MARK_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): FolioWarrant | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<FolioWarrant>;
  const id = clip(row.id, 24);
  const title = warrantLine(row.title);
  if (!id || !title) return null;
  const wait = waitOf(row.wait);
  return {
    id,
    title,
    note: warrantNote(row.note),
    clerk: clerkLabel(row.clerk),
    day: dayOf(row.day),
    shelf: shelfOf(row.shelf),
    rank: rankName(row.rank),
    tone: toneOf(row.tone),
    span: spanOf(row.span),
    marks: marksOf(row.marks),
    wait: wait === null ? 0 : wait,
    pinned: row.pinned === true,
    held: row.held === true,
    sealed: row.sealed === true,
    audit: auditCode(row.audit),
  };
}

export function readWarrants(raw: unknown): FolioWarrant[] {
  if (!Array.isArray(raw)) return [];
  const out: FolioWarrant[] = [];
  for (const item of raw) {
    const warrant = readOne(item);
    if (!warrant || out.some((row) => row.id === warrant.id || row.title === warrant.title)) continue;
    out.push(warrant);
  }
  return out.slice(0, WARRANT_CAP);
}

export function addWarrant(
  warrants: readonly FolioWarrant[],
  warrant: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    day?: unknown;
    shelf?: string;
    rank?: string;
    tone?: unknown;
    span?: unknown;
    marks?: unknown;
    wait?: unknown;
  },
): FolioWarrant[] {
  const current = readWarrants(warrants);
  const id = String(warrant.id || "").trim();
  const title = warrantLine(warrant.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const wait = waitOf(warrant.wait);
  const next: FolioWarrant = {
    id,
    title,
    note: warrantNote(warrant.note),
    clerk: clerkLabel(warrant.clerk),
    day: dayOf(warrant.day),
    shelf: shelfOf(warrant.shelf),
    rank: rankName(warrant.rank),
    tone: toneOf(warrant.tone),
    span: spanOf(warrant.span),
    marks: marksOf(warrant.marks),
    wait: wait === null ? 0 : wait,
    pinned: false,
    held: false,
    sealed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, WARRANT_CAP);
}

export function cycleRank(warrants: readonly FolioWarrant[], id: string): FolioWarrant[] {
  return readWarrants(warrants).map((warrant) => {
    if (warrant.id !== id) return warrant;
    const at = RANK_ORDER.indexOf(warrant.rank as (typeof RANK_ORDER)[number]);
    const next = at < 0 || at >= RANKS.length ? RANKS[0] : RANKS[at % RANKS.length];
    if (!next || next === warrant.rank) return warrant;
    return { ...warrant, rank: next, audit: "rank" };
  });
}

/** A blank title is left as it is. */
export function editWarrant(warrants: readonly FolioWarrant[], id: string, title: unknown): FolioWarrant[] {
  const next = warrantLine(title);
  if (!next) return readWarrants(warrants);
  const current = readWarrants(warrants);
  if (current.some((warrant) => warrant.id !== id && warrant.title === next)) return current;
  return current.map((warrant) => (warrant.id === id && warrant.title !== next ? { ...warrant, title: next, audit: "edit" } : warrant));
}

/** A blank note is left as it is. */
export function editWarrantNote(warrants: readonly FolioWarrant[], id: string, note: unknown): FolioWarrant[] {
  const next = warrantNote(note);
  if (!next) return readWarrants(warrants);
  return readWarrants(warrants).map((warrant) => (warrant.id === id && warrant.note !== next ? { ...warrant, note: next, audit: "edit" } : warrant));
}

/** A mark that is already on the warrant, or a fourth mark, is left out. A mark is one letter. */
export function addWarrantMark(warrants: readonly FolioWarrant[], id: string, mark: unknown): FolioWarrant[] {
  const next = markOf(mark);
  if (!next) return readWarrants(warrants);
  return readWarrants(warrants).map((warrant) => {
    if (warrant.id !== id || warrant.marks.includes(next) || warrant.marks.length >= MARK_CAP) return warrant;
    return { ...warrant, marks: [...warrant.marks, next], audit: "mark" };
  });
}

/** An unknown wait is left as it is. 0 clears the wait. */
export function setWarrantWait(warrants: readonly FolioWarrant[], id: string, wait: unknown): FolioWarrant[] {
  const next = waitOf(wait);
  if (next === null) return readWarrants(warrants);
  return readWarrants(warrants).map((warrant) => (warrant.id === id && warrant.wait !== next ? { ...warrant, wait: next, audit: "wait" } : warrant));
}

export function setWarrantPin(warrants: readonly FolioWarrant[], id: string, pinned: boolean): FolioWarrant[] {
  return readWarrants(warrants).map((warrant) => (warrant.id === id && warrant.pinned !== pinned ? { ...warrant, pinned, audit: pinned ? "pin" : "unpin" } : warrant));
}

export function setWarrantHold(warrants: readonly FolioWarrant[], id: string, held: boolean): FolioWarrant[] {
  return readWarrants(warrants).map((warrant) => (warrant.id === id && warrant.held !== held ? { ...warrant, held, audit: held ? "hold" : "lift" } : warrant));
}

export function setWarrantSeal(warrants: readonly FolioWarrant[], id: string, sealed: boolean): FolioWarrant[] {
  return readWarrants(warrants).map((warrant) => (warrant.id === id && warrant.sealed !== sealed ? { ...warrant, sealed, audit: sealed ? "seal" : "unseal" } : warrant));
}

export function bulkWarrantShelf(warrants: readonly FolioWarrant[], ids: readonly string[], shelf: unknown): FolioWarrant[] {
  const next = shelfOf(shelf);
  if (!next) return readWarrants(warrants);
  const picked = new Set(ids);
  return readWarrants(warrants).map((warrant) => (picked.has(warrant.id) && warrant.shelf !== next ? { ...warrant, shelf: next, audit: "shelf" } : warrant));
}

export function bulkWarrantPin(warrants: readonly FolioWarrant[], ids: readonly string[], pinned: boolean): FolioWarrant[] {
  const picked = new Set(ids);
  return readWarrants(warrants).map((warrant) => (picked.has(warrant.id) && warrant.pinned !== pinned ? { ...warrant, pinned, audit: pinned ? "pin" : "unpin" } : warrant));
}

export function bulkWarrantSeal(warrants: readonly FolioWarrant[], ids: readonly string[], sealed: boolean): FolioWarrant[] {
  const picked = new Set(ids);
  return readWarrants(warrants).map((warrant) => (picked.has(warrant.id) && warrant.sealed !== sealed ? { ...warrant, sealed, audit: sealed ? "seal" : "unseal" } : warrant));
}

export function bulkWarrantMark(warrants: readonly FolioWarrant[], ids: readonly string[], mark: unknown): FolioWarrant[] {
  return ids.reduce((rows, id) => addWarrantMark(rows, id, mark), readWarrants(warrants));
}

export function resetWarrants(): FolioWarrant[] {
  return [];
}

function inTray(warrant: FolioWarrant, tray: FlwTray): boolean {
  if (tray === "sealed") return warrant.sealed;
  if (tray === "held") return warrant.held && !warrant.sealed;
  return !warrant.held && !warrant.sealed;
}

function dayHit(day: number | null, exact: number | null, pick: DayPick | null): boolean {
  if (exact !== null) return day === exact;
  if (pick === null) return true;
  if (pick === "blank") return day === null;
  if (pick === "press") return pressDay(day);
  if (pick === "quiet") return quietDay(day);
  return dayBand(day) === pick;
}

/** An open warrant whose day sits more than two steps behind the desk day. A wait, a hold, or a seal is not late. */
export function lateWarrant(warrant: FolioWarrant, desk: unknown): boolean {
  const gap = dayGap(warrant.day, desk);
  return inTray(warrant, "open") && warrant.wait === 0 && gap !== null && gap > 2;
}

/** An open warrant with a span of 15 is due now. A wait, a hold, or a seal is not. */
export function soonWarrant(warrant: FolioWarrant): boolean {
  return inTray(warrant, "open") && warrant.wait === 0 && warrant.span === 15;
}

/** Open warrants that are late or due now. A waiting warrant stays off the reminder list. */
export function reminderWarrants(warrants: readonly FolioWarrant[], desk: unknown): FolioWarrant[] {
  return readWarrants(warrants).filter((warrant) => lateWarrant(warrant, desk) || soonWarrant(warrant));
}

/** Search matches the title, the note, the clerk, and the marks. */
export function visibleWarrants(
  warrants: readonly FolioWarrant[],
  tray: FlwTray,
  query: string,
  clerk: string | null,
  shelf: string | null,
  rank: string | null,
  exact: number | null,
  pick: DayPick | null,
  tone: number | "blank" | null,
  span: number | "blank" | null,
  markedOnly: boolean,
  pressOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): FolioWarrant[] {
  const text = query.trim().toLowerCase();
  return readWarrants(warrants).filter((warrant) => {
    if (!inTray(warrant, tray)) return false;
    if (text) {
      const hay = `${warrant.title} ${warrant.note} ${warrant.clerk} ${warrant.marks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (clerk !== null && warrant.clerk !== clerk) return false;
    if (shelf === "blank" ? Boolean(warrant.shelf) : shelf && warrant.shelf !== shelf) return false;
    if (rank === "blank" ? Boolean(warrant.rank) : rank && warrant.rank !== rank) return false;
    if (!dayHit(warrant.day, exact, pick)) return false;
    if (tone === "blank" ? warrant.tone !== null : tone !== null && warrant.tone !== tone) return false;
    if (span === "blank" ? warrant.span !== null : span !== null && warrant.span !== span) return false;
    if (markedOnly && warrant.rank !== "marked") return false;
    if (pressOnly && !pressDay(warrant.day)) return false;
    if (houseOnly && !houseShelf(warrant.shelf)) return false;
    if (quietOnly && !quietDay(warrant.day)) return false;
    if (awakeOnly && warrant.wait !== 0) return false;
    return true;
  });
}

export function sortWarrants(warrants: readonly FolioWarrant[], mode: FlwSort): FolioWarrant[] {
  const rows = warrants.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.day ?? 99) - (b.day ?? 99));
  return rows.sort((a, b) => (a.day ?? 99) - (b.day ?? 99) || a.title.localeCompare(b.title));
}

export function warrantTimeline(warrants: readonly FolioWarrant[], query: string): FolioWarrant[] {
  const text = query.trim().toLowerCase();
  return sortWarrants(
    readWarrants(warrants).filter((warrant) => warrant.day !== null && (!text || warrant.title.toLowerCase().includes(text))),
    "day",
  );
}

export function warrantCounts(warrants: readonly FolioWarrant[], desk: unknown): FlwCounts {
  const rows = readWarrants(warrants);
  return {
    open: rows.filter((warrant) => inTray(warrant, "open")).length,
    held: rows.filter((warrant) => inTray(warrant, "held")).length,
    sealed: rows.filter((warrant) => inTray(warrant, "sealed")).length,
    pinned: rows.filter((warrant) => warrant.pinned).length,
    press: rows.filter((warrant) => inTray(warrant, "open") && warrant.wait === 0 && pressDay(warrant.day)).length,
    late: rows.filter((warrant) => lateWarrant(warrant, desk)).length,
    soon: rows.filter((warrant) => soonWarrant(warrant)).length,
    wait: rows.filter((warrant) => inTray(warrant, "open") && warrant.wait > 0).length,
    house: rows.filter((warrant) => inTray(warrant, "open") && houseShelf(warrant.shelf)).length,
  };
}

export function warrantShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Distinct days on open warrants. */
export function usedDays(warrants: readonly FolioWarrant[]): number {
  const days = new Set<number>();
  for (const warrant of readWarrants(warrants)) {
    if (inTray(warrant, "open") && warrant.day !== null) days.add(warrant.day);
  }
  return days.size;
}

/** Open warrants that share a day and a shelf. A different shelf on the same day is not a clash. */
export function clashDayCount(warrants: readonly FolioWarrant[]): number {
  const groups = new Map<string, number>();
  for (const warrant of readWarrants(warrants)) {
    if (!inTray(warrant, "open") || warrant.day === null || !warrant.shelf) continue;
    const key = `${warrant.day}:${warrant.shelf}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open warrants that share a tone. An unset tone is not a clash. */
export function toneClashCount(warrants: readonly FolioWarrant[]): number {
  const groups = new Map<number, number>();
  for (const warrant of readWarrants(warrants)) {
    if (!inTray(warrant, "open") || warrant.tone === null) continue;
    groups.set(warrant.tone, (groups.get(warrant.tone) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * The shelf with the fewest open warrants.
 * A tie keeps LINEN, then VELLUM, then SLATE.
 * An empty desk still suggests LINEN.
 */
export function suggestShelf(warrants: readonly FolioWarrant[]): "LINEN" | "VELLUM" | "SLATE" {
  const rows = readWarrants(warrants).filter((warrant) => inTray(warrant, "open"));
  const order = ["LINEN", "VELLUM", "SLATE"] as const;
  let best: "LINEN" | "VELLUM" | "SLATE" = "LINEN";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const shelf of order) {
    const count = rows.filter((warrant) => warrant.shelf === shelf).length;
    if (count < bestCount) {
      best = shelf;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open warrants.
 * A tie keeps 30, then 15, then 45.
 * An empty desk still suggests 30.
 */
export function suggestSpan(warrants: readonly FolioWarrant[]): 15 | 30 | 45 {
  const rows = readWarrants(warrants).filter((warrant) => inTray(warrant, "open"));
  const order = [30, 15, 45] as const;
  let best: 15 | 30 | 45 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((warrant) => warrant.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open clerk. A blank clerk is skipped. An empty desk stays blank. */
export function suggestClerk(warrants: readonly FolioWarrant[]): string {
  const found = readWarrants(warrants).find((warrant) => inTray(warrant, "open") && warrant.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open warrants.
 * A tie keeps the earlier name. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairClerk(warrants: readonly FolioWarrant[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = clerkLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestClerk(warrants);
  const open = readWarrants(warrants).filter((warrant) => inTray(warrant, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((warrant) => warrant.clerk === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The clerk with the most open warrants. A tie keeps the earlier name. */
export function busiestClerk(warrants: readonly FolioWarrant[]): string {
  const rows = readWarrants(warrants).filter((warrant) => inTray(warrant, "open") && warrant.clerk);
  const names: string[] = [];
  for (const warrant of rows) if (!names.includes(warrant.clerk)) names.push(warrant.clerk);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((warrant) => warrant.clerk === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function warrantClerks(warrants: readonly FolioWarrant[]): string[] {
  const out: string[] = [];
  for (const warrant of readWarrants(warrants)) {
    if (warrant.clerk && !out.includes(warrant.clerk)) out.push(warrant.clerk);
  }
  return out;
}

export function warrantShelves(warrants: readonly FolioWarrant[]): string[] {
  const out: string[] = [];
  for (const warrant of readWarrants(warrants)) {
    if (warrant.shelf && !out.includes(warrant.shelf)) out.push(warrant.shelf);
  }
  return out;
}

/**
 * The next open warrant at or after the desk day.
 * A filed rank, a wait, a hold, and a seal stay off the list.
 * When every open day is behind, the earliest day is next.
 */
export function nextWarrant(warrants: readonly FolioWarrant[], desk: unknown): string {
  const now = dayOf(desk);
  if (now === null) return "";
  const waiting = readWarrants(warrants).filter((warrant) => inTray(warrant, "open") && warrant.day !== null && warrant.rank !== "filed" && warrant.wait === 0);
  if (!waiting.length) return "";
  const byDay = (a: FolioWarrant, b: FolioWarrant) => (a.day ?? 0) - (b.day ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((warrant) => (warrant.day ?? 0) >= now).sort(byDay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byDay)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function warrantCopy(warrant: FolioWarrant, desk: unknown): string {
  const gap = dayGap(warrant.day, desk);
  return [warrant.title, warrant.clerk, warrant.day ?? "", warrant.shelf, warrant.rank, warrant.tone ?? "", warrant.span ?? "", warrant.marks.join(" "), warrant.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the warrants saved in this browser. The gap and the late mark use the day you pass. */
export function warrantsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,day,shelf,rank,tone,span,marks,wait,pinned,held,sealed,gap,late,soon,house,note,audit"];
  for (const warrant of readWarrants(raw)) {
    const gap = dayGap(warrant.day, desk);
    lines.push([
      warrant.title,
      warrant.clerk,
      warrant.day === null ? "" : String(warrant.day),
      warrant.shelf,
      warrant.rank,
      warrant.tone === null ? "" : String(warrant.tone),
      warrant.span === null ? "" : String(warrant.span),
      warrant.marks.join(" "),
      String(warrant.wait),
      warrant.pinned ? "1" : "0",
      warrant.held ? "1" : "0",
      warrant.sealed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateWarrant(warrant, desk) ? "1" : "0",
      soonWarrant(warrant) ? "1" : "0",
      houseShelf(warrant.shelf) ? "1" : "0",
      warrant.note,
      warrant.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeClerk(raw: string, clerks: readonly string[]): string {
  if (raw === "blank") return "blank";
  return clerks.includes(raw) ? raw : "all";
}

export function activeShelf(raw: string, shelves: readonly string[]): string {
  if (raw === "blank") return "blank";
  const shelf = shelfOf(raw);
  return shelf && shelves.includes(shelf) ? shelf : "all";
}

export function activeRank(raw: string, ranks: readonly string[]): string {
  if (raw === "blank") return "blank";
  const rank = rankName(raw);
  return rank && ranks.includes(rank) ? rank : "all";
}

export function activeDay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "press" || raw === "quiet") return raw;
  const day = dayOf(raw);
  return day === null ? "all" : String(day);
}

export function activeTone(raw: string): string {
  if (raw === "blank") return "blank";
  const tone = toneOf(raw);
  return tone === null ? "all" : String(tone);
}

export function activeSpan(raw: string): string {
  if (raw === "blank") return "blank";
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function clerkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function shelfArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return shelfOf(filter) || null;
}

export function rankArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankName(filter) || null;
}

export function dayArg(filter: string): { exact: number | null; pick: DayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "press" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: dayOf(filter), pick: null };
}

export function toneArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return toneOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

function readView(raw: unknown): FlwView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<FlwView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    clerk: row.clerk === "blank" ? "blank" : clip(row.clerk, 16) || "all",
    shelf: row.shelf === "blank" || row.shelf === "all" ? (row.shelf === "blank" ? "blank" : "all") : shelfOf(row.shelf) || "all",
    rank: row.rank === "blank" || row.rank === "all" ? (row.rank === "blank" ? "blank" : "all") : rankName(row.rank) || "all",
    day: activeDay(String(row.day || "all")),
    tone: activeTone(String(row.tone || "all")),
    span: activeSpan(String(row.span || "all")),
  };
}

export function readWarrantViews(raw: unknown): FlwView[] {
  if (!Array.isArray(raw)) return [];
  const out: FlwView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addWarrantView(views: readonly FlwView[], view: FlwView): FlwView[] {
  const current = readWarrantViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropWarrantView(views: readonly FlwView[], id: string): FlwView[] {
  return readWarrantViews(views).filter((view) => view.id !== id);
}

function monoBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function monoText(value: MonoValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: monoBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (MONO_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("email" in value)) return { text: null, explicit: false };
  const inner = value.email;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: monoBody(inner), explicit: true };
}

export function monoState(value: MonoValue): MonoState {
  const found = monoText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function monoCopy(value: MonoValue): string {
  const found = monoText(value);
  if (!found.text) return "";
  return found.text.slice(0, 64);
}

/**
 * A monogram is the first letter of the local part, plus the first letter after a dot, hyphen, or underscore.
 * The domain after @ is ignored. A local part with no letter has no monogram.
 */
export function monogramOf(value: MonoValue): string {
  const text = monoCopy(value);
  if (!text) return "";
  const at = text.indexOf("@");
  const local = (at < 0 ? text : text.slice(0, at)).trim();
  const first = local.match(/[A-Za-z]/);
  if (!first || first.index === undefined) return "";
  let mark = first[0].toUpperCase();
  const sep = local.search(/[.\-_]/);
  if (sep >= 0) {
    const rest = local.slice(sep + 1).match(/[A-Za-z]/);
    if (rest) mark += rest[0].toUpperCase();
  }
  return mark;
}

/** One letter is a seed. Two letters are a pair. No letter has no band. */
export function monoBand(value: MonoValue): MonoBand {
  const mark = monogramOf(value);
  if (mark.length === 1) return "seed";
  if (mark.length === 2) return "pair";
  return "";
}

/** A vowel in the monogram is gilt. Letters without a vowel are ink. */
export function monoTone(value: MonoValue): MonoTone {
  const mark = monogramOf(value);
  if (!mark) return "";
  return /[AEIOU]/.test(mark) ? "gilt" : "ink";
}

/** AE, IO, and UX are the house catalog. Any other monogram is not. */
export function catalogMono(value: MonoValue): boolean {
  return CATALOG.has(monogramOf(value));
}

export function catalogMonoCount(rows: readonly MonoRow[]): number {
  return rows.filter((row) => catalogMono(row.note)).length;
}

export function pairMonoCount(rows: readonly MonoRow[]): number {
  return rows.filter((row) => monoBand(row.note) === "pair").length;
}

export function giltMonoCount(rows: readonly MonoRow[]): number {
  return rows.filter((row) => monoTone(row.note) === "gilt").length;
}

/** Customers whose monogram is shared with at least one other customer. */
export function sharedMonoCount(rows: readonly MonoRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = monogramOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function monoBands(rows: readonly MonoRow[]): MonoBandLine[] {
  return MONO_BANDS.map((band) => ({ band, count: rows.filter((row) => monoBand(row.note) === band).length }));
}

/** The band with the most set notes. A tie keeps seed, then pair. */
export function leadingMono(rows: readonly MonoRow[]): string {
  const lines = monoBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || MONO_BANDS.indexOf(a.band as (typeof MONO_BANDS)[number]) - MONO_BANDS.indexOf(b.band as (typeof MONO_BANDS)[number]))[0].band;
}

/** The tone with the most set notes. A tie keeps gilt. */
export function leadingMonoTone(rows: readonly MonoRow[]): string {
  const gilt = giltMonoCount(rows);
  const ink = rows.filter((row) => monoTone(row.note) === "ink").length;
  if (!gilt && !ink) return "";
  return gilt >= ink ? "gilt" : "ink";
}

export function monoShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentMonos(rows: readonly MonoRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = monoState(row.note);
    const band = state === "set" ? monoBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenMonos(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedMonos(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleMono(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleMonoReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMonoReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMonoBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleMonoCustomers(
  rows: readonly MonoRow[],
  band: MonoBand | "blank" | null,
  tone: MonoTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: MonoShape,
): MonoRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = monoState(row.note);
    const mark = state === "set" ? monoBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && monoTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogMono(row.note)) return false;
    if (shape === "pair" && monoBand(row.note) !== "pair") return false;
    if (shape === "gilt" && monoTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${monoCopy(row.note)} ${monogramOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeMonoBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeMonoTone(raw: string): string {
  return raw === "gilt" || raw === "ink" ? raw : "all";
}

export function monoBandArg(filter: string): MonoBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "seed" || filter === "pair") return filter;
  return null;
}

export function monoToneArg(filter: string): MonoTone | null {
  if (filter === "gilt" || filter === "ink") return filter;
  return null;
}

export function monogramsCsv(rows: readonly MonoRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of monoBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogMonoCount(rows)}`);
  lines.push(`tone,gilt,${giltMonoCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => monoTone(row.note) === "ink").length}`);
  return lines.join("\n");
}

export function monoRowsCsv(rows: readonly MonoRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,monogram,band,tone,catalog,reviewed"];
  for (const row of rows) {
    const state = monoState(row.note);
    const band = state === "set" ? monoBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      monogramOf(row.note),
      band,
      state === "set" ? monoTone(row.note) : "",
      catalogMono(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
