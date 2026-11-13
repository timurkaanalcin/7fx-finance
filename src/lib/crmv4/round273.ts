/**
 * Theodolite circles for a survey follow-up book, and tier plates already stored as accountType.
 * Stations are zenith, transit, azimuth, and nadir. Limbs are circle, vernier, and clamp.
 * Arcs are 15, 45, or 90 degrees. Beads are 2, 4, 8, or 16.
 * STANDARD is a nave and VIP is a loft. A separator is a stile.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_theodolite_circle (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   surveyor text not null default '',
 *   station text not null default '',
 *   finish text not null default '',
 *   limb text not null default '',
 *   arc_deg integer,
 *   bead_no integer not null default 2,
 *   tags text not null default '',
 *   clamped boolean not null default false,
 *   benched boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_tier_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_tier_review (
 *   trader_id text primary key
 * );
 */

export const THD_KEY = "crmv4-theodolite-circle";
export const THD_VIEW_KEY = "crmv4-theodolite-views";
export const THD_DENSITY_KEY = "crmv4-theodolite-density";
export const TIR_KEY = "crmv4-tier-hide";
export const TIR_REVIEW_KEY = "crmv4-tier-review";

export const THEODOLITE_STATIONS = ["zenith", "transit", "azimuth", "nadir"] as const;

