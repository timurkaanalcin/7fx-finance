/**
 * Salon recitals for the retention desk, and username seals already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_salon_recital (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   usher text not null default '',
 *   bell integer,
 *   hall text not null default '',
 *   cue text not null default '',
 *   candle integer,
 *   span integer,
 *   tags text not null default '',
 *   rest integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_username_seal_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_username_seal_review (
 *   customer_id text primary key
 * );
 */

export const RCT_KEY = "crmv4-salon-recital";
export const RCT_VIEW_KEY = "crmv4-salon-views";
export const RCT_DENSITY_KEY = "crmv4-salon-density";
export const UNS_KEY = "crmv4-username-seal-hide";
export const UNS_REVIEW_KEY = "crmv4-username-seal-review";

export type RecHall = "blank" | "gold" | "ivory" | "ink";

export type RecCue = "blank" | "posted" | "called" | "bowed";

export type RecTray = "open" | "held" | "closed";

export type BellPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type RecDensity = "roomy" | "tight";

export type RecSort = "bell" | "title";

export type SalonRecital = {
  id: string;
  title: string;
  note: string;
  usher: string;
  bell: number | null;
  hall: string;
  cue: string;
  candle: number | null;
  span: number | null;
  tags: string[];
  rest: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type RecView = {
  id: string;
  name: string;
  tray: RecTray;
  query: string;
  usher: string;
  hall: string;
  cue: string;
  bell: string;
  candle: string;
  span: string;
};

export type RecCounts = {
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

export type SealState = "" | "set" | "clear";

export type SealBand = "" | "dot" | "bar";

export type SealTone = "" | "cipher" | "plain";

export type SealShape = "all" | "catalog" | "bar" | "plain";

export type SealValue =
  | { username?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type SealRow = { id: string; note?: SealValue; label?: string | null };

export type SealBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "cue", "pin", "unpin", "hold", "lift", "close", "open", "hall", "tag", "rest"] as const;

const HALLS = ["gold", "ivory", "ink"] as const;

const CUES = ["posted", "called", "bowed"] as const;

const CUE_ORDER = ["", "posted", "called", "bowed"] as const;

const PEAK_BELLS = new Set([7, 8, 9]);

const QUIET_BELLS = new Set([1, 12]);

const HOUSE = new Set(["GOLD", "IVORY"]);

const SEAL_BANDS = ["dot", "bar"] as const;

const CATALOG = new Set(["AA", "NA", "LE"]);

const SEAL_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name"] as const;

const RECITAL_CAP = 9;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RecTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function hallName(raw: unknown): Exclude<RecHall, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (HALLS as readonly string[]).includes(text) ? (text as Exclude<RecHall, "blank">) : "";
}

function cueName(raw: unknown): Exclude<RecCue, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CUES as readonly string[]).includes(text) ? (text as Exclude<RecCue, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function recitalLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function recitalNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank usher stays blank. It is not filled in. */
export function usherLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A hall is GOLD, IVORY, or INK. Anything else stays blank. Letters are stored in capitals. */
export function hallOf(raw: unknown): string {
  const name = hallName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bell is an integer from 1 through 12.
 * A blank value stays unset. 0 and 13 are not bells.
 * A leading zero is not a bell.
 */
export function bellOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 12) return null;
    return raw;
  }
  const text = clip(raw, 3);
  if (!/^(?:[1-9]|1[0-2])$/.test(text)) return null;
  return Number(text);
}

/** A candle is 2, 4, or 6. A blank value stays unset. A leading zero is not a candle. */
export function candleOf(raw: unknown): 2 | 4 | 6 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

/** A span is 15, 30, or 45 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 15 | 30 | 45 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** A rest is 0, 15, or 45. Anything else is not a rest. */
export function restOf(raw: unknown): 0 | 15 | 45 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

export function bellBand(bell: unknown): "blank" | "early" | "mid" | "late" {
  const value = bellOf(bell);
  if (value === null) return "blank";
  if (value <= 4) return "early";
  if (value <= 8) return "mid";
  return "late";
}

