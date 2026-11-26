/**
 * Mezzotint plates kept in this browser,
 * and maculature proofs read the retention status already stored on the account.
 * Rockers are rocker, roulette, burnisher, and scraper. Grounds are ivory, graphite, and champagne.
 * Hours are 4, 6, 9, or 15. Passes are 2, 4, or 6.
 * Rocker and roulette are the warm half. Burnisher and scraper are the cool half.
 * Champagne is the quiet ground.
 * Anchor, hold, nest, hearth, loyal, bonded, and kept are firm. Mist, pale, drift, and ease sit the bench.
 * Later, pending, and queued wait. Faded, severed, gone, and exit are gone.
 * Mate and pair are twinned. Void, empty, nil, and blank stay plain.
 * A caret of three to five digits is firm. Any other caret joins two marks.
 * A pipe that is not a date marks a route.
 * A date today is firm. Within one day sits the bench. Within four days waits. Older is gone.
 * A short mark is exactly five characters. A tally starts with a digit and is not a date or a bench number.
 * A long mark is eighteen characters or longer and does not start with a digit. A vowel mark starts with a vowel or y.
 * The words plate and tone are firm when they are not a known title. Still, quiet, or muted is hushed.
 * Five to eight digits sit the bench.
 * A true status reads as FIRM. A false status reads as VOID.
 * Money fields are not read. The proof does not change the saved retention status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_mezzotint_plate (
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
 * CREATE TABLE crm_maculature_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_maculature_review (
 *   trader_id text primary key
 * );
 */


export const MZT_KEY = "crmv4-mezzotint-383";
export const MZT_VIEW_KEY = "crmv4-mezzotint-views-383";
export const MZT_DENSITY_KEY = "crmv4-mezzotint-density-383";
export const MZT_PIGMENTS = ["rocker", "roulette", "burnisher", "scraper"] as const;

export type PlateRocker = (typeof MZT_PIGMENTS)[number];
export type PlateGround = "blank" | "ivory" | "graphite" | "champagne";
export type PlateRack = "wall" | "tray" | "store";
export type PlateDensity = "open" | "tight";
export type PlateSort = "tool" | "hand";

