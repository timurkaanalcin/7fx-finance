/**
 * Trestle cards for a workshop follow-up book, and group seals already stored as a trader trading group.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_trestle_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   joiner text not null default '',
 *   bay text not null default '',
 *   timber text not null default '',
 *   gait text not null default '',
 *   span_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   waiting boolean not null default false,
 *   filed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_group_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_group_seal_review (
 *   trader_id text primary key
 * );
 */

export const TRS_KEY = "crmv4-trestle-card";
export const TRS_VIEW_KEY = "crmv4-trestle-views";
export const TRS_DENSITY_KEY = "crmv4-trestle-density";
export const TGS_KEY = "crmv4-group-hide";
export const TGS_REVIEW_KEY = "crmv4-group-review";

export const TRESTLE_BAYS = ["dawn", "noon", "dusk", "night", "vigil", "rest"] as const;

export type TrestleBay = (typeof TRESTLE_BAYS)[number];

export type TimberName = "blank" | "oak" | "ash" | "yew";

export type GaitName = "blank" | "stroll" | "stride" | "sprint";

export type TrestleTray = "open" | "held" | "shelved";

export type TrestleDensity = "airy" | "tight";

export type TrestleSort = "bay" | "joiner";

export type TrestleCard = {
  id: string;
  title: string;
  note: string;
  joiner: string;
  bay: string;
  span: number | null;
  timber: string;
  gait: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  shelved: boolean;
  flagged: boolean;
  audit: string;
};

export type TrestleView = {
  id: string;
  name: string;
  tray: TrestleTray;
  query: string;
  joiner: string;
  timber: string;
  gait: string;
  bay: string;
  span: string;
  rank: string;
};

export type TrestleCounts = {
  open: number;
  held: number;
  shelved: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rank: number;
  house: number;
  span: number;
  matched: number;
  flagged: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type SealLane = "" | "house" | "bench" | "duo" | "split" | "brief" | "long" | "mark" | "plain";

export type SealHue = "" | "ivory" | "graphite" | "champagne" | "ink" | "vellum" | "ash";

export type SealState = "" | "clear" | "set";

export type SealShape = "all" | "house" | "bench" | "duo" | "split" | "brief" | "long" | "mark" | "wide" | "notch";

export type SealReview = "all" | "reviewed" | "fresh";

export type SealValue = string | { tradingGroup?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type SealRow = { id: string; label: string; note: SealValue };

export type SealLaneLine = { lane: string; count: number };

export const ROUND253_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "wait",
  "file",
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
  "fair-joiner",
  "viewer",
  "suggest",
  "sla",
  "seals",
  "seal-csv",
] as const;

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "shelve", "open", "timber", "tag", "rank", "span", "short", "flag"] as const;

const TIMBERS = ["oak", "ash", "yew"] as const;

const GAITS = ["stroll", "stride", "sprint"] as const;

const GAIT_CYCLE = ["stroll", "stride", "sprint"] as const;

const SPAN_CYCLE = [15, 45, 90] as const;

const RANK_CYCLE = [1, 3, 5, 9] as const;

const PEAK = new Set(["dawn", "vigil"]);

const QUIET = new Set(["night", "rest"]);

const HOUSE = new Set(["OAK", "ASH"]);

const EARLY = new Set(["dawn", "noon"]);

const MID = new Set(["dusk", "night"]);

const LATE = new Set(["vigil", "rest"]);

const LANE_ORDER = ["house", "bench", "duo", "split", "brief", "long", "mark", "plain"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne", "ink", "vellum", "ash"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 36;

const VIEW_CAP = 6;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TrestleTray {
  return raw === "held" || raw === "shelved" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function timberName(raw: unknown): Exclude<TimberName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TIMBERS as readonly string[]).includes(text) ? (text as Exclude<TimberName, "blank">) : "";
}

