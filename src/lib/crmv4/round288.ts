/**
 * Lodestone needles for a compass book kept in this browser, and contact plates read the last contact time already stored on the trader.
 * Beds are oak, slate, sand, and moss. Stones are iron, steel, and gilt.
 * Needles are 2, 4, or 6. Dips are 1, 3, or 5.
 * A warm contact is two hours. A cold contact is one hundred twenty days. Dates are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_lodestone (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   bed text not null default '',
 *   stone text not null default '',
 *   needle_no integer,
 *   dip_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_contact_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_contact_review (
 *   trader_id text primary key
 * );
 */

export const LDN_KEY = "crmv4-lodestone";
export const LDN_VIEW_KEY = "crmv4-lodestone-views";
export const LDN_DENSITY_KEY = "crmv4-lodestone-density";
export const CTC_KEY = "crmv4-contact-hide";
export const CTC_REVIEW_KEY = "crmv4-contact-review";

export const LODESTONE_BEDS = ["oak", "slate", "sand", "moss"] as const;

export type LodestoneBed = (typeof LODESTONE_BEDS)[number];

export type LodestoneStone = "blank" | "iron" | "steel" | "gilt";

export type LodestoneTray = "table" | "cabinet" | "cellar";

export type LodestoneDensity = "wide" | "narrow";

export type LodestoneSort = "bed" | "bearer";

