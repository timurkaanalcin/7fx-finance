/**
 * Retrograde rules for a returning hand kept in this browser, and assignment plates read assigneeId already stored on the account.
 * Modes are sector, arc, fan, and snail. Finishes are gilt, ivory, and graphite.
 * Sweeps are 3, 9, 15, or 21. Studs are 2, 5, or 9.
 * Sector and arc are inner. Fan and snail are outer.
 * A known assignment mark is LEAD, DESK, RETN, or KEEP. An ampersand joins two marks. A comma marks a pause.
 * A brief assignment is exactly eight characters. A stamp starts with a digit. A long assignment is twenty characters or longer and does not start with a digit. A vowel assignment starts with a vowel.
 * A true assignment reads as LEAD. An empty assignment reads as NONE. The plate does not change who is assigned.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_retrograde (
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
 * CREATE TABLE crm_assignment_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_assignment_review (
 *   trader_id text primary key
 * );
 */
export const RTG_KEY = "crmv4-retrograde";
export const RTG_VIEW_KEY = "crmv4-retrograde-views";
export const RTG_DENSITY_KEY = "crmv4-retrograde-density";
export const RTG_MODES = ["sector", "arc", "fan", "snail"] as const;

export type RetrogradeMode = (typeof RTG_MODES)[number];
export type RetrogradeFilm = "blank" | "gilt" | "ivory" | "graphite";
export type RetrogradeTray = "board" | "peg" | "coffer";
export type RetrogradeDensity = "airy" | "close";
export type RetrogradeSort = "piece" | "setter";

