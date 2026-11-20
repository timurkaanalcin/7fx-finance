/**
 * Parachute rules for a shock-protection spring kept in this browser,
 * and campaign plates read campaign already stored on the account.
 * Parts are lyre, stud, spring, and jewel. Finishes are gilt, ivory, and graphite.
 * Gaps are 6, 12, 24, or 48. Spring counts are 2, 4, or 8.
 * Lyre and stud are main. Spring and jewel are side.
 * Organic, direct, live, and house are house campaigns. Google and search sit the desk.
 * Email and newsletter are on hold. Facebook, Meta, and Instagram are social guests.
 * Partner and influencer are joined. Other and NONE stay plain.
 * An ampersand joins two campaigns. A colon that is not a time marks a scoped campaign.
 * A time today is house. Within six days is search. Within eighteen days is mail. Older is a guest.
 * A brief mark is exactly six characters. A digit mark starts with a digit and is not a time.
 * A long mark is twenty characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words brand and house are house campaigns. Paused or former is closed.
 * A true campaign reads as LIVE. A false campaign reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved campaign.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_parachute (
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
 * CREATE TABLE crm_cgn_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_cgn_review (
 *   trader_id text primary key
 * );
 */


export const PCH_KEY = "crmv4-parachute-362";
export const PCH_VIEW_KEY = "crmv4-parachute-views";
export const PCH_DENSITY_KEY = "crmv4-parachute-density";
export const PCH_MODES = ["lyre", "stud", "spring", "jewel"] as const;

export type ParachuteMode = (typeof PCH_MODES)[number];
export type ParachuteFilm = "blank" | "gilt" | "ivory" | "graphite";
export type ParachuteTray = "board" | "peg" | "coffer";
export type ParachuteDensity = "airy" | "close";
export type ParachuteSort = "piece" | "setter";

