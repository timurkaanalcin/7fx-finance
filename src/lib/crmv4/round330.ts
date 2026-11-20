/**
 * Contrate rules for a contrate wheel kept in this browser, and jacquemart plates read the login gate already stored on the account.
 * Parts are pinion, wheel, arbor, and staff. Glazes are gilt, ivory, and graphite.
 * Leaves are 3, 6, 9, or 12. Ticks are 1, 3, or 5.
 * A known gate is IN, HOLD, PAIR, or ASK. A slash contains a slash. A colon contains a colon.
 * A tile is exactly four characters. A ribbon is fourteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true gate reads as IN. A false gate reads as OUT.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_contrate (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   part text not null default '',
 *   leaf_no integer,
 *   glaze text not null default '',
 *   tick_no integer not null default 1,
 *   tags text not null default '',
 *   seated boolean not null default false,
 *   pegged boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_jacquemart_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_jacquemart_review (
 *   trader_id text primary key
 * );
 */
export const CTR_KEY = "crmv4-contrate";
export const CTR_VIEW_KEY = "crmv4-contrate-views";
export const CTR_DENSITY_KEY = "crmv4-contrate-density";
export const CTR_PARTS = ["pinion", "wheel", "arbor", "staff"] as const;

export type ContratePart = (typeof CTR_PARTS)[number];
export type ContrateWash = "blank" | "gilt" | "ivory" | "graphite";
export type ContrateTray = "bench" | "latch" | "case";
export type ContrateDensity = "airy" | "close";
export type ContrateSort = "part" | "keeper";

