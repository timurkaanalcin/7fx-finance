/**
 * Cistern slips for a courtesy depth book, and join plates already stored as createdAt.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cistern_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   tide text not null default '',
 *   vessel text not null default '',
 *   pace text not null default '',
 *   span_days integer,
 *   depth_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   waiting boolean not null default false,
 *   filed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_join_plate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_join_plate_review (
 *   trader_id text primary key
 * );
 */

export const RLQ_KEY = "crmv4-cistern-slip";
export const RLQ_VIEW_KEY = "crmv4-cistern-views";
export const RLQ_DENSITY_KEY = "crmv4-cistern-density";
export const NTP_KEY = "crmv4-join-hide";
export const NTP_REVIEW_KEY = "crmv4-join-review";

export const RELIC_SEASONS = ["ebb", "neap", "flood", "spring"] as const;

export type RelicSeason = (typeof RELIC_SEASONS)[number];

export type FiberName = "blank" | "linen" | "wool" | "silk";

export type CadenceName = "blank" | "hush" | "walk" | "rush";

export type RelicTray = "open" | "held" | "shelved";

export type RelicDensity = "airy" | "tight";

export type RelicSort = "season" | "keeper";

export type RelicSlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  season: string;
  window: number | null;
  fiber: string;
  cadence: string;
  warmth: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  shelved: boolean;
  flagged: boolean;
  audit: string;
};

export type RelicView = {
  id: string;
  name: string;
  tray: RelicTray;
  query: string;
  keeper: string;
  fiber: string;
  cadence: string;
  season: string;
  window: string;
  warmth: string;
};

export type RelicCounts = {
  open: number;
  held: number;
  shelved: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  warmth: number;
  house: number;
  window: number;
  matched: number;
  flagged: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type PlateLane = "" | "night" | "morning" | "afternoon" | "evening";

export type PlateHue = "" | "ivory" | "graphite" | "champagne";

export type PlateState = "" | "clear" | "set";

export type PlateShape = "all" | "night" | "morning" | "afternoon" | "evening" | "wide" | "notch" | "leap" | "weekend";

export type PlateReview = "all" | "reviewed" | "fresh";

export type PlateValue = string | { createdAt?: unknown; [key: string]: unknown } | null | undefined;

export type PlateRow = { id: string; label: string; note: PlateValue };

export type PlateLaneLine = { lane: string; count: number };

export const ROUND257_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "wait",
  "file",
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
  "fair-warden",
  "viewer",
  "suggest",
  "sla",
  "join",
  "join-csv",
] as const;

const AUDITS = ["save", "edit", "note", "cadence", "pin", "unpin", "hold", "resume", "shelve", "open", "fiber", "tag", "warmth", "window", "short", "flag"] as const;

const FIBERS = ["clay", "stone", "glass"] as const;

const CADENCES = ["still", "drift", "surge"] as const;

const WINDOW_CYCLE = [3, 9, 21] as const;

const WARMTH_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["flood", "spring"]);

const QUIET = new Set(["ebb", "neap"]);

const HOUSE = new Set(["CLAY", "STONE"]);

const EARLY = new Set(["ebb", "neap"]);

const LANE_ORDER = ["night", "morning", "afternoon", "evening"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RelicTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function fiberName(raw: unknown): Exclude<FiberName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FIBERS as readonly string[]).includes(text) ? (text as Exclude<FiberName, "blank">) : "";
}

function cadenceName(raw: unknown): Exclude<CadenceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CADENCES as readonly string[]).includes(text) ? (text as Exclude<CadenceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[mnop]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: RelicSlip, tray: RelicTray): boolean {
  if (tray === "held") return card.held && !card.shelved;
  if (tray === "shelved") return card.shelved;
  return !card.held && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function seasonIndex(season: string): number {
  return RELIC_SEASONS.indexOf(season as RelicSeason);
}

function warmthIndex(warmth: number): number {
  return WARMTH_CYCLE.indexOf(warmth as (typeof WARMTH_CYCLE)[number]);
}

function relicLine(raw: unknown): string {
  return clip(raw, 48);
}

function relicNote(raw: unknown): string {
  return clip(raw, 80);
}

export function seasonOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RELIC_SEASONS as readonly string[]).includes(text) ? text : "";
}

