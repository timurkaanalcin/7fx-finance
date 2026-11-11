/**
 * Transept stalls for the support desk, and account wafers already stored as accountType on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_transept_stall (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   bay integer,
 *   weave text not null default '',
 *   cadence text not null default '',
 *   span integer,
 *   bell integer,
 *   marks text not null default '',
 *   wax integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_account_wafer_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_account_wafer_review (
 *   customer_id text primary key
 * );
 */

export const TRS_KEY = "crmv4-transept-stall";
export const TRS_VIEW_KEY = "crmv4-transept-views";
export const TRS_DENSITY_KEY = "crmv4-transept-density";
export const ACW_KEY = "crmv4-wafer-hide";
export const ACW_REVIEW_KEY = "crmv4-wafer-review";

export type WeaveName = "blank" | "ivory" | "graphite" | "gold";

export type CadenceName = "blank" | "note" | "ping" | "visit";

export type StallTray = "open" | "held" | "closed";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type StallDensity = "roomy" | "tight";

export type StallSort = "bay" | "steward";

export type TranseptStall = {
  id: string;
  title: string;
  note: string;
  steward: string;
  bay: number | null;
  weave: string;
  cadence: string;
  span: number | null;
  bell: number | null;
  marks: string[];
  wax: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type StallView = {
  id: string;
  name: string;
  tray: StallTray;
  query: string;
  steward: string;
  weave: string;
  cadence: string;
  bay: string;
  span: string;
  bell: string;
};

export type StallCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  wax: number;
  house: number;
  window: number;
};

const AUDITS = ["save", "edit", "cadence", "pin", "unpin", "hold", "lift", "close", "open", "weave", "mark", "wax"] as const;

const WEAVES = ["ivory", "graphite", "gold"] as const;

const CADENCES = ["note", "ping", "visit"] as const;

const CADENCE_ORDER = ["", "note", "ping", "visit"] as const;

const PEAK_BAYS = new Set([3, 7]);

const QUIET_BAYS = new Set([2, 8]);

const HOUSE = new Set(["IVORY", "GOLD"]);

const STALL_CAP = 9;

const VIEW_CAP = 6;

