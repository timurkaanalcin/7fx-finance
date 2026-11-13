/**
 * Larder slips for a pantry follow-up book, and title plates already stored as jobTitle.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_larder_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   station text not null default '',
 *   grain text not null default '',
 *   pace text not null default '',
 *   wait_min integer,
 *   rank_no integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_title_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_title_review (
 *   trader_id text primary key
 * );
 */

export const LRD_KEY = "crmv4-larder-slip";
export const LRD_VIEW_KEY = "crmv4-larder-views";
export const LRD_DENSITY_KEY = "crmv4-larder-density";
export const TTL_KEY = "crmv4-title-hide";
export const TTL_REVIEW_KEY = "crmv4-title-review";

export const LARDER_STATIONS = ["bin", "crock", "rack", "loft"] as const;

export type LarderStation = (typeof LARDER_STATIONS)[number];

export type GrainName = "blank" | "oat" | "rye" | "wheat";

export type PaceName = "blank" | "slow" | "even" | "brisk";

export type LarderTray = "open" | "pause" | "seal";

export type LarderDensity = "roomy" | "close";

export type LarderSort = "station" | "keeper";

export type LarderSlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  station: string;
  wait: number | null;
  grain: string;
  pace: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type LarderView = {
  id: string;
  name: string;
  tray: LarderTray;
  query: string;
  keeper: string;
  grain: string;
  pace: string;
  station: string;
  wait: string;
  rank: string;
};

export type LarderCounts = {
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

export type TitleLane = "" | "chip" | "pair" | "post" | "rail";

export type TitleHue = "" | "ivory" | "graphite" | "champagne";

export type TitleState = "" | "clear" | "set";

export type TitleShape = "all" | "chip" | "pair" | "post" | "rail" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type TitleReview = "all" | "reviewed" | "fresh";

export type TitleValue = string | { jobTitle?: unknown; title?: unknown; [key: string]: unknown } | null | undefined;

export type TitleRow = { id: string; label: string; note: TitleValue };

export type TitleLaneLine = { lane: string; count: number };

export const ROUND262_FEATURES = [
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "titles",
  "title-csv",
] as const;

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "pause", "resume", "seal", "open", "grain", "tag", "rank", "wait", "short", "flag"] as const;

const GRAINS = ["oat", "rye", "wheat"] as const;

const PACES = ["slow", "even", "brisk"] as const;

const WAIT_CYCLE = [12, 24, 36] as const;

const RANK_CYCLE = [2, 4, 6, 8] as const;

const PEAK = new Set(["crock", "rack"]);

const QUIET = new Set(["bin", "loft"]);

const HOUSE = new Set(["OAT", "WHEAT"]);

const EARLY = new Set(["bin", "crock"]);

