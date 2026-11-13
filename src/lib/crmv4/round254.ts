/**
 * Parcel slips for a document handoff book, and language ribbons already stored on a trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_parcel_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   courier text not null default '',
 *   watch text not null default '',
 *   cloth text not null default '',
 *   pace text not null default '',
 *   span_min integer,
 *   rank_no integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   waiting boolean not null default false,
 *   filed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_language_ribbon_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_language_ribbon_review (
 *   trader_id text primary key
 * );
 */

export const PSL_KEY = "crmv4-parcel-slip";
export const PSL_VIEW_KEY = "crmv4-parcel-views";
export const PSL_DENSITY_KEY = "crmv4-parcel-density";
export const LRB_KEY = "crmv4-ribbon-hide";
export const LRB_REVIEW_KEY = "crmv4-ribbon-review";

export const PARCEL_WATCHES = ["matins", "lauds", "prime", "terce", "sext", "compline"] as const;

export type ParcelWatch = (typeof PARCEL_WATCHES)[number];

export type ClothName = "blank" | "linen" | "wool" | "silk";

export type PaceName = "blank" | "walk" | "trot" | "canter";

export type ParcelTray = "open" | "held" | "shelved";

export type ParcelDensity = "airy" | "tight";

export type ParcelSort = "watch" | "courier";

export type ParcelSlip = {
  id: string;
  title: string;
  note: string;
  courier: string;
  watch: string;
  span: number | null;
  cloth: string;
  pace: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  shelved: boolean;
  flagged: boolean;
  audit: string;
};

export type ParcelView = {
  id: string;
  name: string;
  tray: ParcelTray;
  query: string;
  courier: string;
  cloth: string;
  pace: string;
  watch: string;
  span: string;
  rank: string;
};

export type ParcelCounts = {
  open: number;
  held: number;
  shelved: number;
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
  rush: number;
  resting: number;
  overdue: number;
};

export type RibbonLane = "" | "house" | "phrase" | "pair" | "locale" | "code" | "essay" | "cipher" | "plain";

export type RibbonHue = "" | "ivory" | "graphite" | "champagne" | "ink" | "vellum" | "ash";

export type RibbonState = "" | "clear" | "set";

export type RibbonShape = "all" | "house" | "phrase" | "pair" | "locale" | "code" | "essay" | "cipher" | "wide" | "notch";

export type RibbonReview = "all" | "reviewed" | "fresh";

