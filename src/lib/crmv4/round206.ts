/**
 * Reading lamps for the support desk, and letter crests already stored as email on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_reading_lamp (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   hour integer,
 *   alcove text not null default '',
 *   flame text not null default '',
 *   wick integer,
 *   span integer,
 *   tags text not null default '',
 *   shade integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_letter_crest_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_letter_crest_review (
 *   customer_id text primary key
 * );
 */

export const RDL_KEY = "crmv4-reading-lamp";
export const RDL_VIEW_KEY = "crmv4-reading-views";
export const RDL_DENSITY_KEY = "crmv4-reading-density";
export const LTR_KEY = "crmv4-letter-hide";
export const LTR_REVIEW_KEY = "crmv4-letter-review";

export type LampAlcove = "blank" | "ink" | "ivory" | "graphite";

export type LampFlame = "blank" | "steady" | "bright" | "dim";

export type LampTray = "open" | "held" | "closed";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type LampDensity = "roomy" | "tight";

export type LampSort = "hour" | "title";

export type ReadingLamp = {
  id: string;
  title: string;
  note: string;
  reader: string;
  hour: number | null;
  alcove: string;
  flame: string;
  wick: number | null;
  span: number | null;
  tags: string[];
  shade: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type LampView = {
  id: string;
  name: string;
  tray: LampTray;
  query: string;
  reader: string;
  alcove: string;
  flame: string;
  hour: string;
  wick: string;
  span: string;
};

export type LampCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  shade: number;
  house: number;
  window: number;
};

export type LetterState = "" | "set" | "clear";

export type LetterBand = "" | "brief" | "even" | "long" | "plain";

export type LetterTone = "" | "gilt" | "ink" | "ivory" | "plain";

export type LetterShape = "all" | "catalog" | "wide" | "gilt";

export type LetterValue =
  | { email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; assigneeId?: unknown; referralCodeUsed?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type LetterRow = { id: string; note?: LetterValue; label?: string | null };

export type LetterBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "flame", "pin", "unpin", "hold", "lift", "close", "open", "alcove", "tag", "shade"] as const;

const ALCOVES = ["ink", "ivory", "graphite"] as const;

const FLAMES = ["steady", "bright", "dim"] as const;

const FLAME_ORDER = ["", "steady", "bright", "dim"] as const;

const PEAK_HOURS = new Set([4, 5]);

const QUIET_HOURS = new Set([1, 9]);

const HOUSE = new Set(["INK", "IVORY"]);

const LETTER_BANDS = ["brief", "even", "long", "plain"] as const;

const TONES = ["gilt", "ink", "ivory", "plain"] as const;

const CATALOG = new Set(["ada@7fx.com", "bea@desk.net", "cal@house.org"]);

const LETTER_BLOCK = ["lastIp", "timezone", "username", "phone", "assigneeId", "referralCodeUsed", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name"] as const;

const LAMP_CAP = 8;

const VIEW_CAP = 6;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LampTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function alcoveName(raw: unknown): Exclude<LampAlcove, "blank"> | "" {
  const text = clip(raw, 10).toLowerCase();
  return (ALCOVES as readonly string[]).includes(text) ? (text as Exclude<LampAlcove, "blank">) : "";
}

function flameNameOf(raw: unknown): Exclude<LampFlame, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FLAMES as readonly string[]).includes(text) ? (text as Exclude<LampFlame, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function lampLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function lampNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** An alcove is INK, IVORY, or GRAPHITE. Anything else stays blank. Letters are stored in capitals. */
export function alcoveOf(raw: unknown): string {
  const name = alcoveName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An hour is an integer from 1 through 9.
 * A blank value stays unset. 0 is not an hour.
 * A second digit is not an hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 9) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-9]$/.test(text)) return null;
  return Number(text);
}

/** A wick is 3, 6, or 9. A blank value stays unset. A leading zero is not a wick. */
export function wickOf(raw: unknown): 3 | 6 | 9 | null {
  if (raw === 3 || raw === "3") return 3;
  if (raw === 6 || raw === "6") return 6;
  if (raw === 9 || raw === "9") return 9;
  return null;
}

