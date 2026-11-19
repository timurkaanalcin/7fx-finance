/**
 * Alidade rules for a sighting rule kept in this browser, and specimen plates read the test flag already stored on the account.
 * Watches are rise, crest, gloam, and dark. Cloth is linen, ink, and gilt.
 * Reaches are 12, 24, 48, or 96. Pins are 3, 6, or 9.
 * A house flag is TEST, DEMO, SAMPLE, or FIXTURE. A fort contains a hyphen. A harbor has a space.
 * A spark is four characters or fewer. A scroll is twelve characters or longer. A digit contains a number.
 * A true test flag reads as TEST. A false test flag reads as LIVE BOOK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_alidade (
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
 * CREATE TABLE crm_specimen_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_specimen_review (
 *   trader_id text primary key
 * );
 */

export const ALD_KEY = "crmv4-alidade";
export const ALD_VIEW_KEY = "crmv4-alidade-views";
export const ALD_DENSITY_KEY = "crmv4-alidade-density";
export const ALD_QUARTERS = ["rise", "crest", "gloam", "dark"] as const;

export type AlidadeQuarter = (typeof ALD_QUARTERS)[number];

export type AlidadeFinish = "blank" | "linen" | "ink" | "gilt";

export type AlidadeTray = "yard" | "sheath" | "crypt";

export type AlidadeDensity = "broad" | "tight";

export type AlidadeSort = "quarter" | "sighter";

