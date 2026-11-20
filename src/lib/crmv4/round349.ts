/**
 * Tachymeter rules for a bezel scale kept in this browser, and affiliate plates read affiliateC already stored on the account.
 * Modes are scale, spiral, pulse, and mile. Finishes are gilt, ivory, and graphite.
 * Grades are 5, 15, 30, or 60. Bases are 2, 4, or 8.
 * Scale and spiral are inner. Pulse and mile are outer.
 * A known affiliate mark is WEB, DESK, MAIL, or FAIR. A slash joins two parts. A hyphen marks a pause.
 * A brief affiliate code is exactly four characters. A stamp starts with a digit. A long affiliate code is twelve characters or longer and does not start with a digit. A vowel affiliate code starts with a vowel.
 * A true affiliate code reads as WEB. An empty affiliate code reads as NONE. The plate does not change the saved affiliate code.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_tachymeter (
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
 * CREATE TABLE crm_affiliate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_affiliate_review (
 *   trader_id text primary key
 * );
 */

export const TCH_KEY = "crmv4-tachymeter";
export const TCH_VIEW_KEY = "crmv4-tachymeter-views";
export const TCH_DENSITY_KEY = "crmv4-tachymeter-density";
export const TCH_MODES = ["scale", "spiral", "pulse", "mile"] as const;

export type TachymeterMode = (typeof TCH_MODES)[number];
export type TachymeterFilm = "blank" | "gilt" | "ivory" | "graphite";
export type TachymeterTray = "board" | "peg" | "coffer";
export type TachymeterDensity = "airy" | "close";
export type TachymeterSort = "piece" | "setter";

