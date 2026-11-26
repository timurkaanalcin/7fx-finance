/**
 * Ormolu mounts kept in this browser,
 * and validation gauges read the validation status already stored on the account.
 * Metals are bronze, gilt, pewter, and iron. Grounds are ivory, graphite, and champagne.
 * Hours are 4, 8, 12, or 16. Coats are 1, 2, or 4.
 * Bronze and gilt are the warm half. Pewter and iron are the cool half.
 * Graphite is the quiet ground.
 * A validation date today is due. Within three days ahead is soon. Further ahead is far.
 * A validation date younger than two days past is late. Older than that is missed.
 * Pass, clear, ready, and live are due. Next, soon, and review wait. Hold, wait, and queue hold.
 * Late and soft are late. Fail, drop, and reject are missed. Open, none, null, and bare stay blank.
 * A true status reads as PASS. A false status reads as OPEN.
 * Money fields are not read. The gauge does not change the saved status.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_ormolu_mount (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   hand text not null default '',
 *   metal text not null default '',
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
 * CREATE TABLE crm_validation_gauge_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_validation_gauge_review (
 *   trader_id text primary key
 * );
 */


export const ORL_KEY = "crmv4-ormolu-386";
export const ORL_VIEW_KEY = "crmv4-ormolu-views-386";
export const ORL_DENSITY_KEY = "crmv4-ormolu-density-386";
export const ORL_METALS = ["bronze", "gilt", "pewter", "iron"] as const;

export type OrmoluMetal = (typeof ORL_METALS)[number];
export type OrmoluGround = "blank" | "ivory" | "graphite" | "champagne";
export type OrmoluRack = "bench" | "tray" | "vault";
export type OrmoluDensity = "open" | "tight";
export type OrmoluSort = "metal" | "hand";

