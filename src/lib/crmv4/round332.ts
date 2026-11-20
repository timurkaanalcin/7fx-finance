/**
 * Mainspring rules for a going barrel kept in this browser, and planisphere plates read the last city already stored on the account.
 * Parts are barrel, arbor, hook, and click. Films are gilt, ivory, and graphite.
 * Turns are 3, 7, 12, or 18. Pulls are 3, 9, or 15.
 * A known city is NYC, LON, PAR, or DXB. An ampersand joins two cities. A semicolon marks a gap.
 * A bead is exactly eight characters. A ribbon is twenty characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true city reads as NYC. A false city reads as NONE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_mainspring (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   warden text not null default '',
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
 * CREATE TABLE crm_planisphere_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_planisphere_review (
 *   trader_id text primary key
 * );
 */
export const MSP_KEY = "crmv4-mainspring";
export const MSP_VIEW_KEY = "crmv4-mainspring-views";
export const MSP_DENSITY_KEY = "crmv4-mainspring-density";
export const MSP_LIMBS = ["barrel", "arbor", "hook", "click"] as const;

export type MainspringLimb = (typeof MSP_LIMBS)[number];
export type MainspringFilm = "blank" | "gilt" | "ivory" | "graphite";
export type MainspringTray = "board" | "peg" | "coffer";
export type MainspringDensity = "airy" | "close";
export type MainspringSort = "limb" | "warden";

