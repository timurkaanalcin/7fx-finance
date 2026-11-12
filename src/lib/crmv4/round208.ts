/**
 * Cloister stalls for the customers desk, and system crests already stored as lastOs on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cloister_stall (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   usher text not null default '',
 *   seat integer,
 *   cloth text not null default '',
 *   tone text not null default '',
 *   cord integer,
 *   stay integer,
 *   tags text not null default '',
 *   gilt integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_system_crest_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_system_crest_review (
 *   customer_id text primary key
 * );
 */

export const CLS_KEY = "crmv4-cloister-stall";
export const CLS_VIEW_KEY = "crmv4-cloister-views";
export const CLS_DENSITY_KEY = "crmv4-cloister-density";
export const SYO_KEY = "crmv4-system-hide";
export const SYO_REVIEW_KEY = "crmv4-system-review";

export type ClothName = "blank" | "linen" | "champagne" | "slate";

export type ToneName = "blank" | "hush" | "warm" | "bright";

export type StallTray = "open" | "held" | "closed";

export type SeatPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type StallDensity = "roomy" | "tight";

export type StallSort = "seat" | "usher";

export type CloisterStall = {
  id: string;
  title: string;
  note: string;
  usher: string;
  seat: number | null;
  cloth: string;
  tone: string;
  cord: number | null;
  stay: number | null;
  tags: string[];
  gilt: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type StallView = {
  id: string;
  name: string;
  tray: StallTray;
  query: string;
  usher: string;
  cloth: string;
  tone: string;
  seat: string;
  cord: string;
  stay: string;
};

export type StallCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  gilt: number;
  house: number;
  window: number;
};

const AUDITS = ["save", "edit", "tone", "pin", "unpin", "hold", "lift", "close", "open", "cloth", "tag", "gilt", "bulk"] as const;

const CLOTHS = ["linen", "champagne", "slate"] as const;

const TONES = ["hush", "warm", "bright"] as const;

const TONE_ORDER = ["", "hush", "warm", "bright"] as const;

const PEAK_SEATS = new Set([2, 5]);

const QUIET_SEATS = new Set([1, 6]);

const HOUSE = new Set(["LINEN", "CHAMPAGNE"]);

const STALL_CAP = 8;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StallTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function toneNameOf(raw: unknown): Exclude<ToneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<ToneName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function stallLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function stallNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank usher stays blank. It is not filled in. */
export function usherLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A cloth is LINEN, CHAMPAGNE, or SLATE. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A seat is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a seat.
 * A second digit is not a seat.
 */
export function seatOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A cord is 4, 7, or 11. A blank value stays unset. A leading zero is not a cord. */
export function cordOf(raw: unknown): 4 | 7 | 11 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 7 || raw === "7") return 7;
  if (raw === 11 || raw === "11") return 11;
  return null;
}

/** A stay is 15, 30, or 60. A blank value stays unset. A leading zero is not a stay. */
export function stayOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** A gilt is 0, 2, or 6. Anything else is not a gilt. 0 clears the gilt. */
export function giltOf(raw: unknown): 0 | 2 | 6 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

export function seatBand(seat: unknown): "blank" | "early" | "mid" | "late" {
  const value = seatOf(seat);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak seats are 2 and 5. An unset seat is not a peak seat. */
export function peakSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && PEAK_SEATS.has(value);
}

/** Quiet seats are 1 and 6. A peak seat is not quiet. An unset seat is not quiet. */
export function quietSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && QUIET_SEATS.has(value);
}

/**
 * How far a seat sits behind the desk seat.
 * A positive gap means the stall seat is behind. A negative gap means it is ahead.
 * A gap of zero means the same seat. An unset seat has no gap. Seats do not wrap.
 */
export function seatGap(seat: unknown, desk: unknown): number | null {
  const from = seatOf(seat);
  const at = seatOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** LINEN and CHAMPAGNE are house cloths. SLATE is a guest cloth. A blank cloth is not a house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): StallDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Seat or usher. Anything else stays on the seat. */
