/**
 * Sextant sights for a navigator follow-up book, and office plates already stored as a desk office.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sextant_sight (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   pilot text not null default '',
 *   limb text not null default '',
 *   metal text not null default '',
 *   sight text not null default '',
 *   alt_min integer,
 *   mag_no integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   paused boolean not null default false,
 *   sealed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_office_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_office_review (
 *   desk_id text primary key
 * );
 */

export const SXT_KEY = "crmv4-sextant-sight";
export const SXT_VIEW_KEY = "crmv4-sextant-views";
export const SXT_DENSITY_KEY = "crmv4-sextant-density";
export const OFC_KEY = "crmv4-office-hide";
export const OFC_REVIEW_KEY = "crmv4-office-review";

export const SEXTANT_LIMBS = ["arc", "limb", "index", "horizon"] as const;

export type SextantLimb = (typeof SEXTANT_LIMBS)[number];

export type MetalName = "blank" | "brass" | "steel" | "gilt";

export type SightName = "blank" | "rise" | "hold" | "set";

export type SextantTray = "open" | "pause" | "seal";

export type SextantDensity = "roomy" | "close";

export type SextantSort = "frame" | "weaver";

export type SextantSight = {
  id: string;
  title: string;
  note: string;
  weaver: string;
  frame: string;
  wait: number | null;
  dye: string;
  shuttle: string;
  rank: number;
  tags: string[];
  pinned: boolean;
  paused: boolean;
  sealed: boolean;
  flagged: boolean;
  audit: string;
};

export type SextantView = {
  id: string;
  name: string;
  tray: SextantTray;
  query: string;
  weaver: string;
  dye: string;
  shuttle: string;
  frame: string;
  wait: string;
  rank: string;
};

export type SextantCounts = {
  open: number;
  pause: number;
  seal: number;
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
  brisk: number;
  resting: number;
  overdue: number;
};

export type OfficeLane = "" | "hall" | "wing" | "bay" | "yard";

export type OfficeHue = "" | "ivory" | "graphite" | "champagne";

export type OfficeState = "" | "clear" | "set";

export type OfficeShape = "all" | "hall" | "wing" | "bay" | "yard" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type OfficeReview = "all" | "reviewed" | "fresh";

export type OfficeValue = string | { office?: unknown; name?: unknown; [key: string]: unknown } | null | undefined;

export type OfficeRow = { id: string; label: string; note: OfficeValue };

export type OfficeLaneLine = { lane: string; count: number };

export const ROUND266_FEATURES = [
  "save",
  "note",
  "trays",
  "pin",
  "altitude",
  "seal",
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
  "fair-pilot",
  "viewer",
  "suggest",
  "sla",
  "office",
  "office-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shuttle", "pin", "unpin", "pause", "resume", "seal", "open", "dye", "tag", "rank", "wait", "short", "flag"] as const;

const METALS = ["brass", "steel", "gilt"] as const;

const SIGHTS = ["rise", "hold", "set"] as const;

const ALT_CYCLE = [15, 30, 45] as const;

const MAG_CYCLE = [1, 3, 5, 7] as const;

const PEAK = new Set(["arc", "index"]);

const QUIET = new Set(["limb", "horizon"]);

const HOUSE = new Set(["BRASS", "GILT"]);

const EARLY = new Set(["arc", "limb"]);

const LANE_ORDER = ["hall", "wing", "bay", "yard"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["hq", "floor"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SextantTray {
  return raw === "pause" || raw === "seal" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function metalName(raw: unknown): Exclude<MetalName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<MetalName, "blank">) : "";
}

function sightName(raw: unknown): Exclude<SightName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SIGHTS as readonly string[]).includes(text) ? (text as Exclude<SightName, "blank">) : "";
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

