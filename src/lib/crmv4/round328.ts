/**
 * Virgule rules for a virgule escapement kept in this browser, and gunter plates read the withdrawal switch already stored on the account.
 * Limbs are body, beak, staff, and dart. Films are gilt, ivory, and graphite.
 * Pips are 3, 6, 9, or 12. Beats are 3, 6, or 9.
 * A known switch is OPEN, HOLD, LOCK, or ASK. A slash contains a slash. A score contains an underscore.
 * A tile is exactly four characters. A scroll is fourteen characters or longer. An index starts with a digit. A twin repeats a letter.
 * A true switch reads as OPEN. A false switch reads as HELD.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_virgule (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   ward text not null default '',
 *   limb text not null default '',
 *   pip_no integer,
 *   film text not null default '',
 *   beat_no integer not null default 3,
 *   tags text not null default '',
 *   poised boolean not null default false,
 *   racked boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_gunter_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_gunter_review (
 *   trader_id text primary key
 * );
 */


export const VRG_KEY = "crmv4-virgule";
export const VRG_VIEW_KEY = "crmv4-virgule-views";
export const VRG_DENSITY_KEY = "crmv4-virgule-density";
export const VRG_PARTS = ["body", "beak", "staff", "dart"] as const;

export type VirgulePart = (typeof VRG_PARTS)[number];
export type VirguleWash = "blank" | "gilt" | "ivory" | "graphite";
export type VirguleTray = "bench" | "latch" | "case";
export type VirguleDensity = "airy" | "close";
export type VirguleSort = "part" | "keeper";

