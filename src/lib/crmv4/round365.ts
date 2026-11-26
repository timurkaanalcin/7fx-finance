/**
 * Maltese-cross rules for a stopwork kept in this browser,
 * and server plates read tradingServer already stored on the account.
 * Parts are cross, finger, beak, and arbor. Finishes are gilt, ivory, and graphite.
 * Gaps are 4, 8, 16, or 32. Counts are 2, 5, or 7.
 * Cross and finger are main. Beak and arbor are side.
 * Live, open, primary, and YES are house servers. Staging and queue sit the desk.
 * Hold and wait are on hold. Retired and fail are guests.
 * Pair and joint are joined. None, other, and NO stay plain.
 * A plus joins two marks. A colon that is not a time marks a scoped server.
 * A time today is a house server. Within two days is the desk. Within eight days is hold. Older is a guest.
 * A brief mark is exactly five characters. A digit mark starts with a digit and is not a time.
 * A long mark is twelve characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words live and book are house servers. Sunset or offline is shut.
 * A true server reads as LIVE. A false server reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved server.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_maltese_cross (
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
 * CREATE TABLE crm_srv_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_srv_review (
 *   trader_id text primary key
 * );
 */

export const MLX_KEY = "crmv4-maltese-365";
export const MLX_VIEW_KEY = "crmv4-maltese-views";
export const MLX_DENSITY_KEY = "crmv4-maltese-density";
export const MLX_MODES = ["cross", "finger", "beak", "arbor"] as const;

export type MalteseMode = (typeof MLX_MODES)[number];
export type MalteseFilm = "blank" | "gilt" | "ivory" | "graphite";
export type MalteseTray = "board" | "peg" | "coffer";
export type MalteseDensity = "airy" | "close";
export type MalteseSort = "piece" | "setter";

