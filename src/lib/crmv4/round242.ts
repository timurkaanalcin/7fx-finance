/**
 * Dawn books for the opening cover of a city, and vowel marks already stored as a trader name, retention status, and desk.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_dawn_book (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   city text not null default '',
 *   cloth text not null default '',
 *   gait text not null default '',
 *   window_min integer,
 *   weight integer not null default 3,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_crest_review (
 *   trader_id text primary key
 * );
 */

export const DNB_KEY = "crmv4-dawn-book";
export const DNB_VIEW_KEY = "crmv4-dawn-views";
export const DNB_DENSITY_KEY = "crmv4-dawn-density";
export const LCR_KEY = "crmv4-crest-hide";
export const LCR_REVIEW_KEY = "crmv4-crest-review";

export const DAWN_CITIES = ["istanbul", "london", "berlin", "moscow", "dubai", "newyork"] as const;

export type DawnCity = (typeof DAWN_CITIES)[number];

export type ClothName = "blank" | "ivory" | "champagne" | "ink";

export type GaitName = "blank" | "soft" | "firm" | "swift";

export type DawnTray = "open" | "held" | "archived";

export type DawnDensity = "airy" | "tight";

export type DawnSort = "city" | "keeper";

export type DawnBook = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  city: string;
  window: number | null;
  cloth: string;
  gait: string;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type DawnView = {
  id: string;
  name: string;
  tray: DawnTray;
  query: string;
  keeper: string;
  cloth: string;
  gait: string;
  city: string;
  window: string;
  weight: string;
};

export type DawnCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  weight: number;
  house: number;
  window: number;
  matched: number;
  seal: number;
  cooling: number;
};

export type CrestLane = "" | "linked" | "named" | "rich" | "even" | "spare" | "mute";

export type CrestTone = "" | "gilt" | "linen" | "sand" | "clay" | "ivory" | "soot" | "mist";

export type CrestState = "" | "clear" | "set";

export type CrestShape = "all" | "link" | "wide" | "bound" | "notch" | "named";

export type CrestReview = "all" | "reviewed" | "fresh";

export type CrestValue = string | { name?: unknown; ink?: unknown; stand?: unknown; retention?: unknown; desk?: unknown; [key: string]: unknown } | null | undefined;

export type CrestRow = { id: string; label: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "cloth", "tag", "weight", "window", "seal"] as const;

const CLOTHS = ["ivory", "champagne", "ink"] as const;

const GAITS = ["soft", "firm", "swift"] as const;

const GAIT_CYCLE = ["soft", "firm", "swift"] as const;

const WEIGHT_CYCLE = [3, 6, 9] as const;

const WINDOWS = [15, 30, 45] as const;

const PEAK = new Set(["london", "istanbul"]);

const QUIET = new Set(["moscow"]);

const HOUSE = new Set(["CHAMPAGNE", "INK"]);

const WEST = new Set(["london", "newyork"]);

const CORE = new Set(["istanbul", "berlin"]);

const EAST = new Set(["moscow", "dubai"]);

const LANE_ORDER = ["linked", "named", "rich", "even", "spare", "mute"] as const;

