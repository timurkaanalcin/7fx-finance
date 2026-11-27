/**
 * Taenia courses kept in this browser,
 * and corona plates read the deposit-approval grant already stored on the account.
 * Orders are taenia, mutule, astragal, and annulet. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 9, or 12. Depths are 3, 6, or 9.
 * Taenia and mutule are the warm half. Astragal and annulet are the cool half.
 * Gilt is the quiet ground.
 * GRANT, YES, OPEN, and ON are grants. OFF, VOID, SHUT, DENY, and NO are shut.
 * HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Two letters are a code. One letter is short. Twelve letters or more are long. Anything else holds.
 * A true grant reads as GRANT. A false grant reads as OFF.
 * Money fields are not read. The plate does not change the saved grant.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_taenia_course (
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
 * CREATE TABLE crm_corona_grant_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_corona_grant_review (
 *   trader_id text primary key
 * );
 */
export const TAE_KEY = "crmv4-taenia-401";
export const TAE_VIEW_KEY = "crmv4-taenia-views-401";
export const TAE_DENSITY_KEY = "crmv4-taenia-density-401";
export const TAE_PROFILES = ["taenia", "mutule", "astragal", "annulet"] as const;

export type TaeniaProfile = (typeof TAE_PROFILES)[number];
export type TaeniaBed = "blank" | "ivory" | "graphite" | "gilt";
export type TaeniaRack = "base" | "press" | "shelf";
export type TaeniaDensity = "open" | "tight";
export type TaeniaSort = "profile" | "hand";

