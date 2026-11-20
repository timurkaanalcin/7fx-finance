/**
 * Regulator rules for separate pinion, arbor, sweep, and window dials kept in this browser,
 * and country plates read lastCountry already stored on the account.
 * Modes are pinion, arbor, sweep, and window. Finishes are gilt, ivory, and graphite.
 * Steps are 6, 12, 24, or 48. Studs are 1, 3, or 6.
 * Pinion and arbor are main. Sweep and window are side.
 * A known country code is TR, DE, RU, or AE, including TUR, GER, RUS, and UAE.
 * A plus joins two codes. A slash marks a route.
 * A brief code is exactly three characters. A stamp starts with a digit.
 * A long code is twelve characters or longer and does not start with a digit. A vowel code starts with a vowel.
 * A true code reads as TR. A false code reads as OPEN. The plate does not change the saved country.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_regulator (
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
 * CREATE TABLE crm_lco_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_lco_review (
 *   trader_id text primary key
 * );
 */

export const RGR_KEY = "crmv4-regulator";
export const RGR_VIEW_KEY = "crmv4-regulator-views";
export const RGR_DENSITY_KEY = "crmv4-regulator-density";
export const RGR_MODES = ["pinion", "arbor", "sweep", "window"] as const;

export type RegulatorMode = (typeof RGR_MODES)[number];
export type RegulatorFilm = "blank" | "gilt" | "ivory" | "graphite";
export type RegulatorTray = "board" | "peg" | "coffer";
export type RegulatorDensity = "airy" | "close";
export type RegulatorSort = "piece" | "setter";