/** A span is 10, 25, or 50. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 10 | 25 | 50 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 25 || raw === "25") return 25;
  if (raw === 50 || raw === "50") return 50;
  return null;
}

/** A shade is 0, 4, or 12. Anything else is not a shade. 0 clears the shade. */
export function shadeOf(raw: unknown): 0 | 4 | 12 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 12 || raw === "12") return 12;
  return null;
}

export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak hours are 4 and 5. An unset hour is not a peak hour. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 1 and 9. A peak hour is not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * How far an hour sits behind the desk hour.
 * A positive gap means the lamp hour is behind. A negative gap means it is ahead.
 * A gap of zero means the same hour. An unset hour has no gap. Hours do not wrap.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** INK and IVORY are house alcoves. GRAPHITE is a guest alcove. A blank alcove is not a house alcove. */
export function houseAlcove(alcove: unknown): boolean {
  return HOUSE.has(alcoveOf(alcove));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): LampDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): LampSort {
  return raw === "title" ? "title" : "hour";
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

function readOne(raw: unknown): ReadingLamp | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ReadingLamp>;
  const id = clip(row.id, 24);
  const title = lampLine(row.title);
  if (!id || !title) return null;
  const shade = shadeOf(row.shade);
  return {
    id,
    title,
    note: lampNote(row.note),
    reader: readerLabel(row.reader),
    hour: hourOf(row.hour),
    alcove: alcoveOf(row.alcove),
    flame: flameNameOf(row.flame),
    wick: wickOf(row.wick),
    span: spanOf(row.span),
    tags: tagsOf(row.tags),
    shade: shade === null ? 0 : shade,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readLamps(raw: unknown): ReadingLamp[] {
  if (!Array.isArray(raw)) return [];
  const out: ReadingLamp[] = [];
  for (const item of raw) {
    const lamp = readOne(item);
    if (!lamp || out.some((row) => row.id === lamp.id || row.title === lamp.title)) continue;
    out.push(lamp);
  }
  return out.slice(0, LAMP_CAP);
}

export function addLamp(
  lamps: readonly ReadingLamp[],
  lamp: {
    id: string;
    title: string;
    note?: string;
    reader?: string;
    hour?: unknown;
    alcove?: string;
    flame?: string;
    wick?: unknown;
    span?: unknown;
    tags?: unknown;
    shade?: unknown;
  },
): ReadingLamp[] {
  const current = readLamps(lamps);
  const id = String(lamp.id || "").trim();
  const title = lampLine(lamp.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const shade = shadeOf(lamp.shade);
  const next: ReadingLamp = {
    id,
    title,
    note: lampNote(lamp.note),
    reader: readerLabel(lamp.reader),
    hour: hourOf(lamp.hour),
    alcove: alcoveOf(lamp.alcove),
    flame: flameNameOf(lamp.flame),
    wick: wickOf(lamp.wick),
    span: spanOf(lamp.span),
    tags: tagsOf(lamp.tags),
    shade: shade === null ? 0 : shade,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, LAMP_CAP);
}

export function cycleFlame(lamps: readonly ReadingLamp[], id: string): ReadingLamp[] {
  return readLamps(lamps).map((lamp) => {
    if (lamp.id !== id) return lamp;
    const at = FLAME_ORDER.indexOf(lamp.flame as (typeof FLAME_ORDER)[number]);
    const next = at < 0 || at >= FLAMES.length ? FLAMES[0] : FLAMES[at % FLAMES.length];
    if (!next || next === lamp.flame) return lamp;
    return { ...lamp, flame: next, audit: "flame" };
  });
}

/** A blank title is left as it is. */
export function editLamp(lamps: readonly ReadingLamp[], id: string, title: unknown): ReadingLamp[] {
  const next = lampLine(title);
  if (!next) return readLamps(lamps);
  const current = readLamps(lamps);
  if (current.some((lamp) => lamp.id !== id && lamp.title === next)) return current;
  return current.map((lamp) => (lamp.id === id && lamp.title !== next ? { ...lamp, title: next, audit: "edit" } : lamp));
}

/** A blank note is left as it is. */
export function editLampNote(lamps: readonly ReadingLamp[], id: string, note: unknown): ReadingLamp[] {
  const next = lampNote(note);
  if (!next) return readLamps(lamps);
  return readLamps(lamps).map((lamp) => (lamp.id === id && lamp.note !== next ? { ...lamp, note: next, audit: "edit" } : lamp));
}

/** A tag that is already on the lamp, or a fifth tag, is left out. A tag is one letter from g to l. */
export function addLampTag(lamps: readonly ReadingLamp[], id: string, tag: unknown): ReadingLamp[] {
  const next = tagOf(tag);
  if (!next) return readLamps(lamps);
  return readLamps(lamps).map((lamp) => {
    if (lamp.id !== id || lamp.tags.includes(next) || lamp.tags.length >= TAG_CAP) return lamp;
    return { ...lamp, tags: [...lamp.tags, next], audit: "tag" };
  });
}

/** An unknown shade is left as it is. 0 clears the shade. */
export function setLampShade(lamps: readonly ReadingLamp[], id: string, shade: unknown): ReadingLamp[] {
  const next = shadeOf(shade);
  if (next === null) return readLamps(lamps);
  return readLamps(lamps).map((lamp) => (lamp.id === id && lamp.shade !== next ? { ...lamp, shade: next, audit: "shade" } : lamp));
}

export function setLampPin(lamps: readonly ReadingLamp[], id: string, pinned: boolean): ReadingLamp[] {
  return readLamps(lamps).map((lamp) => (lamp.id === id && lamp.pinned !== pinned ? { ...lamp, pinned, audit: pinned ? "pin" : "unpin" } : lamp));
}

/** P toggles the pin on the focused row of the wall currently shown. */
export function pinFocused(lamps: readonly ReadingLamp[], shownIds: readonly string[], index: number): ReadingLamp[] {
  if (!shownIds.length) return readLamps(lamps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readLamps(lamps).find((lamp) => lamp.id === id);
  if (!row) return readLamps(lamps);
  return setLampPin(lamps, id, !row.pinned);
}

/** S sets a shade of 4 on the focused lamp, or clears a shade that is already set. */
export function shadeFocused(lamps: readonly ReadingLamp[], shownIds: readonly string[], index: number): ReadingLamp[] {
  if (!shownIds.length) return readLamps(lamps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readLamps(lamps).find((lamp) => lamp.id === id);
  if (!row) return readLamps(lamps);
  return setLampShade(lamps, id, row.shade ? 0 : 4);
}

export function setLampHold(lamps: readonly ReadingLamp[], id: string, held: boolean): ReadingLamp[] {
  return readLamps(lamps).map((lamp) => (lamp.id === id && lamp.held !== held ? { ...lamp, held, audit: held ? "hold" : "lift" } : lamp));
}

export function setLampClose(lamps: readonly ReadingLamp[], id: string, closed: boolean): ReadingLamp[] {
  return readLamps(lamps).map((lamp) => (lamp.id === id && lamp.closed !== closed ? { ...lamp, closed, audit: closed ? "close" : "open" } : lamp));
}

export function bulkLampAlcove(lamps: readonly ReadingLamp[], ids: readonly string[], alcove: unknown): ReadingLamp[] {
  const next = alcoveOf(alcove);
  if (!next) return readLamps(lamps);
  const picked = new Set(ids);
  return readLamps(lamps).map((lamp) => (picked.has(lamp.id) && lamp.alcove !== next ? { ...lamp, alcove: next, audit: "alcove" } : lamp));
}

export function bulkLampPin(lamps: readonly ReadingLamp[], ids: readonly string[], pinned: boolean): ReadingLamp[] {
  const picked = new Set(ids);
  return readLamps(lamps).map((lamp) => (picked.has(lamp.id) && lamp.pinned !== pinned ? { ...lamp, pinned, audit: pinned ? "pin" : "unpin" } : lamp));
}

export function bulkLampClose(lamps: readonly ReadingLamp[], ids: readonly string[], closed: boolean): ReadingLamp[] {
  const picked = new Set(ids);
  return readLamps(lamps).map((lamp) => (picked.has(lamp.id) && lamp.closed !== closed ? { ...lamp, closed, audit: closed ? "close" : "open" } : lamp));
}

export function bulkLampTag(lamps: readonly ReadingLamp[], ids: readonly string[], tag: unknown): ReadingLamp[] {
  return ids.reduce((rows, id) => addLampTag(rows, id, tag), readLamps(lamps));
}

export function resetLamps(): ReadingLamp[] {
  return [];
}

function inTray(lamp: ReadingLamp, tray: LampTray): boolean {
  if (tray === "closed") return lamp.closed;
  if (tray === "held") return lamp.held && !lamp.closed;
  return !lamp.held && !lamp.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open lamp whose hour sits more than two hours behind the desk hour. A shade, a hold, or a close is not late. */
export function lateLamp(lamp: ReadingLamp, desk: unknown): boolean {
  const gap = hourGap(lamp.hour, desk);
  return inTray(lamp, "open") && lamp.shade === 0 && gap !== null && gap > 2;
}

/** An open lamp with a span of 10 is due now. A shade, a hold, or a close is not. */
export function soonLamp(lamp: ReadingLamp): boolean {
  return inTray(lamp, "open") && lamp.shade === 0 && lamp.span === 10;
}

/** Open lamps that are late or due now. A shaded lamp stays off the reminder list. */
export function reminderLamps(lamps: readonly ReadingLamp[], desk: unknown): ReadingLamp[] {
  return readLamps(lamps).filter((lamp) => lateLamp(lamp, desk) || soonLamp(lamp));
}

/** Open lamps whose hour sits within two hours of the desk hour. A shade, a hold, or a close stays out. */
export function windowLamps(lamps: readonly ReadingLamp[], desk: unknown): ReadingLamp[] {
  return readLamps(lamps).filter((lamp) => {
    const gap = hourGap(lamp.hour, desk);
    return inTray(lamp, "open") && lamp.shade === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Search matches the title, the note, the reader, and the tags. */
export function visibleLamps(
  lamps: readonly ReadingLamp[],
  tray: LampTray,
  query: string,
  reader: string | null,
  alcove: string | null,
  flame: string | null,
  exact: number | null,
  pick: HourPick | null,
  wick: number | "blank" | null,
  span: number | "blank" | null,
  brightOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): ReadingLamp[] {
  const text = query.trim().toLowerCase();
  return readLamps(lamps).filter((lamp) => {
    if (!inTray(lamp, tray)) return false;
    if (text) {
      const hay = `${lamp.title} ${lamp.note} ${lamp.reader} ${lamp.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (reader !== null && lamp.reader !== reader) return false;
    if (alcove === "blank" ? Boolean(lamp.alcove) : alcove && lamp.alcove !== alcove) return false;
    if (flame === "blank" ? Boolean(lamp.flame) : flame && lamp.flame !== flame) return false;
    if (!hourHit(lamp.hour, exact, pick)) return false;
    if (wick === "blank" ? lamp.wick !== null : wick !== null && lamp.wick !== wick) return false;
    if (span === "blank" ? lamp.span !== null : span !== null && lamp.span !== span) return false;
    if (brightOnly && lamp.flame !== "bright") return false;
    if (peakOnly && !peakHour(lamp.hour)) return false;
    if (houseOnly && !houseAlcove(lamp.alcove)) return false;
    if (quietOnly && !quietHour(lamp.hour)) return false;
    if (awakeOnly && lamp.shade !== 0) return false;
    return true;
  });
}

export function sortLamps(lamps: readonly ReadingLamp[], mode: LampSort): ReadingLamp[] {
  const rows = lamps.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.hour ?? 99) - (b.hour ?? 99));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function lampTimeline(lamps: readonly ReadingLamp[], query: string): ReadingLamp[] {
  const text = query.trim().toLowerCase();
  return sortLamps(
    readLamps(lamps).filter((lamp) => lamp.hour !== null && (!text || lamp.title.toLowerCase().includes(text))),
    "hour",
  );
}

export function lampCounts(lamps: readonly ReadingLamp[], desk: unknown): LampCounts {
  const rows = readLamps(lamps);
  return {
    open: rows.filter((lamp) => inTray(lamp, "open")).length,
    held: rows.filter((lamp) => inTray(lamp, "held")).length,
    closed: rows.filter((lamp) => inTray(lamp, "closed")).length,
    pinned: rows.filter((lamp) => lamp.pinned).length,
    peak: rows.filter((lamp) => inTray(lamp, "open") && lamp.shade === 0 && peakHour(lamp.hour)).length,
    late: rows.filter((lamp) => lateLamp(lamp, desk)).length,
    soon: rows.filter((lamp) => soonLamp(lamp)).length,
    shade: rows.filter((lamp) => inTray(lamp, "open") && lamp.shade > 0).length,
    house: rows.filter((lamp) => inTray(lamp, "open") && houseAlcove(lamp.alcove)).length,
    window: windowLamps(rows, desk).length,
  };
}

export function lampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open lamps as a share of every open lamp. */
export function lateShare(lamps: readonly ReadingLamp[], desk: unknown): number {
  const rows = readLamps(lamps);
  const open = rows.filter((lamp) => inTray(lamp, "open")).length;
  const late = rows.filter((lamp) => lateLamp(lamp, desk)).length;
  return lampShare(late, open);
}

/** Distinct hours on open lamps. */
export function usedHours(lamps: readonly ReadingLamp[]): number {
  const hours = new Set<number>();
  for (const lamp of readLamps(lamps)) {
    if (inTray(lamp, "open") && lamp.hour !== null) hours.add(lamp.hour);
  }
  return hours.size;
}

/** Open lamps that share an hour and an alcove. A different alcove on the same hour is not a clash. */
export function clashHourCount(lamps: readonly ReadingLamp[]): number {
  const groups = new Map<string, number>();
  for (const lamp of readLamps(lamps)) {
    if (!inTray(lamp, "open") || lamp.hour === null || !lamp.alcove) continue;
    const key = `${lamp.hour}:${lamp.alcove}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open lamps that share a wick. An unset wick is not a clash. */
export function wickClashCount(lamps: readonly ReadingLamp[]): number {
  const groups = new Map<number, number>();
  for (const lamp of readLamps(lamps)) {
    if (!inTray(lamp, "open") || lamp.wick === null) continue;
    groups.set(lamp.wick, (groups.get(lamp.wick) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open lamps in the same alcove whose hours differ by two.
 * The count is the lamps that have at least one neighbor.
 */
export function adjacentLampCount(lamps: readonly ReadingLamp[]): number {
  const open = readLamps(lamps).filter((lamp) => inTray(lamp, "open") && lamp.hour !== null && lamp.alcove);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.alcove === right.alcove && Math.abs((left.hour ?? 0) - (right.hour ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The alcove with the fewest open lamps.
 * A tie keeps GRAPHITE, then INK, then IVORY.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestAlcove(lamps: readonly ReadingLamp[]): "GRAPHITE" | "INK" | "IVORY" {
  const rows = readLamps(lamps).filter((lamp) => inTray(lamp, "open"));
  const order = ["GRAPHITE", "INK", "IVORY"] as const;
  let best: "GRAPHITE" | "INK" | "IVORY" = "GRAPHITE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const alcove of order) {
    const count = rows.filter((lamp) => lamp.alcove === alcove).length;
    if (count < bestCount) {
      best = alcove;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open lamps.
 * A tie keeps 25, then 10, then 50.
 * An empty desk still suggests 25.
 */
export function suggestSpan(lamps: readonly ReadingLamp[]): 10 | 25 | 50 {
  const rows = readLamps(lamps).filter((lamp) => inTray(lamp, "open"));
  const order = [25, 10, 50] as const;
  let best: 10 | 25 | 50 = 25;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((lamp) => lamp.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open reader. A blank reader is skipped. An empty desk stays blank. */
export function suggestReader(lamps: readonly ReadingLamp[]): string {
  const found = readLamps(lamps).find((lamp) => inTray(lamp, "open") && lamp.reader);
  return found ? found.reader : "";
}

/**
 * The reader carrying the fewest open lamps.
 * A tie keeps the earlier name. A blank reader is not a load.
 * An empty roster falls back to the newest reader.
 */
export function fairReader(lamps: readonly ReadingLamp[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = readerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestReader(lamps);
  const open = readLamps(lamps).filter((lamp) => inTray(lamp, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((lamp) => lamp.reader === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The reader with the most open lamps. A tie keeps the newer name on the desk. */
export function busiestReader(lamps: readonly ReadingLamp[]): string {
  const rows = readLamps(lamps).filter((lamp) => inTray(lamp, "open") && lamp.reader);
  const names: string[] = [];
  for (const lamp of rows) if (!names.includes(lamp.reader)) names.push(lamp.reader);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((lamp) => lamp.reader === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function lampReaders(lamps: readonly ReadingLamp[]): string[] {
  const out: string[] = [];
  for (const lamp of readLamps(lamps)) {
    if (lamp.reader && !out.includes(lamp.reader)) out.push(lamp.reader);
  }
  return out;
}

export function lampAlcoves(lamps: readonly ReadingLamp[]): string[] {
  const out: string[] = [];
  for (const lamp of readLamps(lamps)) {
    if (lamp.alcove && !out.includes(lamp.alcove)) out.push(lamp.alcove);
  }
  return out;
}

/**
 * The next open lamp at or after the desk hour.
 * A dim flame, a shade, a hold, and a close stay off the list.
 * When every open hour is behind, the earliest hour is next.
 */
export function nextLamp(lamps: readonly ReadingLamp[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readLamps(lamps).filter((lamp) => inTray(lamp, "open") && lamp.hour !== null && lamp.flame !== "dim" && lamp.shade === 0);
  if (!waiting.length) return "";
  const byHour = (a: ReadingLamp, b: ReadingLamp) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((lamp) => (lamp.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function lampCopy(lamp: ReadingLamp, desk: unknown): string {
  const gap = hourGap(lamp.hour, desk);
  return [lamp.title, lamp.reader, lamp.hour ?? "", lamp.alcove, lamp.flame, lamp.wick ?? "", lamp.span ?? "", lamp.tags.join(" "), lamp.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the lamps saved in this browser. The gap and the late mark use the hour you pass. */
export function lampsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,reader,hour,alcove,flame,wick,span,tags,shade,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readLamps(raw);
  const windowIds = new Set(windowLamps(rows, desk).map((lamp) => lamp.id));
  for (const lamp of rows) {
    const gap = hourGap(lamp.hour, desk);
    lines.push([
      lamp.title,
      lamp.reader,
      lamp.hour === null ? "" : String(lamp.hour),
      lamp.alcove,
      lamp.flame,
      lamp.wick === null ? "" : String(lamp.wick),
      lamp.span === null ? "" : String(lamp.span),
      lamp.tags.join(" "),
      String(lamp.shade),
      lamp.pinned ? "1" : "0",
      lamp.held ? "1" : "0",
      lamp.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLamp(lamp, desk) ? "1" : "0",
      soonLamp(lamp) ? "1" : "0",
      houseAlcove(lamp.alcove) ? "1" : "0",
      windowIds.has(lamp.id) ? "1" : "0",
      lamp.note,
      lamp.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeReader(raw: string, readers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return readers.includes(raw) ? raw : "all";
}

export function activeAlcove(raw: string, alcoves: readonly string[]): string {
  if (raw === "blank") return "blank";
  const alcove = alcoveOf(raw);
  return alcove && alcoves.includes(alcove) ? alcove : "all";
}

export function activeFlame(raw: string, flames: readonly string[]): string {
  if (raw === "blank") return "blank";
  const flame = flameNameOf(raw);
  return flame && flames.includes(flame) ? flame : "all";
}

export function activeHour(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const hour = hourOf(raw);
  return hour === null ? "all" : String(hour);
}

export function activeWick(raw: string): string {
  if (raw === "blank") return "blank";
  const wick = wickOf(raw);
  return wick === null ? "all" : String(wick);
}

export function activeSpan(raw: string): string {
  if (raw === "blank") return "blank";
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function readerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function alcoveArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return alcoveOf(filter) || null;
}

export function flameArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return flameNameOf(filter) || null;
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: hourOf(filter), pick: null };
}

export function wickArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return wickOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

function readView(raw: unknown): LampView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<LampView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    reader: row.reader === "blank" ? "blank" : clip(row.reader, 16) || "all",
    alcove: row.alcove === "blank" || row.alcove === "all" ? (row.alcove === "blank" ? "blank" : "all") : alcoveOf(row.alcove) || "all",
    flame: row.flame === "blank" || row.flame === "all" ? (row.flame === "blank" ? "blank" : "all") : flameNameOf(row.flame) || "all",
    hour: activeHour(String(row.hour || "all")),
    wick: activeWick(String(row.wick || "all")),
    span: activeSpan(String(row.span || "all")),
  };
}

export function readLampViews(raw: unknown): LampView[] {
  if (!Array.isArray(raw)) return [];
  const out: LampView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addLampView(views: readonly LampView[], view: LampView): LampView[] {
  const current = readLampViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropLampView(views: readonly LampView[], id: string): LampView[] {
  return readLampViews(views).filter((view) => view.id !== id);
}

function letterBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 48);
}

function letterText(value: LetterValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: letterBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (LETTER_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("email" in value)) return { text: null, explicit: false };
  const inner = value.email;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: letterBody(inner), explicit: true };
}

export function letterState(value: LetterValue): LetterState {
  const found = letterText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function letterCopy(value: LetterValue): string {
  const found = letterText(value);
  if (!found.text) return "";
  return found.text;
}

function localPart(text: string): string {
  const at = text.indexOf("@");
  return at < 0 ? text : text.slice(0, at);
}

function hostPart(text: string): string {
  const at = text.indexOf("@");
  return at < 0 ? "" : text.slice(at + 1);
}

function firstLetter(text: string): string {
  const found = text.match(/[a-z]/i);
  return found ? found[0].toUpperCase() : "";
}

function lastLetter(text: string): string {
  const found = text.match(/[a-z]/gi);
  if (!found || !found.length) return "";
  return found[found.length - 1].toUpperCase();
}

/** A crest keeps the first letter of the name and the first letter of the host. Digits are skipped. */
export function letterOf(value: LetterValue): string {
  const text = letterCopy(value);
  if (!text) return "";
  if (text.includes("@")) {
    const left = firstLetter(localPart(text));
    const right = firstLetter(hostPart(text));
    if (!left || !right) return left || right;
    return left + right;
  }
  const left = firstLetter(text);
  const right = lastLetter(text);
  if (!left || !right) return "";
  if (text.replace(/[^a-z]/gi, "").length === 1) return left;
  return left + right;
}

/** A name of 1 to 3 marks is brief. Five marks are even. Eight or more are long. Any other mark is plain. */
export function letterBand(value: LetterValue): LetterBand {
  const text = letterCopy(value);
  if (!text || !letterOf(value)) return "";
  if (!text.includes("@")) return "plain";
  const size = localPart(text).length;
  if (size <= 3) return "brief";
  if (size === 5) return "even";
  if (size >= 8) return "long";
  return "plain";
}

/** A host ending in com is gilt. net is ink. org is ivory. Every other marked note is plain. */
export function letterTone(value: LetterValue): LetterTone {
  const text = letterCopy(value);
  if (!text || !letterOf(value)) return "";
  const host = hostPart(text);
  if (!host) return "plain";
  const tld = host.split(".").filter(Boolean).pop() || "";
  if (tld === "com") return "gilt";
  if (tld === "net") return "ink";
  if (tld === "org") return "ivory";
  return "plain";
}

/** ada@7fx.com, bea@desk.net, and cal@house.org are the house catalog. Any other note is not. */
export function catalogLetter(value: LetterValue): boolean {
  return CATALOG.has(letterCopy(value));
}

export function catalogLetterCount(rows: readonly LetterRow[]): number {
  return rows.filter((row) => catalogLetter(row.note)).length;
}

export function wideLetterCount(rows: readonly LetterRow[]): number {
  return rows.filter((row) => localPart(letterCopy(row.note)).length > 8).length;
}

export function giltLetterCount(rows: readonly LetterRow[]): number {
  return rows.filter((row) => letterTone(row.note) === "gilt").length;
}

/** Customers whose host is shared with at least one other customer. */
export function sharedLetterCount(rows: readonly LetterRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const host = hostPart(letterCopy(row.note));
    if (!host) continue;
    groups.set(host, (groups.get(host) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function letterBands(rows: readonly LetterRow[]): LetterBandLine[] {
  return LETTER_BANDS.map((band) => ({ band, count: rows.filter((row) => letterBand(row.note) === band).length }));
}

/** The band with the most set crests. A tie keeps brief, then even, then long, then plain. */
export function leadingLetter(rows: readonly LetterRow[]): string {
  const lines = letterBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LETTER_BANDS.indexOf(a.band as (typeof LETTER_BANDS)[number]) - LETTER_BANDS.indexOf(b.band as (typeof LETTER_BANDS)[number]))[0].band;
}

/** The tone with the most set crests. A tie keeps gilt, then ink, then ivory, then plain. */
export function leadingLetterTone(rows: readonly LetterRow[]): string {
  const counts = TONES.map((tone) => ({ tone, count: rows.filter((row) => letterTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  return live.slice().sort((a, b) => b.count - a.count || TONES.indexOf(a.tone) - TONES.indexOf(b.tone))[0].tone;
}

export function letterShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentLetters(rows: readonly LetterRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = letterState(row.note);
    const band = state === "set" ? letterBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenLetters(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedLetters(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleLetter(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleLetterReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLetterReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLetterBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleLetterCustomers(
  rows: readonly LetterRow[],
  band: LetterBand | "blank" | null,
  tone: LetterTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: LetterShape,
): LetterRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = letterState(row.note);
    const mark = state === "set" ? letterBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && letterTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogLetter(row.note)) return false;
    if (shape === "wide" && localPart(letterCopy(row.note)).length <= 8) return false;
    if (shape === "gilt" && letterTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${letterCopy(row.note)} ${letterOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeLetterBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeLetterTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "plain" ? raw : "all";
}

export function letterBandArg(filter: string): LetterBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "brief" || filter === "even" || filter === "long" || filter === "plain") return filter;
  return null;
}

export function letterToneArg(filter: string): LetterTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "plain") return filter;
  return null;
}

export function lettersCsv(rows: readonly LetterRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of letterBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogLetterCount(rows)}`);
  lines.push(`wide,wide,${wideLetterCount(rows)}`);
  lines.push(`tone,gilt,${giltLetterCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => letterTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => letterTone(row.note) === "ivory").length}`);
  lines.push(`tone,plain,${rows.filter((row) => letterTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedLetterCount(rows)}`);
  return lines.join("\n");
}

export function letterRowsCsv(rows: readonly LetterRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,crest,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = letterState(row.note);
    const band = state === "set" ? letterBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      letterOf(row.note),
      band,
      state === "set" ? letterTone(row.note) : "",
      catalogLetter(row.note) ? "1" : "0",
      localPart(letterCopy(row.note)).length > 8 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
