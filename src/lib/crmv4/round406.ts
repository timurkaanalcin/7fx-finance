/**
 * Mullion courses kept in this browser,
 * and transom plates read the device already stored on the account.
 * Orders are mullion, jamb, lintel, and sill. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 4, 8, or 16. Depths are 2, 4, or 8.
 * Mullion and jamb are the warm half. Lintel and sill are the cool half.
 * Graphite is the quiet ground.
 * IOS, ANDROID, WINDOWS, MAC, and LINUX are live. OFF, LOCK, STOP, DENY, and NO are shut.
 * DOCK, IDLE, and REST hold. NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Four letters are a code. Two letters or fewer are short. Ten letters or more are long. Anything else holds.
 * A true device mark reads as IOS. A false mark reads as OFF.
 * The secret is not read. Money fields are not read. The plate does not change the saved code.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_mullion_course (
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
 * CREATE TABLE crm_transom_device_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_transom_device_review (
 *   trader_id text primary key
 * );
 */

export const MUL_KEY = "crmv4-mullion-406";
export const MUL_VIEW_KEY = "crmv4-mullion-views-406";
export const MUL_DENSITY_KEY = "crmv4-mullion-density-406";
export const MUL_PROFILES = ["mullion", "jamb", "lintel", "sill"] as const;

export type MullionProfile = (typeof MUL_PROFILES)[number];
export type MullionBed = "blank" | "ivory" | "graphite" | "gilt";
export type MullionRack = "base" | "press" | "shelf";
export type MullionDensity = "open" | "tight";
export type MullionSort = "profile" | "hand";

