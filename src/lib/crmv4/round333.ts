/**
 * Overcoil rules for a Breguet overcoil kept in this browser, and torquetum plates read the active flag already stored on the account.
 * Parts are coil, collet, stud, and terminal. Finishes are gilt, ivory, and graphite.
 * Arcs are 4, 8, 16, or 24. Lifts are 2, 6, or 10.
 * A known state is LIVE, HOLD, WATCH, or REST. An ampersand joins two states. A semicolon marks a gap.
 * A bead is exactly six characters. A ribbon is eighteen characters or longer. An index starts with a digit. A vowel name starts with a vowel.
 * A live account reads as LIVE. A frozen account reads as HOLD.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_overcoil (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   maker text not null default '',
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
 * CREATE TABLE crm_torquetum_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_torquetum_review (
 *   trader_id text primary key
 * );
 */
export const OVC_KEY = "crmv4-overcoil";
export const OVC_VIEW_KEY = "crmv4-overcoil-views";
export const OVC_DENSITY_KEY = "crmv4-overcoil-density";
export const OVC_LIMBS = ["coil", "collet", "stud", "terminal"] as const;

export type OvercoilLimb = (typeof OVC_LIMBS)[number];
export type OvercoilFilm = "blank" | "gilt" | "ivory" | "graphite";
export type OvercoilTray = "board" | "peg" | "coffer";
export type OvercoilDensity = "airy" | "close";
export type OvercoilSort = "limb" | "maker";

