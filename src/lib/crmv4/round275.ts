/**
 * Chronometer beats for a boxed time book, and anchor plates already stored as affiliateA.
 * Watches are box, gimbal, fusee, and rate. Escapements are lever, detent, and cylinder.
 * Rates are 0, 2, or 6. Beats are 2, 4, 8, or 16.
 * HOUSE is a loft and PARTNER is a quay. AFF is a yard. A separator or a digit is a pier.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_chrono_beat (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   watch text not null default '',
 *   finish text not null default '',
 *   escapement text not null default '',
 *   rate_no integer,
 *   beat_no integer not null default 2,
 *   tags text not null default '',
 *   wound boolean not null default false,
 *   locked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_anchor_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_anchor_review (
 *   trader_id text primary key
 * );
 */

export const CBT_KEY = "crmv4-chrono-beat";
export const CBT_VIEW_KEY = "crmv4-chrono-views";
export const CBT_DENSITY_KEY = "crmv4-chrono-density";
export const ANK_KEY = "crmv4-anchor-hide";
export const ANK_REVIEW_KEY = "crmv4-anchor-review";

export const CHRONO_WATCHES = ["box", "gimbal", "fusee", "rate"] as const;

export type ChronoWatch = (typeof CHRONO_WATCHES)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type EscapeName = "blank" | "lever" | "detent" | "cylinder";

export type BeatTray = "bench" | "safe" | "case";

export type BeatDensity = "airy" | "tight";

export type BeatSort = "watch" | "keeper";

export type ChronoBeat = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  watch: string;
  rate: number | null;
  finish: string;
  escapement: string;
  beat: number;
  tags: string[];
  wound: boolean;
  locked: boolean;
  cased: boolean;
  flagged: boolean;
  audit: string;
};

export type BeatView = {
  id: string;
  name: string;
  tray: BeatTray;
  query: string;
  keeper: string;
  finish: string;
  escapement: string;
  watch: string;
  rate: string;
  beat: string;
};

