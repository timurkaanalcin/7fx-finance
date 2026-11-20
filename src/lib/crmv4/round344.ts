/**
 * Rattrapante rules for a Swiss rattrapante escapement kept in this browser, and email plates read the email already stored on the account.
 * Modes are split, flyback, column, and clutch. Finishes are gilt, ivory, and graphite.
 * Angles are 4, 8, 12, or 16. Pins are 4, 6, or 8.
 * Split and flyback are inner. Column and clutch are outer.
 * A known email is MAIL, INBOX, DESK, or POST. An ampersand joins two emails. A comma marks a pause.
 * A brief email is exactly five characters. A long email is sixteen characters or longer. An index starts with a digit. A vowel email starts with a vowel.
 * A true email reads as MAIL. An empty email reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_rattrapante (
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
 * CREATE TABLE crm_email_hide (
 *   mail text primary key
 * );
 * CREATE TABLE crm_email_review (
 *   trader_id text primary key
 * );
 */
export const RTP_KEY = "crmv4-rattrapante";
export const RTP_VIEW_KEY = "crmv4-rattrapante-views";
export const RTP_DENSITY_KEY = "crmv4-rattrapante-density";
export const RTP_MODES = ["split", "flyback", "column", "clutch"] as const;

export type RattrapanteMode = (typeof RTP_MODES)[number];
export type RattrapanteFilm = "blank" | "gilt" | "ivory" | "graphite";
export type RattrapanteTray = "board" | "peg" | "coffer";
export type RattrapanteDensity = "airy" | "close";
export type RattrapanteSort = "piece" | "setter";

