/**
 * Lever rules for a Swiss lever escapement kept in this browser, and street plates read the address already stored on the account.
 * Modes are draw, bank, roller, and guard. Finishes are gilt, ivory, and graphite.
 * Angles are 3, 6, 9, or 12. Pins are 2, 3, or 5.
 * Draw and bank are inner. Roller and guard are outer.
 * A known street is LANE, COURT, MEWS, or YARD. An ampersand joins two streets. A comma marks a pause.
 * A brief street is exactly four characters. A long street is fourteen characters or longer. An index starts with a digit. A vowel street starts with a vowel.
 * A true street reads as LANE. An empty street reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_lever (
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
 * CREATE TABLE crm_street_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_street_review (
 *   trader_id text primary key
 * );
 */
export const LVR_KEY = "crmv4-lever";
export const LVR_VIEW_KEY = "crmv4-lever-views";
export const LVR_DENSITY_KEY = "crmv4-lever-density";
export const LVR_MODES = ["draw", "bank", "roller", "guard"] as const;

export type LeverMode = (typeof LVR_MODES)[number];
export type LeverFilm = "blank" | "gilt" | "ivory" | "graphite";
export type LeverTray = "board" | "peg" | "coffer";
export type LeverDensity = "airy" | "close";
export type LeverSort = "piece" | "setter";

