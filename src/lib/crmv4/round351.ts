/**
 * Rehaut rules for a chapter ring kept in this browser, and first-trade plates read ftd already stored on the account.
 * Modes are chapter, minute, railroad, and pulse. Finishes are gilt, ivory, and graphite.
 * Steps are 5, 10, 20, or 40. Studs are 2, 4, or 8.
 * Chapter and minute are inner. Railroad and pulse are outer.
 * A known first-trade mark is FUNDED, OPEN, HOLD, or DEMO, including FTD_YES, FTD_NONE, FTD_HOLD, and FTD_DEMO.
 * A plus joins two parts. A colon marks a pause.
 * A brief mark is exactly five characters. A stamp starts with a digit. A long mark is fourteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true mark reads as FUNDED. An empty mark reads as NONE. The plate does not change the saved flag.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_rehaut (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   piece text not null default '',
 *   drop_no integer,
 *   film text not null default '',
 *   lock_no integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_fdp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_fdp_review (
 *   trader_id text primary key
 * );
 */

export const RHT_KEY = "crmv4-rehaut";
export const RHT_VIEW_KEY = "crmv4-rehaut-views";
export const RHT_DENSITY_KEY = "crmv4-rehaut-density";
export const RHT_MODES = ["chapter", "minute", "railroad", "pulse"] as const;

export type RehautMode = (typeof RHT_MODES)[number];
export type RehautFilm = "blank" | "gilt" | "ivory" | "graphite";
export type RehautTray = "board" | "peg" | "coffer";
export type RehautDensity = "airy" | "close";
export type RehautSort = "piece" | "setter";

export type Rehaut = {
  id: string;
  title: string;
  note: string;
  setter: string;
  piece: string;
  drop: number | null;
  film: string;
  lock: number;
  tags: string[];
  raised: boolean;
  pinned: boolean;
  coffered: boolean;
  starred: boolean;
  audit: string;
};

