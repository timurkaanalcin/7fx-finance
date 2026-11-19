/**
 * Grasshopper rules for an escapement kept in this browser, and volvelle plates read the desk already stored on the account.
 * Parts are pallet, arbor, tooth, and cheek. Inks are gilt, ivory, and graphite.
 * Beats are 4, 8, 12, or 16. Spans are 5, 10, or 15.
 * A known desk is AM, PM, DAWN, or DUSK. A hyphen contains a hyphen. A split has a space.
 * A brief name is exactly three characters. A banner is sixteen characters or longer. A figure starts with a digit. A twin repeats a letter.
 * A true desk reads as AM. A false desk reads as NO DESK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_grasshopper (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   smith text not null default '',
 *   part text not null default '',
 *   drop_no integer,
 *   ink text not null default '',
 *   arc_no integer not null default 5,
 *   tags text not null default '',
 *   sprung boolean not null default false,
 *   cocked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_volvelle_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_volvelle_review (
 *   trader_id text primary key
 * );
 */


export const GHP_KEY = "crmv4-grasshopper";
export const GHP_VIEW_KEY = "crmv4-grasshopper-views";
export const GHP_DENSITY_KEY = "crmv4-grasshopper-density";
export const GHP_PARTS = ["pallet", "arbor", "tooth", "cheek"] as const;

export type GrasshopperPart = (typeof GHP_PARTS)[number];
export type GrasshopperInk = "blank" | "gilt" | "ivory" | "graphite";
export type GrasshopperTray = "bench" | "cock" | "case";
export type GrasshopperDensity = "broad" | "tight";
export type GrasshopperSort = "part" | "smith";

export type Grasshopper = {
  id: string;
  title: string;
  note: string;
  smith: string;
  part: string;
  drop: number | null;
  ink: string;
  arc: number;
  tags: string[];
  sprung: boolean;
  cocked: boolean;
  cased: boolean;
  starred: boolean;
  audit: string;
};

export type GrasshopperView = {
  id: string;
  name: string;
  tray: GrasshopperTray;
  query: string;
  smith: string;
  ink: string;
  part: string;
  drop: string;
  arc: string;
};

export type GrasshopperCounts = {
  bench: number;
  cock: number;
  case: number;
  sprung: number;
  inner: number;
  outer: number;
  tall: number;
  quiet: number;
  drop: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND325_FEATURES = [
  "grasshopper-save",
  "notice-center",
  "pallet-parts",
  "quick-search",
  "span-sla",
  "case",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "smith-sort",
  "desk-kpis",
  "pallet-chart",
  "beat-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-smith",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "desk-volvelle",
  "volvelle-csv",
] as const;

const AUDITS = ["save", "edit", "note", "ink", "set", "clear", "cock", "resume", "case", "open", "tag", "arc", "drop", "lower", "star"] as const;
const INKS = ["gilt", "ivory", "graphite"] as const;
const DROP_CYCLE = [4, 8, 12, 16] as const;
const ARC_CYCLE = [5, 10, 15] as const;
const INNER = new Set(["pallet", "arbor"]);
const OUTER = new Set(["tooth", "cheek"]);
const QUIET_INK = new Set(["IVORY", "GRAPHITE"]);
const DESK_CODES = new Set(["AM", "PM", "DAWN", "DUSK"]);
const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];
const CARD_CAP = 20;
const VIEW_CAP = 5;
const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GrasshopperTray {
  return raw === "cock" || raw === "case" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<GrasshopperInk, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<GrasshopperInk, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[gh]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Grasshopper, tray: GrasshopperTray): boolean {
  if (tray === "cock") return card.cocked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.cocked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function partIndex(part: string): number {
  return GHP_PARTS.indexOf(part as GrasshopperPart);
}

function dropIndex(drop: number): number {
  return DROP_CYCLE.indexOf(drop as (typeof DROP_CYCLE)[number]);
}

function arcIndex(arc: number): number {
  return ARC_CYCLE.indexOf(arc as (typeof ARC_CYCLE)[number]);
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

export function grasshopperPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GHP_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A beat is 4, 8, 12, or 16. Anything else stays blank. */
export function grasshopperDrop(raw: unknown): 4 | 8 | 12 | 16 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12" && text !== "16") return null;
  return Number(text) as 4 | 8 | 12 | 16;
}

/** A span is 5, 10, or 15. Anything else stays blank. */
export function grasshopperArc(raw: unknown): 5 | 10 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "15") return null;
  return Number(text) as 5 | 10 | 15;
}

