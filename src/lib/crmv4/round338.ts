/**
 * Keyless rules for a crown-winding keyless works kept in this browser, and role plates read the role already stored on the account.
 * Parts are stem, clutch, castle, and yoke. Finishes are gilt, ivory, and graphite.
 * Winds are 4, 12, 20, or 28. Depths are 3, 6, or 9.
 * A known role is TRADER, ADMIN, OWNER, or AUDIT. A plus joins two roles. A semicolon marks a pause.
 * A bead is exactly four characters. A ribbon is sixteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true role reads as TRADER. An empty role reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_keyless (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   winder text not null default '',
 *   limb text not null default '',
 *   beat_no integer,
 *   film text not null default '',
 *   rate_no integer not null default 3,
 *   tags text not null default '',
 *   poised boolean not null default false,
 *   pegged boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_roleplate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_roleplate_review (
 *   trader_id text primary key
 * );
 */
export const KLW_KEY = "crmv4-keyless";
export const KLW_VIEW_KEY = "crmv4-keyless-views";
export const KLW_DENSITY_KEY = "crmv4-keyless-density";
export const KLW_LIMBS = ["stem", "clutch", "castle", "yoke"] as const;

export type KeylessLimb = (typeof KLW_LIMBS)[number];
export type KeylessFilm = "blank" | "gilt" | "ivory" | "graphite";
export type KeylessTray = "board" | "peg" | "coffer";
export type KeylessDensity = "airy" | "close";
export type KeylessSort = "limb" | "winder";

export type Keyless = {
  id: string;
  title: string;
  note: string;
  winder: string;
  limb: string;
  beat: number | null;
  film: string;
  rate: number;
  tags: string[];
  poised: boolean;
  pegged: boolean;
  coffered: boolean;
  starred: boolean;
  audit: string;
};

