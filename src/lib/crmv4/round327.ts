/**
 * Cylinder rules for a cylinder escapement kept in this browser, and rete plates read the last region already stored on the account.
 * Parts are shell, arbor, banking, and impulse. Washes are gilt, ivory, and graphite.
 * Teeth are 4, 8, 12, or 16. Lifts are 2, 4, or 8.
 * A known region is EU, AS, AF, NA, SA, or OC. A join contains a hyphen. A gap contains a space.
 * A chip is exactly three characters. A banner is eighteen characters or longer. A mark contains a digit. A vowel starts with a vowel.
 * A true region reads as EU. A false region reads as NO REGION.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cylinder (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   part text not null default '',
 *   tooth_no integer,
 *   wash text not null default '',
 *   lift_no integer not null default 2,
 *   tags text not null default '',
 *   banked boolean not null default false,
 *   latched boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_rete_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_rete_review (
 *   trader_id text primary key
 * );
 */


export const CYL_KEY = "crmv4-cylinder";
export const CYL_VIEW_KEY = "crmv4-cylinder-views";
export const CYL_DENSITY_KEY = "crmv4-cylinder-density";
export const CYL_PARTS = ["shell", "arbor", "banking", "impulse"] as const;

export type CylinderPart = (typeof CYL_PARTS)[number];
export type CylinderWash = "blank" | "gilt" | "ivory" | "graphite";
export type CylinderTray = "bench" | "latch" | "case";
export type CylinderDensity = "airy" | "close";
export type CylinderSort = "part" | "keeper";

