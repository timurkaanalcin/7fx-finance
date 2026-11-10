/**
 * Escort slips for the concierge desk, and the retention note already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_escort_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   guide text not null default '',
 *   bell integer,
 *   cloth text not null default '',
 *   bay text not null default '',
 *   step text not null default '',
 *   weight integer,
 *   length integer,
 *   tags text not null default '',
 *   quiet integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_note_ribbon_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_note_ribbon_review (
 *   customer_id text primary key
 * );
 */

export const ESL_KEY = "crmv4-escort-slip";
export const ESL_VIEW_KEY = "crmv4-escort-views";
export const ESL_DENSITY_KEY = "crmv4-escort-density";
export const RIBBON_KEY = "crmv4-note-ribbon-hide";
export const RIBBON_REVIEW_KEY = "crmv4-note-ribbon-review";

export type EslCloth = "blank" | "linen" | "silk" | "wool" | "velvet";

export type EslStep = "blank" | "knock" | "walk" | "rest";

export type EslTray = "open" | "held" | "closed";

export type BellPick = "blank" | "morning" | "noon" | "evening" | "chime" | "hush";

export type EslDensity = "roomy" | "tight";

export type EslSort = "bell" | "title";

export type EscortSlip = {
  id: string;
  title: string;
  note: string;
  guide: string;
  bell: number | null;
  cloth: string;
  bay: string;
  step: string;
  weight: number | null;
  length: number | null;
  tags: string[];
  quiet: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type EslView = {
  id: string;
  name: string;
  tray: EslTray;
  query: string;
  guide: string;
  cloth: string;
  bay: string;
  step: string;
  bell: string;
  weight: string;
  length: string;
};

export type EslCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  chime: number;
  late: number;
  soon: number;
  quiet: number;
  house: number;
};

export type RibbonState = "" | "set" | "clear";

export type RibbonBand = "" | "brief" | "page" | "scroll";

export type RibbonTone = "" | "soft" | "hard";

export type RibbonShape = "all" | "catalog" | "scroll" | "soft";

export type RibbonValue =
  | { retentionNote?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type RibbonRow = { id: string; note?: RibbonValue; label?: string | null };

export type RibbonBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "step", "pin", "unpin", "hold", "lift", "close", "reopen", "cloth", "tag", "quiet"] as const;

const CLOTHS = ["linen", "silk", "wool", "velvet"] as const;

const STEPS = ["knock", "walk", "rest"] as const;

const STEP_ORDER = ["", "knock", "walk", "rest"] as const;

const BELL_PICKS = ["blank", "morning", "noon", "evening", "chime", "hush"] as const;

const CHIME_BELLS = new Set([3, 6, 9, 12]);

const HUSH_BELLS = new Set([1, 2]);

const HOUSE = new Set(["NTH", "STH", "EST"]);

const RIBBON_BANDS = ["brief", "page", "scroll"] as const;

const CATALOG = new Set(["CALL", "WORD", "FILE"]);

const RIBBON_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const SLIP_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): EslTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<EslCloth, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<EslCloth, "blank">) : "";
}

function stepName(raw: unknown): Exclude<EslStep, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (STEPS as readonly string[]).includes(text) ? (text as Exclude<EslStep, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank guide stays blank. It is not filled in. */
export function guideLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A bay is three letters. Anything else stays blank. Letters are stored in capitals. */
export function bayOf(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
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
  const text = clip(raw, 4);
  if (!/^[1-9]\d?$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= 12 ? value : null;
}

/** A weight is 1, 3, or 5. A blank value stays unset. A leading zero is not a weight. */
export function weightOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

/** A length is 10, 20, or 40. A blank value stays unset. A leading zero is not a length. */
export function lengthOf(raw: unknown): 10 | 20 | 40 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** A quiet mark is 0, 10, or 20. Anything else stays unset. */
export function quietOf(raw: unknown): 0 | 10 | 20 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  return null;
}

/** Morning is 1 through 4. Noon is 5 through 8. Evening is 9 through 12. */
export function bellBand(bell: unknown): "blank" | "morning" | "noon" | "evening" {
  const value = bellOf(bell);
  if (value === null) return "blank";
  if (value <= 4) return "morning";
  if (value <= 8) return "noon";
  return "evening";
}

/** Chime bells are 3, 6, 9, and 12. An unset bell is not a chime. */
export function chimeBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && CHIME_BELLS.has(value);
}

