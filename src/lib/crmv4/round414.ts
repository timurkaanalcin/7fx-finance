/**
 * Orillon courses kept in this browser,
 * and crossette plates read the documents already stored on the account.
 * Orders are orillon, caponier, tenaille, and bartizan. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 12, or 15. Depths are 3, 6, or 9.
 * Orillon and caponier are the warm half. Tenaille and bartizan are the cool half.
 * Ivory is the quiet ground.
 * APPROVED, COMPLETE, READY, FILED, and YES are live. PENDING, REVIEW, MISSING, WAIT, and HOLD wait.
 * REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut.
 * UNFILED, NONE, BLANK, and EMPTY stay blank.
 * A DOC- mark of seven letters is a code. A DOC- mark of fourteen letters or more is long. Other DOC- marks stay live.
 * Four letters are a code. One letter is short. Sixteen letters or more are long. Anything else holds.
 * A true document mark reads as APPROVED. A false mark reads as MISSING.
 * The secret is not read. Money fields are not read. The plate does not change the saved documents.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_orillon_course (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   profile text not null default '',
 *   hour_mark integer,
 *   bed text not null default '',
 *   depth integer not null default 3,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_crossette_document_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_crossette_document_review (
 *   trader_id text primary key
 * );
 */


export const ORL_KEY = "crmv4-orillon-414";
export const ORL_VIEW_KEY = "crmv4-orillon-views-414";
export const ORL_DENSITY_KEY = "crmv4-orillon-density-414";
export const ORL_PROFILES = ["orillon", "caponier", "tenaille", "bartizan"] as const;

export type OrillonProfile = (typeof ORL_PROFILES)[number];
export type OrillonBed = "blank" | "ivory" | "graphite" | "gilt";
export type OrillonRack = "base" | "press" | "shelf";
export type OrillonDensity = "open" | "tight";
export type OrillonSort = "profile" | "hand";

export type Orillon = {
  id: string;
  title: string;
  note: string;
  hand: string;
  profile: string;
  hour: number | null;
  bed: string;
  depth: number;
  tags: string[];
  raised: boolean;
  pressed: boolean;
  shelved: boolean;
  pinned: boolean;
  audit: string;
};

