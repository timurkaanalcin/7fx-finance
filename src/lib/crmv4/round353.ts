/**
 * Fusee rules for a conical equalizer kept in this browser,
 * and broker plates read brokerName already stored on the account.
 * Modes are cone, chain, snail, and stop. Finishes are gilt, ivory, and graphite.
 * Steps are 4, 8, 16, or 32. Studs are 2, 4, or 8.
 * Cone and chain are main. Snail and stop are side.
 * A known broker name is SAX, ICM, FXC, or ADX, including SAXO, FXCM, and ADMIRAL.
 * An ampersand joins two names. A bar marks a route.
 * A brief name is exactly four characters. A stamp starts with a digit.
 * A long name is sixteen characters or longer and does not start with a digit. A vowel name starts with a vowel.
 * A true name reads as SAX. A false name reads as OPEN. The plate does not change the saved broker name.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_fusee (
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
 * CREATE TABLE crm_hbk_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_hbk_review (
 *   trader_id text primary key
 * );
 */


export const FUS_KEY = "crmv4-fusee";
export const FUS_VIEW_KEY = "crmv4-fusee-views";
export const FUS_DENSITY_KEY = "crmv4-fusee-density";
export const FUS_MODES = ["cone", "chain", "snail", "stop"] as const;

export type FuseeMode = (typeof FUS_MODES)[number];
export type FuseeFilm = "blank" | "gilt" | "ivory" | "graphite";
export type FuseeTray = "board" | "peg" | "coffer";
export type FuseeDensity = "airy" | "close";
export type FuseeSort = "piece" | "setter";

