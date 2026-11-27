/**
 * Pastiglia bosses kept in this browser,
 * and cera slips read the city already stored on the account.
 * Materials are gesso, chalk, bole, and gilt. Grounds are ivory, graphite, and champagne.
 * Hours are 4, 8, 12, or 16. Lifts are 1, 3, or 6.
 * Gesso and chalk are the warm half. Bole and gilt are the cool half.
 * Ivory is the quiet ground.
 * A city date today is due. Within two days ahead is soon. Further ahead is far.
 * A city date younger than four days past is late. Older than that is missed.
 * Home, desk, live, and open are due. Next, soon, and warm are soon. Park, still, and pause hold.
 * Old and dust are late. Lost, away, quiet, and void are missed. None, dash, empty, and clear stay blank.
 * A true city reads as HOME. A false city reads as VOID.
 * Money fields are not read. The slip does not change the saved city.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_pastiglia_boss (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   material text not null default '',
 *   hour_mark integer,
 *   ground text not null default '',
 *   lift integer not null default 1,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   moulded boolean not null default false,
 *   chested boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_cera_slip_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_cera_slip_review (
 *   trader_id text primary key
 * );
 */
export const PSG_KEY = "crmv4-pastiglia-389";
export const PSG_VIEW_KEY = "crmv4-pastiglia-views-389";
export const PSG_DENSITY_KEY = "crmv4-pastiglia-density-389";
export const PSG_MATERIALS = ["gesso", "chalk", "bole", "gilt"] as const;

export type PastigliaMaterial = (typeof PSG_MATERIALS)[number];
export type PastigliaGround = "blank" | "ivory" | "graphite" | "champagne";
export type PastigliaRack = "panel" | "mould" | "chest";
export type PastigliaDensity = "open" | "tight";
export type PastigliaSort = "material" | "hand";

export type Pastiglia = {
  id: string;
  title: string;
  note: string;
  hand: string;
  material: string;
  hour: number | null;
  ground: string;
  lift: number;
  tags: string[];
  raised: boolean;
  moulded: boolean;
  chested: boolean;
  pinned: boolean;
  audit: string;
};

export type PastigliaView = {
  id: string;
  name: string;
  rack: PastigliaRack;
  query: string;
  hand: string;
  ground: string;
  material: string;
  hour: string;
  lift: string;
};

