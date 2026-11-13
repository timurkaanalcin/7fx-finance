/**
 * Pendulum bobs for a tempo follow-up book, and charter plates already stored as documentsStatus.
 * Tempos are largo, andante, allegro, and presto. Hands are left, both, and right.
 * Beats are 40, 72, or 96. Weights are 1, 3, 5, or 7.
 * APPROVED is a hall and PENDING is a porch. A separator is a gate.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_pendulum_bob (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   winder text not null default '',
 *   tempo text not null default '',
 *   finish text not null default '',
 *   hand text not null default '',
 *   beat_no integer,
 *   weight_no integer not null default 1,
 *   tags text not null default '',
 *   latched boolean not null default false,
 *   rested boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_charter_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_charter_review (
 *   trader_id text primary key
 * );
 */

export const PND_KEY = "crmv4-pendulum-bob";
export const PND_VIEW_KEY = "crmv4-pendulum-views";
export const PND_DENSITY_KEY = "crmv4-pendulum-density";
export const CHT_KEY = "crmv4-charter-hide";
export const CHT_REVIEW_KEY = "crmv4-charter-review";

export const PENDULUM_TEMPOS = ["largo", "andante", "allegro", "presto"] as const;

export type PendulumTempo = (typeof PENDULUM_TEMPOS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type HandName = "blank" | "left" | "both" | "right";

export type BobTray = "swing" | "rest" | "case";

export type BobDensity = "airy" | "tight";

export type BobSort = "tempo" | "winder";

export type PendulumBob = {
  id: string;
  title: string;
  note: string;
  winder: string;
  tempo: string;
  beat: number | null;
  finish: string;
  hand: string;
  weight: number;
  tags: string[];
  latched: boolean;
  rested: boolean;
  cased: boolean;
  flagged: boolean;
  audit: string;
};

export type BobView = {
  id: string;
  name: string;
  tray: BobTray;
  query: string;
  winder: string;
  finish: string;
  hand: string;
  tempo: string;
  beat: string;
  weight: string;
};

export type BobCounts = {
  swing: number;
  rest: number;
  case: number;
  latched: number;
  keen: number;
  still: number;
  soon: number;
  weight: number;
  house: number;
  beat: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type CharterLane = "" | "hall" | "porch" | "yard" | "gate";

export type CharterHue = "" | "ivory" | "graphite" | "champagne";

export type CharterState = "" | "clear" | "set";

export type CharterShape = "all" | "hall" | "porch" | "yard" | "gate" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type CharterReview = "all" | "reviewed" | "fresh";

export type CharterValue = string | { documentsStatus?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type CharterRow = { id: string; label: string; note: CharterValue };

export type CharterLaneLine = { lane: string; count: number };

export const ROUND272_FEATURES = [
  "save",
  "note",
  "trays",
  "latch",
  "beat",
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
  "fair-winder",
  "viewer",
  "suggest",
  "sla",
  "charter",
  "charter-csv",
] as const;

const AUDITS = ["save", "edit", "note", "hand", "latch", "unlatch", "rest", "resume", "case", "open", "finish", "tag", "weight", "beat", "narrow", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const HANDS = ["left", "both", "right"] as const;

const BEAT_CYCLE = [40, 72, 96] as const;

const WEIGHT_CYCLE = [1, 3, 5, 7] as const;

const KEEN = new Set(["allegro", "presto"]);

const STILL = new Set(["largo", "andante"]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const EARLY = new Set(["largo", "andante"]);

const LANE_ORDER = ["hall", "porch", "yard", "gate"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["approved", "pending", "rejected", "missing", "review"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BobTray {
  return raw === "rest" || raw === "case" ? raw : "swing";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function handName(raw: unknown): Exclude<HandName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HANDS as readonly string[]).includes(text) ? (text as Exclude<HandName, "blank">) : "";
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

function inTray(card: PendulumBob, tray: BobTray): boolean {
  if (tray === "rest") return card.rested && !card.cased;
  if (tray === "case") return card.cased;
  return !card.rested && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function tempoIndex(tempo: string): number {
  return PENDULUM_TEMPOS.indexOf(tempo as PendulumTempo);
}

function weightIndex(weight: number): number {
  return WEIGHT_CYCLE.indexOf(weight as (typeof WEIGHT_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function tempoOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PENDULUM_TEMPOS as readonly string[]).includes(text) ? text : "";
}

/** Beat is 40, 72, or 96. Anything else stays blank. */
export function pendulumBeat(raw: unknown): 40 | 72 | 96 | null {
  const value = Number(clip(raw, 3));
  return (BEAT_CYCLE as readonly number[]).includes(value) ? (value as 40 | 72 | 96) : null;
}

/** Weight is 1, 3, 5, or 7. Anything else stays blank. */
export function pendulumWeight(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (WEIGHT_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Hand is left, both, or right. A blank hand stays blank. */
export function handOf(raw: unknown): string {
  return handName(raw);
}

export function keenTempo(tempo: unknown): boolean {
  return KEEN.has(clip(tempo, 12).toLowerCase());
}

export function stillTempo(tempo: unknown): boolean {
  return STILL.has(clip(tempo, 12).toLowerCase());
}

/** Early is largo and andante. Mid is allegro. Late is presto. */
export function tempoBand(tempo: unknown): string {
  const text = tempoOf(tempo);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "allegro") return "mid";
  return "late";
}

/** Signed distance from the bob tempo to the desk tempo. */
export function tempoGap(from: unknown, to: unknown): number | null {
  const left = tempoIndex(tempoOf(from));
  const right = tempoIndex(tempoOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE.has(finishOf(finish));
}

export function activeTempo(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return tempoOf(text) || "all";
}

export function activeBeat(raw: unknown): string {
  const beat = pendulumBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeHand(raw: unknown, allow: readonly string[]): string {
  const text = handOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeWeight(raw: unknown): string {
  const weight = pendulumWeight(raw);
  return weight === null ? "all" : String(weight);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function movePendulumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly PendulumBob[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "swing") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "GRAPHITE";
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

/** Before six, suggest forty beats. Through the afternoon, seventy-two. Evening asks for ninety-six. Saved beats win when any exist. */
export function suggestBeat(cards: readonly PendulumBob[], hour: number): 40 | 72 | 96 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "swing") || card.beat === null) continue;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  let best: 40 | 72 | 96 | null = null;
  let score = 0;
  for (const beat of BEAT_CYCLE) {
    const count = counts.get(beat) || 0;
    if (count > score) {
      best = beat;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 40;
  if (hour < 14) return 72;
  return 96;
}

/** Before six, suggest largo. The rest of the day suggests allegro. */
export function suggestTempo(hour: number): PendulumTempo {
  return hour < 6 ? "largo" : "allegro";
}

/** The winder with the fewest swinging unlatched bobs. A tie keeps the roster order. */
export function fairWinder(cards: readonly PendulumBob[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "swing") && !card.latched);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.winder.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readBobs(raw: unknown): PendulumBob[] {
  if (!Array.isArray(raw)) return [];
  const out: PendulumBob[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PendulumBob>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      winder: clip(row.winder, 24),
      tempo: tempoOf(row.tempo),
      beat: pendulumBeat(row.beat),
      finish: finishOf(row.finish),
      hand: handOf(row.hand),
      weight: pendulumWeight(row.weight) ?? 1,
      tags: tagsOf(row.tags),
      latched: row.latched === true,
      rested: row.rested === true,
      cased: row.cased === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addBob(
  cards: readonly PendulumBob[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    winder?: string;
    tempo?: string;
    beat?: unknown;
    finish?: string;
    hand?: string;
    weight?: unknown;
    tags?: string;
  },
): PendulumBob[] {
  const current = readBobs(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: PendulumBob = {
    id,
    title,
    note: noteOf(card.note),
    winder: clip(card.winder, 24),
    tempo: tempoOf(card.tempo),
    beat: pendulumBeat(card.beat),
    finish: finishOf(card.finish),
    hand: handOf(card.hand),
    weight: pendulumWeight(card.weight) ?? 1,
    tags: tagsOf(card.tags),
    latched: false,
    rested: false,
    cased: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly PendulumBob[], id: string, change: (card: PendulumBob) => PendulumBob): PendulumBob[] {
  return readBobs(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly PendulumBob[], ids: readonly string[], change: (card: PendulumBob) => PendulumBob): PendulumBob[] {
  const picked = new Set(ids);
  return readBobs(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editBob(cards: readonly PendulumBob[], id: string, title: string): PendulumBob[] {
  const next = lineOf(title);
  if (!next) return readBobs(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBobNote(cards: readonly PendulumBob[], id: string, note: string): PendulumBob[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setBobLatch(cards: readonly PendulumBob[], id: string, latched: boolean): PendulumBob[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, audit: latched ? "latch" : "unlatch" }));
}

export function setBobRest(cards: readonly PendulumBob[], id: string, rested: boolean): PendulumBob[] {
  return mapCard(cards, id, (card) => (card.rested === rested ? card : { ...card, rested, cased: rested ? false : card.cased, audit: rested ? "rest" : "resume" }));
}

export function setBobCase(cards: readonly PendulumBob[], id: string, cased: boolean): PendulumBob[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, rested: cased ? false : card.rested, audit: cased ? "case" : "open" }));
}

export function setBobStar(cards: readonly PendulumBob[], id: string, flagged: boolean): PendulumBob[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setBobFinish(cards: readonly PendulumBob[], id: string, finish: unknown): PendulumBob[] {
  const next = finishOf(finish);
  if (!next) return readBobs(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Hand steps left, both, right, then left again. A blank hand starts at left. */
export function cycleHand(cards: readonly PendulumBob[], id: string): PendulumBob[] {
  return mapCard(cards, id, (card) => {
    const at = HANDS.indexOf(card.hand as (typeof HANDS)[number]);
    const next = at < 0 ? HANDS[0] : HANDS[(at + 1) % HANDS.length];
    return next === card.hand ? card : { ...card, hand: next, audit: "hand" };
  });
}

export function addBobTag(cards: readonly PendulumBob[], id: string, tag: string): PendulumBob[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBobs(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank beat becomes 40, 40 becomes 72, and 72 becomes 96. A beat of 96 stays. */
export function lengthenBeat(cards: readonly PendulumBob[], id: string): PendulumBob[] {
  return mapCard(cards, id, (card) => {
    if (card.beat === 96) return card;
    const next = card.beat === 72 ? 96 : card.beat === 40 ? 72 : 40;
    return { ...card, beat: next, audit: "beat" };
  });
}

/** A blank beat becomes 96, 96 becomes 72, and 72 becomes 40. A beat of 40 stays. */
export function shortenBeat(cards: readonly PendulumBob[], id: string): PendulumBob[] {
  return mapCard(cards, id, (card) => {
    if (card.beat === 40) return card;
    const next = card.beat === 72 ? 40 : card.beat === 96 ? 72 : 96;
    return { ...card, beat: next, audit: "narrow" };
  });
}

export function raiseWeight(cards: readonly PendulumBob[], id: string): PendulumBob[] {
  return mapCard(cards, id, (card) => {
    const at = weightIndex(card.weight);
    if (at < 0) return { ...card, weight: 1, audit: "weight" };
    if (at === WEIGHT_CYCLE.length - 1) return card;
    return { ...card, weight: WEIGHT_CYCLE[at + 1], audit: "weight" };
  });
}

export function lowerWeight(cards: readonly PendulumBob[], id: string): PendulumBob[] {
  return mapCard(cards, id, (card) => {
    const at = weightIndex(card.weight);
    if (at <= 0) return card;
    return { ...card, weight: WEIGHT_CYCLE[at - 1], audit: "weight" };
  });
}

export function bulkBobLatch(cards: readonly PendulumBob[], ids: readonly string[]): PendulumBob[] {
  return touchIds(cards, ids, (card) => ({ ...card, latched: true, audit: "latch" }));
}

export function bulkBobCase(cards: readonly PendulumBob[], ids: readonly string[]): PendulumBob[] {
  return touchIds(cards, ids, (card) => ({ ...card, cased: true, rested: false, audit: "case" }));
}

export function bulkBobRight(cards: readonly PendulumBob[], ids: readonly string[]): PendulumBob[] {
  return touchIds(cards, ids, (card) => ({ ...card, hand: "right", audit: "hand" }));
}

export function bulkBobChampagne(cards: readonly PendulumBob[], ids: readonly string[]): PendulumBob[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkBobTag(cards: readonly PendulumBob[], ids: readonly string[], tag: string): PendulumBob[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBobs(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly PendulumBob[], ids: readonly string[], index: number, change: (list: readonly PendulumBob[], id: string) => PendulumBob[]): PendulumBob[] {
  const id = ids[index];
  return id ? change(cards, id) : readBobs(cards);
}

export function lengthenBeatFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  return focused(cards, ids, index, lengthenBeat);
}

export function shortenBeatFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  return focused(cards, ids, index, shortenBeat);
}

export function handFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  return focused(cards, ids, index, cycleHand);
}

export function raiseWeightFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  return focused(cards, ids, index, raiseWeight);
}

export function lowerWeightFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  return focused(cards, ids, index, lowerWeight);
}

export function latchBobFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  const id = ids[index];
  if (!id) return readBobs(cards);
  const card = readBobs(cards).find((item) => item.id === id);
  return card ? setBobLatch(cards, id, !card.latched) : readBobs(cards);
}

export function restBobFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  const id = ids[index];
  if (!id) return readBobs(cards);
  const card = readBobs(cards).find((item) => item.id === id);
  return card ? setBobRest(cards, id, !card.rested) : readBobs(cards);
}

export function starBobFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number): PendulumBob[] {
  const id = ids[index];
  if (!id) return readBobs(cards);
  const card = readBobs(cards).find((item) => item.id === id);
  return card ? setBobStar(cards, id, !card.flagged) : readBobs(cards);
}

export function tagBobFocused(cards: readonly PendulumBob[], ids: readonly string[], index: number, tag: string): PendulumBob[] {
  const id = ids[index];
  return id ? addBobTag(cards, id, tag) : readBobs(cards);
}

export function readBobViews(raw: unknown): BobView[] {
  if (!Array.isArray(raw)) return [];
  const out: BobView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BobView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      winder: clip(row.winder, 24),
      finish: activeFinish(row.finish),
      hand: activeHand(row.hand, HANDS),
      tempo: activeTempo(row.tempo),
      beat: activeBeat(row.beat),
      weight: activeWeight(row.weight),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBobView(
  views: readonly BobView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    winder?: string;
    finish?: string;
    hand?: string;
    tempo?: string;
    beat?: string;
    weight?: string;
  },
): BobView[] {
  const current = readBobViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BobView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    winder: clip(view.winder, 24),
    finish: activeFinish(view.finish),
    hand: activeHand(view.hand, HANDS),
    tempo: activeTempo(view.tempo),
    beat: activeBeat(view.beat),
    weight: activeWeight(view.weight),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBobView(views: readonly BobView[], id: string): BobView[] {
  return readBobViews(views).filter((view) => view.id !== id);
}

export function bobDensity(raw: unknown): BobDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A bob more than two tempos behind the desk, at weight 1, is late. */
export function lateBob(card: PendulumBob, deskTempo: unknown): boolean {
  const gap = tempoGap(card.tempo, deskTempo);
  return card.weight === 1 && gap !== null && gap > 2;
}

export function idleBob(card: PendulumBob): boolean {
  return card.hand === "left" && stillTempo(card.tempo) && card.weight === 1;
}

export function briskBob(card: PendulumBob): boolean {
  return card.weight === 7 && card.hand === "right" && keenTempo(card.tempo);
}

export function restingBob(card: PendulumBob): boolean {
  return card.beat === 96 && card.hand === "both" && card.tempo === "presto";
}

/** A forty-beat swing on a keen tempo is overdue unless the bob is latched. */
export function overdueBob(card: PendulumBob): boolean {
  return card.beat === 40 && keenTempo(card.tempo) && !card.latched;
}

export function visibleBobs(
  cards: readonly PendulumBob[],
  tray: BobTray,
  query: string,
  winder: string,
  finish: string,
  hand: string,
  tempo: string,
  beat: string,
  weight: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): PendulumBob[] {
  const text = query.trim().toLowerCase();
  const winderOn = winder === "all" ? "" : winder.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const handOn = hand === "all" ? "" : handOf(hand);
  const tempoOn = tempo === "all" ? "" : activeTempo(tempo);
  const beatOn = beat === "all" ? "" : activeBeat(beat);
  const weightOn = weight === "all" ? "" : activeWeight(weight);
  return readBobs(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (winderOn && card.winder.toLowerCase() !== winderOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (handOn && card.hand !== handOn) return false;
    if (tempoOn === "keen" && !keenTempo(card.tempo)) return false;
    if (tempoOn === "still" && !stillTempo(card.tempo)) return false;
    if (tempoOn && tempoOn !== "keen" && tempoOn !== "still" && card.tempo !== tempoOn) return false;
    if (beatOn && String(card.beat ?? "") !== beatOn) return false;
    if (weightOn && String(card.weight) !== weightOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenTempo(card.tempo)) return false;
    if (stillOnly && !stillTempo(card.tempo)) return false;
    return true;
  });
}

export function sortBobs(cards: readonly PendulumBob[], sort: BobSort): PendulumBob[] {
  return cards.slice().sort((a, b) => {
    if (a.latched !== b.latched) return a.latched ? -1 : 1;
    if (sort === "winder") {
      const winder = a.winder.localeCompare(b.winder);
      if (winder) return winder;
    }
    const tempo = (tempoIndex(a.tempo) < 0 ? 99 : tempoIndex(a.tempo)) - (tempoIndex(b.tempo) < 0 ? 99 : tempoIndex(b.tempo));
    if (tempo) return tempo;
    return a.title.localeCompare(b.title);
  });
}

export function bobCounts(cards: readonly PendulumBob[], shown: readonly PendulumBob[], deskTempo: unknown): BobCounts {
  const open = cards.filter((card) => inTray(card, "swing"));
  return {
    swing: open.length,
    rest: cards.filter((card) => inTray(card, "rest")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    latched: open.filter((card) => card.latched).length,
    keen: open.filter((card) => keenTempo(card.tempo)).length,
    still: open.filter((card) => stillTempo(card.tempo)).length,
    soon: open.filter((card) => card.beat === 40).length,
    weight: open.reduce((sum, card) => sum + card.weight, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    beat: open.filter((card) => card.beat !== null).length,
    matched: shown.filter((card) => card.tempo && card.tempo === tempoOf(deskTempo)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleBob(card)).length,
    brisk: open.filter((card) => briskBob(card)).length,
    resting: open.filter((card) => restingBob(card)).length,
    overdue: open.filter((card) => overdueBob(card)).length,
  };
}

export function clashTempoCount(cards: readonly PendulumBob[]): number {
  const open = cards.filter((card) => inTray(card, "swing") && card.tempo);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tempo === card.tempo && other.weight === card.weight)).length;
}

export function neighborWeightCount(cards: readonly PendulumBob[]): number {
  const open = cards.filter((card) => inTray(card, "swing") && weightIndex(card.weight) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(weightIndex(other.weight) - weightIndex(card.weight));
    const ring = Math.min(gap, WEIGHT_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestWinder(cards: readonly PendulumBob[]): string {
  const open = cards.filter((card) => inTray(card, "swing") && card.winder);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.winder.toLowerCase() === card.winder.toLowerCase()).length;
    if (count > score) {
      best = card.winder;
      score = count;
    }
  }
  return best;
}

export function reminderBobs(cards: readonly PendulumBob[]): PendulumBob[] {
  return cards.filter((card) => inTray(card, "swing") && (card.beat === 40 || card.beat === 72));
}

export function idleBobs(cards: readonly PendulumBob[]): PendulumBob[] {
  return cards.filter((card) => inTray(card, "swing") && idleBob(card));
}

export function bobTimeline(cards: readonly PendulumBob[]): { weight: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "swing"));
  return WEIGHT_CYCLE.map((weight) => ({ weight, titles: open.filter((card) => card.weight === weight).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function bobBars(cards: readonly PendulumBob[]): { tempo: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "swing"));
  return PENDULUM_TEMPOS.map((tempo) => ({ tempo, count: open.filter((card) => card.tempo === tempo).length }));
}

export function bobWinders(cards: readonly PendulumBob[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.winder || out.some((item) => item.toLowerCase() === card.winder.toLowerCase())) continue;
    out.push(card.winder);
  }
  return out;
}

export function bobCopy(card: PendulumBob): string {
  return [card.title, card.winder, card.tempo, card.finish, card.hand, card.beat ?? "", card.weight, card.note].filter((item) => item !== "").join(" · ");
}

export function bobShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function bobCsv(cards: readonly PendulumBob[], deskTempo: unknown): string {
  const lines = ["title,winder,tempo,finish,hand,beat,weight,tags,latched,rested,cased,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readBobs(cards)) {
    const gap = tempoGap(card.tempo, deskTempo);
    lines.push([
      csvCell(card.title),
      csvCell(card.winder),
      card.tempo,
      card.finish,
      card.hand,
      card.beat === null ? "" : String(card.beat),
      String(card.weight),
      card.tags.join(" "),
      card.latched ? "1" : "0",
      card.rested ? "1" : "0",
      card.cased ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBob(card, deskTempo) ? "1" : "0",
      idleBob(card) ? "1" : "0",
      keenTempo(card.tempo) ? "1" : "0",
      stillTempo(card.tempo) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      tempoBand(card.tempo),
      briskBob(card) ? "1" : "0",
      restingBob(card) ? "1" : "0",
      overdueBob(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function charterRecord(raw: CharterValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: CharterValue): boolean {
  const row = charterRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type CharterParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function charterText(raw: CharterValue): string {
  if (hasBlocked(raw)) return "";
  const row = charterRecord(raw);
  if (row && !("documentsStatus" in row) && !("code" in row)) return "";
  return row ? clip(row.documentsStatus ?? row.code, 32) : clip(raw, 32);
}

function charterParts(raw: CharterValue): CharterParts | null {
  const text = charterText(raw);
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

/** A blocked money field clears the plate. A real document status is set. A blank or broken status is clear. */
export function charterState(raw: CharterValue): CharterState {
  if (hasBlocked(raw)) return "";
  const row = charterRecord(raw);
  if (row && !("documentsStatus" in row) && !("code" in row)) return "";
  return charterParts(raw) ? "set" : "clear";
}

/** APPROVED is a hall, PENDING is a porch, a separator is a gate, and a plain word is a yard. */
export function charterLane(raw: CharterValue): CharterLane {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "approved") return "hall";
  if (key === "pending") return "porch";
  if (parts.seps >= 1) return "gate";
  return "yard";
}

/** The first two letters. */
export function charterStamp(raw: CharterValue): string {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** APPROVED is champagne, PENDING is graphite, and other statuses follow the last letter. */
export function charterHue(raw: CharterValue): CharterHue {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  if (!parts) return "";
  const lane = charterLane(raw);
  if (lane === "hall") return "champagne";
  if (lane === "porch") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function charterTwin(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function charterWide(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function charterNotch(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function charterEcho(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function charterLeap(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function charterSlash(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function charterKnown(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function charterCap(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function charterTail(raw: CharterValue): boolean {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function charterScore(raw: CharterValue): number {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return parts ? parts.score : 0;
}

export function charterStep(raw: CharterValue): number {
  const parts = charterState(raw) === "set" ? charterParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function charterLanes(rows: readonly CharterRow[]): CharterLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = charterLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCharter(rows: readonly CharterRow[]): string {
  const bars = charterLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCharterHue(rows: readonly CharterRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = charterHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedCharterCount(rows: readonly CharterRow[]): number {
  const marks = rows.map((row) => charterStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCharterCount(rows: readonly CharterRow[], lane: CharterLane): number {
  return rows.filter((row) => charterLane(row.note) === lane).length;
}

export function charterShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCharterLanes(rows: readonly CharterRow[]): string[] {
  return charterLanes(rows).map((line) => line.lane);
}

export function readHiddenCharters(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCharters(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCharter(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCharterReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCharterReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCharterLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCharters(
  rows: readonly CharterRow[],
  lane: string,
  hue: string,
  query: string,
  review: CharterReview,
  reviewed: readonly string[],
  shape: CharterShape,
): CharterRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (charterState(row.note) === "") return false;
    const found = charterLane(row.note);
    const hueName = charterHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${charterText(row.note)} ${charterStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "porch" && found !== "porch") return false;
    if (shape === "yard" && found !== "yard") return false;
    if (shape === "gate" && found !== "gate") return false;
    if (shape === "wide" && !charterWide(row.note)) return false;
    if (shape === "notch" && !charterNotch(row.note)) return false;
    if (shape === "leap" && !charterLeap(row.note)) return false;
    if (shape === "slash" && !charterSlash(row.note)) return false;
    if (shape === "twin" && !charterTwin(row.note)) return false;
    if (shape === "known" && !charterKnown(row.note)) return false;
    if (shape === "echo" && !charterEcho(row.note)) return false;
    return true;
  });
}

export function charterCopy(raw: CharterValue): string {
  return [charterStamp(raw), charterLane(raw), charterHue(raw)].filter(Boolean).join(" ");
}

export function charterLanesCsv(rows: readonly CharterRow[]): string {
  const lines = ["lane,count"];
  for (const line of charterLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function charterRowsCsv(rows: readonly CharterRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (charterState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(charterText(row.note)),
      charterStamp(row.note),
      charterLane(row.note),
      charterHue(row.note),
      String(charterStep(row.note)),
      charterEcho(row.note) ? "1" : "0",
      charterWide(row.note) ? "1" : "0",
      charterNotch(row.note) ? "1" : "0",
      charterLeap(row.note) ? "1" : "0",
      charterSlash(row.note) ? "1" : "0",
      charterTwin(row.note) ? "1" : "0",
      charterKnown(row.note) ? "1" : "0",
      charterCap(row.note) ? "1" : "0",
      charterTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
