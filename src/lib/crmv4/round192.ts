/**
 * Quiet holds for the retention desk, and the phone already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_quiet_hold (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   hour integer,
 *   ribbon text not null default '',
 *   bay text not null default '',
 *   posture text not null default '',
 *   weight integer,
 *   span integer,
 *   tags text not null default '',
 *   snooze integer not null default 0,
 *   pinned boolean not null default false,
 *   parked boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_dial_lane_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_dial_lane_review (
 *   customer_id text primary key
 * );
 */

export const HOLD_KEY = "crmv4-quiet-holds";
export const HOLD_VIEW_KEY = "crmv4-quiet-hold-views";
export const HOLD_DENSITY_KEY = "crmv4-quiet-hold-density";
export const DIAL_KEY = "crmv4-dial-lane-hide";
export const DIAL_REVIEW_KEY = "crmv4-dial-lane-review";

export type HoldRibbon = "blank" | "silk" | "wool" | "velvet" | "satin";

export type HoldPosture = "blank" | "queue" | "watch" | "release";

export type HoldTray = "open" | "parked" | "closed";

export type HourPick = "blank" | "dawn" | "day" | "night" | "peak" | "quiet";

export type HoldDensity = "roomy" | "tight";

export type HoldSort = "hour" | "title";

export type Hold = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  hour: number | null;
  ribbon: string;
  bay: string;
  posture: string;
  weight: number | null;
  window: number | null;
  tags: string[];
  snooze: number;
  pinned: boolean;
  parked: boolean;
  closed: boolean;
  audit: string;
};

export type HoldView = {
  id: string;
  name: string;
  tray: HoldTray;
  query: string;
  keeper: string;
  ribbon: string;
  bay: string;
  posture: string;
  hour: string;
  weight: string;
  window: string;
};

export type HoldCounts = {
  open: number;
  parked: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  snoozed: number;
  house: number;
};

export type DialState = "" | "set" | "clear";

export type DialBand = "" | "slip" | "card" | "folio";

export type DialTone = "" | "open" | "shut";

export type DialShape = "all" | "catalog" | "wide" | "open";

