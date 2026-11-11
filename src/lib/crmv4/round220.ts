/**
 * Loggia slips for the customers colonnade, and city crests already stored as lastCity on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_loggia_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   bay integer,
 *   weave text not null default '',
 *   tempo text not null default '',
 *   bell integer,
 *   rank integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_city_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_city_crest_review (
 *   customer_id text primary key
 * );
 */

export const LGS_KEY = "crmv4-loggia-slip";
export const LGS_VIEW_KEY = "crmv4-loggia-views";
export const LGS_DENSITY_KEY = "crmv4-loggia-density";
export const CTY_KEY = "crmv4-city-crest-hide";
export const CTY_REVIEW_KEY = "crmv4-city-crest-review";

export type WeaveName = "blank" | "linen" | "graphite" | "champagne";

export type TempoName = "blank" | "hush" | "glide" | "flare";

export type SlipTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SlipDensity = "roomy" | "close";

export type SlipSort = "bay" | "steward";

export type LoggiaSlip = {
  id: string;
  title: string;
  note: string;
  steward: string;
  bay: number | null;
  weave: string;
  tempo: string;
  bell: number | null;
  rank: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  steward: string;
  weave: string;
  tempo: string;
  bay: string;
  bell: string;
  rank: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rank: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "tempo", "pin", "unpin", "hold", "resume", "archive", "open", "weave", "tag", "rank", "bell"] as const;

const WEAVES = ["linen", "graphite", "champagne"] as const;

const TEMPOS = ["hush", "glide", "flare"] as const;

const TEMPO_CYCLE = ["hush", "glide", "flare"] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["LINEN", "CHAMPAGNE"]);

const SLIP_CAP = 10;

const VIEW_CAP = 5;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function weaveName(raw: unknown): Exclude<WeaveName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (WEAVES as readonly string[]).includes(text) ? (text as Exclude<WeaveName, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<TempoName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<TempoName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A weave is LINEN, GRAPHITE, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function weaveOf(raw: unknown): string {
  const name = weaveName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bay.
 * A second digit is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A bell is 10, 20, or 60. A blank value stays unset. A leading zero is not a bell. */
export function bellOf(raw: unknown): 10 | 20 | 60 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** Rank is 1, 3, or 5. Anything else is not a rank. 1 is the resting rank. */
export function rankOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak bays are 2 and 5. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 6. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the slip is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** LINEN and CHAMPAGNE are house weaves. GRAPHITE is a guest weave. A blank weave is not a house weave. */
export function houseWeave(weave: unknown): boolean {
  return HOUSE.has(weaveOf(weave));
}

/** Roomy or close. Anything else stays roomy. */
export function densityOf(raw: unknown): SlipDensity {
  return raw === "close" ? "close" : "roomy";
}

/** Bay or steward. Anything else stays on the bay. */
export function sortMode(raw: unknown): SlipSort {
  return raw === "steward" ? "steward" : "bay";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-d]$/.test(text) ? text : "";
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

function readOne(raw: unknown): LoggiaSlip | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<LoggiaSlip>;
  const id = clip(row.id, 24);
  const title = slipLine(row.title);
  if (!id || !title) return null;
  const rank = rankOf(row.rank);
  return {
    id,
    title,
    note: slipNote(row.note),
    steward: stewardLabel(row.steward),
    bay: bayOf(row.bay),
    weave: weaveOf(row.weave),
    tempo: tempoName(row.tempo),
    bell: bellOf(row.bell),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readSlips(raw: unknown): LoggiaSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: LoggiaSlip[] = [];
  for (const item of raw) {
    const slip = readOne(item);
    if (!slip || out.some((row) => row.id === slip.id || row.title === slip.title)) continue;
    out.push(slip);
  }
  return out.slice(0, SLIP_CAP);
}

export function addSlip(
  slips: readonly LoggiaSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    bay?: unknown;
    weave?: string;
    tempo?: string;
    bell?: unknown;
    rank?: unknown;
    tags?: unknown;
  },
): LoggiaSlip[] {
  const current = readSlips(slips);
  const id = String(slip.id || "").trim();
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rank = rankOf(slip.rank);
  const next: LoggiaSlip = {
    id,
    title,
    note: slipNote(slip.note),
    steward: stewardLabel(slip.steward),
    bay: bayOf(slip.bay),
    weave: weaveOf(slip.weave),
    tempo: tempoName(slip.tempo),
    bell: bellOf(slip.bell),
    rank: rank === null ? 1 : rank,
    tags: tagsOf(slip.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

/** A blank tempo becomes hush, hush becomes glide, glide becomes flare, and flare returns to hush. */
export function cycleTempo(slips: readonly LoggiaSlip[], id: string): LoggiaSlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const at = TEMPO_CYCLE.indexOf(slip.tempo as (typeof TEMPO_CYCLE)[number]);
    const next = at < 0 ? TEMPO_CYCLE[0] : TEMPO_CYCLE[(at + 1) % TEMPO_CYCLE.length];
    if (!next || next === slip.tempo) return slip;
    return { ...slip, tempo: next, audit: "tempo" };
  });
}

/** A blank title is left as it is. */
export function editSlip(slips: readonly LoggiaSlip[], id: string, title: unknown): LoggiaSlip[] {
  const next = slipLine(title);
  if (!next) return readSlips(slips);
  const current = readSlips(slips);
  if (current.some((slip) => slip.id !== id && slip.title === next)) return current;
  return current.map((slip) => (slip.id === id && slip.title !== next ? { ...slip, title: next, audit: "edit" } : slip));
}

/** A blank note is left as it is. */
export function editSlipNote(slips: readonly LoggiaSlip[], id: string, note: unknown): LoggiaSlip[] {
  const next = slipNote(note);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.note !== next ? { ...slip, note: next, audit: "edit" } : slip));
}

