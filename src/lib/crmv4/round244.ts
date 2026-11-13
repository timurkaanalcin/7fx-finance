/**
 * Binnacle cards for a desk's compass watch, and luff marks already stored as a trader language and country.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_binnacle_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   helmsman text not null default '',
 *   point text not null default '',
 *   deviation text not null default '',
 *   reef text not null default '',
 *   drift_min integer,
 *   bearing integer not null default 0,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   lamp boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_luff_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_luff_review (
 *   trader_id text primary key
 * );
 */

export const BNC_KEY = "crmv4-binnacle-card";
export const BNC_VIEW_KEY = "crmv4-binnacle-views";
export const BNC_DENSITY_KEY = "crmv4-binnacle-density";
export const LUF_KEY = "crmv4-luff-hide";
export const LUF_REVIEW_KEY = "crmv4-luff-review";

export const SAIL_POINTS = ["close", "reach", "broad", "run", "beat", "drift"] as const;

export type SailPoint = (typeof SAIL_POINTS)[number];

export type DeviationName = "blank" | "port" | "even" | "starboard";

export type ReefName = "blank" | "bare" | "one" | "two";

export type CardTray = "open" | "held" | "archived";

export type CardDensity = "airy" | "tight";

export type CardSort = "point" | "helmsman";

export type BinnacleCard = {
  id: string;
  title: string;
  note: string;
  helmsman: string;
  point: string;
  drift: number | null;
  deviation: string;
  reef: string;
  bearing: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  lamp: boolean;
  audit: string;
};

export type BinnacleView = {
  id: string;
  name: string;
  tray: CardTray;
  query: string;
  helmsman: string;
  deviation: string;
  reef: string;
  point: string;
  drift: string;
  bearing: string;
};

export type CardCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  weather: number;
  lee: number;
  soon: number;
  bearing: number;
  house: number;
  drift: number;
  matched: number;
  lamp: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type LuffLane = "" | "dash" | "score" | "mark" | "pair" | "trio" | "long" | "hush";

export type LuffHue = "" | "pearl" | "slate" | "sand" | "clay" | "soot" | "mist";

export type LuffState = "" | "clear" | "set";

export type LuffShape = "all" | "dash" | "wide" | "bound" | "notch" | "score";

export type LuffReview = "all" | "reviewed" | "fresh";

export type LuffValue = string | { tongue?: unknown; shore?: unknown; language?: unknown; country?: unknown; [key: string]: unknown } | null | undefined;

export type LuffRow = { id: string; label: string; note: LuffValue };

export type LuffLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "reef", "pin", "unpin", "hold", "resume", "archive", "open", "dev", "tag", "bear", "drift", "short", "lamp"] as const;

const DEVIATIONS = ["port", "even", "starboard"] as const;

const REEFS = ["bare", "one", "two"] as const;

const REEF_CYCLE = ["bare", "one", "two"] as const;

const BEARING_CYCLE = [0, 90, 180, 270] as const;

const DRIFTS = [5, 15, 30] as const;

const WEATHER = new Set(["close", "beat"]);

const LEE = new Set(["drift"]);

const HOUSE = new Set(["PORT", "STAR"]);

const WINDWARD = new Set(["close", "beat"]);

const BEAM = new Set(["reach", "broad"]);

const LEEWARD = new Set(["run", "drift"]);

const LANE_ORDER = ["dash", "score", "mark", "pair", "trio", "long", "hush"] as const;

const HUE_ORDER = ["pearl", "slate", "sand", "clay", "soot", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CardTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function deviationName(raw: unknown): Exclude<DeviationName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (DEVIATIONS as readonly string[]).includes(text) ? (text as Exclude<DeviationName, "blank">) : "";
}

function reefName(raw: unknown): Exclude<ReefName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (REEFS as readonly string[]).includes(text) ? (text as Exclude<ReefName, "blank">) : "";
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