const LANE_ORDER = ["chip", "pair", "post", "rail"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set([
  "owner_ceo",
  "sales_head",
  "marketing_head",
  "it_specialist",
  "project_manager",
  "analyst",
  "sales_manager",
  "marketer",
  "administrator",
  "sales_mgr",
  "retention_manager",
  "other",
]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LarderTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function grainName(raw: unknown): Exclude<GrainName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GRAINS as readonly string[]).includes(text) ? (text as Exclude<GrainName, "blank">) : "";
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
    if (!/^[xyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: LarderSlip, tray: LarderTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return LARDER_STATIONS.indexOf(station as LarderStation);
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

export function stationOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (LARDER_STATIONS as readonly string[]).includes(text) ? text : "";
}

/** The larder wait is 12, 24, or 36 minutes. Anything else stays blank. */
export function larderWait(raw: unknown): 12 | 24 | 36 | null {
  const value = Number(clip(raw, 2));
  return (WAIT_CYCLE as readonly number[]).includes(value) ? (value as 12 | 24 | 36) : null;
}

/** Rank is 2, 4, 6, or 8. Anything else stays blank. */
export function larderRank(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Grain is oat, rye, or wheat. The saved grain is OAT, RYE, or WHEAT. */
export function grainOf(raw: unknown): string {
  const text = grainName(raw);
  return text ? text.toUpperCase() : "";
}

/** Pace is slow, even, or brisk. A blank pace stays blank. */
export function paceOf(raw: unknown): string {
  return paceName(raw);
}

export function peakStation(station: unknown): boolean {
  return PEAK.has(clip(station, 12).toLowerCase());
}

export function quietStation(station: unknown): boolean {
  return QUIET.has(clip(station, 12).toLowerCase());
}

/** Early is bin and crock. Mid is rack. Late is loft. */
export function stationBand(station: unknown): string {
  const text = stationOf(station);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "rack") return "mid";
  return "late";
}

/** Signed distance from the slip station to the desk station. */
export function stationGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(stationOf(from));
  const right = stationIndex(stationOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseGrain(grain: unknown): boolean {
  return HOUSE.has(grainOf(grain));
}

export function activeStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return stationOf(text) || "all";
}

export function activeLarderWait(raw: unknown): string {
  const wait = larderWait(raw);
  return wait === null ? "all" : String(wait);
}

export function activePace(raw: unknown, allow: readonly string[]): string {
  const text = paceOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLarderRank(raw: unknown): string {
  const rank = larderRank(raw);
  return rank === null ? "all" : String(rank);
}

export function activeGrain(raw: unknown): string {
  const text = grainName(raw);
  return text || "all";
}

export function moveLarderFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestGrain(cards: readonly LarderSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.grain) continue;
    counts.set(card.grain, (counts.get(card.grain) || 0) + 1);
  }
  let best = "OAT";
  let score = 0;
  for (const grain of ["OAT", "RYE", "WHEAT"]) {
    const count = counts.get(grain) || 0;
    if (count > score) {
      best = grain;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short wait. A midday desk asks for a long one. Saved waits win when any exist. */
export function suggestLarderWait(cards: readonly LarderSlip[], hour: number): 12 | 24 | 36 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 12 | 24 | 36 | null = null;
  let score = 0;
  for (const wait of WAIT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 5) return 12;
  if (hour < 11) return 24;
  return 36;
}

/** Quiet hours suggest the bin. The rest of the day suggests the rack. */
export function suggestStation(hour: number): LarderStation {
  return hour < 8 ? "bin" : "rack";
}

/** The keeper with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairLarderKeeper(cards: readonly LarderSlip[], roster: string): string {
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

export function readLarders(raw: unknown): LarderSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: LarderSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LarderSlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      station: stationOf(row.station),
      wait: larderWait(row.wait),
      grain: grainOf(row.grain),
      pace: paceOf(row.pace),
      rank: larderRank(row.rank) ?? 2,
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

export function addLarder(
  cards: readonly LarderSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    station?: string;
    wait?: unknown;
    grain?: string;
    pace?: string;
    rank?: unknown;
    tags?: string;
  },
): LarderSlip[] {
  const current = readLarders(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: LarderSlip = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    station: stationOf(card.station),
    wait: larderWait(card.wait),
    grain: grainOf(card.grain),
    pace: paceOf(card.pace),
    rank: larderRank(card.rank) ?? 2,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly LarderSlip[], id: string, change: (card: LarderSlip) => LarderSlip): LarderSlip[] {
  return readLarders(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly LarderSlip[], ids: readonly string[], change: (card: LarderSlip) => LarderSlip): LarderSlip[] {
  const picked = new Set(ids);
  return readLarders(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editLarder(cards: readonly LarderSlip[], id: string, title: string): LarderSlip[] {
  const next = lineOf(title);
  if (!next) return readLarders(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editLarderNote(cards: readonly LarderSlip[], id: string, note: string): LarderSlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setLarderPin(cards: readonly LarderSlip[], id: string, pinned: boolean): LarderSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setLarderPause(cards: readonly LarderSlip[], id: string, paused: boolean): LarderSlip[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setLarderSeal(cards: readonly LarderSlip[], id: string, sealed: boolean): LarderSlip[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setLarderStar(cards: readonly LarderSlip[], id: string, flagged: boolean): LarderSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setLarderGrain(cards: readonly LarderSlip[], id: string, grain: unknown): LarderSlip[] {
  const next = grainOf(grain);
  if (!next) return readLarders(cards);
  return mapCard(cards, id, (card) => (card.grain === next ? card : { ...card, grain: next, audit: "grain" }));
}

/** Pace steps slow, even, brisk, then slow again. A blank pace starts at slow. */
export function cyclePace(cards: readonly LarderSlip[], id: string): LarderSlip[] {
  return mapCard(cards, id, (card) => {
    const at = PACES.indexOf(card.pace as (typeof PACES)[number]);
    const next = at < 0 ? PACES[0] : PACES[(at + 1) % PACES.length];
    return next === card.pace ? card : { ...card, pace: next, audit: "pace" };
  });
}

export function addLarderTag(cards: readonly LarderSlip[], id: string, tag: string): LarderSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readLarders(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 12, 12 becomes 24, and 24 becomes 36. A wait of 36 stays. */
export function lengthenLarder(cards: readonly LarderSlip[], id: string): LarderSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 36) return card;
    const next = card.wait === 24 ? 36 : card.wait === 12 ? 24 : 12;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 36, 36 becomes 24, and 24 becomes 12. A wait of 12 stays. */
export function shortenLarder(cards: readonly LarderSlip[], id: string): LarderSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 12) return card;
    const next = card.wait === 24 ? 12 : card.wait === 36 ? 24 : 36;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseLarder(cards: readonly LarderSlip[], id: string): LarderSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 2, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerLarder(cards: readonly LarderSlip[], id: string): LarderSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkLarderPin(cards: readonly LarderSlip[], ids: readonly string[]): LarderSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkLarderSeal(cards: readonly LarderSlip[], ids: readonly string[]): LarderSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkLarderBrisk(cards: readonly LarderSlip[], ids: readonly string[]): LarderSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pace: "brisk", audit: "pace" }));
}

