/**
 * Futtock courses kept in this browser,
 * and coaming plates read the retention status already stored on the account.
 * Orders are futtock, toptimber, knighthead, and cathead. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 12, or 24. Depths are 1, 3, or 9.
 * Futtock and toptimber are the warm half. Knighthead and cathead are the cool half.
 * Ivory is the quiet ground.
 * ACTIVE, KEPT, WARM, HELD, and YES are live. PENDING, REVIEW, COOL, WAIT, and HOLD wait.
 * LOST, DENY, FAIL, NO, BLOCK, and OFF are shut.
 * UNSET, NONE, BLANK, and EMPTY stay blank.
 * A RET- mark of six letters is a code. A RET- mark of twelve letters or more is long. Other RET- marks stay live.
 * Five letters are a code. Two letters or fewer are short. Twelve letters or more are long. Anything else holds.
 * A true retention mark reads as ACTIVE. A false mark reads as COOL.
 * The secret is not read. Money fields are not read. The plate does not change the saved retention status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_futtock_course (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   profile text not null default '',
 *   hour_mark integer,
 *   bed text not null default '',
 *   depth integer not null default 1,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_coaming_retention_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_coaming_retention_review (
 *   trader_id text primary key
 * );
 */


export const FTK_KEY = "crmv4-futtock-416";
export const FTK_VIEW_KEY = "crmv4-futtock-views-416";
export const FTK_DENSITY_KEY = "crmv4-futtock-density-416";
export const FTK_PROFILES = ["futtock", "toptimber", "knighthead", "cathead"] as const;

export type FuttockProfile = (typeof FTK_PROFILES)[number];
export type FuttockBed = "blank" | "ivory" | "graphite" | "gilt";
export type FuttockRack = "base" | "press" | "shelf";
export type FuttockDensity = "open" | "tight";
export type FuttockSort = "profile" | "hand";

