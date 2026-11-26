/**
 * Scagliola slabs kept in this browser,
 * and vein combs read the sale status already stored on the account.
 * Tools are spatula, float, comb, and burnish. Grounds are ivory, graphite, and champagne.
 * Hours are 5, 7, 11, or 18. Coats are 1, 3, or 7.
 * Spatula and float are the warm half. Comb and burnish are the cool half.
 * Graphite is the quiet ground.
 * Set, keep, won, live, book, close, and sold are firm. Soft, cool, easy, and calm sit the shelf.
 * Next, soon, and due wait. Lost, drop, left, and cold are gone.
 * Join and pair are twinned. Open, bare, none, and null stay plain.
 * A caret of two to four digits is firm. Any other caret joins two marks.
 * A pipe that is not a date marks a route.
 * A date today is firm. Within two days sits the shelf. Within five days waits. Older is gone.
 * A short mark is exactly six characters. A tally starts with a digit and is not a date or a shelf number.
 * A long mark is fourteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words sale and stage are firm when they are not a known title. Hushed, sealed, or private is hushed.
 * Four to six digits sit the shelf.
 * A true status reads as SET. A false status reads as OPEN.
 * Money fields are not read. The comb does not change the saved sale status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_scagliola_slab (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   tool text not null default '',
 *   depth_min integer,
 *   ground text not null default '',
 *   coat integer not null default 1,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   trayed boolean not null default false,
 *   stored boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_veincomb_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_veincomb_review (
 *   trader_id text primary key
 * );
 */

export const SCG_KEY = "crmv4-scagliola-384";
export const SCG_VIEW_KEY = "crmv4-scagliola-views-384";
export const SCG_DENSITY_KEY = "crmv4-scagliola-density-384";
export const SCG_PIGMENTS = ["spatula", "float", "comb", "burnish"] as const;

export type SlabSpatula = (typeof SCG_PIGMENTS)[number];
export type SlabGround = "blank" | "ivory" | "graphite" | "champagne";
export type SlabRack = "wall" | "tray" | "store";
export type SlabDensity = "open" | "tight";
export type SlabSort = "tool" | "hand";

export type Slab = {
  id: string;
  title: string;
  note: string;
  hand: string;
  tool: string;
  depth: number | null;
  ground: string;
  coat: number;
  tags: string[];
  raised: boolean;
  trayed: boolean;
  stored: boolean;
  starred: boolean;
  audit: string;
};

export type SlabView = {
  id: string;
  name: string;
  tray: SlabRack;
  query: string;
  hand: string;
  ground: string;
  tool: string;
  depth: string;
  coat: string;
};