export type Parachute = {
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

export type ParachuteView = {
  id: string;
  name: string;
  tray: ParachuteTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type ParachuteCounts = {
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

export const ROUND362_FEATURES = [
  "parachute-save",
  "shock-reminders",
  "parachute-modes",
  "parachute-search",
  "parachute-pin-sla",
  "shock-archive",
  "parachute-latch-star",
  "parachute-inline-title",
  "parachute-filters",
  "saved-parachute-views",
  "parachute-density",
  "shock-focus",
  "parachute-kpis",
  "shock-chart",
  "shock-timeline",
  "parachute-bulk",
  "parachute-csv",
  "parachute-keys",
  "parachute-audit",
  "fair-springer",
  "parachute-viewer",
  "suggest-shock",
  "overdue-shock",
  "campaign-plate",
  "campaign-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [6, 12, 24, 48] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["lyre", "stud"]);
const OUTER = new Set(["spring", "jewel"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ParachuteTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<ParachuteFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<ParachuteFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[sj]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Parachute, tray: ParachuteTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return PCH_MODES.indexOf(piece as ParachuteMode);
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

export function parachuteMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (PCH_MODES as readonly string[]).includes(text) ? text : "";
}

/** A gap is 6, 12, 24, or 48. Anything else stays blank. */
export function parachuteHour(raw: unknown): 6 | 12 | 24 | 48 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "12" && text !== "24" && text !== "48") return null;
  return Number(text) as 6 | 12 | 24 | 48;
}

/** A spring count is 2, 4, or 8. Anything else stays blank. */
export function parachuteHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function parachuteFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function parachuteInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function parachuteOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Cannon is the barrel. Minute is the pinion. Hour is the hand. Date is the window. */
export function parachuteBand(piece: unknown): string {
  const text = parachuteMode(piece);
  if (!text) return "";
  if (text === "lyre") return "bow";
  if (text === "stud") return "post";
  if (text === "spring") return "coil";
  return "seat";
}

/** Signed distance from one mode to another along the stripe. */
export function parachuteGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(parachuteMode(from));
  const right = pieceIndex(parachuteMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(parachuteFilm(film));
}

/** A pair wheel is 3. One and six are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return parachuteHammer(lock) === 4;
}

/** A full wheel is 6. */
export function fullHammer(lock: unknown): boolean {
  return parachuteHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return parachuteMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = parachuteHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = parachuteFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = parachuteHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveParachuteFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Parachute[]): string {
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

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest fifteen. Later, suggest thirty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Parachute[], hour: number): 6 | 12 | 24 | 48 {
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
  if (hour < 8) return 6;
  if (hour < 14) return 12;
  if (hour < 20) return 24;
  return 48;
}

export function suggestMode(hour: number): ParachuteMode {
  return hour < 8 ? "lyre" : "jewel";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Parachute[], roster: string): string {
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

export function readParachutes(raw: unknown): Parachute[] {
  if (!Array.isArray(raw)) return [];
  const out: Parachute[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Parachute>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: parachuteMode(row.piece),
      drop: parachuteHour(row.drop),
      film: parachuteFilm(row.film),
      lock: parachuteHammer(row.lock) ?? 2,
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

export function addParachute(
  cards: readonly Parachute[],
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
): Parachute[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readParachutes([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: parachuteMode(card.piece),
      drop: parachuteHour(card.drop),
      film: parachuteFilm(card.film),
      lock: parachuteHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Parachute[], id: string, edit: (card: Parachute) => Parachute): Parachute[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editParachute(cards: readonly Parachute[], id: string, title: string): Parachute[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editParachuteNote(cards: readonly Parachute[], id: string, note: string): Parachute[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(parachuteFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setParachuteFilm(cards: readonly Parachute[], id: string, film: string): Parachute[] {
  const next = parachuteFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setParachuteRaised(cards: readonly Parachute[], id: string, raised: boolean): Parachute[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setParachutePin(cards: readonly Parachute[], id: string, pinned: boolean): Parachute[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setParachuteCoffer(cards: readonly Parachute[], id: string, coffered: boolean): Parachute[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setParachuteStar(cards: readonly Parachute[], id: string, starred: boolean): Parachute[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addParachuteTag(cards: readonly Parachute[], id: string, tag: string): Parachute[] {
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

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setParachuteFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinParachuteFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return setParachutePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starParachuteFocused(cards: readonly Parachute[], id: string): Parachute[] {
  return setParachuteStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Parachute[], id: string): Parachute[] {
  const card = cards.find((item) => item.id === id);
  return card ? setParachuteFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Parachute[], ids: readonly string[], edit: (card: Parachute) => Parachute): Parachute[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkParachuteGraphite(cards: readonly Parachute[], ids: readonly string[]): Parachute[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkParachuteRaise(cards: readonly Parachute[], ids: readonly string[]): Parachute[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkParachuteCoffer(cards: readonly Parachute[], ids: readonly string[]): Parachute[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkParachuteTag(cards: readonly Parachute[], ids: readonly string[]): Parachute[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readParachuteViews(raw: unknown): ParachuteView[] {
  if (!Array.isArray(raw)) return [];
  const out: ParachuteView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ParachuteView>;
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

export function addParachuteView(views: readonly ParachuteView[], view: ParachuteView): ParachuteView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readParachuteViews([...views, { ...view, id, name }]);
}

export function dropParachuteView(views: readonly ParachuteView[], id: string): ParachuteView[] {
  return views.filter((view) => view.id !== id);
}

export function parachuteDensity(raw: unknown): ParachuteDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortParachutes(cards: readonly Parachute[], sort: ParachuteSort): Parachute[] {
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

export function visibleParachutes(
  cards: readonly Parachute[],
  tray: ParachuteTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Parachute[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : parachuteFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !parachuteInner(card.piece)) return false;
    if (wantLimb === "outer" && !parachuteOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** A side part on count two, still not raised and not in the drawer, is overdue. */
export function overdueParachute(card: Parachute): boolean {
  return parachuteOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}

/** No finish, gap six, spring two, and still on the bench. */
export function idleParachute(card: Parachute): boolean {
  return !card.film && card.drop === 6 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}

/** Gilt, gap forty-eight, and a full spring, still out of the drawer. */
export function briskParachute(card: Parachute): boolean {
  return card.film === "GILT" && card.drop === 48 && card.lock === 8 && !card.coffered;
}

/** Jewel, ivory, and gap twelve. */
export function restingParachute(card: Parachute): boolean {
  return card.piece === "jewel" && card.film === "IVORY" && card.drop === 12;
}

/** A lyre is late when the station is already on the jewel. */
export function lateParachute(card: Parachute, station: string): boolean {
  return card.piece === "lyre" && parachuteMode(station) === "jewel" && !card.raised;
}

export function parachuteCounts(cards: readonly Parachute[], shown: readonly Parachute[], station: string): ParachuteCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => parachuteInner(card.piece)).length,
    outer: cards.filter((card) => parachuteOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 48).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleParachute).length,
    brisk: cards.filter(briskParachute).length,
    resting: cards.filter(restingParachute).length,
    overdue: cards.filter(overdueParachute).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateParachute(card, station)).length,
  };
}

export function parachuteBars(cards: readonly Parachute[]): { piece: string; count: number }[] {
  return PCH_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function parachuteTimeline(cards: readonly Parachute[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function parachuteKeepers(cards: readonly Parachute[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Parachute[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of parachuteKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderParachutes(cards: readonly Parachute[]): string[] {
  return cards.filter(overdueParachute).map((card) => card.title);
}

export function parachuteCopy(card: Parachute): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function parachuteCsv(cards: readonly Parachute[], station: string): string {
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
        parachuteOuter(card.piece) ? "1" : "0",
        lateParachute(card, station) ? "1" : "0",
        idleParachute(card) ? "1" : "0",
        briskParachute(card) ? "1" : "0",
        restingParachute(card) ? "1" : "0",
        overdueParachute(card) ? "1" : "0",
        parachuteInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        parachuteBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const CGN_KEY = "crmv4-cgn-hide";
export const CGN_REVIEW_KEY = "crmv4-cgn-review";

export type CgnLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type CgnHue = "" | "ivory" | "graphite" | "champagne";
export type CgnState = "" | "clear" | "set";
export type CgnReview = "all" | "reviewed" | "fresh";
export type CgnShape =
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

export type CgnValue = string | { campaign?: unknown; [key: string]: unknown } | null | undefined;
export type CgnRow = { id: string; label: string; code: CgnValue };
export type CgnLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: CgnValue): { campaign?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: CgnValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: CgnValue): string {
  const row = codeRecord(raw);
  if (row && !("campaign" in row)) return "";
  const value = row ? row.campaign : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: CgnValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("campaign" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function cgnState(raw: CgnValue): CgnState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["ORGANIC", "DIRECT", "LIVE", "HOUSE"]);
const DESK_TITLES = new Set(["GOOGLE", "SEARCH", "GOOGLE_SEARCH"]);
const HOLD_TITLES = new Set(["EMAIL", "NEWSLETTER"]);
const GUEST_TITLES = new Set(["FACEBOOK", "META", "INSTAGRAM"]);
const JOIN_TITLES = new Set(["PARTNER", "INFLUENCER"]);
const PLAIN_TITLES = new Set(["OTHER", "NONE"]);

/** A known campaign maps first. An ampersand joins two campaigns. A colon that is not a time marks a scoped campaign. A time today is house. Within six days is search. Within eighteen days is mail. Older is a guest. Paused or former is closed. A brief mark is exactly six characters. A digit mark starts with a digit and is not a time. A long mark is twenty characters or longer. A vowel mark starts with a vowel. The words brand and house are house campaigns. */
export function cgnLane(raw: CgnValue, now = Date.now()): CgnLane {
  if (cgnState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/former|paused/i.test(text)) return "vacant";
  if (/\bbrand\b|\bhouse\b/i.test(text)) return "hall";
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
    if (age < 6 * day) return "desk";
    if (age < 18 * day) return "hold";
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

export function cgnHue(raw: CgnValue, now = Date.now()): CgnHue {
  const mail = cgnLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "hold") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "join" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function cgnHome(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "hall";
}

export function cgnAway(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "vacant";
}

export function cgnGuest(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "hold";
}

export function cgnCitizen(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "guest";
}

export function cgnDesk(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "desk";
}

export function cgnJoin(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "join";
}

export function cgnRoute(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "route";
}

export function cgnBrief(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "brief";
}

export function cgnLong(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "long";
}

export function cgnStampMark(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "stamp";
}

export function cgnVowelLane(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "vowel";
}

export function cgnPlain(raw: CgnValue, now = Date.now()): boolean {
  return cgnLane(raw, now) === "plain";
}

export function cgnOpen(raw: CgnValue): boolean {
  return cgnState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function cgnHeld(raw: CgnValue): boolean {
  const mail = cgnLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function cgnSoon(raw: CgnValue, now = Date.now()): boolean {
  if (cgnState(raw) !== "set") return false;
  if (cgnBrief(raw, now)) return true;
  if (cgnHome(raw, now) || cgnAway(raw, now) || cgnGuest(raw, now) || cgnCitizen(raw, now)) return false;
  return codeGiven(raw).length === 8;
}

export function cgnLength(raw: CgnValue): number | null {
  if (cgnState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function cgnEven(raw: CgnValue): boolean {
  const length = cgnLength(raw);
  return length !== null && length % 2 === 0;
}

export function cgnOdd(raw: CgnValue): boolean {
  const length = cgnLength(raw);
  return length !== null && length % 2 === 1;
}

export function cgnFirst(raw: CgnValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function cgnTail(raw: CgnValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function cgnCapital(raw: CgnValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function cgnSpace(raw: CgnValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function cgnVowel(raw: CgnValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function cgnDigit(raw: CgnValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function cgnLetter(raw: CgnValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function cgnMixed(raw: CgnValue): boolean {
  return cgnDigit(raw) && cgnLetter(raw);
}

export function cgnLower(raw: CgnValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function cgnUpper(raw: CgnValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function cgnStamp(raw: CgnValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function cgnCopy(raw: CgnValue): string {
  return codeGiven(raw);
}

export function cgnFamily(raw: CgnValue): string {
  if (cgnState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function cgnLanes(rows: readonly CgnRow[]): CgnLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = cgnLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly CgnRow[]): string {
  const lines = cgnLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly CgnRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = cgnHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly CgnRow[], mail: CgnLane): number {
  return rows.filter((row) => cgnLane(row.code) === mail).length;
}

export function cgnShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly CgnRow[]): string[] {
  return cgnLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: CgnRow, shape: CgnShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return cgnHome(row.code);
  if (shape === "vacant") return cgnAway(row.code);
  if (shape === "hold") return cgnGuest(row.code);
  if (shape === "guest") return cgnCitizen(row.code);
  if (shape === "join") return cgnJoin(row.code);
  if (shape === "route") return cgnRoute(row.code);
  if (shape === "brief") return cgnBrief(row.code);
  if (shape === "long") return cgnLong(row.code);
  if (shape === "stamp") return cgnStampMark(row.code);
  if (shape === "vowel") return cgnVowelLane(row.code);
  if (shape === "plain") return cgnPlain(row.code);
  if (shape === "open") return cgnOpen(row.code);
  if (shape === "soon") return cgnSoon(row.code);
  if (shape === "letter") return cgnLetter(row.code);
  if (shape === "mixed") return cgnMixed(row.code);
  if (shape === "upper") return cgnUpper(row.code);
  if (shape === "lower") return cgnLower(row.code);
  if (shape === "space") return cgnSpace(row.code);
  if (shape === "even") return cgnEven(row.code);
  if (shape === "odd") return cgnOdd(row.code);
  if (shape === "tail") return cgnTail(row.code);
  if (shape === "first") return cgnFirst(row.code);
  if (shape === "held") return cgnHeld(row.code);
  return cgnLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly CgnRow[],
  mail: string,
  hue: string,
  query: string,
  review: CgnReview,
  reviewed: readonly string[],
  shape: CgnShape,
): CgnRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (cgnState(row.code) === "") return false;
    const found = cgnLane(row.code);
    const hueName = cgnHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${cgnStamp(row.code)} ${cgnFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function cgnLanesCsv(rows: readonly CgnRow[]): string {
  const lines = ["lane,count"];
  for (const line of cgnLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function cgnRowsCsv(rows: readonly CgnRow[], reviewed: readonly string[]): string {
  const lines = ["name,campaign,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(cgnCopy(row.code)),
        cgnStamp(row.code),
        csvCell(cgnFamily(row.code)),
        cgnLane(row.code),
        cgnHue(row.code),
        cgnLength(row.code) ?? "",
        cgnHome(row.code) ? "1" : "0",
        cgnAway(row.code) ? "1" : "0",
        cgnGuest(row.code) ? "1" : "0",
        cgnDesk(row.code) ? "1" : "0",
        cgnCitizen(row.code) ? "1" : "0",
        cgnJoin(row.code) ? "1" : "0",
        cgnRoute(row.code) ? "1" : "0",
        cgnBrief(row.code) ? "1" : "0",
        cgnEven(row.code) ? "1" : "0",
        cgnDigit(row.code) ? "1" : "0",
        cgnMixed(row.code) ? "1" : "0",
        cgnUpper(row.code) ? "1" : "0",
        cgnVowel(row.code) ? "1" : "0",
        cgnTail(row.code) ? "1" : "0",
        cgnHeld(row.code) ? "1" : "0",
        cgnSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
