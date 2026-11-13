/**
 * Barometer tubes for a pressure follow-up book, and surname plates already stored as lastName.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_barometer_tube (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   limb text not null default '',
 *   ink text not null default '',
 *   motion text not null default '',
 *   span_min integer,
 *   mark_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_surname_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_surname_review (
 *   trader_id text primary key
 * );
 */


export const BMT_KEY = "crmv4-barometer-tube";
export const BMT_VIEW_KEY = "crmv4-barometer-views";
export const BMT_DENSITY_KEY = "crmv4-barometer-density";
export const SNM_KEY = "crmv4-surname-hide";
export const SNM_REVIEW_KEY = "crmv4-surname-review";

export const BAROMETER_LIMBS = ["stem", "bowl", "scale", "cistern"] as const;

export type BarometerLimb = (typeof BAROMETER_LIMBS)[number];

export type InkName = "blank" | "ivory" | "graphite" | "champagne";

export type MotionName = "blank" | "rise" | "still" | "fall";

export type BarometerTray = "open" | "pause" | "seal";

export type BarometerDensity = "roomy" | "close";

export type BarometerSort = "frame" | "weaver";

export type BarometerTube = {
  id: string;
  title: string;
  note: string;
  weaver: string;
  frame: string;
  wait: number | null;
  dye: string;
  shuttle: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type BarometerView = {
  id: string;
  name: string;
  tray: BarometerTray;
  query: string;
  weaver: string;
  dye: string;
  shuttle: string;
  frame: string;
  wait: string;
  rank: string;
};

export type BarometerCounts = {
  open: number;
  pause: number;
  seal: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rank: number;
  house: number;
  wait: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type SurnameLane = "" | "hall" | "porch" | "stair" | "gate";

export type SurnameHue = "" | "ivory" | "graphite" | "champagne";

export type SurnameState = "" | "clear" | "set";

export type SurnameShape = "all" | "hall" | "porch" | "stair" | "gate" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type SurnameReview = "all" | "reviewed" | "fresh";

export type SurnameValue = string | { lastName?: unknown; name?: unknown; [key: string]: unknown } | null | undefined;

export type SurnameRow = { id: string; label: string; note: SurnameValue };

export type SurnameLaneLine = { lane: string; count: number };

export const ROUND268_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "span",
  "seal",
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
  "surname",
  "surname-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shuttle", "pin", "unpin", "pause", "resume", "seal", "open", "dye", "tag", "rank", "wait", "short", "flag"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const SIGHTS = ["rise", "still", "fall"] as const;

const ALT_CYCLE = [12, 24, 48] as const;

const MAG_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["stem", "scale"]);

const QUIET = new Set(["bowl", "cistern"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const EARLY = new Set(["stem", "bowl"]);

const LANE_ORDER = ["hall", "porch", "stair", "gate"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["ross", "vale"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BarometerTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function motionName(raw: unknown): Exclude<MotionName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SIGHTS as readonly string[]).includes(text) ? (text as Exclude<MotionName, "blank">) : "";
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

function inTray(card: BarometerTube, tray: BarometerTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(frame: string): number {
  return BAROMETER_LIMBS.indexOf(frame as BarometerLimb);
}

function rankIndex(rank: number): number {
  return MAG_CYCLE.indexOf(rank as (typeof MAG_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function limbOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (BAROMETER_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** Span is 12, 24, or 48 minutes. Anything else stays blank. */
export function barometerSpan(raw: unknown): 12 | 24 | 48 | null {
  const value = Number(clip(raw, 2));
  return (ALT_CYCLE as readonly number[]).includes(value) ? (value as 12 | 24 | 48) : null;
}

/** Mark is 1, 3, 5, or 7. Anything else stays blank. */
export function barometerMark(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (MAG_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Ink is ivory, graphite, or champagne. The saved ink is IVORY, GRAPHITE, or CHAMPAGNE. */
export function inkOf(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

/** Motion is lift, hold, or set. A blank motion stays blank. */
export function motionOf(raw: unknown): string {
  return motionName(raw);
}

export function peakLimb(frame: unknown): boolean {
  return PEAK.has(clip(frame, 12).toLowerCase());
}

export function quietLimb(frame: unknown): boolean {
  return QUIET.has(clip(frame, 12).toLowerCase());
}

/** Early is stem and bowl. Mid is scale. Late is cistern. */
export function limbBand(frame: unknown): string {
  const text = limbOf(frame);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "scale") return "mid";
  return "late";
}

/** Signed distance from the slip frame to the desk frame. */
export function limbGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(limbOf(from));
  const right = limbIndex(limbOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(dye: unknown): boolean {
  return HOUSE.has(inkOf(dye));
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return limbOf(text) || "all";
}

export function activeBarometerSpan(raw: unknown): string {
  const wait = barometerSpan(raw);
  return wait === null ? "all" : String(wait);
}

export function activeMotion(raw: unknown, allow: readonly string[]): string {
  const text = motionOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBarometerMark(raw: unknown): string {
  const rank = barometerMark(raw);
  return rank === null ? "all" : String(rank);
}

export function activeInk(raw: unknown): string {
  const text = inkName(raw);
  return text || "all";
}

export function moveBarometerFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestInk(cards: readonly BarometerTube[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.dye) continue;
    counts.set(card.dye, (counts.get(card.dye) || 0) + 1);
  }
  let best = "IVORY";
  let score = 0;
  for (const dye of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(dye) || 0;
    if (count > score) {
      best = dye;
      score = count;
    }
  }
  return best;
}

/** A night watch asks for a short span. Morning asks for the middle one. Saved spans win when any exist. */
export function suggestBarometerSpan(cards: readonly BarometerTube[], hour: number): 12 | 24 | 48 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 12 | 24 | 48 | null = null;
  let score = 0;
  for (const wait of ALT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 12;
  if (hour < 12) return 24;
  return 48;
}

/** Before the watch opens, suggest the stem. The rest of the day suggests the scale. */
export function suggestLimb(hour: number): BarometerLimb {
  return hour < 6 ? "stem" : "scale";
}

/** The pilot with the fewest open unpinned sights. A tie keeps the roster order. */
export function fairBarometerKeeper(cards: readonly BarometerTube[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.weaver.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readTubes(raw: unknown): BarometerTube[] {
  if (!Array.isArray(raw)) return [];
  const out: BarometerTube[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BarometerTube>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      weaver: clip(row.weaver, 24),
      frame: limbOf(row.frame),
      wait: barometerSpan(row.wait),
      dye: inkOf(row.dye),
      shuttle: motionOf(row.shuttle),
      rank: barometerMark(row.rank) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      paused: row.paused === true,
      sealed: row.sealed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addBarometer(
  cards: readonly BarometerTube[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    weaver?: string;
    frame?: string;
    wait?: unknown;
    dye?: string;
    shuttle?: string;
    rank?: unknown;
    tags?: string;
  },
): BarometerTube[] {
  const current = readTubes(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: BarometerTube = {
    id,
    title,
    note: noteOf(card.note),
    weaver: clip(card.weaver, 24),
    frame: limbOf(card.frame),
    wait: barometerSpan(card.wait),
    dye: inkOf(card.dye),
    shuttle: motionOf(card.shuttle),
    rank: barometerMark(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly BarometerTube[], id: string, change: (card: BarometerTube) => BarometerTube): BarometerTube[] {
  return readTubes(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly BarometerTube[], ids: readonly string[], change: (card: BarometerTube) => BarometerTube): BarometerTube[] {
  const picked = new Set(ids);
  return readTubes(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editBarometer(cards: readonly BarometerTube[], id: string, title: string): BarometerTube[] {
  const next = lineOf(title);
  if (!next) return readTubes(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBarometerNote(cards: readonly BarometerTube[], id: string, note: string): BarometerTube[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setBarometerPin(cards: readonly BarometerTube[], id: string, pinned: boolean): BarometerTube[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setBarometerStay(cards: readonly BarometerTube[], id: string, paused: boolean): BarometerTube[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setBarometerStow(cards: readonly BarometerTube[], id: string, sealed: boolean): BarometerTube[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setBarometerStar(cards: readonly BarometerTube[], id: string, flagged: boolean): BarometerTube[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setBarometerInk(cards: readonly BarometerTube[], id: string, dye: unknown): BarometerTube[] {
  const next = inkOf(dye);
  if (!next) return readTubes(cards);
  return mapCard(cards, id, (card) => (card.dye === next ? card : { ...card, dye: next, audit: "dye" }));
}

/** Motion steps rise, still, fall, then rise again. A blank motion starts at rise. */
export function cycleMotion(cards: readonly BarometerTube[], id: string): BarometerTube[] {
  return mapCard(cards, id, (card) => {
    const at = SIGHTS.indexOf(card.shuttle as (typeof SIGHTS)[number]);
    const next = at < 0 ? SIGHTS[0] : SIGHTS[(at + 1) % SIGHTS.length];
    return next === card.shuttle ? card : { ...card, shuttle: next, audit: "shuttle" };
  });
}

export function addBarometerTag(cards: readonly BarometerTube[], id: string, tag: string): BarometerTube[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTubes(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 12, 12 becomes 24, and 24 becomes 48. A span of 48 stays. */
export function lengthenBarometer(cards: readonly BarometerTube[], id: string): BarometerTube[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 48) return card;
    const next = card.wait === 24 ? 48 : card.wait === 12 ? 24 : 12;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank span becomes 48, 48 becomes 24, and 24 becomes 12. A span of 12 stays. */
export function shortenBarometer(cards: readonly BarometerTube[], id: string): BarometerTube[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 12) return card;
    const next = card.wait === 24 ? 12 : card.wait === 48 ? 24 : 48;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseBarometer(cards: readonly BarometerTube[], id: string): BarometerTube[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 1, audit: "rank" };
    if (at === MAG_CYCLE.length - 1) return card;
    return { ...card, rank: MAG_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerBarometer(cards: readonly BarometerTube[], id: string): BarometerTube[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: MAG_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkBarometerPin(cards: readonly BarometerTube[], ids: readonly string[]): BarometerTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkBarometerStow(cards: readonly BarometerTube[], ids: readonly string[]): BarometerTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkBarometerStill(cards: readonly BarometerTube[], ids: readonly string[]): BarometerTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, shuttle: "still", audit: "shuttle" }));
}

export function bulkBarometerChampagne(cards: readonly BarometerTube[], ids: readonly string[]): BarometerTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, dye: "CHAMPAGNE", audit: "dye" }));
}

export function bulkBarometerTag(cards: readonly BarometerTube[], ids: readonly string[], tag: string): BarometerTube[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTubes(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly BarometerTube[], ids: readonly string[], index: number, change: (list: readonly BarometerTube[], id: string) => BarometerTube[]): BarometerTube[] {
  const id = ids[index];
  return id ? change(cards, id) : readTubes(cards);
}

export function lengthenBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  return focused(cards, ids, index, lengthenBarometer);
}

export function shortenBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  return focused(cards, ids, index, shortenBarometer);
}

export function motionFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  return focused(cards, ids, index, cycleMotion);
}

export function raiseBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  return focused(cards, ids, index, raiseBarometer);
}

export function lowerBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  return focused(cards, ids, index, lowerBarometer);
}

export function pinBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  const id = ids[index];
  if (!id) return readTubes(cards);
  const card = readTubes(cards).find((item) => item.id === id);
  return card ? setBarometerPin(cards, id, !card.pinned) : readTubes(cards);
}

export function stayBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  const id = ids[index];
  if (!id) return readTubes(cards);
  const card = readTubes(cards).find((item) => item.id === id);
  return card ? setBarometerStay(cards, id, !card.paused) : readTubes(cards);
}

export function starBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number): BarometerTube[] {
  const id = ids[index];
  if (!id) return readTubes(cards);
  const card = readTubes(cards).find((item) => item.id === id);
  return card ? setBarometerStar(cards, id, !card.flagged) : readTubes(cards);
}

export function tagBarometerFocused(cards: readonly BarometerTube[], ids: readonly string[], index: number, tag: string): BarometerTube[] {
  const id = ids[index];
  return id ? addBarometerTag(cards, id, tag) : readTubes(cards);
}

export function readBarometerViews(raw: unknown): BarometerView[] {
  if (!Array.isArray(raw)) return [];
  const out: BarometerView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BarometerView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      weaver: clip(row.weaver, 24),
      dye: activeInk(row.dye),
      shuttle: activeMotion(row.shuttle, SIGHTS),
      frame: activeLimb(row.frame),
      wait: activeBarometerSpan(row.wait),
      rank: activeBarometerMark(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBarometerView(
  views: readonly BarometerView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    weaver?: string;
    dye?: string;
    shuttle?: string;
    frame?: string;
    wait?: string;
    rank?: string;
  },
): BarometerView[] {
  const current = readBarometerViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BarometerView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    weaver: clip(view.weaver, 24),
    dye: activeInk(view.dye),
    shuttle: activeMotion(view.shuttle, SIGHTS),
    frame: activeLimb(view.frame),
    wait: activeBarometerSpan(view.wait),
    rank: activeBarometerMark(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBarometerView(views: readonly BarometerView[], id: string): BarometerView[] {
  return readBarometerViews(views).filter((view) => view.id !== id);
}

export function barometerDensity(raw: unknown): BarometerDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A tube more than two limbs behind the desk, at mark 1, is late. */
export function lateTube(card: BarometerTube, deskFrame: unknown): boolean {
  const gap = limbGap(card.frame, deskFrame);
  return card.rank === 1 && gap !== null && gap > 2;
}

export function idleTube(card: BarometerTube): boolean {
  return card.shuttle === "rise" && quietLimb(card.frame) && card.rank === 1;
}

export function briskTube(card: BarometerTube): boolean {
  return card.rank === 7 && card.shuttle === "still" && peakLimb(card.frame);
}

export function restingTube(card: BarometerTube): boolean {
  return card.wait === 48 && card.shuttle === "fall" && card.frame === "cistern";
}

/** A twelve-minute span on a peak limb is overdue unless the tube is pinned. */
export function overdueTube(card: BarometerTube): boolean {
  return card.wait === 12 && peakLimb(card.frame) && !card.pinned;
}

export function visibleTubes(
  cards: readonly BarometerTube[],
  tray: BarometerTray,
  query: string,
  weaver: string,
  dye: string,
  shuttle: string,
  frame: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): BarometerTube[] {
  const text = query.trim().toLowerCase();
  const weaverOn = weaver === "all" ? "" : weaver.trim().toLowerCase();
  const dyeOn = dye === "all" ? "" : inkOf(dye);
  const shuttleOn = shuttle === "all" ? "" : motionOf(shuttle);
  const frameOn = frame === "all" ? "" : activeLimb(frame);
  const waitOn = wait === "all" ? "" : activeBarometerSpan(wait);
  const rankOn = rank === "all" ? "" : activeBarometerMark(rank);
  return readTubes(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (weaverOn && card.weaver.toLowerCase() !== weaverOn) return false;
    if (dyeOn && card.dye !== dyeOn) return false;
    if (shuttleOn && card.shuttle !== shuttleOn) return false;
    if (frameOn === "peak" && !peakLimb(card.frame)) return false;
    if (frameOn === "quiet" && !quietLimb(card.frame)) return false;
    if (frameOn && frameOn !== "peak" && frameOn !== "quiet" && card.frame !== frameOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseInk(card.dye)) return false;
    if (peakOnly && !peakLimb(card.frame)) return false;
    if (quietOnly && !quietLimb(card.frame)) return false;
    return true;
  });
}

export function sortTubes(cards: readonly BarometerTube[], sort: BarometerSort): BarometerTube[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "weaver") {
      const weaver = a.weaver.localeCompare(b.weaver);
      if (weaver) return weaver;
    }
    const frame = (limbIndex(a.frame) < 0 ? 99 : limbIndex(a.frame)) - (limbIndex(b.frame) < 0 ? 99 : limbIndex(b.frame));
    if (frame) return frame;
    return a.title.localeCompare(b.title);
  });
}

export function barometerCounts(cards: readonly BarometerTube[], shown: readonly BarometerTube[], deskFrame: unknown): BarometerCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakLimb(card.frame)).length,
    quiet: open.filter((card) => quietLimb(card.frame)).length,
    soon: open.filter((card) => card.wait === 12).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseInk(card.dye)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.frame && card.frame === limbOf(deskFrame)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleTube(card)).length,
    brisk: open.filter((card) => briskTube(card)).length,
    resting: open.filter((card) => restingTube(card)).length,
    overdue: open.filter((card) => overdueTube(card)).length,
  };
}

export function clashLimbCount(cards: readonly BarometerTube[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.frame);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.frame === card.frame && other.rank === card.rank)).length;
}

export function neighborBarometerCount(cards: readonly BarometerTube[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, MAG_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestBarometerKeeper(cards: readonly BarometerTube[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.weaver);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.weaver.toLowerCase() === card.weaver.toLowerCase()).length;
    if (count > score) {
      best = card.weaver;
      score = count;
    }
  }
  return best;
}

export function reminderTubes(cards: readonly BarometerTube[]): BarometerTube[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 12 || card.wait === 24));
}

export function idleTubes(cards: readonly BarometerTube[]): BarometerTube[] {
  return cards.filter((card) => inTray(card, "open") && idleTube(card));
}

export function barometerTimeline(cards: readonly BarometerTube[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return MAG_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function barometerBars(cards: readonly BarometerTube[]): { frame: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return BAROMETER_LIMBS.map((frame) => ({ frame, count: open.filter((card) => card.frame === frame).length }));
}

export function barometerKeepers(cards: readonly BarometerTube[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.weaver || out.some((item) => item.toLowerCase() === card.weaver.toLowerCase())) continue;
    out.push(card.weaver);
  }
  return out;
}

export function barometerCopy(card: BarometerTube): string {
  return [card.title, card.weaver, card.frame, card.dye, card.shuttle, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function barometerShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function barometerCsv(cards: readonly BarometerTube[], deskFrame: unknown): string {
  const lines = ["title,keeper,plate,ink,motion,span,star,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readTubes(cards)) {
    const gap = limbGap(card.frame, deskFrame);
    lines.push([
      csvCell(card.title),
      csvCell(card.weaver),
      card.frame,
      card.dye,
      card.shuttle,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateTube(card, deskFrame) ? "1" : "0",
      idleTube(card) ? "1" : "0",
      peakLimb(card.frame) ? "1" : "0",
      quietLimb(card.frame) ? "1" : "0",
      houseInk(card.dye) ? "1" : "0",
      limbBand(card.frame),
      briskTube(card) ? "1" : "0",
      restingTube(card) ? "1" : "0",
      overdueTube(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function surnameRecord(raw: SurnameValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: SurnameValue): boolean {
  const row = surnameRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type SurnameParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function surnameText(raw: SurnameValue): string {
  if (hasBlocked(raw)) return "";
  const row = surnameRecord(raw);
  if (row && !("lastName" in row) && !("name" in row)) return "";
  return row ? clip(row.lastName ?? row.name, 32) : clip(raw, 32);
}

function surnameParts(raw: SurnameValue): SurnameParts | null {
  const text = surnameText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked field clears the plate. A real surname is set. A blank or broken surname is clear. */
export function surnameState(raw: SurnameValue): SurnameState {
  if (hasBlocked(raw)) return "";
  const row = surnameRecord(raw);
  if (row && !("lastName" in row) && !("name" in row)) return "";
  return surnameParts(raw) ? "set" : "clear";
}

/** Ross is a hall, Vale is a porch, a separator is a gate, and a plain word is a stair. */
export function surnameLane(raw: SurnameValue): SurnameLane {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "ross") return "hall";
  if (key === "vale") return "porch";
  if (parts.seps >= 1) return "gate";
  return "stair";
}

/** The first two letters. */
export function surnameStamp(raw: SurnameValue): string {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** Ross is champagne, Vale is graphite, and other surnames follow the last letter. */
export function surnameHue(raw: SurnameValue): SurnameHue {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  if (!parts) return "";
  const lane = surnameLane(raw);
  if (lane === "hall") return "champagne";
  if (lane === "porch") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function surnameTwin(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function surnameWide(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function surnameNotch(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function surnameEcho(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function surnameLeap(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function surnameSlash(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function surnameKnown(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function surnameCap(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function surnameTail(raw: SurnameValue): boolean {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function surnameScore(raw: SurnameValue): number {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return parts ? parts.score : 0;
}

export function surnameStep(raw: SurnameValue): number {
  const parts = surnameState(raw) === "set" ? surnameParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function surnameLanes(rows: readonly SurnameRow[]): SurnameLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = surnameLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSurname(rows: readonly SurnameRow[]): string {
  const bars = surnameLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSurnameHue(rows: readonly SurnameRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = surnameHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedSurnameCount(rows: readonly SurnameRow[]): number {
  const marks = rows.map((row) => surnameStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneSurnameCount(rows: readonly SurnameRow[], lane: SurnameLane): number {
  return rows.filter((row) => surnameLane(row.note) === lane).length;
}

export function surnameShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSurnameLanes(rows: readonly SurnameRow[]): string[] {
  return surnameLanes(rows).map((line) => line.lane);
}

export function readHiddenSurnames(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSurnames(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSurname(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSurnameReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSurnameReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSurnameLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleSurnames(
  rows: readonly SurnameRow[],
  lane: string,
  hue: string,
  query: string,
  review: SurnameReview,
  reviewed: readonly string[],
  shape: SurnameShape,
): SurnameRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (surnameState(row.note) === "") return false;
    const found = surnameLane(row.note);
    const hueName = surnameHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${surnameText(row.note)} ${surnameStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "porch" && found !== "porch") return false;
    if (shape === "stair" && found !== "stair") return false;
    if (shape === "gate" && found !== "gate") return false;
    if (shape === "wide" && !surnameWide(row.note)) return false;
    if (shape === "notch" && !surnameNotch(row.note)) return false;
    if (shape === "leap" && !surnameLeap(row.note)) return false;
    if (shape === "slash" && !surnameSlash(row.note)) return false;
    if (shape === "twin" && !surnameTwin(row.note)) return false;
    if (shape === "known" && !surnameKnown(row.note)) return false;
    if (shape === "echo" && !surnameEcho(row.note)) return false;
    return true;
  });
}

export function surnameCopy(raw: SurnameValue): string {
  return [surnameStamp(raw), surnameLane(raw), surnameHue(raw)].filter(Boolean).join(" ");
}

export function surnameLanesCsv(rows: readonly SurnameRow[]): string {
  const lines = ["lane,count"];
  for (const line of surnameLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function surnameRowsCsv(rows: readonly SurnameRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (surnameState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(surnameText(row.note)),
      surnameStamp(row.note),
      surnameLane(row.note),
      surnameHue(row.note),
      String(surnameStep(row.note)),
      surnameEcho(row.note) ? "1" : "0",
      surnameWide(row.note) ? "1" : "0",
      surnameNotch(row.note) ? "1" : "0",
      surnameLeap(row.note) ? "1" : "0",
      surnameSlash(row.note) ? "1" : "0",
      surnameTwin(row.note) ? "1" : "0",
      surnameKnown(row.note) ? "1" : "0",
      surnameCap(row.note) ? "1" : "0",
      surnameTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