export type TheodoliteStation = (typeof THEODOLITE_STATIONS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type LimbName = "blank" | "circle" | "vernier" | "clamp";

export type CircleTray = "field" | "bench" | "case";

export type CircleDensity = "airy" | "tight";

export type CircleSort = "station" | "surveyor";

export type TheodoliteCircle = {
  id: string;
  title: string;
  note: string;
  surveyor: string;
  station: string;
  arc: number | null;
  finish: string;
  limb: string;
  bead: number;
  tags: string[];
  clamped: boolean;
  benched: boolean;
  cased: boolean;
  flagged: boolean;
  audit: string;
};

export type CircleView = {
  id: string;
  name: string;
  tray: CircleTray;
  query: string;
  surveyor: string;
  finish: string;
  limb: string;
  station: string;
  arc: string;
  bead: string;
};

export type CircleCounts = {
  field: number;
  bench: number;
  case: number;
  clamped: number;
  keen: number;
  still: number;
  soon: number;
  bead: number;
  house: number;
  arc: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
};

export type TierLane = "" | "nave" | "loft" | "study" | "closet" | "stile";

export type TierHue = "" | "ivory" | "graphite" | "champagne";

export type TierState = "" | "clear" | "set";

export type TierShape = "all" | "nave" | "loft" | "study" | "closet" | "stile" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo";

export type TierReview = "all" | "reviewed" | "fresh";

export type TierValue = string | { accountType?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type TierRow = { id: string; label: string; note: TierValue };

export type TierLaneLine = { lane: string; count: number };

export const ROUND273_FEATURES = [
  "save",
  "note",
  "trays",
  "clamp",
  "arc",
  "case",
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
  "fair-surveyor",
  "viewer",
  "suggest",
  "sla",
  "tier",
  "tier-csv",
] as const;

const AUDITS = ["save", "edit", "note", "limb", "clamp", "unclamp", "bench", "resume", "case", "open", "finish", "tag", "bead", "arc", "narrow", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const LIMBS = ["circle", "vernier", "clamp"] as const;

const ARC_CYCLE = [15, 45, 90] as const;

const BEAD_CYCLE = [2, 4, 8, 16] as const;

const KEEN = new Set(["azimuth", "nadir"]);

const STILL = new Set(["zenith", "transit"]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const DAWN = new Set(["zenith"]);

const LANE_ORDER = ["nave", "loft", "study", "closet", "stile"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["standard", "vip", "pro", "demo"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 32;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CircleTray {
  return raw === "bench" || raw === "case" ? raw : "field";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function limbName(raw: unknown): Exclude<LimbName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LIMBS as readonly string[]).includes(text) ? (text as Exclude<LimbName, "blank">) : "";
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

function inTray(card: TheodoliteCircle, tray: CircleTray): boolean {
  if (tray === "bench") return card.benched && !card.cased;
  if (tray === "case") return card.cased;
  return !card.benched && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return THEODOLITE_STATIONS.indexOf(station as TheodoliteStation);
}

function beadIndex(bead: number): number {
  return BEAD_CYCLE.indexOf(bead as (typeof BEAD_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function stationOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (THEODOLITE_STATIONS as readonly string[]).includes(text) ? text : "";
}

/** Arc is 15, 45, or 90 degrees. Anything else stays blank. */
export function theodoliteArc(raw: unknown): 15 | 45 | 90 | null {
  const value = Number(clip(raw, 2));
  return (ARC_CYCLE as readonly number[]).includes(value) ? (value as 15 | 45 | 90) : null;
}

/** Bead is 2, 4, 8, or 16. Anything else stays blank. */
export function theodoliteBead(raw: unknown): 2 | 4 | 8 | 16 | null {
  const value = Number(clip(raw, 2));
  return (BEAD_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 8 | 16) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is IVORY, GRAPHITE, or CHAMPAGNE. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Limb is circle, vernier, or clamp. A blank limb stays blank. */
export function limbOf(raw: unknown): string {
  return limbName(raw);
}

export function keenStation(station: unknown): boolean {
  return KEEN.has(clip(station, 12).toLowerCase());
}

export function stillStation(station: unknown): boolean {
  return STILL.has(clip(station, 12).toLowerCase());
}

/** Dawn is zenith. Noon is transit. Dusk is azimuth. Night is nadir. */
export function stationBand(station: unknown): string {
  const text = stationOf(station);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "transit") return "noon";
  if (text === "azimuth") return "dusk";
  return "night";
}

/** Signed distance from the circle station to the desk station. */
export function stationGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(stationOf(from));
  const right = stationIndex(stationOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE.has(finishOf(finish));
}

export function activeStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return stationOf(text) || "all";
}

export function activeArc(raw: unknown): string {
  const arc = theodoliteArc(raw);
  return arc === null ? "all" : String(arc);
}

export function activeLimb(raw: unknown, allow: readonly string[]): string {
  const text = limbOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const bead = theodoliteBead(raw);
  return bead === null ? "all" : String(bead);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveTheodoliteFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly TheodoliteCircle[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "field") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "GRAPHITE";
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

/** Before six, suggest fifteen degrees. Through the afternoon, forty-five. Evening asks for ninety. Saved arcs win when any exist. */
export function suggestArc(cards: readonly TheodoliteCircle[], hour: number): 15 | 45 | 90 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "field") || card.arc === null) continue;
    counts.set(card.arc, (counts.get(card.arc) || 0) + 1);
  }
  let best: 15 | 45 | 90 | null = null;
  let score = 0;
  for (const arc of ARC_CYCLE) {
    const count = counts.get(arc) || 0;
    if (count > score) {
      best = arc;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 15;
  if (hour < 16) return 45;
  return 90;
}

/** Before eight, suggest zenith. The rest of the day suggests azimuth. */
export function suggestStation(hour: number): TheodoliteStation {
  return hour < 8 ? "zenith" : "azimuth";
}

/** The surveyor with the fewest field unclamped circles. A tie keeps the roster order. */
export function fairSurveyor(cards: readonly TheodoliteCircle[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "field") && !card.clamped);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.surveyor.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readCircles(raw: unknown): TheodoliteCircle[] {
  if (!Array.isArray(raw)) return [];
  const out: TheodoliteCircle[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TheodoliteCircle>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      surveyor: clip(row.surveyor, 24),
      station: stationOf(row.station),
      arc: theodoliteArc(row.arc),
      finish: finishOf(row.finish),
      limb: limbOf(row.limb),
      bead: theodoliteBead(row.bead) ?? 2,
      tags: tagsOf(row.tags),
      clamped: row.clamped === true,
      benched: row.benched === true,
      cased: row.cased === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addCircle(
  cards: readonly TheodoliteCircle[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    surveyor?: string;
    station?: string;
    arc?: unknown;
    finish?: string;
    limb?: string;
    bead?: unknown;
    tags?: string;
  },
): TheodoliteCircle[] {
  const current = readCircles(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: TheodoliteCircle = {
    id,
    title,
    note: noteOf(card.note),
    surveyor: clip(card.surveyor, 24),
    station: stationOf(card.station),
    arc: theodoliteArc(card.arc),
    finish: finishOf(card.finish),
    limb: limbOf(card.limb),
    bead: theodoliteBead(card.bead) ?? 2,
    tags: tagsOf(card.tags),
    clamped: false,
    benched: false,
    cased: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly TheodoliteCircle[], id: string, change: (card: TheodoliteCircle) => TheodoliteCircle): TheodoliteCircle[] {
  return readCircles(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly TheodoliteCircle[], ids: readonly string[], change: (card: TheodoliteCircle) => TheodoliteCircle): TheodoliteCircle[] {
  const picked = new Set(ids);
  return readCircles(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editCircle(cards: readonly TheodoliteCircle[], id: string, title: string): TheodoliteCircle[] {
  const next = lineOf(title);
  if (!next) return readCircles(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCircleNote(cards: readonly TheodoliteCircle[], id: string, note: string): TheodoliteCircle[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setCircleClamp(cards: readonly TheodoliteCircle[], id: string, clamped: boolean): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => (card.clamped === clamped ? card : { ...card, clamped, audit: clamped ? "clamp" : "unclamp" }));
}

export function setCircleBench(cards: readonly TheodoliteCircle[], id: string, benched: boolean): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => (card.benched === benched ? card : { ...card, benched, cased: benched ? false : card.cased, audit: benched ? "bench" : "resume" }));
}

export function setCircleCase(cards: readonly TheodoliteCircle[], id: string, cased: boolean): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, benched: cased ? false : card.benched, audit: cased ? "case" : "open" }));
}

export function setCircleStar(cards: readonly TheodoliteCircle[], id: string, flagged: boolean): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setCircleFinish(cards: readonly TheodoliteCircle[], id: string, finish: unknown): TheodoliteCircle[] {
  const next = finishOf(finish);
  if (!next) return readCircles(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Limb steps circle, vernier, clamp, then circle again. A blank limb starts at circle. */
export function cycleLimb(cards: readonly TheodoliteCircle[], id: string): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => {
    const at = LIMBS.indexOf(card.limb as (typeof LIMBS)[number]);
    const next = at < 0 ? LIMBS[0] : LIMBS[(at + 1) % LIMBS.length];
    return next === card.limb ? card : { ...card, limb: next, audit: "limb" };
  });
}

export function addCircleTag(cards: readonly TheodoliteCircle[], id: string, tag: string): TheodoliteCircle[] {
  const next = tagsOf(tag)[0];
  if (!next) return readCircles(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank arc becomes 15, 15 becomes 45, and 45 becomes 90. An arc of 90 stays. */
export function widenArc(cards: readonly TheodoliteCircle[], id: string): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => {
    if (card.arc === 90) return card;
    const next = card.arc === 45 ? 90 : card.arc === 15 ? 45 : 15;
    return { ...card, arc: next, audit: "arc" };
  });
}

/** A blank arc becomes 90, 90 becomes 45, and 45 becomes 15. An arc of 15 stays. */
export function narrowArc(cards: readonly TheodoliteCircle[], id: string): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => {
    if (card.arc === 15) return card;
    const next = card.arc === 45 ? 15 : card.arc === 90 ? 45 : 90;
    return { ...card, arc: next, audit: "narrow" };
  });
}

export function raiseBead(cards: readonly TheodoliteCircle[], id: string): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => {
    const at = beadIndex(card.bead);
    if (at < 0) return { ...card, bead: 2, audit: "bead" };
    if (at === BEAD_CYCLE.length - 1) return card;
    return { ...card, bead: BEAD_CYCLE[at + 1], audit: "bead" };
  });
}

export function lowerBead(cards: readonly TheodoliteCircle[], id: string): TheodoliteCircle[] {
  return mapCard(cards, id, (card) => {
    const at = beadIndex(card.bead);
    if (at <= 0) return card;
    return { ...card, bead: BEAD_CYCLE[at - 1], audit: "bead" };
  });
}

export function bulkCircleClamp(cards: readonly TheodoliteCircle[], ids: readonly string[]): TheodoliteCircle[] {
  return touchIds(cards, ids, (card) => ({ ...card, clamped: true, audit: "clamp" }));
}

export function bulkCircleCase(cards: readonly TheodoliteCircle[], ids: readonly string[]): TheodoliteCircle[] {
  return touchIds(cards, ids, (card) => ({ ...card, cased: true, benched: false, audit: "case" }));
}

export function bulkCircleClampLimb(cards: readonly TheodoliteCircle[], ids: readonly string[]): TheodoliteCircle[] {
  return touchIds(cards, ids, (card) => ({ ...card, limb: "clamp", audit: "limb" }));
}

export function bulkCircleChampagne(cards: readonly TheodoliteCircle[], ids: readonly string[]): TheodoliteCircle[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkCircleTag(cards: readonly TheodoliteCircle[], ids: readonly string[], tag: string): TheodoliteCircle[] {
  const next = tagsOf(tag)[0];
  if (!next) return readCircles(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number, change: (list: readonly TheodoliteCircle[], id: string) => TheodoliteCircle[]): TheodoliteCircle[] {
  const id = ids[index];
  return id ? change(cards, id) : readCircles(cards);
}

export function widenArcFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  return focused(cards, ids, index, widenArc);
}

export function narrowArcFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  return focused(cards, ids, index, narrowArc);
}

export function limbFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  return focused(cards, ids, index, cycleLimb);
}

export function raiseBeadFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  return focused(cards, ids, index, raiseBead);
}

export function lowerBeadFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  return focused(cards, ids, index, lowerBead);
}

export function clampCircleFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  const id = ids[index];
  if (!id) return readCircles(cards);
  const card = readCircles(cards).find((item) => item.id === id);
  return card ? setCircleClamp(cards, id, !card.clamped) : readCircles(cards);
}

