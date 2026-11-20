/**
 * Azurage grain rules for a dial kept in this browser,
 * and agent plates read lastUserAgent already stored on the account.
 * Grains are grain, cloud, sun, and frost. Finishes are gilt, ivory, and graphite.
 * Grain counts are 8, 16, 32, or 64. Rings are 3, 6, or 12.
 * Grain and cloud are main. Sun and frost are side.
 * A handset token, or a login today, is live. A bot token is never. A week-old stamp is this week. A month-old stamp is this month. An older stamp is stale.
 * IN is a handset. OFF is a bot. NONE is idle. An ampersand joins two marks. A colon that is not a time marks a versioned agent.
 * Mobile, Android, iPhone, and iPad are handsets. Bot, spider, and crawler are bots.
 * A brief mark is exactly six characters. A stamp starts with a digit and is not a time.
 * A long mark is twenty characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * A true mark reads as IN. A false mark reads as OFF. The plate does not change the saved user agent.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_azurage (
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
 * CREATE TABLE crm_agt_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_agt_review (
 *   trader_id text primary key
 * );
 */

export const AZR_KEY = "crmv4-azurage";
export const AZR_VIEW_KEY = "crmv4-azurage-views";
export const AZR_DENSITY_KEY = "crmv4-azurage-density";
export const AZR_MODES = ["grain", "cloud", "sun", "frost"] as const;

export type AzurageMode = (typeof AZR_MODES)[number];
export type AzurageFilm = "blank" | "gilt" | "ivory" | "graphite";
export type AzurageTray = "board" | "peg" | "coffer";
export type AzurageDensity = "airy" | "close";
export type AzurageSort = "piece" | "setter";

