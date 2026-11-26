/**
 * Triovis rules for a fine regulator index kept in this browser,
 * and grant plates read canEditRates already stored on the account.
 * Parts are index, boot, pins, and spring. Finishes are gilt, ivory, and graphite.
 * Gaps are 5, 10, 20, or 40. Counts are 3, 6, or 9.
 * Index and boot are main. Pins and spring are side.
 * Desk, floor, open, and YES are house grants. Night and quiet sit the desk.
 * Hold and wait are on hold. Guest and visit are guests.
 * Pair and joint are joined. Other and NO stay plain.
 * A plus joins two grants. A semicolon that is not a time marks a scoped grant.
 * A time today is house. Within four days is desk. Within twelve days is hold. Older is a guest.
 * A brief mark is exactly four characters. A digit mark starts with a digit and is not a time.
 * A long mark is sixteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words staff and desk are house grants. Closed or revoked is shut.
 * A true grant reads as YES. A false grant reads as NO.
 * Money fields are not read. The password itself is not read. The plate does not change the saved grant.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_triovis (
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
 * CREATE TABLE crm_edr_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_edr_review (
 *   trader_id text primary key
 * );
 */



export const TVS_KEY = "crmv4-triovis-363";
export const TVS_VIEW_KEY = "crmv4-triovis-views";
export const TVS_DENSITY_KEY = "crmv4-triovis-density";
export const TVS_MODES = ["index", "boot", "pins", "spring"] as const;

export type TriovisMode = (typeof TVS_MODES)[number];
export type TriovisFilm = "blank" | "gilt" | "ivory" | "graphite";
export type TriovisTray = "board" | "peg" | "coffer";
export type TriovisDensity = "airy" | "close";
export type TriovisSort = "piece" | "setter";

