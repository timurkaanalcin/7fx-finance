/**
 * Guilloche rules for engine-turned ornament kept in this browser,
 * and birth plates read birthDate already stored on the account.
 * Modes are barley, basket, hobnail, and rose. Finishes are gilt, ivory, and graphite.
 * Pitches are 4, 8, 16, or 32. Wires are 2, 4, or 8.
 * Barley and basket are main. Hobnail and rose are side.
 * A known birth mark is LIVE, SOON, LOCK, or GONE, including ACTIVE, NO_EXPIRY, DUE, NEAR, FROZEN, HALT, LAPSED, and CLOSED.
 * An ampersand joins two marks. A hash marks a route.
 * A brief mark is exactly four characters. A stamp starts with a digit.
 * A long mark is sixteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true mark reads as LIVE. A false mark reads as OPEN. The plate does not change the saved birth date.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_guilloche (
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
 * CREATE TABLE crm_exp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_exp_review (
 *   trader_id text primary key
 * );
 */

export const GLL_KEY = "crmv4-guilloche";
export const GLL_VIEW_KEY = "crmv4-guilloche-views";
export const GLL_DENSITY_KEY = "crmv4-guilloche-density";
export const GLL_MODES = ["barley", "basket", "hobnail", "rose"] as const;

export type GuillocheMode = (typeof GLL_MODES)[number];
export type GuillocheFilm = "blank" | "gilt" | "ivory" | "graphite";
export type GuillocheTray = "board" | "peg" | "coffer";
export type GuillocheDensity = "airy" | "close";
export type GuillocheSort = "piece" | "setter";

