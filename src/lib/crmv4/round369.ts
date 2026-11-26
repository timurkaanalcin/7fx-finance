/**
 * Niello inlay rules for a black cell kept in this browser,
 * and document review plates read the review note already stored on the document.
 * Cells are well, wall, wire, and lip. Fires are soot, ivory, and graphite.
 * Fires are 4, 8, 16, or 32. Counts are 2, 4, or 8.
 * Well and wall are the field. Wire and lip are the fence.
 * Approved, clear, file, house, and YES are cleared. Web and form sit the desk.
 * Pending, wait, and hold wait. Rejected, lost, and void are returned.
 * Twin and pair are joined. None, no, and blank stay plain.
 * An ampersand joins two notes. A slash that is not a time marks a scoped note.
 * A time today is cleared. Within two days is the desk. Within seven days waits. Older is returned.
 * A brief note is exactly five characters. A digit note starts with a digit and is not a time.
 * A long note is twelve characters or longer and does not start with a digit. A vowel note starts with a vowel.
 * The words clear and file are cleared. Quiet or closed is shut.
 * A true note reads as CLEAR. A false note reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved note.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
CREATE TABLE crm_niello_inlay (
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
 * CREATE TABLE crm_drv_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_drv_review (
 *   trader_id text primary key
 * );
 */


export const NIL_KEY = "crmv4-niello-369";
export const NIL_VIEW_KEY = "crmv4-niello-views-369";
export const NIL_DENSITY_KEY = "crmv4-niello-density-369";
export const NIL_MODES = ["well", "wall", "wire", "lip"] as const;

export type NielloMode = (typeof NIL_MODES)[number];
export type NielloFilm = "blank" | "soot" | "ivory" | "graphite";
export type NielloTray = "board" | "peg" | "coffer";
export type NielloDensity = "airy" | "close";
export type NielloSort = "piece" | "setter";

