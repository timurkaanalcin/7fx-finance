/**
 * Basse-taille pit rules for an engraved enamel pit kept in this browser,
 * and sale stage plates read the sale status already stored on the account.
 * Pits are bed, ground, lip, and crest. Glazes are glaze, ivory, and graphite.
 * Heats are 2, 5, 10, or 20. Counts are 2, 4, or 8.
 * Bed and ground are the field. Lip and crest are the fence.
 * Hot, won, sale, house, live, and YES are leading. Call, mail, open, and pipe sit the desk.
 * New, wait, hold, and queue wait. Lost, cold, void, and dead are returned.
 * Twin and pair are joined. None, no, and blank stay plain.
 * An ampersand joins two stages. A slash that is not a time marks a scoped stage.
 * A time today is leading. Within two days is the desk. Within eight days waits. Older is returned.
 * A brief stage is exactly five characters. A digit stage starts with a digit and is not a time.
 * A long stage is eleven characters or longer and does not start with a digit. A vowel stage starts with a vowel.
 * The words clear and file are leading. Quiet or closed is shut.
 * A true stage reads as CLEAR. A false stage reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved stage.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_basse_taille (
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
 * CREATE TABLE crm_ssp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_ssp_review (
 *   trader_id text primary key
 * );
 */

export const BTL_KEY = "crmv4-basse-371";
export const BTL_VIEW_KEY = "crmv4-basse-views-371";
export const BTL_DENSITY_KEY = "crmv4-basse-density-371";
export const BTL_MODES = ["bed", "ground", "lip", "crest"] as const;

export type BasseMode = (typeof BTL_MODES)[number];
export type BasseFilm = "blank" | "glaze" | "ivory" | "graphite";
export type BasseTray = "board" | "peg" | "coffer";
export type BasseDensity = "airy" | "close";
export type BasseSort = "piece" | "setter";

