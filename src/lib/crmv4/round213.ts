/**
 * Narthex candles for the follow-up desk, and address plates already stored as address on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_narthex_candle (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   hour integer,
 *   wax text not null default '',
 *   tone text not null default '',
 *   wick integer,
 *   drip integer not null default 0,
 *   marks text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_address_plate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_address_plate_review (
 *   customer_id text primary key
 * );
 */

export const NXC_KEY = "crmv4-narthex-candle";
export const NXC_VIEW_KEY = "crmv4-narthex-views";
export const NXC_DENSITY_KEY = "crmv4-narthex-density";
export const ADR_KEY = "crmv4-address-plate-hide";
export const ADR_REVIEW_KEY = "crmv4-address-plate-review";

export type WaxName = "blank" | "tallow" | "bees" | "gilt";

export type ToneName = "blank" | "hush" | "ring" | "strike";

export type CandleTray = "open" | "held" | "closed";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type CandleDensity = "tall" | "low";

export type CandleSort = "hour" | "keeper";

export type NarthexCandle = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  hour: number | null;
  wax: string;
  tone: string;
  wick: number | null;
  drip: number;
  marks: string[];
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type CandleView = {
  id: string;
  name: string;
  tray: CandleTray;
  query: string;
  keeper: string;
  wax: string;
  tone: string;
  hour: string;
  wick: string;
  drip: string;
};

export type CandleCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  drip: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "tone", "pin", "unpin", "hold", "lift", "close", "open", "wax", "mark", "drip", "wick"] as const;

const WAXES = ["tallow", "bees", "gilt"] as const;

const TONES = ["hush", "ring", "strike"] as const;

const TONE_ORDER = ["", "hush", "ring", "strike"] as const;

const PEAK_HOURS = new Set([4, 8]);

const QUIET_HOURS = new Set([1, 2]);

const HOUSE = new Set(["BEES", "GILT"]);

const CANDLE_CAP = 8;

const VIEW_CAP = 6;

const MARK_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CandleTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function waxName(raw: unknown): Exclude<WaxName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WAXES as readonly string[]).includes(text) ? (text as Exclude<WaxName, "blank">) : "";
}

function toneNameOf(raw: unknown): Exclude<ToneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<ToneName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function candleLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function candleNote(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A wax is TALLOW, BEES, or GILT. Anything else stays blank. Letters are stored in capitals. */
export function waxOf(raw: unknown): string {
  const name = waxName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An hour is an integer from 1 through 8.
 * A blank value stays unset. 0 is not an hour.
 * A second digit is not an hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A wick is 4, 8, or 16. A blank value stays unset. A leading zero is not a wick. */
export function wickOf(raw: unknown): 4 | 8 | 16 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  if (raw === 16 || raw === "16") return 16;
  const text = clip(raw, 2);
  if (text === "4") return 4;
  if (text === "8") return 8;
  if (text === "16") return 16;
  return null;
}

/** Drip is 0, 2, or 6. Anything else is not drip. 0 clears the drip. */
export function dripOf(raw: unknown): 0 | 2 | 6 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak hours are 4 and 8. An unset hour is not a peak hour. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 1 and 2. A peak hour is not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * How far an hour sits behind the desk hour.
 * A positive gap means the candle is behind. A negative gap means it is ahead.
 * A gap of zero means the same hour. An unset hour has no gap. Hours do not wrap.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** BEES and GILT are house waxes. TALLOW is a guest wax. A blank wax is not a house wax. */
export function houseWax(wax: unknown): boolean {
  return HOUSE.has(waxOf(wax));
}

/** Tall or low. Anything else stays tall. */
export function densityOf(raw: unknown): CandleDensity {
  return raw === "low" ? "low" : "tall";
}

/** Hour or keeper. Anything else stays on the hour. */
export function sortMode(raw: unknown): CandleSort {
  return raw === "keeper" ? "keeper" : "hour";
}

function markOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-f]$/.test(text) ? text : "";
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

