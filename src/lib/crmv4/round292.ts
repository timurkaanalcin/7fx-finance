/**
 * Clepsydra bowls for a follow-up water clock kept in this browser, and tide plates read the account expiry already stored on the trader.
 * Vessels are clay, glass, bronze, and pearl. Drips are trickle, steady, and rush.
 * Drops are 3, 6, or 9. Notches are 1, 3, or 5.
 * An ebb expiry falls within six hours. A spent expiry is already past. Dates are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_clepsydra (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   vessel text not null default '',
 *   drip text not null default '',
 *   drop_no integer,
 *   notch_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   cisterned boolean not null default false,
 *   cellared boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_tide_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_tide_review (
 *   trader_id text primary key
 * );
 */

export const CLY_KEY = "crmv4-clepsydra";
export const CLY_VIEW_KEY = "crmv4-clepsydra-views";
export const CLY_DENSITY_KEY = "crmv4-clepsydra-density";
export const TDE_KEY = "crmv4-tide-hide";
export const TDE_REVIEW_KEY = "crmv4-tide-review";

export const CLEPSYDRA_VESSELS = ["clay", "glass", "bronze", "pearl"] as const;

export type ClepsydraVessel = (typeof CLEPSYDRA_VESSELS)[number];

export type ClepsydraDrip = "blank" | "frost" | "mild" | "blaze";

export type ClepsydraTray = "bowl" | "cistern" | "cellar";

export type ClepsydraDensity = "wide" | "narrow";

export type ClepsydraSort = "vessel" | "keeper";

export type Clepsydra = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  vessel: string;
  drop: number | null;
  drip: string;
  notch: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type ClepsydraView = {
  id: string;
  name: string;
  tray: ClepsydraTray;
  query: string;
  keeper: string;
  drip: string;
  vessel: string;
  drop: string;
  notch: string;
};

