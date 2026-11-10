/**
 * Sitting books for the appointment desk, and the city already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sitting_book (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   minute integer,
 *   cloth text not null default '',
 *   room text not null default '',
 *   stance text not null default '',
 *   rank integer,
 *   span integer,
 *   tags text not null default '',
 *   pause integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_city_mark_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_city_mark_review (
 *   customer_id text primary key
 * );
 */

export const SIT_KEY = "crmv4-sitting-book";
export const SIT_VIEW_KEY = "crmv4-sitting-views";
export const SIT_DENSITY_KEY = "crmv4-sitting-density";
export const MARK_KEY = "crmv4-city-mark-hide";
export const MARK_REVIEW_KEY = "crmv4-city-mark-review";

export type SitCloth = "blank" | "linen" | "wool" | "silk" | "velvet";

export type SitStance = "blank" | "wait" | "seat" | "done";

export type SitTray = "open" | "held" | "closed";

export type MinutePick = "blank" | "dawn" | "day" | "night" | "peak" | "quiet";

export type SitDensity = "roomy" | "tight";

export type SitSort = "minute" | "title";

export type Sitting = {
  id: string;
  title: string;
  note: string;
  host: string;
  minute: number | null;
  cloth: string;
  room: string;
  stance: string;
  rank: number | null;
  span: number | null;
  tags: string[];
  pause: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type SitView = {
  id: string;
  name: string;
  tray: SitTray;
  query: string;
  host: string;
  cloth: string;
  room: string;
  stance: string;
  minute: string;
  rank: string;
  span: string;
};

export type SitCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  paused: number;
  house: number;
};

export type CityState = "" | "set" | "clear";

export type CityBand = "" | "lane" | "town" | "metro";

export type CityTone = "" | "open" | "shut";

export type CityShape = "all" | "catalog" | "metro" | "open";

export type CityValue =
  | { city?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type CityRow = { id?: string; note?: CityValue; label?: string | null };

export type CityBandLine = { band: string; count: number };

export type CityToneLine = { tone: string; count: number };

const AUDITS = ["save", "edit", "stance", "pin", "unpin", "hold", "lift", "close", "reopen", "cloth", "tag", "pause"] as const;

const CLOTHS = ["linen", "wool", "silk", "velvet"] as const;

const STANCES = ["wait", "seat", "done"] as const;

const STANCE_ORDER = ["", "wait", "seat", "done"] as const;

const MINUTE_PICKS = ["blank", "dawn", "day", "night", "peak", "quiet"] as const;

const PEAK_MINUTES = new Set([0, 30]);

const QUIET_MINUTES = new Set([7, 13]);

const DAWN_MINUTES = new Set([5, 6, 8]);

const NIGHT_MINUTES = new Set([45, 50, 55]);

const HOUSE = new Set(["PAR", "LON", "BER"]);

const CITY_BANDS = ["lane", "town", "metro"] as const;

const TONES = ["open", "shut"] as const;

const CATALOG = new Set(["OSLO", "BERLIN", "LONDON"]);

const CITY_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const SIT_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SitTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<SitCloth, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<SitCloth, "blank">) : "";
}

function stanceName(raw: unknown): Exclude<SitStance, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (STANCES as readonly string[]).includes(text) ? (text as Exclude<SitStance, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function sitLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function sitNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A room is three letters. Anything else stays blank. Letters are stored in capitals. */
export function roomOf(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

/**
 * A minute is an integer from 0 through 59.
 * A blank value stays unset. 60 is not a minute.
 * A leading zero is not a minute. The first minute is 0.
 */
export function minuteOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 0 || raw > 59) return null;
    return raw;
  }
  const text = clip(raw, 4);
  if (!/^(0|[1-9]\d?)$/.test(text)) return null;
  const value = Number(text);
  return value <= 59 ? value : null;
}

/** A rank is 2, 4, or 8. A blank value stays unset. A leading zero is not a rank. */
export function rankOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