const MARK_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StallTray {
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

function cadenceNameOf(raw: unknown): Exclude<CadenceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CADENCES as readonly string[]).includes(text) ? (text as Exclude<CadenceName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function stallLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function stallNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
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

/** A span is 1, 3, or 5. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  const text = clip(raw, 1);
  if (text === "1") return 1;
  if (text === "3") return 3;
  if (text === "5") return 5;
  return null;
}

/** A bell is 5, 10, or 20. A blank value stays unset. A leading zero is not a bell. */
export function bellOf(raw: unknown): 5 | 10 | 20 | null {
  if (raw === 5 || raw === "5") return 5;
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  const text = clip(raw, 2);
  if (text === "5") return 5;
  if (text === "10") return 10;
  if (text === "20") return 20;
  return null;
}

/** A wax is 0, 1, 3, or 5. Anything else is not a wax. 0 clears the wax. */
export function waxOf(raw: unknown): 0 | 1 | 3 | 5 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak bays are 3 and 7. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** Quiet bays are 2 and 8. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the stall bay is behind. A negative gap means it is ahead.
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
export function densityOf(raw: unknown): StallDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Bay or steward. Anything else stays on the bay. */
export function sortMode(raw: unknown): StallSort {
  return raw === "steward" ? "steward" : "bay";
}

function markOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[p-u]$/.test(text) ? text : "";
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

function readOne(raw: unknown): TranseptStall | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<TranseptStall>;
  const id = clip(row.id, 24);
  const title = stallLine(row.title);
  if (!id || !title) return null;
  const wax = waxOf(row.wax);
  return {
    id,
    title,
    note: stallNote(row.note),
    steward: stewardLabel(row.steward),
    bay: bayOf(row.bay),
    weave: weaveOf(row.weave),
    cadence: cadenceNameOf(row.cadence),
    span: spanOf(row.span),
    bell: bellOf(row.bell),
    marks: marksOf(row.marks),
    wax: wax === null ? 0 : wax,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readStalls(raw: unknown): TranseptStall[] {
  if (!Array.isArray(raw)) return [];
  const out: TranseptStall[] = [];
  for (const item of raw) {
    const stall = readOne(item);
    if (!stall || out.some((row) => row.id === stall.id || row.title === stall.title)) continue;
    out.push(stall);
  }
  return out.slice(0, STALL_CAP);
}

export function addStall(
  stalls: readonly TranseptStall[],
  stall: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    bay?: unknown;
    weave?: string;
    cadence?: string;
    span?: unknown;
    bell?: unknown;
    marks?: unknown;
    wax?: unknown;
  },
): TranseptStall[] {
  const current = readStalls(stalls);
  const id = String(stall.id || "").trim();
  const title = stallLine(stall.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const wax = waxOf(stall.wax);
  const next: TranseptStall = {
    id,
    title,
    note: stallNote(stall.note),
    steward: stewardLabel(stall.steward),
    bay: bayOf(stall.bay),
    weave: weaveOf(stall.weave),
    cadence: cadenceNameOf(stall.cadence),
    span: spanOf(stall.span),
    bell: bellOf(stall.bell),
    marks: marksOf(stall.marks),
    wax: wax === null ? 0 : wax,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, STALL_CAP);
}

export function cycleCadence(stalls: readonly TranseptStall[], id: string): TranseptStall[] {
  return readStalls(stalls).map((stall) => {
    if (stall.id !== id) return stall;
    const at = CADENCE_ORDER.indexOf(stall.cadence as (typeof CADENCE_ORDER)[number]);
    const next = at < 0 || at >= CADENCES.length ? CADENCES[0] : CADENCES[at % CADENCES.length];
    if (!next || next === stall.cadence) return stall;
    return { ...stall, cadence: next, audit: "cadence" };
  });
}

/** A blank title is left as it is. */
export function editStall(stalls: readonly TranseptStall[], id: string, title: unknown): TranseptStall[] {
  const next = stallLine(title);
  if (!next) return readStalls(stalls);
  const current = readStalls(stalls);
  if (current.some((stall) => stall.id !== id && stall.title === next)) return current;
  return current.map((stall) => (stall.id === id && stall.title !== next ? { ...stall, title: next, audit: "edit" } : stall));
}

/** A blank note is left as it is. */
export function editStallNote(stalls: readonly TranseptStall[], id: string, note: unknown): TranseptStall[] {
  const next = stallNote(note);
  if (!next) return readStalls(stalls);
  return readStalls(stalls).map((stall) => (stall.id === id && stall.note !== next ? { ...stall, note: next, audit: "edit" } : stall));
}

/** A mark that is already on the stall, or a third mark, is left out. A mark is one letter from p to u. */
export function addStallMark(stalls: readonly TranseptStall[], id: string, mark: unknown): TranseptStall[] {
  const next = markOf(mark);
  if (!next) return readStalls(stalls);
  return readStalls(stalls).map((stall) => {
    if (stall.id !== id || stall.marks.includes(next) || stall.marks.length >= MARK_CAP) return stall;
    return { ...stall, marks: [...stall.marks, next], audit: "mark" };
  });
}

/** An unknown wax is left as it is. 0 clears the wax. */
export function setStallWax(stalls: readonly TranseptStall[], id: string, wax: unknown): TranseptStall[] {
  const next = waxOf(wax);
  if (next === null) return readStalls(stalls);
  return readStalls(stalls).map((stall) => (stall.id === id && stall.wax !== next ? { ...stall, wax: next, audit: "wax" } : stall));
}

export function setStallPin(stalls: readonly TranseptStall[], id: string, pinned: boolean): TranseptStall[] {
  return readStalls(stalls).map((stall) => (stall.id === id && stall.pinned !== pinned ? { ...stall, pinned, audit: pinned ? "pin" : "unpin" } : stall));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(stalls: readonly TranseptStall[], shownIds: readonly string[], index: number): TranseptStall[] {
  if (!shownIds.length) return readStalls(stalls);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readStalls(stalls).find((stall) => stall.id === id);
  if (!row) return readStalls(stalls);
  return setStallPin(stalls, id, !row.pinned);
}

/** W sets a wax of 1 on the focused stall, or clears a wax that is already set. */
export function waxFocused(stalls: readonly TranseptStall[], shownIds: readonly string[], index: number): TranseptStall[] {
  if (!shownIds.length) return readStalls(stalls);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readStalls(stalls).find((stall) => stall.id === id);
  if (!row) return readStalls(stalls);
  return setStallWax(stalls, id, row.wax ? 0 : 1);
}

export function setStallHold(stalls: readonly TranseptStall[], id: string, held: boolean): TranseptStall[] {
  return readStalls(stalls).map((stall) => (stall.id === id && stall.held !== held ? { ...stall, held, audit: held ? "hold" : "lift" } : stall));
}

export function setStallClose(stalls: readonly TranseptStall[], id: string, closed: boolean): TranseptStall[] {
  return readStalls(stalls).map((stall) => (stall.id === id && stall.closed !== closed ? { ...stall, closed, audit: closed ? "close" : "open" } : stall));
}

export function bulkStallWeave(stalls: readonly TranseptStall[], ids: readonly string[], weave: unknown): TranseptStall[] {
  const next = weaveOf(weave);
  if (!next) return readStalls(stalls);
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.weave !== next ? { ...stall, weave: next, audit: "weave" } : stall));
}

export function bulkStallPin(stalls: readonly TranseptStall[], ids: readonly string[], pinned: boolean): TranseptStall[] {
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.pinned !== pinned ? { ...stall, pinned, audit: pinned ? "pin" : "unpin" } : stall));
}

