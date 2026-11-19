/**
 * Groma rules for a survey cross kept in this browser, and pace plates read the browser already stored on the account.
 * Arms are cardo, decumanus, via, and limes. Metals are bronze, iron, and tin.
 * Stakes are 3, 6, 12, or 24. Spokes are 2, 4, or 9.
 * A known browser is CHROME, SAFARI, FIREFOX, or EDGE. A dash contains a hyphen. A gap has a space.
 * A chip is two characters or fewer. A tome is fourteen characters or longer. A mark contains a number.
 * A true browser mark reads as CHROME. A false browser mark reads as OPEN DESK.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_groma (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   staff text not null default '',
 *   metal text not null default '',
 *   stake_no integer,
 *   spoke_no integer not null default 2,
 *   tags text not null default '',
 *   sighted boolean not null default false,
 *   racked boolean not null default false,
 *   cased boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_pace_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_pace_review (
 *   trader_id text primary key
 * );
 */

export const GMA_KEY = "crmv4-groma";
export const GMA_VIEW_KEY = "crmv4-groma-views";
export const GMA_DENSITY_KEY = "crmv4-groma-density";
export const GMA_STAVES = ["cardo", "decumanus", "via", "limes"] as const;

export type GromaStaff = (typeof GMA_STAVES)[number];

export type GromaWood = "blank" | "ash" | "elm" | "box";

export type GromaTray = "yard" | "rack" | "case";

export type GromaDensity = "broad" | "tight";

export type GromaSort = "staff" | "bearer";

