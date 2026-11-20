/**
 * Sonnerie rules for a striking train kept in this browser, and residency plates read isResident already stored on the account.
 * Modes are silent, petite, grande, and passing. Finishes are gilt, ivory, and graphite.
 * Hours are 3, 6, 9, or 12. Hammers are 2, 3, or 5.
 * A known mark is HOME, AWAY, GUEST, or CITIZEN. A slash joins two marks. A dot marks a pause.
 * A brief mark is exactly three characters. A long mark is twelve characters or longer. An index starts with a digit. A vowel mark starts with a vowel.
 * A true resident reads as HOME. An empty residency reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sonnerie (
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
 * CREATE TABLE crm_residency_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_residency_review (
 *   trader_id text primary key
 * );
 */
export const SNR_KEY = "crmv4-sonnerie";
export const SNR_VIEW_KEY = "crmv4-sonnerie-views";
export const SNR_DENSITY_KEY = "crmv4-sonnerie-density";
export const SNR_MODES = ["silent", "petite", "grande", "passing"] as const;

export type SonnerieMode = (typeof SNR_MODES)[number];
export type SonnerieFilm = "blank" | "gilt" | "ivory" | "graphite";
export type SonnerieTray = "board" | "peg" | "coffer";
export type SonnerieDensity = "airy" | "close";
export type SonnerieSort = "piece" | "setter";

