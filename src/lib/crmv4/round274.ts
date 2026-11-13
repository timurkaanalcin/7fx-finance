/**
 * Octant arcs for a coastal sight book, and banner plates already stored as campaign.
 * Sights are harbor, headland, reef, and offing. Mirrors are index, horizon, and shade.
 * Altitudes are 10, 30, or 60 degrees. Shades are 1, 3, 5, or 9.
 * SPRING is a quay and VIP is a loft. A separator is a pier.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_octant_arc (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   sight text not null default '',
 *   finish text not null default '',
 *   mirror text not null default '',
 *   altitude_deg integer,
 *   shade_no integer not null default 1,
 *   tags text not null default '',
 *   latched boolean not null default false,
 *   locked boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_banner_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_banner_review (
 *   trader_id text primary key
 * );
 */

export const OCT_KEY = "crmv4-octant-arc";
export const OCT_VIEW_KEY = "crmv4-octant-views";
export const OCT_DENSITY_KEY = "crmv4-octant-density";
export const BNN_KEY = "crmv4-banner-hide";
export const BNN_REVIEW_KEY = "crmv4-banner-review";

export const OCTANT_SIGHTS = ["harbor", "headland", "reef", "offing"] as const;

export type OctantSight = (typeof OCTANT_SIGHTS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type MirrorName = "blank" | "index" | "horizon" | "shade";

export type ArcTray = "deck" | "locker" | "chest";

export type ArcDensity = "airy" | "tight";

export type ArcSort = "sight" | "keeper";

export type OctantArc = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  sight: string;
  altitude: number | null;
  finish: string;
  mirror: string;
  shade: number;
  tags: string[];
  latched: boolean;
  locked: boolean;
  chested: boolean;
  flagged: boolean;
  audit: string;
};

export type ArcView = {
  id: string;
  name: string;
  tray: ArcTray;
  query: string;
  keeper: string;
  finish: string;
  mirror: string;
  sight: string;
  altitude: string;
  shade: string;
};

