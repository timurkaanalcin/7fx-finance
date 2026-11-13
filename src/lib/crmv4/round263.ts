/**
 * Buttery slips for a cellar service book, and provenance plates already stored as leadInvalidSource.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_buttery_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   cellar text not null default '',
 *   glass text not null default '',
 *   pour text not null default '',
 *   wait_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_provenance_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_provenance_review (
 *   trader_id text primary key
 * );
 */

export const BTY_KEY = "crmv4-buttery-slip";
export const BTY_VIEW_KEY = "crmv4-buttery-views";
export const BTY_DENSITY_KEY = "crmv4-buttery-density";
export const PRV_KEY = "crmv4-provenance-hide";
export const PRV_REVIEW_KEY = "crmv4-provenance-review";

export const BUTTERY_CELLARS = ["vault", "bin", "rack", "cave"] as const;

export type ButteryCellar = (typeof BUTTERY_CELLARS)[number];

export type GlassName = "blank" | "flint" | "green" | "amber";

export type PourName = "blank" | "still" | "spark" | "cask";

export type ButteryTray = "open" | "pause" | "seal";

export type ButteryDensity = "roomy" | "close";

export type ButterySort = "cellar" | "steward";

export type ButterySlip = {
  id: string;
  title: string;
  note: string;
  steward: string;
  cellar: string;
  wait: number | null;
  glass: string;
  pour: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type ButteryView = {
  id: string;
  name: string;
  tray: ButteryTray;
  query: string;
  steward: string;
  glass: string;
  pour: string;
  cellar: string;
  wait: string;
  rank: string;
};

export type ButteryCounts = {
  open: number;
  pause: number;
  seal: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rank: number;
  house: number;
  wait: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type SourceLane = "" | "hand" | "clock" | "mark" | "join";

export type SourceHue = "" | "ivory" | "graphite" | "champagne";

export type SourceState = "" | "clear" | "set";

export type SourceShape = "all" | "hand" | "clock" | "mark" | "join" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type SourceReview = "all" | "reviewed" | "fresh";

export type SourceValue = string | { leadInvalidSource?: unknown; source?: unknown; [key: string]: unknown } | null | undefined;

export type SourceRow = { id: string; label: string; note: SourceValue };

export type SourceLaneLine = { lane: string; count: number };

export const ROUND263_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "wait",
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
  "fair-steward",
  "viewer",
  "suggest",
  "sla",
  "provenance",
  "provenance-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pour", "pin", "unpin", "pause", "resume", "seal", "open", "glass", "tag", "rank", "wait", "short", "flag"] as const;

const GLASSES = ["flint", "green", "amber"] as const;

const POURS = ["still", "spark", "cask"] as const;

const WAIT_CYCLE = [15, 30, 45] as const;

const RANK_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["vault", "rack"]);

const QUIET = new Set(["bin", "cave"]);

const HOUSE = new Set(["FLINT", "AMBER"]);

const EARLY = new Set(["vault", "bin"]);

const LANE_ORDER = ["hand", "clock", "mark", "join"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["manual", "auto"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ButteryTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glassName(raw: unknown): Exclude<GlassName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<GlassName, "blank">) : "";
}

function pourName(raw: unknown): Exclude<PourName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (POURS as readonly string[]).includes(text) ? (text as Exclude<PourName, "blank">) : "";
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

