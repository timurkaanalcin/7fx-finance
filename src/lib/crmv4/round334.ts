/**
 * Detent rules for a chronometer detent kept in this browser, and tellurion plates read the phone already stored on the account.
 * Parts are horn, locking, passing, and discharge. Finishes are gilt, ivory, and graphite.
 * Angles are 5, 10, 15, or 20. Springs are 1, 4, or 7.
 * A known phone mark is CELL, DESK, HOME, or FAX. A plus joins an international number. A hyphen marks an extension.
 * A bead is exactly eight characters. A ribbon is fourteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true phone reads as CELL. An empty phone reads as NONE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_detent (
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
 * CREATE TABLE crm_tellurion_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_tellurion_review (
 *   trader_id text primary key
 * );
 */
export const DTN_KEY = "crmv4-detent";
export const DTN_VIEW_KEY = "crmv4-detent-views";
export const DTN_DENSITY_KEY = "crmv4-detent-density";
export const DTN_LIMBS = ["horn", "locking", "passing", "discharge"] as const;

export type DetentLimb = (typeof DTN_LIMBS)[number];
export type DetentFilm = "blank" | "gilt" | "ivory" | "graphite";
export type DetentTray = "board" | "peg" | "coffer";
export type DetentDensity = "airy" | "close";
export type DetentSort = "limb" | "setter";

