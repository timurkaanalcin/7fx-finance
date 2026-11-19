/**
 * Deadbeat rules for a Graham escapement kept in this browser, and diptych plates read the language already stored on the account.
 * Parts are anchor, fork, jewel, and wheel. Washes are gilt, ivory, and graphite.
 * Teeth are 5, 10, 15, or 20. Locks are 3, 6, or 12.
 * A known language is en, tr, de, ru, or ar. A slash contains a slash. A score contains an underscore.
 * A tile is exactly five characters. A scroll is twelve characters or longer. An index starts with a digit. A vowel starts with a vowel.
 * A true language reads as EN. A false language reads as NO TONGUE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_deadbeat (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   part text not null default '',
 *   tooth_no integer,
 *   wash text not null default '',
 *   lock_no integer not null default 3,
 *   tags text not null default '',
 *   banked boolean not null default false,
 *   latched boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_diptych_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_diptych_review (
 *   trader_id text primary key
 * );
 */

export const DBK_KEY = "crmv4-deadbeat";
export const DBK_VIEW_KEY = "crmv4-deadbeat-views";
export const DBK_DENSITY_KEY = "crmv4-deadbeat-density";
export const DBK_PARTS = ["anchor", "fork", "jewel", "wheel"] as const;

export type DeadbeatPart = (typeof DBK_PARTS)[number];
export type DeadbeatWash = "blank" | "gilt" | "ivory" | "graphite";
export type DeadbeatTray = "bench" | "latch" | "case";
export type DeadbeatDensity = "airy" | "close";
export type DeadbeatSort = "part" | "keeper";

export type Deadbeat = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  part: string;
  tooth: number | null;
  wash: string;
  lock: number;
  tags: string[];
  banked: boolean;
  latched: boolean;
  cased: boolean;
  starred: boolean;
  audit: string;
};

export type DeadbeatView = {
  id: string;
  name: string;
  tray: DeadbeatTray;
  query: string;
  keeper: string;
  wash: string;
  part: string;
  tooth: string;
  lock: string;
};

