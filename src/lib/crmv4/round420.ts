/**
 * Gunwale courses kept in this browser,
 * and fairlead plates read the desk default email already stored.
 * Orders are gunwale, bulwark, stanchion, and capstan. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 12, or 24. Depths are 1, 3, or 6.
 * Gunwale and bulwark are the warm half. Stanchion and capstan are the cool half.
 * Ivory is the quiet ground.
 * NOW, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait.
 * DROP, VOID, STOP, CLOSED, and BAN are shut.
 * CLEAR, NULL, EMPTY, MISS, and NEVER stay blank.
 * An AT- mark of seven letters is a code. An AT- mark of fourteen letters or more is long. Other AT- marks stay live.
 * Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds.
 * A true mail mark reads as NOW. A false mark reads as NEVER.
 * The secret is not read. Money fields are not read. The plate does not change the saved email.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_gunwale_course (
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
 * CREATE TABLE crm_fairlead_mail_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_fairlead_mail_review (
 *   trader_id text primary key
 * );
 */


export const GNW_KEY = "crmv4-gunwale-420";
export const GNW_VIEW_KEY = "crmv4-gunwale-views-420";
export const GNW_DENSITY_KEY = "crmv4-gunwale-density-420";
export const GNW_PROFILES = ["gunwale", "bulwark", "stanchion", "capstan"] as const;

export type GunwaleProfile = (typeof GNW_PROFILES)[number];
export type GunwaleBed = "blank" | "ivory" | "graphite" | "gilt";
export type GunwaleRack = "base" | "press" | "shelf";
export type GunwaleDensity = "open" | "tight";
export type GunwaleSort = "profile" | "hand";

