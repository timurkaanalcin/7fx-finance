/**
 * Equatorium rings for an onboarding instrument kept in this browser, and register plates read the registration date already stored on the account.
 * Metals are brass, ivory, steel, and ebony. Tempers are cool, warm, and hot.
 * Arcs are 15, 30, or 45. Teeth are 1, 3, or 5.
 * A dawn registration is one day. An archive registration is older than a year. Dates are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_equatorium (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   metal text not null default '',
 *   temper text not null default '',
 *   arc_no integer,
 *   tooth_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_register_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_register_review (
 *   trader_id text primary key
 * );
 */

export const EQM_KEY = "crmv4-equatorium";
export const EQM_VIEW_KEY = "crmv4-equatorium-views";
export const EQM_DENSITY_KEY = "crmv4-equatorium-density";
export const RGD_KEY = "crmv4-register-hide";
export const RGD_REVIEW_KEY = "crmv4-register-review";

export const EQUATORIUM_METALS = ["brass", "ivory", "steel", "ebony"] as const;

export type EquatoriumMetal = (typeof EQUATORIUM_METALS)[number];

export type EquatoriumTemper = "blank" | "cool" | "warm" | "hot";

export type EquatoriumTray = "ring" | "case" | "vault";

export type EquatoriumDensity = "wide" | "narrow";

export type EquatoriumSort = "metal" | "keeper";

export type Equatorium = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  metal: string;
  arc: number | null;
  temper: string;
  tooth: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type EquatoriumView = {
  id: string;
  name: string;
  tray: EquatoriumTray;
  query: string;
  keeper: string;
  temper: string;
  metal: string;
  arc: string;
  tooth: string;
};

