/**
 * Acroterion finials kept in this browser,
 * and antefix tiles read the registration date already stored on the account.
 * Orders are acroterion, palmette, anthemion, and finial. Grounds are ivory, graphite, and champagne.
 * Hours are 3, 7, 11, or 15. Depths are 1, 4, or 7.
 * Acroterion and palmette are the warm half. Anthemion and finial are the cool half.
 * Graphite is the quiet ground.
 * A registration date today is due. Within one day ahead is soon. Further ahead is far.
 * A registration date younger than four days past is late. Older than that is missed.
 * Open, now, due, and today are due. Near, soon, and fresh are soon. Hold, pause, and wait hold.
 * Aged and late are late. Miss, gone, shut, and drop are missed. None, blank, empty, and clear stay blank.
 * A true registration date reads as OPEN. A false registration date reads as SHUT.
 * Money fields are not read. The tile does not change the saved registration date.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_acroterion_finial (
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
 * CREATE TABLE crm_antefix_tile_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_antefix_tile_review (
 *   trader_id text primary key
 * );
 */
export const AFN_KEY = "crmv4-acroterion-393";
export const AFN_VIEW_KEY = "crmv4-acroterion-views-393";
export const AFN_DENSITY_KEY = "crmv4-acroterion-density-393";
export const AFN_PROFILES = ["acroterion", "palmette", "anthemion", "finial"] as const;

export type AcroterionProfile = (typeof AFN_PROFILES)[number];
export type AcroterionBed = "blank" | "ivory" | "graphite" | "champagne";
export type AcroterionRack = "yard" | "press" | "shelf";
export type AcroterionDensity = "open" | "tight";
export type AcroterionSort = "profile" | "hand";

