/**
 * Bucrane courses kept in this browser,
 * and meander plates read the sign-in shield already stored on the account.
 * Orders are bucrane, garland, festoon, and swag. Grounds are ivory, graphite, and gilt.
 * Hours are 5, 9, 13, or 18. Depths are 5, 9, or 13.
 * Bucrane and garland are the warm half. Festoon and swag are the cool half.
 * Ivory is the quiet ground.
 * LIVE, YES, SET, and ON are live. OFF, VOID, SHUT, DENY, and NO are shut.
 * HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Four letters are a code. Two letters are short. Twelve letters or more are long. Anything else holds.
 * A true shield reads as LIVE. A false shield reads as OFF.
 * The secret is not read. Money fields are not read. The plate does not change the saved shield.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_bucrane_course (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   profile text not null default '',
 *   hour_mark integer,
 *   bed text not null default '',
 *   depth integer not null default 5,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_meander_shield_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_meander_shield_review (
 *   trader_id text primary key
 * );
 */

export const BCR_KEY = "crmv4-bucrane-403";
export const BCR_VIEW_KEY = "crmv4-bucrane-views-403";
export const BCR_DENSITY_KEY = "crmv4-bucrane-density-403";
export const BCR_PROFILES = ["bucrane", "garland", "festoon", "swag"] as const;

export type BucraneProfile = (typeof BCR_PROFILES)[number];
export type BucraneBed = "blank" | "ivory" | "graphite" | "gilt";
export type BucraneRack = "base" | "press" | "shelf";
export type BucraneDensity = "open" | "tight";
export type BucraneSort = "profile" | "hand";

