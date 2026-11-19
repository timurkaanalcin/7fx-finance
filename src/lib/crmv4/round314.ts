/**
 * Horologium rules for a water clock kept in this browser, and ripple plates read the last IP already stored on the account.
 * Parts are basin, spout, float, and tank. Metals are bronze, glass, and clay.
 * Drips are 5, 10, 20, or 40. Beads are 1, 3, or 9.
 * A known last IP is LOCAL, LOOP, HOME, or DESK. A dash contains a hyphen. A gap has a space.
 * A drop is three characters or fewer. A tide is sixteen characters or longer. A cipher contains a number.
 * A true last IP reads as LOCAL. A false last IP reads as DRY RIPPLE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_horologium (
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
 * CREATE TABLE crm_ripple_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_ripple_review (
 *   trader_id text primary key
 * );
 */



export const CKD_KEY = "crmv4-horologium";
export const CKD_VIEW_KEY = "crmv4-horologium-views";
export const CKD_DENSITY_KEY = "crmv4-horologium-density";
export const CKD_STAVES = ["basin", "spout", "float", "tank"] as const;

export type HorologiumStaff = (typeof CKD_STAVES)[number];

export type HorologiumWood = "blank" | "ash" | "elm" | "box";

export type HorologiumTray = "yard" | "rack" | "case";

export type HorologiumDensity = "broad" | "tight";

export type HorologiumSort = "staff" | "bearer";

