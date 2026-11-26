/**
 * Wolf-tooth rules for a winding click kept in this browser,
 * and document plates read documentsStatus already stored on the account.
 * Parts are click, tooth, pawl, and ratch. Finishes are gilt, ivory, and graphite.
 * Gaps are 4, 8, 16, or 32. Counts are 2, 5, or 7.
 * Click and tooth are main. Pawl and ratch are side.
 * Pass, clear, approved, and YES are accepted files. Pending and queue sit the desk.
 * Hold and wait are on hold. Rejected and fail are guests.
 * Pair and joint are joined. None, other, and NO stay plain.
 * A plus joins two marks. A colon that is not a time marks a scoped file.
 * A time today is accepted. Within two days is the desk. Within eight days is hold. Older is a guest.
 * A brief mark is exactly five characters. A digit mark starts with a digit and is not a time.
 * A long mark is twelve characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words kyc and file are accepted. Closed or expired is shut.
 * A true status reads as PASS. A false status reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_wolf_tooth (
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
 * CREATE TABLE crm_dox_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_dox_review (
 *   trader_id text primary key
 * );
 */

export const WFT_KEY = "crmv4-wolf-364";
export const WFT_VIEW_KEY = "crmv4-wolf-views";
export const WFT_DENSITY_KEY = "crmv4-wolf-density";
export const WFT_MODES = ["click", "tooth", "pawl", "ratch"] as const;

export type WolfMode = (typeof WFT_MODES)[number];
export type WolfFilm = "blank" | "gilt" | "ivory" | "graphite";
export type WolfTray = "board" | "peg" | "coffer";
export type WolfDensity = "airy" | "close";
export type WolfSort = "piece" | "setter";

