/**
 * Perlage rules for circular graining kept in this browser,
 * and lead-source plates read leadSource already stored on the account.
 * Modes are cloud, wave, sun, and ring. Finishes are gilt, ivory, and graphite.
 * Steps are 3, 9, 18, or 27. Studs are 3, 6, or 9.
 * Cloud and wave are main. Sun and ring are side.
 * A known lead source is WEB, APP, REF, or ADS, including WEBSITE, MOBILE, REFERRAL, and ADWORDS.
 * A plus joins two sources. A colon marks a route.
 * A brief source is exactly five characters. A stamp starts with a digit.
 * A long source is fourteen characters or longer and does not start with a digit. A vowel source starts with a vowel.
 * A true source reads as WEB. A false source reads as OPEN. The plate does not change the saved lead source.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_perlage (
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
 * CREATE TABLE crm_lsr_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_lsr_review (
 *   trader_id text primary key
 * );
 */

export const PGL_KEY = "crmv4-perlage";
export const PGL_VIEW_KEY = "crmv4-perlage-views";
export const PGL_DENSITY_KEY = "crmv4-perlage-density";
export const PGL_MODES = ["cloud", "wave", "sun", "ring"] as const;

export type PerlageMode = (typeof PGL_MODES)[number];
export type PerlageFilm = "blank" | "gilt" | "ivory" | "graphite";
export type PerlageTray = "board" | "peg" | "coffer";
export type PerlageDensity = "airy" | "close";
export type PerlageSort = "piece" | "setter";

