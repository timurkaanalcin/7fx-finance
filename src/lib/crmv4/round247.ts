/**
 * Niche cards for a quiet reading aisle, and email crests already stored on a trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_niche_card (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   aisle text not null default '',
 *   wax text not null default '',
 *   pace text not null default '',
 *   wait_min integer,
 *   leaf integer not null default 3,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   cord boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_crest_review (
 *   trader_id text primary key
 * );
 */

export const NCH_KEY = "crmv4-niche-card";
export const NCH_VIEW_KEY = "crmv4-niche-views";
export const NCH_DENSITY_KEY = "crmv4-niche-density";
export const EMC_KEY = "crmv4-crest-hide";
export const EMC_REVIEW_KEY = "crmv4-crest-review";

export const NICHE_AISLES = ["porch", "nave", "aisle", "apse", "crypt", "loft"] as const;

export type NicheAisle = (typeof NICHE_AISLES)[number];

export type WaxName = "blank" | "bees" | "resin" | "ash";

export type PaceName = "blank" | "slow" | "even" | "brisk";

export type CardTray = "open" | "held" | "archived";

export type CardDensity = "airy" | "tight";

export type CardSort = "aisle" | "keeper";

export type NicheCard = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  aisle: string;
  wait: number | null;
  wax: string;
  pace: string;
  leaf: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  cord: boolean;
  audit: string;
};

export type NicheView = {
  id: string;
  name: string;
  tray: CardTray;
  query: string;
  keeper: string;
  wax: string;
  pace: string;
  aisle: string;
  wait: string;
  leaf: string;
};

export type CardCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  leaf: number;
  house: number;
  wait: number;
  matched: number;
  cord: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type CrestLane = "" | "plus" | "digit" | "dash" | "dot" | "short" | "firm" | "long" | "plain";

export type CrestHue = "" | "gilt" | "slate" | "sand" | "clay" | "soot" | "pearl" | "mist";

export type CrestState = "" | "clear" | "set";

export type CrestShape = "all" | "plus" | "wide" | "bound" | "notch" | "digit";

export type CrestReview = "all" | "reviewed" | "fresh";

export type CrestValue = string | { email?: unknown; address?: unknown; [key: string]: unknown } | null | undefined;

export type CrestRow = { id: string; label: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "wax", "tag", "leaf", "wait", "short", "cord"] as const;

const WAXES = ["bees", "resin", "ash"] as const;

const PACES = ["slow", "even", "brisk"] as const;

const PACE_CYCLE = ["slow", "even", "brisk"] as const;

const LEAF_CYCLE = [3, 5, 7, 9] as const;

const WAITS = [20, 40, 60] as const;

const PEAK = new Set(["porch", "loft"]);

const QUIET = new Set(["crypt"]);

const HOUSE = new Set(["BEES", "ASH"]);

const EARLY = new Set(["porch", "nave"]);

const MID = new Set(["aisle", "apse"]);

const LATE = new Set(["crypt", "loft"]);

const LANE_ORDER = ["plus", "digit", "dash", "dot", "short", "firm", "long", "plain"] as const;

const HUE_ORDER = ["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CardTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function waxName(raw: unknown): Exclude<WaxName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WAXES as readonly string[]).includes(text) ? (text as Exclude<WaxName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: NicheCard, tray: CardTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function aisleIndex(aisle: string): number {
  return NICHE_AISLES.indexOf(aisle as NicheAisle);
}

