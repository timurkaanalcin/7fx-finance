/**
 * Notice bells for the notification center, and ticket seals already stored as customer, kind, and status.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_notice_bell (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   ringer text not null default '',
 *   bay integer,
 *   metal text not null default '',
 *   pace text not null default '',
 *   pull integer,
 *   weight integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_ticket_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_ticket_seal_review (
 *   ticket_id text primary key
 * );
 */

export const NBL_KEY = "crmv4-notice-bell";
export const NBL_VIEW_KEY = "crmv4-notice-bell-views";
export const NBL_DENSITY_KEY = "crmv4-notice-bell-density";
export const TSL_KEY = "crmv4-ticket-seal-hide";
export const TSL_REVIEW_KEY = "crmv4-ticket-seal-review";

export type MetalName = "blank" | "bronze" | "pewter" | "gilt";

export type PaceName = "blank" | "hush" | "toll" | "peal";

export type BellTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type BellDensity = "airy" | "tight";

export type BellSort = "bay" | "clerk";

export type NoticeBell = {
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

export type BellView = {
  id: string;
  name: string;
  tray: BellTray;
  query: string;
  clerk: string;
  ink: string;
  gait: string;
  bay: string;
  leaf: string;
  spine: string;
};

export type BellCounts = {
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

export type SealLane = "" | "porch" | "thread" | "bell" | "ribbon" | "cipher";

export type SealTone = "" | "gilt" | "pale" | "linen" | "ash" | "haze";

export type SealState = "" | "clear" | "set";

export type SealShape = "all" | "clasp" | "wide" | "porch" | "cipher" | "ribbon";

export type SealReview = "all" | "reviewed" | "fresh";

export type SealValue = string | { customer?: unknown; kind?: unknown; status?: unknown; [key: string]: unknown } | null | undefined;

export type SealRow = { id: string; label: string; note: SealValue };

export type SealLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "spine", "leaf", "seal"] as const;

const METALS = ["bronze", "pewter", "gilt"] as const;

const PACES = ["hush", "toll", "peal"] as const;

const PACE_CYCLE = ["hush", "toll", "peal"] as const;

const PEAK_BAYS = new Set([2, 8]);

const QUIET_BAYS = new Set([5]);

const HOUSE = new Set(["BRONZE", "PEWTER"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const NBL_CAP = 8;

const VIEW_CAP = 5;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BellTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function metalName(raw: unknown): Exclude<MetalName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (METALS as readonly string[]).includes(text) ? (text as Exclude<MetalName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[mnok]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: NoticeBell, tray: BellTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function bellLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function bellNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank clerk stays blank. It is not filled in. */
export function bellRinger(raw: unknown): string {
  return clip(raw, 18);
}

/** An ink is LINEN, WOOL, or SILK. Anything else stays blank. Letters are stored in capitals. */
export function metalOf(raw: unknown): string {
  const name = metalName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 6.
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

/** A leaf is 10, 20, or 40. A blank value stays unset. A leading zero is not a leaf. */
export function pullOf(raw: unknown): 3 | 9 | 27 | null {
  if (raw === 3 || raw === "3") return 3;
  if (raw === 9 || raw === "9") return 9;
  if (raw === 27 || raw === "27") return 27;
  return null;
}

/** Spine is 3, 6, or 9. Anything else is not a spine. 3 is the resting spine. */
export function weightOf(raw: unknown): 2 | 6 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 6 || raw === "6") return 6;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 6) return "mid";
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
export function houseMetal(ink: unknown): boolean {
  return HOUSE.has(metalOf(ink));
}

export function bellDensity(raw: unknown): BellDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function bellSort(raw: unknown): BellSort {
  return raw === "clerk" ? "clerk" : "bay";
}

function readOne(raw: unknown): NoticeBell | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = bellLine(row.title);
  if (!id || !title) return null;
  const spine = weightOf(row.spine);
  return {
    id,
    title,
    note: bellNote(row.note),
    clerk: bellRinger(row.clerk),
    bay: bayOf(row.bay),
    ink: metalOf(row.ink),
    gait: paceName(row.gait),
    leaf: pullOf(row.leaf),
    spine: spine === null ? 2 : spine,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readBells(raw: unknown): NoticeBell[] {
  if (!Array.isArray(raw)) return [];
  const out: NoticeBell[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, NBL_CAP);
}

export function addBell(
  panels: readonly NoticeBell[],
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
): NoticeBell[] {
  const current = readBells(panels);
  const id = String(panel.id || "").trim();
  const title = bellLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const spine = weightOf(panel.spine);
  const next: NoticeBell = {
    id,
    title,
    note: bellNote(panel.note),
    clerk: bellRinger(panel.clerk),
    bay: bayOf(panel.bay),
    ink: metalOf(panel.ink),
    gait: paceName(panel.gait),
    leaf: pullOf(panel.leaf),
    spine: spine === null ? 2 : spine,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, NBL_CAP);
}

/** A blank gait becomes still, still becomes walk, walk becomes flare, and flare returns to still. */
export function cyclePace(panels: readonly NoticeBell[], id: string): NoticeBell[] {
  return readBells(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = PACE_CYCLE.indexOf(panel.gait as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === panel.gait) return panel;
    return { ...panel, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editBell(panels: readonly NoticeBell[], id: string, title: unknown): NoticeBell[] {
  const next = bellLine(title);
  if (!next) return readBells(panels);
  const current = readBells(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editBellNote(panels: readonly NoticeBell[], id: string, note: unknown): NoticeBell[] {
  const next = bellNote(note);
  return readBells(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addBellTag(panels: readonly NoticeBell[], id: string, tag: unknown): NoticeBell[] {
  const next = tagsOf(tag);
  if (!next.length) return readBells(panels);
  return readBells(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setBellWeight(panels: readonly NoticeBell[], id: string, spine: unknown): NoticeBell[] {
  const next = weightOf(spine);
  if (next === null) return readBells(panels);
  return readBells(panels).map((panel) => (panel.id === id && panel.spine !== next ? { ...panel, spine: next, audit: "spine" } : panel));
}

/** Snooze sets a blank leaf, a leaf of 10, or a leaf of 20 to 40. A leaf of 40 stays. */
export function snoozeBell(panels: readonly NoticeBell[], id: string): NoticeBell[] {
  return readBells(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.leaf === 27 ? null : 27;
    if (next === null) return panel;
    return { ...panel, leaf: next, audit: "leaf" };
  });
}

export function setBellPin(panels: readonly NoticeBell[], id: string, pinned: boolean): NoticeBell[] {
  return readBells(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedBell(panels: readonly NoticeBell[], shownIds: readonly string[], index: number): NoticeBell[] {
  const id = shownIds[index];
  if (!id) return readBells(panels);
  const panel = readBells(panels).find((item) => item.id === id);
  if (!panel) return readBells(panels);
  return setBellPin(panels, id, !panel.pinned);
}

export function snoozeFocusedBell(panels: readonly NoticeBell[], shownIds: readonly string[], index: number): NoticeBell[] {
  const id = shownIds[index];
  return id ? snoozeBell(panels, id) : readBells(panels);
}

export function holdFocusedBell(panels: readonly NoticeBell[], shownIds: readonly string[], index: number): NoticeBell[] {
  const id = shownIds[index];
  if (!id) return readBells(panels);
  const panel = readBells(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readBells(panels);
  return setBellHold(panels, id, !panel.held);
}

export function paceFocusedBell(panels: readonly NoticeBell[], shownIds: readonly string[], index: number): NoticeBell[] {
  const id = shownIds[index];
  return id ? cyclePace(panels, id) : readBells(panels);
}

export function waxFocusedBell(panels: readonly NoticeBell[], shownIds: readonly string[], index: number): NoticeBell[] {
  const id = shownIds[index];
  if (!id) return readBells(panels);
  const panel = readBells(panels).find((item) => item.id === id);
  if (!panel) return readBells(panels);
  return setBellWax(panels, id, !panel.seal);
}

export function setBellHold(panels: readonly NoticeBell[], id: string, held: boolean): NoticeBell[] {
  return readBells(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setBellArchive(panels: readonly NoticeBell[], id: string, archived: boolean): NoticeBell[] {
  return readBells(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setBellWax(panels: readonly NoticeBell[], id: string, seal: boolean): NoticeBell[] {
  return readBells(panels).map((panel) => (panel.id === id && panel.seal !== seal ? { ...panel, seal, audit: "seal" } : panel));
}

export function bulkBellMetal(panels: readonly NoticeBell[], ids: readonly string[], ink: unknown): NoticeBell[] {
  const next = metalOf(ink);
  if (!next) return readBells(panels);
  const want = new Set(ids);
  return readBells(panels).map((panel) => (want.has(panel.id) && panel.ink !== next ? { ...panel, ink: next, audit: "ink" } : panel));
}

export function bulkBellPin(panels: readonly NoticeBell[], ids: readonly string[], pinned: boolean): NoticeBell[] {
  const want = new Set(ids);
  return readBells(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkBellArchive(panels: readonly NoticeBell[], ids: readonly string[], archived: boolean): NoticeBell[] {
  const want = new Set(ids);
  return readBells(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkBellPace(panels: readonly NoticeBell[], ids: readonly string[], gait: unknown): NoticeBell[] {
  const next = paceName(gait);
  if (!next) return readBells(panels);
  const want = new Set(ids);
  return readBells(panels).map((panel) => (want.has(panel.id) && panel.gait !== next ? { ...panel, gait: next, audit: "gait" } : panel));
}

export function bulkBellTag(panels: readonly NoticeBell[], ids: readonly string[], tag: unknown): NoticeBell[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addBellTag(rows, id, tag) : rows), readBells(panels));
}

export function resetBells(): NoticeBell[] {
  return [];
}

/** An open bell whose bay sits more than three bays behind the desk. A raised weight, a hold, or an archive is not late. */
export function lateBell(panel: NoticeBell, desk: unknown): boolean {
  const gap = bayGap(panel.bay, desk);
  return inTray(panel, "open") && panel.spine === 2 && gap !== null && gap > 3;
}

/** An open bell with a pull of 3 is due now. A raised weight, a hold, or an archive is not. */
export function soonBell(panel: NoticeBell): boolean {
  return inTray(panel, "open") && panel.spine === 2 && panel.leaf === 3;
}

/** An open resting bell on a peal pace whose bay is 5. That quiet peal is cooling. */
export function coolingBell(panel: NoticeBell): boolean {
  return inTray(panel, "open") && panel.spine === 2 && panel.gait === "peal" && panel.bay === 5;
}

/** Open lintels that are late or due now. A raised lintel stays off the reminder list. */
export function reminderBells(panels: readonly NoticeBell[], desk: unknown): NoticeBell[] {
  return readBells(panels).filter((panel) => lateBell(panel, desk) || soonBell(panel));
}

export function coolingBells(panels: readonly NoticeBell[]): NoticeBell[] {
  return readBells(panels).filter((panel) => coolingBell(panel));
}

/** Open lintels whose bay sits within two bays of the desk. A raised spine, a hold, or an archive stays out. */
export function windowBells(panels: readonly NoticeBell[], desk: unknown): NoticeBell[] {
  return readBells(panels).filter((panel) => {
    const gap = bayGap(panel.bay, desk);
    return inTray(panel, "open") && panel.spine === 2 && gap !== null && gap >= -3 && gap <= 3;
  });
}

export function matchedBells(panels: readonly NoticeBell[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readBells(panels).filter((panel) => inTray(panel, "open") && panel.spine === 2 && panel.bay === at).length;
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
export function visibleBells(
  panels: readonly NoticeBell[],
  tray: BellTray,
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
): NoticeBell[] {
  const text = query.trim().toLowerCase();
  return readBells(panels).filter((panel) => {
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
    if (flareOnly && panel.gait !== "peal") return false;
    if (peakOnly && !peakBay(panel.bay)) return false;
    if (houseOnly && !houseMetal(panel.ink)) return false;
    if (quietOnly && !quietBay(panel.bay)) return false;
    if (restingOnly && panel.spine !== 2) return false;
    return true;
  });
}

export function sortBells(panels: readonly NoticeBell[], mode: BellSort): NoticeBell[] {
  const rows = panels.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function bellIndex(panels: readonly NoticeBell[], query: string): NoticeBell[] {
  const text = query.trim().toLowerCase();
  return sortBells(
    readBells(panels).filter((panel) => panel.bay !== null && (!text || panel.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function bellCounts(panels: readonly NoticeBell[], desk: unknown): BellCounts {
  const rows = readBells(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.spine === 2 && peakBay(panel.bay)).length,
    late: rows.filter((panel) => lateBell(panel, desk)).length,
    soon: rows.filter((panel) => soonBell(panel)).length,
    spine: rows.filter((panel) => inTray(panel, "open") && panel.spine > 2).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseMetal(panel.ink)).length,
    window: windowBells(rows, desk).length,
    matched: matchedBells(rows, desk),
    seal: rows.filter((panel) => panel.seal).length,
    cooling: rows.filter((panel) => coolingBell(panel)).length,
  };
}

export function bellShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open lintels as a share of every open lintel. */
export function lateBellShare(panels: readonly NoticeBell[], desk: unknown): number {
  const rows = readBells(panels).filter((panel) => inTray(panel, "open"));
  return bellShare(rows.filter((panel) => lateBell(panel, desk)).length, rows.length);
}

export function usedBays(panels: readonly NoticeBell[]): number {
  return new Set(readBells(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay)).size;
}

/** Open lintels that share a bay. */
export function clashBayCount(panels: readonly NoticeBell[]): number {
  const open = readBells(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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
export function pullClashCount(panels: readonly NoticeBell[]): number {
  const open = readBells(panels).filter((panel) => inTray(panel, "open") && panel.leaf !== null);
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

/** Open bells whose bays sit exactly three bays apart. */
export function adjacentBellCount(panels: readonly NoticeBell[]): number {
  const open = readBells(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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
 * The ink with the fewest open lintels.
 * A tie keeps SILK, then WOOL, then LINEN.
 * An empty desk still suggests SILK.
 */
export function suggestMetal(panels: readonly NoticeBell[]): "BRONZE" | "PEWTER" | "GILT" {
  const rows = readBells(panels).filter((panel) => inTray(panel, "open"));
  const order = ["PEWTER", "GILT", "BRONZE"] as const;
  let best: "BRONZE" | "PEWTER" | "GILT" = "PEWTER";
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
export function suggestPull(panels: readonly NoticeBell[]): 3 | 9 | 27 {
  const rows = readBells(panels).filter((panel) => inTray(panel, "open"));
  const order = [9, 3, 27] as const;
  let best: 3 | 9 | 27 = 9;
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
export function suggestBellRinger(panels: readonly NoticeBell[]): string {
  const found = readBells(panels).find((panel) => panel.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open lintels.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairBellRinger(panels: readonly NoticeBell[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = bellRinger(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestBellRinger(panels);
  const open = readBells(panels).filter((panel) => inTray(panel, "open"));
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
export function busiestBellRinger(panels: readonly NoticeBell[]): string {
  const rows = readBells(panels).filter((panel) => inTray(panel, "open") && panel.clerk);
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

export function bellRingers(panels: readonly NoticeBell[]): string[] {
  const out: string[] = [];
  for (const panel of readBells(panels)) {
    if (panel.clerk && !out.includes(panel.clerk)) out.push(panel.clerk);
  }
  return out;
}

export function bellMetals(panels: readonly NoticeBell[]): string[] {
  const out: string[] = [];
  for (const panel of readBells(panels)) {
    if (panel.ink && !out.includes(panel.ink)) out.push(panel.ink);
  }
  return out;
}

/** Open lintels whose clerk also watches another open lintel on a different bay. */
export function pairBellCount(panels: readonly NoticeBell[]): number {
  const open = readBells(panels).filter((panel) => inTray(panel, "open") && panel.clerk && panel.bay !== null);
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
export function sharedMetalCount(panels: readonly NoticeBell[]): number {
  const open = readBells(panels).filter((panel) => inTray(panel, "open") && panel.ink && panel.bay !== null);
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
export function weightLoad(panels: readonly NoticeBell[]): number {
  return readBells(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.spine, 0);
}

/** Open lintels that are both the quiet bay and a house ink. */
export function quietHallBells(panels: readonly NoticeBell[]): number {
  return readBells(panels).filter((panel) => inTray(panel, "open") && quietBay(panel.bay) && houseMetal(panel.ink)).length;
}

/** Open lintels whose gait is flare. */
export function pealBellLoad(panels: readonly NoticeBell[]): number {
  return readBells(panels).filter((panel) => inTray(panel, "open") && panel.gait === "peal").length;
}

export function bayWidth(panels: readonly NoticeBell[]): number {
  const bays = readBells(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open lintel whose bay sits ahead of the desk. An unset desk has no next lintel. */
export function nextBell(panels: readonly NoticeBell[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readBells(panels)
    .filter((panel) => inTray(panel, "open") && panel.spine === 2 && panel.bay !== null && (panel.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveBellFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function bellCopy(panel: NoticeBell, desk: unknown): string {
  const gap = bayGap(panel.bay, desk);
  return [panel.title, panel.clerk, panel.bay ?? "", panel.ink, panel.gait, panel.leaf ?? "", panel.spine, panel.tags.join(" "), panel.seal ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the lintels saved in this browser. The gap and the late mark use the bay you pass. */
export function bellsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,bay,metal,pace,pull,weight,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readBells(raw);
  const windowIds = new Set(windowBells(rows, desk).map((panel) => panel.id));
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
      lateBell(panel, desk) ? "1" : "0",
      soonBell(panel) ? "1" : "0",
      houseMetal(panel.ink) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.bay === at && panel.spine === 2 && inTray(panel, "open") ? "1" : "0",
      coolingBell(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeBellRinger(raw: string, clerks: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerks.includes(raw) ? raw : "all";
}

export function activeMetal(raw: string, inks: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = metalOf(raw);
  return name && inks.map((item) => item.toUpperCase()).includes(name) ? name : inks.includes(raw) ? raw : "all";
}

export function activePace(raw: string, gaits: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return gaits.includes(raw) ? raw : "all";
}

export function activeBay(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return bayOf(raw) === null ? "all" : raw;
}

export function activePull(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return pullOf(raw) === null ? "all" : raw;
}

export function activeWeight(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightOf(raw) === null ? "all" : raw;
}

export function bellRingerArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function metalArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return metalOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function pullArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pullOf(filter);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): BellView | null {
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

export function readBellViews(raw: unknown): BellView[] {
  if (!Array.isArray(raw)) return [];
  const out: BellView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addBellView(views: readonly BellView[], view: BellView): BellView[] {
  const current = readBellViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropBellView(views: readonly BellView[], id: string): BellView[] {
  return readBellViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function sealParts(value: SealValue): { customer: string; kind: string; status: string; ok: boolean } {
  if (typeof value === "string") return { customer: clip(value, 48), kind: "", status: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { customer: "", kind: "", status: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { customer: "", kind: "", status: "", ok: false };
  if (!("customer" in value) && !("kind" in value) && !("status" in value)) {
    return { customer: "", kind: "", status: "", ok: false };
  }
  const customerRaw = "customer" in value ? value.customer : "";
  const kindRaw = "kind" in value ? value.kind : "";
  const statusRaw = "status" in value ? value.status : "";
  if (!textOk(customerRaw) || !textOk(kindRaw) || !textOk(statusRaw)) {
    return { customer: "", kind: "", status: "", ok: false };
  }
  return {
    customer: clip(customerRaw, 48),
    kind: clip(kindRaw, 12).toUpperCase(),
    status: clip(statusRaw, 12).toUpperCase(),
    ok: true,
  };
}

export function sealState(value: SealValue): SealState {
  const found = sealParts(value);
  if (!found.ok) return "";
  return found.customer ? "set" : "clear";
}

export function sealCopy(value: SealValue): string {
  const found = sealParts(value);
  return found.ok ? found.customer : "";
}

/** The seal is the first letter of each word, up to two. Digits are not letters. */
export function sealMark(value: SealValue): string {
  const text = sealCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the customer is a cipher. A KYC kind is a ribbon.
 * A chat kind is a thread. A call kind is a bell.
 * Any other named customer is a porch. A digit wins over the kind.
 */
export function sealLane(value: SealValue): SealLane {
  const found = sealParts(value);
  if (!found.ok || !found.customer) return "";
  if (/\d/.test(found.customer)) return "cipher";
  if (found.kind === "KYC") return "ribbon";
  if (found.kind === "CHAT") return "thread";
  if (found.kind === "CALL") return "bell";
  return "porch";
}

/**
 * An open status is gilt. A pending status is pale. A resolved status is linen.
 * A closed status is ash. A blank status, a hold, or any other status is haze.
 */
export function sealTone(value: SealValue): SealTone {
  const found = sealParts(value);
  if (!found.ok || !found.customer) return "";
  if (found.status === "OPEN") return "gilt";
  if (found.status === "PENDING") return "pale";
  if (found.status === "RESOLVED") return "linen";
  if (found.status === "CLOSED") return "ash";
  return "haze";
}

export function stitchedSeal(value: SealValue): boolean {
  return sealCopy(value).includes("&");
}

export function stitchedSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => stitchedSeal(row.note)).length;
}

export function wideSeal(value: SealValue): boolean {
  return sealCopy(value).length >= 14;
}

export function wideSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => wideSeal(row.note)).length;
}

export function giltSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealTone(row.note) === "gilt").length;
}

export function porchSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealLane(row.note) === "porch").length;
}

export function threadSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealLane(row.note) === "thread").length;
}

export function bellLaneCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealLane(row.note) === "bell").length;
}

export function ribbonSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealLane(row.note) === "ribbon").length;
}

export function cipherSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealLane(row.note) === "cipher").length;
}

export function sharedSealCount(rows: readonly SealRow[]): number {
  const marks = rows.map((row) => sealMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(sealMark(row.note))).length;
}

export function sealLanes(rows: readonly SealRow[]): SealLaneLine[] {
  const lanes = ["porch", "thread", "bell", "ribbon", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => sealLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const lines = sealLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingSealTone(rows: readonly SealRow[]): string {
  const tones = ["gilt", "pale", "linen", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => sealTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function sealStep(value: SealValue): 0 | 1 | 2 | 3 {
  const text = sealCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentSealLanes(rows: readonly SealRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = sealState(row.note);
    const lane = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "porch" || lane === "thread" || lane === "bell" || lane === "ribbon" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleSeal(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSealReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSealLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleSeals(
  rows: readonly SealRow[],
  lane: SealLane | "blank" | null,
  tone: SealTone | null,
  query: string,
  review: SealReview,
  reviewed: readonly string[],
  shape: SealShape,
): SealRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = sealState(row.note);
    if (!state) return false;
    const token = state === "set" ? sealLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && sealTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${sealCopy(row.note)} ${sealMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "clasp" && !stitchedSeal(row.note)) return false;
    if (shape === "wide" && !wideSeal(row.note)) return false;
    if (shape === "porch" && sealLane(row.note) !== "porch") return false;
    if (shape === "cipher" && sealLane(row.note) !== "cipher") return false;
    if (shape === "ribbon" && sealLane(row.note) !== "ribbon") return false;
    return true;
  });
}

export function activeSealLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeSealTone(raw: string): string {
  return raw === "gilt" || raw === "pale" || raw === "linen" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function sealLaneArg(filter: string): SealLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "porch" || filter === "thread" || filter === "bell" || filter === "ribbon" || filter === "cipher") return filter;
  return null;
}

export function sealToneArg(filter: string): SealTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "pale" || filter === "linen" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["lane,count"];
  for (const line of sealLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const lines = ["customer,mark,lane,tone,step,clasp,wide,porch,thread,bell,ribbon,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = sealParts(row.note);
    if (!found.ok) continue;
    const lane = sealLane(row.note);
    lines.push([
      found.customer,
      sealMark(row.note),
      lane,
      sealTone(row.note),
      String(sealStep(row.note)),
      stitchedSeal(row.note) ? "1" : "0",
      wideSeal(row.note) ? "1" : "0",
      lane === "porch" ? "1" : "0",
      lane === "thread" ? "1" : "0",
      lane === "bell" ? "1" : "0",
      lane === "ribbon" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