export type SlabCounts = {
  wall: number;
  tray: number;
  store: number;
  raised: number;
  warm: number;
  cool: number;
  long: number;
  quiet: number;
  minutes: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND384_FEATURES = [
  "scagliola-save",
  "scagliola-reminders",
  "scagliola-spatulas",
  "scagliola-search",
  "scagliola-hour-sla",
  "scagliola-store",
  "scagliola-star",
  "scagliola-inline-title",
  "scagliola-filters",
  "saved-scagliola-views",
  "scagliola-density",
  "scagliola-focus",
  "scagliola-kpis",
  "scagliola-chart",
  "scagliola-timeline",
  "scagliola-bulk",
  "scagliola-csv",
  "scagliola-keys",
  "scagliola-audit",
  "least-open-spatula",
  "scagliola-viewer",
  "suggest-scagliola",
  "overdue-comb",
  "vein-combs",
  "vein-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "store", "open", "tag", "coat", "depth", "lower", "star"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const DEPTH_CYCLE = [5, 7, 11, 18] as const;
const COAT_CYCLE = [1, 3, 7] as const;
const WARM = new Set(["spatula", "float"]);
const COOL = new Set(["comb", "burnish"]);
const QUIET_GROUND = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "babevel"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlabRack {
  return raw === "tray" || raw === "store" ? raw : "wall";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<SlabGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<SlabGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[sc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Slab, tray: SlabRack): boolean {
  if (tray === "tray") return card.trayed && !card.stored;
  if (tray === "store") return card.stored;
  return !card.trayed && !card.stored;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function toolIndex(tool: string): number {
  return SCG_PIGMENTS.indexOf(tool as SlabSpatula);
}

function depthIndex(depth: number): number {
  return DEPTH_CYCLE.indexOf(depth as (typeof DEPTH_CYCLE)[number]);
}

function coatIndex(coat: number): number {
  return COAT_CYCLE.indexOf(coat as (typeof COAT_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return snip(raw, 48);
}

function noteOf(raw: unknown): string {
  return snip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function spatulaPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (SCG_PIGMENTS as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 5, 7, 11, or 18. Anything else stays blank. */
export function slabDay(raw: unknown): 5 | 7 | 11 | 18 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "7" && text !== "11" && text !== "18") return null;
  return Number(text) as 5 | 7 | 11 | 18;
}

/** A coat count is 1, 3, or 7. Anything else stays blank. */
export function filmCount(raw: unknown): 1 | 3 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "7") return null;
  return Number(text) as 1 | 3 | 7;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function slabGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function spatulaWarm(tool: unknown): boolean {
  return WARM.has(snip(tool, 12).toLowerCase());
}

export function spatulaCool(tool: unknown): boolean {
  return COOL.has(snip(tool, 12).toLowerCase());
}

/** Spatula is first. Float is second. Comb is third. Burnish is fourth. */
export function spatulaBand(tool: unknown): string {
  const text = spatulaPoint(tool);
  if (!text) return "";
  if (text === "spatula") return "first";
  if (text === "float") return "second";
  if (text === "comb") return "third";
  return "fourth";
}

/** Signed distance from one tool to another along the wall. */
export function spatulaGap(from: unknown, to: unknown): number | null {
  const left = toolIndex(spatulaPoint(from));
  const right = toolIndex(spatulaPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(slabGround(ground));
}

/** A pair coat is 3. One and seven are not a pair. */
export function midFilm(coat: unknown): boolean {
  return filmCount(coat) === 3;
}

/** A full coat is 7. */
export function fullFilm(coat: unknown): boolean {
  return filmCount(coat) === 7;
}

export function activeSpatula(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return spatulaPoint(text) || "all";
}

export function activeDay(raw: unknown): string {
  const depth = slabDay(raw);
  return depth === null ? "all" : String(depth);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = slabGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeFilm(raw: unknown): string {
  const coat = filmCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveSlabFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the wall uses least. A tie keeps graphite, then ivory, then champagne. */
export function suggestSlabGround(cards: readonly Slab[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "wall") || !card.ground) continue;
    counts.set(card.ground, (counts.get(card.ground) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = Number.POSITIVE_INFINITY;
  for (const ground of ["GRAPHITE", "IVORY", "CHAMPAGNE"]) {
    const count = counts.get(ground) || 0;
    if (count < score) {
      best = ground;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest five. Before eleven, suggest seven. Before seventeen, suggest eleven. Later, suggest eighteen. A saved hour on the wall wins, and a tie keeps the shorter hour. */
export function suggestSlabDay(cards: readonly Slab[], hour: number): 5 | 7 | 11 | 18 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "wall") || card.depth === null) continue;
    seen = true;
    counts.set(card.depth, (counts.get(card.depth) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 7 | 11 | 18 = 5;
    let score = Number.POSITIVE_INFINITY;
    for (const depth of DEPTH_CYCLE) {
      const count = counts.get(depth) || 0;
      if (count < score) {
        best = depth;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 5;
  if (hour < 11) return 7;
  if (hour < 17) return 11;
  return 18;
}

export function suggestSpatula(hour: number): SlabSpatula {
  if (hour < 5) return "spatula";
  if (hour < 11) return "float";
  if (hour < 17) return "comb";
  return "burnish";
}

/** The hand with the fewest unraised slabs on the wall. A tie keeps the roster order. */
export function fairHand(cards: readonly Slab[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "wall") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readSlabs(raw: unknown): Slab[] {
  if (!Array.isArray(raw)) return [];
  const out: Slab[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Slab>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      tool: spatulaPoint(row.tool),
      depth: slabDay(row.depth),
      ground: slabGround(row.ground),
      coat: filmCount(row.coat) ?? 1,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      trayed: row.trayed === true,
      stored: row.stored === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addSlab(
  cards: readonly Slab[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    tool?: string;
    depth?: unknown;
    ground?: string;
    coat?: unknown;
    tags?: unknown;
  },
): Slab[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `g${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSlabs([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      tool: spatulaPoint(card.tool),
      depth: slabDay(card.depth),
      ground: slabGround(card.ground),
      coat: filmCount(card.coat) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      trayed: false,
      stored: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Slab[], id: string, edit: (card: Slab) => Slab): Slab[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSlab(cards: readonly Slab[], id: string, title: string): Slab[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSlabNote(cards: readonly Slab[], id: string, note: string): Slab[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(slabGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setSlabGround(cards: readonly Slab[], id: string, ground: string): Slab[] {
  const next = slabGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setSlabRaised(cards: readonly Slab[], id: string, raised: boolean): Slab[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setSlabRack(cards: readonly Slab[], id: string, trayed: boolean): Slab[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, stored: trayed ? false : card.stored, audit: trayed ? "tray" : "return" }));
}

export function setSlabVault(cards: readonly Slab[], id: string, stored: boolean): Slab[] {
  return mapCard(cards, id, (card) => (card.stored === stored ? card : { ...card, stored, trayed: stored ? false : card.trayed, audit: stored ? "store" : "open" }));
}

export function setSlabStar(cards: readonly Slab[], id: string, starred: boolean): Slab[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addSlabTag(cards: readonly Slab[], id: string, tag: string): Slab[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDepth(depth: number | null, dir: 1 | -1): 5 | 7 | 11 | 18 {
  if (depth === null) return dir > 0 ? 5 : 18;
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

function stepCoat(coat: number, dir: 1 | -1): 1 | 3 | 7 {
  const index = coatIndex(coat);
  const next = index < 0 ? 0 : (index + dir + COAT_CYCLE.length) % COAT_CYCLE.length;
  return COAT_CYCLE[next];
}

export function raiseDayFocused(cards: readonly Slab[], id: string): Slab[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDayFocused(cards: readonly Slab[], id: string): Slab[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "lower" }));
}

export function raiseFilmFocused(cards: readonly Slab[], id: string): Slab[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, 1), audit: "coat" }));
}

export function lowerFilmFocused(cards: readonly Slab[], id: string): Slab[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, -1), audit: "coat" }));
}

export function setSlabFocused(cards: readonly Slab[], id: string): Slab[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackSlabFocused(cards: readonly Slab[], id: string): Slab[] {
  return setSlabRack(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function pinSlabFocused(cards: readonly Slab[], id: string): Slab[] {
  return setSlabStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function groundFocused(cards: readonly Slab[], id: string): Slab[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSlabGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Slab[], ids: readonly string[], edit: (card: Slab) => Slab): Slab[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSlabIvory(cards: readonly Slab[], ids: readonly string[]): Slab[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkSlabLift(cards: readonly Slab[], ids: readonly string[]): Slab[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkSlabVault(cards: readonly Slab[], ids: readonly string[]): Slab[] {
  return bulk(cards, ids, (card) => (card.stored ? card : { ...card, stored: true, trayed: false, audit: "store" }));
}

export function bulkSlabTag(cards: readonly Slab[], ids: readonly string[]): Slab[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readSlabViews(raw: unknown): SlabView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlabView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SlabView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: snip(row.query, 40),
      hand: snip(row.hand, 24),
      ground: activeGround(row.ground, ["IVORY", "GRAPHITE", "CHAMPAGNE"]),
      tool: activeSpatula(row.tool),
      depth: activeDay(row.depth),
      coat: activeFilm(row.coat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlabView(views: readonly SlabView[], view: SlabView): SlabView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSlabViews([...views, { ...view, name }]);
}

export function dropSlabView(views: readonly SlabView[], id: string): SlabView[] {
  return views.filter((view) => view.id !== id);
}

export function slabDensity(raw: unknown): SlabDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortSlabs(cards: readonly Slab[], sort: SlabSort): Slab[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const tool = toolIndex(a.tool) - toolIndex(b.tool);
      if (tool) return tool;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleSlabs(
  cards: readonly Slab[],
  tray: SlabRack,
  query: string,
  hand: string,
  ground: string,
  tool: string,
  depth: string,
  coat: string,
): Slab[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : slabGround(ground);
  const wantTool = activeSpatula(tool);
  const wantDepth = activeDay(depth);
  const wantCoat = activeFilm(coat);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantTool === "warm" && !spatulaWarm(card.tool)) return false;
    if (wantTool === "cool" && !spatulaCool(card.tool)) return false;
    if (wantTool !== "all" && wantTool !== "warm" && wantTool !== "cool" && card.tool !== wantTool) return false;
    if (wantDepth !== "all" && String(card.depth ?? "") !== wantDepth) return false;
    if (wantCoat !== "all" && String(card.coat) !== wantCoat) return false;
    return true;
  });
}

/** Comb on coat one, still not raised and not in the store, is overdue. */
export function overdueSlab(card: Slab): boolean {
  return card.tool === "comb" && card.coat === 1 && !card.raised && !card.stored;
}

/** No ground, five hours, coat one, and still on the wall. */
export function idleSlab(card: Slab): boolean {
  return !card.ground && card.depth === 5 && card.coat === 1 && !card.raised && !card.trayed && !card.stored;
}

/** Ivory, eighteen hours, and a full coat, still out of the store. */
export function briskSlab(card: Slab): boolean {
  return card.ground === "IVORY" && card.depth === 18 && card.coat === 7 && !card.stored;
}

/** Burnish, graphite, and seven hours. */
export function restingSlab(card: Slab): boolean {
  return card.tool === "burnish" && card.ground === "GRAPHITE" && card.depth === 7;
}

/** A spatula slab is late when the station is already burnish. */
export function lateSlab(card: Slab, station: string): boolean {
  return card.tool === "spatula" && spatulaPoint(station) === "burnish" && !card.raised;
}

export function slabCounts(cards: readonly Slab[], shown: readonly Slab[], station: string): SlabCounts {
  return {
    wall: cards.filter((card) => inTray(card, "wall")).length,
    tray: cards.filter((card) => inTray(card, "tray")).length,
    store: cards.filter((card) => inTray(card, "store")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => spatulaWarm(card.tool)).length,
    cool: cards.filter((card) => spatulaCool(card.tool)).length,
    long: cards.filter((card) => card.depth === 18).length,
    quiet: cards.filter((card) => graphiteQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.depth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleSlab).length,
    brisk: cards.filter(briskSlab).length,
    resting: cards.filter(restingSlab).length,
    overdue: cards.filter(overdueSlab).length,
    pair: cards.filter((card) => midFilm(card.coat) && lateSlab(card, station)).length,
  };
}

export function slabBars(cards: readonly Slab[]): { tool: string; count: number }[] {
  return SCG_PIGMENTS.map((tool) => ({ tool, count: cards.filter((card) => card.tool === tool && !card.stored).length }));
}

export function slabTimeline(cards: readonly Slab[]): { depth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "wall"));
  return DEPTH_CYCLE.map((depth) => ({ depth, titles: open.filter((card) => card.depth === depth).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function slabHands(cards: readonly Slab[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Slab[]): string {
  const open = cards.filter((card) => inTray(card, "wall") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of slabHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSlabs(cards: readonly Slab[]): string[] {
  return cards.filter(overdueSlab).map((card) => card.title);
}

export function slabCopy(card: Slab): string {
  return [card.title, card.hand, card.tool, card.ground, card.depth ?? "", card.coat, card.note].filter((item) => item !== "").join(" · ");
}

export function slabCsv(cards: readonly Slab[], station: string): string {
  const lines = ["title,painter,spatula,ground,days,film,tags,raised,tray,store,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.tool,
        card.ground,
        card.depth ?? "",
        card.coat,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.trayed ? "1" : "0",
        card.stored ? "1" : "0",
        card.starred ? "1" : "0",
        spatulaCool(card.tool) ? "1" : "0",
        lateSlab(card, station) ? "1" : "0",
        idleSlab(card) ? "1" : "0",
        briskSlab(card) ? "1" : "0",
        restingSlab(card) ? "1" : "0",
        overdueSlab(card) ? "1" : "0",
        spatulaWarm(card.tool) ? "1" : "0",
        graphiteQuiet(card.ground) ? "1" : "0",
        spatulaBand(card.tool),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const VEN_HIDE_KEY = "crmv4-veincomb-hide-384";
export const VEN_REVIEW_KEY = "crmv4-veincomb-review-384";

export type VenLane = "" | "firm" | "hush" | "wait" | "bench" | "gone" | "twin" | "route" | "short" | "long" | "tally" | "vowel" | "plain";
export type VenHue = "" | "pearl" | "ink" | "gilt";
export type VenState = "" | "clear" | "set";
export type VenReview = "all" | "reviewed" | "fresh";
export type VenShape =
  | "all"
  | "firm"
  | "hush"
  | "wait"
  | "gone"
  | "bench"
  | "twin"
  | "route"
  | "short"
  | "long"
  | "tally"
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

export type VenValue = string | { saleStatus?: unknown; [key: string]: unknown } | null | undefined;
export type VenRow = { id: string; label: string; code: VenValue; userId?: string };
export type VenLaneLine = { mail: string; count: number };

const VEN_LANES = ["firm", "hush", "wait", "bench", "gone", "twin", "route", "short", "long", "tally", "vowel", "plain"] as const;
const VEN_HUES = ["gilt", "pearl", "ink"] as const;

function codeRecord(raw: VenValue): { saleStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: VenValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: VenValue): string {
  const row = codeRecord(raw);
  if (row && !("saleStatus" in row)) return "";
  const value = row ? row.saleStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "SET";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return snip(value, 48);
}

function codeReadable(raw: VenValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("saleStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

function isoAt(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(text)) return null;
  const at = Date.parse(text);
  return Number.isNaN(at) ? null : at;
}

export function venState(raw: VenValue): VenState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const FIRM_TITLES = new Set(["SET", "KEEP", "WON", "LIVE", "BOOK", "CLOSE", "SOLD"]);
const BENCH_TITLES = new Set(["SOFT", "COOL", "EASY", "CALM"]);
const WAIT_TITLES = new Set(["NEXT", "SOON", "DUE"]);
const GONE_TITLES = new Set(["LOST", "DROP", "LEFT", "COLD"]);
const TWIN_TITLES = new Set(["JOIN", "PAIR"]);
const PLAIN_TITLES = new Set(["OPEN", "BARE", "NONE", "NULL"]);

/** A known sale mark maps first. A caret of two to four digits is firm. Any other caret is twinned.
 * A date today is firm. Within two days sits the shelf. Within five days waits. Older is gone.
 * A pipe that is not a date is a route. Four to six digits sit the shelf.
 * A digit start that is not a shelf number is a tally. A short mark is six characters.
 * Hushed, sealed, or private is hushed. The words sale and stage are firm.
 * A long mark is fourteen characters or longer. A vowel mark starts with a vowel.
 */
export function venLane(raw: VenValue, now = Date.now()): VenLane {
  if (venState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (FIRM_TITLES.has(upper)) return "firm";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (GONE_TITLES.has(upper)) return "gone";
  if (TWIN_TITLES.has(upper)) return "twin";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/hushed|sealed|private/i.test(text)) return "hush";
  if (/^\^\d{2,4}$/.test(text)) return "firm";
  if (text.includes("^")) return "twin";
  const at = isoAt(text);
  if (at !== null) {
    if (at > now) return "firm";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "firm";
    const age = now - at;
    if (age < 2 * day) return "bench";
    if (age < 5 * day) return "wait";
    return "gone";
  }
  if (text.includes("|")) return "route";
  if (/^\d{4,6}$/.test(text)) return "bench";
  if (/^[0-9]/.test(text)) return "tally";
  if (/\bsale\b|\bstage\b/i.test(text)) return "firm";
  if (text.length === 6) return "short";
  if (text.length >= 14) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function venHue(raw: VenValue, now = Date.now()): VenHue {
  const mail = venLane(raw, now);
  if (!mail) return "";
  if (mail === "firm" || mail === "twin") return "gilt";
  if (mail === "bench" || mail === "gone" || mail === "route" || mail === "long") return "ink";
  return "pearl";
}

export function venKeep(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "firm";
}

export function venHush(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "hush";
}

export function venSoon(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "wait";
}

export function venLost(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "gone";
}

export function venCool(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "bench";
}

export function venPair(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "twin";
}

export function venRoute(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "route";
}

export function venShort(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "short";
}

export function venLongLane(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "long";
}

export function venTallyLane(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "tally";
}

export function venVowelLane(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "vowel";
}

export function venBare(raw: VenValue, now = Date.now()): boolean {
  return venLane(raw, now) === "plain";
}

export function venOpen(raw: VenValue): boolean {
  return venState(raw) === "clear";
}

/** A long keeper or a tally can stay as written. */
export function venHeld(raw: VenValue): boolean {
  const mail = venLane(raw);
  return mail === "long" || mail === "tally";
}

/** A short keeper, or a five-character keeper that is not a known title, still wants a fuller name. */
export function venBrief(raw: VenValue, now = Date.now()): boolean {
  if (venState(raw) !== "set") return false;
  if (venShort(raw, now)) return true;
  if (venKeep(raw, now) || venHush(raw, now) || venSoon(raw, now) || venLost(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function venLength(raw: VenValue): number | null {
  if (venState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function venEven(raw: VenValue): boolean {
  const length = venLength(raw);
  return length !== null && length % 2 === 0;
}

export function venOdd(raw: VenValue): boolean {
  const length = venLength(raw);
  return length !== null && length % 2 === 1;
}

export function venFirst(raw: VenValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function venTail(raw: VenValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function venSpace(raw: VenValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function venVowel(raw: VenValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function venDigit(raw: VenValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function venLetter(raw: VenValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function venMixed(raw: VenValue): boolean {
  return venDigit(raw) && venLetter(raw);
}

export function venLower(raw: VenValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital keeper is six letters or more, written entirely in capitals. */
export function venUpper(raw: VenValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function venStamp(raw: VenValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function venCopy(raw: VenValue): string {
  return codeGiven(raw);
}

export function venFamily(raw: VenValue): string {
  if (venState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function venLanes(rows: readonly VenRow[]): VenLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of VEN_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = venLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return VEN_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingVen(rows: readonly VenRow[]): string {
  const lines = venLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || VEN_LANES.indexOf(a.mail as (typeof VEN_LANES)[number]) - VEN_LANES.indexOf(b.mail as (typeof VEN_LANES)[number]))[0].mail;
}

export function leadingVenHue(rows: readonly VenRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of VEN_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = venHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = VEN_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || VEN_HUES.indexOf(a.hue) - VEN_HUES.indexOf(b.hue))[0].hue;
}

export function laneVenCount(rows: readonly VenRow[], mail: VenLane): number {
  return rows.filter((row) => venLane(row.code) === mail).length;
}

export function venShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentVenLanes(rows: readonly VenRow[]): string[] {
  return venLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenVen(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = snip(item, 12);
    if (!allow.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedVen(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = snip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleVen(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleVenReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkVenReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleVenLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: VenRow, shape: VenShape): boolean {
  if (shape === "all") return true;
  if (shape === "firm") return venKeep(row.code);
  if (shape === "hush") return venHush(row.code);
  if (shape === "wait") return venSoon(row.code);
  if (shape === "gone") return venLost(row.code);
  if (shape === "bench") return venCool(row.code);
  if (shape === "twin") return venPair(row.code);
  if (shape === "route") return venRoute(row.code);
  if (shape === "short") return venShort(row.code);
  if (shape === "long") return venLongLane(row.code);
  if (shape === "tally") return venTallyLane(row.code);
  if (shape === "vowel") return venVowelLane(row.code);
  if (shape === "plain") return venBare(row.code);
  if (shape === "open") return venOpen(row.code);
  if (shape === "soon") return venBrief(row.code);
  if (shape === "letter") return venLetter(row.code);
  if (shape === "mixed") return venMixed(row.code);
  if (shape === "upper") return venUpper(row.code);
  if (shape === "lower") return venLower(row.code);
  if (shape === "space") return venSpace(row.code);
  if (shape === "even") return venEven(row.code);
  if (shape === "odd") return venOdd(row.code);
  if (shape === "tail") return venTail(row.code);
  if (shape === "first") return venFirst(row.code);
  if (shape === "held") return venHeld(row.code);
  return venLane(row.code) === shape;
}

export function visibleVen(
  rows: readonly VenRow[],
  mail: string,
  hue: string,
  query: string,
  review: VenReview,
  reviewed: readonly string[],
  shape: VenShape,
): VenRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (venState(row.code) === "") return false;
    const found = venLane(row.code);
    const hueName = venHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${venStamp(row.code)} ${venFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function venLanesCsv(rows: readonly VenRow[]): string {
  const lines = ["lane,count"];
  for (const line of venLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function venRowsCsv(rows: readonly VenRow[], reviewed: readonly string[]): string {
  const lines = ["name,status,stamp,family,lane,hue,length,firm,hush,wait,bench,gone,twin,route,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(venCopy(row.code)),
        venStamp(row.code),
        csvCell(venFamily(row.code)),
        venLane(row.code),
        venHue(row.code),
        venLength(row.code) ?? "",
        venKeep(row.code) ? "1" : "0",
        venHush(row.code) ? "1" : "0",
        venSoon(row.code) ? "1" : "0",
        venCool(row.code) ? "1" : "0",
        venLost(row.code) ? "1" : "0",
        venPair(row.code) ? "1" : "0",
        venRoute(row.code) ? "1" : "0",
        venShort(row.code) ? "1" : "0",
        venEven(row.code) ? "1" : "0",
        venDigit(row.code) ? "1" : "0",
        venMixed(row.code) ? "1" : "0",
        venUpper(row.code) ? "1" : "0",
        venVowel(row.code) ? "1" : "0",
        venTail(row.code) ? "1" : "0",
        venHeld(row.code) ? "1" : "0",
        venBrief(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
