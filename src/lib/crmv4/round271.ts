/**
 * Anemometer cups for a wind follow-up book, and retention plates already stored as retentionStatus.
 * Bearings are calm, breeze, gale, and storm. Vanes are north, east, and south.
 * Watches are 15, 30, or 60 minutes. Beads are 2, 4, 6, or 8.
 * ACTIVE is a grove and VIP is a court. A separator is a verge.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_anemometer_cup (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   bearing text not null default '',
 *   lacquer text not null default '',
 *   vane text not null default '',
 *   watch_min integer,
 *   bead_no integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_retention_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_retention_review (
 *   trader_id text primary key
 * );
 */

export const ANM_KEY = "crmv4-anemometer-cup";
export const ANM_VIEW_KEY = "crmv4-anemometer-views";
export const ANM_DENSITY_KEY = "crmv4-anemometer-density";
export const RTN_KEY = "crmv4-retention-hide";
export const RTN_REVIEW_KEY = "crmv4-retention-review";

export const ANEMO_BEARINGS = ["calm", "breeze", "gale", "storm"] as const;

export type AnemoBearing = (typeof ANEMO_BEARINGS)[number];

export type LacquerName = "blank" | "ivory" | "graphite" | "champagne";

export type VaneName = "blank" | "north" | "east" | "south";

export type CupTray = "open" | "pause" | "seal";

export type CupDensity = "roomy" | "close";

export type CupSort = "bearing" | "keeper";

export type AnemoCup = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  bearing: string;
  watch: number | null;
  lacquer: string;
  vane: string;
  bead: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type CupView = {
  id: string;
  name: string;
  tray: CupTray;
  query: string;
  keeper: string;
  lacquer: string;
  vane: string;
  bearing: string;
  watch: string;
  bead: string;
};

