/**
 * Chronograph rules for a column-wheel timer kept in this browser, and timezone plates read the timezone already stored on the account.
 * Modes are column, clutch, heart, and brake. Finishes are gilt, ivory, and graphite.
 * Sweeps are 4, 8, 12, or 16. Studs are 3, 6, or 12.
 * Column and clutch are inner. Heart and brake are outer.
 * A known timezone mark is UTC, CET, EET, or TRT. A slash joins two parts. A hyphen marks a pause.
 * A brief timezone is exactly three characters. A stamp starts with a digit. A long timezone is sixteen characters or longer and does not start with a digit. A vowel timezone starts with a vowel.
 * A true timezone reads as UTC. An empty timezone reads as NONE. The plate does not change the saved timezone.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_chronograph (
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
 * CREATE TABLE crm_timezone_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_timezone_review (
 *   trader_id text primary key
 * );
 */
export const CHG_KEY = "crmv4-chronograph";
export const CHG_VIEW_KEY = "crmv4-chronograph-views";
export const CHG_DENSITY_KEY = "crmv4-chronograph-density";
export const CHG_MODES = ["column", "clutch", "heart", "brake"] as const;

export type ChronographMode = (typeof CHG_MODES)[number];
export type ChronographFilm = "blank" | "gilt" | "ivory" | "graphite";
export type ChronographTray = "board" | "peg" | "coffer";
export type ChronographDensity = "airy" | "close";
export type ChronographSort = "piece" | "setter";