/** A span is 15, 30, or 60 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** A pause is 0, 15, or 30 minutes. Anything else stays unset. */
export function pauseOf(raw: unknown): 0 | 15 | 30 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  return null;
}

/** Night is 45, 50, and 55. Dawn is 5, 6, and 8. Every other minute is day. */
export function minuteBand(minute: unknown): "blank" | "night" | "dawn" | "day" {
  const value = minuteOf(minute);
  if (value === null) return "blank";
  if (NIGHT_MINUTES.has(value)) return "night";
  if (DAWN_MINUTES.has(value)) return "dawn";
  return "day";
}

/** Peak minutes are 0 and 30. An unset minute is not a peak. */
export function peakMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && PEAK_MINUTES.has(value);
}

/** Quiet minutes are 7 and 13. 0 and 30 are not quiet. An unset minute is not quiet. */
export function quietMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && QUIET_MINUTES.has(value);
}

/**
 * The shortest signed step from the saved minute to the typed minute.
 * The ring wraps at 60. A step of 30 stays. A step of -30 stays.
 */
export function minuteGap(minute: unknown, desk: unknown): number | null {
  const from = minuteOf(minute);
  const at = minuteOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 30) diff -= 60;
  if (diff < -30) diff += 60;
  return diff;
}

/** PAR, LON, and BER are house rooms. A blank room is not. */
export function houseRoom(room: unknown): boolean {
  return HOUSE.has(roomOf(room));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): SitDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Minute or title. Anything else stays on the minute. */
