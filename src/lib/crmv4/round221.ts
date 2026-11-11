/**
 * Belvedere steps for the customers terrace, and keeper seals already stored as assigneeName on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_belvedere_step (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   tread integer,
 *   glaze text not null default '',
 *   pace text not null default '',
 *   chime integer,
 *   lift integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_keeper_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_keeper_seal_review (
 *   customer_id text primary key
 * );
 */

export const BVS_KEY = "crmv4-belvedere-step";
export const BVS_VIEW_KEY = "crmv4-belvedere-views";
export const BVS_DENSITY_KEY = "crmv4-belvedere-density";
export const KPS_KEY = "crmv4-keeper-seal-hide";
export const KPS_REVIEW_KEY = "crmv4-keeper-seal-review";

export type GlazeName = "blank" | "ivory" | "slate" | "gold";

export type PaceName = "blank" | "still" | "walk" | "rush";

export type StepTray = "open" | "held" | "archived";

export type TreadPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type StepDensity = "roomy" | "close";

export type StepSort = "tread" | "keeper";

export type BelvedereStep = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  tread: number | null;
  glaze: string;
  pace: string;
  chime: number | null;
  lift: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  audit: string;
};

export type StepView = {
  id: string;
  name: string;
  tray: StepTray;
  query: string;
  keeper: string;
  glaze: string;
  pace: string;
  tread: string;
  chime: string;
  lift: string;
};

export type StepCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  lift: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "glaze", "tag", "lift", "chime"] as const;

const GLAZES = ["ivory", "slate", "gold"] as const;

const PACES = ["still", "walk", "rush"] as const;

const TEMPO_CYCLE = ["still", "walk", "rush"] as const;

const PEAK_TREADS = new Set([3, 7]);

const QUIET_TREADS = new Set([8]);

const HOUSE = new Set(["IVORY", "GOLD"]);

const STEP_CAP = 12;

const VIEW_CAP = 6;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StepTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glazeName(raw: unknown): Exclude<GlazeName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (GLAZES as readonly string[]).includes(text) ? (text as Exclude<GlazeName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function stepLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function stepNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A glaze is IVORY, SLATE, or GOLD. Anything else stays blank. Letters are stored in capitals. */
export function glazeOf(raw: unknown): string {
  const name = glazeName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A tread is an integer from 1 through 8.
 * A blank value stays unset. 0 is not a tread.
 * A second digit is not a tread.
 */
export function treadOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 8) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-8]$/.test(text)) return null;
  return Number(text);
}

/** A chime is 15, 30, or 45. A blank value stays unset. A leading zero is not a chime. */
export function chimeOf(raw: unknown): 15 | 30 | 45 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** Lift is 1, 3, or 5. Anything else is not a lift. 1 is the resting lift. */
export function liftOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

export function treadBand(tread: unknown): "blank" | "early" | "mid" | "late" {
  const value = treadOf(tread);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
  return "late";
}

/** Peak treads are 3 and 7. An unset tread is not a peak tread. */
export function peakTread(tread: unknown): boolean {
  const value = treadOf(tread);
  return value !== null && PEAK_TREADS.has(value);
}

/** The quiet tread is 8. A peak tread is not quiet. An unset tread is not quiet. */
export function quietTread(tread: unknown): boolean {
  const value = treadOf(tread);
  return value !== null && QUIET_TREADS.has(value);
}

/**
 * How far a tread sits behind the desk tread.
 * A positive gap means the step is behind. A negative gap means it is ahead.
 * A gap of zero means the same tread. An unset tread has no gap. Treads do not wrap.
 */