export type Mainspring = {
  id: string;
  title: string;
  note: string;
  warden: string;
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

export type MainspringView = {
  id: string;
  name: string;
  tray: MainspringTray;
  query: string;
  warden: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type MainspringCounts = {
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

export const ROUND332_FEATURES = [
  "mainspring-save",
  "notice-center",
  "barrel-parts",
  "quick-search",
  "pull-sla",
  "vault",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "smith-sort",
  "desk-kpis",
  "turn-chart",
  "turn-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-smith",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "city-planisphere",
  "planisphere-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [3, 7, 12, 18] as const;
const RATE_CYCLE = [3, 9, 15] as const;
const INNER = new Set(["barrel", "arbor"]);
const OUTER = new Set(["hook", "click"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["NYC", "LON", "PAR", "DXB"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): MainspringTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<MainspringFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<MainspringFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[mn]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Mainspring, tray: MainspringTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return MSP_LIMBS.indexOf(limb as MainspringLimb);
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

export function mainspringLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (MSP_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A beat is 2, 5, 8, or 11. Anything else stays blank. */
export function mainspringBeat(raw: unknown): 3 | 7 | 12 | 18 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "7" && text !== "12" && text !== "18") return null;
  return Number(text) as 3 | 7 | 12 | 18;
}

/** A rate is 2, 6, or 10. Anything else stays blank. */
export function mainspringRate(raw: unknown): 3 | 9 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "9" && text !== "15") return null;
  return Number(text) as 3 | 9 | 15;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function mainspringFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function mainspringInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function mainspringOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Drum is the barrel. Axle is the arbor. Eye is the hook. Pawl is the click. */
export function mainspringBand(limb: unknown): string {
  const text = mainspringLimb(limb);
  if (!text) return "";
  if (text === "barrel") return "drum";
  if (text === "arbor") return "axle";
  if (text === "hook") return "eye";
  return "pawl";
}

/** Signed distance from one limb to another along the mainspring. */
export function mainspringGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(mainspringLimb(from));
  const right = limbIndex(mainspringLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFilm(film: unknown): boolean {
  return QUIET_FILM.has(mainspringFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairRate(rate: unknown): boolean {
  return mainspringRate(rate) === 9;
}

/** A full rate is 10. */
export function fullRate(rate: unknown): boolean {
  return mainspringRate(rate) === 15;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return mainspringLimb(text) || "all";
}

export function activeBeat(raw: unknown): string {
  const beat = mainspringBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = mainspringFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRate(raw: unknown): string {
  const rate = mainspringRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveMainspringFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFilm(cards: readonly Mainspring[]): string {
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
export function suggestBeat(cards: readonly Mainspring[], hour: number): 3 | 7 | 12 | 18 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 7 | 12 | 18 = 3;
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
  if (hour < 4) return 3;
  if (hour < 9) return 7;
  if (hour < 15) return 12;
  return 18;
}

/** Before eight, suggest the barrel. The rest of the day suggests the click. */
export function suggestLimb(hour: number): MainspringLimb {
  return hour < 8 ? "barrel" : "click";
}

/** The warden with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairWarden(cards: readonly Mainspring[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.poised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.warden.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readMainspringRules(raw: unknown): Mainspring[] {
  if (!Array.isArray(raw)) return [];
  const out: Mainspring[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Mainspring>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      warden: clip(row.warden, 24),
      limb: mainspringLimb(row.limb),
      beat: mainspringBeat(row.beat),
      film: mainspringFilm(row.film),
      rate: mainspringRate(row.rate) ?? 3,
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

export function addMainspring(
  cards: readonly Mainspring[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    warden?: string;
    limb?: string;
    beat?: unknown;
    film?: string;
    rate?: unknown;
    tags?: unknown;
  },
): Mainspring[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `h${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readMainspringRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      warden: clip(card.warden, 24),
      limb: mainspringLimb(card.limb),
      beat: mainspringBeat(card.beat),
      film: mainspringFilm(card.film),
      rate: mainspringRate(card.rate) ?? 3,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Mainspring[], id: string, edit: (card: Mainspring) => Mainspring): Mainspring[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editMainspring(cards: readonly Mainspring[], id: string, title: string): Mainspring[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editMainspringNote(cards: readonly Mainspring[], id: string, note: string): Mainspring[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(mainspringFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setMainspringFilm(cards: readonly Mainspring[], id: string, film: string): Mainspring[] {
  const next = mainspringFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setMainspringPoise(cards: readonly Mainspring[], id: string, poised: boolean): Mainspring[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setMainspringPeg(cards: readonly Mainspring[], id: string, pegged: boolean): Mainspring[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setMainspringCoffer(cards: readonly Mainspring[], id: string, coffered: boolean): Mainspring[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setMainspringStar(cards: readonly Mainspring[], id: string, starred: boolean): Mainspring[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addMainspringTag(cards: readonly Mainspring[], id: string, tag: string): Mainspring[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 3 | 7 | 12 | 18 {
  if (beat === null) return dir > 0 ? 3 : 18;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 3 | 9 | 15 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setMainspringFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegMainspringFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return setMainspringPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starMainspringFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  return setMainspringStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Mainspring[], id: string): Mainspring[] {
  const card = cards.find((item) => item.id === id);
  return card ? setMainspringFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Mainspring[], ids: readonly string[], edit: (card: Mainspring) => Mainspring): Mainspring[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkMainspringGraphite(cards: readonly Mainspring[], ids: readonly string[]): Mainspring[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkMainspringPoise(cards: readonly Mainspring[], ids: readonly string[]): Mainspring[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkMainspringCoffer(cards: readonly Mainspring[], ids: readonly string[]): Mainspring[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkMainspringTag(cards: readonly Mainspring[], ids: readonly string[]): Mainspring[] {
  return bulk(cards, ids, (card) => (card.tags.includes("h") ? card : { ...card, tags: tagsOf([...card.tags, "h"]), audit: "tag" }));
}

export function readMainspringViews(raw: unknown): MainspringView[] {
  if (!Array.isArray(raw)) return [];
  const out: MainspringView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MainspringView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      warden: clip(row.warden, 24),
      film: activeFilm(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activeLimb(row.limb),
      beat: activeBeat(row.beat),
      rate: activeRate(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addMainspringView(views: readonly MainspringView[], view: MainspringView): MainspringView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readMainspringViews([...views, { ...view, id, name }]);
}

export function dropMainspringView(views: readonly MainspringView[], id: string): MainspringView[] {
  return views.filter((view) => view.id !== id);
}

export function mainspringDensity(raw: unknown): MainspringDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortMainspringRules(cards: readonly Mainspring[], sort: MainspringSort): Mainspring[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "warden") {
      const warden = a.warden.localeCompare(b.warden);
      if (warden) return warden;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleMainspringRules(
  cards: readonly Mainspring[],
  tray: MainspringTray,
  query: string,
  warden: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Mainspring[] {
  const text = query.trim().toLowerCase();
  const wantWarden = clip(warden, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : mainspringFilm(film);
  const wantLimb = activeLimb(limb);
  const wantBeat = activeBeat(beat);
  const wantRate = activeRate(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.warden}`.toLowerCase().includes(text)) return false;
    if (wantWarden && card.warden.toLowerCase() !== wantWarden) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !mainspringInner(card.limb)) return false;
    if (wantLimb === "outer" && !mainspringOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueMainspring(card: Mainspring): boolean {
  return mainspringOuter(card.limb) && card.rate === 3 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleMainspring(card: Mainspring): boolean {
  return !card.film && card.beat === 3 && card.rate === 3 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskMainspring(card: Mainspring): boolean {
  return card.film === "GILT" && card.beat === 18 && card.rate === 15 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingMainspring(card: Mainspring): boolean {
  return card.limb === "click" && card.film === "IVORY" && card.beat === 7;
}

/** A barrel is late when the station is already on the click. */
export function lateMainspring(card: Mainspring, station: string): boolean {
  return card.limb === "barrel" && mainspringLimb(station) === "click" && !card.poised;
}

export function mainspringCounts(cards: readonly Mainspring[], shown: readonly Mainspring[], station: string): MainspringCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => mainspringInner(card.limb)).length,
    outer: cards.filter((card) => mainspringOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 18).length,
    quiet: cards.filter((card) => quietFilm(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleMainspring).length,
    brisk: cards.filter(briskMainspring).length,
    resting: cards.filter(restingMainspring).length,
    overdue: cards.filter(overdueMainspring).length,
    pair: cards.filter((card) => pairRate(card.rate) && lateMainspring(card, station)).length,
  };
}

export function mainspringBars(cards: readonly Mainspring[]): { limb: string; count: number }[] {
  return MSP_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function mainspringTimeline(cards: readonly Mainspring[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function mainspringWardens(cards: readonly Mainspring[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.warden && !out.some((name) => name.toLowerCase() === card.warden.toLowerCase())) out.push(card.warden);
  }
  return out;
}

export function busiestWarden(cards: readonly Mainspring[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.warden);
  let best = "";
  let score = 0;
  for (const name of mainspringWardens(open)) {
    const count = open.filter((card) => card.warden.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderMainspringRules(cards: readonly Mainspring[]): string[] {
  return cards.filter(overdueMainspring).map((card) => card.title);
}

export function mainspringCopy(card: Mainspring): string {
  return [card.title, card.warden, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function mainspringCsv(cards: readonly Mainspring[], station: string): string {
  const lines = ["title,warden,limb,film,beat,rate,tags,poised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.warden),
        card.limb,
        card.film,
        card.beat ?? "",
        card.rate,
        card.tags.join(" "),
        card.poised ? "1" : "0",
        card.pegged ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        mainspringOuter(card.limb) ? "1" : "0",
        lateMainspring(card, station) ? "1" : "0",
        idleMainspring(card) ? "1" : "0",
        briskMainspring(card) ? "1" : "0",
        restingMainspring(card) ? "1" : "0",
        overdueMainspring(card) ? "1" : "0",
        mainspringInner(card.limb) ? "1" : "0",
        quietFilm(card.film) ? "1" : "0",
        mainspringBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const PSN_KEY = "crmv4-planisphere-hide";
export const PSN_REVIEW_KEY = "crmv4-planisphere-review";

export type PlanisphereLane = "" | "code" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type PlanisphereHue = "" | "ivory" | "graphite" | "champagne";
export type PlanisphereState = "" | "clear" | "set";
export type PlanisphereReview = "all" | "reviewed" | "fresh";
export type PlanisphereShape =
  | "all"
  | "code"
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

export type PlanisphereValue = string | { lastCity?: unknown; [key: string]: unknown } | null | undefined;
export type PlanisphereRow = { id: string; label: string; code: PlanisphereValue };
export type PlanisphereLaneLine = { lane: string; count: number };

const CODE_LANES = ["code", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: PlanisphereValue): { lastCity?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: PlanisphereValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: PlanisphereValue): string {
  const row = codeRecord(raw);
  if (row && !("lastCity" in row)) return "";
  const value = row ? row.lastCity : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NYC";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: PlanisphereValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastCity" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function planisphereState(raw: PlanisphereValue): PlanisphereState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known city is NYC, LON, PAR, or DXB. An ampersand joins two cities. A semicolon marks a gap. A bead is exactly eight characters. A ribbon is twenty characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function planisphereLane(raw: PlanisphereValue): PlanisphereLane {
  if (planisphereState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (text === "NONE") return "plain";
  if (SYSTEMS.has(text.toUpperCase())) return "code";
  if (text.includes("&")) return "join";
  if (text.includes(";")) return "gap";
  if (text.length === 8) return "bead";
  if (text.length >= 20) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function planisphereHue(raw: PlanisphereValue): PlanisphereHue {
  const lane = planisphereLane(raw);
  if (!lane) return "";
  if (lane === "code" || lane === "bead") return "champagne";
  if (lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function planisphereCode(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "code";
}

export function planisphereJoin(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "join";
}

export function planisphereGap(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "gap";
}

export function planisphereBead(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "bead";
}

export function planisphereRibbon(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "ribbon";
}

export function planisphereMark(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "mark";
}

export function planisphereVowelLane(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "vowel";
}

export function planispherePlain(raw: PlanisphereValue): boolean {
  return planisphereLane(raw) === "plain";
}

export function planisphereOpen(raw: PlanisphereValue): boolean {
  return planisphereState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function planisphereHeld(raw: PlanisphereValue): boolean {
  const lane = planisphereLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function planisphereSoon(raw: PlanisphereValue): boolean {
  if (planisphereState(raw) !== "set") return false;
  if (planisphereBead(raw)) return true;
  if (planisphereCode(raw)) return false;
  return codeGiven(raw).length === 9;
}

export function planisphereLength(raw: PlanisphereValue): number | null {
  if (planisphereState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function planisphereEven(raw: PlanisphereValue): boolean {
  const length = planisphereLength(raw);
  return length !== null && length % 2 === 0;
}

export function planisphereOdd(raw: PlanisphereValue): boolean {
  const length = planisphereLength(raw);
  return length !== null && length % 2 === 1;
}

export function planisphereFirst(raw: PlanisphereValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function planisphereTail(raw: PlanisphereValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function planisphereCapital(raw: PlanisphereValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function planisphereSpace(raw: PlanisphereValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function planisphereVowel(raw: PlanisphereValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function planisphereDigit(raw: PlanisphereValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function planisphereLetter(raw: PlanisphereValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function planisphereMixed(raw: PlanisphereValue): boolean {
  return planisphereDigit(raw) && planisphereLetter(raw);
}

export function planisphereLower(raw: PlanisphereValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function planisphereUpper(raw: PlanisphereValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function planisphereStamp(raw: PlanisphereValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function planisphereCopy(raw: PlanisphereValue): string {
  return codeGiven(raw);
}

export function planisphereFamily(raw: PlanisphereValue): string {
  if (planisphereState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function planisphereLanes(rows: readonly PlanisphereRow[]): PlanisphereLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = planisphereLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPlanisphere(rows: readonly PlanisphereRow[]): string {
  const lines = planisphereLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingPlanisphereHue(rows: readonly PlanisphereRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = planisphereHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function lanePlanisphereCount(rows: readonly PlanisphereRow[], lane: PlanisphereLane): number {
  return rows.filter((row) => planisphereLane(row.code) === lane).length;
}

export function planisphereShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPlanisphereLanes(rows: readonly PlanisphereRow[]): string[] {
  return planisphereLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenPlanisphere(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPlanisphere(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePlanisphere(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePlanisphereReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPlanisphereReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePlanisphereLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: PlanisphereRow, shape: PlanisphereShape): boolean {
  if (shape === "all") return true;
  if (shape === "code") return planisphereCode(row.code);
  if (shape === "join") return planisphereJoin(row.code);
  if (shape === "gap") return planisphereGap(row.code);
  if (shape === "bead") return planisphereBead(row.code);
  if (shape === "ribbon") return planisphereRibbon(row.code);
  if (shape === "mark") return planisphereMark(row.code);
  if (shape === "vowel") return planisphereVowelLane(row.code);
  if (shape === "plain") return planispherePlain(row.code);
  if (shape === "open") return planisphereOpen(row.code);
  if (shape === "soon") return planisphereSoon(row.code);
  if (shape === "letter") return planisphereLetter(row.code);
  if (shape === "mixed") return planisphereMixed(row.code);
  if (shape === "upper") return planisphereUpper(row.code);
  if (shape === "lower") return planisphereLower(row.code);
  if (shape === "space") return planisphereSpace(row.code);
  if (shape === "even") return planisphereEven(row.code);
  if (shape === "odd") return planisphereOdd(row.code);
  if (shape === "tail") return planisphereTail(row.code);
  if (shape === "first") return planisphereFirst(row.code);
  if (shape === "held") return planisphereHeld(row.code);
  return planisphereLane(row.code) === shape;
}

export function visiblePlanisphere(
  rows: readonly PlanisphereRow[],
  lane: string,
  hue: string,
  query: string,
  review: PlanisphereReview,
  reviewed: readonly string[],
  shape: PlanisphereShape,
): PlanisphereRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (planisphereState(row.code) === "") return false;
    const found = planisphereLane(row.code);
    const hueName = planisphereHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${planisphereStamp(row.code)} ${planisphereFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function planisphereLanesCsv(rows: readonly PlanisphereRow[]): string {
  const lines = ["lane,count"];
  for (const line of planisphereLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function planisphereRowsCsv(rows: readonly PlanisphereRow[], reviewed: readonly string[]): string {
  const lines = ["name,city,stamp,family,lane,hue,length,code,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(planisphereCopy(row.code)),
        planisphereStamp(row.code),
        csvCell(planisphereFamily(row.code)),
        planisphereLane(row.code),
        planisphereHue(row.code),
        planisphereLength(row.code) ?? "",
        planisphereCode(row.code) ? "1" : "0",
        planisphereJoin(row.code) ? "1" : "0",
        planisphereGap(row.code) ? "1" : "0",
        planisphereBead(row.code) ? "1" : "0",
        planisphereEven(row.code) ? "1" : "0",
        planisphereDigit(row.code) ? "1" : "0",
        planisphereMixed(row.code) ? "1" : "0",
        planisphereUpper(row.code) ? "1" : "0",
        planisphereVowel(row.code) ? "1" : "0",
        planisphereTail(row.code) ? "1" : "0",
        planisphereHeld(row.code) ? "1" : "0",
        planisphereSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
