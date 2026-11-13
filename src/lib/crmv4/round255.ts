/**
 * Warrant slips for a document chase book, and broker crests already stored on a trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_warrant_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   hour text not null default '',
 *   ink text not null default '',
 *   tempo text not null default '',
 *   span_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   waiting boolean not null default false,
 *   filed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_broker_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_broker_crest_review (
 *   trader_id text primary key
 * );
 */

export const WNS_KEY = "crmv4-warrant-slip";
export const WNS_VIEW_KEY = "crmv4-warrant-views";
export const WNS_DENSITY_KEY = "crmv4-warrant-density";
export const BKC_KEY = "crmv4-crest-hide";
export const BKC_REVIEW_KEY = "crmv4-crest-review";

export const WARRANT_HOURS = ["dawn", "forenoon", "noon", "afternoon", "vespers", "night"] as const;

export type WarrantHour = (typeof WARRANT_HOURS)[number];

export type InkName = "blank" | "soot" | "oak" | "gilt";

export type TempoName = "blank" | "still" | "steady" | "brisk";

export type WarrantTray = "open" | "held" | "shelved";

export type WarrantDensity = "airy" | "tight";

export type WarrantSort = "watch" | "courier";

export type WarrantSlip = {
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

export type WarrantView = {
  id: string;
  name: string;
  tray: WarrantTray;
  query: string;
  courier: string;
  cloth: string;
  pace: string;
  watch: string;
  span: string;
  rank: string;
};

export type WarrantCounts = {
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

export type CrestLane = "" | "house" | "phrase" | "pair" | "mark" | "split" | "code" | "essay" | "cipher" | "plain";

export type CrestHue = "" | "ivory" | "graphite" | "champagne" | "ink" | "vellum" | "ash";

export type CrestState = "" | "clear" | "set";

export type CrestShape = "all" | "house" | "phrase" | "pair" | "mark" | "split" | "code" | "essay" | "cipher" | "wide" | "notch";

export type CrestReview = "all" | "reviewed" | "fresh";

export type CrestValue = string | { brokerName?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type CrestRow = { id: string; label: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

export const ROUND255_FEATURES = [
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
  "fair-clerk",
  "viewer",
  "suggest",
  "sla",
  "crests",
  "crest-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "shelve", "open", "cloth", "tag", "rank", "span", "short", "flag"] as const;

const CLOTHS = ["soot", "oak", "gilt"] as const;

const PACES = ["still", "steady", "brisk"] as const;

const PACE_CYCLE = ["still", "steady", "brisk"] as const;

const SPAN_CYCLE = [15, 30, 60] as const;

const RANK_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["dawn", "noon"]);

const QUIET = new Set(["afternoon", "night"]);

const HOUSE = new Set(["SOOT", "OAK"]);

const EARLY = new Set(["dawn", "forenoon"]);

const MID = new Set(["noon", "afternoon"]);

const LATE = new Set(["vespers", "night"]);

const LANE_ORDER = ["house", "phrase", "pair", "mark", "split", "code", "essay", "cipher", "plain"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne", "ink", "vellum", "ash"] as const;

const HOUSES = new Set(["7FX", "HOUSE", "DESK"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WarrantTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<TempoName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<TempoName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[efgh]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: WarrantSlip, tray: WarrantTray): boolean {
  if (tray === "held") return card.held && !card.shelved;
  if (tray === "shelved") return card.shelved;
  return !card.held && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function hourIndex(watch: string): number {
  return WARRANT_HOURS.indexOf(watch as WarrantHour);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function warrantLine(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank note stays blank. It is not filled in. */
export function warrantNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A watch outside the six hours is left blank. */
export function hourOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (WARRANT_HOURS as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 20, 40, or 80 minutes. Anything else stays blank. */
export function warrantSpanOf(raw: unknown): 15 | 30 | 60 | null {
  const value = Number(clip(raw, 2));
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 15 | 30 | 60) : null;
}

/** Rank is 2, 4, 6, or 8. Anything else stays blank. */
export function warrantRankOf(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Ink is soot, oak, or gilt. The saved ink is SOOT, OAK, or GILT. */
export function inkOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "soot") return "SOOT";
  if (text === "oak") return "OAK";
  if (text === "gilt") return "GILT";
  return "";
}

/** Tempo is still, steady, or brisk. A blank tempo stays blank. */
export function tempoOf(raw: unknown): string {
  return tempoName(raw);
}

export function peakHour(watch: unknown): boolean {
  return PEAK.has(hourOf(watch));
}

export function quietHour(watch: unknown): boolean {
  return QUIET.has(hourOf(watch));
}

/** Early is dawn and forenoon. Mid is noon and afternoon. Late is vespers and night. */
export function hourBand(watch: unknown): "early" | "mid" | "late" | "" {
  const name = hourOf(watch);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the slip watch to the desk watch. A blank watch has no gap. */
export function hourGap(cardHour: unknown, deskHour: unknown): number | null {
  const from = hourIndex(hourOf(cardHour));
  const to = hourIndex(hourOf(deskHour));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseInk(cloth: unknown): boolean {
  return HOUSE.has(inkOf(cloth));
}

export function activeHour(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return hourOf(text) || "all";
}

export function activeWarrantSpan(raw: unknown): string {
  const value = warrantSpanOf(raw);
  return value === null ? "all" : String(value);
}

export function activeTempo(raw: unknown, paces: readonly string[]): string {
  const pace = tempoOf(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeWarrantRank(raw: unknown): string {
  const value = warrantRankOf(raw);
  return value === null ? "all" : String(value);
}

export function activeInk(raw: unknown): string {
  const name = inkName(raw);
  return name || "all";
}

export function moveWarrantFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink used most often. A tie, or an empty book, keeps soot. */
export function suggestInk(cards: readonly WarrantSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.cloth) continue;
    counts.set(card.cloth, (counts.get(card.cloth) || 0) + 1);
  }
  let best = "SOOT";
  let score = 0;
  for (const cloth of ["SOOT", "OAK", "GILT"]) {
    const count = counts.get(cloth) || 0;
    if (count > score) {
      best = cloth;
      score = count;
    }
  }
  return best;
}

/** A morning desk asks for a short SLA. An evening desk asks for a long one. Saved spans win when any exist. */
export function suggestHour(cards: readonly WarrantSlip[], hour: number): 15 | 30 | 60 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 15 | 30 | 60 | null = null;
  let score = 0;
  for (const span of SPAN_CYCLE) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 10) return 15;
  if (hour < 16) return 30;
  return 60;
}

/** The courier with the fewest open slips. A tie keeps the roster order. */
export function fairClerk(cards: readonly WarrantSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
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

export function readWarrants(raw: unknown): WarrantSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: WarrantSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WarrantSlip>;
    const id = clip(row.id, 40);
    const title = warrantLine(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: warrantNote(row.note),
      courier: clip(row.courier, 24),
      watch: hourOf(row.watch),
      span: warrantSpanOf(row.span),
      cloth: inkOf(row.cloth),
      pace: tempoOf(row.pace),
      rank: warrantRankOf(row.rank) ?? 1,
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

export function addWarrant(
  cards: readonly WarrantSlip[],
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
): WarrantSlip[] {
  const current = readWarrants(cards);
  const id = clip(card.id, 40);
  const title = warrantLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: WarrantSlip = {
    id,
    title,
    note: warrantNote(card.note),
    courier: clip(card.courier, 24),
    watch: hourOf(card.watch),
    span: warrantSpanOf(card.span),
    cloth: inkOf(card.cloth),
    pace: tempoOf(card.pace),
    rank: warrantRankOf(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly WarrantSlip[], id: string, change: (card: WarrantSlip) => WarrantSlip): WarrantSlip[] {
  return readWarrants(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly WarrantSlip[], ids: readonly string[], change: (card: WarrantSlip) => WarrantSlip): WarrantSlip[] {
  const picked = new Set(ids);
  return readWarrants(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editWarrant(cards: readonly WarrantSlip[], id: string, title: string): WarrantSlip[] {
  const next = warrantLine(title);
  if (!next) return readWarrants(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editWarrantNote(cards: readonly WarrantSlip[], id: string, note: string): WarrantSlip[] {
  const next = warrantNote(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setWarrantPin(cards: readonly WarrantSlip[], id: string, pinned: boolean): WarrantSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setWarrantWait(cards: readonly WarrantSlip[], id: string, held: boolean): WarrantSlip[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, shelved: held ? false : card.shelved, audit: held ? "hold" : "resume" }));
}

export function setWarrantFile(cards: readonly WarrantSlip[], id: string, shelved: boolean): WarrantSlip[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, held: shelved ? false : card.held, audit: shelved ? "shelve" : "open" }));
}

export function setWarrantStar(cards: readonly WarrantSlip[], id: string, flagged: boolean): WarrantSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setWarrantInk(cards: readonly WarrantSlip[], id: string, cloth: unknown): WarrantSlip[] {
  const next = inkOf(cloth);
  if (!next) return readWarrants(cards);
  return mapCard(cards, id, (card) => (card.cloth === next ? card : { ...card, cloth: next, audit: "cloth" }));
}

/** Tempo steps still, steady, brisk, then still again. A blank tempo starts at still. */
export function cycleTempo(cards: readonly WarrantSlip[], id: string): WarrantSlip[] {
  return mapCard(cards, id, (card) => {
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    return next === card.pace ? card : { ...card, pace: next, audit: "pace" };
  });
}

export function addWarrantTag(cards: readonly WarrantSlip[], id: string, tag: string): WarrantSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readWarrants(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 20, 20 becomes 40, and 40 becomes 80. A span of 80 stays. */
export function lengthenHour(cards: readonly WarrantSlip[], id: string): WarrantSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 60) return card;
    const next = card.span === 30 ? 60 : card.span === 15 ? 30 : 15;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 80, 80 becomes 40, and 40 becomes 20. A span of 20 stays. */
export function shortenHour(cards: readonly WarrantSlip[], id: string): WarrantSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 15) return card;
    const next = card.span === 30 ? 15 : card.span === 60 ? 30 : 60;
    return { ...card, span: next, audit: "short" };
  });
}

/** Rank steps 2, 4, 6, 8. A blank rank starts at 2. Rank 8 stays. */
export function raiseWarrantRank(cards: readonly WarrantSlip[], id: string): WarrantSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.rank === 7) return card;
    const next = card.rank === 5 ? 7 : card.rank === 3 ? 5 : card.rank === 1 ? 3 : 1;
    return { ...card, rank: next, audit: "rank" };
  });
}

/** Rank steps 8, 6, 4, 2. A blank rank starts at 8. Rank 2 stays. */
export function lowerWarrantRank(cards: readonly WarrantSlip[], id: string): WarrantSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.rank === 1) return card;
    const next = card.rank === 3 ? 1 : card.rank === 5 ? 3 : card.rank === 7 ? 5 : 7;
    return { ...card, rank: next, audit: "rank" };
  });
}

function focusedCard(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip | undefined {
  const id = shownIds[index];
  return id ? readWarrants(cards).find((card) => card.id === id) : undefined;
}

export function pinFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readWarrants(cards);
  return setWarrantPin(cards, card.id, !card.pinned);
}

export function waitFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readWarrants(cards);
  return setWarrantWait(cards, card.id, !card.held);
}