export type Alidade = {
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

export type AlidadeView = {
  id: string;
  name: string;
  tray: AlidadeTray;
  query: string;
  sighter: string;
  finish: string;
  quarter: string;
  span: string;
  pin: string;
};

export type AlidadeCounts = {
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

export const ROUND305_FEATURES = [
  "save",
  "note",
  "trays",
  "cloth",
  "reach",
  "crypt",
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
  "fair-sight",
  "viewer",
  "suggest",
  "sla",
  "specimen",
  "specimen-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "pin", "span", "lower", "star"] as const;

const FINISHES = ["linen", "ink", "gilt"] as const;

const SPAN_CYCLE = [12, 24, 48, 96] as const;

const PIN_CYCLE = [3, 6, 9] as const;

const INNER = new Set(["rise", "crest"]);

const OUTER = new Set(["gloam", "dark"]);

const HOUSE_WEAVE = new Set(["LINEN", "GILT"]);

const HOUSE_STATUSES = new Set(["TEST", "DEMO", "SAMPLE", "FIXTURE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AlidadeTray {
  return raw === "sheath" || raw === "crypt" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<AlidadeFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<AlidadeFinish, "blank">) : "";
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

function inTray(card: Alidade, tray: AlidadeTray): boolean {
  if (tray === "sheath") return card.locked && !card.held;
  if (tray === "crypt") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function quarterIndex(quarter: string): number {
  return ALD_QUARTERS.indexOf(quarter as AlidadeQuarter);
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

export function alidadeQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ALD_QUARTERS as readonly string[]).includes(text) ? text : "";
}

/** A reach is 12, 24, 48, or 96. Anything else stays blank. */
export function alidadeSpan(raw: unknown): 12 | 24 | 48 | 96 | null {
  const text = wholeToken(raw);
  if (text !== "12" && text !== "24" && text !== "48" && text !== "96") return null;
  return Number(text) as 12 | 24 | 48 | 96;
}

/** A pin is 3, 6, or 9. Anything else stays blank. */
export function alidadePin(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** Cloth is linen, ink, or gilt. The saved name is the upper token. */
export function alidadeCloth(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function alidadeInner(quarter: unknown): boolean {
  return INNER.has(clip(quarter, 12).toLowerCase());
}

export function alidadeOuter(quarter: unknown): boolean {
  return OUTER.has(clip(quarter, 12).toLowerCase());
}

/** Rise is the rim. Crest is the hub. Gloam is the vane. Dark is the foot. */
export function alidadeBand(quarter: unknown): string {
  const text = alidadeQuarter(quarter);
  if (!text) return "";
  if (text === "rise") return "rim";
  if (text === "crest") return "hub";
  if (text === "gloam") return "vane";
  return "foot";
}

/** Signed distance from one watch to another along the alidade. */
export function alidadeGap(from: unknown, to: unknown): number | null {
  const left = quarterIndex(alidadeQuarter(from));
  const right = quarterIndex(alidadeQuarter(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_WEAVE.has(alidadeCloth(finish));
}

/** A pair pin is 6. Three and nine are not a pair. */
export function pairPin(pin: unknown): boolean {
  return alidadePin(pin) === 6;
}

/** A full pin is 9. */
export function fullPin(pin: unknown): boolean {
  return alidadePin(pin) === 9;
}

export function activeQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return alidadeQuarter(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = alidadeSpan(raw);
  return span === null ? "all" : String(span);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = alidadeCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePin(raw: unknown): string {
  const pin = alidadePin(raw);
  return pin === null ? "all" : String(pin);
}

export function moveAlidadeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the court uses least. A tie keeps bone, then brass, then ebony. */
export function suggestFinish(cards: readonly Alidade[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "GILT";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["GILT", "LINEN", "INK"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest fifteen. Late morning asks for thirty. Afternoon asks for forty-five. Evening asks for sixty. A saved span in the court wins, and a tie keeps the taller span. */
export function suggestSpan(cards: readonly Alidade[], hour: number): 12 | 24 | 48 | 96 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.span === null) continue;
    seen = true;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  if (seen) {
    let best: 12 | 24 | 48 | 96 = 96;
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
  if (hour < 7) return 12;
  if (hour < 12) return 24;
  if (hour < 16) return 48;
  return 96;
}

/** Before nine, suggest the rise. The rest of the day suggests the dark. */
export function suggestQuarter(hour: number): AlidadeQuarter {
  return hour < 9 ? "rise" : "dark";
}

/** The sighter with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairSighter(cards: readonly Alidade[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "yard") && !card.laid);
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

export function readAlidadeRules(raw: unknown): Alidade[] {
  if (!Array.isArray(raw)) return [];
  const out: Alidade[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Alidade>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      sighter: clip(row.sighter, 24),
      quarter: alidadeQuarter(row.quarter),
      span: alidadeSpan(row.span),
      finish: alidadeCloth(row.finish),
      pin: alidadePin(row.pin) ?? 3,
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

export function addAlidade(
  cards: readonly Alidade[],
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
): Alidade[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readAlidadeRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      sighter: clip(card.sighter, 24),
      quarter: alidadeQuarter(card.quarter),
      span: alidadeSpan(card.span),
      finish: alidadeCloth(card.finish),
      pin: alidadePin(card.pin) ?? 3,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Alidade[], id: string, edit: (card: Alidade) => Alidade): Alidade[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editAlidade(cards: readonly Alidade[], id: string, title: string): Alidade[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editAlidadeNote(cards: readonly Alidade[], id: string, note: string): Alidade[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "LINEN", "INK", "GILT"];
  const index = order.indexOf(alidadeCloth(finish));
  return order[(index + 1) % order.length] || "LINEN";
}

export function setAlidadeCloth(cards: readonly Alidade[], id: string, finish: string): Alidade[] {
  const next = alidadeCloth(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setAlidadeSighted(cards: readonly Alidade[], id: string, laid: boolean): Alidade[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setAlidadeSleeve(cards: readonly Alidade[], id: string, locked: boolean): Alidade[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sheath" : "resume" }));
}

export function setAlidadeVault(cards: readonly Alidade[], id: string, held: boolean): Alidade[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "crypt" : "open" }));
}

export function setAlidadeStar(cards: readonly Alidade[], id: string, starred: boolean): Alidade[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addAlidadeTag(cards: readonly Alidade[], id: string, tag: string): Alidade[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 12 | 24 | 48 | 96 {
  if (span === null) return dir > 0 ? 12 : 96;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepPin(pin: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = pinIndex(pin);
  const next = index < 0 ? 0 : (index + dir + PIN_CYCLE.length) % PIN_CYCLE.length;
  return PIN_CYCLE[next];
}

export function liftSpan(cards: readonly Alidade[], id: string): Alidade[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Alidade[], id: string): Alidade[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raisePin(cards: readonly Alidade[], id: string): Alidade[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, 1), audit: "pin" }));
}

export function lowerPin(cards: readonly Alidade[], id: string): Alidade[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, -1), audit: "pin" }));
}

export function setAlidadeFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveAlidadeFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return setAlidadeSleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starAlidadeFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return setAlidadeStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagAlidadeFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return addAlidadeTag(cards, id, "a");
}

export function finishFocused(cards: readonly Alidade[], id: string): Alidade[] {
  const card = cards.find((item) => item.id === id);
  return card ? setAlidadeCloth(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftSpanFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return lowerSpan(cards, id);
}

export function raisePinFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return raisePin(cards, id);
}

export function lowerPinFocused(cards: readonly Alidade[], id: string): Alidade[] {
  return lowerPin(cards, id);
}

function bulk(cards: readonly Alidade[], ids: readonly string[], edit: (card: Alidade) => Alidade): Alidade[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkAlidadeBone(cards: readonly Alidade[], ids: readonly string[]): Alidade[] {
  return bulk(cards, ids, (card) => (card.finish === "GILT" ? card : { ...card, finish: "GILT", audit: "finish" }));
}

export function bulkAlidadeSighted(cards: readonly Alidade[], ids: readonly string[]): Alidade[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkAlidadeVault(cards: readonly Alidade[], ids: readonly string[]): Alidade[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "crypt" }));
}

export function bulkAlidadeTag(cards: readonly Alidade[], ids: readonly string[]): Alidade[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readAlidadeViews(raw: unknown): AlidadeView[] {
  if (!Array.isArray(raw)) return [];
  const out: AlidadeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AlidadeView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      sighter: clip(row.sighter, 24),
      finish: activeFinish(row.finish, ["LINEN", "INK", "GILT"]),
      quarter: activeQuarter(row.quarter),
      span: activeSpan(row.span),
      pin: activePin(row.pin),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addAlidadeView(views: readonly AlidadeView[], view: AlidadeView): AlidadeView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readAlidadeViews([...views, { ...view, id, name }]);
}

export function dropAlidadeView(views: readonly AlidadeView[], id: string): AlidadeView[] {
  return views.filter((view) => view.id !== id);
}

export function alidadeDensity(raw: unknown): AlidadeDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortAlidadeRules(cards: readonly Alidade[], sort: AlidadeSort): Alidade[] {
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

export function visibleAlidadeRules(
  cards: readonly Alidade[],
  tray: AlidadeTray,
  query: string,
  sighter: string,
  finish: string,
  quarter: string,
  span: string,
  pin: string,
): Alidade[] {
  const text = query.trim().toLowerCase();
  const wantSighter = clip(sighter, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : alidadeCloth(finish);
  const wantQuarter = activeQuarter(quarter);
  const wantSpan = activeSpan(span);
  const wantPin = activePin(pin);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.sighter}`.toLowerCase().includes(text)) return false;
    if (wantSighter && card.sighter.toLowerCase() !== wantSighter) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantQuarter === "inner" && !alidadeInner(card.quarter)) return false;
    if (wantQuarter === "outer" && !alidadeOuter(card.quarter)) return false;
    if (wantQuarter !== "all" && wantQuarter !== "inner" && wantQuarter !== "outer" && card.quarter !== wantQuarter) return false;
    if (wantSpan !== "all" && String(card.span ?? "") !== wantSpan) return false;
    if (wantPin !== "all" && String(card.pin) !== wantPin) return false;
    return true;
  });
}

/** An outer quarter on pin three, still unsighted and not in the vault, is overdue. */
export function overdueAlidade(card: Alidade): boolean {
  return alidadeOuter(card.quarter) && card.pin === 3 && !card.laid && !card.held;
}

/** No finish, the short span, pin three, and still in the court. */
export function idleAlidade(card: Alidade): boolean {
  return !card.finish && card.span === 12 && card.pin === 3 && !card.laid && !card.locked && !card.held;
}

/** Bone, a tall span, and a full pin, still out of the vault. */
export function briskAlidade(card: Alidade): boolean {
  return card.finish === "GILT" && card.span === 96 && card.pin === 9 && !card.held;
}

/** Dark, linen, and a middle reach. */
export function restingAlidade(card: Alidade): boolean {
  return card.quarter === "dark" && card.finish === "LINEN" && card.span === 24;
}

/** A rise leaf is late when the desk is already on the dark. */
export function lateAlidade(card: Alidade, desk: string): boolean {
  return card.quarter === "rise" && alidadeQuarter(desk) === "dark" && !card.laid;
}

export function alidadeCounts(cards: readonly Alidade[], shown: readonly Alidade[], desk: string): AlidadeCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    sleeve: cards.filter((card) => inTray(card, "sheath")).length,
    vault: cards.filter((card) => inTray(card, "crypt")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => alidadeInner(card.quarter)).length,
    outer: cards.filter((card) => alidadeOuter(card.quarter)).length,
    wide: cards.filter((card) => card.span === 96).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleAlidade).length,
    brisk: cards.filter(briskAlidade).length,
    resting: cards.filter(restingAlidade).length,
    overdue: cards.filter(overdueAlidade).length,
    pair: cards.filter((card) => pairPin(card.pin) && lateAlidade(card, desk)).length,
  };
}

export function alidadeBars(cards: readonly Alidade[]): { quarter: string; count: number }[] {
  return ALD_QUARTERS.map((quarter) => ({ quarter, count: cards.filter((card) => card.quarter === quarter && !card.held).length }));
}

export function alidadeTimeline(cards: readonly Alidade[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function alidadeSighters(cards: readonly Alidade[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.sighter && !out.some((name) => name.toLowerCase() === card.sighter.toLowerCase())) out.push(card.sighter);
  }
  return out;
}

export function busiestSighter(cards: readonly Alidade[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.laid && card.sighter);
  let best = "";
  let score = 0;
  for (const name of alidadeSighters(open)) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderAlidadeRules(cards: readonly Alidade[]): string[] {
  return cards.filter(overdueAlidade).map((card) => card.title);
}

export function alidadeCopy(card: Alidade): string {
  return [card.title, card.sighter, card.quarter, card.finish, card.span ?? "", card.pin, card.note].filter((item) => item !== "").join(" · ");
}

export function alidadeCsv(cards: readonly Alidade[], desk: string): string {
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
        alidadeOuter(card.quarter) ? "1" : "0",
        lateAlidade(card, desk) ? "1" : "0",
        idleAlidade(card) ? "1" : "0",
        briskAlidade(card) ? "1" : "0",
        restingAlidade(card) ? "1" : "0",
        overdueAlidade(card) ? "1" : "0",
        alidadeInner(card.quarter) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        alidadeBand(card.quarter),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const SPC_KEY = "crmv4-specimen-hide";
export const SPC_REVIEW_KEY = "crmv4-specimen-review";

export type SpecimenLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type SpecimenHue = "" | "ivory" | "graphite" | "champagne";

export type SpecimenState = "" | "clear" | "set";

export type SpecimenReview = "all" | "reviewed" | "fresh";

export type SpecimenShape =
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

export type SpecimenValue = string | { isTest?: unknown; [key: string]: unknown } | null | undefined;

export type SpecimenRow = { id: string; label: string; specimen: SpecimenValue };

export type SpecimenLaneLine = { lane: string; count: number };

const ASSAY_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const ASSAY_HUES = ["champagne", "ivory", "graphite"] as const;

function specimenRecord(raw: SpecimenValue): { isTest?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function specimenBlocked(raw: SpecimenValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function specimenGiven(raw: SpecimenValue): string {
  const row = specimenRecord(raw);
  if (row && !("isTest" in row)) return "";
  const value = row ? row.isTest : raw;
  if (value === true || value === "true") return "TEST";
  if (value === false || value === "false") return "LIVE BOOK";
  return clip(value, 48);
}

function specimenReadable(raw: SpecimenValue): boolean {
  if (specimenBlocked(raw)) return false;
  const row = specimenRecord(raw);
  if (row && !("isTest" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function specimenState(raw: SpecimenValue): SpecimenState {
  if (!specimenReadable(raw)) return "";
  return specimenGiven(raw) ? "set" : "clear";
}

/** A house isTest is Istanbul, London, Berlin, Moscow, or Cairo. A fort contains a hyphen. A harbor has a space. A digit contains a number. A spark is four characters or fewer. A scroll is twelve characters or longer. */
export function specimenLane(raw: SpecimenValue): SpecimenLane {
  if (specimenState(raw) !== "set") return "";
  const text = specimenGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 4) return "spark";
  if (text.length >= 12) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function specimenHue(raw: SpecimenValue): SpecimenHue {
  const lane = specimenLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function specimenHouse(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "house";
}

export function specimenFort(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "fort";
}

export function specimenHarbor(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "harbor";
}

export function specimenDigitLane(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "digit";
}

export function specimenSpark(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "spark";
}

export function specimenScroll(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "scroll";
}

export function specimenVowelLane(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "vowel";
}

export function specimenPost(raw: SpecimenValue): boolean {
  return specimenLane(raw) === "post";
}

export function specimenOpen(raw: SpecimenValue): boolean {
  return specimenState(raw) === "clear";
}

/** A isTest the desk can keep without a rewrite: a scroll or a house isTest. */
export function specimenHeld(raw: SpecimenValue): boolean {
  const lane = specimenLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a isTest of two characters or fewer that is not a house, still wants a fuller name. */
export function specimenSoon(raw: SpecimenValue): boolean {
  if (specimenState(raw) !== "set") return false;
  if (specimenSpark(raw)) return true;
  if (specimenHouse(raw)) return false;
  const length = specimenGiven(raw).length;
  return length > 0 && length <= 2;
}

export function specimenLength(raw: SpecimenValue): number | null {
  if (specimenState(raw) !== "set") return null;
  return specimenGiven(raw).length;
}

export function specimenEven(raw: SpecimenValue): boolean {
  const length = specimenLength(raw);
  return length !== null && length % 2 === 0;
}

export function specimenOdd(raw: SpecimenValue): boolean {
  const length = specimenLength(raw);
  return length !== null && length % 2 === 1;
}

export function specimenFirst(raw: SpecimenValue): boolean {
  return /^[A-Za-z]/.test(specimenGiven(raw));
}

export function specimenTail(raw: SpecimenValue): boolean {
  return /[0-9]$/.test(specimenGiven(raw));
}

export function specimenCapital(raw: SpecimenValue): boolean {
  return /[A-Z]/.test(specimenGiven(raw));
}

export function specimenSpace(raw: SpecimenValue): boolean {
  return specimenGiven(raw).includes(" ");
}

export function specimenVowel(raw: SpecimenValue): boolean {
  return /^[aeiou]/i.test(specimenGiven(raw));
}

export function specimenDigit(raw: SpecimenValue): boolean {
  return /[0-9]/.test(specimenGiven(raw));
}

export function specimenLetter(raw: SpecimenValue): boolean {
  return /[A-Za-z]/.test(specimenGiven(raw));
}

export function specimenMixed(raw: SpecimenValue): boolean {
  return specimenDigit(raw) && specimenLetter(raw);
}

export function specimenLower(raw: SpecimenValue): boolean {
  const text = specimenGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function specimenUpper(raw: SpecimenValue): boolean {
  const text = specimenGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function specimenHyphen(raw: SpecimenValue): boolean {
  return specimenGiven(raw).includes("-");
}

export function specimenPeriod(raw: SpecimenValue): boolean {
  return specimenGiven(raw).includes(".");
}

export function specimenStamp(raw: SpecimenValue): string {
  const text = specimenGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function specimenCopy(raw: SpecimenValue): string {
  return specimenGiven(raw);
}

export function specimenFamily(raw: SpecimenValue): string {
  if (specimenState(raw) !== "set") return "";
  return firstToken(specimenGiven(raw));
}

export function specimenLanes(rows: readonly SpecimenRow[]): SpecimenLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of ASSAY_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = specimenLane(row.specimen);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return ASSAY_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSpecimen(rows: readonly SpecimenRow[]): string {
  const lines = specimenLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || ASSAY_LANES.indexOf(a.lane as (typeof ASSAY_LANES)[number]) - ASSAY_LANES.indexOf(b.lane as (typeof ASSAY_LANES)[number]))[0].lane;
}

export function leadingSpecimenHue(rows: readonly SpecimenRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of ASSAY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = specimenHue(row.specimen);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = ASSAY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || ASSAY_HUES.indexOf(a.hue) - ASSAY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSpecimenCount(rows: readonly SpecimenRow[], lane: SpecimenLane): number {
  return rows.filter((row) => specimenLane(row.specimen) === lane).length;
}

export function specimenShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSpecimenLanes(rows: readonly SpecimenRow[]): string[] {
  return specimenLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenSpecimens(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSpecimens(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSpecimen(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSpecimenReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSpecimenReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSpecimenLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: SpecimenRow, shape: SpecimenShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return specimenHouse(row.specimen);
  if (shape === "fort") return specimenFort(row.specimen);
  if (shape === "harbor") return specimenHarbor(row.specimen);
  if (shape === "digit") return specimenDigitLane(row.specimen);
  if (shape === "spark") return specimenSpark(row.specimen);
  if (shape === "scroll") return specimenScroll(row.specimen);
  if (shape === "vowel") return specimenVowelLane(row.specimen);
  if (shape === "post") return specimenPost(row.specimen);
  if (shape === "open") return specimenOpen(row.specimen);
  if (shape === "soon") return specimenSoon(row.specimen);
  if (shape === "letter") return specimenLetter(row.specimen);
  if (shape === "mixed") return specimenMixed(row.specimen);
  if (shape === "upper") return specimenUpper(row.specimen);
  if (shape === "lower") return specimenLower(row.specimen);
  if (shape === "space") return specimenSpace(row.specimen);
  if (shape === "even") return specimenEven(row.specimen);
  if (shape === "odd") return specimenOdd(row.specimen);
  if (shape === "tail") return specimenTail(row.specimen);
  if (shape === "first") return specimenFirst(row.specimen);
  if (shape === "held") return specimenHeld(row.specimen);
  if (shape === "hyphen") return specimenHyphen(row.specimen);
  if (shape === "period") return specimenPeriod(row.specimen);
  return specimenLane(row.specimen) === shape;
}

export function visibleSpecimens(
  rows: readonly SpecimenRow[],
  lane: string,
  hue: string,
  query: string,
  review: SpecimenReview,
  reviewed: readonly string[],
  shape: SpecimenShape,
): SpecimenRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (specimenState(row.specimen) === "") return false;
    const found = specimenLane(row.specimen);
    const hueName = specimenHue(row.specimen);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${specimenGiven(row.specimen)} ${specimenStamp(row.specimen)} ${specimenFamily(row.specimen)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function specimenLanesCsv(rows: readonly SpecimenRow[]): string {
  const lines = ["lane,count"];
  for (const line of specimenLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function specimenRowsCsv(rows: readonly SpecimenRow[], reviewed: readonly string[]): string {
  const lines = ["name,isTest,stamp,family,lane,hue,length,house,fort,harbor,spark,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(specimenGiven(row.specimen)),
        specimenStamp(row.specimen),
        csvCell(specimenFamily(row.specimen)),
        specimenLane(row.specimen),
        specimenHue(row.specimen),
        specimenLength(row.specimen) ?? "",
        specimenHouse(row.specimen) ? "1" : "0",
        specimenFort(row.specimen) ? "1" : "0",
        specimenHarbor(row.specimen) ? "1" : "0",
        specimenSpark(row.specimen) ? "1" : "0",
        specimenEven(row.specimen) ? "1" : "0",
        specimenDigit(row.specimen) ? "1" : "0",
        specimenMixed(row.specimen) ? "1" : "0",
        specimenUpper(row.specimen) ? "1" : "0",
        specimenVowel(row.specimen) ? "1" : "0",
        specimenTail(row.specimen) ? "1" : "0",
        specimenHeld(row.specimen) ? "1" : "0",
        specimenSoon(row.specimen) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
