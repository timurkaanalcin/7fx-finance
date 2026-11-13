/**
 * Stillroom slips for a retention preparation book, and region plates already stored as lastRegion.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_stillroom_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   shelf text not null default '',
 *   draught text not null default '',
 *   heat text not null default '',
 *   span_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_region_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_region_review (
 *   trader_id text primary key
 * );
 */

export const STL_KEY = "crmv4-stillroom-slip";
export const STL_VIEW_KEY = "crmv4-stillroom-views";
export const STL_DENSITY_KEY = "crmv4-stillroom-density";
export const RGP_KEY = "crmv4-region-hide";
export const RGP_REVIEW_KEY = "crmv4-region-review";

export const STILL_SHELVES = ["shelf", "bench", "hearth", "cellar"] as const;

export type StillShelf = (typeof STILL_SHELVES)[number];

export type DraughtName = "blank" | "rose" | "clove" | "honey";

export type HeatName = "blank" | "cool" | "warm" | "boil";

export type StillTray = "open" | "hold" | "vault";

export type StillDensity = "airy" | "tight";

export type StillSort = "shelf" | "keeper";

export type StillSlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  shelf: string;
  span: number | null;
  draught: string;
  heat: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  vaulted: boolean;
  flagged: boolean;
  audit: string;
};

export type StillView = {
  id: string;
  name: string;
  tray: StillTray;
  query: string;
  keeper: string;
  draught: string;
  heat: string;
  shelf: string;
  span: string;
  rank: string;
};

export type StillCounts = {
  open: number;
  hold: number;
  vault: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rank: number;
  house: number;
  span: number;
  matched: number;
  flagged: number;
  idle: number;
  boil: number;
  resting: number;
  overdue: number;
};

export type RegionLane = "" | "brief" | "desk" | "hall" | "long";

export type RegionHue = "" | "ivory" | "graphite" | "champagne";

export type RegionState = "" | "clear" | "set";

export type RegionShape = "all" | "brief" | "desk" | "hall" | "long" | "wide" | "notch" | "leap" | "plus" | "pair" | "mark";

export type RegionReview = "all" | "reviewed" | "fresh";

export type RegionValue = string | { lastRegion?: unknown; region?: unknown; [key: string]: unknown } | null | undefined;

export type RegionRow = { id: string; label: string; note: RegionValue };

export type RegionLaneLine = { lane: string; count: number };

export const ROUND261_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "span",
  "vault",
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
  "region",
  "region-csv",
] as const;

const AUDITS = ["save", "edit", "note", "heat", "pin", "unpin", "hold", "resume", "vault", "open", "draught", "tag", "rank", "span", "short", "flag"] as const;

const DRAUGHTS = ["rose", "clove", "honey"] as const;

const HEATS = ["cool", "warm", "boil"] as const;

const SPAN_CYCLE = [10, 20, 40] as const;

const RANK_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["bench", "hearth"]);

const QUIET = new Set(["shelf", "cellar"]);

const HOUSE = new Set(["ROSE", "CLOVE"]);

const EARLY = new Set(["shelf", "bench"]);

const LANE_ORDER = ["brief", "desk", "hall", "long"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StillTray {
  return raw === "hold" || raw === "vault" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function draughtName(raw: unknown): Exclude<DraughtName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (DRAUGHTS as readonly string[]).includes(text) ? (text as Exclude<DraughtName, "blank">) : "";
}

function heatName(raw: unknown): Exclude<HeatName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HEATS as readonly string[]).includes(text) ? (text as Exclude<HeatName, "blank">) : "";
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

function inTray(card: StillSlip, tray: StillTray): boolean {
  if (tray === "hold") return card.held && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.held && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function shelfIndex(shelf: string): number {
  return STILL_SHELVES.indexOf(shelf as StillShelf);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function shelfOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (STILL_SHELVES as readonly string[]).includes(text) ? text : "";
}

/** The stillroom span is 10, 20, or 40 minutes. Anything else stays blank. */
export function stillSpan(raw: unknown): 10 | 20 | 40 | null {
  const value = Number(clip(raw, 2));
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 10 | 20 | 40) : null;
}

