/**
 * Navicula dials for a ship-shaped sundial kept in this browser, and haven plates read the last country name already stored on the account.
 * Stations are prow, hull, mast, and stern. Wood is oak, ash, and yew.
 * Latitudes are 15, 30, 45, or 60. Hours are 3, 6, or 9.
 * A union name says united, republic, or kingdom. A mark contains a hyphen. A pair has a space.
 * A short name is six characters or fewer. A long name is twelve characters or longer.
 * Money fields are not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_navicula (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   pilot text not null default '',
 *   station text not null default '',
 *   wood text not null default '',
 *   latitude_no integer,
 *   hour_no integer not null default 3,
 *   tags text not null default '',
 *   laid boolean not null default false,
 *   locked boolean not null default false,
 *   held boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_haven_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_haven_review (
 *   trader_id text primary key
 * );
 */

export const NVC_KEY = "crmv4-navicula";
export const NVC_VIEW_KEY = "crmv4-navicula-views";
export const NVC_DENSITY_KEY = "crmv4-navicula-density";
export const NAV_STATIONS = ["prow", "hull", "mast", "stern"] as const;

export type NavStation = (typeof NAV_STATIONS)[number];

export type NavWood = "blank" | "oak" | "ash" | "yew";

export type NavTray = "quay" | "locker" | "hold";

export type NavDensity = "broad" | "tight";

export type NavSort = "station" | "pilot";