/** Hush bells are 1 and 2. A chime bell is not hush. An unset bell is not hush. */
export function hushBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && HUSH_BELLS.has(value);
}

/**
 * The shortest signed step from the saved bell to the typed bell.
 * The ring wraps at 12. A step of 6 stays. A step of -6 stays.
 */
export function bellGap(bell: unknown, desk: unknown): number | null {
  const from = bellOf(bell);
  const at = bellOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

/** NTH, STH, and EST are house bays. A blank bay is not. */
export function houseBay(bay: unknown): boolean {
  return HOUSE.has(bayOf(bay));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): EslDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Bell or title. Anything else stays on the bell. */
export function sortMode(raw: unknown): EslSort {
  return raw === "title" ? "title" : "bell";
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

function readOne(raw: unknown): EscortSlip | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<EscortSlip>;
  const id = clip(row.id, 24);
  const title = slipLine(row.title);
  if (!id || !title) return null;
  const quiet = quietOf(row.quiet);
  return {
    id,
    title,
    note: slipNote(row.note),
    guide: guideLabel(row.guide),
    bell: bellOf(row.bell),
    cloth: clothName(row.cloth),
    bay: bayOf(row.bay),
    step: stepName(row.step),
    weight: weightOf(row.weight),
    length: lengthOf(row.length),
    tags: tagsOf(row.tags),
    quiet: quiet === null ? 0 : quiet,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readSlips(raw: unknown): EscortSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: EscortSlip[] = [];
  for (const item of raw) {
    const slip = readOne(item);
    if (!slip || out.some((row) => row.id === slip.id || row.title === slip.title)) continue;
    out.push(slip);
  }
  return out.slice(0, SLIP_CAP);
}

export function addSlip(
  slips: readonly EscortSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    guide?: string;
    bell?: unknown;
    cloth?: string;
    bay?: string;
    step?: string;
    weight?: unknown;
    length?: unknown;
    tags?: unknown;
    quiet?: unknown;
  },
): EscortSlip[] {
  const current = readSlips(slips);
  const id = String(slip.id || "").trim();
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const quiet = quietOf(slip.quiet);
  const next: EscortSlip = {
    id,
    title,
    note: slipNote(slip.note),
    guide: guideLabel(slip.guide),
    bell: bellOf(slip.bell),
    cloth: clothName(slip.cloth),
    bay: bayOf(slip.bay),
    step: stepName(slip.step),
    weight: weightOf(slip.weight),
    length: lengthOf(slip.length),
    tags: tagsOf(slip.tags),
    quiet: quiet === null ? 0 : quiet,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

export function cycleStep(slips: readonly EscortSlip[], id: string): EscortSlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const at = STEP_ORDER.indexOf(slip.step as (typeof STEP_ORDER)[number]);
    const next = at < 0 || at >= STEPS.length ? STEPS[0] : STEPS[at % STEPS.length];
    if (!next || next === slip.step) return slip;
    return { ...slip, step: next, audit: "step" };
  });
}

export function setSlipPin(slips: readonly EscortSlip[], id: string, pinned: boolean): EscortSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

export function setSlipHold(slips: readonly EscortSlip[], id: string, held: boolean): EscortSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, held, audit: held ? "hold" : "lift" } : slip));
}

export function setSlipClose(slips: readonly EscortSlip[], id: string, closed: boolean): EscortSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, closed, audit: closed ? "close" : "reopen" } : slip));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSlip(slips: readonly EscortSlip[], id: string, title: string): EscortSlip[] {
  const current = readSlips(slips);
  const next = slipLine(title);
  if (!next || current.some((slip) => slip.id !== id && slip.title === next)) return current;
  return current.map((slip) => (slip.id === id && slip.title !== next ? { ...slip, title: next, audit: "edit" } : slip));
}

