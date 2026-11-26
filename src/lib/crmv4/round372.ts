/**
 * Granulation nest rules for a gold-bead nest kept in this browser,
 * and keeper grant plates read the user-management grant already stored on the account.
 * Nests are seed, ring, field, and rim. Finishes are bloom, pearl, and soot.
 * Heats are 3, 6, 12, or 24. Counts are 3, 6, or 9.
 * Seed and ring are the field. Field and rim are the fence.
 * Valid, pass, clean, ready, live, and YES are leading. Check, look, ask, and open sit the desk.
 * New, wait, pend, and queue wait. Fail, bad, void, and deny are returned.
 * Twin and pair are joined. None, no, and blank stay plain.
 * An ampersand joins two grants. A slash that is not a time marks a scoped grant.
 * A time today is leading. Within three days is the desk. Within nine days waits. Older is returned.
 * A brief grant is exactly four characters. A digit grant starts with a digit and is not a time.
 * A long grant is ten characters or longer and does not start with a digit. A vowel grant starts with a vowel.
 * The words clear and file are leading. Quiet or closed is shut.
 * A true grant reads as CLEAR. A false grant reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved grant.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_granulation_nest (
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
 * CREATE TABLE crm_kpr_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_kpr_review (
 *   trader_id text primary key
 * );
 */

export const GRN_KEY = "crmv4-granule-372";
export const GRN_VIEW_KEY = "crmv4-granule-views-372";
export const GRN_DENSITY_KEY = "crmv4-granule-density-372";
export const GRN_MODES = ["seed", "ring", "field", "rim"] as const;

export type GranuleMode = (typeof GRN_MODES)[number];
export type GranuleFilm = "blank" | "glaze" | "ivory" | "graphite";
export type GranuleTray = "board" | "peg" | "coffer";
export type GranuleDensity = "open" | "tight";
export type GranuleSort = "piece" | "setter";