export type RibbonValue = string | { language?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type RibbonRow = { id: string; label: string; note: RibbonValue };

export type RibbonLaneLine = { lane: string; count: number };

export const ROUND254_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "wait",
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
  "fair-courier",
  "viewer",
  "suggest",
  "sla",
  "ribbons",
  "ribbon-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "shelve", "open", "cloth", "tag", "rank", "span", "short", "flag"] as const;

const CLOTHS = ["linen", "wool", "silk"] as const;

const PACES = ["walk", "trot", "canter"] as const;

const PACE_CYCLE = ["walk", "trot", "canter"] as const;

const SPAN_CYCLE = [20, 40, 80] as const;

const RANK_CYCLE = [2, 4, 6, 8] as const;

const PEAK = new Set(["matins", "sext"]);

const QUIET = new Set(["terce", "compline"]);

const HOUSE = new Set(["LINEN", "WOOL"]);

const EARLY = new Set(["matins", "lauds"]);

const MID = new Set(["prime", "terce"]);

const LATE = new Set(["sext", "compline"]);

const LANE_ORDER = ["house", "phrase", "pair", "locale", "code", "essay", "cipher", "plain"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne", "ink", "vellum", "ash"] as const;

const TONGUES = new Set(["EN", "TR", "DE", "RU", "AR"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 36;

const VIEW_CAP = 6;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ParcelTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abcd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: ParcelSlip, tray: ParcelTray): boolean {
  if (tray === "held") return card.held && !card.shelved;
  if (tray === "shelved") return card.shelved;
  return !card.held && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(watch: string): number {
  return PARCEL_WATCHES.indexOf(watch as ParcelWatch);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function parcelLine(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank note stays blank. It is not filled in. */
export function parcelNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A watch outside the six hours is left blank. */
export function watchOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PARCEL_WATCHES as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 20, 40, or 80 minutes. Anything else stays blank. */
export function parcelSpanOf(raw: unknown): 20 | 40 | 80 | null {
  const value = Number(clip(raw, 2));
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 20 | 40 | 80) : null;
}

/** Rank is 2, 4, 6, or 8. Anything else stays blank. */
export function parcelRankOf(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Cloth is linen, wool, or silk. The saved cloth is LINEN, WOOL, or SILK. */
export function clothOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "linen") return "LINEN";
  if (text === "wool") return "WOOL";
  if (text === "silk") return "SILK";
  return "";
}

/** Pace is walk, trot, or canter. A blank pace stays blank. */
export function paceOf(raw: unknown): string {
  return paceName(raw);
}

export function peakWatch(watch: unknown): boolean {
  return PEAK.has(watchOf(watch));
}

export function quietWatch(watch: unknown): boolean {
  return QUIET.has(watchOf(watch));
}

/** Early is matins and lauds. Mid is prime and terce. Late is sext and compline. */
export function watchBand(watch: unknown): "early" | "mid" | "late" | "" {
  const name = watchOf(watch);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the slip watch to the desk watch. A blank watch has no gap. */
export function watchGap(cardWatch: unknown, deskWatch: unknown): number | null {
  const from = watchIndex(watchOf(cardWatch));
  const to = watchIndex(watchOf(deskWatch));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

export function activeWatch(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return watchOf(text) || "all";
}

export function activeParcelSpan(raw: unknown): string {
  const value = parcelSpanOf(raw);
  return value === null ? "all" : String(value);
}

export function activePace(raw: unknown, paces: readonly string[]): string {
  const pace = paceOf(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeParcelRank(raw: unknown): string {
  const value = parcelRankOf(raw);
  return value === null ? "all" : String(value);
}

export function activeCloth(raw: unknown): string {
  const name = clothName(raw);
  return name || "all";
}

export function moveParcelFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The cloth used most often. A tie, or an empty book, keeps linen. */
export function suggestCloth(cards: readonly ParcelSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.cloth) continue;
    counts.set(card.cloth, (counts.get(card.cloth) || 0) + 1);
  }
  let best = "LINEN";
  let score = 0;
  for (const cloth of ["LINEN", "WOOL", "SILK"]) {
    const count = counts.get(cloth) || 0;
    if (count > score) {
      best = cloth;
      score = count;
    }
  }
  return best;
}

/** A morning desk asks for a short SLA. An evening desk asks for a long one. Saved spans win when any exist. */
export function suggestWatch(cards: readonly ParcelSlip[], hour: number): 20 | 40 | 80 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 20 | 40 | 80 | null = null;
  let score = 0;
  for (const span of SPAN_CYCLE) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 11) return 20;
  if (hour < 17) return 40;
  return 80;
}

/** The courier with the fewest open slips. A tie keeps the roster order. */
export function fairCourier(cards: readonly ParcelSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.courier.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readParcels(raw: unknown): ParcelSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: ParcelSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ParcelSlip>;
    const id = clip(row.id, 40);
    const title = parcelLine(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: parcelNote(row.note),
      courier: clip(row.courier, 24),
      watch: watchOf(row.watch),
      span: parcelSpanOf(row.span),
      cloth: clothOf(row.cloth),
      pace: paceOf(row.pace),
      rank: parcelRankOf(row.rank) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      shelved: row.shelved === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addParcel(
  cards: readonly ParcelSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    courier?: string;
    watch?: string;
    span?: unknown;
    cloth?: string;
    pace?: string;
    rank?: unknown;
    tags?: string;
  },
): ParcelSlip[] {
  const current = readParcels(cards);
  const id = clip(card.id, 40);
  const title = parcelLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ParcelSlip = {
    id,
    title,
    note: parcelNote(card.note),
    courier: clip(card.courier, 24),
    watch: watchOf(card.watch),
    span: parcelSpanOf(card.span),
    cloth: clothOf(card.cloth),
    pace: paceOf(card.pace),
    rank: parcelRankOf(card.rank) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly ParcelSlip[], id: string, change: (card: ParcelSlip) => ParcelSlip): ParcelSlip[] {
  return readParcels(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly ParcelSlip[], ids: readonly string[], change: (card: ParcelSlip) => ParcelSlip): ParcelSlip[] {
  const picked = new Set(ids);
  return readParcels(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editParcel(cards: readonly ParcelSlip[], id: string, title: string): ParcelSlip[] {
  const next = parcelLine(title);
  if (!next) return readParcels(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editParcelNote(cards: readonly ParcelSlip[], id: string, note: string): ParcelSlip[] {
  const next = parcelNote(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setParcelPin(cards: readonly ParcelSlip[], id: string, pinned: boolean): ParcelSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setParcelWait(cards: readonly ParcelSlip[], id: string, held: boolean): ParcelSlip[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, shelved: held ? false : card.shelved, audit: held ? "hold" : "resume" }));
}

export function setParcelFile(cards: readonly ParcelSlip[], id: string, shelved: boolean): ParcelSlip[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, held: shelved ? false : card.held, audit: shelved ? "shelve" : "open" }));
}

export function setParcelStar(cards: readonly ParcelSlip[], id: string, flagged: boolean): ParcelSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setParcelCloth(cards: readonly ParcelSlip[], id: string, cloth: unknown): ParcelSlip[] {
  const next = clothOf(cloth);
  if (!next) return readParcels(cards);
  return mapCard(cards, id, (card) => (card.cloth === next ? card : { ...card, cloth: next, audit: "cloth" }));
}

/** Pace steps walk, trot, canter, then walk again. A blank pace starts at walk. */
export function cyclePace(cards: readonly ParcelSlip[], id: string): ParcelSlip[] {
  return mapCard(cards, id, (card) => {
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    return next === card.pace ? card : { ...card, pace: next, audit: "pace" };
  });
}

export function addParcelTag(cards: readonly ParcelSlip[], id: string, tag: string): ParcelSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readParcels(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 20, 20 becomes 40, and 40 becomes 80. A span of 80 stays. */
export function lengthenWatch(cards: readonly ParcelSlip[], id: string): ParcelSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 80) return card;
    const next = card.span === 40 ? 80 : card.span === 20 ? 40 : 20;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 80, 80 becomes 40, and 40 becomes 20. A span of 20 stays. */
export function shortenWatch(cards: readonly ParcelSlip[], id: string): ParcelSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 20) return card;
    const next = card.span === 40 ? 20 : card.span === 80 ? 40 : 80;
    return { ...card, span: next, audit: "short" };
  });
}

/** Rank steps 2, 4, 6, 8. A blank rank starts at 2. Rank 8 stays. */
export function raiseParcelRank(cards: readonly ParcelSlip[], id: string): ParcelSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.rank === 8) return card;
    const next = card.rank === 6 ? 8 : card.rank === 4 ? 6 : card.rank === 2 ? 4 : 2;
    return { ...card, rank: next, audit: "rank" };
  });
}