export type Cylinder = {
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

export type CylinderView = {
  id: string;
  name: string;
  tray: CylinderTray;
  query: string;
  keeper: string;
  wash: string;
  part: string;
  tooth: string;
  lock: string;
};

export type CylinderCounts = {
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

export const ROUND327_FEATURES = [
  "cylinder-save",
  "notice-center",
  "shell-parts",
  "quick-search",
  "lift-sla",
  "vault",
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
  "region-rete",
  "rete-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wash", "bank", "free", "latch", "return", "case", "open", "tag", "lock", "tooth", "lower", "star"] as const;
const WASHES = ["gilt", "ivory", "graphite"] as const;
const TOOTH_CYCLE = [4, 8, 12, 16] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["shell", "arbor"]);
const OUTER = new Set(["banking", "impulse"]);
const QUIET_WASH = new Set(["IVORY", "GRAPHITE"]);
const REGIONS = new Set(["EU", "AS", "AF", "NA", "SA", "OC"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CylinderTray {
  return raw === "latch" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function washName(raw: unknown): Exclude<CylinderWash, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WASHES as readonly string[]).includes(text) ? (text as Exclude<CylinderWash, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cy]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Cylinder, tray: CylinderTray): boolean {
  if (tray === "latch") return card.latched && !card.cased;
  if (tray === "case") return card.cased;
  return !card.latched && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return CYL_PARTS.indexOf(part as CylinderPart);
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

export function cylinderPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CYL_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A tooth is 4, 8, 12, or 16. Anything else stays blank. */
export function cylinderTooth(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A lift is 2, 4, or 8. Anything else stays blank. */
export function cylinderLock(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A wash is gilt, ivory, or graphite. The saved name is the upper token. */
export function cylinderWash(raw: unknown): string {
  const text = washName(raw);
  return text ? text.toUpperCase() : "";
}

export function cylinderInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function cylinderOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Shell is the lip. Arbor is the pin. Banking is the rail. Impulse is the kick. */
export function cylinderBand(part: unknown): string {
  const text = cylinderPart(part);
  if (!text) return "";
  if (text === "shell") return "lip";
  if (text === "arbor") return "pin";
  if (text === "banking") return "rail";
  return "kick";
}

/** Signed distance from one part to another along the cylinder. */
export function cylinderGap(from: unknown, to: unknown): number | null {
  const left = partIndex(cylinderPart(from));
  const right = partIndex(cylinderPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietWash(wash: unknown): boolean {
  return QUIET_WASH.has(cylinderWash(wash));
}

/** A pair lift is 4. Two and eight are not a pair. */
export function pairLock(lock: unknown): boolean {
  return cylinderLock(lock) === 4;
}

/** A full lift is 8. */
export function fullLock(lock: unknown): boolean {
  return cylinderLock(lock) === 8;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return cylinderPart(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = cylinderTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeWash(raw: unknown, allow: readonly string[]): string {
  const text = cylinderWash(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLock(raw: unknown): string {
  const lock = cylinderLock(raw);
  return lock === null ? "all" : String(lock);
}

export function moveCylinderFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wash the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestWash(cards: readonly Cylinder[]): string {
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
export function suggestTooth(cards: readonly Cylinder[], hour: number): 4 | 8 | 12 | 16 {
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
  if (hour < 5) return 4;
  if (hour < 11) return 8;
  if (hour < 17) return 12;
  return 16;
}

/** Before nine, suggest the shell. The rest of the day suggests the impulse. */
export function suggestPart(hour: number): CylinderPart {
  return hour < 9 ? "shell" : "impulse";
}

/** The keeper with the fewest unbanked cards on the bench. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Cylinder[], roster: string): string {
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

export function readCylinderRules(raw: unknown): Cylinder[] {
  if (!Array.isArray(raw)) return [];
  const out: Cylinder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cylinder>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      part: cylinderPart(row.part),
      tooth: cylinderTooth(row.tooth),
      wash: cylinderWash(row.wash),
      lock: cylinderLock(row.lock) ?? 2,
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

export function addCylinder(
  cards: readonly Cylinder[],
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
): Cylinder[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCylinderRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      part: cylinderPart(card.part),
      tooth: cylinderTooth(card.tooth),
      wash: cylinderWash(card.wash),
      lock: cylinderLock(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      banked: false,
      latched: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cylinder[], id: string, edit: (card: Cylinder) => Cylinder): Cylinder[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCylinder(cards: readonly Cylinder[], id: string, title: string): Cylinder[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCylinderNote(cards: readonly Cylinder[], id: string, note: string): Cylinder[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWash(wash: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(cylinderWash(wash));
  return order[(index + 1) % order.length] || "GILT";
}

export function setCylinderWash(cards: readonly Cylinder[], id: string, wash: string): Cylinder[] {
  const next = cylinderWash(wash);
  return mapCard(cards, id, (card) => (card.wash === next ? card : { ...card, wash: next, audit: "wash" }));
}

export function setCylinderBank(cards: readonly Cylinder[], id: string, banked: boolean): Cylinder[] {
  return mapCard(cards, id, (card) => (card.banked === banked ? card : { ...card, banked, audit: banked ? "bank" : "free" }));
}

export function setCylinderLatch(cards: readonly Cylinder[], id: string, latched: boolean): Cylinder[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, cased: latched ? false : card.cased, audit: latched ? "latch" : "return" }));
}

export function setCylinderCase(cards: readonly Cylinder[], id: string, cased: boolean): Cylinder[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, latched: cased ? false : card.latched, audit: cased ? "case" : "open" }));
}

export function setCylinderStar(cards: readonly Cylinder[], id: string, starred: boolean): Cylinder[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addCylinderTag(cards: readonly Cylinder[], id: string, tag: string): Cylinder[] {
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

export function raiseTooth(cards: readonly Cylinder[], id: string): Cylinder[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Cylinder[], id: string): Cylinder[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseLock(cards: readonly Cylinder[], id: string): Cylinder[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerLock(cards: readonly Cylinder[], id: string): Cylinder[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setCylinderFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, banked: !card.banked, audit: card.banked ? "free" : "bank" })) : [...cards];
}

export function latchCylinderFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return setCylinderLatch(cards, id, !cards.find((card) => card.id === id)?.latched);
}

export function starCylinderFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return setCylinderStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function washFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCylinderWash(cards, id, cycleWash(card.wash)) : [...cards];
}

export function raiseToothFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return lowerTooth(cards, id);
}

export function raiseLockFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return raiseLock(cards, id);
}

export function lowerLockFocused(cards: readonly Cylinder[], id: string): Cylinder[] {
  return lowerLock(cards, id);
}

function bulk(cards: readonly Cylinder[], ids: readonly string[], edit: (card: Cylinder) => Cylinder): Cylinder[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCylinderGraphite(cards: readonly Cylinder[], ids: readonly string[]): Cylinder[] {
  return bulk(cards, ids, (card) => (card.wash === "GRAPHITE" ? card : { ...card, wash: "GRAPHITE", audit: "wash" }));
}

export function bulkCylinderBank(cards: readonly Cylinder[], ids: readonly string[]): Cylinder[] {
  return bulk(cards, ids, (card) => (card.banked ? card : { ...card, banked: true, audit: "bank" }));
}

export function bulkCylinderCase(cards: readonly Cylinder[], ids: readonly string[]): Cylinder[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, latched: false, audit: "case" }));
}

export function bulkCylinderTag(cards: readonly Cylinder[], ids: readonly string[]): Cylinder[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readCylinderViews(raw: unknown): CylinderView[] {
  if (!Array.isArray(raw)) return [];
  const out: CylinderView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CylinderView>;
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

export function addCylinderView(views: readonly CylinderView[], view: CylinderView): CylinderView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCylinderViews([...views, { ...view, id, name }]);
}

export function dropCylinderView(views: readonly CylinderView[], id: string): CylinderView[] {
  return views.filter((view) => view.id !== id);
}

export function cylinderDensity(raw: unknown): CylinderDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortCylinderRules(cards: readonly Cylinder[], sort: CylinderSort): Cylinder[] {
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

export function visibleCylinderRules(
  cards: readonly Cylinder[],
  tray: CylinderTray,
  query: string,
  keeper: string,
  wash: string,
  part: string,
  tooth: string,
  lock: string,
): Cylinder[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantWash = wash === "all" ? "" : cylinderWash(wash);
  const wantPart = activePart(part);
  const wantTooth = activeTooth(tooth);
  const wantLock = activeLock(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantWash && card.wash !== wantWash) return false;
    if (wantPart === "inner" && !cylinderInner(card.part)) return false;
    if (wantPart === "outer" && !cylinderOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantLock !== "all" && String(card.lock) !== wantLock) return false;
    return true;
  });
}

/** An outer part on lift two, still unbanked and not in the case, is overdue. */
export function overdueCylinder(card: Cylinder): boolean {
  return cylinderOuter(card.part) && card.lock === 2 && !card.banked && !card.cased;
}

/** No wash, the short tooth, lift two, and still on the bench. */
export function idleCylinder(card: Cylinder): boolean {
  return !card.wash && card.tooth === 4 && card.lock === 2 && !card.banked && !card.latched && !card.cased;
}

/** Gilt, a tall tooth, and a full lift, still out of the case. */
export function briskCylinder(card: Cylinder): boolean {
  return card.wash === "GILT" && card.tooth === 16 && card.lock === 8 && !card.cased;
}

/** Impulse, ivory, and tooth eight. */
export function restingCylinder(card: Cylinder): boolean {
  return card.part === "impulse" && card.wash === "IVORY" && card.tooth === 8;
}

/** A shell is late when the station is already on the impulse. */
export function lateCylinder(card: Cylinder, station: string): boolean {
  return card.part === "shell" && cylinderPart(station) === "impulse" && !card.banked;
}

export function cylinderCounts(cards: readonly Cylinder[], shown: readonly Cylinder[], station: string): CylinderCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    latch: cards.filter((card) => inTray(card, "latch")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    banked: cards.filter((card) => card.banked).length,
    inner: cards.filter((card) => cylinderInner(card.part)).length,
    outer: cards.filter((card) => cylinderOuter(card.part)).length,
    tall: cards.filter((card) => card.tooth === 16).length,
    quiet: cards.filter((card) => quietWash(card.wash)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleCylinder).length,
    brisk: cards.filter(briskCylinder).length,
    resting: cards.filter(restingCylinder).length,
    overdue: cards.filter(overdueCylinder).length,
    pair: cards.filter((card) => pairLock(card.lock) && lateCylinder(card, station)).length,
  };
}

export function cylinderBars(cards: readonly Cylinder[]): { part: string; count: number }[] {
  return CYL_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function cylinderTimeline(cards: readonly Cylinder[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function cylinderKeepers(cards: readonly Cylinder[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Cylinder[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.banked && card.keeper);
  let best = "";
  let score = 0;
  for (const name of cylinderKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCylinderRules(cards: readonly Cylinder[]): string[] {
  return cards.filter(overdueCylinder).map((card) => card.title);
}

export function cylinderCopy(card: Cylinder): string {
  return [card.title, card.keeper, card.part, card.wash, card.tooth ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function cylinderCsv(cards: readonly Cylinder[], station: string): string {
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
        cylinderOuter(card.part) ? "1" : "0",
        lateCylinder(card, station) ? "1" : "0",
        idleCylinder(card) ? "1" : "0",
        briskCylinder(card) ? "1" : "0",
        restingCylinder(card) ? "1" : "0",
        overdueCylinder(card) ? "1" : "0",
        cylinderInner(card.part) ? "1" : "0",
        quietWash(card.wash) ? "1" : "0",
        cylinderBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const RTE_KEY = "crmv4-rete-hide";
export const RTE_REVIEW_KEY = "crmv4-rete-review";

export type ReteLane = "" | "code" | "join" | "gap" | "chip" | "banner" | "mark" | "vowel" | "plain";
export type ReteHue = "" | "ivory" | "graphite" | "champagne";
export type ReteState = "" | "clear" | "set";
export type ReteReview = "all" | "reviewed" | "fresh";
export type ReteShape =
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

export type ReteValue = string | { lastRegion?: unknown; [key: string]: unknown } | null | undefined;
export type ReteRow = { id: string; label: string; code: ReteValue };
export type ReteLaneLine = { lane: string; count: number };

const CODE_LANES = ["code", "join", "gap", "chip", "banner", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: ReteValue): { lastRegion?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ReteValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ReteValue): string {
  const row = codeRecord(raw);
  if (row && !("lastRegion" in row)) return "";
  const value = row ? row.lastRegion : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "EU";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO REGION";
  return clip(value, 48);
}

function codeReadable(raw: ReteValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastRegion" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function reteState(raw: ReteValue): ReteState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known region is EU, AS, AF, NA, SA, or OC. A join contains a hyphen. A gap contains a space. A chip is exactly three characters. A banner is eighteen characters or longer. A mark contains a digit. A vowel starts with a vowel. */
export function reteLane(raw: ReteValue): ReteLane {
  if (reteState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (text === "NO REGION") return "plain";
  if (REGIONS.has(text.toUpperCase())) return "code";
  if (text.includes("-")) return "join";
  if (text.includes(" ")) return "gap";
  if (text.length === 3) return "chip";
  if (text.length >= 18) return "banner";
  if (/[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function reteHue(raw: ReteValue): ReteHue {
  const lane = reteLane(raw);
  if (!lane) return "";
  if (lane === "code" || lane === "mark") return "champagne";
  if (lane === "join" || lane === "gap") return "graphite";
  return "ivory";
}

export function reteCode(raw: ReteValue): boolean {
  return reteLane(raw) === "code";
}

export function reteJoin(raw: ReteValue): boolean {
  return reteLane(raw) === "join";
}

export function reteGap(raw: ReteValue): boolean {
  return reteLane(raw) === "gap";
}

export function reteChip(raw: ReteValue): boolean {
  return reteLane(raw) === "chip";
}

export function reteBanner(raw: ReteValue): boolean {
  return reteLane(raw) === "banner";
}

export function reteMark(raw: ReteValue): boolean {
  return reteLane(raw) === "mark";
}

export function reteVowelLane(raw: ReteValue): boolean {
  return reteLane(raw) === "vowel";
}

export function retePlain(raw: ReteValue): boolean {
  return reteLane(raw) === "plain";
}

export function reteOpen(raw: ReteValue): boolean {
  return reteState(raw) === "clear";
}

/** A banner or a vowel name can stay as written. */
export function reteHeld(raw: ReteValue): boolean {
  const lane = reteLane(raw);
  return lane === "banner" || lane === "vowel";
}

/** A chip, or a two-character name that is not a known region, still wants a fuller name. */
export function reteSoon(raw: ReteValue): boolean {
  if (reteState(raw) !== "set") return false;
  if (reteChip(raw)) return true;
  if (reteCode(raw)) return false;
  return codeGiven(raw).length === 2;
}

export function reteLength(raw: ReteValue): number | null {
  if (reteState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function reteEven(raw: ReteValue): boolean {
  const length = reteLength(raw);
  return length !== null && length % 2 === 0;
}

export function reteOdd(raw: ReteValue): boolean {
  const length = reteLength(raw);
  return length !== null && length % 2 === 1;
}

export function reteFirst(raw: ReteValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function reteTail(raw: ReteValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function reteCapital(raw: ReteValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function reteSpace(raw: ReteValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function reteVowel(raw: ReteValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function reteDigit(raw: ReteValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function reteLetter(raw: ReteValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function reteMixed(raw: ReteValue): boolean {
  return reteDigit(raw) && reteLetter(raw);
}

export function reteLower(raw: ReteValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function reteUpper(raw: ReteValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function reteStamp(raw: ReteValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function reteCopy(raw: ReteValue): string {
  return codeGiven(raw);
}

export function reteFamily(raw: ReteValue): string {
  if (reteState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function reteLanes(rows: readonly ReteRow[]): ReteLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = reteLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRete(rows: readonly ReteRow[]): string {
  const lines = reteLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingReteHue(rows: readonly ReteRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = reteHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneReteCount(rows: readonly ReteRow[], lane: ReteLane): number {
  return rows.filter((row) => reteLane(row.code) === lane).length;
}

export function reteShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentReteLanes(rows: readonly ReteRow[]): string[] {
  return reteLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenRete(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRete(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRete(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleReteReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkReteReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleReteLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: ReteRow, shape: ReteShape): boolean {
  if (shape === "all") return true;
  if (shape === "code") return reteCode(row.code);
  if (shape === "join") return reteJoin(row.code);
  if (shape === "gap") return reteGap(row.code);
  if (shape === "chip") return reteChip(row.code);
  if (shape === "banner") return reteBanner(row.code);
  if (shape === "mark") return reteMark(row.code);
  if (shape === "vowel") return reteVowelLane(row.code);
  if (shape === "plain") return retePlain(row.code);
  if (shape === "open") return reteOpen(row.code);
  if (shape === "soon") return reteSoon(row.code);
  if (shape === "letter") return reteLetter(row.code);
  if (shape === "mixed") return reteMixed(row.code);
  if (shape === "upper") return reteUpper(row.code);
  if (shape === "lower") return reteLower(row.code);
  if (shape === "space") return reteSpace(row.code);
  if (shape === "even") return reteEven(row.code);
  if (shape === "odd") return reteOdd(row.code);
  if (shape === "tail") return reteTail(row.code);
  if (shape === "first") return reteFirst(row.code);
  if (shape === "held") return reteHeld(row.code);
  return reteLane(row.code) === shape;
}

export function visibleRete(
  rows: readonly ReteRow[],
  lane: string,
  hue: string,
  query: string,
  review: ReteReview,
  reviewed: readonly string[],
  shape: ReteShape,
): ReteRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (reteState(row.code) === "") return false;
    const found = reteLane(row.code);
    const hueName = reteHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${reteStamp(row.code)} ${reteFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function reteLanesCsv(rows: readonly ReteRow[]): string {
  const lines = ["lane,count"];
  for (const line of reteLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function reteRowsCsv(rows: readonly ReteRow[], reviewed: readonly string[]): string {
  const lines = ["name,region,stamp,family,lane,hue,length,code,join,gap,chip,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(reteCopy(row.code)),
        reteStamp(row.code),
        csvCell(reteFamily(row.code)),
        reteLane(row.code),
        reteHue(row.code),
        reteLength(row.code) ?? "",
        reteCode(row.code) ? "1" : "0",
        reteJoin(row.code) ? "1" : "0",
        reteGap(row.code) ? "1" : "0",
        reteChip(row.code) ? "1" : "0",
        reteEven(row.code) ? "1" : "0",
        reteDigit(row.code) ? "1" : "0",
        reteMixed(row.code) ? "1" : "0",
        reteUpper(row.code) ? "1" : "0",
        reteVowel(row.code) ? "1" : "0",
        reteTail(row.code) ? "1" : "0",
        reteHeld(row.code) ? "1" : "0",
        reteSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
