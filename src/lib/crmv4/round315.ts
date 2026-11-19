/**
 * Analemma rules for a sun figure kept in this browser, and glyph plates read the sale stage already stored on the account.
 * Parts are rise, noon, dusk, and night. Metals are gilt, ivory, and slate.
 * Drips are 5, 10, 20, or 40. Beads are 1, 3, or 9.
 * A known sale stage is NEW, WARM, HOT, or WON. A dash contains a hyphen. A gap has a space.
 * A drop is three characters or fewer. A tide is sixteen characters or longer. A cipher contains a number.
 * A true sale stage reads as NEW. A false sale stage reads as COLD STAGE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_analemma (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   staff text not null default '',
 *   metal text not null default '',
 *   drip_no integer,
 *   bead_no integer not null default 1,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   racked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_glyph_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_glyph_review (
 *   trader_id text primary key
 * );
 */



export const ALM_KEY = "crmv4-analemma";
export const ALM_VIEW_KEY = "crmv4-analemma-views";
export const ALM_DENSITY_KEY = "crmv4-analemma-density";
export const ALM_STAVES = ["rise", "noon", "dusk", "night"] as const;

export type AnalemmaStaff = (typeof ALM_STAVES)[number];

export type AnalemmaWood = "blank" | "ash" | "elm" | "box";

export type AnalemmaTray = "yard" | "rack" | "case";

export type AnalemmaDensity = "broad" | "tight";

export type AnalemmaSort = "staff" | "bearer";

export type Analemma = {
  id: string;
  title: string;
  note: string;
  bearer: string;
  staff: string;
  notch: number | null;
  wood: string;
  vane: number;
  tags: string[];
  sighted: boolean;
  racked: boolean;
  cased: boolean;
  starred: boolean;
  audit: string;
};