function readOne(raw: unknown): NarthexCandle | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<NarthexCandle>;
  const id = clip(row.id, 24);
  const title = candleLine(row.title);
  if (!id || !title) return null;
  const drip = dripOf(row.drip);
  return {
    id,
    title,
    note: candleNote(row.note),
    keeper: keeperLabel(row.keeper),
    hour: hourOf(row.hour),
    wax: waxOf(row.wax),
    tone: toneNameOf(row.tone),
    wick: wickOf(row.wick),
    drip: drip === null ? 0 : drip,
    marks: marksOf(row.marks),
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readCandles(raw: unknown): NarthexCandle[] {
  if (!Array.isArray(raw)) return [];
  const out: NarthexCandle[] = [];
  for (const item of raw) {
    const candle = readOne(item);
    if (!candle || out.some((row) => row.id === candle.id || row.title === candle.title)) continue;
    out.push(candle);
  }
  return out.slice(0, CANDLE_CAP);
}

export function addCandle(
  candles: readonly NarthexCandle[],
  candle: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    hour?: unknown;
    wax?: string;
    tone?: string;
    wick?: unknown;
    drip?: unknown;
    marks?: unknown;
  },
): NarthexCandle[] {
  const current = readCandles(candles);
  const id = String(candle.id || "").trim();
  const title = candleLine(candle.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const drip = dripOf(candle.drip);
  const next: NarthexCandle = {
    id,
    title,
    note: candleNote(candle.note),
    keeper: keeperLabel(candle.keeper),
    hour: hourOf(candle.hour),
    wax: waxOf(candle.wax),
    tone: toneNameOf(candle.tone),
    wick: wickOf(candle.wick),
    drip: drip === null ? 0 : drip,
    marks: marksOf(candle.marks),
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CANDLE_CAP);
}

export function cycleTone(candles: readonly NarthexCandle[], id: string): NarthexCandle[] {
  return readCandles(candles).map((candle) => {
    if (candle.id !== id) return candle;
    const at = TONE_ORDER.indexOf(candle.tone as (typeof TONE_ORDER)[number]);
    const next = at < 0 || at >= TONES.length ? TONES[0] : TONES[at % TONES.length];
    if (!next || next === candle.tone) return candle;
    return { ...candle, tone: next, audit: "tone" };
  });
}

/** A blank title is left as it is. */
export function editCandle(candles: readonly NarthexCandle[], id: string, title: unknown): NarthexCandle[] {
  const next = candleLine(title);
  if (!next) return readCandles(candles);
  const current = readCandles(candles);
  if (current.some((candle) => candle.id !== id && candle.title === next)) return current;
  return current.map((candle) => (candle.id === id && candle.title !== next ? { ...candle, title: next, audit: "edit" } : candle));
}

/** A blank note is left as it is. */
export function editCandleNote(candles: readonly NarthexCandle[], id: string, note: unknown): NarthexCandle[] {
  const next = candleNote(note);
  if (!next) return readCandles(candles);
  return readCandles(candles).map((candle) => (candle.id === id && candle.note !== next ? { ...candle, note: next, audit: "edit" } : candle));
}

/** A mark that is already on the candle, or a fourth mark, is left out. A mark is one letter from a to f. */
export function addCandleMark(candles: readonly NarthexCandle[], id: string, mark: unknown): NarthexCandle[] {
  const next = markOf(mark);
  if (!next) return readCandles(candles);
  return readCandles(candles).map((candle) => {
    if (candle.id !== id || candle.marks.includes(next) || candle.marks.length >= MARK_CAP) return candle;
    return { ...candle, marks: [...candle.marks, next], audit: "mark" };
  });
}

/** An unknown drip is left as it is. 0 clears the drip. */
export function setCandleDrip(candles: readonly NarthexCandle[], id: string, drip: unknown): NarthexCandle[] {
  const next = dripOf(drip);
  if (next === null) return readCandles(candles);
  return readCandles(candles).map((candle) => (candle.id === id && candle.drip !== next ? { ...candle, drip: next, audit: "drip" } : candle));
}

/** A short wick becomes 8, a measured wick becomes 16, and a long wick stays. An unset wick becomes 4. */
export function snoozeCandle(candles: readonly NarthexCandle[], id: string): NarthexCandle[] {
  return readCandles(candles).map((candle) => {
    if (candle.id !== id) return candle;
    const next = candle.wick === 4 ? 8 : candle.wick === 8 ? 16 : candle.wick === 16 ? 16 : 4;
    if (next === candle.wick) return candle;
    return { ...candle, wick: next, audit: "wick" };
  });
}

export function setCandlePin(candles: readonly NarthexCandle[], id: string, pinned: boolean): NarthexCandle[] {
  return readCandles(candles).map((candle) => (candle.id === id && candle.pinned !== pinned ? { ...candle, pinned, audit: pinned ? "pin" : "unpin" } : candle));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(candles: readonly NarthexCandle[], shownIds: readonly string[], index: number): NarthexCandle[] {
  if (!shownIds.length) return readCandles(candles);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCandles(candles).find((candle) => candle.id === id);
  if (!row) return readCandles(candles);
  return setCandlePin(candles, id, !row.pinned);
}

/** W lengthens the wick on the focused candle. */
export function snoozeFocused(candles: readonly NarthexCandle[], shownIds: readonly string[], index: number): NarthexCandle[] {
  if (!shownIds.length) return readCandles(candles);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readCandles(candles).some((candle) => candle.id === id)) return readCandles(candles);
  return snoozeCandle(candles, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(candles: readonly NarthexCandle[], shownIds: readonly string[], index: number): NarthexCandle[] {
  if (!shownIds.length) return readCandles(candles);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCandles(candles).find((candle) => candle.id === id);
  if (!row) return readCandles(candles);
  return setCandleHold(candles, id, !row.held);
}

export function setCandleHold(candles: readonly NarthexCandle[], id: string, held: boolean): NarthexCandle[] {
  return readCandles(candles).map((candle) => (candle.id === id && candle.held !== held ? { ...candle, held, audit: held ? "hold" : "lift" } : candle));
}

export function setCandleClose(candles: readonly NarthexCandle[], id: string, closed: boolean): NarthexCandle[] {
  return readCandles(candles).map((candle) => (candle.id === id && candle.closed !== closed ? { ...candle, closed, audit: closed ? "close" : "open" } : candle));
}

export function bulkCandleWax(candles: readonly NarthexCandle[], ids: readonly string[], wax: unknown): NarthexCandle[] {
  const next = waxOf(wax);
  if (!next) return readCandles(candles);
  const picked = new Set(ids);
  return readCandles(candles).map((candle) => (picked.has(candle.id) && candle.wax !== next ? { ...candle, wax: next, audit: "wax" } : candle));
}

export function bulkCandlePin(candles: readonly NarthexCandle[], ids: readonly string[], pinned: boolean): NarthexCandle[] {
  const picked = new Set(ids);
  return readCandles(candles).map((candle) => (picked.has(candle.id) && candle.pinned !== pinned ? { ...candle, pinned, audit: pinned ? "pin" : "unpin" } : candle));
}

export function bulkCandleClose(candles: readonly NarthexCandle[], ids: readonly string[], closed: boolean): NarthexCandle[] {
  const picked = new Set(ids);
  return readCandles(candles).map((candle) => (picked.has(candle.id) && candle.closed !== closed ? { ...candle, closed, audit: closed ? "close" : "open" } : candle));
}

export function bulkCandleTone(candles: readonly NarthexCandle[], ids: readonly string[], tone: unknown): NarthexCandle[] {
  const next = toneNameOf(tone);
  if (!next) return readCandles(candles);
  const picked = new Set(ids);
  return readCandles(candles).map((candle) => (picked.has(candle.id) && candle.tone !== next ? { ...candle, tone: next, audit: "tone" } : candle));
}

export function bulkCandleMark(candles: readonly NarthexCandle[], ids: readonly string[], mark: unknown): NarthexCandle[] {
  return ids.reduce((rows, id) => addCandleMark(rows, id, mark), readCandles(candles));
}

export function resetCandles(): NarthexCandle[] {
  return [];
}

function inTray(candle: NarthexCandle, tray: CandleTray): boolean {
  if (tray === "closed") return candle.closed;
  if (tray === "held") return candle.held && !candle.closed;
  return !candle.held && !candle.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open candle whose hour sits more than two hours behind the desk. Drip, a hold, or a close is not late. */
export function lateCandle(candle: NarthexCandle, desk: unknown): boolean {
  const gap = hourGap(candle.hour, desk);
  return inTray(candle, "open") && candle.drip === 0 && gap !== null && gap > 2;
}

/** An open candle with a wick of 4 is due now. Drip, a hold, or a close is not. */
export function soonCandle(candle: NarthexCandle): boolean {
  return inTray(candle, "open") && candle.drip === 0 && candle.wick === 4;
}

/** Open candles that are late or due now. A dripping candle stays off the reminder list. */
export function reminderCandles(candles: readonly NarthexCandle[], desk: unknown): NarthexCandle[] {
  return readCandles(candles).filter((candle) => lateCandle(candle, desk) || soonCandle(candle));
}

/** Open candles whose hour sits within two hours of the desk. Drip, a hold, or a close stays out. */
export function windowCandles(candles: readonly NarthexCandle[], desk: unknown): NarthexCandle[] {
  return readCandles(candles).filter((candle) => {
    const gap = hourGap(candle.hour, desk);
    return inTray(candle, "open") && candle.drip === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Open dry candles whose hour is the desk hour. */
export function matchedCandles(candles: readonly NarthexCandle[], desk: unknown): number {
  const at = hourOf(desk);
  if (at === null) return 0;
  return readCandles(candles).filter((candle) => inTray(candle, "open") && candle.drip === 0 && candle.hour === at).length;
}

/** Search matches the title, the note, the keeper, and the marks. */
export function visibleCandles(
  candles: readonly NarthexCandle[],
  tray: CandleTray,
  query: string,
  keeper: string | null,
  wax: string | null,
  tone: string | null,
  exact: number | null,
  pick: HourPick | null,
  wick: number | "blank" | null,
  drip: number | "blank" | null,
  strikeOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  dryOnly: boolean,
): NarthexCandle[] {
  const text = query.trim().toLowerCase();
  return readCandles(candles).filter((candle) => {
    if (!inTray(candle, tray)) return false;
    if (text) {
      const hay = `${candle.title} ${candle.note} ${candle.keeper} ${candle.marks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && candle.keeper !== keeper) return false;
    if (wax === "blank" ? Boolean(candle.wax) : wax && candle.wax !== wax) return false;
    if (tone === "blank" ? Boolean(candle.tone) : tone && candle.tone !== tone) return false;
    if (!hourHit(candle.hour, exact, pick)) return false;
    if (wick === "blank" ? candle.wick !== null : wick !== null && candle.wick !== wick) return false;
    if (drip === "blank" ? candle.drip !== 0 : drip !== null && candle.drip !== drip) return false;
    if (strikeOnly && candle.tone !== "strike") return false;
    if (peakOnly && !peakHour(candle.hour)) return false;
    if (houseOnly && !houseWax(candle.wax)) return false;
    if (quietOnly && !quietHour(candle.hour)) return false;
    if (dryOnly && candle.drip !== 0) return false;
    return true;
  });
}

export function sortCandles(candles: readonly NarthexCandle[], mode: CandleSort): NarthexCandle[] {
  const rows = candles.slice();
  if (mode === "keeper") return rows.sort((a, b) => a.keeper.localeCompare(b.keeper) || (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function candleLedger(candles: readonly NarthexCandle[], query: string): NarthexCandle[] {
  const text = query.trim().toLowerCase();
  return sortCandles(
    readCandles(candles).filter((candle) => candle.hour !== null && (!text || candle.title.toLowerCase().includes(text))),
    "hour",
  );
}

export function candleCounts(candles: readonly NarthexCandle[], desk: unknown): CandleCounts {
  const rows = readCandles(candles);
  return {
    open: rows.filter((candle) => inTray(candle, "open")).length,
    held: rows.filter((candle) => inTray(candle, "held")).length,
    closed: rows.filter((candle) => inTray(candle, "closed")).length,
    pinned: rows.filter((candle) => candle.pinned).length,
    peak: rows.filter((candle) => inTray(candle, "open") && candle.drip === 0 && peakHour(candle.hour)).length,
    late: rows.filter((candle) => lateCandle(candle, desk)).length,
    soon: rows.filter((candle) => soonCandle(candle)).length,
    drip: rows.filter((candle) => inTray(candle, "open") && candle.drip > 0).length,
    house: rows.filter((candle) => inTray(candle, "open") && houseWax(candle.wax)).length,
    window: windowCandles(rows, desk).length,
    matched: matchedCandles(rows, desk),
  };
}

export function candleShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open candles as a share of every open candle. */
export function lateShare(candles: readonly NarthexCandle[], desk: unknown): number {
  const rows = readCandles(candles);
  const open = rows.filter((candle) => inTray(candle, "open")).length;
  const late = rows.filter((candle) => lateCandle(candle, desk)).length;
  return candleShare(late, open);
}

/** Distinct hours on open candles. */
export function usedHours(candles: readonly NarthexCandle[]): number {
  const hours = new Set<number>();
  for (const candle of readCandles(candles)) {
    if (inTray(candle, "open") && candle.hour !== null) hours.add(candle.hour);
  }
  return hours.size;
}

/** Open candles that share an hour and a wax. A different wax on the same hour is not a clash. */
export function clashHourCount(candles: readonly NarthexCandle[]): number {
  const groups = new Map<string, number>();
  for (const candle of readCandles(candles)) {
    if (!inTray(candle, "open") || candle.hour === null || !candle.wax) continue;
    const key = `${candle.hour}:${candle.wax}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open candles that share a wick. An unset wick is not a clash. */
export function wickClashCount(candles: readonly NarthexCandle[]): number {
  const groups = new Map<number, number>();
  for (const candle of readCandles(candles)) {
    if (!inTray(candle, "open") || candle.wick === null) continue;
    groups.set(candle.wick, (groups.get(candle.wick) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open candles in the same wax whose hours differ by three.
 * The count is the candles that have at least one neighbor.
 */
export function adjacentCandleCount(candles: readonly NarthexCandle[]): number {
  const open = readCandles(candles).filter((candle) => inTray(candle, "open") && candle.hour !== null && candle.wax);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.wax === right.wax && Math.abs((left.hour ?? 0) - (right.hour ?? 0)) === 3) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The wax with the fewest open candles.
 * A tie keeps TALLOW, then BEES, then GILT.
 * An empty desk still suggests TALLOW.
 */
export function suggestWax(candles: readonly NarthexCandle[]): "TALLOW" | "BEES" | "GILT" {
  const rows = readCandles(candles).filter((candle) => inTray(candle, "open"));
  const order = ["TALLOW", "BEES", "GILT"] as const;
  let best: "TALLOW" | "BEES" | "GILT" = "TALLOW";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wax of order) {
    const count = rows.filter((candle) => candle.wax === wax).length;
    if (count < bestCount) {
      best = wax;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The wick with the fewest open candles.
 * A tie keeps 8, then 4, then 16.
 * An empty desk still suggests 8.
 */
export function suggestWick(candles: readonly NarthexCandle[]): 4 | 8 | 16 {
  const rows = readCandles(candles).filter((candle) => inTray(candle, "open"));
  const order = [8, 4, 16] as const;
  let best: 4 | 8 | 16 = 8;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wick of order) {
    const count = rows.filter((candle) => candle.wick === wick).length;
    if (count < bestCount) {
      best = wick;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open keeper. A blank keeper is skipped. An empty desk stays blank. */
export function suggestKeeper(candles: readonly NarthexCandle[]): string {
  const found = readCandles(candles).find((candle) => inTray(candle, "open") && candle.keeper);
  return found ? found.keeper : "";
}

/**
 * The keeper carrying the fewest open candles.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty roster falls back to the newest keeper.
 */
export function fairKeeper(candles: readonly NarthexCandle[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(candles);
  const open = readCandles(candles).filter((candle) => inTray(candle, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((candle) => candle.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open candles. A tie keeps the newer name on the desk. */
export function busiestKeeper(candles: readonly NarthexCandle[]): string {
  const rows = readCandles(candles).filter((candle) => inTray(candle, "open") && candle.keeper);
  const names: string[] = [];
  for (const candle of rows) if (!names.includes(candle.keeper)) names.push(candle.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((candle) => candle.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function candleKeepers(candles: readonly NarthexCandle[]): string[] {
  const out: string[] = [];
  for (const candle of readCandles(candles)) {
    if (candle.keeper && !out.includes(candle.keeper)) out.push(candle.keeper);
  }
  return out;
}

export function candleWaxes(candles: readonly NarthexCandle[]): string[] {
  const out: string[] = [];
  for (const candle of readCandles(candles)) {
    if (candle.wax && !out.includes(candle.wax)) out.push(candle.wax);
  }
  return out;
}

/** Open candles whose keeper also keeps another open candle on a different hour. */
export function pairKeeperCount(candles: readonly NarthexCandle[]): number {
  const open = readCandles(candles).filter((candle) => inTray(candle, "open") && candle.keeper && candle.hour !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].keeper === open[j].keeper && open[i].hour !== open[j].hour) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open candles that share a wax on different hours. */
export function sharedWaxCount(candles: readonly NarthexCandle[]): number {
  const open = readCandles(candles).filter((candle) => inTray(candle, "open") && candle.wax && candle.hour !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].wax === open[j].wax && open[i].hour !== open[j].hour) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The drip weight of open candles. A clear drip adds nothing. */
export function dripLoad(candles: readonly NarthexCandle[]): number {
  return readCandles(candles).filter((candle) => inTray(candle, "open")).reduce((sum, candle) => sum + candle.drip, 0);
}

/** Open candles that are both a quiet hour and a house wax. */
export function quietHouseCount(candles: readonly NarthexCandle[]): number {
  return readCandles(candles).filter((candle) => inTray(candle, "open") && quietHour(candle.hour) && houseWax(candle.wax)).length;
}

/** Open candles whose tone is strike. */
export function strikeLoad(candles: readonly NarthexCandle[]): number {
  return readCandles(candles).filter((candle) => inTray(candle, "open") && candle.tone === "strike").length;
}

/** The span from the lowest open hour to the highest. Fewer than two hours spans nothing. */
export function hourSpan(candles: readonly NarthexCandle[]): number {
  const hours = readCandles(candles).filter((candle) => inTray(candle, "open") && candle.hour !== null).map((candle) => candle.hour as number);
  if (hours.length < 2) return 0;
  return Math.max(...hours) - Math.min(...hours);
}

/**
 * The next open candle at or after the desk hour.
 * A strike tone, drip, a hold, and a close stay off the list.
 * When every open hour is behind, the earliest hour is next.
 */
export function nextCandle(candles: readonly NarthexCandle[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readCandles(candles).filter((candle) => inTray(candle, "open") && candle.hour !== null && candle.tone !== "strike" && candle.drip === 0);
  if (!waiting.length) return "";
  const byHour = (a: NarthexCandle, b: NarthexCandle) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((candle) => (candle.hour ?? 0) >= now).sort(byHour);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byHour)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function candleCopy(candle: NarthexCandle, desk: unknown): string {
  const gap = hourGap(candle.hour, desk);
  return [candle.title, candle.keeper, candle.hour ?? "", candle.wax, candle.tone, candle.wick ?? "", candle.drip, candle.marks.join(" "), candle.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the candles saved in this browser. The gap and the late mark use the hour you pass. */
export function candlesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,hour,wax,tone,wick,drip,marks,pinned,held,closed,gap,late,soon,house,window,matched,note,audit"];
  const rows = readCandles(raw);
  const windowIds = new Set(windowCandles(rows, desk).map((candle) => candle.id));
  const at = hourOf(desk);
  for (const candle of rows) {
    const gap = hourGap(candle.hour, desk);
    lines.push([
      candle.title,
      candle.keeper,
      candle.hour === null ? "" : String(candle.hour),
      candle.wax,
      candle.tone,
      candle.wick === null ? "" : String(candle.wick),
      String(candle.drip),
      candle.marks.join(" "),
      candle.pinned ? "1" : "0",
      candle.held ? "1" : "0",
      candle.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCandle(candle, desk) ? "1" : "0",
      soonCandle(candle) ? "1" : "0",
      houseWax(candle.wax) ? "1" : "0",
      windowIds.has(candle.id) ? "1" : "0",
      at !== null && candle.hour === at && candle.drip === 0 && inTray(candle, "open") ? "1" : "0",
      candle.note,
      candle.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return keepers.includes(raw) ? raw : "all";
}

export function activeWax(raw: string, waxes: readonly string[]): string {
  if (raw === "blank") return "blank";
  return waxOf(raw) && waxes.includes(waxOf(raw)) ? waxOf(raw) : "all";
}

export function activeTone(raw: string, tones: readonly string[]): string {
  if (raw === "blank") return "blank";
  const tone = toneNameOf(raw);
  return tone && tones.includes(tone) ? tone : "all";
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

export function activeDrip(raw: string): string {
  if (raw === "blank") return "blank";
  const drip = dripOf(raw);
  return drip === null ? "all" : String(drip);
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function waxArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return waxOf(filter) || null;
}

export function toneArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return toneNameOf(filter) || null;
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

export function dripArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return dripOf(filter);
}

function readView(raw: unknown): CandleView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CandleView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    keeper: row.keeper === "blank" ? "blank" : clip(row.keeper, 18) || "all",
    wax: row.wax === "blank" || row.wax === "all" ? (row.wax === "blank" ? "blank" : "all") : waxOf(row.wax) || "all",
    tone: row.tone === "blank" || row.tone === "all" ? (row.tone === "blank" ? "blank" : "all") : toneNameOf(row.tone) || "all",
    hour: activeHour(String(row.hour || "all")),
    wick: activeWick(String(row.wick || "all")),
    drip: activeDrip(String(row.drip || "all")),
  };
}

export function readCandleViews(raw: unknown): CandleView[] {
  if (!Array.isArray(raw)) return [];
  const out: CandleView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addCandleView(views: readonly CandleView[], view: CandleView): CandleView[] {
  const current = readCandleViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCandleView(views: readonly CandleView[], id: string): CandleView[] {
  return readCandleViews(views).filter((view) => view.id !== id);
}

export type PlateState = "" | "set" | "clear";

export type PlateLane = "" | "west" | "center" | "east";

export type PlateTone = "" | "gilt" | "ink" | "ivory" | "mist" | "plain";

export type PlateShape = "all" | "catalog" | "wide" | "gilt";

export type PlateValue =
  | string
  | { address?: unknown; language?: unknown; lastOs?: unknown; lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; city?: unknown; desk?: unknown; name?: unknown; country?: unknown }
  | null
  | undefined;

export type PlateRow = { id: string; label?: string; note: PlateValue };

export type PlateLaneLine = { lane: string; count: number };

const PLATE_LANES = ["west", "center", "east"] as const;

const PLATE_TONES = ["gilt", "ink", "ivory", "mist", "plain"] as const;

const CATALOG = ["palace", "gallery", "atelier", "quay", "cloister"] as const;

const PLATE_BLOCK = ["language", "lastOs", "lastDevice", "lastUserAgent", "lastIp", "timezone", "username", "phone", "city", "desk", "name", "email", "country"] as const;

function plateLetters(raw: unknown): string {
  return clip(raw, 48).toLowerCase().replace(/[^a-z]/g, "");
}

function plateText(value: PlateValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: plateLetters(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (PLATE_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("address" in value)) return { text: null, explicit: false };
  const inner = value.address;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: plateLetters(inner), explicit: true };
}

export function plateState(value: PlateValue): PlateState {
  const found = plateText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function plateCopy(value: PlateValue): string {
  const found = plateText(value);
  if (!found.text) return "";
  return found.text;
}

/** A plate keeps the first three letters. A shorter name stays as long as it is. */
export function plateOf(value: PlateValue): string {
  const text = plateCopy(value);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

/** A through F is west. G through P is center. Q through Z is east. */
export function plateLane(value: PlateValue): PlateLane {
  const text = plateCopy(value);
  if (!text || !plateOf(value)) return "";
  const first = text[0];
  if (!first) return "";
  if (first <= "f") return "west";
  if (first <= "p") return "center";
  return "east";
}

/** Palace and quay are gilt. Gallery and atelier are ink. Cloister and nave are ivory. Lane and court are mist. */
export function plateTone(value: PlateValue): PlateTone {
  const text = plateCopy(value);
  if (!text || !plateOf(value)) return "";
  if (text.includes("palace") || text.includes("quay")) return "gilt";
  if (text.includes("gallery") || text.includes("atelier")) return "ink";
  if (text.includes("cloister") || text.includes("nave")) return "ivory";
  if (text.includes("lane") || text.includes("court")) return "mist";
  return "plain";
}

/** Palace, gallery, atelier, quay, and cloister are the house catalog, even inside a longer line. */
export function catalogPlate(value: PlateValue): boolean {
  const text = plateCopy(value);
  return CATALOG.some((word) => text.includes(word));
}

export function catalogPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => catalogPlate(row.note)).length;
}

export function widePlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateCopy(row.note).length > 16).length;
}

export function giltPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateTone(row.note) === "gilt").length;
}

/** Customers whose plate monogram is shared with at least one other customer. */
export function sharedPlateCount(rows: readonly PlateRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = plateOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function plateLanes(rows: readonly PlateRow[]): PlateLaneLine[] {
  return PLATE_LANES.map((lane) => ({ lane, count: rows.filter((row) => plateLane(row.note) === lane).length }));
}

/** The lane with the most set plates. A tie keeps west, then center, then east. */
export function leadingPlate(rows: readonly PlateRow[]): string {
  const lines = plateLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || PLATE_LANES.indexOf(a.lane as (typeof PLATE_LANES)[number]) - PLATE_LANES.indexOf(b.lane as (typeof PLATE_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set plates. A tie keeps gilt, then ink, then ivory, then mist, then plain. */
export function leadingPlateTone(rows: readonly PlateRow[]): string {
  const counts = PLATE_TONES.map((tone) => ({ tone, count: rows.filter((row) => plateTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || PLATE_TONES.indexOf(a.tone) - PLATE_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function plateShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentPlates(rows: readonly PlateRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = plateState(row.note);
    const lane = state === "set" ? plateLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenPlates(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedPlates(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function togglePlate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visiblePlateCustomers(
  rows: readonly PlateRow[],
  lane: PlateLane | "blank" | null,
  tone: PlateTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: PlateShape,
): PlateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = plateState(row.note);
    const mark = state === "set" ? plateLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && plateTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogPlate(row.note)) return false;
    if (shape === "wide" && plateCopy(row.note).length <= 16) return false;
    if (shape === "gilt" && plateTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${plateCopy(row.note)} ${plateOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activePlateLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activePlateTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" || raw === "plain" ? raw : "all";
}

export function plateLaneArg(filter: string): PlateLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "west" || filter === "center" || filter === "east") return filter;
  return null;
}

export function plateToneArg(filter: string): PlateTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist" || filter === "plain") return filter;
  return null;
}

export function platesCsv(rows: readonly PlateRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of plateLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogPlateCount(rows)}`);
  lines.push(`wide,wide,${widePlateCount(rows)}`);
  lines.push(`tone,gilt,${giltPlateCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => plateTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => plateTone(row.note) === "ivory").length}`);
  lines.push(`tone,mist,${rows.filter((row) => plateTone(row.note) === "mist").length}`);
  lines.push(`tone,plain,${rows.filter((row) => plateTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedPlateCount(rows)}`);
  return lines.join("\n");
}

export function plateRowsCsv(rows: readonly PlateRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,lane,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = plateState(row.note);
    const lane = state === "set" ? plateLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      plateOf(row.note),
      lane,
      state === "set" ? plateTone(row.note) : "",
      catalogPlate(row.note) ? "1" : "0",
      plateCopy(row.note).length > 16 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