/** Rank steps 8, 6, 4, 2. A blank rank starts at 8. Rank 2 stays. */
export function lowerParcelRank(cards: readonly ParcelSlip[], id: string): ParcelSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.rank === 2) return card;
    const next = card.rank === 4 ? 2 : card.rank === 6 ? 4 : card.rank === 8 ? 6 : 8;
    return { ...card, rank: next, audit: "rank" };
  });
}

function focusedCard(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip | undefined {
  const id = shownIds[index];
  return id ? readParcels(cards).find((card) => card.id === id) : undefined;
}

export function pinFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readParcels(cards);
  return setParcelPin(cards, card.id, !card.pinned);
}

export function waitFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readParcels(cards);
  return setParcelWait(cards, card.id, !card.held);
}

export function paceFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const id = shownIds[index];
  return id ? cyclePace(cards, id) : readParcels(cards);
}

export function starFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readParcels(cards);
  return setParcelStar(cards, card.id, !card.flagged);
}

export function tagFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number, tag: string): ParcelSlip[] {
  const id = shownIds[index];
  return id ? addParcelTag(cards, id, tag) : readParcels(cards);
}

export function raiseFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const id = shownIds[index];
  return id ? raiseParcelRank(cards, id) : readParcels(cards);
}

export function lowerFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const id = shownIds[index];
  return id ? lowerParcelRank(cards, id) : readParcels(cards);
}