export type Horologium = {
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

export type HorologiumView = {
  id: string;
  name: string;
  tray: HorologiumTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type HorologiumCounts = {
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

export const ROUND314_FEATURES = [
  "save",
  "note",
  "parts",
  "metal",
  "drip",
  "chest",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "sort",
  "kpis",
  "chart",
  "timeline",
  "bulk",
  "csv",
  "keys",
  "audit",
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "ripple",
  "ripple-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["bronze", "glass", "clay"] as const;

const NOTCH_CYCLE = [5, 10, 20, 40] as const;

const VANE_CYCLE = [1, 3, 9] as const;

const INNER = new Set(["basin", "spout"]);

const OUTER = new Set(["float", "tank"]);

const HOUSE_WEAVE = new Set(["BRONZE", "CLAY"]);

const HOUSE_STATUSES = new Set(["LOCAL", "LOOP", "HOME", "DESK"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HorologiumTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<HorologiumWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<HorologiumWood, "blank">) : "";
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

function inTray(card: Horologium, tray: HorologiumTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return CKD_STAVES.indexOf(staff as HorologiumStaff);
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

export function horologiumStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CKD_STAVES as readonly string[]).includes(text) ? text : "";
}

/** An hour is 6, 9, 12, or 15. Anything else stays blank. */
export function horologiumNotch(raw: unknown): 5 | 10 | 20 | 40 | null {
  const text = wholeToken(raw);
  if (text !== "5" && text !== "10" && text !== "20" && text !== "40") return null;
  return Number(text) as 5 | 10 | 20 | 40;
}

/** A mark is 2, 4, or 8. Anything else stays blank. */
export function horologiumVane(raw: unknown): 1 | 3 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "9") return null;
  return Number(text) as 1 | 3 | 9;
}

/** A wood is marble, slate, or chalk. The saved name is the upper token. */
export function horologiumWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function horologiumInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function horologiumOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Basin is the bowl. Spout is the jet. Float is the bob. Tank is the well. */
export function horologiumBand(staff: unknown): string {
  const text = horologiumStaff(staff);
  if (!text) return "";
  if (text === "basin") return "bowl";
  if (text === "spout") return "jet";
  if (text === "float") return "bob";
  return "well";
}

/** Signed distance from one watch to another along the horologium. */
export function horologiumGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(horologiumStaff(from));
  const right = staffIndex(horologiumStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(horologiumWood(wood));
}

/** A pair mark is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return horologiumVane(vane) === 3;
}

/** A full mark is 8. */
export function fullVane(vane: unknown): boolean {
  return horologiumVane(vane) === 9;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return horologiumStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = horologiumNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = horologiumWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = horologiumVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveHorologiumFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the frame uses least. A tie keeps chalk, then marble, then slate. */
export function suggestWood(cards: readonly Horologium[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "CLAY";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["CLAY", "BRONZE", "GLASS"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest five. Morning asks for ten. Afternoon asks for fifteen. Evening asks for twenty. A saved rung on the leg wins, and a tie keeps the taller rung. */
export function suggestNotch(cards: readonly Horologium[], hour: number): 5 | 10 | 20 | 40 {
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

/** Before six, suggest the lip. The rest of the day suggests the well. */
export function suggestStaff(hour: number): HorologiumStaff {
  return hour < 7 ? "basin" : "tank";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Horologium[], roster: string): string {
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

export function readHorologiumRules(raw: unknown): Horologium[] {
  if (!Array.isArray(raw)) return [];
  const out: Horologium[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Horologium>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: horologiumStaff(row.staff),
      notch: horologiumNotch(row.notch),
      wood: horologiumWood(row.wood),
      vane: horologiumVane(row.vane) ?? 1,
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

export function addHorologium(
  cards: readonly Horologium[],
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
): Horologium[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `k${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readHorologiumRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: horologiumStaff(card.staff),
      notch: horologiumNotch(card.notch),
      wood: horologiumWood(card.wood),
      vane: horologiumVane(card.vane) ?? 1,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Horologium[], id: string, edit: (card: Horologium) => Horologium): Horologium[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editHorologium(cards: readonly Horologium[], id: string, title: string): Horologium[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editHorologiumNote(cards: readonly Horologium[], id: string, note: string): Horologium[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "BRONZE", "GLASS", "CLAY"];
  const index = order.indexOf(horologiumWood(wood));
  return order[(index + 1) % order.length] || "BRONZE";
}

export function setHorologiumWood(cards: readonly Horologium[], id: string, wood: string): Horologium[] {
  const next = horologiumWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setHorologiumSighted(cards: readonly Horologium[], id: string, sighted: boolean): Horologium[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setHorologiumRack(cards: readonly Horologium[], id: string, racked: boolean): Horologium[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setHorologiumVault(cards: readonly Horologium[], id: string, cased: boolean): Horologium[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setHorologiumStar(cards: readonly Horologium[], id: string, starred: boolean): Horologium[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addHorologiumTag(cards: readonly Horologium[], id: string, tag: string): Horologium[] {
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

export function liftNotch(cards: readonly Horologium[], id: string): Horologium[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Horologium[], id: string): Horologium[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Horologium[], id: string): Horologium[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Horologium[], id: string): Horologium[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setHorologiumFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackHorologiumFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return setHorologiumRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starHorologiumFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return setHorologiumStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagHorologiumFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return addHorologiumTag(cards, id, "e");
}

export function woodFocused(cards: readonly Horologium[], id: string): Horologium[] {
  const card = cards.find((item) => item.id === id);
  return card ? setHorologiumWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Horologium[], id: string): Horologium[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Horologium[], ids: readonly string[], edit: (card: Horologium) => Horologium): Horologium[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkHorologiumOak(cards: readonly Horologium[], ids: readonly string[]): Horologium[] {
  return bulk(cards, ids, (card) => (card.wood === "CLAY" ? card : { ...card, wood: "CLAY", audit: "wood" }));
}

export function bulkHorologiumSighted(cards: readonly Horologium[], ids: readonly string[]): Horologium[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkHorologiumVault(cards: readonly Horologium[], ids: readonly string[]): Horologium[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkHorologiumTag(cards: readonly Horologium[], ids: readonly string[]): Horologium[] {
  return bulk(cards, ids, (card) => (card.tags.includes("f") ? card : { ...card, tags: tagsOf([...card.tags, "f"]), audit: "tag" }));
}

export function readHorologiumViews(raw: unknown): HorologiumView[] {
  if (!Array.isArray(raw)) return [];
  const out: HorologiumView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HorologiumView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["BRONZE", "GLASS", "CLAY"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addHorologiumView(views: readonly HorologiumView[], view: HorologiumView): HorologiumView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readHorologiumViews([...views, { ...view, id, name }]);
}

export function dropHorologiumView(views: readonly HorologiumView[], id: string): HorologiumView[] {
  return views.filter((view) => view.id !== id);
}

export function horologiumDensity(raw: unknown): HorologiumDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortHorologiumRules(cards: readonly Horologium[], sort: HorologiumSort): Horologium[] {
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

export function visibleHorologiumRules(
  cards: readonly Horologium[],
  tray: HorologiumTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Horologium[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : horologiumWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !horologiumInner(card.staff)) return false;
    if (wantStaff === "outer" && !horologiumOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer leg on bob one, still unlevelled and not in the chest, is overdue. */
export function overdueHorologium(card: Horologium): boolean {
  return horologiumOuter(card.staff) && card.vane === 1 && !card.sighted && !card.cased;
}

/** No wood, the short rung, bob one, and still on the yard. */
export function idleHorologium(card: Horologium): boolean {
  return !card.wood && card.notch === 5 && card.vane === 1 && !card.sighted && !card.racked && !card.cased;
}

/** Pine, a tall rung, and a full bob, still out of the chest. */
export function briskHorologium(card: Horologium): boolean {
  return card.wood === "CLAY" && card.notch === 40 && card.vane === 9 && !card.cased;
}

/** Foot, slate, and rung ten. */
export function restingHorologium(card: Horologium): boolean {
  return card.staff === "tank" && card.wood === "GLASS" && card.notch === 10;
}

/** A lip is late when the desk is already on the well. */
export function lateHorologium(card: Horologium, desk: string): boolean {
  return card.staff === "basin" && horologiumStaff(desk) === "tank" && !card.sighted;
}

export function horologiumCounts(cards: readonly Horologium[], shown: readonly Horologium[], desk: string): HorologiumCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => horologiumInner(card.staff)).length,
    outer: cards.filter((card) => horologiumOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 40).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleHorologium).length,
    brisk: cards.filter(briskHorologium).length,
    resting: cards.filter(restingHorologium).length,
    overdue: cards.filter(overdueHorologium).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateHorologium(card, desk)).length,
  };
}

export function horologiumBars(cards: readonly Horologium[]): { staff: string; count: number }[] {
  return CKD_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function horologiumTimeline(cards: readonly Horologium[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function horologiumBearers(cards: readonly Horologium[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Horologium[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of horologiumBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderHorologiumRules(cards: readonly Horologium[]): string[] {
  return cards.filter(overdueHorologium).map((card) => card.title);
}

export function horologiumCopy(card: Horologium): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function horologiumCsv(cards: readonly Horologium[], desk: string): string {
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
        horologiumOuter(card.staff) ? "1" : "0",
        lateHorologium(card, desk) ? "1" : "0",
        idleHorologium(card) ? "1" : "0",
        briskHorologium(card) ? "1" : "0",
        restingHorologium(card) ? "1" : "0",
        overdueHorologium(card) ? "1" : "0",
        horologiumInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        horologiumBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const RPL_KEY = "crmv4-ripple-hide";
export const RPL_REVIEW_KEY = "crmv4-ripple-review";

export type RippleLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type RippleHue = "" | "ivory" | "graphite" | "champagne";

export type RippleState = "" | "clear" | "set";

export type RippleReview = "all" | "reviewed" | "fresh";

export type RippleShape =
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

export type RippleValue = string | { lastIp?: unknown; [key: string]: unknown } | null | undefined;

export type RippleRow = { id: string; label: string; ripple: RippleValue };

export type RippleLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function rippleRecord(raw: RippleValue): { lastIp?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function rippleBlocked(raw: RippleValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function rippleGiven(raw: RippleValue): string {
  const row = rippleRecord(raw);
  if (row && !("lastIp" in row)) return "";
  const value = row ? row.lastIp : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "LOCAL";
  if (value === false || value === "false" || value === "0" || value === 0) return "DRY RIPPLE";
  return clip(value, 48);
}

function rippleReadable(raw: RippleValue): boolean {
  if (rippleBlocked(raw)) return false;
  const row = rippleRecord(raw);
  if (row && !("lastIp" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function rippleState(raw: RippleValue): RippleState {
  if (!rippleReadable(raw)) return "";
  return rippleGiven(raw) ? "set" : "clear";
}

/** A known address is LOCAL, LOOP, HOME, or DESK. A dash contains a hyphen. A gap has a space. A cipher contains a number. A drop is three characters or fewer. A tide is sixteen characters or longer. */
export function rippleLane(raw: RippleValue): RippleLane {
  if (rippleState(raw) !== "set") return "";
  const text = rippleGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (text.length <= 3) return "spark";
  if (text.length >= 16) return "scroll";
  if (/[0-9]/.test(text)) return "digit";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function rippleHue(raw: RippleValue): RippleHue {
  const lane = rippleLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function rippleHouse(raw: RippleValue): boolean {
  return rippleLane(raw) === "house";
}

export function rippleFort(raw: RippleValue): boolean {
  return rippleLane(raw) === "fort";
}

export function rippleHarbor(raw: RippleValue): boolean {
  return rippleLane(raw) === "harbor";
}

export function rippleDigitLane(raw: RippleValue): boolean {
  return rippleLane(raw) === "digit";
}

export function rippleSpark(raw: RippleValue): boolean {
  return rippleLane(raw) === "spark";
}

export function rippleScroll(raw: RippleValue): boolean {
  return rippleLane(raw) === "scroll";
}

export function rippleVowelLane(raw: RippleValue): boolean {
  return rippleLane(raw) === "vowel";
}

export function ripplePost(raw: RippleValue): boolean {
  return rippleLane(raw) === "post";
}

export function rippleOpen(raw: RippleValue): boolean {
  return rippleState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function rippleHeld(raw: RippleValue): boolean {
  const lane = rippleLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function rippleSoon(raw: RippleValue): boolean {
  if (rippleState(raw) !== "set") return false;
  if (rippleSpark(raw)) return true;
  if (rippleHouse(raw)) return false;
  const length = rippleGiven(raw).length;
  return length > 0 && length <= 2;
}

export function rippleLength(raw: RippleValue): number | null {
  if (rippleState(raw) !== "set") return null;
  return rippleGiven(raw).length;
}

export function rippleEven(raw: RippleValue): boolean {
  const length = rippleLength(raw);
  return length !== null && length % 2 === 0;
}

export function rippleOdd(raw: RippleValue): boolean {
  const length = rippleLength(raw);
  return length !== null && length % 2 === 1;
}

export function rippleFirst(raw: RippleValue): boolean {
  return /^[A-Za-z]/.test(rippleGiven(raw));
}

export function rippleTail(raw: RippleValue): boolean {
  return /[0-9]$/.test(rippleGiven(raw));
}

export function rippleCapital(raw: RippleValue): boolean {
  return /[A-Z]/.test(rippleGiven(raw));
}

export function rippleSpace(raw: RippleValue): boolean {
  return rippleGiven(raw).includes(" ");
}

export function rippleVowel(raw: RippleValue): boolean {
  return /^[aeiou]/i.test(rippleGiven(raw));
}

export function rippleDigit(raw: RippleValue): boolean {
  return /[0-9]/.test(rippleGiven(raw));
}

export function rippleLetter(raw: RippleValue): boolean {
  return /[A-Za-z]/.test(rippleGiven(raw));
}

export function rippleMixed(raw: RippleValue): boolean {
  return rippleDigit(raw) && rippleLetter(raw);
}

export function rippleLower(raw: RippleValue): boolean {
  const text = rippleGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function rippleUpper(raw: RippleValue): boolean {
  const text = rippleGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function rippleHyphen(raw: RippleValue): boolean {
  return rippleGiven(raw).includes("-");
}

export function ripplePeriod(raw: RippleValue): boolean {
  return rippleGiven(raw).includes(".");
}

export function rippleStamp(raw: RippleValue): string {
  const text = rippleGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function rippleCopy(raw: RippleValue): string {
  return rippleGiven(raw);
}

export function rippleFamily(raw: RippleValue): string {
  if (rippleState(raw) !== "set") return "";
  return firstToken(rippleGiven(raw));
}

export function rippleLanes(rows: readonly RippleRow[]): RippleLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = rippleLane(row.ripple);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingRipple(rows: readonly RippleRow[]): string {
  const lines = rippleLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingRippleHue(rows: readonly RippleRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = rippleHue(row.ripple);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function laneRippleCount(rows: readonly RippleRow[], lane: RippleLane): number {
  return rows.filter((row) => rippleLane(row.ripple) === lane).length;
}

export function rippleShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentRippleLanes(rows: readonly RippleRow[]): string[] {
  return rippleLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenRipples(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedRipples(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleRipple(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRippleReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRippleReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRippleLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: RippleRow, shape: RippleShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return rippleHouse(row.ripple);
  if (shape === "fort") return rippleFort(row.ripple);
  if (shape === "harbor") return rippleHarbor(row.ripple);
  if (shape === "digit") return rippleDigitLane(row.ripple);
  if (shape === "spark") return rippleSpark(row.ripple);
  if (shape === "scroll") return rippleScroll(row.ripple);
  if (shape === "vowel") return rippleVowelLane(row.ripple);
  if (shape === "post") return ripplePost(row.ripple);
  if (shape === "open") return rippleOpen(row.ripple);
  if (shape === "soon") return rippleSoon(row.ripple);
  if (shape === "letter") return rippleLetter(row.ripple);
  if (shape === "mixed") return rippleMixed(row.ripple);
  if (shape === "upper") return rippleUpper(row.ripple);
  if (shape === "lower") return rippleLower(row.ripple);
  if (shape === "space") return rippleSpace(row.ripple);
  if (shape === "even") return rippleEven(row.ripple);
  if (shape === "odd") return rippleOdd(row.ripple);
  if (shape === "tail") return rippleTail(row.ripple);
  if (shape === "first") return rippleFirst(row.ripple);
  if (shape === "cased") return rippleHeld(row.ripple);
  if (shape === "hyphen") return rippleHyphen(row.ripple);
  if (shape === "period") return ripplePeriod(row.ripple);
  return rippleLane(row.ripple) === shape;
}

export function visibleRipples(
  rows: readonly RippleRow[],
  lane: string,
  hue: string,
  query: string,
  review: RippleReview,
  reviewed: readonly string[],
  shape: RippleShape,
): RippleRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (rippleState(row.ripple) === "") return false;
    const found = rippleLane(row.ripple);
    const hueName = rippleHue(row.ripple);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${rippleGiven(row.ripple)} ${rippleStamp(row.ripple)} ${rippleFamily(row.ripple)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function rippleLanesCsv(rows: readonly RippleRow[]): string {
  const lines = ["lane,count"];
  for (const line of rippleLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function rippleRowsCsv(rows: readonly RippleRow[], reviewed: readonly string[]): string {
  const lines = ["name,lastIp,stamp,family,lane,hue,length,hall,dash,gap,chip,even,cipher,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(rippleGiven(row.ripple)),
        rippleStamp(row.ripple),
        csvCell(rippleFamily(row.ripple)),
        rippleLane(row.ripple),
        rippleHue(row.ripple),
        rippleLength(row.ripple) ?? "",
        rippleHouse(row.ripple) ? "1" : "0",
        rippleFort(row.ripple) ? "1" : "0",
        rippleHarbor(row.ripple) ? "1" : "0",
        rippleSpark(row.ripple) ? "1" : "0",
        rippleEven(row.ripple) ? "1" : "0",
        rippleDigit(row.ripple) ? "1" : "0",
        rippleMixed(row.ripple) ? "1" : "0",
        rippleUpper(row.ripple) ? "1" : "0",
        rippleVowel(row.ripple) ? "1" : "0",
        rippleTail(row.ripple) ? "1" : "0",
        rippleHeld(row.ripple) ? "1" : "0",
        rippleSoon(row.ripple) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