/** The SLA span is 3, 9, or 21 days. Anything else stays blank. */
export function windowOf(raw: unknown): 3 | 9 | 21 | null {
  const value = Number(clip(raw, 2));
  return (WINDOW_CYCLE as readonly number[]).includes(value) ? (value as 3 | 9 | 21) : null;
}

/** Depth is 1, 3, 5, or 7. Anything else stays blank. */
export function warmthOf(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (WARMTH_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Vessel is clay, stone, or glass. The saved vessel is CLAY, STONE, or GLASS. */
export function fiberOf(raw: unknown): string {
  const text = fiberName(raw);
  return text ? text.toUpperCase() : "";
}

/** Pace is still, drift, or surge. A blank pace stays blank. */
export function cadenceOf(raw: unknown): string {
  return cadenceName(raw);
}

export function peakSeason(season: unknown): boolean {
  return PEAK.has(clip(season, 12).toLowerCase());
}

export function quietSeason(season: unknown): boolean {
  return QUIET.has(clip(season, 12).toLowerCase());
}

/** Early is ebb and neap. Mid is flood. Late is spring. */
export function seasonBand(season: unknown): string {
  const text = seasonOf(season);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "flood") return "mid";
  return "late";
}

/** Signed distance from the slip season to the desk season. */
export function seasonGap(from: unknown, to: unknown): number | null {
  const left = seasonIndex(seasonOf(from));
  const right = seasonIndex(seasonOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFiber(fiber: unknown): boolean {
  return HOUSE.has(fiberOf(fiber));
}

export function activeSeason(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return seasonOf(text) || "all";
}

export function activeWindow(raw: unknown): string {
  const window = windowOf(raw);
  return window === null ? "all" : String(window);
}

export function activeCadence(raw: unknown, allow: readonly string[]): string {
  const text = cadenceOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeWarmth(raw: unknown): string {
  const warmth = warmthOf(raw);
  return warmth === null ? "all" : String(warmth);
}

export function activeFiber(raw: unknown): string {
  const text = fiberName(raw);
  return text || "all";
}

export function moveSlipFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFiber(cards: readonly RelicSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.fiber) continue;
    counts.set(card.fiber, (counts.get(card.fiber) || 0) + 1);
  }
  let best = "CLAY";
  let score = 0;
  for (const fiber of ["CLAY", "STONE", "GLASS"]) {
    const count = counts.get(fiber) || 0;
    if (count > score) {
      best = fiber;
      score = count;
    }
  }
  return best;
}

/** A morning desk asks for a short span. An evening desk asks for a long one. Saved spans win when any exist. */
export function suggestWindow(cards: readonly RelicSlip[], hour: number): 3 | 9 | 21 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.window === null) continue;
    counts.set(card.window, (counts.get(card.window) || 0) + 1);
  }
  let best: 3 | 9 | 21 | null = null;
  let score = 0;
  for (const window of WINDOW_CYCLE) {
    const count = counts.get(window) || 0;
    if (count > score) {
      best = window;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 10) return 3;
  if (hour < 16) return 9;
  return 21;
}