/** A blank note is left out. The same note is left as it is. */
export function editSlipNote(slips: readonly EscortSlip[], id: string, note: string): EscortSlip[] {
  const current = readSlips(slips);
  const next = slipNote(note);
  if (!next) return current;
  return current.map((slip) => (slip.id === id && slip.note !== next ? { ...slip, note: next, audit: "edit" } : slip));
}

/** A tag that is already on the slip, or a fourth tag, is left out. */
export function addSlipTag(slips: readonly EscortSlip[], id: string, tag: unknown): EscortSlip[] {
  const next = tagOf(tag);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => {
    if (slip.id !== id || slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** An unknown quiet mark is left as it is. 0 clears the quiet mark. */
export function setSlipQuiet(slips: readonly EscortSlip[], id: string, quiet: unknown): EscortSlip[] {
  const next = quietOf(quiet);
  if (next === null) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.quiet !== next ? { ...slip, quiet: next, audit: "quiet" } : slip));
}

export function bulkSlipCloth(slips: readonly EscortSlip[], ids: readonly string[], cloth: unknown): EscortSlip[] {
  const next = clothName(cloth);
  if (!next) return readSlips(slips);
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.cloth !== next ? { ...slip, cloth: next, audit: "cloth" } : slip));
}

export function bulkSlipPin(slips: readonly EscortSlip[], ids: readonly string[], pinned: boolean): EscortSlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

export function bulkSlipClose(slips: readonly EscortSlip[], ids: readonly string[], closed: boolean): EscortSlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.closed !== closed ? { ...slip, closed, audit: closed ? "close" : "reopen" } : slip));
}

export function bulkSlipTag(slips: readonly EscortSlip[], ids: readonly string[], tag: unknown): EscortSlip[] {
  return ids.reduce((rows, id) => addSlipTag(rows, id, tag), readSlips(slips));
}

export function resetSlips(): EscortSlip[] {
  return [];
}

function inTray(slip: EscortSlip, tray: EslTray): boolean {
  if (tray === "closed") return slip.closed;
  if (tray === "held") return slip.held && !slip.closed;
  return !slip.held && !slip.closed;
}

function bellHit(bell: number | null, exact: number | null, pick: BellPick | null): boolean {
  if (exact !== null) return bell === exact;
  if (pick === null) return true;
  if (pick === "blank") return bell === null;
  if (pick === "chime") return chimeBell(bell);
  if (pick === "hush") return hushBell(bell);
  return bellBand(bell) === pick;
}

/** An open slip whose bell sits more than four steps behind the desk bell. A quiet mark, a hold, or a close is not late. */
export function lateSlip(slip: EscortSlip, desk: unknown): boolean {
  const gap = bellGap(slip.bell, desk);
  return inTray(slip, "open") && slip.quiet === 0 && gap !== null && gap > 4;
}

/** An open slip with a length of 10 is the reminder. A quiet mark, a hold, or a close is not. */
export function soonSlip(slip: EscortSlip): boolean {
  return inTray(slip, "open") && slip.quiet === 0 && slip.length === 10;
}

/** Open slips that are late or soon. A quiet slip stays off the reminder list. */
export function reminderSlips(slips: readonly EscortSlip[], desk: unknown): EscortSlip[] {
  return readSlips(slips).filter((slip) => lateSlip(slip, desk) || soonSlip(slip));
}