function gaitName(raw: unknown): Exclude<GaitName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GAITS as readonly string[]).includes(text) ? (text as Exclude<GaitName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[mnop]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: TrestleCard, tray: TrestleTray): boolean {
  if (tray === "held") return card.held && !card.shelved;
  if (tray === "shelved") return card.shelved;
  return !card.held && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function bayIndex(bay: string): number {
  return TRESTLE_BAYS.indexOf(bay as TrestleBay);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function trestleLine(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank note stays blank. It is not filled in. */
export function trestleNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A bay outside the six watches is left blank. */
export function bayOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TRESTLE_BAYS as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 15, 45, or 90 minutes. Anything else stays blank. */
export function spanOf(raw: unknown): 15 | 45 | 90 | null {
  const value = Number(clip(raw, 2));
  return (SPAN_CYCLE as readonly number[]).includes(value) ? (value as 15 | 45 | 90) : null;
}

/** Rank is 1, 3, 5, or 9. Anything else stays blank. */
export function rankOf(raw: unknown): 1 | 3 | 5 | 9 | null {
  const value = Number(clip(raw, 2));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 9) : null;
}

/** Timber is oak, ash, or yew. The saved timber is OAK, ASH, or YEW. */
export function timberOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "oak") return "OAK";
  if (text === "ash") return "ASH";
  if (text === "yew") return "YEW";
  return "";
}

/** Gait is stroll, stride, or sprint. A blank gait stays blank. */
export function gaitOf(raw: unknown): string {
  return gaitName(raw);
}

export function peakBay(bay: unknown): boolean {
  return PEAK.has(bayOf(bay));
}

export function quietBay(bay: unknown): boolean {
  return QUIET.has(bayOf(bay));
}

/** Early is dawn and noon. Mid is dusk and night. Late is vigil and rest. */
export function bayBand(bay: unknown): "early" | "mid" | "late" | "" {
  const name = bayOf(bay);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the card bay to the desk bay. A blank bay has no gap. */
export function bayGap(cardBay: unknown, deskBay: unknown): number | null {
  const from = bayIndex(bayOf(cardBay));
  const to = bayIndex(bayOf(deskBay));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseTimber(timber: unknown): boolean {
  return HOUSE.has(timberOf(timber));
}

export function activeBay(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return bayOf(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const value = spanOf(raw);
  return value === null ? "all" : String(value);
}

export function activeGait(raw: unknown, gaits: readonly string[]): string {
  const gait = gaitOf(raw);
  return gait && gaits.includes(gait) ? gait : "all";
}

export function activeRank(raw: unknown): string {
  const value = rankOf(raw);
  return value === null ? "all" : String(value);
}

export function activeTimber(raw: unknown): string {
  const name = timberName(raw);
  return name || "all";
}

export function moveTrestleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The timber used most often. A tie, or an empty book, keeps oak. */
export function suggestTimber(cards: readonly TrestleCard[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.timber) continue;
    counts.set(card.timber, (counts.get(card.timber) || 0) + 1);
  }
  let best = "OAK";
  let score = 0;
  for (const timber of ["OAK", "ASH", "YEW"]) {
    const count = counts.get(timber) || 0;
    if (count > score) {
      best = timber;
      score = count;
    }
  }
  return best;
}

/** A morning desk asks for a short SLA. An evening desk asks for a long one. Saved spans win when any exist. */
export function suggestSpan(cards: readonly TrestleCard[], hour: number): 15 | 45 | 90 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.span === null) continue;
    counts.set(card.span, (counts.get(card.span) || 0) + 1);
  }
  let best: 15 | 45 | 90 | null = null;
  let score = 0;
  for (const span of SPAN_CYCLE) {
    const count = counts.get(span) || 0;
    if (count > score) {
      best = span;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 11) return 15;
  if (hour < 17) return 45;
  return 90;
}

