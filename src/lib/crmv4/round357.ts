/**
 * Geneva stripe rules for côtes de Genève kept in this browser,
 * and potential plates read potentialStatus already stored on the account.
 * Modes are straight, circular, wavy, and broken. Finishes are gilt, ivory, and graphite.
 * Pitches are 6, 12, 24, or 48. Lines are 4, 8, or 16.
 * Straight and circular are main. Wavy and broken are side.
 * A known grade is HOT, WARM, COOL, or COLD, including KEEN, PRIME, SOFT, MILD, CALM, STILL, LOST, and SHUT.
 * An ampersand joins two grades. A colon marks a route.
 * A brief grade is exactly six characters. A stamp starts with a digit.
 * A long grade is twenty characters or longer and does not start with a digit. A vowel grade starts with a vowel.
 * A true grade reads as HOT. A false grade reads as OFF. The plate does not change the saved potential status.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_geneva (
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
 * CREATE TABLE crm_pts_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_pts_review (
 *   trader_id text primary key
 * );
 */

export const GVS_KEY = "crmv4-geneva";
export const GVS_VIEW_KEY = "crmv4-geneva-views";
export const GVS_DENSITY_KEY = "crmv4-geneva-density";
export const GVS_MODES = ["straight", "circular", "wavy", "broken"] as const;

export type GenevaMode = (typeof GVS_MODES)[number];
export type GenevaFilm = "blank" | "gilt" | "ivory" | "graphite";
export type GenevaTray = "board" | "peg" | "coffer";
export type GenevaDensity = "airy" | "close";
export type GenevaSort = "piece" | "setter";

