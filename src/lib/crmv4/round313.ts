/**
 * Scaphe rules for a bowl sundial kept in this browser, and shade plates read the desk id already stored on the account.
 * Parts are lip, bowl, pin, and well. Stones are marble, slate, and chalk.
 * Hours are 6, 9, 12, or 15. Marks are 2, 4, or 8.
 * A known desk id is NORTH, SOUTH, EAST, or WEST. A dash contains a hyphen. A gap has a space.
 * A chip is two characters or fewer. A tome is fourteen characters or longer. A cipher contains a number.
 * A true desk id reads as NORTH. A false desk id reads as OPEN SHADE.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_scaphe (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   staff text not null default '',
 *   stone text not null default '',
 *   hour_no integer,
 *   mark_no integer not null default 2,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   racked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_shade_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_shade_review (
 *   trader_id text primary key
 * );
 */



export const SCP_KEY = "crmv4-scaphe";
export const SCP_VIEW_KEY = "crmv4-scaphe-views";
export const SCP_DENSITY_KEY = "crmv4-scaphe-density";
export const SCP_STAVES = ["lip", "bowl", "pin", "well"] as const;

export type ScapheStaff = (typeof SCP_STAVES)[number];

export type ScapheWood = "blank" | "ash" | "elm" | "box";

export type ScapheTray = "yard" | "rack" | "case";

export type ScapheDensity = "broad" | "tight";

export type ScapheSort = "staff" | "bearer";

