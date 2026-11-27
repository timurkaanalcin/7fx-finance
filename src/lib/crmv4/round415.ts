/**
 * Keelson courses kept in this browser,
 * and hachure plates read the documents already stored on the account.
 * Orders are keelson, garboard, strake, and ribband. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 5, 10, or 20. Depths are 2, 4, or 8.
 * Keelson and garboard are the warm half. Strake and ribband are the cool half.
 * Ivory is the quiet ground.
 * APPROVED, COMPLETE, READY, FILED, and YES are live. PENDING, REVIEW, MISSING, WAIT, and HOLD wait.
 * REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut.
 * UNFILED, NONE, BLANK, and EMPTY stay blank.
 * A DOC- mark of seven letters is a code. A DOC- mark of fourteen letters or more is long. Other DOC- marks stay live.
 * Four letters are a code. One letter is short. Sixteen letters or more are long. Anything else holds.
 * A true document mark reads as APPROVED. A false mark reads as MISSING.
 * The secret is not read. Money fields are not read. The plate does not change the saved documents.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_keelson_course (
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
 * CREATE TABLE crm_hachure_document_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_hachure_document_review (
 *   trader_id text primary key
 * );
 */


export const KLS_KEY = "crmv4-keelson-415";
export const KLS_VIEW_KEY = "crmv4-keelson-views-415";
export const KLS_DENSITY_KEY = "crmv4-keelson-density-415";
export const KLS_PROFILES = ["keelson", "garboard", "strake", "ribband"] as const;

export type KeelsonProfile = (typeof KLS_PROFILES)[number];
export type KeelsonBed = "blank" | "ivory" | "graphite" | "gilt";
export type KeelsonRack = "base" | "press" | "shelf";
export type KeelsonDensity = "open" | "tight";
export type KeelsonSort = "profile" | "hand";

