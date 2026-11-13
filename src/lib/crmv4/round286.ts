/**
 * Waywiser wheels for a measuring book kept in this browser, and hour plates read the last-seen time already stored on the account.
 * Roads are lane, court, quay, and park. Rims are oak, iron, and gilt.
 * Spokes are 4, 6, or 8. Turns are 1, 2, or 3.
 * A live sight is fifteen minutes. A stale sight is seven days. Hours are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_waywiser (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   walker text not null default '',
 *   road text not null default '',
 *   rim text not null default '',
 *   spoke_no integer,
 *   turn_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_hour_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_hour_review (
 *   trader_id text primary key
 * );
 */

export const WYR_KEY = "crmv4-waywiser";
export const WYR_VIEW_KEY = "crmv4-waywiser-views";
export const WYR_DENSITY_KEY = "crmv4-waywiser-density";
export const HRS_KEY = "crmv4-hour-hide";
export const HRS_REVIEW_KEY = "crmv4-hour-review";

export const WAY_ROADS = ["lane", "court", "quay", "park"] as const;

export type WayRoad = (typeof WAY_ROADS)[number];

export type WayRim = "blank" | "oak" | "iron" | "gilt";

export type WayTray = "yard" | "shed" | "loft";

export type WayDensity = "air" | "tight";

export type WaySort = "road" | "walker";

