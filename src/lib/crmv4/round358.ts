/**
 * Soleil sunburst rules for a dial kept in this browser,
 * and visit plates read lastLoginAt already stored on the account.
 * Bursts are radial, basket, flame, and sector. Finishes are gilt, ivory, and graphite.
 * Ray counts are 6, 12, 24, or 48. Rings are 4, 8, or 16.
 * Radial and basket are main. Flame and sector are side.
 * A login today is live. A login within seven days is this week. A login within thirty days is this month. An older login is stale.
 * IN is live. OFF is never. NONE is idle. An ampersand joins two marks. A colon that is not a time marks a route.
 * A brief mark is exactly six characters. A stamp starts with a digit and is not a time.
 * A long mark is twenty characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true mark reads as IN. A false mark reads as OFF. The plate does not change the saved last login.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_soleil (
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
 * CREATE TABLE crm_vst_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_vst_review (
 *   trader_id text primary key
 * );
 */

export const SBR_KEY = "crmv4-soleil";
export const SBR_VIEW_KEY = "crmv4-soleil-views";
export const SBR_DENSITY_KEY = "crmv4-soleil-density";
export const SBR_MODES = ["radial", "basket", "flame", "sector"] as const;

export type SoleilMode = (typeof SBR_MODES)[number];
export type SoleilFilm = "blank" | "gilt" | "ivory" | "graphite";
export type SoleilTray = "board" | "peg" | "coffer";
export type SoleilDensity = "airy" | "close";
export type SoleilSort = "piece" | "setter";

