/**
 * Hourglass slips for a room's care timer, and syllable plates already stored as a trader name, retention status, and desk.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_hour_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   room text not null default '',
 *   glass text not null default '',
 *   grain text not null default '',
 *   span_min integer,
 *   mass integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   wax boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_syllable_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_syllable_review (
 *   trader_id text primary key
 * );
 */

export const HGL_KEY = "crmv4-hour-slip";
export const HGL_VIEW_KEY = "crmv4-hour-views";
export const HGL_DENSITY_KEY = "crmv4-hour-density";
export const SYL_KEY = "crmv4-syllable-hide";
export const SYL_REVIEW_KEY = "crmv4-syllable-review";

export const HOUR_ROOMS = ["atrium", "library", "studio", "loft", "cellar", "porch"] as const;

export type HourRoom = (typeof HOUR_ROOMS)[number];

export type GlassName = "blank" | "clear" | "smoked" | "gilt";

export type GrainName = "blank" | "fine" | "even" | "coarse";

export type HourTray = "open" | "held" | "archived";

export type HourDensity = "airy" | "tight";

export type HourSort = "room" | "steward";

export type HourSlip = {
  id: string;
  title: string;
  note: string;
  steward: string;
  room: string;
  span: number | null;
  glass: string;
  grain: string;
  mass: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  wax: boolean;
  audit: string;
};

export type HourView = {
  id: string;
  name: string;
  tray: HourTray;
  query: string;
  steward: string;
  glass: string;
  grain: string;
  room: string;
  span: string;
  mass: string;
};

export type HourCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  mass: number;
  house: number;
  span: number;
  matched: number;
  wax: number;
  cooling: number;
  rush: number;
  resting: number;
};

export type SyllableLane = "" | "split" | "dotted" | "mono" | "dual" | "crowd" | "hush";

export type SyllableHue = "" | "pearl" | "slate" | "sand" | "clay" | "soot" | "mist";

export type SyllableState = "" | "clear" | "set";

export type SyllableShape = "all" | "split" | "wide" | "bound" | "notch" | "dotted";

export type SyllableReview = "all" | "reviewed" | "fresh";

export type SyllableValue = string | { name?: unknown; ink?: unknown; stand?: unknown; retention?: unknown; desk?: unknown; [key: string]: unknown } | null | undefined;

export type SyllableRow = { id: string; label: string; note: SyllableValue };

export type SyllableLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "grain", "pin", "unpin", "hold", "resume", "archive", "open", "glass", "tag", "mass", "span", "short", "wax"] as const;

const GLASSES = ["clear", "smoked", "gilt"] as const;

const GRAINS = ["fine", "even", "coarse"] as const;

const GRAIN_CYCLE = ["fine", "even", "coarse"] as const;

const MASS_CYCLE = [2, 4, 8] as const;

const SPANS = [10, 20, 40] as const;

const PEAK = new Set(["atrium", "library"]);

const QUIET = new Set(["cellar"]);

const HOUSE = new Set(["SMOKED", "GILT"]);

const NORTH = new Set(["atrium", "library"]);

const MID = new Set(["studio", "loft"]);

const SOUTH = new Set(["cellar", "porch"]);

const LANE_ORDER = ["split", "dotted", "mono", "dual", "crowd", "hush"] as const;

const HUE_ORDER = ["pearl", "slate", "sand", "clay", "soot", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const SLIP_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HourTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glassName(raw: unknown): Exclude<GlassName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<GlassName, "blank">) : "";
}

