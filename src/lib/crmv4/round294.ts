/**
 * Torquetum arcs for an altitude follow-up kept in this browser, and latch plates read the login-block time already stored on the account.
 * Altitudes are low, mid, high, and zenith. Air is still, haze, and squall.
 * Degrees are 15, 30, or 45. Teeth are 1, 3, or 5.
 * A spark latch was set within two hours. A dust latch is older than ninety days. An ahead latch sits in the future. Dates are read in UTC.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_torquetum (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   scribe text not null default '',
 *   altitude text not null default '',
 *   air text not null default '',
 *   degree_no integer,
 *   tooth_no integer not null default 1,
 *   tags text not null default '',
 *   scribed boolean not null default false,
 *   sleeved boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_latch_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_latch_review (
 *   trader_id text primary key
 * );
 */

export const TRQ_KEY = "crmv4-torquetum";
export const TRQ_VIEW_KEY = "crmv4-torquetum-views";
export const TRQ_DENSITY_KEY = "crmv4-torquetum-density";
export const LTC_KEY = "crmv4-latch-hide";
export const LTC_REVIEW_KEY = "crmv4-latch-review";

export const TORQUETUM_ALTITUDES = ["low", "mid", "high", "zenith"] as const;

export type TorquetumAltitude = (typeof TORQUETUM_ALTITUDES)[number];

export type TorquetumAir = "blank" | "still" | "haze" | "squall";

export type TorquetumTray = "arc" | "sleeve" | "chest";

export type TorquetumDensity = "wide" | "narrow";

export type TorquetumSort = "altitude" | "scribe";

export type Torquetum = {
  id: string;
  title: string;
  note: string;
  scribe: string;
  altitude: string;
  degree: number | null;
  air: string;
  tooth: number;
  tags: string[];
  scribed: boolean;
  sleeved: boolean;
  chested: boolean;
  flagged: boolean;
  audit: string;
};

export type TorquetumView = {
  id: string;
  name: string;
  tray: TorquetumTray;
  query: string;
  scribe: string;
  air: string;
  altitude: string;
  degree: string;
  tooth: string;
};