export function paceFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const id = shownIds[index];
  return id ? cycleTempo(cards, id) : readWarrants(cards);
}

export function starFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readWarrants(cards);
  return setWarrantStar(cards, card.id, !card.flagged);
}

export function tagFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number, tag: string): WarrantSlip[] {
  const id = shownIds[index];
  return id ? addWarrantTag(cards, id, tag) : readWarrants(cards);
}

export function raiseFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const id = shownIds[index];
  return id ? raiseWarrantRank(cards, id) : readWarrants(cards);
}

export function lowerFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const id = shownIds[index];
  return id ? lowerWarrantRank(cards, id) : readWarrants(cards);
}

export function lengthenFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const id = shownIds[index];
  return id ? lengthenHour(cards, id) : readWarrants(cards);
}

export function shortenFocusedWarrant(cards: readonly WarrantSlip[], shownIds: readonly string[], index: number): WarrantSlip[] {
  const id = shownIds[index];
  return id ? shortenHour(cards, id) : readWarrants(cards);
}

export function bulkWarrantPin(cards: readonly WarrantSlip[], ids: readonly string[]): WarrantSlip[] {
  return touchIds(cards, ids, (card) => (card.pinned ? card : { ...card, pinned: true, audit: "pin" }));
}

export function bulkWarrantFile(cards: readonly WarrantSlip[], ids: readonly string[]): WarrantSlip[] {
  return touchIds(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, held: false, audit: "shelve" }));
}

