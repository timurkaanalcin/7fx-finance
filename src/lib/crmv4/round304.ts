/**
 * Rectangulus rules for a surveyor's rectangle kept in this browser, and assay plates read the validation status already stored on the account.
 * Quarters are dawn, noon, dusk, and night. Finish is brass, ebony, and bone.
 * Spans are 10, 20, 40, or 80. Pins are 2, 5, or 8.
 * A house status is Verified, Pending, Unverified, or Rejected. A fort contains a hyphen. A harbor has a space.
 * A spark is four characters or fewer. A scroll is twelve characters or longer. A digit contains a number.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_rectangulus (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   sighter text not null default '',
 *   quarter text not null default '',
 *   finish text not null default '',
 *   span_no integer,
 *   pin_no integer not null default 2,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   cased boolean not null default false,
 *   lofted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_assay_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_assay_review (
 *   trader_id text primary key
 * );
 */

export const RXG_KEY = "crmv4-rectangulus";
export const RXG_VIEW_KEY = "crmv4-rectangulus-views";
export const RXG_DENSITY_KEY = "crmv4-rectangulus-density";
export const RXG_QUARTERS = ["dawn", "noon", "dusk", "night"] as const;

export type RectangulusQuarter = (typeof RXG_QUARTERS)[number];

export type RectangulusFinish = "blank" | "brass" | "ebony" | "bone";

export type RectangulusTray = "court" | "sleeve" | "vault";

export type RectangulusDensity = "broad" | "tight";

export type RectangulusSort = "quarter" | "sighter";

