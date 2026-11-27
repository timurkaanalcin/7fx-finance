/**
 * Krepis courses kept in this browser,
 * and imbrex plates read the surname already stored on the account.
 * Orders are krepis, tegula, campana, and oculus. Grounds are ivory, graphite, and gilt.
 * Hours are 4, 8, 12, or 20. Depths are 2, 6, or 10.
 * Krepis and tegula are the warm half. Campana and oculus are the cool half.
 * Graphite is the quiet ground.
 * OPEN is live. WAIT, REST, and PARK hold. STOP, VOID, DENY, NO, and BLOCK are shut.
 * NONE, BLANK, EMPTY, and CLEAR stay blank.
 * A NAME- mark of eight letters is a code. A NAME- mark of eleven letters or more is long. Other NAME- marks stay live.
 * Four letters are a code. Two letters or fewer are short. Sixteen letters or more are long. Anything else holds.
 * A true surname mark reads as OPEN. A false mark reads as STOP.
 * The secret is not read. Money fields are not read. The plate does not change the saved surname.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_krepis_course (
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
 *   pressed boolean not null default false,
 *   shelved boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_imbrex_surname_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_imbrex_surname_review (
 *   trader_id text primary key
 * );
 */

export const KRP_KEY = "crmv4-krepis-408";
export const KRP_VIEW_KEY = "crmv4-krepis-views-408";
export const KRP_DENSITY_KEY = "crmv4-krepis-density-408";
export const KRP_PROFILES = ["krepis", "tegula", "campana", "oculus"] as const;

export type KrepisProfile = (typeof KRP_PROFILES)[number];
export type KrepisBed = "blank" | "ivory" | "graphite" | "gilt";
export type KrepisRack = "base" | "press" | "shelf";
export type KrepisDensity = "open" | "tight";
export type KrepisSort = "profile" | "hand";

