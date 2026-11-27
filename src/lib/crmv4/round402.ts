/**
 * Rinceau courses kept in this browser,
 * and ovolo plates read the balance-adjustment grant already stored on the account.
 * Orders are rinceau, acanthus, waterleaf, and rosette. Grounds are ivory, graphite, and gilt.
 * Hours are 4, 8, 11, or 16. Depths are 4, 8, or 11.
 * Rinceau and acanthus are the warm half. Waterleaf and rosette are the cool half.
 * Graphite is the quiet ground.
 * ALLOW, YES, OPEN, and ON are grants. OFF, VOID, SHUT, DENY, and NO are shut.
 * HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Three letters are a code. One letter is short. Ten letters or more are long. Anything else holds.
 * A true grant reads as ALLOW. A false grant reads as OFF.
 * Money fields are not read. The plate does not change the saved grant.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_rinceau_course (
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
 * CREATE TABLE crm_ovolo_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_ovolo_mark_review (
 *   trader_id text primary key
 * );
 */
export const RNC_KEY = "crmv4-rinceau-402";
export const RNC_VIEW_KEY = "crmv4-rinceau-views-402";
export const RNC_DENSITY_KEY = "crmv4-rinceau-density-402";
export const RNC_PROFILES = ["rinceau", "acanthus", "waterleaf", "rosette"] as const;

export type RinceauProfile = (typeof RNC_PROFILES)[number];
export type RinceauBed = "blank" | "ivory" | "graphite" | "gilt";
export type RinceauRack = "base" | "press" | "shelf";
export type RinceauDensity = "open" | "tight";
export type RinceauSort = "profile" | "hand";