export type Acroterion = {
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

export type AcroterionView = {
  id: string;
  name: string;
  rack: AcroterionRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type AcroterionCounts = {
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

export const ROUND393_FEATURES = [
  "acroterion-save",
  "acroterion-reminders",
  "acroterion-orders",
  "acroterion-search",
  "acroterion-hour-sla",
  "acroterion-case",
  "acroterion-pin",
  "acroterion-inline-title",
  "acroterion-filters",
  "saved-acroterion-views",
  "acroterion-density",
  "acroterion-focus",
  "acroterion-kpis",
  "acroterion-chart",
  "acroterion-timeline",
  "acroterion-bulk",
  "acroterion-csv",
  "acroterion-keys",
  "acroterion-audit",
  "lightest-ridge-hand",
  "acroterion-viewer",
  "suggest-acroterion",
  "overdue-finial",
  "antefix-tiles",
  "antefix-registration-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [3, 7, 11, 15] as const;
const DEPTH_CYCLE = [1, 4, 7] as const;
const WARM = new Set(["acroterion", "palmette"]);
const COOL = new Set(["anthemion", "finial"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): AcroterionRack {
  return raw === "press" || raw === "shelf" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<AcroterionBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<AcroterionBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[af]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Acroterion, rack: AcroterionRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return AFN_PROFILES.indexOf(profile as AcroterionProfile);
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
  return (AFN_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 7, 11, or 15. Anything else stays blank. */
export function acroterionHour(raw: unknown): 3 | 7 | 11 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "7" && text !== "11" && text !== "15") return null;
  return Number(text) as 3 | 7 | 11 | 15;
}

/** A depth is 1, 4, or 7. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 4 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "7") return null;
  return Number(text) as 1 | 4 | 7;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function acroterionBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Acroterion is first. Console is second. Ancone is third. Corbel is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "acroterion") return "first";
  if (text === "palmette") return "second";
  if (text === "anthemion") return "third";
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
  return QUIET_BED.has(acroterionBed(bed));
}

/** A pair depth is 4. Two and eight are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 4;
}

/** A full depth is 7. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 7;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = acroterionHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = acroterionBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveAcroterionFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestAcroterionBed(cards: readonly Acroterion[]): string {
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
export function suggestAcroterionHour(cards: readonly Acroterion[], hour: number): 3 | 7 | 11 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "yard") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 7 | 11 | 15 = 3;
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
  if (hour < 7) return 3;
  if (hour < 12) return 7;
  if (hour < 18) return 11;
  return 15;
}

export function suggestProfile(hour: number): AcroterionProfile {
  if (hour < 7) return "acroterion";
  if (hour < 12) return "palmette";
  if (hour < 18) return "anthemion";
  return "finial";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Acroterion[], roster: string): string {
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

export function readAcroterionList(raw: unknown): Acroterion[] {
  if (!Array.isArray(raw)) return [];
  const out: Acroterion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Acroterion>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: acroterionHour(row.hour),
      bed: acroterionBed(row.bed),
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

export function addAcroterion(
  cards: readonly Acroterion[],
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
): Acroterion[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readAcroterionList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: acroterionHour(card.hour),
      bed: acroterionBed(card.bed),
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

function mapCard(cards: readonly Acroterion[], id: string, edit: (card: Acroterion) => Acroterion): Acroterion[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editAcroterion(cards: readonly Acroterion[], id: string, title: string): Acroterion[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editAcroterionNote(cards: readonly Acroterion[], id: string, note: string): Acroterion[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(acroterionBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setAcroterionBed(cards: readonly Acroterion[], id: string, bed: string): Acroterion[] {
  const next = acroterionBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setAcroterionRaised(cards: readonly Acroterion[], id: string, raised: boolean): Acroterion[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setAcroterionRack(cards: readonly Acroterion[], id: string, pressed: boolean): Acroterion[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setAcroterionShelf(cards: readonly Acroterion[], id: string, shelved: boolean): Acroterion[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setAcroterionPin(cards: readonly Acroterion[], id: string, pinned: boolean): Acroterion[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addAcroterionTag(cards: readonly Acroterion[], id: string, tag: string): Acroterion[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 7 | 11 | 15 {
  if (hour === null) return dir > 0 ? 3 : 15;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 1 | 4 | 7 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setAcroterionFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackAcroterionFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return setAcroterionRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinAcroterionFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  return setAcroterionPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Acroterion[], id: string): Acroterion[] {
  const card = cards.find((item) => item.id === id);
  return card ? setAcroterionBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Acroterion[], ids: readonly string[], edit: (card: Acroterion) => Acroterion): Acroterion[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkAcroterionLinen(cards: readonly Acroterion[], ids: readonly string[]): Acroterion[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkAcroterionRaise(cards: readonly Acroterion[], ids: readonly string[]): Acroterion[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkAcroterionShelf(cards: readonly Acroterion[], ids: readonly string[]): Acroterion[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkAcroterionTag(cards: readonly Acroterion[], ids: readonly string[]): Acroterion[] {
  return bulk(cards, ids, (card) => (card.tags.includes("m") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readAcroterionViews(raw: unknown): AcroterionView[] {
  if (!Array.isArray(raw)) return [];
  const out: AcroterionView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AcroterionView>;
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

export function addAcroterionView(views: readonly AcroterionView[], view: AcroterionView): AcroterionView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readAcroterionViews([...views, { ...view, name }]);
}

export function dropAcroterionView(views: readonly AcroterionView[], id: string): AcroterionView[] {
  return views.filter((view) => view.id !== id);
}

export function acroterionDensity(raw: unknown): AcroterionDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortAcroterionList(cards: readonly Acroterion[], sort: AcroterionSort): Acroterion[] {
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

export function visibleAcroterionList(
  cards: readonly Acroterion[],
  rack: AcroterionRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Acroterion[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : acroterionBed(bed);
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

/** Finial at depth one, still not raised and not on the shelf, is overdue. */
export function overdueAcroterion(card: Acroterion): boolean {
  return card.profile === "finial" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idleAcroterion(card: Acroterion): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Champagne, fifteen hours, and a full depth, still off the shelf. */
export function briskAcroterion(card: Acroterion): boolean {
  return card.bed === "CHAMPAGNE" && card.hour === 15 && card.depth === 7 && !card.shelved;
}

/** Anthemion, graphite, and seven hours. */
export function restingAcroterion(card: Acroterion): boolean {
  return card.profile === "anthemion" && card.bed === "GRAPHITE" && card.hour === 7;
}

/** An acroterion finial is late when the station is already finial. */
export function lateAcroterion(card: Acroterion, station: string): boolean {
  return card.profile === "acroterion" && profilePoint(station) === "finial" && !card.raised;
}

export function acroterionCounts(cards: readonly Acroterion[], shown: readonly Acroterion[], station: string): AcroterionCounts {
  return {
    yard: cards.filter((card) => inRack(card, "yard")).length,
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
    idle: cards.filter(idleAcroterion).length,
    brisk: cards.filter(briskAcroterion).length,
    resting: cards.filter(restingAcroterion).length,
    overdue: cards.filter(overdueAcroterion).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateAcroterion(card, station)).length,
  };
}

export function acroterionBars(cards: readonly Acroterion[]): { profile: string; count: number }[] {
  return AFN_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function acroterionTimeline(cards: readonly Acroterion[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "yard"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function acroterionHands(cards: readonly Acroterion[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Acroterion[]): string {
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of acroterionHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderAcroterionList(cards: readonly Acroterion[]): string[] {
  return cards.filter(overdueAcroterion).map((card) => card.title);
}

export function acroterionCopy(card: Acroterion): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function acroterionCsv(cards: readonly Acroterion[], station: string): string {
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
        lateAcroterion(card, station) ? "1" : "0",
        idleAcroterion(card) ? "1" : "0",
        briskAcroterion(card) ? "1" : "0",
        restingAcroterion(card) ? "1" : "0",
        overdueAcroterion(card) ? "1" : "0",
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

export const ATX_HIDE_KEY = "crmv4-antefix-hide-393";
export const ATX_REVIEW_KEY = "crmv4-antefix-review-393";

export type AntefixLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type AntefixHue = "" | "gilt" | "ash" | "pearl";
export type AntefixState = "" | "clear" | "set";
export type AntefixReview = "all" | "reviewed" | "fresh";
export type AntefixShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type AntefixValue = string | { registrationDate?: unknown; [key: string]: unknown } | null | undefined;
export type AntefixRow = { id: string; label: string; code: AntefixValue; userId?: string };
export type AntefixLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const DUE_TITLES = new Set(["OPEN", "NOW", "DUE", "TODAY"]);
const SOON_TITLES = new Set(["NEAR", "SOON", "FRESH"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const LATE_TITLES = new Set(["LATE", "AGED"]);
const MISSED_TITLES = new Set(["MISS", "GONE", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function antefixRecord(raw: AntefixValue): { registrationDate?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function antefixBlocked(raw: AntefixValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function antefixGiven(raw: AntefixValue): string {
  const row = antefixRecord(raw);
  if (row && !("registrationDate" in row)) return "";
  const value = row ? row.registrationDate : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "OPEN";
  if (value === false || value === "false" || value === "0" || value === 0) return "SHUT";
  return snip(value, 48);
}

function antefixReadable(raw: AntefixValue): boolean {
  if (antefixBlocked(raw)) return false;
  const row = antefixRecord(raw);
  if (row && !("registrationDate" in row)) return false;
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

export function antefixState(raw: AntefixValue): AntefixState {
  if (!antefixReadable(raw)) return "";
  return antefixGiven(raw) ? "set" : "clear";
}

/** A known registration date maps first. A date today is due. Within one day ahead is soon. Further ahead is far.
 * Younger than four days past is late. Older is missed.
 * A mark of eight characters or more is far. A mark that starts with a digit is due. A mark that starts with a vowel is soon. Anything else holds.
 */
export function antefixLane(raw: AntefixValue, now = Date.now()): AntefixLane {
  if (antefixState(raw) !== "set") return "";
  const text = antefixGiven(raw);
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
    if (diff > 0 && diff <= 1 * day) return "soon";
    if (diff > 1 * day) return "far";
    if (now - at < 4 * day) return "late";
    return "missed";
  }
  if (text.length >= 8) return "far";
  if (/^[0-9]/.test(text)) return "due";
  if (/^[aeiou]/i.test(text)) return "soon";
  return "hold";
}

export function antefixHue(raw: AntefixValue, now = Date.now()): AntefixHue {
  const mail = antefixLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ash";
  return "pearl";
}

export function antefixLit(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "due";
}

export function antefixNear(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "soon";
}

export function antefixFar(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "far";
}

export function antefixFade(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "late";
}

export function antefixDark(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "missed";
}

export function antefixDim(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "hold";
}

export function antefixBlank(raw: AntefixValue, now = Date.now()): boolean {
  return antefixLane(raw, now) === "blank";
}

export function antefixOpen(raw: AntefixValue): boolean {
  return antefixState(raw) === "clear";
}

export function antefixLength(raw: AntefixValue): number | null {
  if (antefixState(raw) !== "set") return null;
  return antefixGiven(raw).length;
}

export function antefixEven(raw: AntefixValue): boolean {
  const length = antefixLength(raw);
  return length !== null && length % 2 === 0;
}

export function antefixDigit(raw: AntefixValue): boolean {
  return /[0-9]/.test(antefixGiven(raw));
}

export function antefixLetter(raw: AntefixValue): boolean {
  return /[A-Za-z]/.test(antefixGiven(raw));
}

export function antefixUpper(raw: AntefixValue): boolean {
  const text = antefixGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function antefixCopy(raw: AntefixValue): string {
  return antefixGiven(raw);
}

export function antefixStamp(raw: AntefixValue): string {
  const text = antefixGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function antefixLanes(rows: readonly AntefixRow[], now = Date.now()): AntefixLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = antefixLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingAntefix(rows: readonly AntefixRow[], now = Date.now()): string {
  const lines = antefixLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingAntefixHue(rows: readonly AntefixRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = antefixHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneAntefixCount(rows: readonly AntefixRow[], mail: AntefixLane, now = Date.now()): number {
  return rows.filter((row) => antefixLane(row.code, now) === mail).length;
}

export function antefixShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAntefixLanes(rows: readonly AntefixRow[], now = Date.now()): string[] {
  return antefixLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenAntefix(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAntefix(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAntefix(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleAntefixReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAntefixReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAntefixLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: AntefixValue, shape: AntefixShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return antefixOpen(raw);
  if (shape === "digit") return antefixDigit(raw);
  if (shape === "letter") return antefixLetter(raw);
  if (shape === "even") return antefixEven(raw);
  if (shape === "upper") return antefixUpper(raw);
  return antefixLane(raw, now) === shape;
}

export function visibleAntefix(
  rows: readonly AntefixRow[],
  mail: string,
  hue: string,
  query: string,
  review: AntefixReview,
  reviewed: readonly string[],
  shape: AntefixShape,
  now = Date.now(),
): AntefixRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = antefixLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && antefixHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${antefixCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function antefixLanesCsv(rows: readonly AntefixRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of antefixLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function antefixRowsCsv(rows: readonly AntefixRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,registrationDate,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(antefixCopy(row.code)), antefixLane(row.code, now), antefixHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
