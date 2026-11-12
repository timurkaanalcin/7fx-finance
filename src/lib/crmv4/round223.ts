/**
 * Oriel sills for the overview desk, and log hours already stored as type, title, and createdAt on each loaded communication.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_oriel_sill (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   light integer,
 *   glaze text not null default '',
 *   mood text not null default '',
 *   chime integer,
 *   rank integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_log_hour_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_log_hour_review (
 *   communication_id text primary key
 * );
 */

export const ORS_KEY = "crmv4-oriel-sill";
export const ORS_VIEW_KEY = "crmv4-oriel-views";
export const ORS_DENSITY_KEY = "crmv4-oriel-density";
export const LGH_KEY = "crmv4-log-hour-hide";
export const LGH_REVIEW_KEY = "crmv4-log-hour-review";

export type GlazeName = "blank" | "ivory" | "ink" | "gilt";

export type MoodName = "blank" | "still" | "warm" | "dusk";

export type SillTray = "open" | "held" | "archived";

export type LightPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SillDensity = "airy" | "tight";

export type SillSort = "light" | "steward";

export type OrielSill = {
  id: string;
  title: string;
  note: string;
  steward: string;
  light: number | null;
  glaze: string;
  mood: string;
  chime: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type SillView = {
  id: string;
  name: string;
  tray: SillTray;
  query: string;
  steward: string;
  glaze: string;
  mood: string;
  light: string;
  chime: string;
  rank: string;
};

export type SillCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rank: number;
  house: number;
  window: number;
  matched: number;
};

export type HourLane = "" | "folio" | "bell" | "thread";

export type HourTone = "" | "dawn" | "day" | "night" | "hush" | "mist";

export type HourState = "" | "clear" | "set";

export type HourShape = "all" | "catalog" | "wide" | "open" | "shut";

export type HourReview = "all" | "reviewed" | "fresh";

export type HourValue = string | { type?: unknown; title?: unknown; createdAt?: unknown; [key: string]: unknown } | null | undefined;

export type HourRow = { id: string; label: string; note: HourValue };

export type HourLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "mood", "pin", "unpin", "hold", "resume", "archive", "open", "glaze", "tag", "rank", "chime"] as const;

const GLAZES = ["ivory", "ink", "gilt"] as const;

const MOODS = ["still", "warm", "dusk"] as const;

const MOOD_CYCLE = ["still", "warm", "dusk"] as const;

const PEAK_LIGHTS = new Set([2, 4]);

const QUIET_LIGHTS = new Set([5]);

const HOUSE = new Set(["IVORY", "GILT"]);

const HOUSE_TYPES = new Set(["NOTE", "CALL"]);

const MONEY_KEYS = ["profit", "volume", "amount", "currency", "balance"];

const SILL_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SillTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<GlazeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<GlazeName, "blank">) : "";
}

function moodName(raw: unknown): Exclude<MoodName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (MOODS as readonly string[]).includes(text) ? (text as Exclude<MoodName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[def]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(sill: OrielSill, tray: SillTray): boolean {
  if (tray === "held") return sill.held && !sill.archived;
  if (tray === "archived") return sill.archived;
  return !sill.held && !sill.archived;
}

/** A blank title is left out. The saved title stays short. */
export function sillLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function sillNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A glaze is IVORY, INK, or GILT. Anything else stays blank. Letters are stored in capitals. */
export function glazeOf(raw: unknown): string {
  const name = glazeName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A light is an integer from 1 through 5.
 * A blank value stays unset. 0 is not a light.
 * A second digit is not a light.
 */
export function lightOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 5) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-5]$/.test(text)) return null;
  return Number(text);
}

/** A chime is 12, 24, or 48. A blank value stays unset. A leading zero is not a chime. */
export function chimeOf(raw: unknown): 12 | 24 | 48 | null {
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  if (raw === 48 || raw === "48") return 48;
  return null;
}

/** Rank is 1, 3, or 9. Anything else is not a rank. 1 is the resting rank. */
export function rankOf(raw: unknown): 1 | 3 | 9 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 9 || raw === "9") return 9;
  return null;
}

