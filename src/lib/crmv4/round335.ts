/**
 * Repeater rules for a minute repeater kept in this browser, and gong plates read the trading group already stored on the account.
 * Parts are rack, snail, hammer, and gong. Finishes are gilt, ivory, and graphite.
 * Quarters are 3, 6, 12, or 24. Strikes are 2, 5, or 8.
 * A known group is CORE, EDGE, PRIME, or VAULT. A slash joins two groups. A colon marks a pause.
 * A bead is exactly seven characters. A ribbon is sixteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true group reads as CORE. An empty group reads as NONE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_repeater (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   striker text not null default '',
 *   limb text not null default '',
 *   beat_no integer,
 *   film text not null default '',
 *   rate_no integer not null default 2,
 *   tags text not null default '',
 *   poised boolean not null default false,
 *   pegged boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_gong_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_gong_review (
 *   trader_id text primary key
 * );
 */
export const RPT_KEY = "crmv4-repeater";
export const RPT_VIEW_KEY = "crmv4-repeater-views";
export const RPT_DENSITY_KEY = "crmv4-repeater-density";
export const RPT_LIMBS = ["rack", "snail", "hammer", "gong"] as const;

export type RepeaterLimb = (typeof RPT_LIMBS)[number];
export type RepeaterFilm = "blank" | "gilt" | "ivory" | "graphite";
export type RepeaterTray = "board" | "peg" | "coffer";
export type RepeaterDensity = "airy" | "close";
export type RepeaterSort = "limb" | "striker";

