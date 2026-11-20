/**
 * Cadrature rules for the under-dial motion work kept in this browser,
 * and job title plates read jobTitle already stored on the account.
 * Wheels are cannon, minute, hour, and date. Finishes are gilt, ivory, and graphite.
 * Pitches are 5, 10, 15, or 30. Wheels counts are 1, 3, or 6.
 * Cannon and minute are main. Hour and date are side.
 * Owner, sales head, and marketing head are leads. Sales managers sit the desk.
 * A retention manager is on hold. Analysts, IT, and project managers are guests.
 * Administrators and marketers are joined. Other and NONE stay plain.
 * An ampersand joins two titles. A colon that is not a time marks a scoped title.
 * A time today is a lead. Within five days is this desk. Within twenty-one days is on hold. Older is a guest.
 * A brief mark is exactly seven characters. A digit mark starts with a digit and is not a time.
 * A long mark is eighteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true title reads as LEAD. A false title reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved job title.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cadrature (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   piece text not null default '',
 *   drop_no integer,
 *   film text not null default '',
 *   lock_no integer not null default 1,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_jbt_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_jbt_review (
 *   trader_id text primary key
 * );
 */


export const CDR_KEY = "crmv4-cadrature";
export const CDR_VIEW_KEY = "crmv4-cadrature-views";
export const CDR_DENSITY_KEY = "crmv4-cadrature-density";
export const CDR_MODES = ["cannon", "minute", "hour", "date"] as const;

export type CadratureMode = (typeof CDR_MODES)[number];
export type CadratureFilm = "blank" | "gilt" | "ivory" | "graphite";
export type CadratureTray = "board" | "peg" | "coffer";
export type CadratureDensity = "airy" | "close";
export type CadratureSort = "piece" | "setter";