export type Tachymeter = {
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

export type TachymeterView = {
  id: string;
  name: string;
  tray: TachymeterTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type TachymeterCounts = {
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

export const ROUND349_FEATURES = [
  "tachymeter-save",
  "scale-reminders",
  "tachymeter-modes",
  "tachymeter-search",
  "tachymeter-pin-sla",
  "scale-archive",
  "tachymeter-latch-star",
  "tachymeter-inline-title",
  "tachymeter-filters",
  "saved-tachymeter-views",
  "tachymeter-density",
  "reader-order",
  "tachymeter-kpis",
  "scale-chart",
  "scale-timeline",
  "tachymeter-bulk",
  "tachymeter-csv",
  "tachymeter-keys",
  "tachymeter-audit",
  "fair-reader",
  "tachymeter-viewer",
  "suggest-scale",
  "overdue-scales",
  "affiliate-plate",
  "affiliate-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 15, 30, 60] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["scale", "spiral"]);
const OUTER = new Set(["pulse", "mile"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["WEB", "DESK", "MAIL", "FAIR"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TachymeterTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<TachymeterFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<TachymeterFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[sp]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Tachymeter, tray: TachymeterTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return TCH_MODES.indexOf(piece as TachymeterMode);
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

export function tachymeterMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TCH_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function tachymeterHour(raw: unknown): 5 | 15 | 30 | 60 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "15" && text !== "30" && text !== "60") return null;
  return Number(text) as 5 | 15 | 30 | 60;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function tachymeterHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function tachymeterFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function tachymeterInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function tachymeterOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function tachymeterBand(piece: unknown): string {
  const text = tachymeterMode(piece);
  if (!text) return "";
  if (text === "scale") return "bezel";
  if (text === "spiral") return "coil";
  if (text === "pulse") return "beat";
  return "post";
}

/** Signed distance from one piece to another along the oscillator. */
export function tachymeterGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(tachymeterMode(from));
  const right = pieceIndex(tachymeterMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(tachymeterFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return tachymeterHammer(lock) === 4;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return tachymeterHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return tachymeterMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = tachymeterHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = tachymeterFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = tachymeterHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveTachymeterFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Tachymeter[]): string {
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
export function suggestHour(cards: readonly Tachymeter[], hour: number): 5 | 15 | 30 | 60 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 15 | 30 | 60 = 5;
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
  if (hour < 5) return 5;
  if (hour < 12) return 15;
  if (hour < 18) return 30;
  return 60;
}

export function suggestMode(hour: number): TachymeterMode {
  return hour < 10 ? "scale" : "mile";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Tachymeter[], roster: string): string {
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

export function readTachymeters(raw: unknown): Tachymeter[] {
  if (!Array.isArray(raw)) return [];
  const out: Tachymeter[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tachymeter>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: tachymeterMode(row.piece),
      drop: tachymeterHour(row.drop),
      film: tachymeterFilm(row.film),
      lock: tachymeterHammer(row.lock) ?? 2,
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

export function addTachymeter(
  cards: readonly Tachymeter[],
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
): Tachymeter[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTachymeters([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: tachymeterMode(card.piece),
      drop: tachymeterHour(card.drop),
      film: tachymeterFilm(card.film),
      lock: tachymeterHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Tachymeter[], id: string, edit: (card: Tachymeter) => Tachymeter): Tachymeter[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTachymeter(cards: readonly Tachymeter[], id: string, title: string): Tachymeter[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTachymeterNote(cards: readonly Tachymeter[], id: string, note: string): Tachymeter[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(tachymeterFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setTachymeterFilm(cards: readonly Tachymeter[], id: string, film: string): Tachymeter[] {
  const next = tachymeterFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setTachymeterRaised(cards: readonly Tachymeter[], id: string, raised: boolean): Tachymeter[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setTachymeterPin(cards: readonly Tachymeter[], id: string, pinned: boolean): Tachymeter[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setTachymeterCoffer(cards: readonly Tachymeter[], id: string, coffered: boolean): Tachymeter[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setTachymeterStar(cards: readonly Tachymeter[], id: string, starred: boolean): Tachymeter[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addTachymeterTag(cards: readonly Tachymeter[], id: string, tag: string): Tachymeter[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 5 | 15 | 30 | 60 {
  if (drop === null) return dir > 0 ? 5 : 60;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setTachymeterFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinTachymeterFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return setTachymeterPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starTachymeterFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  return setTachymeterStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Tachymeter[], id: string): Tachymeter[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTachymeterFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Tachymeter[], ids: readonly string[], edit: (card: Tachymeter) => Tachymeter): Tachymeter[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTachymeterGraphite(cards: readonly Tachymeter[], ids: readonly string[]): Tachymeter[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkTachymeterRaise(cards: readonly Tachymeter[], ids: readonly string[]): Tachymeter[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkTachymeterCoffer(cards: readonly Tachymeter[], ids: readonly string[]): Tachymeter[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkTachymeterTag(cards: readonly Tachymeter[], ids: readonly string[]): Tachymeter[] {
  return bulk(cards, ids, (card) => (card.tags.includes("p") ? card : { ...card, tags: tagsOf([...card.tags, "p"]), audit: "tag" }));
}

export function readTachymeterViews(raw: unknown): TachymeterView[] {
  if (!Array.isArray(raw)) return [];
  const out: TachymeterView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TachymeterView>;
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

export function addTachymeterView(views: readonly TachymeterView[], view: TachymeterView): TachymeterView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTachymeterViews([...views, { ...view, id, name }]);
}

export function dropTachymeterView(views: readonly TachymeterView[], id: string): TachymeterView[] {
  return views.filter((view) => view.id !== id);
}

export function tachymeterDensity(raw: unknown): TachymeterDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortTachymeters(cards: readonly Tachymeter[], sort: TachymeterSort): Tachymeter[] {
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

export function visibleTachymeters(
  cards: readonly Tachymeter[],
  tray: TachymeterTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Tachymeter[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : tachymeterFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !tachymeterInner(card.piece)) return false;
    if (wantLimb === "outer" && !tachymeterOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueTachymeter(card: Tachymeter): boolean {
  return tachymeterOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleTachymeter(card: Tachymeter): boolean {
  return !card.film && card.drop === 5 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskTachymeter(card: Tachymeter): boolean {
  return card.film === "GILT" && card.drop === 60 && card.lock === 8 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingTachymeter(card: Tachymeter): boolean {
  return card.piece === "mile" && card.film === "IVORY" && card.drop === 15;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateTachymeter(card: Tachymeter, station: string): boolean {
  return card.piece === "scale" && tachymeterMode(station) === "mile" && !card.raised;
}

export function tachymeterCounts(cards: readonly Tachymeter[], shown: readonly Tachymeter[], station: string): TachymeterCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => tachymeterInner(card.piece)).length,
    outer: cards.filter((card) => tachymeterOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 60).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleTachymeter).length,
    brisk: cards.filter(briskTachymeter).length,
    resting: cards.filter(restingTachymeter).length,
    overdue: cards.filter(overdueTachymeter).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateTachymeter(card, station)).length,
  };
}

export function tachymeterBars(cards: readonly Tachymeter[]): { piece: string; count: number }[] {
  return TCH_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function tachymeterTimeline(cards: readonly Tachymeter[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function tachymeterKeepers(cards: readonly Tachymeter[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Tachymeter[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of tachymeterKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTachymeters(cards: readonly Tachymeter[]): string[] {
  return cards.filter(overdueTachymeter).map((card) => card.title);
}

export function tachymeterCopy(card: Tachymeter): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function tachymeterCsv(cards: readonly Tachymeter[], station: string): string {
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
        tachymeterOuter(card.piece) ? "1" : "0",
        lateTachymeter(card, station) ? "1" : "0",
        idleTachymeter(card) ? "1" : "0",
        briskTachymeter(card) ? "1" : "0",
        restingTachymeter(card) ? "1" : "0",
        overdueTachymeter(card) ? "1" : "0",
        tachymeterInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        tachymeterBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const AFC_KEY = "crmv4-affiliate-hide";
export const AFC_REVIEW_KEY = "crmv4-affiliate-review";

export type AffiliateLane = "" | "web" | "desk" | "mail" | "fair" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type AffiliateHue = "" | "ivory" | "graphite" | "champagne";
export type AffiliateState = "" | "clear" | "set";
export type AffiliateReview = "all" | "reviewed" | "fresh";
export type AffiliateShape =
  | "all"
  | "web"
  | "desk"
  | "mail"
  | "fair"
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

export type AffiliateValue = string | { affiliateC?: unknown; [key: string]: unknown } | null | undefined;
export type AffiliateRow = { id: string; label: string; code: AffiliateValue };
export type AffiliateLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["web", "desk", "mail", "fair", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: AffiliateValue): { affiliateC?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: AffiliateValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: AffiliateValue): string {
  const row = codeRecord(raw);
  if (row && !("affiliateC" in row)) return "";
  const value = row ? row.affiliateC : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "WEB";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: AffiliateValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("affiliateC" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function affiliateState(raw: AffiliateValue): AffiliateState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known affiliate mark is WEB, DESK, MAIL, or FAIR. A slash joins two parts. A hyphen marks a pause. A brief affiliate code is exactly four characters. A stamp starts with a digit. A long affiliate code is twelve characters or longer and does not start with a digit. A vowel affiliate code starts with a vowel. */
export function affiliateLane(raw: AffiliateValue): AffiliateLane {
  if (affiliateState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "WEB") return "web";
    if (upper === "DESK") return "desk";
    if (upper === "MAIL") return "mail";
    return "fair";
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

export function affiliateHue(raw: AffiliateValue): AffiliateHue {
  const mail = affiliateLane(raw);
  if (!mail) return "";
  if (mail === "web" || mail === "mail") return "champagne";
  if (mail === "desk" || mail === "fair" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function affiliateHome(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "web";
}

export function affiliateAway(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "desk";
}

export function affiliateGuest(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "mail";
}

export function affiliateCitizen(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "fair";
}

export function affiliateJoin(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "join";
}

export function affiliateGap(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "gap";
}

export function affiliateBrief(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "brief";
}

export function affiliateLong(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "long";
}

export function affiliateMark(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "mark";
}

export function affiliateVowelLane(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "vowel";
}

export function affiliatePlain(raw: AffiliateValue): boolean {
  return affiliateLane(raw) === "plain";
}

export function affiliateOpen(raw: AffiliateValue): boolean {
  return affiliateState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function affiliateHeld(raw: AffiliateValue): boolean {
  const mail = affiliateLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function affiliateSoon(raw: AffiliateValue): boolean {
  if (affiliateState(raw) !== "set") return false;
  if (affiliateBrief(raw)) return true;
  if (affiliateHome(raw) || affiliateAway(raw) || affiliateGuest(raw) || affiliateCitizen(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function affiliateLength(raw: AffiliateValue): number | null {
  if (affiliateState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function affiliateEven(raw: AffiliateValue): boolean {
  const length = affiliateLength(raw);
  return length !== null && length % 2 === 0;
}

export function affiliateOdd(raw: AffiliateValue): boolean {
  const length = affiliateLength(raw);
  return length !== null && length % 2 === 1;
}

export function affiliateFirst(raw: AffiliateValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function affiliateTail(raw: AffiliateValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function affiliateCapital(raw: AffiliateValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function affiliateSpace(raw: AffiliateValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function affiliateVowel(raw: AffiliateValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function affiliateDigit(raw: AffiliateValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function affiliateLetter(raw: AffiliateValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function affiliateMixed(raw: AffiliateValue): boolean {
  return affiliateDigit(raw) && affiliateLetter(raw);
}

export function affiliateLower(raw: AffiliateValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function affiliateUpper(raw: AffiliateValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function affiliateStamp(raw: AffiliateValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function affiliateCopy(raw: AffiliateValue): string {
  return codeGiven(raw);
}

export function affiliateFamily(raw: AffiliateValue): string {
  if (affiliateState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function affiliateLanes(rows: readonly AffiliateRow[]): AffiliateLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = affiliateLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingAffiliate(rows: readonly AffiliateRow[]): string {
  const lines = affiliateLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingAffiliateHue(rows: readonly AffiliateRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = affiliateHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneAffiliateCount(rows: readonly AffiliateRow[], mail: AffiliateLane): number {
  return rows.filter((row) => affiliateLane(row.code) === mail).length;
}

export function affiliateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAffiliateLanes(rows: readonly AffiliateRow[]): string[] {
  return affiliateLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenAffiliate(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAffiliate(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAffiliate(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleAffiliateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAffiliateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAffiliateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: AffiliateRow, shape: AffiliateShape): boolean {
  if (shape === "all") return true;
  if (shape === "web") return affiliateHome(row.code);
  if (shape === "desk") return affiliateAway(row.code);
  if (shape === "mail") return affiliateGuest(row.code);
  if (shape === "fair") return affiliateCitizen(row.code);
  if (shape === "join") return affiliateJoin(row.code);
  if (shape === "gap") return affiliateGap(row.code);
  if (shape === "brief") return affiliateBrief(row.code);
  if (shape === "long") return affiliateLong(row.code);
  if (shape === "mark") return affiliateMark(row.code);
  if (shape === "vowel") return affiliateVowelLane(row.code);
  if (shape === "plain") return affiliatePlain(row.code);
  if (shape === "open") return affiliateOpen(row.code);
  if (shape === "soon") return affiliateSoon(row.code);
  if (shape === "letter") return affiliateLetter(row.code);
  if (shape === "mixed") return affiliateMixed(row.code);
  if (shape === "upper") return affiliateUpper(row.code);
  if (shape === "lower") return affiliateLower(row.code);
  if (shape === "space") return affiliateSpace(row.code);
  if (shape === "even") return affiliateEven(row.code);
  if (shape === "odd") return affiliateOdd(row.code);
  if (shape === "tail") return affiliateTail(row.code);
  if (shape === "first") return affiliateFirst(row.code);
  if (shape === "held") return affiliateHeld(row.code);
  return affiliateLane(row.code) === shape;
}

export function visibleAffiliate(
  rows: readonly AffiliateRow[],
  mail: string,
  hue: string,
  query: string,
  review: AffiliateReview,
  reviewed: readonly string[],
  shape: AffiliateShape,
): AffiliateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (affiliateState(row.code) === "") return false;
    const found = affiliateLane(row.code);
    const hueName = affiliateHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${affiliateStamp(row.code)} ${affiliateFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function affiliateLanesCsv(rows: readonly AffiliateRow[]): string {
  const lines = ["lane,count"];
  for (const line of affiliateLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function affiliateRowsCsv(rows: readonly AffiliateRow[], reviewed: readonly string[]): string {
  const lines = ["name,affiliate,stamp,family,lane,hue,length,web,desk,mail,fair,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(affiliateCopy(row.code)),
        affiliateStamp(row.code),
        csvCell(affiliateFamily(row.code)),
        affiliateLane(row.code),
        affiliateHue(row.code),
        affiliateLength(row.code) ?? "",
        affiliateHome(row.code) ? "1" : "0",
        affiliateAway(row.code) ? "1" : "0",
        affiliateGuest(row.code) ? "1" : "0",
        affiliateCitizen(row.code) ? "1" : "0",
        affiliateJoin(row.code) ? "1" : "0",
        affiliateGap(row.code) ? "1" : "0",
        affiliateBrief(row.code) ? "1" : "0",
        affiliateEven(row.code) ? "1" : "0",
        affiliateDigit(row.code) ? "1" : "0",
        affiliateMixed(row.code) ? "1" : "0",
        affiliateUpper(row.code) ? "1" : "0",
        affiliateVowel(row.code) ? "1" : "0",
        affiliateTail(row.code) ? "1" : "0",
        affiliateHeld(row.code) ? "1" : "0",
        affiliateSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