/** A tag that is already on the slip, or a fifth tag, is left out. A tag is one letter from a to d. */
export function addSlipTag(slips: readonly LoggiaSlip[], id: string, tag: unknown): LoggiaSlip[] {
  const next = tagOf(tag);
  if (!next) return readSlips(slips);
  return readSlips(slips).map((slip) => {
    if (slip.id !== id || slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** An unknown rank is left as it is. 1 returns the slip to the resting rank. */
export function setSlipRank(slips: readonly LoggiaSlip[], id: string, rank: unknown): LoggiaSlip[] {
  const next = rankOf(rank);
  if (next === null) return readSlips(slips);
  return readSlips(slips).map((slip) => (slip.id === id && slip.rank !== next ? { ...slip, rank: next, audit: "rank" } : slip));
}

/** An unset bell becomes 10, 10 becomes 20, 20 becomes 60, and 60 stays. */
export function snoozeSlip(slips: readonly LoggiaSlip[], id: string): LoggiaSlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const next = slip.bell === 10 ? 20 : slip.bell === 20 ? 60 : slip.bell === 60 ? 60 : 10;
    if (next === slip.bell) return slip;
    return { ...slip, bell: next, audit: "bell" };
  });
}

export function setSlipPin(slips: readonly LoggiaSlip[], id: string, pinned: boolean): LoggiaSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(slips: readonly LoggiaSlip[], shownIds: readonly string[], index: number): LoggiaSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSlips(slips).find((slip) => slip.id === id);
  if (!row) return readSlips(slips);
  return setSlipPin(slips, id, !row.pinned);
}

/** B lengthens the bell on the focused slip. */
export function snoozeFocused(slips: readonly LoggiaSlip[], shownIds: readonly string[], index: number): LoggiaSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readSlips(slips).some((slip) => slip.id === id)) return readSlips(slips);
  return snoozeSlip(slips, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(slips: readonly LoggiaSlip[], shownIds: readonly string[], index: number): LoggiaSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSlips(slips).find((slip) => slip.id === id);
  if (!row) return readSlips(slips);
  return setSlipHold(slips, id, !row.held);
}

/** F cycles the tempo on the focused slip. */
export function tempoFocused(slips: readonly LoggiaSlip[], shownIds: readonly string[], index: number): LoggiaSlip[] {
  if (!shownIds.length) return readSlips(slips);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readSlips(slips).some((slip) => slip.id === id)) return readSlips(slips);
  return cycleTempo(slips, id);
}

export function setSlipHold(slips: readonly LoggiaSlip[], id: string, held: boolean): LoggiaSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.held !== held ? { ...slip, held, audit: held ? "hold" : "resume" } : slip));
}

export function setSlipArchive(slips: readonly LoggiaSlip[], id: string, archived: boolean): LoggiaSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id && slip.archived !== archived ? { ...slip, archived, audit: archived ? "archive" : "open" } : slip));
}

