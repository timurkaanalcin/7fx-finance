/**
 * Flinqué foil rules for an enamel coat kept in this browser,
 * and method keeper plates read canManageMethods already stored on the account.
 * Foils are foil, wave, scale, and lace. Finishes are gilt, ivory, and graphite.
 * Foil counts are 4, 9, 18, or 36. Bases are 2, 4, or 8.
 * Foil and wave are main. Scale and lace are side.
 * YES, KEEP, and ON are keepers. NO, OFF, DENY, and BLOCK are closed. NONE is an open note.
 * A plus joins two grants. A bar that is not a time marks a scoped grant.
 * A time today is a keeper. Within three days is this window. Within fourteen days is this fortnight. Older is aged.
 * A short mark is exactly five characters. A digit mark starts with a digit and is not a time.
 * An extended mark is sixteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true permission reads as YES. A false permission reads as NO.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_flinque (
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
 * CREATE TABLE crm_mkp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_mkp_review (
 *   trader_id text primary key
 * );
 */


export const FLQ_KEY = "crmv4-flinque";
export const FLQ_VIEW_KEY = "crmv4-flinque-views";
export const FLQ_DENSITY_KEY = "crmv4-flinque-density";
export const FLQ_MODES = ["foil", "wave", "scale", "lace"] as const;

export type FlinqueMode = (typeof FLQ_MODES)[number];
export type FlinqueFilm = "blank" | "gilt" | "ivory" | "graphite";
export type FlinqueTray = "board" | "peg" | "coffer";
export type FlinqueDensity = "airy" | "close";
export type FlinqueSort = "piece" | "setter";

