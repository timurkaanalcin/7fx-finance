/**
 * Tapisserie weave rules for a woven stripe kept in this browser,
 * and affiliate plates read affiliateA already stored on the account.
 * Stripes are warp, weft, selvage, and fringe. Finishes are gilt, ivory, and graphite.
 * Pitches are 5, 10, 20, or 40. Counts are 4, 7, or 11.
 * Warp and weft are cloth. Selvage and fringe are the edge.
 * Direct, house, own, and YES are house codes. IB and intro sit the desk.
 * Pause and hold are on hold. Dead and void are guests.
 * Pair and split are joined. None, no, and blank stay plain.
 * A plus joins two codes. A colon that is not a time marks a scoped code.
 * A time today is a house code. Within two days is the desk. Within seven days is hold. Older is a guest.
 * A brief code is exactly five characters. A digit code starts with a digit and is not a time.
 * A long code is twelve characters or longer and does not start with a digit. A vowel code starts with a vowel.
 * The words direct and house are house codes. Silent or dormant is shut.
 * A true code reads as DIRECT. A false code reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved code.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_tapisserie_weave (
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
 * CREATE TABLE crm_afa_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_afa_review (
 *   trader_id text primary key
 * );
 */


export const TPS_KEY = "crmv4-tapisserie-367";
export const TPS_VIEW_KEY = "crmv4-tapisserie-views-367";
export const TPS_DENSITY_KEY = "crmv4-tapisserie-density-367";
export const TPS_MODES = ["warp", "weft", "selvage", "fringe"] as const;

export type TapisserieMode = (typeof TPS_MODES)[number];
export type TapisserieFilm = "blank" | "gilt" | "ivory" | "graphite";
export type TapisserieTray = "board" | "peg" | "coffer";
export type TapisserieDensity = "airy" | "close";
export type TapisserieSort = "piece" | "setter";

