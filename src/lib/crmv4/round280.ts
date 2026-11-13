/**
 * Backstaff sights for a horizon book kept in this browser, and reason plates read the invalid-lead reason already stored on the account.
 * Limbs are limb, arc, vane, and sight. Tones are pearl, ink, and brass.
 * Degrees are 30, 60, or 90. Slits are 1, 4, or 7.
 * INV_DUPLICATE and INV_TRASH are duplicates. INV_WRONG_GEO and INV_WRONG_LANGUAGE are geo.
 * Other INV_WRONG_* codes are a number. INV_UNDERAGE is age. INV_NOT_IN_WH is hours.
 * INV_NO_DOCS and INV_NOT_REGISTERED are papers. Any other INV_ code is other.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_backstaff_sight (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   helmsman text not null default '',
 *   mast text not null default '',
 *   finish text not null default '',
 *   shade text not null default '',
 *   knot_no integer,
 *   chip_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_reason_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_reason_review (
 *   trader_id text primary key
 * );
 */

export const BST_KEY = "crmv4-backstaff-sight";
export const BST_VIEW_KEY = "crmv4-backstaff-views";
export const BST_DENSITY_KEY = "crmv4-backstaff-density";
export const LIR_KEY = "crmv4-reason-hide";
export const LIR_REVIEW_KEY = "crmv4-reason-review";

export const BACKSTAFF_LIMBS = ["limb", "arc", "vane", "sight"] as const;