export function bulkWarrantBrisk(cards: readonly WarrantSlip[], ids: readonly string[]): WarrantSlip[] {
  return touchIds(cards, ids, (card) => (card.pace === "brisk" ? card : { ...card, pace: "brisk", audit: "pace" }));
}

export function bulkWarrantTag(cards: readonly WarrantSlip[], ids: readonly string[], tag: string): WarrantSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readWarrants(cards);
  return touchIds(cards, ids, (card) => (card.tags.includes(next) || card.tags.length >= TAG_CAP ? card : { ...card, tags: [...card.tags, next], audit: "tag" }));
}

export function bulkWarrantGilt(cards: readonly WarrantSlip[], ids: readonly string[]): WarrantSlip[] {
  return touchIds(cards, ids, (card) => (card.cloth === "GILT" ? card : { ...card, cloth: "GILT", audit: "cloth" }));
}

export function readWarrantViews(raw: unknown): WarrantView[] {
  if (!Array.isArray(raw)) return [];
  const out: WarrantView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WarrantView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      courier: clip(row.courier, 24),
      cloth: activeInk(row.cloth),
      pace: activeTempo(row.pace, PACES),
      watch: activeHour(row.watch),
      span: activeWarrantSpan(row.span),
      rank: activeWarrantRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addWarrantView(
  views: readonly WarrantView[],
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
): WarrantView[] {
  const current = readWarrantViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: WarrantView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    courier: clip(view.courier, 24),
    cloth: activeInk(view.cloth),
    pace: activeTempo(view.pace, PACES),
    watch: activeHour(view.watch),
    span: activeWarrantSpan(view.span),
    rank: activeWarrantRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropWarrantView(views: readonly WarrantView[], id: string): WarrantView[] {
  return readWarrantViews(views).filter((view) => view.id !== id);
}

export function warrantDensity(raw: unknown): WarrantDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than two watches behind the desk, at rank 2, is late. */
export function lateWarrant(card: WarrantSlip, deskHour: unknown): boolean {
  const gap = hourGap(card.watch, deskHour);
  return card.rank === 1 && gap !== null && gap > 1;
}

export function idleWarrant(card: WarrantSlip): boolean {
  return card.pace === "still" && quietHour(card.watch) && card.rank === 1;
}

export function rushWarrant(card: WarrantSlip): boolean {
  return card.rank === 7 && card.pace === "brisk" && peakHour(card.watch);
}

export function restingWarrant(card: WarrantSlip): boolean {
  return card.span === 60 && card.pace === "steady" && !card.flagged;
}

/** A twenty-minute SLA on a peak watch is overdue unless the slip is pinned. */
export function overdueWarrant(card: WarrantSlip): boolean {
  return card.span === 15 && peakHour(card.watch) && !card.pinned;
}

export function visibleWarrants(
  cards: readonly WarrantSlip[],
  tray: WarrantTray,
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
): WarrantSlip[] {
  const text = query.trim().toLowerCase();
  const courierOn = courier === "all" ? "" : courier.trim().toLowerCase();
  const clothOn = cloth === "all" ? "" : inkOf(cloth);
  const paceOn = pace === "all" ? "" : tempoOf(pace);
  const watchOn = watch === "all" ? "" : activeHour(watch);
  const spanOn = span === "all" ? "" : activeWarrantSpan(span);
  const rankOn = rank === "all" ? "" : activeWarrantRank(rank);
  return readWarrants(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (courierOn && card.courier.toLowerCase() !== courierOn) return false;
    if (clothOn && card.cloth !== clothOn) return false;
    if (paceOn && card.pace !== paceOn) return false;
    if (watchOn === "peak" && !peakHour(card.watch)) return false;
    if (watchOn === "quiet" && !quietHour(card.watch)) return false;
    if (watchOn && watchOn !== "peak" && watchOn !== "quiet" && card.watch !== watchOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseInk(card.cloth)) return false;
    if (peakOnly && !peakHour(card.watch)) return false;
    if (quietOnly && !quietHour(card.watch)) return false;
    return true;
  });
}

export function sortWarrants(cards: readonly WarrantSlip[], sort: WarrantSort): WarrantSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "courier") {
      const courier = a.courier.localeCompare(b.courier);
      if (courier) return courier;
    }
    const watch = (hourIndex(a.watch) < 0 ? 99 : hourIndex(a.watch)) - (hourIndex(b.watch) < 0 ? 99 : hourIndex(b.watch));
    if (watch) return watch;
    return a.title.localeCompare(b.title);
  });
}

