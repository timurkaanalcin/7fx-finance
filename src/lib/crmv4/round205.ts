/**
 * Conservatory slips for the retention desk, and referral ribbons already stored as referralCodeUsed on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_conservatory_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   day integer,
 *   room text not null default '',
 *   breath text not null default '',
 *   wick integer,
 *   pause integer,
 *   tags text not null default '',
 *   hush integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_referral_ribbon_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_referral_ribbon_review (
 *   customer_id text primary key
 * );
 */

export const CNS_KEY = "crmv4-conservatory-slip";
export const CNS_VIEW_KEY = "crmv4-conservatory-views";
export const CNS_DENSITY_KEY = "crmv4-conservatory-density";
export const RFB_KEY = "crmv4-ribbon-hide";
export const RFB_REVIEW_KEY = "crmv4-ribbon-review";

export type SlipRoom = "blank" | "glass" | "fern" | "tile";

export type SlipBreath = "blank" | "still" | "rising" | "fading";

export type SlipTray = "open" | "held" | "closed";

export type DayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SlipDensity = "roomy" | "tight";

export type SlipSort = "day" | "title";

export type ConservatorySlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  day: number | null;
  room: string;
  breath: string;
  wick: number | null;
  pause: number | null;
  tags: string[];
  hush: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  keeper: string;
  room: string;
  breath: string;
  day: string;
  wick: string;
  pause: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  hush: number;
  house: number;
  window: number;
};

export type RibbonState = "" | "set" | "clear";

export type RibbonBand = "" | "brief" | "even" | "long" | "plain";

export type RibbonTone = "" | "gilt" | "ink" | "ivory" | "plain";

export type RibbonShape = "all" | "catalog" | "wide" | "gilt";

export type RibbonValue =
  | { referralCodeUsed?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; email?: unknown; phone?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type RibbonRow = { id: string; note?: RibbonValue; label?: string | null };

export type RibbonBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "breath", "pin", "unpin", "hold", "lift", "close", "open", "room", "tag", "hush"] as const;

const ROOMS = ["glass", "fern", "tile"] as const;

const BREATHS = ["still", "rising", "fading"] as const;

const BREATH_ORDER = ["", "still", "rising", "fading"] as const;

const PEAK_DAYS = new Set([2, 3]);

const QUIET_DAYS = new Set([1, 7]);

const HOUSE = new Set(["GLASS", "FERN"]);

const RIBBON_BANDS = ["brief", "even", "long", "plain"] as const;

const TONES = ["gilt", "ink", "ivory", "plain"] as const;

const CATALOG = new Set(["213950812", "100200300", "900800700"]);

const RIBBON_BLOCK = ["lastIp", "timezone", "username", "email", "phone", "assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name"] as const;

const SLIP_CAP = 7;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function roomName(raw: unknown): Exclude<SlipRoom, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (ROOMS as readonly string[]).includes(text) ? (text as Exclude<SlipRoom, "blank">) : "";
}

function breathName(raw: unknown): Exclude<SlipBreath, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (BREATHS as readonly string[]).includes(text) ? (text as Exclude<SlipBreath, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A room is GLASS, FERN, or TILE. Anything else stays blank. Letters are stored in capitals. */
export function roomOf(raw: unknown): string {
  const name = roomName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A day is an integer from 1 through 7.
 * A blank value stays unset. 0 is not a day.
 * A leading zero is not a day.
 */
export function dayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 7) return null;
    return raw;
  }
  const text = clip(raw, 1);
  if (!/^[1-7]$/.test(text)) return null;
  return Number(text);
}

/** A wick is 2, 4, or 8. A blank value stays unset. A leading zero is not a wick. */
export function wickOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

/** A pause is 15, 30, or 60 minutes. A blank value stays unset. A leading zero is not a pause. */
export function pauseOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** A hush is 0, 5, or 15. Anything else is not a hush. 0 clears the hush. */
export function hushOf(raw: unknown): 0 | 5 | 15 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 5 || raw === "5") return 5;
  if (raw === 15 || raw === "15") return 15;
  return null;
}

