/**
 * Mezzanine rails for the positions book, and symbol crests already stored as symbol, side, and status on each loaded position.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_mezzanine_rail (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   watcher text not null default '',
 *   bay integer,
 *   finish text not null default '',
 *   tempo text not null default '',
 *   bell integer,
 *   weight integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_symbol_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_symbol_crest_review (
 *   position_id text primary key
 * );
 */

export const MZR_KEY = "crmv4-mezzanine-rail";
export const MZR_VIEW_KEY = "crmv4-mezzanine-views";
export const MZR_DENSITY_KEY = "crmv4-mezzanine-density";
export const SYC_KEY = "crmv4-symbol-crest-hide";
export const SYC_REVIEW_KEY = "crmv4-symbol-crest-review";

export type FinishName = "blank" | "linen" | "graphite" | "champagne";

export type TempoName = "blank" | "hush" | "live" | "flare";

export type RailTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type RailDensity = "airy" | "tight";

export type RailSort = "bay" | "watcher";

export type MezzanineRail = {
  id: string;
  title: string;
  note: string;
  watcher: string;
  bay: number | null;
  finish: string;
  tempo: string;
  bell: number | null;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type RailView = {
  id: string;
  name: string;
  tray: RailTray;
  query: string;
  watcher: string;
  finish: string;
  tempo: string;
  bay: string;
  bell: string;
  weight: string;
};

export type RailCounts = {
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

export type CrestLane = "" | "core" | "wing" | "loft";

export type CrestTone = "" | "long" | "short" | "flat" | "mist";

export type CrestState = "" | "clear" | "set";

export type CrestShape = "all" | "catalog" | "wide" | "open" | "shut";

export type CrestReview = "all" | "reviewed" | "fresh";

export type CrestValue = string | { symbol?: unknown; side?: unknown; status?: unknown; [key: string]: unknown } | null | undefined;

export type CrestRow = { id: string; label: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "tempo", "pin", "unpin", "hold", "resume", "archive", "open", "finish", "tag", "weight", "bell"] as const;

const FINISHES = ["linen", "graphite", "champagne"] as const;

const TEMPOS = ["hush", "live", "flare"] as const;

const TEMPO_CYCLE = ["hush", "live", "flare"] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["LINEN", "CHAMPAGNE"]);

const CATALOG = new Set(["EURUSD", "XAUUSD", "GBPUSD", "USDJPY", "NAS100"]);

const MONEY_KEYS = ["profit", "volume", "amount", "currency", "balance"];

const RAIL_CAP = 10;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RailTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<TempoName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<TempoName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(rail: MezzanineRail, tray: RailTray): boolean {
  if (tray === "held") return rail.held && !rail.archived;
  if (tray === "archived") return rail.archived;
  return !rail.held && !rail.archived;
}

/** A blank title is left out. The saved title stays short. */
export function railLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function railNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank watcher stays blank. It is not filled in. */
export function watcherLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A finish is LINEN, GRAPHITE, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function finishOf(raw: unknown): string {
  const name = finishName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bay.
 * A second digit is not a bay.
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

/** A bell is 20, 40, or 60. A blank value stays unset. A leading zero is not a bell. */
export function bellOf(raw: unknown): 20 | 40 | 60 | null {
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** Weight is 2, 4, or 8. Anything else is not a weight. 2 is the resting weight. */
export function weightOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
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
 * A positive gap means the rail is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** LINEN and CHAMPAGNE are house finishes. GRAPHITE is a guest finish. A blank finish is not a house finish. */
export function houseFinish(finish: unknown): boolean {
  return HOUSE.has(finishOf(finish));
}

export function densityOf(raw: unknown): RailDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function sortMode(raw: unknown): RailSort {
  return raw === "watcher" ? "watcher" : "bay";
}

function readOne(raw: unknown): MezzanineRail | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = railLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: railNote(row.note),
    watcher: watcherLabel(row.watcher),
    bay: bayOf(row.bay),
    finish: finishOf(row.finish),
    tempo: tempoName(row.tempo),
    bell: bellOf(row.bell),
    weight: weight === null ? 2 : weight,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readRails(raw: unknown): MezzanineRail[] {
  if (!Array.isArray(raw)) return [];
  const out: MezzanineRail[] = [];
  for (const item of raw) {
    const rail = readOne(item);
    if (!rail || out.some((row) => row.id === rail.id || row.title === rail.title)) continue;
    out.push(rail);
  }
  return out.slice(0, RAIL_CAP);
}

export function addRail(
  rails: readonly MezzanineRail[],
  rail: {
    id: string;
    title: string;
    note?: string;
    watcher?: string;
    bay?: unknown;
    finish?: string;
    tempo?: string;
    bell?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): MezzanineRail[] {
  const current = readRails(rails);
  const id = String(rail.id || "").trim();
  const title = railLine(rail.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(rail.weight);
  const next: MezzanineRail = {
    id,
    title,
    note: railNote(rail.note),
    watcher: watcherLabel(rail.watcher),
    bay: bayOf(rail.bay),
    finish: finishOf(rail.finish),
    tempo: tempoName(rail.tempo),
    bell: bellOf(rail.bell),
    weight: weight === null ? 2 : weight,
    tags: tagsOf(rail.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, RAIL_CAP);
}

/** A blank tempo becomes hush, hush becomes live, live becomes flare, and flare returns to hush. */
export function cycleTempo(rails: readonly MezzanineRail[], id: string): MezzanineRail[] {
  return readRails(rails).map((rail) => {
    if (rail.id !== id) return rail;
    const at = TEMPO_CYCLE.indexOf(rail.tempo as (typeof TEMPO_CYCLE)[number]);
    const next = at < 0 ? TEMPO_CYCLE[0] : TEMPO_CYCLE[(at + 1) % TEMPO_CYCLE.length];
    if (!next || next === rail.tempo) return rail;
    return { ...rail, tempo: next, audit: "tempo" };
  });
}

/** A blank title is left as it is. */
export function editRail(rails: readonly MezzanineRail[], id: string, title: unknown): MezzanineRail[] {
  const next = railLine(title);
  if (!next) return readRails(rails);
  const current = readRails(rails);
  if (current.some((rail) => rail.id !== id && rail.title === next)) return current;
  return current.map((rail) => (rail.id === id && rail.title !== next ? { ...rail, title: next, audit: "edit" } : rail));
}

export function editRailNote(rails: readonly MezzanineRail[], id: string, note: unknown): MezzanineRail[] {
  const next = railNote(note);
  return readRails(rails).map((rail) => (rail.id === id && rail.note !== next ? { ...rail, note: next, audit: "note" } : rail));
}

export function addRailTag(rails: readonly MezzanineRail[], id: string, tag: unknown): MezzanineRail[] {
  const next = tagsOf(tag);
  if (!next.length) return readRails(rails);
  return readRails(rails).map((rail) => {
    if (rail.id !== id) return rail;
    const tags = tagsOf([...rail.tags, ...next]);
    if (tags.join() === rail.tags.join()) return rail;
    return { ...rail, tags, audit: "tag" };
  });
}

export function setRailWeight(rails: readonly MezzanineRail[], id: string, weight: unknown): MezzanineRail[] {
  const next = weightOf(weight);
  if (next === null) return readRails(rails);
  return readRails(rails).map((rail) => (rail.id === id && rail.weight !== next ? { ...rail, weight: next, audit: "weight" } : rail));
}

/** Snooze lengthens the bell from blank to 20, from 20 to 40, and from 40 to 60. 60 stays. */
export function snoozeRail(rails: readonly MezzanineRail[], id: string): MezzanineRail[] {
  return readRails(rails).map((rail) => {
    if (rail.id !== id) return rail;
    const next = rail.bell === null ? 20 : rail.bell === 20 ? 40 : rail.bell === 40 ? 60 : null;
    if (next === null) return rail;
    return { ...rail, bell: next, audit: "bell" };
  });
}

export function setRailPin(rails: readonly MezzanineRail[], id: string, pinned: boolean): MezzanineRail[] {
  return readRails(rails).map((rail) => (rail.id === id && rail.pinned !== pinned ? { ...rail, pinned, audit: pinned ? "pin" : "unpin" } : rail));
}

export function pinFocused(rails: readonly MezzanineRail[], shownIds: readonly string[], index: number): MezzanineRail[] {
  const id = shownIds[index];
  if (!id) return readRails(rails);
  const rail = readRails(rails).find((item) => item.id === id);
  if (!rail) return readRails(rails);
  return setRailPin(rails, id, !rail.pinned);
}

export function snoozeFocused(rails: readonly MezzanineRail[], shownIds: readonly string[], index: number): MezzanineRail[] {
  const id = shownIds[index];
  return id ? snoozeRail(rails, id) : readRails(rails);
}

export function holdFocused(rails: readonly MezzanineRail[], shownIds: readonly string[], index: number): MezzanineRail[] {
  const id = shownIds[index];
  if (!id) return readRails(rails);
  const rail = readRails(rails).find((item) => item.id === id);
  if (!rail || rail.archived) return readRails(rails);
  return setRailHold(rails, id, !rail.held);
}

export function tempoFocused(rails: readonly MezzanineRail[], shownIds: readonly string[], index: number): MezzanineRail[] {
  const id = shownIds[index];
  return id ? cycleTempo(rails, id) : readRails(rails);
}

export function setRailHold(rails: readonly MezzanineRail[], id: string, held: boolean): MezzanineRail[] {
  return readRails(rails).map((rail) => (rail.id === id && !rail.archived && rail.held !== held ? { ...rail, held, audit: held ? "hold" : "resume" } : rail));
}

export function setRailArchive(rails: readonly MezzanineRail[], id: string, archived: boolean): MezzanineRail[] {
  return readRails(rails).map((rail) => (rail.id === id && rail.archived !== archived ? { ...rail, archived, held: archived ? false : rail.held, audit: archived ? "archive" : "open" } : rail));
}

export function bulkRailFinish(rails: readonly MezzanineRail[], ids: readonly string[], finish: unknown): MezzanineRail[] {
  const next = finishOf(finish);
  if (!next) return readRails(rails);
  const want = new Set(ids);
  return readRails(rails).map((rail) => (want.has(rail.id) && rail.finish !== next ? { ...rail, finish: next, audit: "finish" } : rail));
}

export function bulkRailPin(rails: readonly MezzanineRail[], ids: readonly string[], pinned: boolean): MezzanineRail[] {
  const want = new Set(ids);
  return readRails(rails).map((rail) => (want.has(rail.id) && rail.pinned !== pinned ? { ...rail, pinned, audit: pinned ? "pin" : "unpin" } : rail));
}

export function bulkRailArchive(rails: readonly MezzanineRail[], ids: readonly string[], archived: boolean): MezzanineRail[] {
  const want = new Set(ids);
  return readRails(rails).map((rail) => (want.has(rail.id) && rail.archived !== archived ? { ...rail, archived, held: archived ? false : rail.held, audit: archived ? "archive" : "open" } : rail));
}

export function bulkRailTempo(rails: readonly MezzanineRail[], ids: readonly string[], tempo: unknown): MezzanineRail[] {
  const next = tempoName(tempo);
  if (!next) return readRails(rails);
  const want = new Set(ids);
  return readRails(rails).map((rail) => (want.has(rail.id) && rail.tempo !== next ? { ...rail, tempo: next, audit: "tempo" } : rail));
}

export function bulkRailTag(rails: readonly MezzanineRail[], ids: readonly string[], tag: unknown): MezzanineRail[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addRailTag(rows, id, tag) : rows), readRails(rails));
}

export function resetRails(): MezzanineRail[] {
  return [];
}

/** An open rail whose bay sits more than one bay behind the desk. A raised weight, a hold, or an archive is not late. */
export function lateRail(rail: MezzanineRail, desk: unknown): boolean {
  const gap = bayGap(rail.bay, desk);
  return inTray(rail, "open") && rail.weight === 2 && gap !== null && gap > 1;
}

/** An open rail with a bell of 20 is due now. A raised weight, a hold, or an archive is not. */
export function soonRail(rail: MezzanineRail): boolean {
  return inTray(rail, "open") && rail.weight === 2 && rail.bell === 20;
}

/** Open rails that are late or due now. A raised rail stays off the reminder list. */
export function reminderRails(rails: readonly MezzanineRail[], desk: unknown): MezzanineRail[] {
  return readRails(rails).filter((rail) => lateRail(rail, desk) || soonRail(rail));
}

/** Open rails whose bay sits within one bay of the desk. A raised weight, a hold, or an archive stays out. */
export function windowRails(rails: readonly MezzanineRail[], desk: unknown): MezzanineRail[] {
  return readRails(rails).filter((rail) => {
    const gap = bayGap(rail.bay, desk);
    return inTray(rail, "open") && rail.weight === 2 && gap !== null && gap >= -1 && gap <= 1;
  });
}

export function matchedRails(rails: readonly MezzanineRail[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readRails(rails).filter((rail) => inTray(rail, "open") && rail.weight === 2 && rail.bay === at).length;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** Search matches the title, the note, the watcher, and the tags. */
export function visibleRails(
  rails: readonly MezzanineRail[],
  tray: RailTray,
  query: string,
  watcher: string | null,
  finish: string | null,
  tempo: string | null,
  exact: number | null,
  pick: BayPick | null,
  bell: number | "blank" | null,
  weight: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): MezzanineRail[] {
  const text = query.trim().toLowerCase();
  return readRails(rails).filter((rail) => {
    if (!inTray(rail, tray)) return false;
    if (text) {
      const hay = `${rail.title} ${rail.note} ${rail.watcher} ${rail.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (watcher !== null && rail.watcher !== watcher) return false;
    if (finish === "blank" ? Boolean(rail.finish) : finish && rail.finish !== finish) return false;
    if (tempo === "blank" ? Boolean(rail.tempo) : tempo && rail.tempo !== tempo) return false;
    if (!bayHit(rail.bay, exact, pick)) return false;
    if (bell === "blank" ? rail.bell !== null : bell !== null && rail.bell !== bell) return false;
    if (weight === "blank" ? rail.weight !== 2 : weight !== null && rail.weight !== weight) return false;
    if (flareOnly && rail.tempo !== "flare") return false;
    if (peakOnly && !peakBay(rail.bay)) return false;
    if (houseOnly && !houseFinish(rail.finish)) return false;
    if (quietOnly && !quietBay(rail.bay)) return false;
    if (lightOnly && rail.weight !== 2) return false;
    return true;
  });
}

export function sortRails(rails: readonly MezzanineRail[], mode: RailSort): MezzanineRail[] {
  const rows = rails.slice();
  if (mode === "watcher") return rows.sort((a, b) => a.watcher.localeCompare(b.watcher) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function railLedger(rails: readonly MezzanineRail[], query: string): MezzanineRail[] {
  const text = query.trim().toLowerCase();
  return sortRails(
    readRails(rails).filter((rail) => rail.bay !== null && (!text || rail.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function railCounts(rails: readonly MezzanineRail[], desk: unknown): RailCounts {
  const rows = readRails(rails);
  return {
    open: rows.filter((rail) => inTray(rail, "open")).length,
    held: rows.filter((rail) => inTray(rail, "held")).length,
    archived: rows.filter((rail) => inTray(rail, "archived")).length,
    pinned: rows.filter((rail) => rail.pinned).length,
    peak: rows.filter((rail) => inTray(rail, "open") && rail.weight === 2 && peakBay(rail.bay)).length,
    late: rows.filter((rail) => lateRail(rail, desk)).length,
    soon: rows.filter((rail) => soonRail(rail)).length,
    weight: rows.filter((rail) => inTray(rail, "open") && rail.weight > 2).length,
    house: rows.filter((rail) => inTray(rail, "open") && houseFinish(rail.finish)).length,
    window: windowRails(rows, desk).length,
    matched: matchedRails(rows, desk),
  };
}

export function railShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open rails as a share of every open rail. */
export function lateShare(rails: readonly MezzanineRail[], desk: unknown): number {
  const rows = readRails(rails).filter((rail) => inTray(rail, "open"));
  return railShare(rows.filter((rail) => lateRail(rail, desk)).length, rows.length);
}

export function usedBays(rails: readonly MezzanineRail[]): number {
  return new Set(readRails(rails).filter((rail) => inTray(rail, "open") && rail.bay !== null).map((rail) => rail.bay)).size;
}

/** Open rails that share a bay. */
export function clashBayCount(rails: readonly MezzanineRail[]): number {
  const open = readRails(rails).filter((rail) => inTray(rail, "open") && rail.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bay === open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open rails that share a bell. */
export function bellClashCount(rails: readonly MezzanineRail[]): number {
  const open = readRails(rails).filter((rail) => inTray(rail, "open") && rail.bell !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bell === open[j].bell) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open rails whose bays sit exactly two bays apart. */
export function adjacentRailCount(rails: readonly MezzanineRail[]): number {
  const open = readRails(rails).filter((rail) => inTray(rail, "open") && rail.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].bay || 0) - (open[j].bay || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The finish with the fewest open rails.
 * A tie keeps LINEN, then CHAMPAGNE, then GRAPHITE.
 * An empty desk still suggests LINEN.
 */
export function suggestFinish(rails: readonly MezzanineRail[]): "LINEN" | "CHAMPAGNE" | "GRAPHITE" {
  const rows = readRails(rails).filter((rail) => inTray(rail, "open"));
  const order = ["LINEN", "CHAMPAGNE", "GRAPHITE"] as const;
  let best: "LINEN" | "CHAMPAGNE" | "GRAPHITE" = "LINEN";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const finish of order) {
    const count = rows.filter((rail) => rail.finish === finish).length;
    if (count < bestCount) {
      best = finish;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The bell with the fewest open rails.
 * A tie keeps 40, then 20, then 60.
 * An empty desk still suggests 40.
 */
export function suggestBell(rails: readonly MezzanineRail[]): 20 | 40 | 60 {
  const rows = readRails(rails).filter((rail) => inTray(rail, "open"));
  const order = [40, 20, 60] as const;
  let best: 20 | 40 | 60 = 40;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const bell of order) {
    const count = rows.filter((rail) => rail.bell === bell).length;
    if (count < bestCount) {
      best = bell;
      bestCount = count;
    }
  }
  return best;
}

/** The newest watcher already written on a rail. A blank watcher is skipped. */
export function suggestWatcher(rails: readonly MezzanineRail[]): string {
  const found = readRails(rails).find((rail) => rail.watcher);
  return found ? found.watcher : "";
}

/**
 * The watcher carrying the fewest open rails.
 * A tie keeps the earlier name. A blank watcher is not a load.
 * An empty roster falls back to the newest watcher.
 */
export function fairWatcher(rails: readonly MezzanineRail[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = watcherLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestWatcher(rails);
  const open = readRails(rails).filter((rail) => inTray(rail, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((rail) => rail.watcher === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The watcher with the most open rails. A tie keeps the newer name on the desk. */
export function busiestWatcher(rails: readonly MezzanineRail[]): string {
  const rows = readRails(rails).filter((rail) => inTray(rail, "open") && rail.watcher);
  const names: string[] = [];
  for (const rail of rows) if (!names.includes(rail.watcher)) names.push(rail.watcher);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((rail) => rail.watcher === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function railWatchers(rails: readonly MezzanineRail[]): string[] {
  const out: string[] = [];
  for (const rail of readRails(rails)) {
    if (rail.watcher && !out.includes(rail.watcher)) out.push(rail.watcher);
  }
  return out;
}

export function railFinishes(rails: readonly MezzanineRail[]): string[] {
  const out: string[] = [];
  for (const rail of readRails(rails)) {
    if (rail.finish && !out.includes(rail.finish)) out.push(rail.finish);
  }
  return out;
}

/** Open rails whose watcher also watches another open rail on a different bay. */
export function pairWatcherCount(rails: readonly MezzanineRail[]): number {
  const open = readRails(rails).filter((rail) => inTray(rail, "open") && rail.watcher && rail.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].watcher === open[j].watcher && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open rails that share a finish on different bays. */
export function sharedFinishCount(rails: readonly MezzanineRail[]): number {
  const open = readRails(rails).filter((rail) => inTray(rail, "open") && rail.finish && rail.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].finish === open[j].finish && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The weight of open rails. The resting weight of 2 still counts. */
export function weightLoad(rails: readonly MezzanineRail[]): number {
  return readRails(rails).filter((rail) => inTray(rail, "open")).reduce((sum, rail) => sum + rail.weight, 0);
}

/** Open rails that are both the quiet bay and a house finish. */
export function quietGalleryCount(rails: readonly MezzanineRail[]): number {
  return readRails(rails).filter((rail) => inTray(rail, "open") && quietBay(rail.bay) && houseFinish(rail.finish)).length;
}

/** Open rails whose tempo is flare. */
export function flareLoad(rails: readonly MezzanineRail[]): number {
  return readRails(rails).filter((rail) => inTray(rail, "open") && rail.tempo === "flare").length;
}

export function baySpan(rails: readonly MezzanineRail[]): number {
  const bays = readRails(rails).filter((rail) => inTray(rail, "open") && rail.bay !== null).map((rail) => rail.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open rail whose bay sits ahead of the desk. An unset desk has no next rail. */
export function nextRail(rails: readonly MezzanineRail[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readRails(rails)
    .filter((rail) => inTray(rail, "open") && rail.weight === 2 && rail.bay !== null && (rail.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function railCopy(rail: MezzanineRail, desk: unknown): string {
  const gap = bayGap(rail.bay, desk);
  return [rail.title, rail.watcher, rail.bay ?? "", rail.finish, rail.tempo, rail.bell ?? "", rail.weight, rail.tags.join(" "), rail.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the rails saved in this browser. The gap and the late mark use the bay you pass. */
export function railsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,watcher,bay,finish,tempo,bell,weight,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readRails(raw);
  const windowIds = new Set(windowRails(rows, desk).map((rail) => rail.id));
  const at = bayOf(desk);
  for (const rail of rows) {
    const gap = bayGap(rail.bay, desk);
    lines.push([
      rail.title,
      rail.watcher,
      rail.bay === null ? "" : String(rail.bay),
      rail.finish,
      rail.tempo,
      rail.bell === null ? "" : String(rail.bell),
      String(rail.weight),
      rail.tags.join(" "),
      rail.pinned ? "1" : "0",
      rail.held ? "1" : "0",
      rail.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateRail(rail, desk) ? "1" : "0",
      soonRail(rail) ? "1" : "0",
      houseFinish(rail.finish) ? "1" : "0",
      windowIds.has(rail.id) ? "1" : "0",
      at !== null && rail.bay === at && rail.weight === 2 && inTray(rail, "open") ? "1" : "0",
      rail.note,
      rail.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeWatcher(raw: string, watchers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return watchers.includes(raw) ? raw : "all";
}

export function activeFinish(raw: string, finishes: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = finishOf(raw);
  return name && finishes.map((item) => item.toUpperCase()).includes(name) ? name : finishes.includes(raw) ? raw : "all";
}

export function activeTempo(raw: string, tempos: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempos.includes(raw) ? raw : "all";
}

export function activeBay(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return bayOf(raw) === null ? "all" : raw;
}

export function activeBell(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return bellOf(raw) === null ? "all" : raw;
}

export function activeWeight(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightOf(raw) === null ? "all" : raw;
}

export function watcherArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function finishArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return finishOf(filter) || null;
}

export function tempoArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function bellArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return bellOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): RailView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    watcher: clip(row.watcher, 18),
    finish: clip(row.finish, 12),
    tempo: clip(row.tempo, 8),
    bay: clip(row.bay, 8),
    bell: clip(row.bell, 8),
    weight: clip(row.weight, 8),
  };
}

export function readRailViews(raw: unknown): RailView[] {
  if (!Array.isArray(raw)) return [];
  const out: RailView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addRailView(views: readonly RailView[], view: RailView): RailView[] {
  const current = readRailViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropRailView(views: readonly RailView[], id: string): RailView[] {
  return readRailViews(views).filter((view) => view.id !== id);
}

function symbolBody(raw: unknown): string {
  return clip(raw, 12).replace(/\s+/g, "").toUpperCase();
}

function sideBody(raw: unknown): string {
  return clip(raw, 8).toUpperCase();
}

function statusBody(raw: unknown): string {
  return clip(raw, 8).toUpperCase();
}

function crestParts(value: CrestValue): { symbol: string; side: string; status: string; ok: boolean } {
  if (typeof value === "string") return { symbol: symbolBody(value), side: "", status: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { symbol: "", side: "", status: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { symbol: "", side: "", status: "", ok: false };
  if (!("symbol" in value) && !("side" in value) && !("status" in value)) return { symbol: "", side: "", status: "", ok: false };
  const symbol = "symbol" in value ? value.symbol : "";
  const side = "side" in value ? value.side : "";
  const status = "status" in value ? value.status : "";
  if ((symbol != null && typeof symbol !== "string") || (side != null && typeof side !== "string") || (status != null && typeof status !== "string")) {
    return { symbol: "", side: "", status: "", ok: false };
  }
  return { symbol: symbolBody(symbol), side: sideBody(side), status: statusBody(status), ok: true };
}

export function crestState(value: CrestValue): CrestState {
  const found = crestParts(value);
  if (!found.ok) return "";
  return found.symbol ? "set" : "clear";
}

export function crestCopy(value: CrestValue): string {
  const found = crestParts(value);
  return found.ok ? found.symbol : "";
}

/** The mark is the first three letters of the symbol. */
export function markOf(value: CrestValue): string {
  const text = crestCopy(value);
  return text ? text.slice(0, 3) : "";
}

/**
 * EURUSD, XAUUSD, GBPUSD, USDJPY, NAS100, or a symbol that contains XAU, is the core.
 * Any other symbol with a slash or a dot is the wing.
 * Any other text is the loft.
 */
export function crestLane(value: CrestValue): CrestLane {
  const text = crestCopy(value);
  if (!text) return "";
  if (CATALOG.has(text) || text.includes("XAU")) return "core";
  if (text.includes("/") || text.includes(".")) return "wing";
  return "loft";
}

/** BUY and LONG are long. SELL and SHORT are short. FLAT is flat. Any other side is mist. */
export function crestTone(value: CrestValue): CrestTone {
  const found = crestParts(value);
  if (!found.ok || !found.symbol) return "";
  if (found.side === "BUY" || found.side === "LONG") return "long";
  if (found.side === "SELL" || found.side === "SHORT") return "short";
  if (found.side === "FLAT") return "flat";
  return found.side ? "mist" : "";
}

export function catalogCrest(value: CrestValue): boolean {
  return CATALOG.has(crestCopy(value));
}

export function catalogCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => catalogCrest(row.note)).length;
}

export function wideCrest(value: CrestValue): boolean {
  return crestCopy(value).length >= 7;
}

export function wideCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => wideCrest(row.note)).length;
}

export function longCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestTone(row.note) === "long").length;
}

export function openBookCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => {
    const found = crestParts(row.note);
    return found.ok && found.status === "OPEN";
  }).length;
}

export function shutBookCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => {
    const found = crestParts(row.note);
    return found.ok && found.status === "CLOSED";
  }).length;
}

export function sharedMarkCount(rows: readonly CrestRow[]): number {
  const marks = rows.map((row) => markOf(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(markOf(row.note))).length;
}

export function crestLanes(rows: readonly CrestRow[]): CrestLaneLine[] {
  const lanes = ["core", "wing", "loft"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => crestLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

export function leadingCrest(rows: readonly CrestRow[]): string {
  const lines = crestLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || a.lane.localeCompare(b.lane))[0].lane;
}

export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const tones = ["long", "short", "flat", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => crestTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || a.tone.localeCompare(b.tone))[0].tone;
}

export function crestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is a short symbol, 2 is a medium symbol, 3 is a long symbol. */
export function crestStep(value: CrestValue): 0 | 1 | 2 | 3 {
  const text = crestCopy(value);
  if (!text) return 0;
  if (text.length <= 3) return 1;
  if (text.length <= 6) return 2;
  return 3;
}

export function presentLanes(rows: readonly CrestRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = crestState(row.note);
    const lane = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenLanes(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "core" || lane === "wing" || lane === "loft" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleCrest(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
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

export function visibleCrestLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleCrests(
  rows: readonly CrestRow[],
  lane: CrestLane | "blank" | null,
  tone: CrestTone | null,
  query: string,
  review: CrestReview,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = crestState(row.note);
    if (!state) return false;
    const token = state === "set" ? crestLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && crestTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${crestCopy(row.note)} ${markOf(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "catalog" && !catalogCrest(row.note)) return false;
    if (shape === "wide" && !wideCrest(row.note)) return false;
    if (shape === "open" && crestParts(row.note).status !== "OPEN") return false;
    if (shape === "shut" && crestParts(row.note).status !== "CLOSED") return false;
    return true;
  });
}

export function activeCrestLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeCrestTone(raw: string): string {
  return raw === "long" || raw === "short" || raw === "flat" || raw === "mist" || raw === "all" ? raw : "all";
}

export function crestLaneArg(filter: string): CrestLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "core" || filter === "wing" || filter === "loft") return filter;
  return null;
}

export function crestToneArg(filter: string): CrestTone | null {
  if (filter === "all") return null;
  if (filter === "long" || filter === "short" || filter === "flat" || filter === "mist") return filter;
  return null;
}

export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["lane,count"];
  for (const line of crestLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["symbol,mark,lane,tone,step,catalog,wide,open,shut,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = crestParts(row.note);
    if (!found.ok) continue;
    lines.push([
      found.symbol,
      markOf(row.note),
      crestLane(row.note),
      crestTone(row.note),
      String(crestStep(row.note)),
      catalogCrest(row.note) ? "1" : "0",
      wideCrest(row.note) ? "1" : "0",
      found.status === "OPEN" ? "1" : "0",
      found.status === "CLOSED" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
