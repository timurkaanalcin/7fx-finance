/**
 * Hypotrachelion courses kept in this browser,
 * and canalis plates read the operating system already stored on the account.
 * Orders are hypotrachelion, quirk, pedestal, and canalis. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 9, or 15. Depths are 3, 5, or 9.
 * Hypotrachelion and quirk are the warm half. Pedestal and canalis are the cool half.
 * Graphite is the quiet ground.
 * IOS and MAC are live. WAIT, REST, and PARK hold. STOP, VOID, DENY, NO, BLOCK, and OFF are shut.
 * NONE, BLANK, EMPTY, and CLEAR stay blank.
 * An OS- mark of six letters is a code. An OS- mark of twelve letters or more is long. Other OS- marks stay live.
 * Three letters are a code. One letter is short. Eighteen letters or more are long. Anything else holds.
 * A true operating-system mark reads as IOS. A false mark reads as OFF.
 * The secret is not read. Money fields are not read. The plate does not change the saved operating system.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_hypotrachelion_course (
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
 * CREATE TABLE crm_canalis_os_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_canalis_os_review (
 *   trader_id text primary key
 * );
 */


export const HTR_KEY = "crmv4-hypotrachelion-409";
export const HTR_VIEW_KEY = "crmv4-hypotrachelion-views-409";
export const HTR_DENSITY_KEY = "crmv4-hypotrachelion-density-409";
export const HTR_PROFILES = ["hypotrachelion", "quirk", "pedestal", "canalis"] as const;

export type HypotrachelionProfile = (typeof HTR_PROFILES)[number];
export type HypotrachelionBed = "blank" | "ivory" | "graphite" | "gilt";
export type HypotrachelionRack = "base" | "press" | "shelf";
export type HypotrachelionDensity = "open" | "tight";
export type HypotrachelionSort = "profile" | "hand";

