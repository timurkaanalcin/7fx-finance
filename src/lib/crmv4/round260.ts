/**
 * Greenhouse slips for a retention garden, and dial plates already stored as a trader phone.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_greenhouse_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   place text not null default '',
 *   herb text not null default '',
 *   climate text not null default '',
 *   span_min integer,
 *   rank_no integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   benched boolean not null default false,
 *   stored boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_dial_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_dial_review (
 *   trader_id text primary key
 * );
 */

export const GHS_KEY = "crmv4-greenhouse-slip";
export const GHS_VIEW_KEY = "crmv4-greenhouse-views";
export const GHS_DENSITY_KEY = "crmv4-greenhouse-density";
export const DLP_KEY = "crmv4-dial-hide";
export const DLP_REVIEW_KEY = "crmv4-dial-review";

export const GREEN_PLACES = ["bed", "path", "glass", "pot"] as const;

export type GreenPlace = (typeof GREEN_PLACES)[number];

export type HerbName = "blank" | "mint" | "sage" | "bay";

export type ClimateName = "blank" | "dew" | "sun" | "gale";

export type GreenhouseTray = "row" | "bench" | "store";

export type GreenhouseDensity = "airy" | "tight";

export type GreenhouseSort = "place" | "keeper";

export type GreenhouseSlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  place: string;
  span: number | null;
  herb: string;
  climate: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  benched: boolean;
  stored: boolean;
  flagged: boolean;
  audit: string;
};

export type GreenhouseView = {
  id: string;
  name: string;
  tray: GreenhouseTray;
  query: string;
  keeper: string;
  herb: string;
  climate: string;
  place: string;
  span: string;
  rank: string;
};

export type GreenhouseCounts = {
  row: number;
  bench: number;
  store: number;
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
  gale: number;
  resting: number;
  overdue: number;
};

export type DialLane = "" | "brief" | "desk" | "hall" | "long";

export type DialHue = "" | "ivory" | "graphite" | "champagne";

export type DialState = "" | "clear" | "set";

export type DialShape = "all" | "brief" | "desk" | "hall" | "long" | "wide" | "notch" | "leap" | "plus" | "pair";

export type DialReview = "all" | "reviewed" | "fresh";

export type DialValue = string | { phone?: unknown; [key: string]: unknown } | null | undefined;

export type DialRow = { id: string; label: string; note: DialValue };

export type DialLaneLine = { lane: string; count: number };

export const ROUND260_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "span",
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "dial",
  "dial-csv",
] as const;

const AUDITS = ["save", "edit", "note", "climate", "pin", "unpin", "bench", "resume", "store", "open", "herb", "tag", "rank", "span", "short", "flag"] as const;

const HERBS = ["mint", "sage", "bay"] as const;

const CLIMATES = ["dew", "sun", "gale"] as const;

const SPAN_CYCLE = [5, 15, 45] as const;

const RANK_CYCLE = [2, 4, 6, 8] as const;

const PEAK = new Set(["path", "glass"]);

const QUIET = new Set(["bed", "pot"]);

const HOUSE = new Set(["MINT", "SAGE"]);

const EARLY = new Set(["bed", "path"]);

const LANE_ORDER = ["brief", "desk", "hall", "long"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GreenhouseTray {
  return raw === "bench" || raw === "store" ? raw : "row";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function herbName(raw: unknown): Exclude<HerbName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HERBS as readonly string[]).includes(text) ? (text as Exclude<HerbName, "blank">) : "";
}

function climateName(raw: unknown): Exclude<ClimateName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLIMATES as readonly string[]).includes(text) ? (text as Exclude<ClimateName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pqr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: GreenhouseSlip, tray: GreenhouseTray): boolean {
  if (tray === "bench") return card.benched && !card.stored;
  if (tray === "store") return card.stored;
  return !card.benched && !card.stored;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function placeIndex(place: string): number {
  return GREEN_PLACES.indexOf(place as GreenPlace);
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

export function plotOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GREEN_PLACES as readonly string[]).includes(text) ? text : "";
}

