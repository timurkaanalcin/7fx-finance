/**
 * Clepsydra rules for a vessel kept in this browser, and portolan plates read the referral code already stored on the account.
 * Vessels are bowl, tube, cistern, and spout. Inks are gilt, ivory, and graphite.
 * Drops are 4, 8, 12, or 24. Beats are 2, 4, or 8.
 * A known referral is HOUSE, DESK, HALL, or FAIR. A channel contains a hyphen. A bay has a space.
 * A buoy is two characters or fewer. An ocean is twelve characters or longer. A cipher contains a number.
 * A true referral reads as HOUSE. A false referral reads as CLOSED CODE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_clepsydra (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   vessel text not null default '',
 *   drop_no integer,
 *   ink text not null default '',
 *   beat_no integer not null default 2,
 *   tags text not null default '',
 *   run boolean not null default false,
 *   pegged boolean not null default false,
 *   casketed boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_portolan_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_portolan_review (
 *   trader_id text primary key
 * );
 */

export const CKY_KEY = "crmv4-clepsydra";
export const CKY_VIEW_KEY = "crmv4-clepsydra-views";
export const CKY_DENSITY_KEY = "crmv4-clepsydra-density";
export const CKY_VESSELS = ["bowl", "tube", "cistern", "spout"] as const;

export type ClepsydraVessel = (typeof CKY_VESSELS)[number];

export type ClepsydraInk = "blank" | "gilt" | "ivory" | "graphite";

export type ClepsydraTray = "basin" | "peg" | "casket";

export type ClepsydraDensity = "broad" | "tight";

export type ClepsydraSort = "vessel" | "keeper";

export type Clepsydra = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  vessel: string;
  drop: number | null;
  ink: string;
  beat: number;
  tags: string[];
  run: boolean;
  pegged: boolean;
  casketed: boolean;
  starred: boolean;
  audit: string;
};

export type ClepsydraView = {
  id: string;
  name: string;
  tray: ClepsydraTray;
  query: string;
  keeper: string;
  ink: string;
  vessel: string;
  drop: string;
  beat: string;
};

