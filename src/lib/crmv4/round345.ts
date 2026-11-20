/**
 * Tourbillon rules for a Swiss tourbillon cage kept in this browser, and language plates read the language already stored on the account.
 * Modes are cage, flying, carriage, and karrusel. Finishes are gilt, ivory, and graphite.
 * Angles are 5, 10, 15, or 20. Pins are 3, 5, or 7.
 * Cage and flying are inner. Carriage and karrusel are outer.
 * A known language is ENGL, TURK, DEUT, or ARAB. An ampersand joins two languages. A comma marks a pause.
 * A brief language is exactly four characters. A long language is twelve characters or longer. An index starts with a digit. A vowel language starts with a vowel.
 * A true language reads as ENGL. An empty language reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_tourbillon (
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
 * CREATE TABLE crm_language_hide (
 *   lang text primary key
 * );
 * CREATE TABLE crm_language_review (
 *   trader_id text primary key
 * );
 */
export const TBX_KEY = "crmv4-tourbillon";
export const TBX_VIEW_KEY = "crmv4-tourbillon-views";
export const TBX_DENSITY_KEY = "crmv4-tourbillon-density";
export const TBX_MODES = ["cage", "flying", "carriage", "karrusel"] as const;

export type TourbillonMode = (typeof TBX_MODES)[number];
export type TourbillonFilm = "blank" | "gilt" | "ivory" | "graphite";
export type TourbillonTray = "board" | "peg" | "coffer";
export type TourbillonDensity = "airy" | "close";
export type TourbillonSort = "piece" | "setter";