/** An ink is gilt, ivory, or graphite. The saved name is the upper token. */
export function grasshopperInk(raw: unknown): string {
  const text = inkName(raw);
  return text ? text.toUpperCase() : "";
}

export function grasshopperInner(part: unknown): boolean {
  return INNER.has(clip(part, 12).toLowerCase());
}

export function grasshopperOuter(part: unknown): boolean {
  return OUTER.has(clip(part, 12).toLowerCase());
}

/** Pallet is the arm. Arbor is the shaft. Tooth is the cog. Cheek is the jaw. */
export function grasshopperBand(part: unknown): string {
  const text = grasshopperPart(part);
  if (!text) return "";
  if (text === "pallet") return "arm";
  if (text === "arbor") return "shaft";
  if (text === "tooth") return "cog";
  return "jaw";
}

/** Signed distance from one part to another along the grasshopper. */
export function grasshopperGap(from: unknown, to: unknown): number | null {
  const left = partIndex(grasshopperPart(from));
  const right = partIndex(grasshopperPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function quietInk(ink: unknown): boolean {
  return QUIET_INK.has(grasshopperInk(ink));
}

/** A pair span is 10. Five and fifteen are not a pair. */
export function pairArc(arc: unknown): boolean {
  return grasshopperArc(arc) === 10;
}

/** A full span is 15. */
export function fullArc(arc: unknown): boolean {
  return grasshopperArc(arc) === 15;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return grasshopperPart(text) || "all";
}

export function activeDrop(raw: unknown): string {
  const drop = grasshopperDrop(raw);
  return drop === null ? "all" : String(drop);
}

export function activeInk(raw: unknown, allow: readonly string[]): string {
  const text = grasshopperInk(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeArc(raw: unknown): string {
  const arc = grasshopperArc(raw);
  return arc === null ? "all" : String(arc);
}

export function moveGrasshopperFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The ink the bench uses least. A tie keeps ivory, then gilt, then graphite. */
export function suggestInk(cards: readonly Grasshopper[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.ink) continue;
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

/** Before six, suggest one. Morning asks for four. Afternoon asks for seven. Evening asks for ten. A saved drop on the bench wins, and a tie keeps the shorter drop. */
export function suggestDrop(cards: readonly Grasshopper[], hour: number): 4 | 8 | 12 | 16 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.drop === null) continue;
    seen = true;
    counts.set(card.drop, (counts.get(card.drop) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 12 | 16 = 4;
    let score = Number.POSITIVE_INFINITY;
    for (const drop of DROP_CYCLE) {
      const count = counts.get(drop) || 0;
      if (count < score) {
        best = drop;
        score = count;
      }
    }
    return best;
  }
  if (hour < 5) return 4;
  if (hour < 11) return 8;
  if (hour < 17) return 12;
  return 16;
}

/** Before ten, suggest the pallet. The rest of the day suggests the cheek. */
export function suggestPart(hour: number): GrasshopperPart {
  return hour < 10 ? "pallet" : "cheek";
}

/** The smith with the fewest unsprung cards on the bench. A tie keeps the roster order. */
export function fairSmith(cards: readonly Grasshopper[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.sprung);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readGrasshopperRules(raw: unknown): Grasshopper[] {
  if (!Array.isArray(raw)) return [];
  const out: Grasshopper[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Grasshopper>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      smith: clip(row.smith, 24),
      part: grasshopperPart(row.part),
      drop: grasshopperDrop(row.drop),
      ink: grasshopperInk(row.ink),
      arc: grasshopperArc(row.arc) ?? 5,
      tags: tagsOf(row.tags),
      sprung: row.sprung === true,
      cocked: row.cocked === true,
      cased: row.cased === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addGrasshopper(
  cards: readonly Grasshopper[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    smith?: string;
    part?: string;
    drop?: unknown;
    ink?: string;
    arc?: unknown;
    tags?: unknown;
  },
): Grasshopper[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `g${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGrasshopperRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      smith: clip(card.smith, 24),
      part: grasshopperPart(card.part),
      drop: grasshopperDrop(card.drop),
      ink: grasshopperInk(card.ink),
      arc: grasshopperArc(card.arc) ?? 5,
      tags: tagsOf(card.tags),
      sprung: false,
      cocked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Grasshopper[], id: string, edit: (card: Grasshopper) => Grasshopper): Grasshopper[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGrasshopper(cards: readonly Grasshopper[], id: string, title: string): Grasshopper[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGrasshopperNote(cards: readonly Grasshopper[], id: string, note: string): Grasshopper[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleInk(ink: string): string {
  const order = ["", "GILT", "IVORY", "GRAPHITE"];
  const index = order.indexOf(grasshopperInk(ink));
  return order[(index + 1) % order.length] || "GILT";
}

export function setGrasshopperInk(cards: readonly Grasshopper[], id: string, ink: string): Grasshopper[] {
  const next = grasshopperInk(ink);
  return mapCard(cards, id, (card) => (card.ink === next ? card : { ...card, ink: next, audit: "ink" }));
}

export function setGrasshopperSpring(cards: readonly Grasshopper[], id: string, sprung: boolean): Grasshopper[] {
  return mapCard(cards, id, (card) => (card.sprung === sprung ? card : { ...card, sprung, audit: sprung ? "set" : "clear" }));
}

export function setGrasshopperCock(cards: readonly Grasshopper[], id: string, cocked: boolean): Grasshopper[] {
  return mapCard(cards, id, (card) => (card.cocked === cocked ? card : { ...card, cocked, cased: cocked ? false : card.cased, audit: cocked ? "cock" : "resume" }));
}

export function setGrasshopperCase(cards: readonly Grasshopper[], id: string, cased: boolean): Grasshopper[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, cocked: cased ? false : card.cocked, audit: cased ? "case" : "open" }));
}

export function setGrasshopperStar(cards: readonly Grasshopper[], id: string, starred: boolean): Grasshopper[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addGrasshopperTag(cards: readonly Grasshopper[], id: string, tag: string): Grasshopper[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDrop(drop: number | null, dir: 1 | -1): 4 | 8 | 12 | 16 {
  if (drop === null) return dir > 0 ? 4 : 16;
  const index = dropIndex(drop);
  const next = index < 0 ? 0 : (index + dir + DROP_CYCLE.length) % DROP_CYCLE.length;
  return DROP_CYCLE[next];
}

function stepArc(arc: number, dir: 1 | -1): 5 | 10 | 15 {
  const index = arcIndex(arc);
  const next = index < 0 ? 0 : (index + dir + ARC_CYCLE.length) % ARC_CYCLE.length;
  return ARC_CYCLE[next];
}

export function liftDrop(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, 1), audit: "drop" }));
}

export function lowerDrop(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return mapCard(cards, id, (card) => ({ ...card, drop: stepDrop(card.drop, -1), audit: "lower" }));
}

export function raiseArc(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return mapCard(cards, id, (card) => ({ ...card, arc: stepArc(card.arc, 1), audit: "arc" }));
}

export function lowerArc(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return mapCard(cards, id, (card) => ({ ...card, arc: stepArc(card.arc, -1), audit: "arc" }));
}

export function setGrasshopperFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sprung: !card.sprung, audit: card.sprung ? "clear" : "set" })) : [...cards];
}

export function cockGrasshopperFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return setGrasshopperCock(cards, id, !cards.find((card) => card.id === id)?.cocked);
}

export function starGrasshopperFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return setGrasshopperStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function inkFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGrasshopperInk(cards, id, cycleInk(card.ink)) : [...cards];
}

export function liftDropFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return liftDrop(cards, id);
}

export function lowerDropFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return lowerDrop(cards, id);
}

export function raiseArcFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return raiseArc(cards, id);
}

export function lowerArcFocused(cards: readonly Grasshopper[], id: string): Grasshopper[] {
  return lowerArc(cards, id);
}

function bulk(cards: readonly Grasshopper[], ids: readonly string[], edit: (card: Grasshopper) => Grasshopper): Grasshopper[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGrasshopperGraphite(cards: readonly Grasshopper[], ids: readonly string[]): Grasshopper[] {
  return bulk(cards, ids, (card) => (card.ink === "GRAPHITE" ? card : { ...card, ink: "GRAPHITE", audit: "ink" }));
}

export function bulkGrasshopperSpring(cards: readonly Grasshopper[], ids: readonly string[]): Grasshopper[] {
  return bulk(cards, ids, (card) => (card.sprung ? card : { ...card, sprung: true, audit: "set" }));
}

export function bulkGrasshopperCase(cards: readonly Grasshopper[], ids: readonly string[]): Grasshopper[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, cocked: false, audit: "case" }));
}

export function bulkGrasshopperTag(cards: readonly Grasshopper[], ids: readonly string[]): Grasshopper[] {
  return bulk(cards, ids, (card) => (card.tags.includes("r") ? card : { ...card, tags: tagsOf([...card.tags, "h"]), audit: "tag" }));
}

export function readGrasshopperViews(raw: unknown): GrasshopperView[] {
  if (!Array.isArray(raw)) return [];
  const out: GrasshopperView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GrasshopperView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      smith: clip(row.smith, 24),
      ink: activeInk(row.ink, ["GILT", "IVORY", "GRAPHITE"]),
      part: activePart(row.part),
      drop: activeDrop(row.drop),
      arc: activeArc(row.arc),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGrasshopperView(views: readonly GrasshopperView[], view: GrasshopperView): GrasshopperView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGrasshopperViews([...views, { ...view, id, name }]);
}

export function dropGrasshopperView(views: readonly GrasshopperView[], id: string): GrasshopperView[] {
  return views.filter((view) => view.id !== id);
}

export function grasshopperDensity(raw: unknown): GrasshopperDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortGrasshopperRules(cards: readonly Grasshopper[], sort: GrasshopperSort): Grasshopper[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "smith") {
      const smith = a.smith.localeCompare(b.smith);
      if (smith) return smith;
    } else {
      const part = partIndex(a.part) - partIndex(b.part);
      if (part) return part;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleGrasshopperRules(
  cards: readonly Grasshopper[],
  tray: GrasshopperTray,
  query: string,
  smith: string,
  ink: string,
  part: string,
  drop: string,
  arc: string,
): Grasshopper[] {
  const text = query.trim().toLowerCase();
  const wantSmith = clip(smith, 24).toLowerCase();
  const wantInk = ink === "all" ? "" : grasshopperInk(ink);
  const wantPart = activePart(part);
  const wantDrop = activeDrop(drop);
  const wantArc = activeArc(arc);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.smith}`.toLowerCase().includes(text)) return false;
    if (wantSmith && card.smith.toLowerCase() !== wantSmith) return false;
    if (wantInk && card.ink !== wantInk) return false;
    if (wantPart === "inner" && !grasshopperInner(card.part)) return false;
    if (wantPart === "outer" && !grasshopperOuter(card.part)) return false;
    if (wantPart !== "all" && wantPart !== "inner" && wantPart !== "outer" && card.part !== wantPart) return false;
    if (wantDrop !== "all" && String(card.drop ?? "") !== wantDrop) return false;
    if (wantArc !== "all" && String(card.arc) !== wantArc) return false;
    return true;
  });
}

/** An outer part on arc four, still unsprung and not in the case, is overdue. */
export function overdueGrasshopper(card: Grasshopper): boolean {
  return grasshopperOuter(card.part) && card.arc === 5 && !card.sprung && !card.cased;
}

/** No ink, the short drop, arc four, and still on the bench. */
export function idleGrasshopper(card: Grasshopper): boolean {
  return !card.ink && card.drop === 4 && card.arc === 5 && !card.sprung && !card.cocked && !card.cased;
}

/** Gilt, a tall drop, and a full arc, still out of the case. */
export function briskGrasshopper(card: Grasshopper): boolean {
  return card.ink === "GILT" && card.drop === 16 && card.arc === 15 && !card.cased;
}

/** Cheek, ivory, and beat eight. */
export function restingGrasshopper(card: Grasshopper): boolean {
  return card.part === "cheek" && card.ink === "IVORY" && card.drop === 8;
}

/** A pallet is late when the desk is already on the cheek. */
export function lateGrasshopper(card: Grasshopper, desk: string): boolean {
  return card.part === "pallet" && grasshopperPart(desk) === "cheek" && !card.sprung;
}

export function grasshopperCounts(cards: readonly Grasshopper[], shown: readonly Grasshopper[], desk: string): GrasshopperCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    cock: cards.filter((card) => inTray(card, "cock")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    sprung: cards.filter((card) => card.sprung).length,
    inner: cards.filter((card) => grasshopperInner(card.part)).length,
    outer: cards.filter((card) => grasshopperOuter(card.part)).length,
    tall: cards.filter((card) => card.drop === 16).length,
    quiet: cards.filter((card) => quietInk(card.ink)).length,
    drop: cards.reduce((sum, card) => sum + (card.drop || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleGrasshopper).length,
    brisk: cards.filter(briskGrasshopper).length,
    resting: cards.filter(restingGrasshopper).length,
    overdue: cards.filter(overdueGrasshopper).length,
    pair: cards.filter((card) => pairArc(card.arc) && lateGrasshopper(card, desk)).length,
  };
}

export function grasshopperBars(cards: readonly Grasshopper[]): { part: string; count: number }[] {
  return GHP_PARTS.map((part) => ({ part, count: cards.filter((card) => card.part === part && !card.cased).length }));
}

export function grasshopperTimeline(cards: readonly Grasshopper[]): { drop: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return DROP_CYCLE.map((drop) => ({ drop, titles: open.filter((card) => card.drop === drop).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function grasshopperSmiths(cards: readonly Grasshopper[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.smith && !out.some((name) => name.toLowerCase() === card.smith.toLowerCase())) out.push(card.smith);
  }
  return out;
}

export function busiestSmith(cards: readonly Grasshopper[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.sprung && card.smith);
  let best = "";
  let score = 0;
  for (const name of grasshopperSmiths(open)) {
    const count = open.filter((card) => card.smith.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGrasshopperRules(cards: readonly Grasshopper[]): string[] {
  return cards.filter(overdueGrasshopper).map((card) => card.title);
}

export function grasshopperCopy(card: Grasshopper): string {
  return [card.title, card.smith, card.part, card.ink, card.drop ?? "", card.arc, card.note].filter((item) => item !== "").join(" · ");
}

export function grasshopperCsv(cards: readonly Grasshopper[], desk: string): string {
  const lines = ["title,smith,part,ink,drop,arc,tags,sprung,cock,case,starred,outer,late,idle,brisk,resting,overdue,inner,quiet,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.smith),
        card.part,
        card.ink,
        card.drop ?? "",
        card.arc,
        card.tags.join(" "),
        card.sprung ? "1" : "0",
        card.cocked ? "1" : "0",
        card.cased ? "1" : "0",
        card.starred ? "1" : "0",
        grasshopperOuter(card.part) ? "1" : "0",
        lateGrasshopper(card, desk) ? "1" : "0",
        idleGrasshopper(card) ? "1" : "0",
        briskGrasshopper(card) ? "1" : "0",
        restingGrasshopper(card) ? "1" : "0",
        overdueGrasshopper(card) ? "1" : "0",
        grasshopperInner(card.part) ? "1" : "0",
        quietInk(card.ink) ? "1" : "0",
        grasshopperBand(card.part),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const VVL_KEY = "crmv4-volvelle-hide";
export const VVL_REVIEW_KEY = "crmv4-volvelle-review";

export type VolvelleLane = "" | "cardinal" | "hyphen" | "split" | "figure" | "brief" | "banner" | "twin" | "coast";
export type VolvelleHue = "" | "ivory" | "graphite" | "champagne";
export type VolvelleState = "" | "clear" | "set";
export type VolvelleReview = "all" | "reviewed" | "fresh";
export type VolvelleShape =
  | "all"
  | "cardinal"
  | "hyphen"
  | "split"
  | "figure"
  | "brief"
  | "banner"
  | "twin"
  | "coast"
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
  | "held";

export type VolvelleValue = string | { desk?: unknown; [key: string]: unknown } | null | undefined;
export type VolvelleRow = { id: string; label: string; code: VolvelleValue };
export type VolvelleLaneLine = { lane: string; count: number };

const CODE_LANES = ["cardinal", "hyphen", "split", "figure", "brief", "banner", "twin", "coast"] as const;
const CODE_HUES = ["champagne", "ivory", "graphite"] as const;

function codeRecord(raw: VolvelleValue): { desk?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function codeBlocked(raw: VolvelleValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function codeGiven(raw: VolvelleValue): string {
  const row = codeRecord(raw);
  if (row && !("desk" in row)) return "";
  const value = row ? row.desk : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "AM";
  if (value === false || value === "false" || value === "0" || value === 0) return "NO DESK";
  return clip(value, 48);
}

function codeReadable(raw: VolvelleValue): boolean {
  if (codeBlocked(raw)) return false;
  const row = codeRecord(raw);
  if (row && !("desk" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function volvelleState(raw: VolvelleValue): VolvelleState {
  if (!codeReadable(raw)) return "";
  return codeGiven(raw) ? "set" : "clear";
}

/** A known desk is AM, PM, DAWN, or DUSK. A hyphen contains a hyphen. A split has a space. A brief name is exactly three characters. A banner is sixteen characters or longer. A figure starts with a digit. A twin repeats a letter. */
export function volvelleLane(raw: VolvelleValue): VolvelleLane {
  if (volvelleState(raw) !== "set") return "";
  const text = codeGiven(raw);
  if (DESK_CODES.has(text.toUpperCase())) return "cardinal";
  if (text.includes("-")) return "hyphen";
  if (text.includes(" ")) return "split";
  if (text.length === 3) return "brief";
  if (text.length >= 16) return "banner";
  if (/^[0-9]/.test(text)) return "figure";
  if (/([A-Za-z])\1/.test(text)) return "twin";
  return "coast";
}

export function volvelleHue(raw: VolvelleValue): VolvelleHue {
  const lane = volvelleLane(raw);
  if (!lane) return "";
  if (lane === "cardinal" || lane === "figure") return "champagne";
  if (lane === "hyphen" || lane === "split") return "graphite";
  return "ivory";
}

export function volvelleCardinal(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "cardinal";
}

export function volvelleHyphen(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "hyphen";
}

export function volvelleSplit(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "split";
}

export function volvelleFigure(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "figure";
}

export function volvelleBrief(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "brief";
}

export function volvelleBanner(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "banner";
}

export function volvelleTwin(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "twin";
}

export function volvelleCoast(raw: VolvelleValue): boolean {
  return volvelleLane(raw) === "coast";
}

export function volvelleOpen(raw: VolvelleValue): boolean {
  return volvelleState(raw) === "clear";
}

/** A banner or a twin name can stay as written. */
export function volvelleHeld(raw: VolvelleValue): boolean {
  const lane = volvelleLane(raw);
  return lane === "banner" || lane === "twin";
}

/** A brief name, or a five-character name that is not a known desk, still wants a fuller name. */
export function volvelleSoon(raw: VolvelleValue): boolean {
  if (volvelleState(raw) !== "set") return false;
  if (volvelleBrief(raw)) return true;
  if (volvelleCardinal(raw)) return false;
  return codeGiven(raw).length === 5;
}

export function volvelleLength(raw: VolvelleValue): number | null {
  if (volvelleState(raw) !== "set") return null;
  return codeGiven(raw).length;
}

export function volvelleEven(raw: VolvelleValue): boolean {
  const length = volvelleLength(raw);
  return length !== null && length % 2 === 0;
}

export function volvelleOdd(raw: VolvelleValue): boolean {
  const length = volvelleLength(raw);
  return length !== null && length % 2 === 1;
}

export function volvelleFirst(raw: VolvelleValue): boolean {
  return /^[A-Za-z]/.test(codeGiven(raw));
}

export function volvelleTail(raw: VolvelleValue): boolean {
  return /[0-9]$/.test(codeGiven(raw));
}

export function volvelleCapital(raw: VolvelleValue): boolean {
  return /[A-Z]/.test(codeGiven(raw));
}

export function volvelleSpace(raw: VolvelleValue): boolean {
  return codeGiven(raw).includes(" ");
}

export function volvelleVowel(raw: VolvelleValue): boolean {
  return /^[aeiou]/i.test(codeGiven(raw));
}

export function volvelleDigit(raw: VolvelleValue): boolean {
  return /[0-9]/.test(codeGiven(raw));
}

export function volvelleLetter(raw: VolvelleValue): boolean {
  return /[A-Za-z]/.test(codeGiven(raw));
}

export function volvelleMixed(raw: VolvelleValue): boolean {
  return volvelleDigit(raw) && volvelleLetter(raw);
}

export function volvelleLower(raw: VolvelleValue): boolean {
  const text = codeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is six letters or more, written entirely in capitals. */
export function volvelleUpper(raw: VolvelleValue): boolean {
  const text = codeGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function volvelleStamp(raw: VolvelleValue): string {
  const text = codeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function volvelleCopy(raw: VolvelleValue): string {
  return codeGiven(raw);
}

export function volvelleFamily(raw: VolvelleValue): string {
  if (volvelleState(raw) !== "set") return "";
  return firstToken(codeGiven(raw));
}

export function volvelleLanes(rows: readonly VolvelleRow[]): VolvelleLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CODE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = volvelleLane(row.code);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CODE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingVolvelle(rows: readonly VolvelleRow[]): string {
  const lines = volvelleLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CODE_LANES.indexOf(a.lane as (typeof CODE_LANES)[number]) - CODE_LANES.indexOf(b.lane as (typeof CODE_LANES)[number]))[0].lane;
}

export function leadingVolvelleHue(rows: readonly VolvelleRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CODE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = volvelleHue(row.code);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CODE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CODE_HUES.indexOf(a.hue) - CODE_HUES.indexOf(b.hue))[0].hue;
}

export function laneVolvelleCount(rows: readonly VolvelleRow[], lane: VolvelleLane): number {
  return rows.filter((row) => volvelleLane(row.code) === lane).length;
}

export function volvelleShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentVolvelleLanes(rows: readonly VolvelleRow[]): string[] {
  return volvelleLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenVolvelle(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedVolvelle(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleVolvelle(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleVolvelleReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkVolvelleReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleVolvelleLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: VolvelleRow, shape: VolvelleShape): boolean {
  if (shape === "all") return true;
  if (shape === "cardinal") return volvelleCardinal(row.code);
  if (shape === "hyphen") return volvelleHyphen(row.code);
  if (shape === "split") return volvelleSplit(row.code);
  if (shape === "figure") return volvelleFigure(row.code);
  if (shape === "brief") return volvelleBrief(row.code);
  if (shape === "banner") return volvelleBanner(row.code);
  if (shape === "twin") return volvelleTwin(row.code);
  if (shape === "coast") return volvelleCoast(row.code);
  if (shape === "open") return volvelleOpen(row.code);
  if (shape === "soon") return volvelleSoon(row.code);
  if (shape === "letter") return volvelleLetter(row.code);
  if (shape === "mixed") return volvelleMixed(row.code);
  if (shape === "upper") return volvelleUpper(row.code);
  if (shape === "lower") return volvelleLower(row.code);
  if (shape === "space") return volvelleSpace(row.code);
  if (shape === "even") return volvelleEven(row.code);
  if (shape === "odd") return volvelleOdd(row.code);
  if (shape === "tail") return volvelleTail(row.code);
  if (shape === "first") return volvelleFirst(row.code);
  if (shape === "held") return volvelleHeld(row.code);
  return volvelleLane(row.code) === shape;
}

export function visibleVolvelle(
  rows: readonly VolvelleRow[],
  lane: string,
  hue: string,
  query: string,
  review: VolvelleReview,
  reviewed: readonly string[],
  shape: VolvelleShape,
): VolvelleRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (volvelleState(row.code) === "") return false;
    const found = volvelleLane(row.code);
    const hueName = volvelleHue(row.code);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${codeGiven(row.code)} ${volvelleStamp(row.code)} ${volvelleFamily(row.code)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function volvelleLanesCsv(rows: readonly VolvelleRow[]): string {
  const lines = ["lane,count"];
  for (const line of volvelleLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function volvelleRowsCsv(rows: readonly VolvelleRow[], reviewed: readonly string[]): string {
  const lines = ["name,desk,stamp,family,lane,hue,length,cardinal,hyphen,split,brief,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(volvelleCopy(row.code)),
        volvelleStamp(row.code),
        csvCell(volvelleFamily(row.code)),
        volvelleLane(row.code),
        volvelleHue(row.code),
        volvelleLength(row.code) ?? "",
        volvelleCardinal(row.code) ? "1" : "0",
        volvelleHyphen(row.code) ? "1" : "0",
        volvelleSplit(row.code) ? "1" : "0",
        volvelleBrief(row.code) ? "1" : "0",
        volvelleEven(row.code) ? "1" : "0",
        volvelleDigit(row.code) ? "1" : "0",
        volvelleMixed(row.code) ? "1" : "0",
        volvelleUpper(row.code) ? "1" : "0",
        volvelleVowel(row.code) ? "1" : "0",
        volvelleTail(row.code) ? "1" : "0",
        volvelleHeld(row.code) ? "1" : "0",
        volvelleSoon(row.code) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
