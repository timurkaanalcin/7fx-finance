/**
 * Vestibule slips for a visitor book, and mailbox plates already stored as a trader email.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_vestibule_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   porter text not null default '',
 *   place text not null default '',
 *   cloth text not null default '',
 *   gait text not null default '',
 *   wait_min integer,
 *   rank_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   seated boolean not null default false,
 *   closed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_mailbox_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_mailbox_review (
 *   trader_id text primary key
 * );
 */

export const VSL_KEY = "crmv4-vestibule-slip";
export const VSL_VIEW_KEY = "crmv4-vestibule-views";
export const VSL_DENSITY_KEY = "crmv4-vestibule-density";
export const MBP_KEY = "crmv4-mailbox-hide";
export const MBP_REVIEW_KEY = "crmv4-mailbox-review";

export const DOOR_PLACES = ["porch", "court", "stair", "loft"] as const;

export type DoorPlace = (typeof DOOR_PLACES)[number];

export type ClothName = "blank" | "wool" | "silk" | "linen";

export type GaitName = "blank" | "still" | "walk" | "rush";

export type VestibuleTray = "door" | "seat" | "closet";

export type VestibuleDensity = "airy" | "tight";

export type VestibuleSort = "place" | "porter";

export type VestibuleSlip = {
  id: string;
  title: string;
  note: string;
  porter: string;
  place: string;
  wait: number | null;
  cloth: string;
  gait: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  seated: boolean;
  closed: boolean;
  flagged: boolean;
  audit: string;
};

export type VestibuleView = {
  id: string;
  name: string;
  tray: VestibuleTray;
  query: string;
  porter: string;
  cloth: string;
  gait: string;
  place: string;
  wait: string;
  rank: string;
};

export type VestibuleCounts = {
  door: number;
  seat: number;
  closet: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  rank: number;
  house: number;
  wait: number;
  matched: number;
  flagged: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type MailLane = "" | "brief" | "desk" | "hall" | "long";

export type MailHue = "" | "ivory" | "graphite" | "champagne";

export type MailState = "" | "clear" | "set";

export type MailShape = "all" | "brief" | "desk" | "hall" | "long" | "wide" | "notch" | "leap" | "plus" | "vowels";

export type MailReview = "all" | "reviewed" | "fresh";

export type MailValue = string | { email?: unknown; [key: string]: unknown } | null | undefined;

export type MailRow = { id: string; label: string; note: MailValue };

export type MailLaneLine = { lane: string; count: number };

export const ROUND259_FEATURES = [
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
  "fair-porter",
  "viewer",
  "suggest",
  "sla",
  "mailbox",
  "mailbox-csv",
] as const;

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "seat", "resume", "closet", "open", "cloth", "tag", "rank", "wait", "short", "flag"] as const;

const CLOTHS = ["wool", "silk", "linen"] as const;

const GAITS = ["still", "walk", "rush"] as const;

const WAIT_CYCLE = [3, 9, 21] as const;

const RANK_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["court", "stair"]);

const QUIET = new Set(["porch", "loft"]);

const HOUSE = new Set(["WOOL", "SILK"]);

const EARLY = new Set(["porch", "court"]);