export type Groma = {
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

export type GromaView = {
  id: string;
  name: string;
  tray: GromaTray;
  query: string;
  bearer: string;
  wood: string;
  staff: string;
  notch: string;
  vane: string;
};

export type GromaCounts = {
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

export const ROUND311_FEATURES = [
  "save",
  "note",
  "crosses",
  "metal",
  "stake",
  "cist",
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
  "fair-cross",
  "viewer",
  "suggest",
  "sla",
  "pace",
  "pace-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sheath", "resume", "crypt", "open", "tag", "vane", "notch", "lower", "star"] as const;

const WOODS = ["bronze", "iron", "tin"] as const;

const NOTCH_CYCLE = [3, 6, 12, 24] as const;

const VANE_CYCLE = [2, 4, 9] as const;

const INNER = new Set(["cardo", "decumanus"]);

const OUTER = new Set(["via", "limes"]);

const HOUSE_WEAVE = new Set(["BRONZE", "TIN"]);

const HOUSE_STATUSES = new Set(["CHROME", "SAFARI", "FIREFOX", "EDGE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): GromaTray {
  return raw === "rack" || raw === "case" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<GromaWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<GromaWood, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[cd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Groma, tray: GromaTray): boolean {
  if (tray === "rack") return card.racked && !card.cased;
  if (tray === "case") return card.cased;
  return !card.racked && !card.cased;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function staffIndex(staff: string): number {
  return GMA_STAVES.indexOf(staff as GromaStaff);
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

export function gromaStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (GMA_STAVES as readonly string[]).includes(text) ? text : "";
}

/** A notch is 3, 6, 12, or 24. Anything else stays blank. */
export function gromaNotch(raw: unknown): 3 | 6 | 12 | 24 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "12" && text !== "24") return null;
  return Number(text) as 3 | 6 | 12 | 24;
}

/** A vane is 2, 4, or 9. Anything else stays blank. */
export function gromaVane(raw: unknown): 2 | 4 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "9") return null;
  return Number(text) as 2 | 4 | 9;
}

/** A wood is lime, yew, or oak. The saved name is the upper token. */
export function gromaWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function gromaInner(staff: unknown): boolean {
  return INNER.has(clip(staff, 12).toLowerCase());
}

export function gromaOuter(staff: unknown): boolean {
  return OUTER.has(clip(staff, 12).toLowerCase());
}

/** Reed is the stem. Wand is the switch. Pole is the shaft. Mast is the spar. */
export function gromaBand(staff: unknown): string {
  const text = gromaStaff(staff);
  if (!text) return "";
  if (text === "cardo") return "square";
  if (text === "decumanus") return "right";
  if (text === "via") return "line";
  return "bound";
}

/** Signed distance from one watch to another along the groma. */
export function gromaGap(from: unknown, to: unknown): number | null {
  const left = staffIndex(gromaStaff(from));
  const right = staffIndex(gromaStaff(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WEAVE.has(gromaWood(wood));
}

/** A pair vane is 4. Two and eight are not a pair. */
export function pairVane(vane: unknown): boolean {
  return gromaVane(vane) === 4;
}

/** A full vane is 9. */
export function fullVane(vane: unknown): boolean {
  return gromaVane(vane) === 9;
}

export function activeStaff(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return gromaStaff(text) || "all";
}

export function activeNotch(raw: unknown): string {
  const notch = gromaNotch(raw);
  return notch === null ? "all" : String(notch);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = gromaWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = gromaVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveGromaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the staff uses least. A tie keeps oak, then lime, then yew. */
export function suggestWood(cards: readonly Groma[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "TIN";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["TIN", "BRONZE", "IRON"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before five, suggest three. Morning asks for six. Afternoon asks for twelve. Evening asks for twenty-four. A saved notch on the staff wins, and a tie keeps the taller notch. */
export function suggestNotch(cards: readonly Groma[], hour: number): 3 | 6 | 12 | 24 {
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

/** Before seven, suggest the beam. The rest of the day suggests the arch. */
export function suggestStaff(hour: number): GromaStaff {
  return hour < 6 ? "cardo" : "limes";
}

/** The bearer with the fewest unsighted leaves in the court. A tie keeps the roster order. */
export function fairBearer(cards: readonly Groma[], roster: string): string {
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

export function readGromaRules(raw: unknown): Groma[] {
  if (!Array.isArray(raw)) return [];
  const out: Groma[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Groma>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      staff: gromaStaff(row.staff),
      notch: gromaNotch(row.notch),
      wood: gromaWood(row.wood),
      vane: gromaVane(row.vane) ?? 2,
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

export function addGroma(
  cards: readonly Groma[],
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
): Groma[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readGromaRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      staff: gromaStaff(card.staff),
      notch: gromaNotch(card.notch),
      wood: gromaWood(card.wood),
      vane: gromaVane(card.vane) ?? 2,
      tags: tagsOf(card.tags),
      sighted: false,
      racked: false,
      cased: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Groma[], id: string, edit: (card: Groma) => Groma): Groma[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editGroma(cards: readonly Groma[], id: string, title: string): Groma[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editGromaNote(cards: readonly Groma[], id: string, note: string): Groma[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "BRONZE", "IRON", "TIN"];
  const index = order.indexOf(gromaWood(wood));
  return order[(index + 1) % order.length] || "BRONZE";
}

export function setGromaWood(cards: readonly Groma[], id: string, wood: string): Groma[] {
  const next = gromaWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setGromaSighted(cards: readonly Groma[], id: string, sighted: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.sighted === sighted ? card : { ...card, sighted, audit: sighted ? "set" : "clear" }));
}

export function setGromaRack(cards: readonly Groma[], id: string, racked: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.racked === racked ? card : { ...card, racked, cased: racked ? false : card.cased, audit: racked ? "sheath" : "resume" }));
}

export function setGromaVault(cards: readonly Groma[], id: string, cased: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, racked: cased ? false : card.racked, audit: cased ? "crypt" : "open" }));
}

export function setGromaStar(cards: readonly Groma[], id: string, starred: boolean): Groma[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addGromaTag(cards: readonly Groma[], id: string, tag: string): Groma[] {
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

export function liftNotch(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, 1), audit: "notch" }));
}

export function lowerNotch(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, notch: stepNotch(card.notch, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Groma[], id: string): Groma[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

export function setGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, sighted: !card.sighted, audit: card.sighted ? "clear" : "set" })) : [...cards];
}

export function rackGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return setGromaRack(cards, id, !cards.find((card) => card.id === id)?.racked);
}

export function starGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return setGromaStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagGromaFocused(cards: readonly Groma[], id: string): Groma[] {
  return addGromaTag(cards, id, "c");
}

export function woodFocused(cards: readonly Groma[], id: string): Groma[] {
  const card = cards.find((item) => item.id === id);
  return card ? setGromaWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftNotchFocused(cards: readonly Groma[], id: string): Groma[] {
  return liftNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Groma[], id: string): Groma[] {
  return lowerNotch(cards, id);
}

export function raiseVaneFocused(cards: readonly Groma[], id: string): Groma[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Groma[], id: string): Groma[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Groma[], ids: readonly string[], edit: (card: Groma) => Groma): Groma[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkGromaOak(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.wood === "TIN" ? card : { ...card, wood: "TIN", audit: "wood" }));
}

export function bulkGromaSighted(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.sighted ? card : { ...card, sighted: true, audit: "set" }));
}