function grainName(raw: unknown): Exclude<GrainName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GRAINS as readonly string[]).includes(text) ? (text as Exclude<GrainName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[xyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(slip: HourSlip, tray: HourTray): boolean {
  if (tray === "held") return slip.held && !slip.archived;
  if (tray === "archived") return slip.archived;
  return !slip.held && !slip.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function roomIndex(room: string): number {
  return HOUR_ROOMS.indexOf(room as HourRoom);
}

/** A blank title is left out. The saved title stays short. */
export function hourLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function hourNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A room outside the six care rooms is left blank. */
export function roomOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (HOUR_ROOMS as readonly string[]).includes(text) ? text : "";
}

/** The span is 10, 20, or 40 minutes. Anything else stays blank. */
export function spanOf(raw: unknown): 10 | 20 | 40 | null {
  const text = clip(raw, 2);
  const value = Number(text);
  return (SPANS as readonly number[]).includes(value) ? (value as 10 | 20 | 40) : null;
}

/** Mass is 2, 4, or 8. Anything else stays blank. */
export function massOf(raw: unknown): 2 | 4 | 8 | null {
  const value = Number(clip(raw, 1));
  return (MASS_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 8) : null;
}

/** Glass is clear, smoked, or gilt. The saved glass is upper case. */
export function glassOf(raw: unknown): string {
  const glass = glassName(raw);
  return glass ? glass.toUpperCase() : "";
}

/** Grain is fine, even, or coarse. A blank grain stays blank. */
export function grainOf(raw: unknown): string {
  return grainName(raw);
}

export function peakRoom(room: unknown): boolean {
  return PEAK.has(roomOf(room));
}

export function quietRoom(room: unknown): boolean {
  return QUIET.has(roomOf(room));
}

/** North is the atrium and the library. Mid is the studio and the loft. South is the cellar and the porch. */
export function roomBand(room: unknown): "north" | "mid" | "south" | "" {
  const name = roomOf(room);
  if (NORTH.has(name)) return "north";
  if (MID.has(name)) return "mid";
  if (SOUTH.has(name)) return "south";
  return "";
}

/** Steps from the slip room to the desk room. A blank room has no gap. */
export function roomGap(slipRoom: unknown, deskRoom: unknown): number | null {
  const from = roomIndex(roomOf(slipRoom));
  const to = roomIndex(roomOf(deskRoom));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseGlass(glass: unknown): boolean {
  return HOUSE.has(glassOf(glass));
}

export function activeRoom(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return roomOf(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const value = spanOf(raw);
  return value === null ? "all" : String(value);
}

export function activeGrain(raw: unknown, grains: readonly string[]): string {
  const grain = grainOf(raw);
  return grain && grains.includes(grain) ? grain : "all";
}

export function activeMass(raw: unknown): string {
  const value = massOf(raw);
  return value === null ? "all" : String(value);
}

export function activeGlass(raw: unknown): string {
  const glass = glassName(raw);
  return glass || "all";
}

export function moveHourFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGlass(slips: readonly HourSlip[]): string {
  const counts = new Map<string, number>();
  for (const slip of slips) {
    if (!slip.glass) continue;
    counts.set(slip.glass, (counts.get(slip.glass) || 0) + 1);
  }
  let best = "CLEAR";
  let score = 0;
  for (const glass of ["CLEAR", "SMOKED", "GILT"]) {
    const count = counts.get(glass) || 0;
    if (count > score) {
      best = glass;
      score = count;
    }
  }
  return best;
}

/** An early hour asks for a short span. A late hour asks for a long one. A tie among saved slips keeps 20. */
export function suggestSpan(slips: readonly HourSlip[], hour: number): 10 | 20 | 40 {
  const counts = new Map<number, number>();
  for (const slip of slips) {
    if (slip.span === null) continue;
    counts.set(slip.span, (counts.get(slip.span) || 0) + 1);
  }
  let best: 10 | 20 | 40 | null = null;
  let score = 0;
  for (const span of SPANS) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 8) return 10;
  if (hour >= 16) return 40;
  return 20;
}

/** The steward with the fewest open slips. A tie keeps the roster order. */
export function fairSteward(slips: readonly HourSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = slips.filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.steward.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readHourSlips(raw: unknown): HourSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: HourSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HourSlip>;
    const id = clip(row.id, 40);
    const title = hourLine(row.title);
    if (!id || !title || out.some((slip) => slip.id === id || slip.title === title)) continue;
    out.push({
      id,
      title,
      note: hourNote(row.note),
      steward: clip(row.steward, 24),
      room: roomOf(row.room),
      span: spanOf(row.span),
      glass: glassOf(row.glass),
      grain: grainOf(row.grain),
      mass: massOf(row.mass) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      wax: row.wax === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLIP_CAP);
}

export function addHourSlip(
  slips: readonly HourSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    room?: unknown;
    glass?: string;
    grain?: string;
    span?: unknown;
    mass?: unknown;
    tags?: unknown;
  },
): HourSlip[] {
  const current = readHourSlips(slips);
  const id = clip(slip.id, 40);
  const title = hourLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: HourSlip = {
    id,
    title,
    note: hourNote(slip.note),
    steward: clip(slip.steward, 24),
    room: roomOf(slip.room),
    span: spanOf(slip.span),
    glass: glassOf(slip.glass),
    grain: grainOf(slip.grain),
    mass: massOf(slip.mass) ?? 2,
    tags: tagsOf(slip.tags),
    pinned: false,
    held: false,
    archived: false,
    wax: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

function mapSlip(slips: readonly HourSlip[], id: string, change: (slip: HourSlip) => HourSlip): HourSlip[] {
  return readHourSlips(slips).map((slip) => (slip.id === id ? change(slip) : slip));
}

export function editHour(slips: readonly HourSlip[], id: string, title: string): HourSlip[] {
  const next = hourLine(title);
  if (!next) return readHourSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.title === next ? slip : { ...slip, title: next, audit: "edit" }));
}

export function editHourNote(slips: readonly HourSlip[], id: string, note: string): HourSlip[] {
  const next = hourNote(note);
  return mapSlip(slips, id, (slip) => (slip.note === next ? slip : { ...slip, note: next, audit: "note" }));
}

export function setHourPin(slips: readonly HourSlip[], id: string, pinned: boolean): HourSlip[] {
  return mapSlip(slips, id, (slip) => (slip.pinned === pinned ? slip : { ...slip, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setHourHold(slips: readonly HourSlip[], id: string, held: boolean): HourSlip[] {
  return mapSlip(slips, id, (slip) => (slip.held === held || slip.archived ? slip : { ...slip, held, audit: held ? "hold" : "resume" }));
}

export function setHourArchive(slips: readonly HourSlip[], id: string, archived: boolean): HourSlip[] {
  return mapSlip(slips, id, (slip) => (slip.archived === archived ? slip : { ...slip, archived, held: archived ? false : slip.held, audit: archived ? "archive" : "open" }));
}

export function setHourWax(slips: readonly HourSlip[], id: string, wax: boolean): HourSlip[] {
  return mapSlip(slips, id, (slip) => (slip.wax === wax ? slip : { ...slip, wax, audit: "wax" }));
}

export function setHourMass(slips: readonly HourSlip[], id: string, mass: unknown): HourSlip[] {
  const next = massOf(mass);
  if (next === null) return readHourSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.mass === next ? slip : { ...slip, mass: next, audit: "mass" }));
}

export function setHourGlass(slips: readonly HourSlip[], id: string, glass: unknown): HourSlip[] {
  const next = glassOf(glass);
  if (!next) return readHourSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.glass === next ? slip : { ...slip, glass: next, audit: "glass" }));
}

/** Grain steps fine, even, coarse, then fine again. A blank grain starts at fine. */
export function cycleGrain(slips: readonly HourSlip[], id: string): HourSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = GRAIN_CYCLE.indexOf(slip.grain as (typeof GRAIN_CYCLE)[number]);
    const next = at < 0 ? GRAIN_CYCLE[0] : GRAIN_CYCLE[(at + 1) % GRAIN_CYCLE.length];
    return next === slip.grain ? slip : { ...slip, grain: next, audit: "grain" };
  });
}