const LANE_ORDER = ["brief", "desk", "hall", "long"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VestibuleTray {
  return raw === "seat" || raw === "closet" ? raw : "door";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
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
    if (!/^[xyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: VestibuleSlip, tray: VestibuleTray): boolean {
  if (tray === "seat") return card.seated && !card.closed;
  if (tray === "closet") return card.closed;
  return !card.seated && !card.closed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function placeIndex(place: string): number {
  return DOOR_PLACES.indexOf(place as DoorPlace);
}

function rankIndex(rank: number): number {
  return RANK_CYCLE.indexOf(rank as (typeof RANK_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function placeOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DOOR_PLACES as readonly string[]).includes(text) ? text : "";
}

/** The courtesy wait is 3, 9, or 21 minutes. Anything else stays blank. */
export function waitOf(raw: unknown): 3 | 9 | 21 | null {
  const value = Number(clip(raw, 2));
  return (WAIT_CYCLE as readonly number[]).includes(value) ? (value as 3 | 9 | 21) : null;
}

/** Rank is 1, 3, 5, or 7. Anything else stays blank. */
export function rankOf(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (RANK_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Cloth is wool, silk, or linen. The saved cloth is WOOL, SILK, or LINEN. */
export function clothOf(raw: unknown): string {
  const text = clothName(raw);
  return text ? text.toUpperCase() : "";
}

/** Gait is still, walk, or rush. A blank gait stays blank. */
export function gaitOf(raw: unknown): string {
  return gaitName(raw);
}

export function peakPlace(place: unknown): boolean {
  return PEAK.has(clip(place, 12).toLowerCase());
}

export function quietPlace(place: unknown): boolean {
  return QUIET.has(clip(place, 12).toLowerCase());
}

/** Early is porch and court. Mid is stair. Late is loft. */
export function placeBand(place: unknown): string {
  const text = placeOf(place);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "stair") return "mid";
  return "late";
}

/** Signed distance from the slip place to the desk place. */
export function placeGap(from: unknown, to: unknown): number | null {
  const left = placeIndex(placeOf(from));
  const right = placeIndex(placeOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

export function activePlace(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return placeOf(text) || "all";
}

export function activeWait(raw: unknown): string {
  const wait = waitOf(raw);
  return wait === null ? "all" : String(wait);
}

export function activeGait(raw: unknown, allow: readonly string[]): string {
  const text = gaitOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRank(raw: unknown): string {
  const rank = rankOf(raw);
  return rank === null ? "all" : String(rank);
}

export function activeCloth(raw: unknown): string {
  const text = clothName(raw);
  return text || "all";
}

export function moveVestFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestCloth(cards: readonly VestibuleSlip[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "door") || !card.cloth) continue;
    counts.set(card.cloth, (counts.get(card.cloth) || 0) + 1);
  }
  let best = "WOOL";
  let score = 0;
  for (const cloth of ["WOOL", "SILK", "LINEN"]) {
    const count = counts.get(cloth) || 0;
    if (count > score) {
      best = cloth;
      score = count;
    }
  }
  return best;
}

/** A morning desk asks for a short wait. An evening desk asks for a long one. Saved waits win when any exist. */
export function suggestWait(cards: readonly VestibuleSlip[], hour: number): 3 | 9 | 21 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "door") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 3 | 9 | 21 | null = null;
  let score = 0;
  for (const wait of WAIT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 9) return 3;
  if (hour < 15) return 9;
  return 21;
}

/** The porter with the fewest open unpinned slips. A tie keeps the roster order. */
export function fairPorter(cards: readonly VestibuleSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "door") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.porter.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readVests(raw: unknown): VestibuleSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: VestibuleSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VestibuleSlip>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      porter: clip(row.porter, 24),
      place: placeOf(row.place),
      wait: waitOf(row.wait),
      cloth: clothOf(row.cloth),
      gait: gaitOf(row.gait),
      rank: rankOf(row.rank) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      seated: row.seated === true,
      closed: row.closed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addVest(
  cards: readonly VestibuleSlip[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    porter?: string;
    place?: string;
    wait?: unknown;
    cloth?: string;
    gait?: string;
    rank?: unknown;
    tags?: string;
  },
): VestibuleSlip[] {
  const current = readVests(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: VestibuleSlip = {
    id,
    title,
    note: noteOf(card.note),
    porter: clip(card.porter, 24),
    place: placeOf(card.place),
    wait: waitOf(card.wait),
    cloth: clothOf(card.cloth),
    gait: gaitOf(card.gait),
    rank: rankOf(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    seated: false,
    closed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly VestibuleSlip[], id: string, change: (card: VestibuleSlip) => VestibuleSlip): VestibuleSlip[] {
  return readVests(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly VestibuleSlip[], ids: readonly string[], change: (card: VestibuleSlip) => VestibuleSlip): VestibuleSlip[] {
  const picked = new Set(ids);
  return readVests(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editVest(cards: readonly VestibuleSlip[], id: string, title: string): VestibuleSlip[] {
  const next = lineOf(title);
  if (!next) return readVests(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editVestNote(cards: readonly VestibuleSlip[], id: string, note: string): VestibuleSlip[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setVestPin(cards: readonly VestibuleSlip[], id: string, pinned: boolean): VestibuleSlip[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setVestSeat(cards: readonly VestibuleSlip[], id: string, seated: boolean): VestibuleSlip[] {
  return mapCard(cards, id, (card) => (card.seated === seated ? card : { ...card, seated, closed: seated ? false : card.closed, audit: seated ? "seat" : "resume" }));
}

export function setVestCloset(cards: readonly VestibuleSlip[], id: string, closed: boolean): VestibuleSlip[] {
  return mapCard(cards, id, (card) => (card.closed === closed ? card : { ...card, closed, seated: closed ? false : card.seated, audit: closed ? "closet" : "open" }));
}

export function setVestStar(cards: readonly VestibuleSlip[], id: string, flagged: boolean): VestibuleSlip[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setVestCloth(cards: readonly VestibuleSlip[], id: string, cloth: unknown): VestibuleSlip[] {
  const next = clothOf(cloth);
  if (!next) return readVests(cards);
  return mapCard(cards, id, (card) => (card.cloth === next ? card : { ...card, cloth: next, audit: "cloth" }));
}

/** Gait steps still, walk, rush, then still again. A blank gait starts at still. */
export function cycleGait(cards: readonly VestibuleSlip[], id: string): VestibuleSlip[] {
  return mapCard(cards, id, (card) => {
    const at = GAITS.indexOf(card.gait as (typeof GAITS)[number]);
    const next = at < 0 ? GAITS[0] : GAITS[(at + 1) % GAITS.length];
    return next === card.gait ? card : { ...card, gait: next, audit: "gait" };
  });
}

export function addVestTag(cards: readonly VestibuleSlip[], id: string, tag: string): VestibuleSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readVests(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank wait becomes 3, 3 becomes 9, and 9 becomes 21. A wait of 21 stays. */
export function lengthenWait(cards: readonly VestibuleSlip[], id: string): VestibuleSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 21) return card;
    const next = card.wait === 9 ? 21 : card.wait === 3 ? 9 : 3;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank wait becomes 21, 21 becomes 9, and 9 becomes 3. A wait of 3 stays. */
export function shortenWait(cards: readonly VestibuleSlip[], id: string): VestibuleSlip[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 3) return card;
    const next = card.wait === 9 ? 3 : card.wait === 21 ? 9 : 21;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseRank(cards: readonly VestibuleSlip[], id: string): VestibuleSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 1, audit: "rank" };
    if (at === RANK_CYCLE.length - 1) return card;
    return { ...card, rank: RANK_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerRank(cards: readonly VestibuleSlip[], id: string): VestibuleSlip[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: RANK_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkVestPin(cards: readonly VestibuleSlip[], ids: readonly string[]): VestibuleSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkVestFile(cards: readonly VestibuleSlip[], ids: readonly string[]): VestibuleSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, closed: true, seated: false, audit: "closet" }));
}

export function bulkVestRush(cards: readonly VestibuleSlip[], ids: readonly string[]): VestibuleSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, gait: "rush", audit: "gait" }));
}

export function bulkVestLinen(cards: readonly VestibuleSlip[], ids: readonly string[]): VestibuleSlip[] {
  return touchIds(cards, ids, (card) => ({ ...card, cloth: "LINEN", audit: "cloth" }));
}

export function bulkVestTag(cards: readonly VestibuleSlip[], ids: readonly string[], tag: string): VestibuleSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readVests(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly VestibuleSlip[], ids: readonly string[], index: number, change: (list: readonly VestibuleSlip[], id: string) => VestibuleSlip[]): VestibuleSlip[] {
  const id = ids[index];
  return id ? change(cards, id) : readVests(cards);
}

export function lengthenFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  return focused(cards, ids, index, lengthenWait);
}

export function shortenFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  return focused(cards, ids, index, shortenWait);
}

export function gaitFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  return focused(cards, ids, index, cycleGait);
}

export function raiseFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  return focused(cards, ids, index, raiseRank);
}

export function lowerFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  return focused(cards, ids, index, lowerRank);
}

export function pinFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  const id = ids[index];
  if (!id) return readVests(cards);
  const card = readVests(cards).find((item) => item.id === id);
  return card ? setVestPin(cards, id, !card.pinned) : readVests(cards);
}

export function seatFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  const id = ids[index];
  if (!id) return readVests(cards);
  const card = readVests(cards).find((item) => item.id === id);
  return card ? setVestSeat(cards, id, !card.seated) : readVests(cards);
}

export function starFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number): VestibuleSlip[] {
  const id = ids[index];
  if (!id) return readVests(cards);
  const card = readVests(cards).find((item) => item.id === id);
  return card ? setVestStar(cards, id, !card.flagged) : readVests(cards);
}

export function tagFocusedVest(cards: readonly VestibuleSlip[], ids: readonly string[], index: number, tag: string): VestibuleSlip[] {
  const id = ids[index];
  return id ? addVestTag(cards, id, tag) : readVests(cards);
}

export function readVestViews(raw: unknown): VestibuleView[] {
  if (!Array.isArray(raw)) return [];
  const out: VestibuleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VestibuleView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      porter: clip(row.porter, 24),
      cloth: activeCloth(row.cloth),
      gait: activeGait(row.gait, GAITS),
      place: activePlace(row.place),
      wait: activeWait(row.wait),
      rank: activeRank(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addVestView(
  views: readonly VestibuleView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    porter?: string;
    cloth?: string;
    gait?: string;
    place?: string;
    wait?: string;
    rank?: string;
  },
): VestibuleView[] {
  const current = readVestViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: VestibuleView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    porter: clip(view.porter, 24),
    cloth: activeCloth(view.cloth),
    gait: activeGait(view.gait, GAITS),
    place: activePlace(view.place),
    wait: activeWait(view.wait),
    rank: activeRank(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropVestView(views: readonly VestibuleView[], id: string): VestibuleView[] {
  return readVestViews(views).filter((view) => view.id !== id);
}

export function vestibuleDensity(raw: unknown): VestibuleDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A slip more than one place behind the desk, at rank 1, is late. */
export function lateVest(card: VestibuleSlip, deskPlace: unknown): boolean {
  const gap = placeGap(card.place, deskPlace);
  return card.rank === 1 && gap !== null && gap > 1;
}

export function idleVest(card: VestibuleSlip): boolean {
  return card.gait === "still" && quietPlace(card.place) && card.rank === 1;
}

export function rushVest(card: VestibuleSlip): boolean {
  return card.rank === 7 && card.gait === "rush" && peakPlace(card.place);
}

export function restingVest(card: VestibuleSlip): boolean {
  return card.wait === 21 && card.gait === "walk" && card.place === "loft";
}

/** A three-minute wait on a peak place is overdue unless the slip is pinned. */
export function overdueVest(card: VestibuleSlip): boolean {
  return card.wait === 3 && peakPlace(card.place) && !card.pinned;
}

export function visibleVests(
  cards: readonly VestibuleSlip[],
  tray: VestibuleTray,
  query: string,
  porter: string,
  cloth: string,
  gait: string,
  place: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): VestibuleSlip[] {
  const text = query.trim().toLowerCase();
  const porterOn = porter === "all" ? "" : porter.trim().toLowerCase();
  const clothOn = cloth === "all" ? "" : clothOf(cloth);
  const gaitOn = gait === "all" ? "" : gaitOf(gait);
  const placeOn = place === "all" ? "" : activePlace(place);
  const waitOn = wait === "all" ? "" : activeWait(wait);
  const rankOn = rank === "all" ? "" : activeRank(rank);
  return readVests(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (porterOn && card.porter.toLowerCase() !== porterOn) return false;
    if (clothOn && card.cloth !== clothOn) return false;
    if (gaitOn && card.gait !== gaitOn) return false;
    if (placeOn === "peak" && !peakPlace(card.place)) return false;
    if (placeOn === "quiet" && !quietPlace(card.place)) return false;
    if (placeOn && placeOn !== "peak" && placeOn !== "quiet" && card.place !== placeOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseCloth(card.cloth)) return false;
    if (peakOnly && !peakPlace(card.place)) return false;
    if (quietOnly && !quietPlace(card.place)) return false;
    return true;
  });
}

export function sortVests(cards: readonly VestibuleSlip[], sort: VestibuleSort): VestibuleSlip[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "porter") {
      const porter = a.porter.localeCompare(b.porter);
      if (porter) return porter;
    }
    const place = (placeIndex(a.place) < 0 ? 99 : placeIndex(a.place)) - (placeIndex(b.place) < 0 ? 99 : placeIndex(b.place));
    if (place) return place;
    return a.title.localeCompare(b.title);
  });
}

