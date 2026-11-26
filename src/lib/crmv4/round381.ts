/**
 * Sgraffito slips kept in this browser,
 * and sinopia cartoons read the keeper name already stored on the account.
 * Tools are stylus, knife, comb, and brush. Grounds are ivory, graphite, and champagne.
 * Depths are 8, 16, 32, or 64 minutes. Coats are 2, 4, or 6.
 * Stylus and knife are the warm half. Comb and brush are the cool half.
 * Firm, hold, true, bind, lock, and core are firm. Bench, shift, live, and room sit the bench.
 * Wait, later, and pause wait. Away, lost, exit, and stop are gone.
 * Twin and both are twinned. Void, zero, clear, and empty stay plain.
 * A hash of two to eight digits is firm. Any other hash joins two marks.
 * A slash that is not a date marks a route.
 * A date today is firm. Within three days sits the bench. Within eight days waits. Older is gone.
 * A short mark is exactly five characters. A tally starts with a digit and is not a date or a bench number.
 * A long mark is fourteen characters or longer and does not start with a digit. A vowel mark starts with a vowel or y.
 * The words floor and bay are firm when they are not a known title. Quiet, muted, or silent is hushed.
 * Three to eight digits sit the bench.
 * A true keeper reads as FIRM. A false keeper reads as VOID.
 * Money fields are not read. The cartoon does not change the saved keeper.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sgraffito_slip (
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
 * CREATE TABLE crm_sinopia_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_sinopia_review (
 *   trader_id text primary key
 * );
 */

export const SGF_KEY = "crmv4-sgraffito-381";
export const SGF_VIEW_KEY = "crmv4-sgraffito-views-381";
export const SGF_DENSITY_KEY = "crmv4-sgraffito-density-381";
export const SGF_TOOLS = ["stylus", "knife", "comb", "brush"] as const;

export type SlipTool = (typeof SGF_TOOLS)[number];
export type SlipGround = "blank" | "ivory" | "graphite" | "champagne";
export type SlipTray = "wall" | "tray" | "store";
export type SlipDensity = "open" | "tight";
export type SlipSort = "tool" | "hand";

export type Slip = {
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

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  hand: string;
  ground: string;
  tool: string;
  depth: string;
  coat: string;
};

