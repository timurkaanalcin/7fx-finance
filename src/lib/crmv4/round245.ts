/**
 * Orchard benches for a conservatory's care visits, and meridian marks already stored as a trader timezone.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_orchard_bench (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   gardener text not null default '',
 *   season text not null default '',
 *   soil text not null default '',
 *   bloom text not null default '',
 *   water_min integer,
 *   height integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   shade boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_meridian_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_meridian_review (
 *   trader_id text primary key
 * );
 */

export const ORB_KEY = "crmv4-orchard-bench";
export const ORB_VIEW_KEY = "crmv4-orchard-views";
export const ORB_DENSITY_KEY = "crmv4-orchard-density";
export const MRD_KEY = "crmv4-meridian-hide";
export const MRD_REVIEW_KEY = "crmv4-meridian-review";

export const ORCHARD_SEASONS = ["bud", "leaf", "fruit", "rain", "frost", "bloom"] as const;

export type OrchardSeason = (typeof ORCHARD_SEASONS)[number];

export type SoilName = "blank" | "loam" | "clay" | "sand";

export type BloomName = "blank" | "bud" | "open" | "spent";

export type BenchTray = "open" | "held" | "archived";

export type BenchDensity = "airy" | "tight";

export type BenchSort = "season" | "gardener";

export type OrchardBench = {
  id: string;
  title: string;
  note: string;
  gardener: string;
  season: string;
  water: number | null;
  soil: string;
  bloom: string;
  height: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  shade: boolean;
  audit: string;
};

export type OrchardView = {
  id: string;
  name: string;
  tray: BenchTray;
  query: string;
  gardener: string;
  soil: string;
  bloom: string;
  season: string;
  water: string;
  height: string;
};

export type BenchCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  height: number;
  house: number;
  water: number;
  matched: number;
  shade: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type MeridianLane = "" | "deep" | "score" | "dash" | "mark" | "hush" | "trio" | "pair" | "long";

export type MeridianHue = "" | "gilt" | "slate" | "sand" | "clay" | "soot" | "pearl" | "mist";

export type MeridianState = "" | "clear" | "set";

export type MeridianShape = "all" | "deep" | "wide" | "bound" | "notch" | "score";

export type MeridianReview = "all" | "reviewed" | "fresh";

export type MeridianValue = string | { zone?: unknown; timezone?: unknown; city?: unknown; [key: string]: unknown } | null | undefined;

export type MeridianRow = { id: string; label: string; note: MeridianValue };

export type MeridianLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "bloom", "pin", "unpin", "hold", "resume", "archive", "open", "soil", "tag", "height", "water", "short", "shade"] as const;

const SOILS = ["loam", "clay", "sand"] as const;

const BLOOMS = ["bud", "open", "spent"] as const;

const BLOOM_CYCLE = ["bud", "open", "spent"] as const;

const HEIGHT_CYCLE = [1, 2, 3, 4] as const;

const WATERS = [10, 20, 40] as const;

const PEAK = new Set(["bud", "bloom"]);

const QUIET = new Set(["frost"]);

const HOUSE = new Set(["LOAM", "SAND"]);

const EARLY = new Set(["bud", "leaf"]);

const MID = new Set(["fruit", "rain"]);

const LATE = new Set(["frost", "bloom"]);

const LANE_ORDER = ["deep", "score", "dash", "mark", "hush", "trio", "pair", "long"] as const;

const HUE_ORDER = ["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const BENCH_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BenchTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function soilName(raw: unknown): Exclude<SoilName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SOILS as readonly string[]).includes(text) ? (text as Exclude<SoilName, "blank">) : "";
}