export type Plate = {
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

export type PlateView = {
  id: string;
  name: string;
  tray: PlateRack;
  query: string;
  hand: string;
  ground: string;
  tool: string;
  depth: string;
  coat: string;
};

export type PlateCounts = {
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

export const ROUND383_FEATURES = [
  "mezzotint-save",
  "mezzotint-reminders",
  "mezzotint-rockers",
  "mezzotint-search",
  "mezzotint-hour-sla",
  "mezzotint-store",
  "mezzotint-star",
  "mezzotint-inline-title",
  "mezzotint-filters",
  "saved-mezzotint-views",
  "mezzotint-density",
  "mezzotint-focus",
  "mezzotint-kpis",
  "mezzotint-chart",
  "mezzotint-timeline",
  "mezzotint-bulk",
  "mezzotint-csv",
  "mezzotint-keys",
  "mezzotint-audit",
  "least-open-rocker",
  "mezzotint-viewer",
  "suggest-mezzotint",
  "overdue-scraper",
  "maculature-proofs",
  "maculature-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "store", "open", "tag", "coat", "depth", "lower", "star"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const DEPTH_CYCLE = [4, 6, 9, 15] as const;
const COAT_CYCLE = [2, 4, 6] as const;
const WARM = new Set(["rocker", "roulette"]);
const COOL = new Set(["burnisher", "scraper"]);
const QUIET_GROUND = new Set(["CHAMPAGNE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "babevel"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PlateRack {
  return raw === "tray" || raw === "store" ? raw : "wall";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<PlateGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<PlateGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[mz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Plate, tray: PlateRack): boolean {
  if (tray === "tray") return card.trayed && !card.stored;
  if (tray === "store") return card.stored;
  return !card.trayed && !card.stored;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function toolIndex(tool: string): number {
  return MZT_PIGMENTS.indexOf(tool as PlateRocker);
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

export function rockerPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (MZT_PIGMENTS as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 6, 9, or 15. Anything else stays blank. */
export function plateDay(raw: unknown): 4 | 6 | 9 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "6" && text !== "9" && text !== "15") return null;
  return Number(text) as 4 | 6 | 9 | 15;
}

/** A coat count is 2, 4, or 6. Anything else stays blank. */
export function filmCount(raw: unknown): 2 | 4 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "6") return null;
  return Number(text) as 2 | 4 | 6;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function plateGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function rockerWarm(tool: unknown): boolean {
  return WARM.has(snip(tool, 12).toLowerCase());
}

export function rockerCool(tool: unknown): boolean {
  return COOL.has(snip(tool, 12).toLowerCase());
}

/** Stylus is first. Knife is second. Comb is third. Brush is fourth. */
export function rockerBand(tool: unknown): string {
  const text = rockerPoint(tool);
  if (!text) return "";
  if (text === "rocker") return "first";
  if (text === "roulette") return "second";
  if (text === "burnisher") return "third";
  return "fourth";
}

/** Signed distance from one tool to another along the wall. */
export function rockerGap(from: unknown, to: unknown): number | null {
  const left = toolIndex(rockerPoint(from));
  const right = toolIndex(rockerPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(plateGround(ground));
}

/** A pair coat is 4. Two and six are not a pair. */
export function midFilm(coat: unknown): boolean {
  return filmCount(coat) === 4;
}

/** A full coat is 6. */
export function fullFilm(coat: unknown): boolean {
  return filmCount(coat) === 6;
}

export function activeRocker(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return rockerPoint(text) || "all";
}

export function activeDay(raw: unknown): string {
  const depth = plateDay(raw);
  return depth === null ? "all" : String(depth);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = plateGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeFilm(raw: unknown): string {
  const coat = filmCount(raw);
  return coat === null ? "all" : String(coat);
}

export function movePlateFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the wall uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestPlateGround(cards: readonly Plate[]): string {
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

/** Before six, suggest four. Before twelve, suggest six. Before eighteen, suggest nine. Later, suggest fifteen. A saved hour on the wall wins, and a tie keeps the shorter hour. */
export function suggestPlateDay(cards: readonly Plate[], hour: number): 4 | 6 | 9 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "wall") || card.depth === null) continue;
    seen = true;
    counts.set(card.depth, (counts.get(card.depth) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 6 | 9 | 15 = 4;
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
  if (hour < 6) return 4;
  if (hour < 12) return 6;
  if (hour < 18) return 9;
  return 15;
}

export function suggestRocker(hour: number): PlateRocker {
  if (hour < 6) return "rocker";
  if (hour < 12) return "roulette";
  if (hour < 18) return "burnisher";
  return "scraper";
}

/** The hand with the fewest unraised plates on the wall. A tie keeps the roster order. */
export function fairHand(cards: readonly Plate[], roster: string): string {
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

export function readPlates(raw: unknown): Plate[] {
  if (!Array.isArray(raw)) return [];
  const out: Plate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Plate>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      tool: rockerPoint(row.tool),
      depth: plateDay(row.depth),
      ground: plateGround(row.ground),
      coat: filmCount(row.coat) ?? 2,
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

export function addPlate(
  cards: readonly Plate[],
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
): Plate[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPlates([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      tool: rockerPoint(card.tool),
      depth: plateDay(card.depth),
      ground: plateGround(card.ground),
      coat: filmCount(card.coat) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      trayed: false,
      stored: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Plate[], id: string, edit: (card: Plate) => Plate): Plate[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPlate(cards: readonly Plate[], id: string, title: string): Plate[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPlateNote(cards: readonly Plate[], id: string, note: string): Plate[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(plateGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setPlateGround(cards: readonly Plate[], id: string, ground: string): Plate[] {
  const next = plateGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setPlateRaised(cards: readonly Plate[], id: string, raised: boolean): Plate[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setPlateRack(cards: readonly Plate[], id: string, trayed: boolean): Plate[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, stored: trayed ? false : card.stored, audit: trayed ? "tray" : "return" }));
}

export function setPlateVault(cards: readonly Plate[], id: string, stored: boolean): Plate[] {
  return mapCard(cards, id, (card) => (card.stored === stored ? card : { ...card, stored, trayed: stored ? false : card.trayed, audit: stored ? "store" : "open" }));
}

export function setPlateStar(cards: readonly Plate[], id: string, starred: boolean): Plate[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addPlateTag(cards: readonly Plate[], id: string, tag: string): Plate[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDepth(depth: number | null, dir: 1 | -1): 4 | 6 | 9 | 15 {
  if (depth === null) return dir > 0 ? 4 : 15;
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

function stepCoat(coat: number, dir: 1 | -1): 2 | 4 | 6 {
  const index = coatIndex(coat);
  const next = index < 0 ? 0 : (index + dir + COAT_CYCLE.length) % COAT_CYCLE.length;
  return COAT_CYCLE[next];
}

export function raiseDayFocused(cards: readonly Plate[], id: string): Plate[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDayFocused(cards: readonly Plate[], id: string): Plate[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "lower" }));
}

export function raiseFilmFocused(cards: readonly Plate[], id: string): Plate[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, 1), audit: "coat" }));
}

export function lowerFilmFocused(cards: readonly Plate[], id: string): Plate[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, -1), audit: "coat" }));
}

export function setPlateFocused(cards: readonly Plate[], id: string): Plate[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackPlateFocused(cards: readonly Plate[], id: string): Plate[] {
  return setPlateRack(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function pinPlateFocused(cards: readonly Plate[], id: string): Plate[] {
  return setPlateStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function groundFocused(cards: readonly Plate[], id: string): Plate[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPlateGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Plate[], ids: readonly string[], edit: (card: Plate) => Plate): Plate[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPlateIvory(cards: readonly Plate[], ids: readonly string[]): Plate[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkPlateLift(cards: readonly Plate[], ids: readonly string[]): Plate[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkPlateVault(cards: readonly Plate[], ids: readonly string[]): Plate[] {
  return bulk(cards, ids, (card) => (card.stored ? card : { ...card, stored: true, trayed: false, audit: "store" }));
}

export function bulkPlateTag(cards: readonly Plate[], ids: readonly string[]): Plate[] {
  return bulk(cards, ids, (card) => (card.tags.includes("v") ? card : { ...card, tags: tagsOf([...card.tags, "m"]), audit: "tag" }));
}

export function readPlateViews(raw: unknown): PlateView[] {
  if (!Array.isArray(raw)) return [];
  const out: PlateView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlateView>;
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
      tool: activeRocker(row.tool),
      depth: activeDay(row.depth),
      coat: activeFilm(row.coat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addPlateView(views: readonly PlateView[], view: PlateView): PlateView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPlateViews([...views, { ...view, name }]);
}

export function dropPlateView(views: readonly PlateView[], id: string): PlateView[] {
  return views.filter((view) => view.id !== id);
}

export function plateDensity(raw: unknown): PlateDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortPlates(cards: readonly Plate[], sort: PlateSort): Plate[] {
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

export function visiblePlates(
  cards: readonly Plate[],
  tray: PlateRack,
  query: string,
  hand: string,
  ground: string,
  tool: string,
  depth: string,
  coat: string,
): Plate[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : plateGround(ground);
  const wantTool = activeRocker(tool);
  const wantDepth = activeDay(depth);
  const wantCoat = activeFilm(coat);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantTool === "warm" && !rockerWarm(card.tool)) return false;
    if (wantTool === "cool" && !rockerCool(card.tool)) return false;
    if (wantTool !== "all" && wantTool !== "warm" && wantTool !== "cool" && card.tool !== wantTool) return false;
    if (wantDepth !== "all" && String(card.depth ?? "") !== wantDepth) return false;
    if (wantCoat !== "all" && String(card.coat) !== wantCoat) return false;
    return true;
  });
}

/** Brush on coat two, still not raised and not in the store, is overdue. */
export function overduePlate(card: Plate): boolean {
  return card.tool === "scraper" && card.coat === 2 && !card.raised && !card.stored;
}

/** No ground, eight minutes, coat two, and still on the wall. */
export function idlePlate(card: Plate): boolean {
  return !card.ground && card.depth === 4 && card.coat === 2 && !card.raised && !card.trayed && !card.stored;
}

/** Champagne, sixty-four minutes, and a full coat, still out of the store. */
export function briskPlate(card: Plate): boolean {
  return card.ground === "CHAMPAGNE" && card.depth === 15 && card.coat === 6 && !card.stored;
}

/** Brush, ivory, and sixteen minutes. */
export function restingPlate(card: Plate): boolean {
  return card.tool === "scraper" && card.ground === "IVORY" && card.depth === 6;
}

/** A rocker plate is late when the station is already scraper. */
export function latePlate(card: Plate, station: string): boolean {
  return card.tool === "rocker" && rockerPoint(station) === "scraper" && !card.raised;
}

export function plateCounts(cards: readonly Plate[], shown: readonly Plate[], station: string): PlateCounts {
  return {
    wall: cards.filter((card) => inTray(card, "wall")).length,
    tray: cards.filter((card) => inTray(card, "tray")).length,
    store: cards.filter((card) => inTray(card, "store")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => rockerWarm(card.tool)).length,
    cool: cards.filter((card) => rockerCool(card.tool)).length,
    long: cards.filter((card) => card.depth === 15).length,
    quiet: cards.filter((card) => graphiteQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.depth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idlePlate).length,
    brisk: cards.filter(briskPlate).length,
    resting: cards.filter(restingPlate).length,
    overdue: cards.filter(overduePlate).length,
    pair: cards.filter((card) => midFilm(card.coat) && latePlate(card, station)).length,
  };
}

export function plateBars(cards: readonly Plate[]): { tool: string; count: number }[] {
  return MZT_PIGMENTS.map((tool) => ({ tool, count: cards.filter((card) => card.tool === tool && !card.stored).length }));
}

export function plateTimeline(cards: readonly Plate[]): { depth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "wall"));
  return DEPTH_CYCLE.map((depth) => ({ depth, titles: open.filter((card) => card.depth === depth).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function plateHands(cards: readonly Plate[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Plate[]): string {
  const open = cards.filter((card) => inTray(card, "wall") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of plateHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPlates(cards: readonly Plate[]): string[] {
  return cards.filter(overduePlate).map((card) => card.title);
}

export function plateCopy(card: Plate): string {
  return [card.title, card.hand, card.tool, card.ground, card.depth ?? "", card.coat, card.note].filter((item) => item !== "").join(" · ");
}

export function plateCsv(cards: readonly Plate[], station: string): string {
  const lines = ["title,painter,rocker,ground,days,film,tags,raised,tray,store,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
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
        rockerCool(card.tool) ? "1" : "0",
        latePlate(card, station) ? "1" : "0",
        idlePlate(card) ? "1" : "0",
        briskPlate(card) ? "1" : "0",
        restingPlate(card) ? "1" : "0",
        overduePlate(card) ? "1" : "0",
        rockerWarm(card.tool) ? "1" : "0",
        graphiteQuiet(card.ground) ? "1" : "0",
        rockerBand(card.tool),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const MAC_HIDE_KEY = "crmv4-maculature-hide-383";
export const MAC_REVIEW_KEY = "crmv4-maculature-review-383";

export type MacLane = "" | "firm" | "hush" | "wait" | "bench" | "gone" | "twin" | "route" | "short" | "long" | "tally" | "vowel" | "plain";
export type MacHue = "" | "pearl" | "ink" | "gilt";
export type MacState = "" | "clear" | "set";
export type MacReview = "all" | "reviewed" | "fresh";
export type MacShape =
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

export type MacValue = string | { retentionStatus?: unknown; [key: string]: unknown } | null | undefined;
export type MacRow = { id: string; label: string; code: MacValue; userId?: string };
export type MacLaneLine = { mail: string; count: number };

const MAC_LANES = ["firm", "hush", "wait", "bench", "gone", "twin", "route", "short", "long", "tally", "vowel", "plain"] as const;
const MAC_HUES = ["gilt", "pearl", "ink"] as const;

function codeRecord(raw: MacValue): { retentionStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: MacValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: MacValue): string {
  const row = codeRecord(raw);
  if (row && !("retentionStatus" in row)) return "";
  const value = row ? row.retentionStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "FIRM";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function codeReadable(raw: MacValue): boolean {
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

export function macState(raw: MacValue): MacState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const FIRM_TITLES = new Set(["FIRM", "ANCHOR", "HOLD", "NEST", "HEARTH", "LOYAL", "KEPT"]);
const BENCH_TITLES = new Set(["MIST", "PALE", "DRIFT", "EASE"]);
const WAIT_TITLES = new Set(["LATER", "PENDING", "QUEUED"]);
const GONE_TITLES = new Set(["FADED", "SEVERED", "GONE", "EXIT"]);
const TWIN_TITLES = new Set(["MATE", "PAIR"]);
const PLAIN_TITLES = new Set(["VOID", "EMPTY", "NIL", "BLANK"]);

/** A known proof maps first. A caret of three to five digits is firm. Any other caret is twinned.
 * A date today is firm. Within one day sits the bench. Within four days waits. Older is gone.
 * A pipe that is not a date is a route. Five to eight digits sit the bench.
 * A digit start that is not a bench number is a tally. A short mark is five characters.
 * Still, quiet, or muted is hushed. The words plate and tone are firm.
 * A long mark is eighteen characters or longer. A vowel mark starts with a vowel or y.
 */
export function macLane(raw: MacValue, now = Date.now()): MacLane {
  if (macState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (FIRM_TITLES.has(upper)) return "firm";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (GONE_TITLES.has(upper)) return "gone";
  if (TWIN_TITLES.has(upper)) return "twin";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/still|quiet|muted/i.test(text)) return "hush";
  if (/^\^\d{3,5}$/.test(text)) return "firm";
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
    if (age < 1 * day) return "bench";
    if (age < 4 * day) return "wait";
    return "gone";
  }
  if (text.includes("|")) return "route";
  if (/^\d{5,8}$/.test(text)) return "bench";
  if (/^[0-9]/.test(text)) return "tally";
  if (/\bplate\b|\btone\b/i.test(text)) return "firm";
  if (text.length === 5) return "short";
  if (text.length >= 18) return "long";
  if (/^[aeiouy]/i.test(text)) return "vowel";
  return "plain";
}

export function macHue(raw: MacValue, now = Date.now()): MacHue {
  const mail = macLane(raw, now);
  if (!mail) return "";
  if (mail === "firm" || mail === "twin") return "gilt";
  if (mail === "bench" || mail === "gone" || mail === "route" || mail === "long") return "ink";
  return "pearl";
}

export function macKeep(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "firm";
}

export function macHush(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "hush";
}

export function macSoon(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "wait";
}

export function macLost(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "gone";
}

export function macCool(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "bench";
}

export function macPair(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "twin";
}

export function macRoute(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "route";
}

export function macShort(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "short";
}

export function macLongLane(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "long";
}

export function macTallyLane(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "tally";
}

export function macVowelLane(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "vowel";
}

export function macBare(raw: MacValue, now = Date.now()): boolean {
  return macLane(raw, now) === "plain";
}

export function macOpen(raw: MacValue): boolean {
  return macState(raw) === "clear";
}

/** A long keeper or a tally can stay as written. */
export function macHeld(raw: MacValue): boolean {
  const mail = macLane(raw);
  return mail === "long" || mail === "tally";
}

/** A short keeper, or a five-character keeper that is not a known title, still wants a fuller name. */
export function macBrief(raw: MacValue, now = Date.now()): boolean {
  if (macState(raw) !== "set") return false;
  if (macShort(raw, now)) return true;
  if (macKeep(raw, now) || macHush(raw, now) || macSoon(raw, now) || macLost(raw, now)) return false;
  return codeGiven(raw).length === 5;
}

export function macLength(raw: MacValue): number | null {
  if (macState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function macEven(raw: MacValue): boolean {
  const length = macLength(raw);
  return length !== null && length % 2 === 0;
}

export function macOdd(raw: MacValue): boolean {
  const length = macLength(raw);
  return length !== null && length % 2 === 1;
}

export function macFirst(raw: MacValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function macTail(raw: MacValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function macSpace(raw: MacValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function macVowel(raw: MacValue): boolean {
  return /^[aeiouy]/i.test(codeGiven(raw));
}

export function macDigit(raw: MacValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function macLetter(raw: MacValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function macMixed(raw: MacValue): boolean {
  return macDigit(raw) && macLetter(raw);
}

export function macLower(raw: MacValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital keeper is six letters or more, written entirely in capitals. */
export function macUpper(raw: MacValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 10 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function macStamp(raw: MacValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function macCopy(raw: MacValue): string {
  return codeGiven(raw);
}

export function macFamily(raw: MacValue): string {
  if (macState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function macLanes(rows: readonly MacRow[]): MacLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of MAC_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = macLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return MAC_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingMac(rows: readonly MacRow[]): string {
  const lines = macLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || MAC_LANES.indexOf(a.mail as (typeof MAC_LANES)[number]) - MAC_LANES.indexOf(b.mail as (typeof MAC_LANES)[number]))[0].mail;
}

export function leadingMacHue(rows: readonly MacRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of MAC_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = macHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = MAC_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || MAC_HUES.indexOf(a.hue) - MAC_HUES.indexOf(b.hue))[0].hue;
}

export function laneMacCount(rows: readonly MacRow[], mail: MacLane): number {
  return rows.filter((row) => macLane(row.code) === mail).length;
}

export function macShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentMacLanes(rows: readonly MacRow[]): string[] {
  return macLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenMac(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedMac(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleMac(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleMacReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMacReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMacLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: MacRow, shape: MacShape): boolean {
  if (shape === "all") return true;
  if (shape === "firm") return macKeep(row.code);
  if (shape === "hush") return macHush(row.code);
  if (shape === "wait") return macSoon(row.code);
  if (shape === "gone") return macLost(row.code);
  if (shape === "bench") return macCool(row.code);
  if (shape === "twin") return macPair(row.code);
  if (shape === "route") return macRoute(row.code);
  if (shape === "short") return macShort(row.code);
  if (shape === "long") return macLongLane(row.code);
  if (shape === "tally") return macTallyLane(row.code);
  if (shape === "vowel") return macVowelLane(row.code);
  if (shape === "plain") return macBare(row.code);
  if (shape === "open") return macOpen(row.code);
  if (shape === "soon") return macBrief(row.code);
  if (shape === "letter") return macLetter(row.code);
  if (shape === "mixed") return macMixed(row.code);
  if (shape === "upper") return macUpper(row.code);
  if (shape === "lower") return macLower(row.code);
  if (shape === "space") return macSpace(row.code);
  if (shape === "even") return macEven(row.code);
  if (shape === "odd") return macOdd(row.code);
  if (shape === "tail") return macTail(row.code);
  if (shape === "first") return macFirst(row.code);
  if (shape === "held") return macHeld(row.code);
  return macLane(row.code) === shape;
}

export function visibleMac(
  rows: readonly MacRow[],
  mail: string,
  hue: string,
  query: string,
  review: MacReview,
  reviewed: readonly string[],
  shape: MacShape,
): MacRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (macState(row.code) === "") return false;
    const found = macLane(row.code);
    const hueName = macHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${macStamp(row.code)} ${macFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function macLanesCsv(rows: readonly MacRow[]): string {
  const lines = ["lane,count"];
  for (const line of macLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function macRowsCsv(rows: readonly MacRow[], reviewed: readonly string[]): string {
  const lines = ["name,status,stamp,family,lane,hue,length,firm,hush,wait,bench,gone,twin,route,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(macCopy(row.code)),
        macStamp(row.code),
        csvCell(macFamily(row.code)),
        macLane(row.code),
        macHue(row.code),
        macLength(row.code) ?? "",
        macKeep(row.code) ? "1" : "0",
        macHush(row.code) ? "1" : "0",
        macSoon(row.code) ? "1" : "0",
        macCool(row.code) ? "1" : "0",
        macLost(row.code) ? "1" : "0",
        macPair(row.code) ? "1" : "0",
        macRoute(row.code) ? "1" : "0",
        macShort(row.code) ? "1" : "0",
        macEven(row.code) ? "1" : "0",
        macDigit(row.code) ? "1" : "0",
        macMixed(row.code) ? "1" : "0",
        macUpper(row.code) ? "1" : "0",
        macVowel(row.code) ? "1" : "0",
        macTail(row.code) ? "1" : "0",
        macHeld(row.code) ? "1" : "0",
        macBrief(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