export type SlipCounts = {
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

export const ROUND381_FEATURES = [
  "sgraffito-save",
  "sgraffito-reminders",
  "sgraffito-tools",
  "sgraffito-search",
  "sgraffito-depth-sla",
  "sgraffito-store",
  "sgraffito-star",
  "sgraffito-inline-title",
  "sgraffito-filters",
  "saved-sgraffito-views",
  "sgraffito-density",
  "sgraffito-focus",
  "sgraffito-kpis",
  "sgraffito-chart",
  "sgraffito-timeline",
  "sgraffito-bulk",
  "sgraffito-csv",
  "sgraffito-keys",
  "sgraffito-audit",
  "least-open-plasterer",
  "sgraffito-viewer",
  "suggest-plaster",
  "overdue-brush",
  "sinopia-cartoons",
  "sinopia-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "store", "open", "tag", "coat", "depth", "lower", "star"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const DEPTH_CYCLE = [8, 16, 32, 64] as const;
const COAT_CYCLE = [2, 4, 6] as const;
const WARM = new Set(["stylus", "knife"]);
const COOL = new Set(["comb", "brush"]);
const QUIET_GROUND = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "babevel"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "tray" || raw === "store" ? raw : "wall";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<SlipGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<SlipGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[sk]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Slip, tray: SlipTray): boolean {
  if (tray === "tray") return card.trayed && !card.stored;
  if (tray === "store") return card.stored;
  return !card.trayed && !card.stored;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function toolIndex(tool: string): number {
  return SGF_TOOLS.indexOf(tool as SlipTool);
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

export function toolPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (SGF_TOOLS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 8, 16, 32, or 64. Anything else stays blank. */
export function plasterDepth(raw: unknown): 8 | 16 | 32 | 64 | null {
  const text = wholeToken(raw);
  if (text !== "8" && text !== "16" && text !== "32" && text !== "64") return null;
  return Number(text) as 8 | 16 | 32 | 64;
}

/** A coat count is 2, 4, or 6. Anything else stays blank. */
export function coatCount(raw: unknown): 2 | 4 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "6") return null;
  return Number(text) as 2 | 4 | 6;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function plasterGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function toolWarm(tool: unknown): boolean {
  return WARM.has(snip(tool, 12).toLowerCase());
}

export function toolCool(tool: unknown): boolean {
  return COOL.has(snip(tool, 12).toLowerCase());
}

/** Stylus is first. Knife is second. Comb is third. Brush is fourth. */
export function toolBand(tool: unknown): string {
  const text = toolPoint(tool);
  if (!text) return "";
  if (text === "stylus") return "first";
  if (text === "knife") return "second";
  if (text === "comb") return "third";
  return "fourth";
}

/** Signed distance from one tool to another along the wall. */
export function toolGap(from: unknown, to: unknown): number | null {
  const left = toolIndex(toolPoint(from));
  const right = toolIndex(toolPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function ivoryQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(plasterGround(ground));
}

/** A pair coat is 4. Two and six are not a pair. */
export function pairCoat(coat: unknown): boolean {
  return coatCount(coat) === 4;
}

/** A full coat is 6. */
export function fullCoat(coat: unknown): boolean {
  return coatCount(coat) === 6;
}

export function activeTool(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return toolPoint(text) || "all";
}

export function activeDepth(raw: unknown): string {
  const depth = plasterDepth(raw);
  return depth === null ? "all" : String(depth);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = plasterGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeCoat(raw: unknown): string {
  const coat = coatCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveSlipFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the wall uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestGround(cards: readonly Slip[]): string {
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
export function suggestDepth(cards: readonly Slip[], hour: number): 8 | 16 | 32 | 64 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "wall") || card.depth === null) continue;
    seen = true;
    counts.set(card.depth, (counts.get(card.depth) || 0) + 1);
  }
  if (seen) {
    let best: 8 | 16 | 32 | 64 = 8;
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
  if (hour < 6) return 8;
  if (hour < 12) return 16;
  if (hour < 18) return 32;
  return 64;
}

export function suggestTool(hour: number): SlipTool {
  if (hour < 6) return "stylus";
  if (hour < 12) return "knife";
  if (hour < 18) return "comb";
  return "brush";
}

/** The hand with the fewest unraised slips on the wall. A tie keeps the roster order. */
export function fairPlasterer(cards: readonly Slip[], roster: string): string {
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

export function readSlips(raw: unknown): Slip[] {
  if (!Array.isArray(raw)) return [];
  const out: Slip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Slip>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      tool: toolPoint(row.tool),
      depth: plasterDepth(row.depth),
      ground: plasterGround(row.ground),
      coat: coatCount(row.coat) ?? 2,
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

export function addSlip(
  cards: readonly Slip[],
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
): Slip[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSlips([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      tool: toolPoint(card.tool),
      depth: plasterDepth(card.depth),
      ground: plasterGround(card.ground),
      coat: coatCount(card.coat) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      trayed: false,
      stored: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Slip[], id: string, edit: (card: Slip) => Slip): Slip[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSlip(cards: readonly Slip[], id: string, title: string): Slip[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSlipNote(cards: readonly Slip[], id: string, note: string): Slip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(plasterGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setSlipGround(cards: readonly Slip[], id: string, ground: string): Slip[] {
  const next = plasterGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setSlipRaised(cards: readonly Slip[], id: string, raised: boolean): Slip[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setSlipTray(cards: readonly Slip[], id: string, trayed: boolean): Slip[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, stored: trayed ? false : card.stored, audit: trayed ? "tray" : "return" }));
}

export function setSlipStore(cards: readonly Slip[], id: string, stored: boolean): Slip[] {
  return mapCard(cards, id, (card) => (card.stored === stored ? card : { ...card, stored, trayed: stored ? false : card.trayed, audit: stored ? "store" : "open" }));
}

export function setSlipStar(cards: readonly Slip[], id: string, starred: boolean): Slip[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addSlipTag(cards: readonly Slip[], id: string, tag: string): Slip[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDepth(depth: number | null, dir: 1 | -1): 8 | 16 | 32 | 64 {
  if (depth === null) return dir > 0 ? 8 : 64;
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

function stepCoat(coat: number, dir: 1 | -1): 2 | 4 | 6 {
  const index = coatIndex(coat);
  const next = index < 0 ? 0 : (index + dir + COAT_CYCLE.length) % COAT_CYCLE.length;
  return COAT_CYCLE[next];
}

export function raiseDepthFocused(cards: readonly Slip[], id: string): Slip[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Slip[], id: string): Slip[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "lower" }));
}

export function raiseCoatFocused(cards: readonly Slip[], id: string): Slip[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, 1), audit: "coat" }));
}

export function lowerCoatFocused(cards: readonly Slip[], id: string): Slip[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, -1), audit: "coat" }));
}

export function setSlipFocused(cards: readonly Slip[], id: string): Slip[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function traySlipFocused(cards: readonly Slip[], id: string): Slip[] {
  return setSlipTray(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function starSlipFocused(cards: readonly Slip[], id: string): Slip[] {
  return setSlipStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function groundFocused(cards: readonly Slip[], id: string): Slip[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSlipGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Slip[], ids: readonly string[], edit: (card: Slip) => Slip): Slip[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSlipIvory(cards: readonly Slip[], ids: readonly string[]): Slip[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkSlipRaise(cards: readonly Slip[], ids: readonly string[]): Slip[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkSlipStore(cards: readonly Slip[], ids: readonly string[]): Slip[] {
  return bulk(cards, ids, (card) => (card.stored ? card : { ...card, stored: true, trayed: false, audit: "store" }));
}

export function bulkSlipTag(cards: readonly Slip[], ids: readonly string[]): Slip[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SlipView>;
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
      tool: activeTool(row.tool),
      depth: activeDepth(row.depth),
      coat: activeCoat(row.coat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly SlipView[], view: SlipView): SlipView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSlipViews([...views, { ...view, name }]);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return views.filter((view) => view.id !== id);
}

export function slipDensity(raw: unknown): SlipDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortSlips(cards: readonly Slip[], sort: SlipSort): Slip[] {
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

export function visibleSlips(
  cards: readonly Slip[],
  tray: SlipTray,
  query: string,
  hand: string,
  ground: string,
  tool: string,
  depth: string,
  coat: string,
): Slip[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : plasterGround(ground);
  const wantTool = activeTool(tool);
  const wantDepth = activeDepth(depth);
  const wantCoat = activeCoat(coat);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantTool === "warm" && !toolWarm(card.tool)) return false;
    if (wantTool === "cool" && !toolCool(card.tool)) return false;
    if (wantTool !== "all" && wantTool !== "warm" && wantTool !== "cool" && card.tool !== wantTool) return false;
    if (wantDepth !== "all" && String(card.depth ?? "") !== wantDepth) return false;
    if (wantCoat !== "all" && String(card.coat) !== wantCoat) return false;
    return true;
  });
}

/** Brush on coat two, still not raised and not in the store, is overdue. */
export function overdueSlip(card: Slip): boolean {
  return card.tool === "brush" && card.coat === 2 && !card.raised && !card.stored;
}

/** No ground, eight minutes, coat two, and still on the wall. */
export function idleSlip(card: Slip): boolean {
  return !card.ground && card.depth === 8 && card.coat === 2 && !card.raised && !card.trayed && !card.stored;
}

/** Champagne, sixty-four minutes, and a full coat, still out of the store. */
export function briskSlip(card: Slip): boolean {
  return card.ground === "CHAMPAGNE" && card.depth === 64 && card.coat === 6 && !card.stored;
}

/** Brush, ivory, and sixteen minutes. */
export function restingSlip(card: Slip): boolean {
  return card.tool === "brush" && card.ground === "IVORY" && card.depth === 16;
}

/** A stylus slip is late when the station is already brush. */
export function lateSlip(card: Slip, station: string): boolean {
  return card.tool === "stylus" && toolPoint(station) === "brush" && !card.raised;
}

export function slipCounts(cards: readonly Slip[], shown: readonly Slip[], station: string): SlipCounts {
  return {
    wall: cards.filter((card) => inTray(card, "wall")).length,
    tray: cards.filter((card) => inTray(card, "tray")).length,
    store: cards.filter((card) => inTray(card, "store")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => toolWarm(card.tool)).length,
    cool: cards.filter((card) => toolCool(card.tool)).length,
    long: cards.filter((card) => card.depth === 64).length,
    quiet: cards.filter((card) => ivoryQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.depth || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleSlip).length,
    brisk: cards.filter(briskSlip).length,
    resting: cards.filter(restingSlip).length,
    overdue: cards.filter(overdueSlip).length,
    pair: cards.filter((card) => pairCoat(card.coat) && lateSlip(card, station)).length,
  };
}

export function slipBars(cards: readonly Slip[]): { tool: string; count: number }[] {
  return SGF_TOOLS.map((tool) => ({ tool, count: cards.filter((card) => card.tool === tool && !card.stored).length }));
}

export function slipTimeline(cards: readonly Slip[]): { depth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "wall"));
  return DEPTH_CYCLE.map((depth) => ({ depth, titles: open.filter((card) => card.depth === depth).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function slipHands(cards: readonly Slip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Slip[]): string {
  const open = cards.filter((card) => inTray(card, "wall") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of slipHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSlips(cards: readonly Slip[]): string[] {
  return cards.filter(overdueSlip).map((card) => card.title);
}

export function slipCopy(card: Slip): string {
  return [card.title, card.hand, card.tool, card.ground, card.depth ?? "", card.coat, card.note].filter((item) => item !== "").join(" · ");
}

export function slipCsv(cards: readonly Slip[], station: string): string {
  const lines = ["title,hand,tool,ground,minutes,coat,tags,raised,tray,store,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
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
        toolCool(card.tool) ? "1" : "0",
        lateSlip(card, station) ? "1" : "0",
        idleSlip(card) ? "1" : "0",
        briskSlip(card) ? "1" : "0",
        restingSlip(card) ? "1" : "0",
        overdueSlip(card) ? "1" : "0",
        toolWarm(card.tool) ? "1" : "0",
        ivoryQuiet(card.ground) ? "1" : "0",
        toolBand(card.tool),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const SNP_HIDE_KEY = "crmv4-sinopia-hide-381";
export const SNP_REVIEW_KEY = "crmv4-sinopia-review-381";

export type SnpLane = "" | "firm" | "hush" | "wait" | "bench" | "gone" | "twin" | "route" | "short" | "long" | "tally" | "vowel" | "plain";
export type SnpHue = "" | "pearl" | "ink" | "gilt";
export type SnpState = "" | "clear" | "set";
export type SnpReview = "all" | "reviewed" | "fresh";
export type SnpShape =
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

export type SnpValue = string | { assigneeName?: unknown; [key: string]: unknown } | null | undefined;
export type SnpRow = { id: string; label: string; code: SnpValue; userId?: string };
export type SnpLaneLine = { mail: string; count: number };

const SNP_LANES = ["firm", "hush", "wait", "bench", "gone", "twin", "route", "short", "long", "tally", "vowel", "plain"] as const;
const SNP_HUES = ["gilt", "pearl", "ink"] as const;

function codeRecord(raw: SnpValue): { assigneeName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: SnpValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: SnpValue): string {
  const row = codeRecord(raw);
  if (row && !("assigneeName" in row)) return "";
  const value = row ? row.assigneeName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "FIRM";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function codeReadable(raw: SnpValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("assigneeName" in row)) return false;
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

export function snpState(raw: SnpValue): SnpState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const FIRM_TITLES = new Set(["FIRM", "HOLD", "TRUE", "BIND", "LOCK", "CORE"]);
const BENCH_TITLES = new Set(["BENCH", "SHIFT", "LIVE", "ROOM"]);
const WAIT_TITLES = new Set(["WAIT", "LATER", "PAUSE"]);
const GONE_TITLES = new Set(["AWAY", "LOST", "EXIT", "STOP"]);
const TWIN_TITLES = new Set(["TWIN", "BOTH"]);
const PLAIN_TITLES = new Set(["VOID", "ZERO", "CLEAR", "EMPTY"]);

/** A known keeper maps first. A hash of two to eight digits is firm. Any other hash is twinned. A date today is firm. Within three days sits the bench. Within eight days waits. Older is gone. A slash that is not a date is a route. Three to eight digits sit the bench. A digit start that is not a bench number is a tally. A short mark is five characters. Quiet, muted, or silent is hushed. The words floor and bay are firm. A long mark is fourteen characters or longer. A vowel mark starts with a vowel or y. */
export function snpLane(raw: SnpValue, now = Date.now()): SnpLane {
  if (snpState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (FIRM_TITLES.has(upper)) return "firm";
  if (BENCH_TITLES.has(upper)) return "bench";
  if (WAIT_TITLES.has(upper)) return "wait";
  if (GONE_TITLES.has(upper)) return "gone";
  if (TWIN_TITLES.has(upper)) return "twin";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/quiet|muted|silent/i.test(text)) return "hush";
  if (/^#\d{2,8}$/.test(text)) return "firm";
  if (text.includes("#")) return "twin";
  const at = isoAt(text);
  if (at !== null) {
    if (at > now) return "firm";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "firm";
    const age = now - at;
    if (age < 3 * day) return "bench";
    if (age < 8 * day) return "wait";
    return "gone";
  }
  if (text.includes("/")) return "route";
  if (/^\d{3,8}$/.test(text)) return "bench";
  if (/^[0-9]/.test(text)) return "tally";
  if (text.length === 5) return "short";
  if (/\bfloor\b|\bbay\b/i.test(text)) return "firm";
  if (text.length >= 14) return "long";
  if (/^[aeiouy]/i.test(text)) return "vowel";
  return "plain";
}

export function snpHue(raw: SnpValue, now = Date.now()): SnpHue {
  const mail = snpLane(raw, now);
  if (!mail) return "";
  if (mail === "firm" || mail === "twin") return "gilt";
  if (mail === "bench" || mail === "gone" || mail === "route" || mail === "long") return "ink";
  return "pearl";
}

export function snpFirm(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "firm";
}

export function snpHush(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "hush";
}

export function snpWait(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "wait";
}

export function snpGone(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "gone";
}

export function snpBench(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "bench";
}

export function snpTwin(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "twin";
}

export function snpRoute(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "route";
}

export function snpShort(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "short";
}

export function snpLongLane(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "long";
}

export function snpTallyLane(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "tally";
}

export function snpVowelLane(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "vowel";
}

export function snpPlain(raw: SnpValue, now = Date.now()): boolean {
  return snpLane(raw, now) === "plain";
}

export function snpOpen(raw: SnpValue): boolean {
  return snpState(raw) === "clear";
}

/** A long keeper or a tally can stay as written. */
export function snpHeld(raw: SnpValue): boolean {
  const mail = snpLane(raw);
  return mail === "long" || mail === "tally";
}

/** A short keeper, or a five-character keeper that is not a known title, still wants a fuller name. */
export function snpSoon(raw: SnpValue, now = Date.now()): boolean {
  if (snpState(raw) !== "set") return false;
  if (snpShort(raw, now)) return true;
  if (snpFirm(raw, now) || snpHush(raw, now) || snpWait(raw, now) || snpGone(raw, now)) return false;
  return codeGiven(raw).length === 5;
}

export function snpLength(raw: SnpValue): number | null {
  if (snpState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function snpEven(raw: SnpValue): boolean {
  const length = snpLength(raw);
  return length !== null && length % 2 === 0;
}

export function snpOdd(raw: SnpValue): boolean {
  const length = snpLength(raw);
  return length !== null && length % 2 === 1;
}

export function snpFirst(raw: SnpValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function snpTail(raw: SnpValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function snpSpace(raw: SnpValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function snpVowel(raw: SnpValue): boolean {
  return /^[aeiouy]/i.test(codeGiven(raw));
}

export function snpDigit(raw: SnpValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function snpLetter(raw: SnpValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function snpMixed(raw: SnpValue): boolean {
  return snpDigit(raw) && snpLetter(raw);
}

export function snpLower(raw: SnpValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital keeper is six letters or more, written entirely in capitals. */
export function snpUpper(raw: SnpValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function snpStamp(raw: SnpValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function snpCopy(raw: SnpValue): string {
  return codeGiven(raw);
}

export function snpFamily(raw: SnpValue): string {
  if (snpState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function snpLanes(rows: readonly SnpRow[]): SnpLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of SNP_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = snpLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return SNP_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSnp(rows: readonly SnpRow[]): string {
  const lines = snpLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || SNP_LANES.indexOf(a.mail as (typeof SNP_LANES)[number]) - SNP_LANES.indexOf(b.mail as (typeof SNP_LANES)[number]))[0].mail;
}

export function leadingSnpHue(rows: readonly SnpRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of SNP_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = snpHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = SNP_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || SNP_HUES.indexOf(a.hue) - SNP_HUES.indexOf(b.hue))[0].hue;
}

export function laneSnpCount(rows: readonly SnpRow[], mail: SnpLane): number {
  return rows.filter((row) => snpLane(row.code) === mail).length;
}

export function snpShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSnpLanes(rows: readonly SnpRow[]): string[] {
  return snpLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenSnp(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSnp(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSnp(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleSnpReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSnpReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSnpLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: SnpRow, shape: SnpShape): boolean {
  if (shape === "all") return true;
  if (shape === "firm") return snpFirm(row.code);
  if (shape === "hush") return snpHush(row.code);
  if (shape === "wait") return snpWait(row.code);
  if (shape === "gone") return snpGone(row.code);
  if (shape === "bench") return snpBench(row.code);
  if (shape === "twin") return snpTwin(row.code);
  if (shape === "route") return snpRoute(row.code);
  if (shape === "short") return snpShort(row.code);
  if (shape === "long") return snpLongLane(row.code);
  if (shape === "tally") return snpTallyLane(row.code);
  if (shape === "vowel") return snpVowelLane(row.code);
  if (shape === "plain") return snpPlain(row.code);
  if (shape === "open") return snpOpen(row.code);
  if (shape === "soon") return snpSoon(row.code);
  if (shape === "letter") return snpLetter(row.code);
  if (shape === "mixed") return snpMixed(row.code);
  if (shape === "upper") return snpUpper(row.code);
  if (shape === "lower") return snpLower(row.code);
  if (shape === "space") return snpSpace(row.code);
  if (shape === "even") return snpEven(row.code);
  if (shape === "odd") return snpOdd(row.code);
  if (shape === "tail") return snpTail(row.code);
  if (shape === "first") return snpFirst(row.code);
  if (shape === "held") return snpHeld(row.code);
  return snpLane(row.code) === shape;
}

export function visibleSnp(
  rows: readonly SnpRow[],
  mail: string,
  hue: string,
  query: string,
  review: SnpReview,
  reviewed: readonly string[],
  shape: SnpShape,
): SnpRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (snpState(row.code) === "") return false;
    const found = snpLane(row.code);
    const hueName = snpHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${snpStamp(row.code)} ${snpFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function snpLanesCsv(rows: readonly SnpRow[]): string {
  const lines = ["lane,count"];
  for (const line of snpLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function snpRowsCsv(rows: readonly SnpRow[], reviewed: readonly string[]): string {
  const lines = ["name,keeper,stamp,family,lane,hue,length,firm,hush,wait,bench,gone,twin,route,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(snpCopy(row.code)),
        snpStamp(row.code),
        csvCell(snpFamily(row.code)),
        snpLane(row.code),
        snpHue(row.code),
        snpLength(row.code) ?? "",
        snpFirm(row.code) ? "1" : "0",
        snpHush(row.code) ? "1" : "0",
        snpWait(row.code) ? "1" : "0",
        snpBench(row.code) ? "1" : "0",
        snpGone(row.code) ? "1" : "0",
        snpTwin(row.code) ? "1" : "0",
        snpRoute(row.code) ? "1" : "0",
        snpShort(row.code) ? "1" : "0",
        snpEven(row.code) ? "1" : "0",
        snpDigit(row.code) ? "1" : "0",
        snpMixed(row.code) ? "1" : "0",
        snpUpper(row.code) ? "1" : "0",
        snpVowel(row.code) ? "1" : "0",
        snpTail(row.code) ? "1" : "0",
        snpHeld(row.code) ? "1" : "0",
        snpSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