export function addHourTag(slips: readonly HourSlip[], id: string, tag: string): HourSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readHourSlips(slips);
  return mapSlip(slips, id, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 10, 10 becomes 20, and 20 becomes 40. A span of 40 stays. */
export function lengthenSpan(slips: readonly HourSlip[], id: string): HourSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.span === 40) return slip;
    const next = slip.span === 20 ? 40 : slip.span === 10 ? 20 : 10;
    return { ...slip, span: next, audit: "span" };
  });
}

/** A blank span becomes 40, 40 becomes 20, and 20 becomes 10. A span of 10 stays. */
export function shortenSpan(slips: readonly HourSlip[], id: string): HourSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.span === 10) return slip;
    const next = slip.span === 20 ? 10 : slip.span === 40 ? 20 : 40;
    return { ...slip, span: next, audit: "short" };
  });
}

export function pinFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  const slip = id ? readHourSlips(slips).find((item) => item.id === id) : undefined;
  if (!slip) return readHourSlips(slips);
  return setHourPin(slips, slip.id, !slip.pinned);
}

export function holdFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  const slip = id ? readHourSlips(slips).find((item) => item.id === id) : undefined;
  if (!slip) return readHourSlips(slips);
  return setHourHold(slips, slip.id, !slip.held);
}

export function grainFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  return id ? cycleGrain(slips, id) : readHourSlips(slips);
}