function inTray(card: SextantSight, tray: SextantTray): boolean {
  if (tray === "pause") return card.paused && !card.sealed;
  if (tray === "seal") return card.sealed;
  return !card.paused && !card.sealed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(frame: string): number {
  return SEXTANT_LIMBS.indexOf(frame as SextantLimb);
}

function rankIndex(rank: number): number {
  return MAG_CYCLE.indexOf(rank as (typeof MAG_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function limbOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SEXTANT_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** Altitude is 15, 30, or 45 minutes. Anything else stays blank. */
export function sextantAlt(raw: unknown): 15 | 30 | 45 | null {
  const value = Number(clip(raw, 2));
  return (ALT_CYCLE as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Magnitude is 1, 3, 5, or 7. Anything else stays blank. */
export function sextantMag(raw: unknown): 1 | 3 | 5 | 7 | null {
  const value = Number(clip(raw, 1));
  return (MAG_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 7) : null;
}

/** Metal is brass, steel, or gilt. The saved metal is BRASS, STEEL, or GILT. */
export function metalOf(raw: unknown): string {
  const text = metalName(raw);
  return text ? text.toUpperCase() : "";
}

/** Sighting is rise, hold, or set. A blank sighting stays blank. */
export function sightOf(raw: unknown): string {
  return sightName(raw);
}

export function peakLimb(frame: unknown): boolean {
  return PEAK.has(clip(frame, 12).toLowerCase());
}

export function quietLimb(frame: unknown): boolean {
  return QUIET.has(clip(frame, 12).toLowerCase());
}

/** Early is arc and limb. Mid is index. Late is horizon. */
export function limbBand(frame: unknown): string {
  const text = limbOf(frame);
  if (!text) return "";
  if (EARLY.has(text)) return "early";
  if (text === "index") return "mid";
  return "late";
}

/** Signed distance from the slip frame to the desk frame. */
export function limbGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(limbOf(from));
  const right = limbIndex(limbOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseMetal(dye: unknown): boolean {
  return HOUSE.has(metalOf(dye));
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return limbOf(text) || "all";
}

export function activeSextantAlt(raw: unknown): string {
  const wait = sextantAlt(raw);
  return wait === null ? "all" : String(wait);
}

export function activeSight(raw: unknown, allow: readonly string[]): string {
  const text = sightOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSextantMag(raw: unknown): string {
  const rank = sextantMag(raw);
  return rank === null ? "all" : String(rank);
}

export function activeMetal(raw: unknown): string {
  const text = metalName(raw);
  return text || "all";
}

export function moveSextantFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestMetal(cards: readonly SextantSight[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || !card.dye) continue;
    counts.set(card.dye, (counts.get(card.dye) || 0) + 1);
  }
  let best = "BRASS";
  let score = 0;
  for (const dye of ["BRASS", "STEEL", "GILT"]) {
    const count = counts.get(dye) || 0;
    if (count > score) {
      best = dye;
      score = count;
    }
  }
  return best;
}

/** A night watch asks for a short altitude. Morning asks for the middle one. Saved altitudes win when any exist. */
export function suggestSextantAlt(cards: readonly SextantSight[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "open") || card.wait === null) continue;
    counts.set(card.wait, (counts.get(card.wait) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const wait of ALT_CYCLE) {
    const count = counts.get(wait) || 0;
    if (count > score) {
      best = wait;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 15;
  if (hour < 12) return 30;
  return 45;
}

/** Before the watch opens, suggest the arc. The rest of the day suggests the index. */
export function suggestLimb(hour: number): SextantLimb {
  return hour < 6 ? "arc" : "index";
}

/** The pilot with the fewest open unpinned sights. A tie keeps the roster order. */
export function fairSextantPilot(cards: readonly SextantSight[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "open") && !card.pinned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.weaver.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readSights(raw: unknown): SextantSight[] {
  if (!Array.isArray(raw)) return [];
  const out: SextantSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SextantSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      weaver: clip(row.weaver, 24),
      frame: limbOf(row.frame),
      wait: sextantAlt(row.wait),
      dye: metalOf(row.dye),
      shuttle: sightOf(row.shuttle),
      rank: sextantMag(row.rank) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      paused: row.paused === true,
      sealed: row.sealed === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addSextant(
  cards: readonly SextantSight[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    weaver?: string;
    frame?: string;
    wait?: unknown;
    dye?: string;
    shuttle?: string;
    rank?: unknown;
    tags?: string;
  },
): SextantSight[] {
  const current = readSights(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: SextantSight = {
    id,
    title,
    note: noteOf(card.note),
    weaver: clip(card.weaver, 24),
    frame: limbOf(card.frame),
    wait: sextantAlt(card.wait),
    dye: metalOf(card.dye),
    shuttle: sightOf(card.shuttle),
    rank: sextantMag(card.rank) ?? 1,
    tags: tagsOf(card.tags),
    pinned: false,
    paused: false,
    sealed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly SextantSight[], id: string, change: (card: SextantSight) => SextantSight): SextantSight[] {
  return readSights(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly SextantSight[], ids: readonly string[], change: (card: SextantSight) => SextantSight): SextantSight[] {
  const picked = new Set(ids);
  return readSights(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editSextant(cards: readonly SextantSight[], id: string, title: string): SextantSight[] {
  const next = lineOf(title);
  if (!next) return readSights(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSextantNote(cards: readonly SextantSight[], id: string, note: string): SextantSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setSextantPin(cards: readonly SextantSight[], id: string, pinned: boolean): SextantSight[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSextantStay(cards: readonly SextantSight[], id: string, paused: boolean): SextantSight[] {
  return mapCard(cards, id, (card) => (card.paused === paused ? card : { ...card, paused, sealed: paused ? false : card.sealed, audit: paused ? "pause" : "resume" }));
}

export function setSextantStow(cards: readonly SextantSight[], id: string, sealed: boolean): SextantSight[] {
  return mapCard(cards, id, (card) => (card.sealed === sealed ? card : { ...card, sealed, paused: sealed ? false : card.paused, audit: sealed ? "seal" : "open" }));
}

export function setSextantStar(cards: readonly SextantSight[], id: string, flagged: boolean): SextantSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "flag" }));
}

export function setSextantMetal(cards: readonly SextantSight[], id: string, dye: unknown): SextantSight[] {
  const next = metalOf(dye);
  if (!next) return readSights(cards);
  return mapCard(cards, id, (card) => (card.dye === next ? card : { ...card, dye: next, audit: "dye" }));
}

/** Shuttle steps draw, beat, rest, then draw again. A blank shuttle starts at draw. */
export function cycleSight(cards: readonly SextantSight[], id: string): SextantSight[] {
  return mapCard(cards, id, (card) => {
    const at = SIGHTS.indexOf(card.shuttle as (typeof SIGHTS)[number]);
    const next = at < 0 ? SIGHTS[0] : SIGHTS[(at + 1) % SIGHTS.length];
    return next === card.shuttle ? card : { ...card, shuttle: next, audit: "shuttle" };
  });
}

export function addSextantTag(cards: readonly SextantSight[], id: string, tag: string): SextantSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSights(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank altitude becomes 15, 15 becomes 30, and 30 becomes 45. An altitude of 45 stays. */
export function lengthenSextant(cards: readonly SextantSight[], id: string): SextantSight[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 45) return card;
    const next = card.wait === 30 ? 45 : card.wait === 15 ? 30 : 15;
    return { ...card, wait: next, audit: "wait" };
  });
}

/** A blank altitude becomes 45, 45 becomes 30, and 30 becomes 15. An altitude of 15 stays. */
export function shortenSextant(cards: readonly SextantSight[], id: string): SextantSight[] {
  return mapCard(cards, id, (card) => {
    if (card.wait === 15) return card;
    const next = card.wait === 30 ? 15 : card.wait === 45 ? 30 : 45;
    return { ...card, wait: next, audit: "short" };
  });
}

export function raiseSextant(cards: readonly SextantSight[], id: string): SextantSight[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at < 0) return { ...card, rank: 1, audit: "rank" };
    if (at === MAG_CYCLE.length - 1) return card;
    return { ...card, rank: MAG_CYCLE[at + 1], audit: "rank" };
  });
}

export function lowerSextant(cards: readonly SextantSight[], id: string): SextantSight[] {
  return mapCard(cards, id, (card) => {
    const at = rankIndex(card.rank);
    if (at <= 0) return card;
    return { ...card, rank: MAG_CYCLE[at - 1], audit: "rank" };
  });
}

export function bulkSextantPin(cards: readonly SextantSight[], ids: readonly string[]): SextantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, pinned: true, audit: "pin" }));
}

export function bulkSextantStow(cards: readonly SextantSight[], ids: readonly string[]): SextantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, sealed: true, paused: false, audit: "seal" }));
}

export function bulkSextantHold(cards: readonly SextantSight[], ids: readonly string[]): SextantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, shuttle: "hold", audit: "shuttle" }));
}

