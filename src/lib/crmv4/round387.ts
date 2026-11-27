/**
 * Cosmati bands kept in this browser,
 * and presence lamps read the active flag already stored on the account.
 * Stones are porphyry, marble, serpent, and slate. Grounds are ivory, graphite, and champagne.
 * Hours are 6, 9, 12, or 15. Courses are 1, 3, or 5.
 * Porphyry and marble are the warm half. Serpent and slate are the cool half.
 * Ivory is the quiet ground.
 * An active date today is lit. Within four days ahead is near. Further ahead is far.
 * An active date younger than three days past fades. Older than that is dark.
 * Live, on, open, and yes are lit. Next, soon, and soft are near. Hold, wait, and pause dim.
 * Late and cool fade. Off, drop, block, and dark are dark. None, null, bare, and void stay blank.
 * A true flag reads as LIVE. A false flag reads as DARK.
 * Money fields are not read. The lamp does not change the saved flag.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cosmati_band (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   stone text not null default '',
 *   hour_mark integer,
 *   ground text not null default '',
 *   course integer not null default 1,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   trayed boolean not null default false,
 *   vaulted boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_presence_lamp_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_presence_lamp_review (
 *   trader_id text primary key
 * );
 */
export const CSM_KEY = "crmv4-cosmati-387";
export const CSM_VIEW_KEY = "crmv4-cosmati-views-387";
export const CSM_DENSITY_KEY = "crmv4-cosmati-density-387";
export const CSM_STONES = ["porphyry", "marble", "serpent", "slate"] as const;

export type CosmatiStone = (typeof CSM_STONES)[number];
export type CosmatiGround = "blank" | "ivory" | "graphite" | "champagne";
export type CosmatiRack = "bench" | "tray" | "vault";
export type CosmatiDensity = "open" | "tight";
export type CosmatiSort = "stone" | "hand";

export type Cosmati = {
  id: string;
  title: string;
  note: string;
  hand: string;
  stone: string;
  hour: number | null;
  ground: string;
  course: number;
  tags: string[];
  raised: boolean;
  trayed: boolean;
  vaulted: boolean;
  pinned: boolean;
  audit: string;
};

export type CosmatiView = {
  id: string;
  name: string;
  rack: CosmatiRack;
  query: string;
  hand: string;
  ground: string;
  stone: string;
  hour: string;
  course: string;
};