export type Futtock = {
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

export type FuttockView = {
  id: string;
  name: string;
  rack: FuttockRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type FuttockCounts = {
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

export const ROUND416_FEATURES = [
  "futtock-save",
  "futtock-reminders",
  "futtock-orders",
  "futtock-search",
  "futtock-hour-sla",
  "futtock-case",
  "futtock-pin",
  "futtock-inline-title",
  "futtock-filters",
  "saved-futtock-views",
  "futtock-density",
  "futtock-focus",
  "futtock-kpis",
  "futtock-chart",
  "futtock-timeline",
  "futtock-bulk",
  "futtock-csv",
  "futtock-keys",
  "futtock-audit",
  "quietest-futtock-hand",
  "futtock-viewer",
  "suggest-futtock",
  "overdue-futtock",
  "coaming-panels",
  "coaming-retention-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 12, 24] as const;
const DEPTH_CYCLE = [1, 3, 9] as const;
const WARM = new Set(["futtock", "toptimber"]);
const COOL = new Set(["knighthead", "cathead"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): FuttockRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<FuttockBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<FuttockBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ft]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Futtock, rack: FuttockRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return FTK_PROFILES.indexOf(profile as FuttockProfile);
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
  return (FTK_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 12, or 24. Anything else stays blank. */
export function futtockHour(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A depth is 1, 3, or 9. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 3 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "9") return null;
  return Number(text) as 1 | 3 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function futtockBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Futtock is first. Toptimber is second. Knighthead is third. Cathead is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "futtock") return "first";
  if (text === "toptimber") return "second";
  if (text === "knighthead") return "third";
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
  return QUIET_BED.has(futtockBed(bed));
}

/** A pair depth is 3. One and nine are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 3;
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
  const hour = futtockHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = futtockBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveFuttockFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestFuttockBed(cards: readonly Futtock[]): string {
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

/** Before three, suggest three. Before six, suggest six. Before twelve, suggest twelve. Later, suggest twenty-four. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestFuttockHour(cards: readonly Futtock[], hour: number): 3 | 6 | 12 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 12 | 24 = 3;
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
  return 24;
}

export function suggestProfile(hour: number): FuttockProfile {
  if (hour < 3) return "futtock";
  if (hour < 6) return "toptimber";
  if (hour < 12) return "knighthead";
  return "cathead";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Futtock[], roster: string): string {
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

export function readFuttockList(raw: unknown): Futtock[] {
  if (!Array.isArray(raw)) return [];
  const out: Futtock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Futtock>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: futtockHour(row.hour),
      bed: futtockBed(row.bed),
      depth: depthCount(row.depth) ?? 1,
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

export function addFuttock(
  cards: readonly Futtock[],
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
): Futtock[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readFuttockList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: futtockHour(card.hour),
      bed: futtockBed(card.bed),
      depth: depthCount(card.depth) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Futtock[], id: string, edit: (card: Futtock) => Futtock): Futtock[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editFuttock(cards: readonly Futtock[], id: string, title: string): Futtock[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editFuttockNote(cards: readonly Futtock[], id: string, note: string): Futtock[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(futtockBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setFuttockBed(cards: readonly Futtock[], id: string, bed: string): Futtock[] {
  const next = futtockBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setFuttockRaised(cards: readonly Futtock[], id: string, raised: boolean): Futtock[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setFuttockRack(cards: readonly Futtock[], id: string, pressed: boolean): Futtock[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setFuttockShelf(cards: readonly Futtock[], id: string, shelved: boolean): Futtock[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setFuttockPin(cards: readonly Futtock[], id: string, pinned: boolean): Futtock[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addFuttockTag(cards: readonly Futtock[], id: string, tag: string): Futtock[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 12 | 24 {
  if (hour === null) return dir > 0 ? 3 : 24;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 1 | 3 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setFuttockFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackFuttockFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return setFuttockRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinFuttockFocused(cards: readonly Futtock[], id: string): Futtock[] {
  return setFuttockPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Futtock[], id: string): Futtock[] {
  const card = cards.find((item) => item.id === id);
  return card ? setFuttockBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Futtock[], ids: readonly string[], edit: (card: Futtock) => Futtock): Futtock[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkFuttockLinen(cards: readonly Futtock[], ids: readonly string[]): Futtock[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkFuttockRaise(cards: readonly Futtock[], ids: readonly string[]): Futtock[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkFuttockShelf(cards: readonly Futtock[], ids: readonly string[]): Futtock[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkFuttockTag(cards: readonly Futtock[], ids: readonly string[]): Futtock[] {
  return bulk(cards, ids, (card) => (card.tags.includes("f") ? card : { ...card, tags: tagsOf([...card.tags, "f"]), audit: "tag" }));
}

export function readFuttockViews(raw: unknown): FuttockView[] {
  if (!Array.isArray(raw)) return [];
  const out: FuttockView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<FuttockView>;
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

export function addFuttockView(views: readonly FuttockView[], view: FuttockView): FuttockView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readFuttockViews([...views, { ...view, name }]);
}

export function dropFuttockView(views: readonly FuttockView[], id: string): FuttockView[] {
  return views.filter((view) => view.id !== id);
}

export function futtockDensity(raw: unknown): FuttockDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortFuttockList(cards: readonly Futtock[], sort: FuttockSort): Futtock[] {
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

export function visibleFuttockList(
  cards: readonly Futtock[],
  rack: FuttockRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Futtock[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : futtockBed(bed);
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

/** A cathead at depth one, still not raised and not shelved, is overdue. */
export function overdueFuttock(card: Futtock): boolean {
  return card.profile === "cathead" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the yard. */
export function idleFuttock(card: Futtock): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Ivory, twenty-four hours, and a full depth, still off the shelf. */
export function briskFuttock(card: Futtock): boolean {
  return card.bed === "IVORY" && card.hour === 24 && card.depth === 9 && !card.shelved;
}

/** Knighthead, graphite, and six hours. */
export function restingFuttock(card: Futtock): boolean {
  return card.profile === "knighthead" && card.bed === "GRAPHITE" && card.hour === 6;
}

/** An futtock is late when the station is already cathead. */
export function lateFuttock(card: Futtock, station: string): boolean {
  return card.profile === "futtock" && profilePoint(station) === "cathead" && !card.raised;
}

export function futtockCounts(cards: readonly Futtock[], shown: readonly Futtock[], station: string): FuttockCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 24).length,
    quiet: cards.filter((card) => ivoryQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleFuttock).length,
    brisk: cards.filter(briskFuttock).length,
    resting: cards.filter(restingFuttock).length,
    overdue: cards.filter(overdueFuttock).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateFuttock(card, station)).length,
  };
}

