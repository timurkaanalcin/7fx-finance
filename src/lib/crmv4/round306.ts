/**
 * Armillary rules for a compass ring kept in this browser, and pelorus plates read the invalid mark already stored on the account.
 * Watches are east, south, west, and north. Cloth is silk, wool, and gilt.
 * Reaches are 8, 16, 32, or 64. Pins are 2, 4, or 8.
 * A house mark is INVALID, DUPLICATE, SPAM, or STALE. A fort contains a hyphen. A harbor has a space.
 * A spark is four characters or fewer. A scroll is twelve characters or longer. A digit contains a number.
 * A true invalid mark reads as INVALID. A false invalid mark reads as OPEN LEAD.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_armillary (
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
 * CREATE TABLE crm_pelorus_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_pelorus_review (
 *   trader_id text primary key
 * );
 */

export const ARM_KEY = "crmv4-armillary";
export const ARM_VIEW_KEY = "crmv4-armillary-views";
export const ARM_DENSITY_KEY = "crmv4-armillary-density";
export const ARM_QUARTERS = ["east", "south", "west", "north"] as const;

export type ArmillaryQuarter = (typeof ARM_QUARTERS)[number];

export type ArmillaryFinish = "blank" | "silk" | "wool" | "gilt";

export type ArmillaryTray = "ring" | "case" | "chest";

export type ArmillaryDensity = "broad" | "tight";

export type ArmillarySort = "quarter" | "sighter";