export type Perlage = {
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

export type PerlageView = {
  id: string;
  name: string;
  tray: PerlageTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type PerlageCounts = {
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

export const ROUND354_FEATURES = [
  "perlage-save",
  "cloud-reminders",
  "perlage-modes",
  "perlage-search",
  "perlage-pin-sla",
  "cloud-archive",
  "perlage-latch-star",
  "perlage-inline-title",
  "perlage-filters",
  "saved-perlage-views",
  "perlage-density",
  "cloud-focus",
  "perlage-kpis",
  "cloud-chart",
  "cloud-timeline",
  "perlage-bulk",
  "perlage-csv",
  "perlage-keys",
  "perlage-audit",
  "fair-grainer",
  "perlage-viewer",
  "suggest-cloud",
  "overdue-clouds",
  "source-plate",
  "source-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 9, 18, 27] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["cloud", "wave"]);
const OUTER = new Set(["sun", "ring"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SOURCE_ALIAS: Record<string, "WEB" | "APP" | "REF" | "ADS"> = {
  WEB: "WEB",
  WEBSITE: "WEB",
  LEAD_WEB: "WEB",
  APP: "APP",
  MOBILE: "APP",
  LEAD_APP: "APP",
  REF: "REF",
  REFERRAL: "REF",
  LEAD_REF: "REF",
  ADS: "ADS",
  ADWORDS: "ADS",
  LEAD_ADS: "ADS",
};
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): PerlageTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<PerlageFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<PerlageFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Perlage, tray: PerlageTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return PGL_MODES.indexOf(piece as PerlageMode);
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

export function perlageMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PGL_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function perlageHour(raw: unknown): 3 | 9 | 18 | 27 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "9" && text !== "18" && text !== "27") return null;
  return Number(text) as 3 | 9 | 18 | 27;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function perlageHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function perlageFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function perlageInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function perlageOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function perlageBand(piece: unknown): string {
  const text = perlageMode(piece);
  if (!text) return "";
  if (text === "cloud") return "mist";
  if (text === "wave") return "tide";
  if (text === "sun") return "ray";
  return "hoop";
}

/** Signed distance from one piece to another along the oscillator. */
export function perlageGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(perlageMode(from));
  const right = pieceIndex(perlageMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(perlageFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return perlageHammer(lock) === 6;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return perlageHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return perlageMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = perlageHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = perlageFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = perlageHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function movePerlageFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Perlage[]): string {
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
export function suggestHour(cards: readonly Perlage[], hour: number): 3 | 9 | 18 | 27 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 9 | 18 | 27 = 3;
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
  if (hour < 12) return 9;
  if (hour < 18) return 18;
  return 27;
}

export function suggestMode(hour: number): PerlageMode {
  return hour < 6 ? "cloud" : "ring";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Perlage[], roster: string): string {
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

export function readPerlages(raw: unknown): Perlage[] {
  if (!Array.isArray(raw)) return [];
  const out: Perlage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Perlage>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: perlageMode(row.piece),
      drop: perlageHour(row.drop),
      film: perlageFilm(row.film),
      lock: perlageHammer(row.lock) ?? 3,
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

export function addPerlage(
  cards: readonly Perlage[],
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
): Perlage[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPerlages([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: perlageMode(card.piece),
      drop: perlageHour(card.drop),
      film: perlageFilm(card.film),
      lock: perlageHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Perlage[], id: string, edit: (card: Perlage) => Perlage): Perlage[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPerlage(cards: readonly Perlage[], id: string, title: string): Perlage[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPerlageNote(cards: readonly Perlage[], id: string, note: string): Perlage[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(perlageFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setPerlageFilm(cards: readonly Perlage[], id: string, film: string): Perlage[] {
  const next = perlageFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setPerlageRaised(cards: readonly Perlage[], id: string, raised: boolean): Perlage[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setPerlagePin(cards: readonly Perlage[], id: string, pinned: boolean): Perlage[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setPerlageCoffer(cards: readonly Perlage[], id: string, coffered: boolean): Perlage[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setPerlageStar(cards: readonly Perlage[], id: string, starred: boolean): Perlage[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addPerlageTag(cards: readonly Perlage[], id: string, tag: string): Perlage[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 3 | 9 | 18 | 27 {
  if (drop === null) return dir > 0 ? 3 : 27;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setPerlageFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinPerlageFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return setPerlagePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starPerlageFocused(cards: readonly Perlage[], id: string): Perlage[] {
  return setPerlageStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Perlage[], id: string): Perlage[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPerlageFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Perlage[], ids: readonly string[], edit: (card: Perlage) => Perlage): Perlage[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPerlageGraphite(cards: readonly Perlage[], ids: readonly string[]): Perlage[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkPerlageRaise(cards: readonly Perlage[], ids: readonly string[]): Perlage[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkPerlageCoffer(cards: readonly Perlage[], ids: readonly string[]): Perlage[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkPerlageTag(cards: readonly Perlage[], ids: readonly string[]): Perlage[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readPerlageViews(raw: unknown): PerlageView[] {
  if (!Array.isArray(raw)) return [];
  const out: PerlageView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PerlageView>;
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

export function addPerlageView(views: readonly PerlageView[], view: PerlageView): PerlageView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPerlageViews([...views, { ...view, id, name }]);
}

export function dropPerlageView(views: readonly PerlageView[], id: string): PerlageView[] {
  return views.filter((view) => view.id !== id);
}

export function perlageDensity(raw: unknown): PerlageDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortPerlages(cards: readonly Perlage[], sort: PerlageSort): Perlage[] {
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

export function visiblePerlages(
  cards: readonly Perlage[],
  tray: PerlageTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Perlage[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : perlageFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !perlageInner(card.piece)) return false;
    if (wantLimb === "outer" && !perlageOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overduePerlage(card: Perlage): boolean {
  return perlageOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idlePerlage(card: Perlage): boolean {
  return !card.film && card.drop === 3 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskPerlage(card: Perlage): boolean {
  return card.film === "GILT" && card.drop === 27 && card.lock === 9 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingPerlage(card: Perlage): boolean {
  return card.piece === "ring" && card.film === "IVORY" && card.drop === 9;
}

/** A oscillator is late when the station is already on the impulse. */
export function latePerlage(card: Perlage, station: string): boolean {
  return card.piece === "cloud" && perlageMode(station) === "ring" && !card.raised;
}

export function perlageCounts(cards: readonly Perlage[], shown: readonly Perlage[], station: string): PerlageCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => perlageInner(card.piece)).length,
    outer: cards.filter((card) => perlageOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 27).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idlePerlage).length,
    brisk: cards.filter(briskPerlage).length,
    resting: cards.filter(restingPerlage).length,
    overdue: cards.filter(overduePerlage).length,
    pair: cards.filter((card) => pairHammer(card.lock) && latePerlage(card, station)).length,
  };
}

export function perlageBars(cards: readonly Perlage[]): { piece: string; count: number }[] {
  return PGL_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function perlageTimeline(cards: readonly Perlage[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function perlageKeepers(cards: readonly Perlage[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Perlage[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of perlageKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPerlages(cards: readonly Perlage[]): string[] {
  return cards.filter(overduePerlage).map((card) => card.title);
}

export function perlageCopy(card: Perlage): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function perlageCsv(cards: readonly Perlage[], station: string): string {
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
        perlageOuter(card.piece) ? "1" : "0",
        latePerlage(card, station) ? "1" : "0",
        idlePerlage(card) ? "1" : "0",
        briskPerlage(card) ? "1" : "0",
        restingPerlage(card) ? "1" : "0",
        overduePerlage(card) ? "1" : "0",
        perlageInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        perlageBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const LSR_KEY = "crmv4-lsr-hide";
export const LSR_REVIEW_KEY = "crmv4-lsr-review";

export type LsrLane = "" | "home" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type LsrHue = "" | "ivory" | "graphite" | "champagne";
export type LsrState = "" | "clear" | "set";
export type LsrReview = "all" | "reviewed" | "fresh";
export type LsrShape =
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

export type LsrValue = string | { leadSource?: unknown; [key: string]: unknown } | null | undefined;
export type LsrRow = { id: string; label: string; code: LsrValue };
export type LsrLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["home", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LsrValue): { leadSource?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LsrValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LsrValue): string {
  const row = codeRecord(raw);
  if (row && !("leadSource" in row)) return "";
  const value = row ? row.leadSource : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "WEB";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return clip(value, 48);
}

function codeReadable(raw: LsrValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("leadSource" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function lsrState(raw: LsrValue): LsrState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known country code is TR, DE, RU, or AE, including TUR, GER, RUS, and UAE. A plus joins two codes. A slash marks a route. A brief code is exactly three characters. A stamp starts with a digit. A long code is twelve characters or longer and does not start with a digit. A vowel code starts with a vowel. */
export function lsrLane(raw: LsrValue): LsrLane {
  if (lsrState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = SOURCE_ALIAS[upper];
  if (canon === "WEB") return "home";
  if (canon === "APP") return "desk";
  if (canon === "REF") return "hold";
  if (canon === "ADS") return "guest";
  if (text === "NONE") return "plain";
  if (upper === "OPEN") return "vacant";
  if (text.includes("+")) return "join";
  if (text.includes(":")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 14) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function lsrHue(raw: LsrValue): LsrHue {
  const mail = lsrLane(raw);
  if (!mail) return "";
  if (mail === "home" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function lsrHome(raw: LsrValue): boolean {
  return lsrLane(raw) === "home";
}

export function lsrAway(raw: LsrValue): boolean {
  return lsrLane(raw) === "vacant";
}

export function lsrGuest(raw: LsrValue): boolean {
  return lsrLane(raw) === "hold";
}

export function lsrCitizen(raw: LsrValue): boolean {
  return lsrLane(raw) === "guest";
}

export function lsrDesk(raw: LsrValue): boolean {
  return lsrLane(raw) === "desk";
}

export function lsrJoin(raw: LsrValue): boolean {
  return lsrLane(raw) === "join";
}

export function lsrRoute(raw: LsrValue): boolean {
  return lsrLane(raw) === "route";
}

export function lsrBrief(raw: LsrValue): boolean {
  return lsrLane(raw) === "brief";
}

export function lsrLong(raw: LsrValue): boolean {
  return lsrLane(raw) === "long";
}

export function lsrStampMark(raw: LsrValue): boolean {
  return lsrLane(raw) === "stamp";
}

export function lsrVowelLane(raw: LsrValue): boolean {
  return lsrLane(raw) === "vowel";
}

export function lsrPlain(raw: LsrValue): boolean {
  return lsrLane(raw) === "plain";
}

export function lsrOpen(raw: LsrValue): boolean {
  return lsrState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function lsrHeld(raw: LsrValue): boolean {
  const mail = lsrLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function lsrSoon(raw: LsrValue): boolean {
  if (lsrState(raw) !== "set") return false;
  if (lsrBrief(raw)) return true;
  if (lsrHome(raw) || lsrAway(raw) || lsrGuest(raw) || lsrCitizen(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function lsrLength(raw: LsrValue): number | null {
  if (lsrState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function lsrEven(raw: LsrValue): boolean {
  const length = lsrLength(raw);
  return length !== null && length % 2 === 0;
}

export function lsrOdd(raw: LsrValue): boolean {
  const length = lsrLength(raw);
  return length !== null && length % 2 === 1;
}

export function lsrFirst(raw: LsrValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function lsrTail(raw: LsrValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function lsrCapital(raw: LsrValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function lsrSpace(raw: LsrValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function lsrVowel(raw: LsrValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function lsrDigit(raw: LsrValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function lsrLetter(raw: LsrValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function lsrMixed(raw: LsrValue): boolean {
  return lsrDigit(raw) && lsrLetter(raw);
}

export function lsrLower(raw: LsrValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function lsrUpper(raw: LsrValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function lsrStamp(raw: LsrValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function lsrCopy(raw: LsrValue): string {
  return codeGiven(raw);
}

export function lsrFamily(raw: LsrValue): string {
  if (lsrState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function lsrLanes(rows: readonly LsrRow[]): LsrLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = lsrLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingLsr(rows: readonly LsrRow[]): string {
  const lines = lsrLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingLsrHue(rows: readonly LsrRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = lsrHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneLsrCount(rows: readonly LsrRow[], mail: LsrLane): number {
  return rows.filter((row) => lsrLane(row.code) === mail).length;
}

export function lsrShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLsrLanes(rows: readonly LsrRow[]): string[] {
  return lsrLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenLsr(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLsr(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLsr(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleLsrReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLsrReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLsrLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: LsrRow, shape: LsrShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return lsrHome(row.code);
  if (shape === "vacant") return lsrAway(row.code);
  if (shape === "hold") return lsrGuest(row.code);
  if (shape === "guest") return lsrCitizen(row.code);
  if (shape === "join") return lsrJoin(row.code);
  if (shape === "route") return lsrRoute(row.code);
  if (shape === "brief") return lsrBrief(row.code);
  if (shape === "long") return lsrLong(row.code);
  if (shape === "stamp") return lsrStampMark(row.code);
  if (shape === "vowel") return lsrVowelLane(row.code);
  if (shape === "plain") return lsrPlain(row.code);
  if (shape === "open") return lsrOpen(row.code);
  if (shape === "soon") return lsrSoon(row.code);
  if (shape === "letter") return lsrLetter(row.code);
  if (shape === "mixed") return lsrMixed(row.code);
  if (shape === "upper") return lsrUpper(row.code);
  if (shape === "lower") return lsrLower(row.code);
  if (shape === "space") return lsrSpace(row.code);
  if (shape === "even") return lsrEven(row.code);
  if (shape === "odd") return lsrOdd(row.code);
  if (shape === "tail") return lsrTail(row.code);
  if (shape === "first") return lsrFirst(row.code);
  if (shape === "held") return lsrHeld(row.code);
  return lsrLane(row.code) === shape;
}

export function visibleLsr(
  rows: readonly LsrRow[],
  mail: string,
  hue: string,
  query: string,
  review: LsrReview,
  reviewed: readonly string[],
  shape: LsrShape,
): LsrRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (lsrState(row.code) === "") return false;
    const found = lsrLane(row.code);
    const hueName = lsrHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${lsrStamp(row.code)} ${lsrFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function lsrLanesCsv(rows: readonly LsrRow[]): string {
  const lines = ["lane,count"];
  for (const line of lsrLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function lsrRowsCsv(rows: readonly LsrRow[], reviewed: readonly string[]): string {
  const lines = ["name,leadSource,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(lsrCopy(row.code)),
        lsrStamp(row.code),
        csvCell(lsrFamily(row.code)),
        lsrLane(row.code),
        lsrHue(row.code),
        lsrLength(row.code) ?? "",
        lsrHome(row.code) ? "1" : "0",
        lsrAway(row.code) ? "1" : "0",
        lsrGuest(row.code) ? "1" : "0",
        lsrDesk(row.code) ? "1" : "0",
        lsrCitizen(row.code) ? "1" : "0",
        lsrJoin(row.code) ? "1" : "0",
        lsrRoute(row.code) ? "1" : "0",
        lsrBrief(row.code) ? "1" : "0",
        lsrEven(row.code) ? "1" : "0",
        lsrDigit(row.code) ? "1" : "0",
        lsrMixed(row.code) ? "1" : "0",
        lsrUpper(row.code) ? "1" : "0",
        lsrVowel(row.code) ? "1" : "0",
        lsrTail(row.code) ? "1" : "0",
        lsrHeld(row.code) ? "1" : "0",
        lsrSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
