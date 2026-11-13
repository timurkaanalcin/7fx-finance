/**
 * Gnomon staffs for a sundial book kept in this browser, and tenure plates read the account open date already stored on the trader.
 * Styles are lawn, wall, roof, and pier. Metals are ash, brass, and gilt.
 * Heights are 3, 5, or 9. Shadows are 1, 2, or 4.
 * A fresh account is six hours. A grove account is ninety days. Dates are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_gnomon (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   style text not null default '',
 *   metal text not null default '',
 *   height_no integer,
 *   shadow_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_tenure_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_tenure_review (
 *   trader_id text primary key
 * );
 */

export const GNS_KEY = "crmv4-gnomon";
export const GNS_VIEW_KEY = "crmv4-gnomon-views";
export const GNS_DENSITY_KEY = "crmv4-gnomon-density";
export const TNR_KEY = "crmv4-tenure-hide";
export const TNR_REVIEW_KEY = "crmv4-tenure-review";

export const GNOMON_STYLES = ["lawn", "wall", "roof", "pier"] as const;

export type GnomonStyle = (typeof GNOMON_STYLES)[number];

export type GnomonMetal = "blank" | "ash" | "brass" | "gilt";

export type GnomonTray = "green" | "closet" | "attic";

export type GnomonDensity = "open" | "close";

export type GnomonSort = "style" | "keeper";

export type Gnomon = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  style: string;
  height: number | null;
  metal: string;
  shadow: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type GnomonView = {
  id: string;
  name: string;
  tray: GnomonTray;
  query: string;
  keeper: string;
  metal: string;
  style: string;
  height: string;
  shadow: string;
};

export type GnomonCounts = {
  green: number;
  closet: number;
  attic: number;
  logged: number;
  firm: number;
  soft: number;
  tall: number;
  house: number;
  height: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type TenureLane = "" | "fresh" | "sprout" | "sapling" | "timber" | "grove";

export type TenureHue = "" | "ivory" | "graphite" | "champagne";

export type TenureState = "" | "clear" | "set";

export type TenureReview = "all" | "reviewed" | "fresh";

export type TenureShape =
  | "all"
  | "fresh"
  | "grove"
  | "quiet"
  | "today"
  | "month"
  | "odd"
  | "leap"
  | "span"
  | "long"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "sprout"
  | "sapling"
  | "timber";

export type TenureValue = string | { createdAt?: unknown; opened?: unknown; [key: string]: unknown } | null | undefined;

export type TenureRow = { id: string; label: string; opened: TenureValue };

export type TenureLaneLine = { lane: string; count: number };

export const ROUND287_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "height",
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
  "tenure",
  "tenure-csv",
] as const;

const AUDITS = ["save", "edit", "note", "metal", "log", "unlog", "lock", "resume", "stow", "open", "tag", "shadow", "height", "dip", "star"] as const;

const METALS = ["ash", "brass", "gilt"] as const;

const HEIGHT_CYCLE = [3, 5, 9] as const;

const SHADOW_CYCLE = [1, 2, 4] as const;

const FIRM = new Set(["lawn", "wall"]);

const SOFT = new Set(["roof", "pier"]);

const HOUSE_METAL = new Set(["BRASS", "GILT"]);

const MIDDAY = new Set(["wall"]);