export type Tourbillon = {
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

export type TourbillonView = {
  id: string;
  name: string;
  tray: TourbillonTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type TourbillonCounts = {
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

export const ROUND345_FEATURES = [
  "tourbillon-save",
  "cage-notices",
  "tourbillon-modes",
  "tourbillon-search",
  "pin-sla",
  "cage-file",
  "latch-and-star",
  "inline-name",
  "tourbillon-filters",
  "saved-tourbillon-views",
  "tourbillon-density",
  "keeper-sort",
  "tourbillon-kpis",
  "cage-chart",
  "cage-timeline",
  "tourbillon-bulk",
  "tourbillon-csv",
  "tourbillon-keys",
  "tourbillon-audit",
  "fair-smith",
  "tourbillon-viewer",
  "suggest-cage",
  "overdue-cages",
  "language-plate",
  "language-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 10, 15, 20] as const;
const LOCK_CYCLE = [3, 5, 7] as const;
const INNER = new Set(["cage", "flying"]);
const OUTER = new Set(["carriage", "karrusel"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["ENGL", "TURK", "DEUT", "ARAB"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TourbillonTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<TourbillonFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<TourbillonFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ck]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Tourbillon, tray: TourbillonTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return TBX_MODES.indexOf(piece as TourbillonMode);
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

export function tourbillonMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TBX_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function tourbillonHour(raw: unknown): 5 | 10 | 15 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15" && text !== "20") return null;
  return Number(text) as 5 | 10 | 15 | 20;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function tourbillonHammer(raw: unknown): 3 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "5" && text !== "7") return null;
  return Number(text) as 3 | 5 | 7;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function tourbillonFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function tourbillonInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function tourbillonOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function tourbillonBand(piece: unknown): string {
  const text = tourbillonMode(piece);
  if (!text) return "";
  if (text === "cage") return "ring";
  if (text === "flying") return "orbit";
  if (text === "carriage") return "bridge";
  return "frame";
}

/** Signed distance from one piece to another along the oscillator. */
export function tourbillonGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(tourbillonMode(from));
  const right = pieceIndex(tourbillonMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(tourbillonFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return tourbillonHammer(lock) === 5;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return tourbillonHammer(lock) === 7;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return tourbillonMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = tourbillonHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = tourbillonFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = tourbillonHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveTourbillonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Tourbillon[]): string {
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
export function suggestHour(cards: readonly Tourbillon[], hour: number): 5 | 10 | 15 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 15 | 20 = 5;
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
  if (hour < 18) return 15;
  return 20;
}

export function suggestMode(hour: number): TourbillonMode {
  return hour < 12 ? "cage" : "karrusel";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Tourbillon[], roster: string): string {
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

export function readTourbillons(raw: unknown): Tourbillon[] {
  if (!Array.isArray(raw)) return [];
  const out: Tourbillon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tourbillon>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: tourbillonMode(row.piece),
      drop: tourbillonHour(row.drop),
      film: tourbillonFilm(row.film),
      lock: tourbillonHammer(row.lock) ?? 3,
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

export function addTourbillon(
  cards: readonly Tourbillon[],
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
): Tourbillon[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTourbillons([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: tourbillonMode(card.piece),
      drop: tourbillonHour(card.drop),
      film: tourbillonFilm(card.film),
      lock: tourbillonHammer(card.lock) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Tourbillon[], id: string, edit: (card: Tourbillon) => Tourbillon): Tourbillon[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTourbillon(cards: readonly Tourbillon[], id: string, title: string): Tourbillon[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTourbillonNote(cards: readonly Tourbillon[], id: string, note: string): Tourbillon[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(tourbillonFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setTourbillonFilm(cards: readonly Tourbillon[], id: string, film: string): Tourbillon[] {
  const next = tourbillonFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setTourbillonRaised(cards: readonly Tourbillon[], id: string, raised: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setTourbillonPin(cards: readonly Tourbillon[], id: string, pinned: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setTourbillonCoffer(cards: readonly Tourbillon[], id: string, coffered: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setTourbillonStar(cards: readonly Tourbillon[], id: string, starred: boolean): Tourbillon[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addTourbillonTag(cards: readonly Tourbillon[], id: string, tag: string): Tourbillon[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 5 | 10 | 15 | 20 {
  if (drop === null) return dir > 0 ? 5 : 20;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 5 | 7 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return setTourbillonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starTourbillonFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  return setTourbillonStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Tourbillon[], id: string): Tourbillon[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTourbillonFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Tourbillon[], ids: readonly string[], edit: (card: Tourbillon) => Tourbillon): Tourbillon[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTourbillonGraphite(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkTourbillonRaise(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkTourbillonCoffer(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkTourbillonTag(cards: readonly Tourbillon[], ids: readonly string[]): Tourbillon[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readTourbillonViews(raw: unknown): TourbillonView[] {
  if (!Array.isArray(raw)) return [];
  const out: TourbillonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TourbillonView>;
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

export function addTourbillonView(views: readonly TourbillonView[], view: TourbillonView): TourbillonView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTourbillonViews([...views, { ...view, id, name }]);
}

export function dropTourbillonView(views: readonly TourbillonView[], id: string): TourbillonView[] {
  return views.filter((view) => view.id !== id);
}

export function tourbillonDensity(raw: unknown): TourbillonDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortTourbillons(cards: readonly Tourbillon[], sort: TourbillonSort): Tourbillon[] {
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

export function visibleTourbillons(
  cards: readonly Tourbillon[],
  tray: TourbillonTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Tourbillon[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : tourbillonFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !tourbillonInner(card.piece)) return false;
    if (wantLimb === "outer" && !tourbillonOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueTourbillon(card: Tourbillon): boolean {
  return tourbillonOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleTourbillon(card: Tourbillon): boolean {
  return !card.film && card.drop === 5 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskTourbillon(card: Tourbillon): boolean {
  return card.film === "GILT" && card.drop === 20 && card.lock === 7 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingTourbillon(card: Tourbillon): boolean {
  return card.piece === "karrusel" && card.film === "IVORY" && card.drop === 10;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateTourbillon(card: Tourbillon, station: string): boolean {
  return card.piece === "cage" && tourbillonMode(station) === "karrusel" && !card.raised;
}

export function tourbillonCounts(cards: readonly Tourbillon[], shown: readonly Tourbillon[], station: string): TourbillonCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => tourbillonInner(card.piece)).length,
    outer: cards.filter((card) => tourbillonOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 20).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleTourbillon).length,
    brisk: cards.filter(briskTourbillon).length,
    resting: cards.filter(restingTourbillon).length,
    overdue: cards.filter(overdueTourbillon).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateTourbillon(card, station)).length,
  };
}

export function tourbillonBars(cards: readonly Tourbillon[]): { piece: string; count: number }[] {
  return TBX_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function tourbillonTimeline(cards: readonly Tourbillon[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function tourbillonKeepers(cards: readonly Tourbillon[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Tourbillon[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of tourbillonKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTourbillons(cards: readonly Tourbillon[]): string[] {
  return cards.filter(overdueTourbillon).map((card) => card.title);
}

export function tourbillonCopy(card: Tourbillon): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function tourbillonCsv(cards: readonly Tourbillon[], station: string): string {
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
        tourbillonOuter(card.piece) ? "1" : "0",
        lateTourbillon(card, station) ? "1" : "0",
        idleTourbillon(card) ? "1" : "0",
        briskTourbillon(card) ? "1" : "0",
        restingTourbillon(card) ? "1" : "0",
        overdueTourbillon(card) ? "1" : "0",
        tourbillonInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        tourbillonBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const LGX_KEY = "crmv4-language-hide";
export const LGX_REVIEW_KEY = "crmv4-language-review";

export type LanguageLane = "" | "engl" | "turk" | "deut" | "arab" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type LanguageHue = "" | "ivory" | "graphite" | "champagne";
export type LanguageState = "" | "clear" | "set";
export type LanguageReview = "all" | "reviewed" | "fresh";
export type LanguageShape =
  | "all"
  | "engl"
  | "turk"
  | "deut"
  | "arab"
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

export type LanguageValue = string | { language?: unknown; [key: string]: unknown } | null | undefined;
export type LanguageRow = { id: string; label: string; code: LanguageValue };
export type LanguageLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["engl", "turk", "deut", "arab", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LanguageValue): { language?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LanguageValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LanguageValue): string {
  const row = codeRecord(raw);
  if (row && !("language" in row)) return "";
  const value = row ? row.language : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ENGL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: LanguageValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("language" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function languageState(raw: LanguageValue): LanguageState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known language is ENGL, TURK, DEUT, or ARAB. An ampersand joins two languages. A comma marks a pause. A brief language is exactly four characters. A long language is twelve characters or longer. An index starts with a digit. A vowel language starts with a vowel. */
export function languageLane(raw: LanguageValue): LanguageLane {
  if (languageState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "ENGL") return "engl";
    if (upper === "TURK") return "turk";
    if (upper === "DEUT") return "deut";
    return "arab";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(",")) return "gap";
  if (text.length === 4) return "brief";
  if (text.length >= 12) return "long";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function languageHue(raw: LanguageValue): LanguageHue {
  const mail = languageLane(raw);
  if (!mail) return "";
  if (mail === "engl" || mail === "deut") return "champagne";
  if (mail === "turk" || mail === "arab" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function languageHome(raw: LanguageValue): boolean {
  return languageLane(raw) === "engl";
}

export function languageAway(raw: LanguageValue): boolean {
  return languageLane(raw) === "turk";
}

export function languageGuest(raw: LanguageValue): boolean {
  return languageLane(raw) === "deut";
}

export function languageCitizen(raw: LanguageValue): boolean {
  return languageLane(raw) === "arab";
}

export function languageJoin(raw: LanguageValue): boolean {
  return languageLane(raw) === "join";
}

export function languageGap(raw: LanguageValue): boolean {
  return languageLane(raw) === "gap";
}

export function languageBrief(raw: LanguageValue): boolean {
  return languageLane(raw) === "brief";
}

export function languageLong(raw: LanguageValue): boolean {
  return languageLane(raw) === "long";
}

export function languageMark(raw: LanguageValue): boolean {
  return languageLane(raw) === "mark";
}

export function languageVowelLane(raw: LanguageValue): boolean {
  return languageLane(raw) === "vowel";
}

export function languagePlain(raw: LanguageValue): boolean {
  return languageLane(raw) === "plain";
}

export function languageOpen(raw: LanguageValue): boolean {
  return languageState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function languageHeld(raw: LanguageValue): boolean {
  const mail = languageLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function languageSoon(raw: LanguageValue): boolean {
  if (languageState(raw) !== "set") return false;
  if (languageBrief(raw)) return true;
  if (languageHome(raw) || languageAway(raw) || languageGuest(raw) || languageCitizen(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function languageLength(raw: LanguageValue): number | null {
  if (languageState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function languageEven(raw: LanguageValue): boolean {
  const length = languageLength(raw);
  return length !== null && length % 2 === 0;
}

export function languageOdd(raw: LanguageValue): boolean {
  const length = languageLength(raw);
  return length !== null && length % 2 === 1;
}

export function languageFirst(raw: LanguageValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function languageTail(raw: LanguageValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function languageCapital(raw: LanguageValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function languageSpace(raw: LanguageValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function languageVowel(raw: LanguageValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function languageDigit(raw: LanguageValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function languageLetter(raw: LanguageValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function languageMixed(raw: LanguageValue): boolean {
  return languageDigit(raw) && languageLetter(raw);
}

export function languageLower(raw: LanguageValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function languageUpper(raw: LanguageValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function languageStamp(raw: LanguageValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function languageCopy(raw: LanguageValue): string {
  return codeGiven(raw);
}

export function languageFamily(raw: LanguageValue): string {
  if (languageState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function languageLanes(rows: readonly LanguageRow[]): LanguageLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = languageLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingLanguage(rows: readonly LanguageRow[]): string {
  const lines = languageLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingLanguageHue(rows: readonly LanguageRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = languageHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneLanguageCount(rows: readonly LanguageRow[], mail: LanguageLane): number {
  return rows.filter((row) => languageLane(row.code) === mail).length;
}

export function languageShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLanguageLanes(rows: readonly LanguageRow[]): string[] {
  return languageLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenLanguage(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLanguage(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLanguage(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleLanguageReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLanguageReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLanguageLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: LanguageRow, shape: LanguageShape): boolean {
  if (shape === "all") return true;
  if (shape === "engl") return languageHome(row.code);
  if (shape === "turk") return languageAway(row.code);
  if (shape === "deut") return languageGuest(row.code);
  if (shape === "arab") return languageCitizen(row.code);
  if (shape === "join") return languageJoin(row.code);
  if (shape === "gap") return languageGap(row.code);
  if (shape === "brief") return languageBrief(row.code);
  if (shape === "long") return languageLong(row.code);
  if (shape === "mark") return languageMark(row.code);
  if (shape === "vowel") return languageVowelLane(row.code);
  if (shape === "plain") return languagePlain(row.code);
  if (shape === "open") return languageOpen(row.code);
  if (shape === "soon") return languageSoon(row.code);
  if (shape === "letter") return languageLetter(row.code);
  if (shape === "mixed") return languageMixed(row.code);
  if (shape === "upper") return languageUpper(row.code);
  if (shape === "lower") return languageLower(row.code);
  if (shape === "space") return languageSpace(row.code);
  if (shape === "even") return languageEven(row.code);
  if (shape === "odd") return languageOdd(row.code);
  if (shape === "tail") return languageTail(row.code);
  if (shape === "first") return languageFirst(row.code);
  if (shape === "held") return languageHeld(row.code);
  return languageLane(row.code) === shape;
}

export function visibleLanguage(
  rows: readonly LanguageRow[],
  mail: string,
  hue: string,
  query: string,
  review: LanguageReview,
  reviewed: readonly string[],
  shape: LanguageShape,
): LanguageRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (languageState(row.code) === "") return false;
    const found = languageLane(row.code);
    const hueName = languageHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${languageStamp(row.code)} ${languageFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function languageLanesCsv(rows: readonly LanguageRow[]): string {
  const lines = ["mail,count"];
  for (const line of languageLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function languageRowsCsv(rows: readonly LanguageRow[], reviewed: readonly string[]): string {
  const lines = ["name,language,stamp,family,mail,hue,length,laneMark,inbox,desk,post,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(languageCopy(row.code)),
        languageStamp(row.code),
        csvCell(languageFamily(row.code)),
        languageLane(row.code),
        languageHue(row.code),
        languageLength(row.code) ?? "",
        languageHome(row.code) ? "1" : "0",
        languageAway(row.code) ? "1" : "0",
        languageGuest(row.code) ? "1" : "0",
        languageCitizen(row.code) ? "1" : "0",
        languageJoin(row.code) ? "1" : "0",
        languageGap(row.code) ? "1" : "0",
        languageBrief(row.code) ? "1" : "0",
        languageEven(row.code) ? "1" : "0",
        languageDigit(row.code) ? "1" : "0",
        languageMixed(row.code) ? "1" : "0",
        languageUpper(row.code) ? "1" : "0",
        languageVowel(row.code) ? "1" : "0",
        languageTail(row.code) ? "1" : "0",
        languageHeld(row.code) ? "1" : "0",
        languageSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
