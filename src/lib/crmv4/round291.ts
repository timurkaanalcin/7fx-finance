/**
 * Orrery orbs for a follow-up instrument kept in this browser, and ward plates read the lockout time already stored on the account.
 * Worlds are mercury, venus, mars, and saturn. Climates are frost, mild, and blaze.
 * Radii are 2, 4, or 8. Moons are 0, 2, or 4.
 * An hour lock ends within sixty minutes. A spent lock is already in the past. Dates are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_orrery (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   world text not null default '',
 *   climate text not null default '',
 *   radius_no integer,
 *   moon_no integer not null default 0,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   cradled boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_ward_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_ward_review (
 *   trader_id text primary key
 * );
 */

export const ORY_KEY = "crmv4-orrery";
export const ORY_VIEW_KEY = "crmv4-orrery-views";
export const ORY_DENSITY_KEY = "crmv4-orrery-density";
export const WRD_KEY = "crmv4-ward-hide";
export const WRD_REVIEW_KEY = "crmv4-ward-review";

export const ORRERY_WORLDS = ["mercury", "venus", "mars", "saturn"] as const;

export type OrreryWorld = (typeof ORRERY_WORLDS)[number];

export type OrreryClimate = "blank" | "frost" | "mild" | "blaze";

export type OrreryTray = "arm" | "cradle" | "coffer";

export type OrreryDensity = "wide" | "narrow";

export type OrrerySort = "world" | "keeper";

export type Orrery = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  world: string;
  radius: number | null;
  climate: string;
  moon: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type OrreryView = {
  id: string;
  name: string;
  tray: OrreryTray;
  query: string;
  keeper: string;
  climate: string;
  world: string;
  radius: string;
  moon: string;
};