/** Search matches the title, the note, the guide, and the tags. */
export function visibleSlips(
  slips: readonly EscortSlip[],
  tray: EslTray,
  query: string,
  guide: string | null,
  cloth: EslCloth | null,
  bay: string | null,
  step: EslStep | null,
  exact: number | null,
  pick: BellPick | null,
  weight: number | "blank" | null,
  length: number | "blank" | null,
  walkingOnly: boolean,
  chimeOnly: boolean,
  houseOnly: boolean,
  hushOnly: boolean,
  awakeOnly: boolean,
): EscortSlip[] {
  const text = query.trim().toLowerCase();
  return readSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text) {
      const hay = `${slip.title} ${slip.note} ${slip.guide} ${slip.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (guide === "") {
      if (slip.guide) return false;
    } else if (guide && slip.guide !== guide) return false;
    if (cloth === "blank") {
      if (slip.cloth) return false;
    } else if (cloth && slip.cloth !== cloth) return false;
    if (bay === "") {
      if (slip.bay) return false;
    } else if (bay && slip.bay !== bay) return false;
    if (step === "blank") {
      if (slip.step) return false;
    } else if (step && slip.step !== step) return false;
    if (!bellHit(slip.bell, exact, pick)) return false;
    if (weight === "blank") {
      if (slip.weight !== null) return false;
    } else if (typeof weight === "number" && slip.weight !== weight) return false;
    if (length === "blank") {
      if (slip.length !== null) return false;
    } else if (typeof length === "number" && slip.length !== length) return false;
    if (walkingOnly && slip.step !== "walk") return false;
    if (chimeOnly && !chimeBell(slip.bell)) return false;
    if (houseOnly && !houseBay(slip.bay)) return false;
    if (hushOnly && !hushBell(slip.bell)) return false;
    if (awakeOnly && slip.quiet !== 0) return false;
    return true;
  });
}

export function slipCounts(slips: readonly EscortSlip[], desk: unknown): EslCounts {
  const rows = readSlips(slips);
  return {
    open: rows.filter((slip) => inTray(slip, "open")).length,
    held: rows.filter((slip) => inTray(slip, "held")).length,
    closed: rows.filter((slip) => inTray(slip, "closed")).length,
    pinned: rows.filter((slip) => slip.pinned).length,
    chime: rows.filter((slip) => chimeBell(slip.bell) && inTray(slip, "open")).length,
    late: rows.filter((slip) => lateSlip(slip, desk)).length,
    soon: rows.filter((slip) => soonSlip(slip)).length,
    quiet: rows.filter((slip) => inTray(slip, "open") && slip.quiet !== 0).length,
    house: rows.filter((slip) => houseBay(slip.bay)).length,
  };
}

export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function sortSlips(slips: readonly EscortSlip[], mode: EslSort): EscortSlip[] {
  const rows = slips.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.bell ?? 99) - (b.bell ?? 99));
  return rows.sort((a, b) => (a.bell ?? 99) - (b.bell ?? 99) || a.title.localeCompare(b.title));
}

export function slipTimeline(slips: readonly EscortSlip[], query: string): EscortSlip[] {
  const text = query.trim().toLowerCase();
  return sortSlips(
    readSlips(slips).filter((slip) => slip.bell !== null && (!text || slip.title.toLowerCase().includes(text))),
    "bell",
  );
}

/** Distinct bells on open slips. */
export function usedBells(slips: readonly EscortSlip[]): number {
  const bells = new Set<number>();
  for (const slip of readSlips(slips)) {
    if (inTray(slip, "open") && slip.bell !== null) bells.add(slip.bell);
  }
  return bells.size;
}

/** Open slips that share a bell and a cloth. A different cloth on the same bell is not a clash. */
export function clashBellCount(slips: readonly EscortSlip[]): number {
  const groups = new Map<string, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.bell === null || !slip.cloth) continue;
    const key = `${slip.bell}:${slip.cloth}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open slips that share a weight. An unset weight is not a clash. */
export function weightClashCount(slips: readonly EscortSlip[]): number {
  const groups = new Map<number, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.weight === null) continue;
    groups.set(slip.weight, (groups.get(slip.weight) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * The next open slip at or after the desk bell.
 * A rest step, a quiet mark, a hold, or a close is not next.
 * When every waiting bell is earlier, the earliest bell wraps around.
 */
export function nextSlip(slips: readonly EscortSlip[], desk: unknown): string {
  const now = bellOf(desk);
  if (now === null) return "";
  const waiting = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bell !== null && slip.step !== "rest" && slip.quiet === 0);
  if (!waiting.length) return "";
  const byBell = (a: EscortSlip, b: EscortSlip) => (a.bell ?? 0) - (b.bell ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((slip) => (slip.bell ?? 0) >= now).sort(byBell);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBell)[0].id;
}

/**
 * The cloth with the fewest open slips.
 * A tie keeps linen, then silk, then wool, then velvet.
 * An empty desk still suggests linen.
 */
export function suggestCloth(slips: readonly EscortSlip[]): Exclude<EslCloth, "blank"> {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  let best: Exclude<EslCloth, "blank"> = "linen";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of CLOTHS) {
    const count = rows.filter((slip) => slip.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The guide carrying the fewest open slips.
 * A tie keeps the earlier name. A blank guide is not a load.
 * An empty desk stays blank.
 */
export function suggestGuide(slips: readonly EscortSlip[]): string {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.guide);
  const names: string[] = [];
  for (const slip of rows) if (!names.includes(slip.guide)) names.push(slip.guide);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((slip) => slip.guide === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The length with the fewest open slips.
 * A tie keeps 20, then 10, then 40.
 * An empty desk suggests 20.
 */
export function suggestLength(slips: readonly EscortSlip[]): 10 | 20 | 40 {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = [20, 10, 40] as const;
  let best: 10 | 20 | 40 = 20;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const length of order) {
    const count = rows.filter((slip) => slip.length === length).length;
    if (count < bestCount) {
      best = length;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name carrying the fewest open slips.
 * A tie keeps the earlier name in the roster.
 * A blank roster falls back to the suggested guide.
 */
export function fairGuide(slips: readonly EscortSlip[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = guideLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestGuide(slips);
  const open = readSlips(slips).filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.guide === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The guide on the most open slips. A tie keeps the earlier name. */
export function busiestGuide(slips: readonly EscortSlip[]): string {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.guide);
  const names: string[] = [];
  for (const slip of rows) if (!names.includes(slip.guide)) names.push(slip.guide);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((slip) => slip.guide === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function slipGuides(slips: readonly EscortSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) if (slip.guide && !out.includes(slip.guide)) out.push(slip.guide);
  return out;
}

export function slipBays(slips: readonly EscortSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) if (slip.bay && !out.includes(slip.bay)) out.push(slip.bay);
  return out;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function slipCopy(slip: EscortSlip, desk: unknown): string {
  const gap = bellGap(slip.bell, desk);
  return [slip.title, slip.guide, slip.bell ?? "", slip.cloth, slip.bay, slip.step, slip.weight ?? "", slip.length ?? "", slip.tags.join(" "), slip.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bell you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,guide,bell,cloth,bay,step,weight,length,tags,quiet,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const slip of readSlips(raw)) {
    const gap = bellGap(slip.bell, desk);
    lines.push([
      csvCell(slip.title),
      csvCell(slip.guide),
      slip.bell === null ? "" : String(slip.bell),
      slip.cloth,
      csvCell(slip.bay),
      slip.step,
      slip.weight === null ? "" : String(slip.weight),
      slip.length === null ? "" : String(slip.length),
      csvCell(slip.tags.join(" ")),
      String(slip.quiet),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, desk) ? "1" : "0",
      soonSlip(slip) ? "1" : "0",
      houseBay(slip.bay) ? "1" : "0",
      csvCell(slip.note),
      slip.audit,
    ].join(","));
  }
  return lines.join("\n");
}

function guideSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return guideLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function baySlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bayOf(raw) || "all";
}

function stepSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stepName(raw) || "all";
}

function bellSlot(raw: unknown): string {
  if (raw === "all") return "all";
  return (BELL_PICKS as readonly string[]).includes(String(raw)) ? String(raw) : "all";
}

function weightSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return raw === "1" || raw === "3" || raw === "5" ? raw : "all";
}

function lengthSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return raw === "10" || raw === "20" || raw === "40" ? raw : "all";
}

export function activeGuide(filter: string, guides: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const name = guideLabel(filter);
  return name && guides.includes(name) ? name : "all";
}

export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function activeBay(filter: string, bays: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bay = bayOf(filter);
  return bay && bays.includes(bay) ? bay : "all";
}

export function activeStep(filter: string, steps: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const step = stepName(filter);
  return step && steps.includes(step) ? step : "all";
}

export function activeBell(filter: string): string {
  return bellSlot(filter);
}

export function activeWeight(filter: string): string {
  return weightSlot(filter);
}

export function activeLength(filter: string): string {
  return lengthSlot(filter);
}

export function guideArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return guideLabel(filter) || null;
}

export function clothArg(filter: string): EslCloth | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const cloth = clothName(filter);
  return cloth || null;
}

export function bayArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return bayOf(filter) || null;
}

export function stepArg(filter: string): EslStep | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const step = stepName(filter);
  return step || null;
}

