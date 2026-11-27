/**
 * Spirketing courses kept in this browser,
 * and limber plates read the affiliate code already stored on the account.
 * Orders are spirketing, deadwood, breastwork, and taffrail. Grounds are ivory, graphite, and gilt.
 * Hours are 4, 8, 16, or 32. Depths are 2, 4, or 8.
 * Spirketing and deadwood are the warm half. Breastwork and taffrail are the cool half.
 * Graphite is the quiet ground.
 * PAID, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait.
 * DROP, VOID, STOP, CLOSED, and BAN are shut.
 * CLEAR, NULL, EMPTY, and MISS stay blank.
 * An AFF- mark of seven letters is a code. An AFF- mark of fourteen letters or more is long. Other AFF- marks stay live.
 * Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds.
 * A true affiliate mark reads as PAID. A false mark reads as SOFT.
 * The secret is not read. Money fields are not read. The plate does not change the saved affiliate code.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_spirketing_course (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   profile text not null default '',
 *   hour_mark integer,
 *   bed text not null default '',
 *   depth integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_limber_affiliate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_limber_affiliate_review (
 *   trader_id text primary key
 * );
 */


export const SPK_KEY = "crmv4-spirketing-417";
export const SPK_VIEW_KEY = "crmv4-spirketing-views-417";
export const SPK_DENSITY_KEY = "crmv4-spirketing-density-417";
export const SPK_PROFILES = ["spirketing", "deadwood", "breastwork", "taffrail"] as const;

export type SpirketingProfile = (typeof SPK_PROFILES)[number];
export type SpirketingBed = "blank" | "ivory" | "graphite" | "gilt";
export type SpirketingRack = "base" | "press" | "shelf";
export type SpirketingDensity = "open" | "tight";
export type SpirketingSort = "profile" | "hand";

