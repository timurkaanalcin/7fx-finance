/**
 * Anglage rules for chamfered edges kept in this browser,
 * and seal plates read crmReadOnly already stored on the account.
 * Modes are arris, bevel, ogive, and knife. Finishes are gilt, ivory, and graphite.
 * Widths are 5, 10, 20, or 40. Stones are 3, 6, or 12.
 * Arris and bevel are main. Ogive and knife are side.
 * A known seal mark is SET, WAIT, HOLD, or CUT, including ARMED, READY, DUE, NEAR, PAUSED, HALT, LAPSED, and CLOSED.
 * A plus joins two marks. A colon marks a route.
 * A brief mark is exactly five characters. A stamp starts with a digit.
 * A long mark is eighteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true mark reads as SET. A false mark reads as OFF. The plate does not change the saved read-only seal.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_anglage (
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
 * CREATE TABLE crm_sel_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_sel_review (
 *   trader_id text primary key
 * );
 */

export const AGL_KEY = "crmv4-anglage";
export const AGL_VIEW_KEY = "crmv4-anglage-views";
export const AGL_DENSITY_KEY = "crmv4-anglage-density";
export const AGL_MODES = ["arris", "bevel", "ogive", "knife"] as const;

export type AnglageMode = (typeof AGL_MODES)[number];
export type AnglageFilm = "blank" | "gilt" | "ivory" | "graphite";
export type AnglageTray = "board" | "peg" | "coffer";
export type AnglageDensity = "airy" | "close";
export type AnglageSort = "piece" | "setter";