export function lengthenFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const id = shownIds[index];
  return id ? lengthenWatch(cards, id) : readParcels(cards);
}

export function shortenFocusedParcel(cards: readonly ParcelSlip[], shownIds: readonly string[], index: number): ParcelSlip[] {
  const id = shownIds[index];
  return id ? shortenWatch(cards, id) : readParcels(cards);
}

export function bulkParcelPin(cards: readonly ParcelSlip[], ids: readonly string[]): ParcelSlip[] {
  return touchIds(cards, ids, (card) => (card.pinned ? card : { ...card, pinned: true, audit: "pin" }));
}

export function bulkParcelFile(cards: readonly ParcelSlip[], ids: readonly string[]): ParcelSlip[] {
  return touchIds(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, held: false, audit: "shelve" }));
}

export function bulkParcelCanter(cards: readonly ParcelSlip[], ids: readonly string[]): ParcelSlip[] {
  return touchIds(cards, ids, (card) => (card.pace === "canter" ? card : { ...card, pace: "canter", audit: "pace" }));
}

export function bulkParcelTag(cards: readonly ParcelSlip[], ids: readonly string[], tag: string): ParcelSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readParcels(cards);
  return touchIds(cards, ids, (card) => (card.tags.includes(next) || card.tags.length >= TAG_CAP ? card : { ...card, tags: [...card.tags, next], audit: "tag" }));
}

export function bulkParcelSilk(cards: readonly ParcelSlip[], ids: readonly string[]): ParcelSlip[] {
  return touchIds(cards, ids, (card) => (card.cloth === "SILK" ? card : { ...card, cloth: "SILK", audit: "cloth" }));
}