export function treadGap(tread: unknown, desk: unknown): number | null {
  const from = treadOf(tread);
  const at = treadOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and GOLD are house glazes. SLATE is a guest glaze. A blank glaze is not a house glaze. */
export function houseGlaze(glaze: unknown): boolean {
  return HOUSE.has(glazeOf(glaze));
}

/** Roomy or close. Anything else stays roomy. */
export function densityOf(raw: unknown): StepDensity {
  return raw === "close" ? "close" : "roomy";
}

/** Tread or keeper. Anything else stays on the tread. */
export function sortMode(raw: unknown): StepSort {
  return raw === "keeper" ? "keeper" : "tread";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[e-g]$/.test(text) ? text : "";
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

function readOne(raw: unknown): BelvedereStep | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<BelvedereStep>;
  const id = clip(row.id, 24);
  const title = stepLine(row.title);
  if (!id || !title) return null;
  const lift = liftOf(row.lift);
  return {
    id,
    title,
    note: stepNote(row.note),
    keeper: keeperLabel(row.keeper),
    tread: treadOf(row.tread),
    glaze: glazeOf(row.glaze),
    pace: paceName(row.pace),
    chime: chimeOf(row.chime),
    lift: lift === null ? 1 : lift,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    audit: auditCode(row.audit),
  };
}

export function readSteps(raw: unknown): BelvedereStep[] {
  if (!Array.isArray(raw)) return [];
  const out: BelvedereStep[] = [];
  for (const item of raw) {
    const step = readOne(item);
    if (!step || out.some((row) => row.id === step.id || row.title === step.title)) continue;
    out.push(step);
  }
  return out.slice(0, STEP_CAP);
}

export function addStep(
  steps: readonly BelvedereStep[],
  step: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    tread?: unknown;
    glaze?: string;
    pace?: string;
    chime?: unknown;
    lift?: unknown;
    tags?: unknown;
  },
): BelvedereStep[] {
  const current = readSteps(steps);
  const id = String(step.id || "").trim();
  const title = stepLine(step.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const lift = liftOf(step.lift);
  const next: BelvedereStep = {
    id,
    title,
    note: stepNote(step.note),
    keeper: keeperLabel(step.keeper),
    tread: treadOf(step.tread),
    glaze: glazeOf(step.glaze),
    pace: paceName(step.pace),
    chime: chimeOf(step.chime),
    lift: lift === null ? 1 : lift,
    tags: tagsOf(step.tags),
    pinned: false,
    held: false,
    archived: false,
    audit: "save",
  };
  return [next, ...current].slice(0, STEP_CAP);
}

/** A blank pace becomes still, still becomes walk, walk becomes rush, and rush returns to still. */
export function cyclePace(steps: readonly BelvedereStep[], id: string): BelvedereStep[] {
  return readSteps(steps).map((step) => {
    if (step.id !== id) return step;
    const at = TEMPO_CYCLE.indexOf(step.pace as (typeof TEMPO_CYCLE)[number]);
    const next = at < 0 ? TEMPO_CYCLE[0] : TEMPO_CYCLE[(at + 1) % TEMPO_CYCLE.length];
    if (!next || next === step.pace) return step;
    return { ...step, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editStep(steps: readonly BelvedereStep[], id: string, title: unknown): BelvedereStep[] {
  const next = stepLine(title);
  if (!next) return readSteps(steps);
  const current = readSteps(steps);
  if (current.some((step) => step.id !== id && step.title === next)) return current;
  return current.map((step) => (step.id === id && step.title !== next ? { ...step, title: next, audit: "edit" } : step));
}

/** A blank note is left as it is. */
export function editStepNote(steps: readonly BelvedereStep[], id: string, note: unknown): BelvedereStep[] {
  const next = stepNote(note);
  if (!next) return readSteps(steps);
  return readSteps(steps).map((step) => (step.id === id && step.note !== next ? { ...step, note: next, audit: "edit" } : step));
}

/** A tag that is already on the step, or a fourth tag, is left out. A tag is one letter from e to g. */
export function addStepTag(steps: readonly BelvedereStep[], id: string, tag: unknown): BelvedereStep[] {
  const next = tagOf(tag);
  if (!next) return readSteps(steps);
  return readSteps(steps).map((step) => {
    if (step.id !== id || step.tags.includes(next) || step.tags.length >= TAG_CAP) return step;
    return { ...step, tags: [...step.tags, next], audit: "tag" };
  });
}

/** An unknown lift is left as it is. 1 returns the step to the resting lift. */
export function setStepLift(steps: readonly BelvedereStep[], id: string, lift: unknown): BelvedereStep[] {
  const next = liftOf(lift);
  if (next === null) return readSteps(steps);
  return readSteps(steps).map((step) => (step.id === id && step.lift !== next ? { ...step, lift: next, audit: "lift" } : step));
}

/** An unset chime becomes 15, 15 becomes 30, 30 becomes 45, and 45 stays. */
export function snoozeStep(steps: readonly BelvedereStep[], id: string): BelvedereStep[] {
  return readSteps(steps).map((step) => {
    if (step.id !== id) return step;
    const next = step.chime === 15 ? 30 : step.chime === 30 ? 45 : step.chime === 45 ? 45 : 15;
    if (next === step.chime) return step;
    return { ...step, chime: next, audit: "chime" };
  });
}

export function setStepPin(steps: readonly BelvedereStep[], id: string, pinned: boolean): BelvedereStep[] {
  return readSteps(steps).map((step) => (step.id === id && step.pinned !== pinned ? { ...step, pinned, audit: pinned ? "pin" : "unpin" } : step));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(steps: readonly BelvedereStep[], shownIds: readonly string[], index: number): BelvedereStep[] {
  if (!shownIds.length) return readSteps(steps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSteps(steps).find((step) => step.id === id);
  if (!row) return readSteps(steps);
  return setStepPin(steps, id, !row.pinned);
}

/** B lengthens the chime on the focused step. */
export function snoozeFocused(steps: readonly BelvedereStep[], shownIds: readonly string[], index: number): BelvedereStep[] {
  if (!shownIds.length) return readSteps(steps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readSteps(steps).some((step) => step.id === id)) return readSteps(steps);
  return snoozeStep(steps, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(steps: readonly BelvedereStep[], shownIds: readonly string[], index: number): BelvedereStep[] {
  if (!shownIds.length) return readSteps(steps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readSteps(steps).find((step) => step.id === id);
  if (!row) return readSteps(steps);
  return setStepHold(steps, id, !row.held);
}

/** F cycles the pace on the focused step. */
export function paceFocused(steps: readonly BelvedereStep[], shownIds: readonly string[], index: number): BelvedereStep[] {
  if (!shownIds.length) return readSteps(steps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readSteps(steps).some((step) => step.id === id)) return readSteps(steps);
  return cyclePace(steps, id);
}

export function setStepHold(steps: readonly BelvedereStep[], id: string, held: boolean): BelvedereStep[] {
  return readSteps(steps).map((step) => (step.id === id && step.held !== held ? { ...step, held, audit: held ? "hold" : "resume" } : step));
}

export function setStepArchive(steps: readonly BelvedereStep[], id: string, archived: boolean): BelvedereStep[] {
  return readSteps(steps).map((step) => (step.id === id && step.archived !== archived ? { ...step, archived, audit: archived ? "archive" : "open" } : step));
}

export function bulkStepGlaze(steps: readonly BelvedereStep[], ids: readonly string[], glaze: unknown): BelvedereStep[] {
  const next = glazeOf(glaze);
  if (!next) return readSteps(steps);
  const picked = new Set(ids);
  return readSteps(steps).map((step) => (picked.has(step.id) && step.glaze !== next ? { ...step, glaze: next, audit: "glaze" } : step));
}

export function bulkStepPin(steps: readonly BelvedereStep[], ids: readonly string[], pinned: boolean): BelvedereStep[] {
  const picked = new Set(ids);
  return readSteps(steps).map((step) => (picked.has(step.id) && step.pinned !== pinned ? { ...step, pinned, audit: pinned ? "pin" : "unpin" } : step));
}

export function bulkStepArchive(steps: readonly BelvedereStep[], ids: readonly string[], archived: boolean): BelvedereStep[] {
  const picked = new Set(ids);
  return readSteps(steps).map((step) => (picked.has(step.id) && step.archived !== archived ? { ...step, archived, audit: archived ? "archive" : "open" } : step));
}

export function bulkStepPace(steps: readonly BelvedereStep[], ids: readonly string[], pace: unknown): BelvedereStep[] {
  const next = paceName(pace);
  if (!next) return readSteps(steps);
  const picked = new Set(ids);
  return readSteps(steps).map((step) => (picked.has(step.id) && step.pace !== next ? { ...step, pace: next, audit: "pace" } : step));
}

export function bulkStepTag(steps: readonly BelvedereStep[], ids: readonly string[], tag: unknown): BelvedereStep[] {
  return ids.reduce((rows, id) => addStepTag(rows, id, tag), readSteps(steps));
}

export function resetSteps(): BelvedereStep[] {
  return [];
}

function inTray(step: BelvedereStep, tray: StepTray): boolean {
  if (tray === "archived") return step.archived;
  if (tray === "held") return step.held && !step.archived;
  return !step.held && !step.archived;
}

function treadHit(tread: number | null, exact: number | null, pick: TreadPick | null): boolean {
  if (exact !== null) return tread === exact;
  if (pick === null) return true;
  if (pick === "blank") return tread === null;
  if (pick === "peak") return peakTread(tread);
  if (pick === "quiet") return quietTread(tread);
  return treadBand(tread) === pick;
}

/** An open step whose tread sits more than two treads behind the desk. A raised lift, a hold, or an archive is not late. */
export function lateStep(step: BelvedereStep, desk: unknown): boolean {
  const gap = treadGap(step.tread, desk);
  return inTray(step, "open") && step.lift === 1 && gap !== null && gap > 2;
}

/** An open step with a chime of 15 is due now. A raised lift, a hold, or an archive is not. */
export function soonStep(step: BelvedereStep): boolean {
  return inTray(step, "open") && step.lift === 1 && step.chime === 15;
}

/** Open steps that are late or due now. A raised step stays off the reminder list. */
export function reminderSteps(steps: readonly BelvedereStep[], desk: unknown): BelvedereStep[] {
  return readSteps(steps).filter((step) => lateStep(step, desk) || soonStep(step));
}

/** Open steps whose tread sits within one tread of the desk. A raised lift, a hold, or an archive stays out. */
export function windowSteps(steps: readonly BelvedereStep[], desk: unknown): BelvedereStep[] {
  return readSteps(steps).filter((step) => {
    const gap = treadGap(step.tread, desk);
    return inTray(step, "open") && step.lift === 1 && gap !== null && Math.abs(gap) <= 2;
  });
}

/** Open resting steps whose tread is the desk tread. */
export function matchedSteps(steps: readonly BelvedereStep[], desk: unknown): number {
  const at = treadOf(desk);
  if (at === null) return 0;
  return readSteps(steps).filter((step) => inTray(step, "open") && step.lift === 1 && step.tread === at).length;
}

/** Search matches the title, the note, the keeper, and the tags. */
export function visibleSteps(
  steps: readonly BelvedereStep[],
  tray: StepTray,
  query: string,
  keeper: string | null,
  glaze: string | null,
  pace: string | null,
  exact: number | null,
  pick: TreadPick | null,
  chime: number | "blank" | null,
  lift: number | "blank" | null,
  rushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  lightOnly: boolean,
): BelvedereStep[] {
  const text = query.trim().toLowerCase();
  return readSteps(steps).filter((step) => {
    if (!inTray(step, tray)) return false;
    if (text) {
      const hay = `${step.title} ${step.note} ${step.keeper} ${step.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (keeper !== null && step.keeper !== keeper) return false;
    if (glaze === "blank" ? Boolean(step.glaze) : glaze && step.glaze !== glaze) return false;
    if (pace === "blank" ? Boolean(step.pace) : pace && step.pace !== pace) return false;
    if (!treadHit(step.tread, exact, pick)) return false;
    if (chime === "blank" ? step.chime !== null : chime !== null && step.chime !== chime) return false;
    if (lift === "blank" ? step.lift !== 1 : lift !== null && step.lift !== lift) return false;
    if (rushOnly && step.pace !== "rush") return false;
    if (peakOnly && !peakTread(step.tread)) return false;
    if (houseOnly && !houseGlaze(step.glaze)) return false;
    if (quietOnly && !quietTread(step.tread)) return false;
    if (lightOnly && step.lift !== 1) return false;
    return true;
  });
}

export function sortSteps(steps: readonly BelvedereStep[], mode: StepSort): BelvedereStep[] {
  const rows = steps.slice();
  if (mode === "keeper") return rows.sort((a, b) => a.keeper.localeCompare(b.keeper) || (a.tread ?? 99) - (b.tread ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.tread ?? 99) - (b.tread ?? 99) || a.title.localeCompare(b.title));
}

export function stepLedger(steps: readonly BelvedereStep[], query: string): BelvedereStep[] {
  const text = query.trim().toLowerCase();
  return sortSteps(
    readSteps(steps).filter((step) => step.tread !== null && (!text || step.title.toLowerCase().includes(text))),
    "tread",
  );
}

export function stepCounts(steps: readonly BelvedereStep[], desk: unknown): StepCounts {
  const rows = readSteps(steps);
  return {
    open: rows.filter((step) => inTray(step, "open")).length,
    held: rows.filter((step) => inTray(step, "held")).length,
    archived: rows.filter((step) => inTray(step, "archived")).length,
    pinned: rows.filter((step) => step.pinned).length,
    peak: rows.filter((step) => inTray(step, "open") && step.lift === 1 && peakTread(step.tread)).length,
    late: rows.filter((step) => lateStep(step, desk)).length,
    soon: rows.filter((step) => soonStep(step)).length,
    lift: rows.filter((step) => inTray(step, "open") && step.lift > 1).length,
    house: rows.filter((step) => inTray(step, "open") && houseGlaze(step.glaze)).length,
    window: windowSteps(rows, desk).length,
    matched: matchedSteps(rows, desk),
  };
}

export function stepShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open steps as a share of every open step. */
export function lateShare(steps: readonly BelvedereStep[], desk: unknown): number {
  const rows = readSteps(steps);
  const open = rows.filter((step) => inTray(step, "open")).length;
  const late = rows.filter((step) => lateStep(step, desk)).length;
  return stepShare(late, open);
}

/** Distinct treads on open steps. */
export function usedTreads(steps: readonly BelvedereStep[]): number {
  const treads = new Set<number>();
  for (const step of readSteps(steps)) {
    if (inTray(step, "open") && step.tread !== null) treads.add(step.tread);
  }
  return treads.size;
}

/** Open steps that share a tread and a glaze. A different glaze on the same tread is not a clash. */
export function clashTreadCount(steps: readonly BelvedereStep[]): number {
  const groups = new Map<string, number>();
  for (const step of readSteps(steps)) {
    if (!inTray(step, "open") || step.tread === null || !step.glaze) continue;
    const key = `${step.tread}:${step.glaze}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open steps that share a chime. An unset chime is not a clash. */
export function chimeClashCount(steps: readonly BelvedereStep[]): number {
  const groups = new Map<number, number>();
  for (const step of readSteps(steps)) {
    if (!inTray(step, "open") || step.chime === null) continue;
    groups.set(step.chime, (groups.get(step.chime) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open steps in the same glaze whose treads differ by three.
 * The count is the steps that have at least one neighbor.
 */
export function adjacentStepCount(steps: readonly BelvedereStep[]): number {
  const open = readSteps(steps).filter((step) => inTray(step, "open") && step.tread !== null && step.glaze);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.glaze === right.glaze && Math.abs((left.tread ?? 0) - (right.tread ?? 0)) === 3) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The glaze with the fewest open steps.
 * A tie keeps IVORY, then SLATE, then GOLD.
 * An empty desk still suggests IVORY.
 */
export function suggestGlaze(steps: readonly BelvedereStep[]): "IVORY" | "SLATE" | "GOLD" {
  const rows = readSteps(steps).filter((step) => inTray(step, "open"));
  const order = ["IVORY", "SLATE", "GOLD"] as const;
  let best: "IVORY" | "SLATE" | "GOLD" = "IVORY";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const glaze of order) {
    const count = rows.filter((step) => step.glaze === glaze).length;
    if (count < bestCount) {
      best = glaze;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The chime with the fewest open steps.
 * A tie keeps 30, then 15, then 45.
 * An empty desk still suggests 30.
 */
export function suggestChime(steps: readonly BelvedereStep[]): 15 | 30 | 45 {
  const rows = readSteps(steps).filter((step) => inTray(step, "open"));
  const order = [30, 15, 45] as const;
  let best: 15 | 30 | 45 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const chime of order) {
    const count = rows.filter((step) => step.chime === chime).length;
    if (count < bestCount) {
      best = chime;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open keeper. A blank keeper is skipped. An empty desk stays blank. */
export function suggestKeeper(steps: readonly BelvedereStep[]): string {
  const found = readSteps(steps).find((step) => inTray(step, "open") && step.keeper);
  return found ? found.keeper : "";
}

/**
 * The keeper carrying the fewest open steps.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty roster falls back to the newest keeper.
 */
export function fairKeeper(steps: readonly BelvedereStep[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(steps);
  const open = readSteps(steps).filter((step) => inTray(step, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((step) => step.keeper === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The keeper with the most open steps. A tie keeps the newer name on the desk. */
export function busiestKeeper(steps: readonly BelvedereStep[]): string {
  const rows = readSteps(steps).filter((step) => inTray(step, "open") && step.keeper);
  const names: string[] = [];
  for (const step of rows) if (!names.includes(step.keeper)) names.push(step.keeper);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((step) => step.keeper === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function stepKeepers(steps: readonly BelvedereStep[]): string[] {
  const out: string[] = [];
  for (const step of readSteps(steps)) {
    if (step.keeper && !out.includes(step.keeper)) out.push(step.keeper);
  }
  return out;
}

export function stepGlazes(steps: readonly BelvedereStep[]): string[] {
  const out: string[] = [];
  for (const step of readSteps(steps)) {
    if (step.glaze && !out.includes(step.glaze)) out.push(step.glaze);
  }
  return out;
}

/** Open steps whose keeper also keeps another open step on a different tread. */
export function pairKeeperCount(steps: readonly BelvedereStep[]): number {
  const open = readSteps(steps).filter((step) => inTray(step, "open") && step.keeper && step.tread !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].keeper === open[j].keeper && open[i].tread !== open[j].tread) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open steps that share a glaze on different treads. */
export function sharedGlazeCount(steps: readonly BelvedereStep[]): number {
  const open = readSteps(steps).filter((step) => inTray(step, "open") && step.glaze && step.tread !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].glaze === open[j].glaze && open[i].tread !== open[j].tread) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The lift of open steps. The resting lift of 1 still counts. */
export function liftLoad(steps: readonly BelvedereStep[]): number {
  return readSteps(steps).filter((step) => inTray(step, "open")).reduce((sum, step) => sum + step.lift, 0);
}

/** Open steps that are both the quiet tread and a house glaze. */
export function quietHallCount(steps: readonly BelvedereStep[]): number {
  return readSteps(steps).filter((step) => inTray(step, "open") && quietTread(step.tread) && houseGlaze(step.glaze)).length;
}

/** Open steps whose pace is rush. */
export function rushLoad(steps: readonly BelvedereStep[]): number {
  return readSteps(steps).filter((step) => inTray(step, "open") && step.pace === "rush").length;
}

/** The span from the lowest open tread to the highest. Fewer than two treads span nothing. */
export function treadSpan(steps: readonly BelvedereStep[]): number {
  const treads = readSteps(steps).filter((step) => inTray(step, "open") && step.tread !== null).map((step) => step.tread as number);
  if (treads.length < 2) return 0;
  return Math.max(...treads) - Math.min(...treads);
}

/**
 * The next open step at or after the desk tread.
 * A rush pace, a raised lift, a hold, and an archive stay off the list.
 * When every open tread is behind, the earliest tread is next.
 */
export function nextStep(steps: readonly BelvedereStep[], desk: unknown): string {
  const now = treadOf(desk);
  if (now === null) return "";
  const waiting = readSteps(steps).filter((step) => inTray(step, "open") && step.tread !== null && step.pace !== "rush" && step.lift === 1);
  if (!waiting.length) return "";
  const byTread = (a: BelvedereStep, b: BelvedereStep) => (a.tread ?? 0) - (b.tread ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((step) => (step.tread ?? 0) >= now).sort(byTread);
  const upcoming = later[0];
  if (upcoming) return upcoming.id;
  const earliest = waiting.slice().sort(byTread)[0];
  return earliest ? earliest.id : "";
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function stepCopy(step: BelvedereStep, desk: unknown): string {
  const gap = treadGap(step.tread, desk);
  return [step.title, step.keeper, step.tread ?? "", step.glaze, step.pace, step.chime ?? "", step.lift, step.tags.join(" "), step.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the steps saved in this browser. The gap and the late mark use the tread you pass. */
export function stepsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,tread,glaze,pace,chime,lift,tags,pinned,held,archived,gap,late,soon,house,window,matched,note,audit"];
  const rows = readSteps(raw);
  const windowIds = new Set(windowSteps(rows, desk).map((step) => step.id));
  const at = treadOf(desk);
  for (const step of rows) {
    const gap = treadGap(step.tread, desk);
    lines.push([
      step.title,
      step.keeper,
      step.tread === null ? "" : String(step.tread),
      step.glaze,
      step.pace,
      step.chime === null ? "" : String(step.chime),
      String(step.lift),
      step.tags.join(" "),
      step.pinned ? "1" : "0",
      step.held ? "1" : "0",
      step.archived ? "1" : "0",
      gap === null ? "" : String(gap),
      lateStep(step, desk) ? "1" : "0",
      soonStep(step) ? "1" : "0",
      houseGlaze(step.glaze) ? "1" : "0",
      windowIds.has(step.id) ? "1" : "0",
      at !== null && step.tread === at && step.lift === 1 && inTray(step, "open") ? "1" : "0",
      step.note,
      step.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeKeeper(raw: string, keepers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return keepers.includes(raw) ? raw : "all";
}

export function activeGlaze(raw: string, glazes: readonly string[]): string {
  if (raw === "blank") return "blank";
  return glazeOf(raw) && glazes.includes(glazeOf(raw)) ? glazeOf(raw) : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "blank") return "blank";
  const pace = paceName(raw);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeTread(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const tread = treadOf(raw);
  return tread === null ? "all" : String(tread);
}

export function activeChime(raw: string): string {
  if (raw === "blank") return "blank";
  const chime = chimeOf(raw);
  return chime === null ? "all" : String(chime);
}

export function activeLift(raw: string): string {
  if (raw === "blank") return "blank";
  const lift = liftOf(raw);
  return lift === null ? "all" : String(lift);
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function glazeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return glazeOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function treadArg(filter: string): { exact: number | null; pick: TreadPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: treadOf(filter), pick: null };
}

export function chimeArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return chimeOf(filter);
}

export function liftArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return liftOf(filter);
}

function readView(raw: unknown): StepView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<StepView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    keeper: row.keeper === "blank" ? "blank" : clip(row.keeper, 18) || "all",
    glaze: row.glaze === "blank" || row.glaze === "all" ? (row.glaze === "blank" ? "blank" : "all") : glazeOf(row.glaze) || "all",
    pace: row.pace === "blank" || row.pace === "all" ? (row.pace === "blank" ? "blank" : "all") : paceName(row.pace) || "all",
    tread: activeTread(String(row.tread || "all")),
    chime: activeChime(String(row.chime || "all")),
    lift: activeLift(String(row.lift || "all")),
  };
}

export function readStepViews(raw: unknown): StepView[] {
  if (!Array.isArray(raw)) return [];
  const out: StepView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addStepView(views: readonly StepView[], view: StepView): StepView[] {
  const current = readStepViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropStepView(views: readonly StepView[], id: string): StepView[] {
  return readStepViews(views).filter((view) => view.id !== id);
}

export type KeeperState = "" | "set" | "clear";

export type KeeperLane = "" | "hall" | "wing" | "porch";

export type KeeperTone = "" | "gold" | "ink" | "ivory" | "mist";

export type KeeperShape = "all" | "catalog" | "wide" | "gold";

export type KeeperValue =
  | string
  | {
      assigneeName?: unknown;
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
      keeper?: unknown;
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

export type KeeperRow = { id: string; label?: string; note: KeeperValue };

export type KeeperLaneLine = { lane: string; count: number };

const KEEPER_LANES = ["hall", "wing", "porch"] as const;

const KEEPER_TONES = ["gold", "ink", "ivory", "mist"] as const;

const KEEPER_BLOCK = ["lastCity", "tradingGroup", "email", "phone", "affiliateA", "affiliateB", "affiliateC", "language", "address", "country", "city", "desk", "name", "username", "accountType", "lastBrowser", "isResident", "documentsStatus"] as const;

const BOOK = new Set(["ada", "noor", "leif", "mira", "otto"]);

function keeperBody(raw: unknown): string {
  return clip(raw, 28).toLowerCase().replace(/[^a-z -]/g, "").replace(/\s+/g, " ").trim();
}

function keeperText(value: KeeperValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string" || value == null) {
    if (value == null) return { text: "", explicit: true };
    return { text: keeperBody(value), explicit: true };
  }
  if (typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (KEEPER_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("assigneeName" in value)) return { text: null, explicit: false };
  const inner = value.assigneeName;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: keeperBody(inner), explicit: true };
}

export function keeperState(value: KeeperValue): KeeperState {
  const found = keeperText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function keeperCopy(value: KeeperValue): string {
  const found = keeperText(value);
  return found.explicit && found.text ? found.text : "";
}

/** The seal is the first two letters, with spaces left out. */
export function sealOf(value: KeeperValue): string {
  const text = keeperCopy(value).replace(/ /g, "");
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

/**
 * Ada, Noor, Leif, Mira, Otto, or a name that contains fx, is the hall.
 * Any other keeper with a hyphen is the wing.
 * Any other text is the porch.
 */
export function keeperLane(value: KeeperValue): KeeperLane {
  const text = keeperCopy(value);
  if (!text) return "";
  if (BOOK.has(text) || text.includes("fx")) return "hall";
  if (text.includes("-")) return "wing";
  return "porch";
}

/** A house keeper is gold. A keeper longer than ten characters is ivory. A keeper with a space is mist. Anything else is ink. */
export function keeperTone(value: KeeperValue): KeeperTone {
  const text = keeperCopy(value);
  if (!text) return "";
  if (BOOK.has(text)) return "gold";
  if (text.length > 10) return "ivory";
  if (text.includes(" ")) return "mist";
  return "ink";
}

/** Ada, Noor, Leif, Mira, and Otto belong to the house book. */
export function catalogKeeper(value: KeeperValue): boolean {
  return BOOK.has(keeperCopy(value));
}

export function catalogKeeperCount(rows: readonly KeeperRow[]): number {
  return rows.filter((row) => catalogKeeper(row.note)).length;
}

/** A keeper longer than ten characters is wide. */
export function wideKeeper(value: KeeperValue): boolean {
  const text = keeperCopy(value);
  return text.length > 10;
}

export function wideKeeperCount(rows: readonly KeeperRow[]): number {
  return rows.filter((row) => wideKeeper(row.note)).length;
}

export function goldKeeperCount(rows: readonly KeeperRow[]): number {
  return rows.filter((row) => keeperTone(row.note) === "gold").length;
}

/** Customers whose keeper seal is shared with at least one other customer. */
export function sharedSealCount(rows: readonly KeeperRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const seal = sealOf(row.note);
    if (!seal) continue;
    groups.set(seal, (groups.get(seal) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function keeperLanes(rows: readonly KeeperRow[]): KeeperLaneLine[] {
  return KEEPER_LANES.map((lane) => ({ lane, count: rows.filter((row) => keeperLane(row.note) === lane).length }));
}

/** The lane with the most set cities. A tie keeps hall, then wing, then porch. */
export function leadingKeeper(rows: readonly KeeperRow[]): string {
  const lines = keeperLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || KEEPER_LANES.indexOf(a.lane as (typeof KEEPER_LANES)[number]) - KEEPER_LANES.indexOf(b.lane as (typeof KEEPER_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set cities. A tie keeps gold, then ink, then ivory, then mist. */
export function leadingKeeperTone(rows: readonly KeeperRow[]): string {
  const counts = KEEPER_TONES.map((tone) => ({ tone, count: rows.filter((row) => keeperTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || KEEPER_TONES.indexOf(a.tone) - KEEPER_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function keeperShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** A clear keeper is 0. A single word is 1, a space is 2, and a hyphen is 3. */
export function keeperStep(value: KeeperValue): 0 | 1 | 2 | 3 {
  const text = keeperCopy(value);
  if (!text) return 0;
  if (text.includes("-")) return 3;
  if (text.includes(" ")) return 2;
  return 1;
}

export function presentCities(rows: readonly KeeperRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = keeperState(row.note);
    const lane = state === "set" ? keeperLane(row.note) : state === "clear" ? "blank" : "";
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

export function toggleKeeper(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleKeeperReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkKeeperReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleKeeperLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleKeeperCustomers(
  rows: readonly KeeperRow[],
  lane: KeeperLane | "blank" | null,
  tone: KeeperTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: KeeperShape,
): KeeperRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = keeperState(row.note);
    const mark = state === "set" ? keeperLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && keeperTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogKeeper(row.note)) return false;
    if (shape === "wide" && !wideKeeper(row.note)) return false;
    if (shape === "gold" && keeperTone(row.note) !== "gold") return false;
    if (text) {
      const hay = `${row.label || ""} ${keeperCopy(row.note)} ${sealOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeKeeperLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeKeeperTone(raw: string): string {
  return raw === "gold" || raw === "ink" || raw === "ivory" || raw === "mist" ? raw : "all";
}

export function keeperLaneArg(filter: string): KeeperLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "hall" || filter === "wing" || filter === "porch") return filter;
  return null;
}

export function keeperToneArg(filter: string): KeeperTone | null {
  if (filter === "gold" || filter === "ink" || filter === "ivory" || filter === "mist") return filter;
  return null;
}

export function sealsCsv(rows: readonly KeeperRow[]): string {
  const lines = ["kind,seal,count"];
  for (const line of keeperLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogKeeperCount(rows)}`);
  lines.push(`wide,wide,${wideKeeperCount(rows)}`);
  lines.push(`tone,gold,${goldKeeperCount(rows)}`);
  lines.push(`tone,mist,${rows.filter((row) => keeperTone(row.note) === "mist").length}`);
  lines.push(`shared,shared,${sharedSealCount(rows)}`);
  return lines.join("\n");
}

export function keeperRowsCsv(rows: readonly KeeperRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,lane,tone,step,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = keeperState(row.note);
    const lane = state === "set" ? keeperLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      sealOf(row.note),
      lane,
      state === "set" ? keeperTone(row.note) : "",
      String(keeperStep(row.note)),
      catalogKeeper(row.note) ? "1" : "0",
      wideKeeper(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
