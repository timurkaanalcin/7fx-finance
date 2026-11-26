/**
 * Pietra dura tesserae kept in this browser,
 * and follow calipers read the retention follow-up already stored on the account.
 * Stones are jasper, agate, lapis, and onyx. Grounds are ivory, graphite, and champagne.
 * Hours are 4, 8, 12, or 16. Coats are 1, 2, or 4.
 * Jasper and agate are the warm half. Lapis and onyx are the cool half.
 * Graphite is the quiet ground.
 * A follow-up today is due. Within three days ahead is soon. Further ahead is far.
 * A follow-up younger than two days past is late. Older than that is missed.
 * Due, book, keep, and live are due. Next and soon wait. Hold, wait, and pause hold.
 * Late and soft are late. Lost, drop, and cold are missed. Open, none, null, and bare stay blank.
 * A true follow-up reads as DUE. A false follow-up reads as OPEN.
 * Money fields are not read. The caliper does not change the saved follow-up.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_pietra_tessera (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   stone text not null default '',
 *   hour_mark integer,
 *   ground text not null default '',
 *   coat integer not null default 1,
 *   tags text not null default '',
 *   raised boolean not null default false,
 *   trayed boolean not null default false,
 *   vaulted boolean not null default false,
 *   pinned boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_follow_caliper_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_follow_caliper_review (
 *   trader_id text primary key
 * );
 */

export const TSR_KEY = "crmv4-tessera-385";
export const TSR_VIEW_KEY = "crmv4-tessera-views-385";
export const TSR_DENSITY_KEY = "crmv4-tessera-density-385";
export const TSR_STONES = ["jasper", "agate", "lapis", "onyx"] as const;

export type TesseraStone = (typeof TSR_STONES)[number];
export type TesseraGround = "blank" | "ivory" | "graphite" | "champagne";
export type TesseraRack = "bench" | "tray" | "vault";
export type TesseraDensity = "open" | "tight";
export type TesseraSort = "stone" | "hand";

export type Tessera = {
  id: string;
  title: string;
  note: string;
  hand: string;
  stone: string;
  hour: number | null;
  ground: string;
  coat: number;
  tags: string[];
  raised: boolean;
  trayed: boolean;
  vaulted: boolean;
  pinned: boolean;
  audit: string;
};

export type TesseraView = {
  id: string;
  name: string;
  rack: TesseraRack;
  query: string;
  hand: string;
  ground: string;
  stone: string;
  hour: string;
  coat: string;
};

