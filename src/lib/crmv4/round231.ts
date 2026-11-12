/**
 * Report quires for the reports desk, and margin marks already stored as name, desk, country, and papers on each loaded trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_report_quire (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   bay integer,
 *   ink text not null default '',
 *   gait text not null default '',
 *   leaf integer,
 *   spine integer not null default 3,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_margin_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_margin_review (
 *   trader_id text primary key
 * );
 */

export const QIR_KEY = "crmv4-report-quire";
export const QIR_VIEW_KEY = "crmv4-report-quire-views";
export const QIR_DENSITY_KEY = "crmv4-report-quire-density";
export const RMG_KEY = "crmv4-margin-hide";
export const RMG_REVIEW_KEY = "crmv4-margin-review";

export type InkName = "blank" | "graphite" | "ivory" | "champagne";

export type GaitName = "blank" | "still" | "walk" | "flare";

export type QuireTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type QuireDensity = "airy" | "tight";

export type QuireSort = "bay" | "clerk";

export type ReportQuire = {
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

export type QuireView = {
  id: string;
  name: string;
  tray: QuireTray;
  query: string;
  clerk: string;
  ink: string;
  gait: string;
  bay: string;
  leaf: string;
  spine: string;
};

export type QuireCounts = {
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

export type MarginLane = "" | "porch" | "atrium" | "nave" | "seal" | "stamp";

export type MarginTone = "" | "gilt" | "linen" | "pale" | "ash" | "haze";

export type MarginState = "" | "clear" | "set";

export type MarginShape = "all" | "stitch" | "wide" | "porch" | "stamp" | "seal";

export type MarginReview = "all" | "reviewed" | "fresh";

export type MarginValue = string | { name?: unknown; desk?: unknown; country?: unknown; papers?: unknown; [key: string]: unknown } | null | undefined;

export type MarginRow = { id: string; label: string; note: MarginValue };

export type MarginLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "spine", "leaf", "seal"] as const;

const INKS = ["graphite", "ivory", "champagne"] as const;

const GAITS = ["still", "walk", "flare"] as const;

const GAIT_CYCLE = ["still", "walk", "flare"] as const;

const PEAK_BAYS = new Set([1, 4]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const QUIRE_CAP = 6;

const VIEW_CAP = 4;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): QuireTray {
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
    if (!/^[abcd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: ReportQuire, tray: QuireTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function quireLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function quireNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank clerk stays blank. It is not filled in. */
export function quireClerk(raw: unknown): string {
  return clip(raw, 18);
}

/** An ink is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
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
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A leaf is 10, 20, or 40. A blank value stays unset. A leading zero is not a leaf. */
export function leafOf(raw: unknown): 10 | 20 | 40 | null {
  if (raw === 10 || raw === "10") return 10;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

/** Spine is 3, 6, or 9. Anything else is not a spine. 3 is the resting spine. */
export function spineOf(raw: unknown): 3 | 6 | 9 | null {
  if (raw === 3 || raw === "3") return 3;
  if (raw === 6 || raw === "6") return 6;
  if (raw === 9 || raw === "9") return 9;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
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
 * A positive gap means the quire is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and CHAMPAGNE are house inks. GRAPHITE is a guest ink. A blank ink is not a house ink. */
export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

export function quireDensity(raw: unknown): QuireDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function quireSort(raw: unknown): QuireSort {
  return raw === "clerk" ? "clerk" : "bay";
}

function readOne(raw: unknown): ReportQuire | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = quireLine(row.title);
  if (!id || !title) return null;
  const spine = spineOf(row.spine);
  return {
    id,
    title,
    note: quireNote(row.note),
    clerk: quireClerk(row.clerk),
    bay: bayOf(row.bay),
    ink: inkOf(row.ink),
    gait: gaitName(row.gait),
    leaf: leafOf(row.leaf),
    spine: spine === null ? 3 : spine,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readQuires(raw: unknown): ReportQuire[] {
  if (!Array.isArray(raw)) return [];
  const out: ReportQuire[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, QUIRE_CAP);
}

export function addQuire(
  panels: readonly ReportQuire[],
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
): ReportQuire[] {
  const current = readQuires(panels);
  const id = String(panel.id || "").trim();
  const title = quireLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const spine = spineOf(panel.spine);
  const next: ReportQuire = {
    id,
    title,
    note: quireNote(panel.note),
    clerk: quireClerk(panel.clerk),
    bay: bayOf(panel.bay),
    ink: inkOf(panel.ink),
    gait: gaitName(panel.gait),
    leaf: leafOf(panel.leaf),
    spine: spine === null ? 3 : spine,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, QUIRE_CAP);
}

/** A blank gait becomes still, still becomes walk, walk becomes flare, and flare returns to still. */
export function cycleGait(panels: readonly ReportQuire[], id: string): ReportQuire[] {
  return readQuires(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = GAIT_CYCLE.indexOf(panel.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === panel.gait) return panel;
    return { ...panel, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editQuire(panels: readonly ReportQuire[], id: string, title: unknown): ReportQuire[] {
  const next = quireLine(title);
  if (!next) return readQuires(panels);
  const current = readQuires(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editQuireNote(panels: readonly ReportQuire[], id: string, note: unknown): ReportQuire[] {
  const next = quireNote(note);
  return readQuires(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addQuireTag(panels: readonly ReportQuire[], id: string, tag: unknown): ReportQuire[] {
  const next = tagsOf(tag);
  if (!next.length) return readQuires(panels);
  return readQuires(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setQuireSpine(panels: readonly ReportQuire[], id: string, spine: unknown): ReportQuire[] {
  const next = spineOf(spine);
  if (next === null) return readQuires(panels);
  return readQuires(panels).map((panel) => (panel.id === id && panel.spine !== next ? { ...panel, spine: next, audit: "spine" } : panel));
}

/** Snooze sets a blank leaf, a leaf of 10, or a leaf of 20 to 40. A leaf of 40 stays. */
export function snoozeQuire(panels: readonly ReportQuire[], id: string): ReportQuire[] {
  return readQuires(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.leaf === 40 ? null : 40;
    if (next === null) return panel;
    return { ...panel, leaf: next, audit: "leaf" };
  });
}

export function setQuirePin(panels: readonly ReportQuire[], id: string, pinned: boolean): ReportQuire[] {
  return readQuires(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedQuire(panels: readonly ReportQuire[], shownIds: readonly string[], index: number): ReportQuire[] {
  const id = shownIds[index];
  if (!id) return readQuires(panels);
  const panel = readQuires(panels).find((item) => item.id === id);
  if (!panel) return readQuires(panels);
  return setQuirePin(panels, id, !panel.pinned);
}

export function snoozeFocusedQuire(panels: readonly ReportQuire[], shownIds: readonly string[], index: number): ReportQuire[] {
  const id = shownIds[index];
  return id ? snoozeQuire(panels, id) : readQuires(panels);
}

export function holdFocusedQuire(panels: readonly ReportQuire[], shownIds: readonly string[], index: number): ReportQuire[] {
  const id = shownIds[index];
  if (!id) return readQuires(panels);
  const panel = readQuires(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readQuires(panels);
  return setQuireHold(panels, id, !panel.held);
}

export function gaitFocusedQuire(panels: readonly ReportQuire[], shownIds: readonly string[], index: number): ReportQuire[] {
  const id = shownIds[index];
  return id ? cycleGait(panels, id) : readQuires(panels);
}

export function sealFocusedQuire(panels: readonly ReportQuire[], shownIds: readonly string[], index: number): ReportQuire[] {
  const id = shownIds[index];
  if (!id) return readQuires(panels);
  const panel = readQuires(panels).find((item) => item.id === id);
  if (!panel) return readQuires(panels);
  return setQuireSeal(panels, id, !panel.seal);
}

export function setQuireHold(panels: readonly ReportQuire[], id: string, held: boolean): ReportQuire[] {
  return readQuires(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setQuireArchive(panels: readonly ReportQuire[], id: string, archived: boolean): ReportQuire[] {
  return readQuires(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setQuireSeal(panels: readonly ReportQuire[], id: string, seal: boolean): ReportQuire[] {
  return readQuires(panels).map((panel) => (panel.id === id && panel.seal !== seal ? { ...panel, seal, audit: "seal" } : panel));
}

export function bulkQuireInk(panels: readonly ReportQuire[], ids: readonly string[], ink: unknown): ReportQuire[] {
  const next = inkOf(ink);
  if (!next) return readQuires(panels);
  const want = new Set(ids);
  return readQuires(panels).map((panel) => (want.has(panel.id) && panel.ink !== next ? { ...panel, ink: next, audit: "ink" } : panel));
}

export function bulkQuirePin(panels: readonly ReportQuire[], ids: readonly string[], pinned: boolean): ReportQuire[] {
  const want = new Set(ids);
  return readQuires(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkQuireArchive(panels: readonly ReportQuire[], ids: readonly string[], archived: boolean): ReportQuire[] {
  const want = new Set(ids);
  return readQuires(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkQuireGait(panels: readonly ReportQuire[], ids: readonly string[], gait: unknown): ReportQuire[] {
  const next = gaitName(gait);
  if (!next) return readQuires(panels);
  const want = new Set(ids);
  return readQuires(panels).map((panel) => (want.has(panel.id) && panel.gait !== next ? { ...panel, gait: next, audit: "gait" } : panel));
}

export function bulkQuireTag(panels: readonly ReportQuire[], ids: readonly string[], tag: unknown): ReportQuire[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addQuireTag(rows, id, tag) : rows), readQuires(panels));
}

export function resetQuires(): ReportQuire[] {
  return [];
}

/** An open quire whose bay sits more than two bays behind the desk. A raised spine, a hold, or an archive is not late. */
export function lateQuire(panel: ReportQuire, desk: unknown): boolean {
  const gap = bayGap(panel.bay, desk);
  return inTray(panel, "open") && panel.spine === 3 && gap !== null && gap > 2;
}

/** An open quire with a leaf of 10 is due now. A raised spine, a hold, or an archive is not. */
export function soonQuire(panel: ReportQuire): boolean {
  return inTray(panel, "open") && panel.spine === 3 && panel.leaf === 10;
}

/** An open resting quire on a walk gait whose bay is 6. That quiet walk is cooling. */
export function coolingQuire(panel: ReportQuire): boolean {
  return inTray(panel, "open") && panel.spine === 3 && panel.gait === "walk" && panel.bay === 6;
}

/** Open quires that are late or due now. A raised quire stays off the reminder list. */
export function reminderQuires(panels: readonly ReportQuire[], desk: unknown): ReportQuire[] {
  return readQuires(panels).filter((panel) => lateQuire(panel, desk) || soonQuire(panel));
}

export function coolingQuires(panels: readonly ReportQuire[]): ReportQuire[] {
  return readQuires(panels).filter((panel) => coolingQuire(panel));
}

/** Open quires whose bay sits within two bays of the desk. A raised spine, a hold, or an archive stays out. */
export function windowQuires(panels: readonly ReportQuire[], desk: unknown): ReportQuire[] {
  return readQuires(panels).filter((panel) => {
    const gap = bayGap(panel.bay, desk);
    return inTray(panel, "open") && panel.spine === 3 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedQuires(panels: readonly ReportQuire[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readQuires(panels).filter((panel) => inTray(panel, "open") && panel.spine === 3 && panel.bay === at).length;
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
export function visibleQuires(
  panels: readonly ReportQuire[],
  tray: QuireTray,
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
): ReportQuire[] {
  const text = query.trim().toLowerCase();
  return readQuires(panels).filter((panel) => {
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
    if (spine === "blank" ? panel.spine !== 3 : spine !== null && panel.spine !== spine) return false;
    if (flareOnly && panel.gait !== "flare") return false;
    if (peakOnly && !peakBay(panel.bay)) return false;
    if (houseOnly && !houseInk(panel.ink)) return false;
    if (quietOnly && !quietBay(panel.bay)) return false;
    if (restingOnly && panel.spine !== 3) return false;
    return true;
  });
}

export function sortQuires(panels: readonly ReportQuire[], mode: QuireSort): ReportQuire[] {
  const rows = panels.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function quireIndex(panels: readonly ReportQuire[], query: string): ReportQuire[] {
  const text = query.trim().toLowerCase();
  return sortQuires(
    readQuires(panels).filter((panel) => panel.bay !== null && (!text || panel.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function quireCounts(panels: readonly ReportQuire[], desk: unknown): QuireCounts {
  const rows = readQuires(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.spine === 3 && peakBay(panel.bay)).length,
    late: rows.filter((panel) => lateQuire(panel, desk)).length,
    soon: rows.filter((panel) => soonQuire(panel)).length,
    spine: rows.filter((panel) => inTray(panel, "open") && panel.spine > 3).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseInk(panel.ink)).length,
    window: windowQuires(rows, desk).length,
    matched: matchedQuires(rows, desk),
    seal: rows.filter((panel) => panel.seal).length,
    cooling: rows.filter((panel) => coolingQuire(panel)).length,
  };
}

export function quireShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open quires as a share of every open quire. */
export function lateQuireShare(panels: readonly ReportQuire[], desk: unknown): number {
  const rows = readQuires(panels).filter((panel) => inTray(panel, "open"));
  return quireShare(rows.filter((panel) => lateQuire(panel, desk)).length, rows.length);
}

export function usedBays(panels: readonly ReportQuire[]): number {
  return new Set(readQuires(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay)).size;
}

/** Open quires that share a bay. */
export function clashBayCount(panels: readonly ReportQuire[]): number {
  const open = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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

/** Open quires that share a leaf. */
export function leafClashCount(panels: readonly ReportQuire[]): number {
  const open = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.leaf !== null);
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

/** Open quires whose bays sit exactly two bays apart. */
export function adjacentQuireCount(panels: readonly ReportQuire[]): number {
  const open = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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
 * The ink with the fewest open quires.
 * A tie keeps CHAMPAGNE, then IVORY, then GRAPHITE.
 * An empty desk still suggests CHAMPAGNE.
 */
export function suggestInk(panels: readonly ReportQuire[]): "GRAPHITE" | "IVORY" | "CHAMPAGNE" {
  const rows = readQuires(panels).filter((panel) => inTray(panel, "open"));
  const order = ["CHAMPAGNE", "IVORY", "GRAPHITE"] as const;
  let best: "GRAPHITE" | "IVORY" | "CHAMPAGNE" = "CHAMPAGNE";
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
 * The leaf with the fewest open quires.
 * A tie keeps 20, then 10, then 40.
 * An empty desk still suggests 20.
 */
export function suggestLeaf(panels: readonly ReportQuire[]): 10 | 20 | 40 {
  const rows = readQuires(panels).filter((panel) => inTray(panel, "open"));
  const order = [20, 10, 40] as const;
  let best: 10 | 20 | 40 = 20;
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

/** The newest clerk already written on a quire. A blank clerk is skipped. */
export function suggestQuireClerk(panels: readonly ReportQuire[]): string {
  const found = readQuires(panels).find((panel) => panel.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open quires.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairQuireClerk(panels: readonly ReportQuire[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = quireClerk(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestQuireClerk(panels);
  const open = readQuires(panels).filter((panel) => inTray(panel, "open"));
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

/** The clerk with the most open quires. A tie keeps the name that sorts later. */
export function busiestQuireClerk(panels: readonly ReportQuire[]): string {
  const rows = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.clerk);
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

export function quireClerks(panels: readonly ReportQuire[]): string[] {
  const out: string[] = [];
  for (const panel of readQuires(panels)) {
    if (panel.clerk && !out.includes(panel.clerk)) out.push(panel.clerk);
  }
  return out;
}

export function quireInks(panels: readonly ReportQuire[]): string[] {
  const out: string[] = [];
  for (const panel of readQuires(panels)) {
    if (panel.ink && !out.includes(panel.ink)) out.push(panel.ink);
  }
  return out;
}

/** Open quires whose clerk also watches another open quire on a different bay. */
export function pairQuireCount(panels: readonly ReportQuire[]): number {
  const open = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.clerk && panel.bay !== null);
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

/** Open quires that share an ink on different bays. */
export function sharedInkCount(panels: readonly ReportQuire[]): number {
  const open = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.ink && panel.bay !== null);
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

/** The spine of open quires. The resting spine of 3 still counts. */
export function spineLoad(panels: readonly ReportQuire[]): number {
  return readQuires(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.spine, 0);
}

/** Open quires that are both the quiet bay and a house ink. */
export function quietHallQuires(panels: readonly ReportQuire[]): number {
  return readQuires(panels).filter((panel) => inTray(panel, "open") && quietBay(panel.bay) && houseInk(panel.ink)).length;
}

/** Open quires whose gait is flare. */
export function flareQuireLoad(panels: readonly ReportQuire[]): number {
  return readQuires(panels).filter((panel) => inTray(panel, "open") && panel.gait === "flare").length;
}

export function bayWidth(panels: readonly ReportQuire[]): number {
  const bays = readQuires(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open quire whose bay sits ahead of the desk. An unset desk has no next quire. */
export function nextQuire(panels: readonly ReportQuire[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readQuires(panels)
    .filter((panel) => inTray(panel, "open") && panel.spine === 3 && panel.bay !== null && (panel.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveQuireFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function quireCopy(panel: ReportQuire, desk: unknown): string {
  const gap = bayGap(panel.bay, desk);
  return [panel.title, panel.clerk, panel.bay ?? "", panel.ink, panel.gait, panel.leaf ?? "", panel.spine, panel.tags.join(" "), panel.seal ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the quires saved in this browser. The gap and the late mark use the bay you pass. */
export function quiresCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,bay,ink,gait,leaf,spine,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readQuires(raw);
  const windowIds = new Set(windowQuires(rows, desk).map((panel) => panel.id));
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
      lateQuire(panel, desk) ? "1" : "0",
      soonQuire(panel) ? "1" : "0",
      houseInk(panel.ink) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.bay === at && panel.spine === 3 && inTray(panel, "open") ? "1" : "0",
      coolingQuire(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeQuireClerk(raw: string, clerks: readonly string[]): string {
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

export function quireClerkArg(filter: string): string | null {
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

function readView(raw: unknown): QuireView | null {
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

export function readQuireViews(raw: unknown): QuireView[] {
  if (!Array.isArray(raw)) return [];
  const out: QuireView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addQuireView(views: readonly QuireView[], view: QuireView): QuireView[] {
  const current = readQuireViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropQuireView(views: readonly QuireView[], id: string): QuireView[] {
  return readQuireViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function marginParts(value: MarginValue): { name: string; desk: string; country: string; papers: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), desk: "", country: "", papers: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", desk: "", country: "", papers: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", desk: "", country: "", papers: "", ok: false };
  if (!("name" in value) && !("desk" in value) && !("country" in value) && !("papers" in value)) {
    return { name: "", desk: "", country: "", papers: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const deskRaw = "desk" in value ? value.desk : "";
  const countryRaw = "country" in value ? value.country : "";
  const papersRaw = "papers" in value ? value.papers : "";
  if (!textOk(nameRaw) || !textOk(deskRaw) || !textOk(countryRaw) || !textOk(papersRaw)) {
    return { name: "", desk: "", country: "", papers: "", ok: false };
  }
  const papers = clip(papersRaw, 12).toUpperCase();
  return {
    name: clip(nameRaw, 48),
    desk: clip(deskRaw, 24),
    country: clip(countryRaw, 8).toUpperCase(),
    papers: papers === "PENDING" || papers === "APPROVED" || papers === "REJECTED" || papers === "REVIEW" || papers === "NONE" ? papers : "",
    ok: true,
  };
}

export function marginState(value: MarginValue): MarginState {
  const found = marginParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function marginCopy(value: MarginValue): string {
  const found = marginParts(value);
  return found.ok ? found.name : "";
}

/** The mark is the first letter of each word, up to three. Digits are not letters. */
export function marginMark(value: MarginValue): string {
  const text = marginCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a stamp. A two-letter country is a seal.
 * A desk whose first letter is A through F is an atrium. G through M is a nave.
 * Any other named trader is a porch. A digit wins over the country, and the country wins over the desk.
 */
export function marginLane(value: MarginValue): MarginLane {
  const found = marginParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "stamp";
  if (/^[A-Z]{2}$/.test(found.country)) return "seal";
  const letter = found.desk.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
  if (letter && letter >= "A" && letter <= "F") return "atrium";
  if (letter && letter >= "G" && letter <= "M") return "nave";
  return "porch";
}

/**
 * Approved papers are gilt. Pending papers are pale. Rejected papers are ash.
 * Papers in review are linen. A name with none, blank, or another papers mark is haze.
 */
export function marginTone(value: MarginValue): MarginTone {
  const found = marginParts(value);
  if (!found.ok || !found.name) return "";
  if (found.papers === "APPROVED") return "gilt";
  if (found.papers === "PENDING") return "pale";
  if (found.papers === "REJECTED") return "ash";
  if (found.papers === "REVIEW") return "linen";
  return "haze";
}

export function stitchedMargin(value: MarginValue): boolean {
  return marginCopy(value).includes("&");
}

export function stitchedMarginCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => stitchedMargin(row.note)).length;
}

export function wideMargin(value: MarginValue): boolean {
  return marginCopy(value).length >= 12;
}

export function wideMarginCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => wideMargin(row.note)).length;
}

export function giltMarginCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => marginTone(row.note) === "gilt").length;
}

export function porchCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => marginLane(row.note) === "porch").length;
}

export function stampMarginCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => marginLane(row.note) === "stamp").length;
}

export function sealMarginCount(rows: readonly MarginRow[]): number {
  return rows.filter((row) => marginLane(row.note) === "seal").length;
}

export function sharedMarginCount(rows: readonly MarginRow[]): number {
  const marks = rows.map((row) => marginMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(marginMark(row.note))).length;
}

export function marginLanes(rows: readonly MarginRow[]): MarginLaneLine[] {
  const lanes = ["porch", "atrium", "nave", "seal", "stamp"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => marginLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingMargin(rows: readonly MarginRow[]): string {
  const lines = marginLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingMarginTone(rows: readonly MarginRow[]): string {
  const tones = ["gilt", "linen", "pale", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => marginTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function marginShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function marginStep(value: MarginValue): 0 | 1 | 2 | 3 {
  const text = marginCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentMarginLanes(rows: readonly MarginRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = marginState(row.note);
    const lane = state === "set" ? marginLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenMargins(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "porch" || lane === "atrium" || lane === "nave" || lane === "seal" || lane === "stamp" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedMargins(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleMargin(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleMarginReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkMarginReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleMarginLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleMargins(
  rows: readonly MarginRow[],
  lane: MarginLane | "blank" | null,
  tone: MarginTone | null,
  query: string,
  review: MarginReview,
  reviewed: readonly string[],
  shape: MarginShape,
): MarginRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = marginState(row.note);
    if (!state) return false;
    const token = state === "set" ? marginLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && marginTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${marginCopy(row.note)} ${marginMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "stitch" && !stitchedMargin(row.note)) return false;
    if (shape === "wide" && !wideMargin(row.note)) return false;
    if (shape === "porch" && marginLane(row.note) !== "porch") return false;
    if (shape === "stamp" && marginLane(row.note) !== "stamp") return false;
    if (shape === "seal" && marginLane(row.note) !== "seal") return false;
    return true;
  });
}

export function activeMarginLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeMarginTone(raw: string): string {
  return raw === "gilt" || raw === "linen" || raw === "pale" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function marginLaneArg(filter: string): MarginLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "porch" || filter === "atrium" || filter === "nave" || filter === "seal" || filter === "stamp") return filter;
  return null;
}

export function marginToneArg(filter: string): MarginTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "linen" || filter === "pale" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function marginsCsv(rows: readonly MarginRow[]): string {
  const lines = ["lane,count"];
  for (const line of marginLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function marginRowsCsv(rows: readonly MarginRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,stitch,wide,porch,atrium,nave,seal,stamp,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = marginParts(row.note);
    if (!found.ok) continue;
    const lane = marginLane(row.note);
    lines.push([
      found.name,
      marginMark(row.note),
      lane,
      marginTone(row.note),
      String(marginStep(row.note)),
      stitchedMargin(row.note) ? "1" : "0",
      wideMargin(row.note) ? "1" : "0",
      lane === "porch" ? "1" : "0",
      lane === "atrium" ? "1" : "0",
      lane === "nave" ? "1" : "0",
      lane === "seal" ? "1" : "0",
      lane === "stamp" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
