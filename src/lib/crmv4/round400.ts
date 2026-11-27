/**
 * Euthynteria courses kept in this browser,
 * and geison plates read the last address already stored on the account.
 * Orders are euthynteria, toichobate, anta, and respond. Grounds are ivory, graphite, and gilt.
 * Hours are 2, 5, 8, or 14. Depths are 2, 5, or 8.
 * Euthynteria and toichobate are the warm half. Anta and respond are the cool half.
 * Gilt is the quiet ground.
 * An address with a dot and ordinary length is a route. Under seven letters is short. Twenty or more is long.
 * A leading digit of two or three is a code. One digit is short. Four digits or more are long.
 * A word without a dot shorter than five letters is short. Eighteen or longer is long. Anything else holds.
 * Route, live, and open are routes. Hold, pause, and wait hold.
 * Off, void, shut, and drop are shut. None, blank, empty, and clear stay blank.
 * A true address reads as ROUTE. A false address reads as OFF.
 * Money fields are not read. The plate does not change the saved address.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_euthynteria_course (
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
 * CREATE TABLE crm_geison_address_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_geison_address_review (
 *   trader_id text primary key
 * );
 */
export const EUT_KEY = "crmv4-euthynteria-400";
export const EUT_VIEW_KEY = "crmv4-euthynteria-views-400";
export const EUT_DENSITY_KEY = "crmv4-euthynteria-density-400";
export const EUT_PROFILES = ["euthynteria", "toichobate", "anta", "respond"] as const;

export type EuthynteriaProfile = (typeof EUT_PROFILES)[number];
export type EuthynteriaBed = "blank" | "ivory" | "graphite" | "gilt";
export type EuthynteriaRack = "base" | "press" | "shelf";
export type EuthynteriaDensity = "open" | "tight";
export type EuthynteriaSort = "profile" | "hand";