export function waxFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  const slip = id ? readHourSlips(slips).find((item) => item.id === id) : undefined;
  if (!slip) return readHourSlips(slips);
  return setHourWax(slips, slip.id, !slip.wax);
}

export function tagFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number, tag: string): HourSlip[] {
  const id = shownIds[index];
  return id ? addHourTag(slips, id, tag) : readHourSlips(slips);
}

export function massFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  const slip = id ? readHourSlips(slips).find((item) => item.id === id) : undefined;
  if (!slip) return readHourSlips(slips);
  const at = MASS_CYCLE.indexOf(slip.mass as (typeof MASS_CYCLE)[number]);
  const next = at < 0 ? MASS_CYCLE[0] : MASS_CYCLE[(at + 1) % MASS_CYCLE.length];
  return setHourMass(slips, slip.id, next);
}

export function lengthenFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  return id ? lengthenSpan(slips, id) : readHourSlips(slips);
}

export function shortenFocusedHour(slips: readonly HourSlip[], shownIds: readonly string[], index: number): HourSlip[] {
  const id = shownIds[index];
  return id ? shortenSpan(slips, id) : readHourSlips(slips);
}

function touchIds(slips: readonly HourSlip[], ids: readonly string[], change: (slip: HourSlip) => HourSlip): HourSlip[] {
  const want = new Set(ids);
  return readHourSlips(slips).map((slip) => (want.has(slip.id) ? change(slip) : slip));
}

export function bulkHourPin(slips: readonly HourSlip[], ids: readonly string[]): HourSlip[] {
  return touchIds(slips, ids, (slip) => (slip.pinned ? slip : { ...slip, pinned: true, audit: "pin" }));
}

export function bulkHourArchive(slips: readonly HourSlip[], ids: readonly string[]): HourSlip[] {
  return touchIds(slips, ids, (slip) => (slip.archived ? slip : { ...slip, archived: true, held: false, audit: "archive" }));
}

export function bulkHourGrain(slips: readonly HourSlip[], ids: readonly string[]): HourSlip[] {
  return touchIds(slips, ids, (slip) => (slip.grain === "coarse" ? slip : { ...slip, grain: "coarse", audit: "grain" }));
}

export function bulkHourTag(slips: readonly HourSlip[], ids: readonly string[], tag: string): HourSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readHourSlips(slips);
  return touchIds(slips, ids, (slip) => (slip.tags.includes(next) || slip.tags.length >= TAG_CAP ? slip : { ...slip, tags: [...slip.tags, next], audit: "tag" }));
}

export function bulkHourGlass(slips: readonly HourSlip[], ids: readonly string[], glass: unknown): HourSlip[] {
  const next = glassOf(glass);
  if (!next) return readHourSlips(slips);
  return touchIds(slips, ids, (slip) => (slip.glass === next ? slip : { ...slip, glass: next, audit: "glass" }));
}

