/**
 * Oscillator rules for a balance wheel kept in this browser, and forename plates read the first name already stored on the account.
 * Parts are rim, arm, staff, and roller. Finishes are gilt, ivory, and graphite.
 * Amplitudes are 5, 15, 25, or 35. Poise steps are 4, 8, or 12.
 * A known forename is ANNA, NOAH, LEO, or MAX. An ampersand joins two forenames. A colon marks a pause.
 * A bead is exactly three characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true forename reads as ANNA. An empty forename reads as NONE. The plate does not change who can sign in.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_oscillator (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   poiser text not null default '',
 *   limb text not null default '',
 *   beat_no integer,
 *   film text not null default '',
 *   rate_no integer not null default 4,
 *   tags text not null default '',
 *   poised boolean not null default false,
 *   pegged boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_forename_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_forename_review (
 *   trader_id text primary key
 * );
 */
export const OSC_KEY = "crmv4-oscillator";
export const OSC_VIEW_KEY = "crmv4-oscillator-views";
export const OSC_DENSITY_KEY = "crmv4-oscillator-density";
export const OSC_LIMBS = ["rim", "arm", "staff", "roller"] as const;

export type OscillatorLimb = (typeof OSC_LIMBS)[number];
export type OscillatorFilm = "blank" | "gilt" | "ivory" | "graphite";
export type OscillatorTray = "board" | "peg" | "coffer";
export type OscillatorDensity = "airy" | "close";
export type OscillatorSort = "limb" | "poiser";

