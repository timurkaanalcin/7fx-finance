/**
 * Stackfreed rules for a stackfreed cam kept in this browser, and nocturlabe plates read the withdrawal switch already stored on the account.
 * Parts are lobe, snail, yoke, and barrel. Films are gilt, ivory, and graphite.
 * Pips are 4, 8, 12, or 16. Beats are 2, 4, or 8.
 * A known switch is OPEN, HOLD, LOCK, or ASK. A dash contains a hyphen. A dot contains a period.
 * A seal is exactly five characters. A scroll is twelve characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true switch reads as OPEN. A false switch reads as HELD.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_stackfreed (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   ward text not null default '',
 *   part text not null default '',
 *   pip_no integer,
 *   film text not null default '',
 *   beat_no integer not null default 2,
 *   tags text not null default '',
 *   poised boolean not null default false,
 *   racked boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_nocturlabe_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_nocturlabe_review (
 *   trader_id text primary key
 * );
 */


export const SFR_KEY = "crmv4-stackfreed";
export const SFR_VIEW_KEY = "crmv4-stackfreed-views";
export const SFR_DENSITY_KEY = "crmv4-stackfreed-density";
export const SFR_PARTS = ["lobe", "snail", "yoke", "barrel"] as const;

export type StackfreedPart = (typeof SFR_PARTS)[number];
export type StackfreedWash = "blank" | "gilt" | "ivory" | "graphite";
export type StackfreedTray = "bench" | "latch" | "case";
export type StackfreedDensity = "airy" | "close";
export type StackfreedSort = "part" | "keeper";

