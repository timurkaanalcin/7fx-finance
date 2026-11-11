/**
 * Apse alcoves for the customers desk, and browser crests already stored as lastBrowser on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_apse_alcove (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   pew integer,
 *   cloth text not null default '',
 *   hush text not null default '',
 *   lamp integer,
 *   wait integer,
 *   tags text not null default '',
 *   gilt integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_browser_crest_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_browser_crest_review (
 *   customer_id text primary key
 * );
 */

export const APS_KEY = "crmv4-apse-alcove";
export const APS_VIEW_KEY = "crmv4-apse-views";
export const APS_DENSITY_KEY = "crmv4-apse-density";
export const BRC_KEY = "crmv4-browser-hide";
export const BRC_REVIEW_KEY = "crmv4-browser-review";

export type ClothName = "blank" | "linen" | "slate" | "champagne";

export type HushName = "blank" | "hush" | "talk" | "call";

export type AlcoveTray = "open" | "held" | "closed";

export type PewPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type AlcoveDensity = "roomy" | "tight";

export type AlcoveSort = "pew" | "keeper";

export type ApseAlcove = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  pew: number | null;
  cloth: string;
  hush: string;
  lamp: number | null;
  wait: number | null;
  tags: string[];
  gilt: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type AlcoveView = {
  id: string;
  name: string;
  tray: AlcoveTray;
  query: string;
  keeper: string;
  cloth: string;
  hush: string;
  pew: string;
  lamp: string;
  wait: string;
};

export type AlcoveCounts = {
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

const AUDITS = ["save", "edit", "hush", "pin", "unpin", "hold", "lift", "close", "open", "cloth", "tag", "gilt"] as const;

const CLOTHS = ["linen", "slate", "champagne"] as const;

const HUSHES = ["hush", "talk", "call"] as const;

const HUSH_ORDER = ["", "hush", "talk", "call"] as const;

const PEAK_PEWS = new Set([2, 6]);

const QUIET_PEWS = new Set([1, 5]);

const HOUSE = new Set(["LINEN", "CHAMPAGNE"]);

const ALCOVE_CAP = 8;

const VIEW_CAP = 6;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AlcoveTray {
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

function hushNameOf(raw: unknown): Exclude<HushName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HUSHES as readonly string[]).includes(text) ? (text as Exclude<HushName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function alcoveLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function alcoveNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A cloth is LINEN, SLATE, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A pew is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a pew.
 * A second digit is not a pew.
 */
export function pewOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A lamp is 2, 4, or 8. A blank value stays unset. A leading zero is not a lamp. */
export function lampOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  const text = clip(raw, 1);
  if (text === "2") return 2;
  if (text === "4") return 4;
  if (text === "8") return 8;
  return null;
}

/** A wait is 15, 30, or 60. A blank value stays unset. A leading zero is not a wait. */
export function waitOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  const text = clip(raw, 2);
  if (text === "15") return 15;
  if (text === "30") return 30;
  if (text === "60") return 60;
  return null;
}

/** A gilt is 0, 2, or 4. Anything else is not a gilt. 0 clears the gilt. */
export function giltOf(raw: unknown): 0 | 2 | 4 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  return null;
}