const TONE_ORDER = ["gilt", "linen", "sand", "clay", "ivory", "soot", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const BOOK_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DawnTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
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
    if (!/^[pqr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(book: DawnBook, tray: DawnTray): boolean {
  if (tray === "held") return book.held && !book.archived;
  if (tray === "archived") return book.archived;
  return !book.held && !book.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function cityIndex(city: string): number {
  return DAWN_CITIES.indexOf(city as DawnCity);
}

/** A blank title is left out. The saved title stays short. */
export function dawnLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function dawnNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A city outside the six opening cities is left blank. */
export function cityOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (DAWN_CITIES as readonly string[]).includes(text) ? text : "";
}

/** The window is 15, 30, or 45 minutes. Anything else stays blank. */
export function windowOf(raw: unknown): 15 | 30 | 45 | null {
  const text = clip(raw, 2);
  const value = Number(text);
  return (WINDOWS as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Weight is 3, 6, or 9. Anything else stays blank. */
export function weightOf(raw: unknown): 3 | 6 | 9 | null {
  const value = Number(clip(raw, 1));
  return (WEIGHT_CYCLE as readonly number[]).includes(value) ? (value as 3 | 6 | 9) : null;
}

/** Cloth is ivory, champagne, or ink. The saved cloth is upper case. */
export function clothOf(raw: unknown): string {
  const cloth = clothName(raw);
  return cloth ? cloth.toUpperCase() : "";
}

/** Gait is soft, firm, or swift. A blank gait stays blank. */
export function gaitOf(raw: unknown): string {
  return gaitName(raw);
}

export function peakCity(city: unknown): boolean {
  return PEAK.has(cityOf(city));
}

export function quietCity(city: unknown): boolean {
  return QUIET.has(cityOf(city));
}

/** West is London and New York. Core is Istanbul and Berlin. East is Moscow and Dubai. */
export function cityBand(city: unknown): "west" | "core" | "east" | "" {
  const name = cityOf(city);
  if (WEST.has(name)) return "west";
  if (CORE.has(name)) return "core";
  if (EAST.has(name)) return "east";
  return "";
}

/** Minutes of index from the book city to the desk city. A blank city has no gap. */
export function cityGap(bookCity: unknown, deskCity: unknown): number | null {
  const from = cityIndex(cityOf(bookCity));
  const to = cityIndex(cityOf(deskCity));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

export function activeCity(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return cityOf(text) || "all";
}

export function activeWindow(raw: unknown): string {
  const value = windowOf(raw);
  return value === null ? "all" : String(value);
}

export function activeGait(raw: unknown, gaits: readonly string[]): string {
  const gait = gaitOf(raw);
  return gait && gaits.includes(gait) ? gait : "all";
}

export function activeWeight(raw: unknown): string {
  const value = weightOf(raw);
  return value === null ? "all" : String(value);
}

export function activeCloth(raw: unknown): string {
  const cloth = clothName(raw);
  return cloth || "all";
}

export function moveDawnFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestCloth(books: readonly DawnBook[]): string {
  const counts = new Map<string, number>();
  for (const book of books) {
    if (!book.cloth) continue;
    counts.set(book.cloth, (counts.get(book.cloth) || 0) + 1);
  }
  let best = "IVORY";
  let score = 0;
  for (const cloth of ["IVORY", "CHAMPAGNE", "INK"]) {
    const count = counts.get(cloth) || 0;
    if (count > score) {
      best = cloth;
      score = count;
    }
  }
  return best;
}

/** A quiet hour asks for a short window. A late hour asks for a long one. A tie among saved books keeps 30. */
export function suggestWindow(books: readonly DawnBook[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const book of books) {
    if (book.window === null) continue;
    counts.set(book.window, (counts.get(book.window) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const window of WINDOWS) {
    const count = counts.get(window) || 0;
    if (count > score) {
      best = window;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 9) return 15;
  if (hour >= 17) return 45;
  return 30;
}

/** The keeper with the fewest open books. A tie keeps the roster order. */
export function fairKeeper(books: readonly DawnBook[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = books.filter((book) => inTray(book, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((book) => book.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readDawnBooks(raw: unknown): DawnBook[] {
  if (!Array.isArray(raw)) return [];
  const out: DawnBook[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DawnBook>;
    const id = clip(row.id, 40);
    const title = dawnLine(row.title);
    if (!id || !title || out.some((book) => book.id === id || book.title === title)) continue;
    out.push({
      id,
      title,
      note: dawnNote(row.note),
      keeper: clip(row.keeper, 24),
      city: cityOf(row.city),
      window: windowOf(row.window),
      cloth: clothOf(row.cloth),
      gait: gaitOf(row.gait),
      weight: weightOf(row.weight) ?? 3,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      seal: row.seal === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, BOOK_CAP);
}

export function addDawnBook(
  books: readonly DawnBook[],
  book: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    city?: unknown;
    cloth?: string;
    gait?: string;
    window?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): DawnBook[] {
  const current = readDawnBooks(books);
  const id = clip(book.id, 40);
  const title = dawnLine(book.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: DawnBook = {
    id,
    title,
    note: dawnNote(book.note),
    keeper: clip(book.keeper, 24),
    city: cityOf(book.city),
    window: windowOf(book.window),
    cloth: clothOf(book.cloth),
    gait: gaitOf(book.gait),
    weight: weightOf(book.weight) ?? 3,
    tags: tagsOf(book.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BOOK_CAP);
}

function mapBook(books: readonly DawnBook[], id: string, change: (book: DawnBook) => DawnBook): DawnBook[] {
  return readDawnBooks(books).map((book) => (book.id === id ? change(book) : book));
}

export function editDawn(books: readonly DawnBook[], id: string, title: string): DawnBook[] {
  const next = dawnLine(title);
  if (!next) return readDawnBooks(books);
  return mapBook(books, id, (book) => (book.title === next ? book : { ...book, title: next, audit: "edit" }));
}

export function editDawnNote(books: readonly DawnBook[], id: string, note: string): DawnBook[] {
  const next = dawnNote(note);
  return mapBook(books, id, (book) => (book.note === next ? book : { ...book, note: next, audit: "note" }));
}

export function setDawnPin(books: readonly DawnBook[], id: string, pinned: boolean): DawnBook[] {
  return mapBook(books, id, (book) => (book.pinned === pinned ? book : { ...book, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setDawnHold(books: readonly DawnBook[], id: string, held: boolean): DawnBook[] {
  return mapBook(books, id, (book) => (book.held === held || book.archived ? book : { ...book, held, audit: held ? "hold" : "resume" }));
}

export function setDawnArchive(books: readonly DawnBook[], id: string, archived: boolean): DawnBook[] {
  return mapBook(books, id, (book) => (book.archived === archived ? book : { ...book, archived, held: archived ? false : book.held, audit: archived ? "archive" : "open" }));
}

export function setDawnSeal(books: readonly DawnBook[], id: string, seal: boolean): DawnBook[] {
  return mapBook(books, id, (book) => (book.seal === seal ? book : { ...book, seal, audit: "seal" }));
}

export function setDawnWeight(books: readonly DawnBook[], id: string, weight: unknown): DawnBook[] {
  const next = weightOf(weight);
  if (next === null) return readDawnBooks(books);
  return mapBook(books, id, (book) => (book.weight === next ? book : { ...book, weight: next, audit: "weight" }));
}

export function setDawnCloth(books: readonly DawnBook[], id: string, cloth: unknown): DawnBook[] {
  const next = clothOf(cloth);
  if (!next) return readDawnBooks(books);
  return mapBook(books, id, (book) => (book.cloth === next ? book : { ...book, cloth: next, audit: "cloth" }));
}

/** Gait steps soft, firm, swift, then soft again. A blank gait starts at soft. */
export function cycleGait(books: readonly DawnBook[], id: string): DawnBook[] {
  return mapBook(books, id, (book) => {
    const at = GAIT_CYCLE.indexOf(book.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    return next === book.gait ? book : { ...book, gait: next, audit: "gait" };
  });
}

export function addDawnTag(books: readonly DawnBook[], id: string, tag: string): DawnBook[] {
  const next = tagsOf(tag)[0];
  if (!next) return readDawnBooks(books);
  return mapBook(books, id, (book) => {
    if (book.tags.includes(next) || book.tags.length >= TAG_CAP) return book;
    return { ...book, tags: [...book.tags, next], audit: "tag" };
  });
}

/** A blank window becomes 15, 15 becomes 30, and 30 becomes 45. A window of 45 stays. */
export function snoozeWindow(books: readonly DawnBook[], id: string): DawnBook[] {
  return mapBook(books, id, (book) => {
    if (book.window === 45) return book;
    const next = book.window === 30 ? 45 : book.window === 15 ? 30 : 15;
    return { ...book, window: next, audit: "window" };
  });
}

export function pinFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number): DawnBook[] {
  const id = shownIds[index];
  const book = id ? readDawnBooks(books).find((item) => item.id === id) : undefined;
  if (!book) return readDawnBooks(books);
  return setDawnPin(books, book.id, !book.pinned);
}

export function holdFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number): DawnBook[] {
  const id = shownIds[index];
  const book = id ? readDawnBooks(books).find((item) => item.id === id) : undefined;
  if (!book) return readDawnBooks(books);
  return setDawnHold(books, book.id, !book.held);
}

export function gaitFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number): DawnBook[] {
  const id = shownIds[index];
  return id ? cycleGait(books, id) : readDawnBooks(books);
}

export function sealFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number): DawnBook[] {
  const id = shownIds[index];
  const book = id ? readDawnBooks(books).find((item) => item.id === id) : undefined;
  if (!book) return readDawnBooks(books);
  return setDawnSeal(books, book.id, !book.seal);
}

export function tagFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number, tag: string): DawnBook[] {
  const id = shownIds[index];
  return id ? addDawnTag(books, id, tag) : readDawnBooks(books);
}

export function weightFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number): DawnBook[] {
  const id = shownIds[index];
  const book = id ? readDawnBooks(books).find((item) => item.id === id) : undefined;
  if (!book) return readDawnBooks(books);
  const at = WEIGHT_CYCLE.indexOf(book.weight as (typeof WEIGHT_CYCLE)[number]);
  const next = at < 0 ? WEIGHT_CYCLE[0] : WEIGHT_CYCLE[(at + 1) % WEIGHT_CYCLE.length];
  return setDawnWeight(books, book.id, next);
}

export function snoozeFocusedDawn(books: readonly DawnBook[], shownIds: readonly string[], index: number): DawnBook[] {
  const id = shownIds[index];
  return id ? snoozeWindow(books, id) : readDawnBooks(books);
}

function touchIds(books: readonly DawnBook[], ids: readonly string[], change: (book: DawnBook) => DawnBook): DawnBook[] {
  const want = new Set(ids);
  return readDawnBooks(books).map((book) => (want.has(book.id) ? change(book) : book));
}

export function bulkDawnPin(books: readonly DawnBook[], ids: readonly string[]): DawnBook[] {
  return touchIds(books, ids, (book) => (book.pinned ? book : { ...book, pinned: true, audit: "pin" }));
}

export function bulkDawnArchive(books: readonly DawnBook[], ids: readonly string[]): DawnBook[] {
  return touchIds(books, ids, (book) => (book.archived ? book : { ...book, archived: true, held: false, audit: "archive" }));
}

export function bulkDawnGait(books: readonly DawnBook[], ids: readonly string[]): DawnBook[] {
  return touchIds(books, ids, (book) => (book.gait === "swift" ? book : { ...book, gait: "swift", audit: "gait" }));
}

export function bulkDawnTag(books: readonly DawnBook[], ids: readonly string[], tag: string): DawnBook[] {
  const next = tagsOf(tag)[0];
  if (!next) return readDawnBooks(books);
  return touchIds(books, ids, (book) => (book.tags.includes(next) || book.tags.length >= TAG_CAP ? book : { ...book, tags: [...book.tags, next], audit: "tag" }));
}

export function bulkDawnCloth(books: readonly DawnBook[], ids: readonly string[], cloth: unknown): DawnBook[] {
  const next = clothOf(cloth);
  if (!next) return readDawnBooks(books);
  return touchIds(books, ids, (book) => (book.cloth === next ? book : { ...book, cloth: next, audit: "cloth" }));
}

export function readDawnViews(raw: unknown): DawnView[] {
  if (!Array.isArray(raw)) return [];
  const out: DawnView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DawnView>;
    const id = clip(row.id, 40);
    const name = dawnLine(row.name);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      cloth: activeCloth(row.cloth),
      gait: activeGait(row.gait, GAITS),
      city: activeCity(row.city),
      window: activeWindow(row.window),
      weight: activeWeight(row.weight),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addDawnView(views: readonly DawnView[], view: DawnView): DawnView[] {
  const current = readDawnViews(views);
  const id = clip(view.id, 40);
  const name = dawnLine(view.name);
  if (!id || !name || current.some((item) => item.id === id)) return current;
  return [{ ...view, id, name, tray: trayOf(view.tray), query: clip(view.query, 40), keeper: clip(view.keeper, 24), cloth: activeCloth(view.cloth), gait: activeGait(view.gait, GAITS), city: activeCity(view.city), window: activeWindow(view.window), weight: activeWeight(view.weight) }, ...current].slice(0, VIEW_CAP);
}

export function dropDawnView(views: readonly DawnView[], id: string): DawnView[] {
  return readDawnViews(views).filter((view) => view.id !== id);
}

export function dawnDensity(raw: unknown): DawnDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function dawnSort(raw: unknown): DawnSort {
  return raw === "keeper" ? "keeper" : "city";
}

export function lateBook(book: DawnBook, deskCity: unknown): boolean {
  const gap = cityGap(book.city, deskCity);
  return gap !== null && gap > 0;
}

export function coolingBook(book: DawnBook): boolean {
  return book.gait === "swift" && quietCity(book.city);
}

export function visibleDawn(
  books: readonly DawnBook[],
  tray: DawnTray,
  query: string,
  keeper: string,
  cloth: string,
  gait: string,
  city: string,
  window: string,
  weight: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): DawnBook[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const clothOn = cloth === "all" ? "" : clothName(cloth).toUpperCase();
  const gaitOn = gait === "all" ? "" : gaitOf(gait);
  const cityOn = city === "all" ? "" : activeCity(city);
  const windowOn = window === "all" ? "" : activeWindow(window);
  const weightOn = weight === "all" ? "" : activeWeight(weight);
  return readDawnBooks(books).filter((book) => {
    if (!inTray(book, tray)) return false;
    if (text && !`${book.title} ${book.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && book.keeper.toLowerCase() !== keeperOn) return false;
    if (clothOn && book.cloth !== clothOn) return false;
    if (gaitOn && book.gait !== gaitOn) return false;
    if (cityOn === "peak" && !peakCity(book.city)) return false;
    if (cityOn === "quiet" && !quietCity(book.city)) return false;
    if (cityOn && cityOn !== "peak" && cityOn !== "quiet" && book.city !== cityOn) return false;
    if (windowOn && String(book.window ?? "") !== windowOn) return false;
    if (weightOn && String(book.weight) !== weightOn) return false;
    if (houseOnly && !houseCloth(book.cloth)) return false;
    if (peakOnly && !peakCity(book.city)) return false;
    if (quietOnly && !quietCity(book.city)) return false;
    return true;
  });
}

export function sortDawn(books: readonly DawnBook[], sort: DawnSort): DawnBook[] {
  return books.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const city = (cityIndex(a.city) < 0 ? 99 : cityIndex(a.city)) - (cityIndex(b.city) < 0 ? 99 : cityIndex(b.city));
    if (city) return city;
    return a.title.localeCompare(b.title);
  });
}

export function dawnCounts(books: readonly DawnBook[], shown: readonly DawnBook[], deskCity: unknown): DawnCounts {
  const open = books.filter((book) => inTray(book, "open"));
  return {
    open: open.length,
    held: books.filter((book) => inTray(book, "held")).length,
    archived: books.filter((book) => inTray(book, "archived")).length,
    pinned: open.filter((book) => book.pinned).length,
    peak: open.filter((book) => peakCity(book.city)).length,
    quiet: open.filter((book) => quietCity(book.city)).length,
    soon: open.filter((book) => book.window === 15).length,
    weight: open.reduce((sum, book) => sum + book.weight, 0),
    house: open.filter((book) => houseCloth(book.cloth)).length,
    window: open.filter((book) => book.window !== null).length,
    matched: open.filter((book) => book.city && book.city === cityOf(deskCity)).length,
    seal: open.filter((book) => book.seal).length,
    cooling: open.filter((book) => coolingBook(book)).length,
  };
}

export function dawnShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashCityCount(books: readonly DawnBook[]): number {
  const open = books.filter((book) => inTray(book, "open") && book.city);
  return open.filter((book) => open.some((other) => other.id !== book.id && other.city === book.city)).length;
}

export function windowClashCount(books: readonly DawnBook[]): number {
  const open = books.filter((book) => inTray(book, "open") && book.city && book.window !== null);
  return open.filter((book) => open.some((other) => other.id !== book.id && other.city === book.city && other.window === book.window)).length;
}

export function neighborBookCount(books: readonly DawnBook[]): number {
  const open = books.filter((book) => inTray(book, "open") && cityIndex(book.city) >= 0);
  return open.filter((book) => open.some((other) => Math.abs(cityIndex(other.city) - cityIndex(book.city)) === 1)).length;
}

export function busiestKeeper(books: readonly DawnBook[]): string {
  const open = books.filter((book) => inTray(book, "open") && book.keeper);
  let best = "";
  let score = 0;
  for (const book of open) {
    const count = open.filter((item) => item.keeper.toLowerCase() === book.keeper.toLowerCase()).length;
    if (count > score) {
      best = book.keeper;
      score = count;
    }
  }
  return best;
}

export function pairKeeperCount(books: readonly DawnBook[]): number {
  const open = books.filter((book) => inTray(book, "open") && book.keeper);
  return open.filter((book) => open.filter((item) => item.keeper.toLowerCase() === book.keeper.toLowerCase()).length >= 2).length;
}

export function weightLoad(books: readonly DawnBook[]): number {
  return books.filter((book) => inTray(book, "open")).reduce((sum, book) => sum + book.weight, 0);
}

export function reminderBooks(books: readonly DawnBook[]): DawnBook[] {
  return books.filter((book) => inTray(book, "open") && book.window === 15 && !book.pinned);
}

export function coolingBooks(books: readonly DawnBook[]): DawnBook[] {
  return books.filter((book) => inTray(book, "open") && coolingBook(book));
}

export function matchedBooks(books: readonly DawnBook[], deskCity: unknown): DawnBook[] {
  const city = cityOf(deskCity);
  if (!city) return [];
  return books.filter((book) => inTray(book, "open") && book.city === city);
}

export function nextDawn(books: readonly DawnBook[], id: string): DawnBook | null {
  const open = sortDawn(books.filter((book) => inTray(book, "open")), "city");
  const at = open.findIndex((book) => book.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function dawnTimeline(books: readonly DawnBook[]): { city: string; titles: string[] }[] {
  const open = books.filter((book) => inTray(book, "open") && book.city);
  return DAWN_CITIES.map((city) => ({ city, titles: open.filter((book) => book.city === city).map((book) => book.title) })).filter((lane) => lane.titles.length);
}

export function dawnKeepers(books: readonly DawnBook[]): string[] {
  const out: string[] = [];
  for (const book of books) {
    if (!book.keeper || out.some((item) => item.toLowerCase() === book.keeper.toLowerCase())) continue;
    out.push(book.keeper);
  }
  return out;
}

export function dawnCopy(book: DawnBook): string {
  return [book.title, book.keeper, book.city, book.cloth, book.gait, book.window ?? "", book.note].filter((item) => item !== "").join(" · ");
}

export function dawnCsv(books: readonly DawnBook[], deskCity: unknown): string {
  const lines = ["title,keeper,city,cloth,gait,window,weight,tags,pinned,held,archived,seal,gap,late,cooling,peak,quiet,house,band,audit,note"];
  for (const book of readDawnBooks(books)) {
    const gap = cityGap(book.city, deskCity);
    lines.push([
      csvCell(book.title),
      csvCell(book.keeper),
      book.city,
      book.cloth,
      book.gait,
      book.window === null ? "" : String(book.window),
      String(book.weight),
      book.tags.join(" "),
      book.pinned ? "1" : "0",
      book.held ? "1" : "0",
      book.archived ? "1" : "0",
      book.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBook(book, deskCity) ? "1" : "0",
      coolingBook(book) ? "1" : "0",
      peakCity(book.city) ? "1" : "0",
      quietCity(book.city) ? "1" : "0",
      houseCloth(book.cloth) ? "1" : "0",
      cityBand(book.city),
      book.audit,
      csvCell(book.note),
    ].join(","));
  }
  return lines.join("\n");
}

function crestRecord(raw: CrestValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function crestName(raw: CrestValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = crestRecord(raw);
  return row ? clip(row.name, 80) : "";
}

function crestInk(raw: CrestValue): string {
  const row = crestRecord(raw);
  return row ? clip(row.ink, 40) : "";
}

function crestStand(raw: CrestValue): string {
  const row = crestRecord(raw);
  return row ? clip(row.stand, 40) : "";
}

function letterRun(name: string): string {
  return name.replace(/[^A-Za-z]/g, "");
}

function hasMoney(raw: CrestValue): boolean {
  const row = crestRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

/** A money field clears the crest. A name with a letter is set. A blank name is clear. */
export function crestState(raw: CrestValue): CrestState {
  if (hasMoney(raw)) return "";
  return /[A-Za-z]/.test(crestName(raw)) ? "set" : "clear";
}

/** First letter plus the letter count modulo nine. "Ada Lane" is A7. */
export function crestMark(raw: CrestValue): string {
  if (crestState(raw) !== "set") return "";
  const letters = letterRun(crestName(raw));
  if (!letters) return "";
  return `${letters[0].toUpperCase()}${letters.length % 9}`;
}

/** A hyphen is linked. An apostrophe is named. Otherwise the lane follows vowels against consonants. */
export function crestLane(raw: CrestValue): CrestLane {
  if (crestState(raw) !== "set") return "";
  const name = crestName(raw);
  if (name.includes("-")) return "linked";
  if (name.includes("'")) return "named";
  const letters = letterRun(name).toLowerCase();
  let vowels = 0;
  let consonants = 0;
  for (const char of letters) {
    if ("aeiou".includes(char)) vowels += 1;
    else consonants += 1;
  }
  if (vowels === 0) return "mute";
  if (vowels < consonants) return "spare";
  if (vowels === consonants) return "even";
  return "rich";
}

/** Tone follows the first letter of the desk. A question mark is clay. A digit is soot. */
export function crestTone(raw: CrestValue): CrestTone {
  if (crestState(raw) !== "set") return "";
  const stand = crestStand(raw);
  if (!stand) return "mist";
  if (stand.includes("?")) return "clay";
  const char = stand.match(/[A-Za-z0-9]/)?.[0] || "";
  if (!char) return "mist";
  if (/[0-9]/.test(char)) return "soot";
  const letter = char.toUpperCase();
  if (letter <= "D") return "gilt";
  if (letter <= "H") return "linen";
  if (letter <= "L") return "sand";
  if (letter <= "P") return "clay";
  return "ivory";
}

export function crestBound(raw: CrestValue): boolean {
  return crestState(raw) === "set" && /[A-Za-z]/.test(crestInk(raw));
}

export function crestWide(raw: CrestValue): boolean {
  return crestName(raw).trim().split(/\s+/).filter(Boolean).length >= 4;
}

export function crestNotch(raw: CrestValue): boolean {
  return /\d/.test(crestName(raw));
}

export function crestStep(raw: CrestValue): number {
  if (crestState(raw) !== "set") return 0;
  return Math.min(4, crestName(raw).trim().split(/\s+/).filter(Boolean).length);
}

export function crestJoin(raw: CrestValue): boolean {
  return crestName(raw).includes("&");
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

export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const tone = crestTone(row.note);
    if (!tone) continue;
    counts.set(tone, (counts.get(tone) || 0) + 1);
  }
  const bars = TONE_ORDER.filter((tone) => counts.has(tone)).map((tone) => ({ tone, count: counts.get(tone) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || TONE_ORDER.indexOf(a.tone) - TONE_ORDER.indexOf(b.tone))[0].tone;
}

export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const marks = rows.map((row) => crestMark(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneCrestCount(rows: readonly CrestRow[], lane: CrestLane): number {
  return rows.filter((row) => crestLane(row.note) === lane).length;
}

export function toneCrestCount(rows: readonly CrestRow[], tone: CrestTone): number {
  return rows.filter((row) => crestTone(row.note) === tone).length;
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
  tone: string,
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
    const toneName = crestTone(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (tone && tone !== "all" && toneName !== tone) return false;
    if (text && !`${row.label} ${crestName(row.note)} ${crestMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "link" && !crestJoin(row.note) && found !== "linked") return false;
    if (shape === "wide" && !crestWide(row.note)) return false;
    if (shape === "bound" && !crestBound(row.note)) return false;
    if (shape === "notch" && !crestNotch(row.note)) return false;
    if (shape === "named" && found !== "named") return false;
    return true;
  });
}

export function crestCopy(raw: CrestValue): string {
  return [crestMark(raw), crestLane(raw), crestTone(raw)].filter(Boolean).join(" ");
}

export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["lane,count"];
  for (const line of crestLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,notch,bound,linked,named,rich,even,spare,mute,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (crestState(row.note) !== "set") continue;
    const lane = crestLane(row.note);
    lines.push([
      csvCell(crestName(row.note)),
      crestMark(row.note),
      lane,
      crestTone(row.note),
      String(crestStep(row.note)),
      crestJoin(row.note) ? "1" : "0",
      crestWide(row.note) ? "1" : "0",
      crestNotch(row.note) ? "1" : "0",
      crestBound(row.note) ? "1" : "0",
      lane === "linked" ? "1" : "0",
      lane === "named" ? "1" : "0",
      lane === "rich" ? "1" : "0",
      lane === "even" ? "1" : "0",
      lane === "spare" ? "1" : "0",
      lane === "mute" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
