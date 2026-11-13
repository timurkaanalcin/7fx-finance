/**
 * Armillary rings for a sphere book kept in this browser, and city plates read the last city already stored on the account.
 * Rings are equinoctial, solstitial, meridian, and colure. Inks are pearl, gilt, and slate.
 * Degrees are 15, 45, or 75. Beads are 3, 6, or 9.
 * London, Paris, Berlin, Istanbul, Moscow, Dubai, New York, Ankara, and Vienna are house cities.
 * A digit is a ward. A hyphen is a link. Three words are a court. Two words are a span.
 * All capitals are a seal. A vowel start is open. Twelve letters or more are long. Four or fewer are short.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_armillary_ring (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   ring text not null default '',
 *   finish text not null default '',
 *   ink text not null default '',
 *   degree_no integer,
 *   bead_no integer not null default 3,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_city_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_city_review (
 *   trader_id text primary key
 * );
 */

export const AML_KEY = "crmv4-armillary-ring";
export const AML_VIEW_KEY = "crmv4-armillary-views";
export const AML_DENSITY_KEY = "crmv4-armillary-density";
export const CTY_KEY = "crmv4-city-hide";
export const CTY_REVIEW_KEY = "crmv4-city-review";

export const ARM_RINGS = ["equinoctial", "solstitial", "meridian", "colure"] as const;

export type ArmRing = (typeof ARM_RINGS)[number];

export type ArmFinish = "blank" | "ivory" | "graphite" | "champagne";

export type ArmInk = "blank" | "pearl" | "gilt" | "slate";

export type ArmTray = "bench" | "case" | "chest";

export type ArmDensity = "air" | "tight";

export type ArmSort = "ring" | "keeper";

export type ArmillaryRing = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  ring: string;
  degree: number | null;
  finish: string;
  ink: string;
  bead: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type ArmView = {
  id: string;
  name: string;
  tray: ArmTray;
  query: string;
  keeper: string;
  finish: string;
  ink: string;
  ring: string;
  degree: string;
  bead: string;
};

export type ArmCounts = {
  bench: number;
  case: number;
  chest: number;
  logged: number;
  keen: number;
  still: number;
  soon: number;
  bead: number;
  house: number;
  degree: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  even: number;
};

export type CityLane = "" | "house" | "mark" | "link" | "court" | "span" | "seal" | "open" | "long" | "short" | "desk";

export type CityHue = "" | "ivory" | "graphite" | "champagne";

export type CityState = "" | "clear" | "set";

export type CityShape = "all" | "house" | "mark" | "link" | "court" | "span" | "seal" | "open" | "long" | "short" | "desk" | "wide" | "dash" | "leap" | "twin" | "known" | "echo" | "even" | "odd" | "space" | "digit" | "tail" | "cap";

export type CityReview = "all" | "reviewed" | "fresh";

export type CityValue = string | { lastCity?: unknown; [key: string]: unknown } | null | undefined;

export type CityRow = { id: string; label: string; note: CityValue };

export type CityLaneLine = { lane: string; count: number };

export const ROUND284_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "degree",
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "city",
  "city-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "log", "unlog", "lock", "resume", "stow", "open", "finish", "tag", "bead", "degree", "dip", "star"] as const;

const FINISHES = ["ivory", "graphite", "champagne"] as const;

const INKS = ["pearl", "gilt", "slate"] as const;

const DEGREE_CYCLE = [15, 45, 75] as const;

const BEAD_CYCLE = [3, 6, 9] as const;

const KEEN = new Set(["meridian", "colure"]);

const STILL = new Set(["equinoctial", "solstitial"]);

const HOUSE_FINISH = new Set(["GRAPHITE", "CHAMPAGNE"]);

const NOON = new Set(["solstitial"]);

