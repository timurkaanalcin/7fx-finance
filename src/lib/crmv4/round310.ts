/**
 * Chorobates rules for a survey beam kept in this browser, and datum plates read the campaign already stored on the account.
 * Beams are beam, sill, pier, and arch. Stones are ash, elm, and box.
 * Pegs are 4, 8, 16, or 32. Arms are 1, 5, or 8.
 * A house campaign is HOUSE, PARTNER, DIRECT, or ORGANIC. A dash contains a hyphen. A gap has a space.
 * A chip is two characters or fewer. A tome is fourteen characters or longer. A mark contains a number.
 * A true campaign mark reads as HOUSE. A false campaign mark reads as OPEN DESK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_chorobates (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   staff text not null default '',
 *   wood text not null default '',
 *   notch_no integer,
 *   vane_no integer not null default 1,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   racked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_datum_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_datum_review (
 *   trader_id text primary key
 * );
 */

export const CHB_KEY = "crmv4-chorobates";
export const CHB_VIEW_KEY = "crmv4-chorobates-views";
export const CHB_DENSITY_KEY = "crmv4-chorobates-density";
export const CHB_STAVES = ["beam", "sill", "pier", "arch"] as const;

export type ChorobatesStaff = (typeof CHB_STAVES)[number];

export type ChorobatesWood = "blank" | "ash" | "elm" | "box";

export type ChorobatesTray = "yard" | "rack" | "case";

export type ChorobatesDensity = "broad" | "tight";

export type ChorobatesSort = "staff" | "bearer";

export type Chorobates = {
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

export type ChorobatesView = {
  id: string;
  name: string;
  tray: ChorobatesTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type ChorobatesCounts = {
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

export const ROUND310_FEATURES = [
  "save",
  "note",
  "beams",
  "stone",
  "peg",
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
  "fair-beam",
  "viewer",
  "suggest",
  "sla",
  "datum",
  "datum-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["ash", "elm", "box"] as const;

const NOTCH_CYCLE = [4, 8, 16, 32] as const;

const VANE_CYCLE = [1, 5, 8] as const;

const INNER = new Set(["beam", "sill"]);

const OUTER = new Set(["pier", "arch"]);

const HOUSE_WEAVE = new Set(["ASH", "BOX"]);

const HOUSE_STATUSES = new Set(["HOUSE", "PARTNER", "DIRECT", "ORGANIC"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ChorobatesTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<ChorobatesWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<ChorobatesWood, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ae]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Chorobates, tray: ChorobatesTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return CHB_STAVES.indexOf(staff as ChorobatesStaff);
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

export function chorobatesStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CHB_STAVES as readonly string[]).includes(text) ? text : "";
}

/** A notch is 3, 6, 12, or 24. Anything else stays blank. */
export function chorobatesNotch(raw: unknown): 4 | 8 | 16 | 32 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "16" && text !== "32") return null;
  return Number(text) as 4 | 8 | 16 | 32;
}

/** A vane is 2, 4, or 9. Anything else stays blank. */
export function chorobatesVane(raw: unknown): 1 | 5 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "5" && text !== "8") return null;
  return Number(text) as 1 | 5 | 8;
}

/** A wood is lime, yew, or oak. The saved name is the upper token. */
export function chorobatesWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function chorobatesInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function chorobatesOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Reed is the stem. Wand is the switch. Pole is the shaft. Mast is the spar. */
export function chorobatesBand(staff: unknown): string {
  const text = chorobatesStaff(staff);
  if (!text) return "";
  if (text === "beam") return "level";
  if (text === "sill") return "plumb";
  if (text === "pier") return "cord";
  return "stake";
}

/** Signed distance from one watch to another along the chorobates. */
export function chorobatesGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(chorobatesStaff(from));
  const right = staffIndex(chorobatesStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(chorobatesWood(wood));
}