/** Rank is 1, 3, 5, or 7. Anything else stays blank. */
export function stillRank(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Draught is rose, clove, or honey. The saved draught is ROSE, CLOVE, or HONEY. */
export function draughtOf(raw: unknown): string {
  const text = draughtName(raw);
  return text ? text.toUpperCase() : "";
}

/** Heat is cool, warm, or boil. A blank heat stays blank. */
export function heatOf(raw: unknown): string {
  return heatName(raw);
}

export function peakShelf(shelf: unknown): boolean {
  return PEAK.has(clip(shelf, 12).toLowerCase());
}

export function quietShelf(shelf: unknown): boolean {
  return QUIET.has(clip(shelf, 12).toLowerCase());
}

/** Early is shelf and bench. Mid is hearth. Late is cellar. */
export function shelfBand(shelf: unknown): string {
  const text = shelfOf(shelf);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "hearth") return "mid";
  return "late";
}

/** Signed distance from the slip shelf to the desk shelf. */
export function shelfGap(from: unknown, to: unknown): number | null {
  const left = shelfIndex(shelfOf(from));
  const right = shelfIndex(shelfOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseDraught(draught: unknown): boolean {
  return HOUSE.has(draughtOf(draught));
}

export function activeShelf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return shelfOf(text) || "all";
}

export function activeStillSpan(raw: unknown): string {
  const span = stillSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeHeat(raw: unknown, allow: readonly string[]): string {
  const text = heatOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeStillRank(raw: unknown): string {
  const rank = stillRank(raw);
  return rank === null ? "all" : String(rank);
}

export function activeDraught(raw: unknown): string {
  const text = draughtName(raw);
  return text || "all";
}

export function moveStillFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestDraught(cards: readonly StillSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.draught) continue;
    counts.set(card.draught, (counts.get(card.draught) || 0) + 1);
  }
  let best = "ROSE";
  let score = 0;
  for (const draught of ["ROSE", "CLOVE", "HONEY"]) {
    const count = counts.get(draught) || 0;
    if (count > score) {
      best = draught;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short span. An afternoon desk asks for a long one. Saved spans win when any exist. */
export function suggestStillSpan(cards: readonly StillSlip[], hour: number): 10 | 20 | 40 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 10 | 20 | 40 | null = null;
  let score = 0;
  for (const span of SPAN_CYCLE) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 10;
  if (hour < 14) return 20;
  return 40;
}

/** Quiet hours suggest the shelf. The rest of the day suggests the hearth. */
export function suggestShelf(hour: number): StillShelf {
  return hour < 6 ? "shelf" : "hearth";
}

/** The keeper with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairStillKeeper(cards: readonly StillSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readStills(raw: unknown): StillSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: StillSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StillSlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      shelf: shelfOf(row.shelf),
      span: stillSpan(row.span),
      draught: draughtOf(row.draught),
      heat: heatOf(row.heat),
      rank: stillRank(row.rank) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      vaulted: row.vaulted === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addStill(
  cards: readonly StillSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    shelf?: string;
    span?: unknown;
    draught?: string;
    heat?: string;
    rank?: unknown;
    tags?: string;
  },
): StillSlip[] {
  const current = readStills(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: StillSlip = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    shelf: shelfOf(card.shelf),
    span: stillSpan(card.span),
    draught: draughtOf(card.draught),
    heat: heatOf(card.heat),
    rank: stillRank(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    vaulted: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly StillSlip[], id: string, change: (card: StillSlip) => StillSlip): StillSlip[] {
  return readStills(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly StillSlip[], ids: readonly string[], change: (card: StillSlip) => StillSlip): StillSlip[] {
  const picked = new Set(ids);
  return readStills(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editStill(cards: readonly StillSlip[], id: string, title: string): StillSlip[] {
  const next = lineOf(title);
  if (!next) return readStills(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editStillNote(cards: readonly StillSlip[], id: string, note: string): StillSlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setStillPin(cards: readonly StillSlip[], id: string, pinned: boolean): StillSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setStillHold(cards: readonly StillSlip[], id: string, held: boolean): StillSlip[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, vaulted: held ? false : card.vaulted, audit: held ? "hold" : "resume" }));
}

export function setStillVault(cards: readonly StillSlip[], id: string, vaulted: boolean): StillSlip[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, held: vaulted ? false : card.held, audit: vaulted ? "vault" : "open" }));
}

export function setStillStar(cards: readonly StillSlip[], id: string, flagged: boolean): StillSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setStillDraught(cards: readonly StillSlip[], id: string, draught: unknown): StillSlip[] {
  const next = draughtOf(draught);
  if (!next) return readStills(cards);
  return mapCard(cards, id, (card) => (card.draught === next ? card : { ...card, draught: next, audit: "draught" }));
}

/** Heat steps cool, warm, boil, then cool again. A blank heat starts at cool. */
export function cycleHeat(cards: readonly StillSlip[], id: string): StillSlip[] {
  return mapCard(cards, id, (card) => {
    const at = HEATS.indexOf(card.heat as (typeof HEATS)[number]);
    const next = at < 0 ? HEATS[0] : HEATS[(at + 1) % HEATS.length];
    return next === card.heat ? card : { ...card, heat: next, audit: "heat" };
  });
}

export function addStillTag(cards: readonly StillSlip[], id: string, tag: string): StillSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readStills(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 10, 10 becomes 20, and 20 becomes 40. A span of 40 stays. */
export function lengthenStill(cards: readonly StillSlip[], id: string): StillSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 40) return card;
    const next = card.span === 20 ? 40 : card.span === 10 ? 20 : 10;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 40, 40 becomes 20, and 20 becomes 10. A span of 10 stays. */
export function shortenStill(cards: readonly StillSlip[], id: string): StillSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 10) return card;
    const next = card.span === 20 ? 10 : card.span === 40 ? 20 : 40;
    return { ...card, span: next, audit: "short" };
  });
}

