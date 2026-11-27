/**
 * Caryatid courses kept in this browser,
 * and telamon plates read the language already stored on the account.
 * Orders are caryatid, baldachin, cathedra, and templon. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 7, 11, or 18. Depths are 4, 7, or 11.
 * Caryatid and baldachin are the warm half. Cathedra and templon are the cool half.
 * Graphite is the quiet ground.
 * VERIFIED, PASS, OK, and YES are live. PENDING, REVIEW, WAIT, and HOLD wait.
 * REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut.
 * UNVERIFIED, NONE, BLANK, and EMPTY stay blank.
 * EN, TR, DE, RU, and AR are live desk languages.
 * A LNG- mark of six letters is a code. A LNG- mark of twelve letters or more is long. Other LNG- marks stay live.
 * Three letters are a code. Two letters or fewer are short. Eighteen letters or more are long. Anything else holds.
 * A true validation mark reads as VERIFIED. A false mark reads as REJECTED.
 * The secret is not read. Money fields are not read. The plate does not change the saved language.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_caryatid_course (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   profile text not null default '',
 *   hour_mark integer,
 *   bed text not null default '',
 *   depth integer not null default 4,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_telamon_language_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_telamon_language_review (
 *   trader_id text primary key
 * );
 */


export const CYD_KEY = "crmv4-caryatid-413";
export const CYD_VIEW_KEY = "crmv4-caryatid-views-413";
export const CYD_DENSITY_KEY = "crmv4-caryatid-density-413";
export const CYD_PROFILES = ["caryatid", "baldachin", "cathedra", "templon"] as const;

export type CaryatidProfile = (typeof CYD_PROFILES)[number];
export type CaryatidBed = "blank" | "ivory" | "graphite" | "gilt";
export type CaryatidRack = "base" | "press" | "shelf";
export type CaryatidDensity = "open" | "tight";
export type CaryatidSort = "profile" | "hand";