function inTray(card: BinnacleCard, tray: CardTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pointIndex(point: string): number {
  return SAIL_POINTS.indexOf(point as SailPoint);
}

function bearingIndex(bearing: number): number {
  return BEARING_CYCLE.indexOf(bearing as (typeof BEARING_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A point outside the six sail points is left blank. */
export function pointOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (SAIL_POINTS as readonly string[]).includes(text) ? text : "";
}

/** The drift is 5, 15, or 30 minutes. Anything else stays blank. */
export function driftOf(raw: unknown): 5 | 15 | 30 | null {
  const text = clip(raw, 2);
  const value = Number(text);
  return (DRIFTS as readonly number[]).includes(value) ? (value as 5 | 15 | 30) : null;
}

/** Bearing is 0, 90, 180, or 270. Anything else stays blank. */
export function bearingOf(raw: unknown): 0 | 90 | 180 | 270 | null {
  const value = Number(clip(raw, 3));
  return (BEARING_CYCLE as readonly number[]).includes(value) ? (value as 0 | 90 | 180 | 270) : null;
}

/** Deviation is port, even, or starboard. The saved deviation is PORT, EVEN, or STAR. */
export function deviationOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "port") return "PORT";
  if (text === "even") return "EVEN";
  if (text === "star" || text === "starboard") return "STAR";
  return "";
}

/** Reef is bare, one, or two. A blank reef stays blank. */
export function reefOf(raw: unknown): string {
  return reefName(raw);
}

export function weatherPoint(point: unknown): boolean {
  return WEATHER.has(pointOf(point));
}

export function leePoint(point: unknown): boolean {
  return LEE.has(pointOf(point));
}

/** Windward is close and beat. Beam is reach and broad. Leeward is run and drift. */
export function pointBand(point: unknown): "windward" | "beam" | "leeward" | "" {
  const name = pointOf(point);
  if (WINDWARD.has(name)) return "windward";
  if (BEAM.has(name)) return "beam";
  if (LEEWARD.has(name)) return "leeward";
  return "";
}

/** Steps from the card point to the desk point. A blank point has no gap. */
export function pointGap(cardPoint: unknown, deskPoint: unknown): number | null {
  const from = pointIndex(pointOf(cardPoint));
  const to = pointIndex(pointOf(deskPoint));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseDeviation(deviation: unknown): boolean {
  return HOUSE.has(deviationOf(deviation));
}

export function activePoint(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "weather" || text === "lee") return text;
  return pointOf(text) || "all";
}

export function activeDrift(raw: unknown): string {
  const value = driftOf(raw);
  return value === null ? "all" : String(value);
}

export function activeReef(raw: unknown, reefs: readonly string[]): string {
  const reef = reefOf(raw);
  return reef && reefs.includes(reef) ? reef : "all";
}

export function activeBearing(raw: unknown): string {
  const value = bearingOf(raw);
  return value === null ? "all" : String(value);
}

export function activeDeviation(raw: unknown): string {
  const name = deviationName(raw);
  return name || "all";
}

export function moveBinnacleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestDeviation(cards: readonly BinnacleCard[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!card.deviation) continue;
    counts.set(card.deviation, (counts.get(card.deviation) || 0) + 1);
  }
  let best = "EVEN";
  let score = 0;
  for (const deviation of ["PORT", "EVEN", "STAR"]) {
    const count = counts.get(deviation) || 0;
    if (count > score) {
      best = deviation;
      score = count;
    }
  }
  return best;
}

/** An early watch asks for a short drift. A late watch asks for a long one. A tie among saved cards keeps 15. */
export function suggestDrift(cards: readonly BinnacleCard[], hour: number): 5 | 15 | 30 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (card.drift === null) continue;
    counts.set(card.drift, (counts.get(card.drift) || 0) + 1);
  }
  let best: 5 | 15 | 30 | null = null;
  let score = 0;
  for (const drift of DRIFTS) {
    const count = counts.get(drift) || 0;
    if (count > score) {
      best = drift;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 8) return 5;
  if (hour >= 16) return 30;
  return 15;
}