export type Basse = {
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

export type BasseView = {
  id: string;
  name: string;
  tray: BasseTray;
  query: string;
  setter: string;
  film: string;
  piece: string;
  drop: string;
  lock: string;
};

export type BasseCounts = {
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

export const ROUND371_FEATURES = [
  "basse-save",
  "pit-reminders",
  "basse-modes",
  "basse-search",
  "pit-heat-sla",
  "pit-archive",
  "basse-count-star",
  "basse-inline-title",
  "basse-filters",
  "saved-basse-views",
  "basse-density",
  "pit-focus",
  "basse-kpis",
  "pit-chart",
  "pit-timeline",
  "basse-bulk",
  "basse-csv",
  "basse-keys",
  "basse-audit",
  "fair-engraver",
  "basse-viewer",
  "suggest-bed",
  "overdue-lip",
  "sale-stage-plate",
  "sale-stage-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "lock", "drop", "lower", "star"] as const;
const FILMS = ["glaze", "ivory", "graphite"] as const;
const DROP_CYCLE = [2, 5, 10, 20] as const;
const LOCK_CYCLE = [2, 4, 8] as const;
const INNER = new Set(["bed", "ground"]);
const OUTER = new Set(["lip", "crest"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BasseTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<BasseFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<BasseFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[bt]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Basse, tray: BasseTray): boolean {
  if (tray === "peg") return card.pinned && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pinned && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pieceIndex(piece: string): number {
  return BTL_MODES.indexOf(piece as BasseMode);
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

export function basseMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (BTL_MODES as readonly string[]).includes(text) ? text : "";
}

/** A pitch is 5, 10, 20, or 40. Anything else stays blank. */
export function basseHour(raw: unknown): 2 | 5 | 10 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "10" && text !== "20") return null;
  return Number(text) as 2 | 5 | 10 | 20;
}

/** A weave count is 4, 7, or 11. Anything else stays blank. */
export function basseHammer(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function basseFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function basseInner(piece: unknown): boolean {
  return INNER.has(clip(piece, 12).toLowerCase());
}

export function basseOuter(piece: unknown): boolean {
  return OUTER.has(clip(piece, 12).toLowerCase());
}

/** Warp is the reed. Weft is the shuttle. Selvage is the edge. Fringe is the tassel. */
export function basseBand(piece: unknown): string {
  const text = basseMode(piece);
  if (!text) return "";
  if (text === "bed") return "basin";
  if (text === "ground") return "meadow";
  if (text === "lip") return "edge";
  return "crown";
}

/** Signed distance from one mode to another along the stripe. */
export function basseGap(from: unknown, to: unknown): number | null {
  const left = pieceIndex(basseMode(from));
  const right = pieceIndex(basseMode(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(basseFilm(film));
}

/** A pair count is 7. Four and eleven are not a pair. */
export function pairHammer(lock: unknown): boolean {
  return basseHammer(lock) === 4;
}

/** A full count is 11. */
export function fullHammer(lock: unknown): boolean {
  return basseHammer(lock) === 8;
}

export function activeMode(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return basseMode(text) || "all";
}

export function activeHour(raw: unknown): string {
  const drop = basseHour(raw);
  return drop === null ? "all" : String(drop);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = basseFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHammer(raw: unknown): string {
  const lock = basseHammer(raw);
  return lock === null ? "all" : String(lock);
}

export function moveBasseFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Basse[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["IVORY", "GLAZE", "GRAPHITE"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest five. Before twelve, suggest ten. Before eighteen, suggest twenty. Later, suggest forty. A saved pitch on the bench wins, and a tie keeps the shorter pitch. */
export function suggestHour(cards: readonly Basse[], hour: number): 2 | 5 | 10 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 10 | 20 = 2;
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
  if (hour < 2) return 2;
  if (hour < 5) return 5;
  if (hour < 10) return 10;
  return 20;
}

export function suggestMode(hour: number): BasseMode {
  return hour < 10 ? "bed" : "crest";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Basse[], roster: string): string {
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

export function readBasseCards(raw: unknown): Basse[] {
  if (!Array.isArray(raw)) return [];
  const out: Basse[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Basse>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      piece: basseMode(row.piece),
      drop: basseHour(row.drop),
      film: basseFilm(row.film),
      lock: basseHammer(row.lock) ?? 2,
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

export function addBasse(
  cards: readonly Basse[],
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
): Basse[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readBasseCards([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      piece: basseMode(card.piece),
      drop: basseHour(card.drop),
      film: basseFilm(card.film),
      lock: basseHammer(card.lock) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pinned: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Basse[], id: string, edit: (card: Basse) => Basse): Basse[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editBasse(cards: readonly Basse[], id: string, title: string): Basse[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBasseNote(cards: readonly Basse[], id: string, note: string): Basse[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GLAZE", "IVORY", "GRAPHITE"];
  const index = order.indexOf(basseFilm(film));
  return order[(index + 1) % order.length] || "GLAZE";
}

export function setBasseFilm(cards: readonly Basse[], id: string, film: string): Basse[] {
  const next = basseFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setBasseRaised(cards: readonly Basse[], id: string, raised: boolean): Basse[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "poise" : "free" }));
}

export function setBassePin(cards: readonly Basse[], id: string, pinned: boolean): Basse[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, coffered: pinned ? false : card.coffered, audit: pinned ? "peg" : "return" }));
}

export function setBasseCoffer(cards: readonly Basse[], id: string, coffered: boolean): Basse[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pinned: coffered ? false : card.pinned, audit: coffered ? "coffer" : "open" }));
}

export function setBasseStar(cards: readonly Basse[], id: string, starred: boolean): Basse[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addBasseTag(cards: readonly Basse[], id: string, tag: string): Basse[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 2 | 5 | 10 | 20 {
  if (drop === null) return dir > 0 ? 2 : 20;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepLock(lock: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = lockIndex(lock);
  const next = index < 0 ? 0 : (index + dir + LOCK_CYCLE.length) % LOCK_CYCLE.length;
  return LOCK_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Basse[], id: string): Basse[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerHourFocused(cards: readonly Basse[], id: string): Basse[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseHammerFocused(cards: readonly Basse[], id: string): Basse[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, 1), audit: "lock" }));
}

export function lowerHammerFocused(cards: readonly Basse[], id: string): Basse[] {
  return mapCard(cards, id, (card) => ({ ...card, lock: stepLock(card.lock, -1), audit: "lock" }));
}

export function setBasseFocused(cards: readonly Basse[], id: string): Basse[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "poise" })) : [...cards];
}

export function pinBasseFocused(cards: readonly Basse[], id: string): Basse[] {
  return setBassePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function starBasseFocused(cards: readonly Basse[], id: string): Basse[] {
  return setBasseStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function finishFocused(cards: readonly Basse[], id: string): Basse[] {
  const card = cards.find((item) => item.id === id);
  return card ? setBasseFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Basse[], ids: readonly string[], edit: (card: Basse) => Basse): Basse[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkBasseGraphite(cards: readonly Basse[], ids: readonly string[]): Basse[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkBasseRaise(cards: readonly Basse[], ids: readonly string[]): Basse[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "poise" }));
}

export function bulkBasseCoffer(cards: readonly Basse[], ids: readonly string[]): Basse[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pinned: false, audit: "coffer" }));
}

export function bulkBasseTag(cards: readonly Basse[], ids: readonly string[]): Basse[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readBasseViews(raw: unknown): BasseView[] {
  if (!Array.isArray(raw)) return [];
  const out: BasseView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BasseView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeFinish(row.film, ["GLAZE", "IVORY", "GRAPHITE"]),
      piece: activeMode(row.piece),
      drop: activeHour(row.drop),
      lock: activeHammer(row.lock),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBasseView(views: readonly BasseView[], view: BasseView): BasseView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readBasseViews([...views, { ...view, id, name }]);
}

export function dropBasseView(views: readonly BasseView[], id: string): BasseView[] {
  return views.filter((view) => view.id !== id);
}

export function basseDensity(raw: unknown): BasseDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortBasseCards(cards: readonly Basse[], sort: BasseSort): Basse[] {
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

export function visibleBasseCards(
  cards: readonly Basse[],
  tray: BasseTray,
  query: string,
  setter: string,
  film: string,
  piece: string,
  drop: string,
  lock: string,
): Basse[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : basseFilm(film);
  const wantLimb = activeMode(piece);
  const wantBeat = activeHour(drop);
  const wantRate = activeHammer(lock);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.setter.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !basseInner(card.piece)) return false;
    if (wantLimb === "outer" && !basseOuter(card.piece)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.piece !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.drop ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.lock) !== wantRate) return false;
    return true;
  });
}

/** An edge stripe on count four, still not raised and not in the drawer, is overdue. */
export function overdueBasse(card: Basse): boolean {
  return basseOuter(card.piece) && card.lock === 2 && !card.raised && !card.coffered;
}


/** No finish, pitch five, count four, and still on the bench. */
export function idleBasse(card: Basse): boolean {
  return !card.film && card.drop === 2 && card.lock === 2 && !card.raised && !card.pinned && !card.coffered;
}


/** Gilt, pitch forty, and a full count, still out of the drawer. */
export function briskBasse(card: Basse): boolean {
  return card.film === "GLAZE" && card.drop === 20 && card.lock === 8 && !card.coffered;
}


/** Fringe, ivory, and pitch ten. */
export function restingBasse(card: Basse): boolean {
  return card.piece === "crest" && card.film === "IVORY" && card.drop === 5;
}


/** A boss is late when the station is already on the crest. */
export function lateBasse(card: Basse, station: string): boolean {
  return card.piece === "bed" && basseMode(station) === "crest" && !card.raised;
}


export function basseCounts(cards: readonly Basse[], shown: readonly Basse[], station: string): BasseCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    inner: cards.filter((card) => basseInner(card.piece)).length,
    outer: cards.filter((card) => basseOuter(card.piece)).length,
    tall: cards.filter((card) => card.drop === 20).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleBasse).length,
    brisk: cards.filter(briskBasse).length,
    resting: cards.filter(restingBasse).length,
    overdue: cards.filter(overdueBasse).length,
    pair: cards.filter((card) => pairHammer(card.lock) && lateBasse(card, station)).length,
  };
}