export type Detent = {
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

export type DetentView = {
  id: string;
  name: string;
  tray: DetentTray;
  query: string;
  setter: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type DetentCounts = {
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

export const ROUND334_FEATURES = [
  "detent-save",
  "horn-notices",
  "detent-parts",
  "detent-search",
  "spring-sla",
  "casket",
  "pin-star",
  "inline-edit",
  "detent-filters",
  "saved-views",
  "desk-density",
  "setter-sort",
  "desk-kpis",
  "angle-chart",
  "angle-timeline",
  "bulk-actions",
  "csv-export",
  "keyboard-shortcuts",
  "audit-trail",
  "fair-setter",
  "viewer-role",
  "suggest-horn",
  "overdue-reminders",
  "phone-tellurion",
  "tellurion-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [5, 10, 15, 20] as const;
const RATE_CYCLE = [1, 4, 7] as const;
const INNER = new Set(["horn", "locking"]);
const OUTER = new Set(["passing", "discharge"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["CELL", "DESK", "HOME", "FAX"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DetentTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<DetentFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<DetentFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[hd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Detent, tray: DetentTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return DTN_LIMBS.indexOf(limb as DetentLimb);
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

export function detentLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DTN_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A beat is 2, 5, 8, or 11. Anything else stays blank. */
/** An angle is 5, 10, 15, or 20. Anything else stays blank. */
export function detentBeat(raw: unknown): 5 | 10 | 15 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15" && text !== "20") return null;
  return Number(text) as 5 | 10 | 15 | 20;
}

/** A rate is 2, 6, or 10. Anything else stays blank. */
/** A spring is 1, 4, or 7. Anything else stays blank. */
export function detentRate(raw: unknown): 1 | 4 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "7") return null;
  return Number(text) as 1 | 4 | 7;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function detentFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function detentInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function detentOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Drum is the barrel. Axle is the arbor. Eye is the hook. Pawl is the click. */
export function detentBand(limb: unknown): string {
  const text = detentLimb(limb);
  if (!text) return "";
  if (text === "horn") return "tip";
  if (text === "locking") return "stone";
  if (text === "passing") return "roller";
  return "spring";
}

/** Signed distance from one limb to another along the detent. */
export function detentGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(detentLimb(from));
  const right = limbIndex(detentLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFilm(film: unknown): boolean {
  return QUIET_FILM.has(detentFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairRate(rate: unknown): boolean {
  return detentRate(rate) === 4;
}

/** A full rate is 10. */
export function fullRate(rate: unknown): boolean {
  return detentRate(rate) === 7;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return detentLimb(text) || "all";
}

export function activeBeat(raw: unknown): string {
  const beat = detentBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = detentFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRate(raw: unknown): string {
  const rate = detentRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveDetentFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFilm(cards: readonly Detent[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "board") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["GRAPHITE", "IVORY", "GILT"]) {
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
export function suggestBeat(cards: readonly Detent[], hour: number): 5 | 10 | 15 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 15 | 20 = 5;
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
  if (hour < 6) return 5;
  if (hour < 12) return 10;
  if (hour < 18) return 15;
  return 20;
}

/** Before eight, suggest the barrel. The fax of the day suggests the click. */
export function suggestLimb(hour: number): DetentLimb {
  return hour < 10 ? "horn" : "discharge";
}

/** The setter with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairSetter(cards: readonly Detent[], roster: string): string {
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

export function readDetentRules(raw: unknown): Detent[] {
  if (!Array.isArray(raw)) return [];
  const out: Detent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Detent>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      setter: clip(row.setter, 24),
      limb: detentLimb(row.limb),
      beat: detentBeat(row.beat),
      film: detentFilm(row.film),
      rate: detentRate(row.rate) ?? 1,
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

export function addDetent(
  cards: readonly Detent[],
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
): Detent[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `h${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readDetentRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      setter: clip(card.setter, 24),
      limb: detentLimb(card.limb),
      beat: detentBeat(card.beat),
      film: detentFilm(card.film),
      rate: detentRate(card.rate) ?? 1,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Detent[], id: string, edit: (card: Detent) => Detent): Detent[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editDetent(cards: readonly Detent[], id: string, title: string): Detent[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editDetentNote(cards: readonly Detent[], id: string, note: string): Detent[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(detentFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setDetentFilm(cards: readonly Detent[], id: string, film: string): Detent[] {
  const next = detentFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setDetentPoise(cards: readonly Detent[], id: string, poised: boolean): Detent[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setDetentPeg(cards: readonly Detent[], id: string, pegged: boolean): Detent[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setDetentCoffer(cards: readonly Detent[], id: string, coffered: boolean): Detent[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setDetentStar(cards: readonly Detent[], id: string, starred: boolean): Detent[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addDetentTag(cards: readonly Detent[], id: string, tag: string): Detent[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 5 | 10 | 15 | 20 {
  if (beat === null) return dir > 0 ? 5 : 20;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 1 | 4 | 7 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Detent[], id: string): Detent[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Detent[], id: string): Detent[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Detent[], id: string): Detent[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Detent[], id: string): Detent[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setDetentFocused(cards: readonly Detent[], id: string): Detent[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegDetentFocused(cards: readonly Detent[], id: string): Detent[] {
  return setDetentPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starDetentFocused(cards: readonly Detent[], id: string): Detent[] {
  return setDetentStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Detent[], id: string): Detent[] {
  const card = cards.find((item) => item.id === id);
  return card ? setDetentFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Detent[], ids: readonly string[], edit: (card: Detent) => Detent): Detent[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkDetentGraphite(cards: readonly Detent[], ids: readonly string[]): Detent[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkDetentPoise(cards: readonly Detent[], ids: readonly string[]): Detent[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkDetentCoffer(cards: readonly Detent[], ids: readonly string[]): Detent[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkDetentTag(cards: readonly Detent[], ids: readonly string[]): Detent[] {
  return bulk(cards, ids, (card) => (card.tags.includes("h") ? card : { ...card, tags: tagsOf([...card.tags, "h"]), audit: "tag" }));
}

export function readDetentViews(raw: unknown): DetentView[] {
  if (!Array.isArray(raw)) return [];
  const out: DetentView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DetentView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      setter: clip(row.setter, 24),
      film: activeFilm(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activeLimb(row.limb),
      beat: activeBeat(row.beat),
      rate: activeRate(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addDetentView(views: readonly DetentView[], view: DetentView): DetentView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readDetentViews([...views, { ...view, id, name }]);
}

export function dropDetentView(views: readonly DetentView[], id: string): DetentView[] {
  return views.filter((view) => view.id !== id);
}

export function detentDensity(raw: unknown): DetentDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortDetentRules(cards: readonly Detent[], sort: DetentSort): Detent[] {
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

export function visibleDetentRules(
  cards: readonly Detent[],
  tray: DetentTray,
  query: string,
  setter: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Detent[] {
  const text = query.trim().toLowerCase();
  const wantSetter = clip(setter, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : detentFilm(film);
  const wantLimb = activeLimb(limb);
  const wantBeat = activeBeat(beat);
  const wantRate = activeRate(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.setter}`.toLowerCase().includes(text)) return false;
    if (wantSetter && card.setter.toLowerCase() !== wantSetter) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !detentInner(card.limb)) return false;
    if (wantLimb === "outer" && !detentOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueDetent(card: Detent): boolean {
  return detentOuter(card.limb) && card.rate === 1 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleDetent(card: Detent): boolean {
  return !card.film && card.beat === 5 && card.rate === 1 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskDetent(card: Detent): boolean {
  return card.film === "GILT" && card.beat === 20 && card.rate === 7 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingDetent(card: Detent): boolean {
  return card.limb === "discharge" && card.film === "IVORY" && card.beat === 10;
}

/** A barrel is late when the station is already on the click. */
export function lateDetent(card: Detent, station: string): boolean {
  return card.limb === "horn" && detentLimb(station) === "discharge" && !card.poised;
}

export function detentCounts(cards: readonly Detent[], shown: readonly Detent[], station: string): DetentCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => detentInner(card.limb)).length,
    outer: cards.filter((card) => detentOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 20).length,
    quiet: cards.filter((card) => quietFilm(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleDetent).length,
    brisk: cards.filter(briskDetent).length,
    resting: cards.filter(restingDetent).length,
    overdue: cards.filter(overdueDetent).length,
    pair: cards.filter((card) => pairRate(card.rate) && lateDetent(card, station)).length,
  };
}

export function detentBars(cards: readonly Detent[]): { limb: string; count: number }[] {
  return DTN_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function detentTimeline(cards: readonly Detent[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function detentSetters(cards: readonly Detent[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.setter && !out.some((name) => name.toLowerCase() === card.setter.toLowerCase())) out.push(card.setter);
  }
  return out;
}

export function busiestSetter(cards: readonly Detent[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.setter);
  let best = "";
  let score = 0;
  for (const name of detentSetters(open)) {
    const count = open.filter((card) => card.setter.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderDetentRules(cards: readonly Detent[]): string[] {
  return cards.filter(overdueDetent).map((card) => card.title);
}

export function detentCopy(card: Detent): string {
  return [card.title, card.setter, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function detentCsv(cards: readonly Detent[], station: string): string {
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
        detentOuter(card.limb) ? "1" : "0",
        lateDetent(card, station) ? "1" : "0",
        idleDetent(card) ? "1" : "0",
        briskDetent(card) ? "1" : "0",
        restingDetent(card) ? "1" : "0",
        overdueDetent(card) ? "1" : "0",
        detentInner(card.limb) ? "1" : "0",
        quietFilm(card.film) ? "1" : "0",
        detentBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const TLN_KEY = "crmv4-tellurion-hide";
export const TLN_REVIEW_KEY = "crmv4-tellurion-review";

export type TellurionLane = "" | "cell" | "desk" | "home" | "fax" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type TellurionHue = "" | "ivory" | "graphite" | "champagne";
export type TellurionState = "" | "clear" | "set";
export type TellurionReview = "all" | "reviewed" | "fresh";
export type TellurionShape =
  | "all"
  | "cell"
  | "desk"
  | "home"
  | "fax"
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

export type TellurionValue = string | { phone?: unknown; [key: string]: unknown } | null | undefined;
export type TellurionRow = { id: string; label: string; code: TellurionValue };
export type TellurionLaneLine = { lane: string; count: number };

const CODE_LANES = ["cell", "desk", "home", "fax", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: TellurionValue): { phone?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: TellurionValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: TellurionValue): string {
  const row = codeRecord(raw);
  if (row && !("phone" in row)) return "";
  const value = row ? row.phone : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CELL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: TellurionValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("phone" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function tellurionState(raw: TellurionValue): TellurionState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known city is NYC, LON, PAR, or DXB. An ampersand joins two cities. A semicolon marks a gap. A bead is exactly eight characters. A ribbon is twenty characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function tellurionLane(raw: TellurionValue): TellurionLane {
  if (tellurionState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "CELL") return "cell";
    if (upper === "DESK") return "desk";
    if (upper === "HOME") return "home";
    return "fax";
  }
  if (text === "NONE") return "plain";
  if (text.includes("+")) return "join";
  if (text.includes("-")) return "gap";
  if (text.length === 8) return "bead";
  if (text.length >= 14) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function tellurionHue(raw: TellurionValue): TellurionHue {
  const lane = tellurionLane(raw);
  if (!lane) return "";
  if (lane === "cell" || lane === "home") return "champagne";
  if (lane === "desk" || lane === "fax" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function tellurionCell(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "cell";
}

export function tellurionDesk(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "desk";
}

export function tellurionHome(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "home";
}

export function tellurionFax(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "fax";
}

export function tellurionJoin(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "join";
}

export function tellurionGap(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "gap";
}

export function tellurionBead(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "bead";
}

export function tellurionRibbon(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "ribbon";
}

export function tellurionMark(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "mark";
}

export function tellurionVowelLane(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "vowel";
}

export function tellurionPlain(raw: TellurionValue): boolean {
  return tellurionLane(raw) === "plain";
}

export function tellurionOpen(raw: TellurionValue): boolean {
  return tellurionState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function tellurionHeld(raw: TellurionValue): boolean {
  const lane = tellurionLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function tellurionSoon(raw: TellurionValue): boolean {
  if (tellurionState(raw) !== "set") return false;
  if (tellurionBead(raw)) return true;
  if (tellurionCell(raw) || tellurionDesk(raw) || tellurionHome(raw) || tellurionFax(raw)) return false;
  return codeGiven(raw).length === 11;
}

export function tellurionLength(raw: TellurionValue): number | null {
  if (tellurionState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function tellurionEven(raw: TellurionValue): boolean {
  const length = tellurionLength(raw);
  return length !== null && length % 2 === 0;
}

export function tellurionOdd(raw: TellurionValue): boolean {
  const length = tellurionLength(raw);
  return length !== null && length % 2 === 1;
}

export function tellurionFirst(raw: TellurionValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function tellurionTail(raw: TellurionValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function tellurionCapital(raw: TellurionValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function tellurionSpace(raw: TellurionValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function tellurionVowel(raw: TellurionValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function tellurionDigit(raw: TellurionValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function tellurionLetter(raw: TellurionValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function tellurionMixed(raw: TellurionValue): boolean {
  return tellurionDigit(raw) && tellurionLetter(raw);
}

export function tellurionLower(raw: TellurionValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function tellurionUpper(raw: TellurionValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function tellurionStamp(raw: TellurionValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function tellurionCopy(raw: TellurionValue): string {
  return codeGiven(raw);
}

export function tellurionFamily(raw: TellurionValue): string {
  if (tellurionState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function tellurionLanes(rows: readonly TellurionRow[]): TellurionLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = tellurionLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTellurion(rows: readonly TellurionRow[]): string {
  const lines = tellurionLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingTellurionHue(rows: readonly TellurionRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = tellurionHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneTellurionCount(rows: readonly TellurionRow[], lane: TellurionLane): number {
  return rows.filter((row) => tellurionLane(row.code) === lane).length;
}

export function tellurionShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTellurionLanes(rows: readonly TellurionRow[]): string[] {
  return tellurionLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenTellurion(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTellurion(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTellurion(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTellurionReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTellurionReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTellurionLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: TellurionRow, shape: TellurionShape): boolean {
  if (shape === "all") return true;
  if (shape === "cell") return tellurionCell(row.code);
  if (shape === "desk") return tellurionDesk(row.code);
  if (shape === "home") return tellurionHome(row.code);
  if (shape === "fax") return tellurionFax(row.code);
  if (shape === "join") return tellurionJoin(row.code);
  if (shape === "gap") return tellurionGap(row.code);
  if (shape === "bead") return tellurionBead(row.code);
  if (shape === "ribbon") return tellurionRibbon(row.code);
  if (shape === "mark") return tellurionMark(row.code);
  if (shape === "vowel") return tellurionVowelLane(row.code);
  if (shape === "plain") return tellurionPlain(row.code);
  if (shape === "open") return tellurionOpen(row.code);
  if (shape === "soon") return tellurionSoon(row.code);
  if (shape === "letter") return tellurionLetter(row.code);
  if (shape === "mixed") return tellurionMixed(row.code);
  if (shape === "upper") return tellurionUpper(row.code);
  if (shape === "lower") return tellurionLower(row.code);
  if (shape === "space") return tellurionSpace(row.code);
  if (shape === "even") return tellurionEven(row.code);
  if (shape === "odd") return tellurionOdd(row.code);
  if (shape === "tail") return tellurionTail(row.code);
  if (shape === "first") return tellurionFirst(row.code);
  if (shape === "held") return tellurionHeld(row.code);
  return tellurionLane(row.code) === shape;
}

export function visibleTellurion(
  rows: readonly TellurionRow[],
  lane: string,
  hue: string,
  query: string,
  review: TellurionReview,
  reviewed: readonly string[],
  shape: TellurionShape,
): TellurionRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (tellurionState(row.code) === "") return false;
    const found = tellurionLane(row.code);
    const hueName = tellurionHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${tellurionStamp(row.code)} ${tellurionFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function tellurionLanesCsv(rows: readonly TellurionRow[]): string {
  const lines = ["lane,count"];
  for (const line of tellurionLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function tellurionRowsCsv(rows: readonly TellurionRow[], reviewed: readonly string[]): string {
  const lines = ["name,state,stamp,family,lane,hue,length,cell,desk,home,fax,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(tellurionCopy(row.code)),
        tellurionStamp(row.code),
        csvCell(tellurionFamily(row.code)),
        tellurionLane(row.code),
        tellurionHue(row.code),
        tellurionLength(row.code) ?? "",
        tellurionCell(row.code) ? "1" : "0",
        tellurionDesk(row.code) ? "1" : "0",
        tellurionHome(row.code) ? "1" : "0",
        tellurionFax(row.code) ? "1" : "0",
        tellurionJoin(row.code) ? "1" : "0",
        tellurionGap(row.code) ? "1" : "0",
        tellurionBead(row.code) ? "1" : "0",
        tellurionEven(row.code) ? "1" : "0",
        tellurionDigit(row.code) ? "1" : "0",
        tellurionMixed(row.code) ? "1" : "0",
        tellurionUpper(row.code) ? "1" : "0",
        tellurionVowel(row.code) ? "1" : "0",
        tellurionTail(row.code) ? "1" : "0",
        tellurionHeld(row.code) ? "1" : "0",
        tellurionSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
