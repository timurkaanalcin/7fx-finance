/**
 * Volvelle leaves for a paper-instrument book kept in this browser, and login plates read the last login already stored on the account.
 * Disks are linen, parchment, board, and horn. Inks are soot, gall, and gold.
 * Radii are 3, 6, or 9. Pointers are 1, 2, or 4.
 * A fresh login is six hours. A dormant login is ninety days. Dates are read in UTC.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_volvelle (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   disk text not null default '',
 *   ink text not null default '',
 *   radius_no integer,
 *   pointer_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_login_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_login_review (
 *   trader_id text primary key
 * );
 */

export const VLV_KEY = "crmv4-volvelle";
export const VLV_VIEW_KEY = "crmv4-volvelle-views";
export const VLV_DENSITY_KEY = "crmv4-volvelle-density";
export const LGN_KEY = "crmv4-login-hide";
export const LGN_REVIEW_KEY = "crmv4-login-review";

export const VOLVELLE_DISKS = ["linen", "parchment", "board", "horn"] as const;

export type VolvelleDisk = (typeof VOLVELLE_DISKS)[number];

export type VolvelleInk = "blank" | "soot" | "gall" | "gold";

export type VolvelleTray = "bench" | "drawer" | "chest";

export type VolvelleDensity = "wide" | "narrow";

export type VolvelleSort = "disk" | "keeper";

export type Volvelle = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  disk: string;
  radius: number | null;
  ink: string;
  pointer: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type VolvelleView = {
  id: string;
  name: string;
  tray: VolvelleTray;
  query: string;
  keeper: string;
  ink: string;
  disk: string;
  radius: string;
  pointer: string;
};

