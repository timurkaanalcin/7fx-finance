/**
 * Cymatium courses kept in this browser,
 * and fleuron plates read the referral code already stored on the account.
 * Orders are cymatium, listel, soffit, and archivolt. Grounds are ivory, graphite, and gilt.
 * Hours are 4, 8, 12, or 16. Depths are 4, 8, or 12.
 * Cymatium and listel are the warm half. Soffit and archivolt are the cool half.
 * Graphite is the quiet ground.
 * READY, OPEN, FIRM, and YES are live. OFF, VOID, SHUT, DENY, and NO are shut.
 * HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Four letters are a code. Two letters are short. Ten letters or more are long. Anything else holds.
 * A true referral mark reads as READY. A false mark reads as OFF.
 * The secret is not read. Money fields are not read. The plate does not change the saved code.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cymatium_course (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   profile text not null default '',
 *   hour_mark integer,
 *   bed text not null default '',
 *   depth integer not null default 4,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_fleuron_code_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_fleuron_code_review (
 *   trader_id text primary key
 * );
 */

export const CYM_KEY = "crmv4-cymatium-404";
export const CYM_VIEW_KEY = "crmv4-cymatium-views-404";
export const CYM_DENSITY_KEY = "crmv4-cymatium-density-404";
export const CYM_PROFILES = ["cymatium", "listel", "soffit", "archivolt"] as const;

export type CymatiumProfile = (typeof CYM_PROFILES)[number];
export type CymatiumBed = "blank" | "ivory" | "graphite" | "gilt";
export type CymatiumRack = "base" | "press" | "shelf";
export type CymatiumDensity = "open" | "tight";
export type CymatiumSort = "profile" | "hand";

