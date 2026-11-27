/**
 * Orthostate courses kept in this browser,
 * and apophyge plates read the region already stored on the account.
 * Orders are orthostate, entasis, arris, and fluting. Grounds are ivory, graphite, and gilt.
 * Hours are 3, 6, 9, or 15. Depths are 1, 4, or 7.
 * Orthostate and entasis are the warm half. Arris and fluting are the cool half.
 * Gilt is the quiet ground.
 * A region with a hyphen and ordinary length is a belt. Under eight letters is short. Twenty-eight or more is long.
 * A leading digit of two to four is a code. One digit is short. Five digits or more are long.
 * A word without a hyphen shorter than four letters is short. Sixteen or longer is long. Anything else holds.
 * Belt, live, and open are belts. Hold, pause, and wait hold.
 * Off, void, shut, and drop are shut. None, blank, empty, and clear stay blank.
 * A true region reads as BELT. A false region reads as OFF.
 * Money fields are not read. The plate does not change the saved region.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_orthostate_course (
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
 * CREATE TABLE crm_apophyge_region_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_apophyge_region_review (
 *   trader_id text primary key
 * );
 */
export const ORT_KEY = "crmv4-orthostate-399";
export const ORT_VIEW_KEY = "crmv4-orthostate-views-399";
export const ORT_DENSITY_KEY = "crmv4-orthostate-density-399";
export const ORT_PROFILES = ["orthostate", "entasis", "arris", "fluting"] as const;

export type OrthostateProfile = (typeof ORT_PROFILES)[number];
export type OrthostateBed = "blank" | "ivory" | "graphite" | "gilt";
export type OrthostateRack = "base" | "press" | "shelf";
export type OrthostateDensity = "open" | "tight";
export type OrthostateSort = "profile" | "hand";