export function dayBand(day: unknown): "blank" | "early" | "mid" | "late" {
  const value = dayOf(day);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak days are 2 and 3. An unset day is not a peak day. */
export function peakDay(day: unknown): boolean {
  const value = dayOf(day);
  return value !== null && PEAK_DAYS.has(value);
}

/** Quiet days are 1 and 7. A peak day is not quiet. An unset day is not quiet. */
export function quietDay(day: unknown): boolean {
  const value = dayOf(day);
  return value !== null && QUIET_DAYS.has(value);
}

/**
 * How far a day sits behind the desk day.
 * A positive gap means the slip day is behind. A negative gap means it is ahead.
 * A gap of zero means the same day. An unset day has no gap. Days do not wrap.
 */
export function dayGap(day: unknown, desk: unknown): number | null {
  const from = dayOf(day);
  const at = dayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** GLASS and FERN are house rooms. TILE is a guest room. A blank room is not a house room. */
export function houseRoom(room: unknown): boolean {
  return HOUSE.has(roomOf(room));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): SlipDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Day or title. Anything else stays on the day. */
export function sortMode(raw: unknown): SlipSort {
  return raw === "title" ? "title" : "day";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-f]$/.test(text) ? text : "";
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

function readOne(raw: unknown): ConservatorySlip | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ConservatorySlip>;
  const id = clip(row.id, 24);
  const title = slipLine(row.title);
  if (!id || !title) return null;
  const hush = hushOf(row.hush);
  return {
    id,
    title,
    note: slipNote(row.note),
    keeper: keeperLabel(row.keeper),
    day: dayOf(row.day),
    room: roomOf(row.room),
    breath: breathName(row.breath),
    wick: wickOf(row.wick),
    pause: pauseOf(row.pause),
    tags: tagsOf(row.tags),
    hush: hush === null ? 0 : hush,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readSlips(raw: unknown): ConservatorySlip[] {
  if (!Array.isArray(raw)) return [];
  const out: ConservatorySlip[] = [];
  for (const item of raw) {
    const slip = readOne(item);
    if (!slip || out.some((row) => row.id === slip.id || row.title === slip.title)) continue;
    out.push(slip);
  }
  return out.slice(0, SLIP_CAP);
}

export function addSlip(
  slips: readonly ConservatorySlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    day?: unknown;
    room?: string;
    breath?: string;
    wick?: unknown;
    pause?: unknown;
    tags?: unknown;
    hush?: unknown;
  },
): ConservatorySlip[] {
  const current = readSlips(slips);
  const id = String(slip.id || "").trim();
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const hush = hushOf(slip.hush);
  const next: ConservatorySlip = {
    id,
    title,
    note: slipNote(slip.note),
    keeper: keeperLabel(slip.keeper),
    day: dayOf(slip.day),
    room: roomOf(slip.room),
    breath: breathName(slip.breath),
    wick: wickOf(slip.wick),
    pause: pauseOf(slip.pause),
    tags: tagsOf(slip.tags),
    hush: hush === null ? 0 : hush,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

export function cycleBreath(slips: readonly ConservatorySlip[], id: string): ConservatorySlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const at = BREATH_ORDER.indexOf(slip.breath as (typeof BREATH_ORDER)[number]);
    const next = at < 0 || at >= BREATHS.length ? BREATHS[0] : BREATHS[at % BREATHS.length];
    if (!next || next === slip.breath) return slip;
    return { ...slip, breath: next, audit: "breath" };
  });
}

/** A blank title is left as it is. */
export function editSlip(slips: readonly ConservatorySlip[], id: string, title: unknown): ConservatorySlip[] {
  const next = slipLine(title);
  if (!next) return readSlips(slips);
  const current = readSlips(slips);
  if (current.some((slip) => slip.id !== id && slip.title === next)) return current;
  return current.map((slip) => (slip.id === id && slip.title !== next ? { ...slip, title: next, audit: "edit" } : slip));
}

/** A blank note is left as it is. */
export function editSlipNote(slips: readonly ConservatorySlip[], id: string, note: unknown): ConservatorySlip[] {
  const next = slipNote(note);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.note !== next ? { ...slip, note: next, audit: "edit" } : slip));
}