/** A pair vane is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return chorobatesVane(vane) === 5;
}

/** A full vane is 9. */
export function fullVane(vane: unknown): boolean {
  return chorobatesVane(vane) === 8;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return chorobatesStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = chorobatesNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = chorobatesWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = chorobatesVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveChorobatesFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the staff uses least. A tie keeps oak, then lime, then yew. */
export function suggestWood(cards: readonly Chorobates[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "BOX";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["BOX", "ASH", "ELM"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest three. Morning asks for six. Afternoon asks for twelve. Evening asks for twenty-four. A saved notch on the staff wins, and a tie keeps the taller notch. */
export function suggestNotch(cards: readonly Chorobates[], hour: number): 4 | 8 | 16 | 32 {
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
  if (hour < 4) return 4;
  if (hour < 8) return 8;
  if (hour < 13) return 16;
  return 32;
}

/** Before seven, suggest the beam. The rest of the day suggests the arch. */
export function suggestStaff(hour: number): ChorobatesStaff {
  return hour < 7 ? "beam" : "arch";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Chorobates[], roster: string): string {
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

export function readChorobatesRules(raw: unknown): Chorobates[] {
  if (!Array.isArray(raw)) return [];
  const out: Chorobates[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chorobates>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: chorobatesStaff(row.staff),
      notch: chorobatesNotch(row.notch),
      wood: chorobatesWood(row.wood),
      vane: chorobatesVane(row.vane) ?? 1,
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

export function addChorobates(
  cards: readonly Chorobates[],
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
): Chorobates[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readChorobatesRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: chorobatesStaff(card.staff),
      notch: chorobatesNotch(card.notch),
      wood: chorobatesWood(card.wood),
      vane: chorobatesVane(card.vane) ?? 1,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Chorobates[], id: string, edit: (card: Chorobates) => Chorobates): Chorobates[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editChorobates(cards: readonly Chorobates[], id: string, title: string): Chorobates[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editChorobatesNote(cards: readonly Chorobates[], id: string, note: string): Chorobates[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "ASH", "ELM", "BOX"];
  const index = order.indexOf(chorobatesWood(wood));
  return order[(index + 1) % order.length] || "ASH";
}

export function setChorobatesWood(cards: readonly Chorobates[], id: string, wood: string): Chorobates[] {
  const next = chorobatesWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setChorobatesSighted(cards: readonly Chorobates[], id: string, sighted: boolean): Chorobates[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setChorobatesRack(cards: readonly Chorobates[], id: string, racked: boolean): Chorobates[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setChorobatesVault(cards: readonly Chorobates[], id: string, cased: boolean): Chorobates[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setChorobatesStar(cards: readonly Chorobates[], id: string, starred: boolean): Chorobates[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addChorobatesTag(cards: readonly Chorobates[], id: string, tag: string): Chorobates[] {
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

function stepVane(vane: number, dir: 1 | -1): 1 | 5 | 8 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftNotch(cards: readonly Chorobates[], id: string): Chorobates[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Chorobates[], id: string): Chorobates[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Chorobates[], id: string): Chorobates[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Chorobates[], id: string): Chorobates[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setChorobatesFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackChorobatesFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return setChorobatesRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starChorobatesFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return setChorobatesStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagChorobatesFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return addChorobatesTag(cards, id, "a");
}

export function woodFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  const card = cards.find((item) => item.id === id);
  return card ? setChorobatesWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Chorobates[], id: string): Chorobates[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Chorobates[], ids: readonly string[], edit: (card: Chorobates) => Chorobates): Chorobates[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkChorobatesOak(cards: readonly Chorobates[], ids: readonly string[]): Chorobates[] {
  return bulk(cards, ids, (card) => (card.wood === "BOX" ? card : { ...card, wood: "BOX", audit: "wood" }));
}

export function bulkChorobatesSighted(cards: readonly Chorobates[], ids: readonly string[]): Chorobates[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkChorobatesVault(cards: readonly Chorobates[], ids: readonly string[]): Chorobates[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkChorobatesTag(cards: readonly Chorobates[], ids: readonly string[]): Chorobates[] {
  return bulk(cards, ids, (card) => (card.tags.includes("e") ? card : { ...card, tags: tagsOf([...card.tags, "e"]), audit: "tag" }));
}

export function readChorobatesViews(raw: unknown): ChorobatesView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChorobatesView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChorobatesView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["ASH", "ELM", "BOX"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addChorobatesView(views: readonly ChorobatesView[], view: ChorobatesView): ChorobatesView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readChorobatesViews([...views, { ...view, id, name }]);
}

export function dropChorobatesView(views: readonly ChorobatesView[], id: string): ChorobatesView[] {
  return views.filter((view) => view.id !== id);
}

export function chorobatesDensity(raw: unknown): ChorobatesDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortChorobatesRules(cards: readonly Chorobates[], sort: ChorobatesSort): Chorobates[] {
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

export function visibleChorobatesRules(
  cards: readonly Chorobates[],
  tray: ChorobatesTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Chorobates[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : chorobatesWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !chorobatesInner(card.staff)) return false;
    if (wantStaff === "outer" && !chorobatesOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer beam on arm one, still unlevelled and not in the chest, is overdue. */
export function overdueChorobates(card: Chorobates): boolean {
  return chorobatesOuter(card.staff) && card.vane === 1 && !card.sighted && !card.cased;
}

/** No stone, the short peg, arm one, and still on the yard. */
export function idleChorobates(card: Chorobates): boolean {
  return !card.wood && card.notch === 4 && card.vane === 1 && !card.sighted && !card.racked && !card.cased;
}

/** Box, a tall peg, and a full arm, still out of the chest. */
export function briskChorobates(card: Chorobates): boolean {
  return card.wood === "BOX" && card.notch === 32 && card.vane === 8 && !card.cased;
}

/** Arch, elm, and peg eight. */
export function restingChorobates(card: Chorobates): boolean {
  return card.staff === "arch" && card.wood === "ELM" && card.notch === 8;
}

/** A beam is late when the desk is already on the arch. */
export function lateChorobates(card: Chorobates, desk: string): boolean {
  return card.staff === "beam" && chorobatesStaff(desk) === "arch" && !card.sighted;
}

export function chorobatesCounts(cards: readonly Chorobates[], shown: readonly Chorobates[], desk: string): ChorobatesCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => chorobatesInner(card.staff)).length,
    outer: cards.filter((card) => chorobatesOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 32).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleChorobates).length,
    brisk: cards.filter(briskChorobates).length,
    resting: cards.filter(restingChorobates).length,
    overdue: cards.filter(overdueChorobates).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateChorobates(card, desk)).length,
  };
}

export function chorobatesBars(cards: readonly Chorobates[]): { staff: string; count: number }[] {
  return CHB_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function chorobatesTimeline(cards: readonly Chorobates[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function chorobatesBearers(cards: readonly Chorobates[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Chorobates[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of chorobatesBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderChorobatesRules(cards: readonly Chorobates[]): string[] {
  return cards.filter(overdueChorobates).map((card) => card.title);
}

export function chorobatesCopy(card: Chorobates): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function chorobatesCsv(cards: readonly Chorobates[], desk: string): string {
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
        chorobatesOuter(card.staff) ? "1" : "0",
        lateChorobates(card, desk) ? "1" : "0",
        idleChorobates(card) ? "1" : "0",
        briskChorobates(card) ? "1" : "0",
        restingChorobates(card) ? "1" : "0",
        overdueChorobates(card) ? "1" : "0",
        chorobatesInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        chorobatesBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const DTM_KEY = "crmv4-datum-hide";
export const DTM_REVIEW_KEY = "crmv4-datum-review";

export type DatumLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type DatumHue = "" | "ivory" | "graphite" | "champagne";

export type DatumState = "" | "clear" | "set";

export type DatumReview = "all" | "reviewed" | "fresh";

export type DatumShape =
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

export type DatumValue = string | { campaign?: unknown; [key: string]: unknown } | null | undefined;

export type DatumRow = { id: string; label: string; datum: DatumValue };

export type DatumLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function datumRecord(raw: DatumValue): { campaign?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function datumBlocked(raw: DatumValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function datumGiven(raw: DatumValue): string {
  const row = datumRecord(raw);
  if (row && !("campaign" in row)) return "";
  const value = row ? row.campaign : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOUSE";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN DESK";
  return clip(value, 48);
}

function datumReadable(raw: DatumValue): boolean {
  if (datumBlocked(raw)) return false;
  const row = datumRecord(raw);
  if (row && !("campaign" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function datumState(raw: DatumValue): DatumState {
  if (!datumReadable(raw)) return "";
  return datumGiven(raw) ? "set" : "clear";
}

/** A house campaign is HOUSE, PARTNER, DIRECT, or ORGANIC. A ridge contains a hyphen. A vale has a space. A cipher contains a number. A chip is two characters or fewer. An atlas is fourteen characters or longer. */
export function datumLane(raw: DatumValue): DatumLane {
  if (datumState(raw) !== "set") return "";
  const text = datumGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 2) return "spark";
  if (text.length >= 14) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function datumHue(raw: DatumValue): DatumHue {
  const lane = datumLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function datumHouse(raw: DatumValue): boolean {
  return datumLane(raw) === "house";
}

export function datumFort(raw: DatumValue): boolean {
  return datumLane(raw) === "fort";
}

export function datumHarbor(raw: DatumValue): boolean {
  return datumLane(raw) === "harbor";
}

export function datumDigitLane(raw: DatumValue): boolean {
  return datumLane(raw) === "digit";
}

export function datumSpark(raw: DatumValue): boolean {
  return datumLane(raw) === "spark";
}

export function datumScroll(raw: DatumValue): boolean {
  return datumLane(raw) === "scroll";
}

export function datumVowelLane(raw: DatumValue): boolean {
  return datumLane(raw) === "vowel";
}

export function datumPost(raw: DatumValue): boolean {
  return datumLane(raw) === "post";
}

export function datumOpen(raw: DatumValue): boolean {
  return datumState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function datumHeld(raw: DatumValue): boolean {
  const lane = datumLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function datumSoon(raw: DatumValue): boolean {
  if (datumState(raw) !== "set") return false;
  if (datumSpark(raw)) return true;
  if (datumHouse(raw)) return false;
  const length = datumGiven(raw).length;
  return length > 0 && length <= 1;
}

export function datumLength(raw: DatumValue): number | null {
  if (datumState(raw) !== "set") return null;
  return datumGiven(raw).length;
}

export function datumEven(raw: DatumValue): boolean {
  const length = datumLength(raw);
  return length !== null && length % 2 === 0;
}

export function datumOdd(raw: DatumValue): boolean {
  const length = datumLength(raw);
  return length !== null && length % 2 === 1;
}

export function datumFirst(raw: DatumValue): boolean {
  return /^[A-Za-z]/.test(datumGiven(raw));
}

export function datumTail(raw: DatumValue): boolean {
  return /[0-9]$/.test(datumGiven(raw));
}

export function datumCapital(raw: DatumValue): boolean {
  return /[A-Z]/.test(datumGiven(raw));
}

export function datumSpace(raw: DatumValue): boolean {
  return datumGiven(raw).includes(" ");
}

export function datumVowel(raw: DatumValue): boolean {
  return /^[aeiou]/i.test(datumGiven(raw));
}

export function datumDigit(raw: DatumValue): boolean {
  return /[0-9]/.test(datumGiven(raw));
}

export function datumLetter(raw: DatumValue): boolean {
  return /[A-Za-z]/.test(datumGiven(raw));
}

export function datumMixed(raw: DatumValue): boolean {
  return datumDigit(raw) && datumLetter(raw);
}

export function datumLower(raw: DatumValue): boolean {
  const text = datumGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function datumUpper(raw: DatumValue): boolean {
  const text = datumGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function datumHyphen(raw: DatumValue): boolean {
  return datumGiven(raw).includes("-");
}

export function datumPeriod(raw: DatumValue): boolean {
  return datumGiven(raw).includes(".");
}

export function datumStamp(raw: DatumValue): string {
  const text = datumGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function datumCopy(raw: DatumValue): string {
  return datumGiven(raw);
}

export function datumFamily(raw: DatumValue): string {
  if (datumState(raw) !== "set") return "";
  return firstToken(datumGiven(raw));
}

export function datumLanes(rows: readonly DatumRow[]): DatumLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = datumLane(row.datum);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingDatum(rows: readonly DatumRow[]): string {
  const lines = datumLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingDatumHue(rows: readonly DatumRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = datumHue(row.datum);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function laneDatumCount(rows: readonly DatumRow[], lane: DatumLane): number {
  return rows.filter((row) => datumLane(row.datum) === lane).length;
}

export function datumShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentDatumLanes(rows: readonly DatumRow[]): string[] {
  return datumLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenDatums(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedDatums(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleDatum(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleDatumReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDatumReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDatumLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: DatumRow, shape: DatumShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return datumHouse(row.datum);
  if (shape === "fort") return datumFort(row.datum);
  if (shape === "harbor") return datumHarbor(row.datum);
  if (shape === "digit") return datumDigitLane(row.datum);
  if (shape === "spark") return datumSpark(row.datum);
  if (shape === "scroll") return datumScroll(row.datum);
  if (shape === "vowel") return datumVowelLane(row.datum);
  if (shape === "post") return datumPost(row.datum);
  if (shape === "open") return datumOpen(row.datum);
  if (shape === "soon") return datumSoon(row.datum);
  if (shape === "letter") return datumLetter(row.datum);
  if (shape === "mixed") return datumMixed(row.datum);
  if (shape === "upper") return datumUpper(row.datum);
  if (shape === "lower") return datumLower(row.datum);
  if (shape === "space") return datumSpace(row.datum);
  if (shape === "even") return datumEven(row.datum);
  if (shape === "odd") return datumOdd(row.datum);
  if (shape === "tail") return datumTail(row.datum);
  if (shape === "first") return datumFirst(row.datum);
  if (shape === "cased") return datumHeld(row.datum);
  if (shape === "hyphen") return datumHyphen(row.datum);
  if (shape === "period") return datumPeriod(row.datum);
  return datumLane(row.datum) === shape;
}

export function visibleDatums(
  rows: readonly DatumRow[],
  lane: string,
  hue: string,
  query: string,
  review: DatumReview,
  reviewed: readonly string[],
  shape: DatumShape,
): DatumRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (datumState(row.datum) === "") return false;
    const found = datumLane(row.datum);
    const hueName = datumHue(row.datum);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${datumGiven(row.datum)} ${datumStamp(row.datum)} ${datumFamily(row.datum)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function datumLanesCsv(rows: readonly DatumRow[]): string {
  const lines = ["lane,count"];
  for (const line of datumLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function datumRowsCsv(rows: readonly DatumRow[], reviewed: readonly string[]): string {
  const lines = ["name,campaign,stamp,family,lane,hue,length,realm,ridge,vale,chip,even,cipher,mixed,upper,vowel,tail,cased,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(datumGiven(row.datum)),
        datumStamp(row.datum),
        csvCell(datumFamily(row.datum)),
        datumLane(row.datum),
        datumHue(row.datum),
        datumLength(row.datum) ?? "",
        datumHouse(row.datum) ? "1" : "0",
        datumFort(row.datum) ? "1" : "0",
        datumHarbor(row.datum) ? "1" : "0",
        datumSpark(row.datum) ? "1" : "0",
        datumEven(row.datum) ? "1" : "0",
        datumDigit(row.datum) ? "1" : "0",
        datumMixed(row.datum) ? "1" : "0",
        datumUpper(row.datum) ? "1" : "0",
        datumVowel(row.datum) ? "1" : "0",
        datumTail(row.datum) ? "1" : "0",
        datumHeld(row.datum) ? "1" : "0",
        datumSoon(row.datum) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