export type Lever = {
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

export type LeverView = {
  id: string;
  name: string;
  tray: LeverTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type LeverCounts = {
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

export const ROUND343_FEATURES = [
  "lever-save",
  "draw-notices",
  "lever-modes",
  "lever-search",
  "angle-sla",
  "casket-file",
  "pin-and-star",
  "inline-title",
  "lever-filters",
  "saved-lever-views",
  "lever-density",
  "keeper-sort",
  "lever-kpis",
  "angle-chart",
  "angle-timeline",
  "lever-bulk",
  "lever-csv",
  "lever-keys",
  "lever-audit",
  "fair-keeper",
  "lever-viewer",
  "suggest-draw",
  "overdue-angles",
  "street-plate",
  "street-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 6, 9, 12] as const;
const LOCK_CYCLE = [2, 3, 5] as const;
const INNER = new Set(["draw", "bank"]);
const OUTER = new Set(["roller", "guard"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["LANE", "COURT", "MEWS", "YARD"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LeverTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<LeverFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<LeverFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[dg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Lever, tray: LeverTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return LVR_MODES.indexOf(piece as LeverMode);
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

export function leverMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (LVR_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function leverHour(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function leverHammer(raw: unknown): 2 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "3" && text !== "5") return null;
  return Number(text) as 2 | 3 | 5;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function leverFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function leverInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function leverOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function leverBand(piece: unknown): string {
  const text = leverMode(piece);
  if (!text) return "";
  if (text === "draw") return "pull";
  if (text === "bank") return "stop";
  if (text === "roller") return "jewel";
  return "dart";
}

/** Signed distance from one piece to another along the oscillator. */
export function leverGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(leverMode(from));
  const right = pieceIndex(leverMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(leverFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return leverHammer(lock) === 3;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return leverHammer(lock) === 5;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return leverMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = leverHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = leverFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = leverHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveLeverFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Lever[]): string {
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
export function suggestHour(cards: readonly Lever[], hour: number): 3 | 6 | 9 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 12 = 3;
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
  if (hour < 11) return 6;
  if (hour < 17) return 9;
  return 12;
}

export function suggestMode(hour: number): LeverMode {
  return hour < 9 ? "draw" : "guard";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Lever[], roster: string): string {
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

export function readLevers(raw: unknown): Lever[] {
  if (!Array.isArray(raw)) return [];
  const out: Lever[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Lever>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: leverMode(row.piece),
      drop: leverHour(row.drop),
      film: leverFilm(row.film),
      lock: leverHammer(row.lock) ?? 2,
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

export function addLever(
  cards: readonly Lever[],
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
): Lever[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readLevers([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: leverMode(card.piece),
      drop: leverHour(card.drop),
      film: leverFilm(card.film),
      lock: leverHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Lever[], id: string, edit: (card: Lever) => Lever): Lever[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editLever(cards: readonly Lever[], id: string, title: string): Lever[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editLeverNote(cards: readonly Lever[], id: string, note: string): Lever[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(leverFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setLeverFilm(cards: readonly Lever[], id: string, film: string): Lever[] {
  const next = leverFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setLeverRaised(cards: readonly Lever[], id: string, raised: boolean): Lever[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setLeverPin(cards: readonly Lever[], id: string, pinned: boolean): Lever[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setLeverCoffer(cards: readonly Lever[], id: string, coffered: boolean): Lever[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setLeverStar(cards: readonly Lever[], id: string, starred: boolean): Lever[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addLeverTag(cards: readonly Lever[], id: string, tag: string): Lever[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 3 | 6 | 9 | 12 {
  if (drop === null) return dir > 0 ? 3 : 12;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 3 | 5 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Lever[], id: string): Lever[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Lever[], id: string): Lever[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Lever[], id: string): Lever[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Lever[], id: string): Lever[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setLeverFocused(cards: readonly Lever[], id: string): Lever[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinLeverFocused(cards: readonly Lever[], id: string): Lever[] {
  return setLeverPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starLeverFocused(cards: readonly Lever[], id: string): Lever[] {
  return setLeverStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Lever[], id: string): Lever[] {
  const card = cards.find((item) => item.id === id);
  return card ? setLeverFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Lever[], ids: readonly string[], edit: (card: Lever) => Lever): Lever[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkLeverGraphite(cards: readonly Lever[], ids: readonly string[]): Lever[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkLeverRaise(cards: readonly Lever[], ids: readonly string[]): Lever[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkLeverCoffer(cards: readonly Lever[], ids: readonly string[]): Lever[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkLeverTag(cards: readonly Lever[], ids: readonly string[]): Lever[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readLeverViews(raw: unknown): LeverView[] {
  if (!Array.isArray(raw)) return [];
  const out: LeverView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LeverView>;
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

export function addLeverView(views: readonly LeverView[], view: LeverView): LeverView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readLeverViews([...views, { ...view, id, name }]);
}

export function dropLeverView(views: readonly LeverView[], id: string): LeverView[] {
  return views.filter((view) => view.id !== id);
}

export function leverDensity(raw: unknown): LeverDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortLevers(cards: readonly Lever[], sort: LeverSort): Lever[] {
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

export function visibleLevers(
  cards: readonly Lever[],
  tray: LeverTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Lever[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : leverFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !leverInner(card.piece)) return false;
    if (wantLimb === "outer" && !leverOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueLever(card: Lever): boolean {
  return leverOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleLever(card: Lever): boolean {
  return !card.film && card.drop === 3 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskLever(card: Lever): boolean {
  return card.film === "GILT" && card.drop === 12 && card.lock === 5 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingLever(card: Lever): boolean {
  return card.piece === "guard" && card.film === "IVORY" && card.drop === 6;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateLever(card: Lever, station: string): boolean {
  return card.piece === "draw" && leverMode(station) === "guard" && !card.raised;
}

export function leverCounts(cards: readonly Lever[], shown: readonly Lever[], station: string): LeverCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => leverInner(card.piece)).length,
    outer: cards.filter((card) => leverOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 12).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleLever).length,
    brisk: cards.filter(briskLever).length,
    resting: cards.filter(restingLever).length,
    overdue: cards.filter(overdueLever).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateLever(card, station)).length,
  };
}

export function leverBars(cards: readonly Lever[]): { piece: string; count: number }[] {
  return LVR_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function leverTimeline(cards: readonly Lever[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function leverKeepers(cards: readonly Lever[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Lever[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of leverKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderLevers(cards: readonly Lever[]): string[] {
  return cards.filter(overdueLever).map((card) => card.title);
}

export function leverCopy(card: Lever): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function leverCsv(cards: readonly Lever[], station: string): string {
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
        leverOuter(card.piece) ? "1" : "0",
        lateLever(card, station) ? "1" : "0",
        idleLever(card) ? "1" : "0",
        briskLever(card) ? "1" : "0",
        restingLever(card) ? "1" : "0",
        overdueLever(card) ? "1" : "0",
        leverInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        leverBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const STT_KEY = "crmv4-street-hide";
export const STT_REVIEW_KEY = "crmv4-street-review";

export type StreetLane = "" | "lane" | "court" | "mews" | "yard" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type StreetHue = "" | "ivory" | "graphite" | "champagne";
export type StreetState = "" | "clear" | "set";
export type StreetReview = "all" | "reviewed" | "fresh";
export type StreetShape =
  | "all"
  | "lane"
  | "court"
  | "mews"
  | "yard"
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

export type StreetValue = string | { address?: unknown; [key: string]: unknown } | null | undefined;
export type StreetRow = { id: string; label: string; code: StreetValue };
export type StreetLaneLine = { lane: string; count: number };

const RESIDENCY_LANES = ["lane", "court", "mews", "yard", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: StreetValue): { address?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: StreetValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: StreetValue): string {
  const row = codeRecord(raw);
  if (row && !("address" in row)) return "";
  const value = row ? row.address : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LANE";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: StreetValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("address" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function streetState(raw: StreetValue): StreetState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known street is LANE, COURT, MEWS, or YARD. An ampersand joins two streets. A comma marks a pause. A brief street is exactly four characters. A long street is fourteen characters or longer. An index starts with a digit. A vowel street starts with a vowel. */
export function streetLane(raw: StreetValue): StreetLane {
  if (streetState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "LANE") return "lane";
    if (upper === "COURT") return "court";
    if (upper === "MEWS") return "mews";
    return "yard";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(",")) return "gap";
  if (text.length === 4) return "brief";
  if (text.length >= 14) return "long";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function streetHue(raw: StreetValue): StreetHue {
  const lane = streetLane(raw);
  if (!lane) return "";
  if (lane === "lane" || lane === "mews") return "champagne";
  if (lane === "court" || lane === "yard" || lane === "join" || lane === "gap" || lane === "long") return "graphite";
  return "ivory";
}

export function streetHome(raw: StreetValue): boolean {
  return streetLane(raw) === "lane";
}

export function streetAway(raw: StreetValue): boolean {
  return streetLane(raw) === "court";
}

export function streetGuest(raw: StreetValue): boolean {
  return streetLane(raw) === "mews";
}

export function streetCitizen(raw: StreetValue): boolean {
  return streetLane(raw) === "yard";
}

export function streetJoin(raw: StreetValue): boolean {
  return streetLane(raw) === "join";
}

export function streetGap(raw: StreetValue): boolean {
  return streetLane(raw) === "gap";
}

export function streetBrief(raw: StreetValue): boolean {
  return streetLane(raw) === "brief";
}

export function streetLong(raw: StreetValue): boolean {
  return streetLane(raw) === "long";
}

export function streetMark(raw: StreetValue): boolean {
  return streetLane(raw) === "mark";
}

export function streetVowelLane(raw: StreetValue): boolean {
  return streetLane(raw) === "vowel";
}

export function streetPlain(raw: StreetValue): boolean {
  return streetLane(raw) === "plain";
}

export function streetOpen(raw: StreetValue): boolean {
  return streetState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function streetHeld(raw: StreetValue): boolean {
  const lane = streetLane(raw);
  return lane === "long" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function streetSoon(raw: StreetValue): boolean {
  if (streetState(raw) !== "set") return false;
  if (streetBrief(raw)) return true;
  if (streetHome(raw) || streetAway(raw) || streetGuest(raw) || streetCitizen(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function streetLength(raw: StreetValue): number | null {
  if (streetState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function streetEven(raw: StreetValue): boolean {
  const length = streetLength(raw);
  return length !== null && length % 2 === 0;
}

export function streetOdd(raw: StreetValue): boolean {
  const length = streetLength(raw);
  return length !== null && length % 2 === 1;
}

export function streetFirst(raw: StreetValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function streetTail(raw: StreetValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function streetCapital(raw: StreetValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function streetSpace(raw: StreetValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function streetVowel(raw: StreetValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function streetDigit(raw: StreetValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function streetLetter(raw: StreetValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function streetMixed(raw: StreetValue): boolean {
  return streetDigit(raw) && streetLetter(raw);
}

export function streetLower(raw: StreetValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function streetUpper(raw: StreetValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function streetStamp(raw: StreetValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function streetCopy(raw: StreetValue): string {
  return codeGiven(raw);
}

export function streetFamily(raw: StreetValue): string {
  if (streetState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function streetLanes(rows: readonly StreetRow[]): StreetLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of RESIDENCY_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = streetLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return RESIDENCY_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingStreet(rows: readonly StreetRow[]): string {
  const lines = streetLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.lane as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.lane as (typeof RESIDENCY_LANES)[number]))[0].lane;
}

export function leadingStreetHue(rows: readonly StreetRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = streetHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneStreetCount(rows: readonly StreetRow[], lane: StreetLane): number {
  return rows.filter((row) => streetLane(row.code) === lane).length;
}

export function streetShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentStreetLanes(rows: readonly StreetRow[]): string[] {
  return streetLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenStreet(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedStreet(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleStreet(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleStreetReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkStreetReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleStreetLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: StreetRow, shape: StreetShape): boolean {
  if (shape === "all") return true;
  if (shape === "lane") return streetHome(row.code);
  if (shape === "court") return streetAway(row.code);
  if (shape === "mews") return streetGuest(row.code);
  if (shape === "yard") return streetCitizen(row.code);
  if (shape === "join") return streetJoin(row.code);
  if (shape === "gap") return streetGap(row.code);
  if (shape === "brief") return streetBrief(row.code);
  if (shape === "long") return streetLong(row.code);
  if (shape === "mark") return streetMark(row.code);
  if (shape === "vowel") return streetVowelLane(row.code);
  if (shape === "plain") return streetPlain(row.code);
  if (shape === "open") return streetOpen(row.code);
  if (shape === "soon") return streetSoon(row.code);
  if (shape === "letter") return streetLetter(row.code);
  if (shape === "mixed") return streetMixed(row.code);
  if (shape === "upper") return streetUpper(row.code);
  if (shape === "lower") return streetLower(row.code);
  if (shape === "space") return streetSpace(row.code);
  if (shape === "even") return streetEven(row.code);
  if (shape === "odd") return streetOdd(row.code);
  if (shape === "tail") return streetTail(row.code);
  if (shape === "first") return streetFirst(row.code);
  if (shape === "held") return streetHeld(row.code);
  return streetLane(row.code) === shape;
}

export function visibleStreet(
  rows: readonly StreetRow[],
  lane: string,
  hue: string,
  query: string,
  review: StreetReview,
  reviewed: readonly string[],
  shape: StreetShape,
): StreetRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (streetState(row.code) === "") return false;
    const found = streetLane(row.code);
    const hueName = streetHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${streetStamp(row.code)} ${streetFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function streetLanesCsv(rows: readonly StreetRow[]): string {
  const lines = ["lane,count"];
  for (const line of streetLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function streetRowsCsv(rows: readonly StreetRow[], reviewed: readonly string[]): string {
  const lines = ["name,street,stamp,family,lane,hue,length,laneMark,court,mews,yard,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(streetCopy(row.code)),
        streetStamp(row.code),
        csvCell(streetFamily(row.code)),
        streetLane(row.code),
        streetHue(row.code),
        streetLength(row.code) ?? "",
        streetHome(row.code) ? "1" : "0",
        streetAway(row.code) ? "1" : "0",
        streetGuest(row.code) ? "1" : "0",
        streetCitizen(row.code) ? "1" : "0",
        streetJoin(row.code) ? "1" : "0",
        streetGap(row.code) ? "1" : "0",
        streetBrief(row.code) ? "1" : "0",
        streetEven(row.code) ? "1" : "0",
        streetDigit(row.code) ? "1" : "0",
        streetMixed(row.code) ? "1" : "0",
        streetUpper(row.code) ? "1" : "0",
        streetVowel(row.code) ? "1" : "0",
        streetTail(row.code) ? "1" : "0",
        streetHeld(row.code) ? "1" : "0",
        streetSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