export type KeylessView = {
  id: string;
  name: string;
  tray: KeylessTray;
  query: string;
  winder: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type KeylessCounts = {
  board: number;
  peg: number;
  coffer: number;
  poised: number;
  inner: number;
  outer: number;
  tall: number;
  quiet: number;
  beat: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND338_FEATURES = [
  "keyless-save",
  "stem-notices",
  "keyless-parts",
  "keyless-search",
  "depth-sla",
  "casket-file",
  "pin-and-star",
  "inline-title",
  "keyless-filters",
  "saved-keyless-views",
  "keyless-density",
  "winder-sort",
  "keyless-kpis",
  "wind-chart",
  "wind-timeline",
  "keyless-bulk",
  "keyless-csv",
  "keyless-keys",
  "keyless-audit",
  "fair-winder",
  "keyless-viewer",
  "suggest-stem",
  "overdue-winds",
  "role-plate",
  "roleplate-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [4, 12, 20, 28] as const;
const RATE_CYCLE = [3, 6, 9] as const;
const INNER = new Set(["stem", "clutch"]);
const OUTER = new Set(["castle", "yoke"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["TRADER", "ADMIN", "OWNER", "AUDIT"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): KeylessTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<KeylessFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<KeylessFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Keyless, tray: KeylessTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return KLW_LIMBS.indexOf(limb as KeylessLimb);
}

function beatIndex(beat: number): number {
  return BEAT_CYCLE.indexOf(beat as (typeof BEAT_CYCLE)[number]);
}

function rateIndex(rate: number): number {
  return RATE_CYCLE.indexOf(rate as (typeof RATE_CYCLE)[number]);
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

export function keylessLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (KLW_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A wind is 4, 12, 20, or 28. Anything else stays blank. */
export function keylessBeat(raw: unknown): 4 | 12 | 20 | 28 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "12" && text !== "20" && text !== "28") return null;
  return Number(text) as 4 | 12 | 20 | 28;
}

/** A depth is 3, 6, or 9. Anything else stays blank. */
export function keylessRate(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function keylessFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function keylessInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function keylessOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Shaft is the stem. Slide is the clutch. Wheel is the castle. Bar is the yoke. */
export function keylessBand(limb: unknown): string {
  const text = keylessLimb(limb);
  if (!text) return "";
  if (text === "stem") return "shaft";
  if (text === "clutch") return "slide";
  if (text === "castle") return "wheel";
  return "bar";
}

/** Signed distance from one limb to another along the keyless. */
export function keylessGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(keylessLimb(from));
  const right = limbIndex(keylessLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(keylessFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairSpring(rate: unknown): boolean {
  return keylessRate(rate) === 6;
}

/** A full rate is 10. */
export function fullSpring(rate: unknown): boolean {
  return keylessRate(rate) === 9;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return keylessLimb(text) || "all";
}

export function activeTurn(raw: unknown): string {
  const beat = keylessBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = keylessFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSpring(raw: unknown): string {
  const rate = keylessRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveKeylessFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Keyless[]): string {
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
export function suggestTurn(cards: readonly Keyless[], hour: number): 4 | 12 | 20 | 28 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 12 | 20 | 28 = 4;
    let score = Number.POSITIVE_INFINITY;
    for (const beat of BEAT_CYCLE) {
      const count = counts.get(beat) || 0;
      if (count < score) {
        best = beat;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 4;
  if (hour < 11) return 12;
  if (hour < 17) return 20;
  return 28;
}

/** Before eight, suggest the keyless. The fax of the day suggests the impulse. */
export function suggestPart(hour: number): KeylessLimb {
  return hour < 7 ? "stem" : "yoke";
}

/** The winder with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairWinder(cards: readonly Keyless[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.poised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.winder.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readKeylessRules(raw: unknown): Keyless[] {
  if (!Array.isArray(raw)) return [];
  const out: Keyless[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Keyless>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      winder: clip(row.winder, 24),
      limb: keylessLimb(row.limb),
      beat: keylessBeat(row.beat),
      film: keylessFilm(row.film),
      rate: keylessRate(row.rate) ?? 3,
      tags: tagsOf(row.tags),
      poised: row.poised === true,
      pegged: row.pegged === true,
      coffered: row.coffered === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addKeyless(
  cards: readonly Keyless[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    winder?: string;
    limb?: string;
    beat?: unknown;
    film?: string;
    rate?: unknown;
    tags?: unknown;
  },
): Keyless[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readKeylessRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      winder: clip(card.winder, 24),
      limb: keylessLimb(card.limb),
      beat: keylessBeat(card.beat),
      film: keylessFilm(card.film),
      rate: keylessRate(card.rate) ?? 3,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Keyless[], id: string, edit: (card: Keyless) => Keyless): Keyless[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editKeyless(cards: readonly Keyless[], id: string, title: string): Keyless[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editKeylessNote(cards: readonly Keyless[], id: string, note: string): Keyless[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(keylessFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setKeylessFilm(cards: readonly Keyless[], id: string, film: string): Keyless[] {
  const next = keylessFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setKeylessPoise(cards: readonly Keyless[], id: string, poised: boolean): Keyless[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setKeylessPeg(cards: readonly Keyless[], id: string, pegged: boolean): Keyless[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setKeylessCoffer(cards: readonly Keyless[], id: string, coffered: boolean): Keyless[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setKeylessStar(cards: readonly Keyless[], id: string, starred: boolean): Keyless[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addKeylessTag(cards: readonly Keyless[], id: string, tag: string): Keyless[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 4 | 12 | 20 | 28 {
  if (beat === null) return dir > 0 ? 4 : 28;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setKeylessFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegKeylessFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return setKeylessPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starKeylessFocused(cards: readonly Keyless[], id: string): Keyless[] {
  return setKeylessStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Keyless[], id: string): Keyless[] {
  const card = cards.find((item) => item.id === id);
  return card ? setKeylessFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Keyless[], ids: readonly string[], edit: (card: Keyless) => Keyless): Keyless[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkKeylessGraphite(cards: readonly Keyless[], ids: readonly string[]): Keyless[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkKeylessPoise(cards: readonly Keyless[], ids: readonly string[]): Keyless[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkKeylessCoffer(cards: readonly Keyless[], ids: readonly string[]): Keyless[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkKeylessTag(cards: readonly Keyless[], ids: readonly string[]): Keyless[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readKeylessViews(raw: unknown): KeylessView[] {
  if (!Array.isArray(raw)) return [];
  const out: KeylessView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KeylessView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      winder: clip(row.winder, 24),
      film: activeFinish(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activePart(row.limb),
      beat: activeTurn(row.beat),
      rate: activeSpring(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addKeylessView(views: readonly KeylessView[], view: KeylessView): KeylessView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readKeylessViews([...views, { ...view, id, name }]);
}

export function dropKeylessView(views: readonly KeylessView[], id: string): KeylessView[] {
  return views.filter((view) => view.id !== id);
}

export function keylessDensity(raw: unknown): KeylessDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortKeylessRules(cards: readonly Keyless[], sort: KeylessSort): Keyless[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "winder") {
      const winder = a.winder.localeCompare(b.winder);
      if (winder) return winder;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleKeylessRules(
  cards: readonly Keyless[],
  tray: KeylessTray,
  query: string,
  winder: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Keyless[] {
  const text = query.trim().toLowerCase();
  const wantWinder = clip(winder, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : keylessFilm(film);
  const wantLimb = activePart(limb);
  const wantBeat = activeTurn(beat);
  const wantRate = activeSpring(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.winder}`.toLowerCase().includes(text)) return false;
    if (wantWinder && card.winder.toLowerCase() !== wantWinder) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !keylessInner(card.limb)) return false;
    if (wantLimb === "outer" && !keylessOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueKeyless(card: Keyless): boolean {
  return keylessOuter(card.limb) && card.rate === 3 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleKeyless(card: Keyless): boolean {
  return !card.film && card.beat === 4 && card.rate === 3 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskKeyless(card: Keyless): boolean {
  return card.film === "GILT" && card.beat === 28 && card.rate === 9 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingKeyless(card: Keyless): boolean {
  return card.limb === "yoke" && card.film === "IVORY" && card.beat === 12;
}

/** A keyless is late when the station is already on the impulse. */
export function lateKeyless(card: Keyless, station: string): boolean {
  return card.limb === "stem" && keylessLimb(station) === "yoke" && !card.poised;
}

export function keylessCounts(cards: readonly Keyless[], shown: readonly Keyless[], station: string): KeylessCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => keylessInner(card.limb)).length,
    outer: cards.filter((card) => keylessOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 28).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleKeyless).length,
    brisk: cards.filter(briskKeyless).length,
    resting: cards.filter(restingKeyless).length,
    overdue: cards.filter(overdueKeyless).length,
    pair: cards.filter((card) => pairSpring(card.rate) && lateKeyless(card, station)).length,
  };
}

export function keylessBars(cards: readonly Keyless[]): { limb: string; count: number }[] {
  return KLW_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function keylessTimeline(cards: readonly Keyless[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function keylessWinders(cards: readonly Keyless[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.winder && !out.some((name) => name.toLowerCase() === card.winder.toLowerCase())) out.push(card.winder);
  }
  return out;
}

export function busiestWinder(cards: readonly Keyless[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.winder);
  let best = "";
  let score = 0;
  for (const name of keylessWinders(open)) {
    const count = open.filter((card) => card.winder.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderKeylessRules(cards: readonly Keyless[]): string[] {
  return cards.filter(overdueKeyless).map((card) => card.title);
}

export function keylessCopy(card: Keyless): string {
  return [card.title, card.winder, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function keylessCsv(cards: readonly Keyless[], station: string): string {
  const lines = ["title,winder,limb,film,wind,depth,tags,poised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.winder),
        card.limb,
        card.film,
        card.beat ?? "",
        card.rate,
        card.tags.join(" "),
        card.poised ? "1" : "0",
        card.pegged ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        keylessOuter(card.limb) ? "1" : "0",
        lateKeyless(card, station) ? "1" : "0",
        idleKeyless(card) ? "1" : "0",
        briskKeyless(card) ? "1" : "0",
        restingKeyless(card) ? "1" : "0",
        overdueKeyless(card) ? "1" : "0",
        keylessInner(card.limb) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        keylessBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const RLP_KEY = "crmv4-roleplate-hide";
export const RLP_REVIEW_KEY = "crmv4-roleplate-review";

export type RoleplateLane = "" | "trader" | "admin" | "owner" | "audit" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type RoleplateHue = "" | "ivory" | "graphite" | "champagne";
export type RoleplateState = "" | "clear" | "set";
export type RoleplateReview = "all" | "reviewed" | "fresh";
export type RoleplateShape =
  | "all"
  | "trader"
  | "admin"
  | "owner"
  | "audit"
  | "join"
  | "gap"
  | "bead"
  | "ribbon"
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

export type RoleplateValue = string | { role?: unknown; [key: string]: unknown } | null | undefined;
export type RoleplateRow = { id: string; label: string; code: RoleplateValue };
export type RoleplateLaneLine = { lane: string; count: number };

const CODE_LANES = ["trader", "admin", "owner", "audit", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: RoleplateValue): { role?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: RoleplateValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: RoleplateValue): string {
  const row = codeRecord(raw);
  if (row && !("role" in row)) return "";
  const value = row ? row.role : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "TRADER";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: RoleplateValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("role" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function roleplateState(raw: RoleplateValue): RoleplateState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known role is TRADER, ADMIN, OWNER, or AUDIT. A plus joins two roles. A semicolon marks a pause. A bead is exactly four characters. A ribbon is sixteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function roleplateLane(raw: RoleplateValue): RoleplateLane {
  if (roleplateState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "TRADER") return "trader";
    if (upper === "ADMIN") return "admin";
    if (upper === "OWNER") return "owner";
    return "audit";
  }
  if (text === "NONE") return "plain";
  if (text.includes("+")) return "join";
  if (text.includes(";")) return "gap";
  if (text.length === 4) return "bead";
  if (text.length >= 16) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function roleplateHue(raw: RoleplateValue): RoleplateHue {
  const lane = roleplateLane(raw);
  if (!lane) return "";
  if (lane === "trader" || lane === "owner") return "champagne";
  if (lane === "admin" || lane === "audit" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function roleplateTrader(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "trader";
}

export function roleplateAdmin(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "admin";
}

export function roleplateOwner(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "owner";
}

export function roleplateAudit(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "audit";
}

export function roleplateJoin(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "join";
}

export function roleplateGap(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "gap";
}

export function roleplateBead(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "bead";
}

export function roleplateRibbon(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "ribbon";
}

export function roleplateMark(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "mark";
}

export function roleplateVowelLane(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "vowel";
}

export function roleplatePlain(raw: RoleplateValue): boolean {
  return roleplateLane(raw) === "plain";
}

export function roleplateOpen(raw: RoleplateValue): boolean {
  return roleplateState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function roleplateHeld(raw: RoleplateValue): boolean {
  const lane = roleplateLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function roleplateSoon(raw: RoleplateValue): boolean {
  if (roleplateState(raw) !== "set") return false;
  if (roleplateBead(raw)) return true;
  if (roleplateTrader(raw) || roleplateAdmin(raw) || roleplateOwner(raw) || roleplateAudit(raw)) return false;
  return codeGiven(raw).length === 9;
}

export function roleplateLength(raw: RoleplateValue): number | null {
  if (roleplateState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function roleplateEven(raw: RoleplateValue): boolean {
  const length = roleplateLength(raw);
  return length !== null && length % 2 === 0;
}

export function roleplateOdd(raw: RoleplateValue): boolean {
  const length = roleplateLength(raw);
  return length !== null && length % 2 === 1;
}

export function roleplateFirst(raw: RoleplateValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function roleplateTail(raw: RoleplateValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function roleplateCapital(raw: RoleplateValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function roleplateSpace(raw: RoleplateValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function roleplateVowel(raw: RoleplateValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function roleplateDigit(raw: RoleplateValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function roleplateLetter(raw: RoleplateValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function roleplateMixed(raw: RoleplateValue): boolean {
  return roleplateDigit(raw) && roleplateLetter(raw);
}

export function roleplateLower(raw: RoleplateValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function roleplateUpper(raw: RoleplateValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function roleplateStamp(raw: RoleplateValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function roleplateCopy(raw: RoleplateValue): string {
  return codeGiven(raw);
}

export function roleplateFamily(raw: RoleplateValue): string {
  if (roleplateState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function roleplateLanes(rows: readonly RoleplateRow[]): RoleplateLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = roleplateLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRoleplate(rows: readonly RoleplateRow[]): string {
  const lines = roleplateLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingRoleplateHue(rows: readonly RoleplateRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = roleplateHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneRoleplateCount(rows: readonly RoleplateRow[], lane: RoleplateLane): number {
  return rows.filter((row) => roleplateLane(row.code) === lane).length;
}

export function roleplateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRoleplateLanes(rows: readonly RoleplateRow[]): string[] {
  return roleplateLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenRoleplate(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if (!allow.has(lane) || out.includes(lane)) continue;
    out.push(lane);
  }
  return out;
}

export function readReviewedRoleplate(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRoleplate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRoleplateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRoleplateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRoleplateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: RoleplateRow, shape: RoleplateShape): boolean {
  if (shape === "all") return true;
  if (shape === "trader") return roleplateTrader(row.code);
  if (shape === "admin") return roleplateAdmin(row.code);
  if (shape === "owner") return roleplateOwner(row.code);
  if (shape === "audit") return roleplateAudit(row.code);
  if (shape === "join") return roleplateJoin(row.code);
  if (shape === "gap") return roleplateGap(row.code);
  if (shape === "bead") return roleplateBead(row.code);
  if (shape === "ribbon") return roleplateRibbon(row.code);
  if (shape === "mark") return roleplateMark(row.code);
  if (shape === "vowel") return roleplateVowelLane(row.code);
  if (shape === "plain") return roleplatePlain(row.code);
  if (shape === "open") return roleplateOpen(row.code);
  if (shape === "soon") return roleplateSoon(row.code);
  if (shape === "letter") return roleplateLetter(row.code);
  if (shape === "mixed") return roleplateMixed(row.code);
  if (shape === "upper") return roleplateUpper(row.code);
  if (shape === "lower") return roleplateLower(row.code);
  if (shape === "space") return roleplateSpace(row.code);
  if (shape === "even") return roleplateEven(row.code);
  if (shape === "odd") return roleplateOdd(row.code);
  if (shape === "tail") return roleplateTail(row.code);
  if (shape === "first") return roleplateFirst(row.code);
  if (shape === "held") return roleplateHeld(row.code);
  return roleplateLane(row.code) === shape;
}

export function visibleRoleplate(
  rows: readonly RoleplateRow[],
  lane: string,
  hue: string,
  query: string,
  review: RoleplateReview,
  reviewed: readonly string[],
  shape: RoleplateShape,
): RoleplateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (roleplateState(row.code) === "") return false;
    const found = roleplateLane(row.code);
    const hueName = roleplateHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${roleplateStamp(row.code)} ${roleplateFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function roleplateLanesCsv(rows: readonly RoleplateRow[]): string {
  const lines = ["lane,count"];
  for (const line of roleplateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function roleplateRowsCsv(rows: readonly RoleplateRow[], reviewed: readonly string[]): string {
  const lines = ["name,role,stamp,family,lane,hue,length,trader,admin,owner,audit,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(roleplateCopy(row.code)),
        roleplateStamp(row.code),
        csvCell(roleplateFamily(row.code)),
        roleplateLane(row.code),
        roleplateHue(row.code),
        roleplateLength(row.code) ?? "",
        roleplateTrader(row.code) ? "1" : "0",
        roleplateAdmin(row.code) ? "1" : "0",
        roleplateOwner(row.code) ? "1" : "0",
        roleplateAudit(row.code) ? "1" : "0",
        roleplateJoin(row.code) ? "1" : "0",
        roleplateGap(row.code) ? "1" : "0",
        roleplateBead(row.code) ? "1" : "0",
        roleplateEven(row.code) ? "1" : "0",
        roleplateDigit(row.code) ? "1" : "0",
        roleplateMixed(row.code) ? "1" : "0",
        roleplateUpper(row.code) ? "1" : "0",
        roleplateVowel(row.code) ? "1" : "0",
        roleplateTail(row.code) ? "1" : "0",
        roleplateHeld(row.code) ? "1" : "0",
        roleplateSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
