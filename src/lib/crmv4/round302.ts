/**
 * Chilindrum columns for a cylinder sundial kept in this browser, and gate plates read the password-change flag already stored on the account.
 * Parts are foot, barrel, lip, and style. Cloth is linen, vellum, and gilt.
 * Heights are 12, 24, 36, or 48. Notches are 4, 8, or 12.
 * A vow flag is true, yes, or the words must, reset, or change. A keep flag is false, no, or keep.
 * A mark contains a hyphen. A pair has a space. A short token is three characters or fewer. A long token is ten characters or longer.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_chilindrum (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   part text not null default '',
 *   cloth text not null default '',
 *   height_no integer,
 *   notch_no integer not null default 4,
 *   tags text not null default '',
 *   scribed boolean not null default false,
 *   sleeved boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_gate_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_gate_review (
 *   trader_id text primary key
 * );
 */

export const CHD_KEY = "crmv4-chilindrum";
export const CHD_VIEW_KEY = "crmv4-chilindrum-views";
export const CHD_DENSITY_KEY = "crmv4-chilindrum-density";
export const CHD_PARTS = ["foot", "barrel", "lip", "style"] as const;

export type ChilPart = (typeof CHD_PARTS)[number];

export type ChilCloth = "blank" | "linen" | "vellum" | "gilt";

export type ChilTray = "yard" | "sleeve" | "vault";

export type ChilDensity = "broad" | "tight";

export type ChilSort = "station" | "pilot";

export type Chilindrum = {
  id: string;
  title: string;
  note: string;
  pilot: string;
  station: string;
  latitude: number | null;
  wood: string;
  hour: number;
  tags: string[];
  laid: boolean;
  locked: boolean;
  held: boolean;
  starred: boolean;
  audit: string;
};

export type ChilView = {
  id: string;
  name: string;
  tray: ChilTray;
  query: string;
  pilot: string;
  wood: string;
  station: string;
  latitude: string;
  hour: string;
};