/** The joiner with the fewest open cards. A tie keeps the roster order. */
export function fairJoiner(cards: readonly TrestleCard[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.joiner.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readTrestles(raw: unknown): TrestleCard[] {
  if (!Array.isArray(raw)) return [];
  const out: TrestleCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TrestleCard>;
    const id = clip(row.id, 40);
    const title = trestleLine(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: trestleNote(row.note),
      joiner: clip(row.joiner, 24),
      bay: bayOf(row.bay),
      span: spanOf(row.span),
      timber: timberOf(row.timber),
      gait: gaitOf(row.gait),
      rank: rankOf(row.rank) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      shelved: row.shelved === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addTrestle(
  cards: readonly TrestleCard[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    joiner?: string;
    bay?: string;
    span?: unknown;
    timber?: string;
    gait?: string;
    rank?: unknown;
    tags?: string;
  },
): TrestleCard[] {
  const current = readTrestles(cards);
  const id = clip(card.id, 40);
  const title = trestleLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: TrestleCard = {
    id,
    title,
    note: trestleNote(card.note),
    joiner: clip(card.joiner, 24),
    bay: bayOf(card.bay),
    span: spanOf(card.span),
    timber: timberOf(card.timber),
    gait: gaitOf(card.gait),
    rank: rankOf(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    shelved: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly TrestleCard[], id: string, change: (card: TrestleCard) => TrestleCard): TrestleCard[] {
  return readTrestles(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly TrestleCard[], ids: readonly string[], change: (card: TrestleCard) => TrestleCard): TrestleCard[] {
  const picked = new Set(ids);
  return readTrestles(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editTrestle(cards: readonly TrestleCard[], id: string, title: string): TrestleCard[] {
  const next = trestleLine(title);
  if (!next) return readTrestles(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTrestleNote(cards: readonly TrestleCard[], id: string, note: string): TrestleCard[] {
  const next = trestleNote(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setTrestlePin(cards: readonly TrestleCard[], id: string, pinned: boolean): TrestleCard[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setTrestleWait(cards: readonly TrestleCard[], id: string, held: boolean): TrestleCard[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, shelved: held ? false : card.shelved, audit: held ? "hold" : "resume" }));
}

export function setTrestleFile(cards: readonly TrestleCard[], id: string, shelved: boolean): TrestleCard[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, held: shelved ? false : card.held, audit: shelved ? "shelve" : "open" }));
}

export function setTrestleStar(cards: readonly TrestleCard[], id: string, flagged: boolean): TrestleCard[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setTrestleTimber(cards: readonly TrestleCard[], id: string, timber: unknown): TrestleCard[] {
  const next = timberOf(timber);
  if (!next) return readTrestles(cards);
  return mapCard(cards, id, (card) => (card.timber === next ? card : { ...card, timber: next, audit: "timber" }));
}

/** Gait steps stroll, stride, sprint, then stroll again. A blank gait starts at stroll. */
export function cycleGait(cards: readonly TrestleCard[], id: string): TrestleCard[] {
  return mapCard(cards, id, (card) => {
    const at = GAIT_CYCLE.indexOf(card.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    return next === card.gait ? card : { ...card, gait: next, audit: "gait" };
  });
}

export function addTrestleTag(cards: readonly TrestleCard[], id: string, tag: string): TrestleCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTrestles(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank span becomes 15, 15 becomes 45, and 45 becomes 90. A span of 90 stays. */
export function lengthenSpan(cards: readonly TrestleCard[], id: string): TrestleCard[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 90) return card;
    const next = card.span === 45 ? 90 : card.span === 15 ? 45 : 15;
    return { ...card, span: next, audit: "span" };
  });
}

/** A blank span becomes 90, 90 becomes 45, and 45 becomes 15. A span of 15 stays. */
export function shortenSpan(cards: readonly TrestleCard[], id: string): TrestleCard[] {
  return mapCard(cards, id, (card) => {
    if (card.span === 15) return card;
    const next = card.span === 45 ? 15 : card.span === 90 ? 45 : 90;
    return { ...card, span: next, audit: "short" };
  });
}

/** Rank steps 1, 3, 5, 9. A blank rank starts at 1. Rank 9 stays. */
export function raiseRank(cards: readonly TrestleCard[], id: string): TrestleCard[] {
  return mapCard(cards, id, (card) => {
    if (card.rank === 9) return card;
    const next = card.rank === 5 ? 9 : card.rank === 3 ? 5 : card.rank === 1 ? 3 : 1;
    return { ...card, rank: next, audit: "rank" };
  });
}

/** Rank steps 9, 5, 3, 1. A blank rank starts at 9. Rank 1 stays. */
export function lowerRank(cards: readonly TrestleCard[], id: string): TrestleCard[] {
  return mapCard(cards, id, (card) => {
    if (card.rank === 1) return card;
    const next = card.rank === 3 ? 1 : card.rank === 5 ? 3 : card.rank === 9 ? 5 : 9;
    return { ...card, rank: next, audit: "rank" };
  });
}

function focusedCard(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard | undefined {
  const id = shownIds[index];
  return id ? readTrestles(cards).find((card) => card.id === id) : undefined;
}

export function pinFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readTrestles(cards);
  return setTrestlePin(cards, card.id, !card.pinned);
}

export function waitFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readTrestles(cards);
  return setTrestleWait(cards, card.id, !card.held);
}

export function gaitFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const id = shownIds[index];
  return id ? cycleGait(cards, id) : readTrestles(cards);
}

export function starFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readTrestles(cards);
  return setTrestleStar(cards, card.id, !card.flagged);
}

export function tagFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number, tag: string): TrestleCard[] {
  const id = shownIds[index];
  return id ? addTrestleTag(cards, id, tag) : readTrestles(cards);
}

export function raiseFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const id = shownIds[index];
  return id ? raiseRank(cards, id) : readTrestles(cards);
}

export function lowerFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const id = shownIds[index];
  return id ? lowerRank(cards, id) : readTrestles(cards);
}

export function lengthenFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const id = shownIds[index];
  return id ? lengthenSpan(cards, id) : readTrestles(cards);
}

export function shortenFocusedTrestle(cards: readonly TrestleCard[], shownIds: readonly string[], index: number): TrestleCard[] {
  const id = shownIds[index];
  return id ? shortenSpan(cards, id) : readTrestles(cards);
}

export function bulkTrestlePin(cards: readonly TrestleCard[], ids: readonly string[]): TrestleCard[] {
  return touchIds(cards, ids, (card) => (card.pinned ? card : { ...card, pinned: true, audit: "pin" }));
}

export function bulkTrestleFile(cards: readonly TrestleCard[], ids: readonly string[]): TrestleCard[] {
  return touchIds(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, held: false, audit: "shelve" }));
}

