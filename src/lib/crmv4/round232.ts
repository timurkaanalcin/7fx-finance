/**
 * Duty slips for tasks and reminders, and profile crests already stored as name, desk, locale, and role on each loaded person.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_duty_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   bay integer,
 *   ink text not null default '',
 *   gait text not null default '',
 *   leaf integer,
 *   spine integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_profile_crest_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_profile_crest_review (
 *   person_id text primary key
 * );
 */

export const DTY_KEY = "crmv4-duty-slip";
export const DTY_VIEW_KEY = "crmv4-duty-slip-views";
export const DTY_DENSITY_KEY = "crmv4-duty-slip-density";
export const PCR_KEY = "crmv4-profile-crest-hide";
export const PCR_REVIEW_KEY = "crmv4-profile-crest-review";

export type InkName = "blank" | "graphite" | "ivory" | "champagne";

export type GaitName = "blank" | "calm" | "steady" | "rush";

export type DutyTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type DutyDensity = "airy" | "tight";

export type DutySort = "bay" | "clerk";

export type ReportDuty = {
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

export type DutyView = {
  id: string;
  name: string;
  tray: DutyTray;
  query: string;
  clerk: string;
  ink: string;
  gait: string;
  bay: string;
  leaf: string;
  spine: string;
};

export type DutyCounts = {
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

export type CrestLane = "" | "foyer" | "studio" | "gallery" | "ribbon" | "cipher";

export type CrestTone = "" | "gilt" | "linen" | "pale" | "ash" | "haze";

export type CrestState = "" | "clear" | "set";

export type CrestShape = "all" | "clasp" | "wide" | "foyer" | "cipher" | "ribbon";

export type CrestReview = "all" | "reviewed" | "fresh";

export type CrestValue = string | { name?: unknown; desk?: unknown; country?: unknown; papers?: unknown; [key: string]: unknown } | null | undefined;

export type CrestRow = { id: string; label: string; note: CrestValue };

export type CrestLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "spine", "leaf", "seal"] as const;

const INKS = ["graphite", "ivory", "champagne"] as const;

const GAITS = ["calm", "steady", "rush"] as const;

const GAIT_CYCLE = ["calm", "steady", "rush"] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([3]);

const HOUSE = new Set(["GRAPHITE", "IVORY"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const DUTY_CAP = 8;

const VIEW_CAP = 5;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DutyTray {
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
    if (!/^[wxyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: ReportDuty, tray: DutyTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function dutyLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function dutyNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank clerk stays blank. It is not filled in. */
export function dutyClerk(raw: unknown): string {
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
export function leafOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** Spine is 3, 6, or 9. Anything else is not a spine. 3 is the resting spine. */
export function spineOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
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
 * A positive gap means the duty is behind. A negative gap means it is ahead.
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

export function dutyDensity(raw: unknown): DutyDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function dutySort(raw: unknown): DutySort {
  return raw === "clerk" ? "clerk" : "bay";
}

function readOne(raw: unknown): ReportDuty | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = dutyLine(row.title);
  if (!id || !title) return null;
  const spine = spineOf(row.spine);
  return {
    id,
    title,
    note: dutyNote(row.note),
    clerk: dutyClerk(row.clerk),
    bay: bayOf(row.bay),
    ink: inkOf(row.ink),
    gait: gaitName(row.gait),
    leaf: leafOf(row.leaf),
    spine: spine === null ? 2 : spine,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readDuties(raw: unknown): ReportDuty[] {
  if (!Array.isArray(raw)) return [];
  const out: ReportDuty[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, DUTY_CAP);
}

export function addDuty(
  panels: readonly ReportDuty[],
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
): ReportDuty[] {
  const current = readDuties(panels);
  const id = String(panel.id || "").trim();
  const title = dutyLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const spine = spineOf(panel.spine);
  const next: ReportDuty = {
    id,
    title,
    note: dutyNote(panel.note),
    clerk: dutyClerk(panel.clerk),
    bay: bayOf(panel.bay),
    ink: inkOf(panel.ink),
    gait: gaitName(panel.gait),
    leaf: leafOf(panel.leaf),
    spine: spine === null ? 2 : spine,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, DUTY_CAP);
}

/** A blank gait becomes still, still becomes walk, walk becomes flare, and flare returns to still. */
export function cycleGait(panels: readonly ReportDuty[], id: string): ReportDuty[] {
  return readDuties(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = GAIT_CYCLE.indexOf(panel.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === panel.gait) return panel;
    return { ...panel, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editDuty(panels: readonly ReportDuty[], id: string, title: unknown): ReportDuty[] {
  const next = dutyLine(title);
  if (!next) return readDuties(panels);
  const current = readDuties(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editDutyNote(panels: readonly ReportDuty[], id: string, note: unknown): ReportDuty[] {
  const next = dutyNote(note);
  return readDuties(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addDutyTag(panels: readonly ReportDuty[], id: string, tag: unknown): ReportDuty[] {
  const next = tagsOf(tag);
  if (!next.length) return readDuties(panels);
  return readDuties(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setDutySpine(panels: readonly ReportDuty[], id: string, spine: unknown): ReportDuty[] {
  const next = spineOf(spine);
  if (next === null) return readDuties(panels);
  return readDuties(panels).map((panel) => (panel.id === id && panel.spine !== next ? { ...panel, spine: next, audit: "spine" } : panel));
}

/** Snooze sets a blank leaf, a leaf of 10, or a leaf of 20 to 40. A leaf of 40 stays. */
export function snoozeDuty(panels: readonly ReportDuty[], id: string): ReportDuty[] {
  return readDuties(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.leaf === 60 ? null : 60;
    if (next === null) return panel;
    return { ...panel, leaf: next, audit: "leaf" };
  });
}

export function setDutyPin(panels: readonly ReportDuty[], id: string, pinned: boolean): ReportDuty[] {
  return readDuties(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedDuty(panels: readonly ReportDuty[], shownIds: readonly string[], index: number): ReportDuty[] {
  const id = shownIds[index];
  if (!id) return readDuties(panels);
  const panel = readDuties(panels).find((item) => item.id === id);
  if (!panel) return readDuties(panels);
  return setDutyPin(panels, id, !panel.pinned);
}

export function snoozeFocusedDuty(panels: readonly ReportDuty[], shownIds: readonly string[], index: number): ReportDuty[] {
  const id = shownIds[index];
  return id ? snoozeDuty(panels, id) : readDuties(panels);
}

export function holdFocusedDuty(panels: readonly ReportDuty[], shownIds: readonly string[], index: number): ReportDuty[] {
  const id = shownIds[index];
  if (!id) return readDuties(panels);
  const panel = readDuties(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readDuties(panels);
  return setDutyHold(panels, id, !panel.held);
}

export function gaitFocusedDuty(panels: readonly ReportDuty[], shownIds: readonly string[], index: number): ReportDuty[] {
  const id = shownIds[index];
  return id ? cycleGait(panels, id) : readDuties(panels);
}

export function sealFocusedDuty(panels: readonly ReportDuty[], shownIds: readonly string[], index: number): ReportDuty[] {
  const id = shownIds[index];
  if (!id) return readDuties(panels);
  const panel = readDuties(panels).find((item) => item.id === id);
  if (!panel) return readDuties(panels);
  return setDutySeal(panels, id, !panel.seal);
}

export function setDutyHold(panels: readonly ReportDuty[], id: string, held: boolean): ReportDuty[] {
  return readDuties(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setDutyArchive(panels: readonly ReportDuty[], id: string, archived: boolean): ReportDuty[] {
  return readDuties(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setDutySeal(panels: readonly ReportDuty[], id: string, seal: boolean): ReportDuty[] {
  return readDuties(panels).map((panel) => (panel.id === id && panel.seal !== seal ? { ...panel, seal, audit: "seal" } : panel));
}

export function bulkDutyInk(panels: readonly ReportDuty[], ids: readonly string[], ink: unknown): ReportDuty[] {
  const next = inkOf(ink);
  if (!next) return readDuties(panels);
  const want = new Set(ids);
  return readDuties(panels).map((panel) => (want.has(panel.id) && panel.ink !== next ? { ...panel, ink: next, audit: "ink" } : panel));
}

export function bulkDutyPin(panels: readonly ReportDuty[], ids: readonly string[], pinned: boolean): ReportDuty[] {
  const want = new Set(ids);
  return readDuties(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkDutyArchive(panels: readonly ReportDuty[], ids: readonly string[], archived: boolean): ReportDuty[] {
  const want = new Set(ids);
  return readDuties(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkDutyGait(panels: readonly ReportDuty[], ids: readonly string[], gait: unknown): ReportDuty[] {
  const next = gaitName(gait);
  if (!next) return readDuties(panels);
  const want = new Set(ids);
  return readDuties(panels).map((panel) => (want.has(panel.id) && panel.gait !== next ? { ...panel, gait: next, audit: "gait" } : panel));
}

export function bulkDutyTag(panels: readonly ReportDuty[], ids: readonly string[], tag: unknown): ReportDuty[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addDutyTag(rows, id, tag) : rows), readDuties(panels));
}

export function resetDuties(): ReportDuty[] {
  return [];
}

/** An open duty whose bay sits more than two bays behind the desk. A raised spine, a hold, or an archive is not late. */
export function lateDuty(panel: ReportDuty, desk: unknown): boolean {
  const gap = bayGap(panel.bay, desk);
  return inTray(panel, "open") && panel.spine === 2 && gap !== null && gap > 1;
}

/** An open duty with a leaf of 10 is due now. A raised spine, a hold, or an archive is not. */
export function soonDuty(panel: ReportDuty): boolean {
  return inTray(panel, "open") && panel.spine === 2 && panel.leaf === 15;
}

/** An open resting duty on a walk gait whose bay is 6. That quiet walk is cooling. */
export function coolingDuty(panel: ReportDuty): boolean {
  return inTray(panel, "open") && panel.spine === 2 && panel.gait === "steady" && panel.bay === 3;
}

/** Open duties that are late or due now. A raised duty stays off the reminder list. */
export function reminderDuties(panels: readonly ReportDuty[], desk: unknown): ReportDuty[] {
  return readDuties(panels).filter((panel) => lateDuty(panel, desk) || soonDuty(panel));
}

export function coolingDuties(panels: readonly ReportDuty[]): ReportDuty[] {
  return readDuties(panels).filter((panel) => coolingDuty(panel));
}

/** Open duties whose bay sits within two bays of the desk. A raised spine, a hold, or an archive stays out. */
export function windowDuties(panels: readonly ReportDuty[], desk: unknown): ReportDuty[] {
  return readDuties(panels).filter((panel) => {
    const gap = bayGap(panel.bay, desk);
    return inTray(panel, "open") && panel.spine === 2 && gap !== null && gap >= -1 && gap <= 1;
  });
}

export function matchedDuties(panels: readonly ReportDuty[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readDuties(panels).filter((panel) => inTray(panel, "open") && panel.spine === 2 && panel.bay === at).length;
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
export function visibleDuties(
  panels: readonly ReportDuty[],
  tray: DutyTray,
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
): ReportDuty[] {
  const text = query.trim().toLowerCase();
  return readDuties(panels).filter((panel) => {
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
    if (spine === "blank" ? panel.spine !== 2 : spine !== null && panel.spine !== spine) return false;
    if (flareOnly && panel.gait !== "rush") return false;
    if (peakOnly && !peakBay(panel.bay)) return false;
    if (houseOnly && !houseInk(panel.ink)) return false;
    if (quietOnly && !quietBay(panel.bay)) return false;
    if (restingOnly && panel.spine !== 2) return false;
    return true;
  });
}

export function sortDuties(panels: readonly ReportDuty[], mode: DutySort): ReportDuty[] {
  const rows = panels.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function dutyIndex(panels: readonly ReportDuty[], query: string): ReportDuty[] {
  const text = query.trim().toLowerCase();
  return sortDuties(
    readDuties(panels).filter((panel) => panel.bay !== null && (!text || panel.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function dutyCounts(panels: readonly ReportDuty[], desk: unknown): DutyCounts {
  const rows = readDuties(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.spine === 2 && peakBay(panel.bay)).length,
    late: rows.filter((panel) => lateDuty(panel, desk)).length,
    soon: rows.filter((panel) => soonDuty(panel)).length,
    spine: rows.filter((panel) => inTray(panel, "open") && panel.spine > 2).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseInk(panel.ink)).length,
    window: windowDuties(rows, desk).length,
    matched: matchedDuties(rows, desk),
    seal: rows.filter((panel) => panel.seal).length,
    cooling: rows.filter((panel) => coolingDuty(panel)).length,
  };
}

export function dutyShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open duties as a share of every open duty. */
export function lateDutyShare(panels: readonly ReportDuty[], desk: unknown): number {
  const rows = readDuties(panels).filter((panel) => inTray(panel, "open"));
  return dutyShare(rows.filter((panel) => lateDuty(panel, desk)).length, rows.length);
}

export function usedBays(panels: readonly ReportDuty[]): number {
  return new Set(readDuties(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay)).size;
}

/** Open duties that share a bay. */
export function clashBayCount(panels: readonly ReportDuty[]): number {
  const open = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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

/** Open duties that share a leaf. */
export function leafClashCount(panels: readonly ReportDuty[]): number {
  const open = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.leaf !== null);
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

/** Open duties whose bays sit exactly two bays apart. */
export function adjacentDutyCount(panels: readonly ReportDuty[]): number {
  const open = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].bay || 0) - (open[j].bay || 0)) === 3) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The ink with the fewest open duties.
 * A tie keeps CHAMPAGNE, then IVORY, then GRAPHITE.
 * An empty desk still suggests CHAMPAGNE.
 */
export function suggestInk(panels: readonly ReportDuty[]): "GRAPHITE" | "IVORY" | "CHAMPAGNE" {
  const rows = readDuties(panels).filter((panel) => inTray(panel, "open"));
  const order = ["IVORY", "CHAMPAGNE", "GRAPHITE"] as const;
  let best: "GRAPHITE" | "IVORY" | "CHAMPAGNE" = "IVORY";
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
 * The leaf with the fewest open duties.
 * A tie keeps 20, then 10, then 40.
 * An empty desk still suggests 20.
 */
export function suggestLeaf(panels: readonly ReportDuty[]): 15 | 30 | 60 {
  const rows = readDuties(panels).filter((panel) => inTray(panel, "open"));
  const order = [30, 15, 60] as const;
  let best: 15 | 30 | 60 = 30;
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

/** The newest clerk already written on a duty. A blank clerk is skipped. */
export function suggestDutyClerk(panels: readonly ReportDuty[]): string {
  const found = readDuties(panels).find((panel) => panel.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open duties.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairDutyClerk(panels: readonly ReportDuty[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = dutyClerk(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestDutyClerk(panels);
  const open = readDuties(panels).filter((panel) => inTray(panel, "open"));
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

/** The clerk with the most open duties. A tie keeps the name that sorts later. */
export function busiestDutyClerk(panels: readonly ReportDuty[]): string {
  const rows = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.clerk);
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

export function dutyClerks(panels: readonly ReportDuty[]): string[] {
  const out: string[] = [];
  for (const panel of readDuties(panels)) {
    if (panel.clerk && !out.includes(panel.clerk)) out.push(panel.clerk);
  }
  return out;
}

export function dutyInks(panels: readonly ReportDuty[]): string[] {
  const out: string[] = [];
  for (const panel of readDuties(panels)) {
    if (panel.ink && !out.includes(panel.ink)) out.push(panel.ink);
  }
  return out;
}

/** Open duties whose clerk also watches another open duty on a different bay. */
export function pairDutyCount(panels: readonly ReportDuty[]): number {
  const open = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.clerk && panel.bay !== null);
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

/** Open duties that share an ink on different bays. */
export function sharedInkCount(panels: readonly ReportDuty[]): number {
  const open = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.ink && panel.bay !== null);
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

/** The spine of open duties. The resting spine of 3 still counts. */
export function spineLoad(panels: readonly ReportDuty[]): number {
  return readDuties(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.spine, 0);
}

/** Open duties that are both the quiet bay and a house ink. */
export function quietHallDuties(panels: readonly ReportDuty[]): number {
  return readDuties(panels).filter((panel) => inTray(panel, "open") && quietBay(panel.bay) && houseInk(panel.ink)).length;
}

/** Open duties whose gait is flare. */
export function flareDutyLoad(panels: readonly ReportDuty[]): number {
  return readDuties(panels).filter((panel) => inTray(panel, "open") && panel.gait === "rush").length;
}

export function bayWidth(panels: readonly ReportDuty[]): number {
  const bays = readDuties(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open duty whose bay sits ahead of the desk. An unset desk has no next duty. */
export function nextDuty(panels: readonly ReportDuty[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readDuties(panels)
    .filter((panel) => inTray(panel, "open") && panel.spine === 2 && panel.bay !== null && (panel.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveDutyFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function dutyCopy(panel: ReportDuty, desk: unknown): string {
  const gap = bayGap(panel.bay, desk);
  return [panel.title, panel.clerk, panel.bay ?? "", panel.ink, panel.gait, panel.leaf ?? "", panel.spine, panel.tags.join(" "), panel.seal ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the duties saved in this browser. The gap and the late mark use the bay you pass. */
export function dutiesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,bay,ink,gait,leaf,spine,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readDuties(raw);
  const windowIds = new Set(windowDuties(rows, desk).map((panel) => panel.id));
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
      lateDuty(panel, desk) ? "1" : "0",
      soonDuty(panel) ? "1" : "0",
      houseInk(panel.ink) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.bay === at && panel.spine === 2 && inTray(panel, "open") ? "1" : "0",
      coolingDuty(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeDutyClerk(raw: string, clerks: readonly string[]): string {
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

export function dutyClerkArg(filter: string): string | null {
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

function readView(raw: unknown): DutyView | null {
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

export function readDutyViews(raw: unknown): DutyView[] {
  if (!Array.isArray(raw)) return [];
  const out: DutyView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addDutyView(views: readonly DutyView[], view: DutyView): DutyView[] {
  const current = readDutyViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropDutyView(views: readonly DutyView[], id: string): DutyView[] {
  return readDutyViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

const ROLES = ["ADMIN", "TRADER", "AGENT", "VIEWER", "STAFF"] as const;

function crestParts(value: CrestValue): { name: string; desk: string; language: string; role: string; ok: boolean } {
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

export function crestState(value: CrestValue): CrestState {
  const found = crestParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function crestCopy(value: CrestValue): string {
  const found = crestParts(value);
  return found.ok ? found.name : "";
}

/** The crest is the first letter of each word, up to two. Digits are not letters. */
export function crestMark(value: CrestValue): string {
  const text = crestCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a cipher. A two-letter locale is a ribbon.
 * A desk whose first letter is A through H is a studio. I through P is a gallery.
 * Any other named person is a foyer. A digit wins over the locale, and the locale wins over the desk.
 */
export function crestLane(value: CrestValue): CrestLane {
  const found = crestParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "cipher";
  if (/^[A-Z]{2}$/.test(found.language)) return "ribbon";
  const letter = found.desk.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
  if (letter && letter >= "A" && letter <= "H") return "studio";
  if (letter && letter >= "I" && letter <= "P") return "gallery";
  return "foyer";
}

/**
 * An admin role is gilt. A trader role is linen. An agent role is pale.
 * A viewer role is ash. A blank role, a staff role, or any other role is haze.
 */
export function crestTone(value: CrestValue): CrestTone {
  const found = crestParts(value);
  if (!found.ok || !found.name) return "";
  if (found.role === "ADMIN") return "gilt";
  if (found.role === "TRADER") return "linen";
  if (found.role === "AGENT") return "pale";
  if (found.role === "VIEWER") return "ash";
  return "haze";
}

export function stitchedCrest(value: CrestValue): boolean {
  return crestCopy(value).includes("+");
}

export function stitchedCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => stitchedCrest(row.note)).length;
}

export function wideCrest(value: CrestValue): boolean {
  return crestCopy(value).length >= 10;
}

export function wideCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => wideCrest(row.note)).length;
}

export function giltCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestTone(row.note) === "gilt").length;
}

export function foyerCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestLane(row.note) === "foyer").length;
}

export function studioCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestLane(row.note) === "studio").length;
}

export function galleryCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestLane(row.note) === "gallery").length;
}

export function ribbonCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestLane(row.note) === "ribbon").length;
}

export function cipherCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestLane(row.note) === "cipher").length;
}

export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const marks = rows.map((row) => crestMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(crestMark(row.note))).length;
}

export function crestLanes(rows: readonly CrestRow[]): CrestLaneLine[] {
  const lanes = ["foyer", "studio", "gallery", "ribbon", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => crestLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingCrest(rows: readonly CrestRow[]): string {
  const lines = crestLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const tones = ["gilt", "linen", "pale", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => crestTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function crestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words or more. */
export function crestStep(value: CrestValue): 0 | 1 | 2 {
  const text = crestCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  return 2;
}

export function presentCrestLanes(rows: readonly CrestRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = crestState(row.note);
    const lane = state === "set" ? crestLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "foyer" || lane === "studio" || lane === "gallery" || lane === "ribbon" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleCrest(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleCrestReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrestLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleCrests(
  rows: readonly CrestRow[],
  lane: CrestLane | "blank" | null,
  tone: CrestTone | null,
  query: string,
  review: CrestReview,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = crestState(row.note);
    if (!state) return false;
    const token = state === "set" ? crestLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && crestTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${crestCopy(row.note)} ${crestMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "clasp" && !stitchedCrest(row.note)) return false;
    if (shape === "wide" && !wideCrest(row.note)) return false;
    if (shape === "foyer" && crestLane(row.note) !== "foyer") return false;
    if (shape === "cipher" && crestLane(row.note) !== "cipher") return false;
    if (shape === "ribbon" && crestLane(row.note) !== "ribbon") return false;
    return true;
  });
}

export function activeCrestLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeCrestTone(raw: string): string {
  return raw === "gilt" || raw === "linen" || raw === "pale" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function crestLaneArg(filter: string): CrestLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "foyer" || filter === "studio" || filter === "gallery" || filter === "ribbon" || filter === "cipher") return filter;
  return null;
}

export function crestToneArg(filter: string): CrestTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "linen" || filter === "pale" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["lane,count"];
  for (const line of crestLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,clasp,wide,foyer,studio,gallery,ribbon,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = crestParts(row.note);
    if (!found.ok) continue;
    const lane = crestLane(row.note);
    lines.push([
      found.name,
      crestMark(row.note),
      lane,
      crestTone(row.note),
      String(crestStep(row.note)),
      stitchedCrest(row.note) ? "1" : "0",
      wideCrest(row.note) ? "1" : "0",
      lane === "foyer" ? "1" : "0",
      lane === "studio" ? "1" : "0",
      lane === "gallery" ? "1" : "0",
      lane === "ribbon" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
