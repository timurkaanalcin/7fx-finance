/**
 * Burin cuts kept in this browser,
 * and colophon plates read the keeper name already stored on the account.
 * Cuts are graver, hatch, burr, and dry. Glazes are pearl, ink, and gilt.
 * Spans are 12, 24, 48, or 96 minutes. Ribs are 3, 5, or 7.
 * Graver and hatch are the warm half. Burr and dry are the cool half.
 * Lead, mine, own, keep, firm, and set are the mark. Queue, pool, open, and free sit the desk.
 * Soon, defer, and month wait. Left, gone, drop, and quit are returned.
 * Dual and pair are paired. None, nil, blank, and empty stay bare.
 * A plus of three to ten digits is the mark. Any other plus joins two marks.
 * A colon that is not a date marks a scoped mark.
 * A date today is the mark. Within two days is the desk. Within six days waits. Older is returned.
 * A brief mark is exactly four characters. A digit mark starts with a digit and is not a date or a desk number.
 * A span mark is twelve characters or longer and does not start with a digit. A vowel mark starts with a vowel.
 * The words desk and agent are the mark when they are not a known title. Hidden, sealed, or private is shut.
 * Four to nine digits sit the desk.
 * A true keeper reads as LEAD. A false keeper reads as NONE.
 * Money fields are not read. The plate does not change the saved keeper.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_burin_cut (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   graver text not null default '',
 *   sla_min integer,
 *   glaze text not null default '',
 *   rib integer not null default 3,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   vised boolean not null default false,
 *   foliod boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_colophon_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_colophon_review (
 *   trader_id text primary key
 * );
 */

export const BUR_KEY = "crmv4-burin-380";
export const BUR_VIEW_KEY = "crmv4-burin-views-380";
export const BUR_DENSITY_KEY = "crmv4-burin-density-380";
export const BUR_GRAVERS = ["graver", "hatch", "burr", "dry"] as const;

export type BurinGraver = (typeof BUR_GRAVERS)[number];
export type BurinGlaze = "blank" | "pearl" | "ink" | "gilt";
export type BurinTray = "stone" | "vise" | "folio";
export type BurinDensity = "open" | "tight";
export type BurinSort = "graver" | "hand";

export type Burin = {
  id: string;
  title: string;
  note: string;
  hand: string;
  graver: string;
  sla: number | null;
  glaze: string;
  rib: number;
  tags: string[];
  raised: boolean;
  vised: boolean;
  foliod: boolean;
  starred: boolean;
  audit: string;
};

export type BurinView = {
  id: string;
  name: string;
  tray: BurinTray;
  query: string;
  hand: string;
  glaze: string;
  graver: string;
  sla: string;
  rib: string;
};

