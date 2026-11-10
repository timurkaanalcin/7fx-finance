/**
 * Visit passes for the retention desk, and the broker name already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_visit_pass (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   minute integer,
 *   manner text not null default '',
 *   wing text not null default '',
 *   phase text not null default '',
 *   rank integer,
 *   span integer,
 *   tags text not null default '',
 *   pause integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_broker_plate_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_broker_plate_review (
 *   customer_id text primary key
 * );
 */

export const VPS_KEY = "crmv4-visit-pass";
export const VPS_VIEW_KEY = "crmv4-visit-views";
export const VPS_DENSITY_KEY = "crmv4-visit-density";
export const PLATE_KEY = "crmv4-broker-plate-hide";
export const PLATE_REVIEW_KEY = "crmv4-broker-plate-review";

export type VpsManner = "blank" | "quiet" | "bright" | "formal" | "open";

export type VpsPhase = "blank" | "wait" | "seat" | "leave";

export type VpsTray = "open" | "held" | "closed";

export type MinutePick = "blank" | "dawn" | "day" | "night" | "peak" | "quiet";

export type VpsDensity = "roomy" | "tight";

export type VpsSort = "minute" | "title";

export type VisitPass = {
  id: string;
  title: string;
  note: string;
  host: string;
  minute: number | null;
  manner: string;
  wing: string;
  phase: string;
  rank: number | null;
  span: number | null;
  tags: string[];
  pause: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type VpsView = {
  id: string;
  name: string;
  tray: VpsTray;
  query: string;
  host: string;
  manner: string;
  wing: string;
  phase: string;
  minute: string;
  rank: string;
  span: string;
};

export type VpsCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  paused: number;
  house: number;
};

export type PlateState = "" | "set" | "clear";

export type PlateBand = "" | "trio" | "quad" | "span";

export type PlateTone = "" | "soft" | "hard";

export type PlateShape = "all" | "catalog" | "span" | "soft";

export type PlateValue =
  | { brokerName?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type PlateRow = { id?: string; note?: PlateValue; label?: string | null };

export type PlateBandLine = { band: string; count: number };

export type PlateToneLine = { tone: string; count: number };

const AUDITS = ["save", "edit", "phase", "pin", "unpin", "hold", "lift", "close", "reopen", "manner", "tag", "pause"] as const;

const MANNERS = ["quiet", "bright", "formal", "open"] as const;

const PHASES = ["wait", "seat", "leave"] as const;

const PHASE_ORDER = ["", "wait", "seat", "leave"] as const;

const MINUTE_PICKS = ["blank", "dawn", "day", "night", "peak", "quiet"] as const;

const PEAK_MINUTES = new Set([15, 45]);

const QUIET_MINUTES = new Set([2, 4]);

const DAWN_MINUTES = new Set([5, 6, 7]);

const NIGHT_MINUTES = new Set([50, 51, 52]);

const HOUSE = new Set(["PA", "RM", "LX"]);

const PLATE_BANDS = ["trio", "quad", "span"] as const;

const TONE_MARKS = ["soft", "hard"] as const;

const CATALOG = new Set(["ACM", "IBKR", "SAXO"]);

const PLATE_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const PASS_CAP = 6;

const VIEW_CAP = 3;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VpsTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function mannerName(raw: unknown): Exclude<VpsManner, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (MANNERS as readonly string[]).includes(text) ? (text as Exclude<VpsManner, "blank">) : "";
}

function phaseName(raw: unknown): Exclude<VpsPhase, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (PHASES as readonly string[]).includes(text) ? (text as Exclude<VpsPhase, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function passLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function passNote(raw: unknown): string {
  return clip(raw, 60);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A wing is two letters. Anything else stays blank. Letters are stored in capitals. */
export function wingOf(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A minute is an integer from 0 through 59.
 * A blank value stays unset. 60 is not a minute.
 * A leading zero is not a minute. The first minute is 0.
 */
export function minuteOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 0 || raw > 59) return null;
    return raw;
  }
  const text = clip(raw, 4);
  if (!/^(0|[1-9]\d?)$/.test(text)) return null;
  const value = Number(text);
  return value <= 59 ? value : null;
}