function inTray(card: ButterySlip, tray: ButteryTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function cellarIndex(cellar: string): number {
  return BUTTERY_CELLARS.indexOf(cellar as ButteryCellar);
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

export function cellarOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (BUTTERY_CELLARS as readonly string[]).includes(text) ? text : "";
}

/** The buttery wait is 15, 30, or 45 minutes. Anything else stays blank. */
export function butteryWait(raw: unknown): 15 | 30 | 45 | null {
  const value = Number(clip(raw, 2));
  return (WAIT_CYCLE as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Rank is 1, 3, 5, or 7. Anything else stays blank. */
export function butteryRank(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Glass is flint, green, or amber. The saved glass is FLINT, GREEN, or AMBER. */
export function glassOf(raw: unknown): string {
  const text = glassName(raw);
  return text ? text.toUpperCase() : "";
}

/** Pour is still, spark, or cask. A blank pour stays blank. */
export function pourOf(raw: unknown): string {
  return pourName(raw);
}

export function peakCellar(cellar: unknown): boolean {
  return PEAK.has(clip(cellar, 12).toLowerCase());
}

export function quietCellar(cellar: unknown): boolean {
  return QUIET.has(clip(cellar, 12).toLowerCase());
}

/** Early is vault and bin. Mid is rack. Late is cave. */
export function cellarBand(cellar: unknown): string {
  const text = cellarOf(cellar);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "rack") return "mid";
  return "late";
}

/** Signed distance from the slip cellar to the desk cellar. */
export function cellarGap(from: unknown, to: unknown): number | null {
  const left = cellarIndex(cellarOf(from));
  const right = cellarIndex(cellarOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseGlass(glass: unknown): boolean {
  return HOUSE.has(glassOf(glass));
}

export function activeCellar(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return cellarOf(text) || "all";
}

export function activeButteryWait(raw: unknown): string {
  const wait = butteryWait(raw);
  return wait === null ? "all" : String(wait);
}

export function activePour(raw: unknown, allow: readonly string[]): string {
  const text = pourOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeButteryRank(raw: unknown): string {
  const rank = butteryRank(raw);
  return rank === null ? "all" : String(rank);
}

export function activeGlass(raw: unknown): string {
  const text = glassName(raw);
  return text || "all";
}

export function moveButteryFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGlass(cards: readonly ButterySlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.glass) continue;
    counts.set(card.glass, (counts.get(card.glass) || 0) + 1);
  }
  let best = "FLINT";
  let score = 0;
  for (const glass of ["FLINT", "GREEN", "AMBER"]) {
    const count = counts.get(glass) || 0;
    if (count > score) {
      best = glass;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short wait. Afternoon asks for a long one. Saved waits win when any exist. */
export function suggestButteryWait(cards: readonly ButterySlip[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const wait of WAIT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 15;
  if (hour < 14) return 30;
  return 45;
}

/** Quiet hours suggest the vault. The rest of the day suggests the rack. */
export function suggestCellar(hour: number): ButteryCellar {
  return hour < 9 ? "vault" : "rack";
}

/** The steward with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairButterySteward(cards: readonly ButterySlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.steward.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readButteries(raw: unknown): ButterySlip[] {
  if (!Array.isArray(raw)) return [];
  const out: ButterySlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ButterySlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      steward: clip(row.steward, 24),
      cellar: cellarOf(row.cellar),
      wait: butteryWait(row.wait),
      glass: glassOf(row.glass),
      pour: pourOf(row.pour),
      rank: butteryRank(row.rank) ?? 1,
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

export function addButtery(
  cards: readonly ButterySlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    steward?: string;
    cellar?: string;
    wait?: unknown;
    glass?: string;
    pour?: string;
    rank?: unknown;
    tags?: string;
  },
): ButterySlip[] {
  const current = readButteries(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ButterySlip = {
    id,
    title,
    note: noteOf(card.note),
    steward: clip(card.steward, 24),
    cellar: cellarOf(card.cellar),
    wait: butteryWait(card.wait),
    glass: glassOf(card.glass),
    pour: pourOf(card.pour),
    rank: butteryRank(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly ButterySlip[], id: string, change: (card: ButterySlip) => ButterySlip): ButterySlip[] {
  return readButteries(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly ButterySlip[], ids: readonly string[], change: (card: ButterySlip) => ButterySlip): ButterySlip[] {
  const picked = new Set(ids);
  return readButteries(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editButtery(cards: readonly ButterySlip[], id: string, title: string): ButterySlip[] {
  const next = lineOf(title);
  if (!next) return readButteries(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editButteryNote(cards: readonly ButterySlip[], id: string, note: string): ButterySlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setButteryPin(cards: readonly ButterySlip[], id: string, pinned: boolean): ButterySlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setButteryPause(cards: readonly ButterySlip[], id: string, paused: boolean): ButterySlip[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setButterySeal(cards: readonly ButterySlip[], id: string, sealed: boolean): ButterySlip[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setButteryStar(cards: readonly ButterySlip[], id: string, flagged: boolean): ButterySlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setButteryGlass(cards: readonly ButterySlip[], id: string, glass: unknown): ButterySlip[] {
  const next = glassOf(glass);
  if (!next) return readButteries(cards);
  return mapCard(cards, id, (card) => (card.glass === next ? card : { ...card, glass: next, audit: "glass" }));
}

/** Pour steps still, spark, cask, then still again. A blank pour starts at still. */
export function cyclePour(cards: readonly ButterySlip[], id: string): ButterySlip[] {
  return mapCard(cards, id, (card) => {
    const at = POURS.indexOf(card.pour as (typeof POURS)[number]);
    const next = at < 0 ? POURS[0] : POURS[(at + 1) % POURS.length];
    return next === card.pour ? card : { ...card, pour: next, audit: "pour" };
  });
}

export function addButteryTag(cards: readonly ButterySlip[], id: string, tag: string): ButterySlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readButteries(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 15, 15 becomes 30, and 30 becomes 45. A wait of 45 stays. */
export function lengthenButtery(cards: readonly ButterySlip[], id: string): ButterySlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 45) return card;
    const next = card.wait === 30 ? 45 : card.wait === 15 ? 30 : 15;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 45, 45 becomes 30, and 30 becomes 15. A wait of 15 stays. */
export function shortenButtery(cards: readonly ButterySlip[], id: string): ButterySlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 15) return card;
    const next = card.wait === 30 ? 15 : card.wait === 45 ? 30 : 45;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseButtery(cards: readonly ButterySlip[], id: string): ButterySlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 1, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerButtery(cards: readonly ButterySlip[], id: string): ButterySlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkButteryPin(cards: readonly ButterySlip[], ids: readonly string[]): ButterySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkButterySeal(cards: readonly ButterySlip[], ids: readonly string[]): ButterySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkButterySpark(cards: readonly ButterySlip[], ids: readonly string[]): ButterySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pour: "spark", audit: "pour" }));
}

export function bulkButteryAmber(cards: readonly ButterySlip[], ids: readonly string[]): ButterySlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, glass: "AMBER", audit: "glass" }));
}