export type Bucrane = {
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

export type BucraneView = {
  id: string;
  name: string;
  rack: BucraneRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type BucraneCounts = {
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

export const ROUND403_FEATURES = [
  "bucrane-save",
  "bucrane-reminders",
  "bucrane-orders",
  "bucrane-search",
  "bucrane-hour-sla",
  "bucrane-case",
  "bucrane-pin",
  "bucrane-inline-title",
  "bucrane-filters",
  "saved-bucrane-views",
  "bucrane-density",
  "bucrane-focus",
  "bucrane-kpis",
  "bucrane-chart",
  "bucrane-timeline",
  "bucrane-bulk",
  "bucrane-csv",
  "bucrane-keys",
  "bucrane-audit",
  "quietest-bucrane-hand",
  "bucrane-viewer",
  "suggest-bucrane",
  "overdue-bucrane",
  "meander-panels",
  "meander-grant-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [5, 9, 13, 18] as const;
const DEPTH_CYCLE = [5, 9, 13] as const;
const WARM = new Set(["bucrane", "garland"]);
const COOL = new Set(["festoon", "swag"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): BucraneRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<BucraneBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<BucraneBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[bg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Bucrane, rack: BucraneRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return BCR_PROFILES.indexOf(profile as BucraneProfile);
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
  const text = snip(raw, 12).toLowerCase();
  return (BCR_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 5, 9, 13, or 18. Anything else stays blank. */
export function bucraneHour(raw: unknown): 5 | 9 | 13 | 18 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "9" && text !== "13" && text !== "18") return null;
  return Number(text) as 5 | 9 | 13 | 18;
}

/** A depth is 5, 9, or 13. Anything else stays blank. */
export function depthCount(raw: unknown): 5 | 9 | 13 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "9" && text !== "13") return null;
  return Number(text) as 5 | 9 | 13;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function bucraneBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Bucrane is first. Garland is second. Festoon is third. Swag is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "bucrane") return "first";
  if (text === "garland") return "second";
  if (text === "festoon") return "third";
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
  return QUIET_BED.has(bucraneBed(bed));
}

/** A pair depth is 9. Five and thirteen are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 9;
}

/** A full depth is 13. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 13;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = bucraneHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = bucraneBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveBucraneFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestBucraneBed(cards: readonly Bucrane[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "base") || !card.bed) continue;
    counts.set(card.bed, (counts.get(card.bed) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const bed of ["IVORY", "GILT", "GRAPHITE"]) {
    const count = counts.get(bed) || 0;
    if (count < score) {
      best = bed;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest five. Before thirteen, suggest nine. Before eighteen, suggest thirteen. Later, suggest eighteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestBucraneHour(cards: readonly Bucrane[], hour: number): 5 | 9 | 13 | 18 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 9 | 13 | 18 = 5;
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
  if (hour < 9) return 5;
  if (hour < 13) return 9;
  if (hour < 18) return 13;
  return 18;
}

export function suggestProfile(hour: number): BucraneProfile {
  if (hour < 9) return "bucrane";
  if (hour < 13) return "garland";
  if (hour < 18) return "festoon";
  return "swag";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Bucrane[], roster: string): string {
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

export function readBucraneList(raw: unknown): Bucrane[] {
  if (!Array.isArray(raw)) return [];
  const out: Bucrane[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bucrane>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: bucraneHour(row.hour),
      bed: bucraneBed(row.bed),
      depth: depthCount(row.depth) ?? 5,
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

export function addBucrane(
  cards: readonly Bucrane[],
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
): Bucrane[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readBucraneList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: bucraneHour(card.hour),
      bed: bucraneBed(card.bed),
      depth: depthCount(card.depth) ?? 5,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Bucrane[], id: string, edit: (card: Bucrane) => Bucrane): Bucrane[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editBucrane(cards: readonly Bucrane[], id: string, title: string): Bucrane[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBucraneNote(cards: readonly Bucrane[], id: string, note: string): Bucrane[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(bucraneBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setBucraneBed(cards: readonly Bucrane[], id: string, bed: string): Bucrane[] {
  const next = bucraneBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setBucraneRaised(cards: readonly Bucrane[], id: string, raised: boolean): Bucrane[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setBucraneRack(cards: readonly Bucrane[], id: string, pressed: boolean): Bucrane[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setBucraneShelf(cards: readonly Bucrane[], id: string, shelved: boolean): Bucrane[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setBucranePin(cards: readonly Bucrane[], id: string, pinned: boolean): Bucrane[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addBucraneTag(cards: readonly Bucrane[], id: string, tag: string): Bucrane[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 5 | 9 | 13 | 18 {
  if (hour === null) return dir > 0 ? 5 : 18;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 5 | 9 | 13 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setBucraneFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackBucraneFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return setBucraneRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinBucraneFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  return setBucranePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Bucrane[], id: string): Bucrane[] {
  const card = cards.find((item) => item.id === id);
  return card ? setBucraneBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Bucrane[], ids: readonly string[], edit: (card: Bucrane) => Bucrane): Bucrane[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkBucraneLinen(cards: readonly Bucrane[], ids: readonly string[]): Bucrane[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkBucraneRaise(cards: readonly Bucrane[], ids: readonly string[]): Bucrane[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkBucraneShelf(cards: readonly Bucrane[], ids: readonly string[]): Bucrane[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkBucraneTag(cards: readonly Bucrane[], ids: readonly string[]): Bucrane[] {
  return bulk(cards, ids, (card) => (card.tags.includes("w") ? card : { ...card, tags: tagsOf([...card.tags, "w"]), audit: "tag" }));
}

export function readBucraneViews(raw: unknown): BucraneView[] {
  if (!Array.isArray(raw)) return [];
  const out: BucraneView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BucraneView>;
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

export function addBucraneView(views: readonly BucraneView[], view: BucraneView): BucraneView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readBucraneViews([...views, { ...view, name }]);
}

export function dropBucraneView(views: readonly BucraneView[], id: string): BucraneView[] {
  return views.filter((view) => view.id !== id);
}

export function bucraneDensity(raw: unknown): BucraneDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortBucraneList(cards: readonly Bucrane[], sort: BucraneSort): Bucrane[] {
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

export function visibleBucraneList(
  cards: readonly Bucrane[],
  rack: BucraneRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Bucrane[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : bucraneBed(bed);
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

/** Swag at depth five, still not raised and not shelved, is overdue. */
export function overdueBucrane(card: Bucrane): boolean {
  return card.profile === "swag" && card.depth === 5 && !card.raised && !card.shelved;
}

/** No ground, hour five, depth five, and still on the yard. */
export function idleBucrane(card: Bucrane): boolean {
  return !card.bed && card.hour === 5 && card.depth === 5 && !card.raised && !card.pressed && !card.shelved;
}

/** Ivory, eighteen hours, and a full depth, still off the shelf. */
export function briskBucrane(card: Bucrane): boolean {
  return card.bed === "IVORY" && card.hour === 18 && card.depth === 13 && !card.shelved;
}

/** Festoon, graphite, and nine hours. */
export function restingBucrane(card: Bucrane): boolean {
  return card.profile === "festoon" && card.bed === "GRAPHITE" && card.hour === 9;
}

/** A bucrane is late when the station is already swag. */
export function lateBucrane(card: Bucrane, station: string): boolean {
  return card.profile === "bucrane" && profilePoint(station) === "swag" && !card.raised;
}

export function bucraneCounts(cards: readonly Bucrane[], shown: readonly Bucrane[], station: string): BucraneCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 18).length,
    quiet: cards.filter((card) => ivoryQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleBucrane).length,
    brisk: cards.filter(briskBucrane).length,
    resting: cards.filter(restingBucrane).length,
    overdue: cards.filter(overdueBucrane).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateBucrane(card, station)).length,
  };
}