export type Rattrapante = {
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

export type RattrapanteView = {
  id: string;
  name: string;
  tray: RattrapanteTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type RattrapanteCounts = {
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

export const ROUND344_FEATURES = [
  "rattrapante-save",
  "split-notices",
  "rattrapante-modes",
  "rattrapante-search",
  "split-sla",
  "case-file",
  "latch-and-star",
  "inline-name",
  "rattrapante-filters",
  "saved-rattrapante-views",
  "rattrapante-density",
  "hand-sort",
  "rattrapante-kpis",
  "split-chart",
  "split-timeline",
  "rattrapante-bulk",
  "rattrapante-csv",
  "rattrapante-keys",
  "rattrapante-audit",
  "fair-hand",
  "rattrapante-viewer",
  "suggest-split",
  "overdue-splits",
  "email-plate",
  "email-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 12, 16] as const;
const LOCK_CYCLE = [4, 6, 8] as const;
const INNER = new Set(["split", "flyback"]);
const OUTER = new Set(["column", "clutch"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["MAIL", "INBOX", "DESK", "POST"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RattrapanteTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<RattrapanteFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<RattrapanteFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[sf]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Rattrapante, tray: RattrapanteTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return RTP_MODES.indexOf(piece as RattrapanteMode);
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

export function rattrapanteMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RTP_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function rattrapanteHour(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function rattrapanteHammer(raw: unknown): 4 | 6 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "6" && text !== "8") return null;
  return Number(text) as 4 | 6 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function rattrapanteFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function rattrapanteInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function rattrapanteOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the pinion. Pivot is the arbor. Jewel is the stone. */
export function rattrapanteBand(piece: unknown): string {
  const text = rattrapanteMode(piece);
  if (!text) return "";
  if (text === "split") return "hand";
  if (text === "flyback") return "reset";
  if (text === "column") return "wheel";
  return "dog";
}

/** Signed distance from one piece to another along the oscillator. */
export function rattrapanteGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(rattrapanteMode(from));
  const right = pieceIndex(rattrapanteMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(rattrapanteFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return rattrapanteHammer(lock) === 6;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return rattrapanteHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return rattrapanteMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = rattrapanteHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = rattrapanteFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = rattrapanteHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveRattrapanteFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Rattrapante[]): string {
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
export function suggestHour(cards: readonly Rattrapante[], hour: number): 4 | 8 | 12 | 16 {
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

export function suggestMode(hour: number): RattrapanteMode {
  return hour < 10 ? "split" : "clutch";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Rattrapante[], roster: string): string {
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

export function readRattrapantes(raw: unknown): Rattrapante[] {
  if (!Array.isArray(raw)) return [];
  const out: Rattrapante[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Rattrapante>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: rattrapanteMode(row.piece),
      drop: rattrapanteHour(row.drop),
      film: rattrapanteFilm(row.film),
      lock: rattrapanteHammer(row.lock) ?? 4,
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

export function addRattrapante(
  cards: readonly Rattrapante[],
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
): Rattrapante[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRattrapantes([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: rattrapanteMode(card.piece),
      drop: rattrapanteHour(card.drop),
      film: rattrapanteFilm(card.film),
      lock: rattrapanteHammer(card.lock) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Rattrapante[], id: string, edit: (card: Rattrapante) => Rattrapante): Rattrapante[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRattrapante(cards: readonly Rattrapante[], id: string, title: string): Rattrapante[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRattrapanteNote(cards: readonly Rattrapante[], id: string, note: string): Rattrapante[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(rattrapanteFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRattrapanteFilm(cards: readonly Rattrapante[], id: string, film: string): Rattrapante[] {
  const next = rattrapanteFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setRattrapanteRaised(cards: readonly Rattrapante[], id: string, raised: boolean): Rattrapante[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setRattrapantePin(cards: readonly Rattrapante[], id: string, pinned: boolean): Rattrapante[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setRattrapanteCoffer(cards: readonly Rattrapante[], id: string, coffered: boolean): Rattrapante[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setRattrapanteStar(cards: readonly Rattrapante[], id: string, starred: boolean): Rattrapante[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRattrapanteTag(cards: readonly Rattrapante[], id: string, tag: string): Rattrapante[] {
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

function stepLock(lock: number, dir: 1 | -1): 4 | 6 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setRattrapanteFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinRattrapanteFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return setRattrapantePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starRattrapanteFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  return setRattrapanteStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Rattrapante[], id: string): Rattrapante[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRattrapanteFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Rattrapante[], ids: readonly string[], edit: (card: Rattrapante) => Rattrapante): Rattrapante[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRattrapanteGraphite(cards: readonly Rattrapante[], ids: readonly string[]): Rattrapante[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkRattrapanteRaise(cards: readonly Rattrapante[], ids: readonly string[]): Rattrapante[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkRattrapanteCoffer(cards: readonly Rattrapante[], ids: readonly string[]): Rattrapante[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkRattrapanteTag(cards: readonly Rattrapante[], ids: readonly string[]): Rattrapante[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readRattrapanteViews(raw: unknown): RattrapanteView[] {
  if (!Array.isArray(raw)) return [];
  const out: RattrapanteView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RattrapanteView>;
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

export function addRattrapanteView(views: readonly RattrapanteView[], view: RattrapanteView): RattrapanteView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRattrapanteViews([...views, { ...view, id, name }]);
}

export function dropRattrapanteView(views: readonly RattrapanteView[], id: string): RattrapanteView[] {
  return views.filter((view) => view.id !== id);
}

export function rattrapanteDensity(raw: unknown): RattrapanteDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortRattrapantes(cards: readonly Rattrapante[], sort: RattrapanteSort): Rattrapante[] {
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

export function visibleRattrapantes(
  cards: readonly Rattrapante[],
  tray: RattrapanteTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Rattrapante[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : rattrapanteFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !rattrapanteInner(card.piece)) return false;
    if (wantLimb === "outer" && !rattrapanteOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueRattrapante(card: Rattrapante): boolean {
  return rattrapanteOuter(card.piece) && card.lock === 4 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleRattrapante(card: Rattrapante): boolean {
  return !card.film && card.drop === 4 && card.lock === 4 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskRattrapante(card: Rattrapante): boolean {
  return card.film === "GILT" && card.drop === 16 && card.lock === 8 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingRattrapante(card: Rattrapante): boolean {
  return card.piece === "clutch" && card.film === "IVORY" && card.drop === 8;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateRattrapante(card: Rattrapante, station: string): boolean {
  return card.piece === "split" && rattrapanteMode(station) === "clutch" && !card.raised;
}

export function rattrapanteCounts(cards: readonly Rattrapante[], shown: readonly Rattrapante[], station: string): RattrapanteCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => rattrapanteInner(card.piece)).length,
    outer: cards.filter((card) => rattrapanteOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 16).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRattrapante).length,
    brisk: cards.filter(briskRattrapante).length,
    resting: cards.filter(restingRattrapante).length,
    overdue: cards.filter(overdueRattrapante).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateRattrapante(card, station)).length,
  };
}

export function rattrapanteBars(cards: readonly Rattrapante[]): { piece: string; count: number }[] {
  return RTP_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function rattrapanteTimeline(cards: readonly Rattrapante[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function rattrapanteKeepers(cards: readonly Rattrapante[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Rattrapante[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of rattrapanteKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRattrapantes(cards: readonly Rattrapante[]): string[] {
  return cards.filter(overdueRattrapante).map((card) => card.title);
}

export function rattrapanteCopy(card: Rattrapante): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function rattrapanteCsv(cards: readonly Rattrapante[], station: string): string {
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
        rattrapanteOuter(card.piece) ? "1" : "0",
        lateRattrapante(card, station) ? "1" : "0",
        idleRattrapante(card) ? "1" : "0",
        briskRattrapante(card) ? "1" : "0",
        restingRattrapante(card) ? "1" : "0",
        overdueRattrapante(card) ? "1" : "0",
        rattrapanteInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        rattrapanteBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const MPX_KEY = "crmv4-email-hide";
export const MPX_REVIEW_KEY = "crmv4-email-review";

export type EmailLane = "" | "mail" | "inbox" | "desk" | "post" | "join" | "gap" | "brief" | "long" | "mark" | "vowel" | "plain";
export type EmailHue = "" | "ivory" | "graphite" | "champagne";
export type EmailState = "" | "clear" | "set";
export type EmailReview = "all" | "reviewed" | "fresh";
export type EmailShape =
  | "all"
  | "mail"
  | "inbox"
  | "desk"
  | "post"
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

export type EmailValue = string | { email?: unknown; [key: string]: unknown } | null | undefined;
export type EmailRow = { id: string; label: string; code: EmailValue };
export type EmailLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["mail", "inbox", "desk", "post", "join", "gap", "brief", "long", "mark", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: EmailValue): { email?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: EmailValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: EmailValue): string {
  const row = codeRecord(raw);
  if (row && !("email" in row)) return "";
  const value = row ? row.email : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "MAIL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: EmailValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("email" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function emailState(raw: EmailValue): EmailState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known email is MAIL, INBOX, DESK, or POST. An ampersand joins two emails. A comma marks a pause. A brief email is exactly four characters. A long email is fourteen characters or longer. An index starts with a digit. A vowel email starts with a vowel. */
export function emailLane(raw: EmailValue): EmailLane {
  if (emailState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "MAIL") return "mail";
    if (upper === "INBOX") return "inbox";
    if (upper === "DESK") return "desk";
    return "post";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(",")) return "gap";
  if (text.length === 5) return "brief";
  if (text.length >= 16) return "long";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function emailHue(raw: EmailValue): EmailHue {
  const mail = emailLane(raw);
  if (!mail) return "";
  if (mail === "mail" || mail === "desk") return "champagne";
  if (mail === "inbox" || mail === "post" || mail === "join" || mail === "gap" || mail === "long") return "graphite";
  return "ivory";
}

export function emailHome(raw: EmailValue): boolean {
  return emailLane(raw) === "mail";
}

export function emailAway(raw: EmailValue): boolean {
  return emailLane(raw) === "inbox";
}

export function emailGuest(raw: EmailValue): boolean {
  return emailLane(raw) === "desk";
}

export function emailCitizen(raw: EmailValue): boolean {
  return emailLane(raw) === "post";
}

export function emailJoin(raw: EmailValue): boolean {
  return emailLane(raw) === "join";
}

export function emailGap(raw: EmailValue): boolean {
  return emailLane(raw) === "gap";
}

export function emailBrief(raw: EmailValue): boolean {
  return emailLane(raw) === "brief";
}

export function emailLong(raw: EmailValue): boolean {
  return emailLane(raw) === "long";
}

export function emailMark(raw: EmailValue): boolean {
  return emailLane(raw) === "mark";
}

export function emailVowelLane(raw: EmailValue): boolean {
  return emailLane(raw) === "vowel";
}

export function emailPlain(raw: EmailValue): boolean {
  return emailLane(raw) === "plain";
}

export function emailOpen(raw: EmailValue): boolean {
  return emailState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function emailHeld(raw: EmailValue): boolean {
  const mail = emailLane(raw);
  return mail === "long" || mail === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function emailSoon(raw: EmailValue): boolean {
  if (emailState(raw) !== "set") return false;
  if (emailBrief(raw)) return true;
  if (emailHome(raw) || emailAway(raw) || emailGuest(raw) || emailCitizen(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function emailLength(raw: EmailValue): number | null {
  if (emailState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function emailEven(raw: EmailValue): boolean {
  const length = emailLength(raw);
  return length !== null && length % 2 === 0;
}

export function emailOdd(raw: EmailValue): boolean {
  const length = emailLength(raw);
  return length !== null && length % 2 === 1;
}

export function emailFirst(raw: EmailValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function emailTail(raw: EmailValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function emailCapital(raw: EmailValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function emailSpace(raw: EmailValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function emailVowel(raw: EmailValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function emailDigit(raw: EmailValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function emailLetter(raw: EmailValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function emailMixed(raw: EmailValue): boolean {
  return emailDigit(raw) && emailLetter(raw);
}

export function emailLower(raw: EmailValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function emailUpper(raw: EmailValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function emailStamp(raw: EmailValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function emailCopy(raw: EmailValue): string {
  return codeGiven(raw);
}

export function emailFamily(raw: EmailValue): string {
  if (emailState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function emailLanes(rows: readonly EmailRow[]): EmailLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = emailLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingEmail(rows: readonly EmailRow[]): string {
  const lines = emailLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingEmailHue(rows: readonly EmailRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = emailHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneEmailCount(rows: readonly EmailRow[], mail: EmailLane): number {
  return rows.filter((row) => emailLane(row.code) === mail).length;
}

export function emailShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentEmailLanes(rows: readonly EmailRow[]): string[] {
  return emailLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenEmail(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedEmail(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleEmail(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleEmailReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkEmailReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleEmailLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: EmailRow, shape: EmailShape): boolean {
  if (shape === "all") return true;
  if (shape === "mail") return emailHome(row.code);
  if (shape === "inbox") return emailAway(row.code);
  if (shape === "desk") return emailGuest(row.code);
  if (shape === "post") return emailCitizen(row.code);
  if (shape === "join") return emailJoin(row.code);
  if (shape === "gap") return emailGap(row.code);
  if (shape === "brief") return emailBrief(row.code);
  if (shape === "long") return emailLong(row.code);
  if (shape === "mark") return emailMark(row.code);
  if (shape === "vowel") return emailVowelLane(row.code);
  if (shape === "plain") return emailPlain(row.code);
  if (shape === "open") return emailOpen(row.code);
  if (shape === "soon") return emailSoon(row.code);
  if (shape === "letter") return emailLetter(row.code);
  if (shape === "mixed") return emailMixed(row.code);
  if (shape === "upper") return emailUpper(row.code);
  if (shape === "lower") return emailLower(row.code);
  if (shape === "space") return emailSpace(row.code);
  if (shape === "even") return emailEven(row.code);
  if (shape === "odd") return emailOdd(row.code);
  if (shape === "tail") return emailTail(row.code);
  if (shape === "first") return emailFirst(row.code);
  if (shape === "held") return emailHeld(row.code);
  return emailLane(row.code) === shape;
}

export function visibleEmail(
  rows: readonly EmailRow[],
  mail: string,
  hue: string,
  query: string,
  review: EmailReview,
  reviewed: readonly string[],
  shape: EmailShape,
): EmailRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (emailState(row.code) === "") return false;
    const found = emailLane(row.code);
    const hueName = emailHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${emailStamp(row.code)} ${emailFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function emailLanesCsv(rows: readonly EmailRow[]): string {
  const lines = ["mail,count"];
  for (const line of emailLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function emailRowsCsv(rows: readonly EmailRow[], reviewed: readonly string[]): string {
  const lines = ["name,email,stamp,family,mail,hue,length,laneMark,inbox,desk,post,join,gap,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(emailCopy(row.code)),
        emailStamp(row.code),
        csvCell(emailFamily(row.code)),
        emailLane(row.code),
        emailHue(row.code),
        emailLength(row.code) ?? "",
        emailHome(row.code) ? "1" : "0",
        emailAway(row.code) ? "1" : "0",
        emailGuest(row.code) ? "1" : "0",
        emailCitizen(row.code) ? "1" : "0",
        emailJoin(row.code) ? "1" : "0",
        emailGap(row.code) ? "1" : "0",
        emailBrief(row.code) ? "1" : "0",
        emailEven(row.code) ? "1" : "0",
        emailDigit(row.code) ? "1" : "0",
        emailMixed(row.code) ? "1" : "0",
        emailUpper(row.code) ? "1" : "0",
        emailVowel(row.code) ? "1" : "0",
        emailTail(row.code) ? "1" : "0",
        emailHeld(row.code) ? "1" : "0",
        emailSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