export function readHourViews(raw: unknown): HourView[] {
  if (!Array.isArray(raw)) return [];
  const out: HourView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HourView>;
    const id = clip(row.id, 40);
    const name = hourLine(row.name);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      steward: clip(row.steward, 24),
      glass: activeGlass(row.glass),
      grain: activeGrain(row.grain, GRAINS),
      room: activeRoom(row.room),
      span: activeSpan(row.span),
      mass: activeMass(row.mass),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addHourView(views: readonly HourView[], view: HourView): HourView[] {
  const current = readHourViews(views);
  const id = clip(view.id, 40);
  const name = hourLine(view.name);
  if (!id || !name || current.some((item) => item.id === id)) return current;
  return [{ ...view, id, name, tray: trayOf(view.tray), query: clip(view.query, 40), steward: clip(view.steward, 24), glass: activeGlass(view.glass), grain: activeGrain(view.grain, GRAINS), room: activeRoom(view.room), span: activeSpan(view.span), mass: activeMass(view.mass) }, ...current].slice(0, VIEW_CAP);
}

export function dropHourView(views: readonly HourView[], id: string): HourView[] {
  return readHourViews(views).filter((view) => view.id !== id);
}

export function hourDensity(raw: unknown): HourDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function hourSort(raw: unknown): HourSort {
  return raw === "steward" ? "steward" : "room";
}

export function lateSlip(slip: HourSlip, deskRoom: unknown): boolean {
  const gap = roomGap(slip.room, deskRoom);
  return gap !== null && gap > 0;
}

export function coolingSlip(slip: HourSlip): boolean {
  return slip.grain === "coarse" && quietRoom(slip.room) && slip.mass === 2;
}

export function rushSlip(slip: HourSlip): boolean {
  return slip.span === 10 && slip.grain === "coarse";
}

export function restingSlip(slip: HourSlip): boolean {
  return slip.span === 40 && slip.grain === "fine";
}

export function visibleHour(
  slips: readonly HourSlip[],
  tray: HourTray,
  query: string,
  steward: string,
  glass: string,
  grain: string,
  room: string,
  span: string,
  mass: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): HourSlip[] {
  const text = query.trim().toLowerCase();
  const stewardOn = steward === "all" ? "" : steward.trim().toLowerCase();
  const glassOn = glass === "all" ? "" : glassName(glass).toUpperCase();
  const grainOn = grain === "all" ? "" : grainOf(grain);
  const roomOn = room === "all" ? "" : activeRoom(room);
  const spanOn = span === "all" ? "" : activeSpan(span);
  const massOn = mass === "all" ? "" : activeMass(mass);
  return readHourSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text && !`${slip.title} ${slip.note}`.toLowerCase().includes(text)) return false;
    if (stewardOn && slip.steward.toLowerCase() !== stewardOn) return false;
    if (glassOn && slip.glass !== glassOn) return false;
    if (grainOn && slip.grain !== grainOn) return false;
    if (roomOn === "peak" && !peakRoom(slip.room)) return false;
    if (roomOn === "quiet" && !quietRoom(slip.room)) return false;
    if (roomOn && roomOn !== "peak" && roomOn !== "quiet" && slip.room !== roomOn) return false;
    if (spanOn && String(slip.span ?? "") !== spanOn) return false;
    if (massOn && String(slip.mass) !== massOn) return false;
    if (houseOnly && !houseGlass(slip.glass)) return false;
    if (peakOnly && !peakRoom(slip.room)) return false;
    if (quietOnly && !quietRoom(slip.room)) return false;
    return true;
  });
}

export function sortHour(slips: readonly HourSlip[], sort: HourSort): HourSlip[] {
  return slips.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "steward") {
      const steward = a.steward.localeCompare(b.steward);
      if (steward) return steward;
    }
    const room = (roomIndex(a.room) < 0 ? 99 : roomIndex(a.room)) - (roomIndex(b.room) < 0 ? 99 : roomIndex(b.room));
    if (room) return room;
    return a.title.localeCompare(b.title);
  });
}