export function raiseStill(cards: readonly StillSlip[], id: string): StillSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 1, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerStill(cards: readonly StillSlip[], id: string): StillSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkStillPin(cards: readonly StillSlip[], ids: readonly string[]): StillSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkStillVault(cards: readonly StillSlip[], ids: readonly string[]): StillSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, vaulted: true, held: false, audit: "vault" }));
}

export function bulkStillBoil(cards: readonly StillSlip[], ids: readonly string[]): StillSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, heat: "boil", audit: "heat" }));
}

export function bulkStillHoney(cards: readonly StillSlip[], ids: readonly string[]): StillSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, draught: "HONEY", audit: "draught" }));
}

export function bulkStillTag(cards: readonly StillSlip[], ids: readonly string[], tag: string): StillSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readStills(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly StillSlip[], ids: readonly string[], index: number, change: (list: readonly StillSlip[], id: string) => StillSlip[]): StillSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readStills(cards);
}

export function lengthenStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  return focused(cards, ids, index, lengthenStill);
}

export function shortenStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  return focused(cards, ids, index, shortenStill);
}

export function heatFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  return focused(cards, ids, index, cycleHeat);
}

export function raiseStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  return focused(cards, ids, index, raiseStill);
}

export function lowerStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  return focused(cards, ids, index, lowerStill);
}

export function pinStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  const id = ids[index];
  if (!id) return readStills(cards);
  const card = readStills(cards).find((item) => item.id === id);
  return card ? setStillPin(cards, id, !card.pinned) : readStills(cards);
}

