/**
 * Hairspring rules for a balance spring kept in this browser, and equation plates read the operating system already stored on the account.
 * Limbs are collet, coil, stud, and curb. Films are gilt, ivory, and graphite.
 * Beats are 2, 5, 8, or 11. Rates are 2, 6, or 10.
 * A known system is WIN, MAC, IOS, or AND. A plus contains a plus. A bar contains a pipe.
 * A bead is exactly six characters. A ribbon is sixteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A true system reads as WIN. A false system reads as IDLE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_hairspring (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   warden text not null default '',
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
 * CREATE TABLE crm_equation_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_equation_review (
 *   trader_id text primary key
 * );
 */
export const HSP_KEY = "crmv4-hairspring";
export const HSP_VIEW_KEY = "crmv4-hairspring-views";
export const HSP_DENSITY_KEY = "crmv4-hairspring-density";
export const HSP_LIMBS = ["collet", "coil", "stud", "curb"] as const;

export type HairspringLimb = (typeof HSP_LIMBS)[number];
export type HairspringFilm = "blank" | "gilt" | "ivory" | "graphite";
export type HairspringTray = "board" | "peg" | "coffer";
export type HairspringDensity = "airy" | "close";
export type HairspringSort = "limb" | "warden";

export type Hairspring = {
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

export type HairspringView = {
  id: string;
  name: string;
  tray: HairspringTray;
  query: string;
  warden: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type HairspringCounts = {
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

export const ROUND331_FEATURES = [
  "hairspring-save",
  "notice-center",
  "coil-parts",
  "quick-search",
  "rate-sla",
  "chest",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "warden-sort",
  "desk-kpis",
  "beat-chart",
  "beat-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-warden",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "os-equation",
  "equation-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [2, 5, 8, 11] as const;
const RATE_CYCLE = [2, 6, 10] as const;
const INNER = new Set(["collet", "coil"]);
const OUTER = new Set(["stud", "curb"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["WIN", "MAC", "IOS", "AND"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HairspringTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<HairspringFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<HairspringFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[hs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Hairspring, tray: HairspringTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return HSP_LIMBS.indexOf(limb as HairspringLimb);
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

export function hairspringLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (HSP_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A beat is 2, 5, 8, or 11. Anything else stays blank. */
export function hairspringBeat(raw: unknown): 2 | 5 | 8 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8" && text !== "11") return null;
  return Number(text) as 2 | 5 | 8 | 11;
}

/** A rate is 2, 6, or 10. Anything else stays blank. */
export function hairspringRate(raw: unknown): 2 | 6 | 10 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10") return null;
  return Number(text) as 2 | 6 | 10;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function hairspringFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function hairspringInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function hairspringOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Eye is the collet. Spiral is the coil. Post is the stud. Index is the curb. */
export function hairspringBand(limb: unknown): string {
  const text = hairspringLimb(limb);
  if (!text) return "";
  if (text === "collet") return "eye";
  if (text === "coil") return "spiral";
  if (text === "stud") return "post";
  return "index";
}

/** Signed distance from one limb to another along the hairspring. */
export function hairspringGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(hairspringLimb(from));
  const right = limbIndex(hairspringLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFilm(film: unknown): boolean {
  return QUIET_FILM.has(hairspringFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairRate(rate: unknown): boolean {
  return hairspringRate(rate) === 6;
}

/** A full rate is 10. */
export function fullRate(rate: unknown): boolean {
  return hairspringRate(rate) === 10;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return hairspringLimb(text) || "all";
}

export function activeBeat(raw: unknown): string {
  const beat = hairspringBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = hairspringFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRate(raw: unknown): string {
  const rate = hairspringRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveHairspringFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFilm(cards: readonly Hairspring[]): string {
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

/** Before four, suggest beat two. Before nine, suggest beat five. Before three in the afternoon, suggest beat eight. Later, suggest beat eleven. A saved beat on the board wins, and a tie keeps the shorter beat. */
export function suggestBeat(cards: readonly Hairspring[], hour: number): 2 | 5 | 8 | 11 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 8 | 11 = 2;
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
  if (hour < 4) return 2;
  if (hour < 9) return 5;
  if (hour < 15) return 8;
  return 11;
}

/** Before eight, suggest the collet. The rest of the day suggests the curb. */
export function suggestLimb(hour: number): HairspringLimb {
  return hour < 8 ? "collet" : "curb";
}

/** The warden with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairWarden(cards: readonly Hairspring[], roster: string): string {
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

export function readHairspringRules(raw: unknown): Hairspring[] {
  if (!Array.isArray(raw)) return [];
  const out: Hairspring[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Hairspring>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      warden: clip(row.warden, 24),
      limb: hairspringLimb(row.limb),
      beat: hairspringBeat(row.beat),
      film: hairspringFilm(row.film),
      rate: hairspringRate(row.rate) ?? 2,
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

export function addHairspring(
  cards: readonly Hairspring[],
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
): Hairspring[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `h${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readHairspringRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      warden: clip(card.warden, 24),
      limb: hairspringLimb(card.limb),
      beat: hairspringBeat(card.beat),
      film: hairspringFilm(card.film),
      rate: hairspringRate(card.rate) ?? 2,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Hairspring[], id: string, edit: (card: Hairspring) => Hairspring): Hairspring[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editHairspring(cards: readonly Hairspring[], id: string, title: string): Hairspring[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editHairspringNote(cards: readonly Hairspring[], id: string, note: string): Hairspring[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(hairspringFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setHairspringFilm(cards: readonly Hairspring[], id: string, film: string): Hairspring[] {
  const next = hairspringFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setHairspringPoise(cards: readonly Hairspring[], id: string, poised: boolean): Hairspring[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setHairspringPeg(cards: readonly Hairspring[], id: string, pegged: boolean): Hairspring[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setHairspringCoffer(cards: readonly Hairspring[], id: string, coffered: boolean): Hairspring[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setHairspringStar(cards: readonly Hairspring[], id: string, starred: boolean): Hairspring[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addHairspringTag(cards: readonly Hairspring[], id: string, tag: string): Hairspring[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 2 | 5 | 8 | 11 {
  if (beat === null) return dir > 0 ? 2 : 11;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 2 | 6 | 10 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setHairspringFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegHairspringFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return setHairspringPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starHairspringFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  return setHairspringStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Hairspring[], id: string): Hairspring[] {
  const card = cards.find((item) => item.id === id);
  return card ? setHairspringFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Hairspring[], ids: readonly string[], edit: (card: Hairspring) => Hairspring): Hairspring[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkHairspringGraphite(cards: readonly Hairspring[], ids: readonly string[]): Hairspring[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkHairspringPoise(cards: readonly Hairspring[], ids: readonly string[]): Hairspring[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkHairspringCoffer(cards: readonly Hairspring[], ids: readonly string[]): Hairspring[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkHairspringTag(cards: readonly Hairspring[], ids: readonly string[]): Hairspring[] {
  return bulk(cards, ids, (card) => (card.tags.includes("h") ? card : { ...card, tags: tagsOf([...card.tags, "h"]), audit: "tag" }));
}

export function readHairspringViews(raw: unknown): HairspringView[] {
  if (!Array.isArray(raw)) return [];
  const out: HairspringView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HairspringView>;
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

export function addHairspringView(views: readonly HairspringView[], view: HairspringView): HairspringView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readHairspringViews([...views, { ...view, id, name }]);
}

export function dropHairspringView(views: readonly HairspringView[], id: string): HairspringView[] {
  return views.filter((view) => view.id !== id);
}

export function hairspringDensity(raw: unknown): HairspringDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortHairspringRules(cards: readonly Hairspring[], sort: HairspringSort): Hairspring[] {
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

export function visibleHairspringRules(
  cards: readonly Hairspring[],
  tray: HairspringTray,
  query: string,
  warden: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Hairspring[] {
  const text = query.trim().toLowerCase();
  const wantWarden = clip(warden, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : hairspringFilm(film);
  const wantLimb = activeLimb(limb);
  const wantBeat = activeBeat(beat);
  const wantRate = activeRate(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.warden}`.toLowerCase().includes(text)) return false;
    if (wantWarden && card.warden.toLowerCase() !== wantWarden) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !hairspringInner(card.limb)) return false;
    if (wantLimb === "outer" && !hairspringOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueHairspring(card: Hairspring): boolean {
  return hairspringOuter(card.limb) && card.rate === 2 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleHairspring(card: Hairspring): boolean {
  return !card.film && card.beat === 2 && card.rate === 2 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall beat, and a full rate, still out of the coffer. */
export function briskHairspring(card: Hairspring): boolean {
  return card.film === "GILT" && card.beat === 11 && card.rate === 10 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingHairspring(card: Hairspring): boolean {
  return card.limb === "curb" && card.film === "IVORY" && card.beat === 5;
}

/** A collet is late when the station is already on the curb. */
export function lateHairspring(card: Hairspring, station: string): boolean {
  return card.limb === "collet" && hairspringLimb(station) === "curb" && !card.poised;
}

export function hairspringCounts(cards: readonly Hairspring[], shown: readonly Hairspring[], station: string): HairspringCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => hairspringInner(card.limb)).length,
    outer: cards.filter((card) => hairspringOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 11).length,
    quiet: cards.filter((card) => quietFilm(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleHairspring).length,
    brisk: cards.filter(briskHairspring).length,
    resting: cards.filter(restingHairspring).length,
    overdue: cards.filter(overdueHairspring).length,
    pair: cards.filter((card) => pairRate(card.rate) && lateHairspring(card, station)).length,
  };
}

export function hairspringBars(cards: readonly Hairspring[]): { limb: string; count: number }[] {
  return HSP_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function hairspringTimeline(cards: readonly Hairspring[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function hairspringWardens(cards: readonly Hairspring[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.warden && !out.some((name) => name.toLowerCase() === card.warden.toLowerCase())) out.push(card.warden);
  }
  return out;
}

export function busiestWarden(cards: readonly Hairspring[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.warden);
  let best = "";
  let score = 0;
  for (const name of hairspringWardens(open)) {
    const count = open.filter((card) => card.warden.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderHairspringRules(cards: readonly Hairspring[]): string[] {
  return cards.filter(overdueHairspring).map((card) => card.title);
}

export function hairspringCopy(card: Hairspring): string {
  return [card.title, card.warden, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function hairspringCsv(cards: readonly Hairspring[], station: string): string {
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
        hairspringOuter(card.limb) ? "1" : "0",
        lateHairspring(card, station) ? "1" : "0",
        idleHairspring(card) ? "1" : "0",
        briskHairspring(card) ? "1" : "0",
        restingHairspring(card) ? "1" : "0",
        overdueHairspring(card) ? "1" : "0",
        hairspringInner(card.limb) ? "1" : "0",
        quietFilm(card.film) ? "1" : "0",
        hairspringBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const EQN_KEY = "crmv4-equation-hide";
export const EQN_REVIEW_KEY = "crmv4-equation-review";

export type EquationLane = "" | "code" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type EquationHue = "" | "ivory" | "graphite" | "champagne";
export type EquationState = "" | "clear" | "set";
export type EquationReview = "all" | "reviewed" | "fresh";
export type EquationShape =
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

export type EquationValue = string | { lastOs?: unknown; [key: string]: unknown } | null | undefined;
export type EquationRow = { id: string; label: string; code: EquationValue };
export type EquationLaneLine = { lane: string; count: number };

const CODE_LANES = ["code", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: EquationValue): { lastOs?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: EquationValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: EquationValue): string {
  const row = codeRecord(raw);
  if (row && !("lastOs" in row)) return "";
  const value = row ? row.lastOs : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "WIN";
  if (value === false || value === "false" || value === "0" || value === 0) return "IDLE";
  return clip(value, 48);
}

function codeReadable(raw: EquationValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("lastOs" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function equationState(raw: EquationValue): EquationState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known system is WIN, MAC, IOS, or AND. A plus contains a plus. A bar contains a pipe. A bead is exactly six characters. A ribbon is sixteen characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function equationLane(raw: EquationValue): EquationLane {
  if (equationState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (text === "IDLE") return "plain";
  if (SYSTEMS.has(text.toUpperCase())) return "code";
  if (text.includes("+")) return "join";
  if (text.includes("|")) return "gap";
  if (text.length === 6) return "bead";
  if (text.length >= 16) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function equationHue(raw: EquationValue): EquationHue {
  const lane = equationLane(raw);
  if (!lane) return "";
  if (lane === "code" || lane === "bead") return "champagne";
  if (lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function equationCode(raw: EquationValue): boolean {
  return equationLane(raw) === "code";
}

export function equationJoin(raw: EquationValue): boolean {
  return equationLane(raw) === "join";
}

export function equationGap(raw: EquationValue): boolean {
  return equationLane(raw) === "gap";
}

export function equationBead(raw: EquationValue): boolean {
  return equationLane(raw) === "bead";
}

export function equationRibbon(raw: EquationValue): boolean {
  return equationLane(raw) === "ribbon";
}

export function equationMark(raw: EquationValue): boolean {
  return equationLane(raw) === "mark";
}

export function equationVowelLane(raw: EquationValue): boolean {
  return equationLane(raw) === "vowel";
}

export function equationPlain(raw: EquationValue): boolean {
  return equationLane(raw) === "plain";
}

export function equationOpen(raw: EquationValue): boolean {
  return equationState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function equationHeld(raw: EquationValue): boolean {
  const lane = equationLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a seven-character name that is not a known system, still wants a fuller name. */
export function equationSoon(raw: EquationValue): boolean {
  if (equationState(raw) !== "set") return false;
  if (equationBead(raw)) return true;
  if (equationCode(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function equationLength(raw: EquationValue): number | null {
  if (equationState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function equationEven(raw: EquationValue): boolean {
  const length = equationLength(raw);
  return length !== null && length % 2 === 0;
}

export function equationOdd(raw: EquationValue): boolean {
  const length = equationLength(raw);
  return length !== null && length % 2 === 1;
}

export function equationFirst(raw: EquationValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function equationTail(raw: EquationValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function equationCapital(raw: EquationValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function equationSpace(raw: EquationValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function equationVowel(raw: EquationValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function equationDigit(raw: EquationValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function equationLetter(raw: EquationValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function equationMixed(raw: EquationValue): boolean {
  return equationDigit(raw) && equationLetter(raw);
}

export function equationLower(raw: EquationValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function equationUpper(raw: EquationValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function equationStamp(raw: EquationValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function equationCopy(raw: EquationValue): string {
  return codeGiven(raw);
}

export function equationFamily(raw: EquationValue): string {
  if (equationState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function equationLanes(rows: readonly EquationRow[]): EquationLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = equationLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingEquation(rows: readonly EquationRow[]): string {
  const lines = equationLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingEquationHue(rows: readonly EquationRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = equationHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneEquationCount(rows: readonly EquationRow[], lane: EquationLane): number {
  return rows.filter((row) => equationLane(row.code) === lane).length;
}

export function equationShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentEquationLanes(rows: readonly EquationRow[]): string[] {
  return equationLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenEquation(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedEquation(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleEquation(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleEquationReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkEquationReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleEquationLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: EquationRow, shape: EquationShape): boolean {
  if (shape === "all") return true;
  if (shape === "code") return equationCode(row.code);
  if (shape === "join") return equationJoin(row.code);
  if (shape === "gap") return equationGap(row.code);
  if (shape === "bead") return equationBead(row.code);
  if (shape === "ribbon") return equationRibbon(row.code);
  if (shape === "mark") return equationMark(row.code);
  if (shape === "vowel") return equationVowelLane(row.code);
  if (shape === "plain") return equationPlain(row.code);
  if (shape === "open") return equationOpen(row.code);
  if (shape === "soon") return equationSoon(row.code);
  if (shape === "letter") return equationLetter(row.code);
  if (shape === "mixed") return equationMixed(row.code);
  if (shape === "upper") return equationUpper(row.code);
  if (shape === "lower") return equationLower(row.code);
  if (shape === "space") return equationSpace(row.code);
  if (shape === "even") return equationEven(row.code);
  if (shape === "odd") return equationOdd(row.code);
  if (shape === "tail") return equationTail(row.code);
  if (shape === "first") return equationFirst(row.code);
  if (shape === "held") return equationHeld(row.code);
  return equationLane(row.code) === shape;
}

export function visibleEquation(
  rows: readonly EquationRow[],
  lane: string,
  hue: string,
  query: string,
  review: EquationReview,
  reviewed: readonly string[],
  shape: EquationShape,
): EquationRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (equationState(row.code) === "") return false;
    const found = equationLane(row.code);
    const hueName = equationHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${equationStamp(row.code)} ${equationFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function equationLanesCsv(rows: readonly EquationRow[]): string {
  const lines = ["lane,count"];
  for (const line of equationLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function equationRowsCsv(rows: readonly EquationRow[], reviewed: readonly string[]): string {
  const lines = ["name,system,stamp,family,lane,hue,length,code,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(equationCopy(row.code)),
        equationStamp(row.code),
        csvCell(equationFamily(row.code)),
        equationLane(row.code),
        equationHue(row.code),
        equationLength(row.code) ?? "",
        equationCode(row.code) ? "1" : "0",
        equationJoin(row.code) ? "1" : "0",
        equationGap(row.code) ? "1" : "0",
        equationBead(row.code) ? "1" : "0",
        equationEven(row.code) ? "1" : "0",
        equationDigit(row.code) ? "1" : "0",
        equationMixed(row.code) ? "1" : "0",
        equationUpper(row.code) ? "1" : "0",
        equationVowel(row.code) ? "1" : "0",
        equationTail(row.code) ? "1" : "0",
        equationHeld(row.code) ? "1" : "0",
        equationSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