/** Peak bells are 7, 8, and 9. An unset bell is not a peak bell. */
export function peakBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && PEAK_BELLS.has(value);
}

/** Quiet bells are 1 and 12. A peak bell is not quiet. An unset bell is not quiet. */
export function quietBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && QUIET_BELLS.has(value);
}

/**
 * How far a bell sits behind the desk bell.
 * A positive gap means the recital bell is behind. A negative gap means it is ahead.
 * A gap of zero means the same bell. An unset bell has no gap. Bells do not wrap.
 */
export function bellGap(bell: unknown, desk: unknown): number | null {
  const from = bellOf(bell);
  const at = bellOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** GOLD and IVORY are house halls. INK is a guest hall. A blank hall is not a house hall. */
export function houseHall(hall: unknown): boolean {
  return HOUSE.has(hallOf(hall));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): RecDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Bell or title. Anything else stays on the bell. */
export function sortMode(raw: unknown): RecSort {
  return raw === "title" ? "title" : "bell";
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

function readOne(raw: unknown): SalonRecital | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SalonRecital>;
  const id = clip(row.id, 24);
  const title = recitalLine(row.title);
  if (!id || !title) return null;
  const rest = restOf(row.rest);
  return {
    id,
    title,
    note: recitalNote(row.note),
    usher: usherLabel(row.usher),
    bell: bellOf(row.bell),
    hall: hallOf(row.hall),
    cue: cueName(row.cue),
    candle: candleOf(row.candle),
    span: spanOf(row.span),
    tags: tagsOf(row.tags),
    rest: rest === null ? 0 : rest,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readRecitals(raw: unknown): SalonRecital[] {
  if (!Array.isArray(raw)) return [];
  const out: SalonRecital[] = [];
  for (const item of raw) {
    const recital = readOne(item);
    if (!recital || out.some((row) => row.id === recital.id || row.title === recital.title)) continue;
    out.push(recital);
  }
  return out.slice(0, RECITAL_CAP);
}

export function addRecital(
  recitals: readonly SalonRecital[],
  recital: {
    id: string;
    title: string;
    note?: string;
    usher?: string;
    bell?: unknown;
    hall?: string;
    cue?: string;
    candle?: unknown;
    span?: unknown;
    tags?: unknown;
    rest?: unknown;
  },
): SalonRecital[] {
  const current = readRecitals(recitals);
  const id = String(recital.id || "").trim();
  const title = recitalLine(recital.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rest = restOf(recital.rest);
  const next: SalonRecital = {
    id,
    title,
    note: recitalNote(recital.note),
    usher: usherLabel(recital.usher),
    bell: bellOf(recital.bell),
    hall: hallOf(recital.hall),
    cue: cueName(recital.cue),
    candle: candleOf(recital.candle),
    span: spanOf(recital.span),
    tags: tagsOf(recital.tags),
    rest: rest === null ? 0 : rest,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, RECITAL_CAP);
}

export function cycleCue(recitals: readonly SalonRecital[], id: string): SalonRecital[] {
  return readRecitals(recitals).map((recital) => {
    if (recital.id !== id) return recital;
    const at = CUE_ORDER.indexOf(recital.cue as (typeof CUE_ORDER)[number]);
    const next = at < 0 || at >= CUES.length ? CUES[0] : CUES[at % CUES.length];
    if (!next || next === recital.cue) return recital;
    return { ...recital, cue: next, audit: "cue" };
  });
}

/** A blank title is left as it is. */
export function editRecital(recitals: readonly SalonRecital[], id: string, title: unknown): SalonRecital[] {
  const next = recitalLine(title);
  if (!next) return readRecitals(recitals);
  const current = readRecitals(recitals);
  if (current.some((recital) => recital.id !== id && recital.title === next)) return current;
  return current.map((recital) => (recital.id === id && recital.title !== next ? { ...recital, title: next, audit: "edit" } : recital));
}

/** A blank note is left as it is. */
export function editRecitalNote(recitals: readonly SalonRecital[], id: string, note: unknown): SalonRecital[] {
  const next = recitalNote(note);
  if (!next) return readRecitals(recitals);
  return readRecitals(recitals).map((recital) => (recital.id === id && recital.note !== next ? { ...recital, note: next, audit: "edit" } : recital));
}

/** A tag that is already on the recital, or a fourth tag, is left out. A tag is one letter. */
export function addRecitalTag(recitals: readonly SalonRecital[], id: string, tag: unknown): SalonRecital[] {
  const next = tagOf(tag);
  if (!next) return readRecitals(recitals);
  return readRecitals(recitals).map((recital) => {
    if (recital.id !== id || recital.tags.includes(next) || recital.tags.length >= TAG_CAP) return recital;
    return { ...recital, tags: [...recital.tags, next], audit: "tag" };
  });
}

/** An unknown rest is left as it is. 0 clears the rest. */
export function setRecitalRest(recitals: readonly SalonRecital[], id: string, rest: unknown): SalonRecital[] {
  const next = restOf(rest);
  if (next === null) return readRecitals(recitals);
  return readRecitals(recitals).map((recital) => (recital.id === id && recital.rest !== next ? { ...recital, rest: next, audit: "rest" } : recital));
}

export function setRecitalPin(recitals: readonly SalonRecital[], id: string, pinned: boolean): SalonRecital[] {
  return readRecitals(recitals).map((recital) => (recital.id === id && recital.pinned !== pinned ? { ...recital, pinned, audit: pinned ? "pin" : "unpin" } : recital));
}

/** P toggles the pin on the focused row of the program currently shown. */
export function pinFocused(recitals: readonly SalonRecital[], shownIds: readonly string[], index: number): SalonRecital[] {
  if (!shownIds.length) return readRecitals(recitals);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readRecitals(recitals).find((recital) => recital.id === id);
  if (!row) return readRecitals(recitals);
  return setRecitalPin(recitals, id, !row.pinned);
}

export function setRecitalHold(recitals: readonly SalonRecital[], id: string, held: boolean): SalonRecital[] {
  return readRecitals(recitals).map((recital) => (recital.id === id && recital.held !== held ? { ...recital, held, audit: held ? "hold" : "lift" } : recital));
}

export function setRecitalClose(recitals: readonly SalonRecital[], id: string, closed: boolean): SalonRecital[] {
  return readRecitals(recitals).map((recital) => (recital.id === id && recital.closed !== closed ? { ...recital, closed, audit: closed ? "close" : "open" } : recital));
}

export function bulkRecitalHall(recitals: readonly SalonRecital[], ids: readonly string[], hall: unknown): SalonRecital[] {
  const next = hallOf(hall);
  if (!next) return readRecitals(recitals);
  const picked = new Set(ids);
  return readRecitals(recitals).map((recital) => (picked.has(recital.id) && recital.hall !== next ? { ...recital, hall: next, audit: "hall" } : recital));
}

export function bulkRecitalPin(recitals: readonly SalonRecital[], ids: readonly string[], pinned: boolean): SalonRecital[] {
  const picked = new Set(ids);
  return readRecitals(recitals).map((recital) => (picked.has(recital.id) && recital.pinned !== pinned ? { ...recital, pinned, audit: pinned ? "pin" : "unpin" } : recital));
}

export function bulkRecitalClose(recitals: readonly SalonRecital[], ids: readonly string[], closed: boolean): SalonRecital[] {
  const picked = new Set(ids);
  return readRecitals(recitals).map((recital) => (picked.has(recital.id) && recital.closed !== closed ? { ...recital, closed, audit: closed ? "close" : "open" } : recital));
}

export function bulkRecitalTag(recitals: readonly SalonRecital[], ids: readonly string[], tag: unknown): SalonRecital[] {
  return ids.reduce((rows, id) => addRecitalTag(rows, id, tag), readRecitals(recitals));
}

export function resetRecitals(): SalonRecital[] {
  return [];
}

function inTray(recital: SalonRecital, tray: RecTray): boolean {
  if (tray === "closed") return recital.closed;
  if (tray === "held") return recital.held && !recital.closed;
  return !recital.held && !recital.closed;
}

function bellHit(bell: number | null, exact: number | null, pick: BellPick | null): boolean {
  if (exact !== null) return bell === exact;
  if (pick === null) return true;
  if (pick === "blank") return bell === null;
  if (pick === "peak") return peakBell(bell);
  if (pick === "quiet") return quietBell(bell);
  return bellBand(bell) === pick;
}

/** An open recital whose bell sits more than two steps behind the desk bell. A rest, a hold, or a close is not late. */
export function lateRecital(recital: SalonRecital, desk: unknown): boolean {
  const gap = bellGap(recital.bell, desk);
  return inTray(recital, "open") && recital.rest === 0 && gap !== null && gap > 2;
}

/** An open recital with a span of 15 is due now. A rest, a hold, or a close is not. */
export function soonRecital(recital: SalonRecital): boolean {
  return inTray(recital, "open") && recital.rest === 0 && recital.span === 15;
}

/** Open recitals that are late or due now. A resting recital stays off the reminder list. */
export function reminderRecitals(recitals: readonly SalonRecital[], desk: unknown): SalonRecital[] {
  return readRecitals(recitals).filter((recital) => lateRecital(recital, desk) || soonRecital(recital));
}

/** Search matches the title, the note, the usher, and the tags. */
export function visibleRecitals(
  recitals: readonly SalonRecital[],
  tray: RecTray,
  query: string,
  usher: string | null,
  hall: string | null,
  cue: string | null,
  exact: number | null,
  pick: BellPick | null,
  candle: number | "blank" | null,
  span: number | "blank" | null,
  calledOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): SalonRecital[] {
  const text = query.trim().toLowerCase();
  return readRecitals(recitals).filter((recital) => {
    if (!inTray(recital, tray)) return false;
    if (text) {
      const hay = `${recital.title} ${recital.note} ${recital.usher} ${recital.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (usher !== null && recital.usher !== usher) return false;
    if (hall === "blank" ? Boolean(recital.hall) : hall && recital.hall !== hall) return false;
    if (cue === "blank" ? Boolean(recital.cue) : cue && recital.cue !== cue) return false;
    if (!bellHit(recital.bell, exact, pick)) return false;
    if (candle === "blank" ? recital.candle !== null : candle !== null && recital.candle !== candle) return false;
    if (span === "blank" ? recital.span !== null : span !== null && recital.span !== span) return false;
    if (calledOnly && recital.cue !== "called") return false;
    if (peakOnly && !peakBell(recital.bell)) return false;
    if (houseOnly && !houseHall(recital.hall)) return false;
    if (quietOnly && !quietBell(recital.bell)) return false;
    if (awakeOnly && recital.rest !== 0) return false;
    return true;
  });
}

export function sortRecitals(recitals: readonly SalonRecital[], mode: RecSort): SalonRecital[] {
  const rows = recitals.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.bell ?? 99) - (b.bell ?? 99));
  return rows.sort((a, b) => (a.bell ?? 99) - (b.bell ?? 99) || a.title.localeCompare(b.title));
}

export function recitalTimeline(recitals: readonly SalonRecital[], query: string): SalonRecital[] {
  const text = query.trim().toLowerCase();
  return sortRecitals(
    readRecitals(recitals).filter((recital) => recital.bell !== null && (!text || recital.title.toLowerCase().includes(text))),
    "bell",
  );
}

export function recitalCounts(recitals: readonly SalonRecital[], desk: unknown): RecCounts {
  const rows = readRecitals(recitals);
  return {
    open: rows.filter((recital) => inTray(recital, "open")).length,
    held: rows.filter((recital) => inTray(recital, "held")).length,
    closed: rows.filter((recital) => inTray(recital, "closed")).length,
    pinned: rows.filter((recital) => recital.pinned).length,
    peak: rows.filter((recital) => inTray(recital, "open") && recital.rest === 0 && peakBell(recital.bell)).length,
    late: rows.filter((recital) => lateRecital(recital, desk)).length,
    soon: rows.filter((recital) => soonRecital(recital)).length,
    rest: rows.filter((recital) => inTray(recital, "open") && recital.rest > 0).length,
    house: rows.filter((recital) => inTray(recital, "open") && houseHall(recital.hall)).length,
  };
}

export function recitalShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Distinct bells on open recitals. */
export function usedBells(recitals: readonly SalonRecital[]): number {
  const bells = new Set<number>();
  for (const recital of readRecitals(recitals)) {
    if (inTray(recital, "open") && recital.bell !== null) bells.add(recital.bell);
  }
  return bells.size;
}

/** Open recitals that share a bell and a hall. A different hall on the same bell is not a clash. */
export function clashBellCount(recitals: readonly SalonRecital[]): number {
  const groups = new Map<string, number>();
  for (const recital of readRecitals(recitals)) {
    if (!inTray(recital, "open") || recital.bell === null || !recital.hall) continue;
    const key = `${recital.bell}:${recital.hall}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open recitals that share a candle. An unset candle is not a clash. */
export function candleClashCount(recitals: readonly SalonRecital[]): number {
  const groups = new Map<number, number>();
  for (const recital of readRecitals(recitals)) {
    if (!inTray(recital, "open") || recital.candle === null) continue;
    groups.set(recital.candle, (groups.get(recital.candle) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * The hall with the fewest open recitals.
 * A tie keeps INK, then GOLD, then IVORY.
 * An empty desk still suggests INK.
 */
export function suggestHall(recitals: readonly SalonRecital[]): "INK" | "GOLD" | "IVORY" {
  const rows = readRecitals(recitals).filter((recital) => inTray(recital, "open"));
  const order = ["INK", "GOLD", "IVORY"] as const;
  let best: "INK" | "GOLD" | "IVORY" = "INK";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const hall of order) {
    const count = rows.filter((recital) => recital.hall === hall).length;
    if (count < bestCount) {
      best = hall;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open recitals.
 * A tie keeps 30, then 15, then 45.
 * An empty desk still suggests 30.
 */
export function suggestSpan(recitals: readonly SalonRecital[]): 15 | 30 | 45 {
  const rows = readRecitals(recitals).filter((recital) => inTray(recital, "open"));
  const order = [30, 15, 45] as const;
  let best: 15 | 30 | 45 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((recital) => recital.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open usher. A blank usher is skipped. An empty desk stays blank. */
export function suggestUsher(recitals: readonly SalonRecital[]): string {
  const found = readRecitals(recitals).find((recital) => inTray(recital, "open") && recital.usher);
  return found ? found.usher : "";
}

/**
 * The usher carrying the fewest open recitals.
 * A tie keeps the earlier name. A blank usher is not a load.
 * An empty roster falls back to the newest usher.
 */
export function fairUsher(recitals: readonly SalonRecital[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = usherLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestUsher(recitals);
  const open = readRecitals(recitals).filter((recital) => inTray(recital, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((recital) => recital.usher === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The usher with the most open recitals. A tie keeps the earlier name. */
export function busiestUsher(recitals: readonly SalonRecital[]): string {
  const rows = readRecitals(recitals).filter((recital) => inTray(recital, "open") && recital.usher);
  const names: string[] = [];
  for (const recital of rows) if (!names.includes(recital.usher)) names.push(recital.usher);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((recital) => recital.usher === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function recitalUshers(recitals: readonly SalonRecital[]): string[] {
  const out: string[] = [];
  for (const recital of readRecitals(recitals)) {
    if (recital.usher && !out.includes(recital.usher)) out.push(recital.usher);
  }
  return out;
}

export function recitalHalls(recitals: readonly SalonRecital[]): string[] {
  const out: string[] = [];
  for (const recital of readRecitals(recitals)) {
    if (recital.hall && !out.includes(recital.hall)) out.push(recital.hall);
  }
  return out;
}

/**
 * The next open recital at or after the desk bell.
 * A bowed cue, a rest, a hold, and a close stay off the list.
 * When every open bell is behind, the earliest bell is next.
 */
export function nextRecital(recitals: readonly SalonRecital[], desk: unknown): string {
  const now = bellOf(desk);
  if (now === null) return "";
  const waiting = readRecitals(recitals).filter((recital) => inTray(recital, "open") && recital.bell !== null && recital.cue !== "bowed" && recital.rest === 0);
  if (!waiting.length) return "";
  const byBell = (a: SalonRecital, b: SalonRecital) => (a.bell ?? 0) - (b.bell ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((recital) => (recital.bell ?? 0) >= now).sort(byBell);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBell)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function recitalCopy(recital: SalonRecital, desk: unknown): string {
  const gap = bellGap(recital.bell, desk);
  return [recital.title, recital.usher, recital.bell ?? "", recital.hall, recital.cue, recital.candle ?? "", recital.span ?? "", recital.tags.join(" "), recital.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the recitals saved in this browser. The gap and the late mark use the bell you pass. */
export function recitalsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,usher,bell,hall,cue,candle,span,tags,rest,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const recital of readRecitals(raw)) {
    const gap = bellGap(recital.bell, desk);
    lines.push([
      recital.title,
      recital.usher,
      recital.bell === null ? "" : String(recital.bell),
      recital.hall,
      recital.cue,
      recital.candle === null ? "" : String(recital.candle),
      recital.span === null ? "" : String(recital.span),
      recital.tags.join(" "),
      String(recital.rest),
      recital.pinned ? "1" : "0",
      recital.held ? "1" : "0",
      recital.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateRecital(recital, desk) ? "1" : "0",
      soonRecital(recital) ? "1" : "0",
      houseHall(recital.hall) ? "1" : "0",
      recital.note,
      recital.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeUsher(raw: string, ushers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return ushers.includes(raw) ? raw : "all";
}

export function activeHall(raw: string, halls: readonly string[]): string {
  if (raw === "blank") return "blank";
  const hall = hallOf(raw);
  return hall && halls.includes(hall) ? hall : "all";
}

export function activeCue(raw: string, cues: readonly string[]): string {
  if (raw === "blank") return "blank";
  const cue = cueName(raw);
  return cue && cues.includes(cue) ? cue : "all";
}

export function activeBell(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bell = bellOf(raw);
  return bell === null ? "all" : String(bell);
}

export function activeCandle(raw: string): string {
  if (raw === "blank") return "blank";
  const candle = candleOf(raw);
  return candle === null ? "all" : String(candle);
}

export function activeSpan(raw: string): string {
  if (raw === "blank") return "blank";
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function usherArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function hallArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return hallOf(filter) || null;
}

export function cueArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cueName(filter) || null;
}

export function bellArg(filter: string): { exact: number | null; pick: BellPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bellOf(filter), pick: null };
}

export function candleArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return candleOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

function readView(raw: unknown): RecView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<RecView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    usher: row.usher === "blank" ? "blank" : clip(row.usher, 18) || "all",
    hall: row.hall === "blank" || row.hall === "all" ? (row.hall === "blank" ? "blank" : "all") : hallOf(row.hall) || "all",
    cue: row.cue === "blank" || row.cue === "all" ? (row.cue === "blank" ? "blank" : "all") : cueName(row.cue) || "all",
    bell: activeBell(String(row.bell || "all")),
    candle: activeCandle(String(row.candle || "all")),
    span: activeSpan(String(row.span || "all")),
  };
}

export function readRecitalViews(raw: unknown): RecView[] {
  if (!Array.isArray(raw)) return [];
  const out: RecView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addRecitalView(views: readonly RecView[], view: RecView): RecView[] {
  const current = readRecitalViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropRecitalView(views: readonly RecView[], id: string): RecView[] {
  return readRecitalViews(views).filter((view) => view.id !== id);
}

function sealBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function sealText(value: SealValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: sealBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (SEAL_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("username" in value)) return { text: null, explicit: false };
  const inner = value.username;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: sealBody(inner), explicit: true };
}

export function sealState(value: SealValue): SealState {
  const found = sealText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function sealCopy(value: SealValue): string {
  const found = sealText(value);
  if (!found.text) return "";
  return found.text.slice(0, 64);
}

/**
 * A seal is the first letter and the last letter of the username.
 * Digits and spaces are skipped. A one-letter username is a single letter.
 * A username with no letter has no seal.
 */
export function sealOf(value: SealValue): string {
  const text = sealCopy(value);
  if (!text) return "";
  const letters = text.match(/[A-Za-z]/g);
  if (!letters || !letters.length) return "";
  const first = letters[0].toUpperCase();
  if (letters.length === 1) return first;
  return first + letters[letters.length - 1].toUpperCase();
}

/** One letter is a dot. Two letters are a bar. No letter has no band. */
export function sealBand(value: SealValue): SealBand {
  const mark = sealOf(value);
  if (mark.length === 1) return "dot";
  if (mark.length === 2) return "bar";
  return "";
}

/** A digit in the username makes the seal cipher. Letters without a digit are plain. */
export function sealTone(value: SealValue): SealTone {
  const text = sealCopy(value);
  if (!text || !sealOf(value)) return "";
  return /\d/.test(text) ? "cipher" : "plain";
}

/** AA, NA, and LE are the house catalog. Any other seal is not. */
export function catalogSeal(value: SealValue): boolean {
  return CATALOG.has(sealOf(value));
}

export function catalogSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => catalogSeal(row.note)).length;
}

export function barSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealBand(row.note) === "bar").length;
}

export function plainSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealTone(row.note) === "plain").length;
}

/** Customers whose seal is shared with at least one other customer. */
export function sharedSealCount(rows: readonly SealRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = sealOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function sealBands(rows: readonly SealRow[]): SealBandLine[] {
  return SEAL_BANDS.map((band) => ({ band, count: rows.filter((row) => sealBand(row.note) === band).length }));
}

/** The band with the most set usernames. A tie keeps dot, then bar. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const lines = sealBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || SEAL_BANDS.indexOf(a.band as (typeof SEAL_BANDS)[number]) - SEAL_BANDS.indexOf(b.band as (typeof SEAL_BANDS)[number]))[0].band;
}

/** The tone with the most set usernames. A tie keeps plain. */
export function leadingSealTone(rows: readonly SealRow[]): string {
  const plain = plainSealCount(rows);
  const cipher = rows.filter((row) => sealTone(row.note) === "cipher").length;
  if (!plain && !cipher) return "";
  return plain >= cipher ? "plain" : "cipher";
}

export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentSeals(rows: readonly SealRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = sealState(row.note);
    const band = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleSeal(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleSealReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSealBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleSealCustomers(
  rows: readonly SealRow[],
  band: SealBand | "blank" | null,
  tone: SealTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: SealShape,
): SealRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = sealState(row.note);
    const mark = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && sealTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogSeal(row.note)) return false;
    if (shape === "bar" && sealBand(row.note) !== "bar") return false;
    if (shape === "plain" && sealTone(row.note) !== "plain") return false;
    if (text) {
      const hay = `${row.label || ""} ${sealCopy(row.note)} ${sealOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeSealBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeSealTone(raw: string): string {
  return raw === "cipher" || raw === "plain" ? raw : "all";
}

export function sealBandArg(filter: string): SealBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "dot" || filter === "bar") return filter;
  return null;
}

export function sealToneArg(filter: string): SealTone | null {
  if (filter === "cipher" || filter === "plain") return filter;
  return null;
}

export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of sealBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogSealCount(rows)}`);
  lines.push(`tone,plain,${plainSealCount(rows)}`);
  lines.push(`tone,cipher,${rows.filter((row) => sealTone(row.note) === "cipher").length}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,band,tone,catalog,reviewed"];
  for (const row of rows) {
    const state = sealState(row.note);
    const band = state === "set" ? sealBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      sealOf(row.note),
      band,
      state === "set" ? sealTone(row.note) : "",
      catalogSeal(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