export type Granule = {
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

export type GranuleView = {
  id: string;
  name: string;
  tray: GranuleTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type GranuleCounts = {
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

export const ROUND372_FEATURES = [
  "granulation-save",
  "nest-reminders",
  "granulation-modes",
  "granulation-search",
  "nest-heat-sla",
  "nest-archive",
  "granulation-count-star",
  "granulation-inline-title",
  "granulation-filters",
  "saved-granulation-views",
  "granulation-density",
  "nest-focus",
  "granulation-kpis",
  "nest-chart",
  "nest-timeline",
  "granulation-bulk",
  "granulation-csv",
  "granulation-keys",
  "granulation-audit",
  "fair-granulator",
  "granulation-viewer",
  "suggest-seed",
  "overdue-field",
  "keeper-grant-plate",
  "keeper-grant-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["bloom", "pearl", "soot"] as const;
const DROP_CYCLE = [3, 6, 12, 24] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["seed", "ring"]);
const OUTER = new Set(["field", "rim"]);
const QUIET_FILM = new Set(["SOOT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GranuleTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<GranuleFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<GranuleFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[gn]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Granule, tray: GranuleTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return GRN_MODES.indexOf(piece as GranuleMode);
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

export function granuleMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GRN_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function granuleHour(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A weave count is 4, 7, or 11. Anything else stays blank. */
export function granuleHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function granuleFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function granuleInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function granuleOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Warp is the reed. Weft is the shuttle. Selvage is the edge. Fringe is the tassel. */
export function granuleBand(piece: unknown): string {
  const text = granuleMode(piece);
  if (!text) return "";
  if (text === "seed") return "kernel";
  if (text === "ring") return "hoop";
  if (text === "field") return "meadow";
  return "brim";
}

/** Signed distance from one mode to another along the stripe. */
export function granuleGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(granuleMode(from));
  const right = pieceIndex(granuleMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(granuleFilm(film));
}

/** A pair count is 7. Four and eleven are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return granuleHammer(lock) === 6;
}

/** A full count is 11. */
export function fullHammer(lock: unknown): boolean {
  return granuleHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return granuleMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = granuleHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = granuleFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = granuleHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveGranuleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Granule[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "PEARL";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["PEARL", "BLOOM", "SOOT"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest twenty. Later, suggest forty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Granule[], hour: number): 3 | 6 | 12 | 24 {
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
  if (hour < 2) return 3;
  if (hour < 6) return 6;
  if (hour < 12) return 12;
  return 24;
}

export function suggestMode(hour: number): GranuleMode {
  if (hour < 6) return "seed";
  if (hour < 12) return "ring";
  if (hour < 18) return "field";
  return "rim";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Granule[], roster: string): string {
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

export function readGranuleCards(raw: unknown): Granule[] {
  if (!Array.isArray(raw)) return [];
  const out: Granule[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Granule>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: granuleMode(row.piece),
      drop: granuleHour(row.drop),
      film: granuleFilm(row.film),
      lock: granuleHammer(row.lock) ?? 3,
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

export function addGranule(
  cards: readonly Granule[],
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
): Granule[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `g${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGranuleCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: granuleMode(card.piece),
      drop: granuleHour(card.drop),
      film: granuleFilm(card.film),
      lock: granuleHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Granule[], id: string, edit: (card: Granule) => Granule): Granule[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGranule(cards: readonly Granule[], id: string, title: string): Granule[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGranuleNote(cards: readonly Granule[], id: string, note: string): Granule[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "BLOOM", "PEARL", "SOOT"];
  const index = order.indexOf(granuleFilm(film));
  return order[(index + 1) % order.length] || "BLOOM";
}

export function setGranuleFilm(cards: readonly Granule[], id: string, film: string): Granule[] {
  const next = granuleFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setGranuleRaised(cards: readonly Granule[], id: string, raised: boolean): Granule[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setGranulePin(cards: readonly Granule[], id: string, pinned: boolean): Granule[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setGranuleCoffer(cards: readonly Granule[], id: string, coffered: boolean): Granule[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setGranuleStar(cards: readonly Granule[], id: string, starred: boolean): Granule[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addGranuleTag(cards: readonly Granule[], id: string, tag: string): Granule[] {
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

export function raiseHourFocused(cards: readonly Granule[], id: string): Granule[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Granule[], id: string): Granule[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Granule[], id: string): Granule[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Granule[], id: string): Granule[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setGranuleFocused(cards: readonly Granule[], id: string): Granule[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinGranuleFocused(cards: readonly Granule[], id: string): Granule[] {
  return setGranulePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starGranuleFocused(cards: readonly Granule[], id: string): Granule[] {
  return setGranuleStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Granule[], id: string): Granule[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGranuleFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Granule[], ids: readonly string[], edit: (card: Granule) => Granule): Granule[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGranuleSoot(cards: readonly Granule[], ids: readonly string[]): Granule[] {
  return bulk(cards, ids, (card) => (card.film === "SOOT" ? card : { ...card, film: "SOOT", audit: "film" }));
}

export function bulkGranuleRaise(cards: readonly Granule[], ids: readonly string[]): Granule[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkGranuleCoffer(cards: readonly Granule[], ids: readonly string[]): Granule[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkGranuleTag(cards: readonly Granule[], ids: readonly string[]): Granule[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readGranuleViews(raw: unknown): GranuleView[] {
  if (!Array.isArray(raw)) return [];
  const out: GranuleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GranuleView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeFinish(row.film, ["BLOOM", "PEARL", "SOOT"]),
      piece: activeMode(row.piece),
      drop: activeHour(row.drop),
      lock: activeHammer(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGranuleView(views: readonly GranuleView[], view: GranuleView): GranuleView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGranuleViews([...views, { ...view, id, name }]);
}

export function dropGranuleView(views: readonly GranuleView[], id: string): GranuleView[] {
  return views.filter((view) => view.id !== id);
}

export function granuleDensity(raw: unknown): GranuleDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortGranuleCards(cards: readonly Granule[], sort: GranuleSort): Granule[] {
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

export function visibleGranuleCards(
  cards: readonly Granule[],
  tray: GranuleTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Granule[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : granuleFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !granuleInner(card.piece)) return false;
    if (wantLimb === "outer" && !granuleOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An edge stripe on count four, still not raised and not in the drawer, is overdue. */
export function overdueGranule(card: Granule): boolean {
  return granuleOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}


/** No finish, pitch five, count four, and still on the bench. */
export function idleGranule(card: Granule): boolean {
  return !card.film && card.drop === 3 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, pitch forty, and a full count, still out of the drawer. */
export function briskGranule(card: Granule): boolean {
  return card.film === "BLOOM" && card.drop === 24 && card.lock === 9 && !card.coffered;
}


/** Fringe, ivory, and pitch ten. */
export function restingGranule(card: Granule): boolean {
  return card.piece === "rim" && card.film === "PEARL" && card.drop === 6;
}


/** A boss is late when the station is already on the crest. */
export function lateGranule(card: Granule, station: string): boolean {
  return card.piece === "seed" && granuleMode(station) === "rim" && !card.raised;
}


export function granuleCounts(cards: readonly Granule[], shown: readonly Granule[], station: string): GranuleCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => granuleInner(card.piece)).length,
    outer: cards.filter((card) => granuleOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 24).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleGranule).length,
    brisk: cards.filter(briskGranule).length,
    resting: cards.filter(restingGranule).length,
    overdue: cards.filter(overdueGranule).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateGranule(card, station)).length,
  };
}

export function granuleBars(cards: readonly Granule[]): { piece: string; count: number }[] {
  return GRN_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function granuleTimeline(cards: readonly Granule[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function granuleKeepers(cards: readonly Granule[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Granule[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of granuleKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGranuleCards(cards: readonly Granule[]): string[] {
  return cards.filter(overdueGranule).map((card) => card.title);
}

export function granuleCopy(card: Granule): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function granuleCsv(cards: readonly Granule[], station: string): string {
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
        granuleOuter(card.piece) ? "1" : "0",
        lateGranule(card, station) ? "1" : "0",
        idleGranule(card) ? "1" : "0",
        briskGranule(card) ? "1" : "0",
        restingGranule(card) ? "1" : "0",
        overdueGranule(card) ? "1" : "0",
        granuleInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        granuleBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const KPR_KEY = "crmv4-kpr-hide-372";
export const KPR_REVIEW_KEY = "crmv4-kpr-review-372";

export type KprLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type KprHue = "" | "ivory" | "graphite" | "champagne";
export type KprState = "" | "clear" | "set";
export type KprReview = "all" | "reviewed" | "fresh";
export type KprShape =
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

export type KprValue = string | { canManageUsers?: unknown; [key: string]: unknown } | null | undefined;
export type KprRow = { id: string; label: string; code: KprValue; userId?: string };
export type KprLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: KprValue): { canManageUsers?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: KprValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: KprValue): string {
  const row = codeRecord(raw);
  if (row && !("canManageUsers" in row)) return "";
  const value = row ? row.canManageUsers : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CLEAR";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: KprValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("canManageUsers" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function kprState(raw: KprValue): KprState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["VALID", "PASS", "CLEAN", "READY", "YES", "LIVE", "CLEAR", "FILE"]);
const DESK_TITLES = new Set(["CHECK", "LOOK", "ASK", "OPEN"]);
const HOLD_TITLES = new Set(["NEW", "WAIT", "PEND", "QUEUE"]);
const GUEST_TITLES = new Set(["FAIL", "BAD", "VOID", "DENY"]);
const JOIN_TITLES = new Set(["TWIN", "PAIR"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function kprLane(raw: KprValue, now = Date.now()): KprLane {
  if (kprState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/quiet|closed/i.test(text)) return "vacant";
  if (text.includes("&")) return "join";
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
    if (age < 9 * day) return "hold";
    return "guest";
  }
  if (text.includes("/")) return "route";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length === 4) return "brief";
  if (/\bclear\b|\bfile\b/i.test(text)) return "hall";
  if (text.length >= 10 && text.includes(":")) return "route";
  if (text.length >= 10) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function kprHue(raw: KprValue, now = Date.now()): KprHue {
  const mail = kprLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function kprHome(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "hall";
}

export function kprAway(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "vacant";
}

export function kprGuest(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "hold";
}

export function kprCitizen(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "guest";
}

export function kprDesk(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "desk";
}

export function kprJoin(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "join";
}

export function kprRoute(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "route";
}

export function kprBrief(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "brief";
}

export function kprLong(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "long";
}

export function kprStampMark(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "stamp";
}

export function kprVowelLane(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "vowel";
}

export function kprPlain(raw: KprValue, now = Date.now()): boolean {
  return kprLane(raw, now) === "plain";
}

export function kprOpen(raw: KprValue): boolean {
  return kprState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function kprHeld(raw: KprValue): boolean {
  const mail = kprLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function kprSoon(raw: KprValue, now = Date.now()): boolean {
  if (kprState(raw) !== "set") return false;
  if (kprBrief(raw, now)) return true;
  if (kprHome(raw, now) || kprAway(raw, now) || kprGuest(raw, now) || kprCitizen(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function kprLength(raw: KprValue): number | null {
  if (kprState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function kprEven(raw: KprValue): boolean {
  const length = kprLength(raw);
  return length !== null && length % 2 === 0;
}

export function kprOdd(raw: KprValue): boolean {
  const length = kprLength(raw);
  return length !== null && length % 2 === 1;
}

export function kprFirst(raw: KprValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function kprTail(raw: KprValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function kprCapital(raw: KprValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function kprSpace(raw: KprValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function kprVowel(raw: KprValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function kprDigit(raw: KprValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function kprLetter(raw: KprValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function kprMixed(raw: KprValue): boolean {
  return kprDigit(raw) && kprLetter(raw);
}

export function kprLower(raw: KprValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function kprUpper(raw: KprValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function kprStamp(raw: KprValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function kprCopy(raw: KprValue): string {
  return codeGiven(raw);
}

export function kprFamily(raw: KprValue): string {
  if (kprState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function kprLanes(rows: readonly KprRow[]): KprLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = kprLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly KprRow[]): string {
  const lines = kprLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly KprRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = kprHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly KprRow[], mail: KprLane): number {
  return rows.filter((row) => kprLane(row.code) === mail).length;
}

export function kprShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly KprRow[]): string[] {
  return kprLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: KprRow, shape: KprShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return kprHome(row.code);
  if (shape === "vacant") return kprAway(row.code);
  if (shape === "hold") return kprGuest(row.code);
  if (shape === "guest") return kprCitizen(row.code);
  if (shape === "join") return kprJoin(row.code);
  if (shape === "route") return kprRoute(row.code);
  if (shape === "brief") return kprBrief(row.code);
  if (shape === "long") return kprLong(row.code);
  if (shape === "stamp") return kprStampMark(row.code);
  if (shape === "vowel") return kprVowelLane(row.code);
  if (shape === "plain") return kprPlain(row.code);
  if (shape === "open") return kprOpen(row.code);
  if (shape === "soon") return kprSoon(row.code);
  if (shape === "letter") return kprLetter(row.code);
  if (shape === "mixed") return kprMixed(row.code);
  if (shape === "upper") return kprUpper(row.code);
  if (shape === "lower") return kprLower(row.code);
  if (shape === "space") return kprSpace(row.code);
  if (shape === "even") return kprEven(row.code);
  if (shape === "odd") return kprOdd(row.code);
  if (shape === "tail") return kprTail(row.code);
  if (shape === "first") return kprFirst(row.code);
  if (shape === "held") return kprHeld(row.code);
  return kprLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly KprRow[],
  mail: string,
  hue: string,
  query: string,
  review: KprReview,
  reviewed: readonly string[],
  shape: KprShape,
): KprRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (kprState(row.code) === "") return false;
    const found = kprLane(row.code);
    const hueName = kprHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${kprStamp(row.code)} ${kprFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function kprLanesCsv(rows: readonly KprRow[]): string {
  const lines = ["lane,count"];
  for (const line of kprLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function kprRowsCsv(rows: readonly KprRow[], reviewed: readonly string[]): string {
  const lines = ["name,canManageUsers,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(kprCopy(row.code)),
        kprStamp(row.code),
        csvCell(kprFamily(row.code)),
        kprLane(row.code),
        kprHue(row.code),
        kprLength(row.code) ?? "",
        kprHome(row.code) ? "1" : "0",
        kprAway(row.code) ? "1" : "0",
        kprGuest(row.code) ? "1" : "0",
        kprDesk(row.code) ? "1" : "0",
        kprCitizen(row.code) ? "1" : "0",
        kprJoin(row.code) ? "1" : "0",
        kprRoute(row.code) ? "1" : "0",
        kprBrief(row.code) ? "1" : "0",
        kprEven(row.code) ? "1" : "0",
        kprDigit(row.code) ? "1" : "0",
        kprMixed(row.code) ? "1" : "0",
        kprUpper(row.code) ? "1" : "0",
        kprVowel(row.code) ? "1" : "0",
        kprTail(row.code) ? "1" : "0",
        kprHeld(row.code) ? "1" : "0",
        kprSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