export type Retrograde = {
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

export type RetrogradeView = {
  id: string;
  name: string;
  tray: RetrogradeTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type RetrogradeCounts = {
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

export const ROUND347_FEATURES = [
  "retrograde-save",
  "sector-reminders",
  "retrograde-modes",
  "retrograde-search",
  "retrograde-pin-sla",
  "sector-archive",
  "retrograde-latch-star",
  "retrograde-inline-title",
  "retrograde-filters",
  "saved-retrograde-views",
  "retrograde-density",
  "keeper-order",
  "retrograde-kpis",
  "sector-chart",
  "sector-timeline",
  "retrograde-bulk",
  "retrograde-csv",
  "retrograde-keys",
  "retrograde-audit",
  "fair-keeper",
  "retrograde-viewer",
  "suggest-sector",
  "overdue-sectors",
  "assignment-plate",
  "assignment-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [3, 9, 15, 21] as const;
const LOCK_CYCLE = [2, 5, 9] as const;
const INNER = new Set(["sector", "arc"]);
const OUTER = new Set(["fan", "snail"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["LEAD", "DESK", "RETN", "KEEP"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RetrogradeTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<RetrogradeFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<RetrogradeFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[rg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Retrograde, tray: RetrogradeTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return RTG_MODES.indexOf(piece as RetrogradeMode);
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

export function retrogradeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RTG_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function retrogradeHour(raw: unknown): 3 | 9 | 15 | 21 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "9" && text !== "15" && text !== "21") return null;
  return Number(text) as 3 | 9 | 15 | 21;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function retrogradeHammer(raw: unknown): 2 | 5 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "9") return null;
  return Number(text) as 2 | 5 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function retrogradeFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function retrogradeInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function retrogradeOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function retrogradeBand(piece: unknown): string {
  const text = retrogradeMode(piece);
  if (!text) return "";
  if (text === "sector") return "span";
  if (text === "arc") return "bow";
  if (text === "fan") return "leaf";
  return "coil";
}

/** Signed distance from one piece to another along the oscillator. */
export function retrogradeGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(retrogradeMode(from));
  const right = pieceIndex(retrogradeMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(retrogradeFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return retrogradeHammer(lock) === 5;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return retrogradeHammer(lock) === 9;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return retrogradeMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = retrogradeHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = retrogradeFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = retrogradeHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveRetrogradeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Retrograde[]): string {
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
export function suggestHour(cards: readonly Retrograde[], hour: number): 3 | 9 | 15 | 21 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 9 | 15 | 21 = 3;
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
  if (hour < 18) return 15;
  return 21;
}

export function suggestMode(hour: number): RetrogradeMode {
  return hour < 12 ? "sector" : "snail";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Retrograde[], roster: string): string {
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

export function readRetrogrades(raw: unknown): Retrograde[] {
  if (!Array.isArray(raw)) return [];
  const out: Retrograde[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Retrograde>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: retrogradeMode(row.piece),
      drop: retrogradeHour(row.drop),
      film: retrogradeFilm(row.film),
      lock: retrogradeHammer(row.lock) ?? 2,
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

export function addRetrograde(
  cards: readonly Retrograde[],
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
): Retrograde[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRetrogrades([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: retrogradeMode(card.piece),
      drop: retrogradeHour(card.drop),
      film: retrogradeFilm(card.film),
      lock: retrogradeHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Retrograde[], id: string, edit: (card: Retrograde) => Retrograde): Retrograde[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRetrograde(cards: readonly Retrograde[], id: string, title: string): Retrograde[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRetrogradeNote(cards: readonly Retrograde[], id: string, note: string): Retrograde[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(retrogradeFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRetrogradeFilm(cards: readonly Retrograde[], id: string, film: string): Retrograde[] {
  const next = retrogradeFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setRetrogradeRaised(cards: readonly Retrograde[], id: string, raised: boolean): Retrograde[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setRetrogradePin(cards: readonly Retrograde[], id: string, pinned: boolean): Retrograde[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setRetrogradeCoffer(cards: readonly Retrograde[], id: string, coffered: boolean): Retrograde[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setRetrogradeStar(cards: readonly Retrograde[], id: string, starred: boolean): Retrograde[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRetrogradeTag(cards: readonly Retrograde[], id: string, tag: string): Retrograde[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 3 | 9 | 15 | 21 {
  if (drop === null) return dir > 0 ? 3 : 21;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 5 | 9 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setRetrogradeFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinRetrogradeFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return setRetrogradePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starRetrogradeFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  return setRetrogradeStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Retrograde[], id: string): Retrograde[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRetrogradeFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Retrograde[], ids: readonly string[], edit: (card: Retrograde) => Retrograde): Retrograde[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRetrogradeGraphite(cards: readonly Retrograde[], ids: readonly string[]): Retrograde[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkRetrogradeRaise(cards: readonly Retrograde[], ids: readonly string[]): Retrograde[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkRetrogradeCoffer(cards: readonly Retrograde[], ids: readonly string[]): Retrograde[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkRetrogradeTag(cards: readonly Retrograde[], ids: readonly string[]): Retrograde[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "g"]), audit: "tag" }));
}

export function readRetrogradeViews(raw: unknown): RetrogradeView[] {
  if (!Array.isArray(raw)) return [];
  const out: RetrogradeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RetrogradeView>;
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

export function addRetrogradeView(views: readonly RetrogradeView[], view: RetrogradeView): RetrogradeView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRetrogradeViews([...views, { ...view, id, name }]);
}

export function dropRetrogradeView(views: readonly RetrogradeView[], id: string): RetrogradeView[] {
  return views.filter((view) => view.id !== id);
}

export function retrogradeDensity(raw: unknown): RetrogradeDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortRetrogrades(cards: readonly Retrograde[], sort: RetrogradeSort): Retrograde[] {
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

export function visibleRetrogrades(
  cards: readonly Retrograde[],
  tray: RetrogradeTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Retrograde[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : retrogradeFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !retrogradeInner(card.piece)) return false;
    if (wantLimb === "outer" && !retrogradeOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueRetrograde(card: Retrograde): boolean {
  return retrogradeOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleRetrograde(card: Retrograde): boolean {
  return !card.film && card.drop === 3 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskRetrograde(card: Retrograde): boolean {
  return card.film === "GILT" && card.drop === 21 && card.lock === 9 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingRetrograde(card: Retrograde): boolean {
  return card.piece === "snail" && card.film === "IVORY" && card.drop === 9;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateRetrograde(card: Retrograde, station: string): boolean {
  return card.piece === "sector" && retrogradeMode(station) === "snail" && !card.raised;
}

export function retrogradeCounts(cards: readonly Retrograde[], shown: readonly Retrograde[], station: string): RetrogradeCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => retrogradeInner(card.piece)).length,
    outer: cards.filter((card) => retrogradeOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 21).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRetrograde).length,
    brisk: cards.filter(briskRetrograde).length,
    resting: cards.filter(restingRetrograde).length,
    overdue: cards.filter(overdueRetrograde).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateRetrograde(card, station)).length,
  };
}

export function retrogradeBars(cards: readonly Retrograde[]): { piece: string; count: number }[] {
  return RTG_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function retrogradeTimeline(cards: readonly Retrograde[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function retrogradeKeepers(cards: readonly Retrograde[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Retrograde[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of retrogradeKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRetrogrades(cards: readonly Retrograde[]): string[] {
  return cards.filter(overdueRetrograde).map((card) => card.title);
}

export function retrogradeCopy(card: Retrograde): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function retrogradeCsv(cards: readonly Retrograde[], station: string): string {
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
        retrogradeOuter(card.piece) ? "1" : "0",
        lateRetrograde(card, station) ? "1" : "0",
        idleRetrograde(card) ? "1" : "0",
        briskRetrograde(card) ? "1" : "0",
        restingRetrograde(card) ? "1" : "0",
        overdueRetrograde(card) ? "1" : "0",
        retrogradeInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        retrogradeBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const ASG_KEY = "crmv4-assignment-hide";
export const ASG_REVIEW_KEY = "crmv4-assignment-review";

export type AssignmentLane = "" | "lead" | "desk" | "retn" | "keep" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type AssignmentHue = "" | "ivory" | "graphite" | "champagne";
export type AssignmentState = "" | "clear" | "set";
export type AssignmentReview = "all" | "reviewed" | "fresh";
export type AssignmentShape =
  | "all"
  | "lead"
  | "desk"
  | "retn"
  | "keep"
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

export type AssignmentValue = string | { assigneeId?: unknown; [key: string]: unknown } | null | undefined;
export type AssignmentRow = { id: string; label: string; code: AssignmentValue };
export type AssignmentLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["lead", "desk", "retn", "keep", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: AssignmentValue): { assigneeId?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: AssignmentValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: AssignmentValue): string {
  const row = codeRecord(raw);
  if (row && !("assigneeId" in row)) return "";
  const value = row ? row.assigneeId : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LEAD";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: AssignmentValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("assigneeId" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function assignmentState(raw: AssignmentValue): AssignmentState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known assignment is LEAD, DESK, RETN, or KEEP. An ampersand joins two assignments. A comma marks a pause. A brief assignment is exactly four characters. A long assignment is twelve characters or longer. An index starts with a digit. A vowel assignment starts with a vowel. */
export function assignmentLane(raw: AssignmentValue): AssignmentLane {
  if (assignmentState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "LEAD") return "lead";
    if (upper === "DESK") return "desk";
    if (upper === "RETN") return "retn";
    return "keep";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(",")) return "gap";
  if (text.length === 8) return "brief";
  if (/^[0-9]/.test(text)) return "mark";
  if (text.length >= 20) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function assignmentHue(raw: AssignmentValue): AssignmentHue {
  const mail = assignmentLane(raw);
  if (!mail) return "";
  if (mail === "lead" || mail === "retn") return "champagne";
  if (mail === "desk" || mail === "keep" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function assignmentHome(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "lead";
}

export function assignmentAway(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "desk";
}

export function assignmentGuest(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "retn";
}

export function assignmentCitizen(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "keep";
}

export function assignmentJoin(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "join";
}

export function assignmentGap(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "gap";
}

export function assignmentBrief(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "brief";
}

export function assignmentLong(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "long";
}

export function assignmentMark(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "mark";
}

export function assignmentVowelLane(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "vowel";
}

export function assignmentPlain(raw: AssignmentValue): boolean {
  return assignmentLane(raw) === "plain";
}

export function assignmentOpen(raw: AssignmentValue): boolean {
  return assignmentState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function assignmentHeld(raw: AssignmentValue): boolean {
  const mail = assignmentLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function assignmentSoon(raw: AssignmentValue): boolean {
  if (assignmentState(raw) !== "set") return false;
  if (assignmentBrief(raw)) return true;
  if (assignmentHome(raw) || assignmentAway(raw) || assignmentGuest(raw) || assignmentCitizen(raw)) return false;
  return codeGiven(raw).length === 6;
}

export function assignmentLength(raw: AssignmentValue): number | null {
  if (assignmentState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function assignmentEven(raw: AssignmentValue): boolean {
  const length = assignmentLength(raw);
  return length !== null && length % 2 === 0;
}

export function assignmentOdd(raw: AssignmentValue): boolean {
  const length = assignmentLength(raw);
  return length !== null && length % 2 === 1;
}

export function assignmentFirst(raw: AssignmentValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function assignmentTail(raw: AssignmentValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function assignmentCapital(raw: AssignmentValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function assignmentSpace(raw: AssignmentValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function assignmentVowel(raw: AssignmentValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function assignmentDigit(raw: AssignmentValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function assignmentLetter(raw: AssignmentValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function assignmentMixed(raw: AssignmentValue): boolean {
  return assignmentDigit(raw) && assignmentLetter(raw);
}

export function assignmentLower(raw: AssignmentValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function assignmentUpper(raw: AssignmentValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function assignmentStamp(raw: AssignmentValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function assignmentCopy(raw: AssignmentValue): string {
  return codeGiven(raw);
}

export function assignmentFamily(raw: AssignmentValue): string {
  if (assignmentState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function assignmentLanes(rows: readonly AssignmentRow[]): AssignmentLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = assignmentLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingAssignment(rows: readonly AssignmentRow[]): string {
  const lines = assignmentLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingAssignmentHue(rows: readonly AssignmentRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = assignmentHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneAssignmentCount(rows: readonly AssignmentRow[], mail: AssignmentLane): number {
  return rows.filter((row) => assignmentLane(row.code) === mail).length;
}

export function assignmentShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAssignmentLanes(rows: readonly AssignmentRow[]): string[] {
  return assignmentLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenAssignment(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAssignment(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAssignment(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleAssignmentReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAssignmentReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAssignmentLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: AssignmentRow, shape: AssignmentShape): boolean {
  if (shape === "all") return true;
  if (shape === "lead") return assignmentHome(row.code);
  if (shape === "desk") return assignmentAway(row.code);
  if (shape === "retn") return assignmentGuest(row.code);
  if (shape === "keep") return assignmentCitizen(row.code);
  if (shape === "join") return assignmentJoin(row.code);
  if (shape === "gap") return assignmentGap(row.code);
  if (shape === "brief") return assignmentBrief(row.code);
  if (shape === "long") return assignmentLong(row.code);
  if (shape === "mark") return assignmentMark(row.code);
  if (shape === "vowel") return assignmentVowelLane(row.code);
  if (shape === "plain") return assignmentPlain(row.code);
  if (shape === "open") return assignmentOpen(row.code);
  if (shape === "soon") return assignmentSoon(row.code);
  if (shape === "letter") return assignmentLetter(row.code);
  if (shape === "mixed") return assignmentMixed(row.code);
  if (shape === "upper") return assignmentUpper(row.code);
  if (shape === "lower") return assignmentLower(row.code);
  if (shape === "space") return assignmentSpace(row.code);
  if (shape === "even") return assignmentEven(row.code);
  if (shape === "odd") return assignmentOdd(row.code);
  if (shape === "tail") return assignmentTail(row.code);
  if (shape === "first") return assignmentFirst(row.code);
  if (shape === "held") return assignmentHeld(row.code);
  return assignmentLane(row.code) === shape;
}

export function visibleAssignment(
  rows: readonly AssignmentRow[],
  mail: string,
  hue: string,
  query: string,
  review: AssignmentReview,
  reviewed: readonly string[],
  shape: AssignmentShape,
): AssignmentRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (assignmentState(row.code) === "") return false;
    const found = assignmentLane(row.code);
    const hueName = assignmentHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${assignmentStamp(row.code)} ${assignmentFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function assignmentLanesCsv(rows: readonly AssignmentRow[]): string {
  const lines = ["lane,count"];
  for (const line of assignmentLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function assignmentRowsCsv(rows: readonly AssignmentRow[], reviewed: readonly string[]): string {
  const lines = ["name,assigneeId,stamp,family,lane,hue,length,lead,desk,retn,keep,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(assignmentCopy(row.code)),
        assignmentStamp(row.code),
        csvCell(assignmentFamily(row.code)),
        assignmentLane(row.code),
        assignmentHue(row.code),
        assignmentLength(row.code) ?? "",
        assignmentHome(row.code) ? "1" : "0",
        assignmentAway(row.code) ? "1" : "0",
        assignmentGuest(row.code) ? "1" : "0",
        assignmentCitizen(row.code) ? "1" : "0",
        assignmentJoin(row.code) ? "1" : "0",
        assignmentGap(row.code) ? "1" : "0",
        assignmentBrief(row.code) ? "1" : "0",
        assignmentEven(row.code) ? "1" : "0",
        assignmentDigit(row.code) ? "1" : "0",
        assignmentMixed(row.code) ? "1" : "0",
        assignmentUpper(row.code) ? "1" : "0",
        assignmentVowel(row.code) ? "1" : "0",
        assignmentTail(row.code) ? "1" : "0",
        assignmentHeld(row.code) ? "1" : "0",
        assignmentSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