/** A tag that is already on the slip, or a fourth tag, is left out. A tag is one letter from a to f. */
export function addSlipTag(slips: readonly ConservatorySlip[], id: string, tag: unknown): ConservatorySlip[] {
  const next = tagOf(tag);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => {
    if (slip.id !== id || slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** An unknown hush is left as it is. 0 clears the hush. */
export function setSlipHush(slips: readonly ConservatorySlip[], id: string, hush: unknown): ConservatorySlip[] {
  const next = hushOf(hush);
  if (next === null) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.hush !== next ? { ...slip, hush: next, audit: "hush" } : slip));
}

export function setSlipPin(slips: readonly ConservatorySlip[], id: string, pinned: boolean): ConservatorySlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

/** P toggles the pin on the focused row of the wall currently shown. */
export function pinFocused(slips: readonly ConservatorySlip[], shownIds: readonly string[], index: number): ConservatorySlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSlips(slips).find((slip) => slip.id === id);
  if (!row) return readSlips(slips);
  return setSlipPin(slips, id, !row.pinned);
}

export function setSlipHold(slips: readonly ConservatorySlip[], id: string, held: boolean): ConservatorySlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.held !== held ? { ...slip, held, audit: held ? "hold" : "lift" } : slip));
}

export function setSlipClose(slips: readonly ConservatorySlip[], id: string, closed: boolean): ConservatorySlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.closed !== closed ? { ...slip, closed, audit: closed ? "close" : "open" } : slip));
}

export function bulkSlipRoom(slips: readonly ConservatorySlip[], ids: readonly string[], room: unknown): ConservatorySlip[] {
  const next = roomOf(room);
  if (!next) return readSlips(slips);
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.room !== next ? { ...slip, room: next, audit: "room" } : slip));
}

export function bulkSlipPin(slips: readonly ConservatorySlip[], ids: readonly string[], pinned: boolean): ConservatorySlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

export function bulkSlipClose(slips: readonly ConservatorySlip[], ids: readonly string[], closed: boolean): ConservatorySlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.closed !== closed ? { ...slip, closed, audit: closed ? "close" : "open" } : slip));
}

export function bulkSlipTag(slips: readonly ConservatorySlip[], ids: readonly string[], tag: unknown): ConservatorySlip[] {
  return ids.reduce((rows, id) => addSlipTag(rows, id, tag), readSlips(slips));
}

export function resetSlips(): ConservatorySlip[] {
  return [];
}

function inTray(slip: ConservatorySlip, tray: SlipTray): boolean {
  if (tray === "closed") return slip.closed;
  if (tray === "held") return slip.held && !slip.closed;
  return !slip.held && !slip.closed;
}

function dayHit(day: number | null, exact: number | null, pick: DayPick | null): boolean {
  if (exact !== null) return day === exact;
  if (pick === null) return true;
  if (pick === "blank") return day === null;
  if (pick === "peak") return peakDay(day);
  if (pick === "quiet") return quietDay(day);
  return dayBand(day) === pick;
}

/** An open slip whose day sits more than one day behind the desk day. A hush, a hold, or a close is not late. */
export function lateSlip(slip: ConservatorySlip, desk: unknown): boolean {
  const gap = dayGap(slip.day, desk);
  return inTray(slip, "open") && slip.hush === 0 && gap !== null && gap > 1;
}

/** An open slip with a pause of 15 is due now. A hush, a hold, or a close is not. */
export function soonSlip(slip: ConservatorySlip): boolean {
  return inTray(slip, "open") && slip.hush === 0 && slip.pause === 15;
}

/** Open slips that are late or due now. A hushed slip stays off the reminder list. */
export function reminderSlips(slips: readonly ConservatorySlip[], desk: unknown): ConservatorySlip[] {
  return readSlips(slips).filter((slip) => lateSlip(slip, desk) || soonSlip(slip));
}

