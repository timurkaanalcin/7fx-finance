/**
 * Baculus rules for a bearer staff kept in this browser, and azimuth plates read the language already stored on the account.
 * Staves are reed, wand, pole, and mast. Woods are lime, yew, and oak.
 * Notches are 3, 6, 12, or 24. Vanes are 2, 4, or 9.
 * A hall language is ENGLISH, TURKISH, GERMAN, or RUSSIAN. A dash contains a hyphen. A gap has a space.
 * A chip is two characters or fewer. A tome is fourteen characters or longer. A mark contains a number.
 * A true language mark reads as ENGLISH. A false language mark reads as OPEN TONGUE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_baculus (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   staff text not null default '',
 *   wood text not null default '',
 *   notch_no integer,
 *   vane_no integer not null default 2,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   racked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_azimuth_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_azimuth_review (
 *   trader_id text primary key
 * );
 */

export const BCL_KEY = "crmv4-baculus";
export const BCL_VIEW_KEY = "crmv4-baculus-views";
export const BCL_DENSITY_KEY = "crmv4-baculus-density";
export const BCL_STAVES = ["reed", "wand", "pole", "mast"] as const;

export type BaculusStaff = (typeof BCL_STAVES)[number];

export type BaculusWood = "blank" | "lime" | "yew" | "oak";

export type BaculusTray = "yard" | "rack" | "case";

export type BaculusDensity = "broad" | "tight";

export type BaculusSort = "staff" | "bearer";