export function bellArg(filter: string): { exact: number | null; pick: BellPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if ((BELL_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as BellPick };
  const exact = bellOf(filter);
  return exact === null ? { exact: null, pick: null } : { exact, pick: null };
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

export function lengthArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lengthOf(filter);
}

function readView(raw: unknown): EslView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<EslView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    guide: guideSlot(row.guide),
    cloth: clothSlot(row.cloth),
    bay: baySlot(row.bay),
    step: stepSlot(row.step),
    bell: bellSlot(row.bell),
    weight: weightSlot(row.weight),
    length: lengthSlot(row.length),
  };
}

export function readSlipViews(raw: unknown): EslView[] {
  if (!Array.isArray(raw)) return [];
  const out: EslView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly EslView[], view: EslView): EslView[] {
  const current = readSlipViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly EslView[], id: string): EslView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

function ribbonBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function ribbonBlocked(value: object): boolean {
  return RIBBON_BLOCK.some((key) => key in value);
}

function ribbonText(value: RibbonValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: ribbonBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (ribbonBlocked(value)) return { text: null, explicit: false };
  if (!("retentionNote" in value)) return { text: null, explicit: false };
  const inner = value.retentionNote;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: ribbonBody(inner), explicit: true };
}

/** Letters only, spaces and hyphens ignored, stored in capitals. */
export function ribbonToken(raw: unknown): string {
  return ribbonBody(raw).replace(/[\s-]+/g, "").toUpperCase();
}

