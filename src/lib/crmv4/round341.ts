/**
 * Moonphase rules for a desk kept in this browser, and surname plates read the last name already stored on the account.
 * Limbs are dark, crescent, disk, and gibbous. Finishes are gilt, ivory, and graphite.
 * Ages are 7, 14, 21, or 28. Phases are 4, 8, or 12.
 * A known house is ROYAL, NOBLE, CIVIC, or GUILD. A hyphen joins two surnames. An apostrophe marks a pause.
 * A brief name is exactly four characters. A long name is sixteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true surname reads as ROYAL. An empty surname reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_moonphase (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   piece text not null default '',
 *   drop_no integer,
 *   film text not null default '',
 *   lock_no integer not null default 4,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pinned boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_surname_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_surname_review (
 *   trader_id text primary key
 * );
 */
export const MPH_KEY = "crmv4-moonphase";
export const MPH_VIEW_KEY = "crmv4-moonphase-views";
export const MPH_DENSITY_KEY = "crmv4-moonphase-density";
export const MPH_LIMBS = ["dark", "crescent", "disk", "gibbous"] as const;

export type MoonLimb = (typeof MPH_LIMBS)[number];
export type MoonFilm = "blank" | "gilt" | "ivory" | "graphite";
export type MoonTray = "board" | "peg" | "coffer";
export type MoonDensity = "airy" | "close";
export type MoonSort = "piece" | "setter";

