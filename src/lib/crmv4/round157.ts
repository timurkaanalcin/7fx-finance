/**
 * Local conservatory benches for document review, and last-country plates already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_bench_card (
 *   id text primary key,
 *   note text not null,
 *   gardener text not null default '',
 *   bench integer,
 *   bloom text not null default '',
 *   ribbon text not null default '',
 *   light text not null default '',
 *   pinned boolean not null default false,
 *   rested boolean not null default false,
 *   pressed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_plate_hide (
 *   shelf text primary key
 * );
 */

export const BENCH_KEY = "crmv4-bench-cards";
export const BENCH_VIEW_KEY = "crmv4-bench-views";
export const PLATE_KEY = "crmv4-plate-hide";

export type BenchLight = "blank" | "shade" | "dappled" | "sun";

export type BenchBloom = "blank" | "rose" | "lily" | "fern" | "moss";

export type BenchTray = "open" | "rested" | "pressed";

export type CourtPick = "blank" | "north" | "east" | "south" | "west" | "near" | "far";

export type BenchCard = {
  id: string;
  text: string;
  gardener: string;
  bench: number | null;
  bloom: string;
  ribbon: string;
  light: string;
  pinned: boolean;
  rested: boolean;
  pressed: boolean;
  audit: string;
};

export type BenchView = {
  id: string;
  name: string;
  tray: BenchTray;
  query: string;
  gardener: string;
  bloom: string;
  ribbon: string;
  light: string;
  bench: string;
};

export type BenchCounts = {
  open: number;
  rested: number;
  pressed: number;
  pinned: number;
  late: number;
};

export type PlateShelf = "" | "alpha" | "beta" | "gamma" | "delta" | "other";

export type PlateSpan = "" | "short" | "mid" | "long";

export type PlateFold = "" | "plain" | "joined" | "stacked";

