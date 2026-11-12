/**
 * Bell cords for the settings loft, and dial seals already stored as phone on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_bell_cord (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   ringer text not null default '',
 *   hour integer,
 *   metal text not null default '',
 *   stance text not null default '',
 *   pulls integer,
 *   pitch integer not null default 0,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_dial_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_dial_seal_review (
 *   customer_id text primary key
 * );
 */

export const BLC_KEY = "crmv4-bell-cord";
export const BLC_VIEW_KEY = "crmv4-bell-views";
export const BLC_DENSITY_KEY = "crmv4-bell-density";
export const DLS_KEY = "crmv4-dial-seal-hide";
export const DLS_REVIEW_KEY = "crmv4-dial-seal-review";

export type MetalName = "blank" | "brass" | "bronze" | "iron";

export type StanceName = "blank" | "ring" | "hush" | "mute";

export type CordTray = "open" | "held" | "archived";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type CordDensity = "airy" | "tight";

export type CordSort = "hour" | "ringer";

export type BellCord = {
  id: string;
  title: string;
  note: string;
  ringer: string;
  hour: number | null;
  metal: string;
  stance: string;
  pulls: number | null;
  pitch: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type CordView = {
  id: string;
  name: string;
  tray: CordTray;
  query: string;
  ringer: string;
  metal: string;
  stance: string;
  hour: string;
  pulls: string;
  pitch: string;
};

export type CordCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  pitch: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "stance", "pin", "unpin", "hold", "resume", "archive", "open", "metal", "tag", "pitch", "pulls"] as const;

const METALS = ["brass", "bronze", "iron"] as const;

const STANCES = ["ring", "hush", "mute"] as const;

const STANCE_CYCLE = ["ring", "hush", "mute"] as const;

const PEAK_HOURS = new Set([3, 7]);

const QUIET_HOURS = new Set([8]);

const HOUSE = new Set(["BRONZE", "IRON"]);

const CORD_CAP = 10;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CordTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function metalName(raw: unknown): Exclude<MetalName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<MetalName, "blank">) : "";
}

function stanceName(raw: unknown): Exclude<StanceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (STANCES as readonly string[]).includes(text) ? (text as Exclude<StanceName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function cordLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function cordNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank ringer stays blank. It is not filled in. */
export function ringerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A metal is BRASS, BRONZE, or IRON. Anything else stays blank. Letters are stored in capitals. */
export function metalOf(raw: unknown): string {
  const name = metalName(raw);
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

/** Pulls are 2, 4, or 8. A blank value stays unset. A leading zero is not a pull count. */
export function pullsOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  const text = clip(raw, 1);
  if (text === "2") return 2;
  if (text === "4") return 4;
  if (text === "8") return 8;
  return null;
}

/** Pitch is 0, 2, or 4. Anything else is not a pitch. 0 clears the pitch. */
export function pitchOf(raw: unknown): 0 | 2 | 4 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  return null;
}

export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak hours are 3 and 7. An unset hour is not a peak hour. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** The quiet hour is 8. A peak hour is not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * How far an hour sits behind the desk hour.
 * A positive gap means the cord is behind. A negative gap means it is ahead.
 * A gap of zero means the same hour. An unset hour has no gap. Hours do not wrap.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** BRONZE and IRON are house metals. BRASS is a guest metal. A blank metal is not a house metal. */
export function houseMetal(metal: unknown): boolean {
  return HOUSE.has(metalOf(metal));
}

