/**
 * Opaline dial rules for an enamel coat kept in this browser,
 * and origin plates read leadInvalidSource already stored on the account.
 * Coats are glaze, ground, veil, and rim. Finishes are gilt, ivory, and graphite.
 * Gaps are 3, 6, 12, or 24. Counts are 3, 6, or 9.
 * Glaze and ground are main. Veil and rim are side.
 * Manual, staff, hand, and YES are house origins. Auto and rule sit the desk.
 * Hold and wait are on hold. Void and fail are guests.
 * Pair and joint are joined. None, other, and NO stay plain.
 * A plus joins two marks. A colon that is not a time marks a scoped origin.
 * A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest.
 * A brief mark is exactly four characters. A digit mark starts with a digit and is not a time.
 * A long mark is ten characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words manual and staff are house origins. Silent or closed is shut.
 * A true origin reads as MANUAL. A false origin reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved origin.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_opaline_dial (
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
 * CREATE TABLE crm_lis_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_lis_review (
 *   trader_id text primary key
 * );
 */


export const OPL_KEY = "crmv4-opaline-366";
export const OPL_VIEW_KEY = "crmv4-opaline-views-366";
export const OPL_DENSITY_KEY = "crmv4-opaline-density-366";
export const OPL_MODES = ["glaze", "ground", "veil", "rim"] as const;

export type OpalineMode = (typeof OPL_MODES)[number];
export type OpalineFilm = "blank" | "gilt" | "ivory" | "graphite";
export type OpalineTray = "board" | "peg" | "coffer";
export type OpalineDensity = "airy" | "close";
export type OpalineSort = "piece" | "setter";

