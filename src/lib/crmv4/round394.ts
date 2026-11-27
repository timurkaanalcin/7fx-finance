/**
 * Sima courses kept in this browser,
 * and metope panels read the trading account id already stored on the account.
 * Orders are sima, cyma, scotia, and torus. Grounds are ivory, graphite, and champagne.
 * Hours are 2, 6, 10, or 14. Depths are 2, 5, or 8.
 * Sima and cyma are the warm half. Scotia and torus are the cool half.
 * Ivory is the quiet ground.
 * A letter id of 8 to 24 characters is linked. A leading digit is a figure.
 * Shorter than eight is short. Twenty-five or longer is long.
 * Link, live, and open are linked. Hold, pause, and wait hold.
 * Shut, miss, gone, and drop are shut. None, blank, empty, and clear stay blank.
 * A true account id reads as LINK. A false account id reads as SHUT.
 * Money fields are not read. The panel does not change the saved account id.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sima_course (
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
 * CREATE TABLE crm_metope_panel_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_metope_panel_review (
 *   trader_id text primary key
 * );
 */
export const SMA_KEY = "crmv4-sima-394";
export const SMA_VIEW_KEY = "crmv4-sima-views-394";
export const SMA_DENSITY_KEY = "crmv4-sima-density-394";
export const SMA_PROFILES = ["sima", "cyma", "scotia", "torus"] as const;

export type SimaProfile = (typeof SMA_PROFILES)[number];
export type SimaBed = "blank" | "ivory" | "graphite" | "champagne";
export type SimaRack = "yard" | "press" | "shelf";
export type SimaDensity = "open" | "tight";
export type SimaSort = "profile" | "hand";