/** Open slips whose day sits within one day of the desk day. A hush, a hold, or a close stays out. */
export function windowSlips(slips: readonly ConservatorySlip[], desk: unknown): ConservatorySlip[] {
  return readSlips(slips).filter((slip) => {
    const gap = dayGap(slip.day, desk);
    return inTray(slip, "open") && slip.hush === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Search matches the title, the note, the keeper, and the tags. */
export function visibleSlips(
  slips: readonly ConservatorySlip[],
  tray: SlipTray,
  query: string,
  keeper: string | null,
  room: string | null,
  breath: string | null,
  exact: number | null,
  pick: DayPick | null,
  wick: number | "blank" | null,
  pause: number | "blank" | null,
  risingOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): ConservatorySlip[] {
  const text = query.trim().toLowerCase();
  return readSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text) {
      const hay = `${slip.title} ${slip.note} ${slip.keeper} ${slip.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && slip.keeper !== keeper) return false;
    if (room === "blank" ? Boolean(slip.room) : room && slip.room !== room) return false;
    if (breath === "blank" ? Boolean(slip.breath) : breath && slip.breath !== breath) return false;
    if (!dayHit(slip.day, exact, pick)) return false;
    if (wick === "blank" ? slip.wick !== null : wick !== null && slip.wick !== wick) return false;
    if (pause === "blank" ? slip.pause !== null : pause !== null && slip.pause !== pause) return false;
    if (risingOnly && slip.breath !== "rising") return false;
    if (peakOnly && !peakDay(slip.day)) return false;
    if (houseOnly && !houseRoom(slip.room)) return false;
    if (quietOnly && !quietDay(slip.day)) return false;
    if (awakeOnly && slip.hush !== 0) return false;
    return true;
  });
}

export function sortSlips(slips: readonly ConservatorySlip[], mode: SlipSort): ConservatorySlip[] {
  const rows = slips.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.day ?? 99) - (b.day ?? 99));
  return rows.sort((a, b) => (a.day ?? 99) - (b.day ?? 99) || a.title.localeCompare(b.title));
}

export function slipTimeline(slips: readonly ConservatorySlip[], query: string): ConservatorySlip[] {
  const text = query.trim().toLowerCase();
  return sortSlips(
    readSlips(slips).filter((slip) => slip.day !== null && (!text || slip.title.toLowerCase().includes(text))),
    "day",
  );
}

export function slipCounts(slips: readonly ConservatorySlip[], desk: unknown): SlipCounts {
  const rows = readSlips(slips);
  return {
    open: rows.filter((slip) => inTray(slip, "open")).length,
    held: rows.filter((slip) => inTray(slip, "held")).length,
    closed: rows.filter((slip) => inTray(slip, "closed")).length,
    pinned: rows.filter((slip) => slip.pinned).length,
    peak: rows.filter((slip) => inTray(slip, "open") && slip.hush === 0 && peakDay(slip.day)).length,
    late: rows.filter((slip) => lateSlip(slip, desk)).length,
    soon: rows.filter((slip) => soonSlip(slip)).length,
    hush: rows.filter((slip) => inTray(slip, "open") && slip.hush > 0).length,
    house: rows.filter((slip) => inTray(slip, "open") && houseRoom(slip.room)).length,
    window: windowSlips(rows, desk).length,
  };
}

export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateShare(slips: readonly ConservatorySlip[], desk: unknown): number {
  const rows = readSlips(slips);
  const open = rows.filter((slip) => inTray(slip, "open")).length;
  const late = rows.filter((slip) => lateSlip(slip, desk)).length;
  return slipShare(late, open);
}

/** Distinct days on open slips. */
export function usedDays(slips: readonly ConservatorySlip[]): number {
  const days = new Set<number>();
  for (const slip of readSlips(slips)) {
    if (inTray(slip, "open") && slip.day !== null) days.add(slip.day);
  }
  return days.size;
}

/** Open slips that share a day and a room. A different room on the same day is not a clash. */
export function clashDayCount(slips: readonly ConservatorySlip[]): number {
  const groups = new Map<string, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.day === null || !slip.room) continue;
    const key = `${slip.day}:${slip.room}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open slips that share a wick. An unset wick is not a clash. */
export function wickClashCount(slips: readonly ConservatorySlip[]): number {
  const groups = new Map<number, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.wick === null) continue;
    groups.set(slip.wick, (groups.get(slip.wick) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open slips in the same room whose days differ by one.
 * The count is the slips that have at least one neighbor.
 */
export function adjacentSlipCount(slips: readonly ConservatorySlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.day !== null && slip.room);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.room === right.room && Math.abs((left.day ?? 0) - (right.day ?? 0)) === 1) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The room with the fewest open slips.
 * A tie keeps TILE, then GLASS, then FERN.
 * An empty desk still suggests TILE.
 */
export function suggestRoom(slips: readonly ConservatorySlip[]): "TILE" | "GLASS" | "FERN" {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = ["TILE", "GLASS", "FERN"] as const;
  let best: "TILE" | "GLASS" | "FERN" = "TILE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const room of order) {
    const count = rows.filter((slip) => slip.room === room).length;
    if (count < bestCount) {
      best = room;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The pause with the fewest open slips.
 * A tie keeps 30, then 15, then 60.
 * An empty desk still suggests 30.
 */
export function suggestPause(slips: readonly ConservatorySlip[]): 15 | 30 | 60 {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = [30, 15, 60] as const;
  let best: 15 | 30 | 60 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pause of order) {
    const count = rows.filter((slip) => slip.pause === pause).length;
    if (count < bestCount) {
      best = pause;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open keeper. A blank keeper is skipped. An empty desk stays blank. */
export function suggestKeeper(slips: readonly ConservatorySlip[]): string {
  const found = readSlips(slips).find((slip) => inTray(slip, "open") && slip.keeper);
  return found ? found.keeper : "";
}

/**
 * The keeper carrying the fewest open slips.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty roster falls back to the newest keeper.
 */
export function fairKeeper(slips: readonly ConservatorySlip[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(slips);
  const open = readSlips(slips).filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open slips. A tie keeps the newer name on the desk. */
export function busiestKeeper(slips: readonly ConservatorySlip[]): string {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.keeper);
  const names: string[] = [];
  for (const slip of rows) if (!names.includes(slip.keeper)) names.push(slip.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((slip) => slip.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function slipKeepers(slips: readonly ConservatorySlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.keeper && !out.includes(slip.keeper)) out.push(slip.keeper);
  }
  return out;
}

export function slipRooms(slips: readonly ConservatorySlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.room && !out.includes(slip.room)) out.push(slip.room);
  }
  return out;
}

/**
 * The next open slip at or after the desk day.
 * A fading breath, a hush, a hold, and a close stay off the list.
 * When every open day is behind, the earliest day is next.
 */
export function nextSlip(slips: readonly ConservatorySlip[], desk: unknown): string {
  const now = dayOf(desk);
  if (now === null) return "";
  const waiting = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.day !== null && slip.breath !== "fading" && slip.hush === 0);
  if (!waiting.length) return "";
  const byDay = (a: ConservatorySlip, b: ConservatorySlip) => (a.day ?? 0) - (b.day ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((slip) => (slip.day ?? 0) >= now).sort(byDay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byDay)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function slipCopy(slip: ConservatorySlip, desk: unknown): string {
  const gap = dayGap(slip.day, desk);
  return [slip.title, slip.keeper, slip.day ?? "", slip.room, slip.breath, slip.wick ?? "", slip.pause ?? "", slip.tags.join(" "), slip.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the day you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,day,room,breath,wick,pause,tags,hush,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readSlips(raw);
  const windowIds = new Set(windowSlips(rows, desk).map((slip) => slip.id));
  for (const slip of rows) {
    const gap = dayGap(slip.day, desk);
    lines.push([
      slip.title,
      slip.keeper,
      slip.day === null ? "" : String(slip.day),
      slip.room,
      slip.breath,
      slip.wick === null ? "" : String(slip.wick),
      slip.pause === null ? "" : String(slip.pause),
      slip.tags.join(" "),
      String(slip.hush),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, desk) ? "1" : "0",
      soonSlip(slip) ? "1" : "0",
      houseRoom(slip.room) ? "1" : "0",
      windowIds.has(slip.id) ? "1" : "0",
      slip.note,
      slip.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return keepers.includes(raw) ? raw : "all";
}

export function activeRoom(raw: string, rooms: readonly string[]): string {
  if (raw === "blank") return "blank";
  const room = roomOf(raw);
  return room && rooms.includes(room) ? room : "all";
}

export function activeBreath(raw: string, breaths: readonly string[]): string {
  if (raw === "blank") return "blank";
  const breath = breathName(raw);
  return breath && breaths.includes(breath) ? breath : "all";
}

export function activeDay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const day = dayOf(raw);
  return day === null ? "all" : String(day);
}

export function activeWick(raw: string): string {
  if (raw === "blank") return "blank";
  const wick = wickOf(raw);
  return wick === null ? "all" : String(wick);
}

export function activePause(raw: string): string {
  if (raw === "blank") return "blank";
  const pause = pauseOf(raw);
  return pause === null ? "all" : String(pause);
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function roomArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return roomOf(filter) || null;
}

export function breathArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return breathName(filter) || null;
}

export function dayArg(filter: string): { exact: number | null; pick: DayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: dayOf(filter), pick: null };
}

export function wickArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return wickOf(filter);
}

export function pauseArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pauseOf(filter);
}

function readView(raw: unknown): SlipView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SlipView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    keeper: row.keeper === "blank" ? "blank" : clip(row.keeper, 14) || "all",
    room: row.room === "blank" || row.room === "all" ? (row.room === "blank" ? "blank" : "all") : roomOf(row.room) || "all",
    breath: row.breath === "blank" || row.breath === "all" ? (row.breath === "blank" ? "blank" : "all") : breathName(row.breath) || "all",
    day: activeDay(String(row.day || "all")),
    wick: activeWick(String(row.wick || "all")),
    pause: activePause(String(row.pause || "all")),
  };
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly SlipView[], view: SlipView): SlipView[] {
  const current = readSlipViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

function ribbonBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 12);
}

function ribbonText(value: RibbonValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: ribbonBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (RIBBON_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("referralCodeUsed" in value)) return { text: null, explicit: false };
  const inner = value.referralCodeUsed;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: ribbonBody(inner), explicit: true };
}

export function ribbonState(value: RibbonValue): RibbonState {
  const found = ribbonText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function ribbonCopy(value: RibbonValue): string {
  const found = ribbonText(value);
  if (!found.text) return "";
  return found.text;
}

/** A ribbon keeps the first digit and the last digit of a numeric code. A one-digit code stays one digit. */
export function ribbonOf(value: RibbonValue): string {
  const text = ribbonCopy(value);
  if (!text) return "";
  const marks = text.match(/[0-9]/g);
  if (!marks || !marks.length) return "";
  if (!/^\d+$/.test(text)) {
    const letters = text.match(/[A-Za-z0-9]/g) || [];
    const first = letters[0];
    const last = letters[letters.length - 1];
    if (!first || !last) return "";
    if (letters.length === 1) return first.toUpperCase();
    return first.toUpperCase() + last.toUpperCase();
  }
  if (marks.length === 1) return marks[0];
  return marks[0] + marks[marks.length - 1];
}

/** A code of 1 to 4 digits is brief. Six digits are even. Nine or more are long. Any other mark is plain. */
export function ribbonBand(value: RibbonValue): RibbonBand {
  const text = ribbonCopy(value);
  if (!text || !ribbonOf(value)) return "";
  if (!/^\d+$/.test(text)) return "plain";
  if (text.length <= 4) return "brief";
  if (text.length === 6) return "even";
  if (text.length >= 9) return "long";
  return "plain";
}

/** A code that starts with 2 is gilt. 9 is ink. 1 is ivory. Every other marked code is plain. */
export function ribbonTone(value: RibbonValue): RibbonTone {
  const text = ribbonCopy(value);
  if (!text || !ribbonOf(value)) return "";
  if (text.startsWith("2")) return "gilt";
  if (text.startsWith("9")) return "ink";
  if (text.startsWith("1")) return "ivory";
  return "plain";
}

/** 213950812, 100200300, and 900800700 are the house catalog. Any other code is not. */
export function catalogRibbon(value: RibbonValue): boolean {
  return CATALOG.has(ribbonCopy(value));
}

export function catalogRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => catalogRibbon(row.note)).length;
}

export function wideRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonCopy(row.note).length > 9).length;
}

export function giltRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonTone(row.note) === "gilt").length;
}