export type Chronograph = {
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

export type ChronographView = {
  id: string;
  name: string;
  tray: ChronographTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type ChronographCounts = {
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

export const ROUND348_FEATURES = [
  "chronograph-save",
  "column-reminders",
  "chronograph-modes",
  "chronograph-search",
  "chronograph-pin-sla",
  "column-archive",
  "chronograph-latch-star",
  "chronograph-inline-title",
  "chronograph-filters",
  "saved-chronograph-views",
  "chronograph-density",
  "keeper-order",
  "chronograph-kpis",
  "column-chart",
  "column-timeline",
  "chronograph-bulk",
  "chronograph-csv",
  "chronograph-keys",
  "chronograph-audit",
  "fair-timekeeper",
  "chronograph-viewer",
  "suggest-column",
  "overdue-columns",
  "timezone-plate",
  "timezone-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 12, 16] as const;
const LOCK_CYCLE = [3, 6, 12] as const;
const INNER = new Set(["column", "clutch"]);
const OUTER = new Set(["heart", "brake"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["UTC", "CET", "EET", "TRT"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ChronographTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<ChronographFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<ChronographFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ch]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Chronograph, tray: ChronographTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return CHG_MODES.indexOf(piece as ChronographMode);
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

export function chronographMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CHG_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function chronographHour(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function chronographHammer(raw: unknown): 3 | 6 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12") return null;
  return Number(text) as 3 | 6 | 12;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function chronographFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function chronographInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function chronographOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function chronographBand(piece: unknown): string {
  const text = chronographMode(piece);
  if (!text) return "";
  if (text === "column") return "pillar";
  if (text === "clutch") return "mesh";
  if (text === "heart") return "cam";
  return "shoe";
}

/** Signed distance from one piece to another along the oscillator. */
export function chronographGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(chronographMode(from));
  const right = pieceIndex(chronographMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(chronographFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return chronographHammer(lock) === 6;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return chronographHammer(lock) === 12;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return chronographMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = chronographHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = chronographFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = chronographHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveChronographFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Chronograph[]): string {
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
export function suggestHour(cards: readonly Chronograph[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 16 = 4;
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
  if (hour < 18) return 12;
  return 16;
}

export function suggestMode(hour: number): ChronographMode {
  return hour < 12 ? "column" : "brake";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Chronograph[], roster: string): string {
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

export function readChronographs(raw: unknown): Chronograph[] {
  if (!Array.isArray(raw)) return [];
  const out: Chronograph[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chronograph>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: chronographMode(row.piece),
      drop: chronographHour(row.drop),
      film: chronographFilm(row.film),
      lock: chronographHammer(row.lock) ?? 3,
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

export function addChronograph(
  cards: readonly Chronograph[],
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
): Chronograph[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readChronographs([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: chronographMode(card.piece),
      drop: chronographHour(card.drop),
      film: chronographFilm(card.film),
      lock: chronographHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Chronograph[], id: string, edit: (card: Chronograph) => Chronograph): Chronograph[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editChronograph(cards: readonly Chronograph[], id: string, title: string): Chronograph[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editChronographNote(cards: readonly Chronograph[], id: string, note: string): Chronograph[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(chronographFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setChronographFilm(cards: readonly Chronograph[], id: string, film: string): Chronograph[] {
  const next = chronographFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setChronographRaised(cards: readonly Chronograph[], id: string, raised: boolean): Chronograph[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setChronographPin(cards: readonly Chronograph[], id: string, pinned: boolean): Chronograph[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setChronographCoffer(cards: readonly Chronograph[], id: string, coffered: boolean): Chronograph[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setChronographStar(cards: readonly Chronograph[], id: string, starred: boolean): Chronograph[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addChronographTag(cards: readonly Chronograph[], id: string, tag: string): Chronograph[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 4 | 8 | 12 | 16 {
  if (drop === null) return dir > 0 ? 4 : 16;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 12 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setChronographFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinChronographFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return setChronographPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starChronographFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  return setChronographStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Chronograph[], id: string): Chronograph[] {
  const card = cards.find((item) => item.id === id);
  return card ? setChronographFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Chronograph[], ids: readonly string[], edit: (card: Chronograph) => Chronograph): Chronograph[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkChronographGraphite(cards: readonly Chronograph[], ids: readonly string[]): Chronograph[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkChronographRaise(cards: readonly Chronograph[], ids: readonly string[]): Chronograph[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkChronographCoffer(cards: readonly Chronograph[], ids: readonly string[]): Chronograph[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkChronographTag(cards: readonly Chronograph[], ids: readonly string[]): Chronograph[] {
  return bulk(cards, ids, (card) => (card.tags.includes("h") ? card : { ...card, tags: tagsOf([...card.tags, "h"]), audit: "tag" }));
}

export function readChronographViews(raw: unknown): ChronographView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChronographView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChronographView>;
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

export function addChronographView(views: readonly ChronographView[], view: ChronographView): ChronographView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readChronographViews([...views, { ...view, id, name }]);
}

export function dropChronographView(views: readonly ChronographView[], id: string): ChronographView[] {
  return views.filter((view) => view.id !== id);
}

export function chronographDensity(raw: unknown): ChronographDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortChronographs(cards: readonly Chronograph[], sort: ChronographSort): Chronograph[] {
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

export function visibleChronographs(
  cards: readonly Chronograph[],
  tray: ChronographTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Chronograph[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : chronographFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !chronographInner(card.piece)) return false;
    if (wantLimb === "outer" && !chronographOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueChronograph(card: Chronograph): boolean {
  return chronographOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleChronograph(card: Chronograph): boolean {
  return !card.film && card.drop === 4 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskChronograph(card: Chronograph): boolean {
  return card.film === "GILT" && card.drop === 16 && card.lock === 12 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingChronograph(card: Chronograph): boolean {
  return card.piece === "brake" && card.film === "IVORY" && card.drop === 8;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateChronograph(card: Chronograph, station: string): boolean {
  return card.piece === "column" && chronographMode(station) === "brake" && !card.raised;
}

export function chronographCounts(cards: readonly Chronograph[], shown: readonly Chronograph[], station: string): ChronographCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => chronographInner(card.piece)).length,
    outer: cards.filter((card) => chronographOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 16).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleChronograph).length,
    brisk: cards.filter(briskChronograph).length,
    resting: cards.filter(restingChronograph).length,
    overdue: cards.filter(overdueChronograph).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateChronograph(card, station)).length,
  };
}

export function chronographBars(cards: readonly Chronograph[]): { piece: string; count: number }[] {
  return CHG_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function chronographTimeline(cards: readonly Chronograph[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function chronographKeepers(cards: readonly Chronograph[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Chronograph[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of chronographKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderChronographs(cards: readonly Chronograph[]): string[] {
  return cards.filter(overdueChronograph).map((card) => card.title);
}

export function chronographCopy(card: Chronograph): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function chronographCsv(cards: readonly Chronograph[], station: string): string {
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
        chronographOuter(card.piece) ? "1" : "0",
        lateChronograph(card, station) ? "1" : "0",
        idleChronograph(card) ? "1" : "0",
        briskChronograph(card) ? "1" : "0",
        restingChronograph(card) ? "1" : "0",
        overdueChronograph(card) ? "1" : "0",
        chronographInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        chronographBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const TZN_KEY = "crmv4-timezone-hide";
export const TZN_REVIEW_KEY = "crmv4-timezone-review";

export type TimezoneLane = "" | "utc" | "cet" | "eet" | "trt" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type TimezoneHue = "" | "ivory" | "graphite" | "champagne";
export type TimezoneState = "" | "clear" | "set";
export type TimezoneReview = "all" | "reviewed" | "fresh";
export type TimezoneShape =
  | "all"
  | "utc"
  | "cet"
  | "eet"
  | "trt"
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

export type TimezoneValue = string | { timezone?: unknown; [key: string]: unknown } | null | undefined;
export type TimezoneRow = { id: string; label: string; code: TimezoneValue };
export type TimezoneLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["utc", "cet", "eet", "trt", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: TimezoneValue): { timezone?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: TimezoneValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: TimezoneValue): string {
  const row = codeRecord(raw);
  if (row && !("timezone" in row)) return "";
  const value = row ? row.timezone : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "UTC";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: TimezoneValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("timezone" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function timezoneState(raw: TimezoneValue): TimezoneState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known timezone is UTC, CET, EET, or TRT. A slash joins two parts. A hyphen marks a pause. A brief timezone is exactly three characters. A stamp starts with a digit. A long timezone is sixteen characters or longer and does not start with a digit. A vowel timezone starts with a vowel. */
export function timezoneLane(raw: TimezoneValue): TimezoneLane {
  if (timezoneState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "UTC") return "utc";
    if (upper === "CET") return "cet";
    if (upper === "EET") return "eet";
    return "trt";
  }
  if (text === "NONE") return "plain";
  if (text.includes("/")) return "join";
  if (text.includes("-")) return "gap";
  if (text.length === 3) return "brief";
  if (/^[0-9]/.test(text)) return "mark";
  if (text.length >= 16) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function timezoneHue(raw: TimezoneValue): TimezoneHue {
  const mail = timezoneLane(raw);
  if (!mail) return "";
  if (mail === "utc" || mail === "eet") return "champagne";
  if (mail === "cet" || mail === "trt" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function timezoneHome(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "utc";
}

export function timezoneAway(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "cet";
}

export function timezoneGuest(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "eet";
}

export function timezoneCitizen(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "trt";
}

export function timezoneJoin(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "join";
}

export function timezoneGap(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "gap";
}

export function timezoneBrief(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "brief";
}

export function timezoneLong(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "long";
}

export function timezoneMark(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "mark";
}

export function timezoneVowelLane(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "vowel";
}

export function timezonePlain(raw: TimezoneValue): boolean {
  return timezoneLane(raw) === "plain";
}

export function timezoneOpen(raw: TimezoneValue): boolean {
  return timezoneState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function timezoneHeld(raw: TimezoneValue): boolean {
  const mail = timezoneLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function timezoneSoon(raw: TimezoneValue): boolean {
  if (timezoneState(raw) !== "set") return false;
  if (timezoneBrief(raw)) return true;
  if (timezoneHome(raw) || timezoneAway(raw) || timezoneGuest(raw) || timezoneCitizen(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function timezoneLength(raw: TimezoneValue): number | null {
  if (timezoneState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function timezoneEven(raw: TimezoneValue): boolean {
  const length = timezoneLength(raw);
  return length !== null && length % 2 === 0;
}

export function timezoneOdd(raw: TimezoneValue): boolean {
  const length = timezoneLength(raw);
  return length !== null && length % 2 === 1;
}

export function timezoneFirst(raw: TimezoneValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function timezoneTail(raw: TimezoneValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function timezoneCapital(raw: TimezoneValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function timezoneSpace(raw: TimezoneValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function timezoneVowel(raw: TimezoneValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function timezoneDigit(raw: TimezoneValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function timezoneLetter(raw: TimezoneValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function timezoneMixed(raw: TimezoneValue): boolean {
  return timezoneDigit(raw) && timezoneLetter(raw);
}

export function timezoneLower(raw: TimezoneValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function timezoneUpper(raw: TimezoneValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function timezoneStamp(raw: TimezoneValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function timezoneCopy(raw: TimezoneValue): string {
  return codeGiven(raw);
}

export function timezoneFamily(raw: TimezoneValue): string {
  if (timezoneState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function timezoneLanes(rows: readonly TimezoneRow[]): TimezoneLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = timezoneLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingTimezone(rows: readonly TimezoneRow[]): string {
  const lines = timezoneLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingTimezoneHue(rows: readonly TimezoneRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = timezoneHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneTimezoneCount(rows: readonly TimezoneRow[], mail: TimezoneLane): number {
  return rows.filter((row) => timezoneLane(row.code) === mail).length;
}

export function timezoneShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTimezoneLanes(rows: readonly TimezoneRow[]): string[] {
  return timezoneLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenTimezone(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTimezone(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTimezone(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleTimezoneReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTimezoneReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTimezoneLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: TimezoneRow, shape: TimezoneShape): boolean {
  if (shape === "all") return true;
  if (shape === "utc") return timezoneHome(row.code);
  if (shape === "cet") return timezoneAway(row.code);
  if (shape === "eet") return timezoneGuest(row.code);
  if (shape === "trt") return timezoneCitizen(row.code);
  if (shape === "join") return timezoneJoin(row.code);
  if (shape === "gap") return timezoneGap(row.code);
  if (shape === "brief") return timezoneBrief(row.code);
  if (shape === "long") return timezoneLong(row.code);
  if (shape === "mark") return timezoneMark(row.code);
  if (shape === "vowel") return timezoneVowelLane(row.code);
  if (shape === "plain") return timezonePlain(row.code);
  if (shape === "open") return timezoneOpen(row.code);
  if (shape === "soon") return timezoneSoon(row.code);
  if (shape === "letter") return timezoneLetter(row.code);
  if (shape === "mixed") return timezoneMixed(row.code);
  if (shape === "upper") return timezoneUpper(row.code);
  if (shape === "lower") return timezoneLower(row.code);
  if (shape === "space") return timezoneSpace(row.code);
  if (shape === "even") return timezoneEven(row.code);
  if (shape === "odd") return timezoneOdd(row.code);
  if (shape === "tail") return timezoneTail(row.code);
  if (shape === "first") return timezoneFirst(row.code);
  if (shape === "held") return timezoneHeld(row.code);
  return timezoneLane(row.code) === shape;
}

export function visibleTimezone(
  rows: readonly TimezoneRow[],
  mail: string,
  hue: string,
  query: string,
  review: TimezoneReview,
  reviewed: readonly string[],
  shape: TimezoneShape,
): TimezoneRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (timezoneState(row.code) === "") return false;
    const found = timezoneLane(row.code);
    const hueName = timezoneHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${timezoneStamp(row.code)} ${timezoneFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function timezoneLanesCsv(rows: readonly TimezoneRow[]): string {
  const lines = ["lane,count"];
  for (const line of timezoneLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function timezoneRowsCsv(rows: readonly TimezoneRow[], reviewed: readonly string[]): string {
  const lines = ["name,timezone,stamp,family,lane,hue,length,utc,cet,eet,trt,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(timezoneCopy(row.code)),
        timezoneStamp(row.code),
        csvCell(timezoneFamily(row.code)),
        timezoneLane(row.code),
        timezoneHue(row.code),
        timezoneLength(row.code) ?? "",
        timezoneHome(row.code) ? "1" : "0",
        timezoneAway(row.code) ? "1" : "0",
        timezoneGuest(row.code) ? "1" : "0",
        timezoneCitizen(row.code) ? "1" : "0",
        timezoneJoin(row.code) ? "1" : "0",
        timezoneGap(row.code) ? "1" : "0",
        timezoneBrief(row.code) ? "1" : "0",
        timezoneEven(row.code) ? "1" : "0",
        timezoneDigit(row.code) ? "1" : "0",
        timezoneMixed(row.code) ? "1" : "0",
        timezoneUpper(row.code) ? "1" : "0",
        timezoneVowel(row.code) ? "1" : "0",
        timezoneTail(row.code) ? "1" : "0",
        timezoneHeld(row.code) ? "1" : "0",
        timezoneSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