export type Euthynteria = {
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

export type EuthynteriaView = {
  id: string;
  name: string;
  rack: EuthynteriaRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type EuthynteriaCounts = {
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

export const ROUND400_FEATURES = [
  "euthynteria-save",
  "euthynteria-reminders",
  "euthynteria-orders",
  "euthynteria-search",
  "euthynteria-hour-sla",
  "euthynteria-case",
  "euthynteria-pin",
  "euthynteria-inline-title",
  "euthynteria-filters",
  "saved-euthynteria-views",
  "euthynteria-density",
  "euthynteria-focus",
  "euthynteria-kpis",
  "euthynteria-chart",
  "euthynteria-timeline",
  "euthynteria-bulk",
  "euthynteria-csv",
  "euthynteria-keys",
  "euthynteria-audit",
  "quietest-euthynteria-hand",
  "euthynteria-viewer",
  "suggest-euthynteria",
  "overdue-euthynteria",
  "geison-panels",
  "geison-address-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [2, 5, 8, 14] as const;
const DEPTH_CYCLE = [2, 5, 8] as const;
const WARM = new Set(["euthynteria", "toichobate"]);
const COOL = new Set(["anta", "respond"]);
const QUIET_BED = new Set(["GILT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): EuthynteriaRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<EuthynteriaBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<EuthynteriaBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[nr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Euthynteria, rack: EuthynteriaRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return EUT_PROFILES.indexOf(profile as EuthynteriaProfile);
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
  return (EUT_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 2, 5, 8, or 14. Anything else stays blank. */
export function euthynteriaHour(raw: unknown): 2 | 5 | 8 | 14 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8" && text !== "14") return null;
  return Number(text) as 2 | 5 | 8 | 14;
}

/** A depth is 2, 5, or 8. Anything else stays blank. */
export function depthCount(raw: unknown): 2 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "5" && text !== "8") return null;
  return Number(text) as 2 | 5 | 8;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function euthynteriaBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Euthynteria is first. Toichobate is second. Anta is third. Respond is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "euthynteria") return "first";
  if (text === "toichobate") return "second";
  if (text === "anta") return "third";
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
  return QUIET_BED.has(euthynteriaBed(bed));
}

/** A pair depth is 5. Two and eight are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 5;
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
  const hour = euthynteriaHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = euthynteriaBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveEuthynteriaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestEuthynteriaBed(cards: readonly Euthynteria[]): string {
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

/** Before five, suggest two. Before nine, suggest five. Before fourteen, suggest eight. Later, suggest fourteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestEuthynteriaHour(cards: readonly Euthynteria[], hour: number): 2 | 5 | 8 | 14 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 2 | 5 | 8 | 14 = 2;
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
  if (hour < 9) return 5;
  if (hour < 14) return 8;
  return 14;
}

export function suggestProfile(hour: number): EuthynteriaProfile {
  if (hour < 5) return "euthynteria";
  if (hour < 9) return "toichobate";
  if (hour < 14) return "anta";
  return "respond";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Euthynteria[], roster: string): string {
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

export function readEuthynteriaList(raw: unknown): Euthynteria[] {
  if (!Array.isArray(raw)) return [];
  const out: Euthynteria[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Euthynteria>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: euthynteriaHour(row.hour),
      bed: euthynteriaBed(row.bed),
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

export function addEuthynteria(
  cards: readonly Euthynteria[],
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
): Euthynteria[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readEuthynteriaList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: euthynteriaHour(card.hour),
      bed: euthynteriaBed(card.bed),
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

function mapCard(cards: readonly Euthynteria[], id: string, edit: (card: Euthynteria) => Euthynteria): Euthynteria[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editEuthynteria(cards: readonly Euthynteria[], id: string, title: string): Euthynteria[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editEuthynteriaNote(cards: readonly Euthynteria[], id: string, note: string): Euthynteria[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(euthynteriaBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setEuthynteriaBed(cards: readonly Euthynteria[], id: string, bed: string): Euthynteria[] {
  const next = euthynteriaBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setEuthynteriaRaised(cards: readonly Euthynteria[], id: string, raised: boolean): Euthynteria[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setEuthynteriaRack(cards: readonly Euthynteria[], id: string, pressed: boolean): Euthynteria[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setEuthynteriaShelf(cards: readonly Euthynteria[], id: string, shelved: boolean): Euthynteria[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setEuthynteriaPin(cards: readonly Euthynteria[], id: string, pinned: boolean): Euthynteria[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addEuthynteriaTag(cards: readonly Euthynteria[], id: string, tag: string): Euthynteria[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 2 | 5 | 8 | 14 {
  if (hour === null) return dir > 0 ? 2 : 14;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 2 | 5 | 8 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setEuthynteriaFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackEuthynteriaFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return setEuthynteriaRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinEuthynteriaFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  return setEuthynteriaPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Euthynteria[], id: string): Euthynteria[] {
  const card = cards.find((item) => item.id === id);
  return card ? setEuthynteriaBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Euthynteria[], ids: readonly string[], edit: (card: Euthynteria) => Euthynteria): Euthynteria[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkEuthynteriaLinen(cards: readonly Euthynteria[], ids: readonly string[]): Euthynteria[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkEuthynteriaRaise(cards: readonly Euthynteria[], ids: readonly string[]): Euthynteria[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkEuthynteriaShelf(cards: readonly Euthynteria[], ids: readonly string[]): Euthynteria[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkEuthynteriaTag(cards: readonly Euthynteria[], ids: readonly string[]): Euthynteria[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "r"]), audit: "tag" }));
}

export function readEuthynteriaViews(raw: unknown): EuthynteriaView[] {
  if (!Array.isArray(raw)) return [];
  const out: EuthynteriaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<EuthynteriaView>;
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

export function addEuthynteriaView(views: readonly EuthynteriaView[], view: EuthynteriaView): EuthynteriaView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readEuthynteriaViews([...views, { ...view, name }]);
}

export function dropEuthynteriaView(views: readonly EuthynteriaView[], id: string): EuthynteriaView[] {
  return views.filter((view) => view.id !== id);
}

export function euthynteriaDensity(raw: unknown): EuthynteriaDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortEuthynteriaList(cards: readonly Euthynteria[], sort: EuthynteriaSort): Euthynteria[] {
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

export function visibleEuthynteriaList(
  cards: readonly Euthynteria[],
  rack: EuthynteriaRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Euthynteria[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : euthynteriaBed(bed);
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

/** Respond at depth two, still not raised and not shelved, is overdue. */
export function overdueEuthynteria(card: Euthynteria): boolean {
  return card.profile === "respond" && card.depth === 2 && !card.raised && !card.shelved;
}

/** No ground, hour two, depth two, and still on the ridge. */
export function idleEuthynteria(card: Euthynteria): boolean {
  return !card.bed && card.hour === 2 && card.depth === 2 && !card.raised && !card.pressed && !card.shelved;
}

/** Gilt, fourteen hours, and a full depth, still off the shelf. */
export function briskEuthynteria(card: Euthynteria): boolean {
  return card.bed === "GILT" && card.hour === 14 && card.depth === 8 && !card.shelved;
}

/** Anta, ivory, and five hours. */
export function restingEuthynteria(card: Euthynteria): boolean {
  return card.profile === "anta" && card.bed === "IVORY" && card.hour === 5;
}

/** An euthynteria is late when the station is already respond. */
export function lateEuthynteria(card: Euthynteria, station: string): boolean {
  return card.profile === "euthynteria" && profilePoint(station) === "respond" && !card.raised;
}

export function euthynteriaCounts(cards: readonly Euthynteria[], shown: readonly Euthynteria[], station: string): EuthynteriaCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 14).length,
    quiet: cards.filter((card) => giltQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleEuthynteria).length,
    brisk: cards.filter(briskEuthynteria).length,
    resting: cards.filter(restingEuthynteria).length,
    overdue: cards.filter(overdueEuthynteria).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateEuthynteria(card, station)).length,
  };
}