/** Customers whose full code is shared with at least one other customer. */
export function sharedRibbonCount(rows: readonly RibbonRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const code = ribbonCopy(row.note);
    if (!code) continue;
    groups.set(code, (groups.get(code) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function ribbonBands(rows: readonly RibbonRow[]): RibbonBandLine[] {
  return RIBBON_BANDS.map((band) => ({ band, count: rows.filter((row) => ribbonBand(row.note) === band).length }));
}

/** The band with the most set ribbons. A tie keeps brief, then even, then long, then plain. */
export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const lines = ribbonBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RIBBON_BANDS.indexOf(a.band as (typeof RIBBON_BANDS)[number]) - RIBBON_BANDS.indexOf(b.band as (typeof RIBBON_BANDS)[number]))[0].band;
}

/** The tone with the most set ribbons. A tie keeps gilt, then ink, then ivory, then plain. */
export function leadingRibbonTone(rows: readonly RibbonRow[]): string {
  const counts = TONES.map((tone) => ({ tone, count: rows.filter((row) => ribbonTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  return live.slice().sort((a, b) => b.count - a.count || TONES.indexOf(a.tone) - TONES.indexOf(b.tone))[0].tone;
}

export function ribbonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentRibbons(rows: readonly RibbonRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = ribbonState(row.note);
    const band = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenRibbons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedRibbons(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleRibbon(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleRibbonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRibbonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRibbonBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleRibbonCustomers(
  rows: readonly RibbonRow[],
  band: RibbonBand | "blank" | null,
  tone: RibbonTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: RibbonShape,
): RibbonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = ribbonState(row.note);
    const mark = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && ribbonTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogRibbon(row.note)) return false;
    if (shape === "wide" && ribbonCopy(row.note).length <= 9) return false;
    if (shape === "gilt" && ribbonTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${ribbonCopy(row.note)} ${ribbonOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeRibbonBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeRibbonTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "plain" ? raw : "all";
}

export function ribbonBandArg(filter: string): RibbonBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "brief" || filter === "even" || filter === "long" || filter === "plain") return filter;
  return null;
}

export function ribbonToneArg(filter: string): RibbonTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "plain") return filter;
  return null;
}

export function ribbonsCsv(rows: readonly RibbonRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of ribbonBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogRibbonCount(rows)}`);
  lines.push(`wide,wide,${wideRibbonCount(rows)}`);
  lines.push(`tone,gilt,${giltRibbonCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => ribbonTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => ribbonTone(row.note) === "ivory").length}`);
  lines.push(`tone,plain,${rows.filter((row) => ribbonTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedRibbonCount(rows)}`);
  return lines.join("\n");
}

export function ribbonRowsCsv(rows: readonly RibbonRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,code,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = ribbonState(row.note);
    const band = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      ribbonOf(row.note),
      band,
      state === "set" ? ribbonTone(row.note) : "",
      catalogRibbon(row.note) ? "1" : "0",
      ribbonCopy(row.note).length > 9 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