export function warrantCounts(cards: readonly WarrantSlip[], shown: readonly WarrantSlip[], deskHour: unknown): WarrantCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    shelved: cards.filter((card) => inTray(card, "shelved")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakHour(card.watch)).length,
    quiet: open.filter((card) => quietHour(card.watch)).length,
    soon: open.filter((card) => card.span === 15).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseInk(card.cloth)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: open.filter((card) => card.watch && card.watch === hourOf(deskHour)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleWarrant(card)).length,
    rush: open.filter((card) => rushWarrant(card)).length,
    resting: open.filter((card) => restingWarrant(card)).length,
    overdue: open.filter((card) => overdueWarrant(card)).length,
  };
}

export function clashHourCount(cards: readonly WarrantSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.watch);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.watch === card.watch && other.rank === card.rank)).length;
}

export function neighborWarrantCount(cards: readonly WarrantSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestClerk(cards: readonly WarrantSlip[]): string {
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

export function reminderWarrants(cards: readonly WarrantSlip[]): WarrantSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.span === 15 || card.span === 30));
}

export function idleWarrants(cards: readonly WarrantSlip[]): WarrantSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleWarrant(card));
}

export function warrantTimeline(cards: readonly WarrantSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function warrantBars(cards: readonly WarrantSlip[]): { watch: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return WARRANT_HOURS.map((watch) => ({ watch, count: open.filter((card) => card.watch === watch).length }));
}

export function warrantClerks(cards: readonly WarrantSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.courier || out.some((item) => item.toLowerCase() === card.courier.toLowerCase())) continue;
    out.push(card.courier);
  }
  return out;
}