export function euthynteriaBars(cards: readonly Euthynteria[]): { profile: string; count: number }[] {
  return EUT_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function euthynteriaTimeline(cards: readonly Euthynteria[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function euthynteriaHands(cards: readonly Euthynteria[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Euthynteria[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of euthynteriaHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderEuthynteriaList(cards: readonly Euthynteria[]): string[] {
  return cards.filter(overdueEuthynteria).map((card) => card.title);
}

export function euthynteriaCopy(card: Euthynteria): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function euthynteriaCsv(cards: readonly Euthynteria[], station: string): string {
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
        lateEuthynteria(card, station) ? "1" : "0",
        idleEuthynteria(card) ? "1" : "0",
        briskEuthynteria(card) ? "1" : "0",
        restingEuthynteria(card) ? "1" : "0",
        overdueEuthynteria(card) ? "1" : "0",
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


export const GEO_HIDE_KEY = "crmv4-geison-hide-400";
export const GEO_REVIEW_KEY = "crmv4-geison-review-400";

export type GeisonLane = "" | "route" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type GeisonHue = "" | "gilt" | "ash" | "pearl";
export type GeisonState = "" | "clear" | "set";
export type GeisonReview = "all" | "reviewed" | "fresh";
export type GeisonShape = "all" | "route" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type GeisonValue = string | { lastIp?: unknown; [key: string]: unknown } | null | undefined;
export type GeisonRow = { id: string; label: string; code: GeisonValue; userId?: string };
export type GeisonLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["route", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["ROUTE", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function geisonRecord(raw: GeisonValue): { lastIp?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function geisonBlocked(raw: GeisonValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function geisonGiven(raw: GeisonValue): string {
  const row = geisonRecord(raw);
  if (row && !("lastIp" in row)) return "";
  const value = row ? row.lastIp : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ROUTE";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function geisonReadable(raw: GeisonValue): boolean {
  if (geisonBlocked(raw)) return false;
  const row = geisonRecord(raw);
  if (row && !("lastIp" in row)) return false;
  return true;
}

export function geisonState(raw: GeisonValue): GeisonState {
  if (!geisonReadable(raw)) return "";
  return geisonGiven(raw) ? "set" : "clear";
}

/** Word marks win first. An address with a dot under seven letters is short. Twenty or more is long. An ordinary dotted address is a route. A leading digit of two or three is a code. One digit is short. Four digits or more is long. A word without a dot under five letters is short. Eighteen or longer is long. Anything else holds. */
export function geisonLane(raw: GeisonValue): GeisonLane {
  if (geisonState(raw) !== "set") return "";
  const text = geisonGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "route";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (text.includes(".")) {
    if (text.length < 7) return "short";
    if (text.length >= 20) return "long";
    return "route";
  }
  if (/^[0-9]/.test(text)) {
    if (text.length <= 1) return "short";
    if (text.length <= 3) return "code";
    return "long";
  }
  if (text.length >= 18) return "long";
  if (text.length < 5) return "short";
  return "hold";
}

export function geisonHue(raw: GeisonValue): GeisonHue {
  const mail = geisonLane(raw);
  if (!mail) return "";
  if (mail === "route") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function geisonLit(raw: GeisonValue): boolean {
  return geisonLane(raw) === "route";
}

export function geisonNear(raw: GeisonValue): boolean {
  return geisonLane(raw) === "code";
}

export function geisonFar(raw: GeisonValue): boolean {
  return geisonLane(raw) === "short";
}

export function geisonFade(raw: GeisonValue): boolean {
  return geisonLane(raw) === "long";
}

export function geisonDark(raw: GeisonValue): boolean {
  return geisonLane(raw) === "shut";
}

export function geisonDim(raw: GeisonValue): boolean {
  return geisonLane(raw) === "hold";
}

export function geisonBlank(raw: GeisonValue): boolean {
  return geisonLane(raw) === "blank";
}

export function geisonOpen(raw: GeisonValue): boolean {
  return geisonState(raw) === "clear";
}

export function geisonLength(raw: GeisonValue): number | null {
  if (geisonState(raw) !== "set") return null;
  return geisonGiven(raw).length;
}

export function geisonEven(raw: GeisonValue): boolean {
  const length = geisonLength(raw);
  return length !== null && length % 2 === 0;
}

export function geisonDigit(raw: GeisonValue): boolean {
  return /[0-9]/.test(geisonGiven(raw));
}

export function geisonLetter(raw: GeisonValue): boolean {
  return /[A-Za-z]/.test(geisonGiven(raw));
}

export function geisonUpper(raw: GeisonValue): boolean {
  const text = geisonGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function geisonCopy(raw: GeisonValue): string {
  return geisonGiven(raw);
}

export function geisonStamp(raw: GeisonValue): string {
  const text = geisonGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function geisonLanes(rows: readonly GeisonRow[]): GeisonLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = geisonLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingGeison(rows: readonly GeisonRow[]): string {
  const lines = geisonLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingGeisonHue(rows: readonly GeisonRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = geisonHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneGeisonCount(rows: readonly GeisonRow[], mail: GeisonLane): number {
  return rows.filter((row) => geisonLane(row.code) === mail).length;
}

export function geisonShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGeisonLanes(rows: readonly GeisonRow[]): string[] {
  return geisonLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenGeison(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGeison(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGeison(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleGeisonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGeisonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGeisonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: GeisonValue, shape: GeisonShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return geisonOpen(raw);
  if (shape === "digit") return geisonDigit(raw);
  if (shape === "letter") return geisonLetter(raw);
  if (shape === "even") return geisonEven(raw);
  if (shape === "upper") return geisonUpper(raw);
  return geisonLane(raw) === shape;
}

export function visibleGeison(
  rows: readonly GeisonRow[],
  mail: string,
  hue: string,
  query: string,
  review: GeisonReview,
  reviewed: readonly string[],
  shape: GeisonShape,
): GeisonRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = geisonLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && geisonHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${geisonCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function geisonLanesCsv(rows: readonly GeisonRow[]): string {
  const lines = ["lane,count"];
  for (const line of geisonLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function geisonRowsCsv(rows: readonly GeisonRow[], reviewed: readonly string[]): string {
  const lines = ["name,address,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(geisonCopy(row.code)), geisonLane(row.code), geisonHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
