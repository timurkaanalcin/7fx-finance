/**
 * Triquetrum rules for a span follow-up kept in this browser, and username plates read the username already stored on the account.
 * Spans are base, joint, sight, and crown. Ink is dry, wash, and gilt.
 * Notches are 6, 12, or 24. Pegs are 2, 6, or 9.
 * A glyph username is three characters or shorter. A scroll username is thirteen characters or longer. A knot username contains a digit.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_triquetrum (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   sighter text not null default '',
 *   span text not null default '',
 *   ink text not null default '',
 *   notch_no integer,
 *   peg_no integer not null default 2,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   sleeved boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_username_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_username_review (
 *   trader_id text primary key
 * );
 */

export const TQT_KEY = "crmv4-triquetrum";
export const TQT_VIEW_KEY = "crmv4-triquetrum-views";
export const TQT_DENSITY_KEY = "crmv4-triquetrum-density";
export const TRIQUETRUM_SPANS = ["base", "joint", "sight", "crown"] as const;

export type TriquetrumSpan = (typeof TRIQUETRUM_SPANS)[number];

export type TriquetrumInk = "blank" | "dry" | "wash" | "gilt";

export type TriquetrumTray = "rule" | "sleeve" | "coffer";

export type TriquetrumDensity = "wide" | "narrow";

export type TriquetrumSort = "span" | "sighter";

export type Triquetrum = {
  id: string;
  title: string;
  note: string;
  sighter: string;
  span: string;
  notch: number | null;
  ink: string;
  peg: number;
  tags: string[];
  sighted: boolean;
  sleeved: boolean;
  coffered: boolean;
  flagged: boolean;
  audit: string;
};

export type TriquetrumView = {
  id: string;
  name: string;
  tray: TriquetrumTray;
  query: string;
  sighter: string;
  ink: string;
  span: string;
  notch: string;
  peg: string;
};