export type Geneva = {
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

export type GenevaView = {
  id: string;
  name: string;
  tray: GenevaTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type GenevaCounts = {
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

export const ROUND357_FEATURES = [
  "geneva-save",
  "stripe-reminders",
  "geneva-modes",
  "geneva-search",
  "geneva-pin-sla",
  "stripe-archive",
  "geneva-latch-star",
  "geneva-inline-title",
  "geneva-filters",
  "saved-geneva-views",
  "geneva-density",
  "stripe-focus",
  "geneva-kpis",
  "stripe-chart",
  "stripe-timeline",
  "geneva-bulk",
  "geneva-csv",
  "geneva-keys",
  "geneva-audit",
  "fair-striper",
  "geneva-viewer",
  "suggest-stripe",
  "overdue-stripe",
  "potential-plate",
  "potential-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [6, 12, 24, 48] as const;
const LOCK_CYCLE = [4, 8, 16] as const;
const INNER = new Set(["straight", "circular"]);
const OUTER = new Set(["wavy", "broken"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SOURCE_ALIAS: Record<string, "HOT" | "WARM" | "COOL" | "COLD"> = {
  HOT: "HOT",
  KEEN: "HOT",
  PRIME: "HOT",
  WARM: "WARM",
  SOFT: "WARM",
  MILD: "WARM",
  COOL: "COOL",
  CALM: "COOL",
  STILL: "COOL",
  COLD: "COLD",
  LOST: "COLD",
  SHUT: "COLD",
};
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GenevaTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<GenevaFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<GenevaFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[st]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Geneva, tray: GenevaTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return GVS_MODES.indexOf(piece as GenevaMode);
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

export function genevaMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GVS_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 6, 12, 24, or 48. Anything else stays blank. */
export function genevaHour(raw: unknown): 6 | 12 | 24 | 48 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "12" && text !== "24" && text !== "48") return null;
  return Number(text) as 6 | 12 | 24 | 48;
}

/** A line is 4, 8, or 16. Anything else stays blank. */
export function genevaHammer(raw: unknown): 4 | 8 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16") return null;
  return Number(text) as 4 | 8 | 16;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function genevaFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function genevaInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function genevaOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Straight is the bar. Circular is the ring. Wavy is the wave. Broken is the break. */
export function genevaBand(piece: unknown): string {
  const text = genevaMode(piece);
  if (!text) return "";
  if (text === "straight") return "bar";
  if (text === "circular") return "ring";
  if (text === "wavy") return "wave";
  return "break";
}

/** Signed distance from one mode to another along the stripe. */
export function genevaGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(genevaMode(from));
  const right = pieceIndex(genevaMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(genevaFilm(film));
}

/** A pair line is 8. Four and sixteen are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return genevaHammer(lock) === 8;
}

/** A full line is 16. */
export function fullHammer(lock: unknown): boolean {
  return genevaHammer(lock) === 16;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return genevaMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = genevaHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = genevaFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = genevaHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveGenevaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Geneva[]): string {
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
export function suggestHour(cards: readonly Geneva[], hour: number): 6 | 12 | 24 | 48 {
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

export function suggestMode(hour: number): GenevaMode {
  return hour < 6 ? "straight" : "broken";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Geneva[], roster: string): string {
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

export function readGenevas(raw: unknown): Geneva[] {
  if (!Array.isArray(raw)) return [];
  const out: Geneva[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Geneva>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: genevaMode(row.piece),
      drop: genevaHour(row.drop),
      film: genevaFilm(row.film),
      lock: genevaHammer(row.lock) ?? 4,
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
  cards: readonly Geneva[],
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
): Geneva[] {
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
      piece: genevaMode(card.piece),
      drop: genevaHour(card.drop),
      film: genevaFilm(card.film),
      lock: genevaHammer(card.lock) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Geneva[], id: string, edit: (card: Geneva) => Geneva): Geneva[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGeneva(cards: readonly Geneva[], id: string, title: string): Geneva[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGenevaNote(cards: readonly Geneva[], id: string, note: string): Geneva[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(genevaFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setGenevaFilm(cards: readonly Geneva[], id: string, film: string): Geneva[] {
  const next = genevaFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setGenevaRaised(cards: readonly Geneva[], id: string, raised: boolean): Geneva[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setGenevaPin(cards: readonly Geneva[], id: string, pinned: boolean): Geneva[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setGenevaCoffer(cards: readonly Geneva[], id: string, coffered: boolean): Geneva[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setGenevaStar(cards: readonly Geneva[], id: string, starred: boolean): Geneva[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addGenevaTag(cards: readonly Geneva[], id: string, tag: string): Geneva[] {
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

export function raiseHourFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setGenevaFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinGenevaFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return setGenevaPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starGenevaFocused(cards: readonly Geneva[], id: string): Geneva[] {
  return setGenevaStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Geneva[], id: string): Geneva[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGenevaFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Geneva[], ids: readonly string[], edit: (card: Geneva) => Geneva): Geneva[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGenevaGraphite(cards: readonly Geneva[], ids: readonly string[]): Geneva[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkGenevaRaise(cards: readonly Geneva[], ids: readonly string[]): Geneva[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkGenevaCoffer(cards: readonly Geneva[], ids: readonly string[]): Geneva[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkGenevaTag(cards: readonly Geneva[], ids: readonly string[]): Geneva[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "t"]), audit: "tag" }));
}

export function readGenevaViews(raw: unknown): GenevaView[] {
  if (!Array.isArray(raw)) return [];
  const out: GenevaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GenevaView>;
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

export function addGenevaView(views: readonly GenevaView[], view: GenevaView): GenevaView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGenevaViews([...views, { ...view, id, name }]);
}

export function dropGenevaView(views: readonly GenevaView[], id: string): GenevaView[] {
  return views.filter((view) => view.id !== id);
}

export function genevaDensity(raw: unknown): GenevaDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortGenevas(cards: readonly Geneva[], sort: GenevaSort): Geneva[] {
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
  cards: readonly Geneva[],
  tray: GenevaTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Geneva[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : genevaFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !genevaInner(card.piece)) return false;
    if (wantLimb === "outer" && !genevaOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side mode on line four, still not raised and not in the drawer, is overdue. */
export function overdueGeneva(card: Geneva): boolean {
  return genevaOuter(card.piece) && card.lock === 4 && !card.raised && !card.coffered;
}

/** No finish, the short pitch, line four, and still on the bench. */
export function idleGeneva(card: Geneva): boolean {
  return !card.film && card.drop === 6 && card.lock === 4 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall pitch, and a full line, still out of the drawer. */
export function briskGeneva(card: Geneva): boolean {
  return card.film === "GILT" && card.drop === 48 && card.lock === 16 && !card.coffered;
}

/** Broken, ivory, and pitch twelve. */
export function restingGeneva(card: Geneva): boolean {
  return card.piece === "broken" && card.film === "IVORY" && card.drop === 12;
}

/** A straight stripe is late when the station is already broken. */
export function lateGeneva(card: Geneva, station: string): boolean {
  return card.piece === "straight" && genevaMode(station) === "broken" && !card.raised;
}

export function genevaCounts(cards: readonly Geneva[], shown: readonly Geneva[], station: string): GenevaCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => genevaInner(card.piece)).length,
    outer: cards.filter((card) => genevaOuter(card.piece)).length,
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

export function genevaBars(cards: readonly Geneva[]): { piece: string; count: number }[] {
  return GVS_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function genevaTimeline(cards: readonly Geneva[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function genevaKeepers(cards: readonly Geneva[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Geneva[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of genevaKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGenevas(cards: readonly Geneva[]): string[] {
  return cards.filter(overdueGeneva).map((card) => card.title);
}

export function genevaCopy(card: Geneva): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function genevaCsv(cards: readonly Geneva[], station: string): string {
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
        genevaOuter(card.piece) ? "1" : "0",
        lateGeneva(card, station) ? "1" : "0",
        idleGeneva(card) ? "1" : "0",
        briskGeneva(card) ? "1" : "0",
        restingGeneva(card) ? "1" : "0",
        overdueGeneva(card) ? "1" : "0",
        genevaInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        genevaBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const PTS_KEY = "crmv4-pts-hide";
export const PTS_REVIEW_KEY = "crmv4-pts-review";

export type PtsLane = "" | "home" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type PtsHue = "" | "ivory" | "graphite" | "champagne";
export type PtsState = "" | "clear" | "set";
export type PtsReview = "all" | "reviewed" | "fresh";
export type PtsShape =
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

export type PtsValue = string | { potentialStatus?: unknown; [key: string]: unknown } | null | undefined;
export type PtsRow = { id: string; label: string; code: PtsValue };
export type PtsLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["home", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: PtsValue): { potentialStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: PtsValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: PtsValue): string {
  const row = codeRecord(raw);
  if (row && !("potentialStatus" in row)) return "";
  const value = row ? row.potentialStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOT";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return clip(value, 48);
}

function codeReadable(raw: PtsValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("potentialStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function ptsState(raw: PtsValue): PtsState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known grade is HOT, WARM, COOL, or COLD, including KEEN, PRIME, SOFT, MILD, CALM, STILL, LOST, and SHUT. An ampersand joins two grades. A colon marks a route. A brief grade is exactly six characters. A stamp starts with a digit. A long grade is twenty characters or longer and does not start with a digit. A vowel grade starts with a vowel. */
export function ptsLane(raw: PtsValue): PtsLane {
  if (ptsState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = SOURCE_ALIAS[upper];
  if (canon === "HOT") return "home";
  if (canon === "WARM") return "desk";
  if (canon === "COOL") return "hold";
  if (canon === "COLD") return "guest";
  if (text === "NONE") return "plain";
  if (upper === "OFF") return "vacant";
  if (text.includes("&")) return "join";
  if (text.includes(":")) return "route";
  if (text.length === 6) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 20) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function ptsHue(raw: PtsValue): PtsHue {
  const mail = ptsLane(raw);
  if (!mail) return "";
  if (mail === "home" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function ptsHome(raw: PtsValue): boolean {
  return ptsLane(raw) === "home";
}

export function ptsAway(raw: PtsValue): boolean {
  return ptsLane(raw) === "vacant";
}

export function ptsGuest(raw: PtsValue): boolean {
  return ptsLane(raw) === "hold";
}

export function ptsCitizen(raw: PtsValue): boolean {
  return ptsLane(raw) === "guest";
}

export function ptsDesk(raw: PtsValue): boolean {
  return ptsLane(raw) === "desk";
}

export function ptsJoin(raw: PtsValue): boolean {
  return ptsLane(raw) === "join";
}

export function ptsRoute(raw: PtsValue): boolean {
  return ptsLane(raw) === "route";
}

export function ptsBrief(raw: PtsValue): boolean {
  return ptsLane(raw) === "brief";
}

export function ptsLong(raw: PtsValue): boolean {
  return ptsLane(raw) === "long";
}

export function ptsStampMark(raw: PtsValue): boolean {
  return ptsLane(raw) === "stamp";
}

export function ptsVowelLane(raw: PtsValue): boolean {
  return ptsLane(raw) === "vowel";
}

export function ptsPlain(raw: PtsValue): boolean {
  return ptsLane(raw) === "plain";
}

export function ptsOpen(raw: PtsValue): boolean {
  return ptsState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function ptsHeld(raw: PtsValue): boolean {
  const mail = ptsLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief grade, or an eight-character grade that is not a known potential, still wants a fuller name. */
export function ptsSoon(raw: PtsValue): boolean {
  if (ptsState(raw) !== "set") return false;
  if (ptsBrief(raw)) return true;
  if (ptsHome(raw) || ptsAway(raw) || ptsGuest(raw) || ptsCitizen(raw)) return false;
  return codeGiven(raw).length === 8;
}

export function ptsLength(raw: PtsValue): number | null {
  if (ptsState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function ptsEven(raw: PtsValue): boolean {
  const length = ptsLength(raw);
  return length !== null && length % 2 === 0;
}

export function ptsOdd(raw: PtsValue): boolean {
  const length = ptsLength(raw);
  return length !== null && length % 2 === 1;
}

export function ptsFirst(raw: PtsValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function ptsTail(raw: PtsValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function ptsCapital(raw: PtsValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function ptsSpace(raw: PtsValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function ptsVowel(raw: PtsValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function ptsDigit(raw: PtsValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function ptsLetter(raw: PtsValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function ptsMixed(raw: PtsValue): boolean {
  return ptsDigit(raw) && ptsLetter(raw);
}

export function ptsLower(raw: PtsValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital grade is eight letters or more, written entirely in capitals. */
export function ptsUpper(raw: PtsValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function ptsStamp(raw: PtsValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function ptsCopy(raw: PtsValue): string {
  return codeGiven(raw);
}

export function ptsFamily(raw: PtsValue): string {
  if (ptsState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function ptsLanes(rows: readonly PtsRow[]): PtsLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = ptsLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly PtsRow[]): string {
  const lines = ptsLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly PtsRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = ptsHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly PtsRow[], mail: PtsLane): number {
  return rows.filter((row) => ptsLane(row.code) === mail).length;
}

export function ptsShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly PtsRow[]): string[] {
  return ptsLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: PtsRow, shape: PtsShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return ptsHome(row.code);
  if (shape === "vacant") return ptsAway(row.code);
  if (shape === "hold") return ptsGuest(row.code);
  if (shape === "guest") return ptsCitizen(row.code);
  if (shape === "join") return ptsJoin(row.code);
  if (shape === "route") return ptsRoute(row.code);
  if (shape === "brief") return ptsBrief(row.code);
  if (shape === "long") return ptsLong(row.code);
  if (shape === "stamp") return ptsStampMark(row.code);
  if (shape === "vowel") return ptsVowelLane(row.code);
  if (shape === "plain") return ptsPlain(row.code);
  if (shape === "open") return ptsOpen(row.code);
  if (shape === "soon") return ptsSoon(row.code);
  if (shape === "letter") return ptsLetter(row.code);
  if (shape === "mixed") return ptsMixed(row.code);
  if (shape === "upper") return ptsUpper(row.code);
  if (shape === "lower") return ptsLower(row.code);
  if (shape === "space") return ptsSpace(row.code);
  if (shape === "even") return ptsEven(row.code);
  if (shape === "odd") return ptsOdd(row.code);
  if (shape === "tail") return ptsTail(row.code);
  if (shape === "first") return ptsFirst(row.code);
  if (shape === "held") return ptsHeld(row.code);
  return ptsLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly PtsRow[],
  mail: string,
  hue: string,
  query: string,
  review: PtsReview,
  reviewed: readonly string[],
  shape: PtsShape,
): PtsRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (ptsState(row.code) === "") return false;
    const found = ptsLane(row.code);
    const hueName = ptsHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${ptsStamp(row.code)} ${ptsFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function ptsLanesCsv(rows: readonly PtsRow[]): string {
  const lines = ["lane,count"];
  for (const line of ptsLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function ptsRowsCsv(rows: readonly PtsRow[], reviewed: readonly string[]): string {
  const lines = ["name,potentialStatus,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(ptsCopy(row.code)),
        ptsStamp(row.code),
        csvCell(ptsFamily(row.code)),
        ptsLane(row.code),
        ptsHue(row.code),
        ptsLength(row.code) ?? "",
        ptsHome(row.code) ? "1" : "0",
        ptsAway(row.code) ? "1" : "0",
        ptsGuest(row.code) ? "1" : "0",
        ptsDesk(row.code) ? "1" : "0",
        ptsCitizen(row.code) ? "1" : "0",
        ptsJoin(row.code) ? "1" : "0",
        ptsRoute(row.code) ? "1" : "0",
        ptsBrief(row.code) ? "1" : "0",
        ptsEven(row.code) ? "1" : "0",
        ptsDigit(row.code) ? "1" : "0",
        ptsMixed(row.code) ? "1" : "0",
        ptsUpper(row.code) ? "1" : "0",
        ptsVowel(row.code) ? "1" : "0",
        ptsTail(row.code) ? "1" : "0",
        ptsHeld(row.code) ? "1" : "0",
        ptsSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
