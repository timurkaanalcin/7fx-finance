/**
 * Modillion brackets kept in this browser,
 * and gutta drops read the first name already stored on the account.
 * Orders are modillion, console, ancone, and corbel. Grounds are ivory, graphite, and champagne.
 * Hours are 2, 6, 10, or 14. Depths are 2, 4, or 8.
 * Modillion and console are the warm half. Ancone and corbel are the cool half.
 * Graphite is the quiet ground.
 * A first name today is due. Within three days ahead is soon. Further ahead is far.
 * A first name younger than five days past is late. Older than that is missed.
 * Live, now, due, and today are due. Near, soon, and week are soon. Hold, pause, and rest hold.
 * Aged and late are late. Miss, gone, void, and drop are missed. None, blank, empty, and clear stay blank.
 * A true first name reads as LIVE. A false first name reads as VOID.
 * Money fields are not read. The drop does not change the saved first name.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_modillion_bracket (
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
 * CREATE TABLE crm_gutta_drop_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_gutta_drop_review (
 *   trader_id text primary key
 * );
 */
export const MDL_KEY = "crmv4-modillion-392";
export const MDL_VIEW_KEY = "crmv4-modillion-views-392";
export const MDL_DENSITY_KEY = "crmv4-modillion-density-392";
export const MDL_PROFILES = ["modillion", "console", "ancone", "corbel"] as const;

export type ModillionProfile = (typeof MDL_PROFILES)[number];
export type ModillionBed = "blank" | "ivory" | "graphite" | "champagne";
export type ModillionRack = "yard" | "press" | "shelf";
export type ModillionDensity = "open" | "tight";
export type ModillionSort = "profile" | "hand";