/** A rank is 2, 4, or 8. A blank value stays unset. A leading zero is not a rank. */
export function rankOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

/** A span is 15, 30, or 45 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 15 | 30 | 45 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** A pause is 0, 15, or 30 minutes. Anything else stays unset. */
export function pauseOf(raw: unknown): 0 | 15 | 30 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  return null;
}

/** Night is 50, 51, and 52. Dawn is 5, 6, and 7. Every other minute is day. */
export function minuteBand(minute: unknown): "blank" | "night" | "dawn" | "day" {
  const value = minuteOf(minute);
  if (value === null) return "blank";
  if (NIGHT_MINUTES.has(value)) return "night";
  if (DAWN_MINUTES.has(value)) return "dawn";
  return "day";
}

/** Peak minutes are 15 and 45. An unset minute is not a peak. */
export function peakMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && PEAK_MINUTES.has(value);
}

/** Quiet minutes are 2 and 4. 15 and 45 are not quiet. An unset minute is not quiet. */
export function quietMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && QUIET_MINUTES.has(value);
}

/**
 * The shortest signed step from the saved minute to the typed minute.
 * The ring wraps at 60. A step of 30 stays. A step of -30 stays.
 */
export function minuteGap(minute: unknown, desk: unknown): number | null {
  const from = minuteOf(minute);
  const at = minuteOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 30) diff -= 60;
  if (diff < -30) diff += 60;
  return diff;
}

/** PA, RM, and LX are house wings. A blank wing is not. */
export function houseWing(wing: unknown): boolean {
  return HOUSE.has(wingOf(wing));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): VpsDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Minute or title. Anything else stays on the minute. */