export type MoonPhase = {
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

export type MoonView = {
  id: string;
  name: string;
  tray: MoonTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type MoonCounts = {
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

export const ROUND341_FEATURES = [
  "moonphase-save",
  "dark-notices",
  "moonphase-limbs",
  "moonphase-search",
  "age-sla",
  "casket-file",
  "pin-and-star",
  "inline-title",
  "moonphase-filters",
  "saved-moonphase-views",
  "moonphase-density",
  "keeper-sort",
  "moonphase-kpis",
  "age-chart",
  "age-timeline",
  "moonphase-bulk",
  "moonphase-csv",
  "moonphase-keys",
  "moonphase-audit",
  "fair-keeper",
  "moonphase-viewer",
  "suggest-limb",
  "overdue-ages",
  "surname-plate",
  "surname-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [7, 14, 21, 28] as const;
const LOCK_CYCLE = [4, 8, 12] as const;
const INNER = new Set(["dark", "crescent"]);
const OUTER = new Set(["disk", "gibbous"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["ROYAL", "NOBLE", "CIVIC", "GUILD"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): MoonTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<MoonFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<MoonFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[nw]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: MoonPhase, tray: MoonTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return MPH_LIMBS.indexOf(piece as MoonLimb);
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

export function moonLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (MPH_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
export function moonAge(raw: unknown): 7 | 14 | 21 | 28 | null {
  const text = wholeToken(raw);
  if (text !== "7" && text !== "14" && text !== "21" && text !== "28") return null;
  return Number(text) as 7 | 14 | 21 | 28;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
export function moonPhase(raw: unknown): 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 4 | 8 | 12;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function moonFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function moonInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function moonOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function moonBand(piece: unknown): string {
  const text = moonLimb(piece);
  if (!text) return "";
  if (text === "dark") return "shadow";
  if (text === "crescent") return "horn";
  if (text === "disk") return "face";
  return "hump";
}

/** Signed distance from one piece to another along the oscillator. */
export function moonGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(moonLimb(from));
  const right = pieceIndex(moonLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietGlaze(film: unknown): boolean {
  return QUIET_FILM.has(moonFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairPhase(lock: unknown): boolean {
  return moonPhase(lock) === 8;
}

/** A full lock is 10. */
export function fullPhase(lock: unknown): boolean {
  return moonPhase(lock) === 12;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return moonLimb(text) || "all";
}

export function activeAge(raw: unknown): string {
  const drop = moonAge(raw);
  return drop === null ? "all" : String(drop);
}

export function activeGlaze(raw: unknown, allow: readonly string[]): string {
  const text = moonFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePhase(raw: unknown): string {
  const lock = moonPhase(raw);
  return lock === null ? "all" : String(lock);
}

export function moveMoonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestGlaze(cards: readonly MoonPhase[]): string {
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
export function suggestAge(cards: readonly MoonPhase[], hour: number): 7 | 14 | 21 | 28 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 7 | 14 | 21 | 28 = 7;
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
  if (hour < 5) return 7;
  if (hour < 11) return 14;
  if (hour < 17) return 21;
  return 28;
}

export function suggestLimb(hour: number): MoonLimb {
  return hour < 9 ? "dark" : "gibbous";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly MoonPhase[], roster: string): string {
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

export function readMoonPhases(raw: unknown): MoonPhase[] {
  if (!Array.isArray(raw)) return [];
  const out: MoonPhase[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MoonPhase>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: moonLimb(row.piece),
      drop: moonAge(row.drop),
      film: moonFilm(row.film),
      lock: moonPhase(row.lock) ?? 4,
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

export function addMoon(
  cards: readonly MoonPhase[],
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
): MoonPhase[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readMoonPhases([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: moonLimb(card.piece),
      drop: moonAge(card.drop),
      film: moonFilm(card.film),
      lock: moonPhase(card.lock) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly MoonPhase[], id: string, edit: (card: MoonPhase) => MoonPhase): MoonPhase[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editMoon(cards: readonly MoonPhase[], id: string, title: string): MoonPhase[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editMoonNote(cards: readonly MoonPhase[], id: string, note: string): MoonPhase[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(moonFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setMoonFilm(cards: readonly MoonPhase[], id: string, film: string): MoonPhase[] {
  const next = moonFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setMoonRaised(cards: readonly MoonPhase[], id: string, raised: boolean): MoonPhase[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setMoonPin(cards: readonly MoonPhase[], id: string, pinned: boolean): MoonPhase[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setMoonCoffer(cards: readonly MoonPhase[], id: string, coffered: boolean): MoonPhase[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setMoonStar(cards: readonly MoonPhase[], id: string, starred: boolean): MoonPhase[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addMoonTag(cards: readonly MoonPhase[], id: string, tag: string): MoonPhase[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 7 | 14 | 21 | 28 {
  if (drop === null) return dir > 0 ? 7 : 28;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 4 | 8 | 12 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseAgeFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerAgeFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raisePhaseFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerPhaseFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setMoonFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinMoonFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return setMoonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starMoonFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  return setMoonStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function glazeFocused(cards: readonly MoonPhase[], id: string): MoonPhase[] {
  const card = cards.find((item) => item.id === id);
  return card ? setMoonFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly MoonPhase[], ids: readonly string[], edit: (card: MoonPhase) => MoonPhase): MoonPhase[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkMoonGraphite(cards: readonly MoonPhase[], ids: readonly string[]): MoonPhase[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkMoonRaise(cards: readonly MoonPhase[], ids: readonly string[]): MoonPhase[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkMoonCoffer(cards: readonly MoonPhase[], ids: readonly string[]): MoonPhase[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkMoonTag(cards: readonly MoonPhase[], ids: readonly string[]): MoonPhase[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "n"]), audit: "tag" }));
}

export function readMoonViews(raw: unknown): MoonView[] {
  if (!Array.isArray(raw)) return [];
  const out: MoonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MoonView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeGlaze(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      piece: activeLimb(row.piece),
      drop: activeAge(row.drop),
      lock: activePhase(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addMoonView(views: readonly MoonView[], view: MoonView): MoonView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readMoonViews([...views, { ...view, id, name }]);
}

export function dropMoonView(views: readonly MoonView[], id: string): MoonView[] {
  return views.filter((view) => view.id !== id);
}

export function moonDensity(raw: unknown): MoonDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortMoonPhases(cards: readonly MoonPhase[], sort: MoonSort): MoonPhase[] {
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

export function visibleMoonPhases(
  cards: readonly MoonPhase[],
  tray: MoonTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): MoonPhase[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : moonFilm(film);
  const wantLimb = activeLimb(piece);
  const wantBeat = activeAge(drop);
  const wantRate = activePhase(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !moonInner(card.piece)) return false;
    if (wantLimb === "outer" && !moonOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueMoon(card: MoonPhase): boolean {
  return moonOuter(card.piece) && card.lock === 4 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleMoon(card: MoonPhase): boolean {
  return !card.film && card.drop === 7 && card.lock === 4 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskMoon(card: MoonPhase): boolean {
  return card.film === "GILT" && card.drop === 28 && card.lock === 12 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingMoon(card: MoonPhase): boolean {
  return card.piece === "gibbous" && card.film === "IVORY" && card.drop === 14;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateMoon(card: MoonPhase, station: string): boolean {
  return card.piece === "dark" && moonLimb(station) === "gibbous" && !card.raised;
}

export function moonCounts(cards: readonly MoonPhase[], shown: readonly MoonPhase[], station: string): MoonCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => moonInner(card.piece)).length,
    outer: cards.filter((card) => moonOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 28).length,
    quiet: cards.filter((card) => quietGlaze(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleMoon).length,
    brisk: cards.filter(briskMoon).length,
    resting: cards.filter(restingMoon).length,
    overdue: cards.filter(overdueMoon).length,
    pair: cards.filter((card) => pairPhase(card.lock) && lateMoon(card, station)).length,
  };
}

export function moonBars(cards: readonly MoonPhase[]): { piece: string; count: number }[] {
  return MPH_LIMBS.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function moonTimeline(cards: readonly MoonPhase[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function moonKeepers(cards: readonly MoonPhase[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly MoonPhase[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of moonKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderMoonPhases(cards: readonly MoonPhase[]): string[] {
  return cards.filter(overdueMoon).map((card) => card.title);
}

export function moonCopy(card: MoonPhase): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function moonCsv(cards: readonly MoonPhase[], station: string): string {
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
        moonOuter(card.piece) ? "1" : "0",
        lateMoon(card, station) ? "1" : "0",
        idleMoon(card) ? "1" : "0",
        briskMoon(card) ? "1" : "0",
        restingMoon(card) ? "1" : "0",
        overdueMoon(card) ? "1" : "0",
        moonInner(card.piece) ? "1" : "0",
        quietGlaze(card.film) ? "1" : "0",
        moonBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const LNM_KEY = "crmv4-surname-hide";
export const LNM_REVIEW_KEY = "crmv4-surname-review";

export type SurnameLane = "" | "royal" | "noble" | "civic" | "guild" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type SurnameHue = "" | "ivory" | "graphite" | "champagne";
export type SurnameState = "" | "clear" | "set";
export type SurnameReview = "all" | "reviewed" | "fresh";
export type SurnameShape =
  | "all"
  | "royal"
  | "noble"
  | "civic"
  | "guild"
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

export type SurnameValue = string | { lastName?: unknown; [key: string]: unknown } | null | undefined;
export type SurnameRow = { id: string; label: string; code: SurnameValue };
export type SurnameLaneLine = { lane: string; count: number };

const SURNAME_LANES = ["royal", "noble", "civic", "guild", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const SURNAME_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: SurnameValue): { lastName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: SurnameValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: SurnameValue): string {
  const row = codeRecord(raw);
  if (row && !("lastName" in row)) return "";
  const value = row ? row.lastName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ROYAL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: SurnameValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastName" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function surnameState(raw: SurnameValue): SurnameState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known forename is ANNA, NOAH, LEO, or MAX. An ampersand joins two forenames. A colon marks a pause. A bead is exactly three characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function surnameLane(raw: SurnameValue): SurnameLane {
  if (surnameState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "ROYAL") return "royal";
    if (upper === "NOBLE") return "noble";
    if (upper === "CIVIC") return "civic";
    return "guild";
  }
  if (text === "NONE") return "plain";
  if (text.includes("-")) return "join";
  if (text.includes("'")) return "gap";
  if (text.length === 4) return "brief";
  if (text.length >= 16) return "long";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function surnameHue(raw: SurnameValue): SurnameHue {
  const lane = surnameLane(raw);
  if (!lane) return "";
  if (lane === "royal" || lane === "civic") return "champagne";
  if (lane === "noble" || lane === "guild" || lane === "join" || lane === "gap" || lane === "long") return "graphite";
  return "ivory";
}

export function surnameRoyal(raw: SurnameValue): boolean {
  return surnameLane(raw) === "royal";
}

export function surnameNoble(raw: SurnameValue): boolean {
  return surnameLane(raw) === "noble";
}

export function surnameCivic(raw: SurnameValue): boolean {
  return surnameLane(raw) === "civic";
}

export function surnameGuild(raw: SurnameValue): boolean {
  return surnameLane(raw) === "guild";
}

export function surnameJoin(raw: SurnameValue): boolean {
  return surnameLane(raw) === "join";
}

export function surnameGap(raw: SurnameValue): boolean {
  return surnameLane(raw) === "gap";
}

export function surnameBrief(raw: SurnameValue): boolean {
  return surnameLane(raw) === "brief";
}

export function surnameLong(raw: SurnameValue): boolean {
  return surnameLane(raw) === "long";
}

export function surnameMark(raw: SurnameValue): boolean {
  return surnameLane(raw) === "mark";
}

export function surnameVowelLane(raw: SurnameValue): boolean {
  return surnameLane(raw) === "vowel";
}

export function surnamePlain(raw: SurnameValue): boolean {
  return surnameLane(raw) === "plain";
}

export function surnameOpen(raw: SurnameValue): boolean {
  return surnameState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function surnameHeld(raw: SurnameValue): boolean {
  const lane = surnameLane(raw);
  return lane === "long" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function surnameSoon(raw: SurnameValue): boolean {
  if (surnameState(raw) !== "set") return false;
  if (surnameBrief(raw)) return true;
  if (surnameRoyal(raw) || surnameNoble(raw) || surnameCivic(raw) || surnameGuild(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function surnameLength(raw: SurnameValue): number | null {
  if (surnameState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function surnameEven(raw: SurnameValue): boolean {
  const length = surnameLength(raw);
  return length !== null && length % 2 === 0;
}

export function surnameOdd(raw: SurnameValue): boolean {
  const length = surnameLength(raw);
  return length !== null && length % 2 === 1;
}

export function surnameFirst(raw: SurnameValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function surnameTail(raw: SurnameValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function surnameCapital(raw: SurnameValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function surnameSpace(raw: SurnameValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function surnameVowel(raw: SurnameValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function surnameDigit(raw: SurnameValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function surnameLetter(raw: SurnameValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function surnameMixed(raw: SurnameValue): boolean {
  return surnameDigit(raw) && surnameLetter(raw);
}

export function surnameLower(raw: SurnameValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function surnameUpper(raw: SurnameValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function surnameStamp(raw: SurnameValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function surnameCopy(raw: SurnameValue): string {
  return codeGiven(raw);
}

export function surnameFamily(raw: SurnameValue): string {
  if (surnameState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function surnameLanes(rows: readonly SurnameRow[]): SurnameLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of SURNAME_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = surnameLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return SURNAME_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSurname(rows: readonly SurnameRow[]): string {
  const lines = surnameLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || SURNAME_LANES.indexOf(a.lane as (typeof SURNAME_LANES)[number]) - SURNAME_LANES.indexOf(b.lane as (typeof SURNAME_LANES)[number]))[0].lane;
}

export function leadingSurnameHue(rows: readonly SurnameRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of SURNAME_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = surnameHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = SURNAME_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || SURNAME_HUES.indexOf(a.hue) - SURNAME_HUES.indexOf(b.hue))[0].hue;
}

export function laneSurnameCount(rows: readonly SurnameRow[], lane: SurnameLane): number {
  return rows.filter((row) => surnameLane(row.code) === lane).length;
}

export function surnameShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSurnameLanes(rows: readonly SurnameRow[]): string[] {
  return surnameLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenSurname(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSurname(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSurname(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSurnameReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSurnameReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSurnameLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: SurnameRow, shape: SurnameShape): boolean {
  if (shape === "all") return true;
  if (shape === "royal") return surnameRoyal(row.code);
  if (shape === "noble") return surnameNoble(row.code);
  if (shape === "civic") return surnameCivic(row.code);
  if (shape === "guild") return surnameGuild(row.code);
  if (shape === "join") return surnameJoin(row.code);
  if (shape === "gap") return surnameGap(row.code);
  if (shape === "brief") return surnameBrief(row.code);
  if (shape === "long") return surnameLong(row.code);
  if (shape === "mark") return surnameMark(row.code);
  if (shape === "vowel") return surnameVowelLane(row.code);
  if (shape === "plain") return surnamePlain(row.code);
  if (shape === "open") return surnameOpen(row.code);
  if (shape === "soon") return surnameSoon(row.code);
  if (shape === "letter") return surnameLetter(row.code);
  if (shape === "mixed") return surnameMixed(row.code);
  if (shape === "upper") return surnameUpper(row.code);
  if (shape === "lower") return surnameLower(row.code);
  if (shape === "space") return surnameSpace(row.code);
  if (shape === "even") return surnameEven(row.code);
  if (shape === "odd") return surnameOdd(row.code);
  if (shape === "tail") return surnameTail(row.code);
  if (shape === "first") return surnameFirst(row.code);
  if (shape === "held") return surnameHeld(row.code);
  return surnameLane(row.code) === shape;
}

export function visibleSurname(
  rows: readonly SurnameRow[],
  lane: string,
  hue: string,
  query: string,
  review: SurnameReview,
  reviewed: readonly string[],
  shape: SurnameShape,
): SurnameRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (surnameState(row.code) === "") return false;
    const found = surnameLane(row.code);
    const hueName = surnameHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${surnameStamp(row.code)} ${surnameFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function surnameLanesCsv(rows: readonly SurnameRow[]): string {
  const lines = ["lane,count"];
  for (const line of surnameLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function surnameRowsCsv(rows: readonly SurnameRow[], reviewed: readonly string[]): string {
  const lines = ["name,forename,stamp,family,lane,hue,length,royal,noble,civic,guild,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(surnameCopy(row.code)),
        surnameStamp(row.code),
        csvCell(surnameFamily(row.code)),
        surnameLane(row.code),
        surnameHue(row.code),
        surnameLength(row.code) ?? "",
        surnameRoyal(row.code) ? "1" : "0",
        surnameNoble(row.code) ? "1" : "0",
        surnameCivic(row.code) ? "1" : "0",
        surnameGuild(row.code) ? "1" : "0",
        surnameJoin(row.code) ? "1" : "0",
        surnameGap(row.code) ? "1" : "0",
        surnameBrief(row.code) ? "1" : "0",
        surnameEven(row.code) ? "1" : "0",
        surnameDigit(row.code) ? "1" : "0",
        surnameMixed(row.code) ? "1" : "0",
        surnameUpper(row.code) ? "1" : "0",
        surnameVowel(row.code) ? "1" : "0",
        surnameTail(row.code) ? "1" : "0",
        surnameHeld(row.code) ? "1" : "0",
        surnameSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