export type Krepis = {
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

export type KrepisView = {
  id: string;
  name: string;
  rack: KrepisRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type KrepisCounts = {
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

export const ROUND408_FEATURES = [
  "krepis-save",
  "krepis-reminders",
  "krepis-orders",
  "krepis-search",
  "krepis-hour-sla",
  "krepis-case",
  "krepis-pin",
  "krepis-inline-title",
  "krepis-filters",
  "saved-krepis-views",
  "krepis-density",
  "krepis-focus",
  "krepis-kpis",
  "krepis-chart",
  "krepis-timeline",
  "krepis-bulk",
  "krepis-csv",
  "krepis-keys",
  "krepis-audit",
  "quietest-krepis-hand",
  "krepis-viewer",
  "suggest-krepis",
  "overdue-krepis",
  "imbrex-panels",
  "imbrex-surname-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [4, 8, 12, 20] as const;
const DEPTH_CYCLE = [2, 6, 10] as const;
const WARM = new Set(["krepis", "tegula"]);
const COOL = new Set(["campana", "oculus"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): KrepisRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<KrepisBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<KrepisBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[kp]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Krepis, rack: KrepisRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return KRP_PROFILES.indexOf(profile as KrepisProfile);
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
  return (KRP_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 12, or 20. Anything else stays blank. */
export function krepisHour(raw: unknown): 4 | 8 | 12 | 20 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "20") return null;
  return Number(text) as 4 | 8 | 12 | 20;
}

/** A depth is 2, 6, or 10. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 6 | 10 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "6" && text !== "10") return null;
  return Number(text) as 2 | 6 | 10;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function krepisBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Krepis is first. Tegula is second. Campana is third. Oculus is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "krepis") return "first";
  if (text === "tegula") return "second";
  if (text === "campana") return "third";
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
  return QUIET_BED.has(krepisBed(bed));
}

/** A pair depth is 6. Two and ten are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 6;
}

/** A full depth is 10. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 10;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = krepisHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = krepisBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveKrepisFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestKrepisBed(cards: readonly Krepis[]): string {
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

/** Before four, suggest four. Before eight, suggest eight. Before twelve, suggest twelve. Later, suggest twenty. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestKrepisHour(cards: readonly Krepis[], hour: number): 4 | 8 | 12 | 20 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 20 = 4;
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
  if (hour < 4) return 4;
  if (hour < 8) return 8;
  if (hour < 12) return 12;
  return 20;
}

export function suggestProfile(hour: number): KrepisProfile {
  if (hour < 4) return "krepis";
  if (hour < 8) return "tegula";
  if (hour < 12) return "campana";
  return "oculus";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Krepis[], roster: string): string {
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

export function readKrepisList(raw: unknown): Krepis[] {
  if (!Array.isArray(raw)) return [];
  const out: Krepis[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Krepis>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: krepisHour(row.hour),
      bed: krepisBed(row.bed),
      depth: depthCount(row.depth) ?? 2,
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

export function addKrepis(
  cards: readonly Krepis[],
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
): Krepis[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readKrepisList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: krepisHour(card.hour),
      bed: krepisBed(card.bed),
      depth: depthCount(card.depth) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      pressed: false,
      shelved: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Krepis[], id: string, edit: (card: Krepis) => Krepis): Krepis[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editKrepis(cards: readonly Krepis[], id: string, title: string): Krepis[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editKrepisNote(cards: readonly Krepis[], id: string, note: string): Krepis[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(krepisBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setKrepisBed(cards: readonly Krepis[], id: string, bed: string): Krepis[] {
  const next = krepisBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setKrepisRaised(cards: readonly Krepis[], id: string, raised: boolean): Krepis[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setKrepisRack(cards: readonly Krepis[], id: string, pressed: boolean): Krepis[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setKrepisShelf(cards: readonly Krepis[], id: string, shelved: boolean): Krepis[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setKrepisPin(cards: readonly Krepis[], id: string, pinned: boolean): Krepis[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addKrepisTag(cards: readonly Krepis[], id: string, tag: string): Krepis[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 4 | 8 | 12 | 20 {
  if (hour === null) return dir > 0 ? 4 : 20;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 6 | 10 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setKrepisFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackKrepisFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return setKrepisRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinKrepisFocused(cards: readonly Krepis[], id: string): Krepis[] {
  return setKrepisPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Krepis[], id: string): Krepis[] {
  const card = cards.find((item) => item.id === id);
  return card ? setKrepisBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Krepis[], ids: readonly string[], edit: (card: Krepis) => Krepis): Krepis[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkKrepisLinen(cards: readonly Krepis[], ids: readonly string[]): Krepis[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkKrepisRaise(cards: readonly Krepis[], ids: readonly string[]): Krepis[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkKrepisShelf(cards: readonly Krepis[], ids: readonly string[]): Krepis[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkKrepisTag(cards: readonly Krepis[], ids: readonly string[]): Krepis[] {
  return bulk(cards, ids, (card) => (card.tags.includes("p") ? card : { ...card, tags: tagsOf([...card.tags, "p"]), audit: "tag" }));
}

export function readKrepisViews(raw: unknown): KrepisView[] {
  if (!Array.isArray(raw)) return [];
  const out: KrepisView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KrepisView>;
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

export function addKrepisView(views: readonly KrepisView[], view: KrepisView): KrepisView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readKrepisViews([...views, { ...view, name }]);
}

export function dropKrepisView(views: readonly KrepisView[], id: string): KrepisView[] {
  return views.filter((view) => view.id !== id);
}

export function krepisDensity(raw: unknown): KrepisDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortKrepisList(cards: readonly Krepis[], sort: KrepisSort): Krepis[] {
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

export function visibleKrepisList(
  cards: readonly Krepis[],
  rack: KrepisRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Krepis[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : krepisBed(bed);
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

/** Oculus at depth two, still not raised and not shelved, is overdue. */
export function overdueKrepis(card: Krepis): boolean {
  return card.profile === "oculus" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour four, depth two, and still on the yard. */
export function idleKrepis(card: Krepis): boolean {
  return !card.bed && card.hour === 4 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, twenty hours, and a full depth, still off the shelf. */
export function briskKrepis(card: Krepis): boolean {
  return card.bed === "GRAPHITE" && card.hour === 20 && card.depth === 10 && !card.shelved;
}

/** Campana, ivory, and eight hours. */
export function restingKrepis(card: Krepis): boolean {
  return card.profile === "campana" && card.bed === "IVORY" && card.hour === 8;
}

/** An krepis is late when the station is already oculus. */
export function lateKrepis(card: Krepis, station: string): boolean {
  return card.profile === "krepis" && profilePoint(station) === "oculus" && !card.raised;
}

export function krepisCounts(cards: readonly Krepis[], shown: readonly Krepis[], station: string): KrepisCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 20).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleKrepis).length,
    brisk: cards.filter(briskKrepis).length,
    resting: cards.filter(restingKrepis).length,
    overdue: cards.filter(overdueKrepis).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateKrepis(card, station)).length,
  };
}

export function krepisBars(cards: readonly Krepis[]): { profile: string; count: number }[] {
  return KRP_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function krepisTimeline(cards: readonly Krepis[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function krepisHands(cards: readonly Krepis[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Krepis[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of krepisHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderKrepisList(cards: readonly Krepis[]): string[] {
  return cards.filter(overdueKrepis).map((card) => card.title);
}

export function krepisCopy(card: Krepis): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function krepisCsv(cards: readonly Krepis[], station: string): string {
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
        lateKrepis(card, station) ? "1" : "0",
        idleKrepis(card) ? "1" : "0",
        briskKrepis(card) ? "1" : "0",
        restingKrepis(card) ? "1" : "0",
        overdueKrepis(card) ? "1" : "0",
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


export const IMB_HIDE_KEY = "crmv4-imbrex-hide-408";
export const IMB_REVIEW_KEY = "crmv4-imbrex-review-408";

export type ImbrexLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type ImbrexHue = "" | "gilt" | "ash" | "pearl";
export type ImbrexState = "" | "clear" | "set";
export type ImbrexReview = "all" | "reviewed" | "fresh";
export type ImbrexShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type ImbrexValue = string | { lastName?: unknown; [key: string]: unknown } | null | undefined;
export type ImbrexRow = { id: string; label: string; code: ImbrexValue; userId?: string };
export type ImbrexLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["OPEN"]);
const HOLD_TITLES = new Set(["WAIT", "REST", "PARK"]);
const SHUT_TITLES = new Set(["STOP", "VOID", "DENY", "NO", "BLOCK"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function imbrexRecord(raw: ImbrexValue): { lastName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function imbrexBlocked(raw: ImbrexValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function imbrexGiven(raw: ImbrexValue): string {
  const row = imbrexRecord(raw);
  if (row && !("lastName" in row)) return "";
  const value = row ? row.lastName : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "OPEN";
  if (value === false || value === "false" || value === "0" || value === 0) return "STOP";
  return snip(value, 48);
}

function imbrexReadable(raw: ImbrexValue): boolean {
  if (imbrexBlocked(raw)) return false;
  const row = imbrexRecord(raw);
  if (row && !("lastName" in row)) return false;
  return true;
}


export function imbrexSlice(raw: unknown): ImbrexValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("lastName" in row)) return { lastName: "" };
  const value = row.lastName;
  if (typeof value === "string") return { lastName: snip(value, 48) };
  return { lastName: value as never };
}

export function imbrexState(raw: ImbrexValue): ImbrexState {
  if (!imbrexReadable(raw)) return "";
  return imbrexGiven(raw) ? "set" : "clear";
}

/** Word marks win first. OPEN is live. WAIT, REST, and PARK hold. STOP, VOID, DENY, NO, and BLOCK are shut. NONE, BLANK, EMPTY, and CLEAR stay blank. A NAME- mark of eight letters is a code. A NAME- mark of eleven or more is long. Any other NAME- mark is live. Four letters are a code. Two letters or fewer are short. Sixteen letters or more are long. Anything else holds. */
export function imbrexLane(raw: ImbrexValue): ImbrexLane {
  if (imbrexState(raw) !== "set") return "";
  const text = imbrexGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("NAME-") && text.length === 8) return "code";
  if (upper.startsWith("NAME-") && text.length >= 11) return "long";
  if (upper.startsWith("NAME-")) return "live";
  if (/^[A-Za-z]{4}$/.test(text)) return "code";
  if (text.length <= 2) return "short";
  if (text.length >= 16) return "long";
  return "hold";
}

export function imbrexHue(raw: ImbrexValue): ImbrexHue {
  const mail = imbrexLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function imbrexLit(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "live";
}

export function imbrexNear(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "code";
}

export function imbrexFar(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "short";
}

export function imbrexFade(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "long";
}

export function imbrexDark(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "shut";
}

export function imbrexDim(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "hold";
}

export function imbrexBlank(raw: ImbrexValue): boolean {
  return imbrexLane(raw) === "blank";
}

export function imbrexOpen(raw: ImbrexValue): boolean {
  return imbrexState(raw) === "clear";
}

export function imbrexLength(raw: ImbrexValue): number | null {
  if (imbrexState(raw) !== "set") return null;
  return imbrexGiven(raw).length;
}

export function imbrexEven(raw: ImbrexValue): boolean {
  const length = imbrexLength(raw);
  return length !== null && length % 2 === 0;
}

export function imbrexDigit(raw: ImbrexValue): boolean {
  return /[0-9]/.test(imbrexGiven(raw));
}

export function imbrexLetter(raw: ImbrexValue): boolean {
  return /[A-Za-z]/.test(imbrexGiven(raw));
}

export function imbrexUpper(raw: ImbrexValue): boolean {
  const text = imbrexGiven(raw);
  return text.length >= 7 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function imbrexCopy(raw: ImbrexValue): string {
  return imbrexGiven(raw);
}

export function imbrexStamp(raw: ImbrexValue): string {
  const text = imbrexGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function imbrexLanes(rows: readonly ImbrexRow[]): ImbrexLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = imbrexLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingImbrex(rows: readonly ImbrexRow[]): string {
  const lines = imbrexLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingImbrexHue(rows: readonly ImbrexRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = imbrexHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneImbrexCount(rows: readonly ImbrexRow[], mail: ImbrexLane): number {
  return rows.filter((row) => imbrexLane(row.code) === mail).length;
}

export function imbrexShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentImbrexLanes(rows: readonly ImbrexRow[]): string[] {
  return imbrexLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenImbrex(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedImbrex(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleImbrex(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleImbrexReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkImbrexReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleImbrexLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: ImbrexValue, shape: ImbrexShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return imbrexOpen(raw);
  if (shape === "digit") return imbrexDigit(raw);
  if (shape === "letter") return imbrexLetter(raw);
  if (shape === "even") return imbrexEven(raw);
  if (shape === "upper") return imbrexUpper(raw);
  return imbrexLane(raw) === shape;
}

export function visibleImbrex(
  rows: readonly ImbrexRow[],
  mail: string,
  hue: string,
  query: string,
  review: ImbrexReview,
  reviewed: readonly string[],
  shape: ImbrexShape,
): ImbrexRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = imbrexLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && imbrexHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${imbrexCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function imbrexLanesCsv(rows: readonly ImbrexRow[]): string {
  const lines = ["lane,count"];
  for (const line of imbrexLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function imbrexRowsCsv(rows: readonly ImbrexRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(imbrexCopy(row.code)), imbrexLane(row.code), imbrexHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
