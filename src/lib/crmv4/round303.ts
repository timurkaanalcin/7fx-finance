/**
 * Saphea leaves for a universal astrolabe kept in this browser, and civic plates read the city already stored on the account.
 * Climates are tropic, temperate, polar, and desert. Weave is silk, wool, and felt.
 * Latitudes are 15, 30, 45, or 60. Pegs are 3, 6, or 9.
 * A house city is Istanbul, London, Berlin, Moscow, or Cairo. A fort contains a hyphen. A harbor has a space.
 * A spark is four characters or fewer. A scroll is twelve characters or longer. A digit contains a number.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_saphea (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   scribe text not null default '',
 *   climate text not null default '',
 *   weave text not null default '',
 *   latitude_no integer,
 *   peg_no integer not null default 3,
 *   tags text not null default '',
 *   scribed boolean not null default false,
 *   sleeved boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_civic_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_civic_review (
 *   trader_id text primary key
 * );
 */

export const SPH_KEY = "crmv4-saphea";
export const SPH_VIEW_KEY = "crmv4-saphea-views";
export const SPH_DENSITY_KEY = "crmv4-saphea-density";
export const SPH_CLIMATES = ["tropic", "temperate", "polar", "desert"] as const;

export type SapheaClimate = (typeof SPH_CLIMATES)[number];

export type SapheaWeave = "blank" | "silk" | "wool" | "felt";

export type SapheaTray = "court" | "sleeve" | "vault";

export type SapheaDensity = "broad" | "tight";

export type SapheaSort = "climate" | "scribe";

export type Saphea = {
  id: string;
  title: string;
  note: string;
  scribe: string;
  climate: string;
  latitude: number | null;
  weave: string;
  peg: number;
  tags: string[];
  laid: boolean;
  locked: boolean;
  held: boolean;
  starred: boolean;
  audit: string;
};

export type SapheaView = {
  id: string;
  name: string;
  tray: SapheaTray;
  query: string;
  scribe: string;
  weave: string;
  climate: string;
  latitude: string;
  peg: string;
};

export type SapheaCounts = {
  court: number;
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

export const ROUND303_FEATURES = [
  "save",
  "note",
  "trays",
  "weave",
  "latitude",
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
  "fair-scribe",
  "viewer",
  "suggest",
  "sla",
  "civic",
  "civic-csv",
] as const;

const AUDITS = ["save", "edit", "note", "weave", "set", "clear", "sleeve", "resume", "vault", "open", "tag", "peg", "latitude", "lower", "star"] as const;

const WEAVES = ["silk", "wool", "felt"] as const;

const LATITUDE_CYCLE = [15, 30, 45, 60] as const;

const PEG_CYCLE = [3, 6, 9] as const;

const INNER = new Set(["tropic", "temperate"]);

const OUTER = new Set(["polar", "desert"]);

const HOUSE_WEAVE = new Set(["SILK", "FELT"]);

const HOUSE_CITIES = new Set(["ISTANBUL", "İSTANBUL", "LONDON", "BERLIN", "MOSCOW", "CAIRO"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SapheaTray {
  return raw === "sleeve" || raw === "vault" ? raw : "court";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function weaveName(raw: unknown): Exclude<SapheaWeave, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WEAVES as readonly string[]).includes(text) ? (text as Exclude<SapheaWeave, "blank">) : "";
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

function inTray(card: Saphea, tray: SapheaTray): boolean {
  if (tray === "sleeve") return card.locked && !card.held;
  if (tray === "vault") return card.held;
  return !card.locked && !card.held;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function climateIndex(climate: string): number {
  return SPH_CLIMATES.indexOf(climate as SapheaClimate);
}

function latitudeIndex(latitude: number): number {
  return LATITUDE_CYCLE.indexOf(latitude as (typeof LATITUDE_CYCLE)[number]);
}

function pegIndex(peg: number): number {
  return PEG_CYCLE.indexOf(peg as (typeof PEG_CYCLE)[number]);
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

export function sapheaClimate(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SPH_CLIMATES as readonly string[]).includes(text) ? text : "";
}

/** A latitude is 15, 30, 45, or 60. Anything else stays blank. */
export function sapheaLatitude(raw: unknown): 15 | 30 | 45 | 60 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "60") return null;
  return Number(text) as 15 | 30 | 45 | 60;
}

/** A peg is 3, 6, or 9. Anything else stays blank. */
export function sapheaPeg(raw: unknown): 3 | 6 | 9 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "6" && text !== "9") return null;
  return Number(text) as 3 | 6 | 9;
}