export type ArcCounts = {
  deck: number;
  locker: number;
  chest: number;
  latched: number;
  keen: number;
  still: number;
  soon: number;
  shade: number;
  house: number;
  altitude: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type BannerLane = "" | "quay" | "loft" | "hall" | "closet" | "pier";

export type BannerHue = "" | "ivory" | "graphite" | "champagne";

export type BannerState = "" | "clear" | "set";

export type BannerShape = "all" | "quay" | "loft" | "hall" | "closet" | "pier" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type BannerReview = "all" | "reviewed" | "fresh";

export type BannerValue = string | { campaign?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type BannerRow = { id: string; label: string; note: BannerValue };

export type BannerLaneLine = { lane: string; count: number };

export const ROUND274_FEATURES = [
  "save",
  "note",
  "trays",
  "latch",
  "altitude",
  "chest",
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "banner",
  "banner-csv",
] as const;

const AUDITS = ["save", "edit", "note", "mirror", "latch", "unlatch", "lock", "resume", "chest", "open", "finish", "tag", "shade", "altitude", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const LIMBS = ["index", "horizon", "shade"] as const;

const ARC_CYCLE = [10, 30, 60] as const;

const SHADE_CYCLE = [1, 3, 5, 9] as const;

const KEEN = new Set(["reef", "offing"]);

const STILL = new Set(["harbor", "headland"]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const DAWN = new Set(["harbor"]);

const LANE_ORDER = ["quay", "loft", "hall", "closet", "pier"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["spring", "vip", "demo", "brand"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ArcTray {
  return raw === "locker" || raw === "chest" ? raw : "deck";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function mirrorName(raw: unknown): Exclude<MirrorName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LIMBS as readonly string[]).includes(text) ? (text as Exclude<MirrorName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[qr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: OctantArc, tray: ArcTray): boolean {
  if (tray === "locker") return card.locked && !card.chested;
  if (tray === "chest") return card.chested;
  return !card.locked && !card.chested;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function sightIndex(sight: string): number {
  return OCTANT_SIGHTS.indexOf(sight as OctantSight);
}

function shadeIndex(shade: number): number {
  return SHADE_CYCLE.indexOf(shade as (typeof SHADE_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function sightOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (OCTANT_SIGHTS as readonly string[]).includes(text) ? text : "";
}

/** Altitude is 10, 30, or 60 degrees. Anything else stays blank. */
export function octantAltitude(raw: unknown): 10 | 30 | 60 | null {
  const value = Number(clip(raw, 2));
  return (ARC_CYCLE as readonly number[]).includes(value) ? (value as 10 | 30 | 60) : null;
}

/** Shade is 1, 3, 5, or 9. Anything else stays blank. */
export function octantShade(raw: unknown): 1 | 3 | 5 | 9 | null {
  const value = Number(clip(raw, 2));
  return (SHADE_CYCLE as readonly number[]).includes(value) ? (value as 1 | 3 | 5 | 9) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Mirror is index, horizon, or shade. A blank mirror stays blank. */
export function mirrorOf(raw: unknown): string {
  return mirrorName(raw);
}

export function keenSight(sight: unknown): boolean {
  return KEEN.has(clip(sight, 12).toLowerCase());
}

export function stillSight(sight: unknown): boolean {
  return STILL.has(clip(sight, 12).toLowerCase());
}

/** Dawn is harbor. Noon is headland. Dusk is reef. Night is offing. */
export function sightBand(sight: unknown): string {
  const text = sightOf(sight);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "headland") return "noon";
  if (text === "reef") return "dusk";
  return "night";
}

/** Signed distance from the circle sight to the desk sight. */
export function sightGap(from: unknown, to: unknown): number | null {
  const left = sightIndex(sightOf(from));
  const right = sightIndex(sightOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE.has(finishOf(finish));
}

export function activeSight(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return sightOf(text) || "all";
}

export function activeAltitude(raw: unknown): string {
  const altitude = octantAltitude(raw);
  return altitude === null ? "all" : String(altitude);
}

export function activeMirror(raw: unknown, allow: readonly string[]): string {
  const text = mirrorOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeShade(raw: unknown): string {
  const shade = octantShade(raw);
  return shade === null ? "all" : String(shade);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveOctantFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly OctantArc[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "IVORY";
  let score = 0;
  for (const finish of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(finish) || 0;
    if (count > score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before seven, suggest ten degrees. Through the afternoon, thirty. Evening asks for sixty. Saved altitudes win when any exist. */
export function suggestAltitude(cards: readonly OctantArc[], hour: number): 10 | 30 | 60 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || card.altitude === null) continue;
    counts.set(card.altitude, (counts.get(card.altitude) || 0) + 1);
  }
  let best: 10 | 30 | 60 | null = null;
  let score = 0;
  for (const altitude of ARC_CYCLE) {
    const count = counts.get(altitude) || 0;
    if (count > score) {
      best = altitude;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 7) return 10;
  if (hour < 15) return 30;
  return 60;
}

/** Before nine, suggest harbor. The rest of the day suggests reef. */
export function suggestSight(hour: number): OctantSight {
  return hour < 9 ? "harbor" : "reef";
}

/** The keeper with the fewest deck unlatched arcs. A tie keeps the roster order. */
export function fairKeeper(cards: readonly OctantArc[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "deck") && !card.latched);
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

export function readArcs(raw: unknown): OctantArc[] {
  if (!Array.isArray(raw)) return [];
  const out: OctantArc[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OctantArc>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      sight: sightOf(row.sight),
      altitude: octantAltitude(row.altitude),
      finish: finishOf(row.finish),
      mirror: mirrorOf(row.mirror),
      shade: octantShade(row.shade) ?? 1,
      tags: tagsOf(row.tags),
      latched: row.latched === true,
      locked: row.locked === true,
      chested: row.chested === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addArc(
  cards: readonly OctantArc[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    sight?: string;
    altitude?: unknown;
    finish?: string;
    mirror?: string;
    shade?: unknown;
    tags?: string;
  },
): OctantArc[] {
  const current = readArcs(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: OctantArc = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    sight: sightOf(card.sight),
    altitude: octantAltitude(card.altitude),
    finish: finishOf(card.finish),
    mirror: mirrorOf(card.mirror),
    shade: octantShade(card.shade) ?? 1,
    tags: tagsOf(card.tags),
    latched: false,
    locked: false,
    chested: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly OctantArc[], id: string, change: (card: OctantArc) => OctantArc): OctantArc[] {
  return readArcs(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly OctantArc[], ids: readonly string[], change: (card: OctantArc) => OctantArc): OctantArc[] {
  const picked = new Set(ids);
  return readArcs(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editArc(cards: readonly OctantArc[], id: string, title: string): OctantArc[] {
  const next = lineOf(title);
  if (!next) return readArcs(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editArcNote(cards: readonly OctantArc[], id: string, note: string): OctantArc[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setArcLatch(cards: readonly OctantArc[], id: string, latched: boolean): OctantArc[] {
  return mapCard(cards, id, (card) => (card.latched === latched ? card : { ...card, latched, audit: latched ? "latch" : "unlatch" }));
}

export function setArcLock(cards: readonly OctantArc[], id: string, locked: boolean): OctantArc[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, chested: locked ? false : card.chested, audit: locked ? "lock" : "resume" }));
}

export function setArcChest(cards: readonly OctantArc[], id: string, chested: boolean): OctantArc[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, locked: chested ? false : card.locked, audit: chested ? "chest" : "open" }));
}

export function setArcStar(cards: readonly OctantArc[], id: string, flagged: boolean): OctantArc[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setArcFinish(cards: readonly OctantArc[], id: string, finish: unknown): OctantArc[] {
  const next = finishOf(finish);
  if (!next) return readArcs(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Mirror steps index, horizon, shade, then index again. A blank mirror starts at index. */
export function cycleMirror(cards: readonly OctantArc[], id: string): OctantArc[] {
  return mapCard(cards, id, (card) => {
    const at = LIMBS.indexOf(card.mirror as (typeof LIMBS)[number]);
    const next = at < 0 ? LIMBS[0] : LIMBS[(at + 1) % LIMBS.length];
    return next === card.mirror ? card : { ...card, mirror: next, audit: "mirror" };
  });
}

export function addArcTag(cards: readonly OctantArc[], id: string, tag: string): OctantArc[] {
  const next = tagsOf(tag)[0];
  if (!next) return readArcs(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank altitude becomes 10, 10 becomes 30, and 30 becomes 60. An altitude of 60 stays. */
export function liftAltitude(cards: readonly OctantArc[], id: string): OctantArc[] {
  return mapCard(cards, id, (card) => {
    if (card.altitude === 60) return card;
    const next = card.altitude === 30 ? 60 : card.altitude === 10 ? 30 : 10;
    return { ...card, altitude: next, audit: "altitude" };
  });
}

/** A blank altitude becomes 60, 60 becomes 30, and 30 becomes 10. An altitude of 10 stays. */
export function dipAltitude(cards: readonly OctantArc[], id: string): OctantArc[] {
  return mapCard(cards, id, (card) => {
    if (card.altitude === 10) return card;
    const next = card.altitude === 30 ? 10 : card.altitude === 60 ? 30 : 60;
    return { ...card, altitude: next, audit: "dip" };
  });
}

export function raiseShade(cards: readonly OctantArc[], id: string): OctantArc[] {
  return mapCard(cards, id, (card) => {
    const at = shadeIndex(card.shade);
    if (at < 0) return { ...card, shade: 1, audit: "shade" };
    if (at === SHADE_CYCLE.length - 1) return card;
    return { ...card, shade: SHADE_CYCLE[at + 1], audit: "shade" };
  });
}

export function lowerShade(cards: readonly OctantArc[], id: string): OctantArc[] {
  return mapCard(cards, id, (card) => {
    const at = shadeIndex(card.shade);
    if (at <= 0) return card;
    return { ...card, shade: SHADE_CYCLE[at - 1], audit: "shade" };
  });
}

export function bulkArcLatch(cards: readonly OctantArc[], ids: readonly string[]): OctantArc[] {
  return touchIds(cards, ids, (card) => ({ ...card, latched: true, audit: "latch" }));
}

export function bulkArcChest(cards: readonly OctantArc[], ids: readonly string[]): OctantArc[] {
  return touchIds(cards, ids, (card) => ({ ...card, chested: true, locked: false, audit: "chest" }));
}

export function bulkArcShadeMirror(cards: readonly OctantArc[], ids: readonly string[]): OctantArc[] {
  return touchIds(cards, ids, (card) => ({ ...card, mirror: "shade", audit: "mirror" }));
}

export function bulkArcChampagne(cards: readonly OctantArc[], ids: readonly string[]): OctantArc[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkArcTag(cards: readonly OctantArc[], ids: readonly string[], tag: string): OctantArc[] {
  const next = tagsOf(tag)[0];
  if (!next) return readArcs(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly OctantArc[], ids: readonly string[], index: number, change: (list: readonly OctantArc[], id: string) => OctantArc[]): OctantArc[] {
  const id = ids[index];
  return id ? change(cards, id) : readArcs(cards);
}

export function liftAltitudeFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  return focused(cards, ids, index, liftAltitude);
}

export function dipAltitudeFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  return focused(cards, ids, index, dipAltitude);
}

export function mirrorFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  return focused(cards, ids, index, cycleMirror);
}

export function raiseShadeFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  return focused(cards, ids, index, raiseShade);
}

export function lowerShadeFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  return focused(cards, ids, index, lowerShade);
}

export function latchArcFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  const id = ids[index];
  if (!id) return readArcs(cards);
  const card = readArcs(cards).find((item) => item.id === id);
  return card ? setArcLatch(cards, id, !card.latched) : readArcs(cards);
}

export function lockArcFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  const id = ids[index];
  if (!id) return readArcs(cards);
  const card = readArcs(cards).find((item) => item.id === id);
  return card ? setArcLock(cards, id, !card.locked) : readArcs(cards);
}

export function starArcFocused(cards: readonly OctantArc[], ids: readonly string[], index: number): OctantArc[] {
  const id = ids[index];
  if (!id) return readArcs(cards);
  const card = readArcs(cards).find((item) => item.id === id);
  return card ? setArcStar(cards, id, !card.flagged) : readArcs(cards);
}

export function tagArcFocused(cards: readonly OctantArc[], ids: readonly string[], index: number, tag: string): OctantArc[] {
  const id = ids[index];
  return id ? addArcTag(cards, id, tag) : readArcs(cards);
}

export function readArcViews(raw: unknown): ArcView[] {
  if (!Array.isArray(raw)) return [];
  const out: ArcView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArcView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      finish: activeFinish(row.finish),
      mirror: activeMirror(row.mirror, LIMBS),
      sight: activeSight(row.sight),
      altitude: activeAltitude(row.altitude),
      shade: activeShade(row.shade),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addArcView(
  views: readonly ArcView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    finish?: string;
    mirror?: string;
    sight?: string;
    altitude?: string;
    shade?: string;
  },
): ArcView[] {
  const current = readArcViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: ArcView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    finish: activeFinish(view.finish),
    mirror: activeMirror(view.mirror, LIMBS),
    sight: activeSight(view.sight),
    altitude: activeAltitude(view.altitude),
    shade: activeShade(view.shade),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropArcView(views: readonly ArcView[], id: string): ArcView[] {
  return readArcViews(views).filter((view) => view.id !== id);
}

export function arcDensity(raw: unknown): ArcDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** An arc more than one sight behind the desk, at shade 1, is late. */
export function lateArc(card: OctantArc, deskSight: unknown): boolean {
  const gap = sightGap(card.sight, deskSight);
  return card.shade === 1 && gap !== null && gap > 1;
}

export function idleArc(card: OctantArc): boolean {
  return card.mirror === "index" && stillSight(card.sight) && card.shade === 1;
}

export function briskArc(card: OctantArc): boolean {
  return card.shade === 9 && card.mirror === "shade" && keenSight(card.sight);
}

export function restingArc(card: OctantArc): boolean {
  return card.altitude === 60 && card.mirror === "horizon" && card.sight === "offing";
}

/** A ten-degree deck sight on a keen sight is overdue unless the arc is latched. */
export function overdueArc(card: OctantArc): boolean {
  return card.altitude === 10 && keenSight(card.sight) && !card.latched;
}

export function visibleArcs(
  cards: readonly OctantArc[],
  tray: ArcTray,
  query: string,
  keeper: string,
  finish: string,
  mirror: string,
  sight: string,
  altitude: string,
  shade: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): OctantArc[] {
  const text = query.trim().toLowerCase();
  const surveyorOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const limbOn = mirror === "all" ? "" : mirrorOf(mirror);
  const stationOn = sight === "all" ? "" : activeSight(sight);
  const arcOn = altitude === "all" ? "" : activeAltitude(altitude);
  const beadOn = shade === "all" ? "" : activeShade(shade);
  return readArcs(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (surveyorOn && card.keeper.toLowerCase() !== surveyorOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (limbOn && card.mirror !== limbOn) return false;
    if (stationOn === "keen" && !keenSight(card.sight)) return false;
    if (stationOn === "still" && !stillSight(card.sight)) return false;
    if (stationOn && stationOn !== "keen" && stationOn !== "still" && card.sight !== stationOn) return false;
    if (arcOn && String(card.altitude ?? "") !== arcOn) return false;
    if (beadOn && String(card.shade) !== beadOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenSight(card.sight)) return false;
    if (stillOnly && !stillSight(card.sight)) return false;
    return true;
  });
}

export function sortArcs(cards: readonly OctantArc[], sort: ArcSort): OctantArc[] {
  return cards.slice().sort((a, b) => {
    if (a.latched !== b.latched) return a.latched ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const sight = (sightIndex(a.sight) < 0 ? 99 : sightIndex(a.sight)) - (sightIndex(b.sight) < 0 ? 99 : sightIndex(b.sight));
    if (sight) return sight;
    return a.title.localeCompare(b.title);
  });
}

export function arcCounts(cards: readonly OctantArc[], shown: readonly OctantArc[], deskStation: unknown): ArcCounts {
  const open = cards.filter((card) => inTray(card, "deck"));
  return {
    deck: open.length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    latched: open.filter((card) => card.latched).length,
    keen: open.filter((card) => keenSight(card.sight)).length,
    still: open.filter((card) => stillSight(card.sight)).length,
    soon: open.filter((card) => card.altitude === 10).length,
    shade: open.reduce((sum, card) => sum + card.shade, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    altitude: open.filter((card) => card.altitude !== null).length,
    matched: shown.filter((card) => card.sight && card.sight === sightOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleArc(card)).length,
    brisk: open.filter((card) => briskArc(card)).length,
    resting: open.filter((card) => restingArc(card)).length,
    overdue: open.filter((card) => overdueArc(card)).length,
  };
}

export function clashSightCount(cards: readonly OctantArc[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && card.sight);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.sight === card.sight && other.shade === card.shade)).length;
}

export function neighborShadeCount(cards: readonly OctantArc[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && shadeIndex(card.shade) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(shadeIndex(other.shade) - shadeIndex(card.shade));
    const ring = Math.min(gap, SHADE_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly OctantArc[]): string {
  const open = cards.filter((card) => inTray(card, "deck") && card.keeper);
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

export function reminderArcs(cards: readonly OctantArc[]): OctantArc[] {
  return cards.filter((card) => inTray(card, "deck") && (card.altitude === 10 || card.altitude === 30));
}

export function idleArcs(cards: readonly OctantArc[]): OctantArc[] {
  return cards.filter((card) => inTray(card, "deck") && idleArc(card));
}

export function arcTimeline(cards: readonly OctantArc[]): { shade: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return SHADE_CYCLE.map((shade) => ({ shade, titles: open.filter((card) => card.shade === shade).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function arcBars(cards: readonly OctantArc[]): { sight: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return OCTANT_SIGHTS.map((sight) => ({ sight, count: open.filter((card) => card.sight === sight).length }));
}

export function arcKeepers(cards: readonly OctantArc[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function arcCopy(card: OctantArc): string {
  return [card.title, card.keeper, card.sight, card.finish, card.mirror, card.altitude ?? "", card.shade, card.note].filter((item) => item !== "").join(" · ");
}

export function arcShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function arcCsv(cards: readonly OctantArc[], deskStation: unknown): string {
  const lines = ["title,keeper,sight,finish,mirror,altitude,shade,tags,latched,locked,chested,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readArcs(cards)) {
    const gap = sightGap(card.sight, deskStation);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.sight,
      card.finish,
      card.mirror,
      card.altitude === null ? "" : String(card.altitude),
      String(card.shade),
      card.tags.join(" "),
      card.latched ? "1" : "0",
      card.locked ? "1" : "0",
      card.chested ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateArc(card, deskStation) ? "1" : "0",
      idleArc(card) ? "1" : "0",
      keenSight(card.sight) ? "1" : "0",
      stillSight(card.sight) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      sightBand(card.sight),
      briskArc(card) ? "1" : "0",
      restingArc(card) ? "1" : "0",
      overdueArc(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function bannerRecord(raw: BannerValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: BannerValue): boolean {
  const row = bannerRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type BannerParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function bannerText(raw: BannerValue): string {
  if (hasBlocked(raw)) return "";
  const row = bannerRecord(raw);
  if (row && !("campaign" in row) && !("code" in row)) return "";
  return row ? clip(row.campaign ?? row.code, 32) : clip(raw, 32);
}

function bannerParts(raw: BannerValue): BannerParts | null {
  const text = bannerText(raw);
  if (!/^[A-Za-z][A-Za-z_\/-]{1,15}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return null;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    score: (text.match(/-/g) || []).length,
    seps,
  };
}

/** A blocked money field clears the plate. A real campaign is set. A blank or broken campaign is clear. */
export function bannerState(raw: BannerValue): BannerState {
  if (hasBlocked(raw)) return "";
  const row = bannerRecord(raw);
  if (row && !("campaign" in row) && !("code" in row)) return "";
  return bannerParts(raw) ? "set" : "clear";
}

/** SPRING is a quay, VIP is a loft, DEMO is a closet, a separator is a pier, and a plain word is a hall. */
export function bannerLane(raw: BannerValue): BannerLane {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "spring") return "quay";
  if (key === "vip") return "loft";
  if (key === "demo") return "closet";
  if (parts.seps >= 1) return "pier";
  return "hall";
}

/** The first three letters. */
export function bannerStamp(raw: BannerValue): string {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return parts ? parts.letters.slice(0, 3).toUpperCase() : "";
}

/** SPRING is champagne, VIP is graphite, DEMO is ivory, and other campaigns follow the first letter. */
export function bannerHue(raw: BannerValue): BannerHue {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  if (!parts) return "";
  const lane = bannerLane(raw);
  if (lane === "quay") return "champagne";
  if (lane === "loft") return "graphite";
  if (lane === "closet") return "ivory";
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function bannerTwin(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function bannerWide(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function bannerNotch(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function bannerEcho(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function bannerLeap(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && parts.letters.length === 5);
}

export function bannerSlash(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function bannerKnown(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function bannerCap(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function bannerTail(raw: BannerValue): boolean {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function bannerScore(raw: BannerValue): number {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return parts ? parts.score : 0;
}

export function bannerStep(raw: BannerValue): number {
  const parts = bannerState(raw) === "set" ? bannerParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function bannerLanes(rows: readonly BannerRow[]): BannerLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = bannerLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingBanner(rows: readonly BannerRow[]): string {
  const bars = bannerLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingBannerHue(rows: readonly BannerRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = bannerHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedBannerCount(rows: readonly BannerRow[]): number {
  const marks = rows.map((row) => bannerStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneBannerCount(rows: readonly BannerRow[], lane: BannerLane): number {
  return rows.filter((row) => bannerLane(row.note) === lane).length;
}

export function bannerShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentBannerLanes(rows: readonly BannerRow[]): string[] {
  return bannerLanes(rows).map((line) => line.lane);
}

export function readHiddenBanners(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedBanners(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleBanner(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleBannerReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkBannerReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleBannerLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleBanners(
  rows: readonly BannerRow[],
  lane: string,
  hue: string,
  query: string,
  review: BannerReview,
  reviewed: readonly string[],
  shape: BannerShape,
): BannerRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (bannerState(row.note) === "") return false;
    const found = bannerLane(row.note);
    const hueName = bannerHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${bannerText(row.note)} ${bannerStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "quay" && found !== "quay") return false;
    if (shape === "loft" && found !== "loft") return false;
    if (shape === "hall" && found !== "hall") return false;
    if (shape === "closet" && found !== "closet") return false;
    if (shape === "pier" && found !== "pier") return false;
    if (shape === "wide" && !bannerWide(row.note)) return false;
    if (shape === "notch" && !bannerNotch(row.note)) return false;
    if (shape === "leap" && !bannerLeap(row.note)) return false;
    if (shape === "slash" && !bannerSlash(row.note)) return false;
    if (shape === "twin" && !bannerTwin(row.note)) return false;
    if (shape === "known" && !bannerKnown(row.note)) return false;
    if (shape === "echo" && !bannerEcho(row.note)) return false;
    return true;
  });
}

export function bannerCopy(raw: BannerValue): string {
  return [bannerStamp(raw), bannerLane(raw), bannerHue(raw)].filter(Boolean).join(" ");
}

export function bannerLanesCsv(rows: readonly BannerRow[]): string {
  const lines = ["lane,count"];
  for (const line of bannerLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function bannerRowsCsv(rows: readonly BannerRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (bannerState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(bannerText(row.note)),
      bannerStamp(row.note),
      bannerLane(row.note),
      bannerHue(row.note),
      String(bannerStep(row.note)),
      bannerEcho(row.note) ? "1" : "0",
      bannerWide(row.note) ? "1" : "0",
      bannerNotch(row.note) ? "1" : "0",
      bannerLeap(row.note) ? "1" : "0",
      bannerSlash(row.note) ? "1" : "0",
      bannerTwin(row.note) ? "1" : "0",
      bannerKnown(row.note) ? "1" : "0",
      bannerCap(row.note) ? "1" : "0",
      bannerTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