/** The keeper with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairKeeper(cards: readonly RelicSlip[], roster: string): string {
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

export function readSlips(raw: unknown): RelicSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: RelicSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RelicSlip>;
    const id = clip(row.id, 40);
    const title = relicLine(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: relicNote(row.note),
      keeper: clip(row.keeper, 24),
      season: seasonOf(row.season),
      window: windowOf(row.window),
      fiber: fiberOf(row.fiber),
      cadence: cadenceOf(row.cadence),
      warmth: warmthOf(row.warmth) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      shelved: row.shelved === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addSlip(
  cards: readonly RelicSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    season?: string;
    window?: unknown;
    fiber?: string;
    cadence?: string;
    warmth?: unknown;
    tags?: string;
  },
): RelicSlip[] {
  const current = readSlips(cards);
  const id = clip(card.id, 40);
  const title = relicLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: RelicSlip = {
    id,
    title,
    note: relicNote(card.note),
    keeper: clip(card.keeper, 24),
    season: seasonOf(card.season),
    window: windowOf(card.window),
    fiber: fiberOf(card.fiber),
    cadence: cadenceOf(card.cadence),
    warmth: warmthOf(card.warmth) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly RelicSlip[], id: string, change: (card: RelicSlip) => RelicSlip): RelicSlip[] {
  return readSlips(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly RelicSlip[], ids: readonly string[], change: (card: RelicSlip) => RelicSlip): RelicSlip[] {
  const picked = new Set(ids);
  return readSlips(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editSlip(cards: readonly RelicSlip[], id: string, title: string): RelicSlip[] {
  const next = relicLine(title);
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSlipNote(cards: readonly RelicSlip[], id: string, note: string): RelicSlip[] {
  const next = relicNote(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setSlipPin(cards: readonly RelicSlip[], id: string, pinned: boolean): RelicSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSlipWait(cards: readonly RelicSlip[], id: string, held: boolean): RelicSlip[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, shelved: held ? false : card.shelved, audit: held ? "hold" : "resume" }));
}

export function setSlipFile(cards: readonly RelicSlip[], id: string, shelved: boolean): RelicSlip[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, held: shelved ? false : card.held, audit: shelved ? "shelve" : "open" }));
}

export function setSlipStar(cards: readonly RelicSlip[], id: string, flagged: boolean): RelicSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setSlipFiber(cards: readonly RelicSlip[], id: string, fiber: unknown): RelicSlip[] {
  const next = fiberOf(fiber);
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => (card.fiber === next ? card : { ...card, fiber: next, audit: "fiber" }));
}

/** Pace steps still, drift, surge, then still again. A blank pace starts at still. */
export function cycleCadence(cards: readonly RelicSlip[], id: string): RelicSlip[] {
  return mapCard(cards, id, (card) => {
    const at = CADENCES.indexOf(card.cadence as (typeof CADENCES)[number]);
    const next = at < 0 ? CADENCES[0] : CADENCES[(at + 1) % CADENCES.length];
    return next === card.cadence ? card : { ...card, cadence: next, audit: "cadence" };
  });
}

export function addSlipTag(cards: readonly RelicSlip[], id: string, tag: string): RelicSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 3, 3 becomes 9, and 9 becomes 21. A span of 21 stays. */
export function lengthenWindow(cards: readonly RelicSlip[], id: string): RelicSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.window === 21) return card;
    const next = card.window === 9 ? 21 : card.window === 3 ? 9 : 3;
    return { ...card, window: next, audit: "window" };
  });
}

/** A blank span becomes 21, 21 becomes 9, and 9 becomes 3. A span of 3 stays. */
export function shortenWindow(cards: readonly RelicSlip[], id: string): RelicSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.window === 3) return card;
    const next = card.window === 9 ? 3 : card.window === 21 ? 9 : 21;
    return { ...card, window: next, audit: "short" };
  });
}

export function raiseWarmth(cards: readonly RelicSlip[], id: string): RelicSlip[] {
  return mapCard(cards, id, (card) => {
    const at = warmthIndex(card.warmth);
    if (at < 0) return { ...card, warmth: 1, audit: "warmth" };
    if (at === WARMTH_CYCLE.length - 1) return card;
    return { ...card, warmth: WARMTH_CYCLE[at + 1], audit: "warmth" };
  });
}

export function lowerWarmth(cards: readonly RelicSlip[], id: string): RelicSlip[] {
  return mapCard(cards, id, (card) => {
    const at = warmthIndex(card.warmth);
    if (at <= 0) return card;
    return { ...card, warmth: WARMTH_CYCLE[at - 1], audit: "warmth" };
  });
}

export function bulkSlipPin(cards: readonly RelicSlip[], ids: readonly string[]): RelicSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkSlipFile(cards: readonly RelicSlip[], ids: readonly string[]): RelicSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, shelved: true, held: false, audit: "shelve" }));
}

export function bulkSlipRush(cards: readonly RelicSlip[], ids: readonly string[]): RelicSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, cadence: "rush", audit: "cadence" }));
}

export function bulkSlipGlass(cards: readonly RelicSlip[], ids: readonly string[]): RelicSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, fiber: "GLASS", audit: "fiber" }));
}

