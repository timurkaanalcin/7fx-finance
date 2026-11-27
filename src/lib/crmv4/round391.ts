/**
 * Dentil courses kept in this browser,
 * and fascia bands read the username already stored on the account.
 * Orders are dentil, reel, fillet, and bead. Grounds are ivory, graphite, and champagne.
 * Hours are 1, 5, 9, or 13. Courses are 1, 3, or 5.
 * Dentil and reel are the warm half. Fillet and bead are the cool half.
 * Graphite is the quiet ground.
 * A username today is due. Within two days ahead is soon. Further ahead is far.
 * A username younger than four days past is late. Older than that is missed.
 * Desk, call, open, and name are due. Next, soon, and fresh are soon. Park, still, and wait hold.
 * Old and stale are late. Lost, away, gone, and void are missed. None, dash, empty, and clear stay blank.
 * A true username reads as NAME. A false username reads as VOID.
 * Money fields are not read. The band does not change the saved username.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_dentil_course (
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
 *   kilned boolean not null default false,
 *   lofted boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_fascia_band_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_fascia_band_review (
 *   trader_id text primary key
 * );
 */
export const DNT_KEY = "crmv4-dentil-391";
export const DNT_VIEW_KEY = "crmv4-dentil-views-391";
export const DNT_DENSITY_KEY = "crmv4-dentil-density-391";
export const DNT_PROFILES = ["dentil", "reel", "fillet", "bead"] as const;

export type DentilProfile = (typeof DNT_PROFILES)[number];
export type DentilBed = "blank" | "ivory" | "graphite" | "champagne";
export type DentilRack = "bench" | "kiln" | "loft";
export type DentilDensity = "open" | "tight";
export type DentilSort = "profile" | "hand";

