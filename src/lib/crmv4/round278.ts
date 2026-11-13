/**
 * Cross-staff sights for a coastal book kept in this browser, and server plates read the trading server already stored on the account.
 * Reaches are near, beam, quarter, and stern. Shades are mist, ink, and gilt.
 * Heights are 12, 24, or 48. Crosses are 1, 3, or 9.
 * LIVE is a beacon, DEMO is a lantern, mt4 is a house, and a separator or a digit is a buoy.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cross_staff (
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
 * CREATE TABLE crm_server_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_server_review (
 *   trader_id text primary key
 * );
 */

export const CRS_KEY = "crmv4-cross-staff";
export const CRS_VIEW_KEY = "crmv4-cross-views";
export const CRS_DENSITY_KEY = "crmv4-cross-density";
export const SVR_KEY = "crmv4-server-hide";
export const SVR_REVIEW_KEY = "crmv4-server-review";

export const STAFF_REACHES = ["near", "beam", "quarter", "stern"] as const;

export type StaffReach = (typeof STAFF_REACHES)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type VaneName = "blank" | "mist" | "ink" | "gilt";

export type StaffTray = "rail" | "chest" | "hold";

export type StaffDensity = "open" | "close";

export type StaffSort = "band" | "keeper";

export type StaffSight = {
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

export type StaffView = {
  id: string;
  name: string;
  tray: StaffTray;
  query: string;
  helmsman: string;
  finish: string;
  vane: string;
  station: string;
  angle: string;
  ring: string;
};

export type StaffCounts = {
  rail: number;
  chest: number;
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

export type ServerLane = "" | "beacon" | "lantern" | "house" | "buoy" | "channel" | "road";

export type ServerHue = "" | "ivory" | "graphite" | "champagne";

export type ServerState = "" | "clear" | "set";

export type ServerShape = "all" | "beacon" | "lantern" | "house" | "buoy" | "channel" | "road" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type ServerReview = "all" | "reviewed" | "fresh";

export type ServerValue = string | { tradingServer?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type ServerRow = { id: string; label: string; note: ServerValue };

export type ServerLaneLine = { lane: string; count: number };

export const ROUND278_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "height",
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "server",
  "server-csv",
] as const;

const AUDITS = ["save", "edit", "note", "vane", "sight", "unsight", "lock", "resume", "stow", "open", "finish", "tag", "ring", "angle", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const VANES = ["mist", "ink", "gilt"] as const;

const ANGLE_CYCLE = [12, 24, 48] as const;

const BEAD_CYCLE = [1, 3, 9] as const;

const KEEN = new Set(["quarter", "stern"]);

const STILL = new Set(["near", "beam"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const DAWN = new Set(["near"]);

const LANE_ORDER = ["beacon", "lantern", "house", "buoy", "channel", "road"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["mt4", "mt5", "ctrader", "match", "live", "demo"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StaffTray {
  return raw === "chest" || raw === "hold" ? raw : "rail";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function shadeName(raw: unknown): Exclude<VaneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (VANES as readonly string[]).includes(text) ? (text as Exclude<VaneName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: StaffSight, tray: StaffTray): boolean {
  if (tray === "chest") return card.locked && !card.stowed;
  if (tray === "hold") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function reachIndex(station: string): number {
  return STAFF_REACHES.indexOf(station as StaffReach);
}

function ringIndex(ring: number): number {
  return BEAD_CYCLE.indexOf(ring as (typeof BEAD_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function reachOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (STAFF_REACHES as readonly string[]).includes(text) ? text : "";
}

/** Pitch is 10, 30, or 60. Anything else stays blank. */
export function staffHeight(raw: unknown): 12 | 24 | 48 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (ANGLE_CYCLE as readonly number[]).includes(value) ? (value as 12 | 24 | 48) : null;
}

/** Bead is 2, 4, 6, or 8. Anything else stays blank. */
export function staffBead(raw: unknown): 1 | 3 | 9 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (BEAD_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 9) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Vane is plain, shaded, or mirrored. A blank vane stays blank. */
export function shadeOf(raw: unknown): string {
  return shadeName(raw);
}

export function keenReach(station: unknown): boolean {
  return KEEN.has(clip(station, 12).toLowerCase());
}

export function stillReach(station: unknown): boolean {
  return STILL.has(clip(station, 12).toLowerCase());
}

/** Dawn is the near reach. Noon is the beam. Dusk is the quarter. Night is the stern. */
export function reachBand(station: unknown): string {
  const text = reachOf(station);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "beam") return "noon";
  if (text === "quarter") return "dusk";
  return "night";
}

/** Signed distance from one station to the desk station. */
export function reachGap(from: unknown, to: unknown): number | null {
  const left = reachIndex(reachOf(from));
  const right = reachIndex(reachOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE.has(finishOf(finish));
}

export function activeReach(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return reachOf(text) || "all";
}

export function activeHeight(raw: unknown): string {
  const angle = staffHeight(raw);
  return angle === null ? "all" : String(angle);
}

export function activeShade(raw: unknown, allow: readonly string[]): string {
  const text = shadeOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const ring = staffBead(raw);
  return ring === null ? "all" : String(ring);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveSightFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly StaffSight[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "rail") || !card.finish) continue;
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

/** Before six, suggest ten. Through the afternoon, thirty. Evening asks for sixty. Saved pitches win when any exist. */
export function suggestHeight(cards: readonly StaffSight[], hour: number): 12 | 24 | 48 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "rail") || card.angle === null) continue;
    counts.set(card.angle, (counts.get(card.angle) || 0) + 1);
  }
  let best: 12 | 24 | 48 | null = null;
  let score = 0;
  for (const angle of ANGLE_CYCLE) {
    const count = counts.get(angle) || 0;
    if (count > score) {
      best = angle;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 7) return 12;
  if (hour < 16) return 24;
  return 48;
}

/** Before nine, suggest the near reach. The rest of the day suggests the quarter. */
export function suggestReach(hour: number): StaffReach {
  return hour < 9 ? "near" : "quarter";
}

/** The helmsman with the fewest unsighted bridge bearings. A tie keeps the roster order. */
export function fairKeeper(cards: readonly StaffSight[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "rail") && !card.sighted);
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

export function readSights(raw: unknown): StaffSight[] {
  if (!Array.isArray(raw)) return [];
  const out: StaffSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StaffSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      helmsman: clip(row.helmsman, 24),
      station: reachOf(row.station),
      angle: staffHeight(row.angle),
      finish: finishOf(row.finish),
      vane: shadeOf(row.vane),
      ring: staffBead(row.ring) ?? 1,
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

export function addSight(
  cards: readonly StaffSight[],
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
): StaffSight[] {
  const current = readSights(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: StaffSight = {
    id,
    title,
    note: noteOf(card.note),
    helmsman: clip(card.helmsman, 24),
    station: reachOf(card.station),
    angle: staffHeight(card.angle),
    finish: finishOf(card.finish),
    vane: shadeOf(card.vane),
    ring: staffBead(card.ring) ?? 1,
    tags: tagsOf(card.tags),
    sighted: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly StaffSight[], id: string, change: (card: StaffSight) => StaffSight): StaffSight[] {
  return readSights(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly StaffSight[], ids: readonly string[], change: (card: StaffSight) => StaffSight): StaffSight[] {
  const picked = new Set(ids);
  return readSights(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editSight(cards: readonly StaffSight[], id: string, title: string): StaffSight[] {
  const next = lineOf(title);
  if (!next) return readSights(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSightNote(cards: readonly StaffSight[], id: string, note: string): StaffSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setSightMarked(cards: readonly StaffSight[], id: string, sighted: boolean): StaffSight[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "sight" : "unsight" }));
}

export function setSightLock(cards: readonly StaffSight[], id: string, locked: boolean): StaffSight[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setSightStow(cards: readonly StaffSight[], id: string, stowed: boolean): StaffSight[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setSightStar(cards: readonly StaffSight[], id: string, flagged: boolean): StaffSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setSightFinish(cards: readonly StaffSight[], id: string, finish: unknown): StaffSight[] {
  const next = finishOf(finish);
  if (!next) return readSights(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Shade steps mist, ink, gilt, then mist again. A blank shade starts at mist. */
export function cycleShade(cards: readonly StaffSight[], id: string): StaffSight[] {
  return mapCard(cards, id, (card) => {
    const at = VANES.indexOf(card.vane as (typeof VANES)[number]);
    const next = at < 0 ? VANES[0] : VANES[(at + 1) % VANES.length];
    return next === card.vane ? card : { ...card, vane: next, audit: "vane" };
  });
}

export function addSightTag(cards: readonly StaffSight[], id: string, tag: string): StaffSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSights(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank height becomes 12, 12 becomes 24, and 24 becomes 48. A height of 48 stays. */
export function liftHeight(cards: readonly StaffSight[], id: string): StaffSight[] {
  return mapCard(cards, id, (card) => {
    if (card.angle === 48) return card;
    const next = card.angle === 24 ? 48 : card.angle === 12 ? 24 : 12;
    return { ...card, angle: next, audit: "angle" };
  });
}

/** A blank height becomes 48, 48 becomes 24, and 24 becomes 12. A height of 12 stays. */
export function dipHeight(cards: readonly StaffSight[], id: string): StaffSight[] {
  return mapCard(cards, id, (card) => {
    if (card.angle === 12) return card;
    const next = card.angle === 24 ? 12 : card.angle === 48 ? 24 : 48;
    return { ...card, angle: next, audit: "dip" };
  });
}

export function raiseBead(cards: readonly StaffSight[], id: string): StaffSight[] {
  return mapCard(cards, id, (card) => {
    const at = ringIndex(card.ring);
    if (at < 0) return { ...card, ring: 1, audit: "ring" };
    if (at === BEAD_CYCLE.length - 1) return card;
    return { ...card, ring: BEAD_CYCLE[at + 1], audit: "ring" };
  });
}

export function lowerBead(cards: readonly StaffSight[], id: string): StaffSight[] {
  return mapCard(cards, id, (card) => {
    const at = ringIndex(card.ring);
    if (at <= 0) return card;
    return { ...card, ring: BEAD_CYCLE[at - 1], audit: "ring" };
  });
}

export function bulkSightMark(cards: readonly StaffSight[], ids: readonly string[]): StaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, sighted: true, audit: "sight" }));
}

export function bulkSightStow(cards: readonly StaffSight[], ids: readonly string[]): StaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkSightGilt(cards: readonly StaffSight[], ids: readonly string[]): StaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, vane: "gilt", audit: "vane" }));
}

export function bulkSightChampagne(cards: readonly StaffSight[], ids: readonly string[]): StaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkSightTag(cards: readonly StaffSight[], ids: readonly string[], tag: string): StaffSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSights(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly StaffSight[], ids: readonly string[], index: number, change: (list: readonly StaffSight[], id: string) => StaffSight[]): StaffSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readSights(cards);
}

export function liftHeightFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  return focused(cards, ids, index, liftHeight);
}

export function dipHeightFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  return focused(cards, ids, index, dipHeight);
}

export function toneFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  return focused(cards, ids, index, cycleShade);
}

export function raiseBeadFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  return focused(cards, ids, index, raiseBead);
}

export function lowerBeadFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  return focused(cards, ids, index, lowerBead);
}

export function markSightFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  const id = ids[index];
  if (!id) return readSights(cards);
  const card = readSights(cards).find((item) => item.id === id);
  return card ? setSightMarked(cards, id, !card.sighted) : readSights(cards);
}

export function lockSightFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  const id = ids[index];
  if (!id) return readSights(cards);
  const card = readSights(cards).find((item) => item.id === id);
  return card ? setSightLock(cards, id, !card.locked) : readSights(cards);
}

export function starSightFocused(cards: readonly StaffSight[], ids: readonly string[], index: number): StaffSight[] {
  const id = ids[index];
  if (!id) return readSights(cards);
  const card = readSights(cards).find((item) => item.id === id);
  return card ? setSightStar(cards, id, !card.flagged) : readSights(cards);
}

export function tagSightFocused(cards: readonly StaffSight[], ids: readonly string[], index: number, tag: string): StaffSight[] {
  const id = ids[index];
  return id ? addSightTag(cards, id, tag) : readSights(cards);
}

export function readSightViews(raw: unknown): StaffView[] {
  if (!Array.isArray(raw)) return [];
  const out: StaffView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StaffView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      helmsman: clip(row.helmsman, 24),
      finish: activeFinish(row.finish),
      vane: activeShade(row.vane, VANES),
      station: activeReach(row.station),
      angle: activeHeight(row.angle),
      ring: activeBead(row.ring),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSightView(
  views: readonly StaffView[],
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
): StaffView[] {
  const current = readSightViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: StaffView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    helmsman: clip(view.helmsman, 24),
    finish: activeFinish(view.finish),
    vane: activeShade(view.vane, VANES),
    station: activeReach(view.station),
    angle: activeHeight(view.angle),
    ring: activeBead(view.ring),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSightView(views: readonly StaffView[], id: string): StaffView[] {
  return readSightViews(views).filter((view) => view.id !== id);
}

export function sightDensity(raw: unknown): StaffDensity {
  return raw === "close" ? "close" : "open";
}

/** A sight more than one reach behind the desk, at cross 1, is late. */
export function lateSight(card: StaffSight, deskStation: unknown): boolean {
  const gap = reachGap(card.station, deskStation);
  return card.ring === 1 && gap !== null && gap > 1;
}

export function idleSight(card: StaffSight): boolean {
  return card.vane === "mist" && stillReach(card.station) && card.ring === 1;
}

export function briskSight(card: StaffSight): boolean {
  return card.ring === 9 && card.vane === "gilt" && keenReach(card.station);
}

export function restingSight(card: StaffSight): boolean {
  return card.angle === 48 && card.vane === "ink" && card.station === "stern";
}

/** A height of twelve on a keen reach is overdue unless the sight is marked. */
export function overdueSight(card: StaffSight): boolean {
  return card.angle === 12 && keenReach(card.station) && !card.sighted;
}

export function visibleSights(
  cards: readonly StaffSight[],
  tray: StaffTray,
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
): StaffSight[] {
  const text = query.trim().toLowerCase();
  const helmOn = helmsman === "all" ? "" : helmsman.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const vaneOn = vane === "all" ? "" : shadeOf(vane);
  const stationOn = station === "all" ? "" : activeReach(station);
  const angleOn = angle === "all" ? "" : activeHeight(angle);
  const ringOn = ring === "all" ? "" : activeBead(ring);
  return readSights(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (helmOn && card.helmsman.toLowerCase() !== helmOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (vaneOn && card.vane !== vaneOn) return false;
    if (stationOn === "keen" && !keenReach(card.station)) return false;
    if (stationOn === "still" && !stillReach(card.station)) return false;
    if (stationOn && stationOn !== "keen" && stationOn !== "still" && card.station !== stationOn) return false;
    if (angleOn && String(card.angle ?? "") !== angleOn) return false;
    if (ringOn && String(card.ring) !== ringOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenReach(card.station)) return false;
    if (stillOnly && !stillReach(card.station)) return false;
    return true;
  });
}

export function sortSights(cards: readonly StaffSight[], sort: StaffSort): StaffSight[] {
  return cards.slice().sort((a, b) => {
    if (a.sighted !== b.sighted) return a.sighted ? -1 : 1;
    if (sort === "keeper") {
      const helm = a.helmsman.localeCompare(b.helmsman);
      if (helm) return helm;
    }
    const station = (reachIndex(a.station) < 0 ? 99 : reachIndex(a.station)) - (reachIndex(b.station) < 0 ? 99 : reachIndex(b.station));
    if (station) return station;
    return a.title.localeCompare(b.title);
  });
}

export function sightCounts(cards: readonly StaffSight[], shown: readonly StaffSight[], deskStation: unknown): StaffCounts {
  const open = cards.filter((card) => inTray(card, "rail"));
  return {
    rail: open.length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    hold: cards.filter((card) => inTray(card, "hold")).length,
    sighted: open.filter((card) => card.sighted).length,
    keen: open.filter((card) => keenReach(card.station)).length,
    still: open.filter((card) => stillReach(card.station)).length,
    soon: open.filter((card) => card.angle === 10).length,
    ring: open.reduce((sum, card) => sum + card.ring, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    angle: open.filter((card) => card.angle !== null).length,
    matched: shown.filter((card) => card.station && card.station === reachOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleSight(card)).length,
    brisk: open.filter((card) => briskSight(card)).length,
    resting: open.filter((card) => restingSight(card)).length,
    overdue: open.filter((card) => overdueSight(card)).length,
  };
}

export function clashReachCount(cards: readonly StaffSight[]): number {
  const open = cards.filter((card) => inTray(card, "rail") && card.station);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.station === card.station && other.ring === card.ring)).length;
}

export function neighborSightCount(cards: readonly StaffSight[]): number {
  const open = cards.filter((card) => inTray(card, "rail") && ringIndex(card.ring) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(ringIndex(other.ring) - ringIndex(card.ring));
    const ring = Math.min(gap, BEAD_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly StaffSight[]): string {
  const open = cards.filter((card) => inTray(card, "rail") && card.helmsman);
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

export function reminderSights(cards: readonly StaffSight[]): StaffSight[] {
  return cards.filter((card) => inTray(card, "rail") && (card.angle === 12 || card.angle === 24));
}

export function idleSights(cards: readonly StaffSight[]): StaffSight[] {
  return cards.filter((card) => inTray(card, "rail") && idleSight(card));
}

export function sightTimeline(cards: readonly StaffSight[]): { ring: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "rail"));
  return BEAD_CYCLE.map((ring) => ({ ring, titles: open.filter((card) => card.ring === ring).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function sightBars(cards: readonly StaffSight[]): { station: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "rail"));
  return STAFF_REACHES.map((station) => ({ station, count: open.filter((card) => card.station === station).length }));
}

export function sightKeepers(cards: readonly StaffSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helmsman || out.some((item) => item.toLowerCase() === card.helmsman.toLowerCase())) continue;
    out.push(card.helmsman);
  }
  return out;
}

export function sightCopy(card: StaffSight): string {
  return [card.title, card.helmsman, card.station, card.finish, card.vane, card.angle ?? "", card.ring, card.note].filter((item) => item !== "").join(" · ");
}

export function sightCsv(cards: readonly StaffSight[], deskStation: unknown): string {
  const lines = ["title,helmsman,station,finish,vane,angle,ring,tags,sighted,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readSights(cards)) {
    const gap = reachGap(card.station, deskStation);
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
      lateSight(card, deskStation) ? "1" : "0",
      idleSight(card) ? "1" : "0",
      keenReach(card.station) ? "1" : "0",
      stillReach(card.station) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      reachBand(card.station),
      briskSight(card) ? "1" : "0",
      restingSight(card) ? "1" : "0",
      overdueSight(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function serverRecord(raw: ServerValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: ServerValue): boolean {
  const row = serverRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type ServerParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number; digit: boolean };

function serverText(raw: ServerValue): string {
  if (hasBlocked(raw)) return "";
  const row = serverRecord(raw);
  if (row && !("tradingServer" in row) && !("code" in row)) return "";
  return row ? clip(row.tradingServer ?? row.code, 32) : clip(raw, 32);
}

function serverParts(raw: ServerValue): ServerParts | null {
  const text = serverText(raw);
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

/** A blocked money field clears the plate. A real trading server is set. A blank or broken name is clear. */
export function serverState(raw: ServerValue): ServerState {
  if (hasBlocked(raw)) return "";
  const row = serverRecord(raw);
  if (row && !("tradingServer" in row) && !("code" in row)) return "";
  return serverParts(raw) ? "set" : "clear";
}

/** LIVE is a beacon, DEMO is a lantern, a known name is a house, and a separator or a digit is a buoy. */
export function serverLane(raw: ServerValue): ServerLane {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "live" || key.startsWith("real")) return "beacon";
  if (key === "demo" || key.includes("test")) return "lantern";
  if (KNOWN.has(key)) return "house";
  if (parts.seps >= 1 || parts.digit) return "buoy";
  return "road";
}

/** The first three letters. */
export function serverStamp(raw: ServerValue): string {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return parts ? parts.letters.slice(0, 3).toUpperCase() : "";
}

/** A beacon is champagne. A lantern is graphite. A buoy is ivory. A house follows its first letter. */
export function serverHue(raw: ServerValue): ServerHue {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  if (!parts) return "";
  const lane = serverLane(raw);
  if (lane === "beacon") return "champagne";
  if (lane === "lantern") return "graphite";
  if (lane === "buoy") return "ivory";
  if (lane === "house") return parts.letters[0].toUpperCase() === "M" ? "champagne" : "ivory";
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function serverTwin(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function serverWide(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function serverNotch(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function serverEcho(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function serverLeap(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function serverSlash(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function serverKnown(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function serverCap(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function serverTail(raw: ServerValue): boolean {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function serverStep(raw: ServerValue): number {
  const parts = serverState(raw) === "set" ? serverParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function serverLanes(rows: readonly ServerRow[]): ServerLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = serverLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingServer(rows: readonly ServerRow[]): string {
  const bars = serverLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingServerHue(rows: readonly ServerRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = serverHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedServerCount(rows: readonly ServerRow[]): number {
  const marks = rows.map((row) => serverStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneServerCount(rows: readonly ServerRow[], lane: ServerLane): number {
  return rows.filter((row) => serverLane(row.note) === lane).length;
}

export function serverShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentServerLanes(rows: readonly ServerRow[]): string[] {
  return serverLanes(rows).map((line) => line.lane);
}

export function readHiddenServers(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedServers(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleServer(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleServerReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkServerReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleServerLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleServers(
  rows: readonly ServerRow[],
  lane: string,
  hue: string,
  query: string,
  review: ServerReview,
  reviewed: readonly string[],
  shape: ServerShape,
): ServerRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (serverState(row.note) === "") return false;
    const found = serverLane(row.note);
    const hueName = serverHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${serverText(row.note)} ${serverStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "beacon" && found !== "beacon") return false;
    if (shape === "lantern" && found !== "lantern") return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "buoy" && found !== "buoy") return false;
    if (shape === "channel" && found !== "channel") return false;
    if (shape === "road" && found !== "road") return false;
    if (shape === "wide" && !serverWide(row.note)) return false;
    if (shape === "notch" && !serverNotch(row.note)) return false;
    if (shape === "leap" && !serverLeap(row.note)) return false;
    if (shape === "slash" && !serverSlash(row.note)) return false;
    if (shape === "twin" && !serverTwin(row.note)) return false;
    if (shape === "known" && !serverKnown(row.note)) return false;
    if (shape === "echo" && !serverEcho(row.note)) return false;
    return true;
  });
}

export function serverCopy(raw: ServerValue): string {
  return [serverStamp(raw), serverLane(raw), serverHue(raw)].filter(Boolean).join(" ");
}

export function serverLanesCsv(rows: readonly ServerRow[]): string {
  const lines = ["lane,count"];
  for (const line of serverLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function serverRowsCsv(rows: readonly ServerRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (serverState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(serverText(row.note)),
      serverStamp(row.note),
      serverLane(row.note),
      serverHue(row.note),
      String(serverStep(row.note)),
      serverEcho(row.note) ? "1" : "0",
      serverWide(row.note) ? "1" : "0",
      serverNotch(row.note) ? "1" : "0",
      serverLeap(row.note) ? "1" : "0",
      serverSlash(row.note) ? "1" : "0",
      serverTwin(row.note) ? "1" : "0",
      serverKnown(row.note) ? "1" : "0",
      serverCap(row.note) ? "1" : "0",
      serverTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
