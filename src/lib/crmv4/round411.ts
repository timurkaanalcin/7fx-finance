/**
 * Peristasis courses kept in this browser,
 * and pendentive plates read the validation status already stored on the account.
 * Orders are peristasis, surbase, femur, and mascaron. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 7, 11, or 18. Depths are 4, 7, or 11.
 * Peristasis and surbase are the warm half. Femur and mascaron are the cool half.
 * Graphite is the quiet ground.
 * VERIFIED, PASS, OK, and YES are live. PENDING, REVIEW, WAIT, and HOLD wait.
 * REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut.
 * UNVERIFIED, NONE, BLANK, and EMPTY stay blank.
 * A VAL- mark of six letters is a code. A VAL- mark of twelve letters or more is long. Other VAL- marks stay live.
 * Three letters are a code. Two letters or fewer are short. Eighteen letters or more are long. Anything else holds.
 * A true validation mark reads as VERIFIED. A false mark reads as REJECTED.
 * The secret is not read. Money fields are not read. The plate does not change the saved validation status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_peristasis_course (
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
 * CREATE TABLE crm_pendentive_validation_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_pendentive_validation_review (
 *   trader_id text primary key
 * );
 */


export const PRS_KEY = "crmv4-peristasis-410";
export const PRS_VIEW_KEY = "crmv4-peristasis-views-410";
export const PRS_DENSITY_KEY = "crmv4-peristasis-density-410";
export const PRS_PROFILES = ["peristasis", "surbase", "femur", "mascaron"] as const;

export type PeristasisProfile = (typeof PRS_PROFILES)[number];
export type PeristasisBed = "blank" | "ivory" | "graphite" | "gilt";
export type PeristasisRack = "base" | "press" | "shelf";
export type PeristasisDensity = "open" | "tight";
export type PeristasisSort = "profile" | "hand";

