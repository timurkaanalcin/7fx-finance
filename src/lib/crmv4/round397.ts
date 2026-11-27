/**
 * Caisson coffers kept in this browser,
 * and impost plates read the desk already stored on the account.
 * Orders are caisson, lacunar, pane, and rib. Grounds are ivory, graphite, and champagne.
 * Hours are 3, 6, 10, or 16. Depths are 1, 4, or 7.
 * Caisson and lacunar are the warm half. Pane and rib are the cool half.
 * Graphite is the quiet ground.
 * A desk with a hyphen and ordinary length is a bay. Under six letters is short. Eighteen or more is long.
 * A leading digit of two to four is a code. One digit is short. Five digits or more is long.
 * A word without a hyphen shorter than four letters is short. Fourteen or longer is long. Anything else holds.
 * Desk, live, and open are bays. Hold, pause, and wait hold.
 * Off, void, shut, and drop are shut. None, blank, empty, and clear stay blank.
 * A true desk reads as DESK. A false desk reads as OFF.
 * Money fields are not read. The plate does not change the saved desk.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_caisson_coffer (
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
 * CREATE TABLE crm_impost_desk_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_impost_desk_review (
 *   trader_id text primary key
 * );
 */
export const CSN_KEY = "crmv4-caisson-397";
export const CSN_VIEW_KEY = "crmv4-caisson-views-397";
export const CSN_DENSITY_KEY = "crmv4-caisson-density-397";
export const CSN_PROFILES = ["caisson", "lacunar", "pane", "rib"] as const;

export type CaissonProfile = (typeof CSN_PROFILES)[number];
export type CaissonBed = "blank" | "ivory" | "graphite" | "champagne";
export type CaissonRack = "yard" | "press" | "shelf";
export type CaissonDensity = "open" | "tight";
export type CaissonSort = "profile" | "hand";