export function sortMode(raw: unknown): VpsSort {
  return raw === "title" ? "title" : "minute";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return /^[a-z]+$/.test(text) ? text : "";
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

function readOne(raw: unknown): VisitPass | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<VisitPass>;
  const id = clip(row.id, 24);
  const title = passLine(row.title);
  if (!id || !title) return null;
  const pause = pauseOf(row.pause);
  return {
    id,
    title,
    note: passNote(row.note),
    host: hostLabel(row.host),
    minute: minuteOf(row.minute),
    manner: mannerName(row.manner),
    wing: wingOf(row.wing),
    phase: phaseName(row.phase),
    rank: rankOf(row.rank),
    span: spanOf(row.span),
    tags: tagsOf(row.tags),
    pause: pause === null ? 0 : pause,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readPasses(raw: unknown): VisitPass[] {
  if (!Array.isArray(raw)) return [];
  const out: VisitPass[] = [];
  for (const item of raw) {
    const pass = readOne(item);
    if (!pass || out.some((row) => row.id === pass.id || row.title === pass.title)) continue;
    out.push(pass);
  }
  return out.slice(0, PASS_CAP);
}

export function addPass(
  passes: readonly VisitPass[],
  pass: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    minute?: unknown;
    manner?: string;
    wing?: string;
    phase?: string;
    rank?: unknown;
    span?: unknown;
    tags?: unknown;
    pause?: unknown;
  },
): VisitPass[] {
  const current = readPasses(passes);
  const id = String(pass.id || "").trim();
  const title = passLine(pass.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const pause = pauseOf(pass.pause);
  const next: VisitPass = {
    id,
    title,
    note: passNote(pass.note),
    host: hostLabel(pass.host),
    minute: minuteOf(pass.minute),
    manner: mannerName(pass.manner),
    wing: wingOf(pass.wing),
    phase: phaseName(pass.phase),
    rank: rankOf(pass.rank),
    span: spanOf(pass.span),
    tags: tagsOf(pass.tags),
    pause: pause === null ? 0 : pause,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, PASS_CAP);
}

export function cyclePhase(passes: readonly VisitPass[], id: string): VisitPass[] {
  return readPasses(passes).map((pass) => {
    if (pass.id !== id) return pass;
    const at = PHASE_ORDER.indexOf(pass.phase as (typeof PHASE_ORDER)[number]);
    const next = at < 0 || at >= PHASES.length ? PHASES[0] : PHASES[at % PHASES.length];
    if (!next || next === pass.phase) return pass;
    return { ...pass, phase: next, audit: "phase" };
  });
}

export function setPassPin(passes: readonly VisitPass[], id: string, pinned: boolean): VisitPass[] {
  return readPasses(passes).map((pass) => (pass.id === id ? { ...pass, pinned, audit: pinned ? "pin" : "unpin" } : pass));
}

export function setPassHold(passes: readonly VisitPass[], id: string, held: boolean): VisitPass[] {
  return readPasses(passes).map((pass) => (pass.id === id ? { ...pass, held, audit: held ? "hold" : "lift" } : pass));
}

export function setPassClose(passes: readonly VisitPass[], id: string, closed: boolean): VisitPass[] {
  return readPasses(passes).map((pass) => (pass.id === id ? { ...pass, closed, audit: closed ? "close" : "reopen" } : pass));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editPass(passes: readonly VisitPass[], id: string, title: string): VisitPass[] {
  const current = readPasses(passes);
  const next = passLine(title);
  if (!next || current.some((pass) => pass.id !== id && pass.title === next)) return current;
  return current.map((pass) => (pass.id === id && pass.title !== next ? { ...pass, title: next, audit: "edit" } : pass));
}

/** A blank note is left out. The same note is left as it is. */
export function editPassNote(passes: readonly VisitPass[], id: string, note: string): VisitPass[] {
  const current = readPasses(passes);
  const next = passNote(note);
  if (!next) return current;
  return current.map((pass) => (pass.id === id && pass.note !== next ? { ...pass, note: next, audit: "edit" } : pass));
}

/** A tag that is already on the pass, or a third tag, is left out. */
export function addPassTag(passes: readonly VisitPass[], id: string, tag: unknown): VisitPass[] {
  const next = tagOf(tag);
  if (!next) return readPasses(passes);
  return readPasses(passes).map((pass) => {
    if (pass.id !== id || pass.tags.includes(next) || pass.tags.length >= TAG_CAP) return pass;
    return { ...pass, tags: [...pass.tags, next], audit: "tag" };
  });
}

export function dropPassTag(passes: readonly VisitPass[], id: string, tag: unknown): VisitPass[] {
  const next = tagOf(tag);
  if (!next) return readPasses(passes);
  return readPasses(passes).map((pass) => {
    if (pass.id !== id || !pass.tags.includes(next)) return pass;
    return { ...pass, tags: pass.tags.filter((item) => item !== next), audit: "tag" };
  });
}

/** An unknown pause is left as it is. 0 clears the pause. */
export function setPassPause(passes: readonly VisitPass[], id: string, pause: unknown): VisitPass[] {
  const next = pauseOf(pause);
  if (next === null) return readPasses(passes);
  return readPasses(passes).map((pass) => (pass.id === id && pass.pause !== next ? { ...pass, pause: next, audit: "pause" } : pass));
}

export function bulkPassManner(passes: readonly VisitPass[], ids: readonly string[], manner: unknown): VisitPass[] {
  const next = mannerName(manner);
  if (!next) return readPasses(passes);
  const picked = new Set(ids);
  return readPasses(passes).map((pass) => (picked.has(pass.id) && pass.manner !== next ? { ...pass, manner: next, audit: "manner" } : pass));
}

export function bulkPassPin(passes: readonly VisitPass[], ids: readonly string[], pinned: boolean): VisitPass[] {
  const picked = new Set(ids);
  return readPasses(passes).map((pass) => (picked.has(pass.id) ? { ...pass, pinned, audit: pinned ? "pin" : "unpin" } : pass));
}

export function bulkPassClose(passes: readonly VisitPass[], ids: readonly string[], closed: boolean): VisitPass[] {
  const picked = new Set(ids);
  return readPasses(passes).map((pass) => (picked.has(pass.id) ? { ...pass, closed, audit: closed ? "close" : "reopen" } : pass));
}

export function bulkPassTag(passes: readonly VisitPass[], ids: readonly string[], tag: unknown): VisitPass[] {
  return ids.reduce((rows, id) => addPassTag(rows, id, tag), readPasses(passes));
}

export function resetPasses(): VisitPass[] {
  return [];
}

function inTray(pass: VisitPass, tray: VpsTray): boolean {
  if (tray === "closed") return pass.closed;
  if (tray === "held") return pass.held && !pass.closed;
  return !pass.held && !pass.closed;
}

function minuteHit(minute: number | null, exact: number | null, pick: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (pick === null) return true;
  if (pick === "blank") return minute === null;
  if (pick === "peak") return peakMinute(minute);
  if (pick === "quiet") return quietMinute(minute);
  return minuteBand(minute) === pick;
}

/** An open pass whose minute sits more than eight steps behind the desk minute. A pause, a hold, or a close is not late. */
export function latePass(pass: VisitPass, desk: unknown): boolean {
  const gap = minuteGap(pass.minute, desk);
  return inTray(pass, "open") && pass.pause === 0 && gap !== null && gap > 8;
}

/** An open pass with a fifteen-minute span is the reminder. A pause, a hold, or a close is not. */
export function soonPass(pass: VisitPass): boolean {
  return inTray(pass, "open") && pass.pause === 0 && pass.span === 15;
}

/** Open passes that are late or soon. A paused pass stays off the reminder list. */
export function reminderPasses(passes: readonly VisitPass[], desk: unknown): VisitPass[] {
  return readPasses(passes).filter((pass) => latePass(pass, desk) || soonPass(pass));
}

/** Search matches the title, the note, the host, and the tags. The minute and the manner are not part of the query. */
export function visiblePasses(
  passes: readonly VisitPass[],
  tray: VpsTray,
  query: string,
  host: string | null,
  manner: VpsManner | null,
  wing: string | null,
  phase: VpsPhase | null,
  exact: number | null,
  pick: MinutePick | null,
  rank: number | "blank" | null,
  span: number | "blank" | null,
  seatedOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): VisitPass[] {
  const text = query.trim().toLowerCase();
  const wantHost = host === null ? null : hostLabel(host);
  return readPasses(passes).filter((pass) => {
    if (!inTray(pass, tray)) return false;
    if (wantHost !== null && pass.host !== wantHost) return false;
    if (manner === "blank" && pass.manner) return false;
    if (manner && manner !== "blank" && pass.manner !== manner) return false;
    if (wing !== null && pass.wing !== wing) return false;
    if (phase === "blank" && pass.phase) return false;
    if (phase && phase !== "blank" && pass.phase !== phase) return false;
    if (!minuteHit(pass.minute, exact, pick)) return false;
    if (rank === "blank" && pass.rank !== null) return false;
    if (typeof rank === "number" && pass.rank !== rank) return false;
    if (span === "blank" && pass.span !== null) return false;
    if (typeof span === "number" && pass.span !== span) return false;
    if (seatedOnly && pass.phase !== "seat") return false;
    if (peakOnly && !peakMinute(pass.minute)) return false;
    if (houseOnly && !houseWing(pass.wing)) return false;
    if (quietOnly && !quietMinute(pass.minute)) return false;
    if (awakeOnly && pass.pause !== 0) return false;
    if (!text) return true;
    return `${pass.title} ${pass.note} ${pass.host} ${pass.tags.join(" ")}`.toLowerCase().includes(text);
  });
}

export function sortPasses(passes: readonly VisitPass[], mode: VpsSort): VisitPass[] {
  const rows = readPasses(passes);
  if (mode === "title") return rows.slice().sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return rows.slice().sort((a, b) => (a.minute ?? 99) - (b.minute ?? 99) || a.title.localeCompare(b.title));
}

export function passTimeline(passes: readonly VisitPass[], query: string): VisitPass[] {
  return sortPasses(visiblePasses(passes, "open", query, null, null, null, null, null, null, null, null, false, false, false, false, false).filter((pass) => pass.minute !== null), "minute");
}

export function passCounts(passes: readonly VisitPass[], desk: unknown): VpsCounts {
  const rows = readPasses(passes);
  return {
    open: rows.filter((pass) => inTray(pass, "open")).length,
    held: rows.filter((pass) => inTray(pass, "held")).length,
    closed: rows.filter((pass) => inTray(pass, "closed")).length,
    pinned: rows.filter((pass) => pass.pinned).length,
    peak: rows.filter((pass) => peakMinute(pass.minute) && inTray(pass, "open")).length,
    late: rows.filter((pass) => latePass(pass, desk)).length,
    soon: rows.filter((pass) => soonPass(pass)).length,
    paused: rows.filter((pass) => inTray(pass, "open") && pass.pause !== 0).length,
    house: rows.filter((pass) => houseWing(pass.wing)).length,
  };
}

export function passShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function mannerCounts(passes: readonly VisitPass[]): { manner: Exclude<VpsManner, "blank">; count: number }[] {
  const rows = readPasses(passes);
  return MANNERS.map((manner) => ({ manner, count: rows.filter((pass) => pass.manner === manner).length })).filter((row) => row.count > 0);
}

export function usedMinutes(passes: readonly VisitPass[]): number {
  return new Set(readPasses(passes).map((pass) => pass.minute).filter((minute): minute is number => minute !== null)).size;
}

export function clashMinuteIds(passes: readonly VisitPass[]): string[] {
  const open = readPasses(passes).filter((pass) => inTray(pass, "open") && pass.minute !== null && pass.manner);
  return open.filter((pass) => open.some((other) => other.id !== pass.id && other.manner === pass.manner && other.minute === pass.minute)).map((pass) => pass.id);
}

export function clashMinuteCount(passes: readonly VisitPass[]): number {
  return clashMinuteIds(passes).length;
}

export function rankClashIds(passes: readonly VisitPass[]): string[] {
  const open = readPasses(passes).filter((pass) => inTray(pass, "open") && pass.rank !== null);
  return open.filter((pass) => open.some((other) => other.id !== pass.id && other.rank === pass.rank)).map((pass) => pass.id);
}

export function rankClashCount(passes: readonly VisitPass[]): number {
  return rankClashIds(passes).length;
}

export function nextPass(passes: readonly VisitPass[], desk: unknown): string {
  const now = minuteOf(desk);
  if (now === null) return "";
  const waiting = readPasses(passes).filter((pass) => inTray(pass, "open") && pass.minute !== null && pass.phase !== "leave" && pass.pause === 0);
  if (!waiting.length) return "";
  const byMinute = (a: VisitPass, b: VisitPass) => (a.minute ?? 0) - (b.minute ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((pass) => (pass.minute ?? 0) >= now).sort(byMinute);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMinute)[0].id;
}

/**
 * The manner with the fewest open passes.
 * A tie keeps open, then quiet, then bright, then formal.
 * Passes with no manner are not a load. An empty desk still suggests open.
 */
export function suggestManner(passes: readonly VisitPass[]): Exclude<VpsManner, "blank"> {
  const rows = readPasses(passes).filter((pass) => inTray(pass, "open"));
  const order = ["open", "quiet", "bright", "formal"] as const;
  let best: Exclude<VpsManner, "blank"> = "open";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const manner of order) {
    const count = rows.filter((pass) => pass.manner === manner).length;
    if (count < bestCount) {
      best = manner;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The host carrying the fewest open passes.
 * A tie keeps the earlier name. A blank host is not a load.
 * An empty desk stays blank.
 */
export function suggestHost(passes: readonly VisitPass[]): string {
  const rows = readPasses(passes).filter((pass) => inTray(pass, "open") && pass.host);
  if (!rows.length) return "";
  const names = passHosts(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((pass) => pass.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The span used most on open passes. A tie keeps 30, then 15, then 45. An empty desk suggests 30. */
export function suggestSpan(passes: readonly VisitPass[]): 15 | 30 | 45 {
  const rows = readPasses(passes).filter((pass) => inTray(pass, "open") && pass.span !== null);
  const order = [30, 15, 45] as const;
  let best: 15 | 30 | 45 = 30;
  let bestCount = -1;
  for (const span of order) {
    const count = rows.filter((pass) => pass.span === span).length;
    if (count > bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

export function fairHost(passes: readonly VisitPass[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = hostLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestHost(passes);
  const open = readPasses(passes).filter((pass) => inTray(pass, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((pass) => pass.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The host carrying the most open passes. A tie keeps the earlier name. A blank host is not a load. */
export function busiestHost(passes: readonly VisitPass[]): string {
  const rows = readPasses(passes).filter((pass) => inTray(pass, "open") && pass.host);
  if (!rows.length) return "";
  const names = passHosts(rows).slice().sort((a, b) => a.localeCompare(b));
  let best = names[0];
  let bestCount = -1;
  for (const name of names) {
    const count = rows.filter((pass) => pass.host === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function passHosts(passes: readonly VisitPass[]): string[] {
  const out: string[] = [];
  for (const pass of readPasses(passes)) {
    if (pass.host && !out.includes(pass.host)) out.push(pass.host);
  }
  return out;
}

export function passWings(passes: readonly VisitPass[]): string[] {
  const out: string[] = [];
  for (const pass of readPasses(passes)) {
    if (pass.wing && !out.includes(pass.wing)) out.push(pass.wing);
  }
  return out;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function passCopy(pass: VisitPass, desk: unknown): string {
  const gap = minuteGap(pass.minute, desk);
  return [pass.title, pass.host, pass.minute ?? "", pass.manner, pass.wing, pass.phase, pass.rank ?? "", pass.span ?? "", pass.tags.join(" "), pass.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the passes saved in this browser. The gap and the late mark use the minute you pass. */
export function passesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,minute,manner,wing,phase,rank,span,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const pass of readPasses(raw)) {
    const gap = minuteGap(pass.minute, desk);
    lines.push([
      csvCell(pass.title),
      csvCell(pass.host),
      pass.minute === null ? "" : String(pass.minute),
      pass.manner,
      csvCell(pass.wing),
      pass.phase,
      pass.rank === null ? "" : String(pass.rank),
      pass.span === null ? "" : String(pass.span),
      csvCell(pass.tags.join(" ")),
      String(pass.pause),
      pass.pinned ? "1" : "0",
      pass.held ? "1" : "0",
      pass.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      latePass(pass, desk) ? "1" : "0",
      soonPass(pass) ? "1" : "0",
      houseWing(pass.wing) ? "1" : "0",
      csvCell(pass.note),
      pass.audit,
    ].join(","));
  }
  return lines.join("\n");
}

function hostSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hostLabel(raw) || "all";
}

function mannerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return mannerName(raw) || "all";
}

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wingOf(raw) || "all";
}

function phaseSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return phaseName(raw) || "all";
}

export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const name = hostLabel(filter);
  return name && hosts.includes(name) ? name : "all";
}

export function activeManner(filter: string, manners: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const manner = mannerName(filter);
  return manner && manners.includes(manner) ? manner : "all";
}

export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingOf(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function activePhase(filter: string, phases: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const phase = phaseName(filter);
  return phase && phases.includes(phase) ? phase : "all";
}

export function activeMinute(filter: string): string {
  if (filter === "all") return "all";
  return (MINUTE_PICKS as readonly string[]).includes(filter) ? filter : "all";
}

export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return filter === "2" || filter === "4" || filter === "8" ? filter : "all";
}

export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  return filter === "15" || filter === "30" || filter === "45" ? filter : "all";
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return hostLabel(filter);
}

export function mannerArg(filter: string): VpsManner | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const manner = mannerName(filter);
  return manner ? manner : null;
}

export function wingArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return wingOf(filter);
}

export function phaseArg(filter: string): VpsPhase | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const phase = phaseName(filter);
  return phase ? phase : null;
}

export function minuteArg(filter: string): { exact: number | null; pick: MinutePick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if ((MINUTE_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as MinutePick };
  const exact = minuteOf(filter);
  return exact === null ? { exact: null, pick: null } : { exact, pick: null };
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function readPassViews(raw: unknown): VpsView[] {
  if (!Array.isArray(raw)) return [];
  const out: VpsView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VpsView>;
    const id = clip(row.id, 24);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      host: hostSlot(row.host),
      manner: mannerSlot(row.manner),
      wing: wingSlot(row.wing),
      phase: phaseSlot(row.phase),
      minute: activeMinute(String(row.minute || "all")),
      rank: activeRank(String(row.rank || "all")),
      span: activeSpan(String(row.span || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addPassView(views: readonly VpsView[], view: VpsView): VpsView[] {
  const current = readPassViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    host: hostSlot(view.host),
    manner: mannerSlot(view.manner),
    wing: wingSlot(view.wing),
    phase: phaseSlot(view.phase),
    minute: activeMinute(view.minute),
    rank: activeRank(view.rank),
    span: activeSpan(view.span),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropPassView(views: readonly VpsView[], id: string): VpsView[] {
  return readPassViews(views).filter((view) => view.id !== id);
}

/**
 * A broker plate is the broker name already stored on the account.
 * Lengths that stay are 3, 4, and 6. A blank value stays unset.
 * Spaces and hyphens are ignored. Letters are stored in capitals.
 */
export function brokerToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]+$/.test(text)) return null;
  const size = text.length;
  if (size !== 3 && size !== 4 && size !== 6) return null;
  return text;
}

function plateBody(value: PlateValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = brokerToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (PLATE_BLOCK.some((key) => key in value)) return null;
  if (!("brokerName" in value)) return { text: null, explicit: false };
  const inner = value.brokerName;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = brokerToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set plate is a broker name of length 3, 4, or 6.
 * A clear plate is an explicit blank. A missing field stays unmarked.
 */
export function plateState(value: PlateValue): PlateState {
  const body = plateBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The broker letters, or a blank string when the plate is clear or unmarked. */
export function plateCopy(value: PlateValue): string {
  return plateBody(value)?.text || "";
}

/**
 * Trio is 3. Quad is 4. Span is 6.
 * A blank broker name has no band.
 */
export function plateBand(value: PlateValue): PlateBand {
  const text = plateBody(value)?.text;
  if (!text) return "";
  if (text.length === 3) return "trio";
  if (text.length === 4) return "quad";
  return "span";
}

/** Soft when the name ends with a vowel. Hard when it does not. A blank name has no tone. */
export function plateTone(value: PlateValue): PlateTone {
  const text = plateBody(value)?.text;
  if (!text) return "";
  return "AEIOU".includes(text[text.length - 1]) ? "soft" : "hard";
}

/** ACM, IBKR, and SAXO are the house catalog. */
export function catalogPlate(value: PlateValue): boolean {
  const text = plateBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A broker name of 6 letters. A clear name is not wide. */
export function widePlate(value: PlateValue): boolean {
  const text = plateBody(value)?.text;
  if (!text) return false;
  return text.length === 6;
}

export function softPlate(value: PlateValue): boolean {
  return plateTone(value) === "soft";
}

export function catalogPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateState(row.note) === "set" && catalogPlate(row.note)).length;
}

export function widePlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateState(row.note) === "set" && widePlate(row.note)).length;
}

export function softPlateCount(rows: readonly PlateRow[]): number {
  return rows.filter((row) => plateState(row.note) === "set" && softPlate(row.note)).length;
}

/** How many distinct broker names are carried by two or more loaded rows. */
export function sharedPlateCount(rows: readonly PlateRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (plateState(row.note) !== "set") continue;
    const text = plateCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function plateBands(rows: readonly PlateRow[]): PlateBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = plateState(row.note);
    if (state === "") continue;
    const band = state === "set" ? plateBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: PlateBandLine[] = [];
  for (const band of ["", ...PLATE_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function plateTones(rows: readonly PlateRow[]): PlateToneLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = plateState(row.note);
    if (state !== "set") continue;
    const tone = plateTone(row.note);
    map.set(tone, (map.get(tone) || 0) + 1);
  }
  const out: PlateToneLine[] = [];
  for (const tone of TONE_MARKS) {
    const count = map.get(tone);
    if (count) out.push({ tone, count });
  }
  return out;
}

/** The band with the most set names. A tie keeps trio, then quad, then span. A clear name is not a lead. */
export function leadingPlate(rows: readonly PlateRow[]): string {
  const named = plateBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => PLATE_BANDS.indexOf(band as (typeof PLATE_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The tone with the most set names. A tie keeps soft, then hard. */
export function leadingPlateTone(rows: readonly PlateRow[]): string {
  const named = plateTones(rows);
  if (!named.length) return "";
  const order = (tone: string) => TONE_MARKS.indexOf(tone as (typeof TONE_MARKS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.tone) - order(b.tone))[0].tone;
}

export function plateShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((PLATE_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentPlates(rows: readonly PlateRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = plateState(row.note);
    const token = state === "set" ? plateBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenPlates(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandOwner(item);
    if (!band || !allow.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function togglePlate(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenPlates(hidden, present);
  const current = readHiddenPlates(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visiblePlateBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function activePlateBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const band = bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

export function plateBandArg(filter: string): PlateBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as PlateBand) : null;
}

function toneOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (TONE_MARKS as readonly string[]).includes(text) ? text : "";
}

export function activePlateTone(filter: string): string {
  if (filter === "all") return "all";
  return toneOwner(filter) || "all";
}

export function plateToneArg(filter: string): PlateTone | null {
  const tone = toneOwner(filter);
  return tone ? (tone as PlateTone) : null;
}

function rowId(row: PlateRow): string {
  return String(row.id || "");
}

export function readReviewedPlates(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function togglePlateReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !ids.includes(token)) return readReviewedPlates(reviewed, ids);
  const current = readReviewedPlates(reviewed, ids);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkPlateReview(reviewed: readonly string[], ids: readonly string[], allow: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedPlates(reviewed, allow));
  for (const id of ids) {
    const token = String(id || "").trim();
    if (!token || !allow.includes(token)) continue;
    if (on) current.add(token);
    else current.delete(token);
  }
  return readReviewedPlates(Array.from(current), allow);
}

/** Search matches the name and the broker. The band and the tone are not part of the query. */
export function visiblePlateCustomers<T extends PlateRow>(
  rows: readonly T[],
  band: PlateBand | "blank" | null,
  tone: PlateTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: PlateShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = plateState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && plateBand(row.note) !== band) return false;
    if (tone !== null && plateTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogPlate(row.note)) return false;
    if (shape === "span" && (state !== "set" || plateBand(row.note) !== "span")) return false;
    if (shape === "soft" && !softPlate(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    const broker = plateCopy(row.note);
    return `${row.label || ""} ${broker}`.toLowerCase().includes(text);
  });
}

/** The CSV is the bands and tones on this page. */
export function platesCsv(rows: readonly PlateRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = plateState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of plateBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of plateTones(rows)) lines.push(["tone", csvCell(line.tone), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogPlateCount(rows))].join(","));
  lines.push(["shape", "wide", String(widePlateCount(rows))].join(","));
  lines.push(["shape", "soft", String(softPlateCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedPlateCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function plateRowsCsv(rows: readonly PlateRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,tone,broker,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(plateBand(row.note)),
      csvCell(plateTone(row.note)),
      csvCell(plateCopy(row.note)),
      catalogPlate(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