export type Navicula = {
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

export type NavView = {
  id: string;
  name: string;
  tray: NavTray;
  query: string;
  pilot: string;
  wood: string;
  station: string;
  latitude: string;
  hour: string;
};

export type NavCounts = {
  quay: number;
  locker: number;
  hold: number;
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

export const ROUND301_FEATURES = [
  "save",
  "note",
  "trays",
  "wood",
  "latitude",
  "hold",
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
  "fair-pilot",
  "viewer",
  "suggest",
  "sla",
  "haven",
  "haven-csv",
] as const;

const AUDITS = ["save", "edit", "note", "wood", "set", "clear", "locker", "resume", "hold", "open", "tag", "hour", "latitude", "lower", "star"] as const;

const WOODS = ["oak", "ash", "yew"] as const;

const LATITUDE_CYCLE = [15, 30, 45, 60] as const;

const HOUR_CYCLE = [3, 6, 9] as const;

const INNER = new Set(["prow", "hull"]);

const OUTER = new Set(["mast", "stern"]);

const HOUSE_WOOD = new Set(["OAK", "YEW"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const UNION_WORD = /\b(united|republic|kingdom)\b/i;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): NavTray {
  return raw === "locker" || raw === "hold" ? raw : "quay";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function woodName(raw: unknown): Exclude<NavWood, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WOODS as readonly string[]).includes(text) ? (text as Exclude<NavWood, "blank">) : "";
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

function inTray(card: Navicula, tray: NavTray): boolean {
  if (tray === "locker") return card.locked && !card.held;
  if (tray === "hold") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return NAV_STATIONS.indexOf(station as NavStation);
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

export function navStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (NAV_STATIONS as readonly string[]).includes(text) ? text : "";
}

/** A latitude is 15, 30, 45, or 60. Anything else stays blank. */
export function navLatitude(raw: unknown): 15 | 30 | 45 | 60 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "60") return null;
  return Number(text) as 15 | 30 | 45 | 60;
}

/** An hour is 3, 6, or 9. Anything else stays blank. */
export function navHour(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** Wood is oak, ash, or yew. The saved name is the upper token. */
export function navWood(raw: unknown): string {
  const text = woodName(raw);
  return text ? text.toUpperCase() : "";
}

export function navInner(station: unknown): boolean {
  return INNER.has(clip(station, 12).toLowerCase());
}

export function navOuter(station: unknown): boolean {
  return OUTER.has(clip(station, 12).toLowerCase());
}

/** Prow is the bow. Hull is the keel. Mast is the spar. Stern is the wake. */
export function navBand(station: unknown): string {
  const text = navStation(station);
  if (!text) return "";
  if (text === "prow") return "bow";
  if (text === "hull") return "keel";
  if (text === "mast") return "spar";
  return "wake";
}

/** Signed distance from one station to another along the ship. */
export function navGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(navStation(from));
  const right = stationIndex(navStation(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWood(wood: unknown): boolean {
  return HOUSE_WOOD.has(navWood(wood));
}

/** A pair hour is 6. Three and nine are not a pair. */
export function pairHour(hour: unknown): boolean {
  return navHour(hour) === 6;
}

/** A full hour is 9. */
export function fullHour(hour: unknown): boolean {
  return navHour(hour) === 9;
}

export function activeStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return navStation(text) || "all";
}

export function activeLatitude(raw: unknown): string {
  const latitude = navLatitude(raw);
  return latitude === null ? "all" : String(latitude);
}

export function activeWood(raw: unknown, allow: readonly string[]): string {
  const text = navWood(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeHour(raw: unknown): string {
  const hour = navHour(raw);
  return hour === null ? "all" : String(hour);
}

export function moveNavFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The wood the quay uses least. A tie keeps yew, then oak, then ash. */
export function suggestWood(cards: readonly Navicula[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "quay") || !card.wood) continue;
    counts.set(card.wood, (counts.get(card.wood) || 0) + 1);
  }
  let best = "YEW";
  let score = Number.POSITIVE_INFINITY;
  for (const wood of ["YEW", "OAK", "ASH"]) {
    const count = counts.get(wood) || 0;
    if (count < score) {
      best = wood;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest fifteen. Late morning asks for thirty. Afternoon asks for forty-five. Evening asks for sixty. A saved latitude on the quay wins, and a tie keeps the wider latitude. */
export function suggestLatitude(cards: readonly Navicula[], hour: number): 15 | 30 | 45 | 60 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "quay") || card.latitude === null) continue;
    seen = true;
    counts.set(card.latitude, (counts.get(card.latitude) || 0) + 1);
  }
  if (seen) {
    let best: 15 | 30 | 45 | 60 = 60;
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
  if (hour < 8) return 15;
  if (hour < 13) return 30;
  if (hour < 17) return 45;
  return 60;
}

/** Before ten, suggest the prow. The rest of the day suggests the stern. */
export function suggestStation(hour: number): NavStation {
  return hour < 10 ? "prow" : "stern";
}

/** The pilot with the fewest unlaid dials on the quay. A tie keeps the roster order. */
export function fairPilot(cards: readonly Navicula[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "quay") && !card.laid);
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

export function readNaviculas(raw: unknown): Navicula[] {
  if (!Array.isArray(raw)) return [];
  const out: Navicula[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Navicula>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      pilot: clip(row.pilot, 24),
      station: navStation(row.station),
      latitude: navLatitude(row.latitude),
      wood: navWood(row.wood),
      hour: navHour(row.hour) ?? 3,
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

export function addNavicula(
  cards: readonly Navicula[],
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
): Navicula[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readNaviculas([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      pilot: clip(card.pilot, 24),
      station: navStation(card.station),
      latitude: navLatitude(card.latitude),
      wood: navWood(card.wood),
      hour: navHour(card.hour) ?? 3,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Navicula[], id: string, edit: (card: Navicula) => Navicula): Navicula[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editNavicula(cards: readonly Navicula[], id: string, title: string): Navicula[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editNavNote(cards: readonly Navicula[], id: string, note: string): Navicula[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWood(wood: string): string {
  const order = ["", "OAK", "ASH", "YEW"];
  const index = order.indexOf(navWood(wood));
  return order[(index + 1) % order.length] || "OAK";
}

export function setNavWood(cards: readonly Navicula[], id: string, wood: string): Navicula[] {
  const next = navWood(wood);
  return mapCard(cards, id, (card) => (card.wood === next ? card : { ...card, wood: next, audit: "wood" }));
}

export function setNavLaid(cards: readonly Navicula[], id: string, laid: boolean): Navicula[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setNavLocker(cards: readonly Navicula[], id: string, locked: boolean): Navicula[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "locker" : "resume" }));
}

export function setNavHold(cards: readonly Navicula[], id: string, held: boolean): Navicula[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "hold" : "open" }));
}

export function setNavStar(cards: readonly Navicula[], id: string, starred: boolean): Navicula[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addNavTag(cards: readonly Navicula[], id: string, tag: string): Navicula[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepLatitude(latitude: number | null, dir: 1 | -1): 15 | 30 | 45 | 60 {
  if (latitude === null) return dir > 0 ? 15 : 60;
  const index = latitudeIndex(latitude);
  const next = index < 0 ? 0 : (index + dir + LATITUDE_CYCLE.length) % LATITUDE_CYCLE.length;
  return LATITUDE_CYCLE[next];
}

function stepHour(hour: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = hourIndex(hour);
  const next = index < 0 ? 0 : (index + dir + HOUR_CYCLE.length) % HOUR_CYCLE.length;
  return HOUR_CYCLE[next];
}

export function liftLatitude(cards: readonly Navicula[], id: string): Navicula[] {
  return mapCard(cards, id, (card) => ({ ...card, latitude: stepLatitude(card.latitude, 1), audit: "latitude" }));
}

export function lowerLatitude(cards: readonly Navicula[], id: string): Navicula[] {
  return mapCard(cards, id, (card) => ({ ...card, latitude: stepLatitude(card.latitude, -1), audit: "lower" }));
}

export function raiseHour(cards: readonly Navicula[], id: string): Navicula[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, 1), audit: "hour" }));
}

export function lowerHour(cards: readonly Navicula[], id: string): Navicula[] {
  return mapCard(cards, id, (card) => ({ ...card, hour: stepHour(card.hour, -1), audit: "hour" }));
}

export function setNavFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function lockerNavFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return setNavLocker(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starNavFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return setNavStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagNavFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return addNavTag(cards, id, "a");
}

export function woodFocused(cards: readonly Navicula[], id: string): Navicula[] {
  const card = cards.find((item) => item.id === id);
  return card ? setNavWood(cards, id, cycleWood(card.wood)) : [...cards];
}

export function liftLatitudeFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return liftLatitude(cards, id);
}

export function lowerLatitudeFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return lowerLatitude(cards, id);
}

export function raiseHourFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return raiseHour(cards, id);
}