export type Lodestone = {
  id: string;
  title: string;
  note: string;
  bearer: string;
  bed: string;
  needle: number | null;
  stone: string;
  dip: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type LodestoneView = {
  id: string;
  name: string;
  tray: LodestoneTray;
  query: string;
  bearer: string;
  stone: string;
  bed: string;
  needle: string;
  dip: string;
};

export type LodestoneCounts = {
  table: number;
  cabinet: number;
  cellar: number;
  logged: number;
  firm: number;
  soft: number;
  long: number;
  house: number;
  needle: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type ContactLane = "" | "warm" | "week" | "month" | "season" | "cold";

export type ContactHue = "" | "ivory" | "graphite" | "champagne";

export type ContactState = "" | "clear" | "set";

export type ContactReview = "all" | "reviewed" | "fresh";

export type ContactShape =
  | "all"
  | "warm"
  | "cold"
  | "quiet"
  | "today"
  | "quarter"
  | "even"
  | "leap"
  | "gap"
  | "deep"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "week"
  | "month"
  | "season";

export type ContactValue = string | { lastContactAt?: unknown; touched?: unknown; [key: string]: unknown } | null | undefined;

export type ContactRow = { id: string; label: string; touched: ContactValue };

export type ContactLaneLine = { lane: string; count: number };

export const ROUND288_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "needle",
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
  "fair-bearer",
  "viewer",
  "suggest",
  "sla",
  "contact",
  "contact-csv",
] as const;

const AUDITS = ["save", "edit", "note", "stone", "log", "unlog", "lock", "resume", "stow", "open", "tag", "dip", "needle", "lower", "star"] as const;

const STONES = ["iron", "steel", "gilt"] as const;

const NEEDLE_CYCLE = [2, 4, 6] as const;

const DIP_CYCLE = [1, 3, 5] as const;

const FIRM = new Set(["oak", "slate"]);

const SOFT = new Set(["sand", "moss"]);

const HOUSE_STONE = new Set(["STEEL", "GILT"]);

const EAST = new Set(["slate"]);

const LANE_ORDER = ["warm", "week", "month", "season", "cold"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const WARM_MS = 2 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEK_MS = 7 * DAY_MS;

const MONTH_MS = 28 * DAY_MS;

const GAP_MS = 10 * DAY_MS;

const DEEP_MS = 45 * DAY_MS;

const SEASON_MS = 120 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LodestoneTray {
  return raw === "cabinet" || raw === "cellar" ? raw : "table";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function stoneName(raw: unknown): Exclude<LodestoneStone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (STONES as readonly string[]).includes(text) ? (text as Exclude<LodestoneStone, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pq]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Lodestone, tray: LodestoneTray): boolean {
  if (tray === "cabinet") return card.locked && !card.stowed;
  if (tray === "cellar") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function bedIndex(bed: string): number {
  return LODESTONE_BEDS.indexOf(bed as LodestoneBed);
}

function needleIndex(needle: number): number {
  return NEEDLE_CYCLE.indexOf(needle as (typeof NEEDLE_CYCLE)[number]);
}

function dipIndex(dip: number): number {
  return DIP_CYCLE.indexOf(dip as (typeof DIP_CYCLE)[number]);
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

export function lodestoneBed(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (LODESTONE_BEDS as readonly string[]).includes(text) ? text : "";
}

/** A needle is 2, 4, or 6. Anything else stays blank. */
export function lodestoneNeedle(raw: unknown): 2 | 4 | 6 | null {
  if (!/^[246]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 2 | 4 | 6;
}

/** A dip is 1, 3, or 5. Anything else stays blank. */
export function lodestoneDip(raw: unknown): 1 | 3 | 5 | null {
  if (!/^[135]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 1 | 3 | 5;
}

/** Stone is iron, steel, or gilt. The saved stone is the upper case name. */
export function lodestoneStone(raw: unknown): string {
  const text = stoneName(raw);
  return text ? text.toUpperCase() : "";
}

export function firmBed(bed: unknown): boolean {
  return FIRM.has(clip(bed, 8).toLowerCase());
}

export function softBed(bed: unknown): boolean {
  return SOFT.has(clip(bed, 8).toLowerCase());
}

/** Oak is north. Slate is east. Sand is south. Moss is west. */
export function lodestoneBand(bed: unknown): string {
  const text = lodestoneBed(bed);
  if (!text) return "";
  if (text === "oak") return "north";
  if (EAST.has(text)) return "east";
  if (text === "sand") return "south";
  return "west";
}

/** Signed distance from one bed to the desk bed. */
export function bedGap(from: unknown, to: unknown): number | null {
  const left = bedIndex(lodestoneBed(from));
  const right = bedIndex(lodestoneBed(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseStone(stone: unknown): boolean {
  return HOUSE_STONE.has(lodestoneStone(stone));
}

/** A pair dip is 3. One and five are not a pair. */
export function pairDip(dip: unknown): boolean {
  return lodestoneDip(dip) === 3;
}

/** A full dip is 5. */
export function fullDip(dip: unknown): boolean {
  return lodestoneDip(dip) === 5;
}

export function activeBed(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "firm" || text === "soft") return text;
  return lodestoneBed(text) || "all";
}

export function activeNeedle(raw: unknown): string {
  const needle = lodestoneNeedle(raw);
  return needle === null ? "all" : String(needle);
}

export function activeStone(raw: unknown, allow: readonly string[]): string {
  const text = lodestoneStone(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDip(raw: unknown): string {
  const dip = lodestoneDip(raw);
  return dip === null ? "all" : String(dip);
}

export function moveLodestoneFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestLodestoneStone(cards: readonly Lodestone[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "table") || !card.stone) continue;
    counts.set(card.stone, (counts.get(card.stone) || 0) + 1);
  }
  let best = "IRON";
  let score = 0;
  for (const stone of ["IRON", "STEEL", "GILT"]) {
    const count = counts.get(stone) || 0;
    if (count > score) {
      best = stone;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest two. Through the afternoon, four. Evening asks for six. Saved needles win when any exist. */
export function suggestNeedle(cards: readonly Lodestone[], hour: number): 2 | 4 | 6 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "table") || card.needle === null) continue;
    counts.set(card.needle, (counts.get(card.needle) || 0) + 1);
  }
  let best: 2 | 4 | 6 | null = null;
  let score = 0;
  for (const needle of NEEDLE_CYCLE) {
    const count = counts.get(needle) || 0;
    if (count > score) {
      best = needle;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 9) return 2;
  if (hour < 17) return 4;
  return 6;
}

/** Before eleven, suggest oak. The rest of the day suggests moss. */
export function suggestBed(hour: number): LodestoneBed {
  return hour < 11 ? "oak" : "moss";
}

/** The bearer with the fewest unlogged table needles. A tie keeps the roster order. */
export function fairBearer(cards: readonly Lodestone[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "table") && !card.logged);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readLodestones(raw: unknown): Lodestone[] {
  if (!Array.isArray(raw)) return [];
  const out: Lodestone[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Lodestone>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      bed: lodestoneBed(row.bed),
      needle: lodestoneNeedle(row.needle),
      stone: lodestoneStone(row.stone),
      dip: lodestoneDip(row.dip) ?? 1,
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

export function addLodestone(
  cards: readonly Lodestone[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    bearer?: string;
    bed?: string;
    needle?: unknown;
    stone?: string;
    dip?: unknown;
    tags?: unknown;
  },
): Lodestone[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readLodestones([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      bed: lodestoneBed(card.bed),
      needle: lodestoneNeedle(card.needle),
      stone: lodestoneStone(card.stone),
      dip: lodestoneDip(card.dip) ?? 1,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Lodestone[], id: string, edit: (card: Lodestone) => Lodestone): Lodestone[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editLodestone(cards: readonly Lodestone[], id: string, title: string): Lodestone[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editLodestoneNote(cards: readonly Lodestone[], id: string, note: string): Lodestone[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleStone(stone: string): string {
  const order = ["", "IRON", "STEEL", "GILT"];
  const index = order.indexOf(lodestoneStone(stone));
  return order[(index + 1) % order.length] || "IRON";
}

export function setLodestoneStone(cards: readonly Lodestone[], id: string, stone: string): Lodestone[] {
  const next = lodestoneStone(stone);
  return mapCard(cards, id, (card) => (card.stone === next ? card : { ...card, stone: next, audit: "stone" }));
}

export function setLodestoneLogged(cards: readonly Lodestone[], id: string, logged: boolean): Lodestone[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setLodestoneLock(cards: readonly Lodestone[], id: string, locked: boolean): Lodestone[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setLodestoneStow(cards: readonly Lodestone[], id: string, stowed: boolean): Lodestone[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setLodestoneStar(cards: readonly Lodestone[], id: string, flagged: boolean): Lodestone[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addLodestoneTag(cards: readonly Lodestone[], id: string, tag: string): Lodestone[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNeedle(needle: number | null, dir: 1 | -1): 2 | 4 | 6 {
  if (needle === null) return dir > 0 ? 2 : 6;
  const index = needleIndex(needle);
  const next = index < 0 ? 0 : (index + dir + NEEDLE_CYCLE.length) % NEEDLE_CYCLE.length;
  return NEEDLE_CYCLE[next];
}

function stepDip(dip: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = dipIndex(dip);
  const next = index < 0 ? 0 : (index + dir + DIP_CYCLE.length) % DIP_CYCLE.length;
  return DIP_CYCLE[next];
}

export function liftNeedle(cards: readonly Lodestone[], id: string): Lodestone[] {
  return mapCard(cards, id, (card) => ({ ...card, needle: stepNeedle(card.needle, 1), audit: "needle" }));
}

export function lowerNeedle(cards: readonly Lodestone[], id: string): Lodestone[] {
  return mapCard(cards, id, (card) => ({ ...card, needle: stepNeedle(card.needle, -1), audit: "lower" }));
}

export function raiseDip(cards: readonly Lodestone[], id: string): Lodestone[] {
  return mapCard(cards, id, (card) => ({ ...card, dip: stepDip(card.dip, 1), audit: "dip" }));
}

export function lowerDip(cards: readonly Lodestone[], id: string): Lodestone[] {
  return mapCard(cards, id, (card) => ({ ...card, dip: stepDip(card.dip, -1), audit: "dip" }));
}

function focused(cards: readonly Lodestone[], id: string, edit: (card: Lodestone) => Lodestone): Lodestone[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logLodestoneFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function lockLodestoneFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return setLodestoneLock(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starLodestoneFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return setLodestoneStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagLodestoneFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return addLodestoneTag(cards, id, "p");
}

export function stoneFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  const card = cards.find((item) => item.id === id);
  return card ? setLodestoneStone(cards, id, cycleStone(card.stone)) : [...cards];
}

export function liftNeedleFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return liftNeedle(cards, id);
}

export function lowerNeedleFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return lowerNeedle(cards, id);
}

export function raiseDipFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return raiseDip(cards, id);
}

export function lowerDipFocused(cards: readonly Lodestone[], id: string): Lodestone[] {
  return lowerDip(cards, id);
}

function bulk(cards: readonly Lodestone[], ids: readonly string[], edit: (card: Lodestone) => Lodestone): Lodestone[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkLodestoneGilt(cards: readonly Lodestone[], ids: readonly string[]): Lodestone[] {
  return bulk(cards, ids, (card) => (card.stone === "GILT" ? card : { ...card, stone: "GILT", audit: "stone" }));
}

export function bulkLodestoneLog(cards: readonly Lodestone[], ids: readonly string[]): Lodestone[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkLodestoneStow(cards: readonly Lodestone[], ids: readonly string[]): Lodestone[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkLodestoneTag(cards: readonly Lodestone[], ids: readonly string[]): Lodestone[] {
  return bulk(cards, ids, (card) => (card.tags.includes("q") ? card : { ...card, tags: tagsOf([...card.tags, "q"]), audit: "tag" }));
}

export function readLodestoneViews(raw: unknown): LodestoneView[] {
  if (!Array.isArray(raw)) return [];
  const out: LodestoneView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LodestoneView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      stone: activeStone(row.stone, ["IRON", "STEEL", "GILT"]),
      bed: activeBed(row.bed),
      needle: activeNeedle(row.needle),
      dip: activeDip(row.dip),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addLodestoneView(views: readonly LodestoneView[], view: LodestoneView): LodestoneView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readLodestoneViews([...views, { ...view, id, name }]);
}

export function dropLodestoneView(views: readonly LodestoneView[], id: string): LodestoneView[] {
  return views.filter((view) => view.id !== id);
}

export function lodestoneDensity(raw: unknown): LodestoneDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortLodestones(cards: readonly Lodestone[], sort: LodestoneSort): Lodestone[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "bearer") {
      const bearer = a.bearer.localeCompare(b.bearer);
      if (bearer) return bearer;
    } else {
      const bed = bedIndex(a.bed) - bedIndex(b.bed);
      if (bed) return bed;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleLodestones(
  cards: readonly Lodestone[],
  tray: LodestoneTray,
  query: string,
  bearer: string,
  stone: string,
  bed: string,
  needle: string,
  dip: string,
): Lodestone[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantStone = stone === "all" ? "" : lodestoneStone(stone);
  const wantBed = activeBed(bed);
  const wantNeedle = activeNeedle(needle);
  const wantDip = activeDip(dip);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantStone && card.stone !== wantStone) return false;
    if (wantBed === "firm" && !firmBed(card.bed)) return false;
    if (wantBed === "soft" && !softBed(card.bed)) return false;
    if (wantBed !== "all" && wantBed !== "firm" && wantBed !== "soft" && card.bed !== wantBed) return false;
    if (wantNeedle !== "all" && String(card.needle ?? "") !== wantNeedle) return false;
    if (wantDip !== "all" && String(card.dip) !== wantDip) return false;
    return true;
  });
}

/** A soft bed on the first dip, still unlogged and not in the cellar, is overdue. */
export function overdueLodestone(card: Lodestone): boolean {
  return softBed(card.bed) && card.dip === 1 && !card.logged && !card.stowed;
}

/** No stone, two needles, one dip, and still on the table. */
export function idleLodestone(card: Lodestone): boolean {
  return !card.stone && card.needle === 2 && card.dip === 1 && !card.logged && !card.locked && !card.stowed;
}

/** Gilt, six needles, and a full dip, still out of the cellar. */
export function briskLodestone(card: Lodestone): boolean {
  return card.stone === "GILT" && card.needle === 6 && card.dip === 5 && !card.stowed;
}

/** Moss, iron, and four needles. */
export function restingLodestone(card: Lodestone): boolean {
  return card.bed === "moss" && card.stone === "IRON" && card.needle === 4;
}

/** An oak needle is late when the desk is already on moss. */
export function lateLodestone(card: Lodestone, desk: string): boolean {
  return card.bed === "oak" && lodestoneBed(desk) === "moss" && !card.logged;
}

export function lodestoneCounts(cards: readonly Lodestone[], shown: readonly Lodestone[], desk: string): LodestoneCounts {
  return {
    table: cards.filter((card) => inTray(card, "table")).length,
    cabinet: cards.filter((card) => inTray(card, "cabinet")).length,
    cellar: cards.filter((card) => inTray(card, "cellar")).length,
    logged: cards.filter((card) => card.logged).length,
    firm: cards.filter((card) => firmBed(card.bed)).length,
    soft: cards.filter((card) => softBed(card.bed)).length,
    long: cards.filter((card) => card.needle === 6).length,
    house: cards.filter((card) => houseStone(card.stone)).length,
    needle: cards.reduce((sum, card) => sum + (card.needle || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleLodestone).length,
    brisk: cards.filter(briskLodestone).length,
    resting: cards.filter(restingLodestone).length,
    overdue: cards.filter(overdueLodestone).length,
    pair: cards.filter((card) => pairDip(card.dip) && lateLodestone(card, desk)).length,
  };
}

export function lodestoneBars(cards: readonly Lodestone[]): { bed: string; count: number }[] {
  return LODESTONE_BEDS.map((bed) => ({ bed, count: cards.filter((card) => card.bed === bed && !card.stowed).length }));
}

export function lodestoneTimeline(cards: readonly Lodestone[]): { needle: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "table"));
  return NEEDLE_CYCLE.map((needle) => ({ needle, titles: open.filter((card) => card.needle === needle).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function lodestoneBearers(cards: readonly Lodestone[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Lodestone[]): string {
  const open = cards.filter((card) => inTray(card, "table") && !card.logged && card.bearer);
  let best = "";
  let score = 0;
  for (const name of lodestoneBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderLodestones(cards: readonly Lodestone[]): string[] {
  return cards.filter(overdueLodestone).map((card) => card.title);
}

export function idleLodestoneList(cards: readonly Lodestone[]): string[] {
  return cards.filter(idleLodestone).map((card) => card.title);
}

export function lodestoneCopy(card: Lodestone): string {
  return [card.title, card.bearer, card.bed, card.stone, card.needle ?? "", card.dip, card.note].filter((item) => item !== "").join(" · ");
}

export function lodestoneCsv(cards: readonly Lodestone[], desk: string): string {
  const lines = ["title,bearer,bed,stone,needle,dip,tags,logged,locked,stowed,starred,soft,late,idle,brisk,resting,overdue,firm,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.bearer),
        card.bed,
        card.stone,
        card.needle ?? "",
        card.dip,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        softBed(card.bed) ? "1" : "0",
        lateLodestone(card, desk) ? "1" : "0",
        idleLodestone(card) ? "1" : "0",
        briskLodestone(card) ? "1" : "0",
        restingLodestone(card) ? "1" : "0",
        overdueLodestone(card) ? "1" : "0",
        firmBed(card.bed) ? "1" : "0",
        houseStone(card.stone) ? "1" : "0",
        lodestoneBand(card.bed),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: ContactValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function contactRecord(raw: ContactValue): { lastContactAt?: unknown; touched?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function contactGiven(raw: ContactValue): string {
  const row = contactRecord(raw);
  if (row && !("lastContactAt" in row) && !("touched" in row)) return "";
  const value = row ? row.lastContactAt ?? row.touched : raw;
  return clip(value, 40);
}

export function contactState(raw: ContactValue, now = Date.now()): ContactState {
  if (hasBlocked(raw)) return "";
  const row = contactRecord(raw);
  if (row && !("lastContactAt" in row) && !("touched" in row)) return "";
  return contactDate(raw, now) ? "set" : "clear";
}

function contactDate(raw: ContactValue, now = Date.now()): Date | null {
  if (contactStateRaw(raw) === "blocked") return null;
  const text = contactGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const age = now - at;
  if (age < -WARM_MS) return null;
  return new Date(at);
}

function contactStateRaw(raw: ContactValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = contactRecord(raw);
  if (row && !("lastContactAt" in row) && !("touched" in row)) return "blocked";
  return "open";
}

function contactAge(raw: ContactValue, now: number): number | null {
  const at = contactDate(raw, now);
  if (!at) return null;
  return now - at.getTime();
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function quarterOf(at: Date): number {
  return Math.floor(at.getUTCMonth() / 3);
}

/** Warm within two hours, cold after one hundred twenty days, otherwise the age band. */
export function contactLane(raw: ContactValue, now = Date.now()): ContactLane {
  if (contactState(raw, now) !== "set") return "";
  const age = contactAge(raw, now);
  if (age === null) return "";
  if (age <= WARM_MS) return "warm";
  if (age <= WEEK_MS) return "week";
  if (age <= MONTH_MS) return "month";
  if (age <= SEASON_MS) return "season";
  return "cold";
}

export function contactHue(raw: ContactValue, now = Date.now()): ContactHue {
  const lane = contactLane(raw, now);
  if (!lane) return "";
  if (lane === "warm" || lane === "month") return "champagne";
  if (lane === "week" || lane === "season") return "ivory";
  return "graphite";
}

export function contactWarm(raw: ContactValue, now = Date.now()): boolean {
  return contactLane(raw, now) === "warm";
}

export function contactCold(raw: ContactValue, now = Date.now()): boolean {
  return contactLane(raw, now) === "cold";
}

export function contactQuiet(raw: ContactValue): boolean {
  return contactState(raw) === "clear";
}

export function contactToday(raw: ContactValue, now = Date.now()): boolean {
  const at = contactDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function contactQuarter(raw: ContactValue, now = Date.now()): boolean {
  const at = contactDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && quarterOf(at) === quarterOf(clock);
}

export function contactEven(raw: ContactValue, now = Date.now()): boolean {
  const at = contactDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function contactStep(raw: ContactValue, now = Date.now()): number {
  const at = contactDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

/** The contact year is a leap year. */
export function contactLeap(raw: ContactValue, now = Date.now()): boolean {
  const at = contactDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

/** Older than ten days and still inside one hundred twenty days. */
export function contactGap(raw: ContactValue, now = Date.now()): boolean {
  const age = contactAge(raw, now);
  return age !== null && age > GAP_MS && age <= SEASON_MS;
}

/** Forty-five days or more. */
export function contactDeep(raw: ContactValue, now = Date.now()): boolean {
  const age = contactAge(raw, now);
  return age !== null && age >= DEEP_MS;
}

export function contactTwin(raw: ContactValue, now = Date.now()): boolean {
  const at = contactDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDate();
  return day === 5 || day === 20;
}

export function contactTail(raw: ContactValue): boolean {
  return /z$/i.test(contactGiven(raw).trim());
}

export function contactMark(raw: ContactValue): boolean {
  return contactGiven(raw).includes("T");
}

export function contactSpace(raw: ContactValue): boolean {
  return contactGiven(raw).includes(" ");
}

export function contactKnown(raw: ContactValue, now = Date.now()): boolean {
  const lane = contactLane(raw, now);
  return lane === "warm" || lane === "week" || lane === "month";
}

export function contactStamp(raw: ContactValue, now = Date.now()): string {
  const at = contactDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function contactCopy(raw: ContactValue): string {
  return contactGiven(raw);
}

export function contactLanes(rows: readonly ContactRow[], now = Date.now()): ContactLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = contactLane(row.touched, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingContact(rows: readonly ContactRow[], now = Date.now()): string {
  const lines = contactLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingContactHue(rows: readonly ContactRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = contactHue(row.touched, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneContactCount(rows: readonly ContactRow[], lane: ContactLane, now = Date.now()): number {
  return rows.filter((row) => contactLane(row.touched, now) === lane).length;
}

export function contactShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentContactLanes(rows: readonly ContactRow[], now = Date.now()): string[] {
  return contactLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenContact(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedContact(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleContact(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleContactReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkContactReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleContactLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: ContactRow, shape: ContactShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "warm") return contactWarm(row.touched, now);
  if (shape === "cold") return contactCold(row.touched, now);
  if (shape === "quiet") return contactQuiet(row.touched);
  if (shape === "today") return contactToday(row.touched, now);
  if (shape === "quarter") return contactQuarter(row.touched, now);
  if (shape === "even") return contactEven(row.touched, now);
  if (shape === "leap") return contactLeap(row.touched, now);
  if (shape === "gap") return contactGap(row.touched, now);
  if (shape === "deep") return contactDeep(row.touched, now);
  if (shape === "twin") return contactTwin(row.touched, now);
  if (shape === "tail") return contactTail(row.touched);
  if (shape === "mark") return contactMark(row.touched);
  if (shape === "space") return contactSpace(row.touched);
  return contactLane(row.touched, now) === shape;
}

export function visibleContact(
  rows: readonly ContactRow[],
  lane: string,
  hue: string,
  query: string,
  review: ContactReview,
  reviewed: readonly string[],
  shape: ContactShape,
  now = Date.now(),
): ContactRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (contactState(row.touched, now) === "") return false;
    const found = contactLane(row.touched, now);
    const hueName = contactHue(row.touched, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${contactGiven(row.touched)} ${contactStamp(row.touched, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedContactCount(rows: readonly ContactRow[], now = Date.now()): number {
  const stamps = rows.map((row) => contactStamp(row.touched, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function contactLanesCsv(rows: readonly ContactRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of contactLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function contactRowsCsv(rows: readonly ContactRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,touched,stamp,lane,hue,step,warm,cold,today,quarter,even,leap,gap,deep,twin,tail,mark,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (contactState(row.touched, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(contactGiven(row.touched)),
        contactStamp(row.touched, now),
        contactLane(row.touched, now),
        contactHue(row.touched, now),
        String(contactStep(row.touched, now)),
        contactWarm(row.touched, now) ? "1" : "0",
        contactCold(row.touched, now) ? "1" : "0",
        contactToday(row.touched, now) ? "1" : "0",
        contactQuarter(row.touched, now) ? "1" : "0",
        contactEven(row.touched, now) ? "1" : "0",
        contactLeap(row.touched, now) ? "1" : "0",
        contactGap(row.touched, now) ? "1" : "0",
        contactDeep(row.touched, now) ? "1" : "0",
        contactTwin(row.touched, now) ? "1" : "0",
        contactTail(row.touched) ? "1" : "0",
        contactMark(row.touched) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
