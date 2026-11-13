/**
 * Reflecting-circle sights for a bench book kept in this browser, and phone plates read the number already stored on the account.
 * Circles are mirror, vernier, index, and alidade. Inks are pearl, bronze, and pitch.
 * Degrees are 30, 60, or 90. Stops are 2, 6, or 12.
 * A leading plus with 90, 49, 44, 7, or 1 is a house line. A plus without those codes is a plus line.
 * A leading zero is a trunk. Twelve digits or more are long. Seven to eleven are a desk line. Fewer are short.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_reflecting_sight (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   circle text not null default '',
 *   finish text not null default '',
 *   ink text not null default '',
 *   degree_no integer,
 *   stop_no integer not null default 2,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_phone_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_phone_review (
 *   trader_id text primary key
 * );
 */

export const RFC_KEY = "crmv4-reflecting-sight";
export const RFC_VIEW_KEY = "crmv4-reflecting-views";
export const RFC_DENSITY_KEY = "crmv4-reflecting-density";
export const PHN_KEY = "crmv4-phone-hide";
export const PHN_REVIEW_KEY = "crmv4-phone-review";

export const REFLECT_CIRCLES = ["mirror", "vernier", "index", "alidade"] as const;

export type ReflectCircle = (typeof REFLECT_CIRCLES)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type InkName = "blank" | "pearl" | "bronze" | "pitch";

export type ReflectTray = "bench" | "case" | "chest";

export type ReflectDensity = "air" | "tight";

export type ReflectSort = "circle" | "keeper";

export type ReflectingSight = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  circle: string;
  degree: number | null;
  finish: string;
  ink: string;
  stop: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type ReflectView = {
  id: string;
  name: string;
  tray: ReflectTray;
  query: string;
  keeper: string;
  finish: string;
  ink: string;
  circle: string;
  degree: string;
  stop: string;
};

export type ReflectCounts = {
  bench: number;
  case: number;
  chest: number;
  logged: number;
  keen: number;
  still: number;
  soon: number;
  stop: number;
  house: number;
  degree: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  even: number;
};

export type PhoneLane = "" | "house" | "plus" | "trunk" | "long" | "desk" | "short";

export type PhoneHue = "" | "ivory" | "graphite" | "champagne";

export type PhoneState = "" | "clear" | "set";

export type PhoneShape = "all" | "house" | "plus" | "trunk" | "long" | "desk" | "short" | "wide" | "dash" | "leap" | "twin" | "known" | "echo" | "even" | "odd" | "space" | "paren" | "tail" | "cap";

export type PhoneReview = "all" | "reviewed" | "fresh";

export type PhoneValue = string | { phone?: unknown; [key: string]: unknown } | null | undefined;

export type PhoneRow = { id: string; label: string; note: PhoneValue };

export type PhoneLaneLine = { lane: string; count: number };

export const ROUND283_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "degree",
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
  "phone",
  "phone-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "log", "unlog", "lock", "resume", "stow", "open", "finish", "tag", "stop", "degree", "dip", "star"] as const;

const FINISHES = ["ivory", "graphite", "champagne"] as const;

const INKS = ["pearl", "bronze", "pitch"] as const;

const DEGREE_CYCLE = [30, 60, 90] as const;

const STOP_CYCLE = [2, 6, 12] as const;

const KEEN = new Set(["vernier", "alidade"]);

const STILL = new Set(["mirror", "index"]);

const HOUSE_FINISH = new Set(["GRAPHITE", "CHAMPAGNE"]);

const NOON = new Set(["vernier"]);