export type Waywiser = {
  id: string;
  title: string;
  note: string;
  walker: string;
  road: string;
  spoke: number | null;
  rim: string;
  turn: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type WayView = {
  id: string;
  name: string;
  tray: WayTray;
  query: string;
  walker: string;
  rim: string;
  road: string;
  spoke: string;
  turn: string;
};

export type WayCounts = {
  yard: number;
  shed: number;
  loft: number;
  logged: number;
  paved: number;
  soft: number;
  soon: number;
  house: number;
  spoke: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type HourLane = "" | "live" | "stale" | "dawn" | "noon" | "dusk" | "night";

export type HourHue = "" | "ivory" | "graphite" | "champagne";

export type HourState = "" | "clear" | "set";

export type HourReview = "all" | "reviewed" | "fresh";

export type HourShape =
  | "all"
  | "live"
  | "stale"
  | "quiet"
  | "today"
  | "weekend"
  | "even"
  | "leap"
  | "wide"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "dawn"
  | "noon"
  | "dusk"
  | "night";

export type HourValue = string | { lastSeenAt?: unknown; seen?: unknown; [key: string]: unknown } | null | undefined;

export type HourRow = { id: string; label: string; seen: HourValue };

export type HourLaneLine = { lane: string; count: number };

export const ROUND286_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "spoke",
  "stow",
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
  "fair-walker",
  "viewer",
  "suggest",
  "sla",
  "hours",
  "hour-csv",
] as const;

const AUDITS = ["save", "edit", "note", "rim", "log", "unlog", "lock", "resume", "stow", "open", "tag", "turn", "spoke", "dip", "star"] as const;

const RIMS = ["oak", "iron", "gilt"] as const;

const SPOKE_CYCLE = [4, 6, 8] as const;

const TURN_CYCLE = [1, 2, 3] as const;

const PAVED = new Set(["lane", "court"]);

const SOFT = new Set(["quay", "park"]);

const HOUSE_RIM = new Set(["IRON", "GILT"]);

const NOON = new Set(["court"]);

const LANE_ORDER = ["live", "stale", "dawn", "noon", "dusk", "night"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

const LIVE_MS = 15 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const WIDE_MS = 3 * DAY_MS;

const STALE_MS = 7 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WayTray {
  return raw === "shed" || raw === "loft" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function rimName(raw: unknown): Exclude<WayRim, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (RIMS as readonly string[]).includes(text) ? (text as Exclude<WayRim, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Waywiser, tray: WayTray): boolean {
  if (tray === "shed") return card.locked && !card.stowed;
  if (tray === "loft") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function roadIndex(road: string): number {
  return WAY_ROADS.indexOf(road as WayRoad);
}

function spokeIndex(spoke: number): number {
  return SPOKE_CYCLE.indexOf(spoke as (typeof SPOKE_CYCLE)[number]);
}

function turnIndex(turn: number): number {
  return TURN_CYCLE.indexOf(turn as (typeof TURN_CYCLE)[number]);
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

export function wayRoad(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (WAY_ROADS as readonly string[]).includes(text) ? text : "";
}

/** A spoke is 4, 6, or 8. Anything else stays blank. */
export function waySpoke(raw: unknown): 4 | 6 | 8 | null {
  if (!/^[468]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 4 | 6 | 8;
}

/** A turn is 1, 2, or 3. Anything else stays blank. */
export function wayTurn(raw: unknown): 1 | 2 | 3 | null {
  if (!/^[123]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 1 | 2 | 3;
}

/** Rim is oak, iron, or gilt. The saved rim is the upper case name. */
export function wayRim(raw: unknown): string {
  const text = rimName(raw);
  return text ? text.toUpperCase() : "";
}

export function pavedRoad(road: unknown): boolean {
  return PAVED.has(clip(road, 8).toLowerCase());
}

export function softRoad(road: unknown): boolean {
  return SOFT.has(clip(road, 8).toLowerCase());
}

/** Lane is dawn. Court is noon. Quay is dusk. Park is night. */
export function wayBand(road: unknown): string {
  const text = wayRoad(road);
  if (!text) return "";
  if (text === "lane") return "dawn";
  if (NOON.has(text)) return "noon";
  if (text === "quay") return "dusk";
  return "night";
}

/** Signed distance from one road to the desk road. */
export function roadGap(from: unknown, to: unknown): number | null {
  const left = roadIndex(wayRoad(from));
  const right = roadIndex(wayRoad(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseRim(rim: unknown): boolean {
  return HOUSE_RIM.has(wayRim(rim));
}

/** A pair turn is 2. One and three are not a pair. */
export function pairTurn(turn: unknown): boolean {
  return wayTurn(turn) === 2;
}

/** A full turn is 3. */
export function fullTurn(turn: unknown): boolean {
  return wayTurn(turn) === 3;
}

export function activeRoad(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "paved" || text === "soft") return text;
  return wayRoad(text) || "all";
}

export function activeSpoke(raw: unknown): string {
  const spoke = waySpoke(raw);
  return spoke === null ? "all" : String(spoke);
}

export function activeRim(raw: unknown, allow: readonly string[]): string {
  const text = wayRim(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTurn(raw: unknown): string {
  const turn = wayTurn(raw);
  return turn === null ? "all" : String(turn);
}

export function moveWayFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestWayRim(cards: readonly Waywiser[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.rim) continue;
    counts.set(card.rim, (counts.get(card.rim) || 0) + 1);
  }
  let best = "OAK";
  let score = 0;
  for (const rim of ["OAK", "IRON", "GILT"]) {
    const count = counts.get(rim) || 0;
    if (count > score) {
      best = rim;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest four. Through the afternoon, six. Evening asks for eight. Saved spokes win when any exist. */
export function suggestSpoke(cards: readonly Waywiser[], hour: number): 4 | 6 | 8 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || card.spoke === null) continue;
    counts.set(card.spoke, (counts.get(card.spoke) || 0) + 1);
  }
  let best: 4 | 6 | 8 | null = null;
  let score = 0;
  for (const spoke of SPOKE_CYCLE) {
    const count = counts.get(spoke) || 0;
    if (count > score) {
      best = spoke;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 6) return 4;
  if (hour < 14) return 6;
  return 8;
}

/** Before ten, suggest the lane. The rest of the day suggests the park. */
export function suggestRoad(hour: number): WayRoad {
  return hour < 10 ? "lane" : "park";
}

/** The walker with the fewest unlogged yard wheels. A tie keeps the roster order. */
export function fairWalker(cards: readonly Waywiser[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "yard") && !card.logged);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.walker.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readWaywisers(raw: unknown): Waywiser[] {
  if (!Array.isArray(raw)) return [];
  const out: Waywiser[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Waywiser>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      walker: clip(row.walker, 24),
      road: wayRoad(row.road),
      spoke: waySpoke(row.spoke),
      rim: wayRim(row.rim),
      turn: wayTurn(row.turn) ?? 1,
      tags: tagsOf(row.tags),
      logged: row.logged === true,
      locked: row.locked === true,
      stowed: row.stowed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addWaywiser(
  cards: readonly Waywiser[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    walker?: string;
    road?: string;
    spoke?: unknown;
    rim?: string;
    turn?: unknown;
    tags?: unknown;
  },
): Waywiser[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readWaywisers([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      walker: clip(card.walker, 24),
      road: wayRoad(card.road),
      spoke: waySpoke(card.spoke),
      rim: wayRim(card.rim),
      turn: wayTurn(card.turn) ?? 1,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Waywiser[], id: string, edit: (card: Waywiser) => Waywiser): Waywiser[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editWaywiser(cards: readonly Waywiser[], id: string, title: string): Waywiser[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editWayNote(cards: readonly Waywiser[], id: string, note: string): Waywiser[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleRim(rim: string): string {
  const order = ["", "OAK", "IRON", "GILT"];
  const index = order.indexOf(wayRim(rim));
  return order[(index + 1) % order.length] || "OAK";
}

export function setWayRim(cards: readonly Waywiser[], id: string, rim: string): Waywiser[] {
  const next = wayRim(rim);
  return mapCard(cards, id, (card) => (card.rim === next ? card : { ...card, rim: next, audit: "rim" }));
}

export function setWayLogged(cards: readonly Waywiser[], id: string, logged: boolean): Waywiser[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setWayLock(cards: readonly Waywiser[], id: string, locked: boolean): Waywiser[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setWayStow(cards: readonly Waywiser[], id: string, stowed: boolean): Waywiser[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setWayStar(cards: readonly Waywiser[], id: string, flagged: boolean): Waywiser[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addWayTag(cards: readonly Waywiser[], id: string, tag: string): Waywiser[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpoke(spoke: number | null, dir: 1 | -1): 4 | 6 | 8 {
  if (spoke === null) return dir > 0 ? 4 : 8;
  const index = spokeIndex(spoke);
  const next = index < 0 ? 0 : (index + dir + SPOKE_CYCLE.length) % SPOKE_CYCLE.length;
  return SPOKE_CYCLE[next];
}

function stepTurn(turn: number, dir: 1 | -1): 1 | 2 | 3 {
  const index = turnIndex(turn);
  const next = index < 0 ? 0 : (index + dir + TURN_CYCLE.length) % TURN_CYCLE.length;
  return TURN_CYCLE[next];
}

export function liftSpoke(cards: readonly Waywiser[], id: string): Waywiser[] {
  return mapCard(cards, id, (card) => ({ ...card, spoke: stepSpoke(card.spoke, 1), audit: "spoke" }));
}

export function dipSpoke(cards: readonly Waywiser[], id: string): Waywiser[] {
  return mapCard(cards, id, (card) => ({ ...card, spoke: stepSpoke(card.spoke, -1), audit: "dip" }));
}

export function raiseTurn(cards: readonly Waywiser[], id: string): Waywiser[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, 1), audit: "turn" }));
}

export function lowerTurn(cards: readonly Waywiser[], id: string): Waywiser[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, -1), audit: "turn" }));
}

function focused(cards: readonly Waywiser[], id: string, edit: (card: Waywiser) => Waywiser): Waywiser[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logWayFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function lockWayFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return setWayLock(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starWayFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return setWayStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagWayFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return addWayTag(cards, id, "a");
}

export function rimFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  const card = cards.find((item) => item.id === id);
  return card ? setWayRim(cards, id, cycleRim(card.rim)) : [...cards];
}

export function liftSpokeFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return liftSpoke(cards, id);
}

export function dipSpokeFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return dipSpoke(cards, id);
}

export function raiseTurnFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return raiseTurn(cards, id);
}

export function lowerTurnFocused(cards: readonly Waywiser[], id: string): Waywiser[] {
  return lowerTurn(cards, id);
}

function bulk(cards: readonly Waywiser[], ids: readonly string[], edit: (card: Waywiser) => Waywiser): Waywiser[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkWayGilt(cards: readonly Waywiser[], ids: readonly string[]): Waywiser[] {
  return bulk(cards, ids, (card) => (card.rim === "GILT" ? card : { ...card, rim: "GILT", audit: "rim" }));
}

export function bulkWayLog(cards: readonly Waywiser[], ids: readonly string[]): Waywiser[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkWayStow(cards: readonly Waywiser[], ids: readonly string[]): Waywiser[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkWayTag(cards: readonly Waywiser[], ids: readonly string[]): Waywiser[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readWayViews(raw: unknown): WayView[] {
  if (!Array.isArray(raw)) return [];
  const out: WayView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WayView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      walker: clip(row.walker, 24),
      rim: activeRim(row.rim, ["OAK", "IRON", "GILT"]),
      road: activeRoad(row.road),
      spoke: activeSpoke(row.spoke),
      turn: activeTurn(row.turn),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addWayView(views: readonly WayView[], view: WayView): WayView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readWayViews([...views, { ...view, id, name }]);
}

export function dropWayView(views: readonly WayView[], id: string): WayView[] {
  return views.filter((view) => view.id !== id);
}

export function wayDensity(raw: unknown): WayDensity {
  return raw === "tight" ? "tight" : "air";
}

export function sortWaywisers(cards: readonly Waywiser[], sort: WaySort): Waywiser[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "walker") {
      const walker = a.walker.localeCompare(b.walker);
      if (walker) return walker;
    } else {
      const road = roadIndex(a.road) - roadIndex(b.road);
      if (road) return road;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleWaywisers(
  cards: readonly Waywiser[],
  tray: WayTray,
  query: string,
  walker: string,
  rim: string,
  road: string,
  spoke: string,
  turn: string,
): Waywiser[] {
  const text = query.trim().toLowerCase();
  const wantWalker = clip(walker, 24).toLowerCase();
  const wantRim = rim === "all" ? "" : wayRim(rim);
  const wantRoad = activeRoad(road);
  const wantSpoke = activeSpoke(spoke);
  const wantTurn = activeTurn(turn);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.walker}`.toLowerCase().includes(text)) return false;
    if (wantWalker && card.walker.toLowerCase() !== wantWalker) return false;
    if (wantRim && card.rim !== wantRim) return false;
    if (wantRoad === "paved" && !pavedRoad(card.road)) return false;
    if (wantRoad === "soft" && !softRoad(card.road)) return false;
    if (wantRoad !== "all" && wantRoad !== "paved" && wantRoad !== "soft" && card.road !== wantRoad) return false;
    if (wantSpoke !== "all" && String(card.spoke ?? "") !== wantSpoke) return false;
    if (wantTurn !== "all" && String(card.turn) !== wantTurn) return false;
    return true;
  });
}

/** A soft road on the first turn, still unlogged and not in the loft, is overdue. */
export function overdueWay(card: Waywiser): boolean {
  return softRoad(card.road) && card.turn === 1 && !card.logged && !card.stowed;
}

/** No rim, four spokes, one turn, and still in the yard. */
export function idleWay(card: Waywiser): boolean {
  return !card.rim && card.spoke === 4 && card.turn === 1 && !card.logged && !card.locked && !card.stowed;
}

/** Gilt, eight spokes, and a full turn, still out of the loft. */
export function briskWay(card: Waywiser): boolean {
  return card.rim === "GILT" && card.spoke === 8 && card.turn === 3 && !card.stowed;
}

/** Park, oak, and six spokes. */
export function restingWay(card: Waywiser): boolean {
  return card.road === "park" && card.rim === "OAK" && card.spoke === 6;
}

/** A lane wheel is late when the desk is already in the park. */
export function lateWay(card: Waywiser, desk: string): boolean {
  return card.road === "lane" && wayRoad(desk) === "park" && !card.logged;
}

export function wayCounts(cards: readonly Waywiser[], shown: readonly Waywiser[], desk: string): WayCounts {
  return {
    yard: cards.filter((card) => inTray(card, "yard")).length,
    shed: cards.filter((card) => inTray(card, "shed")).length,
    loft: cards.filter((card) => inTray(card, "loft")).length,
    logged: cards.filter((card) => card.logged).length,
    paved: cards.filter((card) => pavedRoad(card.road)).length,
    soft: cards.filter((card) => softRoad(card.road)).length,
    soon: cards.filter((card) => card.spoke === 8).length,
    house: cards.filter((card) => houseRim(card.rim)).length,
    spoke: cards.reduce((sum, card) => sum + (card.spoke || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleWay).length,
    brisk: cards.filter(briskWay).length,
    resting: cards.filter(restingWay).length,
    overdue: cards.filter(overdueWay).length,
    pair: cards.filter((card) => pairTurn(card.turn) && lateWay(card, desk)).length,
  };
}

export function wayBars(cards: readonly Waywiser[]): { road: string; count: number }[] {
  return WAY_ROADS.map((road) => ({ road, count: cards.filter((card) => card.road === road && !card.stowed).length }));
}

export function wayTimeline(cards: readonly Waywiser[]): { spoke: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return SPOKE_CYCLE.map((spoke) => ({ spoke, titles: open.filter((card) => card.spoke === spoke).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function wayWalkers(cards: readonly Waywiser[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.walker && !out.some((name) => name.toLowerCase() === card.walker.toLowerCase())) out.push(card.walker);
  }
  return out;
}

export function busiestWalker(cards: readonly Waywiser[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.logged && card.walker);
  let best = "";
  let score = 0;
  for (const name of wayWalkers(open)) {
    const count = open.filter((card) => card.walker.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderWaywisers(cards: readonly Waywiser[]): string[] {
  return cards.filter(overdueWay).map((card) => card.title);
}

export function idleWayList(cards: readonly Waywiser[]): string[] {
  return cards.filter(idleWay).map((card) => card.title);
}

export function wayCopy(card: Waywiser): string {
  return [card.title, card.walker, card.road, card.rim, card.spoke ?? "", card.turn, card.note].filter((item) => item !== "").join(" · ");
}

export function wayCsv(cards: readonly Waywiser[], desk: string): string {
  const lines = ["title,walker,road,rim,spoke,turn,tags,logged,locked,stowed,starred,soft,late,idle,brisk,resting,overdue,paved,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.walker),
        card.road,
        card.rim,
        card.spoke ?? "",
        card.turn,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        softRoad(card.road) ? "1" : "0",
        lateWay(card, desk) ? "1" : "0",
        idleWay(card) ? "1" : "0",
        briskWay(card) ? "1" : "0",
        restingWay(card) ? "1" : "0",
        overdueWay(card) ? "1" : "0",
        pavedRoad(card.road) ? "1" : "0",
        houseRim(card.rim) ? "1" : "0",
        wayBand(card.road),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: HourValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function hourRecord(raw: HourValue): { lastSeenAt?: unknown; seen?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function hourGiven(raw: HourValue): string {
  const row = hourRecord(raw);
  if (row && !("lastSeenAt" in row) && !("seen" in row)) return "";
  const value = row ? row.lastSeenAt ?? row.seen : raw;
  return clip(value, 40);
}

export function hourState(raw: HourValue, now = Date.now()): HourState {
  if (hasBlocked(raw)) return "";
  const row = hourRecord(raw);
  if (row && !("lastSeenAt" in row) && !("seen" in row)) return "";
  return hourDate(raw, now) ? "set" : "clear";
}

function hourDate(raw: HourValue, now = Date.now()): Date | null {
  if (hourStateRaw(raw) === "blocked") return null;
  const text = hourGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const age = now - at;
  if (age < -LIVE_MS) return null;
  return new Date(at);
}

function hourStateRaw(raw: HourValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = hourRecord(raw);
  if (row && !("lastSeenAt" in row) && !("seen" in row)) return "blocked";
  return "open";
}

function hourAge(raw: HourValue, now: number): number | null {
  const at = hourDate(raw, now);
  if (!at) return null;
  return now - at.getTime();
}

/** Live within fifteen minutes, stale after seven days, otherwise the UTC hour band. */
export function hourLane(raw: HourValue, now = Date.now()): HourLane {
  if (hourState(raw, now) !== "set") return "";
  const age = hourAge(raw, now);
  const at = hourDate(raw, now);
  if (age === null || !at) return "";
  if (age <= LIVE_MS) return "live";
  if (age > STALE_MS) return "stale";
  const hour = at.getUTCHours();
  if (hour >= 5 && hour <= 10) return "dawn";
  if (hour >= 11 && hour <= 15) return "noon";
  if (hour >= 16 && hour <= 20) return "dusk";
  return "night";
}

export function hourHue(raw: HourValue, now = Date.now()): HourHue {
  const lane = hourLane(raw, now);
  if (!lane) return "";
  if (lane === "live" || lane === "noon") return "champagne";
  if (lane === "dawn" || lane === "night") return "ivory";
  return "graphite";
}

export function hourLive(raw: HourValue, now = Date.now()): boolean {
  return hourLane(raw, now) === "live";
}

export function hourStale(raw: HourValue, now = Date.now()): boolean {
  return hourLane(raw, now) === "stale";
}

export function hourQuiet(raw: HourValue): boolean {
  return hourState(raw) === "clear";
}

export function hourToday(raw: HourValue, now = Date.now()): boolean {
  const at = hourDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function hourWeekend(raw: HourValue, now = Date.now()): boolean {
  const at = hourDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDay();
  return day === 0 || day === 6;
}

export function hourEven(raw: HourValue, now = Date.now()): boolean {
  const at = hourDate(raw, now);
  return Boolean(at) && at!.getUTCHours() % 2 === 0;
}

export function hourStep(raw: HourValue, now = Date.now()): number {
  const at = hourDate(raw, now);
  return at ? at.getUTCHours() : 0;
}

/** Older than a day and still inside a week. */
export function hourLeap(raw: HourValue, now = Date.now()): boolean {
  const age = hourAge(raw, now);
  return age !== null && age > DAY_MS && age <= STALE_MS;
}

/** Three days or more. */
export function hourWide(raw: HourValue, now = Date.now()): boolean {
  const age = hourAge(raw, now);
  return age !== null && age >= WIDE_MS;
}

export function hourTwin(raw: HourValue, now = Date.now()): boolean {
  const at = hourDate(raw, now);
  if (!at) return false;
  const minute = at.getUTCMinutes();
  return minute === 0 || minute === 30;
}

export function hourTail(raw: HourValue): boolean {
  return /z$/i.test(hourGiven(raw).trim());
}

export function hourMark(raw: HourValue): boolean {
  return hourGiven(raw).includes("T");
}

export function hourSpace(raw: HourValue): boolean {
  return hourGiven(raw).includes(" ");
}

export function hourKnown(raw: HourValue, now = Date.now()): boolean {
  const lane = hourLane(raw, now);
  return lane === "live" || lane === "dawn" || lane === "noon";
}

export function hourStamp(raw: HourValue, now = Date.now()): string {
  const at = hourDate(raw, now);
  if (!at) return "";
  const hour = String(at.getUTCHours()).padStart(2, "0");
  const minute = String(at.getUTCMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function hourCopy(raw: HourValue): string {
  return hourGiven(raw);
}

export function hourLanes(rows: readonly HourRow[], now = Date.now()): HourLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = hourLane(row.seen, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingHour(rows: readonly HourRow[], now = Date.now()): string {
  const lines = hourLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingHourHue(rows: readonly HourRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = hourHue(row.seen, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneHourCount(rows: readonly HourRow[], lane: HourLane, now = Date.now()): number {
  return rows.filter((row) => hourLane(row.seen, now) === lane).length;
}

export function hourShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentHourLanes(rows: readonly HourRow[], now = Date.now()): string[] {
  return hourLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenHours(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedHours(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleHour(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleHourReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkHourReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleHourLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: HourRow, shape: HourShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "live") return hourLive(row.seen, now);
  if (shape === "stale") return hourStale(row.seen, now);
  if (shape === "quiet") return hourQuiet(row.seen);
  if (shape === "today") return hourToday(row.seen, now);
  if (shape === "weekend") return hourWeekend(row.seen, now);
  if (shape === "even") return hourEven(row.seen, now);
  if (shape === "leap") return hourLeap(row.seen, now);
  if (shape === "wide") return hourWide(row.seen, now);
  if (shape === "twin") return hourTwin(row.seen, now);
  if (shape === "tail") return hourTail(row.seen);
  if (shape === "mark") return hourMark(row.seen);
  if (shape === "space") return hourSpace(row.seen);
  return hourLane(row.seen, now) === shape;
}

export function visibleHours(
  rows: readonly HourRow[],
  lane: string,
  hue: string,
  query: string,
  review: HourReview,
  reviewed: readonly string[],
  shape: HourShape,
  now = Date.now(),
): HourRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (hourState(row.seen, now) === "") return false;
    const found = hourLane(row.seen, now);
    const hueName = hourHue(row.seen, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${hourGiven(row.seen)} ${hourStamp(row.seen, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedHourCount(rows: readonly HourRow[], now = Date.now()): number {
  const stamps = rows.map((row) => hourStamp(row.seen, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function hourLanesCsv(rows: readonly HourRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of hourLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function hourRowsCsv(rows: readonly HourRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,seen,stamp,lane,hue,step,live,stale,today,weekend,even,leap,wide,twin,tail,mark,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (hourState(row.seen, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(hourGiven(row.seen)),
        hourStamp(row.seen, now),
        hourLane(row.seen, now),
        hourHue(row.seen, now),
        String(hourStep(row.seen, now)),
        hourLive(row.seen, now) ? "1" : "0",
        hourStale(row.seen, now) ? "1" : "0",
        hourToday(row.seen, now) ? "1" : "0",
        hourWeekend(row.seen, now) ? "1" : "0",
        hourEven(row.seen, now) ? "1" : "0",
        hourLeap(row.seen, now) ? "1" : "0",
        hourWide(row.seen, now) ? "1" : "0",
        hourTwin(row.seen, now) ? "1" : "0",
        hourTail(row.seen) ? "1" : "0",
        hourMark(row.seen) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