/** Airy or tight. Anything else stays airy. */
export function densityOf(raw: unknown): CordDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** Hour or ringer. Anything else stays on the hour. */
export function sortMode(raw: unknown): CordSort {
  return raw === "ringer" ? "ringer" : "hour";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[e-h]$/.test(text) ? text : "";
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

function readOne(raw: unknown): BellCord | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<BellCord>;
  const id = clip(row.id, 24);
  const title = cordLine(row.title);
  if (!id || !title) return null;
  const pitch = pitchOf(row.pitch);
  return {
    id,
    title,
    note: cordNote(row.note),
    ringer: ringerLabel(row.ringer),
    hour: hourOf(row.hour),
    metal: metalOf(row.metal),
    stance: stanceName(row.stance),
    pulls: pullsOf(row.pulls),
    pitch: pitch === null ? 0 : pitch,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readCords(raw: unknown): BellCord[] {
  if (!Array.isArray(raw)) return [];
  const out: BellCord[] = [];
  for (const item of raw) {
    const cord = readOne(item);
    if (!cord || out.some((row) => row.id === cord.id || row.title === cord.title)) continue;
    out.push(cord);
  }
  return out.slice(0, CORD_CAP);
}

export function addCord(
  cords: readonly BellCord[],
  cord: {
    id: string;
    title: string;
    note?: string;
    ringer?: string;
    hour?: unknown;
    metal?: string;
    stance?: string;
    pulls?: unknown;
    pitch?: unknown;
    tags?: unknown;
  },
): BellCord[] {
  const current = readCords(cords);
  const id = String(cord.id || "").trim();
  const title = cordLine(cord.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const pitch = pitchOf(cord.pitch);
  const next: BellCord = {
    id,
    title,
    note: cordNote(cord.note),
    ringer: ringerLabel(cord.ringer),
    hour: hourOf(cord.hour),
    metal: metalOf(cord.metal),
    stance: stanceName(cord.stance),
    pulls: pullsOf(cord.pulls),
    pitch: pitch === null ? 0 : pitch,
    tags: tagsOf(cord.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CORD_CAP);
}

/** A blank stance becomes ring, ring becomes hush, hush becomes mute, and mute returns to ring. */
export function cycleStance(cords: readonly BellCord[], id: string): BellCord[] {
  return readCords(cords).map((cord) => {
    if (cord.id !== id) return cord;
    const at = STANCE_CYCLE.indexOf(cord.stance as (typeof STANCE_CYCLE)[number]);
    const next = at < 0 ? STANCE_CYCLE[0] : STANCE_CYCLE[(at + 1) % STANCE_CYCLE.length];
    if (!next || next === cord.stance) return cord;
    return { ...cord, stance: next, audit: "stance" };
  });
}

/** A blank title is left as it is. */
export function editCord(cords: readonly BellCord[], id: string, title: unknown): BellCord[] {
  const next = cordLine(title);
  if (!next) return readCords(cords);
  const current = readCords(cords);
  if (current.some((cord) => cord.id !== id && cord.title === next)) return current;
  return current.map((cord) => (cord.id === id && cord.title !== next ? { ...cord, title: next, audit: "edit" } : cord));
}

/** A blank note is left as it is. */
export function editCordNote(cords: readonly BellCord[], id: string, note: unknown): BellCord[] {
  const next = cordNote(note);
  if (!next) return readCords(cords);
  return readCords(cords).map((cord) => (cord.id === id && cord.note !== next ? { ...cord, note: next, audit: "edit" } : cord));
}

/** A tag that is already on the cord, or a third tag, is left out. A tag is one letter from e to h. */
export function addCordTag(cords: readonly BellCord[], id: string, tag: unknown): BellCord[] {
  const next = tagOf(tag);
  if (!next) return readCords(cords);
  return readCords(cords).map((cord) => {
    if (cord.id !== id || cord.tags.includes(next) || cord.tags.length >= TAG_CAP) return cord;
    return { ...cord, tags: [...cord.tags, next], audit: "tag" };
  });
}

/** An unknown pitch is left as it is. 0 clears the pitch. */
export function setCordPitch(cords: readonly BellCord[], id: string, pitch: unknown): BellCord[] {
  const next = pitchOf(pitch);
  if (next === null) return readCords(cords);
  return readCords(cords).map((cord) => (cord.id === id && cord.pitch !== next ? { ...cord, pitch: next, audit: "pitch" } : cord));
}

/** Two pulls become 4, four pulls become 8, and eight pulls stay. An unset count becomes 2. */
export function snoozeCord(cords: readonly BellCord[], id: string): BellCord[] {
  return readCords(cords).map((cord) => {
    if (cord.id !== id) return cord;
    const next = cord.pulls === 2 ? 4 : cord.pulls === 4 ? 8 : cord.pulls === 8 ? 8 : 2;
    if (next === cord.pulls) return cord;
    return { ...cord, pulls: next, audit: "pulls" };
  });
}

export function setCordPin(cords: readonly BellCord[], id: string, pinned: boolean): BellCord[] {
  return readCords(cords).map((cord) => (cord.id === id && cord.pinned !== pinned ? { ...cord, pinned, audit: pinned ? "pin" : "unpin" } : cord));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(cords: readonly BellCord[], shownIds: readonly string[], index: number): BellCord[] {
  if (!shownIds.length) return readCords(cords);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCords(cords).find((cord) => cord.id === id);
  if (!row) return readCords(cords);
  return setCordPin(cords, id, !row.pinned);
}

/** L lengthens the pulls on the focused cord. */
export function snoozeFocused(cords: readonly BellCord[], shownIds: readonly string[], index: number): BellCord[] {
  if (!shownIds.length) return readCords(cords);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readCords(cords).some((cord) => cord.id === id)) return readCords(cords);
  return snoozeCord(cords, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(cords: readonly BellCord[], shownIds: readonly string[], index: number): BellCord[] {
  if (!shownIds.length) return readCords(cords);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readCords(cords).find((cord) => cord.id === id);
  if (!row) return readCords(cords);
  return setCordHold(cords, id, !row.held);
}

/** S cycles the stance on the focused cord. */
export function stanceFocused(cords: readonly BellCord[], shownIds: readonly string[], index: number): BellCord[] {
  if (!shownIds.length) return readCords(cords);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readCords(cords).some((cord) => cord.id === id)) return readCords(cords);
  return cycleStance(cords, id);
}

export function setCordHold(cords: readonly BellCord[], id: string, held: boolean): BellCord[] {
  return readCords(cords).map((cord) => (cord.id === id && cord.held !== held ? { ...cord, held, audit: held ? "hold" : "resume" } : cord));
}

export function setCordArchive(cords: readonly BellCord[], id: string, archived: boolean): BellCord[] {
  return readCords(cords).map((cord) => (cord.id === id && cord.archived !== archived ? { ...cord, archived, audit: archived ? "archive" : "open" } : cord));
}

export function bulkCordMetal(cords: readonly BellCord[], ids: readonly string[], metal: unknown): BellCord[] {
  const next = metalOf(metal);
  if (!next) return readCords(cords);
  const picked = new Set(ids);
  return readCords(cords).map((cord) => (picked.has(cord.id) && cord.metal !== next ? { ...cord, metal: next, audit: "metal" } : cord));
}

export function bulkCordPin(cords: readonly BellCord[], ids: readonly string[], pinned: boolean): BellCord[] {
  const picked = new Set(ids);
  return readCords(cords).map((cord) => (picked.has(cord.id) && cord.pinned !== pinned ? { ...cord, pinned, audit: pinned ? "pin" : "unpin" } : cord));
}

export function bulkCordArchive(cords: readonly BellCord[], ids: readonly string[], archived: boolean): BellCord[] {
  const picked = new Set(ids);
  return readCords(cords).map((cord) => (picked.has(cord.id) && cord.archived !== archived ? { ...cord, archived, audit: archived ? "archive" : "open" } : cord));
}

export function bulkCordStance(cords: readonly BellCord[], ids: readonly string[], stance: unknown): BellCord[] {
  const next = stanceName(stance);
  if (!next) return readCords(cords);
  const picked = new Set(ids);
  return readCords(cords).map((cord) => (picked.has(cord.id) && cord.stance !== next ? { ...cord, stance: next, audit: "stance" } : cord));
}

export function bulkCordTag(cords: readonly BellCord[], ids: readonly string[], tag: unknown): BellCord[] {
  return ids.reduce((rows, id) => addCordTag(rows, id, tag), readCords(cords));
}

export function resetCords(): BellCord[] {
  return [];
}

function inTray(cord: BellCord, tray: CordTray): boolean {
  if (tray === "archived") return cord.archived;
  if (tray === "held") return cord.held && !cord.archived;
  return !cord.held && !cord.archived;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open cord whose hour sits more than two hours behind the desk. Pitch, a hold, or an archive is not late. */
export function lateCord(cord: BellCord, desk: unknown): boolean {
  const gap = hourGap(cord.hour, desk);
  return inTray(cord, "open") && cord.pitch === 0 && gap !== null && gap > 2;
}

/** An open cord with 2 pulls is due now. Pitch, a hold, or an archive is not. */
export function soonCord(cord: BellCord): boolean {
  return inTray(cord, "open") && cord.pitch === 0 && cord.pulls === 2;
}

/** Open cords that are late or due now. A pitched cord stays off the reminder list. */
export function reminderCords(cords: readonly BellCord[], desk: unknown): BellCord[] {
  return readCords(cords).filter((cord) => lateCord(cord, desk) || soonCord(cord));
}

/** Open cords whose hour sits within two hours of the desk. Pitch, a hold, or an archive stays out. */
export function windowCords(cords: readonly BellCord[], desk: unknown): BellCord[] {
  return readCords(cords).filter((cord) => {
    const gap = hourGap(cord.hour, desk);
    return inTray(cord, "open") && cord.pitch === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Open light cords whose hour is the desk hour. */
export function matchedCords(cords: readonly BellCord[], desk: unknown): number {
  const at = hourOf(desk);
  if (at === null) return 0;
  return readCords(cords).filter((cord) => inTray(cord, "open") && cord.pitch === 0 && cord.hour === at).length;
}

/** Search matches the title, the note, the ringer, and the tags. */
export function visibleCords(
  cords: readonly BellCord[],
  tray: CordTray,
  query: string,
  ringer: string | null,
  metal: string | null,
  stance: string | null,
  exact: number | null,
  pick: HourPick | null,
  pulls: number | "blank" | null,
  pitch: number | "blank" | null,
  muteOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): BellCord[] {
  const text = query.trim().toLowerCase();
  return readCords(cords).filter((cord) => {
    if (!inTray(cord, tray)) return false;
    if (text) {
      const hay = `${cord.title} ${cord.note} ${cord.ringer} ${cord.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (ringer !== null && cord.ringer !== ringer) return false;
    if (metal === "blank" ? Boolean(cord.metal) : metal && cord.metal !== metal) return false;
    if (stance === "blank" ? Boolean(cord.stance) : stance && cord.stance !== stance) return false;
    if (!hourHit(cord.hour, exact, pick)) return false;
    if (pulls === "blank" ? cord.pulls !== null : pulls !== null && cord.pulls !== pulls) return false;
    if (pitch === "blank" ? cord.pitch !== 0 : pitch !== null && cord.pitch !== pitch) return false;
    if (muteOnly && cord.stance !== "mute") return false;
    if (peakOnly && !peakHour(cord.hour)) return false;
    if (houseOnly && !houseMetal(cord.metal)) return false;
    if (quietOnly && !quietHour(cord.hour)) return false;
    if (lightOnly && cord.pitch !== 0) return false;
    return true;
  });
}

export function sortCords(cords: readonly BellCord[], mode: CordSort): BellCord[] {
  const rows = cords.slice();
  if (mode === "ringer") return rows.sort((a, b) => a.ringer.localeCompare(b.ringer) || (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function cordLedger(cords: readonly BellCord[], query: string): BellCord[] {
  const text = query.trim().toLowerCase();
  return sortCords(
    readCords(cords).filter((cord) => cord.hour !== null && (!text || cord.title.toLowerCase().includes(text))),
    "hour",
  );
}

export function cordCounts(cords: readonly BellCord[], desk: unknown): CordCounts {
  const rows = readCords(cords);
  return {
    open: rows.filter((cord) => inTray(cord, "open")).length,
    held: rows.filter((cord) => inTray(cord, "held")).length,
    archived: rows.filter((cord) => inTray(cord, "archived")).length,
    pinned: rows.filter((cord) => cord.pinned).length,
    peak: rows.filter((cord) => inTray(cord, "open") && cord.pitch === 0 && peakHour(cord.hour)).length,
    late: rows.filter((cord) => lateCord(cord, desk)).length,
    soon: rows.filter((cord) => soonCord(cord)).length,
    pitch: rows.filter((cord) => inTray(cord, "open") && cord.pitch > 0).length,
    house: rows.filter((cord) => inTray(cord, "open") && houseMetal(cord.metal)).length,
    window: windowCords(rows, desk).length,
    matched: matchedCords(rows, desk),
  };
}

export function cordShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open cords as a share of every open cord. */
export function lateShare(cords: readonly BellCord[], desk: unknown): number {
  const rows = readCords(cords);
  const open = rows.filter((cord) => inTray(cord, "open")).length;
  const late = rows.filter((cord) => lateCord(cord, desk)).length;
  return cordShare(late, open);
}

/** Distinct hours on open cords. */
export function usedHours(cords: readonly BellCord[]): number {
  const hours = new Set<number>();
  for (const cord of readCords(cords)) {
    if (inTray(cord, "open") && cord.hour !== null) hours.add(cord.hour);
  }
  return hours.size;
}

/** Open cords that share an hour and a metal. A different metal on the same hour is not a clash. */
export function clashHourCount(cords: readonly BellCord[]): number {
  const groups = new Map<string, number>();
  for (const cord of readCords(cords)) {
    if (!inTray(cord, "open") || cord.hour === null || !cord.metal) continue;
    const key = `${cord.hour}:${cord.metal}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open cords that share a pull count. An unset count is not a clash. */
export function pullsClashCount(cords: readonly BellCord[]): number {
  const groups = new Map<number, number>();
  for (const cord of readCords(cords)) {
    if (!inTray(cord, "open") || cord.pulls === null) continue;
    groups.set(cord.pulls, (groups.get(cord.pulls) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open cords in the same metal whose hours differ by three.
 * The count is the cords that have at least one neighbor.
 */
export function adjacentCordCount(cords: readonly BellCord[]): number {
  const open = readCords(cords).filter((cord) => inTray(cord, "open") && cord.hour !== null && cord.metal);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.metal === right.metal && Math.abs((left.hour ?? 0) - (right.hour ?? 0)) === 3) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The metal with the fewest open cords.
 * A tie keeps BRONZE, then IRON, then BRASS.
 * An empty desk still suggests BRONZE.
 */
export function suggestMetal(cords: readonly BellCord[]): "BRONZE" | "IRON" | "BRASS" {
  const rows = readCords(cords).filter((cord) => inTray(cord, "open"));
  const order = ["BRONZE", "IRON", "BRASS"] as const;
  let best: "BRONZE" | "IRON" | "BRASS" = "BRONZE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const metal of order) {
    const count = rows.filter((cord) => cord.metal === metal).length;
    if (count < bestCount) {
      best = metal;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The pull count with the fewest open cords.
 * A tie keeps 4, then 2, then 8.
 * An empty desk still suggests 4.
 */
export function suggestPulls(cords: readonly BellCord[]): 2 | 4 | 8 {
  const rows = readCords(cords).filter((cord) => inTray(cord, "open"));
  const order = [4, 2, 8] as const;
  let best: 2 | 4 | 8 = 4;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pulls of order) {
    const count = rows.filter((cord) => cord.pulls === pulls).length;
    if (count < bestCount) {
      best = pulls;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open ringer. A blank ringer is skipped. An empty desk stays blank. */
export function suggestRinger(cords: readonly BellCord[]): string {
  const found = readCords(cords).find((cord) => inTray(cord, "open") && cord.ringer);
  return found ? found.ringer : "";
}

/**
 * The ringer carrying the fewest open cords.
 * A tie keeps the earlier name. A blank ringer is not a load.
 * An empty roster falls back to the newest ringer.
 */
export function fairRinger(cords: readonly BellCord[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = ringerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestRinger(cords);
  const open = readCords(cords).filter((cord) => inTray(cord, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((cord) => cord.ringer === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The ringer with the most open cords. A tie keeps the newer name on the desk. */
export function busiestRinger(cords: readonly BellCord[]): string {
  const rows = readCords(cords).filter((cord) => inTray(cord, "open") && cord.ringer);
  const names: string[] = [];
  for (const cord of rows) if (!names.includes(cord.ringer)) names.push(cord.ringer);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((cord) => cord.ringer === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function cordRingers(cords: readonly BellCord[]): string[] {
  const out: string[] = [];
  for (const cord of readCords(cords)) {
    if (cord.ringer && !out.includes(cord.ringer)) out.push(cord.ringer);
  }
  return out;
}

export function cordMetals(cords: readonly BellCord[]): string[] {
  const out: string[] = [];
  for (const cord of readCords(cords)) {
    if (cord.metal && !out.includes(cord.metal)) out.push(cord.metal);
  }
  return out;
}

/** Open cords whose ringer also keeps another open cord on a different hour. */
export function pairRingerCount(cords: readonly BellCord[]): number {
  const open = readCords(cords).filter((cord) => inTray(cord, "open") && cord.ringer && cord.hour !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].ringer === open[j].ringer && open[i].hour !== open[j].hour) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open cords that share a metal on different hours. */
export function sharedMetalCount(cords: readonly BellCord[]): number {
  const open = readCords(cords).filter((cord) => inTray(cord, "open") && cord.metal && cord.hour !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].metal === open[j].metal && open[i].hour !== open[j].hour) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The pitch of open cords. A clear pitch adds nothing. */
export function pitchLoad(cords: readonly BellCord[]): number {
  return readCords(cords).filter((cord) => inTray(cord, "open")).reduce((sum, cord) => sum + cord.pitch, 0);
}

/** Open cords that are both the quiet hour and a house metal. */
export function quietLoftCount(cords: readonly BellCord[]): number {
  return readCords(cords).filter((cord) => inTray(cord, "open") && quietHour(cord.hour) && houseMetal(cord.metal)).length;
}

/** Open cords whose stance is mute. */
export function muteLoad(cords: readonly BellCord[]): number {
  return readCords(cords).filter((cord) => inTray(cord, "open") && cord.stance === "mute").length;
}

/** The span from the lowest open hour to the highest. Fewer than two hours span nothing. */
export function hourSpan(cords: readonly BellCord[]): number {
  const hours = readCords(cords).filter((cord) => inTray(cord, "open") && cord.hour !== null).map((cord) => cord.hour as number);
  if (hours.length < 2) return 0;
  return Math.max(...hours) - Math.min(...hours);
}

/**
 * The next open cord at or after the desk hour.
 * A mute stance, pitch, a hold, and an archive stay off the list.
 * When every open hour is behind, the earliest hour is next.
 */
export function nextCord(cords: readonly BellCord[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readCords(cords).filter((cord) => inTray(cord, "open") && cord.hour !== null && cord.stance !== "mute" && cord.pitch === 0);
  if (!waiting.length) return "";
  const byHour = (a: BellCord, b: BellCord) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((cord) => (cord.hour ?? 0) >= now).sort(byHour);
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

export function cordCopy(cord: BellCord, desk: unknown): string {
  const gap = hourGap(cord.hour, desk);
  return [cord.title, cord.ringer, cord.hour ?? "", cord.metal, cord.stance, cord.pulls ?? "", cord.pitch, cord.tags.join(" "), cord.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cords saved in this browser. The gap and the late mark use the hour you pass. */
export function cordsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,ringer,hour,metal,stance,pulls,pitch,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readCords(raw);
  const windowIds = new Set(windowCords(rows, desk).map((cord) => cord.id));
  const at = hourOf(desk);
  for (const cord of rows) {
    const gap = hourGap(cord.hour, desk);
    lines.push([
      cord.title,
      cord.ringer,
      cord.hour === null ? "" : String(cord.hour),
      cord.metal,
      cord.stance,
      cord.pulls === null ? "" : String(cord.pulls),
      String(cord.pitch),
      cord.tags.join(" "),
      cord.pinned ? "1" : "0",
      cord.held ? "1" : "0",
      cord.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCord(cord, desk) ? "1" : "0",
      soonCord(cord) ? "1" : "0",
      houseMetal(cord.metal) ? "1" : "0",
      windowIds.has(cord.id) ? "1" : "0",
      at !== null && cord.hour === at && cord.pitch === 0 && inTray(cord, "open") ? "1" : "0",
      cord.note,
      cord.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeRinger(raw: string, ringers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return ringers.includes(raw) ? raw : "all";
}

export function activeMetal(raw: string, metals: readonly string[]): string {
  if (raw === "blank") return "blank";
  return metalOf(raw) && metals.includes(metalOf(raw)) ? metalOf(raw) : "all";
}

export function activeStance(raw: string, stances: readonly string[]): string {
  if (raw === "blank") return "blank";
  const stance = stanceName(raw);
  return stance && stances.includes(stance) ? stance : "all";
}

export function activeHour(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const hour = hourOf(raw);
  return hour === null ? "all" : String(hour);
}

export function activePulls(raw: string): string {
  if (raw === "blank") return "blank";
  const pulls = pullsOf(raw);
  return pulls === null ? "all" : String(pulls);
}

export function activePitch(raw: string): string {
  if (raw === "blank") return "blank";
  const pitch = pitchOf(raw);
  return pitch === null ? "all" : String(pitch);
}

export function ringerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function metalArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return metalOf(filter) || null;
}

export function stanceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stanceName(filter) || null;
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: hourOf(filter), pick: null };
}

export function pullsArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pullsOf(filter);
}

export function pitchArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pitchOf(filter);
}

function readView(raw: unknown): CordView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CordView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    ringer: row.ringer === "blank" ? "blank" : clip(row.ringer, 16) || "all",
    metal: row.metal === "blank" || row.metal === "all" ? (row.metal === "blank" ? "blank" : "all") : metalOf(row.metal) || "all",
    stance: row.stance === "blank" || row.stance === "all" ? (row.stance === "blank" ? "blank" : "all") : stanceName(row.stance) || "all",
    hour: activeHour(String(row.hour || "all")),
    pulls: activePulls(String(row.pulls || "all")),
    pitch: activePitch(String(row.pitch || "all")),
  };
}

export function readCordViews(raw: unknown): CordView[] {
  if (!Array.isArray(raw)) return [];
  const out: CordView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addCordView(views: readonly CordView[], view: CordView): CordView[] {
  const current = readCordViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCordView(views: readonly CordView[], id: string): CordView[] {
  return readCordViews(views).filter((view) => view.id !== id);
}

export type SealState = "" | "set" | "clear";

export type SealLane = "" | "loft" | "hall" | "yard";

export type SealTone = "" | "gilt" | "ink" | "ivory" | "mist";

export type SealShape = "all" | "catalog" | "wide" | "gilt";

export type SealValue =
  | string
  | { phone?: unknown; affiliateA?: unknown; affiliateB?: unknown; affiliateC?: unknown; language?: unknown; address?: unknown; country?: unknown; email?: unknown; city?: unknown; desk?: unknown; name?: unknown; username?: unknown; accountType?: unknown; lastBrowser?: unknown; isResident?: unknown; documentsStatus?: unknown }
  | null
  | undefined;

export type SealRow = { id: string; label?: string; note: SealValue };

export type SealLaneLine = { lane: string; count: number };

const SEAL_LANES = ["loft", "hall", "yard"] as const;

const SEAL_TONES = ["gilt", "ink", "ivory", "mist"] as const;

const SEAL_BLOCK = ["affiliateA", "affiliateB", "affiliateC", "language", "address", "country", "email", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident", "documentsStatus"] as const;

const CATALOG = new Set(["+90555", "555", "DESK", "GOLD", "BELL"]);

function sealBody(raw: unknown): string {
  return clip(raw, 18).toUpperCase().replace(/[^A-Z0-9+]/g, "");
}

function sealText(value: SealValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string" || value == null) {
    if (value == null) return { text: "", explicit: true };
    return { text: sealBody(value), explicit: true };
  }
  if (typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (SEAL_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("phone" in value)) return { text: null, explicit: false };
  const inner = value.phone;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: sealBody(inner), explicit: true };
}

function sealKind(text: string): "" | "digit" | "letter" | "mixed" {
  if (!text) return "";
  const digit = /[0-9]/.test(text);
  const letter = /[A-Z]/.test(text);
  if (digit && letter) return "mixed";
  if (digit) return "digit";
  if (letter) return "letter";
  return "";
}

export function sealState(value: SealValue): SealState {
  const found = sealText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function sealCopy(value: SealValue): string {
  const found = sealText(value);
  return found.explicit && found.text ? found.text : "";
}

/** The stem is the first three characters. A shorter number stays as it is. */
export function sealOf(value: SealValue): string {
  const text = sealCopy(value);
  return text ? text.slice(0, 3) : "";
}

/**
 * A number that starts with + or 00, or that has eleven digits or more, is the loft.
 * A number that starts with 0, or that has six digits or fewer, is the yard.
 * Seven to ten digits are the hall. Letters alone stay in the yard.
 */
export function sealLane(value: SealValue): SealLane {
  const text = sealCopy(value);
  if (!text) return "";
  const digits = text.replace(/\D/g, "");
  if (text.startsWith("+") || text.startsWith("00") || digits.length >= 11) return "loft";
  if (!digits || text.startsWith("0") || digits.length <= 6) return "yard";
  return "hall";
}

/** A number that starts with +90 or 90 is gilt. Even digits are ivory. Letters are mist. A mix, or an odd digit length, is ink. */
export function sealTone(value: SealValue): SealTone {
  const text = sealCopy(value);
  const kind = sealKind(text);
  if (!kind) return "";
  if (text.startsWith("+90") || text.startsWith("90")) return "gilt";
  if (kind === "letter") return "mist";
  if (kind === "mixed") return "ink";
  const length = text.replace(/\D/g, "").length;
  return length > 0 && length % 2 === 0 ? "ivory" : "ink";
}

/** +90555, 555, DESK, GOLD, and BELL belong to the house book. */
export function catalogSeal(value: SealValue): boolean {
  return CATALOG.has(sealCopy(value));
}

export function catalogSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => catalogSeal(row.note)).length;
}

/** A number longer than twelve characters is wide. */
export function wideSeal(value: SealValue): boolean {
  return sealCopy(value).length > 12;
}

export function wideSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => wideSeal(row.note)).length;
}

export function giltSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealTone(row.note) === "gilt").length;
}

/** Customers whose dial stem is shared with at least one other customer. */
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

export function sealLanes(rows: readonly SealRow[]): SealLaneLine[] {
  return SEAL_LANES.map((lane) => ({ lane, count: rows.filter((row) => sealLane(row.note) === lane).length }));
}

/** The lane with the most set seals. A tie keeps loft, then hall, then yard. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const lines = sealLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || SEAL_LANES.indexOf(a.lane as (typeof SEAL_LANES)[number]) - SEAL_LANES.indexOf(b.lane as (typeof SEAL_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set seals. A tie keeps gilt, then ink, then ivory, then mist. */
export function leadingSealTone(rows: readonly SealRow[]): string {
  const counts = SEAL_TONES.map((tone) => ({ tone, count: rows.filter((row) => sealTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || SEAL_TONES.indexOf(a.tone) - SEAL_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Step on the dial timeline. A clear number is 0. Digits are 1, letters are 2, and a mix is 3. */
export function sealStep(value: SealValue): 0 | 1 | 2 | 3 {
  const kind = sealKind(sealCopy(value));
  if (kind === "digit") return 1;
  if (kind === "letter") return 2;
  if (kind === "mixed") return 3;
  return 0;
}

export function presentSeals(rows: readonly SealRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = sealState(row.note);
    const lane = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
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

export function toggleSeal(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
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

export function visibleSealLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleSealCustomers(
  rows: readonly SealRow[],
  lane: SealLane | "blank" | null,
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
    const mark = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && sealTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogSeal(row.note)) return false;
    if (shape === "wide" && !wideSeal(row.note)) return false;
    if (shape === "gilt" && sealTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${sealCopy(row.note)} ${sealOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeSealLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeSealTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" ? raw : "all";
}

export function sealLaneArg(filter: string): SealLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "loft" || filter === "hall" || filter === "yard") return filter;
  return null;
}

export function sealToneArg(filter: string): SealTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist") return filter;
  return null;
}

export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of sealLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogSealCount(rows)}`);
  lines.push(`wide,wide,${wideSealCount(rows)}`);
  lines.push(`tone,gilt,${giltSealCount(rows)}`);
  lines.push(`tone,mist,${rows.filter((row) => sealTone(row.note) === "mist").length}`);
  lines.push(`shared,shared,${sharedSealCount(rows)}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = sealState(row.note);
    const lane = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      sealOf(row.note),
      lane,
      state === "set" ? sealTone(row.note) : "",
      String(sealStep(row.note)),
      catalogSeal(row.note) ? "1" : "0",
      wideSeal(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