export type Spirketing = {
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

export type SpirketingView = {
  id: string;
  name: string;
  rack: SpirketingRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type SpirketingCounts = {
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

export const ROUND417_FEATURES = [
  "spirketing-save",
  "spirketing-reminders",
  "spirketing-orders",
  "spirketing-search",
  "spirketing-hour-sla",
  "spirketing-case",
  "spirketing-pin",
  "spirketing-inline-title",
  "spirketing-filters",
  "saved-spirketing-views",
  "spirketing-density",
  "spirketing-focus",
  "spirketing-kpis",
  "spirketing-chart",
  "spirketing-timeline",
  "spirketing-bulk",
  "spirketing-csv",
  "spirketing-keys",
  "spirketing-audit",
  "quietest-spirketing-hand",
  "spirketing-viewer",
  "suggest-spirketing",
  "overdue-spirketing",
  "limber-panels",
  "limber-affiliate-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [4, 8, 16, 32] as const;
const DEPTH_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["spirketing", "deadwood"]);
const COOL = new Set(["breastwork", "taffrail"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): SpirketingRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<SpirketingBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<SpirketingBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[sl]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Spirketing, rack: SpirketingRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return SPK_PROFILES.indexOf(profile as SpirketingProfile);
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
  return (SPK_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 16, or 32. Anything else stays blank. */
export function spirketingHour(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A depth is 2, 4, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function spirketingBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Spirketing is first. Deadwood is second. Breastwork is third. Taffrail is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "spirketing") return "first";
  if (text === "deadwood") return "second";
  if (text === "breastwork") return "third";
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
  return QUIET_BED.has(spirketingBed(bed));
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
  const hour = spirketingHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = spirketingBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveSpirketingFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestSpirketingBed(cards: readonly Spirketing[]): string {
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

/** Before four, suggest four. Before eight, suggest eight. Before sixteen, suggest sixteen. Later, suggest thirty-two. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestSpirketingHour(cards: readonly Spirketing[], hour: number): 4 | 8 | 16 | 32 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 32 = 4;
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
  if (hour < 4) return 4;
  if (hour < 8) return 8;
  if (hour < 16) return 16;
  return 32;
}

export function suggestProfile(hour: number): SpirketingProfile {
  if (hour < 4) return "spirketing";
  if (hour < 8) return "deadwood";
  if (hour < 16) return "breastwork";
  return "taffrail";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Spirketing[], roster: string): string {
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

export function readSpirketingList(raw: unknown): Spirketing[] {
  if (!Array.isArray(raw)) return [];
  const out: Spirketing[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Spirketing>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: spirketingHour(row.hour),
      bed: spirketingBed(row.bed),
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

export function addSpirketing(
  cards: readonly Spirketing[],
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
): Spirketing[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSpirketingList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: spirketingHour(card.hour),
      bed: spirketingBed(card.bed),
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

function mapCard(cards: readonly Spirketing[], id: string, edit: (card: Spirketing) => Spirketing): Spirketing[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSpirketing(cards: readonly Spirketing[], id: string, title: string): Spirketing[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSpirketingNote(cards: readonly Spirketing[], id: string, note: string): Spirketing[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(spirketingBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setSpirketingBed(cards: readonly Spirketing[], id: string, bed: string): Spirketing[] {
  const next = spirketingBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setSpirketingRaised(cards: readonly Spirketing[], id: string, raised: boolean): Spirketing[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setSpirketingRack(cards: readonly Spirketing[], id: string, pressed: boolean): Spirketing[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setSpirketingShelf(cards: readonly Spirketing[], id: string, shelved: boolean): Spirketing[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setSpirketingPin(cards: readonly Spirketing[], id: string, pinned: boolean): Spirketing[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addSpirketingTag(cards: readonly Spirketing[], id: string, tag: string): Spirketing[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 4 | 8 | 16 | 32 {
  if (hour === null) return dir > 0 ? 4 : 32;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setSpirketingFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackSpirketingFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return setSpirketingRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinSpirketingFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  return setSpirketingPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Spirketing[], id: string): Spirketing[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSpirketingBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Spirketing[], ids: readonly string[], edit: (card: Spirketing) => Spirketing): Spirketing[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSpirketingLinen(cards: readonly Spirketing[], ids: readonly string[]): Spirketing[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkSpirketingRaise(cards: readonly Spirketing[], ids: readonly string[]): Spirketing[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkSpirketingShelf(cards: readonly Spirketing[], ids: readonly string[]): Spirketing[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkSpirketingTag(cards: readonly Spirketing[], ids: readonly string[]): Spirketing[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readSpirketingViews(raw: unknown): SpirketingView[] {
  if (!Array.isArray(raw)) return [];
  const out: SpirketingView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SpirketingView>;
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

export function addSpirketingView(views: readonly SpirketingView[], view: SpirketingView): SpirketingView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSpirketingViews([...views, { ...view, name }]);
}

export function dropSpirketingView(views: readonly SpirketingView[], id: string): SpirketingView[] {
  return views.filter((view) => view.id !== id);
}

export function spirketingDensity(raw: unknown): SpirketingDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortSpirketingList(cards: readonly Spirketing[], sort: SpirketingSort): Spirketing[] {
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

export function visibleSpirketingList(
  cards: readonly Spirketing[],
  rack: SpirketingRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Spirketing[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : spirketingBed(bed);
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

/** A taffrail at depth two, still not raised and not shelved, is overdue. */
export function overdueSpirketing(card: Spirketing): boolean {
  return card.profile === "taffrail" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour four, depth two, and still on the yard. */
export function idleSpirketing(card: Spirketing): boolean {
  return !card.bed && card.hour === 4 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, thirty-two hours, and a full depth, still off the shelf. */
export function briskSpirketing(card: Spirketing): boolean {
  return card.bed === "GRAPHITE" && card.hour === 32 && card.depth === 8 && !card.shelved;
}

/** Breastwork, ivory, and eight hours. */
export function restingSpirketing(card: Spirketing): boolean {
  return card.profile === "breastwork" && card.bed === "IVORY" && card.hour === 8;
}

/** An spirketing is late when the station is already taffrail. */
export function lateSpirketing(card: Spirketing, station: string): boolean {
  return card.profile === "spirketing" && profilePoint(station) === "taffrail" && !card.raised;
}

export function spirketingCounts(cards: readonly Spirketing[], shown: readonly Spirketing[], station: string): SpirketingCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 32).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleSpirketing).length,
    brisk: cards.filter(briskSpirketing).length,
    resting: cards.filter(restingSpirketing).length,
    overdue: cards.filter(overdueSpirketing).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateSpirketing(card, station)).length,
  };
}

export function spirketingBars(cards: readonly Spirketing[]): { profile: string; count: number }[] {
  return SPK_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function spirketingTimeline(cards: readonly Spirketing[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function spirketingHands(cards: readonly Spirketing[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Spirketing[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of spirketingHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSpirketingList(cards: readonly Spirketing[]): string[] {
  return cards.filter(overdueSpirketing).map((card) => card.title);
}

export function spirketingCopy(card: Spirketing): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function spirketingCsv(cards: readonly Spirketing[], station: string): string {
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
        lateSpirketing(card, station) ? "1" : "0",
        idleSpirketing(card) ? "1" : "0",
        briskSpirketing(card) ? "1" : "0",
        restingSpirketing(card) ? "1" : "0",
        overdueSpirketing(card) ? "1" : "0",
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


export const LMB_HIDE_KEY = "crmv4-limber-hide-417";
export const LMB_REVIEW_KEY = "crmv4-limber-review-417";

export type LimberLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type LimberHue = "" | "gilt" | "ash" | "pearl";
export type LimberState = "" | "clear" | "set";
export type LimberReview = "all" | "reviewed" | "fresh";
export type LimberShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type LimberValue = string | { affiliateC?: unknown; [key: string]: unknown } | null | undefined;
export type LimberRow = { id: string; label: string; code: LimberValue; userId?: string };
export type LimberLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["PAID", "OPEN", "LIVE", "GOLD", "ON"]);
const HOLD_TITLES = new Set(["QUEUE", "LATER", "SOFT", "PAUSE", "STAY"]);
const SHUT_TITLES = new Set(["DROP", "VOID", "STOP", "CLOSED", "BAN"]);
const BLANK_TITLES = new Set(["CLEAR", "NULL", "EMPTY", "MISS"]);

function limberRecord(raw: LimberValue): { affiliateC?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function limberBlocked(raw: LimberValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function limberGiven(raw: LimberValue): string {
  const row = limberRecord(raw);
  if (row && !("affiliateC" in row)) return "";
  const value = row ? row.affiliateC : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "PAID";
  if (value === false || value === "false" || value === "0" || value === 0) return "SOFT";
  return snip(value, 48);
}

function limberReadable(raw: LimberValue): boolean {
  if (limberBlocked(raw)) return false;
  const row = limberRecord(raw);
  if (row && !("affiliateC" in row)) return false;
  return true;
}


export function limberSlice(raw: unknown): LimberValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("affiliateC" in row)) return { affiliateC: "" };
  const value = row.affiliateC;
  if (typeof value === "string") return { affiliateC: snip(value, 48) };
  return { affiliateC: value as never };
}

export function limberState(raw: LimberValue): LimberState {
  if (!limberReadable(raw)) return "";
  return limberGiven(raw) ? "set" : "clear";
}

/** Word marks win first. PAID, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait. DROP, VOID, STOP, CLOSED, and BAN are shut. CLEAR, NULL, EMPTY, and MISS stay blank. An AFF- mark of seven letters is a code. An AFF- mark of fourteen letters or more is long. Any other AFF- mark is live. Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds. */
export function limberLane(raw: LimberValue): LimberLane {
  if (limberState(raw) !== "set") return "";
  const text = limberGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("AFF-") && text.length === 7) return "code";
  if (upper.startsWith("AFF-") && text.length >= 14) return "long";
  if (upper.startsWith("AFF-")) return "live";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length === 1) return "short";
  if (text.length >= 14) return "long";
  return "hold";
}

export function limberHue(raw: LimberValue): LimberHue {
  const mail = limberLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function limberLit(raw: LimberValue): boolean {
  return limberLane(raw) === "live";
}

export function limberNear(raw: LimberValue): boolean {
  return limberLane(raw) === "code";
}

export function limberFar(raw: LimberValue): boolean {
  return limberLane(raw) === "short";
}

export function limberFade(raw: LimberValue): boolean {
  return limberLane(raw) === "long";
}

export function limberDark(raw: LimberValue): boolean {
  return limberLane(raw) === "shut";
}

export function limberDim(raw: LimberValue): boolean {
  return limberLane(raw) === "hold";
}

export function limberBlank(raw: LimberValue): boolean {
  return limberLane(raw) === "blank";
}

export function limberOpen(raw: LimberValue): boolean {
  return limberState(raw) === "clear";
}

export function limberLength(raw: LimberValue): number | null {
  if (limberState(raw) !== "set") return null;
  return limberGiven(raw).length;
}

export function limberEven(raw: LimberValue): boolean {
  const length = limberLength(raw);
  return length !== null && length % 2 === 0;
}

export function limberDigit(raw: LimberValue): boolean {
  return /[0-9]/.test(limberGiven(raw));
}

export function limberLetter(raw: LimberValue): boolean {
  return /[A-Za-z]/.test(limberGiven(raw));
}

export function limberUpper(raw: LimberValue): boolean {
  const text = limberGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function limberCopy(raw: LimberValue): string {
  return limberGiven(raw);
}

export function limberStamp(raw: LimberValue): string {
  const text = limberGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function limberLanes(rows: readonly LimberRow[]): LimberLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = limberLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingLimber(rows: readonly LimberRow[]): string {
  const lines = limberLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingLimberHue(rows: readonly LimberRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = limberHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneLimberCount(rows: readonly LimberRow[], mail: LimberLane): number {
  return rows.filter((row) => limberLane(row.code) === mail).length;
}

export function limberShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLimberLanes(rows: readonly LimberRow[]): string[] {
  return limberLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenLimber(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLimber(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLimber(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleLimberReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLimberReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLimberLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: LimberValue, shape: LimberShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return limberOpen(raw);
  if (shape === "digit") return limberDigit(raw);
  if (shape === "letter") return limberLetter(raw);
  if (shape === "even") return limberEven(raw);
  if (shape === "upper") return limberUpper(raw);
  return limberLane(raw) === shape;
}

export function visibleLimber(
  rows: readonly LimberRow[],
  mail: string,
  hue: string,
  query: string,
  review: LimberReview,
  reviewed: readonly string[],
  shape: LimberShape,
): LimberRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = limberLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && limberHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${limberCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function limberLanesCsv(rows: readonly LimberRow[]): string {
  const lines = ["lane,count"];
  for (const line of limberLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function limberRowsCsv(rows: readonly LimberRow[], reviewed: readonly string[]): string {
  const lines = ["name,affiliate,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(limberCopy(row.code)), limberLane(row.code), limberHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
