/**
 * Architrave courses kept in this browser,
 * and proscenium plates read the account type already stored on the account.
 * Orders are architrave, impluvium, lararium, and squinch. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 7, 11, or 18. Depths are 4, 7, or 11.
 * Architrave and impluvium are the warm half. Lararium and squinch are the cool half.
 * Graphite is the quiet ground.
 * STANDARD and VIP are live. WAIT, REST, PARK, and PAUSE hold. STOP, VOID, DENY, NO, BLOCK, OFF, and HALT are shut.
 * NONE, BLANK, EMPTY, and CLEAR stay blank.
 * A TYPE- mark of seven letters is a code. A TYPE- mark of fourteen letters or more is long. Other TYPE- marks stay live.
 * Four letters are a code. Two letters or fewer are short. Twenty letters or more are long. Anything else holds.
 * A true account-type mark reads as STANDARD. A false mark reads as OFF.
 * The secret is not read. Money fields are not read. The plate does not change the saved account type.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_architrave_course (
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
 * CREATE TABLE crm_proscenium_type_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_proscenium_type_review (
 *   trader_id text primary key
 * );
 */


export const ARC_KEY = "crmv4-architrave-410";
export const ARC_VIEW_KEY = "crmv4-architrave-views-410";
export const ARC_DENSITY_KEY = "crmv4-architrave-density-410";
export const ARC_PROFILES = ["architrave", "impluvium", "lararium", "squinch"] as const;

export type ArchitraveProfile = (typeof ARC_PROFILES)[number];
export type ArchitraveBed = "blank" | "ivory" | "graphite" | "gilt";
export type ArchitraveRack = "base" | "press" | "shelf";
export type ArchitraveDensity = "open" | "tight";
export type ArchitraveSort = "profile" | "hand";

export type Architrave = {
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

export type ArchitraveView = {
  id: string;
  name: string;
  rack: ArchitraveRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type ArchitraveCounts = {
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

export const ROUND410_FEATURES = [
  "architrave-save",
  "architrave-reminders",
  "architrave-orders",
  "architrave-search",
  "architrave-hour-sla",
  "architrave-case",
  "architrave-pin",
  "architrave-inline-title",
  "architrave-filters",
  "saved-architrave-views",
  "architrave-density",
  "architrave-focus",
  "architrave-kpis",
  "architrave-chart",
  "architrave-timeline",
  "architrave-bulk",
  "architrave-csv",
  "architrave-keys",
  "architrave-audit",
  "quietest-architrave-hand",
  "architrave-viewer",
  "suggest-architrave",
  "overdue-architrave",
  "proscenium-panels",
  "proscenium-type-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 7, 11, 18] as const;
const DEPTH_CYCLE = [4, 7, 11] as const;
const WARM = new Set(["architrave", "impluvium"]);
const COOL = new Set(["lararium", "squinch"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): ArchitraveRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<ArchitraveBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<ArchitraveBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ar]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Architrave, rack: ArchitraveRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return ARC_PROFILES.indexOf(profile as ArchitraveProfile);
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
  return (ARC_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 7, 11, or 18. Anything else stays blank. */
export function architraveHour(raw: unknown): 2 | 7 | 11 | 18 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "7" && text !== "11" && text !== "18") return null;
  return Number(text) as 2 | 7 | 11 | 18;
}

/** A depth is 4, 7, or 11. Anything else stays blank. */
export function depthCount(raw: unknown): 4 | 7 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "7" && text !== "11") return null;
  return Number(text) as 4 | 7 | 11;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function architraveBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Architrave is first. Impluvium is second. Lararium is third. Squinch is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "architrave") return "first";
  if (text === "impluvium") return "second";
  if (text === "lararium") return "third";
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
  return QUIET_BED.has(architraveBed(bed));
}

