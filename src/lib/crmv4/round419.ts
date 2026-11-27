/**
 * Washboard courses kept in this browser,
 * and gudgeon plates read the last seen time already stored on the account.
 * Orders are washboard, bobstay, jibboom, and skeg. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 12, or 24. Depths are 1, 3, or 6.
 * Washboard and bobstay are the warm half. Jibboom and skeg are the cool half.
 * Ivory is the quiet ground.
 * NOW, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait.
 * DROP, VOID, STOP, CLOSED, and BAN are shut.
 * CLEAR, NULL, EMPTY, MISS, and NEVER stay blank.
 * An AT- mark of seven letters is a code. An AT- mark of fourteen letters or more is long. Other AT- marks stay live.
 * Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds.
 * A true seen mark reads as NOW. A false mark reads as NEVER.
 * The secret is not read. Money fields are not read. The plate does not change the saved time.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_washboard_course (
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
 * CREATE TABLE crm_gudgeon_seen_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_gudgeon_seen_review (
 *   trader_id text primary key
 * );
 */


export const WSB_KEY = "crmv4-washboard-419";
export const WSB_VIEW_KEY = "crmv4-washboard-views-419";
export const WSB_DENSITY_KEY = "crmv4-washboard-density-419";
export const WSB_PROFILES = ["washboard", "bobstay", "jibboom", "skeg"] as const;

export type WashboardProfile = (typeof WSB_PROFILES)[number];
export type WashboardBed = "blank" | "ivory" | "graphite" | "gilt";
export type WashboardRack = "base" | "press" | "shelf";
export type WashboardDensity = "open" | "tight";
export type WashboardSort = "profile" | "hand";

