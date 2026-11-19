/**
 * Circumferentor dials for a compass book kept in this browser, and notice plates read the login-block message already stored on the account.
 * Stations are box, needle, vane, and clamp. Metal is tin, copper, and gold.
 * Degrees are 7, 14, 21, or 28. Pins are 2, 4, or 8.
 * A seed notice has no space and no digit. A spark notice is twelve characters or shorter and is not a house word.
 * A query contains a question mark. A house notice says review, desk, or hold. A dash contains a hyphen.
 * A pair has a space and a digit. A scroll is forty characters or longer. Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_circumferentor (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   bearer text not null default '',
 *   station text not null default '',
 *   metal text not null default '',
 *   degree_no integer,
 *   pin_no integer not null default 2,
 *   tags text not null default '',
 *   set_mark boolean not null default false,
 *   sleeved boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_notice_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_notice_review (
 *   trader_id text primary key
 * );
 */

export const CFC_KEY = "crmv4-circumferentor";
export const CFC_VIEW_KEY = "crmv4-circumferentor-views";
export const CFC_DENSITY_KEY = "crmv4-circumferentor-density";
export const CIRC_STATIONS = ["box", "needle", "vane", "clamp"] as const;

export type CircStation = (typeof CIRC_STATIONS)[number];

export type CircMetal = "blank" | "tin" | "copper" | "gold";

export type CircTray = "bench" | "sleeve" | "chest";

export type CircDensity = "broad" | "tight";

export type CircSort = "station" | "bearer";

export type Circumferentor = {
  id: string;
  title: string;
  note: string;
  bearer: string;
  station: string;
  degree: number | null;
  metal: string;
  pin: number;
  tags: string[];
  set: boolean;
  sleeved: boolean;
  chested: boolean;
  flagged: boolean;
  audit: string;
};

export type CircView = {
  id: string;
  name: string;
  tray: CircTray;
  query: string;
  bearer: string;
  metal: string;
  station: string;
  degree: string;
  pin: string;
};