export type RehautView = {
  id: string;
  name: string;
  tray: RehautTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type RehautCounts = {
  board: number;
  peg: number;
  coffer: number;
  raised: number;
  inner: number;
  outer: number;
  tall: number;
  quiet: number;
  drop: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND351_FEATURES = [
  "rehaut-save",
  "ring-reminders",
  "rehaut-modes",
  "rehaut-search",
  "rehaut-pin-sla",
  "ring-archive",
  "rehaut-latch-star",
  "rehaut-inline-title",
  "rehaut-filters",
  "saved-rehaut-views",
  "rehaut-density",
  "focus-order",
  "rehaut-kpis",
  "ring-chart",
  "ring-timeline",
  "rehaut-bulk",
  "rehaut-csv",
  "rehaut-keys",
  "rehaut-audit",
  "quiet-keeper",
  "rehaut-viewer",
  "suggest-ring",
  "overdue-rings",
  "first-trade-plate",
  "first-trade-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 10, 20, 40] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["chapter", "minute"]);
const OUTER = new Set(["railroad", "pulse"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["FUNDED", "OPEN", "HOLD", "DEMO"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RehautTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<RehautFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<RehautFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cm]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Rehaut, tray: RehautTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return RHT_MODES.indexOf(piece as RehautMode);
}

function dropIndex(drop: number): number {
  return DROP_CYCLE.indexOf(drop as (typeof DROP_CYCLE)[number]);
}

function lockIndex(lock: number): number {
  return LOCK_CYCLE.indexOf(lock as (typeof LOCK_CYCLE)[number]);
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

export function rehautMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RHT_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function rehautHour(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function rehautHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function rehautFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function rehautInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function rehautOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function rehautBand(piece: unknown): string {
  const text = rehautMode(piece);
  if (!text) return "";
  if (text === "chapter") return "ring";
  if (text === "minute") return "tick";
  if (text === "railroad") return "rail";
  return "beat";
}

/** Signed distance from one piece to another along the oscillator. */
export function rehautGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(rehautMode(from));
  const right = pieceIndex(rehautMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(rehautFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return rehautHammer(lock) === 4;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return rehautHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return rehautMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = rehautHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = rehautFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = rehautHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveRehautFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Rehaut[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["IVORY", "GILT", "GRAPHITE"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before four, suggest turn three. Before nine, suggest turn seven. Before three in the afternoon, suggest turn twelve. Later, suggest turn eighteen. A saved turn on the floor wins, and a tie keeps the shorter turn. */
/** Before six, suggest angle five. Before noon, suggest ten. Before six in the evening, suggest fifteen. Later, suggest twenty. A saved angle on the floor wins, and a tie keeps the shorter angle. */
export function suggestHour(cards: readonly Rehaut[], hour: number): 5 | 10 | 20 | 40 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 20 | 40 = 5;
    let score = Number.POSITIVE_INFINITY;
    for (const drop of DROP_CYCLE) {
      const count = counts.get(drop) || 0;
      if (count < score) {
        best = drop;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 5;
  if (hour < 12) return 10;
  if (hour < 18) return 20;
  return 40;
}

export function suggestMode(hour: number): RehautMode {
  return hour < 6 ? "chapter" : "pulse";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Rehaut[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readRehauts(raw: unknown): Rehaut[] {
  if (!Array.isArray(raw)) return [];
  const out: Rehaut[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Rehaut>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: rehautMode(row.piece),
      drop: rehautHour(row.drop),
      film: rehautFilm(row.film),
      lock: rehautHammer(row.lock) ?? 2,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      pinned: row.pinned === true,
      coffered: row.coffered === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addRehaut(
  cards: readonly Rehaut[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    setter?: string;
    piece?: string;
    drop?: unknown;
    film?: string;
    lock?: unknown;
    tags?: unknown;
  },
): Rehaut[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRehauts([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: rehautMode(card.piece),
      drop: rehautHour(card.drop),
      film: rehautFilm(card.film),
      lock: rehautHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Rehaut[], id: string, edit: (card: Rehaut) => Rehaut): Rehaut[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRehaut(cards: readonly Rehaut[], id: string, title: string): Rehaut[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRehautNote(cards: readonly Rehaut[], id: string, note: string): Rehaut[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(rehautFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRehautFilm(cards: readonly Rehaut[], id: string, film: string): Rehaut[] {
  const next = rehautFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setRehautRaised(cards: readonly Rehaut[], id: string, raised: boolean): Rehaut[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setRehautPin(cards: readonly Rehaut[], id: string, pinned: boolean): Rehaut[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setRehautCoffer(cards: readonly Rehaut[], id: string, coffered: boolean): Rehaut[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setRehautStar(cards: readonly Rehaut[], id: string, starred: boolean): Rehaut[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRehautTag(cards: readonly Rehaut[], id: string, tag: string): Rehaut[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 5 | 10 | 20 | 40 {
  if (drop === null) return dir > 0 ? 5 : 40;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setRehautFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinRehautFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return setRehautPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starRehautFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  return setRehautStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Rehaut[], id: string): Rehaut[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRehautFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Rehaut[], ids: readonly string[], edit: (card: Rehaut) => Rehaut): Rehaut[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRehautGraphite(cards: readonly Rehaut[], ids: readonly string[]): Rehaut[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkRehautRaise(cards: readonly Rehaut[], ids: readonly string[]): Rehaut[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkRehautCoffer(cards: readonly Rehaut[], ids: readonly string[]): Rehaut[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkRehautTag(cards: readonly Rehaut[], ids: readonly string[]): Rehaut[] {
  return bulk(cards, ids, (card) => (card.tags.includes("m") ? card : { ...card, tags: tagsOf([...card.tags, "m"]), audit: "tag" }));
}

export function readRehautViews(raw: unknown): RehautView[] {
  if (!Array.isArray(raw)) return [];
  const out: RehautView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RehautView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeFinish(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      piece: activeMode(row.piece),
      drop: activeHour(row.drop),
      lock: activeHammer(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addRehautView(views: readonly RehautView[], view: RehautView): RehautView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRehautViews([...views, { ...view, id, name }]);
}

export function dropRehautView(views: readonly RehautView[], id: string): RehautView[] {
  return views.filter((view) => view.id !== id);
}

export function rehautDensity(raw: unknown): RehautDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortRehauts(cards: readonly Rehaut[], sort: RehautSort): Rehaut[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "setter") {
      const setter = a.setter.localeCompare(b.setter);
      if (setter) return setter;
    } else {
      const piece = pieceIndex(a.piece) - pieceIndex(b.piece);
      if (piece) return piece;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleRehauts(
  cards: readonly Rehaut[],
  tray: RehautTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Rehaut[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : rehautFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !rehautInner(card.piece)) return false;
    if (wantLimb === "outer" && !rehautOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueRehaut(card: Rehaut): boolean {
  return rehautOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleRehaut(card: Rehaut): boolean {
  return !card.film && card.drop === 5 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskRehaut(card: Rehaut): boolean {
  return card.film === "GILT" && card.drop === 40 && card.lock === 8 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingRehaut(card: Rehaut): boolean {
  return card.piece === "pulse" && card.film === "IVORY" && card.drop === 10;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateRehaut(card: Rehaut, station: string): boolean {
  return card.piece === "chapter" && rehautMode(station) === "pulse" && !card.raised;
}

export function rehautCounts(cards: readonly Rehaut[], shown: readonly Rehaut[], station: string): RehautCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => rehautInner(card.piece)).length,
    outer: cards.filter((card) => rehautOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 40).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRehaut).length,
    brisk: cards.filter(briskRehaut).length,
    resting: cards.filter(restingRehaut).length,
    overdue: cards.filter(overdueRehaut).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateRehaut(card, station)).length,
  };
}

export function rehautBars(cards: readonly Rehaut[]): { piece: string; count: number }[] {
  return RHT_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function rehautTimeline(cards: readonly Rehaut[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function rehautKeepers(cards: readonly Rehaut[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Rehaut[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of rehautKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRehauts(cards: readonly Rehaut[]): string[] {
  return cards.filter(overdueRehaut).map((card) => card.title);
}

export function rehautCopy(card: Rehaut): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function rehautCsv(cards: readonly Rehaut[], station: string): string {
  const lines = ["title,setter,piece,film,drop,lock,tags,raised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.setter),
        card.piece,
        card.film,
        card.drop ?? "",
        card.lock,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.pinned ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        rehautOuter(card.piece) ? "1" : "0",
        lateRehaut(card, station) ? "1" : "0",
        idleRehaut(card) ? "1" : "0",
        briskRehaut(card) ? "1" : "0",
        restingRehaut(card) ? "1" : "0",
        overdueRehaut(card) ? "1" : "0",
        rehautInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        rehautBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const FDP_KEY = "crmv4-fdp-hide";
export const FDP_REVIEW_KEY = "crmv4-fdp-review";

export type FdpLane = "" | "funded" | "vacant" | "hold" | "demo" | "join" | "gap" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type FdpHue = "" | "ivory" | "graphite" | "champagne";
export type FdpState = "" | "clear" | "set";
export type FdpReview = "all" | "reviewed" | "fresh";
export type FdpShape =
  | "all"
  | "funded"
  | "vacant"
  | "hold"
  | "demo"
  | "join"
  | "gap"
  | "brief"
  | "long"
  | "stamp"
  | "vowel"
  | "plain"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "tail"
  | "first"
  | "held";

export type FdpValue = string | { ftd?: unknown; [key: string]: unknown } | null | undefined;
export type FdpRow = { id: string; label: string; code: FdpValue };
export type FdpLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["funded", "vacant", "hold", "demo", "join", "gap", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: FdpValue): { ftd?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: FdpValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: FdpValue): string {
  const row = codeRecord(raw);
  if (row && !("ftd" in row)) return "";
  const value = row ? row.ftd : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "FUNDED";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return clip(value, 48);
}

function codeReadable(raw: FdpValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("ftd" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function fdpState(raw: FdpValue): FdpState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known first-trade mark is FUNDED, OPEN, HOLD, or DEMO, including FTD_YES, FTD_NONE, FTD_HOLD, and FTD_DEMO. A plus joins two parts. A colon marks a pause. A brief mark is exactly five characters. A stamp starts with a digit. A long mark is fourteen characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function fdpLane(raw: FdpValue): FdpLane {
  if (fdpState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = upper === "FTD_YES" ? "FUNDED" : upper === "FTD_NONE" ? "OPEN" : upper === "FTD_HOLD" ? "HOLD" : upper === "FTD_DEMO" ? "DEMO" : upper;
  if (SYSTEMS.has(canon)) {
    if (canon === "FUNDED") return "funded";
    if (canon === "OPEN") return "vacant";
    if (canon === "HOLD") return "hold";
    return "demo";
  }
  if (text === "NONE") return "plain";
  if (text.includes("+")) return "join";
  if (text.includes(":")) return "gap";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 14) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function fdpHue(raw: FdpValue): FdpHue {
  const mail = fdpLane(raw);
  if (!mail) return "";
  if (mail === "funded" || mail === "hold") return "champagne";
  if (mail === "vacant" || mail === "demo" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function fdpHome(raw: FdpValue): boolean {
  return fdpLane(raw) === "funded";
}

export function fdpAway(raw: FdpValue): boolean {
  return fdpLane(raw) === "vacant";
}

export function fdpGuest(raw: FdpValue): boolean {
  return fdpLane(raw) === "hold";
}

export function fdpCitizen(raw: FdpValue): boolean {
  return fdpLane(raw) === "demo";
}

export function fdpJoin(raw: FdpValue): boolean {
  return fdpLane(raw) === "join";
}

export function fdpGap(raw: FdpValue): boolean {
  return fdpLane(raw) === "gap";
}

export function fdpBrief(raw: FdpValue): boolean {
  return fdpLane(raw) === "brief";
}

export function fdpLong(raw: FdpValue): boolean {
  return fdpLane(raw) === "long";
}

export function fdpFdp(raw: FdpValue): boolean {
  return fdpLane(raw) === "stamp";
}

export function fdpVowelLane(raw: FdpValue): boolean {
  return fdpLane(raw) === "vowel";
}

export function fdpPlain(raw: FdpValue): boolean {
  return fdpLane(raw) === "plain";
}

export function fdpOpen(raw: FdpValue): boolean {
  return fdpState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function fdpHeld(raw: FdpValue): boolean {
  const mail = fdpLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function fdpSoon(raw: FdpValue): boolean {
  if (fdpState(raw) !== "set") return false;
  if (fdpBrief(raw)) return true;
  if (fdpHome(raw) || fdpAway(raw) || fdpGuest(raw) || fdpCitizen(raw)) return false;
  return codeGiven(raw).length === 9;
}

export function fdpLength(raw: FdpValue): number | null {
  if (fdpState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function fdpEven(raw: FdpValue): boolean {
  const length = fdpLength(raw);
  return length !== null && length % 2 === 0;
}

export function fdpOdd(raw: FdpValue): boolean {
  const length = fdpLength(raw);
  return length !== null && length % 2 === 1;
}

export function fdpFirst(raw: FdpValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function fdpTail(raw: FdpValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function fdpCapital(raw: FdpValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function fdpSpace(raw: FdpValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function fdpVowel(raw: FdpValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function fdpDigit(raw: FdpValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function fdpLetter(raw: FdpValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function fdpMixed(raw: FdpValue): boolean {
  return fdpDigit(raw) && fdpLetter(raw);
}

export function fdpLower(raw: FdpValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function fdpUpper(raw: FdpValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function fdpStamp(raw: FdpValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function fdpCopy(raw: FdpValue): string {
  return codeGiven(raw);
}

export function fdpFamily(raw: FdpValue): string {
  if (fdpState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function fdpLanes(rows: readonly FdpRow[]): FdpLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = fdpLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingFdp(rows: readonly FdpRow[]): string {
  const lines = fdpLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingFdpHue(rows: readonly FdpRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = fdpHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneFdpCount(rows: readonly FdpRow[], mail: FdpLane): number {
  return rows.filter((row) => fdpLane(row.code) === mail).length;
}

export function fdpShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFdpLanes(rows: readonly FdpRow[]): string[] {
  return fdpLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenFdp(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = clip(item, 12);
    if (!allow.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedFdp(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFdp(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleFdpReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFdpReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFdpLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: FdpRow, shape: FdpShape): boolean {
  if (shape === "all") return true;
  if (shape === "funded") return fdpHome(row.code);
  if (shape === "vacant") return fdpAway(row.code);
  if (shape === "hold") return fdpGuest(row.code);
  if (shape === "demo") return fdpCitizen(row.code);
  if (shape === "join") return fdpJoin(row.code);
  if (shape === "gap") return fdpGap(row.code);
  if (shape === "brief") return fdpBrief(row.code);
  if (shape === "long") return fdpLong(row.code);
  if (shape === "stamp") return fdpFdp(row.code);
  if (shape === "vowel") return fdpVowelLane(row.code);
  if (shape === "plain") return fdpPlain(row.code);
  if (shape === "open") return fdpOpen(row.code);
  if (shape === "soon") return fdpSoon(row.code);
  if (shape === "letter") return fdpLetter(row.code);
  if (shape === "mixed") return fdpMixed(row.code);
  if (shape === "upper") return fdpUpper(row.code);
  if (shape === "lower") return fdpLower(row.code);
  if (shape === "space") return fdpSpace(row.code);
  if (shape === "even") return fdpEven(row.code);
  if (shape === "odd") return fdpOdd(row.code);
  if (shape === "tail") return fdpTail(row.code);
  if (shape === "first") return fdpFirst(row.code);
  if (shape === "held") return fdpHeld(row.code);
  return fdpLane(row.code) === shape;
}

export function visibleFdp(
  rows: readonly FdpRow[],
  mail: string,
  hue: string,
  query: string,
  review: FdpReview,
  reviewed: readonly string[],
  shape: FdpShape,
): FdpRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (fdpState(row.code) === "") return false;
    const found = fdpLane(row.code);
    const hueName = fdpHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${fdpStamp(row.code)} ${fdpFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function fdpLanesCsv(rows: readonly FdpRow[]): string {
  const lines = ["lane,count"];
  for (const line of fdpLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function fdpRowsCsv(rows: readonly FdpRow[], reviewed: readonly string[]): string {
  const lines = ["name,ftd,stamp,family,lane,hue,length,funded,vacant,hold,demo,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(fdpCopy(row.code)),
        fdpStamp(row.code),
        csvCell(fdpFamily(row.code)),
        fdpLane(row.code),
        fdpHue(row.code),
        fdpLength(row.code) ?? "",
        fdpHome(row.code) ? "1" : "0",
        fdpAway(row.code) ? "1" : "0",
        fdpGuest(row.code) ? "1" : "0",
        fdpCitizen(row.code) ? "1" : "0",
        fdpJoin(row.code) ? "1" : "0",
        fdpGap(row.code) ? "1" : "0",
        fdpBrief(row.code) ? "1" : "0",
        fdpEven(row.code) ? "1" : "0",
        fdpDigit(row.code) ? "1" : "0",
        fdpMixed(row.code) ? "1" : "0",
        fdpUpper(row.code) ? "1" : "0",
        fdpVowel(row.code) ? "1" : "0",
        fdpTail(row.code) ? "1" : "0",
        fdpHeld(row.code) ? "1" : "0",
        fdpSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