export type Contrate = {
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

export type ContrateView = {
  id: string;
  name: string;
  tray: ContrateTray;
  query: string;
  keeper: string;
  wash: string;
  part: string;
  tooth: string;
  lock: string;
};

export type ContrateCounts = {
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

export const ROUND330_FEATURES = [
  "contrate-save",
  "notice-center",
  "pinion-parts",
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
  "login-jacquemart",
  "jacquemart-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wash", "bank", "free", "latch", "return", "case", "open", "tag", "lock", "tooth", "lower", "star"] as const;
const WASHES = ["gilt", "ivory", "graphite"] as const;
const TOOTH_CYCLE = [3, 6, 9, 12] as const;
const LOCK_CYCLE = [1, 3, 5] as const;
const INNER = new Set(["pinion", "wheel"]);
const OUTER = new Set(["arbor", "staff"]);
const QUIET_WASH = new Set(["IVORY", "GRAPHITE"]);
const GATES = new Set(["IN", "HOLD", "PAIR", "ASK"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ContrateTray {
  return raw === "latch" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function washName(raw: unknown): Exclude<ContrateWash, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WASHES as readonly string[]).includes(text) ? (text as Exclude<ContrateWash, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Contrate, tray: ContrateTray): boolean {
  if (tray === "latch") return card.latched && !card.cased;
  if (tray === "case") return card.cased;
  return !card.latched && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return CTR_PARTS.indexOf(part as ContratePart);
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

export function contratePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CTR_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A leaf is 3, 6, 9, or 12. Anything else stays blank. */
export function contrateTooth(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A tick is 1, 3, or 5. Anything else stays blank. */
export function contrateLock(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** A glaze is gilt, ivory, or graphite. The saved name is the upper token. */
export function contrateWash(raw: unknown): string {
  const text = washName(raw);
  return text ? text.toUpperCase() : "";
}

export function contrateInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function contrateOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Mesh is the pinion. Rim is the wheel. Axle is the arbor. Stave is the staff. */
export function contrateBand(part: unknown): string {
  const text = contratePart(part);
  if (!text) return "";
  if (text === "pinion") return "mesh";
  if (text === "wheel") return "rim";
  if (text === "arbor") return "axle";
  return "stave";
}

/** Signed distance from one part to another along the contrate wheel. */
export function contrateGap(from: unknown, to: unknown): number | null {
  const left = partIndex(contratePart(from));
  const right = partIndex(contratePart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietWash(wash: unknown): boolean {
  return QUIET_WASH.has(contrateWash(wash));
}

/** A pair tick is 3. One and five are not a pair. */
export function pairLock(lock: unknown): boolean {
  return contrateLock(lock) === 3;
}

/** A full tick is 5. */
export function fullLock(lock: unknown): boolean {
  return contrateLock(lock) === 5;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return contratePart(text) || "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = contrateTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeWash(raw: unknown, allow: readonly string[]): string {
  const text = contrateWash(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLock(raw: unknown): string {
  const lock = contrateLock(raw);
  return lock === null ? "all" : String(lock);
}

export function moveContrateFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The glaze the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestWash(cards: readonly Contrate[]): string {
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

/** Before five, suggest leaf three. Before eleven, suggest leaf six. Before five in the evening, suggest leaf nine. Later, suggest leaf twelve. A saved leaf on the board wins, and a tie keeps the shorter leaf. */
export function suggestTooth(cards: readonly Contrate[], hour: number): 3 | 6 | 9 | 12 {
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

/** Before ten, suggest the pinion. The rest of the day suggests the staff. */
export function suggestPart(hour: number): ContratePart {
  return hour < 10 ? "pinion" : "staff";
}

/** The keeper with the fewest unseated cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Contrate[], roster: string): string {
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

export function readContrateRules(raw: unknown): Contrate[] {
  if (!Array.isArray(raw)) return [];
  const out: Contrate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Contrate>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      part: contratePart(row.part),
      tooth: contrateTooth(row.tooth),
      wash: contrateWash(row.wash),
      lock: contrateLock(row.lock) ?? 1,
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

export function addContrate(
  cards: readonly Contrate[],
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
): Contrate[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readContrateRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      part: contratePart(card.part),
      tooth: contrateTooth(card.tooth),
      wash: contrateWash(card.wash),
      lock: contrateLock(card.lock) ?? 1,
      tags: tagsOf(card.tags),
      banked: false,
      latched: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Contrate[], id: string, edit: (card: Contrate) => Contrate): Contrate[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editContrate(cards: readonly Contrate[], id: string, title: string): Contrate[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editContrateNote(cards: readonly Contrate[], id: string, note: string): Contrate[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWash(wash: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(contrateWash(wash));
  return order[(index + 1) % order.length] || "GILT";
}

export function setContrateWash(cards: readonly Contrate[], id: string, wash: string): Contrate[] {
  const next = contrateWash(wash);
  return mapCard(cards, id, (card) => (card.wash === next ? card : { ...card, wash: next, audit: "wash" }));
}

export function setContrateBank(cards: readonly Contrate[], id: string, banked: boolean): Contrate[] {
  return mapCard(cards, id, (card) => (card.banked === banked ? card : { ...card, banked, audit: banked ? "bank" : "free" }));
}

export function setContrateLatch(cards: readonly Contrate[], id: string, latched: boolean): Contrate[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, cased: latched ? false : card.cased, audit: latched ? "latch" : "return" }));
}

export function setContrateCase(cards: readonly Contrate[], id: string, cased: boolean): Contrate[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, latched: cased ? false : card.latched, audit: cased ? "case" : "open" }));
}

export function setContrateStar(cards: readonly Contrate[], id: string, starred: boolean): Contrate[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addContrateTag(cards: readonly Contrate[], id: string, tag: string): Contrate[] {
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

function stepLock(lock: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseTooth(cards: readonly Contrate[], id: string): Contrate[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, 1), audit: "tooth" }));
}

export function lowerTooth(cards: readonly Contrate[], id: string): Contrate[] {
  return mapCard(cards, id, (card) => ({ ...card, tooth: stepTooth(card.tooth, -1), audit: "lower" }));
}

export function raiseLock(cards: readonly Contrate[], id: string): Contrate[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerLock(cards: readonly Contrate[], id: string): Contrate[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setContrateFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, banked: !card.banked, audit: card.banked ? "free" : "bank" })) : [...cards];
}

export function latchContrateFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return setContrateLatch(cards, id, !cards.find((card) => card.id === id)?.latched);
}

export function starContrateFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return setContrateStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function washFocused(cards: readonly Contrate[], id: string): Contrate[] {
  const card = cards.find((item) => item.id === id);
  return card ? setContrateWash(cards, id, cycleWash(card.wash)) : [...cards];
}

export function raiseToothFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return raiseTooth(cards, id);
}

export function lowerToothFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return lowerTooth(cards, id);
}

export function raiseLockFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return raiseLock(cards, id);
}

export function lowerLockFocused(cards: readonly Contrate[], id: string): Contrate[] {
  return lowerLock(cards, id);
}

function bulk(cards: readonly Contrate[], ids: readonly string[], edit: (card: Contrate) => Contrate): Contrate[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkContrateGraphite(cards: readonly Contrate[], ids: readonly string[]): Contrate[] {
  return bulk(cards, ids, (card) => (card.wash === "GRAPHITE" ? card : { ...card, wash: "GRAPHITE", audit: "wash" }));
}

export function bulkContrateBank(cards: readonly Contrate[], ids: readonly string[]): Contrate[] {
  return bulk(cards, ids, (card) => (card.banked ? card : { ...card, banked: true, audit: "bank" }));
}

export function bulkContrateCase(cards: readonly Contrate[], ids: readonly string[]): Contrate[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, latched: false, audit: "case" }));
}

export function bulkContrateTag(cards: readonly Contrate[], ids: readonly string[]): Contrate[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readContrateViews(raw: unknown): ContrateView[] {
  if (!Array.isArray(raw)) return [];
  const out: ContrateView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ContrateView>;
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

export function addContrateView(views: readonly ContrateView[], view: ContrateView): ContrateView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readContrateViews([...views, { ...view, id, name }]);
}

export function dropContrateView(views: readonly ContrateView[], id: string): ContrateView[] {
  return views.filter((view) => view.id !== id);
}

export function contrateDensity(raw: unknown): ContrateDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortContrateRules(cards: readonly Contrate[], sort: ContrateSort): Contrate[] {
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

export function visibleContrateRules(
  cards: readonly Contrate[],
  tray: ContrateTray,
  query: string,
  keeper: string,
  wash: string,
  part: string,
  tooth: string,
  lock: string,
): Contrate[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantWash = wash === "all" ? "" : contrateWash(wash);
  const wantPart = activePart(part);
  const wantTooth = activeTooth(tooth);
  const wantLock = activeLock(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantWash && card.wash !== wantWash) return false;
    if (wantPart === "inner" && !contrateInner(card.part)) return false;
    if (wantPart === "outer" && !contrateOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantTooth !== "all" && String(card.tooth ?? "") !== wantTooth) return false;
    if (wantLock !== "all" && String(card.lock) !== wantLock) return false;
    return true;
  });
}

/** An outer part on tick one, still unseated and not in the coffer, is overdue. */
export function overdueContrate(card: Contrate): boolean {
  return contrateOuter(card.part) && card.lock === 1 && !card.banked && !card.cased;
}

/** No glaze, the short leaf, tick one, and still on the board. */
export function idleContrate(card: Contrate): boolean {
  return !card.wash && card.tooth === 3 && card.lock === 1 && !card.banked && !card.latched && !card.cased;
}

/** Gilt, the tall leaf, and a full tick, still out of the coffer. */
export function briskContrate(card: Contrate): boolean {
  return card.wash === "GILT" && card.tooth === 12 && card.lock === 5 && !card.cased;
}

/** Barrel, ivory, and pip eight. */
export function restingContrate(card: Contrate): boolean {
  return card.part === "staff" && card.wash === "IVORY" && card.tooth === 6;
}

/** A pinion is late when the station is already on the staff. */
export function lateContrate(card: Contrate, station: string): boolean {
  return card.part === "pinion" && contratePart(station) === "staff" && !card.banked;
}

export function contrateCounts(cards: readonly Contrate[], shown: readonly Contrate[], station: string): ContrateCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    latch: cards.filter((card) => inTray(card, "latch")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    banked: cards.filter((card) => card.banked).length,
    inner: cards.filter((card) => contrateInner(card.part)).length,
    outer: cards.filter((card) => contrateOuter(card.part)).length,
    tall: cards.filter((card) => card.tooth === 12).length,
    quiet: cards.filter((card) => quietWash(card.wash)).length,
    tooth: cards.reduce((sum, card) => sum + (card.tooth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleContrate).length,
    brisk: cards.filter(briskContrate).length,
    resting: cards.filter(restingContrate).length,
    overdue: cards.filter(overdueContrate).length,
    pair: cards.filter((card) => pairLock(card.lock) && lateContrate(card, station)).length,
  };
}

export function contrateBars(cards: readonly Contrate[]): { part: string; count: number }[] {
  return CTR_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function contrateTimeline(cards: readonly Contrate[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function contrateKeepers(cards: readonly Contrate[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Contrate[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.banked && card.keeper);
  let best = "";
  let score = 0;
  for (const name of contrateKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderContrateRules(cards: readonly Contrate[]): string[] {
  return cards.filter(overdueContrate).map((card) => card.title);
}

export function contrateCopy(card: Contrate): string {
  return [card.title, card.keeper, card.part, card.wash, card.tooth ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function contrateCsv(cards: readonly Contrate[], station: string): string {
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
        contrateOuter(card.part) ? "1" : "0",
        lateContrate(card, station) ? "1" : "0",
        idleContrate(card) ? "1" : "0",
        briskContrate(card) ? "1" : "0",
        restingContrate(card) ? "1" : "0",
        overdueContrate(card) ? "1" : "0",
        contrateInner(card.part) ? "1" : "0",
        quietWash(card.wash) ? "1" : "0",
        contrateBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const JCQ_KEY = "crmv4-jacquemart-hide";
export const JCQ_REVIEW_KEY = "crmv4-jacquemart-review";

export type JacquemartLane = "" | "code" | "join" | "gap" | "chip" | "banner" | "mark" | "vowel" | "plain";
export type JacquemartHue = "" | "ivory" | "graphite" | "champagne";
export type JacquemartState = "" | "clear" | "set";
export type JacquemartReview = "all" | "reviewed" | "fresh";
export type JacquemartShape =
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

export type JacquemartValue = string | { loginEnabled?: unknown; [key: string]: unknown } | null | undefined;
export type JacquemartRow = { id: string; label: string; code: JacquemartValue };
export type JacquemartLaneLine = { lane: string; count: number };

const CODE_LANES = ["code", "join", "gap", "chip", "banner", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: JacquemartValue): { loginEnabled?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: JacquemartValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: JacquemartValue): string {
  const row = codeRecord(raw);
  if (row && !("loginEnabled" in row)) return "";
  const value = row ? row.loginEnabled : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "IN";
  if (value === false || value === "false" || value === "0" || value === 0) return "OUT";
  return clip(value, 48);
}

function codeReadable(raw: JacquemartValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("loginEnabled" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function jacquemartState(raw: JacquemartValue): JacquemartState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known gate is IN, HOLD, PAIR, or ASK. A slash contains a slash. A colon contains a colon. A tile is exactly four characters. A ribbon is fourteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function jacquemartLane(raw: JacquemartValue): JacquemartLane {
  if (jacquemartState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (text === "OUT") return "plain";
  if (GATES.has(text.toUpperCase())) return "code";
  if (text.includes("/")) return "join";
  if (text.includes(":")) return "gap";
  if (text.length === 4) return "chip";
  if (text.length >= 14) return "banner";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function jacquemartHue(raw: JacquemartValue): JacquemartHue {
  const lane = jacquemartLane(raw);
  if (!lane) return "";
  if (lane === "code" || lane === "chip") return "champagne";
  if (lane === "join" || lane === "gap" || lane === "banner") return "graphite";
  return "ivory";
}

export function jacquemartCode(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "code";
}

export function jacquemartJoin(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "join";
}

export function jacquemartGap(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "gap";
}

export function jacquemartChip(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "chip";
}

export function jacquemartBanner(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "banner";
}

export function jacquemartMark(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "mark";
}

export function jacquemartVowelLane(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "vowel";
}

export function jacquemartPlain(raw: JacquemartValue): boolean {
  return jacquemartLane(raw) === "plain";
}

export function jacquemartOpen(raw: JacquemartValue): boolean {
  return jacquemartState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function jacquemartHeld(raw: JacquemartValue): boolean {
  const lane = jacquemartLane(raw);
  return lane === "banner" || lane === "mark";
}

/** A tile, or a six-character name that is not a known gate, still wants a fuller name. */
export function jacquemartSoon(raw: JacquemartValue): boolean {
  if (jacquemartState(raw) !== "set") return false;
  if (jacquemartChip(raw)) return true;
  if (jacquemartCode(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function jacquemartLength(raw: JacquemartValue): number | null {
  if (jacquemartState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function jacquemartEven(raw: JacquemartValue): boolean {
  const length = jacquemartLength(raw);
  return length !== null && length % 2 === 0;
}

export function jacquemartOdd(raw: JacquemartValue): boolean {
  const length = jacquemartLength(raw);
  return length !== null && length % 2 === 1;
}

export function jacquemartFirst(raw: JacquemartValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function jacquemartTail(raw: JacquemartValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function jacquemartCapital(raw: JacquemartValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function jacquemartSpace(raw: JacquemartValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function jacquemartVowel(raw: JacquemartValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function jacquemartDigit(raw: JacquemartValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function jacquemartLetter(raw: JacquemartValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function jacquemartMixed(raw: JacquemartValue): boolean {
  return jacquemartDigit(raw) && jacquemartLetter(raw);
}

export function jacquemartLower(raw: JacquemartValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital tile is four letters or more, written entirely in capitals. */
export function jacquemartUpper(raw: JacquemartValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function jacquemartStamp(raw: JacquemartValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function jacquemartCopy(raw: JacquemartValue): string {
  return codeGiven(raw);
}

export function jacquemartFamily(raw: JacquemartValue): string {
  if (jacquemartState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function jacquemartLanes(rows: readonly JacquemartRow[]): JacquemartLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = jacquemartLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingJacquemart(rows: readonly JacquemartRow[]): string {
  const lines = jacquemartLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingJacquemartHue(rows: readonly JacquemartRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = jacquemartHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneJacquemartCount(rows: readonly JacquemartRow[], lane: JacquemartLane): number {
  return rows.filter((row) => jacquemartLane(row.code) === lane).length;
}

export function jacquemartShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentJacquemartLanes(rows: readonly JacquemartRow[]): string[] {
  return jacquemartLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenJacquemart(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedJacquemart(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleJacquemart(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleJacquemartReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkJacquemartReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleJacquemartLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: JacquemartRow, shape: JacquemartShape): boolean {
  if (shape === "all") return true;
  if (shape === "code") return jacquemartCode(row.code);
  if (shape === "join") return jacquemartJoin(row.code);
  if (shape === "gap") return jacquemartGap(row.code);
  if (shape === "chip") return jacquemartChip(row.code);
  if (shape === "banner") return jacquemartBanner(row.code);
  if (shape === "mark") return jacquemartMark(row.code);
  if (shape === "vowel") return jacquemartVowelLane(row.code);
  if (shape === "plain") return jacquemartPlain(row.code);
  if (shape === "open") return jacquemartOpen(row.code);
  if (shape === "soon") return jacquemartSoon(row.code);
  if (shape === "letter") return jacquemartLetter(row.code);
  if (shape === "mixed") return jacquemartMixed(row.code);
  if (shape === "upper") return jacquemartUpper(row.code);
  if (shape === "lower") return jacquemartLower(row.code);
  if (shape === "space") return jacquemartSpace(row.code);
  if (shape === "even") return jacquemartEven(row.code);
  if (shape === "odd") return jacquemartOdd(row.code);
  if (shape === "tail") return jacquemartTail(row.code);
  if (shape === "first") return jacquemartFirst(row.code);
  if (shape === "held") return jacquemartHeld(row.code);
  return jacquemartLane(row.code) === shape;
}

export function visibleJacquemart(
  rows: readonly JacquemartRow[],
  lane: string,
  hue: string,
  query: string,
  review: JacquemartReview,
  reviewed: readonly string[],
  shape: JacquemartShape,
): JacquemartRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (jacquemartState(row.code) === "") return false;
    const found = jacquemartLane(row.code);
    const hueName = jacquemartHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${jacquemartStamp(row.code)} ${jacquemartFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function jacquemartLanesCsv(rows: readonly JacquemartRow[]): string {
  const lines = ["lane,count"];
  for (const line of jacquemartLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function jacquemartRowsCsv(rows: readonly JacquemartRow[], reviewed: readonly string[]): string {
  const lines = ["name,gate,stamp,family,lane,hue,length,code,join,gap,chip,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(jacquemartCopy(row.code)),
        jacquemartStamp(row.code),
        csvCell(jacquemartFamily(row.code)),
        jacquemartLane(row.code),
        jacquemartHue(row.code),
        jacquemartLength(row.code) ?? "",
        jacquemartCode(row.code) ? "1" : "0",
        jacquemartJoin(row.code) ? "1" : "0",
        jacquemartGap(row.code) ? "1" : "0",
        jacquemartChip(row.code) ? "1" : "0",
        jacquemartEven(row.code) ? "1" : "0",
        jacquemartDigit(row.code) ? "1" : "0",
        jacquemartMixed(row.code) ? "1" : "0",
        jacquemartUpper(row.code) ? "1" : "0",
        jacquemartVowel(row.code) ? "1" : "0",
        jacquemartTail(row.code) ? "1" : "0",
        jacquemartHeld(row.code) ? "1" : "0",
        jacquemartSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