/** The garden span is 5, 15, or 45 minutes. Anything else stays blank. */
export function spanOf(raw: unknown): 5 | 15 | 45 | null {
  const value = Number(clip(raw, 2));
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 5 | 15 | 45) : null;
}

/** Rank is 2, 4, 6, or 8. Anything else stays blank. */
export function rankOf(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Herb is mint, sage, or bay. The saved herb is MINT, SAGE, or BAY. */
export function herbOf(raw: unknown): string {
  const text = herbName(raw);
  return text ? text.toUpperCase() : "";
}

/** Climate is dew, sun, or gale. A blank climate stays blank. */
export function climateOf(raw: unknown): string {
  return climateName(raw);
}

export function peakPlot(place: unknown): boolean {
  return PEAK.has(clip(place, 12).toLowerCase());
}

export function quietPlot(place: unknown): boolean {
  return QUIET.has(clip(place, 12).toLowerCase());
}

/** Early is bed and path. Mid is glass. Late is pot. */
export function plotBand(place: unknown): string {
  const text = plotOf(place);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "glass") return "mid";
  return "late";
}

/** Signed distance from the slip place to the desk place. */
export function plotGap(from: unknown, to: unknown): number | null {
  const left = placeIndex(plotOf(from));
  const right = placeIndex(plotOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseHerb(herb: unknown): boolean {
  return HOUSE.has(herbOf(herb));
}

export function activePlot(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return plotOf(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function activeClimate(raw: unknown, allow: readonly string[]): string {
  const text = climateOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRank(raw: unknown): string {
  const rank = rankOf(raw);
  return rank === null ? "all" : String(rank);
}

export function activeHerb(raw: unknown): string {
  const text = herbName(raw);
  return text || "all";
}

export function moveSlipFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestHerb(cards: readonly GreenhouseSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "row") || !card.herb) continue;
    counts.set(card.herb, (counts.get(card.herb) || 0) + 1);
  }
  let best = "MINT";
  let score = 0;
  for (const herb of ["MINT", "SAGE", "BAY"]) {
    const count = counts.get(herb) || 0;
    if (count > score) {
      best = herb;
      score = count;
    }
  }
  return best;
}

/** A dawn desk asks for a short span. An evening desk asks for a long one. Saved spans win when any exist. */
export function suggestSpan(cards: readonly GreenhouseSlip[], hour: number): 5 | 15 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "row") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 5 | 15 | 45 | null = null;
  let score = 0;
  for (const span of SPAN_CYCLE) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 8) return 5;
  if (hour < 16) return 15;
  return 45;
}

