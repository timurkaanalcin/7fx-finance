/**
 * Repoussé chase rules for a raised boss kept in this browser,
 * and affiliate B plates read affiliateB already stored on the account.
 * Bosses are boss, lobe, scroll, and rim. Finishes are gilt, ivory, and graphite.
 * Pitches are 6, 12, 18, or 36. Counts are 3, 6, or 9.
 * Boss and lobe are the relief. Scroll and rim are the border.
 * Partner, desk, house, and YES are house codes. Web and form sit the desk.
 * Wait and hold are on hold. Lost and void are guests.
 * Twin and split are joined. None, no, and blank stay plain.
 * An ampersand joins two codes. A slash that is not a time marks a scoped code.
 * A time today is a house code. Within three days is the desk. Within nine days is hold. Older is a guest.
 * A brief code is exactly six characters. A digit code starts with a digit and is not a time.
 * A long code is fourteen characters or longer and does not start with a digit. A vowel code starts with a vowel.
 * The words partner and desk are house codes. Quiet or dormant is shut.
 * A true code reads as PARTNER. A false code reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved code.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_repousse_chase (
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
 * CREATE TABLE crm_afb_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_afb_review (
 *   trader_id text primary key
 * );
 */


export const RPS_KEY = "crmv4-repousse-368";
export const RPS_VIEW_KEY = "crmv4-repousse-views-368";
export const RPS_DENSITY_KEY = "crmv4-repousse-density-368";
export const RPS_MODES = ["boss", "lobe", "scroll", "rim"] as const;

export type RepousseMode = (typeof RPS_MODES)[number];
export type RepousseFilm = "blank" | "gilt" | "ivory" | "graphite";
export type RepousseTray = "board" | "peg" | "coffer";
export type RepousseDensity = "airy" | "close";
export type RepousseSort = "piece" | "setter";