export function bulkButteryTag(cards: readonly ButterySlip[], ids: readonly string[], tag: string): ButterySlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readButteries(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly ButterySlip[], ids: readonly string[], index: number, change: (list: readonly ButterySlip[], id: string) => ButterySlip[]): ButterySlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readButteries(cards);
}

export function lengthenButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  return focused(cards, ids, index, lengthenButtery);
}

export function shortenButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  return focused(cards, ids, index, shortenButtery);
}

export function pourFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  return focused(cards, ids, index, cyclePour);
}

export function raiseButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  return focused(cards, ids, index, raiseButtery);
}

export function lowerButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  return focused(cards, ids, index, lowerButtery);
}

export function pinButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  const id = ids[index];
  if (!id) return readButteries(cards);
  const card = readButteries(cards).find((item) => item.id === id);
  return card ? setButteryPin(cards, id, !card.pinned) : readButteries(cards);
}

export function pauseButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  const id = ids[index];
  if (!id) return readButteries(cards);
  const card = readButteries(cards).find((item) => item.id === id);
  return card ? setButteryPause(cards, id, !card.paused) : readButteries(cards);
}

export function starButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number): ButterySlip[] {
  const id = ids[index];
  if (!id) return readButteries(cards);
  const card = readButteries(cards).find((item) => item.id === id);
  return card ? setButteryStar(cards, id, !card.flagged) : readButteries(cards);
}

