/**
 * Gallery walks for the retention desk, and timezone offsets already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_gallery_walk (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   guide text not null default '',
 *   step integer,
 *   wing text not null default '',
 *   pace text not null default '',
 *   lamp integer,
 *   length integer,
 *   tags text not null default '',
 *   rest integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_timezone_offset_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_timezone_offset_review (
 *   customer_id text primary key
 * );
 */

export const GWK_KEY = "crmv4-gallery-walk";
export const GWK_VIEW_KEY = "crmv4-gallery-views";
export const GWK_DENSITY_KEY = "crmv4-gallery-density";
export const TZN_KEY = "crmv4-zone-hide";
export const TZN_REVIEW_KEY = "crmv4-zone-review";

export type WalkWing = "blank" | "north" | "south" | "court";

export type WalkPace = "blank" | "stroll" | "pause" | "close";

export type WalkTray = "open" | "held" | "closed";

export type StepPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type WalkDensity = "roomy" | "tight";

export type WalkSort = "step" | "title";

export type GalleryWalk = {
  id: string;
  title: string;
  note: string;
  guide: string;
  step: number | null;
  wing: string;
  pace: string;
  lamp: number | null;
  length: number | null;
  tags: string[];
  rest: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type WalkView = {
  id: string;
  name: string;
  tray: WalkTray;
  query: string;
  guide: string;
  wing: string;
  pace: string;
  step: string;
  lamp: string;
  length: string;
};

export type WalkCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rest: number;
  house: number;
};

export type ZoneState = "" | "set" | "clear";

export type ZoneBand = "" | "stem" | "pair";

export type ZoneTone = "" | "home" | "away";

export type ZoneShape = "all" | "catalog" | "pair" | "home";

export type ZoneValue =
  | { timezone?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type ZoneRow = { id: string; note?: ZoneValue; label?: string | null };

export type ZoneBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "hold", "lift", "close", "open", "wing", "tag", "rest"] as const;

const WINGS = ["north", "south", "court"] as const;

const PACES = ["stroll", "pause", "close"] as const;

const PACE_ORDER = ["", "stroll", "pause", "close"] as const;

const PEAK_STEPS = new Set([3, 4, 5]);

const QUIET_STEPS = new Set([1, 8]);

const HOUSE = new Set(["NORTH", "COURT"]);

const ZONE_BANDS = ["stem", "pair"] as const;

const CATALOG = new Set(["europe/istanbul", "europe/london", "asia/dubai"]);

const ZONE_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name"] as const;

const WALK_CAP = 8;

const VIEW_CAP = 6;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WalkTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wingName(raw: unknown): Exclude<WalkWing, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WINGS as readonly string[]).includes(text) ? (text as Exclude<WalkWing, "blank">) : "";
}

function paceName(raw: unknown): Exclude<WalkPace, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<WalkPace, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function walkLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function walkNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank guide stays blank. It is not filled in. */
export function guideLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A wing is NORTH, SOUTH, or COURT. Anything else stays blank. Letters are stored in capitals. */
export function wingOf(raw: unknown): string {
  const name = wingName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A step is an integer from 1 through 8.
 * A blank value stays unset. 0 and 9 are not steps.
 * A leading zero is not a step.
 */
export function stepOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A lamp is 1, 3, or 9. A blank value stays unset. A leading zero is not a lamp. */
export function lampOf(raw: unknown): 1 | 3 | 9 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 9 || raw === "9") return 9;
  return null;
}

/** A length is 10, 20, or 40 minutes. A blank value stays unset. A leading zero is not a length. */
export function lengthOf(raw: unknown): 10 | 20 | 40 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** A rest is 0, 10, or 30. Anything else is not a rest. */
export function restOf(raw: unknown): 0 | 10 | 30 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 30 || raw === "30") return 30;
  return null;
}