export function holdStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  const id = ids[index];
  if (!id) return readStills(cards);
  const card = readStills(cards).find((item) => item.id === id);
  return card ? setStillHold(cards, id, !card.held) : readStills(cards);
}

export function starStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number): StillSlip[] {
  const id = ids[index];
  if (!id) return readStills(cards);
  const card = readStills(cards).find((item) => item.id === id);
  return card ? setStillStar(cards, id, !card.flagged) : readStills(cards);
}

export function tagStillFocused(cards: readonly StillSlip[], ids: readonly string[], index: number, tag: string): StillSlip[] {
  const id = ids[index];
  return id ? addStillTag(cards, id, tag) : readStills(cards);
}

export function readStillViews(raw: unknown): StillView[] {
  if (!Array.isArray(raw)) return [];
  const out: StillView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StillView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      draught: activeDraught(row.draught),
      heat: activeHeat(row.heat, HEATS),
      shelf: activeShelf(row.shelf),
      span: activeStillSpan(row.span),
      rank: activeStillRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addStillView(
  views: readonly StillView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    draught?: string;
    heat?: string;
    shelf?: string;
    span?: string;
    rank?: string;
  },
): StillView[] {
  const current = readStillViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: StillView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    draught: activeDraught(view.draught),
    heat: activeHeat(view.heat, HEATS),
    shelf: activeShelf(view.shelf),
    span: activeStillSpan(view.span),
    rank: activeStillRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropStillView(views: readonly StillView[], id: string): StillView[] {
  return readStillViews(views).filter((view) => view.id !== id);
}

export function stillDensity(raw: unknown): StillDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than one shelf behind the desk, at rank 1, is late. */
export function lateStill(card: StillSlip, deskShelf: unknown): boolean {
  const gap = shelfGap(card.shelf, deskShelf);
  return card.rank === 1 && gap !== null && gap > 1;
}

export function idleStill(card: StillSlip): boolean {
  return card.heat === "cool" && quietShelf(card.shelf) && card.rank === 1;
}

export function boilStill(card: StillSlip): boolean {
  return card.rank === 7 && card.heat === "boil" && peakShelf(card.shelf);
}

export function restingStill(card: StillSlip): boolean {
  return card.span === 40 && card.heat === "warm" && card.shelf === "cellar";
}

/** A ten-minute span on a peak shelf is overdue unless the slip is pinned. */
export function overdueStill(card: StillSlip): boolean {
  return card.span === 10 && peakShelf(card.shelf) && !card.pinned;
}

export function visibleStills(
  cards: readonly StillSlip[],
  tray: StillTray,
  query: string,
  keeper: string,
  draught: string,
  heat: string,
  shelf: string,
  span: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): StillSlip[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const draughtOn = draught === "all" ? "" : draughtOf(draught);
  const heatOn = heat === "all" ? "" : heatOf(heat);
  const shelfOn = shelf === "all" ? "" : activeShelf(shelf);
  const spanOn = span === "all" ? "" : activeStillSpan(span);
  const rankOn = rank === "all" ? "" : activeStillRank(rank);
  return readStills(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (draughtOn && card.draught !== draughtOn) return false;
    if (heatOn && card.heat !== heatOn) return false;
    if (shelfOn === "peak" && !peakShelf(card.shelf)) return false;
    if (shelfOn === "quiet" && !quietShelf(card.shelf)) return false;
    if (shelfOn && shelfOn !== "peak" && shelfOn !== "quiet" && card.shelf !== shelfOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseDraught(card.draught)) return false;
    if (peakOnly && !peakShelf(card.shelf)) return false;
    if (quietOnly && !quietShelf(card.shelf)) return false;
    return true;
  });
}

export function sortStills(cards: readonly StillSlip[], sort: StillSort): StillSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const shelf = (shelfIndex(a.shelf) < 0 ? 99 : shelfIndex(a.shelf)) - (shelfIndex(b.shelf) < 0 ? 99 : shelfIndex(b.shelf));
    if (shelf) return shelf;
    return a.title.localeCompare(b.title);
  });
}