/** The keeper with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairKeeper(cards: readonly GreenhouseSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "row") && !card.pinned);
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

export function readSlips(raw: unknown): GreenhouseSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: GreenhouseSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GreenhouseSlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      place: plotOf(row.place),
      span: spanOf(row.span),
      herb: herbOf(row.herb),
      climate: climateOf(row.climate),
      rank: rankOf(row.rank) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      benched: row.benched === true,
      stored: row.stored === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addSlip(
  cards: readonly GreenhouseSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    place?: string;
    span?: unknown;
    herb?: string;
    climate?: string;
    rank?: unknown;
    tags?: string;
  },
): GreenhouseSlip[] {
  const current = readSlips(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: GreenhouseSlip = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    place: plotOf(card.place),
    span: spanOf(card.span),
    herb: herbOf(card.herb),
    climate: climateOf(card.climate),
    rank: rankOf(card.rank) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    benched: false,
    stored: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly GreenhouseSlip[], id: string, change: (card: GreenhouseSlip) => GreenhouseSlip): GreenhouseSlip[] {
  return readSlips(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly GreenhouseSlip[], ids: readonly string[], change: (card: GreenhouseSlip) => GreenhouseSlip): GreenhouseSlip[] {
  const picked = new Set(ids);
  return readSlips(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editSlip(cards: readonly GreenhouseSlip[], id: string, title: string): GreenhouseSlip[] {
  const next = lineOf(title);
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSlipNote(cards: readonly GreenhouseSlip[], id: string, note: string): GreenhouseSlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setSlipPin(cards: readonly GreenhouseSlip[], id: string, pinned: boolean): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSlipBench(cards: readonly GreenhouseSlip[], id: string, benched: boolean): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => (card.benched === benched ? card : { ...card, benched, stored: benched ? false : card.stored, audit: benched ? "bench" : "resume" }));
}

export function setSlipStore(cards: readonly GreenhouseSlip[], id: string, stored: boolean): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => (card.stored === stored ? card : { ...card, stored, benched: stored ? false : card.benched, audit: stored ? "store" : "open" }));
}

export function setSlipStar(cards: readonly GreenhouseSlip[], id: string, flagged: boolean): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setSlipHerb(cards: readonly GreenhouseSlip[], id: string, herb: unknown): GreenhouseSlip[] {
  const next = herbOf(herb);
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => (card.herb === next ? card : { ...card, herb: next, audit: "herb" }));
}

/** Climate steps dew, sun, gale, then dew again. A blank climate starts at dew. */
export function cycleClimate(cards: readonly GreenhouseSlip[], id: string): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => {
    const at = CLIMATES.indexOf(card.climate as (typeof CLIMATES)[number]);
    const next = at < 0 ? CLIMATES[0] : CLIMATES[(at + 1) % CLIMATES.length];
    return next === card.climate ? card : { ...card, climate: next, audit: "climate" };
  });
}

export function addSlipTag(cards: readonly GreenhouseSlip[], id: string, tag: string): GreenhouseSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 5, 5 becomes 15, and 15 becomes 45. A span of 45 stays. */
export function lengthenSpan(cards: readonly GreenhouseSlip[], id: string): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 45) return card;
    const next = card.span === 15 ? 45 : card.span === 5 ? 15 : 5;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 45, 45 becomes 15, and 15 becomes 5. A span of 5 stays. */
export function shortenSpan(cards: readonly GreenhouseSlip[], id: string): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 5) return card;
    const next = card.span === 15 ? 5 : card.span === 45 ? 15 : 45;
    return { ...card, span: next, audit: "short" };
  });
}

export function raiseRank(cards: readonly GreenhouseSlip[], id: string): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 2, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerRank(cards: readonly GreenhouseSlip[], id: string): GreenhouseSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkSlipPin(cards: readonly GreenhouseSlip[], ids: readonly string[]): GreenhouseSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkSlipStore(cards: readonly GreenhouseSlip[], ids: readonly string[]): GreenhouseSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, stored: true, benched: false, audit: "store" }));
}

export function bulkSlipGale(cards: readonly GreenhouseSlip[], ids: readonly string[]): GreenhouseSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, climate: "gale", audit: "climate" }));
}

export function bulkSlipBay(cards: readonly GreenhouseSlip[], ids: readonly string[]): GreenhouseSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, herb: "BAY", audit: "herb" }));
}

export function bulkSlipTag(cards: readonly GreenhouseSlip[], ids: readonly string[], tag: string): GreenhouseSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSlips(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number, change: (list: readonly GreenhouseSlip[], id: string) => GreenhouseSlip[]): GreenhouseSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readSlips(cards);
}

export function lengthenFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  return focused(cards, ids, index, lengthenSpan);
}

export function shortenFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  return focused(cards, ids, index, shortenSpan);
}

export function climateFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  return focused(cards, ids, index, cycleClimate);
}

export function raiseFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  return focused(cards, ids, index, raiseRank);
}

export function lowerFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  return focused(cards, ids, index, lowerRank);
}

export function pinFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipPin(cards, id, !card.pinned) : readSlips(cards);
}

export function benchFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipBench(cards, id, !card.benched) : readSlips(cards);
}

export function starFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number): GreenhouseSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipStar(cards, id, !card.flagged) : readSlips(cards);
}