export type CosmatiCounts = {
  bench: number;
  tray: number;
  vault: number;
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

export const ROUND387_FEATURES = [
  "cosmati-save",
  "cosmati-reminders",
  "cosmati-stones",
  "cosmati-search",
  "cosmati-hour-sla",
  "cosmati-vault",
  "cosmati-pin",
  "cosmati-inline-title",
  "cosmati-filters",
  "saved-cosmati-views",
  "cosmati-density",
  "cosmati-focus",
  "cosmati-kpis",
  "cosmati-chart",
  "cosmati-timeline",
  "cosmati-bulk",
  "cosmati-csv",
  "cosmati-keys",
  "cosmati-audit",
  "fewest-bench-hand",
  "cosmati-viewer",
  "suggest-cosmati",
  "overdue-slate",
  "presence-lamps",
  "presence-lamp-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "vault", "open", "tag", "course", "hour", "lower", "pin"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [6, 9, 12, 15] as const;
const COURSE_CYCLE = [1, 3, 5] as const;
const WARM = new Set(["porphyry", "marble"]);
const COOL = new Set(["serpent", "slate"]);
const QUIET_GROUND = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 14;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): CosmatiRack {
  return raw === "tray" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<CosmatiGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<CosmatiGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ps]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Cosmati, rack: CosmatiRack): boolean {
  if (rack === "tray") return card.trayed && !card.vaulted;
  if (rack === "vault") return card.vaulted;
  return !card.trayed && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stoneIndex(stone: string): number {
  return CSM_STONES.indexOf(stone as CosmatiStone);
}

function hourIndex(hour: number): number {
  return HOUR_CYCLE.indexOf(hour as (typeof HOUR_CYCLE)[number]);
}

function courseIndex(course: number): number {
  return COURSE_CYCLE.indexOf(course as (typeof COURSE_CYCLE)[number]);
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

export function stonePoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (CSM_STONES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 6, 9, 12, or 15. Anything else stays blank. */
export function cosmatiHour(raw: unknown): 6 | 9 | 12 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "9" && text !== "12" && text !== "15") return null;
  return Number(text) as 6 | 9 | 12 | 15;
}

/** A course count is 1, 3, or 5. Anything else stays blank. */
export function courseCount(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function cosmatiGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function stoneWarm(metal: unknown): boolean {
  return WARM.has(snip(metal, 12).toLowerCase());
}

export function stoneCool(metal: unknown): boolean {
  return COOL.has(snip(metal, 12).toLowerCase());
}

/** Porphyry is first. Marble is second. Serpent is third. Slate is fourth. */
export function stoneBand(stone: unknown): string {
  const text = stonePoint(stone);
  if (!text) return "";
  if (text === "porphyry") return "first";
  if (text === "marble") return "second";
  if (text === "serpent") return "third";
  return "fourth";
}

/** Signed distance from one stone to another along the bench. */
export function stoneGap(from: unknown, to: unknown): number | null {
  const left = stoneIndex(stonePoint(from));
  const right = stoneIndex(stonePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function ivoryQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(cosmatiGround(ground));
}

/** A pair course is 3. One and five are not a pair. */
export function midCourse(course: unknown): boolean {
  return courseCount(course) === 3;
}

/** A full course is 5. */
export function fullCourse(course: unknown): boolean {
  return courseCount(course) === 5;
}

export function activeStone(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return stonePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = cosmatiHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = cosmatiGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeCourse(raw: unknown): string {
  const coat = courseCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveCosmatiFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the bench uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestCosmatiGround(cards: readonly Cosmati[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "bench") || !card.ground) continue;
    counts.set(card.ground, (counts.get(card.ground) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const ground of ["IVORY", "GRAPHITE", "CHAMPAGNE"]) {
    const count = counts.get(ground) || 0;
    if (count < score) {
      best = ground;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest four. Before twelve, suggest eight. Before eighteen, suggest twelve. Later, suggest sixteen. A saved hour on the bench wins, and a tie keeps the shorter hour. */
export function suggestCosmatiHour(cards: readonly Cosmati[], hour: number): 6 | 9 | 12 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "bench") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 6 | 9 | 12 | 15 = 6;
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
  if (hour < 7) return 6;
  if (hour < 13) return 9;
  if (hour < 19) return 12;
  return 15;
}

export function suggestStone(hour: number): CosmatiStone {
  if (hour < 7) return "porphyry";
  if (hour < 13) return "marble";
  if (hour < 19) return "serpent";
  return "slate";
}

/** The hand with the fewest unraised bands on the bench. A tie keeps the roster order. */
export function fairHand(cards: readonly Cosmati[], roster: string): string {
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

export function readCosmatiList(raw: unknown): Cosmati[] {
  if (!Array.isArray(raw)) return [];
  const out: Cosmati[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Cosmati>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      stone: stonePoint(row.stone),
      hour: cosmatiHour(row.hour),
      ground: cosmatiGround(row.ground),
      course: courseCount(row.course) ?? 1,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      trayed: row.trayed === true,
      vaulted: row.vaulted === true,
      pinned: row.pinned === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addCosmati(
  cards: readonly Cosmati[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    stone?: string;
    hour?: unknown;
    ground?: string;
    course?: unknown;
    tags?: unknown;
  },
): Cosmati[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCosmatiList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      stone: stonePoint(card.stone),
      hour: cosmatiHour(card.hour),
      ground: cosmatiGround(card.ground),
      course: courseCount(card.course) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      trayed: false,
      vaulted: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Cosmati[], id: string, edit: (card: Cosmati) => Cosmati): Cosmati[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCosmati(cards: readonly Cosmati[], id: string, title: string): Cosmati[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCosmatiNote(cards: readonly Cosmati[], id: string, note: string): Cosmati[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(cosmatiGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setCosmatiGround(cards: readonly Cosmati[], id: string, ground: string): Cosmati[] {
  const next = cosmatiGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setCosmatiRaised(cards: readonly Cosmati[], id: string, raised: boolean): Cosmati[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setCosmatiRack(cards: readonly Cosmati[], id: string, trayed: boolean): Cosmati[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, vaulted: trayed ? false : card.vaulted, audit: trayed ? "tray" : "return" }));
}

export function setCosmatiVault(cards: readonly Cosmati[], id: string, vaulted: boolean): Cosmati[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, trayed: vaulted ? false : card.trayed, audit: vaulted ? "vault" : "open" }));
}

export function setCosmatiPin(cards: readonly Cosmati[], id: string, pinned: boolean): Cosmati[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addCosmatiTag(cards: readonly Cosmati[], id: string, tag: string): Cosmati[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 6 | 9 | 12 | 15 {
  if (hour === null) return dir > 0 ? 6 : 15;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepCourse(course: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = courseIndex(course);
  const next = index < 0 ? 0 : (index + dir + COURSE_CYCLE.length) % COURSE_CYCLE.length;
  return COURSE_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseCourseFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return mapCard(cards, id, (card) => ({ ...card, course: stepCourse(card.course, 1), audit: "course" }));
}

export function lowerCourseFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return mapCard(cards, id, (card) => ({ ...card, course: stepCourse(card.course, -1), audit: "course" }));
}

export function setCosmatiFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackCosmatiFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return setCosmatiRack(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function pinCosmatiFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  return setCosmatiPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function groundFocused(cards: readonly Cosmati[], id: string): Cosmati[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCosmatiGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Cosmati[], ids: readonly string[], edit: (card: Cosmati) => Cosmati): Cosmati[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCosmatiIvory(cards: readonly Cosmati[], ids: readonly string[]): Cosmati[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkCosmatiLift(cards: readonly Cosmati[], ids: readonly string[]): Cosmati[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkCosmatiVault(cards: readonly Cosmati[], ids: readonly string[]): Cosmati[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, trayed: false, audit: "vault" }));
}

export function bulkCosmatiTag(cards: readonly Cosmati[], ids: readonly string[]): Cosmati[] {
  return bulk(cards, ids, (card) => (card.tags.includes("p") ? card : { ...card, tags: tagsOf([...card.tags, "p"]), audit: "tag" }));
}

export function readCosmatiViews(raw: unknown): CosmatiView[] {
  if (!Array.isArray(raw)) return [];
  const out: CosmatiView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CosmatiView>;
    const id = snip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      rack: rackOf(row.rack),
      query: snip(row.query, 40),
      hand: snip(row.hand, 24),
      ground: activeGround(row.ground, ["IVORY", "GRAPHITE", "CHAMPAGNE"]),
      stone: activeStone(row.stone),
      hour: activeHour(row.hour),
      course: activeCourse(row.course),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCosmatiView(views: readonly CosmatiView[], view: CosmatiView): CosmatiView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCosmatiViews([...views, { ...view, name }]);
}

export function dropCosmatiView(views: readonly CosmatiView[], id: string): CosmatiView[] {
  return views.filter((view) => view.id !== id);
}

export function cosmatiDensity(raw: unknown): CosmatiDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortCosmatiList(cards: readonly Cosmati[], sort: CosmatiSort): Cosmati[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const stone = stoneIndex(a.stone) - stoneIndex(b.stone);
      if (stone) return stone;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleCosmatiList(
  cards: readonly Cosmati[],
  rack: CosmatiRack,
  query: string,
  hand: string,
  ground: string,
  stone: string,
  hour: string,
  course: string,
): Cosmati[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : cosmatiGround(ground);
  const wantStone = activeStone(stone);
  const wantHour = activeHour(hour);
  const wantCourse = activeCourse(course);
  return cards.filter((card) => {
    if (!inRack(card, rack)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantStone === "warm" && !stoneWarm(card.stone)) return false;
    if (wantStone === "cool" && !stoneCool(card.stone)) return false;
    if (wantStone !== "all" && wantStone !== "warm" && wantStone !== "cool" && card.stone !== wantStone) return false;
    if (wantHour !== "all" && String(card.hour ?? "") !== wantHour) return false;
    if (wantCourse !== "all" && String(card.course) !== wantCourse) return false;
    return true;
  });
}

/** Slate on course one, still not raised and not in the vault, is overdue. */
export function overdueCosmati(card: Cosmati): boolean {
  return card.stone === "slate" && card.course === 1 && !card.raised && !card.vaulted;
}

/** No ground, six hours, course one, and still on the bench. */
export function idleCosmati(card: Cosmati): boolean {
  return !card.ground && card.hour === 6 && card.course === 1 && !card.raised && !card.trayed && !card.vaulted;
}

/** Champagne, fifteen hours, and a full course, still out of the vault. */
export function briskCosmati(card: Cosmati): boolean {
  return card.ground === "CHAMPAGNE" && card.hour === 15 && card.course === 5 && !card.vaulted;
}

/** Serpent, ivory, and nine hours. */
export function restingCosmati(card: Cosmati): boolean {
  return card.stone === "serpent" && card.ground === "IVORY" && card.hour === 9;
}

/** A porphyry band is late when the station is already slate. */
export function lateCosmati(card: Cosmati, station: string): boolean {
  return card.stone === "porphyry" && stonePoint(station) === "slate" && !card.raised;
}

export function cosmatiCounts(cards: readonly Cosmati[], shown: readonly Cosmati[], station: string): CosmatiCounts {
  return {
    bench: cards.filter((card) => inRack(card, "bench")).length,
    tray: cards.filter((card) => inRack(card, "tray")).length,
    vault: cards.filter((card) => inRack(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => stoneWarm(card.stone)).length,
    cool: cards.filter((card) => stoneCool(card.stone)).length,
    long: cards.filter((card) => card.hour === 16).length,
    quiet: cards.filter((card) => ivoryQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleCosmati).length,
    brisk: cards.filter(briskCosmati).length,
    resting: cards.filter(restingCosmati).length,
    overdue: cards.filter(overdueCosmati).length,
    pair: cards.filter((card) => midCourse(card.course) && lateCosmati(card, station)).length,
  };
}

export function cosmatiBars(cards: readonly Cosmati[]): { stone: string; count: number }[] {
  return CSM_STONES.map((stone) => ({ stone, count: cards.filter((card) => card.stone === stone && !card.vaulted).length }));
}

export function cosmatiTimeline(cards: readonly Cosmati[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "bench"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function cosmatiHands(cards: readonly Cosmati[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Cosmati[]): string {
  const open = cards.filter((card) => inRack(card, "bench") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of cosmatiHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCosmatiList(cards: readonly Cosmati[]): string[] {
  return cards.filter(overdueCosmati).map((card) => card.title);
}

export function cosmatiCopy(card: Cosmati): string {
  return [card.title, card.hand, card.stone, card.ground, card.hour ?? "", card.course, card.note].filter((item) => item !== "").join(" · ");
}

export function cosmatiCsv(cards: readonly Cosmati[], station: string): string {
  const lines = ["title,hand,stone,ground,hours,course,tags,raised,tray,vault,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.stone,
        card.ground,
        card.hour ?? "",
        card.course,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.trayed ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.pinned ? "1" : "0",
        stoneCool(card.stone) ? "1" : "0",
        lateCosmati(card, station) ? "1" : "0",
        idleCosmati(card) ? "1" : "0",
        briskCosmati(card) ? "1" : "0",
        restingCosmati(card) ? "1" : "0",
        overdueCosmati(card) ? "1" : "0",
        stoneWarm(card.stone) ? "1" : "0",
        ivoryQuiet(card.ground) ? "1" : "0",
        stoneBand(card.stone),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const LMP_HIDE_KEY = "crmv4-presence-hide-387";
export const LMP_REVIEW_KEY = "crmv4-presence-review-387";

export type LampLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type LampHue = "" | "gilt" | "pearl" | "ink";
export type LampState = "" | "clear" | "set";
export type LampReview = "all" | "reviewed" | "fresh";
export type LampShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type LampValue = string | { active?: unknown; [key: string]: unknown } | null | undefined;
export type LampRow = { id: string; label: string; code: LampValue; userId?: string };
export type LampLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "pearl", "ink"] as const;
const DUE_TITLES = new Set(["LIVE", "ON", "OPEN", "YES"]);
const SOON_TITLES = new Set(["NEXT", "SOON", "SOFT"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT", "PAUSE"]);
const LATE_TITLES = new Set(["LATE", "COOL"]);
const MISSED_TITLES = new Set(["OFF", "DROP", "BLOCK", "DARK"]);
const BLANK_TITLES = new Set(["NONE", "NULL", "BARE", "VOID"]);

function lampRecord(raw: LampValue): { active?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function lampBlocked(raw: LampValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function lampGiven(raw: LampValue): string {
  const row = lampRecord(raw);
  if (row && !("active" in row)) return "";
  const value = row ? row.active : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "DARK";
  return snip(value, 48);
}

function lampReadable(raw: LampValue): boolean {
  if (lampBlocked(raw)) return false;
  const row = lampRecord(raw);
  if (row && !("active" in row)) return false;
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

export function lampState(raw: LampValue): LampState {
  if (!lampReadable(raw)) return "";
  return lampGiven(raw) ? "set" : "clear";
}

/** A known lamp word maps first. A date today is lit. Within four days ahead is near. Further ahead is far.
 * Younger than three days past fades. Older is dark.
 */
export function lampLane(raw: LampValue, now = Date.now()): LampLane {
  if (lampState(raw) !== "set") return "";
  const text = lampGiven(raw);
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
    if (diff > 0 && diff <= 4 * day) return "soon";
    if (diff > 4 * day) return "far";
    if (now - at < 3 * day) return "late";
    return "missed";
  }
  if (text.length >= 12) return "far";
  if (/^[0-9]/.test(text)) return "late";
  if (/^[aeiou]/i.test(text)) return "soon";
  return "due";
}

export function lampHue(raw: LampValue, now = Date.now()): LampHue {
  const mail = lampLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ink";
  return "pearl";
}

export function lampLit(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "due";
}

export function lampNear(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "soon";
}

export function lampFar(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "far";
}

export function lampFade(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "late";
}

export function lampDark(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "missed";
}

export function lampDim(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "hold";
}

export function lampBlank(raw: LampValue, now = Date.now()): boolean {
  return lampLane(raw, now) === "blank";
}

export function lampOpen(raw: LampValue): boolean {
  return lampState(raw) === "clear";
}

export function lampLength(raw: LampValue): number | null {
  if (lampState(raw) !== "set") return null;
  return lampGiven(raw).length;
}

export function lampEven(raw: LampValue): boolean {
  const length = lampLength(raw);
  return length !== null && length % 2 === 0;
}

export function lampDigit(raw: LampValue): boolean {
  return /[0-9]/.test(lampGiven(raw));
}

export function lampLetter(raw: LampValue): boolean {
  return /[A-Za-z]/.test(lampGiven(raw));
}

export function lampUpper(raw: LampValue): boolean {
  const text = lampGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function lampCopy(raw: LampValue): string {
  return lampGiven(raw);
}

export function lampStamp(raw: LampValue): string {
  const text = lampGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function lampLanes(rows: readonly LampRow[], now = Date.now()): LampLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = lampLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingLamp(rows: readonly LampRow[], now = Date.now()): string {
  const lines = lampLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingLampHue(rows: readonly LampRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = lampHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneLampCount(rows: readonly LampRow[], mail: LampLane, now = Date.now()): number {
  return rows.filter((row) => lampLane(row.code, now) === mail).length;
}

export function lampShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentLampLanes(rows: readonly LampRow[], now = Date.now()): string[] {
  return lampLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenLamp(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedLamp(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleLamp(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleLampReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkLampReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleLampLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: LampValue, shape: LampShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return lampOpen(raw);
  if (shape === "digit") return lampDigit(raw);
  if (shape === "letter") return lampLetter(raw);
  if (shape === "even") return lampEven(raw);
  if (shape === "upper") return lampUpper(raw);
  return lampLane(raw, now) === shape;
}

export function visibleLamp(
  rows: readonly LampRow[],
  mail: string,
  hue: string,
  query: string,
  review: LampReview,
  reviewed: readonly string[],
  shape: LampShape,
  now = Date.now(),
): LampRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = lampLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && lampHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${lampCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function lampLanesCsv(rows: readonly LampRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of lampLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function lampRowsCsv(rows: readonly LampRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,lamp,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(lampCopy(row.code)), lampLane(row.code, now), lampHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