export function futtockBars(cards: readonly Futtock[]): { profile: string; count: number }[] {
  return FTK_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function futtockTimeline(cards: readonly Futtock[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function futtockHands(cards: readonly Futtock[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Futtock[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of futtockHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderFuttockList(cards: readonly Futtock[]): string[] {
  return cards.filter(overdueFuttock).map((card) => card.title);
}

export function futtockCopy(card: Futtock): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function futtockCsv(cards: readonly Futtock[], station: string): string {
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
        lateFuttock(card, station) ? "1" : "0",
        idleFuttock(card) ? "1" : "0",
        briskFuttock(card) ? "1" : "0",
        restingFuttock(card) ? "1" : "0",
        overdueFuttock(card) ? "1" : "0",
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


export const CMG_HIDE_KEY = "crmv4-coaming-hide-416";
export const CMG_REVIEW_KEY = "crmv4-coaming-review-416";

export type CoamingLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type CoamingHue = "" | "gilt" | "ash" | "pearl";
export type CoamingState = "" | "clear" | "set";
export type CoamingReview = "all" | "reviewed" | "fresh";
export type CoamingShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type CoamingValue = string | { retentionStatus?: unknown; [key: string]: unknown } | null | undefined;
export type CoamingRow = { id: string; label: string; code: CoamingValue; userId?: string };
export type CoamingLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["ACTIVE", "KEPT", "WARM", "HELD", "YES"]);
const HOLD_TITLES = new Set(["PENDING", "REVIEW", "COOL", "WAIT", "HOLD"]);
const SHUT_TITLES = new Set(["LOST", "DENY", "FAIL", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["UNSET", "NONE", "BLANK", "EMPTY"]);

function coamingRecord(raw: CoamingValue): { retentionStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function coamingBlocked(raw: CoamingValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function coamingGiven(raw: CoamingValue): string {
  const row = coamingRecord(raw);
  if (row && !("retentionStatus" in row)) return "";
  const value = row ? row.retentionStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ACTIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "COOL";
  return snip(value, 48);
}

function coamingReadable(raw: CoamingValue): boolean {
  if (coamingBlocked(raw)) return false;
  const row = coamingRecord(raw);
  if (row && !("retentionStatus" in row)) return false;
  return true;
}


export function coamingSlice(raw: unknown): CoamingValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("retentionStatus" in row)) return { retentionStatus: "" };
  const value = row.retentionStatus;
  if (typeof value === "string") return { retentionStatus: snip(value, 48) };
  return { retentionStatus: value as never };
}

export function coamingState(raw: CoamingValue): CoamingState {
  if (!coamingReadable(raw)) return "";
  return coamingGiven(raw) ? "set" : "clear";
}

/** Word marks win first. ACTIVE, KEPT, WARM, HELD, and YES are live. PENDING, REVIEW, COOL, WAIT, and HOLD wait. LOST, DENY, FAIL, NO, BLOCK, and OFF are shut. UNSET, NONE, BLANK, and EMPTY stay blank. A RET- mark of six letters is a code. A RET- mark of twelve letters or more is long. Any other RET- mark is live. Five letters are a code. Two letters or fewer are short. Twelve letters or more are long. Anything else holds. */
export function coamingLane(raw: CoamingValue): CoamingLane {
  if (coamingState(raw) !== "set") return "";
  const text = coamingGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("RET-") && text.length === 6) return "code";
  if (upper.startsWith("RET-") && text.length >= 12) return "long";
  if (upper.startsWith("RET-")) return "live";
  if (/^[A-Za-z]{5}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 12) return "long";
  return "hold";
}

export function coamingHue(raw: CoamingValue): CoamingHue {
  const mail = coamingLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function coamingLit(raw: CoamingValue): boolean {
  return coamingLane(raw) === "live";
}

export function coamingNear(raw: CoamingValue): boolean {
  return coamingLane(raw) === "code";
}

export function coamingFar(raw: CoamingValue): boolean {
  return coamingLane(raw) === "short";
}

export function coamingFade(raw: CoamingValue): boolean {
  return coamingLane(raw) === "long";
}

export function coamingDark(raw: CoamingValue): boolean {
  return coamingLane(raw) === "shut";
}

export function coamingDim(raw: CoamingValue): boolean {
  return coamingLane(raw) === "hold";
}

export function coamingBlank(raw: CoamingValue): boolean {
  return coamingLane(raw) === "blank";
}

export function coamingOpen(raw: CoamingValue): boolean {
  return coamingState(raw) === "clear";
}

export function coamingLength(raw: CoamingValue): number | null {
  if (coamingState(raw) !== "set") return null;
  return coamingGiven(raw).length;
}

export function coamingEven(raw: CoamingValue): boolean {
  const length = coamingLength(raw);
  return length !== null && length % 2 === 0;
}

export function coamingDigit(raw: CoamingValue): boolean {
  return /[0-9]/.test(coamingGiven(raw));
}

export function coamingLetter(raw: CoamingValue): boolean {
  return /[A-Za-z]/.test(coamingGiven(raw));
}

export function coamingUpper(raw: CoamingValue): boolean {
  const text = coamingGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function coamingCopy(raw: CoamingValue): string {
  return coamingGiven(raw);
}

export function coamingStamp(raw: CoamingValue): string {
  const text = coamingGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function coamingLanes(rows: readonly CoamingRow[]): CoamingLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = coamingLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingCoaming(rows: readonly CoamingRow[]): string {
  const lines = coamingLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingCoamingHue(rows: readonly CoamingRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = coamingHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneCoamingCount(rows: readonly CoamingRow[], mail: CoamingLane): number {
  return rows.filter((row) => coamingLane(row.code) === mail).length;
}

export function coamingShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCoamingLanes(rows: readonly CoamingRow[]): string[] {
  return coamingLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenCoaming(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCoaming(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCoaming(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleCoamingReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCoamingReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCoamingLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: CoamingValue, shape: CoamingShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return coamingOpen(raw);
  if (shape === "digit") return coamingDigit(raw);
  if (shape === "letter") return coamingLetter(raw);
  if (shape === "even") return coamingEven(raw);
  if (shape === "upper") return coamingUpper(raw);
  return coamingLane(raw) === shape;
}

export function visibleCoaming(
  rows: readonly CoamingRow[],
  mail: string,
  hue: string,
  query: string,
  review: CoamingReview,
  reviewed: readonly string[],
  shape: CoamingShape,
): CoamingRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = coamingLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && coamingHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${coamingCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function coamingLanesCsv(rows: readonly CoamingRow[]): string {
  const lines = ["lane,count"];
  for (const line of coamingLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function coamingRowsCsv(rows: readonly CoamingRow[], reviewed: readonly string[]): string {
  const lines = ["name,retention,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(coamingCopy(row.code)), coamingLane(row.code), coamingHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