export type BurinCounts = {
  stone: number;
  vise: number;
  folio: number;
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

export const ROUND380_FEATURES = [
  "burin-save",
  "burin-reminders",
  "burin-gravers",
  "burin-search",
  "burin-span-sla",
  "burin-folio",
  "burin-star",
  "burin-inline-title",
  "burin-filters",
  "saved-burin-views",
  "burin-density",
  "burin-focus",
  "burin-kpis",
  "burin-chart",
  "burin-timeline",
  "burin-bulk",
  "burin-csv",
  "burin-keys",
  "burin-audit",
  "least-open-hand",
  "burin-viewer",
  "suggest-graver",
  "overdue-drypoint",
  "colophon-keepers",
  "colophon-csv",
] as const;

const AUDITS = ["save", "edit", "note", "glaze", "raise", "free", "vise", "return", "folio", "open", "tag", "rib", "sla", "lower", "star"] as const;
const GLAZES = ["pearl", "ink", "gilt"] as const;
const SLA_CYCLE = [12, 24, 48, 96] as const;
const RIB_CYCLE = [3, 5, 7] as const;
const WARM = new Set(["graver", "hatch"]);
const COOL = new Set(["burr", "dry"]);
const QUIET_GLAZE = new Set(["PEARL"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "babevel"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BurinTray {
  return raw === "vise" || raw === "folio" ? raw : "stone";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<BurinGlaze, "blank"> | "" {
  const text = snip(raw, 12).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<BurinGlaze, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[gh]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Burin, tray: BurinTray): boolean {
  if (tray === "vise") return card.vised && !card.foliod;
  if (tray === "folio") return card.foliod;
  return !card.vised && !card.foliod;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function graverIndex(graver: string): number {
  return BUR_GRAVERS.indexOf(graver as BurinGraver);
}

function slaIndex(sla: number): number {
  return SLA_CYCLE.indexOf(sla as (typeof SLA_CYCLE)[number]);
}

function ribIndex(rib: number): number {
  return RIB_CYCLE.indexOf(rib as (typeof RIB_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return snip(raw, 48);
}

function noteOf(raw: unknown): string {
  return snip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function graverPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (BUR_GRAVERS as readonly string[]).includes(text) ? text : "";
}

/** A minute mark is 12, 24, 48, or 96. Anything else stays blank. */
export function graverSpan(raw: unknown): 12 | 24 | 48 | 96 | null {
  const text = wholeToken(raw);
  if (text !== "12" && text !== "24" && text !== "48" && text !== "96") return null;
  return Number(text) as 12 | 24 | 48 | 96;
}

/** A rib count is 3, 5, or 7. Anything else stays blank. */
export function ribCount(raw: unknown): 3 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "5" && text !== "7") return null;
  return Number(text) as 3 | 5 | 7;
}

/** A glaze is pearl, ink, or gilt. The saved name is the upper token. */
export function graverGlaze(raw: unknown): string {
  const text = glazeName(raw);
  return text ? text.toUpperCase() : "";
}

export function graverWarm(graver: unknown): boolean {
  return WARM.has(snip(graver, 12).toLowerCase());
}

export function graverCool(graver: unknown): boolean {
  return COOL.has(snip(graver, 12).toLowerCase());
}

/** Graver is first. Hatch is second. Burr is third. Dry is fourth. */
export function graverBand(graver: unknown): string {
  const text = graverPoint(graver);
  if (!text) return "";
  if (text === "graver") return "first";
  if (text === "hatch") return "second";
  if (text === "burr") return "third";
  return "fourth";
}

/** Signed distance from one cut to another along the burin. */
export function graverGap(from: unknown, to: unknown): number | null {
  const left = graverIndex(graverPoint(from));
  const right = graverIndex(graverPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function pearlQuiet(glaze: unknown): boolean {
  return QUIET_GLAZE.has(graverGlaze(glaze));
}

/** A pair rib is 5. Three and seven are not a pair. */
export function pairRib(rib: unknown): boolean {
  return ribCount(rib) === 5;
}

/** A full rib is 7. */
export function fullRib(rib: unknown): boolean {
  return ribCount(rib) === 7;
}

export function activeGraver(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return graverPoint(text) || "all";
}

export function activeSpan(raw: unknown): string {
  const sla = graverSpan(raw);
  return sla === null ? "all" : String(sla);
}

export function activeGlaze(raw: unknown, allow: readonly string[]): string {
  const text = graverGlaze(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeRib(raw: unknown): string {
  const rib = ribCount(raw);
  return rib === null ? "all" : String(rib);
}

export function moveBurinFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The glaze the stone uses least. A tie keeps pearl, then ink, then gilt. */
export function suggestGlaze(cards: readonly Burin[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "stone") || !card.glaze) continue;
    counts.set(card.glaze, (counts.get(card.glaze) || 0) + 1);
  }
  let best = "PEARL";
  let score = Number.POSITIVE_INFINITY;
  for (const glaze of ["PEARL", "INK", "GILT"]) {
    const count = counts.get(glaze) || 0;
    if (count < score) {
      best = glaze;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest twelve. Before eleven, suggest twenty-four. Before seventeen, suggest forty-eight. Later, suggest ninety-six. A saved minute on the stone wins, and a tie keeps the shorter minute. */
export function suggestSpan(cards: readonly Burin[], hour: number): 12 | 24 | 48 | 96 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "stone") || card.sla === null) continue;
    seen = true;
    counts.set(card.sla, (counts.get(card.sla) || 0) + 1);
  }
  if (seen) {
    let best: 12 | 24 | 48 | 96 = 12;
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
  if (hour < 5) return 12;
  if (hour < 11) return 24;
  if (hour < 17) return 48;
  return 96;
}

export function suggestGraver(hour: number): BurinGraver {
  if (hour < 5) return "graver";
  if (hour < 11) return "hatch";
  if (hour < 17) return "burr";
  return "dry";
}

/** The hand with the fewest unraised burins on the stone. A tie keeps the roster order. */
export function fairHand(cards: readonly Burin[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "stone") && !card.raised);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readBurins(raw: unknown): Burin[] {
  if (!Array.isArray(raw)) return [];
  const out: Burin[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Burin>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      graver: graverPoint(row.graver),
      sla: graverSpan(row.sla),
      glaze: graverGlaze(row.glaze),
      rib: ribCount(row.rib) ?? 3,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      vised: row.vised === true,
      foliod: row.foliod === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addBurin(
  cards: readonly Burin[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    graver?: string;
    sla?: unknown;
    glaze?: string;
    rib?: unknown;
    tags?: unknown;
  },
): Burin[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `b${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readBurins([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      graver: graverPoint(card.graver),
      sla: graverSpan(card.sla),
      glaze: graverGlaze(card.glaze),
      rib: ribCount(card.rib) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      vised: false,
      foliod: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Burin[], id: string, edit: (card: Burin) => Burin): Burin[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editBurin(cards: readonly Burin[], id: string, title: string): Burin[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBurinNote(cards: readonly Burin[], id: string, note: string): Burin[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGlaze(glaze: string): string {
  const order = ["", "PEARL", "INK", "GILT"];
  const index = order.indexOf(graverGlaze(glaze));
  return order[(index + 1) % order.length] || "PEARL";
}

export function setBurinGlaze(cards: readonly Burin[], id: string, glaze: string): Burin[] {
  const next = graverGlaze(glaze);
  return mapCard(cards, id, (card) => (card.glaze === next ? card : { ...card, glaze: next, audit: "glaze" }));
}

export function setBurinRaised(cards: readonly Burin[], id: string, raised: boolean): Burin[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setBurinVise(cards: readonly Burin[], id: string, vised: boolean): Burin[] {
  return mapCard(cards, id, (card) => (card.vised === vised ? card : { ...card, vised, foliod: vised ? false : card.foliod, audit: vised ? "vise" : "return" }));
}

export function setBurinFolio(cards: readonly Burin[], id: string, foliod: boolean): Burin[] {
  return mapCard(cards, id, (card) => (card.foliod === foliod ? card : { ...card, foliod, vised: foliod ? false : card.vised, audit: foliod ? "folio" : "open" }));
}

export function setBurinStar(cards: readonly Burin[], id: string, starred: boolean): Burin[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addBurinTag(cards: readonly Burin[], id: string, tag: string): Burin[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepSpan(sla: number | null, dir: 1 | -1): 12 | 24 | 48 | 96 {
  if (sla === null) return dir > 0 ? 12 : 96;
  const index = slaIndex(sla);
  const next = index < 0 ? 0 : (index + dir + SLA_CYCLE.length) % SLA_CYCLE.length;
  return SLA_CYCLE[next];
}

function stepRib(rib: number, dir: 1 | -1): 3 | 5 | 7 {
  const index = ribIndex(rib);
  const next = index < 0 ? 0 : (index + dir + RIB_CYCLE.length) % RIB_CYCLE.length;
  return RIB_CYCLE[next];
}

export function raiseSpanFocused(cards: readonly Burin[], id: string): Burin[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, 1), audit: "sla" }));
}

export function lowerSpanFocused(cards: readonly Burin[], id: string): Burin[] {
  return mapCard(cards, id, (card) => ({ ...card, sla: stepSpan(card.sla, -1), audit: "lower" }));
}

export function raiseRibFocused(cards: readonly Burin[], id: string): Burin[] {
  return mapCard(cards, id, (card) => ({ ...card, rib: stepRib(card.rib, 1), audit: "rib" }));
}

export function lowerRibFocused(cards: readonly Burin[], id: string): Burin[] {
  return mapCard(cards, id, (card) => ({ ...card, rib: stepRib(card.rib, -1), audit: "rib" }));
}

export function setBurinFocused(cards: readonly Burin[], id: string): Burin[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function viseBurinFocused(cards: readonly Burin[], id: string): Burin[] {
  return setBurinVise(cards, id, !cards.find((card) => card.id === id)?.vised);
}

export function starBurinFocused(cards: readonly Burin[], id: string): Burin[] {
  return setBurinStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function glazeFocused(cards: readonly Burin[], id: string): Burin[] {
  const card = cards.find((item) => item.id === id);
  return card ? setBurinGlaze(cards, id, cycleGlaze(card.glaze)) : [...cards];
}

function bulk(cards: readonly Burin[], ids: readonly string[], edit: (card: Burin) => Burin): Burin[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkBurinPearl(cards: readonly Burin[], ids: readonly string[]): Burin[] {
  return bulk(cards, ids, (card) => (card.glaze === "PEARL" ? card : { ...card, glaze: "PEARL", audit: "glaze" }));
}

export function bulkBurinRaise(cards: readonly Burin[], ids: readonly string[]): Burin[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkBurinFolio(cards: readonly Burin[], ids: readonly string[]): Burin[] {
  return bulk(cards, ids, (card) => (card.foliod ? card : { ...card, foliod: true, vised: false, audit: "folio" }));
}

export function bulkBurinTag(cards: readonly Burin[], ids: readonly string[]): Burin[] {
  return bulk(cards, ids, (card) => (card.tags.includes("g") ? card : { ...card, tags: tagsOf([...card.tags, "g"]), audit: "tag" }));
}

export function readBurinViews(raw: unknown): BurinView[] {
  if (!Array.isArray(raw)) return [];
  const out: BurinView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BurinView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: snip(row.query, 40),
      hand: snip(row.hand, 24),
      glaze: activeGlaze(row.glaze, ["PEARL", "INK", "GILT"]),
      graver: activeGraver(row.graver),
      sla: activeSpan(row.sla),
      rib: activeRib(row.rib),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBurinView(views: readonly BurinView[], view: BurinView): BurinView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readBurinViews([...views, { ...view, name }]);
}

export function dropBurinView(views: readonly BurinView[], id: string): BurinView[] {
  return views.filter((view) => view.id !== id);
}

export function burinDensity(raw: unknown): BurinDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortBurins(cards: readonly Burin[], sort: BurinSort): Burin[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const graver = graverIndex(a.graver) - graverIndex(b.graver);
      if (graver) return graver;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleBurins(
  cards: readonly Burin[],
  tray: BurinTray,
  query: string,
  hand: string,
  glaze: string,
  graver: string,
  sla: string,
  rib: string,
): Burin[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGlaze = glaze === "all" ? "" : graverGlaze(glaze);
  const wantGraver = activeGraver(graver);
  const wantSla = activeSpan(sla);
  const wantRib = activeRib(rib);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGlaze && card.glaze !== wantGlaze) return false;
    if (wantGraver === "warm" && !graverWarm(card.graver)) return false;
    if (wantGraver === "cool" && !graverCool(card.graver)) return false;
    if (wantGraver !== "all" && wantGraver !== "warm" && wantGraver !== "cool" && card.graver !== wantGraver) return false;
    if (wantSla !== "all" && String(card.sla ?? "") !== wantSla) return false;
    if (wantRib !== "all" && String(card.rib) !== wantRib) return false;
    return true;
  });
}

/** Dry on rib three, still not raised and not in the folio, is overdue. */
export function overdueBurin(card: Burin): boolean {
  return card.graver === "dry" && card.rib === 3 && !card.raised && !card.foliod;
}

/** No glaze, twelve minutes, rib three, and still on the stone. */
export function idleBurin(card: Burin): boolean {
  return !card.glaze && card.sla === 12 && card.rib === 3 && !card.raised && !card.vised && !card.foliod;
}

/** Gilt, ninety-six minutes, and a full rib, still out of the folio. */
export function briskBurin(card: Burin): boolean {
  return card.glaze === "GILT" && card.sla === 96 && card.rib === 7 && !card.foliod;
}

/** Dry, pearl, and twenty-four minutes. */
export function restingBurin(card: Burin): boolean {
  return card.graver === "dry" && card.glaze === "PEARL" && card.sla === 24;
}

/** A graver cut is late when the station is already dry. */
export function lateBurin(card: Burin, station: string): boolean {
  return card.graver === "graver" && graverPoint(station) === "dry" && !card.raised;
}

export function burinCounts(cards: readonly Burin[], shown: readonly Burin[], station: string): BurinCounts {
  return {
    stone: cards.filter((card) => inTray(card, "stone")).length,
    vise: cards.filter((card) => inTray(card, "vise")).length,
    folio: cards.filter((card) => inTray(card, "folio")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => graverWarm(card.graver)).length,
    cool: cards.filter((card) => graverCool(card.graver)).length,
    long: cards.filter((card) => card.sla === 96).length,
    quiet: cards.filter((card) => pearlQuiet(card.glaze)).length,
    minutes: cards.reduce((sum, card) => sum + (card.sla || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleBurin).length,
    brisk: cards.filter(briskBurin).length,
    resting: cards.filter(restingBurin).length,
    overdue: cards.filter(overdueBurin).length,
    pair: cards.filter((card) => pairRib(card.rib) && lateBurin(card, station)).length,
  };
}

export function burinBars(cards: readonly Burin[]): { graver: string; count: number }[] {
  return BUR_GRAVERS.map((graver) => ({ graver, count: cards.filter((card) => card.graver === graver && !card.foliod).length }));
}

export function burinTimeline(cards: readonly Burin[]): { sla: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "stone"));
  return SLA_CYCLE.map((sla) => ({ sla, titles: open.filter((card) => card.sla === sla).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function burinHands(cards: readonly Burin[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Burin[]): string {
  const open = cards.filter((card) => inTray(card, "stone") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of burinHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderBurins(cards: readonly Burin[]): string[] {
  return cards.filter(overdueBurin).map((card) => card.title);
}

export function burinCopy(card: Burin): string {
  return [card.title, card.hand, card.graver, card.glaze, card.sla ?? "", card.rib, card.note].filter((item) => item !== "").join(" · ");
}

export function burinCsv(cards: readonly Burin[], station: string): string {
  const lines = ["title,hand,graver,glaze,minutes,rib,tags,raised,vise,folio,starred,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.graver,
        card.glaze,
        card.sla ?? "",
        card.rib,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.vised ? "1" : "0",
        card.foliod ? "1" : "0",
        card.starred ? "1" : "0",
        graverCool(card.graver) ? "1" : "0",
        lateBurin(card, station) ? "1" : "0",
        idleBurin(card) ? "1" : "0",
        briskBurin(card) ? "1" : "0",
        restingBurin(card) ? "1" : "0",
        overdueBurin(card) ? "1" : "0",
        graverWarm(card.graver) ? "1" : "0",
        pearlQuiet(card.glaze) ? "1" : "0",
        graverBand(card.graver),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const COL_HIDE_KEY = "crmv4-colophon-hide-380";
export const COL_REVIEW_KEY = "crmv4-colophon-review-380";

export type ColLane = "" | "mark" | "shut" | "later" | "desk" | "return" | "pair" | "scope" | "brief" | "span" | "digit" | "openv" | "bare";
export type ColHue = "" | "pearl" | "ink" | "gilt";
export type ColState = "" | "clear" | "set";
export type ColReview = "all" | "reviewed" | "fresh";
export type ColShape =
  | "all"
  | "mark"
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

export type ColValue = string | { assigneeName?: unknown; [key: string]: unknown } | null | undefined;
export type ColRow = { id: string; label: string; code: ColValue; userId?: string };
export type ColLaneLine = { mail: string; count: number };

const COL_LANES = ["mark", "shut", "later", "desk", "return", "pair", "scope", "brief", "span", "digit", "openv", "bare"] as const;
const COL_HUES = ["gilt", "pearl", "ink"] as const;

function codeRecord(raw: ColValue): { assigneeName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: ColValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: ColValue): string {
  const row = codeRecord(raw);
  if (row && !("assigneeName" in row)) return "";
  const value = row ? row.assigneeName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LEAD";
  if (value === false || value === "false" || value === "0" || value === 0) return "NONE";
  return snip(value, 48);
}

function codeReadable(raw: ColValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("assigneeName" in row)) return false;
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

export function colState(raw: ColValue): ColState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

const LINE_TITLES = new Set(["LEAD", "MINE", "OWN", "KEEP", "FIRM", "SET"]);
const DESK_TITLES = new Set(["QUEUE", "POOL", "OPEN", "FREE"]);
const LATER_TITLES = new Set(["SOON", "DEFER", "MONTH"]);
const RETURN_TITLES = new Set(["LEFT", "GONE", "DROP", "QUIT"]);
const PAIR_TITLES = new Set(["DUAL", "PAIR"]);
const BARE_TITLES = new Set(["NONE", "NIL", "BLANK", "EMPTY"]);

/** A known keeper maps first. A plus of three to ten digits is the mark. Any other plus is paired. A date today is the mark. Within two days is the desk. Within six days waits. Older is returned. A colon that is not a date is scoped. Four to nine digits sit the desk. A digit start that is not a desk number is a digit mark. A brief mark is four characters. Hidden, sealed, or private is shut. The words desk and agent are the mark. A span mark is twelve characters or longer. A vowel mark starts with a vowel. */
export function colLane(raw: ColValue, now = Date.now()): ColLane {
  if (colState(raw) !== "set") return "";
  const text = codeGiven(raw);
  const upper = text.toUpperCase();
  if (LINE_TITLES.has(upper)) return "mark";
  if (DESK_TITLES.has(upper)) return "desk";
  if (LATER_TITLES.has(upper)) return "later";
  if (RETURN_TITLES.has(upper)) return "return";
  if (PAIR_TITLES.has(upper)) return "pair";
  if (BARE_TITLES.has(upper)) return "bare";
  if (/hidden|sealed|private/i.test(text)) return "shut";
  if (/^\+\d{3,10}$/.test(text)) return "mark";
  if (text.includes("+")) return "pair";
  const at = isoAt(text);
  if (at !== null) {
    if (at > now) return "mark";
    const day = 86400000;
    const left = new Date(at);
    const right = new Date(now);
    const sameDay = left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate();
    if (sameDay) return "mark";
    const age = now - at;
    if (age < 2 * day) return "desk";
    if (age < 6 * day) return "later";
    return "return";
  }
  if (text.includes(":")) return "scope";
  if (/^\d{4,9}$/.test(text)) return "desk";
  if (/^[0-9]/.test(text)) return "digit";
  if (text.length === 4) return "brief";
  if (/\bdesk\b|\bagent\b/i.test(text)) return "mark";
  if (text.length >= 12) return "span";
  if (/^[aeiou]/i.test(text)) return "openv";
  return "bare";
}

export function colHue(raw: ColValue, now = Date.now()): ColHue {
  const mail = colLane(raw, now);
  if (!mail) return "";
  if (mail === "mark" || mail === "pair") return "gilt";
  if (mail === "desk" || mail === "return" || mail === "scope" || mail === "span") return "ink";
  return "pearl";
}

export function colLine(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "mark";
}

export function colShut(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "shut";
}

export function colLater(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "later";
}

export function colReturn(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "return";
}

export function colDesk(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "desk";
}

export function colPair(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "pair";
}

export function colScope(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "scope";
}

export function colBrief(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "brief";
}

export function colSpanLane(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "span";
}

export function colStampLane(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "digit";
}

export function colVowelLane(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "openv";
}

export function colBare(raw: ColValue, now = Date.now()): boolean {
  return colLane(raw, now) === "bare";
}

export function colOpen(raw: ColValue): boolean {
  return colState(raw) === "clear";
}

/** A long keeper or a digit keeper can stay as written. */
export function colHeld(raw: ColValue): boolean {
  const mail = colLane(raw);
  return mail === "span" || mail === "digit";
}

/** A brief keeper, or a four-character keeper that is not a known title, still wants a fuller name. */
export function colSoon(raw: ColValue, now = Date.now()): boolean {
  if (colState(raw) !== "set") return false;
  if (colBrief(raw, now)) return true;
  if (colLine(raw, now) || colShut(raw, now) || colLater(raw, now) || colReturn(raw, now)) return false;
  return codeGiven(raw).length === 4;
}

export function colLength(raw: ColValue): number | null {
  if (colState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function colEven(raw: ColValue): boolean {
  const length = colLength(raw);
  return length !== null && length % 2 === 0;
}

export function colOdd(raw: ColValue): boolean {
  const length = colLength(raw);
  return length !== null && length % 2 === 1;
}

export function colFirst(raw: ColValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function colTail(raw: ColValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function colSpace(raw: ColValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function colVowel(raw: ColValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function colDigit(raw: ColValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function colLetter(raw: ColValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function colMixed(raw: ColValue): boolean {
  return colDigit(raw) && colLetter(raw);
}

export function colLower(raw: ColValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A capital keeper is four letters or more, written entirely in capitals. */
export function colUpper(raw: ColValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function colStamp(raw: ColValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function colCopy(raw: ColValue): string {
  return codeGiven(raw);
}

export function colFamily(raw: ColValue): string {
  if (colState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function colLanes(rows: readonly ColRow[]): ColLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of COL_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = colLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return COL_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingCol(rows: readonly ColRow[]): string {
  const lines = colLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || COL_LANES.indexOf(a.mail as (typeof COL_LANES)[number]) - COL_LANES.indexOf(b.mail as (typeof COL_LANES)[number]))[0].mail;
}

export function leadingColHue(rows: readonly ColRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of COL_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = colHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = COL_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || COL_HUES.indexOf(a.hue) - COL_HUES.indexOf(b.hue))[0].hue;
}

export function laneColCount(rows: readonly ColRow[], mail: ColLane): number {
  return rows.filter((row) => colLane(row.code) === mail).length;
}

export function colShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentColLanes(rows: readonly ColRow[]): string[] {
  return colLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenCol(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = snip(item, 12);
    if (!allow.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedCol(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = snip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleCol(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleColReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkColReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleColLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => showHidden || !hidden.includes(mail));
}

function shapeOn(row: ColRow, shape: ColShape): boolean {
  if (shape === "all") return true;
  if (shape === "mark") return colLine(row.code);
  if (shape === "shut") return colShut(row.code);
  if (shape === "later") return colLater(row.code);
  if (shape === "return") return colReturn(row.code);
  if (shape === "pair") return colPair(row.code);
  if (shape === "scope") return colScope(row.code);
  if (shape === "brief") return colBrief(row.code);
  if (shape === "span") return colSpanLane(row.code);
  if (shape === "digit") return colStampLane(row.code);
  if (shape === "openv") return colVowelLane(row.code);
  if (shape === "bare") return colBare(row.code);
  if (shape === "open") return colOpen(row.code);
  if (shape === "soon") return colSoon(row.code);
  if (shape === "letter") return colLetter(row.code);
  if (shape === "mixed") return colMixed(row.code);
  if (shape === "upper") return colUpper(row.code);
  if (shape === "lower") return colLower(row.code);
  if (shape === "space") return colSpace(row.code);
  if (shape === "even") return colEven(row.code);
  if (shape === "odd") return colOdd(row.code);
  if (shape === "tail") return colTail(row.code);
  if (shape === "first") return colFirst(row.code);
  if (shape === "held") return colHeld(row.code);
  return colLane(row.code) === shape;
}

export function visibleCol(
  rows: readonly ColRow[],
  mail: string,
  hue: string,
  query: string,
  review: ColReview,
  reviewed: readonly string[],
  shape: ColShape,
): ColRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (colState(row.code) === "") return false;
    const found = colLane(row.code);
    const hueName = colHue(row.code);
    if (mail && mail !== "all" && found !== mail) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${colStamp(row.code)} ${colFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function colLanesCsv(rows: readonly ColRow[]): string {
  const lines = ["lane,count"];
  for (const line of colLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function colRowsCsv(rows: readonly ColRow[], reviewed: readonly string[]): string {
  const lines = ["name,keeper,stamp,family,lane,hue,length,line,shut,later,desk,return,pair,scope,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(colCopy(row.code)),
        colStamp(row.code),
        csvCell(colFamily(row.code)),
        colLane(row.code),
        colHue(row.code),
        colLength(row.code) ?? "",
        colLine(row.code) ? "1" : "0",
        colShut(row.code) ? "1" : "0",
        colLater(row.code) ? "1" : "0",
        colDesk(row.code) ? "1" : "0",
        colReturn(row.code) ? "1" : "0",
        colPair(row.code) ? "1" : "0",
        colScope(row.code) ? "1" : "0",
        colBrief(row.code) ? "1" : "0",
        colEven(row.code) ? "1" : "0",
        colDigit(row.code) ? "1" : "0",
        colMixed(row.code) ? "1" : "0",
        colUpper(row.code) ? "1" : "0",
        colVowel(row.code) ? "1" : "0",
        colTail(row.code) ? "1" : "0",
        colHeld(row.code) ? "1" : "0",
        colSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
