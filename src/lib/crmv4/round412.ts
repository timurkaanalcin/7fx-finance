/**
 * Metope courses kept in this browser,
 * and triglyph plates read the username already stored on the account.
 * Orders are metope, gutta, regula, and mutule. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 7, 11, or 18. Depths are 4, 7, or 11.
 * Metope and gutta are the warm half. Regula and mutule are the cool half.
 * Graphite is the quiet ground.
 * VERIFIED, PASS, OK, and YES are live. PENDING, REVIEW, WAIT, and HOLD wait.
 * REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut.
 * UNVERIFIED, NONE, BLANK, and EMPTY stay blank.
 * A USR- mark of six letters is a code. A USR- mark of twelve letters or more is long. Other USR- marks stay live.
 * Three letters are a code. Two letters or fewer are short. Eighteen letters or more are long. Anything else holds.
 * A true validation mark reads as VERIFIED. A false mark reads as REJECTED.
 * The secret is not read. Money fields are not read. The plate does not change the saved username.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_metope_course (
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
 * CREATE TABLE crm_triglyph_username_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_triglyph_username_review (
 *   trader_id text primary key
 * );
 */


export const MTE_KEY = "crmv4-metope-412";
export const MTE_VIEW_KEY = "crmv4-metope-views-412";
export const MTE_DENSITY_KEY = "crmv4-metope-density-412";
export const MTE_PROFILES = ["metope", "gutta", "regula", "mutule"] as const;

export type MetopeProfile = (typeof MTE_PROFILES)[number];
export type MetopeBed = "blank" | "ivory" | "graphite" | "gilt";
export type MetopeRack = "base" | "press" | "shelf";
export type MetopeDensity = "open" | "tight";
export type MetopeSort = "profile" | "hand";