export function ribbonState(value: RibbonValue): RibbonState {
  const found = ribbonText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function ribbonCopy(value: RibbonValue): string {
  const found = ribbonText(value);
  if (!found.text) return "";
  return found.text.slice(0, 48);
}

export function ribbonBand(value: RibbonValue): RibbonBand {
  const text = ribbonCopy(value);
  if (!text) return "";
  const full = ribbonText(value).text || "";
  if (full.length <= 8) return "brief";
  if (full.length <= 24) return "page";
  return "scroll";
}

export function ribbonTone(value: RibbonValue): RibbonTone {
  const text = ribbonCopy(value);
  if (!text) return "";
  const first = text[0] || "";
  if (/[a-z]/.test(first)) return "soft";
  if (/[A-Z]/.test(first)) return "hard";
  return "";
}

export function catalogRibbon(value: RibbonValue): boolean {
  const found = ribbonText(value);
  if (!found.text) return false;
  return CATALOG.has(ribbonToken(found.text));
}

export function catalogRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => catalogRibbon(row.note)).length;
}

export function scrollRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonBand(row.note) === "scroll").length;
}

export function softRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonTone(row.note) === "soft").length;
}

export function sharedRibbonCount(rows: readonly RibbonRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const token = ribbonToken(ribbonCopy(row.note));
    if (!token) continue;
    groups.set(token, (groups.get(token) || 0) + 1);
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

/** The band with the most set notes. A tie keeps brief, then page, then scroll. */
export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const lines = ribbonBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RIBBON_BANDS.indexOf(a.band as (typeof RIBBON_BANDS)[number]) - RIBBON_BANDS.indexOf(b.band as (typeof RIBBON_BANDS)[number]))[0].band;
}