export function bulkTrestleSprint(cards: readonly TrestleCard[], ids: readonly string[]): TrestleCard[] {
  return touchIds(cards, ids, (card) => (card.gait === "sprint" ? card : { ...card, gait: "sprint", audit: "gait" }));
}

export function bulkTrestleTag(cards: readonly TrestleCard[], ids: readonly string[], tag: string): TrestleCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTrestles(cards);
  return touchIds(cards, ids, (card) => (card.tags.includes(next) || card.tags.length >= TAG_CAP ? card : { ...card, tags: [...card.tags, next], audit: "tag" }));
}

export function bulkTrestleYew(cards: readonly TrestleCard[], ids: readonly string[]): TrestleCard[] {
  return touchIds(cards, ids, (card) => (card.timber === "YEW" ? card : { ...card, timber: "YEW", audit: "timber" }));
}

export function readTrestleViews(raw: unknown): TrestleView[] {
  if (!Array.isArray(raw)) return [];
  const out: TrestleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TrestleView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      joiner: clip(row.joiner, 24),
      timber: activeTimber(row.timber),
      gait: activeGait(row.gait, GAITS),
      bay: activeBay(row.bay),
      span: activeSpan(row.span),
      rank: activeRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTrestleView(
  views: readonly TrestleView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    joiner?: string;
    timber?: string;
    gait?: string;
    bay?: string;
    span?: string;
    rank?: string;
  },
): TrestleView[] {
  const current = readTrestleViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: TrestleView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    joiner: clip(view.joiner, 24),
    timber: activeTimber(view.timber),
    gait: activeGait(view.gait, GAITS),
    bay: activeBay(view.bay),
    span: activeSpan(view.span),
    rank: activeRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropTrestleView(views: readonly TrestleView[], id: string): TrestleView[] {
  return readTrestleViews(views).filter((view) => view.id !== id);
}

export function trestleDensity(raw: unknown): TrestleDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A card more than two bays behind the desk, at rank 1, is late. */
export function lateTrestle(card: TrestleCard, deskBay: unknown): boolean {
  const gap = bayGap(card.bay, deskBay);
  return card.rank === 1 && gap !== null && gap > 2;
}

export function idleTrestle(card: TrestleCard): boolean {
  return card.gait === "stroll" && quietBay(card.bay) && card.rank === 1;
}

export function rushTrestle(card: TrestleCard): boolean {
  return card.rank === 9 && card.gait === "sprint" && peakBay(card.bay);
}

export function restingTrestle(card: TrestleCard): boolean {
  return card.span === 90 && card.gait === "stride" && !card.flagged;
}

/** A fifteen-minute SLA on a peak bay is overdue unless the card is pinned. */
export function overdueTrestle(card: TrestleCard): boolean {
  return card.span === 15 && peakBay(card.bay) && !card.pinned;
}

export function visibleTrestles(
  cards: readonly TrestleCard[],
  tray: TrestleTray,
  query: string,
  joiner: string,
  timber: string,
  gait: string,
  bay: string,
  span: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): TrestleCard[] {
  const text = query.trim().toLowerCase();
  const joinerOn = joiner === "all" ? "" : joiner.trim().toLowerCase();
  const timberOn = timber === "all" ? "" : timberOf(timber);
  const gaitOn = gait === "all" ? "" : gaitOf(gait);
  const bayOn = bay === "all" ? "" : activeBay(bay);
  const spanOn = span === "all" ? "" : activeSpan(span);
  const rankOn = rank === "all" ? "" : activeRank(rank);
  return readTrestles(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (joinerOn && card.joiner.toLowerCase() !== joinerOn) return false;
    if (timberOn && card.timber !== timberOn) return false;
    if (gaitOn && card.gait !== gaitOn) return false;
    if (bayOn === "peak" && !peakBay(card.bay)) return false;
    if (bayOn === "quiet" && !quietBay(card.bay)) return false;
    if (bayOn && bayOn !== "peak" && bayOn !== "quiet" && card.bay !== bayOn) return false;
    if (spanOn && String(card.span ?? "") !== spanOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseTimber(card.timber)) return false;
    if (peakOnly && !peakBay(card.bay)) return false;
    if (quietOnly && !quietBay(card.bay)) return false;
    return true;
  });
}

