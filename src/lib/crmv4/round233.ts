/**
 * Lintel watches for tasks and reminders, and hour marks already stored as mailbox, country, sale status, and role.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_lintel_watch (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   mason text not null default '',
 *   hook integer,
 *   weave text not null default '',
 *   tempo text not null default '',
 *   chime integer,
 *   weight integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_hour_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_hour_review (
 *   person_id text primary key
 * );
 */

export const LNW_KEY = "crmv4-lintel-watch";
export const LNW_VIEW_KEY = "crmv4-lintel-watch-views";
export const LNW_DENSITY_KEY = "crmv4-lintel-watch-density";
export const HMK_KEY = "crmv4-hour-hide";
export const HMK_REVIEW_KEY = "crmv4-hour-review";

export type InkName = "blank" | "linen" | "wool" | "silk";

export type GaitName = "blank" | "linger" | "stride" | "dart";

export type LintelTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type LintelDensity = "airy" | "tight";

export type LintelSort = "bay" | "clerk";

export type ReportLintel = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  bay: number | null;
  ink: string;
  gait: string;
  leaf: number | null;
  spine: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type LintelView = {
  id: string;
  name: string;
  tray: LintelTray;
  query: string;
  clerk: string;
  ink: string;
  gait: string;
  bay: string;
  leaf: string;
  spine: string;
};

export type LintelCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  spine: number;
  house: number;
  window: number;
  matched: number;
  seal: number;
  cooling: number;
};

export type HourLane = "" | "porch" | "choir" | "nave" | "flag" | "digit";

export type HourTone = "" | "gilt" | "wool" | "silk" | "ash" | "haze";

export type HourState = "" | "clear" | "set";

export type HourShape = "all" | "clasp" | "wide" | "porch" | "digit" | "flag";

export type HourReview = "all" | "reviewed" | "fresh";

export type HourValue = string | { name?: unknown; desk?: unknown; country?: unknown; papers?: unknown; [key: string]: unknown } | null | undefined;

export type HourRow = { id: string; label: string; note: HourValue };

export type HourLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "spine", "leaf", "seal"] as const;

const INKS = ["linen", "wool", "silk"] as const;

const GAITS = ["linger", "stride", "dart"] as const;

const GAIT_CYCLE = ["linger", "stride", "dart"] as const;

const PEAK_BAYS = new Set([1, 7]);

const QUIET_BAYS = new Set([4]);

const HOUSE = new Set(["LINEN", "WOOL"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const LNW_CAP = 7;

const VIEW_CAP = 4;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LintelTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function inkName(raw: unknown): Exclude<InkName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<InkName, "blank">) : "";
}

function gaitName(raw: unknown): Exclude<GaitName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GAITS as readonly string[]).includes(text) ? (text as Exclude<GaitName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[pqrs]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: ReportLintel, tray: LintelTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function lintelLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function lintelNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank clerk stays blank. It is not filled in. */
export function lintelClerk(raw: unknown): string {
  return clip(raw, 18);
}

/** An ink is LINEN, WOOL, or SILK. Anything else stays blank. Letters are stored in capitals. */
export function inkOf(raw: unknown): string {
  const name = inkName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a bay.
 * A second digit is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 7) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-7]$/.test(text)) return null;
  return Number(text);
}

/** A leaf is 10, 20, or 40. A blank value stays unset. A leading zero is not a leaf. */
export function leafOf(raw: unknown): 12 | 24 | 48 | null {
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  if (raw === 48 || raw === "48") return 48;
  return null;
}

/** Spine is 3, 6, or 9. Anything else is not a spine. 3 is the resting spine. */
export function spineOf(raw: unknown): 1 | 5 | 9 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 5 || raw === "5") return 5;
  if (raw === 9 || raw === "9") return 9;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak bays are 1 and 4. An unset bay is not a peak bay. */
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
 * A positive gap means the lintel is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** WOOL and SILK are house inks. LINEN is a guest ink. A blank ink is not a house ink. */
export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

export function lintelDensity(raw: unknown): LintelDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function lintelSort(raw: unknown): LintelSort {
  return raw === "clerk" ? "clerk" : "bay";
}