export type ClepsydraCounts = {
  arm: number;
  cradle: number;
  coffer: number;
  logged: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  drop: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type TideLane = "" | "ebb" | "neap" | "spring" | "flood" | "spent";

export type TideHue = "" | "ivory" | "graphite" | "champagne";

export type TideState = "" | "clear" | "set";

export type TideReview = "all" | "reviewed" | "fresh";

export type TideShape =
  | "all"
  | "ebb"
  | "neap"
  | "spring"
  | "flood"
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

export type TideValue = string | { expiresAt?: unknown; until?: unknown; [key: string]: unknown } | null | undefined;

export type TideRow = { id: string; label: string; expires: TideValue };

export type TideLaneLine = { lane: string; count: number };

export const ROUND292_FEATURES = [
  "save",
  "note",
  "trays",
  "drip",
  "drop",
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
  "tide",
  "tide-csv",
] as const;

const AUDITS = ["save", "edit", "note", "drip", "log", "unlog", "cistern", "resume", "stow", "open", "tag", "notch", "drop", "lower", "star"] as const;

const DRIPS = ["trickle", "steady", "rush"] as const;

const DROP_CYCLE = [3, 6, 9] as const;

const NOTCH_CYCLE = [1, 3, 5] as const;

const INNER = new Set(["clay", "glass"]);

const OUTER = new Set(["bronze", "pearl"]);

const HOUSE_DRIP = new Set(["STEADY", "RUSH"]);

const LANE_ORDER = ["ebb", "neap", "spring", "flood", "spent"] as const;

const HUE_ORDER = ["champagne", "ivory", "graphite"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const MINUTE_MS = 60 * 1000;

const SOON_MS = 2 * 60 * MINUTE_MS;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const EBB_MS = 6 * HOUR_MS;

const NEAP_MS = 3 * DAY_MS;

const SPRING_MS = 14 * DAY_MS;

const YEAR_MS = 3 * 365 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ClepsydraTray {
  return raw === "cistern" || raw === "cellar" ? raw : "bowl";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function climateName(raw: unknown): Exclude<ClepsydraDrip, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (DRIPS as readonly string[]).includes(text) ? (text as Exclude<ClepsydraDrip, "blank">) : "";
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

function inTray(card: Clepsydra, tray: ClepsydraTray): boolean {
  if (tray === "cistern") return card.locked && !card.stowed;
  if (tray === "cellar") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function vesselIndex(world: string): number {
  return CLEPSYDRA_VESSELS.indexOf(world as ClepsydraVessel);
}

function dropIndex(radius: number): number {
  return DROP_CYCLE.indexOf(radius as (typeof DROP_CYCLE)[number]);
}

function notchIndex(moon: number): number {
  return NOTCH_CYCLE.indexOf(moon as (typeof NOTCH_CYCLE)[number]);
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

export function clepsydraVessel(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CLEPSYDRA_VESSELS as readonly string[]).includes(text) ? text : "";
}

/** A radius is 2, 4, or 8. Anything else stays blank. */
export function clepsydraDrop(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A moon is 0, 2, or 4. Anything else stays blank. */
export function clepsydraNotch(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** Climate is frost, mild, or blaze. The saved climate is the upper case name. */
export function clepsydraDrip(raw: unknown): string {
  const text = climateName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerVessel(world: unknown): boolean {
  return INNER.has(clip(world, 12).toLowerCase());
}

export function outerVessel(world: unknown): boolean {
  return OUTER.has(clip(world, 12).toLowerCase());
}

/** Mercury is inner. Venus is warm. Mars is red. Saturn is ring. */
export function clepsydraBand(world: unknown): string {
  const text = clepsydraVessel(world);
  if (!text) return "";
  if (text === "clay") return "earthen";
  if (text === "glass") return "clear";
  if (text === "bronze") return "cast";
  return "pale";
}

/** Signed distance from one world to the desk world. */
export function vesselGap(from: unknown, to: unknown): number | null {
  const left = vesselIndex(clepsydraVessel(from));
  const right = vesselIndex(clepsydraVessel(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseDrip(climate: unknown): boolean {
  return HOUSE_DRIP.has(clepsydraDrip(climate));
}

/** A pair moon is 2. Zero and four are not a pair. */
export function pairNotch(moon: unknown): boolean {
  return clepsydraNotch(moon) === 3;
}

/** A full moon is 4. */
export function fullNotch(moon: unknown): boolean {
  return clepsydraNotch(moon) === 5;
}

export function activeVessel(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return clepsydraVessel(text) || "all";
}

export function activeDrop(raw: unknown): string {
  const radius = clepsydraDrop(raw);
  return radius === null ? "all" : String(radius);
}

export function activeDrip(raw: unknown, allow: readonly string[]): string {
  const text = clepsydraDrip(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeNotch(raw: unknown): string {
  const moon = clepsydraNotch(raw);
  return moon === null ? "all" : String(moon);
}

export function moveClepsydraFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestClepsydraDrip(cards: readonly Clepsydra[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bowl") || !card.drip) continue;
    counts.set(card.drip, (counts.get(card.drip) || 0) + 1);
  }
  let best = "TRICKLE";
  let score = 0;
  for (const drip of ["TRICKLE", "STEADY", "RUSH"]) {
    const count = counts.get(drip) || 0;
    if (count > score) {
      best = drip;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest two. Through the afternoon, four. Evening asks for eight. Saved radii win when any exist. */
export function suggestDrop(cards: readonly Clepsydra[], hour: number): 3 | 6 | 9 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bowl") || card.drop === null) continue;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  let best: 3 | 6 | 9 | null = null;
  let score = 0;
  for (const drop of DROP_CYCLE) {
    const count = counts.get(drop) || 0;
    if (count > score) {
      best = drop;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 9) return 3;
  if (hour < 17) return 6;
  return 9;
}

/** Before noon, suggest mercury. The rest of the day suggests saturn. */
export function suggestVessel(hour: number): ClepsydraVessel {
  return hour < 11 ? "clay" : "pearl";
}

/** The keeper with the fewest unlogged orbs on the arm. A tie keeps the roster order. */
export function fairBowlKeeper(cards: readonly Clepsydra[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bowl") && !card.logged);
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

export function readClepsydras(raw: unknown): Clepsydra[] {
  if (!Array.isArray(raw)) return [];
  const out: Clepsydra[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Clepsydra>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      vessel: clepsydraVessel(row.vessel),
      drop: clepsydraDrop(row.drop),
      drip: clepsydraDrip(row.drip),
      notch: clepsydraNotch(row.notch) ?? 1,
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

export function addClepsydra(
  cards: readonly Clepsydra[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    vessel?: string;
    drop?: unknown;
    drip?: string;
    notch?: unknown;
    tags?: unknown;
  },
): Clepsydra[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readClepsydras([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      vessel: clepsydraVessel(card.vessel),
      drop: clepsydraDrop(card.drop),
      drip: clepsydraDrip(card.drip),
      notch: clepsydraNotch(card.notch) ?? 1,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Clepsydra[], id: string, edit: (card: Clepsydra) => Clepsydra): Clepsydra[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editClepsydra(cards: readonly Clepsydra[], id: string, title: string): Clepsydra[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editClepsydraNote(cards: readonly Clepsydra[], id: string, note: string): Clepsydra[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleDrip(climate: string): string {
  const order = ["", "TRICKLE", "STEADY", "RUSH"];
  const index = order.indexOf(clepsydraDrip(climate));
  return order[(index + 1) % order.length] || "TRICKLE";
}

export function setClepsydraDrip(cards: readonly Clepsydra[], id: string, climate: string): Clepsydra[] {
  const next = clepsydraDrip(climate);
  return mapCard(cards, id, (card) => (card.drip === next ? card : { ...card, drip: next, audit: "drip" }));
}

export function setClepsydraLogged(cards: readonly Clepsydra[], id: string, logged: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setClepsydraCistern(cards: readonly Clepsydra[], id: string, locked: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "cistern" : "resume" }));
}

export function setClepsydraStow(cards: readonly Clepsydra[], id: string, stowed: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setClepsydraStar(cards: readonly Clepsydra[], id: string, flagged: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addClepsydraTag(cards: readonly Clepsydra[], id: string, tag: string): Clepsydra[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 3 | 6 | 9 {
  if (drop === null) return dir > 0 ? 3 : 9;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepNotch(notch: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

export function liftDrop(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerDrop(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseNotch(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "notch" }));
}

function focused(cards: readonly Clepsydra[], id: string, edit: (card: Clepsydra) => Clepsydra): Clepsydra[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function cisternClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return setClepsydraCistern(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return setClepsydraStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return addClepsydraTag(cards, id, "x");
}

export function dripFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  const card = cards.find((item) => item.id === id);
  return card ? setClepsydraDrip(cards, id, cycleDrip(card.drip)) : [...cards];
}

export function liftDropFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return liftDrop(cards, id);
}

export function lowerDropFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return lowerDrop(cards, id);
}

export function raiseNotchFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return raiseNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return lowerNotch(cards, id);
}

function bulk(cards: readonly Clepsydra[], ids: readonly string[], edit: (card: Clepsydra) => Clepsydra): Clepsydra[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkClepsydraRush(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.drip === "RUSH" ? card : { ...card, drip: "RUSH", audit: "drip" }));
}

export function bulkClepsydraLog(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkClepsydraStow(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkClepsydraTag(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.tags.includes("y") ? card : { ...card, tags: tagsOf([...card.tags, "y"]), audit: "tag" }));
}

export function readClepsydraViews(raw: unknown): ClepsydraView[] {
  if (!Array.isArray(raw)) return [];
  const out: ClepsydraView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ClepsydraView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      drip: activeDrip(row.drip, ["TRICKLE", "STEADY", "RUSH"]),
      vessel: activeVessel(row.vessel),
      drop: activeDrop(row.drop),
      notch: activeNotch(row.notch),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addClepsydraView(views: readonly ClepsydraView[], view: ClepsydraView): ClepsydraView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readClepsydraViews([...views, { ...view, id, name }]);
}

export function dropClepsydraView(views: readonly ClepsydraView[], id: string): ClepsydraView[] {
  return views.filter((view) => view.id !== id);
}

export function clepsydraDensity(raw: unknown): ClepsydraDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortClepsydras(cards: readonly Clepsydra[], sort: ClepsydraSort): Clepsydra[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const world = vesselIndex(a.vessel) - vesselIndex(b.vessel);
      if (world) return world;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleClepsydras(
  cards: readonly Clepsydra[],
  tray: ClepsydraTray,
  query: string,
  keeper: string,
  drip: string,
  vessel: string,
  drop: string,
  notch: string,
): Clepsydra[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantClimate = drip === "all" ? "" : clepsydraDrip(drip);
  const wantWorld = activeVessel(vessel);
  const wantRadius = activeDrop(drop);
  const wantMoon = activeNotch(notch);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantClimate && card.drip !== wantClimate) return false;
    if (wantWorld === "inner" && !innerVessel(card.vessel)) return false;
    if (wantWorld === "outer" && !outerVessel(card.vessel)) return false;
    if (wantWorld !== "all" && wantWorld !== "inner" && wantWorld !== "outer" && card.vessel !== wantWorld) return false;
    if (wantRadius !== "all" && String(card.drop ?? "") !== wantRadius) return false;
    if (wantMoon !== "all" && String(card.notch) !== wantMoon) return false;
    return true;
  });
}

/** An outer world on moon zero, still unlogged and not in the coffer, is overdue. */
export function overdueClepsydra(card: Clepsydra): boolean {
  return outerVessel(card.vessel) && card.notch === 1 && !card.logged && !card.stowed;
}

/** No climate, the short radius, moon zero, and still on the arm. */
export function idleClepsydra(card: Clepsydra): boolean {
  return !card.drip && card.drop === 3 && card.notch === 1 && !card.logged && !card.locked && !card.stowed;
}

/** Blaze, a wide radius, and a full moon, still out of the coffer. */
export function briskClepsydra(card: Clepsydra): boolean {
  return card.drip === "RUSH" && card.drop === 9 && card.notch === 5 && !card.stowed;
}

/** Saturn, frost, and a middle radius. */
export function restingClepsydra(card: Clepsydra): boolean {
  return card.vessel === "pearl" && card.drip === "TRICKLE" && card.drop === 6;
}

/** A mercury orb is late when the desk is already on saturn. */
export function lateClepsydra(card: Clepsydra, desk: string): boolean {
  return card.vessel === "clay" && clepsydraVessel(desk) === "pearl" && !card.logged;
}

export function clepsydraCounts(cards: readonly Clepsydra[], shown: readonly Clepsydra[], desk: string): ClepsydraCounts {
  return {
    arm: cards.filter((card) => inTray(card, "bowl")).length,
    cradle: cards.filter((card) => inTray(card, "cistern")).length,
    coffer: cards.filter((card) => inTray(card, "cellar")).length,
    logged: cards.filter((card) => card.logged).length,
    inner: cards.filter((card) => innerVessel(card.vessel)).length,
    outer: cards.filter((card) => outerVessel(card.vessel)).length,
    wide: cards.filter((card) => card.drop === 9).length,
    house: cards.filter((card) => houseDrip(card.drip)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleClepsydra).length,
    brisk: cards.filter(briskClepsydra).length,
    resting: cards.filter(restingClepsydra).length,
    overdue: cards.filter(overdueClepsydra).length,
    pair: cards.filter((card) => pairNotch(card.notch) && lateClepsydra(card, desk)).length,
  };
}

export function clepsydraBars(cards: readonly Clepsydra[]): { vessel: string; count: number }[] {
  return CLEPSYDRA_VESSELS.map((vessel) => ({ vessel, count: cards.filter((card) => card.vessel === vessel && !card.stowed).length }));
}

export function clepsydraTimeline(cards: readonly Clepsydra[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bowl"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function clepsydraKeepers(cards: readonly Clepsydra[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestBowlKeeper(cards: readonly Clepsydra[]): string {
  const open = cards.filter((card) => inTray(card, "bowl") && !card.logged && card.keeper);
  let best = "";
  let score = 0;
  for (const name of clepsydraKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderClepsydras(cards: readonly Clepsydra[]): string[] {
  return cards.filter(overdueClepsydra).map((card) => card.title);
}

export function clepsydraCopy(card: Clepsydra): string {
  return [card.title, card.keeper, card.vessel, card.drip, card.drop ?? "", card.notch, card.note].filter((item) => item !== "").join(" · ");
}

export function clepsydraCsv(cards: readonly Clepsydra[], desk: string): string {
  const lines = ["title,keeper,vessel,drip,drop,notch,tags,logged,cistern,cellar,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.vessel,
        card.drip,
        card.drop ?? "",
        card.notch,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        outerVessel(card.vessel) ? "1" : "0",
        lateClepsydra(card, desk) ? "1" : "0",
        idleClepsydra(card) ? "1" : "0",
        briskClepsydra(card) ? "1" : "0",
        restingClepsydra(card) ? "1" : "0",
        overdueClepsydra(card) ? "1" : "0",
        innerVessel(card.vessel) ? "1" : "0",
        houseDrip(card.drip) ? "1" : "0",
        clepsydraBand(card.vessel),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: TideValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function tideRecord(raw: TideValue): { expiresAt?: unknown; until?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function tideGiven(raw: TideValue): string {
  const row = tideRecord(raw);
  if (row && !("expiresAt" in row) && !("until" in row)) return "";
  const value = row ? row.expiresAt ?? row.until : raw;
  return clip(value, 40);
}

function tideStateRaw(raw: TideValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = tideRecord(raw);
  if (row && !("expiresAt" in row) && !("until" in row)) return "blocked";
  return "open";
}

function tideDate(raw: TideValue, now = Date.now()): Date | null {
  if (tideStateRaw(raw) === "blocked") return null;
  const text = tideGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const delta = at - now;
  if (delta > YEAR_MS || delta < -YEAR_MS) return null;
  return new Date(at);
}

function tideDelta(raw: TideValue, now: number): number | null {
  const at = tideDate(raw, now);
  if (!at) return null;
  return at.getTime() - now;
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function tideState(raw: TideValue, now = Date.now()): TideState {
  if (tideStateRaw(raw) === "blocked") return "";
  return tideDate(raw, now) ? "set" : "clear";
}

/** Hour within sixty minutes, then day, week, and far. A past lock is spent. */
export function tideLane(raw: TideValue, now = Date.now()): TideLane {
  if (tideState(raw, now) !== "set") return "";
  const delta = tideDelta(raw, now);
  if (delta === null) return "";
  if (delta <= 0) return "spent";
  if (delta <= EBB_MS) return "ebb";
  if (delta <= NEAP_MS) return "neap";
  if (delta <= SPRING_MS) return "spring";
  return "flood";
}

export function tideHue(raw: TideValue, now = Date.now()): TideHue {
  const lane = tideLane(raw, now);
  if (!lane) return "";
  if (lane === "ebb" || lane === "flood") return "champagne";
  if (lane === "neap") return "ivory";
  return "graphite";
}

export function tideEbb(raw: TideValue, now = Date.now()): boolean {
  return tideLane(raw, now) === "ebb";
}

export function tideSpent(raw: TideValue, now = Date.now()): boolean {
  return tideLane(raw, now) === "spent";
}

export function tideOpen(raw: TideValue, now = Date.now()): boolean {
  return tideState(raw, now) === "clear";
}

/** Still locked, from the next minute out to a year. */
export function tideHeld(raw: TideValue, now = Date.now()): boolean {
  const lane = tideLane(raw, now);
  return lane === "ebb" || lane === "neap" || lane === "spring" || lane === "flood";
}

/** A soon lock ends within fifteen minutes. */
export function tideSoon(raw: TideValue, now = Date.now()): boolean {
  const delta = tideDelta(raw, now);
  return delta !== null && delta > 0 && delta <= SOON_MS;
}

export function tideMinutes(raw: TideValue, now = Date.now()): number | null {
  const delta = tideDelta(raw, now);
  if (delta === null) return null;
  return Math.trunc(delta / MINUTE_MS);
}

export function tideToday(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function tideWeekday(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day >= 1 && day <= 5;
}

export function tideWeekend(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function tideMorning(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  return Boolean(at) && at!.getUTCHours() < 12;
}

export function tideEven(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function tideFirst(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  return Boolean(at) && at!.getUTCDate() === 1;
}

export function tideStep(raw: TideValue, now = Date.now()): number {
  const at = tideDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

export function tideLeap(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

export function tideTwin(raw: TideValue, now = Date.now()): boolean {
  const at = tideDate(raw, now);
  if (!at) return false;
  return at.getUTCDay() === new Date(now).getUTCDay();
}

export function tideTail(raw: TideValue): boolean {
  return /z$/i.test(tideGiven(raw).trim());
}

export function tideMark(raw: TideValue): boolean {
  return tideGiven(raw).includes("T");
}

export function tideSpace(raw: TideValue): boolean {
  return tideGiven(raw).includes(" ");
}

export function tideStamp(raw: TideValue, now = Date.now()): string {
  const at = tideDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function tideCopy(raw: TideValue): string {
  return tideGiven(raw);
}

export function tideLanes(rows: readonly TideRow[], now = Date.now()): TideLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = tideLane(row.expires, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTide(rows: readonly TideRow[], now = Date.now()): string {
  const lines = tideLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingTideHue(rows: readonly TideRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = tideHue(row.expires, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneTideCount(rows: readonly TideRow[], lane: TideLane, now = Date.now()): number {
  return rows.filter((row) => tideLane(row.expires, now) === lane).length;
}

export function tideShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTideLanes(rows: readonly TideRow[], now = Date.now()): string[] {
  return tideLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenTide(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTide(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTide(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTideReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTideReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTideLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: TideRow, shape: TideShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "ebb") return tideEbb(row.expires, now);
  if (shape === "spent") return tideSpent(row.expires, now);
  if (shape === "open") return tideOpen(row.expires, now);
  if (shape === "soon") return tideSoon(row.expires, now);
  if (shape === "today") return tideToday(row.expires, now);
  if (shape === "weekday") return tideWeekday(row.expires, now);
  if (shape === "weekend") return tideWeekend(row.expires, now);
  if (shape === "morning") return tideMorning(row.expires, now);
  if (shape === "leap") return tideLeap(row.expires, now);
  if (shape === "first") return tideFirst(row.expires, now);
  if (shape === "even") return tideEven(row.expires, now);
  if (shape === "twin") return tideTwin(row.expires, now);
  if (shape === "tail") return tideTail(row.expires);
  if (shape === "mark") return tideMark(row.expires);
  if (shape === "space") return tideSpace(row.expires);
  if (shape === "held") return tideHeld(row.expires, now);
  return tideLane(row.expires, now) === shape;
}

export function visibleTide(
  rows: readonly TideRow[],
  lane: string,
  hue: string,
  query: string,
  review: TideReview,
  reviewed: readonly string[],
  shape: TideShape,
  now = Date.now(),
): TideRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (tideState(row.expires, now) === "") return false;
    const found = tideLane(row.expires, now);
    const hueName = tideHue(row.expires, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${tideGiven(row.expires)} ${tideStamp(row.expires, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedTideCount(rows: readonly TideRow[], now = Date.now()): number {
  const stamps = rows.map((row) => tideStamp(row.expires, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function tideLanesCsv(rows: readonly TideRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of tideLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function tideRowsCsv(rows: readonly TideRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,expires,stamp,lane,hue,step,minutes,ebb,spent,today,weekday,weekend,morning,leap,first,even,twin,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (tideState(row.expires, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(tideGiven(row.expires)),
        tideStamp(row.expires, now),
        tideLane(row.expires, now),
        tideHue(row.expires, now),
        String(tideStep(row.expires, now)),
        String(tideMinutes(row.expires, now) ?? ""),
        tideEbb(row.expires, now) ? "1" : "0",
        tideSpent(row.expires, now) ? "1" : "0",
        tideToday(row.expires, now) ? "1" : "0",
        tideWeekday(row.expires, now) ? "1" : "0",
        tideWeekend(row.expires, now) ? "1" : "0",
        tideMorning(row.expires, now) ? "1" : "0",
        tideLeap(row.expires, now) ? "1" : "0",
        tideFirst(row.expires, now) ? "1" : "0",
        tideEven(row.expires, now) ? "1" : "0",
        tideTwin(row.expires, now) ? "1" : "0",
        tideHeld(row.expires, now) ? "1" : "0",
        tideSoon(row.expires, now) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