export type AnalemmaView = {
  id: string;
  name: string;
  tray: AnalemmaTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type AnalemmaCounts = {
  court: number;
  rack: number;
  vault: number;
  sighted: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  notch: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND315_FEATURES = [
  "analemma-save",
  "notes",
  "day-parts",
  "gilt-metal",
  "sla-hour",
  "vault",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "keeper-sort",
  "desk-kpis",
  "part-chart",
  "hour-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-keeper",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "sale-glyphs",
  "glyph-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["gilt", "ivory", "slate"] as const;

const NOTCH_CYCLE = [5, 10, 20, 40] as const;

const VANE_CYCLE = [1, 3, 9] as const;

const INNER = new Set(["rise", "noon"]);

const OUTER = new Set(["dusk", "night"]);

const HOUSE_WEAVE = new Set(["GILT", "SLATE"]);

const HOUSE_STATUSES = new Set(["NEW", "WARM", "HOT", "WON"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): AnalemmaTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<AnalemmaWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<AnalemmaWood, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ef]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Analemma, tray: AnalemmaTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return ALM_STAVES.indexOf(staff as AnalemmaStaff);
}

function notchIndex(notch: number): number {
  return NOTCH_CYCLE.indexOf(notch as (typeof NOTCH_CYCLE)[number]);
}

function vaneIndex(vane: number): number {
  return VANE_CYCLE.indexOf(vane as (typeof VANE_CYCLE)[number]);
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

export function analemmaStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (ALM_STAVES as readonly string[]).includes(text) ? text : "";
}

/** An hour is 6, 9, 12, or 15. Anything else stays blank. */
export function analemmaNotch(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A mark is 2, 4, or 8. Anything else stays blank. */
export function analemmaVane(raw: unknown): 1 | 3 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "9") return null;
  return Number(text) as 1 | 3 | 9;
}

/** A wood is marble, slate, or chalk. The saved name is the upper token. */
export function analemmaWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function analemmaInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function analemmaOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Rise is the dawn. Noon is the zenith. Dusk is the ember. Night is the dark. */
export function analemmaBand(staff: unknown): string {
  const text = analemmaStaff(staff);
  if (!text) return "";
  if (text === "rise") return "dawn";
  if (text === "noon") return "zenith";
  if (text === "dusk") return "ember";
  return "dark";
}

/** Signed distance from one watch to another along the analemma. */
export function analemmaGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(analemmaStaff(from));
  const right = staffIndex(analemmaStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(analemmaWood(wood));
}

/** A pair mark is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return analemmaVane(vane) === 3;
}

/** A full mark is 8. */
export function fullVane(vane: unknown): boolean {
  return analemmaVane(vane) === 9;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return analemmaStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = analemmaNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = analemmaWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = analemmaVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveAnalemmaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the frame uses least. A tie keeps chalk, then marble, then slate. */
export function suggestWood(cards: readonly Analemma[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "SLATE";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["SLATE", "GILT", "IVORY"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest five. Morning asks for ten. Afternoon asks for fifteen. Evening asks for twenty. A saved rung on the leg wins, and a tie keeps the taller rung. */
export function suggestNotch(cards: readonly Analemma[], hour: number): 5 | 10 | 20 | 40 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.notch === null) continue;
    seen = true;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  if (seen) {
    let best: 5 | 10 | 20 | 40 = 40;
    let score = Number.POSITIVE_INFINITY;
    for (const notch of [...NOTCH_CYCLE].reverse()) {
      const count = counts.get(notch) || 0;
      if (count < score) {
        best = notch;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 5;
  if (hour < 11) return 10;
  if (hour < 16) return 20;
  return 40;
}

/** Before six, suggest the lip. The rest of the day suggests the dark. */
export function suggestStaff(hour: number): AnalemmaStaff {
  return hour < 7 ? "rise" : "night";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Analemma[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readAnalemmaRules(raw: unknown): Analemma[] {
  if (!Array.isArray(raw)) return [];
  const out: Analemma[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Analemma>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: analemmaStaff(row.staff),
      notch: analemmaNotch(row.notch),
      wood: analemmaWood(row.wood),
      vane: analemmaVane(row.vane) ?? 1,
      tags: tagsOf(row.tags),
      sighted: row.sighted === true,
      racked: row.racked === true,
      cased: row.cased === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addAnalemma(
  cards: readonly Analemma[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    bearer?: string;
    staff?: string;
    notch?: unknown;
    wood?: string;
    vane?: unknown;
    tags?: unknown;
  },
): Analemma[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `k${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readAnalemmaRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: analemmaStaff(card.staff),
      notch: analemmaNotch(card.notch),
      wood: analemmaWood(card.wood),
      vane: analemmaVane(card.vane) ?? 1,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Analemma[], id: string, edit: (card: Analemma) => Analemma): Analemma[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editAnalemma(cards: readonly Analemma[], id: string, title: string): Analemma[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editAnalemmaNote(cards: readonly Analemma[], id: string, note: string): Analemma[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "GILT", "IVORY", "SLATE"];
  const index = order.indexOf(analemmaWood(wood));
  return order[(index + 1) % order.length] || "GILT";
}

export function setAnalemmaWood(cards: readonly Analemma[], id: string, wood: string): Analemma[] {
  const next = analemmaWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setAnalemmaSighted(cards: readonly Analemma[], id: string, sighted: boolean): Analemma[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setAnalemmaRack(cards: readonly Analemma[], id: string, racked: boolean): Analemma[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setAnalemmaVault(cards: readonly Analemma[], id: string, cased: boolean): Analemma[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setAnalemmaStar(cards: readonly Analemma[], id: string, starred: boolean): Analemma[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addAnalemmaTag(cards: readonly Analemma[], id: string, tag: string): Analemma[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNotch(notch: number | null, dir: 1 | -1): 5 | 10 | 20 | 40 {
  if (notch === null) return dir > 0 ? 5 : 40;
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepVane(vane: number, dir: 1 | -1): 1 | 3 | 9 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftNotch(cards: readonly Analemma[], id: string): Analemma[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Analemma[], id: string): Analemma[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Analemma[], id: string): Analemma[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Analemma[], id: string): Analemma[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setAnalemmaFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackAnalemmaFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return setAnalemmaRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starAnalemmaFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return setAnalemmaStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagAnalemmaFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return addAnalemmaTag(cards, id, "e");
}

export function woodFocused(cards: readonly Analemma[], id: string): Analemma[] {
  const card = cards.find((item) => item.id === id);
  return card ? setAnalemmaWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Analemma[], id: string): Analemma[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Analemma[], ids: readonly string[], edit: (card: Analemma) => Analemma): Analemma[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkAnalemmaOak(cards: readonly Analemma[], ids: readonly string[]): Analemma[] {
  return bulk(cards, ids, (card) => (card.wood === "SLATE" ? card : { ...card, wood: "SLATE", audit: "wood" }));
}

export function bulkAnalemmaSighted(cards: readonly Analemma[], ids: readonly string[]): Analemma[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkAnalemmaVault(cards: readonly Analemma[], ids: readonly string[]): Analemma[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkAnalemmaTag(cards: readonly Analemma[], ids: readonly string[]): Analemma[] {
  return bulk(cards, ids, (card) => (card.tags.includes("f") ? card : { ...card, tags: tagsOf([...card.tags, "f"]), audit: "tag" }));
}

export function readAnalemmaViews(raw: unknown): AnalemmaView[] {
  if (!Array.isArray(raw)) return [];
  const out: AnalemmaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<AnalemmaView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["GILT", "IVORY", "SLATE"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addAnalemmaView(views: readonly AnalemmaView[], view: AnalemmaView): AnalemmaView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readAnalemmaViews([...views, { ...view, id, name }]);
}

export function dropAnalemmaView(views: readonly AnalemmaView[], id: string): AnalemmaView[] {
  return views.filter((view) => view.id !== id);
}

export function analemmaDensity(raw: unknown): AnalemmaDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortAnalemmaRules(cards: readonly Analemma[], sort: AnalemmaSort): Analemma[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "bearer") {
      const bearer = a.bearer.localeCompare(b.bearer);
      if (bearer) return bearer;
    } else {
      const staff = staffIndex(a.staff) - staffIndex(b.staff);
      if (staff) return staff;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleAnalemmaRules(
  cards: readonly Analemma[],
  tray: AnalemmaTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Analemma[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : analemmaWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !analemmaInner(card.staff)) return false;
    if (wantStaff === "outer" && !analemmaOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer leg on ember one, still unlevelled and not in the chest, is overdue. */
export function overdueAnalemma(card: Analemma): boolean {
  return analemmaOuter(card.staff) && card.vane === 1 && !card.sighted && !card.cased;
}

/** No wood, the short rung, ember one, and still on the yard. */
export function idleAnalemma(card: Analemma): boolean {
  return !card.wood && card.notch === 5 && card.vane === 1 && !card.sighted && !card.racked && !card.cased;
}

/** Pine, a tall rung, and a full ember, still out of the chest. */
export function briskAnalemma(card: Analemma): boolean {
  return card.wood === "SLATE" && card.notch === 40 && card.vane === 9 && !card.cased;
}

/** Foot, slate, and rung ten. */
export function restingAnalemma(card: Analemma): boolean {
  return card.staff === "night" && card.wood === "IVORY" && card.notch === 10;
}

/** A lip is late when the desk is already on the dark. */
export function lateAnalemma(card: Analemma, desk: string): boolean {
  return card.staff === "rise" && analemmaStaff(desk) === "night" && !card.sighted;
}

export function analemmaCounts(cards: readonly Analemma[], shown: readonly Analemma[], desk: string): AnalemmaCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => analemmaInner(card.staff)).length,
    outer: cards.filter((card) => analemmaOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 40).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleAnalemma).length,
    brisk: cards.filter(briskAnalemma).length,
    resting: cards.filter(restingAnalemma).length,
    overdue: cards.filter(overdueAnalemma).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateAnalemma(card, desk)).length,
  };
}

export function analemmaBars(cards: readonly Analemma[]): { staff: string; count: number }[] {
  return ALM_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function analemmaTimeline(cards: readonly Analemma[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function analemmaBearers(cards: readonly Analemma[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Analemma[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of analemmaBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderAnalemmaRules(cards: readonly Analemma[]): string[] {
  return cards.filter(overdueAnalemma).map((card) => card.title);
}

export function analemmaCopy(card: Analemma): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function analemmaCsv(cards: readonly Analemma[], desk: string): string {
  const lines = ["title,keeper,part,stone,hour,mark,tags,seated,hook,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.bearer),
        card.staff,
        card.wood,
        card.notch ?? "",
        card.vane,
        card.tags.join(" "),
        card.sighted ? "1" : "0",
        card.racked ? "1" : "0",
        card.cased ? "1" : "0",
        card.starred ? "1" : "0",
        analemmaOuter(card.staff) ? "1" : "0",
        lateAnalemma(card, desk) ? "1" : "0",
        idleAnalemma(card) ? "1" : "0",
        briskAnalemma(card) ? "1" : "0",
        restingAnalemma(card) ? "1" : "0",
        overdueAnalemma(card) ? "1" : "0",
        analemmaInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        analemmaBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const GLY_KEY = "crmv4-glyph-hide";
export const GLY_REVIEW_KEY = "crmv4-glyph-review";

export type GlyphLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type GlyphHue = "" | "ivory" | "graphite" | "champagne";

export type GlyphState = "" | "clear" | "set";

export type GlyphReview = "all" | "reviewed" | "fresh";

export type GlyphShape =
  | "all"
  | "house"
  | "fort"
  | "harbor"
  | "digit"
  | "spark"
  | "scroll"
  | "vowel"
  | "post"
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
  | "cased"
  | "hyphen"
  | "period";

export type GlyphValue = string | { saleStatus?: unknown; [key: string]: unknown } | null | undefined;

export type GlyphRow = { id: string; label: string; glyph: GlyphValue };

export type GlyphLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function glyphRecord(raw: GlyphValue): { saleStatus?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function glyphBlocked(raw: GlyphValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function glyphGiven(raw: GlyphValue): string {
  const row = glyphRecord(raw);
  if (row && !("saleStatus" in row)) return "";
  const value = row ? row.saleStatus : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NEW";
  if (value === false || value === "false" || value === "0" || value === 0) return "COLD STAGE";
  return clip(value, 48);
}

function glyphReadable(raw: GlyphValue): boolean {
  if (glyphBlocked(raw)) return false;
  const row = glyphRecord(raw);
  if (row && !("saleStatus" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function glyphState(raw: GlyphValue): GlyphState {
  if (!glyphReadable(raw)) return "";
  return glyphGiven(raw) ? "set" : "clear";
}

/** A known address is NEW, WARM, HOT, or WON. A dash contains a hyphen. A gap has a space. A cipher contains a number. A drop is three characters or fewer. A tide is sixteen characters or longer. */
export function glyphLane(raw: GlyphValue): GlyphLane {
  if (glyphState(raw) !== "set") return "";
  const text = glyphGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (text.length <= 3) return "spark";
  if (text.length >= 16) return "scroll";
  if (/[0-9]/.test(text)) return "digit";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function glyphHue(raw: GlyphValue): GlyphHue {
  const lane = glyphLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function glyphHouse(raw: GlyphValue): boolean {
  return glyphLane(raw) === "house";
}

export function glyphFort(raw: GlyphValue): boolean {
  return glyphLane(raw) === "fort";
}

export function glyphHarbor(raw: GlyphValue): boolean {
  return glyphLane(raw) === "harbor";
}

export function glyphDigitLane(raw: GlyphValue): boolean {
  return glyphLane(raw) === "digit";
}

export function glyphSpark(raw: GlyphValue): boolean {
  return glyphLane(raw) === "spark";
}

export function glyphScroll(raw: GlyphValue): boolean {
  return glyphLane(raw) === "scroll";
}

export function glyphVowelLane(raw: GlyphValue): boolean {
  return glyphLane(raw) === "vowel";
}

export function glyphPost(raw: GlyphValue): boolean {
  return glyphLane(raw) === "post";
}

export function glyphOpen(raw: GlyphValue): boolean {
  return glyphState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function glyphHeld(raw: GlyphValue): boolean {
  const lane = glyphLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function glyphSoon(raw: GlyphValue): boolean {
  if (glyphState(raw) !== "set") return false;
  if (glyphSpark(raw)) return true;
  if (glyphHouse(raw)) return false;
  const length = glyphGiven(raw).length;
  return length > 0 && length <= 2;
}

export function glyphLength(raw: GlyphValue): number | null {
  if (glyphState(raw) !== "set") return null;
  return glyphGiven(raw).length;
}

export function glyphEven(raw: GlyphValue): boolean {
  const length = glyphLength(raw);
  return length !== null && length % 2 === 0;
}

export function glyphOdd(raw: GlyphValue): boolean {
  const length = glyphLength(raw);
  return length !== null && length % 2 === 1;
}

export function glyphFirst(raw: GlyphValue): boolean {
  return /^[A-Za-z]/.test(glyphGiven(raw));
}

export function glyphTail(raw: GlyphValue): boolean {
  return /[0-9]$/.test(glyphGiven(raw));
}

export function glyphCapital(raw: GlyphValue): boolean {
  return /[A-Z]/.test(glyphGiven(raw));
}

export function glyphSpace(raw: GlyphValue): boolean {
  return glyphGiven(raw).includes(" ");
}

export function glyphVowel(raw: GlyphValue): boolean {
  return /^[aeiou]/i.test(glyphGiven(raw));
}

export function glyphDigit(raw: GlyphValue): boolean {
  return /[0-9]/.test(glyphGiven(raw));
}

export function glyphLetter(raw: GlyphValue): boolean {
  return /[A-Za-z]/.test(glyphGiven(raw));
}

export function glyphMixed(raw: GlyphValue): boolean {
  return glyphDigit(raw) && glyphLetter(raw);
}

export function glyphLower(raw: GlyphValue): boolean {
  const text = glyphGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function glyphUpper(raw: GlyphValue): boolean {
  const text = glyphGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function glyphHyphen(raw: GlyphValue): boolean {
  return glyphGiven(raw).includes("-");
}

export function glyphPeriod(raw: GlyphValue): boolean {
  return glyphGiven(raw).includes(".");
}

export function glyphStamp(raw: GlyphValue): string {
  const text = glyphGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function glyphCopy(raw: GlyphValue): string {
  return glyphGiven(raw);
}

export function glyphFamily(raw: GlyphValue): string {
  if (glyphState(raw) !== "set") return "";
  return firstToken(glyphGiven(raw));
}

export function glyphLanes(rows: readonly GlyphRow[]): GlyphLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = glyphLane(row.glyph);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingGlyph(rows: readonly GlyphRow[]): string {
  const lines = glyphLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingGlyphHue(rows: readonly GlyphRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = glyphHue(row.glyph);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function laneGlyphCount(rows: readonly GlyphRow[], lane: GlyphLane): number {
  return rows.filter((row) => glyphLane(row.glyph) === lane).length;
}

export function glyphShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGlyphLanes(rows: readonly GlyphRow[]): string[] {
  return glyphLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenGlyphs(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGlyphs(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGlyph(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGlyphReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGlyphReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGlyphLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: GlyphRow, shape: GlyphShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return glyphHouse(row.glyph);
  if (shape === "fort") return glyphFort(row.glyph);
  if (shape === "harbor") return glyphHarbor(row.glyph);
  if (shape === "digit") return glyphDigitLane(row.glyph);
  if (shape === "spark") return glyphSpark(row.glyph);
  if (shape === "scroll") return glyphScroll(row.glyph);
  if (shape === "vowel") return glyphVowelLane(row.glyph);
  if (shape === "post") return glyphPost(row.glyph);
  if (shape === "open") return glyphOpen(row.glyph);
  if (shape === "soon") return glyphSoon(row.glyph);
  if (shape === "letter") return glyphLetter(row.glyph);
  if (shape === "mixed") return glyphMixed(row.glyph);
  if (shape === "upper") return glyphUpper(row.glyph);
  if (shape === "lower") return glyphLower(row.glyph);
  if (shape === "space") return glyphSpace(row.glyph);
  if (shape === "even") return glyphEven(row.glyph);
  if (shape === "odd") return glyphOdd(row.glyph);
  if (shape === "tail") return glyphTail(row.glyph);
  if (shape === "first") return glyphFirst(row.glyph);
  if (shape === "cased") return glyphHeld(row.glyph);
  if (shape === "hyphen") return glyphHyphen(row.glyph);
  if (shape === "period") return glyphPeriod(row.glyph);
  return glyphLane(row.glyph) === shape;
}

export function visibleGlyphs(
  rows: readonly GlyphRow[],
  lane: string,
  hue: string,
  query: string,
  review: GlyphReview,
  reviewed: readonly string[],
  shape: GlyphShape,
): GlyphRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (glyphState(row.glyph) === "") return false;
    const found = glyphLane(row.glyph);
    const hueName = glyphHue(row.glyph);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${glyphGiven(row.glyph)} ${glyphStamp(row.glyph)} ${glyphFamily(row.glyph)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function glyphLanesCsv(rows: readonly GlyphRow[]): string {
  const lines = ["lane,count"];
  for (const line of glyphLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function glyphRowsCsv(rows: readonly GlyphRow[], reviewed: readonly string[]): string {
  const lines = ["name,saleStatus,stamp,family,lane,hue,length,hall,dash,gap,chip,even,cipher,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(glyphGiven(row.glyph)),
        glyphStamp(row.glyph),
        csvCell(glyphFamily(row.glyph)),
        glyphLane(row.glyph),
        glyphHue(row.glyph),
        glyphLength(row.glyph) ?? "",
        glyphHouse(row.glyph) ? "1" : "0",
        glyphFort(row.glyph) ? "1" : "0",
        glyphHarbor(row.glyph) ? "1" : "0",
        glyphSpark(row.glyph) ? "1" : "0",
        glyphEven(row.glyph) ? "1" : "0",
        glyphDigit(row.glyph) ? "1" : "0",
        glyphMixed(row.glyph) ? "1" : "0",
        glyphUpper(row.glyph) ? "1" : "0",
        glyphVowel(row.glyph) ? "1" : "0",
        glyphTail(row.glyph) ? "1" : "0",
        glyphHeld(row.glyph) ? "1" : "0",
        glyphSoon(row.glyph) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
