/**
 * Echinus capitals kept in this browser,
 * and abacus slabs read the leverage already stored on the account.
 * Orders are echinus, necking, helix, and volute. Grounds are ivory, graphite, and champagne.
 * Hours are 1, 4, 8, or 12. Depths are 3, 6, or 9.
 * Echinus and necking are the warm half. Helix and volute are the cool half.
 * Graphite is the quiet ground.
 * A three-digit leverage is a figure. Two digits or fewer are short. Four digits or more are long.
 * A letter mark shorter than four is short. Twelve or longer is long. Ordinary letters are linked.
 * Set, live, and open are linked. Hold, pause, and wait hold.
 * Off, zero, shut, and drop are shut. None, blank, empty, and clear stay blank.
 * A true leverage reads as SET. A false leverage reads as OFF.
 * Money fields are not read. The slab does not change the saved leverage.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_echinus_capital (
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
 * CREATE TABLE crm_abacus_slab_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_abacus_slab_review (
 *   trader_id text primary key
 * );
 */
export const ECH_KEY = "crmv4-echinus-395";
export const ECH_VIEW_KEY = "crmv4-echinus-views-395";
export const ECH_DENSITY_KEY = "crmv4-echinus-density-395";
export const ECH_PROFILES = ["echinus", "necking", "helix", "volute"] as const;

export type EchinusProfile = (typeof ECH_PROFILES)[number];
export type EchinusBed = "blank" | "ivory" | "graphite" | "champagne";
export type EchinusRack = "yard" | "press" | "shelf";
export type EchinusDensity = "open" | "tight";
export type EchinusSort = "profile" | "hand";