export type OrillonView = {
  id: string;
  name: string;
  rack: OrillonRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type OrillonCounts = {
  base: number;
  press: number;
  shelf: number;
  raised: number;
  warm: number;
  cool: number;
  long: number;
  quiet: number;
  minutes: number;
  matched: number;
  pinned: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND414_FEATURES = [
  "orillon-save",
  "orillon-reminders",
  "orillon-orders",
  "orillon-search",
  "orillon-hour-sla",
  "orillon-case",
  "orillon-pin",
  "orillon-inline-title",
  "orillon-filters",
  "saved-orillon-views",
  "orillon-density",
  "orillon-focus",
  "orillon-kpis",
  "orillon-chart",
  "orillon-timeline",
  "orillon-bulk",
  "orillon-csv",
  "orillon-keys",
  "orillon-audit",
  "quietest-orillon-hand",
  "orillon-viewer",
  "suggest-orillon",
  "overdue-orillon",
  "crossette-panels",
  "crossette-document-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 12, 15] as const;
const DEPTH_CYCLE = [3, 6, 9] as const;
const WARM = new Set(["orillon", "caponier"]);
const COOL = new Set(["tenaille", "bartizan"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): OrillonRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<OrillonBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<OrillonBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[or]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Orillon, rack: OrillonRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return ORL_PROFILES.indexOf(profile as OrillonProfile);
}

function hourIndex(hour: number): number {
  return HOUR_CYCLE.indexOf(hour as (typeof HOUR_CYCLE)[number]);
}

function depthIndex(depth: number): number {
  return DEPTH_CYCLE.indexOf(depth as (typeof DEPTH_CYCLE)[number]);
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

export function profilePoint(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  return (ORL_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 7, 11, or 18. Anything else stays blank. */
export function orillonHour(raw: unknown): 3 | 6 | 12 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "15") return null;
  return Number(text) as 3 | 6 | 12 | 15;
}

/** A depth is 4, 7, or 11. Anything else stays blank. */
export function depthCount(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function orillonBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Orillon is first. Caponier is second. Tenaille is third. Bartizan is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "orillon") return "first";
  if (text === "caponier") return "second";
  if (text === "tenaille") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the yard. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function ivoryQuiet(bed: unknown): boolean {
  return QUIET_BED.has(orillonBed(bed));
}

/** A pair depth is 6. Three and nine are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 6;
}

/** A full depth is 9. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 9;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = orillonHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = orillonBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveOrillonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestOrillonBed(cards: readonly Orillon[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "base") || !card.bed) continue;
    counts.set(card.bed, (counts.get(card.bed) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const bed of ["IVORY", "GRAPHITE", "GILT"]) {
    const count = counts.get(bed) || 0;
    if (count < score) {
      best = bed;
      score = count;
    }
  }
  return best;
}

/** Before three, suggest three. Before six, suggest six. Before twelve, suggest twelve. Later, suggest fifteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestOrillonHour(cards: readonly Orillon[], hour: number): 3 | 6 | 12 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 12 | 15 = 3;
    let score = Number.POSITIVE_INFINITY;
    for (const mark of HOUR_CYCLE) {
      const count = counts.get(mark) || 0;
      if (count < score) {
        best = mark;
        score = count;
      }
    }
    return best;
  }
  if (hour < 3) return 3;
  if (hour < 6) return 6;
  if (hour < 12) return 12;
  return 15;
}

export function suggestProfile(hour: number): OrillonProfile {
  if (hour < 3) return "orillon";
  if (hour < 6) return "caponier";
  if (hour < 12) return "tenaille";
  return "bartizan";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Orillon[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inRack(card, "base") && !card.raised);
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

export function readOrillonList(raw: unknown): Orillon[] {
  if (!Array.isArray(raw)) return [];
  const out: Orillon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Orillon>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: orillonHour(row.hour),
      bed: orillonBed(row.bed),
      depth: depthCount(row.depth) ?? 3,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      pressed: row.pressed === true,
      shelved: row.shelved === true,
      pinned: row.pinned === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addOrillon(
  cards: readonly Orillon[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    profile?: string;
    hour?: unknown;
    bed?: string;
    depth?: unknown;
    tags?: unknown;
  },
): Orillon[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOrillonList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: orillonHour(card.hour),
      bed: orillonBed(card.bed),
      depth: depthCount(card.depth) ?? 3,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Orillon[], id: string, edit: (card: Orillon) => Orillon): Orillon[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOrillon(cards: readonly Orillon[], id: string, title: string): Orillon[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOrillonNote(cards: readonly Orillon[], id: string, note: string): Orillon[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(orillonBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setOrillonBed(cards: readonly Orillon[], id: string, bed: string): Orillon[] {
  const next = orillonBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setOrillonRaised(cards: readonly Orillon[], id: string, raised: boolean): Orillon[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setOrillonRack(cards: readonly Orillon[], id: string, pressed: boolean): Orillon[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setOrillonShelf(cards: readonly Orillon[], id: string, shelved: boolean): Orillon[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setOrillonPin(cards: readonly Orillon[], id: string, pinned: boolean): Orillon[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addOrillonTag(cards: readonly Orillon[], id: string, tag: string): Orillon[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 12 | 15 {
  if (hour === null) return dir > 0 ? 3 : 15;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setOrillonFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackOrillonFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return setOrillonRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinOrillonFocused(cards: readonly Orillon[], id: string): Orillon[] {
  return setOrillonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Orillon[], id: string): Orillon[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOrillonBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Orillon[], ids: readonly string[], edit: (card: Orillon) => Orillon): Orillon[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOrillonLinen(cards: readonly Orillon[], ids: readonly string[]): Orillon[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkOrillonRaise(cards: readonly Orillon[], ids: readonly string[]): Orillon[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkOrillonShelf(cards: readonly Orillon[], ids: readonly string[]): Orillon[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkOrillonTag(cards: readonly Orillon[], ids: readonly string[]): Orillon[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readOrillonViews(raw: unknown): OrillonView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrillonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrillonView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      rack: rackOf(row.rack),
      query: snip(row.query, 40),
      hand: snip(row.hand, 24),
      bed: activeBed(row.bed, ["IVORY", "GRAPHITE", "GILT"]),
      profile: activeProfile(row.profile),
      hour: activeHour(row.hour),
      depth: activeDepth(row.depth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOrillonView(views: readonly OrillonView[], view: OrillonView): OrillonView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOrillonViews([...views, { ...view, name }]);
}

export function dropOrillonView(views: readonly OrillonView[], id: string): OrillonView[] {
  return views.filter((view) => view.id !== id);
}

export function orillonDensity(raw: unknown): OrillonDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortOrillonList(cards: readonly Orillon[], sort: OrillonSort): Orillon[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const profile = profileIndex(a.profile) - profileIndex(b.profile);
      if (profile) return profile;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleOrillonList(
  cards: readonly Orillon[],
  rack: OrillonRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Orillon[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : orillonBed(bed);
  const wantProfile = activeProfile(profile);
  const wantHour = activeHour(hour);
  const wantDepth = activeDepth(depth);
  return cards.filter((card) => {
    if (!inRack(card, rack)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantBed && card.bed !== wantBed) return false;
    if (wantProfile === "warm" && !profileWarm(card.profile)) return false;
    if (wantProfile === "cool" && !profileCool(card.profile)) return false;
    if (wantProfile !== "all" && wantProfile !== "warm" && wantProfile !== "cool" && card.profile !== wantProfile) return false;
    if (wantHour !== "all" && String(card.hour ?? "") !== wantHour) return false;
    if (wantDepth !== "all" && String(card.depth) !== wantDepth) return false;
    return true;
  });
}

/** A bartizan at depth four, still not raised and not shelved, is overdue. */
export function overdueOrillon(card: Orillon): boolean {
  return card.profile === "bartizan" && card.depth === 3 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth four, and still on the yard. */
export function idleOrillon(card: Orillon): boolean {
  return !card.bed && card.hour === 3 && card.depth === 3 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, eighteen hours, and a full depth, still off the shelf. */
export function briskOrillon(card: Orillon): boolean {
  return card.bed === "IVORY" && card.hour === 15 && card.depth === 9 && !card.shelved;
}

/** Tenaille, ivory, and seven hours. */
export function restingOrillon(card: Orillon): boolean {
  return card.profile === "tenaille" && card.bed === "GRAPHITE" && card.hour === 6;
}

/** An orillon is late when the station is already bartizan. */
export function lateOrillon(card: Orillon, station: string): boolean {
  return card.profile === "orillon" && profilePoint(station) === "bartizan" && !card.raised;
}

export function orillonCounts(cards: readonly Orillon[], shown: readonly Orillon[], station: string): OrillonCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 15).length,
    quiet: cards.filter((card) => ivoryQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleOrillon).length,
    brisk: cards.filter(briskOrillon).length,
    resting: cards.filter(restingOrillon).length,
    overdue: cards.filter(overdueOrillon).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateOrillon(card, station)).length,
  };
}

export function orillonBars(cards: readonly Orillon[]): { profile: string; count: number }[] {
  return ORL_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function orillonTimeline(cards: readonly Orillon[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function orillonHands(cards: readonly Orillon[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Orillon[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of orillonHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOrillonList(cards: readonly Orillon[]): string[] {
  return cards.filter(overdueOrillon).map((card) => card.title);
}

export function orillonCopy(card: Orillon): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function orillonCsv(cards: readonly Orillon[], station: string): string {
  const lines = ["title,hand,profile,bed,hours,depth,tags,raised,press,shelf,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.profile,
        card.bed,
        card.hour ?? "",
        card.depth,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.pressed ? "1" : "0",
        card.shelved ? "1" : "0",
        card.pinned ? "1" : "0",
        profileCool(card.profile) ? "1" : "0",
        lateOrillon(card, station) ? "1" : "0",
        idleOrillon(card) ? "1" : "0",
        briskOrillon(card) ? "1" : "0",
        restingOrillon(card) ? "1" : "0",
        overdueOrillon(card) ? "1" : "0",
        profileWarm(card.profile) ? "1" : "0",
        ivoryQuiet(card.bed) ? "1" : "0",
        profileBand(card.profile),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const XST_HIDE_KEY = "crmv4-crossette-hide-414";
export const XST_REVIEW_KEY = "crmv4-crossette-review-414";

export type CrossetteLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type CrossetteHue = "" | "gilt" | "ash" | "pearl";
export type CrossetteState = "" | "clear" | "set";
export type CrossetteReview = "all" | "reviewed" | "fresh";
export type CrossetteShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type CrossetteValue = string | { documentsStatus?: unknown; [key: string]: unknown } | null | undefined;
export type CrossetteRow = { id: string; label: string; code: CrossetteValue; userId?: string };
export type CrossetteLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["APPROVED", "COMPLETE", "READY", "FILED", "YES"]);
const HOLD_TITLES = new Set(["PENDING", "REVIEW", "MISSING", "WAIT", "HOLD"]);
const SHUT_TITLES = new Set(["REJECTED", "DENY", "FAIL", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["UNFILED", "NONE", "BLANK", "EMPTY"]);

function crossetteRecord(raw: CrossetteValue): { documentsStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function crossetteBlocked(raw: CrossetteValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function crossetteGiven(raw: CrossetteValue): string {
  const row = crossetteRecord(raw);
  if (row && !("documentsStatus" in row)) return "";
  const value = row ? row.documentsStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "APPROVED";
  if (value === false || value === "false" || value === "0" || value === 0) return "MISSING";
  return snip(value, 48);
}

function crossetteReadable(raw: CrossetteValue): boolean {
  if (crossetteBlocked(raw)) return false;
  const row = crossetteRecord(raw);
  if (row && !("documentsStatus" in row)) return false;
  return true;
}


export function crossetteSlice(raw: unknown): CrossetteValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("documentsStatus" in row)) return { documentsStatus: "" };
  const value = row.documentsStatus;
  if (typeof value === "string") return { documentsStatus: snip(value, 48) };
  return { documentsStatus: value as never };
}

export function crossetteState(raw: CrossetteValue): CrossetteState {
  if (!crossetteReadable(raw)) return "";
  return crossetteGiven(raw) ? "set" : "clear";
}

/** Word marks win first. APPROVED, COMPLETE, READY, FILED, and YES are live. PENDING, REVIEW, MISSING, WAIT, and HOLD wait. REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut. UNFILED, NONE, BLANK, and EMPTY stay blank. A DOC- mark of seven letters is a code. A DOC- mark of fourteen letters or more is long. Any other DOC- mark is live. Four letters are a code. One letter is short. Sixteen letters or more are long. Anything else holds. */
export function crossetteLane(raw: CrossetteValue): CrossetteLane {
  if (crossetteState(raw) !== "set") return "";
  const text = crossetteGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("DOC-") && text.length === 7) return "code";
  if (upper.startsWith("DOC-") && text.length >= 14) return "long";
  if (upper.startsWith("DOC-")) return "live";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length <= 1) return "short";
  if (text.length >= 16) return "long";
  return "hold";
}

export function crossetteHue(raw: CrossetteValue): CrossetteHue {
  const mail = crossetteLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function crossetteLit(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "live";
}

export function crossetteNear(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "code";
}

export function crossetteFar(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "short";
}

export function crossetteFade(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "long";
}

export function crossetteDark(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "shut";
}

export function crossetteDim(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "hold";
}

export function crossetteBlank(raw: CrossetteValue): boolean {
  return crossetteLane(raw) === "blank";
}

export function crossetteOpen(raw: CrossetteValue): boolean {
  return crossetteState(raw) === "clear";
}

export function crossetteLength(raw: CrossetteValue): number | null {
  if (crossetteState(raw) !== "set") return null;
  return crossetteGiven(raw).length;
}

export function crossetteEven(raw: CrossetteValue): boolean {
  const length = crossetteLength(raw);
  return length !== null && length % 2 === 0;
}

export function crossetteDigit(raw: CrossetteValue): boolean {
  return /[0-9]/.test(crossetteGiven(raw));
}

export function crossetteLetter(raw: CrossetteValue): boolean {
  return /[A-Za-z]/.test(crossetteGiven(raw));
}

export function crossetteUpper(raw: CrossetteValue): boolean {
  const text = crossetteGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function crossetteCopy(raw: CrossetteValue): string {
  return crossetteGiven(raw);
}

export function crossetteStamp(raw: CrossetteValue): string {
  const text = crossetteGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function crossetteLanes(rows: readonly CrossetteRow[]): CrossetteLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = crossetteLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingCrossette(rows: readonly CrossetteRow[]): string {
  const lines = crossetteLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingCrossetteHue(rows: readonly CrossetteRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = crossetteHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneCrossetteCount(rows: readonly CrossetteRow[], mail: CrossetteLane): number {
  return rows.filter((row) => crossetteLane(row.code) === mail).length;
}

export function crossetteShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCrossetteLanes(rows: readonly CrossetteRow[]): string[] {
  return crossetteLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenCrossette(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const live = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mail = snip(item, 12);
    if (!live.has(mail) || out.includes(mail)) continue;
    out.push(mail);
  }
  return out;
}

export function readReviewedCrossette(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const live = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = snip(item, 40);
    if (!live.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleCrossette(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleCrossetteReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrossetteReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrossetteLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: CrossetteValue, shape: CrossetteShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return crossetteOpen(raw);
  if (shape === "digit") return crossetteDigit(raw);
  if (shape === "letter") return crossetteLetter(raw);
  if (shape === "even") return crossetteEven(raw);
  if (shape === "upper") return crossetteUpper(raw);
  return crossetteLane(raw) === shape;
}

export function visibleCrossette(
  rows: readonly CrossetteRow[],
  mail: string,
  hue: string,
  query: string,
  review: CrossetteReview,
  reviewed: readonly string[],
  shape: CrossetteShape,
): CrossetteRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = crossetteLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && crossetteHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${crossetteCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function crossetteLanesCsv(rows: readonly CrossetteRow[]): string {
  const lines = ["lane,count"];
  for (const line of crossetteLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function crossetteRowsCsv(rows: readonly CrossetteRow[], reviewed: readonly string[]): string {
  const lines = ["name,documents,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(crossetteCopy(row.code)), crossetteLane(row.code), crossetteHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