export type Metope = {
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

export type MetopeView = {
  id: string;
  name: string;
  rack: MetopeRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type MetopeCounts = {
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

export const ROUND412_FEATURES = [
  "metope-save",
  "metope-reminders",
  "metope-orders",
  "metope-search",
  "metope-hour-sla",
  "metope-case",
  "metope-pin",
  "metope-inline-title",
  "metope-filters",
  "saved-metope-views",
  "metope-density",
  "metope-focus",
  "metope-kpis",
  "metope-chart",
  "metope-timeline",
  "metope-bulk",
  "metope-csv",
  "metope-keys",
  "metope-audit",
  "quietest-metope-hand",
  "metope-viewer",
  "suggest-metope",
  "overdue-metope",
  "triglyph-panels",
  "triglyph-username-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 7, 11, 18] as const;
const DEPTH_CYCLE = [4, 7, 11] as const;
const WARM = new Set(["metope", "gutta"]);
const COOL = new Set(["regula", "mutule"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): MetopeRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<MetopeBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<MetopeBed, "blank">) : "";
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

function inRack(card: Metope, rack: MetopeRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return MTE_PROFILES.indexOf(profile as MetopeProfile);
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
  return (MTE_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 7, 11, or 18. Anything else stays blank. */
export function metopeHour(raw: unknown): 2 | 7 | 11 | 18 | null {
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
export function metopeBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 18).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 18).toLowerCase());
}

/** Metope is first. Gutta is second. Regula is third. Mutule is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "metope") return "first";
  if (text === "gutta") return "second";
  if (text === "regula") return "third";
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
  return QUIET_BED.has(metopeBed(bed));
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
  const hour = metopeHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = metopeBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveMetopeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestMetopeBed(cards: readonly Metope[]): string {
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
export function suggestMetopeHour(cards: readonly Metope[], hour: number): 2 | 7 | 11 | 18 {
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

export function suggestProfile(hour: number): MetopeProfile {
  if (hour < 2) return "metope";
  if (hour < 7) return "gutta";
  if (hour < 11) return "regula";
  return "mutule";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Metope[], roster: string): string {
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

export function readMetopeList(raw: unknown): Metope[] {
  if (!Array.isArray(raw)) return [];
  const out: Metope[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Metope>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: metopeHour(row.hour),
      bed: metopeBed(row.bed),
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

export function addMetope(
  cards: readonly Metope[],
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
): Metope[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readMetopeList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: metopeHour(card.hour),
      bed: metopeBed(card.bed),
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

function mapCard(cards: readonly Metope[], id: string, edit: (card: Metope) => Metope): Metope[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editMetope(cards: readonly Metope[], id: string, title: string): Metope[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editMetopeNote(cards: readonly Metope[], id: string, note: string): Metope[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(metopeBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setMetopeBed(cards: readonly Metope[], id: string, bed: string): Metope[] {
  const next = metopeBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setMetopeRaised(cards: readonly Metope[], id: string, raised: boolean): Metope[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setMetopeRack(cards: readonly Metope[], id: string, pressed: boolean): Metope[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setMetopeShelf(cards: readonly Metope[], id: string, shelved: boolean): Metope[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setMetopePin(cards: readonly Metope[], id: string, pinned: boolean): Metope[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addMetopeTag(cards: readonly Metope[], id: string, tag: string): Metope[] {
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

export function raiseHourFocused(cards: readonly Metope[], id: string): Metope[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Metope[], id: string): Metope[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Metope[], id: string): Metope[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Metope[], id: string): Metope[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setMetopeFocused(cards: readonly Metope[], id: string): Metope[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackMetopeFocused(cards: readonly Metope[], id: string): Metope[] {
  return setMetopeRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinMetopeFocused(cards: readonly Metope[], id: string): Metope[] {
  return setMetopePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Metope[], id: string): Metope[] {
  const card = cards.find((item) => item.id === id);
  return card ? setMetopeBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Metope[], ids: readonly string[], edit: (card: Metope) => Metope): Metope[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkMetopeLinen(cards: readonly Metope[], ids: readonly string[]): Metope[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkMetopeRaise(cards: readonly Metope[], ids: readonly string[]): Metope[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkMetopeShelf(cards: readonly Metope[], ids: readonly string[]): Metope[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkMetopeTag(cards: readonly Metope[], ids: readonly string[]): Metope[] {
  return bulk(cards, ids, (card) => (card.tags.includes("t") ? card : { ...card, tags: tagsOf([...card.tags, "t"]), audit: "tag" }));
}

export function readMetopeViews(raw: unknown): MetopeView[] {
  if (!Array.isArray(raw)) return [];
  const out: MetopeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<MetopeView>;
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

export function addMetopeView(views: readonly MetopeView[], view: MetopeView): MetopeView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readMetopeViews([...views, { ...view, name }]);
}

export function dropMetopeView(views: readonly MetopeView[], id: string): MetopeView[] {
  return views.filter((view) => view.id !== id);
}

export function metopeDensity(raw: unknown): MetopeDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortMetopeList(cards: readonly Metope[], sort: MetopeSort): Metope[] {
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

export function visibleMetopeList(
  cards: readonly Metope[],
  rack: MetopeRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Metope[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : metopeBed(bed);
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

/** A mutule at depth four, still not raised and not shelved, is overdue. */
export function overdueMetope(card: Metope): boolean {
  return card.profile === "mutule" && card.depth === 4 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth four, and still on the yard. */
export function idleMetope(card: Metope): boolean {
  return !card.bed && card.hour === 2 && card.depth === 4 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, eighteen hours, and a full depth, still off the shelf. */
export function briskMetope(card: Metope): boolean {
  return card.bed === "GRAPHITE" && card.hour === 18 && card.depth === 11 && !card.shelved;
}

/** Regula, ivory, and seven hours. */
export function restingMetope(card: Metope): boolean {
  return card.profile === "regula" && card.bed === "IVORY" && card.hour === 7;
}

/** An metope is late when the station is already mutule. */
export function lateMetope(card: Metope, station: string): boolean {
  return card.profile === "metope" && profilePoint(station) === "mutule" && !card.raised;
}

export function metopeCounts(cards: readonly Metope[], shown: readonly Metope[], station: string): MetopeCounts {
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
    idle: cards.filter(idleMetope).length,
    brisk: cards.filter(briskMetope).length,
    resting: cards.filter(restingMetope).length,
    overdue: cards.filter(overdueMetope).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateMetope(card, station)).length,
  };
}

export function metopeBars(cards: readonly Metope[]): { profile: string; count: number }[] {
  return MTE_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function metopeTimeline(cards: readonly Metope[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function metopeHands(cards: readonly Metope[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Metope[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of metopeHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderMetopeList(cards: readonly Metope[]): string[] {
  return cards.filter(overdueMetope).map((card) => card.title);
}

export function metopeCopy(card: Metope): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function metopeCsv(cards: readonly Metope[], station: string): string {
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
        lateMetope(card, station) ? "1" : "0",
        idleMetope(card) ? "1" : "0",
        briskMetope(card) ? "1" : "0",
        restingMetope(card) ? "1" : "0",
        overdueMetope(card) ? "1" : "0",
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


export const TRG_HIDE_KEY = "crmv4-triglyph-hide-412";
export const TRG_REVIEW_KEY = "crmv4-triglyph-review-412";

export type TriglyphLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type TriglyphHue = "" | "gilt" | "ash" | "pearl";
export type TriglyphState = "" | "clear" | "set";
export type TriglyphReview = "all" | "reviewed" | "fresh";
export type TriglyphShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type TriglyphValue = string | { username?: unknown; [key: string]: unknown } | null | undefined;
export type TriglyphRow = { id: string; label: string; code: TriglyphValue; userId?: string };
export type TriglyphLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["VERIFIED", "PASS", "OK", "YES"]);
const HOLD_TITLES = new Set(["PENDING", "REVIEW", "WAIT", "HOLD"]);
const SHUT_TITLES = new Set(["REJECTED", "DENY", "FAIL", "NO", "BLOCK", "OFF"]);
const BLANK_TITLES = new Set(["UNVERIFIED", "NONE", "BLANK", "EMPTY"]);

function triglyphRecord(raw: TriglyphValue): { username?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function triglyphBlocked(raw: TriglyphValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function triglyphGiven(raw: TriglyphValue): string {
  const row = triglyphRecord(raw);
  if (row && !("username" in row)) return "";
  const value = row ? row.username : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "VERIFIED";
  if (value === false || value === "false" || value === "0" || value === 0) return "REJECTED";
  return snip(value, 48);
}

function triglyphReadable(raw: TriglyphValue): boolean {
  if (triglyphBlocked(raw)) return false;
  const row = triglyphRecord(raw);
  if (row && !("username" in row)) return false;
  return true;
}


export function triglyphSlice(raw: unknown): TriglyphValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("username" in row)) return { username: "" };
  const value = row.username;
  if (typeof value === "string") return { username: snip(value, 48) };
  return { username: value as never };
}

export function triglyphState(raw: TriglyphValue): TriglyphState {
  if (!triglyphReadable(raw)) return "";
  return triglyphGiven(raw) ? "set" : "clear";
}

/** Word marks win first. VERIFIED, PASS, OK, and YES are live. PENDING, REVIEW, WAIT, and HOLD wait. REJECTED, DENY, FAIL, NO, BLOCK, and OFF are shut. UNVERIFIED, NONE, BLANK, and EMPTY stay blank. A USR- mark of six letters is a code. A USR- mark of twelve letters or more is long. Any other USR- mark is live. Three letters are a code. Two letters or fewer are short. Eighteen letters or more are long. Anything else holds. */
export function triglyphLane(raw: TriglyphValue): TriglyphLane {
  if (triglyphState(raw) !== "set") return "";
  const text = triglyphGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("USR-") && text.length === 6) return "code";
  if (upper.startsWith("USR-") && text.length >= 12) return "long";
  if (upper.startsWith("USR-")) return "live";
  if (/^[A-Za-z]{3}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 18) return "long";
  return "hold";
}

export function triglyphHue(raw: TriglyphValue): TriglyphHue {
  const mail = triglyphLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function triglyphLit(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "live";
}

export function triglyphNear(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "code";
}

export function triglyphFar(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "short";
}

export function triglyphFade(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "long";
}

export function triglyphDark(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "shut";
}

export function triglyphDim(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "hold";
}

export function triglyphBlank(raw: TriglyphValue): boolean {
  return triglyphLane(raw) === "blank";
}

export function triglyphOpen(raw: TriglyphValue): boolean {
  return triglyphState(raw) === "clear";
}

export function triglyphLength(raw: TriglyphValue): number | null {
  if (triglyphState(raw) !== "set") return null;
  return triglyphGiven(raw).length;
}

export function triglyphEven(raw: TriglyphValue): boolean {
  const length = triglyphLength(raw);
  return length !== null && length % 2 === 0;
}

export function triglyphDigit(raw: TriglyphValue): boolean {
  return /[0-9]/.test(triglyphGiven(raw));
}

export function triglyphLetter(raw: TriglyphValue): boolean {
  return /[A-Za-z]/.test(triglyphGiven(raw));
}

export function triglyphUpper(raw: TriglyphValue): boolean {
  const text = triglyphGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function triglyphCopy(raw: TriglyphValue): string {
  return triglyphGiven(raw);
}

export function triglyphStamp(raw: TriglyphValue): string {
  const text = triglyphGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function triglyphLanes(rows: readonly TriglyphRow[]): TriglyphLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = triglyphLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingTriglyph(rows: readonly TriglyphRow[]): string {
  const lines = triglyphLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingTriglyphHue(rows: readonly TriglyphRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = triglyphHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneTriglyphCount(rows: readonly TriglyphRow[], mail: TriglyphLane): number {
  return rows.filter((row) => triglyphLane(row.code) === mail).length;
}

export function triglyphShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentTriglyphLanes(rows: readonly TriglyphRow[]): string[] {
  return triglyphLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenTriglyph(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedTriglyph(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleTriglyph(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleTriglyphReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkTriglyphReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleTriglyphLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: TriglyphValue, shape: TriglyphShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return triglyphOpen(raw);
  if (shape === "digit") return triglyphDigit(raw);
  if (shape === "letter") return triglyphLetter(raw);
  if (shape === "even") return triglyphEven(raw);
  if (shape === "upper") return triglyphUpper(raw);
  return triglyphLane(raw) === shape;
}

export function visibleTriglyph(
  rows: readonly TriglyphRow[],
  mail: string,
  hue: string,
  query: string,
  review: TriglyphReview,
  reviewed: readonly string[],
  shape: TriglyphShape,
): TriglyphRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = triglyphLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && triglyphHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${triglyphCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function triglyphLanesCsv(rows: readonly TriglyphRow[]): string {
  const lines = ["lane,count"];
  for (const line of triglyphLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function triglyphRowsCsv(rows: readonly TriglyphRow[], reviewed: readonly string[]): string {
  const lines = ["name,username,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(triglyphCopy(row.code)), triglyphLane(row.code), triglyphHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