/** The helmsman with the fewest open cards. A tie keeps the roster order. */
export function fairHelmsman(cards: readonly BinnacleCard[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open"));
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

export function readBinnacleCards(raw: unknown): BinnacleCard[] {
  if (!Array.isArray(raw)) return [];
  const out: BinnacleCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BinnacleCard>;
    const id = clip(row.id, 40);
    const title = cardLine(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: cardNote(row.note),
      helmsman: clip(row.helmsman, 24),
      point: pointOf(row.point),
      drift: driftOf(row.drift),
      deviation: deviationOf(row.deviation),
      reef: reefOf(row.reef),
      bearing: bearingOf(row.bearing) ?? 0,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      lamp: row.lamp === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addBinnacleCard(
  cards: readonly BinnacleCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    helmsman?: string;
    point?: unknown;
    deviation?: string;
    reef?: string;
    drift?: unknown;
    bearing?: unknown;
    tags?: unknown;
  },
): BinnacleCard[] {
  const current = readBinnacleCards(cards);
  const id = clip(card.id, 40);
  const title = cardLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: BinnacleCard = {
    id,
    title,
    note: cardNote(card.note),
    helmsman: clip(card.helmsman, 24),
    point: pointOf(card.point),
    drift: driftOf(card.drift),
    deviation: deviationOf(card.deviation),
    reef: reefOf(card.reef),
    bearing: bearingOf(card.bearing) ?? 0,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    lamp: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly BinnacleCard[], id: string, change: (card: BinnacleCard) => BinnacleCard): BinnacleCard[] {
  return readBinnacleCards(cards).map((card) => (card.id === id ? change(card) : card));
}

export function editBinnacle(cards: readonly BinnacleCard[], id: string, title: string): BinnacleCard[] {
  const next = cardLine(title);
  if (!next) return readBinnacleCards(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBinnacleNote(cards: readonly BinnacleCard[], id: string, note: string): BinnacleCard[] {
  const next = cardNote(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setCardPin(cards: readonly BinnacleCard[], id: string, pinned: boolean): BinnacleCard[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setCardHold(cards: readonly BinnacleCard[], id: string, held: boolean): BinnacleCard[] {
  return mapCard(cards, id, (card) => (card.held === held || card.archived ? card : { ...card, held, audit: held ? "hold" : "resume" }));
}

export function setCardArchive(cards: readonly BinnacleCard[], id: string, archived: boolean): BinnacleCard[] {
  return mapCard(cards, id, (card) => (card.archived === archived ? card : { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" }));
}

export function setCardLamp(cards: readonly BinnacleCard[], id: string, lamp: boolean): BinnacleCard[] {
  return mapCard(cards, id, (card) => (card.lamp === lamp ? card : { ...card, lamp, audit: "lamp" }));
}

export function setCardBearing(cards: readonly BinnacleCard[], id: string, bearing: unknown): BinnacleCard[] {
  const next = bearingOf(bearing);
  if (next === null) return readBinnacleCards(cards);
  return mapCard(cards, id, (card) => (card.bearing === next ? card : { ...card, bearing: next, audit: "bear" }));
}

export function setCardDeviation(cards: readonly BinnacleCard[], id: string, deviation: unknown): BinnacleCard[] {
  const next = deviationOf(deviation);
  if (!next) return readBinnacleCards(cards);
  return mapCard(cards, id, (card) => (card.deviation === next ? card : { ...card, deviation: next, audit: "dev" }));
}

/** Reef steps bare, one, two, then bare again. A blank reef starts at bare. */
export function cycleReef(cards: readonly BinnacleCard[], id: string): BinnacleCard[] {
  return mapCard(cards, id, (card) => {
    const at = REEF_CYCLE.indexOf(card.reef as (typeof REEF_CYCLE)[number]);
    const next = at < 0 ? REEF_CYCLE[0] : REEF_CYCLE[(at + 1) % REEF_CYCLE.length];
    return next === card.reef ? card : { ...card, reef: next, audit: "reef" };
  });
}

export function addBinnacleTag(cards: readonly BinnacleCard[], id: string, tag: string): BinnacleCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBinnacleCards(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank drift becomes 5, 5 becomes 15, and 15 becomes 30. A drift of 30 stays. */
export function lengthenDrift(cards: readonly BinnacleCard[], id: string): BinnacleCard[] {
  return mapCard(cards, id, (card) => {
    if (card.drift === 30) return card;
    const next = card.drift === 15 ? 30 : card.drift === 5 ? 15 : 5;
    return { ...card, drift: next, audit: "drift" };
  });
}

/** A blank drift becomes 30, 30 becomes 15, and 15 becomes 5. A drift of 5 stays. */
export function shortenDrift(cards: readonly BinnacleCard[], id: string): BinnacleCard[] {
  return mapCard(cards, id, (card) => {
    if (card.drift === 5) return card;
    const next = card.drift === 15 ? 5 : card.drift === 30 ? 15 : 30;
    return { ...card, drift: next, audit: "short" };
  });
}

export function raiseBearing(cards: readonly BinnacleCard[], id: string): BinnacleCard[] {
  return mapCard(cards, id, (card) => {
    const at = bearingIndex(card.bearing);
    const next = at < 0 ? BEARING_CYCLE[0] : BEARING_CYCLE[(at + 1) % BEARING_CYCLE.length];
    return setCardBearing([card], card.id, next)[0] ?? card;
  });
}

export function lowerBearing(cards: readonly BinnacleCard[], id: string): BinnacleCard[] {
  return mapCard(cards, id, (card) => {
    const at = bearingIndex(card.bearing);
    const next = at < 0 ? BEARING_CYCLE[0] : BEARING_CYCLE[(at + BEARING_CYCLE.length - 1) % BEARING_CYCLE.length];
    return next === card.bearing ? card : { ...card, bearing: next, audit: "bear" };
  });
}

function focusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard | undefined {
  const id = shownIds[index];
  return id ? readBinnacleCards(cards).find((item) => item.id === id) : undefined;
}

export function pinFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readBinnacleCards(cards);
  return setCardPin(cards, card.id, !card.pinned);
}

export function holdFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readBinnacleCards(cards);
  return setCardHold(cards, card.id, !card.held);
}

export function reefFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const id = shownIds[index];
  return id ? cycleReef(cards, id) : readBinnacleCards(cards);
}

export function lampFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readBinnacleCards(cards);
  return setCardLamp(cards, card.id, !card.lamp);
}

export function tagFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number, tag: string): BinnacleCard[] {
  const id = shownIds[index];
  return id ? addBinnacleTag(cards, id, tag) : readBinnacleCards(cards);
}

export function raiseFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const id = shownIds[index];
  return id ? raiseBearing(cards, id) : readBinnacleCards(cards);
}

export function lowerFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const id = shownIds[index];
  return id ? lowerBearing(cards, id) : readBinnacleCards(cards);
}

export function lengthenFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const id = shownIds[index];
  return id ? lengthenDrift(cards, id) : readBinnacleCards(cards);
}

export function shortenFocusedCard(cards: readonly BinnacleCard[], shownIds: readonly string[], index: number): BinnacleCard[] {
  const id = shownIds[index];
  return id ? shortenDrift(cards, id) : readBinnacleCards(cards);
}

function touchIds(cards: readonly BinnacleCard[], ids: readonly string[], change: (card: BinnacleCard) => BinnacleCard): BinnacleCard[] {
  const want = new Set(ids);
  return readBinnacleCards(cards).map((card) => (want.has(card.id) ? change(card) : card));
}

export function bulkBinnaclePin(cards: readonly BinnacleCard[], ids: readonly string[]): BinnacleCard[] {
  return touchIds(cards, ids, (card) => (card.pinned ? card : { ...card, pinned: true, audit: "pin" }));
}

export function bulkBinnacleArchive(cards: readonly BinnacleCard[], ids: readonly string[]): BinnacleCard[] {
  return touchIds(cards, ids, (card) => (card.archived ? card : { ...card, archived: true, held: false, audit: "archive" }));
}

export function bulkBinnacleReef(cards: readonly BinnacleCard[], ids: readonly string[]): BinnacleCard[] {
  return touchIds(cards, ids, (card) => (card.reef === "two" ? card : { ...card, reef: "two", audit: "reef" }));
}

export function bulkBinnacleTag(cards: readonly BinnacleCard[], ids: readonly string[], tag: string): BinnacleCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBinnacleCards(cards);
  return touchIds(cards, ids, (card) => (card.tags.includes(next) || card.tags.length >= TAG_CAP ? card : { ...card, tags: [...card.tags, next], audit: "tag" }));
}

export function bulkBinnacleDev(cards: readonly BinnacleCard[], ids: readonly string[], deviation: unknown): BinnacleCard[] {
  const next = deviationOf(deviation);
  if (!next) return readBinnacleCards(cards);
  return touchIds(cards, ids, (card) => (card.deviation === next ? card : { ...card, deviation: next, audit: "dev" }));
}

export function readBinnacleViews(raw: unknown): BinnacleView[] {
  if (!Array.isArray(raw)) return [];
  const out: BinnacleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BinnacleView>;
    const id = clip(row.id, 40);
    const name = cardLine(row.name);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      helmsman: clip(row.helmsman, 24),
      deviation: activeDeviation(row.deviation),
      reef: activeReef(row.reef, REEFS),
      point: activePoint(row.point),
      drift: activeDrift(row.drift),
      bearing: activeBearing(row.bearing),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBinnacleView(views: readonly BinnacleView[], view: BinnacleView): BinnacleView[] {
  const current = readBinnacleViews(views);
  const id = clip(view.id, 40);
  const name = cardLine(view.name);
  if (!id || !name || current.some((item) => item.id === id)) return current;
  return [{
    ...view,
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    helmsman: clip(view.helmsman, 24),
    deviation: activeDeviation(view.deviation),
    reef: activeReef(view.reef, REEFS),
    point: activePoint(view.point),
    drift: activeDrift(view.drift),
    bearing: activeBearing(view.bearing),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropBinnacleView(views: readonly BinnacleView[], id: string): BinnacleView[] {
  return readBinnacleViews(views).filter((view) => view.id !== id);
}

export function binnacleDensity(raw: unknown): CardDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function binnacleSort(raw: unknown): CardSort {
  return raw === "helmsman" ? "helmsman" : "point";
}

export function lateCard(card: BinnacleCard, deskPoint: unknown): boolean {
  const gap = pointGap(card.point, deskPoint);
  return gap !== null && gap > 0;
}

export function idleCard(card: BinnacleCard): boolean {
  return card.reef === "two" && leePoint(card.point) && card.bearing === 0;
}

export function rushCard(card: BinnacleCard): boolean {
  return card.bearing === 180 && card.reef === "bare" && weatherPoint(card.point);
}

export function restingCard(card: BinnacleCard): boolean {
  return card.drift === 30 && card.reef === "one" && !card.lamp;
}

/** A five-minute drift on a weather point is overdue unless the card is pinned. */
export function overdueCard(card: BinnacleCard): boolean {
  return card.drift === 5 && weatherPoint(card.point) && !card.pinned;
}

export function visibleBinnacle(
  cards: readonly BinnacleCard[],
  tray: CardTray,
  query: string,
  helmsman: string,
  deviation: string,
  reef: string,
  point: string,
  drift: string,
  bearing: string,
  houseOnly: boolean,
  weatherOnly: boolean,
  leeOnly: boolean,
): BinnacleCard[] {
  const text = query.trim().toLowerCase();
  const helmsmanOn = helmsman === "all" ? "" : helmsman.trim().toLowerCase();
  const deviationOn = deviation === "all" ? "" : deviationOf(deviation);
  const reefOn = reef === "all" ? "" : reefOf(reef);
  const pointOn = point === "all" ? "" : activePoint(point);
  const driftOn = drift === "all" ? "" : activeDrift(drift);
  const bearingOn = bearing === "all" ? "" : activeBearing(bearing);
  return readBinnacleCards(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (helmsmanOn && card.helmsman.toLowerCase() !== helmsmanOn) return false;
    if (deviationOn && card.deviation !== deviationOn) return false;
    if (reefOn && card.reef !== reefOn) return false;
    if (pointOn === "weather" && !weatherPoint(card.point)) return false;
    if (pointOn === "lee" && !leePoint(card.point)) return false;
    if (pointOn && pointOn !== "weather" && pointOn !== "lee" && card.point !== pointOn) return false;
    if (driftOn && String(card.drift ?? "") !== driftOn) return false;
    if (bearingOn && String(card.bearing) !== bearingOn) return false;
    if (houseOnly && !houseDeviation(card.deviation)) return false;
    if (weatherOnly && !weatherPoint(card.point)) return false;
    if (leeOnly && !leePoint(card.point)) return false;
    return true;
  });
}

export function sortBinnacle(cards: readonly BinnacleCard[], sort: CardSort): BinnacleCard[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "helmsman") {
      const helmsman = a.helmsman.localeCompare(b.helmsman);
      if (helmsman) return helmsman;
    }
    const point = (pointIndex(a.point) < 0 ? 99 : pointIndex(a.point)) - (pointIndex(b.point) < 0 ? 99 : pointIndex(b.point));
    if (point) return point;
    return a.title.localeCompare(b.title);
  });
}

export function binnacleCounts(cards: readonly BinnacleCard[], shown: readonly BinnacleCard[], deskPoint: unknown): CardCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    archived: cards.filter((card) => inTray(card, "archived")).length,
    pinned: open.filter((card) => card.pinned).length,
    weather: open.filter((card) => weatherPoint(card.point)).length,
    lee: open.filter((card) => leePoint(card.point)).length,
    soon: open.filter((card) => card.drift === 5).length,
    bearing: open.reduce((sum, card) => sum + card.bearing, 0),
    house: open.filter((card) => houseDeviation(card.deviation)).length,
    drift: open.filter((card) => card.drift !== null).length,
    matched: open.filter((card) => card.point && card.point === pointOf(deskPoint)).length,
    lamp: open.filter((card) => card.lamp).length,
    idle: open.filter((card) => idleCard(card)).length,
    rush: open.filter((card) => rushCard(card)).length,
    resting: open.filter((card) => restingCard(card)).length,
    overdue: open.filter((card) => overdueCard(card)).length,
  };
}

export function binnacleShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashPointCount(cards: readonly BinnacleCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.point);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.point === card.point && other.bearing === card.bearing)).length;
}