const LANE_ORDER = ["fresh", "sprout", "sapling", "timber", "grove"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 24;

const VIEW_CAP = 8;

const TAG_CAP = 2;

const FRESH_MS = 6 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const SPROUT_MS = 7 * DAY_MS;

const SAPLING_MS = 30 * DAY_MS;

const SPAN_MS = 14 * DAY_MS;

const LONG_MS = 60 * DAY_MS;

const GROVE_MS = 90 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GnomonTray {
  return raw === "closet" || raw === "attic" ? raw : "green";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function metalName(raw: unknown): Exclude<GnomonMetal, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<GnomonMetal, "blank">) : "";
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

function inTray(card: Gnomon, tray: GnomonTray): boolean {
  if (tray === "closet") return card.locked && !card.stowed;
  if (tray === "attic") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function styleIndex(style: string): number {
  return GNOMON_STYLES.indexOf(style as GnomonStyle);
}

function heightIndex(height: number): number {
  return HEIGHT_CYCLE.indexOf(height as (typeof HEIGHT_CYCLE)[number]);
}

function shadowIndex(shadow: number): number {
  return SHADOW_CYCLE.indexOf(shadow as (typeof SHADOW_CYCLE)[number]);
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

export function gnomonStyle(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (GNOMON_STYLES as readonly string[]).includes(text) ? text : "";
}

/** A height is 3, 5, or 9. Anything else stays blank. */
export function gnomonHeight(raw: unknown): 3 | 5 | 9 | null {
  if (!/^[359]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 3 | 5 | 9;
}

/** A shadow is 1, 2, or 4. Anything else stays blank. */
export function gnomonShadow(raw: unknown): 1 | 2 | 4 | null {
  if (!/^[124]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 1 | 2 | 4;
}

/** Metal is ash, brass, or gilt. The saved metal is the upper case name. */
export function gnomonMetal(raw: unknown): string {
  const text = metalName(raw);
  return text ? text.toUpperCase() : "";
}

export function firmStyle(style: unknown): boolean {
  return FIRM.has(clip(style, 8).toLowerCase());
}

export function softStyle(style: unknown): boolean {
  return SOFT.has(clip(style, 8).toLowerCase());
}

/** Lawn is morning. Wall is midday. Roof is evening. Pier is night. */
export function gnomonBand(style: unknown): string {
  const text = gnomonStyle(style);
  if (!text) return "";
  if (text === "lawn") return "morning";
  if (MIDDAY.has(text)) return "midday";
  if (text === "roof") return "evening";
  return "night";
}

/** Signed distance from one style to the desk style. */
export function styleGap(from: unknown, to: unknown): number | null {
  const left = styleIndex(gnomonStyle(from));
  const right = styleIndex(gnomonStyle(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseMetal(metal: unknown): boolean {
  return HOUSE_METAL.has(gnomonMetal(metal));
}

/** A pair shadow is 2. One and four are not a pair. */
export function pairShadow(shadow: unknown): boolean {
  return gnomonShadow(shadow) === 2;
}

/** A full shadow is 4. */
export function fullShadow(shadow: unknown): boolean {
  return gnomonShadow(shadow) === 4;
}

export function activeStyle(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "firm" || text === "soft") return text;
  return gnomonStyle(text) || "all";
}

export function activeHeight(raw: unknown): string {
  const height = gnomonHeight(raw);
  return height === null ? "all" : String(height);
}

export function activeMetal(raw: unknown, allow: readonly string[]): string {
  const text = gnomonMetal(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeShadow(raw: unknown): string {
  const shadow = gnomonShadow(raw);
  return shadow === null ? "all" : String(shadow);
}

export function moveGnomonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGnomonMetal(cards: readonly Gnomon[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "green") || !card.metal) continue;
    counts.set(card.metal, (counts.get(card.metal) || 0) + 1);
  }
  let best = "ASH";
  let score = 0;
  for (const metal of ["ASH", "BRASS", "GILT"]) {
    const count = counts.get(metal) || 0;
    if (count > score) {
      best = metal;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest three. Through the afternoon, five. Evening asks for nine. Saved heights win when any exist. */
export function suggestHeight(cards: readonly Gnomon[], hour: number): 3 | 5 | 9 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "green") || card.height === null) continue;
    counts.set(card.height, (counts.get(card.height) || 0) + 1);
  }
  let best: 3 | 5 | 9 | null = null;
  let score = 0;
  for (const height of HEIGHT_CYCLE) {
    const count = counts.get(height) || 0;
    if (count > score) {
      best = height;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 3;
  if (hour < 16) return 5;
  return 9;
}

/** Before noon, suggest the lawn. The rest of the day suggests the pier. */
export function suggestStyle(hour: number): GnomonStyle {
  return hour < 12 ? "lawn" : "pier";
}

/** The keeper with the fewest unlogged green staffs. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Gnomon[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "green") && !card.logged);
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

export function readGnomons(raw: unknown): Gnomon[] {
  if (!Array.isArray(raw)) return [];
  const out: Gnomon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Gnomon>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      style: gnomonStyle(row.style),
      height: gnomonHeight(row.height),
      metal: gnomonMetal(row.metal),
      shadow: gnomonShadow(row.shadow) ?? 1,
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

export function addGnomon(
  cards: readonly Gnomon[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    style?: string;
    height?: unknown;
    metal?: string;
    shadow?: unknown;
    tags?: unknown;
  },
): Gnomon[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `g${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGnomons([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      style: gnomonStyle(card.style),
      height: gnomonHeight(card.height),
      metal: gnomonMetal(card.metal),
      shadow: gnomonShadow(card.shadow) ?? 1,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Gnomon[], id: string, edit: (card: Gnomon) => Gnomon): Gnomon[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGnomon(cards: readonly Gnomon[], id: string, title: string): Gnomon[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGnomonNote(cards: readonly Gnomon[], id: string, note: string): Gnomon[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleMetal(metal: string): string {
  const order = ["", "ASH", "BRASS", "GILT"];
  const index = order.indexOf(gnomonMetal(metal));
  return order[(index + 1) % order.length] || "ASH";
}

export function setGnomonMetal(cards: readonly Gnomon[], id: string, metal: string): Gnomon[] {
  const next = gnomonMetal(metal);
  return mapCard(cards, id, (card) => (card.metal === next ? card : { ...card, metal: next, audit: "metal" }));
}

export function setGnomonLogged(cards: readonly Gnomon[], id: string, logged: boolean): Gnomon[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setGnomonLock(cards: readonly Gnomon[], id: string, locked: boolean): Gnomon[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setGnomonStow(cards: readonly Gnomon[], id: string, stowed: boolean): Gnomon[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setGnomonStar(cards: readonly Gnomon[], id: string, flagged: boolean): Gnomon[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addGnomonTag(cards: readonly Gnomon[], id: string, tag: string): Gnomon[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHeight(height: number | null, dir: 1 | -1): 3 | 5 | 9 {
  if (height === null) return dir > 0 ? 3 : 9;
  const index = heightIndex(height);
  const next = index < 0 ? 0 : (index + dir + HEIGHT_CYCLE.length) % HEIGHT_CYCLE.length;
  return HEIGHT_CYCLE[next];
}

function stepShadow(shadow: number, dir: 1 | -1): 1 | 2 | 4 {
  const index = shadowIndex(shadow);
  const next = index < 0 ? 0 : (index + dir + SHADOW_CYCLE.length) % SHADOW_CYCLE.length;
  return SHADOW_CYCLE[next];
}

export function liftHeight(cards: readonly Gnomon[], id: string): Gnomon[] {
  return mapCard(cards, id, (card) => ({ ...card, height: stepHeight(card.height, 1), audit: "height" }));
}

export function dipHeight(cards: readonly Gnomon[], id: string): Gnomon[] {
  return mapCard(cards, id, (card) => ({ ...card, height: stepHeight(card.height, -1), audit: "dip" }));
}

export function raiseShadow(cards: readonly Gnomon[], id: string): Gnomon[] {
  return mapCard(cards, id, (card) => ({ ...card, shadow: stepShadow(card.shadow, 1), audit: "shadow" }));
}

export function lowerShadow(cards: readonly Gnomon[], id: string): Gnomon[] {
  return mapCard(cards, id, (card) => ({ ...card, shadow: stepShadow(card.shadow, -1), audit: "shadow" }));
}

function focused(cards: readonly Gnomon[], id: string, edit: (card: Gnomon) => Gnomon): Gnomon[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logGnomonFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function lockGnomonFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return setGnomonLock(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starGnomonFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return setGnomonStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagGnomonFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return addGnomonTag(cards, id, "x");
}

export function metalFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGnomonMetal(cards, id, cycleMetal(card.metal)) : [...cards];
}

export function liftHeightFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return liftHeight(cards, id);
}

export function dipHeightFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return dipHeight(cards, id);
}

export function raiseShadowFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return raiseShadow(cards, id);
}

export function lowerShadowFocused(cards: readonly Gnomon[], id: string): Gnomon[] {
  return lowerShadow(cards, id);
}

function bulk(cards: readonly Gnomon[], ids: readonly string[], edit: (card: Gnomon) => Gnomon): Gnomon[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGnomonGilt(cards: readonly Gnomon[], ids: readonly string[]): Gnomon[] {
  return bulk(cards, ids, (card) => (card.metal === "GILT" ? card : { ...card, metal: "GILT", audit: "metal" }));
}

export function bulkGnomonLog(cards: readonly Gnomon[], ids: readonly string[]): Gnomon[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkGnomonStow(cards: readonly Gnomon[], ids: readonly string[]): Gnomon[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkGnomonTag(cards: readonly Gnomon[], ids: readonly string[]): Gnomon[] {
  return bulk(cards, ids, (card) => (card.tags.includes("y") ? card : { ...card, tags: tagsOf([...card.tags, "y"]), audit: "tag" }));
}

export function readGnomonViews(raw: unknown): GnomonView[] {
  if (!Array.isArray(raw)) return [];
  const out: GnomonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GnomonView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      metal: activeMetal(row.metal, ["ASH", "BRASS", "GILT"]),
      style: activeStyle(row.style),
      height: activeHeight(row.height),
      shadow: activeShadow(row.shadow),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGnomonView(views: readonly GnomonView[], view: GnomonView): GnomonView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGnomonViews([...views, { ...view, id, name }]);
}

export function dropGnomonView(views: readonly GnomonView[], id: string): GnomonView[] {
  return views.filter((view) => view.id !== id);
}

export function gnomonDensity(raw: unknown): GnomonDensity {
  return raw === "close" ? "close" : "open";
}

export function sortGnomons(cards: readonly Gnomon[], sort: GnomonSort): Gnomon[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const style = styleIndex(a.style) - styleIndex(b.style);
      if (style) return style;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleGnomons(
  cards: readonly Gnomon[],
  tray: GnomonTray,
  query: string,
  keeper: string,
  metal: string,
  style: string,
  height: string,
  shadow: string,
): Gnomon[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantMetal = metal === "all" ? "" : gnomonMetal(metal);
  const wantStyle = activeStyle(style);
  const wantHeight = activeHeight(height);
  const wantShadow = activeShadow(shadow);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantMetal && card.metal !== wantMetal) return false;
    if (wantStyle === "firm" && !firmStyle(card.style)) return false;
    if (wantStyle === "soft" && !softStyle(card.style)) return false;
    if (wantStyle !== "all" && wantStyle !== "firm" && wantStyle !== "soft" && card.style !== wantStyle) return false;
    if (wantHeight !== "all" && String(card.height ?? "") !== wantHeight) return false;
    if (wantShadow !== "all" && String(card.shadow) !== wantShadow) return false;
    return true;
  });
}

/** A soft style on the first shadow, still unlogged and not in the attic, is overdue. */
export function overdueGnomon(card: Gnomon): boolean {
  return softStyle(card.style) && card.shadow === 1 && !card.logged && !card.stowed;
}

/** No metal, three high, one shadow, and still on the green. */
export function idleGnomon(card: Gnomon): boolean {
  return !card.metal && card.height === 3 && card.shadow === 1 && !card.logged && !card.locked && !card.stowed;
}

/** Gilt, nine high, and a full shadow, still out of the attic. */
export function briskGnomon(card: Gnomon): boolean {
  return card.metal === "GILT" && card.height === 9 && card.shadow === 4 && !card.stowed;
}

/** Pier, ash, and five high. */
export function restingGnomon(card: Gnomon): boolean {
  return card.style === "pier" && card.metal === "ASH" && card.height === 5;
}

/** A lawn staff is late when the desk is already on the pier. */
export function lateGnomon(card: Gnomon, desk: string): boolean {
  return card.style === "lawn" && gnomonStyle(desk) === "pier" && !card.logged;
}

export function gnomonCounts(cards: readonly Gnomon[], shown: readonly Gnomon[], desk: string): GnomonCounts {
  return {
    green: cards.filter((card) => inTray(card, "green")).length,
    closet: cards.filter((card) => inTray(card, "closet")).length,
    attic: cards.filter((card) => inTray(card, "attic")).length,
    logged: cards.filter((card) => card.logged).length,
    firm: cards.filter((card) => firmStyle(card.style)).length,
    soft: cards.filter((card) => softStyle(card.style)).length,
    tall: cards.filter((card) => card.height === 9).length,
    house: cards.filter((card) => houseMetal(card.metal)).length,
    height: cards.reduce((sum, card) => sum + (card.height || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleGnomon).length,
    brisk: cards.filter(briskGnomon).length,
    resting: cards.filter(restingGnomon).length,
    overdue: cards.filter(overdueGnomon).length,
    pair: cards.filter((card) => pairShadow(card.shadow) && lateGnomon(card, desk)).length,
  };
}

export function gnomonBars(cards: readonly Gnomon[]): { style: string; count: number }[] {
  return GNOMON_STYLES.map((style) => ({ style, count: cards.filter((card) => card.style === style && !card.stowed).length }));
}

export function gnomonTimeline(cards: readonly Gnomon[]): { height: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "green"));
  return HEIGHT_CYCLE.map((height) => ({ height, titles: open.filter((card) => card.height === height).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function gnomonKeepers(cards: readonly Gnomon[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Gnomon[]): string {
  const open = cards.filter((card) => inTray(card, "green") && !card.logged && card.keeper);
  let best = "";
  let score = 0;
  for (const name of gnomonKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGnomons(cards: readonly Gnomon[]): string[] {
  return cards.filter(overdueGnomon).map((card) => card.title);
}

export function idleGnomonList(cards: readonly Gnomon[]): string[] {
  return cards.filter(idleGnomon).map((card) => card.title);
}

export function gnomonCopy(card: Gnomon): string {
  return [card.title, card.keeper, card.style, card.metal, card.height ?? "", card.shadow, card.note].filter((item) => item !== "").join(" · ");
}

export function gnomonCsv(cards: readonly Gnomon[], desk: string): string {
  const lines = ["title,keeper,style,metal,height,shadow,tags,logged,locked,stowed,starred,soft,late,idle,brisk,resting,overdue,firm,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.style,
        card.metal,
        card.height ?? "",
        card.shadow,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        softStyle(card.style) ? "1" : "0",
        lateGnomon(card, desk) ? "1" : "0",
        idleGnomon(card) ? "1" : "0",
        briskGnomon(card) ? "1" : "0",
        restingGnomon(card) ? "1" : "0",
        overdueGnomon(card) ? "1" : "0",
        firmStyle(card.style) ? "1" : "0",
        houseMetal(card.metal) ? "1" : "0",
        gnomonBand(card.style),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: TenureValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function tenureRecord(raw: TenureValue): { createdAt?: unknown; opened?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function tenureGiven(raw: TenureValue): string {
  const row = tenureRecord(raw);
  if (row && !("createdAt" in row) && !("opened" in row)) return "";
  const value = row ? row.createdAt ?? row.opened : raw;
  return clip(value, 40);
}

export function tenureState(raw: TenureValue, now = Date.now()): TenureState {
  if (hasBlocked(raw)) return "";
  const row = tenureRecord(raw);
  if (row && !("createdAt" in row) && !("opened" in row)) return "";
  return tenureDate(raw, now) ? "set" : "clear";
}

function tenureDate(raw: TenureValue, now = Date.now()): Date | null {
  if (tenureStateRaw(raw) === "blocked") return null;
  const text = tenureGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const age = now - at;
  if (age < -FRESH_MS) return null;
  return new Date(at);
}

function tenureStateRaw(raw: TenureValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = tenureRecord(raw);
  if (row && !("createdAt" in row) && !("opened" in row)) return "blocked";
  return "open";
}

function tenureAge(raw: TenureValue, now: number): number | null {
  const at = tenureDate(raw, now);
  if (!at) return null;
  return now - at.getTime();
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

/** Fresh within six hours, grove after ninety days, otherwise the age band. */
export function tenureLane(raw: TenureValue, now = Date.now()): TenureLane {
  if (tenureState(raw, now) !== "set") return "";
  const age = tenureAge(raw, now);
  if (age === null) return "";
  if (age <= FRESH_MS) return "fresh";
  if (age <= SPROUT_MS) return "sprout";
  if (age <= SAPLING_MS) return "sapling";
  if (age <= GROVE_MS) return "timber";
  return "grove";
}

export function tenureHue(raw: TenureValue, now = Date.now()): TenureHue {
  const lane = tenureLane(raw, now);
  if (!lane) return "";
  if (lane === "fresh" || lane === "sapling") return "champagne";
  if (lane === "sprout" || lane === "timber") return "ivory";
  return "graphite";
}

export function tenureFresh(raw: TenureValue, now = Date.now()): boolean {
  return tenureLane(raw, now) === "fresh";
}

export function tenureGrove(raw: TenureValue, now = Date.now()): boolean {
  return tenureLane(raw, now) === "grove";
}

export function tenureQuiet(raw: TenureValue): boolean {
  return tenureState(raw) === "clear";
}

export function tenureToday(raw: TenureValue, now = Date.now()): boolean {
  const at = tenureDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function tenureMonth(raw: TenureValue, now = Date.now()): boolean {
  const at = tenureDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth();
}

export function tenureOdd(raw: TenureValue, now = Date.now()): boolean {
  const at = tenureDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 1;
}

export function tenureStep(raw: TenureValue, now = Date.now()): number {
  const at = tenureDate(raw, now);
  return at ? at.getUTCDate() : 0;
}

/** The open year is a leap year. */
export function tenureLeap(raw: TenureValue, now = Date.now()): boolean {
  const at = tenureDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

/** Older than a fortnight and still inside ninety days. */
export function tenureSpan(raw: TenureValue, now = Date.now()): boolean {
  const age = tenureAge(raw, now);
  return age !== null && age > SPAN_MS && age <= GROVE_MS;
}

/** Sixty days or more. */
export function tenureLong(raw: TenureValue, now = Date.now()): boolean {
  const age = tenureAge(raw, now);
  return age !== null && age >= LONG_MS;
}

export function tenureTwin(raw: TenureValue, now = Date.now()): boolean {
  const at = tenureDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDate();
  return day === 1 || day === 15;
}

export function tenureTail(raw: TenureValue): boolean {
  return /z$/i.test(tenureGiven(raw).trim());
}

export function tenureMark(raw: TenureValue): boolean {
  return tenureGiven(raw).includes("T");
}

export function tenureSpace(raw: TenureValue): boolean {
  return tenureGiven(raw).includes(" ");
}

export function tenureKnown(raw: TenureValue, now = Date.now()): boolean {
  const lane = tenureLane(raw, now);
  return lane === "fresh" || lane === "sprout" || lane === "sapling";
}

export function tenureStamp(raw: TenureValue, now = Date.now()): string {
  const at = tenureDate(raw, now);
  if (!at) return "";
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const day = String(at.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export function tenureCopy(raw: TenureValue): string {
  return tenureGiven(raw);
}

export function tenureLanes(rows: readonly TenureRow[], now = Date.now()): TenureLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = tenureLane(row.opened, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTenure(rows: readonly TenureRow[], now = Date.now()): string {
  const lines = tenureLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingTenureHue(rows: readonly TenureRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = tenureHue(row.opened, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneTenureCount(rows: readonly TenureRow[], lane: TenureLane, now = Date.now()): number {
  return rows.filter((row) => tenureLane(row.opened, now) === lane).length;
}

export function tenureShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTenureLanes(rows: readonly TenureRow[], now = Date.now()): string[] {
  return tenureLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenTenure(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTenure(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTenure(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTenureReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTenureReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTenureLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: TenureRow, shape: TenureShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "fresh") return tenureFresh(row.opened, now);
  if (shape === "grove") return tenureGrove(row.opened, now);
  if (shape === "quiet") return tenureQuiet(row.opened);
  if (shape === "today") return tenureToday(row.opened, now);
  if (shape === "month") return tenureMonth(row.opened, now);
  if (shape === "odd") return tenureOdd(row.opened, now);
  if (shape === "leap") return tenureLeap(row.opened, now);
  if (shape === "span") return tenureSpan(row.opened, now);
  if (shape === "long") return tenureLong(row.opened, now);
  if (shape === "twin") return tenureTwin(row.opened, now);
  if (shape === "tail") return tenureTail(row.opened);
  if (shape === "mark") return tenureMark(row.opened);
  if (shape === "space") return tenureSpace(row.opened);
  return tenureLane(row.opened, now) === shape;
}

export function visibleTenure(
  rows: readonly TenureRow[],
  lane: string,
  hue: string,
  query: string,
  review: TenureReview,
  reviewed: readonly string[],
  shape: TenureShape,
  now = Date.now(),
): TenureRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (tenureState(row.opened, now) === "") return false;
    const found = tenureLane(row.opened, now);
    const hueName = tenureHue(row.opened, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${tenureGiven(row.opened)} ${tenureStamp(row.opened, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedTenureCount(rows: readonly TenureRow[], now = Date.now()): number {
  const stamps = rows.map((row) => tenureStamp(row.opened, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function tenureLanesCsv(rows: readonly TenureRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of tenureLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function tenureRowsCsv(rows: readonly TenureRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,opened,stamp,lane,hue,step,fresh,grove,today,month,odd,leap,span,long,twin,tail,mark,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (tenureState(row.opened, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(tenureGiven(row.opened)),
        tenureStamp(row.opened, now),
        tenureLane(row.opened, now),
        tenureHue(row.opened, now),
        String(tenureStep(row.opened, now)),
        tenureFresh(row.opened, now) ? "1" : "0",
        tenureGrove(row.opened, now) ? "1" : "0",
        tenureToday(row.opened, now) ? "1" : "0",
        tenureMonth(row.opened, now) ? "1" : "0",
        tenureOdd(row.opened, now) ? "1" : "0",
        tenureLeap(row.opened, now) ? "1" : "0",
        tenureSpan(row.opened, now) ? "1" : "0",
        tenureLong(row.opened, now) ? "1" : "0",
        tenureTwin(row.opened, now) ? "1" : "0",
        tenureTail(row.opened) ? "1" : "0",
        tenureMark(row.opened) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
