/**
 * Cartouche rules kept in this browser,
 * and grisaille plates read the phone already stored on the account.
 * Hands are pomme, lance, feuille, and alpha. Films are ivory, graphite, and champagne.
 * Spans are 10, 20, 40, or 80 minutes. Ribs are 3, 5, or 7.
 * Pomme and lance are the warm half. Feuille and alpha are the cool half.
 * Call, ring, live, open, ready, and yes are the line. Wait, hold, ask, and pend sit the desk.
 * Later, next, and week wait. Bad, void, fail, and lost are returned.
 * Twin and ext are paired. None, nil, blank, and empty stay bare.
 * A plus that is not an international number joins two marks. A colon that is not a date marks a scoped mark.
 * A date today is the line. Within four days is the desk. Within twelve days waits. Older is returned.
 * A brief mark is exactly six characters. A digit mark starts with a digit and is not a date or a desk number.
 * A span mark is sixteen characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words call and ring are the line when they are not a known title. Hidden, sealed, or private is shut.
 * An international number that starts with plus is the line. Seven to fifteen digits sit the desk.
 * A true phone reads as CALL. A false phone reads as NONE.
 * Money fields are not read. The password itself is not read. The plate does not change the saved phone.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cartouche_rule (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   carver text not null default '',
 *   hand text not null default '',
 *   sla_min integer,
 *   film text not null default '',
 *   rib integer not null default 3,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   clipped boolean not null default false,
 *   coffered boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_grisaille_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_grisaille_review (
 *   trader_id text primary key
 * );
 */

export const CRT_KEY = "crmv4-cartouche-378";
export const CRT_VIEW_KEY = "crmv4-cartouche-views-378";
export const CRT_DENSITY_KEY = "crmv4-cartouche-density-378";
export const CRT_HANDS = ["pomme", "lance", "feuille", "alpha"] as const;

export type CartoucheHand = (typeof CRT_HANDS)[number];
export type CartoucheFilm = "blank" | "ivory" | "graphite" | "champagne";
export type CartoucheTray = "tablet" | "clip" | "coffer";
export type CartoucheDensity = "open" | "tight";
export type CartoucheSort = "hand" | "carver";

export type Cartouche = {
  id: string;
  title: string;
  note: string;
  carver: string;
  hand: string;
  sla: number | null;
  film: string;
  rib: number;
  tags: string[];
  raised: boolean;
  clipped: boolean;
  coffered: boolean;
  starred: boolean;
  audit: string;
};

export type CartoucheView = {
  id: string;
  name: string;
  tray: CartoucheTray;
  query: string;
  carver: string;
  film: string;
  hand: string;
  sla: string;
  rib: string;
};

