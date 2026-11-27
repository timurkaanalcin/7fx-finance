/**
 * Carvel courses kept in this browser,
 * and becket plates read the last seen time already stored on the account.
 * Orders are carvel, clinker, tumblehome, and stemson. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 12, or 24. Depths are 1, 3, or 6.
 * Carvel and clinker are the warm half. Tumblehome and stemson are the cool half.
 * Ivory is the quiet ground.
 * NOW, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait.
 * DROP, VOID, STOP, CLOSED, and BAN are shut.
 * CLEAR, NULL, EMPTY, MISS, and NEVER stay blank.
 * An AT- mark of seven letters is a code. An AT- mark of fourteen letters or more is long. Other AT- marks stay live.
 * Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds.
 * A true seen mark reads as NOW. A false mark reads as NEVER.
 * The secret is not read. Money fields are not read. The plate does not change the saved time.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_carvel_course (
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
 * CREATE TABLE crm_becket_seen_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_becket_seen_review (
 *   trader_id text primary key
 * );
 */


export const CRV_KEY = "crmv4-carvel-418";
export const CRV_VIEW_KEY = "crmv4-carvel-views-418";
export const CRV_DENSITY_KEY = "crmv4-carvel-density-418";
export const CRV_PROFILES = ["carvel", "clinker", "tumblehome", "stemson"] as const;

export type CarvelProfile = (typeof CRV_PROFILES)[number];
export type CarvelBed = "blank" | "ivory" | "graphite" | "gilt";
export type CarvelRack = "base" | "press" | "shelf";
export type CarvelDensity = "open" | "tight";
export type CarvelSort = "profile" | "hand";