export type Hypotrachelion = {
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

export type HypotrachelionView = {
  id: string;
  name: string;
  rack: HypotrachelionRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type HypotrachelionCounts = {
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

export const ROUND409_FEATURES = [
  "hypotrachelion-save",
  "hypotrachelion-reminders",
  "hypotrachelion-orders",
  "hypotrachelion-search",
  "hypotrachelion-hour-sla",
  "hypotrachelion-case",
  "hypotrachelion-pin",
  "hypotrachelion-inline-title",
  "hypotrachelion-filters",
  "saved-hypotrachelion-views",
  "hypotrachelion-density",
  "hypotrachelion-focus",
  "hypotrachelion-kpis",
  "hypotrachelion-chart",
  "hypotrachelion-timeline",
  "hypotrachelion-bulk",
  "hypotrachelion-csv",
  "hypotrachelion-keys",
  "hypotrachelion-audit",
  "quietest-hypotrachelion-hand",
  "hypotrachelion-viewer",
  "suggest-hypotrachelion",
  "overdue-hypotrachelion",
  "canalis-panels",
  "canalis-os-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 9, 15] as const;
const DEPTH_CYCLE = [3, 5, 9] as const;
const WARM = new Set(["hypotrachelion", "quirk"]);
const COOL = new Set(["pedestal", "canalis"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): HypotrachelionRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<HypotrachelionBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<HypotrachelionBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[hq]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Hypotrachelion, rack: HypotrachelionRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return HTR_PROFILES.indexOf(profile as HypotrachelionProfile);
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
  return (HTR_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 9, or 15. Anything else stays blank. */
export function hypotrachelionHour(raw: unknown): 3 | 6 | 9 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "15") return null;
  return Number(text) as 3 | 6 | 9 | 15;
}

/** A depth is 3, 5, or 9. Anything else stays blank. */
export function depthCount(raw: unknown): 3 | 5 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "5" && text !== "9") return null;
  return Number(text) as 3 | 5 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function hypotrachelionBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Hypotrachelion is first. Quirk is second. Pedestal is third. Canalis is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "hypotrachelion") return "first";
  if (text === "quirk") return "second";
  if (text === "pedestal") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the yard. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(bed: unknown): boolean {
  return QUIET_BED.has(hypotrachelionBed(bed));
}

/** A pair depth is 6. Two and ten are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 5;
}

/** A full depth is 10. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 9;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = hypotrachelionHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = hypotrachelionBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveHypotrachelionFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestHypotrachelionBed(cards: readonly Hypotrachelion[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "base") || !card.bed) continue;
    counts.set(card.bed, (counts.get(card.bed) || 0) + 1);
  }
  let best = "GRAPHITE";
  let score = Number.POSITIVE_INFINITY;
  for (const bed of ["GRAPHITE", "IVORY", "GILT"]) {
    const count = counts.get(bed) || 0;
    if (count < score) {
      best = bed;
      score = count;
    }
  }
  return best;
}

/** Before three, suggest three. Before six, suggest six. Before nine, suggest nine. Later, suggest fifteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestHypotrachelionHour(cards: readonly Hypotrachelion[], hour: number): 3 | 6 | 9 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 15 = 3;
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
  if (hour < 9) return 9;
  return 15;
}

export function suggestProfile(hour: number): HypotrachelionProfile {
  if (hour < 3) return "hypotrachelion";
  if (hour < 6) return "quirk";
  if (hour < 9) return "pedestal";
  return "canalis";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Hypotrachelion[], roster: string): string {
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

export function readHypotrachelionList(raw: unknown): Hypotrachelion[] {
  if (!Array.isArray(raw)) return [];
  const out: Hypotrachelion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Hypotrachelion>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: hypotrachelionHour(row.hour),
      bed: hypotrachelionBed(row.bed),
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

export function addHypotrachelion(
  cards: readonly Hypotrachelion[],
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
): Hypotrachelion[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readHypotrachelionList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: hypotrachelionHour(card.hour),
      bed: hypotrachelionBed(card.bed),
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

function mapCard(cards: readonly Hypotrachelion[], id: string, edit: (card: Hypotrachelion) => Hypotrachelion): Hypotrachelion[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editHypotrachelion(cards: readonly Hypotrachelion[], id: string, title: string): Hypotrachelion[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editHypotrachelionNote(cards: readonly Hypotrachelion[], id: string, note: string): Hypotrachelion[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(hypotrachelionBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setHypotrachelionBed(cards: readonly Hypotrachelion[], id: string, bed: string): Hypotrachelion[] {
  const next = hypotrachelionBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setHypotrachelionRaised(cards: readonly Hypotrachelion[], id: string, raised: boolean): Hypotrachelion[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setHypotrachelionRack(cards: readonly Hypotrachelion[], id: string, pressed: boolean): Hypotrachelion[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setHypotrachelionShelf(cards: readonly Hypotrachelion[], id: string, shelved: boolean): Hypotrachelion[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setHypotrachelionPin(cards: readonly Hypotrachelion[], id: string, pinned: boolean): Hypotrachelion[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addHypotrachelionTag(cards: readonly Hypotrachelion[], id: string, tag: string): Hypotrachelion[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 9 | 15 {
  if (hour === null) return dir > 0 ? 3 : 15;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 3 | 5 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setHypotrachelionFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackHypotrachelionFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return setHypotrachelionRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinHypotrachelionFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  return setHypotrachelionPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Hypotrachelion[], id: string): Hypotrachelion[] {
  const card = cards.find((item) => item.id === id);
  return card ? setHypotrachelionBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Hypotrachelion[], ids: readonly string[], edit: (card: Hypotrachelion) => Hypotrachelion): Hypotrachelion[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkHypotrachelionLinen(cards: readonly Hypotrachelion[], ids: readonly string[]): Hypotrachelion[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkHypotrachelionRaise(cards: readonly Hypotrachelion[], ids: readonly string[]): Hypotrachelion[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkHypotrachelionShelf(cards: readonly Hypotrachelion[], ids: readonly string[]): Hypotrachelion[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkHypotrachelionTag(cards: readonly Hypotrachelion[], ids: readonly string[]): Hypotrachelion[] {
  return bulk(cards, ids, (card) => (card.tags.includes("q") ? card : { ...card, tags: tagsOf([...card.tags, "q"]), audit: "tag" }));
}

export function readHypotrachelionViews(raw: unknown): HypotrachelionView[] {
  if (!Array.isArray(raw)) return [];
  const out: HypotrachelionView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HypotrachelionView>;
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

export function addHypotrachelionView(views: readonly HypotrachelionView[], view: HypotrachelionView): HypotrachelionView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readHypotrachelionViews([...views, { ...view, name }]);
}

export function dropHypotrachelionView(views: readonly HypotrachelionView[], id: string): HypotrachelionView[] {
  return views.filter((view) => view.id !== id);
}

export function hypotrachelionDensity(raw: unknown): HypotrachelionDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortHypotrachelionList(cards: readonly Hypotrachelion[], sort: HypotrachelionSort): Hypotrachelion[] {
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

export function visibleHypotrachelionList(
  cards: readonly Hypotrachelion[],
  rack: HypotrachelionRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Hypotrachelion[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : hypotrachelionBed(bed);
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

/** Canalis at depth three, still not raised and not shelved, is overdue. */
export function overdueHypotrachelion(card: Hypotrachelion): boolean {
  return card.profile === "canalis" && card.depth === 3 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth three, and still on the yard. */
export function idleHypotrachelion(card: Hypotrachelion): boolean {
  return !card.bed && card.hour === 3 && card.depth === 3 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, fifteen hours, and a full depth, still off the shelf. */
export function briskHypotrachelion(card: Hypotrachelion): boolean {
  return card.bed === "GRAPHITE" && card.hour === 15 && card.depth === 9 && !card.shelved;
}

/** Pedestal, ivory, and six hours. */
export function restingHypotrachelion(card: Hypotrachelion): boolean {
  return card.profile === "pedestal" && card.bed === "IVORY" && card.hour === 6;
}

/** An hypotrachelion is late when the station is already canalis. */
export function lateHypotrachelion(card: Hypotrachelion, station: string): boolean {
  return card.profile === "hypotrachelion" && profilePoint(station) === "canalis" && !card.raised;
}

export function hypotrachelionCounts(cards: readonly Hypotrachelion[], shown: readonly Hypotrachelion[], station: string): HypotrachelionCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 15).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleHypotrachelion).length,
    brisk: cards.filter(briskHypotrachelion).length,
    resting: cards.filter(restingHypotrachelion).length,
    overdue: cards.filter(overdueHypotrachelion).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateHypotrachelion(card, station)).length,
  };
}

