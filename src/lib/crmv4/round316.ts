/**
 * Dioptra rules for a sight kept in this browser, and fret plates read the trading switch already stored on the account.
 * Parts are lip, arc, rim, and base. Metals are gilt, ivory, and slate.
 * Angles are 4, 8, 16, or 32. Sights are 2, 4, or 8.
 * A known trading switch is LIVE, ON, OPEN, or READY. A dash contains a hyphen. A gap has a space.
 * A chip is two characters or fewer. A tide is twelve characters or longer. A cipher contains a number.
 * A true trading switch reads as LIVE. A false trading switch reads as HALTED BOOK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_dioptra (
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
 * CREATE TABLE crm_fret_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_fret_review (
 *   trader_id text primary key
 * );
 */



export const DPR_KEY = "crmv4-dioptra";
export const DPR_VIEW_KEY = "crmv4-dioptra-views";
export const DPR_DENSITY_KEY = "crmv4-dioptra-density";
export const DPR_STAVES = ["lip", "arc", "rim", "base"] as const;

export type DioptraStaff = (typeof DPR_STAVES)[number];

export type DioptraWood = "blank" | "ash" | "elm" | "box";

export type DioptraTray = "yard" | "rack" | "case";

export type DioptraDensity = "broad" | "tight";

export type DioptraSort = "staff" | "bearer";