export function bulkSextantGilt(cards: readonly SextantSight[], ids: readonly string[]): SextantSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, dye: "GILT", audit: "dye" }));
}

export function bulkSextantTag(cards: readonly SextantSight[], ids: readonly string[], tag: string): SextantSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readSights(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly SextantSight[], ids: readonly string[], index: number, change: (list: readonly SextantSight[], id: string) => SextantSight[]): SextantSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readSights(cards);
}

export function lengthenSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  return focused(cards, ids, index, lengthenSextant);
}

export function shortenSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  return focused(cards, ids, index, shortenSextant);
}

export function sightFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  return focused(cards, ids, index, cycleSight);
}

export function raiseSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  return focused(cards, ids, index, raiseSextant);
}

export function lowerSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  return focused(cards, ids, index, lowerSextant);
}

export function pinSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  const id = ids[index];
  if (!id) return readSights(cards);
  const card = readSights(cards).find((item) => item.id === id);
  return card ? setSextantPin(cards, id, !card.pinned) : readSights(cards);
}

export function staySextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  const id = ids[index];
  if (!id) return readSights(cards);
  const card = readSights(cards).find((item) => item.id === id);
  return card ? setSextantStay(cards, id, !card.paused) : readSights(cards);
}

export function starSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number): SextantSight[] {
  const id = ids[index];
  if (!id) return readSights(cards);
  const card = readSights(cards).find((item) => item.id === id);
  return card ? setSextantStar(cards, id, !card.flagged) : readSights(cards);
}