export function lightBand(light: unknown): "blank" | "early" | "mid" | "late" {
  const value = lightOf(light);
  if (value === null) return "blank";
  if (value <= 1) return "early";
  if (value <= 3) return "mid";
  return "late";
}

/** Peak lights are 2 and 4. An unset light is not a peak light. */
export function peakLight(light: unknown): boolean {
  const value = lightOf(light);
  return value !== null && PEAK_LIGHTS.has(value);
}

/** The quiet light is 5. A peak light is not quiet. An unset light is not quiet. */
export function quietLight(light: unknown): boolean {
  const value = lightOf(light);
  return value !== null && QUIET_LIGHTS.has(value);
}

/**
 * How far a light sits behind the desk light.
 * A positive gap means the sill is behind. A negative gap means it is ahead.
 * A gap of zero means the same light. An unset light has no gap. Lights do not wrap.
 */
export function lightGap(light: unknown, desk: unknown): number | null {
  const from = lightOf(light);
  const at = lightOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and GILT are house glazes. INK is a guest glaze. A blank glaze is not a house glaze. */
export function houseGlaze(glaze: unknown): boolean {
  return HOUSE.has(glazeOf(glaze));
}

export function densityOf(raw: unknown): SillDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function sortMode(raw: unknown): SillSort {
  return raw === "steward" ? "steward" : "light";
}

function readOne(raw: unknown): OrielSill | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = sillLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: sillNote(row.note),
    steward: stewardLabel(row.steward),
    light: lightOf(row.light),
    glaze: glazeOf(row.glaze),
    mood: moodName(row.mood),
    chime: chimeOf(row.chime),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readSills(raw: unknown): OrielSill[] {
  if (!Array.isArray(raw)) return [];
  const out: OrielSill[] = [];
  for (const item of raw) {
    const sill = readOne(item);
    if (!sill || out.some((row) => row.id === sill.id || row.title === sill.title)) continue;
    out.push(sill);
  }
  return out.slice(0, SILL_CAP);
}

export function addSill(
  sills: readonly OrielSill[],
  sill: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    light?: unknown;
    glaze?: string;
    mood?: string;
    chime?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): OrielSill[] {
  const current = readSills(sills);
  const id = String(sill.id || "").trim();
  const title = sillLine(sill.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(sill.rank);
  const next: OrielSill = {
    id,
    title,
    note: sillNote(sill.note),
    steward: stewardLabel(sill.steward),
    light: lightOf(sill.light),
    glaze: glazeOf(sill.glaze),
    mood: moodName(sill.mood),
    chime: chimeOf(sill.chime),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(sill.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SILL_CAP);
}

/** A blank mood becomes still, still becomes warm, warm becomes dusk, and dusk returns to still. */
export function cycleMood(sills: readonly OrielSill[], id: string): OrielSill[] {
  return readSills(sills).map((sill) => {
    if (sill.id !== id) return sill;
    const at = MOOD_CYCLE.indexOf(sill.mood as (typeof MOOD_CYCLE)[number]);
    const next = at < 0 ? MOOD_CYCLE[0] : MOOD_CYCLE[(at + 1) % MOOD_CYCLE.length];
    if (!next || next === sill.mood) return sill;
    return { ...sill, mood: next, audit: "mood" };
  });
}

/** A blank title is left as it is. */
export function editSill(sills: readonly OrielSill[], id: string, title: unknown): OrielSill[] {
  const next = sillLine(title);
  if (!next) return readSills(sills);
  const current = readSills(sills);
  if (current.some((sill) => sill.id !== id && sill.title === next)) return current;
  return current.map((sill) => (sill.id === id && sill.title !== next ? { ...sill, title: next, audit: "edit" } : sill));
}

export function editSillNote(sills: readonly OrielSill[], id: string, note: unknown): OrielSill[] {
  const next = sillNote(note);
  return readSills(sills).map((sill) => (sill.id === id && sill.note !== next ? { ...sill, note: next, audit: "note" } : sill));
}

export function addSillTag(sills: readonly OrielSill[], id: string, tag: unknown): OrielSill[] {
  const next = tagsOf(tag);
  if (!next.length) return readSills(sills);
  return readSills(sills).map((sill) => {
    if (sill.id !== id) return sill;
    const tags = tagsOf([...sill.tags, ...next]);
    if (tags.join() === sill.tags.join()) return sill;
    return { ...sill, tags, audit: "tag" };
  });
}

export function setSillRank(sills: readonly OrielSill[], id: string, rank: unknown): OrielSill[] {
  const next = rankOf(rank);
  if (next === null) return readSills(sills);
  return readSills(sills).map((sill) => (sill.id === id && sill.rank !== next ? { ...sill, rank: next, audit: "rank" } : sill));
}

/** Snooze lengthens the chime from blank to 12, from 12 to 24, and from 24 to 48. 48 stays. */
export function snoozeSill(sills: readonly OrielSill[], id: string): OrielSill[] {
  return readSills(sills).map((sill) => {
    if (sill.id !== id) return sill;
    const next = sill.chime === null ? 12 : sill.chime === 12 ? 24 : sill.chime === 24 ? 48 : null;
    if (next === null) return sill;
    return { ...sill, chime: next, audit: "chime" };
  });
}

export function setSillPin(sills: readonly OrielSill[], id: string, pinned: boolean): OrielSill[] {
  return readSills(sills).map((sill) => (sill.id === id && sill.pinned !== pinned ? { ...sill, pinned, audit: pinned ? "pin" : "unpin" } : sill));
}

export function pinFocused(sills: readonly OrielSill[], shownIds: readonly string[], index: number): OrielSill[] {
  const id = shownIds[index];
  if (!id) return readSills(sills);
  const sill = readSills(sills).find((item) => item.id === id);
  if (!sill) return readSills(sills);
  return setSillPin(sills, id, !sill.pinned);
}

export function snoozeFocused(sills: readonly OrielSill[], shownIds: readonly string[], index: number): OrielSill[] {
  const id = shownIds[index];
  return id ? snoozeSill(sills, id) : readSills(sills);
}

export function holdFocused(sills: readonly OrielSill[], shownIds: readonly string[], index: number): OrielSill[] {
  const id = shownIds[index];
  if (!id) return readSills(sills);
  const sill = readSills(sills).find((item) => item.id === id);
  if (!sill || sill.archived) return readSills(sills);
  return setSillHold(sills, id, !sill.held);
}

export function moodFocused(sills: readonly OrielSill[], shownIds: readonly string[], index: number): OrielSill[] {
  const id = shownIds[index];
  return id ? cycleMood(sills, id) : readSills(sills);
}

export function setSillHold(sills: readonly OrielSill[], id: string, held: boolean): OrielSill[] {
  return readSills(sills).map((sill) => (sill.id === id && !sill.archived && sill.held !== held ? { ...sill, held, audit: held ? "hold" : "resume" } : sill));
}

export function setSillArchive(sills: readonly OrielSill[], id: string, archived: boolean): OrielSill[] {
  return readSills(sills).map((sill) => (sill.id === id && sill.archived !== archived ? { ...sill, archived, held: archived ? false : sill.held, audit: archived ? "archive" : "open" } : sill));
}

export function bulkSillGlaze(sills: readonly OrielSill[], ids: readonly string[], glaze: unknown): OrielSill[] {
  const next = glazeOf(glaze);
  if (!next) return readSills(sills);
  const want = new Set(ids);
  return readSills(sills).map((sill) => (want.has(sill.id) && sill.glaze !== next ? { ...sill, glaze: next, audit: "glaze" } : sill));
}

export function bulkSillPin(sills: readonly OrielSill[], ids: readonly string[], pinned: boolean): OrielSill[] {
  const want = new Set(ids);
  return readSills(sills).map((sill) => (want.has(sill.id) && sill.pinned !== pinned ? { ...sill, pinned, audit: pinned ? "pin" : "unpin" } : sill));
}

export function bulkSillArchive(sills: readonly OrielSill[], ids: readonly string[], archived: boolean): OrielSill[] {
  const want = new Set(ids);
  return readSills(sills).map((sill) => (want.has(sill.id) && sill.archived !== archived ? { ...sill, archived, held: archived ? false : sill.held, audit: archived ? "archive" : "open" } : sill));
}

export function bulkSillMood(sills: readonly OrielSill[], ids: readonly string[], mood: unknown): OrielSill[] {
  const next = moodName(mood);
  if (!next) return readSills(sills);
  const want = new Set(ids);
  return readSills(sills).map((sill) => (want.has(sill.id) && sill.mood !== next ? { ...sill, mood: next, audit: "mood" } : sill));
}

export function bulkSillTag(sills: readonly OrielSill[], ids: readonly string[], tag: unknown): OrielSill[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addSillTag(rows, id, tag) : rows), readSills(sills));
}

export function resetSills(): OrielSill[] {
  return [];
}

/** An open sill whose light sits more than two lights behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateSill(sill: OrielSill, desk: unknown): boolean {
  const gap = lightGap(sill.light, desk);
  return inTray(sill, "open") && sill.rank === 1 && gap !== null && gap > 2;
}

/** An open sill with a chime of 12 is due now. A raised rank, a hold, or an archive is not. */
export function soonSill(sill: OrielSill): boolean {
  return inTray(sill, "open") && sill.rank === 1 && sill.chime === 12;
}

/** Open sills that are late or due now. A raised sill stays off the reminder list. */
export function reminderSills(sills: readonly OrielSill[], desk: unknown): OrielSill[] {
  return readSills(sills).filter((sill) => lateSill(sill, desk) || soonSill(sill));
}

/** Open sills whose light sits within two lights of the desk. A raised rank, a hold, or an archive stays out. */
export function windowSills(sills: readonly OrielSill[], desk: unknown): OrielSill[] {
  return readSills(sills).filter((sill) => {
    const gap = lightGap(sill.light, desk);
    return inTray(sill, "open") && sill.rank === 1 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedSills(sills: readonly OrielSill[], desk: unknown): number {
  const at = lightOf(desk);
  if (at === null) return 0;
  return readSills(sills).filter((sill) => inTray(sill, "open") && sill.rank === 1 && sill.light === at).length;
}

function lightHit(light: number | null, exact: number | null, pick: LightPick | null): boolean {
  if (exact !== null) return light === exact;
  if (pick === null) return true;
  if (pick === "blank") return light === null;
  if (pick === "peak") return peakLight(light);
  if (pick === "quiet") return quietLight(light);
  return lightBand(light) === pick;
}

/** Search matches the title, the note, the steward, and the tags. */
export function visibleSills(
  sills: readonly OrielSill[],
  tray: SillTray,
  query: string,
  steward: string | null,
  glaze: string | null,
  mood: string | null,
  exact: number | null,
  pick: LightPick | null,
  chime: number | "blank" | null,
  rank: number | "blank" | null,
  duskOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): OrielSill[] {
  const text = query.trim().toLowerCase();
  return readSills(sills).filter((sill) => {
    if (!inTray(sill, tray)) return false;
    if (text) {
      const hay = `${sill.title} ${sill.note} ${sill.steward} ${sill.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (steward !== null && sill.steward !== steward) return false;
    if (glaze === "blank" ? Boolean(sill.glaze) : glaze && sill.glaze !== glaze) return false;
    if (mood === "blank" ? Boolean(sill.mood) : mood && sill.mood !== mood) return false;
    if (!lightHit(sill.light, exact, pick)) return false;
    if (chime === "blank" ? sill.chime !== null : chime !== null && sill.chime !== chime) return false;
    if (rank === "blank" ? sill.rank !== 1 : rank !== null && sill.rank !== rank) return false;
    if (duskOnly && sill.mood !== "dusk") return false;
    if (peakOnly && !peakLight(sill.light)) return false;
    if (houseOnly && !houseGlaze(sill.glaze)) return false;
    if (quietOnly && !quietLight(sill.light)) return false;
    if (lightOnly && sill.rank !== 1) return false;
    return true;
  });
}

export function sortSills(sills: readonly OrielSill[], mode: SillSort): OrielSill[] {
  const rows = sills.slice();
  if (mode === "steward") return rows.sort((a, b) => a.steward.localeCompare(b.steward) || (a.light ?? 99) - (b.light ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.light ?? 99) - (b.light ?? 99) || a.title.localeCompare(b.title));
}

export function sillLedger(sills: readonly OrielSill[], query: string): OrielSill[] {
  const text = query.trim().toLowerCase();
  return sortSills(
    readSills(sills).filter((sill) => sill.light !== null && (!text || sill.title.toLowerCase().includes(text))),
    "light",
  );
}

export function sillCounts(sills: readonly OrielSill[], desk: unknown): SillCounts {
  const rows = readSills(sills);
  return {
    open: rows.filter((sill) => inTray(sill, "open")).length,
    held: rows.filter((sill) => inTray(sill, "held")).length,
    archived: rows.filter((sill) => inTray(sill, "archived")).length,
    pinned: rows.filter((sill) => sill.pinned).length,
    peak: rows.filter((sill) => inTray(sill, "open") && sill.rank === 1 && peakLight(sill.light)).length,
    late: rows.filter((sill) => lateSill(sill, desk)).length,
    soon: rows.filter((sill) => soonSill(sill)).length,
    rank: rows.filter((sill) => inTray(sill, "open") && sill.rank > 1).length,
    house: rows.filter((sill) => inTray(sill, "open") && houseGlaze(sill.glaze)).length,
    window: windowSills(rows, desk).length,
    matched: matchedSills(rows, desk),
  };
}

export function sillShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open sills as a share of every open sill. */
export function lateShare(sills: readonly OrielSill[], desk: unknown): number {
  const rows = readSills(sills).filter((sill) => inTray(sill, "open"));
  return sillShare(rows.filter((sill) => lateSill(sill, desk)).length, rows.length);
}

export function usedLights(sills: readonly OrielSill[]): number {
  return new Set(readSills(sills).filter((sill) => inTray(sill, "open") && sill.light !== null).map((sill) => sill.light)).size;
}

/** Open sills that share a light. */
export function clashLightCount(sills: readonly OrielSill[]): number {
  const open = readSills(sills).filter((sill) => inTray(sill, "open") && sill.light !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].light === open[j].light) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open sills that share a chime. */
export function chimeClashCount(sills: readonly OrielSill[]): number {
  const open = readSills(sills).filter((sill) => inTray(sill, "open") && sill.chime !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].chime === open[j].chime) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open sills whose lights sit exactly two lights apart. */
export function adjacentSillCount(sills: readonly OrielSill[]): number {
  const open = readSills(sills).filter((sill) => inTray(sill, "open") && sill.light !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].light || 0) - (open[j].light || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The glaze with the fewest open sills.
 * A tie keeps INK, then GILT, then IVORY.
 * An empty desk still suggests INK.
 */
export function suggestGlaze(sills: readonly OrielSill[]): "INK" | "GILT" | "IVORY" {
  const rows = readSills(sills).filter((sill) => inTray(sill, "open"));
  const order = ["INK", "GILT", "IVORY"] as const;
  let best: "INK" | "GILT" | "IVORY" = "INK";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const glaze of order) {
    const count = rows.filter((sill) => sill.glaze === glaze).length;
    if (count < bestCount) {
      best = glaze;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The chime with the fewest open sills.
 * A tie keeps 24, then 12, then 48.
 * An empty desk still suggests 24.
 */
export function suggestChime(sills: readonly OrielSill[]): 12 | 24 | 48 {
  const rows = readSills(sills).filter((sill) => inTray(sill, "open"));
  const order = [24, 12, 48] as const;
  let best: 12 | 24 | 48 = 24;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const chime of order) {
    const count = rows.filter((sill) => sill.chime === chime).length;
    if (count < bestCount) {
      best = chime;
      bestCount = count;
    }
  }
  return best;
}

/** The newest steward already written on a sill. A blank steward is skipped. */
export function suggestSteward(sills: readonly OrielSill[]): string {
  const found = readSills(sills).find((sill) => sill.steward);
  return found ? found.steward : "";
}

/**
 * The steward carrying the fewest open sills.
 * A tie keeps the earlier name. A blank steward is not a load.
 * An empty roster falls back to the newest steward.
 */
export function fairSteward(sills: readonly OrielSill[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = stewardLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSteward(sills);
  const open = readSills(sills).filter((sill) => inTray(sill, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((sill) => sill.steward === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The steward with the most open sills. A tie keeps the newer name on the desk. */
export function busiestSteward(sills: readonly OrielSill[]): string {
  const rows = readSills(sills).filter((sill) => inTray(sill, "open") && sill.steward);
  const names: string[] = [];
  for (const sill of rows) if (!names.includes(sill.steward)) names.push(sill.steward);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((sill) => sill.steward === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function sillStewards(sills: readonly OrielSill[]): string[] {
  const out: string[] = [];
  for (const sill of readSills(sills)) {
    if (sill.steward && !out.includes(sill.steward)) out.push(sill.steward);
  }
  return out;
}

export function sillGlazes(sills: readonly OrielSill[]): string[] {
  const out: string[] = [];
  for (const sill of readSills(sills)) {
    if (sill.glaze && !out.includes(sill.glaze)) out.push(sill.glaze);
  }
  return out;
}

/** Open sills whose steward also watches another open sill on a different light. */
export function pairStewardCount(sills: readonly OrielSill[]): number {
  const open = readSills(sills).filter((sill) => inTray(sill, "open") && sill.steward && sill.light !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].steward === open[j].steward && open[i].light !== open[j].light) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open sills that share a glaze on different lights. */
export function sharedGlazeCount(sills: readonly OrielSill[]): number {
  const open = readSills(sills).filter((sill) => inTray(sill, "open") && sill.glaze && sill.light !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].glaze === open[j].glaze && open[i].light !== open[j].light) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rank of open sills. The resting rank of 1 still counts. */
export function rankLoad(sills: readonly OrielSill[]): number {
  return readSills(sills).filter((sill) => inTray(sill, "open")).reduce((sum, sill) => sum + sill.rank, 0);
}

/** Open sills that are both the quiet light and a house glaze. */
export function quietGalleryCount(sills: readonly OrielSill[]): number {
  return readSills(sills).filter((sill) => inTray(sill, "open") && quietLight(sill.light) && houseGlaze(sill.glaze)).length;
}

/** Open sills whose mood is dusk. */
export function duskLoad(sills: readonly OrielSill[]): number {
  return readSills(sills).filter((sill) => inTray(sill, "open") && sill.mood === "dusk").length;
}

export function lightSpan(sills: readonly OrielSill[]): number {
  const lights = readSills(sills).filter((sill) => inTray(sill, "open") && sill.light !== null).map((sill) => sill.light as number);
  if (!lights.length) return 0;
  return Math.max(...lights) - Math.min(...lights);
}

/** The next open sill whose light sits ahead of the desk. An unset desk has no next sill. */
export function nextSill(sills: readonly OrielSill[], desk: unknown): string {
  const at = lightOf(desk);
  if (at === null) return "";
  const rows = readSills(sills)
    .filter((sill) => inTray(sill, "open") && sill.rank === 1 && sill.light !== null && (sill.light as number) > at)
    .sort((a, b) => (a.light || 0) - (b.light || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function sillCopy(sill: OrielSill, desk: unknown): string {
  const gap = lightGap(sill.light, desk);
  return [sill.title, sill.steward, sill.light ?? "", sill.glaze, sill.mood, sill.chime ?? "", sill.rank, sill.tags.join(" "), sill.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the sills saved in this browser. The gap and the late mark use the light you pass. */
export function sillsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,steward,light,glaze,mood,chime,rank,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readSills(raw);
  const windowIds = new Set(windowSills(rows, desk).map((sill) => sill.id));
  const at = lightOf(desk);
  for (const sill of rows) {
    const gap = lightGap(sill.light, desk);
    lines.push([
      sill.title,
      sill.steward,
      sill.light === null ? "" : String(sill.light),
      sill.glaze,
      sill.mood,
      sill.chime === null ? "" : String(sill.chime),
      String(sill.rank),
      sill.tags.join(" "),
      sill.pinned ? "1" : "0",
      sill.held ? "1" : "0",
      sill.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSill(sill, desk) ? "1" : "0",
      soonSill(sill) ? "1" : "0",
      houseGlaze(sill.glaze) ? "1" : "0",
      windowIds.has(sill.id) ? "1" : "0",
      at !== null && sill.light === at && sill.rank === 1 && inTray(sill, "open") ? "1" : "0",
      sill.note,
      sill.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeSteward(raw: string, stewards: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return stewards.includes(raw) ? raw : "all";
}

export function activeGlaze(raw: string, glazes: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = glazeOf(raw);
  return name && glazes.map((item) => item.toUpperCase()).includes(name) ? name : glazes.includes(raw) ? raw : "all";
}

export function activeMood(raw: string, moods: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return moods.includes(raw) ? raw : "all";
}

export function activeLight(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return lightOf(raw) === null ? "all" : raw;
}

export function activeChime(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return chimeOf(raw) === null ? "all" : raw;
}

export function activeRank(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return rankOf(raw) === null ? "all" : raw;
}

export function stewardArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function glazeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return glazeOf(filter) || null;
}

export function moodArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return moodName(filter) || null;
}

export function lightArg(filter: string): { exact: number | null; pick: LightPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: lightOf(filter), pick: null };
}

export function chimeArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return chimeOf(filter);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

function readView(raw: unknown): SillView | null {
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
    steward: clip(row.steward, 18),
    glaze: clip(row.glaze, 12),
    mood: clip(row.mood, 8),
    light: clip(row.light, 8),
    chime: clip(row.chime, 8),
    rank: clip(row.rank, 8),
  };
}

export function readSillViews(raw: unknown): SillView[] {
  if (!Array.isArray(raw)) return [];
  const out: SillView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSillView(views: readonly SillView[], view: SillView): SillView[] {
  const current = readSillViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropSillView(views: readonly SillView[], id: string): SillView[] {
  return readSillViews(views).filter((view) => view.id !== id);
}

function titleBody(raw: unknown): string {
  return clip(raw, 40);
}

function typeBody(raw: unknown): string {
  return clip(raw, 8).toUpperCase();
}

function hourClock(raw: unknown): number | null {
  if (typeof raw !== "string" || !raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCHours();
}

function hourParts(value: HourValue): { type: string; title: string; hour: number | null; ok: boolean } {
  if (typeof value === "string") return { type: "", title: titleBody(value), hour: null, ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { type: "", title: "", hour: null, ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { type: "", title: "", hour: null, ok: false };
  if (!("type" in value) && !("title" in value) && !("createdAt" in value)) return { type: "", title: "", hour: null, ok: false };
  const type = "type" in value ? value.type : "";
  const title = "title" in value ? value.title : "";
  const createdAt = "createdAt" in value ? value.createdAt : "";
  if ((type != null && typeof type !== "string") || (title != null && typeof title !== "string") || (createdAt != null && typeof createdAt !== "string")) {
    return { type: "", title: "", hour: null, ok: false };
  }
  return { type: typeBody(type), title: titleBody(title), hour: hourClock(createdAt), ok: true };
}

export function hourState(value: HourValue): HourState {
  const found = hourParts(value);
  if (!found.ok) return "";
  return found.title || found.type ? "set" : "clear";
}

export function hourCopy(value: HourValue): string {
  const found = hourParts(value);
  return found.ok ? found.title : "";
}

/** The mark is the first four letters of the title. */
export function markOf(value: HourValue): string {
  const text = hourCopy(value).replace(/\s+/g, "").toUpperCase();
  return text ? text.slice(0, 4) : "";
}

/**
 * NOTE is the folio. CALL is the bell. CHAT is the thread.
 * A title that asks a question is the thread. A title that ends with a bang is the bell.
 * Any other title is the folio.
 */
export function hourLane(value: HourValue): HourLane {
  const found = hourParts(value);
  if (!found.ok || (!found.title && !found.type)) return "";
  if (found.type === "NOTE") return "folio";
  if (found.type === "CALL") return "bell";
  if (found.type === "CHAT") return "thread";
  if (found.title.includes("?")) return "thread";
  if (found.title.endsWith("!")) return "bell";
  return found.title ? "folio" : "";
}

/** Hours 5 through 11 are dawn. Hours 12 through 17 are day. The other hours are night. A known type with no clock is hush. Any other type is mist. */
export function hourTone(value: HourValue): HourTone {
  const found = hourParts(value);
  if (!found.ok || (!found.title && !found.type)) return "";
  if (found.hour !== null) {
    if (found.hour >= 5 && found.hour <= 11) return "dawn";
    if (found.hour >= 12 && found.hour <= 17) return "day";
    return "night";
  }
  if (found.type && !HOUSE_TYPES.has(found.type) && found.type !== "CHAT") return "mist";
  return "hush";
}

export function catalogHour(value: HourValue): boolean {
  const found = hourParts(value);
  return found.ok && HOUSE_TYPES.has(found.type);
}

export function catalogHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => catalogHour(row.note)).length;
}

export function wideHour(value: HourValue): boolean {
  return hourCopy(value).length >= 18;
}

export function wideHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => wideHour(row.note)).length;
}

export function dawnHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourTone(row.note) === "dawn").length;
}

export function openHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => {
    const found = hourParts(row.note);
    return found.ok && found.type === "NOTE";
  }).length;
}

export function shutHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => {
    const found = hourParts(row.note);
    return found.ok && found.type === "CHAT";
  }).length;
}

export function sharedMarkCount(rows: readonly HourRow[]): number {
  const marks = rows.map((row) => markOf(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(markOf(row.note))).length;
}

export function hourLanes(rows: readonly HourRow[]): HourLaneLine[] {
  const lanes = ["folio", "bell", "thread"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => hourLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

export function leadingHour(rows: readonly HourRow[]): string {
  const lines = hourLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || a.lane.localeCompare(b.lane))[0].lane;
}

export function leadingHourTone(rows: readonly HourRow[]): string {
  const tones = ["dawn", "day", "night", "hush", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => hourTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || a.tone.localeCompare(b.tone))[0].tone;
}

export function hourShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is a short title, 2 is a medium title, 3 is a long title. */
export function hourStep(value: HourValue): 0 | 1 | 2 | 3 {
  const text = hourCopy(value);
  if (!text) return 0;
  if (text.length <= 8) return 1;
  if (text.length <= 16) return 2;
  return 3;
}

export function presentLanes(rows: readonly HourRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = hourState(row.note);
    const lane = state === "set" ? hourLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenLanes(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "folio" || lane === "bell" || lane === "thread" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedHours(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleHour(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleHourReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkHourReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleHourLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleHours(
  rows: readonly HourRow[],
  lane: HourLane | "blank" | null,
  tone: HourTone | null,
  query: string,
  review: HourReview,
  reviewed: readonly string[],
  shape: HourShape,
): HourRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = hourState(row.note);
    if (!state) return false;
    const token = state === "set" ? hourLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && hourTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${hourCopy(row.note)} ${markOf(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "catalog" && !catalogHour(row.note)) return false;
    if (shape === "wide" && !wideHour(row.note)) return false;
    if (shape === "open" && hourParts(row.note).type !== "NOTE") return false;
    if (shape === "shut" && hourParts(row.note).type !== "CHAT") return false;
    return true;
  });
}

export function activeHourLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeHourTone(raw: string): string {
  return raw === "dawn" || raw === "day" || raw === "night" || raw === "hush" || raw === "mist" || raw === "all" ? raw : "all";
}

export function hourLaneArg(filter: string): HourLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "folio" || filter === "bell" || filter === "thread") return filter;
  return null;
}

export function hourToneArg(filter: string): HourTone | null {
  if (filter === "all") return null;
  if (filter === "dawn" || filter === "day" || filter === "night" || filter === "hush" || filter === "mist") return filter;
  return null;
}

export function hoursCsv(rows: readonly HourRow[]): string {
  const lines = ["lane,count"];
  for (const line of hourLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function hourRowsCsv(rows: readonly HourRow[], reviewed: readonly string[]): string {
  const lines = ["title,mark,lane,tone,step,catalog,wide,open,shut,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = hourParts(row.note);
    if (!found.ok) continue;
    lines.push([
      found.title,
      markOf(row.note),
      hourLane(row.note),
      hourTone(row.note),
      String(hourStep(row.note)),
      catalogHour(row.note) ? "1" : "0",
      wideHour(row.note) ? "1" : "0",
      found.type === "NOTE" ? "1" : "0",
      found.type === "CHAT" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