export type Tapisserie = {
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

export type TapisserieView = {
  id: string;
  name: string;
  tray: TapisserieTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type TapisserieCounts = {
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

export const ROUND367_FEATURES = [
  "tapisserie-save",
  "fringe-reminders",
  "tapisserie-modes",
  "tapisserie-search",
  "tapisserie-pitch-sla",
  "fringe-archive",
  "tapisserie-count-star",
  "tapisserie-inline-title",
  "tapisserie-filters",
  "saved-tapisserie-views",
  "tapisserie-density",
  "fringe-focus",
  "tapisserie-kpis",
  "fringe-chart",
  "fringe-timeline",
  "tapisserie-bulk",
  "tapisserie-csv",
  "tapisserie-keys",
  "tapisserie-audit",
  "fair-loom",
  "tapisserie-viewer",
  "suggest-fringe",
  "overdue-fringe",
  "affiliate-a-plate",
  "affiliate-a-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 10, 20, 40] as const;
const LOCK_CYCLE = [4, 7, 11] as const;
const INNER = new Set(["warp", "weft"]);
const OUTER = new Set(["selvage", "fringe"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 18;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TapisserieTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<TapisserieFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<TapisserieFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[st]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Tapisserie, tray: TapisserieTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return TPS_MODES.indexOf(piece as TapisserieMode);
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

export function tapisserieMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TPS_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function tapisserieHour(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A weave count is 4, 7, or 11. Anything else stays blank. */
export function tapisserieHammer(raw: unknown): 4 | 7 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "7" && text !== "11") return null;
  return Number(text) as 4 | 7 | 11;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function tapisserieFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function tapisserieInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function tapisserieOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Warp is the reed. Weft is the shuttle. Selvage is the edge. Fringe is the tassel. */
export function tapisserieBand(piece: unknown): string {
  const text = tapisserieMode(piece);
  if (!text) return "";
  if (text === "warp") return "reed";
  if (text === "weft") return "shuttle";
  if (text === "selvage") return "edge";
  return "tassel";
}

/** Signed distance from one mode to another along the stripe. */
export function tapisserieGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(tapisserieMode(from));
  const right = pieceIndex(tapisserieMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(tapisserieFilm(film));
}

/** A pair count is 7. Four and eleven are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return tapisserieHammer(lock) === 7;
}

/** A full count is 11. */
export function fullHammer(lock: unknown): boolean {
  return tapisserieHammer(lock) === 11;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return tapisserieMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = tapisserieHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = tapisserieFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = tapisserieHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveTapisserieFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Tapisserie[]): string {
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

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest twenty. Later, suggest forty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Tapisserie[], hour: number): 5 | 10 | 20 | 40 {
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

export function suggestMode(hour: number): TapisserieMode {
  return hour < 8 ? "warp" : "fringe";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Tapisserie[], roster: string): string {
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

export function readTapisserieCards(raw: unknown): Tapisserie[] {
  if (!Array.isArray(raw)) return [];
  const out: Tapisserie[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tapisserie>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: tapisserieMode(row.piece),
      drop: tapisserieHour(row.drop),
      film: tapisserieFilm(row.film),
      lock: tapisserieHammer(row.lock) ?? 4,
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

export function addTapisserie(
  cards: readonly Tapisserie[],
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
): Tapisserie[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTapisserieCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: tapisserieMode(card.piece),
      drop: tapisserieHour(card.drop),
      film: tapisserieFilm(card.film),
      lock: tapisserieHammer(card.lock) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Tapisserie[], id: string, edit: (card: Tapisserie) => Tapisserie): Tapisserie[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTapisserie(cards: readonly Tapisserie[], id: string, title: string): Tapisserie[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTapisserieNote(cards: readonly Tapisserie[], id: string, note: string): Tapisserie[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(tapisserieFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setTapisserieFilm(cards: readonly Tapisserie[], id: string, film: string): Tapisserie[] {
  const next = tapisserieFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setTapisserieRaised(cards: readonly Tapisserie[], id: string, raised: boolean): Tapisserie[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setTapisseriePin(cards: readonly Tapisserie[], id: string, pinned: boolean): Tapisserie[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setTapisserieCoffer(cards: readonly Tapisserie[], id: string, coffered: boolean): Tapisserie[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setTapisserieStar(cards: readonly Tapisserie[], id: string, starred: boolean): Tapisserie[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addTapisserieTag(cards: readonly Tapisserie[], id: string, tag: string): Tapisserie[] {
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

function stepLock(lock: number, dir: 1 | -1): 4 | 7 | 11 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setTapisserieFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinTapisserieFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return setTapisseriePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starTapisserieFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  return setTapisserieStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Tapisserie[], id: string): Tapisserie[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTapisserieFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Tapisserie[], ids: readonly string[], edit: (card: Tapisserie) => Tapisserie): Tapisserie[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTapisserieGraphite(cards: readonly Tapisserie[], ids: readonly string[]): Tapisserie[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkTapisserieRaise(cards: readonly Tapisserie[], ids: readonly string[]): Tapisserie[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkTapisserieCoffer(cards: readonly Tapisserie[], ids: readonly string[]): Tapisserie[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkTapisserieTag(cards: readonly Tapisserie[], ids: readonly string[]): Tapisserie[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readTapisserieViews(raw: unknown): TapisserieView[] {
  if (!Array.isArray(raw)) return [];
  const out: TapisserieView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TapisserieView>;
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

export function addTapisserieView(views: readonly TapisserieView[], view: TapisserieView): TapisserieView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTapisserieViews([...views, { ...view, id, name }]);
}

export function dropTapisserieView(views: readonly TapisserieView[], id: string): TapisserieView[] {
  return views.filter((view) => view.id !== id);
}

export function tapisserieDensity(raw: unknown): TapisserieDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortTapisserieCards(cards: readonly Tapisserie[], sort: TapisserieSort): Tapisserie[] {
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

export function visibleTapisserieCards(
  cards: readonly Tapisserie[],
  tray: TapisserieTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Tapisserie[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : tapisserieFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !tapisserieInner(card.piece)) return false;
    if (wantLimb === "outer" && !tapisserieOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An edge stripe on count four, still not raised and not in the drawer, is overdue. */
export function overdueTapisserie(card: Tapisserie): boolean {
  return tapisserieOuter(card.piece) && card.lock === 4 && !card.raised && !card.coffered;
}


/** No finish, pitch five, count four, and still on the bench. */
export function idleTapisserie(card: Tapisserie): boolean {
  return !card.film && card.drop === 5 && card.lock === 4 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, pitch forty, and a full count, still out of the drawer. */
export function briskTapisserie(card: Tapisserie): boolean {
  return card.film === "GILT" && card.drop === 40 && card.lock === 11 && !card.coffered;
}


/** Fringe, ivory, and pitch ten. */
export function restingTapisserie(card: Tapisserie): boolean {
  return card.piece === "fringe" && card.film === "IVORY" && card.drop === 10;
}


/** A warp is late when the station is already on the fringe. */
export function lateTapisserie(card: Tapisserie, station: string): boolean {
  return card.piece === "warp" && tapisserieMode(station) === "fringe" && !card.raised;
}


export function tapisserieCounts(cards: readonly Tapisserie[], shown: readonly Tapisserie[], station: string): TapisserieCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => tapisserieInner(card.piece)).length,
    outer: cards.filter((card) => tapisserieOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 40).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleTapisserie).length,
    brisk: cards.filter(briskTapisserie).length,
    resting: cards.filter(restingTapisserie).length,
    overdue: cards.filter(overdueTapisserie).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateTapisserie(card, station)).length,
  };
}

export function tapisserieBars(cards: readonly Tapisserie[]): { piece: string; count: number }[] {
  return TPS_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function tapisserieTimeline(cards: readonly Tapisserie[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function tapisserieKeepers(cards: readonly Tapisserie[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Tapisserie[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of tapisserieKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTapisserieCards(cards: readonly Tapisserie[]): string[] {
  return cards.filter(overdueTapisserie).map((card) => card.title);
}

export function tapisserieCopy(card: Tapisserie): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function tapisserieCsv(cards: readonly Tapisserie[], station: string): string {
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
        tapisserieOuter(card.piece) ? "1" : "0",
        lateTapisserie(card, station) ? "1" : "0",
        idleTapisserie(card) ? "1" : "0",
        briskTapisserie(card) ? "1" : "0",
        restingTapisserie(card) ? "1" : "0",
        overdueTapisserie(card) ? "1" : "0",
        tapisserieInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        tapisserieBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const AFA_KEY = "crmv4-afa-hide-367";
export const AFA_REVIEW_KEY = "crmv4-afa-review-367";

export type LisLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type LisHue = "" | "ivory" | "graphite" | "champagne";
export type LisState = "" | "clear" | "set";
export type LisReview = "all" | "reviewed" | "fresh";
export type LisShape =
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

export type LisValue = string | { affiliateA?: unknown; [key: string]: unknown } | null | undefined;
export type LisRow = { id: string; label: string; code: LisValue };
export type LisLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LisValue): { affiliateA?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LisValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LisValue): string {
  const row = codeRecord(raw);
  if (row && !("affiliateA" in row)) return "";
  const value = row ? row.affiliateA : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "DIRECT";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: LisValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("affiliateA" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function afaState(raw: LisValue): LisState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["DIRECT", "HOUSE", "OWN", "YES"]);
const DESK_TITLES = new Set(["IB", "INTRO"]);
const HOLD_TITLES = new Set(["PAUSE", "HOLD"]);
const GUEST_TITLES = new Set(["DEAD", "VOID"]);
const JOIN_TITLES = new Set(["PAIR", "SPLIT"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function afaLane(raw: LisValue, now = Date.now()): LisLane {
  if (afaState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/silent|dormant/i.test(text)) return "vacant";
  if (text.includes("+")) return "join";
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
  if (text.includes(":")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (/\bdirect\b|\bhouse\b/i.test(text)) return "hall";
  if (text.length >= 12 && text.includes("/")) return "route";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function afaHue(raw: LisValue, now = Date.now()): LisHue {
  const mail = afaLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function afaHome(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "hall";
}

export function afaAway(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "vacant";
}

export function afaGuest(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "hold";
}

export function afaCitizen(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "guest";
}

export function afaDesk(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "desk";
}

export function afaJoin(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "join";
}

export function afaRoute(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "route";
}

export function afaBrief(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "brief";
}

export function afaLong(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "long";
}

export function afaStampMark(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "stamp";
}

export function afaVowelLane(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "vowel";
}

export function afaPlain(raw: LisValue, now = Date.now()): boolean {
  return afaLane(raw, now) === "plain";
}

export function afaOpen(raw: LisValue): boolean {
  return afaState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function afaHeld(raw: LisValue): boolean {
  const mail = afaLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function afaSoon(raw: LisValue, now = Date.now()): boolean {
  if (afaState(raw) !== "set") return false;
  if (afaBrief(raw, now)) return true;
  if (afaHome(raw, now) || afaAway(raw, now) || afaGuest(raw, now) || afaCitizen(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function afaLength(raw: LisValue): number | null {
  if (afaState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function afaEven(raw: LisValue): boolean {
  const length = afaLength(raw);
  return length !== null && length % 2 === 0;
}

export function afaOdd(raw: LisValue): boolean {
  const length = afaLength(raw);
  return length !== null && length % 2 === 1;
}

export function afaFirst(raw: LisValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function afaTail(raw: LisValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function afaCapital(raw: LisValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function afaSpace(raw: LisValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function afaVowel(raw: LisValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function afaDigit(raw: LisValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function afaLetter(raw: LisValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function afaMixed(raw: LisValue): boolean {
  return afaDigit(raw) && afaLetter(raw);
}

export function afaLower(raw: LisValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function afaUpper(raw: LisValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function afaStamp(raw: LisValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function afaCopy(raw: LisValue): string {
  return codeGiven(raw);
}

export function afaFamily(raw: LisValue): string {
  if (afaState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function afaLanes(rows: readonly LisRow[]): LisLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = afaLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly LisRow[]): string {
  const lines = afaLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly LisRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = afaHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly LisRow[], mail: LisLane): number {
  return rows.filter((row) => afaLane(row.code) === mail).length;
}

export function afaShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly LisRow[]): string[] {
  return afaLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: LisRow, shape: LisShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return afaHome(row.code);
  if (shape === "vacant") return afaAway(row.code);
  if (shape === "hold") return afaGuest(row.code);
  if (shape === "guest") return afaCitizen(row.code);
  if (shape === "join") return afaJoin(row.code);
  if (shape === "route") return afaRoute(row.code);
  if (shape === "brief") return afaBrief(row.code);
  if (shape === "long") return afaLong(row.code);
  if (shape === "stamp") return afaStampMark(row.code);
  if (shape === "vowel") return afaVowelLane(row.code);
  if (shape === "plain") return afaPlain(row.code);
  if (shape === "open") return afaOpen(row.code);
  if (shape === "soon") return afaSoon(row.code);
  if (shape === "letter") return afaLetter(row.code);
  if (shape === "mixed") return afaMixed(row.code);
  if (shape === "upper") return afaUpper(row.code);
  if (shape === "lower") return afaLower(row.code);
  if (shape === "space") return afaSpace(row.code);
  if (shape === "even") return afaEven(row.code);
  if (shape === "odd") return afaOdd(row.code);
  if (shape === "tail") return afaTail(row.code);
  if (shape === "first") return afaFirst(row.code);
  if (shape === "held") return afaHeld(row.code);
  return afaLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly LisRow[],
  mail: string,
  hue: string,
  query: string,
  review: LisReview,
  reviewed: readonly string[],
  shape: LisShape,
): LisRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (afaState(row.code) === "") return false;
    const found = afaLane(row.code);
    const hueName = afaHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${afaStamp(row.code)} ${afaFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function afaLanesCsv(rows: readonly LisRow[]): string {
  const lines = ["lane,count"];
  for (const line of afaLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function afaRowsCsv(rows: readonly LisRow[], reviewed: readonly string[]): string {
  const lines = ["name,affiliateA,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(afaCopy(row.code)),
        afaStamp(row.code),
        csvCell(afaFamily(row.code)),
        afaLane(row.code),
        afaHue(row.code),
        afaLength(row.code) ?? "",
        afaHome(row.code) ? "1" : "0",
        afaAway(row.code) ? "1" : "0",
        afaGuest(row.code) ? "1" : "0",
        afaDesk(row.code) ? "1" : "0",
        afaCitizen(row.code) ? "1" : "0",
        afaJoin(row.code) ? "1" : "0",
        afaRoute(row.code) ? "1" : "0",
        afaBrief(row.code) ? "1" : "0",
        afaEven(row.code) ? "1" : "0",
        afaDigit(row.code) ? "1" : "0",
        afaMixed(row.code) ? "1" : "0",
        afaUpper(row.code) ? "1" : "0",
        afaVowel(row.code) ? "1" : "0",
        afaTail(row.code) ? "1" : "0",
        afaHeld(row.code) ? "1" : "0",
        afaSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