export type Wolf = {
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

export type WolfView = {
  id: string;
  name: string;
  tray: WolfTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type WolfCounts = {
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

export const ROUND364_FEATURES = [
  "wolf-save",
  "fang-reminders",
  "wolf-modes",
  "wolf-search",
  "wolf-click-sla",
  "fang-archive",
  "wolf-count-star",
  "wolf-inline-title",
  "wolf-filters",
  "saved-wolf-views",
  "wolf-density",
  "fang-focus",
  "wolf-kpis",
  "fang-chart",
  "fang-timeline",
  "wolf-bulk",
  "wolf-csv",
  "wolf-keys",
  "wolf-audit",
  "fair-winder",
  "wolf-viewer",
  "suggest-fang",
  "overdue-fang",
  "document-plate",
  "document-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 16, 32] as const;
const LOCK_CYCLE = [2, 5, 7] as const;
const INNER = new Set(["click", "tooth"]);
const OUTER = new Set(["pawl", "ratch"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 18;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WolfTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<WolfFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<WolfFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[kn]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Wolf, tray: WolfTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return WFT_MODES.indexOf(piece as WolfMode);
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

export function wolfMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (WFT_MODES as readonly string[]).includes(text) ? text : "";
}

/** A gap is 6, 12, 24, or 48. Anything else stays blank. */
export function wolfHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A spring count is 2, 4, or 8. Anything else stays blank. */
export function wolfHammer(raw: unknown): 2 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "7") return null;
  return Number(text) as 2 | 5 | 7;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function wolfFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function wolfInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function wolfOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cannon is the barrel. Minute is the pinion. Hour is the hand. Date is the window. */
export function wolfBand(piece: unknown): string {
  const text = wolfMode(piece);
  if (!text) return "";
  if (text === "click") return "bite";
  if (text === "tooth") return "fang";
  if (text === "pawl") return "stop";
  return "wind";
}

/** Signed distance from one mode to another along the stripe. */
export function wolfGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(wolfMode(from));
  const right = pieceIndex(wolfMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(wolfFilm(film));
}

/** A pair wheel is 3. One and six are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return wolfHammer(lock) === 5;
}

/** A full wheel is 6. */
export function fullHammer(lock: unknown): boolean {
  return wolfHammer(lock) === 7;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return wolfMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = wolfHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = wolfFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = wolfHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveWolfFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Wolf[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["GRAPHITE", "IVORY", "GILT"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest fifteen. Later, suggest thirty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Wolf[], hour: number): 4 | 8 | 16 | 32 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 32 = 4;
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
  if (hour < 8) return 4;
  if (hour < 14) return 8;
  if (hour < 20) return 16;
  return 32;
}

export function suggestMode(hour: number): WolfMode {
  return hour < 8 ? "click" : "ratch";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Wolf[], roster: string): string {
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

export function readWolfes(raw: unknown): Wolf[] {
  if (!Array.isArray(raw)) return [];
  const out: Wolf[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Wolf>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: wolfMode(row.piece),
      drop: wolfHour(row.drop),
      film: wolfFilm(row.film),
      lock: wolfHammer(row.lock) ?? 2,
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

export function addWolf(
  cards: readonly Wolf[],
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
): Wolf[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readWolfes([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: wolfMode(card.piece),
      drop: wolfHour(card.drop),
      film: wolfFilm(card.film),
      lock: wolfHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Wolf[], id: string, edit: (card: Wolf) => Wolf): Wolf[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editWolf(cards: readonly Wolf[], id: string, title: string): Wolf[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editWolfNote(cards: readonly Wolf[], id: string, note: string): Wolf[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(wolfFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setWolfFilm(cards: readonly Wolf[], id: string, film: string): Wolf[] {
  const next = wolfFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setWolfRaised(cards: readonly Wolf[], id: string, raised: boolean): Wolf[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setWolfPin(cards: readonly Wolf[], id: string, pinned: boolean): Wolf[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setWolfCoffer(cards: readonly Wolf[], id: string, coffered: boolean): Wolf[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setWolfStar(cards: readonly Wolf[], id: string, starred: boolean): Wolf[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addWolfTag(cards: readonly Wolf[], id: string, tag: string): Wolf[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 4 | 8 | 16 | 32 {
  if (drop === null) return dir > 0 ? 4 : 32;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 5 | 7 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setWolfFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinWolfFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return setWolfPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starWolfFocused(cards: readonly Wolf[], id: string): Wolf[] {
  return setWolfStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Wolf[], id: string): Wolf[] {
  const card = cards.find((item) => item.id === id);
  return card ? setWolfFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Wolf[], ids: readonly string[], edit: (card: Wolf) => Wolf): Wolf[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkWolfGraphite(cards: readonly Wolf[], ids: readonly string[]): Wolf[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkWolfRaise(cards: readonly Wolf[], ids: readonly string[]): Wolf[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkWolfCoffer(cards: readonly Wolf[], ids: readonly string[]): Wolf[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkWolfTag(cards: readonly Wolf[], ids: readonly string[]): Wolf[] {
  return bulk(cards, ids, (card) => (card.tags.includes("k") ? card : { ...card, tags: tagsOf([...card.tags, "k"]), audit: "tag" }));
}

export function readWolfViews(raw: unknown): WolfView[] {
  if (!Array.isArray(raw)) return [];
  const out: WolfView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WolfView>;
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

export function addWolfView(views: readonly WolfView[], view: WolfView): WolfView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readWolfViews([...views, { ...view, id, name }]);
}

export function dropWolfView(views: readonly WolfView[], id: string): WolfView[] {
  return views.filter((view) => view.id !== id);
}

export function wolfDensity(raw: unknown): WolfDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortWolfes(cards: readonly Wolf[], sort: WolfSort): Wolf[] {
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

export function visibleWolfes(
  cards: readonly Wolf[],
  tray: WolfTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Wolf[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : wolfFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !wolfInner(card.piece)) return false;
    if (wantLimb === "outer" && !wolfOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side part on count two, still not raised and not in the drawer, is overdue. */
export function overdueWolf(card: Wolf): boolean {
  return wolfOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No finish, gap six, spring two, and still on the bench. */
export function idleWolf(card: Wolf): boolean {
  return !card.film && card.drop === 4 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, gap forty-eight, and a full spring, still out of the drawer. */
export function briskWolf(card: Wolf): boolean {
  return card.film === "GILT" && card.drop === 32 && card.lock === 7 && !card.coffered;
}

/** Jewel, ivory, and gap twelve. */
export function restingWolf(card: Wolf): boolean {
  return card.piece === "ratch" && card.film === "GRAPHITE" && card.drop === 8;
}

/** A lyre is late when the station is already on the jewel. */
export function lateWolf(card: Wolf, station: string): boolean {
  return card.piece === "click" && wolfMode(station) === "ratch" && !card.raised;
}

export function wolfCounts(cards: readonly Wolf[], shown: readonly Wolf[], station: string): WolfCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => wolfInner(card.piece)).length,
    outer: cards.filter((card) => wolfOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleWolf).length,
    brisk: cards.filter(briskWolf).length,
    resting: cards.filter(restingWolf).length,
    overdue: cards.filter(overdueWolf).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateWolf(card, station)).length,
  };
}

export function wolfBars(cards: readonly Wolf[]): { piece: string; count: number }[] {
  return WFT_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function wolfTimeline(cards: readonly Wolf[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function wolfKeepers(cards: readonly Wolf[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Wolf[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of wolfKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderWolfes(cards: readonly Wolf[]): string[] {
  return cards.filter(overdueWolf).map((card) => card.title);
}

export function wolfCopy(card: Wolf): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function wolfCsv(cards: readonly Wolf[], station: string): string {
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
        wolfOuter(card.piece) ? "1" : "0",
        lateWolf(card, station) ? "1" : "0",
        idleWolf(card) ? "1" : "0",
        briskWolf(card) ? "1" : "0",
        restingWolf(card) ? "1" : "0",
        overdueWolf(card) ? "1" : "0",
        wolfInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        wolfBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const DOX_KEY = "crmv4-dox-hide";
export const DOX_REVIEW_KEY = "crmv4-dox-review";

export type DoxLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type DoxHue = "" | "ivory" | "graphite" | "champagne";
export type DoxState = "" | "clear" | "set";
export type DoxReview = "all" | "reviewed" | "fresh";
export type DoxShape =
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

export type DoxValue = string | { documentsStatus?: unknown; [key: string]: unknown } | null | undefined;
export type DoxRow = { id: string; label: string; code: DoxValue };
export type DoxLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: DoxValue): { documentsStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: DoxValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: DoxValue): string {
  const row = codeRecord(raw);
  if (row && !("documentsStatus" in row)) return "";
  const value = row ? row.documentsStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "PASS";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: DoxValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("documentsStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function doxState(raw: DoxValue): DoxState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["PASS", "CLEAR", "APPROVED", "YES"]);
const DESK_TITLES = new Set(["PENDING", "QUEUE"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT"]);
const GUEST_TITLES = new Set(["REJECTED", "FAIL"]);
const JOIN_TITLES = new Set(["PAIR", "JOINT"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "OTHER"]);

/** A known grant maps first. A plus joins two grants. A semicolon that is not a time marks a scoped grant. A time today is house. Within four days is desk. Within twelve days is hold. Older is a guest. Closed or revoked is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is sixteen characters or longer. A vowel mark starts with a vowel. The words staff and desk are house grants. */
export function doxLane(raw: DoxValue, now = Date.now()): DoxLane {
  if (doxState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/closed|expired/i.test(text)) return "vacant";
  if (text.includes("+")) return "join";
  const at = Date.parse(text);
  if (!Number.isNaN(at)) {
    if (at > now) return "hall";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "hall";
    const age = now - at;
    if (age < 2 * day) return "desk";
    if (age < 8 * day) return "hold";
    return "guest";
  }
  if (text.includes(":")) return "route";
  if (text.length === 5) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 12 && text.includes("/")) return "route";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  if (/\bkyc\b|\bfile\b/i.test(text)) return "hall";
  return "plain";
}

export function doxHue(raw: DoxValue, now = Date.now()): DoxHue {
  const mail = doxLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function doxHome(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "hall";
}

export function doxAway(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "vacant";
}

export function doxGuest(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "hold";
}

export function doxCitizen(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "guest";
}

export function doxDesk(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "desk";
}

export function doxJoin(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "join";
}

export function doxRoute(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "route";
}

export function doxBrief(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "brief";
}

export function doxLong(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "long";
}

export function doxStampMark(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "stamp";
}

export function doxVowelLane(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "vowel";
}

export function doxPlain(raw: DoxValue, now = Date.now()): boolean {
  return doxLane(raw, now) === "plain";
}

export function doxOpen(raw: DoxValue): boolean {
  return doxState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function doxHeld(raw: DoxValue): boolean {
  const mail = doxLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function doxSoon(raw: DoxValue, now = Date.now()): boolean {
  if (doxState(raw) !== "set") return false;
  if (doxBrief(raw, now)) return true;
  if (doxHome(raw, now) || doxAway(raw, now) || doxGuest(raw, now) || doxCitizen(raw, now)) return false;
  return codeGiven(raw).length === 2;
}

export function doxLength(raw: DoxValue): number | null {
  if (doxState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function doxEven(raw: DoxValue): boolean {
  const length = doxLength(raw);
  return length !== null && length % 2 === 0;
}

export function doxOdd(raw: DoxValue): boolean {
  const length = doxLength(raw);
  return length !== null && length % 2 === 1;
}

export function doxFirst(raw: DoxValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function doxTail(raw: DoxValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function doxCapital(raw: DoxValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function doxSpace(raw: DoxValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function doxVowel(raw: DoxValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function doxDigit(raw: DoxValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function doxLetter(raw: DoxValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function doxMixed(raw: DoxValue): boolean {
  return doxDigit(raw) && doxLetter(raw);
}

export function doxLower(raw: DoxValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function doxUpper(raw: DoxValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function doxStamp(raw: DoxValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function doxCopy(raw: DoxValue): string {
  return codeGiven(raw);
}

export function doxFamily(raw: DoxValue): string {
  if (doxState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function doxLanes(rows: readonly DoxRow[]): DoxLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = doxLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly DoxRow[]): string {
  const lines = doxLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly DoxRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = doxHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly DoxRow[], mail: DoxLane): number {
  return rows.filter((row) => doxLane(row.code) === mail).length;
}

export function doxShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly DoxRow[]): string[] {
  return doxLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: DoxRow, shape: DoxShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return doxHome(row.code);
  if (shape === "vacant") return doxAway(row.code);
  if (shape === "hold") return doxGuest(row.code);
  if (shape === "guest") return doxCitizen(row.code);
  if (shape === "join") return doxJoin(row.code);
  if (shape === "route") return doxRoute(row.code);
  if (shape === "brief") return doxBrief(row.code);
  if (shape === "long") return doxLong(row.code);
  if (shape === "stamp") return doxStampMark(row.code);
  if (shape === "vowel") return doxVowelLane(row.code);
  if (shape === "plain") return doxPlain(row.code);
  if (shape === "open") return doxOpen(row.code);
  if (shape === "soon") return doxSoon(row.code);
  if (shape === "letter") return doxLetter(row.code);
  if (shape === "mixed") return doxMixed(row.code);
  if (shape === "upper") return doxUpper(row.code);
  if (shape === "lower") return doxLower(row.code);
  if (shape === "space") return doxSpace(row.code);
  if (shape === "even") return doxEven(row.code);
  if (shape === "odd") return doxOdd(row.code);
  if (shape === "tail") return doxTail(row.code);
  if (shape === "first") return doxFirst(row.code);
  if (shape === "held") return doxHeld(row.code);
  return doxLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly DoxRow[],
  mail: string,
  hue: string,
  query: string,
  review: DoxReview,
  reviewed: readonly string[],
  shape: DoxShape,
): DoxRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (doxState(row.code) === "") return false;
    const found = doxLane(row.code);
    const hueName = doxHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${doxStamp(row.code)} ${doxFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function doxLanesCsv(rows: readonly DoxRow[]): string {
  const lines = ["lane,count"];
  for (const line of doxLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function doxRowsCsv(rows: readonly DoxRow[], reviewed: readonly string[]): string {
  const lines = ["name,documentsStatus,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(doxCopy(row.code)),
        doxStamp(row.code),
        csvCell(doxFamily(row.code)),
        doxLane(row.code),
        doxHue(row.code),
        doxLength(row.code) ?? "",
        doxHome(row.code) ? "1" : "0",
        doxAway(row.code) ? "1" : "0",
        doxGuest(row.code) ? "1" : "0",
        doxDesk(row.code) ? "1" : "0",
        doxCitizen(row.code) ? "1" : "0",
        doxJoin(row.code) ? "1" : "0",
        doxRoute(row.code) ? "1" : "0",
        doxBrief(row.code) ? "1" : "0",
        doxEven(row.code) ? "1" : "0",
        doxDigit(row.code) ? "1" : "0",
        doxMixed(row.code) ? "1" : "0",
        doxUpper(row.code) ? "1" : "0",
        doxVowel(row.code) ? "1" : "0",
        doxTail(row.code) ? "1" : "0",
        doxHeld(row.code) ? "1" : "0",
        doxSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