export type Niello = {
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

export type NielloView = {
  id: string;
  name: string;
  tray: NielloTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type NielloCounts = {
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

export const ROUND369_FEATURES = [
  "niello-save",
  "inlay-reminders",
  "niello-modes",
  "niello-search",
  "inlay-fire-sla",
  "inlay-archive",
  "niello-count-star",
  "niello-inline-title",
  "niello-filters",
  "saved-niello-views",
  "niello-density",
  "inlay-focus",
  "niello-kpis",
  "inlay-chart",
  "inlay-timeline",
  "niello-bulk",
  "niello-csv",
  "niello-keys",
  "niello-audit",
  "fair-firer",
  "niello-viewer",
  "suggest-well",
  "overdue-fence",
  "document-review-plate",
  "document-review-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["soot", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 16, 32] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["well", "wall"]);
const OUTER = new Set(["wire", "lip"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 18;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): NielloTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<NielloFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<NielloFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ni]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Niello, tray: NielloTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return NIL_MODES.indexOf(piece as NielloMode);
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

export function nielloMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (NIL_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function nielloHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A weave count is 4, 7, or 11. Anything else stays blank. */
export function nielloHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function nielloFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function nielloInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function nielloOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Warp is the reed. Weft is the shuttle. Selvage is the edge. Fringe is the tassel. */
export function nielloBand(piece: unknown): string {
  const text = nielloMode(piece);
  if (!text) return "";
  if (text === "well") return "field";
  if (text === "wall") return "bank";
  if (text === "wire") return "fence";
  return "lip";
}

/** Signed distance from one mode to another along the stripe. */
export function nielloGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(nielloMode(from));
  const right = pieceIndex(nielloMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(nielloFilm(film));
}

/** A pair count is 7. Four and eleven are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return nielloHammer(lock) === 4;
}

/** A full count is 11. */
export function fullHammer(lock: unknown): boolean {
  return nielloHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return nielloMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = nielloHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = nielloFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = nielloHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveNielloFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Niello[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["IVORY", "SOOT", "GRAPHITE"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest twenty. Later, suggest forty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Niello[], hour: number): 4 | 8 | 16 | 32 {
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
  if (hour < 8) return 8;
  if (hour < 16) return 16;
  return 32;
}

export function suggestMode(hour: number): NielloMode {
  return hour < 10 ? "well" : "lip";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Niello[], roster: string): string {
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

export function readNielloCards(raw: unknown): Niello[] {
  if (!Array.isArray(raw)) return [];
  const out: Niello[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Niello>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: nielloMode(row.piece),
      drop: nielloHour(row.drop),
      film: nielloFilm(row.film),
      lock: nielloHammer(row.lock) ?? 2,
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

export function addNiello(
  cards: readonly Niello[],
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
): Niello[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readNielloCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: nielloMode(card.piece),
      drop: nielloHour(card.drop),
      film: nielloFilm(card.film),
      lock: nielloHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Niello[], id: string, edit: (card: Niello) => Niello): Niello[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editNiello(cards: readonly Niello[], id: string, title: string): Niello[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editNielloNote(cards: readonly Niello[], id: string, note: string): Niello[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "SOOT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(nielloFilm(film));
  return order[(index + 1) % order.length] || "SOOT";
}

export function setNielloFilm(cards: readonly Niello[], id: string, film: string): Niello[] {
  const next = nielloFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setNielloRaised(cards: readonly Niello[], id: string, raised: boolean): Niello[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setNielloPin(cards: readonly Niello[], id: string, pinned: boolean): Niello[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setNielloCoffer(cards: readonly Niello[], id: string, coffered: boolean): Niello[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setNielloStar(cards: readonly Niello[], id: string, starred: boolean): Niello[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addNielloTag(cards: readonly Niello[], id: string, tag: string): Niello[] {
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

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Niello[], id: string): Niello[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Niello[], id: string): Niello[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Niello[], id: string): Niello[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Niello[], id: string): Niello[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setNielloFocused(cards: readonly Niello[], id: string): Niello[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinNielloFocused(cards: readonly Niello[], id: string): Niello[] {
  return setNielloPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starNielloFocused(cards: readonly Niello[], id: string): Niello[] {
  return setNielloStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Niello[], id: string): Niello[] {
  const card = cards.find((item) => item.id === id);
  return card ? setNielloFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Niello[], ids: readonly string[], edit: (card: Niello) => Niello): Niello[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkNielloGraphite(cards: readonly Niello[], ids: readonly string[]): Niello[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkNielloRaise(cards: readonly Niello[], ids: readonly string[]): Niello[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkNielloCoffer(cards: readonly Niello[], ids: readonly string[]): Niello[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkNielloTag(cards: readonly Niello[], ids: readonly string[]): Niello[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "n"]), audit: "tag" }));
}

export function readNielloViews(raw: unknown): NielloView[] {
  if (!Array.isArray(raw)) return [];
  const out: NielloView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NielloView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeFinish(row.film, ["SOOT", "IVORY", "GRAPHITE"]),
      piece: activeMode(row.piece),
      drop: activeHour(row.drop),
      lock: activeHammer(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addNielloView(views: readonly NielloView[], view: NielloView): NielloView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readNielloViews([...views, { ...view, id, name }]);
}

export function dropNielloView(views: readonly NielloView[], id: string): NielloView[] {
  return views.filter((view) => view.id !== id);
}

export function nielloDensity(raw: unknown): NielloDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortNielloCards(cards: readonly Niello[], sort: NielloSort): Niello[] {
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

export function visibleNielloCards(
  cards: readonly Niello[],
  tray: NielloTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Niello[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : nielloFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !nielloInner(card.piece)) return false;
    if (wantLimb === "outer" && !nielloOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An edge stripe on count four, still not raised and not in the drawer, is overdue. */
export function overdueNiello(card: Niello): boolean {
  return nielloOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}


/** No finish, pitch five, count four, and still on the bench. */
export function idleNiello(card: Niello): boolean {
  return !card.film && card.drop === 4 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, pitch forty, and a full count, still out of the drawer. */
export function briskNiello(card: Niello): boolean {
  return card.film === "SOOT" && card.drop === 32 && card.lock === 8 && !card.coffered;
}


/** Fringe, ivory, and pitch ten. */
export function restingNiello(card: Niello): boolean {
  return card.piece === "lip" && card.film === "IVORY" && card.drop === 8;
}


/** A boss is late when the station is already on the rim. */
export function lateNiello(card: Niello, station: string): boolean {
  return card.piece === "well" && nielloMode(station) === "lip" && !card.raised;
}


export function nielloCounts(cards: readonly Niello[], shown: readonly Niello[], station: string): NielloCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => nielloInner(card.piece)).length,
    outer: cards.filter((card) => nielloOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleNiello).length,
    brisk: cards.filter(briskNiello).length,
    resting: cards.filter(restingNiello).length,
    overdue: cards.filter(overdueNiello).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateNiello(card, station)).length,
  };
}

export function nielloBars(cards: readonly Niello[]): { piece: string; count: number }[] {
  return NIL_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function nielloTimeline(cards: readonly Niello[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function nielloKeepers(cards: readonly Niello[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Niello[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of nielloKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderNielloCards(cards: readonly Niello[]): string[] {
  return cards.filter(overdueNiello).map((card) => card.title);
}

export function nielloCopy(card: Niello): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function nielloCsv(cards: readonly Niello[], station: string): string {
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
        nielloOuter(card.piece) ? "1" : "0",
        lateNiello(card, station) ? "1" : "0",
        idleNiello(card) ? "1" : "0",
        briskNiello(card) ? "1" : "0",
        restingNiello(card) ? "1" : "0",
        overdueNiello(card) ? "1" : "0",
        nielloInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        nielloBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const DRV_KEY = "crmv4-drv-hide-369";
export const DRV_REVIEW_KEY = "crmv4-drv-review-369";

export type DrvLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type DrvHue = "" | "ivory" | "graphite" | "champagne";
export type DrvState = "" | "clear" | "set";
export type DrvReview = "all" | "reviewed" | "fresh";
export type DrvShape =
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

export type DrvValue = string | { reviewNote?: unknown; [key: string]: unknown } | null | undefined;
export type DrvRow = { id: string; label: string; code: DrvValue; userId?: string };
export type DrvLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: DrvValue): { reviewNote?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: DrvValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: DrvValue): string {
  const row = codeRecord(raw);
  if (row && !("reviewNote" in row)) return "";
  const value = row ? row.reviewNote : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CLEAR";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: DrvValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("reviewNote" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function drvState(raw: DrvValue): DrvState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["CLEAR", "FILE", "HOUSE", "YES", "APPROVED"]);
const DESK_TITLES = new Set(["WEB", "FORM"]);
const HOLD_TITLES = new Set(["WAIT", "HOLD", "PENDING"]);
const GUEST_TITLES = new Set(["LOST", "VOID", "REJECTED"]);
const JOIN_TITLES = new Set(["TWIN", "PAIR"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function drvLane(raw: DrvValue, now = Date.now()): DrvLane {
  if (drvState(raw) !== "set") return "";
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
    if (age < 2 * day) return "desk";
    if (age < 7 * day) return "hold";
    return "guest";
  }
  if (text.includes("/")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (/\bclear\b|\bfile\b/i.test(text)) return "hall";
  if (text.length >= 12 && text.includes(":")) return "route";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function drvHue(raw: DrvValue, now = Date.now()): DrvHue {
  const mail = drvLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function drvHome(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "hall";
}

export function drvAway(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "vacant";
}

export function drvGuest(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "hold";
}

export function drvCitizen(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "guest";
}

export function drvDesk(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "desk";
}

export function drvJoin(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "join";
}

export function drvRoute(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "route";
}

export function drvBrief(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "brief";
}

export function drvLong(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "long";
}

export function drvStampMark(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "stamp";
}

export function drvVowelLane(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "vowel";
}

export function drvPlain(raw: DrvValue, now = Date.now()): boolean {
  return drvLane(raw, now) === "plain";
}

export function drvOpen(raw: DrvValue): boolean {
  return drvState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function drvHeld(raw: DrvValue): boolean {
  const mail = drvLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function drvSoon(raw: DrvValue, now = Date.now()): boolean {
  if (drvState(raw) !== "set") return false;
  if (drvBrief(raw, now)) return true;
  if (drvHome(raw, now) || drvAway(raw, now) || drvGuest(raw, now) || drvCitizen(raw, now)) return false;
  return codeGiven(raw).length === 7;
}

export function drvLength(raw: DrvValue): number | null {
  if (drvState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function drvEven(raw: DrvValue): boolean {
  const length = drvLength(raw);
  return length !== null && length % 2 === 0;
}

export function drvOdd(raw: DrvValue): boolean {
  const length = drvLength(raw);
  return length !== null && length % 2 === 1;
}

export function drvFirst(raw: DrvValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function drvTail(raw: DrvValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function drvCapital(raw: DrvValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function drvSpace(raw: DrvValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function drvVowel(raw: DrvValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function drvDigit(raw: DrvValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function drvLetter(raw: DrvValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function drvMixed(raw: DrvValue): boolean {
  return drvDigit(raw) && drvLetter(raw);
}

export function drvLower(raw: DrvValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function drvUpper(raw: DrvValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function drvStamp(raw: DrvValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function drvCopy(raw: DrvValue): string {
  return codeGiven(raw);
}

export function drvFamily(raw: DrvValue): string {
  if (drvState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function drvLanes(rows: readonly DrvRow[]): DrvLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = drvLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly DrvRow[]): string {
  const lines = drvLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly DrvRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = drvHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly DrvRow[], mail: DrvLane): number {
  return rows.filter((row) => drvLane(row.code) === mail).length;
}

export function drvShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly DrvRow[]): string[] {
  return drvLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: DrvRow, shape: DrvShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return drvHome(row.code);
  if (shape === "vacant") return drvAway(row.code);
  if (shape === "hold") return drvGuest(row.code);
  if (shape === "guest") return drvCitizen(row.code);
  if (shape === "join") return drvJoin(row.code);
  if (shape === "route") return drvRoute(row.code);
  if (shape === "brief") return drvBrief(row.code);
  if (shape === "long") return drvLong(row.code);
  if (shape === "stamp") return drvStampMark(row.code);
  if (shape === "vowel") return drvVowelLane(row.code);
  if (shape === "plain") return drvPlain(row.code);
  if (shape === "open") return drvOpen(row.code);
  if (shape === "soon") return drvSoon(row.code);
  if (shape === "letter") return drvLetter(row.code);
  if (shape === "mixed") return drvMixed(row.code);
  if (shape === "upper") return drvUpper(row.code);
  if (shape === "lower") return drvLower(row.code);
  if (shape === "space") return drvSpace(row.code);
  if (shape === "even") return drvEven(row.code);
  if (shape === "odd") return drvOdd(row.code);
  if (shape === "tail") return drvTail(row.code);
  if (shape === "first") return drvFirst(row.code);
  if (shape === "held") return drvHeld(row.code);
  return drvLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly DrvRow[],
  mail: string,
  hue: string,
  query: string,
  review: DrvReview,
  reviewed: readonly string[],
  shape: DrvShape,
): DrvRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (drvState(row.code) === "") return false;
    const found = drvLane(row.code);
    const hueName = drvHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${drvStamp(row.code)} ${drvFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function drvLanesCsv(rows: readonly DrvRow[]): string {
  const lines = ["lane,count"];
  for (const line of drvLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function drvRowsCsv(rows: readonly DrvRow[], reviewed: readonly string[]): string {
  const lines = ["name,reviewNote,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(drvCopy(row.code)),
        drvStamp(row.code),
        csvCell(drvFamily(row.code)),
        drvLane(row.code),
        drvHue(row.code),
        drvLength(row.code) ?? "",
        drvHome(row.code) ? "1" : "0",
        drvAway(row.code) ? "1" : "0",
        drvGuest(row.code) ? "1" : "0",
        drvDesk(row.code) ? "1" : "0",
        drvCitizen(row.code) ? "1" : "0",
        drvJoin(row.code) ? "1" : "0",
        drvRoute(row.code) ? "1" : "0",
        drvBrief(row.code) ? "1" : "0",
        drvEven(row.code) ? "1" : "0",
        drvDigit(row.code) ? "1" : "0",
        drvMixed(row.code) ? "1" : "0",
        drvUpper(row.code) ? "1" : "0",
        drvVowel(row.code) ? "1" : "0",
        drvTail(row.code) ? "1" : "0",
        drvHeld(row.code) ? "1" : "0",
        drvSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