export function stepBand(step: unknown): "blank" | "early" | "mid" | "late" {
  const value = stepOf(step);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak steps are 3, 4, and 5. An unset step is not a peak step. */
export function peakStep(step: unknown): boolean {
  const value = stepOf(step);
  return value !== null && PEAK_STEPS.has(value);
}

/** Quiet steps are 1 and 8. A peak step is not quiet. An unset step is not quiet. */
export function quietStep(step: unknown): boolean {
  const value = stepOf(step);
  return value !== null && QUIET_STEPS.has(value);
}

/**
 * How far a step sits behind the desk step.
 * A positive gap means the walk step is behind. A negative gap means it is ahead.
 * A gap of zero means the same step. An unset step has no gap. Steps do not wrap.
 */
export function stepGap(step: unknown, desk: unknown): number | null {
  const from = stepOf(step);
  const at = stepOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** NORTH and COURT are house wings. SOUTH is a guest wing. A blank wing is not a house wing. */
export function houseWing(wing: unknown): boolean {
  return HOUSE.has(wingOf(wing));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): WalkDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Step or title. Anything else stays on the step. */
export function sortMode(raw: unknown): WalkSort {
  return raw === "title" ? "title" : "step";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 4).toLowerCase();
  return /^[a-z]$/.test(text) ? text : "";
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

function readOne(raw: unknown): GalleryWalk | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<GalleryWalk>;
  const id = clip(row.id, 24);
  const title = walkLine(row.title);
  if (!id || !title) return null;
  const rest = restOf(row.rest);
  return {
    id,
    title,
    note: walkNote(row.note),
    guide: guideLabel(row.guide),
    step: stepOf(row.step),
    wing: wingOf(row.wing),
    pace: paceName(row.pace),
    lamp: lampOf(row.lamp),
    length: lengthOf(row.length),
    tags: tagsOf(row.tags),
    rest: rest === null ? 0 : rest,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readWalks(raw: unknown): GalleryWalk[] {
  if (!Array.isArray(raw)) return [];
  const out: GalleryWalk[] = [];
  for (const item of raw) {
    const walk = readOne(item);
    if (!walk || out.some((row) => row.id === walk.id || row.title === walk.title)) continue;
    out.push(walk);
  }
  return out.slice(0, WALK_CAP);
}

export function addWalk(
  walks: readonly GalleryWalk[],
  walk: {
    id: string;
    title: string;
    note?: string;
    guide?: string;
    step?: unknown;
    wing?: string;
    pace?: string;
    lamp?: unknown;
    length?: unknown;
    tags?: unknown;
    rest?: unknown;
  },
): GalleryWalk[] {
  const current = readWalks(walks);
  const id = String(walk.id || "").trim();
  const title = walkLine(walk.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rest = restOf(walk.rest);
  const next: GalleryWalk = {
    id,
    title,
    note: walkNote(walk.note),
    guide: guideLabel(walk.guide),
    step: stepOf(walk.step),
    wing: wingOf(walk.wing),
    pace: paceName(walk.pace),
    lamp: lampOf(walk.lamp),
    length: lengthOf(walk.length),
    tags: tagsOf(walk.tags),
    rest: rest === null ? 0 : rest,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, WALK_CAP);
}

export function cyclePace(walks: readonly GalleryWalk[], id: string): GalleryWalk[] {
  return readWalks(walks).map((walk) => {
    if (walk.id !== id) return walk;
    const at = PACE_ORDER.indexOf(walk.pace as (typeof PACE_ORDER)[number]);
    const next = at < 0 || at >= PACES.length ? PACES[0] : PACES[at % PACES.length];
    if (!next || next === walk.pace) return walk;
    return { ...walk, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editWalk(walks: readonly GalleryWalk[], id: string, title: unknown): GalleryWalk[] {
  const next = walkLine(title);
  if (!next) return readWalks(walks);
  const current = readWalks(walks);
  if (current.some((walk) => walk.id !== id && walk.title === next)) return current;
  return current.map((walk) => (walk.id === id && walk.title !== next ? { ...walk, title: next, audit: "edit" } : walk));
}

/** A blank note is left as it is. */
export function editWalkNote(walks: readonly GalleryWalk[], id: string, note: unknown): GalleryWalk[] {
  const next = walkNote(note);
  if (!next) return readWalks(walks);
  return readWalks(walks).map((walk) => (walk.id === id && walk.note !== next ? { ...walk, note: next, audit: "edit" } : walk));
}

/** A tag that is already on the walk, or a fifth tag, is left out. A tag is one letter. */
export function addWalkTag(walks: readonly GalleryWalk[], id: string, tag: unknown): GalleryWalk[] {
  const next = tagOf(tag);
  if (!next) return readWalks(walks);
  return readWalks(walks).map((walk) => {
    if (walk.id !== id || walk.tags.includes(next) || walk.tags.length >= TAG_CAP) return walk;
    return { ...walk, tags: [...walk.tags, next], audit: "tag" };
  });
}

/** An unknown rest is left as it is. 0 clears the rest. */
export function setWalkRest(walks: readonly GalleryWalk[], id: string, rest: unknown): GalleryWalk[] {
  const next = restOf(rest);
  if (next === null) return readWalks(walks);
  return readWalks(walks).map((walk) => (walk.id === id && walk.rest !== next ? { ...walk, rest: next, audit: "rest" } : walk));
}

export function setWalkPin(walks: readonly GalleryWalk[], id: string, pinned: boolean): GalleryWalk[] {
  return readWalks(walks).map((walk) => (walk.id === id && walk.pinned !== pinned ? { ...walk, pinned, audit: pinned ? "pin" : "unpin" } : walk));
}

/** P toggles the pin on the focused row of the wall currently shown. */
export function pinFocused(walks: readonly GalleryWalk[], shownIds: readonly string[], index: number): GalleryWalk[] {
  if (!shownIds.length) return readWalks(walks);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readWalks(walks).find((walk) => walk.id === id);
  if (!row) return readWalks(walks);
  return setWalkPin(walks, id, !row.pinned);
}

export function setWalkHold(walks: readonly GalleryWalk[], id: string, held: boolean): GalleryWalk[] {
  return readWalks(walks).map((walk) => (walk.id === id && walk.held !== held ? { ...walk, held, audit: held ? "hold" : "lift" } : walk));
}

export function setWalkClose(walks: readonly GalleryWalk[], id: string, closed: boolean): GalleryWalk[] {
  return readWalks(walks).map((walk) => (walk.id === id && walk.closed !== closed ? { ...walk, closed, audit: closed ? "close" : "open" } : walk));
}

export function bulkWalkWing(walks: readonly GalleryWalk[], ids: readonly string[], wing: unknown): GalleryWalk[] {
  const next = wingOf(wing);
  if (!next) return readWalks(walks);
  const picked = new Set(ids);
  return readWalks(walks).map((walk) => (picked.has(walk.id) && walk.wing !== next ? { ...walk, wing: next, audit: "wing" } : walk));
}

export function bulkWalkPin(walks: readonly GalleryWalk[], ids: readonly string[], pinned: boolean): GalleryWalk[] {
  const picked = new Set(ids);
  return readWalks(walks).map((walk) => (picked.has(walk.id) && walk.pinned !== pinned ? { ...walk, pinned, audit: pinned ? "pin" : "unpin" } : walk));
}

export function bulkWalkClose(walks: readonly GalleryWalk[], ids: readonly string[], closed: boolean): GalleryWalk[] {
  const picked = new Set(ids);
  return readWalks(walks).map((walk) => (picked.has(walk.id) && walk.closed !== closed ? { ...walk, closed, audit: closed ? "close" : "open" } : walk));
}

export function bulkWalkTag(walks: readonly GalleryWalk[], ids: readonly string[], tag: unknown): GalleryWalk[] {
  return ids.reduce((rows, id) => addWalkTag(rows, id, tag), readWalks(walks));
}

export function resetWalks(): GalleryWalk[] {
  return [];
}

function inTray(walk: GalleryWalk, tray: WalkTray): boolean {
  if (tray === "closed") return walk.closed;
  if (tray === "held") return walk.held && !walk.closed;
  return !walk.held && !walk.closed;
}

function stepHit(step: number | null, exact: number | null, pick: StepPick | null): boolean {
  if (exact !== null) return step === exact;
  if (pick === null) return true;
  if (pick === "blank") return step === null;
  if (pick === "peak") return peakStep(step);
  if (pick === "quiet") return quietStep(step);
  return stepBand(step) === pick;
}

/** An open walk whose step sits more than four steps behind the desk step. A rest, a hold, or a close is not late. */
export function lateWalk(walk: GalleryWalk, desk: unknown): boolean {
  const gap = stepGap(walk.step, desk);
  return inTray(walk, "open") && walk.rest === 0 && gap !== null && gap > 4;
}

/** An open walk with a length of 10 is due now. A rest, a hold, or a close is not. */
export function soonWalk(walk: GalleryWalk): boolean {
  return inTray(walk, "open") && walk.rest === 0 && walk.length === 10;
}

/** Open walks that are late or due now. A resting walk stays off the reminder list. */
export function reminderWalks(walks: readonly GalleryWalk[], desk: unknown): GalleryWalk[] {
  return readWalks(walks).filter((walk) => lateWalk(walk, desk) || soonWalk(walk));
}

/** Search matches the title, the note, the guide, and the tags. */
export function visibleWalks(
  walks: readonly GalleryWalk[],
  tray: WalkTray,
  query: string,
  guide: string | null,
  wing: string | null,
  pace: string | null,
  exact: number | null,
  pick: StepPick | null,
  lamp: number | "blank" | null,
  length: number | "blank" | null,
  pauseOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): GalleryWalk[] {
  const text = query.trim().toLowerCase();
  return readWalks(walks).filter((walk) => {
    if (!inTray(walk, tray)) return false;
    if (text) {
      const hay = `${walk.title} ${walk.note} ${walk.guide} ${walk.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (guide !== null && walk.guide !== guide) return false;
    if (wing === "blank" ? Boolean(walk.wing) : wing && walk.wing !== wing) return false;
    if (pace === "blank" ? Boolean(walk.pace) : pace && walk.pace !== pace) return false;
    if (!stepHit(walk.step, exact, pick)) return false;
    if (lamp === "blank" ? walk.lamp !== null : lamp !== null && walk.lamp !== lamp) return false;
    if (length === "blank" ? walk.length !== null : length !== null && walk.length !== length) return false;
    if (pauseOnly && walk.pace !== "pause") return false;
    if (peakOnly && !peakStep(walk.step)) return false;
    if (houseOnly && !houseWing(walk.wing)) return false;
    if (quietOnly && !quietStep(walk.step)) return false;
    if (awakeOnly && walk.rest !== 0) return false;
    return true;
  });
}

export function sortWalks(walks: readonly GalleryWalk[], mode: WalkSort): GalleryWalk[] {
  const rows = walks.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.step ?? 99) - (b.step ?? 99));
  return rows.sort((a, b) => (a.step ?? 99) - (b.step ?? 99) || a.title.localeCompare(b.title));
}

export function walkTimeline(walks: readonly GalleryWalk[], query: string): GalleryWalk[] {
  const text = query.trim().toLowerCase();
  return sortWalks(
    readWalks(walks).filter((walk) => walk.step !== null && (!text || walk.title.toLowerCase().includes(text))),
    "step",
  );
}

export function walkCounts(walks: readonly GalleryWalk[], desk: unknown): WalkCounts {
  const rows = readWalks(walks);
  return {
    open: rows.filter((walk) => inTray(walk, "open")).length,
    held: rows.filter((walk) => inTray(walk, "held")).length,
    closed: rows.filter((walk) => inTray(walk, "closed")).length,
    pinned: rows.filter((walk) => walk.pinned).length,
    peak: rows.filter((walk) => inTray(walk, "open") && walk.rest === 0 && peakStep(walk.step)).length,
    late: rows.filter((walk) => lateWalk(walk, desk)).length,
    soon: rows.filter((walk) => soonWalk(walk)).length,
    rest: rows.filter((walk) => inTray(walk, "open") && walk.rest > 0).length,
    house: rows.filter((walk) => inTray(walk, "open") && houseWing(walk.wing)).length,
  };
}

export function walkShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Distinct steps on open walks. */
export function usedSteps(walks: readonly GalleryWalk[]): number {
  const steps = new Set<number>();
  for (const walk of readWalks(walks)) {
    if (inTray(walk, "open") && walk.step !== null) steps.add(walk.step);
  }
  return steps.size;
}

/** Open walks that share a step and a wing. A different wing on the same step is not a clash. */
export function clashStepCount(walks: readonly GalleryWalk[]): number {
  const groups = new Map<string, number>();
  for (const walk of readWalks(walks)) {
    if (!inTray(walk, "open") || walk.step === null || !walk.wing) continue;
    const key = `${walk.step}:${walk.wing}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open walks that share a lamp. An unset lamp is not a clash. */
export function lampClashCount(walks: readonly GalleryWalk[]): number {
  const groups = new Map<number, number>();
  for (const walk of readWalks(walks)) {
    if (!inTray(walk, "open") || walk.lamp === null) continue;
    groups.set(walk.lamp, (groups.get(walk.lamp) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open walks on the same wing whose steps differ by one.
 * The count is the walks that have at least one neighbor.
 */
export function adjacentWalkCount(walks: readonly GalleryWalk[]): number {
  const open = readWalks(walks).filter((walk) => inTray(walk, "open") && walk.step !== null && walk.wing);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.wing === right.wing && Math.abs((left.step ?? 0) - (right.step ?? 0)) === 1) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The wing with the fewest open walks.
 * A tie keeps SOUTH, then NORTH, then COURT.
 * An empty desk still suggests SOUTH.
 */
export function suggestWing(walks: readonly GalleryWalk[]): "SOUTH" | "NORTH" | "COURT" {
  const rows = readWalks(walks).filter((walk) => inTray(walk, "open"));
  const order = ["SOUTH", "NORTH", "COURT"] as const;
  let best: "SOUTH" | "NORTH" | "COURT" = "SOUTH";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wing of order) {
    const count = rows.filter((walk) => walk.wing === wing).length;
    if (count < bestCount) {
      best = wing;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The length with the fewest open walks.
 * A tie keeps 20, then 10, then 40.
 * An empty desk still suggests 20.
 */
export function suggestLength(walks: readonly GalleryWalk[]): 10 | 20 | 40 {
  const rows = readWalks(walks).filter((walk) => inTray(walk, "open"));
  const order = [20, 10, 40] as const;
  let best: 10 | 20 | 40 = 20;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const length of order) {
    const count = rows.filter((walk) => walk.length === length).length;
    if (count < bestCount) {
      best = length;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open guide. A blank guide is skipped. An empty desk stays blank. */
export function suggestGuide(walks: readonly GalleryWalk[]): string {
  const found = readWalks(walks).find((walk) => inTray(walk, "open") && walk.guide);
  return found ? found.guide : "";
}

/**
 * The guide carrying the fewest open walks.
 * A tie keeps the earlier name. A blank guide is not a load.
 * An empty roster falls back to the newest guide.
 */
export function fairGuide(walks: readonly GalleryWalk[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = guideLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestGuide(walks);
  const open = readWalks(walks).filter((walk) => inTray(walk, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((walk) => walk.guide === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The guide with the most open walks. A tie keeps the earlier name. */
export function busiestGuide(walks: readonly GalleryWalk[]): string {
  const rows = readWalks(walks).filter((walk) => inTray(walk, "open") && walk.guide);
  const names: string[] = [];
  for (const walk of rows) if (!names.includes(walk.guide)) names.push(walk.guide);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((walk) => walk.guide === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function walkGuides(walks: readonly GalleryWalk[]): string[] {
  const out: string[] = [];
  for (const walk of readWalks(walks)) {
    if (walk.guide && !out.includes(walk.guide)) out.push(walk.guide);
  }
  return out;
}

export function walkWings(walks: readonly GalleryWalk[]): string[] {
  const out: string[] = [];
  for (const walk of readWalks(walks)) {
    if (walk.wing && !out.includes(walk.wing)) out.push(walk.wing);
  }
  return out;
}

/**
 * The next open walk at or after the desk step.
 * A close pace, a rest, a hold, and a close stay off the list.
 * When every open step is behind, the earliest step is next.
 */
export function nextWalk(walks: readonly GalleryWalk[], desk: unknown): string {
  const now = stepOf(desk);
  if (now === null) return "";
  const waiting = readWalks(walks).filter((walk) => inTray(walk, "open") && walk.step !== null && walk.pace !== "close" && walk.rest === 0);
  if (!waiting.length) return "";
  const byStep = (a: GalleryWalk, b: GalleryWalk) => (a.step ?? 0) - (b.step ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((walk) => (walk.step ?? 0) >= now).sort(byStep);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byStep)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function walkCopy(walk: GalleryWalk, desk: unknown): string {
  const gap = stepGap(walk.step, desk);
  return [walk.title, walk.guide, walk.step ?? "", walk.wing, walk.pace, walk.lamp ?? "", walk.length ?? "", walk.tags.join(" "), walk.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the walks saved in this browser. The gap and the late mark use the step you pass. */
export function walksCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,guide,step,wing,pace,lamp,length,tags,rest,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const walk of readWalks(raw)) {
    const gap = stepGap(walk.step, desk);
    lines.push([
      walk.title,
      walk.guide,
      walk.step === null ? "" : String(walk.step),
      walk.wing,
      walk.pace,
      walk.lamp === null ? "" : String(walk.lamp),
      walk.length === null ? "" : String(walk.length),
      walk.tags.join(" "),
      String(walk.rest),
      walk.pinned ? "1" : "0",
      walk.held ? "1" : "0",
      walk.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateWalk(walk, desk) ? "1" : "0",
      soonWalk(walk) ? "1" : "0",
      houseWing(walk.wing) ? "1" : "0",
      walk.note,
      walk.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeGuide(raw: string, guides: readonly string[]): string {
  if (raw === "blank") return "blank";
  return guides.includes(raw) ? raw : "all";
}

export function activeWing(raw: string, wings: readonly string[]): string {
  if (raw === "blank") return "blank";
  const wing = wingOf(raw);
  return wing && wings.includes(wing) ? wing : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "blank") return "blank";
  const pace = paceName(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeStep(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const step = stepOf(raw);
  return step === null ? "all" : String(step);
}

export function activeLamp(raw: string): string {
  if (raw === "blank") return "blank";
  const lamp = lampOf(raw);
  return lamp === null ? "all" : String(lamp);
}

export function activeLength(raw: string): string {
  if (raw === "blank") return "blank";
  const length = lengthOf(raw);
  return length === null ? "all" : String(length);
}

export function guideArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function wingArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return wingOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function stepArg(filter: string): { exact: number | null; pick: StepPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: stepOf(filter), pick: null };
}

export function lampArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lampOf(filter);
}

export function lengthArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lengthOf(filter);
}

function readView(raw: unknown): WalkView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<WalkView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    guide: row.guide === "blank" ? "blank" : clip(row.guide, 16) || "all",
    wing: row.wing === "blank" || row.wing === "all" ? (row.wing === "blank" ? "blank" : "all") : wingOf(row.wing) || "all",
    pace: row.pace === "blank" || row.pace === "all" ? (row.pace === "blank" ? "blank" : "all") : paceName(row.pace) || "all",
    step: activeStep(String(row.step || "all")),
    lamp: activeLamp(String(row.lamp || "all")),
    length: activeLength(String(row.length || "all")),
  };
}

export function readWalkViews(raw: unknown): WalkView[] {
  if (!Array.isArray(raw)) return [];
  const out: WalkView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addWalkView(views: readonly WalkView[], view: WalkView): WalkView[] {
  const current = readWalkViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropWalkView(views: readonly WalkView[], id: string): WalkView[] {
  return readWalkViews(views).filter((view) => view.id !== id);
}

function zoneBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function zoneText(value: ZoneValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: zoneBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (ZONE_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("timezone" in value)) return { text: null, explicit: false };
  const inner = value.timezone;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: zoneBody(inner), explicit: true };
}

export function zoneState(value: ZoneValue): ZoneState {
  const found = zoneText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function zoneCopy(value: ZoneValue): string {
  const found = zoneText(value);
  if (!found.text) return "";
  return found.text.slice(0, 64);
}

/**
 * A slash zone keeps the first letter of the region and the first letter of the city.
 * A zone without a slash keeps the first letter and the last letter.
 * Digits and underscores are skipped. A zone with no letter has no mark.
 */
export function zoneOf(value: ZoneValue): string {
  const text = zoneCopy(value);
  if (!text) return "";
  const slash = text.indexOf("/");
  if (slash >= 0) {
    const region = (text.slice(0, slash).match(/[A-Za-z]/g) || [])[0];
    const city = (text.slice(slash + 1).match(/[A-Za-z]/g) || [])[0];
    if (!region || !city) return "";
    return region.toUpperCase() + city.toUpperCase();
  }
  const letters = text.match(/[A-Za-z]/g);
  if (!letters || !letters.length) return "";
  const first = letters[0].toUpperCase();
  if (letters.length === 1) return first;
  return first + letters[letters.length - 1].toUpperCase();
}

/** A slash with letters on both sides is a pair. Any other mark is a stem. No letter has no band. */
export function zoneBand(value: ZoneValue): ZoneBand {
  const mark = zoneOf(value);
  if (!mark) return "";
  const text = zoneCopy(value);
  const slash = text.indexOf("/");
  if (slash < 0) return "stem";
  const region = text.slice(0, slash).match(/[A-Za-z]/);
  const city = text.slice(slash + 1).match(/[A-Za-z]/);
  return region && city ? "pair" : "stem";
}

/** Europe is home. A digit, or any other region, is away. A blank mark has no tone. */
export function zoneTone(value: ZoneValue): ZoneTone {
  const text = zoneCopy(value);
  if (!text || !zoneOf(value)) return "";
  if (/\d/.test(text)) return "away";
  const region = text.split("/")[0].replace(/[^A-Za-z]/g, "").toLowerCase();
  return region === "europe" ? "home" : "away";
}

/** Europe/Istanbul, Europe/London, and Asia/Dubai are the house catalog. Any other zone is not. */
export function catalogZone(value: ZoneValue): boolean {
  const text = zoneCopy(value).toLowerCase().replace(/\s+/g, "");
  return CATALOG.has(text);
}

export function catalogZoneCount(rows: readonly ZoneRow[]): number {
  return rows.filter((row) => catalogZone(row.note)).length;
}

export function pairZoneCount(rows: readonly ZoneRow[]): number {
  return rows.filter((row) => zoneBand(row.note) === "pair").length;
}

export function homeZoneCount(rows: readonly ZoneRow[]): number {
  return rows.filter((row) => zoneTone(row.note) === "home").length;
}

/** Customers whose mark is shared with at least one other customer. */
export function sharedZoneCount(rows: readonly ZoneRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = zoneOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function zoneBands(rows: readonly ZoneRow[]): ZoneBandLine[] {
  return ZONE_BANDS.map((band) => ({ band, count: rows.filter((row) => zoneBand(row.note) === band).length }));
}

/** The band with the most set timezones. A tie keeps stem, then pair. */
export function leadingZone(rows: readonly ZoneRow[]): string {
  const lines = zoneBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || ZONE_BANDS.indexOf(a.band as (typeof ZONE_BANDS)[number]) - ZONE_BANDS.indexOf(b.band as (typeof ZONE_BANDS)[number]))[0].band;
}

/** The tone with the most set timezones. A tie keeps home. */
export function leadingZoneTone(rows: readonly ZoneRow[]): string {
  const home = homeZoneCount(rows);
  const away = rows.filter((row) => zoneTone(row.note) === "away").length;
  if (!home && !away) return "";
  return home >= away ? "home" : "away";
}

export function zoneShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentZones(rows: readonly ZoneRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = zoneState(row.note);
    const band = state === "set" ? zoneBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenZones(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedZones(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleZone(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleZoneReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkZoneReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleZoneBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleZoneCustomers(
  rows: readonly ZoneRow[],
  band: ZoneBand | "blank" | null,
  tone: ZoneTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: ZoneShape,
): ZoneRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = zoneState(row.note);
    const mark = state === "set" ? zoneBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && zoneTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogZone(row.note)) return false;
    if (shape === "pair" && zoneBand(row.note) !== "pair") return false;
    if (shape === "home" && zoneTone(row.note) !== "home") return false;
    if (text) {
      const hay = `${row.label || ""} ${zoneCopy(row.note)} ${zoneOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeZoneBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeZoneTone(raw: string): string {
  return raw === "home" || raw === "away" ? raw : "all";
}

export function zoneBandArg(filter: string): ZoneBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "stem" || filter === "pair") return filter;
  return null;
}

export function zoneToneArg(filter: string): ZoneTone | null {
  if (filter === "home" || filter === "away") return filter;
  return null;
}

export function zonesCsv(rows: readonly ZoneRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of zoneBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogZoneCount(rows)}`);
  lines.push(`tone,home,${homeZoneCount(rows)}`);
  lines.push(`tone,away,${rows.filter((row) => zoneTone(row.note) === "away").length}`);
  return lines.join("\n");
}

export function zoneRowsCsv(rows: readonly ZoneRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,zone,band,tone,catalog,reviewed"];
  for (const row of rows) {
    const state = zoneState(row.note);
    const band = state === "set" ? zoneBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      zoneOf(row.note),
      band,
      state === "set" ? zoneTone(row.note) : "",
      catalogZone(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