/** A pair depth is 7. Four and eleven are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 7;
}

/** A full depth is 11. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 11;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = architraveHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = architraveBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveArchitraveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestArchitraveBed(cards: readonly Architrave[]): string {
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

/** Before two, suggest two. Before seven, suggest seven. Before eleven, suggest eleven. Later, suggest eighteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestArchitraveHour(cards: readonly Architrave[], hour: number): 2 | 7 | 11 | 18 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 7 | 11 | 18 = 2;
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
  if (hour < 7) return 7;
  if (hour < 11) return 11;
  return 18;
}

export function suggestProfile(hour: number): ArchitraveProfile {
  if (hour < 2) return "architrave";
  if (hour < 7) return "impluvium";
  if (hour < 11) return "lararium";
  return "squinch";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Architrave[], roster: string): string {
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

export function readArchitraveList(raw: unknown): Architrave[] {
  if (!Array.isArray(raw)) return [];
  const out: Architrave[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Architrave>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: architraveHour(row.hour),
      bed: architraveBed(row.bed),
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

export function addArchitrave(
  cards: readonly Architrave[],
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
): Architrave[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readArchitraveList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: architraveHour(card.hour),
      bed: architraveBed(card.bed),
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

function mapCard(cards: readonly Architrave[], id: string, edit: (card: Architrave) => Architrave): Architrave[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editArchitrave(cards: readonly Architrave[], id: string, title: string): Architrave[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editArchitraveNote(cards: readonly Architrave[], id: string, note: string): Architrave[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(architraveBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setArchitraveBed(cards: readonly Architrave[], id: string, bed: string): Architrave[] {
  const next = architraveBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setArchitraveRaised(cards: readonly Architrave[], id: string, raised: boolean): Architrave[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setArchitraveRack(cards: readonly Architrave[], id: string, pressed: boolean): Architrave[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setArchitraveShelf(cards: readonly Architrave[], id: string, shelved: boolean): Architrave[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setArchitravePin(cards: readonly Architrave[], id: string, pinned: boolean): Architrave[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addArchitraveTag(cards: readonly Architrave[], id: string, tag: string): Architrave[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 7 | 11 | 18 {
  if (hour === null) return dir > 0 ? 2 : 18;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 4 | 7 | 11 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setArchitraveFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackArchitraveFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return setArchitraveRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinArchitraveFocused(cards: readonly Architrave[], id: string): Architrave[] {
  return setArchitravePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Architrave[], id: string): Architrave[] {
  const card = cards.find((item) => item.id === id);
  return card ? setArchitraveBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Architrave[], ids: readonly string[], edit: (card: Architrave) => Architrave): Architrave[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkArchitraveLinen(cards: readonly Architrave[], ids: readonly string[]): Architrave[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkArchitraveRaise(cards: readonly Architrave[], ids: readonly string[]): Architrave[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkArchitraveShelf(cards: readonly Architrave[], ids: readonly string[]): Architrave[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkArchitraveTag(cards: readonly Architrave[], ids: readonly string[]): Architrave[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readArchitraveViews(raw: unknown): ArchitraveView[] {
  if (!Array.isArray(raw)) return [];
  const out: ArchitraveView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArchitraveView>;
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

export function addArchitraveView(views: readonly ArchitraveView[], view: ArchitraveView): ArchitraveView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readArchitraveViews([...views, { ...view, name }]);
}

export function dropArchitraveView(views: readonly ArchitraveView[], id: string): ArchitraveView[] {
  return views.filter((view) => view.id !== id);
}

export function architraveDensity(raw: unknown): ArchitraveDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortArchitraveList(cards: readonly Architrave[], sort: ArchitraveSort): Architrave[] {
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

export function visibleArchitraveList(
  cards: readonly Architrave[],
  rack: ArchitraveRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Architrave[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : architraveBed(bed);
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

/** A squinch at depth four, still not raised and not shelved, is overdue. */
export function overdueArchitrave(card: Architrave): boolean {
  return card.profile === "squinch" && card.depth === 4 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth four, and still on the yard. */
export function idleArchitrave(card: Architrave): boolean {
  return !card.bed && card.hour === 2 && card.depth === 4 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, eighteen hours, and a full depth, still off the shelf. */
export function briskArchitrave(card: Architrave): boolean {
  return card.bed === "GRAPHITE" && card.hour === 18 && card.depth === 11 && !card.shelved;
}

/** Lararium, ivory, and seven hours. */
export function restingArchitrave(card: Architrave): boolean {
  return card.profile === "lararium" && card.bed === "IVORY" && card.hour === 7;
}

/** An architrave is late when the station is already squinch. */
export function lateArchitrave(card: Architrave, station: string): boolean {
  return card.profile === "architrave" && profilePoint(station) === "squinch" && !card.raised;
}

export function architraveCounts(cards: readonly Architrave[], shown: readonly Architrave[], station: string): ArchitraveCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 18).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleArchitrave).length,
    brisk: cards.filter(briskArchitrave).length,
    resting: cards.filter(restingArchitrave).length,
    overdue: cards.filter(overdueArchitrave).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateArchitrave(card, station)).length,
  };
}

