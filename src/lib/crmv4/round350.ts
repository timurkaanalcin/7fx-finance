/**
 * Pulsometer rules for a pulse scale kept in this browser, and invalid-mark plates read leadInvalidReason already stored on the account.
 * Modes are beat, count, rest, and sprint. Finishes are gilt, ivory, and graphite.
 * Grades are 4, 8, 16, or 32. Bases are 3, 6, or 9.
 * Beat and count are inner. Rest and sprint are outer.
 * A known invalid mark is GEO, DUPE, TRASH, or AGE, including INV_WRONG_GEO, INV_DUPLICATE, INV_TRASH, and INV_UNDERAGE.
 * A slash joins two parts. A hyphen marks a pause.
 * A brief mark is exactly four characters. A stamp starts with a digit. A long mark is twelve characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true mark reads as GEO. An empty mark reads as NONE. The plate does not change the saved reason.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_pulsometer (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   piece text not null default '',
 *   drop_no integer,
 *   film text not null default '',
 *   lock_no integer not null default 3,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_mark_review (
 *   trader_id text primary key
 * );
 */

export const PLS_KEY = "crmv4-pulsometer";
export const PLS_VIEW_KEY = "crmv4-pulsometer-views";
export const PLS_DENSITY_KEY = "crmv4-pulsometer-density";
export const PLS_MODES = ["beat", "count", "rest", "sprint"] as const;

export type PulsometerMode = (typeof PLS_MODES)[number];
export type PulsometerFilm = "blank" | "gilt" | "ivory" | "graphite";
export type PulsometerTray = "board" | "peg" | "coffer";
export type PulsometerDensity = "airy" | "close";
export type PulsometerSort = "piece" | "setter";