export function vestCounts(cards: readonly VestibuleSlip[], shown: readonly VestibuleSlip[], deskPlace: unknown): VestibuleCounts {
  const open = cards.filter((card) => inTray(card, "door"));
  return {
    door: open.length,
    seat: cards.filter((card) => inTray(card, "seat")).length,
    closet: cards.filter((card) => inTray(card, "closet")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakPlace(card.place)).length,
    quiet: open.filter((card) => quietPlace(card.place)).length,
    soon: open.filter((card) => card.wait === 3).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseCloth(card.cloth)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.place && card.place === placeOf(deskPlace)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleVest(card)).length,
    rush: open.filter((card) => rushVest(card)).length,
    resting: open.filter((card) => restingVest(card)).length,
    overdue: open.filter((card) => overdueVest(card)).length,
  };
}

export function clashPlaceCount(cards: readonly VestibuleSlip[]): number {
  const open = cards.filter((card) => inTray(card, "door") && card.place);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.place === card.place && other.rank === card.rank)).length;
}

export function neighborVestCount(cards: readonly VestibuleSlip[]): number {
  const open = cards.filter((card) => inTray(card, "door") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, RANK_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestPorter(cards: readonly VestibuleSlip[]): string {
  const open = cards.filter((card) => inTray(card, "door") && card.porter);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.porter.toLowerCase() === card.porter.toLowerCase()).length;
    if (count > score) {
      best = card.porter;
      score = count;
    }
  }
  return best;
}

