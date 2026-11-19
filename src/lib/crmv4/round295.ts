/**
 * Heliometer halves for a separation follow-up kept in this browser, and plumb plates read the retention follow-up time already stored on the account.
 * Separations are near, mid, far, and limb. Glass is clear, veil, and flare.
 * Seconds are 8, 16, or 32. Slides are 2, 4, or 8.
 * A bob plumb is due within six hours. A drop plumb is more than seven days overdue. Dates are read in UTC.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_heliometer (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   separation text not null default '',
 *   glass text not null default '',
 *   second_no integer,
 *   slide_no integer not null default 2,
 *   tags text not null default '',
 *   split boolean not null default false,
 *   cased boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_plumb_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_plumb_review (
 *   trader_id text primary key
 * );
 */

export const HLM_KEY = "crmv4-heliometer";
export const HLM_VIEW_KEY = "crmv4-heliometer-views";
export const HLM_DENSITY_KEY = "crmv4-heliometer-density";
export const PMB_KEY = "crmv4-plumb-hide";
export const PMB_REVIEW_KEY = "crmv4-plumb-review";

export const HELIOMETER_SEPARATIONS = ["near", "mid", "far", "limb"] as const;

export type HeliometerSeparation = (typeof HELIOMETER_SEPARATIONS)[number];

export type HeliometerGlass = "blank" | "clear" | "veil" | "flare";

export type HeliometerTray = "half" | "case" | "vault";

export type HeliometerDensity = "wide" | "narrow";

export type HeliometerSort = "separation" | "reader";

export type Heliometer = {
  id: string;
  title: string;
  note: string;
  reader: string;
  separation: string;
  second: number | null;
  glass: string;
  slide: number;
  tags: string[];
  split: boolean;
  cased: boolean;
  vaulted: boolean;
  flagged: boolean;
  audit: string;
};

export type HeliometerView = {
  id: string;
  name: string;
  tray: HeliometerTray;
  query: string;
  reader: string;
  glass: string;
  separation: string;
  second: string;
  slide: string;
};