export type Soleil = {
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

export type SoleilView = {
  id: string;
  name: string;
  tray: SoleilTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type SoleilCounts = {
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

export const ROUND358_FEATURES = [
  "soleil-save",
  "ray-reminders",
  "soleil-modes",
  "soleil-search",
  "soleil-pin-sla",
  "ray-archive",
  "soleil-latch-star",
  "soleil-inline-title",
  "soleil-filters",
  "saved-soleil-views",
  "soleil-density",
  "ray-focus",
  "soleil-kpis",
  "ray-chart",
  "ray-timeline",
  "soleil-bulk",
  "soleil-csv",
  "soleil-keys",
  "soleil-audit",
  "fair-burster",
  "soleil-viewer",
  "suggest-ray",
  "overdue-ray",
  "visit-plate",
  "visit-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [6, 12, 24, 48] as const;
const LOCK_CYCLE = [4, 8, 16] as const;
const INNER = new Set(["radial", "basket"]);
const OUTER = new Set(["flame", "sector"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SoleilTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<SoleilFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<SoleilFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[rf]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Soleil, tray: SoleilTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return SBR_MODES.indexOf(piece as SoleilMode);
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

export function soleilMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SBR_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 6, 12, 24, or 48. Anything else stays blank. */
export function soleilHour(raw: unknown): 6 | 12 | 24 | 48 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "12" && text !== "24" && text !== "48") return null;
  return Number(text) as 6 | 12 | 24 | 48;
}

/** A line is 4, 8, or 16. Anything else stays blank. */
export function soleilHammer(raw: unknown): 4 | 8 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16") return null;
  return Number(text) as 4 | 8 | 16;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function soleilFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function soleilInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function soleilOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Straight is the bar. Circular is the ring. Wavy is the wave. Broken is the break. */
export function soleilBand(piece: unknown): string {
  const text = soleilMode(piece);
  if (!text) return "";
  if (text === "radial") return "ray";
  if (text === "basket") return "weave";
  if (text === "flame") return "tongue";
  return "wedge";
}

/** Signed distance from one mode to another along the stripe. */
export function soleilGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(soleilMode(from));
  const right = pieceIndex(soleilMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(soleilFilm(film));
}

/** A pair line is 8. Four and sixteen are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return soleilHammer(lock) === 8;
}

/** A full line is 16. */
export function fullHammer(lock: unknown): boolean {
  return soleilHammer(lock) === 16;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return soleilMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = soleilHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = soleilFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = soleilHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveGenevaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Soleil[]): string {
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

/** Before six, suggest pitch six. Before noon, suggest twelve. Before six in the evening, suggest twenty-four. Later, suggest forty-eight. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Soleil[], hour: number): 6 | 12 | 24 | 48 {
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

export function suggestMode(hour: number): SoleilMode {
  return hour < 6 ? "radial" : "sector";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Soleil[], roster: string): string {
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

export function readGenevas(raw: unknown): Soleil[] {
  if (!Array.isArray(raw)) return [];
  const out: Soleil[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Soleil>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: soleilMode(row.piece),
      drop: soleilHour(row.drop),
      film: soleilFilm(row.film),
      lock: soleilHammer(row.lock) ?? 4,
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

export function addGeneva(
  cards: readonly Soleil[],
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
): Soleil[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGenevas([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: soleilMode(card.piece),
      drop: soleilHour(card.drop),
      film: soleilFilm(card.film),
      lock: soleilHammer(card.lock) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Soleil[], id: string, edit: (card: Soleil) => Soleil): Soleil[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGeneva(cards: readonly Soleil[], id: string, title: string): Soleil[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGenevaNote(cards: readonly Soleil[], id: string, note: string): Soleil[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(soleilFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setGenevaFilm(cards: readonly Soleil[], id: string, film: string): Soleil[] {
  const next = soleilFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setGenevaRaised(cards: readonly Soleil[], id: string, raised: boolean): Soleil[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setGenevaPin(cards: readonly Soleil[], id: string, pinned: boolean): Soleil[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setGenevaCoffer(cards: readonly Soleil[], id: string, coffered: boolean): Soleil[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setGenevaStar(cards: readonly Soleil[], id: string, starred: boolean): Soleil[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addGenevaTag(cards: readonly Soleil[], id: string, tag: string): Soleil[] {
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

function stepLock(lock: number, dir: 1 | -1): 4 | 8 | 16 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setGenevaFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinGenevaFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return setGenevaPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starGenevaFocused(cards: readonly Soleil[], id: string): Soleil[] {
  return setGenevaStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Soleil[], id: string): Soleil[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGenevaFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Soleil[], ids: readonly string[], edit: (card: Soleil) => Soleil): Soleil[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGenevaGraphite(cards: readonly Soleil[], ids: readonly string[]): Soleil[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkGenevaRaise(cards: readonly Soleil[], ids: readonly string[]): Soleil[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkGenevaCoffer(cards: readonly Soleil[], ids: readonly string[]): Soleil[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkGenevaTag(cards: readonly Soleil[], ids: readonly string[]): Soleil[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "f"]), audit: "tag" }));
}

export function readGenevaViews(raw: unknown): SoleilView[] {
  if (!Array.isArray(raw)) return [];
  const out: SoleilView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SoleilView>;
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

export function addGenevaView(views: readonly SoleilView[], view: SoleilView): SoleilView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGenevaViews([...views, { ...view, id, name }]);
}

export function dropGenevaView(views: readonly SoleilView[], id: string): SoleilView[] {
  return views.filter((view) => view.id !== id);
}

export function soleilDensity(raw: unknown): SoleilDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortGenevas(cards: readonly Soleil[], sort: SoleilSort): Soleil[] {
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

export function visibleGenevas(
  cards: readonly Soleil[],
  tray: SoleilTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Soleil[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : soleilFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !soleilInner(card.piece)) return false;
    if (wantLimb === "outer" && !soleilOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side mode on line four, still not raised and not in the drawer, is overdue. */
export function overdueGeneva(card: Soleil): boolean {
  return soleilOuter(card.piece) && card.lock === 4 && !card.raised && !card.coffered;
}

/** No finish, the short pitch, line four, and still on the bench. */
export function idleGeneva(card: Soleil): boolean {
  return !card.film && card.drop === 6 && card.lock === 4 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall pitch, and a full line, still out of the drawer. */
export function briskGeneva(card: Soleil): boolean {
  return card.film === "GILT" && card.drop === 48 && card.lock === 16 && !card.coffered;
}

/** Broken, ivory, and pitch twelve. */
export function restingGeneva(card: Soleil): boolean {
  return card.piece === "sector" && card.film === "IVORY" && card.drop === 12;
}

/** A straight stripe is late when the station is already broken. */
export function lateGeneva(card: Soleil, station: string): boolean {
  return card.piece === "radial" && soleilMode(station) === "sector" && !card.raised;
}

export function soleilCounts(cards: readonly Soleil[], shown: readonly Soleil[], station: string): SoleilCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => soleilInner(card.piece)).length,
    outer: cards.filter((card) => soleilOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 48).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleGeneva).length,
    brisk: cards.filter(briskGeneva).length,
    resting: cards.filter(restingGeneva).length,
    overdue: cards.filter(overdueGeneva).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateGeneva(card, station)).length,
  };
}

export function soleilBars(cards: readonly Soleil[]): { piece: string; count: number }[] {
  return SBR_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function soleilTimeline(cards: readonly Soleil[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function soleilKeepers(cards: readonly Soleil[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Soleil[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of soleilKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGenevas(cards: readonly Soleil[]): string[] {
  return cards.filter(overdueGeneva).map((card) => card.title);
}

export function soleilCopy(card: Soleil): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function soleilCsv(cards: readonly Soleil[], station: string): string {
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
        soleilOuter(card.piece) ? "1" : "0",
        lateGeneva(card, station) ? "1" : "0",
        idleGeneva(card) ? "1" : "0",
        briskGeneva(card) ? "1" : "0",
        restingGeneva(card) ? "1" : "0",
        overdueGeneva(card) ? "1" : "0",
        soleilInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        soleilBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const VST_KEY = "crmv4-vst-hide";
export const VST_REVIEW_KEY = "crmv4-vst-review";

export type VstLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type VstHue = "" | "ivory" | "graphite" | "champagne";
export type VstState = "" | "clear" | "set";
export type VstReview = "all" | "reviewed" | "fresh";
export type VstShape =
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

export type VstValue = string | { lastLoginAt?: unknown; [key: string]: unknown } | null | undefined;
export type VstRow = { id: string; label: string; code: VstValue };
export type VstLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: VstValue): { lastLoginAt?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: VstValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: VstValue): string {
  const row = codeRecord(raw);
  if (row && !("lastLoginAt" in row)) return "";
  const value = row ? row.lastLoginAt : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "IN";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return clip(value, 48);
}

function codeReadable(raw: VstValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastLoginAt" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function vstState(raw: VstValue): VstState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A login today is live. A login within seven days is this week. A login within thirty days is this month. An older login is stale. IN is live. OFF is never. NONE is idle. An ampersand joins two marks. A colon that is not a time marks a route. A brief mark is exactly six characters. A stamp starts with a digit and is not a time. A long mark is twenty characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function vstLane(raw: VstValue, now = Date.now()): VstLane {
  if (vstState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (upper === "IN" || upper === "LIVE" || upper === "ON") return "hall";
  if (upper === "OFF" || upper === "NEVER") return "vacant";
  if (upper === "NONE") return "plain";
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
    if (age < 7 * day) return "desk";
    if (age < 30 * day) return "hold";
    return "guest";
  }
  if (text.includes(":")) return "route";
  if (text.length === 6) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 20) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function vstHue(raw: VstValue, now = Date.now()): VstHue {
  const mail = vstLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function vstHome(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "hall";
}

export function vstAway(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "vacant";
}

export function vstGuest(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "hold";
}

export function vstCitizen(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "guest";
}

export function vstDesk(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "desk";
}

export function vstJoin(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "join";
}

export function vstRoute(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "route";
}

export function vstBrief(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "brief";
}

export function vstLong(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "long";
}

export function vstStampMark(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "stamp";
}

export function vstVowelLane(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "vowel";
}

export function vstPlain(raw: VstValue, now = Date.now()): boolean {
  return vstLane(raw, now) === "plain";
}

export function vstOpen(raw: VstValue): boolean {
  return vstState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function vstHeld(raw: VstValue): boolean {
  const mail = vstLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or an eight-character mark that is not a known visit, still wants a fuller name. */
export function vstSoon(raw: VstValue, now = Date.now()): boolean {
  if (vstState(raw) !== "set") return false;
  if (vstBrief(raw, now)) return true;
  if (vstHome(raw, now) || vstAway(raw, now) || vstGuest(raw, now) || vstCitizen(raw, now)) return false;
  return codeGiven(raw).length === 8;
}

export function vstLength(raw: VstValue): number | null {
  if (vstState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function vstEven(raw: VstValue): boolean {
  const length = vstLength(raw);
  return length !== null && length % 2 === 0;
}

export function vstOdd(raw: VstValue): boolean {
  const length = vstLength(raw);
  return length !== null && length % 2 === 1;
}

export function vstFirst(raw: VstValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function vstTail(raw: VstValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function vstCapital(raw: VstValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function vstSpace(raw: VstValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function vstVowel(raw: VstValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function vstDigit(raw: VstValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function vstLetter(raw: VstValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function vstMixed(raw: VstValue): boolean {
  return vstDigit(raw) && vstLetter(raw);
}

export function vstLower(raw: VstValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function vstUpper(raw: VstValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function vstStamp(raw: VstValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function vstCopy(raw: VstValue): string {
  return codeGiven(raw);
}

export function vstFamily(raw: VstValue): string {
  if (vstState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function vstLanes(rows: readonly VstRow[]): VstLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = vstLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly VstRow[]): string {
  const lines = vstLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly VstRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = vstHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly VstRow[], mail: VstLane): number {
  return rows.filter((row) => vstLane(row.code) === mail).length;
}

export function vstShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly VstRow[]): string[] {
  return vstLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: VstRow, shape: VstShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return vstHome(row.code);
  if (shape === "vacant") return vstAway(row.code);
  if (shape === "hold") return vstGuest(row.code);
  if (shape === "guest") return vstCitizen(row.code);
  if (shape === "join") return vstJoin(row.code);
  if (shape === "route") return vstRoute(row.code);
  if (shape === "brief") return vstBrief(row.code);
  if (shape === "long") return vstLong(row.code);
  if (shape === "stamp") return vstStampMark(row.code);
  if (shape === "vowel") return vstVowelLane(row.code);
  if (shape === "plain") return vstPlain(row.code);
  if (shape === "open") return vstOpen(row.code);
  if (shape === "soon") return vstSoon(row.code);
  if (shape === "letter") return vstLetter(row.code);
  if (shape === "mixed") return vstMixed(row.code);
  if (shape === "upper") return vstUpper(row.code);
  if (shape === "lower") return vstLower(row.code);
  if (shape === "space") return vstSpace(row.code);
  if (shape === "even") return vstEven(row.code);
  if (shape === "odd") return vstOdd(row.code);
  if (shape === "tail") return vstTail(row.code);
  if (shape === "first") return vstFirst(row.code);
  if (shape === "held") return vstHeld(row.code);
  return vstLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly VstRow[],
  mail: string,
  hue: string,
  query: string,
  review: VstReview,
  reviewed: readonly string[],
  shape: VstShape,
): VstRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (vstState(row.code) === "") return false;
    const found = vstLane(row.code);
    const hueName = vstHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${vstStamp(row.code)} ${vstFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function vstLanesCsv(rows: readonly VstRow[]): string {
  const lines = ["lane,count"];
  for (const line of vstLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function vstRowsCsv(rows: readonly VstRow[], reviewed: readonly string[]): string {
  const lines = ["name,lastLoginAt,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(vstCopy(row.code)),
        vstStamp(row.code),
        csvCell(vstFamily(row.code)),
        vstLane(row.code),
        vstHue(row.code),
        vstLength(row.code) ?? "",
        vstHome(row.code) ? "1" : "0",
        vstAway(row.code) ? "1" : "0",
        vstGuest(row.code) ? "1" : "0",
        vstDesk(row.code) ? "1" : "0",
        vstCitizen(row.code) ? "1" : "0",
        vstJoin(row.code) ? "1" : "0",
        vstRoute(row.code) ? "1" : "0",
        vstBrief(row.code) ? "1" : "0",
        vstEven(row.code) ? "1" : "0",
        vstDigit(row.code) ? "1" : "0",
        vstMixed(row.code) ? "1" : "0",
        vstUpper(row.code) ? "1" : "0",
        vstVowel(row.code) ? "1" : "0",
        vstTail(row.code) ? "1" : "0",
        vstHeld(row.code) ? "1" : "0",
        vstSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