function leafIndex(leaf: number): number {
  return LEAF_CYCLE.indexOf(leaf as (typeof LEAF_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function cardLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function cardNote(raw: unknown): string {
  return clip(raw, 56);
}

/** An aisle outside the six niches is left blank. */
export function aisleOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (NICHE_AISLES as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 20, 40, or 60 minutes. Anything else stays blank. */
export function waitOf(raw: unknown): 20 | 40 | 60 | null {
  const text = clip(raw, 2);
  const value = Number(text);
  return (WAITS as readonly number[]).includes(value) ? (value as 20 | 40 | 60) : null;
}

/** Leaf is 3, 5, 7, or 9. Anything else stays blank. */
export function leafOf(raw: unknown): 3 | 5 | 7 | 9 | null {
  const value = Number(clip(raw, 1));
  return (LEAF_CYCLE as readonly number[]).includes(value) ? (value as 3 | 5 | 7 | 9) : null;
}

/** Wax is bees, resin, or ash. The saved wax is BEES, RESIN, or ASH. */
export function waxOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "bees") return "BEES";
  if (text === "resin") return "RESIN";
  if (text === "ash") return "ASH";
  return "";
}

/** Pace is slow, even, or brisk. A blank pace stays blank. */
export function paceOf(raw: unknown): string {
  return paceName(raw);
}

export function peakAisle(aisle: unknown): boolean {
  return PEAK.has(aisleOf(aisle));
}

export function quietAisle(aisle: unknown): boolean {
  return QUIET.has(aisleOf(aisle));
}

/** Early is porch and nave. Mid is aisle and apse. Late is crypt and loft. */
export function aisleBand(aisle: unknown): "early" | "mid" | "late" | "" {
  const name = aisleOf(aisle);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the card aisle to the desk aisle. A blank aisle has no gap. */
export function aisleGap(cardAisle: unknown, deskAisle: unknown): number | null {
  const from = aisleIndex(aisleOf(cardAisle));
  const to = aisleIndex(aisleOf(deskAisle));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseWax(wax: unknown): boolean {
  return HOUSE.has(waxOf(wax));
}

export function activeAisle(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return aisleOf(text) || "all";
}

export function activeWait(raw: unknown): string {
  const value = waitOf(raw);
  return value === null ? "all" : String(value);
}

export function activePace(raw: unknown, paces: readonly string[]): string {
  const pace = paceOf(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeLeaf(raw: unknown): string {
  const value = leafOf(raw);
  return value === null ? "all" : String(value);
}

export function activeWax(raw: unknown): string {
  const name = waxName(raw);
  return name || "all";
}

export function moveNicheFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestWax(cards: readonly NicheCard[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!card.wax) continue;
    counts.set(card.wax, (counts.get(card.wax) || 0) + 1);
  }
  let best = "BEES";
  let score = 0;
  for (const wax of ["BEES", "RESIN", "ASH"]) {
    const count = counts.get(wax) || 0;
    if (count > score) {
      best = wax;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short SLA. An evening desk asks for a long one. A tie among saved cards keeps 40. */
export function suggestWait(cards: readonly NicheCard[], hour: number): 20 | 40 | 60 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 20 | 40 | 60 | null = null;
  let score = 0;
  for (const wait of WAITS) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 20;
  if (hour >= 18) return 60;
  return 40;
}

/** The keeper with the fewest open cards. A tie keeps the roster order. */
export function fairKeeper(cards: readonly NicheCard[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open"));
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

export function readNicheCards(raw: unknown): NicheCard[] {
  if (!Array.isArray(raw)) return [];
  const out: NicheCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NicheCard>;
    const id = clip(row.id, 40);
    const title = cardLine(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: cardNote(row.note),
      keeper: clip(row.keeper, 24),
      aisle: aisleOf(row.aisle),
      wait: waitOf(row.wait),
      wax: waxOf(row.wax),
      pace: paceOf(row.pace),
      leaf: leafOf(row.leaf) ?? 3,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      cord: row.cord === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addNicheCard(
  cards: readonly NicheCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    aisle?: unknown;
    wax?: string;
    pace?: string;
    wait?: unknown;
    leaf?: unknown;
    tags?: unknown;
  },
): NicheCard[] {
  const current = readNicheCards(cards);
  const id = clip(card.id, 40);
  const title = cardLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: NicheCard = {
    id,
    title,
    note: cardNote(card.note),
    keeper: clip(card.keeper, 24),
    aisle: aisleOf(card.aisle),
    wait: waitOf(card.wait),
    wax: waxOf(card.wax),
    pace: paceOf(card.pace),
    leaf: leafOf(card.leaf) ?? 3,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    cord: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly NicheCard[], id: string, change: (card: NicheCard) => NicheCard): NicheCard[] {
  return readNicheCards(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly NicheCard[], ids: readonly string[], change: (card: NicheCard) => NicheCard): NicheCard[] {
  const picked = new Set(ids);
  return readNicheCards(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editNiche(cards: readonly NicheCard[], id: string, title: string): NicheCard[] {
  const next = cardLine(title);
  if (!next) return readNicheCards(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editNicheNote(cards: readonly NicheCard[], id: string, note: string): NicheCard[] {
  const next = cardNote(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setCardPin(cards: readonly NicheCard[], id: string, pinned: boolean): NicheCard[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setCardHold(cards: readonly NicheCard[], id: string, held: boolean): NicheCard[] {
  return mapCard(cards, id, (card) => (card.held === held || card.archived ? card : { ...card, held, audit: held ? "hold" : "resume" }));
}

export function setCardArchive(cards: readonly NicheCard[], id: string, archived: boolean): NicheCard[] {
  return mapCard(cards, id, (card) => (card.archived === archived ? card : { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" }));
}

export function setCardCord(cards: readonly NicheCard[], id: string, cord: boolean): NicheCard[] {
  return mapCard(cards, id, (card) => (card.cord === cord ? card : { ...card, cord, audit: "cord" }));
}

export function setCardLeaf(cards: readonly NicheCard[], id: string, leaf: unknown): NicheCard[] {
  const next = leafOf(leaf);
  if (next === null) return readNicheCards(cards);
  return mapCard(cards, id, (card) => (card.leaf === next ? card : { ...card, leaf: next, audit: "leaf" }));
}

export function setCardWax(cards: readonly NicheCard[], id: string, wax: unknown): NicheCard[] {
  const next = waxOf(wax);
  if (!next) return readNicheCards(cards);
  return mapCard(cards, id, (card) => (card.wax === next ? card : { ...card, wax: next, audit: "wax" }));
}

/** Pace steps slow, even, brisk, then slow again. A blank pace starts at slow. */
export function cyclePace(cards: readonly NicheCard[], id: string): NicheCard[] {
  return mapCard(cards, id, (card) => {
    const at = PACE_CYCLE.indexOf(card.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    return next === card.pace ? card : { ...card, pace: next, audit: "pace" };
  });
}

export function addNicheTag(cards: readonly NicheCard[], id: string, tag: string): NicheCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readNicheCards(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 20, 20 becomes 40, and 40 becomes 60. A wait of 60 stays. */
export function lengthenNicheWait(cards: readonly NicheCard[], id: string): NicheCard[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 60) return card;
    const next = card.wait === 40 ? 60 : card.wait === 20 ? 40 : 20;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 60, 60 becomes 40, and 40 becomes 20. A wait of 20 stays. */
export function shortenNicheWait(cards: readonly NicheCard[], id: string): NicheCard[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 20) return card;
    const next = card.wait === 40 ? 20 : card.wait === 60 ? 40 : 60;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseLeaf(cards: readonly NicheCard[], id: string): NicheCard[] {
  return mapCard(cards, id, (card) => {
    const at = leafIndex(card.leaf);
    const next = at < 0 ? LEAF_CYCLE[0] : LEAF_CYCLE[(at + 1) % LEAF_CYCLE.length];
    return next === card.leaf ? card : { ...card, leaf: next, audit: "leaf" };
  });
}

export function lowerLeaf(cards: readonly NicheCard[], id: string): NicheCard[] {
  return mapCard(cards, id, (card) => {
    const at = leafIndex(card.leaf);
    const next = at < 0 ? LEAF_CYCLE[0] : LEAF_CYCLE[(at + LEAF_CYCLE.length - 1) % LEAF_CYCLE.length];
    return next === card.leaf ? card : { ...card, leaf: next, audit: "leaf" };
  });
}

function focusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard | undefined {
  const id = shownIds[index];
  return id ? readNicheCards(cards).find((item) => item.id === id) : undefined;
}

export function pinFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readNicheCards(cards);
  return setCardPin(cards, card.id, !card.pinned);
}

export function holdFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readNicheCards(cards);
  return setCardHold(cards, card.id, !card.held);
}

export function paceFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const id = shownIds[index];
  return id ? cyclePace(cards, id) : readNicheCards(cards);
}

export function cordFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const card = focusedCard(cards, shownIds, index);
  if (!card) return readNicheCards(cards);
  return setCardCord(cards, card.id, !card.cord);
}

export function tagFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number, tag: string): NicheCard[] {
  const id = shownIds[index];
  return id ? addNicheTag(cards, id, tag) : readNicheCards(cards);
}

export function raiseFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const id = shownIds[index];
  return id ? raiseLeaf(cards, id) : readNicheCards(cards);
}

export function lowerFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const id = shownIds[index];
  return id ? lowerLeaf(cards, id) : readNicheCards(cards);
}

export function lengthenFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const id = shownIds[index];
  return id ? lengthenNicheWait(cards, id) : readNicheCards(cards);
}

export function shortenFocusedCard(cards: readonly NicheCard[], shownIds: readonly string[], index: number): NicheCard[] {
  const id = shownIds[index];
  return id ? shortenNicheWait(cards, id) : readNicheCards(cards);
}

export function bulkNichePin(cards: readonly NicheCard[], ids: readonly string[]): NicheCard[] {
  return touchIds(cards, ids, (card) => (card.pinned ? card : { ...card, pinned: true, audit: "pin" }));
}

export function bulkNicheArchive(cards: readonly NicheCard[], ids: readonly string[]): NicheCard[] {
  return touchIds(cards, ids, (card) => (card.archived ? card : { ...card, archived: true, held: false, audit: "archive" }));
}

export function bulkNicheBrisk(cards: readonly NicheCard[], ids: readonly string[]): NicheCard[] {
  return touchIds(cards, ids, (card) => (card.pace === "brisk" ? card : { ...card, pace: "brisk", audit: "pace" }));
}

export function bulkNicheTag(cards: readonly NicheCard[], ids: readonly string[], tag: string): NicheCard[] {
  const next = tagsOf(tag)[0];
  if (!next) return readNicheCards(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

export function bulkNicheWax(cards: readonly NicheCard[], ids: readonly string[], wax: unknown): NicheCard[] {
  const next = waxOf(wax);
  if (!next) return readNicheCards(cards);
  return touchIds(cards, ids, (card) => (card.wax === next ? card : { ...card, wax: next, audit: "wax" }));
}

export function readNicheViews(raw: unknown): NicheView[] {
  if (!Array.isArray(raw)) return [];
  const out: NicheView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NicheView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      wax: activeWax(row.wax),
      pace: activePace(row.pace, PACES),
      aisle: activeAisle(row.aisle),
      wait: activeWait(row.wait),
      leaf: activeLeaf(row.leaf),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addNicheView(
  views: readonly NicheView[],
  view: {
    id: string;
    name: string;
    tray?: unknown;
    query?: string;
    keeper?: string;
    wax?: string;
    pace?: string;
    aisle?: string;
    wait?: string;
    leaf?: string;
  },
): NicheView[] {
  const current = readNicheViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    wax: activeWax(view.wax),
    pace: activePace(view.pace, PACES),
    aisle: activeAisle(view.aisle),
    wait: activeWait(view.wait),
    leaf: activeLeaf(view.leaf),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropNicheView(views: readonly NicheView[], id: string): NicheView[] {
  return readNicheViews(views).filter((view) => view.id !== id);
}

export function nicheDensity(raw: unknown): CardDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function nicheSort(raw: unknown): CardSort {
  return raw === "keeper" ? "keeper" : "aisle";
}

export function lateCard(card: NicheCard, deskAisle: unknown): boolean {
  const gap = aisleGap(card.aisle, deskAisle);
  return gap !== null && gap > 0;
}

export function idleCard(card: NicheCard): boolean {
  return card.pace === "slow" && quietAisle(card.aisle) && card.leaf === 3;
}

export function rushCard(card: NicheCard): boolean {
  return card.leaf === 7 && card.pace === "brisk" && peakAisle(card.aisle);
}

export function restingCard(card: NicheCard): boolean {
  return card.wait === 60 && card.pace === "even" && !card.cord;
}

/** A twenty-minute wait on a peak aisle is overdue unless the card is pinned. */
export function overdueCard(card: NicheCard): boolean {
  return card.wait === 20 && peakAisle(card.aisle) && !card.pinned;
}

export function visibleNiche(
  cards: readonly NicheCard[],
  tray: CardTray,
  query: string,
  keeper: string,
  wax: string,
  pace: string,
  aisle: string,
  wait: string,
  leaf: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): NicheCard[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const waxOn = wax === "all" ? "" : waxOf(wax);
  const paceOn = pace === "all" ? "" : paceOf(pace);
  const aisleOn = aisle === "all" ? "" : activeAisle(aisle);
  const waitOn = wait === "all" ? "" : activeWait(wait);
  const leafOn = leaf === "all" ? "" : activeLeaf(leaf);
  return readNicheCards(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (waxOn && card.wax !== waxOn) return false;
    if (paceOn && card.pace !== paceOn) return false;
    if (aisleOn === "peak" && !peakAisle(card.aisle)) return false;
    if (aisleOn === "quiet" && !quietAisle(card.aisle)) return false;
    if (aisleOn && aisleOn !== "peak" && aisleOn !== "quiet" && card.aisle !== aisleOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (leafOn && String(card.leaf) !== leafOn) return false;
    if (houseOnly && !houseWax(card.wax)) return false;
    if (peakOnly && !peakAisle(card.aisle)) return false;
    if (quietOnly && !quietAisle(card.aisle)) return false;
    return true;
  });
}

export function sortNiche(cards: readonly NicheCard[], sort: CardSort): NicheCard[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const aisle = (aisleIndex(a.aisle) < 0 ? 99 : aisleIndex(a.aisle)) - (aisleIndex(b.aisle) < 0 ? 99 : aisleIndex(b.aisle));
    if (aisle) return aisle;
    return a.title.localeCompare(b.title);
  });
}

export function nicheCounts(cards: readonly NicheCard[], shown: readonly NicheCard[], deskAisle: unknown): CardCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  void shown;
  return {
    open: open.length,
    held: cards.filter((card) => inTray(card, "held")).length,
    archived: cards.filter((card) => inTray(card, "archived")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakAisle(card.aisle)).length,
    quiet: open.filter((card) => quietAisle(card.aisle)).length,
    soon: open.filter((card) => card.wait === 20).length,
    leaf: open.reduce((sum, card) => sum + card.leaf, 0),
    house: open.filter((card) => houseWax(card.wax)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: open.filter((card) => card.aisle && card.aisle === aisleOf(deskAisle)).length,
    cord: open.filter((card) => card.cord).length,
    idle: open.filter((card) => idleCard(card)).length,
    rush: open.filter((card) => rushCard(card)).length,
    resting: open.filter((card) => restingCard(card)).length,
    overdue: open.filter((card) => overdueCard(card)).length,
  };
}

export function nicheShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashAisleCount(cards: readonly NicheCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.aisle);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.aisle === card.aisle && other.leaf === card.leaf)).length;
}

export function waitClashCount(cards: readonly NicheCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.aisle && card.wait !== null);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.aisle === card.aisle && other.wait === card.wait)).length;
}

export function neighborCardCount(cards: readonly NicheCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && leafIndex(card.leaf) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(leafIndex(other.leaf) - leafIndex(card.leaf));
    const ring = Math.min(gap, LEAF_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly NicheCard[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.keeper);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.keeper.toLowerCase() === card.keeper.toLowerCase()).length;
    if (count > score) {
      best = card.keeper;
      score = count;
    }
  }
  return best;
}

export function pairKeeperCount(cards: readonly NicheCard[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.keeper);
  return open.filter((card) => open.filter((item) => item.keeper.toLowerCase() === card.keeper.toLowerCase()).length >= 2).length;
}

export function leafLoad(cards: readonly NicheCard[]): number {
  return cards.filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.leaf, 0);
}

export function reminderCards(cards: readonly NicheCard[]): NicheCard[] {
  return cards.filter((card) => inTray(card, "open") && overdueCard(card));
}

export function idleCards(cards: readonly NicheCard[]): NicheCard[] {
  return cards.filter((card) => inTray(card, "open") && idleCard(card));
}

export function matchedCards(cards: readonly NicheCard[], deskAisle: unknown): NicheCard[] {
  const aisle = aisleOf(deskAisle);
  if (!aisle) return [];
  return cards.filter((card) => inTray(card, "open") && card.aisle === aisle);
}

export function nextCard(cards: readonly NicheCard[], id: string): NicheCard | null {
  const open = sortNiche(cards.filter((card) => inTray(card, "open")), "aisle");
  const at = open.findIndex((card) => card.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function nicheTimeline(cards: readonly NicheCard[]): { leaf: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return LEAF_CYCLE.map((leaf) => ({ leaf, titles: open.filter((card) => card.leaf === leaf).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function nicheKeepers(cards: readonly NicheCard[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function nicheCopy(card: NicheCard): string {
  return [card.title, card.keeper, card.aisle, card.wax, card.pace, card.wait ?? "", card.leaf, card.note].filter((item) => item !== "").join(" · ");
}

export function nicheCsv(cards: readonly NicheCard[], deskAisle: unknown): string {
  const lines = ["title,keeper,aisle,wax,pace,wait,leaf,tags,pinned,held,archived,cord,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readNicheCards(cards)) {
    const gap = aisleGap(card.aisle, deskAisle);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.aisle,
      card.wax,
      card.pace,
      card.wait === null ? "" : String(card.wait),
      String(card.leaf),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.cord ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCard(card, deskAisle) ? "1" : "0",
      idleCard(card) ? "1" : "0",
      peakAisle(card.aisle) ? "1" : "0",
      quietAisle(card.aisle) ? "1" : "0",
      houseWax(card.wax) ? "1" : "0",
      aisleBand(card.aisle),
      rushCard(card) ? "1" : "0",
      restingCard(card) ? "1" : "0",
      overdueCard(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function crestRecord(raw: CrestValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function crestText(raw: CrestValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = crestRecord(raw);
  if (!row) return "";
  return clip(row.email ?? row.address, 64);
}

function hasMoney(raw: CrestValue): boolean {
  const row = crestRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

function splitMail(raw: CrestValue): { local: string; domain: string } | null {
  const text = crestText(raw).toLowerCase();
  const at = text.indexOf("@");
  if (at <= 0 || at !== text.lastIndexOf("@")) return null;
  const local = text.slice(0, at);
  const domain = text.slice(at + 1);
  if (!local || !domain.includes(".") || !/[a-z]/.test(domain)) return null;
  if (/\s/.test(local) || /\s/.test(domain)) return null;
  return { local, domain };
}

/** A money field clears the crest. A real address is set. A blank or broken address is clear. */
export function crestState(raw: CrestValue): CrestState {
  if (hasMoney(raw)) return "";
  return splitMail(raw) ? "set" : "clear";
}

/** The first two letters of the local part plus its length. ada.north is AD9. */
export function crestStamp(raw: CrestValue): string {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  if (!mail) return "";
  const letters = mail.local.replace(/[^a-z]/g, "").slice(0, 2).toUpperCase();
  return `${letters}${mail.local.length}`;
}

/** A plus is an alias. A digit, dash, or dot in the local part wins before length. */
export function crestLane(raw: CrestValue): CrestLane {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  if (!mail) return "";
  if (mail.local.includes("+")) return "plus";
  if (/\d/.test(mail.local)) return "digit";
  if (mail.local.includes("-") || mail.domain.includes("-")) return "dash";
  if (mail.local.includes(".")) return "dot";
  if (mail.local.length <= 4) return "short";
  const labels = mail.domain.split(".");
  const tld = labels[labels.length - 1] || "";
  if (labels.length === 2 && (tld.length === 2 || tld.length === 3) && mail.local.length >= 6) return "firm";
  if (mail.local.length >= 12) return "long";
  return "plain";
}

/** Hue follows the first letter of the domain. A digit or a late letter is mist. */
export function crestHue(raw: CrestValue): CrestHue {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  if (!mail) return "";
  const letter = mail.domain[0] || "";
  if (letter >= "a" && letter <= "d") return "gilt";
  if (letter >= "e" && letter <= "h") return "slate";
  if (letter >= "i" && letter <= "l") return "sand";
  if (letter >= "m" && letter <= "p") return "clay";
  if (letter >= "q" && letter <= "t") return "soot";
  if (letter >= "u" && letter <= "x") return "pearl";
  return "mist";
}

export function crestBound(raw: CrestValue): boolean {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  if (!mail) return false;
  const tld = mail.domain.split(".").pop() || "";
  return tld === "com" || tld === "io" || tld === "de";
}

export function crestWide(raw: CrestValue): boolean {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  return Boolean(mail && mail.local.length >= 10);
}

export function crestNotch(raw: CrestValue): boolean {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  return Boolean(mail && (mail.local.includes("-") || mail.domain.includes("-")));
}

export function crestStep(raw: CrestValue): number {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  if (!mail) return 0;
  return Math.min(6, new Set(mail.local.replace(/[^a-z]/g, "").split("")).size);
}

export function crestJoin(raw: CrestValue): boolean {
  const mail = crestState(raw) === "set" ? splitMail(raw) : null;
  return Boolean(mail && mail.local.includes("+"));
}

export function crestLanes(rows: readonly CrestRow[]): CrestLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = crestLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCrest(rows: readonly CrestRow[]): string {
  const bars = crestLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCrestHue(rows: readonly CrestRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = crestHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const marks = rows.map((row) => crestStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCrestCount(rows: readonly CrestRow[], lane: CrestLane): number {
  return rows.filter((row) => crestLane(row.note) === lane).length;
}

export function hueCrestCount(rows: readonly CrestRow[], hue: CrestHue): number {
  return rows.filter((row) => crestHue(row.note) === hue).length;
}

export function crestShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCrestLanes(rows: readonly CrestRow[]): string[] {
  return crestLanes(rows).map((line) => line.lane);
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCrest(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCrestReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrestLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCrests(
  rows: readonly CrestRow[],
  lane: string,
  hue: string,
  query: string,
  review: CrestReview,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (crestState(row.note) === "") return false;
    const found = crestLane(row.note);
    const hueName = crestHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${crestText(row.note)} ${crestStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "plus" && found !== "plus") return false;
    if (shape === "wide" && !crestWide(row.note)) return false;
    if (shape === "bound" && !crestBound(row.note)) return false;
    if (shape === "notch" && !crestNotch(row.note)) return false;
    if (shape === "digit" && found !== "digit") return false;
    return true;
  });
}

export function crestCopy(raw: CrestValue): string {
  return [crestStamp(raw), crestLane(raw), crestHue(raw)].filter(Boolean).join(" ");
}

export function crestLanesCsv(rows: readonly CrestRow[]): string {
  const lines = ["lane,count"];
  for (const line of crestLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["email,crest,lane,hue,step,join,wide,notch,bound,plus,digit,dash,dot,short,firm,long,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (crestState(row.note) !== "set") continue;
    const lane = crestLane(row.note);
    lines.push([
      csvCell(crestText(row.note)),
      crestStamp(row.note),
      lane,
      crestHue(row.note),
      String(crestStep(row.note)),
      crestJoin(row.note) ? "1" : "0",
      crestWide(row.note) ? "1" : "0",
      crestNotch(row.note) ? "1" : "0",
      crestBound(row.note) ? "1" : "0",
      lane === "plus" ? "1" : "0",
      lane === "digit" ? "1" : "0",
      lane === "dash" ? "1" : "0",
      lane === "dot" ? "1" : "0",
      lane === "short" ? "1" : "0",
      lane === "firm" ? "1" : "0",
      lane === "long" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