export type VolvelleCounts = {
  table: number;
  cabinet: number;
  cellar: number;
  logged: number;
  firm: number;
  soft: number;
  long: number;
  house: number;
  radius: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type LoginLane = "" | "fresh" | "week" | "month" | "season" | "dormant";

export type LoginHue = "" | "ivory" | "graphite" | "champagne";

export type LoginState = "" | "clear" | "set";

export type LoginReview = "all" | "reviewed" | "fresh";

export type LoginShape =
  | "all"
  | "fresh"
  | "dormant"
  | "quiet"
  | "today"
  | "quarter"
  | "even"
  | "leap"
  | "gap"
  | "deep"
  | "twin"
  | "tail"
  | "mark"
  | "space"
  | "week"
  | "month"
  | "season";

export type LoginValue = string | { lastLoginAt?: unknown; signed?: unknown; [key: string]: unknown } | null | undefined;

export type LoginRow = { id: string; label: string; signed: LoginValue };

export type LoginLaneLine = { lane: string; count: number };

export const ROUND289_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "radius",
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
  "login",
  "login-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "log", "unlog", "lock", "resume", "stow", "open", "tag", "pointer", "radius", "lower", "star"] as const;

const INKS = ["soot", "gall", "gold"] as const;

const RADIUS_CYCLE = [3, 6, 9] as const;

const POINTER_CYCLE = [1, 2, 4] as const;

const FIRM = new Set(["linen", "parchment"]);

const SOFT = new Set(["board", "horn"]);

const HOUSE_INK = new Set(["GALL", "GOLD"]);

const LANE_ORDER = ["fresh", "week", "month", "season", "dormant"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const FRESH_MS = 6 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEK_MS = 7 * DAY_MS;

const MONTH_MS = 30 * DAY_MS;

const GAP_MS = 14 * DAY_MS;

const DEEP_MS = 60 * DAY_MS;

const SEASON_MS = 90 * DAY_MS;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VolvelleTray {
  return raw === "drawer" || raw === "chest" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<VolvelleInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<VolvelleInk, "blank">) : "";
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

function inTray(card: Volvelle, tray: VolvelleTray): boolean {
  if (tray === "drawer") return card.locked && !card.stowed;
  if (tray === "chest") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function diskIndex(disk: string): number {
  return VOLVELLE_DISKS.indexOf(disk as VolvelleDisk);
}

function radiusIndex(radius: number): number {
  return RADIUS_CYCLE.indexOf(radius as (typeof RADIUS_CYCLE)[number]);
}

function pointerIndex(pointer: number): number {
  return POINTER_CYCLE.indexOf(pointer as (typeof POINTER_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function volvelleDisk(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (VOLVELLE_DISKS as readonly string[]).includes(text) ? text : "";
}

/** A radius is 3, 6, or 9. Anything else stays blank. */
export function volvelleRadius(raw: unknown): 3 | 6 | 9 | null {
  if (!/^[369]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 3 | 6 | 9;
}

/** A pointer is 1, 2, or 4. Anything else stays blank. */
export function volvellePointer(raw: unknown): 1 | 2 | 4 | null {
  if (!/^[124]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 1 | 2 | 4;
}

/** Ink is soot, gall, or gold. The saved ink is the upper case name. */
export function volvelleInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function firmDisk(disk: unknown): boolean {
  return FIRM.has(clip(disk, 12).toLowerCase());
}

export function softDisk(disk: unknown): boolean {
  return SOFT.has(clip(disk, 12).toLowerCase());
}

/** Linen is dawn. Parchment is noon. Board is dusk. Horn is night. */
export function volvelleBand(disk: unknown): string {
  const text = volvelleDisk(disk);
  if (!text) return "";
  if (text === "linen") return "dawn";
  if (text === "parchment") return "noon";
  if (text === "board") return "dusk";
  return "night";
}

/** Signed distance from one disk to the desk disk. */
export function diskGap(from: unknown, to: unknown): number | null {
  const left = diskIndex(volvelleDisk(from));
  const right = diskIndex(volvelleDisk(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(volvelleInk(ink));
}

/** A pair pointer is 2. One and four are not a pair. */
export function pairPointer(pointer: unknown): boolean {
  return volvellePointer(pointer) === 2;
}

/** A full pointer is 4. */
export function fullPointer(pointer: unknown): boolean {
  return volvellePointer(pointer) === 4;
}

export function activeDisk(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "firm" || text === "soft") return text;
  return volvelleDisk(text) || "all";
}

export function activeRadius(raw: unknown): string {
  const radius = volvelleRadius(raw);
  return radius === null ? "all" : String(radius);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = volvelleInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePointer(raw: unknown): string {
  const pointer = volvellePointer(raw);
  return pointer === null ? "all" : String(pointer);
}

export function moveVolvelleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestVolvelleInk(cards: readonly Volvelle[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.ink) continue;
    counts.set(card.ink, (counts.get(card.ink) || 0) + 1);
  }
  let best = "SOOT";
  let score = 0;
  for (const ink of ["SOOT", "GALL", "GOLD"]) {
    const count = counts.get(ink) || 0;
    if (count > score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest three. Through the afternoon, six. Evening asks for nine. Saved radii win when any exist. */
export function suggestRadius(cards: readonly Volvelle[], hour: number): 3 | 6 | 9 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || card.radius === null) continue;
    counts.set(card.radius, (counts.get(card.radius) || 0) + 1);
  }
  let best: 3 | 6 | 9 | null = null;
  let score = 0;
  for (const radius of RADIUS_CYCLE) {
    const count = counts.get(radius) || 0;
    if (count > score) {
      best = radius;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 3;
  if (hour < 16) return 6;
  return 9;
}

/** Before ten, suggest linen. The rest of the day suggests horn. */
export function suggestDisk(hour: number): VolvelleDisk {
  return hour < 10 ? "linen" : "horn";
}

/** The keeper with the fewest unlogged bench leaves. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Volvelle[], roster: string): string {
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

export function readVolvelles(raw: unknown): Volvelle[] {
  if (!Array.isArray(raw)) return [];
  const out: Volvelle[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Volvelle>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      disk: volvelleDisk(row.disk),
      radius: volvelleRadius(row.radius),
      ink: volvelleInk(row.ink),
      pointer: volvellePointer(row.pointer) ?? 1,
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

export function addVolvelle(
  cards: readonly Volvelle[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    disk?: string;
    radius?: unknown;
    ink?: string;
    pointer?: unknown;
    tags?: unknown;
  },
): Volvelle[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readVolvelles([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      disk: volvelleDisk(card.disk),
      radius: volvelleRadius(card.radius),
      ink: volvelleInk(card.ink),
      pointer: volvellePointer(card.pointer) ?? 1,
      tags: tagsOf(card.tags),
      logged: false,
      locked: false,
      stowed: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Volvelle[], id: string, edit: (card: Volvelle) => Volvelle): Volvelle[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editVolvelle(cards: readonly Volvelle[], id: string, title: string): Volvelle[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editVolvelleNote(cards: readonly Volvelle[], id: string, note: string): Volvelle[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "SOOT", "GALL", "GOLD"];
  const index = order.indexOf(volvelleInk(ink));
  return order[(index + 1) % order.length] || "SOOT";
}

export function setVolvelleInk(cards: readonly Volvelle[], id: string, ink: string): Volvelle[] {
  const next = volvelleInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setVolvelleLogged(cards: readonly Volvelle[], id: string, logged: boolean): Volvelle[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setVolvelleLock(cards: readonly Volvelle[], id: string, locked: boolean): Volvelle[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setVolvelleStow(cards: readonly Volvelle[], id: string, stowed: boolean): Volvelle[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setVolvelleStar(cards: readonly Volvelle[], id: string, flagged: boolean): Volvelle[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addVolvelleTag(cards: readonly Volvelle[], id: string, tag: string): Volvelle[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepRadius(radius: number | null, dir: 1 | -1): 3 | 6 | 9 {
  if (radius === null) return dir > 0 ? 3 : 9;
  const index = radiusIndex(radius);
  const next = index < 0 ? 0 : (index + dir + RADIUS_CYCLE.length) % RADIUS_CYCLE.length;
  return RADIUS_CYCLE[next];
}

function stepPointer(pointer: number, dir: 1 | -1): 1 | 2 | 4 {
  const index = pointerIndex(pointer);
  const next = index < 0 ? 0 : (index + dir + POINTER_CYCLE.length) % POINTER_CYCLE.length;
  return POINTER_CYCLE[next];
}

export function liftRadius(cards: readonly Volvelle[], id: string): Volvelle[] {
  return mapCard(cards, id, (card) => ({ ...card, radius: stepRadius(card.radius, 1), audit: "radius" }));
}

export function lowerRadius(cards: readonly Volvelle[], id: string): Volvelle[] {
  return mapCard(cards, id, (card) => ({ ...card, radius: stepRadius(card.radius, -1), audit: "lower" }));
}

export function raisePointer(cards: readonly Volvelle[], id: string): Volvelle[] {
  return mapCard(cards, id, (card) => ({ ...card, pointer: stepPointer(card.pointer, 1), audit: "pointer" }));
}

export function lowerPointer(cards: readonly Volvelle[], id: string): Volvelle[] {
  return mapCard(cards, id, (card) => ({ ...card, pointer: stepPointer(card.pointer, -1), audit: "pointer" }));
}

function focused(cards: readonly Volvelle[], id: string, edit: (card: Volvelle) => Volvelle): Volvelle[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function logVolvelleFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return focused(cards, id, (card) => ({ ...card, logged: !card.logged, audit: card.logged ? "unlog" : "log" }));
}

export function lockVolvelleFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return setVolvelleLock(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starVolvelleFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return setVolvelleStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagVolvelleFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return addVolvelleTag(cards, id, "a");
}

export function inkFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  const card = cards.find((item) => item.id === id);
  return card ? setVolvelleInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftRadiusFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return liftRadius(cards, id);
}

export function lowerRadiusFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return lowerRadius(cards, id);
}

export function raisePointerFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return raisePointer(cards, id);
}

export function lowerPointerFocused(cards: readonly Volvelle[], id: string): Volvelle[] {
  return lowerPointer(cards, id);
}

function bulk(cards: readonly Volvelle[], ids: readonly string[], edit: (card: Volvelle) => Volvelle): Volvelle[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkVolvelleGold(cards: readonly Volvelle[], ids: readonly string[]): Volvelle[] {
  return bulk(cards, ids, (card) => (card.ink === "GOLD" ? card : { ...card, ink: "GOLD", audit: "ink" }));
}

export function bulkVolvelleLog(cards: readonly Volvelle[], ids: readonly string[]): Volvelle[] {
  return bulk(cards, ids, (card) => (card.logged ? card : { ...card, logged: true, audit: "log" }));
}

export function bulkVolvelleStow(cards: readonly Volvelle[], ids: readonly string[]): Volvelle[] {
  return bulk(cards, ids, (card) => (card.stowed ? card : { ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkVolvelleTag(cards: readonly Volvelle[], ids: readonly string[]): Volvelle[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readVolvelleViews(raw: unknown): VolvelleView[] {
  if (!Array.isArray(raw)) return [];
  const out: VolvelleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VolvelleView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      ink: activeInk(row.ink, ["SOOT", "GALL", "GOLD"]),
      disk: activeDisk(row.disk),
      radius: activeRadius(row.radius),
      pointer: activePointer(row.pointer),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addVolvelleView(views: readonly VolvelleView[], view: VolvelleView): VolvelleView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readVolvelleViews([...views, { ...view, id, name }]);
}

export function dropVolvelleView(views: readonly VolvelleView[], id: string): VolvelleView[] {
  return views.filter((view) => view.id !== id);
}

export function volvelleDensity(raw: unknown): VolvelleDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortVolvelles(cards: readonly Volvelle[], sort: VolvelleSort): Volvelle[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const disk = diskIndex(a.disk) - diskIndex(b.disk);
      if (disk) return disk;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleVolvelles(
  cards: readonly Volvelle[],
  tray: VolvelleTray,
  query: string,
  keeper: string,
  ink: string,
  disk: string,
  radius: string,
  pointer: string,
): Volvelle[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : volvelleInk(ink);
  const wantDisk = activeDisk(disk);
  const wantRadius = activeRadius(radius);
  const wantPointer = activePointer(pointer);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantDisk === "firm" && !firmDisk(card.disk)) return false;
    if (wantDisk === "soft" && !softDisk(card.disk)) return false;
    if (wantDisk !== "all" && wantDisk !== "firm" && wantDisk !== "soft" && card.disk !== wantDisk) return false;
    if (wantRadius !== "all" && String(card.radius ?? "") !== wantRadius) return false;
    if (wantPointer !== "all" && String(card.pointer) !== wantPointer) return false;
    return true;
  });
}

/** A soft disk on the first pointer, still unlogged and not in the cellar, is overdue. */
export function overdueVolvelle(card: Volvelle): boolean {
  return softDisk(card.disk) && card.pointer === 1 && !card.logged && !card.stowed;
}

/** No ink, two leaves, one pointer, and still on the table. */
export function idleVolvelle(card: Volvelle): boolean {
  return !card.ink && card.radius === 3 && card.pointer === 1 && !card.logged && !card.locked && !card.stowed;
}

/** Gilt, six leaves, and a full pointer, still out of the cellar. */
export function briskVolvelle(card: Volvelle): boolean {
  return card.ink === "GOLD" && card.radius === 9 && card.pointer === 4 && !card.stowed;
}

/** Moss, iron, and four leaves. */
export function restingVolvelle(card: Volvelle): boolean {
  return card.disk === "horn" && card.ink === "SOOT" && card.radius === 6;
}

/** An oak radius is late when the desk is already on moss. */
export function lateVolvelle(card: Volvelle, desk: string): boolean {
  return card.disk === "linen" && volvelleDisk(desk) === "horn" && !card.logged;
}

export function volvelleCounts(cards: readonly Volvelle[], shown: readonly Volvelle[], desk: string): VolvelleCounts {
  return {
    table: cards.filter((card) => inTray(card, "bench")).length,
    cabinet: cards.filter((card) => inTray(card, "drawer")).length,
    cellar: cards.filter((card) => inTray(card, "chest")).length,
    logged: cards.filter((card) => card.logged).length,
    firm: cards.filter((card) => firmDisk(card.disk)).length,
    soft: cards.filter((card) => softDisk(card.disk)).length,
    long: cards.filter((card) => card.radius === 9).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    radius: cards.reduce((sum, card) => sum + (card.radius || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleVolvelle).length,
    brisk: cards.filter(briskVolvelle).length,
    resting: cards.filter(restingVolvelle).length,
    overdue: cards.filter(overdueVolvelle).length,
    pair: cards.filter((card) => pairPointer(card.pointer) && lateVolvelle(card, desk)).length,
  };
}

export function volvelleBars(cards: readonly Volvelle[]): { disk: string; count: number }[] {
  return VOLVELLE_DISKS.map((disk) => ({ disk, count: cards.filter((card) => card.disk === disk && !card.stowed).length }));
}

export function volvelleTimeline(cards: readonly Volvelle[]): { radius: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return RADIUS_CYCLE.map((radius) => ({ radius, titles: open.filter((card) => card.radius === radius).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function volvelleKeepers(cards: readonly Volvelle[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Volvelle[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.logged && card.keeper);
  let best = "";
  let score = 0;
  for (const name of volvelleKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderVolvelles(cards: readonly Volvelle[]): string[] {
  return cards.filter(overdueVolvelle).map((card) => card.title);
}

export function idleVolvelleList(cards: readonly Volvelle[]): string[] {
  return cards.filter(idleVolvelle).map((card) => card.title);
}

export function volvelleCopy(card: Volvelle): string {
  return [card.title, card.keeper, card.disk, card.ink, card.radius ?? "", card.pointer, card.note].filter((item) => item !== "").join(" · ");
}

export function volvelleCsv(cards: readonly Volvelle[], desk: string): string {
  const lines = ["title,keeper,disk,ink,radius,pointer,tags,logged,locked,stowed,starred,soft,late,idle,brisk,resting,overdue,firm,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.disk,
        card.ink,
        card.radius ?? "",
        card.pointer,
        card.tags.join(" "),
        card.logged ? "1" : "0",
        card.locked ? "1" : "0",
        card.stowed ? "1" : "0",
        card.flagged ? "1" : "0",
        softDisk(card.disk) ? "1" : "0",
        lateVolvelle(card, desk) ? "1" : "0",
        idleVolvelle(card) ? "1" : "0",
        briskVolvelle(card) ? "1" : "0",
        restingVolvelle(card) ? "1" : "0",
        overdueVolvelle(card) ? "1" : "0",
        firmDisk(card.disk) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        volvelleBand(card.disk),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function hasBlocked(raw: LoginValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function loginRecord(raw: LoginValue): { lastLoginAt?: unknown; signed?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function loginGiven(raw: LoginValue): string {
  const row = loginRecord(raw);
  if (row && !("lastLoginAt" in row) && !("signed" in row)) return "";
  const value = row ? row.lastLoginAt ?? row.signed : raw;
  return clip(value, 40);
}

export function loginState(raw: LoginValue, now = Date.now()): LoginState {
  if (hasBlocked(raw)) return "";
  const row = loginRecord(raw);
  if (row && !("lastLoginAt" in row) && !("signed" in row)) return "";
  return loginDate(raw, now) ? "set" : "clear";
}

function loginDate(raw: LoginValue, now = Date.now()): Date | null {
  if (loginStateRaw(raw) === "blocked") return null;
  const text = loginGiven(raw);
  if (!text) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  const age = now - at;
  if (age < -FRESH_MS) return null;
  return new Date(at);
}

function loginStateRaw(raw: LoginValue): "blocked" | "open" {
  if (hasBlocked(raw)) return "blocked";
  const row = loginRecord(raw);
  if (row && !("lastLoginAt" in row) && !("signed" in row)) return "blocked";
  return "open";
}

function loginAge(raw: LoginValue, now: number): number | null {
  const at = loginDate(raw, now);
  if (!at) return null;
  return now - at.getTime();
}

function leapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function quarterOf(at: Date): number {
  return Math.floor(at.getUTCMonth() / 3);
}

/** Warm within two hours, cold after one hundred twenty days, otherwise the age band. */
export function loginLane(raw: LoginValue, now = Date.now()): LoginLane {
  if (loginState(raw, now) !== "set") return "";
  const age = loginAge(raw, now);
  if (age === null) return "";
  if (age <= FRESH_MS) return "fresh";
  if (age <= WEEK_MS) return "week";
  if (age <= MONTH_MS) return "month";
  if (age <= SEASON_MS) return "season";
  return "dormant";
}

export function loginHue(raw: LoginValue, now = Date.now()): LoginHue {
  const lane = loginLane(raw, now);
  if (!lane) return "";
  if (lane === "fresh" || lane === "month") return "champagne";
  if (lane === "week" || lane === "season") return "ivory";
  return "graphite";
}

export function loginFresh(raw: LoginValue, now = Date.now()): boolean {
  return loginLane(raw, now) === "fresh";
}

export function loginDormant(raw: LoginValue, now = Date.now()): boolean {
  return loginLane(raw, now) === "dormant";
}

export function loginQuiet(raw: LoginValue): boolean {
  return loginState(raw) === "clear";
}

export function loginToday(raw: LoginValue, now = Date.now()): boolean {
  const at = loginDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && at.getUTCMonth() === clock.getUTCMonth() && at.getUTCDate() === clock.getUTCDate();
}

export function loginQuarter(raw: LoginValue, now = Date.now()): boolean {
  const at = loginDate(raw, now);
  if (!at) return false;
  const clock = new Date(now);
  return at.getUTCFullYear() === clock.getUTCFullYear() && quarterOf(at) === quarterOf(clock);
}

export function loginEven(raw: LoginValue, now = Date.now()): boolean {
  const at = loginDate(raw, now);
  return Boolean(at) && at!.getUTCDate() % 2 === 0;
}

export function loginStep(raw: LoginValue, now = Date.now()): number {
  const at = loginDate(raw, now);
  return at ? at.getUTCMonth() + 1 : 0;
}

/** The login year is a leap year. */
export function loginLeap(raw: LoginValue, now = Date.now()): boolean {
  const at = loginDate(raw, now);
  return Boolean(at) && leapYear(at!.getUTCFullYear());
}

/** Older than ten days and still inside one hundred twenty days. */
export function loginGap(raw: LoginValue, now = Date.now()): boolean {
  const age = loginAge(raw, now);
  return age !== null && age > GAP_MS && age <= SEASON_MS;
}

/** Forty-five days or more. */
export function loginDeep(raw: LoginValue, now = Date.now()): boolean {
  const age = loginAge(raw, now);
  return age !== null && age >= DEEP_MS;
}

export function loginTwin(raw: LoginValue, now = Date.now()): boolean {
  const at = loginDate(raw, now);
  if (!at) return false;
  const day = at.getUTCDate();
  return day === 7 || day === 21;
}

export function loginTail(raw: LoginValue): boolean {
  return /z$/i.test(loginGiven(raw).trim());
}

export function loginMark(raw: LoginValue): boolean {
  return loginGiven(raw).includes("T");
}

export function loginSpace(raw: LoginValue): boolean {
  return loginGiven(raw).includes(" ");
}

export function loginKnown(raw: LoginValue, now = Date.now()): boolean {
  const lane = loginLane(raw, now);
  return lane === "fresh" || lane === "week" || lane === "month";
}

export function loginStamp(raw: LoginValue, now = Date.now()): string {
  const at = loginDate(raw, now);
  if (!at) return "";
  const day = String(at.getUTCDate()).padStart(2, "0");
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export function loginCopy(raw: LoginValue): string {
  return loginGiven(raw);
}

export function loginLanes(rows: readonly LoginRow[], now = Date.now()): LoginLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = loginLane(row.signed, now);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingLogin(rows: readonly LoginRow[], now = Date.now()): string {
  const lines = loginLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingLoginHue(rows: readonly LoginRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = loginHue(row.signed, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function laneLoginCount(rows: readonly LoginRow[], lane: LoginLane, now = Date.now()): number {
  return rows.filter((row) => loginLane(row.signed, now) === lane).length;
}

export function loginShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLoginLanes(rows: readonly LoginRow[], now = Date.now()): string[] {
  return loginLanes(rows, now).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenLogin(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLogin(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLogin(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleLoginReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLoginReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLoginLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: LoginRow, shape: LoginShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "fresh") return loginFresh(row.signed, now);
  if (shape === "dormant") return loginDormant(row.signed, now);
  if (shape === "quiet") return loginQuiet(row.signed);
  if (shape === "today") return loginToday(row.signed, now);
  if (shape === "quarter") return loginQuarter(row.signed, now);
  if (shape === "even") return loginEven(row.signed, now);
  if (shape === "leap") return loginLeap(row.signed, now);
  if (shape === "gap") return loginGap(row.signed, now);
  if (shape === "deep") return loginDeep(row.signed, now);
  if (shape === "twin") return loginTwin(row.signed, now);
  if (shape === "tail") return loginTail(row.signed);
  if (shape === "mark") return loginMark(row.signed);
  if (shape === "space") return loginSpace(row.signed);
  return loginLane(row.signed, now) === shape;
}

export function visibleLogin(
  rows: readonly LoginRow[],
  lane: string,
  hue: string,
  query: string,
  review: LoginReview,
  reviewed: readonly string[],
  shape: LoginShape,
  now = Date.now(),
): LoginRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (loginState(row.signed, now) === "") return false;
    const found = loginLane(row.signed, now);
    const hueName = loginHue(row.signed, now);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${loginGiven(row.signed)} ${loginStamp(row.signed, now)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape, now);
  });
}

export function sharedLoginCount(rows: readonly LoginRow[], now = Date.now()): number {
  const stamps = rows.map((row) => loginStamp(row.signed, now)).filter(Boolean);
  return stamps.length - new Set(stamps).size;
}

export function loginLanesCsv(rows: readonly LoginRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of loginLanes(rows, now)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function loginRowsCsv(rows: readonly LoginRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,signed,stamp,lane,hue,step,fresh,dormant,today,quarter,even,leap,gap,deep,twin,tail,mark,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (loginState(row.signed, now) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(loginGiven(row.signed)),
        loginStamp(row.signed, now),
        loginLane(row.signed, now),
        loginHue(row.signed, now),
        String(loginStep(row.signed, now)),
        loginFresh(row.signed, now) ? "1" : "0",
        loginDormant(row.signed, now) ? "1" : "0",
        loginToday(row.signed, now) ? "1" : "0",
        loginQuarter(row.signed, now) ? "1" : "0",
        loginEven(row.signed, now) ? "1" : "0",
        loginLeap(row.signed, now) ? "1" : "0",
        loginGap(row.signed, now) ? "1" : "0",
        loginDeep(row.signed, now) ? "1" : "0",
        loginTwin(row.signed, now) ? "1" : "0",
        loginTail(row.signed) ? "1" : "0",
        loginMark(row.signed) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