export type TorquetumCounts = {
  arc: number;
  sleeve: number;
  chest: number;
  scribed: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  degree: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type LatchLane = "" | "spark" | "day" | "fortnight" | "season" | "dust" | "ahead";

export type LatchHue = "" | "ivory" | "graphite" | "champagne";

export type LatchState = "" | "clear" | "set";

export type LatchReview = "all" | "reviewed" | "fresh";

export type LatchShape =
  | "all"
  | "spark"
  | "day"
  | "fortnight"
  | "season"
  | "dust"
  | "ahead"
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

export type LatchValue = string | { loginBlockedAt?: unknown; blocked?: unknown; [key: string]: unknown } | null | undefined;

export type LatchRow = { id: string; label: string; blocked: LatchValue };

export type LatchLaneLine = { lane: string; count: number };

export const ROUND294_FEATURES = [
  "save",
  "note",
  "trays",
  "air",
  "degree",
  "chest",
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
  "fair-scribe",
  "viewer",
  "suggest",
  "sla",
  "latch",
  "latch-csv",
] as const;

const AUDITS = ["save", "edit", "note", "air", "scribe", "unscribe", "sleeve", "resume", "chest", "open", "tag", "tooth", "degree", "lower", "star"] as const;

const AIRS = ["still", "haze", "squall"] as const;

const DEGREE_CYCLE = [15, 30, 45] as const;

const TOOTH_CYCLE = [1, 3, 5] as const;

const INNER = new Set(["low", "mid"]);

const OUTER = new Set(["high", "zenith"]);

const HOUSE_AIR = new Set(["HAZE", "SQUALL"]);

const LANE_ORDER = ["spark", "day", "fortnight", "season", "dust", "ahead"] as const;

const HUE_ORDER = ["champagne", "ivory", "graphite"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const MINUTE_MS = 60 * 1000;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const SPARK_MS = 2 * HOUR_MS;

const SOON_MS = 90 * MINUTE_MS;

const FORTNIGHT_MS = 14 * DAY_MS;

const SEASON_MS = 90 * DAY_MS;

const YEAR_MS = 3 * 365 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TorquetumTray {
  return raw === "sleeve" || raw === "chest" ? raw : "arc";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function airName(raw: unknown): Exclude<TorquetumAir, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (AIRS as readonly string[]).includes(text) ? (text as Exclude<TorquetumAir, "blank">) : "";
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

function inTray(card: Torquetum, tray: TorquetumTray): boolean {
  if (tray === "sleeve") return card.sleeved && !card.chested;
  if (tray === "chest") return card.chested;
  return !card.sleeved && !card.chested;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function altitudeIndex(altitude: string): number {
  return TORQUETUM_ALTITUDES.indexOf(altitude as TorquetumAltitude);
}

function degreeIndex(degree: number): number {
  return DEGREE_CYCLE.indexOf(degree as (typeof DEGREE_CYCLE)[number]);
}

function toothIndex(tooth: number): number {
  return TOOTH_CYCLE.indexOf(tooth as (typeof TOOTH_CYCLE)[number]);
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

export function torquetumAltitude(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TORQUETUM_ALTITUDES as readonly string[]).includes(text) ? text : "";
}

/** A degree is 15, 30, or 45. Anything else stays blank. */
export function torquetumDegree(raw: unknown): 15 | 30 | 45 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45") return null;
  return Number(text) as 15 | 30 | 45;
}

/** A tooth is 1, 3, or 5. Anything else stays blank. */
export function torquetumTooth(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** Air is still, haze, or squall. The saved air is the upper case name. */
export function torquetumAir(raw: unknown): string {
  const text = airName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerAltitude(altitude: unknown): boolean {
  return INNER.has(clip(altitude, 12).toLowerCase());
}

export function outerAltitude(altitude: unknown): boolean {
  return OUTER.has(clip(altitude, 12).toLowerCase());
}

/** Low is the floor. Mid is the rail. High is the arch. Zenith is the crown. */
export function torquetumBand(altitude: unknown): string {
  const text = torquetumAltitude(altitude);
  if (!text) return "";
  if (text === "low") return "floor";
  if (text === "mid") return "rail";
  if (text === "high") return "arch";
  return "crown";
}

/** Signed distance from one altitude to the desk altitude. */
export function altitudeGap(from: unknown, to: unknown): number | null {
  const left = altitudeIndex(torquetumAltitude(from));
  const right = altitudeIndex(torquetumAltitude(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseAir(air: unknown): boolean {
  return HOUSE_AIR.has(torquetumAir(air));
}

/** A pair tooth is 3. One and five are not a pair. */
export function pairTooth(tooth: unknown): boolean {
  return torquetumTooth(tooth) === 3;
}

/** A full tooth is 5. */
export function fullTooth(tooth: unknown): boolean {
  return torquetumTooth(tooth) === 5;
}

export function activeAltitude(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return torquetumAltitude(text) || "all";
}

export function activeDegree(raw: unknown): string {
  const degree = torquetumDegree(raw);
  return degree === null ? "all" : String(degree);
}

export function activeAir(raw: unknown, allow: readonly string[]): string {
  const text = torquetumAir(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = torquetumTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function moveTorquetumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestTorquetumAir(cards: readonly Torquetum[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "arc") || !card.air) continue;
    counts.set(card.air, (counts.get(card.air) || 0) + 1);
  }
  let best = "STILL";
  let score = 0;
  for (const air of ["STILL", "HAZE", "SQUALL"]) {
    const count = counts.get(air) || 0;
    if (count > score) {
      best = air;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest fifteen. Through the afternoon, thirty. Evening asks for forty-five. Saved degrees win when any exist. */
export function suggestDegree(cards: readonly Torquetum[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "arc") || card.degree === null) continue;
    counts.set(card.degree, (counts.get(card.degree) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const degree of DEGREE_CYCLE) {
    const count = counts.get(degree) || 0;
    if (count > score) {
      best = degree;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 9) return 15;
  if (hour < 16) return 30;
  return 45;
}

/** Before eleven, suggest low. The rest of the day suggests zenith. */
export function suggestAltitude(hour: number): TorquetumAltitude {
  return hour < 11 ? "low" : "zenith";
}

/** The scribe with the fewest unscribed arcs on the arm. A tie keeps the roster order. */
export function fairArcScribe(cards: readonly Torquetum[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "arc") && !card.scribed);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.scribe.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readTorquetums(raw: unknown): Torquetum[] {
  if (!Array.isArray(raw)) return [];
  const out: Torquetum[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Torquetum>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      scribe: clip(row.scribe, 24),
      altitude: torquetumAltitude(row.altitude),
      degree: torquetumDegree(row.degree),
      air: torquetumAir(row.air),
      tooth: torquetumTooth(row.tooth) ?? 1,
      tags: tagsOf(row.tags),
      scribed: row.scribed === true,
      sleeved: row.sleeved === true,
      chested: row.chested === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addTorquetum(
  cards: readonly Torquetum[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    scribe?: string;
    altitude?: string;
    degree?: unknown;
    air?: string;
    tooth?: unknown;
    tags?: unknown;
  },
): Torquetum[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTorquetums([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      scribe: clip(card.scribe, 24),
      altitude: torquetumAltitude(card.altitude),
      degree: torquetumDegree(card.degree),
      air: torquetumAir(card.air),
      tooth: torquetumTooth(card.tooth) ?? 1,
      tags: tagsOf(card.tags),
      scribed: false,
      sleeved: false,
      chested: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Torquetum[], id: string, edit: (card: Torquetum) => Torquetum): Torquetum[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTorquetum(cards: readonly Torquetum[], id: string, title: string): Torquetum[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTorquetumNote(cards: readonly Torquetum[], id: string, note: string): Torquetum[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleAir(air: string): string {
  const order = ["", "STILL", "HAZE", "SQUALL"];
  const index = order.indexOf(torquetumAir(air));
  return order[(index + 1) % order.length] || "STILL";
}

export function setTorquetumAir(cards: readonly Torquetum[], id: string, air: string): Torquetum[] {
  const next = torquetumAir(air);
  return mapCard(cards, id, (card) => (card.air === next ? card : { ...card, air: next, audit: "air" }));
}

export function setTorquetumScribed(cards: readonly Torquetum[], id: string, scribed: boolean): Torquetum[] {
  return mapCard(cards, id, (card) => (card.scribed === scribed ? card : { ...card, scribed, audit: scribed ? "scribe" : "unscribe" }));
}

export function setTorquetumSleeve(cards: readonly Torquetum[], id: string, sleeved: boolean): Torquetum[] {
  return mapCard(cards, id, (card) => (card.sleeved === sleeved ? card : { ...card, sleeved, chested: sleeved ? false : card.chested, audit: sleeved ? "sleeve" : "resume" }));
}

export function setTorquetumChest(cards: readonly Torquetum[], id: string, chested: boolean): Torquetum[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, sleeved: chested ? false : card.sleeved, audit: chested ? "chest" : "open" }));
}

export function setTorquetumStar(cards: readonly Torquetum[], id: string, flagged: boolean): Torquetum[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addTorquetumTag(cards: readonly Torquetum[], id: string, tag: string): Torquetum[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDegree(degree: number | null, dir: 1 | -1): 15 | 30 | 45 {
  if (degree === null) return dir > 0 ? 15 : 45;
  const index = degreeIndex(degree);
  const next = index < 0 ? 0 : (index + dir + DEGREE_CYCLE.length) % DEGREE_CYCLE.length;
  return DEGREE_CYCLE[next];
}

function stepTooth(tooth: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + TOOTH_CYCLE.length) % TOOTH_CYCLE.length;
  return TOOTH_CYCLE[next];
}

export function liftDegree(cards: readonly Torquetum[], id: string): Torquetum[] {
  return mapCard(cards, id, (card) => ({ ...card, degree: stepDegree(card.degree, 1), audit: "degree" }));
}

export function lowerDegree(cards: readonly Torquetum[], id: string): Torquetum[] {
  return mapCard(cards, id, (card) => ({ ...card, degree: stepDegree(card.degree, -1), audit: "lower" }));
}

export function raiseTooth(cards: readonly Torquetum[], id: string): Torquetum[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Torquetum[], id: string): Torquetum[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "tooth" }));
}

function focused(cards: readonly Torquetum[], id: string, edit: (card: Torquetum) => Torquetum): Torquetum[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function scribeTorquetumFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return focused(cards, id, (card) => ({ ...card, scribed: !card.scribed, audit: card.scribed ? "unscribe" : "scribe" }));
}

export function sleeveTorquetumFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return setTorquetumSleeve(cards, id, !cards.find((card) => card.id === id)?.sleeved);
}

export function starTorquetumFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return setTorquetumStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagTorquetumFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return addTorquetumTag(cards, id, "a");
}

export function airFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTorquetumAir(cards, id, cycleAir(card.air)) : [...cards];
}

export function liftDegreeFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return liftDegree(cards, id);
}

export function lowerDegreeFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return lowerDegree(cards, id);
}

export function raiseToothFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Torquetum[], id: string): Torquetum[] {
  return lowerTooth(cards, id);
}

function bulk(cards: readonly Torquetum[], ids: readonly string[], edit: (card: Torquetum) => Torquetum): Torquetum[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTorquetumSquall(cards: readonly Torquetum[], ids: readonly string[]): Torquetum[] {
  return bulk(cards, ids, (card) => (card.air === "SQUALL" ? card : { ...card, air: "SQUALL", audit: "air" }));
}

export function bulkTorquetumScribe(cards: readonly Torquetum[], ids: readonly string[]): Torquetum[] {
  return bulk(cards, ids, (card) => (card.scribed ? card : { ...card, scribed: true, audit: "scribe" }));
}

export function bulkTorquetumChest(cards: readonly Torquetum[], ids: readonly string[]): Torquetum[] {
  return bulk(cards, ids, (card) => (card.chested ? card : { ...card, chested: true, sleeved: false, audit: "chest" }));
}

export function bulkTorquetumTag(cards: readonly Torquetum[], ids: readonly string[]): Torquetum[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readTorquetumViews(raw: unknown): TorquetumView[] {
  if (!Array.isArray(raw)) return [];
  const out: TorquetumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TorquetumView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      scribe: clip(row.scribe, 24),
      air: activeAir(row.air, ["STILL", "HAZE", "SQUALL"]),
      altitude: activeAltitude(row.altitude),
      degree: activeDegree(row.degree),
      tooth: activeTooth(row.tooth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTorquetumView(views: readonly TorquetumView[], view: TorquetumView): TorquetumView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTorquetumViews([...views, { ...view, id, name }]);
}

export function dropTorquetumView(views: readonly TorquetumView[], id: string): TorquetumView[] {
  return views.filter((view) => view.id !== id);
}

export function torquetumDensity(raw: unknown): TorquetumDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortTorquetums(cards: readonly Torquetum[], sort: TorquetumSort): Torquetum[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "scribe") {
      const scribe = a.scribe.localeCompare(b.scribe);
      if (scribe) return scribe;
    } else {
      const altitude = altitudeIndex(a.altitude) - altitudeIndex(b.altitude);
      if (altitude) return altitude;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleTorquetums(
  cards: readonly Torquetum[],
  tray: TorquetumTray,
  query: string,
  scribe: string,
  air: string,
  altitude: string,
  degree: string,
  tooth: string,
): Torquetum[] {
  const text = query.trim().toLowerCase();
  const wantScribe = clip(scribe, 24).toLowerCase();
  const wantAir = air === "all" ? "" : torquetumAir(air);
  const wantAltitude = activeAltitude(altitude);
  const wantDegree = activeDegree(degree);
  const wantTooth = activeTooth(tooth);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.scribe}`.toLowerCase().includes(text)) return false;
    if (wantScribe && card.scribe.toLowerCase() !== wantScribe) return false;
    if (wantAir && card.air !== wantAir) return false;
    if (wantAltitude === "inner" && !innerAltitude(card.altitude)) return false;
    if (wantAltitude === "outer" && !outerAltitude(card.altitude)) return false;
    if (wantAltitude !== "all" && wantAltitude !== "inner" && wantAltitude !== "outer" && card.altitude !== wantAltitude) return false;
    if (wantDegree !== "all" && String(card.degree ?? "") !== wantDegree) return false;
    if (wantTooth !== "all" && String(card.tooth) !== wantTooth) return false;
    return true;
  });
}

/** An outer altitude on tooth one, still unscribed and not in the chest, is overdue. */
export function overdueTorquetum(card: Torquetum): boolean {
  return outerAltitude(card.altitude) && card.tooth === 1 && !card.scribed && !card.chested;
}

/** No air, the short degree, tooth one, and still on the arc. */
export function idleTorquetum(card: Torquetum): boolean {
  return !card.air && card.degree === 15 && card.tooth === 1 && !card.scribed && !card.sleeved && !card.chested;
}

/** Squall, a wide degree, and a full tooth, still out of the chest. */
export function briskTorquetum(card: Torquetum): boolean {
  return card.air === "SQUALL" && card.degree === 45 && card.tooth === 5 && !card.chested;
}

/** Zenith, still air, and a middle degree. */
export function restingTorquetum(card: Torquetum): boolean {
  return card.altitude === "zenith" && card.air === "STILL" && card.degree === 30;
}

/** A low arc is late when the desk is already at zenith. */
export function lateTorquetum(card: Torquetum, desk: string): boolean {
  return card.altitude === "low" && torquetumAltitude(desk) === "zenith" && !card.scribed;
}

export function torquetumCounts(cards: readonly Torquetum[], shown: readonly Torquetum[], desk: string): TorquetumCounts {
  return {
    arc: cards.filter((card) => inTray(card, "arc")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    scribed: cards.filter((card) => card.scribed).length,
    inner: cards.filter((card) => innerAltitude(card.altitude)).length,
    outer: cards.filter((card) => outerAltitude(card.altitude)).length,
    wide: cards.filter((card) => card.degree === 45).length,
    house: cards.filter((card) => houseAir(card.air)).length,
    degree: cards.reduce((sum, card) => sum + (card.degree || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleTorquetum).length,
    brisk: cards.filter(briskTorquetum).length,
    resting: cards.filter(restingTorquetum).length,
    overdue: cards.filter(overdueTorquetum).length,
    pair: cards.filter((card) => pairTooth(card.tooth) && lateTorquetum(card, desk)).length,
  };
}

export function torquetumBars(cards: readonly Torquetum[]): { altitude: string; count: number }[] {
  return TORQUETUM_ALTITUDES.map((altitude) => ({ altitude, count: cards.filter((card) => card.altitude === altitude && !card.chested).length }));
}

export function torquetumTimeline(cards: readonly Torquetum[]): { degree: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "arc"));
  return DEGREE_CYCLE.map((degree) => ({ degree, titles: open.filter((card) => card.degree === degree).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function torquetumScribes(cards: readonly Torquetum[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.scribe && !out.some((name) => name.toLowerCase() === card.scribe.toLowerCase())) out.push(card.scribe);
  }
  return out;
}

export function busiestArcScribe(cards: readonly Torquetum[]): string {
  const open = cards.filter((card) => inTray(card, "arc") && !card.scribed && card.scribe);
  let best = "";
  let score = 0;
  for (const name of torquetumScribes(open)) {
    const count = open.filter((card) => card.scribe.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTorquetums(cards: readonly Torquetum[]): string[] {
  return cards.filter(overdueTorquetum).map((card) => card.title);
}

export function torquetumCopy(card: Torquetum): string {
  return [card.title, card.scribe, card.altitude, card.air, card.degree ?? "", card.tooth, card.note].filter((item) => item !== "").join(" · ");
}

export function torquetumCsv(cards: readonly Torquetum[], desk: string): string {
  const lines = ["title,scribe,altitude,air,degree,tooth,tags,scribed,sleeve,chest,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.scribe),
        card.altitude,
        card.air,
        card.degree ?? "",
        card.tooth,
        card.tags.join(" "),
        card.scribed ? "1" : "0",
        card.sleeved ? "1" : "0",
        card.chested ? "1" : "0",
        card.flagged ? "1" : "0",
        outerAltitude(card.altitude) ? "1" : "0",
        lateTorquetum(card, desk) ? "1" : "0",
        idleTorquetum(card) ? "1" : "0",
        briskTorquetum(card) ? "1" : "0",
        restingTorquetum(card) ? "1" : "0",
        overdueTorquetum(card) ? "1" : "0",
        innerAltitude(card.altitude) ? "1" : "0",
        houseAir(card.air) ? "1" : "0",
        torquetumBand(card.altitude),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: LatchValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function latchRecord(raw: LatchValue): { loginBlockedAt?: unknown; blocked?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function latchGiven(raw: LatchValue): string {
  const row = latchRecord(raw);
  if (row && !("loginBlockedAt" in row) && !("blocked" in row)) return "";
  const value = row ? row.loginBlockedAt ?? row.blocked : raw;
  return clip(value, 40);
}

function latchStateRaw(raw: LatchValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = latchRecord(raw);
  if (row && !("loginBlockedAt" in row) && !("blocked" in row)) return "blocked";
  return "open";
}

function latchDate(raw: LatchValue, now = Date.now()): Date | null {
  if (latchStateRaw(raw) === "blocked") return null;
  const text = latchGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const delta = at - now;
  if (delta > YEAR_MS || delta < -YEAR_MS) return null;
  return new Date(at);
}

function latchDelta(raw: LatchValue, now: number): number | null {
  const at = latchDate(raw, now);
  if (!at) return null;
  return at.getTime() - now;
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function latchState(raw: LatchValue, now = Date.now()): LatchState {
  if (latchStateRaw(raw) === "blocked") return "";
  return latchDate(raw, now) ? "set" : "clear";
}

/** Spark within two hours, then day, fortnight, and season. Older than ninety days is dust. A future stamp is ahead. */
export function latchLane(raw: LatchValue, now = Date.now()): LatchLane {
  if (latchState(raw, now) !== "set") return "";
  const delta = latchDelta(raw, now);
  if (delta === null) return "";
  if (delta > 0) return "ahead";
  const age = -delta;
  if (age <= SPARK_MS) return "spark";
  if (age <= DAY_MS) return "day";
  if (age <= FORTNIGHT_MS) return "fortnight";
  if (age <= SEASON_MS) return "season";
  return "dust";
}

export function latchHue(raw: LatchValue, now = Date.now()): LatchHue {
  const lane = latchLane(raw, now);
  if (!lane) return "";
  if (lane === "spark" || lane === "ahead") return "champagne";
  if (lane === "day" || lane === "fortnight") return "ivory";
  return "graphite";
}

export function latchSpark(raw: LatchValue, now = Date.now()): boolean {
  return latchLane(raw, now) === "spark";
}

export function latchDust(raw: LatchValue, now = Date.now()): boolean {
  return latchLane(raw, now) === "dust";
}

export function latchAhead(raw: LatchValue, now = Date.now()): boolean {
  return latchLane(raw, now) === "ahead";
}

export function latchOpen(raw: LatchValue, now = Date.now()): boolean {
  return latchState(raw, now) === "clear";
}

/** Still fresh enough to act: spark, day, or fortnight. */
export function latchHeld(raw: LatchValue, now = Date.now()): boolean {
  const lane = latchLane(raw, now);
  return lane === "spark" || lane === "day" || lane === "fortnight";
}

/** A fresh latch was set within ninety minutes. */
export function latchSoon(raw: LatchValue, now = Date.now()): boolean {
  const delta = latchDelta(raw, now);
  if (delta === null || delta > 0) return false;
  const age = -delta;
  return age > 0 && age <= SOON_MS;
}

export function latchMinutes(raw: LatchValue, now = Date.now()): number | null {
  const delta = latchDelta(raw, now);
  if (delta === null || delta > 0) return null;
  return Math.trunc(-delta / MINUTE_MS);
}

export function latchToday(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function latchWeekday(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day >= 1 && day <= 5;
}

export function latchWeekend(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function latchMorning(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  return Boolean(at) && at!.getUTCHours() < 12;
}

export function latchEvening(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  return Boolean(at) && at!.getUTCHours() >= 18;
}

export function latchEven(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function latchFirst(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  return Boolean(at) && at!.getUTCDate() === 1;
}

export function latchStep(raw: LatchValue, now = Date.now()): number {
  const at = latchDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

export function latchLeap(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

export function latchTwin(raw: LatchValue, now = Date.now()): boolean {
  const at = latchDate(raw, now);
  if (!at) return false;
  return at.getUTCDay() === new Date(now).getUTCDay();
}

export function latchTail(raw: LatchValue): boolean {
  return /z$/i.test(latchGiven(raw).trim());
}

export function latchMark(raw: LatchValue): boolean {
  return latchGiven(raw).includes("T");
}

export function latchSpace(raw: LatchValue): boolean {
  return latchGiven(raw).includes(" ");
}

export function latchStamp(raw: LatchValue, now = Date.now()): string {
  const at = latchDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function latchCopy(raw: LatchValue): string {
  return latchGiven(raw);
}

export function latchLanes(rows: readonly LatchRow[], now = Date.now()): LatchLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = latchLane(row.blocked, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingLatch(rows: readonly LatchRow[], now = Date.now()): string {
  const lines = latchLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingLatchHue(rows: readonly LatchRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = latchHue(row.blocked, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneLatchCount(rows: readonly LatchRow[], lane: LatchLane, now = Date.now()): number {
  return rows.filter((row) => latchLane(row.blocked, now) === lane).length;
}

export function latchShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLatchLanes(rows: readonly LatchRow[], now = Date.now()): string[] {
  return latchLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenLatch(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLatch(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLatch(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleLatchReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLatchReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLatchLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: LatchRow, shape: LatchShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "spark") return latchSpark(row.blocked, now);
  if (shape === "dust") return latchDust(row.blocked, now);
  if (shape === "ahead") return latchAhead(row.blocked, now);
  if (shape === "open") return latchOpen(row.blocked, now);
  if (shape === "soon") return latchSoon(row.blocked, now);
  if (shape === "today") return latchToday(row.blocked, now);
  if (shape === "weekday") return latchWeekday(row.blocked, now);
  if (shape === "weekend") return latchWeekend(row.blocked, now);
  if (shape === "morning") return latchMorning(row.blocked, now);
  if (shape === "evening") return latchEvening(row.blocked, now);
  if (shape === "leap") return latchLeap(row.blocked, now);
  if (shape === "first") return latchFirst(row.blocked, now);
  if (shape === "even") return latchEven(row.blocked, now);
  if (shape === "twin") return latchTwin(row.blocked, now);
  if (shape === "tail") return latchTail(row.blocked);
  if (shape === "mark") return latchMark(row.blocked);
  if (shape === "space") return latchSpace(row.blocked);
  if (shape === "held") return latchHeld(row.blocked, now);
  return latchLane(row.blocked, now) === shape;
}

export function visibleLatch(
  rows: readonly LatchRow[],
  lane: string,
  hue: string,
  query: string,
  review: LatchReview,
  reviewed: readonly string[],
  shape: LatchShape,
  now = Date.now(),
): LatchRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (latchState(row.blocked, now) === "") return false;
    const found = latchLane(row.blocked, now);
    const hueName = latchHue(row.blocked, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${latchGiven(row.blocked)} ${latchStamp(row.blocked, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function latchLanesCsv(rows: readonly LatchRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of latchLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function latchRowsCsv(rows: readonly LatchRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,blocked,stamp,lane,hue,step,minutes,spark,dust,ahead,today,weekday,weekend,morning,evening,leap,first,even,twin,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (latchState(row.blocked, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(latchGiven(row.blocked)),
        latchStamp(row.blocked, now),
        latchLane(row.blocked, now),
        latchHue(row.blocked, now),
        String(latchStep(row.blocked, now)),
        String(latchMinutes(row.blocked, now) ?? ""),
        latchSpark(row.blocked, now) ? "1" : "0",
        latchDust(row.blocked, now) ? "1" : "0",
        latchAhead(row.blocked, now) ? "1" : "0",
        latchToday(row.blocked, now) ? "1" : "0",
        latchWeekday(row.blocked, now) ? "1" : "0",
        latchWeekend(row.blocked, now) ? "1" : "0",
        latchMorning(row.blocked, now) ? "1" : "0",
        latchEvening(row.blocked, now) ? "1" : "0",
        latchLeap(row.blocked, now) ? "1" : "0",
        latchFirst(row.blocked, now) ? "1" : "0",
        latchEven(row.blocked, now) ? "1" : "0",
        latchTwin(row.blocked, now) ? "1" : "0",
        latchHeld(row.blocked, now) ? "1" : "0",
        latchSoon(row.blocked, now) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