export function tagButteryFocused(cards: readonly ButterySlip[], ids: readonly string[], index: number, tag: string): ButterySlip[] {
  const id = ids[index];
  return id ? addButteryTag(cards, id, tag) : readButteries(cards);
}

export function readButteryViews(raw: unknown): ButteryView[] {
  if (!Array.isArray(raw)) return [];
  const out: ButteryView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ButteryView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      steward: clip(row.steward, 24),
      glass: activeGlass(row.glass),
      pour: activePour(row.pour, POURS),
      cellar: activeCellar(row.cellar),
      wait: activeButteryWait(row.wait),
      rank: activeButteryRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addButteryView(
  views: readonly ButteryView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    steward?: string;
    glass?: string;
    pour?: string;
    cellar?: string;
    wait?: string;
    rank?: string;
  },
): ButteryView[] {
  const current = readButteryViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: ButteryView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    steward: clip(view.steward, 24),
    glass: activeGlass(view.glass),
    pour: activePour(view.pour, POURS),
    cellar: activeCellar(view.cellar),
    wait: activeButteryWait(view.wait),
    rank: activeButteryRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropButteryView(views: readonly ButteryView[], id: string): ButteryView[] {
  return readButteryViews(views).filter((view) => view.id !== id);
}

export function butteryDensity(raw: unknown): ButteryDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A slip more than one cellar behind the desk, at rank 1, is late. */
export function lateButtery(card: ButterySlip, deskCellar: unknown): boolean {
  const gap = cellarGap(card.cellar, deskCellar);
  return card.rank === 1 && gap !== null && gap > 1;
}

export function idleButtery(card: ButterySlip): boolean {
  return card.pour === "still" && quietCellar(card.cellar) && card.rank === 1;
}

export function briskButtery(card: ButterySlip): boolean {
  return card.rank === 7 && card.pour === "spark" && peakCellar(card.cellar);
}

export function restingButtery(card: ButterySlip): boolean {
  return card.wait === 45 && card.pour === "cask" && card.cellar === "cave";
}

/** A fifteen-minute wait on a peak cellar is overdue unless the slip is pinned. */
export function overdueButtery(card: ButterySlip): boolean {
  return card.wait === 15 && peakCellar(card.cellar) && !card.pinned;
}

export function visibleButteries(
  cards: readonly ButterySlip[],
  tray: ButteryTray,
  query: string,
  steward: string,
  glass: string,
  pour: string,
  cellar: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): ButterySlip[] {
  const text = query.trim().toLowerCase();
  const stewardOn = steward === "all" ? "" : steward.trim().toLowerCase();
  const glassOn = glass === "all" ? "" : glassOf(glass);
  const pourOn = pour === "all" ? "" : pourOf(pour);
  const cellarOn = cellar === "all" ? "" : activeCellar(cellar);
  const waitOn = wait === "all" ? "" : activeButteryWait(wait);
  const rankOn = rank === "all" ? "" : activeButteryRank(rank);
  return readButteries(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (stewardOn && card.steward.toLowerCase() !== stewardOn) return false;
    if (glassOn && card.glass !== glassOn) return false;
    if (pourOn && card.pour !== pourOn) return false;
    if (cellarOn === "peak" && !peakCellar(card.cellar)) return false;
    if (cellarOn === "quiet" && !quietCellar(card.cellar)) return false;
    if (cellarOn && cellarOn !== "peak" && cellarOn !== "quiet" && card.cellar !== cellarOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseGlass(card.glass)) return false;
    if (peakOnly && !peakCellar(card.cellar)) return false;
    if (quietOnly && !quietCellar(card.cellar)) return false;
    return true;
  });
}

export function sortButteries(cards: readonly ButterySlip[], sort: ButterySort): ButterySlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "steward") {
      const steward = a.steward.localeCompare(b.steward);
      if (steward) return steward;
    }
    const cellar = (cellarIndex(a.cellar) < 0 ? 99 : cellarIndex(a.cellar)) - (cellarIndex(b.cellar) < 0 ? 99 : cellarIndex(b.cellar));
    if (cellar) return cellar;
    return a.title.localeCompare(b.title);
  });
}