export function bulkSlipWeave(slips: readonly LoggiaSlip[], ids: readonly string[], weave: unknown): LoggiaSlip[] {
  const next = weaveOf(weave);
  if (!next) return readSlips(slips);
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.weave !== next ? { ...slip, weave: next, audit: "weave" } : slip));
}

export function bulkSlipPin(slips: readonly LoggiaSlip[], ids: readonly string[], pinned: boolean): LoggiaSlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.pinned !== pinned ? { ...slip, pinned, audit: pinned ? "pin" : "unpin" } : slip));
}

export function bulkSlipArchive(slips: readonly LoggiaSlip[], ids: readonly string[], archived: boolean): LoggiaSlip[] {
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.archived !== archived ? { ...slip, archived, audit: archived ? "archive" : "open" } : slip));
}

export function bulkSlipTempo(slips: readonly LoggiaSlip[], ids: readonly string[], tempo: unknown): LoggiaSlip[] {
  const next = tempoName(tempo);
  if (!next) return readSlips(slips);
  const picked = new Set(ids);
  return readSlips(slips).map((slip) => (picked.has(slip.id) && slip.tempo !== next ? { ...slip, tempo: next, audit: "tempo" } : slip));
}

export function bulkSlipTag(slips: readonly LoggiaSlip[], ids: readonly string[], tag: unknown): LoggiaSlip[] {
  return ids.reduce((rows, id) => addSlipTag(rows, id, tag), readSlips(slips));
}

export function resetSlips(): LoggiaSlip[] {
  return [];
}