export function sortMode(raw: unknown): StallSort {
  return raw === "usher" ? "usher" : "seat";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[g-l]$/.test(text) ? text : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = tagOf(part);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= TAG_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): CloisterStall | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CloisterStall>;
  const id = clip(row.id, 24);
  const title = stallLine(row.title);
  if (!id || !title) return null;
  const gilt = giltOf(row.gilt);
  return {
    id,
    title,
    note: stallNote(row.note),
    usher: usherLabel(row.usher),
    seat: seatOf(row.seat),
    cloth: clothOf(row.cloth),
    tone: toneNameOf(row.tone),
    cord: cordOf(row.cord),
    stay: stayOf(row.stay),
    tags: tagsOf(row.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readStalls(raw: unknown): CloisterStall[] {
  if (!Array.isArray(raw)) return [];
  const out: CloisterStall[] = [];
  for (const item of raw) {
    const stall = readOne(item);
    if (!stall || out.some((row) => row.id === stall.id || row.title === stall.title)) continue;
    out.push(stall);
  }
  return out.slice(0, STALL_CAP);
}

export function addStall(
  stalls: readonly CloisterStall[],
  stall: {
    id: string;
    title: string;
    note?: string;
    usher?: string;
    seat?: unknown;
    cloth?: string;
    tone?: string;
    cord?: unknown;
    stay?: unknown;
    tags?: unknown;
    gilt?: unknown;
  },
): CloisterStall[] {
  const current = readStalls(stalls);
  const id = String(stall.id || "").trim();
  const title = stallLine(stall.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const gilt = giltOf(stall.gilt);
  const next: CloisterStall = {
    id,
    title,
    note: stallNote(stall.note),
    usher: usherLabel(stall.usher),
    seat: seatOf(stall.seat),
    cloth: clothOf(stall.cloth),
    tone: toneNameOf(stall.tone),
    cord: cordOf(stall.cord),
    stay: stayOf(stall.stay),
    tags: tagsOf(stall.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, STALL_CAP);
}

export function cycleTone(stalls: readonly CloisterStall[], id: string): CloisterStall[] {
  return readStalls(stalls).map((stall) => {
    if (stall.id !== id) return stall;
    const at = TONE_ORDER.indexOf(stall.tone as (typeof TONE_ORDER)[number]);
    const next = at < 0 || at >= TONES.length ? TONES[0] : TONES[at % TONES.length];
    if (!next || next === stall.tone) return stall;
    return { ...stall, tone: next, audit: "tone" };
  });
}

/** A blank title is left as it is. */
export function editStall(stalls: readonly CloisterStall[], id: string, title: unknown): CloisterStall[] {
  const next = stallLine(title);
  if (!next) return readStalls(stalls);
  const current = readStalls(stalls);
  if (current.some((stall) => stall.id !== id && stall.title === next)) return current;
  return current.map((stall) => (stall.id === id && stall.title !== next ? { ...stall, title: next, audit: "edit" } : stall));
}

/** A blank note is left as it is. */
export function editStallNote(stalls: readonly CloisterStall[], id: string, note: unknown): CloisterStall[] {
  const next = stallNote(note);
  if (!next) return readStalls(stalls);
  return readStalls(stalls).map((stall) => (stall.id === id && stall.note !== next ? { ...stall, note: next, audit: "edit" } : stall));
}

/** A tag that is already on the stall, or a third tag, is left out. A tag is one letter from g to l. */
export function addStallTag(stalls: readonly CloisterStall[], id: string, tag: unknown): CloisterStall[] {
  const next = tagOf(tag);
  if (!next) return readStalls(stalls);
  return readStalls(stalls).map((stall) => {
    if (stall.id !== id || stall.tags.includes(next) || stall.tags.length >= TAG_CAP) return stall;
    return { ...stall, tags: [...stall.tags, next], audit: "tag" };
  });
}

/** An unknown gilt is left as it is. 0 clears the gilt. */
export function setStallGilt(stalls: readonly CloisterStall[], id: string, gilt: unknown): CloisterStall[] {
  const next = giltOf(gilt);
  if (next === null) return readStalls(stalls);
  return readStalls(stalls).map((stall) => (stall.id === id && stall.gilt !== next ? { ...stall, gilt: next, audit: "gilt" } : stall));
}

export function setStallPin(stalls: readonly CloisterStall[], id: string, pinned: boolean): CloisterStall[] {
  return readStalls(stalls).map((stall) => (stall.id === id && stall.pinned !== pinned ? { ...stall, pinned, audit: pinned ? "pin" : "unpin" } : stall));
}

/** P toggles the pin on the focused row of the aisle currently shown. */
export function pinFocused(stalls: readonly CloisterStall[], shownIds: readonly string[], index: number): CloisterStall[] {
  if (!shownIds.length) return readStalls(stalls);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readStalls(stalls).find((stall) => stall.id === id);
  if (!row) return readStalls(stalls);
  return setStallPin(stalls, id, !row.pinned);
}

/** G sets a gilt of 2 on the focused stall, or clears a gilt that is already set. */
export function giltFocused(stalls: readonly CloisterStall[], shownIds: readonly string[], index: number): CloisterStall[] {
  if (!shownIds.length) return readStalls(stalls);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readStalls(stalls).find((stall) => stall.id === id);
  if (!row) return readStalls(stalls);
  return setStallGilt(stalls, id, row.gilt ? 0 : 2);
}

export function setStallHold(stalls: readonly CloisterStall[], id: string, held: boolean): CloisterStall[] {
  return readStalls(stalls).map((stall) => (stall.id === id && stall.held !== held ? { ...stall, held, audit: held ? "hold" : "lift" } : stall));
}

export function setStallClose(stalls: readonly CloisterStall[], id: string, closed: boolean): CloisterStall[] {
  return readStalls(stalls).map((stall) => (stall.id === id && stall.closed !== closed ? { ...stall, closed, audit: closed ? "close" : "open" } : stall));
}

export function bulkStallCloth(stalls: readonly CloisterStall[], ids: readonly string[], cloth: unknown): CloisterStall[] {
  const next = clothOf(cloth);
  if (!next) return readStalls(stalls);
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.cloth !== next ? { ...stall, cloth: next, audit: "cloth" } : stall));
}

export function bulkStallPin(stalls: readonly CloisterStall[], ids: readonly string[], pinned: boolean): CloisterStall[] {
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.pinned !== pinned ? { ...stall, pinned, audit: pinned ? "pin" : "unpin" } : stall));
}