export function butteryCounts(cards: readonly ButterySlip[], shown: readonly ButterySlip[], deskCellar: unknown): ButteryCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakCellar(card.cellar)).length,
    quiet: open.filter((card) => quietCellar(card.cellar)).length,
    soon: open.filter((card) => card.wait === 15).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseGlass(card.glass)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.cellar && card.cellar === cellarOf(deskCellar)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleButtery(card)).length,
    brisk: open.filter((card) => briskButtery(card)).length,
    resting: open.filter((card) => restingButtery(card)).length,
    overdue: open.filter((card) => overdueButtery(card)).length,
  };
}

export function clashCellarCount(cards: readonly ButterySlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.cellar);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cellar === card.cellar && other.rank === card.rank)).length;
}

export function neighborButteryCount(cards: readonly ButterySlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestButterySteward(cards: readonly ButterySlip[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.steward);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.steward.toLowerCase() === card.steward.toLowerCase()).length;
    if (count > score) {
      best = card.steward;
      score = count;
    }
  }
  return best;
}

export function reminderButteries(cards: readonly ButterySlip[]): ButterySlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 15 || card.wait === 30));
}

export function idleButteries(cards: readonly ButterySlip[]): ButterySlip[] {
  return cards.filter((card) => inTray(card, "open") && idleButtery(card));
}

export function butteryTimeline(cards: readonly ButterySlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function butteryBars(cards: readonly ButterySlip[]): { cellar: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return BUTTERY_CELLARS.map((cellar) => ({ cellar, count: open.filter((card) => card.cellar === cellar).length }));
}

export function butteryStewards(cards: readonly ButterySlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.steward || out.some((item) => item.toLowerCase() === card.steward.toLowerCase())) continue;
    out.push(card.steward);
  }
  return out;
}