function inTray(slip: LoggiaSlip, tray: SlipTray): boolean {
  if (tray === "archived") return slip.archived;
  if (tray === "held") return slip.held && !slip.archived;
  return !slip.held && !slip.archived;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** An open slip whose bay sits more than one bay behind the desk. A raised rank, a hold, or an archive is not late. */
export function lateSlip(slip: LoggiaSlip, desk: unknown): boolean {
  const gap = bayGap(slip.bay, desk);
  return inTray(slip, "open") && slip.rank === 1 && gap !== null && gap > 1;
}

/** An open slip with a bell of 10 is due now. A raised rank, a hold, or an archive is not. */
export function soonSlip(slip: LoggiaSlip): boolean {
  return inTray(slip, "open") && slip.rank === 1 && slip.bell === 10;
}

/** Open slips that are late or due now. A raised slip stays off the reminder list. */
export function reminderSlips(slips: readonly LoggiaSlip[], desk: unknown): LoggiaSlip[] {
  return readSlips(slips).filter((slip) => lateSlip(slip, desk) || soonSlip(slip));
}

/** Open slips whose bay sits within one bay of the desk. A raised rank, a hold, or an archive stays out. */
export function windowSlips(slips: readonly LoggiaSlip[], desk: unknown): LoggiaSlip[] {
  return readSlips(slips).filter((slip) => {
    const gap = bayGap(slip.bay, desk);
    return inTray(slip, "open") && slip.rank === 1 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Open resting slips whose bay is the desk bay. */
export function matchedSlips(slips: readonly LoggiaSlip[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readSlips(slips).filter((slip) => inTray(slip, "open") && slip.rank === 1 && slip.bay === at).length;
}

/** Search matches the title, the note, the steward, and the tags. */
export function visibleSlips(
  slips: readonly LoggiaSlip[],
  tray: SlipTray,
  query: string,
  steward: string | null,
  weave: string | null,
  tempo: string | null,
  exact: number | null,
  pick: BayPick | null,
  bell: number | "blank" | null,
  rank: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): LoggiaSlip[] {
  const text = query.trim().toLowerCase();
  return readSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text) {
      const hay = `${slip.title} ${slip.note} ${slip.steward} ${slip.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (steward !== null && slip.steward !== steward) return false;
    if (weave === "blank" ? Boolean(slip.weave) : weave && slip.weave !== weave) return false;
    if (tempo === "blank" ? Boolean(slip.tempo) : tempo && slip.tempo !== tempo) return false;
    if (!bayHit(slip.bay, exact, pick)) return false;
    if (bell === "blank" ? slip.bell !== null : bell !== null && slip.bell !== bell) return false;
    if (rank === "blank" ? slip.rank !== 1 : rank !== null && slip.rank !== rank) return false;
    if (flareOnly && slip.tempo !== "flare") return false;
    if (peakOnly && !peakBay(slip.bay)) return false;
    if (houseOnly && !houseWeave(slip.weave)) return false;
    if (quietOnly && !quietBay(slip.bay)) return false;
    if (lightOnly && slip.rank !== 1) return false;
    return true;
  });
}

export function sortSlips(slips: readonly LoggiaSlip[], mode: SlipSort): LoggiaSlip[] {
  const rows = slips.slice();
  if (mode === "steward") return rows.sort((a, b) => a.steward.localeCompare(b.steward) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function slipLedger(slips: readonly LoggiaSlip[], query: string): LoggiaSlip[] {
  const text = query.trim().toLowerCase();
  return sortSlips(
    readSlips(slips).filter((slip) => slip.bay !== null && (!text || slip.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function slipCounts(slips: readonly LoggiaSlip[], desk: unknown): SlipCounts {
  const rows = readSlips(slips);
  return {
    open: rows.filter((slip) => inTray(slip, "open")).length,
    held: rows.filter((slip) => inTray(slip, "held")).length,
    archived: rows.filter((slip) => inTray(slip, "archived")).length,
    pinned: rows.filter((slip) => slip.pinned).length,
    peak: rows.filter((slip) => inTray(slip, "open") && slip.rank === 1 && peakBay(slip.bay)).length,
    late: rows.filter((slip) => lateSlip(slip, desk)).length,
    soon: rows.filter((slip) => soonSlip(slip)).length,
    rank: rows.filter((slip) => inTray(slip, "open") && slip.rank > 1).length,
    house: rows.filter((slip) => inTray(slip, "open") && houseWeave(slip.weave)).length,
    window: windowSlips(rows, desk).length,
    matched: matchedSlips(rows, desk),
  };
}

export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateShare(slips: readonly LoggiaSlip[], desk: unknown): number {
  const rows = readSlips(slips);
  const open = rows.filter((slip) => inTray(slip, "open")).length;
  const late = rows.filter((slip) => lateSlip(slip, desk)).length;
  return slipShare(late, open);
}

/** Distinct bays on open slips. */
export function usedBays(slips: readonly LoggiaSlip[]): number {
  const bays = new Set<number>();
  for (const slip of readSlips(slips)) {
    if (inTray(slip, "open") && slip.bay !== null) bays.add(slip.bay);
  }
  return bays.size;
}

/** Open slips that share a bay and a weave. A different weave on the same bay is not a clash. */
export function clashBayCount(slips: readonly LoggiaSlip[]): number {
  const groups = new Map<string, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.bay === null || !slip.weave) continue;
    const key = `${slip.bay}:${slip.weave}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open slips that share a bell. An unset bell is not a clash. */
export function bellClashCount(slips: readonly LoggiaSlip[]): number {
  const groups = new Map<number, number>();
  for (const slip of readSlips(slips)) {
    if (!inTray(slip, "open") || slip.bell === null) continue;
    groups.set(slip.bell, (groups.get(slip.bell) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open slips in the same weave whose bays differ by two.
 * The count is the slips that have at least one neighbor.
 */
export function adjacentSlipCount(slips: readonly LoggiaSlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bay !== null && slip.weave);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.weave === right.weave && Math.abs((left.bay ?? 0) - (right.bay ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The weave with the fewest open slips.
 * A tie keeps LINEN, then GRAPHITE, then CHAMPAGNE.
 * An empty desk still suggests LINEN.
 */
export function suggestWeave(slips: readonly LoggiaSlip[]): "LINEN" | "GRAPHITE" | "CHAMPAGNE" {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = ["LINEN", "GRAPHITE", "CHAMPAGNE"] as const;
  let best: "LINEN" | "GRAPHITE" | "CHAMPAGNE" = "LINEN";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const weave of order) {
    const count = rows.filter((slip) => slip.weave === weave).length;
    if (count < bestCount) {
      best = weave;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The bell with the fewest open slips.
 * A tie keeps 20, then 10, then 60.
 * An empty desk still suggests 20.
 */
export function suggestBell(slips: readonly LoggiaSlip[]): 10 | 20 | 60 {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open"));
  const order = [20, 10, 60] as const;
  let best: 10 | 20 | 60 = 20;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const bell of order) {
    const count = rows.filter((slip) => slip.bell === bell).length;
    if (count < bestCount) {
      best = bell;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open steward. A blank steward is skipped. An empty desk stays blank. */
export function suggestSteward(slips: readonly LoggiaSlip[]): string {
  const found = readSlips(slips).find((slip) => inTray(slip, "open") && slip.steward);
  return found ? found.steward : "";
}

/**
 * The steward carrying the fewest open slips.
 * A tie keeps the earlier name. A blank steward is not a load.
 * An empty roster falls back to the newest steward.
 */
export function fairSteward(slips: readonly LoggiaSlip[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = stewardLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSteward(slips);
  const open = readSlips(slips).filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.steward === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The steward with the most open slips. A tie keeps the newer name on the desk. */
export function busiestSteward(slips: readonly LoggiaSlip[]): string {
  const rows = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.steward);
  const names: string[] = [];
  for (const slip of rows) if (!names.includes(slip.steward)) names.push(slip.steward);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((slip) => slip.steward === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function slipStewards(slips: readonly LoggiaSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.steward && !out.includes(slip.steward)) out.push(slip.steward);
  }
  return out;
}

export function slipWeaves(slips: readonly LoggiaSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.weave && !out.includes(slip.weave)) out.push(slip.weave);
  }
  return out;
}

/** Open slips whose steward also keeps another open slip on a different bay. */
export function pairStewardCount(slips: readonly LoggiaSlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.steward && slip.bay !== null);
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

/** Open slips that share a weave on different bays. */
export function sharedWeaveCount(slips: readonly LoggiaSlip[]): number {
  const open = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.weave && slip.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].weave === open[j].weave && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rank of open slips. The resting rank of 1 still counts. */
export function rankLoad(slips: readonly LoggiaSlip[]): number {
  return readSlips(slips).filter((slip) => inTray(slip, "open")).reduce((sum, slip) => sum + slip.rank, 0);
}

/** Open slips that are both the quiet bay and a house weave. */
export function quietCourtCount(slips: readonly LoggiaSlip[]): number {
  return readSlips(slips).filter((slip) => inTray(slip, "open") && quietBay(slip.bay) && houseWeave(slip.weave)).length;
}

/** Open slips whose tempo is flare. */
export function flareLoad(slips: readonly LoggiaSlip[]): number {
  return readSlips(slips).filter((slip) => inTray(slip, "open") && slip.tempo === "flare").length;
}

/** The span from the lowest open bay to the highest. Fewer than two bays span nothing. */
export function baySpan(slips: readonly LoggiaSlip[]): number {
  const bays = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bay !== null).map((slip) => slip.bay as number);
  if (bays.length < 2) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/**
 * The next open slip at or after the desk bay.
 * A flare tempo, a raised rank, a hold, and an archive stay off the list.
 * When every open bay is behind, the earliest bay is next.
 */
export function nextSlip(slips: readonly LoggiaSlip[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readSlips(slips).filter((slip) => inTray(slip, "open") && slip.bay !== null && slip.tempo !== "flare" && slip.rank === 1);
  if (!waiting.length) return "";
  const byBay = (a: LoggiaSlip, b: LoggiaSlip) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((slip) => (slip.bay ?? 0) >= now).sort(byBay);
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

export function slipCopy(slip: LoggiaSlip, desk: unknown): string {
  const gap = bayGap(slip.bay, desk);
  return [slip.title, slip.steward, slip.bay ?? "", slip.weave, slip.tempo, slip.bell ?? "", slip.rank, slip.tags.join(" "), slip.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bay you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,steward,bay,weave,tempo,bell,rank,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readSlips(raw);
  const windowIds = new Set(windowSlips(rows, desk).map((slip) => slip.id));
  const at = bayOf(desk);
  for (const slip of rows) {
    const gap = bayGap(slip.bay, desk);
    lines.push([
      slip.title,
      slip.steward,
      slip.bay === null ? "" : String(slip.bay),
      slip.weave,
      slip.tempo,
      slip.bell === null ? "" : String(slip.bell),
      String(slip.rank),
      slip.tags.join(" "),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, desk) ? "1" : "0",
      soonSlip(slip) ? "1" : "0",
      houseWeave(slip.weave) ? "1" : "0",
      windowIds.has(slip.id) ? "1" : "0",
      at !== null && slip.bay === at && slip.rank === 1 && inTray(slip, "open") ? "1" : "0",
      slip.note,
      slip.audit,
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

export function activeTempo(raw: string, tempos: readonly string[]): string {
  if (raw === "blank") return "blank";
  const tempo = tempoName(raw);
  return tempo && tempos.includes(tempo) ? tempo : "all";
}

export function activeBay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bay = bayOf(raw);
  return bay === null ? "all" : String(bay);
}

export function activeBell(raw: string): string {
  if (raw === "blank") return "blank";
  const bell = bellOf(raw);
  return bell === null ? "all" : String(bell);
}

export function activeRank(raw: string): string {
  if (raw === "blank") return "blank";
  const rank = rankOf(raw);
  return rank === null ? "all" : String(rank);
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

export function tempoArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function bellArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return bellOf(filter);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

function readView(raw: unknown): SlipView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SlipView>;
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
    tempo: row.tempo === "blank" || row.tempo === "all" ? (row.tempo === "blank" ? "blank" : "all") : tempoName(row.tempo) || "all",
    bay: activeBay(String(row.bay || "all")),
    bell: activeBell(String(row.bell || "all")),
    rank: activeRank(String(row.rank || "all")),
  };
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly SlipView[], view: SlipView): SlipView[] {
  const current = readSlipViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

export type CityState = "" | "set" | "clear";

export type CityLane = "" | "court" | "square" | "boulevard";

export type CityTone = "" | "gold" | "ink" | "ivory" | "mist";

export type CityShape = "all" | "catalog" | "wide" | "gold";

export type CityValue =
  | string
  | {
      lastCity?: unknown;
      tradingGroup?: unknown;
      email?: unknown;
      phone?: unknown;
      affiliateA?: unknown;
      affiliateB?: unknown;
      affiliateC?: unknown;
      language?: unknown;
      address?: unknown;
      country?: unknown;
      city?: unknown;
      desk?: unknown;
      name?: unknown;
      username?: unknown;
      accountType?: unknown;
      lastBrowser?: unknown;
      isResident?: unknown;
      documentsStatus?: unknown;
    }
  | null
  | undefined;

export type CityRow = { id: string; label?: string; note: CityValue };

export type CityLaneLine = { lane: string; count: number };

const CITY_LANES = ["court", "square", "boulevard"] as const;

const CITY_TONES = ["gold", "ink", "ivory", "mist"] as const;

const CITY_BLOCK = ["tradingGroup", "email", "phone", "affiliateA", "affiliateB", "affiliateC", "language", "address", "country", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident", "documentsStatus"] as const;

const CATALOG = new Set(["paris", "vienna", "milan", "london", "cairo"]);

function cityBody(raw: unknown): string {
  return clip(raw, 28).toLowerCase().replace(/[^a-z -]/g, "").replace(/\s+/g, " ").trim();
}

function cityText(value: CityValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string" || value == null) {
    if (value == null) return { text: "", explicit: true };
    return { text: cityBody(value), explicit: true };
  }
  if (typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CITY_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("lastCity" in value)) return { text: null, explicit: false };
  const inner = value.lastCity;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: cityBody(inner), explicit: true };
}

export function cityState(value: CityValue): CityState {
  const found = cityText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function cityCopy(value: CityValue): string {
  const found = cityText(value);
  return found.explicit && found.text ? found.text : "";
}

/** The crest is the first three letters, with spaces left out. */
export function crestOf(value: CityValue): string {
  const text = cityCopy(value).replace(/ /g, "");
  if (!text) return "";
  return text.slice(0, 3).toUpperCase();
}

/**
 * Paris, Vienna, Milan, London, Cairo, or a city that contains fx, is the court.
 * Any other city with a hyphen is the square.
 * Any other text is the boulevard.
 */
export function cityLane(value: CityValue): CityLane {
  const text = cityCopy(value);
  if (!text) return "";
  if (CATALOG.has(text) || text.includes("fx")) return "court";
  if (text.includes("-")) return "square";
  return "boulevard";
}

/** A house city is gold. A city longer than eight characters is ivory. A city with a space is mist. Anything else is ink. */
export function cityTone(value: CityValue): CityTone {
  const text = cityCopy(value);
  if (!text) return "";
  if (CATALOG.has(text)) return "gold";
  if (text.length > 8) return "ivory";
  if (text.includes(" ")) return "mist";
  return "ink";
}

/** Paris, Vienna, Milan, London, and Cairo belong to the house book. */
export function catalogCity(value: CityValue): boolean {
  return CATALOG.has(cityCopy(value));
}

export function catalogCityCount(rows: readonly CityRow[]): number {
  return rows.filter((row) => catalogCity(row.note)).length;
}

/** A city longer than eight characters is wide. */
export function wideCity(value: CityValue): boolean {
  const text = cityCopy(value);
  return text.length > 8;
}

export function wideCityCount(rows: readonly CityRow[]): number {
  return rows.filter((row) => wideCity(row.note)).length;
}

export function goldCityCount(rows: readonly CityRow[]): number {
  return rows.filter((row) => cityTone(row.note) === "gold").length;
}

/** Customers whose city crest is shared with at least one other customer. */
export function sharedCrestCount(rows: readonly CityRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const crest = crestOf(row.note);
    if (!crest) continue;
    groups.set(crest, (groups.get(crest) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function cityLanes(rows: readonly CityRow[]): CityLaneLine[] {
  return CITY_LANES.map((lane) => ({ lane, count: rows.filter((row) => cityLane(row.note) === lane).length }));
}

/** The lane with the most set cities. A tie keeps court, then square, then boulevard. */
export function leadingCity(rows: readonly CityRow[]): string {
  const lines = cityLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || CITY_LANES.indexOf(a.lane as (typeof CITY_LANES)[number]) - CITY_LANES.indexOf(b.lane as (typeof CITY_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set cities. A tie keeps gold, then ink, then ivory, then mist. */
export function leadingCityTone(rows: readonly CityRow[]): string {
  const counts = CITY_TONES.map((tone) => ({ tone, count: rows.filter((row) => cityTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || CITY_TONES.indexOf(a.tone) - CITY_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function cityShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** A clear city is 0. A single word is 1, a space is 2, and a hyphen is 3. */
export function cityStep(value: CityValue): 0 | 1 | 2 | 3 {
  const text = cityCopy(value);
  if (!text) return 0;
  if (text.includes("-")) return 3;
  if (text.includes(" ")) return 2;
  return 1;
}

export function presentCities(rows: readonly CityRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = cityState(row.note);
    const lane = state === "set" ? cityLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenCities(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedCities(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleCity(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCityReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCityReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCityLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleCityCustomers(
  rows: readonly CityRow[],
  lane: CityLane | "blank" | null,
  tone: CityTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: CityShape,
): CityRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = cityState(row.note);
    const mark = state === "set" ? cityLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && cityTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogCity(row.note)) return false;
    if (shape === "wide" && !wideCity(row.note)) return false;
    if (shape === "gold" && cityTone(row.note) !== "gold") return false;
    if (text) {
      const hay = `${row.label || ""} ${cityCopy(row.note)} ${crestOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeCityLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeCityTone(raw: string): string {
  return raw === "gold" || raw === "ink" || raw === "ivory" || raw === "mist" ? raw : "all";
}

export function cityLaneArg(filter: string): CityLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "court" || filter === "square" || filter === "boulevard") return filter;
  return null;
}

export function cityToneArg(filter: string): CityTone | null {
  if (filter === "gold" || filter === "ink" || filter === "ivory" || filter === "mist") return filter;
  return null;
}

export function crestsCsv(rows: readonly CityRow[]): string {
  const lines = ["kind,crest,count"];
  for (const line of cityLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogCityCount(rows)}`);
  lines.push(`wide,wide,${wideCityCount(rows)}`);
  lines.push(`tone,gold,${goldCityCount(rows)}`);
  lines.push(`tone,mist,${rows.filter((row) => cityTone(row.note) === "mist").length}`);
  lines.push(`shared,shared,${sharedCrestCount(rows)}`);
  return lines.join("\n");
}

export function cityRowsCsv(rows: readonly CityRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,crest,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = cityState(row.note);
    const lane = state === "set" ? cityLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      crestOf(row.note),
      lane,
      state === "set" ? cityTone(row.note) : "",
      String(cityStep(row.note)),
      catalogCity(row.note) ? "1" : "0",
      wideCity(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
