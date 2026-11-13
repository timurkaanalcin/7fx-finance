/**
 * Atrium slips for a greeting book, and contact plates already stored as lastContactAt.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_atrium_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   hour text not null default '',
 *   manner text not null default '',
 *   pace text not null default '',
 *   span_days integer,
 *   rank_no integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   waiting boolean not null default false,
 *   filed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_contact_plate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_contact_plate_review (
 *   trader_id text primary key
 * );
 */

export const ATP_KEY = "crmv4-atrium-slip";
export const ATP_VIEW_KEY = "crmv4-atrium-views";
export const ATP_DENSITY_KEY = "crmv4-atrium-density";
export const LCP_KEY = "crmv4-contact-hide";
export const LCP_REVIEW_KEY = "crmv4-contact-review";

export const ATRIUM_HOURS = ["dawn", "noon", "dusk", "night"] as const;

export type AtriumHour = (typeof ATRIUM_HOURS)[number];

export type MannerName = "blank" | "bow" | "word" | "card";

export type PaceName = "blank" | "hush" | "stroll" | "sprint";

export type AtriumTray = "open" | "held" | "shelved";

export type AtriumDensity = "airy" | "tight";

export type AtriumSort = "hour" | "host";

export type AtriumSlip = {
  id: string;
  title: string;
  note: string;
  host: string;
  hour: string;
  span: number | null;
  manner: string;
  pace: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  shelved: boolean;
  flagged: boolean;
  audit: string;
};

export type AtriumView = {
  id: string;
  name: string;
  tray: AtriumTray;
  query: string;
  host: string;
  manner: string;
  pace: string;
  hour: string;
  span: string;
  rank: string;
};

