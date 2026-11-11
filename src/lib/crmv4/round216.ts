/**
 * Chapter slips for the access desk, and partner ribbons already stored as affiliateB on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_chapter_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   caller text not null default '',
 *   bay integer,
 *   cloth text not null default '',
 *   mark text not null default '',
 *   minutes integer,
 *   weight integer not null default 0,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_partner_ribbon_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_partner_ribbon_review (
 *   customer_id text primary key
 * );
 */

export const CHS_KEY = "crmv4-chapter-slip";
export const CHS_VIEW_KEY = "crmv4-chapter-views";
export const CHS_DENSITY_KEY = "crmv4-chapter-density";
export const PBR_KEY = "crmv4-partner-ribbon-hide";
export const PBR_REVIEW_KEY = "crmv4-partner-ribbon-review";

export type ClothName = "blank" | "linen" | "silk" | "wool";

export type MarkName = "blank" | "wait" | "keep" | "drop";

export type SlipTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SlipDensity = "tall" | "low";

export type SlipSort = "bay" | "caller";

export type ChapterSlip = {
  id: string;
  title: string;
  note: string;
  caller: string;
  bay: number | null;
  cloth: string;
  mark: string;
  minutes: number | null;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  caller: string;
  cloth: string;
  mark: string;
  bay: string;
  minutes: string;
  weight: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  weight: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "mark", "pin", "unpin", "hold", "resume", "archive", "open", "cloth", "tag", "weight", "minutes"] as const;

const CLOTHS = ["linen", "silk", "wool"] as const;

const MARKS = ["wait", "keep", "drop"] as const;

const MARK_CYCLE = ["wait", "keep", "drop"] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["SILK", "WOOL"]);

const SLIP_CAP = 8;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function markName(raw: unknown): Exclude<MarkName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (MARKS as readonly string[]).includes(text) ? (text as Exclude<MarkName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank caller stays blank. It is not filled in. */
export function callerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A cloth is LINEN, SILK, or WOOL. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bay.
 * A second digit other than the bay itself is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** Minutes are 15, 30, or 60. A blank value stays unset. A leading zero is not a span of minutes. */
export function minutesOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  const text = clip(raw, 2);
  if (text === "15") return 15;
  if (text === "30") return 30;
  if (text === "60") return 60;
  return null;
}

/** Weight is 0, 1, or 3. Anything else is not a weight. 0 clears the weight. */
export function weightOf(raw: unknown): 0 | 1 | 3 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak bays are 2 and 5. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 6. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the slip is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** SILK and WOOL are house cloths. LINEN is a guest cloth. A blank cloth is not a house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

/** Tall or low. Anything else stays tall. */
export function densityOf(raw: unknown): SlipDensity {
  return raw === "low" ? "low" : "tall";
}

/** Bay or caller. Anything else stays on the bay. */
export function sortMode(raw: unknown): SlipSort {
  return raw === "caller" ? "caller" : "bay";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-d]$/.test(text) ? text : "";
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

function readOne(raw: unknown): ChapterSlip | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ChapterSlip>;
  const id = clip(row.id, 24);
  const title = slipLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: slipNote(row.note),
    caller: callerLabel(row.caller),
    bay: bayOf(row.bay),
    cloth: clothOf(row.cloth),
    mark: markName(row.mark),
    minutes: minutesOf(row.minutes),
    weight: weight === null ? 0 : weight,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readSlips(raw: unknown): ChapterSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: ChapterSlip[] = [];
  for (const item of raw) {
    const slip = readOne(item);
    if (!slip || out.some((row) => row.id === slip.id || row.title === slip.title)) continue;
    out.push(slip);
  }
  return out.slice(0, SLIP_CAP);
}