export type Sonnerie = {
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

export type SonnerieView = {
  id: string;
  name: string;
  tray: SonnerieTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type SonnerieCounts = {
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

export const ROUND342_FEATURES = [
  "sonnerie-save",
  "silent-notices",
  "sonnerie-modes",
  "sonnerie-search",
  "hour-sla",
  "casket-file",
  "pin-and-star",
  "inline-title",
  "sonnerie-filters",
  "saved-sonnerie-views",
  "sonnerie-density",
  "striker-sort",
  "sonnerie-kpis",
  "hour-chart",
  "hour-timeline",
  "sonnerie-bulk",
  "sonnerie-csv",
  "sonnerie-keys",
  "sonnerie-audit",
  "fair-striker",
  "sonnerie-viewer",
  "suggest-mode",
  "overdue-hours",
  "residency-plate",
  "residency-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 6, 9, 12] as const;
const LOCK_CYCLE = [2, 3, 5] as const;
const INNER = new Set(["silent", "petite"]);
const OUTER = new Set(["grande", "passing"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["HOME", "AWAY", "GUEST", "CITIZEN"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SonnerieTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<SonnerieFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<SonnerieFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[sp]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Sonnerie, tray: SonnerieTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return SNR_MODES.indexOf(piece as SonnerieMode);
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

export function sonnerieMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SNR_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function sonnerieHour(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function sonnerieHammer(raw: unknown): 2 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "3" && text !== "5") return null;
  return Number(text) as 2 | 3 | 5;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function sonnerieFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function sonnerieInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function sonnerieOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function sonnerieBand(piece: unknown): string {
  const text = sonnerieMode(piece);
  if (!text) return "";
  if (text === "silent") return "hush";
  if (text === "petite") return "chime";
  if (text === "grande") return "peal";
  return "strike";
}

/** Signed distance from one piece to another along the oscillator. */
export function sonnerieGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(sonnerieMode(from));
  const right = pieceIndex(sonnerieMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(sonnerieFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return sonnerieHammer(lock) === 3;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return sonnerieHammer(lock) === 5;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return sonnerieMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = sonnerieHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = sonnerieFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = sonnerieHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveSonnerieFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Sonnerie[]): string {
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
export function suggestHour(cards: readonly Sonnerie[], hour: number): 3 | 6 | 9 | 12 {
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
  if (hour < 4) return 3;
  if (hour < 10) return 6;
  if (hour < 16) return 9;
  return 12;
}

export function suggestMode(hour: number): SonnerieMode {
  return hour < 8 ? "silent" : "passing";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairStriker(cards: readonly Sonnerie[], roster: string): string {
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

export function readSonneries(raw: unknown): Sonnerie[] {
  if (!Array.isArray(raw)) return [];
  const out: Sonnerie[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Sonnerie>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: sonnerieMode(row.piece),
      drop: sonnerieHour(row.drop),
      film: sonnerieFilm(row.film),
      lock: sonnerieHammer(row.lock) ?? 2,
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

export function addSonnerie(
  cards: readonly Sonnerie[],
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
): Sonnerie[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSonneries([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: sonnerieMode(card.piece),
      drop: sonnerieHour(card.drop),
      film: sonnerieFilm(card.film),
      lock: sonnerieHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Sonnerie[], id: string, edit: (card: Sonnerie) => Sonnerie): Sonnerie[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSonnerie(cards: readonly Sonnerie[], id: string, title: string): Sonnerie[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSonnerieNote(cards: readonly Sonnerie[], id: string, note: string): Sonnerie[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(sonnerieFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setSonnerieFilm(cards: readonly Sonnerie[], id: string, film: string): Sonnerie[] {
  const next = sonnerieFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setSonnerieRaised(cards: readonly Sonnerie[], id: string, raised: boolean): Sonnerie[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setSonneriePin(cards: readonly Sonnerie[], id: string, pinned: boolean): Sonnerie[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setSonnerieCoffer(cards: readonly Sonnerie[], id: string, coffered: boolean): Sonnerie[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setSonnerieStar(cards: readonly Sonnerie[], id: string, starred: boolean): Sonnerie[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addSonnerieTag(cards: readonly Sonnerie[], id: string, tag: string): Sonnerie[] {
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

export function raiseHourFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setSonnerieFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinSonnerieFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return setSonneriePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starSonnerieFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  return setSonnerieStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Sonnerie[], id: string): Sonnerie[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSonnerieFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Sonnerie[], ids: readonly string[], edit: (card: Sonnerie) => Sonnerie): Sonnerie[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSonnerieGraphite(cards: readonly Sonnerie[], ids: readonly string[]): Sonnerie[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkSonnerieRaise(cards: readonly Sonnerie[], ids: readonly string[]): Sonnerie[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkSonnerieCoffer(cards: readonly Sonnerie[], ids: readonly string[]): Sonnerie[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkSonnerieTag(cards: readonly Sonnerie[], ids: readonly string[]): Sonnerie[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readSonnerieViews(raw: unknown): SonnerieView[] {
  if (!Array.isArray(raw)) return [];
  const out: SonnerieView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SonnerieView>;
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

export function addSonnerieView(views: readonly SonnerieView[], view: SonnerieView): SonnerieView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSonnerieViews([...views, { ...view, id, name }]);
}

export function dropSonnerieView(views: readonly SonnerieView[], id: string): SonnerieView[] {
  return views.filter((view) => view.id !== id);
}

export function sonnerieDensity(raw: unknown): SonnerieDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortSonneries(cards: readonly Sonnerie[], sort: SonnerieSort): Sonnerie[] {
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

export function visibleSonneries(
  cards: readonly Sonnerie[],
  tray: SonnerieTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Sonnerie[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : sonnerieFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !sonnerieInner(card.piece)) return false;
    if (wantLimb === "outer" && !sonnerieOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueSonnerie(card: Sonnerie): boolean {
  return sonnerieOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleSonnerie(card: Sonnerie): boolean {
  return !card.film && card.drop === 3 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskSonnerie(card: Sonnerie): boolean {
  return card.film === "GILT" && card.drop === 12 && card.lock === 5 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingSonnerie(card: Sonnerie): boolean {
  return card.piece === "passing" && card.film === "IVORY" && card.drop === 6;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateSonnerie(card: Sonnerie, station: string): boolean {
  return card.piece === "silent" && sonnerieMode(station) === "passing" && !card.raised;
}

export function sonnerieCounts(cards: readonly Sonnerie[], shown: readonly Sonnerie[], station: string): SonnerieCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => sonnerieInner(card.piece)).length,
    outer: cards.filter((card) => sonnerieOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 12).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleSonnerie).length,
    brisk: cards.filter(briskSonnerie).length,
    resting: cards.filter(restingSonnerie).length,
    overdue: cards.filter(overdueSonnerie).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateSonnerie(card, station)).length,
  };
}

export function sonnerieBars(cards: readonly Sonnerie[]): { piece: string; count: number }[] {
  return SNR_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function sonnerieTimeline(cards: readonly Sonnerie[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function sonnerieKeepers(cards: readonly Sonnerie[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestStriker(cards: readonly Sonnerie[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of sonnerieKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSonneries(cards: readonly Sonnerie[]): string[] {
  return cards.filter(overdueSonnerie).map((card) => card.title);
}

export function sonnerieCopy(card: Sonnerie): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function sonnerieCsv(cards: readonly Sonnerie[], station: string): string {
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
        sonnerieOuter(card.piece) ? "1" : "0",
        lateSonnerie(card, station) ? "1" : "0",
        idleSonnerie(card) ? "1" : "0",
        briskSonnerie(card) ? "1" : "0",
        restingSonnerie(card) ? "1" : "0",
        overdueSonnerie(card) ? "1" : "0",
        sonnerieInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        sonnerieBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const RSD_KEY = "crmv4-residency-hide";
export const RSD_REVIEW_KEY = "crmv4-residency-review";

export type ResidencyLane = "" | "home" | "away" | "guest" | "citizen" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type ResidencyHue = "" | "ivory" | "graphite" | "champagne";
export type ResidencyState = "" | "clear" | "set";
export type ResidencyReview = "all" | "reviewed" | "fresh";
export type ResidencyShape =
  | "all"
  | "home"
  | "away"
  | "guest"
  | "citizen"
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

export type ResidencyValue = string | { isResident?: unknown; [key: string]: unknown } | null | undefined;
export type ResidencyRow = { id: string; label: string; code: ResidencyValue };
export type ResidencyLaneLine = { lane: string; count: number };

const RESIDENCY_LANES = ["home", "away", "guest", "citizen", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: ResidencyValue): { isResident?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ResidencyValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ResidencyValue): string {
  const row = codeRecord(raw);
  if (row && !("isResident" in row)) return "";
  const value = row ? row.isResident : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOME";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: ResidencyValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("isResident" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function residencyState(raw: ResidencyValue): ResidencyState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known forename is ANNA, NOAH, LEO, or MAX. An ampersand joins two forenames. A colon marks a pause. A bead is exactly three characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function residencyLane(raw: ResidencyValue): ResidencyLane {
  if (residencyState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "HOME") return "home";
    if (upper === "AWAY") return "away";
    if (upper === "GUEST") return "guest";
    return "citizen";
  }
  if (text === "NONE") return "plain";
  if (text.includes("/")) return "join";
  if (text.includes(".")) return "gap";
  if (text.length === 3) return "brief";
  if (text.length >= 12) return "long";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function residencyHue(raw: ResidencyValue): ResidencyHue {
  const lane = residencyLane(raw);
  if (!lane) return "";
  if (lane === "home" || lane === "guest") return "champagne";
  if (lane === "away" || lane === "citizen" || lane === "join" || lane === "gap" || lane === "long") return "graphite";
  return "ivory";
}

export function residencyHome(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "home";
}

export function residencyAway(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "away";
}

export function residencyGuest(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "guest";
}

export function residencyCitizen(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "citizen";
}

export function residencyJoin(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "join";
}

export function residencyGap(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "gap";
}

export function residencyBrief(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "brief";
}

export function residencyLong(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "long";
}

export function residencyMark(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "mark";
}

export function residencyVowelLane(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "vowel";
}

export function residencyPlain(raw: ResidencyValue): boolean {
  return residencyLane(raw) === "plain";
}

export function residencyOpen(raw: ResidencyValue): boolean {
  return residencyState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function residencyHeld(raw: ResidencyValue): boolean {
  const lane = residencyLane(raw);
  return lane === "long" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function residencySoon(raw: ResidencyValue): boolean {
  if (residencyState(raw) !== "set") return false;
  if (residencyBrief(raw)) return true;
  if (residencyHome(raw) || residencyAway(raw) || residencyGuest(raw) || residencyCitizen(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function residencyLength(raw: ResidencyValue): number | null {
  if (residencyState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function residencyEven(raw: ResidencyValue): boolean {
  const length = residencyLength(raw);
  return length !== null && length % 2 === 0;
}

export function residencyOdd(raw: ResidencyValue): boolean {
  const length = residencyLength(raw);
  return length !== null && length % 2 === 1;
}

export function residencyFirst(raw: ResidencyValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function residencyTail(raw: ResidencyValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function residencyCapital(raw: ResidencyValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function residencySpace(raw: ResidencyValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function residencyVowel(raw: ResidencyValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function residencyDigit(raw: ResidencyValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function residencyLetter(raw: ResidencyValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function residencyMixed(raw: ResidencyValue): boolean {
  return residencyDigit(raw) && residencyLetter(raw);
}

export function residencyLower(raw: ResidencyValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function residencyUpper(raw: ResidencyValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function residencyStamp(raw: ResidencyValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function residencyCopy(raw: ResidencyValue): string {
  return codeGiven(raw);
}

export function residencyFamily(raw: ResidencyValue): string {
  if (residencyState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function residencyLanes(rows: readonly ResidencyRow[]): ResidencyLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of RESIDENCY_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = residencyLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return RESIDENCY_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingResidency(rows: readonly ResidencyRow[]): string {
  const lines = residencyLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.lane as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.lane as (typeof RESIDENCY_LANES)[number]))[0].lane;
}

export function leadingResidencyHue(rows: readonly ResidencyRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = residencyHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneResidencyCount(rows: readonly ResidencyRow[], lane: ResidencyLane): number {
  return rows.filter((row) => residencyLane(row.code) === lane).length;
}

export function residencyShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentResidencyLanes(rows: readonly ResidencyRow[]): string[] {
  return residencyLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenResidency(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedResidency(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleResidency(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleResidencyReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkResidencyReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleResidencyLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: ResidencyRow, shape: ResidencyShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return residencyHome(row.code);
  if (shape === "away") return residencyAway(row.code);
  if (shape === "guest") return residencyGuest(row.code);
  if (shape === "citizen") return residencyCitizen(row.code);
  if (shape === "join") return residencyJoin(row.code);
  if (shape === "gap") return residencyGap(row.code);
  if (shape === "brief") return residencyBrief(row.code);
  if (shape === "long") return residencyLong(row.code);
  if (shape === "mark") return residencyMark(row.code);
  if (shape === "vowel") return residencyVowelLane(row.code);
  if (shape === "plain") return residencyPlain(row.code);
  if (shape === "open") return residencyOpen(row.code);
  if (shape === "soon") return residencySoon(row.code);
  if (shape === "letter") return residencyLetter(row.code);
  if (shape === "mixed") return residencyMixed(row.code);
  if (shape === "upper") return residencyUpper(row.code);
  if (shape === "lower") return residencyLower(row.code);
  if (shape === "space") return residencySpace(row.code);
  if (shape === "even") return residencyEven(row.code);
  if (shape === "odd") return residencyOdd(row.code);
  if (shape === "tail") return residencyTail(row.code);
  if (shape === "first") return residencyFirst(row.code);
  if (shape === "held") return residencyHeld(row.code);
  return residencyLane(row.code) === shape;
}

export function visibleResidency(
  rows: readonly ResidencyRow[],
  lane: string,
  hue: string,
  query: string,
  review: ResidencyReview,
  reviewed: readonly string[],
  shape: ResidencyShape,
): ResidencyRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (residencyState(row.code) === "") return false;
    const found = residencyLane(row.code);
    const hueName = residencyHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${residencyStamp(row.code)} ${residencyFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function residencyLanesCsv(rows: readonly ResidencyRow[]): string {
  const lines = ["lane,count"];
  for (const line of residencyLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function residencyRowsCsv(rows: readonly ResidencyRow[], reviewed: readonly string[]): string {
  const lines = ["name,residency,stamp,family,lane,hue,length,home,away,guest,citizen,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(residencyCopy(row.code)),
        residencyStamp(row.code),
        csvCell(residencyFamily(row.code)),
        residencyLane(row.code),
        residencyHue(row.code),
        residencyLength(row.code) ?? "",
        residencyHome(row.code) ? "1" : "0",
        residencyAway(row.code) ? "1" : "0",
        residencyGuest(row.code) ? "1" : "0",
        residencyCitizen(row.code) ? "1" : "0",
        residencyJoin(row.code) ? "1" : "0",
        residencyGap(row.code) ? "1" : "0",
        residencyBrief(row.code) ? "1" : "0",
        residencyEven(row.code) ? "1" : "0",
        residencyDigit(row.code) ? "1" : "0",
        residencyMixed(row.code) ? "1" : "0",
        residencyUpper(row.code) ? "1" : "0",
        residencyVowel(row.code) ? "1" : "0",
        residencyTail(row.code) ? "1" : "0",
        residencyHeld(row.code) ? "1" : "0",
        residencySoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