export function sortMode(raw: unknown): SitSort {
  return raw === "title" ? "title" : "minute";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return /^[a-z]+$/.test(text) ? text : "";
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

function readOne(raw: unknown): Sitting | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<Sitting>;
  const id = clip(row.id, 24);
  const title = sitLine(row.title);
  if (!id || !title) return null;
  const pause = pauseOf(row.pause);
  return {
    id,
    title,
    note: sitNote(row.note),
    host: hostLabel(row.host),
    minute: minuteOf(row.minute),
    cloth: clothName(row.cloth),
    room: roomOf(row.room),
    stance: stanceName(row.stance),
    rank: rankOf(row.rank),
    span: spanOf(row.span),
    tags: tagsOf(row.tags),
    pause: pause === null ? 0 : pause,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readSittings(raw: unknown): Sitting[] {
  if (!Array.isArray(raw)) return [];
  const out: Sitting[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, SIT_CAP);
}

export function addSitting(
  cards: readonly Sitting[],
  card: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    minute?: unknown;
    cloth?: string;
    room?: string;
    stance?: string;
    rank?: unknown;
    span?: unknown;
    tags?: unknown;
    pause?: unknown;
  },
): Sitting[] {
  const current = readSittings(cards);
  const id = String(card.id || "").trim();
  const title = sitLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const pause = pauseOf(card.pause);
  const next: Sitting = {
    id,
    title,
    note: sitNote(card.note),
    host: hostLabel(card.host),
    minute: minuteOf(card.minute),
    cloth: clothName(card.cloth),
    room: roomOf(card.room),
    stance: stanceName(card.stance),
    rank: rankOf(card.rank),
    span: spanOf(card.span),
    tags: tagsOf(card.tags),
    pause: pause === null ? 0 : pause,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SIT_CAP);
}

export function cycleStance(cards: readonly Sitting[], id: string): Sitting[] {
  return readSittings(cards).map((card) => {
    if (card.id !== id) return card;
    const at = STANCE_ORDER.indexOf(card.stance as (typeof STANCE_ORDER)[number]);
    const next = at < 0 || at >= STANCES.length ? STANCES[0] : STANCES[at % STANCES.length];
    if (!next || next === card.stance) return card;
    return { ...card, stance: next, audit: "stance" };
  });
}

export function setSittingPin(cards: readonly Sitting[], id: string, pinned: boolean): Sitting[] {
  return readSittings(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setSittingHold(cards: readonly Sitting[], id: string, held: boolean): Sitting[] {
  return readSittings(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setSittingClose(cards: readonly Sitting[], id: string, closed: boolean): Sitting[] {
  return readSittings(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSitting(cards: readonly Sitting[], id: string, title: string): Sitting[] {
  const current = readSittings(cards);
  const next = sitLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editSittingNote(cards: readonly Sitting[], id: string, note: string): Sitting[] {
  const current = readSittings(cards);
  const next = sitNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

/** A tag that is already on the sitting, or a fourth tag, is left out. */
export function addSittingTag(cards: readonly Sitting[], id: string, tag: unknown): Sitting[] {
  const next = tagOf(tag);
  if (!next) return readSittings(cards);
  return readSittings(cards).map((card) => {
    if (card.id !== id || card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

export function dropSittingTag(cards: readonly Sitting[], id: string, tag: unknown): Sitting[] {
  const next = tagOf(tag);
  if (!next) return readSittings(cards);
  return readSittings(cards).map((card) => {
    if (card.id !== id || !card.tags.includes(next)) return card;
    return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
  });
}

/** An unknown pause is left as it is. 0 clears the pause. */
export function setSittingPause(cards: readonly Sitting[], id: string, pause: unknown): Sitting[] {
  const next = pauseOf(pause);
  if (next === null) return readSittings(cards);
  return readSittings(cards).map((card) => (card.id === id && card.pause !== next ? { ...card, pause: next, audit: "pause" } : card));
}

export function bulkSittingCloth(cards: readonly Sitting[], ids: readonly string[], cloth: unknown): Sitting[] {
  const next = clothName(cloth);
  if (!next) return readSittings(cards);
  const picked = new Set(ids);
  return readSittings(cards).map((card) => (picked.has(card.id) && card.cloth !== next ? { ...card, cloth: next, audit: "cloth" } : card));
}

export function bulkSittingPin(cards: readonly Sitting[], ids: readonly string[], pinned: boolean): Sitting[] {
  const picked = new Set(ids);
  return readSittings(cards).map((card) => (picked.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkSittingClose(cards: readonly Sitting[], ids: readonly string[], closed: boolean): Sitting[] {
  const picked = new Set(ids);
  return readSittings(cards).map((card) => (picked.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

export function bulkSittingTag(cards: readonly Sitting[], ids: readonly string[], tag: unknown): Sitting[] {
  return ids.reduce((cards, id) => addSittingTag(cards, id, tag), readSittings(cards));
}

export function resetSittings(): Sitting[] {
  return [];
}

function inTray(card: Sitting, tray: SitTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "held") return card.held && !card.closed;
  return !card.held && !card.closed;
}

function minuteHit(minute: number | null, exact: number | null, pick: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (pick === null) return true;
  if (pick === "blank") return minute === null;
  if (pick === "peak") return peakMinute(minute);
  if (pick === "quiet") return quietMinute(minute);
  return minuteBand(minute) === pick;
}

/** An open sitting whose minute sits more than ten steps behind the desk minute. A pause, a hold, or a close is not late. */
export function lateSitting(card: Sitting, desk: unknown): boolean {
  const gap = minuteGap(card.minute, desk);
  return inTray(card, "open") && card.pause === 0 && gap !== null && gap > 10;
}

/** An open sitting with a fifteen-minute span is the reminder. A pause, a hold, or a close is not. */
export function soonSitting(card: Sitting): boolean {
  return inTray(card, "open") && card.pause === 0 && card.span === 15;
}

/** Open sittings that are late or soon. A paused sitting stays off the reminder list. */
export function reminderSittings(cards: readonly Sitting[], desk: unknown): Sitting[] {
  return readSittings(cards).filter((card) => lateSitting(card, desk) || soonSitting(card));
}

/** Search matches the title, the note, the host, and the tags. The minute and the cloth are not part of the query. */
export function visibleSittings(
  cards: readonly Sitting[],
  tray: SitTray,
  query: string,
  host: string | null,
  cloth: SitCloth | null,
  room: string | null,
  stance: SitStance | null,
  exact: number | null,
  pick: MinutePick | null,
  rank: number | "blank" | null,
  span: number | "blank" | null,
  waitOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): Sitting[] {
  const text = query.trim().toLowerCase();
  const wantHost = host === null ? null : hostLabel(host);
  return readSittings(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (wantHost !== null && card.host !== wantHost) return false;
    if (cloth === "blank" && card.cloth) return false;
    if (cloth && cloth !== "blank" && card.cloth !== cloth) return false;
    if (room !== null && card.room !== room) return false;
    if (stance === "blank" && card.stance) return false;
    if (stance && stance !== "blank" && card.stance !== stance) return false;
    if (!minuteHit(card.minute, exact, pick)) return false;
    if (rank === "blank" && card.rank !== null) return false;
    if (typeof rank === "number" && card.rank !== rank) return false;
    if (span === "blank" && card.span !== null) return false;
    if (typeof span === "number" && card.span !== span) return false;
    if (waitOnly && card.stance !== "wait") return false;
    if (peakOnly && !peakMinute(card.minute)) return false;
    if (houseOnly && !houseRoom(card.room)) return false;
    if (quietOnly && !quietMinute(card.minute)) return false;
    if (awakeOnly && card.pause !== 0) return false;
    if (!text) return true;
    return `${card.title} ${card.note} ${card.host} ${card.tags.join(" ")}`.toLowerCase().includes(text);
  });
}

export function sortSittings(cards: readonly Sitting[], mode: SitSort): Sitting[] {
  const rows = readSittings(cards);
  if (mode === "title") return rows.slice().sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return rows.slice().sort((a, b) => (a.minute ?? 99) - (b.minute ?? 99) || a.title.localeCompare(b.title));
}

export function sittingTimeline(cards: readonly Sitting[], query: string): Sitting[] {
  return sortSittings(visibleSittings(cards, "open", query, null, null, null, null, null, null, null, null, false, false, false, false, false).filter((card) => card.minute !== null), "minute");
}

export function sittingCounts(cards: readonly Sitting[], desk: unknown): SitCounts {
  const rows = readSittings(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakMinute(card.minute) && inTray(card, "open")).length,
    late: rows.filter((card) => lateSitting(card, desk)).length,
    soon: rows.filter((card) => soonSitting(card)).length,
    paused: rows.filter((card) => inTray(card, "open") && card.pause !== 0).length,
    house: rows.filter((card) => houseRoom(card.room)).length,
  };
}

export function sittingShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function clothCounts(cards: readonly Sitting[]): { cloth: Exclude<SitCloth, "blank">; count: number }[] {
  const rows = readSittings(cards);
  return CLOTHS.map((cloth) => ({ cloth, count: rows.filter((card) => card.cloth === cloth).length })).filter((row) => row.count > 0);
}

export function usedMinutes(cards: readonly Sitting[]): number {
  return new Set(readSittings(cards).map((card) => card.minute).filter((minute): minute is number => minute !== null)).size;
}

export function clashMinuteIds(cards: readonly Sitting[]): string[] {
  const open = readSittings(cards).filter((card) => inTray(card, "open") && card.minute !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.minute === card.minute)).map((card) => card.id);
}

export function clashMinuteCount(cards: readonly Sitting[]): number {
  return clashMinuteIds(cards).length;
}

export function rankClashIds(cards: readonly Sitting[]): string[] {
  const open = readSittings(cards).filter((card) => inTray(card, "open") && card.rank !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.rank === card.rank)).map((card) => card.id);
}

export function rankClashCount(cards: readonly Sitting[]): number {
  return rankClashIds(cards).length;
}

export function nextSitting(cards: readonly Sitting[], desk: unknown): string {
  const now = minuteOf(desk);
  if (now === null) return "";
  const waiting = readSittings(cards).filter((card) => inTray(card, "open") && card.minute !== null && card.stance !== "done" && card.pause === 0);
  if (!waiting.length) return "";
  const byMinute = (a: Sitting, b: Sitting) => (a.minute ?? 0) - (b.minute ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.minute ?? 0) >= now).sort(byMinute);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMinute)[0].id;
}

/**
 * The cloth with the fewest open sittings.
 * A tie keeps velvet, then linen, then wool, then silk.
 * Sittings with no cloth are not a load. An empty desk still suggests velvet.
 */
export function suggestCloth(cards: readonly Sitting[]): Exclude<SitCloth, "blank"> {
  const rows = readSittings(cards).filter((card) => inTray(card, "open"));
  const order = ["velvet", "linen", "wool", "silk"] as const;
  let best: Exclude<SitCloth, "blank"> = "velvet";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((card) => card.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The host carrying the fewest open sittings.
 * A tie keeps the earlier name. A blank host is not a load.
 * An empty desk stays blank.
 */
export function suggestHost(cards: readonly Sitting[]): string {
  const rows = readSittings(cards).filter((card) => inTray(card, "open") && card.host);
  if (!rows.length) return "";
  const names = sittingHosts(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((card) => card.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The span used most on open sittings. A tie keeps 30, then 15, then 60. An empty desk suggests 30. */
export function suggestSpan(cards: readonly Sitting[]): 15 | 30 | 60 {
  const rows = readSittings(cards).filter((card) => inTray(card, "open") && card.span !== null);
  const order = [30, 15, 60] as const;
  let best: 15 | 30 | 60 = 30;
  let bestCount = -1;
  for (const span of order) {
    const count = rows.filter((card) => card.span === span).length;
    if (count > bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

export function fairHost(cards: readonly Sitting[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = hostLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestHost(cards);
  const open = readSittings(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The host carrying the most open sittings. A tie keeps the earlier name. A blank host is not a load. */
export function busiestHost(cards: readonly Sitting[]): string {
  const rows = readSittings(cards).filter((card) => inTray(card, "open") && card.host);
  if (!rows.length) return "";
  const names = sittingHosts(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = -1;
  for (const name of names) {
    const count = rows.filter((card) => card.host === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function sittingHosts(cards: readonly Sitting[]): string[] {
  const out: string[] = [];
  for (const card of readSittings(cards)) {
    if (card.host && !out.includes(card.host)) out.push(card.host);
  }
  return out;
}

export function sittingRooms(cards: readonly Sitting[]): string[] {
  const out: string[] = [];
  for (const card of readSittings(cards)) {
    if (card.room && !out.includes(card.room)) out.push(card.room);
  }
  return out;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function sittingCopy(card: Sitting, desk: unknown): string {
  const gap = minuteGap(card.minute, desk);
  return [card.title, card.host, card.minute ?? "", card.cloth, card.room, card.stance, card.rank ?? "", card.span ?? "", card.tags.join(" "), card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the sittings saved in this browser. The gap and the late mark use the minute you pass. */
export function sittingsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,minute,cloth,room,stance,rank,span,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const card of readSittings(raw)) {
    const gap = minuteGap(card.minute, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.host),
      card.minute === null ? "" : String(card.minute),
      card.cloth,
      csvCell(card.room),
      card.stance,
      card.rank === null ? "" : String(card.rank),
      card.span === null ? "" : String(card.span),
      csvCell(card.tags.join(" ")),
      String(card.pause),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSitting(card, desk) ? "1" : "0",
      soonSitting(card) ? "1" : "0",
      houseRoom(card.room) ? "1" : "0",
      csvCell(card.note),
      card.audit,
    ].join(","));
  }
  return lines.join("\n");
}

function hostSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hostLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function roomSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return roomOf(raw) || "all";
}

function stanceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stanceName(raw) || "all";
}

export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const name = hostLabel(filter);
  return name && hosts.includes(name) ? name : "all";
}

export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function activeRoom(filter: string, rooms: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const room = roomOf(filter);
  return room && rooms.includes(room) ? room : "all";
}

export function activeStance(filter: string, stances: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stance = stanceName(filter);
  return stance && stances.includes(stance) ? stance : "all";
}

export function activeMinute(filter: string): string {
  if (filter === "all") return "all";
  return (MINUTE_PICKS as readonly string[]).includes(filter) ? filter : "all";
}

export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return filter === "2" || filter === "4" || filter === "8" ? filter : "all";
}

export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return filter === "15" || filter === "30" || filter === "60" ? filter : "all";
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return hostLabel(filter);
}

export function clothArg(filter: string): SitCloth | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const cloth = clothName(filter);
  return cloth ? cloth : null;
}

export function roomArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return roomOf(filter);
}

export function stanceArg(filter: string): SitStance | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const stance = stanceName(filter);
  return stance ? stance : null;
}

export function minuteArg(filter: string): { exact: number | null; pick: MinutePick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if ((MINUTE_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as MinutePick };
  const exact = minuteOf(filter);
  return exact === null ? { exact: null, pick: null } : { exact, pick: null };
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function readSittingViews(raw: unknown): SitView[] {
  if (!Array.isArray(raw)) return [];
  const out: SitView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SitView>;
    const id = clip(row.id, 24);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      host: hostSlot(row.host),
      cloth: clothSlot(row.cloth),
      room: roomSlot(row.room),
      stance: stanceSlot(row.stance),
      minute: activeMinute(String(row.minute || "all")),
      rank: activeRank(String(row.rank || "all")),
      span: activeSpan(String(row.span || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSittingView(views: readonly SitView[], view: SitView): SitView[] {
  const current = readSittingViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    host: hostSlot(view.host),
    cloth: clothSlot(view.cloth),
    room: roomSlot(view.room),
    stance: stanceSlot(view.stance),
    minute: activeMinute(view.minute),
    rank: activeRank(view.rank),
    span: activeSpan(view.span),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropSittingView(views: readonly SitView[], id: string): SitView[] {
  return readSittingViews(views).filter((view) => view.id !== id);
}

/**
 * A city mark is the city already stored on the account.
 * Lengths that stay are 4, 6, and 8. A blank value stays unset.
 * Spaces and hyphens are ignored. Letters are stored in capitals.
 */
export function cityToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]+$/.test(text)) return null;
  const size = text.length;
  if (size !== 4 && size !== 6 && size !== 8) return null;
  return text;
}

function cityBody(value: CityValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = cityToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CITY_BLOCK.some((key) => key in value)) return null;
  if (!("city" in value)) return { text: null, explicit: false };
  const inner = value.city;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = cityToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set mark is a city of length 4, 6, or 8.
 * A clear mark is an explicit blank. A missing field stays unmarked.
 */
export function cityState(value: CityValue): CityState {
  const body = cityBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The city letters, or a blank string when the mark is clear or unmarked. */
export function cityCopy(value: CityValue): string {
  return cityBody(value)?.text || "";
}

/**
 * Lane is 4. Town is 6. Metro is 8.
 * A blank city has no band.
 */
export function cityBand(value: CityValue): CityBand {
  const text = cityBody(value)?.text;
  if (!text) return "";
  if (text.length === 4) return "lane";
  if (text.length === 6) return "town";
  return "metro";
}

/** Open when the city starts with a vowel. Shut when it does not. A blank city has no tone. */
export function cityTone(value: CityValue): CityTone {
  const text = cityBody(value)?.text;
  if (!text) return "";
  return "AEIOU".includes(text[0]) ? "open" : "shut";
}

/** OSLO, BERLIN, and LONDON are the house catalog. */
export function catalogCity(value: CityValue): boolean {
  const text = cityBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A city of 6 or 8 letters. A clear city is not wide. */
export function wideCity(value: CityValue): boolean {
  const text = cityBody(value)?.text;
  if (!text) return false;
  return text.length >= 6;
}

export function openCity(value: CityValue): boolean {
  return cityTone(value) === "open";
}

export function catalogCityCount(rows: readonly CityRow[]): number {
  return rows.filter((row) => cityState(row.note) === "set" && catalogCity(row.note)).length;
}

export function wideCityCount(rows: readonly CityRow[]): number {
  return rows.filter((row) => cityState(row.note) === "set" && wideCity(row.note)).length;
}

export function openCityCount(rows: readonly CityRow[]): number {
  return rows.filter((row) => cityState(row.note) === "set" && openCity(row.note)).length;
}

/** How many distinct cities are carried by two or more loaded rows. */
export function sharedCityCount(rows: readonly CityRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (cityState(row.note) !== "set") continue;
    const text = cityCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function cityBands(rows: readonly CityRow[]): CityBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = cityState(row.note);
    if (state === "") continue;
    const band = state === "set" ? cityBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: CityBandLine[] = [];
  for (const band of ["", ...CITY_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function cityTones(rows: readonly CityRow[]): CityToneLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = cityState(row.note);
    if (state !== "set") continue;
    const tone = cityTone(row.note);
    map.set(tone, (map.get(tone) || 0) + 1);
  }
  const out: CityToneLine[] = [];
  for (const tone of TONES) {
    const count = map.get(tone);
    if (count) out.push({ tone, count });
  }
  return out;
}

/** The band with the most set cities. A tie keeps lane, then town, then metro. A clear city is not a lead. */
export function leadingCity(rows: readonly CityRow[]): string {
  const named = cityBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => CITY_BANDS.indexOf(band as (typeof CITY_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The tone with the most set cities. A tie keeps open, then shut. */
export function leadingCityTone(rows: readonly CityRow[]): string {
  const named = cityTones(rows);
  if (!named.length) return "";
  const order = (tone: string) => TONES.indexOf(tone as (typeof TONES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.tone) - order(b.tone))[0].tone;
}

export function cityShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((CITY_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentCities(rows: readonly CityRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = cityState(row.note);
    const token = state === "set" ? cityBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenCities(raw: unknown, present: readonly string[]): string[] {
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

export function toggleCity(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenCities(hidden, present);
  const current = readHiddenCities(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleCityBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function activeCityBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const band = bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

export function cityBandArg(filter: string): CityBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as CityBand) : null;
}

function toneOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? text : "";
}

export function activeCityTone(filter: string): string {
  if (filter === "all") return "all";
  return toneOwner(filter) || "all";
}

export function cityToneArg(filter: string): CityTone | null {
  const tone = toneOwner(filter);
  return tone ? (tone as CityTone) : null;
}

function rowId(row: CityRow): string {
  return String(row.id || "");
}

export function readReviewedCities(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCityReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !ids.includes(token)) return readReviewedCities(reviewed, ids);
  const current = readReviewedCities(reviewed, ids);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkCityReview(reviewed: readonly string[], ids: readonly string[], allow: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedCities(reviewed, allow));
  for (const id of ids) {
    const token = String(id || "").trim();
    if (!token || !allow.includes(token)) continue;
    if (on) current.add(token);
    else current.delete(token);
  }
  return readReviewedCities(Array.from(current), allow);
}

/** Search matches the name and the city. The band and the tone are not part of the query. */
export function visibleCityCustomers<T extends CityRow>(
  rows: readonly T[],
  band: CityBand | "blank" | null,
  tone: CityTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: CityShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = cityState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && cityBand(row.note) !== band) return false;
    if (tone !== null && cityTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogCity(row.note)) return false;
    if (shape === "metro" && (state !== "set" || cityBand(row.note) !== "metro")) return false;
    if (shape === "open" && !openCity(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    const city = cityCopy(row.note);
    return `${row.label || ""} ${city}`.toLowerCase().includes(text);
  });
}

/** The CSV is the bands and tones on this page. */
export function citiesCsv(rows: readonly CityRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = cityState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of cityBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of cityTones(rows)) lines.push(["tone", csvCell(line.tone), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogCityCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideCityCount(rows))].join(","));
  lines.push(["shape", "open", String(openCityCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedCityCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function cityRowsCsv(rows: readonly CityRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,tone,city,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(cityBand(row.note)),
      csvCell(cityTone(row.note)),
      csvCell(cityCopy(row.note)),
      catalogCity(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