export function bulkGromaVault(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.cased ? card : { ...card, cased: true, racked: false, audit: "crypt" }));
}

export function bulkGromaTag(cards: readonly Groma[], ids: readonly string[]): Groma[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readGromaViews(raw: unknown): GromaView[] {
  if (!Array.isArray(raw)) return [];
  const out: GromaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<GromaView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      wood: activeWood(row.wood, ["BRONZE", "IRON", "TIN"]),
      staff: activeStaff(row.staff),
      notch: activeNotch(row.notch),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addGromaView(views: readonly GromaView[], view: GromaView): GromaView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readGromaViews([...views, { ...view, id, name }]);
}

export function dropGromaView(views: readonly GromaView[], id: string): GromaView[] {
  return views.filter((view) => view.id !== id);
}

export function gromaDensity(raw: unknown): GromaDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortGromaRules(cards: readonly Groma[], sort: GromaSort): Groma[] {
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

export function visibleGromaRules(
  cards: readonly Groma[],
  tray: GromaTray,
  query: string,
  bearer: string,
  wood: string,
  staff: string,
  notch: string,
  vane: string,
): Groma[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : gromaWood(wood);
  const wantStaff = activeStaff(staff);
  const wantNotch = activeNotch(notch);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStaff === "inner" && !gromaInner(card.staff)) return false;
    if (wantStaff === "outer" && !gromaOuter(card.staff)) return false;
    if (wantStaff !== "all" && wantStaff !== "inner" && wantStaff !== "outer" && card.staff !== wantStaff) return false;
    if (wantNotch !== "all" && String(card.notch ?? "") !== wantNotch) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer beam on arm one, still unlevelled and not in the chest, is overdue. */
export function overdueGroma(card: Groma): boolean {
  return gromaOuter(card.staff) && card.vane === 2 && !card.sighted && !card.cased;
}

/** No stone, the short peg, arm one, and still on the yard. */
export function idleGroma(card: Groma): boolean {
  return !card.wood && card.notch === 3 && card.vane === 2 && !card.sighted && !card.racked && !card.cased;
}

/** Box, a tall peg, and a full arm, still out of the chest. */
export function briskGroma(card: Groma): boolean {
  return card.wood === "TIN" && card.notch === 24 && card.vane === 9 && !card.cased;
}

/** Arch, elm, and peg eight. */
export function restingGroma(card: Groma): boolean {
  return card.staff === "limes" && card.wood === "IRON" && card.notch === 6;
}

/** A beam is late when the desk is already on the arch. */
export function lateGroma(card: Groma, desk: string): boolean {
  return card.staff === "cardo" && gromaStaff(desk) === "limes" && !card.sighted;
}

export function gromaCounts(cards: readonly Groma[], shown: readonly Groma[], desk: string): GromaCounts {
  return {
    court: cards.filter((card) => inTray(card, "yard")).length,
    rack: cards.filter((card) => inTray(card, "rack")).length,
    vault: cards.filter((card) => inTray(card, "case")).length,
    sighted: cards.filter((card) => card.sighted).length,
    inner: cards.filter((card) => gromaInner(card.staff)).length,
    outer: cards.filter((card) => gromaOuter(card.staff)).length,
    wide: cards.filter((card) => card.notch === 32).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    notch: cards.reduce((sum, card) => sum + (card.notch || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleGroma).length,
    brisk: cards.filter(briskGroma).length,
    resting: cards.filter(restingGroma).length,
    overdue: cards.filter(overdueGroma).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateGroma(card, desk)).length,
  };
}

export function gromaBars(cards: readonly Groma[]): { staff: string; count: number }[] {
  return GMA_STAVES.map((staff) => ({ staff, count: cards.filter((card) => card.staff === staff && !card.cased).length }));
}

export function gromaTimeline(cards: readonly Groma[]): { notch: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return NOTCH_CYCLE.map((notch) => ({ notch, titles: open.filter((card) => card.notch === notch).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function gromaBearers(cards: readonly Groma[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestBearer(cards: readonly Groma[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.sighted && card.bearer);
  let best = "";
  let score = 0;
  for (const name of gromaBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderGromaRules(cards: readonly Groma[]): string[] {
  return cards.filter(overdueGroma).map((card) => card.title);
}

export function gromaCopy(card: Groma): string {
  return [card.title, card.bearer, card.staff, card.wood, card.notch ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function gromaCsv(cards: readonly Groma[], desk: string): string {
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
        gromaOuter(card.staff) ? "1" : "0",
        lateGroma(card, desk) ? "1" : "0",
        idleGroma(card) ? "1" : "0",
        briskGroma(card) ? "1" : "0",
        restingGroma(card) ? "1" : "0",
        overdueGroma(card) ? "1" : "0",
        gromaInner(card.staff) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        gromaBand(card.staff),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const PCS_KEY = "crmv4-pace-hide";
export const PCS_REVIEW_KEY = "crmv4-pace-review";

export type PaceLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type PaceHue = "" | "ivory" | "graphite" | "champagne";

export type PaceState = "" | "clear" | "set";

export type PaceReview = "all" | "reviewed" | "fresh";

export type PaceShape =
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

export type PaceValue = string | { lastBrowser?: unknown; [key: string]: unknown } | null | undefined;

export type PaceRow = { id: string; label: string; pace: PaceValue };

export type PaceLaneLine = { lane: string; count: number };

const DATUM_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const DATUM_HUES = ["champagne", "ivory", "graphite"] as const;

function paceRecord(raw: PaceValue): { lastBrowser?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function paceBlocked(raw: PaceValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function paceGiven(raw: PaceValue): string {
  const row = paceRecord(raw);
  if (row && !("lastBrowser" in row)) return "";
  const value = row ? row.lastBrowser : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "CHROME";
  if (value === false || value === "false" || value === "0" || value === 0) return "OPEN DESK";
  return clip(value, 48);
}

function paceReadable(raw: PaceValue): boolean {
  if (paceBlocked(raw)) return false;
  const row = paceRecord(raw);
  if (row && !("lastBrowser" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function paceState(raw: PaceValue): PaceState {
  if (!paceReadable(raw)) return "";
  return paceGiven(raw) ? "set" : "clear";
}

/** A known browser is CHROME, SAFARI, FIREFOX, or EDGE. A ridge contains a hyphen. A vale has a space. A cipher contains a number. A chip is two characters or fewer. An atlas is fourteen characters or longer. */
export function paceLane(raw: PaceValue): PaceLane {
  if (paceState(raw) !== "set") return "";
  const text = paceGiven(raw);
  if (HOUSE_STATUSES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 2) return "spark";
  if (text.length >= 14) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function paceHue(raw: PaceValue): PaceHue {
  const lane = paceLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function paceHouse(raw: PaceValue): boolean {
  return paceLane(raw) === "house";
}

export function paceFort(raw: PaceValue): boolean {
  return paceLane(raw) === "fort";
}

export function paceHarbor(raw: PaceValue): boolean {
  return paceLane(raw) === "harbor";
}

export function paceDigitLane(raw: PaceValue): boolean {
  return paceLane(raw) === "digit";
}

export function paceSpark(raw: PaceValue): boolean {
  return paceLane(raw) === "spark";
}

export function paceScroll(raw: PaceValue): boolean {
  return paceLane(raw) === "scroll";
}

export function paceVowelLane(raw: PaceValue): boolean {
  return paceLane(raw) === "vowel";
}

export function pacePost(raw: PaceValue): boolean {
  return paceLane(raw) === "post";
}

export function paceOpen(raw: PaceValue): boolean {
  return paceState(raw) === "clear";
}

/** A mark the desk can keep without a rewrite: a scroll or a house mark. */
export function paceHeld(raw: PaceValue): boolean {
  const lane = paceLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a mark of two characters or fewer that is not a house, still wants a fuller name. */
export function paceSoon(raw: PaceValue): boolean {
  if (paceState(raw) !== "set") return false;
  if (paceSpark(raw)) return true;
  if (paceHouse(raw)) return false;
  const length = paceGiven(raw).length;
  return length > 0 && length <= 1;
}

export function paceLength(raw: PaceValue): number | null {
  if (paceState(raw) !== "set") return null;
  return paceGiven(raw).length;
}

export function paceEven(raw: PaceValue): boolean {
  const length = paceLength(raw);
  return length !== null && length % 2 === 0;
}

export function paceOdd(raw: PaceValue): boolean {
  const length = paceLength(raw);
  return length !== null && length % 2 === 1;
}

export function paceFirst(raw: PaceValue): boolean {
  return /^[A-Za-z]/.test(paceGiven(raw));
}

export function paceTail(raw: PaceValue): boolean {
  return /[0-9]$/.test(paceGiven(raw));
}

export function paceCapital(raw: PaceValue): boolean {
  return /[A-Z]/.test(paceGiven(raw));
}

export function paceSpace(raw: PaceValue): boolean {
  return paceGiven(raw).includes(" ");
}

export function paceVowel(raw: PaceValue): boolean {
  return /^[aeiou]/i.test(paceGiven(raw));
}

export function paceDigit(raw: PaceValue): boolean {
  return /[0-9]/.test(paceGiven(raw));
}

export function paceLetter(raw: PaceValue): boolean {
  return /[A-Za-z]/.test(paceGiven(raw));
}

export function paceMixed(raw: PaceValue): boolean {
  return paceDigit(raw) && paceLetter(raw);
}

export function paceLower(raw: PaceValue): boolean {
  const text = paceGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function paceUpper(raw: PaceValue): boolean {
  const text = paceGiven(raw);
  return text.length >= 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function paceHyphen(raw: PaceValue): boolean {
  return paceGiven(raw).includes("-");
}

export function pacePeriod(raw: PaceValue): boolean {
  return paceGiven(raw).includes(".");
}

export function paceStamp(raw: PaceValue): string {
  const text = paceGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function paceCopy(raw: PaceValue): string {
  return paceGiven(raw);
}

export function paceFamily(raw: PaceValue): string {
  if (paceState(raw) !== "set") return "";
  return firstToken(paceGiven(raw));
}

export function paceLanes(rows: readonly PaceRow[]): PaceLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of DATUM_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = paceLane(row.pace);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return DATUM_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPace(rows: readonly PaceRow[]): string {
  const lines = paceLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DATUM_LANES.indexOf(a.lane as (typeof DATUM_LANES)[number]) - DATUM_LANES.indexOf(b.lane as (typeof DATUM_LANES)[number]))[0].lane;
}

export function leadingPaceHue(rows: readonly PaceRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of DATUM_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = paceHue(row.pace);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = DATUM_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || DATUM_HUES.indexOf(a.hue) - DATUM_HUES.indexOf(b.hue))[0].hue;
}

export function lanePaceCount(rows: readonly PaceRow[], lane: PaceLane): number {
  return rows.filter((row) => paceLane(row.pace) === lane).length;
}

export function paceShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPaceLanes(rows: readonly PaceRow[]): string[] {
  return paceLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenPaces(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPaces(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePace(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePaceReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPaceReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePaceLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: PaceRow, shape: PaceShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return paceHouse(row.pace);
  if (shape === "fort") return paceFort(row.pace);
  if (shape === "harbor") return paceHarbor(row.pace);
  if (shape === "digit") return paceDigitLane(row.pace);
  if (shape === "spark") return paceSpark(row.pace);
  if (shape === "scroll") return paceScroll(row.pace);
  if (shape === "vowel") return paceVowelLane(row.pace);
  if (shape === "post") return pacePost(row.pace);
  if (shape === "open") return paceOpen(row.pace);
  if (shape === "soon") return paceSoon(row.pace);
  if (shape === "letter") return paceLetter(row.pace);
  if (shape === "mixed") return paceMixed(row.pace);
  if (shape === "upper") return paceUpper(row.pace);
  if (shape === "lower") return paceLower(row.pace);
  if (shape === "space") return paceSpace(row.pace);
  if (shape === "even") return paceEven(row.pace);
  if (shape === "odd") return paceOdd(row.pace);
  if (shape === "tail") return paceTail(row.pace);
  if (shape === "first") return paceFirst(row.pace);
  if (shape === "cased") return paceHeld(row.pace);
  if (shape === "hyphen") return paceHyphen(row.pace);
  if (shape === "period") return pacePeriod(row.pace);
  return paceLane(row.pace) === shape;
}

export function visiblePaces(
  rows: readonly PaceRow[],
  lane: string,
  hue: string,
  query: string,
  review: PaceReview,
  reviewed: readonly string[],
  shape: PaceShape,
): PaceRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (paceState(row.pace) === "") return false;
    const found = paceLane(row.pace);
    const hueName = paceHue(row.pace);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${paceGiven(row.pace)} ${paceStamp(row.pace)} ${paceFamily(row.pace)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function paceLanesCsv(rows: readonly PaceRow[]): string {
  const lines = ["lane,count"];
  for (const line of paceLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function paceRowsCsv(rows: readonly PaceRow[], reviewed: readonly string[]): string {
  const lines = ["name,browser,stamp,family,lane,hue,length,realm,ridge,vale,chip,even,cipher,mixed,upper,vowel,tail,cased,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(paceGiven(row.pace)),
        paceStamp(row.pace),
        csvCell(paceFamily(row.pace)),
        paceLane(row.pace),
        paceHue(row.pace),
        paceLength(row.pace) ?? "",
        paceHouse(row.pace) ? "1" : "0",
        paceFort(row.pace) ? "1" : "0",
        paceHarbor(row.pace) ? "1" : "0",
        paceSpark(row.pace) ? "1" : "0",
        paceEven(row.pace) ? "1" : "0",
        paceDigit(row.pace) ? "1" : "0",
        paceMixed(row.pace) ? "1" : "0",
        paceUpper(row.pace) ? "1" : "0",
        paceVowel(row.pace) ? "1" : "0",
        paceTail(row.pace) ? "1" : "0",
        paceHeld(row.pace) ? "1" : "0",
        paceSoon(row.pace) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