export type Rinceau = {
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

export type RinceauView = {
  id: string;
  name: string;
  rack: RinceauRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type RinceauCounts = {
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

export const ROUND402_FEATURES = [
  "rinceau-save",
  "rinceau-reminders",
  "rinceau-orders",
  "rinceau-search",
  "rinceau-hour-sla",
  "rinceau-case",
  "rinceau-pin",
  "rinceau-inline-title",
  "rinceau-filters",
  "saved-rinceau-views",
  "rinceau-density",
  "rinceau-focus",
  "rinceau-kpis",
  "rinceau-chart",
  "rinceau-timeline",
  "rinceau-bulk",
  "rinceau-csv",
  "rinceau-keys",
  "rinceau-audit",
  "quietest-rinceau-hand",
  "rinceau-viewer",
  "suggest-rinceau",
  "overdue-rinceau",
  "ovolo-panels",
  "ovolo-grant-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [4, 8, 11, 16] as const;
const DEPTH_CYCLE = [4, 8, 11] as const;
const WARM = new Set(["rinceau", "acanthus"]);
const COOL = new Set(["waterleaf", "rosette"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): RinceauRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<RinceauBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<RinceauBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[rw]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Rinceau, rack: RinceauRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return RNC_PROFILES.indexOf(profile as RinceauProfile);
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
  return (RNC_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 11, or 16. Anything else stays blank. */
export function rinceauHour(raw: unknown): 4 | 8 | 11 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "11" && text !== "16") return null;
  return Number(text) as 4 | 8 | 11 | 16;
}

/** A depth is 4, 8, or 11. Anything else stays blank. */
export function depthCount(raw: unknown): 4 | 8 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "11") return null;
  return Number(text) as 4 | 8 | 11;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function rinceauBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Rinceau is first. Acanthus is second. Waterleaf is third. Rosette is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "rinceau") return "first";
  if (text === "acanthus") return "second";
  if (text === "waterleaf") return "third";
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
  return QUIET_BED.has(rinceauBed(bed));
}

/** A pair depth is 8. Four and eleven are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 8;
}

/** A full depth is 11. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 11;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = rinceauHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = rinceauBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveRinceauFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestRinceauBed(cards: readonly Rinceau[]): string {
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

/** Before eight, suggest four. Before twelve, suggest eight. Before sixteen, suggest eleven. Later, suggest sixteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestRinceauHour(cards: readonly Rinceau[], hour: number): 4 | 8 | 11 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 11 | 16 = 4;
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
  if (hour < 16) return 11;
  return 16;
}

export function suggestProfile(hour: number): RinceauProfile {
  if (hour < 8) return "rinceau";
  if (hour < 12) return "acanthus";
  if (hour < 16) return "waterleaf";
  return "rosette";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Rinceau[], roster: string): string {
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

export function readRinceauList(raw: unknown): Rinceau[] {
  if (!Array.isArray(raw)) return [];
  const out: Rinceau[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Rinceau>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: rinceauHour(row.hour),
      bed: rinceauBed(row.bed),
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

export function addRinceau(
  cards: readonly Rinceau[],
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
): Rinceau[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readRinceauList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: rinceauHour(card.hour),
      bed: rinceauBed(card.bed),
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

function mapCard(cards: readonly Rinceau[], id: string, edit: (card: Rinceau) => Rinceau): Rinceau[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editRinceau(cards: readonly Rinceau[], id: string, title: string): Rinceau[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editRinceauNote(cards: readonly Rinceau[], id: string, note: string): Rinceau[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(rinceauBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setRinceauBed(cards: readonly Rinceau[], id: string, bed: string): Rinceau[] {
  const next = rinceauBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setRinceauRaised(cards: readonly Rinceau[], id: string, raised: boolean): Rinceau[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setRinceauRack(cards: readonly Rinceau[], id: string, pressed: boolean): Rinceau[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setRinceauShelf(cards: readonly Rinceau[], id: string, shelved: boolean): Rinceau[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setRinceauPin(cards: readonly Rinceau[], id: string, pinned: boolean): Rinceau[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addRinceauTag(cards: readonly Rinceau[], id: string, tag: string): Rinceau[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 4 | 8 | 11 | 16 {
  if (hour === null) return dir > 0 ? 4 : 16;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 4 | 8 | 11 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setRinceauFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackRinceauFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return setRinceauRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinRinceauFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  return setRinceauPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Rinceau[], id: string): Rinceau[] {
  const card = cards.find((item) => item.id === id);
  return card ? setRinceauBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Rinceau[], ids: readonly string[], edit: (card: Rinceau) => Rinceau): Rinceau[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkRinceauLinen(cards: readonly Rinceau[], ids: readonly string[]): Rinceau[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkRinceauRaise(cards: readonly Rinceau[], ids: readonly string[]): Rinceau[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkRinceauShelf(cards: readonly Rinceau[], ids: readonly string[]): Rinceau[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkRinceauTag(cards: readonly Rinceau[], ids: readonly string[]): Rinceau[] {
  return bulk(cards, ids, (card) => (card.tags.includes("w") ? card : { ...card, tags: tagsOf([...card.tags, "w"]), audit: "tag" }));
}

export function readRinceauViews(raw: unknown): RinceauView[] {
  if (!Array.isArray(raw)) return [];
  const out: RinceauView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RinceauView>;
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

export function addRinceauView(views: readonly RinceauView[], view: RinceauView): RinceauView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readRinceauViews([...views, { ...view, name }]);
}

export function dropRinceauView(views: readonly RinceauView[], id: string): RinceauView[] {
  return views.filter((view) => view.id !== id);
}

export function rinceauDensity(raw: unknown): RinceauDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortRinceauList(cards: readonly Rinceau[], sort: RinceauSort): Rinceau[] {
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

export function visibleRinceauList(
  cards: readonly Rinceau[],
  rack: RinceauRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Rinceau[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : rinceauBed(bed);
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

/** Rosette at depth four, still not raised and not shelved, is overdue. */
export function overdueRinceau(card: Rinceau): boolean {
  return card.profile === "rosette" && card.depth === 4 && !card.raised && !card.shelved;
}

/** No ground, hour four, depth four, and still on the yard. */
export function idleRinceau(card: Rinceau): boolean {
  return !card.bed && card.hour === 4 && card.depth === 4 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, sixteen hours, and a full depth, still off the shelf. */
export function briskRinceau(card: Rinceau): boolean {
  return card.bed === "GRAPHITE" && card.hour === 16 && card.depth === 11 && !card.shelved;
}

/** Waterleaf, ivory, and eight hours. */
export function restingRinceau(card: Rinceau): boolean {
  return card.profile === "waterleaf" && card.bed === "IVORY" && card.hour === 8;
}

/** A rinceau is late when the station is already rosette. */
export function lateRinceau(card: Rinceau, station: string): boolean {
  return card.profile === "rinceau" && profilePoint(station) === "rosette" && !card.raised;
}

export function rinceauCounts(cards: readonly Rinceau[], shown: readonly Rinceau[], station: string): RinceauCounts {
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
    idle: cards.filter(idleRinceau).length,
    brisk: cards.filter(briskRinceau).length,
    resting: cards.filter(restingRinceau).length,
    overdue: cards.filter(overdueRinceau).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateRinceau(card, station)).length,
  };
}

