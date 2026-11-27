/**
 * Tympanum courses kept in this browser,
 * and embrasure plates read the browser already stored on the account.
 * Orders are tympanum, lunette, gablet, and raking. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 9, or 15. Depths are 3, 6, or 9.
 * Tympanum and lunette are the warm half. Gablet and raking are the cool half.
 * Graphite is the quiet ground.
 * READY, CHROME, FIREFOX, SAFARI, and EDGE are live. OFF, VOID, SHUT, DENY, and NO are shut.
 * HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Five letters are a code. Three letters or fewer are short. Twelve letters or more are long. Anything else holds.
 * A true browser mark reads as READY. A false mark reads as OFF.
 * The secret is not read. Money fields are not read. The plate does not change the saved code.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_tympanum_course (
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
 * CREATE TABLE crm_embrasure_browser_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_embrasure_browser_review (
 *   trader_id text primary key
 * );
 */

export const TPN_KEY = "crmv4-tympanum-405";
export const TPN_VIEW_KEY = "crmv4-tympanum-views-405";
export const TPN_DENSITY_KEY = "crmv4-tympanum-density-405";
export const TPN_PROFILES = ["tympanum", "lunette", "gablet", "raking"] as const;

export type TympanumProfile = (typeof TPN_PROFILES)[number];
export type TympanumBed = "blank" | "ivory" | "graphite" | "gilt";
export type TympanumRack = "base" | "press" | "shelf";
export type TympanumDensity = "open" | "tight";
export type TympanumSort = "profile" | "hand";

