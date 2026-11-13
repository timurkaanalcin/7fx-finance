/**
 * Astrolabe retes for a star-chart follow-up book, and given-name plates already stored as firstName.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_astrolabe_rete (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   plate text not null default '',
 *   ink text not null default '',
 *   motion text not null default '',
 *   span_min integer,
 *   star_no integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_given_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_given_review (
 *   trader_id text primary key
 * );
 */

export const AST_KEY = "crmv4-astrolabe-rete";
export const AST_VIEW_KEY = "crmv4-astrolabe-views";
export const AST_DENSITY_KEY = "crmv4-astrolabe-density";
export const GNM_KEY = "crmv4-given-hide";
export const GNM_REVIEW_KEY = "crmv4-given-review";

export const ASTROLABE_PLATES = ["mater", "rete", "rule", "alidade"] as const;

export type AstrolabePlate = (typeof ASTROLABE_PLATES)[number];

export type InkName = "blank" | "ivory" | "graphite" | "champagne";

export type MotionName = "blank" | "lift" | "hold" | "set";

export type AstrolabeTray = "open" | "pause" | "seal";

export type AstrolabeDensity = "roomy" | "close";

export type AstrolabeSort = "frame" | "weaver";

export type AstrolabeRete = {
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

export type AstrolabeView = {
  id: string;
  name: string;
  tray: AstrolabeTray;
  query: string;
  weaver: string;
  dye: string;
  shuttle: string;
  frame: string;
  wait: string;
  rank: string;
};

export type AstrolabeCounts = {
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

export type GivenLane = "" | "salon" | "gallery" | "bay" | "court";

export type GivenHue = "" | "ivory" | "graphite" | "champagne";

export type GivenState = "" | "clear" | "set";

export type GivenShape = "all" | "salon" | "gallery" | "bay" | "court" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type GivenReview = "all" | "reviewed" | "fresh";

export type GivenValue = string | { firstName?: unknown; name?: unknown; [key: string]: unknown } | null | undefined;

export type GivenRow = { id: string; label: string; note: GivenValue };

export type GivenLaneLine = { lane: string; count: number };

export const ROUND267_FEATURES = [
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
  "given-name",
  "given-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shuttle", "pin", "unpin", "pause", "resume", "seal", "open", "dye", "tag", "rank", "wait", "short", "flag"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const SIGHTS = ["lift", "hold", "set"] as const;

const ALT_CYCLE = [10, 20, 40] as const;

const MAG_CYCLE = [2, 4, 6, 8] as const;

const PEAK = new Set(["mater", "rule"]);

const QUIET = new Set(["rete", "alidade"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const EARLY = new Set(["mater", "rete"]);

const LANE_ORDER = ["salon", "gallery", "bay", "court"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["ada", "noor"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AstrolabeTray {
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

function inTray(card: AstrolabeRete, tray: AstrolabeTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function plateIndex(frame: string): number {
  return ASTROLABE_PLATES.indexOf(frame as AstrolabePlate);
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

export function plateOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ASTROLABE_PLATES as readonly string[]).includes(text) ? text : "";
}

/** Altitude is 15, 30, or 45 minutes. Anything else stays blank. */
export function astrolabeSpan(raw: unknown): 10 | 20 | 40 | null {
  const value = Number(clip(raw, 2));
  return (ALT_CYCLE as readonly number[]).includes(value) ? (value as 10 | 20 | 40) : null;
}

/** Magnitude is 1, 3, 5, or 7. Anything else stays blank. */
export function astrolabeStar(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (MAG_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
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

export function peakPlate(frame: unknown): boolean {
  return PEAK.has(clip(frame, 12).toLowerCase());
}

export function quietPlate(frame: unknown): boolean {
  return QUIET.has(clip(frame, 12).toLowerCase());
}

/** Early is mater and rete. Mid is rule. Late is alidade. */
export function plateBand(frame: unknown): string {
  const text = plateOf(frame);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "rule") return "mid";
  return "late";
}

/** Signed distance from the slip frame to the desk frame. */
export function plateGap(from: unknown, to: unknown): number | null {
  const left = plateIndex(plateOf(from));
  const right = plateIndex(plateOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(dye: unknown): boolean {
  return HOUSE.has(inkOf(dye));
}

export function activePlate(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return plateOf(text) || "all";
}

export function activeAstrolabeSpan(raw: unknown): string {
  const wait = astrolabeSpan(raw);
  return wait === null ? "all" : String(wait);
}

export function activeMotion(raw: unknown, allow: readonly string[]): string {
  const text = motionOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeAstrolabeStar(raw: unknown): string {
  const rank = astrolabeStar(raw);
  return rank === null ? "all" : String(rank);
}

export function activeInk(raw: unknown): string {
  const text = inkName(raw);
  return text || "all";
}

export function moveAstrolabeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestInk(cards: readonly AstrolabeRete[]): string {
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

/** A night watch asks for a short altitude. Morning asks for the middle one. Saved altitudes win when any exist. */
export function suggestAstrolabeSpan(cards: readonly AstrolabeRete[], hour: number): 10 | 20 | 40 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 10 | 20 | 40 | null = null;
  let score = 0;
  for (const wait of ALT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 10;
  if (hour < 12) return 20;
  return 40;
}

/** Before the watch opens, suggest the mater. The rest of the day suggests the rule. */
export function suggestPlate(hour: number): AstrolabePlate {
  return hour < 6 ? "mater" : "rule";
}

/** The pilot with the fewest open unpinned sights. A tie keeps the roster order. */
export function fairAstrolabeKeeper(cards: readonly AstrolabeRete[], roster: string): string {
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

export function readRetes(raw: unknown): AstrolabeRete[] {
  if (!Array.isArray(raw)) return [];
  const out: AstrolabeRete[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AstrolabeRete>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      weaver: clip(row.weaver, 24),
      frame: plateOf(row.frame),
      wait: astrolabeSpan(row.wait),
      dye: inkOf(row.dye),
      shuttle: motionOf(row.shuttle),
      rank: astrolabeStar(row.rank) ?? 2,
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

export function addAstrolabe(
  cards: readonly AstrolabeRete[],
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
): AstrolabeRete[] {
  const current = readRetes(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: AstrolabeRete = {
    id,
    title,
    note: noteOf(card.note),
    weaver: clip(card.weaver, 24),
    frame: plateOf(card.frame),
    wait: astrolabeSpan(card.wait),
    dye: inkOf(card.dye),
    shuttle: motionOf(card.shuttle),
    rank: astrolabeStar(card.rank) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly AstrolabeRete[], id: string, change: (card: AstrolabeRete) => AstrolabeRete): AstrolabeRete[] {
  return readRetes(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly AstrolabeRete[], ids: readonly string[], change: (card: AstrolabeRete) => AstrolabeRete): AstrolabeRete[] {
  const picked = new Set(ids);
  return readRetes(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editAstrolabe(cards: readonly AstrolabeRete[], id: string, title: string): AstrolabeRete[] {
  const next = lineOf(title);
  if (!next) return readRetes(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editAstrolabeNote(cards: readonly AstrolabeRete[], id: string, note: string): AstrolabeRete[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setAstrolabePin(cards: readonly AstrolabeRete[], id: string, pinned: boolean): AstrolabeRete[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setAstrolabeStay(cards: readonly AstrolabeRete[], id: string, paused: boolean): AstrolabeRete[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setAstrolabeStow(cards: readonly AstrolabeRete[], id: string, sealed: boolean): AstrolabeRete[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setAstrolabeStar(cards: readonly AstrolabeRete[], id: string, flagged: boolean): AstrolabeRete[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setAstrolabeInk(cards: readonly AstrolabeRete[], id: string, dye: unknown): AstrolabeRete[] {
  const next = inkOf(dye);
  if (!next) return readRetes(cards);
  return mapCard(cards, id, (card) => (card.dye === next ? card : { ...card, dye: next, audit: "dye" }));
}

/** Shuttle steps draw, beat, rest, then draw again. A blank shuttle starts at draw. */
export function cycleMotion(cards: readonly AstrolabeRete[], id: string): AstrolabeRete[] {
  return mapCard(cards, id, (card) => {
    const at = SIGHTS.indexOf(card.shuttle as (typeof SIGHTS)[number]);
    const next = at < 0 ? SIGHTS[0] : SIGHTS[(at + 1) % SIGHTS.length];
    return next === card.shuttle ? card : { ...card, shuttle: next, audit: "shuttle" };
  });
}

export function addAstrolabeTag(cards: readonly AstrolabeRete[], id: string, tag: string): AstrolabeRete[] {
  const next = tagsOf(tag)[0];
  if (!next) return readRetes(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank altitude becomes 15, 15 becomes 30, and 30 becomes 45. An altitude of 45 stays. */
export function lengthenAstrolabe(cards: readonly AstrolabeRete[], id: string): AstrolabeRete[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 40) return card;
    const next = card.wait === 20 ? 40 : card.wait === 10 ? 20 : 10;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank altitude becomes 45, 45 becomes 30, and 30 becomes 15. An altitude of 15 stays. */
export function shortenAstrolabe(cards: readonly AstrolabeRete[], id: string): AstrolabeRete[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 10) return card;
    const next = card.wait === 20 ? 10 : card.wait === 40 ? 20 : 40;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseAstrolabe(cards: readonly AstrolabeRete[], id: string): AstrolabeRete[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 2, audit: "rank" };
    if (at === MAG_CYCLE.length - 1) return card;
    return { ...card, rank: MAG_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerAstrolabe(cards: readonly AstrolabeRete[], id: string): AstrolabeRete[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: MAG_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkAstrolabePin(cards: readonly AstrolabeRete[], ids: readonly string[]): AstrolabeRete[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkAstrolabeStow(cards: readonly AstrolabeRete[], ids: readonly string[]): AstrolabeRete[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkAstrolabeHold(cards: readonly AstrolabeRete[], ids: readonly string[]): AstrolabeRete[] {
  return touchIds(cards, ids, (card) => ({ ...card, shuttle: "hold", audit: "shuttle" }));
}

export function bulkAstrolabeChampagne(cards: readonly AstrolabeRete[], ids: readonly string[]): AstrolabeRete[] {
  return touchIds(cards, ids, (card) => ({ ...card, dye: "CHAMPAGNE", audit: "dye" }));
}

export function bulkAstrolabeTag(cards: readonly AstrolabeRete[], ids: readonly string[], tag: string): AstrolabeRete[] {
  const next = tagsOf(tag)[0];
  if (!next) return readRetes(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number, change: (list: readonly AstrolabeRete[], id: string) => AstrolabeRete[]): AstrolabeRete[] {
  const id = ids[index];
  return id ? change(cards, id) : readRetes(cards);
}

export function lengthenAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  return focused(cards, ids, index, lengthenAstrolabe);
}

export function shortenAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  return focused(cards, ids, index, shortenAstrolabe);
}

export function motionFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  return focused(cards, ids, index, cycleMotion);
}

export function raiseAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  return focused(cards, ids, index, raiseAstrolabe);
}

export function lowerAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  return focused(cards, ids, index, lowerAstrolabe);
}

export function pinAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  const id = ids[index];
  if (!id) return readRetes(cards);
  const card = readRetes(cards).find((item) => item.id === id);
  return card ? setAstrolabePin(cards, id, !card.pinned) : readRetes(cards);
}

export function stayAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  const id = ids[index];
  if (!id) return readRetes(cards);
  const card = readRetes(cards).find((item) => item.id === id);
  return card ? setAstrolabeStay(cards, id, !card.paused) : readRetes(cards);
}

export function starAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number): AstrolabeRete[] {
  const id = ids[index];
  if (!id) return readRetes(cards);
  const card = readRetes(cards).find((item) => item.id === id);
  return card ? setAstrolabeStar(cards, id, !card.flagged) : readRetes(cards);
}

export function tagAstrolabeFocused(cards: readonly AstrolabeRete[], ids: readonly string[], index: number, tag: string): AstrolabeRete[] {
  const id = ids[index];
  return id ? addAstrolabeTag(cards, id, tag) : readRetes(cards);
}

export function readAstrolabeViews(raw: unknown): AstrolabeView[] {
  if (!Array.isArray(raw)) return [];
  const out: AstrolabeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AstrolabeView>;
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
      frame: activePlate(row.frame),
      wait: activeAstrolabeSpan(row.wait),
      rank: activeAstrolabeStar(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addAstrolabeView(
  views: readonly AstrolabeView[],
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
): AstrolabeView[] {
  const current = readAstrolabeViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: AstrolabeView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    weaver: clip(view.weaver, 24),
    dye: activeInk(view.dye),
    shuttle: activeMotion(view.shuttle, SIGHTS),
    frame: activePlate(view.frame),
    wait: activeAstrolabeSpan(view.wait),
    rank: activeAstrolabeStar(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropAstrolabeView(views: readonly AstrolabeView[], id: string): AstrolabeView[] {
  return readAstrolabeViews(views).filter((view) => view.id !== id);
}

export function astrolabeDensity(raw: unknown): AstrolabeDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A rete more than two plates behind the desk, at star 2, is late. */
export function lateRete(card: AstrolabeRete, deskFrame: unknown): boolean {
  const gap = plateGap(card.frame, deskFrame);
  return card.rank === 2 && gap !== null && gap > 2;
}

export function idleRete(card: AstrolabeRete): boolean {
  return card.shuttle === "lift" && quietPlate(card.frame) && card.rank === 2;
}

export function briskRete(card: AstrolabeRete): boolean {
  return card.rank === 8 && card.shuttle === "hold" && peakPlate(card.frame);
}

export function restingRete(card: AstrolabeRete): boolean {
  return card.wait === 40 && card.shuttle === "set" && card.frame === "alidade";
}

/** A ten-minute span on a peak plate is overdue unless the rete is pinned. */
export function overdueRete(card: AstrolabeRete): boolean {
  return card.wait === 10 && peakPlate(card.frame) && !card.pinned;
}

export function visibleRetes(
  cards: readonly AstrolabeRete[],
  tray: AstrolabeTray,
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
): AstrolabeRete[] {
  const text = query.trim().toLowerCase();
  const weaverOn = weaver === "all" ? "" : weaver.trim().toLowerCase();
  const dyeOn = dye === "all" ? "" : inkOf(dye);
  const shuttleOn = shuttle === "all" ? "" : motionOf(shuttle);
  const frameOn = frame === "all" ? "" : activePlate(frame);
  const waitOn = wait === "all" ? "" : activeAstrolabeSpan(wait);
  const rankOn = rank === "all" ? "" : activeAstrolabeStar(rank);
  return readRetes(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (weaverOn && card.weaver.toLowerCase() !== weaverOn) return false;
    if (dyeOn && card.dye !== dyeOn) return false;
    if (shuttleOn && card.shuttle !== shuttleOn) return false;
    if (frameOn === "peak" && !peakPlate(card.frame)) return false;
    if (frameOn === "quiet" && !quietPlate(card.frame)) return false;
    if (frameOn && frameOn !== "peak" && frameOn !== "quiet" && card.frame !== frameOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseInk(card.dye)) return false;
    if (peakOnly && !peakPlate(card.frame)) return false;
    if (quietOnly && !quietPlate(card.frame)) return false;
    return true;
  });
}

export function sortRetes(cards: readonly AstrolabeRete[], sort: AstrolabeSort): AstrolabeRete[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "weaver") {
      const weaver = a.weaver.localeCompare(b.weaver);
      if (weaver) return weaver;
    }
    const frame = (plateIndex(a.frame) < 0 ? 99 : plateIndex(a.frame)) - (plateIndex(b.frame) < 0 ? 99 : plateIndex(b.frame));
    if (frame) return frame;
    return a.title.localeCompare(b.title);
  });
}

export function astrolabeCounts(cards: readonly AstrolabeRete[], shown: readonly AstrolabeRete[], deskFrame: unknown): AstrolabeCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakPlate(card.frame)).length,
    quiet: open.filter((card) => quietPlate(card.frame)).length,
    soon: open.filter((card) => card.wait === 10).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseInk(card.dye)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.frame && card.frame === plateOf(deskFrame)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleRete(card)).length,
    brisk: open.filter((card) => briskRete(card)).length,
    resting: open.filter((card) => restingRete(card)).length,
    overdue: open.filter((card) => overdueRete(card)).length,
  };
}

export function clashPlateCount(cards: readonly AstrolabeRete[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.frame);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.frame === card.frame && other.rank === card.rank)).length;
}

export function neighborAstrolabeCount(cards: readonly AstrolabeRete[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, MAG_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestAstrolabeKeeper(cards: readonly AstrolabeRete[]): string {
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

export function reminderRetes(cards: readonly AstrolabeRete[]): AstrolabeRete[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 10 || card.wait === 20));
}

export function idleRetes(cards: readonly AstrolabeRete[]): AstrolabeRete[] {
  return cards.filter((card) => inTray(card, "open") && idleRete(card));
}

export function astrolabeTimeline(cards: readonly AstrolabeRete[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return MAG_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function astrolabeBars(cards: readonly AstrolabeRete[]): { frame: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return ASTROLABE_PLATES.map((frame) => ({ frame, count: open.filter((card) => card.frame === frame).length }));
}

export function astrolabeKeepers(cards: readonly AstrolabeRete[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.weaver || out.some((item) => item.toLowerCase() === card.weaver.toLowerCase())) continue;
    out.push(card.weaver);
  }
  return out;
}

export function astrolabeCopy(card: AstrolabeRete): string {
  return [card.title, card.weaver, card.frame, card.dye, card.shuttle, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function astrolabeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function astrolabeCsv(cards: readonly AstrolabeRete[], deskFrame: unknown): string {
  const lines = ["title,keeper,plate,ink,motion,span,star,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readRetes(cards)) {
    const gap = plateGap(card.frame, deskFrame);
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
      lateRete(card, deskFrame) ? "1" : "0",
      idleRete(card) ? "1" : "0",
      peakPlate(card.frame) ? "1" : "0",
      quietPlate(card.frame) ? "1" : "0",
      houseInk(card.dye) ? "1" : "0",
      plateBand(card.frame),
      briskRete(card) ? "1" : "0",
      restingRete(card) ? "1" : "0",
      overdueRete(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function givenRecord(raw: GivenValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: GivenValue): boolean {
  const row = givenRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type GivenParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function givenText(raw: GivenValue): string {
  if (hasBlocked(raw)) return "";
  const row = givenRecord(raw);
  if (row && !("firstName" in row) && !("name" in row)) return "";
  return row ? clip(row.firstName ?? row.name, 32) : clip(raw, 32);
}

function givenParts(raw: GivenValue): GivenParts | null {
  const text = givenText(raw);
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

/** A blocked field clears the plate. A real given name is set. A blank or broken name is clear. */
export function givenState(raw: GivenValue): GivenState {
  if (hasBlocked(raw)) return "";
  const row = givenRecord(raw);
  if (row && !("firstName" in row) && !("name" in row)) return "";
  return givenParts(raw) ? "set" : "clear";
}

/** Ada is a salon, Noor is a gallery, a separator is a court, and a plain word is a bay. */
export function givenLane(raw: GivenValue): GivenLane {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "ada") return "salon";
  if (key === "noor") return "gallery";
  if (parts.seps >= 1) return "court";
  return "bay";
}

/** The first two letters. */
export function givenStamp(raw: GivenValue): string {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** Ada is champagne, Noor is graphite, and other names follow the last letter. */
export function givenHue(raw: GivenValue): GivenHue {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  if (!parts) return "";
  const lane = givenLane(raw);
  if (lane === "salon") return "champagne";
  if (lane === "gallery") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function givenTwin(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function givenWide(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function givenNotch(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function givenEcho(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function givenLeap(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function givenSlash(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function givenKnown(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function givenCap(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function givenTail(raw: GivenValue): boolean {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function givenScore(raw: GivenValue): number {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return parts ? parts.score : 0;
}

export function givenStep(raw: GivenValue): number {
  const parts = givenState(raw) === "set" ? givenParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function givenLanes(rows: readonly GivenRow[]): GivenLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = givenLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingGiven(rows: readonly GivenRow[]): string {
  const bars = givenLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingGivenHue(rows: readonly GivenRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = givenHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedGivenCount(rows: readonly GivenRow[]): number {
  const marks = rows.map((row) => givenStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneGivenCount(rows: readonly GivenRow[], lane: GivenLane): number {
  return rows.filter((row) => givenLane(row.note) === lane).length;
}

export function givenShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGivenLanes(rows: readonly GivenRow[]): string[] {
  return givenLanes(rows).map((line) => line.lane);
}

export function readHiddenGivens(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGivens(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGiven(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGivenReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGivenReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGivenLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleGivens(
  rows: readonly GivenRow[],
  lane: string,
  hue: string,
  query: string,
  review: GivenReview,
  reviewed: readonly string[],
  shape: GivenShape,
): GivenRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (givenState(row.note) === "") return false;
    const found = givenLane(row.note);
    const hueName = givenHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${givenText(row.note)} ${givenStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "salon" && found !== "salon") return false;
    if (shape === "gallery" && found !== "gallery") return false;
    if (shape === "bay" && found !== "bay") return false;
    if (shape === "court" && found !== "court") return false;
    if (shape === "wide" && !givenWide(row.note)) return false;
    if (shape === "notch" && !givenNotch(row.note)) return false;
    if (shape === "leap" && !givenLeap(row.note)) return false;
    if (shape === "slash" && !givenSlash(row.note)) return false;
    if (shape === "twin" && !givenTwin(row.note)) return false;
    if (shape === "known" && !givenKnown(row.note)) return false;
    if (shape === "echo" && !givenEcho(row.note)) return false;
    return true;
  });
}

export function givenCopy(raw: GivenValue): string {
  return [givenStamp(raw), givenLane(raw), givenHue(raw)].filter(Boolean).join(" ");
}

export function givenLanesCsv(rows: readonly GivenRow[]): string {
  const lines = ["lane,count"];
  for (const line of givenLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function givenRowsCsv(rows: readonly GivenRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (givenState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(givenText(row.note)),
      givenStamp(row.note),
      givenLane(row.note),
      givenHue(row.note),
      String(givenStep(row.note)),
      givenEcho(row.note) ? "1" : "0",
      givenWide(row.note) ? "1" : "0",
      givenNotch(row.note) ? "1" : "0",
      givenLeap(row.note) ? "1" : "0",
      givenSlash(row.note) ? "1" : "0",
      givenTwin(row.note) ? "1" : "0",
      givenKnown(row.note) ? "1" : "0",
      givenCap(row.note) ? "1" : "0",
      givenTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
