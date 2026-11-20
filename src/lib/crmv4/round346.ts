/**
 * Foudroyante rules for a jumping-seconds train kept in this browser, and contact plates read lastContactAt already stored on the account.
 * Modes are whip, arbor, pinion, and bridge. Finishes are gilt, ivory, and graphite.
 * Beats are 2, 6, 10, or 14. Pins are 1, 4, or 8.
 * Whip and arbor are inner. Pinion and bridge are outer.
 * A known contact mark is CALL, MAIL, MEET, or NOTE. A plus joins two marks. A pipe marks a pause.
 * A brief contact is exactly ten characters. A timestamp starts with a digit. A long contact is twenty-four characters or longer and does not start with a digit. A vowel contact starts with a vowel.
 * A true contact reads as CALL. An empty contact reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_foudroyante (
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
 * CREATE TABLE crm_contact_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_contact_review (
 *   trader_id text primary key
 * );
 */
export const FDX_KEY = "crmv4-foudroyante";
export const FDX_VIEW_KEY = "crmv4-foudroyante-views";
export const FDX_DENSITY_KEY = "crmv4-foudroyante-density";
export const FDX_MODES = ["whip", "arbor", "pinion", "bridge"] as const;

export type FoudroyanteMode = (typeof FDX_MODES)[number];
export type FoudroyanteFilm = "blank" | "gilt" | "ivory" | "graphite";
export type FoudroyanteTray = "board" | "peg" | "coffer";
export type FoudroyanteDensity = "airy" | "close";
export type FoudroyanteSort = "piece" | "setter";