export function bulkSlipTag(cards: readonly RelicSlip[], ids: readonly string[], tag: string): RelicSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSlips(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly RelicSlip[], ids: readonly string[], index: number, change: (list: readonly RelicSlip[], id: string) => RelicSlip[]): RelicSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readSlips(cards);
}

export function lengthenFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  return focused(cards, ids, index, lengthenWindow);
}

export function shortenFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  return focused(cards, ids, index, shortenWindow);
}

export function paceFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  return focused(cards, ids, index, cycleCadence);
}

export function raiseFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  return focused(cards, ids, index, raiseWarmth);
}

export function lowerFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  return focused(cards, ids, index, lowerWarmth);
}

export function pinFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipPin(cards, id, !card.pinned) : readSlips(cards);
}

export function waitFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipWait(cards, id, !card.held) : readSlips(cards);
}

export function starFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number): RelicSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipStar(cards, id, !card.flagged) : readSlips(cards);
}

export function tagFocusedSlip(cards: readonly RelicSlip[], ids: readonly string[], index: number, tag: string): RelicSlip[] {
  const id = ids[index];
  return id ? addSlipTag(cards, id, tag) : readSlips(cards);
}

export function readSlipViews(raw: unknown): RelicView[] {
  if (!Array.isArray(raw)) return [];
  const out: RelicView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RelicView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      fiber: activeFiber(row.fiber),
      cadence: activeCadence(row.cadence, CADENCES),
      season: activeSeason(row.season),
      window: activeWindow(row.window),
      warmth: activeWarmth(row.warmth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(
  views: readonly RelicView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    fiber?: string;
    cadence?: string;
    season?: string;
    window?: string;
    warmth?: string;
  },
): RelicView[] {
  const current = readSlipViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: RelicView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    fiber: activeFiber(view.fiber),
    cadence: activeCadence(view.cadence, CADENCES),
    season: activeSeason(view.season),
    window: activeWindow(view.window),
    warmth: activeWarmth(view.warmth),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly RelicView[], id: string): RelicView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

export function relicDensity(raw: unknown): RelicDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than one tide behind the desk, at depth 1, is late. */
export function lateSlip(card: RelicSlip, deskSeason: unknown): boolean {
  const gap = seasonGap(card.season, deskSeason);
  return card.warmth === 1 && gap !== null && gap > 1;
}

export function idleSlip(card: RelicSlip): boolean {
  return card.cadence === "still" && quietSeason(card.season) && card.warmth === 1;
}

export function rushSlip(card: RelicSlip): boolean {
  return card.warmth === 7 && card.cadence === "surge" && peakSeason(card.season);
}

export function restingSlip(card: RelicSlip): boolean {
  return card.window === 21 && card.cadence === "drift" && card.season === "neap";
}

/** A three-day span on a peak tide is overdue unless the slip is pinned. */
export function overdueSlip(card: RelicSlip): boolean {
  return card.window === 3 && peakSeason(card.season) && !card.pinned;
}

export function visibleSlips(
  cards: readonly RelicSlip[],
  tray: RelicTray,
  query: string,
  keeper: string,
  fiber: string,
  cadence: string,
  season: string,
  window: string,
  warmth: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): RelicSlip[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const fiberOn = fiber === "all" ? "" : fiberOf(fiber);
  const cadenceOn = cadence === "all" ? "" : cadenceOf(cadence);
  const seasonOn = season === "all" ? "" : activeSeason(season);
  const windowOn = window === "all" ? "" : activeWindow(window);
  const warmthOn = warmth === "all" ? "" : activeWarmth(warmth);
  return readSlips(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (fiberOn && card.fiber !== fiberOn) return false;
    if (cadenceOn && card.cadence !== cadenceOn) return false;
    if (seasonOn === "peak" && !peakSeason(card.season)) return false;
    if (seasonOn === "quiet" && !quietSeason(card.season)) return false;
    if (seasonOn && seasonOn !== "peak" && seasonOn !== "quiet" && card.season !== seasonOn) return false;
    if (windowOn && String(card.window ?? "") !== windowOn) return false;
    if (warmthOn && String(card.warmth) !== warmthOn) return false;
    if (houseOnly && !houseFiber(card.fiber)) return false;
    if (peakOnly && !peakSeason(card.season)) return false;
    if (quietOnly && !quietSeason(card.season)) return false;
    return true;
  });
}