export type Baculus = {
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

export type BaculusView = {
  id: string;
  name: string;
  tray: BaculusTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type BaculusCounts = {
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

export const ROUND309_FEATURES = [
  "save",
  "note",
  "staves",
  "wood",
  "notch",
  "case",
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
  "fair-staff",
  "viewer",
  "suggest",
  "sla",
  "azimuth",
  "azimuth-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["lime", "yew", "oak"] as const;

const NOTCH_CYCLE = [3, 6, 12, 24] as const;

const VANE_CYCLE = [2, 4, 9] as const;

const INNER = new Set(["reed", "wand"]);

const OUTER = new Set(["pole", "mast"]);

const HOUSE_WEAVE = new Set(["LIME", "OAK"]);

const HOUSE_STATUSES = new Set(["ENGLISH", "TURKISH", "RUSSIAN", "GERMAN"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BaculusTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<BaculusWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<BaculusWood, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[bc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Baculus, tray: BaculusTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return BCL_STAVES.indexOf(staff as BaculusStaff);
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

export function baculusStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (BCL_STAVES as readonly string[]).includes(text) ? text : "";
}

/** A notch is 3, 6, 12, or 24. Anything else stays blank. */
export function baculusNotch(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A vane is 2, 4, or 9. Anything else stays blank. */
export function baculusVane(raw: unknown): 2 | 4 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "9") return null;
  return Number(text) as 2 | 4 | 9;
}

/** A wood is lime, yew, or oak. The saved name is the upper token. */
export function baculusWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function baculusInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function baculusOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Reed is the stem. Wand is the switch. Pole is the shaft. Mast is the spar. */
export function baculusBand(staff: unknown): string {
  const text = baculusStaff(staff);
  if (!text) return "";
  if (text === "reed") return "stem";
  if (text === "wand") return "switch";
  if (text === "pole") return "shaft";
  return "spar";
}

/** Signed distance from one watch to another along the baculus. */
export function baculusGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(baculusStaff(from));
  const right = staffIndex(baculusStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(baculusWood(wood));
}

/** A pair vane is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return baculusVane(vane) === 4;
}

/** A full vane is 9. */
export function fullVane(vane: unknown): boolean {
  return baculusVane(vane) === 9;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return baculusStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = baculusNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = baculusWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = baculusVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveBaculusFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the staff uses least. A tie keeps oak, then lime, then yew. */
export function suggestWood(cards: readonly Baculus[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "OAK";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["OAK", "LIME", "YEW"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest three. Morning asks for six. Afternoon asks for twelve. Evening asks for twenty-four. A saved notch on the staff wins, and a tie keeps the taller notch. */
export function suggestNotch(cards: readonly Baculus[], hour: number): 3 | 6 | 12 | 24 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.notch === null) continue;
    seen = true;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 6 | 12 | 24 = 24;
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
  if (hour < 5) return 3;
  if (hour < 9) return 6;
  if (hour < 14) return 12;
  return 24;
}

/** Before eight, suggest the reed. The rest of the day suggests the mast. */
export function suggestStaff(hour: number): BaculusStaff {
  return hour < 8 ? "reed" : "mast";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Baculus[], roster: string): string {
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

export function readBaculusRules(raw: unknown): Baculus[] {
  if (!Array.isArray(raw)) return [];
  const out: Baculus[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Baculus>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: baculusStaff(row.staff),
      notch: baculusNotch(row.notch),
      wood: baculusWood(row.wood),
      vane: baculusVane(row.vane) ?? 2,
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

export function addBaculus(
  cards: readonly Baculus[],
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
): Baculus[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readBaculusRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: baculusStaff(card.staff),
      notch: baculusNotch(card.notch),
      wood: baculusWood(card.wood),
      vane: baculusVane(card.vane) ?? 2,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Baculus[], id: string, edit: (card: Baculus) => Baculus): Baculus[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editBaculus(cards: readonly Baculus[], id: string, title: string): Baculus[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editBaculusNote(cards: readonly Baculus[], id: string, note: string): Baculus[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "LIME", "YEW", "OAK"];
  const index = order.indexOf(baculusWood(wood));
  return order[(index + 1) % order.length] || "LIME";
}

export function setBaculusWood(cards: readonly Baculus[], id: string, wood: string): Baculus[] {
  const next = baculusWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setBaculusSighted(cards: readonly Baculus[], id: string, sighted: boolean): Baculus[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setBaculusRack(cards: readonly Baculus[], id: string, racked: boolean): Baculus[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setBaculusVault(cards: readonly Baculus[], id: string, cased: boolean): Baculus[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setBaculusStar(cards: readonly Baculus[], id: string, starred: boolean): Baculus[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addBaculusTag(cards: readonly Baculus[], id: string, tag: string): Baculus[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNotch(notch: number | null, dir: 1 | -1): 3 | 6 | 12 | 24 {
  if (notch === null) return dir > 0 ? 3 : 24;
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepVane(vane: number, dir: 1 | -1): 2 | 4 | 9 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftNotch(cards: readonly Baculus[], id: string): Baculus[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Baculus[], id: string): Baculus[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Baculus[], id: string): Baculus[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Baculus[], id: string): Baculus[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setBaculusFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackBaculusFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return setBaculusRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starBaculusFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return setBaculusStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagBaculusFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return addBaculusTag(cards, id, "b");
}

export function woodFocused(cards: readonly Baculus[], id: string): Baculus[] {
  const card = cards.find((item) => item.id === id);
  return card ? setBaculusWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Baculus[], id: string): Baculus[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Baculus[], ids: readonly string[], edit: (card: Baculus) => Baculus): Baculus[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkBaculusOak(cards: readonly Baculus[], ids: readonly string[]): Baculus[] {
  return bulk(cards, ids, (card) => (card.wood === "OAK" ? card : { ...card, wood: "OAK", audit: "wood" }));
}

export function bulkBaculusSighted(cards: readonly Baculus[], ids: readonly string[]): Baculus[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkBaculusVault(cards: readonly Baculus[], ids: readonly string[]): Baculus[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkBaculusTag(cards: readonly Baculus[], ids: readonly string[]): Baculus[] {
  return bulk(cards, ids, (card) => (card.tags.includes("c") ? card : { ...card, tags: tagsOf([...card.tags, "c"]), audit: "tag" }));
}

export function readBaculusViews(raw: unknown): BaculusView[] {
  if (!Array.isArray(raw)) return [];
  const out: BaculusView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BaculusView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["LIME", "YEW", "OAK"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBaculusView(views: readonly BaculusView[], view: BaculusView): BaculusView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readBaculusViews([...views, { ...view, id, name }]);
}

export function dropBaculusView(views: readonly BaculusView[], id: string): BaculusView[] {
  return views.filter((view) => view.id !== id);
}

export function baculusDensity(raw: unknown): BaculusDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortBaculusRules(cards: readonly Baculus[], sort: BaculusSort): Baculus[] {
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

export function visibleBaculusRules(
  cards: readonly Baculus[],
  tray: BaculusTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Baculus[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : baculusWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !baculusInner(card.staff)) return false;
    if (wantStaff === "outer" && !baculusOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer staff on vane one, still unmarked and not in the case, is overdue. */
export function overdueBaculus(card: Baculus): boolean {
  return baculusOuter(card.staff) && card.vane === 2 && !card.sighted && !card.cased;
}

/** No wood, the short notch, vane two, and still on the yard. */
export function idleBaculus(card: Baculus): boolean {
  return !card.wood && card.notch === 3 && card.vane === 2 && !card.sighted && !card.racked && !card.cased;
}

/** Oak, a tall notch, and a full vane, still out of the case. */
export function briskBaculus(card: Baculus): boolean {
  return card.wood === "OAK" && card.notch === 24 && card.vane === 9 && !card.cased;
}

/** Mast, yew, and notch six. */
export function restingBaculus(card: Baculus): boolean {
  return card.staff === "mast" && card.wood === "YEW" && card.notch === 6;
}

/** A reed staff is late when the desk is already on the mast. */
export function lateBaculus(card: Baculus, desk: string): boolean {
  return card.staff === "reed" && baculusStaff(desk) === "mast" && !card.sighted;
}

export function baculusCounts(cards: readonly Baculus[], shown: readonly Baculus[], desk: string): BaculusCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => baculusInner(card.staff)).length,
    outer: cards.filter((card) => baculusOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 24).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleBaculus).length,
    brisk: cards.filter(briskBaculus).length,
    resting: cards.filter(restingBaculus).length,
    overdue: cards.filter(overdueBaculus).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateBaculus(card, desk)).length,
  };
}

export function baculusBars(cards: readonly Baculus[]): { staff: string; count: number }[] {
  return BCL_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function baculusTimeline(cards: readonly Baculus[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function baculusBearers(cards: readonly Baculus[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Baculus[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of baculusBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderBaculusRules(cards: readonly Baculus[]): string[] {
  return cards.filter(overdueBaculus).map((card) => card.title);
}

export function baculusCopy(card: Baculus): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function baculusCsv(cards: readonly Baculus[], desk: string): string {
  const lines = ["title,bearer,staff,wood,notch,vane,tags,marked,rack,case,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
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
        baculusOuter(card.staff) ? "1" : "0",
        lateBaculus(card, desk) ? "1" : "0",
        idleBaculus(card) ? "1" : "0",
        briskBaculus(card) ? "1" : "0",
        restingBaculus(card) ? "1" : "0",
        overdueBaculus(card) ? "1" : "0",
        baculusInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        baculusBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const AZM_KEY = "crmv4-azimuth-hide";
export const AZM_REVIEW_KEY = "crmv4-azimuth-review";

export type AzimuthLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type AzimuthHue = "" | "ivory" | "graphite" | "champagne";

export type AzimuthState = "" | "clear" | "set";

export type AzimuthReview = "all" | "reviewed" | "fresh";

export type AzimuthShape =
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

export type AzimuthValue = string | { language?: unknown; [key: string]: unknown } | null | undefined;

export type AzimuthRow = { id: string; label: string; azimuth: AzimuthValue };

export type AzimuthLaneLine = { lane: string; count: number };

const UMBRA_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const UMBRA_HUES = ["champagne", "ivory", "graphite"] as const;

function azimuthRecord(raw: AzimuthValue): { language?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function azimuthBlocked(raw: AzimuthValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function azimuthGiven(raw: AzimuthValue): string {
  const row = azimuthRecord(raw);
  if (row && !("language" in row)) return "";
  const value = row ? row.language : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "ENGLISH";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN TONGUE";
  return clip(value, 48);
}

function azimuthReadable(raw: AzimuthValue): boolean {
  if (azimuthBlocked(raw)) return false;
  const row = azimuthRecord(raw);
  if (row && !("language" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function azimuthState(raw: AzimuthValue): AzimuthState {
  if (!azimuthReadable(raw)) return "";
  return azimuthGiven(raw) ? "set" : "clear";
}

/** A realm language is ENGLISH, TURKISH, RUSSIAN, or GERMAN. A ridge contains a hyphen. A vale has a space. A cipher contains a number. A chip is two characters or fewer. An atlas is fourteen characters or longer. */
export function azimuthLane(raw: AzimuthValue): AzimuthLane {
  if (azimuthState(raw) !== "set") return "";
  const text = azimuthGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 2) return "spark";
  if (text.length >= 14) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function azimuthHue(raw: AzimuthValue): AzimuthHue {
  const lane = azimuthLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function azimuthHouse(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "house";
}

export function azimuthFort(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "fort";
}

export function azimuthHarbor(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "harbor";
}

export function azimuthDigitLane(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "digit";
}

export function azimuthSpark(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "spark";
}

export function azimuthScroll(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "scroll";
}

export function azimuthVowelLane(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "vowel";
}

export function azimuthPost(raw: AzimuthValue): boolean {
  return azimuthLane(raw) === "post";
}

export function azimuthOpen(raw: AzimuthValue): boolean {
  return azimuthState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function azimuthHeld(raw: AzimuthValue): boolean {
  const lane = azimuthLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function azimuthSoon(raw: AzimuthValue): boolean {
  if (azimuthState(raw) !== "set") return false;
  if (azimuthSpark(raw)) return true;
  if (azimuthHouse(raw)) return false;
  const length = azimuthGiven(raw).length;
  return length > 0 && length <= 1;
}

export function azimuthLength(raw: AzimuthValue): number | null {
  if (azimuthState(raw) !== "set") return null;
  return azimuthGiven(raw).length;
}

export function azimuthEven(raw: AzimuthValue): boolean {
  const length = azimuthLength(raw);
  return length !== null && length % 2 === 0;
}

export function azimuthOdd(raw: AzimuthValue): boolean {
  const length = azimuthLength(raw);
  return length !== null && length % 2 === 1;
}

export function azimuthFirst(raw: AzimuthValue): boolean {
  return /^[A-Za-z]/.test(azimuthGiven(raw));
}

export function azimuthTail(raw: AzimuthValue): boolean {
  return /[0-9]$/.test(azimuthGiven(raw));
}

export function azimuthCapital(raw: AzimuthValue): boolean {
  return /[A-Z]/.test(azimuthGiven(raw));
}

export function azimuthSpace(raw: AzimuthValue): boolean {
  return azimuthGiven(raw).includes(" ");
}

export function azimuthVowel(raw: AzimuthValue): boolean {
  return /^[aeiou]/i.test(azimuthGiven(raw));
}

export function azimuthDigit(raw: AzimuthValue): boolean {
  return /[0-9]/.test(azimuthGiven(raw));
}

export function azimuthLetter(raw: AzimuthValue): boolean {
  return /[A-Za-z]/.test(azimuthGiven(raw));
}

export function azimuthMixed(raw: AzimuthValue): boolean {
  return azimuthDigit(raw) && azimuthLetter(raw);
}

export function azimuthLower(raw: AzimuthValue): boolean {
  const text = azimuthGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function azimuthUpper(raw: AzimuthValue): boolean {
  const text = azimuthGiven(raw);
  return text.length >= 6 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function azimuthHyphen(raw: AzimuthValue): boolean {
  return azimuthGiven(raw).includes("-");
}

export function azimuthPeriod(raw: AzimuthValue): boolean {
  return azimuthGiven(raw).includes(".");
}

export function azimuthStamp(raw: AzimuthValue): string {
  const text = azimuthGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function azimuthCopy(raw: AzimuthValue): string {
  return azimuthGiven(raw);
}

export function azimuthFamily(raw: AzimuthValue): string {
  if (azimuthState(raw) !== "set") return "";
  return firstToken(azimuthGiven(raw));
}

export function azimuthLanes(rows: readonly AzimuthRow[]): AzimuthLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of UMBRA_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = azimuthLane(row.azimuth);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return UMBRA_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingAzimuth(rows: readonly AzimuthRow[]): string {
  const lines = azimuthLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || UMBRA_LANES.indexOf(a.lane as (typeof UMBRA_LANES)[number]) - UMBRA_LANES.indexOf(b.lane as (typeof UMBRA_LANES)[number]))[0].lane;
}

export function leadingAzimuthHue(rows: readonly AzimuthRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of UMBRA_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = azimuthHue(row.azimuth);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = UMBRA_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || UMBRA_HUES.indexOf(a.hue) - UMBRA_HUES.indexOf(b.hue))[0].hue;
}

export function laneAzimuthCount(rows: readonly AzimuthRow[], lane: AzimuthLane): number {
  return rows.filter((row) => azimuthLane(row.azimuth) === lane).length;
}

export function azimuthShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentAzimuthLanes(rows: readonly AzimuthRow[]): string[] {
  return azimuthLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenAzimuths(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedAzimuths(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleAzimuth(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleAzimuthReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAzimuthReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAzimuthLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: AzimuthRow, shape: AzimuthShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return azimuthHouse(row.azimuth);
  if (shape === "fort") return azimuthFort(row.azimuth);
  if (shape === "harbor") return azimuthHarbor(row.azimuth);
  if (shape === "digit") return azimuthDigitLane(row.azimuth);
  if (shape === "spark") return azimuthSpark(row.azimuth);
  if (shape === "scroll") return azimuthScroll(row.azimuth);
  if (shape === "vowel") return azimuthVowelLane(row.azimuth);
  if (shape === "post") return azimuthPost(row.azimuth);
  if (shape === "open") return azimuthOpen(row.azimuth);
  if (shape === "soon") return azimuthSoon(row.azimuth);
  if (shape === "letter") return azimuthLetter(row.azimuth);
  if (shape === "mixed") return azimuthMixed(row.azimuth);
  if (shape === "upper") return azimuthUpper(row.azimuth);
  if (shape === "lower") return azimuthLower(row.azimuth);
  if (shape === "space") return azimuthSpace(row.azimuth);
  if (shape === "even") return azimuthEven(row.azimuth);
  if (shape === "odd") return azimuthOdd(row.azimuth);
  if (shape === "tail") return azimuthTail(row.azimuth);
  if (shape === "first") return azimuthFirst(row.azimuth);
  if (shape === "cased") return azimuthHeld(row.azimuth);
  if (shape === "hyphen") return azimuthHyphen(row.azimuth);
  if (shape === "period") return azimuthPeriod(row.azimuth);
  return azimuthLane(row.azimuth) === shape;
}

export function visibleAzimuths(
  rows: readonly AzimuthRow[],
  lane: string,
  hue: string,
  query: string,
  review: AzimuthReview,
  reviewed: readonly string[],
  shape: AzimuthShape,
): AzimuthRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (azimuthState(row.azimuth) === "") return false;
    const found = azimuthLane(row.azimuth);
    const hueName = azimuthHue(row.azimuth);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${azimuthGiven(row.azimuth)} ${azimuthStamp(row.azimuth)} ${azimuthFamily(row.azimuth)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function azimuthLanesCsv(rows: readonly AzimuthRow[]): string {
  const lines = ["lane,count"];
  for (const line of azimuthLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function azimuthRowsCsv(rows: readonly AzimuthRow[], reviewed: readonly string[]): string {
  const lines = ["name,language,stamp,family,lane,hue,length,realm,ridge,vale,chip,even,cipher,mixed,upper,vowel,tail,cased,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(azimuthGiven(row.azimuth)),
        azimuthStamp(row.azimuth),
        csvCell(azimuthFamily(row.azimuth)),
        azimuthLane(row.azimuth),
        azimuthHue(row.azimuth),
        azimuthLength(row.azimuth) ?? "",
        azimuthHouse(row.azimuth) ? "1" : "0",
        azimuthFort(row.azimuth) ? "1" : "0",
        azimuthHarbor(row.azimuth) ? "1" : "0",
        azimuthSpark(row.azimuth) ? "1" : "0",
        azimuthEven(row.azimuth) ? "1" : "0",
        azimuthDigit(row.azimuth) ? "1" : "0",
        azimuthMixed(row.azimuth) ? "1" : "0",
        azimuthUpper(row.azimuth) ? "1" : "0",
        azimuthVowel(row.azimuth) ? "1" : "0",
        azimuthTail(row.azimuth) ? "1" : "0",
        azimuthHeld(row.azimuth) ? "1" : "0",
        azimuthSoon(row.azimuth) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