export type Carvel = {
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

export type CarvelView = {
  id: string;
  name: string;
  rack: CarvelRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type CarvelCounts = {
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

export const ROUND418_FEATURES = [
  "carvel-save",
  "carvel-reminders",
  "carvel-orders",
  "carvel-search",
  "carvel-hour-sla",
  "carvel-case",
  "carvel-pin",
  "carvel-inline-title",
  "carvel-filters",
  "saved-carvel-views",
  "carvel-density",
  "carvel-focus",
  "carvel-kpis",
  "carvel-chart",
  "carvel-timeline",
  "carvel-bulk",
  "carvel-csv",
  "carvel-keys",
  "carvel-audit",
  "quietest-carvel-hand",
  "carvel-viewer",
  "suggest-carvel",
  "overdue-carvel",
  "becket-panels",
  "becket-seen-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 12, 24] as const;
const DEPTH_CYCLE = [1, 3, 6] as const;
const WARM = new Set(["carvel", "clinker"]);
const COOL = new Set(["tumblehome", "stemson"]);
const QUIET_BED = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): CarvelRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<CarvelBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<CarvelBed, "blank">) : "";
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

function inRack(card: Carvel, rack: CarvelRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return CRV_PROFILES.indexOf(profile as CarvelProfile);
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
  return (CRV_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 12, or 24. Anything else stays blank. */
export function carvelHour(raw: unknown): 3 | 6 | 12 | 24 | null {
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
export function carvelBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Carvel is first. Clinker is second. Tumblehome is third. Stemson is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "carvel") return "first";
  if (text === "clinker") return "second";
  if (text === "tumblehome") return "third";
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
  return QUIET_BED.has(carvelBed(bed));
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
  const hour = carvelHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = carvelBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveCarvelFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestCarvelBed(cards: readonly Carvel[]): string {
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
export function suggestCarvelHour(cards: readonly Carvel[], hour: number): 3 | 6 | 12 | 24 {
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

export function suggestProfile(hour: number): CarvelProfile {
  if (hour < 3) return "carvel";
  if (hour < 6) return "clinker";
  if (hour < 12) return "tumblehome";
  return "stemson";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Carvel[], roster: string): string {
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

export function readCarvelList(raw: unknown): Carvel[] {
  if (!Array.isArray(raw)) return [];
  const out: Carvel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Carvel>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: carvelHour(row.hour),
      bed: carvelBed(row.bed),
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

export function addCarvel(
  cards: readonly Carvel[],
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
): Carvel[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCarvelList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: carvelHour(card.hour),
      bed: carvelBed(card.bed),
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

function mapCard(cards: readonly Carvel[], id: string, edit: (card: Carvel) => Carvel): Carvel[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCarvel(cards: readonly Carvel[], id: string, title: string): Carvel[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCarvelNote(cards: readonly Carvel[], id: string, note: string): Carvel[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(carvelBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setCarvelBed(cards: readonly Carvel[], id: string, bed: string): Carvel[] {
  const next = carvelBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setCarvelRaised(cards: readonly Carvel[], id: string, raised: boolean): Carvel[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCarvelRack(cards: readonly Carvel[], id: string, pressed: boolean): Carvel[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setCarvelShelf(cards: readonly Carvel[], id: string, shelved: boolean): Carvel[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setCarvelPin(cards: readonly Carvel[], id: string, pinned: boolean): Carvel[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addCarvelTag(cards: readonly Carvel[], id: string, tag: string): Carvel[] {
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

export function raiseHourFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setCarvelFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackCarvelFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return setCarvelRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinCarvelFocused(cards: readonly Carvel[], id: string): Carvel[] {
  return setCarvelPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Carvel[], id: string): Carvel[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCarvelBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Carvel[], ids: readonly string[], edit: (card: Carvel) => Carvel): Carvel[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCarvelLinen(cards: readonly Carvel[], ids: readonly string[]): Carvel[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkCarvelRaise(cards: readonly Carvel[], ids: readonly string[]): Carvel[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCarvelShelf(cards: readonly Carvel[], ids: readonly string[]): Carvel[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkCarvelTag(cards: readonly Carvel[], ids: readonly string[]): Carvel[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readCarvelViews(raw: unknown): CarvelView[] {
  if (!Array.isArray(raw)) return [];
  const out: CarvelView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CarvelView>;
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

export function addCarvelView(views: readonly CarvelView[], view: CarvelView): CarvelView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCarvelViews([...views, { ...view, name }]);
}

export function dropCarvelView(views: readonly CarvelView[], id: string): CarvelView[] {
  return views.filter((view) => view.id !== id);
}

export function carvelDensity(raw: unknown): CarvelDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCarvelList(cards: readonly Carvel[], sort: CarvelSort): Carvel[] {
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

export function visibleCarvelList(
  cards: readonly Carvel[],
  rack: CarvelRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Carvel[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : carvelBed(bed);
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

/** A stemson at depth one, still not raised and not shelved, is overdue. */
export function overdueCarvel(card: Carvel): boolean {
  return card.profile === "stemson" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the yard. */
export function idleCarvel(card: Carvel): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Ivory, twenty-four hours, and a full depth, still off the shelf. */
export function briskCarvel(card: Carvel): boolean {
  return card.bed === "IVORY" && card.hour === 24 && card.depth === 6 && !card.shelved;
}

/** Tumblehome, gilt, and six hours. */
export function restingCarvel(card: Carvel): boolean {
  return card.profile === "tumblehome" && card.bed === "GILT" && card.hour === 6;
}

/** An carvel is late when the station is already stemson. */
export function lateCarvel(card: Carvel, station: string): boolean {
  return card.profile === "carvel" && profilePoint(station) === "stemson" && !card.raised;
}

export function carvelCounts(cards: readonly Carvel[], shown: readonly Carvel[], station: string): CarvelCounts {
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
    idle: cards.filter(idleCarvel).length,
    brisk: cards.filter(briskCarvel).length,
    resting: cards.filter(restingCarvel).length,
    overdue: cards.filter(overdueCarvel).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateCarvel(card, station)).length,
  };
}

export function carvelBars(cards: readonly Carvel[]): { profile: string; count: number }[] {
  return CRV_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function carvelTimeline(cards: readonly Carvel[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function carvelHands(cards: readonly Carvel[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Carvel[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of carvelHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCarvelList(cards: readonly Carvel[]): string[] {
  return cards.filter(overdueCarvel).map((card) => card.title);
}

export function carvelCopy(card: Carvel): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function carvelCsv(cards: readonly Carvel[], station: string): string {
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
        lateCarvel(card, station) ? "1" : "0",
        idleCarvel(card) ? "1" : "0",
        briskCarvel(card) ? "1" : "0",
        restingCarvel(card) ? "1" : "0",
        overdueCarvel(card) ? "1" : "0",
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


export const BKT_HIDE_KEY = "crmv4-becket-hide-418";
export const BKT_REVIEW_KEY = "crmv4-becket-review-418";

export type BecketLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type BecketHue = "" | "gilt" | "ash" | "pearl";
export type BecketState = "" | "clear" | "set";
export type BecketReview = "all" | "reviewed" | "fresh";
export type BecketShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type BecketValue = string | { lastSeenAt?: unknown; [key: string]: unknown } | null | undefined;
export type BecketRow = { id: string; label: string; code: BecketValue; userId?: string };
export type BecketLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["NOW", "OPEN", "LIVE", "GOLD", "ON"]);
const HOLD_TITLES = new Set(["QUEUE", "LATER", "SOFT", "PAUSE", "STAY"]);
const SHUT_TITLES = new Set(["DROP", "VOID", "STOP", "CLOSED", "BAN"]);
const BLANK_TITLES = new Set(["CLEAR", "NULL", "EMPTY", "MISS", "NEVER"]);

function becketRecord(raw: BecketValue): { lastSeenAt?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function becketBlocked(raw: BecketValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function becketGiven(raw: BecketValue): string {
  const row = becketRecord(raw);
  if (row && !("lastSeenAt" in row)) return "";
  const value = row ? row.lastSeenAt : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NOW";
  if (value === false || value === "false" || value === "0" || value === 0) return "NEVER";
  return snip(value, 48);
}

function becketReadable(raw: BecketValue): boolean {
  if (becketBlocked(raw)) return false;
  const row = becketRecord(raw);
  if (row && !("lastSeenAt" in row)) return false;
  return true;
}


export function becketSlice(raw: unknown): BecketValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("lastSeenAt" in row)) return { lastSeenAt: "" };
  const value = row.lastSeenAt;
  if (typeof value === "string") return { lastSeenAt: snip(value, 48) };
  return { lastSeenAt: value as never };
}

export function becketState(raw: BecketValue): BecketState {
  if (!becketReadable(raw)) return "";
  return becketGiven(raw) ? "set" : "clear";
}

/** Word marks win first. NOW, OPEN, LIVE, GOLD, and ON are live. QUEUE, LATER, SOFT, PAUSE, and STAY wait. DROP, VOID, STOP, CLOSED, and BAN are shut. CLEAR, NULL, EMPTY, MISS, and NEVER stay blank. An AT- mark of seven letters is a code. An AT- mark of fourteen letters or more is long. Any other AT- mark is live. Four letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds. */
export function becketLane(raw: BecketValue): BecketLane {
  if (becketState(raw) !== "set") return "";
  const text = becketGiven(raw);
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

export function becketHue(raw: BecketValue): BecketHue {
  const mail = becketLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function becketLit(raw: BecketValue): boolean {
  return becketLane(raw) === "live";
}

export function becketNear(raw: BecketValue): boolean {
  return becketLane(raw) === "code";
}

export function becketFar(raw: BecketValue): boolean {
  return becketLane(raw) === "short";
}

export function becketFade(raw: BecketValue): boolean {
  return becketLane(raw) === "long";
}

export function becketDark(raw: BecketValue): boolean {
  return becketLane(raw) === "shut";
}

export function becketDim(raw: BecketValue): boolean {
  return becketLane(raw) === "hold";
}

export function becketBlank(raw: BecketValue): boolean {
  return becketLane(raw) === "blank";
}

export function becketOpen(raw: BecketValue): boolean {
  return becketState(raw) === "clear";
}

export function becketLength(raw: BecketValue): number | null {
  if (becketState(raw) !== "set") return null;
  return becketGiven(raw).length;
}

export function becketEven(raw: BecketValue): boolean {
  const length = becketLength(raw);
  return length !== null && length % 2 === 0;
}

export function becketDigit(raw: BecketValue): boolean {
  return /[0-9]/.test(becketGiven(raw));
}

export function becketLetter(raw: BecketValue): boolean {
  return /[A-Za-z]/.test(becketGiven(raw));
}

export function becketUpper(raw: BecketValue): boolean {
  const text = becketGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function becketCopy(raw: BecketValue): string {
  return becketGiven(raw);
}

export function becketStamp(raw: BecketValue): string {
  const text = becketGiven(raw);
  if (!text) return "";
  return text.slice(0, 4).toUpperCase();
}

export function becketLanes(rows: readonly BecketRow[]): BecketLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = becketLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingBecket(rows: readonly BecketRow[]): string {
  const lines = becketLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingBecketHue(rows: readonly BecketRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = becketHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneBecketCount(rows: readonly BecketRow[], mail: BecketLane): number {
  return rows.filter((row) => becketLane(row.code) === mail).length;
}

export function becketShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentBecketLanes(rows: readonly BecketRow[]): string[] {
  return becketLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenBecket(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedBecket(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleBecket(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleBecketReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkBecketReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleBecketLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: BecketValue, shape: BecketShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return becketOpen(raw);
  if (shape === "digit") return becketDigit(raw);
  if (shape === "letter") return becketLetter(raw);
  if (shape === "even") return becketEven(raw);
  if (shape === "upper") return becketUpper(raw);
  return becketLane(raw) === shape;
}

export function visibleBecket(
  rows: readonly BecketRow[],
  mail: string,
  hue: string,
  query: string,
  review: BecketReview,
  reviewed: readonly string[],
  shape: BecketShape,
): BecketRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = becketLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && becketHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${becketCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function becketLanesCsv(rows: readonly BecketRow[]): string {
  const lines = ["lane,count"];
  for (const line of becketLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function becketRowsCsv(rows: readonly BecketRow[], reviewed: readonly string[]): string {
  const lines = ["name,seen,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(becketCopy(row.code)), becketLane(row.code), becketHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