export type CircCounts = {
  bench: number;
  sleeve: number;
  chest: number;
  set: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  degree: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND300_FEATURES = [
  "save",
  "note",
  "trays",
  "metal",
  "degree",
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
  "fair-bearer",
  "viewer",
  "suggest",
  "sla",
  "notice",
  "notice-csv",
] as const;

const AUDITS = ["save", "edit", "note", "metal", "set", "clear", "sleeve", "resume", "chest", "open", "tag", "pin", "degree", "lower", "star"] as const;

const METALS = ["tin", "copper", "gold"] as const;

const DEGREE_CYCLE = [7, 14, 21, 28] as const;

const PIN_CYCLE = [2, 4, 8] as const;

const INNER = new Set(["box", "needle"]);

const OUTER = new Set(["vane", "clamp"]);

const HOUSE_METAL = new Set(["TIN", "GOLD"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const HOUSE_WORD = /\b(review|desk|hold)\b/i;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CircTray {
  return raw === "sleeve" || raw === "chest" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function metalName(raw: unknown): Exclude<CircMetal, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<CircMetal, "blank">) : "";
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

function inTray(card: Circumferentor, tray: CircTray): boolean {
  if (tray === "sleeve") return card.sleeved && !card.chested;
  if (tray === "chest") return card.chested;
  return !card.sleeved && !card.chested;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function stationIndex(station: string): number {
  return CIRC_STATIONS.indexOf(station as CircStation);
}

function degreeIndex(degree: number): number {
  return DEGREE_CYCLE.indexOf(degree as (typeof DEGREE_CYCLE)[number]);
}

function pinIndex(pin: number): number {
  return PIN_CYCLE.indexOf(pin as (typeof PIN_CYCLE)[number]);
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

export function circStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (CIRC_STATIONS as readonly string[]).includes(text) ? text : "";
}

/** A degree is 7, 14, 21, or 28. Anything else stays blank. */
export function circDegree(raw: unknown): 7 | 14 | 21 | 28 | null {
  const text = wholeToken(raw);
  if (text !== "7" && text !== "14" && text !== "21" && text !== "28") return null;
  return Number(text) as 7 | 14 | 21 | 28;
}

/** A pin is 2, 4, or 8. Anything else stays blank. */
export function circPin(raw: unknown): 2 | 4 | 8 | null {
  const text = wholeToken(raw);
  if (text !== "2" && text !== "4" && text !== "8") return null;
  return Number(text) as 2 | 4 | 8;
}

/** Metal is tin, copper, or gold. The saved name is the upper token. */
export function circMetal(raw: unknown): string {
  const text = metalName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerStation(station: unknown): boolean {
  return INNER.has(clip(station, 12).toLowerCase());
}

export function outerStation(station: unknown): boolean {
  return OUTER.has(clip(station, 12).toLowerCase());
}

/** Box is the case. Needle is the point. Vane is the slit. Clamp is the lock. */
export function circBand(station: unknown): string {
  const text = circStation(station);
  if (!text) return "";
  if (text === "box") return "case";
  if (text === "needle") return "point";
  if (text === "vane") return "slit";
  return "lock";
}

/** Signed distance from one station to another around the compass. */
export function stationGap(from: unknown, to: unknown): number | null {
  const left = stationIndex(circStation(from));
  const right = stationIndex(circStation(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseMetal(metal: unknown): boolean {
  return HOUSE_METAL.has(circMetal(metal));
}

/** A pair pin is 4. Two and eight are not a pair. */
export function pairPin(pin: unknown): boolean {
  return circPin(pin) === 4;
}

/** A full pin is 8. */
export function fullPin(pin: unknown): boolean {
  return circPin(pin) === 8;
}

export function activeStation(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return circStation(text) || "all";
}

export function activeDegree(raw: unknown): string {
  const degree = circDegree(raw);
  return degree === null ? "all" : String(degree);
}

export function activeMetal(raw: unknown, allow: readonly string[]): string {
  const text = circMetal(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePin(raw: unknown): string {
  const pin = circPin(raw);
  return pin === null ? "all" : String(pin);
}

export function moveCircFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The metal the bench uses least. A tie keeps gold, then tin, then copper. */
export function suggestCircMetal(cards: readonly Circumferentor[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.metal) continue;
    counts.set(card.metal, (counts.get(card.metal) || 0) + 1);
  }
  let best = "GOLD";
  let score = Number.POSITIVE_INFINITY;
  for (const metal of ["GOLD", "TIN", "COPPER"]) {
    const count = counts.get(metal) || 0;
    if (count < score) {
      best = metal;
      score = count;
    }
  }
  return best;
}

/** Before nine, suggest seven. Morning asks for fourteen. Afternoon asks for twenty-one. Evening asks for twenty-eight. A missing degree on the bench wins when any degree is saved, and a tie keeps the wider degree. */
export function suggestDegree(cards: readonly Circumferentor[], hour: number): 7 | 14 | 21 | 28 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "bench") || card.degree === null) continue;
    seen = true;
    counts.set(card.degree, (counts.get(card.degree) || 0) + 1);
  }
  if (seen) {
    let best: 7 | 14 | 21 | 28 = 28;
    let score = Number.POSITIVE_INFINITY;
    for (const degree of [...DEGREE_CYCLE].reverse()) {
      const count = counts.get(degree) || 0;
      if (count < score) {
        best = degree;
        score = count;
      }
    }
    return best;
  }
  if (hour < 9) return 7;
  if (hour < 14) return 14;
  if (hour < 18) return 21;
  return 28;
}

/** Before eleven, suggest the box. The rest of the day suggests the clamp. */
export function suggestStation(hour: number): CircStation {
  return hour < 11 ? "box" : "clamp";
}

/** The bearer with the fewest unset dials on the bench. A tie keeps the roster order. */
export function fairCircBearer(cards: readonly Circumferentor[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.set);
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

export function readCircumferentors(raw: unknown): Circumferentor[] {
  if (!Array.isArray(raw)) return [];
  const out: Circumferentor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Circumferentor>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      bearer: clip(row.bearer, 24),
      station: circStation(row.station),
      degree: circDegree(row.degree),
      metal: circMetal(row.metal),
      pin: circPin(row.pin) ?? 2,
      tags: tagsOf(row.tags),
      set: row.set === true,
      sleeved: row.sleeved === true,
      chested: row.chested === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addCircumferentor(
  cards: readonly Circumferentor[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    bearer?: string;
    station?: string;
    degree?: unknown;
    metal?: string;
    pin?: unknown;
    tags?: unknown;
  },
): Circumferentor[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readCircumferentors([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      bearer: clip(card.bearer, 24),
      station: circStation(card.station),
      degree: circDegree(card.degree),
      metal: circMetal(card.metal),
      pin: circPin(card.pin) ?? 2,
      tags: tagsOf(card.tags),
      set: false,
      sleeved: false,
      chested: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Circumferentor[], id: string, edit: (card: Circumferentor) => Circumferentor): Circumferentor[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editCircumferentor(cards: readonly Circumferentor[], id: string, title: string): Circumferentor[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editCircNote(cards: readonly Circumferentor[], id: string, note: string): Circumferentor[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleMetal(metal: string): string {
  const order = ["", "TIN", "COPPER", "GOLD"];
  const index = order.indexOf(circMetal(metal));
  return order[(index + 1) % order.length] || "TIN";
}

export function setCircMetal(cards: readonly Circumferentor[], id: string, metal: string): Circumferentor[] {
  const next = circMetal(metal);
  return mapCard(cards, id, (card) => (card.metal === next ? card : { ...card, metal: next, audit: "metal" }));
}

export function setCircSet(cards: readonly Circumferentor[], id: string, set: boolean): Circumferentor[] {
  return mapCard(cards, id, (card) => (card.set === set ? card : { ...card, set, audit: set ? "set" : "clear" }));
}

export function setCircSleeve(cards: readonly Circumferentor[], id: string, sleeved: boolean): Circumferentor[] {
  return mapCard(cards, id, (card) => (card.sleeved === sleeved ? card : { ...card, sleeved, chested: sleeved ? false : card.chested, audit: sleeved ? "sleeve" : "resume" }));
}

export function setCircChest(cards: readonly Circumferentor[], id: string, chested: boolean): Circumferentor[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, sleeved: chested ? false : card.sleeved, audit: chested ? "chest" : "open" }));
}

export function setCircStar(cards: readonly Circumferentor[], id: string, flagged: boolean): Circumferentor[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addCircTag(cards: readonly Circumferentor[], id: string, tag: string): Circumferentor[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepDegree(degree: number | null, dir: 1 | -1): 7 | 14 | 21 | 28 {
  if (degree === null) return dir > 0 ? 7 : 28;
  const index = degreeIndex(degree);
  const next = index < 0 ? 0 : (index + dir + DEGREE_CYCLE.length) % DEGREE_CYCLE.length;
  return DEGREE_CYCLE[next];
}

function stepPin(pin: number, dir: 1 | -1): 2 | 4 | 8 {
  const index = pinIndex(pin);
  const next = index < 0 ? 0 : (index + dir + PIN_CYCLE.length) % PIN_CYCLE.length;
  return PIN_CYCLE[next];
}

export function liftDegree(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return mapCard(cards, id, (card) => ({ ...card, degree: stepDegree(card.degree, 1), audit: "degree" }));
}

export function lowerDegree(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return mapCard(cards, id, (card) => ({ ...card, degree: stepDegree(card.degree, -1), audit: "lower" }));
}

export function raisePin(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, 1), audit: "pin" }));
}

export function lowerPin(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return mapCard(cards, id, (card) => ({ ...card, pin: stepPin(card.pin, -1), audit: "pin" }));
}

export function setCircFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, set: !card.set, audit: card.set ? "clear" : "set" })) : [...cards];
}

export function sleeveCircFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return setCircSleeve(cards, id, !cards.find((card) => card.id === id)?.sleeved);
}

export function starCircFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return setCircStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagCircFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return addCircTag(cards, id, "a");
}

export function metalFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  const card = cards.find((item) => item.id === id);
  return card ? setCircMetal(cards, id, cycleMetal(card.metal)) : [...cards];
}

