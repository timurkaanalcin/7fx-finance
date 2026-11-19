/**
 * Kamal rules for a pilot board kept in this browser, and meridian plates read the country already stored on the account.
 * Boards are palm, fist, cubit, and fathom. Cords are hemp, flax, and wire.
 * Knots are 4, 8, 16, or 32. Beads are 1, 5, or 7.
 * A realm country is TURKEY, GERMANY, RUSSIA, or ARABIA. A ridge contains a hyphen. A vale has a space.
 * A chip is two characters or fewer. An atlas is fourteen characters or longer. A cipher contains a number.
 * A true country mark reads as TURKEY. A false country mark reads as OPEN SHORE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_kamal (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   pilot text not null default '',
 *   board text not null default '',
 *   cord text not null default '',
 *   knot_no integer,
 *   bead_no integer not null default 1,
 *   tags text not null default '',
 *   marked boolean not null default false,
 *   coiled boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_meridian_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_meridian_review (
 *   trader_id text primary key
 * );
 */

export const KML_KEY = "crmv4-kamal";
export const KML_VIEW_KEY = "crmv4-kamal-views";
export const KML_DENSITY_KEY = "crmv4-kamal-density";
export const KML_QUARTERS = ["palm", "fist", "cubit", "fathom"] as const;

export type KamalQuarter = (typeof KML_QUARTERS)[number];

export type KamalFinish = "blank" | "hemp" | "flax" | "wire";

export type KamalTray = "face" | "sleeve" | "coffer";

export type KamalDensity = "broad" | "tight";

export type KamalSort = "quarter" | "sighter";

export type Kamal = {
  id: string;
  title: string;
  note: string;
  sighter: string;
  quarter: string;
  span: number | null;
  finish: string;
  pin: number;
  tags: string[];
  laid: boolean;
  locked: boolean;
  held: boolean;
  starred: boolean;
  audit: string;
};

export type KamalView = {
  id: string;
  name: string;
  tray: KamalTray;
  query: string;
  sighter: string;
  finish: string;
  quarter: string;
  span: string;
  pin: string;
};