export function hourCounts(slips: readonly HourSlip[], shown: readonly HourSlip[], deskRoom: unknown): HourCounts {
  const open = slips.filter((slip) => inTray(slip, "open"));
  return {
    open: open.length,
    held: slips.filter((slip) => inTray(slip, "held")).length,
    archived: slips.filter((slip) => inTray(slip, "archived")).length,
    pinned: open.filter((slip) => slip.pinned).length,
    peak: open.filter((slip) => peakRoom(slip.room)).length,
    quiet: open.filter((slip) => quietRoom(slip.room)).length,
    soon: open.filter((slip) => slip.span === 10).length,
    mass: open.reduce((sum, slip) => sum + slip.mass, 0),
    house: open.filter((slip) => houseGlass(slip.glass)).length,
    span: open.filter((slip) => slip.span !== null).length,
    matched: open.filter((slip) => slip.room && slip.room === roomOf(deskRoom)).length,
    wax: open.filter((slip) => slip.wax).length,
    cooling: open.filter((slip) => coolingSlip(slip)).length,
    rush: open.filter((slip) => rushSlip(slip)).length,
    resting: open.filter((slip) => restingSlip(slip)).length,
  };
}

export function hourShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashRoomCount(slips: readonly HourSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.room === slip.room)).length;
}

export function spanClashCount(slips: readonly HourSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room && slip.span !== null);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.room === slip.room && other.span === slip.span)).length;
}

export function neighborSlipCount(slips: readonly HourSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && roomIndex(slip.room) >= 0);
  return open.filter((slip) => open.some((other) => Math.abs(roomIndex(other.room) - roomIndex(slip.room)) === 1)).length;
}

export function busiestSteward(slips: readonly HourSlip[]): string {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.steward);
  let best = "";
  let score = 0;
  for (const slip of open) {
    const count = open.filter((item) => item.steward.toLowerCase() === slip.steward.toLowerCase()).length;
    if (count > score) {
      best = slip.steward;
      score = count;
    }
  }
  return best;
}

export function pairStewardCount(slips: readonly HourSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.steward);
  return open.filter((slip) => open.filter((item) => item.steward.toLowerCase() === slip.steward.toLowerCase()).length >= 2).length;
}

export function massLoad(slips: readonly HourSlip[]): number {
  return slips.filter((slip) => inTray(slip, "open")).reduce((sum, slip) => sum + slip.mass, 0);
}

export function reminderSlips(slips: readonly HourSlip[]): HourSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && slip.span === 10 && !slip.pinned);
}

export function coolingSlips(slips: readonly HourSlip[]): HourSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && coolingSlip(slip));
}

export function matchedSlips(slips: readonly HourSlip[], deskRoom: unknown): HourSlip[] {
  const room = roomOf(deskRoom);
  if (!room) return [];
  return slips.filter((slip) => inTray(slip, "open") && slip.room === room);
}