export type Keelson = {
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

export type KeelsonView = {
  id: string;
  name: string;
  rack: KeelsonRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type KeelsonCounts = {
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

export const ROUND415_FEATURES = [
  "keelson-save",
  "keelson-reminders",
  "keelson-orders",
  "keelson-search",
  "keelson-hour-sla",
  "keelson-case",
  "keelson-pin",
  "keelson-inline-title",
  "keelson-filters",
  "saved-keelson-views",
  "keelson-density",
  "keelson-focus",
  "keelson-kpis",
  "keelson-chart",
  "keelson-timeline",
  "keelson-bulk",
  "keelson-csv",
  "keelson-keys",
  "keelson-audit",
  "quietest-keelson-hand",
  "keelson-viewer",
  "suggest-keelson",
  "overdue-keelson",
  "hachure-panels",
  "hachure-document-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 5, 10, 20] as const;
const DEPTH_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["keelson", "garboard"]);
const COOL = new Set(["strake", "ribband"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): KeelsonRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<KeelsonBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<KeelsonBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ks]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Keelson, rack: KeelsonRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return KLS_PROFILES.indexOf(profile as KeelsonProfile);
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
  return (KLS_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 5, 10, or 20. Anything else stays blank. */
export function keelsonHour(raw: unknown): 2 | 5 | 10 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "10" && text !== "20") return null;
  return Number(text) as 2 | 5 | 10 | 20;
}

/** A depth is 2, 4, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function keelsonBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Keelson is first. Garboard is second. Strake is third. Ribband is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "keelson") return "first";
  if (text === "garboard") return "second";
  if (text === "strake") return "third";
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
  return QUIET_BED.has(keelsonBed(bed));
}

/** A pair depth is 4. Two and eight are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 4;
}

/** A full depth is 8. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 8;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = keelsonHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = keelsonBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveKeelsonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestKeelsonBed(cards: readonly Keelson[]): string {
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

/** Before two, suggest two. Before five, suggest five. Before ten, suggest ten. Later, suggest twenty. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestKeelsonHour(cards: readonly Keelson[], hour: number): 2 | 5 | 10 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 10 | 20 = 2;
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
  if (hour < 2) return 2;
  if (hour < 5) return 5;
  if (hour < 10) return 10;
  return 20;
}

export function suggestProfile(hour: number): KeelsonProfile {
  if (hour < 2) return "keelson";
  if (hour < 5) return "garboard";
  if (hour < 10) return "strake";
  return "ribband";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Keelson[], roster: string): string {
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

export function readKeelsonList(raw: unknown): Keelson[] {
  if (!Array.isArray(raw)) return [];
  const out: Keelson[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Keelson>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: keelsonHour(row.hour),
      bed: keelsonBed(row.bed),
      depth: depthCount(row.depth) ?? 2,
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

export function addKeelson(
  cards: readonly Keelson[],
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
): Keelson[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readKeelsonList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: keelsonHour(card.hour),
      bed: keelsonBed(card.bed),
      depth: depthCount(card.depth) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Keelson[], id: string, edit: (card: Keelson) => Keelson): Keelson[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editKeelson(cards: readonly Keelson[], id: string, title: string): Keelson[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editKeelsonNote(cards: readonly Keelson[], id: string, note: string): Keelson[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(keelsonBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setKeelsonBed(cards: readonly Keelson[], id: string, bed: string): Keelson[] {
  const next = keelsonBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setKeelsonRaised(cards: readonly Keelson[], id: string, raised: boolean): Keelson[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setKeelsonRack(cards: readonly Keelson[], id: string, pressed: boolean): Keelson[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setKeelsonShelf(cards: readonly Keelson[], id: string, shelved: boolean): Keelson[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setKeelsonPin(cards: readonly Keelson[], id: string, pinned: boolean): Keelson[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addKeelsonTag(cards: readonly Keelson[], id: string, tag: string): Keelson[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 5 | 10 | 20 {
  if (hour === null) return dir > 0 ? 2 : 20;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setKeelsonFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackKeelsonFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return setKeelsonRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinKeelsonFocused(cards: readonly Keelson[], id: string): Keelson[] {
  return setKeelsonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Keelson[], id: string): Keelson[] {
  const card = cards.find((item) => item.id === id);
  return card ? setKeelsonBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Keelson[], ids: readonly string[], edit: (card: Keelson) => Keelson): Keelson[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkKeelsonLinen(cards: readonly Keelson[], ids: readonly string[]): Keelson[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkKeelsonRaise(cards: readonly Keelson[], ids: readonly string[]): Keelson[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkKeelsonShelf(cards: readonly Keelson[], ids: readonly string[]): Keelson[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkKeelsonTag(cards: readonly Keelson[], ids: readonly string[]): Keelson[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readKeelsonViews(raw: unknown): KeelsonView[] {
  if (!Array.isArray(raw)) return [];
  const out: KeelsonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KeelsonView>;
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

export function addKeelsonView(views: readonly KeelsonView[], view: KeelsonView): KeelsonView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readKeelsonViews([...views, { ...view, name }]);
}

export function dropKeelsonView(views: readonly KeelsonView[], id: string): KeelsonView[] {
  return views.filter((view) => view.id !== id);
}

export function keelsonDensity(raw: unknown): KeelsonDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortKeelsonList(cards: readonly Keelson[], sort: KeelsonSort): Keelson[] {
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

export function visibleKeelsonList(
  cards: readonly Keelson[],
  rack: KeelsonRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Keelson[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : keelsonBed(bed);
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

/** A ribband at depth two, still not raised and not shelved, is overdue. */
export function overdueKeelson(card: Keelson): boolean {
  return card.profile === "ribband" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth two, and still on the yard. */
export function idleKeelson(card: Keelson): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Ivory, twenty hours, and a full depth, still off the shelf. */
export function briskKeelson(card: Keelson): boolean {
  return card.bed === "IVORY" && card.hour === 20 && card.depth === 8 && !card.shelved;
}

/** Strake, graphite, and five hours. */
export function restingKeelson(card: Keelson): boolean {
  return card.profile === "strake" && card.bed === "GRAPHITE" && card.hour === 5;
}

/** An keelson is late when the station is already ribband. */
export function lateKeelson(card: Keelson, station: string): boolean {
  return card.profile === "keelson" && profilePoint(station) === "ribband" && !card.raised;
}

export function keelsonCounts(cards: readonly Keelson[], shown: readonly Keelson[], station: string): KeelsonCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 20).length,
    quiet: cards.filter((card) => ivoryQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleKeelson).length,
    brisk: cards.filter(briskKeelson).length,
    resting: cards.filter(restingKeelson).length,
    overdue: cards.filter(overdueKeelson).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateKeelson(card, station)).length,
  };
}

