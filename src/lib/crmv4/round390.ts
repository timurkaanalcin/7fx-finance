/**
 * Ogee scrolls kept in this browser,
 * and cavetto hollows read the trading group already stored on the account.
 * Profiles are ogee, cyma, scotia, and torus. Beds are linen, slate, and gilt.
 * Hours are 2, 6, 10, or 14. Depths are 2, 4, or 8.
 * Ogee and cyma are the warm half. Scotia and torus are the cool half.
 * Linen is the quiet bed.
 * A group word today is due. Within three days ahead is soon. Further ahead is far.
 * A group date younger than five days past is late. Older than that is missed.
 * Desk, live, open, and group are due. Next, soon, and warm are soon. Park, still, and pause hold.
 * Old and dust are late. Lost, away, quiet, and void are missed. None, dash, empty, and clear stay blank.
 * A true group reads as GROUP. A false group reads as VOID.
 * Money fields are not read. The hollow does not change the saved trading group.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_ogee_scroll (
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
 *   kilned boolean not null default false,
 *   lofted boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_cavetto_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_cavetto_review (
 *   trader_id text primary key
 * );
 */
export const OGE_KEY = "crmv4-ogee-390";
export const OGE_VIEW_KEY = "crmv4-ogee-views-390";
export const OGE_DENSITY_KEY = "crmv4-ogee-density-390";
export const OGE_PROFILES = ["ogee", "cyma", "scotia", "torus"] as const;

export type OgeeProfile = (typeof OGE_PROFILES)[number];
export type OgeeBed = "blank" | "linen" | "slate" | "gilt";
export type OgeeRack = "bench" | "kiln" | "loft";
export type OgeeDensity = "open" | "tight";
export type OgeeSort = "profile" | "hand";

export type Ogee = {
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
  kilned: boolean;
  lofted: boolean;
  pinned: boolean;
  audit: string;
};