export function driftClashCount(cards: readonly BinnacleCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.point && card.drift !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.point === card.point && other.drift === card.drift)).length;
}

export function neighborCardCount(cards: readonly BinnacleCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && bearingIndex(card.bearing) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(bearingIndex(other.bearing) - bearingIndex(card.bearing));
    const ring = Math.min(gap, BEARING_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestHelmsman(cards: readonly BinnacleCard[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.helmsman);
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

export function pairHelmsmanCount(cards: readonly BinnacleCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.helmsman);
  return open.filter((card) => open.filter((item) => item.helmsman.toLowerCase() === card.helmsman.toLowerCase()).length >= 2).length;
}

export function bearingLoad(cards: readonly BinnacleCard[]): number {
  return cards.filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.bearing, 0);
}

export function reminderCards(cards: readonly BinnacleCard[]): BinnacleCard[] {
  return cards.filter((card) => inTray(card, "open") && overdueCard(card));
}

export function idleCards(cards: readonly BinnacleCard[]): BinnacleCard[] {
  return cards.filter((card) => inTray(card, "open") && idleCard(card));
}

export function matchedCards(cards: readonly BinnacleCard[], deskPoint: unknown): BinnacleCard[] {
  const point = pointOf(deskPoint);
  if (!point) return [];
  return cards.filter((card) => inTray(card, "open") && card.point === point);
}

export function nextCard(cards: readonly BinnacleCard[], id: string): BinnacleCard | null {
  const open = sortBinnacle(cards.filter((card) => inTray(card, "open")), "point");
  const at = open.findIndex((card) => card.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function binnacleTimeline(cards: readonly BinnacleCard[]): { bearing: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return BEARING_CYCLE.map((bearing) => ({ bearing, titles: open.filter((card) => card.bearing === bearing).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function binnacleHelmsmen(cards: readonly BinnacleCard[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helmsman || out.some((item) => item.toLowerCase() === card.helmsman.toLowerCase())) continue;
    out.push(card.helmsman);
  }
  return out;
}

export function binnacleCopy(card: BinnacleCard): string {
  return [card.title, card.helmsman, card.point, card.deviation, card.reef, card.drift ?? "", card.bearing, card.note].filter((item) => item !== "").join(" · ");
}

export function binnacleCsv(cards: readonly BinnacleCard[], deskPoint: unknown): string {
  const lines = ["title,helmsman,point,deviation,reef,drift,bearing,tags,pinned,held,archived,lamp,gap,late,idle,weather,lee,house,band,rush,resting,overdue,audit,note"];
  for (const card of readBinnacleCards(cards)) {
    const gap = pointGap(card.point, deskPoint);
    lines.push([
      csvCell(card.title),
      csvCell(card.helmsman),
      card.point,
      card.deviation,
      card.reef,
      card.drift === null ? "" : String(card.drift),
      String(card.bearing),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.lamp ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCard(card, deskPoint) ? "1" : "0",
      idleCard(card) ? "1" : "0",
      weatherPoint(card.point) ? "1" : "0",
      leePoint(card.point) ? "1" : "0",
      houseDeviation(card.deviation) ? "1" : "0",
      pointBand(card.point),
      rushCard(card) ? "1" : "0",
      restingCard(card) ? "1" : "0",
      overdueCard(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function luffRecord(raw: LuffValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function luffTongue(raw: LuffValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = luffRecord(raw);
  if (!row) return "";
  return clip(row.tongue ?? row.language, 40);
}

function luffShore(raw: LuffValue): string {
  const row = luffRecord(raw);
  if (!row) return "";
  return clip(row.shore ?? row.country, 40);
}

function letterRun(name: string): string {
  return name.replace(/[^A-Za-z]/g, "");
}

function vowelCount(name: string): number {
  const letters = letterRun(name).toLowerCase();
  let count = 0;
  for (const char of letters) if ("aeiou".includes(char)) count += 1;
  return count;
}

function consonantCount(name: string): number {
  const letters = letterRun(name).toLowerCase();
  let count = 0;
  for (const char of letters) if (!"aeiou".includes(char)) count += 1;
  return count;
}

function hasMoney(raw: LuffValue): boolean {
  const row = luffRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

/** A money field clears the mark. A language with a letter is set. A blank language is clear. */
export function luffState(raw: LuffValue): LuffState {
  if (hasMoney(raw)) return "";
  return /[A-Za-z]/.test(luffTongue(raw)) ? "set" : "clear";
}

/** First letter of the language plus the letter count of the country. "en" and "TR" is E2. */
export function luffStamp(raw: LuffValue): string {
  if (luffState(raw) !== "set") return "";
  const letters = letterRun(luffTongue(raw));
  if (!letters) return "";
  return `${letters[0].toUpperCase()}${letterRun(luffShore(raw)).length}`;
}

/** A hyphen is a region tag. An underscore is a script tag. A period is a mark. Otherwise the lane follows length. */
export function luffLane(raw: LuffValue): LuffLane {
  if (luffState(raw) !== "set") return "";
  const tongue = luffTongue(raw);
  if (tongue.includes("-")) return "dash";
  if (tongue.includes("_")) return "score";
  if (tongue.includes(".")) return "mark";
  const letters = letterRun(tongue);
  if (letters.length === 2) return "pair";
  if (letters.length === 3) return "trio";
  if (vowelCount(tongue) === 0) return "hush";
  return "long";
}

/** Hue follows the last letter of the country. An exclamation mark is pearl. A digit is soot. */
export function luffHue(raw: LuffValue): LuffHue {
  if (luffState(raw) !== "set") return "";
  const shore = luffShore(raw);
  if (!shore) return "mist";
  if (shore.includes("!")) return "pearl";
  const marks = shore.match(/[A-Za-z0-9]/g);
  const char = marks ? marks[marks.length - 1] : "";
  if (!char) return "mist";
  if (/[0-9]/.test(char)) return "soot";
  const letter = char.toUpperCase();
  if (letter <= "D") return "slate";
  if (letter <= "H") return "sand";
  if (letter <= "M") return "clay";
  if (letter <= "R") return "pearl";
  return "soot";
}

export function luffBound(raw: LuffValue): boolean {
  return luffState(raw) === "set" && /^[aeiou]/i.test(luffShore(raw));
}

export function luffWide(raw: LuffValue): boolean {
  return luffTongue(raw).length >= 8;
}

export function luffNotch(raw: LuffValue): boolean {
  return luffTongue(raw).includes(".");
}

export function luffStep(raw: LuffValue): number {
  if (luffState(raw) !== "set") return 0;
  return Math.min(5, consonantCount(luffTongue(raw)));
}

export function luffJoin(raw: LuffValue): boolean {
  return luffTongue(raw).includes("-");
}

export function luffLanes(rows: readonly LuffRow[]): LuffLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = luffLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingLuff(rows: readonly LuffRow[]): string {
  const bars = luffLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingLuffHue(rows: readonly LuffRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = luffHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedLuffCount(rows: readonly LuffRow[]): number {
  const marks = rows.map((row) => luffStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneLuffCount(rows: readonly LuffRow[], lane: LuffLane): number {
  return rows.filter((row) => luffLane(row.note) === lane).length;
}

export function hueLuffCount(rows: readonly LuffRow[], hue: LuffHue): number {
  return rows.filter((row) => luffHue(row.note) === hue).length;
}

export function luffShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLuffLanes(rows: readonly LuffRow[]): string[] {
  return luffLanes(rows).map((line) => line.lane);
}

export function readHiddenLuffs(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLuffs(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLuff(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleLuffReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLuffReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLuffLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleLuffs(
  rows: readonly LuffRow[],
  lane: string,
  hue: string,
  query: string,
  review: LuffReview,
  reviewed: readonly string[],
  shape: LuffShape,
): LuffRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (luffState(row.note) === "") return false;
    const found = luffLane(row.note);
    const hueName = luffHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${luffTongue(row.note)} ${luffStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "dash" && found !== "dash") return false;
    if (shape === "wide" && !luffWide(row.note)) return false;
    if (shape === "bound" && !luffBound(row.note)) return false;
    if (shape === "notch" && !luffNotch(row.note)) return false;
    if (shape === "score" && found !== "score") return false;
    return true;
  });
}

export function luffCopy(raw: LuffValue): string {
  return [luffStamp(raw), luffLane(raw), luffHue(raw)].filter(Boolean).join(" ");
}

export function luffLanesCsv(rows: readonly LuffRow[]): string {
  const lines = ["lane,count"];
  for (const line of luffLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function luffRowsCsv(rows: readonly LuffRow[], reviewed: readonly string[]): string {
  const lines = ["language,stamp,lane,hue,step,join,wide,notch,bound,dash,score,mark,pair,trio,long,hush,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (luffState(row.note) !== "set") continue;
    const lane = luffLane(row.note);
    lines.push([
      csvCell(luffTongue(row.note)),
      luffStamp(row.note),
      lane,
      luffHue(row.note),
      String(luffStep(row.note)),
      luffJoin(row.note) ? "1" : "0",
      luffWide(row.note) ? "1" : "0",
      luffNotch(row.note) ? "1" : "0",
      luffBound(row.note) ? "1" : "0",
      lane === "dash" ? "1" : "0",
      lane === "score" ? "1" : "0",
      lane === "mark" ? "1" : "0",
      lane === "pair" ? "1" : "0",
      lane === "trio" ? "1" : "0",
      lane === "long" ? "1" : "0",
      lane === "hush" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