export type KamalCounts = {
  court: number;
  sleeve: number;
  vault: number;
  laid: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  span: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND308_FEATURES = [
  "save",
  "note",
  "boards",
  "cord",
  "knot",
  "chest",
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
  "fair-board",
  "viewer",
  "suggest",
  "sla",
  "meridian",
  "meridian-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "pin", "span", "lower", "star"] as const;

const FINISHES = ["hemp", "flax", "wire"] as const;

const SPAN_CYCLE = [4, 8, 16, 32] as const;

const PIN_CYCLE = [1, 5, 7] as const;

const INNER = new Set(["palm", "fist"]);

const OUTER = new Set(["cubit", "fathom"]);

const HOUSE_WEAVE = new Set(["HEMP", "WIRE"]);

const HOUSE_STATUSES = new Set(["TURKEY", "GERMANY", "RUSSIA", "ARABIA"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): KamalTray {
  return raw === "sleeve" || raw === "coffer" ? raw : "face";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<KamalFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<KamalFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[km]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Kamal, tray: KamalTray): boolean {
  if (tray === "sleeve") return card.locked && !card.held;
  if (tray === "coffer") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function quarterIndex(quarter: string): number {
  return KML_QUARTERS.indexOf(quarter as KamalQuarter);
}

function spanIndex(span: number): number {
  return SPAN_CYCLE.indexOf(span as (typeof SPAN_CYCLE)[number]);
}

function pinIndex(pin: number): number {
  return PIN_CYCLE.indexOf(pin as (typeof PIN_CYCLE)[number]);
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

export function kamalQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (KML_QUARTERS as readonly string[]).includes(text) ? text : "";
}

/** A knot is 4, 8, 16, or 32. Anything else stays blank. */
export function kamalSpan(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A bead is 1, 5, or 7. Anything else stays blank. */
export function kamalPin(raw: unknown): 1 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "5" && text !== "7") return null;
  return Number(text) as 1 | 5 | 7;
}

/** A cord is hemp, flax, or wire. The saved name is the upper token. */
export function kamalCloth(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function kamalInner(quarter: unknown): boolean {
  return INNER.has(clip(quarter, 12).toLowerCase());
}

export function kamalOuter(quarter: unknown): boolean {
  return OUTER.has(clip(quarter, 12).toLowerCase());
}

/** Palm is the hand. Fist is the knuckle. Cubit is the forearm. Fathom is the arm. */
export function kamalBand(quarter: unknown): string {
  const text = kamalQuarter(quarter);
  if (!text) return "";
  if (text === "palm") return "hand";
  if (text === "fist") return "knuckle";
  if (text === "cubit") return "forearm";
  return "arm";
}

/** Signed distance from one watch to another along the kamal. */
export function kamalGap(from: unknown, to: unknown): number | null {
  const left = quarterIndex(kamalQuarter(from));
  const right = quarterIndex(kamalQuarter(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_WEAVE.has(kamalCloth(finish));
}

/** A pair pin is 4. Two and eight are not a pair. */
export function pairPin(pin: unknown): boolean {
  return kamalPin(pin) === 5;
}

/** A full pin is 8. */
export function fullPin(pin: unknown): boolean {
  return kamalPin(pin) === 7;
}

export function activeQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return kamalQuarter(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = kamalSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = kamalCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePin(raw: unknown): string {
  const pin = kamalPin(raw);
  return pin === null ? "all" : String(pin);
}

export function moveKamalFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The cord the board uses least. A tie keeps wire, then hemp, then flax. */
export function suggestFinish(cards: readonly Kamal[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "face") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "WIRE";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["WIRE", "HEMP", "FLAX"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest four. Morning asks for eight. Afternoon asks for sixteen. Evening asks for thirty-two. A saved knot on the board wins, and a tie keeps the taller knot. */
export function suggestSpan(cards: readonly Kamal[], hour: number): 4 | 8 | 16 | 32 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "face") || card.span === null) continue;
    seen = true;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 32 = 32;
    let score = Number.POSITIVE_INFINITY;
    for (const span of [...SPAN_CYCLE].reverse()) {
      const count = counts.get(span) || 0;
      if (count < score) {
        best = span;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 4;
  if (hour < 9) return 8;
  if (hour < 14) return 16;
  return 32;
}

/** Before eight, suggest the palm. The rest of the day suggests the fathom. */
export function suggestQuarter(hour: number): KamalQuarter {
  return hour < 8 ? "palm" : "fathom";
}

/** The sighter with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairSighter(cards: readonly Kamal[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "face") && !card.laid);
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

export function readKamalRules(raw: unknown): Kamal[] {
  if (!Array.isArray(raw)) return [];
  const out: Kamal[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Kamal>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      sighter: clip(row.sighter, 24),
      quarter: kamalQuarter(row.quarter),
      span: kamalSpan(row.span),
      finish: kamalCloth(row.finish),
      pin: kamalPin(row.pin) ?? 1,
      tags: tagsOf(row.tags),
      laid: row.laid === true,
      locked: row.locked === true,
      held: row.held === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addKamal(
  cards: readonly Kamal[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    sighter?: string;
    quarter?: string;
    span?: unknown;
    finish?: string;
    pin?: unknown;
    tags?: unknown;
  },
): Kamal[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readKamalRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      sighter: clip(card.sighter, 24),
      quarter: kamalQuarter(card.quarter),
      span: kamalSpan(card.span),
      finish: kamalCloth(card.finish),
      pin: kamalPin(card.pin) ?? 1,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Kamal[], id: string, edit: (card: Kamal) => Kamal): Kamal[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editKamal(cards: readonly Kamal[], id: string, title: string): Kamal[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editKamalNote(cards: readonly Kamal[], id: string, note: string): Kamal[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "HEMP", "FLAX", "WIRE"];
  const index = order.indexOf(kamalCloth(finish));
  return order[(index + 1) % order.length] || "HEMP";
}

export function setKamalCloth(cards: readonly Kamal[], id: string, finish: string): Kamal[] {
  const next = kamalCloth(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setKamalSighted(cards: readonly Kamal[], id: string, laid: boolean): Kamal[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setKamalSleeve(cards: readonly Kamal[], id: string, locked: boolean): Kamal[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sheath" : "resume" }));
}

export function setKamalVault(cards: readonly Kamal[], id: string, held: boolean): Kamal[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "crypt" : "open" }));
}

export function setKamalStar(cards: readonly Kamal[], id: string, starred: boolean): Kamal[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addKamalTag(cards: readonly Kamal[], id: string, tag: string): Kamal[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 4 | 8 | 16 | 32 {
  if (span === null) return dir > 0 ? 4 : 32;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepPin(pin: number, dir: 1 | -1): 1 | 5 | 7 {
  const index = pinIndex(pin);
  const next = index < 0 ? 0 : (index + dir + PIN_CYCLE.length) % PIN_CYCLE.length;
  return PIN_CYCLE[next];
}

export function liftSpan(cards: readonly Kamal[], id: string): Kamal[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Kamal[], id: string): Kamal[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raisePin(cards: readonly Kamal[], id: string): Kamal[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, 1), audit: "pin" }));
}

export function lowerPin(cards: readonly Kamal[], id: string): Kamal[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, -1), audit: "pin" }));
}

export function setKamalFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveKamalFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return setKamalSleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starKamalFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return setKamalStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagKamalFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return addKamalTag(cards, id, "k");
}

export function finishFocused(cards: readonly Kamal[], id: string): Kamal[] {
  const card = cards.find((item) => item.id === id);
  return card ? setKamalCloth(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftSpanFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return lowerSpan(cards, id);
}

export function raisePinFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return raisePin(cards, id);
}

export function lowerPinFocused(cards: readonly Kamal[], id: string): Kamal[] {
  return lowerPin(cards, id);
}

function bulk(cards: readonly Kamal[], ids: readonly string[], edit: (card: Kamal) => Kamal): Kamal[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkKamalWire(cards: readonly Kamal[], ids: readonly string[]): Kamal[] {
  return bulk(cards, ids, (card) => (card.finish === "WIRE" ? card : { ...card, finish: "WIRE", audit: "finish" }));
}

export function bulkKamalSighted(cards: readonly Kamal[], ids: readonly string[]): Kamal[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkKamalVault(cards: readonly Kamal[], ids: readonly string[]): Kamal[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "crypt" }));
}

export function bulkKamalTag(cards: readonly Kamal[], ids: readonly string[]): Kamal[] {
  return bulk(cards, ids, (card) => (card.tags.includes("m") ? card : { ...card, tags: tagsOf([...card.tags, "m"]), audit: "tag" }));
}

export function readKamalViews(raw: unknown): KamalView[] {
  if (!Array.isArray(raw)) return [];
  const out: KamalView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KamalView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      sighter: clip(row.sighter, 24),
      finish: activeFinish(row.finish, ["HEMP", "FLAX", "WIRE"]),
      quarter: activeQuarter(row.quarter),
      span: activeSpan(row.span),
      pin: activePin(row.pin),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addKamalView(views: readonly KamalView[], view: KamalView): KamalView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readKamalViews([...views, { ...view, id, name }]);
}

export function dropKamalView(views: readonly KamalView[], id: string): KamalView[] {
  return views.filter((view) => view.id !== id);
}

export function kamalDensity(raw: unknown): KamalDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortKamalRules(cards: readonly Kamal[], sort: KamalSort): Kamal[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "sighter") {
      const sighter = a.sighter.localeCompare(b.sighter);
      if (sighter) return sighter;
    } else {
      const quarter = quarterIndex(a.quarter) - quarterIndex(b.quarter);
      if (quarter) return quarter;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleKamalRules(
  cards: readonly Kamal[],
  tray: KamalTray,
  query: string,
  sighter: string,
  finish: string,
  quarter: string,
  span: string,
  pin: string,
): Kamal[] {
  const text = query.trim().toLowerCase();
  const wantSighter = clip(sighter, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : kamalCloth(finish);
  const wantQuarter = activeQuarter(quarter);
  const wantSpan = activeSpan(span);
  const wantPin = activePin(pin);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.sighter}`.toLowerCase().includes(text)) return false;
    if (wantSighter && card.sighter.toLowerCase() !== wantSighter) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantQuarter === "inner" && !kamalInner(card.quarter)) return false;
    if (wantQuarter === "outer" && !kamalOuter(card.quarter)) return false;
    if (wantQuarter !== "all" && wantQuarter !== "inner" && wantQuarter !== "outer" && card.quarter !== wantQuarter) return false;
    if (wantSpan !== "all" && String(card.span ?? "") !== wantSpan) return false;
    if (wantPin !== "all" && String(card.pin) !== wantPin) return false;
    return true;
  });
}

/** An outer board on bead one, still unmarked and not in the chest, is overdue. */
export function overdueKamal(card: Kamal): boolean {
  return kamalOuter(card.quarter) && card.pin === 1 && !card.laid && !card.held;
}

/** No cord, the short knot, bead one, and still on the board. */
export function idleKamal(card: Kamal): boolean {
  return !card.finish && card.span === 4 && card.pin === 1 && !card.laid && !card.locked && !card.held;
}

/** Wire, a tall knot, and a full bead, still out of the chest. */
export function briskKamal(card: Kamal): boolean {
  return card.finish === "WIRE" && card.span === 32 && card.pin === 7 && !card.held;
}

/** Fathom, flax, and the middle knot. */
export function restingKamal(card: Kamal): boolean {
  return card.quarter === "fathom" && card.finish === "FLAX" && card.span === 8;
}

/** A palm board is late when the desk is already on the fathom. */
export function lateKamal(card: Kamal, desk: string): boolean {
  return card.quarter === "palm" && kamalQuarter(desk) === "fathom" && !card.laid;
}

export function kamalCounts(cards: readonly Kamal[], shown: readonly Kamal[], desk: string): KamalCounts {
  return {
    court: cards.filter((card) => inTray(card, "face")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    vault: cards.filter((card) => inTray(card, "coffer")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => kamalInner(card.quarter)).length,
    outer: cards.filter((card) => kamalOuter(card.quarter)).length,
    wide: cards.filter((card) => card.span === 32).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleKamal).length,
    brisk: cards.filter(briskKamal).length,
    resting: cards.filter(restingKamal).length,
    overdue: cards.filter(overdueKamal).length,
    pair: cards.filter((card) => pairPin(card.pin) && lateKamal(card, desk)).length,
  };
}

export function kamalBars(cards: readonly Kamal[]): { quarter: string; count: number }[] {
  return KML_QUARTERS.map((quarter) => ({ quarter, count: cards.filter((card) => card.quarter === quarter && !card.held).length }));
}

export function kamalTimeline(cards: readonly Kamal[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "face"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function kamalSighters(cards: readonly Kamal[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.sighter && !out.some((name) => name.toLowerCase() === card.sighter.toLowerCase())) out.push(card.sighter);
  }
  return out;
}

export function busiestSighter(cards: readonly Kamal[]): string {
  const open = cards.filter((card) => inTray(card, "face") && !card.laid && card.sighter);
  let best = "";
  let score = 0;
  for (const name of kamalSighters(open)) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderKamalRules(cards: readonly Kamal[]): string[] {
  return cards.filter(overdueKamal).map((card) => card.title);
}

export function kamalCopy(card: Kamal): string {
  return [card.title, card.sighter, card.quarter, card.finish, card.span ?? "", card.pin, card.note].filter((item) => item !== "").join(" · ");
}

export function kamalCsv(cards: readonly Kamal[], desk: string): string {
  const lines = ["title,pilot,board,cord,knot,bead,tags,marked,coil,chest,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.sighter),
        card.quarter,
        card.finish,
        card.span ?? "",
        card.pin,
        card.tags.join(" "),
        card.laid ? "1" : "0",
        card.locked ? "1" : "0",
        card.held ? "1" : "0",
        card.starred ? "1" : "0",
        kamalOuter(card.quarter) ? "1" : "0",
        lateKamal(card, desk) ? "1" : "0",
        idleKamal(card) ? "1" : "0",
        briskKamal(card) ? "1" : "0",
        restingKamal(card) ? "1" : "0",
        overdueKamal(card) ? "1" : "0",
        kamalInner(card.quarter) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        kamalBand(card.quarter),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const MDN_KEY = "crmv4-meridian-hide";
export const MDN_REVIEW_KEY = "crmv4-meridian-review";

export type MeridianLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type MeridianHue = "" | "ivory" | "graphite" | "champagne";

export type MeridianState = "" | "clear" | "set";

export type MeridianReview = "all" | "reviewed" | "fresh";

export type MeridianShape =
  | "all"
  | "house"
  | "fort"
  | "harbor"
  | "digit"
  | "spark"
  | "scroll"
  | "vowel"
  | "post"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "tail"
  | "first"
  | "held"
  | "hyphen"
  | "period";

export type MeridianValue = string | { country?: unknown; [key: string]: unknown } | null | undefined;

export type MeridianRow = { id: string; label: string; meridian: MeridianValue };

export type MeridianLaneLine = { lane: string; count: number };

const UMBRA_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const UMBRA_HUES = ["champagne", "ivory", "graphite"] as const;

function meridianRecord(raw: MeridianValue): { country?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function meridianBlocked(raw: MeridianValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function meridianGiven(raw: MeridianValue): string {
  const row = meridianRecord(raw);
  if (row && !("country" in row)) return "";
  const value = row ? row.country : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "TURKEY";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN SHORE";
  return clip(value, 48);
}

function meridianReadable(raw: MeridianValue): boolean {
  if (meridianBlocked(raw)) return false;
  const row = meridianRecord(raw);
  if (row && !("country" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function meridianState(raw: MeridianValue): MeridianState {
  if (!meridianReadable(raw)) return "";
  return meridianGiven(raw) ? "set" : "clear";
}

/** A realm country is TURKEY, GERMANY, RUSSIA, or ARABIA. A ridge contains a hyphen. A vale has a space. A cipher contains a number. A chip is two characters or fewer. An atlas is fourteen characters or longer. */
export function meridianLane(raw: MeridianValue): MeridianLane {
  if (meridianState(raw) !== "set") return "";
  const text = meridianGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 2) return "spark";
  if (text.length >= 14) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function meridianHue(raw: MeridianValue): MeridianHue {
  const lane = meridianLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function meridianHouse(raw: MeridianValue): boolean {
  return meridianLane(raw) === "house";
}

export function meridianFort(raw: MeridianValue): boolean {
  return meridianLane(raw) === "fort";
}

export function meridianHarbor(raw: MeridianValue): boolean {
  return meridianLane(raw) === "harbor";
}

export function meridianDigitLane(raw: MeridianValue): boolean {
  return meridianLane(raw) === "digit";
}

export function meridianSpark(raw: MeridianValue): boolean {
  return meridianLane(raw) === "spark";
}

export function meridianScroll(raw: MeridianValue): boolean {
  return meridianLane(raw) === "scroll";
}

export function meridianVowelLane(raw: MeridianValue): boolean {
  return meridianLane(raw) === "vowel";
}

export function meridianPost(raw: MeridianValue): boolean {
  return meridianLane(raw) === "post";
}

export function meridianOpen(raw: MeridianValue): boolean {
  return meridianState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function meridianHeld(raw: MeridianValue): boolean {
  const lane = meridianLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function meridianSoon(raw: MeridianValue): boolean {
  if (meridianState(raw) !== "set") return false;
  if (meridianSpark(raw)) return true;
  if (meridianHouse(raw)) return false;
  const length = meridianGiven(raw).length;
  return length > 0 && length <= 1;
}

export function meridianLength(raw: MeridianValue): number | null {
  if (meridianState(raw) !== "set") return null;
  return meridianGiven(raw).length;
}

export function meridianEven(raw: MeridianValue): boolean {
  const length = meridianLength(raw);
  return length !== null && length % 2 === 0;
}

export function meridianOdd(raw: MeridianValue): boolean {
  const length = meridianLength(raw);
  return length !== null && length % 2 === 1;
}

export function meridianFirst(raw: MeridianValue): boolean {
  return /^[A-Za-z]/.test(meridianGiven(raw));
}

export function meridianTail(raw: MeridianValue): boolean {
  return /[0-9]$/.test(meridianGiven(raw));
}

export function meridianCapital(raw: MeridianValue): boolean {
  return /[A-Z]/.test(meridianGiven(raw));
}

export function meridianSpace(raw: MeridianValue): boolean {
  return meridianGiven(raw).includes(" ");
}

export function meridianVowel(raw: MeridianValue): boolean {
  return /^[aeiou]/i.test(meridianGiven(raw));
}

export function meridianDigit(raw: MeridianValue): boolean {
  return /[0-9]/.test(meridianGiven(raw));
}

export function meridianLetter(raw: MeridianValue): boolean {
  return /[A-Za-z]/.test(meridianGiven(raw));
}

export function meridianMixed(raw: MeridianValue): boolean {
  return meridianDigit(raw) && meridianLetter(raw);
}

export function meridianLower(raw: MeridianValue): boolean {
  const text = meridianGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function meridianUpper(raw: MeridianValue): boolean {
  const text = meridianGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function meridianHyphen(raw: MeridianValue): boolean {
  return meridianGiven(raw).includes("-");
}

export function meridianPeriod(raw: MeridianValue): boolean {
  return meridianGiven(raw).includes(".");
}

export function meridianStamp(raw: MeridianValue): string {
  const text = meridianGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function meridianCopy(raw: MeridianValue): string {
  return meridianGiven(raw);
}

export function meridianFamily(raw: MeridianValue): string {
  if (meridianState(raw) !== "set") return "";
  return firstToken(meridianGiven(raw));
}

export function meridianLanes(rows: readonly MeridianRow[]): MeridianLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of UMBRA_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = meridianLane(row.meridian);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return UMBRA_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingMeridian(rows: readonly MeridianRow[]): string {
  const lines = meridianLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || UMBRA_LANES.indexOf(a.lane as (typeof UMBRA_LANES)[number]) - UMBRA_LANES.indexOf(b.lane as (typeof UMBRA_LANES)[number]))[0].lane;
}

export function leadingMeridianHue(rows: readonly MeridianRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of UMBRA_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = meridianHue(row.meridian);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = UMBRA_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || UMBRA_HUES.indexOf(a.hue) - UMBRA_HUES.indexOf(b.hue))[0].hue;
}

export function laneMeridianCount(rows: readonly MeridianRow[], lane: MeridianLane): number {
  return rows.filter((row) => meridianLane(row.meridian) === lane).length;
}

export function meridianShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentMeridianLanes(rows: readonly MeridianRow[]): string[] {
  return meridianLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenMeridians(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedMeridians(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleMeridian(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleMeridianReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMeridianReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMeridianLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: MeridianRow, shape: MeridianShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return meridianHouse(row.meridian);
  if (shape === "fort") return meridianFort(row.meridian);
  if (shape === "harbor") return meridianHarbor(row.meridian);
  if (shape === "digit") return meridianDigitLane(row.meridian);
  if (shape === "spark") return meridianSpark(row.meridian);
  if (shape === "scroll") return meridianScroll(row.meridian);
  if (shape === "vowel") return meridianVowelLane(row.meridian);
  if (shape === "post") return meridianPost(row.meridian);
  if (shape === "open") return meridianOpen(row.meridian);
  if (shape === "soon") return meridianSoon(row.meridian);
  if (shape === "letter") return meridianLetter(row.meridian);
  if (shape === "mixed") return meridianMixed(row.meridian);
  if (shape === "upper") return meridianUpper(row.meridian);
  if (shape === "lower") return meridianLower(row.meridian);
  if (shape === "space") return meridianSpace(row.meridian);
  if (shape === "even") return meridianEven(row.meridian);
  if (shape === "odd") return meridianOdd(row.meridian);
  if (shape === "tail") return meridianTail(row.meridian);
  if (shape === "first") return meridianFirst(row.meridian);
  if (shape === "held") return meridianHeld(row.meridian);
  if (shape === "hyphen") return meridianHyphen(row.meridian);
  if (shape === "period") return meridianPeriod(row.meridian);
  return meridianLane(row.meridian) === shape;
}

export function visibleMeridians(
  rows: readonly MeridianRow[],
  lane: string,
  hue: string,
  query: string,
  review: MeridianReview,
  reviewed: readonly string[],
  shape: MeridianShape,
): MeridianRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (meridianState(row.meridian) === "") return false;
    const found = meridianLane(row.meridian);
    const hueName = meridianHue(row.meridian);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${meridianGiven(row.meridian)} ${meridianStamp(row.meridian)} ${meridianFamily(row.meridian)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function meridianLanesCsv(rows: readonly MeridianRow[]): string {
  const lines = ["lane,count"];
  for (const line of meridianLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function meridianRowsCsv(rows: readonly MeridianRow[], reviewed: readonly string[]): string {
  const lines = ["name,country,stamp,family,lane,hue,length,realm,ridge,vale,chip,even,cipher,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(meridianGiven(row.meridian)),
        meridianStamp(row.meridian),
        csvCell(meridianFamily(row.meridian)),
        meridianLane(row.meridian),
        meridianHue(row.meridian),
        meridianLength(row.meridian) ?? "",
        meridianHouse(row.meridian) ? "1" : "0",
        meridianFort(row.meridian) ? "1" : "0",
        meridianHarbor(row.meridian) ? "1" : "0",
        meridianSpark(row.meridian) ? "1" : "0",
        meridianEven(row.meridian) ? "1" : "0",
        meridianDigit(row.meridian) ? "1" : "0",
        meridianMixed(row.meridian) ? "1" : "0",
        meridianUpper(row.meridian) ? "1" : "0",
        meridianVowel(row.meridian) ? "1" : "0",
        meridianTail(row.meridian) ? "1" : "0",
        meridianHeld(row.meridian) ? "1" : "0",
        meridianSoon(row.meridian) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