export type OgeeView = {
  id: string;
  name: string;
  rack: OgeeRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type OgeeCounts = {
  bench: number;
  kiln: number;
  loft: number;
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

export const ROUND390_FEATURES = [
  "ogee-save",
  "ogee-reminders",
  "ogee-profiles",
  "ogee-search",
  "ogee-hour-sla",
  "ogee-loft",
  "ogee-pin",
  "ogee-inline-title",
  "ogee-filters",
  "saved-ogee-views",
  "ogee-density",
  "ogee-focus",
  "ogee-kpis",
  "ogee-chart",
  "ogee-timeline",
  "ogee-bulk",
  "ogee-csv",
  "ogee-keys",
  "ogee-audit",
  "lightest-scroll-hand",
  "ogee-viewer",
  "suggest-ogee",
  "overdue-torus",
  "cavetto-hollows",
  "cavetto-group-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "kiln", "return", "loft", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["linen", "slate", "gilt"] as const;
const HOUR_CYCLE = [2, 6, 10, 14] as const;
const DEPTH_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["ogee", "cyma"]);
const COOL = new Set(["scotia", "torus"]);
const QUIET_BED = new Set(["LINEN"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): OgeeRack {
  return raw === "kiln" || raw === "loft" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<OgeeBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<OgeeBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[rs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Ogee, rack: OgeeRack): boolean {
  if (rack === "kiln") return card.kilned && !card.lofted;
  if (rack === "loft") return card.lofted;
  return !card.kilned && !card.lofted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return OGE_PROFILES.indexOf(profile as OgeeProfile);
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
  return (OGE_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 6, 10, or 14. Anything else stays blank. */
export function ogeeHour(raw: unknown): 2 | 6 | 10 | 14 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10" && text !== "14") return null;
  return Number(text) as 2 | 6 | 10 | 14;
}

/** A depth is 2, 4, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A bed is linen, slate, or gilt. The saved name is the upper token. */
export function ogeeBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Ogee is first. Cyma is second. Scotia is third. Torus is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "ogee") return "first";
  if (text === "cyma") return "second";
  if (text === "scotia") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the bench. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function linenQuiet(bed: unknown): boolean {
  return QUIET_BED.has(ogeeBed(bed));
}

/** A pair depth is 4. Two and eight are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 4;
}

/** A full depth is 8. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 8;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = ogeeHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = ogeeBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveOgeeFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the bench uses least. A tie keeps linen, then slate, then gilt. */
export function suggestOgeeBed(cards: readonly Ogee[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "bench") || !card.bed) continue;
    counts.set(card.bed, (counts.get(card.bed) || 0) + 1);
  }
  let best = "LINEN";
  let score = Number.POSITIVE_INFINITY;
  for (const bed of ["LINEN", "SLATE", "GILT"]) {
    const count = counts.get(bed) || 0;
    if (count < score) {
      best = bed;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest two. Before eleven, suggest six. Before seventeen, suggest ten. Later, suggest fourteen. A saved hour on the bench wins, and a tie keeps the shorter hour. */
export function suggestOgeeHour(cards: readonly Ogee[], hour: number): 2 | 6 | 10 | 14 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "bench") || card.hour === null) continue;
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
  if (hour < 5) return 2;
  if (hour < 11) return 6;
  if (hour < 17) return 10;
  return 14;
}

export function suggestProfile(hour: number): OgeeProfile {
  if (hour < 5) return "ogee";
  if (hour < 11) return "cyma";
  if (hour < 17) return "scotia";
  return "torus";
}

/** The hand with the fewest unraised scrolls on the bench. A tie keeps the roster order. */
export function fairHand(cards: readonly Ogee[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inRack(card, "bench") && !card.raised);
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

export function readOgeeList(raw: unknown): Ogee[] {
  if (!Array.isArray(raw)) return [];
  const out: Ogee[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Ogee>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: ogeeHour(row.hour),
      bed: ogeeBed(row.bed),
      depth: depthCount(row.depth) ?? 2,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      kilned: row.kilned === true,
      lofted: row.lofted === true,
      pinned: row.pinned === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addOgee(
  cards: readonly Ogee[],
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
): Ogee[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOgeeList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: ogeeHour(card.hour),
      bed: ogeeBed(card.bed),
      depth: depthCount(card.depth) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      kilned: false,
      lofted: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Ogee[], id: string, edit: (card: Ogee) => Ogee): Ogee[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOgee(cards: readonly Ogee[], id: string, title: string): Ogee[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOgeeNote(cards: readonly Ogee[], id: string, note: string): Ogee[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "LINEN", "SLATE", "GILT"];
  const index = order.indexOf(ogeeBed(bed));
  return order[(index + 1) % order.length] || "LINEN";
}

export function setOgeeBed(cards: readonly Ogee[], id: string, bed: string): Ogee[] {
  const next = ogeeBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setOgeeRaised(cards: readonly Ogee[], id: string, raised: boolean): Ogee[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setOgeeRack(cards: readonly Ogee[], id: string, kilned: boolean): Ogee[] {
  return mapCard(cards, id, (card) => (card.kilned === kilned ? card : { ...card, kilned, lofted: kilned ? false : card.lofted, audit: kilned ? "kiln" : "return" }));
}

export function setOgeeLoft(cards: readonly Ogee[], id: string, lofted: boolean): Ogee[] {
  return mapCard(cards, id, (card) => (card.lofted === lofted ? card : { ...card, lofted, kilned: lofted ? false : card.kilned, audit: lofted ? "loft" : "open" }));
}

export function setOgeePin(cards: readonly Ogee[], id: string, pinned: boolean): Ogee[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addOgeeTag(cards: readonly Ogee[], id: string, tag: string): Ogee[] {
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

function stepDepth(depth: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setOgeeFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackOgeeFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return setOgeeRack(cards, id, !cards.find((card) => card.id === id)?.kilned);
}

export function pinOgeeFocused(cards: readonly Ogee[], id: string): Ogee[] {
  return setOgeePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Ogee[], id: string): Ogee[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOgeeBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Ogee[], ids: readonly string[], edit: (card: Ogee) => Ogee): Ogee[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOgeeLinen(cards: readonly Ogee[], ids: readonly string[]): Ogee[] {
  return bulk(cards, ids, (card) => (card.bed === "LINEN" ? card : { ...card, bed: "LINEN", audit: "bed" }));
}

export function bulkOgeeRaise(cards: readonly Ogee[], ids: readonly string[]): Ogee[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkOgeeLoft(cards: readonly Ogee[], ids: readonly string[]): Ogee[] {
  return bulk(cards, ids, (card) => (card.lofted ? card : { ...card, lofted: true, kilned: false, audit: "loft" }));
}

export function bulkOgeeTag(cards: readonly Ogee[], ids: readonly string[]): Ogee[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readOgeeViews(raw: unknown): OgeeView[] {
  if (!Array.isArray(raw)) return [];
  const out: OgeeView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OgeeView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      rack: rackOf(row.rack),
      query: snip(row.query, 40),
      hand: snip(row.hand, 24),
      bed: activeBed(row.bed, ["LINEN", "SLATE", "GILT"]),
      profile: activeProfile(row.profile),
      hour: activeHour(row.hour),
      depth: activeDepth(row.depth),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOgeeView(views: readonly OgeeView[], view: OgeeView): OgeeView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOgeeViews([...views, { ...view, name }]);
}

export function dropOgeeView(views: readonly OgeeView[], id: string): OgeeView[] {
  return views.filter((view) => view.id !== id);
}

export function ogeeDensity(raw: unknown): OgeeDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortOgeeList(cards: readonly Ogee[], sort: OgeeSort): Ogee[] {
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

export function visibleOgeeList(
  cards: readonly Ogee[],
  rack: OgeeRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Ogee[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : ogeeBed(bed);
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

/** Torus at depth two, still not raised and not in the loft, is overdue. */
export function overdueOgee(card: Ogee): boolean {
  return card.profile === "torus" && card.depth === 2 && !card.raised && !card.lofted;
}

/** No bed, two hours, depth two, and still on the bench. */
export function idleOgee(card: Ogee): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.kilned && !card.lofted;
}

/** Slate, fourteen hours, and a full depth, still out of the loft. */
export function briskOgee(card: Ogee): boolean {
  return card.bed === "SLATE" && card.hour === 14 && card.depth === 8 && !card.lofted;
}

/** Scotia, linen, and six hours. */
export function restingOgee(card: Ogee): boolean {
  return card.profile === "scotia" && card.bed === "LINEN" && card.hour === 6;
}

/** An ogee scroll is late when the station is already torus. */
export function lateOgee(card: Ogee, station: string): boolean {
  return card.profile === "ogee" && profilePoint(station) === "torus" && !card.raised;
}

export function ogeeCounts(cards: readonly Ogee[], shown: readonly Ogee[], station: string): OgeeCounts {
  return {
    bench: cards.filter((card) => inRack(card, "bench")).length,
    kiln: cards.filter((card) => inRack(card, "kiln")).length,
    loft: cards.filter((card) => inRack(card, "loft")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 14).length,
    quiet: cards.filter((card) => linenQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleOgee).length,
    brisk: cards.filter(briskOgee).length,
    resting: cards.filter(restingOgee).length,
    overdue: cards.filter(overdueOgee).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateOgee(card, station)).length,
  };
}

export function ogeeBars(cards: readonly Ogee[]): { profile: string; count: number }[] {
  return OGE_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.lofted).length }));
}

export function ogeeTimeline(cards: readonly Ogee[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "bench"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function ogeeHands(cards: readonly Ogee[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Ogee[]): string {
  const open = cards.filter((card) => inRack(card, "bench") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of ogeeHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOgeeList(cards: readonly Ogee[]): string[] {
  return cards.filter(overdueOgee).map((card) => card.title);
}

export function ogeeCopy(card: Ogee): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function ogeeCsv(cards: readonly Ogee[], station: string): string {
  const lines = ["title,hand,profile,bed,hours,depth,tags,raised,kiln,loft,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
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
        card.kilned ? "1" : "0",
        card.lofted ? "1" : "0",
        card.pinned ? "1" : "0",
        profileCool(card.profile) ? "1" : "0",
        lateOgee(card, station) ? "1" : "0",
        idleOgee(card) ? "1" : "0",
        briskOgee(card) ? "1" : "0",
        restingOgee(card) ? "1" : "0",
        overdueOgee(card) ? "1" : "0",
        profileWarm(card.profile) ? "1" : "0",
        linenQuiet(card.bed) ? "1" : "0",
        profileBand(card.profile),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const CVT_HIDE_KEY = "crmv4-cavetto-hide-390";
export const CVT_REVIEW_KEY = "crmv4-cavetto-review-390";

export type HollowLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type HollowHue = "" | "gilt" | "ash" | "pearl";
export type HollowState = "" | "clear" | "set";
export type HollowReview = "all" | "reviewed" | "fresh";
export type HollowShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type HollowValue = string | { tradingGroup?: unknown; [key: string]: unknown } | null | undefined;
export type HollowRow = { id: string; label: string; code: HollowValue; userId?: string };
export type HollowLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const DUE_TITLES = new Set(["DESK", "LIVE", "OPEN", "GROUP"]);
const SOON_TITLES = new Set(["NEXT", "SOON", "WARM"]);
const HOLD_TITLES = new Set(["PARK", "STILL", "PAUSE"]);
const LATE_TITLES = new Set(["OLD", "DUST"]);
const MISSED_TITLES = new Set(["LOST", "AWAY", "QUIET", "VOID"]);
const BLANK_TITLES = new Set(["NONE", "DASH", "EMPTY", "CLEAR"]);

function hollowRecord(raw: HollowValue): { tradingGroup?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function hollowBlocked(raw: HollowValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function hollowGiven(raw: HollowValue): string {
  const row = hollowRecord(raw);
  if (row && !("tradingGroup" in row)) return "";
  const value = row ? row.tradingGroup : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "GROUP";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function hollowReadable(raw: HollowValue): boolean {
  if (hollowBlocked(raw)) return false;
  const row = hollowRecord(raw);
  if (row && !("tradingGroup" in row)) return false;
  return true;
}

function isoAt(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(text)) return null;
  const at = Date.parse(text);
  return Number.isNaN(at) ? null : at;
}

function dayStart(ms: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function hollowState(raw: HollowValue): HollowState {
  if (!hollowReadable(raw)) return "";
  return hollowGiven(raw) ? "set" : "clear";
}

/** A known group word maps first. A date today is due. Within three days ahead is soon. Further ahead is far.
 * Younger than five days past is late. Older is missed.
 * A long mark is far. A mark that starts with a digit is due. A mark that starts with a vowel holds.
 */
export function hollowLane(raw: HollowValue, now = Date.now()): HollowLane {
  if (hollowState(raw) !== "set") return "";
  const text = hollowGiven(raw);
  const upper = text.toUpperCase();
  if (DUE_TITLES.has(upper)) return "due";
  if (SOON_TITLES.has(upper)) return "soon";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (LATE_TITLES.has(upper)) return "late";
  if (MISSED_TITLES.has(upper)) return "missed";
  if (BLANK_TITLES.has(upper)) return "blank";
  const at = isoAt(text);
  if (at !== null) {
    const day = 86400000;
    const diff = dayStart(at) - dayStart(now);
    if (diff === 0) return "due";
    if (diff > 0 && diff <= 3 * day) return "soon";
    if (diff > 3 * day) return "far";
    if (now - at < 5 * day) return "late";
    return "missed";
  }
  if (text.length >= 10) return "far";
  if (/^[0-9]/.test(text)) return "due";
  if (/^[aeiou]/i.test(text)) return "hold";
  return "soon";
}

export function hollowHue(raw: HollowValue, now = Date.now()): HollowHue {
  const mail = hollowLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ash";
  return "pearl";
}

export function hollowLit(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "due";
}

export function hollowNear(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "soon";
}

export function hollowFar(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "far";
}

export function hollowFade(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "late";
}

export function hollowDark(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "missed";
}

export function hollowDim(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "hold";
}

export function hollowBlank(raw: HollowValue, now = Date.now()): boolean {
  return hollowLane(raw, now) === "blank";
}

export function hollowOpen(raw: HollowValue): boolean {
  return hollowState(raw) === "clear";
}

export function hollowLength(raw: HollowValue): number | null {
  if (hollowState(raw) !== "set") return null;
  return hollowGiven(raw).length;
}

export function hollowEven(raw: HollowValue): boolean {
  const length = hollowLength(raw);
  return length !== null && length % 2 === 0;
}

export function hollowDigit(raw: HollowValue): boolean {
  return /[0-9]/.test(hollowGiven(raw));
}

export function hollowLetter(raw: HollowValue): boolean {
  return /[A-Za-z]/.test(hollowGiven(raw));
}

export function hollowUpper(raw: HollowValue): boolean {
  const text = hollowGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function hollowCopy(raw: HollowValue): string {
  return hollowGiven(raw);
}

export function hollowStamp(raw: HollowValue): string {
  const text = hollowGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function hollowLanes(rows: readonly HollowRow[], now = Date.now()): HollowLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = hollowLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingHollow(rows: readonly HollowRow[], now = Date.now()): string {
  const lines = hollowLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingHollowHue(rows: readonly HollowRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = hollowHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneHollowCount(rows: readonly HollowRow[], mail: HollowLane, now = Date.now()): number {
  return rows.filter((row) => hollowLane(row.code, now) === mail).length;
}

export function hollowShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentHollowLanes(rows: readonly HollowRow[], now = Date.now()): string[] {
  return hollowLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenHollow(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedHollow(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleHollow(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleHollowReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkHollowReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleHollowLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: HollowValue, shape: HollowShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return hollowOpen(raw);
  if (shape === "digit") return hollowDigit(raw);
  if (shape === "letter") return hollowLetter(raw);
  if (shape === "even") return hollowEven(raw);
  if (shape === "upper") return hollowUpper(raw);
  return hollowLane(raw, now) === shape;
}

export function visibleHollow(
  rows: readonly HollowRow[],
  mail: string,
  hue: string,
  query: string,
  review: HollowReview,
  reviewed: readonly string[],
  shape: HollowShape,
  now = Date.now(),
): HollowRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = hollowLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && hollowHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${hollowCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function hollowLanesCsv(rows: readonly HollowRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of hollowLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function hollowRowsCsv(rows: readonly HollowRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,group,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(hollowCopy(row.code)), hollowLane(row.code, now), hollowHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