export type HeliometerCounts = {
  half: number;
  case: number;
  vault: number;
  split: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  second: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type PlumbLane = "" | "bob" | "cord" | "weight" | "slack" | "coil" | "drop";

export type PlumbHue = "" | "ivory" | "graphite" | "champagne";

export type PlumbState = "" | "clear" | "set";

export type PlumbReview = "all" | "reviewed" | "fresh";

export type PlumbShape =
  | "all"
  | "bob"
  | "cord"
  | "weight"
  | "slack"
  | "coil"
  | "drop"
  | "open"
  | "soon"
  | "today"
  | "weekday"
  | "weekend"
  | "morning"
  | "evening"
  | "leap"
  | "first"
  | "even"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "held";

export type PlumbValue = string | { retentionFollowUpAt?: unknown; follow?: unknown; [key: string]: unknown } | null | undefined;

export type PlumbRow = { id: string; label: string; follow: PlumbValue };

export type PlumbLaneLine = { lane: string; count: number };

export const ROUND295_FEATURES = [
  "save",
  "note",
  "trays",
  "glass",
  "seconds",
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
  "fair-reader",
  "viewer",
  "suggest",
  "sla",
  "plumb",
  "plumb-csv",
] as const;

const AUDITS = ["save", "edit", "note", "glass", "split", "unsplit", "case", "resume", "vault", "open", "tag", "slide", "second", "lower", "star"] as const;

const GLASSES = ["clear", "veil", "flare"] as const;

const SECOND_CYCLE = [8, 16, 32] as const;

const SLIDE_CYCLE = [2, 4, 8] as const;

const INNER = new Set(["near", "mid"]);

const OUTER = new Set(["far", "limb"]);

const HOUSE_GLASS = new Set(["VEIL", "FLARE"]);

const LANE_ORDER = ["bob", "cord", "weight", "slack", "coil", "drop"] as const;

const HUE_ORDER = ["champagne", "ivory", "graphite"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const MINUTE_MS = 60 * 1000;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const BOB_MS = 6 * HOUR_MS;

const CORD_MS = 2 * DAY_MS;

const WEIGHT_MS = 14 * DAY_MS;

const COIL_MS = 7 * DAY_MS;

const SOON_MS = 90 * MINUTE_MS;

const YEAR_MS = 3 * 365 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HeliometerTray {
  return raw === "case" || raw === "vault" ? raw : "half";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glassName(raw: unknown): Exclude<HeliometerGlass, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<HeliometerGlass, "blank">) : "";
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

function inTray(card: Heliometer, tray: HeliometerTray): boolean {
  if (tray === "case") return card.cased && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.cased && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function separationIndex(separation: string): number {
  return HELIOMETER_SEPARATIONS.indexOf(separation as HeliometerSeparation);
}

function secondIndex(second: number): number {
  return SECOND_CYCLE.indexOf(second as (typeof SECOND_CYCLE)[number]);
}

function slideIndex(slide: number): number {
  return SLIDE_CYCLE.indexOf(slide as (typeof SLIDE_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function heliometerSeparation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (HELIOMETER_SEPARATIONS as readonly string[]).includes(text) ? text : "";
}

/** A second is 8, 16, or 32. Anything else stays blank. */
export function heliometerSecond(raw: unknown): 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 8 | 16 | 32;
}

/** A slide is 2, 4, or 8. Anything else stays blank. */
export function heliometerSlide(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** Glass is clear, veil, or flare. The saved glass is the upper case name. */
export function heliometerGlass(raw: unknown): string {
  const text = glassName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerSeparation(separation: unknown): boolean {
  return INNER.has(clip(separation, 12).toLowerCase());
}

export function outerSeparation(separation: unknown): boolean {
  return OUTER.has(clip(separation, 12).toLowerCase());
}

/** Near is the hearth. Mid is the sill. Far is the eave. Limb is the finial. */
export function heliometerBand(separation: unknown): string {
  const text = heliometerSeparation(separation);
  if (!text) return "";
  if (text === "near") return "hearth";
  if (text === "mid") return "sill";
  if (text === "far") return "eave";
  return "finial";
}

/** Signed distance from one separation to the desk separation. */
export function separationGap(from: unknown, to: unknown): number | null {
  const left = separationIndex(heliometerSeparation(from));
  const right = separationIndex(heliometerSeparation(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseGlass(glass: unknown): boolean {
  return HOUSE_GLASS.has(heliometerGlass(glass));
}

/** A pair slide is 4. Two and eight are not a pair. */
export function pairSlide(slide: unknown): boolean {
  return heliometerSlide(slide) === 4;
}

/** A full slide is 8. */
export function fullSlide(slide: unknown): boolean {
  return heliometerSlide(slide) === 8;
}

export function activeSeparation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return heliometerSeparation(text) || "all";
}

export function activeSecond(raw: unknown): string {
  const second = heliometerSecond(raw);
  return second === null ? "all" : String(second);
}

export function activeGlass(raw: unknown, allow: readonly string[]): string {
  const text = heliometerGlass(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSlide(raw: unknown): string {
  const slide = heliometerSlide(raw);
  return slide === null ? "all" : String(slide);
}

export function moveHeliometerFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestHeliometerGlass(cards: readonly Heliometer[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "half") || !card.glass) continue;
    counts.set(card.glass, (counts.get(card.glass) || 0) + 1);
  }
  let best = "CLEAR";
  let score = 0;
  for (const glass of ["CLEAR", "VEIL", "FLARE"]) {
    const count = counts.get(glass) || 0;
    if (count > score) {
      best = glass;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest eight. Through the afternoon, sixteen. Evening asks for thirty-two. Saved seconds win when any exist. */
export function suggestSecond(cards: readonly Heliometer[], hour: number): 8 | 16 | 32 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "half") || card.second === null) continue;
    counts.set(card.second, (counts.get(card.second) || 0) + 1);
  }
  let best: 8 | 16 | 32 | null = null;
  let score = 0;
  for (const second of SECOND_CYCLE) {
    const count = counts.get(second) || 0;
    if (count > score) {
      best = second;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 9) return 8;
  if (hour < 16) return 16;
  return 32;
}

/** Before eleven, suggest near. The rest of the day suggests limb. */
export function suggestSeparation(hour: number): HeliometerSeparation {
  return hour < 11 ? "near" : "limb";
}

/** The reader with the fewest unsplit halves on the bench. A tie keeps the roster order. */
export function fairHalfReader(cards: readonly Heliometer[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "half") && !card.split);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.reader.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readHeliometers(raw: unknown): Heliometer[] {
  if (!Array.isArray(raw)) return [];
  const out: Heliometer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Heliometer>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      reader: clip(row.reader, 24),
      separation: heliometerSeparation(row.separation),
      second: heliometerSecond(row.second),
      glass: heliometerGlass(row.glass),
      slide: heliometerSlide(row.slide) ?? 2,
      tags: tagsOf(row.tags),
      split: row.split === true,
      cased: row.cased === true,
      vaulted: row.vaulted === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addHeliometer(
  cards: readonly Heliometer[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    reader?: string;
    separation?: string;
    second?: unknown;
    glass?: string;
    slide?: unknown;
    tags?: unknown;
  },
): Heliometer[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readHeliometers([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      reader: clip(card.reader, 24),
      separation: heliometerSeparation(card.separation),
      second: heliometerSecond(card.second),
      glass: heliometerGlass(card.glass),
      slide: heliometerSlide(card.slide) ?? 2,
      tags: tagsOf(card.tags),
      split: false,
      cased: false,
      vaulted: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Heliometer[], id: string, edit: (card: Heliometer) => Heliometer): Heliometer[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editHeliometer(cards: readonly Heliometer[], id: string, title: string): Heliometer[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editHeliometerNote(cards: readonly Heliometer[], id: string, note: string): Heliometer[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleGlass(glass: string): string {
  const order = ["", "CLEAR", "VEIL", "FLARE"];
  const index = order.indexOf(heliometerGlass(glass));
  return order[(index + 1) % order.length] || "CLEAR";
}

export function setHeliometerGlass(cards: readonly Heliometer[], id: string, glass: string): Heliometer[] {
  const next = heliometerGlass(glass);
  return mapCard(cards, id, (card) => (card.glass === next ? card : { ...card, glass: next, audit: "glass" }));
}

export function setHeliometerSplit(cards: readonly Heliometer[], id: string, split: boolean): Heliometer[] {
  return mapCard(cards, id, (card) => (card.split === split ? card : { ...card, split, audit: split ? "split" : "unsplit" }));
}

export function setHeliometerCase(cards: readonly Heliometer[], id: string, cased: boolean): Heliometer[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, vaulted: cased ? false : card.vaulted, audit: cased ? "case" : "resume" }));
}

export function setHeliometerVault(cards: readonly Heliometer[], id: string, vaulted: boolean): Heliometer[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, cased: vaulted ? false : card.cased, audit: vaulted ? "vault" : "open" }));
}

export function setHeliometerStar(cards: readonly Heliometer[], id: string, flagged: boolean): Heliometer[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addHeliometerTag(cards: readonly Heliometer[], id: string, tag: string): Heliometer[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSecond(second: number | null, dir: 1 | -1): 8 | 16 | 32 {
  if (second === null) return dir > 0 ? 8 : 32;
  const index = secondIndex(second);
  const next = index < 0 ? 0 : (index + dir + SECOND_CYCLE.length) % SECOND_CYCLE.length;
  return SECOND_CYCLE[next];
}

function stepSlide(slide: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = slideIndex(slide);
  const next = index < 0 ? 0 : (index + dir + SLIDE_CYCLE.length) % SLIDE_CYCLE.length;
  return SLIDE_CYCLE[next];
}

export function liftSecond(cards: readonly Heliometer[], id: string): Heliometer[] {
  return mapCard(cards, id, (card) => ({ ...card, second: stepSecond(card.second, 1), audit: "second" }));
}

export function lowerSecond(cards: readonly Heliometer[], id: string): Heliometer[] {
  return mapCard(cards, id, (card) => ({ ...card, second: stepSecond(card.second, -1), audit: "lower" }));
}

export function raiseSlide(cards: readonly Heliometer[], id: string): Heliometer[] {
  return mapCard(cards, id, (card) => ({ ...card, slide: stepSlide(card.slide, 1), audit: "slide" }));
}

export function lowerSlide(cards: readonly Heliometer[], id: string): Heliometer[] {
  return mapCard(cards, id, (card) => ({ ...card, slide: stepSlide(card.slide, -1), audit: "slide" }));
}

function focused(cards: readonly Heliometer[], id: string, edit: (card: Heliometer) => Heliometer): Heliometer[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function splitHeliometerFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return focused(cards, id, (card) => ({ ...card, split: !card.split, audit: card.split ? "unsplit" : "split" }));
}

export function caseHeliometerFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return setHeliometerCase(cards, id, !cards.find((card) => card.id === id)?.cased);
}

export function starHeliometerFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return setHeliometerStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagHeliometerFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return addHeliometerTag(cards, id, "a");
}

export function glassFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  const card = cards.find((item) => item.id === id);
  return card ? setHeliometerGlass(cards, id, cycleGlass(card.glass)) : [...cards];
}

export function liftSecondFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return liftSecond(cards, id);
}

export function lowerSecondFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return lowerSecond(cards, id);
}

export function raiseSlideFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return raiseSlide(cards, id);
}

export function lowerSlideFocused(cards: readonly Heliometer[], id: string): Heliometer[] {
  return lowerSlide(cards, id);
}

function bulk(cards: readonly Heliometer[], ids: readonly string[], edit: (card: Heliometer) => Heliometer): Heliometer[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkHeliometerFlare(cards: readonly Heliometer[], ids: readonly string[]): Heliometer[] {
  return bulk(cards, ids, (card) => (card.glass === "FLARE" ? card : { ...card, glass: "FLARE", audit: "glass" }));
}

export function bulkHeliometerSplit(cards: readonly Heliometer[], ids: readonly string[]): Heliometer[] {
  return bulk(cards, ids, (card) => (card.split ? card : { ...card, split: true, audit: "split" }));
}

export function bulkHeliometerVault(cards: readonly Heliometer[], ids: readonly string[]): Heliometer[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, cased: false, audit: "vault" }));
}

export function bulkHeliometerTag(cards: readonly Heliometer[], ids: readonly string[]): Heliometer[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readHeliometerViews(raw: unknown): HeliometerView[] {
  if (!Array.isArray(raw)) return [];
  const out: HeliometerView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HeliometerView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      reader: clip(row.reader, 24),
      glass: activeGlass(row.glass, ["CLEAR", "VEIL", "FLARE"]),
      separation: activeSeparation(row.separation),
      second: activeSecond(row.second),
      slide: activeSlide(row.slide),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addHeliometerView(views: readonly HeliometerView[], view: HeliometerView): HeliometerView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readHeliometerViews([...views, { ...view, id, name }]);
}

export function dropHeliometerView(views: readonly HeliometerView[], id: string): HeliometerView[] {
  return views.filter((view) => view.id !== id);
}

export function heliometerDensity(raw: unknown): HeliometerDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortHeliometers(cards: readonly Heliometer[], sort: HeliometerSort): Heliometer[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "reader") {
      const reader = a.reader.localeCompare(b.reader);
      if (reader) return reader;
    } else {
      const separation = separationIndex(a.separation) - separationIndex(b.separation);
      if (separation) return separation;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleHeliometers(
  cards: readonly Heliometer[],
  tray: HeliometerTray,
  query: string,
  reader: string,
  glass: string,
  separation: string,
  second: string,
  slide: string,
): Heliometer[] {
  const text = query.trim().toLowerCase();
  const wantReader = clip(reader, 24).toLowerCase();
  const wantGlass = glass === "all" ? "" : heliometerGlass(glass);
  const wantSeparation = activeSeparation(separation);
  const wantSecond = activeSecond(second);
  const wantSlide = activeSlide(slide);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.reader}`.toLowerCase().includes(text)) return false;
    if (wantReader && card.reader.toLowerCase() !== wantReader) return false;
    if (wantGlass && card.glass !== wantGlass) return false;
    if (wantSeparation === "inner" && !innerSeparation(card.separation)) return false;
    if (wantSeparation === "outer" && !outerSeparation(card.separation)) return false;
    if (wantSeparation !== "all" && wantSeparation !== "inner" && wantSeparation !== "outer" && card.separation !== wantSeparation) return false;
    if (wantSecond !== "all" && String(card.second ?? "") !== wantSecond) return false;
    if (wantSlide !== "all" && String(card.slide) !== wantSlide) return false;
    return true;
  });
}

/** An outer separation on slide two, still unsplit and not in the vault, is overdue. */
export function overdueHeliometer(card: Heliometer): boolean {
  return outerSeparation(card.separation) && card.slide === 2 && !card.split && !card.vaulted;
}

/** No glass, the short second, slide two, and still on the half. */
export function idleHeliometer(card: Heliometer): boolean {
  return !card.glass && card.second === 8 && card.slide === 2 && !card.split && !card.cased && !card.vaulted;
}

/** Flare, a wide second, and a full slide, still out of the vault. */
export function briskHeliometer(card: Heliometer): boolean {
  return card.glass === "FLARE" && card.second === 32 && card.slide === 8 && !card.vaulted;
}

/** Limb, clear glass, and a middle second. */
export function restingHeliometer(card: Heliometer): boolean {
  return card.separation === "limb" && card.glass === "CLEAR" && card.second === 16;
}

/** A near half is late when the desk is already at the limb. */
export function lateHeliometer(card: Heliometer, desk: string): boolean {
  return card.separation === "near" && heliometerSeparation(desk) === "limb" && !card.split;
}

export function heliometerCounts(cards: readonly Heliometer[], shown: readonly Heliometer[], desk: string): HeliometerCounts {
  return {
    half: cards.filter((card) => inTray(card, "half")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    split: cards.filter((card) => card.split).length,
    inner: cards.filter((card) => innerSeparation(card.separation)).length,
    outer: cards.filter((card) => outerSeparation(card.separation)).length,
    wide: cards.filter((card) => card.second === 32).length,
    house: cards.filter((card) => houseGlass(card.glass)).length,
    second: cards.reduce((sum, card) => sum + (card.second || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleHeliometer).length,
    brisk: cards.filter(briskHeliometer).length,
    resting: cards.filter(restingHeliometer).length,
    overdue: cards.filter(overdueHeliometer).length,
    pair: cards.filter((card) => pairSlide(card.slide) && lateHeliometer(card, desk)).length,
  };
}

export function heliometerBars(cards: readonly Heliometer[]): { separation: string; count: number }[] {
  return HELIOMETER_SEPARATIONS.map((separation) => ({ separation, count: cards.filter((card) => card.separation === separation && !card.vaulted).length }));
}

export function heliometerTimeline(cards: readonly Heliometer[]): { second: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "half"));
  return SECOND_CYCLE.map((second) => ({ second, titles: open.filter((card) => card.second === second).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function heliometerReaders(cards: readonly Heliometer[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.reader && !out.some((name) => name.toLowerCase() === card.reader.toLowerCase())) out.push(card.reader);
  }
  return out;
}

export function busiestHalfReader(cards: readonly Heliometer[]): string {
  const open = cards.filter((card) => inTray(card, "half") && !card.split && card.reader);
  let best = "";
  let score = 0;
  for (const name of heliometerReaders(open)) {
    const count = open.filter((card) => card.reader.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderHeliometers(cards: readonly Heliometer[]): string[] {
  return cards.filter(overdueHeliometer).map((card) => card.title);
}

export function heliometerCopy(card: Heliometer): string {
  return [card.title, card.reader, card.separation, card.glass, card.second ?? "", card.slide, card.note].filter((item) => item !== "").join(" · ");
}

export function heliometerCsv(cards: readonly Heliometer[], desk: string): string {
  const lines = ["title,reader,separation,glass,second,slide,tags,split,case,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.reader),
        card.separation,
        card.glass,
        card.second ?? "",
        card.slide,
        card.tags.join(" "),
        card.split ? "1" : "0",
        card.cased ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.flagged ? "1" : "0",
        outerSeparation(card.separation) ? "1" : "0",
        lateHeliometer(card, desk) ? "1" : "0",
        idleHeliometer(card) ? "1" : "0",
        briskHeliometer(card) ? "1" : "0",
        restingHeliometer(card) ? "1" : "0",
        overdueHeliometer(card) ? "1" : "0",
        innerSeparation(card.separation) ? "1" : "0",
        houseGlass(card.glass) ? "1" : "0",
        heliometerBand(card.separation),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: PlumbValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function plumbRecord(raw: PlumbValue): { retentionFollowUpAt?: unknown; follow?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function plumbGiven(raw: PlumbValue): string {
  const row = plumbRecord(raw);
  if (row && !("retentionFollowUpAt" in row) && !("follow" in row)) return "";
  const value = row ? row.retentionFollowUpAt ?? row.follow : raw;
  return clip(value, 40);
}

function plumbStateRaw(raw: PlumbValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = plumbRecord(raw);
  if (row && !("retentionFollowUpAt" in row) && !("follow" in row)) return "blocked";
  return "open";
}

function plumbDate(raw: PlumbValue, now = Date.now()): Date | null {
  if (plumbStateRaw(raw) === "blocked") return null;
  const text = plumbGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const delta = at - now;
  if (delta > YEAR_MS || delta < -YEAR_MS) return null;
  return new Date(at);
}

function plumbDelta(raw: PlumbValue, now: number): number | null {
  const at = plumbDate(raw, now);
  if (!at) return null;
  return at.getTime() - now;
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function plumbState(raw: PlumbValue, now = Date.now()): PlumbState {
  if (plumbStateRaw(raw) === "blocked") return "";
  return plumbDate(raw, now) ? "set" : "clear";
}

/** Bob within six hours ahead, then cord and weight. Farther than a fortnight is slack. A week overdue is coil. Older than that is a drop. */
export function plumbLane(raw: PlumbValue, now = Date.now()): PlumbLane {
  if (plumbState(raw, now) !== "set") return "";
  const delta = plumbDelta(raw, now);
  if (delta === null) return "";
  if (delta > 0) {
    if (delta <= BOB_MS) return "bob";
    if (delta <= CORD_MS) return "cord";
    if (delta <= WEIGHT_MS) return "weight";
    return "slack";
  }
  const age = -delta;
  if (age <= COIL_MS) return "coil";
  return "drop";
}

export function plumbHue(raw: PlumbValue, now = Date.now()): PlumbHue {
  const lane = plumbLane(raw, now);
  if (!lane) return "";
  if (lane === "bob" || lane === "coil") return "champagne";
  if (lane === "cord" || lane === "weight") return "ivory";
  return "graphite";
}

export function plumbBob(raw: PlumbValue, now = Date.now()): boolean {
  return plumbLane(raw, now) === "bob";
}

export function plumbDrop(raw: PlumbValue, now = Date.now()): boolean {
  return plumbLane(raw, now) === "drop";
}

export function plumbSlack(raw: PlumbValue, now = Date.now()): boolean {
  return plumbLane(raw, now) === "slack";
}

export function plumbOpen(raw: PlumbValue, now = Date.now()): boolean {
  return plumbState(raw, now) === "clear";
}

/** Still close enough to act: bob or cord, both still ahead. */
export function plumbHeld(raw: PlumbValue, now = Date.now()): boolean {
  const lane = plumbLane(raw, now);
  return lane === "bob" || lane === "cord";
}

/** A coming plumb is due within ninety minutes and is not already past. */
export function plumbSoon(raw: PlumbValue, now = Date.now()): boolean {
  const delta = plumbDelta(raw, now);
  if (delta === null || delta <= 0) return false;
  return delta <= SOON_MS;
}

/** Minutes still remaining until the follow-up. An overdue stamp has no remaining count. */
export function plumbMinutes(raw: PlumbValue, now = Date.now()): number | null {
  const delta = plumbDelta(raw, now);
  if (delta === null || delta <= 0) return null;
  return Math.trunc(delta / MINUTE_MS);
}

export function plumbToday(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function plumbWeekday(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day >= 1 && day <= 5;
}

export function plumbWeekend(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function plumbMorning(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  return Boolean(at) && at!.getUTCHours() < 12;
}

export function plumbEvening(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  return Boolean(at) && at!.getUTCHours() >= 18;
}

export function plumbEven(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function plumbFirst(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  return Boolean(at) && at!.getUTCDate() === 1;
}

export function plumbStep(raw: PlumbValue, now = Date.now()): number {
  const at = plumbDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

export function plumbLeap(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

export function plumbTwin(raw: PlumbValue, now = Date.now()): boolean {
  const at = plumbDate(raw, now);
  if (!at) return false;
  return at.getUTCDay() === new Date(now).getUTCDay();
}

export function plumbTail(raw: PlumbValue): boolean {
  return /z$/i.test(plumbGiven(raw).trim());
}

export function plumbMark(raw: PlumbValue): boolean {
  return plumbGiven(raw).includes("T");
}

export function plumbSpace(raw: PlumbValue): boolean {
  return plumbGiven(raw).includes(" ");
}

export function plumbStamp(raw: PlumbValue, now = Date.now()): string {
  const at = plumbDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function plumbCopy(raw: PlumbValue): string {
  return plumbGiven(raw);
}

export function plumbLanes(rows: readonly PlumbRow[], now = Date.now()): PlumbLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = plumbLane(row.follow, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPlumb(rows: readonly PlumbRow[], now = Date.now()): string {
  const lines = plumbLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPlumbHue(rows: readonly PlumbRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = plumbHue(row.follow, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function lanePlumbCount(rows: readonly PlumbRow[], lane: PlumbLane, now = Date.now()): number {
  return rows.filter((row) => plumbLane(row.follow, now) === lane).length;
}

export function plumbShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPlumbLanes(rows: readonly PlumbRow[], now = Date.now()): string[] {
  return plumbLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenPlumb(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPlumb(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePlumb(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlumbReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlumbReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlumbLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: PlumbRow, shape: PlumbShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "bob") return plumbBob(row.follow, now);
  if (shape === "drop") return plumbDrop(row.follow, now);
  if (shape === "slack") return plumbSlack(row.follow, now);
  if (shape === "open") return plumbOpen(row.follow, now);
  if (shape === "soon") return plumbSoon(row.follow, now);
  if (shape === "today") return plumbToday(row.follow, now);
  if (shape === "weekday") return plumbWeekday(row.follow, now);
  if (shape === "weekend") return plumbWeekend(row.follow, now);
  if (shape === "morning") return plumbMorning(row.follow, now);
  if (shape === "evening") return plumbEvening(row.follow, now);
  if (shape === "leap") return plumbLeap(row.follow, now);
  if (shape === "first") return plumbFirst(row.follow, now);
  if (shape === "even") return plumbEven(row.follow, now);
  if (shape === "twin") return plumbTwin(row.follow, now);
  if (shape === "tail") return plumbTail(row.follow);
  if (shape === "mark") return plumbMark(row.follow);
  if (shape === "space") return plumbSpace(row.follow);
  if (shape === "held") return plumbHeld(row.follow, now);
  return plumbLane(row.follow, now) === shape;
}

export function visiblePlumb(
  rows: readonly PlumbRow[],
  lane: string,
  hue: string,
  query: string,
  review: PlumbReview,
  reviewed: readonly string[],
  shape: PlumbShape,
  now = Date.now(),
): PlumbRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (plumbState(row.follow, now) === "") return false;
    const found = plumbLane(row.follow, now);
    const hueName = plumbHue(row.follow, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${plumbGiven(row.follow)} ${plumbStamp(row.follow, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function plumbLanesCsv(rows: readonly PlumbRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of plumbLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function plumbRowsCsv(rows: readonly PlumbRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,follow,stamp,lane,hue,step,minutes,bob,drop,slack,today,weekday,weekend,morning,evening,leap,first,even,twin,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (plumbState(row.follow, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(plumbGiven(row.follow)),
        plumbStamp(row.follow, now),
        plumbLane(row.follow, now),
        plumbHue(row.follow, now),
        String(plumbStep(row.follow, now)),
        String(plumbMinutes(row.follow, now) ?? ""),
        plumbBob(row.follow, now) ? "1" : "0",
        plumbDrop(row.follow, now) ? "1" : "0",
        plumbSlack(row.follow, now) ? "1" : "0",
        plumbToday(row.follow, now) ? "1" : "0",
        plumbWeekday(row.follow, now) ? "1" : "0",
        plumbWeekend(row.follow, now) ? "1" : "0",
        plumbMorning(row.follow, now) ? "1" : "0",
        plumbEvening(row.follow, now) ? "1" : "0",
        plumbLeap(row.follow, now) ? "1" : "0",
        plumbFirst(row.follow, now) ? "1" : "0",
        plumbEven(row.follow, now) ? "1" : "0",
        plumbTwin(row.follow, now) ? "1" : "0",
        plumbHeld(row.follow, now) ? "1" : "0",
        plumbSoon(row.follow, now) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
