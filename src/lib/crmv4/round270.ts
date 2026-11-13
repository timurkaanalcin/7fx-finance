/**
 * Clinometer cards for a tilt follow-up book, and potential plates already stored as potentialStatus.
 * Grades are level, rise, fall, and steep. Tilts are climb, rest, and sink.
 * Spans are 20, 40, or 90 minutes. Marks are 3, 5, 7, or 9.
 * HOT is a kiln and WARM is a hearth. A separator is a porch.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_clinometer_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   surveyor text not null default '',
 *   grade text not null default '',
 *   ink text not null default '',
 *   tilt text not null default '',
 *   span_min integer,
 *   mark_no integer not null default 3,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_potential_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_potential_review (
 *   trader_id text primary key
 * );
 */


export const CLN_KEY = "crmv4-clinometer-card";
export const CLN_VIEW_KEY = "crmv4-clinometer-views";
export const CLN_DENSITY_KEY = "crmv4-clinometer-density";
export const PTN_KEY = "crmv4-potential-hide";
export const PTN_REVIEW_KEY = "crmv4-potential-review";

export const CLINO_LIMBS = ["level", "rise", "fall", "steep"] as const;

export type ClinoLimb = (typeof CLINO_LIMBS)[number];

export type InkName = "blank" | "ivory" | "graphite" | "champagne";

export type MotionName = "blank" | "climb" | "rest" | "sink";

export type ClinoTray = "open" | "pause" | "seal";

export type ClinoDensity = "roomy" | "close";

export type ClinoSort = "frame" | "weaver";