export function sortTrestles(cards: readonly TrestleCard[], sort: TrestleSort): TrestleCard[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "joiner") {
      const joiner = a.joiner.localeCompare(b.joiner);
      if (joiner) return joiner;
    }
    const bay = (bayIndex(a.bay) < 0 ? 99 : bayIndex(a.bay)) - (bayIndex(b.bay) < 0 ? 99 : bayIndex(b.bay));
    if (bay) return bay;
    return a.title.localeCompare(b.title);
  });
}

export function trestleCounts(cards: readonly TrestleCard[], shown: readonly TrestleCard[], deskBay: unknown): TrestleCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    shelved: cards.filter((card) => inTray(card, "shelved")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakBay(card.bay)).length,
    quiet: open.filter((card) => quietBay(card.bay)).length,
    soon: open.filter((card) => card.span === 15).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseTimber(card.timber)).length,
    span: open.filter((card) => card.span !== null).length,
    matched: open.filter((card) => card.bay && card.bay === bayOf(deskBay)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleTrestle(card)).length,
    rush: open.filter((card) => rushTrestle(card)).length,
    resting: open.filter((card) => restingTrestle(card)).length,
    overdue: open.filter((card) => overdueTrestle(card)).length,
  };
}

export function clashBayCount(cards: readonly TrestleCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.bay);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.bay === card.bay && other.rank === card.rank)).length;
}