export type Scaphe = {
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

export type ScapheView = {
  id: string;
  name: string;
  tray: ScapheTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type ScapheCounts = {
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

export const ROUND313_FEATURES = [
  "save",
  "note",
  "parts",
  "stone",
  "hour",
  "vault",
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
  "fair-bowl",
  "viewer",
  "suggest",
  "sla",
  "shade",
  "shade-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["marble", "slate", "chalk"] as const;

const NOTCH_CYCLE = [6, 9, 12, 15] as const;

const VANE_CYCLE = [2, 4, 8] as const;

const INNER = new Set(["lip", "bowl"]);

const OUTER = new Set(["pin", "well"]);

const HOUSE_WEAVE = new Set(["MARBLE", "CHALK"]);

const HOUSE_STATUSES = new Set(["NORTH", "SOUTH", "EAST", "WEST"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ScapheTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<ScapheWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<ScapheWood, "blank">) : "";
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

function inTray(card: Scaphe, tray: ScapheTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return SCP_STAVES.indexOf(staff as ScapheStaff);
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

export function scapheStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SCP_STAVES as readonly string[]).includes(text) ? text : "";
}

/** An hour is 6, 9, 12, or 15. Anything else stays blank. */
export function scapheNotch(raw: unknown): 6 | 9 | 12 | 15 | null {
  const text = wholeToken(raw);
  if (text !== "6" && text !== "9" && text !== "12" && text !== "15") return null;
  return Number(text) as 6 | 9 | 12 | 15;
}

/** A mark is 2, 4, or 8. Anything else stays blank. */
export function scapheVane(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** A wood is marble, slate, or chalk. The saved name is the upper token. */
export function scapheWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function scapheInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function scapheOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Lip is the rim. Bowl is the cup. Pin is the style. Well is the base. */
export function scapheBand(staff: unknown): string {
  const text = scapheStaff(staff);
  if (!text) return "";
  if (text === "lip") return "rim";
  if (text === "bowl") return "cup";
  if (text === "pin") return "style";
  return "base";
}

/** Signed distance from one watch to another along the scaphe. */
export function scapheGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(scapheStaff(from));
  const right = staffIndex(scapheStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(scapheWood(wood));
}

/** A pair mark is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return scapheVane(vane) === 4;
}

/** A full mark is 8. */
export function fullVane(vane: unknown): boolean {
  return scapheVane(vane) === 8;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return scapheStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = scapheNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = scapheWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = scapheVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveScapheFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the frame uses least. A tie keeps chalk, then marble, then slate. */
export function suggestWood(cards: readonly Scaphe[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "CHALK";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["CHALK", "MARBLE", "SLATE"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest five. Morning asks for ten. Afternoon asks for fifteen. Evening asks for twenty. A saved rung on the leg wins, and a tie keeps the taller rung. */
export function suggestNotch(cards: readonly Scaphe[], hour: number): 6 | 9 | 12 | 15 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.notch === null) continue;
    seen = true;
    counts.set(card.notch, (counts.get(card.notch) || 0) + 1);
  }
  if (seen) {
    let best: 6 | 9 | 12 | 15 = 15;
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
  if (hour < 5) return 6;
  if (hour < 9) return 9;
  if (hour < 14) return 12;
  return 15;
}

/** Before six, suggest the lip. The rest of the day suggests the well. */
export function suggestStaff(hour: number): ScapheStaff {
  return hour < 6 ? "lip" : "well";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Scaphe[], roster: string): string {
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

export function readScapheRules(raw: unknown): Scaphe[] {
  if (!Array.isArray(raw)) return [];
  const out: Scaphe[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Scaphe>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: scapheStaff(row.staff),
      notch: scapheNotch(row.notch),
      wood: scapheWood(row.wood),
      vane: scapheVane(row.vane) ?? 1,
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

export function addScaphe(
  cards: readonly Scaphe[],
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
): Scaphe[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readScapheRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: scapheStaff(card.staff),
      notch: scapheNotch(card.notch),
      wood: scapheWood(card.wood),
      vane: scapheVane(card.vane) ?? 1,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Scaphe[], id: string, edit: (card: Scaphe) => Scaphe): Scaphe[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editScaphe(cards: readonly Scaphe[], id: string, title: string): Scaphe[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editScapheNote(cards: readonly Scaphe[], id: string, note: string): Scaphe[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "MARBLE", "SLATE", "CHALK"];
  const index = order.indexOf(scapheWood(wood));
  return order[(index + 1) % order.length] || "MARBLE";
}

export function setScapheWood(cards: readonly Scaphe[], id: string, wood: string): Scaphe[] {
  const next = scapheWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setScapheSighted(cards: readonly Scaphe[], id: string, sighted: boolean): Scaphe[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setScapheRack(cards: readonly Scaphe[], id: string, racked: boolean): Scaphe[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setScapheVault(cards: readonly Scaphe[], id: string, cased: boolean): Scaphe[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setScapheStar(cards: readonly Scaphe[], id: string, starred: boolean): Scaphe[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addScapheTag(cards: readonly Scaphe[], id: string, tag: string): Scaphe[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepNotch(notch: number | null, dir: 1 | -1): 6 | 9 | 12 | 15 {
  if (notch === null) return dir > 0 ? 6 : 15;
  const index = notchIndex(notch);
  const next = index < 0 ? 0 : (index + dir + NOTCH_CYCLE.length) % NOTCH_CYCLE.length;
  return NOTCH_CYCLE[next];
}

function stepVane(vane: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftNotch(cards: readonly Scaphe[], id: string): Scaphe[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Scaphe[], id: string): Scaphe[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Scaphe[], id: string): Scaphe[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Scaphe[], id: string): Scaphe[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setScapheFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackScapheFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return setScapheRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starScapheFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return setScapheStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagScapheFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return addScapheTag(cards, id, "a");
}

export function woodFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  const card = cards.find((item) => item.id === id);
  return card ? setScapheWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Scaphe[], id: string): Scaphe[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Scaphe[], ids: readonly string[], edit: (card: Scaphe) => Scaphe): Scaphe[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkScapheOak(cards: readonly Scaphe[], ids: readonly string[]): Scaphe[] {
  return bulk(cards, ids, (card) => (card.wood === "CHALK" ? card : { ...card, wood: "CHALK", audit: "wood" }));
}

export function bulkScapheSighted(cards: readonly Scaphe[], ids: readonly string[]): Scaphe[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkScapheVault(cards: readonly Scaphe[], ids: readonly string[]): Scaphe[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkScapheTag(cards: readonly Scaphe[], ids: readonly string[]): Scaphe[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readScapheViews(raw: unknown): ScapheView[] {
  if (!Array.isArray(raw)) return [];
  const out: ScapheView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ScapheView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["MARBLE", "SLATE", "CHALK"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addScapheView(views: readonly ScapheView[], view: ScapheView): ScapheView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readScapheViews([...views, { ...view, id, name }]);
}

export function dropScapheView(views: readonly ScapheView[], id: string): ScapheView[] {
  return views.filter((view) => view.id !== id);
}

export function scapheDensity(raw: unknown): ScapheDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortScapheRules(cards: readonly Scaphe[], sort: ScapheSort): Scaphe[] {
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

export function visibleScapheRules(
  cards: readonly Scaphe[],
  tray: ScapheTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Scaphe[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : scapheWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !scapheInner(card.staff)) return false;
    if (wantStaff === "outer" && !scapheOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer leg on bob one, still unlevelled and not in the chest, is overdue. */
export function overdueScaphe(card: Scaphe): boolean {
  return scapheOuter(card.staff) && card.vane === 2 && !card.sighted && !card.cased;
}

/** No wood, the short rung, bob one, and still on the yard. */
export function idleScaphe(card: Scaphe): boolean {
  return !card.wood && card.notch === 6 && card.vane === 2 && !card.sighted && !card.racked && !card.cased;
}

/** Pine, a tall rung, and a full bob, still out of the chest. */
export function briskScaphe(card: Scaphe): boolean {
  return card.wood === "CHALK" && card.notch === 15 && card.vane === 8 && !card.cased;
}

/** Foot, slate, and rung ten. */
export function restingScaphe(card: Scaphe): boolean {
  return card.staff === "well" && card.wood === "SLATE" && card.notch === 9;
}

/** A lip is late when the desk is already on the well. */
export function lateScaphe(card: Scaphe, desk: string): boolean {
  return card.staff === "lip" && scapheStaff(desk) === "well" && !card.sighted;
}

export function scapheCounts(cards: readonly Scaphe[], shown: readonly Scaphe[], desk: string): ScapheCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => scapheInner(card.staff)).length,
    outer: cards.filter((card) => scapheOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 15).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleScaphe).length,
    brisk: cards.filter(briskScaphe).length,
    resting: cards.filter(restingScaphe).length,
    overdue: cards.filter(overdueScaphe).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateScaphe(card, desk)).length,
  };
}

export function scapheBars(cards: readonly Scaphe[]): { staff: string; count: number }[] {
  return SCP_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function scapheTimeline(cards: readonly Scaphe[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function scapheBearers(cards: readonly Scaphe[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Scaphe[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of scapheBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderScapheRules(cards: readonly Scaphe[]): string[] {
  return cards.filter(overdueScaphe).map((card) => card.title);
}

export function scapheCopy(card: Scaphe): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function scapheCsv(cards: readonly Scaphe[], desk: string): string {
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
        scapheOuter(card.staff) ? "1" : "0",
        lateScaphe(card, desk) ? "1" : "0",
        idleScaphe(card) ? "1" : "0",
        briskScaphe(card) ? "1" : "0",
        restingScaphe(card) ? "1" : "0",
        overdueScaphe(card) ? "1" : "0",
        scapheInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        scapheBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const SHD_KEY = "crmv4-shade-hide";
export const SHD_REVIEW_KEY = "crmv4-shade-review";

export type ShadeLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type ShadeHue = "" | "ivory" | "graphite" | "champagne";

export type ShadeState = "" | "clear" | "set";

export type ShadeReview = "all" | "reviewed" | "fresh";

export type ShadeShape =
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

export type ShadeValue = string | { deskId?: unknown; [key: string]: unknown } | null | undefined;

export type ShadeRow = { id: string; label: string; shade: ShadeValue };

export type ShadeLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function shadeRecord(raw: ShadeValue): { deskId?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function shadeBlocked(raw: ShadeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function shadeGiven(raw: ShadeValue): string {
  const row = shadeRecord(raw);
  if (row && !("deskId" in row)) return "";
  const value = row ? row.deskId : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "NORTH";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN SHADE";
  return clip(value, 48);
}

function shadeReadable(raw: ShadeValue): boolean {
  if (shadeBlocked(raw)) return false;
  const row = shadeRecord(raw);
  if (row && !("deskId" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function shadeState(raw: ShadeValue): ShadeState {
  if (!shadeReadable(raw)) return "";
  return shadeGiven(raw) ? "set" : "clear";
}

/** A known login is NORTH, SOUTH, MARBLE, or WEST. A dash contains a hyphen. A gap has a space. A cipher contains a number. A chip is two characters or fewer. A tome is fourteen characters or longer. */
export function shadeLane(raw: ShadeValue): ShadeLane {
  if (shadeState(raw) !== "set") return "";
  const text = shadeGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 2) return "spark";
  if (text.length >= 14) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function shadeHue(raw: ShadeValue): ShadeHue {
  const lane = shadeLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function shadeHouse(raw: ShadeValue): boolean {
  return shadeLane(raw) === "house";
}

export function shadeFort(raw: ShadeValue): boolean {
  return shadeLane(raw) === "fort";
}

export function shadeHarbor(raw: ShadeValue): boolean {
  return shadeLane(raw) === "harbor";
}

export function shadeDigitLane(raw: ShadeValue): boolean {
  return shadeLane(raw) === "digit";
}

export function shadeSpark(raw: ShadeValue): boolean {
  return shadeLane(raw) === "spark";
}

export function shadeScroll(raw: ShadeValue): boolean {
  return shadeLane(raw) === "scroll";
}

export function shadeVowelLane(raw: ShadeValue): boolean {
  return shadeLane(raw) === "vowel";
}

export function shadePost(raw: ShadeValue): boolean {
  return shadeLane(raw) === "post";
}

export function shadeOpen(raw: ShadeValue): boolean {
  return shadeState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function shadeHeld(raw: ShadeValue): boolean {
  const lane = shadeLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function shadeSoon(raw: ShadeValue): boolean {
  if (shadeState(raw) !== "set") return false;
  if (shadeSpark(raw)) return true;
  if (shadeHouse(raw)) return false;
  const length = shadeGiven(raw).length;
  return length > 0 && length <= 1;
}

export function shadeLength(raw: ShadeValue): number | null {
  if (shadeState(raw) !== "set") return null;
  return shadeGiven(raw).length;
}

export function shadeEven(raw: ShadeValue): boolean {
  const length = shadeLength(raw);
  return length !== null && length % 2 === 0;
}

export function shadeOdd(raw: ShadeValue): boolean {
  const length = shadeLength(raw);
  return length !== null && length % 2 === 1;
}

export function shadeFirst(raw: ShadeValue): boolean {
  return /^[A-Za-z]/.test(shadeGiven(raw));
}

export function shadeTail(raw: ShadeValue): boolean {
  return /[0-9]$/.test(shadeGiven(raw));
}

export function shadeCapital(raw: ShadeValue): boolean {
  return /[A-Z]/.test(shadeGiven(raw));
}

export function shadeSpace(raw: ShadeValue): boolean {
  return shadeGiven(raw).includes(" ");
}

export function shadeVowel(raw: ShadeValue): boolean {
  return /^[aeiou]/i.test(shadeGiven(raw));
}

export function shadeDigit(raw: ShadeValue): boolean {
  return /[0-9]/.test(shadeGiven(raw));
}

export function shadeLetter(raw: ShadeValue): boolean {
  return /[A-Za-z]/.test(shadeGiven(raw));
}

export function shadeMixed(raw: ShadeValue): boolean {
  return shadeDigit(raw) && shadeLetter(raw);
}

export function shadeLower(raw: ShadeValue): boolean {
  const text = shadeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function shadeUpper(raw: ShadeValue): boolean {
  const text = shadeGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function shadeHyphen(raw: ShadeValue): boolean {
  return shadeGiven(raw).includes("-");
}

export function shadePeriod(raw: ShadeValue): boolean {
  return shadeGiven(raw).includes(".");
}

export function shadeStamp(raw: ShadeValue): string {
  const text = shadeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function shadeCopy(raw: ShadeValue): string {
  return shadeGiven(raw);
}

export function shadeFamily(raw: ShadeValue): string {
  if (shadeState(raw) !== "set") return "";
  return firstToken(shadeGiven(raw));
}

export function shadeLanes(rows: readonly ShadeRow[]): ShadeLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = shadeLane(row.shade);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingShade(rows: readonly ShadeRow[]): string {
  const lines = shadeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingShadeHue(rows: readonly ShadeRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = shadeHue(row.shade);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function laneShadeCount(rows: readonly ShadeRow[], lane: ShadeLane): number {
  return rows.filter((row) => shadeLane(row.shade) === lane).length;
}

export function shadeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentShadeLanes(rows: readonly ShadeRow[]): string[] {
  return shadeLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenShades(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedShades(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleShade(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleShadeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkShadeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleShadeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: ShadeRow, shape: ShadeShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return shadeHouse(row.shade);
  if (shape === "fort") return shadeFort(row.shade);
  if (shape === "harbor") return shadeHarbor(row.shade);
  if (shape === "digit") return shadeDigitLane(row.shade);
  if (shape === "spark") return shadeSpark(row.shade);
  if (shape === "scroll") return shadeScroll(row.shade);
  if (shape === "vowel") return shadeVowelLane(row.shade);
  if (shape === "post") return shadePost(row.shade);
  if (shape === "open") return shadeOpen(row.shade);
  if (shape === "soon") return shadeSoon(row.shade);
  if (shape === "letter") return shadeLetter(row.shade);
  if (shape === "mixed") return shadeMixed(row.shade);
  if (shape === "upper") return shadeUpper(row.shade);
  if (shape === "lower") return shadeLower(row.shade);
  if (shape === "space") return shadeSpace(row.shade);
  if (shape === "even") return shadeEven(row.shade);
  if (shape === "odd") return shadeOdd(row.shade);
  if (shape === "tail") return shadeTail(row.shade);
  if (shape === "first") return shadeFirst(row.shade);
  if (shape === "cased") return shadeHeld(row.shade);
  if (shape === "hyphen") return shadeHyphen(row.shade);
  if (shape === "period") return shadePeriod(row.shade);
  return shadeLane(row.shade) === shape;
}

export function visibleShades(
  rows: readonly ShadeRow[],
  lane: string,
  hue: string,
  query: string,
  review: ShadeReview,
  reviewed: readonly string[],
  shape: ShadeShape,
): ShadeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (shadeState(row.shade) === "") return false;
    const found = shadeLane(row.shade);
    const hueName = shadeHue(row.shade);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${shadeGiven(row.shade)} ${shadeStamp(row.shade)} ${shadeFamily(row.shade)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function shadeLanesCsv(rows: readonly ShadeRow[]): string {
  const lines = ["lane,count"];
  for (const line of shadeLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function shadeRowsCsv(rows: readonly ShadeRow[], reviewed: readonly string[]): string {
  const lines = ["name,desk,stamp,family,lane,hue,length,hall,dash,gap,chip,even,cipher,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(shadeGiven(row.shade)),
        shadeStamp(row.shade),
        csvCell(shadeFamily(row.shade)),
        shadeLane(row.shade),
        shadeHue(row.shade),
        shadeLength(row.shade) ?? "",
        shadeHouse(row.shade) ? "1" : "0",
        shadeFort(row.shade) ? "1" : "0",
        shadeHarbor(row.shade) ? "1" : "0",
        shadeSpark(row.shade) ? "1" : "0",
        shadeEven(row.shade) ? "1" : "0",
        shadeDigit(row.shade) ? "1" : "0",
        shadeMixed(row.shade) ? "1" : "0",
        shadeUpper(row.shade) ? "1" : "0",
        shadeVowel(row.shade) ? "1" : "0",
        shadeTail(row.shade) ? "1" : "0",
        shadeHeld(row.shade) ? "1" : "0",
        shadeSoon(row.shade) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