export type AtriumCounts = {
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

export type PlateLane = "" | "hush" | "desk" | "hall" | "lamp";

export type PlateHue = "" | "ivory" | "graphite" | "champagne";

export type PlateState = "" | "clear" | "set";

export type PlateShape = "all" | "hush" | "desk" | "hall" | "lamp" | "wide" | "notch" | "leap" | "weekend";

export type PlateReview = "all" | "reviewed" | "fresh";

export type PlateValue = string | { lastContactAt?: unknown; [key: string]: unknown } | null | undefined;

export type PlateRow = { id: string; label: string; note: PlateValue };

export type PlateLaneLine = { lane: string; count: number };

export const ROUND258_FEATURES = [
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
  "fair-host",
  "viewer",
  "suggest",
  "sla",
  "contact",
  "contact-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "shelve", "open", "manner", "tag", "rank", "span", "short", "flag"] as const;

const MANNERS = ["bow", "word", "card"] as const;

const PACES = ["hush", "stroll", "sprint"] as const;

const SPAN_CYCLE = [2, 6, 14] as const;

const RANK_CYCLE = [2, 4, 6, 8] as const;

const PEAK = new Set(["noon", "dusk"]);

const QUIET = new Set(["dawn", "night"]);

const HOUSE = new Set(["BOW", "WORD"]);

const EARLY = new Set(["dawn", "noon"]);

const LANE_ORDER = ["hush", "desk", "hall", "lamp"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AtriumTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function mannerName(raw: unknown): Exclude<MannerName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (MANNERS as readonly string[]).includes(text) ? (text as Exclude<MannerName, "blank">) : "";
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
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: AtriumSlip, tray: AtriumTray): boolean {
  if (tray === "held") return card.held && !card.shelved;
  if (tray === "shelved") return card.shelved;
  return !card.held && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function hourIndex(hour: string): number {
  return ATRIUM_HOURS.indexOf(hour as AtriumHour);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function hourOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ATRIUM_HOURS as readonly string[]).includes(text) ? text : "";
}

/** The SLA span is 2, 6, or 14 days. Anything else stays blank. */
export function spanOf(raw: unknown): 2 | 6 | 14 | null {
  const value = Number(clip(raw, 2));
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 2 | 6 | 14) : null;
}

/** Rank is 2, 4, 6, or 8. Anything else stays blank. */
export function rankOf(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Manner is bow, word, or card. The saved manner is BOW, WORD, or CARD. */
export function mannerOf(raw: unknown): string {
  const text = mannerName(raw);
  return text ? text.toUpperCase() : "";
}

/** Pace is hush, stroll, or sprint. A blank pace stays blank. */
export function paceOf(raw: unknown): string {
  return paceName(raw);
}

export function peakHour(hour: unknown): boolean {
  return PEAK.has(clip(hour, 12).toLowerCase());
}

export function quietHour(hour: unknown): boolean {
  return QUIET.has(clip(hour, 12).toLowerCase());
}

/** Early is dawn and noon. Mid is dusk. Late is night. */
export function hourBand(hour: unknown): string {
  const text = hourOf(hour);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "dusk") return "mid";
  return "late";
}

/** Signed distance from the slip hour to the desk hour. */
export function hourGap(from: unknown, to: unknown): number | null {
  const left = hourIndex(hourOf(from));
  const right = hourIndex(hourOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseManner(manner: unknown): boolean {
  return HOUSE.has(mannerOf(manner));
}

export function activeHour(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return hourOf(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function activePace(raw: unknown, allow: readonly string[]): string {
  const text = paceOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRank(raw: unknown): string {
  const rank = rankOf(raw);
  return rank === null ? "all" : String(rank);
}

export function activeManner(raw: unknown): string {
  const text = mannerName(raw);
  return text || "all";
}

export function moveSlipFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestManner(cards: readonly AtriumSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.manner) continue;
    counts.set(card.manner, (counts.get(card.manner) || 0) + 1);
  }
  let best = "BOW";
  let score = 0;
  for (const manner of ["BOW", "WORD", "CARD"]) {
    const count = counts.get(manner) || 0;
    if (count > score) {
      best = manner;
      score = count;
    }
  }
  return best;
}

/** A morning desk asks for a short span. An evening desk asks for a long one. Saved spans win when any exist. */
export function suggestSpan(cards: readonly AtriumSlip[], hour: number): 2 | 6 | 14 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 2 | 6 | 14 | null = null;
  let score = 0;
  for (const span of SPAN_CYCLE) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 10) return 2;
  if (hour < 16) return 6;
  return 14;
}

/** The host with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairHost(cards: readonly AtriumSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.host.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readSlips(raw: unknown): AtriumSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: AtriumSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AtriumSlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      host: clip(row.host, 24),
      hour: hourOf(row.hour),
      span: spanOf(row.span),
      manner: mannerOf(row.manner),
      pace: paceOf(row.pace),
      rank: rankOf(row.rank) ?? 2,
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

export function addSlip(
  cards: readonly AtriumSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    host?: string;
    hour?: string;
    span?: unknown;
    manner?: string;
    pace?: string;
    rank?: unknown;
    tags?: string;
  },
): AtriumSlip[] {
  const current = readSlips(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: AtriumSlip = {
    id,
    title,
    note: noteOf(card.note),
    host: clip(card.host, 24),
    hour: hourOf(card.hour),
    span: spanOf(card.span),
    manner: mannerOf(card.manner),
    pace: paceOf(card.pace),
    rank: rankOf(card.rank) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly AtriumSlip[], id: string, change: (card: AtriumSlip) => AtriumSlip): AtriumSlip[] {
  return readSlips(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly AtriumSlip[], ids: readonly string[], change: (card: AtriumSlip) => AtriumSlip): AtriumSlip[] {
  const picked = new Set(ids);
  return readSlips(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editSlip(cards: readonly AtriumSlip[], id: string, title: string): AtriumSlip[] {
  const next = lineOf(title);
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSlipNote(cards: readonly AtriumSlip[], id: string, note: string): AtriumSlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setSlipPin(cards: readonly AtriumSlip[], id: string, pinned: boolean): AtriumSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSlipWait(cards: readonly AtriumSlip[], id: string, held: boolean): AtriumSlip[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, shelved: held ? false : card.shelved, audit: held ? "hold" : "resume" }));
}

export function setSlipFile(cards: readonly AtriumSlip[], id: string, shelved: boolean): AtriumSlip[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, held: shelved ? false : card.held, audit: shelved ? "shelve" : "open" }));
}

export function setSlipStar(cards: readonly AtriumSlip[], id: string, flagged: boolean): AtriumSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setSlipManner(cards: readonly AtriumSlip[], id: string, manner: unknown): AtriumSlip[] {
  const next = mannerOf(manner);
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => (card.manner === next ? card : { ...card, manner: next, audit: "manner" }));
}

/** Pace steps hush, stroll, sprint, then hush again. A blank pace starts at hush. */
export function cyclePace(cards: readonly AtriumSlip[], id: string): AtriumSlip[] {
  return mapCard(cards, id, (card) => {
    const at = PACES.indexOf(card.pace as (typeof PACES)[number]);
    const next = at < 0 ? PACES[0] : PACES[(at + 1) % PACES.length];
    return next === card.pace ? card : { ...card, pace: next, audit: "pace" };
  });
}

export function addSlipTag(cards: readonly AtriumSlip[], id: string, tag: string): AtriumSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSlips(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 2, 2 becomes 6, and 6 becomes 14. A span of 14 stays. */
export function lengthenSpan(cards: readonly AtriumSlip[], id: string): AtriumSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 14) return card;
    const next = card.span === 6 ? 14 : card.span === 2 ? 6 : 2;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 14, 14 becomes 6, and 6 becomes 2. A span of 2 stays. */
export function shortenSpan(cards: readonly AtriumSlip[], id: string): AtriumSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 2) return card;
    const next = card.span === 6 ? 2 : card.span === 14 ? 6 : 14;
    return { ...card, span: next, audit: "short" };
  });
}