export type Mullion = {
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

export type MullionView = {
  id: string;
  name: string;
  rack: MullionRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type MullionCounts = {
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

export const ROUND406_FEATURES = [
  "mullion-save",
  "mullion-reminders",
  "mullion-orders",
  "mullion-search",
  "mullion-hour-sla",
  "mullion-case",
  "mullion-pin",
  "mullion-inline-title",
  "mullion-filters",
  "saved-mullion-views",
  "mullion-density",
  "mullion-focus",
  "mullion-kpis",
  "mullion-chart",
  "mullion-timeline",
  "mullion-bulk",
  "mullion-csv",
  "mullion-keys",
  "mullion-audit",
  "quietest-mullion-hand",
  "mullion-viewer",
  "suggest-mullion",
  "overdue-mullion",
  "transom-panels",
  "transom-device-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 4, 8, 16] as const;
const DEPTH_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["mullion", "jamb"]);
const COOL = new Set(["lintel", "sill"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): MullionRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<MullionBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<MullionBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[mu]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Mullion, rack: MullionRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return MUL_PROFILES.indexOf(profile as MullionProfile);
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
  return (MUL_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 4, 8, or 16. Anything else stays blank. */
export function mullionHour(raw: unknown): 2 | 4 | 8 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8" && text !== "16") return null;
  return Number(text) as 2 | 4 | 8 | 16;
}

/** A depth is 2, 4, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function mullionBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Mullion is first. Jamb is second. Lintel is third. Sill is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "mullion") return "first";
  if (text === "jamb") return "second";
  if (text === "lintel") return "third";
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
  return QUIET_BED.has(mullionBed(bed));
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
  const hour = mullionHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = mullionBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveMullionFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestMullionBed(cards: readonly Mullion[]): string {
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

/** Before four, suggest two. Before eight, suggest four. Before sixteen, suggest eight. Later, suggest sixteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestMullionHour(cards: readonly Mullion[], hour: number): 2 | 4 | 8 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 4 | 8 | 16 = 2;
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
  if (hour < 4) return 2;
  if (hour < 8) return 4;
  if (hour < 16) return 8;
  return 16;
}

export function suggestProfile(hour: number): MullionProfile {
  if (hour < 4) return "mullion";
  if (hour < 8) return "jamb";
  if (hour < 16) return "lintel";
  return "sill";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Mullion[], roster: string): string {
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

export function readMullionList(raw: unknown): Mullion[] {
  if (!Array.isArray(raw)) return [];
  const out: Mullion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Mullion>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: mullionHour(row.hour),
      bed: mullionBed(row.bed),
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

export function addMullion(
  cards: readonly Mullion[],
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
): Mullion[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `m${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readMullionList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: mullionHour(card.hour),
      bed: mullionBed(card.bed),
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

function mapCard(cards: readonly Mullion[], id: string, edit: (card: Mullion) => Mullion): Mullion[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editMullion(cards: readonly Mullion[], id: string, title: string): Mullion[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editMullionNote(cards: readonly Mullion[], id: string, note: string): Mullion[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(mullionBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setMullionBed(cards: readonly Mullion[], id: string, bed: string): Mullion[] {
  const next = mullionBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setMullionRaised(cards: readonly Mullion[], id: string, raised: boolean): Mullion[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setMullionRack(cards: readonly Mullion[], id: string, pressed: boolean): Mullion[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setMullionShelf(cards: readonly Mullion[], id: string, shelved: boolean): Mullion[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setMullionPin(cards: readonly Mullion[], id: string, pinned: boolean): Mullion[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addMullionTag(cards: readonly Mullion[], id: string, tag: string): Mullion[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 4 | 8 | 16 {
  if (hour === null) return dir > 0 ? 2 : 16;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setMullionFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackMullionFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return setMullionRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinMullionFocused(cards: readonly Mullion[], id: string): Mullion[] {
  return setMullionPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Mullion[], id: string): Mullion[] {
  const card = cards.find((item) => item.id === id);
  return card ? setMullionBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Mullion[], ids: readonly string[], edit: (card: Mullion) => Mullion): Mullion[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkMullionLinen(cards: readonly Mullion[], ids: readonly string[]): Mullion[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkMullionRaise(cards: readonly Mullion[], ids: readonly string[]): Mullion[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkMullionShelf(cards: readonly Mullion[], ids: readonly string[]): Mullion[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkMullionTag(cards: readonly Mullion[], ids: readonly string[]): Mullion[] {
  return bulk(cards, ids, (card) => (card.tags.includes("u") ? card : { ...card, tags: tagsOf([...card.tags, "u"]), audit: "tag" }));
}

export function readMullionViews(raw: unknown): MullionView[] {
  if (!Array.isArray(raw)) return [];
  const out: MullionView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MullionView>;
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

export function addMullionView(views: readonly MullionView[], view: MullionView): MullionView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readMullionViews([...views, { ...view, name }]);
}

export function dropMullionView(views: readonly MullionView[], id: string): MullionView[] {
  return views.filter((view) => view.id !== id);
}

export function mullionDensity(raw: unknown): MullionDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortMullionList(cards: readonly Mullion[], sort: MullionSort): Mullion[] {
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

export function visibleMullionList(
  cards: readonly Mullion[],
  rack: MullionRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Mullion[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : mullionBed(bed);
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

/** Sill at depth two, still not raised and not shelved, is overdue. */
export function overdueMullion(card: Mullion): boolean {
  return card.profile === "sill" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth two, and still on the yard. */
export function idleMullion(card: Mullion): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, sixteen hours, and a full depth, still off the shelf. */
export function briskMullion(card: Mullion): boolean {
  return card.bed === "GRAPHITE" && card.hour === 16 && card.depth === 8 && !card.shelved;
}

/** Lintel, ivory, and four hours. */
export function restingMullion(card: Mullion): boolean {
  return card.profile === "lintel" && card.bed === "IVORY" && card.hour === 4;
}

/** A mullion is late when the station is already sill. */
export function lateMullion(card: Mullion, station: string): boolean {
  return card.profile === "mullion" && profilePoint(station) === "sill" && !card.raised;
}

export function mullionCounts(cards: readonly Mullion[], shown: readonly Mullion[], station: string): MullionCounts {
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
    idle: cards.filter(idleMullion).length,
    brisk: cards.filter(briskMullion).length,
    resting: cards.filter(restingMullion).length,
    overdue: cards.filter(overdueMullion).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateMullion(card, station)).length,
  };
}

export function mullionBars(cards: readonly Mullion[]): { profile: string; count: number }[] {
  return MUL_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function mullionTimeline(cards: readonly Mullion[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function mullionHands(cards: readonly Mullion[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Mullion[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of mullionHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderMullionList(cards: readonly Mullion[]): string[] {
  return cards.filter(overdueMullion).map((card) => card.title);
}

export function mullionCopy(card: Mullion): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function mullionCsv(cards: readonly Mullion[], station: string): string {
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
        lateMullion(card, station) ? "1" : "0",
        idleMullion(card) ? "1" : "0",
        briskMullion(card) ? "1" : "0",
        restingMullion(card) ? "1" : "0",
        overdueMullion(card) ? "1" : "0",
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


export const TRM_HIDE_KEY = "crmv4-transom-hide-406";
export const TRM_REVIEW_KEY = "crmv4-transom-review-406";

export type TransomLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type TransomHue = "" | "gilt" | "ash" | "pearl";
export type TransomState = "" | "clear" | "set";
export type TransomReview = "all" | "reviewed" | "fresh";
export type TransomShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type TransomValue = string | { lastDevice?: unknown; [key: string]: unknown } | null | undefined;
export type TransomRow = { id: string; label: string; code: TransomValue; userId?: string };
export type TransomLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["IOS", "ANDROID", "WINDOWS", "MAC", "LINUX"]);
const HOLD_TITLES = new Set(["DOCK", "IDLE", "REST"]);
const SHUT_TITLES = new Set(["OFF", "LOCK", "STOP", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function transomRecord(raw: TransomValue): { lastDevice?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function transomBlocked(raw: TransomValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function transomGiven(raw: TransomValue): string {
  const row = transomRecord(raw);
  if (row && !("lastDevice" in row)) return "";
  const value = row ? row.lastDevice : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "IOS";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function transomReadable(raw: TransomValue): boolean {
  if (transomBlocked(raw)) return false;
  const row = transomRecord(raw);
  if (row && !("lastDevice" in row)) return false;
  return true;
}


export function transomSlice(raw: unknown): TransomValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("lastDevice" in row)) return { lastDevice: "" };
  const value = row.lastDevice;
  if (typeof value === "string") return { lastDevice: snip(value, 48) };
  return { lastDevice: value as never };
}

export function transomState(raw: TransomValue): TransomState {
  if (!transomReadable(raw)) return "";
  return transomGiven(raw) ? "set" : "clear";
}

/** Word marks win first. IOS, ANDROID, WINDOWS, MAC, and LINUX are live. OFF, LOCK, STOP, DENY, and NO are shut. DOCK, IDLE, and REST hold. NONE, BLANK, EMPTY, and CLEAR stay blank. Four letters are a code. Two letters or fewer are short. Ten letters or more are long. Anything else holds. */
export function transomLane(raw: TransomValue): TransomLane {
  if (transomState(raw) !== "set") return "";
  const text = transomGiven(raw);
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

export function transomHue(raw: TransomValue): TransomHue {
  const mail = transomLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function transomLit(raw: TransomValue): boolean {
  return transomLane(raw) === "live";
}

export function transomNear(raw: TransomValue): boolean {
  return transomLane(raw) === "code";
}

export function transomFar(raw: TransomValue): boolean {
  return transomLane(raw) === "short";
}

export function transomFade(raw: TransomValue): boolean {
  return transomLane(raw) === "long";
}

export function transomDark(raw: TransomValue): boolean {
  return transomLane(raw) === "shut";
}

export function transomDim(raw: TransomValue): boolean {
  return transomLane(raw) === "hold";
}

export function transomBlank(raw: TransomValue): boolean {
  return transomLane(raw) === "blank";
}

export function transomOpen(raw: TransomValue): boolean {
  return transomState(raw) === "clear";
}

export function transomLength(raw: TransomValue): number | null {
  if (transomState(raw) !== "set") return null;
  return transomGiven(raw).length;
}

export function transomEven(raw: TransomValue): boolean {
  const length = transomLength(raw);
  return length !== null && length % 2 === 0;
}

export function transomDigit(raw: TransomValue): boolean {
  return /[0-9]/.test(transomGiven(raw));
}

export function transomLetter(raw: TransomValue): boolean {
  return /[A-Za-z]/.test(transomGiven(raw));
}

export function transomUpper(raw: TransomValue): boolean {
  const text = transomGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function transomCopy(raw: TransomValue): string {
  return transomGiven(raw);
}

export function transomStamp(raw: TransomValue): string {
  const text = transomGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function transomLanes(rows: readonly TransomRow[]): TransomLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = transomLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingTransom(rows: readonly TransomRow[]): string {
  const lines = transomLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingTransomHue(rows: readonly TransomRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = transomHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneTransomCount(rows: readonly TransomRow[], mail: TransomLane): number {
  return rows.filter((row) => transomLane(row.code) === mail).length;
}

export function transomShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTransomLanes(rows: readonly TransomRow[]): string[] {
  return transomLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenTransom(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTransom(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTransom(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleTransomReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTransomReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTransomLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: TransomValue, shape: TransomShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return transomOpen(raw);
  if (shape === "digit") return transomDigit(raw);
  if (shape === "letter") return transomLetter(raw);
  if (shape === "even") return transomEven(raw);
  if (shape === "upper") return transomUpper(raw);
  return transomLane(raw) === shape;
}

export function visibleTransom(
  rows: readonly TransomRow[],
  mail: string,
  hue: string,
  query: string,
  review: TransomReview,
  reviewed: readonly string[],
  shape: TransomShape,
): TransomRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = transomLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && transomHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${transomCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function transomLanesCsv(rows: readonly TransomRow[]): string {
  const lines = ["lane,count"];
  for (const line of transomLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function transomRowsCsv(rows: readonly TransomRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(transomCopy(row.code)), transomLane(row.code), transomHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