export type Sima = {
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

export type SimaView = {
  id: string;
  name: string;
  rack: SimaRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type SimaCounts = {
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

export const ROUND394_FEATURES = [
  "sima-save",
  "sima-reminders",
  "sima-orders",
  "sima-search",
  "sima-hour-sla",
  "sima-case",
  "sima-pin",
  "sima-inline-title",
  "sima-filters",
  "saved-sima-views",
  "sima-density",
  "sima-focus",
  "sima-kpis",
  "sima-chart",
  "sima-timeline",
  "sima-bulk",
  "sima-csv",
  "sima-keys",
  "sima-audit",
  "quietest-course-hand",
  "sima-viewer",
  "suggest-sima",
  "overdue-course",
  "metope-panels",
  "metope-account-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [2, 6, 10, 14] as const;
const DEPTH_CYCLE = [2, 5, 8] as const;
const WARM = new Set(["sima", "cyma"]);
const COOL = new Set(["scotia", "torus"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): SimaRack {
  return raw === "press" || raw === "shelf" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<SimaBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<SimaBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[sm]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Sima, rack: SimaRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return SMA_PROFILES.indexOf(profile as SimaProfile);
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
  return (SMA_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 7, 11, or 15. Anything else stays blank. */
export function simaHour(raw: unknown): 2 | 6 | 10 | 14 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10" && text !== "14") return null;
  return Number(text) as 2 | 6 | 10 | 14;
}

/** A depth is 1, 4, or 7. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8") return null;
  return Number(text) as 2 | 5 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function simaBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Sima is first. Console is second. Ancone is third. Corbel is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "sima") return "first";
  if (text === "cyma") return "second";
  if (text === "scotia") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the yard. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function ivoryQuiet(bed: unknown): boolean {
  return QUIET_BED.has(simaBed(bed));
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
  const hour = simaHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = simaBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveSimaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestSimaBed(cards: readonly Sima[]): string {
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
export function suggestSimaHour(cards: readonly Sima[], hour: number): 2 | 6 | 10 | 14 {
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

export function suggestProfile(hour: number): SimaProfile {
  if (hour < 6) return "sima";
  if (hour < 12) return "cyma";
  if (hour < 18) return "scotia";
  return "torus";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Sima[], roster: string): string {
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

export function readSimaList(raw: unknown): Sima[] {
  if (!Array.isArray(raw)) return [];
  const out: Sima[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Sima>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: simaHour(row.hour),
      bed: simaBed(row.bed),
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

export function addSima(
  cards: readonly Sima[],
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
): Sima[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSimaList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: simaHour(card.hour),
      bed: simaBed(card.bed),
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

function mapCard(cards: readonly Sima[], id: string, edit: (card: Sima) => Sima): Sima[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSima(cards: readonly Sima[], id: string, title: string): Sima[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSimaNote(cards: readonly Sima[], id: string, note: string): Sima[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(simaBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setSimaBed(cards: readonly Sima[], id: string, bed: string): Sima[] {
  const next = simaBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setSimaRaised(cards: readonly Sima[], id: string, raised: boolean): Sima[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setSimaRack(cards: readonly Sima[], id: string, pressed: boolean): Sima[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setSimaShelf(cards: readonly Sima[], id: string, shelved: boolean): Sima[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setSimaPin(cards: readonly Sima[], id: string, pinned: boolean): Sima[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addSimaTag(cards: readonly Sima[], id: string, tag: string): Sima[] {
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

function stepDepth(depth: number, dir: 1 | -1): 2 | 5 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Sima[], id: string): Sima[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Sima[], id: string): Sima[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Sima[], id: string): Sima[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Sima[], id: string): Sima[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setSimaFocused(cards: readonly Sima[], id: string): Sima[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackSimaFocused(cards: readonly Sima[], id: string): Sima[] {
  return setSimaRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinSimaFocused(cards: readonly Sima[], id: string): Sima[] {
  return setSimaPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Sima[], id: string): Sima[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSimaBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Sima[], ids: readonly string[], edit: (card: Sima) => Sima): Sima[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSimaLinen(cards: readonly Sima[], ids: readonly string[]): Sima[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkSimaRaise(cards: readonly Sima[], ids: readonly string[]): Sima[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkSimaShelf(cards: readonly Sima[], ids: readonly string[]): Sima[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkSimaTag(cards: readonly Sima[], ids: readonly string[]): Sima[] {
  return bulk(cards, ids, (card) => (card.tags.includes("m") ? card : { ...card, tags: tagsOf([...card.tags, "m"]), audit: "tag" }));
}

export function readSimaViews(raw: unknown): SimaView[] {
  if (!Array.isArray(raw)) return [];
  const out: SimaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SimaView>;
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

export function addSimaView(views: readonly SimaView[], view: SimaView): SimaView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSimaViews([...views, { ...view, name }]);
}

export function dropSimaView(views: readonly SimaView[], id: string): SimaView[] {
  return views.filter((view) => view.id !== id);
}

export function simaDensity(raw: unknown): SimaDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortSimaList(cards: readonly Sima[], sort: SimaSort): Sima[] {
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

export function visibleSimaList(
  cards: readonly Sima[],
  rack: SimaRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Sima[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : simaBed(bed);
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

/** Torus at depth one, still not raised and not on the shelf, is overdue. */
export function overdueSima(card: Sima): boolean {
  return card.profile === "torus" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idleSima(card: Sima): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Champagne, fifteen hours, and a full depth, still off the shelf. */
export function briskSima(card: Sima): boolean {
  return card.bed === "CHAMPAGNE" && card.hour === 14 && card.depth === 8 && !card.shelved;
}

/** Anthemion, graphite, and seven hours. */
export function restingSima(card: Sima): boolean {
  return card.profile === "scotia" && card.bed === "GRAPHITE" && card.hour === 6;
}

/** An sima torus is late when the station is already torus. */
export function lateSima(card: Sima, station: string): boolean {
  return card.profile === "sima" && profilePoint(station) === "torus" && !card.raised;
}

export function simaCounts(cards: readonly Sima[], shown: readonly Sima[], station: string): SimaCounts {
  return {
    yard: cards.filter((card) => inRack(card, "yard")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 14).length,
    quiet: cards.filter((card) => ivoryQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleSima).length,
    brisk: cards.filter(briskSima).length,
    resting: cards.filter(restingSima).length,
    overdue: cards.filter(overdueSima).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateSima(card, station)).length,
  };
}

export function simaBars(cards: readonly Sima[]): { profile: string; count: number }[] {
  return SMA_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function simaTimeline(cards: readonly Sima[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "yard"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function simaHands(cards: readonly Sima[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Sima[]): string {
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of simaHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSimaList(cards: readonly Sima[]): string[] {
  return cards.filter(overdueSima).map((card) => card.title);
}

export function simaCopy(card: Sima): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function simaCsv(cards: readonly Sima[], station: string): string {
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
        lateSima(card, station) ? "1" : "0",
        idleSima(card) ? "1" : "0",
        briskSima(card) ? "1" : "0",
        restingSima(card) ? "1" : "0",
        overdueSima(card) ? "1" : "0",
        profileWarm(card.profile) ? "1" : "0",
        ivoryQuiet(card.bed) ? "1" : "0",
        profileBand(card.profile),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const MTP_HIDE_KEY = "crmv4-metope-hide-394";
export const MTP_REVIEW_KEY = "crmv4-metope-review-394";

export type MetopeLane = "" | "link" | "figure" | "short" | "long" | "hold" | "shut" | "blank";
export type MetopeHue = "" | "gilt" | "ash" | "pearl";
export type MetopeState = "" | "clear" | "set";
export type MetopeReview = "all" | "reviewed" | "fresh";
export type MetopeShape = "all" | "link" | "figure" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type MetopeValue = string | { tradingAccountId?: unknown; [key: string]: unknown } | null | undefined;
export type MetopeRow = { id: string; label: string; code: MetopeValue; userId?: string };
export type MetopeLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["link", "figure", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["LINK", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["SHUT", "MISS", "GONE", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function metopeRecord(raw: MetopeValue): { tradingAccountId?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function metopeBlocked(raw: MetopeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function metopeGiven(raw: MetopeValue): string {
  const row = metopeRecord(raw);
  if (row && !("tradingAccountId" in row)) return "";
  const value = row ? row.tradingAccountId : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LINK";
  if (value === false || value === "false" || value === "0" || value === 0) return "SHUT";
  return snip(value, 48);
}

function metopeReadable(raw: MetopeValue): boolean {
  if (metopeBlocked(raw)) return false;
  const row = metopeRecord(raw);
  if (row && !("tradingAccountId" in row)) return false;
  return true;
}

export function metopeState(raw: MetopeValue): MetopeState {
  if (!metopeReadable(raw)) return "";
  return metopeGiven(raw) ? "set" : "clear";
}

/** Word marks win first. A leading digit is a figure. Twenty-five or more is long. Under eight is short. A letter id of ordinary length is linked. */
export function metopeLane(raw: MetopeValue): MetopeLane {
  if (metopeState(raw) !== "set") return "";
  const text = metopeGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "link";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[0-9]/.test(text)) return "figure";
  if (text.length >= 25) return "long";
  if (text.length < 8) return "short";
  return "link";
}

export function metopeHue(raw: MetopeValue): MetopeHue {
  const mail = metopeLane(raw);
  if (!mail) return "";
  if (mail === "link") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function metopeLit(raw: MetopeValue): boolean {
  return metopeLane(raw) === "link";
}

export function metopeNear(raw: MetopeValue): boolean {
  return metopeLane(raw) === "figure";
}

export function metopeFar(raw: MetopeValue): boolean {
  return metopeLane(raw) === "short";
}

export function metopeFade(raw: MetopeValue): boolean {
  return metopeLane(raw) === "long";
}

export function metopeDark(raw: MetopeValue): boolean {
  return metopeLane(raw) === "shut";
}

export function metopeDim(raw: MetopeValue): boolean {
  return metopeLane(raw) === "hold";
}

export function metopeBlank(raw: MetopeValue): boolean {
  return metopeLane(raw) === "blank";
}

export function metopeOpen(raw: MetopeValue): boolean {
  return metopeState(raw) === "clear";
}

export function metopeLength(raw: MetopeValue): number | null {
  if (metopeState(raw) !== "set") return null;
  return metopeGiven(raw).length;
}

export function metopeEven(raw: MetopeValue): boolean {
  const length = metopeLength(raw);
  return length !== null && length % 2 === 0;
}

export function metopeDigit(raw: MetopeValue): boolean {
  return /[0-9]/.test(metopeGiven(raw));
}

export function metopeLetter(raw: MetopeValue): boolean {
  return /[A-Za-z]/.test(metopeGiven(raw));
}

export function metopeUpper(raw: MetopeValue): boolean {
  const text = metopeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function metopeCopy(raw: MetopeValue): string {
  return metopeGiven(raw);
}

export function metopeStamp(raw: MetopeValue): string {
  const text = metopeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function metopeLanes(rows: readonly MetopeRow[]): MetopeLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = metopeLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingMetope(rows: readonly MetopeRow[]): string {
  const lines = metopeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingMetopeHue(rows: readonly MetopeRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = metopeHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneMetopeCount(rows: readonly MetopeRow[], mail: MetopeLane): number {
  return rows.filter((row) => metopeLane(row.code) === mail).length;
}

export function metopeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentMetopeLanes(rows: readonly MetopeRow[]): string[] {
  return metopeLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenMetope(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedMetope(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleMetope(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleMetopeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMetopeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMetopeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: MetopeValue, shape: MetopeShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return metopeOpen(raw);
  if (shape === "digit") return metopeDigit(raw);
  if (shape === "letter") return metopeLetter(raw);
  if (shape === "even") return metopeEven(raw);
  if (shape === "upper") return metopeUpper(raw);
  return metopeLane(raw) === shape;
}

export function visibleMetope(
  rows: readonly MetopeRow[],
  mail: string,
  hue: string,
  query: string,
  review: MetopeReview,
  reviewed: readonly string[],
  shape: MetopeShape,
): MetopeRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = metopeLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && metopeHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${metopeCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function metopeLanesCsv(rows: readonly MetopeRow[]): string {
  const lines = ["lane,count"];
  for (const line of metopeLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function metopeRowsCsv(rows: readonly MetopeRow[], reviewed: readonly string[]): string {
  const lines = ["name,tradingAccountId,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(metopeCopy(row.code)), metopeLane(row.code), metopeHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