export function basseBars(cards: readonly Basse[]): { piece: string; count: number }[] {
  return BTL_MODES.map((piece) => ({ piece, count: cards.filter((card) => card.piece === piece && !card.coffered).length }));
}

export function basseTimeline(cards: readonly Basse[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((mail) => mail.titles.length);
}

export function basseKeepers(cards: readonly Basse[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestKeeper(cards: readonly Basse[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.raised && card.setter);
  let best = "";
  let score = 0;
  for (const name of basseKeepers(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderBasseCards(cards: readonly Basse[]): string[] {
  return cards.filter(overdueBasse).map((card) => card.title);
}

export function basseCopy(card: Basse): string {
  return [card.title, card.setter, card.piece, card.film, card.drop ?? "", card.lock, card.note].filter((item) => item !== "").join(" · ");
}

export function basseCsv(cards: readonly Basse[], station: string): string {
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
        basseOuter(card.piece) ? "1" : "0",
        lateBasse(card, station) ? "1" : "0",
        idleBasse(card) ? "1" : "0",
        briskBasse(card) ? "1" : "0",
        restingBasse(card) ? "1" : "0",
        overdueBasse(card) ? "1" : "0",
        basseInner(card.piece) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        basseBand(card.piece),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const SSP_KEY = "crmv4-ssp-hide-371";
export const SSP_REVIEW_KEY = "crmv4-ssp-review-371";

export type SspLane = "" | "hall" | "vacant" | "hold" | "desk" | "guest" | "join" | "route" | "brief" | "long" | "stamp" | "vowel" | "plain";
export type SspHue = "" | "ivory" | "graphite" | "champagne";
export type SspState = "" | "clear" | "set";
export type SspReview = "all" | "reviewed" | "fresh";
export type SspShape =
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

export type SspValue = string | { saleStatus?: unknown; [key: string]: unknown } | null | undefined;
export type SspRow = { id: string; label: string; code: SspValue; userId?: string };
export type SspLaneLine = { mail: string; count: number };

const RESIDENCY_LANES = ["hall", "vacant", "hold", "desk", "guest", "join", "route", "brief", "long", "stamp", "vowel", "plain"] as const;
const RESIDENCY_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: SspValue): { saleStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: SspValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: SspValue): string {
  const row = codeRecord(raw);
  if (row && !("saleStatus" in row)) return "";
  const value = row ? row.saleStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CLEAR";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: SspValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("saleStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function sspState(raw: SspValue): SspState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LEAD_TITLES = new Set(["HOT", "WON", "SALE", "HOUSE", "YES", "LIVE", "CLEAR", "FILE"]);
const DESK_TITLES = new Set(["CALL", "MAIL", "OPEN", "PIPE"]);
const HOLD_TITLES = new Set(["NEW", "WAIT", "HOLD", "QUEUE"]);
const GUEST_TITLES = new Set(["LOST", "COLD", "VOID", "DEAD"]);
const JOIN_TITLES = new Set(["TWIN", "PAIR"]);
const PLAIN_TITLES = new Set(["NONE", "NO", "BLANK"]);

/** A known origin maps first. A plus joins two origins. A colon that is not a time marks a scoped origin. A time today is a house origin. Within three days is the desk. Within ten days is hold. Older is a guest. Silent or closed is shut. A brief mark is exactly four characters. A digit mark starts with a digit and is not a time. A long mark is ten characters or longer. A vowel mark starts with a vowel. The words manual and staff are house origins. */
export function sspLane(raw: SspValue, now = Date.now()): SspLane {
  if (sspState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LEAD_TITLES.has(upper)) return "hall";
  if (DESK_TITLES.has(upper)) return "desk";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (GUEST_TITLES.has(upper)) return "guest";
  if (JOIN_TITLES.has(upper)) return "join";
  if (PLAIN_TITLES.has(upper)) return "plain";
  if (/quiet|closed/i.test(text)) return "vacant";
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
    if (age < 2 * day) return "desk";
    if (age < 8 * day) return "hold";
    return "guest";
  }
  if (text.includes("/")) return "route";
  if (/^[0-9]/.test(text)) return "stamp";
  if (text.length === 5) return "brief";
  if (/\bclear\b|\bfile\b/i.test(text)) return "hall";
  if (text.length >= 11 && text.includes(":")) return "route";
  if (text.length >= 11) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function sspHue(raw: SspValue, now = Date.now()): SspHue {
  const mail = sspLane(raw, now);
  if (!mail) return "";
  if (mail === "hall" || mail === "join") return "champagne";
  if (mail === "desk" || mail === "guest" || mail === "route" || mail === "long") return "graphite";
  return "ivory";
}

export function sspHome(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "hall";
}

export function sspAway(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "vacant";
}

export function sspGuest(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "hold";
}

export function sspCitizen(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "guest";
}

export function sspDesk(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "desk";
}

export function sspJoin(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "join";
}

export function sspRoute(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "route";
}

export function sspBrief(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "brief";
}

export function sspLong(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "long";
}

export function sspStampMark(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "stamp";
}

export function sspVowelLane(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "vowel";
}

export function sspPlain(raw: SspValue, now = Date.now()): boolean {
  return sspLane(raw, now) === "plain";
}

export function sspOpen(raw: SspValue): boolean {
  return sspState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function sspHeld(raw: SspValue): boolean {
  const mail = sspLane(raw);
  return mail === "long" || mail === "stamp";
}

/** A brief mark, or a nine-character mark that is not a known title, still wants a fuller name. */
export function sspSoon(raw: SspValue, now = Date.now()): boolean {
  if (sspState(raw) !== "set") return false;
  if (sspBrief(raw, now)) return true;
  if (sspHome(raw, now) || sspAway(raw, now) || sspGuest(raw, now) || sspCitizen(raw, now)) return false;
  return codeGiven(raw).length === 7;
}

export function sspLength(raw: SspValue): number | null {
  if (sspState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function sspEven(raw: SspValue): boolean {
  const length = sspLength(raw);
  return length !== null && length % 2 === 0;
}

export function sspOdd(raw: SspValue): boolean {
  const length = sspLength(raw);
  return length !== null && length % 2 === 1;
}

export function sspFirst(raw: SspValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function sspTail(raw: SspValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function sspCapital(raw: SspValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function sspSpace(raw: SspValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function sspVowel(raw: SspValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function sspDigit(raw: SspValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function sspLetter(raw: SspValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function sspMixed(raw: SspValue): boolean {
  return sspDigit(raw) && sspLetter(raw);
}

export function sspLower(raw: SspValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital mark is eight letters or more, written entirely in capitals. */
export function sspUpper(raw: SspValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function sspStamp(raw: SspValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function sspCopy(raw: SspValue): string {
  return codeGiven(raw);
}

export function sspFamily(raw: SspValue): string {
  if (sspState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function sspLanes(rows: readonly SspRow[]): SspLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of RESIDENCY_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = sspLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return RESIDENCY_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSel(rows: readonly SspRow[]): string {
  const lines = sspLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || RESIDENCY_LANES.indexOf(a.mail as (typeof RESIDENCY_LANES)[number]) - RESIDENCY_LANES.indexOf(b.mail as (typeof RESIDENCY_LANES)[number]))[0].mail;
}

export function leadingSelHue(rows: readonly SspRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of RESIDENCY_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = sspHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = RESIDENCY_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || RESIDENCY_HUES.indexOf(a.hue) - RESIDENCY_HUES.indexOf(b.hue))[0].hue;
}

export function laneSelCount(rows: readonly SspRow[], mail: SspLane): number {
  return rows.filter((row) => sspLane(row.code) === mail).length;
}

export function sspShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSelLanes(rows: readonly SspRow[]): string[] {
  return sspLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
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

function shapeOn(row: SspRow, shape: SspShape): boolean {
  if (shape === "all") return true;
  if (shape === "hall") return sspHome(row.code);
  if (shape === "vacant") return sspAway(row.code);
  if (shape === "hold") return sspGuest(row.code);
  if (shape === "guest") return sspCitizen(row.code);
  if (shape === "join") return sspJoin(row.code);
  if (shape === "route") return sspRoute(row.code);
  if (shape === "brief") return sspBrief(row.code);
  if (shape === "long") return sspLong(row.code);
  if (shape === "stamp") return sspStampMark(row.code);
  if (shape === "vowel") return sspVowelLane(row.code);
  if (shape === "plain") return sspPlain(row.code);
  if (shape === "open") return sspOpen(row.code);
  if (shape === "soon") return sspSoon(row.code);
  if (shape === "letter") return sspLetter(row.code);
  if (shape === "mixed") return sspMixed(row.code);
  if (shape === "upper") return sspUpper(row.code);
  if (shape === "lower") return sspLower(row.code);
  if (shape === "space") return sspSpace(row.code);
  if (shape === "even") return sspEven(row.code);
  if (shape === "odd") return sspOdd(row.code);
  if (shape === "tail") return sspTail(row.code);
  if (shape === "first") return sspFirst(row.code);
  if (shape === "held") return sspHeld(row.code);
  return sspLane(row.code) === shape;
}

export function visibleSel(
  rows: readonly SspRow[],
  mail: string,
  hue: string,
  query: string,
  review: SspReview,
  reviewed: readonly string[],
  shape: SspShape,
): SspRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (sspState(row.code) === "") return false;
    const found = sspLane(row.code);
    const hueName = sspHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${sspStamp(row.code)} ${sspFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function sspLanesCsv(rows: readonly SspRow[]): string {
  const lines = ["lane,count"];
  for (const line of sspLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function sspRowsCsv(rows: readonly SspRow[], reviewed: readonly string[]): string {
  const lines = ["name,saleStatus,stamp,family,lane,hue,length,home,vacant,hold,desk,guest,join,route,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(sspCopy(row.code)),
        sspStamp(row.code),
        csvCell(sspFamily(row.code)),
        sspLane(row.code),
        sspHue(row.code),
        sspLength(row.code) ?? "",
        sspHome(row.code) ? "1" : "0",
        sspAway(row.code) ? "1" : "0",
        sspGuest(row.code) ? "1" : "0",
        sspDesk(row.code) ? "1" : "0",
        sspCitizen(row.code) ? "1" : "0",
        sspJoin(row.code) ? "1" : "0",
        sspRoute(row.code) ? "1" : "0",
        sspBrief(row.code) ? "1" : "0",
        sspEven(row.code) ? "1" : "0",
        sspDigit(row.code) ? "1" : "0",
        sspMixed(row.code) ? "1" : "0",
        sspUpper(row.code) ? "1" : "0",
        sspVowel(row.code) ? "1" : "0",
        sspTail(row.code) ? "1" : "0",
        sspHeld(row.code) ? "1" : "0",
        sspSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
