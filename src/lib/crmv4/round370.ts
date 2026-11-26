/**
 * Cloisonné cell rules for an enamel cell kept in this browser,
 * and document type plates read the document type already stored on the document.
 * Cells are floor, wall, wire, and rim. Fires are flux, ivory, and graphite.
 * Heats are 3, 6, 12, or 24. Counts are 3, 6, or 9.
 * Floor and wall are the field. Wire and rim are the fence.
 * ID, passport, license, house, and YES are identity. Address and proof sit the desk.
 * Selfie, pending, wait, and hold wait. Other, lost, and void are returned.
 * Twin and pair are joined. None, no, and blank stay plain.
 * An ampersand joins two types. A slash that is not a time marks a scoped type.
 * A time today is identity. Within one day is the desk. Within five days waits. Older is returned.
 * A brief type is exactly four characters. A digit type starts with a digit and is not a time.
 * A long type is ten characters or longer and does not start with a digit. A vowel type starts with a vowel.
 * The words clear and file are identity. Quiet or closed is shut.
 * A true type reads as CLEAR. A false type reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved type.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cloison_cell (
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
 * CREATE TABLE crm_dtp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_dtp_review (
 *   trader_id text primary key
 * );
 */

export const CZN_KEY = "crmv4-cloison-370";
export const CZN_VIEW_KEY = "crmv4-cloison-views-370";
export const CZN_DENSITY_KEY = "crmv4-cloison-density-370";
export const CZN_MODES = ["floor", "wall", "wire", "rim"] as const;

export type CloisonMode = (typeof CZN_MODES)[number];
export type CloisonFilm = "blank" | "flux" | "ivory" | "graphite";
export type CloisonTray = "board" | "peg" | "coffer";
export type CloisonDensity = "airy" | "close";
export type CloisonSort = "piece" | "setter";