export type PlateValue =
  | {
      lastCountryName?: unknown;
      timezone?: unknown;
      language?: unknown;
      country?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      desk?: unknown;
      address?: unknown;
      city?: unknown;
      firstName?: unknown;
      lastName?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type PlateRow = { lastCountryName?: PlateValue; label?: string | null };

export type ShelfLine = { shelf: string; count: number };

export type PlateSpanLine = { span: string; count: number };

export type PlateFoldLine = { fold: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "rest", "wake", "press", "unpress"] as const;

const BLOOMS = ["rose", "lily", "fern", "moss"] as const;

const LIGHTS = ["shade", "dappled", "sun"] as const;

const LIGHT_ORDER = ["", "shade", "dappled", "sun"] as const;

const PICKS = ["blank", "north", "east", "south", "west", "near", "far"] as const;

const COURTS = ["north", "east", "south", "west"] as const;

const SHELVES = ["alpha", "beta", "gamma", "delta", "other"] as const;

const SPANS = ["", "short", "mid", "long"] as const;

const FOLDS = ["", "plain", "joined", "stacked"] as const;

const PLATE_BLOCK = ["timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BenchTray {
  return raw === "rested" || raw === "pressed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bloomName(raw: unknown): Exclude<BenchBloom, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (BLOOMS as readonly string[]).includes(text) ? (text as Exclude<BenchBloom, "blank">) : "";
}

function lightName(raw: unknown): Exclude<BenchLight, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (LIGHTS as readonly string[]).includes(text) ? (text as Exclude<BenchLight, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function benchText(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank gardener stays blank. It is not filled in. */
export function gardenerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank ribbon stays blank. It is not filled in. */
export function benchRibbon(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A bench is 1 through 24.
 * A blank value stays unset. 0 and 25 are not benches.
 * A leading zero is still a bench: 01 is 1, and 09 is 9.
 * 00 is not a bench.
 */
export function benchOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 24) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|1\d|2[0-4])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Rose, lily, fern, moss, or blank. Anything else is blank. */
export function bloomOf(raw: unknown): BenchBloom {
  return bloomName(raw) || "blank";
}

/** Shade, dappled, sun, or blank. Anything else is blank. */
export function lightOf(raw: unknown): BenchLight {
  return lightName(raw) || "blank";
}

/** North is 1–6. East is 7–12. South is 13–18. West is 19–24. An unset bench is blank. */
export function courtOf(bench: unknown): "blank" | "north" | "east" | "south" | "west" {
  const count = benchOf(bench);
  if (count === null) return "blank";
  if (count <= 6) return "north";
  if (count <= 12) return "east";
  if (count <= 18) return "south";
  return "west";
}

/** Near is 1–12. Far is 13–24. An unset bench is blank. */
export function wingOf(bench: unknown): "blank" | "near" | "far" {
  const count = benchOf(bench);
  if (count === null) return "blank";
  return count <= 12 ? "near" : "far";
}

/** The typed bench minus the slip bench. A positive gap is past the bench. */
export function benchGap(bench: unknown, desk: unknown): number | null {
  const from = benchOf(bench);
  const at = benchOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readBenches(raw: unknown): BenchCard[] {
  if (!Array.isArray(raw)) return [];
  const out: BenchCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BenchCard>;
    const id = String(row.id || "").trim();
    const text = benchText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      gardener: gardenerLabel(row.gardener),
      bench: benchOf(row.bench),
      bloom: bloomName(row.bloom),
      ribbon: benchRibbon(row.ribbon),
      light: lightName(row.light),
      pinned: row.pinned === true,
      rested: row.rested === true,
      pressed: row.pressed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addBench(
  cards: readonly BenchCard[],
  card: { id: string; text: string; gardener?: string; bench?: unknown; bloom?: string; ribbon?: string; light?: string },
): BenchCard[] {
  const current = readBenches(cards);
  const id = String(card.id || "").trim();
  const text = benchText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: BenchCard = {
    id,
    text,
    gardener: gardenerLabel(card.gardener),
    bench: benchOf(card.bench),
    bloom: bloomName(card.bloom),
    ribbon: benchRibbon(card.ribbon),
    light: lightName(card.light),
    pinned: false,
    rested: false,
    pressed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

export function stepBenchLight(cards: readonly BenchCard[], id: string, dir: 1 | -1): BenchCard[] {
  return readBenches(cards).map((card) => {
    if (card.id !== id) return card;
    const at = LIGHT_ORDER.indexOf(card.light as (typeof LIGHT_ORDER)[number]);
    const next = LIGHT_ORDER[Math.min(LIGHTS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.light) return card;
    return { ...card, light: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setBenchPinned(cards: readonly BenchCard[], id: string, pinned: boolean): BenchCard[] {
  return readBenches(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setBenchRested(cards: readonly BenchCard[], id: string, rested: boolean): BenchCard[] {
  return readBenches(cards).map((card) => (card.id === id ? { ...card, rested, audit: rested ? "rest" : "wake" } : card));
}

export function setBenchPressed(cards: readonly BenchCard[], id: string, pressed: boolean): BenchCard[] {
  return readBenches(cards).map((card) => (card.id === id ? { ...card, pressed, audit: pressed ? "press" : "unpress" } : card));
}

/** A blank edit is left out. A duplicate of another bench is left out. */
export function editBench(cards: readonly BenchCard[], id: string, text: string): BenchCard[] {
  const current = readBenches(cards);
  const next = benchText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkBenchPinned(cards: readonly BenchCard[], ids: readonly string[], pinned: boolean): BenchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBenches(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkBenchPressed(cards: readonly BenchCard[], ids: readonly string[], pressed: boolean): BenchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBenches(cards).map((card) => (want.has(card.id) ? { ...card, pressed, audit: pressed ? "press" : "unpress" } : card));
}

export function resetBenches(): BenchCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function benchCopy(raw: unknown): string {
  return benchText(raw);
}

function inTray(card: BenchCard, tray: BenchTray): boolean {
  if (tray === "pressed") return card.pressed;
  if (tray === "rested") return card.rested && !card.pressed;
  return !card.rested && !card.pressed;
}

function benchHit(bench: number | null, exact: number | null, band: CourtPick | null): boolean {
  if (exact !== null) return bench === exact;
  if (band === null) return true;
  if (band === "blank") return bench === null;
  if (band === "near" || band === "far") return wingOf(bench) === band;
  return courtOf(bench) === band;
}

function lightScore(light: string): number {
  if (light === "sun") return 3;
  if (light === "dappled") return 2;
  if (light === "shade") return 1;
  return 0;
}

function shadeLate(card: BenchCard, desk: unknown): boolean {
  const gap = benchGap(card.bench, desk);
  return gap !== null && gap > 0 && card.light === "shade" && inTray(card, "open");
}

/** Search stays on the note. The gardener, the bench, the bloom, the ribbon, and the light are not part of the query. */
export function visibleBenches(
  cards: readonly BenchCard[],
  tray: BenchTray,
  query: string,
  gardener: string | null,
  bloom: BenchBloom | null,
  ribbon: string | null,
  light: BenchLight | null,
  exact: number | null,
  band: CourtPick | null,
  sunOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): BenchCard[] {
  const text = query.trim().toLowerCase();
  const wantGardener = gardener === null ? null : gardenerLabel(gardener);
  const wantRibbon = ribbon === null ? null : benchRibbon(ribbon);
  return readBenches(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (sunOnly && card.light !== "sun") return false;
      if (wantGardener !== null && gardenerLabel(card.gardener) !== wantGardener) return false;
      if (bloom !== null && bloomOf(card.bloom) !== bloom) return false;
      if (wantRibbon !== null && benchRibbon(card.ribbon) !== wantRibbon) return false;
      if (light !== null && lightOf(card.light) !== light) return false;
      if (!benchHit(card.bench, exact, band)) return false;
      if (lateOnly && !shadeLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (lightScore(a.light) !== lightScore(b.light)) return lightScore(b.light) - lightScore(a.light);
      return a.text.localeCompare(b.text);
    });
}

/** The bench orders the desk. An unset bench stays at the end. Search stays on the note. */
export function benchTimeline(cards: readonly BenchCard[], query: string): BenchCard[] {
  const text = query.trim().toLowerCase();
  return readBenches(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.bench === null && b.bench !== null) return 1;
      if (a.bench !== null && b.bench === null) return -1;
      if (a.bench !== null && b.bench !== null && a.bench !== b.bench) return a.bench - b.bench;
      return a.text.localeCompare(b.text);
    });
}

export function benchCounts(cards: readonly BenchCard[], desk: unknown): BenchCounts {
  const rows = readBenches(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    rested: rows.filter((card) => inTray(card, "rested")).length,
    pressed: rows.filter((card) => inTray(card, "pressed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => shadeLate(card, desk)).length,
  };
}

/** Share of the saved benches. A zero total stays at zero. */
export function benchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function benchGardeners(cards: readonly BenchCard[]): string[] {
  const out: string[] = [];
  for (const card of readBenches(cards)) {
    if (card.gardener && !out.includes(card.gardener)) out.push(card.gardener);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function benchRibbons(cards: readonly BenchCard[]): string[] {
  const out: string[] = [];
  for (const card of readBenches(cards)) {
    if (card.ribbon && !out.includes(card.ribbon)) out.push(card.ribbon);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function benchBlooms(cards: readonly BenchCard[]): Exclude<BenchBloom, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBenches(cards)) if (card.bloom) seen.add(card.bloom);
  return BLOOMS.filter((bloom) => seen.has(bloom));
}

export function benchLights(cards: readonly BenchCard[]): Exclude<BenchLight, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBenches(cards)) if (card.light) seen.add(card.light);
  return LIGHTS.filter((light) => seen.has(light));
}

/** Four courts. Index 0 is north. Index 3 is west. */
export function courtCounts(cards: readonly BenchCard[]): number[] {
  const rows = readBenches(cards);
  return COURTS.map((band) => rows.filter((card) => courtOf(card.bench) === band).length);
}

/** "all" and "blank" stay. A gardener that is no longer on a bench falls back to all. */
export function activeGardener(filter: string, gardeners: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const gardener = gardenerLabel(filter);
  return gardener && gardeners.includes(gardener) ? gardener : "all";
}

export function gardenerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return gardenerLabel(filter);
}

/** "all" and "blank" stay. A bloom that is no longer on a bench falls back to all. */
export function activeBloom(filter: string, blooms: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bloom = bloomName(filter);
  return bloom && blooms.includes(bloom) ? bloom : "all";
}

export function bloomArg(filter: string): BenchBloom | null {
  if (filter === "blank") return "blank";
  return bloomName(filter) || null;
}

/** "all" and "blank" stay. A ribbon that is no longer on a bench falls back to all. */
export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = benchRibbon(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return benchRibbon(filter);
}

/** "all" and "blank" stay. A light that is no longer on a bench falls back to all. */
export function activeLight(filter: string, lights: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const light = lightName(filter);
  return light && lights.includes(light) ? light : "all";
}

export function lightArg(filter: string): BenchLight | null {
  if (filter === "blank") return "blank";
  return lightName(filter) || null;
}

/** All, blank, the four courts, the two wings, and the benches 1 through 24 stay. Anything else is all. */
export function activeBench(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bench = benchOf(filter);
  return bench === null ? "all" : String(bench);
}

export function benchArg(filter: string): { exact: number | null; band: CourtPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as CourtPick };
  const bench = benchOf(filter);
  return bench === null ? { exact: null, band: null } : { exact: bench, band: null };
}

/** Other benches with the same bloom and the same ribbon. A blank bloom or a blank ribbon clashes with nothing. */
export function benchClashIds(cards: readonly BenchCard[], id: string): string[] {
  const rows = readBenches(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.bloom || !card.ribbon) return [];
  return rows
    .filter((item) => item.id !== id && item.bloom === card.bloom && item.ribbon === card.ribbon)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved benches share a bloom and a ribbon with another bench. */
export function clashBenchCount(cards: readonly BenchCard[]): number {
  const rows = readBenches(cards);
  return rows.filter((card) => benchClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open bench at or after the bench you type, skipping sun.
 * After the last bench, the desk wraps to the earliest open bench that is not sun.
 */
export function nextBench(cards: readonly BenchCard[], desk: unknown): string {
  const now = benchOf(desk);
  if (now === null) return "";
  const waiting = readBenches(cards).filter((card) => inTray(card, "open") && card.bench !== null && card.light !== "sun");
  if (!waiting.length) return "";
  const byBench = (a: BenchCard, b: BenchCard) => (a.bench ?? 0) - (b.bench ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.bench ?? 0) >= now).sort(byBench);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBench)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the benches saved in this browser. The gap uses the bench you pass. */
export function benchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,gardener,bench,bloom,ribbon,light,court,pinned,rested,pressed,gap,audit"];
  for (const card of readBenches(raw)) {
    const gap = benchGap(card.bench, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.gardener),
      card.bench === null ? "" : String(card.bench),
      card.bloom,
      csvCell(card.ribbon),
      card.light,
      courtOf(card.bench),
      card.pinned ? "1" : "0",
      card.rested ? "1" : "0",
      card.pressed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function gardenerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return gardenerLabel(raw) || "all";
}

function bloomSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bloomName(raw) || "all";
}

function ribbonSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return benchRibbon(raw) || "all";
}

function lightSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return lightName(raw) || "all";
}

export function readBenchViews(raw: unknown): BenchView[] {
  if (!Array.isArray(raw)) return [];
  const out: BenchView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BenchView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 48),
      gardener: gardenerSlot(row.gardener),
      bloom: bloomSlot(row.bloom),
      ribbon: ribbonSlot(row.ribbon),
      light: lightSlot(row.light),
      bench: activeBench(String(row.bench ?? "")),
    });
  }
  return out.slice(0, 4);
}

export function addBenchView(
  views: readonly BenchView[],
  view: { id: string; name: string; tray: BenchTray; query: string; gardener: string; bloom: string; ribbon: string; light: string; bench: string },
): BenchView[] {
  const current = readBenchViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 48),
    gardener: gardenerSlot(view.gardener),
    bloom: bloomSlot(view.bloom),
    ribbon: ribbonSlot(view.ribbon),
    light: lightSlot(view.light),
    bench: activeBench(view.bench),
  }].slice(0, 4);
}

export function dropBenchView(views: readonly BenchView[], id: string): BenchView[] {
  return readBenchViews(views).filter((view) => view.id !== id);
}

function resolvedPlate(value: PlateValue): string {
  if (typeof value === "string") return clip(value, 48);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (PLATE_BLOCK.some((key) => key in value)) return "";
  return clip(value.lastCountryName, 48);
}

/**
 * A last country name from the last-country field, or blank.
 * A timezone, a language, a country code, a name, an email, a phone, a desk, an address, a city, a given name, and a family name are not a plate.
 * A missing last country stays unmarked and is not filled in.
 */
export function assignedPlate(value: PlateValue): string {
  return resolvedPlate(value);
}

/** Alpha is A–F. Beta is G–M. Gamma is N–S. Delta is T–Z. A letter outside A–Z is other. Anything else is blank. */
export function shelfOf(value: PlateValue): PlateShelf {
  const name = resolvedPlate(value);
  if (!name) return "";
  const first = name.charAt(0);
  if (/[A-Za-z]/.test(first)) {
    const letter = first.toLowerCase();
    if (letter <= "f") return "alpha";
    if (letter <= "m") return "beta";
    if (letter <= "s") return "gamma";
    return "delta";
  }
  if (first.charCodeAt(0) > 127) return "other";
  return "";
}

/** Short is 1–6 characters. Mid is 7–12. Long is 13 or more. An unmarked name stays blank. */
export function spanOf(value: PlateValue): PlateSpan {
  const name = resolvedPlate(value);
  if (!name || shelfOf(value) === "") return "";
  if (name.length <= 6) return "short";
  if (name.length <= 12) return "mid";
  return "long";
}

/** Plain is one word. Joined is two words or a hyphen. Stacked is three or more words. An unmarked name stays blank. */
export function foldOf(value: PlateValue): PlateFold {
  const name = resolvedPlate(value);
  if (!name || shelfOf(value) === "") return "";
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 3) return "stacked";
  if (words.length === 2 || name.includes("-")) return "joined";
  return "plain";
}

export function shelfLines(rows: readonly PlateRow[]): ShelfLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const shelf = shelfOf(row.lastCountryName);
    map.set(shelf, (map.get(shelf) || 0) + 1);
  }
  const out: ShelfLine[] = [];
  for (const shelf of ["", ...SHELVES]) {
    const count = map.get(shelf);
    if (count) out.push({ shelf, count });
  }
  return out;
}

export function namedShelves(rows: readonly PlateRow[]): string[] {
  return shelfLines(rows).map((line) => line.shelf).filter(Boolean);
}

export function spanLines(rows: readonly PlateRow[]): PlateSpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = spanOf(row.lastCountryName);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: PlateSpanLine[] = [];
  for (const span of SPANS) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly PlateRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function foldLines(rows: readonly PlateRow[]): PlateFoldLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const fold = foldOf(row.lastCountryName);
    map.set(fold, (map.get(fold) || 0) + 1);
  }
  const out: PlateFoldLine[] = [];
  for (const fold of FOLDS) {
    const count = map.get(fold);
    if (count) out.push({ fold, count });
  }
  return out;
}