export function tagSextantFocused(cards: readonly SextantSight[], ids: readonly string[], index: number, tag: string): SextantSight[] {
  const id = ids[index];
  return id ? addSextantTag(cards, id, tag) : readSights(cards);
}

export function readSextantViews(raw: unknown): SextantView[] {
  if (!Array.isArray(raw)) return [];
  const out: SextantView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SextantView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      weaver: clip(row.weaver, 24),
      dye: activeMetal(row.dye),
      shuttle: activeSight(row.shuttle, SIGHTS),
      frame: activeLimb(row.frame),
      wait: activeSextantAlt(row.wait),
      rank: activeSextantMag(row.rank),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSextantView(
  views: readonly SextantView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    weaver?: string;
    dye?: string;
    shuttle?: string;
    frame?: string;
    wait?: string;
    rank?: string;
  },
): SextantView[] {
  const current = readSextantViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: SextantView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    weaver: clip(view.weaver, 24),
    dye: activeMetal(view.dye),
    shuttle: activeSight(view.shuttle, SIGHTS),
    frame: activeLimb(view.frame),
    wait: activeSextantAlt(view.wait),
    rank: activeSextantMag(view.rank),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSextantView(views: readonly SextantView[], id: string): SextantView[] {
  return readSextantViews(views).filter((view) => view.id !== id);
}

export function sextantDensity(raw: unknown): SextantDensity {
  return raw === "close" ? "close" : "roomy";
}

/** A sight more than one limb behind the desk, at magnitude 1, is late. */
export function lateSight(card: SextantSight, deskFrame: unknown): boolean {
  const gap = limbGap(card.frame, deskFrame);
  return card.rank === 1 && gap !== null && gap > 1;
}

export function idleSight(card: SextantSight): boolean {
  return card.shuttle === "rise" && quietLimb(card.frame) && card.rank === 1;
}

export function briskSight(card: SextantSight): boolean {
  return card.rank === 7 && card.shuttle === "hold" && peakLimb(card.frame);
}

export function restingSight(card: SextantSight): boolean {
  return card.wait === 45 && card.shuttle === "set" && card.frame === "horizon";
}

/** A fifteen-minute altitude on a peak limb is overdue unless the sight is pinned. */
export function overdueSight(card: SextantSight): boolean {
  return card.wait === 15 && peakLimb(card.frame) && !card.pinned;
}

export function visibleSights(
  cards: readonly SextantSight[],
  tray: SextantTray,
  query: string,
  weaver: string,
  dye: string,
  shuttle: string,
  frame: string,
  wait: string,
  rank: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): SextantSight[] {
  const text = query.trim().toLowerCase();
  const weaverOn = weaver === "all" ? "" : weaver.trim().toLowerCase();
  const dyeOn = dye === "all" ? "" : metalOf(dye);
  const shuttleOn = shuttle === "all" ? "" : sightOf(shuttle);
  const frameOn = frame === "all" ? "" : activeLimb(frame);
  const waitOn = wait === "all" ? "" : activeSextantAlt(wait);
  const rankOn = rank === "all" ? "" : activeSextantMag(rank);
  return readSights(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (weaverOn && card.weaver.toLowerCase() !== weaverOn) return false;
    if (dyeOn && card.dye !== dyeOn) return false;
    if (shuttleOn && card.shuttle !== shuttleOn) return false;
    if (frameOn === "peak" && !peakLimb(card.frame)) return false;
    if (frameOn === "quiet" && !quietLimb(card.frame)) return false;
    if (frameOn && frameOn !== "peak" && frameOn !== "quiet" && card.frame !== frameOn) return false;
    if (waitOn && String(card.wait ?? "") !== waitOn) return false;
    if (rankOn && String(card.rank) !== rankOn) return false;
    if (houseOnly && !houseMetal(card.dye)) return false;
    if (peakOnly && !peakLimb(card.frame)) return false;
    if (quietOnly && !quietLimb(card.frame)) return false;
    return true;
  });
}

