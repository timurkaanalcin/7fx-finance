/**
 * Traverse pegs for a course book kept in this browser, and note plates read the retention note already stored on the account.
 * Courses are north, east, south, and west. Threads are hemp, silk, and brass.
 * Speeds are 2, 4, or 8. Pegs are 1, 2, or 4.
 * A house note is one of nine desk phrases. A digit is a mark. A slash is a cut.
 * Four words are a court. Three words are a span. All capitals of four letters or more are a seal.
 * Sixteen letters or more are long. Three or fewer are short. A consonant start is open.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_traverse_peg (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   helm text not null default '',
 *   course text not null default '',
 *   finish text not null default '',
 *   thread text not null default '',
 *   speed_no integer,
 *   peg_no integer not null default 1,
 *   tags text not null default '',
 *   logged boolean not null default false,
 *   locked boolean not null default false,
 *   stowed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_note_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_note_review (
 *   trader_id text primary key
 * );
 */

export const TRV_KEY = "crmv4-traverse-peg";
export const TRV_VIEW_KEY = "crmv4-traverse-views";
export const TRV_DENSITY_KEY = "crmv4-traverse-density";
export const NTE_KEY = "crmv4-note-hide";
export const NTE_REVIEW_KEY = "crmv4-note-review";

export const TRAV_COURSES = ["north", "east", "south", "west"] as const;

export type TravCourse = (typeof TRAV_COURSES)[number];

export type TravFinish = "blank" | "ivory" | "graphite" | "champagne";

export type TravThread = "blank" | "hemp" | "silk" | "brass";

export type TravTray = "deck" | "locker" | "hold";

export type TravDensity = "air" | "tight";

export type TravSort = "course" | "helm";

export type TraversePeg = {
  id: string;
  title: string;
  note: string;
  helm: string;
  course: string;
  speed: number | null;
  finish: string;
  thread: string;
  peg: number;
  tags: string[];
  logged: boolean;
  locked: boolean;
  stowed: boolean;
  flagged: boolean;
  audit: string;
};

export type TravView = {
  id: string;
  name: string;
  tray: TravTray;
  query: string;
  helm: string;
  finish: string;
  thread: string;
  course: string;
  speed: string;
  peg: string;
};