export type Rectangulus = {
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

export type RectangulusView = {
  id: string;
  name: string;
  tray: RectangulusTray;
  query: string;
  sighter: string;
  finish: string;
  quarter: string;
  span: string;
  pin: string;
};

export type RectangulusCounts = {
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

export const ROUND304_FEATURES = [
  "save",
  "note",
  "trays",
  "finish",
  "span",
  "vault",
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
  "assay",
  "assay-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "set", "clear", "sleeve", "resume", "vault", "open", "tag", "pin", "span", "lower", "star"] as const;

const FINISHES = ["brass", "ebony", "bone"] as const;

const SPAN_CYCLE = [10, 20, 40, 80] as const;

const PIN_CYCLE = [2, 5, 8] as const;

const INNER = new Set(["dawn", "noon"]);

const OUTER = new Set(["dusk", "night"]);

const HOUSE_WEAVE = new Set(["BRASS", "BONE"]);

const HOUSE_STATUSES = new Set(["VERIFIED", "PENDING", "UNVERIFIED", "REJECTED"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RectangulusTray {
  return raw === "sleeve" || raw === "vault" ? raw : "court";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<RectangulusFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<RectangulusFinish, "blank">) : "";
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

function inTray(card: Rectangulus, tray: RectangulusTray): boolean {
  if (tray === "sleeve") return card.locked && !card.held;
  if (tray === "vault") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function quarterIndex(quarter: string): number {
  return RXG_QUARTERS.indexOf(quarter as RectangulusQuarter);
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

export function rectangulusQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RXG_QUARTERS as readonly string[]).includes(text) ? text : "";
}

/** A span is 15, 30, 45, or 60. Anything else stays blank. */
export function rectangulusSpan(raw: unknown): 10 | 20 | 40 | 80 | null {
  const text = wholeToken(raw);
  if (text !== "10" && text !== "20" && text !== "40" && text !== "80") return null;
  return Number(text) as 10 | 20 | 40 | 80;
}

/** A pin is 3, 6, or 9. Anything else stays blank. */
export function rectangulusPin(raw: unknown): 2 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8") return null;
  return Number(text) as 2 | 5 | 8;
}

/** Finish is brass, ebony, or bone. The saved name is the upper token. */
export function rectangulusCloth(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function rectangulusInner(quarter: unknown): boolean {
  return INNER.has(clip(quarter, 12).toLowerCase());
}

export function rectangulusOuter(quarter: unknown): boolean {
  return OUTER.has(clip(quarter, 12).toLowerCase());
}

/** Dawn is the belt. Noon is the band. Dusk is the cap. Night is the dune. */
export function rectangulusBand(quarter: unknown): string {
  const text = rectangulusQuarter(quarter);
  if (!text) return "";
  if (text === "dawn") return "glow";
  if (text === "noon") return "crown";
  if (text === "dusk") return "shade";
  return "deep";
}

/** Signed distance from one quarter to another along the rectangulus. */
export function rectangulusGap(from: unknown, to: unknown): number | null {
  const left = quarterIndex(rectangulusQuarter(from));
  const right = quarterIndex(rectangulusQuarter(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_WEAVE.has(rectangulusCloth(finish));
}

/** A pair pin is 6. Three and nine are not a pair. */
export function pairPin(pin: unknown): boolean {
  return rectangulusPin(pin) === 5;
}

/** A full pin is 9. */
export function fullPin(pin: unknown): boolean {
  return rectangulusPin(pin) === 8;
}

export function activeQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return rectangulusQuarter(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = rectangulusSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = rectangulusCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePin(raw: unknown): string {
  const pin = rectangulusPin(raw);
  return pin === null ? "all" : String(pin);
}

export function moveRectangulusFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the court uses least. A tie keeps bone, then brass, then ebony. */
export function suggestFinish(cards: readonly Rectangulus[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "court") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "BONE";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["BONE", "BRASS", "EBONY"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest fifteen. Late morning asks for thirty. Afternoon asks for forty-five. Evening asks for sixty. A saved span in the court wins, and a tie keeps the taller span. */
export function suggestSpan(cards: readonly Rectangulus[], hour: number): 10 | 20 | 40 | 80 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "court") || card.span === null) continue;
    seen = true;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  if (seen) {
    let best: 10 | 20 | 40 | 80 = 80;
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
  if (hour < 7) return 10;
  if (hour < 12) return 20;
  if (hour < 16) return 40;
  return 80;
}

/** Before ten, suggest the dawn. The rest of the day suggests the night. */
export function suggestQuarter(hour: number): RectangulusQuarter {
  return hour < 9 ? "dawn" : "night";
}

/** The sighter with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairSighter(cards: readonly Rectangulus[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "court") && !card.laid);
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

export function readRectangulusRules(raw: unknown): Rectangulus[] {
  if (!Array.isArray(raw)) return [];
  const out: Rectangulus[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Rectangulus>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      sighter: clip(row.sighter, 24),
      quarter: rectangulusQuarter(row.quarter),
      span: rectangulusSpan(row.span),
      finish: rectangulusCloth(row.finish),
      pin: rectangulusPin(row.pin) ?? 2,
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

export function addRectangulus(
  cards: readonly Rectangulus[],
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
): Rectangulus[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRectangulusRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      sighter: clip(card.sighter, 24),
      quarter: rectangulusQuarter(card.quarter),
      span: rectangulusSpan(card.span),
      finish: rectangulusCloth(card.finish),
      pin: rectangulusPin(card.pin) ?? 2,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Rectangulus[], id: string, edit: (card: Rectangulus) => Rectangulus): Rectangulus[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRectangulus(cards: readonly Rectangulus[], id: string, title: string): Rectangulus[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRectangulusNote(cards: readonly Rectangulus[], id: string, note: string): Rectangulus[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "BRASS", "EBONY", "BONE"];
  const index = order.indexOf(rectangulusCloth(finish));
  return order[(index + 1) % order.length] || "BRASS";
}

export function setRectangulusCloth(cards: readonly Rectangulus[], id: string, finish: string): Rectangulus[] {
  const next = rectangulusCloth(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setRectangulusSighted(cards: readonly Rectangulus[], id: string, laid: boolean): Rectangulus[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setRectangulusSleeve(cards: readonly Rectangulus[], id: string, locked: boolean): Rectangulus[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sleeve" : "resume" }));
}

export function setRectangulusVault(cards: readonly Rectangulus[], id: string, held: boolean): Rectangulus[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "vault" : "open" }));
}

export function setRectangulusStar(cards: readonly Rectangulus[], id: string, starred: boolean): Rectangulus[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRectangulusTag(cards: readonly Rectangulus[], id: string, tag: string): Rectangulus[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 10 | 20 | 40 | 80 {
  if (span === null) return dir > 0 ? 10 : 80;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepPin(pin: number, dir: 1 | -1): 2 | 5 | 8 {
  const index = pinIndex(pin);
  const next = index < 0 ? 0 : (index + dir + PIN_CYCLE.length) % PIN_CYCLE.length;
  return PIN_CYCLE[next];
}

export function liftSpan(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raisePin(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, 1), audit: "pin" }));
}

export function lowerPin(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, -1), audit: "pin" }));
}

export function setRectangulusFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveRectangulusFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return setRectangulusSleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starRectangulusFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return setRectangulusStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagRectangulusFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return addRectangulusTag(cards, id, "a");
}

export function finishFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRectangulusCloth(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftSpanFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return lowerSpan(cards, id);
}

export function raisePinFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return raisePin(cards, id);
}

export function lowerPinFocused(cards: readonly Rectangulus[], id: string): Rectangulus[] {
  return lowerPin(cards, id);
}

function bulk(cards: readonly Rectangulus[], ids: readonly string[], edit: (card: Rectangulus) => Rectangulus): Rectangulus[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRectangulusBone(cards: readonly Rectangulus[], ids: readonly string[]): Rectangulus[] {
  return bulk(cards, ids, (card) => (card.finish === "BONE" ? card : { ...card, finish: "BONE", audit: "finish" }));
}

export function bulkRectangulusSighted(cards: readonly Rectangulus[], ids: readonly string[]): Rectangulus[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkRectangulusVault(cards: readonly Rectangulus[], ids: readonly string[]): Rectangulus[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "vault" }));
}

export function bulkRectangulusTag(cards: readonly Rectangulus[], ids: readonly string[]): Rectangulus[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readRectangulusViews(raw: unknown): RectangulusView[] {
  if (!Array.isArray(raw)) return [];
  const out: RectangulusView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RectangulusView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      sighter: clip(row.sighter, 24),
      finish: activeFinish(row.finish, ["BRASS", "EBONY", "BONE"]),
      quarter: activeQuarter(row.quarter),
      span: activeSpan(row.span),
      pin: activePin(row.pin),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addRectangulusView(views: readonly RectangulusView[], view: RectangulusView): RectangulusView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRectangulusViews([...views, { ...view, id, name }]);
}

export function dropRectangulusView(views: readonly RectangulusView[], id: string): RectangulusView[] {
  return views.filter((view) => view.id !== id);
}

export function rectangulusDensity(raw: unknown): RectangulusDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortRectangulusRules(cards: readonly Rectangulus[], sort: RectangulusSort): Rectangulus[] {
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

export function visibleRectangulusRules(
  cards: readonly Rectangulus[],
  tray: RectangulusTray,
  query: string,
  sighter: string,
  finish: string,
  quarter: string,
  span: string,
  pin: string,
): Rectangulus[] {
  const text = query.trim().toLowerCase();
  const wantSighter = clip(sighter, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : rectangulusCloth(finish);
  const wantQuarter = activeQuarter(quarter);
  const wantSpan = activeSpan(span);
  const wantPin = activePin(pin);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.sighter}`.toLowerCase().includes(text)) return false;
    if (wantSighter && card.sighter.toLowerCase() !== wantSighter) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantQuarter === "inner" && !rectangulusInner(card.quarter)) return false;
    if (wantQuarter === "outer" && !rectangulusOuter(card.quarter)) return false;
    if (wantQuarter !== "all" && wantQuarter !== "inner" && wantQuarter !== "outer" && card.quarter !== wantQuarter) return false;
    if (wantSpan !== "all" && String(card.span ?? "") !== wantSpan) return false;
    if (wantPin !== "all" && String(card.pin) !== wantPin) return false;
    return true;
  });
}

/** An outer quarter on pin three, still unsighted and not in the vault, is overdue. */
export function overdueRectangulus(card: Rectangulus): boolean {
  return rectangulusOuter(card.quarter) && card.pin === 2 && !card.laid && !card.held;
}

/** No finish, the short span, pin three, and still in the court. */
export function idleRectangulus(card: Rectangulus): boolean {
  return !card.finish && card.span === 10 && card.pin === 2 && !card.laid && !card.locked && !card.held;
}

/** Bone, a tall span, and a full pin, still out of the vault. */
export function briskRectangulus(card: Rectangulus): boolean {
  return card.finish === "BONE" && card.span === 80 && card.pin === 8 && !card.held;
}

/** Night, brass, and a middle span. */
export function restingRectangulus(card: Rectangulus): boolean {
  return card.quarter === "night" && card.finish === "BRASS" && card.span === 20;
}

/** A dawn leaf is late when the desk is already on the night. */
export function lateRectangulus(card: Rectangulus, desk: string): boolean {
  return card.quarter === "dawn" && rectangulusQuarter(desk) === "night" && !card.laid;
}

export function rectangulusCounts(cards: readonly Rectangulus[], shown: readonly Rectangulus[], desk: string): RectangulusCounts {
  return {
    court: cards.filter((card) => inTray(card, "court")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => rectangulusInner(card.quarter)).length,
    outer: cards.filter((card) => rectangulusOuter(card.quarter)).length,
    wide: cards.filter((card) => card.span === 80).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRectangulus).length,
    brisk: cards.filter(briskRectangulus).length,
    resting: cards.filter(restingRectangulus).length,
    overdue: cards.filter(overdueRectangulus).length,
    pair: cards.filter((card) => pairPin(card.pin) && lateRectangulus(card, desk)).length,
  };
}

export function rectangulusBars(cards: readonly Rectangulus[]): { quarter: string; count: number }[] {
  return RXG_QUARTERS.map((quarter) => ({ quarter, count: cards.filter((card) => card.quarter === quarter && !card.held).length }));
}

export function rectangulusTimeline(cards: readonly Rectangulus[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "court"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function rectangulusSighters(cards: readonly Rectangulus[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.sighter && !out.some((name) => name.toLowerCase() === card.sighter.toLowerCase())) out.push(card.sighter);
  }
  return out;
}

export function busiestSighter(cards: readonly Rectangulus[]): string {
  const open = cards.filter((card) => inTray(card, "court") && !card.laid && card.sighter);
  let best = "";
  let score = 0;
  for (const name of rectangulusSighters(open)) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRectangulusRules(cards: readonly Rectangulus[]): string[] {
  return cards.filter(overdueRectangulus).map((card) => card.title);
}

export function rectangulusCopy(card: Rectangulus): string {
  return [card.title, card.sighter, card.quarter, card.finish, card.span ?? "", card.pin, card.note].filter((item) => item !== "").join(" · ");
}

export function rectangulusCsv(cards: readonly Rectangulus[], desk: string): string {
  const lines = ["title,sighter,quarter,finish,span,pin,tags,sighterd,sleeve,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
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
        rectangulusOuter(card.quarter) ? "1" : "0",
        lateRectangulus(card, desk) ? "1" : "0",
        idleRectangulus(card) ? "1" : "0",
        briskRectangulus(card) ? "1" : "0",
        restingRectangulus(card) ? "1" : "0",
        overdueRectangulus(card) ? "1" : "0",
        rectangulusInner(card.quarter) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        rectangulusBand(card.quarter),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const ASY_KEY = "crmv4-assay-hide";
export const ASY_REVIEW_KEY = "crmv4-assay-review";

export type AssayLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type AssayHue = "" | "ivory" | "graphite" | "champagne";

export type AssayState = "" | "clear" | "set";

export type AssayReview = "all" | "reviewed" | "fresh";

export type AssayShape =
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

export type AssayValue = string | { validationStatus?: unknown; [key: string]: unknown } | null | undefined;

export type AssayRow = { id: string; label: string; assay: AssayValue };

export type AssayLaneLine = { lane: string; count: number };

const ASSAY_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const ASSAY_HUES = ["champagne", "ivory", "graphite"] as const;

function assayRecord(raw: AssayValue): { validationStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function assayBlocked(raw: AssayValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function assayGiven(raw: AssayValue): string {
  const row = assayRecord(raw);
  if (row && !("validationStatus" in row)) return "";
  const value = row ? row.validationStatus : raw;
  return clip(value, 48);
}

function assayReadable(raw: AssayValue): boolean {
  if (assayBlocked(raw)) return false;
  const row = assayRecord(raw);
  if (row && !("validationStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function assayState(raw: AssayValue): AssayState {
  if (!assayReadable(raw)) return "";
  return assayGiven(raw) ? "set" : "clear";
}

/** A house validationStatus is Istanbul, London, Berlin, Moscow, or Cairo. A fort contains a hyphen. A harbor has a space. A digit contains a number. A spark is four characters or fewer. A scroll is twelve characters or longer. */
export function assayLane(raw: AssayValue): AssayLane {
  if (assayState(raw) !== "set") return "";
  const text = assayGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 4) return "spark";
  if (text.length >= 12) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function assayHue(raw: AssayValue): AssayHue {
  const lane = assayLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function assayHouse(raw: AssayValue): boolean {
  return assayLane(raw) === "house";
}

export function assayFort(raw: AssayValue): boolean {
  return assayLane(raw) === "fort";
}

export function assayHarbor(raw: AssayValue): boolean {
  return assayLane(raw) === "harbor";
}

export function assayDigitLane(raw: AssayValue): boolean {
  return assayLane(raw) === "digit";
}

export function assaySpark(raw: AssayValue): boolean {
  return assayLane(raw) === "spark";
}

export function assayScroll(raw: AssayValue): boolean {
  return assayLane(raw) === "scroll";
}

export function assayVowelLane(raw: AssayValue): boolean {
  return assayLane(raw) === "vowel";
}

export function assayPost(raw: AssayValue): boolean {
  return assayLane(raw) === "post";
}

export function assayOpen(raw: AssayValue): boolean {
  return assayState(raw) === "clear";
}

/** A validationStatus the desk can keep without a rewrite: a scroll or a house validationStatus. */
export function assayHeld(raw: AssayValue): boolean {
  const lane = assayLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a validationStatus of two characters or fewer that is not a house, still wants a fuller name. */
export function assaySoon(raw: AssayValue): boolean {
  if (assayState(raw) !== "set") return false;
  if (assaySpark(raw)) return true;
  if (assayHouse(raw)) return false;
  const length = assayGiven(raw).length;
  return length > 0 && length <= 2;
}

export function assayLength(raw: AssayValue): number | null {
  if (assayState(raw) !== "set") return null;
  return assayGiven(raw).length;
}

export function assayEven(raw: AssayValue): boolean {
  const length = assayLength(raw);
  return length !== null && length % 2 === 0;
}

export function assayOdd(raw: AssayValue): boolean {
  const length = assayLength(raw);
  return length !== null && length % 2 === 1;
}

export function assayFirst(raw: AssayValue): boolean {
  return /^[A-Za-z]/.test(assayGiven(raw));
}

export function assayTail(raw: AssayValue): boolean {
  return /[0-9]$/.test(assayGiven(raw));
}

export function assayCapital(raw: AssayValue): boolean {
  return /[A-Z]/.test(assayGiven(raw));
}

export function assaySpace(raw: AssayValue): boolean {
  return assayGiven(raw).includes(" ");
}

export function assayVowel(raw: AssayValue): boolean {
  return /^[aeiou]/i.test(assayGiven(raw));
}

export function assayDigit(raw: AssayValue): boolean {
  return /[0-9]/.test(assayGiven(raw));
}

export function assayLetter(raw: AssayValue): boolean {
  return /[A-Za-z]/.test(assayGiven(raw));
}

export function assayMixed(raw: AssayValue): boolean {
  return assayDigit(raw) && assayLetter(raw);
}

export function assayLower(raw: AssayValue): boolean {
  const text = assayGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function assayUpper(raw: AssayValue): boolean {
  const text = assayGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function assayHyphen(raw: AssayValue): boolean {
  return assayGiven(raw).includes("-");
}

export function assayPeriod(raw: AssayValue): boolean {
  return assayGiven(raw).includes(".");
}

export function assayStamp(raw: AssayValue): string {
  const text = assayGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function assayCopy(raw: AssayValue): string {
  return assayGiven(raw);
}

export function assayFamily(raw: AssayValue): string {
  if (assayState(raw) !== "set") return "";
  return firstToken(assayGiven(raw));
}

export function assayLanes(rows: readonly AssayRow[]): AssayLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of ASSAY_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = assayLane(row.assay);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return ASSAY_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingAssay(rows: readonly AssayRow[]): string {
  const lines = assayLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || ASSAY_LANES.indexOf(a.lane as (typeof ASSAY_LANES)[number]) - ASSAY_LANES.indexOf(b.lane as (typeof ASSAY_LANES)[number]))[0].lane;
}

export function leadingAssayHue(rows: readonly AssayRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of ASSAY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = assayHue(row.assay);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = ASSAY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || ASSAY_HUES.indexOf(a.hue) - ASSAY_HUES.indexOf(b.hue))[0].hue;
}

export function laneAssayCount(rows: readonly AssayRow[], lane: AssayLane): number {
  return rows.filter((row) => assayLane(row.assay) === lane).length;
}

export function assayShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAssayLanes(rows: readonly AssayRow[]): string[] {
  return assayLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenAssays(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAssays(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAssay(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleAssayReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAssayReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAssayLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: AssayRow, shape: AssayShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return assayHouse(row.assay);
  if (shape === "fort") return assayFort(row.assay);
  if (shape === "harbor") return assayHarbor(row.assay);
  if (shape === "digit") return assayDigitLane(row.assay);
  if (shape === "spark") return assaySpark(row.assay);
  if (shape === "scroll") return assayScroll(row.assay);
  if (shape === "vowel") return assayVowelLane(row.assay);
  if (shape === "post") return assayPost(row.assay);
  if (shape === "open") return assayOpen(row.assay);
  if (shape === "soon") return assaySoon(row.assay);
  if (shape === "letter") return assayLetter(row.assay);
  if (shape === "mixed") return assayMixed(row.assay);
  if (shape === "upper") return assayUpper(row.assay);
  if (shape === "lower") return assayLower(row.assay);
  if (shape === "space") return assaySpace(row.assay);
  if (shape === "even") return assayEven(row.assay);
  if (shape === "odd") return assayOdd(row.assay);
  if (shape === "tail") return assayTail(row.assay);
  if (shape === "first") return assayFirst(row.assay);
  if (shape === "held") return assayHeld(row.assay);
  if (shape === "hyphen") return assayHyphen(row.assay);
  if (shape === "period") return assayPeriod(row.assay);
  return assayLane(row.assay) === shape;
}

export function visibleAssays(
  rows: readonly AssayRow[],
  lane: string,
  hue: string,
  query: string,
  review: AssayReview,
  reviewed: readonly string[],
  shape: AssayShape,
): AssayRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (assayState(row.assay) === "") return false;
    const found = assayLane(row.assay);
    const hueName = assayHue(row.assay);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${assayGiven(row.assay)} ${assayStamp(row.assay)} ${assayFamily(row.assay)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function assayLanesCsv(rows: readonly AssayRow[]): string {
  const lines = ["lane,count"];
  for (const line of assayLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function assayRowsCsv(rows: readonly AssayRow[], reviewed: readonly string[]): string {
  const lines = ["name,validationStatus,stamp,family,lane,hue,length,house,fort,harbor,spark,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(assayGiven(row.assay)),
        assayStamp(row.assay),
        csvCell(assayFamily(row.assay)),
        assayLane(row.assay),
        assayHue(row.assay),
        assayLength(row.assay) ?? "",
        assayHouse(row.assay) ? "1" : "0",
        assayFort(row.assay) ? "1" : "0",
        assayHarbor(row.assay) ? "1" : "0",
        assaySpark(row.assay) ? "1" : "0",
        assayEven(row.assay) ? "1" : "0",
        assayDigit(row.assay) ? "1" : "0",
        assayMixed(row.assay) ? "1" : "0",
        assayUpper(row.assay) ? "1" : "0",
        assayVowel(row.assay) ? "1" : "0",
        assayTail(row.assay) ? "1" : "0",
        assayHeld(row.assay) ? "1" : "0",
        assaySoon(row.assay) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