export type Armillary = {
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

export type ArmillaryView = {
  id: string;
  name: string;
  tray: ArmillaryTray;
  query: string;
  sighter: string;
  finish: string;
  quarter: string;
  span: string;
  pin: string;
};

export type ArmillaryCounts = {
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

export const ROUND306_FEATURES = [
  "save",
  "note",
  "trays",
  "cloth",
  "reach",
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
  "fair-ring",
  "viewer",
  "suggest",
  "sla",
  "pelorus",
  "pelorus-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "pin", "span", "lower", "star"] as const;

const FINISHES = ["silk", "wool", "gilt"] as const;

const SPAN_CYCLE = [8, 16, 32, 64] as const;

const PIN_CYCLE = [2, 4, 8] as const;

const INNER = new Set(["east", "south"]);

const OUTER = new Set(["west", "north"]);

const HOUSE_WEAVE = new Set(["SILK", "GILT"]);

const HOUSE_STATUSES = new Set(["INVALID", "DUPLICATE", "SPAM", "STALE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ArmillaryTray {
  return raw === "case" || raw === "chest" ? raw : "ring";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<ArmillaryFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<ArmillaryFinish, "blank">) : "";
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

function inTray(card: Armillary, tray: ArmillaryTray): boolean {
  if (tray === "case") return card.locked && !card.held;
  if (tray === "chest") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function quarterIndex(quarter: string): number {
  return ARM_QUARTERS.indexOf(quarter as ArmillaryQuarter);
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

export function armillaryQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ARM_QUARTERS as readonly string[]).includes(text) ? text : "";
}

/** A reach is 8, 16, 32, or 64. Anything else stays blank. */
export function armillarySpan(raw: unknown): 8 | 16 | 32 | 64 | null {
  const text = wholeToken(raw);
  if (text !== "8" && text !== "16" && text !== "32" && text !== "64") return null;
  return Number(text) as 8 | 16 | 32 | 64;
}

/** A pin is 2, 4, or 8. Anything else stays blank. */
export function armillaryPin(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** Cloth is silk, wool, or gilt. The saved name is the upper token. */
export function armillaryCloth(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function armillaryInner(quarter: unknown): boolean {
  return INNER.has(clip(quarter, 12).toLowerCase());
}

export function armillaryOuter(quarter: unknown): boolean {
  return OUTER.has(clip(quarter, 12).toLowerCase());
}

/** East is the limb. South is the equator. West is the colure. North is the pole. */
export function armillaryBand(quarter: unknown): string {
  const text = armillaryQuarter(quarter);
  if (!text) return "";
  if (text === "east") return "limb";
  if (text === "south") return "equator";
  if (text === "west") return "colure";
  return "pole";
}

/** Signed distance from one watch to another along the armillary. */
export function armillaryGap(from: unknown, to: unknown): number | null {
  const left = quarterIndex(armillaryQuarter(from));
  const right = quarterIndex(armillaryQuarter(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_WEAVE.has(armillaryCloth(finish));
}

/** A pair pin is 4. Two and eight are not a pair. */
export function pairPin(pin: unknown): boolean {
  return armillaryPin(pin) === 4;
}

/** A full pin is 8. */
export function fullPin(pin: unknown): boolean {
  return armillaryPin(pin) === 8;
}

export function activeQuarter(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return armillaryQuarter(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const span = armillarySpan(raw);
  return span === null ? "all" : String(span);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = armillaryCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePin(raw: unknown): string {
  const pin = armillaryPin(raw);
  return pin === null ? "all" : String(pin);
}

export function moveArmillaryFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The finish the court uses least. A tie keeps bone, then brass, then ebony. */
export function suggestFinish(cards: readonly Armillary[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "ring") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "GILT";
  let score = Number.POSITIVE_INFINITY;
  for (const finish of ["GILT", "SILK", "WOOL"]) {
    const count = counts.get(finish) || 0;
    if (count < score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before seven, suggest eight. Late morning asks for sixteen. Afternoon asks for thirty-two. Evening asks for sixty-four. A saved span on the ring wins, and a tie keeps the taller span. */
export function suggestSpan(cards: readonly Armillary[], hour: number): 8 | 16 | 32 | 64 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "ring") || card.span === null) continue;
    seen = true;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  if (seen) {
    let best: 8 | 16 | 32 | 64 = 64;
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
  if (hour < 7) return 8;
  if (hour < 12) return 16;
  if (hour < 16) return 32;
  return 64;
}

/** Before nine, suggest the east. The rest of the day suggests the north. */
export function suggestQuarter(hour: number): ArmillaryQuarter {
  return hour < 9 ? "east" : "north";
}

/** The sighter with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairSighter(cards: readonly Armillary[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "ring") && !card.laid);
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

export function readArmillaryRules(raw: unknown): Armillary[] {
  if (!Array.isArray(raw)) return [];
  const out: Armillary[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Armillary>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      sighter: clip(row.sighter, 24),
      quarter: armillaryQuarter(row.quarter),
      span: armillarySpan(row.span),
      finish: armillaryCloth(row.finish),
      pin: armillaryPin(row.pin) ?? 2,
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

export function addArmillary(
  cards: readonly Armillary[],
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
): Armillary[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readArmillaryRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      sighter: clip(card.sighter, 24),
      quarter: armillaryQuarter(card.quarter),
      span: armillarySpan(card.span),
      finish: armillaryCloth(card.finish),
      pin: armillaryPin(card.pin) ?? 2,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Armillary[], id: string, edit: (card: Armillary) => Armillary): Armillary[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editArmillary(cards: readonly Armillary[], id: string, title: string): Armillary[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editArmillaryNote(cards: readonly Armillary[], id: string, note: string): Armillary[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "SILK", "WOOL", "GILT"];
  const index = order.indexOf(armillaryCloth(finish));
  return order[(index + 1) % order.length] || "SILK";
}

export function setArmillaryCloth(cards: readonly Armillary[], id: string, finish: string): Armillary[] {
  const next = armillaryCloth(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setArmillarySighted(cards: readonly Armillary[], id: string, laid: boolean): Armillary[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setArmillarySleeve(cards: readonly Armillary[], id: string, locked: boolean): Armillary[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sheath" : "resume" }));
}

export function setArmillaryVault(cards: readonly Armillary[], id: string, held: boolean): Armillary[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "crypt" : "open" }));
}

export function setArmillaryStar(cards: readonly Armillary[], id: string, starred: boolean): Armillary[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addArmillaryTag(cards: readonly Armillary[], id: string, tag: string): Armillary[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(span: number | null, dir: 1 | -1): 8 | 16 | 32 | 64 {
  if (span === null) return dir > 0 ? 8 : 64;
  const index = spanIndex(span);
  const next = index < 0 ? 0 : (index + dir + SPAN_CYCLE.length) % SPAN_CYCLE.length;
  return SPAN_CYCLE[next];
}

function stepPin(pin: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = pinIndex(pin);
  const next = index < 0 ? 0 : (index + dir + PIN_CYCLE.length) % PIN_CYCLE.length;
  return PIN_CYCLE[next];
}

export function liftSpan(cards: readonly Armillary[], id: string): Armillary[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, 1), audit: "span" }));
}

export function lowerSpan(cards: readonly Armillary[], id: string): Armillary[] {
  return mapCard(cards, id, (card) => ({ ...card, span: stepSpan(card.span, -1), audit: "lower" }));
}

export function raisePin(cards: readonly Armillary[], id: string): Armillary[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, 1), audit: "pin" }));
}

export function lowerPin(cards: readonly Armillary[], id: string): Armillary[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, -1), audit: "pin" }));
}

export function setArmillaryFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveArmillaryFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return setArmillarySleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starArmillaryFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return setArmillaryStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagArmillaryFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return addArmillaryTag(cards, id, "a");
}

export function finishFocused(cards: readonly Armillary[], id: string): Armillary[] {
  const card = cards.find((item) => item.id === id);
  return card ? setArmillaryCloth(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftSpanFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return liftSpan(cards, id);
}

export function lowerSpanFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return lowerSpan(cards, id);
}

export function raisePinFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return raisePin(cards, id);
}

export function lowerPinFocused(cards: readonly Armillary[], id: string): Armillary[] {
  return lowerPin(cards, id);
}

function bulk(cards: readonly Armillary[], ids: readonly string[], edit: (card: Armillary) => Armillary): Armillary[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkArmillaryBone(cards: readonly Armillary[], ids: readonly string[]): Armillary[] {
  return bulk(cards, ids, (card) => (card.finish === "GILT" ? card : { ...card, finish: "GILT", audit: "finish" }));
}

export function bulkArmillarySighted(cards: readonly Armillary[], ids: readonly string[]): Armillary[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkArmillaryVault(cards: readonly Armillary[], ids: readonly string[]): Armillary[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "crypt" }));
}

export function bulkArmillaryTag(cards: readonly Armillary[], ids: readonly string[]): Armillary[] {
  return bulk(cards, ids, (card) => (card.tags.includes("w") ? card : { ...card, tags: tagsOf([...card.tags, "w"]), audit: "tag" }));
}

export function readArmillaryViews(raw: unknown): ArmillaryView[] {
  if (!Array.isArray(raw)) return [];
  const out: ArmillaryView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArmillaryView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      sighter: clip(row.sighter, 24),
      finish: activeFinish(row.finish, ["SILK", "WOOL", "GILT"]),
      quarter: activeQuarter(row.quarter),
      span: activeSpan(row.span),
      pin: activePin(row.pin),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addArmillaryView(views: readonly ArmillaryView[], view: ArmillaryView): ArmillaryView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readArmillaryViews([...views, { ...view, id, name }]);
}

export function dropArmillaryView(views: readonly ArmillaryView[], id: string): ArmillaryView[] {
  return views.filter((view) => view.id !== id);
}

export function armillaryDensity(raw: unknown): ArmillaryDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortArmillaryRules(cards: readonly Armillary[], sort: ArmillarySort): Armillary[] {
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

export function visibleArmillaryRules(
  cards: readonly Armillary[],
  tray: ArmillaryTray,
  query: string,
  sighter: string,
  finish: string,
  quarter: string,
  span: string,
  pin: string,
): Armillary[] {
  const text = query.trim().toLowerCase();
  const wantSighter = clip(sighter, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : armillaryCloth(finish);
  const wantQuarter = activeQuarter(quarter);
  const wantSpan = activeSpan(span);
  const wantPin = activePin(pin);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.sighter}`.toLowerCase().includes(text)) return false;
    if (wantSighter && card.sighter.toLowerCase() !== wantSighter) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantQuarter === "inner" && !armillaryInner(card.quarter)) return false;
    if (wantQuarter === "outer" && !armillaryOuter(card.quarter)) return false;
    if (wantQuarter !== "all" && wantQuarter !== "inner" && wantQuarter !== "outer" && card.quarter !== wantQuarter) return false;
    if (wantSpan !== "all" && String(card.span ?? "") !== wantSpan) return false;
    if (wantPin !== "all" && String(card.pin) !== wantPin) return false;
    return true;
  });
}

/** An outer quarter on pin two, still unmarked and not in the chest, is overdue. */
export function overdueArmillary(card: Armillary): boolean {
  return armillaryOuter(card.quarter) && card.pin === 2 && !card.laid && !card.held;
}

/** No finish, the short span, pin two, and still on the ring. */
export function idleArmillary(card: Armillary): boolean {
  return !card.finish && card.span === 8 && card.pin === 2 && !card.laid && !card.locked && !card.held;
}

/** Gilt, a tall span, and a full pin, still out of the chest. */
export function briskArmillary(card: Armillary): boolean {
  return card.finish === "GILT" && card.span === 64 && card.pin === 8 && !card.held;
}

/** North, silk, and a middle reach. */
export function restingArmillary(card: Armillary): boolean {
  return card.quarter === "north" && card.finish === "SILK" && card.span === 16;
}

/** An east ring is late when the desk is already on the north. */
export function lateArmillary(card: Armillary, desk: string): boolean {
  return card.quarter === "east" && armillaryQuarter(desk) === "north" && !card.laid;
}

export function armillaryCounts(cards: readonly Armillary[], shown: readonly Armillary[], desk: string): ArmillaryCounts {
  return {
    court: cards.filter((card) => inTray(card, "ring")).length,
    sleeve: cards.filter((card) => inTray(card, "case")).length,
    vault: cards.filter((card) => inTray(card, "chest")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => armillaryInner(card.quarter)).length,
    outer: cards.filter((card) => armillaryOuter(card.quarter)).length,
    wide: cards.filter((card) => card.span === 64).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    span: cards.reduce((sum, card) => sum + (card.span || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleArmillary).length,
    brisk: cards.filter(briskArmillary).length,
    resting: cards.filter(restingArmillary).length,
    overdue: cards.filter(overdueArmillary).length,
    pair: cards.filter((card) => pairPin(card.pin) && lateArmillary(card, desk)).length,
  };
}

export function armillaryBars(cards: readonly Armillary[]): { quarter: string; count: number }[] {
  return ARM_QUARTERS.map((quarter) => ({ quarter, count: cards.filter((card) => card.quarter === quarter && !card.held).length }));
}

export function armillaryTimeline(cards: readonly Armillary[]): { span: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "ring"));
  return SPAN_CYCLE.map((span) => ({ span, titles: open.filter((card) => card.span === span).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function armillarySighters(cards: readonly Armillary[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.sighter && !out.some((name) => name.toLowerCase() === card.sighter.toLowerCase())) out.push(card.sighter);
  }
  return out;
}

export function busiestSighter(cards: readonly Armillary[]): string {
  const open = cards.filter((card) => inTray(card, "ring") && !card.laid && card.sighter);
  let best = "";
  let score = 0;
  for (const name of armillarySighters(open)) {
    const count = open.filter((card) => card.sighter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderArmillaryRules(cards: readonly Armillary[]): string[] {
  return cards.filter(overdueArmillary).map((card) => card.title);
}

export function armillaryCopy(card: Armillary): string {
  return [card.title, card.sighter, card.quarter, card.finish, card.span ?? "", card.pin, card.note].filter((item) => item !== "").join(" · ");
}

export function armillaryCsv(cards: readonly Armillary[], desk: string): string {
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
        armillaryOuter(card.quarter) ? "1" : "0",
        lateArmillary(card, desk) ? "1" : "0",
        idleArmillary(card) ? "1" : "0",
        briskArmillary(card) ? "1" : "0",
        restingArmillary(card) ? "1" : "0",
        overdueArmillary(card) ? "1" : "0",
        armillaryInner(card.quarter) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        armillaryBand(card.quarter),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const PEL_KEY = "crmv4-pelorus-hide";
export const PEL_REVIEW_KEY = "crmv4-pelorus-review";

export type PelorusLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type PelorusHue = "" | "ivory" | "graphite" | "champagne";

export type PelorusState = "" | "clear" | "set";

export type PelorusReview = "all" | "reviewed" | "fresh";

export type PelorusShape =
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

export type PelorusValue = string | { leadInvalid?: unknown; [key: string]: unknown } | null | undefined;

export type PelorusRow = { id: string; label: string; pelorus: PelorusValue };

export type PelorusLaneLine = { lane: string; count: number };

const PELORUS_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const PELORUS_HUES = ["champagne", "ivory", "graphite"] as const;

function pelorusRecord(raw: PelorusValue): { leadInvalid?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function pelorusBlocked(raw: PelorusValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function pelorusGiven(raw: PelorusValue): string {
  const row = pelorusRecord(raw);
  if (row && !("leadInvalid" in row)) return "";
  const value = row ? row.leadInvalid : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "INVALID";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN LEAD";
  return clip(value, 48);
}

function pelorusReadable(raw: PelorusValue): boolean {
  if (pelorusBlocked(raw)) return false;
  const row = pelorusRecord(raw);
  if (row && !("leadInvalid" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function pelorusState(raw: PelorusValue): PelorusState {
  if (!pelorusReadable(raw)) return "";
  return pelorusGiven(raw) ? "set" : "clear";
}

/** A house mark is INVALID, DUPLICATE, SPAM, or STALE. A fort contains a hyphen. A harbor has a space. A digit contains a number. A spark is four characters or fewer. A scroll is twelve characters or longer. */
export function pelorusLane(raw: PelorusValue): PelorusLane {
  if (pelorusState(raw) !== "set") return "";
  const text = pelorusGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 4) return "spark";
  if (text.length >= 12) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function pelorusHue(raw: PelorusValue): PelorusHue {
  const lane = pelorusLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function pelorusHouse(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "house";
}

export function pelorusFort(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "fort";
}

export function pelorusHarbor(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "harbor";
}

export function pelorusDigitLane(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "digit";
}

export function pelorusSpark(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "spark";
}

export function pelorusScroll(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "scroll";
}

export function pelorusVowelLane(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "vowel";
}

export function pelorusPost(raw: PelorusValue): boolean {
  return pelorusLane(raw) === "post";
}

export function pelorusOpen(raw: PelorusValue): boolean {
  return pelorusState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function pelorusHeld(raw: PelorusValue): boolean {
  const lane = pelorusLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function pelorusSoon(raw: PelorusValue): boolean {
  if (pelorusState(raw) !== "set") return false;
  if (pelorusSpark(raw)) return true;
  if (pelorusHouse(raw)) return false;
  const length = pelorusGiven(raw).length;
  return length > 0 && length <= 2;
}

export function pelorusLength(raw: PelorusValue): number | null {
  if (pelorusState(raw) !== "set") return null;
  return pelorusGiven(raw).length;
}

export function pelorusEven(raw: PelorusValue): boolean {
  const length = pelorusLength(raw);
  return length !== null && length % 2 === 0;
}

export function pelorusOdd(raw: PelorusValue): boolean {
  const length = pelorusLength(raw);
  return length !== null && length % 2 === 1;
}

export function pelorusFirst(raw: PelorusValue): boolean {
  return /^[A-Za-z]/.test(pelorusGiven(raw));
}

export function pelorusTail(raw: PelorusValue): boolean {
  return /[0-9]$/.test(pelorusGiven(raw));
}

export function pelorusCapital(raw: PelorusValue): boolean {
  return /[A-Z]/.test(pelorusGiven(raw));
}

export function pelorusSpace(raw: PelorusValue): boolean {
  return pelorusGiven(raw).includes(" ");
}

export function pelorusVowel(raw: PelorusValue): boolean {
  return /^[aeiou]/i.test(pelorusGiven(raw));
}

export function pelorusDigit(raw: PelorusValue): boolean {
  return /[0-9]/.test(pelorusGiven(raw));
}

export function pelorusLetter(raw: PelorusValue): boolean {
  return /[A-Za-z]/.test(pelorusGiven(raw));
}

export function pelorusMixed(raw: PelorusValue): boolean {
  return pelorusDigit(raw) && pelorusLetter(raw);
}

export function pelorusLower(raw: PelorusValue): boolean {
  const text = pelorusGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function pelorusUpper(raw: PelorusValue): boolean {
  const text = pelorusGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function pelorusHyphen(raw: PelorusValue): boolean {
  return pelorusGiven(raw).includes("-");
}

export function pelorusPeriod(raw: PelorusValue): boolean {
  return pelorusGiven(raw).includes(".");
}

export function pelorusStamp(raw: PelorusValue): string {
  const text = pelorusGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function pelorusCopy(raw: PelorusValue): string {
  return pelorusGiven(raw);
}

export function pelorusFamily(raw: PelorusValue): string {
  if (pelorusState(raw) !== "set") return "";
  return firstToken(pelorusGiven(raw));
}

export function pelorusLanes(rows: readonly PelorusRow[]): PelorusLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of PELORUS_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = pelorusLane(row.pelorus);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return PELORUS_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPelorus(rows: readonly PelorusRow[]): string {
  const lines = pelorusLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || PELORUS_LANES.indexOf(a.lane as (typeof PELORUS_LANES)[number]) - PELORUS_LANES.indexOf(b.lane as (typeof PELORUS_LANES)[number]))[0].lane;
}

export function leadingPelorusHue(rows: readonly PelorusRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of PELORUS_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = pelorusHue(row.pelorus);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = PELORUS_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || PELORUS_HUES.indexOf(a.hue) - PELORUS_HUES.indexOf(b.hue))[0].hue;
}

export function lanePelorusCount(rows: readonly PelorusRow[], lane: PelorusLane): number {
  return rows.filter((row) => pelorusLane(row.pelorus) === lane).length;
}

export function pelorusShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPelorusLanes(rows: readonly PelorusRow[]): string[] {
  return pelorusLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenPeloruss(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPeloruss(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePelorus(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePelorusReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPelorusReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePelorusLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: PelorusRow, shape: PelorusShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return pelorusHouse(row.pelorus);
  if (shape === "fort") return pelorusFort(row.pelorus);
  if (shape === "harbor") return pelorusHarbor(row.pelorus);
  if (shape === "digit") return pelorusDigitLane(row.pelorus);
  if (shape === "spark") return pelorusSpark(row.pelorus);
  if (shape === "scroll") return pelorusScroll(row.pelorus);
  if (shape === "vowel") return pelorusVowelLane(row.pelorus);
  if (shape === "post") return pelorusPost(row.pelorus);
  if (shape === "open") return pelorusOpen(row.pelorus);
  if (shape === "soon") return pelorusSoon(row.pelorus);
  if (shape === "letter") return pelorusLetter(row.pelorus);
  if (shape === "mixed") return pelorusMixed(row.pelorus);
  if (shape === "upper") return pelorusUpper(row.pelorus);
  if (shape === "lower") return pelorusLower(row.pelorus);
  if (shape === "space") return pelorusSpace(row.pelorus);
  if (shape === "even") return pelorusEven(row.pelorus);
  if (shape === "odd") return pelorusOdd(row.pelorus);
  if (shape === "tail") return pelorusTail(row.pelorus);
  if (shape === "first") return pelorusFirst(row.pelorus);
  if (shape === "held") return pelorusHeld(row.pelorus);
  if (shape === "hyphen") return pelorusHyphen(row.pelorus);
  if (shape === "period") return pelorusPeriod(row.pelorus);
  return pelorusLane(row.pelorus) === shape;
}

export function visiblePeloruss(
  rows: readonly PelorusRow[],
  lane: string,
  hue: string,
  query: string,
  review: PelorusReview,
  reviewed: readonly string[],
  shape: PelorusShape,
): PelorusRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (pelorusState(row.pelorus) === "") return false;
    const found = pelorusLane(row.pelorus);
    const hueName = pelorusHue(row.pelorus);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${pelorusGiven(row.pelorus)} ${pelorusStamp(row.pelorus)} ${pelorusFamily(row.pelorus)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function pelorusLanesCsv(rows: readonly PelorusRow[]): string {
  const lines = ["lane,count"];
  for (const line of pelorusLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function pelorusRowsCsv(rows: readonly PelorusRow[], reviewed: readonly string[]): string {
  const lines = ["name,leadInvalid,stamp,family,lane,hue,length,house,fort,harbor,spark,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(pelorusGiven(row.pelorus)),
        pelorusStamp(row.pelorus),
        csvCell(pelorusFamily(row.pelorus)),
        pelorusLane(row.pelorus),
        pelorusHue(row.pelorus),
        pelorusLength(row.pelorus) ?? "",
        pelorusHouse(row.pelorus) ? "1" : "0",
        pelorusFort(row.pelorus) ? "1" : "0",
        pelorusHarbor(row.pelorus) ? "1" : "0",
        pelorusSpark(row.pelorus) ? "1" : "0",
        pelorusEven(row.pelorus) ? "1" : "0",
        pelorusDigit(row.pelorus) ? "1" : "0",
        pelorusMixed(row.pelorus) ? "1" : "0",
        pelorusUpper(row.pelorus) ? "1" : "0",
        pelorusVowel(row.pelorus) ? "1" : "0",
        pelorusTail(row.pelorus) ? "1" : "0",
        pelorusHeld(row.pelorus) ? "1" : "0",
        pelorusSoon(row.pelorus) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
