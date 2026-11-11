/**
 * Vestibule benches for the support desk, and agent scripts already stored as lastUserAgent on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_vestibule_bench (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   porter text not null default '',
 *   hour integer,
 *   bay text not null default '',
 *   cue text not null default '',
 *   lamp integer,
 *   wait integer,
 *   marks text not null default '',
 *   rest integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_agent_script_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_agent_script_review (
 *   customer_id text primary key
 * );
 */

export const VNB_KEY = "crmv4-vestibule-bench";
export const VNB_VIEW_KEY = "crmv4-vestibule-views";
export const VNB_DENSITY_KEY = "crmv4-vestibule-density";
export const AGS_KEY = "crmv4-agent-hide";
export const AGS_REVIEW_KEY = "crmv4-agent-review";

export type BenchBay = "blank" | "north" | "south" | "court";

export type BenchCue = "blank" | "seated" | "called" | "bowed";

export type BenchTray = "open" | "held" | "closed";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type BenchDensity = "roomy" | "tight";

export type BenchSort = "hour" | "title";

export type VestibuleBench = {
  id: string;
  title: string;
  note: string;
  porter: string;
  hour: number | null;
  bay: string;
  cue: string;
  lamp: number | null;
  wait: number | null;
  marks: string[];
  rest: number;
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
  porter: string;
  bay: string;
  cue: string;
  hour: string;
  lamp: string;
  wait: string;
};

export type BenchCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rest: number;
  house: number;
  window: number;
};

export type ScriptState = "" | "set" | "clear";

export type ScriptBand = "" | "palm" | "kit" | "web" | "plain";

export type ScriptTone = "" | "gilt" | "ink" | "ivory" | "plain";

export type ScriptShape = "all" | "catalog" | "wide" | "gilt";

export type ScriptValue =
  | { lastUserAgent?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; email?: unknown; phone?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type ScriptRow = { id: string; note?: ScriptValue; label?: string | null };

export type ScriptBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "cue", "pin", "unpin", "hold", "lift", "close", "open", "bay", "mark", "rest"] as const;

const BAYS = ["north", "south", "court"] as const;

const CUES = ["seated", "called", "bowed"] as const;

const CUE_ORDER = ["", "seated", "called", "bowed"] as const;

const PEAK_HOURS = new Set([4, 5]);

const QUIET_HOURS = new Set([0, 11]);

const HOUSE = new Set(["NORTH", "COURT"]);

const SCRIPT_BANDS = ["palm", "kit", "web", "plain"] as const;

const TONES = ["gilt", "ink", "ivory", "plain"] as const;

const CATALOG = new Set(["crm desk", "7fx shell", "ivory browser"]);

const SCRIPT_BLOCK = ["lastIp", "timezone", "username", "email", "phone", "assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name"] as const;

const BENCH_CAP = 6;

const VIEW_CAP = 4;

const MARK_CAP = 2;

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

function bayName(raw: unknown): Exclude<BenchBay, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (BAYS as readonly string[]).includes(text) ? (text as Exclude<BenchBay, "blank">) : "";
}

function cueName(raw: unknown): Exclude<BenchCue, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CUES as readonly string[]).includes(text) ? (text as Exclude<BenchCue, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function benchLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function benchNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank porter stays blank. It is not filled in. */
export function porterLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A bay is NORTH, SOUTH, or COURT. Anything else stays blank. Letters are stored in capitals. */
export function bayOf(raw: unknown): string {
  const name = bayName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An hour is an integer from 0 through 11.
 * A blank value stays unset. 12 is not an hour.
 * A leading zero is not an hour. 0 itself is the first hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 0 || raw > 11) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^(?:[0-9]|1[01])$/.test(text)) return null;
  return Number(text);
}

/** A lamp is 1, 3, or 9. A blank value stays unset. A leading zero is not a lamp. */
export function lampOf(raw: unknown): 1 | 3 | 9 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 9 || raw === "9") return 9;
  return null;
}

/** A wait is 10, 20, or 40 minutes. A blank value stays unset. A leading zero is not a wait. */
export function waitOf(raw: unknown): 10 | 20 | 40 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** A rest is 0, 10, or 20. Anything else is not a rest. 0 clears the rest. */
export function restOf(raw: unknown): 0 | 10 | 20 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  return null;
}

export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 7) return "mid";
  return "late";
}