export function sortSlips(cards: readonly RelicSlip[], sort: RelicSort): RelicSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const season = (seasonIndex(a.season) < 0 ? 99 : seasonIndex(a.season)) - (seasonIndex(b.season) < 0 ? 99 : seasonIndex(b.season));
    if (season) return season;
    return a.title.localeCompare(b.title);
  });
}

export function slipCounts(cards: readonly RelicSlip[], shown: readonly RelicSlip[], deskSeason: unknown): RelicCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    shelved: cards.filter((card) => inTray(card, "shelved")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakSeason(card.season)).length,
    quiet: open.filter((card) => quietSeason(card.season)).length,
    soon: open.filter((card) => card.window === 3).length,
    warmth: open.reduce((sum, card) => sum + card.warmth, 0),
    house: open.filter((card) => houseFiber(card.fiber)).length,
    window: open.filter((card) => card.window !== null).length,
    matched: open.filter((card) => card.season && card.season === seasonOf(deskSeason)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleSlip(card)).length,
    rush: open.filter((card) => rushSlip(card)).length,
    resting: open.filter((card) => restingSlip(card)).length,
    overdue: open.filter((card) => overdueSlip(card)).length,
  };
}

export function clashSeasonCount(cards: readonly RelicSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.season);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.season === card.season && other.warmth === card.warmth)).length;
}

export function neighborSlipCount(cards: readonly RelicSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && warmthIndex(card.warmth) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(warmthIndex(other.warmth) - warmthIndex(card.warmth));
    const ring = Math.min(gap, WARMTH_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly RelicSlip[]): string {
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

export function reminderSlips(cards: readonly RelicSlip[]): RelicSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.window === 3 || card.window === 9));
}

export function idleSlips(cards: readonly RelicSlip[]): RelicSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleSlip(card));
}