export type Stackfreed = {
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

export type StackfreedView = {
  id: string;
  name: string;
  tray: StackfreedTray;
  query: string;
  keeper: string;
  wash: string;
  part: string;
  tooth: string;
  lock: string;
};

export type StackfreedCounts = {
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

export const ROUND329_FEATURES = [
  "stackfreed-save",
  "notice-center",
  "lobe-parts",
  "quick-search",
  "beat-sla",
  "chest",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "ward-sort",
  "desk-kpis",
  "pip-chart",
  "pip-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-ward",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "switch-nocturlabe",
  "nocturlabe-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wash", "bank", "free", "latch", "return", "case", "open", "tag", "lock", "tooth", "lower", "star"] as const;
const WASHES = ["gilt", "ivory", "graphite"] as const;
const TOOTH_CYCLE = [4, 8, 12, 16] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["lobe", "snail"]);
const OUTER = new Set(["yoke", "barrel"]);
const QUIET_WASH = new Set(["IVORY", "GRAPHITE"]);
const GATES = new Set(["OPEN", "HOLD", "LOCK", "ASK"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StackfreedTray {
  return raw === "latch" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function washName(raw: unknown): Exclude<StackfreedWash, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WASHES as readonly string[]).includes(text) ? (text as Exclude<StackfreedWash, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[sf]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Stackfreed, tray: StackfreedTray): boolean {
  if (tray === "latch") return card.latched && !card.cased;
  if (tray === "case") return card.cased;
  return !card.latched && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return SFR_PARTS.indexOf(part as StackfreedPart);
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

export function stackfreedPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SFR_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A pip is 4, 8, 12, or 16. Anything else stays blank. */
export function stackfreedTooth(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A beat is 2, 4, or 8. Anything else stays blank. */
export function stackfreedLock(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A wash is gilt, ivory, or graphite. The saved name is the upper token. */
export function stackfreedWash(raw: unknown): string {
  const text = washName(raw);
  return text ? text.toUpperCase() : "";
}

export function stackfreedInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function stackfreedOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Crest is the lobe. Ramp is the snail. Hook is the yoke. Drum is the barrel. */
export function stackfreedBand(part: unknown): string {
  const text = stackfreedPart(part);
  if (!text) return "";
  if (text === "lobe") return "crest";
  if (text === "snail") return "ramp";
  if (text === "yoke") return "hook";
  return "drum";
}

/** Signed distance from one part to another along the stackfreed. */
export function stackfreedGap(from: unknown, to: unknown): number | null {
  const left = partIndex(stackfreedPart(from));
  const right = partIndex(stackfreedPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietWash(wash: unknown): boolean {
  return QUIET_WASH.has(stackfreedWash(wash));
}

/** A pair beat is 4. Two and eight are not a pair. */
export function pairLock(lock: unknown): boolean {
  return stackfreedLock(lock) === 4;
}

/** A full beat is 8. */
export function fullLock(lock: unknown): boolean {
  return stackfreedLock(lock) === 8;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return stackfreedPart(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = stackfreedTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeWash(raw: unknown, allow: readonly string[]): string {
  const text = stackfreedWash(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLock(raw: unknown): string {
  const lock = stackfreedLock(raw);
  return lock === null ? "all" : String(lock);
}

export function moveStackfreedFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wash the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestWash(cards: readonly Stackfreed[]): string {
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

/** Before six, suggest pip four. Before noon, suggest pip eight. Before six in the evening, suggest pip twelve. Later, suggest pip sixteen. A saved pip on the board wins, and a tie keeps the shorter pip. */
export function suggestTooth(cards: readonly Stackfreed[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 16 = 4;
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
  if (hour < 6) return 4;
  if (hour < 12) return 8;
  if (hour < 18) return 12;
  return 16;
}

/** Before nine, suggest the lobe. The rest of the day suggests the barrel. */
export function suggestPart(hour: number): StackfreedPart {
  return hour < 9 ? "lobe" : "barrel";
}

/** The keeper with the fewest unbanked cards on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Stackfreed[], roster: string): string {
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

export function readStackfreedRules(raw: unknown): Stackfreed[] {
  if (!Array.isArray(raw)) return [];
  const out: Stackfreed[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Stackfreed>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      part: stackfreedPart(row.part),
      tooth: stackfreedTooth(row.tooth),
      wash: stackfreedWash(row.wash),
      lock: stackfreedLock(row.lock) ?? 2,
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

export function addStackfreed(
  cards: readonly Stackfreed[],
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
): Stackfreed[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readStackfreedRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      part: stackfreedPart(card.part),
      tooth: stackfreedTooth(card.tooth),
      wash: stackfreedWash(card.wash),
      lock: stackfreedLock(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      banked: false,
      latched: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Stackfreed[], id: string, edit: (card: Stackfreed) => Stackfreed): Stackfreed[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editStackfreed(cards: readonly Stackfreed[], id: string, title: string): Stackfreed[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editStackfreedNote(cards: readonly Stackfreed[], id: string, note: string): Stackfreed[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWash(wash: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(stackfreedWash(wash));
  return order[(index + 1) % order.length] || "GILT";
}

export function setStackfreedWash(cards: readonly Stackfreed[], id: string, wash: string): Stackfreed[] {
  const next = stackfreedWash(wash);
  return mapCard(cards, id, (card) => (card.wash === next ? card : { ...card, wash: next, audit: "wash" }));
}

export function setStackfreedBank(cards: readonly Stackfreed[], id: string, banked: boolean): Stackfreed[] {
  return mapCard(cards, id, (card) => (card.banked === banked ? card : { ...card, banked, audit: banked ? "bank" : "free" }));
}

export function setStackfreedLatch(cards: readonly Stackfreed[], id: string, latched: boolean): Stackfreed[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, cased: latched ? false : card.cased, audit: latched ? "latch" : "return" }));
}

export function setStackfreedCase(cards: readonly Stackfreed[], id: string, cased: boolean): Stackfreed[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, latched: cased ? false : card.latched, audit: cased ? "case" : "open" }));
}

export function setStackfreedStar(cards: readonly Stackfreed[], id: string, starred: boolean): Stackfreed[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addStackfreedTag(cards: readonly Stackfreed[], id: string, tag: string): Stackfreed[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepTooth(tooth: number | null, dir: 1 | -1): 4 | 8 | 12 | 16 {
  if (tooth === null) return dir > 0 ? 4 : 16;
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + TOOTH_CYCLE.length) % TOOTH_CYCLE.length;
  return TOOTH_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseTooth(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseLock(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerLock(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setStackfreedFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, banked: !card.banked, audit: card.banked ? "free" : "bank" })) : [...cards];
}

export function latchStackfreedFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return setStackfreedLatch(cards, id, !cards.find((card) => card.id === id)?.latched);
}

export function starStackfreedFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return setStackfreedStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function washFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  const card = cards.find((item) => item.id === id);
  return card ? setStackfreedWash(cards, id, cycleWash(card.wash)) : [...cards];
}

export function raiseToothFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return lowerTooth(cards, id);
}

export function raiseLockFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return raiseLock(cards, id);
}

export function lowerLockFocused(cards: readonly Stackfreed[], id: string): Stackfreed[] {
  return lowerLock(cards, id);
}

function bulk(cards: readonly Stackfreed[], ids: readonly string[], edit: (card: Stackfreed) => Stackfreed): Stackfreed[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkStackfreedGraphite(cards: readonly Stackfreed[], ids: readonly string[]): Stackfreed[] {
  return bulk(cards, ids, (card) => (card.wash === "GRAPHITE" ? card : { ...card, wash: "GRAPHITE", audit: "wash" }));
}

export function bulkStackfreedBank(cards: readonly Stackfreed[], ids: readonly string[]): Stackfreed[] {
  return bulk(cards, ids, (card) => (card.banked ? card : { ...card, banked: true, audit: "bank" }));
}

export function bulkStackfreedCase(cards: readonly Stackfreed[], ids: readonly string[]): Stackfreed[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, latched: false, audit: "case" }));
}

export function bulkStackfreedTag(cards: readonly Stackfreed[], ids: readonly string[]): Stackfreed[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readStackfreedViews(raw: unknown): StackfreedView[] {
  if (!Array.isArray(raw)) return [];
  const out: StackfreedView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StackfreedView>;
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

export function addStackfreedView(views: readonly StackfreedView[], view: StackfreedView): StackfreedView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readStackfreedViews([...views, { ...view, id, name }]);
}

export function dropStackfreedView(views: readonly StackfreedView[], id: string): StackfreedView[] {
  return views.filter((view) => view.id !== id);
}

export function stackfreedDensity(raw: unknown): StackfreedDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortStackfreedRules(cards: readonly Stackfreed[], sort: StackfreedSort): Stackfreed[] {
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

export function visibleStackfreedRules(
  cards: readonly Stackfreed[],
  tray: StackfreedTray,
  query: string,
  keeper: string,
  wash: string,
  part: string,
  tooth: string,
  lock: string,
): Stackfreed[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantWash = wash === "all" ? "" : stackfreedWash(wash);
  const wantPart = activePart(part);
  const wantTooth = activeTooth(tooth);
  const wantLock = activeLock(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantWash && card.wash !== wantWash) return false;
    if (wantPart === "inner" && !stackfreedInner(card.part)) return false;
    if (wantPart === "outer" && !stackfreedOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantLock !== "all" && String(card.lock) !== wantLock) return false;
    return true;
  });
}

/** An outer part on beat two, still unpoised and not in the chest, is overdue. */
export function overdueStackfreed(card: Stackfreed): boolean {
  return stackfreedOuter(card.part) && card.lock === 2 && !card.banked && !card.cased;
}

/** No film, the short pip, beat two, and still on the board. */
export function idleStackfreed(card: Stackfreed): boolean {
  return !card.wash && card.tooth === 4 && card.lock === 2 && !card.banked && !card.latched && !card.cased;
}

/** Gilt, the tall pip, and a full beat, still out of the chest. */
export function briskStackfreed(card: Stackfreed): boolean {
  return card.wash === "GILT" && card.tooth === 16 && card.lock === 8 && !card.cased;
}

/** Barrel, ivory, and pip eight. */
export function restingStackfreed(card: Stackfreed): boolean {
  return card.part === "barrel" && card.wash === "IVORY" && card.tooth === 8;
}

/** A lobe is late when the station is already on the barrel. */
export function lateStackfreed(card: Stackfreed, station: string): boolean {
  return card.part === "lobe" && stackfreedPart(station) === "barrel" && !card.banked;
}

export function stackfreedCounts(cards: readonly Stackfreed[], shown: readonly Stackfreed[], station: string): StackfreedCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    latch: cards.filter((card) => inTray(card, "latch")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    banked: cards.filter((card) => card.banked).length,
    inner: cards.filter((card) => stackfreedInner(card.part)).length,
    outer: cards.filter((card) => stackfreedOuter(card.part)).length,
    tall: cards.filter((card) => card.tooth === 16).length,
    quiet: cards.filter((card) => quietWash(card.wash)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleStackfreed).length,
    brisk: cards.filter(briskStackfreed).length,
    resting: cards.filter(restingStackfreed).length,
    overdue: cards.filter(overdueStackfreed).length,
    pair: cards.filter((card) => pairLock(card.lock) && lateStackfreed(card, station)).length,
  };
}

export function stackfreedBars(cards: readonly Stackfreed[]): { part: string; count: number }[] {
  return SFR_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function stackfreedTimeline(cards: readonly Stackfreed[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function stackfreedKeepers(cards: readonly Stackfreed[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Stackfreed[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.banked && card.keeper);
  let best = "";
  let score = 0;
  for (const name of stackfreedKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderStackfreedRules(cards: readonly Stackfreed[]): string[] {
  return cards.filter(overdueStackfreed).map((card) => card.title);
}

export function stackfreedCopy(card: Stackfreed): string {
  return [card.title, card.keeper, card.part, card.wash, card.tooth ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function stackfreedCsv(cards: readonly Stackfreed[], station: string): string {
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
        stackfreedOuter(card.part) ? "1" : "0",
        lateStackfreed(card, station) ? "1" : "0",
        idleStackfreed(card) ? "1" : "0",
        briskStackfreed(card) ? "1" : "0",
        restingStackfreed(card) ? "1" : "0",
        overdueStackfreed(card) ? "1" : "0",
        stackfreedInner(card.part) ? "1" : "0",
        quietWash(card.wash) ? "1" : "0",
        stackfreedBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const NLB_KEY = "crmv4-nocturlabe-hide";
export const NLB_REVIEW_KEY = "crmv4-nocturlabe-review";

export type NocturlabeLane = "" | "code" | "join" | "gap" | "chip" | "banner" | "mark" | "vowel" | "plain";
export type NocturlabeHue = "" | "ivory" | "graphite" | "champagne";
export type NocturlabeState = "" | "clear" | "set";
export type NocturlabeReview = "all" | "reviewed" | "fresh";
export type NocturlabeShape =
  | "all"
  | "code"
  | "join"
  | "gap"
  | "chip"
  | "banner"
  | "mark"
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

export type NocturlabeValue = string | { withdrawalsEnabled?: unknown; [key: string]: unknown } | null | undefined;
export type NocturlabeRow = { id: string; label: string; code: NocturlabeValue };
export type NocturlabeLaneLine = { lane: string; count: number };

const CODE_LANES = ["code", "join", "gap", "chip", "banner", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: NocturlabeValue): { withdrawalsEnabled?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: NocturlabeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: NocturlabeValue): string {
  const row = codeRecord(raw);
  if (row && !("withdrawalsEnabled" in row)) return "";
  const value = row ? row.withdrawalsEnabled : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "OPEN";
  if (value === false || value === "false" || value === "0" || value === 0) return "HELD";
  return clip(value, 48);
}

function codeReadable(raw: NocturlabeValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("withdrawalsEnabled" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function nocturlabeState(raw: NocturlabeValue): NocturlabeState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known switch is OPEN, HOLD, LOCK, or ASK. A dash contains a hyphen. A dot contains a period. A seal is exactly five characters. A scroll is twelve characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function nocturlabeLane(raw: NocturlabeValue): NocturlabeLane {
  if (nocturlabeState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (text === "HELD") return "plain";
  if (GATES.has(text.toUpperCase())) return "code";
  if (text.includes("-")) return "join";
  if (text.includes(".")) return "gap";
  if (text.length === 5) return "chip";
  if (text.length >= 12) return "banner";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function nocturlabeHue(raw: NocturlabeValue): NocturlabeHue {
  const lane = nocturlabeLane(raw);
  if (!lane) return "";
  if (lane === "code" || lane === "chip") return "champagne";
  if (lane === "join" || lane === "gap" || lane === "banner") return "graphite";
  return "ivory";
}

export function nocturlabeCode(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "code";
}

export function nocturlabeJoin(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "join";
}

export function nocturlabeGap(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "gap";
}

export function nocturlabeChip(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "chip";
}

export function nocturlabeBanner(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "banner";
}

export function nocturlabeMark(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "mark";
}

export function nocturlabeVowelLane(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "vowel";
}

export function nocturlabePlain(raw: NocturlabeValue): boolean {
  return nocturlabeLane(raw) === "plain";
}

export function nocturlabeOpen(raw: NocturlabeValue): boolean {
  return nocturlabeState(raw) === "clear";
}

/** A scroll or an index can stay as written. */
export function nocturlabeHeld(raw: NocturlabeValue): boolean {
  const lane = nocturlabeLane(raw);
  return lane === "banner" || lane === "mark";
}

/** A seal, or a three-character name that is not a known switch, still wants a fuller name. */
export function nocturlabeSoon(raw: NocturlabeValue): boolean {
  if (nocturlabeState(raw) !== "set") return false;
  if (nocturlabeChip(raw)) return true;
  if (nocturlabeCode(raw)) return false;
  return codeGiven(raw).length === 3;
}

export function nocturlabeLength(raw: NocturlabeValue): number | null {
  if (nocturlabeState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function nocturlabeEven(raw: NocturlabeValue): boolean {
  const length = nocturlabeLength(raw);
  return length !== null && length % 2 === 0;
}

export function nocturlabeOdd(raw: NocturlabeValue): boolean {
  const length = nocturlabeLength(raw);
  return length !== null && length % 2 === 1;
}

export function nocturlabeFirst(raw: NocturlabeValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function nocturlabeTail(raw: NocturlabeValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function nocturlabeCapital(raw: NocturlabeValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function nocturlabeSpace(raw: NocturlabeValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function nocturlabeVowel(raw: NocturlabeValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function nocturlabeDigit(raw: NocturlabeValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function nocturlabeLetter(raw: NocturlabeValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function nocturlabeMixed(raw: NocturlabeValue): boolean {
  return nocturlabeDigit(raw) && nocturlabeLetter(raw);
}

export function nocturlabeLower(raw: NocturlabeValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital seal is five letters or more, written entirely in capitals. */
export function nocturlabeUpper(raw: NocturlabeValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function nocturlabeStamp(raw: NocturlabeValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function nocturlabeCopy(raw: NocturlabeValue): string {
  return codeGiven(raw);
}

export function nocturlabeFamily(raw: NocturlabeValue): string {
  if (nocturlabeState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function nocturlabeLanes(rows: readonly NocturlabeRow[]): NocturlabeLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = nocturlabeLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingNocturlabe(rows: readonly NocturlabeRow[]): string {
  const lines = nocturlabeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingNocturlabeHue(rows: readonly NocturlabeRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = nocturlabeHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneNocturlabeCount(rows: readonly NocturlabeRow[], lane: NocturlabeLane): number {
  return rows.filter((row) => nocturlabeLane(row.code) === lane).length;
}

export function nocturlabeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentNocturlabeLanes(rows: readonly NocturlabeRow[]): string[] {
  return nocturlabeLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenNocturlabe(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedNocturlabe(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleNocturlabe(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleNocturlabeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkNocturlabeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleNocturlabeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: NocturlabeRow, shape: NocturlabeShape): boolean {
  if (shape === "all") return true;
  if (shape === "code") return nocturlabeCode(row.code);
  if (shape === "join") return nocturlabeJoin(row.code);
  if (shape === "gap") return nocturlabeGap(row.code);
  if (shape === "chip") return nocturlabeChip(row.code);
  if (shape === "banner") return nocturlabeBanner(row.code);
  if (shape === "mark") return nocturlabeMark(row.code);
  if (shape === "vowel") return nocturlabeVowelLane(row.code);
  if (shape === "plain") return nocturlabePlain(row.code);
  if (shape === "open") return nocturlabeOpen(row.code);
  if (shape === "soon") return nocturlabeSoon(row.code);
  if (shape === "letter") return nocturlabeLetter(row.code);
  if (shape === "mixed") return nocturlabeMixed(row.code);
  if (shape === "upper") return nocturlabeUpper(row.code);
  if (shape === "lower") return nocturlabeLower(row.code);
  if (shape === "space") return nocturlabeSpace(row.code);
  if (shape === "even") return nocturlabeEven(row.code);
  if (shape === "odd") return nocturlabeOdd(row.code);
  if (shape === "tail") return nocturlabeTail(row.code);
  if (shape === "first") return nocturlabeFirst(row.code);
  if (shape === "held") return nocturlabeHeld(row.code);
  return nocturlabeLane(row.code) === shape;
}

export function visibleNocturlabe(
  rows: readonly NocturlabeRow[],
  lane: string,
  hue: string,
  query: string,
  review: NocturlabeReview,
  reviewed: readonly string[],
  shape: NocturlabeShape,
): NocturlabeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (nocturlabeState(row.code) === "") return false;
    const found = nocturlabeLane(row.code);
    const hueName = nocturlabeHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${nocturlabeStamp(row.code)} ${nocturlabeFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function nocturlabeLanesCsv(rows: readonly NocturlabeRow[]): string {
  const lines = ["lane,count"];
  for (const line of nocturlabeLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function nocturlabeRowsCsv(rows: readonly NocturlabeRow[], reviewed: readonly string[]): string {
  const lines = ["name,switch,stamp,family,lane,hue,length,code,join,gap,chip,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(nocturlabeCopy(row.code)),
        nocturlabeStamp(row.code),
        csvCell(nocturlabeFamily(row.code)),
        nocturlabeLane(row.code),
        nocturlabeHue(row.code),
        nocturlabeLength(row.code) ?? "",
        nocturlabeCode(row.code) ? "1" : "0",
        nocturlabeJoin(row.code) ? "1" : "0",
        nocturlabeGap(row.code) ? "1" : "0",
        nocturlabeChip(row.code) ? "1" : "0",
        nocturlabeEven(row.code) ? "1" : "0",
        nocturlabeDigit(row.code) ? "1" : "0",
        nocturlabeMixed(row.code) ? "1" : "0",
        nocturlabeUpper(row.code) ? "1" : "0",
        nocturlabeVowel(row.code) ? "1" : "0",
        nocturlabeTail(row.code) ? "1" : "0",
        nocturlabeHeld(row.code) ? "1" : "0",
        nocturlabeSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
