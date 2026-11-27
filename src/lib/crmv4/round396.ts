/**
 * Triglyph courses kept in this browser,
 * and regula plates read the timezone already stored on the account.
 * Orders are triglyph, channel, flute, and drip. Grounds are ivory, graphite, and champagne.
 * Hours are 2, 5, 9, or 13. Depths are 2, 5, or 8.
 * Triglyph and channel are the warm half. Flute and drip are the cool half.
 * Champagne is the quiet ground.
 * A timezone with a slash and ordinary length is linked. Under eight letters is short. Twenty-two or more is long.
 * A leading digit of four to six is a figure. Three digits or fewer are short. Seven digits or more are long.
 * A word without a slash shorter than five letters is short. Sixteen or longer is long. Anything else holds.
 * Zone, live, and open are linked. Hold, pause, and wait hold.
 * Off, void, shut, and drop are shut. None, blank, empty, and clear stay blank.
 * A true timezone reads as ZONE. A false timezone reads as OFF.
 * Money fields are not read. The plate does not change the saved timezone.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_triglyph_course (
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
 * CREATE TABLE crm_regula_plate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_regula_plate_review (
 *   trader_id text primary key
 * );
 */
export const TRG_KEY = "crmv4-triglyph-396";
export const TRG_VIEW_KEY = "crmv4-triglyph-views-396";
export const TRG_DENSITY_KEY = "crmv4-triglyph-density-396";
export const TRG_PROFILES = ["triglyph", "channel", "flute", "drip"] as const;

export type TriglyphProfile = (typeof TRG_PROFILES)[number];
export type TriglyphBed = "blank" | "ivory" | "graphite" | "champagne";
export type TriglyphRack = "yard" | "press" | "shelf";
export type TriglyphDensity = "open" | "tight";
export type TriglyphSort = "profile" | "hand";