export function bucraneBars(cards: readonly Bucrane[]): { profile: string; count: number }[] {
  return BCR_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function bucraneTimeline(cards: readonly Bucrane[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function bucraneHands(cards: readonly Bucrane[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Bucrane[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of bucraneHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderBucraneList(cards: readonly Bucrane[]): string[] {
  return cards.filter(overdueBucrane).map((card) => card.title);
}

export function bucraneCopy(card: Bucrane): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function bucraneCsv(cards: readonly Bucrane[], station: string): string {
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
        lateBucrane(card, station) ? "1" : "0",
        idleBucrane(card) ? "1" : "0",
        briskBucrane(card) ? "1" : "0",
        restingBucrane(card) ? "1" : "0",
        overdueBucrane(card) ? "1" : "0",
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


export const MND_HIDE_KEY = "crmv4-meander-hide-403";
export const MND_REVIEW_KEY = "crmv4-meander-review-403";

export type MeanderLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type MeanderHue = "" | "gilt" | "ash" | "pearl";
export type MeanderState = "" | "clear" | "set";
export type MeanderReview = "all" | "reviewed" | "fresh";
export type MeanderShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type MeanderValue = string | { totpEnabled?: unknown; [key: string]: unknown } | null | undefined;
export type MeanderRow = { id: string; label: string; code: MeanderValue; userId?: string };
export type MeanderLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["LIVE", "YES", "SET", "ON"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function meanderRecord(raw: MeanderValue): { totpEnabled?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function meanderBlocked(raw: MeanderValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function meanderGiven(raw: MeanderValue): string {
  const row = meanderRecord(raw);
  if (row && !("totpEnabled" in row)) return "";
  const value = row ? row.totpEnabled : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function meanderReadable(raw: MeanderValue): boolean {
  if (meanderBlocked(raw)) return false;
  const row = meanderRecord(raw);
  if (row && !("totpEnabled" in row)) return false;
  return true;
}


export function meanderSlice(raw: unknown): MeanderValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("totpEnabled" in row)) return { totpEnabled: "" };
  const value = row.totpEnabled;
  if (typeof value === "string") return { totpEnabled: snip(value, 48) };
  return { totpEnabled: value as never };
}

export function meanderState(raw: MeanderValue): MeanderState {
  if (!meanderReadable(raw)) return "";
  return meanderGiven(raw) ? "set" : "clear";
}

/** Word marks win first. LIVE, YES, SET, and ON are live. OFF, VOID, SHUT, DENY, and NO are shut. HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank. Four letters are a code. Two letters are short. Twelve letters or more are long. Anything else holds. */
export function meanderLane(raw: MeanderValue): MeanderLane {
  if (meanderState(raw) !== "set") return "";
  const text = meanderGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 12) return "long";
  return "hold";
}

export function meanderHue(raw: MeanderValue): MeanderHue {
  const mail = meanderLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function meanderLit(raw: MeanderValue): boolean {
  return meanderLane(raw) === "live";
}

export function meanderNear(raw: MeanderValue): boolean {
  return meanderLane(raw) === "code";
}

export function meanderFar(raw: MeanderValue): boolean {
  return meanderLane(raw) === "short";
}

export function meanderFade(raw: MeanderValue): boolean {
  return meanderLane(raw) === "long";
}

export function meanderDark(raw: MeanderValue): boolean {
  return meanderLane(raw) === "shut";
}

export function meanderDim(raw: MeanderValue): boolean {
  return meanderLane(raw) === "hold";
}

export function meanderBlank(raw: MeanderValue): boolean {
  return meanderLane(raw) === "blank";
}

export function meanderOpen(raw: MeanderValue): boolean {
  return meanderState(raw) === "clear";
}

export function meanderLength(raw: MeanderValue): number | null {
  if (meanderState(raw) !== "set") return null;
  return meanderGiven(raw).length;
}

export function meanderEven(raw: MeanderValue): boolean {
  const length = meanderLength(raw);
  return length !== null && length % 2 === 0;
}

export function meanderDigit(raw: MeanderValue): boolean {
  return /[0-9]/.test(meanderGiven(raw));
}

export function meanderLetter(raw: MeanderValue): boolean {
  return /[A-Za-z]/.test(meanderGiven(raw));
}

export function meanderUpper(raw: MeanderValue): boolean {
  const text = meanderGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function meanderCopy(raw: MeanderValue): string {
  return meanderGiven(raw);
}

export function meanderStamp(raw: MeanderValue): string {
  const text = meanderGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function meanderLanes(rows: readonly MeanderRow[]): MeanderLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = meanderLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingMeander(rows: readonly MeanderRow[]): string {
  const lines = meanderLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingMeanderHue(rows: readonly MeanderRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = meanderHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneMeanderCount(rows: readonly MeanderRow[], mail: MeanderLane): number {
  return rows.filter((row) => meanderLane(row.code) === mail).length;
}

export function meanderShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentMeanderLanes(rows: readonly MeanderRow[]): string[] {
  return meanderLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenMeander(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedMeander(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleMeander(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleMeanderReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMeanderReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMeanderLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: MeanderValue, shape: MeanderShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return meanderOpen(raw);
  if (shape === "digit") return meanderDigit(raw);
  if (shape === "letter") return meanderLetter(raw);
  if (shape === "even") return meanderEven(raw);
  if (shape === "upper") return meanderUpper(raw);
  return meanderLane(raw) === shape;
}

export function visibleMeander(
  rows: readonly MeanderRow[],
  mail: string,
  hue: string,
  query: string,
  review: MeanderReview,
  reviewed: readonly string[],
  shape: MeanderShape,
): MeanderRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = meanderLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && meanderHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${meanderCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function meanderLanesCsv(rows: readonly MeanderRow[]): string {
  const lines = ["lane,count"];
  for (const line of meanderLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function meanderRowsCsv(rows: readonly MeanderRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(meanderCopy(row.code)), meanderLane(row.code), meanderHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
