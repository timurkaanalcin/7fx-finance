/**
 * Nave benches for the customers desk, and language ribbons already stored as language on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_nave_bench (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   bay integer,
 *   weave text not null default '',
 *   voice text not null default '',
 *   span integer,
 *   watch integer,
 *   tags text not null default '',
 *   gilt integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_language_ribbon_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_language_ribbon_review (
 *   customer_id text primary key
 * );
 */

export const NVB_KEY = "crmv4-nave-bench";
export const NVB_VIEW_KEY = "crmv4-nave-views";
export const NVB_DENSITY_KEY = "crmv4-nave-density";
export const LNR_KEY = "crmv4-language-hide";
export const LNR_REVIEW_KEY = "crmv4-language-review";

export type WeaveName = "blank" | "ivory" | "graphite" | "gold";

export type VoiceName = "blank" | "soft" | "even" | "full";

export type BenchTray = "open" | "held" | "closed";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type BenchDensity = "roomy" | "tight";

export type BenchSort = "bay" | "keeper";

export type NaveBench = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  bay: number | null;
  weave: string;
  voice: string;
  span: number | null;
  watch: number | null;
  tags: string[];
  gilt: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type BenchView = {
  id: string;
  name: string;
  tray: BenchTray;
  query: string;
  keeper: string;
  weave: string;
  voice: string;
  bay: string;
  span: string;
  watch: string;
};

export type BenchCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  gilt: number;
  house: number;
  window: number;
};

const AUDITS = ["save", "edit", "voice", "pin", "unpin", "hold", "lift", "close", "open", "weave", "tag", "gilt"] as const;

const WEAVES = ["ivory", "graphite", "gold"] as const;

const VOICES = ["soft", "even", "full"] as const;

const VOICE_ORDER = ["", "soft", "even", "full"] as const;

const PEAK_BAYS = new Set([3, 8]);

const QUIET_BAYS = new Set([1, 4]);

const HOUSE = new Set(["IVORY", "GOLD"]);

const BENCH_CAP = 10;

const VIEW_CAP = 8;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BenchTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function weaveName(raw: unknown): Exclude<WeaveName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WEAVES as readonly string[]).includes(text) ? (text as Exclude<WeaveName, "blank">) : "";
}