export function bulkStallClose(stalls: readonly CloisterStall[], ids: readonly string[], closed: boolean): CloisterStall[] {
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.closed !== closed ? { ...stall, closed, audit: closed ? "close" : "open" } : stall));
}

export function bulkStallTone(stalls: readonly CloisterStall[], ids: readonly string[], tone: unknown): CloisterStall[] {
  const next = toneNameOf(tone);
  if (!next) return readStalls(stalls);
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.tone !== next ? { ...stall, tone: next, audit: "tone" } : stall));
}

export function bulkStallTag(stalls: readonly CloisterStall[], ids: readonly string[], tag: unknown): CloisterStall[] {
  return ids.reduce((rows, id) => addStallTag(rows, id, tag), readStalls(stalls));
}

export function resetStalls(): CloisterStall[] {
  return [];
}

function inTray(stall: CloisterStall, tray: StallTray): boolean {
  if (tray === "closed") return stall.closed;
  if (tray === "held") return stall.held && !stall.closed;
  return !stall.held && !stall.closed;
}

function seatHit(seat: number | null, exact: number | null, pick: SeatPick | null): boolean {
  if (exact !== null) return seat === exact;
  if (pick === null) return true;
  if (pick === "blank") return seat === null;
  if (pick === "peak") return peakSeat(seat);
  if (pick === "quiet") return quietSeat(seat);
  return seatBand(seat) === pick;
}