export type PastigliaCounts = {
  panel: number;
  mould: number;
  chest: number;
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

export const ROUND389_FEATURES = [
  "pastiglia-save",
  "pastiglia-reminders",
  "pastiglia-materials",
  "pastiglia-search",
  "pastiglia-hour-sla",
  "pastiglia-chest",
  "pastiglia-pin",
  "pastiglia-inline-title",
  "pastiglia-filters",
  "saved-pastiglia-views",
  "pastiglia-density",
  "pastiglia-focus",
  "pastiglia-kpis",
  "pastiglia-chart",
  "pastiglia-timeline",
  "pastiglia-bulk",
  "pastiglia-csv",
  "pastiglia-keys",
  "pastiglia-audit",
  "fewest-panel-hand",
  "pastiglia-viewer",
  "suggest-pastiglia",
  "overdue-gilt",
  "cera-slips",
  "cera-slip-csv",
] as const

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "mould", "return", "chest", "open", "tag", "lift", "hour", "lower", "pin"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [4, 8, 12, 16] as const;
const LIFT_CYCLE = [1, 3, 6] as const;
const WARM = new Set(["gesso", "chalk"]);
const COOL = new Set(["bole", "gilt"]);
const QUIET_GROUND = new Set(["IVORY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 14;
const VIEW_CAP = 4;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): PastigliaRack {
  return raw === "mould" || raw === "chest" ? raw : "panel";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<PastigliaGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<PastigliaGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[pq]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Pastiglia, rack: PastigliaRack): boolean {
  if (rack === "mould") return card.moulded && !card.chested;
  if (rack === "chest") return card.chested;
  return !card.moulded && !card.chested;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function materialIndex(pigment: string): number {
  return PSG_MATERIALS.indexOf(pigment as PastigliaMaterial);
}

function hourIndex(hour: number): number {
  return HOUR_CYCLE.indexOf(hour as (typeof HOUR_CYCLE)[number]);
}

function liftIndex(course: number): number {
  return LIFT_CYCLE.indexOf(course as (typeof LIFT_CYCLE)[number]);
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

export function materialPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (PSG_MATERIALS as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 12, or 16. Anything else stays blank. */
export function pastigliaHour(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A lift count is 1, 3, or 6. Anything else stays blank. */
export function liftCount(raw: unknown): 1 | 3 | 6 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "6") return null;
  return Number(text) as 1 | 3 | 6;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function pastigliaGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function materialWarm(metal: unknown): boolean {
  return WARM.has(snip(metal, 12).toLowerCase());
}

export function materialCool(metal: unknown): boolean {
  return COOL.has(snip(metal, 12).toLowerCase());
}

/** Gesso is first. Chalk is second. Bole is third. Gilt is fourth. */
export function materialBand(pigment: unknown): string {
  const text = materialPoint(pigment);
  if (!text) return "";
  if (text === "gesso") return "first";
  if (text === "chalk") return "second";
  if (text === "bole") return "third";
  return "fourth";
}

/** Signed distance from one material to another along the panel. */
export function materialGap(from: unknown, to: unknown): number | null {
  const left = materialIndex(materialPoint(from));
  const right = materialIndex(materialPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function ivoryQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(pastigliaGround(ground));
}

/** A pair lift is 3. One and six are not a pair. */
export function midLift(lift: unknown): boolean {
  return liftCount(lift) === 3;
}

/** A full lift is 6. */
export function fullLift(lift: unknown): boolean {
  return liftCount(lift) === 6;
}

export function activeMaterial(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return materialPoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = pastigliaHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = pastigliaGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeLift(raw: unknown): string {
  const coat = liftCount(raw);
  return coat === null ? "all" : String(coat);
}

export function movePastigliaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the panel uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestPastigliaGround(cards: readonly Pastiglia[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inRack(card, "panel") || !card.ground) continue;
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

/** Before six, suggest four. Before twelve, suggest eight. Before eighteen, suggest twelve. Later, suggest sixteen. A saved hour on the panel wins, and a tie keeps the shorter hour. */
export function suggestPastigliaHour(cards: readonly Pastiglia[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "panel") || card.hour === null) continue;
    seen = true;
    counts.set(card.hour, (counts.get(card.hour) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 16 = 4;
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
  if (hour < 6) return 4;
  if (hour < 12) return 8;
  if (hour < 18) return 12;
  return 16;
}

export function suggestMaterial(hour: number): PastigliaMaterial {
  if (hour < 6) return "gesso";
  if (hour < 12) return "chalk";
  if (hour < 18) return "bole";
  return "gilt";
}

/** The hand with the fewest unraised bosses on the panel. A tie keeps the roster order. */
export function fairHand(cards: readonly Pastiglia[], roster: string): string {
  const names = roster.split(",").map((item) => snip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inRack(card, "panel") && !card.raised);
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

export function readPastigliaList(raw: unknown): Pastiglia[] {
  if (!Array.isArray(raw)) return [];
  const out: Pastiglia[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Pastiglia>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      material: materialPoint(row.material),
      hour: pastigliaHour(row.hour),
      ground: pastigliaGround(row.ground),
      lift: liftCount(row.lift) ?? 1,
      tags: tagsOf(row.tags),
      raised: row.raised === true,
      moulded: row.moulded === true,
      chested: row.chested === true,
      pinned: row.pinned === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addPastiglia(
  cards: readonly Pastiglia[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    material?: string;
    hour?: unknown;
    ground?: string;
    lift?: unknown;
    tags?: unknown;
  },
): Pastiglia[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readPastigliaList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      material: materialPoint(card.material),
      hour: pastigliaHour(card.hour),
      ground: pastigliaGround(card.ground),
      lift: liftCount(card.lift) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      moulded: false,
      chested: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Pastiglia[], id: string, edit: (card: Pastiglia) => Pastiglia): Pastiglia[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editPastiglia(cards: readonly Pastiglia[], id: string, title: string): Pastiglia[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editPastigliaNote(cards: readonly Pastiglia[], id: string, note: string): Pastiglia[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(pastigliaGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setPastigliaGround(cards: readonly Pastiglia[], id: string, ground: string): Pastiglia[] {
  const next = pastigliaGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setPastigliaRaised(cards: readonly Pastiglia[], id: string, raised: boolean): Pastiglia[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setPastigliaRack(cards: readonly Pastiglia[], id: string, moulded: boolean): Pastiglia[] {
  return mapCard(cards, id, (card) => (card.moulded === moulded ? card : { ...card, moulded, chested: moulded ? false : card.chested, audit: moulded ? "mould" : "return" }));
}

export function setPastigliaChest(cards: readonly Pastiglia[], id: string, chested: boolean): Pastiglia[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, moulded: chested ? false : card.moulded, audit: chested ? "chest" : "open" }));
}

export function setPastigliaPin(cards: readonly Pastiglia[], id: string, pinned: boolean): Pastiglia[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addPastigliaTag(cards: readonly Pastiglia[], id: string, tag: string): Pastiglia[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepHour(hour: number | null, dir: 1 | -1): 4 | 8 | 12 | 16 {
  if (hour === null) return dir > 0 ? 4 : 16;
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

function stepLift(lift: number, dir: 1 | -1): 1 | 3 | 6 {
  const index = liftIndex(lift);
  const next = index < 0 ? 0 : (index + dir + LIFT_CYCLE.length) % LIFT_CYCLE.length;
  return LIFT_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseLiftFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return mapCard(cards, id, (card) => ({ ...card, lift: stepLift(card.lift, 1), audit: "lift" }));
}

export function lowerLiftFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return mapCard(cards, id, (card) => ({ ...card, lift: stepLift(card.lift, -1), audit: "lift" }));
}

export function setPastigliaFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackPastigliaFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return setPastigliaRack(cards, id, !cards.find((card) => card.id === id)?.moulded);
}

export function pinPastigliaFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  return setPastigliaPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function groundFocused(cards: readonly Pastiglia[], id: string): Pastiglia[] {
  const card = cards.find((item) => item.id === id);
  return card ? setPastigliaGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Pastiglia[], ids: readonly string[], edit: (card: Pastiglia) => Pastiglia): Pastiglia[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkPastigliaIvory(cards: readonly Pastiglia[], ids: readonly string[]): Pastiglia[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkPastigliaRaise(cards: readonly Pastiglia[], ids: readonly string[]): Pastiglia[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkPastigliaChest(cards: readonly Pastiglia[], ids: readonly string[]): Pastiglia[] {
  return bulk(cards, ids, (card) => (card.chested ? card : { ...card, chested: true, moulded: false, audit: "chest" }));
}

export function bulkPastigliaTag(cards: readonly Pastiglia[], ids: readonly string[]): Pastiglia[] {
  return bulk(cards, ids, (card) => (card.tags.includes("p") ? card : { ...card, tags: tagsOf([...card.tags, "p"]), audit: "tag" }));
}

export function readPastigliaViews(raw: unknown): PastigliaView[] {
  if (!Array.isArray(raw)) return [];
  const out: PastigliaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PastigliaView>;
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
      material: activeMaterial(row.material),
      hour: activeHour(row.hour),
      lift: activeLift(row.lift),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addPastigliaView(views: readonly PastigliaView[], view: PastigliaView): PastigliaView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readPastigliaViews([...views, { ...view, name }]);
}

export function dropPastigliaView(views: readonly PastigliaView[], id: string): PastigliaView[] {
  return views.filter((view) => view.id !== id);
}

export function pastigliaDensity(raw: unknown): PastigliaDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortPastigliaList(cards: readonly Pastiglia[], sort: PastigliaSort): Pastiglia[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const material = materialIndex(a.material) - materialIndex(b.material);
      if (material) return material;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visiblePastigliaList(
  cards: readonly Pastiglia[],
  rack: PastigliaRack,
  query: string,
  hand: string,
  ground: string,
  pigment: string,
  hour: string,
  course: string,
): Pastiglia[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : pastigliaGround(ground);
  const wantPigment = activeMaterial(pigment);
  const wantHour = activeHour(hour);
  const wantCourse = activeLift(course);
  return cards.filter((card) => {
    if (!inRack(card, rack)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantPigment === "warm" && !materialWarm(card.material)) return false;
    if (wantPigment === "cool" && !materialCool(card.material)) return false;
    if (wantPigment !== "all" && wantPigment !== "warm" && wantPigment !== "cool" && card.material !== wantPigment) return false;
    if (wantHour !== "all" && String(card.hour ?? "") !== wantHour) return false;
    if (wantCourse !== "all" && String(card.lift) !== wantCourse) return false;
    return true;
  });
}

/** Gilt on lift one, still not raised and not in the chest, is overdue. */
export function overduePastiglia(card: Pastiglia): boolean {
  return card.material === "gilt" && card.lift === 1 && !card.raised && !card.chested;
}

/** No ground, four hours, lift one, and still on the panel. */
export function idlePastiglia(card: Pastiglia): boolean {
  return !card.ground && card.hour === 4 && card.lift === 1 && !card.raised && !card.moulded && !card.chested;
}

/** Graphite, sixteen hours, and a full lift, still out of the chest. */
export function briskPastiglia(card: Pastiglia): boolean {
  return card.ground === "GRAPHITE" && card.hour === 16 && card.lift === 6 && !card.chested;
}

/** Bole, ivory, and eight hours. */
export function restingPastiglia(card: Pastiglia): boolean {
  return card.material === "bole" && card.ground === "IVORY" && card.hour === 8;
}

/** A gesso boss is late when the station is already gilt. */
export function latePastiglia(card: Pastiglia, station: string): boolean {
  return card.material === "gesso" && materialPoint(station) === "gilt" && !card.raised;
}

export function pastigliaCounts(cards: readonly Pastiglia[], shown: readonly Pastiglia[], station: string): PastigliaCounts {
  return {
    panel: cards.filter((card) => inRack(card, "panel")).length,
    mould: cards.filter((card) => inRack(card, "mould")).length,
    chest: cards.filter((card) => inRack(card, "chest")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => materialWarm(card.material)).length,
    cool: cards.filter((card) => materialCool(card.material)).length,
    long: cards.filter((card) => card.hour === 16).length,
    quiet: cards.filter((card) => ivoryQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idlePastiglia).length,
    brisk: cards.filter(briskPastiglia).length,
    resting: cards.filter(restingPastiglia).length,
    overdue: cards.filter(overduePastiglia).length,
    pair: cards.filter((card) => midLift(card.lift) && latePastiglia(card, station)).length,
  };
}

export function pastigliaBars(cards: readonly Pastiglia[]): { material: string; count: number }[] {
  return PSG_MATERIALS.map((material) => ({ material, count: cards.filter((card) => card.material === material && !card.chested).length }));
}

export function pastigliaTimeline(cards: readonly Pastiglia[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "panel"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function pastigliaHands(cards: readonly Pastiglia[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Pastiglia[]): string {
  const open = cards.filter((card) => inRack(card, "panel") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of pastigliaHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderPastigliaList(cards: readonly Pastiglia[]): string[] {
  return cards.filter(overduePastiglia).map((card) => card.title);
}

export function pastigliaCopy(card: Pastiglia): string {
  return [card.title, card.hand, card.material, card.ground, card.hour ?? "", card.lift, card.note].filter((item) => item !== "").join(" · ");
}

export function pastigliaCsv(cards: readonly Pastiglia[], station: string): string {
  const lines = ["title,hand,material,ground,hours,lift,tags,raised,mould,chest,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.material,
        card.ground,
        card.hour ?? "",
        card.lift,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.moulded ? "1" : "0",
        card.chested ? "1" : "0",
        card.pinned ? "1" : "0",
        materialCool(card.material) ? "1" : "0",
        latePastiglia(card, station) ? "1" : "0",
        idlePastiglia(card) ? "1" : "0",
        briskPastiglia(card) ? "1" : "0",
        restingPastiglia(card) ? "1" : "0",
        overduePastiglia(card) ? "1" : "0",
        materialWarm(card.material) ? "1" : "0",
        ivoryQuiet(card.ground) ? "1" : "0",
        materialBand(card.material),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const CSL_HIDE_KEY = "crmv4-cera-hide-389";
export const CSL_REVIEW_KEY = "crmv4-cera-review-389";

export type SlipLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type SlipHue = "" | "gilt" | "ash" | "pearl";
export type SlipState = "" | "clear" | "set";
export type SlipReview = "all" | "reviewed" | "fresh";
export type SlipShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type SlipValue = string | { city?: unknown; [key: string]: unknown } | null | undefined;
export type SlipRow = { id: string; label: string; code: SlipValue; userId?: string };
export type SlipLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "ash", "pearl"] as const;
const DUE_TITLES = new Set(["HOME", "DESK", "LIVE", "OPEN"]);
const SOON_TITLES = new Set(["NEXT", "SOON", "WARM"]);
const HOLD_TITLES = new Set(["PARK", "STILL", "PAUSE"]);
const LATE_TITLES = new Set(["OLD", "DUST"]);
const MISSED_TITLES = new Set(["LOST", "AWAY", "QUIET", "VOID"]);
const BLANK_TITLES = new Set(["NONE", "DASH", "EMPTY", "CLEAR"]);

function slipRecord(raw: SlipValue): { city?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function slipBlocked(raw: SlipValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function slipGiven(raw: SlipValue): string {
  const row = slipRecord(raw);
  if (row && !("city" in row)) return "";
  const value = row ? row.city : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOME";
  if (value === false || value === "false" || value === "0" || value === 0) return "VOID";
  return snip(value, 48);
}

function slipReadable(raw: SlipValue): boolean {
  if (slipBlocked(raw)) return false;
  const row = slipRecord(raw);
  if (row && !("city" in row)) return false;
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

export function slipState(raw: SlipValue): SlipState {
  if (!slipReadable(raw)) return "";
  return slipGiven(raw) ? "set" : "clear";
}

/** A known city word maps first. A date today is due. Within two days ahead is soon. Further ahead is far.
 * Younger than four days past is late. Older is missed.
 */
export function slipLane(raw: SlipValue, now = Date.now()): SlipLane {
  if (slipState(raw) !== "set") return "";
  const text = slipGiven(raw);
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
  if (/^[0-9]/.test(text)) return "hold";
  if (/^[aeiou]/i.test(text)) return "due";
  return "soon";
}

export function slipHue(raw: SlipValue, now = Date.now()): SlipHue {
  const mail = slipLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "far") return "gilt";
  if (mail === "late" || mail === "missed") return "ash";
  return "pearl";
}

export function slipLit(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "due";
}

export function slipNear(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "soon";
}

export function slipFar(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "far";
}

export function slipFade(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "late";
}

export function slipDark(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "missed";
}

export function slipDim(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "hold";
}

export function slipBlank(raw: SlipValue, now = Date.now()): boolean {
  return slipLane(raw, now) === "blank";
}

export function slipOpen(raw: SlipValue): boolean {
  return slipState(raw) === "clear";
}

export function slipLength(raw: SlipValue): number | null {
  if (slipState(raw) !== "set") return null;
  return slipGiven(raw).length;
}

export function slipEven(raw: SlipValue): boolean {
  const length = slipLength(raw);
  return length !== null && length % 2 === 0;
}

export function slipDigit(raw: SlipValue): boolean {
  return /[0-9]/.test(slipGiven(raw));
}

export function slipLetter(raw: SlipValue): boolean {
  return /[A-Za-z]/.test(slipGiven(raw));
}

export function slipUpper(raw: SlipValue): boolean {
  const text = slipGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function slipCopy(raw: SlipValue): string {
  return slipGiven(raw);
}

export function slipStamp(raw: SlipValue): string {
  const text = slipGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function slipLanes(rows: readonly SlipRow[], now = Date.now()): SlipLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = slipLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingSlip(rows: readonly SlipRow[], now = Date.now()): string {
  const lines = slipLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingSlipHue(rows: readonly SlipRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = slipHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneSlipCount(rows: readonly SlipRow[], mail: SlipLane, now = Date.now()): number {
  return rows.filter((row) => slipLane(row.code, now) === mail).length;
}

export function slipShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSlipLanes(rows: readonly SlipRow[], now = Date.now()): string[] {
  return slipLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenSlip(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedSlip(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleSlip(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleSlipReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSlipReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSlipLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: SlipValue, shape: SlipShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return slipOpen(raw);
  if (shape === "digit") return slipDigit(raw);
  if (shape === "letter") return slipLetter(raw);
  if (shape === "even") return slipEven(raw);
  if (shape === "upper") return slipUpper(raw);
  return slipLane(raw, now) === shape;
}

export function visibleSlip(
  rows: readonly SlipRow[],
  mail: string,
  hue: string,
  query: string,
  review: SlipReview,
  reviewed: readonly string[],
  shape: SlipShape,
  now = Date.now(),
): SlipRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = slipLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && slipHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${slipCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function slipLanesCsv(rows: readonly SlipRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of slipLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function slipRowsCsv(rows: readonly SlipRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,city,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(slipCopy(row.code)), slipLane(row.code, now), slipHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