export type Dioptra = {
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

export type DioptraView = {
  id: string;
  name: string;
  tray: DioptraTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type DioptraCounts = {
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

export const ROUND316_FEATURES = [
  "dioptra-save",
  "notes",
  "sight-parts",
  "gilt-metal",
  "angle-sla",
  "vault",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "sighter-sort",
  "desk-kpis",
  "part-chart",
  "angle-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-sighter",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "trade-frets",
  "fret-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["gilt", "ivory", "slate"] as const;

const NOTCH_CYCLE = [4, 8, 16, 32] as const;

const VANE_CYCLE = [2, 4, 8] as const;

const INNER = new Set(["lip", "arc"]);

const OUTER = new Set(["rim", "base"]);

const HOUSE_WEAVE = new Set(["GILT", "SLATE"]);

const HOUSE_STATUSES = new Set(["LIVE", "ON", "OPEN", "READY"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DioptraTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<DioptraWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<DioptraWood, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ab]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Dioptra, tray: DioptraTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return DPR_STAVES.indexOf(staff as DioptraStaff);
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

export function dioptraStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DPR_STAVES as readonly string[]).includes(text) ? text : "";
}

/** An angle is 4, 8, 16, or 32. Anything else stays blank. */
export function dioptraNotch(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A sight is 2, 4, or 8. Anything else stays blank. */
export function dioptraVane(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A wood is marble, slate, or chalk. The saved name is the upper token. */
export function dioptraWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function dioptraInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function dioptraOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Rise is the dawn. Noon is the zenith. Dusk is the ember. Night is the dark. */
export function dioptraBand(staff: unknown): string {
  const text = dioptraStaff(staff);
  if (!text) return "";
  if (text === "lip") return "near";
  if (text === "arc") return "span";
  if (text === "rim") return "edge";
  return "foot";
}

/** Signed distance from one watch to another along the dioptra. */
export function dioptraGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(dioptraStaff(from));
  const right = staffIndex(dioptraStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(dioptraWood(wood));
}

/** A pair mark is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return dioptraVane(vane) === 4;
}

/** A full mark is 8. */
export function fullVane(vane: unknown): boolean {
  return dioptraVane(vane) === 8;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return dioptraStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = dioptraNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = dioptraWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = dioptraVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveDioptraFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the frame uses least. A tie keeps chalk, then marble, then slate. */
export function suggestWood(cards: readonly Dioptra[]): string {
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
export function suggestNotch(cards: readonly Dioptra[], hour: number): 4 | 8 | 16 | 32 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.notch === null) continue;
    seen = true;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  if (seen) {
    let best: 4 | 8 | 16 | 32 = 32;
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
  if (hour < 5) return 4;
  if (hour < 10) return 8;
  if (hour < 15) return 16;
  return 32;
}

/** Before six, suggest the lip. The rest of the day suggests the dark. */
export function suggestStaff(hour: number): DioptraStaff {
  return hour < 8 ? "lip" : "base";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Dioptra[], roster: string): string {
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

export function readDioptraRules(raw: unknown): Dioptra[] {
  if (!Array.isArray(raw)) return [];
  const out: Dioptra[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Dioptra>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: dioptraStaff(row.staff),
      notch: dioptraNotch(row.notch),
      wood: dioptraWood(row.wood),
      vane: dioptraVane(row.vane) ?? 2,
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

export function addDioptra(
  cards: readonly Dioptra[],
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
): Dioptra[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `k${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readDioptraRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: dioptraStaff(card.staff),
      notch: dioptraNotch(card.notch),
      wood: dioptraWood(card.wood),
      vane: dioptraVane(card.vane) ?? 2,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Dioptra[], id: string, edit: (card: Dioptra) => Dioptra): Dioptra[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editDioptra(cards: readonly Dioptra[], id: string, title: string): Dioptra[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editDioptraNote(cards: readonly Dioptra[], id: string, note: string): Dioptra[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "GILT", "IVORY", "SLATE"];
  const index = order.indexOf(dioptraWood(wood));
  return order[(index + 1) % order.length] || "GILT";
}

export function setDioptraWood(cards: readonly Dioptra[], id: string, wood: string): Dioptra[] {
  const next = dioptraWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setDioptraSighted(cards: readonly Dioptra[], id: string, sighted: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setDioptraRack(cards: readonly Dioptra[], id: string, racked: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setDioptraVault(cards: readonly Dioptra[], id: string, cased: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setDioptraStar(cards: readonly Dioptra[], id: string, starred: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addDioptraTag(cards: readonly Dioptra[], id: string, tag: string): Dioptra[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNotch(notch: number | null, dir: 1 | -1): 4 | 8 | 16 | 32 {
  if (notch === null) return dir > 0 ? 4 : 32;
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepVane(vane: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftNotch(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return setDioptraRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return setDioptraStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return addDioptraTag(cards, id, "a");
}

export function woodFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  const card = cards.find((item) => item.id === id);
  return card ? setDioptraWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Dioptra[], ids: readonly string[], edit: (card: Dioptra) => Dioptra): Dioptra[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkDioptraOak(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.wood === "SLATE" ? card : { ...card, wood: "SLATE", audit: "wood" }));
}

export function bulkDioptraSighted(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkDioptraVault(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkDioptraTag(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readDioptraViews(raw: unknown): DioptraView[] {
  if (!Array.isArray(raw)) return [];
  const out: DioptraView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DioptraView>;
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

export function addDioptraView(views: readonly DioptraView[], view: DioptraView): DioptraView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readDioptraViews([...views, { ...view, id, name }]);
}

export function dropDioptraView(views: readonly DioptraView[], id: string): DioptraView[] {
  return views.filter((view) => view.id !== id);
}

export function dioptraDensity(raw: unknown): DioptraDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortDioptraRules(cards: readonly Dioptra[], sort: DioptraSort): Dioptra[] {
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

export function visibleDioptraRules(
  cards: readonly Dioptra[],
  tray: DioptraTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Dioptra[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : dioptraWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !dioptraInner(card.staff)) return false;
    if (wantStaff === "outer" && !dioptraOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer leg on ember one, still unlevelled and not in the chest, is overdue. */
export function overdueDioptra(card: Dioptra): boolean {
  return dioptraOuter(card.staff) && card.vane === 2 && !card.sighted && !card.cased;
}

/** No wood, the short rung, ember one, and still on the yard. */
export function idleDioptra(card: Dioptra): boolean {
  return !card.wood && card.notch === 4 && card.vane === 2 && !card.sighted && !card.racked && !card.cased;
}

/** Pine, a tall rung, and a full ember, still out of the chest. */
export function briskDioptra(card: Dioptra): boolean {
  return card.wood === "SLATE" && card.notch === 32 && card.vane === 8 && !card.cased;
}

/** Foot, slate, and rung ten. */
export function restingDioptra(card: Dioptra): boolean {
  return card.staff === "base" && card.wood === "IVORY" && card.notch === 8;
}

/** A lip is late when the desk is already on the dark. */
export function lateDioptra(card: Dioptra, desk: string): boolean {
  return card.staff === "lip" && dioptraStaff(desk) === "base" && !card.sighted;
}

export function dioptraCounts(cards: readonly Dioptra[], shown: readonly Dioptra[], desk: string): DioptraCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => dioptraInner(card.staff)).length,
    outer: cards.filter((card) => dioptraOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 32).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleDioptra).length,
    brisk: cards.filter(briskDioptra).length,
    resting: cards.filter(restingDioptra).length,
    overdue: cards.filter(overdueDioptra).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateDioptra(card, desk)).length,
  };
}

export function dioptraBars(cards: readonly Dioptra[]): { staff: string; count: number }[] {
  return DPR_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function dioptraTimeline(cards: readonly Dioptra[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function dioptraBearers(cards: readonly Dioptra[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Dioptra[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of dioptraBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderDioptraRules(cards: readonly Dioptra[]): string[] {
  return cards.filter(overdueDioptra).map((card) => card.title);
}

export function dioptraCopy(card: Dioptra): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function dioptraCsv(cards: readonly Dioptra[], desk: string): string {
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
        dioptraOuter(card.staff) ? "1" : "0",
        lateDioptra(card, desk) ? "1" : "0",
        idleDioptra(card) ? "1" : "0",
        briskDioptra(card) ? "1" : "0",
        restingDioptra(card) ? "1" : "0",
        overdueDioptra(card) ? "1" : "0",
        dioptraInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        dioptraBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const FRT_KEY = "crmv4-fret-hide";
export const FRT_REVIEW_KEY = "crmv4-fret-review";

export type FretLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type FretHue = "" | "ivory" | "graphite" | "champagne";

export type FretState = "" | "clear" | "set";

export type FretReview = "all" | "reviewed" | "fresh";

export type FretShape =
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

export type FretValue = string | { tradingEnabled?: unknown; [key: string]: unknown } | null | undefined;

export type FretRow = { id: string; label: string; fret: FretValue };

export type FretLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function fretRecord(raw: FretValue): { tradingEnabled?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function fretBlocked(raw: FretValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function fretGiven(raw: FretValue): string {
  const row = fretRecord(raw);
  if (row && !("tradingEnabled" in row)) return "";
  const value = row ? row.tradingEnabled : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LIVE";
  if (value === false || value === "false" || value === "0" || value === 0) return "HALTED BOOK";
  return clip(value, 48);
}

function fretReadable(raw: FretValue): boolean {
  if (fretBlocked(raw)) return false;
  const row = fretRecord(raw);
  if (row && !("tradingEnabled" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function fretState(raw: FretValue): FretState {
  if (!fretReadable(raw)) return "";
  return fretGiven(raw) ? "set" : "clear";
}

/** A known address is NEW, WARM, HOT, or WON. A dash contains a hyphen. A gap has a space. A cipher contains a number. A drop is three characters or fewer. A tide is sixteen characters or longer. */
export function fretLane(raw: FretValue): FretLane {
  if (fretState(raw) !== "set") return "";
  const text = fretGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (text.length <= 2) return "spark";
  if (text.length >= 12) return "scroll";
  if (/[0-9]/.test(text)) return "digit";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function fretHue(raw: FretValue): FretHue {
  const lane = fretLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function fretHouse(raw: FretValue): boolean {
  return fretLane(raw) === "house";
}

export function fretFort(raw: FretValue): boolean {
  return fretLane(raw) === "fort";
}

export function fretHarbor(raw: FretValue): boolean {
  return fretLane(raw) === "harbor";
}

export function fretDigitLane(raw: FretValue): boolean {
  return fretLane(raw) === "digit";
}

export function fretSpark(raw: FretValue): boolean {
  return fretLane(raw) === "spark";
}

export function fretScroll(raw: FretValue): boolean {
  return fretLane(raw) === "scroll";
}

export function fretVowelLane(raw: FretValue): boolean {
  return fretLane(raw) === "vowel";
}

export function fretPost(raw: FretValue): boolean {
  return fretLane(raw) === "post";
}

export function fretOpen(raw: FretValue): boolean {
  return fretState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function fretHeld(raw: FretValue): boolean {
  const lane = fretLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function fretSoon(raw: FretValue): boolean {
  if (fretState(raw) !== "set") return false;
  if (fretSpark(raw)) return true;
  if (fretHouse(raw)) return false;
  const length = fretGiven(raw).length;
  return length > 0 && length <= 2;
}

export function fretLength(raw: FretValue): number | null {
  if (fretState(raw) !== "set") return null;
  return fretGiven(raw).length;
}

export function fretEven(raw: FretValue): boolean {
  const length = fretLength(raw);
  return length !== null && length % 2 === 0;
}

export function fretOdd(raw: FretValue): boolean {
  const length = fretLength(raw);
  return length !== null && length % 2 === 1;
}

export function fretFirst(raw: FretValue): boolean {
  return /^[A-Za-z]/.test(fretGiven(raw));
}

export function fretTail(raw: FretValue): boolean {
  return /[0-9]$/.test(fretGiven(raw));
}

export function fretCapital(raw: FretValue): boolean {
  return /[A-Z]/.test(fretGiven(raw));
}

export function fretSpace(raw: FretValue): boolean {
  return fretGiven(raw).includes(" ");
}

export function fretVowel(raw: FretValue): boolean {
  return /^[aeiou]/i.test(fretGiven(raw));
}

export function fretDigit(raw: FretValue): boolean {
  return /[0-9]/.test(fretGiven(raw));
}

export function fretLetter(raw: FretValue): boolean {
  return /[A-Za-z]/.test(fretGiven(raw));
}

export function fretMixed(raw: FretValue): boolean {
  return fretDigit(raw) && fretLetter(raw);
}

export function fretLower(raw: FretValue): boolean {
  const text = fretGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function fretUpper(raw: FretValue): boolean {
  const text = fretGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function fretHyphen(raw: FretValue): boolean {
  return fretGiven(raw).includes("-");
}

export function fretPeriod(raw: FretValue): boolean {
  return fretGiven(raw).includes(".");
}

export function fretStamp(raw: FretValue): string {
  const text = fretGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function fretCopy(raw: FretValue): string {
  return fretGiven(raw);
}

export function fretFamily(raw: FretValue): string {
  if (fretState(raw) !== "set") return "";
  return firstToken(fretGiven(raw));
}

export function fretLanes(rows: readonly FretRow[]): FretLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = fretLane(row.fret);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingFret(rows: readonly FretRow[]): string {
  const lines = fretLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingFretHue(rows: readonly FretRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = fretHue(row.fret);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function laneFretCount(rows: readonly FretRow[], lane: FretLane): number {
  return rows.filter((row) => fretLane(row.fret) === lane).length;
}

export function fretShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentFretLanes(rows: readonly FretRow[]): string[] {
  return fretLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenFrets(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedFrets(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleFret(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleFretReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkFretReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleFretLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: FretRow, shape: FretShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return fretHouse(row.fret);
  if (shape === "fort") return fretFort(row.fret);
  if (shape === "harbor") return fretHarbor(row.fret);
  if (shape === "digit") return fretDigitLane(row.fret);
  if (shape === "spark") return fretSpark(row.fret);
  if (shape === "scroll") return fretScroll(row.fret);
  if (shape === "vowel") return fretVowelLane(row.fret);
  if (shape === "post") return fretPost(row.fret);
  if (shape === "open") return fretOpen(row.fret);
  if (shape === "soon") return fretSoon(row.fret);
  if (shape === "letter") return fretLetter(row.fret);
  if (shape === "mixed") return fretMixed(row.fret);
  if (shape === "upper") return fretUpper(row.fret);
  if (shape === "lower") return fretLower(row.fret);
  if (shape === "space") return fretSpace(row.fret);
  if (shape === "even") return fretEven(row.fret);
  if (shape === "odd") return fretOdd(row.fret);
  if (shape === "tail") return fretTail(row.fret);
  if (shape === "first") return fretFirst(row.fret);
  if (shape === "cased") return fretHeld(row.fret);
  if (shape === "hyphen") return fretHyphen(row.fret);
  if (shape === "period") return fretPeriod(row.fret);
  return fretLane(row.fret) === shape;
}

export function visibleFrets(
  rows: readonly FretRow[],
  lane: string,
  hue: string,
  query: string,
  review: FretReview,
  reviewed: readonly string[],
  shape: FretShape,
): FretRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (fretState(row.fret) === "") return false;
    const found = fretLane(row.fret);
    const hueName = fretHue(row.fret);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${fretGiven(row.fret)} ${fretStamp(row.fret)} ${fretFamily(row.fret)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function fretLanesCsv(rows: readonly FretRow[]): string {
  const lines = ["lane,count"];
  for (const line of fretLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function fretRowsCsv(rows: readonly FretRow[], reviewed: readonly string[]): string {
  const lines = ["name,tradingEnabled,stamp,family,lane,hue,length,hall,dash,gap,chip,even,cipher,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(fretGiven(row.fret)),
        fretStamp(row.fret),
        csvCell(fretFamily(row.fret)),
        fretLane(row.fret),
        fretHue(row.fret),
        fretLength(row.fret) ?? "",
        fretHouse(row.fret) ? "1" : "0",
        fretFort(row.fret) ? "1" : "0",
        fretHarbor(row.fret) ? "1" : "0",
        fretSpark(row.fret) ? "1" : "0",
        fretEven(row.fret) ? "1" : "0",
        fretDigit(row.fret) ? "1" : "0",
        fretMixed(row.fret) ? "1" : "0",
        fretUpper(row.fret) ? "1" : "0",
        fretVowel(row.fret) ? "1" : "0",
        fretTail(row.fret) ? "1" : "0",
        fretHeld(row.fret) ? "1" : "0",
        fretSoon(row.fret) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