export type TravCounts = {
  deck: number;
  locker: number;
  hold: number;
  logged: number;
  weather: number;
  lee: number;
  soon: number;
  peg: number;
  house: number;
  speed: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export type NoteLane = "" | "house" | "mark" | "slash" | "court" | "span" | "seal" | "open" | "long" | "short" | "desk";

export type NoteHue = "" | "ivory" | "graphite" | "champagne";

export type NoteState = "" | "clear" | "set";

export type NoteShape = "all" | "house" | "mark" | "slash" | "court" | "span" | "seal" | "open" | "long" | "short" | "desk" | "wide" | "leap" | "twin" | "known" | "echo" | "even" | "odd" | "space" | "digit" | "tail" | "cap";

export type NoteReview = "all" | "reviewed" | "fresh";

export type NoteValue = string | { retentionNote?: unknown; [key: string]: unknown } | null | undefined;

export type NoteRow = { id: string; label: string; note: NoteValue };

export type NoteLaneLine = { lane: string; count: number };

export const ROUND285_FEATURES = [
  "save",
  "note",
  "trays",
  "mark",
  "speed",
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
  "fair-helm",
  "viewer",
  "suggest",
  "sla",
  "notes",
  "note-csv",
] as const;

const AUDITS = ["save", "edit", "note", "thread", "log", "unlog", "lock", "resume", "stow", "open", "finish", "tag", "peg", "speed", "dip", "star"] as const;

const FINISHES = ["ivory", "graphite", "champagne"] as const;

const THREADS = ["hemp", "silk", "brass"] as const;

const SPEED_CYCLE = [2, 4, 8] as const;

const PEG_CYCLE = [1, 2, 4] as const;

const WEATHER = new Set(["north", "east"]);

const LEE = new Set(["south", "west"]);

const HOUSE_THREAD = new Set(["silk", "brass"]);

const NOON = new Set(["east"]);

const LANE_ORDER = ["house", "mark", "slash", "court", "span", "seal", "open", "long", "short", "desk"] as const;

const HUE_ORDER = ["ivory", "graphite", "champagne"] as const;

const HOUSE_NOTES = new Set(["call back", "send file", "warm lead", "vip desk", "hold line", "new book", "quiet week", "open file", "desk note"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 28;

const VIEW_CAP = 6;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TravTray {
  return raw === "locker" || raw === "hold" ? raw : "deck";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<TravFinish, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<TravFinish, "blank">) : "";
}

function threadName(raw: unknown): Exclude<TravThread, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (THREADS as readonly string[]).includes(text) ? (text as Exclude<TravThread, "blank">) : "";
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

function inTray(card: TraversePeg, tray: TravTray): boolean {
  if (tray === "locker") return card.locked && !card.stowed;
  if (tray === "hold") return card.stowed;
  return !card.locked && !card.stowed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function courseIndex(course: string): number {
  return TRAV_COURSES.indexOf(course as TravCourse);
}

function pegIndex(peg: number): number {
  return PEG_CYCLE.indexOf(peg as (typeof PEG_CYCLE)[number]);
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

export function courseOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (TRAV_COURSES as readonly string[]).includes(text) ? text : "";
}

/** A speed is 2, 4, or 8. Anything else stays blank. */
export function traverseSpeed(raw: unknown): 2 | 4 | 8 | null {
  if (!/^[248]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 2 | 4 | 8;
}

/** A peg is 1, 2, or 4. Anything else stays blank. */
export function traversePeg(raw: unknown): 1 | 2 | 4 | null {
  if (!/^[124]$/.test(wholeToken(raw))) return null;
  return Number(wholeToken(raw)) as 1 | 2 | 4;
}

/** Finish is ivory, graphite, or champagne. The saved finish is the upper case name. */
export function travFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

/** Thread is hemp, silk, or brass. A blank thread stays blank. */
export function travThread(raw: unknown): string {
  return threadName(raw);
}

export function weatherCourse(course: unknown): boolean {
  return WEATHER.has(clip(course, 8).toLowerCase());
}

export function leeCourse(course: unknown): boolean {
  return LEE.has(clip(course, 8).toLowerCase());
}

/** North is dawn. East is noon. South is dusk. West is night. */
export function courseBand(course: unknown): string {
  const text = courseOf(course);
  if (!text) return "";
  if (text === "north") return "dawn";
  if (NOON.has(text)) return "noon";
  if (text === "south") return "dusk";
  return "night";
}

/** Signed distance from one course to the desk course. */
export function courseGap(from: unknown, to: unknown): number | null {
  const left = courseIndex(courseOf(from));
  const right = courseIndex(courseOf(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseThread(thread: unknown): boolean {
  return HOUSE_THREAD.has(travThread(thread));
}

/** A pair peg is 2. One and four are not a pair. */
export function pairPeg(peg: unknown): boolean {
  return traversePeg(peg) === 2;
}

/** A square peg is 4. */
export function squarePeg(peg: unknown): boolean {
  return traversePeg(peg) === 4;
}

export function activeCourse(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "weather" || text === "lee") return text;
  return courseOf(text) || "all";
}

export function activeSpeed(raw: unknown): string {
  const speed = traverseSpeed(raw);
  return speed === null ? "all" : String(speed);
}

export function activeThread(raw: unknown, allow: readonly string[]): string {
  const text = travThread(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePeg(raw: unknown): string {
  const peg = traversePeg(raw);
  return peg === null ? "all" : String(peg);
}

export function activeTravFinish(raw: unknown): string {
  const text = finishName(raw);
  return text || "all";
}

export function moveTravFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestTravFinish(cards: readonly TraversePeg[]): string {
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

/** Before six, suggest two. Through the afternoon, four. Evening asks for eight. Saved speeds win when any exist. */
export function suggestSpeed(cards: readonly TraversePeg[], hour: number): 2 | 4 | 8 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "deck") || card.speed === null) continue;
    counts.set(card.speed, (counts.get(card.speed) || 0) + 1);
  }
  let best: 2 | 4 | 8 | null = null;
  let score = 0;
  for (const speed of SPEED_CYCLE) {
    const count = counts.get(speed) || 0;
    if (count > score) {
      best = speed;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 6) return 2;
  if (hour < 14) return 4;
  return 8;
}

/** Before ten, suggest north. The rest of the day suggests west. */
export function suggestCourse(hour: number): TravCourse {
  return hour < 10 ? "north" : "west";
}

/** The helm with the fewest unlogged deck pegs. A tie keeps the roster order. */
export function fairHelmsman(cards: readonly TraversePeg[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "deck") && !card.logged);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.helm.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readTraverse(raw: unknown): TraversePeg[] {
  if (!Array.isArray(raw)) return [];
  const out: TraversePeg[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TraversePeg>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      helm: clip(row.helm, 24),
      course: courseOf(row.course),
      speed: traverseSpeed(row.speed),
      finish: travFinish(row.finish),
      thread: travThread(row.thread),
      peg: traversePeg(row.peg) ?? 1,
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

export function addTraverse(
  cards: readonly TraversePeg[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    helm?: string;
    course?: string;
    speed?: unknown;
    finish?: string;
    thread?: string;
    peg?: unknown;
    tags?: string;
  },
): TraversePeg[] {
  const current = readTraverse(cards);
  const id = clip(card.id, 40);
  const title = lineOf(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: TraversePeg = {
    id,
    title,
    note: noteOf(card.note),
    helm: clip(card.helm, 24),
    course: courseOf(card.course),
    speed: traverseSpeed(card.speed),
    finish: travFinish(card.finish),
    thread: travThread(card.thread),
    peg: traversePeg(card.peg) ?? 1,
    tags: tagsOf(card.tags),
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CARD_CAP);
}

function mapCard(cards: readonly TraversePeg[], id: string, change: (card: TraversePeg) => TraversePeg): TraversePeg[] {
  return readTraverse(cards).map((card) => (card.id === id ? change(card) : card));
}

function touchIds(cards: readonly TraversePeg[], ids: readonly string[], change: (card: TraversePeg) => TraversePeg): TraversePeg[] {
  const picked = new Set(ids);
  return readTraverse(cards).map((card) => (picked.has(card.id) ? change(card) : card));
}

export function editTraverse(cards: readonly TraversePeg[], id: string, title: string): TraversePeg[] {
  const next = lineOf(title);
  if (!next) return readTraverse(cards);
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTraverseNote(cards: readonly TraversePeg[], id: string, note: string): TraversePeg[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function setTraverseLogged(cards: readonly TraversePeg[], id: string, logged: boolean): TraversePeg[] {
  return mapCard(cards, id, (card) => (card.logged === logged ? card : { ...card, logged, audit: logged ? "log" : "unlog" }));
}

export function setTraverseLock(cards: readonly TraversePeg[], id: string, locked: boolean): TraversePeg[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, stowed: locked ? false : card.stowed, audit: locked ? "lock" : "resume" }));
}

export function setTraverseStow(cards: readonly TraversePeg[], id: string, stowed: boolean): TraversePeg[] {
  return mapCard(cards, id, (card) => (card.stowed === stowed ? card : { ...card, stowed, locked: stowed ? false : card.locked, audit: stowed ? "stow" : "open" }));
}

export function setTraverseStar(cards: readonly TraversePeg[], id: string, flagged: boolean): TraversePeg[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function setTraverseFinish(cards: readonly TraversePeg[], id: string, finish: unknown): TraversePeg[] {
  const next = travFinish(finish);
  if (!next) return readTraverse(cards);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

/** Thread steps hemp, silk, brass, then hemp again. A blank thread starts at hemp. */
export function cycleThread(cards: readonly TraversePeg[], id: string): TraversePeg[] {
  return mapCard(cards, id, (card) => {
    const at = THREADS.indexOf(card.thread as (typeof THREADS)[number]);
    const next = at < 0 ? THREADS[0] : THREADS[(at + 1) % THREADS.length];
    return next === card.thread ? card : { ...card, thread: next, audit: "thread" };
  });
}

export function addTraverseTag(cards: readonly TraversePeg[], id: string, tag: string): TraversePeg[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTraverse(cards);
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

/** A blank speed becomes 2, 2 becomes 4, and 4 becomes 8. A speed of 8 stays. */
export function liftSpeed(cards: readonly TraversePeg[], id: string): TraversePeg[] {
  return mapCard(cards, id, (card) => {
    if (card.speed === 8) return card;
    const next = card.speed === 4 ? 8 : card.speed === 2 ? 4 : 2;
    return { ...card, speed: next, audit: "speed" };
  });
}

/** A blank speed becomes 8, 8 becomes 4, and 4 becomes 2. A speed of 2 stays. */
export function dipSpeed(cards: readonly TraversePeg[], id: string): TraversePeg[] {
  return mapCard(cards, id, (card) => {
    if (card.speed === 2) return card;
    const next = card.speed === 4 ? 2 : card.speed === 8 ? 4 : 8;
    return { ...card, speed: next, audit: "dip" };
  });
}

export function raisePeg(cards: readonly TraversePeg[], id: string): TraversePeg[] {
  return mapCard(cards, id, (card) => {
    const at = pegIndex(card.peg);
    if (at < 0) return { ...card, peg: 1, audit: "peg" };
    if (at === PEG_CYCLE.length - 1) return card;
    return { ...card, peg: PEG_CYCLE[at + 1], audit: "peg" };
  });
}

export function lowerPeg(cards: readonly TraversePeg[], id: string): TraversePeg[] {
  return mapCard(cards, id, (card) => {
    const at = pegIndex(card.peg);
    if (at <= 0) return card;
    return { ...card, peg: PEG_CYCLE[at - 1], audit: "peg" };
  });
}

export function bulkTraverseLog(cards: readonly TraversePeg[], ids: readonly string[]): TraversePeg[] {
  return touchIds(cards, ids, (card) => ({ ...card, logged: true, audit: "log" }));
}

export function bulkTraverseStow(cards: readonly TraversePeg[], ids: readonly string[]): TraversePeg[] {
  return touchIds(cards, ids, (card) => ({ ...card, stowed: true, locked: false, audit: "stow" }));
}

export function bulkTraverseBrass(cards: readonly TraversePeg[], ids: readonly string[]): TraversePeg[] {
  return touchIds(cards, ids, (card) => ({ ...card, thread: "brass", audit: "thread" }));
}

export function bulkTraverseChampagne(cards: readonly TraversePeg[], ids: readonly string[]): TraversePeg[] {
  return touchIds(cards, ids, (card) => ({ ...card, finish: "CHAMPAGNE", audit: "finish" }));
}

export function bulkTraverseTag(cards: readonly TraversePeg[], ids: readonly string[], tag: string): TraversePeg[] {
  const next = tagsOf(tag)[0];
  if (!next) return readTraverse(cards);
  return touchIds(cards, ids, (card) => {
    if (card.tags.includes(next) || card.tags.length >= TAG_CAP) return card;
    return { ...card, tags: [...card.tags, next], audit: "tag" };
  });
}

function focused(cards: readonly TraversePeg[], ids: readonly string[], index: number, change: (list: readonly TraversePeg[], id: string) => TraversePeg[]): TraversePeg[] {
  const id = ids[index];
  return id ? change(cards, id) : readTraverse(cards);
}

export function liftSpeedFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  return focused(cards, ids, index, liftSpeed);
}

export function dipSpeedFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  return focused(cards, ids, index, dipSpeed);
}

export function threadFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  return focused(cards, ids, index, cycleThread);
}

export function raisePegFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  return focused(cards, ids, index, raisePeg);
}

export function lowerPegFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  return focused(cards, ids, index, lowerPeg);
}

export function logTraverseFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  const id = ids[index];
  if (!id) return readTraverse(cards);
  const card = readTraverse(cards).find((item) => item.id === id);
  return card ? setTraverseLogged(cards, id, !card.logged) : readTraverse(cards);
}

export function lockTraverseFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  const id = ids[index];
  if (!id) return readTraverse(cards);
  const card = readTraverse(cards).find((item) => item.id === id);
  return card ? setTraverseLock(cards, id, !card.locked) : readTraverse(cards);
}

export function starTraverseFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number): TraversePeg[] {
  const id = ids[index];
  if (!id) return readTraverse(cards);
  const card = readTraverse(cards).find((item) => item.id === id);
  return card ? setTraverseStar(cards, id, !card.flagged) : readTraverse(cards);
}

export function tagTraverseFocused(cards: readonly TraversePeg[], ids: readonly string[], index: number, tag: string): TraversePeg[] {
  const id = ids[index];
  return id ? addTraverseTag(cards, id, tag) : readTraverse(cards);
}

export function readTraverseViews(raw: unknown): TravView[] {
  if (!Array.isArray(raw)) return [];
  const out: TravView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TravView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      helm: clip(row.helm, 24),
      finish: activeTravFinish(row.finish),
      thread: activeThread(row.thread, THREADS),
      course: activeCourse(row.course),
      speed: activeSpeed(row.speed),
      peg: activePeg(row.peg),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTraverseView(
  views: readonly TravView[],
  view: {
    id?: string;
    name?: string;
    tray?: string;
    query?: string;
    helm?: string;
    finish?: string;
    thread?: string;
    course?: string;
    speed?: string;
    peg?: string;
  },
): TravView[] {
  const current = readTraverseViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: TravView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    helm: clip(view.helm, 24),
    finish: activeTravFinish(view.finish),
    thread: activeThread(view.thread, THREADS),
    course: activeCourse(view.course),
    speed: activeSpeed(view.speed),
    peg: activePeg(view.peg),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropTraverseView(views: readonly TravView[], id: string): TravView[] {
  return readTraverseViews(views).filter((view) => view.id !== id);
}

export function traverseDensity(raw: unknown): TravDensity {
  return raw === "tight" ? "tight" : "air";
}

/** A course more than one step behind the desk, on peg 1, is late. */
export function lateTraverse(card: TraversePeg, deskCourse: unknown): boolean {
  const gap = courseGap(card.course, deskCourse);
  return card.peg === 1 && gap !== null && gap > 1;
}

export function idleTraverse(card: TraversePeg): boolean {
  return card.thread === "hemp" && leeCourse(card.course) && card.peg === 1;
}

export function briskTraverse(card: TraversePeg): boolean {
  return card.peg === 4 && card.thread === "brass" && weatherCourse(card.course);
}

export function restingTraverse(card: TraversePeg): boolean {
  return card.speed === 8 && card.thread === "silk" && card.course === "west";
}

/** A speed of two on a lee course is overdue unless the peg is logged. */
export function overdueTraverse(card: TraversePeg): boolean {
  return card.speed === 2 && leeCourse(card.course) && !card.logged;
}

export function visibleTraverse(
  cards: readonly TraversePeg[],
  tray: TravTray,
  query: string,
  helm: string,
  finish: string,
  thread: string,
  course: string,
  speed: string,
  peg: string,
  houseOnly: boolean,
  weatherOnly: boolean,
  leeOnly: boolean,
): TraversePeg[] {
  const text = query.trim().toLowerCase();
  const helmOn = helm === "all" ? "" : helm.trim().toLowerCase();
  const finishOn = finish === "all" ? "" : travFinish(finish);
  const threadOn = thread === "all" ? "" : travThread(thread);
  const courseOn = course === "all" ? "" : activeCourse(course);
  const speedOn = speed === "all" ? "" : activeSpeed(speed);
  const pegOn = peg === "all" ? "" : activePeg(peg);
  return readTraverse(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note}`.toLowerCase().includes(text)) return false;
    if (helmOn && card.helm.toLowerCase() !== helmOn) return false;
    if (finishOn && card.finish !== finishOn) return false;
    if (threadOn && card.thread !== threadOn) return false;
    if (courseOn === "weather" && !weatherCourse(card.course)) return false;
    if (courseOn === "lee" && !leeCourse(card.course)) return false;
    if (courseOn && courseOn !== "weather" && courseOn !== "lee" && card.course !== courseOn) return false;
    if (speedOn && String(card.speed ?? "") !== speedOn) return false;
    if (pegOn && String(card.peg) !== pegOn) return false;
    if (houseOnly && !houseThread(card.thread)) return false;
    if (weatherOnly && !weatherCourse(card.course)) return false;
    if (leeOnly && !leeCourse(card.course)) return false;
    return true;
  });
}

export function sortTraverse(cards: readonly TraversePeg[], sort: TravSort): TraversePeg[] {
  return cards.slice().sort((a, b) => {
    if (a.logged !== b.logged) return a.logged ? -1 : 1;
    if (sort === "helm") {
      const helm = a.helm.localeCompare(b.helm);
      if (helm) return helm;
    }
    const course = (courseIndex(a.course) < 0 ? 99 : courseIndex(a.course)) - (courseIndex(b.course) < 0 ? 99 : courseIndex(b.course));
    if (course) return course;
    return a.title.localeCompare(b.title);
  });
}

export function traverseCounts(cards: readonly TraversePeg[], shown: readonly TraversePeg[], deskCourse: unknown): TravCounts {
  const open = cards.filter((card) => inTray(card, "deck"));
  return {
    deck: open.length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    hold: cards.filter((card) => inTray(card, "hold")).length,
    logged: open.filter((card) => card.logged).length,
    weather: open.filter((card) => weatherCourse(card.course)).length,
    lee: open.filter((card) => leeCourse(card.course)).length,
    soon: open.filter((card) => card.speed === 2).length,
    peg: open.reduce((sum, card) => sum + card.peg, 0),
    house: open.filter((card) => houseThread(card.thread)).length,
    speed: open.filter((card) => card.speed !== null).length,
    matched: shown.filter((card) => card.course && card.course === courseOf(deskCourse)).length,
    flagged: open.filter((card) => card.flagged).length,
    idle: open.filter((card) => idleTraverse(card)).length,
    brisk: open.filter((card) => briskTraverse(card)).length,
    resting: open.filter((card) => restingTraverse(card)).length,
    overdue: open.filter((card) => overdueTraverse(card)).length,
    pair: open.filter((card) => pairPeg(card.peg)).length,
  };
}

export function clashCourseCount(cards: readonly TraversePeg[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && card.course);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.course === card.course && other.peg === card.peg)).length;
}

export function neighborPegCount(cards: readonly TraversePeg[]): number {
  const open = cards.filter((card) => inTray(card, "deck") && pegIndex(card.peg) >= 0);
  return open.filter((card) => open.some((other) => {
    if (other.id === card.id) return false;
    const gap = Math.abs(pegIndex(other.peg) - pegIndex(card.peg));
    const ring = Math.min(gap, PEG_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestHelm(cards: readonly TraversePeg[]): string {
  const open = cards.filter((card) => inTray(card, "deck") && card.helm);
  let best = "";
  let score = 0;
  for (const card of open) {
    const count = open.filter((item) => item.helm.toLowerCase() === card.helm.toLowerCase()).length;
    if (count > score) {
      best = card.helm;
      score = count;
    }
  }
  return best;
}

export function reminderTraverse(cards: readonly TraversePeg[]): TraversePeg[] {
  return cards.filter((card) => inTray(card, "deck") && (card.speed === 2 || card.speed === 4));
}

export function idleTraverseList(cards: readonly TraversePeg[]): TraversePeg[] {
  return cards.filter((card) => inTray(card, "deck") && idleTraverse(card));
}

export function traverseTimeline(cards: readonly TraversePeg[]): { peg: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return PEG_CYCLE.map((peg) => ({ peg, titles: open.filter((card) => card.peg === peg).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function traverseBars(cards: readonly TraversePeg[]): { course: string; count: number }[] {
  const open = cards.filter((card) => inTray(card, "deck"));
  return TRAV_COURSES.map((course) => ({ course, count: open.filter((card) => card.course === course).length }));
}

export function traverseHelms(cards: readonly TraversePeg[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (!card.helm || out.some((item) => item.toLowerCase() === card.helm.toLowerCase())) continue;
    out.push(card.helm);
  }
  return out;
}

export function traverseCopy(card: TraversePeg): string {
  return [card.title, card.helm, card.course, card.finish, card.thread, card.speed ?? "", card.peg, card.note].filter((item) => item !== "").join(" · ");
}

export function traverseCsv(cards: readonly TraversePeg[], deskCourse: unknown): string {
  const lines = ["title,helm,course,finish,thread,speed,peg,tags,logged,locked,stowed,starred,gap,late,idle,weather,lee,house,band,brisk,resting,overdue,pair,square,audit,note"];
  for (const card of readTraverse(cards)) {
    const gap = courseGap(card.course, deskCourse);
    lines.push([
      csvCell(card.title),
      csvCell(card.helm),
      card.course,
      card.finish,
      card.thread,
      card.speed === null ? "" : String(card.speed),
      String(card.peg),
      card.tags.join(" "),
      card.logged ? "1" : "0",
      card.locked ? "1" : "0",
      card.stowed ? "1" : "0",
      card.flagged ? "1" : "0",
      gap === null ? "" : String(gap),
      lateTraverse(card, deskCourse) ? "1" : "0",
      idleTraverse(card) ? "1" : "0",
      weatherCourse(card.course) ? "1" : "0",
      leeCourse(card.course) ? "1" : "0",
      houseThread(card.thread) ? "1" : "0",
      courseBand(card.course),
      briskTraverse(card) ? "1" : "0",
      restingTraverse(card) ? "1" : "0",
      overdueTraverse(card) ? "1" : "0",
      pairPeg(card.peg) ? "1" : "0",
      squarePeg(card.peg) ? "1" : "0",
      card.audit,
      csvCell(card.note),
    ].join(","));
  }
  return lines.join("\n");
}

function noteRecord(raw: NoteValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function hasBlocked(raw: NoteValue): boolean {
  const row = noteRecord(raw);
  if (!row) return false;
  return BLOCKED.some((key) => row[key] != null && row[key] !== "");
}

function foldNote(raw: string): string {
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function noteGiven(raw: NoteValue): string {
  if (hasBlocked(raw)) return "";
  const row = noteRecord(raw);
  if (row && !("retentionNote" in row)) return "";
  return row ? clip(row.retentionNote, 48) : clip(raw, 48);
}

function noteLetters(given: string): string {
  return foldNote(given).replace(/[^a-z]/g, "");
}

function noteWords(given: string): string[] {
  return foldNote(given).split(" ").filter((word) => /[a-z]/.test(word));
}

function noteSeal(given: string): boolean {
  return /[A-Z]/.test(given) && given === given.toUpperCase() && noteLetters(given).length >= 4;
}

/** A blocked money field clears the plate. A real note is set. A blank line is clear. */
export function noteState(raw: NoteValue): NoteState {
  if (hasBlocked(raw)) return "";
  const row = noteRecord(raw);
  if (row && !("retentionNote" in row)) return "";
  return noteGiven(raw) ? "set" : "clear";
}

/** House phrases are the nine desk lines. A digit is a mark. A slash is a cut. */
export function noteLane(raw: NoteValue): NoteLane {
  if (noteState(raw) !== "set") return "";
  const given = noteGiven(raw);
  const folded = foldNote(given);
  const letters = noteLetters(given);
  const words = noteWords(given);
  if (HOUSE_NOTES.has(folded)) return "house";
  if (/\d/.test(given)) return "mark";
  if (given.includes("/")) return "slash";
  if (words.length >= 4) return "court";
  if (words.length === 3) return "span";
  if (noteSeal(given)) return "seal";
  if (letters.length >= 16) return "long";
  if (letters.length > 0 && letters.length <= 3) return "short";
  if (/^[^aeiou]/.test(letters)) return "open";
  return letters ? "desk" : "";
}

/** The first two letters. */
export function noteStamp(raw: NoteValue): string {
  if (noteState(raw) !== "set") return "";
  const letters = noteLetters(noteGiven(raw));
  return letters.slice(0, 2).toUpperCase();
}

/** Ivory starts in a–h. Graphite starts in i–q. Champagne starts in r–z. */
export function noteHue(raw: NoteValue): NoteHue {
  if (noteState(raw) !== "set") return "";
  const letters = noteLetters(noteGiven(raw));
  const first = letters.slice(0, 1);
  if (!first) return "";
  if (first <= "h") return "ivory";
  if (first <= "q") return "graphite";
  return "champagne";
}

export function noteTwin(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return /([a-z])\1/.test(noteLetters(noteGiven(raw)));
}

export function noteWide(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return noteLetters(noteGiven(raw)).length > 16;
}

export function noteSlash(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return noteGiven(raw).includes("/");
}

export function noteSpace(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return /\s/.test(noteGiven(raw));
}

export function noteDigit(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return /\d/.test(noteGiven(raw));
}

export function noteLeap(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return noteLetters(noteGiven(raw)).length === 6;
}

export function noteKnown(raw: NoteValue): boolean {
  return noteLane(raw) === "house";
}

export function noteCap(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return noteSeal(noteGiven(raw));
}

export function noteTail(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  return /[^aeiou]$/.test(noteLetters(noteGiven(raw)));
}

export function noteEcho(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  const letters = noteLetters(noteGiven(raw));
  const counts = new Map<string, number>();
  for (const letter of letters) counts.set(letter, (counts.get(letter) || 0) + 1);
  return Array.from(counts.values()).some((count) => count >= 4);
}

export function noteEven(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  const count = noteLetters(noteGiven(raw)).length;
  return count > 0 && count % 2 === 0;
}

export function noteOdd(raw: NoteValue): boolean {
  if (noteState(raw) !== "set") return false;
  const count = noteLetters(noteGiven(raw)).length;
  return count % 2 === 1;
}

export function noteGroups(raw: NoteValue): number {
  if (noteState(raw) !== "set") return 0;
  return noteWords(noteGiven(raw)).length;
}

export function noteStep(raw: NoteValue): number {
  if (noteState(raw) !== "set") return 0;
  return noteLetters(noteGiven(raw)).length;
}

export function noteLanes(rows: readonly NoteRow[]): NoteLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of LANE_ORDER) counts.set(lane, 0);
  for (const row of rows) {
    const lane = noteLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingNote(rows: readonly NoteRow[]): string {
  const lines = noteLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingNoteHue(rows: readonly NoteRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of HUE_ORDER) counts.set(hue, 0);
  for (const row of rows) {
    const hue = noteHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HUE_ORDER.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue as (typeof HUE_ORDER)[number]) - HUE_ORDER.indexOf(b.hue as (typeof HUE_ORDER)[number]))[0].hue;
}

export function sharedNoteCount(rows: readonly NoteRow[]): number {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const stamp = noteStamp(row.note);
    if (!stamp) continue;
    seen.set(stamp, (seen.get(stamp) || 0) + 1);
  }
  return Array.from(seen.values()).filter((count) => count > 1).length;
}

export function laneNoteCount(rows: readonly NoteRow[], lane: NoteLane): number {
  return rows.filter((row) => noteLane(row.note) === lane).length;
}

export function noteShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentNoteLanes(rows: readonly NoteRow[]): string[] {
  return noteLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenNotes(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedNotes(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleNote(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleNoteReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkNoteReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleNoteLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleNotes(
  rows: readonly NoteRow[],
  lane: string,
  hue: string,
  query: string,
  review: NoteReview,
  reviewed: readonly string[],
  shape: NoteShape,
): NoteRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (noteState(row.note) === "") return false;
    const found = noteLane(row.note);
    const hueName = noteHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${noteGiven(row.note)} ${noteStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "house" && found !== "house") return false;
    if (shape === "mark" && found !== "mark") return false;
    if (shape === "slash" && found !== "slash") return false;
    if (shape === "court" && found !== "court") return false;
    if (shape === "span" && found !== "span") return false;
    if (shape === "seal" && found !== "seal") return false;
    if (shape === "open" && found !== "open") return false;
    if (shape === "long" && found !== "long") return false;
    if (shape === "short" && found !== "short") return false;
    if (shape === "desk" && found !== "desk") return false;
    if (shape === "wide" && !noteWide(row.note)) return false;
    if (shape === "leap" && !noteLeap(row.note)) return false;
    if (shape === "twin" && !noteTwin(row.note)) return false;
    if (shape === "known" && !noteKnown(row.note)) return false;
    if (shape === "echo" && !noteEcho(row.note)) return false;
    if (shape === "even" && !noteEven(row.note)) return false;
    if (shape === "odd" && !noteOdd(row.note)) return false;
    if (shape === "space" && !noteSpace(row.note)) return false;
    if (shape === "digit" && !noteDigit(row.note)) return false;
    if (shape === "tail" && !noteTail(row.note)) return false;
    if (shape === "cap" && !noteCap(row.note)) return false;
    return true;
  });
}

export function noteCopy(raw: NoteValue): string {
  return [noteStamp(raw), noteLane(raw), noteHue(raw)].filter(Boolean).join(" ");
}

export function noteLanesCsv(rows: readonly NoteRow[]): string {
  const lines = ["lane,count"];
  for (const line of noteLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function noteRowsCsv(rows: readonly NoteRow[], reviewed: readonly string[]): string {
  const lines = ["name,note,stamp,lane,hue,step,groups,echo,wide,slash,leap,twin,known,cap,tail,even,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (noteState(row.note) !== "set") continue;
    lines.push([
      csvCell(row.label),
      csvCell(noteGiven(row.note)),
      noteStamp(row.note),
      noteLane(row.note),
      noteHue(row.note),
      String(noteStep(row.note)),
      String(noteGroups(row.note)),
      noteEcho(row.note) ? "1" : "0",
      noteWide(row.note) ? "1" : "0",
      noteSlash(row.note) ? "1" : "0",
      noteLeap(row.note) ? "1" : "0",
      noteTwin(row.note) ? "1" : "0",
      noteKnown(row.note) ? "1" : "0",
      noteCap(row.note) ? "1" : "0",
      noteTail(row.note) ? "1" : "0",
      noteEven(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