export type Pulsometer = {
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

export type PulsometerView = {
  id: string;
  name: string;
  tray: PulsometerTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type PulsometerCounts = {
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

export const ROUND350_FEATURES = [
  "pulsometer-save",
  "beat-reminders",
  "pulsometer-modes",
  "pulsometer-search",
  "pulsometer-pin-sla",
  "beat-archive",
  "pulsometer-latch-star",
  "pulsometer-inline-title",
  "pulsometer-filters",
  "saved-pulsometer-views",
  "pulsometer-density",
  "focus-order",
  "pulsometer-kpis",
  "beat-chart",
  "beat-timeline",
  "pulsometer-bulk",
  "pulsometer-csv",
  "pulsometer-keys",
  "pulsometer-audit",
  "quiet-keeper",
  "pulsometer-viewer",
  "suggest-beat",
  "overdue-beats",
  "mark-plate",
  "mark-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 16, 32] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["beat", "count"]);
const OUTER = new Set(["rest", "sprint"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["GEO", "DUPE", "TRASH", "AGE"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PulsometerTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<PulsometerFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<PulsometerFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[br]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Pulsometer, tray: PulsometerTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return PLS_MODES.indexOf(piece as PulsometerMode);
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

export function pulsometerMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PLS_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function pulsometerHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function pulsometerHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function pulsometerFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function pulsometerInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function pulsometerOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function pulsometerBand(piece: unknown): string {
  const text = pulsometerMode(piece);
  if (!text) return "";
  if (text === "beat") return "wrist";
  if (text === "count") return "tally";
  if (text === "rest") return "pause";
  return "dash";
}

/** Signed distance from one piece to another along the oscillator. */
export function pulsometerGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(pulsometerMode(from));
  const right = pieceIndex(pulsometerMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(pulsometerFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return pulsometerHammer(lock) === 6;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return pulsometerHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return pulsometerMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = pulsometerHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = pulsometerFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = pulsometerHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function movePulsometerFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Pulsometer[]): string {
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
export function suggestHour(cards: readonly Pulsometer[], hour: number): 4 | 8 | 16 | 32 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 32 = 4;
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
  if (hour < 4) return 4;
  if (hour < 10) return 8;
  if (hour < 16) return 16;
  return 32;
}

export function suggestMode(hour: number): PulsometerMode {
  return hour < 8 ? "beat" : "sprint";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Pulsometer[], roster: string): string {
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

export function readPulsometers(raw: unknown): Pulsometer[] {
  if (!Array.isArray(raw)) return [];
  const out: Pulsometer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Pulsometer>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: pulsometerMode(row.piece),
      drop: pulsometerHour(row.drop),
      film: pulsometerFilm(row.film),
      lock: pulsometerHammer(row.lock) ?? 3,
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

export function addPulsometer(
  cards: readonly Pulsometer[],
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
): Pulsometer[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPulsometers([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: pulsometerMode(card.piece),
      drop: pulsometerHour(card.drop),
      film: pulsometerFilm(card.film),
      lock: pulsometerHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Pulsometer[], id: string, edit: (card: Pulsometer) => Pulsometer): Pulsometer[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPulsometer(cards: readonly Pulsometer[], id: string, title: string): Pulsometer[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPulsometerNote(cards: readonly Pulsometer[], id: string, note: string): Pulsometer[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(pulsometerFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setPulsometerFilm(cards: readonly Pulsometer[], id: string, film: string): Pulsometer[] {
  const next = pulsometerFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setPulsometerRaised(cards: readonly Pulsometer[], id: string, raised: boolean): Pulsometer[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setPulsometerPin(cards: readonly Pulsometer[], id: string, pinned: boolean): Pulsometer[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setPulsometerCoffer(cards: readonly Pulsometer[], id: string, coffered: boolean): Pulsometer[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setPulsometerStar(cards: readonly Pulsometer[], id: string, starred: boolean): Pulsometer[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addPulsometerTag(cards: readonly Pulsometer[], id: string, tag: string): Pulsometer[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 4 | 8 | 16 | 32 {
  if (drop === null) return dir > 0 ? 4 : 32;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setPulsometerFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinPulsometerFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return setPulsometerPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starPulsometerFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  return setPulsometerStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Pulsometer[], id: string): Pulsometer[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPulsometerFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Pulsometer[], ids: readonly string[], edit: (card: Pulsometer) => Pulsometer): Pulsometer[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPulsometerGraphite(cards: readonly Pulsometer[], ids: readonly string[]): Pulsometer[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkPulsometerRaise(cards: readonly Pulsometer[], ids: readonly string[]): Pulsometer[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkPulsometerCoffer(cards: readonly Pulsometer[], ids: readonly string[]): Pulsometer[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkPulsometerTag(cards: readonly Pulsometer[], ids: readonly string[]): Pulsometer[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readPulsometerViews(raw: unknown): PulsometerView[] {
  if (!Array.isArray(raw)) return [];
  const out: PulsometerView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PulsometerView>;
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

export function addPulsometerView(views: readonly PulsometerView[], view: PulsometerView): PulsometerView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPulsometerViews([...views, { ...view, id, name }]);
}

export function dropPulsometerView(views: readonly PulsometerView[], id: string): PulsometerView[] {
  return views.filter((view) => view.id !== id);
}

export function pulsometerDensity(raw: unknown): PulsometerDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortPulsometers(cards: readonly Pulsometer[], sort: PulsometerSort): Pulsometer[] {
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

export function visiblePulsometers(
  cards: readonly Pulsometer[],
  tray: PulsometerTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Pulsometer[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : pulsometerFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !pulsometerInner(card.piece)) return false;
    if (wantLimb === "outer" && !pulsometerOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overduePulsometer(card: Pulsometer): boolean {
  return pulsometerOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idlePulsometer(card: Pulsometer): boolean {
  return !card.film && card.drop === 4 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskPulsometer(card: Pulsometer): boolean {
  return card.film === "GILT" && card.drop === 32 && card.lock === 9 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingPulsometer(card: Pulsometer): boolean {
  return card.piece === "sprint" && card.film === "IVORY" && card.drop === 8;
}

/** A oscillator is late when the station is already on the impulse. */
export function latePulsometer(card: Pulsometer, station: string): boolean {
  return card.piece === "beat" && pulsometerMode(station) === "sprint" && !card.raised;
}

export function pulsometerCounts(cards: readonly Pulsometer[], shown: readonly Pulsometer[], station: string): PulsometerCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => pulsometerInner(card.piece)).length,
    outer: cards.filter((card) => pulsometerOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idlePulsometer).length,
    brisk: cards.filter(briskPulsometer).length,
    resting: cards.filter(restingPulsometer).length,
    overdue: cards.filter(overduePulsometer).length,
    pair: cards.filter((card) => pairHammer(card.lock) && latePulsometer(card, station)).length,
  };
}

export function pulsometerBars(cards: readonly Pulsometer[]): { piece: string; count: number }[] {
  return PLS_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function pulsometerTimeline(cards: readonly Pulsometer[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function pulsometerKeepers(cards: readonly Pulsometer[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Pulsometer[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of pulsometerKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPulsometers(cards: readonly Pulsometer[]): string[] {
  return cards.filter(overduePulsometer).map((card) => card.title);
}

export function pulsometerCopy(card: Pulsometer): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function pulsometerCsv(cards: readonly Pulsometer[], station: string): string {
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
        pulsometerOuter(card.piece) ? "1" : "0",
        latePulsometer(card, station) ? "1" : "0",
        idlePulsometer(card) ? "1" : "0",
        briskPulsometer(card) ? "1" : "0",
        restingPulsometer(card) ? "1" : "0",
        overduePulsometer(card) ? "1" : "0",
        pulsometerInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        pulsometerBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const MRK_KEY = "crmv4-mark-hide";
export const MRK_REVIEW_KEY = "crmv4-mark-review";

export type MarkLane = "" | "geo" | "dupe" | "trash" | "age" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type MarkHue = "" | "ivory" | "graphite" | "champagne";
export type MarkState = "" | "clear" | "set";
export type MarkReview = "all" | "reviewed" | "fresh";
export type MarkShape =
  | "all"
  | "geo"
  | "dupe"
  | "trash"
  | "age"
  | "join"
  | "gap"
  | "brief"
  | "long"
  | "mark"
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

export type MarkValue = string | { leadInvalidReason?: unknown; [key: string]: unknown } | null | undefined;
export type MarkRow = { id: string; label: string; code: MarkValue };
export type MarkLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["geo", "dupe", "trash", "age", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: MarkValue): { leadInvalidReason?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: MarkValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: MarkValue): string {
  const row = codeRecord(raw);
  if (row && !("leadInvalidReason" in row)) return "";
  const value = row ? row.leadInvalidReason : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "GEO";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: MarkValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("leadInvalidReason" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function markState(raw: MarkValue): MarkState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known invalid mark is GEO, DUPE, TRASH, or AGE, including INV_WRONG_GEO, INV_DUPLICATE, INV_TRASH, and INV_UNDERAGE. A slash joins two parts. A hyphen marks a pause. A brief mark is exactly four characters. A stamp starts with a digit. A long mark is twelve characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function markLane(raw: MarkValue): MarkLane {
  if (markState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = upper === "INV_WRONG_GEO" ? "GEO" : upper === "INV_DUPLICATE" ? "DUPE" : upper === "INV_TRASH" ? "TRASH" : upper === "INV_UNDERAGE" ? "AGE" : upper;
  if (SYSTEMS.has(canon)) {
    if (canon === "GEO") return "geo";
    if (canon === "DUPE") return "dupe";
    if (canon === "TRASH") return "trash";
    return "age";
  }
  if (text === "NONE") return "plain";
  if (text.includes("/")) return "join";
  if (text.includes("-")) return "gap";
  if (text.length === 4) return "brief";
  if (/^[0-9]/.test(text)) return "mark";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function markHue(raw: MarkValue): MarkHue {
  const mail = markLane(raw);
  if (!mail) return "";
  if (mail === "geo" || mail === "trash") return "champagne";
  if (mail === "dupe" || mail === "age" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function markHome(raw: MarkValue): boolean {
  return markLane(raw) === "geo";
}

export function markAway(raw: MarkValue): boolean {
  return markLane(raw) === "dupe";
}

export function markGuest(raw: MarkValue): boolean {
  return markLane(raw) === "trash";
}

export function markCitizen(raw: MarkValue): boolean {
  return markLane(raw) === "age";
}

export function markJoin(raw: MarkValue): boolean {
  return markLane(raw) === "join";
}

export function markGap(raw: MarkValue): boolean {
  return markLane(raw) === "gap";
}

export function markBrief(raw: MarkValue): boolean {
  return markLane(raw) === "brief";
}

export function markLong(raw: MarkValue): boolean {
  return markLane(raw) === "long";
}

export function markMark(raw: MarkValue): boolean {
  return markLane(raw) === "mark";
}

export function markVowelLane(raw: MarkValue): boolean {
  return markLane(raw) === "vowel";
}

export function markPlain(raw: MarkValue): boolean {
  return markLane(raw) === "plain";
}

export function markOpen(raw: MarkValue): boolean {
  return markState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function markHeld(raw: MarkValue): boolean {
  const mail = markLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function markSoon(raw: MarkValue): boolean {
  if (markState(raw) !== "set") return false;
  if (markBrief(raw)) return true;
  if (markHome(raw) || markAway(raw) || markGuest(raw) || markCitizen(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function markLength(raw: MarkValue): number | null {
  if (markState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function markEven(raw: MarkValue): boolean {
  const length = markLength(raw);
  return length !== null && length % 2 === 0;
}

export function markOdd(raw: MarkValue): boolean {
  const length = markLength(raw);
  return length !== null && length % 2 === 1;
}

export function markFirst(raw: MarkValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function markTail(raw: MarkValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function markCapital(raw: MarkValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function markSpace(raw: MarkValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function markVowel(raw: MarkValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function markDigit(raw: MarkValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function markLetter(raw: MarkValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function markMixed(raw: MarkValue): boolean {
  return markDigit(raw) && markLetter(raw);
}

export function markLower(raw: MarkValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function markUpper(raw: MarkValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function markStamp(raw: MarkValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function markCopy(raw: MarkValue): string {
  return codeGiven(raw);
}

export function markFamily(raw: MarkValue): string {
  if (markState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function markLanes(rows: readonly MarkRow[]): MarkLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = markLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingMark(rows: readonly MarkRow[]): string {
  const lines = markLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingMarkHue(rows: readonly MarkRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = markHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneMarkCount(rows: readonly MarkRow[], mail: MarkLane): number {
  return rows.filter((row) => markLane(row.code) === mail).length;
}

export function markShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentMarkLanes(rows: readonly MarkRow[]): string[] {
  return markLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenMark(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedMark(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleMark(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleMarkReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMarkReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMarkLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: MarkRow, shape: MarkShape): boolean {
  if (shape === "all") return true;
  if (shape === "geo") return markHome(row.code);
  if (shape === "dupe") return markAway(row.code);
  if (shape === "trash") return markGuest(row.code);
  if (shape === "age") return markCitizen(row.code);
  if (shape === "join") return markJoin(row.code);
  if (shape === "gap") return markGap(row.code);
  if (shape === "brief") return markBrief(row.code);
  if (shape === "long") return markLong(row.code);
  if (shape === "mark") return markMark(row.code);
  if (shape === "vowel") return markVowelLane(row.code);
  if (shape === "plain") return markPlain(row.code);
  if (shape === "open") return markOpen(row.code);
  if (shape === "soon") return markSoon(row.code);
  if (shape === "letter") return markLetter(row.code);
  if (shape === "mixed") return markMixed(row.code);
  if (shape === "upper") return markUpper(row.code);
  if (shape === "lower") return markLower(row.code);
  if (shape === "space") return markSpace(row.code);
  if (shape === "even") return markEven(row.code);
  if (shape === "odd") return markOdd(row.code);
  if (shape === "tail") return markTail(row.code);
  if (shape === "first") return markFirst(row.code);
  if (shape === "held") return markHeld(row.code);
  return markLane(row.code) === shape;
}

export function visibleMark(
  rows: readonly MarkRow[],
  mail: string,
  hue: string,
  query: string,
  review: MarkReview,
  reviewed: readonly string[],
  shape: MarkShape,
): MarkRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (markState(row.code) === "") return false;
    const found = markLane(row.code);
    const hueName = markHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${markStamp(row.code)} ${markFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function markLanesCsv(rows: readonly MarkRow[]): string {
  const lines = ["lane,count"];
  for (const line of markLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function markRowsCsv(rows: readonly MarkRow[], reviewed: readonly string[]): string {
  const lines = ["name,reason,stamp,family,lane,hue,length,geo,dupe,trash,age,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(markCopy(row.code)),
        markStamp(row.code),
        csvCell(markFamily(row.code)),
        markLane(row.code),
        markHue(row.code),
        markLength(row.code) ?? "",
        markHome(row.code) ? "1" : "0",
        markAway(row.code) ? "1" : "0",
        markGuest(row.code) ? "1" : "0",
        markCitizen(row.code) ? "1" : "0",
        markJoin(row.code) ? "1" : "0",
        markGap(row.code) ? "1" : "0",
        markBrief(row.code) ? "1" : "0",
        markEven(row.code) ? "1" : "0",
        markDigit(row.code) ? "1" : "0",
        markMixed(row.code) ? "1" : "0",
        markUpper(row.code) ? "1" : "0",
        markVowel(row.code) ? "1" : "0",
        markTail(row.code) ? "1" : "0",
        markHeld(row.code) ? "1" : "0",
        markSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