export type DialValue =
  | { phone?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type DialRow = { id?: string; note?: DialValue; label?: string | null };

export type DialBandLine = { band: string; count: number };

export type DialToneLine = { tone: string; count: number };

const AUDITS = ["save", "edit", "posture", "pin", "unpin", "park", "lift", "close", "reopen", "ribbon", "tag", "snooze"] as const;

const RIBBONS = ["silk", "wool", "velvet", "satin"] as const;

const POSTURES = ["queue", "watch", "release"] as const;

const POSTURE_ORDER = ["", "queue", "watch", "release"] as const;

const HOUR_PICKS = ["blank", "dawn", "day", "night", "peak", "quiet"] as const;

const PEAK_HOURS = new Set([9, 17]);

const QUIET_HOURS = new Set([1, 4]);

const DAWN_HOURS = new Set([5, 6, 7]);

const NIGHT_HOURS = new Set([0, 22, 23]);

const WEIGHT_SET = [1, 3, 5] as const;

const WINDOW_SET = [1, 3, 7] as const;

const HOUSE = new Set(["AMS", "DXB", "IST"]);

const DIAL_BANDS = ["slip", "card", "folio"] as const;

const TONES = ["open", "shut"] as const;

const CATALOG = new Set(["31205501", "4420700090", "905550001122"]);

const DIAL_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const HOLD_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HoldTray {
  return raw === "parked" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function ribbonName(raw: unknown): Exclude<HoldRibbon, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (RIBBONS as readonly string[]).includes(text) ? (text as Exclude<HoldRibbon, "blank">) : "";
}

function postureName(raw: unknown): Exclude<HoldPosture, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (POSTURES as readonly string[]).includes(text) ? (text as Exclude<HoldPosture, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function holdLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function holdNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A bay is three letters. Anything else stays blank. Letters are stored in capitals. */
export function bayOf(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

/**
 * An hour is an integer from 0 through 23.
 * A blank value stays unset. 24 is not an hour.
 * A leading zero is not an hour. The first hour is 0.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]|1[0-9]|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A weight is 1, 3, or 5. A blank value stays unset. 0 and 2 are not weights. A leading zero is not a weight. */
export function weightOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WEIGHT_SET as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|5)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A window is 1, 3, or 7 days. A blank value stays unset. 0 and 2 are not windows. A leading zero is not a window. */
export function windowDays(raw: unknown): number | null {
  if (typeof raw === "number" && (WINDOW_SET as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|7)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A tag is two to eight letters. Anything else is left out. */
export function tagOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return /^[a-z]{2,8}$/.test(text) ? text : "";
}

function tagList(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  const out: string[] = [];
  for (const part of parts) {
    const tag = tagOf(part);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= TAG_CAP) break;
  }
  return out;
}

/** A snooze is 0, 2, or 6 hours. Anything else stays unset. */
export function snoozeOf(raw: unknown): 0 | 2 | 6 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

/** Night is 0, 22, and 23. Dawn is 5, 6, and 7. Every other hour is day. */
export function hourBand(hour: unknown): "blank" | "night" | "dawn" | "day" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (NIGHT_HOURS.has(value)) return "night";
  if (DAWN_HOURS.has(value)) return "dawn";
  return "day";
}

/** Peak hours are 9 and 17. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 1 and 4. 9 and 17 are not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 24. A step of 12 stays. A step of -12 stays.
 * A positive step means the typed hour is ahead of the hold.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

/** AMS, DXB, and IST are house bays. A blank bay is not. */
export function houseBay(bay: unknown): boolean {
  return HOUSE.has(bayOf(bay));
}

/** Room or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): HoldDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): HoldSort {
  return raw === "title" ? "title" : "hour";
}

export function readHolds(raw: unknown): Hold[] {
  if (!Array.isArray(raw)) return [];
  const out: Hold[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Hold>;
    const id = String(row.id || "").trim();
    const title = holdLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: holdNote(row.note),
      keeper: keeperLabel(row.keeper),
      hour: hourOf(row.hour),
      ribbon: ribbonName(row.ribbon),
      bay: bayOf(row.bay),
      posture: postureName(row.posture),
      weight: weightOf(row.weight),
      window: windowDays(row.window),
      tags: tagList(row.tags),
      snooze: snoozeOf(row.snooze) ?? 0,
      pinned: row.pinned === true,
      parked: row.parked === true,
      closed: row.closed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, HOLD_CAP);
}

export function addHold(
  cards: readonly Hold[],
  card: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    hour?: unknown;
    ribbon?: string;
    bay?: string;
    posture?: string;
    weight?: unknown;
    window?: unknown;
    tags?: unknown;
    snooze?: unknown;
  },
): Hold[] {
  const current = readHolds(cards);
  const id = String(card.id || "").trim();
  const title = holdLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Hold = {
    id,
    title,
    note: holdNote(card.note),
    keeper: keeperLabel(card.keeper),
    hour: hourOf(card.hour),
    ribbon: ribbonName(card.ribbon),
    bay: bayOf(card.bay),
    posture: postureName(card.posture),
    weight: weightOf(card.weight),
    window: windowDays(card.window),
    tags: tagList(card.tags),
    snooze: snoozeOf(card.snooze) ?? 0,
    pinned: false,
    parked: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, HOLD_CAP);
}

/** Blank becomes queue. Queue becomes watch, watch becomes release, and release returns to queue. */
export function cyclePosture(cards: readonly Hold[], id: string): Hold[] {
  return readHolds(cards).map((card) => {
    if (card.id !== id) return card;
    const at = POSTURE_ORDER.indexOf(card.posture as (typeof POSTURE_ORDER)[number]);
    const next = at < 0 || at >= POSTURES.length ? POSTURES[0] : POSTURES[at % POSTURES.length];
    if (!next || next === card.posture) return card;
    return { ...card, posture: next, audit: "posture" };
  });
}

export function setHoldPin(cards: readonly Hold[], id: string, pinned: boolean): Hold[] {
  return readHolds(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setHoldPark(cards: readonly Hold[], id: string, parked: boolean): Hold[] {
  return readHolds(cards).map((card) => (card.id === id ? { ...card, parked, audit: parked ? "park" : "lift" } : card));
}

export function setHoldClose(cards: readonly Hold[], id: string, closed: boolean): Hold[] {
  return readHolds(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editHold(cards: readonly Hold[], id: string, title: string): Hold[] {
  const current = readHolds(cards);
  const next = holdLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editHoldNote(cards: readonly Hold[], id: string, note: string): Hold[] {
  const current = readHolds(cards);
  const next = holdNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

/** A tag that is already on the hold, or a fourth tag, is left out. */
export function addHoldTag(cards: readonly Hold[], id: string, tag: unknown): Hold[] {
  const next = tagOf(tag);
  if (!next) return readHolds(cards);
  return readHolds(cards).map((card) => {
    if (card.id !== id || card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

export function dropHoldTag(cards: readonly Hold[], id: string, tag: unknown): Hold[] {
  const next = tagOf(tag);
  if (!next) return readHolds(cards);
  return readHolds(cards).map((card) => {
    if (card.id !== id || !card.tags.includes(next)) return card;
    return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
  });
}

/** An unknown snooze is left as it is. 0 clears the snooze. */
export function setHoldSnooze(cards: readonly Hold[], id: string, snooze: unknown): Hold[] {
  const next = snoozeOf(snooze);
  if (next === null) return readHolds(cards);
  return readHolds(cards).map((card) => (card.id === id && card.snooze !== next ? { ...card, snooze: next, audit: "snooze" } : card));
}

export function bulkHoldPin(cards: readonly Hold[], ids: readonly string[], pinned: boolean): Hold[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHolds(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkHoldRibbon(cards: readonly Hold[], ids: readonly string[], ribbon: unknown): Hold[] {
  const next = ribbonName(ribbon);
  if (!next) return readHolds(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHolds(cards).map((card) => (want.has(card.id) ? { ...card, ribbon: next, audit: "ribbon" } : card));
}

export function bulkHoldClose(cards: readonly Hold[], ids: readonly string[], closed: boolean): Hold[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHolds(cards).map((card) => (want.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

export function bulkHoldTag(cards: readonly Hold[], ids: readonly string[], tag: unknown): Hold[] {
  const next = tagOf(tag);
  if (!next) return readHolds(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHolds(cards).map((card) => {
    if (!want.has(card.id) || card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

export function resetHolds(): Hold[] {
  return [];
}

function inTray(card: Hold, tray: HoldTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "parked") return card.parked && !card.closed;
  return !card.parked && !card.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open hold whose hour sits more than four steps behind the desk hour. A snooze, a park, or a close is not late. */
export function lateHold(card: Hold, desk: unknown): boolean {
  const gap = hourGap(card.hour, desk);
  return inTray(card, "open") && card.snooze === 0 && gap !== null && gap > 4;
}

/** An open hold with a one-day window is the reminder. A snooze, a park, or a close is not. */
export function soonHold(card: Hold): boolean {
  return inTray(card, "open") && card.snooze === 0 && card.window === 1;
}

/** Open holds that are late or soon. A snoozed hold stays off the reminder list. */
export function reminderHolds(cards: readonly Hold[], desk: unknown): Hold[] {
  return readHolds(cards).filter((card) => lateHold(card, desk) || soonHold(card));
}

/** Search matches the title, the note, the keeper, and the tags. The hour and the ribbon are not part of the query. */
export function visibleHolds(
  cards: readonly Hold[],
  tray: HoldTray,
  query: string,
  keeper: string | null,
  ribbon: HoldRibbon | null,
  bay: string | null,
  posture: HoldPosture | null,
  exact: number | null,
  pick: HourPick | null,
  weight: number | "blank" | null,
  window: number | "blank" | null,
  queueOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): Hold[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  return readHolds(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (wantKeeper !== null && card.keeper !== wantKeeper) return false;
    if (ribbon === "blank" && card.ribbon) return false;
    if (ribbon && ribbon !== "blank" && card.ribbon !== ribbon) return false;
    if (bay !== null && card.bay !== bay) return false;
    if (posture === "blank" && card.posture) return false;
    if (posture && posture !== "blank" && card.posture !== posture) return false;
    if (!hourHit(card.hour, exact, pick)) return false;
    if (weight === "blank" && card.weight !== null) return false;
    if (typeof weight === "number" && card.weight !== weight) return false;
    if (window === "blank" && card.window !== null) return false;
    if (typeof window === "number" && card.window !== window) return false;
    if (queueOnly && card.posture !== "queue") return false;
    if (peakOnly && !peakHour(card.hour)) return false;
    if (houseOnly && !houseBay(card.bay)) return false;
    if (quietOnly && !quietHour(card.hour)) return false;
    if (awakeOnly && card.snooze !== 0) return false;
    if (!text) return true;
    const tags = card.tags.join(" ");
    return `${card.title} ${card.note} ${card.keeper} ${tags}`.toLowerCase().includes(text);
  });
}

export function holdCounts(cards: readonly Hold[], desk: unknown): HoldCounts {
  const rows = readHolds(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    parked: rows.filter((card) => inTray(card, "parked")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakHour(card.hour) && inTray(card, "open")).length,
    late: rows.filter((card) => lateHold(card, desk)).length,
    soon: rows.filter((card) => soonHold(card)).length,
    snoozed: rows.filter((card) => inTray(card, "open") && card.snooze !== 0).length,
    house: rows.filter((card) => houseBay(card.bay)).length,
  };
}

export function holdShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function holdKeepers(cards: readonly Hold[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const card of readHolds(cards)) {
    if (!card.keeper || seen.has(card.keeper)) continue;
    seen.add(card.keeper);
    out.push(card.keeper);
  }
  return out;
}

export function holdBays(cards: readonly Hold[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const card of readHolds(cards)) {
    if (!card.bay || seen.has(card.bay)) continue;
    seen.add(card.bay);
    out.push(card.bay);
  }
  return out;
}

export function ribbonCounts(cards: readonly Hold[]): { ribbon: Exclude<HoldRibbon, "blank">; count: number }[] {
  const rows = readHolds(cards);
  return RIBBONS.map((ribbon) => ({ ribbon, count: rows.filter((card) => card.ribbon === ribbon).length })).filter((row) => row.count > 0);
}

export function usedHours(cards: readonly Hold[]): number {
  return new Set(readHolds(cards).map((card) => card.hour).filter((hour): hour is number => hour !== null)).size;
}

export function clashHourIds(cards: readonly Hold[]): string[] {
  const open = readHolds(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.ribbon);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ribbon === card.ribbon && other.hour === card.hour)).map((card) => card.id);
}

export function clashHourCount(cards: readonly Hold[]): number {
  return clashHourIds(cards).length;
}

export function weightClashIds(cards: readonly Hold[]): string[] {
  const open = readHolds(cards).filter((card) => inTray(card, "open") && card.weight !== null && card.ribbon);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ribbon === card.ribbon && other.weight === card.weight)).map((card) => card.id);
}

export function weightClashCount(cards: readonly Hold[]): number {
  return weightClashIds(cards).length;
}

/** The next awake open hold at or after the desk hour. A release posture and a snooze wait. A blank desk hour stays blank. */
export function nextHold(cards: readonly Hold[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readHolds(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.posture !== "release" && card.snooze === 0);
  if (!waiting.length) return "";
  const byHour = (a: Hold, b: Hold) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The ribbon with the fewest open holds.
 * A tie keeps satin, then silk, then wool, then velvet.
 * Holds with no ribbon are not a load. An empty desk still suggests satin.
 */
export function suggestRibbon(cards: readonly Hold[]): Exclude<HoldRibbon, "blank"> {
  const rows = readHolds(cards).filter((card) => inTray(card, "open"));
  const order = ["satin", "silk", "wool", "velvet"] as const;
  let best: Exclude<HoldRibbon, "blank"> = "satin";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ribbon of order) {
    const count = rows.filter((card) => card.ribbon === ribbon).length;
    if (count < bestCount) {
      best = ribbon;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The keeper carrying the fewest open holds.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty desk stays blank.
 */
export function suggestKeeper(cards: readonly Hold[]): string {
  const rows = readHolds(cards).filter((card) => inTray(card, "open") && card.keeper);
  if (!rows.length) return "";
  const names = holdKeepers(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((card) => card.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The window with the fewest open holds.
 * A tie keeps 3, then 1, then 7.
 * Holds with no window are not a load. An empty desk still suggests 3.
 */
export function suggestWindow(cards: readonly Hold[]): (typeof WINDOW_SET)[number] {
  const rows = readHolds(cards).filter((card) => inTray(card, "open"));
  const order = [3, 1, 7] as const;
  let best: (typeof WINDOW_SET)[number] = 3;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const window of order) {
    const count = rows.filter((card) => card.window === window).length;
    if (count < bestCount) {
      best = window;
      bestCount = count;
    }
  }
  return best;
}

/** The least loaded name on the typed roster. A tie keeps the earlier name. A blank roster uses the suggested keeper. */
export function fairKeeper(cards: readonly Hold[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(cards);
  const open = readHolds(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper carrying the most open holds. A tie keeps the earlier name. A blank keeper is not a load. */
export function busiestKeeper(cards: readonly Hold[]): string {
  const rows = readHolds(cards).filter((card) => inTray(card, "open") && card.keeper);
  if (!rows.length) return "";
  const names = holdKeepers(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = -1;
  for (const name of names) {
    const count = rows.filter((card) => card.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** Null hours sit last. A title sort ignores the hour. */
export function sortHolds(cards: readonly Hold[], mode: unknown): Hold[] {
  const rows = readHolds(cards);
  if (sortMode(mode) === "title") return rows.slice().sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return rows.slice().sort((a, b) => {
    if (a.hour === null && b.hour === null) return a.title.localeCompare(b.title);
    if (a.hour === null) return 1;
    if (b.hour === null) return -1;
    return a.hour - b.hour || a.title.localeCompare(b.title);
  });
}

/** J moves forward. K moves back. A zero step stays. The ends wrap. An empty list stays at zero. */
export function moveFocus(index: number, length: number, dir: number): number {
  if (length <= 0) return 0;
  const step = dir < 0 ? -1 : dir > 0 ? 1 : 0;
  const start = Number.isInteger(index) ? index : 0;
  return (start + step + length * 8) % length;
}

export function holdTimeline(cards: readonly Hold[], query: string): Hold[] {
  const text = query.trim().toLowerCase();
  return sortHolds(readHolds(cards).filter((card) => card.hour !== null && (!text || card.title.toLowerCase().includes(text))), "hour");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the holds saved in this browser. The gap and the late mark use the hour you pass. */
export function holdsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,hour,ribbon,bay,posture,weight,window,tags,snooze,pinned,parked,closed,gap,late,soon,house,note,audit"];
  for (const card of readHolds(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.hour === null ? "" : String(card.hour),
      card.ribbon,
      csvCell(card.bay),
      card.posture,
      card.weight === null ? "" : String(card.weight),
      card.window === null ? "" : String(card.window),
      csvCell(card.tags.join(" ")),
      String(card.snooze),
      card.pinned ? "1" : "0",
      card.parked ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateHold(card, desk) ? "1" : "0",
      soonHold(card) ? "1" : "0",
      houseBay(card.bay) ? "1" : "0",
      csvCell(card.note),
      card.audit,
    ].join(","));
  }
  return lines.join("\n");
}

export function holdCopy(card: Hold): string {
  return [card.title, card.keeper, card.hour ?? "", card.ribbon, card.bay, card.posture, card.tags.join(" "), card.note].filter((part) => part !== "").join(" · ");
}

function keeperSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keeperLabel(raw) || "all";
}

function ribbonSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribbonName(raw) || "all";
}

function baySlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bayOf(raw) || "all";
}

function postureSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return postureName(raw) || "all";
}

/** "all" and an hour pick stay. An hour from 0 through 23 stays. Anything else is all. */
export function activeHour(filter: string): string {
  if (filter === "all") return "all";
  if ((HOUR_PICKS as readonly string[]).includes(filter)) return filter;
  const hour = hourOf(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if ((HOUR_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as HourPick };
  const hour = hourOf(filter);
  return hour === null ? { exact: null, pick: null } : { exact: hour, pick: null };
}

/** All, blank, and the weights 1, 3, and 5 stay. Anything else is all. */
export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightOf(filter);
  return weight === null ? "all" : String(weight);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

/** All, blank, and the windows 1, 3, and 7 stay. Anything else is all. */
export function activeWindow(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const window = windowDays(filter);
  return window === null ? "all" : String(window);
}

export function windowArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return windowDays(filter);
}

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

export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = ribbonName(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): HoldRibbon | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return ribbonName(filter) || null;
}

export function activeBay(filter: string, bays: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bay = bayOf(filter);
  return bay && bays.includes(bay) ? bay : "all";
}

export function bayArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return bayOf(filter) || null;
}

export function activePosture(filter: string, postures: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const posture = postureName(filter);
  return posture && postures.includes(posture) ? posture : "all";
}

export function postureArg(filter: string): HoldPosture | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return postureName(filter) || null;
}

export function readHoldViews(raw: unknown): HoldView[] {
  if (!Array.isArray(raw)) return [];
  const out: HoldView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HoldView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      keeper: keeperSlot(row.keeper),
      ribbon: ribbonSlot(row.ribbon),
      bay: baySlot(row.bay),
      posture: postureSlot(row.posture),
      hour: activeHour(String(row.hour || "all")),
      weight: activeWeight(String(row.weight || "all")),
      window: activeWindow(String(row.window || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addHoldView(views: readonly HoldView[], view: HoldView): HoldView[] {
  const current = readHoldViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    keeper: keeperSlot(view.keeper),
    ribbon: ribbonSlot(view.ribbon),
    bay: baySlot(view.bay),
    posture: postureSlot(view.posture),
    hour: activeHour(view.hour),
    weight: activeWeight(view.weight),
    window: activeWindow(view.window),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropHoldView(views: readonly HoldView[], id: string): HoldView[] {
  return readHoldViews(views).filter((view) => view.id !== id);
}

/**
 * A dial lane is a phone already stored on the account.
 * Lengths that stay are 8, 10, and 12. A blank value stays unset.
 * Spaces, dashes, and one leading plus sign are ignored.
 */
export function dialToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/[\s().-]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(text)) return null;
  const size = text.length;
  if (size !== 8 && size !== 10 && size !== 12) return null;
  return text;
}

function dialBody(value: DialValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = dialToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (DIAL_BLOCK.some((key) => key in value)) return null;
  if (!("phone" in value)) return { text: null, explicit: false };
  const inner = value.phone;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = dialToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set lane is a phone of length 8, 10, or 12.
 * A clear lane is an explicit blank. A missing field stays unmarked.
 */
export function dialState(value: DialValue): DialState {
  const body = dialBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The phone digits, or a blank string when the lane is clear or unmarked. */
export function dialCopy(value: DialValue): string {
  return dialBody(value)?.text || "";
}

/**
 * Slip is 8. Card is 10. Folio is 12.
 * A blank phone has no band.
 */
export function dialBand(value: DialValue): DialBand {
  const text = dialBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n === 8) return "slip";
  if (n === 10) return "card";
  return "folio";
}

/** Open when a zero is present. Shut when it is not. A blank phone has no tone. */
export function dialTone(value: DialValue): DialTone {
  const text = dialBody(value)?.text;
  if (!text) return "";
  return text.includes("0") ? "open" : "shut";
}

/** 31205501, 4420700090, and 905550001122 are the house catalog. */
export function catalogDial(value: DialValue): boolean {
  const text = dialBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A phone of 10 or 12 digits. A clear phone is not wide. */
export function wideDial(value: DialValue): boolean {
  const text = dialBody(value)?.text;
  if (!text) return false;
  return text.length >= 10;
}

export function openDial(value: DialValue): boolean {
  return dialTone(value) === "open";
}

export function catalogDialCount(rows: readonly DialRow[]): number {
  return rows.filter((row) => dialState(row.note) === "set" && catalogDial(row.note)).length;
}

export function wideDialCount(rows: readonly DialRow[]): number {
  return rows.filter((row) => dialState(row.note) === "set" && wideDial(row.note)).length;
}

export function openDialCount(rows: readonly DialRow[]): number {
  return rows.filter((row) => dialState(row.note) === "set" && openDial(row.note)).length;
}

/** How many distinct phones are carried by two or more loaded rows. */
export function sharedDialCount(rows: readonly DialRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (dialState(row.note) !== "set") continue;
    const text = dialCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function dialBands(rows: readonly DialRow[]): DialBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = dialState(row.note);
    if (state === "") continue;
    const band = state === "set" ? dialBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: DialBandLine[] = [];
  for (const band of ["", ...DIAL_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function dialTones(rows: readonly DialRow[]): DialToneLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = dialState(row.note);
    if (state !== "set") continue;
    const tone = dialTone(row.note);
    map.set(tone, (map.get(tone) || 0) + 1);
  }
  const out: DialToneLine[] = [];
  for (const tone of TONES) {
    const count = map.get(tone);
    if (count) out.push({ tone, count });
  }
  return out;
}

/** The band with the most set phones. A tie keeps slip, then card, then folio. A clear phone is not a lead. */
export function leadingDial(rows: readonly DialRow[]): string {
  const named = dialBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => DIAL_BANDS.indexOf(band as (typeof DIAL_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The tone with the most set phones. A tie keeps open, then shut. */
export function leadingDialTone(rows: readonly DialRow[]): string {
  const named = dialTones(rows);
  if (!named.length) return "";
  const order = (tone: string) => TONES.indexOf(tone as (typeof TONES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.tone) - order(b.tone))[0].tone;
}

export function dialShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((DIAL_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentDials(rows: readonly DialRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = dialState(row.note);
    const token = state === "set" ? dialBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenDials(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandOwner(item);
    if (!band || !allow.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleDial(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenDials(hidden, present);
  const current = readHiddenDials(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleDialBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function activeDialBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const band = bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

export function dialBandArg(filter: string): DialBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as DialBand) : null;
}

function toneOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? text : "";
}

export function activeDialTone(filter: string): string {
  if (filter === "all") return "all";
  return toneOwner(filter) || "all";
}

export function dialToneArg(filter: string): DialTone | null {
  const tone = toneOwner(filter);
  return tone ? (tone as DialTone) : null;
}

function rowId(row: DialRow): string {
  return String(row.id || "");
}

export function readReviewedDials(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleDialReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !ids.includes(token)) return readReviewedDials(reviewed, ids);
  const current = readReviewedDials(reviewed, ids);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkDialReview(reviewed: readonly string[], ids: readonly string[], allow: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedDials(reviewed, allow));
  for (const id of ids) {
    const token = String(id || "").trim();
    if (!token || !allow.includes(token)) continue;
    if (on) current.add(token);
    else current.delete(token);
  }
  return readReviewedDials(Array.from(current), allow);
}

/** Search matches the name and the digits. The band and the tone are not part of the query. */
export function visibleDialCustomers<T extends DialRow>(
  rows: readonly T[],
  band: DialBand | "blank" | null,
  tone: DialTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: DialShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = dialState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && dialBand(row.note) !== band) return false;
    if (tone !== null && dialTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogDial(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideDial(row.note))) return false;
    if (shape === "open" && !openDial(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    const digits = dialCopy(row.note);
    return `${row.label || ""} ${digits}`.toLowerCase().includes(text);
  });
}

/** The CSV is the bands and tones on this page. */
export function dialsCsv(rows: readonly DialRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = dialState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of dialBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of dialTones(rows)) lines.push(["tone", csvCell(line.tone), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogDialCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideDialCount(rows))].join(","));
  lines.push(["shape", "open", String(openDialCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedDialCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function dialRowsCsv(rows: readonly DialRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,tone,phone,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(dialBand(row.note)),
      csvCell(dialTone(row.note)),
      csvCell(dialCopy(row.note)),
      catalogDial(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