export function readParcelViews(raw: unknown): ParcelView[] {
  if (!Array.isArray(raw)) return [];
  const out: ParcelView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ParcelView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      courier: clip(row.courier, 24),
      cloth: activeCloth(row.cloth),
      pace: activePace(row.pace, PACES),
      watch: activeWatch(row.watch),
      span: activeParcelSpan(row.span),
      rank: activeParcelRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addParcelView(
  views: readonly ParcelView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    courier?: string;
    cloth?: string;
    pace?: string;
    watch?: string;
    span?: string;
    rank?: string;
  },
): ParcelView[] {
  const current = readParcelViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: ParcelView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    courier: clip(view.courier, 24),
    cloth: activeCloth(view.cloth),
    pace: activePace(view.pace, PACES),
    watch: activeWatch(view.watch),
    span: activeParcelSpan(view.span),
    rank: activeParcelRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropParcelView(views: readonly ParcelView[], id: string): ParcelView[] {
  return readParcelViews(views).filter((view) => view.id !== id);
}

export function parcelDensity(raw: unknown): ParcelDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than two watches behind the desk, at rank 2, is late. */
export function lateParcel(card: ParcelSlip, deskWatch: unknown): boolean {
  const gap = watchGap(card.watch, deskWatch);
  return card.rank === 2 && gap !== null && gap > 2;
}

export function idleParcel(card: ParcelSlip): boolean {
  return card.pace === "walk" && quietWatch(card.watch) && card.rank === 2;
}

export function rushParcel(card: ParcelSlip): boolean {
  return card.rank === 8 && card.pace === "canter" && peakWatch(card.watch);
}

export function restingParcel(card: ParcelSlip): boolean {
  return card.span === 80 && card.pace === "trot" && !card.flagged;
}

/** A twenty-minute SLA on a peak watch is overdue unless the slip is pinned. */
export function overdueParcel(card: ParcelSlip): boolean {
  return card.span === 20 && peakWatch(card.watch) && !card.pinned;
}

export function visibleParcels(
  cards: readonly ParcelSlip[],
  tray: ParcelTray,
  query: string,
  courier: string,
  cloth: string,
  pace: string,
  watch: string,
  span: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): ParcelSlip[] {
  const text = query.trim().toLowerCase();
  const courierOn = courier === "all" ? "" : courier.trim().toLowerCase();
  const clothOn = cloth === "all" ? "" : clothOf(cloth);
  const paceOn = pace === "all" ? "" : paceOf(pace);
  const watchOn = watch === "all" ? "" : activeWatch(watch);
  const spanOn = span === "all" ? "" : activeParcelSpan(span);
  const rankOn = rank === "all" ? "" : activeParcelRank(rank);
  return readParcels(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (courierOn && card.courier.toLowerCase() !== courierOn) return false;
    if (clothOn && card.cloth !== clothOn) return false;
    if (paceOn && card.pace !== paceOn) return false;
    if (watchOn === "peak" && !peakWatch(card.watch)) return false;
    if (watchOn === "quiet" && !quietWatch(card.watch)) return false;
    if (watchOn && watchOn !== "peak" && watchOn !== "quiet" && card.watch !== watchOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseCloth(card.cloth)) return false;
    if (peakOnly && !peakWatch(card.watch)) return false;
    if (quietOnly && !quietWatch(card.watch)) return false;
    return true;
  });
}

export function sortParcels(cards: readonly ParcelSlip[], sort: ParcelSort): ParcelSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "courier") {
      const courier = a.courier.localeCompare(b.courier);
      if (courier) return courier;
    }
    const watch = (watchIndex(a.watch) < 0 ? 99 : watchIndex(a.watch)) - (watchIndex(b.watch) < 0 ? 99 : watchIndex(b.watch));
    if (watch) return watch;
    return a.title.localeCompare(b.title);
  });
}

export function parcelCounts(cards: readonly ParcelSlip[], shown: readonly ParcelSlip[], deskWatch: unknown): ParcelCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    shelved: cards.filter((card) => inTray(card, "shelved")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakWatch(card.watch)).length,
    quiet: open.filter((card) => quietWatch(card.watch)).length,
    soon: open.filter((card) => card.span === 20).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseCloth(card.cloth)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: open.filter((card) => card.watch && card.watch === watchOf(deskWatch)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleParcel(card)).length,
    rush: open.filter((card) => rushParcel(card)).length,
    resting: open.filter((card) => restingParcel(card)).length,
    overdue: open.filter((card) => overdueParcel(card)).length,
  };
}

export function clashWatchCount(cards: readonly ParcelSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.watch);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.watch === card.watch && other.rank === card.rank)).length;
}

export function neighborParcelCount(cards: readonly ParcelSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestCourier(cards: readonly ParcelSlip[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.courier);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.courier.toLowerCase() === card.courier.toLowerCase()).length;
    if (count > score) {
      best = card.courier;
      score = count;
    }
  }
  return best;
}

export function reminderParcels(cards: readonly ParcelSlip[]): ParcelSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.span === 20 || card.span === 40));
}

export function idleParcels(cards: readonly ParcelSlip[]): ParcelSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleParcel(card));
}