export function bulkLarderWheat(cards: readonly LarderSlip[], ids: readonly string[]): LarderSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, grain: "WHEAT", audit: "grain" }));
}

export function bulkLarderTag(cards: readonly LarderSlip[], ids: readonly string[], tag: string): LarderSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readLarders(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly LarderSlip[], ids: readonly string[], index: number, change: (list: readonly LarderSlip[], id: string) => LarderSlip[]): LarderSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readLarders(cards);
}

export function lengthenLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  return focused(cards, ids, index, lengthenLarder);
}

export function shortenLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  return focused(cards, ids, index, shortenLarder);
}

export function paceFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  return focused(cards, ids, index, cyclePace);
}

export function raiseLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  return focused(cards, ids, index, raiseLarder);
}

export function lowerLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  return focused(cards, ids, index, lowerLarder);
}

export function pinLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  const id = ids[index];
  if (!id) return readLarders(cards);
  const card = readLarders(cards).find((item) => item.id === id);
  return card ? setLarderPin(cards, id, !card.pinned) : readLarders(cards);
}

export function pauseLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  const id = ids[index];
  if (!id) return readLarders(cards);
  const card = readLarders(cards).find((item) => item.id === id);
  return card ? setLarderPause(cards, id, !card.paused) : readLarders(cards);
}

export function starLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number): LarderSlip[] {
  const id = ids[index];
  if (!id) return readLarders(cards);
  const card = readLarders(cards).find((item) => item.id === id);
  return card ? setLarderStar(cards, id, !card.flagged) : readLarders(cards);
}

export function tagLarderFocused(cards: readonly LarderSlip[], ids: readonly string[], index: number, tag: string): LarderSlip[] {
  const id = ids[index];
  return id ? addLarderTag(cards, id, tag) : readLarders(cards);
}

export function readLarderViews(raw: unknown): LarderView[] {
  if (!Array.isArray(raw)) return [];
  const out: LarderView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LarderView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      grain: activeGrain(row.grain),
      pace: activePace(row.pace, PACES),
      station: activeStation(row.station),
      wait: activeLarderWait(row.wait),
      rank: activeLarderRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLarderView(
  views: readonly LarderView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    grain?: string;
    pace?: string;
    station?: string;
    wait?: string;
    rank?: string;
  },
): LarderView[] {
  const current = readLarderViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: LarderView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    grain: activeGrain(view.grain),
    pace: activePace(view.pace, PACES),
    station: activeStation(view.station),
    wait: activeLarderWait(view.wait),
    rank: activeLarderRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropLarderView(views: readonly LarderView[], id: string): LarderView[] {
  return readLarderViews(views).filter((view) => view.id !== id);
}

export function larderDensity(raw: unknown): LarderDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A slip more than one station behind the desk, at rank 2, is late. */
export function lateLarder(card: LarderSlip, deskStation: unknown): boolean {
  const gap = stationGap(card.station, deskStation);
  return card.rank === 2 && gap !== null && gap > 1;
}

export function idleLarder(card: LarderSlip): boolean {
  return card.pace === "slow" && quietStation(card.station) && card.rank === 2;
}

export function briskLarder(card: LarderSlip): boolean {
  return card.rank === 8 && card.pace === "brisk" && peakStation(card.station);
}

export function restingLarder(card: LarderSlip): boolean {
  return card.wait === 36 && card.pace === "even" && card.station === "loft";
}

/** A twelve-minute wait on a peak station is overdue unless the slip is pinned. */
export function overdueLarder(card: LarderSlip): boolean {
  return card.wait === 12 && peakStation(card.station) && !card.pinned;
}

export function visibleLarders(
  cards: readonly LarderSlip[],
  tray: LarderTray,
  query: string,
  keeper: string,
  grain: string,
  pace: string,
  station: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): LarderSlip[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const grainOn = grain === "all" ? "" : grainOf(grain);
  const paceOn = pace === "all" ? "" : paceOf(pace);
  const stationOn = station === "all" ? "" : activeStation(station);
  const waitOn = wait === "all" ? "" : activeLarderWait(wait);
  const rankOn = rank === "all" ? "" : activeLarderRank(rank);
  return readLarders(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (grainOn && card.grain !== grainOn) return false;
    if (paceOn && card.pace !== paceOn) return false;
    if (stationOn === "peak" && !peakStation(card.station)) return false;
    if (stationOn === "quiet" && !quietStation(card.station)) return false;
    if (stationOn && stationOn !== "peak" && stationOn !== "quiet" && card.station !== stationOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseGrain(card.grain)) return false;
    if (peakOnly && !peakStation(card.station)) return false;
    if (quietOnly && !quietStation(card.station)) return false;
    return true;
  });
}