export type Repousse = {
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

export type RepousseView = {
  id: string;
  name: string;
  tray: RepousseTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type RepousseCounts = {
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

export const ROUND368_FEATURES = [
  "repousse-save",
  "chase-reminders",
  "repousse-modes",
  "repousse-search",
  "repousse-pitch-sla",
  "chase-archive",
  "repousse-count-star",
  "repousse-inline-title",
  "repousse-filters",
  "saved-repousse-views",
  "repousse-density",
  "chase-focus",
  "repousse-kpis",
  "chase-chart",
  "chase-timeline",
  "repousse-bulk",
  "repousse-csv",
  "repousse-keys",
  "repousse-audit",
  "fair-chaser",
  "repousse-viewer",
  "suggest-boss",
  "overdue-border",
  "affiliate-b-plate",
  "affiliate-b-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [6, 12, 18, 36] as const;
const LOCK_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["boss", "lobe"]);
const OUTER = new Set(["scroll", "rim"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 18;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RepousseTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<RepousseFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<RepousseFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[rp]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Repousse, tray: RepousseTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return RPS_MODES.indexOf(piece as RepousseMode);
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

export function repousseMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RPS_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function repousseHour(raw: unknown): 6 | 12 | 18 | 36 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "12" && text !== "18" && text !== "36") return null;
  return Number(text) as 6 | 12 | 18 | 36;
}

/** A weave count is 4, 7, or 11. Anything else stays blank. */
export function repousseHammer(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function repousseFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function repousseInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function repousseOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Warp is the reed. Weft is the shuttle. Selvage is the edge. Fringe is the tassel. */
export function repousseBand(piece: unknown): string {
  const text = repousseMode(piece);
  if (!text) return "";
  if (text === "boss") return "relief";
  if (text === "lobe") return "swell";
  if (text === "scroll") return "border";
  return "edge";
}

/** Signed distance from one mode to another along the stripe. */
export function repousseGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(repousseMode(from));
  const right = pieceIndex(repousseMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(repousseFilm(film));
}

/** A pair count is 7. Four and eleven are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return repousseHammer(lock) === 6;
}

/** A full count is 11. */
export function fullHammer(lock: unknown): boolean {
  return repousseHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return repousseMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = repousseHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = repousseFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = repousseHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveRepousseFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Repousse[]): string {
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

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest twenty. Later, suggest forty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Repousse[], hour: number): 6 | 12 | 18 | 36 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 6 | 12 | 18 | 36 = 6;
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
  if (hour < 18) return 18;
  return 36;
}

export function suggestMode(hour: number): RepousseMode {
  return hour < 9 ? "boss" : "rim";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Repousse[], roster: string): string {
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

export function readRepousseCards(raw: unknown): Repousse[] {
  if (!Array.isArray(raw)) return [];
  const out: Repousse[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Repousse>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: repousseMode(row.piece),
      drop: repousseHour(row.drop),
      film: repousseFilm(row.film),
      lock: repousseHammer(row.lock) ?? 3,
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

export function addRepousse(
  cards: readonly Repousse[],
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
): Repousse[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRepousseCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: repousseMode(card.piece),
      drop: repousseHour(card.drop),
      film: repousseFilm(card.film),
      lock: repousseHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Repousse[], id: string, edit: (card: Repousse) => Repousse): Repousse[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRepousse(cards: readonly Repousse[], id: string, title: string): Repousse[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRepousseNote(cards: readonly Repousse[], id: string, note: string): Repousse[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(repousseFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRepousseFilm(cards: readonly Repousse[], id: string, film: string): Repousse[] {
  const next = repousseFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setRepousseRaised(cards: readonly Repousse[], id: string, raised: boolean): Repousse[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setRepoussePin(cards: readonly Repousse[], id: string, pinned: boolean): Repousse[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setRepousseCoffer(cards: readonly Repousse[], id: string, coffered: boolean): Repousse[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setRepousseStar(cards: readonly Repousse[], id: string, starred: boolean): Repousse[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRepousseTag(cards: readonly Repousse[], id: string, tag: string): Repousse[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 6 | 12 | 18 | 36 {
  if (drop === null) return dir > 0 ? 6 : 36;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setRepousseFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinRepousseFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return setRepoussePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starRepousseFocused(cards: readonly Repousse[], id: string): Repousse[] {
  return setRepousseStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Repousse[], id: string): Repousse[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRepousseFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Repousse[], ids: readonly string[], edit: (card: Repousse) => Repousse): Repousse[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRepousseGraphite(cards: readonly Repousse[], ids: readonly string[]): Repousse[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkRepousseRaise(cards: readonly Repousse[], ids: readonly string[]): Repousse[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkRepousseCoffer(cards: readonly Repousse[], ids: readonly string[]): Repousse[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkRepousseTag(cards: readonly Repousse[], ids: readonly string[]): Repousse[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readRepousseViews(raw: unknown): RepousseView[] {
  if (!Array.isArray(raw)) return [];
  const out: RepousseView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RepousseView>;
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

export function addRepousseView(views: readonly RepousseView[], view: RepousseView): RepousseView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRepousseViews([...views, { ...view, id, name }]);
}

export function dropRepousseView(views: readonly RepousseView[], id: string): RepousseView[] {
  return views.filter((view) => view.id !== id);
}

export function repousseDensity(raw: unknown): RepousseDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortRepousseCards(cards: readonly Repousse[], sort: RepousseSort): Repousse[] {
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

export function visibleRepousseCards(
  cards: readonly Repousse[],
  tray: RepousseTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Repousse[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : repousseFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !repousseInner(card.piece)) return false;
    if (wantLimb === "outer" && !repousseOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An edge stripe on count four, still not raised and not in the drawer, is overdue. */
export function overdueRepousse(card: Repousse): boolean {
  return repousseOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}


/** No finish, pitch five, count four, and still on the bench. */
export function idleRepousse(card: Repousse): boolean {
  return !card.film && card.drop === 6 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, pitch forty, and a full count, still out of the drawer. */
export function briskRepousse(card: Repousse): boolean {
  return card.film === "GILT" && card.drop === 36 && card.lock === 9 && !card.coffered;
}


/** Fringe, ivory, and pitch ten. */
export function restingRepousse(card: Repousse): boolean {
  return card.piece === "rim" && card.film === "IVORY" && card.drop === 12;
}


/** A boss is late when the station is already on the rim. */
export function lateRepousse(card: Repousse, station: string): boolean {
  return card.piece === "boss" && repousseMode(station) === "rim" && !card.raised;
}


export function repousseCounts(cards: readonly Repousse[], shown: readonly Repousse[], station: string): RepousseCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => repousseInner(card.piece)).length,
    outer: cards.filter((card) => repousseOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 36).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRepousse).length,
    brisk: cards.filter(briskRepousse).length,
    resting: cards.filter(restingRepousse).length,
    overdue: cards.filter(overdueRepousse).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateRepousse(card, station)).length,
  };
}

export function repousseBars(cards: readonly Repousse[]): { piece: string; count: number }[] {
  return RPS_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function repousseTimeline(cards: readonly Repousse[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function repousseKeepers(cards: readonly Repousse[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Repousse[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of repousseKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRepousseCards(cards: readonly Repousse[]): string[] {
  return cards.filter(overdueRepousse).map((card) => card.title);
}

export function repousseCopy(card: Repousse): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function repousseCsv(cards: readonly Repousse[], station: string): string {
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
        repousseOuter(card.piece) ? "1" : "0",
        lateRepousse(card, station) ? "1" : "0",
        idleRepousse(card) ? "1" : "0",
        briskRepousse(card) ? "1" : "0",
        restingRepousse(card) ? "1" : "0",
        overdueRepousse(card) ? "1" : "0",
        repousseInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        repousseBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const AFB_KEY = "crmv4-afb-hide-368";
export const AFB_REVIEW_KEY = "crmv4-afb-review-368";

export type LisLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type LisHue = "" | "ivory" | "graphite" | "champagne";
export type LisState = "" | "clear" | "set";
export type LisReview = "all" | "reviewed" | "fresh";
export type LisShape =
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

export type LisValue = string | { affiliateB?: unknown; [key: string]: unknown } | null | undefined;
export type LisRow = { id: string; label: string; code: LisValue };
export type LisLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: LisValue): { affiliateB?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: LisValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: LisValue): string {
  const row = codeRecord(raw);
  if (row && !("affiliateB" in row)) return "";
  const value = row ? row.affiliateB : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "PARTNER";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: LisValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("affiliateB" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function afbState(raw: LisValue): LisState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["PARTNER", "DESK", "HOUSE", "YES"]);
const DESK_TITLES = new Set(["WEB", "FORM"]);
const HOLD_TITLES = new Set(["WAIT", "HOLD"]);
const GUEST_TITLES = new Set(["LOST", "VOID"]);
const JOIN_TITLES = new Set(["TWIN", "SPLIT"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function afbLane(raw: LisValue, now = Date.now()): LisLane {
  if (afbState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/quiet|dormant/i.test(text)) return "vacant";
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
  if (text.length === 6) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (/\bpartner\b|\bdesk\b/i.test(text)) return "hall";
  if (text.length >= 14 && text.includes(":")) return "route";
  if (text.length >= 14) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function afbHue(raw: LisValue, now = Date.now()): LisHue {
  const mail = afbLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function afbHome(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "hall";
}

export function afbAway(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "vacant";
}

export function afbGuest(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "hold";
}

export function afbCitizen(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "guest";
}

export function afbDesk(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "desk";
}

export function afbJoin(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "join";
}

export function afbRoute(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "route";
}

export function afbBrief(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "brief";
}

export function afbLong(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "long";
}

export function afbStampMark(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "stamp";
}

export function afbVowelLane(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "vowel";
}

export function afbPlain(raw: LisValue, now = Date.now()): boolean {
  return afbLane(raw, now) === "plain";
}

export function afbOpen(raw: LisValue): boolean {
  return afbState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function afbHeld(raw: LisValue): boolean {
  const mail = afbLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function afbSoon(raw: LisValue, now = Date.now()): boolean {
  if (afbState(raw) !== "set") return false;
  if (afbBrief(raw, now)) return true;
  if (afbHome(raw, now) || afbAway(raw, now) || afbGuest(raw, now) || afbCitizen(raw, now)) return false;
  return codeGiven(raw).length === 8;
}

export function afbLength(raw: LisValue): number | null {
  if (afbState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function afbEven(raw: LisValue): boolean {
  const length = afbLength(raw);
  return length !== null && length % 2 === 0;
}

export function afbOdd(raw: LisValue): boolean {
  const length = afbLength(raw);
  return length !== null && length % 2 === 1;
}

export function afbFirst(raw: LisValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function afbTail(raw: LisValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function afbCapital(raw: LisValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function afbSpace(raw: LisValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function afbVowel(raw: LisValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function afbDigit(raw: LisValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function afbLetter(raw: LisValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function afbMixed(raw: LisValue): boolean {
  return afbDigit(raw) && afbLetter(raw);
}

export function afbLower(raw: LisValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function afbUpper(raw: LisValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 9 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function afbStamp(raw: LisValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function afbCopy(raw: LisValue): string {
  return codeGiven(raw);
}

export function afbFamily(raw: LisValue): string {
  if (afbState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function afbLanes(rows: readonly LisRow[]): LisLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = afbLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly LisRow[]): string {
  const lines = afbLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly LisRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = afbHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly LisRow[], mail: LisLane): number {
  return rows.filter((row) => afbLane(row.code) === mail).length;
}

export function afbShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly LisRow[]): string[] {
  return afbLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: LisRow, shape: LisShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return afbHome(row.code);
  if (shape === "vacant") return afbAway(row.code);
  if (shape === "hold") return afbGuest(row.code);
  if (shape === "guest") return afbCitizen(row.code);
  if (shape === "join") return afbJoin(row.code);
  if (shape === "route") return afbRoute(row.code);
  if (shape === "brief") return afbBrief(row.code);
  if (shape === "long") return afbLong(row.code);
  if (shape === "stamp") return afbStampMark(row.code);
  if (shape === "vowel") return afbVowelLane(row.code);
  if (shape === "plain") return afbPlain(row.code);
  if (shape === "open") return afbOpen(row.code);
  if (shape === "soon") return afbSoon(row.code);
  if (shape === "letter") return afbLetter(row.code);
  if (shape === "mixed") return afbMixed(row.code);
  if (shape === "upper") return afbUpper(row.code);
  if (shape === "lower") return afbLower(row.code);
  if (shape === "space") return afbSpace(row.code);
  if (shape === "even") return afbEven(row.code);
  if (shape === "odd") return afbOdd(row.code);
  if (shape === "tail") return afbTail(row.code);
  if (shape === "first") return afbFirst(row.code);
  if (shape === "held") return afbHeld(row.code);
  return afbLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly LisRow[],
  mail: string,
  hue: string,
  query: string,
  review: LisReview,
  reviewed: readonly string[],
  shape: LisShape,
): LisRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (afbState(row.code) === "") return false;
    const found = afbLane(row.code);
    const hueName = afbHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${afbStamp(row.code)} ${afbFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function afbLanesCsv(rows: readonly LisRow[]): string {
  const lines = ["lane,count"];
  for (const line of afbLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function afbRowsCsv(rows: readonly LisRow[], reviewed: readonly string[]): string {
  const lines = ["name,affiliateB,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(afbCopy(row.code)),
        afbStamp(row.code),
        csvCell(afbFamily(row.code)),
        afbLane(row.code),
        afbHue(row.code),
        afbLength(row.code) ?? "",
        afbHome(row.code) ? "1" : "0",
        afbAway(row.code) ? "1" : "0",
        afbGuest(row.code) ? "1" : "0",
        afbDesk(row.code) ? "1" : "0",
        afbCitizen(row.code) ? "1" : "0",
        afbJoin(row.code) ? "1" : "0",
        afbRoute(row.code) ? "1" : "0",
        afbBrief(row.code) ? "1" : "0",
        afbEven(row.code) ? "1" : "0",
        afbDigit(row.code) ? "1" : "0",
        afbMixed(row.code) ? "1" : "0",
        afbUpper(row.code) ? "1" : "0",
        afbVowel(row.code) ? "1" : "0",
        afbTail(row.code) ? "1" : "0",
        afbHeld(row.code) ? "1" : "0",
        afbSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