export type Anglage = {
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

export type AnglageView = {
  id: string;
  name: string;
  tray: AnglageTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type AnglageCounts = {
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

export const ROUND356_FEATURES = [
  "anglage-save",
  "arris-reminders",
  "anglage-modes",
  "anglage-search",
  "anglage-pin-sla",
  "arris-archive",
  "anglage-latch-star",
  "anglage-inline-title",
  "anglage-filters",
  "saved-anglage-views",
  "anglage-density",
  "arris-focus",
  "anglage-kpis",
  "arris-chart",
  "arris-timeline",
  "anglage-bulk",
  "anglage-csv",
  "anglage-keys",
  "anglage-audit",
  "fair-chamferer",
  "anglage-viewer",
  "suggest-barley",
  "overdue-barley",
  "seal-plate",
  "seal-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [5, 10, 20, 40] as const;
const LOCK_CYCLE = [3, 6, 12] as const;
const INNER = new Set(["arris", "bevel"]);
const OUTER = new Set(["ogive", "knife"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SOURCE_ALIAS: Record<string, "SET" | "WAIT" | "HOLD" | "CUT"> = {
  SET: "SET",
  ARMED: "SET",
  READY: "SET",
  WAIT: "WAIT",
  DUE: "WAIT",
  NEAR: "WAIT",
  HOLD: "HOLD",
  PAUSED: "HOLD",
  HALT: "HOLD",
  CUT: "CUT",
  LAPSED: "CUT",
  CLOSED: "CUT",
};
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AnglageTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<AnglageFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<AnglageFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[an]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Anglage, tray: AnglageTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return AGL_MODES.indexOf(piece as AnglageMode);
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

export function anglageMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (AGL_MODES as readonly string[]).includes(text) ? text : "";
}

/** A width is 5, 10, 20, or 40. Anything else stays blank. */
export function anglageHour(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A stone is 3, 6, or 12. Anything else stays blank. */
export function anglageHammer(raw: unknown): 3 | 6 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12") return null;
  return Number(text) as 3 | 6 | 12;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function anglageFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function anglageInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function anglageOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Arris is the edge. Bevel is the face. Ogive is the curve. Knife is the cut. */
export function anglageBand(piece: unknown): string {
  const text = anglageMode(piece);
  if (!text) return "";
  if (text === "arris") return "edge";
  if (text === "bevel") return "face";
  if (text === "ogive") return "curve";
  return "cut";
}

/** Signed distance from one mode to another along the chamfer. */
export function anglageGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(anglageMode(from));
  const right = pieceIndex(anglageMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(anglageFilm(film));
}

/** A pair stone is 6. Three and twelve are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return anglageHammer(lock) === 6;
}

/** A full stone is 12. */
export function fullHammer(lock: unknown): boolean {
  return anglageHammer(lock) === 12;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return anglageMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = anglageHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = anglageFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = anglageHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveAnglageFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Anglage[]): string {
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

/** Before six, suggest width five. Before noon, suggest ten. Before six in the evening, suggest twenty. Later, suggest forty. A saved width on the bench wins, and a tie keeps the shorter width. */
export function suggestHour(cards: readonly Anglage[], hour: number): 5 | 10 | 20 | 40 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 20 | 40 = 5;
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
  if (hour < 6) return 5;
  if (hour < 12) return 10;
  if (hour < 18) return 20;
  return 40;
}

export function suggestMode(hour: number): AnglageMode {
  return hour < 6 ? "arris" : "knife";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Anglage[], roster: string): string {
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

export function readAnglages(raw: unknown): Anglage[] {
  if (!Array.isArray(raw)) return [];
  const out: Anglage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Anglage>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: anglageMode(row.piece),
      drop: anglageHour(row.drop),
      film: anglageFilm(row.film),
      lock: anglageHammer(row.lock) ?? 3,
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

export function addAnglage(
  cards: readonly Anglage[],
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
): Anglage[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readAnglages([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: anglageMode(card.piece),
      drop: anglageHour(card.drop),
      film: anglageFilm(card.film),
      lock: anglageHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Anglage[], id: string, edit: (card: Anglage) => Anglage): Anglage[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editAnglage(cards: readonly Anglage[], id: string, title: string): Anglage[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editAnglageNote(cards: readonly Anglage[], id: string, note: string): Anglage[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(anglageFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setAnglageFilm(cards: readonly Anglage[], id: string, film: string): Anglage[] {
  const next = anglageFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setAnglageRaised(cards: readonly Anglage[], id: string, raised: boolean): Anglage[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setAnglagePin(cards: readonly Anglage[], id: string, pinned: boolean): Anglage[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setAnglageCoffer(cards: readonly Anglage[], id: string, coffered: boolean): Anglage[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setAnglageStar(cards: readonly Anglage[], id: string, starred: boolean): Anglage[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addAnglageTag(cards: readonly Anglage[], id: string, tag: string): Anglage[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 5 | 10 | 20 | 40 {
  if (drop === null) return dir > 0 ? 5 : 40;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 12 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setAnglageFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinAnglageFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return setAnglagePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starAnglageFocused(cards: readonly Anglage[], id: string): Anglage[] {
  return setAnglageStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Anglage[], id: string): Anglage[] {
  const card = cards.find((item) => item.id === id);
  return card ? setAnglageFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Anglage[], ids: readonly string[], edit: (card: Anglage) => Anglage): Anglage[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkAnglageGraphite(cards: readonly Anglage[], ids: readonly string[]): Anglage[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkAnglageRaise(cards: readonly Anglage[], ids: readonly string[]): Anglage[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkAnglageCoffer(cards: readonly Anglage[], ids: readonly string[]): Anglage[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkAnglageTag(cards: readonly Anglage[], ids: readonly string[]): Anglage[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "n"]), audit: "tag" }));
}

export function readAnglageViews(raw: unknown): AnglageView[] {
  if (!Array.isArray(raw)) return [];
  const out: AnglageView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AnglageView>;
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

export function addAnglageView(views: readonly AnglageView[], view: AnglageView): AnglageView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readAnglageViews([...views, { ...view, id, name }]);
}

export function dropAnglageView(views: readonly AnglageView[], id: string): AnglageView[] {
  return views.filter((view) => view.id !== id);
}

export function anglageDensity(raw: unknown): AnglageDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortAnglages(cards: readonly Anglage[], sort: AnglageSort): Anglage[] {
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

export function visibleAnglages(
  cards: readonly Anglage[],
  tray: AnglageTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Anglage[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : anglageFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !anglageInner(card.piece)) return false;
    if (wantLimb === "outer" && !anglageOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side mode on stone three, still not raised and not in the drawer, is overdue. */
export function overdueAnglage(card: Anglage): boolean {
  return anglageOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No finish, the short width, stone three, and still on the bench. */
export function idleAnglage(card: Anglage): boolean {
  return !card.film && card.drop === 5 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall width, and a full stone, still out of the drawer. */
export function briskAnglage(card: Anglage): boolean {
  return card.film === "GILT" && card.drop === 40 && card.lock === 12 && !card.coffered;
}

/** Knife, ivory, and width ten. */
export function restingAnglage(card: Anglage): boolean {
  return card.piece === "knife" && card.film === "IVORY" && card.drop === 10;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateAnglage(card: Anglage, station: string): boolean {
  return card.piece === "arris" && anglageMode(station) === "knife" && !card.raised;
}

export function anglageCounts(cards: readonly Anglage[], shown: readonly Anglage[], station: string): AnglageCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => anglageInner(card.piece)).length,
    outer: cards.filter((card) => anglageOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 40).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleAnglage).length,
    brisk: cards.filter(briskAnglage).length,
    resting: cards.filter(restingAnglage).length,
    overdue: cards.filter(overdueAnglage).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateAnglage(card, station)).length,
  };
}

export function anglageBars(cards: readonly Anglage[]): { piece: string; count: number }[] {
  return AGL_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function anglageTimeline(cards: readonly Anglage[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function anglageKeepers(cards: readonly Anglage[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Anglage[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of anglageKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderAnglages(cards: readonly Anglage[]): string[] {
  return cards.filter(overdueAnglage).map((card) => card.title);
}

export function anglageCopy(card: Anglage): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function anglageCsv(cards: readonly Anglage[], station: string): string {
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
        anglageOuter(card.piece) ? "1" : "0",
        lateAnglage(card, station) ? "1" : "0",
        idleAnglage(card) ? "1" : "0",
        briskAnglage(card) ? "1" : "0",
        restingAnglage(card) ? "1" : "0",
        overdueAnglage(card) ? "1" : "0",
        anglageInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        anglageBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const EXP_KEY = "crmv4-exp-hide";
export const EXP_REVIEW_KEY = "crmv4-exp-review";

export type SelLane = "" | "home" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type SelHue = "" | "ivory" | "graphite" | "champagne";
export type SelState = "" | "clear" | "set";
export type SelReview = "all" | "reviewed" | "fresh";
export type SelShape =
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

export type SelValue = string | { crmReadOnly?: unknown; [key: string]: unknown } | null | undefined;
export type SelRow = { id: string; label: string; code: SelValue };
export type SelLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["home", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: SelValue): { crmReadOnly?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: SelValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: SelValue): string {
  const row = codeRecord(raw);
  if (row && !("crmReadOnly" in row)) return "";
  const value = row ? row.crmReadOnly : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "SET";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return clip(value, 48);
}

function codeReadable(raw: SelValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("crmReadOnly" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function selState(raw: SelValue): SelState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known seal mark is SET, WAIT, HOLD, or CUT, including ARMED, READY, DUE, NEAR, PAUSED, HALT, LAPSED, and CLOSED. A plus joins two marks. A colon marks a route. A brief mark is exactly five characters. A stamp starts with a digit. A long mark is eighteen characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function selLane(raw: SelValue): SelLane {
  if (selState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = SOURCE_ALIAS[upper];
  if (canon === "SET") return "home";
  if (canon === "WAIT") return "desk";
  if (canon === "HOLD") return "hold";
  if (canon === "CUT") return "guest";
  if (text === "NONE") return "plain";
  if (upper === "OFF") return "vacant";
  if (text.includes("+")) return "join";
  if (text.includes(":")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 18) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function selHue(raw: SelValue): SelHue {
  const mail = selLane(raw);
  if (!mail) return "";
  if (mail === "home" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function selHome(raw: SelValue): boolean {
  return selLane(raw) === "home";
}

export function selAway(raw: SelValue): boolean {
  return selLane(raw) === "vacant";
}

export function selGuest(raw: SelValue): boolean {
  return selLane(raw) === "hold";
}

export function selCitizen(raw: SelValue): boolean {
  return selLane(raw) === "guest";
}

export function selDesk(raw: SelValue): boolean {
  return selLane(raw) === "desk";
}

export function selJoin(raw: SelValue): boolean {
  return selLane(raw) === "join";
}

export function selRoute(raw: SelValue): boolean {
  return selLane(raw) === "route";
}

export function selBrief(raw: SelValue): boolean {
  return selLane(raw) === "brief";
}

export function selLong(raw: SelValue): boolean {
  return selLane(raw) === "long";
}

export function selStampMark(raw: SelValue): boolean {
  return selLane(raw) === "stamp";
}

export function selVowelLane(raw: SelValue): boolean {
  return selLane(raw) === "vowel";
}

export function selPlain(raw: SelValue): boolean {
  return selLane(raw) === "plain";
}

export function selOpen(raw: SelValue): boolean {
  return selState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function selHeld(raw: SelValue): boolean {
  const mail = selLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known seal, still wants a fuller name. */
export function selSoon(raw: SelValue): boolean {
  if (selState(raw) !== "set") return false;
  if (selBrief(raw)) return true;
  if (selHome(raw) || selAway(raw) || selGuest(raw) || selCitizen(raw)) return false;
  return codeGiven(raw).length === 9;
}

export function selLength(raw: SelValue): number | null {
  if (selState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function selEven(raw: SelValue): boolean {
  const length = selLength(raw);
  return length !== null && length % 2 === 0;
}

export function selOdd(raw: SelValue): boolean {
  const length = selLength(raw);
  return length !== null && length % 2 === 1;
}

export function selFirst(raw: SelValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function selTail(raw: SelValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function selCapital(raw: SelValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function selSpace(raw: SelValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function selVowel(raw: SelValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function selDigit(raw: SelValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function selLetter(raw: SelValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function selMixed(raw: SelValue): boolean {
  return selDigit(raw) && selLetter(raw);
}

export function selLower(raw: SelValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is seven letters or more, written entirely in capitals. */
export function selUpper(raw: SelValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function selStamp(raw: SelValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function selCopy(raw: SelValue): string {
  return codeGiven(raw);
}

export function selFamily(raw: SelValue): string {
  if (selState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function selLanes(rows: readonly SelRow[]): SelLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = selLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly SelRow[]): string {
  const lines = selLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly SelRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = selHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly SelRow[], mail: SelLane): number {
  return rows.filter((row) => selLane(row.code) === mail).length;
}

export function selShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly SelRow[]): string[] {
  return selLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: SelRow, shape: SelShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return selHome(row.code);
  if (shape === "vacant") return selAway(row.code);
  if (shape === "hold") return selGuest(row.code);
  if (shape === "guest") return selCitizen(row.code);
  if (shape === "join") return selJoin(row.code);
  if (shape === "route") return selRoute(row.code);
  if (shape === "brief") return selBrief(row.code);
  if (shape === "long") return selLong(row.code);
  if (shape === "stamp") return selStampMark(row.code);
  if (shape === "vowel") return selVowelLane(row.code);
  if (shape === "plain") return selPlain(row.code);
  if (shape === "open") return selOpen(row.code);
  if (shape === "soon") return selSoon(row.code);
  if (shape === "letter") return selLetter(row.code);
  if (shape === "mixed") return selMixed(row.code);
  if (shape === "upper") return selUpper(row.code);
  if (shape === "lower") return selLower(row.code);
  if (shape === "space") return selSpace(row.code);
  if (shape === "even") return selEven(row.code);
  if (shape === "odd") return selOdd(row.code);
  if (shape === "tail") return selTail(row.code);
  if (shape === "first") return selFirst(row.code);
  if (shape === "held") return selHeld(row.code);
  return selLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly SelRow[],
  mail: string,
  hue: string,
  query: string,
  review: SelReview,
  reviewed: readonly string[],
  shape: SelShape,
): SelRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (selState(row.code) === "") return false;
    const found = selLane(row.code);
    const hueName = selHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${selStamp(row.code)} ${selFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function selLanesCsv(rows: readonly SelRow[]): string {
  const lines = ["lane,count"];
  for (const line of selLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function selRowsCsv(rows: readonly SelRow[], reviewed: readonly string[]): string {
  const lines = ["name,crmReadOnly,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(selCopy(row.code)),
        selStamp(row.code),
        csvCell(selFamily(row.code)),
        selLane(row.code),
        selHue(row.code),
        selLength(row.code) ?? "",
        selHome(row.code) ? "1" : "0",
        selAway(row.code) ? "1" : "0",
        selGuest(row.code) ? "1" : "0",
        selDesk(row.code) ? "1" : "0",
        selCitizen(row.code) ? "1" : "0",
        selJoin(row.code) ? "1" : "0",
        selRoute(row.code) ? "1" : "0",
        selBrief(row.code) ? "1" : "0",
        selEven(row.code) ? "1" : "0",
        selDigit(row.code) ? "1" : "0",
        selMixed(row.code) ? "1" : "0",
        selUpper(row.code) ? "1" : "0",
        selVowel(row.code) ? "1" : "0",
        selTail(row.code) ? "1" : "0",
        selHeld(row.code) ? "1" : "0",
        selSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
