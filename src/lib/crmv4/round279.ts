/**
 * Kamal sights for a coastal book kept in this browser, and desk-watch plates read the desk already stored on the account.
 * Masts are fore, main, mizzen, and jigger. Shades are sand, soot, and gilt.
 * Knots are 5, 15, or 45. Chips are 2, 5, or 8.
 * A known desk name is a house. A digit is a watch. A hyphen is a berth. A space is a span. A vowel start is a gallery.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_kamal_sight (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   helmsman text not null default '',
 *   mast text not null default '',
 *   finish text not null default '',
 *   shade text not null default '',
 *   knot_no integer,
 *   chip_no integer not null default 2,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_desk_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_desk_review (
 *   trader_id text primary key
 * );
 */

export const KAM_KEY = "crmv4-kamal-sight";
export const KAM_VIEW_KEY = "crmv4-kamal-views";
export const KAM_DENSITY_KEY = "crmv4-kamal-density";
export const DWB_KEY = "crmv4-desk-hide";
export const DWB_REVIEW_KEY = "crmv4-desk-review";

export const KAMAL_MASTS = ["fore", "main", "mizzen", "jigger"] as const;

export type KamalMast = (typeof KAMAL_MASTS)[number];

export type FinishName = "blank" | "ivory" | "graphite" | "champagne";

export type ShadeName = "blank" | "sand" | "soot" | "gilt";

export type KamalTray = "deck" | "locker" | "bilge";

export type KamalDensity = "open" | "close";

export type KamalSort = "band" | "keeper";