export type Azurage = {
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

export type AzurageView = {
  id: string;
  name: string;
  tray: AzurageTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type AzurageCounts = {
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

export const ROUND359_FEATURES = [
  "azurage-save",
  "grain-reminders",
  "azurage-modes",
  "azurage-search",
  "azurage-pin-sla",
  "grain-archive",
  "azurage-latch-star",
  "azurage-inline-title",
  "azurage-filters",
  "saved-azurage-views",
  "azurage-density",
  "grain-focus",
  "azurage-kpis",
  "grain-chart",
  "grain-timeline",
  "azurage-bulk",
  "azurage-csv",
  "azurage-keys",
  "azurage-audit",
  "fair-grainer",
  "azurage-viewer",
  "suggest-grain",
  "overdue-grain",
  "agent-plate",
  "agent-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [8, 16, 32, 64] as const;
const LOCK_CYCLE = [3, 6, 12] as const;
const INNER = new Set(["grain", "cloud"]);
const OUTER = new Set(["sun", "frost"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AzurageTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<AzurageFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<AzurageFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[gs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Azurage, tray: AzurageTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return AZR_MODES.indexOf(piece as AzurageMode);
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

export function azurageMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (AZR_MODES as readonly string[]).includes(text) ? text : "";
}

/** A grain count is 8, 16, 32, or 64. Anything else stays blank. */
export function azurageHour(raw: unknown): 8 | 16 | 32 | 64 | null {
  const text = wholeToken(raw);
  if (text !== "8" && text !== "16" && text !== "32" && text !== "64") return null;
  return Number(text) as 8 | 16 | 32 | 64;
}

/** A ring is 3, 6, or 12. Anything else stays blank. */
export function azurageHammer(raw: unknown): 3 | 6 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12") return null;
  return Number(text) as 3 | 6 | 12;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function azurageFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function azurageInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function azurageOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Straight is the bar. Circular is the ring. Wavy is the wave. Broken is the break. */
export function azurageBand(piece: unknown): string {
  const text = azurageMode(piece);
  if (!text) return "";
  if (text === "grain") return "circle";
  if (text === "cloud") return "mist";
  if (text === "sun") return "beam";
  return "rime";
}

/** Signed distance from one mode to another along the stripe. */
export function azurageGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(azurageMode(from));
  const right = pieceIndex(azurageMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(azurageFilm(film));
}

/** A pair ring is 6. Three and twelve are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return azurageHammer(lock) === 6;
}

/** A full ring is 12. */
export function fullHammer(lock: unknown): boolean {
  return azurageHammer(lock) === 12;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return azurageMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = azurageHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = azurageFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = azurageHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveAzurageFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Azurage[]): string {
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
export function suggestHour(cards: readonly Azurage[], hour: number): 8 | 16 | 32 | 64 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 8 | 16 | 32 | 64 = 8;
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
  if (hour < 6) return 8;
  if (hour < 12) return 16;
  if (hour < 18) return 32;
  return 64;
}

export function suggestMode(hour: number): AzurageMode {
  return hour < 6 ? "grain" : "frost";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Azurage[], roster: string): string {
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

export function readAzurages(raw: unknown): Azurage[] {
  if (!Array.isArray(raw)) return [];
  const out: Azurage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Azurage>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: azurageMode(row.piece),
      drop: azurageHour(row.drop),
      film: azurageFilm(row.film),
      lock: azurageHammer(row.lock) ?? 3,
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

export function addAzurage(
  cards: readonly Azurage[],
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
): Azurage[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readAzurages([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: azurageMode(card.piece),
      drop: azurageHour(card.drop),
      film: azurageFilm(card.film),
      lock: azurageHammer(card.lock) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Azurage[], id: string, edit: (card: Azurage) => Azurage): Azurage[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editAzurage(cards: readonly Azurage[], id: string, title: string): Azurage[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editAzurageNote(cards: readonly Azurage[], id: string, note: string): Azurage[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(azurageFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setAzurageFilm(cards: readonly Azurage[], id: string, film: string): Azurage[] {
  const next = azurageFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setAzurageRaised(cards: readonly Azurage[], id: string, raised: boolean): Azurage[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setAzuragePin(cards: readonly Azurage[], id: string, pinned: boolean): Azurage[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setAzurageCoffer(cards: readonly Azurage[], id: string, coffered: boolean): Azurage[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setAzurageStar(cards: readonly Azurage[], id: string, starred: boolean): Azurage[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addAzurageTag(cards: readonly Azurage[], id: string, tag: string): Azurage[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 8 | 16 | 32 | 64 {
  if (drop === null) return dir > 0 ? 8 : 64;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 3 | 6 | 12 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setAzurageFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinAzurageFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return setAzuragePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starAzurageFocused(cards: readonly Azurage[], id: string): Azurage[] {
  return setAzurageStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Azurage[], id: string): Azurage[] {
  const card = cards.find((item) => item.id === id);
  return card ? setAzurageFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Azurage[], ids: readonly string[], edit: (card: Azurage) => Azurage): Azurage[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkAzurageGraphite(cards: readonly Azurage[], ids: readonly string[]): Azurage[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkAzurageRaise(cards: readonly Azurage[], ids: readonly string[]): Azurage[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkAzurageCoffer(cards: readonly Azurage[], ids: readonly string[]): Azurage[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkAzurageTag(cards: readonly Azurage[], ids: readonly string[]): Azurage[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readAzurageViews(raw: unknown): AzurageView[] {
  if (!Array.isArray(raw)) return [];
  const out: AzurageView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AzurageView>;
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

export function addAzurageView(views: readonly AzurageView[], view: AzurageView): AzurageView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readAzurageViews([...views, { ...view, id, name }]);
}

export function dropAzurageView(views: readonly AzurageView[], id: string): AzurageView[] {
  return views.filter((view) => view.id !== id);
}

export function azurageDensity(raw: unknown): AzurageDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortAzurages(cards: readonly Azurage[], sort: AzurageSort): Azurage[] {
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

export function visibleAzurages(
  cards: readonly Azurage[],
  tray: AzurageTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Azurage[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : azurageFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !azurageInner(card.piece)) return false;
    if (wantLimb === "outer" && !azurageOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side grain on ring three, still not raised and not in the drawer, is overdue. */
export function overdueAzurage(card: Azurage): boolean {
  return azurageOuter(card.piece) && card.lock === 3 && !card.raised && !card.coffered;
}

/** No finish, the short count, ring three, and still on the bench. */
export function idleAzurage(card: Azurage): boolean {
  return !card.film && card.drop === 8 && card.lock === 3 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall count, and a full ring, still out of the drawer. */
export function briskAzurage(card: Azurage): boolean {
  return card.film === "GILT" && card.drop === 64 && card.lock === 12 && !card.coffered;
}

/** Frost, ivory, and count sixteen. */
export function restingAzurage(card: Azurage): boolean {
  return card.piece === "frost" && card.film === "IVORY" && card.drop === 16;
}

/** A grain circle is late when the station is already frost. */
export function lateAzurage(card: Azurage, station: string): boolean {
  return card.piece === "grain" && azurageMode(station) === "frost" && !card.raised;
}

export function azurageCounts(cards: readonly Azurage[], shown: readonly Azurage[], station: string): AzurageCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => azurageInner(card.piece)).length,
    outer: cards.filter((card) => azurageOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 64).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleAzurage).length,
    brisk: cards.filter(briskAzurage).length,
    resting: cards.filter(restingAzurage).length,
    overdue: cards.filter(overdueAzurage).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateAzurage(card, station)).length,
  };
}

export function azurageBars(cards: readonly Azurage[]): { piece: string; count: number }[] {
  return AZR_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function azurageTimeline(cards: readonly Azurage[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function azurageKeepers(cards: readonly Azurage[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Azurage[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of azurageKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderAzurages(cards: readonly Azurage[]): string[] {
  return cards.filter(overdueAzurage).map((card) => card.title);
}

export function azurageCopy(card: Azurage): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function azurageCsv(cards: readonly Azurage[], station: string): string {
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
        azurageOuter(card.piece) ? "1" : "0",
        lateAzurage(card, station) ? "1" : "0",
        idleAzurage(card) ? "1" : "0",
        briskAzurage(card) ? "1" : "0",
        restingAzurage(card) ? "1" : "0",
        overdueAzurage(card) ? "1" : "0",
        azurageInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        azurageBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const AGT_KEY = "crmv4-agt-hide";
export const AGT_REVIEW_KEY = "crmv4-agt-review";

export type AgtLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type AgtHue = "" | "ivory" | "graphite" | "champagne";
export type AgtState = "" | "clear" | "set";
export type AgtReview = "all" | "reviewed" | "fresh";
export type AgtShape =
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

export type AgtValue = string | { lastUserAgent?: unknown; [key: string]: unknown } | null | undefined;
export type AgtRow = { id: string; label: string; code: AgtValue };
export type AgtLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: AgtValue): { lastUserAgent?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: AgtValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: AgtValue): string {
  const row = codeRecord(raw);
  if (row && !("lastUserAgent" in row)) return "";
  const value = row ? row.lastUserAgent : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "IN";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return clip(value, 48);
}

function codeReadable(raw: AgtValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastUserAgent" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function agtState(raw: AgtValue): AgtState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A login today is live. A login within seven days is this week. A login within thirty days is this month. An older login is stale. IN is live. OFF is never. NONE is idle. An ampersand joins two marks. A colon that is not a time marks a route. A brief mark is exactly six characters. A stamp starts with a digit and is not a time. A long mark is twenty characters or longer and does not start with a digit. A vowel mark starts with a vowel. */
export function agtLane(raw: AgtValue, now = Date.now()): AgtLane {
  if (agtState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (upper === "IN" || upper === "LIVE" || upper === "ON") return "hall";
  if (upper === "OFF" || upper === "NEVER") return "vacant";
  if (upper === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (/bot|spider|crawler/i.test(text)) return "vacant";
  if (/Mobile|Android|iPhone|iPad/i.test(text)) return "hall";
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
  if (text.length >= 20 && text.includes("/")) return "route";
  if (text.length >= 20) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function agtHue(raw: AgtValue, now = Date.now()): AgtHue {
  const mail = agtLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function agtHome(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "hall";
}

export function agtAway(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "vacant";
}

export function agtGuest(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "hold";
}

export function agtCitizen(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "guest";
}

export function agtDesk(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "desk";
}

export function agtJoin(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "join";
}

export function agtRoute(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "route";
}

export function agtBrief(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "brief";
}

export function agtLong(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "long";
}

export function agtStampMark(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "stamp";
}

export function agtVowelLane(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "vowel";
}

export function agtPlain(raw: AgtValue, now = Date.now()): boolean {
  return agtLane(raw, now) === "plain";
}

export function agtOpen(raw: AgtValue): boolean {
  return agtState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function agtHeld(raw: AgtValue): boolean {
  const mail = agtLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or an eight-character mark that is not a known visit, still wants a fuller name. */
export function agtSoon(raw: AgtValue, now = Date.now()): boolean {
  if (agtState(raw) !== "set") return false;
  if (agtBrief(raw, now)) return true;
  if (agtHome(raw, now) || agtAway(raw, now) || agtGuest(raw, now) || agtCitizen(raw, now)) return false;
  return codeGiven(raw).length === 8;
}

export function agtLength(raw: AgtValue): number | null {
  if (agtState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function agtEven(raw: AgtValue): boolean {
  const length = agtLength(raw);
  return length !== null && length % 2 === 0;
}

export function agtOdd(raw: AgtValue): boolean {
  const length = agtLength(raw);
  return length !== null && length % 2 === 1;
}

export function agtFirst(raw: AgtValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function agtTail(raw: AgtValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function agtCapital(raw: AgtValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function agtSpace(raw: AgtValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function agtVowel(raw: AgtValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function agtDigit(raw: AgtValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function agtLetter(raw: AgtValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function agtMixed(raw: AgtValue): boolean {
  return agtDigit(raw) && agtLetter(raw);
}

export function agtLower(raw: AgtValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function agtUpper(raw: AgtValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function agtStamp(raw: AgtValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function agtCopy(raw: AgtValue): string {
  return codeGiven(raw);
}

export function agtFamily(raw: AgtValue): string {
  if (agtState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function agtLanes(rows: readonly AgtRow[]): AgtLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = agtLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly AgtRow[]): string {
  const lines = agtLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly AgtRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = agtHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly AgtRow[], mail: AgtLane): number {
  return rows.filter((row) => agtLane(row.code) === mail).length;
}

export function agtShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly AgtRow[]): string[] {
  return agtLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: AgtRow, shape: AgtShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return agtHome(row.code);
  if (shape === "vacant") return agtAway(row.code);
  if (shape === "hold") return agtGuest(row.code);
  if (shape === "guest") return agtCitizen(row.code);
  if (shape === "join") return agtJoin(row.code);
  if (shape === "route") return agtRoute(row.code);
  if (shape === "brief") return agtBrief(row.code);
  if (shape === "long") return agtLong(row.code);
  if (shape === "stamp") return agtStampMark(row.code);
  if (shape === "vowel") return agtVowelLane(row.code);
  if (shape === "plain") return agtPlain(row.code);
  if (shape === "open") return agtOpen(row.code);
  if (shape === "soon") return agtSoon(row.code);
  if (shape === "letter") return agtLetter(row.code);
  if (shape === "mixed") return agtMixed(row.code);
  if (shape === "upper") return agtUpper(row.code);
  if (shape === "lower") return agtLower(row.code);
  if (shape === "space") return agtSpace(row.code);
  if (shape === "even") return agtEven(row.code);
  if (shape === "odd") return agtOdd(row.code);
  if (shape === "tail") return agtTail(row.code);
  if (shape === "first") return agtFirst(row.code);
  if (shape === "held") return agtHeld(row.code);
  return agtLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly AgtRow[],
  mail: string,
  hue: string,
  query: string,
  review: AgtReview,
  reviewed: readonly string[],
  shape: AgtShape,
): AgtRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (agtState(row.code) === "") return false;
    const found = agtLane(row.code);
    const hueName = agtHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${agtStamp(row.code)} ${agtFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function agtLanesCsv(rows: readonly AgtRow[]): string {
  const lines = ["lane,count"];
  for (const line of agtLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function agtRowsCsv(rows: readonly AgtRow[], reviewed: readonly string[]): string {
  const lines = ["name,lastUserAgent,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(agtCopy(row.code)),
        agtStamp(row.code),
        csvCell(agtFamily(row.code)),
        agtLane(row.code),
        agtHue(row.code),
        agtLength(row.code) ?? "",
        agtHome(row.code) ? "1" : "0",
        agtAway(row.code) ? "1" : "0",
        agtGuest(row.code) ? "1" : "0",
        agtDesk(row.code) ? "1" : "0",
        agtCitizen(row.code) ? "1" : "0",
        agtJoin(row.code) ? "1" : "0",
        agtRoute(row.code) ? "1" : "0",
        agtBrief(row.code) ? "1" : "0",
        agtEven(row.code) ? "1" : "0",
        agtDigit(row.code) ? "1" : "0",
        agtMixed(row.code) ? "1" : "0",
        agtUpper(row.code) ? "1" : "0",
        agtVowel(row.code) ? "1" : "0",
        agtTail(row.code) ? "1" : "0",
        agtHeld(row.code) ? "1" : "0",
        agtSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