export type Washboard = {
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

export type WashboardView = {
  id: string;
  name: string;
  rack: WashboardRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type WashboardCounts = {
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

export const ROUND419_FEATURES = [
  "washboard-save",
  "washboard-reminders",
  "washboard-orders",
  "washboard-search",
  "washboard-hour-sla",
  "washboard-case",
  "washboard-pin",
  "washboard-inline-title",
  "washboard-filters",
  "saved-washboard-views",
  "washboard-density",
  "washboard-focus",
  "washboard-kpis",
  "washboard-chart",
  "washboard-timeline",
  "washboard-bulk",
  "washboard-csv",
  "washboard-keys",
  "washboard-audit",
  "quietest-washboard-hand",
  "washboard-viewer",
  "suggest-washboard",
  "overdue-washboard",
  "gudgeon-panels",
  "gudgeon-seen-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 12, 24] as const;
const DEPTH_CYCLE = [1, 3, 6] as const;
const WARM = new Set(["washboard", "bobstay"]);
const COOL = new Set(["jibboom", "skeg"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): WashboardRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<WashboardBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<WashboardBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[cv]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Washboard, rack: WashboardRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return WSB_PROFILES.indexOf(profile as WashboardProfile);
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
  return (WSB_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 12, or 24. Anything else stays blank. */
export function washboardHour(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A depth is 1, 3, or 6. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 3 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "6") return null;
  return Number(text) as 1 | 3 | 6;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function washboardBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Washboard is first. Bobstay is second. Jibboom is third. Skeg is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "washboard") return "first";
  if (text === "bobstay") return "second";
  if (text === "jibboom") return "third";
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
  return QUIET_BED.has(washboardBed(bed));
}

/** A pair depth is 3. One and six are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 3;
}

/** A full depth is 6. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 6;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = washboardHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = washboardBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveWashboardFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestWashboardBed(cards: readonly Washboard[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "base") || !card.bed) continue;
    counts.set(card.bed, (counts.get(card.bed) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const bed of ["IVORY", "GRAPHITE", "GILT"]) {
    const count = counts.get(bed) || 0;
    if (count < score) {
      best = bed;
      score = count;
    }
  }
  return best;
}

/** Before three, suggest three. Before six, suggest six. Before twelve, suggest twelve. Later, suggest twenty-four. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestWashboardHour(cards: readonly Washboard[], hour: number): 3 | 6 | 12 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 12 | 24 = 3;
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
  if (hour < 3) return 3;
  if (hour < 6) return 6;
  if (hour < 12) return 12;
  return 24;
}

export function suggestProfile(hour: number): WashboardProfile {
  if (hour < 3) return "washboard";
  if (hour < 6) return "bobstay";
  if (hour < 12) return "jibboom";
  return "skeg";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Washboard[], roster: string): string {
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

export function readWashboardList(raw: unknown): Washboard[] {
  if (!Array.isArray(raw)) return [];
  const out: Washboard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Washboard>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: washboardHour(row.hour),
      bed: washboardBed(row.bed),
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

export function addWashboard(
  cards: readonly Washboard[],
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
): Washboard[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readWashboardList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: washboardHour(card.hour),
      bed: washboardBed(card.bed),
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

function mapCard(cards: readonly Washboard[], id: string, edit: (card: Washboard) => Washboard): Washboard[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editWashboard(cards: readonly Washboard[], id: string, title: string): Washboard[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editWashboardNote(cards: readonly Washboard[], id: string, note: string): Washboard[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(washboardBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setWashboardBed(cards: readonly Washboard[], id: string, bed: string): Washboard[] {
  const next = washboardBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setWashboardRaised(cards: readonly Washboard[], id: string, raised: boolean): Washboard[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setWashboardRack(cards: readonly Washboard[], id: string, pressed: boolean): Washboard[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setWashboardShelf(cards: readonly Washboard[], id: string, shelved: boolean): Washboard[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setWashboardPin(cards: readonly Washboard[], id: string, pinned: boolean): Washboard[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addWashboardTag(cards: readonly Washboard[], id: string, tag: string): Washboard[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 12 | 24 {
  if (hour === null) return dir > 0 ? 3 : 24;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 1 | 3 | 6 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setWashboardFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackWashboardFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return setWashboardRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinWashboardFocused(cards: readonly Washboard[], id: string): Washboard[] {
  return setWashboardPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Washboard[], id: string): Washboard[] {
  const card = cards.find((item) => item.id === id);
  return card ? setWashboardBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Washboard[], ids: readonly string[], edit: (card: Washboard) => Washboard): Washboard[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkWashboardLinen(cards: readonly Washboard[], ids: readonly string[]): Washboard[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkWashboardRaise(cards: readonly Washboard[], ids: readonly string[]): Washboard[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkWashboardShelf(cards: readonly Washboard[], ids: readonly string[]): Washboard[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkWashboardTag(cards: readonly Washboard[], ids: readonly string[]): Washboard[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readWashboardViews(raw: unknown): WashboardView[] {
  if (!Array.isArray(raw)) return [];
  const out: WashboardView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WashboardView>;
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

export function addWashboardView(views: readonly WashboardView[], view: WashboardView): WashboardView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readWashboardViews([...views, { ...view, name }]);
}

export function dropWashboardView(views: readonly WashboardView[], id: string): WashboardView[] {
  return views.filter((view) => view.id !== id);
}

export function washboardDensity(raw: unknown): WashboardDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortWashboardList(cards: readonly Washboard[], sort: WashboardSort): Washboard[] {
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

export function visibleWashboardList(
  cards: readonly Washboard[],
  rack: WashboardRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Washboard[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : washboardBed(bed);
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

/** A skeg at depth one, still not raised and not shelved, is overdue. */
export function overdueWashboard(card: Washboard): boolean {
  return card.profile === "skeg" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the yard. */
export function idleWashboard(card: Washboard): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Ivory, twenty-four hours, and a full depth, still off the shelf. */
export function briskWashboard(card: Washboard): boolean {
  return card.bed === "IVORY" && card.hour === 24 && card.depth === 6 && !card.shelved;
}

/** Jibboom, gilt, and six hours. */
export function restingWashboard(card: Washboard): boolean {
  return card.profile === "jibboom" && card.bed === "GILT" && card.hour === 6;
}

/** An washboard is late when the station is already skeg. */
export function lateWashboard(card: Washboard, station: string): boolean {
  return card.profile === "washboard" && profilePoint(station) === "skeg" && !card.raised;
}

export function washboardCounts(cards: readonly Washboard[], shown: readonly Washboard[], station: string): WashboardCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 24).length,
    quiet: cards.filter((card) => ivoryQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleWashboard).length,
    brisk: cards.filter(briskWashboard).length,
    resting: cards.filter(restingWashboard).length,
    overdue: cards.filter(overdueWashboard).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateWashboard(card, station)).length,
  };
}

export function washboardBars(cards: readonly Washboard[]): { profile: string; count: number }[] {
  return WSB_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function washboardTimeline(cards: readonly Washboard[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function washboardHands(cards: readonly Washboard[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Washboard[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of washboardHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderWashboardList(cards: readonly Washboard[]): string[] {
  return cards.filter(overdueWashboard).map((card) => card.title);
}

export function washboardCopy(card: Washboard): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function washboardCsv(cards: readonly Washboard[], station: string): string {
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
        lateWashboard(card, station) ? "1" : "0",
        idleWashboard(card) ? "1" : "0",
        briskWashboard(card) ? "1" : "0",
        restingWashboard(card) ? "1" : "0",
        overdueWashboard(card) ? "1" : "0",
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


export const GDG_HIDE_KEY = "crmv4-gudgeon-hide-419";
export const GDG_REVIEW_KEY = "crmv4-gudgeon-review-419";

export type GudgeonLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type GudgeonHue = "" | "gilt" | "ash" | "pearl";
export type GudgeonState = "" | "clear" | "set";
export type GudgeonReview = "all" | "reviewed" | "fresh";
export type GudgeonShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type GudgeonValue = string | { lastSeenAt?: unknown; [key: string]: unknown } | null | undefined;
export type GudgeonRow = { id: string; label: string; code: GudgeonValue; userId?: string };
export type GudgeonLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["NOW", "OPEN", "LIVE", "GOLD", "ON"]);
const HOLD_TITLES = new Set(["QUEUE", "LATER", "SOFT", "PAUSE", "STAY"]);
const SHUT_TITLES = new Set(["DROP", "VOID", "STOP", "CLOSED", "BAN"]);
const BLANK_TITLES = new Set(["CLEAR", "NULL", "EMPTY", "MISS", "NEVER"]);

function gudgeonRecord(raw: GudgeonValue): { lastSeenAt?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function gudgeonBlocked(raw: GudgeonValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function gudgeonGiven(raw: GudgeonValue): string {
  const row = gudgeonRecord(raw);
  if (row && !("lastSeenAt" in row)) return "";
  const value = row ? row.lastSeenAt : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NOW";
  if (value === false || value === "false" || value === "0" || value === 0) return "NEVER";
  return snip(value, 48);
}

function gudgeonReadable(raw: GudgeonValue): boolean {
  if (gudgeonBlocked(raw)) return false;
  const row = gudgeonRecord(raw);
  if (row && !("lastSeenAt" in row)) return false;
  return true;
}


export function gudgeonSlice(raw: unknown): GudgeonValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("lastSeenAt" in row)) return { lastSeenAt: "" };
  const value = row.lastSeenAt;
  if (typeof value === "string") return { lastSeenAt: snip(value, 48) };
  return { lastSeenAt: value as never };
}

export function gudgeonState(raw: GudgeonValue): GudgeonState {
  if (!gudgeonReadable(raw)) return "";
  return gudgeonGiven(raw) ? "set" : "clear";
}

/** Word marks win first. NOW, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait. DROP, VOID, STOP, CLOSED, and BAN are shut. CLEAR, NULL, EMPTY, MISS, and NEVER stay blank. An AT- mark of seven letters is a code. An AT- mark of fourteen letters or more is long. Any other AT- mark is live. Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds. */
export function gudgeonLane(raw: GudgeonValue): GudgeonLane {
  if (gudgeonState(raw) !== "set") return "";
  const text = gudgeonGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("AT-") && text.length === 7) return "code";
  if (upper.startsWith("AT-") && text.length >= 14) return "long";
  if (upper.startsWith("AT-")) return "live";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length === 1) return "short";
  if (text.length >= 14) return "long";
  return "hold";
}

export function gudgeonHue(raw: GudgeonValue): GudgeonHue {
  const mail = gudgeonLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function gudgeonLit(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "live";
}

export function gudgeonNear(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "code";
}

export function gudgeonFar(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "short";
}

export function gudgeonFade(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "long";
}

export function gudgeonDark(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "shut";
}

export function gudgeonDim(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "hold";
}

export function gudgeonBlank(raw: GudgeonValue): boolean {
  return gudgeonLane(raw) === "blank";
}

export function gudgeonOpen(raw: GudgeonValue): boolean {
  return gudgeonState(raw) === "clear";
}

export function gudgeonLength(raw: GudgeonValue): number | null {
  if (gudgeonState(raw) !== "set") return null;
  return gudgeonGiven(raw).length;
}

export function gudgeonEven(raw: GudgeonValue): boolean {
  const length = gudgeonLength(raw);
  return length !== null && length % 2 === 0;
}

export function gudgeonDigit(raw: GudgeonValue): boolean {
  return /[0-9]/.test(gudgeonGiven(raw));
}

export function gudgeonLetter(raw: GudgeonValue): boolean {
  return /[A-Za-z]/.test(gudgeonGiven(raw));
}

export function gudgeonUpper(raw: GudgeonValue): boolean {
  const text = gudgeonGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function gudgeonCopy(raw: GudgeonValue): string {
  return gudgeonGiven(raw);
}

export function gudgeonStamp(raw: GudgeonValue): string {
  const text = gudgeonGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function gudgeonLanes(rows: readonly GudgeonRow[]): GudgeonLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = gudgeonLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingGudgeon(rows: readonly GudgeonRow[]): string {
  const lines = gudgeonLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingGudgeonHue(rows: readonly GudgeonRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = gudgeonHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneGudgeonCount(rows: readonly GudgeonRow[], mail: GudgeonLane): number {
  return rows.filter((row) => gudgeonLane(row.code) === mail).length;
}

export function gudgeonShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGudgeonLanes(rows: readonly GudgeonRow[]): string[] {
  return gudgeonLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenGudgeon(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGudgeon(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGudgeon(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleGudgeonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGudgeonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGudgeonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: GudgeonValue, shape: GudgeonShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return gudgeonOpen(raw);
  if (shape === "digit") return gudgeonDigit(raw);
  if (shape === "letter") return gudgeonLetter(raw);
  if (shape === "even") return gudgeonEven(raw);
  if (shape === "upper") return gudgeonUpper(raw);
  return gudgeonLane(raw) === shape;
}

export function visibleGudgeon(
  rows: readonly GudgeonRow[],
  mail: string,
  hue: string,
  query: string,
  review: GudgeonReview,
  reviewed: readonly string[],
  shape: GudgeonShape,
): GudgeonRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = gudgeonLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && gudgeonHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${gudgeonCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function gudgeonLanesCsv(rows: readonly GudgeonRow[]): string {
  const lines = ["lane,count"];
  for (const line of gudgeonLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function gudgeonRowsCsv(rows: readonly GudgeonRow[], reviewed: readonly string[]): string {
  const lines = ["name,seen,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(gudgeonCopy(row.code)), gudgeonLane(row.code), gudgeonHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