export function namedFolds(rows: readonly PlateRow[]): string[] {
  return foldLines(rows).map((line) => line.fold).filter(Boolean);
}

/** The shelf with the most loaded rows. A tie keeps the earlier shelf. An unmarked name is not a lead. */
export function leadingShelf(rows: readonly PlateRow[]): string {
  const named = shelfLines(rows).filter((line) => line.shelf);
  if (!named.length) return "";
  const order = (shelf: string) => SHELVES.indexOf(shelf as (typeof SHELVES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.shelf) - order(b.shelf))[0].shelf;
}

/** The named fold with the most loaded rows. A tie keeps the earlier fold. A blank fold is not a lead. */
export function leadingFold(rows: readonly PlateRow[]): string {
  const named = foldLines(rows).filter((line) => line.fold);
  if (!named.length) return "";
  const order = (fold: string) => FOLDS.indexOf(fold as (typeof FOLDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.fold) - order(b.fold))[0].fold;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function plateShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenShelves(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 16).toLowerCase();
    if (!(SHELVES as readonly string[]).includes(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleShelf(hidden: readonly string[], shelf: string, present: readonly string[]): string[] {
  const mark = (SHELVES as readonly string[]).includes(shelf) ? shelf : shelfOf(shelf);
  if (!mark || !present.includes(mark)) return readHiddenShelves(hidden, present);
  const current = readHiddenShelves(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleShelves(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenShelves(hidden, present));
  return present.filter((shelf) => (showHidden ? gone.has(shelf) : !gone.has(shelf)));
}

/** "all" and "blank" stay. A shelf that is no longer loaded falls back to all. */
export function activeShelf(filter: string, shelves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shelf = (SHELVES as readonly string[]).includes(filter) ? filter : shelfOf(filter);
  return shelf && shelves.includes(shelf) ? shelf : "all";
}

export function shelfArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (SHELVES as readonly string[]).includes(filter) ? filter : null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): PlateSpan | null {
  if (filter === "blank") return "";
  if ((SPANS as readonly string[]).includes(filter) && filter !== "") return filter as PlateSpan;
  return null;
}

/** "all" and "blank" stay. A fold that is no longer loaded falls back to all. */
export function activeFold(filter: string, folds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (FOLDS as readonly string[]).includes(filter) && folds.includes(filter) ? filter : "all";
}

export function foldArg(filter: string): PlateFold | null {
  if (filter === "blank") return "";
  if ((FOLDS as readonly string[]).includes(filter) && filter !== "") return filter as PlateFold;
  return null;
}

/** Search stays on the name. The last country is not part of the query. */
export function visiblePlateCustomers<T extends PlateRow>(
  rows: readonly T[],
  shelf: string | null,
  fold: PlateFold | null,
  span: PlateSpan | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (shelf !== null && shelfOf(row.lastCountryName) !== shelf) return false;
    if (fold !== null && foldOf(row.lastCountryName) !== fold) return false;
    if (span !== null && spanOf(row.lastCountryName) !== span) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the shelves, spans, and folds on this page. */
export function platesCsv(rows: readonly PlateRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of shelfLines(rows)) lines.push(["shelf", csvCell(line.shelf), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", line.span, String(line.count)].join(","));
  for (const line of foldLines(rows)) lines.push(["fold", line.fold, String(line.count)].join(","));
  return lines.join("\n");
}