export function neighborTrestleCount(cards: readonly TrestleCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestJoiner(cards: readonly TrestleCard[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.joiner);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.joiner.toLowerCase() === card.joiner.toLowerCase()).length;
    if (count > score) {
      best = card.joiner;
      score = count;
    }
  }
  return best;
}

export function reminderTrestles(cards: readonly TrestleCard[]): TrestleCard[] {
  return cards.filter((card) => inTray(card, "open") && (card.span === 15 || card.span === 45));
}

export function idleTrestles(cards: readonly TrestleCard[]): TrestleCard[] {
  return cards.filter((card) => inTray(card, "open") && idleTrestle(card));
}

export function trestleTimeline(cards: readonly TrestleCard[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function trestleBars(cards: readonly TrestleCard[]): { bay: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return TRESTLE_BAYS.map((bay) => ({ bay, count: open.filter((card) => card.bay === bay).length }));
}

export function trestleJoiners(cards: readonly TrestleCard[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.joiner || out.some((item) => item.toLowerCase() === card.joiner.toLowerCase())) continue;
    out.push(card.joiner);
  }
  return out;
}

export function trestleCopy(card: TrestleCard): string {
  return [card.title, card.joiner, card.bay, card.timber, card.gait, card.span ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function trestleShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function trestleCsv(cards: readonly TrestleCard[], deskBay: unknown): string {
  const lines = ["title,joiner,bay,timber,gait,span,rank,tags,pinned,waiting,filed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readTrestles(cards)) {
    const gap = bayGap(card.bay, deskBay);
    lines.push([
      csvCell(card.title),
      csvCell(card.joiner),
      card.bay,
      card.timber,
      card.gait,
      card.span === null ? "" : String(card.span),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.shelved ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateTrestle(card, deskBay) ? "1" : "0",
      idleTrestle(card) ? "1" : "0",
      peakBay(card.bay) ? "1" : "0",
      quietBay(card.bay) ? "1" : "0",
      houseTimber(card.timber) ? "1" : "0",
      bayBand(card.bay),
      rushTrestle(card) ? "1" : "0",
      restingTrestle(card) ? "1" : "0",
      overdueTrestle(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function sealRecord(raw: SealValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function sealText(raw: SealValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = sealRecord(raw);
  if (!row || !("tradingGroup" in row)) return "";
  return clip(row.tradingGroup, 32);
}

function hasBlocked(raw: SealValue): boolean {
  const row = sealRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

/** A trading group of two to twenty-four marks. Money fields and other objects stay blank. */
function sealName(raw: SealValue): string {
  if (hasBlocked(raw)) return "";
  const row = sealRecord(raw);
  if (row && !("tradingGroup" in row)) return "";
  const text = sealText(raw).replace(/\s+/g, " ").trim();
  if (!/^[A-Za-z][A-Za-z0-9 /'_-]{1,23}$/.test(text)) return "";
  return text;
}

/** A blocked field clears the seal. A group of two to twenty-four marks is set. */
export function sealState(raw: SealValue): SealState {
  if (hasBlocked(raw)) return "";
  const row = sealRecord(raw);
  if (row && !("tradingGroup" in row)) return "";
  return sealName(raw) ? "set" : "clear";
}

/** The first letter, the last letter, and the letter count. VIP is VP3. */
export function sealStamp(raw: SealValue): string {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  if (!name) return "";
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (compact.length < 2) return "";
  return `${compact.slice(0, 1)}${compact.slice(-1)}${compact.length}`;
}

/** All capitals of three or more letters are the house. A digit is a mark. Three words are a bench. */
export function sealLane(raw: SealValue): SealLane {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  if (!name) return "";
  const words = name.split(/\s+/).filter(Boolean);
  const letters = name.replace(/[^A-Za-z]/g, "");
  if (name === name.toUpperCase() && letters.length >= 3 && !/\d/.test(name) && !/[-/]/.test(name)) return "house";
  if (/\d/.test(name)) return "mark";
  if (words.length >= 3) return "bench";
  if (words.length === 2) return "duo";
  if (name.includes("-") || name.includes("/")) return "split";
  if (name.length <= 4) return "brief";
  if (name.length >= 14) return "long";
  return "plain";
}

/** Hue follows the first letter. */
export function sealHue(raw: SealValue): SealHue {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  if (!name) return "";
  const first = name.toUpperCase().replace(/[^A-Z]/g, "")[0] || "";
  if (!first) return "";
  if (first <= "D") return "ivory";
  if (first <= "H") return "graphite";
  if (first <= "L") return "champagne";
  if (first <= "P") return "ink";
  if (first <= "T") return "vellum";
  return "ash";
}

export function sealBound(raw: SealValue): boolean {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  return Boolean(name && (name[0] === "A" || name[0] === "a" || name[0] === "M" || name[0] === "m"));
}

export function sealWide(raw: SealValue): boolean {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  if (!name) return false;
  return name.toUpperCase().replace(/[^A-Z]/g, "").length >= 12;
}

export function sealNotch(raw: SealValue): boolean {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  return Boolean(name && (name.includes("-") || name.includes("/")));
}

export function sealStep(raw: SealValue): number {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  if (!name) return 0;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return Math.min(8, new Set(compact.split("")).size);
}

export function sealJoin(raw: SealValue): boolean {
  const name = sealState(raw) === "set" ? sealName(raw) : "";
  if (!name) return false;
  const compact = name.toUpperCase().replace(/[^A-Z]/g, "");
  return /(.)\1/.test(compact);
}

export function sealLanes(rows: readonly SealRow[]): SealLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = sealLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSeal(rows: readonly SealRow[]): string {
  const bars = sealLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSealHue(rows: readonly SealRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = sealHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedSealCount(rows: readonly SealRow[]): number {
  const marks = rows.map((row) => sealStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneSealCount(rows: readonly SealRow[], lane: SealLane): number {
  return rows.filter((row) => sealLane(row.note) === lane).length;
}

export function hueSealCount(rows: readonly SealRow[], hue: SealHue): number {
  return rows.filter((row) => sealHue(row.note) === hue).length;
}

export function sealShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSealLanes(rows: readonly SealRow[]): string[] {
  return sealLanes(rows).map((line) => line.lane);
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSeal(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSealReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSealLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleSeals(
  rows: readonly SealRow[],
  lane: string,
  hue: string,
  query: string,
  review: SealReview,
  reviewed: readonly string[],
  shape: SealShape,
): SealRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (sealState(row.note) === "") return false;
    const found = sealLane(row.note);
    const hueName = sealHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${sealText(row.note)} ${sealStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "bench" && found !== "bench") return false;
    if (shape === "duo" && found !== "duo") return false;
    if (shape === "split" && found !== "split") return false;
    if (shape === "brief" && found !== "brief") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "wide" && !sealWide(row.note)) return false;
    if (shape === "notch" && !sealNotch(row.note)) return false;
    return true;
  });
}

export function sealCopy(raw: SealValue): string {
  return [sealStamp(raw), sealLane(raw), sealHue(raw)].filter(Boolean).join(" ");
}

export function sealLanesCsv(rows: readonly SealRow[]): string {
  const lines = ["lane,count"];
  for (const line of sealLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const lines = ["name,stamp,lane,hue,step,join,wide,notch,bound,house,bench,duo,split,brief,long,mark,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (sealState(row.note) !== "set") continue;
    const lane = sealLane(row.note);
    lines.push([
      csvCell(sealName(row.note)),
      sealStamp(row.note),
      lane,
      sealHue(row.note),
      String(sealStep(row.note)),
      sealJoin(row.note) ? "1" : "0",
      sealWide(row.note) ? "1" : "0",
      sealNotch(row.note) ? "1" : "0",
      sealBound(row.note) ? "1" : "0",
      lane === "house" ? "1" : "0",
      lane === "bench" ? "1" : "0",
      lane === "duo" ? "1" : "0",
      lane === "split" ? "1" : "0",
      lane === "brief" ? "1" : "0",
      lane === "long" ? "1" : "0",
      lane === "mark" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