export function parcelTimeline(cards: readonly ParcelSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function parcelBars(cards: readonly ParcelSlip[]): { watch: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return PARCEL_WATCHES.map((watch) => ({ watch, count: open.filter((card) => card.watch === watch).length }));
}

export function parcelCouriers(cards: readonly ParcelSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.courier || out.some((item) => item.toLowerCase() === card.courier.toLowerCase())) continue;
    out.push(card.courier);
  }
  return out;
}

export function parcelCopy(card: ParcelSlip): string {
  return [card.title, card.courier, card.watch, card.cloth, card.pace, card.span ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function parcelShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function parcelCsv(cards: readonly ParcelSlip[], deskWatch: unknown): string {
  const lines = ["title,courier,watch,cloth,pace,span,rank,tags,pinned,waiting,filed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readParcels(cards)) {
    const gap = watchGap(card.watch, deskWatch);
    lines.push([
      csvCell(card.title),
      csvCell(card.courier),
      card.watch,
      card.cloth,
      card.pace,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.shelved ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateParcel(card, deskWatch) ? "1" : "0",
      idleParcel(card) ? "1" : "0",
      peakWatch(card.watch) ? "1" : "0",
      quietWatch(card.watch) ? "1" : "0",
      houseCloth(card.cloth) ? "1" : "0",
      watchBand(card.watch),
      rushParcel(card) ? "1" : "0",
      restingParcel(card) ? "1" : "0",
      overdueParcel(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function ribbonRecord(raw: RibbonValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function ribbonText(raw: RibbonValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = ribbonRecord(raw);
  if (!row || !("language" in row)) return "";
  return clip(row.language, 32);
}

function hasBlocked(raw: RibbonValue): boolean {
  const row = ribbonRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

/** A language of two to twenty-four marks. Money fields and other objects stay blank. */
function ribbonName(raw: RibbonValue): string {
  if (hasBlocked(raw)) return "";
  const row = ribbonRecord(raw);
  if (row && !("language" in row)) return "";
  const text = ribbonText(raw).replace(/\s+/g, " ").trim();
  if (!/^[A-Za-z][A-Za-z0-9 /'_-]{1,23}$/.test(text)) return "";
  return text;
}

/** A blocked field clears the ribbon. A language of two to twenty-four marks is set. */
export function ribbonState(raw: RibbonValue): RibbonState {
  if (hasBlocked(raw)) return "";
  const row = ribbonRecord(raw);
  if (row && !("language" in row)) return "";
  return ribbonName(raw) ? "set" : "clear";
}

/** The first letter, the last letter, and the letter count. en is EN2. */
export function ribbonStamp(raw: RibbonValue): string {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  if (!name) return "";
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (compact.length < 2) return "";
  return `${compact.slice(0, 1)}${compact.slice(-1)}${compact.length}`;
}

/** Desk tongues are the house. A digit is a cipher. A hyphen or underscore is a locale. */
export function ribbonLane(raw: RibbonValue): RibbonLane {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  if (!name) return "";
  const words = name.split(/\s+/).filter(Boolean);
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (words.length === 1 && TONGUES.has(compact) && compact === name.toUpperCase() && !/[-_\d]/.test(name)) return "house";
  if (/\d/.test(name)) return "cipher";
  if (name.includes("-") || name.includes("_")) return "locale";
  if (words.length >= 3) return "phrase";
  if (words.length === 2) return "pair";
  if (name.length <= 3) return "code";
  if (name.length >= 10) return "essay";
  return "plain";
}

/** Hue follows the first letter, shifted from the group-seal scale. */
export function ribbonHue(raw: RibbonValue): RibbonHue {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  if (!name) return "";
  const first = name.toUpperCase().replace(/[^A-Z]/g, "")[0] || "";
  if (!first) return "";
  if (first <= "C") return "ivory";
  if (first <= "G") return "graphite";
  if (first <= "K") return "champagne";
  if (first <= "O") return "ink";
  if (first <= "S") return "vellum";
  return "ash";
}

export function ribbonSpoken(raw: RibbonValue): boolean {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  const first = name.toUpperCase().replace(/[^A-Z]/g, "")[0] || "";
  return first === "A" || first === "E" || first === "I" || first === "O" || first === "U";
}

export function ribbonWide(raw: RibbonValue): boolean {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  if (!name) return false;
  return name.toUpperCase().replace(/[^A-Z]/g, "").length >= 8;
}

export function ribbonNotch(raw: RibbonValue): boolean {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  return Boolean(name && (name.includes("-") || name.includes("_")));
}

export function ribbonStep(raw: RibbonValue): number {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  if (!name) return 0;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return Math.min(8, new Set(compact.split("")).size);
}

export function ribbonEcho(raw: RibbonValue): boolean {
  const name = ribbonState(raw) === "set" ? ribbonName(raw) : "";
  if (!name) return false;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return /(.)\1/.test(compact);
}

export function ribbonLanes(rows: readonly RibbonRow[]): RibbonLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = ribbonLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const bars = ribbonLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingRibbonHue(rows: readonly RibbonRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = ribbonHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedRibbonCount(rows: readonly RibbonRow[]): number {
  const marks = rows.map((row) => ribbonStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneRibbonCount(rows: readonly RibbonRow[], lane: RibbonLane): number {
  return rows.filter((row) => ribbonLane(row.note) === lane).length;
}

export function hueRibbonCount(rows: readonly RibbonRow[], hue: RibbonHue): number {
  return rows.filter((row) => ribbonHue(row.note) === hue).length;
}

export function ribbonShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRibbonLanes(rows: readonly RibbonRow[]): string[] {
  return ribbonLanes(rows).map((line) => line.lane);
}

export function readHiddenRibbons(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRibbons(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRibbon(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRibbonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRibbonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRibbonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleRibbons(
  rows: readonly RibbonRow[],
  lane: string,
  hue: string,
  query: string,
  review: RibbonReview,
  reviewed: readonly string[],
  shape: RibbonShape,
): RibbonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (ribbonState(row.note) === "") return false;
    const found = ribbonLane(row.note);
    const hueName = ribbonHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${ribbonText(row.note)} ${ribbonStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "phrase" && found !== "phrase") return false;
    if (shape === "pair" && found !== "pair") return false;
    if (shape === "locale" && found !== "locale") return false;
    if (shape === "code" && found !== "code") return false;
    if (shape === "essay" && found !== "essay") return false;
    if (shape === "cipher" && found !== "cipher") return false;
    if (shape === "wide" && !ribbonWide(row.note)) return false;
    if (shape === "notch" && !ribbonNotch(row.note)) return false;
    return true;
  });
}

export function ribbonCopy(raw: RibbonValue): string {
  return [ribbonStamp(raw), ribbonLane(raw), ribbonHue(raw)].filter(Boolean).join(" ");
}

export function ribbonLanesCsv(rows: readonly RibbonRow[]): string {
  const lines = ["lane,count"];
  for (const line of ribbonLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function ribbonRowsCsv(rows: readonly RibbonRow[], reviewed: readonly string[]): string {
  const lines = ["name,stamp,lane,hue,step,echo,wide,notch,spoken,house,phrase,pair,locale,code,essay,cipher,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (ribbonState(row.note) !== "set") continue;
    const lane = ribbonLane(row.note);
    lines.push([
      csvCell(ribbonName(row.note)),
      ribbonStamp(row.note),
      lane,
      ribbonHue(row.note),
      String(ribbonStep(row.note)),
      ribbonEcho(row.note) ? "1" : "0",
      ribbonWide(row.note) ? "1" : "0",
      ribbonNotch(row.note) ? "1" : "0",
      ribbonSpoken(row.note) ? "1" : "0",
      lane === "house" ? "1" : "0",
      lane === "phrase" ? "1" : "0",
      lane === "pair" ? "1" : "0",
      lane === "locale" ? "1" : "0",
      lane === "code" ? "1" : "0",
      lane === "essay" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