function readOne(raw: unknown): ReportLintel | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = lintelLine(row.title);
  if (!id || !title) return null;
  const spine = spineOf(row.spine);
  return {
    id,
    title,
    note: lintelNote(row.note),
    clerk: lintelClerk(row.clerk),
    bay: bayOf(row.bay),
    ink: inkOf(row.ink),
    gait: gaitName(row.gait),
    leaf: leafOf(row.leaf),
    spine: spine === null ? 1 : spine,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readLintels(raw: unknown): ReportLintel[] {
  if (!Array.isArray(raw)) return [];
  const out: ReportLintel[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, LNW_CAP);
}

export function addLintel(
  panels: readonly ReportLintel[],
  panel: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    bay?: unknown;
    ink?: string;
    gait?: string;
    leaf?: unknown;
    spine?: unknown;
    tags?: unknown;
  },
): ReportLintel[] {
  const current = readLintels(panels);
  const id = String(panel.id || "").trim();
  const title = lintelLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const spine = spineOf(panel.spine);
  const next: ReportLintel = {
    id,
    title,
    note: lintelNote(panel.note),
    clerk: lintelClerk(panel.clerk),
    bay: bayOf(panel.bay),
    ink: inkOf(panel.ink),
    gait: gaitName(panel.gait),
    leaf: leafOf(panel.leaf),
    spine: spine === null ? 1 : spine,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, LNW_CAP);
}