export function reminderVests(cards: readonly VestibuleSlip[]): VestibuleSlip[] {
  return cards.filter((card) => inTray(card, "door") && (card.wait === 3 || card.wait === 9));
}

export function idleVests(cards: readonly VestibuleSlip[]): VestibuleSlip[] {
  return cards.filter((card) => inTray(card, "door") && idleVest(card));
}

export function vestTimeline(cards: readonly VestibuleSlip[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "door"));
  return RANK_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function vestBars(cards: readonly VestibuleSlip[]): { place: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "door"));
  return DOOR_PLACES.map((place) => ({ place, count: open.filter((card) => card.place === place).length }));
}

export function vestPorters(cards: readonly VestibuleSlip[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.porter || out.some((item) => item.toLowerCase() === card.porter.toLowerCase())) continue;
    out.push(card.porter);
  }
  return out;
}

export function vestCopy(card: VestibuleSlip): string {
  return [card.title, card.porter, card.place, card.cloth, card.gait, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function vestShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function vestCsv(cards: readonly VestibuleSlip[], deskPlace: unknown): string {
  const lines = ["title,porter,place,cloth,gait,wait,rank,tags,pinned,seated,closed,starred,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const card of readVests(cards)) {
    const gap = placeGap(card.place, deskPlace);
    lines.push([
      csvCell(card.title),
      csvCell(card.porter),
      card.place,
      card.cloth,
      card.gait,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.seated ? "1" : "0",
      card.closed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateVest(card, deskPlace) ? "1" : "0",
      idleVest(card) ? "1" : "0",
      peakPlace(card.place) ? "1" : "0",
      quietPlace(card.place) ? "1" : "0",
      houseCloth(card.cloth) ? "1" : "0",
      placeBand(card.place),
      rushVest(card) ? "1" : "0",
      restingVest(card) ? "1" : "0",
      overdueVest(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function mailRecord(raw: MailValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: MailValue): boolean {
  const row = mailRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type MailParts = { local: string; domain: string; labels: string[] };

function mailParts(raw: MailValue): MailParts | null {
  if (hasBlocked(raw)) return null;
  const row = mailRecord(raw);
  if (row && !("email" in row)) return null;
  const text = (row ? clip(row.email, 64) : clip(raw, 64)).toLowerCase();
  const match = /^([a-z0-9](?:[a-z0-9.+_-]{0,31}))@([a-z0-9](?:[a-z0-9-]{0,22})(?:\.[a-z0-9](?:[a-z0-9-]{0,22}))+)$/.exec(text);
  if (!match) return null;
  const local = match[1];
  const domain = match[2];
  if (local.includes("..") || local.startsWith(".") || local.endsWith(".")) return null;
  const labels = domain.split(".");
  if (labels.some((label) => !label || label.length > 24)) return null;
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,12}$/.test(tld)) return null;
  return { local, domain, labels };
}

function mailText(raw: MailValue): string {
  const parts = mailParts(raw);
  return parts ? `${parts.local}@${parts.domain}` : "";
}

function vowelCount(local: string): number {
  return (local.match(/[aeiou]/g) || []).length;
}

/** A blocked field clears the plate. A real mailbox is set. A blank or broken address is clear. */
export function plateState(raw: MailValue): MailState {
  if (hasBlocked(raw)) return "";
  const row = mailRecord(raw);
  if (row && !("email" in row)) return "";
  return mailParts(raw) ? "set" : "clear";
}

/** Brief is a local of 1–4 marks, desk 5–8, hall 9–14, and long 15 or more. */
export function plateLane(raw: MailValue): MailLane {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  if (!parts) return "";
  if (parts.local.length <= 4) return "brief";
  if (parts.local.length <= 8) return "desk";
  if (parts.local.length <= 14) return "hall";
  return "long";
}

/** The first four marks of the local name. */
export function plateStamp(raw: MailValue): string {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return parts ? parts.local.slice(0, 4) : "";
}

/** A domain opening a–h is ivory, i–q graphite, and r–z champagne. */
export function plateHue(raw: MailValue): MailHue {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  if (!parts) return "";
  const letter = parts.domain.charCodeAt(0);
  if (letter >= 97 && letter <= 104) return "ivory";
  if (letter >= 105 && letter <= 113) return "graphite";
  if (letter >= 114 && letter <= 122) return "champagne";
  return "graphite";
}

/** Three or more vowels in the local name. */
export function plateSpoken(raw: MailValue): boolean {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return Boolean(parts && vowelCount(parts.local) >= 3);
}

export function plateWide(raw: MailValue): boolean {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return Boolean(parts && parts.labels.length >= 3);
}

export function plateNotch(raw: MailValue): boolean {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return Boolean(parts && /\d/.test(parts.local));
}

export function plateEcho(raw: MailValue): boolean {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  if (!parts || parts.local.length < 2) return false;
  return parts.local[0] === parts.local[parts.local.length - 1];
}

export function plateLeap(raw: MailValue): boolean {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return Boolean(parts && parts.local.length === 8);
}

export function platePlus(raw: MailValue): boolean {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return Boolean(parts && parts.local.includes("+"));
}

export function plateStep(raw: MailValue): number {
  const parts = plateState(raw) === "set" ? mailParts(raw) : null;
  return parts ? parts.local.length : 0;
}

export function plateLanes(rows: readonly MailRow[]): MailLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = plateLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPlate(rows: readonly MailRow[]): string {
  const bars = plateLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingPlateHue(rows: readonly MailRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = plateHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedPlateCount(rows: readonly MailRow[]): number {
  const marks = rows.map((row) => plateStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function lanePlateCount(rows: readonly MailRow[], lane: MailLane): number {
  return rows.filter((row) => plateLane(row.note) === lane).length;
}

export function huePlateCount(rows: readonly MailRow[], hue: MailHue): number {
  return rows.filter((row) => plateHue(row.note) === hue).length;
}

export function plateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPlateLanes(rows: readonly MailRow[]): string[] {
  return plateLanes(rows).map((line) => line.lane);
}

export function readHiddenPlates(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPlates(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePlate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visiblePlates(
  rows: readonly MailRow[],
  lane: string,
  hue: string,
  query: string,
  review: MailReview,
  reviewed: readonly string[],
  shape: MailShape,
): MailRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (plateState(row.note) === "") return false;
    const found = plateLane(row.note);
    const hueName = plateHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${mailText(row.note)} ${plateStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "brief" && found !== "brief") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "wide" && !plateWide(row.note)) return false;
    if (shape === "notch" && !plateNotch(row.note)) return false;
    if (shape === "leap" && !plateLeap(row.note)) return false;
    if (shape === "plus" && !platePlus(row.note)) return false;
    if (shape === "vowels" && !plateSpoken(row.note)) return false;
    return true;
  });
}

export function plateCopy(raw: MailValue): string {
  return [plateStamp(raw), plateLane(raw), plateHue(raw)].filter(Boolean).join(" ");
}

export function plateLanesCsv(rows: readonly MailRow[]): string {
  const lines = ["lane,count"];
  for (const line of plateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function plateRowsCsv(rows: readonly MailRow[], reviewed: readonly string[]): string {
  const lines = ["name,email,stamp,lane,hue,step,echo,wide,notch,leap,plus,vowels,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (plateState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      mailText(row.note),
      plateStamp(row.note),
      plateLane(row.note),
      plateHue(row.note),
      String(plateStep(row.note)),
      plateEcho(row.note) ? "1" : "0",
      plateWide(row.note) ? "1" : "0",
      plateNotch(row.note) ? "1" : "0",
      plateLeap(row.note) ? "1" : "0",
      platePlus(row.note) ? "1" : "0",
      plateSpoken(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