export function butteryCopy(card: ButterySlip): string {
  return [card.title, card.steward, card.cellar, card.glass, card.pour, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function butteryShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function butteryCsv(cards: readonly ButterySlip[], deskCellar: unknown): string {
  const lines = ["title,steward,cellar,glass,pour,wait,rank,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readButteries(cards)) {
    const gap = cellarGap(card.cellar, deskCellar);
    lines.push([
      csvCell(card.title),
      csvCell(card.steward),
      card.cellar,
      card.glass,
      card.pour,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateButtery(card, deskCellar) ? "1" : "0",
      idleButtery(card) ? "1" : "0",
      peakCellar(card.cellar) ? "1" : "0",
      quietCellar(card.cellar) ? "1" : "0",
      houseGlass(card.glass) ? "1" : "0",
      cellarBand(card.cellar),
      briskButtery(card) ? "1" : "0",
      restingButtery(card) ? "1" : "0",
      overdueButtery(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function sourceRecord(raw: SourceValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: SourceValue): boolean {
  const row = sourceRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type SourceParts = { letters: string; source: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function sourceText(raw: SourceValue): string {
  if (hasBlocked(raw)) return "";
  const row = sourceRecord(raw);
  if (row && !("leadInvalidSource" in row) && !("source" in row)) return "";
  return row ? clip(row.leadInvalidSource ?? row.source, 32) : clip(raw, 32);
}

function sourceParts(raw: SourceValue): SourceParts | null {
  const text = sourceText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    source: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked field clears the plate. A real source code is set. A blank or broken code is clear. */
export function sourceState(raw: SourceValue): SourceState {
  if (hasBlocked(raw)) return "";
  const row = sourceRecord(raw);
  if (row && !("leadInvalidSource" in row) && !("source" in row)) return "";
  return sourceParts(raw) ? "set" : "clear";
}

/** MANUAL is a hand, AUTO is a clock, a separator is a join, and a plain word is a mark. */
export function sourceLane(raw: SourceValue): SourceLane {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  if (!parts) return "";
  const key = parts.source.toLowerCase();
  if (key === "manual") return "hand";
  if (key === "auto") return "clock";
  if (parts.seps >= 1) return "join";
  return "mark";
}

/** The first four letters. */
export function sourceStamp(raw: SourceValue): string {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return parts ? parts.letters.slice(0, 4).toUpperCase() : "";
}

/** A hand is champagne, a clock is graphite, and other codes follow the last letter. */
export function sourceHue(raw: SourceValue): SourceHue {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  if (!parts) return "";
  const lane = sourceLane(raw);
  if (lane === "hand") return "champagne";
  if (lane === "clock") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function sourceTwin(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function sourceWide(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function sourceNotch(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function sourceEcho(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function sourceLeap(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && parts.letters.length === 6);
}

export function sourceSlash(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function sourceKnown(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.source.toLowerCase()));
}

export function sourceCap(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.source[0] || ""));
}

export function sourceTail(raw: SourceValue): boolean {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function sourceScore(raw: SourceValue): number {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return parts ? parts.score : 0;
}

export function sourceStep(raw: SourceValue): number {
  const parts = sourceState(raw) === "set" ? sourceParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function sourceLanes(rows: readonly SourceRow[]): SourceLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = sourceLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSource(rows: readonly SourceRow[]): string {
  const bars = sourceLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSourceHue(rows: readonly SourceRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = sourceHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedSourceCount(rows: readonly SourceRow[]): number {
  const marks = rows.map((row) => sourceStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneSourceCount(rows: readonly SourceRow[], lane: SourceLane): number {
  return rows.filter((row) => sourceLane(row.note) === lane).length;
}

export function sourceShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSourceLanes(rows: readonly SourceRow[]): string[] {
  return sourceLanes(rows).map((line) => line.lane);
}

export function readHiddenSources(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSources(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSource(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSourceReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSourceReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSourceLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleSources(
  rows: readonly SourceRow[],
  lane: string,
  hue: string,
  query: string,
  review: SourceReview,
  reviewed: readonly string[],
  shape: SourceShape,
): SourceRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (sourceState(row.note) === "") return false;
    const found = sourceLane(row.note);
    const hueName = sourceHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${sourceText(row.note)} ${sourceStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "hand" && found !== "hand") return false;
    if (shape === "clock" && found !== "clock") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "join" && found !== "join") return false;
    if (shape === "wide" && !sourceWide(row.note)) return false;
    if (shape === "notch" && !sourceNotch(row.note)) return false;
    if (shape === "leap" && !sourceLeap(row.note)) return false;
    if (shape === "slash" && !sourceSlash(row.note)) return false;
    if (shape === "twin" && !sourceTwin(row.note)) return false;
    if (shape === "known" && !sourceKnown(row.note)) return false;
    if (shape === "echo" && !sourceEcho(row.note)) return false;
    return true;
  });
}

export function sourceCopy(raw: SourceValue): string {
  return [sourceStamp(raw), sourceLane(raw), sourceHue(raw)].filter(Boolean).join(" ");
}

export function sourceLanesCsv(rows: readonly SourceRow[]): string {
  const lines = ["lane,count"];
  for (const line of sourceLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function sourceRowsCsv(rows: readonly SourceRow[], reviewed: readonly string[]): string {
  const lines = ["name,source,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (sourceState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(sourceText(row.note)),
      sourceStamp(row.note),
      sourceLane(row.note),
      sourceHue(row.note),
      String(sourceStep(row.note)),
      sourceEcho(row.note) ? "1" : "0",
      sourceWide(row.note) ? "1" : "0",
      sourceNotch(row.note) ? "1" : "0",
      sourceLeap(row.note) ? "1" : "0",
      sourceSlash(row.note) ? "1" : "0",
      sourceTwin(row.note) ? "1" : "0",
      sourceKnown(row.note) ? "1" : "0",
      sourceCap(row.note) ? "1" : "0",
      sourceTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