export type Cadrature = {
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

export type CadratureView = {
  id: string;
  name: string;
  tray: CadratureTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type CadratureCounts = {
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

export const ROUND361_FEATURES = [
  "cadrature-save",
  "motion-reminders",
  "cadrature-modes",
  "cadrature-search",
  "cadrature-pin-sla",
  "motion-archive",
  "cadrature-latch-star",
  "cadrature-inline-title",
  "cadrature-filters",
  "saved-cadrature-views",
  "cadrature-density",
  "motion-focus",
  "cadrature-kpis",
  "motion-chart",
  "motion-timeline",
  "cadrature-bulk",
  "cadrature-csv",
  "cadrature-keys",
  "cadrature-audit",
  "fair-watchmaker",
  "cadrature-viewer",
  "suggest-motion",
  "overdue-motion",
  "job-title-plate",
  "job-title-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 10, 15, 30] as const;
const LOCK_CYCLE = [1, 3, 6] as const;
const INNER = new Set(["cannon", "minute"]);
const OUTER = new Set(["hour", "date"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CadratureTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<CadratureFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<CadratureFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Cadrature, tray: CadratureTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return CDR_MODES.indexOf(piece as CadratureMode);
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

export function cadratureMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CDR_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 15, or 30. Anything else stays blank. */
export function cadratureHour(raw: unknown): 5 | 10 | 15 | 30 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15" && text !== "30") return null;
  return Number(text) as 5 | 10 | 15 | 30;
}

/** A wheel count is 1, 3, or 6. Anything else stays blank. */
export function cadratureHammer(raw: unknown): 1 | 3 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "6") return null;
  return Number(text) as 1 | 3 | 6;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function cadratureFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function cadratureInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function cadratureOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cannon is the barrel. Minute is the pinion. Hour is the hand. Date is the window. */
export function cadratureBand(piece: unknown): string {
  const text = cadratureMode(piece);
  if (!text) return "";
  if (text === "cannon") return "barrel";
  if (text === "minute") return "pinion";
  if (text === "hour") return "hand";
  return "window";
}

/** Signed distance from one mode to another along the stripe. */
export function cadratureGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(cadratureMode(from));
  const right = pieceIndex(cadratureMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(cadratureFilm(film));
}

/** A pair wheel is 3. One and six are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return cadratureHammer(lock) === 3;
}

/** A full wheel is 6. */
export function fullHammer(lock: unknown): boolean {
  return cadratureHammer(lock) === 6;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return cadratureMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = cadratureHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = cadratureFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = cadratureHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveCadratureFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Cadrature[]): string {
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

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest fifteen. Later, suggest thirty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Cadrature[], hour: number): 5 | 10 | 15 | 30 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 15 | 30 = 5;
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
  return 30;
}

export function suggestMode(hour: number): CadratureMode {
  return hour < 9 ? "cannon" : "date";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Cadrature[], roster: string): string {
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

export function readCadratures(raw: unknown): Cadrature[] {
  if (!Array.isArray(raw)) return [];
  const out: Cadrature[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cadrature>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: cadratureMode(row.piece),
      drop: cadratureHour(row.drop),
      film: cadratureFilm(row.film),
      lock: cadratureHammer(row.lock) ?? 1,
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

export function addCadrature(
  cards: readonly Cadrature[],
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
): Cadrature[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCadratures([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: cadratureMode(card.piece),
      drop: cadratureHour(card.drop),
      film: cadratureFilm(card.film),
      lock: cadratureHammer(card.lock) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cadrature[], id: string, edit: (card: Cadrature) => Cadrature): Cadrature[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCadrature(cards: readonly Cadrature[], id: string, title: string): Cadrature[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCadratureNote(cards: readonly Cadrature[], id: string, note: string): Cadrature[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(cadratureFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setCadratureFilm(cards: readonly Cadrature[], id: string, film: string): Cadrature[] {
  const next = cadratureFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setCadratureRaised(cards: readonly Cadrature[], id: string, raised: boolean): Cadrature[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setCadraturePin(cards: readonly Cadrature[], id: string, pinned: boolean): Cadrature[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setCadratureCoffer(cards: readonly Cadrature[], id: string, coffered: boolean): Cadrature[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setCadratureStar(cards: readonly Cadrature[], id: string, starred: boolean): Cadrature[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addCadratureTag(cards: readonly Cadrature[], id: string, tag: string): Cadrature[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 5 | 10 | 15 | 30 {
  if (drop === null) return dir > 0 ? 5 : 30;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 1 | 3 | 6 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setCadratureFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinCadratureFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return setCadraturePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starCadratureFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  return setCadratureStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Cadrature[], id: string): Cadrature[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCadratureFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Cadrature[], ids: readonly string[], edit: (card: Cadrature) => Cadrature): Cadrature[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCadratureGraphite(cards: readonly Cadrature[], ids: readonly string[]): Cadrature[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkCadratureRaise(cards: readonly Cadrature[], ids: readonly string[]): Cadrature[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkCadratureCoffer(cards: readonly Cadrature[], ids: readonly string[]): Cadrature[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkCadratureTag(cards: readonly Cadrature[], ids: readonly string[]): Cadrature[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readCadratureViews(raw: unknown): CadratureView[] {
  if (!Array.isArray(raw)) return [];
  const out: CadratureView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CadratureView>;
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

export function addCadratureView(views: readonly CadratureView[], view: CadratureView): CadratureView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCadratureViews([...views, { ...view, id, name }]);
}

export function dropCadratureView(views: readonly CadratureView[], id: string): CadratureView[] {
  return views.filter((view) => view.id !== id);
}

export function cadratureDensity(raw: unknown): CadratureDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortCadratures(cards: readonly Cadrature[], sort: CadratureSort): Cadrature[] {
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

export function visibleCadratures(
  cards: readonly Cadrature[],
  tray: CadratureTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Cadrature[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : cadratureFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !cadratureInner(card.piece)) return false;
    if (wantLimb === "outer" && !cadratureOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side wheel on count one, still not raised and not in the drawer, is overdue. */
export function overdueCadrature(card: Cadrature): boolean {
  return cadratureOuter(card.piece) && card.lock === 1 && !card.raised && !card.coffered;
}

/** No finish, pitch five, wheel one, and still on the bench. */
export function idleCadrature(card: Cadrature): boolean {
  return !card.film && card.drop === 5 && card.lock === 1 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, pitch thirty, and a full wheel, still out of the drawer. */
export function briskCadrature(card: Cadrature): boolean {
  return card.film === "GILT" && card.drop === 30 && card.lock === 6 && !card.coffered;
}

/** Date, ivory, and pitch ten. */
export function restingCadrature(card: Cadrature): boolean {
  return card.piece === "date" && card.film === "IVORY" && card.drop === 10;
}

/** A cannon pinion is late when the station is already on the date wheel. */
export function lateCadrature(card: Cadrature, station: string): boolean {
  return card.piece === "cannon" && cadratureMode(station) === "date" && !card.raised;
}

export function cadratureCounts(cards: readonly Cadrature[], shown: readonly Cadrature[], station: string): CadratureCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => cadratureInner(card.piece)).length,
    outer: cards.filter((card) => cadratureOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 30).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleCadrature).length,
    brisk: cards.filter(briskCadrature).length,
    resting: cards.filter(restingCadrature).length,
    overdue: cards.filter(overdueCadrature).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateCadrature(card, station)).length,
  };
}

export function cadratureBars(cards: readonly Cadrature[]): { piece: string; count: number }[] {
  return CDR_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function cadratureTimeline(cards: readonly Cadrature[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function cadratureKeepers(cards: readonly Cadrature[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Cadrature[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of cadratureKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCadratures(cards: readonly Cadrature[]): string[] {
  return cards.filter(overdueCadrature).map((card) => card.title);
}

export function cadratureCopy(card: Cadrature): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function cadratureCsv(cards: readonly Cadrature[], station: string): string {
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
        cadratureOuter(card.piece) ? "1" : "0",
        lateCadrature(card, station) ? "1" : "0",
        idleCadrature(card) ? "1" : "0",
        briskCadrature(card) ? "1" : "0",
        restingCadrature(card) ? "1" : "0",
        overdueCadrature(card) ? "1" : "0",
        cadratureInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        cadratureBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const JBT_KEY = "crmv4-jbt-hide";
export const JBT_REVIEW_KEY = "crmv4-jbt-review";

export type JbtLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type JbtHue = "" | "ivory" | "graphite" | "champagne";
export type JbtState = "" | "clear" | "set";
export type JbtReview = "all" | "reviewed" | "fresh";
export type JbtShape =
  | "all"
  | "hall"
  | "vacant"
  | "hold"
  | "guest"
  | "join"
  | "route"
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

export type JbtValue = string | { jobTitle?: unknown; [key: string]: unknown } | null | undefined;
export type JbtRow = { id: string; label: string; code: JbtValue };
export type JbtLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: JbtValue): { jobTitle?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: JbtValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: JbtValue): string {
  const row = codeRecord(raw);
  if (row && !("jobTitle" in row)) return "";
  const value = row ? row.jobTitle : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LEAD";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: JbtValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("jobTitle" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function jbtState(raw: JbtValue): JbtState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["OWNER_CEO", "SALES_HEAD", "MARKETING_HEAD", "LEAD"]);
const DESK_TITLES = new Set(["SALES_MANAGER", "SALES_MGR"]);
const HOLD_TITLES = new Set(["RETENTION_MANAGER"]);
const GUEST_TITLES = new Set(["ANALYST", "IT_SPECIALIST", "PROJECT_MANAGER"]);
const JOIN_TITLES = new Set(["ADMINISTRATOR", "MARKETER"]);
const PLAIN_TITLES = new Set(["OTHER", "NONE"]);

/** A known job title maps first. An ampersand joins two titles. A colon that is not a time marks a scoped title. A time today is a lead. Within five days is this desk. Within twenty-one days is on hold. Older is a guest. Former or vacant is closed. A brief mark is exactly seven characters. A digit mark starts with a digit and is not a time. A long mark is eighteen characters or longer. A vowel mark starts with a vowel. */
export function jbtLane(raw: JbtValue, now = Date.now()): JbtLane {
  if (jbtState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/former|vacant/i.test(text)) return "vacant";
  if (/\bchief\b|\bowner\b/i.test(text)) return "hall";
  if (text.includes("&")) return "join";
  const at = Date.parse(text);
  if (!Number.isNaN(at)) {
    if (at > now) return "hall";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "hall";
    const age = now - at;
    if (age < 5 * day) return "desk";
    if (age < 21 * day) return "hold";
    return "guest";
  }
  if (text.includes(":")) return "route";
  if (text.length === 7) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 18 && text.includes("/")) return "route";
  if (text.length >= 18) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function jbtHue(raw: JbtValue, now = Date.now()): JbtHue {
  const mail = jbtLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function jbtHome(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "hall";
}

export function jbtAway(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "vacant";
}

export function jbtGuest(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "hold";
}

export function jbtCitizen(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "guest";
}

export function jbtDesk(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "desk";
}

export function jbtJoin(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "join";
}

export function jbtRoute(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "route";
}

export function jbtBrief(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "brief";
}

export function jbtLong(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "long";
}

export function jbtStampMark(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "stamp";
}

export function jbtVowelLane(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "vowel";
}

export function jbtPlain(raw: JbtValue, now = Date.now()): boolean {
  return jbtLane(raw, now) === "plain";
}

export function jbtOpen(raw: JbtValue): boolean {
  return jbtState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function jbtHeld(raw: JbtValue): boolean {
  const mail = jbtLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function jbtSoon(raw: JbtValue, now = Date.now()): boolean {
  if (jbtState(raw) !== "set") return false;
  if (jbtBrief(raw, now)) return true;
  if (jbtHome(raw, now) || jbtAway(raw, now) || jbtGuest(raw, now) || jbtCitizen(raw, now)) return false;
  return codeGiven(raw).length === 9;
}

export function jbtLength(raw: JbtValue): number | null {
  if (jbtState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function jbtEven(raw: JbtValue): boolean {
  const length = jbtLength(raw);
  return length !== null && length % 2 === 0;
}

export function jbtOdd(raw: JbtValue): boolean {
  const length = jbtLength(raw);
  return length !== null && length % 2 === 1;
}

export function jbtFirst(raw: JbtValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function jbtTail(raw: JbtValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function jbtCapital(raw: JbtValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function jbtSpace(raw: JbtValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function jbtVowel(raw: JbtValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function jbtDigit(raw: JbtValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function jbtLetter(raw: JbtValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function jbtMixed(raw: JbtValue): boolean {
  return jbtDigit(raw) && jbtLetter(raw);
}

export function jbtLower(raw: JbtValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function jbtUpper(raw: JbtValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function jbtStamp(raw: JbtValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function jbtCopy(raw: JbtValue): string {
  return codeGiven(raw);
}

export function jbtFamily(raw: JbtValue): string {
  if (jbtState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function jbtLanes(rows: readonly JbtRow[]): JbtLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = jbtLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly JbtRow[]): string {
  const lines = jbtLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly JbtRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = jbtHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly JbtRow[], mail: JbtLane): number {
  return rows.filter((row) => jbtLane(row.code) === mail).length;
}

export function jbtShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly JbtRow[]): string[] {
  return jbtLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenSel(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSel(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSel(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleSelReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSelReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSelLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: JbtRow, shape: JbtShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return jbtHome(row.code);
  if (shape === "vacant") return jbtAway(row.code);
  if (shape === "hold") return jbtGuest(row.code);
  if (shape === "guest") return jbtCitizen(row.code);
  if (shape === "join") return jbtJoin(row.code);
  if (shape === "route") return jbtRoute(row.code);
  if (shape === "brief") return jbtBrief(row.code);
  if (shape === "long") return jbtLong(row.code);
  if (shape === "stamp") return jbtStampMark(row.code);
  if (shape === "vowel") return jbtVowelLane(row.code);
  if (shape === "plain") return jbtPlain(row.code);
  if (shape === "open") return jbtOpen(row.code);
  if (shape === "soon") return jbtSoon(row.code);
  if (shape === "letter") return jbtLetter(row.code);
  if (shape === "mixed") return jbtMixed(row.code);
  if (shape === "upper") return jbtUpper(row.code);
  if (shape === "lower") return jbtLower(row.code);
  if (shape === "space") return jbtSpace(row.code);
  if (shape === "even") return jbtEven(row.code);
  if (shape === "odd") return jbtOdd(row.code);
  if (shape === "tail") return jbtTail(row.code);
  if (shape === "first") return jbtFirst(row.code);
  if (shape === "held") return jbtHeld(row.code);
  return jbtLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly JbtRow[],
  mail: string,
  hue: string,
  query: string,
  review: JbtReview,
  reviewed: readonly string[],
  shape: JbtShape,
): JbtRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (jbtState(row.code) === "") return false;
    const found = jbtLane(row.code);
    const hueName = jbtHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${jbtStamp(row.code)} ${jbtFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function jbtLanesCsv(rows: readonly JbtRow[]): string {
  const lines = ["lane,count"];
  for (const line of jbtLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function jbtRowsCsv(rows: readonly JbtRow[], reviewed: readonly string[]): string {
  const lines = ["name,jobTitle,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(jbtCopy(row.code)),
        jbtStamp(row.code),
        csvCell(jbtFamily(row.code)),
        jbtLane(row.code),
        jbtHue(row.code),
        jbtLength(row.code) ?? "",
        jbtHome(row.code) ? "1" : "0",
        jbtAway(row.code) ? "1" : "0",
        jbtGuest(row.code) ? "1" : "0",
        jbtDesk(row.code) ? "1" : "0",
        jbtCitizen(row.code) ? "1" : "0",
        jbtJoin(row.code) ? "1" : "0",
        jbtRoute(row.code) ? "1" : "0",
        jbtBrief(row.code) ? "1" : "0",
        jbtEven(row.code) ? "1" : "0",
        jbtDigit(row.code) ? "1" : "0",
        jbtMixed(row.code) ? "1" : "0",
        jbtUpper(row.code) ? "1" : "0",
        jbtVowel(row.code) ? "1" : "0",
        jbtTail(row.code) ? "1" : "0",
        jbtHeld(row.code) ? "1" : "0",
        jbtSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
