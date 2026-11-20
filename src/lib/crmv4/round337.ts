/**
 * Coaxial rules for a coaxial escapement kept in this browser, and type plates read the account type already stored on the account.
 * Parts are escape, pallet, impulse, and locking. Finishes are gilt, ivory, and graphite.
 * Drops are 3, 9, 15, or 21. Locks are 2, 5, or 8.
 * A known account type is STANDARD, VIP, PRO, or DEMO. An ampersand joins two types. A pipe marks a pause.
 * A bead is exactly five characters. A ribbon is fifteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true account type reads as STANDARD. An empty account type reads as NONE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_coaxial (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   setter text not null default '',
 *   limb text not null default '',
 *   beat_no integer,
 *   film text not null default '',
 *   rate_no integer not null default 1,
 *   tags text not null default '',
 *   poised boolean not null default false,
 *   pegged boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_typeplate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_typeplate_review (
 *   trader_id text primary key
 * );
 */
export const CAX_KEY = "crmv4-coaxial";
export const CAX_VIEW_KEY = "crmv4-coaxial-views";
export const CAX_DENSITY_KEY = "crmv4-coaxial-density";
export const CAX_LIMBS = ["escape", "pallet", "impulse", "locking"] as const;

export type CoaxialLimb = (typeof CAX_LIMBS)[number];
export type CoaxialFilm = "blank" | "gilt" | "ivory" | "graphite";
export type CoaxialTray = "board" | "peg" | "coffer";
export type CoaxialDensity = "airy" | "close";
export type CoaxialSort = "limb" | "setter";