function bloomName(raw: unknown): Exclude<BloomName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (BLOOMS as readonly string[]).includes(text) ? (text as Exclude<BloomName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pqr]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(bench: OrchardBench, tray: BenchTray): boolean {
  if (tray === "held") return bench.held && !bench.archived;
  if (tray === "archived") return bench.archived;
  return !bench.held && !bench.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function seasonIndex(season: string): number {
  return ORCHARD_SEASONS.indexOf(season as OrchardSeason);
}

function heightIndex(height: number): number {
  return HEIGHT_CYCLE.indexOf(height as (typeof HEIGHT_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function benchLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function benchNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A season outside the six conservatory seasons is left blank. */
export function seasonOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (ORCHARD_SEASONS as readonly string[]).includes(text) ? text : "";
}

/** The water timer is 10, 20, or 40 minutes. Anything else stays blank. */
export function waterOf(raw: unknown): 10 | 20 | 40 | null {
  const text = clip(raw, 2);
  const value = Number(text);
  return (WATERS as readonly number[]).includes(value) ? (value as 10 | 20 | 40) : null;
}

/** Height is 1, 2, 3, or 4. Anything else stays blank. */
export function heightOf(raw: unknown): 1 | 2 | 3 | 4 | null {
  const value = Number(clip(raw, 1));
  return (HEIGHT_CYCLE as readonly number[]).includes(value) ? (value as 1 | 2 | 3 | 4) : null;
}

/** Soil is loam, clay, or sand. The saved soil is LOAM, CLAY, or SAND. */
export function soilOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "loam") return "LOAM";
  if (text === "clay") return "CLAY";
  if (text === "sand") return "SAND";
  return "";
}

/** Bloom is bud, open, or spent. A blank bloom stays blank. */
export function bloomOf(raw: unknown): string {
  return bloomName(raw);
}

export function peakSeason(season: unknown): boolean {
  return PEAK.has(seasonOf(season));
}

export function quietSeason(season: unknown): boolean {
  return QUIET.has(seasonOf(season));
}

/** Early is bud and leaf. Mid is fruit and rain. Late is frost and bloom. */
export function seasonBand(season: unknown): "early" | "mid" | "late" | "" {
  const name = seasonOf(season);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the bench season to the desk season. A blank season has no gap. */
export function seasonGap(benchSeason: unknown, deskSeason: unknown): number | null {
  const from = seasonIndex(seasonOf(benchSeason));
  const to = seasonIndex(seasonOf(deskSeason));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseSoil(soil: unknown): boolean {
  return HOUSE.has(soilOf(soil));
}

export function activeSeason(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return seasonOf(text) || "all";
}

export function activeWater(raw: unknown): string {
  const value = waterOf(raw);
  return value === null ? "all" : String(value);
}

export function activeBloom(raw: unknown, blooms: readonly string[]): string {
  const bloom = bloomOf(raw);
  return bloom && blooms.includes(bloom) ? bloom : "all";
}

export function activeHeight(raw: unknown): string {
  const value = heightOf(raw);
  return value === null ? "all" : String(value);
}

export function activeSoil(raw: unknown): string {
  const name = soilName(raw);
  return name || "all";
}

export function moveOrchardFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestSoil(benches: readonly OrchardBench[]): string {
  const counts = new Map<string, number>();
  for (const bench of benches) {
    if (!bench.soil) continue;
    counts.set(bench.soil, (counts.get(bench.soil) || 0) + 1);
  }
  let best = "LOAM";
  let score = 0;
  for (const soil of ["LOAM", "CLAY", "SAND"]) {
    const count = counts.get(soil) || 0;
    if (count > score) {
      best = soil;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short water. An evening desk asks for a long one. A tie among saved benches keeps 20. */
export function suggestWater(benches: readonly OrchardBench[], hour: number): 10 | 20 | 40 {
  const counts = new Map<number, number>();
  for (const bench of benches) {
    if (bench.water === null) continue;
    counts.set(bench.water, (counts.get(bench.water) || 0) + 1);
  }
  let best: 10 | 20 | 40 | null = null;
  let score = 0;
  for (const water of WATERS) {
    const count = counts.get(water) || 0;
    if (count > score) {
      best = water;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 10;
  if (hour >= 18) return 40;
  return 20;
}

/** The gardener with the fewest open benches. A tie keeps the roster order. */
export function fairGardener(benches: readonly OrchardBench[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = benches.filter((bench) => inTray(bench, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((bench) => bench.gardener.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readOrchardBenches(raw: unknown): OrchardBench[] {
  if (!Array.isArray(raw)) return [];
  const out: OrchardBench[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrchardBench>;
    const id = clip(row.id, 40);
    const title = benchLine(row.title);
    if (!id || !title || out.some((bench) => bench.id === id || bench.title === title)) continue;
    out.push({
      id,
      title,
      note: benchNote(row.note),
      gardener: clip(row.gardener, 24),
      season: seasonOf(row.season),
      water: waterOf(row.water),
      soil: soilOf(row.soil),
      bloom: bloomOf(row.bloom),
      height: heightOf(row.height) ?? 1,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      shade: row.shade === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, BENCH_CAP);
}

export function addOrchardBench(
  benches: readonly OrchardBench[],
  bench: {
    id: string;
    title: string;
    note?: string;
    gardener?: string;
    season?: unknown;
    soil?: string;
    bloom?: string;
    water?: unknown;
    height?: unknown;
    tags?: unknown;
  },
): OrchardBench[] {
  const current = readOrchardBenches(benches);
  const id = clip(bench.id, 40);
  const title = benchLine(bench.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: OrchardBench = {
    id,
    title,
    note: benchNote(bench.note),
    gardener: clip(bench.gardener, 24),
    season: seasonOf(bench.season),
    water: waterOf(bench.water),
    soil: soilOf(bench.soil),
    bloom: bloomOf(bench.bloom),
    height: heightOf(bench.height) ?? 1,
    tags: tagsOf(bench.tags),
    pinned: false,
    held: false,
    archived: false,
    shade: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BENCH_CAP);
}

function mapBench(benches: readonly OrchardBench[], id: string, change: (bench: OrchardBench) => OrchardBench): OrchardBench[] {
  return readOrchardBenches(benches).map((bench) => (bench.id === id ? change(bench) : bench));
}

export function editOrchard(benches: readonly OrchardBench[], id: string, title: string): OrchardBench[] {
  const next = benchLine(title);
  if (!next) return readOrchardBenches(benches);
  return mapBench(benches, id, (bench) => (bench.title === next ? bench : { ...bench, title: next, audit: "edit" }));
}

export function editOrchardNote(benches: readonly OrchardBench[], id: string, note: string): OrchardBench[] {
  const next = benchNote(note);
  return mapBench(benches, id, (bench) => (bench.note === next ? bench : { ...bench, note: next, audit: "note" }));
}

export function setBenchPin(benches: readonly OrchardBench[], id: string, pinned: boolean): OrchardBench[] {
  return mapBench(benches, id, (bench) => (bench.pinned === pinned ? bench : { ...bench, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setBenchHold(benches: readonly OrchardBench[], id: string, held: boolean): OrchardBench[] {
  return mapBench(benches, id, (bench) => (bench.held === held || bench.archived ? bench : { ...bench, held, audit: held ? "hold" : "resume" }));
}

export function setBenchArchive(benches: readonly OrchardBench[], id: string, archived: boolean): OrchardBench[] {
  return mapBench(benches, id, (bench) => (bench.archived === archived ? bench : { ...bench, archived, held: archived ? false : bench.held, audit: archived ? "archive" : "open" }));
}

export function setBenchShade(benches: readonly OrchardBench[], id: string, shade: boolean): OrchardBench[] {
  return mapBench(benches, id, (bench) => (bench.shade === shade ? bench : { ...bench, shade, audit: "shade" }));
}

export function setBenchHeight(benches: readonly OrchardBench[], id: string, height: unknown): OrchardBench[] {
  const next = heightOf(height);
  if (next === null) return readOrchardBenches(benches);
  return mapBench(benches, id, (bench) => (bench.height === next ? bench : { ...bench, height: next, audit: "height" }));
}

export function setBenchSoil(benches: readonly OrchardBench[], id: string, soil: unknown): OrchardBench[] {
  const next = soilOf(soil);
  if (!next) return readOrchardBenches(benches);
  return mapBench(benches, id, (bench) => (bench.soil === next ? bench : { ...bench, soil: next, audit: "soil" }));
}

/** Bloom steps bud, open, spent, then bud again. A blank bloom starts at bud. */
export function cycleBloom(benches: readonly OrchardBench[], id: string): OrchardBench[] {
  return mapBench(benches, id, (bench) => {
    const at = BLOOM_CYCLE.indexOf(bench.bloom as (typeof BLOOM_CYCLE)[number]);
    const next = at < 0 ? BLOOM_CYCLE[0] : BLOOM_CYCLE[(at + 1) % BLOOM_CYCLE.length];
    return next === bench.bloom ? bench : { ...bench, bloom: next, audit: "bloom" };
  });
}

export function addOrchardTag(benches: readonly OrchardBench[], id: string, tag: string): OrchardBench[] {
  const next = tagsOf(tag)[0];
  if (!next) return readOrchardBenches(benches);
  return mapBench(benches, id, (bench) => {
    if (bench.tags.includes(next) || bench.tags.length >= TAG_CAP) return bench;
    return { ...bench, tags: [...bench.tags, next], audit: "tag" };
  });
}

/** A blank water becomes 10, 10 becomes 20, and 20 becomes 40. A water of 40 stays. */
export function lengthenWater(benches: readonly OrchardBench[], id: string): OrchardBench[] {
  return mapBench(benches, id, (bench) => {
    if (bench.water === 40) return bench;
    const next = bench.water === 20 ? 40 : bench.water === 10 ? 20 : 10;
    return { ...bench, water: next, audit: "water" };
  });
}

/** A blank water becomes 40, 40 becomes 20, and 20 becomes 10. A water of 10 stays. */
export function shortenWater(benches: readonly OrchardBench[], id: string): OrchardBench[] {
  return mapBench(benches, id, (bench) => {
    if (bench.water === 10) return bench;
    const next = bench.water === 20 ? 10 : bench.water === 40 ? 20 : 40;
    return { ...bench, water: next, audit: "short" };
  });
}

export function raiseHeight(benches: readonly OrchardBench[], id: string): OrchardBench[] {
  return mapBench(benches, id, (bench) => {
    const at = heightIndex(bench.height);
    const next = at < 0 ? HEIGHT_CYCLE[0] : HEIGHT_CYCLE[(at + 1) % HEIGHT_CYCLE.length];
    return next === bench.height ? bench : { ...bench, height: next, audit: "height" };
  });
}

export function lowerHeight(benches: readonly OrchardBench[], id: string): OrchardBench[] {
  return mapBench(benches, id, (bench) => {
    const at = heightIndex(bench.height);
    const next = at < 0 ? HEIGHT_CYCLE[0] : HEIGHT_CYCLE[(at + HEIGHT_CYCLE.length - 1) % HEIGHT_CYCLE.length];
    return next === bench.height ? bench : { ...bench, height: next, audit: "height" };
  });
}

function focusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench | undefined {
  const id = shownIds[index];
  return id ? readOrchardBenches(benches).find((item) => item.id === id) : undefined;
}

export function pinFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const bench = focusedBench(benches, shownIds, index);
  if (!bench) return readOrchardBenches(benches);
  return setBenchPin(benches, bench.id, !bench.pinned);
}

export function holdFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const bench = focusedBench(benches, shownIds, index);
  if (!bench) return readOrchardBenches(benches);
  return setBenchHold(benches, bench.id, !bench.held);
}

export function bloomFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const id = shownIds[index];
  return id ? cycleBloom(benches, id) : readOrchardBenches(benches);
}

export function shadeFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const bench = focusedBench(benches, shownIds, index);
  if (!bench) return readOrchardBenches(benches);
  return setBenchShade(benches, bench.id, !bench.shade);
}

export function tagFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number, tag: string): OrchardBench[] {
  const id = shownIds[index];
  return id ? addOrchardTag(benches, id, tag) : readOrchardBenches(benches);
}

export function raiseFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const id = shownIds[index];
  return id ? raiseHeight(benches, id) : readOrchardBenches(benches);
}

export function lowerFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const id = shownIds[index];
  return id ? lowerHeight(benches, id) : readOrchardBenches(benches);
}

export function lengthenFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const id = shownIds[index];
  return id ? lengthenWater(benches, id) : readOrchardBenches(benches);
}

export function shortenFocusedBench(benches: readonly OrchardBench[], shownIds: readonly string[], index: number): OrchardBench[] {
  const id = shownIds[index];
  return id ? shortenWater(benches, id) : readOrchardBenches(benches);
}

function touchIds(benches: readonly OrchardBench[], ids: readonly string[], change: (bench: OrchardBench) => OrchardBench): OrchardBench[] {
  const want = new Set(ids);
  return readOrchardBenches(benches).map((bench) => (want.has(bench.id) ? change(bench) : bench));
}

export function bulkOrchardPin(benches: readonly OrchardBench[], ids: readonly string[]): OrchardBench[] {
  return touchIds(benches, ids, (bench) => (bench.pinned ? bench : { ...bench, pinned: true, audit: "pin" }));
}

export function bulkOrchardArchive(benches: readonly OrchardBench[], ids: readonly string[]): OrchardBench[] {
  return touchIds(benches, ids, (bench) => (bench.archived ? bench : { ...bench, archived: true, held: false, audit: "archive" }));
}

export function bulkOrchardBloom(benches: readonly OrchardBench[], ids: readonly string[]): OrchardBench[] {
  return touchIds(benches, ids, (bench) => (bench.bloom === "spent" ? bench : { ...bench, bloom: "spent", audit: "bloom" }));
}

export function bulkOrchardTag(benches: readonly OrchardBench[], ids: readonly string[], tag: string): OrchardBench[] {
  const next = tagsOf(tag)[0];
  if (!next) return readOrchardBenches(benches);
  return touchIds(benches, ids, (bench) => (bench.tags.includes(next) || bench.tags.length >= TAG_CAP ? bench : { ...bench, tags: [...bench.tags, next], audit: "tag" }));
}

export function bulkOrchardSoil(benches: readonly OrchardBench[], ids: readonly string[], soil: unknown): OrchardBench[] {
  const next = soilOf(soil);
  if (!next) return readOrchardBenches(benches);
  return touchIds(benches, ids, (bench) => (bench.soil === next ? bench : { ...bench, soil: next, audit: "soil" }));
}

export function readOrchardViews(raw: unknown): OrchardView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrchardView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrchardView>;
    const id = clip(row.id, 40);
    const name = benchLine(row.name);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      gardener: clip(row.gardener, 24),
      soil: activeSoil(row.soil),
      bloom: activeBloom(row.bloom, BLOOMS),
      season: activeSeason(row.season),
      water: activeWater(row.water),
      height: activeHeight(row.height),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addOrchardView(views: readonly OrchardView[], view: OrchardView): OrchardView[] {
  const current = readOrchardViews(views);
  const id = clip(view.id, 40);
  const name = benchLine(view.name);
  if (!id || !name || current.some((item) => item.id === id)) return current;
  return [{
    ...view,
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    gardener: clip(view.gardener, 24),
    soil: activeSoil(view.soil),
    bloom: activeBloom(view.bloom, BLOOMS),
    season: activeSeason(view.season),
    water: activeWater(view.water),
    height: activeHeight(view.height),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropOrchardView(views: readonly OrchardView[], id: string): OrchardView[] {
  return readOrchardViews(views).filter((view) => view.id !== id);
}

export function orchardDensity(raw: unknown): BenchDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function orchardSort(raw: unknown): BenchSort {
  return raw === "gardener" ? "gardener" : "season";
}

export function lateBench(bench: OrchardBench, deskSeason: unknown): boolean {
  const gap = seasonGap(bench.season, deskSeason);
  return gap !== null && gap > 0;
}

export function idleBench(bench: OrchardBench): boolean {
  return bench.bloom === "spent" && quietSeason(bench.season) && bench.height === 1;
}

export function rushBench(bench: OrchardBench): boolean {
  return bench.height === 3 && bench.bloom === "bud" && peakSeason(bench.season);
}

export function restingBench(bench: OrchardBench): boolean {
  return bench.water === 40 && bench.bloom === "open" && !bench.shade;
}

/** A ten-minute water on a peak season is overdue unless the bench is pinned. */
export function overdueBench(bench: OrchardBench): boolean {
  return bench.water === 10 && peakSeason(bench.season) && !bench.pinned;
}

export function visibleOrchard(
  benches: readonly OrchardBench[],
  tray: BenchTray,
  query: string,
  gardener: string,
  soil: string,
  bloom: string,
  season: string,
  water: string,
  height: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): OrchardBench[] {
  const text = query.trim().toLowerCase();
  const gardenerOn = gardener === "all" ? "" : gardener.trim().toLowerCase();
  const soilOn = soil === "all" ? "" : soilOf(soil);
  const bloomOn = bloom === "all" ? "" : bloomOf(bloom);
  const seasonOn = season === "all" ? "" : activeSeason(season);
  const waterOn = water === "all" ? "" : activeWater(water);
  const heightOn = height === "all" ? "" : activeHeight(height);
  return readOrchardBenches(benches).filter((bench) => {
    if (!inTray(bench, tray)) return false;
    if (text && !`${bench.title} ${bench.note}`.toLowerCase().includes(text)) return false;
    if (gardenerOn && bench.gardener.toLowerCase() !== gardenerOn) return false;
    if (soilOn && bench.soil !== soilOn) return false;
    if (bloomOn && bench.bloom !== bloomOn) return false;
    if (seasonOn === "peak" && !peakSeason(bench.season)) return false;
    if (seasonOn === "quiet" && !quietSeason(bench.season)) return false;
    if (seasonOn && seasonOn !== "peak" && seasonOn !== "quiet" && bench.season !== seasonOn) return false;
    if (waterOn && String(bench.water ?? "") !== waterOn) return false;
    if (heightOn && String(bench.height) !== heightOn) return false;
    if (houseOnly && !houseSoil(bench.soil)) return false;
    if (peakOnly && !peakSeason(bench.season)) return false;
    if (quietOnly && !quietSeason(bench.season)) return false;
    return true;
  });
}

export function sortOrchard(benches: readonly OrchardBench[], sort: BenchSort): OrchardBench[] {
  return benches.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "gardener") {
      const gardener = a.gardener.localeCompare(b.gardener);
      if (gardener) return gardener;
    }
    const season = (seasonIndex(a.season) < 0 ? 99 : seasonIndex(a.season)) - (seasonIndex(b.season) < 0 ? 99 : seasonIndex(b.season));
    if (season) return season;
    return a.title.localeCompare(b.title);
  });
}

export function orchardCounts(benches: readonly OrchardBench[], shown: readonly OrchardBench[], deskSeason: unknown): BenchCounts {
  const open = benches.filter((bench) => inTray(bench, "open"));
  void shown;
  return {
    open: open.length,
    held: benches.filter((bench) => inTray(bench, "held")).length,
    archived: benches.filter((bench) => inTray(bench, "archived")).length,
    pinned: open.filter((bench) => bench.pinned).length,
    peak: open.filter((bench) => peakSeason(bench.season)).length,
    quiet: open.filter((bench) => quietSeason(bench.season)).length,
    soon: open.filter((bench) => bench.water === 10).length,
    height: open.reduce((sum, bench) => sum + bench.height, 0),
    house: open.filter((bench) => houseSoil(bench.soil)).length,
    water: open.filter((bench) => bench.water !== null).length,
    matched: open.filter((bench) => bench.season && bench.season === seasonOf(deskSeason)).length,
    shade: open.filter((bench) => bench.shade).length,
    idle: open.filter((bench) => idleBench(bench)).length,
    rush: open.filter((bench) => rushBench(bench)).length,
    resting: open.filter((bench) => restingBench(bench)).length,
    overdue: open.filter((bench) => overdueBench(bench)).length,
  };
}

export function orchardShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashSeasonCount(benches: readonly OrchardBench[]): number {
  const open = benches.filter((bench) => inTray(bench, "open") && bench.season);
  return open.filter((bench) => open.some((other) => other.id !== bench.id && other.season === bench.season && other.height === bench.height)).length;
}

export function waterClashCount(benches: readonly OrchardBench[]): number {
  const open = benches.filter((bench) => inTray(bench, "open") && bench.season && bench.water !== null);
  return open.filter((bench) => open.some((other) => other.id !== bench.id && other.season === bench.season && other.water === bench.water)).length;
}

export function neighborBenchCount(benches: readonly OrchardBench[]): number {
  const open = benches.filter((bench) => inTray(bench, "open") && heightIndex(bench.height) >= 0);
  return open.filter((bench) => open.some((other) => {
    if (other.id === bench.id) return false;
    const gap = Math.abs(heightIndex(other.height) - heightIndex(bench.height));
    const ring = Math.min(gap, HEIGHT_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestGardener(benches: readonly OrchardBench[]): string {
  const open = benches.filter((bench) => inTray(bench, "open") && bench.gardener);
  let best = "";
  let score = 0;
  for (const bench of open) {
    const count = open.filter((item) => item.gardener.toLowerCase() === bench.gardener.toLowerCase()).length;
    if (count > score) {
      best = bench.gardener;
      score = count;
    }
  }
  return best;
}

export function pairGardenerCount(benches: readonly OrchardBench[]): number {
  const open = benches.filter((bench) => inTray(bench, "open") && bench.gardener);
  return open.filter((bench) => open.filter((item) => item.gardener.toLowerCase() === bench.gardener.toLowerCase()).length >= 2).length;
}

export function heightLoad(benches: readonly OrchardBench[]): number {
  return benches.filter((bench) => inTray(bench, "open")).reduce((sum, bench) => sum + bench.height, 0);
}

export function reminderBenches(benches: readonly OrchardBench[]): OrchardBench[] {
  return benches.filter((bench) => inTray(bench, "open") && overdueBench(bench));
}

export function idleBenches(benches: readonly OrchardBench[]): OrchardBench[] {
  return benches.filter((bench) => inTray(bench, "open") && idleBench(bench));
}

export function matchedBenches(benches: readonly OrchardBench[], deskSeason: unknown): OrchardBench[] {
  const season = seasonOf(deskSeason);
  if (!season) return [];
  return benches.filter((bench) => inTray(bench, "open") && bench.season === season);
}

export function nextBench(benches: readonly OrchardBench[], id: string): OrchardBench | null {
  const open = sortOrchard(benches.filter((bench) => inTray(bench, "open")), "season");
  const at = open.findIndex((bench) => bench.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function orchardTimeline(benches: readonly OrchardBench[]): { height: number; titles: string[] }[] {
  const open = benches.filter((bench) => inTray(bench, "open"));
  return HEIGHT_CYCLE.map((height) => ({ height, titles: open.filter((bench) => bench.height === height).map((bench) => bench.title) })).filter((lane) => lane.titles.length);
}

export function orchardGardeners(benches: readonly OrchardBench[]): string[] {
  const out: string[] = [];
  for (const bench of benches) {
    if (!bench.gardener || out.some((item) => item.toLowerCase() === bench.gardener.toLowerCase())) continue;
    out.push(bench.gardener);
  }
  return out;
}

export function orchardCopy(bench: OrchardBench): string {
  return [bench.title, bench.gardener, bench.season, bench.soil, bench.bloom, bench.water ?? "", bench.height, bench.note].filter((item) => item !== "").join(" · ");
}

export function orchardCsv(benches: readonly OrchardBench[], deskSeason: unknown): string {
  const lines = ["title,gardener,season,soil,bloom,water,height,tags,pinned,held,archived,shade,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const bench of readOrchardBenches(benches)) {
    const gap = seasonGap(bench.season, deskSeason);
    lines.push([
      csvCell(bench.title),
      csvCell(bench.gardener),
      bench.season,
      bench.soil,
      bench.bloom,
      bench.water === null ? "" : String(bench.water),
      String(bench.height),
      bench.tags.join(" "),
      bench.pinned ? "1" : "0",
      bench.held ? "1" : "0",
      bench.archived ? "1" : "0",
      bench.shade ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBench(bench, deskSeason) ? "1" : "0",
      idleBench(bench) ? "1" : "0",
      peakSeason(bench.season) ? "1" : "0",
      quietSeason(bench.season) ? "1" : "0",
      houseSoil(bench.soil) ? "1" : "0",
      seasonBand(bench.season),
      rushBench(bench) ? "1" : "0",
      restingBench(bench) ? "1" : "0",
      overdueBench(bench) ? "1" : "0",
      bench.audit,
      csvCell(bench.note),
    ].join(","));
  }
  return lines.join("\n");
}

function meridianRecord(raw: MeridianValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function meridianFull(raw: MeridianValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = meridianRecord(raw);
  if (!row) return "";
  let full = clip(row.zone ?? row.timezone, 64);
  const city = clip(row.city, 40);
  if (city && !full.includes("/")) full = full ? `${full}/${city}` : city;
  return full;
}

function meridianArea(raw: MeridianValue): string {
  const full = meridianFull(raw);
  const slash = full.indexOf("/");
  return slash < 0 ? full : full.slice(0, slash);
}

function meridianCity(raw: MeridianValue): string {
  const full = meridianFull(raw);
  const slash = full.lastIndexOf("/");
  return slash < 0 ? "" : full.slice(slash + 1);
}

function letterRun(name: string): string {
  return name.replace(/[^A-Za-z]/g, "");
}

function consonantCount(name: string): number {
  const letters = letterRun(name).toLowerCase();
  let count = 0;
  for (const char of letters) if (!"aeiou".includes(char)) count += 1;
  return count;
}

function hasMoney(raw: MeridianValue): boolean {
  const row = meridianRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

/** A money field clears the mark. A timezone with a letter is set. A blank timezone is clear. */
export function meridianState(raw: MeridianValue): MeridianState {
  if (hasMoney(raw)) return "";
  return /[A-Za-z]/.test(meridianFull(raw)) ? "set" : "clear";
}

/** First letter of the area plus the letter count of the city. Europe/Istanbul is E8. UTC is U0. */
export function meridianStamp(raw: MeridianValue): string {
  if (meridianState(raw) !== "set") return "";
  const letters = letterRun(meridianArea(raw)) || letterRun(meridianFull(raw));
  if (!letters) return "";
  return `${letters[0].toUpperCase()}${letterRun(meridianCity(raw)).length}`;
}

/** Three segments are deep. An underscore city is a script tag. A hyphen city is a region tag. A period is a mark. UTC and GMT are hush. */
export function meridianLane(raw: MeridianValue): MeridianLane {
  if (meridianState(raw) !== "set") return "";
  const full = meridianFull(raw);
  const city = meridianCity(raw);
  const parts = full.split("/").filter(Boolean);
  if (parts.length >= 3) return "deep";
  if (city.includes("_")) return "score";
  if (city.includes("-")) return "dash";
  if (city.includes(".")) return "mark";
  if (!full.includes("/") && /^(?:utc|gmt)/i.test(full.trim())) return "hush";
  if (!full.includes("/") && letterRun(full).length === 3) return "trio";
  if (full.includes("/") && letterRun(city).length <= 4) return "pair";
  return "long";
}

/** Hue follows the last letter of the city, or of the zone when the city is blank. An exclamation mark is pearl. A digit is mist. */
export function meridianHue(raw: MeridianValue): MeridianHue {
  if (meridianState(raw) !== "set") return "";
  const full = meridianFull(raw);
  const city = meridianCity(raw) || meridianArea(raw);
  if (!city) return "mist";
  if (full.includes("!")) return "pearl";
  const marks = city.match(/[A-Za-z0-9]/g);
  const char = marks ? marks[marks.length - 1] : "";
  if (!char) return "mist";
  if (/[0-9]/.test(char)) return "mist";
  const letter = char.toUpperCase();
  if (letter <= "C") return "gilt";
  if (letter <= "G") return "slate";
  if (letter <= "L") return "sand";
  if (letter <= "Q") return "clay";
  return "soot";
}

export function meridianBound(raw: MeridianValue): boolean {
  return meridianState(raw) === "set" && /^[aeiou]/i.test(meridianCity(raw));
}

export function meridianWide(raw: MeridianValue): boolean {
  return meridianFull(raw).length >= 16;
}

export function meridianNotch(raw: MeridianValue): boolean {
  return meridianFull(raw).includes("_");
}

export function meridianStep(raw: MeridianValue): number {
  if (meridianState(raw) !== "set") return 0;
  const city = meridianCity(raw) || meridianArea(raw);
  return Math.min(6, consonantCount(city));
}

export function meridianJoin(raw: MeridianValue): boolean {
  return meridianFull(raw).includes("/");
}

export function meridianLanes(rows: readonly MeridianRow[]): MeridianLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = meridianLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingMeridian(rows: readonly MeridianRow[]): string {
  const bars = meridianLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingMeridianHue(rows: readonly MeridianRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = meridianHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedMeridianCount(rows: readonly MeridianRow[]): number {
  const marks = rows.map((row) => meridianStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneMeridianCount(rows: readonly MeridianRow[], lane: MeridianLane): number {
  return rows.filter((row) => meridianLane(row.note) === lane).length;
}

export function hueMeridianCount(rows: readonly MeridianRow[], hue: MeridianHue): number {
  return rows.filter((row) => meridianHue(row.note) === hue).length;
}

export function meridianShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentMeridianLanes(rows: readonly MeridianRow[]): string[] {
  return meridianLanes(rows).map((line) => line.lane);
}

export function readHiddenMeridians(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedMeridians(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleMeridian(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleMeridianReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMeridianReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMeridianLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleMeridians(
  rows: readonly MeridianRow[],
  lane: string,
  hue: string,
  query: string,
  review: MeridianReview,
  reviewed: readonly string[],
  shape: MeridianShape,
): MeridianRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (meridianState(row.note) === "") return false;
    const found = meridianLane(row.note);
    const hueName = meridianHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${meridianFull(row.note)} ${meridianStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "deep" && found !== "deep") return false;
    if (shape === "wide" && !meridianWide(row.note)) return false;
    if (shape === "bound" && !meridianBound(row.note)) return false;
    if (shape === "notch" && !meridianNotch(row.note)) return false;
    if (shape === "score" && found !== "score") return false;
    return true;
  });
}

export function meridianCopy(raw: MeridianValue): string {
  return [meridianStamp(raw), meridianLane(raw), meridianHue(raw)].filter(Boolean).join(" ");
}

export function meridianLanesCsv(rows: readonly MeridianRow[]): string {
  const lines = ["lane,count"];
  for (const line of meridianLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function meridianRowsCsv(rows: readonly MeridianRow[], reviewed: readonly string[]): string {
  const lines = ["timezone,stamp,lane,hue,step,join,wide,notch,bound,deep,score,dash,mark,hush,trio,pair,long,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (meridianState(row.note) !== "set") continue;
    const lane = meridianLane(row.note);
    lines.push([
      csvCell(meridianFull(row.note)),
      meridianStamp(row.note),
      lane,
      meridianHue(row.note),
      String(meridianStep(row.note)),
      meridianJoin(row.note) ? "1" : "0",
      meridianWide(row.note) ? "1" : "0",
      meridianNotch(row.note) ? "1" : "0",
      meridianBound(row.note) ? "1" : "0",
      lane === "deep" ? "1" : "0",
      lane === "score" ? "1" : "0",
      lane === "dash" ? "1" : "0",
      lane === "mark" ? "1" : "0",
      lane === "hush" ? "1" : "0",
      lane === "trio" ? "1" : "0",
      lane === "pair" ? "1" : "0",
      lane === "long" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