export function warrantCopy(card: WarrantSlip): string {
  return [card.title, card.courier, card.watch, card.cloth, card.pace, card.span ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function warrantShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function warrantCsv(cards: readonly WarrantSlip[], deskHour: unknown): string {
  const lines = ["title,courier,watch,cloth,pace,span,rank,tags,pinned,waiting,filed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readWarrants(cards)) {
    const gap = hourGap(card.watch, deskHour);
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
      lateWarrant(card, deskHour) ? "1" : "0",
      idleWarrant(card) ? "1" : "0",
      peakHour(card.watch) ? "1" : "0",
      quietHour(card.watch) ? "1" : "0",
      houseInk(card.cloth) ? "1" : "0",
      hourBand(card.watch),
      rushWarrant(card) ? "1" : "0",
      restingWarrant(card) ? "1" : "0",
      overdueWarrant(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function crestRecord(raw: CrestValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function crestText(raw: CrestValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = crestRecord(raw);
  if (!row || !("brokerName" in row)) return "";
  return clip(row.brokerName, 32);
}

function hasBlocked(raw: CrestValue): boolean {
  const row = crestRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

/** A broker name of two to twenty-four marks. Money fields and other objects stay blank. */
function crestName(raw: CrestValue): string {
  if (hasBlocked(raw)) return "";
  const row = crestRecord(raw);
  if (row && !("brokerName" in row)) return "";
  const text = crestText(raw).replace(/\s+/g, " ").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 /'.@_-]{1,23}$/.test(text)) return "";
  return text;
}

/** A blocked field clears the crest. A broker name of two to twenty-four marks is set. */
export function crestState(raw: CrestValue): CrestState {
  if (hasBlocked(raw)) return "";
  const row = crestRecord(raw);
  if (row && !("brokerName" in row)) return "";
  return crestName(raw) ? "set" : "clear";
}

/** The first two letters and the letter count. Apex is AP4. */
export function crestStamp(raw: CrestValue): string {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return "";
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (compact.length < 2) return "";
  return `${compact.slice(0, 2)}${compact.length}`;
}

/** House names are 7FX, HOUSE, and DESK. A digit is a cipher. A dot or at-sign is a mark. A hyphen, slash, or underscore is a split. */
export function crestLane(raw: CrestValue): CrestLane {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return "";
  const words = name.split(/\s+/).filter(Boolean);
  const upper = name.toUpperCase();
  if (words.length === 1 && HOUSES.has(upper) && !/[-_./@]/.test(name)) return "house";
  if (/\d/.test(name)) return "cipher";
  if (name.includes(".") || name.includes("@")) return "mark";
  if (name.includes("-") || name.includes("/") || name.includes("_")) return "split";
  if (words.length >= 3) return "phrase";
  if (words.length === 2) return "pair";
  if (name.length <= 4) return "code";
  if (name.length >= 12) return "essay";
  return "plain";
}

/** Hue follows the first letter, shifted from the group-seal scale. */
export function crestHue(raw: CrestValue): CrestHue {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return "";
  const first = name.toUpperCase().replace(/[^A-Z]/g, "")[0] || "";
  if (!first) return "";
  if (first <= "D") return "ivory";
  if (first <= "H") return "graphite";
  if (first <= "L") return "champagne";
  if (first <= "P") return "ink";
  if (first <= "T") return "vellum";
  return "ash";
}

export function crestSpoken(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  const last = compact.slice(-1);
  return last === "A" || last === "E" || last === "I" || last === "O" || last === "U";
}

export function crestWide(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return false;
  return name.toUpperCase().replace(/[^A-Z]/g, "").length >= 10;
}

export function crestNotch(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  return Boolean(name && (name.includes(".") || name.includes("/")));
}

export function crestStep(raw: CrestValue): number {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return 0;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return Math.min(6, new Set(compact.split("")).size);
}

export function crestEcho(raw: CrestValue): boolean {
  const name = crestState(raw) === "set" ? crestName(raw) : "";
  if (!name) return false;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return compact.length >= 2 && compact[0] === compact[compact.length - 1];
}

export function crestLanes(rows: readonly CrestRow[]): CrestLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = crestLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCrest(rows: readonly CrestRow[]): string {
  const bars = crestLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCrestHue(rows: readonly CrestRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = crestHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const marks = rows.map((row) => crestStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCrestCount(rows: readonly CrestRow[], lane: CrestLane): number {
  return rows.filter((row) => crestLane(row.note) === lane).length;
}

export function hueCrestCount(rows: readonly CrestRow[], hue: CrestHue): number {
  return rows.filter((row) => crestHue(row.note) === hue).length;
}

export function crestShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCrestLanes(rows: readonly CrestRow[]): string[] {
  return crestLanes(rows).map((line) => line.lane);
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCrest(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCrestReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrestLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCrests(
  rows: readonly CrestRow[],
  lane: string,
  hue: string,
  query: string,
  review: CrestReview,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (crestState(row.note) === "") return false;
    const found = crestLane(row.note);
    const hueName = crestHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${crestText(row.note)} ${crestStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "phrase" && found !== "phrase") return false;
    if (shape === "pair" && found !== "pair") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "split" && found !== "split") return false;
    if (shape === "code" && found !== "code") return false;
    if (shape === "essay" && found !== "essay") return false;
    if (shape === "cipher" && found !== "cipher") return false;
    if (shape === "wide" && !crestWide(row.note)) return false;
    if (shape === "notch" && !crestNotch(row.note)) return false;
    return true;
  });
}

export function crestCopy(raw: CrestValue): string {
  return [crestStamp(raw), crestLane(raw), crestHue(raw)].filter(Boolean).join(" ");
}

export function crestLanesCsv(rows: readonly CrestRow[]): string {
  const lines = ["lane,count"];
  for (const line of crestLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["name,stamp,lane,hue,step,echo,wide,notch,spoken,house,phrase,pair,mark,split,code,essay,cipher,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (crestState(row.note) !== "set") continue;
    const lane = crestLane(row.note);
    lines.push([
      csvCell(crestName(row.note)),
      crestStamp(row.note),
      lane,
      crestHue(row.note),
      String(crestStep(row.note)),
      crestEcho(row.note) ? "1" : "0",
      crestWide(row.note) ? "1" : "0",
      crestNotch(row.note) ? "1" : "0",
      crestSpoken(row.note) ? "1" : "0",
      lane === "house" ? "1" : "0",
      lane === "phrase" ? "1" : "0",
      lane === "pair" ? "1" : "0",
      lane === "mark" ? "1" : "0",
      lane === "split" ? "1" : "0",
      lane === "code" ? "1" : "0",
      lane === "essay" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