/** An open stall whose seat sits more than two seats behind the desk seat. A gilt, a hold, or a close is not late. */
export function lateStall(stall: CloisterStall, desk: unknown): boolean {
  const gap = seatGap(stall.seat, desk);
  return inTray(stall, "open") && stall.gilt === 0 && gap !== null && gap > 2;
}

/** An open stall with a stay of 15 is due now. A gilt, a hold, or a close is not. */
export function soonStall(stall: CloisterStall): boolean {
  return inTray(stall, "open") && stall.gilt === 0 && stall.stay === 15;
}

/** Open stalls that are late or due now. A gilt stall stays off the reminder list. */
export function reminderStalls(stalls: readonly CloisterStall[], desk: unknown): CloisterStall[] {
  return readStalls(stalls).filter((stall) => lateStall(stall, desk) || soonStall(stall));
}

/** Open stalls whose seat sits within two seats of the desk seat. A gilt, a hold, or a close stays out. */
export function windowStalls(stalls: readonly CloisterStall[], desk: unknown): CloisterStall[] {
  return readStalls(stalls).filter((stall) => {
    const gap = seatGap(stall.seat, desk);
    return inTray(stall, "open") && stall.gilt === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Search matches the title, the note, the usher, and the tags. */
export function visibleStalls(
  stalls: readonly CloisterStall[],
  tray: StallTray,
  query: string,
  usher: string | null,
  cloth: string | null,
  tone: string | null,
  exact: number | null,
  pick: SeatPick | null,
  cord: number | "blank" | null,
  stay: number | "blank" | null,
  brightOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): CloisterStall[] {
  const text = query.trim().toLowerCase();
  return readStalls(stalls).filter((stall) => {
    if (!inTray(stall, tray)) return false;
    if (text) {
      const hay = `${stall.title} ${stall.note} ${stall.usher} ${stall.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (usher !== null && stall.usher !== usher) return false;
    if (cloth === "blank" ? Boolean(stall.cloth) : cloth && stall.cloth !== cloth) return false;
    if (tone === "blank" ? Boolean(stall.tone) : tone && stall.tone !== tone) return false;
    if (!seatHit(stall.seat, exact, pick)) return false;
    if (cord === "blank" ? stall.cord !== null : cord !== null && stall.cord !== cord) return false;
    if (stay === "blank" ? stall.stay !== null : stay !== null && stall.stay !== stay) return false;
    if (brightOnly && stall.tone !== "bright") return false;
    if (peakOnly && !peakSeat(stall.seat)) return false;
    if (houseOnly && !houseCloth(stall.cloth)) return false;
    if (quietOnly && !quietSeat(stall.seat)) return false;
    if (awakeOnly && stall.gilt !== 0) return false;
    return true;
  });
}

export function sortStalls(stalls: readonly CloisterStall[], mode: StallSort): CloisterStall[] {
  const rows = stalls.slice();
  if (mode === "usher") return rows.sort((a, b) => a.usher.localeCompare(b.usher) || (a.seat ?? 99) - (b.seat ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.seat ?? 99) - (b.seat ?? 99) || a.title.localeCompare(b.title));
}

export function stallTimeline(stalls: readonly CloisterStall[], query: string): CloisterStall[] {
  const text = query.trim().toLowerCase();
  return sortStalls(
    readStalls(stalls).filter((stall) => stall.seat !== null && (!text || stall.title.toLowerCase().includes(text))),
    "seat",
  );
}

export function stallCounts(stalls: readonly CloisterStall[], desk: unknown): StallCounts {
  const rows = readStalls(stalls);
  return {
    open: rows.filter((stall) => inTray(stall, "open")).length,
    held: rows.filter((stall) => inTray(stall, "held")).length,
    closed: rows.filter((stall) => inTray(stall, "closed")).length,
    pinned: rows.filter((stall) => stall.pinned).length,
    peak: rows.filter((stall) => inTray(stall, "open") && stall.gilt === 0 && peakSeat(stall.seat)).length,
    late: rows.filter((stall) => lateStall(stall, desk)).length,
    soon: rows.filter((stall) => soonStall(stall)).length,
    gilt: rows.filter((stall) => inTray(stall, "open") && stall.gilt > 0).length,
    house: rows.filter((stall) => inTray(stall, "open") && houseCloth(stall.cloth)).length,
    window: windowStalls(rows, desk).length,
  };
}

export function stallShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open stalls as a share of every open stall. */
export function lateShare(stalls: readonly CloisterStall[], desk: unknown): number {
  const rows = readStalls(stalls);
  const open = rows.filter((stall) => inTray(stall, "open")).length;
  const late = rows.filter((stall) => lateStall(stall, desk)).length;
  return stallShare(late, open);
}

/** Distinct seats on open stalls. */
export function usedSeats(stalls: readonly CloisterStall[]): number {
  const seats = new Set<number>();
  for (const stall of readStalls(stalls)) {
    if (inTray(stall, "open") && stall.seat !== null) seats.add(stall.seat);
  }
  return seats.size;
}

/** Open stalls that share a seat and a cloth. A different cloth on the same seat is not a clash. */
export function clashSeatCount(stalls: readonly CloisterStall[]): number {
  const groups = new Map<string, number>();
  for (const stall of readStalls(stalls)) {
    if (!inTray(stall, "open") || stall.seat === null || !stall.cloth) continue;
    const key = `${stall.seat}:${stall.cloth}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open stalls that share a cord. An unset cord is not a clash. */
export function cordClashCount(stalls: readonly CloisterStall[]): number {
  const groups = new Map<number, number>();
  for (const stall of readStalls(stalls)) {
    if (!inTray(stall, "open") || stall.cord === null) continue;
    groups.set(stall.cord, (groups.get(stall.cord) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open stalls in the same cloth whose seats differ by two.
 * The count is the stalls that have at least one neighbor.
 */
export function adjacentStallCount(stalls: readonly CloisterStall[]): number {
  const open = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.seat !== null && stall.cloth);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.cloth === right.cloth && Math.abs((left.seat ?? 0) - (right.seat ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The cloth with the fewest open stalls.
 * A tie keeps SLATE, then LINEN, then CHAMPAGNE.
 * An empty desk still suggests SLATE.
 */
export function suggestCloth(stalls: readonly CloisterStall[]): "LINEN" | "CHAMPAGNE" | "SLATE" {
  const rows = readStalls(stalls).filter((stall) => inTray(stall, "open"));
  const order = ["SLATE", "LINEN", "CHAMPAGNE"] as const;
  let best: "LINEN" | "CHAMPAGNE" | "SLATE" = "SLATE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((stall) => stall.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The stay with the fewest open stalls.
 * A tie keeps 30, then 15, then 60.
 * An empty desk still suggests 30.
 */
export function suggestStay(stalls: readonly CloisterStall[]): 15 | 30 | 60 {
  const rows = readStalls(stalls).filter((stall) => inTray(stall, "open"));
  const order = [30, 15, 60] as const;
  let best: 15 | 30 | 60 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const stay of order) {
    const count = rows.filter((stall) => stall.stay === stay).length;
    if (count < bestCount) {
      best = stay;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open usher. A blank usher is skipped. An empty desk stays blank. */
export function suggestUsher(stalls: readonly CloisterStall[]): string {
  const found = readStalls(stalls).find((stall) => inTray(stall, "open") && stall.usher);
  return found ? found.usher : "";
}

/**
 * The usher carrying the fewest open stalls.
 * A tie keeps the earlier name. A blank usher is not a load.
 * An empty roster falls back to the newest usher.
 */
export function fairUsher(stalls: readonly CloisterStall[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = usherLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestUsher(stalls);
  const open = readStalls(stalls).filter((stall) => inTray(stall, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((stall) => stall.usher === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The usher with the most open stalls. A tie keeps the newer name on the desk. */
export function busiestUsher(stalls: readonly CloisterStall[]): string {
  const rows = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.usher);
  const names: string[] = [];
  for (const stall of rows) if (!names.includes(stall.usher)) names.push(stall.usher);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((stall) => stall.usher === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function stallUshers(stalls: readonly CloisterStall[]): string[] {
  const out: string[] = [];
  for (const stall of readStalls(stalls)) {
    if (stall.usher && !out.includes(stall.usher)) out.push(stall.usher);
  }
  return out;
}

export function stallCloths(stalls: readonly CloisterStall[]): string[] {
  const out: string[] = [];
  for (const stall of readStalls(stalls)) {
    if (stall.cloth && !out.includes(stall.cloth)) out.push(stall.cloth);
  }
  return out;
}

/** Open stalls whose usher also keeps another open stall on a different seat. */
export function pairUsherCount(stalls: readonly CloisterStall[]): number {
  const open = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.usher && stall.seat !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].usher === open[j].usher && open[i].seat !== open[j].seat) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The gilt weight of open stalls. A clear gilt adds nothing. */
export function giltLoad(stalls: readonly CloisterStall[]): number {
  return readStalls(stalls).filter((stall) => inTray(stall, "open")).reduce((sum, stall) => sum + stall.gilt, 0);
}

/** Open stalls that are both a quiet seat and a house cloth. */
export function quietHouseCount(stalls: readonly CloisterStall[]): number {
  return readStalls(stalls).filter((stall) => inTray(stall, "open") && quietSeat(stall.seat) && houseCloth(stall.cloth)).length;
}

/** Open stalls whose tone is bright. */
export function brightLoad(stalls: readonly CloisterStall[]): number {
  return readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.tone === "bright").length;
}

/** The span from the lowest open seat to the highest. Fewer than two seats spans nothing. */
export function seatSpan(stalls: readonly CloisterStall[]): number {
  const seats = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.seat !== null).map((stall) => stall.seat as number);
  if (seats.length < 2) return 0;
  return Math.max(...seats) - Math.min(...seats);
}

/**
 * The next open stall at or after the desk seat.
 * A bright tone, a gilt, a hold, and a close stay off the list.
 * When every open seat is behind, the earliest seat is next.
 */
export function nextStall(stalls: readonly CloisterStall[], desk: unknown): string {
  const now = seatOf(desk);
  if (now === null) return "";
  const waiting = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.seat !== null && stall.tone !== "bright" && stall.gilt === 0);
  if (!waiting.length) return "";
  const bySeat = (a: CloisterStall, b: CloisterStall) => (a.seat ?? 0) - (b.seat ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((stall) => (stall.seat ?? 0) >= now).sort(bySeat);
  if (later.length) return later[0].id;
  return waiting.slice().sort(bySeat)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function stallCopy(stall: CloisterStall, desk: unknown): string {
  const gap = seatGap(stall.seat, desk);
  return [stall.title, stall.usher, stall.seat ?? "", stall.cloth, stall.tone, stall.cord ?? "", stall.stay ?? "", stall.tags.join(" "), stall.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the stalls saved in this browser. The gap and the late mark use the seat you pass. */
export function stallsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,usher,seat,cloth,tone,cord,stay,tags,gilt,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readStalls(raw);
  const windowIds = new Set(windowStalls(rows, desk).map((stall) => stall.id));
  for (const stall of rows) {
    const gap = seatGap(stall.seat, desk);
    lines.push([
      stall.title,
      stall.usher,
      stall.seat === null ? "" : String(stall.seat),
      stall.cloth,
      stall.tone,
      stall.cord === null ? "" : String(stall.cord),
      stall.stay === null ? "" : String(stall.stay),
      stall.tags.join(" "),
      String(stall.gilt),
      stall.pinned ? "1" : "0",
      stall.held ? "1" : "0",
      stall.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateStall(stall, desk) ? "1" : "0",
      soonStall(stall) ? "1" : "0",
      houseCloth(stall.cloth) ? "1" : "0",
      windowIds.has(stall.id) ? "1" : "0",
      stall.note,
      stall.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeUsher(raw: string, ushers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return ushers.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, cloths: readonly string[]): string {
  if (raw === "blank") return "blank";
  return clothOf(raw) && cloths.includes(clothOf(raw)) ? clothOf(raw) : "all";
}

export function activeTone(raw: string, tones: readonly string[]): string {
  if (raw === "blank") return "blank";
  const tone = toneNameOf(raw);
  return tone && tones.includes(tone) ? tone : "all";
}

export function activeSeat(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const seat = seatOf(raw);
  return seat === null ? "all" : String(seat);
}

export function activeCord(raw: string): string {
  if (raw === "blank") return "blank";
  const cord = cordOf(raw);
  return cord === null ? "all" : String(cord);
}

export function activeStay(raw: string): string {
  if (raw === "blank") return "blank";
  const stay = stayOf(raw);
  return stay === null ? "all" : String(stay);
}

export function usherArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
}

export function toneArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return toneNameOf(filter) || null;
}

export function seatArg(filter: string): { exact: number | null; pick: SeatPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: seatOf(filter), pick: null };
}

export function cordArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cordOf(filter);
}

export function stayArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stayOf(filter);
}

function readView(raw: unknown): StallView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<StallView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    usher: row.usher === "blank" ? "blank" : clip(row.usher, 16) || "all",
    cloth: row.cloth === "blank" || row.cloth === "all" ? (row.cloth === "blank" ? "blank" : "all") : clothOf(row.cloth) || "all",
    tone: row.tone === "blank" || row.tone === "all" ? (row.tone === "blank" ? "blank" : "all") : toneNameOf(row.tone) || "all",
    seat: activeSeat(String(row.seat || "all")),
    cord: activeCord(String(row.cord || "all")),
    stay: activeStay(String(row.stay || "all")),
  };
}

export function readStallViews(raw: unknown): StallView[] {
  if (!Array.isArray(raw)) return [];
  const out: StallView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addStallView(views: readonly StallView[], view: StallView): StallView[] {
  const current = readStallViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropStallView(views: readonly StallView[], id: string): StallView[] {
  return readStallViews(views).filter((view) => view.id !== id);
}

const CREST_BANDS = ["apple", "window", "linux", "plain"] as const;

const CREST_TONES = ["gilt", "ink", "ivory", "plain"] as const;

const CATALOG = new Set(["macos 14", "windows 11", "ubuntu 22"]);

const CREST_BLOCK = ["lastDevice", "lastIp", "timezone", "username", "phone", "assigneeId", "referralCodeUsed", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name", "email"] as const;

export type CrestState = "" | "set" | "clear";

export type CrestBand = "" | "apple" | "window" | "linux" | "plain";

export type CrestTone = "" | "gilt" | "ink" | "ivory" | "plain";

export type CrestShape = "all" | "catalog" | "wide" | "gilt";

export type CrestValue =
  | { lastOs?: unknown; lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; assigneeId?: unknown; referralCodeUsed?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type CrestRow = { id: string; note?: CrestValue; label?: string | null };

export type CrestBandLine = { band: string; count: number };

function crestBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 48);
}

function crestText(value: CrestValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: crestBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CREST_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("lastOs" in value)) return { text: null, explicit: false };
  const inner = value.lastOs;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: crestBody(inner), explicit: true };
}

export function crestState(value: CrestValue): CrestState {
  const found = crestText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function crestCopy(value: CrestValue): string {
  const found = crestText(value);
  if (!found.text) return "";
  return found.text;
}

function familyWord(text: string): string {
  return text.split(" ").filter(Boolean)[0] || "";
}

/** A crest keeps the first letter of the family and the first digit. A crest with no digit keeps the first letter and the last letter. */
export function crestOf(value: CrestValue): string {
  const text = crestCopy(value);
  if (!text) return "";
  const letters = familyWord(text).match(/[a-z]/gi) || [];
  const first = letters[0] ? letters[0].toUpperCase() : "";
  const digit = (text.match(/\d/) || [""])[0];
  if (first && digit) return first + digit;
  const all = text.match(/[a-z]/gi) || [];
  const left = all[0];
  const right = all[all.length - 1];
  if (!left) return "";
  if (!right || all.length === 1) return left.toUpperCase();
  return left.toUpperCase() + right.toUpperCase();
}

/** macOS, iOS, and iPadOS are apple. Windows is window. Linux, Ubuntu, and Debian are linux. Any other mark is plain. */
export function crestBand(value: CrestValue): CrestBand {
  const mark = crestOf(value);
  if (!mark) return "";
  const text = crestCopy(value);
  if (/mac|ios|ipados/i.test(text)) return "apple";
  if (/windows|\bwin\b/i.test(text)) return "window";
  if (/linux|ubuntu|debian/i.test(text)) return "linux";
  return "plain";
}

/** A family that starts with mac is gilt. A mark that contains 11 and is not gilt is ink. Ubuntu that is neither is ivory. Every other marked crest is plain. */
export function crestTone(value: CrestValue): CrestTone {
  const text = crestCopy(value);
  if (!text || !crestOf(value)) return "";
  const family = familyWord(text);
  if (family.startsWith("mac")) return "gilt";
  if (text.includes("11")) return "ink";
  if (text.includes("ubuntu")) return "ivory";
  return "plain";
}

/** macOS 14, Windows 11, and Ubuntu 22 are the house catalog. Any other crest is not. */
export function catalogCrest(value: CrestValue): boolean {
  return CATALOG.has(crestCopy(value));
}

export function catalogCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => catalogCrest(row.note)).length;
}

export function wideCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestCopy(row.note).length > 10).length;
}

export function giltCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestTone(row.note) === "gilt").length;
}

/** Customers whose family word is shared with at least one other customer. */
export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const family = familyWord(crestCopy(row.note));
    if (!family || !crestOf(row.note)) continue;
    groups.set(family, (groups.get(family) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function crestBands(rows: readonly CrestRow[]): CrestBandLine[] {
  return CREST_BANDS.map((band) => ({ band, count: rows.filter((row) => crestBand(row.note) === band).length }));
}

/** The band with the most set crests. A tie keeps apple, then window, then linux, then plain. */
export function leadingCrest(rows: readonly CrestRow[]): string {
  const lines = crestBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CREST_BANDS.indexOf(a.band as (typeof CREST_BANDS)[number]) - CREST_BANDS.indexOf(b.band as (typeof CREST_BANDS)[number]))[0].band;
}

/** The tone with the most set crests. A tie keeps gilt, then ink, then ivory, then plain. */
export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const counts = CREST_TONES.map((tone) => ({ tone, count: rows.filter((row) => crestTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  return live.slice().sort((a, b) => b.count - a.count || CREST_TONES.indexOf(a.tone) - CREST_TONES.indexOf(b.tone))[0].tone;
}

export function crestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentCrests(rows: readonly CrestRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = crestState(row.note);
    const band = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleCrest(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleCrestReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrestBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleCrestCustomers(
  rows: readonly CrestRow[],
  band: CrestBand | "blank" | null,
  tone: CrestTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = crestState(row.note);
    const mark = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && crestTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogCrest(row.note)) return false;
    if (shape === "wide" && crestCopy(row.note).length <= 10) return false;
    if (shape === "gilt" && crestTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${crestCopy(row.note)} ${crestOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeCrestBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeCrestTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "plain" ? raw : "all";
}

export function crestBandArg(filter: string): CrestBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "apple" || filter === "window" || filter === "linux" || filter === "plain") return filter;
  return null;
}

export function crestToneArg(filter: string): CrestTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "plain") return filter;
  return null;
}

export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of crestBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogCrestCount(rows)}`);
  lines.push(`wide,wide,${wideCrestCount(rows)}`);
  lines.push(`tone,gilt,${giltCrestCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => crestTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => crestTone(row.note) === "ivory").length}`);
  lines.push(`tone,plain,${rows.filter((row) => crestTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedCrestCount(rows)}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,crest,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = crestState(row.note);
    const band = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      crestOf(row.note),
      band,
      state === "set" ? crestTone(row.note) : "",
      catalogCrest(row.note) ? "1" : "0",
      crestCopy(row.note).length > 10 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