export type Guilloche = {
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

export type GuillocheView = {
  id: string;
  name: string;
  tray: GuillocheTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type GuillocheCounts = {
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

export const ROUND355_FEATURES = [
  "guilloche-save",
  "barley-reminders",
  "guilloche-modes",
  "guilloche-search",
  "guilloche-pin-sla",
  "barley-archive",
  "guilloche-latch-star",
  "guilloche-inline-title",
  "guilloche-filters",
  "saved-guilloche-views",
  "guilloche-density",
  "barley-focus",
  "guilloche-kpis",
  "barley-chart",
  "barley-timeline",
  "guilloche-bulk",
  "guilloche-csv",
  "guilloche-keys",
  "guilloche-audit",
  "fair-turner",
  "guilloche-viewer",
  "suggest-barley",
  "overdue-barley",
  "expiry-plate",
  "expiry-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 16, 32] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["barley", "basket"]);
const OUTER = new Set(["hobnail", "rose"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SOURCE_ALIAS: Record<string, "LIVE" | "SOON" | "LOCK" | "GONE"> = {
  LIVE: "LIVE",
  ACTIVE: "LIVE",
  NO_EXPIRY: "LIVE",
  SOON: "SOON",
  DUE: "SOON",
  NEAR: "SOON",
  LOCK: "LOCK",
  FROZEN: "LOCK",
  HALT: "LOCK",
  GONE: "GONE",
  LAPSED: "GONE",
  CLOSED: "GONE",
};
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GuillocheTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<GuillocheFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<GuillocheFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[gu]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Guilloche, tray: GuillocheTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return GLL_MODES.indexOf(piece as GuillocheMode);
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

export function guillocheMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GLL_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 4, 8, 16, or 32. Anything else stays blank. */
export function guillocheHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A wire is 2, 4, or 8. Anything else stays blank. */
export function guillocheHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function guillocheFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function guillocheInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function guillocheOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function guillocheBand(piece: unknown): string {
  const text = guillocheMode(piece);
  if (!text) return "";
  if (text === "barley") return "grain";
  if (text === "basket") return "weave";
  if (text === "hobnail") return "nail";
  return "bloom";
}

/** Signed distance from one piece to another along the oscillator. */
export function guillocheGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(guillocheMode(from));
  const right = pieceIndex(guillocheMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(guillocheFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return guillocheHammer(lock) === 4;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return guillocheHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return guillocheMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = guillocheHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = guillocheFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = guillocheHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveGuillocheFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Guilloche[]): string {
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
export function suggestHour(cards: readonly Guilloche[], hour: number): 4 | 8 | 16 | 32 {
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
  if (hour < 6) return 4;
  if (hour < 12) return 8;
  if (hour < 18) return 16;
  return 32;
}

export function suggestMode(hour: number): GuillocheMode {
  return hour < 6 ? "barley" : "rose";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Guilloche[], roster: string): string {
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

export function readGuilloches(raw: unknown): Guilloche[] {
  if (!Array.isArray(raw)) return [];
  const out: Guilloche[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Guilloche>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: guillocheMode(row.piece),
      drop: guillocheHour(row.drop),
      film: guillocheFilm(row.film),
      lock: guillocheHammer(row.lock) ?? 2,
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

export function addGuilloche(
  cards: readonly Guilloche[],
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
): Guilloche[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGuilloches([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: guillocheMode(card.piece),
      drop: guillocheHour(card.drop),
      film: guillocheFilm(card.film),
      lock: guillocheHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Guilloche[], id: string, edit: (card: Guilloche) => Guilloche): Guilloche[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGuilloche(cards: readonly Guilloche[], id: string, title: string): Guilloche[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGuillocheNote(cards: readonly Guilloche[], id: string, note: string): Guilloche[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(guillocheFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setGuillocheFilm(cards: readonly Guilloche[], id: string, film: string): Guilloche[] {
  const next = guillocheFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setGuillocheRaised(cards: readonly Guilloche[], id: string, raised: boolean): Guilloche[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setGuillochePin(cards: readonly Guilloche[], id: string, pinned: boolean): Guilloche[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setGuillocheCoffer(cards: readonly Guilloche[], id: string, coffered: boolean): Guilloche[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setGuillocheStar(cards: readonly Guilloche[], id: string, starred: boolean): Guilloche[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addGuillocheTag(cards: readonly Guilloche[], id: string, tag: string): Guilloche[] {
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

export function raiseHourFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setGuillocheFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinGuillocheFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return setGuillochePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starGuillocheFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  return setGuillocheStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Guilloche[], id: string): Guilloche[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGuillocheFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Guilloche[], ids: readonly string[], edit: (card: Guilloche) => Guilloche): Guilloche[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGuillocheGraphite(cards: readonly Guilloche[], ids: readonly string[]): Guilloche[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkGuillocheRaise(cards: readonly Guilloche[], ids: readonly string[]): Guilloche[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkGuillocheCoffer(cards: readonly Guilloche[], ids: readonly string[]): Guilloche[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkGuillocheTag(cards: readonly Guilloche[], ids: readonly string[]): Guilloche[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "u"]), audit: "tag" }));
}

export function readGuillocheViews(raw: unknown): GuillocheView[] {
  if (!Array.isArray(raw)) return [];
  const out: GuillocheView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GuillocheView>;
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

export function addGuillocheView(views: readonly GuillocheView[], view: GuillocheView): GuillocheView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGuillocheViews([...views, { ...view, id, name }]);
}

export function dropGuillocheView(views: readonly GuillocheView[], id: string): GuillocheView[] {
  return views.filter((view) => view.id !== id);
}

export function guillocheDensity(raw: unknown): GuillocheDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortGuilloches(cards: readonly Guilloche[], sort: GuillocheSort): Guilloche[] {
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

export function visibleGuilloches(
  cards: readonly Guilloche[],
  tray: GuillocheTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Guilloche[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : guillocheFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !guillocheInner(card.piece)) return false;
    if (wantLimb === "outer" && !guillocheOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueGuilloche(card: Guilloche): boolean {
  return guillocheOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleGuilloche(card: Guilloche): boolean {
  return !card.film && card.drop === 4 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskGuilloche(card: Guilloche): boolean {
  return card.film === "GILT" && card.drop === 32 && card.lock === 8 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingGuilloche(card: Guilloche): boolean {
  return card.piece === "rose" && card.film === "IVORY" && card.drop === 8;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateGuilloche(card: Guilloche, station: string): boolean {
  return card.piece === "barley" && guillocheMode(station) === "rose" && !card.raised;
}

export function guillocheCounts(cards: readonly Guilloche[], shown: readonly Guilloche[], station: string): GuillocheCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => guillocheInner(card.piece)).length,
    outer: cards.filter((card) => guillocheOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleGuilloche).length,
    brisk: cards.filter(briskGuilloche).length,
    resting: cards.filter(restingGuilloche).length,
    overdue: cards.filter(overdueGuilloche).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateGuilloche(card, station)).length,
  };
}

export function guillocheBars(cards: readonly Guilloche[]): { piece: string; count: number }[] {
  return GLL_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function guillocheTimeline(cards: readonly Guilloche[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function guillocheKeepers(cards: readonly Guilloche[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Guilloche[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of guillocheKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGuilloches(cards: readonly Guilloche[]): string[] {
  return cards.filter(overdueGuilloche).map((card) => card.title);
}

export function guillocheCopy(card: Guilloche): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function guillocheCsv(cards: readonly Guilloche[], station: string): string {
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
        guillocheOuter(card.piece) ? "1" : "0",
        lateGuilloche(card, station) ? "1" : "0",
        idleGuilloche(card) ? "1" : "0",
        briskGuilloche(card) ? "1" : "0",
        restingGuilloche(card) ? "1" : "0",
        overdueGuilloche(card) ? "1" : "0",
        guillocheInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        guillocheBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const EXP_KEY = "crmv4-exp-hide";
export const EXP_REVIEW_KEY = "crmv4-exp-review";

export type ExpLane = "" | "home" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type ExpHue = "" | "ivory" | "graphite" | "champagne";
export type ExpState = "" | "clear" | "set";
export type ExpReview = "all" | "reviewed" | "fresh";
export type ExpShape =
  | "all"
  | "home"
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

export type ExpValue = string | { birthDate?: unknown; [key: string]: unknown } | null | undefined;
export type ExpRow = { id: string; label: string; code: ExpValue };
export type ExpLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["home", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: ExpValue): { birthDate?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ExpValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ExpValue): string {
  const row = codeRecord(raw);
  if (row && !("birthDate" in row)) return "";
  const value = row ? row.birthDate : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return clip(value, 48);
}

function codeReadable(raw: ExpValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("birthDate" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function expState(raw: ExpValue): ExpState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known birth mark is LIVE, SOON, LOCK, or GONE, including ACTIVE, NO_EXPIRY, DUE, NEAR, FROZEN, HALT, LAPSED, and CLOSED. An ampersand joins two marks. A hash marks a route. A brief mark is exactly four characters. A stamp starts with a digit. A long mark is sixteen characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function expLane(raw: ExpValue): ExpLane {
  if (expState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = SOURCE_ALIAS[upper];
  if (canon === "LIVE") return "home";
  if (canon === "SOON") return "desk";
  if (canon === "LOCK") return "hold";
  if (canon === "GONE") return "guest";
  if (text === "NONE") return "plain";
  if (upper === "OPEN") return "vacant";
  if (text.includes("&")) return "join";
  if (text.includes("#")) return "route";
  if (text.length === 4) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 16) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function expHue(raw: ExpValue): ExpHue {
  const mail = expLane(raw);
  if (!mail) return "";
  if (mail === "home" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function expHome(raw: ExpValue): boolean {
  return expLane(raw) === "home";
}

export function expAway(raw: ExpValue): boolean {
  return expLane(raw) === "vacant";
}

export function expGuest(raw: ExpValue): boolean {
  return expLane(raw) === "hold";
}

export function expCitizen(raw: ExpValue): boolean {
  return expLane(raw) === "guest";
}

export function expDesk(raw: ExpValue): boolean {
  return expLane(raw) === "desk";
}

export function expJoin(raw: ExpValue): boolean {
  return expLane(raw) === "join";
}

export function expRoute(raw: ExpValue): boolean {
  return expLane(raw) === "route";
}

export function expBrief(raw: ExpValue): boolean {
  return expLane(raw) === "brief";
}

export function expLong(raw: ExpValue): boolean {
  return expLane(raw) === "long";
}

export function expStampMark(raw: ExpValue): boolean {
  return expLane(raw) === "stamp";
}

export function expVowelLane(raw: ExpValue): boolean {
  return expLane(raw) === "vowel";
}

export function expPlain(raw: ExpValue): boolean {
  return expLane(raw) === "plain";
}

export function expOpen(raw: ExpValue): boolean {
  return expState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function expHeld(raw: ExpValue): boolean {
  const mail = expLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function expSoon(raw: ExpValue): boolean {
  if (expState(raw) !== "set") return false;
  if (expBrief(raw)) return true;
  if (expHome(raw) || expAway(raw) || expGuest(raw) || expCitizen(raw)) return false;
  return codeGiven(raw).length === 8;
}

export function expLength(raw: ExpValue): number | null {
  if (expState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function expEven(raw: ExpValue): boolean {
  const length = expLength(raw);
  return length !== null && length % 2 === 0;
}

export function expOdd(raw: ExpValue): boolean {
  const length = expLength(raw);
  return length !== null && length % 2 === 1;
}

export function expFirst(raw: ExpValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function expTail(raw: ExpValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function expCapital(raw: ExpValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function expSpace(raw: ExpValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function expVowel(raw: ExpValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function expDigit(raw: ExpValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function expLetter(raw: ExpValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function expMixed(raw: ExpValue): boolean {
  return expDigit(raw) && expLetter(raw);
}

export function expLower(raw: ExpValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function expUpper(raw: ExpValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function expStamp(raw: ExpValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function expCopy(raw: ExpValue): string {
  return codeGiven(raw);
}

export function expFamily(raw: ExpValue): string {
  if (expState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function expLanes(rows: readonly ExpRow[]): ExpLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = expLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingExp(rows: readonly ExpRow[]): string {
  const lines = expLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingExpHue(rows: readonly ExpRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = expHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneExpCount(rows: readonly ExpRow[], mail: ExpLane): number {
  return rows.filter((row) => expLane(row.code) === mail).length;
}

export function expShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentExpLanes(rows: readonly ExpRow[]): string[] {
  return expLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenExp(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedExp(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleExp(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleExpReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkExpReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleExpLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: ExpRow, shape: ExpShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return expHome(row.code);
  if (shape === "vacant") return expAway(row.code);
  if (shape === "hold") return expGuest(row.code);
  if (shape === "guest") return expCitizen(row.code);
  if (shape === "join") return expJoin(row.code);
  if (shape === "route") return expRoute(row.code);
  if (shape === "brief") return expBrief(row.code);
  if (shape === "long") return expLong(row.code);
  if (shape === "stamp") return expStampMark(row.code);
  if (shape === "vowel") return expVowelLane(row.code);
  if (shape === "plain") return expPlain(row.code);
  if (shape === "open") return expOpen(row.code);
  if (shape === "soon") return expSoon(row.code);
  if (shape === "letter") return expLetter(row.code);
  if (shape === "mixed") return expMixed(row.code);
  if (shape === "upper") return expUpper(row.code);
  if (shape === "lower") return expLower(row.code);
  if (shape === "space") return expSpace(row.code);
  if (shape === "even") return expEven(row.code);
  if (shape === "odd") return expOdd(row.code);
  if (shape === "tail") return expTail(row.code);
  if (shape === "first") return expFirst(row.code);
  if (shape === "held") return expHeld(row.code);
  return expLane(row.code) === shape;
}

export function visibleExp(
  rows: readonly ExpRow[],
  mail: string,
  hue: string,
  query: string,
  review: ExpReview,
  reviewed: readonly string[],
  shape: ExpShape,
): ExpRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (expState(row.code) === "") return false;
    const found = expLane(row.code);
    const hueName = expHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${expStamp(row.code)} ${expFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function expLanesCsv(rows: readonly ExpRow[]): string {
  const lines = ["lane,count"];
  for (const line of expLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function expRowsCsv(rows: readonly ExpRow[], reviewed: readonly string[]): string {
  const lines = ["name,birthDate,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(expCopy(row.code)),
        expStamp(row.code),
        csvCell(expFamily(row.code)),
        expLane(row.code),
        expHue(row.code),
        expLength(row.code) ?? "",
        expHome(row.code) ? "1" : "0",
        expAway(row.code) ? "1" : "0",
        expGuest(row.code) ? "1" : "0",
        expDesk(row.code) ? "1" : "0",
        expCitizen(row.code) ? "1" : "0",
        expJoin(row.code) ? "1" : "0",
        expRoute(row.code) ? "1" : "0",
        expBrief(row.code) ? "1" : "0",
        expEven(row.code) ? "1" : "0",
        expDigit(row.code) ? "1" : "0",
        expMixed(row.code) ? "1" : "0",
        expUpper(row.code) ? "1" : "0",
        expVowel(row.code) ? "1" : "0",
        expTail(row.code) ? "1" : "0",
        expHeld(row.code) ? "1" : "0",
        expSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