export function nextHour(slips: readonly HourSlip[], id: string): HourSlip | null {
  const open = sortHour(slips.filter((slip) => inTray(slip, "open")), "room");
  const at = open.findIndex((slip) => slip.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function hourTimeline(slips: readonly HourSlip[]): { room: string; titles: string[] }[] {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room);
  return HOUR_ROOMS.map((room) => ({ room, titles: open.filter((slip) => slip.room === room).map((slip) => slip.title) })).filter((lane) => lane.titles.length);
}

export function hourStewards(slips: readonly HourSlip[]): string[] {
  const out: string[] = [];
  for (const slip of slips) {
    if (!slip.steward || out.some((item) => item.toLowerCase() === slip.steward.toLowerCase())) continue;
    out.push(slip.steward);
  }
  return out;
}

export function hourCopy(slip: HourSlip): string {
  return [slip.title, slip.steward, slip.room, slip.glass, slip.grain, slip.span ?? "", slip.note].filter((item) => item !== "").join(" · ");
}

export function hourCsv(slips: readonly HourSlip[], deskRoom: unknown): string {
  const lines = ["title,steward,room,glass,grain,span,mass,tags,pinned,held,archived,wax,gap,late,cooling,peak,quiet,house,band,rush,resting,audit,note"];
  for (const slip of readHourSlips(slips)) {
    const gap = roomGap(slip.room, deskRoom);
    lines.push([
      csvCell(slip.title),
      csvCell(slip.steward),
      slip.room,
      slip.glass,
      slip.grain,
      slip.span === null ? "" : String(slip.span),
      String(slip.mass),
      slip.tags.join(" "),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.archived ? "1" : "0",
      slip.wax ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, deskRoom) ? "1" : "0",
      coolingSlip(slip) ? "1" : "0",
      peakRoom(slip.room) ? "1" : "0",
      quietRoom(slip.room) ? "1" : "0",
      houseGlass(slip.glass) ? "1" : "0",
      roomBand(slip.room),
      rushSlip(slip) ? "1" : "0",
      restingSlip(slip) ? "1" : "0",
      slip.audit,
      csvCell(slip.note),
    ].join(","));
  }
  return lines.join("\n");
}