export function rinceauBars(cards: readonly Rinceau[]): { profile: string; count: number }[] {
  return RNC_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function rinceauTimeline(cards: readonly Rinceau[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function rinceauHands(cards: readonly Rinceau[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Rinceau[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of rinceauHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderRinceauList(cards: readonly Rinceau[]): string[] {
  return cards.filter(overdueRinceau).map((card) => card.title);
}

export function rinceauCopy(card: Rinceau): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function rinceauCsv(cards: readonly Rinceau[], station: string): string {
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
        lateRinceau(card, station) ? "1" : "0",
        idleRinceau(card) ? "1" : "0",
        briskRinceau(card) ? "1" : "0",
        restingRinceau(card) ? "1" : "0",
        overdueRinceau(card) ? "1" : "0",
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


export const OVL_HIDE_KEY = "crmv4-ovolo-hide-402";
export const OVL_REVIEW_KEY = "crmv4-ovolo-review-402";

export type OvoloLane = "" | "allow" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type OvoloHue = "" | "gilt" | "ash" | "pearl";
export type OvoloState = "" | "clear" | "set";
export type OvoloReview = "all" | "reviewed" | "fresh";
export type OvoloShape = "all" | "allow" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type OvoloValue = string | { canAdjustBalance?: unknown; [key: string]: unknown } | null | undefined;
export type OvoloRow = { id: string; label: string; code: OvoloValue; userId?: string };
export type OvoloLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["allow", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["ALLOW", "YES", "OPEN", "ON"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function ovoloRecord(raw: OvoloValue): { canAdjustBalance?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function ovoloBlocked(raw: OvoloValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function ovoloGiven(raw: OvoloValue): string {
  const row = ovoloRecord(raw);
  if (row && !("canAdjustBalance" in row)) return "";
  const value = row ? row.canAdjustBalance : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ALLOW";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function ovoloReadable(raw: OvoloValue): boolean {
  if (ovoloBlocked(raw)) return false;
  const row = ovoloRecord(raw);
  if (row && !("canAdjustBalance" in row)) return false;
  return true;
}


export function ovoloSlice(raw: unknown): OvoloValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("canAdjustBalance" in row)) return { canAdjustBalance: "" };
  const value = row.canAdjustBalance;
  if (typeof value === "string") return { canAdjustBalance: snip(value, 48) };
  return { canAdjustBalance: value as never };
}

export function ovoloState(raw: OvoloValue): OvoloState {
  if (!ovoloReadable(raw)) return "";
  return ovoloGiven(raw) ? "set" : "clear";
}

/** Word marks win first. ALLOW, YES, OPEN, and ON are grants. OFF, VOID, SHUT, DENY, and NO are shut. HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank. Three letters are a code. One letter is short. Ten letters or more are long. Anything else holds. */
export function ovoloLane(raw: OvoloValue): OvoloLane {
  if (ovoloState(raw) !== "set") return "";
  const text = ovoloGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "allow";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[A-Za-z]{3}$/.test(text)) return "code";
  if (text.length <= 1) return "short";
  if (text.length >= 10) return "long";
  return "hold";
}

export function ovoloHue(raw: OvoloValue): OvoloHue {
  const mail = ovoloLane(raw);
  if (!mail) return "";
  if (mail === "allow") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function ovoloLit(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "allow";
}

export function ovoloNear(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "code";
}

export function ovoloFar(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "short";
}

export function ovoloFade(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "long";
}

export function ovoloDark(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "shut";
}

export function ovoloDim(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "hold";
}

export function ovoloBlank(raw: OvoloValue): boolean {
  return ovoloLane(raw) === "blank";
}

export function ovoloOpen(raw: OvoloValue): boolean {
  return ovoloState(raw) === "clear";
}

export function ovoloLength(raw: OvoloValue): number | null {
  if (ovoloState(raw) !== "set") return null;
  return ovoloGiven(raw).length;
}

export function ovoloEven(raw: OvoloValue): boolean {
  const length = ovoloLength(raw);
  return length !== null && length % 2 === 0;
}

export function ovoloDigit(raw: OvoloValue): boolean {
  return /[0-9]/.test(ovoloGiven(raw));
}

export function ovoloLetter(raw: OvoloValue): boolean {
  return /[A-Za-z]/.test(ovoloGiven(raw));
}

export function ovoloUpper(raw: OvoloValue): boolean {
  const text = ovoloGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function ovoloCopy(raw: OvoloValue): string {
  return ovoloGiven(raw);
}

export function ovoloStamp(raw: OvoloValue): string {
  const text = ovoloGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function ovoloLanes(rows: readonly OvoloRow[]): OvoloLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = ovoloLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingOvolo(rows: readonly OvoloRow[]): string {
  const lines = ovoloLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingOvoloHue(rows: readonly OvoloRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = ovoloHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneOvoloCount(rows: readonly OvoloRow[], mail: OvoloLane): number {
  return rows.filter((row) => ovoloLane(row.code) === mail).length;
}

export function ovoloShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentOvoloLanes(rows: readonly OvoloRow[]): string[] {
  return ovoloLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenOvolo(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedOvolo(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleOvolo(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleOvoloReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkOvoloReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleOvoloLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: OvoloValue, shape: OvoloShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return ovoloOpen(raw);
  if (shape === "digit") return ovoloDigit(raw);
  if (shape === "letter") return ovoloLetter(raw);
  if (shape === "even") return ovoloEven(raw);
  if (shape === "upper") return ovoloUpper(raw);
  return ovoloLane(raw) === shape;
}

export function visibleOvolo(
  rows: readonly OvoloRow[],
  mail: string,
  hue: string,
  query: string,
  review: OvoloReview,
  reviewed: readonly string[],
  shape: OvoloShape,
): OvoloRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = ovoloLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && ovoloHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${ovoloCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function ovoloLanesCsv(rows: readonly OvoloRow[]): string {
  const lines = ["lane,count"];
  for (const line of ovoloLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function ovoloRowsCsv(rows: readonly OvoloRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(ovoloCopy(row.code)), ovoloLane(row.code), ovoloHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