export type Repeater = {
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

export type RepeaterView = {
  id: string;
  name: string;
  tray: RepeaterTray;
  query: string;
  striker: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type RepeaterCounts = {
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

export const ROUND335_FEATURES = [
  "repeater-save",
  "rack-notices",
  "repeater-parts",
  "repeater-search",
  "strike-sla",
  "casket",
  "pin-star",
  "inline-edit",
  "repeater-filters",
  "saved-views",
  "bench-density",
  "striker-sort",
  "bench-kpis",
  "quarter-chart",
  "quarter-timeline",
  "bulk-actions",
  "csv-export",
  "keyboard-shortcuts",
  "audit-trail",
  "fair-striker",
  "viewer-role",
  "suggest-rack",
  "overdue-reminders",
  "group-gong",
  "gong-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [3, 6, 12, 24] as const;
const RATE_CYCLE = [2, 5, 8] as const;
const INNER = new Set(["rack", "snail"]);
const OUTER = new Set(["hammer", "gong"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["CORE", "EDGE", "PRIME", "VAULT"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RepeaterTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<RepeaterFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<RepeaterFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[rs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Repeater, tray: RepeaterTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return RPT_LIMBS.indexOf(limb as RepeaterLimb);
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

export function repeaterLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (RPT_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A beat is 2, 5, 8, or 11. Anything else stays blank. */
/** An angle is 5, 10, 15, or 20. Anything else stays blank. */
export function repeaterBeat(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A rate is 2, 6, or 10. Anything else stays blank. */
/** A spring is 1, 4, or 7. Anything else stays blank. */
export function repeaterRate(raw: unknown): 2 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8") return null;
  return Number(text) as 2 | 5 | 8;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function repeaterFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function repeaterInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function repeaterOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Drum is the barrel. Axle is the arbor. Eye is the hook. Pawl is the click. */
export function repeaterBand(limb: unknown): string {
  const text = repeaterLimb(limb);
  if (!text) return "";
  if (text === "rack") return "tooth";
  if (text === "snail") return "cam";
  if (text === "hammer") return "head";
  return "wire";
}

/** Signed distance from one limb to another along the repeater. */
export function repeaterGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(repeaterLimb(from));
  const right = limbIndex(repeaterLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFilm(film: unknown): boolean {
  return QUIET_FILM.has(repeaterFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairRate(rate: unknown): boolean {
  return repeaterRate(rate) === 5;
}

/** A full rate is 10. */
export function fullRate(rate: unknown): boolean {
  return repeaterRate(rate) === 8;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return repeaterLimb(text) || "all";
}

export function activeBeat(raw: unknown): string {
  const beat = repeaterBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = repeaterFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRate(raw: unknown): string {
  const rate = repeaterRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveRepeaterFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFilm(cards: readonly Repeater[]): string {
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
export function suggestBeat(cards: readonly Repeater[], hour: number): 3 | 6 | 12 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 12 | 24 = 3;
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
  if (hour < 7) return 3;
  if (hour < 13) return 6;
  if (hour < 19) return 12;
  return 24;
}

/** Before eight, suggest the barrel. The fax of the day suggests the click. */
export function suggestLimb(hour: number): RepeaterLimb {
  return hour < 9 ? "rack" : "gong";
}

/** The striker with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairStriker(cards: readonly Repeater[], roster: string): string {
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

export function readRepeaterRules(raw: unknown): Repeater[] {
  if (!Array.isArray(raw)) return [];
  const out: Repeater[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Repeater>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      striker: clip(row.striker, 24),
      limb: repeaterLimb(row.limb),
      beat: repeaterBeat(row.beat),
      film: repeaterFilm(row.film),
      rate: repeaterRate(row.rate) ?? 2,
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

export function addRepeater(
  cards: readonly Repeater[],
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
): Repeater[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `r${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRepeaterRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      striker: clip(card.striker, 24),
      limb: repeaterLimb(card.limb),
      beat: repeaterBeat(card.beat),
      film: repeaterFilm(card.film),
      rate: repeaterRate(card.rate) ?? 2,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Repeater[], id: string, edit: (card: Repeater) => Repeater): Repeater[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRepeater(cards: readonly Repeater[], id: string, title: string): Repeater[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRepeaterNote(cards: readonly Repeater[], id: string, note: string): Repeater[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(repeaterFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setRepeaterFilm(cards: readonly Repeater[], id: string, film: string): Repeater[] {
  const next = repeaterFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setRepeaterPoise(cards: readonly Repeater[], id: string, poised: boolean): Repeater[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setRepeaterPeg(cards: readonly Repeater[], id: string, pegged: boolean): Repeater[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setRepeaterCoffer(cards: readonly Repeater[], id: string, coffered: boolean): Repeater[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setRepeaterStar(cards: readonly Repeater[], id: string, starred: boolean): Repeater[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addRepeaterTag(cards: readonly Repeater[], id: string, tag: string): Repeater[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 3 | 6 | 12 | 24 {
  if (beat === null) return dir > 0 ? 3 : 24;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 2 | 5 | 8 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setRepeaterFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegRepeaterFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return setRepeaterPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starRepeaterFocused(cards: readonly Repeater[], id: string): Repeater[] {
  return setRepeaterStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Repeater[], id: string): Repeater[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRepeaterFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Repeater[], ids: readonly string[], edit: (card: Repeater) => Repeater): Repeater[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRepeaterGraphite(cards: readonly Repeater[], ids: readonly string[]): Repeater[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkRepeaterPoise(cards: readonly Repeater[], ids: readonly string[]): Repeater[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkRepeaterCoffer(cards: readonly Repeater[], ids: readonly string[]): Repeater[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkRepeaterTag(cards: readonly Repeater[], ids: readonly string[]): Repeater[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readRepeaterViews(raw: unknown): RepeaterView[] {
  if (!Array.isArray(raw)) return [];
  const out: RepeaterView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RepeaterView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      striker: clip(row.striker, 24),
      film: activeFilm(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activeLimb(row.limb),
      beat: activeBeat(row.beat),
      rate: activeRate(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addRepeaterView(views: readonly RepeaterView[], view: RepeaterView): RepeaterView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRepeaterViews([...views, { ...view, id, name }]);
}

export function dropRepeaterView(views: readonly RepeaterView[], id: string): RepeaterView[] {
  return views.filter((view) => view.id !== id);
}

export function repeaterDensity(raw: unknown): RepeaterDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortRepeaterRules(cards: readonly Repeater[], sort: RepeaterSort): Repeater[] {
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

export function visibleRepeaterRules(
  cards: readonly Repeater[],
  tray: RepeaterTray,
  query: string,
  striker: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Repeater[] {
  const text = query.trim().toLowerCase();
  const wantStriker = clip(striker, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : repeaterFilm(film);
  const wantLimb = activeLimb(limb);
  const wantBeat = activeBeat(beat);
  const wantRate = activeRate(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.striker}`.toLowerCase().includes(text)) return false;
    if (wantStriker && card.striker.toLowerCase() !== wantStriker) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !repeaterInner(card.limb)) return false;
    if (wantLimb === "outer" && !repeaterOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueRepeater(card: Repeater): boolean {
  return repeaterOuter(card.limb) && card.rate === 2 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleRepeater(card: Repeater): boolean {
  return !card.film && card.beat === 3 && card.rate === 2 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskRepeater(card: Repeater): boolean {
  return card.film === "GILT" && card.beat === 24 && card.rate === 8 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingRepeater(card: Repeater): boolean {
  return card.limb === "gong" && card.film === "IVORY" && card.beat === 6;
}

/** A barrel is late when the station is already on the click. */
export function lateRepeater(card: Repeater, station: string): boolean {
  return card.limb === "rack" && repeaterLimb(station) === "gong" && !card.poised;
}

export function repeaterCounts(cards: readonly Repeater[], shown: readonly Repeater[], station: string): RepeaterCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => repeaterInner(card.limb)).length,
    outer: cards.filter((card) => repeaterOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 24).length,
    quiet: cards.filter((card) => quietFilm(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleRepeater).length,
    brisk: cards.filter(briskRepeater).length,
    resting: cards.filter(restingRepeater).length,
    overdue: cards.filter(overdueRepeater).length,
    pair: cards.filter((card) => pairRate(card.rate) && lateRepeater(card, station)).length,
  };
}

export function repeaterBars(cards: readonly Repeater[]): { limb: string; count: number }[] {
  return RPT_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function repeaterTimeline(cards: readonly Repeater[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function repeaterStrikers(cards: readonly Repeater[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.striker && !out.some((name) => name.toLowerCase() === card.striker.toLowerCase())) out.push(card.striker);
  }
  return out;
}

export function busiestStriker(cards: readonly Repeater[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.striker);
  let best = "";
  let score = 0;
  for (const name of repeaterStrikers(open)) {
    const count = open.filter((card) => card.striker.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRepeaterRules(cards: readonly Repeater[]): string[] {
  return cards.filter(overdueRepeater).map((card) => card.title);
}

export function repeaterCopy(card: Repeater): string {
  return [card.title, card.striker, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function repeaterCsv(cards: readonly Repeater[], station: string): string {
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
        repeaterOuter(card.limb) ? "1" : "0",
        lateRepeater(card, station) ? "1" : "0",
        idleRepeater(card) ? "1" : "0",
        briskRepeater(card) ? "1" : "0",
        restingRepeater(card) ? "1" : "0",
        overdueRepeater(card) ? "1" : "0",
        repeaterInner(card.limb) ? "1" : "0",
        quietFilm(card.film) ? "1" : "0",
        repeaterBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const GNG_KEY = "crmv4-gong-hide";
export const GNG_REVIEW_KEY = "crmv4-gong-review";

export type GongLane = "" | "core" | "edge" | "prime" | "vault" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type GongHue = "" | "ivory" | "graphite" | "champagne";
export type GongState = "" | "clear" | "set";
export type GongReview = "all" | "reviewed" | "fresh";
export type GongShape =
  | "all"
  | "core"
  | "edge"
  | "prime"
  | "vault"
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

export type GongValue = string | { tradingGroup?: unknown; [key: string]: unknown } | null | undefined;
export type GongRow = { id: string; label: string; code: GongValue };
export type GongLaneLine = { lane: string; count: number };

const CODE_LANES = ["core", "edge", "prime", "vault", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: GongValue): { tradingGroup?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: GongValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: GongValue): string {
  const row = codeRecord(raw);
  if (row && !("tradingGroup" in row)) return "";
  const value = row ? row.tradingGroup : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CORE";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: GongValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("tradingGroup" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function gongState(raw: GongValue): GongState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known city is NYC, LON, PAR, or DXB. An ampersand joins two cities. A semicolon marks a gap. A bead is exactly eight characters. A ribbon is twenty characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function gongLane(raw: GongValue): GongLane {
  if (gongState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "CORE") return "core";
    if (upper === "EDGE") return "edge";
    if (upper === "PRIME") return "prime";
    return "vault";
  }
  if (text === "NONE") return "plain";
  if (text.includes("/")) return "join";
  if (text.includes(":")) return "gap";
  if (text.length === 7) return "bead";
  if (text.length >= 16) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function gongHue(raw: GongValue): GongHue {
  const lane = gongLane(raw);
  if (!lane) return "";
  if (lane === "core" || lane === "prime") return "champagne";
  if (lane === "edge" || lane === "vault" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function gongCore(raw: GongValue): boolean {
  return gongLane(raw) === "core";
}

export function gongEdge(raw: GongValue): boolean {
  return gongLane(raw) === "edge";
}

export function gongPrime(raw: GongValue): boolean {
  return gongLane(raw) === "prime";
}

export function gongVault(raw: GongValue): boolean {
  return gongLane(raw) === "vault";
}

export function gongJoin(raw: GongValue): boolean {
  return gongLane(raw) === "join";
}

export function gongGap(raw: GongValue): boolean {
  return gongLane(raw) === "gap";
}

export function gongBead(raw: GongValue): boolean {
  return gongLane(raw) === "bead";
}

export function gongRibbon(raw: GongValue): boolean {
  return gongLane(raw) === "ribbon";
}

export function gongMark(raw: GongValue): boolean {
  return gongLane(raw) === "mark";
}

export function gongVowelLane(raw: GongValue): boolean {
  return gongLane(raw) === "vowel";
}

export function gongPlain(raw: GongValue): boolean {
  return gongLane(raw) === "plain";
}

export function gongOpen(raw: GongValue): boolean {
  return gongState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function gongHeld(raw: GongValue): boolean {
  const lane = gongLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function gongSoon(raw: GongValue): boolean {
  if (gongState(raw) !== "set") return false;
  if (gongBead(raw)) return true;
  if (gongCore(raw) || gongEdge(raw) || gongPrime(raw) || gongVault(raw)) return false;
  return codeGiven(raw).length === 9;
}

export function gongLength(raw: GongValue): number | null {
  if (gongState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function gongEven(raw: GongValue): boolean {
  const length = gongLength(raw);
  return length !== null && length % 2 === 0;
}

export function gongOdd(raw: GongValue): boolean {
  const length = gongLength(raw);
  return length !== null && length % 2 === 1;
}

export function gongFirst(raw: GongValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function gongTail(raw: GongValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function gongCapital(raw: GongValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function gongSpace(raw: GongValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function gongVowel(raw: GongValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function gongDigit(raw: GongValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function gongLetter(raw: GongValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function gongMixed(raw: GongValue): boolean {
  return gongDigit(raw) && gongLetter(raw);
}

export function gongLower(raw: GongValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function gongUpper(raw: GongValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function gongStamp(raw: GongValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function gongCopy(raw: GongValue): string {
  return codeGiven(raw);
}

export function gongFamily(raw: GongValue): string {
  if (gongState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function gongLanes(rows: readonly GongRow[]): GongLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = gongLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingGong(rows: readonly GongRow[]): string {
  const lines = gongLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingGongHue(rows: readonly GongRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = gongHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneGongCount(rows: readonly GongRow[], lane: GongLane): number {
  return rows.filter((row) => gongLane(row.code) === lane).length;
}

export function gongShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGongLanes(rows: readonly GongRow[]): string[] {
  return gongLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenGong(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGong(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGong(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGongReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGongReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGongLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: GongRow, shape: GongShape): boolean {
  if (shape === "all") return true;
  if (shape === "core") return gongCore(row.code);
  if (shape === "edge") return gongEdge(row.code);
  if (shape === "prime") return gongPrime(row.code);
  if (shape === "vault") return gongVault(row.code);
  if (shape === "join") return gongJoin(row.code);
  if (shape === "gap") return gongGap(row.code);
  if (shape === "bead") return gongBead(row.code);
  if (shape === "ribbon") return gongRibbon(row.code);
  if (shape === "mark") return gongMark(row.code);
  if (shape === "vowel") return gongVowelLane(row.code);
  if (shape === "plain") return gongPlain(row.code);
  if (shape === "open") return gongOpen(row.code);
  if (shape === "soon") return gongSoon(row.code);
  if (shape === "letter") return gongLetter(row.code);
  if (shape === "mixed") return gongMixed(row.code);
  if (shape === "upper") return gongUpper(row.code);
  if (shape === "lower") return gongLower(row.code);
  if (shape === "space") return gongSpace(row.code);
  if (shape === "even") return gongEven(row.code);
  if (shape === "odd") return gongOdd(row.code);
  if (shape === "tail") return gongTail(row.code);
  if (shape === "first") return gongFirst(row.code);
  if (shape === "held") return gongHeld(row.code);
  return gongLane(row.code) === shape;
}

export function visibleGong(
  rows: readonly GongRow[],
  lane: string,
  hue: string,
  query: string,
  review: GongReview,
  reviewed: readonly string[],
  shape: GongShape,
): GongRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (gongState(row.code) === "") return false;
    const found = gongLane(row.code);
    const hueName = gongHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${gongStamp(row.code)} ${gongFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function gongLanesCsv(rows: readonly GongRow[]): string {
  const lines = ["lane,count"];
  for (const line of gongLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function gongRowsCsv(rows: readonly GongRow[], reviewed: readonly string[]): string {
  const lines = ["name,state,stamp,family,lane,hue,length,core,edge,prime,vault,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(gongCopy(row.code)),
        gongStamp(row.code),
        csvCell(gongFamily(row.code)),
        gongLane(row.code),
        gongHue(row.code),
        gongLength(row.code) ?? "",
        gongCore(row.code) ? "1" : "0",
        gongEdge(row.code) ? "1" : "0",
        gongPrime(row.code) ? "1" : "0",
        gongVault(row.code) ? "1" : "0",
        gongJoin(row.code) ? "1" : "0",
        gongGap(row.code) ? "1" : "0",
        gongBead(row.code) ? "1" : "0",
        gongEven(row.code) ? "1" : "0",
        gongDigit(row.code) ? "1" : "0",
        gongMixed(row.code) ? "1" : "0",
        gongUpper(row.code) ? "1" : "0",
        gongVowel(row.code) ? "1" : "0",
        gongTail(row.code) ? "1" : "0",
        gongHeld(row.code) ? "1" : "0",
        gongSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