export function stillCounts(cards: readonly StillSlip[], shown: readonly StillSlip[], deskShelf: unknown): StillCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    hold: cards.filter((card) => inTray(card, "hold")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakShelf(card.shelf)).length,
    quiet: open.filter((card) => quietShelf(card.shelf)).length,
    soon: open.filter((card) => card.span === 10).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseDraught(card.draught)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: shown.filter((card) => card.shelf && card.shelf === shelfOf(deskShelf)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleStill(card)).length,
    boil: open.filter((card) => boilStill(card)).length,
    resting: open.filter((card) => restingStill(card)).length,
    overdue: open.filter((card) => overdueStill(card)).length,
  };
}

export function clashShelfCount(cards: readonly StillSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.shelf);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.shelf === card.shelf && other.rank === card.rank)).length;
}

export function neighborStillCount(cards: readonly StillSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestStillKeeper(cards: readonly StillSlip[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.keeper);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.keeper.toLowerCase() === card.keeper.toLowerCase()).length;
    if (count > score) {
      best = card.keeper;
      score = count;
    }
  }
  return best;
}

export function reminderStills(cards: readonly StillSlip[]): StillSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.span === 10 || card.span === 20));
}

export function idleStills(cards: readonly StillSlip[]): StillSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleStill(card));
}