export type Maltese = {
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

export type MalteseView = {
  id: string;
  name: string;
  tray: MalteseTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type MalteseCounts = {
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

export const ROUND365_FEATURES = [
  "maltese-save",
  "cross-reminders",
  "maltese-modes",
  "maltese-search",
  "maltese-stop-sla",
  "cross-archive",
  "maltese-count-star",
  "maltese-inline-title",
  "maltese-filters",
  "saved-maltese-views",
  "maltese-density",
  "cross-focus",
  "maltese-kpis",
  "cross-chart",
  "cross-timeline",
  "maltese-bulk",
  "maltese-csv",
  "maltese-keys",
  "maltese-audit",
  "fair-stopwork",
  "maltese-viewer",
  "suggest-cross",
  "overdue-cross",
  "server-plate",
  "server-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 16, 32] as const;
const LOCK_CYCLE = [2, 5, 7] as const;
const INNER = new Set(["cross", "finger"]);
const OUTER = new Set(["beak", "arbor"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 18;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): MalteseTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<MalteseFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<MalteseFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[kn]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Maltese, tray: MalteseTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return MLX_MODES.indexOf(piece as MalteseMode);
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

export function malteseMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (MLX_MODES as readonly string[]).includes(text) ? text : "";
}

/** A gap is 6, 12, 24, or 48. Anything else stays blank. */
export function malteseHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A spring count is 2, 4, or 8. Anything else stays blank. */
export function malteseHammer(raw: unknown): 2 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "7") return null;
  return Number(text) as 2 | 5 | 7;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function malteseFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function malteseInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function malteseOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cannon is the barrel. Minute is the pinion. Hour is the hand. Date is the window. */
export function malteseBand(piece: unknown): string {
  const text = malteseMode(piece);
  if (!text) return "";
  if (text === "cross") return "arm";
  if (text === "finger") return "peg";
  if (text === "beak") return "nose";
  return "shaft";
}

/** Signed distance from one mode to another along the stripe. */
export function malteseGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(malteseMode(from));
  const right = pieceIndex(malteseMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(malteseFilm(film));
}

/** A pair wheel is 3. One and six are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return malteseHammer(lock) === 5;
}

/** A full wheel is 6. */
export function fullHammer(lock: unknown): boolean {
  return malteseHammer(lock) === 7;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return malteseMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = malteseHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = malteseFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = malteseHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveMalteseFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Maltese[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["GRAPHITE", "IVORY", "GILT"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest fifteen. Later, suggest thirty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Maltese[], hour: number): 4 | 8 | 16 | 32 {
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
  if (hour < 8) return 4;
  if (hour < 14) return 8;
  if (hour < 20) return 16;
  return 32;
}

export function suggestMode(hour: number): MalteseMode {
  return hour < 8 ? "cross" : "arbor";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Maltese[], roster: string): string {
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

export function readMalteseCards(raw: unknown): Maltese[] {
  if (!Array.isArray(raw)) return [];
  const out: Maltese[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Maltese>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: malteseMode(row.piece),
      drop: malteseHour(row.drop),
      film: malteseFilm(row.film),
      lock: malteseHammer(row.lock) ?? 2,
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

export function addMaltese(
  cards: readonly Maltese[],
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
): Maltese[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readMalteseCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: malteseMode(card.piece),
      drop: malteseHour(card.drop),
      film: malteseFilm(card.film),
      lock: malteseHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Maltese[], id: string, edit: (card: Maltese) => Maltese): Maltese[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editMaltese(cards: readonly Maltese[], id: string, title: string): Maltese[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editMalteseNote(cards: readonly Maltese[], id: string, note: string): Maltese[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(malteseFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setMalteseFilm(cards: readonly Maltese[], id: string, film: string): Maltese[] {
  const next = malteseFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setMalteseRaised(cards: readonly Maltese[], id: string, raised: boolean): Maltese[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setMaltesePin(cards: readonly Maltese[], id: string, pinned: boolean): Maltese[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setMalteseCoffer(cards: readonly Maltese[], id: string, coffered: boolean): Maltese[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setMalteseStar(cards: readonly Maltese[], id: string, starred: boolean): Maltese[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addMalteseTag(cards: readonly Maltese[], id: string, tag: string): Maltese[] {
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

function stepLock(lock: number, dir: 1 | -1): 2 | 5 | 7 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setMalteseFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinMalteseFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return setMaltesePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starMalteseFocused(cards: readonly Maltese[], id: string): Maltese[] {
  return setMalteseStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Maltese[], id: string): Maltese[] {
  const card = cards.find((item) => item.id === id);
  return card ? setMalteseFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Maltese[], ids: readonly string[], edit: (card: Maltese) => Maltese): Maltese[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkMalteseGraphite(cards: readonly Maltese[], ids: readonly string[]): Maltese[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkMalteseRaise(cards: readonly Maltese[], ids: readonly string[]): Maltese[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkMalteseCoffer(cards: readonly Maltese[], ids: readonly string[]): Maltese[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkMalteseTag(cards: readonly Maltese[], ids: readonly string[]): Maltese[] {
  return bulk(cards, ids, (card) => (card.tags.includes("k") ? card : { ...card, tags: tagsOf([...card.tags, "k"]), audit: "tag" }));
}

export function readMalteseViews(raw: unknown): MalteseView[] {
  if (!Array.isArray(raw)) return [];
  const out: MalteseView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MalteseView>;
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

export function addMalteseView(views: readonly MalteseView[], view: MalteseView): MalteseView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readMalteseViews([...views, { ...view, id, name }]);
}

export function dropMalteseView(views: readonly MalteseView[], id: string): MalteseView[] {
  return views.filter((view) => view.id !== id);
}

export function malteseDensity(raw: unknown): MalteseDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortMalteseCards(cards: readonly Maltese[], sort: MalteseSort): Maltese[] {
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

export function visibleMalteseCards(
  cards: readonly Maltese[],
  tray: MalteseTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Maltese[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : malteseFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !malteseInner(card.piece)) return false;
    if (wantLimb === "outer" && !malteseOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side part on count two, still not raised and not in the drawer, is overdue. */
export function overdueMaltese(card: Maltese): boolean {
  return malteseOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No finish, gap six, spring two, and still on the bench. */
export function idleMaltese(card: Maltese): boolean {
  return !card.film && card.drop === 4 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, gap forty-eight, and a full spring, still out of the drawer. */
export function briskMaltese(card: Maltese): boolean {
  return card.film === "GILT" && card.drop === 32 && card.lock === 7 && !card.coffered;
}

/** Jewel, ivory, and gap twelve. */
export function restingMaltese(card: Maltese): boolean {
  return card.piece === "arbor" && card.film === "GRAPHITE" && card.drop === 8;
}

/** A lyre is late when the station is already on the jewel. */
export function lateMaltese(card: Maltese, station: string): boolean {
  return card.piece === "cross" && malteseMode(station) === "arbor" && !card.raised;
}

export function malteseCounts(cards: readonly Maltese[], shown: readonly Maltese[], station: string): MalteseCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => malteseInner(card.piece)).length,
    outer: cards.filter((card) => malteseOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleMaltese).length,
    brisk: cards.filter(briskMaltese).length,
    resting: cards.filter(restingMaltese).length,
    overdue: cards.filter(overdueMaltese).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateMaltese(card, station)).length,
  };
}

export function malteseBars(cards: readonly Maltese[]): { piece: string; count: number }[] {
  return MLX_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function malteseTimeline(cards: readonly Maltese[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function malteseKeepers(cards: readonly Maltese[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Maltese[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of malteseKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderMalteseCards(cards: readonly Maltese[]): string[] {
  return cards.filter(overdueMaltese).map((card) => card.title);
}

export function malteseCopy(card: Maltese): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function malteseCsv(cards: readonly Maltese[], station: string): string {
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
        malteseOuter(card.piece) ? "1" : "0",
        lateMaltese(card, station) ? "1" : "0",
        idleMaltese(card) ? "1" : "0",
        briskMaltese(card) ? "1" : "0",
        restingMaltese(card) ? "1" : "0",
        overdueMaltese(card) ? "1" : "0",
        malteseInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        malteseBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const SRV_KEY = "crmv4-srv-hide";
export const SRV_REVIEW_KEY = "crmv4-srv-review";

export type SrvLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type SrvHue = "" | "ivory" | "graphite" | "champagne";
export type SrvState = "" | "clear" | "set";
export type SrvReview = "all" | "reviewed" | "fresh";
export type SrvShape =
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

export type SrvValue = string | { tradingServer?: unknown; [key: string]: unknown } | null | undefined;
export type SrvRow = { id: string; label: string; code: SrvValue };
export type SrvLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: SrvValue): { tradingServer?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: SrvValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: SrvValue): string {
  const row = codeRecord(raw);
  if (row && !("tradingServer" in row)) return "";
  const value = row ? row.tradingServer : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: SrvValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("tradingServer" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function srvState(raw: SrvValue): SrvState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["LIVE", "OPEN", "PRIMARY", "YES"]);
const DESK_TITLES = new Set(["STAGING", "QUEUE"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT"]);
const GUEST_TITLES = new Set(["RETIRED", "FAIL"]);
const JOIN_TITLES = new Set(["PAIR", "JOINT"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "OTHER"]);

/** A known server maps first. A plus joins two servers. A colon that is not a time marks a scoped server. A time today is a house server. Within two days is the desk. Within eight days is hold. Older is a guest. Sunset or offline is shut. A brief mark is exactly five characters. A digit mark starts with a digit and is not a time. A long mark is twelve characters or longer. A vowel mark starts with a vowel. The words live and book are house servers. */
export function srvLane(raw: SrvValue, now = Date.now()): SrvLane {
  if (srvState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/sunset|offline/i.test(text)) return "vacant";
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
    if (age < 8 * day) return "hold";
    return "guest";
  }
  if (text.includes(":")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 12 && text.includes("/")) return "route";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  if (/\blive\b|\bbook\b/i.test(text)) return "hall";
  return "plain";
}

export function srvHue(raw: SrvValue, now = Date.now()): SrvHue {
  const mail = srvLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function srvHome(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "hall";
}

export function srvAway(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "vacant";
}

export function srvGuest(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "hold";
}

export function srvCitizen(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "guest";
}

export function srvDesk(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "desk";
}

export function srvJoin(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "join";
}

export function srvRoute(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "route";
}

export function srvBrief(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "brief";
}

export function srvLong(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "long";
}

export function srvStampMark(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "stamp";
}

export function srvVowelLane(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "vowel";
}

export function srvPlain(raw: SrvValue, now = Date.now()): boolean {
  return srvLane(raw, now) === "plain";
}

export function srvOpen(raw: SrvValue): boolean {
  return srvState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function srvHeld(raw: SrvValue): boolean {
  const mail = srvLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function srvSoon(raw: SrvValue, now = Date.now()): boolean {
  if (srvState(raw) !== "set") return false;
  if (srvBrief(raw, now)) return true;
  if (srvHome(raw, now) || srvAway(raw, now) || srvGuest(raw, now) || srvCitizen(raw, now)) return false;
  return codeGiven(raw).length === 2;
}

export function srvLength(raw: SrvValue): number | null {
  if (srvState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function srvEven(raw: SrvValue): boolean {
  const length = srvLength(raw);
  return length !== null && length % 2 === 0;
}

export function srvOdd(raw: SrvValue): boolean {
  const length = srvLength(raw);
  return length !== null && length % 2 === 1;
}

export function srvFirst(raw: SrvValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function srvTail(raw: SrvValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function srvCapital(raw: SrvValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function srvSpace(raw: SrvValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function srvVowel(raw: SrvValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function srvDigit(raw: SrvValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function srvLetter(raw: SrvValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function srvMixed(raw: SrvValue): boolean {
  return srvDigit(raw) && srvLetter(raw);
}

export function srvLower(raw: SrvValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function srvUpper(raw: SrvValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function srvStamp(raw: SrvValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function srvCopy(raw: SrvValue): string {
  return codeGiven(raw);
}

export function srvFamily(raw: SrvValue): string {
  if (srvState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function srvLanes(rows: readonly SrvRow[]): SrvLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = srvLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly SrvRow[]): string {
  const lines = srvLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly SrvRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = srvHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly SrvRow[], mail: SrvLane): number {
  return rows.filter((row) => srvLane(row.code) === mail).length;
}

export function srvShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly SrvRow[]): string[] {
  return srvLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: SrvRow, shape: SrvShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return srvHome(row.code);
  if (shape === "vacant") return srvAway(row.code);
  if (shape === "hold") return srvGuest(row.code);
  if (shape === "guest") return srvCitizen(row.code);
  if (shape === "join") return srvJoin(row.code);
  if (shape === "route") return srvRoute(row.code);
  if (shape === "brief") return srvBrief(row.code);
  if (shape === "long") return srvLong(row.code);
  if (shape === "stamp") return srvStampMark(row.code);
  if (shape === "vowel") return srvVowelLane(row.code);
  if (shape === "plain") return srvPlain(row.code);
  if (shape === "open") return srvOpen(row.code);
  if (shape === "soon") return srvSoon(row.code);
  if (shape === "letter") return srvLetter(row.code);
  if (shape === "mixed") return srvMixed(row.code);
  if (shape === "upper") return srvUpper(row.code);
  if (shape === "lower") return srvLower(row.code);
  if (shape === "space") return srvSpace(row.code);
  if (shape === "even") return srvEven(row.code);
  if (shape === "odd") return srvOdd(row.code);
  if (shape === "tail") return srvTail(row.code);
  if (shape === "first") return srvFirst(row.code);
  if (shape === "held") return srvHeld(row.code);
  return srvLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly SrvRow[],
  mail: string,
  hue: string,
  query: string,
  review: SrvReview,
  reviewed: readonly string[],
  shape: SrvShape,
): SrvRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (srvState(row.code) === "") return false;
    const found = srvLane(row.code);
    const hueName = srvHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${srvStamp(row.code)} ${srvFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function srvLanesCsv(rows: readonly SrvRow[]): string {
  const lines = ["lane,count"];
  for (const line of srvLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function srvRowsCsv(rows: readonly SrvRow[], reviewed: readonly string[]): string {
  const lines = ["name,tradingServer,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(srvCopy(row.code)),
        srvStamp(row.code),
        csvCell(srvFamily(row.code)),
        srvLane(row.code),
        srvHue(row.code),
        srvLength(row.code) ?? "",
        srvHome(row.code) ? "1" : "0",
        srvAway(row.code) ? "1" : "0",
        srvGuest(row.code) ? "1" : "0",
        srvDesk(row.code) ? "1" : "0",
        srvCitizen(row.code) ? "1" : "0",
        srvJoin(row.code) ? "1" : "0",
        srvRoute(row.code) ? "1" : "0",
        srvBrief(row.code) ? "1" : "0",
        srvEven(row.code) ? "1" : "0",
        srvDigit(row.code) ? "1" : "0",
        srvMixed(row.code) ? "1" : "0",
        srvUpper(row.code) ? "1" : "0",
        srvVowel(row.code) ? "1" : "0",
        srvTail(row.code) ? "1" : "0",
        srvHeld(row.code) ? "1" : "0",
        srvSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