export function bulkStallClose(stalls: readonly TranseptStall[], ids: readonly string[], closed: boolean): TranseptStall[] {
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.closed !== closed ? { ...stall, closed, audit: closed ? "close" : "open" } : stall));
}

export function bulkStallCadence(stalls: readonly TranseptStall[], ids: readonly string[], cadence: unknown): TranseptStall[] {
  const next = cadenceNameOf(cadence);
  if (!next) return readStalls(stalls);
  const picked = new Set(ids);
  return readStalls(stalls).map((stall) => (picked.has(stall.id) && stall.cadence !== next ? { ...stall, cadence: next, audit: "cadence" } : stall));
}

export function bulkStallMark(stalls: readonly TranseptStall[], ids: readonly string[], mark: unknown): TranseptStall[] {
  return ids.reduce((rows, id) => addStallMark(rows, id, mark), readStalls(stalls));
}

export function resetStalls(): TranseptStall[] {
  return [];
}

function inTray(stall: TranseptStall, tray: StallTray): boolean {
  if (tray === "closed") return stall.closed;
  if (tray === "held") return stall.held && !stall.closed;
  return !stall.held && !stall.closed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** An open stall whose bay sits more than three bays behind the desk bay. A wax, a hold, or a close is not late. */
export function lateStall(stall: TranseptStall, desk: unknown): boolean {
  const gap = bayGap(stall.bay, desk);
  return inTray(stall, "open") && stall.wax === 0 && gap !== null && gap > 3;
}

/** An open stall with a bell of 5 is due now. A wax, a hold, or a close is not. */
export function soonStall(stall: TranseptStall): boolean {
  return inTray(stall, "open") && stall.wax === 0 && stall.bell === 5;
}

/** Open stalls that are late or due now. A waxed stall stays off the reminder list. */
export function reminderStalls(stalls: readonly TranseptStall[], desk: unknown): TranseptStall[] {
  return readStalls(stalls).filter((stall) => lateStall(stall, desk) || soonStall(stall));
}

/** Open stalls whose bay sits within two bays of the desk bay. A wax, a hold, or a close stays out. */
export function windowStalls(stalls: readonly TranseptStall[], desk: unknown): TranseptStall[] {
  return readStalls(stalls).filter((stall) => {
    const gap = bayGap(stall.bay, desk);
    return inTray(stall, "open") && stall.wax === 0 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Search matches the title, the note, the steward, and the marks. */
export function visibleStalls(
  stalls: readonly TranseptStall[],
  tray: StallTray,
  query: string,
  steward: string | null,
  weave: string | null,
  cadence: string | null,
  exact: number | null,
  pick: BayPick | null,
  span: number | "blank" | null,
  bell: number | "blank" | null,
  visitOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  unwaxOnly: boolean,
): TranseptStall[] {
  const text = query.trim().toLowerCase();
  return readStalls(stalls).filter((stall) => {
    if (!inTray(stall, tray)) return false;
    if (text) {
      const hay = `${stall.title} ${stall.note} ${stall.steward} ${stall.marks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (steward !== null && stall.steward !== steward) return false;
    if (weave === "blank" ? Boolean(stall.weave) : weave && stall.weave !== weave) return false;
    if (cadence === "blank" ? Boolean(stall.cadence) : cadence && stall.cadence !== cadence) return false;
    if (!bayHit(stall.bay, exact, pick)) return false;
    if (span === "blank" ? stall.span !== null : span !== null && stall.span !== span) return false;
    if (bell === "blank" ? stall.bell !== null : bell !== null && stall.bell !== bell) return false;
    if (visitOnly && stall.cadence !== "visit") return false;
    if (peakOnly && !peakBay(stall.bay)) return false;
    if (houseOnly && !houseWeave(stall.weave)) return false;
    if (quietOnly && !quietBay(stall.bay)) return false;
    if (unwaxOnly && stall.wax !== 0) return false;
    return true;
  });
}

export function sortStalls(stalls: readonly TranseptStall[], mode: StallSort): TranseptStall[] {
  const rows = stalls.slice();
  if (mode === "steward") return rows.sort((a, b) => a.steward.localeCompare(b.steward) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function stallTimeline(stalls: readonly TranseptStall[], query: string): TranseptStall[] {
  const text = query.trim().toLowerCase();
  return sortStalls(
    readStalls(stalls).filter((stall) => stall.bay !== null && (!text || stall.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function stallCounts(stalls: readonly TranseptStall[], desk: unknown): StallCounts {
  const rows = readStalls(stalls);
  return {
    open: rows.filter((stall) => inTray(stall, "open")).length,
    held: rows.filter((stall) => inTray(stall, "held")).length,
    closed: rows.filter((stall) => inTray(stall, "closed")).length,
    pinned: rows.filter((stall) => stall.pinned).length,
    peak: rows.filter((stall) => inTray(stall, "open") && stall.wax === 0 && peakBay(stall.bay)).length,
    late: rows.filter((stall) => lateStall(stall, desk)).length,
    soon: rows.filter((stall) => soonStall(stall)).length,
    wax: rows.filter((stall) => inTray(stall, "open") && stall.wax > 0).length,
    house: rows.filter((stall) => inTray(stall, "open") && houseWeave(stall.weave)).length,
    window: windowStalls(rows, desk).length,
  };
}

export function stallShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open stalls as a share of every open stall. */
export function lateShare(stalls: readonly TranseptStall[], desk: unknown): number {
  const rows = readStalls(stalls);
  const open = rows.filter((stall) => inTray(stall, "open")).length;
  const late = rows.filter((stall) => lateStall(stall, desk)).length;
  return stallShare(late, open);
}

/** Distinct bays on open stalls. */
export function usedBays(stalls: readonly TranseptStall[]): number {
  const bays = new Set<number>();
  for (const stall of readStalls(stalls)) {
    if (inTray(stall, "open") && stall.bay !== null) bays.add(stall.bay);
  }
  return bays.size;
}

/** Open stalls that share a bay and a weave. A different weave on the same bay is not a clash. */
export function clashBayCount(stalls: readonly TranseptStall[]): number {
  const groups = new Map<string, number>();
  for (const stall of readStalls(stalls)) {
    if (!inTray(stall, "open") || stall.bay === null || !stall.weave) continue;
    const key = `${stall.bay}:${stall.weave}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open stalls that share a span. An unset span is not a clash. */
export function spanClashCount(stalls: readonly TranseptStall[]): number {
  const groups = new Map<number, number>();
  for (const stall of readStalls(stalls)) {
    if (!inTray(stall, "open") || stall.span === null) continue;
    groups.set(stall.span, (groups.get(stall.span) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open stalls in the same weave whose bays differ by three.
 * The count is the stalls that have at least one neighbor.
 */
export function adjacentStallCount(stalls: readonly TranseptStall[]): number {
  const open = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.bay !== null && stall.weave);
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
 * The weave with the fewest open stalls.
 * A tie keeps GRAPHITE, then IVORY, then GOLD.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestWeave(stalls: readonly TranseptStall[]): "IVORY" | "GRAPHITE" | "GOLD" {
  const rows = readStalls(stalls).filter((stall) => inTray(stall, "open"));
  const order = ["GRAPHITE", "IVORY", "GOLD"] as const;
  let best: "IVORY" | "GRAPHITE" | "GOLD" = "GRAPHITE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const weave of order) {
    const count = rows.filter((stall) => stall.weave === weave).length;
    if (count < bestCount) {
      best = weave;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open stalls.
 * A tie keeps 3, then 1, then 5.
 * An empty desk still suggests 3.
 */
export function suggestSpan(stalls: readonly TranseptStall[]): 1 | 3 | 5 {
  const rows = readStalls(stalls).filter((stall) => inTray(stall, "open"));
  const order = [3, 1, 5] as const;
  let best: 1 | 3 | 5 = 3;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((stall) => stall.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open steward. A blank steward is skipped. An empty desk stays blank. */
export function suggestSteward(stalls: readonly TranseptStall[]): string {
  const found = readStalls(stalls).find((stall) => inTray(stall, "open") && stall.steward);
  return found ? found.steward : "";
}

/**
 * The steward carrying the fewest open stalls.
 * A tie keeps the earlier name. A blank steward is not a load.
 * An empty roster falls back to the newest steward.
 */
export function fairSteward(stalls: readonly TranseptStall[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = stewardLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSteward(stalls);
  const open = readStalls(stalls).filter((stall) => inTray(stall, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((stall) => stall.steward === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The steward with the most open stalls. A tie keeps the newer name on the desk. */
export function busiestSteward(stalls: readonly TranseptStall[]): string {
  const rows = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.steward);
  const names: string[] = [];
  for (const stall of rows) if (!names.includes(stall.steward)) names.push(stall.steward);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((stall) => stall.steward === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function stallStewards(stalls: readonly TranseptStall[]): string[] {
  const out: string[] = [];
  for (const stall of readStalls(stalls)) {
    if (stall.steward && !out.includes(stall.steward)) out.push(stall.steward);
  }
  return out;
}

export function stallWeaves(stalls: readonly TranseptStall[]): string[] {
  const out: string[] = [];
  for (const stall of readStalls(stalls)) {
    if (stall.weave && !out.includes(stall.weave)) out.push(stall.weave);
  }
  return out;
}

/** Open stalls whose steward also keeps another open stall on a different bay. */
export function pairStewardCount(stalls: readonly TranseptStall[]): number {
  const open = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.steward && stall.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].steward === open[j].steward && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The wax weight of open stalls. A clear wax adds nothing. */
export function waxLoad(stalls: readonly TranseptStall[]): number {
  return readStalls(stalls).filter((stall) => inTray(stall, "open")).reduce((sum, stall) => sum + stall.wax, 0);
}

/** Open stalls that are both a quiet bay and a house weave. */
export function quietHouseCount(stalls: readonly TranseptStall[]): number {
  return readStalls(stalls).filter((stall) => inTray(stall, "open") && quietBay(stall.bay) && houseWeave(stall.weave)).length;
}

/** Open stalls whose cadence is visit. */
export function visitLoad(stalls: readonly TranseptStall[]): number {
  return readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.cadence === "visit").length;
}

/** The span from the lowest open bay to the highest. Fewer than two bays spans nothing. */
export function baySpan(stalls: readonly TranseptStall[]): number {
  const bays = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.bay !== null).map((stall) => stall.bay as number);
  if (bays.length < 2) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/**
 * The next open stall at or after the desk bay.
 * A visit cadence, a wax, a hold, and a close stay off the list.
 * When every open bay is behind, the earliest bay is next.
 */
export function nextStall(stalls: readonly TranseptStall[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readStalls(stalls).filter((stall) => inTray(stall, "open") && stall.bay !== null && stall.cadence !== "visit" && stall.wax === 0);
  if (!waiting.length) return "";
  const byBay = (a: TranseptStall, b: TranseptStall) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((stall) => (stall.bay ?? 0) >= now).sort(byBay);
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

export function stallCopy(stall: TranseptStall, desk: unknown): string {
  const gap = bayGap(stall.bay, desk);
  return [stall.title, stall.steward, stall.bay ?? "", stall.weave, stall.cadence, stall.span ?? "", stall.bell ?? "", stall.marks.join(" "), stall.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the stalls saved in this browser. The gap and the late mark use the bay you pass. */
export function stallsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,steward,bay,weave,cadence,span,bell,marks,wax,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readStalls(raw);
  const windowIds = new Set(windowStalls(rows, desk).map((stall) => stall.id));
  for (const stall of rows) {
    const gap = bayGap(stall.bay, desk);
    lines.push([
      stall.title,
      stall.steward,
      stall.bay === null ? "" : String(stall.bay),
      stall.weave,
      stall.cadence,
      stall.span === null ? "" : String(stall.span),
      stall.bell === null ? "" : String(stall.bell),
      stall.marks.join(" "),
      String(stall.wax),
      stall.pinned ? "1" : "0",
      stall.held ? "1" : "0",
      stall.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateStall(stall, desk) ? "1" : "0",
      soonStall(stall) ? "1" : "0",
      houseWeave(stall.weave) ? "1" : "0",
      windowIds.has(stall.id) ? "1" : "0",
      stall.note,
      stall.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeSteward(raw: string, stewards: readonly string[]): string {
  if (raw === "blank") return "blank";
  return stewards.includes(raw) ? raw : "all";
}

export function activeWeave(raw: string, weaves: readonly string[]): string {
  if (raw === "blank") return "blank";
  return weaveOf(raw) && weaves.includes(weaveOf(raw)) ? weaveOf(raw) : "all";
}

export function activeCadence(raw: string, cadences: readonly string[]): string {
  if (raw === "blank") return "blank";
  const cadence = cadenceNameOf(raw);
  return cadence && cadences.includes(cadence) ? cadence : "all";
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

export function activeBell(raw: string): string {
  if (raw === "blank") return "blank";
  const bell = bellOf(raw);
  return bell === null ? "all" : String(bell);
}

export function stewardArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function weaveArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weaveOf(filter) || null;
}

export function cadenceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cadenceNameOf(filter) || null;
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

export function bellArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return bellOf(filter);
}

function readView(raw: unknown): StallView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<StallView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    steward: row.steward === "blank" ? "blank" : clip(row.steward, 18) || "all",
    weave: row.weave === "blank" || row.weave === "all" ? (row.weave === "blank" ? "blank" : "all") : weaveOf(row.weave) || "all",
    cadence: row.cadence === "blank" || row.cadence === "all" ? (row.cadence === "blank" ? "blank" : "all") : cadenceNameOf(row.cadence) || "all",
    bay: activeBay(String(row.bay || "all")),
    span: activeSpan(String(row.span || "all")),
    bell: activeBell(String(row.bell || "all")),
  };
}

export function readStallViews(raw: unknown): StallView[] {
  if (!Array.isArray(raw)) return [];
  const out: StallView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addStallView(views: readonly StallView[], view: StallView): StallView[] {
  const current = readStallViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropStallView(views: readonly StallView[], id: string): StallView[] {
  return readStallViews(views).filter((view) => view.id !== id);
}

export type WaferState = "" | "set" | "clear";

export type WaferBand = "" | "house" | "silver" | "gilt" | "demo" | "plain";

export type WaferTone = "" | "gilt" | "ink" | "ivory" | "mist" | "plain";

export type WaferShape = "all" | "catalog" | "wide" | "gilt";

export type WaferValue =
  | { accountType?: unknown; lastBrowser?: unknown; language?: unknown; lastOs?: unknown; lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; assigneeId?: unknown; referralCodeUsed?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type WaferRow = { id: string; note?: WaferValue; label?: string | null };

export type WaferBandLine = { band: string; count: number };

const CATALOG = new Set(["standard", "silver", "gold", "vip", "demo"]);

const WAFER_BANDS = ["house", "silver", "gilt", "demo", "plain"] as const;

const WAFER_TONES = ["gilt", "ink", "ivory", "mist", "plain"] as const;

const WAFER_BLOCK = ["lastBrowser", "language", "lastOs", "lastDevice", "lastUserAgent", "lastIp", "timezone", "username", "phone", "assigneeId", "referralCodeUsed", "city", "country", "desk", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name", "email"] as const;

function waferBody(raw: unknown): string {
  return String(raw ?? "").toLowerCase().replace(/[^a-z]+/g, "").slice(0, 16);
}

function waferText(value: WaferValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: waferBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (WAFER_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("accountType" in value)) return { text: null, explicit: false };
  const inner = value.accountType;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: waferBody(inner), explicit: true };
}

export function waferState(value: WaferValue): WaferState {
  const found = waferText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function waferCopy(value: WaferValue): string {
  const found = waferText(value);
  if (!found.text) return "";
  return found.text;
}

/** A wafer keeps the first letter and the last letter. A single letter stays one letter. */
export function waferOf(value: WaferValue): string {
  const text = waferCopy(value);
  if (!text) return "";
  const first = text[0];
  if (!first) return "";
  const last = text.length > 1 ? text[text.length - 1] : "";
  return last ? first.toUpperCase() + last.toUpperCase() : first.toUpperCase();
}

/** standard is house. silver is silver. gold, vip, and premium are gilt. demo and test are demo. Any other mark is plain. */
export function waferBand(value: WaferValue): WaferBand {
  const mark = waferOf(value);
  if (!mark) return "";
  const text = waferCopy(value);
  if (text.startsWith("standard")) return "house";
  if (text.startsWith("silver")) return "silver";
  if (text.startsWith("gold") || text.startsWith("vip") || text.startsWith("premium")) return "gilt";
  if (text.startsWith("demo") || text.startsWith("test")) return "demo";
  return "plain";
}

/** gold and vip are gilt. silver that is not gilt is ink. standard that is neither is ivory. demo that is none of those is mist. Every other marked wafer is plain. */
export function waferTone(value: WaferValue): WaferTone {
  const text = waferCopy(value);
  if (!text || !waferOf(value)) return "";
  if (text.startsWith("gold") || text.startsWith("vip")) return "gilt";
  if (text.startsWith("silver")) return "ink";
  if (text.startsWith("standard")) return "ivory";
  if (text.startsWith("demo")) return "mist";
  return "plain";
}

/** standard, silver, gold, vip, and demo are the house catalog. A longer name is not. */
export function catalogWafer(value: WaferValue): boolean {
  return CATALOG.has(waferCopy(value));
}

export function catalogWaferCount(rows: readonly WaferRow[]): number {
  return rows.filter((row) => catalogWafer(row.note)).length;
}

export function wideWaferCount(rows: readonly WaferRow[]): number {
  return rows.filter((row) => waferCopy(row.note).length > 8).length;
}

export function giltWaferCount(rows: readonly WaferRow[]): number {
  return rows.filter((row) => waferTone(row.note) === "gilt").length;
}

/** Customers whose wafer is shared with at least one other customer. */
export function sharedWaferCount(rows: readonly WaferRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = waferOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function waferBands(rows: readonly WaferRow[]): WaferBandLine[] {
  return WAFER_BANDS.map((band) => ({ band, count: rows.filter((row) => waferBand(row.note) === band).length }));
}

/** The band with the most set wafers. A tie keeps house, then silver, then gilt, then demo, then plain. */
export function leadingWafer(rows: readonly WaferRow[]): string {
  const lines = waferBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || WAFER_BANDS.indexOf(a.band as (typeof WAFER_BANDS)[number]) - WAFER_BANDS.indexOf(b.band as (typeof WAFER_BANDS)[number]))[0];
  return lead ? lead.band : "";
}

/** The tone with the most set wafers. A tie keeps gilt, then ink, then ivory, then mist, then plain. */
export function leadingWaferTone(rows: readonly WaferRow[]): string {
  const counts = WAFER_TONES.map((tone) => ({ tone, count: rows.filter((row) => waferTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || WAFER_TONES.indexOf(a.tone) - WAFER_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function waferShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentWafers(rows: readonly WaferRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = waferState(row.note);
    const band = state === "set" ? waferBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenWafers(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedWafers(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleWafer(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleWaferReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkWaferReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleWaferBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleWaferCustomers(
  rows: readonly WaferRow[],
  band: WaferBand | "blank" | null,
  tone: WaferTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: WaferShape,
): WaferRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = waferState(row.note);
    const mark = state === "set" ? waferBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && waferTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogWafer(row.note)) return false;
    if (shape === "wide" && waferCopy(row.note).length <= 8) return false;
    if (shape === "gilt" && waferTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${waferCopy(row.note)} ${waferOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeWaferBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeWaferTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "mist" || raw === "plain" ? raw : "all";
}

export function waferBandArg(filter: string): WaferBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "house" || filter === "silver" || filter === "gilt" || filter === "demo" || filter === "plain") return filter;
  return null;
}

export function waferToneArg(filter: string): WaferTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "mist" || filter === "plain") return filter;
  return null;
}

export function wafersCsv(rows: readonly WaferRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of waferBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogWaferCount(rows)}`);
  lines.push(`wide,wide,${wideWaferCount(rows)}`);
  lines.push(`tone,gilt,${giltWaferCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => waferTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => waferTone(row.note) === "ivory").length}`);
  lines.push(`tone,mist,${rows.filter((row) => waferTone(row.note) === "mist").length}`);
  lines.push(`tone,plain,${rows.filter((row) => waferTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedWaferCount(rows)}`);
  return lines.join("\n");
}

export function waferRowsCsv(rows: readonly WaferRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = waferState(row.note);
    const band = state === "set" ? waferBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      waferOf(row.note),
      band,
      state === "set" ? waferTone(row.note) : "",
      catalogWafer(row.note) ? "1" : "0",
      waferCopy(row.note).length > 8 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