/** Peak hours are 4 and 5. An unset hour is not a peak hour. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 0 and 11. A peak hour is not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * How far an hour sits behind the desk hour.
 * A positive gap means the bench hour is behind. A negative gap means it is ahead.
 * A gap of zero means the same hour. An unset hour has no gap. Hours do not wrap.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** NORTH and COURT are house bays. SOUTH is a guest bay. A blank bay is not a house bay. */
export function houseBay(bay: unknown): boolean {
  return HOUSE.has(bayOf(bay));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): BenchDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): BenchSort {
  return raw === "title" ? "title" : "hour";
}

function markOf(raw: unknown): string {
  const text = clip(raw, 2);
  return /^[0-9]$/.test(text) ? text : "";
}

function marksOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const mark = markOf(part);
    if (mark && !out.includes(mark)) out.push(mark);
    if (out.length >= MARK_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): VestibuleBench | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<VestibuleBench>;
  const id = clip(row.id, 24);
  const title = benchLine(row.title);
  if (!id || !title) return null;
  const rest = restOf(row.rest);
  return {
    id,
    title,
    note: benchNote(row.note),
    porter: porterLabel(row.porter),
    hour: hourOf(row.hour),
    bay: bayOf(row.bay),
    cue: cueName(row.cue),
    lamp: lampOf(row.lamp),
    wait: waitOf(row.wait),
    marks: marksOf(row.marks),
    rest: rest === null ? 0 : rest,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readBenches(raw: unknown): VestibuleBench[] {
  if (!Array.isArray(raw)) return [];
  const out: VestibuleBench[] = [];
  for (const item of raw) {
    const bench = readOne(item);
    if (!bench || out.some((row) => row.id === bench.id || row.title === bench.title)) continue;
    out.push(bench);
  }
  return out.slice(0, BENCH_CAP);
}

export function addBench(
  benches: readonly VestibuleBench[],
  bench: {
    id: string;
    title: string;
    note?: string;
    porter?: string;
    hour?: unknown;
    bay?: string;
    cue?: string;
    lamp?: unknown;
    wait?: unknown;
    marks?: unknown;
    rest?: unknown;
  },
): VestibuleBench[] {
  const current = readBenches(benches);
  const id = String(bench.id || "").trim();
  const title = benchLine(bench.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rest = restOf(bench.rest);
  const next: VestibuleBench = {
    id,
    title,
    note: benchNote(bench.note),
    porter: porterLabel(bench.porter),
    hour: hourOf(bench.hour),
    bay: bayOf(bench.bay),
    cue: cueName(bench.cue),
    lamp: lampOf(bench.lamp),
    wait: waitOf(bench.wait),
    marks: marksOf(bench.marks),
    rest: rest === null ? 0 : rest,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BENCH_CAP);
}

export function cycleCue(benches: readonly VestibuleBench[], id: string): VestibuleBench[] {
  return readBenches(benches).map((bench) => {
    if (bench.id !== id) return bench;
    const at = CUE_ORDER.indexOf(bench.cue as (typeof CUE_ORDER)[number]);
    const next = at < 0 || at >= CUES.length ? CUES[0] : CUES[at % CUES.length];
    if (!next || next === bench.cue) return bench;
    return { ...bench, cue: next, audit: "cue" };
  });
}

/** A blank title is left as it is. */
export function editBench(benches: readonly VestibuleBench[], id: string, title: unknown): VestibuleBench[] {
  const next = benchLine(title);
  if (!next) return readBenches(benches);
  const current = readBenches(benches);
  if (current.some((bench) => bench.id !== id && bench.title === next)) return current;
  return current.map((bench) => (bench.id === id && bench.title !== next ? { ...bench, title: next, audit: "edit" } : bench));
}

/** A blank note is left as it is. */
export function editBenchNote(benches: readonly VestibuleBench[], id: string, note: unknown): VestibuleBench[] {
  const next = benchNote(note);
  if (!next) return readBenches(benches);
  return readBenches(benches).map((bench) => (bench.id === id && bench.note !== next ? { ...bench, note: next, audit: "edit" } : bench));
}

/** A mark that is already on the bench, or a third mark, is left out. A mark is one digit. */
export function addBenchMark(benches: readonly VestibuleBench[], id: string, mark: unknown): VestibuleBench[] {
  const next = markOf(mark);
  if (!next) return readBenches(benches);
  return readBenches(benches).map((bench) => {
    if (bench.id !== id || bench.marks.includes(next) || bench.marks.length >= MARK_CAP) return bench;
    return { ...bench, marks: [...bench.marks, next], audit: "mark" };
  });
}

/** An unknown rest is left as it is. 0 clears the rest. */
export function setBenchRest(benches: readonly VestibuleBench[], id: string, rest: unknown): VestibuleBench[] {
  const next = restOf(rest);
  if (next === null) return readBenches(benches);
  return readBenches(benches).map((bench) => (bench.id === id && bench.rest !== next ? { ...bench, rest: next, audit: "rest" } : bench));
}

export function setBenchPin(benches: readonly VestibuleBench[], id: string, pinned: boolean): VestibuleBench[] {
  return readBenches(benches).map((bench) => (bench.id === id && bench.pinned !== pinned ? { ...bench, pinned, audit: pinned ? "pin" : "unpin" } : bench));
}

/** P toggles the pin on the focused row of the wall currently shown. */
export function pinFocused(benches: readonly VestibuleBench[], shownIds: readonly string[], index: number): VestibuleBench[] {
  if (!shownIds.length) return readBenches(benches);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readBenches(benches).find((bench) => bench.id === id);
  if (!row) return readBenches(benches);
  return setBenchPin(benches, id, !row.pinned);
}

export function setBenchHold(benches: readonly VestibuleBench[], id: string, held: boolean): VestibuleBench[] {
  return readBenches(benches).map((bench) => (bench.id === id && bench.held !== held ? { ...bench, held, audit: held ? "hold" : "lift" } : bench));
}

export function setBenchClose(benches: readonly VestibuleBench[], id: string, closed: boolean): VestibuleBench[] {
  return readBenches(benches).map((bench) => (bench.id === id && bench.closed !== closed ? { ...bench, closed, audit: closed ? "close" : "open" } : bench));
}

export function bulkBenchBay(benches: readonly VestibuleBench[], ids: readonly string[], bay: unknown): VestibuleBench[] {
  const next = bayOf(bay);
  if (!next) return readBenches(benches);
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.bay !== next ? { ...bench, bay: next, audit: "bay" } : bench));
}

