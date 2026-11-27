/**
 * Plinth courses kept in this browser,
 * and dado plates read the block message already stored on the account.
 * Orders are plinth, stereobate, podium, and crepidoma. Grounds are ivory, graphite, and champagne.
 * Hours are 4, 8, 12, or 18. Depths are 2, 5, or 9.
 * Plinth and stereobate are the warm half. Podium and crepidoma are the cool half.
 * Champagne is the quiet ground.
 * A message with a period and ordinary length is a note. Under ten letters is brief. Forty or more is long.
 * A leading digit of three to five is a code. One or two digits are brief. Six digits or more are long.
 * A word without a period shorter than six letters is brief. Twenty or longer is long. Anything else holds.
 * Block, live, and open are notes. Hold, pause, and wait hold.
 * Off, void, shut, and drop are shut. None, blank, empty, and clear stay blank.
 * A true block message reads as BLOCK. A false block message reads as OFF.
 * Money fields are not read. The plate does not change the saved block message.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_plinth_course (
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
 * CREATE TABLE crm_dado_message_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_dado_message_review (
 *   trader_id text primary key
 * );
 */
export const PLT_KEY = "crmv4-plinth-398";
export const PLT_VIEW_KEY = "crmv4-plinth-views-398";
export const PLT_DENSITY_KEY = "crmv4-plinth-density-398";
export const PLT_PROFILES = ["plinth", "stereobate", "podium", "crepidoma"] as const;

export type PlinthProfile = (typeof PLT_PROFILES)[number];
export type PlinthBed = "blank" | "ivory" | "graphite" | "champagne";
export type PlinthRack = "base" | "press" | "shelf";
export type PlinthDensity = "open" | "tight";
export type PlinthSort = "profile" | "hand";

