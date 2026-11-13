/**
 * Nocturnal sights for a night book kept in this browser, and address plates read the street already stored on the account.
 * Stations are polaris, pointer, guard, and dial. Tones are pearl, ink, and brass.
 * Watches are 15, 45, or 75. Teeth are 2, 6, or 9.
 * A comma is a court. A hyphen is a mews. A digit is a number. Three words are a square.
 * A vowel start is a row. Any other set address is a close.
 * MAIN STREET, HIGH STREET, KING STREET, and QUEEN STREET are known.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_nocturnal_sight (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   station text not null default '',
 *   metal text not null default '',
 *   tone text not null default '',
 *   watch_no integer,
 *   tooth_no integer not null default 2,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_address_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_address_review (
 *   trader_id text primary key
 * );
 */

export const NOC_KEY = "crmv4-nocturnal-sight";
export const NOC_VIEW_KEY = "crmv4-nocturnal-views";
export const NOC_DENSITY_KEY = "crmv4-nocturnal-density";
export const ADP_KEY = "crmv4-address-hide";
export const ADP_REVIEW_KEY = "crmv4-address-review";

export const NOCTURNAL_STATIONS = ["polaris", "pointer", "guard", "dial"] as const;

export type NocturnalStation = (typeof NOCTURNAL_STATIONS)[number];

export type MetalName = "blank" | "ivory" | "graphite" | "champagne";

export type ToneName = "blank" | "pearl" | "ink" | "brass";

export type NocturnalTray = "night" | "chest" | "hold";

export type NocturnalDensity = "open" | "close";

export type NocturnalSort = "band" | "keeper";

export type NocturnalSight = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  station: string;
  watch: number | null;
  metal: string;
  tone: string;
  tooth: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type NocturnalView = {
  id: string;
  name: string;
  tray: NocturnalTray;
  query: string;
  keeper: string;
  metal: string;
  tone: string;
  station: string;
  watch: string;
  tooth: string;
};

export type NocturnalCounts = {
  night: number;
  chest: number;
  hold: number;
  logged: number;
  keen: number;
  still: number;
  soon: number;
  tooth: number;
  house: number;
  watch: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  even: number;
};

export type AddressLane = "" | "court" | "mews" | "number" | "square" | "row" | "close";

export type AddressHue = "" | "ivory" | "graphite" | "champagne";

export type AddressState = "" | "clear" | "set";

export type AddressShape = "all" | "court" | "mews" | "number" | "square" | "row" | "close" | "wide" | "notch" | "leap" | "slash" | "twin" | "known" | "echo" | "vowel";

export type AddressReview = "all" | "reviewed" | "fresh";

export type AddressValue = string | { address?: unknown; code?: unknown; [key: string]: unknown } | null | undefined;

export type AddressRow = { id: string; label: string; note: AddressValue };

export type AddressLaneLine = { lane: string; count: number };

export const ROUND281_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "watch",
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
  "address",
  "address-csv",
] as const;

const AUDITS = ["save", "edit", "note", "tone", "log", "unlog", "lock", "resume", "stow", "open", "metal", "tag", "tooth", "watch", "dip", "star"] as const;

const METALS = ["ivory", "graphite", "champagne"] as const;

const TONES = ["pearl", "ink", "brass"] as const;

const WATCH_CYCLE = [15, 45, 75] as const;

const TOOTH_CYCLE = [2, 6, 9] as const;

const KEEN = new Set(["pointer", "dial"]);

const STILL = new Set(["polaris", "guard"]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const WATCH_BAND = new Set(["polaris"]);

const LANE_ORDER = ["court", "mews", "number", "square", "row", "close"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const KNOWN = new Set(["MAIN STREET", "HIGH STREET", "KING STREET", "QUEEN STREET"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): NocturnalTray {
  return raw === "chest" || raw === "hold" ? raw : "night";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function metalName(raw: unknown): Exclude<MetalName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<MetalName, "blank">) : "";
}

function toneName(raw: unknown): Exclude<ToneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<ToneName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ns]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: NocturnalSight, tray: NocturnalTray): boolean {
  if (tray === "chest") return card.locked && !card.stowed;
  if (tray === "hold") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return NOCTURNAL_STATIONS.indexOf(station as NocturnalStation);
}