export type DeadbeatCounts = {
  bench: number;
  latch: number;
  case: number;
  banked: number;
  inner: number;
  outer: number;
  tall: number;
  quiet: number;
  tooth: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND326_FEATURES = [
  "deadbeat-save",
  "notice-center",
  "anchor-parts",
  "quick-search",
  "lock-sla",
  "case",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "keeper-sort",
  "desk-kpis",
  "tooth-chart",
  "tooth-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-keeper",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "language-diptych",
  "diptych-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wash", "bank", "free", "latch", "return", "case", "open", "tag", "lock", "tooth", "lower", "star"] as const;
const WASHES = ["gilt", "ivory", "graphite"] as const;
const TOOTH_CYCLE = [5, 10, 15, 20] as const;
const LOCK_CYCLE = [3, 6, 12] as const;
const INNER = new Set(["anchor", "fork"]);
const OUTER = new Set(["jewel", "wheel"]);
const QUIET_WASH = new Set(["IVORY", "GRAPHITE"]);
const TONGUES = new Set(["EN", "TR", "DE", "RU", "AR"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DeadbeatTray {
  return raw === "latch" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function washName(raw: unknown): Exclude<DeadbeatWash, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WASHES as readonly string[]).includes(text) ? (text as Exclude<DeadbeatWash, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[db]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Deadbeat, tray: DeadbeatTray): boolean {
  if (tray === "latch") return card.latched && !card.cased;
  if (tray === "case") return card.cased;
  return !card.latched && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return DBK_PARTS.indexOf(part as DeadbeatPart);
}

function toothIndex(tooth: number): number {
  return TOOTH_CYCLE.indexOf(tooth as (typeof TOOTH_CYCLE)[number]);
}

function lockIndex(lock: number): number {
  return LOCK_CYCLE.indexOf(lock as (typeof LOCK_CYCLE)[number]);
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

export function deadbeatPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DBK_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A tooth is 5, 10, 15, or 20. Anything else stays blank. */
export function deadbeatTooth(raw: unknown): 5 | 10 | 15 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15" && text !== "20") return null;
  return Number(text) as 5 | 10 | 15 | 20;
}

/** A lock is 3, 6, or 12. Anything else stays blank. */
export function deadbeatLock(raw: unknown): 3 | 6 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12") return null;
  return Number(text) as 3 | 6 | 12;
}

/** A wash is gilt, ivory, or graphite. The saved name is the upper token. */
export function deadbeatWash(raw: unknown): string {
  const text = washName(raw);
  return text ? text.toUpperCase() : "";
}

export function deadbeatInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function deadbeatOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Anchor is the hook. Fork is the tine. Jewel is the stone. Wheel is the rim. */
export function deadbeatBand(part: unknown): string {
  const text = deadbeatPart(part);
  if (!text) return "";
  if (text === "anchor") return "hook";
  if (text === "fork") return "tine";
  if (text === "jewel") return "stone";
  return "rim";
}

/** Signed distance from one part to another along the deadbeat. */
export function deadbeatGap(from: unknown, to: unknown): number | null {
  const left = partIndex(deadbeatPart(from));
  const right = partIndex(deadbeatPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietWash(wash: unknown): boolean {
  return QUIET_WASH.has(deadbeatWash(wash));
}

/** A pair lock is 6. Three and twelve are not a pair. */
export function pairLock(lock: unknown): boolean {
  return deadbeatLock(lock) === 6;
}

/** A full lock is 12. */
export function fullLock(lock: unknown): boolean {
  return deadbeatLock(lock) === 12;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return deadbeatPart(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = deadbeatTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeWash(raw: unknown, allow: readonly string[]): string {
  const text = deadbeatWash(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLock(raw: unknown): string {
  const lock = deadbeatLock(raw);
  return lock === null ? "all" : String(lock);
}

export function moveDeadbeatFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wash the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestWash(cards: readonly Deadbeat[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.wash) continue;
    counts.set(card.wash, (counts.get(card.wash) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const wash of ["IVORY", "GILT", "GRAPHITE"]) {
    const count = counts.get(wash) || 0;
    if (count < score) {
      best = wash;
      score = count;
    }
  }
  return best;
}

/** Night asks for five teeth. Morning asks for ten. Afternoon asks for fifteen. Evening asks for twenty. A saved tooth on the bench wins, and a tie keeps the shorter tooth. */
export function suggestTooth(cards: readonly Deadbeat[], hour: number): 5 | 10 | 15 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 15 | 20 = 5;
    let score = Number.POSITIVE_INFINITY;
    for (const tooth of TOOTH_CYCLE) {
      const count = counts.get(tooth) || 0;
      if (count < score) {
        best = tooth;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 5;
  if (hour < 12) return 10;
  if (hour < 18) return 15;
  return 20;
}

/** Before eight, suggest the anchor. The rest of the day suggests the wheel. */
export function suggestPart(hour: number): DeadbeatPart {
  return hour < 8 ? "anchor" : "wheel";
}

/** The keeper with the fewest unbanked cards on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Deadbeat[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.banked);
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

export function readDeadbeatRules(raw: unknown): Deadbeat[] {
  if (!Array.isArray(raw)) return [];
  const out: Deadbeat[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Deadbeat>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      part: deadbeatPart(row.part),
      tooth: deadbeatTooth(row.tooth),
      wash: deadbeatWash(row.wash),
      lock: deadbeatLock(row.lock) ?? 3,
      tags: tagsOf(row.tags),
      banked: row.banked === true,
      latched: row.latched === true,
      cased: row.cased === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addDeadbeat(
  cards: readonly Deadbeat[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    part?: string;
    tooth?: unknown;
    wash?: string;
    lock?: unknown;
    tags?: unknown;
  },
): Deadbeat[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `d${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readDeadbeatRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      part: deadbeatPart(card.part),
      tooth: deadbeatTooth(card.tooth),
      wash: deadbeatWash(card.wash),
      lock: deadbeatLock(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      banked: false,
      latched: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Deadbeat[], id: string, edit: (card: Deadbeat) => Deadbeat): Deadbeat[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editDeadbeat(cards: readonly Deadbeat[], id: string, title: string): Deadbeat[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editDeadbeatNote(cards: readonly Deadbeat[], id: string, note: string): Deadbeat[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWash(wash: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(deadbeatWash(wash));
  return order[(index + 1) % order.length] || "GILT";
}

export function setDeadbeatWash(cards: readonly Deadbeat[], id: string, wash: string): Deadbeat[] {
  const next = deadbeatWash(wash);
  return mapCard(cards, id, (card) => (card.wash === next ? card : { ...card, wash: next, audit: "wash" }));
}

export function setDeadbeatBank(cards: readonly Deadbeat[], id: string, banked: boolean): Deadbeat[] {
  return mapCard(cards, id, (card) => (card.banked === banked ? card : { ...card, banked, audit: banked ? "bank" : "free" }));
}

export function setDeadbeatLatch(cards: readonly Deadbeat[], id: string, latched: boolean): Deadbeat[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, cased: latched ? false : card.cased, audit: latched ? "latch" : "return" }));
}

export function setDeadbeatCase(cards: readonly Deadbeat[], id: string, cased: boolean): Deadbeat[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, latched: cased ? false : card.latched, audit: cased ? "case" : "open" }));
}

export function setDeadbeatStar(cards: readonly Deadbeat[], id: string, starred: boolean): Deadbeat[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addDeadbeatTag(cards: readonly Deadbeat[], id: string, tag: string): Deadbeat[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepTooth(tooth: number | null, dir: 1 | -1): 5 | 10 | 15 | 20 {
  if (tooth === null) return dir > 0 ? 5 : 20;
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + TOOTH_CYCLE.length) % TOOTH_CYCLE.length;
  return TOOTH_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 12 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseTooth(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseLock(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerLock(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setDeadbeatFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, banked: !card.banked, audit: card.banked ? "free" : "bank" })) : [...cards];
}

export function latchDeadbeatFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return setDeadbeatLatch(cards, id, !cards.find((card) => card.id === id)?.latched);
}

export function starDeadbeatFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return setDeadbeatStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function washFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  const card = cards.find((item) => item.id === id);
  return card ? setDeadbeatWash(cards, id, cycleWash(card.wash)) : [...cards];
}

export function raiseToothFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return lowerTooth(cards, id);
}

export function raiseLockFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return raiseLock(cards, id);
}

export function lowerLockFocused(cards: readonly Deadbeat[], id: string): Deadbeat[] {
  return lowerLock(cards, id);
}

function bulk(cards: readonly Deadbeat[], ids: readonly string[], edit: (card: Deadbeat) => Deadbeat): Deadbeat[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkDeadbeatGraphite(cards: readonly Deadbeat[], ids: readonly string[]): Deadbeat[] {
  return bulk(cards, ids, (card) => (card.wash === "GRAPHITE" ? card : { ...card, wash: "GRAPHITE", audit: "wash" }));
}

export function bulkDeadbeatBank(cards: readonly Deadbeat[], ids: readonly string[]): Deadbeat[] {
  return bulk(cards, ids, (card) => (card.banked ? card : { ...card, banked: true, audit: "bank" }));
}

export function bulkDeadbeatCase(cards: readonly Deadbeat[], ids: readonly string[]): Deadbeat[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, latched: false, audit: "case" }));
}

export function bulkDeadbeatTag(cards: readonly Deadbeat[], ids: readonly string[]): Deadbeat[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readDeadbeatViews(raw: unknown): DeadbeatView[] {
  if (!Array.isArray(raw)) return [];
  const out: DeadbeatView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DeadbeatView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      wash: activeWash(row.wash, ["GILT", "IVORY", "GRAPHITE"]),
      part: activePart(row.part),
      tooth: activeTooth(row.tooth),
      lock: activeLock(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addDeadbeatView(views: readonly DeadbeatView[], view: DeadbeatView): DeadbeatView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readDeadbeatViews([...views, { ...view, id, name }]);
}

export function dropDeadbeatView(views: readonly DeadbeatView[], id: string): DeadbeatView[] {
  return views.filter((view) => view.id !== id);
}

export function deadbeatDensity(raw: unknown): DeadbeatDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortDeadbeatRules(cards: readonly Deadbeat[], sort: DeadbeatSort): Deadbeat[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const part = partIndex(a.part) - partIndex(b.part);
      if (part) return part;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleDeadbeatRules(
  cards: readonly Deadbeat[],
  tray: DeadbeatTray,
  query: string,
  keeper: string,
  wash: string,
  part: string,
  tooth: string,
  lock: string,
): Deadbeat[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantWash = wash === "all" ? "" : deadbeatWash(wash);
  const wantPart = activePart(part);
  const wantTooth = activeTooth(tooth);
  const wantLock = activeLock(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantWash && card.wash !== wantWash) return false;
    if (wantPart === "inner" && !deadbeatInner(card.part)) return false;
    if (wantPart === "outer" && !deadbeatOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantLock !== "all" && String(card.lock) !== wantLock) return false;
    return true;
  });
}

/** An outer part on lock three, still unbanked and not in the case, is overdue. */
export function overdueDeadbeat(card: Deadbeat): boolean {
  return deadbeatOuter(card.part) && card.lock === 3 && !card.banked && !card.cased;
}

/** No wash, the short tooth, lock three, and still on the bench. */
export function idleDeadbeat(card: Deadbeat): boolean {
  return !card.wash && card.tooth === 5 && card.lock === 3 && !card.banked && !card.latched && !card.cased;
}

/** Gilt, a tall tooth, and a full lock, still out of the case. */
export function briskDeadbeat(card: Deadbeat): boolean {
  return card.wash === "GILT" && card.tooth === 20 && card.lock === 12 && !card.cased;
}

/** Wheel, ivory, and tooth ten. */
export function restingDeadbeat(card: Deadbeat): boolean {
  return card.part === "wheel" && card.wash === "IVORY" && card.tooth === 10;
}

/** An anchor is late when the station is already on the wheel. */
export function lateDeadbeat(card: Deadbeat, station: string): boolean {
  return card.part === "anchor" && deadbeatPart(station) === "wheel" && !card.banked;
}

export function deadbeatCounts(cards: readonly Deadbeat[], shown: readonly Deadbeat[], station: string): DeadbeatCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    latch: cards.filter((card) => inTray(card, "latch")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    banked: cards.filter((card) => card.banked).length,
    inner: cards.filter((card) => deadbeatInner(card.part)).length,
    outer: cards.filter((card) => deadbeatOuter(card.part)).length,
    tall: cards.filter((card) => card.tooth === 20).length,
    quiet: cards.filter((card) => quietWash(card.wash)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleDeadbeat).length,
    brisk: cards.filter(briskDeadbeat).length,
    resting: cards.filter(restingDeadbeat).length,
    overdue: cards.filter(overdueDeadbeat).length,
    pair: cards.filter((card) => pairLock(card.lock) && lateDeadbeat(card, station)).length,
  };
}

export function deadbeatBars(cards: readonly Deadbeat[]): { part: string; count: number }[] {
  return DBK_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function deadbeatTimeline(cards: readonly Deadbeat[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function deadbeatKeepers(cards: readonly Deadbeat[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Deadbeat[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.banked && card.keeper);
  let best = "";
  let score = 0;
  for (const name of deadbeatKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderDeadbeatRules(cards: readonly Deadbeat[]): string[] {
  return cards.filter(overdueDeadbeat).map((card) => card.title);
}

export function deadbeatCopy(card: Deadbeat): string {
  return [card.title, card.keeper, card.part, card.wash, card.tooth ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function deadbeatCsv(cards: readonly Deadbeat[], station: string): string {
  const lines = ["title,keeper,part,wash,tooth,lock,tags,banked,latch,case,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.part,
        card.wash,
        card.tooth ?? "",
        card.lock,
        card.tags.join(" "),
        card.banked ? "1" : "0",
        card.latched ? "1" : "0",
        card.cased ? "1" : "0",
        card.starred ? "1" : "0",
        deadbeatOuter(card.part) ? "1" : "0",
        lateDeadbeat(card, station) ? "1" : "0",
        idleDeadbeat(card) ? "1" : "0",
        briskDeadbeat(card) ? "1" : "0",
        restingDeadbeat(card) ? "1" : "0",
        overdueDeadbeat(card) ? "1" : "0",
        deadbeatInner(card.part) ? "1" : "0",
        quietWash(card.wash) ? "1" : "0",
        deadbeatBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const DYC_KEY = "crmv4-diptych-hide";
export const DYC_REVIEW_KEY = "crmv4-diptych-review";

export type DiptychLane = "" | "locale" | "slash" | "score" | "tile" | "scroll" | "index" | "vowel" | "plain";
export type DiptychHue = "" | "ivory" | "graphite" | "champagne";
export type DiptychState = "" | "clear" | "set";
export type DiptychReview = "all" | "reviewed" | "fresh";
export type DiptychShape =
  | "all"
  | "locale"
  | "slash"
  | "score"
  | "tile"
  | "scroll"
  | "index"
  | "vowel"
  | "plain"
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
  | "held";

export type DiptychValue = string | { language?: unknown; [key: string]: unknown } | null | undefined;
export type DiptychRow = { id: string; label: string; code: DiptychValue };
export type DiptychLaneLine = { lane: string; count: number };

const CODE_LANES = ["locale", "slash", "score", "tile", "scroll", "index", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: DiptychValue): { language?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: DiptychValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: DiptychValue): string {
  const row = codeRecord(raw);
  if (row && !("language" in row)) return "";
  const value = row ? row.language : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "EN";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO TONGUE";
  return clip(value, 48);
}

function codeReadable(raw: DiptychValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("language" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function diptychState(raw: DiptychValue): DiptychState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known language is en, tr, de, ru, or ar. A slash contains a slash. A score contains an underscore. A tile is exactly five characters. A scroll is twelve characters or longer. An index starts with a digit. A vowel starts with a vowel. */
export function diptychLane(raw: DiptychValue): DiptychLane {
  if (diptychState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (TONGUES.has(text.toUpperCase())) return "locale";
  if (text.includes("/")) return "slash";
  if (text.includes("_")) return "score";
  if (text.length === 5) return "tile";
  if (text.length >= 12) return "scroll";
  if (/^[0-9]/.test(text)) return "index";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function diptychHue(raw: DiptychValue): DiptychHue {
  const lane = diptychLane(raw);
  if (!lane) return "";
  if (lane === "locale" || lane === "index") return "champagne";
  if (lane === "slash" || lane === "score") return "graphite";
  return "ivory";
}

export function diptychLocale(raw: DiptychValue): boolean {
  return diptychLane(raw) === "locale";
}

export function diptychSlash(raw: DiptychValue): boolean {
  return diptychLane(raw) === "slash";
}

export function diptychScore(raw: DiptychValue): boolean {
  return diptychLane(raw) === "score";
}

export function diptychTile(raw: DiptychValue): boolean {
  return diptychLane(raw) === "tile";
}

export function diptychScroll(raw: DiptychValue): boolean {
  return diptychLane(raw) === "scroll";
}

export function diptychIndex(raw: DiptychValue): boolean {
  return diptychLane(raw) === "index";
}

export function diptychVowelLane(raw: DiptychValue): boolean {
  return diptychLane(raw) === "vowel";
}

export function diptychPlain(raw: DiptychValue): boolean {
  return diptychLane(raw) === "plain";
}

export function diptychOpen(raw: DiptychValue): boolean {
  return diptychState(raw) === "clear";
}

/** A scroll or a vowel name can stay as written. */
export function diptychHeld(raw: DiptychValue): boolean {
  const lane = diptychLane(raw);
  return lane === "scroll" || lane === "vowel";
}

/** A tile, or a three-character name that is not a known language, still wants a fuller name. */
export function diptychSoon(raw: DiptychValue): boolean {
  if (diptychState(raw) !== "set") return false;
  if (diptychTile(raw)) return true;
  if (diptychLocale(raw)) return false;
  return codeGiven(raw).length === 3;
}

export function diptychLength(raw: DiptychValue): number | null {
  if (diptychState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function diptychEven(raw: DiptychValue): boolean {
  const length = diptychLength(raw);
  return length !== null && length % 2 === 0;
}

export function diptychOdd(raw: DiptychValue): boolean {
  const length = diptychLength(raw);
  return length !== null && length % 2 === 1;
}

export function diptychFirst(raw: DiptychValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function diptychTail(raw: DiptychValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function diptychCapital(raw: DiptychValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function diptychSpace(raw: DiptychValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function diptychVowel(raw: DiptychValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function diptychDigit(raw: DiptychValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function diptychLetter(raw: DiptychValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function diptychMixed(raw: DiptychValue): boolean {
  return diptychDigit(raw) && diptychLetter(raw);
}

export function diptychLower(raw: DiptychValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function diptychUpper(raw: DiptychValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function diptychStamp(raw: DiptychValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function diptychCopy(raw: DiptychValue): string {
  return codeGiven(raw);
}

export function diptychFamily(raw: DiptychValue): string {
  if (diptychState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function diptychLanes(rows: readonly DiptychRow[]): DiptychLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = diptychLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingDiptych(rows: readonly DiptychRow[]): string {
  const lines = diptychLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingDiptychHue(rows: readonly DiptychRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = diptychHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneDiptychCount(rows: readonly DiptychRow[], lane: DiptychLane): number {
  return rows.filter((row) => diptychLane(row.code) === lane).length;
}

export function diptychShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDiptychLanes(rows: readonly DiptychRow[]): string[] {
  return diptychLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenDiptych(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDiptych(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDiptych(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleDiptychReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDiptychReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDiptychLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: DiptychRow, shape: DiptychShape): boolean {
  if (shape === "all") return true;
  if (shape === "locale") return diptychLocale(row.code);
  if (shape === "slash") return diptychSlash(row.code);
  if (shape === "score") return diptychScore(row.code);
  if (shape === "tile") return diptychTile(row.code);
  if (shape === "scroll") return diptychScroll(row.code);
  if (shape === "index") return diptychIndex(row.code);
  if (shape === "vowel") return diptychVowelLane(row.code);
  if (shape === "plain") return diptychPlain(row.code);
  if (shape === "open") return diptychOpen(row.code);
  if (shape === "soon") return diptychSoon(row.code);
  if (shape === "letter") return diptychLetter(row.code);
  if (shape === "mixed") return diptychMixed(row.code);
  if (shape === "upper") return diptychUpper(row.code);
  if (shape === "lower") return diptychLower(row.code);
  if (shape === "space") return diptychSpace(row.code);
  if (shape === "even") return diptychEven(row.code);
  if (shape === "odd") return diptychOdd(row.code);
  if (shape === "tail") return diptychTail(row.code);
  if (shape === "first") return diptychFirst(row.code);
  if (shape === "held") return diptychHeld(row.code);
  return diptychLane(row.code) === shape;
}

export function visibleDiptych(
  rows: readonly DiptychRow[],
  lane: string,
  hue: string,
  query: string,
  review: DiptychReview,
  reviewed: readonly string[],
  shape: DiptychShape,
): DiptychRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (diptychState(row.code) === "") return false;
    const found = diptychLane(row.code);
    const hueName = diptychHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${diptychStamp(row.code)} ${diptychFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function diptychLanesCsv(rows: readonly DiptychRow[]): string {
  const lines = ["lane,count"];
  for (const line of diptychLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function diptychRowsCsv(rows: readonly DiptychRow[], reviewed: readonly string[]): string {
  const lines = ["name,language,stamp,family,lane,hue,length,locale,slash,score,tile,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(diptychCopy(row.code)),
        diptychStamp(row.code),
        csvCell(diptychFamily(row.code)),
        diptychLane(row.code),
        diptychHue(row.code),
        diptychLength(row.code) ?? "",
        diptychLocale(row.code) ? "1" : "0",
        diptychSlash(row.code) ? "1" : "0",
        diptychScore(row.code) ? "1" : "0",
        diptychTile(row.code) ? "1" : "0",
        diptychEven(row.code) ? "1" : "0",
        diptychDigit(row.code) ? "1" : "0",
        diptychMixed(row.code) ? "1" : "0",
        diptychUpper(row.code) ? "1" : "0",
        diptychVowel(row.code) ? "1" : "0",
        diptychTail(row.code) ? "1" : "0",
        diptychHeld(row.code) ? "1" : "0",
        diptychSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