export type OrreryCounts = {
  arm: number;
  cradle: number;
  coffer: number;
  logged: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  radius: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type WardLane = "" | "hour" | "day" | "week" | "far" | "spent";

export type WardHue = "" | "ivory" | "graphite" | "champagne";

export type WardState = "" | "clear" | "set";

export type WardReview = "all" | "reviewed" | "fresh";

export type WardShape =
  | "all"
  | "hour"
  | "day"
  | "week"
  | "far"
  | "spent"
  | "open"
  | "soon"
  | "today"
  | "weekday"
  | "weekend"
  | "morning"
  | "leap"
  | "first"
  | "even"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "held";

export type WardValue = string | { lockedUntil?: unknown; until?: unknown; [key: string]: unknown } | null | undefined;

export type WardRow = { id: string; label: string; until: WardValue };

export type WardLaneLine = { lane: string; count: number };

export const ROUND291_FEATURES = [
  "save",
  "note",
  "trays",
  "climate",
  "radius",
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "ward",
  "ward-csv",
] as const;

const AUDITS = ["save", "edit", "note", "climate", "log", "unlog", "cradle", "resume", "stow", "open", "tag", "moon", "radius", "lower", "star"] as const;

const CLIMATES = ["frost", "mild", "blaze"] as const;

const RADIUS_CYCLE = [2, 4, 8] as const;

const MOON_CYCLE = [0, 2, 4] as const;

const INNER = new Set(["mercury", "venus"]);

const OUTER = new Set(["mars", "saturn"]);

const HOUSE_CLIMATE = new Set(["MILD", "BLAZE"]);

const LANE_ORDER = ["hour", "day", "week", "far", "spent"] as const;

const HUE_ORDER = ["champagne", "ivory", "graphite"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const MINUTE_MS = 60 * 1000;

const SOON_MS = 15 * MINUTE_MS;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const WEEK_MS = 7 * DAY_MS;

const YEAR_MS = 3 * 365 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): OrreryTray {
  return raw === "cradle" || raw === "coffer" ? raw : "arm";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function climateName(raw: unknown): Exclude<OrreryClimate, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLIMATES as readonly string[]).includes(text) ? (text as Exclude<OrreryClimate, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[xy]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Orrery, tray: OrreryTray): boolean {
  if (tray === "cradle") return card.locked && !card.stowed;
  if (tray === "coffer") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function worldIndex(world: string): number {
  return ORRERY_WORLDS.indexOf(world as OrreryWorld);
}

function radiusIndex(radius: number): number {
  return RADIUS_CYCLE.indexOf(radius as (typeof RADIUS_CYCLE)[number]);
}

function moonIndex(moon: number): number {
  return MOON_CYCLE.indexOf(moon as (typeof MOON_CYCLE)[number]);
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

export function orreryWorld(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ORRERY_WORLDS as readonly string[]).includes(text) ? text : "";
}

/** A radius is 2, 4, or 8. Anything else stays blank. */
export function orreryRadius(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A moon is 0, 2, or 4. Anything else stays blank. */
export function orreryMoon(raw: unknown): 0 | 2 | 4 | null {
  const text = wholeToken(raw);
  if (text !== "0" && text !== "2" && text !== "4") return null;
  return Number(text) as 0 | 2 | 4;
}

/** Climate is frost, mild, or blaze. The saved climate is the upper case name. */
export function orreryClimate(raw: unknown): string {
  const text = climateName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerWorld(world: unknown): boolean {
  return INNER.has(clip(world, 12).toLowerCase());
}

export function outerWorld(world: unknown): boolean {
  return OUTER.has(clip(world, 12).toLowerCase());
}

/** Mercury is inner. Venus is warm. Mars is red. Saturn is ring. */
export function orreryBand(world: unknown): string {
  const text = orreryWorld(world);
  if (!text) return "";
  if (text === "mercury") return "inner";
  if (text === "venus") return "warm";
  if (text === "mars") return "red";
  return "ring";
}

/** Signed distance from one world to the desk world. */
export function worldGap(from: unknown, to: unknown): number | null {
  const left = worldIndex(orreryWorld(from));
  const right = worldIndex(orreryWorld(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseClimate(climate: unknown): boolean {
  return HOUSE_CLIMATE.has(orreryClimate(climate));
}

/** A pair moon is 2. Zero and four are not a pair. */
export function pairMoon(moon: unknown): boolean {
  return orreryMoon(moon) === 2;
}

/** A full moon is 4. */
export function fullMoon(moon: unknown): boolean {
  return orreryMoon(moon) === 4;
}

export function activeWorld(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return orreryWorld(text) || "all";
}

export function activeRadius(raw: unknown): string {
  const radius = orreryRadius(raw);
  return radius === null ? "all" : String(radius);
}

export function activeClimate(raw: unknown, allow: readonly string[]): string {
  const text = orreryClimate(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeMoon(raw: unknown): string {
  const moon = orreryMoon(raw);
  return moon === null ? "all" : String(moon);
}

export function moveOrreryFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestOrreryClimate(cards: readonly Orrery[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "arm") || !card.climate) continue;
    counts.set(card.climate, (counts.get(card.climate) || 0) + 1);
  }
  let best = "FROST";
  let score = 0;
  for (const climate of ["FROST", "MILD", "BLAZE"]) {
    const count = counts.get(climate) || 0;
    if (count > score) {
      best = climate;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest two. Through the afternoon, four. Evening asks for eight. Saved radii win when any exist. */
export function suggestRadius(cards: readonly Orrery[], hour: number): 2 | 4 | 8 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "arm") || card.radius === null) continue;
    counts.set(card.radius, (counts.get(card.radius) || 0) + 1);
  }
  let best: 2 | 4 | 8 | null = null;
  let score = 0;
  for (const radius of RADIUS_CYCLE) {
    const count = counts.get(radius) || 0;
    if (count > score) {
      best = radius;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 2;
  if (hour < 16) return 4;
  return 8;
}

/** Before noon, suggest mercury. The rest of the day suggests saturn. */
export function suggestWorld(hour: number): OrreryWorld {
  return hour < 12 ? "mercury" : "saturn";
}

/** The keeper with the fewest unlogged orbs on the arm. A tie keeps the roster order. */
export function fairOrbKeeper(cards: readonly Orrery[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "arm") && !card.logged);
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

export function readOrrerys(raw: unknown): Orrery[] {
  if (!Array.isArray(raw)) return [];
  const out: Orrery[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Orrery>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      world: orreryWorld(row.world),
      radius: orreryRadius(row.radius),
      climate: orreryClimate(row.climate),
      moon: orreryMoon(row.moon) ?? 0,
      tags: tagsOf(row.tags),
      logged: row.logged === true,
      locked: row.locked === true,
      stowed: row.stowed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addOrrery(
  cards: readonly Orrery[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    world?: string;
    radius?: unknown;
    climate?: string;
    moon?: unknown;
    tags?: unknown;
  },
): Orrery[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOrrerys([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      world: orreryWorld(card.world),
      radius: orreryRadius(card.radius),
      climate: orreryClimate(card.climate),
      moon: orreryMoon(card.moon) ?? 0,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Orrery[], id: string, edit: (card: Orrery) => Orrery): Orrery[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOrrery(cards: readonly Orrery[], id: string, title: string): Orrery[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOrreryNote(cards: readonly Orrery[], id: string, note: string): Orrery[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleClimate(climate: string): string {
  const order = ["", "FROST", "MILD", "BLAZE"];
  const index = order.indexOf(orreryClimate(climate));
  return order[(index + 1) % order.length] || "FROST";
}

export function setOrreryClimate(cards: readonly Orrery[], id: string, climate: string): Orrery[] {
  const next = orreryClimate(climate);
  return mapCard(cards, id, (card) => (card.climate === next ? card : { ...card, climate: next, audit: "climate" }));
}

export function setOrreryLogged(cards: readonly Orrery[], id: string, logged: boolean): Orrery[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setOrreryCradle(cards: readonly Orrery[], id: string, locked: boolean): Orrery[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "cradle" : "resume" }));
}

export function setOrreryStow(cards: readonly Orrery[], id: string, stowed: boolean): Orrery[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setOrreryStar(cards: readonly Orrery[], id: string, flagged: boolean): Orrery[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addOrreryTag(cards: readonly Orrery[], id: string, tag: string): Orrery[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepRadius(radius: number | null, dir: 1 | -1): 2 | 4 | 8 {
  if (radius === null) return dir > 0 ? 2 : 8;
  const index = radiusIndex(radius);
  const next = index < 0 ? 0 : (index + dir + RADIUS_CYCLE.length) % RADIUS_CYCLE.length;
  return RADIUS_CYCLE[next];
}

function stepMoon(moon: number, dir: 1 | -1): 0 | 2 | 4 {
  const index = moonIndex(moon);
  const next = index < 0 ? 0 : (index + dir + MOON_CYCLE.length) % MOON_CYCLE.length;
  return MOON_CYCLE[next];
}

export function liftRadius(cards: readonly Orrery[], id: string): Orrery[] {
  return mapCard(cards, id, (card) => ({ ...card, radius: stepRadius(card.radius, 1), audit: "radius" }));
}

export function lowerRadius(cards: readonly Orrery[], id: string): Orrery[] {
  return mapCard(cards, id, (card) => ({ ...card, radius: stepRadius(card.radius, -1), audit: "lower" }));
}

export function raiseMoon(cards: readonly Orrery[], id: string): Orrery[] {
  return mapCard(cards, id, (card) => ({ ...card, moon: stepMoon(card.moon, 1), audit: "moon" }));
}

export function lowerMoon(cards: readonly Orrery[], id: string): Orrery[] {
  return mapCard(cards, id, (card) => ({ ...card, moon: stepMoon(card.moon, -1), audit: "moon" }));
}

function focused(cards: readonly Orrery[], id: string, edit: (card: Orrery) => Orrery): Orrery[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logOrreryFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function cradleOrreryFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return setOrreryCradle(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starOrreryFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return setOrreryStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagOrreryFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return addOrreryTag(cards, id, "x");
}

export function climateFocused(cards: readonly Orrery[], id: string): Orrery[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOrreryClimate(cards, id, cycleClimate(card.climate)) : [...cards];
}

export function liftRadiusFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return liftRadius(cards, id);
}

export function lowerRadiusFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return lowerRadius(cards, id);
}

export function raiseMoonFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return raiseMoon(cards, id);
}

export function lowerMoonFocused(cards: readonly Orrery[], id: string): Orrery[] {
  return lowerMoon(cards, id);
}

function bulk(cards: readonly Orrery[], ids: readonly string[], edit: (card: Orrery) => Orrery): Orrery[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOrreryBlaze(cards: readonly Orrery[], ids: readonly string[]): Orrery[] {
  return bulk(cards, ids, (card) => (card.climate === "BLAZE" ? card : { ...card, climate: "BLAZE", audit: "climate" }));
}

export function bulkOrreryLog(cards: readonly Orrery[], ids: readonly string[]): Orrery[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkOrreryStow(cards: readonly Orrery[], ids: readonly string[]): Orrery[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkOrreryTag(cards: readonly Orrery[], ids: readonly string[]): Orrery[] {
  return bulk(cards, ids, (card) => (card.tags.includes("y") ? card : { ...card, tags: tagsOf([...card.tags, "y"]), audit: "tag" }));
}

export function readOrreryViews(raw: unknown): OrreryView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrreryView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrreryView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      climate: activeClimate(row.climate, ["FROST", "MILD", "BLAZE"]),
      world: activeWorld(row.world),
      radius: activeRadius(row.radius),
      moon: activeMoon(row.moon),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOrreryView(views: readonly OrreryView[], view: OrreryView): OrreryView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOrreryViews([...views, { ...view, id, name }]);
}

export function dropOrreryView(views: readonly OrreryView[], id: string): OrreryView[] {
  return views.filter((view) => view.id !== id);
}

export function orreryDensity(raw: unknown): OrreryDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortOrrerys(cards: readonly Orrery[], sort: OrrerySort): Orrery[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const world = worldIndex(a.world) - worldIndex(b.world);
      if (world) return world;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleOrrerys(
  cards: readonly Orrery[],
  tray: OrreryTray,
  query: string,
  keeper: string,
  climate: string,
  world: string,
  radius: string,
  moon: string,
): Orrery[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantClimate = climate === "all" ? "" : orreryClimate(climate);
  const wantWorld = activeWorld(world);
  const wantRadius = activeRadius(radius);
  const wantMoon = activeMoon(moon);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantClimate && card.climate !== wantClimate) return false;
    if (wantWorld === "inner" && !innerWorld(card.world)) return false;
    if (wantWorld === "outer" && !outerWorld(card.world)) return false;
    if (wantWorld !== "all" && wantWorld !== "inner" && wantWorld !== "outer" && card.world !== wantWorld) return false;
    if (wantRadius !== "all" && String(card.radius ?? "") !== wantRadius) return false;
    if (wantMoon !== "all" && String(card.moon) !== wantMoon) return false;
    return true;
  });
}

/** An outer world on moon zero, still unlogged and not in the coffer, is overdue. */
export function overdueOrrery(card: Orrery): boolean {
  return outerWorld(card.world) && card.moon === 0 && !card.logged && !card.stowed;
}

/** No climate, the short radius, moon zero, and still on the arm. */
export function idleOrrery(card: Orrery): boolean {
  return !card.climate && card.radius === 2 && card.moon === 0 && !card.logged && !card.locked && !card.stowed;
}

/** Blaze, a wide radius, and a full moon, still out of the coffer. */
export function briskOrrery(card: Orrery): boolean {
  return card.climate === "BLAZE" && card.radius === 8 && card.moon === 4 && !card.stowed;
}

/** Saturn, frost, and a middle radius. */
export function restingOrrery(card: Orrery): boolean {
  return card.world === "saturn" && card.climate === "FROST" && card.radius === 4;
}

/** A mercury orb is late when the desk is already on saturn. */
export function lateOrrery(card: Orrery, desk: string): boolean {
  return card.world === "mercury" && orreryWorld(desk) === "saturn" && !card.logged;
}

export function orreryCounts(cards: readonly Orrery[], shown: readonly Orrery[], desk: string): OrreryCounts {
  return {
    arm: cards.filter((card) => inTray(card, "arm")).length,
    cradle: cards.filter((card) => inTray(card, "cradle")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    logged: cards.filter((card) => card.logged).length,
    inner: cards.filter((card) => innerWorld(card.world)).length,
    outer: cards.filter((card) => outerWorld(card.world)).length,
    wide: cards.filter((card) => card.radius === 8).length,
    house: cards.filter((card) => houseClimate(card.climate)).length,
    radius: cards.reduce((sum, card) => sum + (card.radius || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleOrrery).length,
    brisk: cards.filter(briskOrrery).length,
    resting: cards.filter(restingOrrery).length,
    overdue: cards.filter(overdueOrrery).length,
    pair: cards.filter((card) => pairMoon(card.moon) && lateOrrery(card, desk)).length,
  };
}

export function orreryBars(cards: readonly Orrery[]): { world: string; count: number }[] {
  return ORRERY_WORLDS.map((world) => ({ world, count: cards.filter((card) => card.world === world && !card.stowed).length }));
}

export function orreryTimeline(cards: readonly Orrery[]): { radius: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "arm"));
  return RADIUS_CYCLE.map((radius) => ({ radius, titles: open.filter((card) => card.radius === radius).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function orreryKeepers(cards: readonly Orrery[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestOrbKeeper(cards: readonly Orrery[]): string {
  const open = cards.filter((card) => inTray(card, "arm") && !card.logged && card.keeper);
  let best = "";
  let score = 0;
  for (const name of orreryKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOrrerys(cards: readonly Orrery[]): string[] {
  return cards.filter(overdueOrrery).map((card) => card.title);
}

export function orreryCopy(card: Orrery): string {
  return [card.title, card.keeper, card.world, card.climate, card.radius ?? "", card.moon, card.note].filter((item) => item !== "").join(" · ");
}

export function orreryCsv(cards: readonly Orrery[], desk: string): string {
  const lines = ["title,keeper,world,climate,radius,moon,tags,logged,cradled,coffered,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.world,
        card.climate,
        card.radius ?? "",
        card.moon,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        outerWorld(card.world) ? "1" : "0",
        lateOrrery(card, desk) ? "1" : "0",
        idleOrrery(card) ? "1" : "0",
        briskOrrery(card) ? "1" : "0",
        restingOrrery(card) ? "1" : "0",
        overdueOrrery(card) ? "1" : "0",
        innerWorld(card.world) ? "1" : "0",
        houseClimate(card.climate) ? "1" : "0",
        orreryBand(card.world),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: WardValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function wardRecord(raw: WardValue): { lockedUntil?: unknown; until?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function wardGiven(raw: WardValue): string {
  const row = wardRecord(raw);
  if (row && !("lockedUntil" in row) && !("until" in row)) return "";
  const value = row ? row.lockedUntil ?? row.until : raw;
  return clip(value, 40);
}

function wardStateRaw(raw: WardValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = wardRecord(raw);
  if (row && !("lockedUntil" in row) && !("until" in row)) return "blocked";
  return "open";
}

function wardDate(raw: WardValue, now = Date.now()): Date | null {
  if (wardStateRaw(raw) === "blocked") return null;
  const text = wardGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const delta = at - now;
  if (delta > YEAR_MS || delta < -YEAR_MS) return null;
  return new Date(at);
}

function wardDelta(raw: WardValue, now: number): number | null {
  const at = wardDate(raw, now);
  if (!at) return null;
  return at.getTime() - now;
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function wardState(raw: WardValue, now = Date.now()): WardState {
  if (wardStateRaw(raw) === "blocked") return "";
  return wardDate(raw, now) ? "set" : "clear";
}

/** Hour within sixty minutes, then day, week, and far. A past lock is spent. */
export function wardLane(raw: WardValue, now = Date.now()): WardLane {
  if (wardState(raw, now) !== "set") return "";
  const delta = wardDelta(raw, now);
  if (delta === null) return "";
  if (delta <= 0) return "spent";
  if (delta <= HOUR_MS) return "hour";
  if (delta <= DAY_MS) return "day";
  if (delta <= WEEK_MS) return "week";
  return "far";
}

export function wardHue(raw: WardValue, now = Date.now()): WardHue {
  const lane = wardLane(raw, now);
  if (!lane) return "";
  if (lane === "hour" || lane === "far") return "champagne";
  if (lane === "day") return "ivory";
  return "graphite";
}

export function wardHour(raw: WardValue, now = Date.now()): boolean {
  return wardLane(raw, now) === "hour";
}

export function wardSpent(raw: WardValue, now = Date.now()): boolean {
  return wardLane(raw, now) === "spent";
}

export function wardOpen(raw: WardValue, now = Date.now()): boolean {
  return wardState(raw, now) === "clear";
}

/** Still locked, from the next minute out to a year. */
export function wardHeld(raw: WardValue, now = Date.now()): boolean {
  const lane = wardLane(raw, now);
  return lane === "hour" || lane === "day" || lane === "week" || lane === "far";
}

/** A soon lock ends within fifteen minutes. */
export function wardSoon(raw: WardValue, now = Date.now()): boolean {
  const delta = wardDelta(raw, now);
  return delta !== null && delta > 0 && delta <= SOON_MS;
}

export function wardMinutes(raw: WardValue, now = Date.now()): number | null {
  const delta = wardDelta(raw, now);
  if (delta === null) return null;
  return Math.trunc(delta / MINUTE_MS);
}

export function wardToday(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function wardWeekday(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day >= 1 && day <= 5;
}

export function wardWeekend(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function wardMorning(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  return Boolean(at) && at!.getUTCHours() < 12;
}

export function wardEven(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function wardFirst(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  return Boolean(at) && at!.getUTCDate() === 1;
}

export function wardStep(raw: WardValue, now = Date.now()): number {
  const at = wardDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

export function wardLeap(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

export function wardTwin(raw: WardValue, now = Date.now()): boolean {
  const at = wardDate(raw, now);
  if (!at) return false;
  return at.getUTCDay() === new Date(now).getUTCDay();
}

export function wardTail(raw: WardValue): boolean {
  return /z$/i.test(wardGiven(raw).trim());
}

export function wardMark(raw: WardValue): boolean {
  return wardGiven(raw).includes("T");
}

export function wardSpace(raw: WardValue): boolean {
  return wardGiven(raw).includes(" ");
}

export function wardStamp(raw: WardValue, now = Date.now()): string {
  const at = wardDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function wardCopy(raw: WardValue): string {
  return wardGiven(raw);
}

export function wardLanes(rows: readonly WardRow[], now = Date.now()): WardLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = wardLane(row.until, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingWard(rows: readonly WardRow[], now = Date.now()): string {
  const lines = wardLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingWardHue(rows: readonly WardRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = wardHue(row.until, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneWardCount(rows: readonly WardRow[], lane: WardLane, now = Date.now()): number {
  return rows.filter((row) => wardLane(row.until, now) === lane).length;
}

export function wardShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentWardLanes(rows: readonly WardRow[], now = Date.now()): string[] {
  return wardLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenWard(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedWard(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleWard(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleWardReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkWardReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleWardLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: WardRow, shape: WardShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "hour") return wardHour(row.until, now);
  if (shape === "spent") return wardSpent(row.until, now);
  if (shape === "open") return wardOpen(row.until, now);
  if (shape === "soon") return wardSoon(row.until, now);
  if (shape === "today") return wardToday(row.until, now);
  if (shape === "weekday") return wardWeekday(row.until, now);
  if (shape === "weekend") return wardWeekend(row.until, now);
  if (shape === "morning") return wardMorning(row.until, now);
  if (shape === "leap") return wardLeap(row.until, now);
  if (shape === "first") return wardFirst(row.until, now);
  if (shape === "even") return wardEven(row.until, now);
  if (shape === "twin") return wardTwin(row.until, now);
  if (shape === "tail") return wardTail(row.until);
  if (shape === "mark") return wardMark(row.until);
  if (shape === "space") return wardSpace(row.until);
  if (shape === "held") return wardHeld(row.until, now);
  return wardLane(row.until, now) === shape;
}

export function visibleWard(
  rows: readonly WardRow[],
  lane: string,
  hue: string,
  query: string,
  review: WardReview,
  reviewed: readonly string[],
  shape: WardShape,
  now = Date.now(),
): WardRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (wardState(row.until, now) === "") return false;
    const found = wardLane(row.until, now);
    const hueName = wardHue(row.until, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${wardGiven(row.until)} ${wardStamp(row.until, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedWardCount(rows: readonly WardRow[], now = Date.now()): number {
  const stamps = rows.map((row) => wardStamp(row.until, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function wardLanesCsv(rows: readonly WardRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of wardLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function wardRowsCsv(rows: readonly WardRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,until,stamp,lane,hue,step,minutes,hour,spent,today,weekday,weekend,morning,leap,first,even,twin,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (wardState(row.until, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(wardGiven(row.until)),
        wardStamp(row.until, now),
        wardLane(row.until, now),
        wardHue(row.until, now),
        String(wardStep(row.until, now)),
        String(wardMinutes(row.until, now) ?? ""),
        wardHour(row.until, now) ? "1" : "0",
        wardSpent(row.until, now) ? "1" : "0",
        wardToday(row.until, now) ? "1" : "0",
        wardWeekday(row.until, now) ? "1" : "0",
        wardWeekend(row.until, now) ? "1" : "0",
        wardMorning(row.until, now) ? "1" : "0",
        wardLeap(row.until, now) ? "1" : "0",
        wardFirst(row.until, now) ? "1" : "0",
        wardEven(row.until, now) ? "1" : "0",
        wardTwin(row.until, now) ? "1" : "0",
        wardHeld(row.until, now) ? "1" : "0",
        wardSoon(row.until, now) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