const LANE_ORDER = ["house", "plus", "trunk", "long", "desk", "short"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const HOUSE_PREFIX = ["90", "49", "44", "7", "1"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ReflectTray {
  return raw === "case" || raw === "chest" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ns]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: ReflectingSight, tray: ReflectTray): boolean {
  if (tray === "case") return card.locked && !card.stowed;
  if (tray === "chest") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function circleIndex(circle: string): number {
  return REFLECT_CIRCLES.indexOf(circle as ReflectCircle);
}

function stopIndex(stop: number): number {
  return STOP_CYCLE.indexOf(stop as (typeof STOP_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function circleOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (REFLECT_CIRCLES as readonly string[]).includes(text) ? text : "";
}

/** A degree is 30, 60, or 90. Anything else stays blank. */
export function reflectingDegree(raw: unknown): 30 | 60 | 90 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (DEGREE_CYCLE as readonly number[]).includes(value) ? (value as 30 | 60 | 90) : null;
}

/** A stop is 2, 6, or 12. Anything else stays blank. */
export function reflectingStop(raw: unknown): 2 | 6 | 12 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (STOP_CYCLE as readonly number[]).includes(value) ? (value as 2 | 6 | 12) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is the upper case name. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Ink is pearl, bronze, or pitch. A blank ink stays blank. */
export function inkOf(raw: unknown): string {
  return inkName(raw);
}

export function keenCircle(circle: unknown): boolean {
  return KEEN.has(clip(circle, 12).toLowerCase());
}

export function stillCircle(circle: unknown): boolean {
  return STILL.has(clip(circle, 12).toLowerCase());
}

/** Mirror is dawn. Vernier is noon. Index is dusk. Alidade is night. */
export function circleBand(circle: unknown): string {
  const text = circleOf(circle);
  if (!text) return "";
  if (text === "mirror") return "dawn";
  if (NOON.has(text)) return "noon";
  if (text === "index") return "dusk";
  return "night";
}

/** Signed distance from one circle to the desk circle. */
export function circleGap(from: unknown, to: unknown): number | null {
  const left = circleIndex(circleOf(from));
  const right = circleIndex(circleOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_FINISH.has(finishOf(finish));
}

/** An even stop is 6. Two and twelve are odd. A blank stop is not even. */
export function evenStop(stop: unknown): boolean {
  return reflectingStop(stop) === 6;
}

export function activeCircle(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return circleOf(text) || "all";
}

export function activeDegree(raw: unknown): string {
  const degree = reflectingDegree(raw);
  return degree === null ? "all" : String(degree);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = inkOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeStop(raw: unknown): string {
  const stop = reflectingStop(raw);
  return stop === null ? "all" : String(stop);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveReflectFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly ReflectingSight[]): string {
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

/** Before eight, suggest thirty. Through the afternoon, sixty. Evening asks for ninety. Saved degrees win when any exist. */
export function suggestDegree(cards: readonly ReflectingSight[], hour: number): 30 | 60 | 90 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || card.degree === null) continue;
    counts.set(card.degree, (counts.get(card.degree) || 0) + 1);
  }
  let best: 30 | 60 | 90 | null = null;
  let score = 0;
  for (const degree of DEGREE_CYCLE) {
    const count = counts.get(degree) || 0;
    if (count > score) {
      best = degree;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 30;
  if (hour < 18) return 60;
  return 90;
}

/** Before eleven, suggest the mirror. The rest of the day suggests the alidade. */
export function suggestCircle(hour: number): ReflectCircle {
  return hour < 11 ? "mirror" : "alidade";
}

/** The keeper with the fewest unlogged bench sights. A tie keeps the roster order. */
export function fairKeeper(cards: readonly ReflectingSight[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.logged);
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

export function readReflecting(raw: unknown): ReflectingSight[] {
  if (!Array.isArray(raw)) return [];
  const out: ReflectingSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ReflectingSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      circle: circleOf(row.circle),
      degree: reflectingDegree(row.degree),
      finish: finishOf(row.finish),
      ink: inkOf(row.ink),
      stop: reflectingStop(row.stop) ?? 2,
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

export function addReflecting(
  cards: readonly ReflectingSight[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    circle?: string;
    degree?: unknown;
    finish?: string;
    ink?: string;
    stop?: unknown;
    tags?: string;
  },
): ReflectingSight[] {
  const current = readReflecting(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ReflectingSight = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    circle: circleOf(card.circle),
    degree: reflectingDegree(card.degree),
    finish: finishOf(card.finish),
    ink: inkOf(card.ink),
    stop: reflectingStop(card.stop) ?? 2,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly ReflectingSight[], id: string, change: (card: ReflectingSight) => ReflectingSight): ReflectingSight[] {
  return readReflecting(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly ReflectingSight[], ids: readonly string[], change: (card: ReflectingSight) => ReflectingSight): ReflectingSight[] {
  const picked = new Set(ids);
  return readReflecting(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editReflecting(cards: readonly ReflectingSight[], id: string, title: string): ReflectingSight[] {
  const next = lineOf(title);
  if (!next) return readReflecting(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editReflectingNote(cards: readonly ReflectingSight[], id: string, note: string): ReflectingSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setReflectingLogged(cards: readonly ReflectingSight[], id: string, logged: boolean): ReflectingSight[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setReflectingLock(cards: readonly ReflectingSight[], id: string, locked: boolean): ReflectingSight[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setReflectingStow(cards: readonly ReflectingSight[], id: string, stowed: boolean): ReflectingSight[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setReflectingStar(cards: readonly ReflectingSight[], id: string, flagged: boolean): ReflectingSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setReflectingFinish(cards: readonly ReflectingSight[], id: string, finish: unknown): ReflectingSight[] {
  const next = finishOf(finish);
  if (!next) return readReflecting(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Ink steps pearl, bronze, pitch, then pearl again. A blank ink starts at pearl. */
export function cycleInk(cards: readonly ReflectingSight[], id: string): ReflectingSight[] {
  return mapCard(cards, id, (card) => {
    const at = INKS.indexOf(card.ink as (typeof INKS)[number]);
    const next = at < 0 ? INKS[0] : INKS[(at + 1) % INKS.length];
    return next === card.ink ? card : { ...card, ink: next, audit: "ink" };
  });
}

export function addReflectingTag(cards: readonly ReflectingSight[], id: string, tag: string): ReflectingSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readReflecting(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank degree becomes 30, 30 becomes 60, and 60 becomes 90. A degree of 90 stays. */
export function liftDegree(cards: readonly ReflectingSight[], id: string): ReflectingSight[] {
  return mapCard(cards, id, (card) => {
    if (card.degree === 90) return card;
    const next = card.degree === 60 ? 90 : card.degree === 30 ? 60 : 30;
    return { ...card, degree: next, audit: "degree" };
  });
}

/** A blank degree becomes 90, 90 becomes 60, and 60 becomes 30. A degree of 30 stays. */
export function dipDegree(cards: readonly ReflectingSight[], id: string): ReflectingSight[] {
  return mapCard(cards, id, (card) => {
    if (card.degree === 30) return card;
    const next = card.degree === 60 ? 30 : card.degree === 90 ? 60 : 90;
    return { ...card, degree: next, audit: "dip" };
  });
}

export function raiseStop(cards: readonly ReflectingSight[], id: string): ReflectingSight[] {
  return mapCard(cards, id, (card) => {
    const at = stopIndex(card.stop);
    if (at < 0) return { ...card, stop: 2, audit: "stop" };
    if (at === STOP_CYCLE.length - 1) return card;
    return { ...card, stop: STOP_CYCLE[at + 1], audit: "stop" };
  });
}

export function lowerStop(cards: readonly ReflectingSight[], id: string): ReflectingSight[] {
  return mapCard(cards, id, (card) => {
    const at = stopIndex(card.stop);
    if (at <= 0) return card;
    return { ...card, stop: STOP_CYCLE[at - 1], audit: "stop" };
  });
}

export function bulkReflectingLog(cards: readonly ReflectingSight[], ids: readonly string[]): ReflectingSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkReflectingStow(cards: readonly ReflectingSight[], ids: readonly string[]): ReflectingSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkReflectingPitch(cards: readonly ReflectingSight[], ids: readonly string[]): ReflectingSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, ink: "pitch", audit: "ink" }));
}

export function bulkReflectingChampagne(cards: readonly ReflectingSight[], ids: readonly string[]): ReflectingSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkReflectingTag(cards: readonly ReflectingSight[], ids: readonly string[], tag: string): ReflectingSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readReflecting(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly ReflectingSight[], ids: readonly string[], index: number, change: (list: readonly ReflectingSight[], id: string) => ReflectingSight[]): ReflectingSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readReflecting(cards);
}

export function liftDegreeFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  return focused(cards, ids, index, liftDegree);
}

export function dipDegreeFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  return focused(cards, ids, index, dipDegree);
}

export function inkFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  return focused(cards, ids, index, cycleInk);
}

export function raiseStopFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  return focused(cards, ids, index, raiseStop);
}

export function lowerStopFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  return focused(cards, ids, index, lowerStop);
}

export function logReflectingFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  const id = ids[index];
  if (!id) return readReflecting(cards);
  const card = readReflecting(cards).find((item) => item.id === id);
  return card ? setReflectingLogged(cards, id, !card.logged) : readReflecting(cards);
}

export function lockReflectingFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  const id = ids[index];
  if (!id) return readReflecting(cards);
  const card = readReflecting(cards).find((item) => item.id === id);
  return card ? setReflectingLock(cards, id, !card.locked) : readReflecting(cards);
}

export function starReflectingFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number): ReflectingSight[] {
  const id = ids[index];
  if (!id) return readReflecting(cards);
  const card = readReflecting(cards).find((item) => item.id === id);
  return card ? setReflectingStar(cards, id, !card.flagged) : readReflecting(cards);
}

export function tagReflectingFocused(cards: readonly ReflectingSight[], ids: readonly string[], index: number, tag: string): ReflectingSight[] {
  const id = ids[index];
  return id ? addReflectingTag(cards, id, tag) : readReflecting(cards);
}

export function readReflectingViews(raw: unknown): ReflectView[] {
  if (!Array.isArray(raw)) return [];
  const out: ReflectView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ReflectView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      finish: activeFinish(row.finish),
      ink: activeInk(row.ink, INKS),
      circle: activeCircle(row.circle),
      degree: activeDegree(row.degree),
      stop: activeStop(row.stop),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addReflectingView(
  views: readonly ReflectView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    finish?: string;
    ink?: string;
    circle?: string;
    degree?: string;
    stop?: string;
  },
): ReflectView[] {
  const current = readReflectingViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: ReflectView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    finish: activeFinish(view.finish),
    ink: activeInk(view.ink, INKS),
    circle: activeCircle(view.circle),
    degree: activeDegree(view.degree),
    stop: activeStop(view.stop),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropReflectingView(views: readonly ReflectView[], id: string): ReflectView[] {
  return readReflectingViews(views).filter((view) => view.id !== id);
}

export function reflectingDensity(raw: unknown): ReflectDensity {
  return raw === "tight" ? "tight" : "air";
}

/** A sight more than one circle behind the desk, at stop 2, is late. */
export function lateReflecting(card: ReflectingSight, deskCircle: unknown): boolean {
  const gap = circleGap(card.circle, deskCircle);
  return card.stop === 2 && gap !== null && gap > 1;
}

export function idleReflecting(card: ReflectingSight): boolean {
  return card.ink === "pearl" && stillCircle(card.circle) && card.stop === 2;
}

export function briskReflecting(card: ReflectingSight): boolean {
  return card.stop === 12 && card.ink === "bronze" && keenCircle(card.circle);
}

export function restingReflecting(card: ReflectingSight): boolean {
  return card.degree === 90 && card.ink === "pitch" && card.circle === "alidade";
}

/** A degree of thirty on a keen circle is overdue unless the sight is logged. */
export function overdueReflecting(card: ReflectingSight): boolean {
  return card.degree === 30 && keenCircle(card.circle) && !card.logged;
}

export function visibleReflecting(
  cards: readonly ReflectingSight[],
  tray: ReflectTray,
  query: string,
  keeper: string,
  finish: string,
  ink: string,
  circle: string,
  degree: string,
  stop: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): ReflectingSight[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const inkOn = ink === "all" ? "" : inkOf(ink);
  const circleOn = circle === "all" ? "" : activeCircle(circle);
  const degreeOn = degree === "all" ? "" : activeDegree(degree);
  const stopOn = stop === "all" ? "" : activeStop(stop);
  return readReflecting(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (inkOn && card.ink !== inkOn) return false;
    if (circleOn === "keen" && !keenCircle(card.circle)) return false;
    if (circleOn === "still" && !stillCircle(card.circle)) return false;
    if (circleOn && circleOn !== "keen" && circleOn !== "still" && card.circle !== circleOn) return false;
    if (degreeOn && String(card.degree ?? "") !== degreeOn) return false;
    if (stopOn && String(card.stop) !== stopOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenCircle(card.circle)) return false;
    if (stillOnly && !stillCircle(card.circle)) return false;
    return true;
  });
}

export function sortReflecting(cards: readonly ReflectingSight[], sort: ReflectSort): ReflectingSight[] {
  return cards.slice().sort((a, b) => {
    if (a.logged !== b.logged) return a.logged ? -1 : 1;
    if (sort === "keeper") {
      const helm = a.keeper.localeCompare(b.keeper);
      if (helm) return helm;
    }
    const circle = (circleIndex(a.circle) < 0 ? 99 : circleIndex(a.circle)) - (circleIndex(b.circle) < 0 ? 99 : circleIndex(b.circle));
    if (circle) return circle;
    return a.title.localeCompare(b.title);
  });
}

export function reflectingCounts(cards: readonly ReflectingSight[], shown: readonly ReflectingSight[], deskCircle: unknown): ReflectCounts {
  const open = cards.filter((card) => inTray(card, "bench"));
  return {
    bench: open.length,
    case: cards.filter((card) => inTray(card, "case")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    logged: open.filter((card) => card.logged).length,
    keen: open.filter((card) => keenCircle(card.circle)).length,
    still: open.filter((card) => stillCircle(card.circle)).length,
    soon: open.filter((card) => card.degree === 30).length,
    stop: open.reduce((sum, card) => sum + card.stop, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    degree: open.filter((card) => card.degree !== null).length,
    matched: shown.filter((card) => card.circle && card.circle === circleOf(deskCircle)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleReflecting(card)).length,
    brisk: open.filter((card) => briskReflecting(card)).length,
    resting: open.filter((card) => restingReflecting(card)).length,
    overdue: open.filter((card) => overdueReflecting(card)).length,
    even: open.filter((card) => evenStop(card.stop)).length,
  };
}

export function clashCircleCount(cards: readonly ReflectingSight[]): number {
  const open = cards.filter((card) => inTray(card, "bench") && card.circle);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.circle === card.circle && other.stop === card.stop)).length;
}

export function neighborReflectCount(cards: readonly ReflectingSight[]): number {
  const open = cards.filter((card) => inTray(card, "bench") && stopIndex(card.stop) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(stopIndex(other.stop) - stopIndex(card.stop));
    const ring = Math.min(gap, STOP_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly ReflectingSight[]): string {
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

export function reminderReflecting(cards: readonly ReflectingSight[]): ReflectingSight[] {
  return cards.filter((card) => inTray(card, "bench") && (card.degree === 30 || card.degree === 60));
}

export function idleReflectingList(cards: readonly ReflectingSight[]): ReflectingSight[] {
  return cards.filter((card) => inTray(card, "bench") && idleReflecting(card));
}

export function reflectingTimeline(cards: readonly ReflectingSight[]): { stop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return STOP_CYCLE.map((stop) => ({ stop, titles: open.filter((card) => card.stop === stop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function reflectingBars(cards: readonly ReflectingSight[]): { circle: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return REFLECT_CIRCLES.map((circle) => ({ circle, count: open.filter((card) => card.circle === circle).length }));
}

export function reflectingKeepers(cards: readonly ReflectingSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function reflectingCopy(card: ReflectingSight): string {
  return [card.title, card.keeper, card.circle, card.finish, card.ink, card.degree ?? "", card.stop, card.note].filter((item) => item !== "").join(" · ");
}

export function reflectingCsv(cards: readonly ReflectingSight[], deskCircle: unknown): string {
  const lines = ["title,keeper,circle,finish,ink,degree,stop,tags,logged,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,even,audit,note"];
  for (const card of readReflecting(cards)) {
    const gap = circleGap(card.circle, deskCircle);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.circle,
      card.finish,
      card.ink,
      card.degree === null ? "" : String(card.degree),
      String(card.stop),
      card.tags.join(" "),
      card.logged ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateReflecting(card, deskCircle) ? "1" : "0",
      idleReflecting(card) ? "1" : "0",
      keenCircle(card.circle) ? "1" : "0",
      stillCircle(card.circle) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      circleBand(card.circle),
      briskReflecting(card) ? "1" : "0",
      restingReflecting(card) ? "1" : "0",
      overdueReflecting(card) ? "1" : "0",
      evenStop(card.stop) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function phoneRecord(raw: PhoneValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: PhoneValue): boolean {
  const row = phoneRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type PhoneParts = { given: string; digits: string; plus: boolean; trunk: boolean; groups: number };

function phoneGiven(raw: PhoneValue): string {
  if (hasBlocked(raw)) return "";
  const row = phoneRecord(raw);
  if (row && !("phone" in row)) return "";
  return row ? clip(row.phone, 32) : clip(raw, 32);
}

function phoneParts(raw: PhoneValue): PhoneParts | null {
  const given = phoneGiven(raw);
  const digits = given.replace(/\D/g, "");
  if (!digits) return null;
  const groups = given.split(/[^\d]+/).filter(Boolean).length;
  return {
    given,
    digits,
    plus: given.startsWith("+"),
    trunk: !given.startsWith("+") && given.startsWith("0"),
    groups,
  };
}

/** A blocked money field clears the plate. A real number is set. A blank or digit-free line is clear. */
export function phoneState(raw: PhoneValue): PhoneState {
  if (hasBlocked(raw)) return "";
  const row = phoneRecord(raw);
  if (row && !("phone" in row)) return "";
  return phoneParts(raw) ? "set" : "clear";
}

function housePrefix(digits: string): boolean {
  return HOUSE_PREFIX.some((prefix) => digits.startsWith(prefix));
}

/** House codes are 90, 49, 44, 7, and 1 after a plus. A bare plus is a plus line. A leading zero is a trunk. */
export function phoneLane(raw: PhoneValue): PhoneLane {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  if (!parts) return "";
  if (parts.plus && housePrefix(parts.digits)) return "house";
  if (parts.plus) return "plus";
  if (parts.trunk) return "trunk";
  if (parts.digits.length >= 12) return "long";
  if (parts.digits.length >= 7) return "desk";
  return "short";
}

/** The last two digits. */
export function phoneStamp(raw: PhoneValue): string {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return parts ? parts.digits.slice(-2) : "";
}

/** Ivory ends in 0–2. Graphite ends in 3–6. Champagne ends in 7–9. */
export function phoneHue(raw: PhoneValue): PhoneHue {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  if (!parts) return "";
  const last = Number(parts.digits.slice(-1));
  if (last <= 2) return "ivory";
  if (last <= 6) return "graphite";
  return "champagne";
}

export function phoneTwin(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && /(\d)\1/.test(parts.digits));
}

export function phoneWide(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.digits.length > 11);
}

export function phoneDash(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.given.includes("-"));
}

export function phoneSpace(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && /\s/.test(parts.given));
}

export function phoneParen(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && /[()]/.test(parts.given));
}

export function phoneLeap(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.digits.length === 10);
}

export function phoneKnown(raw: PhoneValue): boolean {
  return phoneLane(raw) === "house";
}

export function phoneCap(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.plus);
}

/** A zero ending. Any other ending is not a tail. */
export function phoneTail(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.digits.endsWith("0"));
}

export function phoneEcho(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  if (!parts || parts.digits.length < 2) return false;
  return parts.digits[0] === parts.digits[parts.digits.length - 1];
}

export function phoneEven(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.digits.length % 2 === 0);
}

export function phoneOdd(raw: PhoneValue): boolean {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return Boolean(parts && parts.digits.length % 2 === 1);
}

export function phoneGroups(raw: PhoneValue): number {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return parts ? parts.groups : 0;
}

export function phoneStep(raw: PhoneValue): number {
  const parts = phoneState(raw) === "set" ? phoneParts(raw) : null;
  return parts ? parts.digits.length : 0;
}

export function phoneLanes(rows: readonly PhoneRow[]): PhoneLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = phoneLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPhone(rows: readonly PhoneRow[]): string {
  const bars = phoneLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPhoneHue(rows: readonly PhoneRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = phoneHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedPhoneCount(rows: readonly PhoneRow[]): number {
  const marks = rows.map((row) => phoneStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function lanePhoneCount(rows: readonly PhoneRow[], lane: PhoneLane): number {
  return rows.filter((row) => phoneLane(row.note) === lane).length;
}

export function phoneShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPhoneLanes(rows: readonly PhoneRow[]): string[] {
  return phoneLanes(rows).map((line) => line.lane);
}

export function readHiddenPhones(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPhones(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePhone(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePhoneReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPhoneReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePhoneLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visiblePhones(
  rows: readonly PhoneRow[],
  lane: string,
  hue: string,
  query: string,
  review: PhoneReview,
  reviewed: readonly string[],
  shape: PhoneShape,
): PhoneRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (phoneState(row.note) === "") return false;
    const found = phoneLane(row.note);
    const hueName = phoneHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${phoneGiven(row.note)} ${phoneStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "plus" && found !== "plus") return false;
    if (shape === "trunk" && found !== "trunk") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "short" && found !== "short") return false;
    if (shape === "wide" && !phoneWide(row.note)) return false;
    if (shape === "dash" && !phoneDash(row.note)) return false;
    if (shape === "leap" && !phoneLeap(row.note)) return false;
    if (shape === "twin" && !phoneTwin(row.note)) return false;
    if (shape === "known" && !phoneKnown(row.note)) return false;
    if (shape === "echo" && !phoneEcho(row.note)) return false;
    if (shape === "even" && !phoneEven(row.note)) return false;
    if (shape === "odd" && !phoneOdd(row.note)) return false;
    if (shape === "space" && !phoneSpace(row.note)) return false;
    if (shape === "paren" && !phoneParen(row.note)) return false;
    if (shape === "tail" && !phoneTail(row.note)) return false;
    if (shape === "cap" && !phoneCap(row.note)) return false;
    return true;
  });
}

export function phoneCopy(raw: PhoneValue): string {
  return [phoneStamp(raw), phoneLane(raw), phoneHue(raw)].filter(Boolean).join(" ");
}

export function phoneLanesCsv(rows: readonly PhoneRow[]): string {
  const lines = ["lane,count"];
  for (const line of phoneLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function phoneRowsCsv(rows: readonly PhoneRow[], reviewed: readonly string[]): string {
  const lines = ["name,phone,stamp,lane,hue,step,groups,echo,wide,dash,leap,twin,known,cap,tail,even,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (phoneState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(phoneGiven(row.note)),
      phoneStamp(row.note),
      phoneLane(row.note),
      phoneHue(row.note),
      String(phoneStep(row.note)),
      String(phoneGroups(row.note)),
      phoneEcho(row.note) ? "1" : "0",
      phoneWide(row.note) ? "1" : "0",
      phoneDash(row.note) ? "1" : "0",
      phoneLeap(row.note) ? "1" : "0",
      phoneTwin(row.note) ? "1" : "0",
      phoneKnown(row.note) ? "1" : "0",
      phoneCap(row.note) ? "1" : "0",
      phoneTail(row.note) ? "1" : "0",
      phoneEven(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