export type ClinoTube = {
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

export type ClinoView = {
  id: string;
  name: string;
  tray: ClinoTray;
  query: string;
  weaver: string;
  dye: string;
  shuttle: string;
  frame: string;
  wait: string;
  rank: string;
};

export type ClinoCounts = {
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

export type PotentialLane = "" | "kiln" | "hearth" | "hall" | "porch";

export type PotentialHue = "" | "ivory" | "graphite" | "champagne";

export type PotentialState = "" | "clear" | "set";

export type PotentialShape = "all" | "kiln" | "hearth" | "hall" | "porch" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type PotentialReview = "all" | "reviewed" | "fresh";

export type PotentialValue = string | { potentialStatus?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type PotentialRow = { id: string; label: string; note: PotentialValue };

export type PotentialLaneLine = { lane: string; count: number };

export const ROUND270_FEATURES = [
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
  "potential",
  "potential-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shuttle", "pin", "unpin", "pause", "resume", "seal", "open", "dye", "tag", "rank", "wait", "short", "flag"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const SIGHTS = ["climb", "rest", "sink"] as const;

const ALT_CYCLE = [20, 40, 90] as const;

const MAG_CYCLE = [3, 5, 7, 9] as const;

const PEAK = new Set(["rise", "fall"]);

const QUIET = new Set(["level", "steep"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const EARLY = new Set(["level", "rise"]);

const LANE_ORDER = ["kiln", "hearth", "hall", "porch"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["hot", "warm"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ClinoTray {
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

function inTray(card: ClinoTube, tray: ClinoTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(frame: string): number {
  return CLINO_LIMBS.indexOf(frame as ClinoLimb);
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
  return (CLINO_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** Span is 20, 40, or 90 minutes. Anything else stays blank. */
export function clinoSpan(raw: unknown): 20 | 40 | 90 | null {
  const value = Number(clip(raw, 2));
  return (ALT_CYCLE as readonly number[]).includes(value) ? (value as 20 | 40 | 90) : null;
}

/** Mark is 3, 5, 7, or 9. Anything else stays blank. */
export function clinoMark(raw: unknown): 3 | 5 | 7 | 9 | null {
  const value = Number(clip(raw, 1));
  return (MAG_CYCLE as readonly number[]).includes(value) ? (value as 3 | 5 | 7 | 9) : null;
}

/** Ink is ivory, graphite, or champagne. The saved ink is IVORY, GRAPHITE, or CHAMPAGNE. */
export function inkOf(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

/** Drift is swell, hold, or ebb. A blank drift stays blank. */
export function motionOf(raw: unknown): string {
  return motionName(raw);
}

export function peakLimb(frame: unknown): boolean {
  return PEAK.has(clip(frame, 12).toLowerCase());
}

export function quietLimb(frame: unknown): boolean {
  return QUIET.has(clip(frame, 12).toLowerCase());
}

/** Early is level and rise. Mid is fall. Late is steep. */
export function limbBand(frame: unknown): string {
  const text = limbOf(frame);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "fall") return "mid";
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

export function activeClinoSpan(raw: unknown): string {
  const wait = clinoSpan(raw);
  return wait === null ? "all" : String(wait);
}

export function activeMotion(raw: unknown, allow: readonly string[]): string {
  const text = motionOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeClinoMark(raw: unknown): string {
  const rank = clinoMark(raw);
  return rank === null ? "all" : String(rank);
}

export function activeInk(raw: unknown): string {
  const text = inkName(raw);
  return text || "all";
}

export function moveClinoFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestInk(cards: readonly ClinoTube[]): string {
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

/** A night watch asks for twenty minutes. Morning asks for forty. Saved spans win when any exist. */
export function suggestClinoSpan(cards: readonly ClinoTube[], hour: number): 20 | 40 | 90 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 20 | 40 | 90 | null = null;
  let score = 0;
  for (const wait of ALT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 20;
  if (hour < 12) return 40;
  return 90;
}

/** Before the watch opens, suggest the level grade. The rest of the day suggests the fall grade. */
export function suggestLimb(hour: number): ClinoLimb {
  return hour < 6 ? "level" : "fall";
}

/** The pilot with the fewest open unpinned sights. A tie keeps the roster order. */
export function fairClinoKeeper(cards: readonly ClinoTube[], roster: string): string {
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

export function readTubes(raw: unknown): ClinoTube[] {
  if (!Array.isArray(raw)) return [];
  const out: ClinoTube[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ClinoTube>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      weaver: clip(row.weaver, 24),
      frame: limbOf(row.frame),
      wait: clinoSpan(row.wait),
      dye: inkOf(row.dye),
      shuttle: motionOf(row.shuttle),
      rank: clinoMark(row.rank) ?? 3,
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

export function addClino(
  cards: readonly ClinoTube[],
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
): ClinoTube[] {
  const current = readTubes(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ClinoTube = {
    id,
    title,
    note: noteOf(card.note),
    weaver: clip(card.weaver, 24),
    frame: limbOf(card.frame),
    wait: clinoSpan(card.wait),
    dye: inkOf(card.dye),
    shuttle: motionOf(card.shuttle),
    rank: clinoMark(card.rank) ?? 3,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly ClinoTube[], id: string, change: (card: ClinoTube) => ClinoTube): ClinoTube[] {
  return readTubes(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly ClinoTube[], ids: readonly string[], change: (card: ClinoTube) => ClinoTube): ClinoTube[] {
  const picked = new Set(ids);
  return readTubes(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editClino(cards: readonly ClinoTube[], id: string, title: string): ClinoTube[] {
  const next = lineOf(title);
  if (!next) return readTubes(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editClinoNote(cards: readonly ClinoTube[], id: string, note: string): ClinoTube[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setClinoPin(cards: readonly ClinoTube[], id: string, pinned: boolean): ClinoTube[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setClinoStay(cards: readonly ClinoTube[], id: string, paused: boolean): ClinoTube[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setClinoStow(cards: readonly ClinoTube[], id: string, sealed: boolean): ClinoTube[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setClinoStar(cards: readonly ClinoTube[], id: string, flagged: boolean): ClinoTube[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setClinoInk(cards: readonly ClinoTube[], id: string, dye: unknown): ClinoTube[] {
  const next = inkOf(dye);
  if (!next) return readTubes(cards);
  return mapCard(cards, id, (card) => (card.dye === next ? card : { ...card, dye: next, audit: "dye" }));
}

/** Drift steps swell, hold, ebb, then swell again. A blank drift starts at swell. */
export function cycleMotion(cards: readonly ClinoTube[], id: string): ClinoTube[] {
  return mapCard(cards, id, (card) => {
    const at = SIGHTS.indexOf(card.shuttle as (typeof SIGHTS)[number]);
    const next = at < 0 ? SIGHTS[0] : SIGHTS[(at + 1) % SIGHTS.length];
    return next === card.shuttle ? card : { ...card, shuttle: next, audit: "shuttle" };
  });
}

export function addClinoTag(cards: readonly ClinoTube[], id: string, tag: string): ClinoTube[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTubes(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 20, 20 becomes 40, and 40 becomes 90. A span of 90 stays. */
export function lengthenClino(cards: readonly ClinoTube[], id: string): ClinoTube[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 90) return card;
    const next = card.wait === 40 ? 90 : card.wait === 20 ? 40 : 20;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank span becomes 90, 90 becomes 40, and 40 becomes 20. A span of 20 stays. */
export function shortenClino(cards: readonly ClinoTube[], id: string): ClinoTube[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 20) return card;
    const next = card.wait === 40 ? 20 : card.wait === 90 ? 40 : 90;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseClino(cards: readonly ClinoTube[], id: string): ClinoTube[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 3, audit: "rank" };
    if (at === MAG_CYCLE.length - 1) return card;
    return { ...card, rank: MAG_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerClino(cards: readonly ClinoTube[], id: string): ClinoTube[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: MAG_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkClinoPin(cards: readonly ClinoTube[], ids: readonly string[]): ClinoTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkClinoStow(cards: readonly ClinoTube[], ids: readonly string[]): ClinoTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkClinoStill(cards: readonly ClinoTube[], ids: readonly string[]): ClinoTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, shuttle: "rest", audit: "shuttle" }));
}

export function bulkClinoChampagne(cards: readonly ClinoTube[], ids: readonly string[]): ClinoTube[] {
  return touchIds(cards, ids, (card) => ({ ...card, dye: "CHAMPAGNE", audit: "dye" }));
}

export function bulkClinoTag(cards: readonly ClinoTube[], ids: readonly string[], tag: string): ClinoTube[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTubes(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly ClinoTube[], ids: readonly string[], index: number, change: (list: readonly ClinoTube[], id: string) => ClinoTube[]): ClinoTube[] {
  const id = ids[index];
  return id ? change(cards, id) : readTubes(cards);
}

export function lengthenClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  return focused(cards, ids, index, lengthenClino);
}

export function shortenClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  return focused(cards, ids, index, shortenClino);
}

export function motionFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  return focused(cards, ids, index, cycleMotion);
}

export function raiseClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  return focused(cards, ids, index, raiseClino);
}

export function lowerClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  return focused(cards, ids, index, lowerClino);
}

export function pinClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  const id = ids[index];
  if (!id) return readTubes(cards);
  const card = readTubes(cards).find((item) => item.id === id);
  return card ? setClinoPin(cards, id, !card.pinned) : readTubes(cards);
}

export function stayClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  const id = ids[index];
  if (!id) return readTubes(cards);
  const card = readTubes(cards).find((item) => item.id === id);
  return card ? setClinoStay(cards, id, !card.paused) : readTubes(cards);
}

export function starClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number): ClinoTube[] {
  const id = ids[index];
  if (!id) return readTubes(cards);
  const card = readTubes(cards).find((item) => item.id === id);
  return card ? setClinoStar(cards, id, !card.flagged) : readTubes(cards);
}

export function tagClinoFocused(cards: readonly ClinoTube[], ids: readonly string[], index: number, tag: string): ClinoTube[] {
  const id = ids[index];
  return id ? addClinoTag(cards, id, tag) : readTubes(cards);
}

export function readClinoViews(raw: unknown): ClinoView[] {
  if (!Array.isArray(raw)) return [];
  const out: ClinoView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ClinoView>;
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
      wait: activeClinoSpan(row.wait),
      rank: activeClinoMark(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addClinoView(
  views: readonly ClinoView[],
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
): ClinoView[] {
  const current = readClinoViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: ClinoView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    weaver: clip(view.weaver, 24),
    dye: activeInk(view.dye),
    shuttle: activeMotion(view.shuttle, SIGHTS),
    frame: activeLimb(view.frame),
    wait: activeClinoSpan(view.wait),
    rank: activeClinoMark(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropClinoView(views: readonly ClinoView[], id: string): ClinoView[] {
  return readClinoViews(views).filter((view) => view.id !== id);
}

export function clinoDensity(raw: unknown): ClinoDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A card more than two grades behind the desk, at mark 3, is late. */
export function lateTube(card: ClinoTube, deskFrame: unknown): boolean {
  const gap = limbGap(card.frame, deskFrame);
  return card.rank === 3 && gap !== null && gap > 2;
}

export function idleTube(card: ClinoTube): boolean {
  return card.shuttle === "climb" && quietLimb(card.frame) && card.rank === 3;
}

export function briskTube(card: ClinoTube): boolean {
  return card.rank === 9 && card.shuttle === "rest" && peakLimb(card.frame);
}

export function restingTube(card: ClinoTube): boolean {
  return card.wait === 90 && card.shuttle === "sink" && card.frame === "steep";
}

/** A twenty-minute span on a peak grade is overdue unless the card is pinned. */
export function overdueTube(card: ClinoTube): boolean {
  return card.wait === 20 && peakLimb(card.frame) && !card.pinned;
}

export function visibleTubes(
  cards: readonly ClinoTube[],
  tray: ClinoTray,
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
): ClinoTube[] {
  const text = query.trim().toLowerCase();
  const weaverOn = weaver === "all" ? "" : weaver.trim().toLowerCase();
  const dyeOn = dye === "all" ? "" : inkOf(dye);
  const shuttleOn = shuttle === "all" ? "" : motionOf(shuttle);
  const frameOn = frame === "all" ? "" : activeLimb(frame);
  const waitOn = wait === "all" ? "" : activeClinoSpan(wait);
  const rankOn = rank === "all" ? "" : activeClinoMark(rank);
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

export function sortTubes(cards: readonly ClinoTube[], sort: ClinoSort): ClinoTube[] {
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

export function clinoCounts(cards: readonly ClinoTube[], shown: readonly ClinoTube[], deskFrame: unknown): ClinoCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakLimb(card.frame)).length,
    quiet: open.filter((card) => quietLimb(card.frame)).length,
    soon: open.filter((card) => card.wait === 20).length,
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

export function clashLimbCount(cards: readonly ClinoTube[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.frame);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.frame === card.frame && other.rank === card.rank)).length;
}

export function neighborClinoCount(cards: readonly ClinoTube[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, MAG_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestClinoKeeper(cards: readonly ClinoTube[]): string {
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

export function reminderTubes(cards: readonly ClinoTube[]): ClinoTube[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 20 || card.wait === 40));
}

export function idleTubes(cards: readonly ClinoTube[]): ClinoTube[] {
  return cards.filter((card) => inTray(card, "open") && idleTube(card));
}

export function clinoTimeline(cards: readonly ClinoTube[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return MAG_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function clinoBars(cards: readonly ClinoTube[]): { frame: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return CLINO_LIMBS.map((frame) => ({ frame, count: open.filter((card) => card.frame === frame).length }));
}

export function clinoKeepers(cards: readonly ClinoTube[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.weaver || out.some((item) => item.toLowerCase() === card.weaver.toLowerCase())) continue;
    out.push(card.weaver);
  }
  return out;
}

export function clinoCopy(card: ClinoTube): string {
  return [card.title, card.weaver, card.frame, card.dye, card.shuttle, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function clinoShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clinoCsv(cards: readonly ClinoTube[], deskFrame: unknown): string {
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

function potentialRecord(raw: PotentialValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: PotentialValue): boolean {
  const row = potentialRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type PotentialParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function potentialText(raw: PotentialValue): string {
  if (hasBlocked(raw)) return "";
  const row = potentialRecord(raw);
  if (row && !("potentialStatus" in row) && !("code" in row)) return "";
  return row ? clip(row.potentialStatus ?? row.code, 32) : clip(raw, 32);
}

function potentialParts(raw: PotentialValue): PotentialParts | null {
  const text = potentialText(raw);
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

/** A blocked money field clears the plate. A real potential status is set. A blank or broken status is clear. */
export function potentialState(raw: PotentialValue): PotentialState {
  if (hasBlocked(raw)) return "";
  const row = potentialRecord(raw);
  if (row && !("potentialStatus" in row) && !("code" in row)) return "";
  return potentialParts(raw) ? "set" : "clear";
}

/** HOT is a kiln, WARM is a hearth, a separator is a porch, and a plain word is a hall. */
export function potentialLane(raw: PotentialValue): PotentialLane {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "hot") return "kiln";
  if (key === "warm") return "hearth";
  if (parts.seps >= 1) return "porch";
  return "hall";
}

/** The first two letters. */
export function potentialStamp(raw: PotentialValue): string {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** HOT is champagne, WARM is graphite, and other statuses follow the last letter. */
export function potentialHue(raw: PotentialValue): PotentialHue {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  if (!parts) return "";
  const lane = potentialLane(raw);
  if (lane === "kiln") return "champagne";
  if (lane === "hearth") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function potentialTwin(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function potentialWide(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function potentialNotch(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function potentialEcho(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function potentialLeap(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function potentialSlash(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function potentialKnown(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function potentialCap(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function potentialTail(raw: PotentialValue): boolean {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function potentialScore(raw: PotentialValue): number {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return parts ? parts.score : 0;
}

export function potentialStep(raw: PotentialValue): number {
  const parts = potentialState(raw) === "set" ? potentialParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function potentialLanes(rows: readonly PotentialRow[]): PotentialLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = potentialLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPotential(rows: readonly PotentialRow[]): string {
  const bars = potentialLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPotentialHue(rows: readonly PotentialRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = potentialHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedPotentialCount(rows: readonly PotentialRow[]): number {
  const marks = rows.map((row) => potentialStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function lanePotentialCount(rows: readonly PotentialRow[], lane: PotentialLane): number {
  return rows.filter((row) => potentialLane(row.note) === lane).length;
}

export function potentialShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPotentialLanes(rows: readonly PotentialRow[]): string[] {
  return potentialLanes(rows).map((line) => line.lane);
}

export function readHiddenRegistries(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRegistries(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePotential(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePotentialReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPotentialReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePotentialLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleRegistries(
  rows: readonly PotentialRow[],
  lane: string,
  hue: string,
  query: string,
  review: PotentialReview,
  reviewed: readonly string[],
  shape: PotentialShape,
): PotentialRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (potentialState(row.note) === "") return false;
    const found = potentialLane(row.note);
    const hueName = potentialHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${potentialText(row.note)} ${potentialStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "kiln" && found !== "kiln") return false;
    if (shape === "hearth" && found !== "hearth") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "porch" && found !== "porch") return false;
    if (shape === "wide" && !potentialWide(row.note)) return false;
    if (shape === "notch" && !potentialNotch(row.note)) return false;
    if (shape === "leap" && !potentialLeap(row.note)) return false;
    if (shape === "slash" && !potentialSlash(row.note)) return false;
    if (shape === "twin" && !potentialTwin(row.note)) return false;
    if (shape === "known" && !potentialKnown(row.note)) return false;
    if (shape === "echo" && !potentialEcho(row.note)) return false;
    return true;
  });
}

export function potentialCopy(raw: PotentialValue): string {
  return [potentialStamp(raw), potentialLane(raw), potentialHue(raw)].filter(Boolean).join(" ");
}

export function potentialLanesCsv(rows: readonly PotentialRow[]): string {
  const lines = ["lane,count"];
  for (const line of potentialLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function potentialRowsCsv(rows: readonly PotentialRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (potentialState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(potentialText(row.note)),
      potentialStamp(row.note),
      potentialLane(row.note),
      potentialHue(row.note),
      String(potentialStep(row.note)),
      potentialEcho(row.note) ? "1" : "0",
      potentialWide(row.note) ? "1" : "0",
      potentialNotch(row.note) ? "1" : "0",
      potentialLeap(row.note) ? "1" : "0",
      potentialSlash(row.note) ? "1" : "0",
      potentialTwin(row.note) ? "1" : "0",
      potentialKnown(row.note) ? "1" : "0",
      potentialCap(row.note) ? "1" : "0",
      potentialTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