export type BeatCounts = {
  bench: number;
  safe: number;
  case: number;
  wound: number;
  keen: number;
  still: number;
  soon: number;
  beat: number;
  house: number;
  rate: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type AnchorLane = "" | "quay" | "loft" | "hall" | "closet" | "yard" | "pier";

export type AnchorHue = "" | "ivory" | "graphite" | "champagne";

export type AnchorState = "" | "clear" | "set";

export type AnchorShape = "all" | "quay" | "loft" | "hall" | "closet" | "yard" | "pier" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type AnchorReview = "all" | "reviewed" | "fresh";

export type AnchorValue = string | { affiliateA?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type AnchorRow = { id: string; label: string; note: AnchorValue };

export type AnchorLaneLine = { lane: string; count: number };

export const ROUND275_FEATURES = [
  "save",
  "note",
  "trays",
  "wind",
  "rate",
  "case",
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
  "anchor",
  "anchor-csv",
] as const;

const AUDITS = ["save", "edit", "note", "escape", "wind", "unwind", "lock", "resume", "case", "open", "finish", "tag", "beat", "rate", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const TRAINS = ["lever", "detent", "cylinder"] as const;

const RATE_CYCLE = [0, 2, 6] as const;

const BEAT_CYCLE = [2, 4, 8, 16] as const;

const KEEN = new Set(["fusee", "rate"]);

const STILL = new Set(["box", "gimbal"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const DAWN = new Set(["box"]);

const LANE_ORDER = ["quay", "loft", "hall", "closet", "yard", "pier"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["house", "partner", "demo", "aff-100", "aff-200", "brand"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BeatTray {
  return raw === "safe" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function escapeName(raw: unknown): Exclude<EscapeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TRAINS as readonly string[]).includes(text) ? (text as Exclude<EscapeName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[qr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: ChronoBeat, tray: BeatTray): boolean {
  if (tray === "safe") return card.locked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.locked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function watchIndex(watch: string): number {
  return CHRONO_WATCHES.indexOf(watch as ChronoWatch);
}

function beatIndex(beat: number): number {
  return BEAT_CYCLE.indexOf(beat as (typeof BEAT_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function watchOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CHRONO_WATCHES as readonly string[]).includes(text) ? text : "";
}

/** Rate is 0, 2, or 6 seconds a day. Anything else stays blank. */
export function chronoRate(raw: unknown): 0 | 2 | 6 | null {
  const value = Number(clip(raw, 2));
  return (RATE_CYCLE as readonly number[]).includes(value) ? (value as 0 | 2 | 6) : null;
}

/** Beat is 2, 4, 8, or 16. Anything else stays blank. */
export function chronoBeat(raw: unknown): 2 | 4 | 8 | 16 | null {
  const value = Number(clip(raw, 2));
  return (BEAT_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 8 | 16) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function metalOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Escapement is lever, detent, or cylinder. A blank escapement stays blank. */
export function escapeOf(raw: unknown): string {
  return escapeName(raw);
}

export function keenWatch(watch: unknown): boolean {
  return KEEN.has(clip(watch, 12).toLowerCase());
}

export function stillWatch(watch: unknown): boolean {
  return STILL.has(clip(watch, 12).toLowerCase());
}

/** Dawn is the box. Noon is the gimbal. Dusk is the fusee. Night is the rate. */
export function watchBand(watch: unknown): string {
  const text = watchOf(watch);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "gimbal") return "noon";
  if (text === "fusee") return "dusk";
  return "night";
}

/** Signed distance from one watch to the desk watch. */
export function watchGap(from: unknown, to: unknown): number | null {
  const left = watchIndex(watchOf(from));
  const right = watchIndex(watchOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseMetal(finish: unknown): boolean {
  return HOUSE.has(metalOf(finish));
}

export function activeWatch(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return watchOf(text) || "all";
}

export function activeRate(raw: unknown): string {
  const rate = chronoRate(raw);
  return rate === null ? "all" : String(rate);
}

export function activeEscape(raw: unknown, allow: readonly string[]): string {
  const text = escapeOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBeat(raw: unknown): string {
  const beat = chronoBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeMetal(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveChronoFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestMetal(cards: readonly ChronoBeat[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "IVORY";
  let score = 0;
  for (const finish of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(finish) || 0;
    if (count > score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before seven, suggest a mean rate. Through the afternoon, two seconds. Evening asks for six. Saved rates win when any exist. */
export function suggestRate(cards: readonly ChronoBeat[], hour: number): 0 | 2 | 6 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || card.rate === null) continue;
    counts.set(card.rate, (counts.get(card.rate) || 0) + 1);
  }
  let best: 0 | 2 | 6 | null = null;
  let score = 0;
  for (const rate of RATE_CYCLE) {
    const count = counts.get(rate) || 0;
    if (count > score) {
      best = rate;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 7) return 0;
  if (hour < 15) return 2;
  return 6;
}

/** Before nine, suggest the box. The rest of the day suggests the fusee. */
export function suggestWatch(hour: number): ChronoWatch {
  return hour < 9 ? "box" : "fusee";
}

/** The keeper with the fewest unwound bench beats. A tie keeps the roster order. */
export function fairKeeper(cards: readonly ChronoBeat[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.wound);
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

export function readBeats(raw: unknown): ChronoBeat[] {
  if (!Array.isArray(raw)) return [];
  const out: ChronoBeat[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChronoBeat>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      watch: watchOf(row.watch),
      rate: chronoRate(row.rate),
      finish: metalOf(row.finish),
      escapement: escapeOf(row.escapement),
      beat: chronoBeat(row.beat) ?? 2,
      tags: tagsOf(row.tags),
      wound: row.wound === true,
      locked: row.locked === true,
      cased: row.cased === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addBeat(
  cards: readonly ChronoBeat[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    watch?: string;
    rate?: unknown;
    finish?: string;
    escapement?: string;
    beat?: unknown;
    tags?: string;
  },
): ChronoBeat[] {
  const current = readBeats(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ChronoBeat = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    watch: watchOf(card.watch),
    rate: chronoRate(card.rate),
    finish: metalOf(card.finish),
    escapement: escapeOf(card.escapement),
    beat: chronoBeat(card.beat) ?? 2,
    tags: tagsOf(card.tags),
    wound: false,
    locked: false,
    cased: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly ChronoBeat[], id: string, change: (card: ChronoBeat) => ChronoBeat): ChronoBeat[] {
  return readBeats(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly ChronoBeat[], ids: readonly string[], change: (card: ChronoBeat) => ChronoBeat): ChronoBeat[] {
  const picked = new Set(ids);
  return readBeats(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editBeat(cards: readonly ChronoBeat[], id: string, title: string): ChronoBeat[] {
  const next = lineOf(title);
  if (!next) return readBeats(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBeatNote(cards: readonly ChronoBeat[], id: string, note: string): ChronoBeat[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setBeatWind(cards: readonly ChronoBeat[], id: string, wound: boolean): ChronoBeat[] {
  return mapCard(cards, id, (card) => (card.wound === wound ? card : { ...card, wound, audit: wound ? "wind" : "unwind" }));
}

export function setBeatLock(cards: readonly ChronoBeat[], id: string, locked: boolean): ChronoBeat[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, cased: locked ? false : card.cased, audit: locked ? "lock" : "resume" }));
}

export function setBeatCase(cards: readonly ChronoBeat[], id: string, cased: boolean): ChronoBeat[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, locked: cased ? false : card.locked, audit: cased ? "case" : "open" }));
}

export function setBeatStar(cards: readonly ChronoBeat[], id: string, flagged: boolean): ChronoBeat[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setBeatFinish(cards: readonly ChronoBeat[], id: string, finish: unknown): ChronoBeat[] {
  const next = metalOf(finish);
  if (!next) return readBeats(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Escapement steps lever, detent, cylinder, then lever again. A blank escapement starts at lever. */
export function cycleEscapement(cards: readonly ChronoBeat[], id: string): ChronoBeat[] {
  return mapCard(cards, id, (card) => {
    const at = TRAINS.indexOf(card.escapement as (typeof TRAINS)[number]);
    const next = at < 0 ? TRAINS[0] : TRAINS[(at + 1) % TRAINS.length];
    return next === card.escapement ? card : { ...card, escapement: next, audit: "escape" };
  });
}

export function addBeatTag(cards: readonly ChronoBeat[], id: string, tag: string): ChronoBeat[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBeats(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank rate becomes 0, 0 becomes 2, and 2 becomes 6. A rate of 6 stays. */
export function liftRate(cards: readonly ChronoBeat[], id: string): ChronoBeat[] {
  return mapCard(cards, id, (card) => {
    if (card.rate === 6) return card;
    const next = card.rate === 2 ? 6 : card.rate === 0 ? 2 : 0;
    return { ...card, rate: next, audit: "rate" };
  });
}

/** A blank rate becomes 6, 6 becomes 2, and 2 becomes 0. A rate of 0 stays. */
export function dipRate(cards: readonly ChronoBeat[], id: string): ChronoBeat[] {
  return mapCard(cards, id, (card) => {
    if (card.rate === 0) return card;
    const next = card.rate === 2 ? 0 : card.rate === 6 ? 2 : 6;
    return { ...card, rate: next, audit: "dip" };
  });
}

export function raiseBeat(cards: readonly ChronoBeat[], id: string): ChronoBeat[] {
  return mapCard(cards, id, (card) => {
    const at = beatIndex(card.beat);
    if (at < 0) return { ...card, beat: 2, audit: "beat" };
    if (at === BEAT_CYCLE.length - 1) return card;
    return { ...card, beat: BEAT_CYCLE[at + 1], audit: "beat" };
  });
}

export function lowerBeat(cards: readonly ChronoBeat[], id: string): ChronoBeat[] {
  return mapCard(cards, id, (card) => {
    const at = beatIndex(card.beat);
    if (at <= 0) return card;
    return { ...card, beat: BEAT_CYCLE[at - 1], audit: "beat" };
  });
}

export function bulkBeatWind(cards: readonly ChronoBeat[], ids: readonly string[]): ChronoBeat[] {
  return touchIds(cards, ids, (card) => ({ ...card, wound: true, audit: "wind" }));
}

export function bulkBeatCase(cards: readonly ChronoBeat[], ids: readonly string[]): ChronoBeat[] {
  return touchIds(cards, ids, (card) => ({ ...card, cased: true, locked: false, audit: "case" }));
}

export function bulkBeatCylinder(cards: readonly ChronoBeat[], ids: readonly string[]): ChronoBeat[] {
  return touchIds(cards, ids, (card) => ({ ...card, escapement: "cylinder", audit: "escape" }));
}

export function bulkBeatChampagne(cards: readonly ChronoBeat[], ids: readonly string[]): ChronoBeat[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkBeatTag(cards: readonly ChronoBeat[], ids: readonly string[], tag: string): ChronoBeat[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBeats(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly ChronoBeat[], ids: readonly string[], index: number, change: (list: readonly ChronoBeat[], id: string) => ChronoBeat[]): ChronoBeat[] {
  const id = ids[index];
  return id ? change(cards, id) : readBeats(cards);
}

export function liftRateFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  return focused(cards, ids, index, liftRate);
}

export function dipRateFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  return focused(cards, ids, index, dipRate);
}

export function escapementFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  return focused(cards, ids, index, cycleEscapement);
}

export function raiseBeatFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  return focused(cards, ids, index, raiseBeat);
}

export function lowerBeatFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  return focused(cards, ids, index, lowerBeat);
}

export function windBeatFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  const id = ids[index];
  if (!id) return readBeats(cards);
  const card = readBeats(cards).find((item) => item.id === id);
  return card ? setBeatWind(cards, id, !card.wound) : readBeats(cards);
}

export function lockBeatFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  const id = ids[index];
  if (!id) return readBeats(cards);
  const card = readBeats(cards).find((item) => item.id === id);
  return card ? setBeatLock(cards, id, !card.locked) : readBeats(cards);
}

export function starBeatFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number): ChronoBeat[] {
  const id = ids[index];
  if (!id) return readBeats(cards);
  const card = readBeats(cards).find((item) => item.id === id);
  return card ? setBeatStar(cards, id, !card.flagged) : readBeats(cards);
}

export function tagBeatFocused(cards: readonly ChronoBeat[], ids: readonly string[], index: number, tag: string): ChronoBeat[] {
  const id = ids[index];
  return id ? addBeatTag(cards, id, tag) : readBeats(cards);
}

export function readBeatViews(raw: unknown): BeatView[] {
  if (!Array.isArray(raw)) return [];
  const out: BeatView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BeatView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      finish: activeMetal(row.finish),
      escapement: activeEscape(row.escapement, TRAINS),
      watch: activeWatch(row.watch),
      rate: activeRate(row.rate),
      beat: activeBeat(row.beat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBeatView(
  views: readonly BeatView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    finish?: string;
    escapement?: string;
    watch?: string;
    rate?: string;
    beat?: string;
  },
): BeatView[] {
  const current = readBeatViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BeatView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    finish: activeMetal(view.finish),
    escapement: activeEscape(view.escapement, TRAINS),
    watch: activeWatch(view.watch),
    rate: activeRate(view.rate),
    beat: activeBeat(view.beat),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBeatView(views: readonly BeatView[], id: string): BeatView[] {
  return readBeatViews(views).filter((view) => view.id !== id);
}

export function beatDensity(raw: unknown): BeatDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A beat more than one watch behind the desk, at beat 2, is late. */
export function lateBeat(card: ChronoBeat, deskWatch: unknown): boolean {
  const gap = watchGap(card.watch, deskWatch);
  return card.beat === 2 && gap !== null && gap > 1;
}

export function idleBeat(card: ChronoBeat): boolean {
  return card.escapement === "lever" && stillWatch(card.watch) && card.beat === 2;
}

export function briskBeat(card: ChronoBeat): boolean {
  return card.beat === 16 && card.escapement === "cylinder" && keenWatch(card.watch);
}

export function restingBeat(card: ChronoBeat): boolean {
  return card.rate === 6 && card.escapement === "detent" && card.watch === "rate";
}

/** A mean rate on a keen watch is overdue unless the chronometer is wound. */
export function overdueBeat(card: ChronoBeat): boolean {
  return card.rate === 0 && keenWatch(card.watch) && !card.wound;
}

export function visibleBeats(
  cards: readonly ChronoBeat[],
  tray: BeatTray,
  query: string,
  keeper: string,
  finish: string,
  escapement: string,
  watch: string,
  rate: string,
  beat: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): ChronoBeat[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : metalOf(finish);
  const trainOn = escapement === "all" ? "" : escapeOf(escapement);
  const watchOn = watch === "all" ? "" : activeWatch(watch);
  const rateOn = rate === "all" ? "" : activeRate(rate);
  const beatOn = beat === "all" ? "" : activeBeat(beat);
  return readBeats(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (trainOn && card.escapement !== trainOn) return false;
    if (watchOn === "keen" && !keenWatch(card.watch)) return false;
    if (watchOn === "still" && !stillWatch(card.watch)) return false;
    if (watchOn && watchOn !== "keen" && watchOn !== "still" && card.watch !== watchOn) return false;
    if (rateOn && String(card.rate ?? "") !== rateOn) return false;
    if (beatOn && String(card.beat) !== beatOn) return false;
    if (houseOnly && !houseMetal(card.finish)) return false;
    if (keenOnly && !keenWatch(card.watch)) return false;
    if (stillOnly && !stillWatch(card.watch)) return false;
    return true;
  });
}

export function sortBeats(cards: readonly ChronoBeat[], sort: BeatSort): ChronoBeat[] {
  return cards.slice().sort((a, b) => {
    if (a.wound !== b.wound) return a.wound ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const watch = (watchIndex(a.watch) < 0 ? 99 : watchIndex(a.watch)) - (watchIndex(b.watch) < 0 ? 99 : watchIndex(b.watch));
    if (watch) return watch;
    return a.title.localeCompare(b.title);
  });
}

export function beatCounts(cards: readonly ChronoBeat[], shown: readonly ChronoBeat[], deskWatch: unknown): BeatCounts {
  const open = cards.filter((card) => inTray(card, "bench"));
  return {
    bench: open.length,
    safe: cards.filter((card) => inTray(card, "safe")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    wound: open.filter((card) => card.wound).length,
    keen: open.filter((card) => keenWatch(card.watch)).length,
    still: open.filter((card) => stillWatch(card.watch)).length,
    soon: open.filter((card) => card.rate === 0).length,
    beat: open.reduce((sum, card) => sum + card.beat, 0),
    house: open.filter((card) => houseMetal(card.finish)).length,
    rate: open.filter((card) => card.rate !== null).length,
    matched: shown.filter((card) => card.watch && card.watch === watchOf(deskWatch)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleBeat(card)).length,
    brisk: open.filter((card) => briskBeat(card)).length,
    resting: open.filter((card) => restingBeat(card)).length,
    overdue: open.filter((card) => overdueBeat(card)).length,
  };
}

export function clashWatchCount(cards: readonly ChronoBeat[]): number {
  const open = cards.filter((card) => inTray(card, "bench") && card.watch);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.watch === card.watch && other.beat === card.beat)).length;
}

export function neighborBeatCount(cards: readonly ChronoBeat[]): number {
  const open = cards.filter((card) => inTray(card, "bench") && beatIndex(card.beat) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(beatIndex(other.beat) - beatIndex(card.beat));
    const ring = Math.min(gap, BEAT_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly ChronoBeat[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && card.keeper);
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

export function reminderBeats(cards: readonly ChronoBeat[]): ChronoBeat[] {
  return cards.filter((card) => inTray(card, "bench") && (card.rate === 0 || card.rate === 2));
}

export function idleBeats(cards: readonly ChronoBeat[]): ChronoBeat[] {
  return cards.filter((card) => inTray(card, "bench") && idleBeat(card));
}

export function beatTimeline(cards: readonly ChronoBeat[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function beatBars(cards: readonly ChronoBeat[]): { watch: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return CHRONO_WATCHES.map((watch) => ({ watch, count: open.filter((card) => card.watch === watch).length }));
}

export function beatKeepers(cards: readonly ChronoBeat[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function beatCopy(card: ChronoBeat): string {
  return [card.title, card.keeper, card.watch, card.finish, card.escapement, card.rate ?? "", card.beat, card.note].filter((item) => item !== "").join(" · ");
}

export function beatCsv(cards: readonly ChronoBeat[], deskWatch: unknown): string {
  const lines = ["title,keeper,watch,finish,escapement,rate,beat,tags,wound,locked,cased,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readBeats(cards)) {
    const gap = watchGap(card.watch, deskWatch);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.watch,
      card.finish,
      card.escapement,
      card.rate === null ? "" : String(card.rate),
      String(card.beat),
      card.tags.join(" "),
      card.wound ? "1" : "0",
      card.locked ? "1" : "0",
      card.cased ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBeat(card, deskWatch) ? "1" : "0",
      idleBeat(card) ? "1" : "0",
      keenWatch(card.watch) ? "1" : "0",
      stillWatch(card.watch) ? "1" : "0",
      houseMetal(card.finish) ? "1" : "0",
      watchBand(card.watch),
      briskBeat(card) ? "1" : "0",
      restingBeat(card) ? "1" : "0",
      overdueBeat(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function anchorRecord(raw: AnchorValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: AnchorValue): boolean {
  const row = anchorRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type AnchorParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number; digit: boolean };

function anchorText(raw: AnchorValue): string {
  if (hasBlocked(raw)) return "";
  const row = anchorRecord(raw);
  if (row && !("affiliateA" in row) && !("code" in row)) return "";
  return row ? clip(row.affiliateA ?? row.code, 32) : clip(raw, 32);
}

function anchorParts(raw: AnchorValue): AnchorParts | null {
  const text = anchorText(raw);
  if (!/^[A-Za-z][A-Za-z0-9_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/-/g) || []).length,
    seps,
    digit: /\d/.test(text),
  };
}

/** A blocked money field clears the plate. A real affiliate code is set. A blank or broken code is clear. */
export function anchorState(raw: AnchorValue): AnchorState {
  if (hasBlocked(raw)) return "";
  const row = anchorRecord(raw);
  if (row && !("affiliateA" in row) && !("code" in row)) return "";
  return anchorParts(raw) ? "set" : "clear";
}

/** HOUSE is a loft, PARTNER is a quay, DEMO is a closet, AFF is a yard, and a separator or a digit is a pier. */
export function anchorLane(raw: AnchorValue): AnchorLane {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "house") return "loft";
  if (key === "partner") return "quay";
  if (key === "demo") return "closet";
  if (key.startsWith("aff")) return "yard";
  if (parts.seps >= 1 || parts.digit) return "pier";
  return "hall";
}

/** The first three letters. */
export function anchorStamp(raw: AnchorValue): string {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return parts ? parts.letters.slice(0, 3).toUpperCase() : "";
}

/** HOUSE is graphite, PARTNER and DEMO are ivory, AFF is champagne, and other codes follow the first letter. */
export function anchorHue(raw: AnchorValue): AnchorHue {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  if (!parts) return "";
  const lane = anchorLane(raw);
  if (lane === "yard") return "champagne";
  if (lane === "loft") return "graphite";
  if (lane === "quay" || lane === "closet") return "ivory";
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function anchorTwin(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function anchorWide(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function anchorNotch(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function anchorEcho(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function anchorLeap(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function anchorSlash(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function anchorKnown(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function anchorCap(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function anchorTail(raw: AnchorValue): boolean {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function anchorScore(raw: AnchorValue): number {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return parts ? parts.score : 0;
}

export function anchorStep(raw: AnchorValue): number {
  const parts = anchorState(raw) === "set" ? anchorParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function anchorLanes(rows: readonly AnchorRow[]): AnchorLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = anchorLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingAnchor(rows: readonly AnchorRow[]): string {
  const bars = anchorLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingAnchorHue(rows: readonly AnchorRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = anchorHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedAnchorCount(rows: readonly AnchorRow[]): number {
  const marks = rows.map((row) => anchorStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneAnchorCount(rows: readonly AnchorRow[], lane: AnchorLane): number {
  return rows.filter((row) => anchorLane(row.note) === lane).length;
}

export function anchorShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAnchorLanes(rows: readonly AnchorRow[]): string[] {
  return anchorLanes(rows).map((line) => line.lane);
}

export function readHiddenAnchors(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAnchors(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAnchor(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleAnchorReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAnchorReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAnchorLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleAnchors(
  rows: readonly AnchorRow[],
  lane: string,
  hue: string,
  query: string,
  review: AnchorReview,
  reviewed: readonly string[],
  shape: AnchorShape,
): AnchorRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (anchorState(row.note) === "") return false;
    const found = anchorLane(row.note);
    const hueName = anchorHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${anchorText(row.note)} ${anchorStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "quay" && found !== "quay") return false;
    if (shape === "loft" && found !== "loft") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "closet" && found !== "closet") return false;
    if (shape === "yard" && found !== "yard") return false;
    if (shape === "pier" && found !== "pier") return false;
    if (shape === "wide" && !anchorWide(row.note)) return false;
    if (shape === "notch" && !anchorNotch(row.note)) return false;
    if (shape === "leap" && !anchorLeap(row.note)) return false;
    if (shape === "slash" && !anchorSlash(row.note)) return false;
    if (shape === "twin" && !anchorTwin(row.note)) return false;
    if (shape === "known" && !anchorKnown(row.note)) return false;
    if (shape === "echo" && !anchorEcho(row.note)) return false;
    return true;
  });
}

export function anchorCopy(raw: AnchorValue): string {
  return [anchorStamp(raw), anchorLane(raw), anchorHue(raw)].filter(Boolean).join(" ");
}

export function anchorLanesCsv(rows: readonly AnchorRow[]): string {
  const lines = ["lane,count"];
  for (const line of anchorLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function anchorRowsCsv(rows: readonly AnchorRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (anchorState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(anchorText(row.note)),
      anchorStamp(row.note),
      anchorLane(row.note),
      anchorHue(row.note),
      String(anchorStep(row.note)),
      anchorEcho(row.note) ? "1" : "0",
      anchorWide(row.note) ? "1" : "0",
      anchorNotch(row.note) ? "1" : "0",
      anchorLeap(row.note) ? "1" : "0",
      anchorSlash(row.note) ? "1" : "0",
      anchorTwin(row.note) ? "1" : "0",
      anchorKnown(row.note) ? "1" : "0",
      anchorCap(row.note) ? "1" : "0",
      anchorTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
