/**
 * Intrados courses kept in this browser,
 * and extrados plates read the desk id already stored on the account.
 * Orders are intrados, soffit, haunch, and springer. Grounds are ivory, graphite, and gilt.
 * Hours are 1, 3, 6, or 12. Depths are 1, 3, or 5.
 * Intrados and soffit are the warm half. Haunch and springer are the cool half.
 * Graphite is the quiet ground.
 * DESK-HQ is the house desk and reads as live. A DESK- mark of nine letters is a code.
 * A DESK- mark of ten letters or more is long. Other DESK- marks stay live.
 * HOLD, WAIT, and PAUSE hold. CLOSED, VOID, BLOCK, DENY, and NO are shut.
 * NONE, BLANK, EMPTY, and CLEAR stay blank.
 * Three letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds.
 * A true desk mark reads as DESK-HQ. A false mark reads as CLOSED.
 * The secret is not read. Money fields are not read. The plate does not change the saved desk id.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_intrados_course (
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
 * CREATE TABLE crm_extrados_desk_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_extrados_desk_review (
 *   trader_id text primary key
 * );
 */


export const ITR_KEY = "crmv4-intrados-407";
export const ITR_VIEW_KEY = "crmv4-intrados-views-407";
export const ITR_DENSITY_KEY = "crmv4-intrados-density-407";
export const ITR_PROFILES = ["intrados", "soffit", "haunch", "springer"] as const;

export type IntradosProfile = (typeof ITR_PROFILES)[number];
export type IntradosBed = "blank" | "ivory" | "graphite" | "gilt";
export type IntradosRack = "base" | "press" | "shelf";
export type IntradosDensity = "open" | "tight";
export type IntradosSort = "profile" | "hand";