/** The tone with the most set notes. A tie keeps soft. */
export function leadingRibbonTone(rows: readonly RibbonRow[]): string {
  const soft = softRibbonCount(rows);
  const hard = rows.filter((row) => ribbonTone(row.note) === "hard").length;
  if (!soft && !hard) return "";
  return soft >= hard ? "soft" : "hard";
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
  const out: string[] = [];
  for (const item of raw) {
    const band = clip(item, 12);
    if (present.includes(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function toggleRibbon(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  if (!present.includes(band)) return readHiddenRibbons(hidden, present);
  const current = readHiddenRibbons(hidden, present);
  return current.includes(band) ? current.filter((item) => item !== band) : [...current, band];
}

export function visibleRibbonBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const folded = new Set(hidden);
  return present.filter((band) => !folded.has(band));
}

export function readReviewedRibbons(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleRibbonReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const current = readReviewedRibbons(reviewed, ids);
  if (!ids.includes(id)) return current;
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

export function bulkRibbonReview(reviewed: readonly string[], picked: readonly string[], ids: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedRibbons(reviewed, ids));
  for (const id of picked) {
    if (!ids.includes(id)) continue;
    if (on) current.add(id);
    else current.delete(id);
  }
  const next: string[] = [];
  current.forEach((id) => next.push(id));
  return readReviewedRibbons(next, ids);
}

export function activeRibbonBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (RIBBON_BANDS as readonly string[]).includes(filter) && present.includes(filter) ? filter : "all";
}

export function activeRibbonTone(filter: string): string {
  return filter === "soft" || filter === "hard" || filter === "all" ? filter : "all";
}

export function ribbonBandArg(filter: string): RibbonBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return filter === "brief" || filter === "page" || filter === "scroll" ? filter : null;
}

export function ribbonToneArg(filter: string): RibbonTone | null {
  if (filter === "all") return null;
  return filter === "soft" || filter === "hard" ? filter : null;
}

export function visibleRibbonCustomers(
  rows: readonly RibbonRow[],
  band: RibbonBand | "blank" | null,
  tone: RibbonTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: RibbonShape,
): RibbonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = ribbonState(row.note);
    const mark = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    if (!mark) return false;
    if (band === "blank" && mark !== "blank") return false;
    if (band && band !== "blank" && mark !== band) return false;
    if (tone && ribbonTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogRibbon(row.note)) return false;
    if (shape === "scroll" && ribbonBand(row.note) !== "scroll") return false;
    if (shape === "soft" && ribbonTone(row.note) !== "soft") return false;
    if (review === "reviewed" && !seen.has(row.id || "")) return false;
    if (review === "open" && seen.has(row.id || "")) return false;
    if (!text) return true;
    const hay = `${row.label || ""} ${ribbonCopy(row.note)}`.toLowerCase();
    return hay.includes(text);
  });
}

export function ribbonsCsv(rows: readonly RibbonRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of ribbonBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`tone,soft,${softRibbonCount(rows)}`);
  lines.push(`tone,hard,${rows.filter((row) => ribbonTone(row.note) === "hard").length}`);
  lines.push(`catalog,house,${catalogRibbonCount(rows)}`);
  lines.push(`shared,note,${sharedRibbonCount(rows)}`);
  return lines.join("\n");
}

export function ribbonRowsCsv(rows: readonly RibbonRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,note,band,tone,catalog,reviewed"];
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(ribbonCopy(row.note)),
      ribbonBand(row.note) || (ribbonState(row.note) === "clear" ? "blank" : ""),
      ribbonTone(row.note),
      catalogRibbon(row.note) ? "1" : "0",
      seen.has(row.id || "") ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