export type Echinus = {
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

export type EchinusView = {
  id: string;
  name: string;
  rack: EchinusRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type EchinusCounts = {
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

export const ROUND395_FEATURES = [
  "echinus-save",
  "echinus-reminders",
  "echinus-orders",
  "echinus-search",
  "echinus-hour-sla",
  "echinus-case",
  "echinus-pin",
  "echinus-inline-title",
  "echinus-filters",
  "saved-echinus-views",
  "echinus-density",
  "echinus-focus",
  "echinus-kpis",
  "echinus-chart",
  "echinus-timeline",
  "echinus-bulk",
  "echinus-csv",
  "echinus-keys",
  "echinus-audit",
  "quietest-capital-hand",
  "echinus-viewer",
  "suggest-echinus",
  "overdue-capital",
  "abacus-panels",
  "abacus-leverage-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [1, 4, 8, 12] as const;
const DEPTH_CYCLE = [3, 6, 9] as const;
const WARM = new Set(["echinus", "necking"]);
const COOL = new Set(["helix", "volute"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): EchinusRack {
  return raw === "press" || raw === "shelf" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<EchinusBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<EchinusBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[en]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Echinus, rack: EchinusRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return ECH_PROFILES.indexOf(profile as EchinusProfile);
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
  return (ECH_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 7, 11, or 15. Anything else stays blank. */
export function echinusHour(raw: unknown): 1 | 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 1 | 4 | 8 | 12;
}

/** A depth is 1, 4, or 7. Anything else stays blank. */
export function depthCount(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function echinusBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Echinus is first. Console is second. Ancone is third. Corbel is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "echinus") return "first";
  if (text === "necking") return "second";
  if (text === "helix") return "third";
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
  return QUIET_BED.has(echinusBed(bed));
}

/** A pair depth is 4. Two and eight are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 6;
}

/** A full depth is 7. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 9;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = echinusHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = echinusBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveEchinusFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestEchinusBed(cards: readonly Echinus[]): string {
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
export function suggestEchinusHour(cards: readonly Echinus[], hour: number): 1 | 4 | 8 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "yard") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 1 | 4 | 8 | 12 = 1;
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
  if (hour < 5) return 1;
  if (hour < 10) return 4;
  if (hour < 16) return 8;
  return 12;
}

export function suggestProfile(hour: number): EchinusProfile {
  if (hour < 5) return "echinus";
  if (hour < 10) return "necking";
  if (hour < 16) return "helix";
  return "volute";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Echinus[], roster: string): string {
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

export function readEchinusList(raw: unknown): Echinus[] {
  if (!Array.isArray(raw)) return [];
  const out: Echinus[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Echinus>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: echinusHour(row.hour),
      bed: echinusBed(row.bed),
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

export function addEchinus(
  cards: readonly Echinus[],
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
): Echinus[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readEchinusList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: echinusHour(card.hour),
      bed: echinusBed(card.bed),
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

function mapCard(cards: readonly Echinus[], id: string, edit: (card: Echinus) => Echinus): Echinus[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editEchinus(cards: readonly Echinus[], id: string, title: string): Echinus[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editEchinusNote(cards: readonly Echinus[], id: string, note: string): Echinus[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(echinusBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setEchinusBed(cards: readonly Echinus[], id: string, bed: string): Echinus[] {
  const next = echinusBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setEchinusRaised(cards: readonly Echinus[], id: string, raised: boolean): Echinus[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setEchinusRack(cards: readonly Echinus[], id: string, pressed: boolean): Echinus[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setEchinusShelf(cards: readonly Echinus[], id: string, shelved: boolean): Echinus[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setEchinusPin(cards: readonly Echinus[], id: string, pinned: boolean): Echinus[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addEchinusTag(cards: readonly Echinus[], id: string, tag: string): Echinus[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 1 | 4 | 8 | 12 {
  if (hour === null) return dir > 0 ? 1 : 12;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setEchinusFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackEchinusFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return setEchinusRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinEchinusFocused(cards: readonly Echinus[], id: string): Echinus[] {
  return setEchinusPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Echinus[], id: string): Echinus[] {
  const card = cards.find((item) => item.id === id);
  return card ? setEchinusBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Echinus[], ids: readonly string[], edit: (card: Echinus) => Echinus): Echinus[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkEchinusLinen(cards: readonly Echinus[], ids: readonly string[]): Echinus[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkEchinusRaise(cards: readonly Echinus[], ids: readonly string[]): Echinus[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkEchinusShelf(cards: readonly Echinus[], ids: readonly string[]): Echinus[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkEchinusTag(cards: readonly Echinus[], ids: readonly string[]): Echinus[] {
  return bulk(cards, ids, (card) => (card.tags.includes("n") ? card : { ...card, tags: tagsOf([...card.tags, "n"]), audit: "tag" }));
}

export function readEchinusViews(raw: unknown): EchinusView[] {
  if (!Array.isArray(raw)) return [];
  const out: EchinusView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EchinusView>;
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

export function addEchinusView(views: readonly EchinusView[], view: EchinusView): EchinusView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readEchinusViews([...views, { ...view, name }]);
}

export function dropEchinusView(views: readonly EchinusView[], id: string): EchinusView[] {
  return views.filter((view) => view.id !== id);
}

export function echinusDensity(raw: unknown): EchinusDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortEchinusList(cards: readonly Echinus[], sort: EchinusSort): Echinus[] {
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

export function visibleEchinusList(
  cards: readonly Echinus[],
  rack: EchinusRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Echinus[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : echinusBed(bed);
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
export function overdueEchinus(card: Echinus): boolean {
  return card.profile === "volute" && card.depth === 3 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idleEchinus(card: Echinus): boolean {
  return !card.bed && card.hour === 1 && card.depth === 3 && !card.raised && !card.pressed && !card.shelved;
}

/** Champagne, fifteen hours, and a full depth, still off the shelf. */
export function briskEchinus(card: Echinus): boolean {
  return card.bed === "CHAMPAGNE" && card.hour === 12 && card.depth === 9 && !card.shelved;
}

/** Anthemion, graphite, and seven hours. */
export function restingEchinus(card: Echinus): boolean {
  return card.profile === "helix" && card.bed === "GRAPHITE" && card.hour === 4;
}

/** An echinus volute is late when the station is already volute. */
export function lateEchinus(card: Echinus, station: string): boolean {
  return card.profile === "echinus" && profilePoint(station) === "volute" && !card.raised;
}

export function echinusCounts(cards: readonly Echinus[], shown: readonly Echinus[], station: string): EchinusCounts {
  return {
    yard: cards.filter((card) => inRack(card, "yard")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 12).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleEchinus).length,
    brisk: cards.filter(briskEchinus).length,
    resting: cards.filter(restingEchinus).length,
    overdue: cards.filter(overdueEchinus).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateEchinus(card, station)).length,
  };
}

export function echinusBars(cards: readonly Echinus[]): { profile: string; count: number }[] {
  return ECH_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function echinusTimeline(cards: readonly Echinus[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "yard"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function echinusHands(cards: readonly Echinus[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Echinus[]): string {
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of echinusHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderEchinusList(cards: readonly Echinus[]): string[] {
  return cards.filter(overdueEchinus).map((card) => card.title);
}

export function echinusCopy(card: Echinus): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function echinusCsv(cards: readonly Echinus[], station: string): string {
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
        lateEchinus(card, station) ? "1" : "0",
        idleEchinus(card) ? "1" : "0",
        briskEchinus(card) ? "1" : "0",
        restingEchinus(card) ? "1" : "0",
        overdueEchinus(card) ? "1" : "0",
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


export const ABC_HIDE_KEY = "crmv4-abacus-hide-395";
export const ABC_REVIEW_KEY = "crmv4-abacus-review-395";

export type AbacusLane = "" | "link" | "figure" | "short" | "long" | "hold" | "shut" | "blank";
export type AbacusHue = "" | "gilt" | "ash" | "pearl";
export type AbacusState = "" | "clear" | "set";
export type AbacusReview = "all" | "reviewed" | "fresh";
export type AbacusShape = "all" | "link" | "figure" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type AbacusValue = string | { leverage?: unknown; [key: string]: unknown } | null | undefined;
export type AbacusRow = { id: string; label: string; code: AbacusValue; userId?: string };
export type AbacusLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["link", "figure", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["SET", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "ZERO", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function abacusRecord(raw: AbacusValue): { leverage?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function abacusBlocked(raw: AbacusValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function abacusGiven(raw: AbacusValue): string {
  const row = abacusRecord(raw);
  if (row && !("leverage" in row)) return "";
  const value = row ? row.leverage : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "SET";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function abacusReadable(raw: AbacusValue): boolean {
  if (abacusBlocked(raw)) return false;
  const row = abacusRecord(raw);
  if (row && !("leverage" in row)) return false;
  return true;
}

export function abacusState(raw: AbacusValue): AbacusState {
  if (!abacusReadable(raw)) return "";
  return abacusGiven(raw) ? "set" : "clear";
}

/** Word marks win first. A leading digit is a figure. Twenty-five or more is long. Under eight is short. A letter id of ordinary length is linked. */
export function abacusLane(raw: AbacusValue): AbacusLane {
  if (abacusState(raw) !== "set") return "";
  const text = abacusGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "link";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[0-9]/.test(text)) {
    if (text.length <= 2) return "short";
    if (text.length === 3) return "figure";
    return "long";
  }
  if (text.length >= 12) return "long";
  if (text.length < 4) return "short";
  return "link";
}

export function abacusHue(raw: AbacusValue): AbacusHue {
  const mail = abacusLane(raw);
  if (!mail) return "";
  if (mail === "link") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function abacusLit(raw: AbacusValue): boolean {
  return abacusLane(raw) === "link";
}

export function abacusNear(raw: AbacusValue): boolean {
  return abacusLane(raw) === "figure";
}

export function abacusFar(raw: AbacusValue): boolean {
  return abacusLane(raw) === "short";
}

export function abacusFade(raw: AbacusValue): boolean {
  return abacusLane(raw) === "long";
}

export function abacusDark(raw: AbacusValue): boolean {
  return abacusLane(raw) === "shut";
}

export function abacusDim(raw: AbacusValue): boolean {
  return abacusLane(raw) === "hold";
}

export function abacusBlank(raw: AbacusValue): boolean {
  return abacusLane(raw) === "blank";
}

export function abacusOpen(raw: AbacusValue): boolean {
  return abacusState(raw) === "clear";
}

export function abacusLength(raw: AbacusValue): number | null {
  if (abacusState(raw) !== "set") return null;
  return abacusGiven(raw).length;
}

export function abacusEven(raw: AbacusValue): boolean {
  const length = abacusLength(raw);
  return length !== null && length % 2 === 0;
}

export function abacusDigit(raw: AbacusValue): boolean {
  return /[0-9]/.test(abacusGiven(raw));
}

export function abacusLetter(raw: AbacusValue): boolean {
  return /[A-Za-z]/.test(abacusGiven(raw));
}

export function abacusUpper(raw: AbacusValue): boolean {
  const text = abacusGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function abacusCopy(raw: AbacusValue): string {
  return abacusGiven(raw);
}

export function abacusStamp(raw: AbacusValue): string {
  const text = abacusGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function abacusLanes(rows: readonly AbacusRow[]): AbacusLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = abacusLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingAbacus(rows: readonly AbacusRow[]): string {
  const lines = abacusLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingAbacusHue(rows: readonly AbacusRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = abacusHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneAbacusCount(rows: readonly AbacusRow[], mail: AbacusLane): number {
  return rows.filter((row) => abacusLane(row.code) === mail).length;
}

export function abacusShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAbacusLanes(rows: readonly AbacusRow[]): string[] {
  return abacusLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenAbacus(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAbacus(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAbacus(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleAbacusReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAbacusReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAbacusLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: AbacusValue, shape: AbacusShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return abacusOpen(raw);
  if (shape === "digit") return abacusDigit(raw);
  if (shape === "letter") return abacusLetter(raw);
  if (shape === "even") return abacusEven(raw);
  if (shape === "upper") return abacusUpper(raw);
  return abacusLane(raw) === shape;
}

export function visibleAbacus(
  rows: readonly AbacusRow[],
  mail: string,
  hue: string,
  query: string,
  review: AbacusReview,
  reviewed: readonly string[],
  shape: AbacusShape,
): AbacusRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = abacusLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && abacusHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${abacusCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function abacusLanesCsv(rows: readonly AbacusRow[]): string {
  const lines = ["lane,count"];
  for (const line of abacusLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function abacusRowsCsv(rows: readonly AbacusRow[], reviewed: readonly string[]): string {
  const lines = ["name,leverage,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(abacusCopy(row.code)), abacusLane(row.code), abacusHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