export type TriquetrumCounts = {
  rule: number;
  sleeve: number;
  coffer: number;
  sighted: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  notch: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND296_FEATURES = [
  "save",
  "note",
  "trays",
  "ink",
  "notch",
  "coffer",
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
  "fair-sighter",
  "viewer",
  "suggest",
  "sla",
  "username",
  "username-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "sight", "unsight", "sleeve", "resume", "coffer", "open", "tag", "peg", "notch", "lower", "star"] as const;

const INKS = ["dry", "wash", "gilt"] as const;

const NOTCH_CYCLE = [6, 12, 24] as const;

const PEG_CYCLE = [2, 6, 9] as const;

const INNER = new Set(["base", "joint"]);

const OUTER = new Set(["sight", "crown"]);

const HOUSE_INK = new Set(["WASH", "GILT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TriquetrumTray {
  return raw === "sleeve" || raw === "coffer" ? raw : "rule";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glassName(raw: unknown): Exclude<TriquetrumInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<TriquetrumInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Triquetrum, tray: TriquetrumTray): boolean {
  if (tray === "sleeve") return card.sleeved && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.sleeved && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function separationIndex(span: string): number {
  return TRIQUETRUM_SPANS.indexOf(span as TriquetrumSpan);
}

function secondIndex(notch: number): number {
  return NOTCH_CYCLE.indexOf(notch as (typeof NOTCH_CYCLE)[number]);
}

function slideIndex(peg: number): number {
  return PEG_CYCLE.indexOf(peg as (typeof PEG_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function triquetrumSpan(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TRIQUETRUM_SPANS as readonly string[]).includes(text) ? text : "";
}

/** A notch is 8, 16, or 32. Anything else stays blank. */
export function triquetrumNotch(raw: unknown): 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 6 | 12 | 24;
}

/** A peg is 2, 4, or 8. Anything else stays blank. */
export function triquetrumPeg(raw: unknown): 2 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "9") return null;
  return Number(text) as 2 | 6 | 9;
}

/** Glass is clear, veil, or flare. The saved ink is the upper sleeve name. */
export function triquetrumInk(raw: unknown): string {
  const text = glassName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerSpan(span: unknown): boolean {
  return INNER.has(clip(span, 12).toLowerCase());
}

export function outerSpan(span: unknown): boolean {
  return OUTER.has(clip(span, 12).toLowerCase());
}

/** Near is the hearth. Mid is the sill. Far is the eave. Limb is the finial. */
export function triquetrumBand(span: unknown): string {
  const text = triquetrumSpan(span);
  if (!text) return "";
  if (text === "base") return "plinth";
  if (text === "joint") return "hinge";
  if (text === "sight") return "vane";
  return "apex";
}

/** Signed distance from one span to the desk span. */
export function spanGap(from: unknown, to: unknown): number | null {
  const left = separationIndex(triquetrumSpan(from));
  const right = separationIndex(triquetrumSpan(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(triquetrumInk(ink));
}

/** A pair peg is 4. Two and eight are not a pair. */
export function pairPeg(peg: unknown): boolean {
  return triquetrumPeg(peg) === 6;
}

/** A full peg is 8. */
export function fullPeg(peg: unknown): boolean {
  return triquetrumPeg(peg) === 9;
}

export function activeSpan(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return triquetrumSpan(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = triquetrumNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = triquetrumInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePeg(raw: unknown): string {
  const peg = triquetrumPeg(raw);
  return peg === null ? "all" : String(peg);
}

export function moveTriquetrumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestTriquetrumInk(cards: readonly Triquetrum[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "rule") || !card.ink) continue;
    counts.set(card.ink, (counts.get(card.ink) || 0) + 1);
  }
  let best = "DRY";
  let score = 0;
  for (const ink of ["DRY", "WASH", "GILT"]) {
    const count = counts.get(ink) || 0;
    if (count > score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest eight. Through the afternoon, sixteen. Evening asks for thirty-two. Saved seconds win when any exist. */
export function suggestNotch(cards: readonly Triquetrum[], hour: number): 6 | 12 | 24 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "rule") || card.notch === null) continue;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  let best: 6 | 12 | 24 | null = null;
  let score = 0;
  for (const notch of NOTCH_CYCLE) {
    const count = counts.get(notch) || 0;
    if (count > score) {
      best = notch;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 9) return 6;
  if (hour < 16) return 12;
  return 24;
}

/** Before eleven, suggest near. The rest of the day suggests limb. */
export function suggestSpan(hour: number): TriquetrumSpan {
  return hour < 11 ? "base" : "crown";
}

/** The sighter with the fewest unsighted halves on the bench. A tie keeps the roster order. */
export function fairRuleSighter(cards: readonly Triquetrum[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "rule") && !card.sighted);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readTriquetrums(raw: unknown): Triquetrum[] {
  if (!Array.isArray(raw)) return [];
  const out: Triquetrum[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Triquetrum>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      sighter: clip(row.sighter, 24),
      span: triquetrumSpan(row.span),
      notch: triquetrumNotch(row.notch),
      ink: triquetrumInk(row.ink),
      peg: triquetrumPeg(row.peg) ?? 2,
      tags: tagsOf(row.tags),
      sighted: row.sighted === true,
      sleeved: row.sleeved === true,
      coffered: row.coffered === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addTriquetrum(
  cards: readonly Triquetrum[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    sighter?: string;
    span?: string;
    notch?: unknown;
    ink?: string;
    peg?: unknown;
    tags?: unknown;
  },
): Triquetrum[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTriquetrums([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      sighter: clip(card.sighter, 24),
      span: triquetrumSpan(card.span),
      notch: triquetrumNotch(card.notch),
      ink: triquetrumInk(card.ink),
      peg: triquetrumPeg(card.peg) ?? 2,
      tags: tagsOf(card.tags),
      sighted: false,
      sleeved: false,
      coffered: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Triquetrum[], id: string, edit: (card: Triquetrum) => Triquetrum): Triquetrum[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTriquetrum(cards: readonly Triquetrum[], id: string, title: string): Triquetrum[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTriquetrumNote(cards: readonly Triquetrum[], id: string, note: string): Triquetrum[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "DRY", "WASH", "GILT"];
  const index = order.indexOf(triquetrumInk(ink));
  return order[(index + 1) % order.length] || "DRY";
}

export function setTriquetrumInk(cards: readonly Triquetrum[], id: string, ink: string): Triquetrum[] {
  const next = triquetrumInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setTriquetrumSighted(cards: readonly Triquetrum[], id: string, sighted: boolean): Triquetrum[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "sight" : "unsight" }));
}

export function setTriquetrumSleeve(cards: readonly Triquetrum[], id: string, sleeved: boolean): Triquetrum[] {
  return mapCard(cards, id, (card) => (card.sleeved === sleeved ? card : { ...card, sleeved, coffered: sleeved ? false : card.coffered, audit: sleeved ? "sleeve" : "resume" }));
}

export function setTriquetrumCoffer(cards: readonly Triquetrum[], id: string, coffered: boolean): Triquetrum[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, sleeved: coffered ? false : card.sleeved, audit: coffered ? "coffer" : "open" }));
}

export function setTriquetrumStar(cards: readonly Triquetrum[], id: string, flagged: boolean): Triquetrum[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addTriquetrumTag(cards: readonly Triquetrum[], id: string, tag: string): Triquetrum[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSecond(notch: number | null, dir: 1 | -1): 6 | 12 | 24 {
  if (notch === null) return dir > 0 ? 6 : 24;
  const index = secondIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepSlide(peg: number, dir: 1 | -1): 2 | 6 | 9 {
  const index = slideIndex(peg);
  const next = index < 0 ? 0 : (index + dir + PEG_CYCLE.length) % PEG_CYCLE.length;
  return PEG_CYCLE[next];
}

export function liftNotch(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepSecond(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepSecond(card.notch, -1), audit: "lower" }));
}

export function raisePeg(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return mapCard(cards, id, (card) => ({ ...card, peg: stepSlide(card.peg, 1), audit: "peg" }));
}

export function lowerPeg(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return mapCard(cards, id, (card) => ({ ...card, peg: stepSlide(card.peg, -1), audit: "peg" }));
}

function focused(cards: readonly Triquetrum[], id: string, edit: (card: Triquetrum) => Triquetrum): Triquetrum[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function sightTriquetrumFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return focused(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "unsight" : "sight" }));
}

export function sleeveTriquetrumFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return setTriquetrumSleeve(cards, id, !cards.find((card) => card.id === id)?.sleeved);
}

export function starTriquetrumFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return setTriquetrumStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagTriquetrumFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return addTriquetrumTag(cards, id, "a");
}

export function inkFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTriquetrumInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftNotchFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return lowerNotch(cards, id);
}

export function raisePegFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return raisePeg(cards, id);
}

export function lowerPegFocused(cards: readonly Triquetrum[], id: string): Triquetrum[] {
  return lowerPeg(cards, id);
}

function bulk(cards: readonly Triquetrum[], ids: readonly string[], edit: (card: Triquetrum) => Triquetrum): Triquetrum[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTriquetrumGilt(cards: readonly Triquetrum[], ids: readonly string[]): Triquetrum[] {
  return bulk(cards, ids, (card) => (card.ink === "GILT" ? card : { ...card, ink: "GILT", audit: "ink" }));
}

export function bulkTriquetrumSight(cards: readonly Triquetrum[], ids: readonly string[]): Triquetrum[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "sight" }));
}