export function raiseRank(cards: readonly AtriumSlip[], id: string): AtriumSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 2, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerRank(cards: readonly AtriumSlip[], id: string): AtriumSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkSlipPin(cards: readonly AtriumSlip[], ids: readonly string[]): AtriumSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkSlipFile(cards: readonly AtriumSlip[], ids: readonly string[]): AtriumSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, shelved: true, held: false, audit: "shelve" }));
}

export function bulkSlipSprint(cards: readonly AtriumSlip[], ids: readonly string[]): AtriumSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pace: "sprint", audit: "pace" }));
}

export function bulkSlipCard(cards: readonly AtriumSlip[], ids: readonly string[]): AtriumSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, manner: "CARD", audit: "manner" }));
}

export function bulkSlipTag(cards: readonly AtriumSlip[], ids: readonly string[], tag: string): AtriumSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSlips(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly AtriumSlip[], ids: readonly string[], index: number, change: (list: readonly AtriumSlip[], id: string) => AtriumSlip[]): AtriumSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readSlips(cards);
}

export function lengthenFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  return focused(cards, ids, index, lengthenSpan);
}

export function shortenFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  return focused(cards, ids, index, shortenSpan);
}

export function paceFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  return focused(cards, ids, index, cyclePace);
}

export function raiseFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  return focused(cards, ids, index, raiseRank);
}

export function lowerFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  return focused(cards, ids, index, lowerRank);
}

export function pinFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipPin(cards, id, !card.pinned) : readSlips(cards);
}

export function waitFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipWait(cards, id, !card.held) : readSlips(cards);
}

export function starFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number): AtriumSlip[] {
  const id = ids[index];
  if (!id) return readSlips(cards);
  const card = readSlips(cards).find((item) => item.id === id);
  return card ? setSlipStar(cards, id, !card.flagged) : readSlips(cards);
}

export function tagFocusedSlip(cards: readonly AtriumSlip[], ids: readonly string[], index: number, tag: string): AtriumSlip[] {
  const id = ids[index];
  return id ? addSlipTag(cards, id, tag) : readSlips(cards);
}

export function readSlipViews(raw: unknown): AtriumView[] {
  if (!Array.isArray(raw)) return [];
  const out: AtriumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AtriumView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      host: clip(row.host, 24),
      manner: activeManner(row.manner),
      pace: activePace(row.pace, PACES),
      hour: activeHour(row.hour),
      span: activeSpan(row.span),
      rank: activeRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(
  views: readonly AtriumView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    host?: string;
    manner?: string;
    pace?: string;
    hour?: string;
    span?: string;
    rank?: string;
  },
): AtriumView[] {
  const current = readSlipViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: AtriumView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    host: clip(view.host, 24),
    manner: activeManner(view.manner),
    pace: activePace(view.pace, PACES),
    hour: activeHour(view.hour),
    span: activeSpan(view.span),
    rank: activeRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly AtriumView[], id: string): AtriumView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

export function atriumDensity(raw: unknown): AtriumDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than one hour behind the desk, at rank 2, is late. */
export function lateSlip(card: AtriumSlip, deskHour: unknown): boolean {
  const gap = hourGap(card.hour, deskHour);
  return card.rank === 2 && gap !== null && gap > 1;
}

export function idleSlip(card: AtriumSlip): boolean {
  return card.pace === "hush" && quietHour(card.hour) && card.rank === 2;
}

export function rushSlip(card: AtriumSlip): boolean {
  return card.rank === 8 && card.pace === "sprint" && peakHour(card.hour);
}

export function restingSlip(card: AtriumSlip): boolean {
  return card.span === 14 && card.pace === "stroll" && card.hour === "night";
}

/** A two-day span on a peak hour is overdue unless the slip is pinned. */
export function overdueSlip(card: AtriumSlip): boolean {
  return card.span === 2 && peakHour(card.hour) && !card.pinned;
}