export type Gunwale = {
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

export type GunwaleView = {
  id: string;
  name: string;
  rack: GunwaleRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type GunwaleCounts = {
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

export const ROUND420_FEATURES = [
  "gunwale-save",
  "gunwale-reminders",
  "gunwale-orders",
  "gunwale-search",
  "gunwale-hour-sla",
  "gunwale-case",
  "gunwale-pin",
  "gunwale-inline-title",
  "gunwale-filters",
  "saved-gunwale-views",
  "gunwale-density",
  "gunwale-focus",
  "gunwale-kpis",
  "gunwale-chart",
  "gunwale-timeline",
  "gunwale-bulk",
  "gunwale-csv",
  "gunwale-keys",
  "gunwale-audit",
  "quietest-gunwale-hand",
  "gunwale-viewer",
  "suggest-gunwale",
  "overdue-gunwale",
  "fairlead-panels",
  "fairlead-mail-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 12, 24] as const;
const DEPTH_CYCLE = [1, 3, 6] as const;
const WARM = new Set(["gunwale", "bulwark"]);
const COOL = new Set(["stanchion", "capstan"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): GunwaleRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<GunwaleBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<GunwaleBed, "blank">) : "";
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

function inRack(card: Gunwale, rack: GunwaleRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return GNW_PROFILES.indexOf(profile as GunwaleProfile);
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
  return (GNW_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 12, or 24. Anything else stays blank. */
export function gunwaleHour(raw: unknown): 3 | 6 | 12 | 24 | null {
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
export function gunwaleBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Gunwale is first. Bulwark is second. Stanchion is third. Capstan is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "gunwale") return "first";
  if (text === "bulwark") return "second";
  if (text === "stanchion") return "third";
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
  return QUIET_BED.has(gunwaleBed(bed));
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
  const hour = gunwaleHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = gunwaleBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveGunwaleFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestGunwaleBed(cards: readonly Gunwale[]): string {
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
export function suggestGunwaleHour(cards: readonly Gunwale[], hour: number): 3 | 6 | 12 | 24 {
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

export function suggestProfile(hour: number): GunwaleProfile {
  if (hour < 3) return "gunwale";
  if (hour < 6) return "bulwark";
  if (hour < 12) return "stanchion";
  return "capstan";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Gunwale[], roster: string): string {
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

export function readGunwaleList(raw: unknown): Gunwale[] {
  if (!Array.isArray(raw)) return [];
  const out: Gunwale[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Gunwale>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: gunwaleHour(row.hour),
      bed: gunwaleBed(row.bed),
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

export function addGunwale(
  cards: readonly Gunwale[],
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
): Gunwale[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGunwaleList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: gunwaleHour(card.hour),
      bed: gunwaleBed(card.bed),
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

function mapCard(cards: readonly Gunwale[], id: string, edit: (card: Gunwale) => Gunwale): Gunwale[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGunwale(cards: readonly Gunwale[], id: string, title: string): Gunwale[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGunwaleNote(cards: readonly Gunwale[], id: string, note: string): Gunwale[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(gunwaleBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setGunwaleBed(cards: readonly Gunwale[], id: string, bed: string): Gunwale[] {
  const next = gunwaleBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setGunwaleRaised(cards: readonly Gunwale[], id: string, raised: boolean): Gunwale[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setGunwaleRack(cards: readonly Gunwale[], id: string, pressed: boolean): Gunwale[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setGunwaleShelf(cards: readonly Gunwale[], id: string, shelved: boolean): Gunwale[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setGunwalePin(cards: readonly Gunwale[], id: string, pinned: boolean): Gunwale[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addGunwaleTag(cards: readonly Gunwale[], id: string, tag: string): Gunwale[] {
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

export function raiseHourFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setGunwaleFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackGunwaleFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return setGunwaleRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinGunwaleFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  return setGunwalePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Gunwale[], id: string): Gunwale[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGunwaleBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Gunwale[], ids: readonly string[], edit: (card: Gunwale) => Gunwale): Gunwale[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGunwaleLinen(cards: readonly Gunwale[], ids: readonly string[]): Gunwale[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkGunwaleRaise(cards: readonly Gunwale[], ids: readonly string[]): Gunwale[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkGunwaleShelf(cards: readonly Gunwale[], ids: readonly string[]): Gunwale[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkGunwaleTag(cards: readonly Gunwale[], ids: readonly string[]): Gunwale[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readGunwaleViews(raw: unknown): GunwaleView[] {
  if (!Array.isArray(raw)) return [];
  const out: GunwaleView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GunwaleView>;
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

export function addGunwaleView(views: readonly GunwaleView[], view: GunwaleView): GunwaleView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGunwaleViews([...views, { ...view, name }]);
}

export function dropGunwaleView(views: readonly GunwaleView[], id: string): GunwaleView[] {
  return views.filter((view) => view.id !== id);
}

export function gunwaleDensity(raw: unknown): GunwaleDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortGunwaleList(cards: readonly Gunwale[], sort: GunwaleSort): Gunwale[] {
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

export function visibleGunwaleList(
  cards: readonly Gunwale[],
  rack: GunwaleRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Gunwale[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : gunwaleBed(bed);
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

/** A capstan at depth one, still not raised and not shelved, is overdue. */
export function overdueGunwale(card: Gunwale): boolean {
  return card.profile === "capstan" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the yard. */
export function idleGunwale(card: Gunwale): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Ivory, twenty-four hours, and a full depth, still off the shelf. */
export function briskGunwale(card: Gunwale): boolean {
  return card.bed === "IVORY" && card.hour === 24 && card.depth === 6 && !card.shelved;
}

/** Stanchion, gilt, and six hours. */
export function restingGunwale(card: Gunwale): boolean {
  return card.profile === "stanchion" && card.bed === "GILT" && card.hour === 6;
}

/** An gunwale is late when the station is already capstan. */
export function lateGunwale(card: Gunwale, station: string): boolean {
  return card.profile === "gunwale" && profilePoint(station) === "capstan" && !card.raised;
}

export function gunwaleCounts(cards: readonly Gunwale[], shown: readonly Gunwale[], station: string): GunwaleCounts {
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
    idle: cards.filter(idleGunwale).length,
    brisk: cards.filter(briskGunwale).length,
    resting: cards.filter(restingGunwale).length,
    overdue: cards.filter(overdueGunwale).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateGunwale(card, station)).length,
  };
}

export function gunwaleBars(cards: readonly Gunwale[]): { profile: string; count: number }[] {
  return GNW_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function gunwaleTimeline(cards: readonly Gunwale[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function gunwaleHands(cards: readonly Gunwale[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Gunwale[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of gunwaleHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGunwaleList(cards: readonly Gunwale[]): string[] {
  return cards.filter(overdueGunwale).map((card) => card.title);
}

export function gunwaleCopy(card: Gunwale): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function gunwaleCsv(cards: readonly Gunwale[], station: string): string {
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
        lateGunwale(card, station) ? "1" : "0",
        idleGunwale(card) ? "1" : "0",
        briskGunwale(card) ? "1" : "0",
        restingGunwale(card) ? "1" : "0",
        overdueGunwale(card) ? "1" : "0",
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


export const FRL_HIDE_KEY = "crmv4-fairlead-hide-420";
export const FRL_REVIEW_KEY = "crmv4-fairlead-review-420";

export type FairleadLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type FairleadHue = "" | "gilt" | "ash" | "pearl";
export type FairleadState = "" | "clear" | "set";
export type FairleadReview = "all" | "reviewed" | "fresh";
export type FairleadShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type FairleadValue = string | { defaultEmail?: unknown; [key: string]: unknown } | null | undefined;
export type FairleadRow = { id: string; label: string; code: FairleadValue; userId?: string };
export type FairleadLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["NOW", "OPEN", "LIVE", "GOLD", "ON"]);
const HOLD_TITLES = new Set(["QUEUE", "LATER", "SOFT", "PAUSE", "STAY"]);
const SHUT_TITLES = new Set(["DROP", "VOID", "STOP", "CLOSED", "BAN"]);
const BLANK_TITLES = new Set(["CLEAR", "NULL", "EMPTY", "MISS", "NEVER"]);

function fairleadRecord(raw: FairleadValue): { defaultEmail?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function fairleadBlocked(raw: FairleadValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function fairleadGiven(raw: FairleadValue): string {
  const row = fairleadRecord(raw);
  if (row && !("defaultEmail" in row)) return "";
  const value = row ? row.defaultEmail : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NOW";
  if (value === false || value === "false" || value === "0" || value === 0) return "NEVER";
  return snip(value, 48);
}

function fairleadReadable(raw: FairleadValue): boolean {
  if (fairleadBlocked(raw)) return false;
  const row = fairleadRecord(raw);
  if (row && !("defaultEmail" in row)) return false;
  return true;
}


export function fairleadSlice(raw: unknown): FairleadValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("defaultEmail" in row)) return { defaultEmail: "" };
  const value = row.defaultEmail;
  if (typeof value === "string") return { defaultEmail: snip(value, 48) };
  return { defaultEmail: value as never };
}

export function fairleadState(raw: FairleadValue): FairleadState {
  if (!fairleadReadable(raw)) return "";
  return fairleadGiven(raw) ? "set" : "clear";
}

/** Word marks win first. NOW, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait. DROP, VOID, STOP, CLOSED, and BAN are shut. CLEAR, NULL, EMPTY, MISS, and NEVER stay blank. An AT- mark of seven letters is a code. An AT- mark of fourteen letters or more is long. Any other AT- mark is live. Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds. */
export function fairleadLane(raw: FairleadValue): FairleadLane {
  if (fairleadState(raw) !== "set") return "";
  const text = fairleadGiven(raw);
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

export function fairleadHue(raw: FairleadValue): FairleadHue {
  const mail = fairleadLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function fairleadLit(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "live";
}

export function fairleadNear(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "code";
}

export function fairleadFar(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "short";
}

export function fairleadFade(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "long";
}

export function fairleadDark(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "shut";
}

export function fairleadDim(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "hold";
}

export function fairleadBlank(raw: FairleadValue): boolean {
  return fairleadLane(raw) === "blank";
}

export function fairleadOpen(raw: FairleadValue): boolean {
  return fairleadState(raw) === "clear";
}

export function fairleadLength(raw: FairleadValue): number | null {
  if (fairleadState(raw) !== "set") return null;
  return fairleadGiven(raw).length;
}

export function fairleadEven(raw: FairleadValue): boolean {
  const length = fairleadLength(raw);
  return length !== null && length % 2 === 0;
}

export function fairleadDigit(raw: FairleadValue): boolean {
  return /[0-9]/.test(fairleadGiven(raw));
}

export function fairleadLetter(raw: FairleadValue): boolean {
  return /[A-Za-z]/.test(fairleadGiven(raw));
}

export function fairleadUpper(raw: FairleadValue): boolean {
  const text = fairleadGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function fairleadCopy(raw: FairleadValue): string {
  return fairleadGiven(raw);
}

export function fairleadStamp(raw: FairleadValue): string {
  const text = fairleadGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function fairleadLanes(rows: readonly FairleadRow[]): FairleadLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = fairleadLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingFairlead(rows: readonly FairleadRow[]): string {
  const lines = fairleadLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingFairleadHue(rows: readonly FairleadRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = fairleadHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneFairleadCount(rows: readonly FairleadRow[], mail: FairleadLane): number {
  return rows.filter((row) => fairleadLane(row.code) === mail).length;
}

export function fairleadShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFairleadLanes(rows: readonly FairleadRow[]): string[] {
  return fairleadLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenFairlead(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedFairlead(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFairlead(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleFairleadReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFairleadReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFairleadLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: FairleadValue, shape: FairleadShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return fairleadOpen(raw);
  if (shape === "digit") return fairleadDigit(raw);
  if (shape === "letter") return fairleadLetter(raw);
  if (shape === "even") return fairleadEven(raw);
  if (shape === "upper") return fairleadUpper(raw);
  return fairleadLane(raw) === shape;
}

export function visibleFairlead(
  rows: readonly FairleadRow[],
  mail: string,
  hue: string,
  query: string,
  review: FairleadReview,
  reviewed: readonly string[],
  shape: FairleadShape,
): FairleadRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = fairleadLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && fairleadHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${fairleadCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function fairleadLanesCsv(rows: readonly FairleadRow[]): string {
  const lines = ["lane,count"];
  for (const line of fairleadLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function fairleadRowsCsv(rows: readonly FairleadRow[], reviewed: readonly string[]): string {
  const lines = ["name,mail,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(fairleadCopy(row.code)), fairleadLane(row.code), fairleadHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