export type Flinque = {
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

export type FlinqueView = {
  id: string;
  name: string;
  tray: FlinqueTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type FlinqueCounts = {
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

export const ROUND360_FEATURES = [
  "flinque-save",
  "foil-reminders",
  "flinque-modes",
  "flinque-search",
  "flinque-pin-sla",
  "foil-archive",
  "flinque-latch-star",
  "flinque-inline-title",
  "flinque-filters",
  "saved-flinque-views",
  "flinque-density",
  "foil-focus",
  "flinque-kpis",
  "foil-chart",
  "foil-timeline",
  "flinque-bulk",
  "flinque-csv",
  "flinque-keys",
  "flinque-audit",
  "fair-enameller",
  "flinque-viewer",
  "suggest-foil",
  "overdue-foil",
  "method-keeper-plate",
  "method-keeper-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 9, 18, 36] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["foil", "wave"]);
const OUTER = new Set(["scale", "lace"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FlinqueTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<FlinqueFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<FlinqueFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[fq]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Flinque, tray: FlinqueTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return FLQ_MODES.indexOf(piece as FlinqueMode);
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

export function flinqueMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (FLQ_MODES as readonly string[]).includes(text) ? text : "";
}

/** A foil count is 4, 9, 18, or 36. Anything else stays blank. */
export function flinqueHour(raw: unknown): 4 | 9 | 18 | 36 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "9" && text !== "18" && text !== "36") return null;
  return Number(text) as 4 | 9 | 18 | 36;
}

/** A base is 2, 4, or 8. Anything else stays blank. */
export function flinqueHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function flinqueFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function flinqueInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function flinqueOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Straight is the bar. Circular is the ring. Wavy is the wave. Broken is the break. */
export function flinqueBand(piece: unknown): string {
  const text = flinqueMode(piece);
  if (!text) return "";
  if (text === "foil") return "leaf";
  if (text === "wave") return "ripple";
  if (text === "scale") return "tile";
  return "net";
}

/** Signed distance from one mode to another along the stripe. */
export function flinqueGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(flinqueMode(from));
  const right = pieceIndex(flinqueMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(flinqueFilm(film));
}

/** A pair base is 4. Two and eight are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return flinqueHammer(lock) === 4;
}

/** A full base is 8. */
export function fullHammer(lock: unknown): boolean {
  return flinqueHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return flinqueMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = flinqueHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = flinqueFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = flinqueHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveFlinqueFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Flinque[]): string {
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

/** Before eight, suggest four. Before fourteen, suggest nine. Before twenty, suggest eighteen. Later, suggest thirty-six. A saved count on the bench wins, and a tie keeps the shorter count. */
export function suggestHour(cards: readonly Flinque[], hour: number): 4 | 9 | 18 | 36 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 9 | 18 | 36 = 4;
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
  if (hour < 8) return 4;
  if (hour < 14) return 9;
  if (hour < 20) return 18;
  return 36;
}

export function suggestMode(hour: number): FlinqueMode {
  return hour < 8 ? "foil" : "lace";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Flinque[], roster: string): string {
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

export function readFlinques(raw: unknown): Flinque[] {
  if (!Array.isArray(raw)) return [];
  const out: Flinque[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Flinque>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: flinqueMode(row.piece),
      drop: flinqueHour(row.drop),
      film: flinqueFilm(row.film),
      lock: flinqueHammer(row.lock) ?? 2,
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

export function addFlinque(
  cards: readonly Flinque[],
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
): Flinque[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFlinques([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: flinqueMode(card.piece),
      drop: flinqueHour(card.drop),
      film: flinqueFilm(card.film),
      lock: flinqueHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Flinque[], id: string, edit: (card: Flinque) => Flinque): Flinque[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFlinque(cards: readonly Flinque[], id: string, title: string): Flinque[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFlinqueNote(cards: readonly Flinque[], id: string, note: string): Flinque[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(flinqueFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setFlinqueFilm(cards: readonly Flinque[], id: string, film: string): Flinque[] {
  const next = flinqueFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setFlinqueRaised(cards: readonly Flinque[], id: string, raised: boolean): Flinque[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setFlinquePin(cards: readonly Flinque[], id: string, pinned: boolean): Flinque[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setFlinqueCoffer(cards: readonly Flinque[], id: string, coffered: boolean): Flinque[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setFlinqueStar(cards: readonly Flinque[], id: string, starred: boolean): Flinque[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addFlinqueTag(cards: readonly Flinque[], id: string, tag: string): Flinque[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 4 | 9 | 18 | 36 {
  if (drop === null) return dir > 0 ? 4 : 36;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setFlinqueFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinFlinqueFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return setFlinquePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starFlinqueFocused(cards: readonly Flinque[], id: string): Flinque[] {
  return setFlinqueStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Flinque[], id: string): Flinque[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFlinqueFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Flinque[], ids: readonly string[], edit: (card: Flinque) => Flinque): Flinque[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFlinqueGraphite(cards: readonly Flinque[], ids: readonly string[]): Flinque[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkFlinqueRaise(cards: readonly Flinque[], ids: readonly string[]): Flinque[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkFlinqueCoffer(cards: readonly Flinque[], ids: readonly string[]): Flinque[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkFlinqueTag(cards: readonly Flinque[], ids: readonly string[]): Flinque[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "q"]), audit: "tag" }));
}

export function readFlinqueViews(raw: unknown): FlinqueView[] {
  if (!Array.isArray(raw)) return [];
  const out: FlinqueView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FlinqueView>;
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

export function addFlinqueView(views: readonly FlinqueView[], view: FlinqueView): FlinqueView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFlinqueViews([...views, { ...view, id, name }]);
}

export function dropFlinqueView(views: readonly FlinqueView[], id: string): FlinqueView[] {
  return views.filter((view) => view.id !== id);
}

export function flinqueDensity(raw: unknown): FlinqueDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortFlinques(cards: readonly Flinque[], sort: FlinqueSort): Flinque[] {
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

export function visibleFlinques(
  cards: readonly Flinque[],
  tray: FlinqueTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Flinque[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : flinqueFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !flinqueInner(card.piece)) return false;
    if (wantLimb === "outer" && !flinqueOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side coat on base two, still not raised and not in the drawer, is overdue. */
export function overdueFlinque(card: Flinque): boolean {
  return flinqueOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No finish, foil count four, base two, and still on the bench. */
export function idleFlinque(card: Flinque): boolean {
  return !card.film && card.drop === 4 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, foil count thirty-six, and a full base, still out of the drawer. */
export function briskFlinque(card: Flinque): boolean {
  return card.film === "GILT" && card.drop === 36 && card.lock === 8 && !card.coffered;
}

/** Lace, ivory, and foil count nine. */
export function restingFlinque(card: Flinque): boolean {
  return card.piece === "lace" && card.film === "IVORY" && card.drop === 9;
}

/** A foil leaf is late when the station is already lace. */
export function lateFlinque(card: Flinque, station: string): boolean {
  return card.piece === "foil" && flinqueMode(station) === "lace" && !card.raised;
}

export function flinqueCounts(cards: readonly Flinque[], shown: readonly Flinque[], station: string): FlinqueCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => flinqueInner(card.piece)).length,
    outer: cards.filter((card) => flinqueOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 36).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleFlinque).length,
    brisk: cards.filter(briskFlinque).length,
    resting: cards.filter(restingFlinque).length,
    overdue: cards.filter(overdueFlinque).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateFlinque(card, station)).length,
  };
}

export function flinqueBars(cards: readonly Flinque[]): { piece: string; count: number }[] {
  return FLQ_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function flinqueTimeline(cards: readonly Flinque[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function flinqueKeepers(cards: readonly Flinque[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Flinque[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of flinqueKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFlinques(cards: readonly Flinque[]): string[] {
  return cards.filter(overdueFlinque).map((card) => card.title);
}

export function flinqueCopy(card: Flinque): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function flinqueCsv(cards: readonly Flinque[], station: string): string {
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
        flinqueOuter(card.piece) ? "1" : "0",
        lateFlinque(card, station) ? "1" : "0",
        idleFlinque(card) ? "1" : "0",
        briskFlinque(card) ? "1" : "0",
        restingFlinque(card) ? "1" : "0",
        overdueFlinque(card) ? "1" : "0",
        flinqueInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        flinqueBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const MKP_KEY = "crmv4-mkp-hide";
export const MKP_REVIEW_KEY = "crmv4-mkp-review";

export type MkpLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type MkpHue = "" | "ivory" | "graphite" | "champagne";
export type MkpState = "" | "clear" | "set";
export type MkpReview = "all" | "reviewed" | "fresh";
export type MkpShape =
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

export type MkpValue = string | { canManageMethods?: unknown; [key: string]: unknown } | null | undefined;
export type MkpRow = { id: string; label: string; code: MkpValue };
export type MkpLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: MkpValue): { canManageMethods?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: MkpValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: MkpValue): string {
  const row = codeRecord(raw);
  if (row && !("canManageMethods" in row)) return "";
  const value = row ? row.canManageMethods : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "YES";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO";
  return clip(value, 48);
}

function codeReadable(raw: MkpValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("canManageMethods" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function mkpState(raw: MkpValue): MkpState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A login today is live. A login within seven days is this week. A login within thirty days is this month. An older login is stale. IN is live. OFF is never. NONE is idle. An ampersand joins two marks. A colon that is not a time marks a route. A brief mark is exactly six characters. A stamp starts with a digit and is not a time. A long mark is twenty characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function mkpLane(raw: MkpValue, now = Date.now()): MkpLane {
  if (mkpState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (upper === "YES" || upper === "KEEP" || upper === "ON" || upper === "TRUE") return "hall";
  if (upper === "NO" || upper === "OFF" || upper === "FALSE" || upper === "DENY" || upper === "BLOCK") return "vacant";
  if (upper === "NONE") return "plain";
  if (text.includes("+")) return "join";
  if (/script|robot/i.test(text)) return "vacant";
  if (/grant|allow/i.test(text)) return "hall";
  const at = Date.parse(text);
  if (!Number.isNaN(at)) {
    if (at > now) return "hall";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "hall";
    const age = now - at;
    if (age < 3 * day) return "desk";
    if (age < 14 * day) return "hold";
    return "guest";
  }
  if (text.includes("|")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 16 && text.includes("/")) return "route";
  if (text.length >= 16) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function mkpHue(raw: MkpValue, now = Date.now()): MkpHue {
  const mail = mkpLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function mkpHome(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "hall";
}

export function mkpAway(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "vacant";
}

export function mkpGuest(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "hold";
}

export function mkpCitizen(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "guest";
}

export function mkpDesk(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "desk";
}

export function mkpJoin(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "join";
}

export function mkpRoute(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "route";
}

export function mkpBrief(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "brief";
}

export function mkpLong(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "long";
}

export function mkpStampMark(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "stamp";
}

export function mkpVowelLane(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "vowel";
}

export function mkpPlain(raw: MkpValue, now = Date.now()): boolean {
  return mkpLane(raw, now) === "plain";
}

export function mkpOpen(raw: MkpValue): boolean {
  return mkpState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function mkpHeld(raw: MkpValue): boolean {
  const mail = mkpLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or an eight-character mark that is not a known visit, still wants a fuller name. */
export function mkpSoon(raw: MkpValue, now = Date.now()): boolean {
  if (mkpState(raw) !== "set") return false;
  if (mkpBrief(raw, now)) return true;
  if (mkpHome(raw, now) || mkpAway(raw, now) || mkpGuest(raw, now) || mkpCitizen(raw, now)) return false;
  return codeGiven(raw).length === 7;
}

export function mkpLength(raw: MkpValue): number | null {
  if (mkpState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function mkpEven(raw: MkpValue): boolean {
  const length = mkpLength(raw);
  return length !== null && length % 2 === 0;
}

export function mkpOdd(raw: MkpValue): boolean {
  const length = mkpLength(raw);
  return length !== null && length % 2 === 1;
}

export function mkpFirst(raw: MkpValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function mkpTail(raw: MkpValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function mkpCapital(raw: MkpValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function mkpSpace(raw: MkpValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function mkpVowel(raw: MkpValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function mkpDigit(raw: MkpValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function mkpLetter(raw: MkpValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function mkpMixed(raw: MkpValue): boolean {
  return mkpDigit(raw) && mkpLetter(raw);
}

export function mkpLower(raw: MkpValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function mkpUpper(raw: MkpValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function mkpStamp(raw: MkpValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function mkpCopy(raw: MkpValue): string {
  return codeGiven(raw);
}

export function mkpFamily(raw: MkpValue): string {
  if (mkpState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function mkpLanes(rows: readonly MkpRow[]): MkpLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = mkpLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly MkpRow[]): string {
  const lines = mkpLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly MkpRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = mkpHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly MkpRow[], mail: MkpLane): number {
  return rows.filter((row) => mkpLane(row.code) === mail).length;
}

export function mkpShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly MkpRow[]): string[] {
  return mkpLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: MkpRow, shape: MkpShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return mkpHome(row.code);
  if (shape === "vacant") return mkpAway(row.code);
  if (shape === "hold") return mkpGuest(row.code);
  if (shape === "guest") return mkpCitizen(row.code);
  if (shape === "join") return mkpJoin(row.code);
  if (shape === "route") return mkpRoute(row.code);
  if (shape === "brief") return mkpBrief(row.code);
  if (shape === "long") return mkpLong(row.code);
  if (shape === "stamp") return mkpStampMark(row.code);
  if (shape === "vowel") return mkpVowelLane(row.code);
  if (shape === "plain") return mkpPlain(row.code);
  if (shape === "open") return mkpOpen(row.code);
  if (shape === "soon") return mkpSoon(row.code);
  if (shape === "letter") return mkpLetter(row.code);
  if (shape === "mixed") return mkpMixed(row.code);
  if (shape === "upper") return mkpUpper(row.code);
  if (shape === "lower") return mkpLower(row.code);
  if (shape === "space") return mkpSpace(row.code);
  if (shape === "even") return mkpEven(row.code);
  if (shape === "odd") return mkpOdd(row.code);
  if (shape === "tail") return mkpTail(row.code);
  if (shape === "first") return mkpFirst(row.code);
  if (shape === "held") return mkpHeld(row.code);
  return mkpLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly MkpRow[],
  mail: string,
  hue: string,
  query: string,
  review: MkpReview,
  reviewed: readonly string[],
  shape: MkpShape,
): MkpRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (mkpState(row.code) === "") return false;
    const found = mkpLane(row.code);
    const hueName = mkpHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${mkpStamp(row.code)} ${mkpFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function mkpLanesCsv(rows: readonly MkpRow[]): string {
  const lines = ["lane,count"];
  for (const line of mkpLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function mkpRowsCsv(rows: readonly MkpRow[], reviewed: readonly string[]): string {
  const lines = ["name,canManageMethods,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(mkpCopy(row.code)),
        mkpStamp(row.code),
        csvCell(mkpFamily(row.code)),
        mkpLane(row.code),
        mkpHue(row.code),
        mkpLength(row.code) ?? "",
        mkpHome(row.code) ? "1" : "0",
        mkpAway(row.code) ? "1" : "0",
        mkpGuest(row.code) ? "1" : "0",
        mkpDesk(row.code) ? "1" : "0",
        mkpCitizen(row.code) ? "1" : "0",
        mkpJoin(row.code) ? "1" : "0",
        mkpRoute(row.code) ? "1" : "0",
        mkpBrief(row.code) ? "1" : "0",
        mkpEven(row.code) ? "1" : "0",
        mkpDigit(row.code) ? "1" : "0",
        mkpMixed(row.code) ? "1" : "0",
        mkpUpper(row.code) ? "1" : "0",
        mkpVowel(row.code) ? "1" : "0",
        mkpTail(row.code) ? "1" : "0",
        mkpHeld(row.code) ? "1" : "0",
        mkpSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