export function visibleSlips(
  cards: readonly AtriumSlip[],
  tray: AtriumTray,
  query: string,
  host: string,
  manner: string,
  pace: string,
  hour: string,
  span: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): AtriumSlip[] {
  const text = query.trim().toLowerCase();
  const hostOn = host === "all" ? "" : host.trim().toLowerCase();
  const mannerOn = manner === "all" ? "" : mannerOf(manner);
  const paceOn = pace === "all" ? "" : paceOf(pace);
  const hourOn = hour === "all" ? "" : activeHour(hour);
  const spanOn = span === "all" ? "" : activeSpan(span);
  const rankOn = rank === "all" ? "" : activeRank(rank);
  return readSlips(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (hostOn && card.host.toLowerCase() !== hostOn) return false;
    if (mannerOn && card.manner !== mannerOn) return false;
    if (paceOn && card.pace !== paceOn) return false;
    if (hourOn === "peak" && !peakHour(card.hour)) return false;
    if (hourOn === "quiet" && !quietHour(card.hour)) return false;
    if (hourOn && hourOn !== "peak" && hourOn !== "quiet" && card.hour !== hourOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseManner(card.manner)) return false;
    if (peakOnly && !peakHour(card.hour)) return false;
    if (quietOnly && !quietHour(card.hour)) return false;
    return true;
  });
}

export function sortSlips(cards: readonly AtriumSlip[], sort: AtriumSort): AtriumSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "host") {
      const host = a.host.localeCompare(b.host);
      if (host) return host;
    }
    const hour = (hourIndex(a.hour) < 0 ? 99 : hourIndex(a.hour)) - (hourIndex(b.hour) < 0 ? 99 : hourIndex(b.hour));
    if (hour) return hour;
    return a.title.localeCompare(b.title);
  });
}

export function slipCounts(cards: readonly AtriumSlip[], shown: readonly AtriumSlip[], deskHour: unknown): AtriumCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    shelved: cards.filter((card) => inTray(card, "shelved")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakHour(card.hour)).length,
    quiet: open.filter((card) => quietHour(card.hour)).length,
    soon: open.filter((card) => card.span === 2).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseManner(card.manner)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: open.filter((card) => card.hour && card.hour === hourOf(deskHour)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleSlip(card)).length,
    rush: open.filter((card) => rushSlip(card)).length,
    resting: open.filter((card) => restingSlip(card)).length,
    overdue: open.filter((card) => overdueSlip(card)).length,
  };
}

export function clashHourCount(cards: readonly AtriumSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.hour);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.hour === card.hour && other.rank === card.rank)).length;
}

export function neighborSlipCount(cards: readonly AtriumSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestHost(cards: readonly AtriumSlip[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.host);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.host.toLowerCase() === card.host.toLowerCase()).length;
    if (count > score) {
      best = card.host;
      score = count;
    }
  }
  return best;
}

export function reminderSlips(cards: readonly AtriumSlip[]): AtriumSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.span === 2 || card.span === 6));
}

export function idleSlips(cards: readonly AtriumSlip[]): AtriumSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleSlip(card));
}

export function slipTimeline(cards: readonly AtriumSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function slipBars(cards: readonly AtriumSlip[]): { hour: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return ATRIUM_HOURS.map((hour) => ({ hour, count: open.filter((card) => card.hour === hour).length }));
}

export function slipHosts(cards: readonly AtriumSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.host || out.some((item) => item.toLowerCase() === card.host.toLowerCase())) continue;
    out.push(card.host);
  }
  return out;
}