export type Coaxial = {
  id: string;
  title: string;
  note: string;
  setter: string;
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

export type CoaxialView = {
  id: string;
  name: string;
  tray: CoaxialTray;
  query: string;
  setter: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type CoaxialCounts = {
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

export const ROUND337_FEATURES = [
  "coaxial-save",
  "escape-notices",
  "coaxial-parts",
  "coaxial-search",
  "lock-sla",
  "chest",
  "pin-star",
  "inline-edit",
  "coaxial-filters",
  "saved-views",
  "bench-density",
  "setter-sort",
  "bench-kpis",
  "drop-chart",
  "drop-timeline",
  "bulk-actions",
  "csv-export",
  "keyboard-shortcuts",
  "audit-trail",
  "fair-setter",
  "viewer-role",
  "suggest-escape",
  "overdue-reminders",
  "account-typeplate",
  "typeplate-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [3, 9, 15, 21] as const;
const RATE_CYCLE = [2, 5, 8] as const;
const INNER = new Set(["escape", "pallet"]);
const OUTER = new Set(["impulse", "locking"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["STANDARD", "VIP", "PRO", "DEMO"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CoaxialTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<CoaxialFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<CoaxialFilm, "blank">) : "";
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

function inTray(card: Coaxial, tray: CoaxialTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return CAX_LIMBS.indexOf(limb as CoaxialLimb);
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

export function coaxialLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CAX_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A turn is 4, 8, 16, or 32. Anything else stays blank. */
export function coaxialBeat(raw: unknown): 3 | 9 | 15 | 21 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "9" && text !== "15" && text !== "21") return null;
  return Number(text) as 3 | 9 | 15 | 21;
}

/** A spring is 1, 4, or 7. Anything else stays blank. */
export function coaxialRate(raw: unknown): 2 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8") return null;
  return Number(text) as 2 | 5 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function coaxialFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function coaxialInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function coaxialOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Pallet is the coaxial. Axle is the escape. Eye is the hook. Pawl is the impulse. */
export function coaxialBand(limb: unknown): string {
  const text = coaxialLimb(limb);
  if (!text) return "";
  if (text === "escape") return "wheel";
  if (text === "pallet") return "fork";
  if (text === "impulse") return "jewel";
  return "stone";
}

/** Signed distance from one limb to another along the coaxial. */
export function coaxialGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(coaxialLimb(from));
  const right = limbIndex(coaxialLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(coaxialFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairSpring(rate: unknown): boolean {
  return coaxialRate(rate) === 5;
}

/** A full rate is 10. */
export function fullSpring(rate: unknown): boolean {
  return coaxialRate(rate) === 8;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return coaxialLimb(text) || "all";
}

export function activeTurn(raw: unknown): string {
  const beat = coaxialBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = coaxialFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSpring(raw: unknown): string {
  const rate = coaxialRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveCoaxialFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Coaxial[]): string {
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
export function suggestTurn(cards: readonly Coaxial[], hour: number): 3 | 9 | 15 | 21 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 9 | 15 | 21 = 3;
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
  if (hour < 6) return 3;
  if (hour < 12) return 9;
  if (hour < 18) return 15;
  return 21;
}

/** Before eight, suggest the coaxial. The fax of the day suggests the impulse. */
export function suggestPart(hour: number): CoaxialLimb {
  return hour < 8 ? "escape" : "locking";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairSetter(cards: readonly Coaxial[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.poised);
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

export function readCoaxialRules(raw: unknown): Coaxial[] {
  if (!Array.isArray(raw)) return [];
  const out: Coaxial[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Coaxial>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      limb: coaxialLimb(row.limb),
      beat: coaxialBeat(row.beat),
      film: coaxialFilm(row.film),
      rate: coaxialRate(row.rate) ?? 2,
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

export function addCoaxial(
  cards: readonly Coaxial[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    setter?: string;
    limb?: string;
    beat?: unknown;
    film?: string;
    rate?: unknown;
    tags?: unknown;
  },
): Coaxial[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCoaxialRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      limb: coaxialLimb(card.limb),
      beat: coaxialBeat(card.beat),
      film: coaxialFilm(card.film),
      rate: coaxialRate(card.rate) ?? 2,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Coaxial[], id: string, edit: (card: Coaxial) => Coaxial): Coaxial[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCoaxial(cards: readonly Coaxial[], id: string, title: string): Coaxial[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCoaxialNote(cards: readonly Coaxial[], id: string, note: string): Coaxial[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(coaxialFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setCoaxialFilm(cards: readonly Coaxial[], id: string, film: string): Coaxial[] {
  const next = coaxialFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setCoaxialPoise(cards: readonly Coaxial[], id: string, poised: boolean): Coaxial[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setCoaxialPeg(cards: readonly Coaxial[], id: string, pegged: boolean): Coaxial[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setCoaxialCoffer(cards: readonly Coaxial[], id: string, coffered: boolean): Coaxial[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setCoaxialStar(cards: readonly Coaxial[], id: string, starred: boolean): Coaxial[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addCoaxialTag(cards: readonly Coaxial[], id: string, tag: string): Coaxial[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 3 | 9 | 15 | 21 {
  if (beat === null) return dir > 0 ? 3 : 21;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 2 | 5 | 8 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setCoaxialFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegCoaxialFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return setCoaxialPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starCoaxialFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  return setCoaxialStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Coaxial[], id: string): Coaxial[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCoaxialFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Coaxial[], ids: readonly string[], edit: (card: Coaxial) => Coaxial): Coaxial[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCoaxialGraphite(cards: readonly Coaxial[], ids: readonly string[]): Coaxial[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkCoaxialPoise(cards: readonly Coaxial[], ids: readonly string[]): Coaxial[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkCoaxialCoffer(cards: readonly Coaxial[], ids: readonly string[]): Coaxial[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkCoaxialTag(cards: readonly Coaxial[], ids: readonly string[]): Coaxial[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readCoaxialViews(raw: unknown): CoaxialView[] {
  if (!Array.isArray(raw)) return [];
  const out: CoaxialView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CoaxialView>;
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
      limb: activePart(row.limb),
      beat: activeTurn(row.beat),
      rate: activeSpring(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCoaxialView(views: readonly CoaxialView[], view: CoaxialView): CoaxialView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCoaxialViews([...views, { ...view, id, name }]);
}

export function dropCoaxialView(views: readonly CoaxialView[], id: string): CoaxialView[] {
  return views.filter((view) => view.id !== id);
}

export function coaxialDensity(raw: unknown): CoaxialDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortCoaxialRules(cards: readonly Coaxial[], sort: CoaxialSort): Coaxial[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "setter") {
      const setter = a.setter.localeCompare(b.setter);
      if (setter) return setter;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleCoaxialRules(
  cards: readonly Coaxial[],
  tray: CoaxialTray,
  query: string,
  setter: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Coaxial[] {
  const text = query.trim().toLowerCase();
  const wantSetter = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : coaxialFilm(film);
  const wantLimb = activePart(limb);
  const wantBeat = activeTurn(beat);
  const wantRate = activeSpring(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantSetter && card.setter.toLowerCase() !== wantSetter) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !coaxialInner(card.limb)) return false;
    if (wantLimb === "outer" && !coaxialOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueCoaxial(card: Coaxial): boolean {
  return coaxialOuter(card.limb) && card.rate === 2 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleCoaxial(card: Coaxial): boolean {
  return !card.film && card.beat === 3 && card.rate === 2 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskCoaxial(card: Coaxial): boolean {
  return card.film === "GILT" && card.beat === 21 && card.rate === 8 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingCoaxial(card: Coaxial): boolean {
  return card.limb === "locking" && card.film === "IVORY" && card.beat === 9;
}

/** A coaxial is late when the station is already on the impulse. */
export function lateCoaxial(card: Coaxial, station: string): boolean {
  return card.limb === "escape" && coaxialLimb(station) === "locking" && !card.poised;
}

export function coaxialCounts(cards: readonly Coaxial[], shown: readonly Coaxial[], station: string): CoaxialCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => coaxialInner(card.limb)).length,
    outer: cards.filter((card) => coaxialOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 21).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleCoaxial).length,
    brisk: cards.filter(briskCoaxial).length,
    resting: cards.filter(restingCoaxial).length,
    overdue: cards.filter(overdueCoaxial).length,
    pair: cards.filter((card) => pairSpring(card.rate) && lateCoaxial(card, station)).length,
  };
}

export function coaxialBars(cards: readonly Coaxial[]): { limb: string; count: number }[] {
  return CAX_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function coaxialTimeline(cards: readonly Coaxial[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function coaxialSetters(cards: readonly Coaxial[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestSetter(cards: readonly Coaxial[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.setter);
  let best = "";
  let score = 0;
  for (const name of coaxialSetters(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCoaxialRules(cards: readonly Coaxial[]): string[] {
  return cards.filter(overdueCoaxial).map((card) => card.title);
}

export function coaxialCopy(card: Coaxial): string {
  return [card.title, card.setter, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function coaxialCsv(cards: readonly Coaxial[], station: string): string {
  const lines = ["title,setter,limb,film,beat,rate,tags,poised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.setter),
        card.limb,
        card.film,
        card.beat ?? "",
        card.rate,
        card.tags.join(" "),
        card.poised ? "1" : "0",
        card.pegged ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        coaxialOuter(card.limb) ? "1" : "0",
        lateCoaxial(card, station) ? "1" : "0",
        idleCoaxial(card) ? "1" : "0",
        briskCoaxial(card) ? "1" : "0",
        restingCoaxial(card) ? "1" : "0",
        overdueCoaxial(card) ? "1" : "0",
        coaxialInner(card.limb) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        coaxialBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const ATP_KEY = "crmv4-typeplate-hide";
export const ATP_REVIEW_KEY = "crmv4-typeplate-review";

export type TypeplateLane = "" | "standard" | "vip" | "pro" | "demo" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type TypeplateHue = "" | "ivory" | "graphite" | "champagne";
export type TypeplateState = "" | "clear" | "set";
export type TypeplateReview = "all" | "reviewed" | "fresh";
export type TypeplateShape =
  | "all"
  | "standard"
  | "vip"
  | "pro"
  | "demo"
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

export type TypeplateValue = string | { accountType?: unknown; [key: string]: unknown } | null | undefined;
export type TypeplateRow = { id: string; label: string; code: TypeplateValue };
export type TypeplateLaneLine = { lane: string; count: number };

const CODE_LANES = ["standard", "vip", "pro", "demo", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: TypeplateValue): { accountType?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: TypeplateValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: TypeplateValue): string {
  const row = codeRecord(raw);
  if (row && !("accountType" in row)) return "";
  const value = row ? row.accountType : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "STANDARD";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: TypeplateValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("accountType" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function typeplateState(raw: TypeplateValue): TypeplateState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known account type is STANDARD, VIP, PRO, or DEMO. An ampersand joins two types. A pipe marks a pause. A bead is exactly five characters. A ribbon is fifteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function typeplateLane(raw: TypeplateValue): TypeplateLane {
  if (typeplateState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "STANDARD") return "standard";
    if (upper === "VIP") return "vip";
    if (upper === "PRO") return "pro";
    return "demo";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes("|")) return "gap";
  if (text.length === 5) return "bead";
  if (text.length >= 15) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function typeplateHue(raw: TypeplateValue): TypeplateHue {
  const lane = typeplateLane(raw);
  if (!lane) return "";
  if (lane === "standard" || lane === "pro") return "champagne";
  if (lane === "vip" || lane === "demo" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function typeplateStandard(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "standard";
}

export function typeplateVip(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "vip";
}

export function typeplatePro(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "pro";
}

export function typeplateDemo(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "demo";
}

export function typeplateJoin(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "join";
}

export function typeplateGap(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "gap";
}

export function typeplateBead(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "bead";
}

export function typeplateRibbon(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "ribbon";
}

export function typeplateMark(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "mark";
}

export function typeplateVowelLane(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "vowel";
}

export function typeplatePlain(raw: TypeplateValue): boolean {
  return typeplateLane(raw) === "plain";
}

export function typeplateOpen(raw: TypeplateValue): boolean {
  return typeplateState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function typeplateHeld(raw: TypeplateValue): boolean {
  const lane = typeplateLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function typeplateSoon(raw: TypeplateValue): boolean {
  if (typeplateState(raw) !== "set") return false;
  if (typeplateBead(raw)) return true;
  if (typeplateStandard(raw) || typeplateVip(raw) || typeplatePro(raw) || typeplateDemo(raw)) return false;
  return codeGiven(raw).length === 11;
}

export function typeplateLength(raw: TypeplateValue): number | null {
  if (typeplateState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function typeplateEven(raw: TypeplateValue): boolean {
  const length = typeplateLength(raw);
  return length !== null && length % 2 === 0;
}

export function typeplateOdd(raw: TypeplateValue): boolean {
  const length = typeplateLength(raw);
  return length !== null && length % 2 === 1;
}

export function typeplateFirst(raw: TypeplateValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function typeplateTail(raw: TypeplateValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function typeplateCapital(raw: TypeplateValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function typeplateSpace(raw: TypeplateValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function typeplateVowel(raw: TypeplateValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function typeplateDigit(raw: TypeplateValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function typeplateLetter(raw: TypeplateValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function typeplateMixed(raw: TypeplateValue): boolean {
  return typeplateDigit(raw) && typeplateLetter(raw);
}

export function typeplateLower(raw: TypeplateValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function typeplateUpper(raw: TypeplateValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function typeplateStamp(raw: TypeplateValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function typeplateCopy(raw: TypeplateValue): string {
  return codeGiven(raw);
}

export function typeplateFamily(raw: TypeplateValue): string {
  if (typeplateState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function typeplateLanes(rows: readonly TypeplateRow[]): TypeplateLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = typeplateLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTypeplate(rows: readonly TypeplateRow[]): string {
  const lines = typeplateLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingTypeplateHue(rows: readonly TypeplateRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = typeplateHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneTypeplateCount(rows: readonly TypeplateRow[], lane: TypeplateLane): number {
  return rows.filter((row) => typeplateLane(row.code) === lane).length;
}

export function typeplateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTypeplateLanes(rows: readonly TypeplateRow[]): string[] {
  return typeplateLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenTypeplate(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTypeplate(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTypeplate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTypeplateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTypeplateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTypeplateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: TypeplateRow, shape: TypeplateShape): boolean {
  if (shape === "all") return true;
  if (shape === "standard") return typeplateStandard(row.code);
  if (shape === "vip") return typeplateVip(row.code);
  if (shape === "pro") return typeplatePro(row.code);
  if (shape === "demo") return typeplateDemo(row.code);
  if (shape === "join") return typeplateJoin(row.code);
  if (shape === "gap") return typeplateGap(row.code);
  if (shape === "bead") return typeplateBead(row.code);
  if (shape === "ribbon") return typeplateRibbon(row.code);
  if (shape === "mark") return typeplateMark(row.code);
  if (shape === "vowel") return typeplateVowelLane(row.code);
  if (shape === "plain") return typeplatePlain(row.code);
  if (shape === "open") return typeplateOpen(row.code);
  if (shape === "soon") return typeplateSoon(row.code);
  if (shape === "letter") return typeplateLetter(row.code);
  if (shape === "mixed") return typeplateMixed(row.code);
  if (shape === "upper") return typeplateUpper(row.code);
  if (shape === "lower") return typeplateLower(row.code);
  if (shape === "space") return typeplateSpace(row.code);
  if (shape === "even") return typeplateEven(row.code);
  if (shape === "odd") return typeplateOdd(row.code);
  if (shape === "tail") return typeplateTail(row.code);
  if (shape === "first") return typeplateFirst(row.code);
  if (shape === "held") return typeplateHeld(row.code);
  return typeplateLane(row.code) === shape;
}

export function visibleTypeplate(
  rows: readonly TypeplateRow[],
  lane: string,
  hue: string,
  query: string,
  review: TypeplateReview,
  reviewed: readonly string[],
  shape: TypeplateShape,
): TypeplateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (typeplateState(row.code) === "") return false;
    const found = typeplateLane(row.code);
    const hueName = typeplateHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${typeplateStamp(row.code)} ${typeplateFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function typeplateLanesCsv(rows: readonly TypeplateRow[]): string {
  const lines = ["lane,count"];
  for (const line of typeplateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function typeplateRowsCsv(rows: readonly TypeplateRow[], reviewed: readonly string[]): string {
  const lines = ["name,state,stamp,family,lane,hue,length,usa,gbr,deu,tur,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(typeplateCopy(row.code)),
        typeplateStamp(row.code),
        csvCell(typeplateFamily(row.code)),
        typeplateLane(row.code),
        typeplateHue(row.code),
        typeplateLength(row.code) ?? "",
        typeplateStandard(row.code) ? "1" : "0",
        typeplateVip(row.code) ? "1" : "0",
        typeplatePro(row.code) ? "1" : "0",
        typeplateDemo(row.code) ? "1" : "0",
        typeplateJoin(row.code) ? "1" : "0",
        typeplateGap(row.code) ? "1" : "0",
        typeplateBead(row.code) ? "1" : "0",
        typeplateEven(row.code) ? "1" : "0",
        typeplateDigit(row.code) ? "1" : "0",
        typeplateMixed(row.code) ? "1" : "0",
        typeplateUpper(row.code) ? "1" : "0",
        typeplateVowel(row.code) ? "1" : "0",
        typeplateTail(row.code) ? "1" : "0",
        typeplateHeld(row.code) ? "1" : "0",
        typeplateSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