export type Caryatid = {
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

export type CaryatidView = {
  id: string;
  name: string;
  rack: CaryatidRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type CaryatidCounts = {
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

export const ROUND413_FEATURES = [
  "caryatid-save",
  "caryatid-reminders",
  "caryatid-orders",
  "caryatid-search",
  "caryatid-hour-sla",
  "caryatid-case",
  "caryatid-pin",
  "caryatid-inline-title",
  "caryatid-filters",
  "saved-caryatid-views",
  "caryatid-density",
  "caryatid-focus",
  "caryatid-kpis",
  "caryatid-chart",
  "caryatid-timeline",
  "caryatid-bulk",
  "caryatid-csv",
  "caryatid-keys",
  "caryatid-audit",
  "quietest-caryatid-hand",
  "caryatid-viewer",
  "suggest-caryatid",
  "overdue-caryatid",
  "telamon-panels",
  "telamon-language-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 7, 11, 18] as const;
const DEPTH_CYCLE = [4, 7, 11] as const;
const WARM = new Set(["caryatid", "baldachin"]);
const COOL = new Set(["cathedra", "templon"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): CaryatidRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<CaryatidBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<CaryatidBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[mt]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Caryatid, rack: CaryatidRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return CYD_PROFILES.indexOf(profile as CaryatidProfile);
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
  return (CYD_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 7, 11, or 18. Anything else stays blank. */
export function caryatidHour(raw: unknown): 2 | 7 | 11 | 18 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "7" && text !== "11" && text !== "18") return null;
  return Number(text) as 2 | 7 | 11 | 18;
}

/** A depth is 4, 7, or 11. Anything else stays blank. */
export function depthCount(raw: unknown): 4 | 7 | 11 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "7" && text !== "11") return null;
  return Number(text) as 4 | 7 | 11;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function caryatidBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Caryatid is first. Baldachin is second. Cathedra is third. Templon is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "caryatid") return "first";
  if (text === "baldachin") return "second";
  if (text === "cathedra") return "third";
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
  return QUIET_BED.has(caryatidBed(bed));
}

/** A pair depth is 7. Four and eleven are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 7;
}

/** A full depth is 11. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 11;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 18).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = caryatidHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = caryatidBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveCaryatidFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestCaryatidBed(cards: readonly Caryatid[]): string {
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

/** Before two, suggest two. Before seven, suggest seven. Before eleven, suggest eleven. Later, suggest eighteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestCaryatidHour(cards: readonly Caryatid[], hour: number): 2 | 7 | 11 | 18 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 7 | 11 | 18 = 2;
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
  if (hour < 2) return 2;
  if (hour < 7) return 7;
  if (hour < 11) return 11;
  return 18;
}

export function suggestProfile(hour: number): CaryatidProfile {
  if (hour < 2) return "caryatid";
  if (hour < 7) return "baldachin";
  if (hour < 11) return "cathedra";
  return "templon";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Caryatid[], roster: string): string {
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

export function readCaryatidList(raw: unknown): Caryatid[] {
  if (!Array.isArray(raw)) return [];
  const out: Caryatid[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Caryatid>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: caryatidHour(row.hour),
      bed: caryatidBed(row.bed),
      depth: depthCount(row.depth) ?? 4,
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

export function addCaryatid(
  cards: readonly Caryatid[],
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
): Caryatid[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCaryatidList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: caryatidHour(card.hour),
      bed: caryatidBed(card.bed),
      depth: depthCount(card.depth) ?? 4,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Caryatid[], id: string, edit: (card: Caryatid) => Caryatid): Caryatid[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCaryatid(cards: readonly Caryatid[], id: string, title: string): Caryatid[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCaryatidNote(cards: readonly Caryatid[], id: string, note: string): Caryatid[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(caryatidBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setCaryatidBed(cards: readonly Caryatid[], id: string, bed: string): Caryatid[] {
  const next = caryatidBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setCaryatidRaised(cards: readonly Caryatid[], id: string, raised: boolean): Caryatid[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCaryatidRack(cards: readonly Caryatid[], id: string, pressed: boolean): Caryatid[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setCaryatidShelf(cards: readonly Caryatid[], id: string, shelved: boolean): Caryatid[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setCaryatidPin(cards: readonly Caryatid[], id: string, pinned: boolean): Caryatid[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addCaryatidTag(cards: readonly Caryatid[], id: string, tag: string): Caryatid[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 7 | 11 | 18 {
  if (hour === null) return dir > 0 ? 2 : 18;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 4 | 7 | 11 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setCaryatidFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackCaryatidFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return setCaryatidRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinCaryatidFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  return setCaryatidPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Caryatid[], id: string): Caryatid[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCaryatidBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Caryatid[], ids: readonly string[], edit: (card: Caryatid) => Caryatid): Caryatid[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCaryatidLinen(cards: readonly Caryatid[], ids: readonly string[]): Caryatid[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkCaryatidRaise(cards: readonly Caryatid[], ids: readonly string[]): Caryatid[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCaryatidShelf(cards: readonly Caryatid[], ids: readonly string[]): Caryatid[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkCaryatidTag(cards: readonly Caryatid[], ids: readonly string[]): Caryatid[] {
  return bulk(cards, ids, (card) => (card.tags.includes("t") ? card : { ...card, tags: tagsOf([...card.tags, "t"]), audit: "tag" }));
}

export function readCaryatidViews(raw: unknown): CaryatidView[] {
  if (!Array.isArray(raw)) return [];
  const out: CaryatidView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CaryatidView>;
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

export function addCaryatidView(views: readonly CaryatidView[], view: CaryatidView): CaryatidView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCaryatidViews([...views, { ...view, name }]);
}

export function dropCaryatidView(views: readonly CaryatidView[], id: string): CaryatidView[] {
  return views.filter((view) => view.id !== id);
}

export function caryatidDensity(raw: unknown): CaryatidDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCaryatidList(cards: readonly Caryatid[], sort: CaryatidSort): Caryatid[] {
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

export function visibleCaryatidList(
  cards: readonly Caryatid[],
  rack: CaryatidRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Caryatid[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : caryatidBed(bed);
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

/** A templon at depth four, still not raised and not shelved, is overdue. */
export function overdueCaryatid(card: Caryatid): boolean {
  return card.profile === "templon" && card.depth === 4 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth four, and still on the yard. */
export function idleCaryatid(card: Caryatid): boolean {
  return !card.bed && card.hour === 2 && card.depth === 4 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, eighteen hours, and a full depth, still off the shelf. */
export function briskCaryatid(card: Caryatid): boolean {
  return card.bed === "GRAPHITE" && card.hour === 18 && card.depth === 11 && !card.shelved;
}

/** Cathedra, ivory, and seven hours. */
export function restingCaryatid(card: Caryatid): boolean {
  return card.profile === "cathedra" && card.bed === "IVORY" && card.hour === 7;
}

/** An caryatid is late when the station is already templon. */
export function lateCaryatid(card: Caryatid, station: string): boolean {
  return card.profile === "caryatid" && profilePoint(station) === "templon" && !card.raised;
}

export function caryatidCounts(cards: readonly Caryatid[], shown: readonly Caryatid[], station: string): CaryatidCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 18).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleCaryatid).length,
    brisk: cards.filter(briskCaryatid).length,
    resting: cards.filter(restingCaryatid).length,
    overdue: cards.filter(overdueCaryatid).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateCaryatid(card, station)).length,
  };
}