export type Cloison = {
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

export type CloisonView = {
  id: string;
  name: string;
  tray: CloisonTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type CloisonCounts = {
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

export const ROUND370_FEATURES = [
  "cloison-save",
  "cell-reminders",
  "cloison-modes",
  "cloison-search",
  "cell-heat-sla",
  "cell-archive",
  "cloison-count-star",
  "cloison-inline-title",
  "cloison-filters",
  "saved-cloison-views",
  "cloison-density",
  "cell-focus",
  "cloison-kpis",
  "cell-chart",
  "cell-timeline",
  "cloison-bulk",
  "cloison-csv",
  "cloison-keys",
  "cloison-audit",
  "fair-enameller",
  "cloison-viewer",
  "suggest-floor",
  "overdue-wire",
  "document-type-plate",
  "document-type-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["flux", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 6, 12, 24] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["floor", "wall"]);
const OUTER = new Set(["wire", "rim"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CloisonTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<CloisonFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<CloisonFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Cloison, tray: CloisonTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return CZN_MODES.indexOf(piece as CloisonMode);
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

export function cloisonMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CZN_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function cloisonHour(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A weave count is 4, 7, or 11. Anything else stays blank. */
export function cloisonHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function cloisonFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function cloisonInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function cloisonOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Warp is the reed. Weft is the shuttle. Selvage is the edge. Fringe is the tassel. */
export function cloisonBand(piece: unknown): string {
  const text = cloisonMode(piece);
  if (!text) return "";
  if (text === "floor") return "ground";
  if (text === "wall") return "partition";
  if (text === "wire") return "cloisons";
  return "border";
}

/** Signed distance from one mode to another along the stripe. */
export function cloisonGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(cloisonMode(from));
  const right = pieceIndex(cloisonMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(cloisonFilm(film));
}

/** A pair count is 7. Four and eleven are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return cloisonHammer(lock) === 6;
}

/** A full count is 11. */
export function fullHammer(lock: unknown): boolean {
  return cloisonHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return cloisonMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = cloisonHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = cloisonFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = cloisonHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveCloisonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Cloison[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["IVORY", "FLUX", "GRAPHITE"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest twenty. Later, suggest forty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Cloison[], hour: number): 3 | 6 | 12 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 12 | 24 = 3;
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
  if (hour < 3) return 3;
  if (hour < 6) return 6;
  if (hour < 12) return 12;
  return 24;
}

export function suggestMode(hour: number): CloisonMode {
  return hour < 12 ? "floor" : "rim";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Cloison[], roster: string): string {
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

export function readCloisonCards(raw: unknown): Cloison[] {
  if (!Array.isArray(raw)) return [];
  const out: Cloison[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cloison>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: cloisonMode(row.piece),
      drop: cloisonHour(row.drop),
      film: cloisonFilm(row.film),
      lock: cloisonHammer(row.lock) ?? 3,
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

export function addCloison(
  cards: readonly Cloison[],
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
): Cloison[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCloisonCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: cloisonMode(card.piece),
      drop: cloisonHour(card.drop),
      film: cloisonFilm(card.film),
      lock: cloisonHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cloison[], id: string, edit: (card: Cloison) => Cloison): Cloison[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCloison(cards: readonly Cloison[], id: string, title: string): Cloison[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCloisonNote(cards: readonly Cloison[], id: string, note: string): Cloison[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "FLUX", "IVORY", "GRAPHITE"];
  const index = order.indexOf(cloisonFilm(film));
  return order[(index + 1) % order.length] || "FLUX";
}

export function setCloisonFilm(cards: readonly Cloison[], id: string, film: string): Cloison[] {
  const next = cloisonFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setCloisonRaised(cards: readonly Cloison[], id: string, raised: boolean): Cloison[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setCloisonPin(cards: readonly Cloison[], id: string, pinned: boolean): Cloison[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setCloisonCoffer(cards: readonly Cloison[], id: string, coffered: boolean): Cloison[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setCloisonStar(cards: readonly Cloison[], id: string, starred: boolean): Cloison[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addCloisonTag(cards: readonly Cloison[], id: string, tag: string): Cloison[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 3 | 6 | 12 | 24 {
  if (drop === null) return dir > 0 ? 3 : 24;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setCloisonFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinCloisonFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return setCloisonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starCloisonFocused(cards: readonly Cloison[], id: string): Cloison[] {
  return setCloisonStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Cloison[], id: string): Cloison[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCloisonFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Cloison[], ids: readonly string[], edit: (card: Cloison) => Cloison): Cloison[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCloisonGraphite(cards: readonly Cloison[], ids: readonly string[]): Cloison[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkCloisonRaise(cards: readonly Cloison[], ids: readonly string[]): Cloison[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkCloisonCoffer(cards: readonly Cloison[], ids: readonly string[]): Cloison[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkCloisonTag(cards: readonly Cloison[], ids: readonly string[]): Cloison[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readCloisonViews(raw: unknown): CloisonView[] {
  if (!Array.isArray(raw)) return [];
  const out: CloisonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CloisonView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeFinish(row.film, ["FLUX", "IVORY", "GRAPHITE"]),
      piece: activeMode(row.piece),
      drop: activeHour(row.drop),
      lock: activeHammer(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCloisonView(views: readonly CloisonView[], view: CloisonView): CloisonView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCloisonViews([...views, { ...view, id, name }]);
}

export function dropCloisonView(views: readonly CloisonView[], id: string): CloisonView[] {
  return views.filter((view) => view.id !== id);
}

export function cloisonDensity(raw: unknown): CloisonDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortCloisonCards(cards: readonly Cloison[], sort: CloisonSort): Cloison[] {
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

export function visibleCloisonCards(
  cards: readonly Cloison[],
  tray: CloisonTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Cloison[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : cloisonFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !cloisonInner(card.piece)) return false;
    if (wantLimb === "outer" && !cloisonOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An edge stripe on count four, still not raised and not in the drawer, is overdue. */
export function overdueCloison(card: Cloison): boolean {
  return cloisonOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}


/** No finish, pitch five, count four, and still on the bench. */
export function idleCloison(card: Cloison): boolean {
  return !card.film && card.drop === 3 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, pitch forty, and a full count, still out of the drawer. */
export function briskCloison(card: Cloison): boolean {
  return card.film === "FLUX" && card.drop === 24 && card.lock === 9 && !card.coffered;
}


/** Fringe, ivory, and pitch ten. */
export function restingCloison(card: Cloison): boolean {
  return card.piece === "rim" && card.film === "IVORY" && card.drop === 6;
}


/** A boss is late when the station is already on the rim. */
export function lateCloison(card: Cloison, station: string): boolean {
  return card.piece === "floor" && cloisonMode(station) === "rim" && !card.raised;
}


export function cloisonCounts(cards: readonly Cloison[], shown: readonly Cloison[], station: string): CloisonCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => cloisonInner(card.piece)).length,
    outer: cards.filter((card) => cloisonOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 24).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleCloison).length,
    brisk: cards.filter(briskCloison).length,
    resting: cards.filter(restingCloison).length,
    overdue: cards.filter(overdueCloison).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateCloison(card, station)).length,
  };
}

export function cloisonBars(cards: readonly Cloison[]): { piece: string; count: number }[] {
  return CZN_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function cloisonTimeline(cards: readonly Cloison[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function cloisonKeepers(cards: readonly Cloison[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Cloison[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of cloisonKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCloisonCards(cards: readonly Cloison[]): string[] {
  return cards.filter(overdueCloison).map((card) => card.title);
}

export function cloisonCopy(card: Cloison): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function cloisonCsv(cards: readonly Cloison[], station: string): string {
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
        cloisonOuter(card.piece) ? "1" : "0",
        lateCloison(card, station) ? "1" : "0",
        idleCloison(card) ? "1" : "0",
        briskCloison(card) ? "1" : "0",
        restingCloison(card) ? "1" : "0",
        overdueCloison(card) ? "1" : "0",
        cloisonInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        cloisonBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const DTP_KEY = "crmv4-dtp-hide-370";
export const DTP_REVIEW_KEY = "crmv4-dtp-review-370";

export type DtpLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type DtpHue = "" | "ivory" | "graphite" | "champagne";
export type DtpState = "" | "clear" | "set";
export type DtpReview = "all" | "reviewed" | "fresh";
export type DtpShape =
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

export type DtpValue = string | { docType?: unknown; [key: string]: unknown } | null | undefined;
export type DtpRow = { id: string; label: string; code: DtpValue; userId?: string };
export type DtpLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: DtpValue): { docType?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: DtpValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: DtpValue): string {
  const row = codeRecord(raw);
  if (row && !("docType" in row)) return "";
  const value = row ? row.docType : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CLEAR";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: DtpValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("docType" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function dtpState(raw: DtpValue): DtpState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["ID", "PASSPORT", "LICENSE", "HOUSE", "YES", "APPROVED"]);
const DESK_TITLES = new Set(["ADDRESS", "PROOF", "WEB", "FORM"]);
const HOLD_TITLES = new Set(["SELFIE", "WAIT", "HOLD", "PENDING"]);
const GUEST_TITLES = new Set(["OTHER", "LOST", "VOID", "REJECTED"]);
const JOIN_TITLES = new Set(["TWIN", "PAIR"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function dtpLane(raw: DtpValue, now = Date.now()): DtpLane {
  if (dtpState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/quiet|closed/i.test(text)) return "vacant";
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
    if (age < 1 * day) return "desk";
    if (age < 5 * day) return "hold";
    return "guest";
  }
  if (text.includes("/")) return "route";
  if (text.length === 4) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (/\bclear\b|\bfile\b/i.test(text)) return "hall";
  if (text.length >= 10 && text.includes(":")) return "route";
  if (text.length >= 10) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function dtpHue(raw: DtpValue, now = Date.now()): DtpHue {
  const mail = dtpLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function dtpHome(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "hall";
}

export function dtpAway(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "vacant";
}

export function dtpGuest(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "hold";
}

export function dtpCitizen(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "guest";
}

export function dtpDesk(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "desk";
}

export function dtpJoin(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "join";
}

export function dtpRoute(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "route";
}

export function dtpBrief(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "brief";
}

export function dtpLong(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "long";
}

export function dtpStampMark(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "stamp";
}

export function dtpVowelLane(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "vowel";
}

export function dtpPlain(raw: DtpValue, now = Date.now()): boolean {
  return dtpLane(raw, now) === "plain";
}

export function dtpOpen(raw: DtpValue): boolean {
  return dtpState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function dtpHeld(raw: DtpValue): boolean {
  const mail = dtpLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function dtpSoon(raw: DtpValue, now = Date.now()): boolean {
  if (dtpState(raw) !== "set") return false;
  if (dtpBrief(raw, now)) return true;
  if (dtpHome(raw, now) || dtpAway(raw, now) || dtpGuest(raw, now) || dtpCitizen(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function dtpLength(raw: DtpValue): number | null {
  if (dtpState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function dtpEven(raw: DtpValue): boolean {
  const length = dtpLength(raw);
  return length !== null && length % 2 === 0;
}

export function dtpOdd(raw: DtpValue): boolean {
  const length = dtpLength(raw);
  return length !== null && length % 2 === 1;
}

export function dtpFirst(raw: DtpValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function dtpTail(raw: DtpValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function dtpCapital(raw: DtpValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function dtpSpace(raw: DtpValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function dtpVowel(raw: DtpValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function dtpDigit(raw: DtpValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function dtpLetter(raw: DtpValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function dtpMixed(raw: DtpValue): boolean {
  return dtpDigit(raw) && dtpLetter(raw);
}

export function dtpLower(raw: DtpValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function dtpUpper(raw: DtpValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function dtpStamp(raw: DtpValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function dtpCopy(raw: DtpValue): string {
  return codeGiven(raw);
}

export function dtpFamily(raw: DtpValue): string {
  if (dtpState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function dtpLanes(rows: readonly DtpRow[]): DtpLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = dtpLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly DtpRow[]): string {
  const lines = dtpLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly DtpRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = dtpHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly DtpRow[], mail: DtpLane): number {
  return rows.filter((row) => dtpLane(row.code) === mail).length;
}

export function dtpShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly DtpRow[]): string[] {
  return dtpLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: DtpRow, shape: DtpShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return dtpHome(row.code);
  if (shape === "vacant") return dtpAway(row.code);
  if (shape === "hold") return dtpGuest(row.code);
  if (shape === "guest") return dtpCitizen(row.code);
  if (shape === "join") return dtpJoin(row.code);
  if (shape === "route") return dtpRoute(row.code);
  if (shape === "brief") return dtpBrief(row.code);
  if (shape === "long") return dtpLong(row.code);
  if (shape === "stamp") return dtpStampMark(row.code);
  if (shape === "vowel") return dtpVowelLane(row.code);
  if (shape === "plain") return dtpPlain(row.code);
  if (shape === "open") return dtpOpen(row.code);
  if (shape === "soon") return dtpSoon(row.code);
  if (shape === "letter") return dtpLetter(row.code);
  if (shape === "mixed") return dtpMixed(row.code);
  if (shape === "upper") return dtpUpper(row.code);
  if (shape === "lower") return dtpLower(row.code);
  if (shape === "space") return dtpSpace(row.code);
  if (shape === "even") return dtpEven(row.code);
  if (shape === "odd") return dtpOdd(row.code);
  if (shape === "tail") return dtpTail(row.code);
  if (shape === "first") return dtpFirst(row.code);
  if (shape === "held") return dtpHeld(row.code);
  return dtpLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly DtpRow[],
  mail: string,
  hue: string,
  query: string,
  review: DtpReview,
  reviewed: readonly string[],
  shape: DtpShape,
): DtpRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (dtpState(row.code) === "") return false;
    const found = dtpLane(row.code);
    const hueName = dtpHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${dtpStamp(row.code)} ${dtpFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function dtpLanesCsv(rows: readonly DtpRow[]): string {
  const lines = ["lane,count"];
  for (const line of dtpLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function dtpRowsCsv(rows: readonly DtpRow[], reviewed: readonly string[]): string {
  const lines = ["name,docType,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(dtpCopy(row.code)),
        dtpStamp(row.code),
        csvCell(dtpFamily(row.code)),
        dtpLane(row.code),
        dtpHue(row.code),
        dtpLength(row.code) ?? "",
        dtpHome(row.code) ? "1" : "0",
        dtpAway(row.code) ? "1" : "0",
        dtpGuest(row.code) ? "1" : "0",
        dtpDesk(row.code) ? "1" : "0",
        dtpCitizen(row.code) ? "1" : "0",
        dtpJoin(row.code) ? "1" : "0",
        dtpRoute(row.code) ? "1" : "0",
        dtpBrief(row.code) ? "1" : "0",
        dtpEven(row.code) ? "1" : "0",
        dtpDigit(row.code) ? "1" : "0",
        dtpMixed(row.code) ? "1" : "0",
        dtpUpper(row.code) ? "1" : "0",
        dtpVowel(row.code) ? "1" : "0",
        dtpTail(row.code) ? "1" : "0",
        dtpHeld(row.code) ? "1" : "0",
        dtpSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