export function tagFocused(cards: readonly GreenhouseSlip[], ids: readonly string[], index: number, tag: string): GreenhouseSlip[] {
  const id = ids[index];
  return id ? addSlipTag(cards, id, tag) : readSlips(cards);
}

export function readSlipViews(raw: unknown): GreenhouseView[] {
  if (!Array.isArray(raw)) return [];
  const out: GreenhouseView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GreenhouseView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      herb: activeHerb(row.herb),
      climate: activeClimate(row.climate, CLIMATES),
      place: activePlot(row.place),
      span: activeSpan(row.span),
      rank: activeRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(
  views: readonly GreenhouseView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    herb?: string;
    climate?: string;
    place?: string;
    span?: string;
    rank?: string;
  },
): GreenhouseView[] {
  const current = readSlipViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: GreenhouseView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    herb: activeHerb(view.herb),
    climate: activeClimate(view.climate, CLIMATES),
    place: activePlot(view.place),
    span: activeSpan(view.span),
    rank: activeRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly GreenhouseView[], id: string): GreenhouseView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

export function greenhouseDensity(raw: unknown): GreenhouseDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than one place behind the desk, at rank 2, is late. */
export function lateSlip(card: GreenhouseSlip, deskPlace: unknown): boolean {
  const gap = plotGap(card.place, deskPlace);
  return card.rank === 2 && gap !== null && gap > 1;
}

export function idleSlip(card: GreenhouseSlip): boolean {
  return card.climate === "dew" && quietPlot(card.place) && card.rank === 2;
}

export function galeSlip(card: GreenhouseSlip): boolean {
  return card.rank === 8 && card.climate === "gale" && peakPlot(card.place);
}

export function restingSlip(card: GreenhouseSlip): boolean {
  return card.span === 45 && card.climate === "sun" && card.place === "pot";
}

/** A five-minute span on a peak place is overdue unless the slip is pinned. */
export function overdueSlip(card: GreenhouseSlip): boolean {
  return card.span === 5 && peakPlot(card.place) && !card.pinned;
}

export function visibleSlips(
  cards: readonly GreenhouseSlip[],
  tray: GreenhouseTray,
  query: string,
  keeper: string,
  herb: string,
  climate: string,
  place: string,
  span: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): GreenhouseSlip[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const herbOn = herb === "all" ? "" : herbOf(herb);
  const climateOn = climate === "all" ? "" : climateOf(climate);
  const placeOn = place === "all" ? "" : activePlot(place);
  const spanOn = span === "all" ? "" : activeSpan(span);
  const rankOn = rank === "all" ? "" : activeRank(rank);
  return readSlips(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (herbOn && card.herb !== herbOn) return false;
    if (climateOn && card.climate !== climateOn) return false;
    if (placeOn === "peak" && !peakPlot(card.place)) return false;
    if (placeOn === "quiet" && !quietPlot(card.place)) return false;
    if (placeOn && placeOn !== "peak" && placeOn !== "quiet" && card.place !== placeOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseHerb(card.herb)) return false;
    if (peakOnly && !peakPlot(card.place)) return false;
    if (quietOnly && !quietPlot(card.place)) return false;
    return true;
  });
}

export function sortSlips(cards: readonly GreenhouseSlip[], sort: GreenhouseSort): GreenhouseSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const place = (placeIndex(a.place) < 0 ? 99 : placeIndex(a.place)) - (placeIndex(b.place) < 0 ? 99 : placeIndex(b.place));
    if (place) return place;
    return a.title.localeCompare(b.title);
  });
}

export function slipCounts(cards: readonly GreenhouseSlip[], shown: readonly GreenhouseSlip[], deskPlace: unknown): GreenhouseCounts {
  const open = cards.filter((card) => inTray(card, "row"));
  return {
    row: open.length,
    bench: cards.filter((card) => inTray(card, "bench")).length,
    store: cards.filter((card) => inTray(card, "store")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakPlot(card.place)).length,
    quiet: open.filter((card) => quietPlot(card.place)).length,
    soon: open.filter((card) => card.span === 5).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseHerb(card.herb)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: shown.filter((card) => card.place && card.place === plotOf(deskPlace)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleSlip(card)).length,
    gale: open.filter((card) => galeSlip(card)).length,
    resting: open.filter((card) => restingSlip(card)).length,
    overdue: open.filter((card) => overdueSlip(card)).length,
  };
}