export function keelsonBars(cards: readonly Keelson[]): { profile: string; count: number }[] {
  return KLS_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function keelsonTimeline(cards: readonly Keelson[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function keelsonHands(cards: readonly Keelson[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Keelson[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of keelsonHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderKeelsonList(cards: readonly Keelson[]): string[] {
  return cards.filter(overdueKeelson).map((card) => card.title);
}

export function keelsonCopy(card: Keelson): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function keelsonCsv(cards: readonly Keelson[], station: string): string {
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
        lateKeelson(card, station) ? "1" : "0",
        idleKeelson(card) ? "1" : "0",
        briskKeelson(card) ? "1" : "0",
        restingKeelson(card) ? "1" : "0",
        overdueKeelson(card) ? "1" : "0",
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


export const HCH_HIDE_KEY = "crmv4-hachure-hide-415";
export const HCH_REVIEW_KEY = "crmv4-hachure-review-415";

export type HachureLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type HachureHue = "" | "gilt" | "ash" | "pearl";
export type HachureState = "" | "clear" | "set";
export type HachureReview = "all" | "reviewed" | "fresh";
export type HachureShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type HachureValue = string | { documentsStatus?: unknown; [key: string]: unknown } | null | undefined;
export type HachureRow = { id: string; label: string; code: HachureValue; userId?: string };
export type HachureLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["APPROVED", "COMPLETE", "READY", "FILED", "YES"]);
const HOLD_TITLES = new Set(["PENDING", "REVIEW", "MISSING", "WAIT", "HOLD"]);
const SHUT_TITLES = new Set(["REJECTED", "DENY", "FAIL", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["UNFILED", "NONE", "BLANK", "EMPTY"]);

function hachureRecord(raw: HachureValue): { documentsStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function hachureBlocked(raw: HachureValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function hachureGiven(raw: HachureValue): string {
  const row = hachureRecord(raw);
  if (row && !("documentsStatus" in row)) return "";
  const value = row ? row.documentsStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "APPROVED";
  if (value === false || value === "false" || value === "0" || value === 0) return "MISSING";
  return snip(value, 48);
}

function hachureReadable(raw: HachureValue): boolean {
  if (hachureBlocked(raw)) return false;
  const row = hachureRecord(raw);
  if (row && !("documentsStatus" in row)) return false;
  return true;
}


export function hachureSlice(raw: unknown): HachureValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("documentsStatus" in row)) return { documentsStatus: "" };
  const value = row.documentsStatus;
  if (typeof value === "string") return { documentsStatus: snip(value, 48) };
  return { documentsStatus: value as never };
}

export function hachureState(raw: HachureValue): HachureState {
  if (!hachureReadable(raw)) return "";
  return hachureGiven(raw) ? "set" : "clear";
}

/** Word marks win first. APPROVED, COMPLETE, READY, FILED, and YES are live. PENDING, REVIEW, MISSING, WAIT, and HOLD wait. REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut. UNFILED, NONE, BLANK, and EMPTY stay blank. A DOC- mark of seven letters is a code. A DOC- mark of fourteen letters or more is long. Any other DOC- mark is live. Four letters are a code. One letter is short. Sixteen letters or more are long. Anything else holds. */
export function hachureLane(raw: HachureValue): HachureLane {
  if (hachureState(raw) !== "set") return "";
  const text = hachureGiven(raw);
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

export function hachureHue(raw: HachureValue): HachureHue {
  const mail = hachureLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function hachureLit(raw: HachureValue): boolean {
  return hachureLane(raw) === "live";
}

export function hachureNear(raw: HachureValue): boolean {
  return hachureLane(raw) === "code";
}

export function hachureFar(raw: HachureValue): boolean {
  return hachureLane(raw) === "short";
}

export function hachureFade(raw: HachureValue): boolean {
  return hachureLane(raw) === "long";
}

export function hachureDark(raw: HachureValue): boolean {
  return hachureLane(raw) === "shut";
}

export function hachureDim(raw: HachureValue): boolean {
  return hachureLane(raw) === "hold";
}

export function hachureBlank(raw: HachureValue): boolean {
  return hachureLane(raw) === "blank";
}

export function hachureOpen(raw: HachureValue): boolean {
  return hachureState(raw) === "clear";
}

export function hachureLength(raw: HachureValue): number | null {
  if (hachureState(raw) !== "set") return null;
  return hachureGiven(raw).length;
}

export function hachureEven(raw: HachureValue): boolean {
  const length = hachureLength(raw);
  return length !== null && length % 2 === 0;
}

export function hachureDigit(raw: HachureValue): boolean {
  return /[0-9]/.test(hachureGiven(raw));
}

export function hachureLetter(raw: HachureValue): boolean {
  return /[A-Za-z]/.test(hachureGiven(raw));
}

export function hachureUpper(raw: HachureValue): boolean {
  const text = hachureGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function hachureCopy(raw: HachureValue): string {
  return hachureGiven(raw);
}

export function hachureStamp(raw: HachureValue): string {
  const text = hachureGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function hachureLanes(rows: readonly HachureRow[]): HachureLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = hachureLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingHachure(rows: readonly HachureRow[]): string {
  const lines = hachureLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingHachureHue(rows: readonly HachureRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = hachureHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneHachureCount(rows: readonly HachureRow[], mail: HachureLane): number {
  return rows.filter((row) => hachureLane(row.code) === mail).length;
}

export function hachureShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentHachureLanes(rows: readonly HachureRow[]): string[] {
  return hachureLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenHachure(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedHachure(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleHachure(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleHachureReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkHachureReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleHachureLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: HachureValue, shape: HachureShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return hachureOpen(raw);
  if (shape === "digit") return hachureDigit(raw);
  if (shape === "letter") return hachureLetter(raw);
  if (shape === "even") return hachureEven(raw);
  if (shape === "upper") return hachureUpper(raw);
  return hachureLane(raw) === shape;
}

export function visibleHachure(
  rows: readonly HachureRow[],
  mail: string,
  hue: string,
  query: string,
  review: HachureReview,
  reviewed: readonly string[],
  shape: HachureShape,
): HachureRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = hachureLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && hachureHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${hachureCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function hachureLanesCsv(rows: readonly HachureRow[]): string {
  const lines = ["lane,count"];
  for (const line of hachureLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function hachureRowsCsv(rows: readonly HachureRow[], reviewed: readonly string[]): string {
  const lines = ["name,documents,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(hachureCopy(row.code)), hachureLane(row.code), hachureHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