export function lowerHourFocused(cards: readonly Navicula[], id: string): Navicula[] {
  return lowerHour(cards, id);
}

function bulk(cards: readonly Navicula[], ids: readonly string[], edit: (card: Navicula) => Navicula): Navicula[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkNavYew(cards: readonly Navicula[], ids: readonly string[]): Navicula[] {
  return bulk(cards, ids, (card) => (card.wood === "YEW" ? card : { ...card, wood: "YEW", audit: "wood" }));
}

export function bulkNavLaid(cards: readonly Navicula[], ids: readonly string[]): Navicula[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkNavHold(cards: readonly Navicula[], ids: readonly string[]): Navicula[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "hold" }));
}

export function bulkNavTag(cards: readonly Navicula[], ids: readonly string[]): Navicula[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readNavViews(raw: unknown): NavView[] {
  if (!Array.isArray(raw)) return [];
  const out: NavView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NavView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      pilot: clip(row.pilot, 24),
      wood: activeWood(row.wood, ["OAK", "ASH", "YEW"]),
      station: activeStation(row.station),
      latitude: activeLatitude(row.latitude),
      hour: activeHour(row.hour),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addNavView(views: readonly NavView[], view: NavView): NavView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readNavViews([...views, { ...view, id, name }]);
}

export function dropNavView(views: readonly NavView[], id: string): NavView[] {
  return views.filter((view) => view.id !== id);
}

export function navDensity(raw: unknown): NavDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortNaviculas(cards: readonly Navicula[], sort: NavSort): Navicula[] {
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

export function visibleNaviculas(
  cards: readonly Navicula[],
  tray: NavTray,
  query: string,
  pilot: string,
  wood: string,
  station: string,
  latitude: string,
  hour: string,
): Navicula[] {
  const text = query.trim().toLowerCase();
  const wantPilot = clip(pilot, 24).toLowerCase();
  const wantWood = wood === "all" ? "" : navWood(wood);
  const wantStation = activeStation(station);
  const wantLatitude = activeLatitude(latitude);
  const wantHour = activeHour(hour);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.pilot}`.toLowerCase().includes(text)) return false;
    if (wantPilot && card.pilot.toLowerCase() !== wantPilot) return false;
    if (wantWood && card.wood !== wantWood) return false;
    if (wantStation === "inner" && !navInner(card.station)) return false;
    if (wantStation === "outer" && !navOuter(card.station)) return false;
    if (wantStation !== "all" && wantStation !== "inner" && wantStation !== "outer" && card.station !== wantStation) return false;
    if (wantLatitude !== "all" && String(card.latitude ?? "") !== wantLatitude) return false;
    if (wantHour !== "all" && String(card.hour) !== wantHour) return false;
    return true;
  });
}

/** An outer station on hour three, still unlaid and not in the hold, is overdue. */
export function overdueNav(card: Navicula): boolean {
  return navOuter(card.station) && card.hour === 3 && !card.laid && !card.held;
}

/** No wood, the short latitude, hour three, and still on the quay. */
export function idleNav(card: Navicula): boolean {
  return !card.wood && card.latitude === 15 && card.hour === 3 && !card.laid && !card.locked && !card.held;
}

/** Yew, a wide latitude, and a full hour, still out of the hold. */
export function briskNav(card: Navicula): boolean {
  return card.wood === "YEW" && card.latitude === 60 && card.hour === 9 && !card.held;
}

/** Stern, oak, and a middle latitude. */
export function restingNav(card: Navicula): boolean {
  return card.station === "stern" && card.wood === "OAK" && card.latitude === 30;
}

/** A prow dial is late when the desk is already on the stern. */
export function lateNav(card: Navicula, desk: string): boolean {
  return card.station === "prow" && navStation(desk) === "stern" && !card.laid;
}

export function navCounts(cards: readonly Navicula[], shown: readonly Navicula[], desk: string): NavCounts {
  return {
    quay: cards.filter((card) => inTray(card, "quay")).length,
    locker: cards.filter((card) => inTray(card, "locker")).length,
    hold: cards.filter((card) => inTray(card, "hold")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => navInner(card.station)).length,
    outer: cards.filter((card) => navOuter(card.station)).length,
    wide: cards.filter((card) => card.latitude === 60).length,
    house: cards.filter((card) => houseWood(card.wood)).length,
    latitude: cards.reduce((sum, card) => sum + (card.latitude || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleNav).length,
    brisk: cards.filter(briskNav).length,
    resting: cards.filter(restingNav).length,
    overdue: cards.filter(overdueNav).length,
    pair: cards.filter((card) => pairHour(card.hour) && lateNav(card, desk)).length,
  };
}

export function navBars(cards: readonly Navicula[]): { station: string; count: number }[] {
  return NAV_STATIONS.map((station) => ({ station, count: cards.filter((card) => card.station === station && !card.held).length }));
}

export function navTimeline(cards: readonly Navicula[]): { latitude: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "quay"));
  return LATITUDE_CYCLE.map((latitude) => ({ latitude, titles: open.filter((card) => card.latitude === latitude).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function navPilots(cards: readonly Navicula[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.pilot && !out.some((name) => name.toLowerCase() === card.pilot.toLowerCase())) out.push(card.pilot);
  }
  return out;
}

export function busiestPilot(cards: readonly Navicula[]): string {
  const open = cards.filter((card) => inTray(card, "quay") && !card.laid && card.pilot);
  let best = "";
  let score = 0;
  for (const name of navPilots(open)) {
    const count = open.filter((card) => card.pilot.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderNavs(cards: readonly Navicula[]): string[] {
  return cards.filter(overdueNav).map((card) => card.title);
}

export function navCopy(card: Navicula): string {
  return [card.title, card.pilot, card.station, card.wood, card.latitude ?? "", card.hour, card.note].filter((item) => item !== "").join(" · ");
}

export function navCsv(cards: readonly Navicula[], desk: string): string {
  const lines = ["title,pilot,station,wood,latitude,hour,tags,laid,locker,hold,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
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
        navOuter(card.station) ? "1" : "0",
        lateNav(card, desk) ? "1" : "0",
        idleNav(card) ? "1" : "0",
        briskNav(card) ? "1" : "0",
        restingNav(card) ? "1" : "0",
        overdueNav(card) ? "1" : "0",
        navInner(card.station) ? "1" : "0",
        houseWood(card.wood) ? "1" : "0",
        navBand(card.station),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const HVN_KEY = "crmv4-haven-hide";
export const HVN_REVIEW_KEY = "crmv4-haven-review";

export type HavenLane = "" | "union" | "mark" | "pair" | "short" | "long" | "vowel" | "coast" | "post";

export type HavenHue = "" | "ivory" | "graphite" | "champagne";

export type HavenState = "" | "clear" | "set";

export type HavenReview = "all" | "reviewed" | "fresh";

export type HavenShape =
  | "all"
  | "union"
  | "mark"
  | "pair"
  | "short"
  | "long"
  | "vowel"
  | "coast"
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

export type HavenValue = string | { lastCountryName?: unknown; [key: string]: unknown } | null | undefined;

export type HavenRow = { id: string; label: string; haven: HavenValue };

export type HavenLaneLine = { lane: string; count: number };

const HAVEN_LANES = ["union", "mark", "pair", "short", "long", "vowel", "coast", "post"] as const;

const HAVEN_HUES = ["champagne", "ivory", "graphite"] as const;

function havenRecord(raw: HavenValue): { lastCountryName?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function havenBlocked(raw: HavenValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function havenGiven(raw: HavenValue): string {
  const row = havenRecord(raw);
  if (row && !("lastCountryName" in row)) return "";
  const value = row ? row.lastCountryName : raw;
  return clip(value, 48);
}

function havenReadable(raw: HavenValue): boolean {
  if (havenBlocked(raw)) return false;
  const row = havenRecord(raw);
  if (row && !("lastCountryName" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function havenState(raw: HavenValue): HavenState {
  if (!havenReadable(raw)) return "";
  return havenGiven(raw) ? "set" : "clear";
}

/** A union says united, republic, or kingdom. A mark contains a hyphen. A pair has a space. A short name is six characters or fewer. A long name is twelve characters or longer. A vowel name starts with a vowel. A coast name ends in a, n, or y. */
export function havenLane(raw: HavenValue): HavenLane {
  if (havenState(raw) !== "set") return "";
  const text = havenGiven(raw);
  if (UNION_WORD.test(text)) return "union";
  if (text.includes("-")) return "mark";
  if (text.includes(" ")) return "pair";
  if (text.length <= 6) return "short";
  if (text.length >= 12) return "long";
  if (/^[aeiou]/i.test(text)) return "vowel";
  if (/[any]$/i.test(text)) return "coast";
  return "post";
}

export function havenHue(raw: HavenValue): HavenHue {
  const lane = havenLane(raw);
  if (!lane) return "";
  if (lane === "short" || lane === "vowel") return "champagne";
  if (lane === "mark" || lane === "pair") return "graphite";
  return "ivory";
}

export function havenUnion(raw: HavenValue): boolean {
  return havenLane(raw) === "union";
}

export function havenMark(raw: HavenValue): boolean {
  return havenLane(raw) === "mark";
}

export function havenPair(raw: HavenValue): boolean {
  return havenLane(raw) === "pair";
}

export function havenShort(raw: HavenValue): boolean {
  return havenLane(raw) === "short";
}

export function havenLong(raw: HavenValue): boolean {
  return havenLane(raw) === "long";
}

export function havenVowelLane(raw: HavenValue): boolean {
  return havenLane(raw) === "vowel";
}

export function havenCoast(raw: HavenValue): boolean {
  return havenLane(raw) === "coast";
}

export function havenPost(raw: HavenValue): boolean {
  return havenLane(raw) === "post";
}

export function havenOpen(raw: HavenValue): boolean {
  return havenState(raw) === "clear";
}

/** A name the desk can keep without a rewrite: long or coast. */
export function havenHeld(raw: HavenValue): boolean {
  const lane = havenLane(raw);
  return lane === "long" || lane === "coast";
}

/** A short name, or a name of four characters or fewer that is not a union, still wants a fuller label. */
export function havenSoon(raw: HavenValue): boolean {
  if (havenState(raw) !== "set") return false;
  if (havenShort(raw)) return true;
  if (havenUnion(raw)) return false;
  const length = havenGiven(raw).length;
  return length > 0 && length <= 4;
}

export function havenLength(raw: HavenValue): number | null {
  if (havenState(raw) !== "set") return null;
  return havenGiven(raw).length;
}

export function havenEven(raw: HavenValue): boolean {
  const length = havenLength(raw);
  return length !== null && length % 2 === 0;
}

export function havenOdd(raw: HavenValue): boolean {
  const length = havenLength(raw);
  return length !== null && length % 2 === 1;
}

export function havenFirst(raw: HavenValue): boolean {
  return /^[A-Za-z]/.test(havenGiven(raw));
}

export function havenTail(raw: HavenValue): boolean {
  return /[0-9]$/.test(havenGiven(raw));
}

export function havenCapital(raw: HavenValue): boolean {
  return /[A-Z]/.test(havenGiven(raw));
}

export function havenSpace(raw: HavenValue): boolean {
  return havenGiven(raw).includes(" ");
}

export function havenVowel(raw: HavenValue): boolean {
  return /^[aeiou]/i.test(havenGiven(raw));
}

export function havenDigit(raw: HavenValue): boolean {
  return /[0-9]/.test(havenGiven(raw));
}

export function havenLetter(raw: HavenValue): boolean {
  return /[A-Za-z]/.test(havenGiven(raw));
}

export function havenMixed(raw: HavenValue): boolean {
  return havenDigit(raw) && havenLetter(raw);
}

export function havenLower(raw: HavenValue): boolean {
  const text = havenGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function havenUpper(raw: HavenValue): boolean {
  const text = havenGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function havenHyphen(raw: HavenValue): boolean {
  return havenGiven(raw).includes("-");
}

export function havenPeriod(raw: HavenValue): boolean {
  return havenGiven(raw).includes(".");
}

export function havenStamp(raw: HavenValue): string {
  const text = havenGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function havenCopy(raw: HavenValue): string {
  return havenGiven(raw);
}

export function havenFamily(raw: HavenValue): string {
  if (havenState(raw) !== "set") return "";
  return firstToken(havenGiven(raw));
}

export function havenLanes(rows: readonly HavenRow[]): HavenLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of HAVEN_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = havenLane(row.haven);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return HAVEN_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingHaven(rows: readonly HavenRow[]): string {
  const lines = havenLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || HAVEN_LANES.indexOf(a.lane as (typeof HAVEN_LANES)[number]) - HAVEN_LANES.indexOf(b.lane as (typeof HAVEN_LANES)[number]))[0].lane;
}

export function leadingHavenHue(rows: readonly HavenRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of HAVEN_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = havenHue(row.haven);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = HAVEN_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || HAVEN_HUES.indexOf(a.hue) - HAVEN_HUES.indexOf(b.hue))[0].hue;
}

export function laneHavenCount(rows: readonly HavenRow[], lane: HavenLane): number {
  return rows.filter((row) => havenLane(row.haven) === lane).length;
}

export function havenShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentHavenLanes(rows: readonly HavenRow[]): string[] {
  return havenLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenHavens(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedHavens(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleHaven(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleHavenReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkHavenReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleHavenLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: HavenRow, shape: HavenShape): boolean {
  if (shape === "all") return true;
  if (shape === "union") return havenUnion(row.haven);
  if (shape === "mark") return havenMark(row.haven);
  if (shape === "pair") return havenPair(row.haven);
  if (shape === "short") return havenShort(row.haven);
  if (shape === "long") return havenLong(row.haven);
  if (shape === "vowel") return havenVowelLane(row.haven);
  if (shape === "coast") return havenCoast(row.haven);
  if (shape === "post") return havenPost(row.haven);
  if (shape === "open") return havenOpen(row.haven);
  if (shape === "soon") return havenSoon(row.haven);
  if (shape === "digit") return havenDigit(row.haven);
  if (shape === "letter") return havenLetter(row.haven);
  if (shape === "mixed") return havenMixed(row.haven);
  if (shape === "upper") return havenUpper(row.haven);
  if (shape === "lower") return havenLower(row.haven);
  if (shape === "space") return havenSpace(row.haven);
  if (shape === "even") return havenEven(row.haven);
  if (shape === "odd") return havenOdd(row.haven);
  if (shape === "tail") return havenTail(row.haven);
  if (shape === "first") return havenFirst(row.haven);
  if (shape === "held") return havenHeld(row.haven);
  if (shape === "hyphen") return havenHyphen(row.haven);
  if (shape === "period") return havenPeriod(row.haven);
  return havenLane(row.haven) === shape;
}

export function visibleHavens(
  rows: readonly HavenRow[],
  lane: string,
  hue: string,
  query: string,
  review: HavenReview,
  reviewed: readonly string[],
  shape: HavenShape,
): HavenRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (havenState(row.haven) === "") return false;
    const found = havenLane(row.haven);
    const hueName = havenHue(row.haven);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${havenGiven(row.haven)} ${havenStamp(row.haven)} ${havenFamily(row.haven)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function havenLanesCsv(rows: readonly HavenRow[]): string {
  const lines = ["lane,count"];
  for (const line of havenLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function havenRowsCsv(rows: readonly HavenRow[], reviewed: readonly string[]): string {
  const lines = ["name,haven,stamp,family,lane,hue,length,union,mark,pair,short,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(havenGiven(row.haven)),
        havenStamp(row.haven),
        csvCell(havenFamily(row.haven)),
        havenLane(row.haven),
        havenHue(row.haven),
        havenLength(row.haven) ?? "",
        havenUnion(row.haven) ? "1" : "0",
        havenMark(row.haven) ? "1" : "0",
        havenPair(row.haven) ? "1" : "0",
        havenShort(row.haven) ? "1" : "0",
        havenEven(row.haven) ? "1" : "0",
        havenDigit(row.haven) ? "1" : "0",
        havenMixed(row.haven) ? "1" : "0",
        havenUpper(row.haven) ? "1" : "0",
        havenVowel(row.haven) ? "1" : "0",
        havenTail(row.haven) ? "1" : "0",
        havenHeld(row.haven) ? "1" : "0",
        havenSoon(row.haven) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
