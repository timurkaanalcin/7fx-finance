/**
 * Tympan rules for a climate plate kept in this browser, and umbra plates read the document status already stored on the account.
 * Climates are tropic, temperate, polar, and arctic. Metals are brass, silver, and enamel.
 * Altitudes are 15, 30, 45, or 60. Pegs are 3, 6, or 9.
 * A file status is APPROVED, PENDING, REJECTED, or NONE. A mews contains a hyphen. A court has a space.
 * A chip is four characters or fewer. A deed is twelve characters or longer. A digit contains a number.
 * A true document mark reads as APPROVED. A false document mark reads as OPEN FILE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_tympan (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   engraver text not null default '',
 *   climate text not null default '',
 *   metal text not null default '',
 *   altitude_no integer,
 *   peg_no integer not null default 3,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   cased boolean not null default false,
 *   lofted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_umbra_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_umbra_review (
 *   trader_id text primary key
 * );
 */

export const TYM_KEY = "crmv4-tympan";
export const TYM_VIEW_KEY = "crmv4-tympan-views";
export const TYM_DENSITY_KEY = "crmv4-tympan-density";
export const TYM_QUARTERS = ["tropic", "temperate", "polar", "arctic"] as const;

export type TympanQuarter = (typeof TYM_QUARTERS)[number];

export type TympanFinish = "blank" | "silk" | "wool" | "gilt";

export type TympanTray = "face" | "sleeve" | "coffer";

export type TympanDensity = "broad" | "tight";

export type TympanSort = "quarter" | "sighter";