export type Caisson = {
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

export type CaissonView = {
  id: string;
  name: string;
  rack: CaissonRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type CaissonCounts = {
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

export const ROUND397_FEATURES = [
  "caisson-save",
  "caisson-reminders",
  "caisson-orders",
  "caisson-search",
  "caisson-hour-sla",
  "caisson-case",
  "caisson-pin",
  "caisson-inline-title",
  "caisson-filters",
  "saved-caisson-views",
  "caisson-density",
  "caisson-focus",
  "caisson-kpis",
  "caisson-chart",
  "caisson-timeline",
  "caisson-bulk",
  "caisson-csv",
  "caisson-keys",
  "caisson-audit",
  "quietest-caisson-hand",
  "caisson-viewer",
  "suggest-caisson",
  "overdue-caisson",
  "impost-panels",
  "impost-desk-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [3, 6, 10, 16] as const;
const DEPTH_CYCLE = [1, 4, 7] as const;
const WARM = new Set(["caisson", "lacunar"]);
const COOL = new Set(["pane", "rib"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): CaissonRack {
  return raw === "press" || raw === "shelf" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<CaissonBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<CaissonBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[cn]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Caisson, rack: CaissonRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return CSN_PROFILES.indexOf(profile as CaissonProfile);
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
  return (CSN_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 10, or 16. Anything else stays blank. */
export function caissonHour(raw: unknown): 3 | 6 | 10 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "10" && text !== "16") return null;
  return Number(text) as 3 | 6 | 10 | 16;
}

/** A depth is 1, 4, or 7. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 4 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "7") return null;
  return Number(text) as 1 | 4 | 7;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function caissonBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Caisson is first. Lacunar is second. Pane is third. Rib is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "caisson") return "first";
  if (text === "lacunar") return "second";
  if (text === "pane") return "third";
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
  return QUIET_BED.has(caissonBed(bed));
}

/** A pair depth is 4. One and seven are not a pair. */
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
  const hour = caissonHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = caissonBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveCaissonFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestCaissonBed(cards: readonly Caisson[]): string {
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

/** Before seven, suggest three. Before twelve, suggest six. Before eighteen, suggest ten. Later, suggest sixteen. A saved hour on the bay wins, and a tie keeps the shorter hour. */
export function suggestCaissonHour(cards: readonly Caisson[], hour: number): 3 | 6 | 10 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "yard") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 10 | 16 = 3;
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
  if (hour < 12) return 6;
  if (hour < 18) return 10;
  return 16;
}

export function suggestProfile(hour: number): CaissonProfile {
  if (hour < 7) return "caisson";
  if (hour < 12) return "lacunar";
  if (hour < 18) return "pane";
  return "rib";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Caisson[], roster: string): string {
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

export function readCaissonList(raw: unknown): Caisson[] {
  if (!Array.isArray(raw)) return [];
  const out: Caisson[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Caisson>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: caissonHour(row.hour),
      bed: caissonBed(row.bed),
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

export function addCaisson(
  cards: readonly Caisson[],
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
): Caisson[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCaissonList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: caissonHour(card.hour),
      bed: caissonBed(card.bed),
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

function mapCard(cards: readonly Caisson[], id: string, edit: (card: Caisson) => Caisson): Caisson[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCaisson(cards: readonly Caisson[], id: string, title: string): Caisson[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCaissonNote(cards: readonly Caisson[], id: string, note: string): Caisson[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(caissonBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setCaissonBed(cards: readonly Caisson[], id: string, bed: string): Caisson[] {
  const next = caissonBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setCaissonRaised(cards: readonly Caisson[], id: string, raised: boolean): Caisson[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCaissonRack(cards: readonly Caisson[], id: string, pressed: boolean): Caisson[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setCaissonShelf(cards: readonly Caisson[], id: string, shelved: boolean): Caisson[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setCaissonPin(cards: readonly Caisson[], id: string, pinned: boolean): Caisson[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addCaissonTag(cards: readonly Caisson[], id: string, tag: string): Caisson[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 10 | 16 {
  if (hour === null) return dir > 0 ? 3 : 16;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 1 | 4 | 7 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setCaissonFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackCaissonFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return setCaissonRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinCaissonFocused(cards: readonly Caisson[], id: string): Caisson[] {
  return setCaissonPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Caisson[], id: string): Caisson[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCaissonBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Caisson[], ids: readonly string[], edit: (card: Caisson) => Caisson): Caisson[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCaissonLinen(cards: readonly Caisson[], ids: readonly string[]): Caisson[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkCaissonRaise(cards: readonly Caisson[], ids: readonly string[]): Caisson[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCaissonShelf(cards: readonly Caisson[], ids: readonly string[]): Caisson[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkCaissonTag(cards: readonly Caisson[], ids: readonly string[]): Caisson[] {
  return bulk(cards, ids, (card) => (card.tags.includes("n") ? card : { ...card, tags: tagsOf([...card.tags, "n"]), audit: "tag" }));
}

export function readCaissonViews(raw: unknown): CaissonView[] {
  if (!Array.isArray(raw)) return [];
  const out: CaissonView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CaissonView>;
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

export function addCaissonView(views: readonly CaissonView[], view: CaissonView): CaissonView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCaissonViews([...views, { ...view, name }]);
}

export function dropCaissonView(views: readonly CaissonView[], id: string): CaissonView[] {
  return views.filter((view) => view.id !== id);
}

export function caissonDensity(raw: unknown): CaissonDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCaissonList(cards: readonly Caisson[], sort: CaissonSort): Caisson[] {
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

export function visibleCaissonList(
  cards: readonly Caisson[],
  rack: CaissonRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Caisson[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : caissonBed(bed);
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
export function overdueCaisson(card: Caisson): boolean {
  return card.profile === "rib" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idleCaisson(card: Caisson): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, sixteen hours, and a full depth, still off the loft. */
export function briskCaisson(card: Caisson): boolean {
  return card.bed === "GRAPHITE" && card.hour === 16 && card.depth === 7 && !card.shelved;
}

/** Pane, ivory, and six hours. */
export function restingCaisson(card: Caisson): boolean {
  return card.profile === "pane" && card.bed === "IVORY" && card.hour === 6;
}

/** A caisson is late when the station is already rib. */
export function lateCaisson(card: Caisson, station: string): boolean {
  return card.profile === "caisson" && profilePoint(station) === "rib" && !card.raised;
}

export function caissonCounts(cards: readonly Caisson[], shown: readonly Caisson[], station: string): CaissonCounts {
  return {
    yard: cards.filter((card) => inRack(card, "yard")).length,
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
    idle: cards.filter(idleCaisson).length,
    brisk: cards.filter(briskCaisson).length,
    resting: cards.filter(restingCaisson).length,
    overdue: cards.filter(overdueCaisson).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateCaisson(card, station)).length,
  };
}

export function caissonBars(cards: readonly Caisson[]): { profile: string; count: number }[] {
  return CSN_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function caissonTimeline(cards: readonly Caisson[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "yard"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function caissonHands(cards: readonly Caisson[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Caisson[]): string {
  const open = cards.filter((card) => inRack(card, "yard") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of caissonHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCaissonList(cards: readonly Caisson[]): string[] {
  return cards.filter(overdueCaisson).map((card) => card.title);
}

export function caissonCopy(card: Caisson): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function caissonCsv(cards: readonly Caisson[], station: string): string {
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
        lateCaisson(card, station) ? "1" : "0",
        idleCaisson(card) ? "1" : "0",
        briskCaisson(card) ? "1" : "0",
        restingCaisson(card) ? "1" : "0",
        overdueCaisson(card) ? "1" : "0",
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


export const IMP_HIDE_KEY = "crmv4-impost-hide-397";
export const IMP_REVIEW_KEY = "crmv4-impost-review-397";

export type ImpostLane = "" | "bay" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type ImpostHue = "" | "gilt" | "ash" | "pearl";
export type ImpostState = "" | "clear" | "set";
export type ImpostReview = "all" | "reviewed" | "fresh";
export type ImpostShape = "all" | "bay" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type ImpostValue = string | { desk?: unknown; [key: string]: unknown } | null | undefined;
export type ImpostRow = { id: string; label: string; code: ImpostValue; userId?: string };
export type ImpostLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["bay", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["DESK", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function impostRecord(raw: ImpostValue): { desk?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function impostBlocked(raw: ImpostValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function impostGiven(raw: ImpostValue): string {
  const row = impostRecord(raw);
  if (row && !("desk" in row)) return "";
  const value = row ? row.desk : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "DESK";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function impostReadable(raw: ImpostValue): boolean {
  if (impostBlocked(raw)) return false;
  const row = impostRecord(raw);
  if (row && !("desk" in row)) return false;
  return true;
}

export function impostState(raw: ImpostValue): ImpostState {
  if (!impostReadable(raw)) return "";
  return impostGiven(raw) ? "set" : "clear";
}

/** Word marks win first. A hyphenated desk under six letters is short. Eighteen or more is long. An ordinary hyphenated desk is a bay. A leading digit of two to four is a code. One digit is short. Five digits or more is long. A word without a hyphen under four letters is short. Fourteen or more is long. Anything else holds. */
export function impostLane(raw: ImpostValue): ImpostLane {
  if (impostState(raw) !== "set") return "";
  const text = impostGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "bay";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (text.includes("-")) {
    if (text.length < 6) return "short";
    if (text.length >= 18) return "long";
    return "bay";
  }
  if (/^[0-9]/.test(text)) {
    if (text.length <= 1) return "short";
    if (text.length <= 4) return "code";
    return "long";
  }
  if (text.length >= 14) return "long";
  if (text.length < 4) return "short";
  return "hold";
}

export function impostHue(raw: ImpostValue): ImpostHue {
  const mail = impostLane(raw);
  if (!mail) return "";
  if (mail === "bay") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function impostLit(raw: ImpostValue): boolean {
  return impostLane(raw) === "bay";
}

export function impostNear(raw: ImpostValue): boolean {
  return impostLane(raw) === "code";
}

export function impostFar(raw: ImpostValue): boolean {
  return impostLane(raw) === "short";
}

export function impostFade(raw: ImpostValue): boolean {
  return impostLane(raw) === "long";
}

export function impostDark(raw: ImpostValue): boolean {
  return impostLane(raw) === "shut";
}

export function impostDim(raw: ImpostValue): boolean {
  return impostLane(raw) === "hold";
}

export function impostBlank(raw: ImpostValue): boolean {
  return impostLane(raw) === "blank";
}

export function impostOpen(raw: ImpostValue): boolean {
  return impostState(raw) === "clear";
}

export function impostLength(raw: ImpostValue): number | null {
  if (impostState(raw) !== "set") return null;
  return impostGiven(raw).length;
}

export function impostEven(raw: ImpostValue): boolean {
  const length = impostLength(raw);
  return length !== null && length % 2 === 0;
}

export function impostDigit(raw: ImpostValue): boolean {
  return /[0-9]/.test(impostGiven(raw));
}

export function impostLetter(raw: ImpostValue): boolean {
  return /[A-Za-z]/.test(impostGiven(raw));
}

export function impostUpper(raw: ImpostValue): boolean {
  const text = impostGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function impostCopy(raw: ImpostValue): string {
  return impostGiven(raw);
}

export function impostStamp(raw: ImpostValue): string {
  const text = impostGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function impostLanes(rows: readonly ImpostRow[]): ImpostLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = impostLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingImpost(rows: readonly ImpostRow[]): string {
  const lines = impostLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingImpostHue(rows: readonly ImpostRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = impostHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneImpostCount(rows: readonly ImpostRow[], mail: ImpostLane): number {
  return rows.filter((row) => impostLane(row.code) === mail).length;
}

export function impostShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentImpostLanes(rows: readonly ImpostRow[]): string[] {
  return impostLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenImpost(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedImpost(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleImpost(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleImpostReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkImpostReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleImpostLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: ImpostValue, shape: ImpostShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return impostOpen(raw);
  if (shape === "digit") return impostDigit(raw);
  if (shape === "letter") return impostLetter(raw);
  if (shape === "even") return impostEven(raw);
  if (shape === "upper") return impostUpper(raw);
  return impostLane(raw) === shape;
}

export function visibleImpost(
  rows: readonly ImpostRow[],
  mail: string,
  hue: string,
  query: string,
  review: ImpostReview,
  reviewed: readonly string[],
  shape: ImpostShape,
): ImpostRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = impostLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && impostHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${impostCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function impostLanesCsv(rows: readonly ImpostRow[]): string {
  const lines = ["lane,count"];
  for (const line of impostLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function impostRowsCsv(rows: readonly ImpostRow[], reviewed: readonly string[]): string {
  const lines = ["name,desk,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(impostCopy(row.code)), impostLane(row.code), impostHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
