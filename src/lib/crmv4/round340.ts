/**
 * Escape wheel rules for a desk kept in this browser, and device plates read the last device already stored on the account.
 * Pieces are tooth, pinion, arbor, and stone. Finishes are gilt, ivory, and graphite.
 * Drops are 3, 9, 18, or 27. Locks are 3, 6, or 9.
 * A known device is PALM, SLAB, MINI, or KIOS. An ampersand joins two devices. A colon marks a pause.
 * A pip is exactly three characters. A strap is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true device reads as PALM. An empty device reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_escapewheel (
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
 * CREATE TABLE crm_device_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_device_review (
 *   trader_id text primary key
 * );
 */
export const EWL_KEY = "crmv4-escapewheel";
export const EWL_VIEW_KEY = "crmv4-escapewheel-views";
export const EWL_DENSITY_KEY = "crmv4-escapewheel-density";
export const EWL_PIECES = ["tooth", "pinion", "arbor", "stone"] as const;

export type EscapePiece = (typeof EWL_PIECES)[number];
export type EscapeFilm = "blank" | "gilt" | "ivory" | "graphite";
export type EscapeTray = "board" | "peg" | "coffer";
export type EscapeDensity = "airy" | "close";
export type EscapeSort = "piece" | "setter";

export type EscapeWheel = {
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

export type EscapeView = {
  id: string;
  name: string;
  tray: EscapeTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type EscapeCounts = {
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

export const ROUND340_FEATURES = [
  "escapewheel-save",
  "tooth-notices",
  "escapewheel-parts",
  "escapewheel-search",
  "drop-sla",
  "vault-file",
  "pin-and-star",
  "inline-title",
  "escapewheel-filters",
  "saved-escapewheel-views",
  "escapewheel-density",
  "setter-sort",
  "escapewheel-kpis",
  "drop-chart",
  "drop-timeline",
  "escapewheel-bulk",
  "escapewheel-csv",
  "escapewheel-keys",
  "escapewheel-audit",
  "fair-setter",
  "escapewheel-viewer",
  "suggest-tooth",
  "overdue-drops",
  "device-plate",
  "device-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 9, 18, 27] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["tooth", "pinion"]);
const OUTER = new Set(["arbor", "stone"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["PALM", "SLAB", "MINI", "KIOS"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): EscapeTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<EscapeFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<EscapeFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pt]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: EscapeWheel, tray: EscapeTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return EWL_PIECES.indexOf(piece as EscapePiece);
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

export function escapePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (EWL_PIECES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
export function escapeDrop(raw: unknown): 3 | 9 | 18 | 27 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "9" && text !== "18" && text !== "27") return null;
  return Number(text) as 3 | 9 | 18 | 27;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
export function escapeLock(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function escapeFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function escapeInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function escapeOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function escapeBand(piece: unknown): string {
  const text = escapePiece(piece);
  if (!text) return "";
  if (text === "tooth") return "point";
  if (text === "pinion") return "leaf";
  if (text === "arbor") return "axle";
  return "chaton";
}

/** Signed distance from one piece to another along the oscillator. */
export function escapeGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(escapePiece(from));
  const right = pieceIndex(escapePiece(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(escapeFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairLock(lock: unknown): boolean {
  return escapeLock(lock) === 6;
}

/** A full lock is 10. */
export function fullLock(lock: unknown): boolean {
  return escapeLock(lock) === 9;
}

export function activePiece(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return escapePiece(text) || "all";
}

export function activeDrop(raw: unknown): string {
  const drop = escapeDrop(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = escapeFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLock(raw: unknown): string {
  const lock = escapeLock(raw);
  return lock === null ? "all" : String(lock);
}

export function moveEscapeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly EscapeWheel[]): string {
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
export function suggestDrop(cards: readonly EscapeWheel[], hour: number): 3 | 9 | 18 | 27 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 9 | 18 | 27 = 3;
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
  if (hour < 5) return 3;
  if (hour < 11) return 9;
  if (hour < 17) return 18;
  return 27;
}

export function suggestPiece(hour: number): EscapePiece {
  return hour < 9 ? "tooth" : "stone";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairSetter(cards: readonly EscapeWheel[], roster: string): string {
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

export function readEscapeWheels(raw: unknown): EscapeWheel[] {
  if (!Array.isArray(raw)) return [];
  const out: EscapeWheel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EscapeWheel>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: escapePiece(row.piece),
      drop: escapeDrop(row.drop),
      film: escapeFilm(row.film),
      lock: escapeLock(row.lock) ?? 3,
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

export function addEscape(
  cards: readonly EscapeWheel[],
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
): EscapeWheel[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readEscapeWheels([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: escapePiece(card.piece),
      drop: escapeDrop(card.drop),
      film: escapeFilm(card.film),
      lock: escapeLock(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly EscapeWheel[], id: string, edit: (card: EscapeWheel) => EscapeWheel): EscapeWheel[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editEscape(cards: readonly EscapeWheel[], id: string, title: string): EscapeWheel[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editEscapeNote(cards: readonly EscapeWheel[], id: string, note: string): EscapeWheel[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(escapeFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setEscapeFilm(cards: readonly EscapeWheel[], id: string, film: string): EscapeWheel[] {
  const next = escapeFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setEscapeRaised(cards: readonly EscapeWheel[], id: string, raised: boolean): EscapeWheel[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setEscapePin(cards: readonly EscapeWheel[], id: string, pinned: boolean): EscapeWheel[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setEscapeCoffer(cards: readonly EscapeWheel[], id: string, coffered: boolean): EscapeWheel[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setEscapeStar(cards: readonly EscapeWheel[], id: string, starred: boolean): EscapeWheel[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addEscapeTag(cards: readonly EscapeWheel[], id: string, tag: string): EscapeWheel[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 3 | 9 | 18 | 27 {
  if (drop === null) return dir > 0 ? 3 : 27;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseDropFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerDropFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseLockFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerLockFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setEscapeFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinEscapeFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return setEscapePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starEscapeFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  return setEscapeStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly EscapeWheel[], id: string): EscapeWheel[] {
  const card = cards.find((item) => item.id === id);
  return card ? setEscapeFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly EscapeWheel[], ids: readonly string[], edit: (card: EscapeWheel) => EscapeWheel): EscapeWheel[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkEscapeGraphite(cards: readonly EscapeWheel[], ids: readonly string[]): EscapeWheel[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkEscapeRaise(cards: readonly EscapeWheel[], ids: readonly string[]): EscapeWheel[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkEscapeCoffer(cards: readonly EscapeWheel[], ids: readonly string[]): EscapeWheel[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkEscapeTag(cards: readonly EscapeWheel[], ids: readonly string[]): EscapeWheel[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "p"]), audit: "tag" }));
}

export function readEscapeViews(raw: unknown): EscapeView[] {
  if (!Array.isArray(raw)) return [];
  const out: EscapeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EscapeView>;
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
      piece: activePiece(row.piece),
      drop: activeDrop(row.drop),
      lock: activeLock(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addEscapeView(views: readonly EscapeView[], view: EscapeView): EscapeView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readEscapeViews([...views, { ...view, id, name }]);
}

export function dropEscapeView(views: readonly EscapeView[], id: string): EscapeView[] {
  return views.filter((view) => view.id !== id);
}

export function escapeDensity(raw: unknown): EscapeDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortEscapeWheels(cards: readonly EscapeWheel[], sort: EscapeSort): EscapeWheel[] {
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

export function visibleEscapeWheels(
  cards: readonly EscapeWheel[],
  tray: EscapeTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): EscapeWheel[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : escapeFilm(film);
  const wantLimb = activePiece(piece);
  const wantBeat = activeDrop(drop);
  const wantRate = activeLock(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !escapeInner(card.piece)) return false;
    if (wantLimb === "outer" && !escapeOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueEscape(card: EscapeWheel): boolean {
  return escapeOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleEscape(card: EscapeWheel): boolean {
  return !card.film && card.drop === 3 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskEscape(card: EscapeWheel): boolean {
  return card.film === "GILT" && card.drop === 27 && card.lock === 9 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingEscape(card: EscapeWheel): boolean {
  return card.piece === "stone" && card.film === "IVORY" && card.drop === 9;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateEscape(card: EscapeWheel, station: string): boolean {
  return card.piece === "tooth" && escapePiece(station) === "stone" && !card.raised;
}

export function escapeCounts(cards: readonly EscapeWheel[], shown: readonly EscapeWheel[], station: string): EscapeCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => escapeInner(card.piece)).length,
    outer: cards.filter((card) => escapeOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 27).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleEscape).length,
    brisk: cards.filter(briskEscape).length,
    resting: cards.filter(restingEscape).length,
    overdue: cards.filter(overdueEscape).length,
    pair: cards.filter((card) => pairLock(card.lock) && lateEscape(card, station)).length,
  };
}

export function escapeBars(cards: readonly EscapeWheel[]): { piece: string; count: number }[] {
  return EWL_PIECES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function escapeTimeline(cards: readonly EscapeWheel[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function escapeSetters(cards: readonly EscapeWheel[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestSetter(cards: readonly EscapeWheel[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of escapeSetters(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderEscapeWheels(cards: readonly EscapeWheel[]): string[] {
  return cards.filter(overdueEscape).map((card) => card.title);
}

export function escapeCopy(card: EscapeWheel): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function escapeCsv(cards: readonly EscapeWheel[], station: string): string {
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
        escapeOuter(card.piece) ? "1" : "0",
        lateEscape(card, station) ? "1" : "0",
        idleEscape(card) ? "1" : "0",
        briskEscape(card) ? "1" : "0",
        restingEscape(card) ? "1" : "0",
        overdueEscape(card) ? "1" : "0",
        escapeInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        escapeBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const DVP_KEY = "crmv4-device-hide";
export const DVP_REVIEW_KEY = "crmv4-device-review";

export type DeviceLane = "" | "palm" | "slab" | "mini" | "kios" | "join" | "gap" | "pip" | "strap" | "mark" | "vowel" | "plain";
export type DeviceHue = "" | "ivory" | "graphite" | "champagne";
export type DeviceState = "" | "clear" | "set";
export type DeviceReview = "all" | "reviewed" | "fresh";
export type DeviceShape =
  | "all"
  | "palm"
  | "slab"
  | "mini"
  | "kios"
  | "join"
  | "gap"
  | "pip"
  | "strap"
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

export type DeviceValue = string | { lastDevice?: unknown; [key: string]: unknown } | null | undefined;
export type DeviceRow = { id: string; label: string; code: DeviceValue };
export type DeviceLaneLine = { lane: string; count: number };

const DEVICE_LANES = ["palm", "slab", "mini", "kios", "join", "gap", "pip", "strap", "mark", "vowel", "plain"] as const;
const DEVICE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: DeviceValue): { lastDevice?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: DeviceValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: DeviceValue): string {
  const row = codeRecord(raw);
  if (row && !("lastDevice" in row)) return "";
  const value = row ? row.lastDevice : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "PALM";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: DeviceValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastDevice" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function deviceState(raw: DeviceValue): DeviceState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known forename is ANNA, NOAH, LEO, or MAX. An ampersand joins two forenames. A colon marks a pause. A bead is exactly three characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function deviceLane(raw: DeviceValue): DeviceLane {
  if (deviceState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "PALM") return "palm";
    if (upper === "SLAB") return "slab";
    if (upper === "MINI") return "mini";
    return "kios";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(":")) return "gap";
  if (text.length === 3) return "pip";
  if (text.length >= 18) return "strap";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function deviceHue(raw: DeviceValue): DeviceHue {
  const lane = deviceLane(raw);
  if (!lane) return "";
  if (lane === "palm" || lane === "mini") return "champagne";
  if (lane === "slab" || lane === "kios" || lane === "join" || lane === "gap" || lane === "strap") return "graphite";
  return "ivory";
}

export function devicePalm(raw: DeviceValue): boolean {
  return deviceLane(raw) === "palm";
}

export function deviceSlab(raw: DeviceValue): boolean {
  return deviceLane(raw) === "slab";
}

export function deviceMini(raw: DeviceValue): boolean {
  return deviceLane(raw) === "mini";
}

export function deviceKios(raw: DeviceValue): boolean {
  return deviceLane(raw) === "kios";
}

export function deviceJoin(raw: DeviceValue): boolean {
  return deviceLane(raw) === "join";
}

export function deviceGap(raw: DeviceValue): boolean {
  return deviceLane(raw) === "gap";
}

export function devicePip(raw: DeviceValue): boolean {
  return deviceLane(raw) === "pip";
}

export function deviceStrap(raw: DeviceValue): boolean {
  return deviceLane(raw) === "strap";
}

export function deviceMark(raw: DeviceValue): boolean {
  return deviceLane(raw) === "mark";
}

export function deviceVowelLane(raw: DeviceValue): boolean {
  return deviceLane(raw) === "vowel";
}

export function devicePlain(raw: DeviceValue): boolean {
  return deviceLane(raw) === "plain";
}

export function deviceOpen(raw: DeviceValue): boolean {
  return deviceState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function deviceHeld(raw: DeviceValue): boolean {
  const lane = deviceLane(raw);
  return lane === "strap" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function deviceSoon(raw: DeviceValue): boolean {
  if (deviceState(raw) !== "set") return false;
  if (devicePip(raw)) return true;
  if (devicePalm(raw) || deviceSlab(raw) || deviceMini(raw) || deviceKios(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function deviceLength(raw: DeviceValue): number | null {
  if (deviceState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function deviceEven(raw: DeviceValue): boolean {
  const length = deviceLength(raw);
  return length !== null && length % 2 === 0;
}

export function deviceOdd(raw: DeviceValue): boolean {
  const length = deviceLength(raw);
  return length !== null && length % 2 === 1;
}

export function deviceFirst(raw: DeviceValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function deviceTail(raw: DeviceValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function deviceCapital(raw: DeviceValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function deviceSpace(raw: DeviceValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function deviceVowel(raw: DeviceValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function deviceDigit(raw: DeviceValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function deviceLetter(raw: DeviceValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function deviceMixed(raw: DeviceValue): boolean {
  return deviceDigit(raw) && deviceLetter(raw);
}

export function deviceLower(raw: DeviceValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function deviceUpper(raw: DeviceValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function deviceStamp(raw: DeviceValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function deviceCopy(raw: DeviceValue): string {
  return codeGiven(raw);
}

export function deviceFamily(raw: DeviceValue): string {
  if (deviceState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function deviceLanes(rows: readonly DeviceRow[]): DeviceLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DEVICE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = deviceLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DEVICE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingDevice(rows: readonly DeviceRow[]): string {
  const lines = deviceLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DEVICE_LANES.indexOf(a.lane as (typeof DEVICE_LANES)[number]) - DEVICE_LANES.indexOf(b.lane as (typeof DEVICE_LANES)[number]))[0].lane;
}

export function leadingDeviceHue(rows: readonly DeviceRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DEVICE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = deviceHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DEVICE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DEVICE_HUES.indexOf(a.hue) - DEVICE_HUES.indexOf(b.hue))[0].hue;
}

export function laneDeviceCount(rows: readonly DeviceRow[], lane: DeviceLane): number {
  return rows.filter((row) => deviceLane(row.code) === lane).length;
}

export function deviceShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDeviceLanes(rows: readonly DeviceRow[]): string[] {
  return deviceLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenDevice(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDevice(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDevice(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleDeviceReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDeviceReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDeviceLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: DeviceRow, shape: DeviceShape): boolean {
  if (shape === "all") return true;
  if (shape === "palm") return devicePalm(row.code);
  if (shape === "slab") return deviceSlab(row.code);
  if (shape === "mini") return deviceMini(row.code);
  if (shape === "kios") return deviceKios(row.code);
  if (shape === "join") return deviceJoin(row.code);
  if (shape === "gap") return deviceGap(row.code);
  if (shape === "pip") return devicePip(row.code);
  if (shape === "strap") return deviceStrap(row.code);
  if (shape === "mark") return deviceMark(row.code);
  if (shape === "vowel") return deviceVowelLane(row.code);
  if (shape === "plain") return devicePlain(row.code);
  if (shape === "open") return deviceOpen(row.code);
  if (shape === "soon") return deviceSoon(row.code);
  if (shape === "letter") return deviceLetter(row.code);
  if (shape === "mixed") return deviceMixed(row.code);
  if (shape === "upper") return deviceUpper(row.code);
  if (shape === "lower") return deviceLower(row.code);
  if (shape === "space") return deviceSpace(row.code);
  if (shape === "even") return deviceEven(row.code);
  if (shape === "odd") return deviceOdd(row.code);
  if (shape === "tail") return deviceTail(row.code);
  if (shape === "first") return deviceFirst(row.code);
  if (shape === "held") return deviceHeld(row.code);
  return deviceLane(row.code) === shape;
}

export function visibleDevice(
  rows: readonly DeviceRow[],
  lane: string,
  hue: string,
  query: string,
  review: DeviceReview,
  reviewed: readonly string[],
  shape: DeviceShape,
): DeviceRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (deviceState(row.code) === "") return false;
    const found = deviceLane(row.code);
    const hueName = deviceHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${deviceStamp(row.code)} ${deviceFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function deviceLanesCsv(rows: readonly DeviceRow[]): string {
  const lines = ["lane,count"];
  for (const line of deviceLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function deviceRowsCsv(rows: readonly DeviceRow[], reviewed: readonly string[]): string {
  const lines = ["name,forename,stamp,family,lane,hue,length,anna,noah,leo,max,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(deviceCopy(row.code)),
        deviceStamp(row.code),
        csvCell(deviceFamily(row.code)),
        deviceLane(row.code),
        deviceHue(row.code),
        deviceLength(row.code) ?? "",
        devicePalm(row.code) ? "1" : "0",
        deviceSlab(row.code) ? "1" : "0",
        deviceMini(row.code) ? "1" : "0",
        deviceKios(row.code) ? "1" : "0",
        deviceJoin(row.code) ? "1" : "0",
        deviceGap(row.code) ? "1" : "0",
        devicePip(row.code) ? "1" : "0",
        deviceEven(row.code) ? "1" : "0",
        deviceDigit(row.code) ? "1" : "0",
        deviceMixed(row.code) ? "1" : "0",
        deviceUpper(row.code) ? "1" : "0",
        deviceVowel(row.code) ? "1" : "0",
        deviceTail(row.code) ? "1" : "0",
        deviceHeld(row.code) ? "1" : "0",
        deviceSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