export type Opaline = {
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

export type OpalineView = {
  id: string;
  name: string;
  tray: OpalineTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type OpalineCounts = {
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

export const ROUND366_FEATURES = [
  "opaline-save",
  "veil-reminders",
  "opaline-modes",
  "opaline-search",
  "opaline-coat-sla",
  "veil-archive",
  "opaline-count-star",
  "opaline-inline-title",
  "opaline-filters",
  "saved-opaline-views",
  "opaline-density",
  "veil-focus",
  "opaline-kpis",
  "veil-chart",
  "veil-timeline",
  "opaline-bulk",
  "opaline-csv",
  "opaline-keys",
  "opaline-audit",
  "fair-enameller",
  "opaline-viewer",
  "suggest-veil",
  "overdue-veil",
  "origin-plate",
  "origin-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 6, 12, 24] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["glaze", "ground"]);
const OUTER = new Set(["veil", "rim"]);
const QUIET_FILM = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 18;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): OpalineTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<OpalineFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<OpalineFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[qr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Opaline, tray: OpalineTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return OPL_MODES.indexOf(piece as OpalineMode);
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

export function opalineMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (OPL_MODES as readonly string[]).includes(text) ? text : "";
}

/** A gap is 3, 6, 12, or 24. Anything else stays blank. */
export function opalineHour(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A coat count is 3, 6, or 9. Anything else stays blank. */
export function opalineHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function opalineFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function opalineInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function opalineOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cannon is the barrel. Minute is the pinion. Hour is the hand. Date is the window. */
export function opalineBand(piece: unknown): string {
  const text = opalineMode(piece);
  if (!text) return "";
  if (text === "glaze") return "milk";
  if (text === "ground") return "field";
  if (text === "veil") return "gauze";
  return "lip";
}

/** Signed distance from one mode to another along the stripe. */
export function opalineGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(opalineMode(from));
  const right = pieceIndex(opalineMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(opalineFilm(film));
}

/** A pair wheel is 3. One and six are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return opalineHammer(lock) === 6;
}

/** A full wheel is 6. */
export function fullHammer(lock: unknown): boolean {
  return opalineHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return opalineMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = opalineHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = opalineFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = opalineHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveOpalineFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Opaline[]): string {
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
export function suggestHour(cards: readonly Opaline[], hour: number): 3 | 6 | 12 | 24 {
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
  if (hour < 6) return 3;
  if (hour < 12) return 6;
  if (hour < 18) return 12;
  return 24;
}

export function suggestMode(hour: number): OpalineMode {
  return hour < 9 ? "glaze" : "rim";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Opaline[], roster: string): string {
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

export function readOpalineCards(raw: unknown): Opaline[] {
  if (!Array.isArray(raw)) return [];
  const out: Opaline[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Opaline>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: opalineMode(row.piece),
      drop: opalineHour(row.drop),
      film: opalineFilm(row.film),
      lock: opalineHammer(row.lock) ?? 3,
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

export function addOpaline(
  cards: readonly Opaline[],
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
): Opaline[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOpalineCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: opalineMode(card.piece),
      drop: opalineHour(card.drop),
      film: opalineFilm(card.film),
      lock: opalineHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Opaline[], id: string, edit: (card: Opaline) => Opaline): Opaline[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOpaline(cards: readonly Opaline[], id: string, title: string): Opaline[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOpalineNote(cards: readonly Opaline[], id: string, note: string): Opaline[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(opalineFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setOpalineFilm(cards: readonly Opaline[], id: string, film: string): Opaline[] {
  const next = opalineFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setOpalineRaised(cards: readonly Opaline[], id: string, raised: boolean): Opaline[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setOpalinePin(cards: readonly Opaline[], id: string, pinned: boolean): Opaline[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setOpalineCoffer(cards: readonly Opaline[], id: string, coffered: boolean): Opaline[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setOpalineStar(cards: readonly Opaline[], id: string, starred: boolean): Opaline[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addOpalineTag(cards: readonly Opaline[], id: string, tag: string): Opaline[] {
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

export function raiseHourFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setOpalineFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinOpalineFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return setOpalinePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starOpalineFocused(cards: readonly Opaline[], id: string): Opaline[] {
  return setOpalineStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Opaline[], id: string): Opaline[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOpalineFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Opaline[], ids: readonly string[], edit: (card: Opaline) => Opaline): Opaline[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOpalineGraphite(cards: readonly Opaline[], ids: readonly string[]): Opaline[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkOpalineRaise(cards: readonly Opaline[], ids: readonly string[]): Opaline[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkOpalineCoffer(cards: readonly Opaline[], ids: readonly string[]): Opaline[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkOpalineTag(cards: readonly Opaline[], ids: readonly string[]): Opaline[] {
  return bulk(cards, ids, (card) => (card.tags.includes("q") ? card : { ...card, tags: tagsOf([...card.tags, "q"]), audit: "tag" }));
}

export function readOpalineViews(raw: unknown): OpalineView[] {
  if (!Array.isArray(raw)) return [];
  const out: OpalineView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OpalineView>;
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

export function addOpalineView(views: readonly OpalineView[], view: OpalineView): OpalineView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOpalineViews([...views, { ...view, id, name }]);
}

export function dropOpalineView(views: readonly OpalineView[], id: string): OpalineView[] {
  return views.filter((view) => view.id !== id);
}

export function opalineDensity(raw: unknown): OpalineDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortOpalineCards(cards: readonly Opaline[], sort: OpalineSort): Opaline[] {
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

export function visibleOpalineCards(
  cards: readonly Opaline[],
  tray: OpalineTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Opaline[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : opalineFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !opalineInner(card.piece)) return false;
    if (wantLimb === "outer" && !opalineOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side part on count two, still not raised and not in the drawer, is overdue. */
/** A side coat on count three, still not raised and not in the drawer, is overdue. */
export function overdueOpaline(card: Opaline): boolean {
  return opalineOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}


/** No finish, gap six, spring two, and still on the bench. */
/** No finish, gap three, count three, and still on the bench. */
export function idleOpaline(card: Opaline): boolean {
  return !card.film && card.drop === 3 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, gap forty-eight, and a full spring, still out of the drawer. */
/** Gilt, gap twenty-four, and a full count, still out of the drawer. */
export function briskOpaline(card: Opaline): boolean {
  return card.film === "GILT" && card.drop === 24 && card.lock === 9 && !card.coffered;
}


/** Jewel, ivory, and gap twelve. */
/** Rim, ivory, and gap six. */
export function restingOpaline(card: Opaline): boolean {
  return card.piece === "rim" && card.film === "IVORY" && card.drop === 6;
}


/** A lyre is late when the station is already on the jewel. */
/** A glaze is late when the station is already on the rim. */
export function lateOpaline(card: Opaline, station: string): boolean {
  return card.piece === "glaze" && opalineMode(station) === "rim" && !card.raised;
}


export function opalineCounts(cards: readonly Opaline[], shown: readonly Opaline[], station: string): OpalineCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => opalineInner(card.piece)).length,
    outer: cards.filter((card) => opalineOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 24).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleOpaline).length,
    brisk: cards.filter(briskOpaline).length,
    resting: cards.filter(restingOpaline).length,
    overdue: cards.filter(overdueOpaline).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateOpaline(card, station)).length,
  };
}

export function opalineBars(cards: readonly Opaline[]): { piece: string; count: number }[] {
  return OPL_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function opalineTimeline(cards: readonly Opaline[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function opalineKeepers(cards: readonly Opaline[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Opaline[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of opalineKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOpalineCards(cards: readonly Opaline[]): string[] {
  return cards.filter(overdueOpaline).map((card) => card.title);
}

export function opalineCopy(card: Opaline): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function opalineCsv(cards: readonly Opaline[], station: string): string {
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
        opalineOuter(card.piece) ? "1" : "0",
        lateOpaline(card, station) ? "1" : "0",
        idleOpaline(card) ? "1" : "0",
        briskOpaline(card) ? "1" : "0",
        restingOpaline(card) ? "1" : "0",
        overdueOpaline(card) ? "1" : "0",
        opalineInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        opalineBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const LIS_KEY = "crmv4-lis-hide-366";
export const LIS_REVIEW_KEY = "crmv4-lis-review-366";

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

export type LisValue = string | { leadInvalidSource?: unknown; [key: string]: unknown } | null | undefined;
export type LisRow = { id: string; label: string; code: LisValue };
export type LisLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LisValue): { leadInvalidSource?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LisValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LisValue): string {
  const row = codeRecord(raw);
  if (row && !("leadInvalidSource" in row)) return "";
  const value = row ? row.leadInvalidSource : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "MANUAL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: LisValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("leadInvalidSource" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function lisState(raw: LisValue): LisState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["MANUAL", "STAFF", "HAND", "YES"]);
const DESK_TITLES = new Set(["AUTO", "RULE"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT"]);
const GUEST_TITLES = new Set(["VOID", "FAIL"]);
const JOIN_TITLES = new Set(["PAIR", "JOINT"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "OTHER"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function lisLane(raw: LisValue, now = Date.now()): LisLane {
  if (lisState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/silent|closed/i.test(text)) return "vacant";
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
    if (age < 3 * day) return "desk";
    if (age < 10 * day) return "hold";
    return "guest";
  }
  if (text.includes(":")) return "route";
  if (text.length === 4) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (/\bmanual\b|\bstaff\b/i.test(text)) return "hall";
  if (text.length >= 10 && text.includes("/")) return "route";
  if (text.length >= 10) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function lisHue(raw: LisValue, now = Date.now()): LisHue {
  const mail = lisLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function lisHome(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "hall";
}

export function lisAway(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "vacant";
}

export function lisGuest(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "hold";
}

export function lisCitizen(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "guest";
}

export function lisDesk(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "desk";
}

export function lisJoin(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "join";
}

export function lisRoute(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "route";
}

export function lisBrief(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "brief";
}

export function lisLong(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "long";
}

export function lisStampMark(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "stamp";
}

export function lisVowelLane(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "vowel";
}

export function lisPlain(raw: LisValue, now = Date.now()): boolean {
  return lisLane(raw, now) === "plain";
}

export function lisOpen(raw: LisValue): boolean {
  return lisState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function lisHeld(raw: LisValue): boolean {
  const mail = lisLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function lisSoon(raw: LisValue, now = Date.now()): boolean {
  if (lisState(raw) !== "set") return false;
  if (lisBrief(raw, now)) return true;
  if (lisHome(raw, now) || lisAway(raw, now) || lisGuest(raw, now) || lisCitizen(raw, now)) return false;
  return codeGiven(raw).length === 3;
}

export function lisLength(raw: LisValue): number | null {
  if (lisState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function lisEven(raw: LisValue): boolean {
  const length = lisLength(raw);
  return length !== null && length % 2 === 0;
}

export function lisOdd(raw: LisValue): boolean {
  const length = lisLength(raw);
  return length !== null && length % 2 === 1;
}

export function lisFirst(raw: LisValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function lisTail(raw: LisValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function lisCapital(raw: LisValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function lisSpace(raw: LisValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function lisVowel(raw: LisValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function lisDigit(raw: LisValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function lisLetter(raw: LisValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function lisMixed(raw: LisValue): boolean {
  return lisDigit(raw) && lisLetter(raw);
}

export function lisLower(raw: LisValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function lisUpper(raw: LisValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 9 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function lisStamp(raw: LisValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function lisCopy(raw: LisValue): string {
  return codeGiven(raw);
}

export function lisFamily(raw: LisValue): string {
  if (lisState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function lisLanes(rows: readonly LisRow[]): LisLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = lisLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly LisRow[]): string {
  const lines = lisLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly LisRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = lisHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly LisRow[], mail: LisLane): number {
  return rows.filter((row) => lisLane(row.code) === mail).length;
}

export function lisShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly LisRow[]): string[] {
  return lisLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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
  if (shape === "hall") return lisHome(row.code);
  if (shape === "vacant") return lisAway(row.code);
  if (shape === "hold") return lisGuest(row.code);
  if (shape === "guest") return lisCitizen(row.code);
  if (shape === "join") return lisJoin(row.code);
  if (shape === "route") return lisRoute(row.code);
  if (shape === "brief") return lisBrief(row.code);
  if (shape === "long") return lisLong(row.code);
  if (shape === "stamp") return lisStampMark(row.code);
  if (shape === "vowel") return lisVowelLane(row.code);
  if (shape === "plain") return lisPlain(row.code);
  if (shape === "open") return lisOpen(row.code);
  if (shape === "soon") return lisSoon(row.code);
  if (shape === "letter") return lisLetter(row.code);
  if (shape === "mixed") return lisMixed(row.code);
  if (shape === "upper") return lisUpper(row.code);
  if (shape === "lower") return lisLower(row.code);
  if (shape === "space") return lisSpace(row.code);
  if (shape === "even") return lisEven(row.code);
  if (shape === "odd") return lisOdd(row.code);
  if (shape === "tail") return lisTail(row.code);
  if (shape === "first") return lisFirst(row.code);
  if (shape === "held") return lisHeld(row.code);
  return lisLane(row.code) === shape;
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
    if (lisState(row.code) === "") return false;
    const found = lisLane(row.code);
    const hueName = lisHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${lisStamp(row.code)} ${lisFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function lisLanesCsv(rows: readonly LisRow[]): string {
  const lines = ["lane,count"];
  for (const line of lisLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function lisRowsCsv(rows: readonly LisRow[], reviewed: readonly string[]): string {
  const lines = ["name,leadInvalidSource,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(lisCopy(row.code)),
        lisStamp(row.code),
        csvCell(lisFamily(row.code)),
        lisLane(row.code),
        lisHue(row.code),
        lisLength(row.code) ?? "",
        lisHome(row.code) ? "1" : "0",
        lisAway(row.code) ? "1" : "0",
        lisGuest(row.code) ? "1" : "0",
        lisDesk(row.code) ? "1" : "0",
        lisCitizen(row.code) ? "1" : "0",
        lisJoin(row.code) ? "1" : "0",
        lisRoute(row.code) ? "1" : "0",
        lisBrief(row.code) ? "1" : "0",
        lisEven(row.code) ? "1" : "0",
        lisDigit(row.code) ? "1" : "0",
        lisMixed(row.code) ? "1" : "0",
        lisUpper(row.code) ? "1" : "0",
        lisVowel(row.code) ? "1" : "0",
        lisTail(row.code) ? "1" : "0",
        lisHeld(row.code) ? "1" : "0",
        lisSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