export function slipTimeline(cards: readonly RelicSlip[]): { warmth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return WARMTH_CYCLE.map((warmth) => ({ warmth, titles: open.filter((card) => card.warmth === warmth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function slipBars(cards: readonly RelicSlip[]): { season: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RELIC_SEASONS.map((season) => ({ season, count: open.filter((card) => card.season === season).length }));
}

export function slipKeepers(cards: readonly RelicSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function slipCopy(card: RelicSlip): string {
  return [card.title, card.keeper, card.season, card.fiber, card.cadence, card.window ?? "", card.warmth, card.note].filter((item) => item !== "").join(" · ");
}

export function slipShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function slipCsv(cards: readonly RelicSlip[], deskSeason: unknown): string {
  const lines = ["title,keeper,season,fiber,cadence,window,warmth,tags,pinned,waiting,filed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readSlips(cards)) {
    const gap = seasonGap(card.season, deskSeason);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.season,
      card.fiber,
      card.cadence,
      card.window === null ? "" : String(card.window),
      String(card.warmth),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.shelved ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(card, deskSeason) ? "1" : "0",
      idleSlip(card) ? "1" : "0",
      peakSeason(card.season) ? "1" : "0",
      quietSeason(card.season) ? "1" : "0",
      houseFiber(card.fiber) ? "1" : "0",
      seasonBand(card.season),
      rushSlip(card) ? "1" : "0",
      restingSlip(card) ? "1" : "0",
      overdueSlip(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function plateRecord(raw: PlateValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: PlateValue): boolean {
  const row = plateRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type PlateParts = { year: number; month: number; day: number; hour: number; minute: number };

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function plateParts(raw: PlateValue): PlateParts | null {
  if (hasBlocked(raw)) return null;
  const row = plateRecord(raw);
  if (row && !("createdAt" in row)) return null;
  const text = row ? clip(row.createdAt, 40) : clip(raw, 40);
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] === undefined ? 0 : Number(match[4]);
  const minute = match[5] === undefined ? 0 : Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

function plateText(raw: PlateValue): string {
  const parts = plateParts(raw);
  if (!parts) return "";
  const date = `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return `${date}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

/** A blocked field clears the plate. A real join instant is set. A blank or impossible instant is clear. */
export function plateState(raw: PlateValue): PlateState {
  if (hasBlocked(raw)) return "";
  const row = plateRecord(raw);
  if (row && !("createdAt" in row)) return "";
  return plateParts(raw) ? "set" : "clear";
}

/** Night is 00–05, morning 06–11, afternoon 12–17, and evening 18–23 UTC. */
export function plateLane(raw: PlateValue): PlateLane {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return "";
  if (parts.hour <= 5) return "night";
  if (parts.hour <= 11) return "morning";
  if (parts.hour <= 17) return "afternoon";
  return "evening";
}

/** 1430 for 14:30 UTC. A date with no clock is 0000. */
export function plateStamp(raw: PlateValue): string {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return "";
  return `${String(parts.hour).padStart(2, "0")}${String(parts.minute).padStart(2, "0")}`;
}

/** The first twenty minutes are ivory, the next twenty graphite, and the rest champagne. */
export function plateHue(raw: PlateValue): PlateHue {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return "";
  if (parts.minute <= 19) return "ivory";
  if (parts.minute <= 39) return "graphite";
  return "champagne";
}

/** Saturday or Sunday in UTC. */
export function plateSpoken(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return false;
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return day === 0 || day === 6;
}

export function plateWide(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return Boolean(parts && parts.hour >= 18);
}

export function plateNotch(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return Boolean(parts && (parts.minute === 0 || parts.minute === 30));
}

export function plateEcho(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return false;
  return parts.minute === 11 || parts.minute === 22;
}

export function plateLeap(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return Boolean(parts && parts.month === 2 && parts.day === 29);
}

export function plateStep(raw: PlateValue): number {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return parts ? parts.hour : 0;
}

export function plateLanes(rows: readonly PlateRow[]): PlateLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = plateLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPlate(rows: readonly PlateRow[]): string {
  const bars = plateLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPlateHue(rows: readonly PlateRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = plateHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedPlateCount(rows: readonly PlateRow[]): number {
  const marks = rows.map((row) => plateStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function lanePlateCount(rows: readonly PlateRow[], lane: PlateLane): number {
  return rows.filter((row) => plateLane(row.note) === lane).length;
}

export function huePlateCount(rows: readonly PlateRow[], hue: PlateHue): number {
  return rows.filter((row) => plateHue(row.note) === hue).length;
}

export function plateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPlateLanes(rows: readonly PlateRow[]): string[] {
  return plateLanes(rows).map((line) => line.lane);
}

export function readHiddenPlates(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPlates(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePlate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visiblePlates(
  rows: readonly PlateRow[],
  lane: string,
  hue: string,
  query: string,
  review: PlateReview,
  reviewed: readonly string[],
  shape: PlateShape,
): PlateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (plateState(row.note) === "") return false;
    const found = plateLane(row.note);
    const hueName = plateHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${plateText(row.note)} ${plateStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "night" && found !== "night") return false;
    if (shape === "morning" && found !== "morning") return false;
    if (shape === "afternoon" && found !== "afternoon") return false;
    if (shape === "evening" && found !== "evening") return false;
    if (shape === "wide" && !plateWide(row.note)) return false;
    if (shape === "notch" && !plateNotch(row.note)) return false;
    if (shape === "leap" && !plateLeap(row.note)) return false;
    if (shape === "weekend" && !plateSpoken(row.note)) return false;
    return true;
  });
}

export function plateCopy(raw: PlateValue): string {
  return [plateStamp(raw), plateLane(raw), plateHue(raw)].filter(Boolean).join(" ");
}

export function plateLanesCsv(rows: readonly PlateRow[]): string {
  const lines = ["lane,count"];
  for (const line of plateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function plateRowsCsv(rows: readonly PlateRow[], reviewed: readonly string[]): string {
  const lines = ["name,joined,stamp,lane,hue,step,echo,wide,notch,leap,weekend,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (plateState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      plateText(row.note),
      plateStamp(row.note),
      plateLane(row.note),
      plateHue(row.note),
      String(plateStep(row.note)),
      plateEcho(row.note) ? "1" : "0",
      plateWide(row.note) ? "1" : "0",
      plateNotch(row.note) ? "1" : "0",
      plateLeap(row.note) ? "1" : "0",
      plateSpoken(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