export function bulkTriquetrumCoffer(cards: readonly Triquetrum[], ids: readonly string[]): Triquetrum[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, sleeved: false, audit: "coffer" }));
}

export function bulkTriquetrumTag(cards: readonly Triquetrum[], ids: readonly string[]): Triquetrum[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readTriquetrumViews(raw: unknown): TriquetrumView[] {
  if (!Array.isArray(raw)) return [];
  const out: TriquetrumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TriquetrumView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      sighter: clip(row.sighter, 24),
      ink: activeInk(row.ink, ["DRY", "WASH", "GILT"]),
      span: activeSpan(row.span),
      notch: activeNotch(row.notch),
      peg: activePeg(row.peg),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTriquetrumView(views: readonly TriquetrumView[], view: TriquetrumView): TriquetrumView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTriquetrumViews([...views, { ...view, id, name }]);
}

export function dropTriquetrumView(views: readonly TriquetrumView[], id: string): TriquetrumView[] {
  return views.filter((view) => view.id !== id);
}

export function triquetrumDensity(raw: unknown): TriquetrumDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortTriquetrums(cards: readonly Triquetrum[], sort: TriquetrumSort): Triquetrum[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "sighter") {
      const sighter = a.sighter.localeCompare(b.sighter);
      if (sighter) return sighter;
    } else {
      const span = separationIndex(a.span) - separationIndex(b.span);
      if (span) return span;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleTriquetrums(
  cards: readonly Triquetrum[],
  tray: TriquetrumTray,
  query: string,
  sighter: string,
  ink: string,
  span: string,
  notch: string,
  peg: string,
): Triquetrum[] {
  const text = query.trim().toLowerCase();
  const wantReader = clip(sighter, 24).toLowerCase();
  const wantGlass = ink === "all" ? "" : triquetrumInk(ink);
  const wantSeparation = activeSpan(span);
  const wantSecond = activeNotch(notch);
  const wantSlide = activePeg(peg);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.sighter}`.toLowerCase().includes(text)) return false;
    if (wantReader && card.sighter.toLowerCase() !== wantReader) return false;
    if (wantGlass && card.ink !== wantGlass) return false;
    if (wantSeparation === "inner" && !innerSpan(card.span)) return false;
    if (wantSeparation === "outer" && !outerSpan(card.span)) return false;
    if (wantSeparation !== "all" && wantSeparation !== "inner" && wantSeparation !== "outer" && card.span !== wantSeparation) return false;
    if (wantSecond !== "all" && String(card.notch ?? "") !== wantSecond) return false;
    if (wantSlide !== "all" && String(card.peg) !== wantSlide) return false;
    return true;
  });
}

/** An outer span on peg two, still unsighted and not in the coffer, is overdue. */
export function overdueTriquetrum(card: Triquetrum): boolean {
  return outerSpan(card.span) && card.peg === 2 && !card.sighted && !card.coffered;
}

/** No ink, the short notch, peg two, and still on the rule. */
export function idleTriquetrum(card: Triquetrum): boolean {
  return !card.ink && card.notch === 6 && card.peg === 2 && !card.sighted && !card.sleeved && !card.coffered;
}

/** Flare, a wide notch, and a full peg, still out of the coffer. */
export function briskTriquetrum(card: Triquetrum): boolean {
  return card.ink === "GILT" && card.notch === 24 && card.peg === 9 && !card.coffered;
}

/** Limb, clear ink, and a middle notch. */
export function restingTriquetrum(card: Triquetrum): boolean {
  return card.span === "crown" && card.ink === "DRY" && card.notch === 12;
}

/** A near rule is late when the desk is already at the limb. */
export function lateTriquetrum(card: Triquetrum, desk: string): boolean {
  return card.span === "base" && triquetrumSpan(desk) === "crown" && !card.sighted;
}

export function triquetrumCounts(cards: readonly Triquetrum[], shown: readonly Triquetrum[], desk: string): TriquetrumCounts {
  return {
    rule: cards.filter((card) => inTray(card, "rule")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => innerSpan(card.span)).length,
    outer: cards.filter((card) => outerSpan(card.span)).length,
    wide: cards.filter((card) => card.notch === 24).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleTriquetrum).length,
    brisk: cards.filter(briskTriquetrum).length,
    resting: cards.filter(restingTriquetrum).length,
    overdue: cards.filter(overdueTriquetrum).length,
    pair: cards.filter((card) => pairPeg(card.peg) && lateTriquetrum(card, desk)).length,
  };
}

export function triquetrumBars(cards: readonly Triquetrum[]): { span: string; count: number }[] {
  return TRIQUETRUM_SPANS.map((span) => ({ span, count: cards.filter((card) => card.span === span && !card.coffered).length }));
}

export function triquetrumTimeline(cards: readonly Triquetrum[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "rule"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function triquetrumSighters(cards: readonly Triquetrum[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.sighter && !out.some((name) => name.toLowerCase() === card.sighter.toLowerCase())) out.push(card.sighter);
  }
  return out;
}

export function busiestRuleSighter(cards: readonly Triquetrum[]): string {
  const open = cards.filter((card) => inTray(card, "rule") && !card.sighted && card.sighter);
  let best = "";
  let score = 0;
  for (const name of triquetrumSighters(open)) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTriquetrums(cards: readonly Triquetrum[]): string[] {
  return cards.filter(overdueTriquetrum).map((card) => card.title);
}

export function triquetrumCopy(card: Triquetrum): string {
  return [card.title, card.sighter, card.span, card.ink, card.notch ?? "", card.peg, card.note].filter((item) => item !== "").join(" · ");
}

export function triquetrumCsv(cards: readonly Triquetrum[], desk: string): string {
  const lines = ["title,sighter,span,ink,notch,peg,tags,sighted,sleeve,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.sighter),
        card.span,
        card.ink,
        card.notch ?? "",
        card.peg,
        card.tags.join(" "),
        card.sighted ? "1" : "0",
        card.sleeved ? "1" : "0",
        card.coffered ? "1" : "0",
        card.flagged ? "1" : "0",
        outerSpan(card.span) ? "1" : "0",
        lateTriquetrum(card, desk) ? "1" : "0",
        idleTriquetrum(card) ? "1" : "0",
        briskTriquetrum(card) ? "1" : "0",
        restingTriquetrum(card) ? "1" : "0",
        overdueTriquetrum(card) ? "1" : "0",
        innerSpan(card.span) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        triquetrumBand(card.span),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}



export const UNP_KEY = "crmv4-username-hide";
export const UNP_REVIEW_KEY = "crmv4-username-review";

export type UsernameLane = "" | "glyph" | "stem" | "knot" | "braid" | "scroll" | "plain";

export type UsernameHue = "" | "ivory" | "graphite" | "champagne";

export type UsernameState = "" | "clear" | "set";

export type UsernameReview = "all" | "reviewed" | "fresh";

export type UsernameShape =
  | "all"
  | "glyph"
  | "stem"
  | "knot"
  | "braid"
  | "scroll"
  | "plain"
  | "open"
  | "soon"
  | "digit"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "vowel"
  | "tail"
  | "mark"
  | "first"
  | "held";

export type UsernameValue = string | { username?: unknown; handle?: unknown; [key: string]: unknown } | null | undefined;

export type UsernameRow = { id: string; label: string; handle: UsernameValue };

export type UsernameLaneLine = { lane: string; count: number };

const NAME_LANES = ["glyph", "stem", "knot", "braid", "scroll", "plain"] as const;

const NAME_HUES = ["champagne", "ivory", "graphite"] as const;

function nameRecord(raw: UsernameValue): { username?: unknown; handle?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function nameBlocked(raw: UsernameValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function nameGiven(raw: UsernameValue): string {
  const row = nameRecord(raw);
  if (row && !("username" in row) && !("handle" in row)) return "";
  const value = row ? row.username ?? row.handle : raw;
  return clip(value, 40);
}

function nameOpen(raw: UsernameValue): boolean {
  if (nameBlocked(raw)) return false;
  const row = nameRecord(raw);
  if (row && !("username" in row) && !("handle" in row)) return false;
  return true;
}

export function usernameState(raw: UsernameValue): UsernameState {
  if (!nameOpen(raw)) return "";
  return nameGiven(raw) ? "set" : "clear";
}

/** Glyph is three characters or shorter. Scroll is thirteen or longer. A digit makes a knot, unless a separator makes a braid. */
export function usernameLane(raw: UsernameValue): UsernameLane {
  if (usernameState(raw) !== "set") return "";
  const text = nameGiven(raw);
  if (text.length <= 3) return "glyph";
  if (text.length >= 13) return "scroll";
  const digit = /[0-9]/.test(text);
  const sep = /[_.-]/.test(text);
  if (sep) return "braid";
  if (digit) return "knot";
  if (text.length <= 8) return "stem";
  return "plain";
}

export function usernameHue(raw: UsernameValue): UsernameHue {
  const lane = usernameLane(raw);
  if (!lane) return "";
  if (lane === "glyph" || lane === "knot") return "champagne";
  if (lane === "stem" || lane === "plain") return "ivory";
  return "graphite";
}

export function usernameGlyph(raw: UsernameValue): boolean {
  return usernameLane(raw) === "glyph";
}

export function usernameScroll(raw: UsernameValue): boolean {
  return usernameLane(raw) === "scroll";
}

export function usernameKnot(raw: UsernameValue): boolean {
  return usernameLane(raw) === "knot";
}

export function usernameOpen(raw: UsernameValue): boolean {
  return usernameState(raw) === "clear";
}

/** A letter name long enough to keep: stem or plain. */
export function usernameHeld(raw: UsernameValue): boolean {
  const lane = usernameLane(raw);
  return lane === "stem" || lane === "plain";
}

/** Two characters or fewer still needs a longer name. */
export function usernameSoon(raw: UsernameValue): boolean {
  if (usernameState(raw) !== "set") return false;
  const length = nameGiven(raw).length;
  return length > 0 && length <= 2;
}

export function usernameLength(raw: UsernameValue): number | null {
  if (usernameState(raw) !== "set") return null;
  return nameGiven(raw).length;
}

export function usernameEven(raw: UsernameValue): boolean {
  const length = usernameLength(raw);
  return length !== null && length % 2 === 0;
}

export function usernameOdd(raw: UsernameValue): boolean {
  const length = usernameLength(raw);
  return length !== null && length % 2 === 1;
}

export function usernameFirst(raw: UsernameValue): boolean {
  return /^[A-Za-z]/.test(nameGiven(raw));
}

export function usernameTail(raw: UsernameValue): boolean {
  return /[0-9]$/.test(nameGiven(raw));
}

export function usernameMark(raw: UsernameValue): boolean {
  return /[A-Z]/.test(nameGiven(raw));
}

export function usernameSpace(raw: UsernameValue): boolean {
  return nameGiven(raw).includes(" ");
}

export function usernameVowel(raw: UsernameValue): boolean {
  return /^[aeiou]/i.test(nameGiven(raw));
}

export function usernameDigit(raw: UsernameValue): boolean {
  return /[0-9]/.test(nameGiven(raw));
}

export function usernameLetter(raw: UsernameValue): boolean {
  return /[A-Za-z]/.test(nameGiven(raw));
}

export function usernameMixed(raw: UsernameValue): boolean {
  return usernameDigit(raw) && usernameLetter(raw);
}

export function usernameLower(raw: UsernameValue): boolean {
  const text = nameGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

export function usernameUpper(raw: UsernameValue): boolean {
  return usernameMark(raw);
}

export function usernameStamp(raw: UsernameValue): string {
  const text = nameGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function usernameCopy(raw: UsernameValue): string {
  return nameGiven(raw);
}

export function usernameLanes(rows: readonly UsernameRow[]): UsernameLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of NAME_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = usernameLane(row.handle);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return NAME_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingUsername(rows: readonly UsernameRow[]): string {
  const lines = usernameLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || NAME_LANES.indexOf(a.lane as (typeof NAME_LANES)[number]) - NAME_LANES.indexOf(b.lane as (typeof NAME_LANES)[number]))[0].lane;
}

export function leadingUsernameHue(rows: readonly UsernameRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of NAME_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = usernameHue(row.handle);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = NAME_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || NAME_HUES.indexOf(a.hue) - NAME_HUES.indexOf(b.hue))[0].hue;
}

export function laneUsernameCount(rows: readonly UsernameRow[], lane: UsernameLane): number {
  return rows.filter((row) => usernameLane(row.handle) === lane).length;
}

export function usernameShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentUsernameLanes(rows: readonly UsernameRow[]): string[] {
  return usernameLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenUsername(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedUsername(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleUsername(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleUsernameReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkUsernameReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleUsernameLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: UsernameRow, shape: UsernameShape): boolean {
  if (shape === "all") return true;
  if (shape === "glyph") return usernameGlyph(row.handle);
  if (shape === "scroll") return usernameScroll(row.handle);
  if (shape === "knot") return usernameKnot(row.handle);
  if (shape === "open") return usernameOpen(row.handle);
  if (shape === "soon") return usernameSoon(row.handle);
  if (shape === "digit") return usernameDigit(row.handle);
  if (shape === "letter") return usernameLetter(row.handle);
  if (shape === "mixed") return usernameMixed(row.handle);
  if (shape === "upper") return usernameUpper(row.handle);
  if (shape === "lower") return usernameLower(row.handle);
  if (shape === "space") return usernameSpace(row.handle);
  if (shape === "even") return usernameEven(row.handle);
  if (shape === "odd") return usernameOdd(row.handle);
  if (shape === "vowel") return usernameVowel(row.handle);
  if (shape === "tail") return usernameTail(row.handle);
  if (shape === "mark") return usernameMark(row.handle);
  if (shape === "first") return usernameFirst(row.handle);
  if (shape === "held") return usernameHeld(row.handle);
  return usernameLane(row.handle) === shape;
}

export function visibleUsername(
  rows: readonly UsernameRow[],
  lane: string,
  hue: string,
  query: string,
  review: UsernameReview,
  reviewed: readonly string[],
  shape: UsernameShape,
): UsernameRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (usernameState(row.handle) === "") return false;
    const found = usernameLane(row.handle);
    const hueName = usernameHue(row.handle);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${nameGiven(row.handle)} ${usernameStamp(row.handle)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function usernameLanesCsv(rows: readonly UsernameRow[]): string {
  const lines = ["lane,count"];
  for (const line of usernameLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function usernameRowsCsv(rows: readonly UsernameRow[], reviewed: readonly string[]): string {
  const lines = ["name,username,stamp,lane,hue,length,glyph,scroll,knot,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (usernameState(row.handle) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(nameGiven(row.handle)),
        usernameStamp(row.handle),
        usernameLane(row.handle),
        usernameHue(row.handle),
        String(usernameLength(row.handle) ?? ""),
        usernameGlyph(row.handle) ? "1" : "0",
        usernameScroll(row.handle) ? "1" : "0",
        usernameKnot(row.handle) ? "1" : "0",
        usernameEven(row.handle) ? "1" : "0",
        usernameDigit(row.handle) ? "1" : "0",
        usernameMixed(row.handle) ? "1" : "0",
        usernameUpper(row.handle) ? "1" : "0",
        usernameVowel(row.handle) ? "1" : "0",
        usernameTail(row.handle) ? "1" : "0",
        usernameHeld(row.handle) ? "1" : "0",
        usernameSoon(row.handle) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
