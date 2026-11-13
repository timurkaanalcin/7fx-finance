/**
 * Pelorus bearings for a boxed sight book, and sounding plates already stored as affiliateB.
 * Stations are bow, beam, quarter, and stern. Vanes are plain, shaded, and mirrored.
 * Angles are 0, 45, or 90. Rings are 1, 3, 5, or 7.
 * PORT is a harbor and ROAD is a road. BAY is a cove. SND is a fathom.
 * A separator or a digit is a channel. Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_pelorus_bearing (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   helmsman text not null default '',
 *   station text not null default '',
 *   finish text not null default '',
 *   vane text not null default '',
 *   angle_no integer,
 *   ring_no integer not null default 1,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_sounding_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_sounding_review (
 *   trader_id text primary key
 * );
 */

export const PLR_KEY = "crmv4-pelorus-bearing";
export const PLR_VIEW_KEY = "crmv4-pelorus-views";
export const PLR_DENSITY_KEY = "crmv4-pelorus-density";
export const SND_KEY = "crmv4-sounding-hide";
export const SND_REVIEW_KEY = "crmv4-sounding-review";

export const PELORUS_STATIONS = ["bow", "beam", "quarter", "stern"] as const;

export type PelorusStation = (typeof PELORUS_STATIONS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type VaneName = "blank" | "plain" | "shaded" | "mirrored";

export type BearingTray = "bridge" | "cabin" | "hold";

export type BearingDensity = "airy" | "tight";

export type BearingSort = "station" | "helmsman";

export type PelorusBearing = {
  id: string;
  title: string;
  note: string;
  helmsman: string;
  station: string;
  angle: number | null;
  finish: string;
  vane: string;
  ring: number;
  tags: string[];
  sighted: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type BearingView = {
  id: string;
  name: string;
  tray: BearingTray;
  query: string;
  helmsman: string;
  finish: string;
  vane: string;
  station: string;
  angle: string;
  ring: string;
};

export type BearingCounts = {
  bridge: number;
  cabin: number;
  hold: number;
  sighted: number;
  keen: number;
  still: number;
  soon: number;
  ring: number;
  house: number;
  angle: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type SoundingLane = "" | "harbor" | "road" | "cove" | "fathom" | "channel" | "estuary";

export type SoundingHue = "" | "ivory" | "graphite" | "champagne";

export type SoundingState = "" | "clear" | "set";

export type SoundingShape = "all" | "harbor" | "road" | "cove" | "fathom" | "channel" | "estuary" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type SoundingReview = "all" | "reviewed" | "fresh";

export type SoundingValue = string | { affiliateB?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type SoundingRow = { id: string; label: string; note: SoundingValue };

export type SoundingLaneLine = { lane: string; count: number };

export const ROUND276_FEATURES = [
  "save",
  "note",
  "trays",
  "sight",
  "angle",
  "stow",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "sort",
  "kpis",
  "chart",
  "timeline",
  "bulk",
  "csv",
  "keys",
  "audit",
  "fair-helmsman",
  "viewer",
  "suggest",
  "sla",
  "sounding",
  "sounding-csv",
] as const;

const AUDITS = ["save", "edit", "note", "vane", "sight", "unsight", "lock", "resume", "stow", "open", "finish", "tag", "ring", "angle", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const VANES = ["plain", "shaded", "mirrored"] as const;

const ANGLE_CYCLE = [0, 45, 90] as const;

const RING_CYCLE = [1, 3, 5, 7] as const;

const KEEN = new Set(["quarter", "stern"]);

const STILL = new Set(["bow", "beam"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const DAWN = new Set(["bow"]);

const LANE_ORDER = ["harbor", "road", "cove", "fathom", "channel", "estuary"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["port", "road", "bay", "sound", "brand", "aff-b"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BearingTray {
  return raw === "cabin" || raw === "hold" ? raw : "bridge";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function vaneName(raw: unknown): Exclude<VaneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (VANES as readonly string[]).includes(text) ? (text as Exclude<VaneName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: PelorusBearing, tray: BearingTray): boolean {
  if (tray === "cabin") return card.locked && !card.stowed;
  if (tray === "hold") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return PELORUS_STATIONS.indexOf(station as PelorusStation);
}

function ringIndex(ring: number): number {
  return RING_CYCLE.indexOf(ring as (typeof RING_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function stationOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PELORUS_STATIONS as readonly string[]).includes(text) ? text : "";
}

/** Angle is 0, 45, or 90 degrees. Anything else stays blank. */
export function pelorusAngle(raw: unknown): 0 | 45 | 90 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (ANGLE_CYCLE as readonly number[]).includes(value) ? (value as 0 | 45 | 90) : null;
}

/** Ring is 1, 3, 5, or 7. Anything else stays blank. */
export function pelorusRing(raw: unknown): 1 | 3 | 5 | 7 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (RING_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function metalOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Vane is plain, shaded, or mirrored. A blank vane stays blank. */
export function vaneOf(raw: unknown): string {
  return vaneName(raw);
}

export function keenStation(station: unknown): boolean {
  return KEEN.has(clip(station, 12).toLowerCase());
}

export function stillStation(station: unknown): boolean {
  return STILL.has(clip(station, 12).toLowerCase());
}

/** Dawn is the bow. Noon is the beam. Dusk is the quarter. Night is the stern. */
export function stationBand(station: unknown): string {
  const text = stationOf(station);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "beam") return "noon";
  if (text === "quarter") return "dusk";
  return "night";
}

/** Signed distance from one station to the desk station. */
export function stationGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(stationOf(from));
  const right = stationIndex(stationOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseMetal(finish: unknown): boolean {
  return HOUSE.has(metalOf(finish));
}

export function activeStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return stationOf(text) || "all";
}

export function activeAngle(raw: unknown): string {
  const angle = pelorusAngle(raw);
  return angle === null ? "all" : String(angle);
}

export function activeVane(raw: unknown, allow: readonly string[]): string {
  const text = vaneOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRing(raw: unknown): string {
  const ring = pelorusRing(raw);
  return ring === null ? "all" : String(ring);
}

export function activeMetal(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function movePelorusFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestMetal(cards: readonly PelorusBearing[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bridge") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "IVORY";
  let score = 0;
  for (const finish of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(finish) || 0;
    if (count > score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before seven, suggest a level angle. Through the afternoon, forty-five. Evening asks for ninety. Saved angles win when any exist. */
export function suggestAngle(cards: readonly PelorusBearing[], hour: number): 0 | 45 | 90 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bridge") || card.angle === null) continue;
    counts.set(card.angle, (counts.get(card.angle) || 0) + 1);
  }
  let best: 0 | 45 | 90 | null = null;
  let score = 0;
  for (const angle of ANGLE_CYCLE) {
    const count = counts.get(angle) || 0;
    if (count > score) {
      best = angle;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 7) return 0;
  if (hour < 15) return 45;
  return 90;
}

/** Before nine, suggest the bow. The rest of the day suggests the quarter. */
export function suggestStation(hour: number): PelorusStation {
  return hour < 9 ? "bow" : "quarter";
}

/** The helmsman with the fewest unsighted bridge bearings. A tie keeps the roster order. */
export function fairHelmsman(cards: readonly PelorusBearing[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bridge") && !card.sighted);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.helmsman.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readBearings(raw: unknown): PelorusBearing[] {
  if (!Array.isArray(raw)) return [];
  const out: PelorusBearing[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PelorusBearing>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      helmsman: clip(row.helmsman, 24),
      station: stationOf(row.station),
      angle: pelorusAngle(row.angle),
      finish: metalOf(row.finish),
      vane: vaneOf(row.vane),
      ring: pelorusRing(row.ring) ?? 1,
      tags: tagsOf(row.tags),
      sighted: row.sighted === true,
      locked: row.locked === true,
      stowed: row.stowed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addBearing(
  cards: readonly PelorusBearing[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    helmsman?: string;
    station?: string;
    angle?: unknown;
    finish?: string;
    vane?: string;
    ring?: unknown;
    tags?: string;
  },
): PelorusBearing[] {
  const current = readBearings(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: PelorusBearing = {
    id,
    title,
    note: noteOf(card.note),
    helmsman: clip(card.helmsman, 24),
    station: stationOf(card.station),
    angle: pelorusAngle(card.angle),
    finish: metalOf(card.finish),
    vane: vaneOf(card.vane),
    ring: pelorusRing(card.ring) ?? 1,
    tags: tagsOf(card.tags),
    sighted: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly PelorusBearing[], id: string, change: (card: PelorusBearing) => PelorusBearing): PelorusBearing[] {
  return readBearings(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly PelorusBearing[], ids: readonly string[], change: (card: PelorusBearing) => PelorusBearing): PelorusBearing[] {
  const picked = new Set(ids);
  return readBearings(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editBearing(cards: readonly PelorusBearing[], id: string, title: string): PelorusBearing[] {
  const next = lineOf(title);
  if (!next) return readBearings(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBearingNote(cards: readonly PelorusBearing[], id: string, note: string): PelorusBearing[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setBearingSight(cards: readonly PelorusBearing[], id: string, sighted: boolean): PelorusBearing[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "sight" : "unsight" }));
}

export function setBearingLock(cards: readonly PelorusBearing[], id: string, locked: boolean): PelorusBearing[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setBearingStow(cards: readonly PelorusBearing[], id: string, stowed: boolean): PelorusBearing[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setBearingStar(cards: readonly PelorusBearing[], id: string, flagged: boolean): PelorusBearing[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setBearingFinish(cards: readonly PelorusBearing[], id: string, finish: unknown): PelorusBearing[] {
  const next = metalOf(finish);
  if (!next) return readBearings(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Vane steps plain, shaded, mirrored, then plain again. A blank vane starts at plain. */
export function cycleVane(cards: readonly PelorusBearing[], id: string): PelorusBearing[] {
  return mapCard(cards, id, (card) => {
    const at = VANES.indexOf(card.vane as (typeof VANES)[number]);
    const next = at < 0 ? VANES[0] : VANES[(at + 1) % VANES.length];
    return next === card.vane ? card : { ...card, vane: next, audit: "vane" };
  });
}

export function addBearingTag(cards: readonly PelorusBearing[], id: string, tag: string): PelorusBearing[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBearings(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank angle becomes 0, 0 becomes 45, and 45 becomes 90. An angle of 90 stays. */
export function liftAngle(cards: readonly PelorusBearing[], id: string): PelorusBearing[] {
  return mapCard(cards, id, (card) => {
    if (card.angle === 90) return card;
    const next = card.angle === 45 ? 90 : card.angle === 0 ? 45 : 0;
    return { ...card, angle: next, audit: "angle" };
  });
}

/** A blank angle becomes 90, 90 becomes 45, and 45 becomes 0. An angle of 0 stays. */
export function dipAngle(cards: readonly PelorusBearing[], id: string): PelorusBearing[] {
  return mapCard(cards, id, (card) => {
    if (card.angle === 0) return card;
    const next = card.angle === 45 ? 0 : card.angle === 90 ? 45 : 90;
    return { ...card, angle: next, audit: "dip" };
  });
}

export function raiseRing(cards: readonly PelorusBearing[], id: string): PelorusBearing[] {
  return mapCard(cards, id, (card) => {
    const at = ringIndex(card.ring);
    if (at < 0) return { ...card, ring: 1, audit: "ring" };
    if (at === RING_CYCLE.length - 1) return card;
    return { ...card, ring: RING_CYCLE[at + 1], audit: "ring" };
  });
}

export function lowerRing(cards: readonly PelorusBearing[], id: string): PelorusBearing[] {
  return mapCard(cards, id, (card) => {
    const at = ringIndex(card.ring);
    if (at <= 0) return card;
    return { ...card, ring: RING_CYCLE[at - 1], audit: "ring" };
  });
}

export function bulkBearingSight(cards: readonly PelorusBearing[], ids: readonly string[]): PelorusBearing[] {
  return touchIds(cards, ids, (card) => ({ ...card, sighted: true, audit: "sight" }));
}

export function bulkBearingStow(cards: readonly PelorusBearing[], ids: readonly string[]): PelorusBearing[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkBearingMirrored(cards: readonly PelorusBearing[], ids: readonly string[]): PelorusBearing[] {
  return touchIds(cards, ids, (card) => ({ ...card, vane: "mirrored", audit: "vane" }));
}

export function bulkBearingChampagne(cards: readonly PelorusBearing[], ids: readonly string[]): PelorusBearing[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkBearingTag(cards: readonly PelorusBearing[], ids: readonly string[], tag: string): PelorusBearing[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBearings(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly PelorusBearing[], ids: readonly string[], index: number, change: (list: readonly PelorusBearing[], id: string) => PelorusBearing[]): PelorusBearing[] {
  const id = ids[index];
  return id ? change(cards, id) : readBearings(cards);
}

export function liftAngleFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  return focused(cards, ids, index, liftAngle);
}

export function dipAngleFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  return focused(cards, ids, index, dipAngle);
}

export function vaneFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  return focused(cards, ids, index, cycleVane);
}

export function raiseRingFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  return focused(cards, ids, index, raiseRing);
}

export function lowerRingFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  return focused(cards, ids, index, lowerRing);
}

export function sightBearingFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  const id = ids[index];
  if (!id) return readBearings(cards);
  const card = readBearings(cards).find((item) => item.id === id);
  return card ? setBearingSight(cards, id, !card.sighted) : readBearings(cards);
}

export function lockBearingFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  const id = ids[index];
  if (!id) return readBearings(cards);
  const card = readBearings(cards).find((item) => item.id === id);
  return card ? setBearingLock(cards, id, !card.locked) : readBearings(cards);
}

export function starBearingFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number): PelorusBearing[] {
  const id = ids[index];
  if (!id) return readBearings(cards);
  const card = readBearings(cards).find((item) => item.id === id);
  return card ? setBearingStar(cards, id, !card.flagged) : readBearings(cards);
}

export function tagBearingFocused(cards: readonly PelorusBearing[], ids: readonly string[], index: number, tag: string): PelorusBearing[] {
  const id = ids[index];
  return id ? addBearingTag(cards, id, tag) : readBearings(cards);
}

export function readBearingViews(raw: unknown): BearingView[] {
  if (!Array.isArray(raw)) return [];
  const out: BearingView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BearingView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      helmsman: clip(row.helmsman, 24),
      finish: activeMetal(row.finish),
      vane: activeVane(row.vane, VANES),
      station: activeStation(row.station),
      angle: activeAngle(row.angle),
      ring: activeRing(row.ring),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBearingView(
  views: readonly BearingView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    helmsman?: string;
    finish?: string;
    vane?: string;
    station?: string;
    angle?: string;
    ring?: string;
  },
): BearingView[] {
  const current = readBearingViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BearingView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    helmsman: clip(view.helmsman, 24),
    finish: activeMetal(view.finish),
    vane: activeVane(view.vane, VANES),
    station: activeStation(view.station),
    angle: activeAngle(view.angle),
    ring: activeRing(view.ring),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBearingView(views: readonly BearingView[], id: string): BearingView[] {
  return readBearingViews(views).filter((view) => view.id !== id);
}

export function bearingDensity(raw: unknown): BearingDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A bearing more than one station behind the desk, at ring 1, is late. */
export function lateBearing(card: PelorusBearing, deskStation: unknown): boolean {
  const gap = stationGap(card.station, deskStation);
  return card.ring === 1 && gap !== null && gap > 1;
}

export function idleBearing(card: PelorusBearing): boolean {
  return card.vane === "plain" && stillStation(card.station) && card.ring === 1;
}

export function briskBearing(card: PelorusBearing): boolean {
  return card.ring === 7 && card.vane === "mirrored" && keenStation(card.station);
}

export function restingBearing(card: PelorusBearing): boolean {
  return card.angle === 90 && card.vane === "shaded" && card.station === "stern";
}

/** A level angle on a keen station is overdue unless the pelorus is sighted. */
export function overdueBearing(card: PelorusBearing): boolean {
  return card.angle === 0 && keenStation(card.station) && !card.sighted;
}

export function visibleBearings(
  cards: readonly PelorusBearing[],
  tray: BearingTray,
  query: string,
  helmsman: string,
  finish: string,
  vane: string,
  station: string,
  angle: string,
  ring: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): PelorusBearing[] {
  const text = query.trim().toLowerCase();
  const helmOn = helmsman === "all" ? "" : helmsman.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : metalOf(finish);
  const vaneOn = vane === "all" ? "" : vaneOf(vane);
  const stationOn = station === "all" ? "" : activeStation(station);
  const angleOn = angle === "all" ? "" : activeAngle(angle);
  const ringOn = ring === "all" ? "" : activeRing(ring);
  return readBearings(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (helmOn && card.helmsman.toLowerCase() !== helmOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (vaneOn && card.vane !== vaneOn) return false;
    if (stationOn === "keen" && !keenStation(card.station)) return false;
    if (stationOn === "still" && !stillStation(card.station)) return false;
    if (stationOn && stationOn !== "keen" && stationOn !== "still" && card.station !== stationOn) return false;
    if (angleOn && String(card.angle ?? "") !== angleOn) return false;
    if (ringOn && String(card.ring) !== ringOn) return false;
    if (houseOnly && !houseMetal(card.finish)) return false;
    if (keenOnly && !keenStation(card.station)) return false;
    if (stillOnly && !stillStation(card.station)) return false;
    return true;
  });
}

export function sortBearings(cards: readonly PelorusBearing[], sort: BearingSort): PelorusBearing[] {
  return cards.slice().sort((a, b) => {
    if (a.sighted !== b.sighted) return a.sighted ? -1 : 1;
    if (sort === "helmsman") {
      const helm = a.helmsman.localeCompare(b.helmsman);
      if (helm) return helm;
    }
    const station = (stationIndex(a.station) < 0 ? 99 : stationIndex(a.station)) - (stationIndex(b.station) < 0 ? 99 : stationIndex(b.station));
    if (station) return station;
    return a.title.localeCompare(b.title);
  });
}

export function bearingCounts(cards: readonly PelorusBearing[], shown: readonly PelorusBearing[], deskStation: unknown): BearingCounts {
  const open = cards.filter((card) => inTray(card, "bridge"));
  return {
    bridge: open.length,
    cabin: cards.filter((card) => inTray(card, "cabin")).length,
    hold: cards.filter((card) => inTray(card, "hold")).length,
    sighted: open.filter((card) => card.sighted).length,
    keen: open.filter((card) => keenStation(card.station)).length,
    still: open.filter((card) => stillStation(card.station)).length,
    soon: open.filter((card) => card.angle === 0).length,
    ring: open.reduce((sum, card) => sum + card.ring, 0),
    house: open.filter((card) => houseMetal(card.finish)).length,
    angle: open.filter((card) => card.angle !== null).length,
    matched: shown.filter((card) => card.station && card.station === stationOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleBearing(card)).length,
    brisk: open.filter((card) => briskBearing(card)).length,
    resting: open.filter((card) => restingBearing(card)).length,
    overdue: open.filter((card) => overdueBearing(card)).length,
  };
}

export function clashStationCount(cards: readonly PelorusBearing[]): number {
  const open = cards.filter((card) => inTray(card, "bridge") && card.station);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.station === card.station && other.ring === card.ring)).length;
}

export function neighborBearingCount(cards: readonly PelorusBearing[]): number {
  const open = cards.filter((card) => inTray(card, "bridge") && ringIndex(card.ring) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(ringIndex(other.ring) - ringIndex(card.ring));
    const ring = Math.min(gap, RING_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestHelmsman(cards: readonly PelorusBearing[]): string {
  const open = cards.filter((card) => inTray(card, "bridge") && card.helmsman);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.helmsman.toLowerCase() === card.helmsman.toLowerCase()).length;
    if (count > score) {
      best = card.helmsman;
      score = count;
    }
  }
  return best;
}

export function reminderBearings(cards: readonly PelorusBearing[]): PelorusBearing[] {
  return cards.filter((card) => inTray(card, "bridge") && (card.angle === 0 || card.angle === 45));
}

export function idleBearings(cards: readonly PelorusBearing[]): PelorusBearing[] {
  return cards.filter((card) => inTray(card, "bridge") && idleBearing(card));
}

export function bearingTimeline(cards: readonly PelorusBearing[]): { ring: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bridge"));
  return RING_CYCLE.map((ring) => ({ ring, titles: open.filter((card) => card.ring === ring).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function bearingBars(cards: readonly PelorusBearing[]): { station: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "bridge"));
  return PELORUS_STATIONS.map((station) => ({ station, count: open.filter((card) => card.station === station).length }));
}

export function bearingHelmsmen(cards: readonly PelorusBearing[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helmsman || out.some((item) => item.toLowerCase() === card.helmsman.toLowerCase())) continue;
    out.push(card.helmsman);
  }
  return out;
}

export function bearingCopy(card: PelorusBearing): string {
  return [card.title, card.helmsman, card.station, card.finish, card.vane, card.angle ?? "", card.ring, card.note].filter((item) => item !== "").join(" · ");
}

export function bearingCsv(cards: readonly PelorusBearing[], deskStation: unknown): string {
  const lines = ["title,helmsman,station,finish,vane,angle,ring,tags,sighted,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readBearings(cards)) {
    const gap = stationGap(card.station, deskStation);
    lines.push([
      csvCell(card.title),
      csvCell(card.helmsman),
      card.station,
      card.finish,
      card.vane,
      card.angle === null ? "" : String(card.angle),
      String(card.ring),
      card.tags.join(" "),
      card.sighted ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBearing(card, deskStation) ? "1" : "0",
      idleBearing(card) ? "1" : "0",
      keenStation(card.station) ? "1" : "0",
      stillStation(card.station) ? "1" : "0",
      houseMetal(card.finish) ? "1" : "0",
      stationBand(card.station),
      briskBearing(card) ? "1" : "0",
      restingBearing(card) ? "1" : "0",
      overdueBearing(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function soundingRecord(raw: SoundingValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: SoundingValue): boolean {
  const row = soundingRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type SoundingParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number; digit: boolean };

function soundingText(raw: SoundingValue): string {
  if (hasBlocked(raw)) return "";
  const row = soundingRecord(raw);
  if (row && !("affiliateB" in row) && !("code" in row)) return "";
  return row ? clip(row.affiliateB ?? row.code, 32) : clip(raw, 32);
}

function soundingParts(raw: SoundingValue): SoundingParts | null {
  const text = soundingText(raw);
  if (!/^[A-Za-z][A-Za-z0-9_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/-/g) || []).length,
    seps,
    digit: /\d/.test(text),
  };
}

/** A blocked money field clears the plate. A real second affiliate code is set. A blank or broken code is clear. */
export function soundingState(raw: SoundingValue): SoundingState {
  if (hasBlocked(raw)) return "";
  const row = soundingRecord(raw);
  if (row && !("affiliateB" in row) && !("code" in row)) return "";
  return soundingParts(raw) ? "set" : "clear";
}

/** PORT is a harbor, ROAD is a road, BAY is a cove, SND is a fathom, and a separator or a digit is a channel. */
export function soundingLane(raw: SoundingValue): SoundingLane {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "port") return "harbor";
  if (key === "road") return "road";
  if (key === "bay") return "cove";
  if (key.startsWith("snd")) return "fathom";
  if (parts.seps >= 1 || parts.digit) return "channel";
  return "estuary";
}

/** The first three letters. */
export function soundingStamp(raw: SoundingValue): string {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return parts ? parts.letters.slice(0, 3).toUpperCase() : "";
}

/** PORT is graphite, ROAD and BAY are ivory, SND is champagne, and other codes follow the first letter. */
export function soundingHue(raw: SoundingValue): SoundingHue {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  if (!parts) return "";
  const lane = soundingLane(raw);
  if (lane === "fathom") return "champagne";
  if (lane === "harbor" || lane === "channel") return "graphite";
  if (lane === "road" || lane === "cove") return "ivory";
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function soundingTwin(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function soundingWide(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function soundingNotch(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function soundingEcho(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function soundingLeap(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function soundingSlash(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function soundingKnown(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function soundingCap(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function soundingTail(raw: SoundingValue): boolean {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function soundingStep(raw: SoundingValue): number {
  const parts = soundingState(raw) === "set" ? soundingParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function soundingLanes(rows: readonly SoundingRow[]): SoundingLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = soundingLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSounding(rows: readonly SoundingRow[]): string {
  const bars = soundingLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSoundingHue(rows: readonly SoundingRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = soundingHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedSoundingCount(rows: readonly SoundingRow[]): number {
  const marks = rows.map((row) => soundingStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneSoundingCount(rows: readonly SoundingRow[], lane: SoundingLane): number {
  return rows.filter((row) => soundingLane(row.note) === lane).length;
}

export function soundingShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSoundingLanes(rows: readonly SoundingRow[]): string[] {
  return soundingLanes(rows).map((line) => line.lane);
}

export function readHiddenSoundings(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSoundings(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSounding(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSoundingReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSoundingReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSoundingLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleSoundings(
  rows: readonly SoundingRow[],
  lane: string,
  hue: string,
  query: string,
  review: SoundingReview,
  reviewed: readonly string[],
  shape: SoundingShape,
): SoundingRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (soundingState(row.note) === "") return false;
    const found = soundingLane(row.note);
    const hueName = soundingHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${soundingText(row.note)} ${soundingStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "harbor" && found !== "harbor") return false;
    if (shape === "road" && found !== "road") return false;
    if (shape === "cove" && found !== "cove") return false;
    if (shape === "fathom" && found !== "fathom") return false;
    if (shape === "channel" && found !== "channel") return false;
    if (shape === "estuary" && found !== "estuary") return false;
    if (shape === "wide" && !soundingWide(row.note)) return false;
    if (shape === "notch" && !soundingNotch(row.note)) return false;
    if (shape === "leap" && !soundingLeap(row.note)) return false;
    if (shape === "slash" && !soundingSlash(row.note)) return false;
    if (shape === "twin" && !soundingTwin(row.note)) return false;
    if (shape === "known" && !soundingKnown(row.note)) return false;
    if (shape === "echo" && !soundingEcho(row.note)) return false;
    return true;
  });
}

export function soundingCopy(raw: SoundingValue): string {
  return [soundingStamp(raw), soundingLane(raw), soundingHue(raw)].filter(Boolean).join(" ");
}

export function soundingLanesCsv(rows: readonly SoundingRow[]): string {
  const lines = ["lane,count"];
  for (const line of soundingLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function soundingRowsCsv(rows: readonly SoundingRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (soundingState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(soundingText(row.note)),
      soundingStamp(row.note),
      soundingLane(row.note),
      soundingHue(row.note),
      String(soundingStep(row.note)),
      soundingEcho(row.note) ? "1" : "0",
      soundingWide(row.note) ? "1" : "0",
      soundingNotch(row.note) ? "1" : "0",
      soundingLeap(row.note) ? "1" : "0",
      soundingSlash(row.note) ? "1" : "0",
      soundingTwin(row.note) ? "1" : "0",
      soundingKnown(row.note) ? "1" : "0",
      soundingCap(row.note) ? "1" : "0",
      soundingTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