export type ClepsydraCounts = {
  basin: number;
  peg: number;
  casket: number;
  run: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  drop: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND318_FEATURES = [
  "clepsydra-save",
  "notes",
  "vessel-parts",
  "gilt-ink",
  "drop-sla",
  "casket",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "keeper-sort",
  "desk-kpis",
  "vessel-chart",
  "drop-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-keeper",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "referral-portolan",
  "portolan-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "peg", "resume", "casket", "open", "tag", "beat", "drop", "lower", "star"] as const;

const INKS = ["gilt", "ivory", "graphite"] as const;

const DROP_CYCLE = [4, 8, 12, 24] as const;

const BEAT_CYCLE = [2, 4, 8] as const;

const INNER = new Set(["bowl", "tube"]);

const OUTER = new Set(["cistern", "spout"]);

const HOUSE_INK = new Set(["GILT", "GRAPHITE"]);

const HOUSE_CODES = new Set(["HOUSE", "DESK", "HALL", "FAIR"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ClepsydraTray {
  return raw === "peg" || raw === "casket" ? raw : "basin";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<ClepsydraInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<ClepsydraInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pq]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Clepsydra, tray: ClepsydraTray): boolean {
  if (tray === "peg") return card.pegged && !card.casketed;
  if (tray === "casket") return card.casketed;
  return !card.pegged && !card.casketed;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function vesselIndex(vessel: string): number {
  return CKY_VESSELS.indexOf(vessel as ClepsydraVessel);
}

function dropIndex(drop: number): number {
  return DROP_CYCLE.indexOf(drop as (typeof DROP_CYCLE)[number]);
}

function beatIndex(beat: number): number {
  return BEAT_CYCLE.indexOf(beat as (typeof BEAT_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function clepsydraVessel(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CKY_VESSELS as readonly string[]).includes(text) ? text : "";
}

/** A drop is 4, 8, 12, or 24. Anything else stays blank. */
export function clepsydraDrop(raw: unknown): 4 | 8 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "24") return null;
  return Number(text) as 4 | 8 | 12 | 24;
}

/** A beat is 2, 4, or 8. Anything else stays blank. */
export function clepsydraBeat(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function clepsydraInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function clepsydraInner(vessel: unknown): boolean {
  return INNER.has(clip(vessel, 12).toLowerCase());
}

export function clepsydraOuter(vessel: unknown): boolean {
  return OUTER.has(clip(vessel, 12).toLowerCase());
}

/** Bowl is the lip. Tube is the stem. Cistern is the well. Spout is the mouth. */
export function clepsydraBand(vessel: unknown): string {
  const text = clepsydraVessel(vessel);
  if (!text) return "";
  if (text === "bowl") return "lip";
  if (text === "tube") return "stem";
  if (text === "cistern") return "well";
  return "mouth";
}

/** Signed distance from one vessel to another along the clepsydra. */
export function clepsydraGap(from: unknown, to: unknown): number | null {
  const left = vesselIndex(clepsydraVessel(from));
  const right = vesselIndex(clepsydraVessel(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseInk(ink: unknown): boolean {
  return HOUSE_INK.has(clepsydraInk(ink));
}

/** A pair beat is 4. Two and eight are not a pair. */
export function pairBeat(beat: unknown): boolean {
  return clepsydraBeat(beat) === 4;
}

/** A full beat is 8. */
export function fullBeat(beat: unknown): boolean {
  return clepsydraBeat(beat) === 8;
}

export function activeVessel(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return clepsydraVessel(text) || "all";
}

export function activeDrop(raw: unknown): string {
  const drop = clepsydraDrop(raw);
  return drop === null ? "all" : String(drop);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = clepsydraInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeBeat(raw: unknown): string {
  const beat = clepsydraBeat(raw);
  return beat === null ? "all" : String(beat);
}

export function moveClepsydraFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the basin uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Clepsydra[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "basin") || !card.ink) continue;
    counts.set(card.ink, (counts.get(card.ink) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const ink of ["IVORY", "GILT", "GRAPHITE"]) {
    const count = counts.get(ink) || 0;
    if (count < score) {
      best = ink;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest four. Morning asks for eight. Afternoon asks for twelve. Evening asks for twenty-four. A saved drop on the basin wins, and a tie keeps the taller drop. */
export function suggestDrop(cards: readonly Clepsydra[], hour: number): 4 | 8 | 12 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "basin") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 24 = 24;
    let score = Number.POSITIVE_INFINITY;
    for (const drop of [...DROP_CYCLE].reverse()) {
      const count = counts.get(drop) || 0;
      if (count < score) {
        best = drop;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 4;
  if (hour < 12) return 8;
  if (hour < 18) return 12;
  return 24;
}

/** Before six, suggest the bowl. The rest of the day suggests the spout. */
export function suggestVessel(hour: number): ClepsydraVessel {
  return hour < 6 ? "bowl" : "spout";
}

/** The keeper with the fewest unrun vessels on the basin. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Clepsydra[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "basin") && !card.run);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readClepsydraRules(raw: unknown): Clepsydra[] {
  if (!Array.isArray(raw)) return [];
  const out: Clepsydra[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Clepsydra>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      keeper: clip(row.keeper, 24),
      vessel: clepsydraVessel(row.vessel),
      drop: clepsydraDrop(row.drop),
      ink: clepsydraInk(row.ink),
      beat: clepsydraBeat(row.beat) ?? 2,
      tags: tagsOf(row.tags),
      run: row.run === true,
      pegged: row.pegged === true,
      casketed: row.casketed === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addClepsydra(
  cards: readonly Clepsydra[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    keeper?: string;
    vessel?: string;
    drop?: unknown;
    ink?: string;
    beat?: unknown;
    tags?: unknown;
  },
): Clepsydra[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `w${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readClepsydraRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      keeper: clip(card.keeper, 24),
      vessel: clepsydraVessel(card.vessel),
      drop: clepsydraDrop(card.drop),
      ink: clepsydraInk(card.ink),
      beat: clepsydraBeat(card.beat) ?? 2,
      tags: tagsOf(card.tags),
      run: false,
      pegged: false,
      casketed: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Clepsydra[], id: string, edit: (card: Clepsydra) => Clepsydra): Clepsydra[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editClepsydra(cards: readonly Clepsydra[], id: string, title: string): Clepsydra[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editClepsydraNote(cards: readonly Clepsydra[], id: string, note: string): Clepsydra[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(clepsydraInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setClepsydraInk(cards: readonly Clepsydra[], id: string, ink: string): Clepsydra[] {
  const next = clepsydraInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setClepsydraRun(cards: readonly Clepsydra[], id: string, run: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.run === run ? card : { ...card, run, audit: run ? "set" : "clear" }));
}

export function setClepsydraPeg(cards: readonly Clepsydra[], id: string, pegged: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.pegged === pegged ? card : { ...card, pegged, casketed: pegged ? false : card.casketed, audit: pegged ? "peg" : "resume" }));
}

export function setClepsydraCasket(cards: readonly Clepsydra[], id: string, casketed: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.casketed === casketed ? card : { ...card, casketed, pegged: casketed ? false : card.pegged, audit: casketed ? "casket" : "open" }));
}

export function setClepsydraStar(cards: readonly Clepsydra[], id: string, starred: boolean): Clepsydra[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addClepsydraTag(cards: readonly Clepsydra[], id: string, tag: string): Clepsydra[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 4 | 8 | 12 | 24 {
  if (drop === null) return dir > 0 ? 4 : 24;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepBeat(beat: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = beatIndex(beat);
  const next = index < 0 ? 0 : (index + dir + BEAT_CYCLE.length) % BEAT_CYCLE.length;
  return BEAT_CYCLE[next];
}

export function liftDrop(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerDrop(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseBeat(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, 1), audit: "beat" }));
}

export function lowerBeat(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return mapCard(cards, id, (card) => ({ ...card, beat: stepBeat(card.beat, -1), audit: "beat" }));
}

export function setClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, run: !card.run, audit: card.run ? "clear" : "set" })) : [...cards];
}

export function pegClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return setClepsydraPeg(cards, id, !cards.find((card) => card.id === id)?.pegged);
}

export function starClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return setClepsydraStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagClepsydraFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return addClepsydraTag(cards, id, "p");
}

export function inkFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  const card = cards.find((item) => item.id === id);
  return card ? setClepsydraInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftDropFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return liftDrop(cards, id);
}

export function lowerDropFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return lowerDrop(cards, id);
}

export function raiseBeatFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return raiseBeat(cards, id);
}

export function lowerBeatFocused(cards: readonly Clepsydra[], id: string): Clepsydra[] {
  return lowerBeat(cards, id);
}

function bulk(cards: readonly Clepsydra[], ids: readonly string[], edit: (card: Clepsydra) => Clepsydra): Clepsydra[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkClepsydraGraphite(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkClepsydraRun(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.run ? card : { ...card, run: true, audit: "set" }));
}

export function bulkClepsydraCasket(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.casketed ? card : { ...card, casketed: true, pegged: false, audit: "casket" }));
}

export function bulkClepsydraTag(cards: readonly Clepsydra[], ids: readonly string[]): Clepsydra[] {
  return bulk(cards, ids, (card) => (card.tags.includes("q") ? card : { ...card, tags: tagsOf([...card.tags, "q"]), audit: "tag" }));
}

export function readClepsydraViews(raw: unknown): ClepsydraView[] {
  if (!Array.isArray(raw)) return [];
  const out: ClepsydraView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ClepsydraView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      ink: activeInk(row.ink, ["GILT", "IVORY", "GRAPHITE"]),
      vessel: activeVessel(row.vessel),
      drop: activeDrop(row.drop),
      beat: activeBeat(row.beat),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addClepsydraView(views: readonly ClepsydraView[], view: ClepsydraView): ClepsydraView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readClepsydraViews([...views, { ...view, id, name }]);
}

export function dropClepsydraView(views: readonly ClepsydraView[], id: string): ClepsydraView[] {
  return views.filter((view) => view.id !== id);
}

export function clepsydraDensity(raw: unknown): ClepsydraDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortClepsydraRules(cards: readonly Clepsydra[], sort: ClepsydraSort): Clepsydra[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    } else {
      const vessel = vesselIndex(a.vessel) - vesselIndex(b.vessel);
      if (vessel) return vessel;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleClepsydraRules(
  cards: readonly Clepsydra[],
  tray: ClepsydraTray,
  query: string,
  keeper: string,
  ink: string,
  vessel: string,
  drop: string,
  beat: string,
): Clepsydra[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = clip(keeper, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : clepsydraInk(ink);
  const wantVessel = activeVessel(vessel);
  const wantDrop = activeDrop(drop);
  const wantBeat = activeBeat(beat);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.keeper}`.toLowerCase().includes(text)) return false;
    if (wantKeeper && card.keeper.toLowerCase() !== wantKeeper) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantVessel === "inner" && !clepsydraInner(card.vessel)) return false;
    if (wantVessel === "outer" && !clepsydraOuter(card.vessel)) return false;
    if (wantVessel !== "all" && wantVessel !== "inner" && wantVessel !== "outer" && card.vessel !== wantVessel) return false;
    if (wantDrop !== "all" && String(card.drop ?? "") !== wantDrop) return false;
    if (wantBeat !== "all" && String(card.beat) !== wantBeat) return false;
    return true;
  });
}

/** An outer vessel on beat two, still unrun and not in the casket, is overdue. */
export function overdueClepsydra(card: Clepsydra): boolean {
  return clepsydraOuter(card.vessel) && card.beat === 2 && !card.run && !card.casketed;
}

/** No ink, the short drop, beat two, and still on the basin. */
export function idleClepsydra(card: Clepsydra): boolean {
  return !card.ink && card.drop === 4 && card.beat === 2 && !card.run && !card.pegged && !card.casketed;
}

/** Graphite, a tall drop, and a full beat, still out of the casket. */
export function briskClepsydra(card: Clepsydra): boolean {
  return card.ink === "GRAPHITE" && card.drop === 24 && card.beat === 8 && !card.casketed;
}

/** Spout, ivory, and drop eight. */
export function restingClepsydra(card: Clepsydra): boolean {
  return card.vessel === "spout" && card.ink === "IVORY" && card.drop === 8;
}

/** A bowl is late when the desk is already on the spout. */
export function lateClepsydra(card: Clepsydra, desk: string): boolean {
  return card.vessel === "bowl" && clepsydraVessel(desk) === "spout" && !card.run;
}

export function clepsydraCounts(cards: readonly Clepsydra[], shown: readonly Clepsydra[], desk: string): ClepsydraCounts {
  return {
    basin: cards.filter((card) => inTray(card, "basin")).length,
    peg: cards.filter((card) => inTray(card, "peg")).length,
    casket: cards.filter((card) => inTray(card, "casket")).length,
    run: cards.filter((card) => card.run).length,
    inner: cards.filter((card) => clepsydraInner(card.vessel)).length,
    outer: cards.filter((card) => clepsydraOuter(card.vessel)).length,
    wide: cards.filter((card) => card.drop === 24).length,
    house: cards.filter((card) => houseInk(card.ink)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleClepsydra).length,
    brisk: cards.filter(briskClepsydra).length,
    resting: cards.filter(restingClepsydra).length,
    overdue: cards.filter(overdueClepsydra).length,
    pair: cards.filter((card) => pairBeat(card.beat) && lateClepsydra(card, desk)).length,
  };
}

export function clepsydraBars(cards: readonly Clepsydra[]): { vessel: string; count: number }[] {
  return CKY_VESSELS.map((vessel) => ({ vessel, count: cards.filter((card) => card.vessel === vessel && !card.casketed).length }));
}

export function clepsydraTimeline(cards: readonly Clepsydra[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "basin"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function clepsydraKeepers(cards: readonly Clepsydra[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.keeper && !out.some((name) => name.toLowerCase() === card.keeper.toLowerCase())) out.push(card.keeper);
  }
  return out;
}

export function busiestKeeper(cards: readonly Clepsydra[]): string {
  const open = cards.filter((card) => inTray(card, "basin") && !card.run && card.keeper);
  let best = "";
  let score = 0;
  for (const name of clepsydraKeepers(open)) {
    const count = open.filter((card) => card.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderClepsydraRules(cards: readonly Clepsydra[]): string[] {
  return cards.filter(overdueClepsydra).map((card) => card.title);
}

export function clepsydraCopy(card: Clepsydra): string {
  return [card.title, card.keeper, card.vessel, card.ink, card.drop ?? "", card.beat, card.note].filter((item) => item !== "").join(" · ");
}

export function clepsydraCsv(cards: readonly Clepsydra[], desk: string): string {
  const lines = ["title,keeper,vessel,ink,drop,beat,tags,run,peg,casket,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.keeper),
        card.vessel,
        card.ink,
        card.drop ?? "",
        card.beat,
        card.tags.join(" "),
        card.run ? "1" : "0",
        card.pegged ? "1" : "0",
        card.casketed ? "1" : "0",
        card.starred ? "1" : "0",
        clepsydraOuter(card.vessel) ? "1" : "0",
        lateClepsydra(card, desk) ? "1" : "0",
        idleClepsydra(card) ? "1" : "0",
        briskClepsydra(card) ? "1" : "0",
        restingClepsydra(card) ? "1" : "0",
        overdueClepsydra(card) ? "1" : "0",
        clepsydraInner(card.vessel) ? "1" : "0",
        houseInk(card.ink) ? "1" : "0",
        clepsydraBand(card.vessel),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const PTL_KEY = "crmv4-portolan-hide";
export const PTL_REVIEW_KEY = "crmv4-portolan-review";

export type PortolanLane = "" | "quay" | "channel" | "bay" | "cipher" | "buoy" | "ocean" | "mouth" | "harbor";

export type PortolanHue = "" | "ivory" | "graphite" | "champagne";

export type PortolanState = "" | "clear" | "set";

export type PortolanReview = "all" | "reviewed" | "fresh";

export type PortolanShape =
  | "all"
  | "quay"
  | "channel"
  | "bay"
  | "cipher"
  | "buoy"
  | "ocean"
  | "mouth"
  | "harbor"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "tail"
  | "first"
  | "held"
  | "hyphen"
  | "period";

export type PortolanValue = string | { referral?: unknown; [key: string]: unknown } | null | undefined;

export type PortolanRow = { id: string; label: string; code: PortolanValue };

export type PortolanLaneLine = { lane: string; count: number };

const CODE_LANES = ["quay", "channel", "bay", "cipher", "buoy", "ocean", "mouth", "harbor"] as const;

const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: PortolanValue): { referral?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: PortolanValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: PortolanValue): string {
  const row = codeRecord(raw);
  if (row && !("referral" in row)) return "";
  const value = row ? row.referral : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOUSE";
  if (value === false || value === "false" || value === "0" || value === 0) return "CLOSED CODE";
  return clip(value, 48);
}

function codeReadable(raw: PortolanValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("referral" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function portolanState(raw: PortolanValue): PortolanState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known referral is HOUSE, DESK, HALL, or FAIR. A channel contains a hyphen. A bay has a space. A buoy is two characters or fewer. An ocean is twelve characters or longer. A cipher contains a number. */
export function portolanLane(raw: PortolanValue): PortolanLane {
  if (portolanState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (HOUSE_CODES.has(text.toUpperCase())) return "quay";
  if (text.includes("-")) return "channel";
  if (text.includes(" ")) return "bay";
  if (text.length <= 2) return "buoy";
  if (text.length >= 12) return "ocean";
  if (/[0-9]/.test(text)) return "cipher";
  if (/^[aeiou]/i.test(text)) return "mouth";
  return "harbor";
}

export function portolanHue(raw: PortolanValue): PortolanHue {
  const lane = portolanLane(raw);
  if (!lane) return "";
  if (lane === "quay" || lane === "buoy") return "champagne";
  if (lane === "bay" || lane === "channel" || lane === "ocean") return "graphite";
  return "ivory";
}

export function portolanQuay(raw: PortolanValue): boolean {
  return portolanLane(raw) === "quay";
}

export function portolanChannel(raw: PortolanValue): boolean {
  return portolanLane(raw) === "channel";
}

export function portolanBay(raw: PortolanValue): boolean {
  return portolanLane(raw) === "bay";
}

export function portolanCipherLane(raw: PortolanValue): boolean {
  return portolanLane(raw) === "cipher";
}

export function portolanBuoy(raw: PortolanValue): boolean {
  return portolanLane(raw) === "buoy";
}

export function portolanOcean(raw: PortolanValue): boolean {
  return portolanLane(raw) === "ocean";
}

export function portolanMouthLane(raw: PortolanValue): boolean {
  return portolanLane(raw) === "mouth";
}

export function portolanHarbor(raw: PortolanValue): boolean {
  return portolanLane(raw) === "harbor";
}

export function portolanOpen(raw: PortolanValue): boolean {
  return portolanState(raw) === "clear";
}

/** A code the desk can keep without a rewrite: an ocean or a house quay. */
export function portolanHeld(raw: PortolanValue): boolean {
  const lane = portolanLane(raw);
  return lane === "ocean" || lane === "quay";
}

/** A buoy, or a three-character code that is not a quay, still wants a fuller name. */
export function portolanSoon(raw: PortolanValue): boolean {
  if (portolanState(raw) !== "set") return false;
  if (portolanBuoy(raw)) return true;
  if (portolanQuay(raw)) return false;
  return codeGiven(raw).length === 3;
}

export function portolanLength(raw: PortolanValue): number | null {
  if (portolanState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function portolanEven(raw: PortolanValue): boolean {
  const length = portolanLength(raw);
  return length !== null && length % 2 === 0;
}

export function portolanOdd(raw: PortolanValue): boolean {
  const length = portolanLength(raw);
  return length !== null && length % 2 === 1;
}

export function portolanFirst(raw: PortolanValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function portolanTail(raw: PortolanValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function portolanCapital(raw: PortolanValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function portolanSpace(raw: PortolanValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function portolanMouth(raw: PortolanValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function portolanCipher(raw: PortolanValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function portolanLetter(raw: PortolanValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function portolanMixed(raw: PortolanValue): boolean {
  return portolanCipher(raw) && portolanLetter(raw);
}

export function portolanLower(raw: PortolanValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function portolanUpper(raw: PortolanValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function portolanHyphen(raw: PortolanValue): boolean {
  return codeGiven(raw).includes("-");
}

export function portolanPeriod(raw: PortolanValue): boolean {
  return codeGiven(raw).includes(".");
}

export function portolanStamp(raw: PortolanValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function portolanCopy(raw: PortolanValue): string {
  return codeGiven(raw);
}

export function portolanFamily(raw: PortolanValue): string {
  if (portolanState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function portolanLanes(rows: readonly PortolanRow[]): PortolanLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = portolanLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPortolan(rows: readonly PortolanRow[]): string {
  const lines = portolanLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingPortolanHue(rows: readonly PortolanRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = portolanHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function lanePortolanCount(rows: readonly PortolanRow[], lane: PortolanLane): number {
  return rows.filter((row) => portolanLane(row.code) === lane).length;
}

export function portolanShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPortolanLanes(rows: readonly PortolanRow[]): string[] {
  return portolanLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenPortolan(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if (!allow.has(lane) || out.includes(lane)) continue;
    out.push(lane);
  }
  return out;
}

export function readReviewedPortolan(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function togglePortolan(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePortolanReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPortolanReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePortolanLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: PortolanRow, shape: PortolanShape): boolean {
  if (shape === "all") return true;
  if (shape === "quay") return portolanQuay(row.code);
  if (shape === "channel") return portolanChannel(row.code);
  if (shape === "bay") return portolanBay(row.code);
  if (shape === "cipher") return portolanCipherLane(row.code);
  if (shape === "buoy") return portolanBuoy(row.code);
  if (shape === "ocean") return portolanOcean(row.code);
  if (shape === "mouth") return portolanMouthLane(row.code);
  if (shape === "harbor") return portolanHarbor(row.code);
  if (shape === "open") return portolanOpen(row.code);
  if (shape === "soon") return portolanSoon(row.code);
  if (shape === "letter") return portolanLetter(row.code);
  if (shape === "mixed") return portolanMixed(row.code);
  if (shape === "upper") return portolanUpper(row.code);
  if (shape === "lower") return portolanLower(row.code);
  if (shape === "space") return portolanSpace(row.code);
  if (shape === "even") return portolanEven(row.code);
  if (shape === "odd") return portolanOdd(row.code);
  if (shape === "tail") return portolanTail(row.code);
  if (shape === "first") return portolanFirst(row.code);
  if (shape === "held") return portolanHeld(row.code);
  if (shape === "hyphen") return portolanHyphen(row.code);
  if (shape === "period") return portolanPeriod(row.code);
  return portolanLane(row.code) === shape;
}

export function visiblePortolan(
  rows: readonly PortolanRow[],
  lane: string,
  hue: string,
  query: string,
  review: PortolanReview,
  reviewed: readonly string[],
  shape: PortolanShape,
): PortolanRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (portolanState(row.code) === "") return false;
    const found = portolanLane(row.code);
    const hueName = portolanHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${portolanStamp(row.code)} ${portolanFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function portolanLanesCsv(rows: readonly PortolanRow[]): string {
  const lines = ["lane,count"];
  for (const line of portolanLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function portolanRowsCsv(rows: readonly PortolanRow[], reviewed: readonly string[]): string {
  const lines = ["name,referral,stamp,family,lane,hue,length,quay,channel,bay,buoy,even,cipher,mixed,upper,mouth,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(portolanCopy(row.code)),
        portolanStamp(row.code),
        csvCell(portolanFamily(row.code)),
        portolanLane(row.code),
        portolanHue(row.code),
        portolanLength(row.code) ?? "",
        portolanQuay(row.code) ? "1" : "0",
        portolanChannel(row.code) ? "1" : "0",
        portolanBay(row.code) ? "1" : "0",
        portolanBuoy(row.code) ? "1" : "0",
        portolanEven(row.code) ? "1" : "0",
        portolanCipher(row.code) ? "1" : "0",
        portolanMixed(row.code) ? "1" : "0",
        portolanUpper(row.code) ? "1" : "0",
        portolanMouth(row.code) ? "1" : "0",
        portolanTail(row.code) ? "1" : "0",
        portolanHeld(row.code) ? "1" : "0",
        portolanSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