const LANE_ORDER = ["house", "mark", "link", "court", "span", "seal", "open", "long", "short", "desk"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const HOUSE_CITIES = new Set(["london", "paris", "berlin", "istanbul", "moscow", "dubai", "new york", "ankara", "vienna"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ArmTray {
  return raw === "case" || raw === "chest" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<ArmFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<ArmFinish, "blank">) : "";
}

function inkName(raw: unknown): Exclude<ArmInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<ArmInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ew]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: ArmillaryRing, tray: ArmTray): boolean {
  if (tray === "case") return card.locked && !card.stowed;
  if (tray === "chest") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function ringIndex(ring: string): number {
  return ARM_RINGS.indexOf(ring as ArmRing);
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

export function ringOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (ARM_RINGS as readonly string[]).includes(text) ? text : "";
}

/** A degree is 15, 45, or 75. Anything else stays blank. */
export function armillaryDegree(raw: unknown): 15 | 45 | 75 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (DEGREE_CYCLE as readonly number[]).includes(value) ? (value as 15 | 45 | 75) : null;
}

/** A bead is 3, 6, or 9. Anything else stays blank. */
export function armillaryBead(raw: unknown): 3 | 6 | 9 | null {
  const text = clip(raw, 1);
  if (!text) return null;
  const value = Number(text);
  return (BEAD_CYCLE as readonly number[]).includes(value) ? (value as 3 | 6 | 9) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is the upper case name. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Ink is pearl, gilt, or slate. A blank ink stays blank. */
export function inkOf(raw: unknown): string {
  return inkName(raw);
}

export function keenRing(ring: unknown): boolean {
  return KEEN.has(clip(ring, 16).toLowerCase());
}

export function stillRing(ring: unknown): boolean {
  return STILL.has(clip(ring, 16).toLowerCase());
}

/** Equinoctial is dawn. Solstitial is noon. Meridian is dusk. Colure is night. */
export function ringBand(ring: unknown): string {
  const text = ringOf(ring);
  if (!text) return "";
  if (text === "equinoctial") return "dawn";
  if (NOON.has(text)) return "noon";
  if (text === "meridian") return "dusk";
  return "night";
}

/** Signed distance from one ring to the desk ring. */
export function ringGap(from: unknown, to: unknown): number | null {
  const left = ringIndex(ringOf(from));
  const right = ringIndex(ringOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_FINISH.has(finishOf(finish));
}

/** An even bead is 6. Three and nine are odd. A blank bead is not even. */
export function evenBead(bead: unknown): boolean {
  return armillaryBead(bead) === 6;
}

export function activeRing(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return ringOf(text) || "all";
}

export function activeDegree(raw: unknown): string {
  const degree = armillaryDegree(raw);
  return degree === null ? "all" : String(degree);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = inkOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBead(raw: unknown): string {
  const bead = armillaryBead(raw);
  return bead === null ? "all" : String(bead);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveArmFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly ArmillaryRing[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.finish) continue;
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

/** Before eight, suggest fifteen. Through the afternoon, forty-five. Evening asks for seventy-five. Saved degrees win when any exist. */
export function suggestDegree(cards: readonly ArmillaryRing[], hour: number): 15 | 45 | 75 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || card.degree === null) continue;
    counts.set(card.degree, (counts.get(card.degree) || 0) + 1);
  }
  let best: 15 | 45 | 75 | null = null;
  let score = 0;
  for (const degree of DEGREE_CYCLE) {
    const count = counts.get(degree) || 0;
    if (count > score) {
      best = degree;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 15;
  if (hour < 16) return 45;
  return 75;
}

/** Before nine, suggest the equinoctial ring. The rest of the day suggests the colure. */
export function suggestRing(hour: number): ArmRing {
  return hour < 9 ? "equinoctial" : "colure";
}

/** The keeper with the fewest unlogged bench rings. A tie keeps the roster order. */
export function fairKeeper(cards: readonly ArmillaryRing[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.logged);
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

export function readArmillary(raw: unknown): ArmillaryRing[] {
  if (!Array.isArray(raw)) return [];
  const out: ArmillaryRing[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArmillaryRing>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      ring: ringOf(row.ring),
      degree: armillaryDegree(row.degree),
      finish: finishOf(row.finish),
      ink: inkOf(row.ink),
      bead: armillaryBead(row.bead) ?? 3,
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

export function addArmillary(
  cards: readonly ArmillaryRing[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    ring?: string;
    degree?: unknown;
    finish?: string;
    ink?: string;
    bead?: unknown;
    tags?: string;
  },
): ArmillaryRing[] {
  const current = readArmillary(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: ArmillaryRing = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    ring: ringOf(card.ring),
    degree: armillaryDegree(card.degree),
    finish: finishOf(card.finish),
    ink: inkOf(card.ink),
    bead: armillaryBead(card.bead) ?? 3,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly ArmillaryRing[], id: string, change: (card: ArmillaryRing) => ArmillaryRing): ArmillaryRing[] {
  return readArmillary(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly ArmillaryRing[], ids: readonly string[], change: (card: ArmillaryRing) => ArmillaryRing): ArmillaryRing[] {
  const picked = new Set(ids);
  return readArmillary(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editArmillary(cards: readonly ArmillaryRing[], id: string, title: string): ArmillaryRing[] {
  const next = lineOf(title);
  if (!next) return readArmillary(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editArmillaryNote(cards: readonly ArmillaryRing[], id: string, note: string): ArmillaryRing[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setArmillaryLogged(cards: readonly ArmillaryRing[], id: string, logged: boolean): ArmillaryRing[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setArmillaryLock(cards: readonly ArmillaryRing[], id: string, locked: boolean): ArmillaryRing[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setArmillaryStow(cards: readonly ArmillaryRing[], id: string, stowed: boolean): ArmillaryRing[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setArmillaryStar(cards: readonly ArmillaryRing[], id: string, flagged: boolean): ArmillaryRing[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setArmillaryFinish(cards: readonly ArmillaryRing[], id: string, finish: unknown): ArmillaryRing[] {
  const next = finishOf(finish);
  if (!next) return readArmillary(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Ink steps pearl, gilt, slate, then pearl again. A blank ink starts at pearl. */
export function cycleInk(cards: readonly ArmillaryRing[], id: string): ArmillaryRing[] {
  return mapCard(cards, id, (card) => {
    const at = INKS.indexOf(card.ink as (typeof INKS)[number]);
    const next = at < 0 ? INKS[0] : INKS[(at + 1) % INKS.length];
    return next === card.ink ? card : { ...card, ink: next, audit: "ink" };
  });
}

export function addArmillaryTag(cards: readonly ArmillaryRing[], id: string, tag: string): ArmillaryRing[] {
  const next = tagsOf(tag)[0];
  if (!next) return readArmillary(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank degree becomes 15, 15 becomes 45, and 45 becomes 75. A degree of 75 stays. */
export function liftDegree(cards: readonly ArmillaryRing[], id: string): ArmillaryRing[] {
  return mapCard(cards, id, (card) => {
    if (card.degree === 75) return card;
    const next = card.degree === 45 ? 75 : card.degree === 15 ? 45 : 15;
    return { ...card, degree: next, audit: "degree" };
  });
}

/** A blank degree becomes 75, 75 becomes 45, and 45 becomes 15. A degree of 15 stays. */
export function dipDegree(cards: readonly ArmillaryRing[], id: string): ArmillaryRing[] {
  return mapCard(cards, id, (card) => {
    if (card.degree === 15) return card;
    const next = card.degree === 45 ? 15 : card.degree === 75 ? 45 : 75;
    return { ...card, degree: next, audit: "dip" };
  });
}

export function raiseBead(cards: readonly ArmillaryRing[], id: string): ArmillaryRing[] {
  return mapCard(cards, id, (card) => {
    const at = beadIndex(card.bead);
    if (at < 0) return { ...card, bead: 3, audit: "bead" };
    if (at === BEAD_CYCLE.length - 1) return card;
    return { ...card, bead: BEAD_CYCLE[at + 1], audit: "bead" };
  });
}

export function lowerBead(cards: readonly ArmillaryRing[], id: string): ArmillaryRing[] {
  return mapCard(cards, id, (card) => {
    const at = beadIndex(card.bead);
    if (at <= 0) return card;
    return { ...card, bead: BEAD_CYCLE[at - 1], audit: "bead" };
  });
}

export function bulkArmillaryLog(cards: readonly ArmillaryRing[], ids: readonly string[]): ArmillaryRing[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkArmillaryStow(cards: readonly ArmillaryRing[], ids: readonly string[]): ArmillaryRing[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkArmillarySlate(cards: readonly ArmillaryRing[], ids: readonly string[]): ArmillaryRing[] {
  return touchIds(cards, ids, (card) => ({ ...card, ink: "slate", audit: "ink" }));
}

export function bulkArmillaryChampagne(cards: readonly ArmillaryRing[], ids: readonly string[]): ArmillaryRing[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkArmillaryTag(cards: readonly ArmillaryRing[], ids: readonly string[], tag: string): ArmillaryRing[] {
  const next = tagsOf(tag)[0];
  if (!next) return readArmillary(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number, change: (list: readonly ArmillaryRing[], id: string) => ArmillaryRing[]): ArmillaryRing[] {
  const id = ids[index];
  return id ? change(cards, id) : readArmillary(cards);
}

export function liftDegreeFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  return focused(cards, ids, index, liftDegree);
}

export function dipDegreeFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  return focused(cards, ids, index, dipDegree);
}

export function inkFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  return focused(cards, ids, index, cycleInk);
}

export function raiseBeadFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  return focused(cards, ids, index, raiseBead);
}

export function lowerBeadFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  return focused(cards, ids, index, lowerBead);
}

export function logArmillaryFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  const id = ids[index];
  if (!id) return readArmillary(cards);
  const card = readArmillary(cards).find((item) => item.id === id);
  return card ? setArmillaryLogged(cards, id, !card.logged) : readArmillary(cards);
}

export function lockArmillaryFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  const id = ids[index];
  if (!id) return readArmillary(cards);
  const card = readArmillary(cards).find((item) => item.id === id);
  return card ? setArmillaryLock(cards, id, !card.locked) : readArmillary(cards);
}

export function starArmillaryFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number): ArmillaryRing[] {
  const id = ids[index];
  if (!id) return readArmillary(cards);
  const card = readArmillary(cards).find((item) => item.id === id);
  return card ? setArmillaryStar(cards, id, !card.flagged) : readArmillary(cards);
}

export function tagArmillaryFocused(cards: readonly ArmillaryRing[], ids: readonly string[], index: number, tag: string): ArmillaryRing[] {
  const id = ids[index];
  return id ? addArmillaryTag(cards, id, tag) : readArmillary(cards);
}

export function readArmillaryViews(raw: unknown): ArmView[] {
  if (!Array.isArray(raw)) return [];
  const out: ArmView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArmView>;
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
      ink: activeInk(row.ink, INKS),
      ring: activeRing(row.ring),
      degree: activeDegree(row.degree),
      bead: activeBead(row.bead),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addArmillaryView(
  views: readonly ArmView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    finish?: string;
    ink?: string;
    ring?: string;
    degree?: string;
    bead?: string;
  },
): ArmView[] {
  const current = readArmillaryViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: ArmView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    finish: activeFinish(view.finish),
    ink: activeInk(view.ink, INKS),
    ring: activeRing(view.ring),
    degree: activeDegree(view.degree),
    bead: activeBead(view.bead),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropArmillaryView(views: readonly ArmView[], id: string): ArmView[] {
  return readArmillaryViews(views).filter((view) => view.id !== id);
}

export function armillaryDensity(raw: unknown): ArmDensity {
  return raw === "tight" ? "tight" : "air";
}

/** A ring more than one step behind the desk, on bead 3, is late. */
export function lateArmillary(card: ArmillaryRing, deskRing: unknown): boolean {
  const gap = ringGap(card.ring, deskRing);
  return card.bead === 3 && gap !== null && gap > 1;
}

export function idleArmillary(card: ArmillaryRing): boolean {
  return card.ink === "pearl" && stillRing(card.ring) && card.bead === 3;
}

export function briskArmillary(card: ArmillaryRing): boolean {
  return card.bead === 9 && card.ink === "gilt" && keenRing(card.ring);
}

export function restingArmillary(card: ArmillaryRing): boolean {
  return card.degree === 75 && card.ink === "slate" && card.ring === "colure";
}

/** A degree of fifteen on a keen ring is overdue unless the ring is logged. */
export function overdueArmillary(card: ArmillaryRing): boolean {
  return card.degree === 15 && keenRing(card.ring) && !card.logged;
}

export function visibleArmillary(
  cards: readonly ArmillaryRing[],
  tray: ArmTray,
  query: string,
  keeper: string,
  finish: string,
  ink: string,
  ring: string,
  degree: string,
  bead: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): ArmillaryRing[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const inkOn = ink === "all" ? "" : inkOf(ink);
  const ringOn = ring === "all" ? "" : activeRing(ring);
  const degreeOn = degree === "all" ? "" : activeDegree(degree);
  const beadOn = bead === "all" ? "" : activeBead(bead);
  return readArmillary(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (inkOn && card.ink !== inkOn) return false;
    if (ringOn === "keen" && !keenRing(card.ring)) return false;
    if (ringOn === "still" && !stillRing(card.ring)) return false;
    if (ringOn && ringOn !== "keen" && ringOn !== "still" && card.ring !== ringOn) return false;
    if (degreeOn && String(card.degree ?? "") !== degreeOn) return false;
    if (beadOn && String(card.bead) !== beadOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenRing(card.ring)) return false;
    if (stillOnly && !stillRing(card.ring)) return false;
    return true;
  });
}

export function sortArmillary(cards: readonly ArmillaryRing[], sort: ArmSort): ArmillaryRing[] {
  return cards.slice().sort((a, b) => {
    if (a.logged !== b.logged) return a.logged ? -1 : 1;
    if (sort === "keeper") {
      const helm = a.keeper.localeCompare(b.keeper);
      if (helm) return helm;
    }
    const ring = (ringIndex(a.ring) < 0 ? 99 : ringIndex(a.ring)) - (ringIndex(b.ring) < 0 ? 99 : ringIndex(b.ring));
    if (ring) return ring;
    return a.title.localeCompare(b.title);
  });
}

export function armillaryCounts(cards: readonly ArmillaryRing[], shown: readonly ArmillaryRing[], deskRing: unknown): ArmCounts {
  const open = cards.filter((card) => inTray(card, "bench"));
  return {
    bench: open.length,
    case: cards.filter((card) => inTray(card, "case")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    logged: open.filter((card) => card.logged).length,
    keen: open.filter((card) => keenRing(card.ring)).length,
    still: open.filter((card) => stillRing(card.ring)).length,
    soon: open.filter((card) => card.degree === 15).length,
    bead: open.reduce((sum, card) => sum + card.bead, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    degree: open.filter((card) => card.degree !== null).length,
    matched: shown.filter((card) => card.ring && card.ring === ringOf(deskRing)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleArmillary(card)).length,
    brisk: open.filter((card) => briskArmillary(card)).length,
    resting: open.filter((card) => restingArmillary(card)).length,
    overdue: open.filter((card) => overdueArmillary(card)).length,
    even: open.filter((card) => evenBead(card.bead)).length,
  };
}

export function clashRingCount(cards: readonly ArmillaryRing[]): number {
  const open = cards.filter((card) => inTray(card, "bench") && card.ring);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ring === card.ring && other.bead === card.bead)).length;
}

export function neighborArmCount(cards: readonly ArmillaryRing[]): number {
  const open = cards.filter((card) => inTray(card, "bench") && beadIndex(card.bead) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(beadIndex(other.bead) - beadIndex(card.bead));
    const ring = Math.min(gap, BEAD_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly ArmillaryRing[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && card.keeper);
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

export function reminderArmillary(cards: readonly ArmillaryRing[]): ArmillaryRing[] {
  return cards.filter((card) => inTray(card, "bench") && (card.degree === 15 || card.degree === 45));
}

export function idleArmillaryList(cards: readonly ArmillaryRing[]): ArmillaryRing[] {
  return cards.filter((card) => inTray(card, "bench") && idleArmillary(card));
}

export function armillaryTimeline(cards: readonly ArmillaryRing[]): { bead: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return BEAD_CYCLE.map((bead) => ({ bead, titles: open.filter((card) => card.bead === bead).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function armillaryBars(cards: readonly ArmillaryRing[]): { ring: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return ARM_RINGS.map((ring) => ({ ring, count: open.filter((card) => card.ring === ring).length }));
}

export function armillaryKeepers(cards: readonly ArmillaryRing[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function armillaryCopy(card: ArmillaryRing): string {
  return [card.title, card.keeper, card.ring, card.finish, card.ink, card.degree ?? "", card.bead, card.note].filter((item) => item !== "").join(" · ");
}

export function armillaryCsv(cards: readonly ArmillaryRing[], deskRing: unknown): string {
  const lines = ["title,keeper,ring,finish,ink,degree,bead,tags,logged,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,even,audit,note"];
  for (const card of readArmillary(cards)) {
    const gap = ringGap(card.ring, deskRing);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.ring,
      card.finish,
      card.ink,
      card.degree === null ? "" : String(card.degree),
      String(card.bead),
      card.tags.join(" "),
      card.logged ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateArmillary(card, deskRing) ? "1" : "0",
      idleArmillary(card) ? "1" : "0",
      keenRing(card.ring) ? "1" : "0",
      stillRing(card.ring) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      ringBand(card.ring),
      briskArmillary(card) ? "1" : "0",
      restingArmillary(card) ? "1" : "0",
      overdueArmillary(card) ? "1" : "0",
      evenBead(card.bead) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function cityRecord(raw: CityValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: CityValue): boolean {
  const row = cityRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

function foldCity(raw: string): string {
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function cityGiven(raw: CityValue): string {
  if (hasBlocked(raw)) return "";
  const row = cityRecord(raw);
  if (row && !("lastCity" in row)) return "";
  return row ? clip(row.lastCity, 40) : clip(raw, 40);
}

function cityLetters(given: string): string {
  return foldCity(given).replace(/[^a-z]/g, "");
}

function cityWords(given: string): string[] {
  return foldCity(given).split(" ").filter((word) => /[a-z]/.test(word));
}

function citySeal(given: string): boolean {
  return /[A-Z]/.test(given) && given === given.toUpperCase();
}

/** A blocked money field clears the plate. A real city is set. A blank line is clear. */
export function cityState(raw: CityValue): CityState {
  if (hasBlocked(raw)) return "";
  const row = cityRecord(raw);
  if (row && !("lastCity" in row)) return "";
  return cityGiven(raw) ? "set" : "clear";
}

/** House cities are the nine named capitals. A digit is a ward. A hyphen is a link. */
export function cityLane(raw: CityValue): CityLane {
  if (cityState(raw) !== "set") return "";
  const given = cityGiven(raw);
  const folded = foldCity(given);
  const letters = cityLetters(given);
  const words = cityWords(given);
  if (HOUSE_CITIES.has(folded)) return "house";
  if (/\d/.test(given)) return "mark";
  if (given.includes("-")) return "link";
  if (words.length >= 3) return "court";
  if (words.length === 2) return "span";
  if (citySeal(given)) return "seal";
  if (/^[aeiou]/.test(folded)) return "open";
  if (letters.length >= 12) return "long";
  if (letters.length > 0 && letters.length <= 4) return "short";
  return letters ? "desk" : "";
}

/** The first three letters. */
export function cityStamp(raw: CityValue): string {
  if (cityState(raw) !== "set") return "";
  const letters = cityLetters(cityGiven(raw));
  return letters.slice(0, 3).toUpperCase();
}

/** Ivory ends in a–h. Graphite ends in i–q. Champagne ends in r–z. */
export function cityHue(raw: CityValue): CityHue {
  if (cityState(raw) !== "set") return "";
  const letters = cityLetters(cityGiven(raw));
  const last = letters.slice(-1);
  if (!last) return "";
  if (last <= "h") return "ivory";
  if (last <= "q") return "graphite";
  return "champagne";
}

export function cityTwin(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return /([a-z])\1/.test(cityLetters(cityGiven(raw)));
}

export function cityWide(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return cityLetters(cityGiven(raw)).length > 12;
}

export function cityDash(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return cityGiven(raw).includes("-");
}

export function citySpace(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return /\s/.test(cityGiven(raw));
}

export function cityDigit(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return /\d/.test(cityGiven(raw));
}

export function cityLeap(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return cityLetters(cityGiven(raw)).length === 8;
}

export function cityKnown(raw: CityValue): boolean {
  return cityLane(raw) === "house";
}

export function cityCap(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return citySeal(cityGiven(raw));
}

export function cityTail(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  return /[aeiou]$/.test(cityLetters(cityGiven(raw)));
}

export function cityEcho(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  const letters = cityLetters(cityGiven(raw));
  const counts = new Map<string, number>();
  for (const letter of letters) counts.set(letter, (counts.get(letter) || 0) + 1);
  return Array.from(counts.values()).some((count) => count >= 3);
}

export function cityEven(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  const count = cityLetters(cityGiven(raw)).length;
  return count > 0 && count % 2 === 0;
}

export function cityOdd(raw: CityValue): boolean {
  if (cityState(raw) !== "set") return false;
  const count = cityLetters(cityGiven(raw)).length;
  return count % 2 === 1;
}

export function cityGroups(raw: CityValue): number {
  if (cityState(raw) !== "set") return 0;
  return cityWords(cityGiven(raw)).length;
}

export function cityStep(raw: CityValue): number {
  if (cityState(raw) !== "set") return 0;
  return cityLetters(cityGiven(raw)).length;
}

export function cityLanes(rows: readonly CityRow[]): CityLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = cityLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCity(rows: readonly CityRow[]): string {
  const lines = cityLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingCityHue(rows: readonly CityRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = cityHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue as (typeof HUE_ORDER)[number]) - HUE_ORDER.indexOf(b.hue as (typeof HUE_ORDER)[number]))[0].hue;
}

export function sharedCityCount(rows: readonly CityRow[]): number {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const stamp = cityStamp(row.note);
    if (!stamp) continue;
    seen.set(stamp, (seen.get(stamp) || 0) + 1);
  }
  return Array.from(seen.values()).filter((count) => count > 1).length;
}

export function laneCityCount(rows: readonly CityRow[], lane: CityLane): number {
  return rows.filter((row) => cityLane(row.note) === lane).length;
}

export function cityShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCityLanes(rows: readonly CityRow[]): string[] {
  return cityLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenCities(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCities(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCity(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCityReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCityReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCityLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleCities(
  rows: readonly CityRow[],
  lane: string,
  hue: string,
  query: string,
  review: CityReview,
  reviewed: readonly string[],
  shape: CityShape,
): CityRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (cityState(row.note) === "") return false;
    const found = cityLane(row.note);
    const hueName = cityHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${cityGiven(row.note)} ${cityStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "link" && found !== "link") return false;
    if (shape === "court" && found !== "court") return false;
    if (shape === "span" && found !== "span") return false;
    if (shape === "seal" && found !== "seal") return false;
    if (shape === "open" && found !== "open") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "short" && found !== "short") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "wide" && !cityWide(row.note)) return false;
    if (shape === "dash" && !cityDash(row.note)) return false;
    if (shape === "leap" && !cityLeap(row.note)) return false;
    if (shape === "twin" && !cityTwin(row.note)) return false;
    if (shape === "known" && !cityKnown(row.note)) return false;
    if (shape === "echo" && !cityEcho(row.note)) return false;
    if (shape === "even" && !cityEven(row.note)) return false;
    if (shape === "odd" && !cityOdd(row.note)) return false;
    if (shape === "space" && !citySpace(row.note)) return false;
    if (shape === "digit" && !cityDigit(row.note)) return false;
    if (shape === "tail" && !cityTail(row.note)) return false;
    if (shape === "cap" && !cityCap(row.note)) return false;
    return true;
  });
}

export function cityCopy(raw: CityValue): string {
  return [cityStamp(raw), cityLane(raw), cityHue(raw)].filter(Boolean).join(" ");
}

export function cityLanesCsv(rows: readonly CityRow[]): string {
  const lines = ["lane,count"];
  for (const line of cityLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function cityRowsCsv(rows: readonly CityRow[], reviewed: readonly string[]): string {
  const lines = ["name,city,stamp,lane,hue,step,groups,echo,wide,dash,leap,twin,known,cap,tail,even,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (cityState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(cityGiven(row.note)),
      cityStamp(row.note),
      cityLane(row.note),
      cityHue(row.note),
      String(cityStep(row.note)),
      String(cityGroups(row.note)),
      cityEcho(row.note) ? "1" : "0",
      cityWide(row.note) ? "1" : "0",
      cityDash(row.note) ? "1" : "0",
      cityLeap(row.note) ? "1" : "0",
      cityTwin(row.note) ? "1" : "0",
      cityKnown(row.note) ? "1" : "0",
      cityCap(row.note) ? "1" : "0",
      cityTail(row.note) ? "1" : "0",
      cityEven(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