export function clashPlaceCount(cards: readonly GreenhouseSlip[]): number {
  const open = cards.filter((card) => inTray(card, "row") && card.place);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.place === card.place && other.rank === card.rank)).length;
}

export function neighborSlipCount(cards: readonly GreenhouseSlip[]): number {
  const open = cards.filter((card) => inTray(card, "row") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly GreenhouseSlip[]): string {
  const open = cards.filter((card) => inTray(card, "row") && card.keeper);
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

export function reminderSlips(cards: readonly GreenhouseSlip[]): GreenhouseSlip[] {
  return cards.filter((card) => inTray(card, "row") && (card.span === 5 || card.span === 15));
}

export function idleSlips(cards: readonly GreenhouseSlip[]): GreenhouseSlip[] {
  return cards.filter((card) => inTray(card, "row") && idleSlip(card));
}

export function slipTimeline(cards: readonly GreenhouseSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "row"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function slipBars(cards: readonly GreenhouseSlip[]): { place: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "row"));
  return GREEN_PLACES.map((place) => ({ place, count: open.filter((card) => card.place === place).length }));
}

export function slipKeepers(cards: readonly GreenhouseSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function slipCopy(card: GreenhouseSlip): string {
  return [card.title, card.keeper, card.place, card.herb, card.climate, card.span ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function slipShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function slipCsv(cards: readonly GreenhouseSlip[], deskPlace: unknown): string {
  const lines = ["title,keeper,place,herb,climate,span,rank,tags,pinned,benched,stored,starred,gap,late,idle,peak,quiet,house,band,gale,resting,overdue,audit,note"];
  for (const card of readSlips(cards)) {
    const gap = plotGap(card.place, deskPlace);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.place,
      card.herb,
      card.climate,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.benched ? "1" : "0",
      card.stored ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(card, deskPlace) ? "1" : "0",
      idleSlip(card) ? "1" : "0",
      peakPlot(card.place) ? "1" : "0",
      quietPlot(card.place) ? "1" : "0",
      houseHerb(card.herb) ? "1" : "0",
      plotBand(card.place),
      galeSlip(card) ? "1" : "0",
      restingSlip(card) ? "1" : "0",
      overdueSlip(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function dialRecord(raw: DialValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: DialValue): boolean {
  const row = dialRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type DialParts = { digits: string; plus: boolean; wide: boolean; notch: boolean };

function dialParts(raw: DialValue): DialParts | null {
  if (hasBlocked(raw)) return null;
  const row = dialRecord(raw);
  if (row && !("phone" in row)) return null;
  const text = row ? clip(row.phone, 32) : clip(raw, 32);
  if (!/^[+()\d][\d\s().+-]{5,30}$/.test(text)) return null;
  const digits = text.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  if (!/^\d+$/.test(digits)) return null;
  return {
    digits,
    plus: text.trim().startsWith("+"),
    wide: /[\s-]/.test(text),
    notch: /[()]/.test(text),
  };
}

function dialText(raw: DialValue): string {
  const parts = dialParts(raw);
  if (!parts) return "";
  return `${parts.plus ? "+" : ""}${parts.digits}`;
}

/** A blocked field clears the plate. A real dial is set. A blank or broken number is clear. */
export function dialState(raw: DialValue): DialState {
  if (hasBlocked(raw)) return "";
  const row = dialRecord(raw);
  if (row && !("phone" in row)) return "";
  return dialParts(raw) ? "set" : "clear";
}

/** Brief is 7–8 digits, desk 9–10, hall 11–12, and long 13–15. */
export function dialLane(raw: DialValue): DialLane {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  if (!parts) return "";
  if (parts.digits.length <= 8) return "brief";
  if (parts.digits.length <= 10) return "desk";
  if (parts.digits.length <= 12) return "hall";
  return "long";
}

/** The last four digits. */
export function dialStamp(raw: DialValue): string {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return parts ? parts.digits.slice(-4) : "";
}

/** A first digit 1–3 is ivory, 4–6 graphite, and 7–9 champagne. Zero stays graphite. */
export function dialHue(raw: DialValue): DialHue {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  if (!parts) return "";
  const digit = Number(parts.digits[0]);
  if (digit >= 1 && digit <= 3) return "ivory";
  if (digit >= 4 && digit <= 6) return "graphite";
  if (digit >= 7 && digit <= 9) return "champagne";
  return "graphite";
}

/** Two identical digits stand together. */
export function dialSpoken(raw: DialValue): boolean {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return Boolean(parts && /(\d)\1/.test(parts.digits));
}

export function dialWide(raw: DialValue): boolean {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function dialNotch(raw: DialValue): boolean {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function dialEcho(raw: DialValue): boolean {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  if (!parts || parts.digits.length < 2) return false;
  return parts.digits[0] === parts.digits[parts.digits.length - 1];
}

export function dialLeap(raw: DialValue): boolean {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return Boolean(parts && parts.digits.length === 10);
}

export function dialPlus(raw: DialValue): boolean {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return Boolean(parts && parts.plus);
}

export function dialStep(raw: DialValue): number {
  const parts = dialState(raw) === "set" ? dialParts(raw) : null;
  return parts ? parts.digits.length : 0;
}

export function dialLanes(rows: readonly DialRow[]): DialLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = dialLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingDial(rows: readonly DialRow[]): string {
  const bars = dialLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingDialHue(rows: readonly DialRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = dialHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedDialCount(rows: readonly DialRow[]): number {
  const marks = rows.map((row) => dialStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneDialCount(rows: readonly DialRow[], lane: DialLane): number {
  return rows.filter((row) => dialLane(row.note) === lane).length;
}

export function hueDialCount(rows: readonly DialRow[], hue: DialHue): number {
  return rows.filter((row) => dialHue(row.note) === hue).length;
}

export function dialShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDialLanes(rows: readonly DialRow[]): string[] {
  return dialLanes(rows).map((line) => line.lane);
}

export function readHiddenDials(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDials(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDial(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleDialReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDialReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDialLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleDials(
  rows: readonly DialRow[],
  lane: string,
  hue: string,
  query: string,
  review: DialReview,
  reviewed: readonly string[],
  shape: DialShape,
): DialRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (dialState(row.note) === "") return false;
    const found = dialLane(row.note);
    const hueName = dialHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${dialText(row.note)} ${dialStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "brief" && found !== "brief") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "wide" && !dialWide(row.note)) return false;
    if (shape === "notch" && !dialNotch(row.note)) return false;
    if (shape === "leap" && !dialLeap(row.note)) return false;
    if (shape === "plus" && !dialPlus(row.note)) return false;
    if (shape === "pair" && !dialSpoken(row.note)) return false;
    return true;
  });
}

export function dialCopy(raw: DialValue): string {
  return [dialStamp(raw), dialLane(raw), dialHue(raw)].filter(Boolean).join(" ");
}

export function dialLanesCsv(rows: readonly DialRow[]): string {
  const lines = ["lane,count"];
  for (const line of dialLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function dialRowsCsv(rows: readonly DialRow[], reviewed: readonly string[]): string {
  const lines = ["name,phone,stamp,lane,hue,step,echo,wide,notch,leap,plus,pair,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (dialState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      dialText(row.note),
      dialStamp(row.note),
      dialLane(row.note),
      dialHue(row.note),
      String(dialStep(row.note)),
      dialEcho(row.note) ? "1" : "0",
      dialWide(row.note) ? "1" : "0",
      dialNotch(row.note) ? "1" : "0",
      dialLeap(row.note) ? "1" : "0",
      dialPlus(row.note) ? "1" : "0",
      dialSpoken(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