export type Dentil = {
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

export type DentilView = {
  id: string;
  name: string;
  rack: DentilRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type DentilCounts = {
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

export const ROUND391_FEATURES = [
  "dentil-save",
  "dentil-reminders",
  "dentil-orders",
  "dentil-search",
  "dentil-hour-sla",
  "dentil-case",
  "dentil-pin",
  "dentil-inline-title",
  "dentil-filters",
  "saved-dentil-views",
  "dentil-density",
  "dentil-focus",
  "dentil-kpis",
  "dentil-chart",
  "dentil-timeline",
  "dentil-bulk",
  "dentil-csv",
  "dentil-keys",
  "dentil-audit",
  "lightest-shop-hand",
  "dentil-viewer",
  "suggest-dentil",
  "overdue-bead",
  "fascia-bands",
  "fascia-username-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "kiln", "return", "loft", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [1, 5, 9, 13] as const;
const DEPTH_CYCLE = [1, 3, 5] as const;
const WARM = new Set(["dentil", "reel"]);
const COOL = new Set(["fillet", "bead"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): DentilRack {
  return raw === "kiln" || raw === "loft" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<DentilBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<DentilBed, "blank">) : "";
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

function inRack(card: Dentil, rack: DentilRack): boolean {
  if (rack === "kiln") return card.kilned && !card.lofted;
  if (rack === "loft") return card.lofted;
  return !card.kilned && !card.lofted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return DNT_PROFILES.indexOf(profile as DentilProfile);
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
  return (DNT_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 1, 5, 9, or 13. Anything else stays blank. */
export function dentilHour(raw: unknown): 1 | 5 | 9 | 13 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "5" && text !== "9" && text !== "13") return null;
  return Number(text) as 1 | 5 | 9 | 13;
}

/** A course is 1, 3, or 5. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function dentilBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Dentil is first. Reel is second. Fillet is third. Bead is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "dentil") return "first";
  if (text === "reel") return "second";
  if (text === "fillet") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the bench. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(bed: unknown): boolean {
  return QUIET_BED.has(dentilBed(bed));
}

/** A pair course is 3. One and five are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 3;
}

/** A full course is 5. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 5;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = dentilHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = dentilBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveDentilFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the bench uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestDentilBed(cards: readonly Dentil[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "bench") || !card.bed) continue;
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

/** Before four, suggest one. Before eight, suggest five. Before twelve, suggest nine. Later, suggest thirteen. A saved hour on the bench wins, and a tie keeps the shorter hour. */
export function suggestDentilHour(cards: readonly Dentil[], hour: number): 1 | 5 | 9 | 13 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "bench") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 1 | 5 | 9 | 13 = 1;
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
  if (hour < 4) return 1;
  if (hour < 8) return 5;
  if (hour < 12) return 9;
  return 13;
}

export function suggestProfile(hour: number): DentilProfile {
  if (hour < 4) return "dentil";
  if (hour < 8) return "reel";
  if (hour < 12) return "fillet";
  return "bead";
}

/** The hand with the fewest unraised scrolls on the bench. A tie keeps the roster order. */
export function fairHand(cards: readonly Dentil[], roster: string): string {
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

export function readDentilList(raw: unknown): Dentil[] {
  if (!Array.isArray(raw)) return [];
  const out: Dentil[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Dentil>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: dentilHour(row.hour),
      bed: dentilBed(row.bed),
      depth: depthCount(row.depth) ?? 1,
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

export function addDentil(
  cards: readonly Dentil[],
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
): Dentil[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readDentilList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: dentilHour(card.hour),
      bed: dentilBed(card.bed),
      depth: depthCount(card.depth) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      kilned: false,
      lofted: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Dentil[], id: string, edit: (card: Dentil) => Dentil): Dentil[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editDentil(cards: readonly Dentil[], id: string, title: string): Dentil[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editDentilNote(cards: readonly Dentil[], id: string, note: string): Dentil[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(dentilBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setDentilBed(cards: readonly Dentil[], id: string, bed: string): Dentil[] {
  const next = dentilBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setDentilRaised(cards: readonly Dentil[], id: string, raised: boolean): Dentil[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setDentilRack(cards: readonly Dentil[], id: string, kilned: boolean): Dentil[] {
  return mapCard(cards, id, (card) => (card.kilned === kilned ? card : { ...card, kilned, lofted: kilned ? false : card.lofted, audit: kilned ? "kiln" : "return" }));
}

export function setDentilLoft(cards: readonly Dentil[], id: string, lofted: boolean): Dentil[] {
  return mapCard(cards, id, (card) => (card.lofted === lofted ? card : { ...card, lofted, kilned: lofted ? false : card.kilned, audit: lofted ? "loft" : "open" }));
}

export function setDentilPin(cards: readonly Dentil[], id: string, pinned: boolean): Dentil[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addDentilTag(cards: readonly Dentil[], id: string, tag: string): Dentil[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 1 | 5 | 9 | 13 {
  if (hour === null) return dir > 0 ? 1 : 13;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setDentilFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackDentilFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return setDentilRack(cards, id, !cards.find((card) => card.id === id)?.kilned);
}

export function pinDentilFocused(cards: readonly Dentil[], id: string): Dentil[] {
  return setDentilPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Dentil[], id: string): Dentil[] {
  const card = cards.find((item) => item.id === id);
  return card ? setDentilBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Dentil[], ids: readonly string[], edit: (card: Dentil) => Dentil): Dentil[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkDentilLinen(cards: readonly Dentil[], ids: readonly string[]): Dentil[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkDentilRaise(cards: readonly Dentil[], ids: readonly string[]): Dentil[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkDentilLoft(cards: readonly Dentil[], ids: readonly string[]): Dentil[] {
  return bulk(cards, ids, (card) => (card.lofted ? card : { ...card, lofted: true, kilned: false, audit: "loft" }));
}

export function bulkDentilTag(cards: readonly Dentil[], ids: readonly string[]): Dentil[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readDentilViews(raw: unknown): DentilView[] {
  if (!Array.isArray(raw)) return [];
  const out: DentilView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DentilView>;
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

export function addDentilView(views: readonly DentilView[], view: DentilView): DentilView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readDentilViews([...views, { ...view, name }]);
}

export function dropDentilView(views: readonly DentilView[], id: string): DentilView[] {
  return views.filter((view) => view.id !== id);
}

export function dentilDensity(raw: unknown): DentilDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortDentilList(cards: readonly Dentil[], sort: DentilSort): Dentil[] {
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

export function visibleDentilList(
  cards: readonly Dentil[],
  rack: DentilRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Dentil[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : dentilBed(bed);
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

/** Bead at course one, still not raised and not in the case, is overdue. */
export function overdueDentil(card: Dentil): boolean {
  return card.profile === "bead" && card.depth === 1 && !card.raised && !card.lofted;
}

/** No ground, one hour, course one, and still on the bench. */
export function idleDentil(card: Dentil): boolean {
  return !card.bed && card.hour === 1 && card.depth === 1 && !card.raised && !card.kilned && !card.lofted;
}

/** Graphite, thirteen hours, and a full course, still out of the case. */
export function briskDentil(card: Dentil): boolean {
  return card.bed === "GRAPHITE" && card.hour === 13 && card.depth === 5 && !card.lofted;
}

/** Fillet, ivory, and five hours. */
export function restingDentil(card: Dentil): boolean {
  return card.profile === "fillet" && card.bed === "IVORY" && card.hour === 5;
}

/** An dentil scroll is late when the station is already bead. */
export function lateDentil(card: Dentil, station: string): boolean {
  return card.profile === "dentil" && profilePoint(station) === "bead" && !card.raised;
}

export function dentilCounts(cards: readonly Dentil[], shown: readonly Dentil[], station: string): DentilCounts {
  return {
    bench: cards.filter((card) => inRack(card, "bench")).length,
    kiln: cards.filter((card) => inRack(card, "kiln")).length,
    loft: cards.filter((card) => inRack(card, "loft")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 13).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleDentil).length,
    brisk: cards.filter(briskDentil).length,
    resting: cards.filter(restingDentil).length,
    overdue: cards.filter(overdueDentil).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateDentil(card, station)).length,
  };
}

export function dentilBars(cards: readonly Dentil[]): { profile: string; count: number }[] {
  return DNT_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.lofted).length }));
}

export function dentilTimeline(cards: readonly Dentil[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "bench"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function dentilHands(cards: readonly Dentil[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Dentil[]): string {
  const open = cards.filter((card) => inRack(card, "bench") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of dentilHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderDentilList(cards: readonly Dentil[]): string[] {
  return cards.filter(overdueDentil).map((card) => card.title);
}

export function dentilCopy(card: Dentil): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function dentilCsv(cards: readonly Dentil[], station: string): string {
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
        lateDentil(card, station) ? "1" : "0",
        idleDentil(card) ? "1" : "0",
        briskDentil(card) ? "1" : "0",
        restingDentil(card) ? "1" : "0",
        overdueDentil(card) ? "1" : "0",
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

export const FAS_HIDE_KEY = "crmv4-fascia-hide-391";
export const FAS_REVIEW_KEY = "crmv4-fascia-review-391";

export type FasciaLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type FasciaHue = "" | "gilt" | "ash" | "pearl";
export type FasciaState = "" | "clear" | "set";
export type FasciaReview = "all" | "reviewed" | "fresh";
export type FasciaShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type FasciaValue = string | { username?: unknown; [key: string]: unknown } | null | undefined;
export type FasciaRow = { id: string; label: string; code: FasciaValue; userId?: string };
export type FasciaLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const DUE_TITLES = new Set(["DESK", "CALL", "OPEN", "NAME"]);
const SOON_TITLES = new Set(["NEXT", "SOON", "FRESH"]);
const HOLD_TITLES = new Set(["PARK", "STILL", "WAIT"]);
const LATE_TITLES = new Set(["OLD", "STALE"]);
const MISSED_TITLES = new Set(["LOST", "AWAY", "GONE", "VOID"]);
const BLANK_TITLES = new Set(["NONE", "DASH", "EMPTY", "CLEAR"]);

function fasciaRecord(raw: FasciaValue): { username?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function fasciaBlocked(raw: FasciaValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function fasciaGiven(raw: FasciaValue): string {
  const row = fasciaRecord(raw);
  if (row && !("username" in row)) return "";
  const value = row ? row.username : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NAME";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function fasciaReadable(raw: FasciaValue): boolean {
  if (fasciaBlocked(raw)) return false;
  const row = fasciaRecord(raw);
  if (row && !("username" in row)) return false;
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

export function fasciaState(raw: FasciaValue): FasciaState {
  if (!fasciaReadable(raw)) return "";
  return fasciaGiven(raw) ? "set" : "clear";
}

/** A known username word maps first. A date today is due. Within two days ahead is soon. Further ahead is far.
 * Younger than four days past is late. Older is missed.
 * A mark of twelve characters or more is far. A mark that starts with a digit is due. A mark that starts with a vowel holds.
 */
export function fasciaLane(raw: FasciaValue, now = Date.now()): FasciaLane {
  if (fasciaState(raw) !== "set") return "";
  const text = fasciaGiven(raw);
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
    if (diff > 0 && diff <= 2 * day) return "soon";
    if (diff > 2 * day) return "far";
    if (now - at < 4 * day) return "late";
    return "missed";
  }
  if (text.length >= 12) return "far";
  if (/^[0-9]/.test(text)) return "due";
  if (/^[aeiou]/i.test(text)) return "hold";
  return "soon";
}

export function fasciaHue(raw: FasciaValue, now = Date.now()): FasciaHue {
  const mail = fasciaLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ash";
  return "pearl";
}

export function fasciaLit(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "due";
}

export function fasciaNear(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "soon";
}

export function fasciaFar(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "far";
}

export function fasciaFade(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "late";
}

export function fasciaDark(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "missed";
}

export function fasciaDim(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "hold";
}

export function fasciaBlank(raw: FasciaValue, now = Date.now()): boolean {
  return fasciaLane(raw, now) === "blank";
}

export function fasciaOpen(raw: FasciaValue): boolean {
  return fasciaState(raw) === "clear";
}

export function fasciaLength(raw: FasciaValue): number | null {
  if (fasciaState(raw) !== "set") return null;
  return fasciaGiven(raw).length;
}

export function fasciaEven(raw: FasciaValue): boolean {
  const length = fasciaLength(raw);
  return length !== null && length % 2 === 0;
}

export function fasciaDigit(raw: FasciaValue): boolean {
  return /[0-9]/.test(fasciaGiven(raw));
}

export function fasciaLetter(raw: FasciaValue): boolean {
  return /[A-Za-z]/.test(fasciaGiven(raw));
}

export function fasciaUpper(raw: FasciaValue): boolean {
  const text = fasciaGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function fasciaCopy(raw: FasciaValue): string {
  return fasciaGiven(raw);
}

export function fasciaStamp(raw: FasciaValue): string {
  const text = fasciaGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function fasciaLanes(rows: readonly FasciaRow[], now = Date.now()): FasciaLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = fasciaLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingFascia(rows: readonly FasciaRow[], now = Date.now()): string {
  const lines = fasciaLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingFasciaHue(rows: readonly FasciaRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = fasciaHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneFasciaCount(rows: readonly FasciaRow[], mail: FasciaLane, now = Date.now()): number {
  return rows.filter((row) => fasciaLane(row.code, now) === mail).length;
}

export function fasciaShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFasciaLanes(rows: readonly FasciaRow[], now = Date.now()): string[] {
  return fasciaLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenFascia(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedFascia(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFascia(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleFasciaReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFasciaReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFasciaLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: FasciaValue, shape: FasciaShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return fasciaOpen(raw);
  if (shape === "digit") return fasciaDigit(raw);
  if (shape === "letter") return fasciaLetter(raw);
  if (shape === "even") return fasciaEven(raw);
  if (shape === "upper") return fasciaUpper(raw);
  return fasciaLane(raw, now) === shape;
}

export function visibleFascia(
  rows: readonly FasciaRow[],
  mail: string,
  hue: string,
  query: string,
  review: FasciaReview,
  reviewed: readonly string[],
  shape: FasciaShape,
  now = Date.now(),
): FasciaRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = fasciaLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && fasciaHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${fasciaCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function fasciaLanesCsv(rows: readonly FasciaRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of fasciaLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function fasciaRowsCsv(rows: readonly FasciaRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,username,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(fasciaCopy(row.code)), fasciaLane(row.code, now), fasciaHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