export type Cymatium = {
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

export type CymatiumView = {
  id: string;
  name: string;
  rack: CymatiumRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type CymatiumCounts = {
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

export const ROUND404_FEATURES = [
  "cymatium-save",
  "cymatium-reminders",
  "cymatium-orders",
  "cymatium-search",
  "cymatium-hour-sla",
  "cymatium-case",
  "cymatium-pin",
  "cymatium-inline-title",
  "cymatium-filters",
  "saved-cymatium-views",
  "cymatium-density",
  "cymatium-focus",
  "cymatium-kpis",
  "cymatium-chart",
  "cymatium-timeline",
  "cymatium-bulk",
  "cymatium-csv",
  "cymatium-keys",
  "cymatium-audit",
  "quietest-cymatium-hand",
  "cymatium-viewer",
  "suggest-cymatium",
  "overdue-cymatium",
  "fleuron-panels",
  "fleuron-grant-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [4, 8, 12, 16] as const;
const DEPTH_CYCLE = [4, 8, 12] as const;
const WARM = new Set(["cymatium", "listel"]);
const COOL = new Set(["soffit", "archivolt"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): CymatiumRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<CymatiumBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<CymatiumBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[cf]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Cymatium, rack: CymatiumRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return CYM_PROFILES.indexOf(profile as CymatiumProfile);
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
  return (CYM_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 12, or 16. Anything else stays blank. */
export function cymatiumHour(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A depth is 4, 8, or 12. Anything else stays blank. */
export function depthCount(raw: unknown): 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 4 | 8 | 12;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function cymatiumBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Cymatium is first. Listel is second. Soffit is third. Archivolt is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "cymatium") return "first";
  if (text === "listel") return "second";
  if (text === "soffit") return "third";
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
  return QUIET_BED.has(cymatiumBed(bed));
}

/** A pair depth is 8. Four and twelve are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 8;
}

/** A full depth is 12. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 12;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = cymatiumHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = cymatiumBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveCymatiumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestCymatiumBed(cards: readonly Cymatium[]): string {
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

/** Before eight, suggest four. Before twelve, suggest eight. Before sixteen, suggest twelve. Later, suggest sixteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestCymatiumHour(cards: readonly Cymatium[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 16 = 4;
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
  if (hour < 8) return 4;
  if (hour < 12) return 8;
  if (hour < 16) return 12;
  return 16;
}

export function suggestProfile(hour: number): CymatiumProfile {
  if (hour < 8) return "cymatium";
  if (hour < 12) return "listel";
  if (hour < 16) return "soffit";
  return "archivolt";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Cymatium[], roster: string): string {
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

export function readCymatiumList(raw: unknown): Cymatium[] {
  if (!Array.isArray(raw)) return [];
  const out: Cymatium[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cymatium>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: cymatiumHour(row.hour),
      bed: cymatiumBed(row.bed),
      depth: depthCount(row.depth) ?? 4,
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

export function addCymatium(
  cards: readonly Cymatium[],
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
): Cymatium[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCymatiumList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: cymatiumHour(card.hour),
      bed: cymatiumBed(card.bed),
      depth: depthCount(card.depth) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cymatium[], id: string, edit: (card: Cymatium) => Cymatium): Cymatium[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCymatium(cards: readonly Cymatium[], id: string, title: string): Cymatium[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCymatiumNote(cards: readonly Cymatium[], id: string, note: string): Cymatium[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(cymatiumBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setCymatiumBed(cards: readonly Cymatium[], id: string, bed: string): Cymatium[] {
  const next = cymatiumBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setCymatiumRaised(cards: readonly Cymatium[], id: string, raised: boolean): Cymatium[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCymatiumRack(cards: readonly Cymatium[], id: string, pressed: boolean): Cymatium[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setCymatiumShelf(cards: readonly Cymatium[], id: string, shelved: boolean): Cymatium[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setCymatiumPin(cards: readonly Cymatium[], id: string, pinned: boolean): Cymatium[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addCymatiumTag(cards: readonly Cymatium[], id: string, tag: string): Cymatium[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 4 | 8 | 12 | 16 {
  if (hour === null) return dir > 0 ? 4 : 16;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 4 | 8 | 12 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setCymatiumFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackCymatiumFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return setCymatiumRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinCymatiumFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  return setCymatiumPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Cymatium[], id: string): Cymatium[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCymatiumBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Cymatium[], ids: readonly string[], edit: (card: Cymatium) => Cymatium): Cymatium[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCymatiumLinen(cards: readonly Cymatium[], ids: readonly string[]): Cymatium[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkCymatiumRaise(cards: readonly Cymatium[], ids: readonly string[]): Cymatium[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCymatiumShelf(cards: readonly Cymatium[], ids: readonly string[]): Cymatium[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkCymatiumTag(cards: readonly Cymatium[], ids: readonly string[]): Cymatium[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readCymatiumViews(raw: unknown): CymatiumView[] {
  if (!Array.isArray(raw)) return [];
  const out: CymatiumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CymatiumView>;
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

export function addCymatiumView(views: readonly CymatiumView[], view: CymatiumView): CymatiumView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCymatiumViews([...views, { ...view, name }]);
}

export function dropCymatiumView(views: readonly CymatiumView[], id: string): CymatiumView[] {
  return views.filter((view) => view.id !== id);
}

export function cymatiumDensity(raw: unknown): CymatiumDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCymatiumList(cards: readonly Cymatium[], sort: CymatiumSort): Cymatium[] {
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

export function visibleCymatiumList(
  cards: readonly Cymatium[],
  rack: CymatiumRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Cymatium[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : cymatiumBed(bed);
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

/** Archivolt at depth four, still not raised and not shelved, is overdue. */
export function overdueCymatium(card: Cymatium): boolean {
  return card.profile === "archivolt" && card.depth === 4 && !card.raised && !card.shelved;
}

/** No ground, hour four, depth four, and still on the yard. */
export function idleCymatium(card: Cymatium): boolean {
  return !card.bed && card.hour === 4 && card.depth === 4 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, sixteen hours, and a full depth, still off the shelf. */
export function briskCymatium(card: Cymatium): boolean {
  return card.bed === "GRAPHITE" && card.hour === 16 && card.depth === 12 && !card.shelved;
}

/** Soffit, ivory, and eight hours. */
export function restingCymatium(card: Cymatium): boolean {
  return card.profile === "soffit" && card.bed === "IVORY" && card.hour === 8;
}

/** A cymatium is late when the station is already archivolt. */
export function lateCymatium(card: Cymatium, station: string): boolean {
  return card.profile === "cymatium" && profilePoint(station) === "archivolt" && !card.raised;
}

export function cymatiumCounts(cards: readonly Cymatium[], shown: readonly Cymatium[], station: string): CymatiumCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 16).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleCymatium).length,
    brisk: cards.filter(briskCymatium).length,
    resting: cards.filter(restingCymatium).length,
    overdue: cards.filter(overdueCymatium).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateCymatium(card, station)).length,
  };
}

export function cymatiumBars(cards: readonly Cymatium[]): { profile: string; count: number }[] {
  return CYM_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function cymatiumTimeline(cards: readonly Cymatium[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function cymatiumHands(cards: readonly Cymatium[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Cymatium[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of cymatiumHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCymatiumList(cards: readonly Cymatium[]): string[] {
  return cards.filter(overdueCymatium).map((card) => card.title);
}

export function cymatiumCopy(card: Cymatium): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function cymatiumCsv(cards: readonly Cymatium[], station: string): string {
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
        lateCymatium(card, station) ? "1" : "0",
        idleCymatium(card) ? "1" : "0",
        briskCymatium(card) ? "1" : "0",
        restingCymatium(card) ? "1" : "0",
        overdueCymatium(card) ? "1" : "0",
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


export const FLR_HIDE_KEY = "crmv4-fleuron-hide-404";
export const FLR_REVIEW_KEY = "crmv4-fleuron-review-404";

export type FleuronLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type FleuronHue = "" | "gilt" | "ash" | "pearl";
export type FleuronState = "" | "clear" | "set";
export type FleuronReview = "all" | "reviewed" | "fresh";
export type FleuronShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type FleuronValue = string | { referralCodeUsed?: unknown; [key: string]: unknown } | null | undefined;
export type FleuronRow = { id: string; label: string; code: FleuronValue; userId?: string };
export type FleuronLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["READY", "OPEN", "FIRM", "YES"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function fleuronRecord(raw: FleuronValue): { referralCodeUsed?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function fleuronBlocked(raw: FleuronValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function fleuronGiven(raw: FleuronValue): string {
  const row = fleuronRecord(raw);
  if (row && !("referralCodeUsed" in row)) return "";
  const value = row ? row.referralCodeUsed : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "READY";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function fleuronReadable(raw: FleuronValue): boolean {
  if (fleuronBlocked(raw)) return false;
  const row = fleuronRecord(raw);
  if (row && !("referralCodeUsed" in row)) return false;
  return true;
}


export function fleuronSlice(raw: unknown): FleuronValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("referralCodeUsed" in row)) return { referralCodeUsed: "" };
  const value = row.referralCodeUsed;
  if (typeof value === "string") return { referralCodeUsed: snip(value, 48) };
  return { referralCodeUsed: value as never };
}

export function fleuronState(raw: FleuronValue): FleuronState {
  if (!fleuronReadable(raw)) return "";
  return fleuronGiven(raw) ? "set" : "clear";
}

/** Word marks win first. READY, OPEN, FIRM, and YES are live. OFF, VOID, SHUT, DENY, and NO are shut. HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank. Four letters are a code. Two letters are short. Ten letters or more are long. Anything else holds. */
export function fleuronLane(raw: FleuronValue): FleuronLane {
  if (fleuronState(raw) !== "set") return "";
  const text = fleuronGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 10) return "long";
  return "hold";
}

export function fleuronHue(raw: FleuronValue): FleuronHue {
  const mail = fleuronLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function fleuronLit(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "live";
}

export function fleuronNear(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "code";
}

export function fleuronFar(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "short";
}

export function fleuronFade(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "long";
}

export function fleuronDark(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "shut";
}

export function fleuronDim(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "hold";
}

export function fleuronBlank(raw: FleuronValue): boolean {
  return fleuronLane(raw) === "blank";
}

export function fleuronOpen(raw: FleuronValue): boolean {
  return fleuronState(raw) === "clear";
}

export function fleuronLength(raw: FleuronValue): number | null {
  if (fleuronState(raw) !== "set") return null;
  return fleuronGiven(raw).length;
}

export function fleuronEven(raw: FleuronValue): boolean {
  const length = fleuronLength(raw);
  return length !== null && length % 2 === 0;
}

export function fleuronDigit(raw: FleuronValue): boolean {
  return /[0-9]/.test(fleuronGiven(raw));
}

export function fleuronLetter(raw: FleuronValue): boolean {
  return /[A-Za-z]/.test(fleuronGiven(raw));
}

export function fleuronUpper(raw: FleuronValue): boolean {
  const text = fleuronGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function fleuronCopy(raw: FleuronValue): string {
  return fleuronGiven(raw);
}

export function fleuronStamp(raw: FleuronValue): string {
  const text = fleuronGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function fleuronLanes(rows: readonly FleuronRow[]): FleuronLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = fleuronLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingFleuron(rows: readonly FleuronRow[]): string {
  const lines = fleuronLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingFleuronHue(rows: readonly FleuronRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = fleuronHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneFleuronCount(rows: readonly FleuronRow[], mail: FleuronLane): number {
  return rows.filter((row) => fleuronLane(row.code) === mail).length;
}

export function fleuronShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFleuronLanes(rows: readonly FleuronRow[]): string[] {
  return fleuronLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenFleuron(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedFleuron(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFleuron(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleFleuronReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFleuronReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFleuronLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: FleuronValue, shape: FleuronShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return fleuronOpen(raw);
  if (shape === "digit") return fleuronDigit(raw);
  if (shape === "letter") return fleuronLetter(raw);
  if (shape === "even") return fleuronEven(raw);
  if (shape === "upper") return fleuronUpper(raw);
  return fleuronLane(raw) === shape;
}

export function visibleFleuron(
  rows: readonly FleuronRow[],
  mail: string,
  hue: string,
  query: string,
  review: FleuronReview,
  reviewed: readonly string[],
  shape: FleuronShape,
): FleuronRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = fleuronLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && fleuronHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${fleuronCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function fleuronLanesCsv(rows: readonly FleuronRow[]): string {
  const lines = ["lane,count"];
  for (const line of fleuronLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function fleuronRowsCsv(rows: readonly FleuronRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(fleuronCopy(row.code)), fleuronLane(row.code), fleuronHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