export type Intrados = {
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

export type IntradosView = {
  id: string;
  name: string;
  rack: IntradosRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type IntradosCounts = {
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

export const ROUND407_FEATURES = [
  "intrados-save",
  "intrados-reminders",
  "intrados-orders",
  "intrados-search",
  "intrados-hour-sla",
  "intrados-case",
  "intrados-pin",
  "intrados-inline-title",
  "intrados-filters",
  "saved-intrados-views",
  "intrados-density",
  "intrados-focus",
  "intrados-kpis",
  "intrados-chart",
  "intrados-timeline",
  "intrados-bulk",
  "intrados-csv",
  "intrados-keys",
  "intrados-audit",
  "quietest-intrados-hand",
  "intrados-viewer",
  "suggest-intrados",
  "overdue-intrados",
  "extrados-panels",
  "extrados-desk-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [1, 3, 6, 12] as const;
const DEPTH_CYCLE = [1, 3, 5] as const;
const WARM = new Set(["intrados", "soffit"]);
const COOL = new Set(["haunch", "springer"]);
const QUIET_BED = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): IntradosRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<IntradosBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<IntradosBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ix]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Intrados, rack: IntradosRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return ITR_PROFILES.indexOf(profile as IntradosProfile);
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
  return (ITR_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 1, 3, 6, or 12. Anything else stays blank. */
export function intradosHour(raw: unknown): 1 | 3 | 6 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "6" && text !== "12") return null;
  return Number(text) as 1 | 3 | 6 | 12;
}

/** A depth is 1, 3, or 5. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function intradosBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Intrados is first. Soffit is second. Haunch is third. Springer is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "intrados") return "first";
  if (text === "soffit") return "second";
  if (text === "haunch") return "third";
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
  return QUIET_BED.has(intradosBed(bed));
}

/** A pair depth is 3. One and five are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 3;
}

/** A full depth is 5. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 5;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = intradosHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, live: readonly string[]): string {
  const text = intradosBed(raw);
  return text && live.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveIntradosFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps graphite, then ivory, then gilt. */
export function suggestIntradosBed(cards: readonly Intrados[]): string {
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

/** Before three, suggest one. Before six, suggest three. Before twelve, suggest six. Later, suggest twelve. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestIntradosHour(cards: readonly Intrados[], hour: number): 1 | 3 | 6 | 12 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "base") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 1 | 3 | 6 | 12 = 1;
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
  if (hour < 3) return 1;
  if (hour < 6) return 3;
  if (hour < 12) return 6;
  return 12;
}

export function suggestProfile(hour: number): IntradosProfile {
  if (hour < 3) return "intrados";
  if (hour < 6) return "soffit";
  if (hour < 12) return "haunch";
  return "springer";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Intrados[], roster: string): string {
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

export function readIntradosList(raw: unknown): Intrados[] {
  if (!Array.isArray(raw)) return [];
  const out: Intrados[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Intrados>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: intradosHour(row.hour),
      bed: intradosBed(row.bed),
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

export function addIntrados(
  cards: readonly Intrados[],
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
): Intrados[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `i${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readIntradosList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: intradosHour(card.hour),
      bed: intradosBed(card.bed),
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

function mapCard(cards: readonly Intrados[], id: string, edit: (card: Intrados) => Intrados): Intrados[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editIntrados(cards: readonly Intrados[], id: string, title: string): Intrados[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editIntradosNote(cards: readonly Intrados[], id: string, note: string): Intrados[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(intradosBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setIntradosBed(cards: readonly Intrados[], id: string, bed: string): Intrados[] {
  const next = intradosBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setIntradosRaised(cards: readonly Intrados[], id: string, raised: boolean): Intrados[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setIntradosRack(cards: readonly Intrados[], id: string, pressed: boolean): Intrados[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setIntradosShelf(cards: readonly Intrados[], id: string, shelved: boolean): Intrados[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setIntradosPin(cards: readonly Intrados[], id: string, pinned: boolean): Intrados[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addIntradosTag(cards: readonly Intrados[], id: string, tag: string): Intrados[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 1 | 3 | 6 | 12 {
  if (hour === null) return dir > 0 ? 1 : 12;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepDepth(depth: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setIntradosFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackIntradosFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return setIntradosRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinIntradosFocused(cards: readonly Intrados[], id: string): Intrados[] {
  return setIntradosPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Intrados[], id: string): Intrados[] {
  const card = cards.find((item) => item.id === id);
  return card ? setIntradosBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Intrados[], ids: readonly string[], edit: (card: Intrados) => Intrados): Intrados[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkIntradosLinen(cards: readonly Intrados[], ids: readonly string[]): Intrados[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkIntradosRaise(cards: readonly Intrados[], ids: readonly string[]): Intrados[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkIntradosShelf(cards: readonly Intrados[], ids: readonly string[]): Intrados[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkIntradosTag(cards: readonly Intrados[], ids: readonly string[]): Intrados[] {
  return bulk(cards, ids, (card) => (card.tags.includes("x") ? card : { ...card, tags: tagsOf([...card.tags, "x"]), audit: "tag" }));
}

export function readIntradosViews(raw: unknown): IntradosView[] {
  if (!Array.isArray(raw)) return [];
  const out: IntradosView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<IntradosView>;
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

export function addIntradosView(views: readonly IntradosView[], view: IntradosView): IntradosView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readIntradosViews([...views, { ...view, name }]);
}

export function dropIntradosView(views: readonly IntradosView[], id: string): IntradosView[] {
  return views.filter((view) => view.id !== id);
}

export function intradosDensity(raw: unknown): IntradosDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortIntradosList(cards: readonly Intrados[], sort: IntradosSort): Intrados[] {
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

export function visibleIntradosList(
  cards: readonly Intrados[],
  rack: IntradosRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Intrados[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : intradosBed(bed);
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

/** Springer at depth one, still not raised and not shelved, is overdue. */
export function overdueIntrados(card: Intrados): boolean {
  return card.profile === "springer" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour one, depth one, and still on the yard. */
export function idleIntrados(card: Intrados): boolean {
  return !card.bed && card.hour === 1 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Graphite, twelve hours, and a full depth, still off the shelf. */
export function briskIntrados(card: Intrados): boolean {
  return card.bed === "GRAPHITE" && card.hour === 12 && card.depth === 5 && !card.shelved;
}

/** Haunch, ivory, and three hours. */
export function restingIntrados(card: Intrados): boolean {
  return card.profile === "haunch" && card.bed === "IVORY" && card.hour === 3;
}

/** An intrados is late when the station is already springer. */
export function lateIntrados(card: Intrados, station: string): boolean {
  return card.profile === "intrados" && profilePoint(station) === "springer" && !card.raised;
}

export function intradosCounts(cards: readonly Intrados[], shown: readonly Intrados[], station: string): IntradosCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 12).length,
    quiet: cards.filter((card) => graphiteQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleIntrados).length,
    brisk: cards.filter(briskIntrados).length,
    resting: cards.filter(restingIntrados).length,
    overdue: cards.filter(overdueIntrados).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateIntrados(card, station)).length,
  };
}