export type Triglyph = {
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

export type TriglyphView = {
  id: string;
  name: string;
  rack: TriglyphRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type TriglyphCounts = {
  yard: number;
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

export const ROUND396_FEATURES = [
  "triglyph-save",
  "triglyph-reminders",
  "triglyph-orders",
  "triglyph-search",
  "triglyph-hour-sla",
  "triglyph-case",
  "triglyph-pin",
  "triglyph-inline-title",
  "triglyph-filters",
  "saved-triglyph-views",
  "triglyph-density",
  "triglyph-focus",
  "triglyph-kpis",
  "triglyph-chart",
  "triglyph-timeline",
  "triglyph-bulk",
  "triglyph-csv",
  "triglyph-keys",
  "triglyph-audit",
  "quietest-triglyph-hand",
  "triglyph-viewer",
  "suggest-triglyph",
  "overdue-triglyph",
  "regula-panels",
  "regula-timezone-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [2, 5, 9, 13] as const;
const DEPTH_CYCLE = [2, 5, 8] as const;
const WARM = new Set(["triglyph", "channel"]);
const COOL = new Set(["flute", "drip"]);
const QUIET_BED = new Set(["CHAMPAGNE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): TriglyphRack {
  return raw === "press" || raw === "shelf" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<TriglyphBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<TriglyphBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[tg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Triglyph, rack: TriglyphRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return TRG_PROFILES.indexOf(profile as TriglyphProfile);
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
  return (TRG_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 5, 9, or 13. Anything else stays blank. */
export function triglyphHour(raw: unknown): 2 | 5 | 9 | 13 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "9" && text !== "13") return null;
  return Number(text) as 2 | 5 | 9 | 13;
}

/** A depth is 2, 5, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8") return null;
  return Number(text) as 2 | 5 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function triglyphBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Triglyph is first. Console is second. Ancone is third. Corbel is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "triglyph") return "first";
  if (text === "channel") return "second";
  if (text === "flute") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the yard. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function champagneQuiet(bed: unknown): boolean {
  return QUIET_BED.has(triglyphBed(bed));
}

/** A pair depth is 4. Two and eight are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 5;
}

/** A full depth is 7. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 8;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = triglyphHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = triglyphBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveTriglyphFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestTriglyphBed(cards: readonly Triglyph[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "yard") || !card.bed) continue;
    counts.set(card.bed, (counts.get(card.bed) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const bed of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(bed) || 0;
    if (count < score) {
      best = bed;
      score = count;
    }
  }
  return best;
}

/** Before seven, suggest three. Before twelve, suggest seven. Before eighteen, suggest eleven. Later, suggest fifteen. A saved hour on the ridge wins, and a tie keeps the shorter hour. */
export function suggestTriglyphHour(cards: readonly Triglyph[], hour: number): 2 | 5 | 9 | 13 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "yard") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 9 | 13 = 2;
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
  if (hour < 6) return 2;
  if (hour < 11) return 5;
  if (hour < 17) return 9;
  return 13;
}

export function suggestProfile(hour: number): TriglyphProfile {
  if (hour < 6) return "triglyph";
  if (hour < 11) return "channel";
  if (hour < 17) return "flute";
  return "drip";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Triglyph[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised);
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

export function readTriglyphList(raw: unknown): Triglyph[] {
  if (!Array.isArray(raw)) return [];
  const out: Triglyph[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Triglyph>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: triglyphHour(row.hour),
      bed: triglyphBed(row.bed),
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

export function addTriglyph(
  cards: readonly Triglyph[],
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
): Triglyph[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTriglyphList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: triglyphHour(card.hour),
      bed: triglyphBed(card.bed),
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

function mapCard(cards: readonly Triglyph[], id: string, edit: (card: Triglyph) => Triglyph): Triglyph[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTriglyph(cards: readonly Triglyph[], id: string, title: string): Triglyph[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTriglyphNote(cards: readonly Triglyph[], id: string, note: string): Triglyph[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(triglyphBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setTriglyphBed(cards: readonly Triglyph[], id: string, bed: string): Triglyph[] {
  const next = triglyphBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setTriglyphRaised(cards: readonly Triglyph[], id: string, raised: boolean): Triglyph[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setTriglyphRack(cards: readonly Triglyph[], id: string, pressed: boolean): Triglyph[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setTriglyphShelf(cards: readonly Triglyph[], id: string, shelved: boolean): Triglyph[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setTriglyphPin(cards: readonly Triglyph[], id: string, pinned: boolean): Triglyph[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addTriglyphTag(cards: readonly Triglyph[], id: string, tag: string): Triglyph[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 5 | 9 | 13 {
  if (hour === null) return dir > 0 ? 2 : 13;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 5 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setTriglyphFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackTriglyphFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return setTriglyphRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinTriglyphFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  return setTriglyphPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Triglyph[], id: string): Triglyph[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTriglyphBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Triglyph[], ids: readonly string[], edit: (card: Triglyph) => Triglyph): Triglyph[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTriglyphLinen(cards: readonly Triglyph[], ids: readonly string[]): Triglyph[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkTriglyphRaise(cards: readonly Triglyph[], ids: readonly string[]): Triglyph[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkTriglyphShelf(cards: readonly Triglyph[], ids: readonly string[]): Triglyph[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkTriglyphTag(cards: readonly Triglyph[], ids: readonly string[]): Triglyph[] {
  return bulk(cards, ids, (card) => (card.tags.includes("g") ? card : { ...card, tags: tagsOf([...card.tags, "g"]), audit: "tag" }));
}

export function readTriglyphViews(raw: unknown): TriglyphView[] {
  if (!Array.isArray(raw)) return [];
  const out: TriglyphView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TriglyphView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      rack: rackOf(row.rack),
      query: snip(row.query, 40),
      hand: snip(row.hand, 24),
      bed: activeBed(row.bed, ["IVORY", "GRAPHITE", "CHAMPAGNE"]),
      profile: activeProfile(row.profile),
      hour: activeHour(row.hour),
      depth: activeDepth(row.depth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTriglyphView(views: readonly TriglyphView[], view: TriglyphView): TriglyphView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTriglyphViews([...views, { ...view, name }]);
}

export function dropTriglyphView(views: readonly TriglyphView[], id: string): TriglyphView[] {
  return views.filter((view) => view.id !== id);
}

export function triglyphDensity(raw: unknown): TriglyphDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortTriglyphList(cards: readonly Triglyph[], sort: TriglyphSort): Triglyph[] {
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

export function visibleTriglyphList(
  cards: readonly Triglyph[],
  rack: TriglyphRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Triglyph[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : triglyphBed(bed);
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

/** Volute at depth one, still not raised and not on the shelf, is overdue. */
export function overdueTriglyph(card: Triglyph): boolean {
  return card.profile === "drip" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idleTriglyph(card: Triglyph): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Champagne, fifteen hours, and a full depth, still off the shelf. */
export function briskTriglyph(card: Triglyph): boolean {
  return card.bed === "IVORY" && card.hour === 13 && card.depth === 8 && !card.shelved;
}

/** Anthemion, graphite, and seven hours. */
export function restingTriglyph(card: Triglyph): boolean {
  return card.profile === "flute" && card.bed === "IVORY" && card.hour === 5;
}

/** An triglyph drip is late when the station is already drip. */
export function lateTriglyph(card: Triglyph, station: string): boolean {
  return card.profile === "triglyph" && profilePoint(station) === "drip" && !card.raised;
}

export function triglyphCounts(cards: readonly Triglyph[], shown: readonly Triglyph[], station: string): TriglyphCounts {
  return {
    yard: cards.filter((card) => inRack(card, "yard")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 13).length,
    quiet: cards.filter((card) => champagneQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleTriglyph).length,
    brisk: cards.filter(briskTriglyph).length,
    resting: cards.filter(restingTriglyph).length,
    overdue: cards.filter(overdueTriglyph).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateTriglyph(card, station)).length,
  };
}

export function triglyphBars(cards: readonly Triglyph[]): { profile: string; count: number }[] {
  return TRG_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function triglyphTimeline(cards: readonly Triglyph[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "yard"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function triglyphHands(cards: readonly Triglyph[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Triglyph[]): string {
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of triglyphHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTriglyphList(cards: readonly Triglyph[]): string[] {
  return cards.filter(overdueTriglyph).map((card) => card.title);
}

export function triglyphCopy(card: Triglyph): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function triglyphCsv(cards: readonly Triglyph[], station: string): string {
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
        lateTriglyph(card, station) ? "1" : "0",
        idleTriglyph(card) ? "1" : "0",
        briskTriglyph(card) ? "1" : "0",
        restingTriglyph(card) ? "1" : "0",
        overdueTriglyph(card) ? "1" : "0",
        profileWarm(card.profile) ? "1" : "0",
        champagneQuiet(card.bed) ? "1" : "0",
        profileBand(card.profile),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const RGL_HIDE_KEY = "crmv4-regula-hide-396";
export const RGL_REVIEW_KEY = "crmv4-regula-review-396";

export type RegulaLane = "" | "link" | "figure" | "short" | "long" | "hold" | "shut" | "blank";
export type RegulaHue = "" | "gilt" | "ash" | "pearl";
export type RegulaState = "" | "clear" | "set";
export type RegulaReview = "all" | "reviewed" | "fresh";
export type RegulaShape = "all" | "link" | "figure" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type RegulaValue = string | { timezone?: unknown; [key: string]: unknown } | null | undefined;
export type RegulaRow = { id: string; label: string; code: RegulaValue; userId?: string };
export type RegulaLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["link", "figure", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["ZONE", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function regulaRecord(raw: RegulaValue): { timezone?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function regulaBlocked(raw: RegulaValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function regulaGiven(raw: RegulaValue): string {
  const row = regulaRecord(raw);
  if (row && !("timezone" in row)) return "";
  const value = row ? row.timezone : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ZONE";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function regulaReadable(raw: RegulaValue): boolean {
  if (regulaBlocked(raw)) return false;
  const row = regulaRecord(raw);
  if (row && !("timezone" in row)) return false;
  return true;
}

export function regulaState(raw: RegulaValue): RegulaState {
  if (!regulaReadable(raw)) return "";
  return regulaGiven(raw) ? "set" : "clear";
}

/** Word marks win first. A slash zone under eight letters is short. Twenty-two or more is long. An ordinary slash zone is linked. A leading digit of four to six is a figure. A word without a slash under five letters is short. Sixteen or more is long. Anything else holds. */
export function regulaLane(raw: RegulaValue): RegulaLane {
  if (regulaState(raw) !== "set") return "";
  const text = regulaGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "link";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (text.includes("/")) {
    if (text.length < 8) return "short";
    if (text.length >= 22) return "long";
    return "link";
  }
  if (/^[0-9]/.test(text)) {
    if (text.length <= 3) return "short";
    if (text.length <= 6) return "figure";
    return "long";
  }
  if (text.length >= 16) return "long";
  if (text.length < 5) return "short";
  return "hold";
}

export function regulaHue(raw: RegulaValue): RegulaHue {
  const mail = regulaLane(raw);
  if (!mail) return "";
  if (mail === "link") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function regulaLit(raw: RegulaValue): boolean {
  return regulaLane(raw) === "link";
}

export function regulaNear(raw: RegulaValue): boolean {
  return regulaLane(raw) === "figure";
}

export function regulaFar(raw: RegulaValue): boolean {
  return regulaLane(raw) === "short";
}

export function regulaFade(raw: RegulaValue): boolean {
  return regulaLane(raw) === "long";
}

export function regulaDark(raw: RegulaValue): boolean {
  return regulaLane(raw) === "shut";
}

export function regulaDim(raw: RegulaValue): boolean {
  return regulaLane(raw) === "hold";
}

export function regulaBlank(raw: RegulaValue): boolean {
  return regulaLane(raw) === "blank";
}

export function regulaOpen(raw: RegulaValue): boolean {
  return regulaState(raw) === "clear";
}

export function regulaLength(raw: RegulaValue): number | null {
  if (regulaState(raw) !== "set") return null;
  return regulaGiven(raw).length;
}

export function regulaEven(raw: RegulaValue): boolean {
  const length = regulaLength(raw);
  return length !== null && length % 2 === 0;
}

export function regulaDigit(raw: RegulaValue): boolean {
  return /[0-9]/.test(regulaGiven(raw));
}

export function regulaLetter(raw: RegulaValue): boolean {
  return /[A-Za-z]/.test(regulaGiven(raw));
}

export function regulaUpper(raw: RegulaValue): boolean {
  const text = regulaGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function regulaCopy(raw: RegulaValue): string {
  return regulaGiven(raw);
}

export function regulaStamp(raw: RegulaValue): string {
  const text = regulaGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function regulaLanes(rows: readonly RegulaRow[]): RegulaLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = regulaLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingRegula(rows: readonly RegulaRow[]): string {
  const lines = regulaLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingRegulaHue(rows: readonly RegulaRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = regulaHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneRegulaCount(rows: readonly RegulaRow[], mail: RegulaLane): number {
  return rows.filter((row) => regulaLane(row.code) === mail).length;
}

export function regulaShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRegulaLanes(rows: readonly RegulaRow[]): string[] {
  return regulaLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenRegula(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRegula(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRegula(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleRegulaReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRegulaReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRegulaLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: RegulaValue, shape: RegulaShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return regulaOpen(raw);
  if (shape === "digit") return regulaDigit(raw);
  if (shape === "letter") return regulaLetter(raw);
  if (shape === "even") return regulaEven(raw);
  if (shape === "upper") return regulaUpper(raw);
  return regulaLane(raw) === shape;
}

export function visibleRegula(
  rows: readonly RegulaRow[],
  mail: string,
  hue: string,
  query: string,
  review: RegulaReview,
  reviewed: readonly string[],
  shape: RegulaShape,
): RegulaRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = regulaLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && regulaHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${regulaCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function regulaLanesCsv(rows: readonly RegulaRow[]): string {
  const lines = ["lane,count"];
  for (const line of regulaLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function regulaRowsCsv(rows: readonly RegulaRow[], reviewed: readonly string[]): string {
  const lines = ["name,timezone,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(regulaCopy(row.code)), regulaLane(row.code), regulaHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