export type Fusee = {
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

export type FuseeView = {
  id: string;
  name: string;
  tray: FuseeTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type FuseeCounts = {
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

export const ROUND353_FEATURES = [
  "fusee-save",
  "cone-reminders",
  "fusee-modes",
  "fusee-search",
  "fusee-pin-sla",
  "cone-archive",
  "fusee-latch-star",
  "fusee-inline-title",
  "fusee-filters",
  "saved-fusee-views",
  "fusee-density",
  "cone-focus",
  "fusee-kpis",
  "cone-chart",
  "cone-timeline",
  "fusee-bulk",
  "fusee-csv",
  "fusee-keys",
  "fusee-audit",
  "fair-warden",
  "fusee-viewer",
  "suggest-cone",
  "overdue-cones",
  "broker-plate",
  "broker-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 16, 32] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["cone", "chain"]);
const OUTER = new Set(["snail", "stop"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const BROKER_ALIAS: Record<string, "SAX" | "ICM" | "FXC" | "ADX"> = {
  SAX: "SAX",
  SAXO: "SAX",
  BROKER_SAX: "SAX",
  ICM: "ICM",
  BROKER_ICM: "ICM",
  FXC: "FXC",
  FXCM: "FXC",
  BROKER_FXC: "FXC",
  ADX: "ADX",
  ADMIRAL: "ADX",
  BROKER_ADX: "ADX",
};
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): FuseeTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<FuseeFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<FuseeFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cn]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Fusee, tray: FuseeTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return FUS_MODES.indexOf(piece as FuseeMode);
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

export function fuseeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (FUS_MODES as readonly string[]).includes(text) ? text : "";
}

/** A drop is 3, 9, 18, or 27. Anything else stays blank. */
/** An hour is 3, 6, 9, or 12. Anything else stays blank. */
export function fuseeHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A lock is 3, 6, or 9. Anything else stays blank. */
/** A hammer is 2, 3, or 5. Anything else stays blank. */
export function fuseeHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function fuseeFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function fuseeInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function fuseeOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Hoop is the tooth. Spoke is the fan. Pivot is the arc. Jewel is the stone. */
export function fuseeBand(piece: unknown): string {
  const text = fuseeMode(piece);
  if (!text) return "";
  if (text === "cone") return "taper";
  if (text === "chain") return "link";
  if (text === "snail") return "cam";
  return "hook";
}

/** Signed distance from one piece to another along the oscillator. */
export function fuseeGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(fuseeMode(from));
  const right = pieceIndex(fuseeMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(fuseeFilm(film));
}

/** A pair lock is 6. Two and ten are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return fuseeHammer(lock) === 4;
}

/** A full lock is 10. */
export function fullHammer(lock: unknown): boolean {
  return fuseeHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return fuseeMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = fuseeHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = fuseeFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = fuseeHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveFuseeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Fusee[]): string {
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
export function suggestHour(cards: readonly Fusee[], hour: number): 4 | 8 | 16 | 32 {
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

export function suggestMode(hour: number): FuseeMode {
  return hour < 8 ? "cone" : "stop";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Fusee[], roster: string): string {
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

export function readFusees(raw: unknown): Fusee[] {
  if (!Array.isArray(raw)) return [];
  const out: Fusee[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Fusee>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: fuseeMode(row.piece),
      drop: fuseeHour(row.drop),
      film: fuseeFilm(row.film),
      lock: fuseeHammer(row.lock) ?? 2,
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

export function addFusee(
  cards: readonly Fusee[],
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
): Fusee[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFusees([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: fuseeMode(card.piece),
      drop: fuseeHour(card.drop),
      film: fuseeFilm(card.film),
      lock: fuseeHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Fusee[], id: string, edit: (card: Fusee) => Fusee): Fusee[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFusee(cards: readonly Fusee[], id: string, title: string): Fusee[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFuseeNote(cards: readonly Fusee[], id: string, note: string): Fusee[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(fuseeFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setFuseeFilm(cards: readonly Fusee[], id: string, film: string): Fusee[] {
  const next = fuseeFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setFuseeRaised(cards: readonly Fusee[], id: string, raised: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setFuseePin(cards: readonly Fusee[], id: string, pinned: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setFuseeCoffer(cards: readonly Fusee[], id: string, coffered: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setFuseeStar(cards: readonly Fusee[], id: string, starred: boolean): Fusee[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addFuseeTag(cards: readonly Fusee[], id: string, tag: string): Fusee[] {
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

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return setFuseePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starFuseeFocused(cards: readonly Fusee[], id: string): Fusee[] {
  return setFuseeStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Fusee[], id: string): Fusee[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFuseeFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Fusee[], ids: readonly string[], edit: (card: Fusee) => Fusee): Fusee[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFuseeGraphite(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkFuseeRaise(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkFuseeCoffer(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkFuseeTag(cards: readonly Fusee[], ids: readonly string[]): Fusee[] {
  return bulk(cards, ids, (card) => (card.tags.includes("z") ? card : { ...card, tags: tagsOf([...card.tags, "n"]), audit: "tag" }));
}

export function readFuseeViews(raw: unknown): FuseeView[] {
  if (!Array.isArray(raw)) return [];
  const out: FuseeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FuseeView>;
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

export function addFuseeView(views: readonly FuseeView[], view: FuseeView): FuseeView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFuseeViews([...views, { ...view, id, name }]);
}

export function dropFuseeView(views: readonly FuseeView[], id: string): FuseeView[] {
  return views.filter((view) => view.id !== id);
}

export function fuseeDensity(raw: unknown): FuseeDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortFusees(cards: readonly Fusee[], sort: FuseeSort): Fusee[] {
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

export function visibleFusees(
  cards: readonly Fusee[],
  tray: FuseeTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Fusee[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : fuseeFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !fuseeInner(card.piece)) return false;
    if (wantLimb === "outer" && !fuseeOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An outer piece on lock two, still unpoised and not in the coffer, is overdue. */
export function overdueFusee(card: Fusee): boolean {
  return fuseeOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No film, the short drop, lock two, and still on the board. */
export function idleFusee(card: Fusee): boolean {
  return !card.film && card.drop === 4 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, the tall turn, and a full hand, still out of the vault. */
export function briskFusee(card: Fusee): boolean {
  return card.film === "GILT" && card.drop === 32 && card.lock === 8 && !card.coffered;
}

/** Curb, ivory, and drop five. */
export function restingFusee(card: Fusee): boolean {
  return card.piece === "stop" && card.film === "IVORY" && card.drop === 8;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateFusee(card: Fusee, station: string): boolean {
  return card.piece === "cone" && fuseeMode(station) === "stop" && !card.raised;
}

export function fuseeCounts(cards: readonly Fusee[], shown: readonly Fusee[], station: string): FuseeCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => fuseeInner(card.piece)).length,
    outer: cards.filter((card) => fuseeOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleFusee).length,
    brisk: cards.filter(briskFusee).length,
    resting: cards.filter(restingFusee).length,
    overdue: cards.filter(overdueFusee).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateFusee(card, station)).length,
  };
}

export function fuseeBars(cards: readonly Fusee[]): { piece: string; count: number }[] {
  return FUS_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function fuseeTimeline(cards: readonly Fusee[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function fuseeKeepers(cards: readonly Fusee[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Fusee[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of fuseeKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFusees(cards: readonly Fusee[]): string[] {
  return cards.filter(overdueFusee).map((card) => card.title);
}

export function fuseeCopy(card: Fusee): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function fuseeCsv(cards: readonly Fusee[], station: string): string {
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
        fuseeOuter(card.piece) ? "1" : "0",
        lateFusee(card, station) ? "1" : "0",
        idleFusee(card) ? "1" : "0",
        briskFusee(card) ? "1" : "0",
        restingFusee(card) ? "1" : "0",
        overdueFusee(card) ? "1" : "0",
        fuseeInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        fuseeBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const HBK_KEY = "crmv4-hbk-hide";
export const HBK_REVIEW_KEY = "crmv4-hbk-review";

export type BrkLane = "" | "home" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type BrkHue = "" | "ivory" | "graphite" | "champagne";
export type BrkState = "" | "clear" | "set";
export type BrkReview = "all" | "reviewed" | "fresh";
export type BrkShape =
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

export type BrkValue = string | { brokerName?: unknown; [key: string]: unknown } | null | undefined;
export type BrkRow = { id: string; label: string; code: BrkValue };
export type BrkLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["home", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: BrkValue): { brokerName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: BrkValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: BrkValue): string {
  const row = codeRecord(raw);
  if (row && !("brokerName" in row)) return "";
  const value = row ? row.brokerName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "SAX";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return clip(value, 48);
}

function codeReadable(raw: BrkValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("brokerName" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function hbkState(raw: BrkValue): BrkState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known country code is TR, DE, RU, or AE, including TUR, GER, RUS, and UAE. A plus joins two codes. A slash marks a route. A brief code is exactly three characters. A stamp starts with a digit. A long code is twelve characters or longer and does not start with a digit. A vowel code starts with a vowel. */
export function hbkLane(raw: BrkValue): BrkLane {
  if (hbkState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  const canon = BROKER_ALIAS[upper];
  if (canon === "SAX") return "home";
  if (canon === "ICM") return "desk";
  if (canon === "FXC") return "hold";
  if (canon === "ADX") return "guest";
  if (text === "NONE") return "plain";
  if (upper === "OPEN") return "vacant";
  if (text.includes("&")) return "join";
  if (text.includes("|")) return "route";
  if (text.length === 4) return "brief";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length >= 16) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function hbkHue(raw: BrkValue): BrkHue {
  const mail = hbkLane(raw);
  if (!mail) return "";
  if (mail === "home" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function hbkHome(raw: BrkValue): boolean {
  return hbkLane(raw) === "home";
}

export function hbkAway(raw: BrkValue): boolean {
  return hbkLane(raw) === "vacant";
}

export function hbkGuest(raw: BrkValue): boolean {
  return hbkLane(raw) === "hold";
}

export function hbkCitizen(raw: BrkValue): boolean {
  return hbkLane(raw) === "guest";
}

export function hbkDesk(raw: BrkValue): boolean {
  return hbkLane(raw) === "desk";
}

export function hbkJoin(raw: BrkValue): boolean {
  return hbkLane(raw) === "join";
}

export function hbkRoute(raw: BrkValue): boolean {
  return hbkLane(raw) === "route";
}

export function hbkBrief(raw: BrkValue): boolean {
  return hbkLane(raw) === "brief";
}

export function hbkLong(raw: BrkValue): boolean {
  return hbkLane(raw) === "long";
}

export function hbkStampMark(raw: BrkValue): boolean {
  return hbkLane(raw) === "stamp";
}

export function hbkVowelLane(raw: BrkValue): boolean {
  return hbkLane(raw) === "vowel";
}

export function hbkPlain(raw: BrkValue): boolean {
  return hbkLane(raw) === "plain";
}

export function hbkOpen(raw: BrkValue): boolean {
  return hbkState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function hbkHeld(raw: BrkValue): boolean {
  const mail = hbkLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function hbkSoon(raw: BrkValue): boolean {
  if (hbkState(raw) !== "set") return false;
  if (hbkBrief(raw)) return true;
  if (hbkHome(raw) || hbkAway(raw) || hbkGuest(raw) || hbkCitizen(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function hbkLength(raw: BrkValue): number | null {
  if (hbkState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function hbkEven(raw: BrkValue): boolean {
  const length = hbkLength(raw);
  return length !== null && length % 2 === 0;
}

export function hbkOdd(raw: BrkValue): boolean {
  const length = hbkLength(raw);
  return length !== null && length % 2 === 1;
}

export function hbkFirst(raw: BrkValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function hbkTail(raw: BrkValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function hbkCapital(raw: BrkValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function hbkSpace(raw: BrkValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function hbkVowel(raw: BrkValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function hbkDigit(raw: BrkValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function hbkLetter(raw: BrkValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function hbkMixed(raw: BrkValue): boolean {
  return hbkDigit(raw) && hbkLetter(raw);
}

export function hbkLower(raw: BrkValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function hbkUpper(raw: BrkValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function hbkStamp(raw: BrkValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function hbkCopy(raw: BrkValue): string {
  return codeGiven(raw);
}

export function hbkFamily(raw: BrkValue): string {
  if (hbkState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function hbkLanes(rows: readonly BrkRow[]): BrkLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = hbkLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingBrk(rows: readonly BrkRow[]): string {
  const lines = hbkLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingBrkHue(rows: readonly BrkRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = hbkHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneBrkCount(rows: readonly BrkRow[], mail: BrkLane): number {
  return rows.filter((row) => hbkLane(row.code) === mail).length;
}

export function hbkShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentBrkLanes(rows: readonly BrkRow[]): string[] {
  return hbkLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenBrk(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedBrk(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleBrk(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleBrkReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkBrkReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleBrkLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: BrkRow, shape: BrkShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return hbkHome(row.code);
  if (shape === "vacant") return hbkAway(row.code);
  if (shape === "hold") return hbkGuest(row.code);
  if (shape === "guest") return hbkCitizen(row.code);
  if (shape === "join") return hbkJoin(row.code);
  if (shape === "route") return hbkRoute(row.code);
  if (shape === "brief") return hbkBrief(row.code);
  if (shape === "long") return hbkLong(row.code);
  if (shape === "stamp") return hbkStampMark(row.code);
  if (shape === "vowel") return hbkVowelLane(row.code);
  if (shape === "plain") return hbkPlain(row.code);
  if (shape === "open") return hbkOpen(row.code);
  if (shape === "soon") return hbkSoon(row.code);
  if (shape === "letter") return hbkLetter(row.code);
  if (shape === "mixed") return hbkMixed(row.code);
  if (shape === "upper") return hbkUpper(row.code);
  if (shape === "lower") return hbkLower(row.code);
  if (shape === "space") return hbkSpace(row.code);
  if (shape === "even") return hbkEven(row.code);
  if (shape === "odd") return hbkOdd(row.code);
  if (shape === "tail") return hbkTail(row.code);
  if (shape === "first") return hbkFirst(row.code);
  if (shape === "held") return hbkHeld(row.code);
  return hbkLane(row.code) === shape;
}

export function visibleBrk(
  rows: readonly BrkRow[],
  mail: string,
  hue: string,
  query: string,
  review: BrkReview,
  reviewed: readonly string[],
  shape: BrkShape,
): BrkRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (hbkState(row.code) === "") return false;
    const found = hbkLane(row.code);
    const hueName = hbkHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${hbkStamp(row.code)} ${hbkFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function hbkLanesCsv(rows: readonly BrkRow[]): string {
  const lines = ["lane,count"];
  for (const line of hbkLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function hbkRowsCsv(rows: readonly BrkRow[], reviewed: readonly string[]): string {
  const lines = ["name,brokerName,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(hbkCopy(row.code)),
        hbkStamp(row.code),
        csvCell(hbkFamily(row.code)),
        hbkLane(row.code),
        hbkHue(row.code),
        hbkLength(row.code) ?? "",
        hbkHome(row.code) ? "1" : "0",
        hbkAway(row.code) ? "1" : "0",
        hbkGuest(row.code) ? "1" : "0",
        hbkDesk(row.code) ? "1" : "0",
        hbkCitizen(row.code) ? "1" : "0",
        hbkJoin(row.code) ? "1" : "0",
        hbkRoute(row.code) ? "1" : "0",
        hbkBrief(row.code) ? "1" : "0",
        hbkEven(row.code) ? "1" : "0",
        hbkDigit(row.code) ? "1" : "0",
        hbkMixed(row.code) ? "1" : "0",
        hbkUpper(row.code) ? "1" : "0",
        hbkVowel(row.code) ? "1" : "0",
        hbkTail(row.code) ? "1" : "0",
        hbkHeld(row.code) ? "1" : "0",
        hbkSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