export type Orthostate = {
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

export type OrthostateView = {
  id: string;
  name: string;
  rack: OrthostateRack;
  query: string;
  hand: string;
  bed: string;
  profile: string;
  hour: string;
  depth: string;
};

export type OrthostateCounts = {
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

export const ROUND399_FEATURES = [
  "orthostate-save",
  "orthostate-reminders",
  "orthostate-orders",
  "orthostate-search",
  "orthostate-hour-sla",
  "orthostate-case",
  "orthostate-pin",
  "orthostate-inline-title",
  "orthostate-filters",
  "saved-orthostate-views",
  "orthostate-density",
  "orthostate-focus",
  "orthostate-kpis",
  "orthostate-chart",
  "orthostate-timeline",
  "orthostate-bulk",
  "orthostate-csv",
  "orthostate-keys",
  "orthostate-audit",
  "quietest-orthostate-hand",
  "orthostate-viewer",
  "suggest-orthostate",
  "overdue-orthostate",
  "apophyge-panels",
  "apophyge-region-csv",
] as const;

const AUDITS = ["save", "edit", "note", "bed", "raise", "free", "press", "return", "shelf", "open", "tag", "depth", "hour", "lower", "pin"] as const;
const BEDS = ["ivory", "graphite", "gilt"] as const;
const HOUR_CYCLE = [3, 6, 9, 15] as const;
const DEPTH_CYCLE = [1, 4, 7] as const;
const WARM = new Set(["orthostate", "entasis"]);
const COOL = new Set(["arris", "fluting"]);
const QUIET_BED = new Set(["GILT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 12;
const VIEW_CAP = 3;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): OrthostateRack {
  return raw === "press" || raw === "shelf" ? raw : "base";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bedName(raw: unknown): Exclude<OrthostateBed, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (BEDS as readonly string[]).includes(text) ? (text as Exclude<OrthostateBed, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[oa]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Orthostate, rack: OrthostateRack): boolean {
  if (rack === "press") return card.pressed && !card.shelved;
  if (rack === "shelf") return card.shelved;
  return !card.pressed && !card.shelved;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function profileIndex(profile: string): number {
  return ORT_PROFILES.indexOf(profile as OrthostateProfile);
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
  return (ORT_PROFILES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 3, 6, 9, or 15. Anything else stays blank. */
export function orthostateHour(raw: unknown): 3 | 6 | 9 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9" && text !== "15") return null;
  return Number(text) as 3 | 6 | 9 | 15;
}

/** A depth is 1, 4, or 7. Anything else stays blank. */
export function depthCount(raw: unknown): 1 | 4 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "4" && text !== "7") return null;
  return Number(text) as 1 | 4 | 7;
}

/** A bed is ivory, graphite, or gilt. The saved name is the upper token. */
export function orthostateBed(raw: unknown): string {
  const text = bedName(raw);
  return text ? text.toUpperCase() : "";
}

export function profileWarm(profile: unknown): boolean {
  return WARM.has(snip(profile, 12).toLowerCase());
}

export function profileCool(profile: unknown): boolean {
  return COOL.has(snip(profile, 12).toLowerCase());
}

/** Orthostate is first. Entasis is second. Arris is third. Fluting is fourth. */
export function profileBand(profile: unknown): string {
  const text = profilePoint(profile);
  if (!text) return "";
  if (text === "orthostate") return "first";
  if (text === "entasis") return "second";
  if (text === "arris") return "third";
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
  return QUIET_BED.has(orthostateBed(bed));
}

/** A pair depth is 4. One and seven are not a pair. */
export function midDepth(depth: unknown): boolean {
  return depthCount(depth) === 4;
}

/** A full depth is 7. */
export function fullDepth(depth: unknown): boolean {
  return depthCount(depth) === 7;
}

export function activeProfile(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return profilePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = orthostateHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeBed(raw: unknown, allow: readonly string[]): string {
  const text = orthostateBed(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeDepth(raw: unknown): string {
  const depth = depthCount(raw);
  return depth === null ? "all" : String(depth);
}

export function moveOrthostateFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The bed the yard uses least. A tie keeps ivory, then graphite, then gilt. */
export function suggestOrthostateBed(cards: readonly Orthostate[]): string {
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

/** Before six, suggest three. Before ten, suggest six. Before fifteen, suggest nine. Later, suggest fifteen. A saved hour on the base wins, and a tie keeps the shorter hour. */
export function suggestOrthostateHour(cards: readonly Orthostate[], hour: number): 3 | 6 | 9 | 15 {
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
  if (hour < 10) return 6;
  if (hour < 15) return 9;
  return 15;
}

export function suggestProfile(hour: number): OrthostateProfile {
  if (hour < 6) return "orthostate";
  if (hour < 10) return "entasis";
  if (hour < 15) return "arris";
  return "fluting";
}

/** The hand with the fewest unraised scrolls on the yard. A tie keeps the roster order. */
export function fairHand(cards: readonly Orthostate[], roster: string): string {
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

export function readOrthostateList(raw: unknown): Orthostate[] {
  if (!Array.isArray(raw)) return [];
  const out: Orthostate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Orthostate>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      profile: profilePoint(row.profile),
      hour: orthostateHour(row.hour),
      bed: orthostateBed(row.bed),
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

export function addOrthostate(
  cards: readonly Orthostate[],
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
): Orthostate[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOrthostateList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      profile: profilePoint(card.profile),
      hour: orthostateHour(card.hour),
      bed: orthostateBed(card.bed),
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

function mapCard(cards: readonly Orthostate[], id: string, edit: (card: Orthostate) => Orthostate): Orthostate[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOrthostate(cards: readonly Orthostate[], id: string, title: string): Orthostate[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOrthostateNote(cards: readonly Orthostate[], id: string, note: string): Orthostate[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleBed(bed: string): string {
  const order = ["", "IVORY", "GRAPHITE", "GILT"];
  const index = order.indexOf(orthostateBed(bed));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setOrthostateBed(cards: readonly Orthostate[], id: string, bed: string): Orthostate[] {
  const next = orthostateBed(bed);
  return mapCard(cards, id, (card) => (card.bed === next ? card : { ...card, bed: next, audit: "bed" }));
}

export function setOrthostateRaised(cards: readonly Orthostate[], id: string, raised: boolean): Orthostate[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setOrthostateRack(cards: readonly Orthostate[], id: string, pressed: boolean): Orthostate[] {
  return mapCard(cards, id, (card) => (card.pressed === pressed ? card : { ...card, pressed, shelved: pressed ? false : card.shelved, audit: pressed ? "press" : "return" }));
}

export function setOrthostateShelf(cards: readonly Orthostate[], id: string, shelved: boolean): Orthostate[] {
  return mapCard(cards, id, (card) => (card.shelved === shelved ? card : { ...card, shelved, pressed: shelved ? false : card.pressed, audit: shelved ? "shelf" : "open" }));
}

export function setOrthostatePin(cards: readonly Orthostate[], id: string, pinned: boolean): Orthostate[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addOrthostateTag(cards: readonly Orthostate[], id: string, tag: string): Orthostate[] {
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

function stepDepth(depth: number, dir: 1 | -1): 1 | 4 | 7 {
  const index = depthIndex(depth);
  const next = index < 0 ? 0 : (index + dir + DEPTH_CYCLE.length) % DEPTH_CYCLE.length;
  return DEPTH_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseDepthFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, 1), audit: "depth" }));
}

export function lowerDepthFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return mapCard(cards, id, (card) => ({ ...card, depth: stepDepth(card.depth, -1), audit: "depth" }));
}

export function setOrthostateFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackOrthostateFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return setOrthostateRack(cards, id, !cards.find((card) => card.id === id)?.pressed);
}

export function pinOrthostateFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  return setOrthostatePin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function bedFocused(cards: readonly Orthostate[], id: string): Orthostate[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOrthostateBed(cards, id, cycleBed(card.bed)) : [...cards];
}

function bulk(cards: readonly Orthostate[], ids: readonly string[], edit: (card: Orthostate) => Orthostate): Orthostate[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOrthostateLinen(cards: readonly Orthostate[], ids: readonly string[]): Orthostate[] {
  return bulk(cards, ids, (card) => (card.bed === "IVORY" ? card : { ...card, bed: "IVORY", audit: "bed" }));
}

export function bulkOrthostateRaise(cards: readonly Orthostate[], ids: readonly string[]): Orthostate[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkOrthostateShelf(cards: readonly Orthostate[], ids: readonly string[]): Orthostate[] {
  return bulk(cards, ids, (card) => (card.shelved ? card : { ...card, shelved: true, pressed: false, audit: "shelf" }));
}

export function bulkOrthostateTag(cards: readonly Orthostate[], ids: readonly string[]): Orthostate[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readOrthostateViews(raw: unknown): OrthostateView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrthostateView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrthostateView>;
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

export function addOrthostateView(views: readonly OrthostateView[], view: OrthostateView): OrthostateView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOrthostateViews([...views, { ...view, name }]);
}

export function dropOrthostateView(views: readonly OrthostateView[], id: string): OrthostateView[] {
  return views.filter((view) => view.id !== id);
}

export function orthostateDensity(raw: unknown): OrthostateDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortOrthostateList(cards: readonly Orthostate[], sort: OrthostateSort): Orthostate[] {
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

export function visibleOrthostateList(
  cards: readonly Orthostate[],
  rack: OrthostateRack,
  query: string,
  hand: string,
  bed: string,
  profile: string,
  hour: string,
  depth: string,
): Orthostate[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantBed = bed === "all" ? "" : orthostateBed(bed);
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

/** Fluting at depth one, still not raised and not shelved, is overdue. */
export function overdueOrthostate(card: Orthostate): boolean {
  return card.profile === "fluting" && card.depth === 1 && !card.raised && !card.shelved;
}

/** No ground, hour three, depth one, and still on the ridge. */
export function idleOrthostate(card: Orthostate): boolean {
  return !card.bed && card.hour === 3 && card.depth === 1 && !card.raised && !card.pressed && !card.shelved;
}

/** Gilt, fifteen hours, and a full depth, still off the shelf. */
export function briskOrthostate(card: Orthostate): boolean {
  return card.bed === "GILT" && card.hour === 15 && card.depth === 7 && !card.shelved;
}

/** Arris, ivory, and six hours. */
export function restingOrthostate(card: Orthostate): boolean {
  return card.profile === "arris" && card.bed === "IVORY" && card.hour === 6;
}

/** An orthostate is late when the station is already fluting. */
export function lateOrthostate(card: Orthostate, station: string): boolean {
  return card.profile === "orthostate" && profilePoint(station) === "fluting" && !card.raised;
}

export function orthostateCounts(cards: readonly Orthostate[], shown: readonly Orthostate[], station: string): OrthostateCounts {
  return {
    base: cards.filter((card) => inRack(card, "base")).length,
    press: cards.filter((card) => inRack(card, "press")).length,
    shelf: cards.filter((card) => inRack(card, "shelf")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => profileWarm(card.profile)).length,
    cool: cards.filter((card) => profileCool(card.profile)).length,
    long: cards.filter((card) => card.hour === 15).length,
    quiet: cards.filter((card) => giltQuiet(card.bed)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleOrthostate).length,
    brisk: cards.filter(briskOrthostate).length,
    resting: cards.filter(restingOrthostate).length,
    overdue: cards.filter(overdueOrthostate).length,
    pair: cards.filter((card) => midDepth(card.depth) && lateOrthostate(card, station)).length,
  };
}

export function orthostateBars(cards: readonly Orthostate[]): { profile: string; count: number }[] {
  return ORT_PROFILES.map((profile) => ({ profile, count: cards.filter((card) => card.profile === profile && !card.shelved).length }));
}

export function orthostateTimeline(cards: readonly Orthostate[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "base"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function orthostateHands(cards: readonly Orthostate[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Orthostate[]): string {
  const open = cards.filter((card) => inRack(card, "base") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of orthostateHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOrthostateList(cards: readonly Orthostate[]): string[] {
  return cards.filter(overdueOrthostate).map((card) => card.title);
}

export function orthostateCopy(card: Orthostate): string {
  return [card.title, card.hand, card.profile, card.bed, card.hour ?? "", card.depth, card.note].filter((item) => item !== "").join(" · ");
}

export function orthostateCsv(cards: readonly Orthostate[], station: string): string {
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
        lateOrthostate(card, station) ? "1" : "0",
        idleOrthostate(card) ? "1" : "0",
        briskOrthostate(card) ? "1" : "0",
        restingOrthostate(card) ? "1" : "0",
        overdueOrthostate(card) ? "1" : "0",
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


export const APO_HIDE_KEY = "crmv4-apophyge-hide-399";
export const APO_REVIEW_KEY = "crmv4-apophyge-review-399";

export type ApophygeLane = "" | "belt" | "code" | "short" | "long" | "hold" | "shut" | "blank";
export type ApophygeHue = "" | "gilt" | "ash" | "pearl";
export type ApophygeState = "" | "clear" | "set";
export type ApophygeReview = "all" | "reviewed" | "fresh";
export type ApophygeShape = "all" | "belt" | "code" | "short" | "long" | "hold" | "shut" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type ApophygeValue = string | { lastRegion?: unknown; [key: string]: unknown } | null | undefined;
export type ApophygeRow = { id: string; label: string; code: ApophygeValue; userId?: string };
export type ApophygeLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["belt", "code", "short", "long", "hold", "shut", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const LINK_TITLES = new Set(["BELT", "LIVE", "OPEN"]);
const HOLD_TITLES = new Set(["HOLD", "PAUSE", "WAIT"]);
const SHUT_TITLES = new Set(["OFF", "VOID", "SHUT", "DROP"]);
const BLANK_TITLES = new Set(["NONE", "BLANK", "EMPTY", "CLEAR"]);

function apophygeRecord(raw: ApophygeValue): { lastRegion?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function apophygeBlocked(raw: ApophygeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function apophygeGiven(raw: ApophygeValue): string {
  const row = apophygeRecord(raw);
  if (row && !("lastRegion" in row)) return "";
  const value = row ? row.lastRegion : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "BELT";
  if (value === false || value === "false" || value === "0" || value === 0) return "OFF";
  return snip(value, 48);
}

function apophygeReadable(raw: ApophygeValue): boolean {
  if (apophygeBlocked(raw)) return false;
  const row = apophygeRecord(raw);
  if (row && !("lastRegion" in row)) return false;
  return true;
}

export function apophygeState(raw: ApophygeValue): ApophygeState {
  if (!apophygeReadable(raw)) return "";
  return apophygeGiven(raw) ? "set" : "clear";
}

/** Word marks win first. A region with a hyphen under eight letters is short. Twenty-eight or more is long. An ordinary hyphenated region is a belt. A leading digit of two to four is a code. One digit is short. Five digits or more is long. A word without a hyphen under four letters is short. Sixteen or longer is long. Anything else holds. */
export function apophygeLane(raw: ApophygeValue): ApophygeLane {
  if (apophygeState(raw) !== "set") return "";
  const text = apophygeGiven(raw);
  const upper = text.toUpperCase();
  if (LINK_TITLES.has(upper)) return "belt";
  if (HOLD_TITLES.has(upper)) return "hold";
  if (SHUT_TITLES.has(upper)) return "shut";
  if (BLANK_TITLES.has(upper)) return "blank";
  if (text.includes("-")) {
    if (text.length < 8) return "short";
    if (text.length >= 28) return "long";
    return "belt";
  }
  if (/^[0-9]/.test(text)) {
    if (text.length <= 1) return "short";
    if (text.length <= 4) return "code";
    return "long";
  }
  if (text.length >= 16) return "long";
  if (text.length < 4) return "short";
  return "hold";
}

export function apophygeHue(raw: ApophygeValue): ApophygeHue {
  const mail = apophygeLane(raw);
  if (!mail) return "";
  if (mail === "belt") return "gilt";
  if (mail === "shut" || mail === "long") return "ash";
  return "pearl";
}

export function apophygeLit(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "belt";
}

export function apophygeNear(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "code";
}

export function apophygeFar(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "short";
}

export function apophygeFade(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "long";
}

export function apophygeDark(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "shut";
}

export function apophygeDim(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "hold";
}

export function apophygeBlank(raw: ApophygeValue): boolean {
  return apophygeLane(raw) === "blank";
}

export function apophygeOpen(raw: ApophygeValue): boolean {
  return apophygeState(raw) === "clear";
}

export function apophygeLength(raw: ApophygeValue): number | null {
  if (apophygeState(raw) !== "set") return null;
  return apophygeGiven(raw).length;
}

export function apophygeEven(raw: ApophygeValue): boolean {
  const length = apophygeLength(raw);
  return length !== null && length % 2 === 0;
}

export function apophygeDigit(raw: ApophygeValue): boolean {
  return /[0-9]/.test(apophygeGiven(raw));
}

export function apophygeLetter(raw: ApophygeValue): boolean {
  return /[A-Za-z]/.test(apophygeGiven(raw));
}

export function apophygeUpper(raw: ApophygeValue): boolean {
  const text = apophygeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function apophygeCopy(raw: ApophygeValue): string {
  return apophygeGiven(raw);
}

export function apophygeStamp(raw: ApophygeValue): string {
  const text = apophygeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function apophygeLanes(rows: readonly ApophygeRow[]): ApophygeLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = apophygeLane(row.code);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingApophyge(rows: readonly ApophygeRow[]): string {
  const lines = apophygeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingApophygeHue(rows: readonly ApophygeRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = apophygeHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneApophygeCount(rows: readonly ApophygeRow[], mail: ApophygeLane): number {
  return rows.filter((row) => apophygeLane(row.code) === mail).length;
}

export function apophygeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentApophygeLanes(rows: readonly ApophygeRow[]): string[] {
  return apophygeLanes(rows).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenApophyge(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedApophyge(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleApophyge(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleApophygeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkApophygeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleApophygeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: ApophygeValue, shape: ApophygeShape): boolean {
  if (shape === "all") return true;
  if (shape === "open") return apophygeOpen(raw);
  if (shape === "digit") return apophygeDigit(raw);
  if (shape === "letter") return apophygeLetter(raw);
  if (shape === "even") return apophygeEven(raw);
  if (shape === "upper") return apophygeUpper(raw);
  return apophygeLane(raw) === shape;
}

export function visibleApophyge(
  rows: readonly ApophygeRow[],
  mail: string,
  hue: string,
  query: string,
  review: ApophygeReview,
  reviewed: readonly string[],
  shape: ApophygeShape,
): ApophygeRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = apophygeLane(row.code);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && apophygeHue(row.code) !== hue) return false;
    if (text && !`${row.label} ${apophygeCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape)) return false;
    return true;
  });
}

export function apophygeLanesCsv(rows: readonly ApophygeRow[]): string {
  const lines = ["lane,count"];
  for (const line of apophygeLanes(rows)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function apophygeRowsCsv(rows: readonly ApophygeRow[], reviewed: readonly string[]): string {
  const lines = ["name,region,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(apophygeCopy(row.code)), apophygeLane(row.code), apophygeHue(row.code), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
