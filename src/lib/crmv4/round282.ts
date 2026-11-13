/**
 * Quadrant sights for a deck book kept in this browser, and language plates read the tongue already stored on the account.
 * Arcs are limb, vane, shade, and horizon. Inks are soot, gilt, and slate.
 * Spans are 20, 40, or 80. Notches are 1, 4, or 8.
 * A hyphen is a region. EN, TR, DE, RU, and AR are the house. Five letters or more are long.
 * Three letters are a trio. A vowel start is open. Two other letters are a pair. Four letters are a mark.
 * FR, ES, IT, PT, and NL join the house codes as known tongues.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_quadrant_sight (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   arc text not null default '',
 *   finish text not null default '',
 *   ink text not null default '',
 *   span_no integer,
 *   notch_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_language_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_language_review (
 *   trader_id text primary key
 * );
 */

export const QDR_KEY = "crmv4-quadrant-sight";
export const QDR_VIEW_KEY = "crmv4-quadrant-views";
export const QDR_DENSITY_KEY = "crmv4-quadrant-density";
export const LNG_KEY = "crmv4-language-hide";
export const LNG_REVIEW_KEY = "crmv4-language-review";

export const QUADRANT_ARCS = ["limb", "vane", "shade", "horizon"] as const;

export type QuadrantArc = (typeof QUADRANT_ARCS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type InkName = "blank" | "soot" | "gilt" | "slate";

export type QuadrantTray = "deck" | "case" | "locker";

export type QuadrantDensity = "open" | "close";

export type QuadrantSort = "arc" | "keeper";

export type QuadrantSight = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  arc: string;
  span: number | null;
  finish: string;
  ink: string;
  notch: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type QuadrantView = {
  id: string;
  name: string;
  tray: QuadrantTray;
  query: string;
  keeper: string;
  finish: string;
  ink: string;
  arc: string;
  span: string;
  notch: string;
};

export type QuadrantCounts = {
  deck: number;
  case: number;
  locker: number;
  logged: number;
  keen: number;
  still: number;
  soon: number;
  notch: number;
  house: number;
  span: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  even: number;
};

export type LanguageLane = "" | "region" | "house" | "long" | "trio" | "open" | "pair" | "mark";

export type LanguageHue = "" | "ivory" | "graphite" | "champagne";

export type LanguageState = "" | "clear" | "set";

export type LanguageShape = "all" | "region" | "house" | "long" | "trio" | "open" | "pair" | "mark" | "wide" | "dash" | "leap" | "twin" | "known" | "echo" | "vowel";

export type LanguageReview = "all" | "reviewed" | "fresh";

export type LanguageValue = string | { language?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type LanguageRow = { id: string; label: string; note: LanguageValue };

export type LanguageLaneLine = { lane: string; count: number };

export const ROUND282_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "span",
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
  "language",
  "language-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "log", "unlog", "lock", "resume", "stow", "open", "finish", "tag", "notch", "span", "dip", "star"] as const;

const FINISHES = ["ivory", "graphite", "champagne"] as const;

const INKS = ["soot", "gilt", "slate"] as const;

const SPAN_CYCLE = [20, 40, 80] as const;

const NOTCH_CYCLE = [1, 4, 8] as const;

const KEEN = new Set(["vane", "horizon"]);

const STILL = new Set(["limb", "shade"]);

const HOUSE_FINISH = new Set(["GRAPHITE", "CHAMPAGNE"]);

const NOON = new Set(["limb"]);

const LANE_ORDER = ["region", "house", "long", "trio", "open", "pair", "mark"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const HOUSE = new Set(["EN", "TR", "DE", "RU", "AR"]);

const KNOWN = new Set(["EN", "TR", "DE", "RU", "AR", "FR", "ES", "IT", "PT", "NL"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): QuadrantTray {
  return raw === "case" || raw === "locker" ? raw : "deck";
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
    if (!/^[ew]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: QuadrantSight, tray: QuadrantTray): boolean {
  if (tray === "case") return card.locked && !card.stowed;
  if (tray === "locker") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function arcIndex(arc: string): number {
  return QUADRANT_ARCS.indexOf(arc as QuadrantArc);
}

function notchIndex(notch: number): number {
  return NOTCH_CYCLE.indexOf(notch as (typeof NOTCH_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function arcOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (QUADRANT_ARCS as readonly string[]).includes(text) ? text : "";
}

/** A span is 20, 40, or 80. Anything else stays blank. */
export function quadrantSpan(raw: unknown): 20 | 40 | 80 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 20 | 40 | 80) : null;
}

/** A notch is 1, 4, or 8. Anything else stays blank. */
export function quadrantNotch(raw: unknown): 1 | 4 | 8 | null {
  const text = clip(raw, 1);
  if (!text) return null;
  const value = Number(text);
  return (NOTCH_CYCLE as readonly number[]).includes(value) ? (value as 1 | 4 | 8) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is the upper case name. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Ink is soot, gilt, or slate. A blank ink stays blank. */
export function inkOf(raw: unknown): string {
  return inkName(raw);
}

export function keenArc(arc: unknown): boolean {
  return KEEN.has(clip(arc, 12).toLowerCase());
}

export function stillArc(arc: unknown): boolean {
  return STILL.has(clip(arc, 12).toLowerCase());
}

/** Limb is noon. Vane is the rise. Shade is the set. Horizon is night. */
export function arcBand(arc: unknown): string {
  const text = arcOf(arc);
  if (!text) return "";
  if (NOON.has(text)) return "noon";
  if (text === "vane") return "rise";
  if (text === "shade") return "set";
  return "night";
}

/** Signed distance from one arc to the desk arc. */
export function arcGap(from: unknown, to: unknown): number | null {
  const left = arcIndex(arcOf(from));
  const right = arcIndex(arcOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_FINISH.has(finishOf(finish));
}

/** An even notch is 4. One and eight are odd. A blank notch is not even. */
export function evenNotch(notch: unknown): boolean {
  return quadrantNotch(notch) === 4;
}

export function activeArc(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return arcOf(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = quadrantSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = inkOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeNotch(raw: unknown): string {
  const notch = quadrantNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveQuadrantFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly QuadrantSight[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || !card.finish) continue;
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

/** Before eight, suggest twenty. Through the afternoon, forty. Evening asks for eighty. Saved spans win when any exist. */
export function suggestSpan(cards: readonly QuadrantSight[], hour: number): 20 | 40 | 80 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || card.span === null) continue;
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
  if (best !== null) return best;
  if (hour < 8) return 20;
  if (hour < 18) return 40;
  return 80;
}

/** Before eleven, suggest the limb. The rest of the day suggests the horizon. */
export function suggestArc(hour: number): QuadrantArc {
  return hour < 11 ? "limb" : "horizon";
}

/** The keeper with the fewest unlogged deck sights. A tie keeps the roster order. */
export function fairKeeper(cards: readonly QuadrantSight[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "deck") && !card.logged);
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

export function readQuadrants(raw: unknown): QuadrantSight[] {
  if (!Array.isArray(raw)) return [];
  const out: QuadrantSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuadrantSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      arc: arcOf(row.arc),
      span: quadrantSpan(row.span),
      finish: finishOf(row.finish),
      ink: inkOf(row.ink),
      notch: quadrantNotch(row.notch) ?? 1,
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

export function addQuadrant(
  cards: readonly QuadrantSight[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    arc?: string;
    span?: unknown;
    finish?: string;
    ink?: string;
    notch?: unknown;
    tags?: string;
  },
): QuadrantSight[] {
  const current = readQuadrants(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: QuadrantSight = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    arc: arcOf(card.arc),
    span: quadrantSpan(card.span),
    finish: finishOf(card.finish),
    ink: inkOf(card.ink),
    notch: quadrantNotch(card.notch) ?? 1,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly QuadrantSight[], id: string, change: (card: QuadrantSight) => QuadrantSight): QuadrantSight[] {
  return readQuadrants(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly QuadrantSight[], ids: readonly string[], change: (card: QuadrantSight) => QuadrantSight): QuadrantSight[] {
  const picked = new Set(ids);
  return readQuadrants(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editQuadrant(cards: readonly QuadrantSight[], id: string, title: string): QuadrantSight[] {
  const next = lineOf(title);
  if (!next) return readQuadrants(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editQuadrantNote(cards: readonly QuadrantSight[], id: string, note: string): QuadrantSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setQuadrantLogged(cards: readonly QuadrantSight[], id: string, logged: boolean): QuadrantSight[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setQuadrantLock(cards: readonly QuadrantSight[], id: string, locked: boolean): QuadrantSight[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setQuadrantStow(cards: readonly QuadrantSight[], id: string, stowed: boolean): QuadrantSight[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setQuadrantStar(cards: readonly QuadrantSight[], id: string, flagged: boolean): QuadrantSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setQuadrantFinish(cards: readonly QuadrantSight[], id: string, finish: unknown): QuadrantSight[] {
  const next = finishOf(finish);
  if (!next) return readQuadrants(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Ink steps soot, gilt, slate, then soot again. A blank ink starts at soot. */
export function cycleInk(cards: readonly QuadrantSight[], id: string): QuadrantSight[] {
  return mapCard(cards, id, (card) => {
    const at = INKS.indexOf(card.ink as (typeof INKS)[number]);
    const next = at < 0 ? INKS[0] : INKS[(at + 1) % INKS.length];
    return next === card.ink ? card : { ...card, ink: next, audit: "ink" };
  });
}

export function addQuadrantTag(cards: readonly QuadrantSight[], id: string, tag: string): QuadrantSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readQuadrants(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 20, 20 becomes 40, and 40 becomes 80. A span of 80 stays. */
export function liftSpan(cards: readonly QuadrantSight[], id: string): QuadrantSight[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 80) return card;
    const next = card.span === 40 ? 80 : card.span === 20 ? 40 : 20;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 80, 80 becomes 40, and 40 becomes 20. A span of 20 stays. */
export function dipSpan(cards: readonly QuadrantSight[], id: string): QuadrantSight[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 20) return card;
    const next = card.span === 40 ? 20 : card.span === 80 ? 40 : 80;
    return { ...card, span: next, audit: "dip" };
  });
}

export function raiseNotch(cards: readonly QuadrantSight[], id: string): QuadrantSight[] {
  return mapCard(cards, id, (card) => {
    const at = notchIndex(card.notch);
    if (at < 0) return { ...card, notch: 1, audit: "notch" };
    if (at === NOTCH_CYCLE.length - 1) return card;
    return { ...card, notch: NOTCH_CYCLE[at + 1], audit: "notch" };
  });
}

export function lowerNotch(cards: readonly QuadrantSight[], id: string): QuadrantSight[] {
  return mapCard(cards, id, (card) => {
    const at = notchIndex(card.notch);
    if (at <= 0) return card;
    return { ...card, notch: NOTCH_CYCLE[at - 1], audit: "notch" };
  });
}

export function bulkQuadrantLog(cards: readonly QuadrantSight[], ids: readonly string[]): QuadrantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkQuadrantStow(cards: readonly QuadrantSight[], ids: readonly string[]): QuadrantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkQuadrantSlate(cards: readonly QuadrantSight[], ids: readonly string[]): QuadrantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, ink: "slate", audit: "ink" }));
}

export function bulkQuadrantChampagne(cards: readonly QuadrantSight[], ids: readonly string[]): QuadrantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkQuadrantTag(cards: readonly QuadrantSight[], ids: readonly string[], tag: string): QuadrantSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readQuadrants(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly QuadrantSight[], ids: readonly string[], index: number, change: (list: readonly QuadrantSight[], id: string) => QuadrantSight[]): QuadrantSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readQuadrants(cards);
}

export function liftSpanFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  return focused(cards, ids, index, liftSpan);
}

export function dipSpanFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  return focused(cards, ids, index, dipSpan);
}

export function inkFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  return focused(cards, ids, index, cycleInk);
}

export function raiseNotchFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  return focused(cards, ids, index, raiseNotch);
}

export function lowerNotchFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  return focused(cards, ids, index, lowerNotch);
}

export function logQuadrantFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  const id = ids[index];
  if (!id) return readQuadrants(cards);
  const card = readQuadrants(cards).find((item) => item.id === id);
  return card ? setQuadrantLogged(cards, id, !card.logged) : readQuadrants(cards);
}

export function lockQuadrantFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  const id = ids[index];
  if (!id) return readQuadrants(cards);
  const card = readQuadrants(cards).find((item) => item.id === id);
  return card ? setQuadrantLock(cards, id, !card.locked) : readQuadrants(cards);
}

export function starQuadrantFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number): QuadrantSight[] {
  const id = ids[index];
  if (!id) return readQuadrants(cards);
  const card = readQuadrants(cards).find((item) => item.id === id);
  return card ? setQuadrantStar(cards, id, !card.flagged) : readQuadrants(cards);
}

export function tagQuadrantFocused(cards: readonly QuadrantSight[], ids: readonly string[], index: number, tag: string): QuadrantSight[] {
  const id = ids[index];
  return id ? addQuadrantTag(cards, id, tag) : readQuadrants(cards);
}

export function readQuadrantViews(raw: unknown): QuadrantView[] {
  if (!Array.isArray(raw)) return [];
  const out: QuadrantView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuadrantView>;
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
      arc: activeArc(row.arc),
      span: activeSpan(row.span),
      notch: activeNotch(row.notch),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addQuadrantView(
  views: readonly QuadrantView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    finish?: string;
    ink?: string;
    arc?: string;
    span?: string;
    notch?: string;
  },
): QuadrantView[] {
  const current = readQuadrantViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: QuadrantView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    finish: activeFinish(view.finish),
    ink: activeInk(view.ink, INKS),
    arc: activeArc(view.arc),
    span: activeSpan(view.span),
    notch: activeNotch(view.notch),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropQuadrantView(views: readonly QuadrantView[], id: string): QuadrantView[] {
  return readQuadrantViews(views).filter((view) => view.id !== id);
}

export function quadrantDensity(raw: unknown): QuadrantDensity {
  return raw === "close" ? "close" : "open";
}

/** A sight more than one arc behind the desk, at notch 1, is late. */
export function lateQuadrant(card: QuadrantSight, deskArc: unknown): boolean {
  const gap = arcGap(card.arc, deskArc);
  return card.notch === 1 && gap !== null && gap > 1;
}

export function idleQuadrant(card: QuadrantSight): boolean {
  return card.ink === "soot" && stillArc(card.arc) && card.notch === 1;
}

export function briskQuadrant(card: QuadrantSight): boolean {
  return card.notch === 8 && card.ink === "gilt" && keenArc(card.arc);
}

export function restingQuadrant(card: QuadrantSight): boolean {
  return card.span === 80 && card.ink === "slate" && card.arc === "horizon";
}

/** A span of twenty on a keen arc is overdue unless the sight is logged. */
export function overdueQuadrant(card: QuadrantSight): boolean {
  return card.span === 20 && keenArc(card.arc) && !card.logged;
}

export function visibleQuadrants(
  cards: readonly QuadrantSight[],
  tray: QuadrantTray,
  query: string,
  keeper: string,
  finish: string,
  ink: string,
  arc: string,
  span: string,
  notch: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): QuadrantSight[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const inkOn = ink === "all" ? "" : inkOf(ink);
  const arcOn = arc === "all" ? "" : activeArc(arc);
  const spanOn = span === "all" ? "" : activeSpan(span);
  const notchOn = notch === "all" ? "" : activeNotch(notch);
  return readQuadrants(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (inkOn && card.ink !== inkOn) return false;
    if (arcOn === "keen" && !keenArc(card.arc)) return false;
    if (arcOn === "still" && !stillArc(card.arc)) return false;
    if (arcOn && arcOn !== "keen" && arcOn !== "still" && card.arc !== arcOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (notchOn && String(card.notch) !== notchOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenArc(card.arc)) return false;
    if (stillOnly && !stillArc(card.arc)) return false;
    return true;
  });
}

export function sortQuadrants(cards: readonly QuadrantSight[], sort: QuadrantSort): QuadrantSight[] {
  return cards.slice().sort((a, b) => {
    if (a.logged !== b.logged) return a.logged ? -1 : 1;
    if (sort === "keeper") {
      const helm = a.keeper.localeCompare(b.keeper);
      if (helm) return helm;
    }
    const arc = (arcIndex(a.arc) < 0 ? 99 : arcIndex(a.arc)) - (arcIndex(b.arc) < 0 ? 99 : arcIndex(b.arc));
    if (arc) return arc;
    return a.title.localeCompare(b.title);
  });
}

export function quadrantCounts(cards: readonly QuadrantSight[], shown: readonly QuadrantSight[], deskArc: unknown): QuadrantCounts {
  const open = cards.filter((card) => inTray(card, "deck"));
  return {
    deck: open.length,
    case: cards.filter((card) => inTray(card, "case")).length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    logged: open.filter((card) => card.logged).length,
    keen: open.filter((card) => keenArc(card.arc)).length,
    still: open.filter((card) => stillArc(card.arc)).length,
    soon: open.filter((card) => card.span === 20).length,
    notch: open.reduce((sum, card) => sum + card.notch, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: shown.filter((card) => card.arc && card.arc === arcOf(deskArc)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleQuadrant(card)).length,
    brisk: open.filter((card) => briskQuadrant(card)).length,
    resting: open.filter((card) => restingQuadrant(card)).length,
    overdue: open.filter((card) => overdueQuadrant(card)).length,
    even: open.filter((card) => evenNotch(card.notch)).length,
  };
}

export function clashArcCount(cards: readonly QuadrantSight[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && card.arc);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.arc === card.arc && other.notch === card.notch)).length;
}

export function neighborQuadrantCount(cards: readonly QuadrantSight[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && notchIndex(card.notch) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(notchIndex(other.notch) - notchIndex(card.notch));
    const ring = Math.min(gap, NOTCH_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly QuadrantSight[]): string {
  const open = cards.filter((card) => inTray(card, "deck") && card.keeper);
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

export function reminderQuadrants(cards: readonly QuadrantSight[]): QuadrantSight[] {
  return cards.filter((card) => inTray(card, "deck") && (card.span === 20 || card.span === 40));
}

export function idleQuadrants(cards: readonly QuadrantSight[]): QuadrantSight[] {
  return cards.filter((card) => inTray(card, "deck") && idleQuadrant(card));
}

export function quadrantTimeline(cards: readonly QuadrantSight[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function quadrantBars(cards: readonly QuadrantSight[]): { arc: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return QUADRANT_ARCS.map((arc) => ({ arc, count: open.filter((card) => card.arc === arc).length }));
}

export function quadrantKeepers(cards: readonly QuadrantSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function quadrantCopy(card: QuadrantSight): string {
  return [card.title, card.keeper, card.arc, card.finish, card.ink, card.span ?? "", card.notch, card.note].filter((item) => item !== "").join(" · ");
}

export function quadrantCsv(cards: readonly QuadrantSight[], deskArc: unknown): string {
  const lines = ["title,keeper,arc,finish,ink,span,notch,tags,logged,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,even,audit,note"];
  for (const card of readQuadrants(cards)) {
    const gap = arcGap(card.arc, deskArc);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.arc,
      card.finish,
      card.ink,
      card.span === null ? "" : String(card.span),
      String(card.notch),
      card.tags.join(" "),
      card.logged ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateQuadrant(card, deskArc) ? "1" : "0",
      idleQuadrant(card) ? "1" : "0",
      keenArc(card.arc) ? "1" : "0",
      stillArc(card.arc) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      arcBand(card.arc),
      briskQuadrant(card) ? "1" : "0",
      restingQuadrant(card) ? "1" : "0",
      overdueQuadrant(card) ? "1" : "0",
      evenNotch(card.notch) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function languageRecord(raw: LanguageValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: LanguageValue): boolean {
  const row = languageRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type LanguageParts = { primary: string; given: string; letters: string; dash: boolean; words: number };

function languageText(raw: LanguageValue): string {
  if (hasBlocked(raw)) return "";
  const row = languageRecord(raw);
  if (row && !("language" in row) && !("code" in row)) return "";
  return row ? clip(row.language ?? row.code, 24) : clip(raw, 24);
}

function languageParts(raw: LanguageValue): LanguageParts | null {
  const text = languageText(raw);
  if (!/^[A-Za-z]{2,8}(-[A-Za-z]{2,8})?$/.test(text)) return null;
  const primary = text.split("-")[0];
  return {
    primary,
    given: text,
    letters: primary.replace(/[^A-Za-z]/g, ""),
    dash: text.includes("-"),
    words: text.includes("-") ? 2 : 1,
  };
}

/** A blocked money field clears the plate. A real tongue is set. A blank or broken tongue is clear. */
export function languageState(raw: LanguageValue): LanguageState {
  if (hasBlocked(raw)) return "";
  const row = languageRecord(raw);
  if (row && !("language" in row) && !("code" in row)) return "";
  return languageParts(raw) ? "set" : "clear";
}

/** A hyphen is a region. House codes are EN, TR, DE, RU, and AR. Five letters are long. Three are a trio. A vowel start is open. */
export function languageLane(raw: LanguageValue): LanguageLane {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  if (!parts) return "";
  const code = parts.primary.toUpperCase();
  if (parts.dash) return "region";
  if (HOUSE.has(code)) return "house";
  if (parts.primary.length >= 5) return "long";
  if (parts.primary.length === 3) return "trio";
  if (/^[aeiou]/i.test(parts.primary)) return "open";
  if (parts.primary.length === 2) return "pair";
  return "mark";
}

/** The last two letters of the primary tag. */
export function languageStamp(raw: LanguageValue): string {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return parts ? parts.letters.slice(-2).toUpperCase() : "";
}

/** A region is ivory. The house is champagne. A long tag or a trio is graphite. A vowel start is ivory. */
export function languageHue(raw: LanguageValue): LanguageHue {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  if (!parts) return "";
  const lane = languageLane(raw);
  if (lane === "region" || lane === "open") return "ivory";
  if (lane === "house") return "champagne";
  if (lane === "long" || lane === "trio" || lane === "mark") return "graphite";
  const head = parts.letters[0]?.toUpperCase() || "";
  return head === "S" || head === "V" ? "champagne" : "graphite";
}

export function languageTwin(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function languageWide(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && parts.letters.length > 6);
}

export function languageDash(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && parts.dash);
}

export function languageEcho(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function languageLeap(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function languageKnown(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.primary.toUpperCase()));
}

export function languageCap(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

/** A consonant ending. A vowel ending is not a tail. */
export function languageTail(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && /[^aeiou]$/i.test(parts.letters));
}

export function languageVowel(raw: LanguageValue): boolean {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return Boolean(parts && /^[aeiou]/i.test(parts.letters));
}

export function languageWords(raw: LanguageValue): number {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return parts ? parts.words : 0;
}

export function languageStep(raw: LanguageValue): number {
  const parts = languageState(raw) === "set" ? languageParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function languageLanes(rows: readonly LanguageRow[]): LanguageLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = languageLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingLanguage(rows: readonly LanguageRow[]): string {
  const bars = languageLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingLanguageHue(rows: readonly LanguageRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = languageHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedLanguageCount(rows: readonly LanguageRow[]): number {
  const marks = rows.map((row) => languageStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneLanguageCount(rows: readonly LanguageRow[], lane: LanguageLane): number {
  return rows.filter((row) => languageLane(row.note) === lane).length;
}

export function languageShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLanguageLanes(rows: readonly LanguageRow[]): string[] {
  return languageLanes(rows).map((line) => line.lane);
}

export function readHiddenLanguages(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLanguages(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLanguage(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleLanguageReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLanguageReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLanguageLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleLanguages(
  rows: readonly LanguageRow[],
  lane: string,
  hue: string,
  query: string,
  review: LanguageReview,
  reviewed: readonly string[],
  shape: LanguageShape,
): LanguageRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (languageState(row.note) === "") return false;
    const found = languageLane(row.note);
    const hueName = languageHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${languageText(row.note)} ${languageStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "region" && found !== "region") return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "trio" && found !== "trio") return false;
    if (shape === "open" && found !== "open") return false;
    if (shape === "pair" && found !== "pair") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "wide" && !languageWide(row.note)) return false;
    if (shape === "dash" && !languageDash(row.note)) return false;
    if (shape === "leap" && !languageLeap(row.note)) return false;
    if (shape === "twin" && !languageTwin(row.note)) return false;
    if (shape === "known" && !languageKnown(row.note)) return false;
    if (shape === "echo" && !languageEcho(row.note)) return false;
    if (shape === "vowel" && !languageVowel(row.note)) return false;
    return true;
  });
}

export function languageCopy(raw: LanguageValue): string {
  return [languageStamp(raw), languageLane(raw), languageHue(raw)].filter(Boolean).join(" ");
}

export function languageLanesCsv(rows: readonly LanguageRow[]): string {
  const lines = ["lane,count"];
  for (const line of languageLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function languageRowsCsv(rows: readonly LanguageRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,words,echo,wide,dash,leap,twin,known,cap,tail,vowel,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (languageState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(languageText(row.note)),
      languageStamp(row.note),
      languageLane(row.note),
      languageHue(row.note),
      String(languageStep(row.note)),
      String(languageWords(row.note)),
      languageEcho(row.note) ? "1" : "0",
      languageWide(row.note) ? "1" : "0",
      languageDash(row.note) ? "1" : "0",
      languageLeap(row.note) ? "1" : "0",
      languageTwin(row.note) ? "1" : "0",
      languageKnown(row.note) ? "1" : "0",
      languageCap(row.note) ? "1" : "0",
      languageTail(row.note) ? "1" : "0",
      languageVowel(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