export type Foudroyante = {
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

export type FoudroyanteView = {
  id: string;
  name: string;
  tray: FoudroyanteTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type FoudroyanteCounts = {
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

export const ROUND346_FEATURES = [
  "foudroyante-save",
  "whip-notices",
  "foudroyante-modes",
  "foudroyante-search",
  "pin-sla",
  "whip-file",
  "latch-and-star",
  "inline-name",
  "foudroyante-filters",
  "saved-foudroyante-views",
  "foudroyante-density",
  "keeper-sort",
  "foudroyante-kpis",
  "whip-chart",
  "whip-timeline",
  "foudroyante-bulk",
  "foudroyante-csv",
  "foudroyante-keys",
  "foudroyante-audit",
  "fair-setter",
  "foudroyante-viewer",
  "suggest-whip",
  "overdue-whips",
  "contact-plate",
  "contact-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [2, 6, 10, 14] as const;
const LOCK_CYCLE = [1, 4, 8] as const;
const INNER = new Set(["whip", "arbor"]);
const OUTER = new Set(["pinion", "bridge"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["CALL", "MAIL", "MEET", "NOTE"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FoudroyanteTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<FoudroyanteFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<FoudroyanteFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[fd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Foudroyante, tray: FoudroyanteTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return FDX_MODES.indexOf(piece as FoudroyanteMode);
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

export function foudroyanteMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (FDX_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function foudroyanteHour(raw: unknown): 2 | 6 | 10 | 14 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10" && text !== "14") return null;
  return Number(text) as 2 | 6 | 10 | 14;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function foudroyanteHammer(raw: unknown): 1 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "8") return null;
  return Number(text) as 1 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function foudroyanteFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function foudroyanteInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function foudroyanteOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function foudroyanteBand(piece: unknown): string {
  const text = foudroyanteMode(piece);
  if (!text) return "";
  if (text === "whip") return "lash";
  if (text === "arbor") return "shaft";
  if (text === "pinion") return "leaf";
  return "span";
}

/** Signed distance from one piece to another along the oscillator. */
export function foudroyanteGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(foudroyanteMode(from));
  const right = pieceIndex(foudroyanteMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(foudroyanteFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return foudroyanteHammer(lock) === 4;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return foudroyanteHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return foudroyanteMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = foudroyanteHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = foudroyanteFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = foudroyanteHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveFoudroyanteFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Foudroyante[]): string {
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
export function suggestHour(cards: readonly Foudroyante[], hour: number): 2 | 6 | 10 | 14 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 6 | 10 | 14 = 2;
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
  if (hour < 6) return 2;
  if (hour < 12) return 6;
  if (hour < 18) return 10;
  return 14;
}

export function suggestMode(hour: number): FoudroyanteMode {
  return hour < 12 ? "whip" : "bridge";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Foudroyante[], roster: string): string {
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

export function readFoudroyantes(raw: unknown): Foudroyante[] {
  if (!Array.isArray(raw)) return [];
  const out: Foudroyante[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Foudroyante>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: foudroyanteMode(row.piece),
      drop: foudroyanteHour(row.drop),
      film: foudroyanteFilm(row.film),
      lock: foudroyanteHammer(row.lock) ?? 1,
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

export function addFoudroyante(
  cards: readonly Foudroyante[],
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
): Foudroyante[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFoudroyantes([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: foudroyanteMode(card.piece),
      drop: foudroyanteHour(card.drop),
      film: foudroyanteFilm(card.film),
      lock: foudroyanteHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Foudroyante[], id: string, edit: (card: Foudroyante) => Foudroyante): Foudroyante[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFoudroyante(cards: readonly Foudroyante[], id: string, title: string): Foudroyante[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFoudroyanteNote(cards: readonly Foudroyante[], id: string, note: string): Foudroyante[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(foudroyanteFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setFoudroyanteFilm(cards: readonly Foudroyante[], id: string, film: string): Foudroyante[] {
  const next = foudroyanteFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setFoudroyanteRaised(cards: readonly Foudroyante[], id: string, raised: boolean): Foudroyante[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setFoudroyantePin(cards: readonly Foudroyante[], id: string, pinned: boolean): Foudroyante[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setFoudroyanteCoffer(cards: readonly Foudroyante[], id: string, coffered: boolean): Foudroyante[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setFoudroyanteStar(cards: readonly Foudroyante[], id: string, starred: boolean): Foudroyante[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addFoudroyanteTag(cards: readonly Foudroyante[], id: string, tag: string): Foudroyante[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 2 | 6 | 10 | 14 {
  if (drop === null) return dir > 0 ? 2 : 14;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 1 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setFoudroyanteFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinFoudroyanteFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return setFoudroyantePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starFoudroyanteFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  return setFoudroyanteStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Foudroyante[], id: string): Foudroyante[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFoudroyanteFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Foudroyante[], ids: readonly string[], edit: (card: Foudroyante) => Foudroyante): Foudroyante[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFoudroyanteGraphite(cards: readonly Foudroyante[], ids: readonly string[]): Foudroyante[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkFoudroyanteRaise(cards: readonly Foudroyante[], ids: readonly string[]): Foudroyante[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkFoudroyanteCoffer(cards: readonly Foudroyante[], ids: readonly string[]): Foudroyante[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkFoudroyanteTag(cards: readonly Foudroyante[], ids: readonly string[]): Foudroyante[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readFoudroyanteViews(raw: unknown): FoudroyanteView[] {
  if (!Array.isArray(raw)) return [];
  const out: FoudroyanteView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FoudroyanteView>;
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

export function addFoudroyanteView(views: readonly FoudroyanteView[], view: FoudroyanteView): FoudroyanteView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFoudroyanteViews([...views, { ...view, id, name }]);
}

export function dropFoudroyanteView(views: readonly FoudroyanteView[], id: string): FoudroyanteView[] {
  return views.filter((view) => view.id !== id);
}

export function foudroyanteDensity(raw: unknown): FoudroyanteDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortFoudroyantes(cards: readonly Foudroyante[], sort: FoudroyanteSort): Foudroyante[] {
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

export function visibleFoudroyantes(
  cards: readonly Foudroyante[],
  tray: FoudroyanteTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Foudroyante[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : foudroyanteFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !foudroyanteInner(card.piece)) return false;
    if (wantLimb === "outer" && !foudroyanteOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueFoudroyante(card: Foudroyante): boolean {
  return foudroyanteOuter(card.piece) && card.lock === 1 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleFoudroyante(card: Foudroyante): boolean {
  return !card.film && card.drop === 2 && card.lock === 1 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskFoudroyante(card: Foudroyante): boolean {
  return card.film === "GILT" && card.drop === 14 && card.lock === 8 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingFoudroyante(card: Foudroyante): boolean {
  return card.piece === "bridge" && card.film === "IVORY" && card.drop === 6;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateFoudroyante(card: Foudroyante, station: string): boolean {
  return card.piece === "whip" && foudroyanteMode(station) === "bridge" && !card.raised;
}

export function foudroyanteCounts(cards: readonly Foudroyante[], shown: readonly Foudroyante[], station: string): FoudroyanteCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => foudroyanteInner(card.piece)).length,
    outer: cards.filter((card) => foudroyanteOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 14).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleFoudroyante).length,
    brisk: cards.filter(briskFoudroyante).length,
    resting: cards.filter(restingFoudroyante).length,
    overdue: cards.filter(overdueFoudroyante).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateFoudroyante(card, station)).length,
  };
}

export function foudroyanteBars(cards: readonly Foudroyante[]): { piece: string; count: number }[] {
  return FDX_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function foudroyanteTimeline(cards: readonly Foudroyante[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function foudroyanteKeepers(cards: readonly Foudroyante[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Foudroyante[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of foudroyanteKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFoudroyantes(cards: readonly Foudroyante[]): string[] {
  return cards.filter(overdueFoudroyante).map((card) => card.title);
}

export function foudroyanteCopy(card: Foudroyante): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function foudroyanteCsv(cards: readonly Foudroyante[], station: string): string {
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
        foudroyanteOuter(card.piece) ? "1" : "0",
        lateFoudroyante(card, station) ? "1" : "0",
        idleFoudroyante(card) ? "1" : "0",
        briskFoudroyante(card) ? "1" : "0",
        restingFoudroyante(card) ? "1" : "0",
        overdueFoudroyante(card) ? "1" : "0",
        foudroyanteInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        foudroyanteBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const CTX_KEY = "crmv4-contact-hide";
export const CTX_REVIEW_KEY = "crmv4-contact-review";

export type ContactLane = "" | "call" | "mail" | "meet" | "note" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type ContactHue = "" | "ivory" | "graphite" | "champagne";
export type ContactState = "" | "clear" | "set";
export type ContactReview = "all" | "reviewed" | "fresh";
export type ContactShape =
  | "all"
  | "call"
  | "mail"
  | "meet"
  | "note"
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

export type ContactValue = string | { lastContactAt?: unknown; [key: string]: unknown } | null | undefined;
export type ContactRow = { id: string; label: string; code: ContactValue };
export type ContactLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["call", "mail", "meet", "note", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: ContactValue): { lastContactAt?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ContactValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ContactValue): string {
  const row = codeRecord(raw);
  if (row && !("lastContactAt" in row)) return "";
  const value = row ? row.lastContactAt : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CALL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: ContactValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastContactAt" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function contactState(raw: ContactValue): ContactState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known contact is CALL, MAIL, MEET, or NOTE. An ampersand joins two contacts. A comma marks a pause. A brief contact is exactly four characters. A long contact is twelve characters or longer. An index starts with a digit. A vowel contact starts with a vowel. */
export function contactLane(raw: ContactValue): ContactLane {
  if (contactState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "CALL") return "call";
    if (upper === "MAIL") return "mail";
    if (upper === "MEET") return "meet";
    return "note";
  }
  if (text === "NONE") return "plain";
  if (text.includes("+")) return "join";
  if (text.includes("|")) return "gap";
  if (text.length === 10) return "brief";
  if (/^[0-9]/.test(text)) return "mark";
  if (text.length >= 24) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function contactHue(raw: ContactValue): ContactHue {
  const mail = contactLane(raw);
  if (!mail) return "";
  if (mail === "call" || mail === "meet") return "champagne";
  if (mail === "mail" || mail === "note" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function contactHome(raw: ContactValue): boolean {
  return contactLane(raw) === "call";
}

export function contactAway(raw: ContactValue): boolean {
  return contactLane(raw) === "mail";
}

export function contactGuest(raw: ContactValue): boolean {
  return contactLane(raw) === "meet";
}

export function contactCitizen(raw: ContactValue): boolean {
  return contactLane(raw) === "note";
}

export function contactJoin(raw: ContactValue): boolean {
  return contactLane(raw) === "join";
}

export function contactGap(raw: ContactValue): boolean {
  return contactLane(raw) === "gap";
}

export function contactBrief(raw: ContactValue): boolean {
  return contactLane(raw) === "brief";
}

export function contactLong(raw: ContactValue): boolean {
  return contactLane(raw) === "long";
}

export function contactMark(raw: ContactValue): boolean {
  return contactLane(raw) === "mark";
}

export function contactVowelLane(raw: ContactValue): boolean {
  return contactLane(raw) === "vowel";
}

export function contactPlain(raw: ContactValue): boolean {
  return contactLane(raw) === "plain";
}

export function contactOpen(raw: ContactValue): boolean {
  return contactState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function contactHeld(raw: ContactValue): boolean {
  const mail = contactLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function contactSoon(raw: ContactValue): boolean {
  if (contactState(raw) !== "set") return false;
  if (contactBrief(raw)) return true;
  if (contactHome(raw) || contactAway(raw) || contactGuest(raw) || contactCitizen(raw)) return false;
  return codeGiven(raw).length === 8;
}

export function contactLength(raw: ContactValue): number | null {
  if (contactState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function contactEven(raw: ContactValue): boolean {
  const length = contactLength(raw);
  return length !== null && length % 2 === 0;
}

export function contactOdd(raw: ContactValue): boolean {
  const length = contactLength(raw);
  return length !== null && length % 2 === 1;
}

export function contactFirst(raw: ContactValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function contactTail(raw: ContactValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function contactCapital(raw: ContactValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function contactSpace(raw: ContactValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function contactVowel(raw: ContactValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function contactDigit(raw: ContactValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function contactLetter(raw: ContactValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function contactMixed(raw: ContactValue): boolean {
  return contactDigit(raw) && contactLetter(raw);
}

export function contactLower(raw: ContactValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function contactUpper(raw: ContactValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function contactStamp(raw: ContactValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function contactCopy(raw: ContactValue): string {
  return codeGiven(raw);
}

export function contactFamily(raw: ContactValue): string {
  if (contactState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function contactLanes(rows: readonly ContactRow[]): ContactLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = contactLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingContact(rows: readonly ContactRow[]): string {
  const lines = contactLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingContactHue(rows: readonly ContactRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = contactHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneContactCount(rows: readonly ContactRow[], mail: ContactLane): number {
  return rows.filter((row) => contactLane(row.code) === mail).length;
}

export function contactShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentContactLanes(rows: readonly ContactRow[]): string[] {
  return contactLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenContact(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedContact(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleContact(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleContactReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkContactReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleContactLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: ContactRow, shape: ContactShape): boolean {
  if (shape === "all") return true;
  if (shape === "call") return contactHome(row.code);
  if (shape === "mail") return contactAway(row.code);
  if (shape === "meet") return contactGuest(row.code);
  if (shape === "note") return contactCitizen(row.code);
  if (shape === "join") return contactJoin(row.code);
  if (shape === "gap") return contactGap(row.code);
  if (shape === "brief") return contactBrief(row.code);
  if (shape === "long") return contactLong(row.code);
  if (shape === "mark") return contactMark(row.code);
  if (shape === "vowel") return contactVowelLane(row.code);
  if (shape === "plain") return contactPlain(row.code);
  if (shape === "open") return contactOpen(row.code);
  if (shape === "soon") return contactSoon(row.code);
  if (shape === "letter") return contactLetter(row.code);
  if (shape === "mixed") return contactMixed(row.code);
  if (shape === "upper") return contactUpper(row.code);
  if (shape === "lower") return contactLower(row.code);
  if (shape === "space") return contactSpace(row.code);
  if (shape === "even") return contactEven(row.code);
  if (shape === "odd") return contactOdd(row.code);
  if (shape === "tail") return contactTail(row.code);
  if (shape === "first") return contactFirst(row.code);
  if (shape === "held") return contactHeld(row.code);
  return contactLane(row.code) === shape;
}

export function visibleContact(
  rows: readonly ContactRow[],
  mail: string,
  hue: string,
  query: string,
  review: ContactReview,
  reviewed: readonly string[],
  shape: ContactShape,
): ContactRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (contactState(row.code) === "") return false;
    const found = contactLane(row.code);
    const hueName = contactHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${contactStamp(row.code)} ${contactFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function contactLanesCsv(rows: readonly ContactRow[]): string {
  const lines = ["mail,count"];
  for (const line of contactLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function contactRowsCsv(rows: readonly ContactRow[], reviewed: readonly string[]): string {
  const lines = ["name,lastContactAt,stamp,family,mail,hue,length,laneMark,inbox,desk,post,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(contactCopy(row.code)),
        contactStamp(row.code),
        csvCell(contactFamily(row.code)),
        contactLane(row.code),
        contactHue(row.code),
        contactLength(row.code) ?? "",
        contactHome(row.code) ? "1" : "0",
        contactAway(row.code) ? "1" : "0",
        contactGuest(row.code) ? "1" : "0",
        contactCitizen(row.code) ? "1" : "0",
        contactJoin(row.code) ? "1" : "0",
        contactGap(row.code) ? "1" : "0",
        contactBrief(row.code) ? "1" : "0",
        contactEven(row.code) ? "1" : "0",
        contactDigit(row.code) ? "1" : "0",
        contactMixed(row.code) ? "1" : "0",
        contactUpper(row.code) ? "1" : "0",
        contactVowel(row.code) ? "1" : "0",
        contactTail(row.code) ? "1" : "0",
        contactHeld(row.code) ? "1" : "0",
        contactSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