export type CupCounts = {
  open: number;
  pause: number;
  seal: number;
  pinned: number;
  keen: number;
  still: number;
  soon: number;
  bead: number;
  house: number;
  watch: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type RetentionLane = "" | "grove" | "court" | "shade" | "verge";

export type RetentionHue = "" | "ivory" | "graphite" | "champagne";

export type RetentionState = "" | "clear" | "set";

export type RetentionShape = "all" | "grove" | "court" | "shade" | "verge" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type RetentionReview = "all" | "reviewed" | "fresh";

export type RetentionValue = string | { retentionStatus?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type RetentionRow = { id: string; label: string; note: RetentionValue };

export type RetentionLaneLine = { lane: string; count: number };

export const ROUND271_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "watch",
  "seal",
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
  "retention",
  "retention-csv",
] as const;

const AUDITS = ["save", "edit", "note", "vane", "pin", "unpin", "pause", "resume", "seal", "open", "lacquer", "tag", "bead", "watch", "short", "flag"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const VANES = ["north", "east", "south"] as const;

const WATCH_CYCLE = [15, 30, 60] as const;

const BEAD_CYCLE = [2, 4, 6, 8] as const;

const KEEN = new Set(["breeze", "gale"]);

const STILL = new Set(["calm", "storm"]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const EARLY = new Set(["calm", "breeze"]);

const LANE_ORDER = ["grove", "court", "shade", "verge"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["active", "vip", "inactive", "churned", "at_risk"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CupTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function lacquerName(raw: unknown): Exclude<LacquerName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<LacquerName, "blank">) : "";
}

function vaneName(raw: unknown): Exclude<VaneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (VANES as readonly string[]).includes(text) ? (text as Exclude<VaneName, "blank">) : "";
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

function inTray(card: AnemoCup, tray: CupTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function bearingIndex(bearing: string): number {
  return ANEMO_BEARINGS.indexOf(bearing as AnemoBearing);
}

function beadIndex(bead: number): number {
  return BEAD_CYCLE.indexOf(bead as (typeof BEAD_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function bearingOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ANEMO_BEARINGS as readonly string[]).includes(text) ? text : "";
}

/** Watch is 15, 30, or 60 minutes. Anything else stays blank. */
export function anemoWatch(raw: unknown): 15 | 30 | 60 | null {
  const value = Number(clip(raw, 2));
  return (WATCH_CYCLE as readonly number[]).includes(value) ? (value as 15 | 30 | 60) : null;
}

/** Bead is 2, 4, 6, or 8. Anything else stays blank. */
export function anemoBead(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (BEAD_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Lacquer is ivory, graphite, or champagne. The saved lacquer is IVORY, GRAPHITE, or CHAMPAGNE. */
export function lacquerOf(raw: unknown): string {
  const text = lacquerName(raw);
  return text ? text.toUpperCase() : "";
}

/** Vane is north, east, or south. A blank vane stays blank. */
export function vaneOf(raw: unknown): string {
  return vaneName(raw);
}

export function keenBearing(bearing: unknown): boolean {
  return KEEN.has(clip(bearing, 12).toLowerCase());
}

export function stillBearing(bearing: unknown): boolean {
  return STILL.has(clip(bearing, 12).toLowerCase());
}

/** Early is calm and breeze. Mid is gale. Late is storm. */
export function bearingBand(bearing: unknown): string {
  const text = bearingOf(bearing);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "gale") return "mid";
  return "late";
}

/** Signed distance from the cup bearing to the desk bearing. */
export function bearingGap(from: unknown, to: unknown): number | null {
  const left = bearingIndex(bearingOf(from));
  const right = bearingIndex(bearingOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseLacquer(lacquer: unknown): boolean {
  return HOUSE.has(lacquerOf(lacquer));
}

export function activeBearing(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return bearingOf(text) || "all";
}

export function activeWatch(raw: unknown): string {
  const watch = anemoWatch(raw);
  return watch === null ? "all" : String(watch);
}

export function activeVane(raw: unknown, allow: readonly string[]): string {
  const text = vaneOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const bead = anemoBead(raw);
  return bead === null ? "all" : String(bead);
}

export function activeLacquer(raw: unknown): string {
  const text = lacquerName(raw);
  return text || "all";
}

export function moveAnemoFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestLacquer(cards: readonly AnemoCup[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.lacquer) continue;
    counts.set(card.lacquer, (counts.get(card.lacquer) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = 0;
  for (const lacquer of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(lacquer) || 0;
    if (count > score) {
      best = lacquer;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest fifteen minutes. Through the afternoon, thirty. Evening asks for sixty. Saved watches win when any exist. */
export function suggestWatch(cards: readonly AnemoCup[], hour: number): 15 | 30 | 60 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.watch === null) continue;
    counts.set(card.watch, (counts.get(card.watch) || 0) + 1);
  }
  let best: 15 | 30 | 60 | null = null;
  let score = 0;
  for (const watch of WATCH_CYCLE) {
    const count = counts.get(watch) || 0;
    if (count > score) {
      best = watch;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 8) return 15;
  if (hour < 16) return 30;
  return 60;
}

/** Before eight, suggest the calm bearing. The rest of the day suggests the gale bearing. */
export function suggestBearing(hour: number): AnemoBearing {
  return hour < 8 ? "calm" : "gale";
}

/** The keeper with the fewest open unpinned cups. A tie keeps the roster order. */
export function fairKeeper(cards: readonly AnemoCup[], roster: string): string {
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

export function readCups(raw: unknown): AnemoCup[] {
  if (!Array.isArray(raw)) return [];
  const out: AnemoCup[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AnemoCup>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      bearing: bearingOf(row.bearing),
      watch: anemoWatch(row.watch),
      lacquer: lacquerOf(row.lacquer),
      vane: vaneOf(row.vane),
      bead: anemoBead(row.bead) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      paused: row.paused === true,
      sealed: row.sealed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addCup(
  cards: readonly AnemoCup[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    bearing?: string;
    watch?: unknown;
    lacquer?: string;
    vane?: string;
    bead?: unknown;
    tags?: string;
  },
): AnemoCup[] {
  const current = readCups(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: AnemoCup = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    bearing: bearingOf(card.bearing),
    watch: anemoWatch(card.watch),
    lacquer: lacquerOf(card.lacquer),
    vane: vaneOf(card.vane),
    bead: anemoBead(card.bead) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly AnemoCup[], id: string, change: (card: AnemoCup) => AnemoCup): AnemoCup[] {
  return readCups(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly AnemoCup[], ids: readonly string[], change: (card: AnemoCup) => AnemoCup): AnemoCup[] {
  const picked = new Set(ids);
  return readCups(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editCup(cards: readonly AnemoCup[], id: string, title: string): AnemoCup[] {
  const next = lineOf(title);
  if (!next) return readCups(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCupNote(cards: readonly AnemoCup[], id: string, note: string): AnemoCup[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setCupPin(cards: readonly AnemoCup[], id: string, pinned: boolean): AnemoCup[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setCupStay(cards: readonly AnemoCup[], id: string, paused: boolean): AnemoCup[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setCupStow(cards: readonly AnemoCup[], id: string, sealed: boolean): AnemoCup[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setCupStar(cards: readonly AnemoCup[], id: string, flagged: boolean): AnemoCup[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setCupLacquer(cards: readonly AnemoCup[], id: string, lacquer: unknown): AnemoCup[] {
  const next = lacquerOf(lacquer);
  if (!next) return readCups(cards);
  return mapCard(cards, id, (card) => (card.lacquer === next ? card : { ...card, lacquer: next, audit: "lacquer" }));
}

/** Vane steps north, east, south, then north again. A blank vane starts at north. */
export function cycleVane(cards: readonly AnemoCup[], id: string): AnemoCup[] {
  return mapCard(cards, id, (card) => {
    const at = VANES.indexOf(card.vane as (typeof VANES)[number]);
    const next = at < 0 ? VANES[0] : VANES[(at + 1) % VANES.length];
    return next === card.vane ? card : { ...card, vane: next, audit: "vane" };
  });
}

export function addCupTag(cards: readonly AnemoCup[], id: string, tag: string): AnemoCup[] {
  const next = tagsOf(tag)[0];
  if (!next) return readCups(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank watch becomes 15, 15 becomes 30, and 30 becomes 60. A watch of 60 stays. */
export function lengthenWatch(cards: readonly AnemoCup[], id: string): AnemoCup[] {
  return mapCard(cards, id, (card) => {
    if (card.watch === 60) return card;
    const next = card.watch === 30 ? 60 : card.watch === 15 ? 30 : 15;
    return { ...card, watch: next, audit: "watch" };
  });
}

/** A blank watch becomes 60, 60 becomes 30, and 30 becomes 15. A watch of 15 stays. */
export function shortenWatch(cards: readonly AnemoCup[], id: string): AnemoCup[] {
  return mapCard(cards, id, (card) => {
    if (card.watch === 15) return card;
    const next = card.watch === 30 ? 15 : card.watch === 60 ? 30 : 60;
    return { ...card, watch: next, audit: "short" };
  });
}

export function raiseBead(cards: readonly AnemoCup[], id: string): AnemoCup[] {
  return mapCard(cards, id, (card) => {
    const at = beadIndex(card.bead);
    if (at < 0) return { ...card, bead: 2, audit: "bead" };
    if (at === BEAD_CYCLE.length - 1) return card;
    return { ...card, bead: BEAD_CYCLE[at + 1], audit: "bead" };
  });
}

export function lowerBead(cards: readonly AnemoCup[], id: string): AnemoCup[] {
  return mapCard(cards, id, (card) => {
    const at = beadIndex(card.bead);
    if (at <= 0) return card;
    return { ...card, bead: BEAD_CYCLE[at - 1], audit: "bead" };
  });
}

export function bulkCupPin(cards: readonly AnemoCup[], ids: readonly string[]): AnemoCup[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkCupStow(cards: readonly AnemoCup[], ids: readonly string[]): AnemoCup[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkCupEast(cards: readonly AnemoCup[], ids: readonly string[]): AnemoCup[] {
  return touchIds(cards, ids, (card) => ({ ...card, vane: "east", audit: "vane" }));
}

export function bulkCupChampagne(cards: readonly AnemoCup[], ids: readonly string[]): AnemoCup[] {
  return touchIds(cards, ids, (card) => ({ ...card, lacquer: "CHAMPAGNE", audit: "lacquer" }));
}

export function bulkCupTag(cards: readonly AnemoCup[], ids: readonly string[], tag: string): AnemoCup[] {
  const next = tagsOf(tag)[0];
  if (!next) return readCups(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly AnemoCup[], ids: readonly string[], index: number, change: (list: readonly AnemoCup[], id: string) => AnemoCup[]): AnemoCup[] {
  const id = ids[index];
  return id ? change(cards, id) : readCups(cards);
}

export function lengthenWatchFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  return focused(cards, ids, index, lengthenWatch);
}

export function shortenWatchFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  return focused(cards, ids, index, shortenWatch);
}

export function vaneFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  return focused(cards, ids, index, cycleVane);
}

export function raiseBeadFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  return focused(cards, ids, index, raiseBead);
}

export function lowerBeadFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  return focused(cards, ids, index, lowerBead);
}

export function pinCupFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  const id = ids[index];
  if (!id) return readCups(cards);
  const card = readCups(cards).find((item) => item.id === id);
  return card ? setCupPin(cards, id, !card.pinned) : readCups(cards);
}

export function stayCupFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  const id = ids[index];
  if (!id) return readCups(cards);
  const card = readCups(cards).find((item) => item.id === id);
  return card ? setCupStay(cards, id, !card.paused) : readCups(cards);
}

export function starCupFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number): AnemoCup[] {
  const id = ids[index];
  if (!id) return readCups(cards);
  const card = readCups(cards).find((item) => item.id === id);
  return card ? setCupStar(cards, id, !card.flagged) : readCups(cards);
}

export function tagCupFocused(cards: readonly AnemoCup[], ids: readonly string[], index: number, tag: string): AnemoCup[] {
  const id = ids[index];
  return id ? addCupTag(cards, id, tag) : readCups(cards);
}

export function readCupViews(raw: unknown): CupView[] {
  if (!Array.isArray(raw)) return [];
  const out: CupView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CupView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      lacquer: activeLacquer(row.lacquer),
      vane: activeVane(row.vane, VANES),
      bearing: activeBearing(row.bearing),
      watch: activeWatch(row.watch),
      bead: activeBead(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCupView(
  views: readonly CupView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    lacquer?: string;
    vane?: string;
    bearing?: string;
    watch?: string;
    bead?: string;
  },
): CupView[] {
  const current = readCupViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: CupView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    lacquer: activeLacquer(view.lacquer),
    vane: activeVane(view.vane, VANES),
    bearing: activeBearing(view.bearing),
    watch: activeWatch(view.watch),
    bead: activeBead(view.bead),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCupView(views: readonly CupView[], id: string): CupView[] {
  return readCupViews(views).filter((view) => view.id !== id);
}

export function cupDensity(raw: unknown): CupDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A cup more than two bearings behind the desk, at bead 2, is late. */
export function lateCup(card: AnemoCup, deskBearing: unknown): boolean {
  const gap = bearingGap(card.bearing, deskBearing);
  return card.bead === 2 && gap !== null && gap > 2;
}

export function idleCup(card: AnemoCup): boolean {
  return card.vane === "north" && stillBearing(card.bearing) && card.bead === 2;
}

export function briskCup(card: AnemoCup): boolean {
  return card.bead === 8 && card.vane === "east" && keenBearing(card.bearing);
}

export function restingCup(card: AnemoCup): boolean {
  return card.watch === 60 && card.vane === "south" && card.bearing === "storm";
}

/** A fifteen-minute watch on a keen bearing is overdue unless the cup is pinned. */
export function overdueCup(card: AnemoCup): boolean {
  return card.watch === 15 && keenBearing(card.bearing) && !card.pinned;
}

export function visibleCups(
  cards: readonly AnemoCup[],
  tray: CupTray,
  query: string,
  keeper: string,
  lacquer: string,
  vane: string,
  bearing: string,
  watch: string,
  bead: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): AnemoCup[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const lacquerOn = lacquer === "all" ? "" : lacquerOf(lacquer);
  const vaneOn = vane === "all" ? "" : vaneOf(vane);
  const bearingOn = bearing === "all" ? "" : activeBearing(bearing);
  const watchOn = watch === "all" ? "" : activeWatch(watch);
  const beadOn = bead === "all" ? "" : activeBead(bead);
  return readCups(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (lacquerOn && card.lacquer !== lacquerOn) return false;
    if (vaneOn && card.vane !== vaneOn) return false;
    if (bearingOn === "keen" && !keenBearing(card.bearing)) return false;
    if (bearingOn === "still" && !stillBearing(card.bearing)) return false;
    if (bearingOn && bearingOn !== "keen" && bearingOn !== "still" && card.bearing !== bearingOn) return false;
    if (watchOn && String(card.watch ?? "") !== watchOn) return false;
    if (beadOn && String(card.bead) !== beadOn) return false;
    if (houseOnly && !houseLacquer(card.lacquer)) return false;
    if (keenOnly && !keenBearing(card.bearing)) return false;
    if (stillOnly && !stillBearing(card.bearing)) return false;
    return true;
  });
}

export function sortCups(cards: readonly AnemoCup[], sort: CupSort): AnemoCup[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const bearing = (bearingIndex(a.bearing) < 0 ? 99 : bearingIndex(a.bearing)) - (bearingIndex(b.bearing) < 0 ? 99 : bearingIndex(b.bearing));
    if (bearing) return bearing;
    return a.title.localeCompare(b.title);
  });
}

export function cupCounts(cards: readonly AnemoCup[], shown: readonly AnemoCup[], deskBearing: unknown): CupCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    keen: open.filter((card) => keenBearing(card.bearing)).length,
    still: open.filter((card) => stillBearing(card.bearing)).length,
    soon: open.filter((card) => card.watch === 15).length,
    bead: open.reduce((sum, card) => sum + card.bead, 0),
    house: open.filter((card) => houseLacquer(card.lacquer)).length,
    watch: open.filter((card) => card.watch !== null).length,
    matched: shown.filter((card) => card.bearing && card.bearing === bearingOf(deskBearing)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleCup(card)).length,
    brisk: open.filter((card) => briskCup(card)).length,
    resting: open.filter((card) => restingCup(card)).length,
    overdue: open.filter((card) => overdueCup(card)).length,
  };
}

export function clashBearingCount(cards: readonly AnemoCup[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.bearing);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.bearing === card.bearing && other.bead === card.bead)).length;
}

export function neighborBeadCount(cards: readonly AnemoCup[]): number {
  const open = cards.filter((card) => inTray(card, "open") && beadIndex(card.bead) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(beadIndex(other.bead) - beadIndex(card.bead));
    const ring = Math.min(gap, BEAD_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly AnemoCup[]): string {
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

export function reminderCups(cards: readonly AnemoCup[]): AnemoCup[] {
  return cards.filter((card) => inTray(card, "open") && (card.watch === 15 || card.watch === 30));
}

export function idleCups(cards: readonly AnemoCup[]): AnemoCup[] {
  return cards.filter((card) => inTray(card, "open") && idleCup(card));
}

export function cupTimeline(cards: readonly AnemoCup[]): { bead: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return BEAD_CYCLE.map((bead) => ({ bead, titles: open.filter((card) => card.bead === bead).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function cupBars(cards: readonly AnemoCup[]): { bearing: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return ANEMO_BEARINGS.map((bearing) => ({ bearing, count: open.filter((card) => card.bearing === bearing).length }));
}

export function cupKeepers(cards: readonly AnemoCup[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function cupCopy(card: AnemoCup): string {
  return [card.title, card.keeper, card.bearing, card.lacquer, card.vane, card.watch ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function cupShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function cupCsv(cards: readonly AnemoCup[], deskBearing: unknown): string {
  const lines = ["title,keeper,bearing,lacquer,vane,watch,bead,tags,pinned,paused,sealed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readCups(cards)) {
    const gap = bearingGap(card.bearing, deskBearing);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.bearing,
      card.lacquer,
      card.vane,
      card.watch === null ? "" : String(card.watch),
      String(card.bead),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCup(card, deskBearing) ? "1" : "0",
      idleCup(card) ? "1" : "0",
      keenBearing(card.bearing) ? "1" : "0",
      stillBearing(card.bearing) ? "1" : "0",
      houseLacquer(card.lacquer) ? "1" : "0",
      bearingBand(card.bearing),
      briskCup(card) ? "1" : "0",
      restingCup(card) ? "1" : "0",
      overdueCup(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function retentionRecord(raw: RetentionValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: RetentionValue): boolean {
  const row = retentionRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type RetentionParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function retentionText(raw: RetentionValue): string {
  if (hasBlocked(raw)) return "";
  const row = retentionRecord(raw);
  if (row && !("retentionStatus" in row) && !("code" in row)) return "";
  return row ? clip(row.retentionStatus ?? row.code, 32) : clip(raw, 32);
}

function retentionParts(raw: RetentionValue): RetentionParts | null {
  const text = retentionText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked money field clears the plate. A real retention status is set. A blank or broken status is clear. */
export function retentionState(raw: RetentionValue): RetentionState {
  if (hasBlocked(raw)) return "";
  const row = retentionRecord(raw);
  if (row && !("retentionStatus" in row) && !("code" in row)) return "";
  return retentionParts(raw) ? "set" : "clear";
}

/** ACTIVE is a grove, VIP is a court, a separator is a verge, and a plain word is shade. */
export function retentionLane(raw: RetentionValue): RetentionLane {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "active") return "grove";
  if (key === "vip") return "court";
  if (parts.seps >= 1) return "verge";
  return "shade";
}

/** The first two letters. */
export function retentionStamp(raw: RetentionValue): string {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** ACTIVE is champagne, VIP is graphite, and other statuses follow the last letter. */
export function retentionHue(raw: RetentionValue): RetentionHue {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  if (!parts) return "";
  const lane = retentionLane(raw);
  if (lane === "grove") return "champagne";
  if (lane === "court") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function retentionTwin(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function retentionWide(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function retentionNotch(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function retentionEcho(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function retentionLeap(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function retentionSlash(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function retentionKnown(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function retentionCap(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function retentionTail(raw: RetentionValue): boolean {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function retentionScore(raw: RetentionValue): number {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return parts ? parts.score : 0;
}

export function retentionStep(raw: RetentionValue): number {
  const parts = retentionState(raw) === "set" ? retentionParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function retentionLanes(rows: readonly RetentionRow[]): RetentionLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = retentionLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRetention(rows: readonly RetentionRow[]): string {
  const bars = retentionLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingRetentionHue(rows: readonly RetentionRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = retentionHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedRetentionCount(rows: readonly RetentionRow[]): number {
  const marks = rows.map((row) => retentionStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneRetentionCount(rows: readonly RetentionRow[], lane: RetentionLane): number {
  return rows.filter((row) => retentionLane(row.note) === lane).length;
}

export function retentionShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRetentionLanes(rows: readonly RetentionRow[]): string[] {
  return retentionLanes(rows).map((line) => line.lane);
}

export function readHiddenRetentions(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRetentions(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRetention(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRetentionReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRetentionReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRetentionLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleRetentions(
  rows: readonly RetentionRow[],
  lane: string,
  hue: string,
  query: string,
  review: RetentionReview,
  reviewed: readonly string[],
  shape: RetentionShape,
): RetentionRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (retentionState(row.note) === "") return false;
    const found = retentionLane(row.note);
    const hueName = retentionHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${retentionText(row.note)} ${retentionStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "grove" && found !== "grove") return false;
    if (shape === "court" && found !== "court") return false;
    if (shape === "shade" && found !== "shade") return false;
    if (shape === "verge" && found !== "verge") return false;
    if (shape === "wide" && !retentionWide(row.note)) return false;
    if (shape === "notch" && !retentionNotch(row.note)) return false;
    if (shape === "leap" && !retentionLeap(row.note)) return false;
    if (shape === "slash" && !retentionSlash(row.note)) return false;
    if (shape === "twin" && !retentionTwin(row.note)) return false;
    if (shape === "known" && !retentionKnown(row.note)) return false;
    if (shape === "echo" && !retentionEcho(row.note)) return false;
    return true;
  });
}

export function retentionCopy(raw: RetentionValue): string {
  return [retentionStamp(raw), retentionLane(raw), retentionHue(raw)].filter(Boolean).join(" ");
}

export function retentionLanesCsv(rows: readonly RetentionRow[]): string {
  const lines = ["lane,count"];
  for (const line of retentionLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function retentionRowsCsv(rows: readonly RetentionRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (retentionState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(retentionText(row.note)),
      retentionStamp(row.note),
      retentionLane(row.note),
      retentionHue(row.note),
      String(retentionStep(row.note)),
      retentionEcho(row.note) ? "1" : "0",
      retentionWide(row.note) ? "1" : "0",
      retentionNotch(row.note) ? "1" : "0",
      retentionLeap(row.note) ? "1" : "0",
      retentionSlash(row.note) ? "1" : "0",
      retentionTwin(row.note) ? "1" : "0",
      retentionKnown(row.note) ? "1" : "0",
      retentionCap(row.note) ? "1" : "0",
      retentionTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