export type Oscillator = {
  id: string;
  title: string;
  note: string;
  poiser: string;
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

export type OscillatorView = {
  id: string;
  name: string;
  tray: OscillatorTray;
  query: string;
  poiser: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type OscillatorCounts = {
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

export const ROUND339_FEATURES = [
  "oscillator-save",
  "rim-notices",
  "oscillator-parts",
  "oscillator-search",
  "amplitude-sla",
  "vault-file",
  "pin-and-star",
  "inline-title",
  "oscillator-filters",
  "saved-oscillator-views",
  "oscillator-density",
  "poiser-sort",
  "oscillator-kpis",
  "amplitude-chart",
  "amplitude-timeline",
  "oscillator-bulk",
  "oscillator-csv",
  "oscillator-keys",
  "oscillator-audit",
  "fair-poiser",
  "oscillator-viewer",
  "suggest-rim",
  "overdue-amplitudes",
  "forename-plate",
  "forename-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [5, 15, 25, 35] as const;
const RATE_CYCLE = [4, 8, 12] as const;
const INNER = new Set(["rim", "arm"]);
const OUTER = new Set(["staff", "roller"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["ANNA", "NOAH", "LEO", "MAX"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): OscillatorTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<OscillatorFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<OscillatorFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Oscillator, tray: OscillatorTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return OSC_LIMBS.indexOf(limb as OscillatorLimb);
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

export function oscillatorLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (OSC_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** An amplitude is 5, 15, 25, or 35. Anything else stays blank. */
export function oscillatorBeat(raw: unknown): 5 | 15 | 25 | 35 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "15" && text !== "25" && text !== "35") return null;
  return Number(text) as 5 | 15 | 25 | 35;
}

/** A poise step is 4, 8, or 12. Anything else stays blank. */
export function oscillatorRate(raw: unknown): 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 4 | 8 | 12;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function oscillatorFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function oscillatorInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function oscillatorOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Hoop is the rim. Spoke is the arm. Pivot is the staff. Jewel is the roller. */
export function oscillatorBand(limb: unknown): string {
  const text = oscillatorLimb(limb);
  if (!text) return "";
  if (text === "rim") return "hoop";
  if (text === "arm") return "spoke";
  if (text === "staff") return "pivot";
  return "jewel";
}

/** Signed distance from one limb to another along the oscillator. */
export function oscillatorGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(oscillatorLimb(from));
  const right = limbIndex(oscillatorLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFinish(film: unknown): boolean {
  return QUIET_FILM.has(oscillatorFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairSpring(rate: unknown): boolean {
  return oscillatorRate(rate) === 8;
}

/** A full rate is 10. */
export function fullSpring(rate: unknown): boolean {
  return oscillatorRate(rate) === 12;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return oscillatorLimb(text) || "all";
}

export function activeTurn(raw: unknown): string {
  const beat = oscillatorBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = oscillatorFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeSpring(raw: unknown): string {
  const rate = oscillatorRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveOscillatorFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFinish(cards: readonly Oscillator[]): string {
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
export function suggestTurn(cards: readonly Oscillator[], hour: number): 5 | 15 | 25 | 35 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 15 | 25 | 35 = 5;
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
  if (hour < 4) return 5;
  if (hour < 10) return 15;
  if (hour < 16) return 25;
  return 35;
}

export function suggestPart(hour: number): OscillatorLimb {
  return hour < 8 ? "rim" : "roller";
}

/** The poiser with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairPoiser(cards: readonly Oscillator[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.poised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.poiser.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readOscillatorRules(raw: unknown): Oscillator[] {
  if (!Array.isArray(raw)) return [];
  const out: Oscillator[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Oscillator>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      poiser: clip(row.poiser, 24),
      limb: oscillatorLimb(row.limb),
      beat: oscillatorBeat(row.beat),
      film: oscillatorFilm(row.film),
      rate: oscillatorRate(row.rate) ?? 4,
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

export function addOscillator(
  cards: readonly Oscillator[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    poiser?: string;
    limb?: string;
    beat?: unknown;
    film?: string;
    rate?: unknown;
    tags?: unknown;
  },
): Oscillator[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOscillatorRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      poiser: clip(card.poiser, 24),
      limb: oscillatorLimb(card.limb),
      beat: oscillatorBeat(card.beat),
      film: oscillatorFilm(card.film),
      rate: oscillatorRate(card.rate) ?? 4,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Oscillator[], id: string, edit: (card: Oscillator) => Oscillator): Oscillator[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOscillator(cards: readonly Oscillator[], id: string, title: string): Oscillator[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOscillatorNote(cards: readonly Oscillator[], id: string, note: string): Oscillator[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(oscillatorFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setOscillatorFilm(cards: readonly Oscillator[], id: string, film: string): Oscillator[] {
  const next = oscillatorFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setOscillatorPoise(cards: readonly Oscillator[], id: string, poised: boolean): Oscillator[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setOscillatorPeg(cards: readonly Oscillator[], id: string, pegged: boolean): Oscillator[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setOscillatorCoffer(cards: readonly Oscillator[], id: string, coffered: boolean): Oscillator[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setOscillatorStar(cards: readonly Oscillator[], id: string, starred: boolean): Oscillator[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addOscillatorTag(cards: readonly Oscillator[], id: string, tag: string): Oscillator[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 5 | 15 | 25 | 35 {
  if (beat === null) return dir > 0 ? 5 : 35;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 4 | 8 | 12 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setOscillatorFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegOscillatorFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return setOscillatorPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starOscillatorFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  return setOscillatorStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Oscillator[], id: string): Oscillator[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOscillatorFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Oscillator[], ids: readonly string[], edit: (card: Oscillator) => Oscillator): Oscillator[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOscillatorGraphite(cards: readonly Oscillator[], ids: readonly string[]): Oscillator[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkOscillatorPoise(cards: readonly Oscillator[], ids: readonly string[]): Oscillator[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkOscillatorCoffer(cards: readonly Oscillator[], ids: readonly string[]): Oscillator[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkOscillatorTag(cards: readonly Oscillator[], ids: readonly string[]): Oscillator[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readOscillatorViews(raw: unknown): OscillatorView[] {
  if (!Array.isArray(raw)) return [];
  const out: OscillatorView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OscillatorView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      poiser: clip(row.poiser, 24),
      film: activeFinish(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activePart(row.limb),
      beat: activeTurn(row.beat),
      rate: activeSpring(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOscillatorView(views: readonly OscillatorView[], view: OscillatorView): OscillatorView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOscillatorViews([...views, { ...view, id, name }]);
}

export function dropOscillatorView(views: readonly OscillatorView[], id: string): OscillatorView[] {
  return views.filter((view) => view.id !== id);
}

export function oscillatorDensity(raw: unknown): OscillatorDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortOscillatorRules(cards: readonly Oscillator[], sort: OscillatorSort): Oscillator[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "poiser") {
      const poiser = a.poiser.localeCompare(b.poiser);
      if (poiser) return poiser;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleOscillatorRules(
  cards: readonly Oscillator[],
  tray: OscillatorTray,
  query: string,
  poiser: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Oscillator[] {
  const text = query.trim().toLowerCase();
  const wantPoiser = clip(poiser, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : oscillatorFilm(film);
  const wantLimb = activePart(limb);
  const wantBeat = activeTurn(beat);
  const wantRate = activeSpring(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.poiser}`.toLowerCase().includes(text)) return false;
    if (wantPoiser && card.poiser.toLowerCase() !== wantPoiser) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !oscillatorInner(card.limb)) return false;
    if (wantLimb === "outer" && !oscillatorOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueOscillator(card: Oscillator): boolean {
  return oscillatorOuter(card.limb) && card.rate === 4 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleOscillator(card: Oscillator): boolean {
  return !card.film && card.beat === 5 && card.rate === 4 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskOscillator(card: Oscillator): boolean {
  return card.film === "GILT" && card.beat === 35 && card.rate === 12 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingOscillator(card: Oscillator): boolean {
  return card.limb === "roller" && card.film === "IVORY" && card.beat === 15;
}

/** A oscillator is late when the station is already on the impulse. */
export function lateOscillator(card: Oscillator, station: string): boolean {
  return card.limb === "rim" && oscillatorLimb(station) === "roller" && !card.poised;
}

export function oscillatorCounts(cards: readonly Oscillator[], shown: readonly Oscillator[], station: string): OscillatorCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => oscillatorInner(card.limb)).length,
    outer: cards.filter((card) => oscillatorOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 35).length,
    quiet: cards.filter((card) => quietFinish(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleOscillator).length,
    brisk: cards.filter(briskOscillator).length,
    resting: cards.filter(restingOscillator).length,
    overdue: cards.filter(overdueOscillator).length,
    pair: cards.filter((card) => pairSpring(card.rate) && lateOscillator(card, station)).length,
  };
}

export function oscillatorBars(cards: readonly Oscillator[]): { limb: string; count: number }[] {
  return OSC_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function oscillatorTimeline(cards: readonly Oscillator[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function oscillatorPoisers(cards: readonly Oscillator[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.poiser && !out.some((name) => name.toLowerCase() === card.poiser.toLowerCase())) out.push(card.poiser);
  }
  return out;
}

export function busiestPoiser(cards: readonly Oscillator[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.poiser);
  let best = "";
  let score = 0;
  for (const name of oscillatorPoisers(open)) {
    const count = open.filter((card) => card.poiser.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOscillatorRules(cards: readonly Oscillator[]): string[] {
  return cards.filter(overdueOscillator).map((card) => card.title);
}

export function oscillatorCopy(card: Oscillator): string {
  return [card.title, card.poiser, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function oscillatorCsv(cards: readonly Oscillator[], station: string): string {
  const lines = ["title,poiser,limb,film,amplitude,poise,tags,poised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.poiser),
        card.limb,
        card.film,
        card.beat ?? "",
        card.rate,
        card.tags.join(" "),
        card.poised ? "1" : "0",
        card.pegged ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        oscillatorOuter(card.limb) ? "1" : "0",
        lateOscillator(card, station) ? "1" : "0",
        idleOscillator(card) ? "1" : "0",
        briskOscillator(card) ? "1" : "0",
        restingOscillator(card) ? "1" : "0",
        overdueOscillator(card) ? "1" : "0",
        oscillatorInner(card.limb) ? "1" : "0",
        quietFinish(card.film) ? "1" : "0",
        oscillatorBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const FNM_KEY = "crmv4-forename-hide";
export const FNM_REVIEW_KEY = "crmv4-forename-review";

export type ForenameLane = "" | "anna" | "noah" | "leo" | "max" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type ForenameHue = "" | "ivory" | "graphite" | "champagne";
export type ForenameState = "" | "clear" | "set";
export type ForenameReview = "all" | "reviewed" | "fresh";
export type ForenameShape =
  | "all"
  | "anna"
  | "noah"
  | "leo"
  | "max"
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

export type ForenameValue = string | { firstName?: unknown; [key: string]: unknown } | null | undefined;
export type ForenameRow = { id: string; label: string; code: ForenameValue };
export type ForenameLaneLine = { lane: string; count: number };

const CODE_LANES = ["anna", "noah", "leo", "max", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: ForenameValue): { firstName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ForenameValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ForenameValue): string {
  const row = codeRecord(raw);
  if (row && !("firstName" in row)) return "";
  const value = row ? row.firstName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ANNA";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: ForenameValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("firstName" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function forenameState(raw: ForenameValue): ForenameState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known forename is ANNA, NOAH, LEO, or MAX. An ampersand joins two forenames. A colon marks a pause. A bead is exactly three characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function forenameLane(raw: ForenameValue): ForenameLane {
  if (forenameState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "ANNA") return "anna";
    if (upper === "NOAH") return "noah";
    if (upper === "LEO") return "leo";
    return "max";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(":")) return "gap";
  if (text.length === 3) return "bead";
  if (text.length >= 18) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function forenameHue(raw: ForenameValue): ForenameHue {
  const lane = forenameLane(raw);
  if (!lane) return "";
  if (lane === "anna" || lane === "leo") return "champagne";
  if (lane === "noah" || lane === "max" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function forenameAnna(raw: ForenameValue): boolean {
  return forenameLane(raw) === "anna";
}

export function forenameNoah(raw: ForenameValue): boolean {
  return forenameLane(raw) === "noah";
}

export function forenameLeo(raw: ForenameValue): boolean {
  return forenameLane(raw) === "leo";
}

export function forenameMax(raw: ForenameValue): boolean {
  return forenameLane(raw) === "max";
}

export function forenameJoin(raw: ForenameValue): boolean {
  return forenameLane(raw) === "join";
}

export function forenameGap(raw: ForenameValue): boolean {
  return forenameLane(raw) === "gap";
}

export function forenameBead(raw: ForenameValue): boolean {
  return forenameLane(raw) === "bead";
}

export function forenameRibbon(raw: ForenameValue): boolean {
  return forenameLane(raw) === "ribbon";
}

export function forenameMark(raw: ForenameValue): boolean {
  return forenameLane(raw) === "mark";
}

export function forenameVowelLane(raw: ForenameValue): boolean {
  return forenameLane(raw) === "vowel";
}

export function forenamePlain(raw: ForenameValue): boolean {
  return forenameLane(raw) === "plain";
}

export function forenameOpen(raw: ForenameValue): boolean {
  return forenameState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function forenameHeld(raw: ForenameValue): boolean {
  const lane = forenameLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function forenameSoon(raw: ForenameValue): boolean {
  if (forenameState(raw) !== "set") return false;
  if (forenameBead(raw)) return true;
  if (forenameAnna(raw) || forenameNoah(raw) || forenameLeo(raw) || forenameMax(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function forenameLength(raw: ForenameValue): number | null {
  if (forenameState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function forenameEven(raw: ForenameValue): boolean {
  const length = forenameLength(raw);
  return length !== null && length % 2 === 0;
}

export function forenameOdd(raw: ForenameValue): boolean {
  const length = forenameLength(raw);
  return length !== null && length % 2 === 1;
}

export function forenameFirst(raw: ForenameValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function forenameTail(raw: ForenameValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function forenameCapital(raw: ForenameValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function forenameSpace(raw: ForenameValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function forenameVowel(raw: ForenameValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function forenameDigit(raw: ForenameValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function forenameLetter(raw: ForenameValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function forenameMixed(raw: ForenameValue): boolean {
  return forenameDigit(raw) && forenameLetter(raw);
}

export function forenameLower(raw: ForenameValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function forenameUpper(raw: ForenameValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function forenameStamp(raw: ForenameValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function forenameCopy(raw: ForenameValue): string {
  return codeGiven(raw);
}

export function forenameFamily(raw: ForenameValue): string {
  if (forenameState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function forenameLanes(rows: readonly ForenameRow[]): ForenameLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = forenameLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingForename(rows: readonly ForenameRow[]): string {
  const lines = forenameLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingForenameHue(rows: readonly ForenameRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = forenameHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneForenameCount(rows: readonly ForenameRow[], lane: ForenameLane): number {
  return rows.filter((row) => forenameLane(row.code) === lane).length;
}

export function forenameShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentForenameLanes(rows: readonly ForenameRow[]): string[] {
  return forenameLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenForename(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedForename(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleForename(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleForenameReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkForenameReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleForenameLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: ForenameRow, shape: ForenameShape): boolean {
  if (shape === "all") return true;
  if (shape === "anna") return forenameAnna(row.code);
  if (shape === "noah") return forenameNoah(row.code);
  if (shape === "leo") return forenameLeo(row.code);
  if (shape === "max") return forenameMax(row.code);
  if (shape === "join") return forenameJoin(row.code);
  if (shape === "gap") return forenameGap(row.code);
  if (shape === "bead") return forenameBead(row.code);
  if (shape === "ribbon") return forenameRibbon(row.code);
  if (shape === "mark") return forenameMark(row.code);
  if (shape === "vowel") return forenameVowelLane(row.code);
  if (shape === "plain") return forenamePlain(row.code);
  if (shape === "open") return forenameOpen(row.code);
  if (shape === "soon") return forenameSoon(row.code);
  if (shape === "letter") return forenameLetter(row.code);
  if (shape === "mixed") return forenameMixed(row.code);
  if (shape === "upper") return forenameUpper(row.code);
  if (shape === "lower") return forenameLower(row.code);
  if (shape === "space") return forenameSpace(row.code);
  if (shape === "even") return forenameEven(row.code);
  if (shape === "odd") return forenameOdd(row.code);
  if (shape === "tail") return forenameTail(row.code);
  if (shape === "first") return forenameFirst(row.code);
  if (shape === "held") return forenameHeld(row.code);
  return forenameLane(row.code) === shape;
}

export function visibleForename(
  rows: readonly ForenameRow[],
  lane: string,
  hue: string,
  query: string,
  review: ForenameReview,
  reviewed: readonly string[],
  shape: ForenameShape,
): ForenameRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (forenameState(row.code) === "") return false;
    const found = forenameLane(row.code);
    const hueName = forenameHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${forenameStamp(row.code)} ${forenameFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function forenameLanesCsv(rows: readonly ForenameRow[]): string {
  const lines = ["lane,count"];
  for (const line of forenameLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function forenameRowsCsv(rows: readonly ForenameRow[], reviewed: readonly string[]): string {
  const lines = ["name,forename,stamp,family,lane,hue,length,anna,noah,leo,max,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(forenameCopy(row.code)),
        forenameStamp(row.code),
        csvCell(forenameFamily(row.code)),
        forenameLane(row.code),
        forenameHue(row.code),
        forenameLength(row.code) ?? "",
        forenameAnna(row.code) ? "1" : "0",
        forenameNoah(row.code) ? "1" : "0",
        forenameLeo(row.code) ? "1" : "0",
        forenameMax(row.code) ? "1" : "0",
        forenameJoin(row.code) ? "1" : "0",
        forenameGap(row.code) ? "1" : "0",
        forenameBead(row.code) ? "1" : "0",
        forenameEven(row.code) ? "1" : "0",
        forenameDigit(row.code) ? "1" : "0",
        forenameMixed(row.code) ? "1" : "0",
        forenameUpper(row.code) ? "1" : "0",
        forenameVowel(row.code) ? "1" : "0",
        forenameTail(row.code) ? "1" : "0",
        forenameHeld(row.code) ? "1" : "0",
        forenameSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