export function sortSights(cards: readonly SextantSight[], sort: SextantSort): SextantSight[] {
  return cards.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "weaver") {
      const weaver = a.weaver.localeCompare(b.weaver);
      if (weaver) return weaver;
    }
    const frame = (limbIndex(a.frame) < 0 ? 99 : limbIndex(a.frame)) - (limbIndex(b.frame) < 0 ? 99 : limbIndex(b.frame));
    if (frame) return frame;
    return a.title.localeCompare(b.title);
  });
}

export function sextantCounts(cards: readonly SextantSight[], shown: readonly SextantSight[], deskFrame: unknown): SextantCounts {
  const open = cards.filter((card) => inTray(card, "open"));
  return {
    open: open.length,
    pause: cards.filter((card) => inTray(card, "pause")).length,
    seal: cards.filter((card) => inTray(card, "seal")).length,
    pinned: open.filter((card) => card.pinned).length,
    peak: open.filter((card) => peakLimb(card.frame)).length,
    quiet: open.filter((card) => quietLimb(card.frame)).length,
    soon: open.filter((card) => card.wait === 15).length,
    rank: open.reduce((sum, card) => sum + card.rank, 0),
    house: open.filter((card) => houseMetal(card.dye)).length,
    wait: open.filter((card) => card.wait !== null).length,
    matched: shown.filter((card) => card.frame && card.frame === limbOf(deskFrame)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleSight(card)).length,
    brisk: open.filter((card) => briskSight(card)).length,
    resting: open.filter((card) => restingSight(card)).length,
    overdue: open.filter((card) => overdueSight(card)).length,
  };
}