export function architraveBars(cards: readonly Architrave[]): { profile: string; count: number }[] {
  return ARC_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function architraveTimeline(cards: readonly Architrave[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function architraveHands(cards: readonly Architrave[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Architrave[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of architraveHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderArchitraveList(cards: readonly Architrave[]): string[] {
  return cards.filter(overdueArchitrave).map((card) => card.title);
}

export function architraveCopy(card: Architrave): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function architraveCsv(cards: readonly Architrave[], station: string): string {
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
        lateArchitrave(card, station) ? "1" : "0",
        idleArchitrave(card) ? "1" : "0",
        briskArchitrave(card) ? "1" : "0",
        restingArchitrave(card) ? "1" : "0",
        overdueArchitrave(card) ? "1" : "0",
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


export const PSC_HIDE_KEY = "crmv4-proscenium-hide-410";
export const PSC_REVIEW_KEY = "crmv4-proscenium-review-410";

export type ProsceniumLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type ProsceniumHue = "" | "gilt" | "ash" | "pearl";
export type ProsceniumState = "" | "clear" | "set";
export type ProsceniumReview = "all" | "reviewed" | "fresh";
export type ProsceniumShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type ProsceniumValue = string | { accountType?: unknown; [key: string]: unknown } | null | undefined;
export type ProsceniumRow = { id: string; label: string; code: ProsceniumValue; userId?: string };
export type ProsceniumLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["STANDARD", "VIP"]);
const HOLD_TITLES = new Set(["WAIT", "REST", "PARK", "PAUSE"]);
const SHUT_TITLES = new Set(["STOP", "VOID", "DENY", "NO", "BLOCK", "OFF", "HALT"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function prosceniumRecord(raw: ProsceniumValue): { accountType?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function prosceniumBlocked(raw: ProsceniumValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function prosceniumGiven(raw: ProsceniumValue): string {
  const row = prosceniumRecord(raw);
  if (row && !("accountType" in row)) return "";
  const value = row ? row.accountType : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "STANDARD";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function prosceniumReadable(raw: ProsceniumValue): boolean {
  if (prosceniumBlocked(raw)) return false;
  const row = prosceniumRecord(raw);
  if (row && !("accountType" in row)) return false;
  return true;
}


export function prosceniumSlice(raw: unknown): ProsceniumValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("accountType" in row)) return { accountType: "" };
  const value = row.accountType;
  if (typeof value === "string") return { accountType: snip(value, 48) };
  return { accountType: value as never };
}

export function prosceniumState(raw: ProsceniumValue): ProsceniumState {
  if (!prosceniumReadable(raw)) return "";
  return prosceniumGiven(raw) ? "set" : "clear";
}

/** Word marks win first. STANDARD and VIP are live. WAIT, REST, PARK, and PAUSE hold. STOP, VOID, DENY, NO, BLOCK, OFF, and HALT are shut. NONE, BLANK, EMPTY, and CLEAR stay blank. A TYPE- mark of seven letters is a code. A TYPE- mark of fourteen letters or more is long. Any other TYPE- mark is live. Four letters are a code. Two letters or fewer are short. Twenty letters or more are long. Anything else holds. */
export function prosceniumLane(raw: ProsceniumValue): ProsceniumLane {
  if (prosceniumState(raw) !== "set") return "";
  const text = prosceniumGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("TYPE-") && text.length === 7) return "code";
  if (upper.startsWith("TYPE-") && text.length >= 14) return "long";
  if (upper.startsWith("TYPE-")) return "live";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 20) return "long";
  return "hold";
}

export function prosceniumHue(raw: ProsceniumValue): ProsceniumHue {
  const mail = prosceniumLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function prosceniumLit(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "live";
}

export function prosceniumNear(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "code";
}

export function prosceniumFar(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "short";
}

export function prosceniumFade(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "long";
}

export function prosceniumDark(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "shut";
}

export function prosceniumDim(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "hold";
}

export function prosceniumBlank(raw: ProsceniumValue): boolean {
  return prosceniumLane(raw) === "blank";
}

export function prosceniumOpen(raw: ProsceniumValue): boolean {
  return prosceniumState(raw) === "clear";
}

export function prosceniumLength(raw: ProsceniumValue): number | null {
  if (prosceniumState(raw) !== "set") return null;
  return prosceniumGiven(raw).length;
}

export function prosceniumEven(raw: ProsceniumValue): boolean {
  const length = prosceniumLength(raw);
  return length !== null && length % 2 === 0;
}

export function prosceniumDigit(raw: ProsceniumValue): boolean {
  return /[0-9]/.test(prosceniumGiven(raw));
}

export function prosceniumLetter(raw: ProsceniumValue): boolean {
  return /[A-Za-z]/.test(prosceniumGiven(raw));
}

export function prosceniumUpper(raw: ProsceniumValue): boolean {
  const text = prosceniumGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function prosceniumCopy(raw: ProsceniumValue): string {
  return prosceniumGiven(raw);
}

export function prosceniumStamp(raw: ProsceniumValue): string {
  const text = prosceniumGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function prosceniumLanes(rows: readonly ProsceniumRow[]): ProsceniumLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = prosceniumLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingProscenium(rows: readonly ProsceniumRow[]): string {
  const lines = prosceniumLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingProsceniumHue(rows: readonly ProsceniumRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = prosceniumHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneProsceniumCount(rows: readonly ProsceniumRow[], mail: ProsceniumLane): number {
  return rows.filter((row) => prosceniumLane(row.code) === mail).length;
}

export function prosceniumShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentProsceniumLanes(rows: readonly ProsceniumRow[]): string[] {
  return prosceniumLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenProscenium(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedProscenium(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleProscenium(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleProsceniumReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkProsceniumReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleProsceniumLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: ProsceniumValue, shape: ProsceniumShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return prosceniumOpen(raw);
  if (shape === "digit") return prosceniumDigit(raw);
  if (shape === "letter") return prosceniumLetter(raw);
  if (shape === "even") return prosceniumEven(raw);
  if (shape === "upper") return prosceniumUpper(raw);
  return prosceniumLane(raw) === shape;
}

export function visibleProscenium(
  rows: readonly ProsceniumRow[],
  mail: string,
  hue: string,
  query: string,
  review: ProsceniumReview,
  reviewed: readonly string[],
  shape: ProsceniumShape,
): ProsceniumRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = prosceniumLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && prosceniumHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${prosceniumCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function prosceniumLanesCsv(rows: readonly ProsceniumRow[]): string {
  const lines = ["lane,count"];
  for (const line of prosceniumLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function prosceniumRowsCsv(rows: readonly ProsceniumRow[], reviewed: readonly string[]): string {
  const lines = ["name,type,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(prosceniumCopy(row.code)), prosceniumLane(row.code), prosceniumHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