export type ChilCounts = {
  yard: number;
  sleeve: number;
  vault: number;
  laid: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  latitude: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND302_FEATURES = [
  "save",
  "note",
  "trays",
  "cloth",
  "height",
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
  "fair-keeper",
  "viewer",
  "suggest",
  "sla",
  "gate",
  "gate-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "sleeve", "resume", "vault", "open", "tag", "hour", "latitude", "lower", "star"] as const;

const WOODS = ["linen", "vellum", "gilt"] as const;

const LATITUDE_CYCLE = [12, 24, 36, 48] as const;

const HOUR_CYCLE = [4, 8, 12] as const;

const INNER = new Set(["foot", "barrel"]);

const OUTER = new Set(["lip", "style"]);

const HOUSE_WOOD = new Set(["LINEN", "GILT"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const UNION_WORD = /\b(must|reset|change)\b/i;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ChilTray {
  return raw === "sleeve" || raw === "vault" ? raw : "yard";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<ChilCloth, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<ChilCloth, "blank">) : "";
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

function inTray(card: Chilindrum, tray: ChilTray): boolean {
  if (tray === "sleeve") return card.locked && !card.held;
  if (tray === "vault") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return CHD_PARTS.indexOf(station as ChilPart);
}

function latitudeIndex(latitude: number): number {
  return LATITUDE_CYCLE.indexOf(latitude as (typeof LATITUDE_CYCLE)[number]);
}

function hourIndex(hour: number): number {
  return HOUR_CYCLE.indexOf(hour as (typeof HOUR_CYCLE)[number]);
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

export function chilPart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CHD_PARTS as readonly string[]).includes(text) ? text : "";
}

/** A height is 12, 24, 36, or 48. Anything else stays blank. */
export function chilHeight(raw: unknown): 12 | 24 | 36 | 48 | null {
  const text = wholeToken(raw);
  if (text !== "12" && text !== "24" && text !== "36" && text !== "48") return null;
  return Number(text) as 12 | 24 | 36 | 48;
}

/** A notch is 4, 8, or 12. Anything else stays blank. */
export function chilNotch(raw: unknown): 4 | 8 | 12 | null {
  const text = wholeToken(raw);
  if (text !== "4" && text !== "8" && text !== "12") return null;
  return Number(text) as 4 | 8 | 12;
}

/** Cloth is linen, vellum, or gilt. The saved name is the upper token. */
export function chilCloth(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function chilInner(station: unknown): boolean {
  return INNER.has(clip(station, 12).toLowerCase());
}

export function chilOuter(station: unknown): boolean {
  return OUTER.has(clip(station, 12).toLowerCase());
}

/** Foot is the sole. Barrel is the drum. Lip is the rim. Style is the shadow. */
export function chilBand(station: unknown): string {
  const text = chilPart(station);
  if (!text) return "";
  if (text === "foot") return "sole";
  if (text === "barrel") return "drum";
  if (text === "lip") return "rim";
  return "shadow";
}

/** Signed distance from one part to another along the cylinder. */
export function chilGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(chilPart(from));
  const right = stationIndex(chilPart(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseCloth(wood: unknown): boolean {
  return HOUSE_WOOD.has(chilCloth(wood));
}

/** A pair notch is 8. Four and twelve are not a pair. */
export function pairNotch(hour: unknown): boolean {
  return chilNotch(hour) === 8;
}

/** A full notch is 12. */
export function fullNotch(hour: unknown): boolean {
  return chilNotch(hour) === 12;
}

export function activePart(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return chilPart(text) || "all";
}

export function activeHeight(raw: unknown): string {
  const latitude = chilHeight(raw);
  return latitude === null ? "all" : String(latitude);
}

export function activeCloth(raw: unknown, allow: readonly string[]): string {
  const text = chilCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeNotch(raw: unknown): string {
  const hour = chilNotch(raw);
  return hour === null ? "all" : String(hour);
}

export function moveChilFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The cloth the yard uses least. A tie keeps gilt, then linen, then vellum. */
export function suggestCloth(cards: readonly Chilindrum[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "yard") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "GILT";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["GILT", "LINEN", "VELLUM"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest twelve. Late morning asks for twenty-four. Afternoon asks for thirty-six. Evening asks for forty-eight. A saved height in the yard wins, and a tie keeps the taller height. */
export function suggestHeight(cards: readonly Chilindrum[], hour: number): 12 | 24 | 36 | 48 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "yard") || card.latitude === null) continue;
    seen = true;
    counts.set(card.latitude, (counts.get(card.latitude) || 0) + 1);
  }
  if (seen) {
    let best: 12 | 24 | 36 | 48 = 48;
    let score = Number.POSITIVE_INFINITY;
    for (const latitude of [...LATITUDE_CYCLE].reverse()) {
      const count = counts.get(latitude) || 0;
      if (count < score) {
        best = latitude;
        score = count;
      }
    }
    return best;
  }
  if (hour < 8) return 12;
  if (hour < 13) return 24;
  if (hour < 17) return 36;
  return 48;
}

/** Before ten, suggest the foot. The rest of the day suggests the style. */
export function suggestPart(hour: number): ChilPart {
  return hour < 10 ? "foot" : "style";
}

/** The keeper with the fewest unscribed columns in the yard. A tie keeps the roster order. */
export function fairKeeper(cards: readonly Chilindrum[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "yard") && !card.laid);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.pilot.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readChilindrums(raw: unknown): Chilindrum[] {
  if (!Array.isArray(raw)) return [];
  const out: Chilindrum[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chilindrum>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      pilot: clip(row.pilot, 24),
      station: chilPart(row.station),
      latitude: chilHeight(row.latitude),
      wood: chilCloth(row.wood),
      hour: chilNotch(row.hour) ?? 4,
      tags: tagsOf(row.tags),
      laid: row.laid === true,
      locked: row.locked === true,
      held: row.held === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addChilindrum(
  cards: readonly Chilindrum[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    pilot?: string;
    station?: string;
    latitude?: unknown;
    wood?: string;
    hour?: unknown;
    tags?: unknown;
  },
): Chilindrum[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `c${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readChilindrums([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      pilot: clip(card.pilot, 24),
      station: chilPart(card.station),
      latitude: chilHeight(card.latitude),
      wood: chilCloth(card.wood),
      hour: chilNotch(card.hour) ?? 4,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Chilindrum[], id: string, edit: (card: Chilindrum) => Chilindrum): Chilindrum[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editChilindrum(cards: readonly Chilindrum[], id: string, title: string): Chilindrum[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editChilNote(cards: readonly Chilindrum[], id: string, note: string): Chilindrum[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleCloth(wood: string): string {
  const order = ["", "LINEN", "VELLUM", "GILT"];
  const index = order.indexOf(chilCloth(wood));
  return order[(index + 1) % order.length] || "LINEN";
}

export function setChilCloth(cards: readonly Chilindrum[], id: string, wood: string): Chilindrum[] {
  const next = chilCloth(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setChilScribed(cards: readonly Chilindrum[], id: string, laid: boolean): Chilindrum[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setChilSleeve(cards: readonly Chilindrum[], id: string, locked: boolean): Chilindrum[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sleeve" : "resume" }));
}

export function setChilVault(cards: readonly Chilindrum[], id: string, held: boolean): Chilindrum[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "vault" : "open" }));
}

export function setChilStar(cards: readonly Chilindrum[], id: string, starred: boolean): Chilindrum[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addChilTag(cards: readonly Chilindrum[], id: string, tag: string): Chilindrum[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepLatitude(latitude: number | null, dir: 1 | -1): 12 | 24 | 36 | 48 {
  if (latitude === null) return dir > 0 ? 12 : 48;
  const index = latitudeIndex(latitude);
  const next = index < 0 ? 0 : (index + dir + LATITUDE_CYCLE.length) % LATITUDE_CYCLE.length;
  return LATITUDE_CYCLE[next];
}

function stepHour(hour: number, dir: 1 | -1): 4 | 8 | 12 {
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

export function liftHeight(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return mapCard(cards, id, (card) => ({ ...card, latitude: stepLatitude(card.latitude, 1), audit: "latitude" }));
}

export function lowerHeight(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return mapCard(cards, id, (card) => ({ ...card, latitude: stepLatitude(card.latitude, -1), audit: "lower" }));
}

export function raiseNotch(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerNotch(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "hour" }));
}

export function setChilFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveChilFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return setChilSleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starChilFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return setChilStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagChilFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return addChilTag(cards, id, "a");
}

export function clothFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  const card = cards.find((item) => item.id === id);
  return card ? setChilCloth(cards, id, cycleCloth(card.wood)) : [...cards];
}

export function liftHeightFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return liftHeight(cards, id);
}

export function lowerHeightFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return lowerHeight(cards, id);
}

export function raiseNotchFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return raiseNotch(cards, id);
}

export function lowerNotchFocused(cards: readonly Chilindrum[], id: string): Chilindrum[] {
  return lowerNotch(cards, id);
}

function bulk(cards: readonly Chilindrum[], ids: readonly string[], edit: (card: Chilindrum) => Chilindrum): Chilindrum[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkChilGilt(cards: readonly Chilindrum[], ids: readonly string[]): Chilindrum[] {
  return bulk(cards, ids, (card) => (card.wood === "GILT" ? card : { ...card, wood: "GILT", audit: "wood" }));
}

export function bulkChilScribed(cards: readonly Chilindrum[], ids: readonly string[]): Chilindrum[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkChilVault(cards: readonly Chilindrum[], ids: readonly string[]): Chilindrum[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "hold" }));
}

export function bulkChilTag(cards: readonly Chilindrum[], ids: readonly string[]): Chilindrum[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readChilViews(raw: unknown): ChilView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChilView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChilView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      pilot: clip(row.pilot, 24),
      wood: activeCloth(row.wood, ["LINEN", "VELLUM", "GILT"]),
      station: activePart(row.station),
      latitude: activeHeight(row.latitude),
      hour: activeNotch(row.hour),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addChilView(views: readonly ChilView[], view: ChilView): ChilView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readChilViews([...views, { ...view, id, name }]);
}

export function dropChilView(views: readonly ChilView[], id: string): ChilView[] {
  return views.filter((view) => view.id !== id);
}

export function chilDensity(raw: unknown): ChilDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortChilindrums(cards: readonly Chilindrum[], sort: ChilSort): Chilindrum[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "pilot") {
      const pilot = a.pilot.localeCompare(b.pilot);
      if (pilot) return pilot;
    } else {
      const station = stationIndex(a.station) - stationIndex(b.station);
      if (station) return station;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleChilindrums(
  cards: readonly Chilindrum[],
  tray: ChilTray,
  query: string,
  pilot: string,
  wood: string,
  station: string,
  latitude: string,
  hour: string,
): Chilindrum[] {
  const text = query.trim().toLowerCase();
  const wantPilot = clip(pilot, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : chilCloth(wood);
  const wantStation = activePart(station);
  const wantLatitude = activeHeight(latitude);
  const wantHour = activeNotch(hour);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.pilot}`.toLowerCase().includes(text)) return false;
    if (wantPilot && card.pilot.toLowerCase() !== wantPilot) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStation === "inner" && !chilInner(card.station)) return false;
    if (wantStation === "outer" && !chilOuter(card.station)) return false;
    if (wantStation !== "all" && wantStation !== "inner" && wantStation !== "outer" && card.station !== wantStation) return false;
    if (wantLatitude !== "all" && String(card.latitude ?? "") !== wantLatitude) return false;
    if (wantHour !== "all" && String(card.hour) !== wantHour) return false;
    return true;
  });
}

/** An outer part on notch four, still unscribed and not in the vault, is overdue. */
export function overdueChil(card: Chilindrum): boolean {
  return chilOuter(card.station) && card.hour === 4 && !card.laid && !card.held;
}

/** No cloth, the short height, notch four, and still in the yard. */
export function idleChil(card: Chilindrum): boolean {
  return !card.wood && card.latitude === 12 && card.hour === 4 && !card.laid && !card.locked && !card.held;
}

/** Gilt, a tall height, and a full notch, still out of the vault. */
export function briskChil(card: Chilindrum): boolean {
  return card.wood === "GILT" && card.latitude === 48 && card.hour === 12 && !card.held;
}

/** Style, linen, and a middle height. */
export function restingChil(card: Chilindrum): boolean {
  return card.station === "style" && card.wood === "LINEN" && card.latitude === 24;
}

/** A foot column is late when the desk is already on the style. */
export function lateChil(card: Chilindrum, desk: string): boolean {
  return card.station === "foot" && chilPart(desk) === "style" && !card.laid;
}

export function chilCounts(cards: readonly Chilindrum[], shown: readonly Chilindrum[], desk: string): ChilCounts {
  return {
    yard: cards.filter((card) => inTray(card, "yard")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => chilInner(card.station)).length,
    outer: cards.filter((card) => chilOuter(card.station)).length,
    wide: cards.filter((card) => card.latitude === 48).length,
    house: cards.filter((card) => houseCloth(card.wood)).length,
    latitude: cards.reduce((sum, card) => sum + (card.latitude || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleChil).length,
    brisk: cards.filter(briskChil).length,
    resting: cards.filter(restingChil).length,
    overdue: cards.filter(overdueChil).length,
    pair: cards.filter((card) => pairNotch(card.hour) && lateChil(card, desk)).length,
  };
}

export function chilBars(cards: readonly Chilindrum[]): { station: string; count: number }[] {
  return CHD_PARTS.map((station) => ({ station, count: cards.filter((card) => card.station === station && !card.held).length }));
}

export function chilTimeline(cards: readonly Chilindrum[]): { latitude: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "yard"));
  return LATITUDE_CYCLE.map((latitude) => ({ latitude, titles: open.filter((card) => card.latitude === latitude).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function chilKeepers(cards: readonly Chilindrum[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.pilot && !out.some((name) => name.toLowerCase() === card.pilot.toLowerCase())) out.push(card.pilot);
  }
  return out;
}

export function busiestKeeper(cards: readonly Chilindrum[]): string {
  const open = cards.filter((card) => inTray(card, "yard") && !card.laid && card.pilot);
  let best = "";
  let score = 0;
  for (const name of chilKeepers(open)) {
    const count = open.filter((card) => card.pilot.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderChils(cards: readonly Chilindrum[]): string[] {
  return cards.filter(overdueChil).map((card) => card.title);
}

export function chilCopy(card: Chilindrum): string {
  return [card.title, card.pilot, card.station, card.wood, card.latitude ?? "", card.hour, card.note].filter((item) => item !== "").join(" · ");
}

export function chilCsv(cards: readonly Chilindrum[], desk: string): string {
  const lines = ["title,keeper,part,cloth,height,notch,tags,scribed,sleeve,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.pilot),
        card.station,
        card.wood,
        card.latitude ?? "",
        card.hour,
        card.tags.join(" "),
        card.laid ? "1" : "0",
        card.locked ? "1" : "0",
        card.held ? "1" : "0",
        card.starred ? "1" : "0",
        chilOuter(card.station) ? "1" : "0",
        lateChil(card, desk) ? "1" : "0",
        idleChil(card) ? "1" : "0",
        briskChil(card) ? "1" : "0",
        restingChil(card) ? "1" : "0",
        overdueChil(card) ? "1" : "0",
        chilInner(card.station) ? "1" : "0",
        houseCloth(card.wood) ? "1" : "0",
        chilBand(card.station),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const GTP_KEY = "crmv4-gate-hide";
export const GTP_REVIEW_KEY = "crmv4-gate-review";

export type GateLane = "" | "vow" | "mark" | "pair" | "short" | "long" | "vowel" | "keep" | "post";

export type GateHue = "" | "ivory" | "graphite" | "champagne";

export type GateState = "" | "clear" | "set";

export type GateReview = "all" | "reviewed" | "fresh";

export type GateShape =
  | "all"
  | "vow"
  | "mark"
  | "pair"
  | "short"
  | "long"
  | "vowel"
  | "keep"
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
  | "digit"
  | "first"
  | "held"
  | "hyphen"
  | "period";

export type GateValue = string | { mustChangePassword?: unknown; [key: string]: unknown } | null | undefined;

export type GateRow = { id: string; label: string; gate: GateValue };

export type GateLaneLine = { lane: string; count: number };

const GATE_LANES = ["vow", "mark", "pair", "short", "long", "vowel", "keep", "post"] as const;

const GATE_HUES = ["champagne", "ivory", "graphite"] as const;

function gateRecord(raw: GateValue): { mustChangePassword?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function gateBlocked(raw: GateValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function gateGiven(raw: GateValue): string {
  const row = gateRecord(raw);
  if (row && !("mustChangePassword" in row)) return "";
  const value = row ? row.mustChangePassword : raw;
  return clip(value, 48);
}

function gateReadable(raw: GateValue): boolean {
  if (gateBlocked(raw)) return false;
  const row = gateRecord(raw);
  if (row && !("mustChangePassword" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function gateState(raw: GateValue): GateState {
  if (!gateReadable(raw)) return "";
  return gateGiven(raw) ? "set" : "clear";
}

/** A vow is true, yes, one, or the words must, reset, or change. A keep is false, no, zero, or keep. A mark contains a hyphen. A pair has a space. A short token is three characters or fewer. A long token is ten characters or longer. */
export function gateLane(raw: GateValue): GateLane {
  if (gateState(raw) !== "set") return "";
  const text = gateGiven(raw);
  if (/^(true|yes|1)$/i.test(text) || UNION_WORD.test(text)) return "vow";
  if (/^(false|no|0|keep)$/i.test(text)) return "keep";
  if (text.includes("-")) return "mark";
  if (text.includes(" ")) return "pair";
  if (text.length <= 3) return "short";
  if (text.length >= 10) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function gateHue(raw: GateValue): GateHue {
  const lane = gateLane(raw);
  if (!lane) return "";
  if (lane === "vow" || lane === "short") return "champagne";
  if (lane === "mark" || lane === "pair" || lane === "long") return "graphite";
  return "ivory";
}

export function gateVow(raw: GateValue): boolean {
  return gateLane(raw) === "vow";
}

export function gateMark(raw: GateValue): boolean {
  return gateLane(raw) === "mark";
}

export function gatePair(raw: GateValue): boolean {
  return gateLane(raw) === "pair";
}

export function gateShort(raw: GateValue): boolean {
  return gateLane(raw) === "short";
}

export function gateLong(raw: GateValue): boolean {
  return gateLane(raw) === "long";
}

export function gateVowelLane(raw: GateValue): boolean {
  return gateLane(raw) === "vowel";
}

export function gateKeep(raw: GateValue): boolean {
  return gateLane(raw) === "keep";
}

export function gatePost(raw: GateValue): boolean {
  return gateLane(raw) === "post";
}

export function gateOpen(raw: GateValue): boolean {
  return gateState(raw) === "clear";
}

/** A token the desk can keep without a rewrite: long or keep. */
export function gateHeld(raw: GateValue): boolean {
  const lane = gateLane(raw);
  return lane === "long" || lane === "keep";
}

/** A short token, or a token of two characters or fewer that is not a vow or a keep, still wants a fuller label. */
export function gateSoon(raw: GateValue): boolean {
  if (gateState(raw) !== "set") return false;
  if (gateShort(raw)) return true;
  if (gateVow(raw) || gateKeep(raw)) return false;
  const length = gateGiven(raw).length;
  return length > 0 && length <= 2;
}

export function gateLength(raw: GateValue): number | null {
  if (gateState(raw) !== "set") return null;
  return gateGiven(raw).length;
}

export function gateEven(raw: GateValue): boolean {
  const length = gateLength(raw);
  return length !== null && length % 2 === 0;
}

export function gateOdd(raw: GateValue): boolean {
  const length = gateLength(raw);
  return length !== null && length % 2 === 1;
}

export function gateFirst(raw: GateValue): boolean {
  return /^[A-Za-z]/.test(gateGiven(raw));
}

export function gateTail(raw: GateValue): boolean {
  return /[0-9]$/.test(gateGiven(raw));
}

export function gateCapital(raw: GateValue): boolean {
  return /[A-Z]/.test(gateGiven(raw));
}

export function gateSpace(raw: GateValue): boolean {
  return gateGiven(raw).includes(" ");
}

export function gateVowel(raw: GateValue): boolean {
  return /^[aeiou]/i.test(gateGiven(raw));
}

export function gateDigit(raw: GateValue): boolean {
  return /[0-9]/.test(gateGiven(raw));
}

export function gateLetter(raw: GateValue): boolean {
  return /[A-Za-z]/.test(gateGiven(raw));
}

export function gateMixed(raw: GateValue): boolean {
  return gateDigit(raw) && gateLetter(raw);
}

export function gateLower(raw: GateValue): boolean {
  const text = gateGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function gateUpper(raw: GateValue): boolean {
  const text = gateGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function gateHyphen(raw: GateValue): boolean {
  return gateGiven(raw).includes("-");
}

export function gatePeriod(raw: GateValue): boolean {
  return gateGiven(raw).includes(".");
}

export function gateStamp(raw: GateValue): string {
  const text = gateGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function gateCopy(raw: GateValue): string {
  return gateGiven(raw);
}

export function gateFamily(raw: GateValue): string {
  if (gateState(raw) !== "set") return "";
  return firstToken(gateGiven(raw));
}

export function gateLanes(rows: readonly GateRow[]): GateLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of GATE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = gateLane(row.gate);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return GATE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingGate(rows: readonly GateRow[]): string {
  const lines = gateLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || GATE_LANES.indexOf(a.lane as (typeof GATE_LANES)[number]) - GATE_LANES.indexOf(b.lane as (typeof GATE_LANES)[number]))[0].lane;
}

export function leadingGateHue(rows: readonly GateRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of GATE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = gateHue(row.gate);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = GATE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || GATE_HUES.indexOf(a.hue) - GATE_HUES.indexOf(b.hue))[0].hue;
}

export function laneGateCount(rows: readonly GateRow[], lane: GateLane): number {
  return rows.filter((row) => gateLane(row.gate) === lane).length;
}

export function gateShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentGateLanes(rows: readonly GateRow[]): string[] {
  return gateLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenGates(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedGates(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleGate(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleGateReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkGateReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleGateLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: GateRow, shape: GateShape): boolean {
  if (shape === "all") return true;
  if (shape === "vow") return gateVow(row.gate);
  if (shape === "mark") return gateMark(row.gate);
  if (shape === "pair") return gatePair(row.gate);
  if (shape === "short") return gateShort(row.gate);
  if (shape === "long") return gateLong(row.gate);
  if (shape === "vowel") return gateVowelLane(row.gate);
  if (shape === "keep") return gateKeep(row.gate);
  if (shape === "post") return gatePost(row.gate);
  if (shape === "open") return gateOpen(row.gate);
  if (shape === "soon") return gateSoon(row.gate);
  if (shape === "digit") return gateDigit(row.gate);
  if (shape === "letter") return gateLetter(row.gate);
  if (shape === "mixed") return gateMixed(row.gate);
  if (shape === "upper") return gateUpper(row.gate);
  if (shape === "lower") return gateLower(row.gate);
  if (shape === "space") return gateSpace(row.gate);
  if (shape === "even") return gateEven(row.gate);
  if (shape === "odd") return gateOdd(row.gate);
  if (shape === "tail") return gateTail(row.gate);
  if (shape === "first") return gateFirst(row.gate);
  if (shape === "held") return gateHeld(row.gate);
  if (shape === "hyphen") return gateHyphen(row.gate);
  if (shape === "period") return gatePeriod(row.gate);
  return gateLane(row.gate) === shape;
}

export function visibleGates(
  rows: readonly GateRow[],
  lane: string,
  hue: string,
  query: string,
  review: GateReview,
  reviewed: readonly string[],
  shape: GateShape,
): GateRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (gateState(row.gate) === "") return false;
    const found = gateLane(row.gate);
    const hueName = gateHue(row.gate);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${gateGiven(row.gate)} ${gateStamp(row.gate)} ${gateFamily(row.gate)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function gateLanesCsv(rows: readonly GateRow[]): string {
  const lines = ["lane,count"];
  for (const line of gateLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function gateRowsCsv(rows: readonly GateRow[], reviewed: readonly string[]): string {
  const lines = ["name,gate,stamp,family,lane,hue,length,vow,mark,pair,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(gateGiven(row.gate)),
        gateStamp(row.gate),
        csvCell(gateFamily(row.gate)),
        gateLane(row.gate),
        gateHue(row.gate),
        gateLength(row.gate) ?? "",
        gateVow(row.gate) ? "1" : "0",
        gateMark(row.gate) ? "1" : "0",
        gatePair(row.gate) ? "1" : "0",
        gateShort(row.gate) ? "1" : "0",
        gateEven(row.gate) ? "1" : "0",
        gateDigit(row.gate) ? "1" : "0",
        gateMixed(row.gate) ? "1" : "0",
        gateUpper(row.gate) ? "1" : "0",
        gateVowel(row.gate) ? "1" : "0",
        gateTail(row.gate) ? "1" : "0",
        gateHeld(row.gate) ? "1" : "0",
        gateSoon(row.gate) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