export type Triovis = {
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

export type TriovisView = {
  id: string;
  name: string;
  tray: TriovisTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type TriovisCounts = {
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

export const ROUND363_FEATURES = [
  "triovis-save",
  "whip-reminders",
  "triovis-modes",
  "triovis-search",
  "triovis-hook-sla",
  "whip-archive",
  "triovis-count-star",
  "triovis-inline-title",
  "triovis-filters",
  "saved-triovis-views",
  "triovis-density",
  "whip-focus",
  "triovis-kpis",
  "whip-chart",
  "whip-timeline",
  "triovis-bulk",
  "triovis-csv",
  "triovis-keys",
  "triovis-audit",
  "fair-regulator",
  "triovis-viewer",
  "suggest-whip",
  "overdue-whip",
  "grant-plate",
  "grant-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 10, 20, 40] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["index", "boot"]);
const OUTER = new Set(["pins", "spring"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): TriovisTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<TriovisFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<TriovisFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[aw]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Triovis, tray: TriovisTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return TVS_MODES.indexOf(piece as TriovisMode);
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

export function triovisMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (TVS_MODES as readonly string[]).includes(text) ? text : "";
}

/** A gap is 6, 12, 24, or 48. Anything else stays blank. */
export function triovisHour(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A spring count is 2, 4, or 8. Anything else stays blank. */
export function triovisHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function triovisFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function triovisInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function triovisOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cannon is the barrel. Minute is the pinion. Hour is the hand. Date is the window. */
export function triovisBand(piece: unknown): string {
  const text = triovisMode(piece);
  if (!text) return "";
  if (text === "index") return "hand";
  if (text === "boot") return "foot";
  if (text === "pins") return "pair";
  return "whip";
}

/** Signed distance from one mode to another along the stripe. */
export function triovisGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(triovisMode(from));
  const right = pieceIndex(triovisMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(triovisFilm(film));
}

/** A pair wheel is 3. One and six are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return triovisHammer(lock) === 6;
}

/** A full wheel is 6. */
export function fullHammer(lock: unknown): boolean {
  return triovisHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return triovisMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = triovisHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = triovisFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = triovisHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveTriovisFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Triovis[]): string {
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
export function suggestHour(cards: readonly Triovis[], hour: number): 5 | 10 | 20 | 40 {
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
  if (hour < 7) return 5;
  if (hour < 13) return 10;
  if (hour < 19) return 20;
  return 40;
}

export function suggestMode(hour: number): TriovisMode {
  return hour < 7 ? "index" : "spring";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Triovis[], roster: string): string {
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

export function readTriovises(raw: unknown): Triovis[] {
  if (!Array.isArray(raw)) return [];
  const out: Triovis[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Triovis>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: triovisMode(row.piece),
      drop: triovisHour(row.drop),
      film: triovisFilm(row.film),
      lock: triovisHammer(row.lock) ?? 3,
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

export function addTriovis(
  cards: readonly Triovis[],
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
): Triovis[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTriovises([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: triovisMode(card.piece),
      drop: triovisHour(card.drop),
      film: triovisFilm(card.film),
      lock: triovisHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Triovis[], id: string, edit: (card: Triovis) => Triovis): Triovis[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTriovis(cards: readonly Triovis[], id: string, title: string): Triovis[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTriovisNote(cards: readonly Triovis[], id: string, note: string): Triovis[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(triovisFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setTriovisFilm(cards: readonly Triovis[], id: string, film: string): Triovis[] {
  const next = triovisFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setTriovisRaised(cards: readonly Triovis[], id: string, raised: boolean): Triovis[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setTriovisPin(cards: readonly Triovis[], id: string, pinned: boolean): Triovis[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setTriovisCoffer(cards: readonly Triovis[], id: string, coffered: boolean): Triovis[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setTriovisStar(cards: readonly Triovis[], id: string, starred: boolean): Triovis[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addTriovisTag(cards: readonly Triovis[], id: string, tag: string): Triovis[] {
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

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setTriovisFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinTriovisFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return setTriovisPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starTriovisFocused(cards: readonly Triovis[], id: string): Triovis[] {
  return setTriovisStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Triovis[], id: string): Triovis[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTriovisFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Triovis[], ids: readonly string[], edit: (card: Triovis) => Triovis): Triovis[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTriovisGraphite(cards: readonly Triovis[], ids: readonly string[]): Triovis[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkTriovisRaise(cards: readonly Triovis[], ids: readonly string[]): Triovis[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkTriovisCoffer(cards: readonly Triovis[], ids: readonly string[]): Triovis[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkTriovisTag(cards: readonly Triovis[], ids: readonly string[]): Triovis[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readTriovisViews(raw: unknown): TriovisView[] {
  if (!Array.isArray(raw)) return [];
  const out: TriovisView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TriovisView>;
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

export function addTriovisView(views: readonly TriovisView[], view: TriovisView): TriovisView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTriovisViews([...views, { ...view, id, name }]);
}

export function dropTriovisView(views: readonly TriovisView[], id: string): TriovisView[] {
  return views.filter((view) => view.id !== id);
}

export function triovisDensity(raw: unknown): TriovisDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortTriovises(cards: readonly Triovis[], sort: TriovisSort): Triovis[] {
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

export function visibleTriovises(
  cards: readonly Triovis[],
  tray: TriovisTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Triovis[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : triovisFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !triovisInner(card.piece)) return false;
    if (wantLimb === "outer" && !triovisOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side part on count two, still not raised and not in the drawer, is overdue. */
export function overdueTriovis(card: Triovis): boolean {
  return triovisOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No finish, gap six, spring two, and still on the bench. */
export function idleTriovis(card: Triovis): boolean {
  return !card.film && card.drop === 5 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, gap forty-eight, and a full spring, still out of the drawer. */
export function briskTriovis(card: Triovis): boolean {
  return card.film === "GILT" && card.drop === 40 && card.lock === 9 && !card.coffered;
}

/** Jewel, ivory, and gap twelve. */
export function restingTriovis(card: Triovis): boolean {
  return card.piece === "spring" && card.film === "IVORY" && card.drop === 10;
}

/** A lyre is late when the station is already on the jewel. */
export function lateTriovis(card: Triovis, station: string): boolean {
  return card.piece === "index" && triovisMode(station) === "spring" && !card.raised;
}

export function triovisCounts(cards: readonly Triovis[], shown: readonly Triovis[], station: string): TriovisCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => triovisInner(card.piece)).length,
    outer: cards.filter((card) => triovisOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 40).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleTriovis).length,
    brisk: cards.filter(briskTriovis).length,
    resting: cards.filter(restingTriovis).length,
    overdue: cards.filter(overdueTriovis).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateTriovis(card, station)).length,
  };
}

export function triovisBars(cards: readonly Triovis[]): { piece: string; count: number }[] {
  return TVS_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function triovisTimeline(cards: readonly Triovis[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function triovisKeepers(cards: readonly Triovis[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Triovis[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of triovisKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTriovises(cards: readonly Triovis[]): string[] {
  return cards.filter(overdueTriovis).map((card) => card.title);
}

export function triovisCopy(card: Triovis): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function triovisCsv(cards: readonly Triovis[], station: string): string {
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
        triovisOuter(card.piece) ? "1" : "0",
        lateTriovis(card, station) ? "1" : "0",
        idleTriovis(card) ? "1" : "0",
        briskTriovis(card) ? "1" : "0",
        restingTriovis(card) ? "1" : "0",
        overdueTriovis(card) ? "1" : "0",
        triovisInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        triovisBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const CGN_KEY = "crmv4-edr-hide";
export const CGN_REVIEW_KEY = "crmv4-edr-review";

export type CgnLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type CgnHue = "" | "ivory" | "graphite" | "champagne";
export type CgnState = "" | "clear" | "set";
export type CgnReview = "all" | "reviewed" | "fresh";
export type CgnShape =
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

export type CgnValue = string | { canEditRates?: unknown; [key: string]: unknown } | null | undefined;
export type CgnRow = { id: string; label: string; code: CgnValue };
export type CgnLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: CgnValue): { canEditRates?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: CgnValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: CgnValue): string {
  const row = codeRecord(raw);
  if (row && !("canEditRates" in row)) return "";
  const value = row ? row.canEditRates : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "YES";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO";
  return clip(value, 48);
}

function codeReadable(raw: CgnValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("canEditRates" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function edrState(raw: CgnValue): CgnState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["DESK", "FLOOR", "OPEN", "YES"]);
const DESK_TITLES = new Set(["NIGHT", "QUIET"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT"]);
const GUEST_TITLES = new Set(["GUEST", "VISIT"]);
const JOIN_TITLES = new Set(["PAIR", "JOINT"]);
const PLAIN_TITLES = new Set(["OTHER", "NO"]);

/** A known grant maps first. A plus joins two grants. A semicolon that is not a time marks a scoped grant. A time today is house. Within four days is desk. Within twelve days is hold. Older is a guest. Closed or revoked is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is sixteen characters or longer. A vowel mark starts with a vowel. The words staff and desk are house grants. */
export function edrLane(raw: CgnValue, now = Date.now()): CgnLane {
  if (edrState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/closed|revoked/i.test(text)) return "vacant";
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
    if (age < 4 * day) return "desk";
    if (age < 12 * day) return "hold";
    return "guest";
  }
  if (text.includes(";")) return "route";
  if (text.length === 4) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 16 && text.includes("/")) return "route";
  if (text.length >= 16) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  if (/\bstaff\b|\bdesk\b/i.test(text)) return "hall";
  return "plain";
}

export function edrHue(raw: CgnValue, now = Date.now()): CgnHue {
  const mail = edrLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function edrHome(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "hall";
}

export function edrAway(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "vacant";
}

export function edrGuest(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "hold";
}

export function edrCitizen(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "guest";
}

export function edrDesk(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "desk";
}

export function edrJoin(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "join";
}

export function edrRoute(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "route";
}

export function edrBrief(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "brief";
}

export function edrLong(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "long";
}

export function edrStampMark(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "stamp";
}

export function edrVowelLane(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "vowel";
}

export function edrPlain(raw: CgnValue, now = Date.now()): boolean {
  return edrLane(raw, now) === "plain";
}

export function edrOpen(raw: CgnValue): boolean {
  return edrState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function edrHeld(raw: CgnValue): boolean {
  const mail = edrLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function edrSoon(raw: CgnValue, now = Date.now()): boolean {
  if (edrState(raw) !== "set") return false;
  if (edrBrief(raw, now)) return true;
  if (edrHome(raw, now) || edrAway(raw, now) || edrGuest(raw, now) || edrCitizen(raw, now)) return false;
  return codeGiven(raw).length === 5;
}

export function edrLength(raw: CgnValue): number | null {
  if (edrState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function edrEven(raw: CgnValue): boolean {
  const length = edrLength(raw);
  return length !== null && length % 2 === 0;
}

export function edrOdd(raw: CgnValue): boolean {
  const length = edrLength(raw);
  return length !== null && length % 2 === 1;
}

export function edrFirst(raw: CgnValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function edrTail(raw: CgnValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function edrCapital(raw: CgnValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function edrSpace(raw: CgnValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function edrVowel(raw: CgnValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function edrDigit(raw: CgnValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function edrLetter(raw: CgnValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function edrMixed(raw: CgnValue): boolean {
  return edrDigit(raw) && edrLetter(raw);
}

export function edrLower(raw: CgnValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function edrUpper(raw: CgnValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function edrStamp(raw: CgnValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function edrCopy(raw: CgnValue): string {
  return codeGiven(raw);
}

export function edrFamily(raw: CgnValue): string {
  if (edrState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function edrLanes(rows: readonly CgnRow[]): CgnLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = edrLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly CgnRow[]): string {
  const lines = edrLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly CgnRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = edrHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly CgnRow[], mail: CgnLane): number {
  return rows.filter((row) => edrLane(row.code) === mail).length;
}

export function edrShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly CgnRow[]): string[] {
  return edrLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: CgnRow, shape: CgnShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return edrHome(row.code);
  if (shape === "vacant") return edrAway(row.code);
  if (shape === "hold") return edrGuest(row.code);
  if (shape === "guest") return edrCitizen(row.code);
  if (shape === "join") return edrJoin(row.code);
  if (shape === "route") return edrRoute(row.code);
  if (shape === "brief") return edrBrief(row.code);
  if (shape === "long") return edrLong(row.code);
  if (shape === "stamp") return edrStampMark(row.code);
  if (shape === "vowel") return edrVowelLane(row.code);
  if (shape === "plain") return edrPlain(row.code);
  if (shape === "open") return edrOpen(row.code);
  if (shape === "soon") return edrSoon(row.code);
  if (shape === "letter") return edrLetter(row.code);
  if (shape === "mixed") return edrMixed(row.code);
  if (shape === "upper") return edrUpper(row.code);
  if (shape === "lower") return edrLower(row.code);
  if (shape === "space") return edrSpace(row.code);
  if (shape === "even") return edrEven(row.code);
  if (shape === "odd") return edrOdd(row.code);
  if (shape === "tail") return edrTail(row.code);
  if (shape === "first") return edrFirst(row.code);
  if (shape === "held") return edrHeld(row.code);
  return edrLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly CgnRow[],
  mail: string,
  hue: string,
  query: string,
  review: CgnReview,
  reviewed: readonly string[],
  shape: CgnShape,
): CgnRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (edrState(row.code) === "") return false;
    const found = edrLane(row.code);
    const hueName = edrHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${edrStamp(row.code)} ${edrFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function edrLanesCsv(rows: readonly CgnRow[]): string {
  const lines = ["lane,count"];
  for (const line of edrLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function edrRowsCsv(rows: readonly CgnRow[], reviewed: readonly string[]): string {
  const lines = ["name,canEditRates,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(edrCopy(row.code)),
        edrStamp(row.code),
        csvCell(edrFamily(row.code)),
        edrLane(row.code),
        edrHue(row.code),
        edrLength(row.code) ?? "",
        edrHome(row.code) ? "1" : "0",
        edrAway(row.code) ? "1" : "0",
        edrGuest(row.code) ? "1" : "0",
        edrDesk(row.code) ? "1" : "0",
        edrCitizen(row.code) ? "1" : "0",
        edrJoin(row.code) ? "1" : "0",
        edrRoute(row.code) ? "1" : "0",
        edrBrief(row.code) ? "1" : "0",
        edrEven(row.code) ? "1" : "0",
        edrDigit(row.code) ? "1" : "0",
        edrMixed(row.code) ? "1" : "0",
        edrUpper(row.code) ? "1" : "0",
        edrVowel(row.code) ? "1" : "0",
        edrTail(row.code) ? "1" : "0",
        edrHeld(row.code) ? "1" : "0",
        edrSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