/** Weave is silk, wool, or felt. The saved name is the upper token. */
export function sapheaCloth(raw: unknown): string {
  const text = weaveName(raw);
  return text ? text.toUpperCase() : "";
}

export function sapheaInner(climate: unknown): boolean {
  return INNER.has(clip(climate, 12).toLowerCase());
}

export function sapheaOuter(climate: unknown): boolean {
  return OUTER.has(clip(climate, 12).toLowerCase());
}

/** Tropic is the belt. Temperate is the band. Polar is the cap. Desert is the dune. */
export function sapheaBand(climate: unknown): string {
  const text = sapheaClimate(climate);
  if (!text) return "";
  if (text === "tropic") return "belt";
  if (text === "temperate") return "band";
  if (text === "polar") return "cap";
  return "dune";
}

/** Signed distance from one climate to another along the saphea. */
export function sapheaGap(from: unknown, to: unknown): number | null {
  const left = climateIndex(sapheaClimate(from));
  const right = climateIndex(sapheaClimate(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseWeave(weave: unknown): boolean {
  return HOUSE_WEAVE.has(sapheaCloth(weave));
}

/** A pair peg is 6. Three and nine are not a pair. */
export function pairPeg(peg: unknown): boolean {
  return sapheaPeg(peg) === 6;
}

/** A full peg is 9. */
export function fullPeg(peg: unknown): boolean {
  return sapheaPeg(peg) === 9;
}

export function activeClimate(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return sapheaClimate(text) || "all";
}

export function activeLatitude(raw: unknown): string {
  const latitude = sapheaLatitude(raw);
  return latitude === null ? "all" : String(latitude);
}

export function activeWeave(raw: unknown, allow: readonly string[]): string {
  const text = sapheaCloth(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activePeg(raw: unknown): string {
  const peg = sapheaPeg(raw);
  return peg === null ? "all" : String(peg);
}

export function moveSapheaFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The weave the court uses least. A tie keeps felt, then silk, then wool. */
export function suggestWeave(cards: readonly Saphea[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "court") || !card.weave) continue;
    counts.set(card.weave, (counts.get(card.weave) || 0) + 1);
  }
  let best = "FELT";
  let score = Number.POSITIVE_INFINITY;
  for (const weave of ["FELT", "SILK", "WOOL"]) {
    const count = counts.get(weave) || 0;
    if (count < score) {
      best = weave;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest fifteen. Late morning asks for thirty. Afternoon asks for forty-five. Evening asks for sixty. A saved latitude in the court wins, and a tie keeps the taller latitude. */
export function suggestLatitude(cards: readonly Saphea[], hour: number): 15 | 30 | 45 | 60 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "court") || card.latitude === null) continue;
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

/** Before ten, suggest the tropic. The rest of the day suggests the desert. */
export function suggestClimate(hour: number): SapheaClimate {
  return hour < 10 ? "tropic" : "desert";
}

/** The scribe with the fewest unscribed leaves in the court. A tie keeps the roster order. */
export function fairScribe(cards: readonly Saphea[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "court") && !card.laid);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.scribe.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readSapheas(raw: unknown): Saphea[] {
  if (!Array.isArray(raw)) return [];
  const out: Saphea[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Saphea>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      scribe: clip(row.scribe, 24),
      climate: sapheaClimate(row.climate),
      latitude: sapheaLatitude(row.latitude),
      weave: sapheaCloth(row.weave),
      peg: sapheaPeg(row.peg) ?? 3,
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

export function addSaphea(
  cards: readonly Saphea[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    scribe?: string;
    climate?: string;
    latitude?: unknown;
    weave?: string;
    peg?: unknown;
    tags?: unknown;
  },
): Saphea[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `s${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSapheas([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      scribe: clip(card.scribe, 24),
      climate: sapheaClimate(card.climate),
      latitude: sapheaLatitude(card.latitude),
      weave: sapheaCloth(card.weave),
      peg: sapheaPeg(card.peg) ?? 3,
      tags: tagsOf(card.tags),
      laid: false,
      locked: false,
      held: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Saphea[], id: string, edit: (card: Saphea) => Saphea): Saphea[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSaphea(cards: readonly Saphea[], id: string, title: string): Saphea[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSapheaNote(cards: readonly Saphea[], id: string, note: string): Saphea[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleWeave(weave: string): string {
  const order = ["", "SILK", "WOOL", "FELT"];
  const index = order.indexOf(sapheaCloth(weave));
  return order[(index + 1) % order.length] || "SILK";
}

export function setSapheaCloth(cards: readonly Saphea[], id: string, weave: string): Saphea[] {
  const next = sapheaCloth(weave);
  return mapCard(cards, id, (card) => (card.weave === next ? card : { ...card, weave: next, audit: "weave" }));
}

export function setSapheaScribed(cards: readonly Saphea[], id: string, laid: boolean): Saphea[] {
  return mapCard(cards, id, (card) => (card.laid === laid ? card : { ...card, laid, audit: laid ? "set" : "clear" }));
}

export function setSapheaSleeve(cards: readonly Saphea[], id: string, locked: boolean): Saphea[] {
  return mapCard(cards, id, (card) => (card.locked === locked ? card : { ...card, locked, held: locked ? false : card.held, audit: locked ? "sleeve" : "resume" }));
}

export function setSapheaVault(cards: readonly Saphea[], id: string, held: boolean): Saphea[] {
  return mapCard(cards, id, (card) => (card.held === held ? card : { ...card, held, locked: held ? false : card.locked, audit: held ? "vault" : "open" }));
}

export function setSapheaStar(cards: readonly Saphea[], id: string, starred: boolean): Saphea[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addSapheaTag(cards: readonly Saphea[], id: string, tag: string): Saphea[] {
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

function stepPeg(peg: number, dir: 1 | -1): 3 | 6 | 9 {
  const index = pegIndex(peg);
  const next = index < 0 ? 0 : (index + dir + PEG_CYCLE.length) % PEG_CYCLE.length;
  return PEG_CYCLE[next];
}

export function liftLatitude(cards: readonly Saphea[], id: string): Saphea[] {
  return mapCard(cards, id, (card) => ({ ...card, latitude: stepLatitude(card.latitude, 1), audit: "latitude" }));
}

export function lowerLatitude(cards: readonly Saphea[], id: string): Saphea[] {
  return mapCard(cards, id, (card) => ({ ...card, latitude: stepLatitude(card.latitude, -1), audit: "lower" }));
}

export function raisePeg(cards: readonly Saphea[], id: string): Saphea[] {
  return mapCard(cards, id, (card) => ({ ...card, peg: stepPeg(card.peg, 1), audit: "peg" }));
}

export function lowerPeg(cards: readonly Saphea[], id: string): Saphea[] {
  return mapCard(cards, id, (card) => ({ ...card, peg: stepPeg(card.peg, -1), audit: "peg" }));
}

export function setSapheaFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, laid: !card.laid, audit: card.laid ? "clear" : "set" })) : [...cards];
}

export function sleeveSapheaFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return setSapheaSleeve(cards, id, !cards.find((card) => card.id === id)?.locked);
}

export function starSapheaFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return setSapheaStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagSapheaFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return addSapheaTag(cards, id, "c");
}

export function weaveFocused(cards: readonly Saphea[], id: string): Saphea[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSapheaCloth(cards, id, cycleWeave(card.weave)) : [...cards];
}

export function liftLatitudeFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return liftLatitude(cards, id);
}

export function lowerLatitudeFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return lowerLatitude(cards, id);
}

export function raisePegFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return raisePeg(cards, id);
}

export function lowerPegFocused(cards: readonly Saphea[], id: string): Saphea[] {
  return lowerPeg(cards, id);
}

function bulk(cards: readonly Saphea[], ids: readonly string[], edit: (card: Saphea) => Saphea): Saphea[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSapheaFelt(cards: readonly Saphea[], ids: readonly string[]): Saphea[] {
  return bulk(cards, ids, (card) => (card.weave === "FELT" ? card : { ...card, weave: "FELT", audit: "weave" }));
}

export function bulkSapheaScribed(cards: readonly Saphea[], ids: readonly string[]): Saphea[] {
  return bulk(cards, ids, (card) => (card.laid ? card : { ...card, laid: true, audit: "set" }));
}

export function bulkSapheaVault(cards: readonly Saphea[], ids: readonly string[]): Saphea[] {
  return bulk(cards, ids, (card) => (card.held ? card : { ...card, held: true, locked: false, audit: "vault" }));
}

export function bulkSapheaTag(cards: readonly Saphea[], ids: readonly string[]): Saphea[] {
  return bulk(cards, ids, (card) => (card.tags.includes("d") ? card : { ...card, tags: tagsOf([...card.tags, "d"]), audit: "tag" }));
}

export function readSapheaViews(raw: unknown): SapheaView[] {
  if (!Array.isArray(raw)) return [];
  const out: SapheaView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SapheaView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      scribe: clip(row.scribe, 24),
      weave: activeWeave(row.weave, ["SILK", "WOOL", "FELT"]),
      climate: activeClimate(row.climate),
      latitude: activeLatitude(row.latitude),
      peg: activePeg(row.peg),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSapheaView(views: readonly SapheaView[], view: SapheaView): SapheaView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSapheaViews([...views, { ...view, id, name }]);
}

export function dropSapheaView(views: readonly SapheaView[], id: string): SapheaView[] {
  return views.filter((view) => view.id !== id);
}

export function sapheaDensity(raw: unknown): SapheaDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortSapheas(cards: readonly Saphea[], sort: SapheaSort): Saphea[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "scribe") {
      const scribe = a.scribe.localeCompare(b.scribe);
      if (scribe) return scribe;
    } else {
      const climate = climateIndex(a.climate) - climateIndex(b.climate);
      if (climate) return climate;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleSapheas(
  cards: readonly Saphea[],
  tray: SapheaTray,
  query: string,
  scribe: string,
  weave: string,
  climate: string,
  latitude: string,
  peg: string,
): Saphea[] {
  const text = query.trim().toLowerCase();
  const wantScribe = clip(scribe, 24).toLowerCase();
  const wantWeave = weave === "all" ? "" : sapheaCloth(weave);
  const wantClimate = activeClimate(climate);
  const wantLatitude = activeLatitude(latitude);
  const wantPeg = activePeg(peg);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.scribe}`.toLowerCase().includes(text)) return false;
    if (wantScribe && card.scribe.toLowerCase() !== wantScribe) return false;
    if (wantWeave && card.weave !== wantWeave) return false;
    if (wantClimate === "inner" && !sapheaInner(card.climate)) return false;
    if (wantClimate === "outer" && !sapheaOuter(card.climate)) return false;
    if (wantClimate !== "all" && wantClimate !== "inner" && wantClimate !== "outer" && card.climate !== wantClimate) return false;
    if (wantLatitude !== "all" && String(card.latitude ?? "") !== wantLatitude) return false;
    if (wantPeg !== "all" && String(card.peg) !== wantPeg) return false;
    return true;
  });
}

/** An outer climate on peg three, still unscribed and not in the vault, is overdue. */
export function overdueSaphea(card: Saphea): boolean {
  return sapheaOuter(card.climate) && card.peg === 3 && !card.laid && !card.held;
}

/** No weave, the short latitude, peg three, and still in the court. */
export function idleSaphea(card: Saphea): boolean {
  return !card.weave && card.latitude === 15 && card.peg === 3 && !card.laid && !card.locked && !card.held;
}

/** Felt, a tall latitude, and a full peg, still out of the vault. */
export function briskSaphea(card: Saphea): boolean {
  return card.weave === "FELT" && card.latitude === 60 && card.peg === 9 && !card.held;
}

/** Desert, silk, and a middle latitude. */
export function restingSaphea(card: Saphea): boolean {
  return card.climate === "desert" && card.weave === "SILK" && card.latitude === 30;
}

/** A tropic leaf is late when the desk is already on the desert. */
export function lateSaphea(card: Saphea, desk: string): boolean {
  return card.climate === "tropic" && sapheaClimate(desk) === "desert" && !card.laid;
}

export function sapheaCounts(cards: readonly Saphea[], shown: readonly Saphea[], desk: string): SapheaCounts {
  return {
    court: cards.filter((card) => inTray(card, "court")).length,
    sleeve: cards.filter((card) => inTray(card, "sleeve")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    laid: cards.filter((card) => card.laid).length,
    inner: cards.filter((card) => sapheaInner(card.climate)).length,
    outer: cards.filter((card) => sapheaOuter(card.climate)).length,
    wide: cards.filter((card) => card.latitude === 60).length,
    house: cards.filter((card) => houseWeave(card.weave)).length,
    latitude: cards.reduce((sum, card) => sum + (card.latitude || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleSaphea).length,
    brisk: cards.filter(briskSaphea).length,
    resting: cards.filter(restingSaphea).length,
    overdue: cards.filter(overdueSaphea).length,
    pair: cards.filter((card) => pairPeg(card.peg) && lateSaphea(card, desk)).length,
  };
}

export function sapheaBars(cards: readonly Saphea[]): { climate: string; count: number }[] {
  return SPH_CLIMATES.map((climate) => ({ climate, count: cards.filter((card) => card.climate === climate && !card.held).length }));
}

export function sapheaTimeline(cards: readonly Saphea[]): { latitude: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "court"));
  return LATITUDE_CYCLE.map((latitude) => ({ latitude, titles: open.filter((card) => card.latitude === latitude).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function sapheaScribes(cards: readonly Saphea[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.scribe && !out.some((name) => name.toLowerCase() === card.scribe.toLowerCase())) out.push(card.scribe);
  }
  return out;
}

export function busiestScribe(cards: readonly Saphea[]): string {
  const open = cards.filter((card) => inTray(card, "court") && !card.laid && card.scribe);
  let best = "";
  let score = 0;
  for (const name of sapheaScribes(open)) {
    const count = open.filter((card) => card.scribe.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSapheas(cards: readonly Saphea[]): string[] {
  return cards.filter(overdueSaphea).map((card) => card.title);
}

export function sapheaCopy(card: Saphea): string {
  return [card.title, card.scribe, card.climate, card.weave, card.latitude ?? "", card.peg, card.note].filter((item) => item !== "").join(" · ");
}

export function sapheaCsv(cards: readonly Saphea[], desk: string): string {
  const lines = ["title,scribe,climate,weave,latitude,peg,tags,scribed,sleeve,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.scribe),
        card.climate,
        card.weave,
        card.latitude ?? "",
        card.peg,
        card.tags.join(" "),
        card.laid ? "1" : "0",
        card.locked ? "1" : "0",
        card.held ? "1" : "0",
        card.starred ? "1" : "0",
        sapheaOuter(card.climate) ? "1" : "0",
        lateSaphea(card, desk) ? "1" : "0",
        idleSaphea(card) ? "1" : "0",
        briskSaphea(card) ? "1" : "0",
        restingSaphea(card) ? "1" : "0",
        overdueSaphea(card) ? "1" : "0",
        sapheaInner(card.climate) ? "1" : "0",
        houseWeave(card.weave) ? "1" : "0",
        sapheaBand(card.climate),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const CIV_KEY = "crmv4-civic-hide";
export const CIV_REVIEW_KEY = "crmv4-civic-review";

export type CivicLane = "" | "house" | "fort" | "harbor" | "digit" | "spark" | "scroll" | "vowel" | "post";

export type CivicHue = "" | "ivory" | "graphite" | "champagne";

export type CivicState = "" | "clear" | "set";

export type CivicReview = "all" | "reviewed" | "fresh";

export type CivicShape =
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
  | "held"
  | "hyphen"
  | "period";

export type CivicValue = string | { city?: unknown; [key: string]: unknown } | null | undefined;

export type CivicRow = { id: string; label: string; civic: CivicValue };

export type CivicLaneLine = { lane: string; count: number };

const CIVIC_LANES = ["house", "fort", "harbor", "digit", "spark", "scroll", "vowel", "post"] as const;

const CIVIC_HUES = ["champagne", "ivory", "graphite"] as const;

function civicRecord(raw: CivicValue): { city?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function civicBlocked(raw: CivicValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function civicGiven(raw: CivicValue): string {
  const row = civicRecord(raw);
  if (row && !("city" in row)) return "";
  const value = row ? row.city : raw;
  return clip(value, 48);
}

function civicReadable(raw: CivicValue): boolean {
  if (civicBlocked(raw)) return false;
  const row = civicRecord(raw);
  if (row && !("city" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function civicState(raw: CivicValue): CivicState {
  if (!civicReadable(raw)) return "";
  return civicGiven(raw) ? "set" : "clear";
}

/** A house city is Istanbul, London, Berlin, Moscow, or Cairo. A fort contains a hyphen. A harbor has a space. A digit contains a number. A spark is four characters or fewer. A scroll is twelve characters or longer. */
export function civicLane(raw: CivicValue): CivicLane {
  if (civicState(raw) !== "set") return "";
  const text = civicGiven(raw);
  if (HOUSE_CITIES.has(text.toUpperCase())) return "house";
  if (text.includes("-")) return "fort";
  if (text.includes(" ")) return "harbor";
  if (/[0-9]/.test(text)) return "digit";
  if (text.length <= 4) return "spark";
  if (text.length >= 12) return "scroll";
  if (/^[aeiou]/i.test(text)) return "vowel";
  return "post";
}

export function civicHue(raw: CivicValue): CivicHue {
  const lane = civicLane(raw);
  if (!lane) return "";
  if (lane === "house" || lane === "spark") return "champagne";
  if (lane === "harbor" || lane === "fort" || lane === "scroll") return "graphite";
  return "ivory";
}

export function civicHouse(raw: CivicValue): boolean {
  return civicLane(raw) === "house";
}

export function civicFort(raw: CivicValue): boolean {
  return civicLane(raw) === "fort";
}

export function civicHarbor(raw: CivicValue): boolean {
  return civicLane(raw) === "harbor";
}

export function civicDigitLane(raw: CivicValue): boolean {
  return civicLane(raw) === "digit";
}

export function civicSpark(raw: CivicValue): boolean {
  return civicLane(raw) === "spark";
}

export function civicScroll(raw: CivicValue): boolean {
  return civicLane(raw) === "scroll";
}

export function civicVowelLane(raw: CivicValue): boolean {
  return civicLane(raw) === "vowel";
}

export function civicPost(raw: CivicValue): boolean {
  return civicLane(raw) === "post";
}

export function civicOpen(raw: CivicValue): boolean {
  return civicState(raw) === "clear";
}

/** A city the desk can keep without a rewrite: a scroll or a house city. */
export function civicHeld(raw: CivicValue): boolean {
  const lane = civicLane(raw);
  return lane === "scroll" || lane === "house";
}

/** A spark, or a city of two characters or fewer that is not a house, still wants a fuller name. */
export function civicSoon(raw: CivicValue): boolean {
  if (civicState(raw) !== "set") return false;
  if (civicSpark(raw)) return true;
  if (civicHouse(raw)) return false;
  const length = civicGiven(raw).length;
  return length > 0 && length <= 2;
}

export function civicLength(raw: CivicValue): number | null {
  if (civicState(raw) !== "set") return null;
  return civicGiven(raw).length;
}

export function civicEven(raw: CivicValue): boolean {
  const length = civicLength(raw);
  return length !== null && length % 2 === 0;
}

export function civicOdd(raw: CivicValue): boolean {
  const length = civicLength(raw);
  return length !== null && length % 2 === 1;
}

export function civicFirst(raw: CivicValue): boolean {
  return /^[A-Za-z]/.test(civicGiven(raw));
}

export function civicTail(raw: CivicValue): boolean {
  return /[0-9]$/.test(civicGiven(raw));
}

export function civicCapital(raw: CivicValue): boolean {
  return /[A-Z]/.test(civicGiven(raw));
}

export function civicSpace(raw: CivicValue): boolean {
  return civicGiven(raw).includes(" ");
}

export function civicVowel(raw: CivicValue): boolean {
  return /^[aeiou]/i.test(civicGiven(raw));
}

export function civicDigit(raw: CivicValue): boolean {
  return /[0-9]/.test(civicGiven(raw));
}

export function civicLetter(raw: CivicValue): boolean {
  return /[A-Za-z]/.test(civicGiven(raw));
}

export function civicMixed(raw: CivicValue): boolean {
  return civicDigit(raw) && civicLetter(raw);
}

export function civicLower(raw: CivicValue): boolean {
  const text = civicGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is four letters or more, written entirely in capitals. */
export function civicUpper(raw: CivicValue): boolean {
  const text = civicGiven(raw);
  return text.length >= 4 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function civicHyphen(raw: CivicValue): boolean {
  return civicGiven(raw).includes("-");
}

export function civicPeriod(raw: CivicValue): boolean {
  return civicGiven(raw).includes(".");
}

export function civicStamp(raw: CivicValue): string {
  const text = civicGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function civicCopy(raw: CivicValue): string {
  return civicGiven(raw);
}

export function civicFamily(raw: CivicValue): string {
  if (civicState(raw) !== "set") return "";
  return firstToken(civicGiven(raw));
}

export function civicLanes(rows: readonly CivicRow[]): CivicLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of CIVIC_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = civicLane(row.civic);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return CIVIC_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingCivic(rows: readonly CivicRow[]): string {
  const lines = civicLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CIVIC_LANES.indexOf(a.lane as (typeof CIVIC_LANES)[number]) - CIVIC_LANES.indexOf(b.lane as (typeof CIVIC_LANES)[number]))[0].lane;
}

export function leadingCivicHue(rows: readonly CivicRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of CIVIC_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = civicHue(row.civic);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = CIVIC_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || CIVIC_HUES.indexOf(a.hue) - CIVIC_HUES.indexOf(b.hue))[0].hue;
}

export function laneCivicCount(rows: readonly CivicRow[], lane: CivicLane): number {
  return rows.filter((row) => civicLane(row.civic) === lane).length;
}

export function civicShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentCivicLanes(rows: readonly CivicRow[]): string[] {
  return civicLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenCivics(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedCivics(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleCivic(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCivicReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCivicReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCivicLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: CivicRow, shape: CivicShape): boolean {
  if (shape === "all") return true;
  if (shape === "house") return civicHouse(row.civic);
  if (shape === "fort") return civicFort(row.civic);
  if (shape === "harbor") return civicHarbor(row.civic);
  if (shape === "digit") return civicDigitLane(row.civic);
  if (shape === "spark") return civicSpark(row.civic);
  if (shape === "scroll") return civicScroll(row.civic);
  if (shape === "vowel") return civicVowelLane(row.civic);
  if (shape === "post") return civicPost(row.civic);
  if (shape === "open") return civicOpen(row.civic);
  if (shape === "soon") return civicSoon(row.civic);
  if (shape === "letter") return civicLetter(row.civic);
  if (shape === "mixed") return civicMixed(row.civic);
  if (shape === "upper") return civicUpper(row.civic);
  if (shape === "lower") return civicLower(row.civic);
  if (shape === "space") return civicSpace(row.civic);
  if (shape === "even") return civicEven(row.civic);
  if (shape === "odd") return civicOdd(row.civic);
  if (shape === "tail") return civicTail(row.civic);
  if (shape === "first") return civicFirst(row.civic);
  if (shape === "held") return civicHeld(row.civic);
  if (shape === "hyphen") return civicHyphen(row.civic);
  if (shape === "period") return civicPeriod(row.civic);
  return civicLane(row.civic) === shape;
}

export function visibleCivics(
  rows: readonly CivicRow[],
  lane: string,
  hue: string,
  query: string,
  review: CivicReview,
  reviewed: readonly string[],
  shape: CivicShape,
): CivicRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (civicState(row.civic) === "") return false;
    const found = civicLane(row.civic);
    const hueName = civicHue(row.civic);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${civicGiven(row.civic)} ${civicStamp(row.civic)} ${civicFamily(row.civic)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function civicLanesCsv(rows: readonly CivicRow[]): string {
  const lines = ["lane,count"];
  for (const line of civicLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function civicRowsCsv(rows: readonly CivicRow[], reviewed: readonly string[]): string {
  const lines = ["name,city,stamp,family,lane,hue,length,house,fort,harbor,spark,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(civicGiven(row.civic)),
        civicStamp(row.civic),
        csvCell(civicFamily(row.civic)),
        civicLane(row.civic),
        civicHue(row.civic),
        civicLength(row.civic) ?? "",
        civicHouse(row.civic) ? "1" : "0",
        civicFort(row.civic) ? "1" : "0",
        civicHarbor(row.civic) ? "1" : "0",
        civicSpark(row.civic) ? "1" : "0",
        civicEven(row.civic) ? "1" : "0",
        civicDigit(row.civic) ? "1" : "0",
        civicMixed(row.civic) ? "1" : "0",
        civicUpper(row.civic) ? "1" : "0",
        civicVowel(row.civic) ? "1" : "0",
        civicTail(row.civic) ? "1" : "0",
        civicHeld(row.civic) ? "1" : "0",
        civicSoon(row.civic) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