export type Regulator = {
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

export type RegulatorView = {
  id: string;
  name: string;
  tray: RegulatorTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type RegulatorCounts = {
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

export const ROUND352_FEATURES = [
  "regulator-save",
  "dial-reminders",
  "regulator-modes",
  "regulator-search",
  "regulator-pin-sla",
  "dial-archive",
  "regulator-latch-star",
  "regulator-inline-title",
  "regulator-filters",
  "saved-regulator-views",
  "regulator-density",
  "dial-focus",
  "regulator-kpis",
  "dial-chart",
  "dial-timeline",
  "regulator-bulk",
  "regulator-csv",
  "regulator-keys",
  "regulator-audit",
  "calm-keeper",
  "regulator-viewer",
  "suggest-dial",
  "overdue-dials",
  "country-plate",
  "country-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [6, 12, 24, 48] as const;
const LOCK_CYCLE = [1, 3, 6] as const;
const INNER = new Set(["pinion", "arbor"]);
const OUTER = new Set(["sweep", "window"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const COUNTRY_ALIAS: Record<string, "TR" | "DE" | "RU" | "AE"> = {
  TR: "TR",
  TUR: "TR",
  COUNTRY_TR: "TR",
  DE: "DE",
  GER: "DE",
  COUNTRY_DE: "DE",
  RU: "RU",
  RUS: "RU",
  COUNTRY_RU: "RU",
  AE: "AE",
  UAE: "AE",
  COUNTRY_AE: "AE",
};
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RegulatorTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<RegulatorFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<RegulatorFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[hs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Regulator, tray: RegulatorTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return RGR_MODES.indexOf(piece as RegulatorMode);
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

export function regulatorMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RGR_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function regulatorHour(raw: unknown): 6 | 12 | 24 | 48 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "12" && text !== "24" && text !== "48") return null;
  return Number(text) as 6 | 12 | 24 | 48;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function regulatorHammer(raw: unknown): 1 | 3 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "6") return null;
  return Number(text) as 1 | 3 | 6;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function regulatorFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function regulatorInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function regulatorOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function regulatorBand(piece: unknown): string {
  const text = regulatorMode(piece);
  if (!text) return "";
  if (text === "pinion") return "hand";
  if (text === "arbor") return "arc";
  if (text === "sweep") return "fly";
  return "date";
}

/** Signed distance from one piece to another along the oscillator. */
export function regulatorGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(regulatorMode(from));
  const right = pieceIndex(regulatorMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(regulatorFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return regulatorHammer(lock) === 3;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return regulatorHammer(lock) === 6;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return regulatorMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = regulatorHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = regulatorFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = regulatorHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveRegulatorFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Regulator[]): string {
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
export function suggestHour(cards: readonly Regulator[], hour: number): 6 | 12 | 24 | 48 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 6 | 12 | 24 | 48 = 6;
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
  if (hour < 6) return 6;
  if (hour < 12) return 12;
  if (hour < 18) return 24;
  return 48;
}

export function suggestMode(hour: number): RegulatorMode {
  return hour < 6 ? "pinion" : "window";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Regulator[], roster: string): string {
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

export function readRegulators(raw: unknown): Regulator[] {
  if (!Array.isArray(raw)) return [];
  const out: Regulator[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Regulator>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: regulatorMode(row.piece),
      drop: regulatorHour(row.drop),
      film: regulatorFilm(row.film),
      lock: regulatorHammer(row.lock) ?? 1,
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

export function addRegulator(
  cards: readonly Regulator[],
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
): Regulator[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRegulators([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: regulatorMode(card.piece),
      drop: regulatorHour(card.drop),
      film: regulatorFilm(card.film),
      lock: regulatorHammer(card.lock) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Regulator[], id: string, edit: (card: Regulator) => Regulator): Regulator[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRegulator(cards: readonly Regulator[], id: string, title: string): Regulator[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRegulatorNote(cards: readonly Regulator[], id: string, note: string): Regulator[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(regulatorFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRegulatorFilm(cards: readonly Regulator[], id: string, film: string): Regulator[] {
  const next = regulatorFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setRegulatorRaised(cards: readonly Regulator[], id: string, raised: boolean): Regulator[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setRegulatorPin(cards: readonly Regulator[], id: string, pinned: boolean): Regulator[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setRegulatorCoffer(cards: readonly Regulator[], id: string, coffered: boolean): Regulator[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setRegulatorStar(cards: readonly Regulator[], id: string, starred: boolean): Regulator[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRegulatorTag(cards: readonly Regulator[], id: string, tag: string): Regulator[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 6 | 12 | 24 | 48 {
  if (drop === null) return dir > 0 ? 6 : 48;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 1 | 3 | 6 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setRegulatorFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinRegulatorFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return setRegulatorPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starRegulatorFocused(cards: readonly Regulator[], id: string): Regulator[] {
  return setRegulatorStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Regulator[], id: string): Regulator[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRegulatorFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Regulator[], ids: readonly string[], edit: (card: Regulator) => Regulator): Regulator[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRegulatorGraphite(cards: readonly Regulator[], ids: readonly string[]): Regulator[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkRegulatorRaise(cards: readonly Regulator[], ids: readonly string[]): Regulator[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkRegulatorCoffer(cards: readonly Regulator[], ids: readonly string[]): Regulator[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkRegulatorTag(cards: readonly Regulator[], ids: readonly string[]): Regulator[] {
  return bulk(cards, ids, (card) => (card.tags.includes("m") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readRegulatorViews(raw: unknown): RegulatorView[] {
  if (!Array.isArray(raw)) return [];
  const out: RegulatorView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RegulatorView>;
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

export function addRegulatorView(views: readonly RegulatorView[], view: RegulatorView): RegulatorView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRegulatorViews([...views, { ...view, id, name }]);
}

export function dropRegulatorView(views: readonly RegulatorView[], id: string): RegulatorView[] {
  return views.filter((view) => view.id !== id);
}

export function regulatorDensity(raw: unknown): RegulatorDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortRegulators(cards: readonly Regulator[], sort: RegulatorSort): Regulator[] {
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

export function visibleRegulators(
  cards: readonly Regulator[],
  tray: RegulatorTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Regulator[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : regulatorFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !regulatorInner(card.piece)) return false;
    if (wantLimb === "outer" && !regulatorOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueRegulator(card: Regulator): boolean {
  return regulatorOuter(card.piece) && card.lock === 1 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleRegulator(card: Regulator): boolean {
  return !card.film && card.drop === 6 && card.lock === 1 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskRegulator(card: Regulator): boolean {
  return card.film === "GILT" && card.drop === 48 && card.lock === 6 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingRegulator(card: Regulator): boolean {
  return card.piece === "window" && card.film === "IVORY" && card.drop === 12;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateRegulator(card: Regulator, station: string): boolean {
  return card.piece === "pinion" && regulatorMode(station) === "window" && !card.raised;
}

export function regulatorCounts(cards: readonly Regulator[], shown: readonly Regulator[], station: string): RegulatorCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => regulatorInner(card.piece)).length,
    outer: cards.filter((card) => regulatorOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 48).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRegulator).length,
    brisk: cards.filter(briskRegulator).length,
    resting: cards.filter(restingRegulator).length,
    overdue: cards.filter(overdueRegulator).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateRegulator(card, station)).length,
  };
}

export function regulatorBars(cards: readonly Regulator[]): { piece: string; count: number }[] {
  return RGR_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function regulatorTimeline(cards: readonly Regulator[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function regulatorKeepers(cards: readonly Regulator[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Regulator[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of regulatorKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRegulators(cards: readonly Regulator[]): string[] {
  return cards.filter(overdueRegulator).map((card) => card.title);
}

export function regulatorCopy(card: Regulator): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function regulatorCsv(cards: readonly Regulator[], station: string): string {
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
        regulatorOuter(card.piece) ? "1" : "0",
        lateRegulator(card, station) ? "1" : "0",
        idleRegulator(card) ? "1" : "0",
        briskRegulator(card) ? "1" : "0",
        restingRegulator(card) ? "1" : "0",
        overdueRegulator(card) ? "1" : "0",
        regulatorInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        regulatorBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const LCO_KEY = "crmv4-lco-hide";
export const LCO_REVIEW_KEY = "crmv4-lco-review";

export type LcoLane = "" | "home" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type LcoHue = "" | "ivory" | "graphite" | "champagne";
export type LcoState = "" | "clear" | "set";
export type LcoReview = "all" | "reviewed" | "fresh";
export type LcoShape =
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

export type LcoValue = string | { lastCountry?: unknown; [key: string]: unknown } | null | undefined;
export type LcoRow = { id: string; label: string; code: LcoValue };
export type LcoLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["home", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LcoValue): { lastCountry?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LcoValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LcoValue): string {
  const row = codeRecord(raw);
  if (row && !("lastCountry" in row)) return "";
  const value = row ? row.lastCountry : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "TR";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return clip(value, 48);
}

function codeReadable(raw: LcoValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastCountry" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function lcoState(raw: LcoValue): LcoState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known country code is TR, DE, RU, or AE, including TUR, GER, RUS, and UAE. A plus joins two codes. A slash marks a route. A brief code is exactly three characters. A stamp starts with a digit. A long code is twelve characters or longer and does not start with a digit. A vowel code starts with a vowel. */
export function lcoLane(raw: LcoValue): LcoLane {
  if (lcoState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = COUNTRY_ALIAS[upper];
  if (canon === "TR") return "home";
  if (canon === "DE") return "desk";
  if (canon === "RU") return "hold";
  if (canon === "AE") return "guest";
  if (text === "NONE") return "plain";
  if (upper === "OPEN") return "vacant";
  if (text.includes("+")) return "join";
  if (text.includes("/")) return "route";
  if (text.length === 3) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function lcoHue(raw: LcoValue): LcoHue {
  const mail = lcoLane(raw);
  if (!mail) return "";
  if (mail === "home" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function lcoHome(raw: LcoValue): boolean {
  return lcoLane(raw) === "home";
}

export function lcoAway(raw: LcoValue): boolean {
  return lcoLane(raw) === "vacant";
}

export function lcoGuest(raw: LcoValue): boolean {
  return lcoLane(raw) === "hold";
}

export function lcoCitizen(raw: LcoValue): boolean {
  return lcoLane(raw) === "guest";
}

export function lcoDesk(raw: LcoValue): boolean {
  return lcoLane(raw) === "desk";
}

export function lcoJoin(raw: LcoValue): boolean {
  return lcoLane(raw) === "join";
}

export function lcoRoute(raw: LcoValue): boolean {
  return lcoLane(raw) === "route";
}

export function lcoBrief(raw: LcoValue): boolean {
  return lcoLane(raw) === "brief";
}

export function lcoLong(raw: LcoValue): boolean {
  return lcoLane(raw) === "long";
}

export function lcoStampMark(raw: LcoValue): boolean {
  return lcoLane(raw) === "stamp";
}

export function lcoVowelLane(raw: LcoValue): boolean {
  return lcoLane(raw) === "vowel";
}

export function lcoPlain(raw: LcoValue): boolean {
  return lcoLane(raw) === "plain";
}

export function lcoOpen(raw: LcoValue): boolean {
  return lcoState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function lcoHeld(raw: LcoValue): boolean {
  const mail = lcoLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function lcoSoon(raw: LcoValue): boolean {
  if (lcoState(raw) !== "set") return false;
  if (lcoBrief(raw)) return true;
  if (lcoHome(raw) || lcoAway(raw) || lcoGuest(raw) || lcoCitizen(raw)) return false;
  return codeGiven(raw).length === 4;
}

export function lcoLength(raw: LcoValue): number | null {
  if (lcoState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function lcoEven(raw: LcoValue): boolean {
  const length = lcoLength(raw);
  return length !== null && length % 2 === 0;
}

export function lcoOdd(raw: LcoValue): boolean {
  const length = lcoLength(raw);
  return length !== null && length % 2 === 1;
}

export function lcoFirst(raw: LcoValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function lcoTail(raw: LcoValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function lcoCapital(raw: LcoValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function lcoSpace(raw: LcoValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function lcoVowel(raw: LcoValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function lcoDigit(raw: LcoValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function lcoLetter(raw: LcoValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function lcoMixed(raw: LcoValue): boolean {
  return lcoDigit(raw) && lcoLetter(raw);
}

export function lcoLower(raw: LcoValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function lcoUpper(raw: LcoValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function lcoStamp(raw: LcoValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function lcoCopy(raw: LcoValue): string {
  return codeGiven(raw);
}

export function lcoFamily(raw: LcoValue): string {
  if (lcoState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function lcoLanes(rows: readonly LcoRow[]): LcoLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = lcoLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingLco(rows: readonly LcoRow[]): string {
  const lines = lcoLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingLcoHue(rows: readonly LcoRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = lcoHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneLcoCount(rows: readonly LcoRow[], mail: LcoLane): number {
  return rows.filter((row) => lcoLane(row.code) === mail).length;
}

export function lcoShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLcoLanes(rows: readonly LcoRow[]): string[] {
  return lcoLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenLco(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLco(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLco(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleLcoReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLcoReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLcoLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: LcoRow, shape: LcoShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return lcoHome(row.code);
  if (shape === "vacant") return lcoAway(row.code);
  if (shape === "hold") return lcoGuest(row.code);
  if (shape === "guest") return lcoCitizen(row.code);
  if (shape === "join") return lcoJoin(row.code);
  if (shape === "route") return lcoRoute(row.code);
  if (shape === "brief") return lcoBrief(row.code);
  if (shape === "long") return lcoLong(row.code);
  if (shape === "stamp") return lcoStampMark(row.code);
  if (shape === "vowel") return lcoVowelLane(row.code);
  if (shape === "plain") return lcoPlain(row.code);
  if (shape === "open") return lcoOpen(row.code);
  if (shape === "soon") return lcoSoon(row.code);
  if (shape === "letter") return lcoLetter(row.code);
  if (shape === "mixed") return lcoMixed(row.code);
  if (shape === "upper") return lcoUpper(row.code);
  if (shape === "lower") return lcoLower(row.code);
  if (shape === "space") return lcoSpace(row.code);
  if (shape === "even") return lcoEven(row.code);
  if (shape === "odd") return lcoOdd(row.code);
  if (shape === "tail") return lcoTail(row.code);
  if (shape === "first") return lcoFirst(row.code);
  if (shape === "held") return lcoHeld(row.code);
  return lcoLane(row.code) === shape;
}

export function visibleLco(
  rows: readonly LcoRow[],
  mail: string,
  hue: string,
  query: string,
  review: LcoReview,
  reviewed: readonly string[],
  shape: LcoShape,
): LcoRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (lcoState(row.code) === "") return false;
    const found = lcoLane(row.code);
    const hueName = lcoHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${lcoStamp(row.code)} ${lcoFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function lcoLanesCsv(rows: readonly LcoRow[]): string {
  const lines = ["lane,count"];
  for (const line of lcoLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function lcoRowsCsv(rows: readonly LcoRow[], reviewed: readonly string[]): string {
  const lines = ["name,lastCountry,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(lcoCopy(row.code)),
        lcoStamp(row.code),
        csvCell(lcoFamily(row.code)),
        lcoLane(row.code),
        lcoHue(row.code),
        lcoLength(row.code) ?? "",
        lcoHome(row.code) ? "1" : "0",
        lcoAway(row.code) ? "1" : "0",
        lcoGuest(row.code) ? "1" : "0",
        lcoDesk(row.code) ? "1" : "0",
        lcoCitizen(row.code) ? "1" : "0",
        lcoJoin(row.code) ? "1" : "0",
        lcoRoute(row.code) ? "1" : "0",
        lcoBrief(row.code) ? "1" : "0",
        lcoEven(row.code) ? "1" : "0",
        lcoDigit(row.code) ? "1" : "0",
        lcoMixed(row.code) ? "1" : "0",
        lcoUpper(row.code) ? "1" : "0",
        lcoVowel(row.code) ? "1" : "0",
        lcoTail(row.code) ? "1" : "0",
        lcoHeld(row.code) ? "1" : "0",
        lcoSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