function toothIndex(tooth: number): number {
  return TOOTH_CYCLE.indexOf(tooth as (typeof TOOTH_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

export function stationOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (NOCTURNAL_STATIONS as readonly string[]).includes(text) ? text : "";
}

/** A watch is 15, 45, or 75. Anything else stays blank. */
export function nocturnalWatch(raw: unknown): 15 | 45 | 75 | null {
  const text = clip(raw, 2);
  if (!text) return null;
  const value = Number(text);
  return (WATCH_CYCLE as readonly number[]).includes(value) ? (value as 15 | 45 | 75) : null;
}

/** A tooth is 2, 6, or 9. Anything else stays blank. */
export function nocturnalTooth(raw: unknown): 2 | 6 | 9 | null {
  const text = clip(raw, 1);
  if (!text) return null;
  const value = Number(text);
  return (TOOTH_CYCLE as readonly number[]).includes(value) ? (value as 2 | 6 | 9) : null;
}

/** Metal is ivory, graphite, or champagne. The saved metal is the upper case name. */
export function metalOf(raw: unknown): string {
  const text = metalName(raw);
  return text ? text.toUpperCase() : "";
}

/** Tone is pearl, ink, or brass. A blank tone stays blank. */
export function toneOf(raw: unknown): string {
  return toneName(raw);
}

export function keenStation(station: unknown): boolean {
  return KEEN.has(clip(station, 12).toLowerCase());
}

export function stillStation(station: unknown): boolean {
  return STILL.has(clip(station, 12).toLowerCase());
}

/** Polaris is the watch. Pointer is the rise. Guard is the set. Dial is the dark. */
export function stationBand(station: unknown): string {
  const text = stationOf(station);
  if (!text) return "";
  if (WATCH_BAND.has(text)) return "watch";
  if (text === "pointer") return "rise";
  if (text === "guard") return "set";
  return "dark";
}

/** Signed distance from one station to the desk station. */
export function stationGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(stationOf(from));
  const right = stationIndex(stationOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseMetal(metal: unknown): boolean {
  return HOUSE.has(metalOf(metal));
}

/** An even tooth is 6. Two and nine are odd. A blank tooth is not even. */
export function evenTooth(tooth: unknown): boolean {
  return nocturnalTooth(tooth) === 6;
}

export function activeStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "keen" || text === "still") return text;
  return stationOf(text) || "all";
}

export function activeWatch(raw: unknown): string {
  const watch = nocturnalWatch(raw);
  return watch === null ? "all" : String(watch);
}

export function activeTone(raw: unknown, allow: readonly string[]): string {
  const text = toneOf(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTooth(raw: unknown): string {
  const tooth = nocturnalTooth(raw);
  return tooth === null ? "all" : String(tooth);
}

export function activeMetal(raw: unknown): string {
  const text = metalName(raw);
  return text || "all";
}

export function moveNocturnalFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestMetal(cards: readonly NocturnalSight[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "night") || !card.metal) continue;
    counts.set(card.metal, (counts.get(card.metal) || 0) + 1);
  }
  let best = "IVORY";
  let score = 0;
  for (const metal of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(metal) || 0;
    if (count > score) {
      best = metal;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest fifteen. Through the afternoon, forty-five. Night asks for seventy-five. Saved watches win when any exist. */
export function suggestWatch(cards: readonly NocturnalSight[], hour: number): 15 | 45 | 75 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "night") || card.watch === null) continue;
    counts.set(card.watch, (counts.get(card.watch) || 0) + 1);
  }
  let best: 15 | 45 | 75 | null = null;
  let score = 0;
  for (const watch of WATCH_CYCLE) {
    const count = counts.get(watch) || 0;
    if (count > score) {
      best = watch;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 6) return 15;
  if (hour < 16) return 45;
  return 75;
}

/** Before nine, suggest Polaris. The rest of the day suggests the dial. */
export function suggestStation(hour: number): NocturnalStation {
  return hour < 9 ? "polaris" : "dial";
}

/** The keeper with the fewest unlogged night sights. A tie keeps the roster order. */
export function fairKeeper(cards: readonly NocturnalSight[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "night") && !card.logged);
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

export function readNocturnals(raw: unknown): NocturnalSight[] {
  if (!Array.isArray(raw)) return [];
  const out: NocturnalSight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NocturnalSight>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      station: stationOf(row.station),
      watch: nocturnalWatch(row.watch),
      metal: metalOf(row.metal),
      tone: toneOf(row.tone),
      tooth: nocturnalTooth(row.tooth) ?? 2,
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

export function addNocturnal(
  cards: readonly NocturnalSight[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    station?: string;
    watch?: unknown;
    metal?: string;
    tone?: string;
    tooth?: unknown;
    tags?: string;
  },
): NocturnalSight[] {
  const current = readNocturnals(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: NocturnalSight = {
    id,
    title,
    note: noteOf(card.note),
    keeper: clip(card.keeper, 24),
    station: stationOf(card.station),
    watch: nocturnalWatch(card.watch),
    metal: metalOf(card.metal),
    tone: toneOf(card.tone),
    tooth: nocturnalTooth(card.tooth) ?? 2,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly NocturnalSight[], id: string, change: (card: NocturnalSight) => NocturnalSight): NocturnalSight[] {
  return readNocturnals(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly NocturnalSight[], ids: readonly string[], change: (card: NocturnalSight) => NocturnalSight): NocturnalSight[] {
  const picked = new Set(ids);
  return readNocturnals(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editNocturnal(cards: readonly NocturnalSight[], id: string, title: string): NocturnalSight[] {
  const next = lineOf(title);
  if (!next) return readNocturnals(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editNocturnalNote(cards: readonly NocturnalSight[], id: string, note: string): NocturnalSight[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setNocturnalLogged(cards: readonly NocturnalSight[], id: string, logged: boolean): NocturnalSight[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setNocturnalLock(cards: readonly NocturnalSight[], id: string, locked: boolean): NocturnalSight[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setNocturnalStow(cards: readonly NocturnalSight[], id: string, stowed: boolean): NocturnalSight[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setNocturnalStar(cards: readonly NocturnalSight[], id: string, flagged: boolean): NocturnalSight[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setNocturnalMetal(cards: readonly NocturnalSight[], id: string, metal: unknown): NocturnalSight[] {
  const next = metalOf(metal);
  if (!next) return readNocturnals(cards);
  return mapCard(cards, id, (card) => (card.metal === next ? card : { ...card, metal: next, audit: "metal" }));
}

/** Tone steps pearl, ink, brass, then pearl again. A blank tone starts at pearl. */
export function cycleTone(cards: readonly NocturnalSight[], id: string): NocturnalSight[] {
  return mapCard(cards, id, (card) => {
    const at = TONES.indexOf(card.tone as (typeof TONES)[number]);
    const next = at < 0 ? TONES[0] : TONES[(at + 1) % TONES.length];
    return next === card.tone ? card : { ...card, tone: next, audit: "tone" };
  });
}

export function addNocturnalTag(cards: readonly NocturnalSight[], id: string, tag: string): NocturnalSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readNocturnals(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank watch becomes 15, 15 becomes 45, and 45 becomes 75. A watch of 75 stays. */
export function liftWatch(cards: readonly NocturnalSight[], id: string): NocturnalSight[] {
  return mapCard(cards, id, (card) => {
    if (card.watch === 75) return card;
    const next = card.watch === 45 ? 75 : card.watch === 15 ? 45 : 15;
    return { ...card, watch: next, audit: "watch" };
  });
}

/** A blank watch becomes 75, 75 becomes 45, and 45 becomes 15. A watch of 15 stays. */
export function dipWatch(cards: readonly NocturnalSight[], id: string): NocturnalSight[] {
  return mapCard(cards, id, (card) => {
    if (card.watch === 15) return card;
    const next = card.watch === 45 ? 15 : card.watch === 75 ? 45 : 75;
    return { ...card, watch: next, audit: "dip" };
  });
}

export function raiseTooth(cards: readonly NocturnalSight[], id: string): NocturnalSight[] {
  return mapCard(cards, id, (card) => {
    const at = toothIndex(card.tooth);
    if (at < 0) return { ...card, tooth: 2, audit: "tooth" };
    if (at === TOOTH_CYCLE.length - 1) return card;
    return { ...card, tooth: TOOTH_CYCLE[at + 1], audit: "tooth" };
  });
}

export function lowerTooth(cards: readonly NocturnalSight[], id: string): NocturnalSight[] {
  return mapCard(cards, id, (card) => {
    const at = toothIndex(card.tooth);
    if (at <= 0) return card;
    return { ...card, tooth: TOOTH_CYCLE[at - 1], audit: "tooth" };
  });
}

export function bulkNocturnalLog(cards: readonly NocturnalSight[], ids: readonly string[]): NocturnalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkNocturnalStow(cards: readonly NocturnalSight[], ids: readonly string[]): NocturnalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkNocturnalBrass(cards: readonly NocturnalSight[], ids: readonly string[]): NocturnalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, tone: "brass", audit: "tone" }));
}

export function bulkNocturnalChampagne(cards: readonly NocturnalSight[], ids: readonly string[]): NocturnalSight[] {
  return touchIds(cards, ids, (card) => ({ ...card, metal: "CHAMPAGNE", audit: "metal" }));
}

export function bulkNocturnalTag(cards: readonly NocturnalSight[], ids: readonly string[], tag: string): NocturnalSight[] {
  const next = tagsOf(tag)[0];
  if (!next) return readNocturnals(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly NocturnalSight[], ids: readonly string[], index: number, change: (list: readonly NocturnalSight[], id: string) => NocturnalSight[]): NocturnalSight[] {
  const id = ids[index];
  return id ? change(cards, id) : readNocturnals(cards);
}

export function liftWatchFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  return focused(cards, ids, index, liftWatch);
}

export function dipWatchFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  return focused(cards, ids, index, dipWatch);
}

export function toneFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  return focused(cards, ids, index, cycleTone);
}

export function raiseToothFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  return focused(cards, ids, index, raiseTooth);
}

export function lowerToothFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  return focused(cards, ids, index, lowerTooth);
}

export function logNocturnalFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  const id = ids[index];
  if (!id) return readNocturnals(cards);
  const card = readNocturnals(cards).find((item) => item.id === id);
  return card ? setNocturnalLogged(cards, id, !card.logged) : readNocturnals(cards);
}

export function lockNocturnalFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  const id = ids[index];
  if (!id) return readNocturnals(cards);
  const card = readNocturnals(cards).find((item) => item.id === id);
  return card ? setNocturnalLock(cards, id, !card.locked) : readNocturnals(cards);
}

export function starNocturnalFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number): NocturnalSight[] {
  const id = ids[index];
  if (!id) return readNocturnals(cards);
  const card = readNocturnals(cards).find((item) => item.id === id);
  return card ? setNocturnalStar(cards, id, !card.flagged) : readNocturnals(cards);
}

export function tagNocturnalFocused(cards: readonly NocturnalSight[], ids: readonly string[], index: number, tag: string): NocturnalSight[] {
  const id = ids[index];
  return id ? addNocturnalTag(cards, id, tag) : readNocturnals(cards);
}

export function readNocturnalViews(raw: unknown): NocturnalView[] {
  if (!Array.isArray(raw)) return [];
  const out: NocturnalView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NocturnalView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      metal: activeMetal(row.metal),
      tone: activeTone(row.tone, TONES),
      station: activeStation(row.station),
      watch: activeWatch(row.watch),
      tooth: activeTooth(row.tooth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addNocturnalView(
  views: readonly NocturnalView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    keeper?: string;
    metal?: string;
    tone?: string;
    station?: string;
    watch?: string;
    tooth?: string;
  },
): NocturnalView[] {
  const current = readNocturnalViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: NocturnalView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    metal: activeMetal(view.metal),
    tone: activeTone(view.tone, TONES),
    station: activeStation(view.station),
    watch: activeWatch(view.watch),
    tooth: activeTooth(view.tooth),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropNocturnalView(views: readonly NocturnalView[], id: string): NocturnalView[] {
  return readNocturnalViews(views).filter((view) => view.id !== id);
}

export function nocturnalDensity(raw: unknown): NocturnalDensity {
  return raw === "close" ? "close" : "open";
}

/** A sight more than one station behind the desk, at tooth 2, is late. */
export function lateNocturnal(card: NocturnalSight, deskStation: unknown): boolean {
  const gap = stationGap(card.station, deskStation);
  return card.tooth === 2 && gap !== null && gap > 1;
}

export function idleNocturnal(card: NocturnalSight): boolean {
  return card.tone === "pearl" && stillStation(card.station) && card.tooth === 2;
}

export function briskNocturnal(card: NocturnalSight): boolean {
  return card.tooth === 9 && card.tone === "brass" && keenStation(card.station);
}

export function restingNocturnal(card: NocturnalSight): boolean {
  return card.watch === 75 && card.tone === "ink" && card.station === "dial";
}

/** A watch of fifteen on a keen station is overdue unless the sight is logged. */
export function overdueNocturnal(card: NocturnalSight): boolean {
  return card.watch === 15 && keenStation(card.station) && !card.logged;
}

export function visibleNocturnals(
  cards: readonly NocturnalSight[],
  tray: NocturnalTray,
  query: string,
  keeper: string,
  metal: string,
  tone: string,
  station: string,
  watch: string,
  tooth: string,
  houseOnly: boolean,
  keenOnly: boolean,
  stillOnly: boolean,
): NocturnalSight[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const metalOn = metal === "all" ? "" : metalOf(metal);
  const toneOn = tone === "all" ? "" : toneOf(tone);
  const stationOn = station === "all" ? "" : activeStation(station);
  const watchOn = watch === "all" ? "" : activeWatch(watch);
  const toothOn = tooth === "all" ? "" : activeTooth(tooth);
  return readNocturnals(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && card.keeper.toLowerCase() !== keeperOn) return false;
    if (metalOn && card.metal !== metalOn) return false;
    if (toneOn && card.tone !== toneOn) return false;
    if (stationOn === "keen" && !keenStation(card.station)) return false;
    if (stationOn === "still" && !stillStation(card.station)) return false;
    if (stationOn && stationOn !== "keen" && stationOn !== "still" && card.station !== stationOn) return false;
    if (watchOn && String(card.watch ?? "") !== watchOn) return false;
    if (toothOn && String(card.tooth) !== toothOn) return false;
    if (houseOnly && !houseMetal(card.metal)) return false;
    if (keenOnly && !keenStation(card.station)) return false;
    if (stillOnly && !stillStation(card.station)) return false;
    return true;
  });
}

export function sortNocturnals(cards: readonly NocturnalSight[], sort: NocturnalSort): NocturnalSight[] {
  return cards.slice().sort((a, b) => {
    if (a.logged !== b.logged) return a.logged ? -1 : 1;
    if (sort === "keeper") {
      const helm = a.keeper.localeCompare(b.keeper);
      if (helm) return helm;
    }
    const station = (stationIndex(a.station) < 0 ? 99 : stationIndex(a.station)) - (stationIndex(b.station) < 0 ? 99 : stationIndex(b.station));
    if (station) return station;
    return a.title.localeCompare(b.title);
  });
}

export function nocturnalCounts(cards: readonly NocturnalSight[], shown: readonly NocturnalSight[], deskStation: unknown): NocturnalCounts {
  const open = cards.filter((card) => inTray(card, "night"));
  return {
    night: open.length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    hold: cards.filter((card) => inTray(card, "hold")).length,
    logged: open.filter((card) => card.logged).length,
    keen: open.filter((card) => keenStation(card.station)).length,
    still: open.filter((card) => stillStation(card.station)).length,
    soon: open.filter((card) => card.watch === 15).length,
    tooth: open.reduce((sum, card) => sum + card.tooth, 0),
    house: open.filter((card) => houseMetal(card.metal)).length,
    watch: open.filter((card) => card.watch !== null).length,
    matched: shown.filter((card) => card.station && card.station === stationOf(deskStation)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleNocturnal(card)).length,
    brisk: open.filter((card) => briskNocturnal(card)).length,
    resting: open.filter((card) => restingNocturnal(card)).length,
    overdue: open.filter((card) => overdueNocturnal(card)).length,
    even: open.filter((card) => evenTooth(card.tooth)).length,
  };
}

export function clashStationCount(cards: readonly NocturnalSight[]): number {
  const open = cards.filter((card) => inTray(card, "night") && card.station);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.station === card.station && other.tooth === card.tooth)).length;
}

export function neighborNocturnalCount(cards: readonly NocturnalSight[]): number {
  const open = cards.filter((card) => inTray(card, "night") && toothIndex(card.tooth) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(toothIndex(other.tooth) - toothIndex(card.tooth));
    const ring = Math.min(gap, TOOTH_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(cards: readonly NocturnalSight[]): string {
  const open = cards.filter((card) => inTray(card, "night") && card.keeper);
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

export function reminderNocturnals(cards: readonly NocturnalSight[]): NocturnalSight[] {
  return cards.filter((card) => inTray(card, "night") && (card.watch === 15 || card.watch === 45));
}

export function idleNocturnals(cards: readonly NocturnalSight[]): NocturnalSight[] {
  return cards.filter((card) => inTray(card, "night") && idleNocturnal(card));
}

export function nocturnalTimeline(cards: readonly NocturnalSight[]): { tooth: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "night"));
  return TOOTH_CYCLE.map((tooth) => ({ tooth, titles: open.filter((card) => card.tooth === tooth).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function nocturnalBars(cards: readonly NocturnalSight[]): { station: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "night"));
  return NOCTURNAL_STATIONS.map((station) => ({ station, count: open.filter((card) => card.station === station).length }));
}

export function nocturnalKeepers(cards: readonly NocturnalSight[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.keeper || out.some((item) => item.toLowerCase() === card.keeper.toLowerCase())) continue;
    out.push(card.keeper);
  }
  return out;
}

export function nocturnalCopy(card: NocturnalSight): string {
  return [card.title, card.keeper, card.station, card.metal, card.tone, card.watch ?? "", card.tooth, card.note].filter((item) => item !== "").join(" · ");
}

export function nocturnalCsv(cards: readonly NocturnalSight[], deskStation: unknown): string {
  const lines = ["title,keeper,station,metal,tone,watch,tooth,tags,logged,locked,stowed,starred,gap,late,idle,keen,still,house,band,brisk,resting,overdue,even,audit,note"];
  for (const card of readNocturnals(cards)) {
    const gap = stationGap(card.station, deskStation);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.station,
      card.metal,
      card.tone,
      card.watch === null ? "" : String(card.watch),
      String(card.tooth),
      card.tags.join(" "),
      card.logged ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateNocturnal(card, deskStation) ? "1" : "0",
      idleNocturnal(card) ? "1" : "0",
      keenStation(card.station) ? "1" : "0",
      stillStation(card.station) ? "1" : "0",
      houseMetal(card.metal) ? "1" : "0",
      stationBand(card.station),
      briskNocturnal(card) ? "1" : "0",
      restingNocturnal(card) ? "1" : "0",
      overdueNocturnal(card) ? "1" : "0",
      evenTooth(card.tooth) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function addressRecord(raw: AddressValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: AddressValue): boolean {
  const row = addressRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

type AddressParts = { letters: string; given: string; wide: boolean; notch: boolean; slash: boolean; words: number; seps: number; digit: boolean; comma: boolean };

function addressText(raw: AddressValue): string {
  if (hasBlocked(raw)) return "";
  const row = addressRecord(raw);
  if (row && !("address" in row) && !("code" in row)) return "";
  return row ? clip(row.address ?? row.code, 48) : clip(raw, 48);
}

function addressParts(raw: AddressValue): AddressParts | null {
  const text = addressText(raw);
  if (!/^[A-Za-z0-9][A-Za-z0-9,.'/#_ -]{1,47}$/.test(text)) return null;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 40) return null;
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
    comma: /,/.test(text),
  };
}

/** A blocked money field clears the plate. A real street is set. A blank or broken street is clear. */
export function addressState(raw: AddressValue): AddressState {
  if (hasBlocked(raw)) return "";
  const row = addressRecord(raw);
  if (row && !("address" in row) && !("code" in row)) return "";
  return addressParts(raw) ? "set" : "clear";
}

/** A comma is a court. A hyphen is a mews. A digit is a number. Three words are a square. A vowel start is a row. */
export function addressLane(raw: AddressValue): AddressLane {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  if (!parts) return "";
  if (parts.comma) return "court";
  if (parts.notch) return "mews";
  if (parts.digit) return "number";
  if (parts.words >= 3) return "square";
  if (/^[aeiou]/i.test(parts.letters)) return "row";
  return "close";
}

/** The last three letters. */
export function addressStamp(raw: AddressValue): string {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return parts ? parts.letters.slice(-3).toUpperCase() : "";
}

/** Court and square are ivory. Mews and row are champagne. A number is graphite. A close follows S or V. */
export function addressHue(raw: AddressValue): AddressHue {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  if (!parts) return "";
  const lane = addressLane(raw);
  if (lane === "court" || lane === "square") return "ivory";
  if (lane === "mews" || lane === "row") return "champagne";
  if (lane === "number") return "graphite";
  const head = parts.letters[0].toUpperCase();
  return head === "S" || head === "V" ? "champagne" : "graphite";
}

export function addressTwin(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && /([A-Za-z])\1/i.test(parts.letters));
}

export function addressWide(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && parts.wide);
}

export function addressNotch(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && parts.notch);
}

export function addressEcho(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  if (!parts || parts.letters.length < 2) return false;
  return parts.letters[0].toLowerCase() === parts.letters[parts.letters.length - 1].toLowerCase();
}

export function addressLeap(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && parts.letters.length === 12);
}

export function addressSlash(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && parts.slash);
}

export function addressKnown(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && KNOWN.has(parts.given.toUpperCase()));
}

export function addressCap(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && /[A-Z]/.test(parts.given[0] || ""));
}

/** A consonant ending. A vowel ending is not a tail. */
export function addressTail(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && /[^aeiou]$/i.test(parts.letters));
}

export function addressVowel(raw: AddressValue): boolean {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return Boolean(parts && /^[aeiou]/i.test(parts.letters));
}

export function addressWords(raw: AddressValue): number {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return parts ? parts.words : 0;
}

export function addressStep(raw: AddressValue): number {
  const parts = addressState(raw) === "set" ? addressParts(raw) : null;
  return parts ? parts.letters.length : 0;
}

export function addressLanes(rows: readonly AddressRow[]): AddressLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = addressLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingAddress(rows: readonly AddressRow[]): string {
  const bars = addressLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingAddressHue(rows: readonly AddressRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = addressHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedAddressCount(rows: readonly AddressRow[]): number {
  const marks = rows.map((row) => addressStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneAddressCount(rows: readonly AddressRow[], lane: AddressLane): number {
  return rows.filter((row) => addressLane(row.note) === lane).length;
}

export function addressShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAddressLanes(rows: readonly AddressRow[]): string[] {
  return addressLanes(rows).map((line) => line.lane);
}

export function readHiddenAddresses(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAddresses(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAddress(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleAddressReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAddressReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAddressLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleAddresses(
  rows: readonly AddressRow[],
  lane: string,
  hue: string,
  query: string,
  review: AddressReview,
  reviewed: readonly string[],
  shape: AddressShape,
): AddressRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (addressState(row.note) === "") return false;
    const found = addressLane(row.note);
    const hueName = addressHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${addressText(row.note)} ${addressStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "court" && found !== "court") return false;
    if (shape === "mews" && found !== "mews") return false;
    if (shape === "number" && found !== "number") return false;
    if (shape === "square" && found !== "square") return false;
    if (shape === "row" && found !== "row") return false;
    if (shape === "close" && found !== "close") return false;
    if (shape === "wide" && !addressWide(row.note)) return false;
    if (shape === "notch" && !addressNotch(row.note)) return false;
    if (shape === "leap" && !addressLeap(row.note)) return false;
    if (shape === "slash" && !addressSlash(row.note)) return false;
    if (shape === "twin" && !addressTwin(row.note)) return false;
    if (shape === "known" && !addressKnown(row.note)) return false;
    if (shape === "echo" && !addressEcho(row.note)) return false;
    if (shape === "vowel" && !addressVowel(row.note)) return false;
    return true;
  });
}

export function addressCopy(raw: AddressValue): string {
  return [addressStamp(raw), addressLane(raw), addressHue(raw)].filter(Boolean).join(" ");
}

export function addressLanesCsv(rows: readonly AddressRow[]): string {
  const lines = ["lane,count"];
  for (const line of addressLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function addressRowsCsv(rows: readonly AddressRow[], reviewed: readonly string[]): string {
  const lines = ["name,given,stamp,lane,hue,step,words,echo,wide,notch,leap,slash,twin,known,cap,tail,vowel,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (addressState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(addressText(row.note)),
      addressStamp(row.note),
      addressLane(row.note),
      addressHue(row.note),
      String(addressStep(row.note)),
      String(addressWords(row.note)),
      addressEcho(row.note) ? "1" : "0",
      addressWide(row.note) ? "1" : "0",
      addressNotch(row.note) ? "1" : "0",
      addressLeap(row.note) ? "1" : "0",
      addressSlash(row.note) ? "1" : "0",
      addressTwin(row.note) ? "1" : "0",
      addressKnown(row.note) ? "1" : "0",
      addressCap(row.note) ? "1" : "0",
      addressTail(row.note) ? "1" : "0",
      addressVowel(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