export function slipCopy(card: AtriumSlip): string {
  return [card.title, card.host, card.hour, card.manner, card.pace, card.span ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function slipShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function slipCsv(cards: readonly AtriumSlip[], deskHour: unknown): string {
  const lines = ["title,host,hour,manner,pace,span,rank,tags,pinned,waiting,filed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readSlips(cards)) {
    const gap = hourGap(card.hour, deskHour);
    lines.push([
      csvCell(card.title),
      csvCell(card.host),
      card.hour,
      card.manner,
      card.pace,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.shelved ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(card, deskHour) ? "1" : "0",
      idleSlip(card) ? "1" : "0",
      peakHour(card.hour) ? "1" : "0",
      quietHour(card.hour) ? "1" : "0",
      houseManner(card.manner) ? "1" : "0",
      hourBand(card.hour),
      rushSlip(card) ? "1" : "0",
      restingSlip(card) ? "1" : "0",
      overdueSlip(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function plateRecord(raw: PlateValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: PlateValue): boolean {
  const row = plateRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type PlateParts = { year: number; month: number; day: number; hour: number; minute: number };

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function plateParts(raw: PlateValue): PlateParts | null {
  if (hasBlocked(raw)) return null;
  const row = plateRecord(raw);
  if (row && !("lastContactAt" in row)) return null;
  const text = row ? clip(row.lastContactAt, 40) : clip(raw, 40);
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] === undefined ? 0 : Number(match[4]);
  const minute = match[5] === undefined ? 0 : Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

function plateText(raw: PlateValue): string {
  const parts = plateParts(raw);
  if (!parts) return "";
  const date = `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  return `${date}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

/** A blocked field clears the plate. A real contact instant is set. A blank or impossible instant is clear. */
export function plateState(raw: PlateValue): PlateState {
  if (hasBlocked(raw)) return "";
  const row = plateRecord(raw);
  if (row && !("lastContactAt" in row)) return "";
  return plateParts(raw) ? "set" : "clear";
}

/** Hush is 00–04, desk 05–11, hall 12–16, and lamp 17–23 UTC. */
export function plateLane(raw: PlateValue): PlateLane {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return "";
  if (parts.hour <= 4) return "hush";
  if (parts.hour <= 11) return "desk";
  if (parts.hour <= 16) return "hall";
  return "lamp";
}

/** 1430 for 14:30 UTC. A date with no clock is 0000. */
export function plateStamp(raw: PlateValue): string {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return "";
  return `${String(parts.hour).padStart(2, "0")}${String(parts.minute).padStart(2, "0")}`;
}

/** The first fifteen minutes are ivory, the next thirty graphite, and the rest champagne. */
export function plateHue(raw: PlateValue): PlateHue {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return "";
  if (parts.minute <= 14) return "ivory";
  if (parts.minute <= 44) return "graphite";
  return "champagne";
}

/** Saturday or Sunday in UTC. */
export function plateSpoken(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return false;
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return day === 0 || day === 6;
}

export function plateWide(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return Boolean(parts && parts.hour >= 17);
}

export function plateNotch(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return Boolean(parts && (parts.minute === 15 || parts.minute === 45));
}

export function plateEcho(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  if (!parts) return false;
  return parts.minute === 5 || parts.minute === 55;
}

export function plateLeap(raw: PlateValue): boolean {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return Boolean(parts && parts.month === 2 && parts.day === 29);
}

export function plateStep(raw: PlateValue): number {
  const parts = plateState(raw) === "set" ? plateParts(raw) : null;
  return parts ? parts.hour : 0;
}

export function plateLanes(rows: readonly PlateRow[]): PlateLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = plateLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPlate(rows: readonly PlateRow[]): string {
  const bars = plateLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPlateHue(rows: readonly PlateRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = plateHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedPlateCount(rows: readonly PlateRow[]): number {
  const marks = rows.map((row) => plateStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function lanePlateCount(rows: readonly PlateRow[], lane: PlateLane): number {
  return rows.filter((row) => plateLane(row.note) === lane).length;
}

export function huePlateCount(rows: readonly PlateRow[], hue: PlateHue): number {
  return rows.filter((row) => plateHue(row.note) === hue).length;
}

export function plateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPlateLanes(rows: readonly PlateRow[]): string[] {
  return plateLanes(rows).map((line) => line.lane);
}

export function readHiddenPlates(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPlates(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePlate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visiblePlates(
  rows: readonly PlateRow[],
  lane: string,
  hue: string,
  query: string,
  review: PlateReview,
  reviewed: readonly string[],
  shape: PlateShape,
): PlateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (plateState(row.note) === "") return false;
    const found = plateLane(row.note);
    const hueName = plateHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${plateText(row.note)} ${plateStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "hush" && found !== "hush") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "lamp" && found !== "lamp") return false;
    if (shape === "wide" && !plateWide(row.note)) return false;
    if (shape === "notch" && !plateNotch(row.note)) return false;
    if (shape === "leap" && !plateLeap(row.note)) return false;
    if (shape === "weekend" && !plateSpoken(row.note)) return false;
    return true;
  });
}

export function plateCopy(raw: PlateValue): string {
  return [plateStamp(raw), plateLane(raw), plateHue(raw)].filter(Boolean).join(" ");
}

export function plateLanesCsv(rows: readonly PlateRow[]): string {
  const lines = ["lane,count"];
  for (const line of plateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function plateRowsCsv(rows: readonly PlateRow[], reviewed: readonly string[]): string {
  const lines = ["name,contacted,stamp,lane,hue,step,echo,wide,notch,leap,weekend,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (plateState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      plateText(row.note),
      plateStamp(row.note),
      plateLane(row.note),
      plateHue(row.note),
      String(plateStep(row.note)),
      plateEcho(row.note) ? "1" : "0",
      plateWide(row.note) ? "1" : "0",
      plateNotch(row.note) ? "1" : "0",
      plateLeap(row.note) ? "1" : "0",
      plateSpoken(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