export function hypotrachelionBars(cards: readonly Hypotrachelion[]): { profile: string; count: number }[] {
  return HTR_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function hypotrachelionTimeline(cards: readonly Hypotrachelion[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function hypotrachelionHands(cards: readonly Hypotrachelion[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Hypotrachelion[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of hypotrachelionHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderHypotrachelionList(cards: readonly Hypotrachelion[]): string[] {
  return cards.filter(overdueHypotrachelion).map((card) => card.title);
}

export function hypotrachelionCopy(card: Hypotrachelion): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function hypotrachelionCsv(cards: readonly Hypotrachelion[], station: string): string {
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
        lateHypotrachelion(card, station) ? "1" : "0",
        idleHypotrachelion(card) ? "1" : "0",
        briskHypotrachelion(card) ? "1" : "0",
        restingHypotrachelion(card) ? "1" : "0",
        overdueHypotrachelion(card) ? "1" : "0",
        profileWarm(card.profile) ? "1" : "0",
        graphiteQuiet(card.bed) ? "1" : "0",
        profileBand(card.profile),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const CNL_HIDE_KEY = "crmv4-canalis-hide-409";
export const CNL_REVIEW_KEY = "crmv4-canalis-review-409";

export type CanalisLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type CanalisHue = "" | "gilt" | "ash" | "pearl";
export type CanalisState = "" | "clear" | "set";
export type CanalisReview = "all" | "reviewed" | "fresh";
export type CanalisShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type CanalisValue = string | { lastOs?: unknown; [key: string]: unknown } | null | undefined;
export type CanalisRow = { id: string; label: string; code: CanalisValue; userId?: string };
export type CanalisLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["IOS", "MAC"]);
const HOLD_TITLES = new Set(["WAIT", "REST", "PARK"]);
const SHUT_TITLES = new Set(["STOP", "VOID", "DENY", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function canalisRecord(raw: CanalisValue): { lastOs?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function canalisBlocked(raw: CanalisValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function canalisGiven(raw: CanalisValue): string {
  const row = canalisRecord(raw);
  if (row && !("lastOs" in row)) return "";
  const value = row ? row.lastOs : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "IOS";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function canalisReadable(raw: CanalisValue): boolean {
  if (canalisBlocked(raw)) return false;
  const row = canalisRecord(raw);
  if (row && !("lastOs" in row)) return false;
  return true;
}


export function canalisSlice(raw: unknown): CanalisValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("lastOs" in row)) return { lastOs: "" };
  const value = row.lastOs;
  if (typeof value === "string") return { lastOs: snip(value, 48) };
  return { lastOs: value as never };
}

export function canalisState(raw: CanalisValue): CanalisState {
  if (!canalisReadable(raw)) return "";
  return canalisGiven(raw) ? "set" : "clear";
}

/** Word marks win first. IOS and MAC are live. WAIT, REST, and PARK hold. STOP, VOID, DENY, NO, BLOCK, and OFF are shut. NONE, BLANK, EMPTY, and CLEAR stay blank. An OS- mark of six letters is a code. An OS- mark of twelve letters or more is long. Any other OS- mark is live. Three letters are a code. One letter is short. Eighteen letters or more are long. Anything else holds. */
export function canalisLane(raw: CanalisValue): CanalisLane {
  if (canalisState(raw) !== "set") return "";
  const text = canalisGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("OS-") && text.length === 6) return "code";
  if (upper.startsWith("OS-") && text.length >= 12) return "long";
  if (upper.startsWith("OS-")) return "live";
  if (/^[A-Za-z]{3}$/.test(text)) return "code";
  if (text.length <= 1) return "short";
  if (text.length >= 18) return "long";
  return "hold";
}

export function canalisHue(raw: CanalisValue): CanalisHue {
  const mail = canalisLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function canalisLit(raw: CanalisValue): boolean {
  return canalisLane(raw) === "live";
}

export function canalisNear(raw: CanalisValue): boolean {
  return canalisLane(raw) === "code";
}

export function canalisFar(raw: CanalisValue): boolean {
  return canalisLane(raw) === "short";
}

export function canalisFade(raw: CanalisValue): boolean {
  return canalisLane(raw) === "long";
}

export function canalisDark(raw: CanalisValue): boolean {
  return canalisLane(raw) === "shut";
}

export function canalisDim(raw: CanalisValue): boolean {
  return canalisLane(raw) === "hold";
}

export function canalisBlank(raw: CanalisValue): boolean {
  return canalisLane(raw) === "blank";
}

export function canalisOpen(raw: CanalisValue): boolean {
  return canalisState(raw) === "clear";
}

export function canalisLength(raw: CanalisValue): number | null {
  if (canalisState(raw) !== "set") return null;
  return canalisGiven(raw).length;
}

export function canalisEven(raw: CanalisValue): boolean {
  const length = canalisLength(raw);
  return length !== null && length % 2 === 0;
}

export function canalisDigit(raw: CanalisValue): boolean {
  return /[0-9]/.test(canalisGiven(raw));
}

export function canalisLetter(raw: CanalisValue): boolean {
  return /[A-Za-z]/.test(canalisGiven(raw));
}

export function canalisUpper(raw: CanalisValue): boolean {
  const text = canalisGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function canalisCopy(raw: CanalisValue): string {
  return canalisGiven(raw);
}

export function canalisStamp(raw: CanalisValue): string {
  const text = canalisGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function canalisLanes(rows: readonly CanalisRow[]): CanalisLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = canalisLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingCanalis(rows: readonly CanalisRow[]): string {
  const lines = canalisLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingCanalisHue(rows: readonly CanalisRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = canalisHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneCanalisCount(rows: readonly CanalisRow[], mail: CanalisLane): number {
  return rows.filter((row) => canalisLane(row.code) === mail).length;
}

export function canalisShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCanalisLanes(rows: readonly CanalisRow[]): string[] {
  return canalisLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenCanalis(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCanalis(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCanalis(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleCanalisReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCanalisReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCanalisLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: CanalisValue, shape: CanalisShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return canalisOpen(raw);
  if (shape === "digit") return canalisDigit(raw);
  if (shape === "letter") return canalisLetter(raw);
  if (shape === "even") return canalisEven(raw);
  if (shape === "upper") return canalisUpper(raw);
  return canalisLane(raw) === shape;
}

export function visibleCanalis(
  rows: readonly CanalisRow[],
  mail: string,
  hue: string,
  query: string,
  review: CanalisReview,
  reviewed: readonly string[],
  shape: CanalisShape,
): CanalisRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = canalisLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && canalisHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${canalisCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function canalisLanesCsv(rows: readonly CanalisRow[]): string {
  const lines = ["lane,count"];
  for (const line of canalisLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function canalisRowsCsv(rows: readonly CanalisRow[], reviewed: readonly string[]): string {
  const lines = ["name,os,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(canalisCopy(row.code)), canalisLane(row.code), canalisHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
