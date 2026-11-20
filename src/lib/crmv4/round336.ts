/**
 * Barrel rules for a going barrel kept in this browser, and backstaff plates read the country already stored on the account.
 * Parts are arbor, drum, click, and ratchet. Finishes are gilt, ivory, and graphite.
 * Turns are 4, 8, 16, or 32. Springs are 1, 4, or 7.
 * A known country is USA, GBR, DEU, or TUR. A plus joins two countries. A semicolon marks a pause.
 * A bead is exactly eight characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true country reads as USA. An empty country reads as NONE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_barrel (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   striker text not null default '',
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
 * CREATE TABLE crm_backstaff_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_backstaff_review (
 *   trader_id text primary key
 * );
 */
export const BRL_KEY = "crmv4-barrel";
export const BRL_VIEW_KEY = "crmv4-barrel-views";
export const BRL_DENSITY_KEY = "crmv4-barrel-density";
export const BRL_LIMBS = ["arbor", "drum", "click", "ratchet"] as const;

export type BarrelLimb = (typeof BRL_LIMBS)[number];
export type BarrelFilm = "blank" | "gilt" | "ivory" | "graphite";
export type BarrelTray = "board" | "peg" | "coffer";
export type BarrelDensity = "airy" | "close";
export type BarrelSort = "limb" | "striker";