function voiceNameOf(raw: unknown): Exclude<VoiceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (VOICES as readonly string[]).includes(text) ? (text as Exclude<VoiceName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function benchLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function benchNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A weave is IVORY, GRAPHITE, or GOLD. Anything else stays blank. Letters are stored in capitals. */
export function weaveOf(raw: unknown): string {
  const name = weaveName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 8.
 * A blank value stays unset. 0 is not a bay.
 * A second digit is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A span is 5, 10, or 20. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 5 | 10 | 20 | null {
  if (raw === 5 || raw === "5") return 5;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  const text = clip(raw, 2);
  if (text === "5") return 5;
  if (text === "10") return 10;
  if (text === "20") return 20;
  return null;
}

/** A watch is 20, 45, or 90. A blank value stays unset. A leading zero is not a watch. */
export function watchOf(raw: unknown): 20 | 45 | 90 | null {
  if (raw === 20 || raw === "20") return 20;
  if (raw === 45 || raw === "45") return 45;
  if (raw === 90 || raw === "90") return 90;
  const text = clip(raw, 2);
  if (text === "20") return 20;
  if (text === "45") return 45;
  if (text === "90") return 90;
  return null;
}

/** A gilt is 0, 1, or 3. Anything else is not a gilt. 0 clears the gilt. */
export function giltOf(raw: unknown): 0 | 1 | 3 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak bays are 3 and 8. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** Quiet bays are 1 and 4. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the bench bay is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and GOLD are house weaves. GRAPHITE is a guest weave. A blank weave is not a house weave. */
export function houseWeave(weave: unknown): boolean {
  return HOUSE.has(weaveOf(weave));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): BenchDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Bay or keeper. Anything else stays on the bay. */
export function sortMode(raw: unknown): BenchSort {
  return raw === "keeper" ? "keeper" : "bay";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[m-r]$/.test(text) ? text : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = tagOf(part);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= TAG_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): NaveBench | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<NaveBench>;
  const id = clip(row.id, 24);
  const title = benchLine(row.title);
  if (!id || !title) return null;
  const gilt = giltOf(row.gilt);
  return {
    id,
    title,
    note: benchNote(row.note),
    keeper: keeperLabel(row.keeper),
    bay: bayOf(row.bay),
    weave: weaveOf(row.weave),
    voice: voiceNameOf(row.voice),
    span: spanOf(row.span),
    watch: watchOf(row.watch),
    tags: tagsOf(row.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readBenches(raw: unknown): NaveBench[] {
  if (!Array.isArray(raw)) return [];
  const out: NaveBench[] = [];
  for (const item of raw) {
    const bench = readOne(item);
    if (!bench || out.some((row) => row.id === bench.id || row.title === bench.title)) continue;
    out.push(bench);
  }
  return out.slice(0, BENCH_CAP);
}

export function addBench(
  benches: readonly NaveBench[],
  bench: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    bay?: unknown;
    weave?: string;
    voice?: string;
    span?: unknown;
    watch?: unknown;
    tags?: unknown;
    gilt?: unknown;
  },
): NaveBench[] {
  const current = readBenches(benches);
  const id = String(bench.id || "").trim();
  const title = benchLine(bench.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const gilt = giltOf(bench.gilt);
  const next: NaveBench = {
    id,
    title,
    note: benchNote(bench.note),
    keeper: keeperLabel(bench.keeper),
    bay: bayOf(bench.bay),
    weave: weaveOf(bench.weave),
    voice: voiceNameOf(bench.voice),
    span: spanOf(bench.span),
    watch: watchOf(bench.watch),
    tags: tagsOf(bench.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BENCH_CAP);
}

export function cycleVoice(benches: readonly NaveBench[], id: string): NaveBench[] {
  return readBenches(benches).map((bench) => {
    if (bench.id !== id) return bench;
    const at = VOICE_ORDER.indexOf(bench.voice as (typeof VOICE_ORDER)[number]);
    const next = at < 0 || at >= VOICES.length ? VOICES[0] : VOICES[at % VOICES.length];
    if (!next || next === bench.voice) return bench;
    return { ...bench, voice: next, audit: "voice" };
  });
}

/** A blank title is left as it is. */
export function editBench(benches: readonly NaveBench[], id: string, title: unknown): NaveBench[] {
  const next = benchLine(title);
  if (!next) return readBenches(benches);
  const current = readBenches(benches);
  if (current.some((bench) => bench.id !== id && bench.title === next)) return current;
  return current.map((bench) => (bench.id === id && bench.title !== next ? { ...bench, title: next, audit: "edit" } : bench));
}

/** A blank note is left as it is. */
export function editBenchNote(benches: readonly NaveBench[], id: string, note: unknown): NaveBench[] {
  const next = benchNote(note);
  if (!next) return readBenches(benches);
  return readBenches(benches).map((bench) => (bench.id === id && bench.note !== next ? { ...bench, note: next, audit: "edit" } : bench));
}

/** A tag that is already on the bench, or a fourth tag, is left out. A tag is one letter from m to r. */
export function addBenchTag(benches: readonly NaveBench[], id: string, tag: unknown): NaveBench[] {
  const next = tagOf(tag);
  if (!next) return readBenches(benches);
  return readBenches(benches).map((bench) => {
    if (bench.id !== id || bench.tags.includes(next) || bench.tags.length >= TAG_CAP) return bench;
    return { ...bench, tags: [...bench.tags, next], audit: "tag" };
  });
}

/** An unknown gilt is left as it is. 0 clears the gilt. */
export function setBenchGilt(benches: readonly NaveBench[], id: string, gilt: unknown): NaveBench[] {
  const next = giltOf(gilt);
  if (next === null) return readBenches(benches);
  return readBenches(benches).map((bench) => (bench.id === id && bench.gilt !== next ? { ...bench, gilt: next, audit: "gilt" } : bench));
}

export function setBenchPin(benches: readonly NaveBench[], id: string, pinned: boolean): NaveBench[] {
  return readBenches(benches).map((bench) => (bench.id === id && bench.pinned !== pinned ? { ...bench, pinned, audit: pinned ? "pin" : "unpin" } : bench));
}

/** P toggles the pin on the focused row of the aisle currently shown. */
export function pinFocused(benches: readonly NaveBench[], shownIds: readonly string[], index: number): NaveBench[] {
  if (!shownIds.length) return readBenches(benches);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readBenches(benches).find((bench) => bench.id === id);
  if (!row) return readBenches(benches);
  return setBenchPin(benches, id, !row.pinned);
}

/** G sets a gilt of 1 on the focused bench, or clears a gilt that is already set. */
export function giltFocused(benches: readonly NaveBench[], shownIds: readonly string[], index: number): NaveBench[] {
  if (!shownIds.length) return readBenches(benches);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readBenches(benches).find((bench) => bench.id === id);
  if (!row) return readBenches(benches);
  return setBenchGilt(benches, id, row.gilt ? 0 : 1);
}

export function setBenchHold(benches: readonly NaveBench[], id: string, held: boolean): NaveBench[] {
  return readBenches(benches).map((bench) => (bench.id === id && bench.held !== held ? { ...bench, held, audit: held ? "hold" : "lift" } : bench));
}

export function setBenchClose(benches: readonly NaveBench[], id: string, closed: boolean): NaveBench[] {
  return readBenches(benches).map((bench) => (bench.id === id && bench.closed !== closed ? { ...bench, closed, audit: closed ? "close" : "open" } : bench));
}

export function bulkBenchWeave(benches: readonly NaveBench[], ids: readonly string[], weave: unknown): NaveBench[] {
  const next = weaveOf(weave);
  if (!next) return readBenches(benches);
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.weave !== next ? { ...bench, weave: next, audit: "weave" } : bench));
}

export function bulkBenchPin(benches: readonly NaveBench[], ids: readonly string[], pinned: boolean): NaveBench[] {
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.pinned !== pinned ? { ...bench, pinned, audit: pinned ? "pin" : "unpin" } : bench));
}

export function bulkBenchClose(benches: readonly NaveBench[], ids: readonly string[], closed: boolean): NaveBench[] {
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.closed !== closed ? { ...bench, closed, audit: closed ? "close" : "open" } : bench));
}