export function liftDegreeFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return liftDegree(cards, id);
}

export function lowerDegreeFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return lowerDegree(cards, id);
}

export function raisePinFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return raisePin(cards, id);
}

export function lowerPinFocused(cards: readonly Circumferentor[], id: string): Circumferentor[] {
  return lowerPin(cards, id);
}

function bulk(cards: readonly Circumferentor[], ids: readonly string[], edit: (card: Circumferentor) => Circumferentor): Circumferentor[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkCircGold(cards: readonly Circumferentor[], ids: readonly string[]): Circumferentor[] {
  return bulk(cards, ids, (card) => (card.metal === "GOLD" ? card : { ...card, metal: "GOLD", audit: "metal" }));
}

export function bulkCircSet(cards: readonly Circumferentor[], ids: readonly string[]): Circumferentor[] {
  return bulk(cards, ids, (card) => (card.set ? card : { ...card, set: true, audit: "set" }));
}

export function bulkCircChest(cards: readonly Circumferentor[], ids: readonly string[]): Circumferentor[] {
  return bulk(cards, ids, (card) => (card.chested ? card : { ...card, chested: true, sleeved: false, audit: "chest" }));
}

export function bulkCircTag(cards: readonly Circumferentor[], ids: readonly string[]): Circumferentor[] {
  return bulk(cards, ids, (card) => (card.tags.includes("b") ? card : { ...card, tags: tagsOf([...card.tags, "b"]), audit: "tag" }));
}

export function readCircViews(raw: unknown): CircView[] {
  if (!Array.isArray(raw)) return [];
  const out: CircView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CircView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      bearer: clip(row.bearer, 24),
      metal: activeMetal(row.metal, ["TIN", "COPPER", "GOLD"]),
      station: activeStation(row.station),
      degree: activeDegree(row.degree),
      pin: activePin(row.pin),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCircView(views: readonly CircView[], view: CircView): CircView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readCircViews([...views, { ...view, id, name }]);
}

export function dropCircView(views: readonly CircView[], id: string): CircView[] {
  return views.filter((view) => view.id !== id);
}

export function circDensity(raw: unknown): CircDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortCircumferentors(cards: readonly Circumferentor[], sort: CircSort): Circumferentor[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "bearer") {
      const bearer = a.bearer.localeCompare(b.bearer);
      if (bearer) return bearer;
    } else {
      const station = stationIndex(a.station) - stationIndex(b.station);
      if (station) return station;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleCircumferentors(
  cards: readonly Circumferentor[],
  tray: CircTray,
  query: string,
  bearer: string,
  metal: string,
  station: string,
  degree: string,
  pin: string,
): Circumferentor[] {
  const text = query.trim().toLowerCase();
  const wantBearer = clip(bearer, 24).toLowerCase();
  const wantMetal = metal === "all" ? "" : circMetal(metal);
  const wantStation = activeStation(station);
  const wantDegree = activeDegree(degree);
  const wantPin = activePin(pin);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.bearer}`.toLowerCase().includes(text)) return false;
    if (wantBearer && card.bearer.toLowerCase() !== wantBearer) return false;
    if (wantMetal && card.metal !== wantMetal) return false;
    if (wantStation === "inner" && !innerStation(card.station)) return false;
    if (wantStation === "outer" && !outerStation(card.station)) return false;
    if (wantStation !== "all" && wantStation !== "inner" && wantStation !== "outer" && card.station !== wantStation) return false;
    if (wantDegree !== "all" && String(card.degree ?? "") !== wantDegree) return false;
    if (wantPin !== "all" && String(card.pin) !== wantPin) return false;
    return true;
  });
}

/** An outer station on pin two, still unset and not in the chest, is overdue. */
export function overdueCirc(card: Circumferentor): boolean {
  return outerStation(card.station) && card.pin === 2 && !card.set && !card.chested;
}

/** No metal, the short degree, pin two, and still on the bench. */
export function idleCirc(card: Circumferentor): boolean {
  return !card.metal && card.degree === 7 && card.pin === 2 && !card.set && !card.sleeved && !card.chested;
}

/** Gold, a wide degree, and a full pin, still out of the chest. */
export function briskCirc(card: Circumferentor): boolean {
  return card.metal === "GOLD" && card.degree === 28 && card.pin === 8 && !card.chested;
}

/** Clamp, tin, and a middle degree. */
export function restingCirc(card: Circumferentor): boolean {
  return card.station === "clamp" && card.metal === "TIN" && card.degree === 14;
}

/** A box dial is late when the desk is already on the clamp. */
export function lateCirc(card: Circumferentor, desk: string): boolean {
  return card.station === "box" && circStation(desk) === "clamp" && !card.set;
}

export function circCounts(cards: readonly Circumferentor[], shown: readonly Circumferentor[], desk: string): CircCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    set: cards.filter((card) => card.set).length,
    inner: cards.filter((card) => innerStation(card.station)).length,
    outer: cards.filter((card) => outerStation(card.station)).length,
    wide: cards.filter((card) => card.degree === 28).length,
    house: cards.filter((card) => houseMetal(card.metal)).length,
    degree: cards.reduce((sum, card) => sum + (card.degree || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleCirc).length,
    brisk: cards.filter(briskCirc).length,
    resting: cards.filter(restingCirc).length,
    overdue: cards.filter(overdueCirc).length,
    pair: cards.filter((card) => pairPin(card.pin) && lateCirc(card, desk)).length,
  };
}

export function circBars(cards: readonly Circumferentor[]): { station: string; count: number }[] {
  return CIRC_STATIONS.map((station) => ({ station, count: cards.filter((card) => card.station === station && !card.chested).length }));
}

export function circTimeline(cards: readonly Circumferentor[]): { degree: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return DEGREE_CYCLE.map((degree) => ({ degree, titles: open.filter((card) => card.degree === degree).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function circBearers(cards: readonly Circumferentor[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.bearer && !out.some((name) => name.toLowerCase() === card.bearer.toLowerCase())) out.push(card.bearer);
  }
  return out;
}

export function busiestCircBearer(cards: readonly Circumferentor[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.set && card.bearer);
  let best = "";
  let score = 0;
  for (const name of circBearers(open)) {
    const count = open.filter((card) => card.bearer.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderCircs(cards: readonly Circumferentor[]): string[] {
  return cards.filter(overdueCirc).map((card) => card.title);
}

export function circCopy(card: Circumferentor): string {
  return [card.title, card.bearer, card.station, card.metal, card.degree ?? "", card.pin, card.note].filter((item) => item !== "").join(" · ");
}

export function circCsv(cards: readonly Circumferentor[], desk: string): string {
  const lines = ["title,bearer,station,metal,degree,pin,tags,set,sleeve,chest,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.bearer),
        card.station,
        card.metal,
        card.degree ?? "",
        card.pin,
        card.tags.join(" "),
        card.set ? "1" : "0",
        card.sleeved ? "1" : "0",
        card.chested ? "1" : "0",
        card.flagged ? "1" : "0",
        outerStation(card.station) ? "1" : "0",
        lateCirc(card, desk) ? "1" : "0",
        idleCirc(card) ? "1" : "0",
        briskCirc(card) ? "1" : "0",
        restingCirc(card) ? "1" : "0",
        overdueCirc(card) ? "1" : "0",
        innerStation(card.station) ? "1" : "0",
        houseMetal(card.metal) ? "1" : "0",
        circBand(card.station),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const NTC_KEY = "crmv4-notice-hide";
export const NTC_REVIEW_KEY = "crmv4-notice-review";

export type NoticeLane = "" | "query" | "house" | "dash" | "pair" | "seed" | "spark" | "scroll" | "post";

export type NoticeHue = "" | "ivory" | "graphite" | "champagne";

export type NoticeState = "" | "clear" | "set";

export type NoticeReview = "all" | "reviewed" | "fresh";

export type NoticeShape =
  | "all"
  | "query"
  | "house"
  | "dash"
  | "pair"
  | "seed"
  | "spark"
  | "scroll"
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
  | "vowel"
  | "tail"
  | "digit"
  | "first"
  | "held"
  | "hyphen"
  | "period";

export type NoticeValue = string | { loginBlockedMessage?: unknown; [key: string]: unknown } | null | undefined;

export type NoticeRow = { id: string; label: string; notice: NoticeValue };

export type NoticeLaneLine = { lane: string; count: number };

const NOTICE_LANES = ["query", "house", "dash", "pair", "seed", "spark", "scroll", "post"] as const;

const NOTICE_HUES = ["champagne", "ivory", "graphite"] as const;

function noticeRecord(raw: NoticeValue): { loginBlockedMessage?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function noticeBlocked(raw: NoticeValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function noticeGiven(raw: NoticeValue): string {
  const row = noticeRecord(raw);
  if (row && !("loginBlockedMessage" in row)) return "";
  const value = row ? row.loginBlockedMessage : raw;
  return clip(value, 80);
}

function noticeReadable(raw: NoticeValue): boolean {
  if (noticeBlocked(raw)) return false;
  const row = noticeRecord(raw);
  if (row && !("loginBlockedMessage" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function noticeState(raw: NoticeValue): NoticeState {
  if (!noticeReadable(raw)) return "";
  return noticeGiven(raw) ? "set" : "clear";
}

/** A query contains ?. A house notice says review, desk, or hold. A dash contains a hyphen. A pair has a space and a digit. A seed has no space and no digit. A spark is twelve characters or shorter. A scroll is forty characters or longer. */
export function noticeLane(raw: NoticeValue): NoticeLane {
  if (noticeState(raw) !== "set") return "";
  const text = noticeGiven(raw);
  if (text.includes("?")) return "query";
  if (HOUSE_WORD.test(text)) return "house";
  if (text.includes("-")) return "dash";
  if (text.includes(" ") && /\d/.test(text)) return "pair";
  if (!text.includes(" ") && !/\d/.test(text)) return "seed";
  if (text.length <= 12) return "spark";
  if (text.length >= 40) return "scroll";
  return "post";
}

export function noticeHue(raw: NoticeValue): NoticeHue {
  const lane = noticeLane(raw);
  if (!lane) return "";
  if (lane === "seed" || lane === "spark") return "champagne";
  if (lane === "dash" || lane === "pair" || lane === "query") return "graphite";
  return "ivory";
}

export function noticeSeed(raw: NoticeValue): boolean {
  return noticeLane(raw) === "seed";
}

export function noticeQuery(raw: NoticeValue): boolean {
  return noticeLane(raw) === "query";
}

export function noticeHouse(raw: NoticeValue): boolean {
  return noticeLane(raw) === "house";
}

export function noticeDash(raw: NoticeValue): boolean {
  return noticeLane(raw) === "dash";
}

export function noticePair(raw: NoticeValue): boolean {
  return noticeLane(raw) === "pair";
}

export function noticeSpark(raw: NoticeValue): boolean {
  return noticeLane(raw) === "spark";
}

export function noticeScroll(raw: NoticeValue): boolean {
  return noticeLane(raw) === "scroll";
}

export function noticePost(raw: NoticeValue): boolean {
  return noticeLane(raw) === "post";
}

export function noticeOpen(raw: NoticeValue): boolean {
  return noticeState(raw) === "clear";
}

/** A notice the desk can keep without a rewrite: house or post. */
export function noticeHeld(raw: NoticeValue): boolean {
  const lane = noticeLane(raw);
  return lane === "house" || lane === "post";
}

/** A seed, or a notice of twelve characters or shorter that is not a house line, still wants a fuller message. */
export function noticeSoon(raw: NoticeValue): boolean {
  if (noticeState(raw) !== "set") return false;
  if (noticeSeed(raw)) return true;
  if (noticeHouse(raw)) return false;
  const length = noticeGiven(raw).length;
  return length > 0 && length <= 12;
}

export function noticeLength(raw: NoticeValue): number | null {
  if (noticeState(raw) !== "set") return null;
  return noticeGiven(raw).length;
}

export function noticeEven(raw: NoticeValue): boolean {
  const length = noticeLength(raw);
  return length !== null && length % 2 === 0;
}

export function noticeOdd(raw: NoticeValue): boolean {
  const length = noticeLength(raw);
  return length !== null && length % 2 === 1;
}

export function noticeFirst(raw: NoticeValue): boolean {
  return /^[A-Za-z]/.test(noticeGiven(raw));
}

export function noticeTail(raw: NoticeValue): boolean {
  return /[0-9]$/.test(noticeGiven(raw));
}

export function noticeCapital(raw: NoticeValue): boolean {
  return /[A-Z]/.test(noticeGiven(raw));
}

export function noticeSpace(raw: NoticeValue): boolean {
  return noticeGiven(raw).includes(" ");
}

export function noticeVowel(raw: NoticeValue): boolean {
  return /^[aeiou]/i.test(noticeGiven(raw));
}

export function noticeDigit(raw: NoticeValue): boolean {
  return /[0-9]/.test(noticeGiven(raw));
}

export function noticeLetter(raw: NoticeValue): boolean {
  return /[A-Za-z]/.test(noticeGiven(raw));
}

export function noticeMixed(raw: NoticeValue): boolean {
  return noticeDigit(raw) && noticeLetter(raw);
}

export function noticeLower(raw: NoticeValue): boolean {
  const text = noticeGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function noticeUpper(raw: NoticeValue): boolean {
  const text = noticeGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function noticeHyphen(raw: NoticeValue): boolean {
  return noticeGiven(raw).includes("-");
}

export function noticePeriod(raw: NoticeValue): boolean {
  return noticeGiven(raw).includes(".");
}

export function noticeStamp(raw: NoticeValue): string {
  const text = noticeGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function noticeCopy(raw: NoticeValue): string {
  return noticeGiven(raw);
}

export function noticeFamily(raw: NoticeValue): string {
  if (noticeState(raw) !== "set") return "";
  return firstToken(noticeGiven(raw));
}

export function noticeLanes(rows: readonly NoticeRow[]): NoticeLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of NOTICE_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = noticeLane(row.notice);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return NOTICE_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingNotice(rows: readonly NoticeRow[]): string {
  const lines = noticeLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || NOTICE_LANES.indexOf(a.lane as (typeof NOTICE_LANES)[number]) - NOTICE_LANES.indexOf(b.lane as (typeof NOTICE_LANES)[number]))[0].lane;
}

export function leadingNoticeHue(rows: readonly NoticeRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of NOTICE_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = noticeHue(row.notice);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = NOTICE_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || NOTICE_HUES.indexOf(a.hue) - NOTICE_HUES.indexOf(b.hue))[0].hue;
}

export function laneNoticeCount(rows: readonly NoticeRow[], lane: NoticeLane): number {
  return rows.filter((row) => noticeLane(row.notice) === lane).length;
}

export function noticeShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentNoticeLanes(rows: readonly NoticeRow[]): string[] {
  return noticeLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenNotices(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedNotices(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleNotice(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleNoticeReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkNoticeReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleNoticeLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: NoticeRow, shape: NoticeShape): boolean {
  if (shape === "all") return true;
  if (shape === "query") return noticeQuery(row.notice);
  if (shape === "house") return noticeHouse(row.notice);
  if (shape === "dash") return noticeDash(row.notice);
  if (shape === "pair") return noticePair(row.notice);
  if (shape === "seed") return noticeSeed(row.notice);
  if (shape === "spark") return noticeSpark(row.notice);
  if (shape === "scroll") return noticeScroll(row.notice);
  if (shape === "post") return noticePost(row.notice);
  if (shape === "open") return noticeOpen(row.notice);
  if (shape === "soon") return noticeSoon(row.notice);
  if (shape === "digit") return noticeDigit(row.notice);
  if (shape === "letter") return noticeLetter(row.notice);
  if (shape === "mixed") return noticeMixed(row.notice);
  if (shape === "upper") return noticeUpper(row.notice);
  if (shape === "lower") return noticeLower(row.notice);
  if (shape === "space") return noticeSpace(row.notice);
  if (shape === "even") return noticeEven(row.notice);
  if (shape === "odd") return noticeOdd(row.notice);
  if (shape === "vowel") return noticeVowel(row.notice);
  if (shape === "tail") return noticeTail(row.notice);
  if (shape === "first") return noticeFirst(row.notice);
  if (shape === "held") return noticeHeld(row.notice);
  if (shape === "hyphen") return noticeHyphen(row.notice);
  if (shape === "period") return noticePeriod(row.notice);
  return noticeLane(row.notice) === shape;
}

export function visibleNotices(
  rows: readonly NoticeRow[],
  lane: string,
  hue: string,
  query: string,
  review: NoticeReview,
  reviewed: readonly string[],
  shape: NoticeShape,
): NoticeRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (noticeState(row.notice) === "") return false;
    const found = noticeLane(row.notice);
    const hueName = noticeHue(row.notice);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${noticeGiven(row.notice)} ${noticeStamp(row.notice)} ${noticeFamily(row.notice)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function noticeLanesCsv(rows: readonly NoticeRow[]): string {
  const lines = ["lane,count"];
  for (const line of noticeLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function noticeRowsCsv(rows: readonly NoticeRow[], reviewed: readonly string[]): string {
  const lines = ["name,notice,stamp,family,lane,hue,length,seed,query,house,pair,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (noticeState(row.notice) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(noticeGiven(row.notice)),
        noticeStamp(row.notice),
        csvCell(noticeFamily(row.notice)),
        noticeLane(row.notice),
        noticeHue(row.notice),
        String(noticeLength(row.notice) ?? ""),
        noticeSeed(row.notice) ? "1" : "0",
        noticeQuery(row.notice) ? "1" : "0",
        noticeHouse(row.notice) ? "1" : "0",
        noticePair(row.notice) ? "1" : "0",
        noticeEven(row.notice) ? "1" : "0",
        noticeDigit(row.notice) ? "1" : "0",
        noticeMixed(row.notice) ? "1" : "0",
        noticeUpper(row.notice) ? "1" : "0",
        noticeVowel(row.notice) ? "1" : "0",
        noticeTail(row.notice) ? "1" : "0",
        noticeHeld(row.notice) ? "1" : "0",
        noticeSoon(row.notice) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