export type BackstaffMast = (typeof BACKSTAFF_LIMBS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type ShadeName = "blank" | "pearl" | "ink" | "brass";

export type BackstaffTray = "deck" | "locker" | "bilge";

export type BackstaffDensity = "open" | "close";

export type BackstaffSort = "band" | "keeper";

export type BackstaffSight = {
  id: string;
  title: string;
  note: string;
  helmsman: string;
  mast: string;
  knot: number | null;
  finish: string;
  shade: string;
  chip: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type BackstaffView = {
  id: string;
  name: string;
  tray: BackstaffTray;
  query: string;
  helmsman: string;
  finish: string;
  shade: string;
  mast: string;
  knot: string;
  chip: string;
};

export type BackstaffCounts = {
  deck: number;
  locker: number;
  bilge: number;
  logged: number;
  keen: number;
  still: number;
  soon: number;
  chip: number;
  house: number;
  knot: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  even: number;
};

export type ReasonLane = "" | "duplicate" | "geo" | "number" | "age" | "hours" | "papers" | "other";

export type ReasonHue = "" | "ivory" | "graphite" | "champagne";

export type ReasonState = "" | "clear" | "set";

export type ReasonShape = "all" | "duplicate" | "geo" | "number" | "age" | "hours" | "papers" | "other" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo" | "vowel";

export type ReasonReview = "all" | "reviewed" | "fresh";

export type ReasonValue = string | { leadInvalidReason?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type ReasonRow = { id: string; label: string; note: ReasonValue };

export type ReasonLaneLine = { lane: string; count: number };

export const ROUND280_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "knot",
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
  "reason",
  "reason-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shade", "log", "unlog", "lock", "resume", "stow", "open", "finish", "tag", "chip", "knot", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const SHADES = ["pearl", "ink", "brass"] as const;

const KNOT_CYCLE = [30, 60, 90] as const;

const CHIP_CYCLE = [1, 4, 7] as const;

const KEEN = new Set(["vane", "sight"]);

const STILL = new Set(["limb", "arc"]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const DAWN = new Set(["limb"]);

const LANE_ORDER = ["duplicate", "geo", "number", "age", "hours", "papers", "other"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["INV_WRONG_GEO", "INV_WRONG_LANGUAGE", "INV_WRONG_PERSON", "INV_WRONG_NUMBER", "INV_WRONG_INFO", "INV_WRONG_SOURCE", "INV_UNDERAGE", "INV_TRASH", "INV_DUPLICATE", "INV_NOT_REGISTERED", "INV_NOT_IN_WH", "INV_NO_DOCS"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BackstaffTray {
  return raw === "locker" || raw === "bilge" ? raw : "deck";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<FinishName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<FinishName, "blank">) : "";
}

function shadeName(raw: unknown): Exclude<ShadeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHADES as readonly string[]).includes(text) ? (text as Exclude<ShadeName, "blank">) : "";
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

function inTray(card: BackstaffSight, tray: BackstaffTray): boolean {
  if (tray === "locker") return card.locked && !card.stowed;
  if (tray === "bilge") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function mastIndex(mast: string): number {
  return BACKSTAFF_LIMBS.indexOf(mast as BackstaffMast);
}

function chipIndex(chip: number): number {
  return CHIP_CYCLE.indexOf(chip as (typeof CHIP_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function mastOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (BACKSTAFF_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** Knot is 5, 15, or 45. Anything else stays blank. */
export function backstaffKnot(raw: unknown): 30 | 60 | 90 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (KNOT_CYCLE as readonly number[]).includes(value) ? (value as 30 | 60 | 90) : null;
}

/** Chip is 2, 5, or 8. Anything else stays blank. */
export function backstaffChip(raw: unknown): 1 | 4 | 7 | null {
  const text = clip(raw, 1);
  if (!text) return null;
  const value = Number(text);
  return (CHIP_CYCLE as readonly number[]).includes(value) ? (value as 1 | 4 | 7) : null;
}

/** Finish is ivory, graphite, or champagne. The saved finish is the upper case metal. */
export function finishOf(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Shade is sand, soot, or gilt. A blank shade stays blank. */
export function shadeOf(raw: unknown): string {
  return shadeName(raw);
}

export function keenMast(mast: unknown): boolean {
  return KEEN.has(clip(mast, 12).toLowerCase());
}

export function stillMast(mast: unknown): boolean {
  return STILL.has(clip(mast, 12).toLowerCase());
}

/** Dawn is the fore mast. Noon is the main. Dusk is the mizzen. Night is the jigger. */
export function mastBand(mast: unknown): string {
  const text = mastOf(mast);
  if (!text) return "";
  if (DAWN.has(text)) return "dawn";
  if (text === "arc") return "noon";
  if (text === "vane") return "dusk";
  return "night";
}

/** Signed distance from one mast to the desk mast. */
export function mastGap(from: unknown, to: unknown): number | null {
  const left = mastIndex(mastOf(from));
  const right = mastIndex(mastOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE.has(finishOf(finish));
}

/** An even chip is 2 or 8. Five is odd. A blank chip is not even. */
export function evenChip(chip: unknown): boolean {
  const value = backstaffChip(chip);
  return value === 4;
}

export function activeMast(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return mastOf(text) || "all";
}

export function activeKnot(raw: unknown): string {
  const knot = backstaffKnot(raw);
  return knot === null ? "all" : String(knot);
}

export function activeShade(raw: unknown, allow: readonly string[]): string {
  const text = shadeOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeChip(raw: unknown): string {
  const chip = backstaffChip(raw);
  return chip === null ? "all" : String(chip);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveBackstaffFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly BackstaffSight[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || !card.finish) continue;
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

/** Before eight, suggest five. Through the afternoon, fifteen. Evening asks for forty-five. Saved knots win when any exist. */
export function suggestKnot(cards: readonly BackstaffSight[], hour: number): 30 | 60 | 90 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || card.knot === null) continue;
    counts.set(card.knot, (counts.get(card.knot) || 0) + 1);
  }
  let best: 30 | 60 | 90 | null = null;
  let score = 0;
  for (const knot of KNOT_CYCLE) {
    const count = counts.get(knot) || 0;
    if (count > score) {
      best = knot;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 30;
  if (hour < 17) return 60;
  return 90;
}

/** Before eleven, suggest the fore mast. The rest of the day suggests the mizzen. */
export function suggestMast(hour: number): BackstaffMast {
  return hour < 11 ? "limb" : "vane";
}

/** The helmsman with the fewest unlogged deck sights. A tie keeps the roster order. */
export function fairKeeper(cards: readonly BackstaffSight[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "deck") && !card.logged);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.helmsman.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readBackstaffs(raw: unknown): BackstaffSight[] {
  if (!Array.isArray(raw)) return [];
  const out: BackstaffSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BackstaffSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      helmsman: clip(row.helmsman, 24),
      mast: mastOf(row.mast),
      knot: backstaffKnot(row.knot),
      finish: finishOf(row.finish),
      shade: shadeOf(row.shade),
      chip: backstaffChip(row.chip) ?? 1,
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

export function addBackstaff(
  cards: readonly BackstaffSight[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    helmsman?: string;
    mast?: string;
    knot?: unknown;
    finish?: string;
    shade?: string;
    chip?: unknown;
    tags?: string;
  },
): BackstaffSight[] {
  const current = readBackstaffs(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: BackstaffSight = {
    id,
    title,
    note: noteOf(card.note),
    helmsman: clip(card.helmsman, 24),
    mast: mastOf(card.mast),
    knot: backstaffKnot(card.knot),
    finish: finishOf(card.finish),
    shade: shadeOf(card.shade),
    chip: backstaffChip(card.chip) ?? 1,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly BackstaffSight[], id: string, change: (card: BackstaffSight) => BackstaffSight): BackstaffSight[] {
  return readBackstaffs(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly BackstaffSight[], ids: readonly string[], change: (card: BackstaffSight) => BackstaffSight): BackstaffSight[] {
  const picked = new Set(ids);
  return readBackstaffs(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editBackstaff(cards: readonly BackstaffSight[], id: string, title: string): BackstaffSight[] {
  const next = lineOf(title);
  if (!next) return readBackstaffs(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBackstaffNote(cards: readonly BackstaffSight[], id: string, note: string): BackstaffSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setBackstaffLogged(cards: readonly BackstaffSight[], id: string, logged: boolean): BackstaffSight[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setBackstaffLock(cards: readonly BackstaffSight[], id: string, locked: boolean): BackstaffSight[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setBackstaffStow(cards: readonly BackstaffSight[], id: string, stowed: boolean): BackstaffSight[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setBackstaffStar(cards: readonly BackstaffSight[], id: string, flagged: boolean): BackstaffSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setBackstaffFinish(cards: readonly BackstaffSight[], id: string, finish: unknown): BackstaffSight[] {
  const next = finishOf(finish);
  if (!next) return readBackstaffs(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Shade steps sand, soot, gilt, then sand again. A blank shade starts at sand. */
export function cycleShade(cards: readonly BackstaffSight[], id: string): BackstaffSight[] {
  return mapCard(cards, id, (card) => {
    const at = SHADES.indexOf(card.shade as (typeof SHADES)[number]);
    const next = at < 0 ? SHADES[0] : SHADES[(at + 1) % SHADES.length];
    return next === card.shade ? card : { ...card, shade: next, audit: "shade" };
  });
}

export function addBackstaffTag(cards: readonly BackstaffSight[], id: string, tag: string): BackstaffSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBackstaffs(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank knot becomes 5, 5 becomes 15, and 15 becomes 45. A knot of 45 stays. */
export function liftKnot(cards: readonly BackstaffSight[], id: string): BackstaffSight[] {
  return mapCard(cards, id, (card) => {
    if (card.knot === 90) return card;
    const next = card.knot === 60 ? 90 : card.knot === 30 ? 60 : 30;
    return { ...card, knot: next, audit: "knot" };
  });
}

/** A blank knot becomes 45, 45 becomes 15, and 15 becomes 5. A knot of 5 stays. */
export function dipKnot(cards: readonly BackstaffSight[], id: string): BackstaffSight[] {
  return mapCard(cards, id, (card) => {
    if (card.knot === 30) return card;
    const next = card.knot === 60 ? 30 : card.knot === 90 ? 60 : 90;
    return { ...card, knot: next, audit: "dip" };
  });
}

export function raiseChip(cards: readonly BackstaffSight[], id: string): BackstaffSight[] {
  return mapCard(cards, id, (card) => {
    const at = chipIndex(card.chip);
    if (at < 0) return { ...card, chip: 1, audit: "chip" };
    if (at === CHIP_CYCLE.length - 1) return card;
    return { ...card, chip: CHIP_CYCLE[at + 1], audit: "chip" };
  });
}

export function lowerChip(cards: readonly BackstaffSight[], id: string): BackstaffSight[] {
  return mapCard(cards, id, (card) => {
    const at = chipIndex(card.chip);
    if (at <= 0) return card;
    return { ...card, chip: CHIP_CYCLE[at - 1], audit: "chip" };
  });
}

export function bulkBackstaffLog(cards: readonly BackstaffSight[], ids: readonly string[]): BackstaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkBackstaffStow(cards: readonly BackstaffSight[], ids: readonly string[]): BackstaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkBackstaffGilt(cards: readonly BackstaffSight[], ids: readonly string[]): BackstaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, shade: "brass", audit: "shade" }));
}

export function bulkBackstaffChampagne(cards: readonly BackstaffSight[], ids: readonly string[]): BackstaffSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkBackstaffTag(cards: readonly BackstaffSight[], ids: readonly string[], tag: string): BackstaffSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readBackstaffs(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly BackstaffSight[], ids: readonly string[], index: number, change: (list: readonly BackstaffSight[], id: string) => BackstaffSight[]): BackstaffSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readBackstaffs(cards);
}

export function liftKnotFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  return focused(cards, ids, index, liftKnot);
}

export function dipKnotFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  return focused(cards, ids, index, dipKnot);
}

export function toneFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  return focused(cards, ids, index, cycleShade);
}

export function raiseChipFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  return focused(cards, ids, index, raiseChip);
}

export function lowerChipFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  return focused(cards, ids, index, lowerChip);
}

export function logBackstaffFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  const id = ids[index];
  if (!id) return readBackstaffs(cards);
  const card = readBackstaffs(cards).find((item) => item.id === id);
  return card ? setBackstaffLogged(cards, id, !card.logged) : readBackstaffs(cards);
}

export function lockBackstaffFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  const id = ids[index];
  if (!id) return readBackstaffs(cards);
  const card = readBackstaffs(cards).find((item) => item.id === id);
  return card ? setBackstaffLock(cards, id, !card.locked) : readBackstaffs(cards);
}

export function starBackstaffFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number): BackstaffSight[] {
  const id = ids[index];
  if (!id) return readBackstaffs(cards);
  const card = readBackstaffs(cards).find((item) => item.id === id);
  return card ? setBackstaffStar(cards, id, !card.flagged) : readBackstaffs(cards);
}

export function tagBackstaffFocused(cards: readonly BackstaffSight[], ids: readonly string[], index: number, tag: string): BackstaffSight[] {
  const id = ids[index];
  return id ? addBackstaffTag(cards, id, tag) : readBackstaffs(cards);
}

export function readBackstaffViews(raw: unknown): BackstaffView[] {
  if (!Array.isArray(raw)) return [];
  const out: BackstaffView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BackstaffView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      helmsman: clip(row.helmsman, 24),
      finish: activeFinish(row.finish),
      shade: activeShade(row.shade, SHADES),
      mast: activeMast(row.mast),
      knot: activeKnot(row.knot),
      chip: activeChip(row.chip),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBackstaffView(
  views: readonly BackstaffView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    helmsman?: string;
    finish?: string;
    shade?: string;
    mast?: string;
    knot?: string;
    chip?: string;
  },
): BackstaffView[] {
  const current = readBackstaffViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: BackstaffView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    helmsman: clip(view.helmsman, 24),
    finish: activeFinish(view.finish),
    shade: activeShade(view.shade, SHADES),
    mast: activeMast(view.mast),
    knot: activeKnot(view.knot),
    chip: activeChip(view.chip),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBackstaffView(views: readonly BackstaffView[], id: string): BackstaffView[] {
  return readBackstaffViews(views).filter((view) => view.id !== id);
}

export function backstaffDensity(raw: unknown): BackstaffDensity {
  return raw === "close" ? "close" : "open";
}

/** A sight more than one mast behind the desk, at chip 2, is late. */
export function lateBackstaff(card: BackstaffSight, deskMast: unknown): boolean {
  const gap = mastGap(card.mast, deskMast);
  return card.chip === 1 && gap !== null && gap > 1;
}

export function idleBackstaff(card: BackstaffSight): boolean {
  return card.shade === "pearl" && stillMast(card.mast) && card.chip === 1;
}

export function briskBackstaff(card: BackstaffSight): boolean {
  return card.chip === 7 && card.shade === "brass" && keenMast(card.mast);
}

export function restingBackstaff(card: BackstaffSight): boolean {
  return card.knot === 90 && card.shade === "ink" && card.mast === "sight";
}

/** A knot of five on a keen mast is overdue unless the sight is logged. */
export function overdueBackstaff(card: BackstaffSight): boolean {
  return card.knot === 30 && keenMast(card.mast) && !card.logged;
}

export function visibleBackstaffs(
  cards: readonly BackstaffSight[],
  tray: BackstaffTray,
  query: string,
  helmsman: string,
  finish: string,
  shade: string,
  mast: string,
  knot: string,
  chip: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): BackstaffSight[] {
  const text = query.trim().toLowerCase();
  const helmOn = helmsman === "all" ? "" : helmsman.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const shadeOn = shade === "all" ? "" : shadeOf(shade);
  const mastOn = mast === "all" ? "" : activeMast(mast);
  const knotOn = knot === "all" ? "" : activeKnot(knot);
  const chipOn = chip === "all" ? "" : activeChip(chip);
  return readBackstaffs(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (helmOn && card.helmsman.toLowerCase() !== helmOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (shadeOn && card.shade !== shadeOn) return false;
    if (mastOn === "keen" && !keenMast(card.mast)) return false;
    if (mastOn === "still" && !stillMast(card.mast)) return false;
    if (mastOn && mastOn !== "keen" && mastOn !== "still" && card.mast !== mastOn) return false;
    if (knotOn && String(card.knot ?? "") !== knotOn) return false;
    if (chipOn && String(card.chip) !== chipOn) return false;
    if (houseOnly && !houseFinish(card.finish)) return false;
    if (keenOnly && !keenMast(card.mast)) return false;
    if (stillOnly && !stillMast(card.mast)) return false;
    return true;
  });
}

export function sortBackstaffs(cards: readonly BackstaffSight[], sort: BackstaffSort): BackstaffSight[] {
  return cards.slice().sort((a, b) => {
    if (a.logged !== b.logged) return a.logged ? -1 : 1;
    if (sort === "keeper") {
      const helm = a.helmsman.localeCompare(b.helmsman);
      if (helm) return helm;
    }
    const mast = (mastIndex(a.mast) < 0 ? 99 : mastIndex(a.mast)) - (mastIndex(b.mast) < 0 ? 99 : mastIndex(b.mast));
    if (mast) return mast;
    return a.title.localeCompare(b.title);
  });
}

export function backstaffCounts(cards: readonly BackstaffSight[], shown: readonly BackstaffSight[], deskMast: unknown): BackstaffCounts {
  const open = cards.filter((card) => inTray(card, "deck"));
  return {
    deck: open.length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    bilge: cards.filter((card) => inTray(card, "bilge")).length,
    logged: open.filter((card) => card.logged).length,
    keen: open.filter((card) => keenMast(card.mast)).length,
    still: open.filter((card) => stillMast(card.mast)).length,
    soon: open.filter((card) => card.knot === 30).length,
    chip: open.reduce((sum, card) => sum + card.chip, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    knot: open.filter((card) => card.knot !== null).length,
    matched: shown.filter((card) => card.mast && card.mast === mastOf(deskMast)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleBackstaff(card)).length,
    brisk: open.filter((card) => briskBackstaff(card)).length,
    resting: open.filter((card) => restingBackstaff(card)).length,
    overdue: open.filter((card) => overdueBackstaff(card)).length,
    even: open.filter((card) => evenChip(card.chip)).length,
  };
}

export function clashMastCount(cards: readonly BackstaffSight[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && card.mast);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.mast === card.mast && other.chip === card.chip)).length;
}

export function neighborBackstaffCount(cards: readonly BackstaffSight[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && chipIndex(card.chip) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(chipIndex(other.chip) - chipIndex(card.chip));
    const ring = Math.min(gap, CHIP_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly BackstaffSight[]): string {
  const open = cards.filter((card) => inTray(card, "deck") && card.helmsman);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.helmsman.toLowerCase() === card.helmsman.toLowerCase()).length;
    if (count > score) {
      best = card.helmsman;
      score = count;
    }
  }
  return best;
}

export function reminderBackstaffs(cards: readonly BackstaffSight[]): BackstaffSight[] {
  return cards.filter((card) => inTray(card, "deck") && (card.knot === 30 || card.knot === 60));
}

export function idleBackstaffs(cards: readonly BackstaffSight[]): BackstaffSight[] {
  return cards.filter((card) => inTray(card, "deck") && idleBackstaff(card));
}

export function backstaffTimeline(cards: readonly BackstaffSight[]): { chip: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return CHIP_CYCLE.map((chip) => ({ chip, titles: open.filter((card) => card.chip === chip).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function backstaffBars(cards: readonly BackstaffSight[]): { mast: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return BACKSTAFF_LIMBS.map((mast) => ({ mast, count: open.filter((card) => card.mast === mast).length }));
}

export function backstaffKeepers(cards: readonly BackstaffSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helmsman || out.some((item) => item.toLowerCase() === card.helmsman.toLowerCase())) continue;
    out.push(card.helmsman);
  }
  return out;
}

export function backstaffCopy(card: BackstaffSight): string {
  return [card.title, card.helmsman, card.mast, card.finish, card.shade, card.knot ?? "", card.chip, card.note].filter((item) => item !== "").join(" · ");
}

export function backstaffCsv(cards: readonly BackstaffSight[], deskMast: unknown): string {
  const lines = ["title,helmsman,mast,finish,shade,knot,chip,tags,logged,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,even,audit,note"];
  for (const card of readBackstaffs(cards)) {
    const gap = mastGap(card.mast, deskMast);
    lines.push([
      csvCell(card.title),
      csvCell(card.helmsman),
      card.mast,
      card.finish,
      card.shade,
      card.knot === null ? "" : String(card.knot),
      String(card.chip),
      card.tags.join(" "),
      card.logged ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBackstaff(card, deskMast) ? "1" : "0",
      idleBackstaff(card) ? "1" : "0",
      keenMast(card.mast) ? "1" : "0",
      stillMast(card.mast) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      mastBand(card.mast),
      briskBackstaff(card) ? "1" : "0",
      restingBackstaff(card) ? "1" : "0",
      overdueBackstaff(card) ? "1" : "0",
      evenChip(card.chip) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function reasonRecord(raw: ReasonValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: ReasonValue): boolean {
  const row = reasonRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type ReasonParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; words: number; seps: number; digit: boolean; space: boolean };

function reasonText(raw: ReasonValue): string {
  if (hasBlocked(raw)) return "";
  const row = reasonRecord(raw);
  if (row && !("leadInvalidReason" in row) && !("code" in row)) return "";
  return row ? clip(row.leadInvalidReason ?? row.code, 32) : clip(raw, 32);
}

function reasonParts(raw: ReasonValue): ReasonParts | null {
  const text = reasonText(raw);
  if (!text) return null;
  const upper = text.toUpperCase();
  const coded = /^INV_[A-Z0-9_]{2,28}$/.test(upper);
  const given = coded ? upper : text;
  if (!coded && !/^[A-Za-z][A-Za-z0-9_\/ -]{1,23}$/.test(text)) return null;
  const letters = given.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 24) return null;
  const words = given.split(/\s+/).filter(Boolean).length;
  const seps = (given.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given,
    wide: /_/.test(given),
    notch: /-/.test(given),
    slash: /\//.test(given),
    words,
    seps,
    digit: /\d/.test(given),
    space: words >= 2,
  };
}

/** A blocked money field clears the plate. A real invalid-reason code is set. A blank or broken code is clear. */
export function reasonState(raw: ReasonValue): ReasonState {
  if (hasBlocked(raw)) return "";
  const row = reasonRecord(raw);
  if (row && !("leadInvalidReason" in row) && !("code" in row)) return "";
  return reasonParts(raw) ? "set" : "clear";
}

/** Official invalid-reason codes take a lane. A digit is hours, a hyphen is age, a space is papers, and a vowel start is geo. */
export function reasonLane(raw: ReasonValue): ReasonLane {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toUpperCase();
  if (key === "INV_DUPLICATE" || key === "INV_TRASH") return "duplicate";
  if (key === "INV_WRONG_GEO" || key === "INV_WRONG_LANGUAGE") return "geo";
  if (key.startsWith("INV_WRONG_")) return "number";
  if (key === "INV_UNDERAGE") return "age";
  if (key === "INV_NOT_IN_WH") return "hours";
  if (key === "INV_NO_DOCS" || key === "INV_NOT_REGISTERED") return "papers";
  if (key.startsWith("INV_")) return "other";
  if (parts.digit) return "hours";
  if (parts.notch) return "age";
  if (parts.space) return "papers";
  if (/^[aeiou]/i.test(parts.letters)) return "geo";
  return "other";
}

/** The last three letters. */
export function reasonStamp(raw: ReasonValue): string {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return parts ? parts.letters.slice(-3).toUpperCase() : "";
}

/** Number and papers are ivory. Duplicate and age are champagne. Geo and hours are graphite. */
export function reasonHue(raw: ReasonValue): ReasonHue {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  if (!parts) return "";
  const lane = reasonLane(raw);
  if (lane === "number" || lane === "papers") return "ivory";
  if (lane === "duplicate" || lane === "age") return "champagne";
  if (lane === "geo" || lane === "hours") return "graphite";
  if (lane === "other") {
    const head = parts.letters[0].toUpperCase();
    return head === "S" || head === "V" ? "champagne" : "graphite";
  }
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function reasonTwin(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function reasonWide(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function reasonNotch(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function reasonEcho(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function reasonLeap(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && parts.letters.length === 12);
}

export function reasonSlash(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function reasonKnown(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toUpperCase()));
}

export function reasonCap(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

/** A consonant ending. A vowel ending is not a tail. */
export function reasonTail(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && /[^aeiou]$/i.test(parts.letters));
}

export function reasonVowel(raw: ReasonValue): boolean {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return Boolean(parts && /^[aeiou]/i.test(parts.letters));
}

export function reasonWords(raw: ReasonValue): number {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return parts ? parts.words : 0;
}

export function reasonStep(raw: ReasonValue): number {
  const parts = reasonState(raw) === "set" ? reasonParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function reasonLanes(rows: readonly ReasonRow[]): ReasonLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = reasonLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingReason(rows: readonly ReasonRow[]): string {
  const bars = reasonLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingReasonHue(rows: readonly ReasonRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = reasonHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedReasonCount(rows: readonly ReasonRow[]): number {
  const marks = rows.map((row) => reasonStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneReasonCount(rows: readonly ReasonRow[], lane: ReasonLane): number {
  return rows.filter((row) => reasonLane(row.note) === lane).length;
}

export function reasonShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentReasonLanes(rows: readonly ReasonRow[]): string[] {
  return reasonLanes(rows).map((line) => line.lane);
}

export function readHiddenReasons(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedReasons(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleReason(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleReasonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkReasonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleReasonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleReasons(
  rows: readonly ReasonRow[],
  lane: string,
  hue: string,
  query: string,
  review: ReasonReview,
  reviewed: readonly string[],
  shape: ReasonShape,
): ReasonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (reasonState(row.note) === "") return false;
    const found = reasonLane(row.note);
    const hueName = reasonHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${reasonText(row.note)} ${reasonStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "duplicate" && found !== "duplicate") return false;
    if (shape === "geo" && found !== "geo") return false;
    if (shape === "number" && found !== "number") return false;
    if (shape === "age" && found !== "age") return false;
    if (shape === "hours" && found !== "hours") return false;
    if (shape === "papers" && found !== "papers") return false;
    if (shape === "other" && found !== "other") return false;
    if (shape === "wide" && !reasonWide(row.note)) return false;
    if (shape === "notch" && !reasonNotch(row.note)) return false;
    if (shape === "leap" && !reasonLeap(row.note)) return false;
    if (shape === "slash" && !reasonSlash(row.note)) return false;
    if (shape === "twin" && !reasonTwin(row.note)) return false;
    if (shape === "known" && !reasonKnown(row.note)) return false;
    if (shape === "echo" && !reasonEcho(row.note)) return false;
    if (shape === "vowel" && !reasonVowel(row.note)) return false;
    return true;
  });
}

export function reasonCopy(raw: ReasonValue): string {
  return [reasonStamp(raw), reasonLane(raw), reasonHue(raw)].filter(Boolean).join(" ");
}

export function reasonLanesCsv(rows: readonly ReasonRow[]): string {
  const lines = ["lane,count"];
  for (const line of reasonLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function reasonRowsCsv(rows: readonly ReasonRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,words,echo,wide,notch,leap,slash,twin,known,cap,tail,vowel,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (reasonState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(reasonText(row.note)),
      reasonStamp(row.note),
      reasonLane(row.note),
      reasonHue(row.note),
      String(reasonStep(row.note)),
      String(reasonWords(row.note)),
      reasonEcho(row.note) ? "1" : "0",
      reasonWide(row.note) ? "1" : "0",
      reasonNotch(row.note) ? "1" : "0",
      reasonLeap(row.note) ? "1" : "0",
      reasonSlash(row.note) ? "1" : "0",
      reasonTwin(row.note) ? "1" : "0",
      reasonKnown(row.note) ? "1" : "0",
      reasonCap(row.note) ? "1" : "0",
      reasonTail(row.note) ? "1" : "0",
      reasonVowel(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