export function bulkBenchVoice(benches: readonly NaveBench[], ids: readonly string[], voice: unknown): NaveBench[] {
  const next = voiceNameOf(voice);
  if (!next) return readBenches(benches);
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.voice !== next ? { ...bench, voice: next, audit: "voice" } : bench));
}

export function bulkBenchTag(benches: readonly NaveBench[], ids: readonly string[], tag: unknown): NaveBench[] {
  return ids.reduce((rows, id) => addBenchTag(rows, id, tag), readBenches(benches));
}

export function resetBenches(): NaveBench[] {
  return [];
}

function inTray(bench: NaveBench, tray: BenchTray): boolean {
  if (tray === "closed") return bench.closed;
  if (tray === "held") return bench.held && !bench.closed;
  return !bench.held && !bench.closed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** An open bench whose bay sits more than three bays behind the desk bay. A gilt, a hold, or a close is not late. */
export function lateBench(bench: NaveBench, desk: unknown): boolean {
  const gap = bayGap(bench.bay, desk);
  return inTray(bench, "open") && bench.gilt === 0 && gap !== null && gap > 3;
}

/** An open bench with a watch of 20 is due now. A gilt, a hold, or a close is not. */
export function soonBench(bench: NaveBench): boolean {
  return inTray(bench, "open") && bench.gilt === 0 && bench.watch === 20;
}

/** Open benches that are late or due now. A gilt bench stays off the reminder list. */
export function reminderBenches(benches: readonly NaveBench[], desk: unknown): NaveBench[] {
  return readBenches(benches).filter((bench) => lateBench(bench, desk) || soonBench(bench));
}

/** Open benches whose bay sits within three bays of the desk bay. A gilt, a hold, or a close stays out. */
export function windowBenches(benches: readonly NaveBench[], desk: unknown): NaveBench[] {
  return readBenches(benches).filter((bench) => {
    const gap = bayGap(bench.bay, desk);
    return inTray(bench, "open") && bench.gilt === 0 && gap !== null && Math.abs(gap) <= 3;
  });
}

/** Search matches the title, the note, the keeper, and the tags. */
export function visibleBenches(
  benches: readonly NaveBench[],
  tray: BenchTray,
  query: string,
  keeper: string | null,
  weave: string | null,
  voice: string | null,
  exact: number | null,
  pick: BayPick | null,
  span: number | "blank" | null,
  watch: number | "blank" | null,
  fullOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): NaveBench[] {
  const text = query.trim().toLowerCase();
  return readBenches(benches).filter((bench) => {
    if (!inTray(bench, tray)) return false;
    if (text) {
      const hay = `${bench.title} ${bench.note} ${bench.keeper} ${bench.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && bench.keeper !== keeper) return false;
    if (weave === "blank" ? Boolean(bench.weave) : weave && bench.weave !== weave) return false;
    if (voice === "blank" ? Boolean(bench.voice) : voice && bench.voice !== voice) return false;
    if (!bayHit(bench.bay, exact, pick)) return false;
    if (span === "blank" ? bench.span !== null : span !== null && bench.span !== span) return false;
    if (watch === "blank" ? bench.watch !== null : watch !== null && bench.watch !== watch) return false;
    if (fullOnly && bench.voice !== "full") return false;
    if (peakOnly && !peakBay(bench.bay)) return false;
    if (houseOnly && !houseWeave(bench.weave)) return false;
    if (quietOnly && !quietBay(bench.bay)) return false;
    if (awakeOnly && bench.gilt !== 0) return false;
    return true;
  });
}

export function sortBenches(benches: readonly NaveBench[], mode: BenchSort): NaveBench[] {
  const rows = benches.slice();
  if (mode === "keeper") return rows.sort((a, b) => a.keeper.localeCompare(b.keeper) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function benchTimeline(benches: readonly NaveBench[], query: string): NaveBench[] {
  const text = query.trim().toLowerCase();
  return sortBenches(
    readBenches(benches).filter((bench) => bench.bay !== null && (!text || bench.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function benchCounts(benches: readonly NaveBench[], desk: unknown): BenchCounts {
  const rows = readBenches(benches);
  return {
    open: rows.filter((bench) => inTray(bench, "open")).length,
    held: rows.filter((bench) => inTray(bench, "held")).length,
    closed: rows.filter((bench) => inTray(bench, "closed")).length,
    pinned: rows.filter((bench) => bench.pinned).length,
    peak: rows.filter((bench) => inTray(bench, "open") && bench.gilt === 0 && peakBay(bench.bay)).length,
    late: rows.filter((bench) => lateBench(bench, desk)).length,
    soon: rows.filter((bench) => soonBench(bench)).length,
    gilt: rows.filter((bench) => inTray(bench, "open") && bench.gilt > 0).length,
    house: rows.filter((bench) => inTray(bench, "open") && houseWeave(bench.weave)).length,
    window: windowBenches(rows, desk).length,
  };
}

export function benchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open benches as a share of every open bench. */
export function lateShare(benches: readonly NaveBench[], desk: unknown): number {
  const rows = readBenches(benches);
  const open = rows.filter((bench) => inTray(bench, "open")).length;
  const late = rows.filter((bench) => lateBench(bench, desk)).length;
  return benchShare(late, open);
}

/** Distinct bays on open benches. */
export function usedBays(benches: readonly NaveBench[]): number {
  const bays = new Set<number>();
  for (const bench of readBenches(benches)) {
    if (inTray(bench, "open") && bench.bay !== null) bays.add(bench.bay);
  }
  return bays.size;
}

/** Open benches that share a bay and a weave. A different weave on the same bay is not a clash. */
export function clashBayCount(benches: readonly NaveBench[]): number {
  const groups = new Map<string, number>();
  for (const bench of readBenches(benches)) {
    if (!inTray(bench, "open") || bench.bay === null || !bench.weave) continue;
    const key = `${bench.bay}:${bench.weave}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open benches that share a span. An unset span is not a clash. */
export function spanClashCount(benches: readonly NaveBench[]): number {
  const groups = new Map<number, number>();
  for (const bench of readBenches(benches)) {
    if (!inTray(bench, "open") || bench.span === null) continue;
    groups.set(bench.span, (groups.get(bench.span) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open benches in the same weave whose bays differ by three.
 * The count is the benches that have at least one neighbor.
 */
export function adjacentBenchCount(benches: readonly NaveBench[]): number {
  const open = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.bay !== null && bench.weave);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.weave === right.weave && Math.abs((left.bay ?? 0) - (right.bay ?? 0)) === 3) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The weave with the fewest open benches.
 * A tie keeps GRAPHITE, then IVORY, then GOLD.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestWeave(benches: readonly NaveBench[]): "IVORY" | "GRAPHITE" | "GOLD" {
  const rows = readBenches(benches).filter((bench) => inTray(bench, "open"));
  const order = ["GRAPHITE", "IVORY", "GOLD"] as const;
  let best: "IVORY" | "GRAPHITE" | "GOLD" = "GRAPHITE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const weave of order) {
    const count = rows.filter((bench) => bench.weave === weave).length;
    if (count < bestCount) {
      best = weave;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The watch with the fewest open benches.
 * A tie keeps 45, then 20, then 90.
 * An empty desk still suggests 45.
 */
export function suggestWatch(benches: readonly NaveBench[]): 20 | 45 | 90 {
  const rows = readBenches(benches).filter((bench) => inTray(bench, "open"));
  const order = [45, 20, 90] as const;
  let best: 20 | 45 | 90 = 45;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const watch of order) {
    const count = rows.filter((bench) => bench.watch === watch).length;
    if (count < bestCount) {
      best = watch;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open keeper. A blank keeper is skipped. An empty desk stays blank. */
export function suggestKeeper(benches: readonly NaveBench[]): string {
  const found = readBenches(benches).find((bench) => inTray(bench, "open") && bench.keeper);
  return found ? found.keeper : "";
}

/**
 * The keeper carrying the fewest open benches.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty roster falls back to the newest keeper.
 */
export function fairKeeper(benches: readonly NaveBench[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(benches);
  const open = readBenches(benches).filter((bench) => inTray(bench, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((bench) => bench.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open benches. A tie keeps the newer name on the desk. */
export function busiestKeeper(benches: readonly NaveBench[]): string {
  const rows = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.keeper);
  const names: string[] = [];
  for (const bench of rows) if (!names.includes(bench.keeper)) names.push(bench.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((bench) => bench.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function benchKeepers(benches: readonly NaveBench[]): string[] {
  const out: string[] = [];
  for (const bench of readBenches(benches)) {
    if (bench.keeper && !out.includes(bench.keeper)) out.push(bench.keeper);
  }
  return out;
}

export function benchWeaves(benches: readonly NaveBench[]): string[] {
  const out: string[] = [];
  for (const bench of readBenches(benches)) {
    if (bench.weave && !out.includes(bench.weave)) out.push(bench.weave);
  }
  return out;
}

/** Open benches whose keeper also keeps another open bench on a different bay. */
export function pairKeeperCount(benches: readonly NaveBench[]): number {
  const open = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.keeper && bench.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].keeper === open[j].keeper && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The gilt weight of open benches. A clear gilt adds nothing. */
export function giltLoad(benches: readonly NaveBench[]): number {
  return readBenches(benches).filter((bench) => inTray(bench, "open")).reduce((sum, bench) => sum + bench.gilt, 0);
}

/** Open benches that are both a quiet bay and a house weave. */
export function quietHouseCount(benches: readonly NaveBench[]): number {
  return readBenches(benches).filter((bench) => inTray(bench, "open") && quietBay(bench.bay) && houseWeave(bench.weave)).length;
}

/** Open benches whose voice is full. */
export function fullLoad(benches: readonly NaveBench[]): number {
  return readBenches(benches).filter((bench) => inTray(bench, "open") && bench.voice === "full").length;
}

/** The span from the lowest open bay to the highest. Fewer than two bays spans nothing. */
export function baySpan(benches: readonly NaveBench[]): number {
  const bays = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.bay !== null).map((bench) => bench.bay as number);
  if (bays.length < 2) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/**
 * The next open bench at or after the desk bay.
 * A full voice, a gilt, a hold, and a close stay off the list.
 * When every open bay is behind, the earliest bay is next.
 */
export function nextBench(benches: readonly NaveBench[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.bay !== null && bench.voice !== "full" && bench.gilt === 0);
  if (!waiting.length) return "";
  const byBay = (a: NaveBench, b: NaveBench) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((bench) => (bench.bay ?? 0) >= now).sort(byBay);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byBay)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function benchCopy(bench: NaveBench, desk: unknown): string {
  const gap = bayGap(bench.bay, desk);
  return [bench.title, bench.keeper, bench.bay ?? "", bench.weave, bench.voice, bench.span ?? "", bench.watch ?? "", bench.tags.join(" "), bench.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the benches saved in this browser. The gap and the late mark use the bay you pass. */
export function benchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,bay,weave,voice,span,watch,tags,gilt,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readBenches(raw);
  const windowIds = new Set(windowBenches(rows, desk).map((bench) => bench.id));
  for (const bench of rows) {
    const gap = bayGap(bench.bay, desk);
    lines.push([
      bench.title,
      bench.keeper,
      bench.bay === null ? "" : String(bench.bay),
      bench.weave,
      bench.voice,
      bench.span === null ? "" : String(bench.span),
      bench.watch === null ? "" : String(bench.watch),
      bench.tags.join(" "),
      String(bench.gilt),
      bench.pinned ? "1" : "0",
      bench.held ? "1" : "0",
      bench.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBench(bench, desk) ? "1" : "0",
      soonBench(bench) ? "1" : "0",
      houseWeave(bench.weave) ? "1" : "0",
      windowIds.has(bench.id) ? "1" : "0",
      bench.note,
      bench.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return keepers.includes(raw) ? raw : "all";
}

export function activeWeave(raw: string, weaves: readonly string[]): string {
  if (raw === "blank") return "blank";
  return weaveOf(raw) && weaves.includes(weaveOf(raw)) ? weaveOf(raw) : "all";
}

export function activeVoice(raw: string, voices: readonly string[]): string {
  if (raw === "blank") return "blank";
  const voice = voiceNameOf(raw);
  return voice && voices.includes(voice) ? voice : "all";
}

export function activeBay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bay = bayOf(raw);
  return bay === null ? "all" : String(bay);
}

export function activeSpan(raw: string): string {
  if (raw === "blank") return "blank";
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function activeWatch(raw: string): string {
  if (raw === "blank") return "blank";
  const watch = watchOf(raw);
  return watch === null ? "all" : String(watch);
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function weaveArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weaveOf(filter) || null;
}

export function voiceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return voiceNameOf(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function watchArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return watchOf(filter);
}

function readView(raw: unknown): BenchView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<BenchView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    keeper: row.keeper === "blank" ? "blank" : clip(row.keeper, 18) || "all",
    weave: row.weave === "blank" || row.weave === "all" ? (row.weave === "blank" ? "blank" : "all") : weaveOf(row.weave) || "all",
    voice: row.voice === "blank" || row.voice === "all" ? (row.voice === "blank" ? "blank" : "all") : voiceNameOf(row.voice) || "all",
    bay: activeBay(String(row.bay || "all")),
    span: activeSpan(String(row.span || "all")),
    watch: activeWatch(String(row.watch || "all")),
  };
}

export function readBenchViews(raw: unknown): BenchView[] {
  if (!Array.isArray(raw)) return [];
  const out: BenchView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addBenchView(views: readonly BenchView[], view: BenchView): BenchView[] {
  const current = readBenchViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropBenchView(views: readonly BenchView[], id: string): BenchView[] {
  return readBenchViews(views).filter((view) => view.id !== id);
}

const RIBBON_BANDS = ["latin", "turkic", "cyrillic", "arabic", "plain"] as const;

const RIBBON_TONES = ["gilt", "ink", "ivory", "mist", "plain"] as const;

const CATALOG = new Set(["en", "tr", "de", "ru", "ar"]);

const RIBBON_BLOCK = ["lastOs", "lastDevice", "lastUserAgent", "lastIp", "timezone", "username", "phone", "assigneeId", "referralCodeUsed", "city", "country", "desk", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name", "email"] as const;

export type RibbonState = "" | "set" | "clear";

export type RibbonBand = "" | "latin" | "turkic" | "cyrillic" | "arabic" | "plain";

export type RibbonTone = "" | "gilt" | "ink" | "ivory" | "mist" | "plain";

export type RibbonShape = "all" | "catalog" | "wide" | "gilt";

export type RibbonValue =
  | { language?: unknown; lastOs?: unknown; lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; assigneeId?: unknown; referralCodeUsed?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type RibbonRow = { id: string; note?: RibbonValue; label?: string | null };

export type RibbonBandLine = { band: string; count: number };

function ribbonBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 16);
}

function ribbonText(value: RibbonValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: ribbonBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (RIBBON_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("language" in value)) return { text: null, explicit: false };
  const inner = value.language;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: ribbonBody(inner), explicit: true };
}

export function ribbonState(value: RibbonValue): RibbonState {
  const found = ribbonText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function ribbonCopy(value: RibbonValue): string {
  const found = ribbonText(value);
  if (!found.text) return "";
  return found.text;
}

/** A ribbon keeps the first two letters. A single letter stays one letter. */
export function ribbonOf(value: RibbonValue): string {
  const text = ribbonCopy(value);
  if (!text) return "";
  const letters = text.match(/[a-z]/gi) || [];
  const first = letters[0];
  if (!first) return "";
  const second = letters[1];
  return second ? first.toUpperCase() + second.toUpperCase() : first.toUpperCase();
}

/** en de fr es it pt nl are latin. tr and az are turkic. ru and uk are cyrillic. ar and fa are arabic. Any other mark is plain. */
export function ribbonBand(value: RibbonValue): RibbonBand {
  const mark = ribbonOf(value);
  if (!mark) return "";
  const text = ribbonCopy(value);
  if (/^(en|de|fr|es|it|pt|nl)\b/.test(text)) return "latin";
  if (/^(tr|az)\b/.test(text)) return "turkic";
  if (/^(ru|uk)\b/.test(text)) return "cyrillic";
  if (/^(ar|fa)\b/.test(text)) return "arabic";
  return "plain";
}

/** A code that starts with en is gilt. tr that is not gilt is ink. de that is neither is ivory. ru that is none of those is mist. Every other marked ribbon is plain. */
export function ribbonTone(value: RibbonValue): RibbonTone {
  const text = ribbonCopy(value);
  if (!text || !ribbonOf(value)) return "";
  if (text.startsWith("en")) return "gilt";
  if (text.startsWith("tr")) return "ink";
  if (text.startsWith("de")) return "ivory";
  if (text.startsWith("ru")) return "mist";
  return "plain";
}

/** en, tr, de, ru, and ar are the house catalog. A longer code is not. */
export function catalogRibbon(value: RibbonValue): boolean {
  return CATALOG.has(ribbonCopy(value));
}

export function catalogRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => catalogRibbon(row.note)).length;
}

export function wideRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonCopy(row.note).length > 2).length;
}

export function giltRibbonCount(rows: readonly RibbonRow[]): number {
  return rows.filter((row) => ribbonTone(row.note) === "gilt").length;
}

/** Customers whose ribbon is shared with at least one other customer. */
export function sharedRibbonCount(rows: readonly RibbonRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = ribbonOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function ribbonBands(rows: readonly RibbonRow[]): RibbonBandLine[] {
  return RIBBON_BANDS.map((band) => ({ band, count: rows.filter((row) => ribbonBand(row.note) === band).length }));
}

/** The band with the most set ribbons. A tie keeps latin, then turkic, then cyrillic, then arabic, then plain. */
export function leadingRibbon(rows: readonly RibbonRow[]): string {
  const lines = ribbonBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || RIBBON_BANDS.indexOf(a.band as (typeof RIBBON_BANDS)[number]) - RIBBON_BANDS.indexOf(b.band as (typeof RIBBON_BANDS)[number]))[0];
  return lead ? lead.band : "";
}

/** The tone with the most set ribbons. A tie keeps gilt, then ink, then ivory, then mist, then plain. */
export function leadingRibbonTone(rows: readonly RibbonRow[]): string {
  const counts = RIBBON_TONES.map((tone) => ({ tone, count: rows.filter((row) => ribbonTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || RIBBON_TONES.indexOf(a.tone) - RIBBON_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function ribbonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentRibbons(rows: readonly RibbonRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = ribbonState(row.note);
    const band = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenRibbons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedRibbons(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleRibbon(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleRibbonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRibbonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRibbonBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleRibbonCustomers(
  rows: readonly RibbonRow[],
  band: RibbonBand | "blank" | null,
  tone: RibbonTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: RibbonShape,
): RibbonRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = ribbonState(row.note);
    const mark = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && ribbonTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogRibbon(row.note)) return false;
    if (shape === "wide" && ribbonCopy(row.note).length <= 2) return false;
    if (shape === "gilt" && ribbonTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${ribbonCopy(row.note)} ${ribbonOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeRibbonBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeRibbonTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" || raw === "plain" ? raw : "all";
}

export function ribbonBandArg(filter: string): RibbonBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "latin" || filter === "turkic" || filter === "cyrillic" || filter === "arabic" || filter === "plain") return filter;
  return null;
}

export function ribbonToneArg(filter: string): RibbonTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist" || filter === "plain") return filter;
  return null;
}

export function ribbonsCsv(rows: readonly RibbonRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of ribbonBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogRibbonCount(rows)}`);
  lines.push(`wide,wide,${wideRibbonCount(rows)}`);
  lines.push(`tone,gilt,${giltRibbonCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => ribbonTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => ribbonTone(row.note) === "ivory").length}`);
  lines.push(`tone,mist,${rows.filter((row) => ribbonTone(row.note) === "mist").length}`);
  lines.push(`tone,plain,${rows.filter((row) => ribbonTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedRibbonCount(rows)}`);
  return lines.join("\n");
}

export function ribbonRowsCsv(rows: readonly RibbonRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,ribbon,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = ribbonState(row.note);
    const band = state === "set" ? ribbonBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      ribbonOf(row.note),
      band,
      state === "set" ? ribbonTone(row.note) : "",
      catalogRibbon(row.note) ? "1" : "0",
      ribbonCopy(row.note).length > 2 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
