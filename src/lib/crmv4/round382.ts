/**
 * Verdaccio veils kept in this browser,
 * and bole grounds read the retention status already stored on the account.
 * Pigments are ochre, vine, bone, and lamp. Grounds are ivory, graphite, and champagne.
 * Days are 3, 5, 8, or 13. Films are 1, 3, or 5.
 * Ochre and vine are the warm half. Bone and lamp are the cool half.
 * Firm, keep, warm, held, stay, home, and safe are firm. Cool, soft, calm, and ease sit the bench.
 * Soon, next, and due wait. Cold, lost, drop, and left are gone.
 * Pair and join are twinned. Void, bare, none, blank, and null stay plain.
 * A caret of two to six digits is firm. Any other caret joins two marks.
 * A pipe that is not a date marks a route.
 * A date today is firm. Within two days sits the bench. Within six days waits. Older is gone.
 * A short mark is exactly four characters. A tally starts with a digit and is not a date or a bench number.
 * A long mark is sixteen characters or longer and does not start with a digit. A vowel mark starts with a vowel or y.
 * The words desk and lane are firm when they are not a known title. Still, hushed, or quiet is hushed.
 * Four to seven digits sit the bench.
 * A true status reads as FIRM. A false status reads as VOID.
 * Money fields are not read. The ground does not change the saved retention status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_verdaccio_veil (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   tool text not null default '',
 *   depth_min integer,
 *   ground text not null default '',
 *   coat integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   trayed boolean not null default false,
 *   stored boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_bole_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_bole_review (
 *   trader_id text primary key
 * );
 */

export const VRD_KEY = "crmv4-verdaccio-382";
export const VRD_VIEW_KEY = "crmv4-verdaccio-views-382";
export const VRD_DENSITY_KEY = "crmv4-verdaccio-density-382";
export const VRD_PIGMENTS = ["ochre", "vine", "bone", "lamp"] as const;

export type VeilPigment = (typeof VRD_PIGMENTS)[number];
export type VeilGround = "blank" | "ivory" | "graphite" | "champagne";
export type VeilRack = "wall" | "tray" | "store";
export type VeilDensity = "open" | "tight";
export type VeilSort = "tool" | "hand";