export type Ormolu = {
  id: string;
  title: string;
  note: string;
  hand: string;
  metal: string;
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

export type OrmoluView = {
  id: string;
  name: string;
  rack: OrmoluRack;
  query: string;
  hand: string;
  ground: string;
  metal: string;
  hour: string;
  coat: string;
};

export type OrmoluCounts = {
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

export const ROUND386_FEATURES = [
  "ormolu-save",
  "ormolu-reminders",
  "ormolu-metals",
  "ormolu-search",
  "ormolu-hour-sla",
  "ormolu-vault",
  "ormolu-pin",
  "ormolu-inline-title",
  "ormolu-filters",
  "saved-ormolu-views",
  "ormolu-density",
  "ormolu-focus",
  "ormolu-kpis",
  "ormolu-chart",
  "ormolu-timeline",
  "ormolu-bulk",
  "ormolu-csv",
  "ormolu-keys",
  "ormolu-audit",
  "least-open-metal",
  "ormolu-viewer",
  "suggest-ormolu",
  "overdue-iron",
  "validation-gauges",
  "validation-gauge-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ground", "raise", "free", "tray", "return", "vault", "open", "tag", "coat", "hour", "lower", "pin"] as const;
const GROUNDS = ["ivory", "graphite", "champagne"] as const;
const HOUR_CYCLE = [4, 8, 12, 16] as const;
const COAT_CYCLE = [1, 2, 4] as const;
const WARM = new Set(["bronze", "gilt"]);
const COOL = new Set(["pewter", "iron"]);
const QUIET_GROUND = new Set(["GRAPHITE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 16;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function snip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function rackOf(raw: unknown): OrmoluRack {
  return raw === "tray" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = snip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function groundName(raw: unknown): Exclude<OrmoluGround, "blank"> | "" {
  const text = snip(raw, 16).toLowerCase();
  return (GROUNDS as readonly string[]).includes(text) ? (text as Exclude<OrmoluGround, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = snip(part, 1).toLowerCase();
    if (!/^[bg]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inRack(card: Ormolu, rack: OrmoluRack): boolean {
  if (rack === "tray") return card.trayed && !card.vaulted;
  if (rack === "vault") return card.vaulted;
  return !card.trayed && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function metalIndex(metal: string): number {
  return ORL_METALS.indexOf(metal as OrmoluMetal);
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

export function metalPoint(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  return (ORL_METALS as readonly string[]).includes(text) ? text : "";
}

/** An hour mark is 4, 8, 12, or 16. Anything else stays blank. */
export function ormoluHour(raw: unknown): 4 | 8 | 12 | 16 | null {
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
export function ormoluGround(raw: unknown): string {
  const text = groundName(raw);
  return text ? text.toUpperCase() : "";
}

export function metalWarm(metal: unknown): boolean {
  return WARM.has(snip(metal, 12).toLowerCase());
}

export function metalCool(metal: unknown): boolean {
  return COOL.has(snip(metal, 12).toLowerCase());
}

/** Bronze is first. Gilt is second. Pewter is third. Iron is fourth. */
export function metalBand(metal: unknown): string {
  const text = metalPoint(metal);
  if (!text) return "";
  if (text === "bronze") return "first";
  if (text === "gilt") return "second";
  if (text === "pewter") return "third";
  return "fourth";
}

/** Signed distance from one metal to another along the bench. */
export function metalGap(from: unknown, to: unknown): number | null {
  const left = metalIndex(metalPoint(from));
  const right = metalIndex(metalPoint(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function graphiteQuiet(ground: unknown): boolean {
  return QUIET_GROUND.has(ormoluGround(ground));
}

/** A pair coat is 2. One and four are not a pair. */
export function midCoat(coat: unknown): boolean {
  return coatCount(coat) === 2;
}

/** A full coat is 4. */
export function fullCoat(coat: unknown): boolean {
  return coatCount(coat) === 4;
}

export function activeMetal(raw: unknown): string {
  const text = snip(raw, 12).toLowerCase();
  if (text === "warm" || text === "cool") return text;
  return metalPoint(text) || "all";
}

export function activeHour(raw: unknown): string {
  const hour = ormoluHour(raw);
  return hour === null ? "all" : String(hour);
}

export function activeGround(raw: unknown, allow: readonly string[]): string {
  const text = ormoluGround(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeCoat(raw: unknown): string {
  const coat = coatCount(raw);
  return coat === null ? "all" : String(coat);
}

export function moveOrmoluFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ground the bench uses least. A tie keeps ivory, then graphite, then champagne. */
export function suggestOrmoluGround(cards: readonly Ormolu[]): string {
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
export function suggestOrmoluHour(cards: readonly Ormolu[], hour: number): 4 | 8 | 12 | 16 {
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

export function suggestMetal(hour: number): OrmoluMetal {
  if (hour < 6) return "bronze";
  if (hour < 12) return "gilt";
  if (hour < 18) return "pewter";
  return "iron";
}

/** The hand with the fewest unraised ormolu on the bench. A tie keeps the roster order. */
export function fairHand(cards: readonly Ormolu[], roster: string): string {
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

export function readOrmoluList(raw: unknown): Ormolu[] {
  if (!Array.isArray(raw)) return [];
  const out: Ormolu[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Ormolu>;
    const id = snip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      hand: snip(row.hand, 24),
      metal: metalPoint(row.metal),
      hour: ormoluHour(row.hour),
      ground: ormoluGround(row.ground),
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

export function addOrmolu(
  cards: readonly Ormolu[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    hand?: string;
    metal?: string;
    hour?: unknown;
    ground?: string;
    coat?: unknown;
    tags?: unknown;
  },
): Ormolu[] {
  const title = lineOf(card.title);
  const id = snip(card.id, 40) || `t${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readOrmoluList([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      hand: snip(card.hand, 24),
      metal: metalPoint(card.metal),
      hour: ormoluHour(card.hour),
      ground: ormoluGround(card.ground),
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

function mapCard(cards: readonly Ormolu[], id: string, edit: (card: Ormolu) => Ormolu): Ormolu[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editOrmolu(cards: readonly Ormolu[], id: string, title: string): Ormolu[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editOrmoluNote(cards: readonly Ormolu[], id: string, note: string): Ormolu[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

function cycleGround(ground: string): string {
  const order = ["", "IVORY", "GRAPHITE", "CHAMPAGNE"];
  const index = order.indexOf(ormoluGround(ground));
  return order[(index + 1) % order.length] || "IVORY";
}

export function setOrmoluGround(cards: readonly Ormolu[], id: string, ground: string): Ormolu[] {
  const next = ormoluGround(ground);
  return mapCard(cards, id, (card) => (card.ground === next ? card : { ...card, ground: next, audit: "ground" }));
}

export function setOrmoluRaised(cards: readonly Ormolu[], id: string, raised: boolean): Ormolu[] {
  return mapCard(cards, id, (card) => (card.raised === raised ? card : { ...card, raised, audit: raised ? "raise" : "free" }));
}

export function setOrmoluRack(cards: readonly Ormolu[], id: string, trayed: boolean): Ormolu[] {
  return mapCard(cards, id, (card) => (card.trayed === trayed ? card : { ...card, trayed, vaulted: trayed ? false : card.vaulted, audit: trayed ? "tray" : "return" }));
}

export function setOrmoluVault(cards: readonly Ormolu[], id: string, vaulted: boolean): Ormolu[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, trayed: vaulted ? false : card.trayed, audit: vaulted ? "vault" : "open" }));
}

export function setOrmoluPin(cards: readonly Ormolu[], id: string, pinned: boolean): Ormolu[] {
  return mapCard(cards, id, (card) => (card.pinned === pinned ? card : { ...card, pinned, audit: "pin" }));
}

export function addOrmoluTag(cards: readonly Ormolu[], id: string, tag: string): Ormolu[] {
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

export function raiseHourFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHourFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "lower" }));
}

export function raiseCoatFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, 1), audit: "coat" }));
}

export function lowerCoatFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return mapCard(cards, id, (card) => ({ ...card, coat: stepCoat(card.coat, -1), audit: "coat" }));
}

export function setOrmoluFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, raised: !card.raised, audit: card.raised ? "free" : "raise" })) : [...cards];
}

export function rackOrmoluFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return setOrmoluRack(cards, id, !cards.find((card) => card.id === id)?.trayed);
}

export function pinOrmoluFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  return setOrmoluPin(cards, id, !cards.find((card) => card.id === id)?.pinned);
}

export function groundFocused(cards: readonly Ormolu[], id: string): Ormolu[] {
  const card = cards.find((item) => item.id === id);
  return card ? setOrmoluGround(cards, id, cycleGround(card.ground)) : [...cards];
}

function bulk(cards: readonly Ormolu[], ids: readonly string[], edit: (card: Ormolu) => Ormolu): Ormolu[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkOrmoluIvory(cards: readonly Ormolu[], ids: readonly string[]): Ormolu[] {
  return bulk(cards, ids, (card) => (card.ground === "IVORY" ? card : { ...card, ground: "IVORY", audit: "ground" }));
}

export function bulkOrmoluLift(cards: readonly Ormolu[], ids: readonly string[]): Ormolu[] {
  return bulk(cards, ids, (card) => (card.raised ? card : { ...card, raised: true, audit: "raise" }));
}

export function bulkOrmoluVault(cards: readonly Ormolu[], ids: readonly string[]): Ormolu[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, trayed: false, audit: "vault" }));
}

export function bulkOrmoluTag(cards: readonly Ormolu[], ids: readonly string[]): Ormolu[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readOrmoluViews(raw: unknown): OrmoluView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrmoluView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrmoluView>;
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
      metal: activeMetal(row.metal),
      hour: activeHour(row.hour),
      coat: activeCoat(row.coat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOrmoluView(views: readonly OrmoluView[], view: OrmoluView): OrmoluView[] {
  const name = lineOf(view.name);
  if (!name || views.some((item) => item.id === view.id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readOrmoluViews([...views, { ...view, name }]);
}

export function dropOrmoluView(views: readonly OrmoluView[], id: string): OrmoluView[] {
  return views.filter((view) => view.id !== id);
}

export function ormoluDensity(raw: unknown): OrmoluDensity {
  return raw === "tight" ? "tight" : "open";
}

export function sortOrmoluList(cards: readonly Ormolu[], sort: OrmoluSort): Ormolu[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "hand") {
      const hand = a.hand.localeCompare(b.hand);
      if (hand) return hand;
    } else {
      const metal = metalIndex(a.metal) - metalIndex(b.metal);
      if (metal) return metal;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleOrmoluList(
  cards: readonly Ormolu[],
  rack: OrmoluRack,
  query: string,
  hand: string,
  ground: string,
  metal: string,
  hour: string,
  coat: string,
): Ormolu[] {
  const text = query.trim().toLowerCase();
  const wantHand = snip(hand, 24).toLowerCase();
  const wantGround = ground === "all" ? "" : ormoluGround(ground);
  const wantMetal = activeMetal(metal);
  const wantHour = activeHour(hour);
  const wantCoat = activeCoat(coat);
  return cards.filter((card) => {
    if (!inRack(card, rack)) return false;
    if (text && !`${card.title} ${card.note} ${card.hand}`.toLowerCase().includes(text)) return false;
    if (wantHand && card.hand.toLowerCase() !== wantHand) return false;
    if (wantGround && card.ground !== wantGround) return false;
    if (wantMetal === "warm" && !metalWarm(card.metal)) return false;
    if (wantMetal === "cool" && !metalCool(card.metal)) return false;
    if (wantMetal !== "all" && wantMetal !== "warm" && wantMetal !== "cool" && card.metal !== wantMetal) return false;
    if (wantHour !== "all" && String(card.hour ?? "") !== wantHour) return false;
    if (wantCoat !== "all" && String(card.coat) !== wantCoat) return false;
    return true;
  });
}

/** Iron on coat one, still not raised and not in the vault, is overdue. */
export function overdueOrmolu(card: Ormolu): boolean {
  return card.metal === "iron" && card.coat === 1 && !card.raised && !card.vaulted;
}

/** No ground, four hours, coat one, and still on the bench. */
export function idleOrmolu(card: Ormolu): boolean {
  return !card.ground && card.hour === 4 && card.coat === 1 && !card.raised && !card.trayed && !card.vaulted;
}

/** Champagne, sixteen hours, and a full coat, still out of the vault. */
export function briskOrmolu(card: Ormolu): boolean {
  return card.ground === "CHAMPAGNE" && card.hour === 16 && card.coat === 4 && !card.vaulted;
}

/** Pewter, ivory, and eight hours. */
export function restingOrmolu(card: Ormolu): boolean {
  return card.metal === "pewter" && card.ground === "IVORY" && card.hour === 8;
}

/** A bronze ormolu is late when the station is already iron. */
export function lateOrmolu(card: Ormolu, station: string): boolean {
  return card.metal === "bronze" && metalPoint(station) === "iron" && !card.raised;
}

export function ormoluCounts(cards: readonly Ormolu[], shown: readonly Ormolu[], station: string): OrmoluCounts {
  return {
    bench: cards.filter((card) => inRack(card, "bench")).length,
    tray: cards.filter((card) => inRack(card, "tray")).length,
    vault: cards.filter((card) => inRack(card, "vault")).length,
    raised: cards.filter((card) => card.raised).length,
    warm: cards.filter((card) => metalWarm(card.metal)).length,
    cool: cards.filter((card) => metalCool(card.metal)).length,
    long: cards.filter((card) => card.hour === 16).length,
    quiet: cards.filter((card) => graphiteQuiet(card.ground)).length,
    minutes: cards.reduce((sum, card) => sum + (card.hour || 0), 0),
    matched: shown.length,
    pinned: cards.filter((card) => card.pinned).length,
    idle: cards.filter(idleOrmolu).length,
    brisk: cards.filter(briskOrmolu).length,
    resting: cards.filter(restingOrmolu).length,
    overdue: cards.filter(overdueOrmolu).length,
    pair: cards.filter((card) => midCoat(card.coat) && lateOrmolu(card, station)).length,
  };
}

export function ormoluBars(cards: readonly Ormolu[]): { metal: string; count: number }[] {
  return ORL_METALS.map((metal) => ({ metal, count: cards.filter((card) => card.metal === metal && !card.vaulted).length }));
}

export function ormoluTimeline(cards: readonly Ormolu[]): { hour: number; titles: string[] }[] {
  const open = cards.filter((card) => inRack(card, "bench"));
  return HOUR_CYCLE.map((hour) => ({ hour, titles: open.filter((card) => card.hour === hour).map((card) => card.title) })).filter((row) => row.titles.length);
}

export function ormoluHands(cards: readonly Ormolu[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.hand && !out.some((name) => name.toLowerCase() === card.hand.toLowerCase())) out.push(card.hand);
  }
  return out;
}

export function busiestHand(cards: readonly Ormolu[]): string {
  const open = cards.filter((card) => inRack(card, "bench") && !card.raised && card.hand);
  let best = "";
  let score = 0;
  for (const name of ormoluHands(open)) {
    const count = open.filter((card) => card.hand.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderOrmoluList(cards: readonly Ormolu[]): string[] {
  return cards.filter(overdueOrmolu).map((card) => card.title);
}

export function ormoluCopy(card: Ormolu): string {
  return [card.title, card.hand, card.metal, card.ground, card.hour ?? "", card.coat, card.note].filter((item) => item !== "").join(" · ");
}

export function ormoluCsv(cards: readonly Ormolu[], station: string): string {
  const lines = ["title,hand,metal,ground,hours,coat,tags,raised,tray,vault,pinned,cool,late,idle,brisk,resting,overdue,warm,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.hand),
        card.metal,
        card.ground,
        card.hour ?? "",
        card.coat,
        card.tags.join(" "),
        card.raised ? "1" : "0",
        card.trayed ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.pinned ? "1" : "0",
        metalCool(card.metal) ? "1" : "0",
        lateOrmolu(card, station) ? "1" : "0",
        idleOrmolu(card) ? "1" : "0",
        briskOrmolu(card) ? "1" : "0",
        restingOrmolu(card) ? "1" : "0",
        overdueOrmolu(card) ? "1" : "0",
        metalWarm(card.metal) ? "1" : "0",
        graphiteQuiet(card.ground) ? "1" : "0",
        metalBand(card.metal),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const GGE_HIDE_KEY = "crmv4-valgauge-hide-386";
export const GGE_REVIEW_KEY = "crmv4-valgauge-review-386";

export type GaugeLane = "" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank";
export type GaugeHue = "" | "gilt" | "pearl" | "ink";
export type GaugeState = "" | "clear" | "set";
export type GaugeReview = "all" | "reviewed" | "fresh";
export type GaugeShape = "all" | "due" | "soon" | "far" | "late" | "missed" | "hold" | "blank" | "open" | "digit" | "letter" | "even" | "upper";

export type GaugeValue = string | { validationStatus?: unknown; [key: string]: unknown } | null | undefined;
export type GaugeRow = { id: string; label: string; code: GaugeValue; userId?: string };
export type GaugeLaneLine = { mail: string; count: number };

const FOLLOW_LANES = ["due", "soon", "far", "late", "missed", "hold", "blank"] as const;
const FOLLOW_HUES = ["gilt", "pearl", "ink"] as const;
const DUE_TITLES = new Set(["PASS", "CLEAR", "READY", "LIVE"]);
const SOON_TITLES = new Set(["NEXT", "SOON", "REVIEW"]);
const HOLD_TITLES = new Set(["HOLD", "WAIT", "QUEUE"]);
const LATE_TITLES = new Set(["LATE", "SOFT"]);
const MISSED_TITLES = new Set(["FAIL", "DROP", "REJECT"]);
const BLANK_TITLES = new Set(["OPEN", "NONE", "NULL", "BARE"]);

function gaugeRecord(raw: GaugeValue): { validationStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function gaugeBlocked(raw: GaugeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function gaugeGiven(raw: GaugeValue): string {
  const row = gaugeRecord(raw);
  if (row && !("validationStatus" in row)) return "";
  const value = row ? row.validationStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "PASS";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN";
  return snip(value, 48);
}

function gaugeReadable(raw: GaugeValue): boolean {
  if (gaugeBlocked(raw)) return false;
  const row = gaugeRecord(raw);
  if (row && !("validationStatus" in row)) return false;
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

export function gaugeState(raw: GaugeValue): GaugeState {
  if (!gaugeReadable(raw)) return "";
  return gaugeGiven(raw) ? "set" : "clear";
}

/** A known gauge-up word maps first. A date today is due. Within three days ahead is soon. Further ahead is far.
 * Younger than two days past is late. Older is missed.
 */
export function gaugeLane(raw: GaugeValue, now = Date.now()): GaugeLane {
  if (gaugeState(raw) !== "set") return "";
  const text = gaugeGiven(raw);
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

export function gaugeHue(raw: GaugeValue, now = Date.now()): GaugeHue {
  const mail = gaugeLane(raw, now);
  if (!mail) return "";
  if (mail === "due" || mail === "soon") return "gilt";
  if (mail === "late" || mail === "missed") return "ink";
  return "pearl";
}

export function gaugeDue(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "due";
}

export function gaugeSoon(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "soon";
}

export function gaugeFar(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "far";
}

export function gaugeLate(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "late";
}

export function gaugeMissed(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "missed";
}

export function gaugeHold(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "hold";
}

export function gaugeBlank(raw: GaugeValue, now = Date.now()): boolean {
  return gaugeLane(raw, now) === "blank";
}

export function gaugeOpen(raw: GaugeValue): boolean {
  return gaugeState(raw) === "clear";
}

export function gaugeLength(raw: GaugeValue): number | null {
  if (gaugeState(raw) !== "set") return null;
  return gaugeGiven(raw).length;
}

export function gaugeEven(raw: GaugeValue): boolean {
  const length = gaugeLength(raw);
  return length !== null && length % 2 === 0;
}

export function gaugeDigit(raw: GaugeValue): boolean {
  return /[0-9]/.test(gaugeGiven(raw));
}

export function gaugeLetter(raw: GaugeValue): boolean {
  return /[A-Za-z]/.test(gaugeGiven(raw));
}

export function gaugeUpper(raw: GaugeValue): boolean {
  const text = gaugeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function gaugeCopy(raw: GaugeValue): string {
  return gaugeGiven(raw);
}

export function gaugeStamp(raw: GaugeValue): string {
  const text = gaugeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function gaugeLanes(rows: readonly GaugeRow[], now = Date.now()): GaugeLaneLine[] {
  const counts = new Map<string, number>();
  for (const mail of FOLLOW_LANES) counts.set(mail, 0);
  for (const row of rows) {
    const mail = gaugeLane(row.code, now);
    if (!mail) continue;
    counts.set(mail, (counts.get(mail) || 0) + 1);
  }
  return FOLLOW_LANES.map((mail) => ({ mail, count: counts.get(mail) || 0 }));
}

export function leadingGauge(rows: readonly GaugeRow[], now = Date.now()): string {
  const lines = gaugeLanes(rows, now).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || FOLLOW_LANES.indexOf(a.mail as (typeof FOLLOW_LANES)[number]) - FOLLOW_LANES.indexOf(b.mail as (typeof FOLLOW_LANES)[number]))[0].mail;
}

export function leadingGaugeHue(rows: readonly GaugeRow[], now = Date.now()): string {
  const counts = new Map<string, number>();
  for (const hue of FOLLOW_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = gaugeHue(row.code, now);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = FOLLOW_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || FOLLOW_HUES.indexOf(a.hue) - FOLLOW_HUES.indexOf(b.hue))[0].hue;
}

export function laneGaugeCount(rows: readonly GaugeRow[], mail: GaugeLane, now = Date.now()): number {
  return rows.filter((row) => gaugeLane(row.code, now) === mail).length;
}

export function gaugeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGaugeLanes(rows: readonly GaugeRow[], now = Date.now()): string[] {
  return gaugeLanes(rows, now).filter((line) => line.count > 0).map((line) => line.mail);
}

export function readHiddenGauge(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGauge(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGauge(hidden: readonly string[], mail: string): string[] {
  return hidden.includes(mail) ? hidden.filter((item) => item !== mail) : [...hidden, mail];
}

export function toggleGaugeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGaugeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGaugeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((mail) => (showHidden ? hidden.includes(mail) : !hidden.includes(mail)));
}

function shapeHit(raw: GaugeValue, shape: GaugeShape, now: number): boolean {
  if (shape === "all") return true;
  if (shape === "open") return gaugeOpen(raw);
  if (shape === "digit") return gaugeDigit(raw);
  if (shape === "letter") return gaugeLetter(raw);
  if (shape === "even") return gaugeEven(raw);
  if (shape === "upper") return gaugeUpper(raw);
  return gaugeLane(raw, now) === shape;
}

export function visibleGauge(
  rows: readonly GaugeRow[],
  mail: string,
  hue: string,
  query: string,
  review: GaugeReview,
  reviewed: readonly string[],
  shape: GaugeShape,
  now = Date.now(),
): GaugeRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const lane = gaugeLane(row.code, now);
    if (mail !== "all" && lane !== mail) return false;
    if (hue !== "all" && gaugeHue(row.code, now) !== hue) return false;
    if (text && !`${row.label} ${gaugeCopy(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (!shapeHit(row.code, shape, now)) return false;
    return true;
  });
}

export function gaugeLanesCsv(rows: readonly GaugeRow[], now = Date.now()): string {
  const lines = ["lane,count"];
  for (const line of gaugeLanes(rows, now)) lines.push(`${line.mail},${line.count}`);
  return lines.join("\n");
}

export function gaugeRowsCsv(rows: readonly GaugeRow[], reviewed: readonly string[], now = Date.now()): string {
  const lines = ["name,gauge,lane,hue,reviewed"];
  for (const row of rows) {
    lines.push([csvCell(row.label), csvCell(gaugeCopy(row.code)), gaugeLane(row.code, now), gaugeHue(row.code, now), reviewed.includes(row.id) ? "1" : "0"].join(","));
  }
  return lines.join("\n");
}