export type KamalSight = {
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

export type KamalView = {
  id: string;
  name: string;
  tray: KamalTray;
  query: string;
  helmsman: string;
  finish: string;
  shade: string;
  mast: string;
  knot: string;
  chip: string;
};

export type KamalCounts = {
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

export type DeskLane = "" | "gallery" | "watch" | "house" | "berth" | "span" | "plain";

export type DeskHue = "" | "ivory" | "graphite" | "champagne";

export type DeskState = "" | "clear" | "set";

export type DeskShape = "all" | "gallery" | "watch" | "house" | "berth" | "span" | "plain" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo" | "vowel";

export type DeskReview = "all" | "reviewed" | "fresh";

export type DeskValue = string | { desk?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type DeskRow = { id: string; label: string; note: DeskValue };

export type DeskLaneLine = { lane: string; count: number };

export const ROUND279_FEATURES = [
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
  "desk",
  "desk-csv",
] as const;

const AUDITS = ["save", "edit", "note", "shade", "log", "unlog", "lock", "resume", "stow", "open", "finish", "tag", "chip", "knot", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const SHADES = ["sand", "soot", "gilt"] as const;

const KNOT_CYCLE = [5, 15, 45] as const;

const CHIP_CYCLE = [2, 5, 8] as const;

const KEEN = new Set(["mizzen", "jigger"]);

const STILL = new Set(["fore", "main"]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const DAWN = new Set(["fore"]);

const LANE_ORDER = ["gallery", "watch", "house", "berth", "span", "plain"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["sales", "retention", "vip", "support", "night", "desk"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): KamalTray {
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

function inTray(card: KamalSight, tray: KamalTray): boolean {
  if (tray === "locker") return card.locked && !card.stowed;
  if (tray === "bilge") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function mastIndex(mast: string): number {
  return KAMAL_MASTS.indexOf(mast as KamalMast);
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
  return (KAMAL_MASTS as readonly string[]).includes(text) ? text : "";
}

/** Knot is 5, 15, or 45. Anything else stays blank. */
export function kamalKnot(raw: unknown): 5 | 15 | 45 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (KNOT_CYCLE as readonly number[]).includes(value) ? (value as 5 | 15 | 45) : null;
}

/** Chip is 2, 5, or 8. Anything else stays blank. */
export function kamalChip(raw: unknown): 2 | 5 | 8 | null {
  const text = clip(raw, 1);
  if (!text) return null;
  const value = Number(text);
  return (CHIP_CYCLE as readonly number[]).includes(value) ? (value as 2 | 5 | 8) : null;
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
  if (text === "main") return "noon";
  if (text === "mizzen") return "dusk";
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
  const value = kamalChip(chip);
  return value === 2 || value === 8;
}

export function activeMast(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return mastOf(text) || "all";
}

export function activeKnot(raw: unknown): string {
  const knot = kamalKnot(raw);
  return knot === null ? "all" : String(knot);
}

export function activeShade(raw: unknown, allow: readonly string[]): string {
  const text = shadeOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeChip(raw: unknown): string {
  const chip = kamalChip(raw);
  return chip === null ? "all" : String(chip);
}

export function activeFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveKamalFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestFinish(cards: readonly KamalSight[]): string {
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
export function suggestKnot(cards: readonly KamalSight[], hour: number): 5 | 15 | 45 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || card.knot === null) continue;
    counts.set(card.knot, (counts.get(card.knot) || 0) + 1);
  }
  let best: 5 | 15 | 45 | null = null;
  let score = 0;
  for (const knot of KNOT_CYCLE) {
    const count = counts.get(knot) || 0;
    if (count > score) {
      best = knot;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 5;
  if (hour < 17) return 15;
  return 45;
}

/** Before eleven, suggest the fore mast. The rest of the day suggests the mizzen. */
export function suggestMast(hour: number): KamalMast {
  return hour < 11 ? "fore" : "mizzen";
}

/** The helmsman with the fewest unlogged deck sights. A tie keeps the roster order. */
export function fairKeeper(cards: readonly KamalSight[], roster: string): string {
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

export function readKamals(raw: unknown): KamalSight[] {
  if (!Array.isArray(raw)) return [];
  const out: KamalSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KamalSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      helmsman: clip(row.helmsman, 24),
      mast: mastOf(row.mast),
      knot: kamalKnot(row.knot),
      finish: finishOf(row.finish),
      shade: shadeOf(row.shade),
      chip: kamalChip(row.chip) ?? 2,
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

export function addKamal(
  cards: readonly KamalSight[],
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
): KamalSight[] {
  const current = readKamals(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: KamalSight = {
    id,
    title,
    note: noteOf(card.note),
    helmsman: clip(card.helmsman, 24),
    mast: mastOf(card.mast),
    knot: kamalKnot(card.knot),
    finish: finishOf(card.finish),
    shade: shadeOf(card.shade),
    chip: kamalChip(card.chip) ?? 2,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly KamalSight[], id: string, change: (card: KamalSight) => KamalSight): KamalSight[] {
  return readKamals(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly KamalSight[], ids: readonly string[], change: (card: KamalSight) => KamalSight): KamalSight[] {
  const picked = new Set(ids);
  return readKamals(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editKamal(cards: readonly KamalSight[], id: string, title: string): KamalSight[] {
  const next = lineOf(title);
  if (!next) return readKamals(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editKamalNote(cards: readonly KamalSight[], id: string, note: string): KamalSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setKamalLogged(cards: readonly KamalSight[], id: string, logged: boolean): KamalSight[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setKamalLock(cards: readonly KamalSight[], id: string, locked: boolean): KamalSight[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setKamalStow(cards: readonly KamalSight[], id: string, stowed: boolean): KamalSight[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setKamalStar(cards: readonly KamalSight[], id: string, flagged: boolean): KamalSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setKamalFinish(cards: readonly KamalSight[], id: string, finish: unknown): KamalSight[] {
  const next = finishOf(finish);
  if (!next) return readKamals(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Shade steps sand, soot, gilt, then sand again. A blank shade starts at sand. */
export function cycleShade(cards: readonly KamalSight[], id: string): KamalSight[] {
  return mapCard(cards, id, (card) => {
    const at = SHADES.indexOf(card.shade as (typeof SHADES)[number]);
    const next = at < 0 ? SHADES[0] : SHADES[(at + 1) % SHADES.length];
    return next === card.shade ? card : { ...card, shade: next, audit: "shade" };
  });
}

export function addKamalTag(cards: readonly KamalSight[], id: string, tag: string): KamalSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readKamals(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank knot becomes 5, 5 becomes 15, and 15 becomes 45. A knot of 45 stays. */
export function liftKnot(cards: readonly KamalSight[], id: string): KamalSight[] {
  return mapCard(cards, id, (card) => {
    if (card.knot === 45) return card;
    const next = card.knot === 15 ? 45 : card.knot === 5 ? 15 : 5;
    return { ...card, knot: next, audit: "knot" };
  });
}

/** A blank knot becomes 45, 45 becomes 15, and 15 becomes 5. A knot of 5 stays. */
export function dipKnot(cards: readonly KamalSight[], id: string): KamalSight[] {
  return mapCard(cards, id, (card) => {
    if (card.knot === 5) return card;
    const next = card.knot === 15 ? 5 : card.knot === 45 ? 15 : 45;
    return { ...card, knot: next, audit: "dip" };
  });
}

export function raiseChip(cards: readonly KamalSight[], id: string): KamalSight[] {
  return mapCard(cards, id, (card) => {
    const at = chipIndex(card.chip);
    if (at < 0) return { ...card, chip: 2, audit: "chip" };
    if (at === CHIP_CYCLE.length - 1) return card;
    return { ...card, chip: CHIP_CYCLE[at + 1], audit: "chip" };
  });
}

export function lowerChip(cards: readonly KamalSight[], id: string): KamalSight[] {
  return mapCard(cards, id, (card) => {
    const at = chipIndex(card.chip);
    if (at <= 0) return card;
    return { ...card, chip: CHIP_CYCLE[at - 1], audit: "chip" };
  });
}

export function bulkKamalLog(cards: readonly KamalSight[], ids: readonly string[]): KamalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkKamalStow(cards: readonly KamalSight[], ids: readonly string[]): KamalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkKamalGilt(cards: readonly KamalSight[], ids: readonly string[]): KamalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, shade: "gilt", audit: "shade" }));
}

export function bulkKamalChampagne(cards: readonly KamalSight[], ids: readonly string[]): KamalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkKamalTag(cards: readonly KamalSight[], ids: readonly string[], tag: string): KamalSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readKamals(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly KamalSight[], ids: readonly string[], index: number, change: (list: readonly KamalSight[], id: string) => KamalSight[]): KamalSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readKamals(cards);
}

export function liftKnotFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  return focused(cards, ids, index, liftKnot);
}

export function dipKnotFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  return focused(cards, ids, index, dipKnot);
}

export function toneFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  return focused(cards, ids, index, cycleShade);
}

export function raiseChipFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  return focused(cards, ids, index, raiseChip);
}

export function lowerChipFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  return focused(cards, ids, index, lowerChip);
}

export function logKamalFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  const id = ids[index];
  if (!id) return readKamals(cards);
  const card = readKamals(cards).find((item) => item.id === id);
  return card ? setKamalLogged(cards, id, !card.logged) : readKamals(cards);
}

export function lockKamalFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  const id = ids[index];
  if (!id) return readKamals(cards);
  const card = readKamals(cards).find((item) => item.id === id);
  return card ? setKamalLock(cards, id, !card.locked) : readKamals(cards);
}

export function starKamalFocused(cards: readonly KamalSight[], ids: readonly string[], index: number): KamalSight[] {
  const id = ids[index];
  if (!id) return readKamals(cards);
  const card = readKamals(cards).find((item) => item.id === id);
  return card ? setKamalStar(cards, id, !card.flagged) : readKamals(cards);
}

export function tagKamalFocused(cards: readonly KamalSight[], ids: readonly string[], index: number, tag: string): KamalSight[] {
  const id = ids[index];
  return id ? addKamalTag(cards, id, tag) : readKamals(cards);
}

export function readKamalViews(raw: unknown): KamalView[] {
  if (!Array.isArray(raw)) return [];
  const out: KamalView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KamalView>;
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

export function addKamalView(
  views: readonly KamalView[],
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
): KamalView[] {
  const current = readKamalViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: KamalView = {
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

export function dropKamalView(views: readonly KamalView[], id: string): KamalView[] {
  return readKamalViews(views).filter((view) => view.id !== id);
}

export function kamalDensity(raw: unknown): KamalDensity {
  return raw === "close" ? "close" : "open";
}

/** A sight more than one mast behind the desk, at chip 2, is late. */
export function lateKamal(card: KamalSight, deskMast: unknown): boolean {
  const gap = mastGap(card.mast, deskMast);
  return card.chip === 2 && gap !== null && gap > 1;
}

export function idleKamal(card: KamalSight): boolean {
  return card.shade === "sand" && stillMast(card.mast) && card.chip === 2;
}

export function briskKamal(card: KamalSight): boolean {
  return card.chip === 8 && card.shade === "gilt" && keenMast(card.mast);
}

export function restingKamal(card: KamalSight): boolean {
  return card.knot === 45 && card.shade === "soot" && card.mast === "jigger";
}

/** A knot of five on a keen mast is overdue unless the sight is logged. */
export function overdueKamal(card: KamalSight): boolean {
  return card.knot === 5 && keenMast(card.mast) && !card.logged;
}

export function visibleKamals(
  cards: readonly KamalSight[],
  tray: KamalTray,
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
): KamalSight[] {
  const text = query.trim().toLowerCase();
  const helmOn = helmsman === "all" ? "" : helmsman.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : finishOf(finish);
  const shadeOn = shade === "all" ? "" : shadeOf(shade);
  const mastOn = mast === "all" ? "" : activeMast(mast);
  const knotOn = knot === "all" ? "" : activeKnot(knot);
  const chipOn = chip === "all" ? "" : activeChip(chip);
  return readKamals(cards).filter((card) => {
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

export function sortKamals(cards: readonly KamalSight[], sort: KamalSort): KamalSight[] {
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

export function kamalCounts(cards: readonly KamalSight[], shown: readonly KamalSight[], deskMast: unknown): KamalCounts {
  const open = cards.filter((card) => inTray(card, "deck"));
  return {
    deck: open.length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    bilge: cards.filter((card) => inTray(card, "bilge")).length,
    logged: open.filter((card) => card.logged).length,
    keen: open.filter((card) => keenMast(card.mast)).length,
    still: open.filter((card) => stillMast(card.mast)).length,
    soon: open.filter((card) => card.knot === 5).length,
    chip: open.reduce((sum, card) => sum + card.chip, 0),
    house: open.filter((card) => houseFinish(card.finish)).length,
    knot: open.filter((card) => card.knot !== null).length,
    matched: shown.filter((card) => card.mast && card.mast === mastOf(deskMast)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleKamal(card)).length,
    brisk: open.filter((card) => briskKamal(card)).length,
    resting: open.filter((card) => restingKamal(card)).length,
    overdue: open.filter((card) => overdueKamal(card)).length,
    even: open.filter((card) => evenChip(card.chip)).length,
  };
}

export function clashMastCount(cards: readonly KamalSight[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && card.mast);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.mast === card.mast && other.chip === card.chip)).length;
}

export function neighborKamalCount(cards: readonly KamalSight[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && chipIndex(card.chip) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(chipIndex(other.chip) - chipIndex(card.chip));
    const ring = Math.min(gap, CHIP_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly KamalSight[]): string {
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

export function reminderKamals(cards: readonly KamalSight[]): KamalSight[] {
  return cards.filter((card) => inTray(card, "deck") && (card.knot === 5 || card.knot === 15));
}

export function idleKamals(cards: readonly KamalSight[]): KamalSight[] {
  return cards.filter((card) => inTray(card, "deck") && idleKamal(card));
}

export function kamalTimeline(cards: readonly KamalSight[]): { chip: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return CHIP_CYCLE.map((chip) => ({ chip, titles: open.filter((card) => card.chip === chip).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function kamalBars(cards: readonly KamalSight[]): { mast: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return KAMAL_MASTS.map((mast) => ({ mast, count: open.filter((card) => card.mast === mast).length }));
}

export function kamalKeepers(cards: readonly KamalSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helmsman || out.some((item) => item.toLowerCase() === card.helmsman.toLowerCase())) continue;
    out.push(card.helmsman);
  }
  return out;
}

export function kamalCopy(card: KamalSight): string {
  return [card.title, card.helmsman, card.mast, card.finish, card.shade, card.knot ?? "", card.chip, card.note].filter((item) => item !== "").join(" · ");
}

export function kamalCsv(cards: readonly KamalSight[], deskMast: unknown): string {
  const lines = ["title,helmsman,mast,finish,shade,knot,chip,tags,logged,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,even,audit,note"];
  for (const card of readKamals(cards)) {
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
      lateKamal(card, deskMast) ? "1" : "0",
      idleKamal(card) ? "1" : "0",
      keenMast(card.mast) ? "1" : "0",
      stillMast(card.mast) ? "1" : "0",
      houseFinish(card.finish) ? "1" : "0",
      mastBand(card.mast),
      briskKamal(card) ? "1" : "0",
      restingKamal(card) ? "1" : "0",
      overdueKamal(card) ? "1" : "0",
      evenChip(card.chip) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function deskRecord(raw: DeskValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: DeskValue): boolean {
  const row = deskRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type DeskParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; words: number; seps: number; digit: boolean; space: boolean };

function deskText(raw: DeskValue): string {
  if (hasBlocked(raw)) return "";
  const row = deskRecord(raw);
  if (row && !("desk" in row) && !("code" in row)) return "";
  return row ? clip(row.desk ?? row.code, 32) : clip(raw, 32);
}

function deskParts(raw: DeskValue): DeskParts | null {
  const text = deskText(raw);
  if (!/^[A-Za-z][A-Za-z0-9_\/ -]{1,23}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 16) return null;
  const words = text.split(/\s+/).filter(Boolean).length;
  const seps = (text.match(/[_/\-]/g) || []).length;
  return {
    letters,
    given: text,
    wide: /_/.test(text),
    notch: /-/.test(text),
    slash: /\//.test(text),
    words,
    seps,
    digit: /\d/.test(text),
    space: words >= 2,
  };
}

/** A blocked money field clears the plate. A real desk name is set. A blank or broken name is clear. */
export function deskState(raw: DeskValue): DeskState {
  if (hasBlocked(raw)) return "";
  const row = deskRecord(raw);
  if (row && !("desk" in row) && !("code" in row)) return "";
  return deskParts(raw) ? "set" : "clear";
}

/** A known name is a house. A digit is a watch. A hyphen is a berth. A space is a span. A vowel start is a gallery. */
export function deskLane(raw: DeskValue): DeskLane {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  if (!parts) return "";
  const key = parts.given.toLowerCase();
  if (KNOWN.has(key)) return "house";
  if (parts.digit) return "watch";
  if (parts.notch) return "berth";
  if (parts.space) return "span";
  if (/^[aeiou]/i.test(parts.letters)) return "gallery";
  return "plain";
}

/** The last three letters. */
export function deskStamp(raw: DeskValue): string {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return parts ? parts.letters.slice(-3).toUpperCase() : "";
}

/** A watch is ivory. A berth is champagne. A gallery is graphite. A house follows S or V. */
export function deskHue(raw: DeskValue): DeskHue {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  if (!parts) return "";
  const lane = deskLane(raw);
  if (lane === "watch" || lane === "span") return "ivory";
  if (lane === "berth") return "champagne";
  if (lane === "gallery") return "graphite";
  if (lane === "house") {
    const head = parts.letters[0].toUpperCase();
    return head === "S" || head === "V" ? "champagne" : "graphite";
  }
  const code = parts.letters[0].toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 77) return "ivory";
  return "champagne";
}

export function deskTwin(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function deskWide(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function deskNotch(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function deskEcho(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function deskLeap(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && parts.letters.length === 6);
}

export function deskSlash(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function deskKnown(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toLowerCase()));
}

export function deskCap(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

/** A consonant ending. A vowel ending is not a tail. */
export function deskTail(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && /[^aeiou]$/i.test(parts.letters));
}

export function deskVowel(raw: DeskValue): boolean {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return Boolean(parts && /^[aeiou]/i.test(parts.letters));
}

export function deskWords(raw: DeskValue): number {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return parts ? parts.words : 0;
}

export function deskStep(raw: DeskValue): number {
  const parts = deskState(raw) === "set" ? deskParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function deskLanes(rows: readonly DeskRow[]): DeskLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = deskLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingDesk(rows: readonly DeskRow[]): string {
  const bars = deskLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingDeskHue(rows: readonly DeskRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = deskHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedDeskCount(rows: readonly DeskRow[]): number {
  const marks = rows.map((row) => deskStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneDeskCount(rows: readonly DeskRow[], lane: DeskLane): number {
  return rows.filter((row) => deskLane(row.note) === lane).length;
}

export function deskShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDeskLanes(rows: readonly DeskRow[]): string[] {
  return deskLanes(rows).map((line) => line.lane);
}

export function readHiddenDesks(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDesks(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDesk(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleDeskReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDeskReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDeskLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleDesks(
  rows: readonly DeskRow[],
  lane: string,
  hue: string,
  query: string,
  review: DeskReview,
  reviewed: readonly string[],
  shape: DeskShape,
): DeskRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (deskState(row.note) === "") return false;
    const found = deskLane(row.note);
    const hueName = deskHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${deskText(row.note)} ${deskStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "gallery" && found !== "gallery") return false;
    if (shape === "watch" && found !== "watch") return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "berth" && found !== "berth") return false;
    if (shape === "span" && found !== "span") return false;
    if (shape === "plain" && found !== "plain") return false;
    if (shape === "wide" && !deskWide(row.note)) return false;
    if (shape === "notch" && !deskNotch(row.note)) return false;
    if (shape === "leap" && !deskLeap(row.note)) return false;
    if (shape === "slash" && !deskSlash(row.note)) return false;
    if (shape === "twin" && !deskTwin(row.note)) return false;
    if (shape === "known" && !deskKnown(row.note)) return false;
    if (shape === "echo" && !deskEcho(row.note)) return false;
    if (shape === "vowel" && !deskVowel(row.note)) return false;
    return true;
  });
}

export function deskCopy(raw: DeskValue): string {
  return [deskStamp(raw), deskLane(raw), deskHue(raw)].filter(Boolean).join(" ");
}

export function deskLanesCsv(rows: readonly DeskRow[]): string {
  const lines = ["lane,count"];
  for (const line of deskLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function deskRowsCsv(rows: readonly DeskRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,words,echo,wide,notch,leap,slash,twin,known,cap,tail,vowel,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (deskState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(deskText(row.note)),
      deskStamp(row.note),
      deskLane(row.note),
      deskHue(row.note),
      String(deskStep(row.note)),
      String(deskWords(row.note)),
      deskEcho(row.note) ? "1" : "0",
      deskWide(row.note) ? "1" : "0",
      deskNotch(row.note) ? "1" : "0",
      deskLeap(row.note) ? "1" : "0",
      deskSlash(row.note) ? "1" : "0",
      deskTwin(row.note) ? "1" : "0",
      deskKnown(row.note) ? "1" : "0",
      deskCap(row.note) ? "1" : "0",
      deskTail(row.note) ? "1" : "0",
      deskVowel(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