export type Plinth = {
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

export type PlinthView = {
  id: string;
  name: string;
  rack: PlinthRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type PlinthCounts = {
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

export const ROUND398_FEATURES = [
  "plinth-save",
  "plinth-reminders",
  "plinth-orders",
  "plinth-search",
  "plinth-hour-sla",
  "plinth-case",
  "plinth-pin",
  "plinth-inline-title",
  "plinth-filters",
  "saved-plinth-views",
  "plinth-density",
  "plinth-focus",
  "plinth-kpis",
  "plinth-chart",
  "plinth-timeline",
  "plinth-bulk",
  "plinth-csv",
  "plinth-keys",
  "plinth-audit",
  "quietest-plinth-hand",
  "plinth-viewer",
  "suggest-plinth",
  "overdue-plinth",
  "dado-panels",
  "dado-message-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [4, 8, 12, 18] as const;
const DEPTH_CYCLE = [2, 5, 9] as const;
const WARM = new Set(["plinth", "stereobate"]);
const COOL = new Set(["podium", "crepidoma"]);
const QUIET_BED = new Set(["CHAMPAGNE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): PlinthRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<PlinthBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<PlinthBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[pd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Plinth, rack: PlinthRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return PLT_PROFILES.indexOf(profile as PlinthProfile);
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
  return (PLT_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 12, or 18. Anything else stays blank. */
export function plinthHour(raw: unknown): 4 | 8 | 12 | 18 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "18") return null;
  return Number(text) as 4 | 8 | 12 | 18;
}

/** A depth is 2, 5, or 9. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 5 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "9") return null;
  return Number(text) as 2 | 5 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function plinthBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Plinth is first. Lacunar is second. Pane is third. Rib is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "plinth") return "first";
  if (text === "stereobate") return "second";
  if (text === "podium") return "third";
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
  return QUIET_BED.has(plinthBed(bed));
}

/** A pair depth is 5. Two and nine are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 5;
}

/** A full depth is 9. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 9;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = plinthHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = plinthBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function movePlinthFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestPlinthBed(cards: readonly Plinth[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "base") || !card.bed) continue;
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

/** Before eight, suggest four. Before thirteen, suggest eight. Before eighteen, suggest twelve. Later, suggest eighteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestPlinthHour(cards: readonly Plinth[], hour: number): 4 | 8 | 12 | 18 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 18 = 4;
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
  if (hour < 13) return 8;
  if (hour < 18) return 12;
  return 18;
}

export function suggestProfile(hour: number): PlinthProfile {
  if (hour < 8) return "plinth";
  if (hour < 13) return "stereobate";
  if (hour < 18) return "podium";
  return "crepidoma";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Plinth[], roster: string): string {
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

export function readPlinthList(raw: unknown): Plinth[] {
  if (!Array.isArray(raw)) return [];
  const out: Plinth[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Plinth>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: plinthHour(row.hour),
      bed: plinthBed(row.bed),
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

export function addPlinth(
  cards: readonly Plinth[],
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
): Plinth[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPlinthList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: plinthHour(card.hour),
      bed: plinthBed(card.bed),
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

function mapCard(cards: readonly Plinth[], id: string, edit: (card: Plinth) => Plinth): Plinth[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPlinth(cards: readonly Plinth[], id: string, title: string): Plinth[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPlinthNote(cards: readonly Plinth[], id: string, note: string): Plinth[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(plinthBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setPlinthBed(cards: readonly Plinth[], id: string, bed: string): Plinth[] {
  const next = plinthBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setPlinthRaised(cards: readonly Plinth[], id: string, raised: boolean): Plinth[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setPlinthRack(cards: readonly Plinth[], id: string, pressed: boolean): Plinth[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setPlinthShelf(cards: readonly Plinth[], id: string, shelved: boolean): Plinth[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setPlinthPin(cards: readonly Plinth[], id: string, pinned: boolean): Plinth[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addPlinthTag(cards: readonly Plinth[], id: string, tag: string): Plinth[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 4 | 8 | 12 | 18 {
  if (hour === null) return dir > 0 ? 4 : 18;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 5 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setPlinthFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackPlinthFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return setPlinthRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinPlinthFocused(cards: readonly Plinth[], id: string): Plinth[] {
  return setPlinthPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Plinth[], id: string): Plinth[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPlinthBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Plinth[], ids: readonly string[], edit: (card: Plinth) => Plinth): Plinth[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPlinthLinen(cards: readonly Plinth[], ids: readonly string[]): Plinth[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkPlinthRaise(cards: readonly Plinth[], ids: readonly string[]): Plinth[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkPlinthShelf(cards: readonly Plinth[], ids: readonly string[]): Plinth[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkPlinthTag(cards: readonly Plinth[], ids: readonly string[]): Plinth[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readPlinthViews(raw: unknown): PlinthView[] {
  if (!Array.isArray(raw)) return [];
  const out: PlinthView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlinthView>;
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

export function addPlinthView(views: readonly PlinthView[], view: PlinthView): PlinthView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPlinthViews([...views, { ...view, name }]);
}

export function dropPlinthView(views: readonly PlinthView[], id: string): PlinthView[] {
  return views.filter((view) => view.id !== id);
}

export function plinthDensity(raw: unknown): PlinthDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortPlinthList(cards: readonly Plinth[], sort: PlinthSort): Plinth[] {
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

export function visiblePlinthList(
  cards: readonly Plinth[],
  rack: PlinthRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Plinth[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : plinthBed(bed);
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

/** A rib at depth one, still not raised and not on the loft, is overdue. */
export function overduePlinth(card: Plinth): boolean {
  return card.profile === "crepidoma" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idlePlinth(card: Plinth): boolean {
  return !card.bed && card.hour === 4 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, sixteen hours, and a full depth, still off the loft. */
export function briskPlinth(card: Plinth): boolean {
  return card.bed === "CHAMPAGNE" && card.hour === 18 && card.depth === 9 && !card.shelved;
}

/** Pane, ivory, and six hours. */
export function restingPlinth(card: Plinth): boolean {
  return card.profile === "podium" && card.bed === "IVORY" && card.hour === 8;
}

/** A plinth is late when the station is already rib. */
export function latePlinth(card: Plinth, station: string): boolean {
  return card.profile === "plinth" && profilePoint(station) === "crepidoma" && !card.raised;
}

export function plinthCounts(cards: readonly Plinth[], shown: readonly Plinth[], station: string): PlinthCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 18).length,
    quiet: cards.filter((card) => champagneQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idlePlinth).length,
    brisk: cards.filter(briskPlinth).length,
    resting: cards.filter(restingPlinth).length,
    overdue: cards.filter(overduePlinth).length,
    pair: cards.filter((card) => midDepth(card.depth) && latePlinth(card, station)).length,
  };
}

export function plinthBars(cards: readonly Plinth[]): { profile: string; count: number }[] {
  return PLT_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function plinthTimeline(cards: readonly Plinth[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function plinthHands(cards: readonly Plinth[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Plinth[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of plinthHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPlinthList(cards: readonly Plinth[]): string[] {
  return cards.filter(overduePlinth).map((card) => card.title);
}

export function plinthCopy(card: Plinth): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function plinthCsv(cards: readonly Plinth[], station: string): string {
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
        latePlinth(card, station) ? "1" : "0",
        idlePlinth(card) ? "1" : "0",
        briskPlinth(card) ? "1" : "0",
        restingPlinth(card) ? "1" : "0",
        overduePlinth(card) ? "1" : "0",
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


export const DAD_HIDE_KEY = "crmv4-dado-hide-398";
export const DAD_REVIEW_KEY = "crmv4-dado-review-398";

export type DadoLane = "" | "note" | "code" | "brief" | "long" | "hold" | "shut" | "blank";
export type DadoHue = "" | "gilt" | "ash" | "pearl";
export type DadoState = "" | "clear" | "set";
export type DadoReview = "all" | "reviewed" | "fresh";
export type DadoShape = "all" | "note" | "code" | "brief" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type DadoValue = string | { loginBlockedMessage?: unknown; [key: string]: unknown } | null | undefined;
export type DadoRow = { id: string; label: string; code: DadoValue; userId?: string };
export type DadoLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["note", "code", "brief", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["BLOCK", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function dadoRecord(raw: DadoValue): { loginBlockedMessage?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function dadoBlocked(raw: DadoValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function dadoGiven(raw: DadoValue): string {
  const row = dadoRecord(raw);
  if (row && !("loginBlockedMessage" in row)) return "";
  const value = row ? row.loginBlockedMessage : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "BLOCK";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function dadoReadable(raw: DadoValue): boolean {
  if (dadoBlocked(raw)) return false;
  const row = dadoRecord(raw);
  if (row && !("loginBlockedMessage" in row)) return false;
  return true;
}

export function dadoState(raw: DadoValue): DadoState {
  if (!dadoReadable(raw)) return "";
  return dadoGiven(raw) ? "set" : "clear";
}

/** Word marks win first. A message with a period under ten letters is brief. Forty or more is long. An ordinary dotted message is a note. A leading digit of three to five is a code. One or two digits are brief. Six digits or more are long. A word without a period under six letters is brief. Twenty or more is long. Anything else holds. */
export function dadoLane(raw: DadoValue): DadoLane {
  if (dadoState(raw) !== "set") return "";
  const text = dadoGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "note";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (text.includes(".")) {
    if (text.length < 10) return "brief";
    if (text.length >= 40) return "long";
    return "note";
  }
  if (/^[0-9]/.test(text)) {
    if (text.length <= 2) return "brief";
    if (text.length <= 5) return "code";
    return "long";
  }
  if (text.length >= 20) return "long";
  if (text.length < 6) return "brief";
  return "hold";
}

export function dadoHue(raw: DadoValue): DadoHue {
  const mail = dadoLane(raw);
  if (!mail) return "";
  if (mail === "note") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function dadoLit(raw: DadoValue): boolean {
  return dadoLane(raw) === "note";
}

export function dadoNear(raw: DadoValue): boolean {
  return dadoLane(raw) === "code";
}

export function dadoFar(raw: DadoValue): boolean {
  return dadoLane(raw) === "brief";
}

export function dadoFade(raw: DadoValue): boolean {
  return dadoLane(raw) === "long";
}

export function dadoDark(raw: DadoValue): boolean {
  return dadoLane(raw) === "shut";
}

export function dadoDim(raw: DadoValue): boolean {
  return dadoLane(raw) === "hold";
}

export function dadoBlank(raw: DadoValue): boolean {
  return dadoLane(raw) === "blank";
}

export function dadoOpen(raw: DadoValue): boolean {
  return dadoState(raw) === "clear";
}

export function dadoLength(raw: DadoValue): number | null {
  if (dadoState(raw) !== "set") return null;
  return dadoGiven(raw).length;
}

export function dadoEven(raw: DadoValue): boolean {
  const length = dadoLength(raw);
  return length !== null && length % 2 === 0;
}

export function dadoDigit(raw: DadoValue): boolean {
  return /[0-9]/.test(dadoGiven(raw));
}

export function dadoLetter(raw: DadoValue): boolean {
  return /[A-Za-z]/.test(dadoGiven(raw));
}

export function dadoUpper(raw: DadoValue): boolean {
  const text = dadoGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function dadoCopy(raw: DadoValue): string {
  return dadoGiven(raw);
}

export function dadoStamp(raw: DadoValue): string {
  const text = dadoGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function dadoLanes(rows: readonly DadoRow[]): DadoLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = dadoLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingDado(rows: readonly DadoRow[]): string {
  const lines = dadoLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingDadoHue(rows: readonly DadoRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = dadoHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneDadoCount(rows: readonly DadoRow[], mail: DadoLane): number {
  return rows.filter((row) => dadoLane(row.code) === mail).length;
}

export function dadoShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDadoLanes(rows: readonly DadoRow[]): string[] {
  return dadoLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenDado(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDado(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDado(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleDadoReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDadoReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDadoLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: DadoValue, shape: DadoShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return dadoOpen(raw);
  if (shape === "digit") return dadoDigit(raw);
  if (shape === "letter") return dadoLetter(raw);
  if (shape === "even") return dadoEven(raw);
  if (shape === "upper") return dadoUpper(raw);
  return dadoLane(raw) === shape;
}

export function visibleDado(
  rows: readonly DadoRow[],
  mail: string,
  hue: string,
  query: string,
  review: DadoReview,
  reviewed: readonly string[],
  shape: DadoShape,
): DadoRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = dadoLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && dadoHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${dadoCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function dadoLanesCsv(rows: readonly DadoRow[]): string {
  const lines = ["lane,count"];
  for (const line of dadoLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function dadoRowsCsv(rows: readonly DadoRow[], reviewed: readonly string[]): string {
  const lines = ["name,message,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(dadoCopy(row.code)), dadoLane(row.code), dadoHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
