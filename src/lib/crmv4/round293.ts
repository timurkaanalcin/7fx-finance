/**
 * Planisphere discs for a sky-chart follow-up kept in this browser, and seal plates read the password change time already stored on the account.
 * Charts are lyre, harp, crown, and keel. Winds are calm, breeze, and gale.
 * Spans are 5, 10, or 15. Pegs are 2, 4, or 6.
 * A mint seal was turned within twelve hours. A rust seal is older than two hundred days. Dates are read in UTC.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_planisphere (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   chart text not null default '',
 *   wind text not null default '',
 *   span_no integer,
 *   peg_no integer not null default 2,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   cased boolean not null default false,
 *   drawn boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_seal_review (
 *   trader_id text primary key
 * );
 */

export const PLN_KEY = "crmv4-planisphere";
export const PLN_VIEW_KEY = "crmv4-planisphere-views";
export const PLN_DENSITY_KEY = "crmv4-planisphere-density";
export const SLP_KEY = "crmv4-seal-hide";
export const SLP_REVIEW_KEY = "crmv4-seal-review";

export const PLANISPHERE_CHARTS = ["lyre", "harp", "crown", "keel"] as const;

export type PlanisphereChart = (typeof PLANISPHERE_CHARTS)[number];

export type PlanisphereWind = "blank" | "calm" | "breeze" | "gale";

export type PlanisphereTray = "disc" | "case" | "drawer";

export type PlanisphereDensity = "wide" | "narrow";

export type PlanisphereSort = "chart" | "keeper";

export type Planisphere = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  chart: string;
  span: number | null;
  wind: string;
  peg: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type PlanisphereView = {
  id: string;
  name: string;
  tray: PlanisphereTray;
  query: string;
  keeper: string;
  wind: string;
  chart: string;
  span: string;
  peg: string;
};

export type PlanisphereCounts = {
  arm: number;
  cradle: number;
  coffer: number;
  logged: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  span: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type SealLane = "" | "mint" | "linen" | "oak" | "iron" | "rust";

export type SealHue = "" | "ivory" | "graphite" | "champagne";

export type SealState = "" | "clear" | "set";

export type SealReview = "all" | "reviewed" | "fresh";

export type SealShape =
  | "all"
  | "mint"
  | "linen"
  | "oak"
  | "iron"
  | "rust"
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

export type SealValue = string | { passwordChangedAt?: unknown; until?: unknown; [key: string]: unknown } | null | undefined;

export type SealRow = { id: string; label: string; changed: SealValue };

export type SealLaneLine = { lane: string; count: number };

export const ROUND293_FEATURES = [
  "save",
  "note",
  "trays",
  "wind",
  "span",
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
  "seal",
  "seal-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wind", "log", "unlog", "case", "resume", "stow", "open", "tag", "peg", "span", "lower", "star"] as const;

const WINDS = ["calm", "breeze", "gale"] as const;

const SPAN_CYCLE = [5, 10, 15] as const;

const PEG_CYCLE = [2, 4, 6] as const;

const INNER = new Set(["lyre", "harp"]);

const OUTER = new Set(["crown", "keel"]);

const HOUSE_WIND = new Set(["BREEZE", "GALE"]);

const LANE_ORDER = ["mint", "linen", "oak", "iron", "rust"] as const;

const HUE_ORDER = ["champagne", "ivory", "graphite"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const MINUTE_MS = 60 * 1000;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const SOON_MS = 3 * HOUR_MS;

const MINT_MS = 12 * HOUR_MS;

const LINEN_MS = 10 * DAY_MS;

const OAK_MS = 45 * DAY_MS;

const IRON_MS = 200 * DAY_MS;

const YEAR_MS = 3 * 365 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PlanisphereTray {
  return raw === "case" || raw === "drawer" ? raw : "disc";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function climateName(raw: unknown): Exclude<PlanisphereWind, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WINDS as readonly string[]).includes(text) ? (text as Exclude<PlanisphereWind, "blank">) : "";
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

function inTray(card: Planisphere, tray: PlanisphereTray): boolean {
  if (tray === "case") return card.locked && !card.stowed;
  if (tray === "drawer") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function chartIndex(world: string): number {
  return PLANISPHERE_CHARTS.indexOf(world as PlanisphereChart);
}

function spanIndex(radius: number): number {
  return SPAN_CYCLE.indexOf(radius as (typeof SPAN_CYCLE)[number]);
}

function pegIndex(moon: number): number {
  return PEG_CYCLE.indexOf(moon as (typeof PEG_CYCLE)[number]);
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

export function planisphereChart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PLANISPHERE_CHARTS as readonly string[]).includes(text) ? text : "";
}

/** A radius is 2, 4, or 8. Anything else stays blank. */
export function planisphereSpan(raw: unknown): 5 | 10 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15") return null;
  return Number(text) as 5 | 10 | 15;
}

/** A moon is 0, 2, or 4. Anything else stays blank. */
export function planispherePeg(raw: unknown): 2 | 4 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "6") return null;
  return Number(text) as 2 | 4 | 6;
}