export function clashLimbCount(cards: readonly SextantSight[]): number {
  const open = cards.filter((card) => inTray(card, "open") && card.frame);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.frame === card.frame && other.rank === card.rank)).length;
}

export function neighborSextantCount(cards: readonly SextantSight[]): number {
  const open = cards.filter((card) => inTray(card, "open") && rankIndex(card.rank) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(rankIndex(other.rank) - rankIndex(card.rank));
    const ring = Math.min(gap, MAG_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestSextantPilot(cards: readonly SextantSight[]): string {
  const open = cards.filter((card) => inTray(card, "open") && card.weaver);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.weaver.toLowerCase() === card.weaver.toLowerCase()).length;
    if (count > score) {
      best = card.weaver;
      score = count;
    }
  }
  return best;
}

export function reminderSights(cards: readonly SextantSight[]): SextantSight[] {
  return cards.filter((card) => inTray(card, "open") && (card.wait === 15 || card.wait === 30));
}

export function idleSights(cards: readonly SextantSight[]): SextantSight[] {
  return cards.filter((card) => inTray(card, "open") && idleSight(card));
}

export function sextantTimeline(cards: readonly SextantSight[]): { rank: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return MAG_CYCLE.map((rank) => ({ rank, titles: open.filter((card) => card.rank === rank).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function sextantBars(cards: readonly SextantSight[]): { frame: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "open"));
  return SEXTANT_LIMBS.map((frame) => ({ frame, count: open.filter((card) => card.frame === frame).length }));
}

export function sextantPilots(cards: readonly SextantSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.weaver || out.some((item) => item.toLowerCase() === card.weaver.toLowerCase())) continue;
    out.push(card.weaver);
  }
  return out;
}

export function sextantCopy(card: SextantSight): string {
  return [card.title, card.weaver, card.frame, card.dye, card.shuttle, card.wait ?? "", card.rank, card.note].filter((item) => item !== "").join(" · ");
}

export function sextantShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function sextantCsv(cards: readonly SextantSight[], deskFrame: unknown): string {
  const lines = ["title,pilot,limb,metal,sight,alt,mag,tags,pinned,paused,sealed,starred,gap,late,idle,peak,quiet,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readSights(cards)) {
    const gap = limbGap(card.frame, deskFrame);
    lines.push([
      csvCell(card.title),
      csvCell(card.weaver),
      card.frame,
      card.dye,
      card.shuttle,
      card.wait === null ? "" : String(card.wait),
      String(card.rank),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.paused ? "1" : "0",
      card.sealed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSight(card, deskFrame) ? "1" : "0",
      idleSight(card) ? "1" : "0",
      peakLimb(card.frame) ? "1" : "0",
      quietLimb(card.frame) ? "1" : "0",
      houseMetal(card.dye) ? "1" : "0",
      limbBand(card.frame),
      briskSight(card) ? "1" : "0",
      restingSight(card) ? "1" : "0",
      overdueSight(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function officeRecord(raw: OfficeValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: OfficeValue): boolean {
  const row = officeRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type OfficeParts = { letters: string; office: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function officeText(raw: OfficeValue): string {
  if (hasBlocked(raw)) return "";
  const row = officeRecord(raw);
  if (row && !("office" in row) && !("name" in row)) return "";
  return row ? clip(row.office ?? row.name, 32) : clip(raw, 32);
}

function officeParts(raw: OfficeValue): OfficeParts | null {
  const text = officeText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    office: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked field clears the plate. A real invite code is set. A blank or broken code is clear. */
export function officeState(raw: OfficeValue): OfficeState {
  if (hasBlocked(raw)) return "";
  const row = officeRecord(raw);
  if (row && !("office" in row) && !("name" in row)) return "";
  return officeParts(raw) ? "set" : "clear";
}

/** HQ is a hall, FLOOR is a wing, a separator is a yard, and a plain word is a bay. */
export function officeLane(raw: OfficeValue): OfficeLane {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  if (!parts) return "";
  const key = parts.office.toLowerCase();
  if (key === "hq") return "hall";
  if (key === "floor") return "wing";
  if (parts.seps >= 1) return "yard";
  return "bay";
}

/** The first two letters. */
export function officeStamp(raw: OfficeValue): string {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** HQ is champagne, FLOOR is graphite, and other offices follow the last letter. */
export function officeHue(raw: OfficeValue): OfficeHue {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  if (!parts) return "";
  const lane = officeLane(raw);
  if (lane === "hall") return "champagne";
  if (lane === "wing") return "graphite";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 74) return "ivory";
  return "champagne";
}

export function officeTwin(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function officeWide(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function officeNotch(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function officeEcho(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function officeLeap(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function officeSlash(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function officeKnown(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.office.toLowerCase()));
}

export function officeCap(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.office[0] || ""));
}

export function officeTail(raw: OfficeValue): boolean {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function officeScore(raw: OfficeValue): number {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return parts ? parts.score : 0;
}

export function officeStep(raw: OfficeValue): number {
  const parts = officeState(raw) === "set" ? officeParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function officeLanes(rows: readonly OfficeRow[]): OfficeLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = officeLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingOffice(rows: readonly OfficeRow[]): string {
  const bars = officeLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingOfficeHue(rows: readonly OfficeRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = officeHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedOfficeCount(rows: readonly OfficeRow[]): number {
  const marks = rows.map((row) => officeStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneOfficeCount(rows: readonly OfficeRow[], lane: OfficeLane): number {
  return rows.filter((row) => officeLane(row.note) === lane).length;
}

export function officeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentOfficeLanes(rows: readonly OfficeRow[]): string[] {
  return officeLanes(rows).map((line) => line.lane);
}

export function readHiddenOffices(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedOffices(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleOffice(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleOfficeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkOfficeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleOfficeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleOffices(
  rows: readonly OfficeRow[],
  lane: string,
  hue: string,
  query: string,
  review: OfficeReview,
  reviewed: readonly string[],
  shape: OfficeShape,
): OfficeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (officeState(row.note) === "") return false;
    const found = officeLane(row.note);
    const hueName = officeHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${officeText(row.note)} ${officeStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "wing" && found !== "wing") return false;
    if (shape === "bay" && found !== "bay") return false;
    if (shape === "yard" && found !== "yard") return false;
    if (shape === "wide" && !officeWide(row.note)) return false;
    if (shape === "notch" && !officeNotch(row.note)) return false;
    if (shape === "leap" && !officeLeap(row.note)) return false;
    if (shape === "slash" && !officeSlash(row.note)) return false;
    if (shape === "twin" && !officeTwin(row.note)) return false;
    if (shape === "known" && !officeKnown(row.note)) return false;
    if (shape === "echo" && !officeEcho(row.note)) return false;
    return true;
  });
}

export function officeCopy(raw: OfficeValue): string {
  return [officeStamp(raw), officeLane(raw), officeHue(raw)].filter(Boolean).join(" ");
}

export function officeLanesCsv(rows: readonly OfficeRow[]): string {
  const lines = ["lane,count"];
  for (const line of officeLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function officeRowsCsv(rows: readonly OfficeRow[], reviewed: readonly string[]): string {
  const lines = ["name,office,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (officeState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(officeText(row.note)),
      officeStamp(row.note),
      officeLane(row.note),
      officeHue(row.note),
      String(officeStep(row.note)),
      officeEcho(row.note) ? "1" : "0",
      officeWide(row.note) ? "1" : "0",
      officeNotch(row.note) ? "1" : "0",
      officeLeap(row.note) ? "1" : "0",
      officeSlash(row.note) ? "1" : "0",
      officeTwin(row.note) ? "1" : "0",
      officeKnown(row.note) ? "1" : "0",
      officeCap(row.note) ? "1" : "0",
      officeTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