/** A blank gait becomes still, still becomes walk, walk becomes flare, and flare returns to still. */
export function cycleGait(panels: readonly ReportLintel[], id: string): ReportLintel[] {
  return readLintels(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = GAIT_CYCLE.indexOf(panel.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === panel.gait) return panel;
    return { ...panel, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editLintel(panels: readonly ReportLintel[], id: string, title: unknown): ReportLintel[] {
  const next = lintelLine(title);
  if (!next) return readLintels(panels);
  const current = readLintels(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editLintelNote(panels: readonly ReportLintel[], id: string, note: unknown): ReportLintel[] {
  const next = lintelNote(note);
  return readLintels(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addLintelTag(panels: readonly ReportLintel[], id: string, tag: unknown): ReportLintel[] {
  const next = tagsOf(tag);
  if (!next.length) return readLintels(panels);
  return readLintels(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setLintelSpine(panels: readonly ReportLintel[], id: string, spine: unknown): ReportLintel[] {
  const next = spineOf(spine);
  if (next === null) return readLintels(panels);
  return readLintels(panels).map((panel) => (panel.id === id && panel.spine !== next ? { ...panel, spine: next, audit: "spine" } : panel));
}

/** Snooze sets a blank leaf, a leaf of 10, or a leaf of 20 to 40. A leaf of 40 stays. */
export function snoozeLintel(panels: readonly ReportLintel[], id: string): ReportLintel[] {
  return readLintels(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.leaf === 48 ? null : 48;
    if (next === null) return panel;
    return { ...panel, leaf: next, audit: "leaf" };
  });
}

export function setLintelPin(panels: readonly ReportLintel[], id: string, pinned: boolean): ReportLintel[] {
  return readLintels(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedLintel(panels: readonly ReportLintel[], shownIds: readonly string[], index: number): ReportLintel[] {
  const id = shownIds[index];
  if (!id) return readLintels(panels);
  const panel = readLintels(panels).find((item) => item.id === id);
  if (!panel) return readLintels(panels);
  return setLintelPin(panels, id, !panel.pinned);
}

export function snoozeFocusedLintel(panels: readonly ReportLintel[], shownIds: readonly string[], index: number): ReportLintel[] {
  const id = shownIds[index];
  return id ? snoozeLintel(panels, id) : readLintels(panels);
}

export function holdFocusedLintel(panels: readonly ReportLintel[], shownIds: readonly string[], index: number): ReportLintel[] {
  const id = shownIds[index];
  if (!id) return readLintels(panels);
  const panel = readLintels(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readLintels(panels);
  return setLintelHold(panels, id, !panel.held);
}

export function gaitFocusedLintel(panels: readonly ReportLintel[], shownIds: readonly string[], index: number): ReportLintel[] {
  const id = shownIds[index];
  return id ? cycleGait(panels, id) : readLintels(panels);
}

export function sealFocusedLintel(panels: readonly ReportLintel[], shownIds: readonly string[], index: number): ReportLintel[] {
  const id = shownIds[index];
  if (!id) return readLintels(panels);
  const panel = readLintels(panels).find((item) => item.id === id);
  if (!panel) return readLintels(panels);
  return setLintelSeal(panels, id, !panel.seal);
}

export function setLintelHold(panels: readonly ReportLintel[], id: string, held: boolean): ReportLintel[] {
  return readLintels(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setLintelArchive(panels: readonly ReportLintel[], id: string, archived: boolean): ReportLintel[] {
  return readLintels(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setLintelSeal(panels: readonly ReportLintel[], id: string, seal: boolean): ReportLintel[] {
  return readLintels(panels).map((panel) => (panel.id === id && panel.seal !== seal ? { ...panel, seal, audit: "seal" } : panel));
}

export function bulkLintelInk(panels: readonly ReportLintel[], ids: readonly string[], ink: unknown): ReportLintel[] {
  const next = inkOf(ink);
  if (!next) return readLintels(panels);
  const want = new Set(ids);
  return readLintels(panels).map((panel) => (want.has(panel.id) && panel.ink !== next ? { ...panel, ink: next, audit: "ink" } : panel));
}

export function bulkLintelPin(panels: readonly ReportLintel[], ids: readonly string[], pinned: boolean): ReportLintel[] {
  const want = new Set(ids);
  return readLintels(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkLintelArchive(panels: readonly ReportLintel[], ids: readonly string[], archived: boolean): ReportLintel[] {
  const want = new Set(ids);
  return readLintels(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkLintelGait(panels: readonly ReportLintel[], ids: readonly string[], gait: unknown): ReportLintel[] {
  const next = gaitName(gait);
  if (!next) return readLintels(panels);
  const want = new Set(ids);
  return readLintels(panels).map((panel) => (want.has(panel.id) && panel.gait !== next ? { ...panel, gait: next, audit: "gait" } : panel));
}

export function bulkLintelTag(panels: readonly ReportLintel[], ids: readonly string[], tag: unknown): ReportLintel[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addLintelTag(rows, id, tag) : rows), readLintels(panels));
}

export function resetLintels(): ReportLintel[] {
  return [];
}

/** An open lintel whose bay sits more than two bays behind the desk. A raised spine, a hold, or an archive is not late. */
export function lateLintel(panel: ReportLintel, desk: unknown): boolean {
  const gap = bayGap(panel.bay, desk);
  return inTray(panel, "open") && panel.spine === 1 && gap !== null && gap > 2;
}

/** An open lintel with a leaf of 10 is due now. A raised spine, a hold, or an archive is not. */
export function soonLintel(panel: ReportLintel): boolean {
  return inTray(panel, "open") && panel.spine === 1 && panel.leaf === 12;
}

/** An open resting lintel on a walk gait whose bay is 6. That quiet walk is cooling. */
export function coolingLintel(panel: ReportLintel): boolean {
  return inTray(panel, "open") && panel.spine === 1 && panel.gait === "stride" && panel.bay === 4;
}

/** Open lintels that are late or due now. A raised lintel stays off the reminder list. */
export function reminderLintels(panels: readonly ReportLintel[], desk: unknown): ReportLintel[] {
  return readLintels(panels).filter((panel) => lateLintel(panel, desk) || soonLintel(panel));
}

export function coolingLintels(panels: readonly ReportLintel[]): ReportLintel[] {
  return readLintels(panels).filter((panel) => coolingLintel(panel));
}

/** Open lintels whose bay sits within two bays of the desk. A raised spine, a hold, or an archive stays out. */
export function windowLintels(panels: readonly ReportLintel[], desk: unknown): ReportLintel[] {
  return readLintels(panels).filter((panel) => {
    const gap = bayGap(panel.bay, desk);
    return inTray(panel, "open") && panel.spine === 1 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedLintels(panels: readonly ReportLintel[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readLintels(panels).filter((panel) => inTray(panel, "open") && panel.spine === 1 && panel.bay === at).length;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** Search matches the title, the note, the clerk, and the tags. */
export function visibleLintels(
  panels: readonly ReportLintel[],
  tray: LintelTray,
  query: string,
  clerk: string | null,
  ink: string | null,
  gait: string | null,
  exact: number | null,
  pick: BayPick | null,
  leaf: number | "blank" | null,
  spine: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): ReportLintel[] {
  const text = query.trim().toLowerCase();
  return readLintels(panels).filter((panel) => {
    if (!inTray(panel, tray)) return false;
    if (text) {
      const hay = `${panel.title} ${panel.note} ${panel.clerk} ${panel.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (clerk !== null && panel.clerk !== clerk) return false;
    if (ink === "blank" ? Boolean(panel.ink) : ink && panel.ink !== ink) return false;
    if (gait === "blank" ? Boolean(panel.gait) : gait && panel.gait !== gait) return false;
    if (!bayHit(panel.bay, exact, pick)) return false;
    if (leaf === "blank" ? panel.leaf !== null : leaf !== null && panel.leaf !== leaf) return false;
    if (spine === "blank" ? panel.spine !== 1 : spine !== null && panel.spine !== spine) return false;
    if (flareOnly && panel.gait !== "dart") return false;
    if (peakOnly && !peakBay(panel.bay)) return false;
    if (houseOnly && !houseInk(panel.ink)) return false;
    if (quietOnly && !quietBay(panel.bay)) return false;
    if (restingOnly && panel.spine !== 1) return false;
    return true;
  });
}

export function sortLintels(panels: readonly ReportLintel[], mode: LintelSort): ReportLintel[] {
  const rows = panels.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function lintelIndex(panels: readonly ReportLintel[], query: string): ReportLintel[] {
  const text = query.trim().toLowerCase();
  return sortLintels(
    readLintels(panels).filter((panel) => panel.bay !== null && (!text || panel.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function lintelCounts(panels: readonly ReportLintel[], desk: unknown): LintelCounts {
  const rows = readLintels(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.spine === 1 && peakBay(panel.bay)).length,
    late: rows.filter((panel) => lateLintel(panel, desk)).length,
    soon: rows.filter((panel) => soonLintel(panel)).length,
    spine: rows.filter((panel) => inTray(panel, "open") && panel.spine > 2).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseInk(panel.ink)).length,
    window: windowLintels(rows, desk).length,
    matched: matchedLintels(rows, desk),
    seal: rows.filter((panel) => panel.seal).length,
    cooling: rows.filter((panel) => coolingLintel(panel)).length,
  };
}

export function lintelShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open lintels as a share of every open lintel. */
export function lateLintelShare(panels: readonly ReportLintel[], desk: unknown): number {
  const rows = readLintels(panels).filter((panel) => inTray(panel, "open"));
  return lintelShare(rows.filter((panel) => lateLintel(panel, desk)).length, rows.length);
}

export function usedBays(panels: readonly ReportLintel[]): number {
  return new Set(readLintels(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay)).size;
}

/** Open lintels that share a bay. */
export function clashBayCount(panels: readonly ReportLintel[]): number {
  const open = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].bay === open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open lintels that share a leaf. */
export function leafClashCount(panels: readonly ReportLintel[]): number {
  const open = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.leaf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].leaf === open[j].leaf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open lintels whose bays sit exactly two bays apart. */
export function adjacentLintelCount(panels: readonly ReportLintel[]): number {
  const open = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].bay || 0) - (open[j].bay || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The ink with the fewest open lintels.
 * A tie keeps SILK, then WOOL, then LINEN.
 * An empty desk still suggests SILK.
 */
export function suggestInk(panels: readonly ReportLintel[]): "LINEN" | "WOOL" | "SILK" {
  const rows = readLintels(panels).filter((panel) => inTray(panel, "open"));
  const order = ["WOOL", "SILK", "LINEN"] as const;
  let best: "LINEN" | "WOOL" | "SILK" = "WOOL";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ink of order) {
    const count = rows.filter((panel) => panel.ink === ink).length;
    if (count < bestCount) {
      best = ink;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The leaf with the fewest open lintels.
 * A tie keeps 20, then 10, then 40.
 * An empty desk still suggests 20.
 */
export function suggestLeaf(panels: readonly ReportLintel[]): 12 | 24 | 48 {
  const rows = readLintels(panels).filter((panel) => inTray(panel, "open"));
  const order = [24, 12, 48] as const;
  let best: 12 | 24 | 48 = 24;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const leaf of order) {
    const count = rows.filter((panel) => panel.leaf === leaf).length;
    if (count < bestCount) {
      best = leaf;
      bestCount = count;
    }
  }
  return best;
}

/** The newest clerk already written on a lintel. A blank clerk is skipped. */
export function suggestLintelClerk(panels: readonly ReportLintel[]): string {
  const found = readLintels(panels).find((panel) => panel.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open lintels.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairLintelClerk(panels: readonly ReportLintel[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = lintelClerk(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestLintelClerk(panels);
  const open = readLintels(panels).filter((panel) => inTray(panel, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((panel) => panel.clerk === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The clerk with the most open lintels. A tie keeps the name that sorts later. */
export function busiestLintelClerk(panels: readonly ReportLintel[]): string {
  const rows = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.clerk);
  const names: string[] = [];
  for (const panel of rows) if (!names.includes(panel.clerk)) names.push(panel.clerk);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((panel) => panel.clerk === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function lintelClerks(panels: readonly ReportLintel[]): string[] {
  const out: string[] = [];
  for (const panel of readLintels(panels)) {
    if (panel.clerk && !out.includes(panel.clerk)) out.push(panel.clerk);
  }
  return out;
}

export function lintelInks(panels: readonly ReportLintel[]): string[] {
  const out: string[] = [];
  for (const panel of readLintels(panels)) {
    if (panel.ink && !out.includes(panel.ink)) out.push(panel.ink);
  }
  return out;
}

/** Open lintels whose clerk also watches another open lintel on a different bay. */
export function pairLintelCount(panels: readonly ReportLintel[]): number {
  const open = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.clerk && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].clerk === open[j].clerk && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open lintels that share an ink on different bays. */
export function sharedInkCount(panels: readonly ReportLintel[]): number {
  const open = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.ink && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].ink === open[j].ink && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The spine of open lintels. The resting spine of 3 still counts. */
export function spineLoad(panels: readonly ReportLintel[]): number {
  return readLintels(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.spine, 0);
}

/** Open lintels that are both the quiet bay and a house ink. */
export function quietHallLintels(panels: readonly ReportLintel[]): number {
  return readLintels(panels).filter((panel) => inTray(panel, "open") && quietBay(panel.bay) && houseInk(panel.ink)).length;
}

/** Open lintels whose gait is flare. */
export function flareLintelLoad(panels: readonly ReportLintel[]): number {
  return readLintels(panels).filter((panel) => inTray(panel, "open") && panel.gait === "dart").length;
}

export function bayWidth(panels: readonly ReportLintel[]): number {
  const bays = readLintels(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open lintel whose bay sits ahead of the desk. An unset desk has no next lintel. */
export function nextLintel(panels: readonly ReportLintel[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readLintels(panels)
    .filter((panel) => inTray(panel, "open") && panel.spine === 1 && panel.bay !== null && (panel.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveLintelFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function lintelCopy(panel: ReportLintel, desk: unknown): string {
  const gap = bayGap(panel.bay, desk);
  return [panel.title, panel.clerk, panel.bay ?? "", panel.ink, panel.gait, panel.leaf ?? "", panel.spine, panel.tags.join(" "), panel.seal ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the lintels saved in this browser. The gap and the late mark use the bay you pass. */
export function lintelsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,bay,ink,gait,leaf,spine,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readLintels(raw);
  const windowIds = new Set(windowLintels(rows, desk).map((panel) => panel.id));
  const at = bayOf(desk);
  for (const panel of rows) {
    const gap = bayGap(panel.bay, desk);
    lines.push([
      panel.title,
      panel.clerk,
      panel.bay === null ? "" : String(panel.bay),
      panel.ink,
      panel.gait,
      panel.leaf === null ? "" : String(panel.leaf),
      String(panel.spine),
      panel.tags.join(" "),
      panel.pinned ? "1" : "0",
      panel.held ? "1" : "0",
      panel.archived ? "1" : "0",
      panel.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateLintel(panel, desk) ? "1" : "0",
      soonLintel(panel) ? "1" : "0",
      houseInk(panel.ink) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.bay === at && panel.spine === 1 && inTray(panel, "open") ? "1" : "0",
      coolingLintel(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeLintelClerk(raw: string, clerks: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerks.includes(raw) ? raw : "all";
}

export function activeInk(raw: string, inks: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = inkOf(raw);
  return name && inks.map((item) => item.toUpperCase()).includes(name) ? name : inks.includes(raw) ? raw : "all";
}

export function activeGait(raw: string, gaits: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return gaits.includes(raw) ? raw : "all";
}

export function activeBay(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return bayOf(raw) === null ? "all" : raw;
}

export function activeLeaf(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return leafOf(raw) === null ? "all" : raw;
}

export function activeSpine(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return spineOf(raw) === null ? "all" : raw;
}

export function lintelClerkArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function inkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return inkOf(filter) || null;
}

export function gaitArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return gaitName(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function leafArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return leafOf(filter);
}

export function spineArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spineOf(filter);
}

function readView(raw: unknown): LintelView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    clerk: clip(row.clerk, 18),
    ink: clip(row.ink, 12),
    gait: clip(row.gait, 8),
    bay: clip(row.bay, 8),
    leaf: clip(row.leaf, 8),
    spine: clip(row.spine, 8),
  };
}

export function readLintelViews(raw: unknown): LintelView[] {
  if (!Array.isArray(raw)) return [];
  const out: LintelView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addLintelView(views: readonly LintelView[], view: LintelView): LintelView[] {
  const current = readLintelViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropLintelView(views: readonly LintelView[], id: string): LintelView[] {
  return readLintelViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

const ROLES = ["ADMIN", "TRADER", "AGENT", "VIEWER", "STAFF"] as const;

function hourParts(value: HourValue): { name: string; desk: string; language: string; role: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), desk: "", language: "", role: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", desk: "", language: "", role: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", desk: "", language: "", role: "", ok: false };
  if (!("name" in value) && !("desk" in value) && !("language" in value) && !("role" in value)) {
    return { name: "", desk: "", language: "", role: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const deskRaw = "desk" in value ? value.desk : "";
  const languageRaw = "language" in value ? value.language : "";
  const roleRaw = "role" in value ? value.role : "";
  if (!textOk(nameRaw) || !textOk(deskRaw) || !textOk(languageRaw) || !textOk(roleRaw)) {
    return { name: "", desk: "", language: "", role: "", ok: false };
  }
  const role = clip(roleRaw, 12).toUpperCase();
  return {
    name: clip(nameRaw, 48),
    desk: clip(deskRaw, 24),
    language: clip(languageRaw, 8).toUpperCase(),
    role: (ROLES as readonly string[]).includes(role) ? role : "",
    ok: true,
  };
}

export function hourState(value: HourValue): HourState {
  const found = hourParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function hourCopy(value: HourValue): string {
  const found = hourParts(value);
  return found.ok ? found.name : "";
}

/** The hour is the first letter of each word, up to two. Digits are not letters. */
export function hourMark(value: HourValue): string {
  const text = hourCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a digit. A two-letter locale is a flag.
 * A desk whose first letter is A through H is a choir. I through P is a nave.
 * Any other named person is a porch. A digit wins over the locale, and the locale wins over the desk.
 */
export function hourLane(value: HourValue): HourLane {
  const found = hourParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "digit";
  if (/^[A-Z]{2}$/.test(found.language)) return "flag";
  const letter = found.desk.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
  if (letter && letter >= "A" && letter <= "D") return "porch";
  if (letter && letter >= "E" && letter <= "L") return "choir";
  return "nave";
}

/**
 * An admin role is gilt. A trader role is linen. An agent role is pale.
 * A viewer role is ash. A blank role, a staff role, or any other role is haze.
 */
export function hourTone(value: HourValue): HourTone {
  const found = hourParts(value);
  if (!found.ok || !found.name) return "";
  if (found.role === "ADMIN") return "gilt";
  if (found.role === "TRADER") return "wool";
  if (found.role === "AGENT") return "silk";
  if (found.role === "VIEWER") return "ash";
  return "haze";
}

export function stitchedHour(value: HourValue): boolean {
  return hourCopy(value).includes("&");
}

export function stitchedHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => stitchedHour(row.note)).length;
}

export function wideHour(value: HourValue): boolean {
  return hourCopy(value).length >= 12;
}

export function wideHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => wideHour(row.note)).length;
}

export function giltHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourTone(row.note) === "gilt").length;
}

export function porchCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourLane(row.note) === "porch").length;
}

export function choirCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourLane(row.note) === "choir").length;
}

export function naveCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourLane(row.note) === "nave").length;
}

export function flagHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourLane(row.note) === "flag").length;
}

export function digitHourCount(rows: readonly HourRow[]): number {
  return rows.filter((row) => hourLane(row.note) === "digit").length;
}

export function sharedHourCount(rows: readonly HourRow[]): number {
  const marks = rows.map((row) => hourMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(hourMark(row.note))).length;
}

export function hourLanes(rows: readonly HourRow[]): HourLaneLine[] {
  const lanes = ["porch", "choir", "nave", "flag", "digit"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => hourLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingHour(rows: readonly HourRow[]): string {
  const lines = hourLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingHourTone(rows: readonly HourRow[]): string {
  const tones = ["gilt", "wool", "silk", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => hourTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function hourShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words or more. */
export function hourStep(value: HourValue): 0 | 1 | 2 | 3 {
  const text = hourCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentHourLanes(rows: readonly HourRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = hourState(row.note);
    const lane = state === "set" ? hourLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenHours(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "porch" || lane === "choir" || lane === "nave" || lane === "flag" || lane === "digit" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedHours(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleHour(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleHourReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkHourReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleHourLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleHours(
  rows: readonly HourRow[],
  lane: HourLane | "blank" | null,
  tone: HourTone | null,
  query: string,
  review: HourReview,
  reviewed: readonly string[],
  shape: HourShape,
): HourRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = hourState(row.note);
    if (!state) return false;
    const token = state === "set" ? hourLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && hourTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${hourCopy(row.note)} ${hourMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "clasp" && !stitchedHour(row.note)) return false;
    if (shape === "wide" && !wideHour(row.note)) return false;
    if (shape === "porch" && hourLane(row.note) !== "porch") return false;
    if (shape === "digit" && hourLane(row.note) !== "digit") return false;
    if (shape === "flag" && hourLane(row.note) !== "flag") return false;
    return true;
  });
}

export function activeHourLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeHourTone(raw: string): string {
  return raw === "gilt" || raw === "wool" || raw === "silk" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function hourLaneArg(filter: string): HourLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "porch" || filter === "choir" || filter === "nave" || filter === "flag" || filter === "digit") return filter;
  return null;
}

export function hourToneArg(filter: string): HourTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "wool" || filter === "silk" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function hoursCsv(rows: readonly HourRow[]): string {
  const lines = ["lane,count"];
  for (const line of hourLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function hourRowsCsv(rows: readonly HourRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,clasp,wide,porch,choir,nave,flag,digit,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = hourParts(row.note);
    if (!found.ok) continue;
    const lane = hourLane(row.note);
    lines.push([
      found.name,
      hourMark(row.note),
      lane,
      hourTone(row.note),
      String(hourStep(row.note)),
      stitchedHour(row.note) ? "1" : "0",
      wideHour(row.note) ? "1" : "0",
      lane === "porch" ? "1" : "0",
      lane === "choir" ? "1" : "0",
      lane === "nave" ? "1" : "0",
      lane === "flag" ? "1" : "0",
      lane === "digit" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