function plateRecord(raw: SyllableValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function plateName(raw: SyllableValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = plateRecord(raw);
  return row ? clip(row.name, 80) : "";
}

function plateInk(raw: SyllableValue): string {
  const row = plateRecord(raw);
  return row ? clip(row.ink, 40) : "";
}

function plateStand(raw: SyllableValue): string {
  const row = plateRecord(raw);
  return row ? clip(row.stand, 40) : "";
}

function letterRun(name: string): string {
  return name.replace(/[^A-Za-z]/g, "");
}

function syllableCount(name: string): number {
  const letters = letterRun(name).toLowerCase();
  let count = 0;
  let prev = false;
  for (const char of letters) {
    const vowel = "aeiou".includes(char);
    if (vowel && !prev) count += 1;
    prev = vowel;
  }
  return count;
}

function consonantCount(name: string): number {
  const letters = letterRun(name).toLowerCase();
  let count = 0;
  for (const char of letters) if (!"aeiou".includes(char)) count += 1;
  return count;
}

function hasMoney(raw: SyllableValue): boolean {
  const row = plateRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

/** A money field clears the plate. A name with a letter is set. A blank name is clear. */
export function syllableState(raw: SyllableValue): SyllableState {
  if (hasMoney(raw)) return "";
  return /[A-Za-z]/.test(plateName(raw)) ? "set" : "clear";
}

/** Last letter plus the vowel-group count. "Ada Lane" is E4. */
export function syllableStamp(raw: SyllableValue): string {
  if (syllableState(raw) !== "set") return "";
  const letters = letterRun(plateName(raw));
  if (!letters) return "";
  return `${letters[letters.length - 1].toUpperCase()}${syllableCount(plateName(raw))}`;
}

/** A slash splits the name. A period dots it. Otherwise the lane follows vowel groups. */
export function syllableLane(raw: SyllableValue): SyllableLane {
  if (syllableState(raw) !== "set") return "";
  const name = plateName(raw);
  if (name.includes("/")) return "split";
  if (name.includes(".")) return "dotted";
  const groups = syllableCount(name);
  if (groups === 0) return "hush";
  if (groups === 1) return "mono";
  if (groups === 2) return "dual";
  return "crowd";
}

/** Hue follows the last letter of the desk. An exclamation mark is pearl. A digit is soot. */
export function syllableHue(raw: SyllableValue): SyllableHue {
  if (syllableState(raw) !== "set") return "";
  const stand = plateStand(raw);
  if (!stand) return "mist";
  if (stand.includes("!")) return "pearl";
  const marks = stand.match(/[A-Za-z0-9]/g);
  const char = marks ? marks[marks.length - 1] : "";
  if (!char) return "mist";
  if (/[0-9]/.test(char)) return "soot";
  const letter = char.toUpperCase();
  if (letter <= "C") return "slate";
  if (letter <= "G") return "sand";
  if (letter <= "K") return "clay";
  if (letter <= "O") return "pearl";
  return "soot";
}

export function syllableBound(raw: SyllableValue): boolean {
  return syllableState(raw) === "set" && /^[aeiou]/i.test(plateInk(raw));
}

export function syllableWide(raw: SyllableValue): boolean {
  return letterRun(plateName(raw)).length >= 16;
}

export function syllableNotch(raw: SyllableValue): boolean {
  return plateName(raw).includes(".");
}

export function syllableStep(raw: SyllableValue): number {
  if (syllableState(raw) !== "set") return 0;
  return Math.min(5, consonantCount(plateName(raw)));
}

export function syllableJoin(raw: SyllableValue): boolean {
  return plateName(raw).includes("/");
}

export function syllableLanes(rows: readonly SyllableRow[]): SyllableLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = syllableLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSyllable(rows: readonly SyllableRow[]): string {
  const bars = syllableLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSyllableHue(rows: readonly SyllableRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = syllableHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedSyllableCount(rows: readonly SyllableRow[]): number {
  const marks = rows.map((row) => syllableStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneSyllableCount(rows: readonly SyllableRow[], lane: SyllableLane): number {
  return rows.filter((row) => syllableLane(row.note) === lane).length;
}

export function hueSyllableCount(rows: readonly SyllableRow[], hue: SyllableHue): number {
  return rows.filter((row) => syllableHue(row.note) === hue).length;
}

export function syllableShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSyllableLanes(rows: readonly SyllableRow[]): string[] {
  return syllableLanes(rows).map((line) => line.lane);
}

export function readHiddenSyllables(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if (!allow.has(lane) || out.includes(lane)) continue;
    out.push(lane);
  }
  return out;
}

export function readReviewedSyllables(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleSyllable(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSyllableReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSyllableReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSyllableLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleSyllables(
  rows: readonly SyllableRow[],
  lane: string,
  hue: string,
  query: string,
  review: SyllableReview,
  reviewed: readonly string[],
  shape: SyllableShape,
): SyllableRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (syllableState(row.note) === "") return false;
    const found = syllableLane(row.note);
    const hueName = syllableHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${plateName(row.note)} ${syllableStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "split" && found !== "split") return false;
    if (shape === "wide" && !syllableWide(row.note)) return false;
    if (shape === "bound" && !syllableBound(row.note)) return false;
    if (shape === "notch" && !syllableNotch(row.note)) return false;
    if (shape === "dotted" && found !== "dotted") return false;
    return true;
  });
}

export function syllableCopy(raw: SyllableValue): string {
  return [syllableStamp(raw), syllableLane(raw), syllableHue(raw)].filter(Boolean).join(" ");
}

export function platesCsv(rows: readonly SyllableRow[]): string {
  const lines = ["lane,count"];
  for (const line of syllableLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function plateRowsCsv(rows: readonly SyllableRow[], reviewed: readonly string[]): string {
  const lines = ["name,stamp,lane,hue,step,join,wide,notch,bound,split,dotted,mono,dual,crowd,hush,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (syllableState(row.note) !== "set") continue;
    const lane = syllableLane(row.note);
    lines.push([
      csvCell(plateName(row.note)),
      syllableStamp(row.note),
      lane,
      syllableHue(row.note),
      String(syllableStep(row.note)),
      syllableJoin(row.note) ? "1" : "0",
      syllableWide(row.note) ? "1" : "0",
      syllableNotch(row.note) ? "1" : "0",
      syllableBound(row.note) ? "1" : "0",
      lane === "split" ? "1" : "0",
      lane === "dotted" ? "1" : "0",
      lane === "mono" ? "1" : "0",
      lane === "dual" ? "1" : "0",
      lane === "crowd" ? "1" : "0",
      lane === "hush" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