export function bulkBenchPin(benches: readonly VestibuleBench[], ids: readonly string[], pinned: boolean): VestibuleBench[] {
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.pinned !== pinned ? { ...bench, pinned, audit: pinned ? "pin" : "unpin" } : bench));
}

export function bulkBenchClose(benches: readonly VestibuleBench[], ids: readonly string[], closed: boolean): VestibuleBench[] {
  const picked = new Set(ids);
  return readBenches(benches).map((bench) => (picked.has(bench.id) && bench.closed !== closed ? { ...bench, closed, audit: closed ? "close" : "open" } : bench));
}

export function bulkBenchMark(benches: readonly VestibuleBench[], ids: readonly string[], mark: unknown): VestibuleBench[] {
  return ids.reduce((rows, id) => addBenchMark(rows, id, mark), readBenches(benches));
}

export function resetBenches(): VestibuleBench[] {
  return [];
}

function inTray(bench: VestibuleBench, tray: BenchTray): boolean {
  if (tray === "closed") return bench.closed;
  if (tray === "held") return bench.held && !bench.closed;
  return !bench.held && !bench.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open bench whose hour sits more than two hours behind the desk hour. A rest, a hold, or a close is not late. */
export function lateBench(bench: VestibuleBench, desk: unknown): boolean {
  const gap = hourGap(bench.hour, desk);
  return inTray(bench, "open") && bench.rest === 0 && gap !== null && gap > 2;
}

/** An open bench with a wait of 10 is due now. A rest, a hold, or a close is not. */
export function soonBench(bench: VestibuleBench): boolean {
  return inTray(bench, "open") && bench.rest === 0 && bench.wait === 10;
}

/** Open benches that are late or due now. A resting bench stays off the reminder list. */
export function reminderBenches(benches: readonly VestibuleBench[], desk: unknown): VestibuleBench[] {
  return readBenches(benches).filter((bench) => lateBench(bench, desk) || soonBench(bench));
}

/** Open benches whose hour sits within one hour of the desk hour. A rest, a hold, or a close stays out. */
export function windowBenches(benches: readonly VestibuleBench[], desk: unknown): VestibuleBench[] {
  return readBenches(benches).filter((bench) => {
    const gap = hourGap(bench.hour, desk);
    return inTray(bench, "open") && bench.rest === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Search matches the title, the note, the porter, and the marks. */
export function visibleBenches(
  benches: readonly VestibuleBench[],
  tray: BenchTray,
  query: string,
  porter: string | null,
  bay: string | null,
  cue: string | null,
  exact: number | null,
  pick: HourPick | null,
  lamp: number | "blank" | null,
  wait: number | "blank" | null,
  bowedOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): VestibuleBench[] {
  const text = query.trim().toLowerCase();
  return readBenches(benches).filter((bench) => {
    if (!inTray(bench, tray)) return false;
    if (text) {
      const hay = `${bench.title} ${bench.note} ${bench.porter} ${bench.marks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (porter !== null && bench.porter !== porter) return false;
    if (bay === "blank" ? Boolean(bench.bay) : bay && bench.bay !== bay) return false;
    if (cue === "blank" ? Boolean(bench.cue) : cue && bench.cue !== cue) return false;
    if (!hourHit(bench.hour, exact, pick)) return false;
    if (lamp === "blank" ? bench.lamp !== null : lamp !== null && bench.lamp !== lamp) return false;
    if (wait === "blank" ? bench.wait !== null : wait !== null && bench.wait !== wait) return false;
    if (bowedOnly && bench.cue !== "bowed") return false;
    if (peakOnly && !peakHour(bench.hour)) return false;
    if (houseOnly && !houseBay(bench.bay)) return false;
    if (quietOnly && !quietHour(bench.hour)) return false;
    if (awakeOnly && bench.rest !== 0) return false;
    return true;
  });
}

export function sortBenches(benches: readonly VestibuleBench[], mode: BenchSort): VestibuleBench[] {
  const rows = benches.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.hour ?? 99) - (b.hour ?? 99));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function benchTimeline(benches: readonly VestibuleBench[], query: string): VestibuleBench[] {
  const text = query.trim().toLowerCase();
  return sortBenches(
    readBenches(benches).filter((bench) => bench.hour !== null && (!text || bench.title.toLowerCase().includes(text))),
    "hour",
  );
}

export function benchCounts(benches: readonly VestibuleBench[], desk: unknown): BenchCounts {
  const rows = readBenches(benches);
  return {
    open: rows.filter((bench) => inTray(bench, "open")).length,
    held: rows.filter((bench) => inTray(bench, "held")).length,
    closed: rows.filter((bench) => inTray(bench, "closed")).length,
    pinned: rows.filter((bench) => bench.pinned).length,
    peak: rows.filter((bench) => inTray(bench, "open") && bench.rest === 0 && peakHour(bench.hour)).length,
    late: rows.filter((bench) => lateBench(bench, desk)).length,
    soon: rows.filter((bench) => soonBench(bench)).length,
    rest: rows.filter((bench) => inTray(bench, "open") && bench.rest > 0).length,
    house: rows.filter((bench) => inTray(bench, "open") && houseBay(bench.bay)).length,
    window: windowBenches(rows, desk).length,
  };
}

export function benchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open benches as a share of every open bench. */
export function lateShare(benches: readonly VestibuleBench[], desk: unknown): number {
  const rows = readBenches(benches);
  const open = rows.filter((bench) => inTray(bench, "open")).length;
  const late = rows.filter((bench) => lateBench(bench, desk)).length;
  return benchShare(late, open);
}

/** Distinct hours on open benches. */
export function usedHours(benches: readonly VestibuleBench[]): number {
  const hours = new Set<number>();
  for (const bench of readBenches(benches)) {
    if (inTray(bench, "open") && bench.hour !== null) hours.add(bench.hour);
  }
  return hours.size;
}

/** Open benches that share an hour and a bay. A different bay on the same hour is not a clash. */
export function clashHourCount(benches: readonly VestibuleBench[]): number {
  const groups = new Map<string, number>();
  for (const bench of readBenches(benches)) {
    if (!inTray(bench, "open") || bench.hour === null || !bench.bay) continue;
    const key = `${bench.hour}:${bench.bay}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open benches that share a lamp. An unset lamp is not a clash. */
export function lampClashCount(benches: readonly VestibuleBench[]): number {
  const groups = new Map<number, number>();
  for (const bench of readBenches(benches)) {
    if (!inTray(bench, "open") || bench.lamp === null) continue;
    groups.set(bench.lamp, (groups.get(bench.lamp) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open benches on the same bay whose hours differ by two.
 * The count is the benches that have at least one neighbor.
 */
export function adjacentBenchCount(benches: readonly VestibuleBench[]): number {
  const open = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.hour !== null && bench.bay);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.bay === right.bay && Math.abs((left.hour ?? 0) - (right.hour ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The bay with the fewest open benches.
 * A tie keeps SOUTH, then NORTH, then COURT.
 * An empty desk still suggests SOUTH.
 */
export function suggestBay(benches: readonly VestibuleBench[]): "SOUTH" | "NORTH" | "COURT" {
  const rows = readBenches(benches).filter((bench) => inTray(bench, "open"));
  const order = ["SOUTH", "NORTH", "COURT"] as const;
  let best: "SOUTH" | "NORTH" | "COURT" = "SOUTH";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const bay of order) {
    const count = rows.filter((bench) => bench.bay === bay).length;
    if (count < bestCount) {
      best = bay;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The wait with the fewest open benches.
 * A tie keeps 20, then 10, then 40.
 * An empty desk still suggests 20.
 */
export function suggestWait(benches: readonly VestibuleBench[]): 10 | 20 | 40 {
  const rows = readBenches(benches).filter((bench) => inTray(bench, "open"));
  const order = [20, 10, 40] as const;
  let best: 10 | 20 | 40 = 20;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wait of order) {
    const count = rows.filter((bench) => bench.wait === wait).length;
    if (count < bestCount) {
      best = wait;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open porter. A blank porter is skipped. An empty desk stays blank. */
export function suggestPorter(benches: readonly VestibuleBench[]): string {
  const found = readBenches(benches).find((bench) => inTray(bench, "open") && bench.porter);
  return found ? found.porter : "";
}

/**
 * The porter carrying the fewest open benches.
 * A tie keeps the earlier name. A blank porter is not a load.
 * An empty roster falls back to the newest porter.
 */
export function fairPorter(benches: readonly VestibuleBench[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = porterLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestPorter(benches);
  const open = readBenches(benches).filter((bench) => inTray(bench, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((bench) => bench.porter === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The porter with the most open benches. A tie keeps the newer name on the desk. */
export function busiestPorter(benches: readonly VestibuleBench[]): string {
  const rows = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.porter);
  const names: string[] = [];
  for (const bench of rows) if (!names.includes(bench.porter)) names.push(bench.porter);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((bench) => bench.porter === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function benchPorters(benches: readonly VestibuleBench[]): string[] {
  const out: string[] = [];
  for (const bench of readBenches(benches)) {
    if (bench.porter && !out.includes(bench.porter)) out.push(bench.porter);
  }
  return out;
}

export function benchBays(benches: readonly VestibuleBench[]): string[] {
  const out: string[] = [];
  for (const bench of readBenches(benches)) {
    if (bench.bay && !out.includes(bench.bay)) out.push(bench.bay);
  }
  return out;
}

/**
 * The next open bench at or after the desk hour.
 * A bowed cue, a rest, a hold, and a close stay off the list.
 * When every open hour is behind, the earliest hour is next.
 */
export function nextBench(benches: readonly VestibuleBench[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readBenches(benches).filter((bench) => inTray(bench, "open") && bench.hour !== null && bench.cue !== "bowed" && bench.rest === 0);
  if (!waiting.length) return "";
  const byHour = (a: VestibuleBench, b: VestibuleBench) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((bench) => (bench.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function benchCopy(bench: VestibuleBench, desk: unknown): string {
  const gap = hourGap(bench.hour, desk);
  return [bench.title, bench.porter, bench.hour ?? "", bench.bay, bench.cue, bench.lamp ?? "", bench.wait ?? "", bench.marks.join(" "), bench.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the benches saved in this browser. The gap and the late mark use the hour you pass. */
export function benchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,porter,hour,bay,cue,lamp,wait,marks,rest,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readBenches(raw);
  const windowIds = new Set(windowBenches(rows, desk).map((bench) => bench.id));
  for (const bench of rows) {
    const gap = hourGap(bench.hour, desk);
    lines.push([
      bench.title,
      bench.porter,
      bench.hour === null ? "" : String(bench.hour),
      bench.bay,
      bench.cue,
      bench.lamp === null ? "" : String(bench.lamp),
      bench.wait === null ? "" : String(bench.wait),
      bench.marks.join(" "),
      String(bench.rest),
      bench.pinned ? "1" : "0",
      bench.held ? "1" : "0",
      bench.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBench(bench, desk) ? "1" : "0",
      soonBench(bench) ? "1" : "0",
      houseBay(bench.bay) ? "1" : "0",
      windowIds.has(bench.id) ? "1" : "0",
      bench.note,
      bench.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activePorter(raw: string, porters: readonly string[]): string {
  if (raw === "blank") return "blank";
  return porters.includes(raw) ? raw : "all";
}

export function activeBay(raw: string, bays: readonly string[]): string {
  if (raw === "blank") return "blank";
  const bay = bayOf(raw);
  return bay && bays.includes(bay) ? bay : "all";
}

export function activeCue(raw: string, cues: readonly string[]): string {
  if (raw === "blank") return "blank";
  const cue = cueName(raw);
  return cue && cues.includes(cue) ? cue : "all";
}

export function activeHour(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const hour = hourOf(raw);
  return hour === null ? "all" : String(hour);
}

export function activeLamp(raw: string): string {
  if (raw === "blank") return "blank";
  const lamp = lampOf(raw);
  return lamp === null ? "all" : String(lamp);
}

export function activeWait(raw: string): string {
  if (raw === "blank") return "blank";
  const wait = waitOf(raw);
  return wait === null ? "all" : String(wait);
}

export function porterArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function bayArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return bayOf(filter) || null;
}

export function cueArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cueName(filter) || null;
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: hourOf(filter), pick: null };
}

export function lampArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lampOf(filter);
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return waitOf(filter);
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
    porter: row.porter === "blank" ? "blank" : clip(row.porter, 14) || "all",
    bay: row.bay === "blank" || row.bay === "all" ? (row.bay === "blank" ? "blank" : "all") : bayOf(row.bay) || "all",
    cue: row.cue === "blank" || row.cue === "all" ? (row.cue === "blank" ? "blank" : "all") : cueName(row.cue) || "all",
    hour: activeHour(String(row.hour || "all")),
    lamp: activeLamp(String(row.lamp || "all")),
    wait: activeWait(String(row.wait || "all")),
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

function scriptBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 96);
}

function scriptText(value: ScriptValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: scriptBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (SCRIPT_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("lastUserAgent" in value)) return { text: null, explicit: false };
  const inner = value.lastUserAgent;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: scriptBody(inner), explicit: true };
}

export function scriptState(value: ScriptValue): ScriptState {
  const found = scriptText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function scriptCopy(value: ScriptValue): string {
  const found = scriptText(value);
  if (!found.text) return "";
  return found.text;
}

/**
 * A kit token keeps the first letter of the product and the first digit of the version.
 * A script with no kit token keeps the first mark and the last mark.
 */
export function scriptOf(value: ScriptValue): string {
  const text = scriptCopy(value);
  if (!text) return "";
  const stripped = text.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const tokens = stripped.split(" ").filter((part) => part.length > 0);
  const kits = tokens.filter((token) => token.includes("/") && /[A-Za-z]/.test(token.split("/")[0] || ""));
  if (kits.length) {
    const last = kits[kits.length - 1];
    const [name, version = ""] = last.split("/");
    const letters = name.match(/[A-Za-z]/g) || [];
    const letter = letters[0] ? letters[0].toUpperCase() : "";
    const digit = (version.match(/\d/) || [""])[0];
    if (letter && digit) return letter + digit;
    if (letter && letters.length > 1) return letter + letters[letters.length - 1].toUpperCase();
    return letter;
  }
  const marks = text.match(/[A-Za-z0-9]/g);
  if (!marks || !marks.length) return "";
  const first = marks[0].toUpperCase();
  if (marks.length === 1) return first;
  return first + marks[marks.length - 1].toUpperCase();
}

/** Mobile, Android, iPhone, and iPad are palm. Bot, Spider, and Crawl are web. A slash is a kit. Any other mark is plain. */
export function scriptBand(value: ScriptValue): ScriptBand {
  const mark = scriptOf(value);
  if (!mark) return "";
  const text = scriptCopy(value);
  if (/Mobile|Android|iPhone|iPad/i.test(text)) return "palm";
  if (/Bot|Spider|Crawl/i.test(text)) return "web";
  if (text.includes("/")) return "kit";
  return "plain";
}

/**
 * Chrome without Edg is gilt. Firefox is ink. Safari without Chrome is ivory.
 * Every other marked script is plain.
 */
export function scriptTone(value: ScriptValue): ScriptTone {
  const text = scriptCopy(value);
  if (!text || !scriptOf(value)) return "";
  if (/Chrome/i.test(text) && !/Edg/i.test(text)) return "gilt";
  if (/Firefox/i.test(text)) return "ink";
  if (/Safari/i.test(text) && !/Chrome/i.test(text)) return "ivory";
  return "plain";
}

/** CRM Desk, 7FX Shell, and Ivory Browser are the house catalog. Any other script is not. */
export function catalogScript(value: ScriptValue): boolean {
  const text = scriptCopy(value).toLowerCase().replace(/\s+/g, " ").trim();
  return CATALOG.has(text);
}

export function catalogScriptCount(rows: readonly ScriptRow[]): number {
  return rows.filter((row) => catalogScript(row.note)).length;
}

export function wideScriptCount(rows: readonly ScriptRow[]): number {
  return rows.filter((row) => scriptCopy(row.note).length > 40).length;
}

export function giltScriptCount(rows: readonly ScriptRow[]): number {
  return rows.filter((row) => scriptTone(row.note) === "gilt").length;
}

/** Customers whose mark is shared with at least one other customer. */
export function sharedScriptCount(rows: readonly ScriptRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = scriptOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function scriptBands(rows: readonly ScriptRow[]): ScriptBandLine[] {
  return SCRIPT_BANDS.map((band) => ({ band, count: rows.filter((row) => scriptBand(row.note) === band).length }));
}

/** The band with the most set scripts. A tie keeps palm, then kit, then web, then plain. */
export function leadingScript(rows: readonly ScriptRow[]): string {
  const lines = scriptBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || SCRIPT_BANDS.indexOf(a.band as (typeof SCRIPT_BANDS)[number]) - SCRIPT_BANDS.indexOf(b.band as (typeof SCRIPT_BANDS)[number]))[0].band;
}

/** The tone with the most set scripts. A tie keeps gilt, then ink, then ivory, then plain. */
export function leadingScriptTone(rows: readonly ScriptRow[]): string {
  const counts = TONES.map((tone) => ({ tone, count: rows.filter((row) => scriptTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  return live.slice().sort((a, b) => b.count - a.count || TONES.indexOf(a.tone) - TONES.indexOf(b.tone))[0].tone;
}

export function scriptShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentScripts(rows: readonly ScriptRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = scriptState(row.note);
    const band = state === "set" ? scriptBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenScripts(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedScripts(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleScript(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleScriptReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkScriptReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleScriptBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleScriptCustomers(
  rows: readonly ScriptRow[],
  band: ScriptBand | "blank" | null,
  tone: ScriptTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: ScriptShape,
): ScriptRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = scriptState(row.note);
    const mark = state === "set" ? scriptBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && scriptTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogScript(row.note)) return false;
    if (shape === "wide" && scriptCopy(row.note).length <= 40) return false;
    if (shape === "gilt" && scriptTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${scriptCopy(row.note)} ${scriptOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeScriptBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeScriptTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "plain" ? raw : "all";
}

export function scriptBandArg(filter: string): ScriptBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "palm" || filter === "kit" || filter === "web" || filter === "plain") return filter;
  return null;
}

export function scriptToneArg(filter: string): ScriptTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "plain") return filter;
  return null;
}

export function scriptsCsv(rows: readonly ScriptRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of scriptBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogScriptCount(rows)}`);
  lines.push(`wide,wide,${wideScriptCount(rows)}`);
  lines.push(`tone,gilt,${giltScriptCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => scriptTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => scriptTone(row.note) === "ivory").length}`);
  lines.push(`tone,plain,${rows.filter((row) => scriptTone(row.note) === "plain").length}`);
  return lines.join("\n");
}

export function scriptRowsCsv(rows: readonly ScriptRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,script,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = scriptState(row.note);
    const band = state === "set" ? scriptBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      scriptOf(row.note),
      band,
      state === "set" ? scriptTone(row.note) : "",
      catalogScript(row.note) ? "1" : "0",
      scriptCopy(row.note).length > 40 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