export function addSlip(
  slips: readonly ChapterSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    caller?: string;
    bay?: unknown;
    cloth?: string;
    mark?: string;
    minutes?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): ChapterSlip[] {
  const current = readSlips(slips);
  const id = String(slip.id || "").trim();
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(slip.weight);
  const next: ChapterSlip = {
    id,
    title,
    note: slipNote(slip.note),
    caller: callerLabel(slip.caller),
    bay: bayOf(slip.bay),
    cloth: clothOf(slip.cloth),
    mark: markName(slip.mark),
    minutes: minutesOf(slip.minutes),
    weight: weight === null ? 0 : weight,
    tags: tagsOf(slip.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

/** A blank mark becomes wait, wait becomes keep, keep becomes drop, and drop returns to wait. */
export function cycleMark(slips: readonly ChapterSlip[], id: string): ChapterSlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const at = MARK_CYCLE.indexOf(slip.mark as (typeof MARK_CYCLE)[number]);
    const next = at < 0 ? MARK_CYCLE[0] : MARK_CYCLE[(at + 1) % MARK_CYCLE.length];
    if (!next || next === slip.mark) return slip;
    return { ...slip, mark: next, audit: "mark" };
  });
}

/** A blank title is left as it is. */
export function editSlip(slips: readonly ChapterSlip[], id: string, title: unknown): ChapterSlip[] {
  const next = slipLine(title);
  if (!next) return readSlips(slips);
  const current = readSlips(slips);
  if (current.some((slip) => slip.id !== id && slip.title === next)) return current;
  return current.map((slip) => (slip.id === id && slip.title !== next ? { ...slip, title: next, audit: "edit" } : slip));
}

/** A blank note is left as it is. */
export function editSlipNote(slips: readonly ChapterSlip[], id: string, note: unknown): ChapterSlip[] {
  const next = slipNote(note);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.note !== next ? { ...slip, note: next, audit: "edit" } : slip));
}

/** A tag that is already on the slip, or a third tag, is left out. A tag is one letter from a to d. */
export function addSlipTag(slips: readonly ChapterSlip[], id: string, tag: unknown): ChapterSlip[] {
  const next = tagOf(tag);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => {
    if (slip.id !== id || slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** An unknown weight is left as it is. 0 clears the weight. */
export function setSlipWeight(slips: readonly ChapterSlip[], id: string, weight: unknown): ChapterSlip[] {
  const next = weightOf(weight);
  if (next === null) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.weight !== next ? { ...slip, weight: next, audit: "weight" } : slip));
}

/** Fifteen minutes become 30, thirty minutes become 60, and sixty minutes stay. An unset span becomes 15. */
export function snoozeSlip(slips: readonly ChapterSlip[], id: string): ChapterSlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const next = slip.minutes === 15 ? 30 : slip.minutes === 30 ? 60 : slip.minutes === 60 ? 60 : 15;
    if (next === slip.minutes) return slip;
    return { ...slip, minutes: next, audit: "minutes" };
  });
}

export function setSlipPin(slips: readonly ChapterSlip[], id: string, pinned: boolean): ChapterSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(slips: readonly ChapterSlip[], shownIds: readonly string[], index: number): ChapterSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSlips(slips).find((slip) => slip.id === id);
  if (!row) return readSlips(slips);
  return setSlipPin(slips, id, !row.pinned);
}

/** M lengthens the minutes on the focused slip. */
export function snoozeFocused(slips: readonly ChapterSlip[], shownIds: readonly string[], index: number): ChapterSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readSlips(slips).some((slip) => slip.id === id)) return readSlips(slips);
  return snoozeSlip(slips, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(slips: readonly ChapterSlip[], shownIds: readonly string[], index: number): ChapterSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSlips(slips).find((slip) => slip.id === id);
  if (!row) return readSlips(slips);
  return setSlipHold(slips, id, !row.held);
}

/** R cycles the mark on the focused slip. */
export function markFocused(slips: readonly ChapterSlip[], shownIds: readonly string[], index: number): ChapterSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readSlips(slips).some((slip) => slip.id === id)) return readSlips(slips);
  return cycleMark(slips, id);
}

export function setSlipHold(slips: readonly ChapterSlip[], id: string, held: boolean): ChapterSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.held !== held ? { ...slip, held, audit: held ? "hold" : "resume" } : slip));
}

export function setSlipArchive(slips: readonly ChapterSlip[], id: string, archived: boolean): ChapterSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.archived !== archived ? { ...slip, archived, audit: archived ? "archive" : "open" } : slip));
}