/** Climate is frost, mild, or blaze. The saved climate is the upper case name. */
export function planisphereWind(raw: unknown): string {
  const text = climateName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerChart(world: unknown): boolean {
  return INNER.has(clip(world, 12).toLowerCase());
}

export function outerChart(world: unknown): boolean {
  return OUTER.has(clip(world, 12).toLowerCase());
}

/** Mercury is inner. Venus is warm. Mars is red. Saturn is ring. */
export function planisphereBand(world: unknown): string {
  const text = planisphereChart(world);
  if (!text) return "";
  if (text === "lyre") return "string";
  if (text === "harp") return "frame";
  if (text === "crown") return "arc";
  return "hull";
}

/** Signed distance from one world to the desk world. */
export function chartGap(from: unknown, to: unknown): number | null {
  const left = chartIndex(planisphereChart(from));
  const right = chartIndex(planisphereChart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWind(climate: unknown): boolean {
  return HOUSE_WIND.has(planisphereWind(climate));
}

/** A pair moon is 2. Zero and four are not a pair. */
export function pairPeg(moon: unknown): boolean {
  return planispherePeg(moon) === 4;
}

/** A full moon is 4. */
export function fullPeg(moon: unknown): boolean {
  return planispherePeg(moon) === 6;
}

export function activeChart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return planisphereChart(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const radius = planisphereSpan(raw);
  return radius === null ? "all" : String(radius);
}

export function activeWind(raw: unknown, allow: readonly string[]): string {
  const text = planisphereWind(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePeg(raw: unknown): string {
  const moon = planispherePeg(raw);
  return moon === null ? "all" : String(moon);
}

export function movePlanisphereFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestPlanisphereWind(cards: readonly Planisphere[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "disc") || !card.wind) continue;
    counts.set(card.wind, (counts.get(card.wind) || 0) + 1);
  }
  let best = "CALM";
  let score = 0;
  for (const drip of ["CALM", "BREEZE", "GALE"]) {
    const count = counts.get(drip) || 0;
    if (count > score) {
      best = drip;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest two. Through the afternoon, four. Evening asks for eight. Saved radii win when any exist. */
export function suggestSpan(cards: readonly Planisphere[], hour: number): 5 | 10 | 15 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "disc") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 5 | 10 | 15 | null = null;
  let score = 0;
  for (const drop of SPAN_CYCLE) {
    const count = counts.get(drop) || 0;
    if (count > score) {
      best = drop;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 10) return 5;
  if (hour < 18) return 10;
  return 15;
}

/** Before noon, suggest mercury. The rest of the day suggests saturn. */
export function suggestChart(hour: number): PlanisphereChart {
  return hour < 10 ? "lyre" : "keel";
}

/** The keeper with the fewest unlogged orbs on the arm. A tie keeps the roster order. */
export function fairDiscKeeper(cards: readonly Planisphere[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "disc") && !card.logged);
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

export function readPlanispheres(raw: unknown): Planisphere[] {
  if (!Array.isArray(raw)) return [];
  const out: Planisphere[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Planisphere>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      chart: planisphereChart(row.chart),
      span: planisphereSpan(row.span),
      wind: planisphereWind(row.wind),
      peg: planispherePeg(row.peg) ?? 2,
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

export function addPlanisphere(
  cards: readonly Planisphere[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    chart?: string;
    span?: unknown;
    wind?: string;
    peg?: unknown;
    tags?: unknown;
  },
): Planisphere[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPlanispheres([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      chart: planisphereChart(card.chart),
      span: planisphereSpan(card.span),
      wind: planisphereWind(card.wind),
      peg: planispherePeg(card.peg) ?? 2,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Planisphere[], id: string, edit: (card: Planisphere) => Planisphere): Planisphere[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPlanisphere(cards: readonly Planisphere[], id: string, title: string): Planisphere[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPlanisphereNote(cards: readonly Planisphere[], id: string, note: string): Planisphere[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWind(climate: string): string {
  const order = ["", "CALM", "BREEZE", "GALE"];
  const index = order.indexOf(planisphereWind(climate));
  return order[(index + 1) % order.length] || "CALM";
}

export function setPlanisphereWind(cards: readonly Planisphere[], id: string, climate: string): Planisphere[] {
  const next = planisphereWind(climate);
  return mapCard(cards, id, (card) => (card.wind === next ? card : { ...card, wind: next, audit: "wind" }));
}

export function setPlanisphereLogged(cards: readonly Planisphere[], id: string, logged: boolean): Planisphere[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setPlanisphereCase(cards: readonly Planisphere[], id: string, locked: boolean): Planisphere[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "case" : "resume" }));
}

export function setPlanisphereStow(cards: readonly Planisphere[], id: string, stowed: boolean): Planisphere[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setPlanisphereStar(cards: readonly Planisphere[], id: string, flagged: boolean): Planisphere[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addPlanisphereTag(cards: readonly Planisphere[], id: string, tag: string): Planisphere[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 5 | 10 | 15 {
  if (span === null) return dir > 0 ? 5 : 15;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepPeg(peg: number, dir: 1 | -1): 2 | 4 | 6 {
  const index = pegIndex(peg);
  const next = index < 0 ? 0 : (index + dir + PEG_CYCLE.length) % PEG_CYCLE.length;
  return PEG_CYCLE[next];
}

export function liftSpan(cards: readonly Planisphere[], id: string): Planisphere[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Planisphere[], id: string): Planisphere[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raisePeg(cards: readonly Planisphere[], id: string): Planisphere[] {
  return mapCard(cards, id, (card) => ({ ...card, peg: stepPeg(card.peg, 1), audit: "peg" }));
}

export function lowerPeg(cards: readonly Planisphere[], id: string): Planisphere[] {
  return mapCard(cards, id, (card) => ({ ...card, peg: stepPeg(card.peg, -1), audit: "peg" }));
}

function focused(cards: readonly Planisphere[], id: string, edit: (card: Planisphere) => Planisphere): Planisphere[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logPlanisphereFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function casePlanisphereFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return setPlanisphereCase(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starPlanisphereFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return setPlanisphereStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagPlanisphereFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return addPlanisphereTag(cards, id, "x");
}

export function windFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPlanisphereWind(cards, id, cycleWind(card.wind)) : [...cards];
}

export function liftSpanFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return lowerSpan(cards, id);
}

export function raisePegFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return raisePeg(cards, id);
}

export function lowerPegFocused(cards: readonly Planisphere[], id: string): Planisphere[] {
  return lowerPeg(cards, id);
}

function bulk(cards: readonly Planisphere[], ids: readonly string[], edit: (card: Planisphere) => Planisphere): Planisphere[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPlanisphereGale(cards: readonly Planisphere[], ids: readonly string[]): Planisphere[] {
  return bulk(cards, ids, (card) => (card.wind === "GALE" ? card : { ...card, wind: "GALE", audit: "wind" }));
}

export function bulkPlanisphereLog(cards: readonly Planisphere[], ids: readonly string[]): Planisphere[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkPlanisphereStow(cards: readonly Planisphere[], ids: readonly string[]): Planisphere[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkPlanisphereTag(cards: readonly Planisphere[], ids: readonly string[]): Planisphere[] {
  return bulk(cards, ids, (card) => (card.tags.includes("y") ? card : { ...card, tags: tagsOf([...card.tags, "y"]), audit: "tag" }));
}

export function readPlanisphereViews(raw: unknown): PlanisphereView[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanisphereView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlanisphereView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      wind: activeWind(row.wind, ["CALM", "BREEZE", "GALE"]),
      chart: activeChart(row.chart),
      span: activeSpan(row.span),
      peg: activePeg(row.peg),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addPlanisphereView(views: readonly PlanisphereView[], view: PlanisphereView): PlanisphereView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPlanisphereViews([...views, { ...view, id, name }]);
}

export function dropPlanisphereView(views: readonly PlanisphereView[], id: string): PlanisphereView[] {
  return views.filter((view) => view.id !== id);
}

export function planisphereDensity(raw: unknown): PlanisphereDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortPlanispheres(cards: readonly Planisphere[], sort: PlanisphereSort): Planisphere[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const world = chartIndex(a.chart) - chartIndex(b.chart);
      if (world) return world;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visiblePlanispheres(
  cards: readonly Planisphere[],
  tray: PlanisphereTray,
  query: string,
  keeper: string,
  wind: string,
  chart: string,
  span: string,
  peg: string,
): Planisphere[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantClimate = wind === "all" ? "" : planisphereWind(wind);
  const wantWorld = activeChart(chart);
  const wantRadius = activeSpan(span);
  const wantMoon = activePeg(peg);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantClimate && card.wind !== wantClimate) return false;
    if (wantWorld === "inner" && !innerChart(card.chart)) return false;
    if (wantWorld === "outer" && !outerChart(card.chart)) return false;
    if (wantWorld !== "all" && wantWorld !== "inner" && wantWorld !== "outer" && card.chart !== wantWorld) return false;
    if (wantRadius !== "all" && String(card.span ?? "") !== wantRadius) return false;
    if (wantMoon !== "all" && String(card.peg) !== wantMoon) return false;
    return true;
  });
}

/** An outer world on moon zero, still unlogged and not in the coffer, is overdue. */
export function overduePlanisphere(card: Planisphere): boolean {
  return outerChart(card.chart) && card.peg === 2 && !card.logged && !card.stowed;
}

/** No climate, the short radius, moon zero, and still on the arm. */
export function idlePlanisphere(card: Planisphere): boolean {
  return !card.wind && card.span === 5 && card.peg === 2 && !card.logged && !card.locked && !card.stowed;
}

/** Blaze, a wide radius, and a full moon, still out of the coffer. */
export function briskPlanisphere(card: Planisphere): boolean {
  return card.wind === "GALE" && card.span === 15 && card.peg === 6 && !card.stowed;
}

/** Saturn, frost, and a middle radius. */
export function restingPlanisphere(card: Planisphere): boolean {
  return card.chart === "keel" && card.wind === "CALM" && card.span === 10;
}

/** A mercury orb is late when the desk is already on saturn. */
export function latePlanisphere(card: Planisphere, desk: string): boolean {
  return card.chart === "lyre" && planisphereChart(desk) === "keel" && !card.logged;
}

export function planisphereCounts(cards: readonly Planisphere[], shown: readonly Planisphere[], desk: string): PlanisphereCounts {
  return {
    arm: cards.filter((card) => inTray(card, "disc")).length,
    cradle: cards.filter((card) => inTray(card, "case")).length,
    coffer: cards.filter((card) => inTray(card, "drawer")).length,
    logged: cards.filter((card) => card.logged).length,
    inner: cards.filter((card) => innerChart(card.chart)).length,
    outer: cards.filter((card) => outerChart(card.chart)).length,
    wide: cards.filter((card) => card.span === 15).length,
    house: cards.filter((card) => houseWind(card.wind)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idlePlanisphere).length,
    brisk: cards.filter(briskPlanisphere).length,
    resting: cards.filter(restingPlanisphere).length,
    overdue: cards.filter(overduePlanisphere).length,
    pair: cards.filter((card) => pairPeg(card.peg) && latePlanisphere(card, desk)).length,
  };
}

export function planisphereBars(cards: readonly Planisphere[]): { chart: string; count: number }[] {
  return PLANISPHERE_CHARTS.map((chart) => ({ chart, count: cards.filter((card) => card.chart === chart && !card.stowed).length }));
}

export function planisphereTimeline(cards: readonly Planisphere[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "disc"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function planisphereKeepers(cards: readonly Planisphere[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestDiscKeeper(cards: readonly Planisphere[]): string {
  const open = cards.filter((card) => inTray(card, "disc") && !card.logged && card.keeper);
  let best = "";
  let score = 0;
  for (const name of planisphereKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPlanispheres(cards: readonly Planisphere[]): string[] {
  return cards.filter(overduePlanisphere).map((card) => card.title);
}

export function planisphereCopy(card: Planisphere): string {
  return [card.title, card.keeper, card.chart, card.wind, card.span ?? "", card.peg, card.note].filter((item) => item !== "").join(" · ");
}

export function planisphereCsv(cards: readonly Planisphere[], desk: string): string {
  const lines = ["title,keeper,chart,wind,span,peg,tags,logged,case,drawer,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.chart,
        card.wind,
        card.span ?? "",
        card.peg,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        outerChart(card.chart) ? "1" : "0",
        latePlanisphere(card, desk) ? "1" : "0",
        idlePlanisphere(card) ? "1" : "0",
        briskPlanisphere(card) ? "1" : "0",
        restingPlanisphere(card) ? "1" : "0",
        overduePlanisphere(card) ? "1" : "0",
        innerChart(card.chart) ? "1" : "0",
        houseWind(card.wind) ? "1" : "0",
        planisphereBand(card.chart),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: SealValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function sealRecord(raw: SealValue): { passwordChangedAt?: unknown; until?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function sealGiven(raw: SealValue): string {
  const row = sealRecord(raw);
  if (row && !("passwordChangedAt" in row) && !("until" in row)) return "";
  const value = row ? row.passwordChangedAt ?? row.until : raw;
  return clip(value, 40);
}

function sealStateRaw(raw: SealValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = sealRecord(raw);
  if (row && !("passwordChangedAt" in row) && !("until" in row)) return "blocked";
  return "open";
}

function sealDate(raw: SealValue, now = Date.now()): Date | null {
  if (sealStateRaw(raw) === "blocked") return null;
  const text = sealGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const delta = at - now;
  if (delta > YEAR_MS || delta < -YEAR_MS) return null;
  return new Date(at);
}

function sealDelta(raw: SealValue, now: number): number | null {
  const at = sealDate(raw, now);
  if (!at) return null;
  return at.getTime() - now;
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function sealState(raw: SealValue, now = Date.now()): SealState {
  if (sealStateRaw(raw) === "blocked") return "";
  return sealDate(raw, now) ? "set" : "clear";
}

/** Hour within sixty minutes, then day, week, and far. A past lock is spent. */
/** Mint within twelve hours, then linen, oak, and iron. Older than two hundred days is rust. A future stamp is blank. */
export function sealLane(raw: SealValue, now = Date.now()): SealLane {
  if (sealState(raw, now) !== "set") return "";
  const delta = sealDelta(raw, now);
  if (delta === null || delta > 0) return "";
  const age = -delta;
  if (age <= MINT_MS) return "mint";
  if (age <= LINEN_MS) return "linen";
  if (age <= OAK_MS) return "oak";
  if (age <= IRON_MS) return "iron";
  return "rust";
}

export function sealHue(raw: SealValue, now = Date.now()): SealHue {
  const lane = sealLane(raw, now);
  if (!lane) return "";
  if (lane === "mint" || lane === "iron") return "champagne";
  if (lane === "linen") return "ivory";
  return "graphite";
}

export function sealMint(raw: SealValue, now = Date.now()): boolean {
  return sealLane(raw, now) === "mint";
}

export function sealRust(raw: SealValue, now = Date.now()): boolean {
  return sealLane(raw, now) === "rust";
}

export function sealOpen(raw: SealValue, now = Date.now()): boolean {
  return sealState(raw, now) === "clear";
}

/** Still locked, from the next minute out to a year. */
export function sealHeld(raw: SealValue, now = Date.now()): boolean {
  const lane = sealLane(raw, now);
  return lane === "mint" || lane === "linen" || lane === "oak" || lane === "iron";
}

/** A soon lock ends within fifteen minutes. */
/** A fresh seal was turned within three hours. */
export function sealSoon(raw: SealValue, now = Date.now()): boolean {
  const delta = sealDelta(raw, now);
  if (delta === null || delta > 0) return false;
  const age = -delta;
  return age > 0 && age <= SOON_MS;
}

export function sealMinutes(raw: SealValue, now = Date.now()): number | null {
  const delta = sealDelta(raw, now);
  if (delta === null || delta > 0) return null;
  return Math.trunc(-delta / MINUTE_MS);
}

export function sealToday(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function sealWeekday(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day >= 1 && day <= 5;
}

export function sealWeekend(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function sealMorning(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  return Boolean(at) && at!.getUTCHours() < 12;
}

export function sealEven(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function sealFirst(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  return Boolean(at) && at!.getUTCDate() === 1;
}

export function sealStep(raw: SealValue, now = Date.now()): number {
  const at = sealDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

export function sealLeap(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

export function sealTwin(raw: SealValue, now = Date.now()): boolean {
  const at = sealDate(raw, now);
  if (!at) return false;
  return at.getUTCDay() === new Date(now).getUTCDay();
}

export function sealTail(raw: SealValue): boolean {
  return /z$/i.test(sealGiven(raw).trim());
}

export function sealMark(raw: SealValue): boolean {
  return sealGiven(raw).includes("T");
}

export function sealSpace(raw: SealValue): boolean {
  return sealGiven(raw).includes(" ");
}

export function sealStamp(raw: SealValue, now = Date.now()): string {
  const at = sealDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function sealCopy(raw: SealValue): string {
  return sealGiven(raw);
}

export function sealLanes(rows: readonly SealRow[], now = Date.now()): SealLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = sealLane(row.changed, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSeal(rows: readonly SealRow[], now = Date.now()): string {
  const lines = sealLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSealHue(rows: readonly SealRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = sealHue(row.changed, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneSealCount(rows: readonly SealRow[], lane: SealLane, now = Date.now()): number {
  return rows.filter((row) => sealLane(row.changed, now) === lane).length;
}

export function sealShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSealLanes(rows: readonly SealRow[], now = Date.now()): string[] {
  return sealLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenSeal(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSeal(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSeal(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSealReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSealLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: SealRow, shape: SealShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "mint") return sealMint(row.changed, now);
  if (shape === "rust") return sealRust(row.changed, now);
  if (shape === "open") return sealOpen(row.changed, now);
  if (shape === "soon") return sealSoon(row.changed, now);
  if (shape === "today") return sealToday(row.changed, now);
  if (shape === "weekday") return sealWeekday(row.changed, now);
  if (shape === "weekend") return sealWeekend(row.changed, now);
  if (shape === "morning") return sealMorning(row.changed, now);
  if (shape === "leap") return sealLeap(row.changed, now);
  if (shape === "first") return sealFirst(row.changed, now);
  if (shape === "even") return sealEven(row.changed, now);
  if (shape === "twin") return sealTwin(row.changed, now);
  if (shape === "tail") return sealTail(row.changed);
  if (shape === "mark") return sealMark(row.changed);
  if (shape === "space") return sealSpace(row.changed);
  if (shape === "held") return sealHeld(row.changed, now);
  return sealLane(row.changed, now) === shape;
}

export function visibleSeal(
  rows: readonly SealRow[],
  lane: string,
  hue: string,
  query: string,
  review: SealReview,
  reviewed: readonly string[],
  shape: SealShape,
  now = Date.now(),
): SealRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (sealState(row.changed, now) === "") return false;
    const found = sealLane(row.changed, now);
    const hueName = sealHue(row.changed, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${sealGiven(row.changed)} ${sealStamp(row.changed, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedSealCount(rows: readonly SealRow[], now = Date.now()): number {
  const stamps = rows.map((row) => sealStamp(row.changed, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function sealLanesCsv(rows: readonly SealRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of sealLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,changed,stamp,lane,hue,step,minutes,mint,rust,today,weekday,weekend,morning,leap,first,even,twin,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (sealState(row.changed, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(sealGiven(row.changed)),
        sealStamp(row.changed, now),
        sealLane(row.changed, now),
        sealHue(row.changed, now),
        String(sealStep(row.changed, now)),
        String(sealMinutes(row.changed, now) ?? ""),
        sealMint(row.changed, now) ? "1" : "0",
        sealRust(row.changed, now) ? "1" : "0",
        sealToday(row.changed, now) ? "1" : "0",
        sealWeekday(row.changed, now) ? "1" : "0",
        sealWeekend(row.changed, now) ? "1" : "0",
        sealMorning(row.changed, now) ? "1" : "0",
        sealLeap(row.changed, now) ? "1" : "0",
        sealFirst(row.changed, now) ? "1" : "0",
        sealEven(row.changed, now) ? "1" : "0",
        sealTwin(row.changed, now) ? "1" : "0",
        sealHeld(row.changed, now) ? "1" : "0",
        sealSoon(row.changed, now) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