export type EquatoriumCounts = {
  ring: number;
  case: number;
  vault: number;
  logged: number;
  firm: number;
  soft: number;
  wide: number;
  house: number;
  arc: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type RegisterLane = "" | "dawn" | "week" | "moon" | "year" | "archive";

export type RegisterHue = "" | "ivory" | "graphite" | "champagne";

export type RegisterState = "" | "clear" | "set";

export type RegisterReview = "all" | "reviewed" | "fresh";

export type RegisterShape =
  | "all"
  | "dawn"
  | "archive"
  | "quiet"
  | "today"
  | "weekday"
  | "weekend"
  | "morning"
  | "anniversary"
  | "future"
  | "leap"
  | "first"
  | "even"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "week"
  | "moon"
  | "year";

export type RegisterValue = string | { registrationDate?: unknown; opened?: unknown; [key: string]: unknown } | null | undefined;

export type RegisterRow = { id: string; label: string; opened: RegisterValue };

export type RegisterLaneLine = { lane: string; count: number };

export const ROUND290_FEATURES = [
  "save",
  "note",
  "trays",
  "temper",
  "arc",
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
  "register",
  "register-csv",
] as const;

const AUDITS = ["save", "edit", "note", "temper", "log", "unlog", "lock", "resume", "stow", "open", "tag", "tooth", "arc", "lower", "star"] as const;

const TEMPERS = ["cool", "warm", "hot"] as const;

const ARC_CYCLE = [15, 30, 45] as const;

const TOOTH_CYCLE = [1, 3, 5] as const;

const FIRM = new Set(["brass", "ivory"]);

const SOFT = new Set(["steel", "ebony"]);

const HOUSE_TEMPER = new Set(["WARM", "HOT"]);

const LANE_ORDER = ["dawn", "week", "moon", "year", "archive"] as const;

const HUE_ORDER = ["champagne", "ivory", "graphite"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const DAWN_MS = 24 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEK_MS = 7 * DAY_MS;

const MOON_MS = 30 * DAY_MS;

const YEAR_MS = 365 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): EquatoriumTray {
  return raw === "case" || raw === "vault" ? raw : "ring";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function temperName(raw: unknown): Exclude<EquatoriumTemper, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPERS as readonly string[]).includes(text) ? (text as Exclude<EquatoriumTemper, "blank">) : "";
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

function inTray(card: Equatorium, tray: EquatoriumTray): boolean {
  if (tray === "case") return card.locked && !card.stowed;
  if (tray === "vault") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function metalIndex(metal: string): number {
  return EQUATORIUM_METALS.indexOf(metal as EquatoriumMetal);
}

function arcIndex(arc: number): number {
  return ARC_CYCLE.indexOf(arc as (typeof ARC_CYCLE)[number]);
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

export function equatoriumMetal(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (EQUATORIUM_METALS as readonly string[]).includes(text) ? text : "";
}

/** An arc is 15, 30, or 45. Anything else stays blank. */
export function equatoriumArc(raw: unknown): 15 | 30 | 45 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45") return null;
  return Number(text) as 15 | 30 | 45;
}

/** A tooth is 1, 3, or 5. Anything else stays blank. */
export function equatoriumTooth(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** Temper is cool, warm, or hot. The saved temper is the upper case name. */
export function equatoriumTemper(raw: unknown): string {
  const text = temperName(raw);
  return text ? text.toUpperCase() : "";
}

export function firmMetal(metal: unknown): boolean {
  return FIRM.has(clip(metal, 12).toLowerCase());
}

export function softMetal(metal: unknown): boolean {
  return SOFT.has(clip(metal, 12).toLowerCase());
}

/** Brass is dawn. Ivory is noon. Steel is dusk. Ebony is night. */
export function equatoriumBand(metal: unknown): string {
  const text = equatoriumMetal(metal);
  if (!text) return "";
  if (text === "brass") return "dawn";
  if (text === "ivory") return "noon";
  if (text === "steel") return "dusk";
  return "night";
}

/** Signed distance from one metal to the desk metal. */
export function metalGap(from: unknown, to: unknown): number | null {
  const left = metalIndex(equatoriumMetal(from));
  const right = metalIndex(equatoriumMetal(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseTemper(temper: unknown): boolean {
  return HOUSE_TEMPER.has(equatoriumTemper(temper));
}

/** A pair tooth is 3. One and five are not a pair. */
export function pairTooth(tooth: unknown): boolean {
  return equatoriumTooth(tooth) === 3;
}

/** A full tooth is 5. */
export function fullTooth(tooth: unknown): boolean {
  return equatoriumTooth(tooth) === 5;
}

export function activeMetal(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "firm" || text === "soft") return text;
  return equatoriumMetal(text) || "all";
}

export function activeArc(raw: unknown): string {
  const arc = equatoriumArc(raw);
  return arc === null ? "all" : String(arc);
}

export function activeTemper(raw: unknown, allow: readonly string[]): string {
  const text = equatoriumTemper(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = equatoriumTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function moveEquatoriumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestEquatoriumTemper(cards: readonly Equatorium[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "ring") || !card.temper) continue;
    counts.set(card.temper, (counts.get(card.temper) || 0) + 1);
  }
  let best = "COOL";
  let score = 0;
  for (const temper of ["COOL", "WARM", "HOT"]) {
    const count = counts.get(temper) || 0;
    if (count > score) {
      best = temper;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest fifteen. Through the afternoon, thirty. Evening asks for forty-five. Saved arcs win when any exist. */
export function suggestArc(cards: readonly Equatorium[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "ring") || card.arc === null) continue;
    counts.set(card.arc, (counts.get(card.arc) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const arc of ARC_CYCLE) {
    const count = counts.get(arc) || 0;
    if (count > score) {
      best = arc;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 9) return 15;
  if (hour < 17) return 30;
  return 45;
}

/** Before noon, suggest brass. The rest of the day suggests ebony. */
export function suggestMetal(hour: number): EquatoriumMetal {
  return hour < 12 ? "brass" : "ebony";
}

/** The keeper with the fewest unlogged rings. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Equatorium[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "ring") && !card.logged);
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

export function readEquatoriums(raw: unknown): Equatorium[] {
  if (!Array.isArray(raw)) return [];
  const out: Equatorium[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Equatorium>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      metal: equatoriumMetal(row.metal),
      arc: equatoriumArc(row.arc),
      temper: equatoriumTemper(row.temper),
      tooth: equatoriumTooth(row.tooth) ?? 1,
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

export function addEquatorium(
  cards: readonly Equatorium[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    metal?: string;
    arc?: unknown;
    temper?: string;
    tooth?: unknown;
    tags?: unknown;
  },
): Equatorium[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readEquatoriums([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      metal: equatoriumMetal(card.metal),
      arc: equatoriumArc(card.arc),
      temper: equatoriumTemper(card.temper),
      tooth: equatoriumTooth(card.tooth) ?? 1,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Equatorium[], id: string, edit: (card: Equatorium) => Equatorium): Equatorium[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editEquatorium(cards: readonly Equatorium[], id: string, title: string): Equatorium[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editEquatoriumNote(cards: readonly Equatorium[], id: string, note: string): Equatorium[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleTemper(temper: string): string {
  const order = ["", "COOL", "WARM", "HOT"];
  const index = order.indexOf(equatoriumTemper(temper));
  return order[(index + 1) % order.length] || "COOL";
}

export function setEquatoriumTemper(cards: readonly Equatorium[], id: string, temper: string): Equatorium[] {
  const next = equatoriumTemper(temper);
  return mapCard(cards, id, (card) => (card.temper === next ? card : { ...card, temper: next, audit: "temper" }));
}

export function setEquatoriumLogged(cards: readonly Equatorium[], id: string, logged: boolean): Equatorium[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setEquatoriumLock(cards: readonly Equatorium[], id: string, locked: boolean): Equatorium[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setEquatoriumStow(cards: readonly Equatorium[], id: string, stowed: boolean): Equatorium[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setEquatoriumStar(cards: readonly Equatorium[], id: string, flagged: boolean): Equatorium[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addEquatoriumTag(cards: readonly Equatorium[], id: string, tag: string): Equatorium[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepArc(arc: number | null, dir: 1 | -1): 15 | 30 | 45 {
  if (arc === null) return dir > 0 ? 15 : 45;
  const index = arcIndex(arc);
  const next = index < 0 ? 0 : (index + dir + ARC_CYCLE.length) % ARC_CYCLE.length;
  return ARC_CYCLE[next];
}

function stepTooth(tooth: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + TOOTH_CYCLE.length) % TOOTH_CYCLE.length;
  return TOOTH_CYCLE[next];
}

export function liftArc(cards: readonly Equatorium[], id: string): Equatorium[] {
  return mapCard(cards, id, (card) => ({ ...card, arc: stepArc(card.arc, 1), audit: "arc" }));
}

export function lowerArc(cards: readonly Equatorium[], id: string): Equatorium[] {
  return mapCard(cards, id, (card) => ({ ...card, arc: stepArc(card.arc, -1), audit: "lower" }));
}

export function raiseTooth(cards: readonly Equatorium[], id: string): Equatorium[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Equatorium[], id: string): Equatorium[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "tooth" }));
}

function focused(cards: readonly Equatorium[], id: string, edit: (card: Equatorium) => Equatorium): Equatorium[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logEquatoriumFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function lockEquatoriumFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return setEquatoriumLock(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starEquatoriumFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return setEquatoriumStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagEquatoriumFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return addEquatoriumTag(cards, id, "a");
}

export function temperFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  const card = cards.find((item) => item.id === id);
  return card ? setEquatoriumTemper(cards, id, cycleTemper(card.temper)) : [...cards];
}

export function liftArcFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return liftArc(cards, id);
}

export function lowerArcFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return lowerArc(cards, id);
}

export function raiseToothFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Equatorium[], id: string): Equatorium[] {
  return lowerTooth(cards, id);
}

function bulk(cards: readonly Equatorium[], ids: readonly string[], edit: (card: Equatorium) => Equatorium): Equatorium[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkEquatoriumHot(cards: readonly Equatorium[], ids: readonly string[]): Equatorium[] {
  return bulk(cards, ids, (card) => (card.temper === "HOT" ? card : { ...card, temper: "HOT", audit: "temper" }));
}

export function bulkEquatoriumLog(cards: readonly Equatorium[], ids: readonly string[]): Equatorium[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkEquatoriumStow(cards: readonly Equatorium[], ids: readonly string[]): Equatorium[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkEquatoriumTag(cards: readonly Equatorium[], ids: readonly string[]): Equatorium[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readEquatoriumViews(raw: unknown): EquatoriumView[] {
  if (!Array.isArray(raw)) return [];
  const out: EquatoriumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EquatoriumView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      temper: activeTemper(row.temper, ["COOL", "WARM", "HOT"]),
      metal: activeMetal(row.metal),
      arc: activeArc(row.arc),
      tooth: activeTooth(row.tooth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addEquatoriumView(views: readonly EquatoriumView[], view: EquatoriumView): EquatoriumView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readEquatoriumViews([...views, { ...view, id, name }]);
}

export function dropEquatoriumView(views: readonly EquatoriumView[], id: string): EquatoriumView[] {
  return views.filter((view) => view.id !== id);
}

export function equatoriumDensity(raw: unknown): EquatoriumDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortEquatoriums(cards: readonly Equatorium[], sort: EquatoriumSort): Equatorium[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const metal = metalIndex(a.metal) - metalIndex(b.metal);
      if (metal) return metal;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleEquatoriums(
  cards: readonly Equatorium[],
  tray: EquatoriumTray,
  query: string,
  keeper: string,
  temper: string,
  metal: string,
  arc: string,
  tooth: string,
): Equatorium[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantTemper = temper === "all" ? "" : equatoriumTemper(temper);
  const wantMetal = activeMetal(metal);
  const wantArc = activeArc(arc);
  const wantTooth = activeTooth(tooth);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantTemper && card.temper !== wantTemper) return false;
    if (wantMetal === "firm" && !firmMetal(card.metal)) return false;
    if (wantMetal === "soft" && !softMetal(card.metal)) return false;
    if (wantMetal !== "all" && wantMetal !== "firm" && wantMetal !== "soft" && card.metal !== wantMetal) return false;
    if (wantArc !== "all" && String(card.arc ?? "") !== wantArc) return false;
    if (wantTooth !== "all" && String(card.tooth) !== wantTooth) return false;
    return true;
  });
}

/** A soft metal on the first tooth, still unlogged and not in the vault, is overdue. */
export function overdueEquatorium(card: Equatorium): boolean {
  return softMetal(card.metal) && card.tooth === 1 && !card.logged && !card.stowed;
}

/** No temper, a short arc, one tooth, and still on the ring. */
export function idleEquatorium(card: Equatorium): boolean {
  return !card.temper && card.arc === 15 && card.tooth === 1 && !card.logged && !card.locked && !card.stowed;
}

/** Hot, a wide arc, and a full tooth, still out of the vault. */
export function briskEquatorium(card: Equatorium): boolean {
  return card.temper === "HOT" && card.arc === 45 && card.tooth === 5 && !card.stowed;
}

/** Ebony, cool, and a middle arc. */
export function restingEquatorium(card: Equatorium): boolean {
  return card.metal === "ebony" && card.temper === "COOL" && card.arc === 30;
}

/** A brass ring is late when the desk is already on ebony. */
export function lateEquatorium(card: Equatorium, desk: string): boolean {
  return card.metal === "brass" && equatoriumMetal(desk) === "ebony" && !card.logged;
}

export function equatoriumCounts(cards: readonly Equatorium[], shown: readonly Equatorium[], desk: string): EquatoriumCounts {
  return {
    ring: cards.filter((card) => inTray(card, "ring")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    logged: cards.filter((card) => card.logged).length,
    firm: cards.filter((card) => firmMetal(card.metal)).length,
    soft: cards.filter((card) => softMetal(card.metal)).length,
    wide: cards.filter((card) => card.arc === 45).length,
    house: cards.filter((card) => houseTemper(card.temper)).length,
    arc: cards.reduce((sum, card) => sum + (card.arc || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleEquatorium).length,
    brisk: cards.filter(briskEquatorium).length,
    resting: cards.filter(restingEquatorium).length,
    overdue: cards.filter(overdueEquatorium).length,
    pair: cards.filter((card) => pairTooth(card.tooth) && lateEquatorium(card, desk)).length,
  };
}

export function equatoriumBars(cards: readonly Equatorium[]): { metal: string; count: number }[] {
  return EQUATORIUM_METALS.map((metal) => ({ metal, count: cards.filter((card) => card.metal === metal && !card.stowed).length }));
}

export function equatoriumTimeline(cards: readonly Equatorium[]): { arc: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "ring"));
  return ARC_CYCLE.map((arc) => ({ arc, titles: open.filter((card) => card.arc === arc).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function equatoriumKeepers(cards: readonly Equatorium[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Equatorium[]): string {
  const open = cards.filter((card) => inTray(card, "ring") && !card.logged && card.keeper);
  let best = "";
  let score = 0;
  for (const name of equatoriumKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderEquatoriums(cards: readonly Equatorium[]): string[] {
  return cards.filter(overdueEquatorium).map((card) => card.title);
}

export function equatoriumCopy(card: Equatorium): string {
  return [card.title, card.keeper, card.metal, card.temper, card.arc ?? "", card.tooth, card.note].filter((item) => item !== "").join(" · ");
}

export function equatoriumCsv(cards: readonly Equatorium[], desk: string): string {
  const lines = ["title,keeper,metal,temper,arc,tooth,tags,logged,locked,stowed,starred,soft,late,idle,brisk,resting,overdue,firm,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.metal,
        card.temper,
        card.arc ?? "",
        card.tooth,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        softMetal(card.metal) ? "1" : "0",
        lateEquatorium(card, desk) ? "1" : "0",
        idleEquatorium(card) ? "1" : "0",
        briskEquatorium(card) ? "1" : "0",
        restingEquatorium(card) ? "1" : "0",
        overdueEquatorium(card) ? "1" : "0",
        firmMetal(card.metal) ? "1" : "0",
        houseTemper(card.temper) ? "1" : "0",
        equatoriumBand(card.metal),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: RegisterValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function registerRecord(raw: RegisterValue): { registrationDate?: unknown; opened?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function registerGiven(raw: RegisterValue): string {
  const row = registerRecord(raw);
  if (row && !("registrationDate" in row) && !("opened" in row)) return "";
  const value = row ? row.registrationDate ?? row.opened : raw;
  return clip(value, 40);
}

export function registerState(raw: RegisterValue, now = Date.now()): RegisterState {
  if (hasBlocked(raw)) return "";
  const row = registerRecord(raw);
  if (row && !("registrationDate" in row) && !("opened" in row)) return "";
  return registerDate(raw, now) ? "set" : "clear";
}

function registerDate(raw: RegisterValue, now = Date.now()): Date | null {
  if (registerStateRaw(raw) === "blocked") return null;
  const text = registerGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const age = now - at;
  if (age < -DAWN_MS) return null;
  return new Date(at);
}

function registerStateRaw(raw: RegisterValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = registerRecord(raw);
  if (row && !("registrationDate" in row) && !("opened" in row)) return "blocked";
  return "open";
}

function registerAge(raw: RegisterValue, now: number): number | null {
  const at = registerDate(raw, now);
  if (!at) return null;
  return now - at.getTime();
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

/** Dawn within a day, then week, moon, and year. Older than a year is the archive. */
export function registerLane(raw: RegisterValue, now = Date.now()): RegisterLane {
  if (registerState(raw, now) !== "set") return "";
  const age = registerAge(raw, now);
  if (age === null) return "";
  if (age <= DAWN_MS) return "dawn";
  if (age <= WEEK_MS) return "week";
  if (age <= MOON_MS) return "moon";
  if (age <= YEAR_MS) return "year";
  return "archive";
}

export function registerHue(raw: RegisterValue, now = Date.now()): RegisterHue {
  const lane = registerLane(raw, now);
  if (!lane) return "";
  if (lane === "dawn" || lane === "year") return "champagne";
  if (lane === "week" || lane === "moon") return "ivory";
  return "graphite";
}

export function registerDawn(raw: RegisterValue, now = Date.now()): boolean {
  return registerLane(raw, now) === "dawn";
}

export function registerArchive(raw: RegisterValue, now = Date.now()): boolean {
  return registerLane(raw, now) === "archive";
}

export function registerQuiet(raw: RegisterValue): boolean {
  return registerState(raw) === "clear";
}

/** A welcome is still due during the first week. */
export function registerWelcome(raw: RegisterValue, now = Date.now()): boolean {
  const lane = registerLane(raw, now);
  return lane === "dawn" || lane === "week";
}

export function registerDays(raw: RegisterValue, now = Date.now()): number | null {
  const age = registerAge(raw, now);
  if (age === null) return null;
  return Math.max(0, Math.floor(age / DAY_MS));
}

export function registerToday(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function registerWeekday(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day >= 1 && day <= 5;
}

export function registerWeekend(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function registerMorning(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  return Boolean(at) && at!.getUTCHours() < 12;
}

/** Same month and day in an earlier year. */
export function registerAnniversary(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() < clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

/** Recorded up to one day ahead of the clock. Farther ahead is not a registration. */
export function registerFuture(raw: RegisterValue, now = Date.now()): boolean {
  const age = registerAge(raw, now);
  return age !== null && age < 0;
}

export function registerEven(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function registerFirst(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  return Boolean(at) && at!.getUTCDate() === 1;
}

export function registerStep(raw: RegisterValue, now = Date.now()): number {
  const at = registerDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

/** The registration year is a leap year. */
export function registerLeap(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

export function registerTwin(raw: RegisterValue, now = Date.now()): boolean {
  const at = registerDate(raw, now);
  if (!at) return false;
  return at.getUTCDay() === new Date(now).getUTCDay();
}

export function registerTail(raw: RegisterValue): boolean {
  return /z$/i.test(registerGiven(raw).trim());
}

export function registerMark(raw: RegisterValue): boolean {
  return registerGiven(raw).includes("T");
}

export function registerSpace(raw: RegisterValue): boolean {
  return registerGiven(raw).includes(" ");
}

export function registerStamp(raw: RegisterValue, now = Date.now()): string {
  const at = registerDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function registerCopy(raw: RegisterValue): string {
  return registerGiven(raw);
}

export function registerLanes(rows: readonly RegisterRow[], now = Date.now()): RegisterLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = registerLane(row.opened, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRegister(rows: readonly RegisterRow[], now = Date.now()): string {
  const lines = registerLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingRegisterHue(rows: readonly RegisterRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = registerHue(row.opened, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneRegisterCount(rows: readonly RegisterRow[], lane: RegisterLane, now = Date.now()): number {
  return rows.filter((row) => registerLane(row.opened, now) === lane).length;
}

export function registerShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRegisterLanes(rows: readonly RegisterRow[], now = Date.now()): string[] {
  return registerLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenRegister(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRegister(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRegister(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRegisterReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRegisterReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRegisterLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: RegisterRow, shape: RegisterShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "dawn") return registerDawn(row.opened, now);
  if (shape === "archive") return registerArchive(row.opened, now);
  if (shape === "quiet") return registerQuiet(row.opened);
  if (shape === "today") return registerToday(row.opened, now);
  if (shape === "weekday") return registerWeekday(row.opened, now);
  if (shape === "weekend") return registerWeekend(row.opened, now);
  if (shape === "morning") return registerMorning(row.opened, now);
  if (shape === "anniversary") return registerAnniversary(row.opened, now);
  if (shape === "future") return registerFuture(row.opened, now);
  if (shape === "leap") return registerLeap(row.opened, now);
  if (shape === "first") return registerFirst(row.opened, now);
  if (shape === "even") return registerEven(row.opened, now);
  if (shape === "twin") return registerTwin(row.opened, now);
  if (shape === "tail") return registerTail(row.opened);
  if (shape === "mark") return registerMark(row.opened);
  if (shape === "space") return registerSpace(row.opened);
  return registerLane(row.opened, now) === shape;
}

export function visibleRegister(
  rows: readonly RegisterRow[],
  lane: string,
  hue: string,
  query: string,
  review: RegisterReview,
  reviewed: readonly string[],
  shape: RegisterShape,
  now = Date.now(),
): RegisterRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (registerState(row.opened, now) === "") return false;
    const found = registerLane(row.opened, now);
    const hueName = registerHue(row.opened, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${registerGiven(row.opened)} ${registerStamp(row.opened, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedRegisterCount(rows: readonly RegisterRow[], now = Date.now()): number {
  const stamps = rows.map((row) => registerStamp(row.opened, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function registerLanesCsv(rows: readonly RegisterRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of registerLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function registerRowsCsv(rows: readonly RegisterRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,opened,stamp,lane,hue,step,days,dawn,archive,today,weekday,weekend,morning,anniversary,future,leap,first,even,twin,welcome,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (registerState(row.opened, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(registerGiven(row.opened)),
        registerStamp(row.opened, now),
        registerLane(row.opened, now),
        registerHue(row.opened, now),
        String(registerStep(row.opened, now)),
        String(registerDays(row.opened, now) ?? ""),
        registerDawn(row.opened, now) ? "1" : "0",
        registerArchive(row.opened, now) ? "1" : "0",
        registerToday(row.opened, now) ? "1" : "0",
        registerWeekday(row.opened, now) ? "1" : "0",
        registerWeekend(row.opened, now) ? "1" : "0",
        registerMorning(row.opened, now) ? "1" : "0",
        registerAnniversary(row.opened, now) ? "1" : "0",
        registerFuture(row.opened, now) ? "1" : "0",
        registerLeap(row.opened, now) ? "1" : "0",
        registerFirst(row.opened, now) ? "1" : "0",
        registerEven(row.opened, now) ? "1" : "0",
        registerTwin(row.opened, now) ? "1" : "0",
        registerWelcome(row.opened, now) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