export function stillTimeline(cards: readonly StillSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function stillBars(cards: readonly StillSlip[]): { shelf: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return STILL_SHELVES.map((shelf) => ({ shelf, count: open.filter((card) => card.shelf === shelf).length }));
}

export function stillKeepers(cards: readonly StillSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function stillCopy(card: StillSlip): string {
  return [card.title, card.keeper, card.shelf, card.draught, card.heat, card.span ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function stillShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function stillCsv(cards: readonly StillSlip[], deskShelf: unknown): string {
  const lines = ["title,keeper,shelf,draught,heat,span,rank,tags,pinned,held,vaulted,starred,gap,late,idle,peak,quiet,house,band,boil,resting,overdue,audit,note"];
  for (const card of readStills(cards)) {
    const gap = shelfGap(card.shelf, deskShelf);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.shelf,
      card.draught,
      card.heat,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.vaulted ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateStill(card, deskShelf) ? "1" : "0",
      idleStill(card) ? "1" : "0",
      peakShelf(card.shelf) ? "1" : "0",
      quietShelf(card.shelf) ? "1" : "0",
      houseDraught(card.draught) ? "1" : "0",
      shelfBand(card.shelf),
      boilStill(card) ? "1" : "0",
      restingStill(card) ? "1" : "0",
      overdueStill(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function regionRecord(raw: RegionValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: RegionValue): boolean {
  const row = regionRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type RegionParts = { letters: string; tokens: string[]; wide: boolean; notch: boolean; plus: boolean; mark: boolean };

function regionSource(raw: RegionValue): string {
  if (hasBlocked(raw)) return "";
  const row = regionRecord(raw);
  if (row && !("lastRegion" in row) && !("region" in row)) return "";
  return row ? clip(row.lastRegion ?? row.region, 40) : clip(raw, 40);
}

function regionParts(raw: RegionValue): RegionParts | null {
  const text = regionSource(raw);
  if (!/^[A-Za-z][A-Za-z0-9\s.'&-]{1,39}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 28) return null;
  return {
    letters,
    tokens: text.split(/\s+/).filter(Boolean),
    wide: /\s/.test(text),
    notch: /-/.test(text),
    plus: /(?:^|\s)and(?:\s|$)|&/i.test(text),
    mark: /\d/.test(text),
  };
}

/** A blocked field clears the plate. A real region name is set. A blank or broken name is clear. */
export function regionState(raw: RegionValue): RegionState {
  if (hasBlocked(raw)) return "";
  const row = regionRecord(raw);
  if (row && !("lastRegion" in row) && !("region" in row)) return "";
  return regionParts(raw) ? "set" : "clear";
}

/** A short single name is brief, a longer town is desk, two names are hall, and a belt is long. */
export function regionLane(raw: RegionValue): RegionLane {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  if (!parts) return "";
  if (parts.tokens.length >= 3) return "long";
  if (parts.tokens.length === 2) return "hall";
  if (parts.letters.length <= 6) return "brief";
  if (parts.letters.length <= 10) return "desk";
  return "long";
}

/** The first four letters. */
export function regionStamp(raw: RegionValue): string {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return parts ? parts.letters.slice(0, 4).toUpperCase() : "";
}

/** A first letter A–H is ivory, I–Q graphite, and R–Z champagne. */
export function regionHue(raw: RegionValue): RegionHue {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  if (!parts) return "";
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 72) return "ivory";
  if (code >= 73 && code <= 81) return "graphite";
  return "champagne";
}

/** Two identical letters stand together. */
export function regionPair(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function regionWide(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function regionNotch(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function regionEcho(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function regionLeap(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return Boolean(parts && parts.letters.length === 8);
}

export function regionPlus(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return Boolean(parts && parts.plus);
}

export function regionMark(raw: RegionValue): boolean {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return Boolean(parts && parts.mark);
}

export function regionStep(raw: RegionValue): number {
  const parts = regionState(raw) === "set" ? regionParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function regionLanes(rows: readonly RegionRow[]): RegionLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = regionLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRegion(rows: readonly RegionRow[]): string {
  const bars = regionLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingRegionHue(rows: readonly RegionRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = regionHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedRegionCount(rows: readonly RegionRow[]): number {
  const marks = rows.map((row) => regionStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneRegionCount(rows: readonly RegionRow[], lane: RegionLane): number {
  return rows.filter((row) => regionLane(row.note) === lane).length;
}

export function regionShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRegionLanes(rows: readonly RegionRow[]): string[] {
  return regionLanes(rows).map((line) => line.lane);
}

export function readHiddenRegions(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRegions(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRegion(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRegionReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRegionReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRegionLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleRegions(
  rows: readonly RegionRow[],
  lane: string,
  hue: string,
  query: string,
  review: RegionReview,
  reviewed: readonly string[],
  shape: RegionShape,
): RegionRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (regionState(row.note) === "") return false;
    const found = regionLane(row.note);
    const hueName = regionHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${regionSource(row.note)} ${regionStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "brief" && found !== "brief") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "wide" && !regionWide(row.note)) return false;
    if (shape === "notch" && !regionNotch(row.note)) return false;
    if (shape === "leap" && !regionLeap(row.note)) return false;
    if (shape === "plus" && !regionPlus(row.note)) return false;
    if (shape === "pair" && !regionPair(row.note)) return false;
    if (shape === "mark" && !regionMark(row.note)) return false;
    return true;
  });
}

export function regionCopy(raw: RegionValue): string {
  return [regionStamp(raw), regionLane(raw), regionHue(raw)].filter(Boolean).join(" ");
}

export function regionLanesCsv(rows: readonly RegionRow[]): string {
  const lines = ["lane,count"];
  for (const line of regionLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function regionRowsCsv(rows: readonly RegionRow[], reviewed: readonly string[]): string {
  const lines = ["name,region,stamp,lane,hue,step,echo,wide,notch,leap,plus,pair,mark,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (regionState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(regionSource(row.note)),
      regionStamp(row.note),
      regionLane(row.note),
      regionHue(row.note),
      String(regionStep(row.note)),
      regionEcho(row.note) ? "1" : "0",
      regionWide(row.note) ? "1" : "0",
      regionNotch(row.note) ? "1" : "0",
      regionLeap(row.note) ? "1" : "0",
      regionPlus(row.note) ? "1" : "0",
      regionPair(row.note) ? "1" : "0",
      regionMark(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
