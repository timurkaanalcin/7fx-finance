/**
 * Giornata patches kept in this browser,
 * and silence dials read the last contact already stored on the account.
 * Pigments are lime, sand, umber, and soot. Grounds are ivory, graphite, and champagne.
 * Hours are 3, 7, 11, or 14. Coats are 2, 4, or 8.
 * Lime and sand are the warm half. Umber and soot are the cool half.
 * Champagne is the quiet ground.
 * A contact date today is due. Within one day ahead is soon. Further ahead is far.
 * A contact date younger than six days past is late. Older than that is missed.
 * Now, here, call, and yes are due. Later, pending, and soft are soon. Hold, wait, and queue hold.
 * Stale and cool are late. Gone, drop, silent, and cold are missed. Empty, nil, blank, and clear stay blank.
 * A true contact reads as NOW. A false contact reads as COLD.
 * Money fields are not read. The dial does not change the saved contact.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_giornata_patch (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   pigment text not null default '',
 *   hour_mark integer,
 *   ground text not null default '',
 *   coat integer not null default 2,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   scaffolded boolean not null default false,
 *   archived boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_silence_dial_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_silence_dial_review (
 *   trader_id text primary key
 * );
 */
export const GIO_KEY = "crmv4-giornata-388";
export const GIO_VIEW_KEY = "crmv4-giornata-views-388";
export const GIO_DENSITY_KEY = "crmv4-giornata-density-388";
export const GIO_PIGMENTS = ["lime", "sand", "umber", "soot"] as const;

export type GiornataPigment = (typeof GIO_PIGMENTS)[number];
export type GiornataGround = "blank" | "ivory" | "graphite" | "champagne";
export type GiornataRack = "wall" | "scaffold" | "archive";
export type GiornataDensity = "open" | "tight";
export type GiornataSort = "pigment" | "hand";

export type Giornata = {
  id: string;
  title: string;
  note: string;
  hand: string;
  pigment: string;
  hour: number | null;
  ground: string;
  course: number;
  tags: string[];
  raised: boolean;
  scaffolded: boolean;
  archived: boolean;
  pinned: boolean;
  audit: string;
};

export type GiornataView = {
  id: string;
  name: string;
  rack: GiornataRack;
  query: string;
  hand: string;
  ground: string;
  pigment: string;
  hour: string;
  course: string;
};