export type Virgule = {
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

export type VirguleView = {
  id: string;
  name: string;
  tray: VirguleTray;
  query: string;
  keeper: string;
  wash: string;
  part: string;
  tooth: string;
  lock: string;
};

export type VirguleCounts = {
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

export const ROUND328_FEATURES = [
  "virgule-save",
  "notice-center",
  "body-parts",
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
  "switch-gunter",
  "gunter-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wash", "bank", "free", "latch", "return", "case", "open", "tag", "lock", "tooth", "lower", "star"] as const;
const WASHES = ["gilt", "ivory", "graphite"] as const;
const TOOTH_CYCLE = [3, 6, 9, 12] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["body", "beak"]);
const OUTER = new Set(["staff", "dart"]);
const QUIET_WASH = new Set(["IVORY", "GRAPHITE"]);
const GATES = new Set(["OPEN", "HOLD", "LOCK", "ASK"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VirguleTray {
  return raw === "latch" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function washName(raw: unknown): Exclude<VirguleWash, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WASHES as readonly string[]).includes(text) ? (text as Exclude<VirguleWash, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[vg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Virgule, tray: VirguleTray): boolean {
  if (tray === "latch") return card.latched && !card.cased;
  if (tray === "case") return card.cased;
  return !card.latched && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return VRG_PARTS.indexOf(part as VirgulePart);
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

export function virgulePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (VRG_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A tooth is 4, 8, 12, or 16. Anything else stays blank. */
export function virguleTooth(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A lift is 2, 4, or 8. Anything else stays blank. */
export function virguleLock(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A wash is gilt, ivory, or graphite. The saved name is the upper token. */
export function virguleWash(raw: unknown): string {
  const text = washName(raw);
  return text ? text.toUpperCase() : "";
}

export function virguleInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function virguleOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Shell is the lip. Arbor is the pin. Banking is the rail. Impulse is the kick. */
export function virguleBand(part: unknown): string {
  const text = virgulePart(part);
  if (!text) return "";
  if (text === "body") return "rib";
  if (text === "beak") return "tip";
  if (text === "staff") return "bar";
  return "nip";
}

/** Signed distance from one part to another along the virgule. */
export function virguleGap(from: unknown, to: unknown): number | null {
  const left = partIndex(virgulePart(from));
  const right = partIndex(virgulePart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietWash(wash: unknown): boolean {
  return QUIET_WASH.has(virguleWash(wash));
}

/** A pair lift is 4. Two and eight are not a pair. */
export function pairLock(lock: unknown): boolean {
  return virguleLock(lock) === 6;
}

/** A full lift is 8. */
export function fullLock(lock: unknown): boolean {
  return virguleLock(lock) === 9;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return virgulePart(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = virguleTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeWash(raw: unknown, allow: readonly string[]): string {
  const text = virguleWash(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLock(raw: unknown): string {
  const lock = virguleLock(raw);
  return lock === null ? "all" : String(lock);
}

export function moveVirguleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wash the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestWash(cards: readonly Virgule[]): string {
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

/** Night asks for four teeth. Morning asks for eight. Afternoon asks for twelve. Evening asks for sixteen. A saved tooth on the bench wins, and a tie keeps the shorter tooth. */
export function suggestTooth(cards: readonly Virgule[], hour: number): 3 | 6 | 9 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.tooth === null) continue;
    seen = true;
    counts.set(card.tooth, (counts.get(card.tooth) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 12 = 3;
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
  if (hour < 5) return 3;
  if (hour < 11) return 6;
  if (hour < 17) return 9;
  return 12;
}

/** Before nine, suggest the shell. The rest of the day suggests the impulse. */
export function suggestPart(hour: number): VirgulePart {
  return hour < 9 ? "body" : "dart";
}

/** The keeper with the fewest unbanked cards on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Virgule[], roster: string): string {
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

export function readVirguleRules(raw: unknown): Virgule[] {
  if (!Array.isArray(raw)) return [];
  const out: Virgule[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Virgule>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      part: virgulePart(row.part),
      tooth: virguleTooth(row.tooth),
      wash: virguleWash(row.wash),
      lock: virguleLock(row.lock) ?? 3,
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

export function addVirgule(
  cards: readonly Virgule[],
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
): Virgule[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readVirguleRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      part: virgulePart(card.part),
      tooth: virguleTooth(card.tooth),
      wash: virguleWash(card.wash),
      lock: virguleLock(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      banked: false,
      latched: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Virgule[], id: string, edit: (card: Virgule) => Virgule): Virgule[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editVirgule(cards: readonly Virgule[], id: string, title: string): Virgule[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editVirguleNote(cards: readonly Virgule[], id: string, note: string): Virgule[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWash(wash: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(virguleWash(wash));
  return order[(index + 1) % order.length] || "GILT";
}

export function setVirguleWash(cards: readonly Virgule[], id: string, wash: string): Virgule[] {
  const next = virguleWash(wash);
  return mapCard(cards, id, (card) => (card.wash === next ? card : { ...card, wash: next, audit: "wash" }));
}

export function setVirguleBank(cards: readonly Virgule[], id: string, banked: boolean): Virgule[] {
  return mapCard(cards, id, (card) => (card.banked === banked ? card : { ...card, banked, audit: banked ? "bank" : "free" }));
}

export function setVirguleLatch(cards: readonly Virgule[], id: string, latched: boolean): Virgule[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, cased: latched ? false : card.cased, audit: latched ? "latch" : "return" }));
}

export function setVirguleCase(cards: readonly Virgule[], id: string, cased: boolean): Virgule[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, latched: cased ? false : card.latched, audit: cased ? "case" : "open" }));
}

export function setVirguleStar(cards: readonly Virgule[], id: string, starred: boolean): Virgule[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addVirguleTag(cards: readonly Virgule[], id: string, tag: string): Virgule[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepTooth(tooth: number | null, dir: 1 | -1): 3 | 6 | 9 | 12 {
  if (tooth === null) return dir > 0 ? 3 : 12;
  const index = toothIndex(tooth);
  const next = index < 0 ? 0 : (index + dir + TOOTH_CYCLE.length) % TOOTH_CYCLE.length;
  return TOOTH_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseTooth(cards: readonly Virgule[], id: string): Virgule[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Virgule[], id: string): Virgule[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseLock(cards: readonly Virgule[], id: string): Virgule[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerLock(cards: readonly Virgule[], id: string): Virgule[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setVirguleFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, banked: !card.banked, audit: card.banked ? "free" : "bank" })) : [...cards];
}

export function latchVirguleFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return setVirguleLatch(cards, id, !cards.find((card) => card.id === id)?.latched);
}

export function starVirguleFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return setVirguleStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function washFocused(cards: readonly Virgule[], id: string): Virgule[] {
  const card = cards.find((item) => item.id === id);
  return card ? setVirguleWash(cards, id, cycleWash(card.wash)) : [...cards];
}

export function raiseToothFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return lowerTooth(cards, id);
}

export function raiseLockFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return raiseLock(cards, id);
}

export function lowerLockFocused(cards: readonly Virgule[], id: string): Virgule[] {
  return lowerLock(cards, id);
}

function bulk(cards: readonly Virgule[], ids: readonly string[], edit: (card: Virgule) => Virgule): Virgule[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkVirguleGraphite(cards: readonly Virgule[], ids: readonly string[]): Virgule[] {
  return bulk(cards, ids, (card) => (card.wash === "GRAPHITE" ? card : { ...card, wash: "GRAPHITE", audit: "wash" }));
}

export function bulkVirguleBank(cards: readonly Virgule[], ids: readonly string[]): Virgule[] {
  return bulk(cards, ids, (card) => (card.banked ? card : { ...card, banked: true, audit: "bank" }));
}

export function bulkVirguleCase(cards: readonly Virgule[], ids: readonly string[]): Virgule[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, latched: false, audit: "case" }));
}

export function bulkVirguleTag(cards: readonly Virgule[], ids: readonly string[]): Virgule[] {
  return bulk(cards, ids, (card) => (card.tags.includes("v") ? card : { ...card, tags: tagsOf([...card.tags, "v"]), audit: "tag" }));
}

export function readVirguleViews(raw: unknown): VirguleView[] {
  if (!Array.isArray(raw)) return [];
  const out: VirguleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VirguleView>;
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

export function addVirguleView(views: readonly VirguleView[], view: VirguleView): VirguleView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readVirguleViews([...views, { ...view, id, name }]);
}

export function dropVirguleView(views: readonly VirguleView[], id: string): VirguleView[] {
  return views.filter((view) => view.id !== id);
}

export function virguleDensity(raw: unknown): VirguleDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortVirguleRules(cards: readonly Virgule[], sort: VirguleSort): Virgule[] {
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

export function visibleVirguleRules(
  cards: readonly Virgule[],
  tray: VirguleTray,
  query: string,
  keeper: string,
  wash: string,
  part: string,
  tooth: string,
  lock: string,
): Virgule[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantWash = wash === "all" ? "" : virguleWash(wash);
  const wantPart = activePart(part);
  const wantTooth = activeTooth(tooth);
  const wantLock = activeLock(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantWash && card.wash !== wantWash) return false;
    if (wantPart === "inner" && !virguleInner(card.part)) return false;
    if (wantPart === "outer" && !virguleOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantLock !== "all" && String(card.lock) !== wantLock) return false;
    return true;
  });
}

/** An outer limb on beat three, still unpoised and not in the chest, is overdue. */
export function overdueVirgule(card: Virgule): boolean {
  return virguleOuter(card.part) && card.lock === 3 && !card.banked && !card.cased;
}

/** No film, the short pip, beat three, and still on the board. */
export function idleVirgule(card: Virgule): boolean {
  return !card.wash && card.tooth === 3 && card.lock === 3 && !card.banked && !card.latched && !card.cased;
}

/** Gilt, a tall pip, and a full beat, still out of the chest. */
export function briskVirgule(card: Virgule): boolean {
  return card.wash === "GILT" && card.tooth === 12 && card.lock === 9 && !card.cased;
}

/** Dart, ivory, and pip six. */
export function restingVirgule(card: Virgule): boolean {
  return card.part === "dart" && card.wash === "IVORY" && card.tooth === 6;
}

/** A body is late when the station is already on the dart. */
export function lateVirgule(card: Virgule, station: string): boolean {
  return card.part === "body" && virgulePart(station) === "dart" && !card.banked;
}

export function virguleCounts(cards: readonly Virgule[], shown: readonly Virgule[], station: string): VirguleCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    latch: cards.filter((card) => inTray(card, "latch")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    banked: cards.filter((card) => card.banked).length,
    inner: cards.filter((card) => virguleInner(card.part)).length,
    outer: cards.filter((card) => virguleOuter(card.part)).length,
    tall: cards.filter((card) => card.tooth === 12).length,
    quiet: cards.filter((card) => quietWash(card.wash)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleVirgule).length,
    brisk: cards.filter(briskVirgule).length,
    resting: cards.filter(restingVirgule).length,
    overdue: cards.filter(overdueVirgule).length,
    pair: cards.filter((card) => pairLock(card.lock) && lateVirgule(card, station)).length,
  };
}

export function virguleBars(cards: readonly Virgule[]): { part: string; count: number }[] {
  return VRG_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function virguleTimeline(cards: readonly Virgule[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function virguleKeepers(cards: readonly Virgule[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Virgule[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.banked && card.keeper);
  let best = "";
  let score = 0;
  for (const name of virguleKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderVirguleRules(cards: readonly Virgule[]): string[] {
  return cards.filter(overdueVirgule).map((card) => card.title);
}

export function virguleCopy(card: Virgule): string {
  return [card.title, card.keeper, card.part, card.wash, card.tooth ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function virguleCsv(cards: readonly Virgule[], station: string): string {
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
        virguleOuter(card.part) ? "1" : "0",
        lateVirgule(card, station) ? "1" : "0",
        idleVirgule(card) ? "1" : "0",
        briskVirgule(card) ? "1" : "0",
        restingVirgule(card) ? "1" : "0",
        overdueVirgule(card) ? "1" : "0",
        virguleInner(card.part) ? "1" : "0",
        quietWash(card.wash) ? "1" : "0",
        virguleBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const GNT_KEY = "crmv4-gunter-hide";
export const GNT_REVIEW_KEY = "crmv4-gunter-review";

export type GunterLane = "" | "code" | "join" | "gap" | "chip" | "banner" | "mark" | "vowel" | "plain";
export type GunterHue = "" | "ivory" | "graphite" | "champagne";
export type GunterState = "" | "clear" | "set";
export type GunterReview = "all" | "reviewed" | "fresh";
export type GunterShape =
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

export type GunterValue = string | { withdrawalsEnabled?: unknown; [key: string]: unknown } | null | undefined;
export type GunterRow = { id: string; label: string; code: GunterValue };
export type GunterLaneLine = { lane: string; count: number };

const CODE_LANES = ["code", "join", "gap", "chip", "banner", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: GunterValue): { withdrawalsEnabled?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: GunterValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: GunterValue): string {
  const row = codeRecord(raw);
  if (row && !("withdrawalsEnabled" in row)) return "";
  const value = row ? row.withdrawalsEnabled : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "OPEN";
  if (value === false || value === "false" || value === "0" || value === 0) return "HELD";
  return clip(value, 48);
}

function codeReadable(raw: GunterValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("withdrawalsEnabled" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function gunterState(raw: GunterValue): GunterState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known switch is OPEN, HOLD, LOCK, or ASK. A slash contains a slash. A score contains an underscore. A tile is exactly four characters. A scroll is fourteen characters or longer. An index starts with a digit. A twin repeats a letter. */
export function gunterLane(raw: GunterValue): GunterLane {
  if (gunterState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (text === "HELD") return "plain";
  if (GATES.has(text.toUpperCase())) return "code";
  if (text.includes("/")) return "join";
  if (text.includes("_")) return "gap";
  if (text.length === 4) return "chip";
  if (text.length >= 14) return "banner";
  if (/^[0-9]/.test(text)) return "mark";
  if (/(.)\1/i.test(text)) return "vowel";
  return "plain";
}

export function gunterHue(raw: GunterValue): GunterHue {
  const lane = gunterLane(raw);
  if (!lane) return "";
  if (lane === "code" || lane === "mark") return "champagne";
  if (lane === "join" || lane === "gap") return "graphite";
  return "ivory";
}

export function gunterCode(raw: GunterValue): boolean {
  return gunterLane(raw) === "code";
}

export function gunterJoin(raw: GunterValue): boolean {
  return gunterLane(raw) === "join";
}

export function gunterGap(raw: GunterValue): boolean {
  return gunterLane(raw) === "gap";
}

export function gunterChip(raw: GunterValue): boolean {
  return gunterLane(raw) === "chip";
}

export function gunterBanner(raw: GunterValue): boolean {
  return gunterLane(raw) === "banner";
}

export function gunterMark(raw: GunterValue): boolean {
  return gunterLane(raw) === "mark";
}

export function gunterVowelLane(raw: GunterValue): boolean {
  return gunterLane(raw) === "vowel";
}

export function gunterPlain(raw: GunterValue): boolean {
  return gunterLane(raw) === "plain";
}

export function gunterOpen(raw: GunterValue): boolean {
  return gunterState(raw) === "clear";
}

/** A banner or a vowel name can stay as written. */
export function gunterHeld(raw: GunterValue): boolean {
  const lane = gunterLane(raw);
  return lane === "banner" || lane === "vowel";
}

/** A chip, or a two-character name that is not a known region, still wants a fuller name. */
export function gunterSoon(raw: GunterValue): boolean {
  if (gunterState(raw) !== "set") return false;
  if (gunterChip(raw)) return true;
  if (gunterCode(raw)) return false;
  return codeGiven(raw).length === 2;
}

export function gunterLength(raw: GunterValue): number | null {
  if (gunterState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function gunterEven(raw: GunterValue): boolean {
  const length = gunterLength(raw);
  return length !== null && length % 2 === 0;
}

export function gunterOdd(raw: GunterValue): boolean {
  const length = gunterLength(raw);
  return length !== null && length % 2 === 1;
}

export function gunterFirst(raw: GunterValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function gunterTail(raw: GunterValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function gunterCapital(raw: GunterValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function gunterSpace(raw: GunterValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function gunterVowel(raw: GunterValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function gunterDigit(raw: GunterValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function gunterLetter(raw: GunterValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function gunterMixed(raw: GunterValue): boolean {
  return gunterDigit(raw) && gunterLetter(raw);
}

export function gunterLower(raw: GunterValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function gunterUpper(raw: GunterValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function gunterStamp(raw: GunterValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function gunterCopy(raw: GunterValue): string {
  return codeGiven(raw);
}

export function gunterFamily(raw: GunterValue): string {
  if (gunterState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function gunterLanes(rows: readonly GunterRow[]): GunterLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = gunterLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingGunter(rows: readonly GunterRow[]): string {
  const lines = gunterLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingGunterHue(rows: readonly GunterRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = gunterHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneGunterCount(rows: readonly GunterRow[], lane: GunterLane): number {
  return rows.filter((row) => gunterLane(row.code) === lane).length;
}

export function gunterShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGunterLanes(rows: readonly GunterRow[]): string[] {
  return gunterLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenGunter(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGunter(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGunter(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGunterReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGunterReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGunterLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: GunterRow, shape: GunterShape): boolean {
  if (shape === "all") return true;
  if (shape === "code") return gunterCode(row.code);
  if (shape === "join") return gunterJoin(row.code);
  if (shape === "gap") return gunterGap(row.code);
  if (shape === "chip") return gunterChip(row.code);
  if (shape === "banner") return gunterBanner(row.code);
  if (shape === "mark") return gunterMark(row.code);
  if (shape === "vowel") return gunterVowelLane(row.code);
  if (shape === "plain") return gunterPlain(row.code);
  if (shape === "open") return gunterOpen(row.code);
  if (shape === "soon") return gunterSoon(row.code);
  if (shape === "letter") return gunterLetter(row.code);
  if (shape === "mixed") return gunterMixed(row.code);
  if (shape === "upper") return gunterUpper(row.code);
  if (shape === "lower") return gunterLower(row.code);
  if (shape === "space") return gunterSpace(row.code);
  if (shape === "even") return gunterEven(row.code);
  if (shape === "odd") return gunterOdd(row.code);
  if (shape === "tail") return gunterTail(row.code);
  if (shape === "first") return gunterFirst(row.code);
  if (shape === "held") return gunterHeld(row.code);
  return gunterLane(row.code) === shape;
}

export function visibleGunter(
  rows: readonly GunterRow[],
  lane: string,
  hue: string,
  query: string,
  review: GunterReview,
  reviewed: readonly string[],
  shape: GunterShape,
): GunterRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (gunterState(row.code) === "") return false;
    const found = gunterLane(row.code);
    const hueName = gunterHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${gunterStamp(row.code)} ${gunterFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function gunterLanesCsv(rows: readonly GunterRow[]): string {
  const lines = ["lane,count"];
  for (const line of gunterLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function gunterRowsCsv(rows: readonly GunterRow[], reviewed: readonly string[]): string {
  const lines = ["name,switch,stamp,family,lane,hue,length,code,join,gap,chip,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(gunterCopy(row.code)),
        gunterStamp(row.code),
        csvCell(gunterFamily(row.code)),
        gunterLane(row.code),
        gunterHue(row.code),
        gunterLength(row.code) ?? "",
        gunterCode(row.code) ? "1" : "0",
        gunterJoin(row.code) ? "1" : "0",
        gunterGap(row.code) ? "1" : "0",
        gunterChip(row.code) ? "1" : "0",
        gunterEven(row.code) ? "1" : "0",
        gunterDigit(row.code) ? "1" : "0",
        gunterMixed(row.code) ? "1" : "0",
        gunterUpper(row.code) ? "1" : "0",
        gunterVowel(row.code) ? "1" : "0",
        gunterTail(row.code) ? "1" : "0",
        gunterHeld(row.code) ? "1" : "0",
        gunterSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