export type Barrel = {
  id: string;
  title: string;
  note: string;
  striker: string;
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

export type BarrelView = {
  id: string;
  name: string;
  tray: BarrelTray;
  query: string;
  striker: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type BarrelCounts = {
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

export const ROUND336_FEATURES = [
  "barrel-save",
  "arbor-notices",
  "barrel-parts",
  "barrel-search",
  "wind-sla",
  "chest",
  "pin-star",
  "inline-edit",
  "barrel-filters",
  "saved-views",
  "bench-density",
  "winder-sort",
  "bench-kpis",
  "turn-chart",
  "turn-timeline",
  "bulk-actions",
  "csv-export",
  "keyboard-shortcuts",
  "audit-trail",
  "fair-winder",
  "viewer-role",
  "suggest-arbor",
  "overdue-reminders",
  "country-backstaff",
  "backstaff-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [4, 8, 16, 32] as const;
const RATE_CYCLE = [1, 4, 7] as const;
const INNER = new Set(["arbor", "drum"]);
const OUTER = new Set(["click", "ratchet"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["USA", "GBR", "DEU", "TUR"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BarrelTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<BarrelFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<BarrelFilm, "blank">) : "";
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

function inTray(card: Barrel, tray: BarrelTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return BRL_LIMBS.indexOf(limb as BarrelLimb);
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

export function barrelLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (BRL_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A turn is 4, 8, 16, or 32. Anything else stays blank. */
export function barrelBeat(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A spring is 1, 4, or 7. Anything else stays blank. */
export function barrelRate(raw: unknown): 1 | 4 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "7") return null;
  return Number(text) as 1 | 4 | 7;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function barrelFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function barrelInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function barrelOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Drum is the barrel. Axle is the arbor. Eye is the hook. Pawl is the click. */
export function barrelBand(limb: unknown): string {
  const text = barrelLimb(limb);
  if (!text) return "";
  if (text === "arbor") return "hook";
  if (text === "drum") return "shell";
  if (text === "click") return "pawl";
  return "wheel";
}

/** Signed distance from one limb to another along the barrel. */
export function barrelGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(barrelLimb(from));
  const right = limbIndex(barrelLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(barrelFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairSpring(rate: unknown): boolean {
  return barrelRate(rate) === 4;
}

/** A full rate is 10. */
export function fullSpring(rate: unknown): boolean {
  return barrelRate(rate) === 7;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return barrelLimb(text) || "all";
}

export function activeTurn(raw: unknown): string {
  const beat = barrelBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = barrelFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSpring(raw: unknown): string {
  const rate = barrelRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveBarrelFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Barrel[]): string {
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
export function suggestTurn(cards: readonly Barrel[], hour: number): 4 | 8 | 16 | 32 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 32 = 4;
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
  if (hour < 6) return 4;
  if (hour < 12) return 8;
  if (hour < 18) return 16;
  return 32;
}

/** Before eight, suggest the barrel. The fax of the day suggests the click. */
export function suggestPart(hour: number): BarrelLimb {
  return hour < 8 ? "arbor" : "ratchet";
}

/** The striker with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairWinder(cards: readonly Barrel[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.poised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.striker.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readBarrelRules(raw: unknown): Barrel[] {
  if (!Array.isArray(raw)) return [];
  const out: Barrel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Barrel>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      striker: clip(row.striker, 24),
      limb: barrelLimb(row.limb),
      beat: barrelBeat(row.beat),
      film: barrelFilm(row.film),
      rate: barrelRate(row.rate) ?? 1,
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

export function addBarrel(
  cards: readonly Barrel[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    striker?: string;
    limb?: string;
    beat?: unknown;
    film?: string;
    rate?: unknown;
    tags?: unknown;
  },
): Barrel[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readBarrelRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      striker: clip(card.striker, 24),
      limb: barrelLimb(card.limb),
      beat: barrelBeat(card.beat),
      film: barrelFilm(card.film),
      rate: barrelRate(card.rate) ?? 1,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Barrel[], id: string, edit: (card: Barrel) => Barrel): Barrel[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editBarrel(cards: readonly Barrel[], id: string, title: string): Barrel[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBarrelNote(cards: readonly Barrel[], id: string, note: string): Barrel[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(barrelFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setBarrelFilm(cards: readonly Barrel[], id: string, film: string): Barrel[] {
  const next = barrelFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setBarrelPoise(cards: readonly Barrel[], id: string, poised: boolean): Barrel[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setBarrelPeg(cards: readonly Barrel[], id: string, pegged: boolean): Barrel[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setBarrelCoffer(cards: readonly Barrel[], id: string, coffered: boolean): Barrel[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setBarrelStar(cards: readonly Barrel[], id: string, starred: boolean): Barrel[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addBarrelTag(cards: readonly Barrel[], id: string, tag: string): Barrel[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 4 | 8 | 16 | 32 {
  if (beat === null) return dir > 0 ? 4 : 32;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 1 | 4 | 7 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setBarrelFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegBarrelFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return setBarrelPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starBarrelFocused(cards: readonly Barrel[], id: string): Barrel[] {
  return setBarrelStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Barrel[], id: string): Barrel[] {
  const card = cards.find((item) => item.id === id);
  return card ? setBarrelFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Barrel[], ids: readonly string[], edit: (card: Barrel) => Barrel): Barrel[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkBarrelGraphite(cards: readonly Barrel[], ids: readonly string[]): Barrel[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkBarrelPoise(cards: readonly Barrel[], ids: readonly string[]): Barrel[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkBarrelCoffer(cards: readonly Barrel[], ids: readonly string[]): Barrel[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkBarrelTag(cards: readonly Barrel[], ids: readonly string[]): Barrel[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readBarrelViews(raw: unknown): BarrelView[] {
  if (!Array.isArray(raw)) return [];
  const out: BarrelView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BarrelView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      striker: clip(row.striker, 24),
      film: activeFinish(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activePart(row.limb),
      beat: activeTurn(row.beat),
      rate: activeSpring(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBarrelView(views: readonly BarrelView[], view: BarrelView): BarrelView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readBarrelViews([...views, { ...view, id, name }]);
}

export function dropBarrelView(views: readonly BarrelView[], id: string): BarrelView[] {
  return views.filter((view) => view.id !== id);
}

export function barrelDensity(raw: unknown): BarrelDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortBarrelRules(cards: readonly Barrel[], sort: BarrelSort): Barrel[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "striker") {
      const striker = a.striker.localeCompare(b.striker);
      if (striker) return striker;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleBarrelRules(
  cards: readonly Barrel[],
  tray: BarrelTray,
  query: string,
  striker: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Barrel[] {
  const text = query.trim().toLowerCase();
  const wantStriker = clip(striker, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : barrelFilm(film);
  const wantLimb = activePart(limb);
  const wantBeat = activeTurn(beat);
  const wantRate = activeSpring(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.striker}`.toLowerCase().includes(text)) return false;
    if (wantStriker && card.striker.toLowerCase() !== wantStriker) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !barrelInner(card.limb)) return false;
    if (wantLimb === "outer" && !barrelOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueBarrel(card: Barrel): boolean {
  return barrelOuter(card.limb) && card.rate === 1 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleBarrel(card: Barrel): boolean {
  return !card.film && card.beat === 4 && card.rate === 1 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskBarrel(card: Barrel): boolean {
  return card.film === "GILT" && card.beat === 32 && card.rate === 7 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingBarrel(card: Barrel): boolean {
  return card.limb === "ratchet" && card.film === "IVORY" && card.beat === 8;
}

/** A barrel is late when the station is already on the click. */
export function lateBarrel(card: Barrel, station: string): boolean {
  return card.limb === "arbor" && barrelLimb(station) === "ratchet" && !card.poised;
}

export function barrelCounts(cards: readonly Barrel[], shown: readonly Barrel[], station: string): BarrelCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => barrelInner(card.limb)).length,
    outer: cards.filter((card) => barrelOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 32).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleBarrel).length,
    brisk: cards.filter(briskBarrel).length,
    resting: cards.filter(restingBarrel).length,
    overdue: cards.filter(overdueBarrel).length,
    pair: cards.filter((card) => pairSpring(card.rate) && lateBarrel(card, station)).length,
  };
}

export function barrelBars(cards: readonly Barrel[]): { limb: string; count: number }[] {
  return BRL_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function barrelTimeline(cards: readonly Barrel[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function barrelWinders(cards: readonly Barrel[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.striker && !out.some((name) => name.toLowerCase() === card.striker.toLowerCase())) out.push(card.striker);
  }
  return out;
}

export function busiestWinder(cards: readonly Barrel[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.striker);
  let best = "";
  let score = 0;
  for (const name of barrelWinders(open)) {
    const count = open.filter((card) => card.striker.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderBarrelRules(cards: readonly Barrel[]): string[] {
  return cards.filter(overdueBarrel).map((card) => card.title);
}

export function barrelCopy(card: Barrel): string {
  return [card.title, card.striker, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function barrelCsv(cards: readonly Barrel[], station: string): string {
  const lines = ["title,striker,limb,film,beat,rate,tags,poised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.striker),
        card.limb,
        card.film,
        card.beat ?? "",
        card.rate,
        card.tags.join(" "),
        card.poised ? "1" : "0",
        card.pegged ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        barrelOuter(card.limb) ? "1" : "0",
        lateBarrel(card, station) ? "1" : "0",
        idleBarrel(card) ? "1" : "0",
        briskBarrel(card) ? "1" : "0",
        restingBarrel(card) ? "1" : "0",
        overdueBarrel(card) ? "1" : "0",
        barrelInner(card.limb) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        barrelBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const BKS_KEY = "crmv4-backstaff-hide";
export const BKS_REVIEW_KEY = "crmv4-backstaff-review";

export type BackstaffLane = "" | "usa" | "gbr" | "deu" | "tur" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type BackstaffHue = "" | "ivory" | "graphite" | "champagne";
export type BackstaffState = "" | "clear" | "set";
export type BackstaffReview = "all" | "reviewed" | "fresh";
export type BackstaffShape =
  | "all"
  | "usa"
  | "gbr"
  | "deu"
  | "tur"
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

export type BackstaffValue = string | { country?: unknown; [key: string]: unknown } | null | undefined;
export type BackstaffRow = { id: string; label: string; code: BackstaffValue };
export type BackstaffLaneLine = { lane: string; count: number };

const CODE_LANES = ["usa", "gbr", "deu", "tur", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: BackstaffValue): { country?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: BackstaffValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: BackstaffValue): string {
  const row = codeRecord(raw);
  if (row && !("country" in row)) return "";
  const value = row ? row.country : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "USA";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: BackstaffValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("country" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function backstaffState(raw: BackstaffValue): BackstaffState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known city is NYC, LON, PAR, or DXB. An ampersand joins two cities. A semicolon marks a gap. A bead is exactly eight characters. A ribbon is twenty characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function backstaffLane(raw: BackstaffValue): BackstaffLane {
  if (backstaffState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "USA") return "usa";
    if (upper === "GBR") return "gbr";
    if (upper === "DEU") return "deu";
    return "tur";
  }
  if (text === "NONE") return "plain";
  if (text.includes("+")) return "join";
  if (text.includes(";")) return "gap";
  if (text.length === 8) return "bead";
  if (text.length >= 18) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function backstaffHue(raw: BackstaffValue): BackstaffHue {
  const lane = backstaffLane(raw);
  if (!lane) return "";
  if (lane === "usa" || lane === "deu") return "champagne";
  if (lane === "gbr" || lane === "tur" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function backstaffUsa(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "usa";
}

export function backstaffGbr(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "gbr";
}

export function backstaffDeu(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "deu";
}

export function backstaffTur(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "tur";
}

export function backstaffJoin(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "join";
}

export function backstaffGap(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "gap";
}

export function backstaffBead(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "bead";
}

export function backstaffRibbon(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "ribbon";
}

export function backstaffMark(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "mark";
}

export function backstaffVowelLane(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "vowel";
}

export function backstaffPlain(raw: BackstaffValue): boolean {
  return backstaffLane(raw) === "plain";
}

export function backstaffOpen(raw: BackstaffValue): boolean {
  return backstaffState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function backstaffHeld(raw: BackstaffValue): boolean {
  const lane = backstaffLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function backstaffSoon(raw: BackstaffValue): boolean {
  if (backstaffState(raw) !== "set") return false;
  if (backstaffBead(raw)) return true;
  if (backstaffUsa(raw) || backstaffGbr(raw) || backstaffDeu(raw) || backstaffTur(raw)) return false;
  return codeGiven(raw).length === 10;
}

export function backstaffLength(raw: BackstaffValue): number | null {
  if (backstaffState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function backstaffEven(raw: BackstaffValue): boolean {
  const length = backstaffLength(raw);
  return length !== null && length % 2 === 0;
}

export function backstaffOdd(raw: BackstaffValue): boolean {
  const length = backstaffLength(raw);
  return length !== null && length % 2 === 1;
}

export function backstaffFirst(raw: BackstaffValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function backstaffTail(raw: BackstaffValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function backstaffCapital(raw: BackstaffValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function backstaffSpace(raw: BackstaffValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function backstaffVowel(raw: BackstaffValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function backstaffDigit(raw: BackstaffValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function backstaffLetter(raw: BackstaffValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function backstaffMixed(raw: BackstaffValue): boolean {
  return backstaffDigit(raw) && backstaffLetter(raw);
}

export function backstaffLower(raw: BackstaffValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function backstaffUpper(raw: BackstaffValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function backstaffStamp(raw: BackstaffValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function backstaffCopy(raw: BackstaffValue): string {
  return codeGiven(raw);
}

export function backstaffFamily(raw: BackstaffValue): string {
  if (backstaffState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function backstaffLanes(rows: readonly BackstaffRow[]): BackstaffLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = backstaffLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingBackstaff(rows: readonly BackstaffRow[]): string {
  const lines = backstaffLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingBackstaffHue(rows: readonly BackstaffRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = backstaffHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneBackstaffCount(rows: readonly BackstaffRow[], lane: BackstaffLane): number {
  return rows.filter((row) => backstaffLane(row.code) === lane).length;
}

export function backstaffShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentBackstaffLanes(rows: readonly BackstaffRow[]): string[] {
  return backstaffLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenBackstaff(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedBackstaff(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleBackstaff(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleBackstaffReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkBackstaffReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleBackstaffLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: BackstaffRow, shape: BackstaffShape): boolean {
  if (shape === "all") return true;
  if (shape === "usa") return backstaffUsa(row.code);
  if (shape === "gbr") return backstaffGbr(row.code);
  if (shape === "deu") return backstaffDeu(row.code);
  if (shape === "tur") return backstaffTur(row.code);
  if (shape === "join") return backstaffJoin(row.code);
  if (shape === "gap") return backstaffGap(row.code);
  if (shape === "bead") return backstaffBead(row.code);
  if (shape === "ribbon") return backstaffRibbon(row.code);
  if (shape === "mark") return backstaffMark(row.code);
  if (shape === "vowel") return backstaffVowelLane(row.code);
  if (shape === "plain") return backstaffPlain(row.code);
  if (shape === "open") return backstaffOpen(row.code);
  if (shape === "soon") return backstaffSoon(row.code);
  if (shape === "letter") return backstaffLetter(row.code);
  if (shape === "mixed") return backstaffMixed(row.code);
  if (shape === "upper") return backstaffUpper(row.code);
  if (shape === "lower") return backstaffLower(row.code);
  if (shape === "space") return backstaffSpace(row.code);
  if (shape === "even") return backstaffEven(row.code);
  if (shape === "odd") return backstaffOdd(row.code);
  if (shape === "tail") return backstaffTail(row.code);
  if (shape === "first") return backstaffFirst(row.code);
  if (shape === "held") return backstaffHeld(row.code);
  return backstaffLane(row.code) === shape;
}

export function visibleBackstaff(
  rows: readonly BackstaffRow[],
  lane: string,
  hue: string,
  query: string,
  review: BackstaffReview,
  reviewed: readonly string[],
  shape: BackstaffShape,
): BackstaffRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (backstaffState(row.code) === "") return false;
    const found = backstaffLane(row.code);
    const hueName = backstaffHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${backstaffStamp(row.code)} ${backstaffFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function backstaffLanesCsv(rows: readonly BackstaffRow[]): string {
  const lines = ["lane,count"];
  for (const line of backstaffLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function backstaffRowsCsv(rows: readonly BackstaffRow[], reviewed: readonly string[]): string {
  const lines = ["name,state,stamp,family,lane,hue,length,usa,gbr,deu,tur,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(backstaffCopy(row.code)),
        backstaffStamp(row.code),
        csvCell(backstaffFamily(row.code)),
        backstaffLane(row.code),
        backstaffHue(row.code),
        backstaffLength(row.code) ?? "",
        backstaffUsa(row.code) ? "1" : "0",
        backstaffGbr(row.code) ? "1" : "0",
        backstaffDeu(row.code) ? "1" : "0",
        backstaffTur(row.code) ? "1" : "0",
        backstaffJoin(row.code) ? "1" : "0",
        backstaffGap(row.code) ? "1" : "0",
        backstaffBead(row.code) ? "1" : "0",
        backstaffEven(row.code) ? "1" : "0",
        backstaffDigit(row.code) ? "1" : "0",
        backstaffMixed(row.code) ? "1" : "0",
        backstaffUpper(row.code) ? "1" : "0",
        backstaffVowel(row.code) ? "1" : "0",
        backstaffTail(row.code) ? "1" : "0",
        backstaffHeld(row.code) ? "1" : "0",
        backstaffSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