export function bulkSlipCloth(slips: readonly ChapterSlip[], ids: readonly string[], cloth: unknown): ChapterSlip[] {
  const next = clothOf(cloth);
  if (!next) return readSlips(slips);
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.cloth !== next ? { ...slip, cloth: next, audit: "cloth" } : slip));
}

export function bulkSlipPin(slips: readonly ChapterSlip[], ids: readonly string[], pinned: boolean): ChapterSlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

export function bulkSlipArchive(slips: readonly ChapterSlip[], ids: readonly string[], archived: boolean): ChapterSlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.archived !== archived ? { ...slip, archived, audit: archived ? "archive" : "open" } : slip));
}

export function bulkSlipMark(slips: readonly ChapterSlip[], ids: readonly string[], mark: unknown): ChapterSlip[] {
  const next = markName(mark);
  if (!next) return readSlips(slips);
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.mark !== next ? { ...slip, mark: next, audit: "mark" } : slip));
}

export function bulkSlipTag(slips: readonly ChapterSlip[], ids: readonly string[], tag: unknown): ChapterSlip[] {
  return ids.reduce((rows, id) => addSlipTag(rows, id, tag), readSlips(slips));
}

export function resetSlips(): ChapterSlip[] {
  return [];
}

function inTray(slip: ChapterSlip, tray: SlipTray): boolean {
  if (tray === "archived") return slip.archived;
  if (tray === "held") return slip.held && !slip.archived;
  return !slip.held && !slip.archived;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** An open slip whose bay sits more than one bay behind the desk. Weight, a hold, or an archive is not late. */
export function lateSlip(slip: ChapterSlip, desk: unknown): boolean {
  const gap = bayGap(slip.bay, desk);
  return inTray(slip, "open") && slip.weight === 0 && gap !== null && gap > 1;
}

/** An open slip with 15 minutes is due now. Weight, a hold, or an archive is not. */
export function soonSlip(slip: ChapterSlip): boolean {
  return inTray(slip, "open") && slip.weight === 0 && slip.minutes === 15;
}

/** Open slips that are late or due now. A weighted slip stays off the reminder list. */
export function reminderSlips(slips: readonly ChapterSlip[], desk: unknown): ChapterSlip[] {
  return readSlips(slips).filter((slip) => lateSlip(slip, desk) || soonSlip(slip));
}

/** Open slips whose bay sits within one bay of the desk. Weight, a hold, or an archive stays out. */
export function windowSlips(slips: readonly ChapterSlip[], desk: unknown): ChapterSlip[] {
  return readSlips(slips).filter((slip) => {
    const gap = bayGap(slip.bay, desk);
    return inTray(slip, "open") && slip.weight === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Open light slips whose bay is the desk bay. */
export function matchedSlips(slips: readonly ChapterSlip[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readSlips(slips).filter((slip) => inTray(slip, "open") && slip.weight === 0 && slip.bay === at).length;
}

/** Search matches the title, the note, the caller, and the tags. */
export function visibleSlips(
  slips: readonly ChapterSlip[],
  tray: SlipTray,
  query: string,
  caller: string | null,
  cloth: string | null,
  mark: string | null,
  exact: number | null,
  pick: BayPick | null,
  minutes: number | "blank" | null,
  weight: number | "blank" | null,
  dropOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): ChapterSlip[] {
  const text = query.trim().toLowerCase();
  return readSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text) {
      const hay = `${slip.title} ${slip.note} ${slip.caller} ${slip.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (caller !== null && slip.caller !== caller) return false;
    if (cloth === "blank" ? Boolean(slip.cloth) : cloth && slip.cloth !== cloth) return false;
    if (mark === "blank" ? Boolean(slip.mark) : mark && slip.mark !== mark) return false;
    if (!bayHit(slip.bay, exact, pick)) return false;
    if (minutes === "blank" ? slip.minutes !== null : minutes !== null && slip.minutes !== minutes) return false;
    if (weight === "blank" ? slip.weight !== 0 : weight !== null && slip.weight !== weight) return false;
    if (dropOnly && slip.mark !== "drop") return false;
    if (peakOnly && !peakBay(slip.bay)) return false;
    if (houseOnly && !houseCloth(slip.cloth)) return false;
    if (quietOnly && !quietBay(slip.bay)) return false;
    if (lightOnly && slip.weight !== 0) return false;
    return true;
  });
}

export function sortSlips(slips: readonly ChapterSlip[], mode: SlipSort): ChapterSlip[] {
  const rows = slips.slice();
  if (mode === "caller") return rows.sort((a, b) => a.caller.localeCompare(b.caller) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function slipLedger(slips: readonly ChapterSlip[], query: string): ChapterSlip[] {
  const text = query.trim().toLowerCase();
  return sortSlips(
    readSlips(slips).filter((slip) => slip.bay !== null && (!text || slip.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function slipCounts(slips: readonly ChapterSlip[], desk: unknown): SlipCounts {
  const rows = readSlips(slips);
  return {
    open: rows.filter((slip) => inTray(slip, "open")).length,
    held: rows.filter((slip) => inTray(slip, "held")).length,
    archived: rows.filter((slip) => inTray(slip, "archived")).length,
    pinned: rows.filter((slip) => slip.pinned).length,
    peak: rows.filter((slip) => inTray(slip, "open") && slip.weight === 0 && peakBay(slip.bay)).length,
    late: rows.filter((slip) => lateSlip(slip, desk)).length,
    soon: rows.filter((slip) => soonSlip(slip)).length,
    weight: rows.filter((slip) => inTray(slip, "open") && slip.weight > 0).length,
    house: rows.filter((slip) => inTray(slip, "open") && houseCloth(slip.cloth)).length,
    window: windowSlips(rows, desk).length,
    matched: matchedSlips(rows, desk),
  };
}

export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateShare(slips: readonly ChapterSlip[], desk: unknown): number {
  const rows = readSlips(slips);
  const open = rows.filter((slip) => inTray(slip, "open")).length;
  const late = rows.filter((slip) => lateSlip(slip, desk)).length;
  return slipShare(late, open);
}

/** Distinct bays on open slips. */
export function usedBays(slips: readonly ChapterSlip[]): number {
  const bays = new Set<number>();
  for (const slip of readSlips(slips)) {
    if (inTray(slip, "open") && slip.bay !== null) bays.add(slip.bay);
  }
  return bays.size;
}

/** Open slips that share a bay and a cloth. A different cloth on the same bay is not a clash. */
export function clashBayCount(slips: readonly ChapterSlip[]): number {
  const groups = new Map<string, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.bay === null || !slip.cloth) continue;
    const key = `${slip.bay}:${slip.cloth}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open slips that share a span of minutes. An unset span is not a clash. */
export function minutesClashCount(slips: readonly ChapterSlip[]): number {
  const groups = new Map<number, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.minutes === null) continue;
    groups.set(slip.minutes, (groups.get(slip.minutes) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open slips in the same cloth whose bays differ by two.
 * The count is the slips that have at least one neighbor.
 */
export function adjacentSlipCount(slips: readonly ChapterSlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bay !== null && slip.cloth);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.cloth === right.cloth && Math.abs((left.bay ?? 0) - (right.bay ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The cloth with the fewest open slips.
 * A tie keeps SILK, then WOOL, then LINEN.
 * An empty desk still suggests SILK.
 */
export function suggestCloth(slips: readonly ChapterSlip[]): "SILK" | "WOOL" | "LINEN" {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = ["SILK", "WOOL", "LINEN"] as const;
  let best: "SILK" | "WOOL" | "LINEN" = "SILK";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((slip) => slip.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The minutes with the fewest open slips.
 * A tie keeps 30, then 15, then 60.
 * An empty desk still suggests 30.
 */
export function suggestMinutes(slips: readonly ChapterSlip[]): 15 | 30 | 60 {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = [30, 15, 60] as const;
  let best: 15 | 30 | 60 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const minutes of order) {
    const count = rows.filter((slip) => slip.minutes === minutes).length;
    if (count < bestCount) {
      best = minutes;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open caller. A blank caller is skipped. An empty desk stays blank. */
export function suggestCaller(slips: readonly ChapterSlip[]): string {
  const found = readSlips(slips).find((slip) => inTray(slip, "open") && slip.caller);
  return found ? found.caller : "";
}

/**
 * The caller carrying the fewest open slips.
 * A tie keeps the earlier name. A blank caller is not a load.
 * An empty roster falls back to the newest caller.
 */
export function fairCaller(slips: readonly ChapterSlip[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = callerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestCaller(slips);
  const open = readSlips(slips).filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.caller === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The caller with the most open slips. A tie keeps the newer name on the desk. */
export function busiestCaller(slips: readonly ChapterSlip[]): string {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.caller);
  const names: string[] = [];
  for (const slip of rows) if (!names.includes(slip.caller)) names.push(slip.caller);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((slip) => slip.caller === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function slipCallers(slips: readonly ChapterSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.caller && !out.includes(slip.caller)) out.push(slip.caller);
  }
  return out;
}

export function slipCloths(slips: readonly ChapterSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.cloth && !out.includes(slip.cloth)) out.push(slip.cloth);
  }
  return out;
}

/** Open slips whose caller also keeps another open slip on a different bay. */
export function pairCallerCount(slips: readonly ChapterSlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.caller && slip.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].caller === open[j].caller && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a cloth on different bays. */
export function sharedClothCount(slips: readonly ChapterSlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.cloth && slip.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].cloth === open[j].cloth && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The weight of open slips. A clear weight adds nothing. */
export function weightLoad(slips: readonly ChapterSlip[]): number {
  return readSlips(slips).filter((slip) => inTray(slip, "open")).reduce((sum, slip) => sum + slip.weight, 0);
}

/** Open slips that are both the quiet bay and a house cloth. */
export function quietHouseCount(slips: readonly ChapterSlip[]): number {
  return readSlips(slips).filter((slip) => inTray(slip, "open") && quietBay(slip.bay) && houseCloth(slip.cloth)).length;
}

/** Open slips whose mark is drop. */
export function dropLoad(slips: readonly ChapterSlip[]): number {
  return readSlips(slips).filter((slip) => inTray(slip, "open") && slip.mark === "drop").length;
}

/** The span from the lowest open bay to the highest. Fewer than two bays span nothing. */
export function baySpan(slips: readonly ChapterSlip[]): number {
  const bays = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bay !== null).map((slip) => slip.bay as number);
  if (bays.length < 2) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/**
 * The next open slip at or after the desk bay.
 * A drop mark, weight, a hold, and an archive stay off the list.
 * When every open bay is behind, the earliest bay is next.
 */
export function nextSlip(slips: readonly ChapterSlip[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bay !== null && slip.mark !== "drop" && slip.weight === 0);
  if (!waiting.length) return "";
  const byBay = (a: ChapterSlip, b: ChapterSlip) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((slip) => (slip.bay ?? 0) >= now).sort(byBay);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byBay)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function slipCopy(slip: ChapterSlip, desk: unknown): string {
  const gap = bayGap(slip.bay, desk);
  return [slip.title, slip.caller, slip.bay ?? "", slip.cloth, slip.mark, slip.minutes ?? "", slip.weight, slip.tags.join(" "), slip.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bay you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,caller,bay,cloth,mark,minutes,weight,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readSlips(raw);
  const windowIds = new Set(windowSlips(rows, desk).map((slip) => slip.id));
  const at = bayOf(desk);
  for (const slip of rows) {
    const gap = bayGap(slip.bay, desk);
    lines.push([
      slip.title,
      slip.caller,
      slip.bay === null ? "" : String(slip.bay),
      slip.cloth,
      slip.mark,
      slip.minutes === null ? "" : String(slip.minutes),
      String(slip.weight),
      slip.tags.join(" "),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, desk) ? "1" : "0",
      soonSlip(slip) ? "1" : "0",
      houseCloth(slip.cloth) ? "1" : "0",
      windowIds.has(slip.id) ? "1" : "0",
      at !== null && slip.bay === at && slip.weight === 0 && inTray(slip, "open") ? "1" : "0",
      slip.note,
      slip.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeCaller(raw: string, callers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return callers.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, cloths: readonly string[]): string {
  if (raw === "blank") return "blank";
  return clothOf(raw) && cloths.includes(clothOf(raw)) ? clothOf(raw) : "all";
}

export function activeMark(raw: string, marks: readonly string[]): string {
  if (raw === "blank") return "blank";
  const mark = markName(raw);
  return mark && marks.includes(mark) ? mark : "all";
}

export function activeBay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bay = bayOf(raw);
  return bay === null ? "all" : String(bay);
}

export function activeMinutes(raw: string): string {
  if (raw === "blank") return "blank";
  const minutes = minutesOf(raw);
  return minutes === null ? "all" : String(minutes);
}

export function activeWeight(raw: string): string {
  if (raw === "blank") return "blank";
  const weight = weightOf(raw);
  return weight === null ? "all" : String(weight);
}

export function callerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return markName(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function minutesArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return minutesOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
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
    caller: row.caller === "blank" ? "blank" : clip(row.caller, 18) || "all",
    cloth: row.cloth === "blank" || row.cloth === "all" ? (row.cloth === "blank" ? "blank" : "all") : clothOf(row.cloth) || "all",
    mark: row.mark === "blank" || row.mark === "all" ? (row.mark === "blank" ? "blank" : "all") : markName(row.mark) || "all",
    bay: activeBay(String(row.bay || "all")),
    minutes: activeMinutes(String(row.minutes || "all")),
    weight: activeWeight(String(row.weight || "all")),
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

export type RibbonState = "" | "set" | "clear";

export type RibbonLane = "" | "west" | "east" | "court";

export type RibbonTone = "" | "gilt" | "ink" | "ivory" | "mist";

export type RibbonShape = "all" | "catalog" | "wide" | "gilt";

export type RibbonValue =
  | string
  | { affiliateB?: unknown; affiliateA?: unknown; affiliateC?: unknown; language?: unknown; address?: unknown; country?: unknown; email?: unknown; phone?: unknown; city?: unknown; desk?: unknown; name?: unknown; username?: unknown; accountType?: unknown; lastBrowser?: unknown; isResident?: unknown; documentsStatus?: unknown }
  | null
  | undefined;

export type RibbonRow = { id: string; label?: string; note: RibbonValue };

export type RibbonLaneLine = { lane: string; count: number };

const RIBBON_LANES = ["west", "east", "court"] as const;

const RIBBON_TONES = ["gilt", "ink", "ivory", "mist"] as const;

const RIBBON_BLOCK = ["affiliateA", "affiliateC", "language", "address", "country", "email", "phone", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident", "documentsStatus"] as const;

const CATALOG = new Set(["B7", "B21", "HOUSE", "DESK", "GOLD"]);

function ribbonBody(raw: unknown): string {
  return clip(raw, 16).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function ribbonText(value: RibbonValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string" || value == null) {
    if (value == null) return { text: "", explicit: true };
    return { text: ribbonBody(value), explicit: true };
  }
  if (typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (RIBBON_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("affiliateB" in value)) return { text: null, explicit: false };
  const inner = value.affiliateB;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: ribbonBody(inner), explicit: true };
}

function ribbonKind(text: string): "" | "digit" | "letter" | "mixed" {
  if (!text) return "";
  const digit = /[0-9]/.test(text);
  const letter = /[A-Z]/.test(text);
  if (digit && letter) return "mixed";
  if (digit) return "digit";
  if (letter) return "letter";
  return "";
}

export function ribbonState(value: RibbonValue): RibbonState {
  const found = ribbonText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function ribbonCopy(value: RibbonValue): string {
  const found = ribbonText(value);
  return found.explicit && found.text ? found.text : "";
}

/** The monogram is the first two letters or digits. A single character stays one character. */
export function ribbonOf(value: RibbonValue): string {
  const text = ribbonCopy(value);
  return text ? text.slice(0, 2) : "";
}

/** A through M is west. N through Z is east. A digit is the court. */
export function ribbonLane(value: RibbonValue): RibbonLane {
  const text = ribbonCopy(value);
  const first = text[0];
  if (!first) return "";
  if (first >= "0" && first <= "9") return "court";
  if (first <= "M") return "west";
  return "east";
}

/** A code that starts with B is gilt. Digits are ivory. Letters are mist. A mix is ink. */
export function ribbonTone(value: RibbonValue): RibbonTone {
  const text = ribbonCopy(value);
  const kind = ribbonKind(text);
  if (!kind) return "";
  if (text.startsWith("B")) return "gilt";
  if (kind === "digit") return "ivory";
  if (kind === "letter") return "mist";
  return "ink";
}

/** B7, B21, HOUSE, DESK, and GOLD belong to the house book. */
export function catalogRibbon(value: RibbonValue): boolean {
  return CATALOG.has(ribbonCopy(value));
}

export function catalogRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => catalogRibbon(row.note)).length;
}

/** A code longer than six characters is wide. */
export function wideRibbon(value: RibbonValue): boolean {
  return ribbonCopy(value).length > 6;
}

export function wideRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => wideRibbon(row.note)).length;
}

export function giltRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonTone(row.note) === "gilt").length;
}

/** Customers whose ribbon monogram is shared with at least one other customer. */
export function sharedRibbonCount(rows: readonly RibbonRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = ribbonOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function ribbonLanes(rows: readonly RibbonRow[]): RibbonLaneLine[] {
  return RIBBON_LANES.map((lane) => ({ lane, count: rows.filter((row) => ribbonLane(row.note) === lane).length }));
}

/** The lane with the most set ribbons. A tie keeps west, then east, then court. */
export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const lines = ribbonLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || RIBBON_LANES.indexOf(a.lane as (typeof RIBBON_LANES)[number]) - RIBBON_LANES.indexOf(b.lane as (typeof RIBBON_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set ribbons. A tie keeps gilt, then ink, then ivory, then mist. */
export function leadingRibbonTone(rows: readonly RibbonRow[]): string {
  const counts = RIBBON_TONES.map((tone) => ({ tone, count: rows.filter((row) => ribbonTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || RIBBON_TONES.indexOf(a.tone) - RIBBON_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function ribbonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Step on the partner timeline. A clear code is 0. Digits are 1, letters are 2, and a mix is 3. */
export function ribbonStep(value: RibbonValue): 0 | 1 | 2 | 3 {
  const kind = ribbonKind(ribbonCopy(value));
  if (kind === "digit") return 1;
  if (kind === "letter") return 2;
  if (kind === "mixed") return 3;
  return 0;
}

export function presentRibbons(rows: readonly RibbonRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = ribbonState(row.note);
    const lane = state === "set" ? ribbonLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenRibbons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
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

export function toggleRibbon(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
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

export function visibleRibbonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleRibbonCustomers(
  rows: readonly RibbonRow[],
  lane: RibbonLane | "blank" | null,
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
    const mark = state === "set" ? ribbonLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && ribbonTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogRibbon(row.note)) return false;
    if (shape === "wide" && !wideRibbon(row.note)) return false;
    if (shape === "gilt" && ribbonTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${ribbonCopy(row.note)} ${ribbonOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeRibbonLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeRibbonTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" ? raw : "all";
}

export function ribbonLaneArg(filter: string): RibbonLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "west" || filter === "east" || filter === "court") return filter;
  return null;
}

export function ribbonToneArg(filter: string): RibbonTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist") return filter;
  return null;
}

export function ribbonsCsv(rows: readonly RibbonRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of ribbonLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogRibbonCount(rows)}`);
  lines.push(`wide,wide,${wideRibbonCount(rows)}`);
  lines.push(`tone,gilt,${giltRibbonCount(rows)}`);
  lines.push(`tone,mist,${rows.filter((row) => ribbonTone(row.note) === "mist").length}`);
  lines.push(`shared,shared,${sharedRibbonCount(rows)}`);
  return lines.join("\n");
}

export function ribbonRowsCsv(rows: readonly RibbonRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,ribbon,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = ribbonState(row.note);
    const lane = state === "set" ? ribbonLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      ribbonOf(row.note),
      lane,
      state === "set" ? ribbonTone(row.note) : "",
      String(ribbonStep(row.note)),
      catalogRibbon(row.note) ? "1" : "0",
      wideRibbon(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