export type Tympan = {
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

export type TympanView = {
  id: string;
  name: string;
  tray: TympanTray;
  query: string;
  sighter: string;
  finish: string;
  quarter: string;
  span: string;
  pin: string;
};

export type TympanCounts = {
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

export const ROUND307_FEATURES = [
  "save",
  "note",
  "trays",
  "metal",
  "altitude",
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
  "fair-face",
  "viewer",
  "suggest",
  "sla",
  "umbra",
  "umbra-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "pin", "span", "lower", "star"] as const;

const FINISHES = ["brass", "silver", "enamel"] as const;

const SPAN_CYCLE = [15, 30, 45, 60] as const;

const PIN_CYCLE = [3, 6, 9] as const;

const INNER = new Set(["tropic", "temperate"]);

const OUTER = new Set(["polar", "arctic"]);

const HOUSE_WEAVE = new Set(["BRASS", "ENAMEL"]);

const HOUSE_STATUSES = new Set(["APPROVED", "PENDING", "REJECTED", "NONE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TympanTray {
  return raw === "sleeve" || raw === "coffer" ? raw : "face";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<TympanFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<TympanFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[tp]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Tympan, tray: TympanTray): boolean {
  if (tray === "sleeve") return card.locked && !card.held;
  if (tray === "coffer") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function quarterIndex(quarter: string): number {
  return TYM_QUARTERS.indexOf(quarter as TympanQuarter);
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

export function tympanQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TYM_QUARTERS as readonly string[]).includes(text) ? text : "";
}

/** A reach is 8, 16, 32, or 64. Anything else stays blank. */
export function tympanSpan(raw: unknown): 15 | 30 | 45 | 60 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "60") return null;
  return Number(text) as 15 | 30 | 45 | 60;
}

/** A pin is 2, 4, or 8. Anything else stays blank. */
export function tympanPin(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** Cloth is silk, wool, or gilt. The saved name is the upper token. */
export function tympanCloth(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function tympanInner(quarter: unknown): boolean {
  return INNER.has(clip(quarter, 12).toLowerCase());
}

export function tympanOuter(quarter: unknown): boolean {
  return OUTER.has(clip(quarter, 12).toLowerCase());
}

/** Tropic is the ecliptic. Temperate is the equator. Polar is the circle. Arctic is the pole. */
export function tympanBand(quarter: unknown): string {
  const text = tympanQuarter(quarter);
  if (!text) return "";
  if (text === "tropic") return "ecliptic";
  if (text === "temperate") return "equator";
  if (text === "polar") return "circle";
  return "pole";
}

/** Signed distance from one watch to another along the tympan. */
export function tympanGap(from: unknown, to: unknown): number | null {
  const left = quarterIndex(tympanQuarter(from));
  const right = quarterIndex(tympanQuarter(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_WEAVE.has(tympanCloth(finish));
}

/** A pair pin is 4. Two and eight are not a pair. */
export function pairPin(pin: unknown): boolean {
  return tympanPin(pin) === 6;
}

/** A full pin is 8. */
export function fullPin(pin: unknown): boolean {
  return tympanPin(pin) === 9;
}

export function activeQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return tympanQuarter(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = tympanSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = tympanCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePin(raw: unknown): string {
  const pin = tympanPin(raw);
  return pin === null ? "all" : String(pin);
}

export function moveTympanFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the court uses least. A tie keeps bone, then brass, then ebony. */
export function suggestFinish(cards: readonly Tympan[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "face") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "ENAMEL";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["ENAMEL", "BRASS", "SILVER"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest fifteen. Late morning asks for thirty. Afternoon asks for forty-five. Evening asks for sixty. A saved altitude on the face wins, and a tie keeps the taller altitude. */
export function suggestSpan(cards: readonly Tympan[], hour: number): 15 | 30 | 45 | 60 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "face") || card.span === null) continue;
    seen = true;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  if (seen) {
    let best: 15 | 30 | 45 | 60 = 60;
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
  if (hour < 6) return 15;
  if (hour < 10) return 30;
  if (hour < 15) return 45;
  return 60;
}

/** Before ten, suggest the tropic. The rest of the day suggests the arctic. */
export function suggestQuarter(hour: number): TympanQuarter {
  return hour < 10 ? "tropic" : "arctic";
}

/** The sighter with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairSighter(cards: readonly Tympan[], roster: string): string {
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

export function readTympanRules(raw: unknown): Tympan[] {
  if (!Array.isArray(raw)) return [];
  const out: Tympan[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tympan>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      sighter: clip(row.sighter, 24),
      quarter: tympanQuarter(row.quarter),
      span: tympanSpan(row.span),
      finish: tympanCloth(row.finish),
      pin: tympanPin(row.pin) ?? 3,
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

export function addTympan(
  cards: readonly Tympan[],
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
): Tympan[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTympanRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      sighter: clip(card.sighter, 24),
      quarter: tympanQuarter(card.quarter),
      span: tympanSpan(card.span),
      finish: tympanCloth(card.finish),
      pin: tympanPin(card.pin) ?? 3,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Tympan[], id: string, edit: (card: Tympan) => Tympan): Tympan[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTympan(cards: readonly Tympan[], id: string, title: string): Tympan[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTympanNote(cards: readonly Tympan[], id: string, note: string): Tympan[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "BRASS", "SILVER", "ENAMEL"];
  const index = order.indexOf(tympanCloth(finish));
  return order[(index + 1) % order.length] || "BRASS";
}

export function setTympanCloth(cards: readonly Tympan[], id: string, finish: string): Tympan[] {
  const next = tympanCloth(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setTympanSighted(cards: readonly Tympan[], id: string, laid: boolean): Tympan[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setTympanSleeve(cards: readonly Tympan[], id: string, locked: boolean): Tympan[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sheath" : "resume" }));
}

export function setTympanVault(cards: readonly Tympan[], id: string, held: boolean): Tympan[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "crypt" : "open" }));
}

export function setTympanStar(cards: readonly Tympan[], id: string, starred: boolean): Tympan[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addTympanTag(cards: readonly Tympan[], id: string, tag: string): Tympan[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 15 | 30 | 45 | 60 {
  if (span === null) return dir > 0 ? 15 : 60;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepPin(pin: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = pinIndex(pin);
  const next = index < 0 ? 0 : (index + dir + PIN_CYCLE.length) % PIN_CYCLE.length;
  return PIN_CYCLE[next];
}

export function liftSpan(cards: readonly Tympan[], id: string): Tympan[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Tympan[], id: string): Tympan[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raisePin(cards: readonly Tympan[], id: string): Tympan[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, 1), audit: "pin" }));
}

export function lowerPin(cards: readonly Tympan[], id: string): Tympan[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, -1), audit: "pin" }));
}

export function setTympanFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveTympanFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return setTympanSleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starTympanFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return setTympanStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagTympanFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return addTympanTag(cards, id, "t");
}

export function finishFocused(cards: readonly Tympan[], id: string): Tympan[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTympanCloth(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftSpanFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return lowerSpan(cards, id);
}

export function raisePinFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return raisePin(cards, id);
}

export function lowerPinFocused(cards: readonly Tympan[], id: string): Tympan[] {
  return lowerPin(cards, id);
}

function bulk(cards: readonly Tympan[], ids: readonly string[], edit: (card: Tympan) => Tympan): Tympan[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTympanEnamel(cards: readonly Tympan[], ids: readonly string[]): Tympan[] {
  return bulk(cards, ids, (card) => (card.finish === "ENAMEL" ? card : { ...card, finish: "ENAMEL", audit: "finish" }));
}

export function bulkTympanSighted(cards: readonly Tympan[], ids: readonly string[]): Tympan[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkTympanVault(cards: readonly Tympan[], ids: readonly string[]): Tympan[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "crypt" }));
}

export function bulkTympanTag(cards: readonly Tympan[], ids: readonly string[]): Tympan[] {
  return bulk(cards, ids, (card) => (card.tags.includes("p") ? card : { ...card, tags: tagsOf([...card.tags, "p"]), audit: "tag" }));
}

export function readTympanViews(raw: unknown): TympanView[] {
  if (!Array.isArray(raw)) return [];
  const out: TympanView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TympanView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      sighter: clip(row.sighter, 24),
      finish: activeFinish(row.finish, ["BRASS", "SILVER", "ENAMEL"]),
      quarter: activeQuarter(row.quarter),
      span: activeSpan(row.span),
      pin: activePin(row.pin),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTympanView(views: readonly TympanView[], view: TympanView): TympanView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTympanViews([...views, { ...view, id, name }]);
}

export function dropTympanView(views: readonly TympanView[], id: string): TympanView[] {
  return views.filter((view) => view.id !== id);
}

export function tympanDensity(raw: unknown): TympanDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortTympanRules(cards: readonly Tympan[], sort: TympanSort): Tympan[] {
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

export function visibleTympanRules(
  cards: readonly Tympan[],
  tray: TympanTray,
  query: string,
  sighter: string,
  finish: string,
  quarter: string,
  span: string,
  pin: string,
): Tympan[] {
  const text = query.trim().toLowerCase();
  const wantSighter = clip(sighter, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : tympanCloth(finish);
  const wantQuarter = activeQuarter(quarter);
  const wantSpan = activeSpan(span);
  const wantPin = activePin(pin);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.sighter}`.toLowerCase().includes(text)) return false;
    if (wantSighter && card.sighter.toLowerCase() !== wantSighter) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantQuarter === "inner" && !tympanInner(card.quarter)) return false;
    if (wantQuarter === "outer" && !tympanOuter(card.quarter)) return false;
    if (wantQuarter !== "all" && wantQuarter !== "inner" && wantQuarter !== "outer" && card.quarter !== wantQuarter) return false;
    if (wantSpan !== "all" && String(card.span ?? "") !== wantSpan) return false;
    if (wantPin !== "all" && String(card.pin) !== wantPin) return false;
    return true;
  });
}

/** An outer quarter on pin two, still unmarked and not in the chest, is overdue. */
export function overdueTympan(card: Tympan): boolean {
  return tympanOuter(card.quarter) && card.pin === 3 && !card.laid && !card.held;
}

/** No finish, the short span, pin two, and still on the ring. */
export function idleTympan(card: Tympan): boolean {
  return !card.finish && card.span === 15 && card.pin === 3 && !card.laid && !card.locked && !card.held;
}

/** Gilt, a tall span, and a full pin, still out of the chest. */
export function briskTympan(card: Tympan): boolean {
  return card.finish === "ENAMEL" && card.span === 60 && card.pin === 9 && !card.held;
}

/** North, silk, and a middle reach. */
export function restingTympan(card: Tympan): boolean {
  return card.quarter === "arctic" && card.finish === "SILVER" && card.span === 30;
}

/** An east ring is late when the desk is already on the north. */
export function lateTympan(card: Tympan, desk: string): boolean {
  return card.quarter === "tropic" && tympanQuarter(desk) === "arctic" && !card.laid;
}

export function tympanCounts(cards: readonly Tympan[], shown: readonly Tympan[], desk: string): TympanCounts {
  return {
    court: cards.filter((card) => inTray(card, "face")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    vault: cards.filter((card) => inTray(card, "coffer")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => tympanInner(card.quarter)).length,
    outer: cards.filter((card) => tympanOuter(card.quarter)).length,
    wide: cards.filter((card) => card.span === 60).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleTympan).length,
    brisk: cards.filter(briskTympan).length,
    resting: cards.filter(restingTympan).length,
    overdue: cards.filter(overdueTympan).length,
    pair: cards.filter((card) => pairPin(card.pin) && lateTympan(card, desk)).length,
  };
}

export function tympanBars(cards: readonly Tympan[]): { quarter: string; count: number }[] {
  return TYM_QUARTERS.map((quarter) => ({ quarter, count: cards.filter((card) => card.quarter === quarter && !card.held).length }));
}

export function tympanTimeline(cards: readonly Tympan[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "face"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function tympanSighters(cards: readonly Tympan[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.sighter && !out.some((name) => name.toLowerCase() === card.sighter.toLowerCase())) out.push(card.sighter);
  }
  return out;
}

export function busiestSighter(cards: readonly Tympan[]): string {
  const open = cards.filter((card) => inTray(card, "face") && !card.laid && card.sighter);
  let best = "";
  let score = 0;
  for (const name of tympanSighters(open)) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTympanRules(cards: readonly Tympan[]): string[] {
  return cards.filter(overdueTympan).map((card) => card.title);
}

export function tympanCopy(card: Tympan): string {
  return [card.title, card.sighter, card.quarter, card.finish, card.span ?? "", card.pin, card.note].filter((item) => item !== "").join(" · ");
}

export function tympanCsv(cards: readonly Tympan[], desk: string): string {
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
        tympanOuter(card.quarter) ? "1" : "0",
        lateTympan(card, desk) ? "1" : "0",
        idleTympan(card) ? "1" : "0",
        briskTympan(card) ? "1" : "0",
        restingTympan(card) ? "1" : "0",
        overdueTympan(card) ? "1" : "0",
        tympanInner(card.quarter) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        tympanBand(card.quarter),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const UMB_KEY = "crmv4-umbra-hide";
export const UMB_REVIEW_KEY = "crmv4-umbra-review";

export type UmbraLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type UmbraHue = "" | "ivory" | "graphite" | "champagne";

export type UmbraState = "" | "clear" | "set";

export type UmbraReview = "all" | "reviewed" | "fresh";

export type UmbraShape =
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

export type UmbraValue = string | { documentsStatus?: unknown; [key: string]: unknown } | null | undefined;

export type UmbraRow = { id: string; label: string; umbra: UmbraValue };

export type UmbraLaneLine = { lane: string; count: number };

const UMBRA_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const UMBRA_HUES = ["champagne", "ivory", "graphite"] as const;

function umbraRecord(raw: UmbraValue): { documentsStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function umbraBlocked(raw: UmbraValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function umbraGiven(raw: UmbraValue): string {
  const row = umbraRecord(raw);
  if (row && !("documentsStatus" in row)) return "";
  const value = row ? row.documentsStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "APPROVED";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN FILE";
  return clip(value, 48);
}

function umbraReadable(raw: UmbraValue): boolean {
  if (umbraBlocked(raw)) return false;
  const row = umbraRecord(raw);
  if (row && !("documentsStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function umbraState(raw: UmbraValue): UmbraState {
  if (!umbraReadable(raw)) return "";
  return umbraGiven(raw) ? "set" : "clear";
}

/** A file status is APPROVED, PENDING, REJECTED, or NONE. A mews contains a hyphen. A court has a space. A digit contains a number. A chip is four characters or fewer. A deed is twelve characters or longer. */
export function umbraLane(raw: UmbraValue): UmbraLane {
  if (umbraState(raw) !== "set") return "";
  const text = umbraGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 4) return "spark";
  if (text.length >= 12) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function umbraHue(raw: UmbraValue): UmbraHue {
  const lane = umbraLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function umbraHouse(raw: UmbraValue): boolean {
  return umbraLane(raw) === "house";
}

export function umbraFort(raw: UmbraValue): boolean {
  return umbraLane(raw) === "fort";
}

export function umbraHarbor(raw: UmbraValue): boolean {
  return umbraLane(raw) === "harbor";
}

export function umbraDigitLane(raw: UmbraValue): boolean {
  return umbraLane(raw) === "digit";
}

export function umbraSpark(raw: UmbraValue): boolean {
  return umbraLane(raw) === "spark";
}

export function umbraScroll(raw: UmbraValue): boolean {
  return umbraLane(raw) === "scroll";
}

export function umbraVowelLane(raw: UmbraValue): boolean {
  return umbraLane(raw) === "vowel";
}

export function umbraPost(raw: UmbraValue): boolean {
  return umbraLane(raw) === "post";
}

export function umbraOpen(raw: UmbraValue): boolean {
  return umbraState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function umbraHeld(raw: UmbraValue): boolean {
  const lane = umbraLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function umbraSoon(raw: UmbraValue): boolean {
  if (umbraState(raw) !== "set") return false;
  if (umbraSpark(raw)) return true;
  if (umbraHouse(raw)) return false;
  const length = umbraGiven(raw).length;
  return length > 0 && length <= 2;
}

export function umbraLength(raw: UmbraValue): number | null {
  if (umbraState(raw) !== "set") return null;
  return umbraGiven(raw).length;
}

export function umbraEven(raw: UmbraValue): boolean {
  const length = umbraLength(raw);
  return length !== null && length % 2 === 0;
}

export function umbraOdd(raw: UmbraValue): boolean {
  const length = umbraLength(raw);
  return length !== null && length % 2 === 1;
}

export function umbraFirst(raw: UmbraValue): boolean {
  return /^[A-Za-z]/.test(umbraGiven(raw));
}

export function umbraTail(raw: UmbraValue): boolean {
  return /[0-9]$/.test(umbraGiven(raw));
}

export function umbraCapital(raw: UmbraValue): boolean {
  return /[A-Z]/.test(umbraGiven(raw));
}

export function umbraSpace(raw: UmbraValue): boolean {
  return umbraGiven(raw).includes(" ");
}

export function umbraVowel(raw: UmbraValue): boolean {
  return /^[aeiou]/i.test(umbraGiven(raw));
}

export function umbraDigit(raw: UmbraValue): boolean {
  return /[0-9]/.test(umbraGiven(raw));
}

export function umbraLetter(raw: UmbraValue): boolean {
  return /[A-Za-z]/.test(umbraGiven(raw));
}

export function umbraMixed(raw: UmbraValue): boolean {
  return umbraDigit(raw) && umbraLetter(raw);
}

export function umbraLower(raw: UmbraValue): boolean {
  const text = umbraGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function umbraUpper(raw: UmbraValue): boolean {
  const text = umbraGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function umbraHyphen(raw: UmbraValue): boolean {
  return umbraGiven(raw).includes("-");
}

export function umbraPeriod(raw: UmbraValue): boolean {
  return umbraGiven(raw).includes(".");
}

export function umbraStamp(raw: UmbraValue): string {
  const text = umbraGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function umbraCopy(raw: UmbraValue): string {
  return umbraGiven(raw);
}

export function umbraFamily(raw: UmbraValue): string {
  if (umbraState(raw) !== "set") return "";
  return firstToken(umbraGiven(raw));
}

export function umbraLanes(rows: readonly UmbraRow[]): UmbraLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of UMBRA_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = umbraLane(row.umbra);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return UMBRA_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingUmbra(rows: readonly UmbraRow[]): string {
  const lines = umbraLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || UMBRA_LANES.indexOf(a.lane as (typeof UMBRA_LANES)[number]) - UMBRA_LANES.indexOf(b.lane as (typeof UMBRA_LANES)[number]))[0].lane;
}

export function leadingUmbraHue(rows: readonly UmbraRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of UMBRA_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = umbraHue(row.umbra);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = UMBRA_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || UMBRA_HUES.indexOf(a.hue) - UMBRA_HUES.indexOf(b.hue))[0].hue;
}

export function laneUmbraCount(rows: readonly UmbraRow[], lane: UmbraLane): number {
  return rows.filter((row) => umbraLane(row.umbra) === lane).length;
}

export function umbraShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentUmbraLanes(rows: readonly UmbraRow[]): string[] {
  return umbraLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenUmbras(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedUmbras(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleUmbra(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleUmbraReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkUmbraReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleUmbraLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: UmbraRow, shape: UmbraShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return umbraHouse(row.umbra);
  if (shape === "fort") return umbraFort(row.umbra);
  if (shape === "harbor") return umbraHarbor(row.umbra);
  if (shape === "digit") return umbraDigitLane(row.umbra);
  if (shape === "spark") return umbraSpark(row.umbra);
  if (shape === "scroll") return umbraScroll(row.umbra);
  if (shape === "vowel") return umbraVowelLane(row.umbra);
  if (shape === "post") return umbraPost(row.umbra);
  if (shape === "open") return umbraOpen(row.umbra);
  if (shape === "soon") return umbraSoon(row.umbra);
  if (shape === "letter") return umbraLetter(row.umbra);
  if (shape === "mixed") return umbraMixed(row.umbra);
  if (shape === "upper") return umbraUpper(row.umbra);
  if (shape === "lower") return umbraLower(row.umbra);
  if (shape === "space") return umbraSpace(row.umbra);
  if (shape === "even") return umbraEven(row.umbra);
  if (shape === "odd") return umbraOdd(row.umbra);
  if (shape === "tail") return umbraTail(row.umbra);
  if (shape === "first") return umbraFirst(row.umbra);
  if (shape === "held") return umbraHeld(row.umbra);
  if (shape === "hyphen") return umbraHyphen(row.umbra);
  if (shape === "period") return umbraPeriod(row.umbra);
  return umbraLane(row.umbra) === shape;
}

export function visibleUmbras(
  rows: readonly UmbraRow[],
  lane: string,
  hue: string,
  query: string,
  review: UmbraReview,
  reviewed: readonly string[],
  shape: UmbraShape,
): UmbraRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (umbraState(row.umbra) === "") return false;
    const found = umbraLane(row.umbra);
    const hueName = umbraHue(row.umbra);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${umbraGiven(row.umbra)} ${umbraStamp(row.umbra)} ${umbraFamily(row.umbra)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function umbraLanesCsv(rows: readonly UmbraRow[]): string {
  const lines = ["lane,count"];
  for (const line of umbraLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function umbraRowsCsv(rows: readonly UmbraRow[], reviewed: readonly string[]): string {
  const lines = ["name,documentsStatus,stamp,family,lane,hue,length,house,fort,harbor,spark,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(umbraGiven(row.umbra)),
        umbraStamp(row.umbra),
        csvCell(umbraFamily(row.umbra)),
        umbraLane(row.umbra),
        umbraHue(row.umbra),
        umbraLength(row.umbra) ?? "",
        umbraHouse(row.umbra) ? "1" : "0",
        umbraFort(row.umbra) ? "1" : "0",
        umbraHarbor(row.umbra) ? "1" : "0",
        umbraSpark(row.umbra) ? "1" : "0",
        umbraEven(row.umbra) ? "1" : "0",
        umbraDigit(row.umbra) ? "1" : "0",
        umbraMixed(row.umbra) ? "1" : "0",
        umbraUpper(row.umbra) ? "1" : "0",
        umbraVowel(row.umbra) ? "1" : "0",
        umbraTail(row.umbra) ? "1" : "0",
        umbraHeld(row.umbra) ? "1" : "0",
        umbraSoon(row.umbra) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