export type Overcoil = {
  id: string;
  title: string;
  note: string;
  maker: string;
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

export type OvercoilView = {
  id: string;
  name: string;
  tray: OvercoilTray;
  query: string;
  maker: string;
  film: string;
  limb: string;
  beat: string;
  rate: string;
};

export type OvercoilCounts = {
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

export const ROUND333_FEATURES = [
  "overcoil-save",
  "coil-notices",
  "coil-parts",
  "coil-search",
  "rate-sla",
  "casket",
  "pin-star",
  "inline-edit",
  "coil-filters",
  "saved-views",
  "desk-density",
  "maker-sort",
  "desk-kpis",
  "arc-chart",
  "arc-timeline",
  "bulk-actions",
  "csv-export",
  "keyboard-shortcuts",
  "audit-trail",
  "fair-maker",
  "viewer-role",
  "suggest-coil",
  "overdue-reminders",
  "active-torquetum",
  "torquetum-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "poise", "free", "peg", "return", "coffer", "open", "tag", "rate", "beat", "lower", "star"] as const;
const FILMS = ["gilt", "ivory", "graphite"] as const;
const BEAT_CYCLE = [4, 8, 16, 24] as const;
const RATE_CYCLE = [2, 6, 10] as const;
const INNER = new Set(["coil", "collet"]);
const OUTER = new Set(["stud", "terminal"]);
const QUIET_FILM = new Set(["IVORY", "GRAPHITE"]);
const SYSTEMS = new Set(["LIVE", "HOLD", "WATCH", "REST"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): OvercoilTray {
  return raw === "peg" || raw === "coffer" ? raw : "board";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<OvercoilFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<OvercoilFilm, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Overcoil, tray: OvercoilTray): boolean {
  if (tray === "peg") return card.pegged && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.pegged && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function limbIndex(limb: string): number {
  return OVC_LIMBS.indexOf(limb as OvercoilLimb);
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

export function overcoilLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (OVC_LIMBS as readonly string[]).includes(text) ? text : "";
}

/** A beat is 2, 5, 8, or 11. Anything else stays blank. */
export function overcoilBeat(raw: unknown): 4 | 8 | 16 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "24") return null;
  return Number(text) as 4 | 8 | 16 | 24;
}

/** A rate is 2, 6, or 10. Anything else stays blank. */
export function overcoilRate(raw: unknown): 2 | 6 | 10 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10") return null;
  return Number(text) as 2 | 6 | 10;
}

/** A film is gilt, ivory, or graphite. The saved name is the upper token. */
export function overcoilFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function overcoilInner(limb: unknown): boolean {
  return INNER.has(clip(limb, 12).toLowerCase());
}

export function overcoilOuter(limb: unknown): boolean {
  return OUTER.has(clip(limb, 12).toLowerCase());
}

/** Drum is the barrel. Axle is the arbor. Eye is the hook. Pawl is the click. */
export function overcoilBand(limb: unknown): string {
  const text = overcoilLimb(limb);
  if (!text) return "";
  if (text === "coil") return "spiral";
  if (text === "collet") return "boss";
  if (text === "stud") return "pin";
  return "end";
}

/** Signed distance from one limb to another along the overcoil. */
export function overcoilGap(from: unknown, to: unknown): number | null {
  const left = limbIndex(overcoilLimb(from));
  const right = limbIndex(overcoilLimb(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietFilm(film: unknown): boolean {
  return QUIET_FILM.has(overcoilFilm(film));
}

/** A pair rate is 6. Two and ten are not a pair. */
export function pairRate(rate: unknown): boolean {
  return overcoilRate(rate) === 6;
}

/** A full rate is 10. */
export function fullRate(rate: unknown): boolean {
  return overcoilRate(rate) === 10;
}

export function activeLimb(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return overcoilLimb(text) || "all";
}

export function activeBeat(raw: unknown): string {
  const beat = overcoilBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = overcoilFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRate(raw: unknown): string {
  const rate = overcoilRate(raw);
  return rate === null ? "all" : String(rate);
}

export function moveOvercoilFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the board uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestFilm(cards: readonly Overcoil[]): string {
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
export function suggestBeat(cards: readonly Overcoil[], hour: number): 4 | 8 | 16 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "board") || card.beat === null) continue;
    seen = true;
    counts.set(card.beat, (counts.get(card.beat) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 24 = 4;
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
  if (hour < 11) return 8;
  if (hour < 17) return 16;
  return 24;
}

/** Before eight, suggest the barrel. The rest of the day suggests the click. */
export function suggestLimb(hour: number): OvercoilLimb {
  return hour < 10 ? "coil" : "terminal";
}

/** The maker with the fewest unpoised cards on the board. A tie keeps the roster order. */
export function fairMaker(cards: readonly Overcoil[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "board") && !card.poised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.maker.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readOvercoilRules(raw: unknown): Overcoil[] {
  if (!Array.isArray(raw)) return [];
  const out: Overcoil[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Overcoil>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      maker: clip(row.maker, 24),
      limb: overcoilLimb(row.limb),
      beat: overcoilBeat(row.beat),
      film: overcoilFilm(row.film),
      rate: overcoilRate(row.rate) ?? 2,
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

export function addOvercoil(
  cards: readonly Overcoil[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    maker?: string;
    limb?: string;
    beat?: unknown;
    film?: string;
    rate?: unknown;
    tags?: unknown;
  },
): Overcoil[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `h${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOvercoilRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      maker: clip(card.maker, 24),
      limb: overcoilLimb(card.limb),
      beat: overcoilBeat(card.beat),
      film: overcoilFilm(card.film),
      rate: overcoilRate(card.rate) ?? 2,
      tags: tagsOf(card.tags),
      poised: false,
      pegged: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Overcoil[], id: string, edit: (card: Overcoil) => Overcoil): Overcoil[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOvercoil(cards: readonly Overcoil[], id: string, title: string): Overcoil[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOvercoilNote(cards: readonly Overcoil[], id: string, note: string): Overcoil[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(overcoilFilm(film));
  return order[(index + 1) % order.length] || "GILT";
}

export function setOvercoilFilm(cards: readonly Overcoil[], id: string, film: string): Overcoil[] {
  const next = overcoilFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setOvercoilPoise(cards: readonly Overcoil[], id: string, poised: boolean): Overcoil[] {
  return mapCard(cards, id, (card) => (card.poised === poised ? card : { ...card, poised, audit: poised ? "poise" : "free" }));
}

export function setOvercoilPeg(cards: readonly Overcoil[], id: string, pegged: boolean): Overcoil[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, coffered: pegged ? false : card.coffered, audit: pegged ? "peg" : "return" }));
}

export function setOvercoilCoffer(cards: readonly Overcoil[], id: string, coffered: boolean): Overcoil[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, pegged: coffered ? false : card.pegged, audit: coffered ? "coffer" : "open" }));
}

export function setOvercoilStar(cards: readonly Overcoil[], id: string, starred: boolean): Overcoil[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addOvercoilTag(cards: readonly Overcoil[], id: string, tag: string): Overcoil[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepBeat(beat: number | null, dir: 1 | -1): 4 | 8 | 16 | 24 {
  if (beat === null) return dir > 0 ? 4 : 24;
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

function stepRate(rate: number, dir: 1 | -1): 2 | 6 | 10 {
  const index = rateIndex(rate);
  const next = index < 0 ? 0 : (index + dir + RATE_CYCLE.length) % RATE_CYCLE.length;
  return RATE_CYCLE[next];
}

export function raiseBeatFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeatFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "lower" }));
}

export function raiseRateFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, 1), audit: "rate" }));
}

export function lowerRateFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return mapCard(cards, id, (card) => ({ ...card, rate: stepRate(card.rate, -1), audit: "rate" }));
}

export function setOvercoilFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, poised: !card.poised, audit: card.poised ? "free" : "poise" })) : [...cards];
}

export function pegOvercoilFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return setOvercoilPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starOvercoilFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  return setOvercoilStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Overcoil[], id: string): Overcoil[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOvercoilFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Overcoil[], ids: readonly string[], edit: (card: Overcoil) => Overcoil): Overcoil[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOvercoilGraphite(cards: readonly Overcoil[], ids: readonly string[]): Overcoil[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkOvercoilPoise(cards: readonly Overcoil[], ids: readonly string[]): Overcoil[] {
  return bulk(cards, ids, (card) => (card.poised ? card : { ...card, poised: true, audit: "poise" }));
}

export function bulkOvercoilCoffer(cards: readonly Overcoil[], ids: readonly string[]): Overcoil[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, pegged: false, audit: "coffer" }));
}

export function bulkOvercoilTag(cards: readonly Overcoil[], ids: readonly string[]): Overcoil[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readOvercoilViews(raw: unknown): OvercoilView[] {
  if (!Array.isArray(raw)) return [];
  const out: OvercoilView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OvercoilView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      maker: clip(row.maker, 24),
      film: activeFilm(row.film, ["GILT", "IVORY", "GRAPHITE"]),
      limb: activeLimb(row.limb),
      beat: activeBeat(row.beat),
      rate: activeRate(row.rate),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOvercoilView(views: readonly OvercoilView[], view: OvercoilView): OvercoilView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOvercoilViews([...views, { ...view, id, name }]);
}

export function dropOvercoilView(views: readonly OvercoilView[], id: string): OvercoilView[] {
  return views.filter((view) => view.id !== id);
}

export function overcoilDensity(raw: unknown): OvercoilDensity {
  return raw === "close" ? "close" : "airy";
}

export function sortOvercoilRules(cards: readonly Overcoil[], sort: OvercoilSort): Overcoil[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "maker") {
      const maker = a.maker.localeCompare(b.maker);
      if (maker) return maker;
    } else {
      const limb = limbIndex(a.limb) - limbIndex(b.limb);
      if (limb) return limb;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleOvercoilRules(
  cards: readonly Overcoil[],
  tray: OvercoilTray,
  query: string,
  maker: string,
  film: string,
  limb: string,
  beat: string,
  rate: string,
): Overcoil[] {
  const text = query.trim().toLowerCase();
  const wantMaker = clip(maker, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : overcoilFilm(film);
  const wantLimb = activeLimb(limb);
  const wantBeat = activeBeat(beat);
  const wantRate = activeRate(rate);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.maker}`.toLowerCase().includes(text)) return false;
    if (wantMaker && card.maker.toLowerCase() !== wantMaker) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantLimb === "inner" && !overcoilInner(card.limb)) return false;
    if (wantLimb === "outer" && !overcoilOuter(card.limb)) return false;
    if (wantLimb !== "all" && wantLimb !== "inner" && wantLimb !== "outer" && card.limb !== wantLimb) return false;
    if (wantBeat !== "all" && String(card.beat ?? "") !== wantBeat) return false;
    if (wantRate !== "all" && String(card.rate) !== wantRate) return false;
    return true;
  });
}

/** An outer limb on rate two, still unpoised and not in the coffer, is overdue. */
export function overdueOvercoil(card: Overcoil): boolean {
  return overcoilOuter(card.limb) && card.rate === 2 && !card.poised && !card.coffered;
}

/** No film, the short beat, rate two, and still on the board. */
export function idleOvercoil(card: Overcoil): boolean {
  return !card.film && card.beat === 4 && card.rate === 2 && !card.poised && !card.pegged && !card.coffered;
}

/** Gilt, the tall turn, and a full pull, still out of the vault. */
export function briskOvercoil(card: Overcoil): boolean {
  return card.film === "GILT" && card.beat === 24 && card.rate === 10 && !card.coffered;
}

/** Curb, ivory, and beat five. */
export function restingOvercoil(card: Overcoil): boolean {
  return card.limb === "terminal" && card.film === "IVORY" && card.beat === 8;
}

/** A barrel is late when the station is already on the click. */
export function lateOvercoil(card: Overcoil, station: string): boolean {
  return card.limb === "coil" && overcoilLimb(station) === "terminal" && !card.poised;
}

export function overcoilCounts(cards: readonly Overcoil[], shown: readonly Overcoil[], station: string): OvercoilCounts {
  return {
    board: cards.filter((card) => inTray(card, "board")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    poised: cards.filter((card) => card.poised).length,
    inner: cards.filter((card) => overcoilInner(card.limb)).length,
    outer: cards.filter((card) => overcoilOuter(card.limb)).length,
    tall: cards.filter((card) => card.beat === 24).length,
    quiet: cards.filter((card) => quietFilm(card.film)).length,
    beat: cards.reduce((sum, card) => sum + (card.beat || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleOvercoil).length,
    brisk: cards.filter(briskOvercoil).length,
    resting: cards.filter(restingOvercoil).length,
    overdue: cards.filter(overdueOvercoil).length,
    pair: cards.filter((card) => pairRate(card.rate) && lateOvercoil(card, station)).length,
  };
}

export function overcoilBars(cards: readonly Overcoil[]): { limb: string; count: number }[] {
  return OVC_LIMBS.map((limb) => ({ limb, count: cards.filter((card) => card.limb === limb && !card.coffered).length }));
}

export function overcoilTimeline(cards: readonly Overcoil[]): { beat: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "board"));
  return BEAT_CYCLE.map((beat) => ({ beat, titles: open.filter((card) => card.beat === beat).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function overcoilMakers(cards: readonly Overcoil[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.maker && !out.some((name) => name.toLowerCase() === card.maker.toLowerCase())) out.push(card.maker);
  }
  return out;
}

export function busiestMaker(cards: readonly Overcoil[]): string {
  const open = cards.filter((card) => inTray(card, "board") && !card.poised && card.maker);
  let best = "";
  let score = 0;
  for (const name of overcoilMakers(open)) {
    const count = open.filter((card) => card.maker.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOvercoilRules(cards: readonly Overcoil[]): string[] {
  return cards.filter(overdueOvercoil).map((card) => card.title);
}

export function overcoilCopy(card: Overcoil): string {
  return [card.title, card.maker, card.limb, card.film, card.beat ?? "", card.rate, card.note].filter((item) => item !== "").join(" · ");
}

export function overcoilCsv(cards: readonly Overcoil[], station: string): string {
  const lines = ["title,maker,limb,film,beat,rate,tags,poised,peg,coffer,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.maker),
        card.limb,
        card.film,
        card.beat ?? "",
        card.rate,
        card.tags.join(" "),
        card.poised ? "1" : "0",
        card.pegged ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        overcoilOuter(card.limb) ? "1" : "0",
        lateOvercoil(card, station) ? "1" : "0",
        idleOvercoil(card) ? "1" : "0",
        briskOvercoil(card) ? "1" : "0",
        restingOvercoil(card) ? "1" : "0",
        overdueOvercoil(card) ? "1" : "0",
        overcoilInner(card.limb) ? "1" : "0",
        quietFilm(card.film) ? "1" : "0",
        overcoilBand(card.limb),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const TQM_KEY = "crmv4-torquetum-hide";
export const TQM_REVIEW_KEY = "crmv4-torquetum-review";

export type TorquetumLane = "" | "live" | "hold" | "watch" | "rest" | "join" | "gap" | "bead" | "ribbon" | "mark" | "vowel" | "plain";
export type TorquetumHue = "" | "ivory" | "graphite" | "champagne";
export type TorquetumState = "" | "clear" | "set";
export type TorquetumReview = "all" | "reviewed" | "fresh";
export type TorquetumShape =
  | "all"
  | "live"
  | "hold"
  | "watch"
  | "rest"
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

export type TorquetumValue = string | { active?: unknown; [key: string]: unknown } | null | undefined;
export type TorquetumRow = { id: string; label: string; code: TorquetumValue };
export type TorquetumLaneLine = { lane: string; count: number };

const CODE_LANES = ["live", "hold", "watch", "rest", "join", "gap", "bead", "ribbon", "mark", "vowel", "plain"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: TorquetumValue): { active?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: TorquetumValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: TorquetumValue): string {
  const row = codeRecord(raw);
  if (row && !("active" in row)) return "";
  const value = row ? row.active : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "HOLD";
  return clip(value, 48);
}

function codeReadable(raw: TorquetumValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("active" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function torquetumState(raw: TorquetumValue): TorquetumState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known city is NYC, LON, PAR, or DXB. An ampersand joins two cities. A semicolon marks a gap. A bead is exactly eight characters. A ribbon is twenty characters or longer. An index starts with a digit. A vowel name starts with a vowel. */
export function torquetumLane(raw: TorquetumValue): TorquetumLane {
  if (torquetumState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (SYSTEMS.has(upper)) {
    if (upper === "LIVE") return "live";
    if (upper === "HOLD") return "hold";
    if (upper === "WATCH") return "watch";
    return "rest";
  }
  if (text === "NONE") return "plain";
  if (text.includes("&")) return "join";
  if (text.includes(";")) return "gap";
  if (text.length === 6) return "bead";
  if (text.length >= 18) return "ribbon";
  if (/^[0-9]/.test(text)) return "mark";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "plain";
}

export function torquetumHue(raw: TorquetumValue): TorquetumHue {
  const lane = torquetumLane(raw);
  if (!lane) return "";
  if (lane === "live" || lane === "watch") return "champagne";
  if (lane === "hold" || lane === "rest" || lane === "join" || lane === "gap" || lane === "ribbon") return "graphite";
  return "ivory";
}

export function torquetumLive(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "live";
}

export function torquetumHold(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "hold";
}

export function torquetumWatch(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "watch";
}

export function torquetumRest(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "rest";
}

export function torquetumJoin(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "join";
}

export function torquetumGap(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "gap";
}

export function torquetumBead(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "bead";
}

export function torquetumRibbon(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "ribbon";
}

export function torquetumMark(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "mark";
}

export function torquetumVowelLane(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "vowel";
}

export function torquetumPlain(raw: TorquetumValue): boolean {
  return torquetumLane(raw) === "plain";
}

export function torquetumOpen(raw: TorquetumValue): boolean {
  return torquetumState(raw) === "clear";
}

/** A ribbon or an index can stay as written. */
export function torquetumHeld(raw: TorquetumValue): boolean {
  const lane = torquetumLane(raw);
  return lane === "ribbon" || lane === "mark";
}

/** A bead, or a nine-character name that is not a known city, still wants a fuller name. */
export function torquetumSoon(raw: TorquetumValue): boolean {
  if (torquetumState(raw) !== "set") return false;
  if (torquetumBead(raw)) return true;
  if (torquetumLive(raw) || torquetumHold(raw) || torquetumWatch(raw) || torquetumRest(raw)) return false;
  return codeGiven(raw).length === 7;
}

export function torquetumLength(raw: TorquetumValue): number | null {
  if (torquetumState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function torquetumEven(raw: TorquetumValue): boolean {
  const length = torquetumLength(raw);
  return length !== null && length % 2 === 0;
}

export function torquetumOdd(raw: TorquetumValue): boolean {
  const length = torquetumLength(raw);
  return length !== null && length % 2 === 1;
}

export function torquetumFirst(raw: TorquetumValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function torquetumTail(raw: TorquetumValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function torquetumCapital(raw: TorquetumValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function torquetumSpace(raw: TorquetumValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function torquetumVowel(raw: TorquetumValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function torquetumDigit(raw: TorquetumValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function torquetumLetter(raw: TorquetumValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function torquetumMixed(raw: TorquetumValue): boolean {
  return torquetumDigit(raw) && torquetumLetter(raw);
}

export function torquetumLower(raw: TorquetumValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital bead is five letters or more, written entirely in capitals. */
export function torquetumUpper(raw: TorquetumValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function torquetumStamp(raw: TorquetumValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function torquetumCopy(raw: TorquetumValue): string {
  return codeGiven(raw);
}

export function torquetumFamily(raw: TorquetumValue): string {
  if (torquetumState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function torquetumLanes(rows: readonly TorquetumRow[]): TorquetumLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = torquetumLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingTorquetum(rows: readonly TorquetumRow[]): string {
  const lines = torquetumLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingTorquetumHue(rows: readonly TorquetumRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = torquetumHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneTorquetumCount(rows: readonly TorquetumRow[], lane: TorquetumLane): number {
  return rows.filter((row) => torquetumLane(row.code) === lane).length;
}

export function torquetumShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTorquetumLanes(rows: readonly TorquetumRow[]): string[] {
  return torquetumLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenTorquetum(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTorquetum(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTorquetum(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleTorquetumReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTorquetumReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTorquetumLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: TorquetumRow, shape: TorquetumShape): boolean {
  if (shape === "all") return true;
  if (shape === "live") return torquetumLive(row.code);
  if (shape === "hold") return torquetumHold(row.code);
  if (shape === "watch") return torquetumWatch(row.code);
  if (shape === "rest") return torquetumRest(row.code);
  if (shape === "join") return torquetumJoin(row.code);
  if (shape === "gap") return torquetumGap(row.code);
  if (shape === "bead") return torquetumBead(row.code);
  if (shape === "ribbon") return torquetumRibbon(row.code);
  if (shape === "mark") return torquetumMark(row.code);
  if (shape === "vowel") return torquetumVowelLane(row.code);
  if (shape === "plain") return torquetumPlain(row.code);
  if (shape === "open") return torquetumOpen(row.code);
  if (shape === "soon") return torquetumSoon(row.code);
  if (shape === "letter") return torquetumLetter(row.code);
  if (shape === "mixed") return torquetumMixed(row.code);
  if (shape === "upper") return torquetumUpper(row.code);
  if (shape === "lower") return torquetumLower(row.code);
  if (shape === "space") return torquetumSpace(row.code);
  if (shape === "even") return torquetumEven(row.code);
  if (shape === "odd") return torquetumOdd(row.code);
  if (shape === "tail") return torquetumTail(row.code);
  if (shape === "first") return torquetumFirst(row.code);
  if (shape === "held") return torquetumHeld(row.code);
  return torquetumLane(row.code) === shape;
}

export function visibleTorquetum(
  rows: readonly TorquetumRow[],
  lane: string,
  hue: string,
  query: string,
  review: TorquetumReview,
  reviewed: readonly string[],
  shape: TorquetumShape,
): TorquetumRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (torquetumState(row.code) === "") return false;
    const found = torquetumLane(row.code);
    const hueName = torquetumHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${torquetumStamp(row.code)} ${torquetumFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function torquetumLanesCsv(rows: readonly TorquetumRow[]): string {
  const lines = ["lane,count"];
  for (const line of torquetumLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function torquetumRowsCsv(rows: readonly TorquetumRow[], reviewed: readonly string[]): string {
  const lines = ["name,state,stamp,family,lane,hue,length,live,hold,watch,rest,join,gap,bead,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(torquetumCopy(row.code)),
        torquetumStamp(row.code),
        csvCell(torquetumFamily(row.code)),
        torquetumLane(row.code),
        torquetumHue(row.code),
        torquetumLength(row.code) ?? "",
        torquetumLive(row.code) ? "1" : "0",
        torquetumHold(row.code) ? "1" : "0",
        torquetumWatch(row.code) ? "1" : "0",
        torquetumRest(row.code) ? "1" : "0",
        torquetumJoin(row.code) ? "1" : "0",
        torquetumGap(row.code) ? "1" : "0",
        torquetumBead(row.code) ? "1" : "0",
        torquetumEven(row.code) ? "1" : "0",
        torquetumDigit(row.code) ? "1" : "0",
        torquetumMixed(row.code) ? "1" : "0",
        torquetumUpper(row.code) ? "1" : "0",
        torquetumVowel(row.code) ? "1" : "0",
        torquetumTail(row.code) ? "1" : "0",
        torquetumHeld(row.code) ? "1" : "0",
        torquetumSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