export type Peristasis = {
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

export type PeristasisView = {
  id: string;
  name: string;
  rack: PeristasisRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type PeristasisCounts = {
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

export const ROUND411_FEATURES = [
  "peristasis-save",
  "peristasis-reminders",
  "peristasis-orders",
  "peristasis-search",
  "peristasis-hour-sla",
  "peristasis-case",
  "peristasis-pin",
  "peristasis-inline-title",
  "peristasis-filters",
  "saved-peristasis-views",
  "peristasis-density",
  "peristasis-focus",
  "peristasis-kpis",
  "peristasis-chart",
  "peristasis-timeline",
  "peristasis-bulk",
  "peristasis-csv",
  "peristasis-keys",
  "peristasis-audit",
  "quietest-peristasis-hand",
  "peristasis-viewer",
  "suggest-peristasis",
  "overdue-peristasis",
  "pendentive-panels",
  "pendentive-validation-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 7, 11, 18] as const;
const DEPTH_CYCLE = [4, 7, 11] as const;
const WARM = new Set(["peristasis", "surbase"]);
const COOL = new Set(["femur", "mascaron"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): PeristasisRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<PeristasisBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<PeristasisBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ar]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Peristasis, rack: PeristasisRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return PRS_PROFILES.indexOf(profile as PeristasisProfile);
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
  return (PRS_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 7, 11, or 18. Anything else stays blank. */
export function peristasisHour(raw: unknown): 2 | 7 | 11 | 18 | null {
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
export function peristasisBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Peristasis is first. Surbase is second. Femur is third. Mascaron is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "peristasis") return "first";
  if (text === "surbase") return "second";
  if (text === "femur") return "third";
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
  return QUIET_BED.has(peristasisBed(bed));
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
  const hour = peristasisHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = peristasisBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function movePeristasisFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestPeristasisBed(cards: readonly Peristasis[]): string {
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
export function suggestPeristasisHour(cards: readonly Peristasis[], hour: number): 2 | 7 | 11 | 18 {
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

export function suggestProfile(hour: number): PeristasisProfile {
  if (hour < 2) return "peristasis";
  if (hour < 7) return "surbase";
  if (hour < 11) return "femur";
  return "mascaron";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Peristasis[], roster: string): string {
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

export function readPeristasisList(raw: unknown): Peristasis[] {
  if (!Array.isArray(raw)) return [];
  const out: Peristasis[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Peristasis>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: peristasisHour(row.hour),
      bed: peristasisBed(row.bed),
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

export function addPeristasis(
  cards: readonly Peristasis[],
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
): Peristasis[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPeristasisList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: peristasisHour(card.hour),
      bed: peristasisBed(card.bed),
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

function mapCard(cards: readonly Peristasis[], id: string, edit: (card: Peristasis) => Peristasis): Peristasis[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPeristasis(cards: readonly Peristasis[], id: string, title: string): Peristasis[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPeristasisNote(cards: readonly Peristasis[], id: string, note: string): Peristasis[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(peristasisBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setPeristasisBed(cards: readonly Peristasis[], id: string, bed: string): Peristasis[] {
  const next = peristasisBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setPeristasisRaised(cards: readonly Peristasis[], id: string, raised: boolean): Peristasis[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setPeristasisRack(cards: readonly Peristasis[], id: string, pressed: boolean): Peristasis[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setPeristasisShelf(cards: readonly Peristasis[], id: string, shelved: boolean): Peristasis[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setPeristasisPin(cards: readonly Peristasis[], id: string, pinned: boolean): Peristasis[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addPeristasisTag(cards: readonly Peristasis[], id: string, tag: string): Peristasis[] {
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

export function raiseHourFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setPeristasisFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackPeristasisFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return setPeristasisRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinPeristasisFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  return setPeristasisPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Peristasis[], id: string): Peristasis[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPeristasisBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Peristasis[], ids: readonly string[], edit: (card: Peristasis) => Peristasis): Peristasis[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPeristasisLinen(cards: readonly Peristasis[], ids: readonly string[]): Peristasis[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkPeristasisRaise(cards: readonly Peristasis[], ids: readonly string[]): Peristasis[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkPeristasisShelf(cards: readonly Peristasis[], ids: readonly string[]): Peristasis[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkPeristasisTag(cards: readonly Peristasis[], ids: readonly string[]): Peristasis[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readPeristasisViews(raw: unknown): PeristasisView[] {
  if (!Array.isArray(raw)) return [];
  const out: PeristasisView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PeristasisView>;
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

export function addPeristasisView(views: readonly PeristasisView[], view: PeristasisView): PeristasisView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPeristasisViews([...views, { ...view, name }]);
}

export function dropPeristasisView(views: readonly PeristasisView[], id: string): PeristasisView[] {
  return views.filter((view) => view.id !== id);
}

export function peristasisDensity(raw: unknown): PeristasisDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortPeristasisList(cards: readonly Peristasis[], sort: PeristasisSort): Peristasis[] {
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

export function visiblePeristasisList(
  cards: readonly Peristasis[],
  rack: PeristasisRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Peristasis[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : peristasisBed(bed);
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

/** A mascaron at depth four, still not raised and not shelved, is overdue. */
export function overduePeristasis(card: Peristasis): boolean {
  return card.profile === "mascaron" && card.depth === 4 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth four, and still on the yard. */
export function idlePeristasis(card: Peristasis): boolean {
  return !card.bed && card.hour === 2 && card.depth === 4 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, eighteen hours, and a full depth, still off the shelf. */
export function briskPeristasis(card: Peristasis): boolean {
  return card.bed === "GRAPHITE" && card.hour === 18 && card.depth === 11 && !card.shelved;
}

/** Femur, ivory, and seven hours. */
export function restingPeristasis(card: Peristasis): boolean {
  return card.profile === "femur" && card.bed === "IVORY" && card.hour === 7;
}

/** An peristasis is late when the station is already mascaron. */
export function latePeristasis(card: Peristasis, station: string): boolean {
  return card.profile === "peristasis" && profilePoint(station) === "mascaron" && !card.raised;
}

export function peristasisCounts(cards: readonly Peristasis[], shown: readonly Peristasis[], station: string): PeristasisCounts {
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
    idle: cards.filter(idlePeristasis).length,
    brisk: cards.filter(briskPeristasis).length,
    resting: cards.filter(restingPeristasis).length,
    overdue: cards.filter(overduePeristasis).length,
    pair: cards.filter((card) => midDepth(card.depth) && latePeristasis(card, station)).length,
  };
}

export function peristasisBars(cards: readonly Peristasis[]): { profile: string; count: number }[] {
  return PRS_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function peristasisTimeline(cards: readonly Peristasis[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function peristasisHands(cards: readonly Peristasis[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Peristasis[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of peristasisHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPeristasisList(cards: readonly Peristasis[]): string[] {
  return cards.filter(overduePeristasis).map((card) => card.title);
}

export function peristasisCopy(card: Peristasis): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function peristasisCsv(cards: readonly Peristasis[], station: string): string {
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
        latePeristasis(card, station) ? "1" : "0",
        idlePeristasis(card) ? "1" : "0",
        briskPeristasis(card) ? "1" : "0",
        restingPeristasis(card) ? "1" : "0",
        overduePeristasis(card) ? "1" : "0",
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


export const PDV_HIDE_KEY = "crmv4-pendentive-hide-410";
export const PDV_REVIEW_KEY = "crmv4-pendentive-review-410";

export type PendentiveLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type PendentiveHue = "" | "gilt" | "ash" | "pearl";
export type PendentiveState = "" | "clear" | "set";
export type PendentiveReview = "all" | "reviewed" | "fresh";
export type PendentiveShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type PendentiveValue = string | { validationStatus?: unknown; [key: string]: unknown } | null | undefined;
export type PendentiveRow = { id: string; label: string; code: PendentiveValue; userId?: string };
export type PendentiveLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["VERIFIED", "PASS", "OK", "YES"]);
const HOLD_TITLES = new Set(["PENDING", "REVIEW", "WAIT", "HOLD"]);
const SHUT_TITLES = new Set(["REJECTED", "DENY", "FAIL", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["UNVERIFIED", "NONE", "BLANK", "EMPTY"]);

function pendentiveRecord(raw: PendentiveValue): { validationStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function pendentiveBlocked(raw: PendentiveValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function pendentiveGiven(raw: PendentiveValue): string {
  const row = pendentiveRecord(raw);
  if (row && !("validationStatus" in row)) return "";
  const value = row ? row.validationStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "VERIFIED";
  if (value === false || value === "false" || value === "0" || value === 0) return "REJECTED";
  return snip(value, 48);
}

function pendentiveReadable(raw: PendentiveValue): boolean {
  if (pendentiveBlocked(raw)) return false;
  const row = pendentiveRecord(raw);
  if (row && !("validationStatus" in row)) return false;
  return true;
}


export function pendentiveSlice(raw: unknown): PendentiveValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("validationStatus" in row)) return { validationStatus: "" };
  const value = row.validationStatus;
  if (typeof value === "string") return { validationStatus: snip(value, 48) };
  return { validationStatus: value as never };
}

export function pendentiveState(raw: PendentiveValue): PendentiveState {
  if (!pendentiveReadable(raw)) return "";
  return pendentiveGiven(raw) ? "set" : "clear";
}

/** Word marks win first. VERIFIED, PASS, OK, and YES are live. PENDING, REVIEW, WAIT, and HOLD wait. REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut. UNVERIFIED, NONE, BLANK, and EMPTY stay blank. A VAL- mark of six letters is a code. A VAL- mark of twelve letters or more is long. Any other VAL- mark is live. Three letters are a code. Two letters or fewer are short. Eighteen letters or more are long. Anything else holds. */
export function pendentiveLane(raw: PendentiveValue): PendentiveLane {
  if (pendentiveState(raw) !== "set") return "";
  const text = pendentiveGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("VAL-") && text.length === 6) return "code";
  if (upper.startsWith("VAL-") && text.length >= 12) return "long";
  if (upper.startsWith("VAL-")) return "live";
  if (/^[A-Za-z]{3}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 18) return "long";
  return "hold";
}

export function pendentiveHue(raw: PendentiveValue): PendentiveHue {
  const mail = pendentiveLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function pendentiveLit(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "live";
}

export function pendentiveNear(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "code";
}

export function pendentiveFar(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "short";
}

export function pendentiveFade(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "long";
}

export function pendentiveDark(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "shut";
}

export function pendentiveDim(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "hold";
}

export function pendentiveBlank(raw: PendentiveValue): boolean {
  return pendentiveLane(raw) === "blank";
}

export function pendentiveOpen(raw: PendentiveValue): boolean {
  return pendentiveState(raw) === "clear";
}

export function pendentiveLength(raw: PendentiveValue): number | null {
  if (pendentiveState(raw) !== "set") return null;
  return pendentiveGiven(raw).length;
}

export function pendentiveEven(raw: PendentiveValue): boolean {
  const length = pendentiveLength(raw);
  return length !== null && length % 2 === 0;
}

export function pendentiveDigit(raw: PendentiveValue): boolean {
  return /[0-9]/.test(pendentiveGiven(raw));
}

export function pendentiveLetter(raw: PendentiveValue): boolean {
  return /[A-Za-z]/.test(pendentiveGiven(raw));
}

export function pendentiveUpper(raw: PendentiveValue): boolean {
  const text = pendentiveGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function pendentiveCopy(raw: PendentiveValue): string {
  return pendentiveGiven(raw);
}

export function pendentiveStamp(raw: PendentiveValue): string {
  const text = pendentiveGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function pendentiveLanes(rows: readonly PendentiveRow[]): PendentiveLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = pendentiveLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingPendentive(rows: readonly PendentiveRow[]): string {
  const lines = pendentiveLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingPendentiveHue(rows: readonly PendentiveRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = pendentiveHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function lanePendentiveCount(rows: readonly PendentiveRow[], mail: PendentiveLane): number {
  return rows.filter((row) => pendentiveLane(row.code) === mail).length;
}

export function pendentiveShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPendentiveLanes(rows: readonly PendentiveRow[]): string[] {
  return pendentiveLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenPendentive(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPendentive(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePendentive(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function togglePendentiveReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPendentiveReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePendentiveLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: PendentiveValue, shape: PendentiveShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return pendentiveOpen(raw);
  if (shape === "digit") return pendentiveDigit(raw);
  if (shape === "letter") return pendentiveLetter(raw);
  if (shape === "even") return pendentiveEven(raw);
  if (shape === "upper") return pendentiveUpper(raw);
  return pendentiveLane(raw) === shape;
}

export function visiblePendentive(
  rows: readonly PendentiveRow[],
  mail: string,
  hue: string,
  query: string,
  review: PendentiveReview,
  reviewed: readonly string[],
  shape: PendentiveShape,
): PendentiveRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = pendentiveLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && pendentiveHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${pendentiveCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function pendentiveLanesCsv(rows: readonly PendentiveRow[]): string {
  const lines = ["lane,count"];
  for (const line of pendentiveLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function pendentiveRowsCsv(rows: readonly PendentiveRow[], reviewed: readonly string[]): string {
  const lines = ["name,validation,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(pendentiveCopy(row.code)), pendentiveLane(row.code), pendentiveHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