export type Taenia = {
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

export type TaeniaView = {
  id: string;
  name: string;
  rack: TaeniaRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type TaeniaCounts = {
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

export const ROUND401_FEATURES = [
  "taenia-save",
  "taenia-reminders",
  "taenia-orders",
  "taenia-search",
  "taenia-hour-sla",
  "taenia-case",
  "taenia-pin",
  "taenia-inline-title",
  "taenia-filters",
  "saved-taenia-views",
  "taenia-density",
  "taenia-focus",
  "taenia-kpis",
  "taenia-chart",
  "taenia-timeline",
  "taenia-bulk",
  "taenia-csv",
  "taenia-keys",
  "taenia-audit",
  "quietest-taenia-hand",
  "taenia-viewer",
  "suggest-taenia",
  "overdue-taenia",
  "corona-panels",
  "corona-grant-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 9, 12] as const;
const DEPTH_CYCLE = [3, 6, 9] as const;
const WARM = new Set(["taenia", "mutule"]);
const COOL = new Set(["astragal", "annulet"]);
const QUIET_BED = new Set(["GILT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): TaeniaRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<TaeniaBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<TaeniaBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ta]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Taenia, rack: TaeniaRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return TAE_PROFILES.indexOf(profile as TaeniaProfile);
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
  return (TAE_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 9, or 12. Anything else stays blank. */
export function taeniaHour(raw: unknown): 3 | 6 | 9 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "12") return null;
  return Number(text) as 3 | 6 | 9 | 12;
}

/** A depth is 3, 6, or 9. Anything else stays blank. */
export function depthCount(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function taeniaBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Taenia is first. Mutule is second. Astragal is third. Annulet is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "taenia") return "first";
  if (text === "mutule") return "second";
  if (text === "astragal") return "third";
  return "fourth";
}

/** Signed distance from one profile to another along the yard. */
export function profileGap(from: unknown, to: unknown): number | null {
  const left = profileIndex(profilePoint(from));
  const right = profileIndex(profilePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function giltQuiet(bed: unknown): boolean {
  return QUIET_BED.has(taeniaBed(bed));
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
  const hour = taeniaHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = taeniaBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveTaeniaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestTaeniaBed(cards: readonly Taenia[]): string {
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

/** Before six, suggest three. Before ten, suggest six. Before thirteen, suggest nine. Later, suggest twelve. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestTaeniaHour(cards: readonly Taenia[], hour: number): 3 | 6 | 9 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 9 | 12 = 3;
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
  if (hour < 10) return 6;
  if (hour < 13) return 9;
  return 12;
}

export function suggestProfile(hour: number): TaeniaProfile {
  if (hour < 6) return "taenia";
  if (hour < 10) return "mutule";
  if (hour < 13) return "astragal";
  return "annulet";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Taenia[], roster: string): string {
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

export function readTaeniaList(raw: unknown): Taenia[] {
  if (!Array.isArray(raw)) return [];
  const out: Taenia[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Taenia>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: taeniaHour(row.hour),
      bed: taeniaBed(row.bed),
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

export function addTaenia(
  cards: readonly Taenia[],
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
): Taenia[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTaeniaList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: taeniaHour(card.hour),
      bed: taeniaBed(card.bed),
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

function mapCard(cards: readonly Taenia[], id: string, edit: (card: Taenia) => Taenia): Taenia[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTaenia(cards: readonly Taenia[], id: string, title: string): Taenia[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTaeniaNote(cards: readonly Taenia[], id: string, note: string): Taenia[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(taeniaBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setTaeniaBed(cards: readonly Taenia[], id: string, bed: string): Taenia[] {
  const next = taeniaBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setTaeniaRaised(cards: readonly Taenia[], id: string, raised: boolean): Taenia[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setTaeniaRack(cards: readonly Taenia[], id: string, pressed: boolean): Taenia[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setTaeniaShelf(cards: readonly Taenia[], id: string, shelved: boolean): Taenia[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setTaeniaPin(cards: readonly Taenia[], id: string, pinned: boolean): Taenia[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addTaeniaTag(cards: readonly Taenia[], id: string, tag: string): Taenia[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 6 | 9 | 12 {
  if (hour === null) return dir > 0 ? 3 : 12;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setTaeniaFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackTaeniaFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return setTaeniaRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinTaeniaFocused(cards: readonly Taenia[], id: string): Taenia[] {
  return setTaeniaPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Taenia[], id: string): Taenia[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTaeniaBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Taenia[], ids: readonly string[], edit: (card: Taenia) => Taenia): Taenia[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTaeniaLinen(cards: readonly Taenia[], ids: readonly string[]): Taenia[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkTaeniaRaise(cards: readonly Taenia[], ids: readonly string[]): Taenia[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkTaeniaShelf(cards: readonly Taenia[], ids: readonly string[]): Taenia[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkTaeniaTag(cards: readonly Taenia[], ids: readonly string[]): Taenia[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readTaeniaViews(raw: unknown): TaeniaView[] {
  if (!Array.isArray(raw)) return [];
  const out: TaeniaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TaeniaView>;
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

export function addTaeniaView(views: readonly TaeniaView[], view: TaeniaView): TaeniaView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTaeniaViews([...views, { ...view, name }]);
}

export function dropTaeniaView(views: readonly TaeniaView[], id: string): TaeniaView[] {
  return views.filter((view) => view.id !== id);
}

export function taeniaDensity(raw: unknown): TaeniaDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortTaeniaList(cards: readonly Taenia[], sort: TaeniaSort): Taenia[] {
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

export function visibleTaeniaList(
  cards: readonly Taenia[],
  rack: TaeniaRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Taenia[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : taeniaBed(bed);
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

/** Annulet at depth three, still not raised and not shelved, is overdue. */
export function overdueTaenia(card: Taenia): boolean {
  return card.profile === "annulet" && card.depth === 3 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth three, and still on the ridge. */
export function idleTaenia(card: Taenia): boolean {
  return !card.bed && card.hour === 3 && card.depth === 3 && !card.raised && !card.pressed && !card.shelved;
}

/** Gilt, twelve hours, and a full depth, still off the shelf. */
export function briskTaenia(card: Taenia): boolean {
  return card.bed === "GILT" && card.hour === 12 && card.depth === 9 && !card.shelved;
}

/** Astragal, ivory, and six hours. */
export function restingTaenia(card: Taenia): boolean {
  return card.profile === "astragal" && card.bed === "IVORY" && card.hour === 6;
}

/** A taenia is late when the station is already annulet. */
export function lateTaenia(card: Taenia, station: string): boolean {
  return card.profile === "taenia" && profilePoint(station) === "annulet" && !card.raised;
}

export function taeniaCounts(cards: readonly Taenia[], shown: readonly Taenia[], station: string): TaeniaCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 12).length,
    quiet: cards.filter((card) => giltQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleTaenia).length,
    brisk: cards.filter(briskTaenia).length,
    resting: cards.filter(restingTaenia).length,
    overdue: cards.filter(overdueTaenia).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateTaenia(card, station)).length,
  };
}

export function taeniaBars(cards: readonly Taenia[]): { profile: string; count: number }[] {
  return TAE_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function taeniaTimeline(cards: readonly Taenia[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function taeniaHands(cards: readonly Taenia[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Taenia[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of taeniaHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTaeniaList(cards: readonly Taenia[]): string[] {
  return cards.filter(overdueTaenia).map((card) => card.title);
}

export function taeniaCopy(card: Taenia): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function taeniaCsv(cards: readonly Taenia[], station: string): string {
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
        lateTaenia(card, station) ? "1" : "0",
        idleTaenia(card) ? "1" : "0",
        briskTaenia(card) ? "1" : "0",
        restingTaenia(card) ? "1" : "0",
        overdueTaenia(card) ? "1" : "0",
        profileWarm(card.profile) ? "1" : "0",
        giltQuiet(card.bed) ? "1" : "0",
        profileBand(card.profile),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}


export const CRN_HIDE_KEY = "crmv4-corona-hide-401";
export const CRN_REVIEW_KEY = "crmv4-corona-review-401";

export type CoronaLane = "" | "grant" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type CoronaHue = "" | "gilt" | "ash" | "pearl";
export type CoronaState = "" | "clear" | "set";
export type CoronaReview = "all" | "reviewed" | "fresh";
export type CoronaShape = "all" | "grant" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type CoronaValue = string | { canApproveDeposits?: unknown; [key: string]: unknown } | null | undefined;
export type CoronaRow = { id: string; label: string; code: CoronaValue; userId?: string };
export type CoronaLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["grant", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["GRANT", "YES", "OPEN", "ON"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function coronaRecord(raw: CoronaValue): { canApproveDeposits?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function coronaBlocked(raw: CoronaValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function coronaGiven(raw: CoronaValue): string {
  const row = coronaRecord(raw);
  if (row && !("canApproveDeposits" in row)) return "";
  const value = row ? row.canApproveDeposits : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "GRANT";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function coronaReadable(raw: CoronaValue): boolean {
  if (coronaBlocked(raw)) return false;
  const row = coronaRecord(raw);
  if (row && !("canApproveDeposits" in row)) return false;
  return true;
}

export function coronaState(raw: CoronaValue): CoronaState {
  if (!coronaReadable(raw)) return "";
  return coronaGiven(raw) ? "set" : "clear";
}

/** Word marks win first. GRANT, YES, OPEN, and ON are grants. OFF, VOID, SHUT, DENY, and NO are shut. HOLD, PAUSE, and WAIT hold. NONE, BLANK, EMPTY, and CLEAR stay blank. Two letters are a code. One letter is short. Twelve letters or more are long. Anything else holds. */
export function coronaLane(raw: CoronaValue): CoronaLane {
  if (coronaState(raw) !== "set") return "";
  const text = coronaGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "grant";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (/^[A-Za-z]{2}$/.test(text)) return "code";
  if (text.length <= 1) return "short";
  if (text.length >= 12) return "long";
  return "hold";
}

export function coronaHue(raw: CoronaValue): CoronaHue {
  const mail = coronaLane(raw);
  if (!mail) return "";
  if (mail === "grant") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function coronaLit(raw: CoronaValue): boolean {
  return coronaLane(raw) === "grant";
}

export function coronaNear(raw: CoronaValue): boolean {
  return coronaLane(raw) === "code";
}

export function coronaFar(raw: CoronaValue): boolean {
  return coronaLane(raw) === "short";
}

export function coronaFade(raw: CoronaValue): boolean {
  return coronaLane(raw) === "long";
}

export function coronaDark(raw: CoronaValue): boolean {
  return coronaLane(raw) === "shut";
}

export function coronaDim(raw: CoronaValue): boolean {
  return coronaLane(raw) === "hold";
}

export function coronaBlank(raw: CoronaValue): boolean {
  return coronaLane(raw) === "blank";
}

export function coronaOpen(raw: CoronaValue): boolean {
  return coronaState(raw) === "clear";
}

export function coronaLength(raw: CoronaValue): number | null {
  if (coronaState(raw) !== "set") return null;
  return coronaGiven(raw).length;
}

export function coronaEven(raw: CoronaValue): boolean {
  const length = coronaLength(raw);
  return length !== null && length % 2 === 0;
}

export function coronaDigit(raw: CoronaValue): boolean {
  return /[0-9]/.test(coronaGiven(raw));
}

export function coronaLetter(raw: CoronaValue): boolean {
  return /[A-Za-z]/.test(coronaGiven(raw));
}

export function coronaUpper(raw: CoronaValue): boolean {
  const text = coronaGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function coronaCopy(raw: CoronaValue): string {
  return coronaGiven(raw);
}

export function coronaStamp(raw: CoronaValue): string {
  const text = coronaGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function coronaLanes(rows: readonly CoronaRow[]): CoronaLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = coronaLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingCorona(rows: readonly CoronaRow[]): string {
  const lines = coronaLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingCoronaHue(rows: readonly CoronaRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = coronaHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneCoronaCount(rows: readonly CoronaRow[], mail: CoronaLane): number {
  return rows.filter((row) => coronaLane(row.code) === mail).length;
}

export function coronaShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCoronaLanes(rows: readonly CoronaRow[]): string[] {
  return coronaLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenCorona(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCorona(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCorona(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleCoronaReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCoronaReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCoronaLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: CoronaValue, shape: CoronaShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return coronaOpen(raw);
  if (shape === "digit") return coronaDigit(raw);
  if (shape === "letter") return coronaLetter(raw);
  if (shape === "even") return coronaEven(raw);
  if (shape === "upper") return coronaUpper(raw);
  return coronaLane(raw) === shape;
}

export function visibleCorona(
  rows: readonly CoronaRow[],
  mail: string,
  hue: string,
  query: string,
  review: CoronaReview,
  reviewed: readonly string[],
  shape: CoronaShape,
): CoronaRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = coronaLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && coronaHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${coronaCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function coronaLanesCsv(rows: readonly CoronaRow[]): string {
  const lines = ["lane,count"];
  for (const line of coronaLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function coronaRowsCsv(rows: readonly CoronaRow[], reviewed: readonly string[]): string {
  const lines = ["name,grant,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(coronaCopy(row.code)), coronaLane(row.code), coronaHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