export function sortLarders(cards: readonly LarderSlip[], sort: LarderSort): LarderSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const station = (stationIndex(a.station) < 0 ? 99 : stationIndex(a.station)) - (stationIndex(b.station) < 0 ? 99 : stationIndex(b.station));
    if (station) return station;
    return a.title.localeCompare(b.title);
  });
}

export function larderCounts(cards: readonly LarderSlip[], shown: readonly LarderSlip[], deskStation: unknown): LarderCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakStation(card.station)).length,
    quiet: open.filter((card) => quietStation(card.station)).length,
    soon: open.filter((card) => card.wait === 12).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseGrain(card.grain)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.station && card.station === stationOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleLarder(card)).length,
    brisk: open.filter((card) => briskLarder(card)).length,
    resting: open.filter((card) => restingLarder(card)).length,
    overdue: open.filter((card) => overdueLarder(card)).length,
  };
}

export function clashStationCount(cards: readonly LarderSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.station);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.station === card.station && other.rank === card.rank)).length;
}

export function neighborLarderCount(cards: readonly LarderSlip[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestLarderKeeper(cards: readonly LarderSlip[]): string {
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

export function reminderLarders(cards: readonly LarderSlip[]): LarderSlip[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 12 || card.wait === 24));
}

export function idleLarders(cards: readonly LarderSlip[]): LarderSlip[] {
  return cards.filter((card) => inTray(card, "open") && idleLarder(card));
}

export function larderTimeline(cards: readonly LarderSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function larderBars(cards: readonly LarderSlip[]): { station: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return LARDER_STATIONS.map((station) => ({ station, count: open.filter((card) => card.station === station).length }));
}

export function larderKeepers(cards: readonly LarderSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function larderCopy(card: LarderSlip): string {
  return [card.title, card.keeper, card.station, card.grain, card.pace, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function larderShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function larderCsv(cards: readonly LarderSlip[], deskStation: unknown): string {
  const lines = ["title,keeper,station,grain,pace,wait,rank,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readLarders(cards)) {
    const gap = stationGap(card.station, deskStation);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.station,
      card.grain,
      card.pace,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLarder(card, deskStation) ? "1" : "0",
      idleLarder(card) ? "1" : "0",
      peakStation(card.station) ? "1" : "0",
      quietStation(card.station) ? "1" : "0",
      houseGrain(card.grain) ? "1" : "0",
      stationBand(card.station),
      briskLarder(card) ? "1" : "0",
      restingLarder(card) ? "1" : "0",
      overdueLarder(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function titleRecord(raw: TitleValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: TitleValue): boolean {
  const row = titleRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type TitleParts = { letters: string; source: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function titleSource(raw: TitleValue): string {
  if (hasBlocked(raw)) return "";
  const row = titleRecord(raw);
  if (row && !("jobTitle" in row) && !("title" in row)) return "";
  return row ? clip(row.jobTitle ?? row.title, 48) : clip(raw, 48);
}

function titleParts(raw: TitleValue): TitleParts | null {
  const text = titleSource(raw);
  if (!/^[A-Za-z][A-Za-z0-9_ /-]{2,47}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3 || letters.length > 24) return null;
  const seps = (text.match(/[_ /\-]/g) || []).length;
  return {
    letters,
    source: text,
    wide: /\s/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked field clears the plate. A real job title is set. A blank or broken title is clear. */
export function titleState(raw: TitleValue): TitleState {
  if (hasBlocked(raw)) return "";
  const row = titleRecord(raw);
  if (row && !("jobTitle" in row) && !("title" in row)) return "";
  return titleParts(raw) ? "set" : "clear";
}

/** A short word is a chip, a long word is a post, one join is a pair, and two joins are a rail. */
export function titleLane(raw: TitleValue): TitleLane {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  if (!parts) return "";
  if (parts.seps >= 2) return "rail";
  if (parts.seps === 1) return "pair";
  if (parts.letters.length <= 8) return "chip";
  return "post";
}

/** The last four letters. */
export function titleStamp(raw: TitleValue): string {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return parts ? parts.letters.slice(-4).toUpperCase() : "";
}

/** A last letter A–I is ivory, J–R graphite, and S–Z champagne. */
export function titleHue(raw: TitleValue): TitleHue {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  if (!parts) return "";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 73) return "ivory";
  if (code >= 74 && code <= 82) return "graphite";
  return "champagne";
}

/** Two identical letters stand together. */
export function titleTwin(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function titleWide(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function titleNotch(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function titleEcho(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function titleLeap(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && parts.letters.length === 9);
}

export function titleSlash(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function titleKnown(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.source.toLowerCase()));
}

export function titleCap(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.source[0] || ""));
}

export function titleTail(raw: TitleValue): boolean {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function titleScore(raw: TitleValue): number {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return parts ? parts.score : 0;
}

export function titleStep(raw: TitleValue): number {
  const parts = titleState(raw) === "set" ? titleParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function titleLanes(rows: readonly TitleRow[]): TitleLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = titleLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTitle(rows: readonly TitleRow[]): string {
  const bars = titleLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingTitleHue(rows: readonly TitleRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = titleHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedTitleCount(rows: readonly TitleRow[]): number {
  const marks = rows.map((row) => titleStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneTitleCount(rows: readonly TitleRow[], lane: TitleLane): number {
  return rows.filter((row) => titleLane(row.note) === lane).length;
}

export function titleShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTitleLanes(rows: readonly TitleRow[]): string[] {
  return titleLanes(rows).map((line) => line.lane);
}

export function readHiddenTitles(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTitles(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTitle(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTitleReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTitleReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTitleLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleTitles(
  rows: readonly TitleRow[],
  lane: string,
  hue: string,
  query: string,
  review: TitleReview,
  reviewed: readonly string[],
  shape: TitleShape,
): TitleRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (titleState(row.note) === "") return false;
    const found = titleLane(row.note);
    const hueName = titleHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${titleSource(row.note)} ${titleStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "chip" && found !== "chip") return false;
    if (shape === "pair" && found !== "pair") return false;
    if (shape === "post" && found !== "post") return false;
    if (shape === "rail" && found !== "rail") return false;
    if (shape === "wide" && !titleWide(row.note)) return false;
    if (shape === "notch" && !titleNotch(row.note)) return false;
    if (shape === "leap" && !titleLeap(row.note)) return false;
    if (shape === "slash" && !titleSlash(row.note)) return false;
    if (shape === "twin" && !titleTwin(row.note)) return false;
    if (shape === "known" && !titleKnown(row.note)) return false;
    if (shape === "echo" && !titleEcho(row.note)) return false;
    return true;
  });
}

export function titleCopy(raw: TitleValue): string {
  return [titleStamp(raw), titleLane(raw), titleHue(raw)].filter(Boolean).join(" ");
}

export function titleLanesCsv(rows: readonly TitleRow[]): string {
  const lines = ["lane,count"];
  for (const line of titleLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function titleRowsCsv(rows: readonly TitleRow[], reviewed: readonly string[]): string {
  const lines = ["name,title,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (titleState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(titleSource(row.note)),
      titleStamp(row.note),
      titleLane(row.note),
      titleHue(row.note),
      String(titleStep(row.note)),
      titleEcho(row.note) ? "1" : "0",
      titleWide(row.note) ? "1" : "0",
      titleNotch(row.note) ? "1" : "0",
      titleLeap(row.note) ? "1" : "0",
      titleSlash(row.note) ? "1" : "0",
      titleTwin(row.note) ? "1" : "0",
      titleKnown(row.note) ? "1" : "0",
      titleCap(row.note) ? "1" : "0",
      titleTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