export type Veil = {
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

export type VeilView = {
  id: string;
  name: string;
  tray: VeilRack;
  query: string;
  hand: string;
  ground: string;
  tool: string;
  depth: string;
  coat: string;
};

export type VeilCounts = {
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

export const ROUND382_FEATURES = [
  "verdaccio-save",
  "verdaccio-reminders",
  "verdaccio-pigments",
  "verdaccio-search",
  "verdaccio-day-sla",
  "verdaccio-store",
  "verdaccio-star",
  "verdaccio-inline-title",
  "verdaccio-filters",
  "saved-verdaccio-views",
  "verdaccio-density",
  "verdaccio-focus",
  "verdaccio-kpis",
  "verdaccio-chart",
  "verdaccio-timeline",
  "verdaccio-bulk",
  "verdaccio-csv",
  "verdaccio-keys",
  "verdaccio-audit",
  "least-open-painter",
  "verdaccio-viewer",
  "suggest-verdaccio",
  "overdue-lamp",
  "bole-grounds",
  "bole-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "store", "open", "tag", "coat", "depth", "lower", "star"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const DEPTH_CYCLE = [3, 5, 8, 13] as const;
const COAT_CYCLE = [1, 3, 5] as const;
const WARM = new Set(["ochre", "vine"]);
const COOL = new Set(["bone", "lamp"]);
const QUIET_GROUND = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "babevel"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VeilRack {
  return raw === "tray" || raw === "store" ? raw : "wall";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<VeilGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<VeilGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[vd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Veil, tray: VeilRack): boolean {
  if (tray === "tray") return card.trayed && !card.stored;
  if (tray === "store") return card.stored;
  return !card.trayed && !card.stored;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function toolIndex(tool: string): number {
  return VRD_PIGMENTS.indexOf(tool as VeilPigment);
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

export function pigmentPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (VRD_PIGMENTS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 8, 16, 32, or 64. Anything else stays blank. */
export function veilDay(raw: unknown): 3 | 5 | 8 | 13 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "5" && text !== "8" && text !== "13") return null;
  return Number(text) as 3 | 5 | 8 | 13;
}

/** A coat count is 2, 4, or 6. Anything else stays blank. */
export function filmCount(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function veilGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function pigmentWarm(tool: unknown): boolean {
  return WARM.has(snip(tool, 12).toLowerCase());
}

export function pigmentCool(tool: unknown): boolean {
  return COOL.has(snip(tool, 12).toLowerCase());
}

/** Stylus is first. Knife is second. Comb is third. Brush is fourth. */
export function pigmentBand(tool: unknown): string {
  const text = pigmentPoint(tool);
  if (!text) return "";
  if (text === "ochre") return "first";
  if (text === "vine") return "second";
  if (text === "bone") return "third";
  return "fourth";
}

/** Signed distance from one tool to another along the wall. */
export function pigmentGap(from: unknown, to: unknown): number | null {
  const left = toolIndex(pigmentPoint(from));
  const right = toolIndex(pigmentPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(veilGround(ground));
}

/** A pair coat is 4. Two and six are not a pair. */
export function midFilm(coat: unknown): boolean {
  return filmCount(coat) === 3;
}

/** A full coat is 6. */
export function fullFilm(coat: unknown): boolean {
  return filmCount(coat) === 5;
}

export function activePigment(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return pigmentPoint(text) || "all";
}

export function activeDay(raw: unknown): string {
  const depth = veilDay(raw);
  return depth === null ? "all" : String(depth);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = veilGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeFilm(raw: unknown): string {
  const coat = filmCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveVeilFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the wall uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestVeilGround(cards: readonly Veil[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "wall") || !card.ground) continue;
    counts.set(card.ground, (counts.get(card.ground) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const ground of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(ground) || 0;
    if (count < score) {
      best = ground;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest eight. Before twelve, suggest sixteen. Before eighteen, suggest thirty-two. Later, suggest sixty-four. A saved minute on the wall wins, and a tie keeps the shorter minute. */
export function suggestVeilDay(cards: readonly Veil[], hour: number): 3 | 5 | 8 | 13 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "wall") || card.depth === null) continue;
    seen = true;
    counts.set(card.depth, (counts.get(card.depth) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 5 | 8 | 13 = 3;
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
  if (hour < 6) return 3;
  if (hour < 12) return 5;
  if (hour < 18) return 8;
  return 13;
}

export function suggestPigment(hour: number): VeilPigment {
  if (hour < 6) return "ochre";
  if (hour < 12) return "vine";
  if (hour < 18) return "bone";
  return "lamp";
}

/** The hand with the fewest unraised slips on the wall. A tie keeps the roster order. */
export function fairPainter(cards: readonly Veil[], roster: string): string {
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

export function readVeils(raw: unknown): Veil[] {
  if (!Array.isArray(raw)) return [];
  const out: Veil[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Veil>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      tool: pigmentPoint(row.tool),
      depth: veilDay(row.depth),
      ground: veilGround(row.ground),
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

export function addVeil(
  cards: readonly Veil[],
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
): Veil[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readVeils([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      tool: pigmentPoint(card.tool),
      depth: veilDay(card.depth),
      ground: veilGround(card.ground),
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

function mapCard(cards: readonly Veil[], id: string, edit: (card: Veil) => Veil): Veil[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editVeil(cards: readonly Veil[], id: string, title: string): Veil[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editVeilNote(cards: readonly Veil[], id: string, note: string): Veil[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(veilGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setVeilGround(cards: readonly Veil[], id: string, ground: string): Veil[] {
  const next = veilGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setVeilRaised(cards: readonly Veil[], id: string, raised: boolean): Veil[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setVeilRack(cards: readonly Veil[], id: string, trayed: boolean): Veil[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, stored: trayed ? false : card.stored, audit: trayed ? "tray" : "return" }));
}

export function setVeilVault(cards: readonly Veil[], id: string, stored: boolean): Veil[] {
  return mapCard(cards, id, (card) => (card.stored === stored ? card : { ...card, stored, trayed: stored ? false : card.trayed, audit: stored ? "store" : "open" }));
}

export function setVeilStar(cards: readonly Veil[], id: string, starred: boolean): Veil[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addVeilTag(cards: readonly Veil[], id: string, tag: string): Veil[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDepth(depth: number | null, dir: 1 | -1): 3 | 5 | 8 | 13 {
  if (depth === null) return dir > 0 ? 3 : 13;
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

function stepCoat(coat: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = coatIndex(coat);
  const next = index < 0 ? 0 : (index + dir + COAT_CYCLE.length) % COAT_CYCLE.length;
  return COAT_CYCLE[next];
}

export function raiseDayFocused(cards: readonly Veil[], id: string): Veil[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDayFocused(cards: readonly Veil[], id: string): Veil[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "lower" }));
}

export function raiseFilmFocused(cards: readonly Veil[], id: string): Veil[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, 1), audit: "coat" }));
}

export function lowerFilmFocused(cards: readonly Veil[], id: string): Veil[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, -1), audit: "coat" }));
}

export function setVeilFocused(cards: readonly Veil[], id: string): Veil[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackVeilFocused(cards: readonly Veil[], id: string): Veil[] {
  return setVeilRack(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function pinVeilFocused(cards: readonly Veil[], id: string): Veil[] {
  return setVeilStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function groundFocused(cards: readonly Veil[], id: string): Veil[] {
  const card = cards.find((item) => item.id === id);
  return card ? setVeilGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Veil[], ids: readonly string[], edit: (card: Veil) => Veil): Veil[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkVeilIvory(cards: readonly Veil[], ids: readonly string[]): Veil[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkVeilLift(cards: readonly Veil[], ids: readonly string[]): Veil[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkVeilVault(cards: readonly Veil[], ids: readonly string[]): Veil[] {
  return bulk(cards, ids, (card) => (card.stored ? card : { ...card, stored: true, trayed: false, audit: "store" }));
}

export function bulkVeilTag(cards: readonly Veil[], ids: readonly string[]): Veil[] {
  return bulk(cards, ids, (card) => (card.tags.includes("v") ? card : { ...card, tags: tagsOf([...card.tags, "v"]), audit: "tag" }));
}

export function readVeilViews(raw: unknown): VeilView[] {
  if (!Array.isArray(raw)) return [];
  const out: VeilView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VeilView>;
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
      tool: activePigment(row.tool),
      depth: activeDay(row.depth),
      coat: activeFilm(row.coat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addVeilView(views: readonly VeilView[], view: VeilView): VeilView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readVeilViews([...views, { ...view, name }]);
}

export function dropVeilView(views: readonly VeilView[], id: string): VeilView[] {
  return views.filter((view) => view.id !== id);
}

export function veilDensity(raw: unknown): VeilDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortVeils(cards: readonly Veil[], sort: VeilSort): Veil[] {
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

export function visibleVeils(
  cards: readonly Veil[],
  tray: VeilRack,
  query: string,
  hand: string,
  ground: string,
  tool: string,
  depth: string,
  coat: string,
): Veil[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : veilGround(ground);
  const wantTool = activePigment(tool);
  const wantDepth = activeDay(depth);
  const wantCoat = activeFilm(coat);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantTool === "warm" && !pigmentWarm(card.tool)) return false;
    if (wantTool === "cool" && !pigmentCool(card.tool)) return false;
    if (wantTool !== "all" && wantTool !== "warm" && wantTool !== "cool" && card.tool !== wantTool) return false;
    if (wantDepth !== "all" && String(card.depth ?? "") !== wantDepth) return false;
    if (wantCoat !== "all" && String(card.coat) !== wantCoat) return false;
    return true;
  });
}

/** Brush on coat two, still not raised and not in the store, is overdue. */
export function overdueVeil(card: Veil): boolean {
  return card.tool === "lamp" && card.coat === 1 && !card.raised && !card.stored;
}

/** No ground, eight minutes, coat two, and still on the wall. */
export function idleVeil(card: Veil): boolean {
  return !card.ground && card.depth === 3 && card.coat === 1 && !card.raised && !card.trayed && !card.stored;
}

/** Champagne, sixty-four minutes, and a full coat, still out of the store. */
export function briskVeil(card: Veil): boolean {
  return card.ground === "CHAMPAGNE" && card.depth === 13 && card.coat === 5 && !card.stored;
}

/** Brush, ivory, and sixteen minutes. */
export function restingVeil(card: Veil): boolean {
  return card.tool === "lamp" && card.ground === "IVORY" && card.depth === 5;
}

/** An ochre veil is late when the station is already lamp. */
export function lateVeil(card: Veil, station: string): boolean {
  return card.tool === "ochre" && pigmentPoint(station) === "lamp" && !card.raised;
}

export function veilCounts(cards: readonly Veil[], shown: readonly Veil[], station: string): VeilCounts {
  return {
    wall: cards.filter((card) => inTray(card, "wall")).length,
    tray: cards.filter((card) => inTray(card, "tray")).length,
    store: cards.filter((card) => inTray(card, "store")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => pigmentWarm(card.tool)).length,
    cool: cards.filter((card) => pigmentCool(card.tool)).length,
    long: cards.filter((card) => card.depth === 13).length,
    quiet: cards.filter((card) => graphiteQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.depth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleVeil).length,
    brisk: cards.filter(briskVeil).length,
    resting: cards.filter(restingVeil).length,
    overdue: cards.filter(overdueVeil).length,
    pair: cards.filter((card) => midFilm(card.coat) && lateVeil(card, station)).length,
  };
}

export function veilBars(cards: readonly Veil[]): { tool: string; count: number }[] {
  return VRD_PIGMENTS.map((tool) => ({ tool, count: cards.filter((card) => card.tool === tool && !card.stored).length }));
}

export function veilTimeline(cards: readonly Veil[]): { depth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "wall"));
  return DEPTH_CYCLE.map((depth) => ({ depth, titles: open.filter((card) => card.depth === depth).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function veilPainters(cards: readonly Veil[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestPainter(cards: readonly Veil[]): string {
  const open = cards.filter((card) => inTray(card, "wall") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of veilPainters(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderVeils(cards: readonly Veil[]): string[] {
  return cards.filter(overdueVeil).map((card) => card.title);
}

export function veilCopy(card: Veil): string {
  return [card.title, card.hand, card.tool, card.ground, card.depth ?? "", card.coat, card.note].filter((item) => item !== "").join(" · ");
}

export function veilCsv(cards: readonly Veil[], station: string): string {
  const lines = ["title,painter,pigment,ground,days,film,tags,raised,tray,store,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
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
        pigmentCool(card.tool) ? "1" : "0",
        lateVeil(card, station) ? "1" : "0",
        idleVeil(card) ? "1" : "0",
        briskVeil(card) ? "1" : "0",
        restingVeil(card) ? "1" : "0",
        overdueVeil(card) ? "1" : "0",
        pigmentWarm(card.tool) ? "1" : "0",
        graphiteQuiet(card.ground) ? "1" : "0",
        pigmentBand(card.tool),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const BOL_HIDE_KEY = "crmv4-bole-hide-382";
export const BOL_REVIEW_KEY = "crmv4-bole-review-382";

export type BolLane = "" | "firm" | "hush" | "wait" | "bench" | "gone" | "twin" | "route" | "short" | "long" | "tally" | "vowel" | "plain";
export type BolHue = "" | "pearl" | "ink" | "gilt";
export type BolState = "" | "clear" | "set";
export type BolReview = "all" | "reviewed" | "fresh";
export type BolShape =
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

export type BolValue = string | { retentionStatus?: unknown; [key: string]: unknown } | null | undefined;
export type BolRow = { id: string; label: string; code: BolValue; userId?: string };
export type BolLaneLine = { mail: string; count: number };

const BOL_LANES = ["firm", "hush", "wait", "bench", "gone", "twin", "route", "short", "long", "tally", "vowel", "plain"] as const;
const BOL_HUES = ["gilt", "pearl", "ink"] as const;

function codeRecord(raw: BolValue): { retentionStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: BolValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: BolValue): string {
  const row = codeRecord(raw);
  if (row && !("retentionStatus" in row)) return "";
  const value = row ? row.retentionStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "FIRM";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function codeReadable(raw: BolValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("retentionStatus" in row)) return false;
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

export function bolState(raw: BolValue): BolState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const FIRM_TITLES = new Set(["FIRM", "KEEP", "WARM", "HELD", "STAY", "HOME", "SAFE"]);
const BENCH_TITLES = new Set(["COOL", "SOFT", "CALM", "EASE"]);
const WAIT_TITLES = new Set(["SOON", "NEXT", "DUE"]);
const GONE_TITLES = new Set(["COLD", "LOST", "DROP", "LEFT"]);
const TWIN_TITLES = new Set(["PAIR", "JOIN"]);
const PLAIN_TITLES = new Set(["VOID", "BARE", "NONE", "BLANK", "NULL"]);

/** A known keeper maps first. A hash of two to eight digits is firm. Any other hash is twinned. A date today is firm. Within three days sits the bench. Within eight days waits. Older is gone. A slash that is not a date is a route. Three to eight digits sit the bench. A digit start that is not a bench number is a tally. A short mark is five characters. Quiet, muted, or silent is hushed. The words floor and bay are firm. A long mark is fourteen characters or longer. A vowel mark starts with a vowel or y. */
export function bolLane(raw: BolValue, now = Date.now()): BolLane {
  if (bolState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (FIRM_TITLES.has(upper)) return "firm";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (GONE_TITLES.has(upper)) return "gone";
  if (TWIN_TITLES.has(upper)) return "twin";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/still|hushed|quiet/i.test(text)) return "hush";
  if (/^\^\d{2,6}$/.test(text)) return "firm";
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
    if (age < 6 * day) return "wait";
    return "gone";
  }
  if (text.includes("|")) return "route";
  if (/^\d{4,7}$/.test(text)) return "bench";
  if (/^[0-9]/.test(text)) return "tally";
  if (/\bdesk\b|\blane\b/i.test(text)) return "firm";
  if (text.length === 4) return "short";
  if (text.length >= 16) return "long";
  if (/^[aeiouy]/i.test(text)) return "vowel";
  return "plain";
}

export function bolHue(raw: BolValue, now = Date.now()): BolHue {
  const mail = bolLane(raw, now);
  if (!mail) return "";
  if (mail === "firm" || mail === "twin") return "gilt";
  if (mail === "bench" || mail === "gone" || mail === "route" || mail === "long") return "ink";
  return "pearl";
}

export function bolKeep(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "firm";
}

export function bolHush(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "hush";
}

export function bolSoon(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "wait";
}

export function bolLost(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "gone";
}

export function bolCool(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "bench";
}

export function bolPair(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "twin";
}

export function bolRoute(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "route";
}

export function bolShort(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "short";
}

export function bolLongLane(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "long";
}

export function bolTallyLane(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "tally";
}

export function bolVowelLane(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "vowel";
}

export function bolBare(raw: BolValue, now = Date.now()): boolean {
  return bolLane(raw, now) === "plain";
}

export function bolOpen(raw: BolValue): boolean {
  return bolState(raw) === "clear";
}

/** A long keeper or a tally can stay as written. */
export function bolHeld(raw: BolValue): boolean {
  const mail = bolLane(raw);
  return mail === "long" || mail === "tally";
}

/** A short keeper, or a five-character keeper that is not a known title, still wants a fuller name. */
export function bolBrief(raw: BolValue, now = Date.now()): boolean {
  if (bolState(raw) !== "set") return false;
  if (bolShort(raw, now)) return true;
  if (bolKeep(raw, now) || bolHush(raw, now) || bolSoon(raw, now) || bolLost(raw, now)) return false;
  return codeGiven(raw).length === 4;
}

export function bolLength(raw: BolValue): number | null {
  if (bolState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function bolEven(raw: BolValue): boolean {
  const length = bolLength(raw);
  return length !== null && length % 2 === 0;
}

export function bolOdd(raw: BolValue): boolean {
  const length = bolLength(raw);
  return length !== null && length % 2 === 1;
}

export function bolFirst(raw: BolValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function bolTail(raw: BolValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function bolSpace(raw: BolValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function bolVowel(raw: BolValue): boolean {
  return /^[aeiouy]/i.test(codeGiven(raw));
}

export function bolDigit(raw: BolValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function bolLetter(raw: BolValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function bolMixed(raw: BolValue): boolean {
  return bolDigit(raw) && bolLetter(raw);
}

export function bolLower(raw: BolValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital keeper is six letters or more, written entirely in capitals. */
export function bolUpper(raw: BolValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function bolStamp(raw: BolValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function bolCopy(raw: BolValue): string {
  return codeGiven(raw);
}

export function bolFamily(raw: BolValue): string {
  if (bolState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function bolLanes(rows: readonly BolRow[]): BolLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of BOL_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = bolLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return BOL_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingBol(rows: readonly BolRow[]): string {
  const lines = bolLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || BOL_LANES.indexOf(a.mail as (typeof BOL_LANES)[number]) - BOL_LANES.indexOf(b.mail as (typeof BOL_LANES)[number]))[0].mail;
}

export function leadingBolHue(rows: readonly BolRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of BOL_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = bolHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = BOL_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || BOL_HUES.indexOf(a.hue) - BOL_HUES.indexOf(b.hue))[0].hue;
}

export function laneBolCount(rows: readonly BolRow[], mail: BolLane): number {
  return rows.filter((row) => bolLane(row.code) === mail).length;
}

export function bolShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentBolLanes(rows: readonly BolRow[]): string[] {
  return bolLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenBol(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedBol(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleBol(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleBolReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkBolReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleBolLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: BolRow, shape: BolShape): boolean {
  if (shape === "all") return true;
  if (shape === "firm") return bolKeep(row.code);
  if (shape === "hush") return bolHush(row.code);
  if (shape === "wait") return bolSoon(row.code);
  if (shape === "gone") return bolLost(row.code);
  if (shape === "bench") return bolCool(row.code);
  if (shape === "twin") return bolPair(row.code);
  if (shape === "route") return bolRoute(row.code);
  if (shape === "short") return bolShort(row.code);
  if (shape === "long") return bolLongLane(row.code);
  if (shape === "tally") return bolTallyLane(row.code);
  if (shape === "vowel") return bolVowelLane(row.code);
  if (shape === "plain") return bolBare(row.code);
  if (shape === "open") return bolOpen(row.code);
  if (shape === "soon") return bolBrief(row.code);
  if (shape === "letter") return bolLetter(row.code);
  if (shape === "mixed") return bolMixed(row.code);
  if (shape === "upper") return bolUpper(row.code);
  if (shape === "lower") return bolLower(row.code);
  if (shape === "space") return bolSpace(row.code);
  if (shape === "even") return bolEven(row.code);
  if (shape === "odd") return bolOdd(row.code);
  if (shape === "tail") return bolTail(row.code);
  if (shape === "first") return bolFirst(row.code);
  if (shape === "held") return bolHeld(row.code);
  return bolLane(row.code) === shape;
}

export function visibleBol(
  rows: readonly BolRow[],
  mail: string,
  hue: string,
  query: string,
  review: BolReview,
  reviewed: readonly string[],
  shape: BolShape,
): BolRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (bolState(row.code) === "") return false;
    const found = bolLane(row.code);
    const hueName = bolHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${bolStamp(row.code)} ${bolFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function bolLanesCsv(rows: readonly BolRow[]): string {
  const lines = ["lane,count"];
  for (const line of bolLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function bolRowsCsv(rows: readonly BolRow[], reviewed: readonly string[]): string {
  const lines = ["name,status,stamp,family,lane,hue,length,firm,hush,wait,bench,gone,twin,route,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(bolCopy(row.code)),
        bolStamp(row.code),
        csvCell(bolFamily(row.code)),
        bolLane(row.code),
        bolHue(row.code),
        bolLength(row.code) ?? "",
        bolKeep(row.code) ? "1" : "0",
        bolHush(row.code) ? "1" : "0",
        bolSoon(row.code) ? "1" : "0",
        bolCool(row.code) ? "1" : "0",
        bolLost(row.code) ? "1" : "0",
        bolPair(row.code) ? "1" : "0",
        bolRoute(row.code) ? "1" : "0",
        bolShort(row.code) ? "1" : "0",
        bolEven(row.code) ? "1" : "0",
        bolDigit(row.code) ? "1" : "0",
        bolMixed(row.code) ? "1" : "0",
        bolUpper(row.code) ? "1" : "0",
        bolVowel(row.code) ? "1" : "0",
        bolTail(row.code) ? "1" : "0",
        bolHeld(row.code) ? "1" : "0",
        bolBrief(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