export type CartoucheCounts = {
  tablet: number;
  clip: number;
  coffer: number;
  raised: number;
  warm: number;
  cool: number;
  long: number;
  quiet: number;
  minutes: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND378_FEATURES = [
  "cartouche-save",
  "cartouche-reminders",
  "cartouche-hands",
  "cartouche-search",
  "cartouche-span-sla",
  "cartouche-coffer",
  "cartouche-star",
  "cartouche-inline-title",
  "cartouche-filters",
  "saved-cartouche-views",
  "cartouche-density",
  "cartouche-focus",
  "cartouche-kpis",
  "cartouche-chart",
  "cartouche-timeline",
  "cartouche-bulk",
  "cartouche-csv",
  "cartouche-keys",
  "cartouche-audit",
  "least-open-carver",
  "cartouche-viewer",
  "suggest-hand",
  "overdue-alpha",
  "grisaille-phones",
  "grisaille-csv",
] as const;

const AUDITS = ["save", "edit", "note", "film", "raise", "free", "pin", "return", "vault", "open", "tag", "bead", "sla", "lower", "star"] as const;
const FILMS = ["ivory", "graphite", "champagne"] as const;
const SLA_CYCLE = [10, 20, 40, 80] as const;
const RIB_CYCLE = [3, 5, 7] as const;
const WARM = new Set(["pomme", "lance"]);
const COOL = new Set(["feuille", "alpha"]);
const QUIET_FILM = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CartoucheTray {
  return raw === "clip" || raw === "coffer" ? raw : "tablet";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function filmName(raw: unknown): Exclude<CartoucheFilm, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (FILMS as readonly string[]).includes(text) ? (text as Exclude<CartoucheFilm, "blank">) : "";
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

function inTray(card: Cartouche, tray: CartoucheTray): boolean {
  if (tray === "clip") return card.clipped && !card.coffered;
  if (tray === "coffer") return card.coffered;
  return !card.clipped && !card.coffered;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function handIndex(hand: string): number {
  return CRT_HANDS.indexOf(hand as CartoucheHand);
}

function slaIndex(sla: number): number {
  return SLA_CYCLE.indexOf(sla as (typeof SLA_CYCLE)[number]);
}

function ribIndex(rib: number): number {
  return RIB_CYCLE.indexOf(rib as (typeof RIB_CYCLE)[number]);
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

export function handPoint(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CRT_HANDS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 10, 20, 40, or 80. Anything else stays blank. */
export function handSpan(raw: unknown): 10 | 20 | 40 | 80 | null {
  const text = wholeToken(raw);
  if (text !== "10" && text !== "20" && text !== "40" && text !== "80") return null;
  return Number(text) as 10 | 20 | 40 | 80;
}

/** A rib count is 3, 5, or 7. Anything else stays blank. */
export function handRib(raw: unknown): 3 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "5" && text !== "7") return null;
  return Number(text) as 3 | 5 | 7;
}

/** A film is ivory, graphite, or champagne. The saved name is the upper token. */
export function handFilm(raw: unknown): string {
  const text = filmName(raw);
  return text ? text.toUpperCase() : "";
}

export function handWarm(hand: unknown): boolean {
  return WARM.has(clip(hand, 12).toLowerCase());
}

export function handCool(hand: unknown): boolean {
  return COOL.has(clip(hand, 12).toLowerCase());
}

/** Pomme is first. Lance is second. Feuille is third. Alpha is fourth. */
export function handBand(hand: unknown): string {
  const text = handPoint(hand);
  if (!text) return "";
  if (text === "pomme") return "first";
  if (text === "lance") return "second";
  if (text === "feuille") return "third";
  return "fourth";
}

/** Signed distance from one hand to another along the cartouche. */
export function handGap(from: unknown, to: unknown): number | null {
  const left = handIndex(handPoint(from));
  const right = handIndex(handPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(film: unknown): boolean {
  return QUIET_FILM.has(handFilm(film));
}

/** A pair rib is 5. Three and seven are not a pair. */
export function pairRib(rib: unknown): boolean {
  return handRib(rib) === 5;
}

/** A full rib is 7. */
export function fullRib(rib: unknown): boolean {
  return handRib(rib) === 7;
}

export function activeHand(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return handPoint(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const sla = handSpan(raw);
  return sla === null ? "all" : String(sla);
}

export function activeFilm(raw: unknown, allow: readonly string[]): string {
  const text = handFilm(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRib(raw: unknown): string {
  const rib = handRib(raw);
  return rib === null ? "all" : String(rib);
}

export function moveCartoucheFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The film the tablet uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestFilm(cards: readonly Cartouche[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "tablet") || !card.film) continue;
    counts.set(card.film, (counts.get(card.film) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const film of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(film) || 0;
    if (count < score) {
      best = film;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest ten. Before twelve, suggest twenty. Before eighteen, suggest forty. Later, suggest eighty. A saved minute on the tablet wins, and a tie keeps the shorter minute. */
export function suggestSpan(cards: readonly Cartouche[], hour: number): 10 | 20 | 40 | 80 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "tablet") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 10 | 20 | 40 | 80 = 10;
    let score = Number.POSITIVE_INFINITY;
    for (const sla of SLA_CYCLE) {
      const count = counts.get(sla) || 0;
      if (count < score) {
        best = sla;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 10;
  if (hour < 12) return 20;
  if (hour < 18) return 40;
  return 80;
}

export function suggestHand(hour: number): CartoucheHand {
  if (hour < 6) return "pomme";
  if (hour < 12) return "lance";
  if (hour < 18) return "feuille";
  return "alpha";
}

/** The carver with the fewest unraised cartouches on the tablet. A tie keeps the roster order. */
export function fairCarver(cards: readonly Cartouche[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "tablet") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.carver.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readCartouches(raw: unknown): Cartouche[] {
  if (!Array.isArray(raw)) return [];
  const out: Cartouche[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cartouche>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      carver: clip(row.carver, 24),
      hand: handPoint(row.hand),
      sla: handSpan(row.sla),
      film: handFilm(row.film),
      rib: handRib(row.rib) ?? 3,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      clipped: row.clipped === true,
      coffered: row.coffered === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addCartouche(
  cards: readonly Cartouche[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    carver?: string;
    hand?: string;
    sla?: unknown;
    film?: string;
    rib?: unknown;
    tags?: unknown;
  },
): Cartouche[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCartouches([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      carver: clip(card.carver, 24),
      hand: handPoint(card.hand),
      sla: handSpan(card.sla),
      film: handFilm(card.film),
      rib: handRib(card.rib) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      clipped: false,
      coffered: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cartouche[], id: string, edit: (card: Cartouche) => Cartouche): Cartouche[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCartouche(cards: readonly Cartouche[], id: string, title: string): Cartouche[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCartoucheNote(cards: readonly Cartouche[], id: string, note: string): Cartouche[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleFilm(film: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(handFilm(film));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setCartoucheFilm(cards: readonly Cartouche[], id: string, film: string): Cartouche[] {
  const next = handFilm(film);
  return mapCard(cards, id, (card) => (card.film === next ? card : { ...card, film: next, audit: "film" }));
}

export function setCartoucheRaised(cards: readonly Cartouche[], id: string, raised: boolean): Cartouche[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCartoucheClip(cards: readonly Cartouche[], id: string, clipped: boolean): Cartouche[] {
  return mapCard(cards, id, (card) => (card.clipped === clipped ? card : { ...card, clipped, coffered: clipped ? false : card.coffered, audit: clipped ? "pin" : "return" }));
}

export function setCartoucheCoffer(cards: readonly Cartouche[], id: string, coffered: boolean): Cartouche[] {
  return mapCard(cards, id, (card) => (card.coffered === coffered ? card : { ...card, coffered, clipped: coffered ? false : card.clipped, audit: coffered ? "vault" : "open" }));
}

export function setCartoucheStar(cards: readonly Cartouche[], id: string, starred: boolean): Cartouche[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addCartoucheTag(cards: readonly Cartouche[], id: string, tag: string): Cartouche[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(sla: number | null, dir: 1 | -1): 10 | 20 | 40 | 80 {
  if (sla === null) return dir > 0 ? 10 : 80;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepRib(rib: number, dir: 1 | -1): 3 | 5 | 7 {
  const index = ribIndex(rib);
  const next = index < 0 ? 0 : (index + dir + RIB_CYCLE.length) % RIB_CYCLE.length;
  return RIB_CYCLE[next];
}

export function raiseSpanFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, 1), audit: "sla" }));
}

export function lowerSpanFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, -1), audit: "lower" }));
}

export function raiseRibFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return mapCard(cards, id, (card) => ({ ...card, rib: stepRib(card.rib, 1), audit: "bead" }));
}

export function lowerRibFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return mapCard(cards, id, (card) => ({ ...card, rib: stepRib(card.rib, -1), audit: "bead" }));
}

export function setCartoucheFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function clipCartoucheFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return setCartoucheClip(cards, id, !cards.find((card) => card.id === id)?.clipped);
}

export function starCartoucheFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  return setCartoucheStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function filmFocused(cards: readonly Cartouche[], id: string): Cartouche[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCartoucheFilm(cards, id, cycleFilm(card.film)) : [...cards];
}

function bulk(cards: readonly Cartouche[], ids: readonly string[], edit: (card: Cartouche) => Cartouche): Cartouche[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCartoucheGraphite(cards: readonly Cartouche[], ids: readonly string[]): Cartouche[] {
  return bulk(cards, ids, (card) => (card.film === "GRAPHITE" ? card : { ...card, film: "GRAPHITE", audit: "film" }));
}

export function bulkCartoucheRaise(cards: readonly Cartouche[], ids: readonly string[]): Cartouche[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCartoucheCoffer(cards: readonly Cartouche[], ids: readonly string[]): Cartouche[] {
  return bulk(cards, ids, (card) => (card.coffered ? card : { ...card, coffered: true, clipped: false, audit: "vault" }));
}

export function bulkCartoucheTag(cards: readonly Cartouche[], ids: readonly string[]): Cartouche[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readCartoucheViews(raw: unknown): CartoucheView[] {
  if (!Array.isArray(raw)) return [];
  const out: CartoucheView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CartoucheView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      carver: clip(row.carver, 24),
      film: activeFilm(row.film, ["IVORY", "GRAPHITE", "CHAMPAGNE"]),
      hand: activeHand(row.hand),
      sla: activeSpan(row.sla),
      rib: activeRib(row.rib),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCartoucheView(views: readonly CartoucheView[], view: CartoucheView): CartoucheView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCartoucheViews([...views, { ...view, name }]);
}

export function dropCartoucheView(views: readonly CartoucheView[], id: string): CartoucheView[] {
  return views.filter((view) => view.id !== id);
}

export function cartoucheDensity(raw: unknown): CartoucheDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCartouches(cards: readonly Cartouche[], sort: CartoucheSort): Cartouche[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "carver") {
      const carver = a.carver.localeCompare(b.carver);
      if (carver) return carver;
    } else {
      const hand = handIndex(a.hand) - handIndex(b.hand);
      if (hand) return hand;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleCartouches(
  cards: readonly Cartouche[],
  tray: CartoucheTray,
  query: string,
  carver: string,
  film: string,
  hand: string,
  sla: string,
  rib: string,
): Cartouche[] {
  const text = query.trim().toLowerCase();
  const wantCarver = clip(carver, 24).toLowerCase();
  const wantFilm = film === "all" ? "" : handFilm(film);
  const wantHand = activeHand(hand);
  const wantSla = activeSpan(sla);
  const wantRib = activeRib(rib);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.carver}`.toLowerCase().includes(text)) return false;
    if (wantCarver && card.carver.toLowerCase() !== wantCarver) return false;
    if (wantFilm && card.film !== wantFilm) return false;
    if (wantHand === "warm" && !handWarm(card.hand)) return false;
    if (wantHand === "cool" && !handCool(card.hand)) return false;
    if (wantHand !== "all" && wantHand !== "warm" && wantHand !== "cool" && card.hand !== wantHand) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantRib !== "all" && String(card.rib) !== wantRib) return false;
    return true;
  });
}

/** Alpha on rib three, still not raised and not in the coffer, is overdue. */
export function overdueCartouche(card: Cartouche): boolean {
  return card.hand === "alpha" && card.rib === 3 && !card.raised && !card.coffered;
}

/** No film, ten minutes, rib three, and still on the tablet. */
export function idleCartouche(card: Cartouche): boolean {
  return !card.film && card.sla === 10 && card.rib === 3 && !card.raised && !card.clipped && !card.coffered;
}

/** Champagne, eighty minutes, and a full rib, still out of the coffer. */
export function briskCartouche(card: Cartouche): boolean {
  return card.film === "CHAMPAGNE" && card.sla === 80 && card.rib === 7 && !card.coffered;
}

/** Alpha, ivory, and twenty minutes. */
export function restingCartouche(card: Cartouche): boolean {
  return card.hand === "alpha" && card.film === "IVORY" && card.sla === 20;
}

/** A pomme cartouche is late when the station is already alpha. */
export function lateCartouche(card: Cartouche, station: string): boolean {
  return card.hand === "pomme" && handPoint(station) === "alpha" && !card.raised;
}

export function cartoucheCounts(cards: readonly Cartouche[], shown: readonly Cartouche[], station: string): CartoucheCounts {
  return {
    tablet: cards.filter((card) => inTray(card, "tablet")).length,
    clip: cards.filter((card) => inTray(card, "clip")).length,
    coffer: cards.filter((card) => inTray(card, "coffer")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => handWarm(card.hand)).length,
    cool: cards.filter((card) => handCool(card.hand)).length,
    long: cards.filter((card) => card.sla === 80).length,
    quiet: cards.filter((card) => graphiteQuiet(card.film)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleCartouche).length,
    brisk: cards.filter(briskCartouche).length,
    resting: cards.filter(restingCartouche).length,
    overdue: cards.filter(overdueCartouche).length,
    pair: cards.filter((card) => pairRib(card.rib) && lateCartouche(card, station)).length,
  };
}

export function cartoucheBars(cards: readonly Cartouche[]): { hand: string; count: number }[] {
  return CRT_HANDS.map((hand) => ({ hand, count: cards.filter((card) => card.hand === hand && !card.coffered).length }));
}

export function cartoucheTimeline(cards: readonly Cartouche[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "tablet"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function cartoucheCarvers(cards: readonly Cartouche[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.carver && !out.some((name) => name.toLowerCase() === card.carver.toLowerCase())) out.push(card.carver);
  }
  return out;
}

export function busiestCarver(cards: readonly Cartouche[]): string {
  const open = cards.filter((card) => inTray(card, "tablet") && !card.raised && card.carver);
  let best = "";
  let score = 0;
  for (const name of cartoucheCarvers(open)) {
    const count = open.filter((card) => card.carver.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCartouches(cards: readonly Cartouche[]): string[] {
  return cards.filter(overdueCartouche).map((card) => card.title);
}

export function cartoucheCopy(card: Cartouche): string {
  return [card.title, card.carver, card.hand, card.film, card.sla ?? "", card.rib, card.note].filter((item) => item !== "").join(" · ");
}

export function cartoucheCsv(cards: readonly Cartouche[], station: string): string {
  const lines = ["title,carver,hand,film,minutes,rib,tags,raised,clip,coffer,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.carver),
        card.hand,
        card.film,
        card.sla ?? "",
        card.rib,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.clipped ? "1" : "0",
        card.coffered ? "1" : "0",
        card.starred ? "1" : "0",
        handCool(card.hand) ? "1" : "0",
        lateCartouche(card, station) ? "1" : "0",
        idleCartouche(card) ? "1" : "0",
        briskCartouche(card) ? "1" : "0",
        restingCartouche(card) ? "1" : "0",
        overdueCartouche(card) ? "1" : "0",
        handWarm(card.hand) ? "1" : "0",
        graphiteQuiet(card.film) ? "1" : "0",
        handBand(card.hand),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const GSA_HIDE_KEY = "crmv4-grisaille-hide-378";
export const GSA_REVIEW_KEY = "crmv4-grisaille-review-378";

export type GsaLane = "" | "line" | "shut" | "later" | "desk" | "return" | "pair" | "scope" | "brief" | "span" | "digit" | "openv" | "bare";
export type GsaHue = "" | "ivory" | "graphite" | "champagne";
export type GsaState = "" | "clear" | "set";
export type GsaReview = "all" | "reviewed" | "fresh";
export type GsaShape =
  | "all"
  | "line"
  | "shut"
  | "later"
  | "return"
  | "pair"
  | "scope"
  | "brief"
  | "span"
  | "digit"
  | "openv"
  | "bare"
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

export type GsaValue = string | { phone?: unknown; [key: string]: unknown } | null | undefined;
export type GsaRow = { id: string; label: string; code: GsaValue; userId?: string };
export type GsaLaneLine = { mail: string; count: number };

const GSA_LANES = ["line", "shut", "later", "desk", "return", "pair", "scope", "brief", "span", "digit", "openv", "bare"] as const;
const GSA_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: GsaValue): { phone?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: GsaValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: GsaValue): string {
  const row = codeRecord(raw);
  if (row && !("phone" in row)) return "";
  const value = row ? row.phone : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CALL";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return clip(value, 48);
}

function codeReadable(raw: GsaValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("phone" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

function isoAt(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(text)) return null;
  const at = Date.parse(text);
  return Number.isNaN(at) ? null : at;
}

export function gsaState(raw: GsaValue): GsaState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LINE_TITLES = new Set(["CALL", "RING", "LIVE", "OPEN", "READY", "YES"]);
const DESK_TITLES = new Set(["WAIT", "HOLD", "ASK", "PEND"]);
const LATER_TITLES = new Set(["LATER", "NEXT", "WEEK"]);
const RETURN_TITLES = new Set(["BAD", "VOID", "FAIL", "LOST"]);
const PAIR_TITLES = new Set(["TWIN", "EXT"]);
const BARE_TITLES = new Set(["NONE", "NIL", "BLANK", "EMPTY"]);

/** A known phone maps first. An international plus is the line. Any other plus is paired. A date today is the line. Within four days is the desk. Within twelve days waits. Older is returned. A colon that is not a date is scoped. Seven to fifteen digits sit the desk. A digit start that is not a desk number is a digit mark. A brief mark is six characters. Hidden, sealed, or private is shut. The words call and ring are the line. A span mark is sixteen characters or longer. A vowel mark starts with a vowel. */
export function gsaLane(raw: GsaValue, now = Date.now()): GsaLane {
  if (gsaState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LINE_TITLES.has(upper)) return "line";
  if (DESK_TITLES.has(upper)) return "desk";
  if (LATER_TITLES.has(upper)) return "later";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/hidden|sealed|private/i.test(text)) return "shut";
  if (/^\+\d[\d\s().-]{6,}$/.test(text)) return "line";
  if (text.includes("+")) return "pair";
  const at = isoAt(text);
  if (at !== null) {
    if (at > now) return "line";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "line";
    const age = now - at;
    if (age < 4 * day) return "desk";
    if (age < 12 * day) return "later";
    return "return";
  }
  if (text.includes(":")) return "scope";
  if (/^\d{7,15}$/.test(text)) return "desk";
  if (/^[0-9]/.test(text)) return "digit";
  if (text.length === 6) return "brief";
  if (/\bcall\b|\bring\b/i.test(text)) return "line";
  if (text.length >= 16) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function gsaHue(raw: GsaValue, now = Date.now()): GsaHue {
  const mail = gsaLane(raw, now);
  if (!mail) return "";
  if (mail === "line" || mail === "pair") return "champagne";
  if (mail === "desk" || mail === "return" || mail === "scope" || mail === "span") return "graphite";
  return "ivory";
}

export function gsaLine(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "line";
}

export function gsaShut(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "shut";
}

export function gsaLater(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "later";
}

export function gsaReturn(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "return";
}

export function gsaDesk(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "desk";
}

export function gsaPair(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "pair";
}

export function gsaScope(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "scope";
}

export function gsaBrief(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "brief";
}

export function gsaSpanLane(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "span";
}

export function gsaStampLane(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "digit";
}

export function gsaVowelLane(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "openv";
}

export function gsaBare(raw: GsaValue, now = Date.now()): boolean {
  return gsaLane(raw, now) === "bare";
}

export function gsaOpen(raw: GsaValue): boolean {
  return gsaState(raw) === "clear";
}

/** A long phone or a digit phone can stay as written. */
export function gsaHeld(raw: GsaValue): boolean {
  const mail = gsaLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief phone, or a six-character phone that is not a known title, still wants a fuller number. */
export function gsaSoon(raw: GsaValue, now = Date.now()): boolean {
  if (gsaState(raw) !== "set") return false;
  if (gsaBrief(raw, now)) return true;
  if (gsaLine(raw, now) || gsaShut(raw, now) || gsaLater(raw, now) || gsaReturn(raw, now)) return false;
  return codeGiven(raw).length === 6;
}

export function gsaLength(raw: GsaValue): number | null {
  if (gsaState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function gsaEven(raw: GsaValue): boolean {
  const length = gsaLength(raw);
  return length !== null && length % 2 === 0;
}

export function gsaOdd(raw: GsaValue): boolean {
  const length = gsaLength(raw);
  return length !== null && length % 2 === 1;
}

export function gsaFirst(raw: GsaValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function gsaTail(raw: GsaValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function gsaSpace(raw: GsaValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function gsaVowel(raw: GsaValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function gsaDigit(raw: GsaValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function gsaLetter(raw: GsaValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function gsaMixed(raw: GsaValue): boolean {
  return gsaDigit(raw) && gsaLetter(raw);
}

export function gsaLower(raw: GsaValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital phone note is four letters or more, written entirely in capitals. */
export function gsaUpper(raw: GsaValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function gsaStamp(raw: GsaValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function gsaCopy(raw: GsaValue): string {
  return codeGiven(raw);
}

export function gsaFamily(raw: GsaValue): string {
  if (gsaState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function gsaLanes(rows: readonly GsaRow[]): GsaLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of GSA_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = gsaLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return GSA_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingGsa(rows: readonly GsaRow[]): string {
  const lines = gsaLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || GSA_LANES.indexOf(a.mail as (typeof GSA_LANES)[number]) - GSA_LANES.indexOf(b.mail as (typeof GSA_LANES)[number]))[0].mail;
}

export function leadingGsaHue(rows: readonly GsaRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of GSA_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = gsaHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = GSA_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || GSA_HUES.indexOf(a.hue) - GSA_HUES.indexOf(b.hue))[0].hue;
}

export function laneGsaCount(rows: readonly GsaRow[], mail: GsaLane): number {
  return rows.filter((row) => gsaLane(row.code) === mail).length;
}

export function gsaShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGsaLanes(rows: readonly GsaRow[]): string[] {
  return gsaLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenGsa(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGsa(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGsa(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleGsaReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGsaReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGsaLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: GsaRow, shape: GsaShape): boolean {
  if (shape === "all") return true;
  if (shape === "line") return gsaLine(row.code);
  if (shape === "shut") return gsaShut(row.code);
  if (shape === "later") return gsaLater(row.code);
  if (shape === "return") return gsaReturn(row.code);
  if (shape === "pair") return gsaPair(row.code);
  if (shape === "scope") return gsaScope(row.code);
  if (shape === "brief") return gsaBrief(row.code);
  if (shape === "span") return gsaSpanLane(row.code);
  if (shape === "digit") return gsaStampLane(row.code);
  if (shape === "openv") return gsaVowelLane(row.code);
  if (shape === "bare") return gsaBare(row.code);
  if (shape === "open") return gsaOpen(row.code);
  if (shape === "soon") return gsaSoon(row.code);
  if (shape === "letter") return gsaLetter(row.code);
  if (shape === "mixed") return gsaMixed(row.code);
  if (shape === "upper") return gsaUpper(row.code);
  if (shape === "lower") return gsaLower(row.code);
  if (shape === "space") return gsaSpace(row.code);
  if (shape === "even") return gsaEven(row.code);
  if (shape === "odd") return gsaOdd(row.code);
  if (shape === "tail") return gsaTail(row.code);
  if (shape === "first") return gsaFirst(row.code);
  if (shape === "held") return gsaHeld(row.code);
  return gsaLane(row.code) === shape;
}

export function visibleGsa(
  rows: readonly GsaRow[],
  mail: string,
  hue: string,
  query: string,
  review: GsaReview,
  reviewed: readonly string[],
  shape: GsaShape,
): GsaRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (gsaState(row.code) === "") return false;
    const found = gsaLane(row.code);
    const hueName = gsaHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${gsaStamp(row.code)} ${gsaFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function gsaLanesCsv(rows: readonly GsaRow[]): string {
  const lines = ["lane,count"];
  for (const line of gsaLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function gsaRowsCsv(rows: readonly GsaRow[], reviewed: readonly string[]): string {
  const lines = ["name,phone,stamp,family,lane,hue,length,line,shut,later,desk,return,pair,scope,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(gsaCopy(row.code)),
        gsaStamp(row.code),
        csvCell(gsaFamily(row.code)),
        gsaLane(row.code),
        gsaHue(row.code),
        gsaLength(row.code) ?? "",
        gsaLine(row.code) ? "1" : "0",
        gsaShut(row.code) ? "1" : "0",
        gsaLater(row.code) ? "1" : "0",
        gsaDesk(row.code) ? "1" : "0",
        gsaReturn(row.code) ? "1" : "0",
        gsaPair(row.code) ? "1" : "0",
        gsaScope(row.code) ? "1" : "0",
        gsaBrief(row.code) ? "1" : "0",
        gsaEven(row.code) ? "1" : "0",
        gsaDigit(row.code) ? "1" : "0",
        gsaMixed(row.code) ? "1" : "0",
        gsaUpper(row.code) ? "1" : "0",
        gsaVowel(row.code) ? "1" : "0",
        gsaTail(row.code) ? "1" : "0",
        gsaHeld(row.code) ? "1" : "0",
        gsaSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