export function benchCircleFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  const id = ids[index];
  if (!id) return readCircles(cards);
  const card = readCircles(cards).find((item) => item.id === id);
  return card ? setCircleBench(cards, id, !card.benched) : readCircles(cards);
}

export function starCircleFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number): TheodoliteCircle[] {
  const id = ids[index];
  if (!id) return readCircles(cards);
  const card = readCircles(cards).find((item) => item.id === id);
  return card ? setCircleStar(cards, id, !card.flagged) : readCircles(cards);
}

export function tagCircleFocused(cards: readonly TheodoliteCircle[], ids: readonly string[], index: number, tag: string): TheodoliteCircle[] {
  const id = ids[index];
  return id ? addCircleTag(cards, id, tag) : readCircles(cards);
}

export function readCircleViews(raw: unknown): CircleView[] {
  if (!Array.isArray(raw)) return [];
  const out: CircleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CircleView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      surveyor: clip(row.surveyor, 24),
      finish: activeFinish(row.finish),
      limb: activeLimb(row.limb, LIMBS),
      station: activeStation(row.station),
      arc: activeArc(row.arc),
      bead: activeBead(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCircleView(
  views: readonly CircleView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    surveyor?: string;
    finish?: string;
    limb?: string;
    station?: string;
    arc?: string;
    bead?: string;
  },
): CircleView[] {
  const current = readCircleViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: CircleView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    surveyor: clip(view.surveyor, 24),
    finish: activeFinish(view.finish),
    limb: activeLimb(view.limb, LIMBS),
    station: activeStation(view.station),
    arc: activeArc(view.arc),
    bead: activeBead(view.bead),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCircleView(views: readonly CircleView[], id: string): CircleView[] {
  return readCircleViews(views).filter((view) => view.id !== id);
}

export function circleDensity(raw: unknown): CircleDensity {
  return raw === "tight" ? "tight" : "airy";
}

/** A circle more than two stations behind the desk, at bead 2, is late. */
export function lateCircle(card: TheodoliteCircle, deskStation: unknown): boolean {
  const gap = stationGap(card.station, deskStation);
  return card.bead === 2 && gap !== null && gap > 2;
}

export function idleCircle(card: TheodoliteCircle): boolean {
  return card.limb === "circle" && stillStation(card.station) && card.bead === 2;
}

export function briskCircle(card: TheodoliteCircle): boolean {
  return card.bead === 16 && card.limb === "clamp" && keenStation(card.station);
}

export function restingCircle(card: TheodoliteCircle): boolean {
  return card.arc === 90 && card.limb === "vernier" && card.station === "nadir";
}

/** A fifteen-degree field sight on a keen station is overdue unless the circle is clamped. */
export function overdueCircle(card: TheodoliteCircle): boolean {
  return card.arc === 15 && keenStation(card.station) && !card.clamped;
}

export function visibleCircles(
  cards: readonly TheodoliteCircle[],
  tray: CircleTray,
  query: string,
  surveyor: string,
  finish: string,
  limb: string,
  station: string,
  arc: string,
  bead: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): TheodoliteCircle[] {
  const text = query.trim().toLowerCase();
  const surveyorOn = surveyor === "all" ? "" : surveyor.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const limbOn = limb === "all" ? "" : limbOf(limb);
  const stationOn = station === "all" ? "" : activeStation(station);
  const arcOn = arc === "all" ? "" : activeArc(arc);
  const beadOn = bead === "all" ? "" : activeBead(bead);
  return readCircles(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (surveyorOn && card.surveyor.toLowerCase() !== surveyorOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (limbOn && card.limb !== limbOn) return false;
    if (stationOn === "keen" && !keenStation(card.station)) return false;
    if (stationOn === "still" && !stillStation(card.station)) return false;
    if (stationOn && stationOn !== "keen" && stationOn !== "still" && card.station !== stationOn) return false;
    if (arcOn && String(card.arc ?? "") !== arcOn) return false;
    if (beadOn && String(card.bead) !== beadOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenStation(card.station)) return false;
    if (stillOnly && !stillStation(card.station)) return false;
    return true;
  });
}

export function sortCircles(cards: readonly TheodoliteCircle[], sort: CircleSort): TheodoliteCircle[] {
  return cards.slice().sort((a, b) => {
    if (a.clamped !== b.clamped) return a.clamped ? -1 : 1;
    if (sort === "surveyor") {
      const surveyor = a.surveyor.localeCompare(b.surveyor);
      if (surveyor) return surveyor;
    }
    const station = (stationIndex(a.station) < 0 ? 99 : stationIndex(a.station)) - (stationIndex(b.station) < 0 ? 99 : stationIndex(b.station));
    if (station) return station;
    return a.title.localeCompare(b.title);
  });
}

export function circleCounts(cards: readonly TheodoliteCircle[], shown: readonly TheodoliteCircle[], deskStation: unknown): CircleCounts {
  const open = cards.filter((card) => inTray(card, "field"));
  return {
    field: open.length,
    bench: cards.filter((card) => inTray(card, "bench")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    clamped: open.filter((card) => card.clamped).length,
    keen: open.filter((card) => keenStation(card.station)).length,
    still: open.filter((card) => stillStation(card.station)).length,
    soon: open.filter((card) => card.arc === 15).length,
    bead: open.reduce((sum, card) => sum + card.bead, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    arc: open.filter((card) => card.arc !== null).length,
    matched: shown.filter((card) => card.station && card.station === stationOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleCircle(card)).length,
    brisk: open.filter((card) => briskCircle(card)).length,
    resting: open.filter((card) => restingCircle(card)).length,
    overdue: open.filter((card) => overdueCircle(card)).length,
  };
}

export function clashStationCount(cards: readonly TheodoliteCircle[]): number {
  const open = cards.filter((card) => inTray(card, "field") && card.station);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.station === card.station && other.bead === card.bead)).length;
}

export function neighborBeadCount(cards: readonly TheodoliteCircle[]): number {
  const open = cards.filter((card) => inTray(card, "field") && beadIndex(card.bead) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(beadIndex(other.bead) - beadIndex(card.bead));
    const ring = Math.min(gap, BEAD_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestSurveyor(cards: readonly TheodoliteCircle[]): string {
  const open = cards.filter((card) => inTray(card, "field") && card.surveyor);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.surveyor.toLowerCase() === card.surveyor.toLowerCase()).length;
    if (count > score) {
      best = card.surveyor;
      score = count;
    }
  }
  return best;
}

export function reminderCircles(cards: readonly TheodoliteCircle[]): TheodoliteCircle[] {
  return cards.filter((card) => inTray(card, "field") && (card.arc === 15 || card.arc === 45));
}

export function idleCircles(cards: readonly TheodoliteCircle[]): TheodoliteCircle[] {
  return cards.filter((card) => inTray(card, "field") && idleCircle(card));
}

export function circleTimeline(cards: readonly TheodoliteCircle[]): { bead: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "field"));
  return BEAD_CYCLE.map((bead) => ({ bead, titles: open.filter((card) => card.bead === bead).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function circleBars(cards: readonly TheodoliteCircle[]): { station: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "field"));
  return THEODOLITE_STATIONS.map((station) => ({ station, count: open.filter((card) => card.station === station).length }));
}

export function circleSurveyors(cards: readonly TheodoliteCircle[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.surveyor || out.some((item) => item.toLowerCase() === card.surveyor.toLowerCase())) continue;
    out.push(card.surveyor);
  }
  return out;
}

export function circleCopy(card: TheodoliteCircle): string {
  return [card.title, card.surveyor, card.station, card.finish, card.limb, card.arc ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function circleShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function circleCsv(cards: readonly TheodoliteCircle[], deskStation: unknown): string {
  const lines = ["title,surveyor,station,finish,limb,arc,bead,tags,clamped,benched,cased,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,audit,note"];
  for (const card of readCircles(cards)) {
    const gap = stationGap(card.station, deskStation);
    lines.push([
      csvCell(card.title),
      csvCell(card.surveyor),
      card.station,
      card.finish,
      card.limb,
      card.arc === null ? "" : String(card.arc),
      String(card.bead),
      card.tags.join(" "),
      card.clamped ? "1" : "0",
      card.benched ? "1" : "0",
      card.cased ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCircle(card, deskStation) ? "1" : "0",
      idleCircle(card) ? "1" : "0",
      keenStation(card.station) ? "1" : "0",
      stillStation(card.station) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      stationBand(card.station),
      briskCircle(card) ? "1" : "0",
      restingCircle(card) ? "1" : "0",
      overdueCircle(card) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function tierRecord(raw: TierValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: TierValue): boolean {
  const row = tierRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type TierParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; score: number; seps: number };

function tierText(raw: TierValue): string {
  if (hasBlocked(raw)) return "";
  const row = tierRecord(raw);
  if (row && !("accountType" in row) && !("code" in row)) return "";
  return row ? clip(row.accountType ?? row.code, 32) : clip(raw, 32);
}

function tierParts(raw: TierValue): TierParts | null {
  const text = tierText(raw);
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
    score: (text.match(/_/g) || []).length,
    seps,
  };
}

/** A blocked money field clears the plate. A real account type is set. A blank or broken type is clear. */
export function tierState(raw: TierValue): TierState {
  if (hasBlocked(raw)) return "";
  const row = tierRecord(raw);
  if (row && !("accountType" in row) && !("code" in row)) return "";
  return tierParts(raw) ? "set" : "clear";
}

/** STANDARD is a nave, VIP is a loft, DEMO is a closet, a separator is a stile, and a plain word is a study. */
export function tierLane(raw: TierValue): TierLane {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (key === "standard") return "nave";
  if (key === "vip") return "loft";
  if (key === "demo") return "closet";
  if (parts.seps >= 1) return "stile";
  return "study";
}

/** The first two letters. */
export function tierStamp(raw: TierValue): string {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return parts ? parts.letters.slice(0, 2).toUpperCase() : "";
}

/** STANDARD is champagne, VIP is graphite, DEMO is ivory, and other types follow the last letter. */
export function tierHue(raw: TierValue): TierHue {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  if (!parts) return "";
  const lane = tierLane(raw);
  if (lane === "nave") return "champagne";
  if (lane === "loft") return "graphite";
  if (lane === "closet") return "ivory";
  const code = parts.letters[parts.letters.length - 1].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function tierTwin(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function tierWide(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function tierNotch(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function tierEcho(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function tierLeap(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && parts.letters.length === 4);
}

export function tierSlash(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function tierKnown(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function tierCap(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

export function tierTail(raw: TierValue): boolean {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return Boolean(parts && /[aeiou]$/i.test(parts.letters));
}

export function tierScore(raw: TierValue): number {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return parts ? parts.score : 0;
}

export function tierStep(raw: TierValue): number {
  const parts = tierState(raw) === "set" ? tierParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function tierLanes(rows: readonly TierRow[]): TierLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = tierLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTier(rows: readonly TierRow[]): string {
  const bars = tierLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingTierHue(rows: readonly TierRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = tierHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedTierCount(rows: readonly TierRow[]): number {
  const marks = rows.map((row) => tierStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneTierCount(rows: readonly TierRow[], lane: TierLane): number {
  return rows.filter((row) => tierLane(row.note) === lane).length;
}

export function tierShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTierLanes(rows: readonly TierRow[]): string[] {
  return tierLanes(rows).map((line) => line.lane);
}

export function readHiddenTiers(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTiers(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTier(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTierReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTierReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTierLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleTiers(
  rows: readonly TierRow[],
  lane: string,
  hue: string,
  query: string,
  review: TierReview,
  reviewed: readonly string[],
  shape: TierShape,
): TierRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (tierState(row.note) === "") return false;
    const found = tierLane(row.note);
    const hueName = tierHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${tierText(row.note)} ${tierStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "nave" && found !== "nave") return false;
    if (shape === "loft" && found !== "loft") return false;
    if (shape === "study" && found !== "study") return false;
    if (shape === "closet" && found !== "closet") return false;
    if (shape === "stile" && found !== "stile") return false;
    if (shape === "wide" && !tierWide(row.note)) return false;
    if (shape === "notch" && !tierNotch(row.note)) return false;
    if (shape === "leap" && !tierLeap(row.note)) return false;
    if (shape === "slash" && !tierSlash(row.note)) return false;
    if (shape === "twin" && !tierTwin(row.note)) return false;
    if (shape === "known" && !tierKnown(row.note)) return false;
    if (shape === "echo" && !tierEcho(row.note)) return false;
    return true;
  });
}

export function tierCopy(raw: TierValue): string {
  return [tierStamp(raw), tierLane(raw), tierHue(raw)].filter(Boolean).join(" ");
}

export function tierLanesCsv(rows: readonly TierRow[]): string {
  const lines = ["lane,count"];
  for (const line of tierLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function tierRowsCsv(rows: readonly TierRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,echo,wide,notch,leap,slash,twin,known,cap,tail,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (tierState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(tierText(row.note)),
      tierStamp(row.note),
      tierLane(row.note),
      tierHue(row.note),
      String(tierStep(row.note)),
      tierEcho(row.note) ? "1" : "0",
      tierWide(row.note) ? "1" : "0",
      tierNotch(row.note) ? "1" : "0",
      tierLeap(row.note) ? "1" : "0",
      tierSlash(row.note) ? "1" : "0",
      tierTwin(row.note) ? "1" : "0",
      tierKnown(row.note) ? "1" : "0",
      tierCap(row.note) ? "1" : "0",
      tierTail(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