export type TesseraCounts = {
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

export const ROUND385_FEATURES = [
  "tessera-save",
  "tessera-reminders",
  "tessera-stones",
  "tessera-search",
  "tessera-hour-sla",
  "tessera-vault",
  "tessera-pin",
  "tessera-inline-title",
  "tessera-filters",
  "saved-tessera-views",
  "tessera-density",
  "tessera-focus",
  "tessera-kpis",
  "tessera-chart",
  "tessera-timeline",
  "tessera-bulk",
  "tessera-csv",
  "tessera-keys",
  "tessera-audit",
  "least-open-stone",
  "tessera-viewer",
  "suggest-tessera",
  "overdue-onyx",
  "follow-calipers",
  "follow-caliper-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "vault", "open", "tag", "coat", "hour", "lower", "pin"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [4, 8, 12, 16] as const;
const COAT_CYCLE = [1, 2, 4] as const;
const WARM = new Set(["jasper", "agate"]);
const COOL = new Set(["lapis", "onyx"]);
const QUIET_GROUND = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): TesseraRack {
  return raw === "tray" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<TesseraGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<TesseraGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[ja]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Tessera, rack: TesseraRack): boolean {
  if (rack === "tray") return card.trayed && !card.vaulted;
  if (rack === "vault") return card.vaulted;
  return !card.trayed && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stoneIndex(stone: string): number {
  return TSR_STONES.indexOf(stone as TesseraStone);
}

function hourIndex(hour: number): number {
  return HOUR_CYCLE.indexOf(hour as (typeof HOUR_CYCLE)[number]);
}

function coatIndex(coat: number): number {
  return COAT_CYCLE.indexOf(coat as (typeof COAT_CYCLE)[number]);
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
  return (TSR_STONES as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 12, or 16. Anything else stays blank. */
export function tesseraHour(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A coat count is 1, 2, or 4. Anything else stays blank. */
export function coatCount(raw: unknown): 1 | 2 | 4 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "2" && text !== "4") return null;
  return Number(text) as 1 | 2 | 4;
}

/** A ground is ivory, graphite, or champagne. The saved name is the upper token. */
export function tesseraGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function stoneWarm(stone: unknown): boolean {
  return WARM.has(snip(stone, 12).toLowerCase());
}

export function stoneCool(stone: unknown): boolean {
  return COOL.has(snip(stone, 12).toLowerCase());
}

/** Jasper is first. Agate is second. Lapis is third. Onyx is fourth. */
export function stoneBand(stone: unknown): string {
  const text = stonePoint(stone);
  if (!text) return "";
  if (text === "jasper") return "first";
  if (text === "agate") return "second";
  if (text === "lapis") return "third";
  return "fourth";
}

/** Signed distance from one stone to another along the bench. */
export function stoneGap(from: unknown, to: unknown): number | null {
  const left = stoneIndex(stonePoint(from));
  const right = stoneIndex(stonePoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(tesseraGround(ground));
}

/** A pair coat is 2. One and four are not a pair. */
export function midCoat(coat: unknown): boolean {
  return coatCount(coat) === 2;
}

/** A full coat is 4. */
export function fullCoat(coat: unknown): boolean {
  return coatCount(coat) === 4;
}

export function activeStone(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return stonePoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = tesseraHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = tesseraGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeCoat(raw: unknown): string {
  const coat = coatCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveTesseraFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the bench uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestTesseraGround(cards: readonly Tessera[]): string {
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
export function suggestTesseraHour(cards: readonly Tessera[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inRack(card, "bench") || card.hour === null) continue;
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

export function suggestStone(hour: number): TesseraStone {
  if (hour < 6) return "jasper";
  if (hour < 12) return "agate";
  if (hour < 18) return "lapis";
  return "onyx";
}

/** The hand with the fewest unraised tesserae on the bench. A tie keeps the roster order. */
export function fairHand(cards: readonly Tessera[], roster: string): string {
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

export function readTesserae(raw: unknown): Tessera[] {
  if (!Array.isArray(raw)) return [];
  const out: Tessera[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Tessera>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      stone: stonePoint(row.stone),
      hour: tesseraHour(row.hour),
      ground: tesseraGround(row.ground),
      coat: coatCount(row.coat) ?? 1,
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

export function addTessera(
  cards: readonly Tessera[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    stone?: string;
    hour?: unknown;
    ground?: string;
    coat?: unknown;
    tags?: unknown;
  },
): Tessera[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readTesserae([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      stone: stonePoint(card.stone),
      hour: tesseraHour(card.hour),
      ground: tesseraGround(card.ground),
      coat: coatCount(card.coat) ?? 1,
      tags: tagsOf(card.tags),
      raised: false,
      trayed: false,
      vaulted: false,
      pinned: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Tessera[], id: string, edit: (card: Tessera) => Tessera): Tessera[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editTessera(cards: readonly Tessera[], id: string, title: string): Tessera[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editTesseraNote(cards: readonly Tessera[], id: string, note: string): Tessera[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(tesseraGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setTesseraGround(cards: readonly Tessera[], id: string, ground: string): Tessera[] {
  const next = tesseraGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setTesseraRaised(cards: readonly Tessera[], id: string, raised: boolean): Tessera[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setTesseraRack(cards: readonly Tessera[], id: string, trayed: boolean): Tessera[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, vaulted: trayed ? false : card.vaulted, audit: trayed ? "tray" : "return" }));
}

export function setTesseraVault(cards: readonly Tessera[], id: string, vaulted: boolean): Tessera[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, trayed: vaulted ? false : card.trayed, audit: vaulted ? "vault" : "open" }));
}

export function setTesseraPin(cards: readonly Tessera[], id: string, pinned: boolean): Tessera[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addTesseraTag(cards: readonly Tessera[], id: string, tag: string): Tessera[] {
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

function stepCoat(coat: number, dir: 1 | -1): 1 | 2 | 4 {
  const index = coatIndex(coat);
  const next = index < 0 ? 0 : (index + dir + COAT_CYCLE.length) % COAT_CYCLE.length;
  return COAT_CYCLE[next];
}

export function raiseHourFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseCoatFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, 1), audit: "coat" }));
}

export function lowerCoatFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, -1), audit: "coat" }));
}

export function setTesseraFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackTesseraFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return setTesseraRack(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function pinTesseraFocused(cards: readonly Tessera[], id: string): Tessera[] {
  return setTesseraPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function groundFocused(cards: readonly Tessera[], id: string): Tessera[] {
  const card = cards.find((item) => item.id === id);
  return card ? setTesseraGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Tessera[], ids: readonly string[], edit: (card: Tessera) => Tessera): Tessera[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkTesseraIvory(cards: readonly Tessera[], ids: readonly string[]): Tessera[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkTesseraLift(cards: readonly Tessera[], ids: readonly string[]): Tessera[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkTesseraVault(cards: readonly Tessera[], ids: readonly string[]): Tessera[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, trayed: false, audit: "vault" }));
}

export function bulkTesseraTag(cards: readonly Tessera[], ids: readonly string[]): Tessera[] {
  return bulk(cards, ids, (card) => (card.tags.includes("j") ? card : { ...card, tags: tagsOf([...card.tags, "j"]), audit: "tag" }));
}

export function readTesseraViews(raw: unknown): TesseraView[] {
  if (!Array.isArray(raw)) return [];
  const out: TesseraView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<TesseraView>;
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
      coat: activeCoat(row.coat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addTesseraView(views: readonly TesseraView[], view: TesseraView): TesseraView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readTesseraViews([...views, { ...view, name }]);
}

export function dropTesseraView(views: readonly TesseraView[], id: string): TesseraView[] {
  return views.filter((view) => view.id !== id);
}

export function tesseraDensity(raw: unknown): TesseraDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortTesserae(cards: readonly Tessera[], sort: TesseraSort): Tessera[] {
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

export function visibleTesserae(
  cards: readonly Tessera[],
  rack: TesseraRack,
  query: string,
  hand: string,
  ground: string,
  stone: string,
  hour: string,
  coat: string,
): Tessera[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : tesseraGround(ground);
  const wantStone = activeStone(stone);
  const wantHour = activeHour(hour);
  const wantCoat = activeCoat(coat);
  return cards.filter((card) => {
    if (!inRack(card, rack)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantStone === "warm" && !stoneWarm(card.stone)) return false;
    if (wantStone === "cool" && !stoneCool(card.stone)) return false;
    if (wantStone !== "all" && wantStone !== "warm" && wantStone !== "cool" && card.stone !== wantStone) return false;
    if (wantHour !== "all" && String(card.hour ?? "") !== wantHour) return false;
    if (wantCoat !== "all" && String(card.coat) !== wantCoat) return false;
    return true;
  });
}

/** Onyx on coat one, still not raised and not in the vault, is overdue. */
export function overdueTessera(card: Tessera): boolean {
  return card.stone === "onyx" && card.coat === 1 && !card.raised && !card.vaulted;
}

/** No ground, four hours, coat one, and still on the bench. */
export function idleTessera(card: Tessera): boolean {
  return !card.ground && card.hour === 4 && card.coat === 1 && !card.raised && !card.trayed && !card.vaulted;
}

/** Champagne, sixteen hours, and a full coat, still out of the vault. */
export function briskTessera(card: Tessera): boolean {
  return card.ground === "CHAMPAGNE" && card.hour === 16 && card.coat === 4 && !card.vaulted;
}

/** Lapis, ivory, and eight hours. */
export function restingTessera(card: Tessera): boolean {
  return card.stone === "lapis" && card.ground === "IVORY" && card.hour === 8;
}

/** A jasper tessera is late when the station is already onyx. */
export function lateTessera(card: Tessera, station: string): boolean {
  return card.stone === "jasper" && stonePoint(station) === "onyx" && !card.raised;
}

export function tesseraCounts(cards: readonly Tessera[], shown: readonly Tessera[], station: string): TesseraCounts {
  return {
    bench: cards.filter((card) => inRack(card, "bench")).length,
    tray: cards.filter((card) => inRack(card, "tray")).length,
    vault: cards.filter((card) => inRack(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => stoneWarm(card.stone)).length,
    cool: cards.filter((card) => stoneCool(card.stone)).length,
    long: cards.filter((card) => card.hour === 16).length,
    quiet: cards.filter((card) => graphiteQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleTessera).length,
    brisk: cards.filter(briskTessera).length,
    resting: cards.filter(restingTessera).length,
    overdue: cards.filter(overdueTessera).length,
    pair: cards.filter((card) => midCoat(card.coat) && lateTessera(card, station)).length,
  };
}

export function tesseraBars(cards: readonly Tessera[]): { stone: string; count: number }[] {
  return TSR_STONES.map((stone) => ({ stone, count: cards.filter((card) => card.stone === stone && !card.vaulted).length }));
}

export function tesseraTimeline(cards: readonly Tessera[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "bench"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function tesseraHands(cards: readonly Tessera[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Tessera[]): string {
  const open = cards.filter((card) => inRack(card, "bench") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of tesseraHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderTesserae(cards: readonly Tessera[]): string[] {
  return cards.filter(overdueTessera).map((card) => card.title);
}

export function tesseraCopy(card: Tessera): string {
  return [card.title, card.hand, card.stone, card.ground, card.hour ?? "", card.coat, card.note].filter((item) => item !== "").join(" · ");
}

export function tesseraCsv(cards: readonly Tessera[], station: string): string {
  const lines = ["title,hand,stone,ground,hours,coat,tags,raised,tray,vault,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.stone,
        card.ground,
        card.hour ?? "",
        card.coat,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.trayed ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.pinned ? "1" : "0",
        stoneCool(card.stone) ? "1" : "0",
        lateTessera(card, station) ? "1" : "0",
        idleTessera(card) ? "1" : "0",
        briskTessera(card) ? "1" : "0",
        restingTessera(card) ? "1" : "0",
        overdueTessera(card) ? "1" : "0",
        stoneWarm(card.stone) ? "1" : "0",
        graphiteQuiet(card.ground) ? "1" : "0",
        stoneBand(card.stone),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const FLW_HIDE_KEY = "crmv4-followcaliper-hide-385";
export const FLW_REVIEW_KEY = "crmv4-followcaliper-review-385";

export type FollowLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type FollowHue = "" | "gilt" | "pearl" | "ink";
export type FollowState = "" | "clear" | "set";
export type FollowReview = "all" | "reviewed" | "fresh";
export type FollowShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type FollowValue = string | { retentionFollowUpAt?: unknown; [key: string]: unknown } | null | undefined;
export type FollowRow = { id: string; label: string; code: FollowValue; userId?: string };
export type FollowLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "pearl", "ink"] as const;
const DUE_TITLES = new Set(["DUE", "BOOK", "KEEP", "LIVE"]);
const SOON_TITLES = new Set(["NEXT", "SOON"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT", "PAUSE"]);
const LATE_TITLES = new Set(["LATE", "SOFT"]);
const MISSED_TITLES = new Set(["LOST", "DROP", "COLD"]);
const BLANK_TITLES = new Set(["OPEN", "NONE", "NULL", "BARE"]);

function followRecord(raw: FollowValue): { retentionFollowUpAt?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function followBlocked(raw: FollowValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function followGiven(raw: FollowValue): string {
  const row = followRecord(raw);
  if (row && !("retentionFollowUpAt" in row)) return "";
  const value = row ? row.retentionFollowUpAt : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "DUE";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return snip(value, 48);
}

function followReadable(raw: FollowValue): boolean {
  if (followBlocked(raw)) return false;
  const row = followRecord(raw);
  if (row && !("retentionFollowUpAt" in row)) return false;
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

export function followState(raw: FollowValue): FollowState {
  if (!followReadable(raw)) return "";
  return followGiven(raw) ? "set" : "clear";
}

/** A known follow-up word maps first. A date today is due. Within three days ahead is soon. Further ahead is far.
 * Younger than two days past is late. Older is missed.
 */
export function followLane(raw: FollowValue, now = Date.now()): FollowLane {
  if (followState(raw) !== "set") return "";
  const text = followGiven(raw);
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
    if (now - at < 2 * day) return "late";
    return "missed";
  }
  if (text.length >= 14) return "far";
  if (/^[0-9]/.test(text)) return "late";
  if (/^[aeiou]/i.test(text)) return "soon";
  return "due";
}

export function followHue(raw: FollowValue, now = Date.now()): FollowHue {
  const mail = followLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ink";
  return "pearl";
}

export function followDue(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "due";
}

export function followSoon(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "soon";
}

export function followFar(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "far";
}

export function followLate(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "late";
}

export function followMissed(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "missed";
}

export function followHold(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "hold";
}

export function followBlank(raw: FollowValue, now = Date.now()): boolean {
  return followLane(raw, now) === "blank";
}

export function followOpen(raw: FollowValue): boolean {
  return followState(raw) === "clear";
}

export function followLength(raw: FollowValue): number | null {
  if (followState(raw) !== "set") return null;
  return followGiven(raw).length;
}

export function followEven(raw: FollowValue): boolean {
  const length = followLength(raw);
  return length !== null && length % 2 === 0;
}

export function followDigit(raw: FollowValue): boolean {
  return /[0-9]/.test(followGiven(raw));
}

export function followLetter(raw: FollowValue): boolean {
  return /[A-Za-z]/.test(followGiven(raw));
}

export function followUpper(raw: FollowValue): boolean {
  const text = followGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function followCopy(raw: FollowValue): string {
  return followGiven(raw);
}

export function followStamp(raw: FollowValue): string {
  const text = followGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function followLanes(rows: readonly FollowRow[], now = Date.now()): FollowLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = followLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingFollow(rows: readonly FollowRow[], now = Date.now()): string {
  const lines = followLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingFollowHue(rows: readonly FollowRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = followHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneFollowCount(rows: readonly FollowRow[], mail: FollowLane, now = Date.now()): number {
  return rows.filter((row) => followLane(row.code, now) === mail).length;
}

export function followShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFollowLanes(rows: readonly FollowRow[], now = Date.now()): string[] {
  return followLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenFollow(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedFollow(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFollow(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleFollowReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFollowReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFollowLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: FollowValue, shape: FollowShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return followOpen(raw);
  if (shape === "digit") return followDigit(raw);
  if (shape === "letter") return followLetter(raw);
  if (shape === "even") return followEven(raw);
  if (shape === "upper") return followUpper(raw);
  return followLane(raw, now) === shape;
}

export function visibleFollow(
  rows: readonly FollowRow[],
  mail: string,
  hue: string,
  query: string,
  review: FollowReview,
  reviewed: readonly string[],
  shape: FollowShape,
  now = Date.now(),
): FollowRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = followLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && followHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${followCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function followLanesCsv(rows: readonly FollowRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of followLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function followRowsCsv(rows: readonly FollowRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,follow,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(followCopy(row.code)), followLane(row.code, now), followHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