export function pewBand(pew: unknown): "blank" | "early" | "mid" | "late" {
  const value = pewOf(pew);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak pews are 2 and 6. An unset pew is not a peak pew. */
export function peakPew(pew: unknown): boolean {
  const value = pewOf(pew);
  return value !== null && PEAK_PEWS.has(value);
}

/** Quiet pews are 1 and 5. A peak pew is not quiet. An unset pew is not quiet. */
export function quietPew(pew: unknown): boolean {
  const value = pewOf(pew);
  return value !== null && QUIET_PEWS.has(value);
}

/**
 * How far a pew sits behind the desk pew.
 * A positive gap means the alcove pew is behind. A negative gap means it is ahead.
 * A gap of zero means the same pew. An unset pew has no gap. Pews do not wrap.
 */
export function pewGap(pew: unknown, desk: unknown): number | null {
  const from = pewOf(pew);
  const at = pewOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** LINEN and CHAMPAGNE are house cloths. SLATE is a guest cloth. A blank cloth is not a house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): AlcoveDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Pew or keeper. Anything else stays on the pew. */
export function sortMode(raw: unknown): AlcoveSort {
  return raw === "keeper" ? "keeper" : "pew";
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

function readOne(raw: unknown): ApseAlcove | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ApseAlcove>;
  const id = clip(row.id, 24);
  const title = alcoveLine(row.title);
  if (!id || !title) return null;
  const gilt = giltOf(row.gilt);
  return {
    id,
    title,
    note: alcoveNote(row.note),
    keeper: keeperLabel(row.keeper),
    pew: pewOf(row.pew),
    cloth: clothOf(row.cloth),
    hush: hushNameOf(row.hush),
    lamp: lampOf(row.lamp),
    wait: waitOf(row.wait),
    tags: tagsOf(row.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readAlcoves(raw: unknown): ApseAlcove[] {
  if (!Array.isArray(raw)) return [];
  const out: ApseAlcove[] = [];
  for (const item of raw) {
    const alcove = readOne(item);
    if (!alcove || out.some((row) => row.id === alcove.id || row.title === alcove.title)) continue;
    out.push(alcove);
  }
  return out.slice(0, ALCOVE_CAP);
}

export function addAlcove(
  alcoves: readonly ApseAlcove[],
  alcove: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    pew?: unknown;
    cloth?: string;
    hush?: string;
    lamp?: unknown;
    wait?: unknown;
    tags?: unknown;
    gilt?: unknown;
  },
): ApseAlcove[] {
  const current = readAlcoves(alcoves);
  const id = String(alcove.id || "").trim();
  const title = alcoveLine(alcove.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const gilt = giltOf(alcove.gilt);
  const next: ApseAlcove = {
    id,
    title,
    note: alcoveNote(alcove.note),
    keeper: keeperLabel(alcove.keeper),
    pew: pewOf(alcove.pew),
    cloth: clothOf(alcove.cloth),
    hush: hushNameOf(alcove.hush),
    lamp: lampOf(alcove.lamp),
    wait: waitOf(alcove.wait),
    tags: tagsOf(alcove.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, ALCOVE_CAP);
}

export function cycleHush(alcoves: readonly ApseAlcove[], id: string): ApseAlcove[] {
  return readAlcoves(alcoves).map((alcove) => {
    if (alcove.id !== id) return alcove;
    const at = HUSH_ORDER.indexOf(alcove.hush as (typeof HUSH_ORDER)[number]);
    const next = at < 0 || at >= HUSHES.length ? HUSHES[0] : HUSHES[at % HUSHES.length];
    if (!next || next === alcove.hush) return alcove;
    return { ...alcove, hush: next, audit: "hush" };
  });
}

/** A blank title is left as it is. */
export function editAlcove(alcoves: readonly ApseAlcove[], id: string, title: unknown): ApseAlcove[] {
  const next = alcoveLine(title);
  if (!next) return readAlcoves(alcoves);
  const current = readAlcoves(alcoves);
  if (current.some((alcove) => alcove.id !== id && alcove.title === next)) return current;
  return current.map((alcove) => (alcove.id === id && alcove.title !== next ? { ...alcove, title: next, audit: "edit" } : alcove));
}

/** A blank note is left as it is. */
export function editAlcoveNote(alcoves: readonly ApseAlcove[], id: string, note: unknown): ApseAlcove[] {
  const next = alcoveNote(note);
  if (!next) return readAlcoves(alcoves);
  return readAlcoves(alcoves).map((alcove) => (alcove.id === id && alcove.note !== next ? { ...alcove, note: next, audit: "edit" } : alcove));
}

/** A tag that is already on the alcove, or a fourth tag, is left out. A tag is one letter from a to f. */
export function addAlcoveTag(alcoves: readonly ApseAlcove[], id: string, tag: unknown): ApseAlcove[] {
  const next = tagOf(tag);
  if (!next) return readAlcoves(alcoves);
  return readAlcoves(alcoves).map((alcove) => {
    if (alcove.id !== id || alcove.tags.includes(next) || alcove.tags.length >= TAG_CAP) return alcove;
    return { ...alcove, tags: [...alcove.tags, next], audit: "tag" };
  });
}

/** An unknown gilt is left as it is. 0 clears the gilt. */
export function setAlcoveGilt(alcoves: readonly ApseAlcove[], id: string, gilt: unknown): ApseAlcove[] {
  const next = giltOf(gilt);
  if (next === null) return readAlcoves(alcoves);
  return readAlcoves(alcoves).map((alcove) => (alcove.id === id && alcove.gilt !== next ? { ...alcove, gilt: next, audit: "gilt" } : alcove));
}

export function setAlcovePin(alcoves: readonly ApseAlcove[], id: string, pinned: boolean): ApseAlcove[] {
  return readAlcoves(alcoves).map((alcove) => (alcove.id === id && alcove.pinned !== pinned ? { ...alcove, pinned, audit: pinned ? "pin" : "unpin" } : alcove));
}

/** P toggles the pin on the focused row of the arcade currently shown. */
export function pinFocused(alcoves: readonly ApseAlcove[], shownIds: readonly string[], index: number): ApseAlcove[] {
  if (!shownIds.length) return readAlcoves(alcoves);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readAlcoves(alcoves).find((alcove) => alcove.id === id);
  if (!row) return readAlcoves(alcoves);
  return setAlcovePin(alcoves, id, !row.pinned);
}

/** G sets a gilt of 2 on the focused alcove, or clears a gilt that is already set. */
export function giltFocused(alcoves: readonly ApseAlcove[], shownIds: readonly string[], index: number): ApseAlcove[] {
  if (!shownIds.length) return readAlcoves(alcoves);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readAlcoves(alcoves).find((alcove) => alcove.id === id);
  if (!row) return readAlcoves(alcoves);
  return setAlcoveGilt(alcoves, id, row.gilt ? 0 : 2);
}

export function setAlcoveHold(alcoves: readonly ApseAlcove[], id: string, held: boolean): ApseAlcove[] {
  return readAlcoves(alcoves).map((alcove) => (alcove.id === id && alcove.held !== held ? { ...alcove, held, audit: held ? "hold" : "lift" } : alcove));
}

export function setAlcoveClose(alcoves: readonly ApseAlcove[], id: string, closed: boolean): ApseAlcove[] {
  return readAlcoves(alcoves).map((alcove) => (alcove.id === id && alcove.closed !== closed ? { ...alcove, closed, audit: closed ? "close" : "open" } : alcove));
}

export function bulkAlcoveCloth(alcoves: readonly ApseAlcove[], ids: readonly string[], cloth: unknown): ApseAlcove[] {
  const next = clothOf(cloth);
  if (!next) return readAlcoves(alcoves);
  const picked = new Set(ids);
  return readAlcoves(alcoves).map((alcove) => (picked.has(alcove.id) && alcove.cloth !== next ? { ...alcove, cloth: next, audit: "cloth" } : alcove));
}

export function bulkAlcovePin(alcoves: readonly ApseAlcove[], ids: readonly string[], pinned: boolean): ApseAlcove[] {
  const picked = new Set(ids);
  return readAlcoves(alcoves).map((alcove) => (picked.has(alcove.id) && alcove.pinned !== pinned ? { ...alcove, pinned, audit: pinned ? "pin" : "unpin" } : alcove));
}

export function bulkAlcoveClose(alcoves: readonly ApseAlcove[], ids: readonly string[], closed: boolean): ApseAlcove[] {
  const picked = new Set(ids);
  return readAlcoves(alcoves).map((alcove) => (picked.has(alcove.id) && alcove.closed !== closed ? { ...alcove, closed, audit: closed ? "close" : "open" } : alcove));
}

export function bulkAlcoveHush(alcoves: readonly ApseAlcove[], ids: readonly string[], hush: unknown): ApseAlcove[] {
  const next = hushNameOf(hush);
  if (!next) return readAlcoves(alcoves);
  const picked = new Set(ids);
  return readAlcoves(alcoves).map((alcove) => (picked.has(alcove.id) && alcove.hush !== next ? { ...alcove, hush: next, audit: "hush" } : alcove));
}

export function bulkAlcoveTag(alcoves: readonly ApseAlcove[], ids: readonly string[], tag: unknown): ApseAlcove[] {
  return ids.reduce((rows, id) => addAlcoveTag(rows, id, tag), readAlcoves(alcoves));
}

export function resetAlcoves(): ApseAlcove[] {
  return [];
}

function inTray(alcove: ApseAlcove, tray: AlcoveTray): boolean {
  if (tray === "closed") return alcove.closed;
  if (tray === "held") return alcove.held && !alcove.closed;
  return !alcove.held && !alcove.closed;
}

function pewHit(pew: number | null, exact: number | null, pick: PewPick | null): boolean {
  if (exact !== null) return pew === exact;
  if (pick === null) return true;
  if (pick === "blank") return pew === null;
  if (pick === "peak") return peakPew(pew);
  if (pick === "quiet") return quietPew(pew);
  return pewBand(pew) === pick;
}

/** An open alcove whose pew sits more than two pews behind the desk pew. A gilt, a hold, or a close is not late. */
export function lateAlcove(alcove: ApseAlcove, desk: unknown): boolean {
  const gap = pewGap(alcove.pew, desk);
  return inTray(alcove, "open") && alcove.gilt === 0 && gap !== null && gap > 2;
}

/** An open alcove with a wait of 15 is due now. A gilt, a hold, or a close is not. */
export function soonAlcove(alcove: ApseAlcove): boolean {
  return inTray(alcove, "open") && alcove.gilt === 0 && alcove.wait === 15;
}

/** Open alcoves that are late or due now. A gilt alcove stays off the reminder list. */
export function reminderAlcoves(alcoves: readonly ApseAlcove[], desk: unknown): ApseAlcove[] {
  return readAlcoves(alcoves).filter((alcove) => lateAlcove(alcove, desk) || soonAlcove(alcove));
}

/** Open alcoves whose pew sits within one pew of the desk pew. A gilt, a hold, or a close stays out. */
export function windowAlcoves(alcoves: readonly ApseAlcove[], desk: unknown): ApseAlcove[] {
  return readAlcoves(alcoves).filter((alcove) => {
    const gap = pewGap(alcove.pew, desk);
    return inTray(alcove, "open") && alcove.gilt === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Search matches the title, the note, the keeper, and the tags. */
export function visibleAlcoves(
  alcoves: readonly ApseAlcove[],
  tray: AlcoveTray,
  query: string,
  keeper: string | null,
  cloth: string | null,
  hush: string | null,
  exact: number | null,
  pick: PewPick | null,
  lamp: number | "blank" | null,
  wait: number | "blank" | null,
  callOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): ApseAlcove[] {
  const text = query.trim().toLowerCase();
  return readAlcoves(alcoves).filter((alcove) => {
    if (!inTray(alcove, tray)) return false;
    if (text) {
      const hay = `${alcove.title} ${alcove.note} ${alcove.keeper} ${alcove.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && alcove.keeper !== keeper) return false;
    if (cloth === "blank" ? Boolean(alcove.cloth) : cloth && alcove.cloth !== cloth) return false;
    if (hush === "blank" ? Boolean(alcove.hush) : hush && alcove.hush !== hush) return false;
    if (!pewHit(alcove.pew, exact, pick)) return false;
    if (lamp === "blank" ? alcove.lamp !== null : lamp !== null && alcove.lamp !== lamp) return false;
    if (wait === "blank" ? alcove.wait !== null : wait !== null && alcove.wait !== wait) return false;
    if (callOnly && alcove.hush !== "call") return false;
    if (peakOnly && !peakPew(alcove.pew)) return false;
    if (houseOnly && !houseCloth(alcove.cloth)) return false;
    if (quietOnly && !quietPew(alcove.pew)) return false;
    if (awakeOnly && alcove.gilt !== 0) return false;
    return true;
  });
}

export function sortAlcoves(alcoves: readonly ApseAlcove[], mode: AlcoveSort): ApseAlcove[] {
  const rows = alcoves.slice();
  if (mode === "keeper") return rows.sort((a, b) => a.keeper.localeCompare(b.keeper) || (a.pew ?? 99) - (b.pew ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.pew ?? 99) - (b.pew ?? 99) || a.title.localeCompare(b.title));
}

export function alcoveTimeline(alcoves: readonly ApseAlcove[], query: string): ApseAlcove[] {
  const text = query.trim().toLowerCase();
  return sortAlcoves(
    readAlcoves(alcoves).filter((alcove) => alcove.pew !== null && (!text || alcove.title.toLowerCase().includes(text))),
    "pew",
  );
}

export function alcoveCounts(alcoves: readonly ApseAlcove[], desk: unknown): AlcoveCounts {
  const rows = readAlcoves(alcoves);
  return {
    open: rows.filter((alcove) => inTray(alcove, "open")).length,
    held: rows.filter((alcove) => inTray(alcove, "held")).length,
    closed: rows.filter((alcove) => inTray(alcove, "closed")).length,
    pinned: rows.filter((alcove) => alcove.pinned).length,
    peak: rows.filter((alcove) => inTray(alcove, "open") && alcove.gilt === 0 && peakPew(alcove.pew)).length,
    late: rows.filter((alcove) => lateAlcove(alcove, desk)).length,
    soon: rows.filter((alcove) => soonAlcove(alcove)).length,
    gilt: rows.filter((alcove) => inTray(alcove, "open") && alcove.gilt > 0).length,
    house: rows.filter((alcove) => inTray(alcove, "open") && houseCloth(alcove.cloth)).length,
    window: windowAlcoves(rows, desk).length,
  };
}

export function alcoveShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open alcoves as a share of every open alcove. */
export function lateShare(alcoves: readonly ApseAlcove[], desk: unknown): number {
  const rows = readAlcoves(alcoves);
  const open = rows.filter((alcove) => inTray(alcove, "open")).length;
  const late = rows.filter((alcove) => lateAlcove(alcove, desk)).length;
  return alcoveShare(late, open);
}

/** Distinct pews on open alcoves. */
export function usedPews(alcoves: readonly ApseAlcove[]): number {
  const pews = new Set<number>();
  for (const alcove of readAlcoves(alcoves)) {
    if (inTray(alcove, "open") && alcove.pew !== null) pews.add(alcove.pew);
  }
  return pews.size;
}

/** Open alcoves that share a pew and a cloth. A different cloth on the same pew is not a clash. */
export function clashPewCount(alcoves: readonly ApseAlcove[]): number {
  const groups = new Map<string, number>();
  for (const alcove of readAlcoves(alcoves)) {
    if (!inTray(alcove, "open") || alcove.pew === null || !alcove.cloth) continue;
    const key = `${alcove.pew}:${alcove.cloth}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open alcoves that share a lamp. An unset lamp is not a clash. */
export function lampClashCount(alcoves: readonly ApseAlcove[]): number {
  const groups = new Map<number, number>();
  for (const alcove of readAlcoves(alcoves)) {
    if (!inTray(alcove, "open") || alcove.lamp === null) continue;
    groups.set(alcove.lamp, (groups.get(alcove.lamp) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open alcoves in the same cloth whose pews differ by two.
 * The count is the alcoves that have at least one neighbor.
 */
export function adjacentAlcoveCount(alcoves: readonly ApseAlcove[]): number {
  const open = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && alcove.pew !== null && alcove.cloth);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.cloth === right.cloth && Math.abs((left.pew ?? 0) - (right.pew ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The cloth with the fewest open alcoves.
 * A tie keeps SLATE, then LINEN, then CHAMPAGNE.
 * An empty desk still suggests SLATE.
 */
export function suggestCloth(alcoves: readonly ApseAlcove[]): "LINEN" | "SLATE" | "CHAMPAGNE" {
  const rows = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open"));
  const order = ["SLATE", "LINEN", "CHAMPAGNE"] as const;
  let best: "LINEN" | "SLATE" | "CHAMPAGNE" = "SLATE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((alcove) => alcove.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The lamp with the fewest open alcoves.
 * A tie keeps 4, then 2, then 8.
 * An empty desk still suggests 4.
 */
export function suggestLamp(alcoves: readonly ApseAlcove[]): 2 | 4 | 8 {
  const rows = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open"));
  const order = [4, 2, 8] as const;
  let best: 2 | 4 | 8 = 4;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const lamp of order) {
    const count = rows.filter((alcove) => alcove.lamp === lamp).length;
    if (count < bestCount) {
      best = lamp;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open keeper. A blank keeper is skipped. An empty desk stays blank. */
export function suggestKeeper(alcoves: readonly ApseAlcove[]): string {
  const found = readAlcoves(alcoves).find((alcove) => inTray(alcove, "open") && alcove.keeper);
  return found ? found.keeper : "";
}

/**
 * The keeper carrying the fewest open alcoves.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty roster falls back to the newest keeper.
 */
export function fairKeeper(alcoves: readonly ApseAlcove[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(alcoves);
  const open = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((alcove) => alcove.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open alcoves. A tie keeps the newer name on the desk. */
export function busiestKeeper(alcoves: readonly ApseAlcove[]): string {
  const rows = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && alcove.keeper);
  const names: string[] = [];
  for (const alcove of rows) if (!names.includes(alcove.keeper)) names.push(alcove.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((alcove) => alcove.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function alcoveKeepers(alcoves: readonly ApseAlcove[]): string[] {
  const out: string[] = [];
  for (const alcove of readAlcoves(alcoves)) {
    if (alcove.keeper && !out.includes(alcove.keeper)) out.push(alcove.keeper);
  }
  return out;
}

export function alcoveCloths(alcoves: readonly ApseAlcove[]): string[] {
  const out: string[] = [];
  for (const alcove of readAlcoves(alcoves)) {
    if (alcove.cloth && !out.includes(alcove.cloth)) out.push(alcove.cloth);
  }
  return out;
}

/** Open alcoves whose keeper also keeps another open alcove on a different pew. */
export function pairKeeperCount(alcoves: readonly ApseAlcove[]): number {
  const open = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && alcove.keeper && alcove.pew !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].keeper === open[j].keeper && open[i].pew !== open[j].pew) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The gilt weight of open alcoves. A clear gilt adds nothing. */
export function giltLoad(alcoves: readonly ApseAlcove[]): number {
  return readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open")).reduce((sum, alcove) => sum + alcove.gilt, 0);
}

/** Open alcoves that are both a quiet pew and a house cloth. */
export function quietHouseCount(alcoves: readonly ApseAlcove[]): number {
  return readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && quietPew(alcove.pew) && houseCloth(alcove.cloth)).length;
}

/** Open alcoves whose hush is call. */
export function callLoad(alcoves: readonly ApseAlcove[]): number {
  return readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && alcove.hush === "call").length;
}

/** The span from the lowest open pew to the highest. Fewer than two pews spans nothing. */
export function pewSpan(alcoves: readonly ApseAlcove[]): number {
  const pews = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && alcove.pew !== null).map((alcove) => alcove.pew as number);
  if (pews.length < 2) return 0;
  return Math.max(...pews) - Math.min(...pews);
}

/**
 * The next open alcove at or after the desk pew.
 * A call hush, a gilt, a hold, and a close stay off the list.
 * When every open pew is behind, the earliest pew is next.
 */
export function nextAlcove(alcoves: readonly ApseAlcove[], desk: unknown): string {
  const now = pewOf(desk);
  if (now === null) return "";
  const waiting = readAlcoves(alcoves).filter((alcove) => inTray(alcove, "open") && alcove.pew !== null && alcove.hush !== "call" && alcove.gilt === 0);
  if (!waiting.length) return "";
  const byPew = (a: ApseAlcove, b: ApseAlcove) => (a.pew ?? 0) - (b.pew ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((alcove) => (alcove.pew ?? 0) >= now).sort(byPew);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byPew)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function alcoveCopy(alcove: ApseAlcove, desk: unknown): string {
  const gap = pewGap(alcove.pew, desk);
  return [alcove.title, alcove.keeper, alcove.pew ?? "", alcove.cloth, alcove.hush, alcove.lamp ?? "", alcove.wait ?? "", alcove.tags.join(" "), alcove.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the alcoves saved in this browser. The gap and the late mark use the pew you pass. */
export function alcovesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,pew,cloth,hush,lamp,wait,tags,gilt,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readAlcoves(raw);
  const windowIds = new Set(windowAlcoves(rows, desk).map((alcove) => alcove.id));
  for (const alcove of rows) {
    const gap = pewGap(alcove.pew, desk);
    lines.push([
      alcove.title,
      alcove.keeper,
      alcove.pew === null ? "" : String(alcove.pew),
      alcove.cloth,
      alcove.hush,
      alcove.lamp === null ? "" : String(alcove.lamp),
      alcove.wait === null ? "" : String(alcove.wait),
      alcove.tags.join(" "),
      String(alcove.gilt),
      alcove.pinned ? "1" : "0",
      alcove.held ? "1" : "0",
      alcove.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateAlcove(alcove, desk) ? "1" : "0",
      soonAlcove(alcove) ? "1" : "0",
      houseCloth(alcove.cloth) ? "1" : "0",
      windowIds.has(alcove.id) ? "1" : "0",
      alcove.note,
      alcove.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return keepers.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, cloths: readonly string[]): string {
  if (raw === "blank") return "blank";
  return clothOf(raw) && cloths.includes(clothOf(raw)) ? clothOf(raw) : "all";
}

export function activeHush(raw: string, hushes: readonly string[]): string {
  if (raw === "blank") return "blank";
  const hush = hushNameOf(raw);
  return hush && hushes.includes(hush) ? hush : "all";
}

export function activePew(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const pew = pewOf(raw);
  return pew === null ? "all" : String(pew);
}

export function activeLamp(raw: string): string {
  if (raw === "blank") return "blank";
  const lamp = lampOf(raw);
  return lamp === null ? "all" : String(lamp);
}

export function activeWait(raw: string): string {
  if (raw === "blank") return "blank";
  const wait = waitOf(raw);
  return wait === null ? "all" : String(wait);
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
}

export function hushArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return hushNameOf(filter) || null;
}

export function pewArg(filter: string): { exact: number | null; pick: PewPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: pewOf(filter), pick: null };
}

export function lampArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lampOf(filter);
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return waitOf(filter);
}

function readView(raw: unknown): AlcoveView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AlcoveView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    keeper: row.keeper === "blank" ? "blank" : clip(row.keeper, 18) || "all",
    cloth: row.cloth === "blank" || row.cloth === "all" ? (row.cloth === "blank" ? "blank" : "all") : clothOf(row.cloth) || "all",
    hush: row.hush === "blank" || row.hush === "all" ? (row.hush === "blank" ? "blank" : "all") : hushNameOf(row.hush) || "all",
    pew: activePew(String(row.pew || "all")),
    lamp: activeLamp(String(row.lamp || "all")),
    wait: activeWait(String(row.wait || "all")),
  };
}

export function readAlcoveViews(raw: unknown): AlcoveView[] {
  if (!Array.isArray(raw)) return [];
  const out: AlcoveView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addAlcoveView(views: readonly AlcoveView[], view: AlcoveView): AlcoveView[] {
  const current = readAlcoveViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropAlcoveView(views: readonly AlcoveView[], id: string): AlcoveView[] {
  return readAlcoveViews(views).filter((view) => view.id !== id);
}

export type CrestState = "" | "set" | "clear";

export type CrestBand = "" | "bright" | "ivory" | "ember" | "slate" | "plain";

export type CrestTone = "" | "gilt" | "ink" | "ivory" | "mist" | "plain";

export type CrestShape = "all" | "catalog" | "wide" | "gilt";

export type CrestValue =
  | { lastBrowser?: unknown; language?: unknown; lastOs?: unknown; lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; assigneeId?: unknown; referralCodeUsed?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type CrestRow = { id: string; note?: CrestValue; label?: string | null };

export type CrestBandLine = { band: string; count: number };

const CATALOG = new Set(["chrome", "safari", "firefox", "edge", "opera"]);

const CREST_BANDS = ["bright", "ivory", "ember", "slate", "plain"] as const;

const CREST_TONES = ["gilt", "ink", "ivory", "mist", "plain"] as const;

const CREST_BLOCK = ["language", "lastOs", "lastDevice", "lastUserAgent", "lastIp", "timezone", "username", "phone", "assigneeId", "referralCodeUsed", "city", "country", "desk", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name", "email"] as const;

function crestBody(raw: unknown): string {
  return String(raw ?? "").toLowerCase().replace(/[^a-z]+/g, "").slice(0, 16);
}

function crestText(value: CrestValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: crestBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CREST_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("lastBrowser" in value)) return { text: null, explicit: false };
  const inner = value.lastBrowser;
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

/** A crest keeps the first letter and the last letter. A single letter stays one letter. */
export function crestOf(value: CrestValue): string {
  const text = crestCopy(value);
  if (!text) return "";
  const first = text[0];
  if (!first) return "";
  const last = text.length > 1 ? text[text.length - 1] : "";
  return last ? first.toUpperCase() + last.toUpperCase() : first.toUpperCase();
}

/** chrome and chromium are bright. safari is ivory. firefox and mozilla are ember. edge is slate. Any other mark is plain. */
export function crestBand(value: CrestValue): CrestBand {
  const mark = crestOf(value);
  if (!mark) return "";
  const text = crestCopy(value);
  if (text.startsWith("chrome") || text.startsWith("chromium")) return "bright";
  if (text.startsWith("safari")) return "ivory";
  if (text.startsWith("firefox") || text.startsWith("mozilla")) return "ember";
  if (text.startsWith("edge")) return "slate";
  return "plain";
}

/** A name that starts with chrom is gilt, so chrome and chromium share it. safari that is not gilt is ink. firefox that is neither is ivory. edge that is none of those is mist. Every other marked crest is plain. */
export function crestTone(value: CrestValue): CrestTone {
  const text = crestCopy(value);
  if (!text || !crestOf(value)) return "";
  if (text.startsWith("chrom")) return "gilt";
  if (text.startsWith("safari")) return "ink";
  if (text.startsWith("firefox")) return "ivory";
  if (text.startsWith("edge")) return "mist";
  return "plain";
}

/** chrome, safari, firefox, edge, and opera are the house catalog. A longer name is not. */
export function catalogCrest(value: CrestValue): boolean {
  return CATALOG.has(crestCopy(value));
}

export function catalogCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => catalogCrest(row.note)).length;
}

export function wideCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestCopy(row.note).length > 7).length;
}

export function giltCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestTone(row.note) === "gilt").length;
}

/** Customers whose crest is shared with at least one other customer. */
export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = crestOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
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

/** The band with the most set crests. A tie keeps bright, then ivory, then ember, then slate, then plain. */
export function leadingCrest(rows: readonly CrestRow[]): string {
  const lines = crestBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || CREST_BANDS.indexOf(a.band as (typeof CREST_BANDS)[number]) - CREST_BANDS.indexOf(b.band as (typeof CREST_BANDS)[number]))[0];
  return lead ? lead.band : "";
}

/** The tone with the most set crests. A tie keeps gilt, then ink, then ivory, then mist, then plain. */
export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const counts = CREST_TONES.map((tone) => ({ tone, count: rows.filter((row) => crestTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || CREST_TONES.indexOf(a.tone) - CREST_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
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
    if (shape === "wide" && crestCopy(row.note).length <= 7) return false;
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
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" || raw === "plain" ? raw : "all";
}

export function crestBandArg(filter: string): CrestBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "bright" || filter === "ivory" || filter === "ember" || filter === "slate" || filter === "plain") return filter;
  return null;
}

export function crestToneArg(filter: string): CrestTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist" || filter === "plain") return filter;
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
  lines.push(`tone,mist,${rows.filter((row) => crestTone(row.note) === "mist").length}`);
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
      crestCopy(row.note).length > 7 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