export function caryatidBars(cards: readonly Caryatid[]): { profile: string; count: number }[] {
  return CYD_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function caryatidTimeline(cards: readonly Caryatid[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function caryatidHands(cards: readonly Caryatid[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Caryatid[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of caryatidHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCaryatidList(cards: readonly Caryatid[]): string[] {
  return cards.filter(overdueCaryatid).map((card) => card.title);
}

export function caryatidCopy(card: Caryatid): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function caryatidCsv(cards: readonly Caryatid[], station: string): string {
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
        lateCaryatid(card, station) ? "1" : "0",
        idleCaryatid(card) ? "1" : "0",
        briskCaryatid(card) ? "1" : "0",
        restingCaryatid(card) ? "1" : "0",
        overdueCaryatid(card) ? "1" : "0",
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


export const TLM_HIDE_KEY = "crmv4-telamon-hide-413";
export const TLM_REVIEW_KEY = "crmv4-telamon-review-413";

export type TelamonLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type TelamonHue = "" | "gilt" | "ash" | "pearl";
export type TelamonState = "" | "clear" | "set";
export type TelamonReview = "all" | "reviewed" | "fresh";
export type TelamonShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type TelamonValue = string | { language?: unknown; [key: string]: unknown } | null | undefined;
export type TelamonRow = { id: string; label: string; code: TelamonValue; userId?: string };
export type TelamonLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["VERIFIED", "PASS", "OK", "YES"]);
const HOLD_TITLES = new Set(["PENDING", "REVIEW", "WAIT", "HOLD"]);
const SHUT_TITLES = new Set(["REJECTED", "DENY", "FAIL", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["UNVERIFIED", "NONE", "BLANK", "EMPTY"]);

function telamonRecord(raw: TelamonValue): { language?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function telamonBlocked(raw: TelamonValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function telamonGiven(raw: TelamonValue): string {
  const row = telamonRecord(raw);
  if (row && !("language" in row)) return "";
  const value = row ? row.language : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "VERIFIED";
  if (value === false || value === "false" || value === "0" || value === 0) return "REJECTED";
  return snip(value, 48);
}

function telamonReadable(raw: TelamonValue): boolean {
  if (telamonBlocked(raw)) return false;
  const row = telamonRecord(raw);
  if (row && !("language" in row)) return false;
  return true;
}


export function telamonSlice(raw: unknown): TelamonValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("language" in row)) return { language: "" };
  const value = row.language;
  if (typeof value === "string") return { language: snip(value, 48) };
  return { language: value as never };
}

export function telamonState(raw: TelamonValue): TelamonState {
  if (!telamonReadable(raw)) return "";
  return telamonGiven(raw) ? "set" : "clear";
}

/** Word marks win first. VERIFIED, PASS, OK, and YES are live. EN, TR, DE, RU, and AR are live. PENDING, REVIEW, WAIT, and HOLD wait. REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut. UNVERIFIED, NONE, BLANK, and EMPTY stay blank. A LNG- mark of six letters is a code. A LNG- mark of twelve letters or more is long. Any other LNG- mark is live. Three letters are a code. Two letters or fewer are short. Eighteen letters or more are long. Anything else holds. */
export function telamonLane(raw: TelamonValue): TelamonLane {
  if (telamonState(raw) !== "set") return "";
  const text = telamonGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper === "EN" || upper === "TR" || upper === "DE" || upper === "RU" || upper === "AR") return "live";
  if (upper.startsWith("LNG-") && text.length === 6) return "code";
  if (upper.startsWith("LNG-") && text.length >= 12) return "long";
  if (upper.startsWith("LNG-")) return "live";
  if (/^[A-Za-z]{3}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 18) return "long";
  return "hold";
}

export function telamonHue(raw: TelamonValue): TelamonHue {
  const mail = telamonLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function telamonLit(raw: TelamonValue): boolean {
  return telamonLane(raw) === "live";
}

export function telamonNear(raw: TelamonValue): boolean {
  return telamonLane(raw) === "code";
}

export function telamonFar(raw: TelamonValue): boolean {
  return telamonLane(raw) === "short";
}

export function telamonFade(raw: TelamonValue): boolean {
  return telamonLane(raw) === "long";
}

export function telamonDark(raw: TelamonValue): boolean {
  return telamonLane(raw) === "shut";
}

export function telamonDim(raw: TelamonValue): boolean {
  return telamonLane(raw) === "hold";
}

export function telamonBlank(raw: TelamonValue): boolean {
  return telamonLane(raw) === "blank";
}

export function telamonOpen(raw: TelamonValue): boolean {
  return telamonState(raw) === "clear";
}

export function telamonLength(raw: TelamonValue): number | null {
  if (telamonState(raw) !== "set") return null;
  return telamonGiven(raw).length;
}

export function telamonEven(raw: TelamonValue): boolean {
  const length = telamonLength(raw);
  return length !== null && length % 2 === 0;
}

export function telamonDigit(raw: TelamonValue): boolean {
  return /[0-9]/.test(telamonGiven(raw));
}

export function telamonLetter(raw: TelamonValue): boolean {
  return /[A-Za-z]/.test(telamonGiven(raw));
}

export function telamonUpper(raw: TelamonValue): boolean {
  const text = telamonGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function telamonCopy(raw: TelamonValue): string {
  return telamonGiven(raw);
}

export function telamonStamp(raw: TelamonValue): string {
  const text = telamonGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function telamonLanes(rows: readonly TelamonRow[]): TelamonLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = telamonLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingTelamon(rows: readonly TelamonRow[]): string {
  const lines = telamonLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingTelamonHue(rows: readonly TelamonRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = telamonHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneTelamonCount(rows: readonly TelamonRow[], mail: TelamonLane): number {
  return rows.filter((row) => telamonLane(row.code) === mail).length;
}

export function telamonShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTelamonLanes(rows: readonly TelamonRow[]): string[] {
  return telamonLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenTelamon(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTelamon(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTelamon(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleTelamonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTelamonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTelamonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: TelamonValue, shape: TelamonShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return telamonOpen(raw);
  if (shape === "digit") return telamonDigit(raw);
  if (shape === "letter") return telamonLetter(raw);
  if (shape === "even") return telamonEven(raw);
  if (shape === "upper") return telamonUpper(raw);
  return telamonLane(raw) === shape;
}

export function visibleTelamon(
  rows: readonly TelamonRow[],
  mail: string,
  hue: string,
  query: string,
  review: TelamonReview,
  reviewed: readonly string[],
  shape: TelamonShape,
): TelamonRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = telamonLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && telamonHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${telamonCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function telamonLanesCsv(rows: readonly TelamonRow[]): string {
  const lines = ["lane,count"];
  for (const line of telamonLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function telamonRowsCsv(rows: readonly TelamonRow[], reviewed: readonly string[]): string {
  const lines = ["name,language,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(telamonCopy(row.code)), telamonLane(row.code), telamonHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