export type GiornataCounts = {
  wall: number;
  scaffold: number;
  archive: number;
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

export const ROUND388_FEATURES = [
  "giornata-save",
  "giornata-reminders",
  "giornata-pigments",
  "giornata-search",
  "giornata-hour-sla",
  "giornata-archive",
  "giornata-pin",
  "giornata-inline-title",
  "giornata-filters",
  "saved-giornata-views",
  "giornata-density",
  "giornata-focus",
  "giornata-kpis",
  "giornata-chart",
  "giornata-timeline",
  "giornata-bulk",
  "giornata-csv",
  "giornata-keys",
  "giornata-audit",
  "fewest-wall-hand",
  "giornata-viewer",
  "suggest-giornata",
  "overdue-soot",
  "silence-dials",
  "silence-dial-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "scaffold", "return", "archive", "open", "tag", "course", "hour", "lower", "pin"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [3, 7, 11, 14] as const;
const COURSE_CYCLE = [2, 4, 8] as const;
const WARM = new Set(["lime", "sand"]);
const COOL = new Set(["umber", "soot"]);
const QUIET_GROUND = new Set(["CHAMPAGNE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 14;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): GiornataRack {
  return raw === "scaffold" || raw === "archive" ? raw : "wall";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<GiornataGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<GiornataGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Giornata, rack: GiornataRack): boolean {
  if (rack === "scaffold") return card.scaffolded && !card.archived;
  if (rack === "archive") return card.archived;
  return !card.scaffolded && !card.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function pigmentIndex(pigment: string): number {
  return GIO_PIGMENTS.indexOf(pigment as GiornataPigment);
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

export function pigmentPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (GIO_PIGMENTS as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 6, 9, 12, or 15. Anything else stays blank. */
export function giornataHour(raw: unknown): 3 | 7 | 11 | 14 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "7" && text !== "11" && text !== "14") return null;
  return Number(text) as 3 | 7 | 11 | 14;
}

/** A course count is 1, 3, or 5. Anything else stays blank. */
export function courseCount(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function giornataGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function pigmentWarm(metal: unknown): boolean {
  return WARM.has(snip(metal, 12).toLowerCase());
}

export function pigmentCool(metal: unknown): boolean {
  return COOL.has(snip(metal, 12).toLowerCase());
}

/** Lime is first. Sand is second. Umber is third. Soot is fourth. */
export function pigmentBand(pigment: unknown): string {
  const text = pigmentPoint(pigment);
  if (!text) return "";
  if (text === "lime") return "first";
  if (text === "sand") return "second";
  if (text === "umber") return "third";
  return "fourth";
}

/** Signed distance from one pigment to another along the wall. */
export function pigmentGap(from: unknown, to: unknown): number | null {
  const left = pigmentIndex(pigmentPoint(from));
  const right = pigmentIndex(pigmentPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function champagneQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(giornataGround(ground));
}

/** A pair coat is 4. Two and eight are not a pair. */
export function midCourse(course: unknown): boolean {
  return courseCount(course) === 4;
}

/** A full coat is 8. */
export function fullCourse(course: unknown): boolean {
  return courseCount(course) === 8;
}

export function activePigment(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return pigmentPoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = giornataHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = giornataGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeCourse(raw: unknown): string {
  const coat = courseCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveGiornataFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the wall uses least. A tie keeps champagne, then ivory, then graphite. */
export function suggestGiornataGround(cards: readonly Giornata[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "wall") || !card.ground) continue;
    counts.set(card.ground, (counts.get(card.ground) || 0) + 1);
  }
  let best = "CHAMPAGNE";
  let score = Number.POSITIVE_INFINITY;
  for (const ground of ["CHAMPAGNE", "IVORY", "GRAPHITE"]) {
    const count = counts.get(ground) || 0;
    if (count < score) {
      best = ground;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest three. Before ten, suggest seven. Before sixteen, suggest eleven. Later, suggest fourteen. A saved hour on the wall wins, and a tie keeps the shorter hour. */
export function suggestGiornataHour(cards: readonly Giornata[], hour: number): 3 | 7 | 11 | 14 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "wall") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 7 | 11 | 14 = 3;
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
  if (hour < 5) return 3;
  if (hour < 10) return 7;
  if (hour < 16) return 11;
  return 14;
}

export function suggestPigment(hour: number): GiornataPigment {
  if (hour < 5) return "lime";
  if (hour < 10) return "sand";
  if (hour < 16) return "umber";
  return "soot";
}

/** The hand with the fewest unraised bands on the wall. A tie keeps the roster order. */
export function fairHand(cards: readonly Giornata[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inRack(card, "wall") && !card.raised);
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

export function readGiornataList(raw: unknown): Giornata[] {
  if (!Array.isArray(raw)) return [];
  const out: Giornata[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Giornata>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      pigment: pigmentPoint(row.pigment),
      hour: giornataHour(row.hour),
      ground: giornataGround(row.ground),
      course: courseCount(row.course) ?? 2,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      scaffolded: row.scaffolded === true,
      archived: row.archived === true,
      pinned: row.pinned === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addGiornata(
  cards: readonly Giornata[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    pigment?: string;
    hour?: unknown;
    ground?: string;
    course?: unknown;
    tags?: unknown;
  },
): Giornata[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGiornataList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      pigment: pigmentPoint(card.pigment),
      hour: giornataHour(card.hour),
      ground: giornataGround(card.ground),
      course: courseCount(card.course) ?? 2,
      tags: tagsOf(card.tags),
      raised: false,
      scaffolded: false,
      archived: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Giornata[], id: string, edit: (card: Giornata) => Giornata): Giornata[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGiornata(cards: readonly Giornata[], id: string, title: string): Giornata[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGiornataNote(cards: readonly Giornata[], id: string, note: string): Giornata[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(giornataGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setGiornataGround(cards: readonly Giornata[], id: string, ground: string): Giornata[] {
  const next = giornataGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setGiornataRaised(cards: readonly Giornata[], id: string, raised: boolean): Giornata[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setGiornataRack(cards: readonly Giornata[], id: string, scaffolded: boolean): Giornata[] {
  return mapCard(cards, id, (card) => (card.scaffolded === scaffolded ? card : { ...card, scaffolded, archived: scaffolded ? false : card.archived, audit: scaffolded ? "scaffold" : "return" }));
}

export function setGiornataArchive(cards: readonly Giornata[], id: string, archived: boolean): Giornata[] {
  return mapCard(cards, id, (card) => (card.archived === archived ? card : { ...card, archived, scaffolded: archived ? false : card.scaffolded, audit: archived ? "archive" : "open" }));
}

export function setGiornataPin(cards: readonly Giornata[], id: string, pinned: boolean): Giornata[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addGiornataTag(cards: readonly Giornata[], id: string, tag: string): Giornata[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 3 | 7 | 11 | 14 {
  if (hour === null) return dir > 0 ? 3 : 14;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepCourse(course: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = courseIndex(course);
  const next = index < 0 ? 0 : (index + dir + COURSE_CYCLE.length) % COURSE_CYCLE.length;
  return COURSE_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseCourseFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return mapCard(cards, id, (card) => ({ ...card, course: stepCourse(card.course, 1), audit: "course" }));
}

export function lowerCourseFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return mapCard(cards, id, (card) => ({ ...card, course: stepCourse(card.course, -1), audit: "course" }));
}

export function setGiornataFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackGiornataFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return setGiornataRack(cards, id, !cards.find((card) => card.id === id)?.scaffolded);
}

export function pinGiornataFocused(cards: readonly Giornata[], id: string): Giornata[] {
  return setGiornataPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function groundFocused(cards: readonly Giornata[], id: string): Giornata[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGiornataGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Giornata[], ids: readonly string[], edit: (card: Giornata) => Giornata): Giornata[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGiornataIvory(cards: readonly Giornata[], ids: readonly string[]): Giornata[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkGiornataLift(cards: readonly Giornata[], ids: readonly string[]): Giornata[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkGiornataArchive(cards: readonly Giornata[], ids: readonly string[]): Giornata[] {
  return bulk(cards, ids, (card) => (card.archived ? card : { ...card, archived: true, scaffolded: false, audit: "archive" }));
}

export function bulkGiornataTag(cards: readonly Giornata[], ids: readonly string[]): Giornata[] {
  return bulk(cards, ids, (card) => (card.tags.includes("a") ? card : { ...card, tags: tagsOf([...card.tags, "a"]), audit: "tag" }));
}

export function readGiornataViews(raw: unknown): GiornataView[] {
  if (!Array.isArray(raw)) return [];
  const out: GiornataView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GiornataView>;
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
      pigment: activePigment(row.pigment),
      hour: activeHour(row.hour),
      course: activeCourse(row.course),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGiornataView(views: readonly GiornataView[], view: GiornataView): GiornataView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGiornataViews([...views, { ...view, name }]);
}

export function dropGiornataView(views: readonly GiornataView[], id: string): GiornataView[] {
  return views.filter((view) => view.id !== id);
}

export function giornataDensity(raw: unknown): GiornataDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortGiornataList(cards: readonly Giornata[], sort: GiornataSort): Giornata[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const pigment = pigmentIndex(a.pigment) - pigmentIndex(b.pigment);
      if (pigment) return pigment;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleGiornataList(
  cards: readonly Giornata[],
  rack: GiornataRack,
  query: string,
  hand: string,
  ground: string,
  pigment: string,
  hour: string,
  course: string,
): Giornata[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : giornataGround(ground);
  const wantPigment = activePigment(pigment);
  const wantHour = activeHour(hour);
  const wantCourse = activeCourse(course);
  return cards.filter((card) => {
    if (!inRack(card, rack)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantPigment === "warm" && !pigmentWarm(card.pigment)) return false;
    if (wantPigment === "cool" && !pigmentCool(card.pigment)) return false;
    if (wantPigment !== "all" && wantPigment !== "warm" && wantPigment !== "cool" && card.pigment !== wantPigment) return false;
    if (wantHour !== "all" && String(card.hour ?? "") !== wantHour) return false;
    if (wantCourse !== "all" && String(card.course) !== wantCourse) return false;
    return true;
  });
}

/** Soot on coat two, still not raised and not in the archive, is overdue. */
export function overdueGiornata(card: Giornata): boolean {
  return card.pigment === "soot" && card.course === 2 && !card.raised && !card.archived;
}

/** No ground, three hours, coat two, and still on the wall. */
export function idleGiornata(card: Giornata): boolean {
  return !card.ground && card.hour === 3 && card.course === 2 && !card.raised && !card.scaffolded && !card.archived;
}

/** Graphite, fourteen hours, and a full coat, still out of the archive. */
export function briskGiornata(card: Giornata): boolean {
  return card.ground === "GRAPHITE" && card.hour === 14 && card.course === 8 && !card.archived;
}

/** Umber, ivory, and nine hours. */
export function restingGiornata(card: Giornata): boolean {
  return card.pigment === "umber" && card.ground === "IVORY" && card.hour === 7;
}

/** A lime band is late when the station is already soot. */
export function lateGiornata(card: Giornata, station: string): boolean {
  return card.pigment === "lime" && pigmentPoint(station) === "soot" && !card.raised;
}

export function giornataCounts(cards: readonly Giornata[], shown: readonly Giornata[], station: string): GiornataCounts {
  return {
    wall: cards.filter((card) => inRack(card, "wall")).length,
    scaffold: cards.filter((card) => inRack(card, "scaffold")).length,
    archive: cards.filter((card) => inRack(card, "archive")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => pigmentWarm(card.pigment)).length,
    cool: cards.filter((card) => pigmentCool(card.pigment)).length,
    long: cards.filter((card) => card.hour === 14).length,
    quiet: cards.filter((card) => champagneQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleGiornata).length,
    brisk: cards.filter(briskGiornata).length,
    resting: cards.filter(restingGiornata).length,
    overdue: cards.filter(overdueGiornata).length,
    pair: cards.filter((card) => midCourse(card.course) && lateGiornata(card, station)).length,
  };
}

export function giornataBars(cards: readonly Giornata[]): { pigment: string; count: number }[] {
  return GIO_PIGMENTS.map((pigment) => ({ pigment, count: cards.filter((card) => card.pigment === pigment && !card.archived).length }));
}

export function giornataTimeline(cards: readonly Giornata[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "wall"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function giornataHands(cards: readonly Giornata[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Giornata[]): string {
  const open = cards.filter((card) => inRack(card, "wall") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of giornataHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGiornataList(cards: readonly Giornata[]): string[] {
  return cards.filter(overdueGiornata).map((card) => card.title);
}

export function giornataCopy(card: Giornata): string {
  return [card.title, card.hand, card.pigment, card.ground, card.hour ?? "", card.course, card.note].filter((item) => item !== "").join(" · ");
}

export function giornataCsv(cards: readonly Giornata[], station: string): string {
  const lines = ["title,hand,pigment,ground,hours,course,tags,raised,scaffold,archive,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.pigment,
        card.ground,
        card.hour ?? "",
        card.course,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.scaffolded ? "1" : "0",
        card.archived ? "1" : "0",
        card.pinned ? "1" : "0",
        pigmentCool(card.pigment) ? "1" : "0",
        lateGiornata(card, station) ? "1" : "0",
        idleGiornata(card) ? "1" : "0",
        briskGiornata(card) ? "1" : "0",
        restingGiornata(card) ? "1" : "0",
        overdueGiornata(card) ? "1" : "0",
        pigmentWarm(card.pigment) ? "1" : "0",
        champagneQuiet(card.ground) ? "1" : "0",
        pigmentBand(card.pigment),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const SLD_HIDE_KEY = "crmv4-silence-hide-388";
export const SLD_REVIEW_KEY = "crmv4-silence-review-388";

export type DialLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type DialHue = "" | "brass" | "mist" | "pitch";
export type DialState = "" | "clear" | "set";
export type DialReview = "all" | "reviewed" | "fresh";
export type DialShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type DialValue = string | { contact?: unknown; [key: string]: unknown } | null | undefined;
export type DialRow = { id: string; label: string; code: DialValue; userId?: string };
export type DialLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["brass", "mist", "pitch"] as const;
const DUE_TITLES = new Set(["NOW", "HERE", "CALL", "YES"]);
const SOON_TITLES = new Set(["LATER", "PENDING", "SOFT"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT", "QUEUE"]);
const LATE_TITLES = new Set(["STALE", "COOL"]);
const MISSED_TITLES = new Set(["GONE", "DROP", "SILENT", "COLD"]);
const BLANK_TITLES = new Set(["EMPTY", "NIL", "BLANK", "CLEAR"]);

function dialRecord(raw: DialValue): { contact?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function dialBlocked(raw: DialValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function dialGiven(raw: DialValue): string {
  const row = dialRecord(raw);
  if (row && !("contact" in row)) return "";
  const value = row ? row.contact : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NOW";
  if (value === false || value === "false" || value === "0" || value === 0) return "COLD";
  return snip(value, 48);
}

function dialReadable(raw: DialValue): boolean {
  if (dialBlocked(raw)) return false;
  const row = dialRecord(raw);
  if (row && !("contact" in row)) return false;
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

export function dialState(raw: DialValue): DialState {
  if (!dialReadable(raw)) return "";
  return dialGiven(raw) ? "set" : "clear";
}

/** A known dial word maps first. A date today is due. Within one day ahead is soon. Further ahead is far.
 * Younger than six days past is late. Older is missed.
 */
export function dialLane(raw: DialValue, now = Date.now()): DialLane {
  if (dialState(raw) !== "set") return "";
  const text = dialGiven(raw);
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
    if (diff > 0 && diff <= 1 * day) return "soon";
    if (diff > 1 * day) return "far";
    if (now - at < 6 * day) return "late";
    return "missed";
  }
  if (text.length >= 16) return "far";
  if (/^[0-9]/.test(text)) return "late";
  if (/^[aeiou]/i.test(text)) return "soon";
  return "due";
}

export function dialHue(raw: DialValue, now = Date.now()): DialHue {
  const mail = dialLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "brass";
  if (mail === "late" || mail === "missed") return "pitch";
  return "mist";
}

export function dialLit(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "due";
}

export function dialNear(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "soon";
}

export function dialFar(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "far";
}

export function dialFade(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "late";
}

export function dialDark(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "missed";
}

export function dialDim(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "hold";
}

export function dialBlank(raw: DialValue, now = Date.now()): boolean {
  return dialLane(raw, now) === "blank";
}

export function dialOpen(raw: DialValue): boolean {
  return dialState(raw) === "clear";
}

export function dialLength(raw: DialValue): number | null {
  if (dialState(raw) !== "set") return null;
  return dialGiven(raw).length;
}

export function dialEven(raw: DialValue): boolean {
  const length = dialLength(raw);
  return length !== null && length % 2 === 0;
}

export function dialDigit(raw: DialValue): boolean {
  return /[0-9]/.test(dialGiven(raw));
}

export function dialLetter(raw: DialValue): boolean {
  return /[A-Za-z]/.test(dialGiven(raw));
}

export function dialUpper(raw: DialValue): boolean {
  const text = dialGiven(raw);
  return text.length >= 8 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function dialCopy(raw: DialValue): string {
  return dialGiven(raw);
}

export function dialStamp(raw: DialValue): string {
  const text = dialGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function dialLanes(rows: readonly DialRow[], now = Date.now()): DialLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = dialLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingDial(rows: readonly DialRow[], now = Date.now()): string {
  const lines = dialLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingDialHue(rows: readonly DialRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = dialHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneDialCount(rows: readonly DialRow[], mail: DialLane, now = Date.now()): number {
  return rows.filter((row) => dialLane(row.code, now) === mail).length;
}

export function dialShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDialLanes(rows: readonly DialRow[], now = Date.now()): string[] {
  return dialLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenDial(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDial(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDial(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleDialReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDialReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDialLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: DialValue, shape: DialShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return dialOpen(raw);
  if (shape === "digit") return dialDigit(raw);
  if (shape === "letter") return dialLetter(raw);
  if (shape === "even") return dialEven(raw);
  if (shape === "upper") return dialUpper(raw);
  return dialLane(raw, now) === shape;
}

export function visibleDial(
  rows: readonly DialRow[],
  mail: string,
  hue: string,
  query: string,
  review: DialReview,
  reviewed: readonly string[],
  shape: DialShape,
  now = Date.now(),
): DialRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = dialLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && dialHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${dialCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function dialLanesCsv(rows: readonly DialRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of dialLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function dialRowsCsv(rows: readonly DialRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,dial,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(dialCopy(row.code)), dialLane(row.code, now), dialHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
