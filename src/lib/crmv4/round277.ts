/**
 * Fog bells for a watch book kept in this browser, and quay plates read the country already stored on the account.
 * Watches are lee, luff, reach, and run. Tones are glass, cloth, and brass.
 * Pitches are 10, 30, or 60. Beads are 2, 4, 6, or 8.
 * TR is a quay, DE is a wharf, GB is a mole, and AE is a pier.
 * A separator or a digit is a channel. Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_fog_bell (
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
 * CREATE TABLE crm_quay_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_quay_review (
 *   trader_id text primary key
 * );
 */

export const FGL_KEY = "crmv4-fog-bell";
export const FGL_VIEW_KEY = "crmv4-fog-views";
export const FGL_DENSITY_KEY = "crmv4-fog-density";
export const QPL_KEY = "crmv4-quay-hide";
export const QPL_REVIEW_KEY = "crmv4-quay-review";

export const FOG_WATCHES = ["lee", "luff", "reach", "run"] as const;

export type FogWatch = (typeof FOG_WATCHES)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type VaneName = "blank" | "glass" | "cloth" | "brass";

export type BellTray = "deck" | "berth" | "locker";

export type BellDensity = "open" | "close";

export type BellSort = "watch" | "ringer";

export type FogBell = {
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

export type BellView = {
  id: string;
  name: string;
  tray: BellTray;
  query: string;
  helmsman: string;
  finish: string;
  vane: string;
  station: string;
  angle: string;
  ring: string;
};

export type BellCounts = {
  deck: number;
  berth: number;
  locker: number;
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

export type QuayLane = "" | "quay" | "wharf" | "mole" | "pier" | "channel" | "roadstead";

export type QuayHue = "" | "ivory" | "graphite" | "champagne";

export type QuayState = "" | "clear" | "set";

export type QuayShape = "all" | "quay" | "wharf" | "mole" | "pier" | "channel" | "roadstead" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type QuayReview = "all" | "reviewed" | "fresh";

export type QuayValue = string | { country?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type QuayRow = { id: string; label: string; note: QuayValue };

export type QuayLaneLine = { lane: string; count: number };

export const ROUND277_FEATURES = [
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
  "fair-ringer",
  "viewer",
  "suggest",
  "sla",
  "quay",
  "quay-csv",
] as const;

const AUDITS = ["save", "edit", "note", "vane", "sight", "unsight", "lock", "resume", "stow", "open", "finish", "tag", "ring", "angle", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const VANES = ["glass", "cloth", "brass"] as const;

const ANGLE_CYCLE = [10, 30, 60] as const;

const BEAD_CYCLE = [2, 4, 6, 8] as const;

const KEEN = new Set(["reach", "run"]);

const STILL = new Set(["lee", "luff"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const DAWN = new Set(["lee"]);

const LANE_ORDER = ["quay", "wharf", "mole", "pier", "channel", "roadstead"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["tr", "de", "gb", "ae", "us", "cy"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BellTray {
  return raw === "berth" || raw === "locker" ? raw : "deck";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function toneName(raw: unknown): Exclude<VaneName, "blank"> | "" {
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

function inTray(card: FogBell, tray: BellTray): boolean {
  if (tray === "berth") return card.locked && !card.stowed;
  if (tray === "locker") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(station: string): number {
  return FOG_WATCHES.indexOf(station as FogWatch);
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

export function watchOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (FOG_WATCHES as readonly string[]).includes(text) ? text : "";
}

/** Pitch is 10, 30, or 60. Anything else stays blank. */
export function fogPitch(raw: unknown): 10 | 30 | 60 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (ANGLE_CYCLE as readonly number[]).includes(value) ? (value as 10 | 30 | 60) : null;
}

/** Bead is 2, 4, 6, or 8. Anything else stays blank. */
export function fogBead(raw: unknown): 2 | 4 | 6 | 8 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (BEAD_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function glazeOf(raw: unknown): string {
  const text = glazeName(raw);
  return text ? text.toUpperCase() : "";
}

/** Vane is plain, shaded, or mirrored. A blank vane stays blank. */
export function toneOf(raw: unknown): string {
  return toneName(raw);
}

export function keenWatch(station: unknown): boolean {
  return KEEN.has(clip(station, 12).toLowerCase());
}

export function stillWatch(station: unknown): boolean {
  return STILL.has(clip(station, 12).toLowerCase());
}

/** Dawn is the lee. Noon is the luff. Dusk is the reach. Night is the run. */
export function watchBand(station: unknown): string {
  const text = watchOf(station);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "luff") return "noon";
  if (text === "reach") return "dusk";
  return "night";
}

/** Signed distance from one station to the desk station. */
export function watchGap(from: unknown, to: unknown): number | null {
  const left = watchIndex(watchOf(from));
  const right = watchIndex(watchOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseGlaze(finish: unknown): boolean {
  return HOUSE.has(glazeOf(finish));
}

export function activeWatch(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return watchOf(text) || "all";
}

export function activePitch(raw: unknown): string {
  const angle = fogPitch(raw);
  return angle === null ? "all" : String(angle);
}

export function activeTone(raw: unknown, allow: readonly string[]): string {
  const text = toneOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const ring = fogBead(raw);
  return ring === null ? "all" : String(ring);
}

export function activeGlaze(raw: unknown): string {
  const text = glazeName(raw);
  return text || "all";
}

export function moveBellFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGlaze(cards: readonly FogBell[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || !card.finish) continue;
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
export function suggestPitch(cards: readonly FogBell[], hour: number): 10 | 30 | 60 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || card.angle === null) continue;
    counts.set(card.angle, (counts.get(card.angle) || 0) + 1);
  }
  let best: 10 | 30 | 60 | null = null;
  let score = 0;
  for (const angle of ANGLE_CYCLE) {
    const count = counts.get(angle) || 0;
    if (count > score) {
      best = angle;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 6) return 10;
  if (hour < 14) return 30;
  return 60;
}

/** Before eight, suggest the lee. The rest of the day suggests the reach. */
export function suggestWatch(hour: number): FogWatch {
  return hour < 8 ? "lee" : "reach";
}

/** The helmsman with the fewest unsighted bridge bearings. A tie keeps the roster order. */
export function fairRinger(cards: readonly FogBell[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "deck") && !card.sighted);
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

export function readBells(raw: unknown): FogBell[] {
  if (!Array.isArray(raw)) return [];
  const out: FogBell[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FogBell>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      helmsman: clip(row.helmsman, 24),
      station: watchOf(row.station),
      angle: fogPitch(row.angle),
      finish: glazeOf(row.finish),
      vane: toneOf(row.vane),
      ring: fogBead(row.ring) ?? 2,
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

export function addBell(
  cards: readonly FogBell[],
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
): FogBell[] {
  const current = readBells(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: FogBell = {
    id,
    title,
    note: noteOf(card.note),
    helmsman: clip(card.helmsman, 24),
    station: watchOf(card.station),
    angle: fogPitch(card.angle),
    finish: glazeOf(card.finish),
    vane: toneOf(card.vane),
    ring: fogBead(card.ring) ?? 2,
    tags: tagsOf(card.tags),
    sighted: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly FogBell[], id: string, change: (card: FogBell) => FogBell): FogBell[] {
  return readBells(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly FogBell[], ids: readonly string[], change: (card: FogBell) => FogBell): FogBell[] {
  const picked = new Set(ids);
  return readBells(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editBell(cards: readonly FogBell[], id: string, title: string): FogBell[] {
  const next = lineOf(title);
  if (!next) return readBells(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBellNote(cards: readonly FogBell[], id: string, note: string): FogBell[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setBellRung(cards: readonly FogBell[], id: string, sighted: boolean): FogBell[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "sight" : "unsight" }));
}

export function setBellLock(cards: readonly FogBell[], id: string, locked: boolean): FogBell[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setBellStow(cards: readonly FogBell[], id: string, stowed: boolean): FogBell[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setBellStar(cards: readonly FogBell[], id: string, flagged: boolean): FogBell[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setBellGlaze(cards: readonly FogBell[], id: string, finish: unknown): FogBell[] {
  const next = glazeOf(finish);
  if (!next) return readBells(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Tone steps glass, cloth, brass, then glass again. A blank tone starts at glass. */
export function cycleTone(cards: readonly FogBell[], id: string): FogBell[] {
  return mapCard(cards, id, (card) => {
    const at = VANES.indexOf(card.vane as (typeof VANES)[number]);
    const next = at < 0 ? VANES[0] : VANES[(at + 1) % VANES.length];
    return next === card.vane ? card : { ...card, vane: next, audit: "vane" };
  });
}

export function addBellTag(cards: readonly FogBell[], id: string, tag: string): FogBell[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBells(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank pitch becomes 10, 10 becomes 30, and 30 becomes 60. A pitch of 60 stays. */
export function liftPitch(cards: readonly FogBell[], id: string): FogBell[] {
  return mapCard(cards, id, (card) => {
    if (card.angle === 60) return card;
    const next = card.angle === 30 ? 60 : card.angle === 10 ? 30 : 10;
    return { ...card, angle: next, audit: "angle" };
  });
}

/** A blank pitch becomes 60, 60 becomes 30, and 30 becomes 10. A pitch of 10 stays. */
export function dipPitch(cards: readonly FogBell[], id: string): FogBell[] {
  return mapCard(cards, id, (card) => {
    if (card.angle === 10) return card;
    const next = card.angle === 30 ? 10 : card.angle === 60 ? 30 : 60;
    return { ...card, angle: next, audit: "dip" };
  });
}

export function raiseBead(cards: readonly FogBell[], id: string): FogBell[] {
  return mapCard(cards, id, (card) => {
    const at = ringIndex(card.ring);
    if (at < 0) return { ...card, ring: 2, audit: "ring" };
    if (at === BEAD_CYCLE.length - 1) return card;
    return { ...card, ring: BEAD_CYCLE[at + 1], audit: "ring" };
  });
}

export function lowerBead(cards: readonly FogBell[], id: string): FogBell[] {
  return mapCard(cards, id, (card) => {
    const at = ringIndex(card.ring);
    if (at <= 0) return card;
    return { ...card, ring: BEAD_CYCLE[at - 1], audit: "ring" };
  });
}

export function bulkBellRing(cards: readonly FogBell[], ids: readonly string[]): FogBell[] {
  return touchIds(cards, ids, (card) => ({ ...card, sighted: true, audit: "sight" }));
}

export function bulkBellStow(cards: readonly FogBell[], ids: readonly string[]): FogBell[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkBellBrass(cards: readonly FogBell[], ids: readonly string[]): FogBell[] {
  return touchIds(cards, ids, (card) => ({ ...card, vane: "brass", audit: "vane" }));
}

export function bulkBellChampagne(cards: readonly FogBell[], ids: readonly string[]): FogBell[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkBellTag(cards: readonly FogBell[], ids: readonly string[], tag: string): FogBell[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBells(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly FogBell[], ids: readonly string[], index: number, change: (list: readonly FogBell[], id: string) => FogBell[]): FogBell[] {
  const id = ids[index];
  return id ? change(cards, id) : readBells(cards);
}

export function liftPitchFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  return focused(cards, ids, index, liftPitch);
}

export function dipPitchFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  return focused(cards, ids, index, dipPitch);
}

export function toneFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  return focused(cards, ids, index, cycleTone);
}

export function raiseBeadFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  return focused(cards, ids, index, raiseBead);
}

export function lowerBeadFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  return focused(cards, ids, index, lowerBead);
}

export function ringBellFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  const id = ids[index];
  if (!id) return readBells(cards);
  const card = readBells(cards).find((item) => item.id === id);
  return card ? setBellRung(cards, id, !card.sighted) : readBells(cards);
}

export function lockBellFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  const id = ids[index];
  if (!id) return readBells(cards);
  const card = readBells(cards).find((item) => item.id === id);
  return card ? setBellLock(cards, id, !card.locked) : readBells(cards);
}

export function starBellFocused(cards: readonly FogBell[], ids: readonly string[], index: number): FogBell[] {
  const id = ids[index];
  if (!id) return readBells(cards);
  const card = readBells(cards).find((item) => item.id === id);
  return card ? setBellStar(cards, id, !card.flagged) : readBells(cards);
}

export function tagBellFocused(cards: readonly FogBell[], ids: readonly string[], index: number, tag: string): FogBell[] {
  const id = ids[index];
  return id ? addBellTag(cards, id, tag) : readBells(cards);
}

export function readBellViews(raw: unknown): BellView[] {
  if (!Array.isArray(raw)) return [];
  const out: BellView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BellView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      helmsman: clip(row.helmsman, 24),
      finish: activeGlaze(row.finish),
      vane: activeTone(row.vane, VANES),
      station: activeWatch(row.station),
      angle: activePitch(row.angle),
      ring: activeBead(row.ring),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBellView(
  views: readonly BellView[],
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
): BellView[] {
  const current = readBellViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BellView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    helmsman: clip(view.helmsman, 24),
    finish: activeGlaze(view.finish),
    vane: activeTone(view.vane, VANES),
    station: activeWatch(view.station),
    angle: activePitch(view.angle),
    ring: activeBead(view.ring),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBellView(views: readonly BellView[], id: string): BellView[] {
  return readBellViews(views).filter((view) => view.id !== id);
}

export function bellDensity(raw: unknown): BellDensity {
  return raw === "close" ? "close" : "open";
}

/** A bell more than one watch behind the desk, at bead 2, is late. */
export function lateBell(card: FogBell, deskStation: unknown): boolean {
  const gap = watchGap(card.station, deskStation);
  return card.ring === 2 && gap !== null && gap > 1;
}

export function idleBell(card: FogBell): boolean {
  return card.vane === "glass" && stillWatch(card.station) && card.ring === 2;
}

export function briskBell(card: FogBell): boolean {
  return card.ring === 8 && card.vane === "brass" && keenWatch(card.station);
}

export function restingBell(card: FogBell): boolean {
  return card.angle === 60 && card.vane === "cloth" && card.station === "run";
}

/** A pitch of ten on a keen watch is overdue unless the bell is rung. */
export function overdueBell(card: FogBell): boolean {
  return card.angle === 10 && keenWatch(card.station) && !card.sighted;
}

export function visibleBells(
  cards: readonly FogBell[],
  tray: BellTray,
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
): FogBell[] {
  const text = query.trim().toLowerCase();
  const helmOn = helmsman === "all" ? "" : helmsman.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : glazeOf(finish);
  const vaneOn = vane === "all" ? "" : toneOf(vane);
  const stationOn = station === "all" ? "" : activeWatch(station);
  const angleOn = angle === "all" ? "" : activePitch(angle);
  const ringOn = ring === "all" ? "" : activeBead(ring);
  return readBells(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (helmOn && card.helmsman.toLowerCase() !== helmOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (vaneOn && card.vane !== vaneOn) return false;
    if (stationOn === "keen" && !keenWatch(card.station)) return false;
    if (stationOn === "still" && !stillWatch(card.station)) return false;
    if (stationOn && stationOn !== "keen" && stationOn !== "still" && card.station !== stationOn) return false;
    if (angleOn && String(card.angle ?? "") !== angleOn) return false;
    if (ringOn && String(card.ring) !== ringOn) return false;
    if (houseOnly && !houseGlaze(card.finish)) return false;
    if (keenOnly && !keenWatch(card.station)) return false;
    if (stillOnly && !stillWatch(card.station)) return false;
    return true;
  });
}

export function sortBells(cards: readonly FogBell[], sort: BellSort): FogBell[] {
  return cards.slice().sort((a, b) => {
    if (a.sighted !== b.sighted) return a.sighted ? -1 : 1;
    if (sort === "ringer") {
      const helm = a.helmsman.localeCompare(b.helmsman);
      if (helm) return helm;
    }
    const station = (watchIndex(a.station) < 0 ? 99 : watchIndex(a.station)) - (watchIndex(b.station) < 0 ? 99 : watchIndex(b.station));
    if (station) return station;
    return a.title.localeCompare(b.title);
  });
}

export function bellCounts(cards: readonly FogBell[], shown: readonly FogBell[], deskStation: unknown): BellCounts {
  const open = cards.filter((card) => inTray(card, "deck"));
  return {
    deck: open.length,
    berth: cards.filter((card) => inTray(card, "berth")).length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    sighted: open.filter((card) => card.sighted).length,
    keen: open.filter((card) => keenWatch(card.station)).length,
    still: open.filter((card) => stillWatch(card.station)).length,
    soon: open.filter((card) => card.angle === 10).length,
    ring: open.reduce((sum, card) => sum + card.ring, 0),
    house: open.filter((card) => houseGlaze(card.finish)).length,
    angle: open.filter((card) => card.angle !== null).length,
    matched: shown.filter((card) => card.station && card.station === watchOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleBell(card)).length,
    brisk: open.filter((card) => briskBell(card)).length,
    resting: open.filter((card) => restingBell(card)).length,
    overdue: open.filter((card) => overdueBell(card)).length,
  };
}

export function clashWatchCount(cards: readonly FogBell[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && card.station);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.station === card.station && other.ring === card.ring)).length;
}

export function neighborBellCount(cards: readonly FogBell[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && ringIndex(card.ring) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(ringIndex(other.ring) - ringIndex(card.ring));
    const ring = Math.min(gap, BEAD_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestRinger(cards: readonly FogBell[]): string {
  const open = cards.filter((card) => inTray(card, "deck") && card.helmsman);
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

export function reminderBells(cards: readonly FogBell[]): FogBell[] {
  return cards.filter((card) => inTray(card, "deck") && (card.angle === 10 || card.angle === 30));
}

export function idleBells(cards: readonly FogBell[]): FogBell[] {
  return cards.filter((card) => inTray(card, "deck") && idleBell(card));
}

export function bellTimeline(cards: readonly FogBell[]): { ring: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return BEAD_CYCLE.map((ring) => ({ ring, titles: open.filter((card) => card.ring === ring).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function bellBars(cards: readonly FogBell[]): { station: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return FOG_WATCHES.map((station) => ({ station, count: open.filter((card) => card.station === station).length }));
}

export function bellRingers(cards: readonly FogBell[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helmsman || out.some((item) => item.toLowerCase() === card.helmsman.toLowerCase())) continue;
    out.push(card.helmsman);
  }
  return out;
}

export function bellCopy(card: FogBell): string {
  return [card.title, card.helmsman, card.station, card.finish, card.vane, card.angle ?? "", card.ring, card.note].filter((item) => item !== "").join(" · ");
}

export function bellCsv(cards: readonly FogBell[], deskStation: unknown): string {
  const lines = ["title,helmsman,station,finish,vane,angle,ring,tags,sighted,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readBells(cards)) {
    const gap = watchGap(card.station, deskStation);
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
      lateBell(card, deskStation) ? "1" : "0",
      idleBell(card) ? "1" : "0",
      keenWatch(card.station) ? "1" : "0",
      stillWatch(card.station) ? "1" : "0",
      houseGlaze(card.finish) ? "1" : "0",
      watchBand(card.station),
      briskBell(card) ? "1" : "0",
      restingBell(card) ? "1" : "0",
      overdueBell(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function quayRecord(raw: QuayValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: QuayValue): boolean {
  const row = quayRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type QuayParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number; digit: boolean };

function quayText(raw: QuayValue): string {
  if (hasBlocked(raw)) return "";
  const row = quayRecord(raw);
  if (row && !("country" in row) && !("code" in row)) return "";
  return row ? clip(row.country ?? row.code, 32) : clip(raw, 32);
}

function quayParts(raw: QuayValue): QuayParts | null {
  const text = quayText(raw);
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

/** A blocked money field clears the plate. A real country code is set. A blank or broken code is clear. */
export function quayState(raw: QuayValue): QuayState {
  if (hasBlocked(raw)) return "";
  const row = quayRecord(raw);
  if (row && !("country" in row) && !("code" in row)) return "";
  return quayParts(raw) ? "set" : "clear";
}

/** TR is a quay, DE is a wharf, GB is a mole, AE is a pier, and a separator or a digit is a channel. */
export function quayLane(raw: QuayValue): QuayLane {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "tr") return "quay";
  if (key === "de") return "wharf";
  if (key === "gb") return "mole";
  if (key.startsWith("ae")) return "pier";
  if (parts.seps >= 1 || parts.digit) return "channel";
  return "roadstead";
}

/** The first three letters. */
export function quayStamp(raw: QuayValue): string {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return parts ? parts.letters.slice(0, 3).toUpperCase() : "";
}

/** AE is champagne. TR and a channel are graphite. DE and GB are ivory. Other codes follow the first letter. */
export function quayHue(raw: QuayValue): QuayHue {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  if (!parts) return "";
  const lane = quayLane(raw);
  if (lane === "pier") return "champagne";
  if (lane === "quay" || lane === "channel") return "graphite";
  if (lane === "wharf" || lane === "mole") return "ivory";
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function quayTwin(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function quayWide(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function quayNotch(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function quayEcho(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function quayLeap(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function quaySlash(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function quayKnown(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function quayCap(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function quayTail(raw: QuayValue): boolean {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function quayStep(raw: QuayValue): number {
  const parts = quayState(raw) === "set" ? quayParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function quayLanes(rows: readonly QuayRow[]): QuayLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = quayLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingQuay(rows: readonly QuayRow[]): string {
  const bars = quayLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingQuayHue(rows: readonly QuayRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = quayHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedQuayCount(rows: readonly QuayRow[]): number {
  const marks = rows.map((row) => quayStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneQuayCount(rows: readonly QuayRow[], lane: QuayLane): number {
  return rows.filter((row) => quayLane(row.note) === lane).length;
}

export function quayShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentQuayLanes(rows: readonly QuayRow[]): string[] {
  return quayLanes(rows).map((line) => line.lane);
}

export function readHiddenQuays(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedQuays(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleQuay(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleQuayReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkQuayReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleQuayLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleQuays(
  rows: readonly QuayRow[],
  lane: string,
  hue: string,
  query: string,
  review: QuayReview,
  reviewed: readonly string[],
  shape: QuayShape,
): QuayRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (quayState(row.note) === "") return false;
    const found = quayLane(row.note);
    const hueName = quayHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${quayText(row.note)} ${quayStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "quay" && found !== "quay") return false;
    if (shape === "wharf" && found !== "wharf") return false;
    if (shape === "mole" && found !== "mole") return false;
    if (shape === "pier" && found !== "pier") return false;
    if (shape === "channel" && found !== "channel") return false;
    if (shape === "roadstead" && found !== "roadstead") return false;
    if (shape === "wide" && !quayWide(row.note)) return false;
    if (shape === "notch" && !quayNotch(row.note)) return false;
    if (shape === "leap" && !quayLeap(row.note)) return false;
    if (shape === "slash" && !quaySlash(row.note)) return false;
    if (shape === "twin" && !quayTwin(row.note)) return false;
    if (shape === "known" && !quayKnown(row.note)) return false;
    if (shape === "echo" && !quayEcho(row.note)) return false;
    return true;
  });
}

export function quayCopy(raw: QuayValue): string {
  return [quayStamp(raw), quayLane(raw), quayHue(raw)].filter(Boolean).join(" ");
}

export function quayLanesCsv(rows: readonly QuayRow[]): string {
  const lines = ["lane,count"];
  for (const line of quayLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function quayRowsCsv(rows: readonly QuayRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (quayState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(quayText(row.note)),
      quayStamp(row.note),
      quayLane(row.note),
      quayHue(row.note),
      String(quayStep(row.note)),
      quayEcho(row.note) ? "1" : "0",
      quayWide(row.note) ? "1" : "0",
      quayNotch(row.note) ? "1" : "0",
      quayLeap(row.note) ? "1" : "0",
      quaySlash(row.note) ? "1" : "0",
      quayTwin(row.note) ? "1" : "0",
      quayKnown(row.note) ? "1" : "0",
      quayCap(row.note) ? "1" : "0",
      quayTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