export function intradosBars(cards: readonly Intrados[]): { profile: string; count: number }[] {
  return ITR_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function intradosTimeline(cards: readonly Intrados[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function intradosHands(cards: readonly Intrados[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Intrados[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of intradosHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderIntradosList(cards: readonly Intrados[]): string[] {
  return cards.filter(overdueIntrados).map((card) => card.title);
}

export function intradosCopy(card: Intrados): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function intradosCsv(cards: readonly Intrados[], station: string): string {
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
        lateIntrados(card, station) ? "1" : "0",
        idleIntrados(card) ? "1" : "0",
        briskIntrados(card) ? "1" : "0",
        restingIntrados(card) ? "1" : "0",
        overdueIntrados(card) ? "1" : "0",
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


export const EXD_HIDE_KEY = "crmv4-extrados-hide-407";
export const EXD_REVIEW_KEY = "crmv4-extrados-review-407";

export type ExtradosLane = "" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type ExtradosHue = "" | "gilt" | "ash" | "pearl";
export type ExtradosState = "" | "clear" | "set";
export type ExtradosReview = "all" | "reviewed" | "fresh";
export type ExtradosShape = "all" | "live" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type ExtradosValue = string | { deskId?: unknown; [key: string]: unknown } | null | undefined;
export type ExtradosRow = { id: string; label: string; code: ExtradosValue; userId?: string };
export type ExtradosLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["live", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["DESK-HQ"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT", "PAUSE"]);
const SHUT_TITLES = new Set(["CLOSED", "VOID", "BLOCK", "DENY", "NO"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function extradosRecord(raw: ExtradosValue): { deskId?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function extradosBlocked(raw: ExtradosValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function extradosGiven(raw: ExtradosValue): string {
  const row = extradosRecord(raw);
  if (row && !("deskId" in row)) return "";
  const value = row ? row.deskId : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "DESK-HQ";
  if (value === false || value === "false" || value === "0" || value === 0) return "CLOSED";
  return snip(value, 48);
}

function extradosReadable(raw: ExtradosValue): boolean {
  if (extradosBlocked(raw)) return false;
  const row = extradosRecord(raw);
  if (row && !("deskId" in row)) return false;
  return true;
}


export function extradosSlice(raw: unknown): ExtradosValue {
  if (!raw || typeof raw !== "object") return "";
  const row = raw as Record<string, unknown>;
  if (!("deskId" in row)) return { deskId: "" };
  const value = row.deskId;
  if (typeof value === "string") return { deskId: snip(value, 48) };
  return { deskId: value as never };
}

export function extradosState(raw: ExtradosValue): ExtradosState {
  if (!extradosReadable(raw)) return "";
  return extradosGiven(raw) ? "set" : "clear";
}

/** Word marks win first. DESK-HQ is live. HOLD, WAIT, and PAUSE hold. CLOSED, VOID, BLOCK, DENY, and NO are shut. NONE, BLANK, EMPTY, and CLEAR stay blank. A DESK- mark of nine letters is a code. A DESK- mark of ten or more is long. Any other DESK- mark is live. Three letters are a code. One letter is short. Fourteen letters or more are long. Anything else holds. */
export function extradosLane(raw: ExtradosValue): ExtradosLane {
  if (extradosState(raw) !== "set") return "";
  const text = extradosGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "live";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (upper.startsWith("DESK-") && text.length === 9) return "code";
  if (upper.startsWith("DESK-") && text.length >= 10) return "long";
  if (upper.startsWith("DESK-")) return "live";
  if (/^[A-Za-z]{3}$/.test(text)) return "code";
  if (text.length <= 1) return "short";
  if (text.length >= 14) return "long";
  return "hold";
}

export function extradosHue(raw: ExtradosValue): ExtradosHue {
  const mail = extradosLane(raw);
  if (!mail) return "";
  if (mail === "live") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function extradosLit(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "live";
}

export function extradosNear(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "code";
}

export function extradosFar(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "short";
}

export function extradosFade(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "long";
}

export function extradosDark(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "shut";
}

export function extradosDim(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "hold";
}

export function extradosBlank(raw: ExtradosValue): boolean {
  return extradosLane(raw) === "blank";
}

export function extradosOpen(raw: ExtradosValue): boolean {
  return extradosState(raw) === "clear";
}

export function extradosLength(raw: ExtradosValue): number | null {
  if (extradosState(raw) !== "set") return null;
  return extradosGiven(raw).length;
}

export function extradosEven(raw: ExtradosValue): boolean {
  const length = extradosLength(raw);
  return length !== null && length % 2 === 0;
}

export function extradosDigit(raw: ExtradosValue): boolean {
  return /[0-9]/.test(extradosGiven(raw));
}

export function extradosLetter(raw: ExtradosValue): boolean {
  return /[A-Za-z]/.test(extradosGiven(raw));
}

export function extradosUpper(raw: ExtradosValue): boolean {
  const text = extradosGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function extradosCopy(raw: ExtradosValue): string {
  return extradosGiven(raw);
}

export function extradosStamp(raw: ExtradosValue): string {
  const text = extradosGiven(raw);
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

export function extradosLanes(rows: readonly ExtradosRow[]): ExtradosLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = extradosLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingExtrados(rows: readonly ExtradosRow[]): string {
  const lines = extradosLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingExtradosHue(rows: readonly ExtradosRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = extradosHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneExtradosCount(rows: readonly ExtradosRow[], mail: ExtradosLane): number {
  return rows.filter((row) => extradosLane(row.code) === mail).length;
}

export function extradosShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentExtradosLanes(rows: readonly ExtradosRow[]): string[] {
  return extradosLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenExtrados(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedExtrados(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleExtrados(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleExtradosReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkExtradosReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleExtradosLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: ExtradosValue, shape: ExtradosShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return extradosOpen(raw);
  if (shape === "digit") return extradosDigit(raw);
  if (shape === "letter") return extradosLetter(raw);
  if (shape === "even") return extradosEven(raw);
  if (shape === "upper") return extradosUpper(raw);
  return extradosLane(raw) === shape;
}

export function visibleExtrados(
  rows: readonly ExtradosRow[],
  mail: string,
  hue: string,
  query: string,
  review: ExtradosReview,
  reviewed: readonly string[],
  shape: ExtradosShape,
): ExtradosRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = extradosLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && extradosHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${extradosCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function extradosLanesCsv(rows: readonly ExtradosRow[]): string {
  const lines = ["lane,count"];
  for (const line of extradosLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function extradosRowsCsv(rows: readonly ExtradosRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(extradosCopy(row.code)), extradosLane(row.code), extradosHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