export type Modillion = {
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

export type ModillionView = {
  id: string;
  name: string;
  rack: ModillionRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type ModillionCounts = {
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

export const ROUND392_FEATURES = [
  "modillion-save",
  "modillion-reminders",
  "modillion-orders",
  "modillion-search",
  "modillion-hour-sla",
  "modillion-case",
  "modillion-pin",
  "modillion-inline-title",
  "modillion-filters",
  "saved-modillion-views",
  "modillion-density",
  "modillion-focus",
  "modillion-kpis",
  "modillion-chart",
  "modillion-timeline",
  "modillion-bulk",
  "modillion-csv",
  "modillion-keys",
  "modillion-audit",
  "lightest-yard-hand",
  "modillion-viewer",
  "suggest-modillion",
  "overdue-corbel",
  "gutta-drops",
  "gutta-firstname-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [2, 6, 10, 14] as const;
const DEPTH_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["modillion", "console"]);
const COOL = new Set(["ancone", "corbel"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): ModillionRack {
  return raw === "press" || raw === "shelf" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<ModillionBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<ModillionBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[mk]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Modillion, rack: ModillionRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return MDL_PROFILES.indexOf(profile as ModillionProfile);
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
  return (MDL_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 6, 10, or 14. Anything else stays blank. */
export function modillionHour(raw: unknown): 2 | 6 | 10 | 14 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10" && text !== "14") return null;
  return Number(text) as 2 | 6 | 10 | 14;
}

/** A depth is 2, 4, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function modillionBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Modillion is first. Console is second. Ancone is third. Corbel is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "modillion") return "first";
  if (text === "console") return "second";
  if (text === "ancone") return "third";
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
  return QUIET_BED.has(modillionBed(bed));
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
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = modillionHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = modillionBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveModillionFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestModillionBed(cards: readonly Modillion[]): string {
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

/** Before six, suggest two. Before twelve, suggest six. Before eighteen, suggest ten. Later, suggest fourteen. A saved hour on the yard wins, and a tie keeps the shorter hour. */
export function suggestModillionHour(cards: readonly Modillion[], hour: number): 2 | 6 | 10 | 14 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "yard") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 6 | 10 | 14 = 2;
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
  if (hour < 12) return 6;
  if (hour < 18) return 10;
  return 14;
}

export function suggestProfile(hour: number): ModillionProfile {
  if (hour < 6) return "modillion";
  if (hour < 12) return "console";
  if (hour < 18) return "ancone";
  return "corbel";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Modillion[], roster: string): string {
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

export function readModillionList(raw: unknown): Modillion[] {
  if (!Array.isArray(raw)) return [];
  const out: Modillion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Modillion>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: modillionHour(row.hour),
      bed: modillionBed(row.bed),
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

export function addModillion(
  cards: readonly Modillion[],
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
): Modillion[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readModillionList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: modillionHour(card.hour),
      bed: modillionBed(card.bed),
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

function mapCard(cards: readonly Modillion[], id: string, edit: (card: Modillion) => Modillion): Modillion[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editModillion(cards: readonly Modillion[], id: string, title: string): Modillion[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editModillionNote(cards: readonly Modillion[], id: string, note: string): Modillion[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(modillionBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setModillionBed(cards: readonly Modillion[], id: string, bed: string): Modillion[] {
  const next = modillionBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setModillionRaised(cards: readonly Modillion[], id: string, raised: boolean): Modillion[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setModillionRack(cards: readonly Modillion[], id: string, pressed: boolean): Modillion[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setModillionShelf(cards: readonly Modillion[], id: string, shelved: boolean): Modillion[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setModillionPin(cards: readonly Modillion[], id: string, pinned: boolean): Modillion[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addModillionTag(cards: readonly Modillion[], id: string, tag: string): Modillion[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 6 | 10 | 14 {
  if (hour === null) return dir > 0 ? 2 : 14;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setModillionFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackModillionFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return setModillionRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinModillionFocused(cards: readonly Modillion[], id: string): Modillion[] {
  return setModillionPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Modillion[], id: string): Modillion[] {
  const card = cards.find((item) => item.id === id);
  return card ? setModillionBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Modillion[], ids: readonly string[], edit: (card: Modillion) => Modillion): Modillion[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkModillionLinen(cards: readonly Modillion[], ids: readonly string[]): Modillion[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkModillionRaise(cards: readonly Modillion[], ids: readonly string[]): Modillion[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkModillionShelf(cards: readonly Modillion[], ids: readonly string[]): Modillion[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkModillionTag(cards: readonly Modillion[], ids: readonly string[]): Modillion[] {
  return bulk(cards, ids, (card) => (card.tags.includes("m") ? card : { ...card, tags: tagsOf([...card.tags, "m"]), audit: "tag" }));
}

export function readModillionViews(raw: unknown): ModillionView[] {
  if (!Array.isArray(raw)) return [];
  const out: ModillionView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ModillionView>;
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

export function addModillionView(views: readonly ModillionView[], view: ModillionView): ModillionView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readModillionViews([...views, { ...view, name }]);
}

export function dropModillionView(views: readonly ModillionView[], id: string): ModillionView[] {
  return views.filter((view) => view.id !== id);
}

export function modillionDensity(raw: unknown): ModillionDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortModillionList(cards: readonly Modillion[], sort: ModillionSort): Modillion[] {
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

export function visibleModillionList(
  cards: readonly Modillion[],
  rack: ModillionRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Modillion[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : modillionBed(bed);
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

/** Corbel at depth two, still not raised and not on the shelf, is overdue. */
export function overdueModillion(card: Modillion): boolean {
  return card.profile === "corbel" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth two, and still on the yard. */
export function idleModillion(card: Modillion): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Champagne, fourteen hours, and a full depth, still off the shelf. */
export function briskModillion(card: Modillion): boolean {
  return card.bed === "CHAMPAGNE" && card.hour === 14 && card.depth === 8 && !card.shelved;
}

/** Ancone, graphite, and six hours. */
export function restingModillion(card: Modillion): boolean {
  return card.profile === "ancone" && card.bed === "GRAPHITE" && card.hour === 6;
}

/** A modillion bracket is late when the station is already corbel. */
export function lateModillion(card: Modillion, station: string): boolean {
  return card.profile === "modillion" && profilePoint(station) === "corbel" && !card.raised;
}

export function modillionCounts(cards: readonly Modillion[], shown: readonly Modillion[], station: string): ModillionCounts {
  return {
    yard: cards.filter((card) => inRack(card, "yard")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 14).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleModillion).length,
    brisk: cards.filter(briskModillion).length,
    resting: cards.filter(restingModillion).length,
    overdue: cards.filter(overdueModillion).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateModillion(card, station)).length,
  };
}

export function modillionBars(cards: readonly Modillion[]): { profile: string; count: number }[] {
  return MDL_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function modillionTimeline(cards: readonly Modillion[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "yard"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function modillionHands(cards: readonly Modillion[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Modillion[]): string {
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of modillionHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderModillionList(cards: readonly Modillion[]): string[] {
  return cards.filter(overdueModillion).map((card) => card.title);
}

export function modillionCopy(card: Modillion): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function modillionCsv(cards: readonly Modillion[], station: string): string {
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
        lateModillion(card, station) ? "1" : "0",
        idleModillion(card) ? "1" : "0",
        briskModillion(card) ? "1" : "0",
        restingModillion(card) ? "1" : "0",
        overdueModillion(card) ? "1" : "0",
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

export const GUT_HIDE_KEY = "crmv4-gutta-hide-392";
export const GUT_REVIEW_KEY = "crmv4-gutta-review-392";

export type GuttaLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type GuttaHue = "" | "gilt" | "ash" | "pearl";
export type GuttaState = "" | "clear" | "set";
export type GuttaReview = "all" | "reviewed" | "fresh";
export type GuttaShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type GuttaValue = string | { firstName?: unknown; [key: string]: unknown } | null | undefined;
export type GuttaRow = { id: string; label: string; code: GuttaValue; userId?: string };
export type GuttaLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const DUE_TITLES = new Set(["LIVE", "NOW", "DUE", "TODAY"]);
const SOON_TITLES = new Set(["NEAR", "SOON", "WEEK"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "REST"]);
const LATE_TITLES = new Set(["LATE", "AGED"]);
const MISSED_TITLES = new Set(["MISS", "GONE", "VOID", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function guttaRecord(raw: GuttaValue): { firstName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function guttaBlocked(raw: GuttaValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function guttaGiven(raw: GuttaValue): string {
  const row = guttaRecord(raw);
  if (row && !("firstName" in row)) return "";
  const value = row ? row.firstName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function guttaReadable(raw: GuttaValue): boolean {
  if (guttaBlocked(raw)) return false;
  const row = guttaRecord(raw);
  if (row && !("firstName" in row)) return false;
  return true;
}

function isoAt(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(text)) return null;
  const at = Date.parse(text);
  return Number.isNaN(at) ? null : at;
}

function dayStart(ms: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function guttaState(raw: GuttaValue): GuttaState {
  if (!guttaReadable(raw)) return "";
  return guttaGiven(raw) ? "set" : "clear";
}

/** A known first name maps first. A date today is due. Within three days ahead is soon. Further ahead is far.
 * Younger than five days past is late. Older is missed.
 * A mark of ten characters or more is far. A mark that starts with a digit is due. A mark that starts with a vowel is soon. Anything else holds.
 */
export function guttaLane(raw: GuttaValue, now = Date.now()): GuttaLane {
  if (guttaState(raw) !== "set") return "";
  const text = guttaGiven(raw);
  const upper = text.toUpperCase();
  if (DUE_TITLES.has(upper)) return "due";
  if (SOON_TITLES.has(upper)) return "soon";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (LATE_TITLES.has(upper)) return "late";
  if (MISSED_TITLES.has(upper)) return "missed";
  if (BLANK_TITLES.has(upper)) return "blank";
  const at = isoAt(text);
  if (at !== null) {
    const day = 86400000;
    const diff = dayStart(at) - dayStart(now);
    if (diff === 0) return "due";
    if (diff > 0 && diff <= 3 * day) return "soon";
    if (diff > 3 * day) return "far";
    if (now - at < 5 * day) return "late";
    return "missed";
  }
  if (text.length >= 10) return "far";
  if (/^[0-9]/.test(text)) return "due";
  if (/^[aeiou]/i.test(text)) return "soon";
  return "hold";
}

export function guttaHue(raw: GuttaValue, now = Date.now()): GuttaHue {
  const mail = guttaLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ash";
  return "pearl";
}

export function guttaLit(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "due";
}

export function guttaNear(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "soon";
}

export function guttaFar(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "far";
}

export function guttaFade(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "late";
}

export function guttaDark(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "missed";
}

export function guttaDim(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "hold";
}

export function guttaBlank(raw: GuttaValue, now = Date.now()): boolean {
  return guttaLane(raw, now) === "blank";
}

export function guttaOpen(raw: GuttaValue): boolean {
  return guttaState(raw) === "clear";
}

export function guttaLength(raw: GuttaValue): number | null {
  if (guttaState(raw) !== "set") return null;
  return guttaGiven(raw).length;
}

export function guttaEven(raw: GuttaValue): boolean {
  const length = guttaLength(raw);
  return length !== null && length % 2 === 0;
}

export function guttaDigit(raw: GuttaValue): boolean {
  return /[0-9]/.test(guttaGiven(raw));
}

export function guttaLetter(raw: GuttaValue): boolean {
  return /[A-Za-z]/.test(guttaGiven(raw));
}

export function guttaUpper(raw: GuttaValue): boolean {
  const text = guttaGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function guttaCopy(raw: GuttaValue): string {
  return guttaGiven(raw);
}

export function guttaStamp(raw: GuttaValue): string {
  const text = guttaGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function guttaLanes(rows: readonly GuttaRow[], now = Date.now()): GuttaLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = guttaLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingGutta(rows: readonly GuttaRow[], now = Date.now()): string {
  const lines = guttaLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingGuttaHue(rows: readonly GuttaRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = guttaHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneGuttaCount(rows: readonly GuttaRow[], mail: GuttaLane, now = Date.now()): number {
  return rows.filter((row) => guttaLane(row.code, now) === mail).length;
}

export function guttaShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGuttaLanes(rows: readonly GuttaRow[], now = Date.now()): string[] {
  return guttaLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenGutta(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGutta(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGutta(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleGuttaReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGuttaReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGuttaLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: GuttaValue, shape: GuttaShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return guttaOpen(raw);
  if (shape === "digit") return guttaDigit(raw);
  if (shape === "letter") return guttaLetter(raw);
  if (shape === "even") return guttaEven(raw);
  if (shape === "upper") return guttaUpper(raw);
  return guttaLane(raw, now) === shape;
}

export function visibleGutta(
  rows: readonly GuttaRow[],
  mail: string,
  hue: string,
  query: string,
  review: GuttaReview,
  reviewed: readonly string[],
  shape: GuttaShape,
  now = Date.now(),
): GuttaRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = guttaLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && guttaHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${guttaCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function guttaLanesCsv(rows: readonly GuttaRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of guttaLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function guttaRowsCsv(rows: readonly GuttaRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,firstName,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(guttaCopy(row.code)), guttaLane(row.code, now), guttaHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