export type Tympanum = {
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

export type TympanumView = {
  id: string;
  name: string;
  rack: TympanumRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type TympanumCounts = {
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

export const ROUND405_FEATURES = [
  "tympanum-save",
  "tympanum-reminders",
  "tympanum-orders",
  "tympanum-search",
  "tympanum-hour-sla",
  "tympanum-case",
  "tympanum-pin",
  "tympanum-inline-title",
  "tympanum-filters",
  "saved-tympanum-views",
  "tympanum-density",
  "tympanum-focus",
  "tympanum-kpis",
  "tympanum-chart",
  "tympanum-timeline",
  "tympanum-bulk",
  "tympanum-csv",
  "tympanum-keys",
  "tympanum-audit",
  "quietest-tympanum-hand",
  "tympanum-viewer",
  "suggest-tympanum",
  "overdue-tympanum",
  "embrasure-panels",
  "embrasure-browser-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 9, 15] as const;
const DEPTH_CYCLE = [3, 6, 9] as const;
const WARM = new Set(["tympanum", "lunette"]);
const COOL = new Set(["gablet", "raking"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): TympanumRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<TympanumBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<TympanumBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ty]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Tympanum, rack: TympanumRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return TPN_PROFILES.indexOf(profile as TympanumProfile);
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
  return (TPN_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 9, or 15. Anything else stays blank. */
export function tympanumHour(raw: unknown): 3 | 6 | 9 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "15") return null;
  return Number(text) as 3 | 6 | 9 | 15;
}

/** A depth is 3, 6, or 9. Anything else stays blank. */
export function depthCount(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function tympanumBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Tympanum is first. Lunette is second. Gablet is third. Raking is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "tympanum") return "first";
  if (text === "lunette") return "second";
  if (text === "gablet") return "third";
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
  return QUIET_BED.has(tympanumBed(bed));
}

/** A pair depth is 6. Three and nine are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 6;
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
  const hour = tympanumHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = tympanumBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveTympanumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestTympanumBed(cards: readonly Tympanum[]): string {
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

/** Before six, suggest three. Before nine, suggest six. Before fifteen, suggest nine. Later, suggest fifteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestTympanumHour(cards: readonly Tympanum[], hour: number): 3 | 6 | 9 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 15 = 3;
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
  if (hour < 6) return 3;
  if (hour < 9) return 6;
  if (hour < 15) return 9;
  return 15;
}

export function suggestProfile(hour: number): TympanumProfile {
  if (hour < 6) return "tympanum";
  if (hour < 9) return "lunette";
  if (hour < 15) return "gablet";
  return "raking";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Tympanum[], roster: string): string {
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

export function readTympanumList(raw: unknown): Tympanum[] {
  if (!Array.isArray(raw)) return [];
  const out: Tympanum[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tympanum>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: tympanumHour(row.hour),
      bed: tympanumBed(row.bed),
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

export function addTympanum(
  cards: readonly Tympanum[],
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
): Tympanum[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTympanumList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: tympanumHour(card.hour),
      bed: tympanumBed(card.bed),
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

function mapCard(cards: readonly Tympanum[], id: string, edit: (card: Tympanum) => Tympanum): Tympanum[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTympanum(cards: readonly Tympanum[], id: string, title: string): Tympanum[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTympanumNote(cards: readonly Tympanum[], id: string, note: string): Tympanum[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(tympanumBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setTympanumBed(cards: readonly Tympanum[], id: string, bed: string): Tympanum[] {
  const next = tympanumBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setTympanumRaised(cards: readonly Tympanum[], id: string, raised: boolean): Tympanum[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setTympanumRack(cards: readonly Tympanum[], id: string, pressed: boolean): Tympanum[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setTympanumShelf(cards: readonly Tympanum[], id: string, shelved: boolean): Tympanum[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setTympanumPin(cards: readonly Tympanum[], id: string, pinned: boolean): Tympanum[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addTympanumTag(cards: readonly Tympanum[], id: string, tag: string): Tympanum[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 9 | 15 {
  if (hour === null) return dir > 0 ? 3 : 15;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setTympanumFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackTympanumFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return setTympanumRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinTympanumFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  return setTympanumPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Tympanum[], id: string): Tympanum[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTympanumBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Tympanum[], ids: readonly string[], edit: (card: Tympanum) => Tympanum): Tympanum[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTympanumLinen(cards: readonly Tympanum[], ids: readonly string[]): Tympanum[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkTympanumRaise(cards: readonly Tympanum[], ids: readonly string[]): Tympanum[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkTympanumShelf(cards: readonly Tympanum[], ids: readonly string[]): Tympanum[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkTympanumTag(cards: readonly Tympanum[], ids: readonly string[]): Tympanum[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readTympanumViews(raw: unknown): TympanumView[] {
  if (!Array.isArray(raw)) return [];
  const out: TympanumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TympanumView>;
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

export function addTympanumView(views: readonly TympanumView[], view: TympanumView): TympanumView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTympanumViews([...views, { ...view, name }]);
}

export function dropTympanumView(views: readonly TympanumView[], id: string): TympanumView[] {
  return views.filter((view) => view.id !== id);
}

export function tympanumDensity(raw: unknown): TympanumDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortTympanumList(cards: readonly Tympanum[], sort: TympanumSort): Tympanum[] {
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

export function visibleTympanumList(
  cards: readonly Tympanum[],
  rack: TympanumRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Tympanum[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : tympanumBed(bed);
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

/** Raking at depth three, still not raised and not shelved, is overdue. */
export function overdueTympanum(card: Tympanum): boolean {
  return card.profile === "raking" && card.depth === 3 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth three, and still on the yard. */
export function idleTympanum(card: Tympanum): boolean {
  return !card.bed && card.hour === 3 && card.depth === 3 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, fifteen hours, and a full depth, still off the shelf. */
export function briskTympanum(card: Tympanum): boolean {
  return card.bed === "GRAPHITE" && card.hour === 15 && card.depth === 9 && !card.shelved;
}

/** Gablet, ivory, and six hours. */
export function restingTympanum(card: Tympanum): boolean {
  return card.profile === "gablet" && card.bed === "IVORY" && card.hour === 6;
}

/** A tympanum is late when the station is already raking. */
export function lateTympanum(card: Tympanum, station: string): boolean {
  return card.profile === "tympanum" && profilePoint(station) === "raking" && !card.raised;
}

export function tympanumCounts(cards: readonly Tympanum[], shown: readonly Tympanum[], station: string): TympanumCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
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
    idle: cards.filter(idleTympanum).length,
    brisk: cards.filter(briskTympanum).length,
    resting: cards.filter(restingTympanum).length,
    overdue: cards.filter(overdueTympanum).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateTympanum(card, station)).length,
  };
}

export function tympanumBars(cards: readonly Tympanum[]): { profile: string; count: number }[] {
  return TPN_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function tympanumTimeline(cards: readonly Tympanum[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function tympanumHands(cards: readonly Tympanum[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Tympanum[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of tympanumHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTympanumList(cards: readonly Tympanum[]): string[] {
  return cards.filter(overdueTympanum).map((card) => card.title);
}

export function tympanumCopy(card: Tympanum): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function tympanumCsv(cards: readonly Tympanum[], station: string): string {
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
        lateTympanum(card, station) ? "1" : "0",
        idleTympanum(card) ? "1" : "0",
        briskTympanum(card) ? "1" : "0",
        restingTympanum(card) ? "1" : "0",
        overdueTympanum(card) ? "1" : "0",
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


export const EBR_HIDE_KEY = "crmv4-embrasure-hide-405";
export const EBR_REVIEW_KEY = "crmv4-embrasure-review-405";

export type EmbrasureLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type EmbrasureHue = "" | "gilt" | "ash" | "pearl";
export type EmbrasureState = "" | "clear" | "set";
export type EmbrasureReview = "all" | "reviewed" | "fresh";
export type EmbrasureShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type EmbrasureValue = string | { lastBrowser?: unknown; [key: string]: unknown } | null | undefined;
export type EmbrasureRow = { id: string; label: string; code: EmbrasureValue; userId?: string };
export type EmbrasureLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["READY", "CHROME", "FIREFOX", "SAFARI", "EDGE"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function embrasureRecord(raw: EmbrasureValue): { lastBrowser?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function embrasureBlocked(raw: EmbrasureValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function embrasureGiven(raw: EmbrasureValue): string {
  const row = embrasureRecord(raw);
  if (row && !("lastBrowser" in row)) return "";
  const value = row ? row.lastBrowser : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "READY";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function embrasureReadable(raw: EmbrasureValue): boolean {
  if (embrasureBlocked(raw)) return false;
  const row = embrasureRecord(raw);
  if (row && !("lastBrowser" in row)) return false;
  return true;
}


export function embrasureSlice(raw: unknown): EmbrasureValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("lastBrowser" in row)) return { lastBrowser: "" };
  const value = row.lastBrowser;
  if (typeof value === "string") return { lastBrowser: snip(value, 48) };
  return { lastBrowser: value as never };
}

export function embrasureState(raw: EmbrasureValue): EmbrasureState {
  if (!embrasureReadable(raw)) return "";
  return embrasureGiven(raw) ? "set" : "clear";
}

/** Word marks win first. READY, CHROME, FIREFOX, SAFARI, and EDGE are live. OFF, VOID, SHUT, DENY, and NO are shut. HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank. Five letters are a code. Three letters or fewer are short. Twelve letters or more are long. Anything else holds. */
export function embrasureLane(raw: EmbrasureValue): EmbrasureLane {
  if (embrasureState(raw) !== "set") return "";
  const text = embrasureGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[A-Za-z]{5}$/.test(text)) return "code";
  if (text.length <= 3) return "short";
  if (text.length >= 12) return "long";
  return "hold";
}

export function embrasureHue(raw: EmbrasureValue): EmbrasureHue {
  const mail = embrasureLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function embrasureLit(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "live";
}

export function embrasureNear(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "code";
}

export function embrasureFar(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "short";
}

export function embrasureFade(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "long";
}

export function embrasureDark(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "shut";
}

export function embrasureDim(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "hold";
}

export function embrasureBlank(raw: EmbrasureValue): boolean {
  return embrasureLane(raw) === "blank";
}

export function embrasureOpen(raw: EmbrasureValue): boolean {
  return embrasureState(raw) === "clear";
}

export function embrasureLength(raw: EmbrasureValue): number | null {
  if (embrasureState(raw) !== "set") return null;
  return embrasureGiven(raw).length;
}

export function embrasureEven(raw: EmbrasureValue): boolean {
  const length = embrasureLength(raw);
  return length !== null && length % 2 === 0;
}

export function embrasureDigit(raw: EmbrasureValue): boolean {
  return /[0-9]/.test(embrasureGiven(raw));
}

export function embrasureLetter(raw: EmbrasureValue): boolean {
  return /[A-Za-z]/.test(embrasureGiven(raw));
}

export function embrasureUpper(raw: EmbrasureValue): boolean {
  const text = embrasureGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function embrasureCopy(raw: EmbrasureValue): string {
  return embrasureGiven(raw);
}

export function embrasureStamp(raw: EmbrasureValue): string {
  const text = embrasureGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function embrasureLanes(rows: readonly EmbrasureRow[]): EmbrasureLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = embrasureLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingEmbrasure(rows: readonly EmbrasureRow[]): string {
  const lines = embrasureLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingEmbrasureHue(rows: readonly EmbrasureRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = embrasureHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneEmbrasureCount(rows: readonly EmbrasureRow[], mail: EmbrasureLane): number {
  return rows.filter((row) => embrasureLane(row.code) === mail).length;
}

export function embrasureShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentEmbrasureLanes(rows: readonly EmbrasureRow[]): string[] {
  return embrasureLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenEmbrasure(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedEmbrasure(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleEmbrasure(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleEmbrasureReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkEmbrasureReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleEmbrasureLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: EmbrasureValue, shape: EmbrasureShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return embrasureOpen(raw);
  if (shape === "digit") return embrasureDigit(raw);
  if (shape === "letter") return embrasureLetter(raw);
  if (shape === "even") return embrasureEven(raw);
  if (shape === "upper") return embrasureUpper(raw);
  return embrasureLane(raw) === shape;
}

export function visibleEmbrasure(
  rows: readonly EmbrasureRow[],
  mail: string,
  hue: string,
  query: string,
  review: EmbrasureReview,
  reviewed: readonly string[],
  shape: EmbrasureShape,
): EmbrasureRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = embrasureLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && embrasureHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${embrasureCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function embrasureLanesCsv(rows: readonly EmbrasureRow[]): string {
  const lines = ["lane,count"];
  for (const line of embrasureLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function embrasureRowsCsv(rows: readonly EmbrasureRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(embrasureCopy(row.code)), embrasureLane(row.code), embrasureHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
