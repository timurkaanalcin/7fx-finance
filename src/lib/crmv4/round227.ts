/**
 * Coffer panels for the history desk, and rosette marks already stored as type, trader, and worker on each loaded communication.
 * Deposit and money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_coffer_panel (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   bay integer,
 *   ink text not null default '',
 *   gait text not null default '',
 *   span integer,
 *   rib integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   gilt boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_rosette_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_rosette_review (
 *   communication_id text primary key
 * );
 */

export const CFF_KEY = "crmv4-coffer-panel";
export const CFF_VIEW_KEY = "crmv4-coffer-views";
export const CFF_DENSITY_KEY = "crmv4-coffer-density";
export const RST_KEY = "crmv4-rosette-hide";
export const RST_REVIEW_KEY = "crmv4-rosette-review";

export type InkName = "blank" | "graphite" | "ivory" | "champagne";

export type GaitName = "blank" | "hush" | "stride" | "rush";

export type CofferTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type CofferDensity = "airy" | "tight";

export type CofferSort = "bay" | "clerk";

export type CofferPanel = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  bay: number | null;
  ink: string;
  gait: string;
  span: number | null;
  rib: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  gilt: boolean;
  audit: string;
};

export type CofferView = {
  id: string;
  name: string;
  tray: CofferTray;
  query: string;
  clerk: string;
  ink: string;
  gait: string;
  bay: string;
  span: string;
  rib: string;
};

export type CofferCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  rib: number;
  house: number;
  window: number;
  matched: number;
  gilt: number;
  cooling: number;
};

export type RosetteLane = "" | "margin" | "bell" | "quill" | "cipher";

export type RosetteTone = "" | "bright" | "even" | "dim" | "hush" | "mist";

export type RosetteState = "" | "clear" | "set";

export type RosetteShape = "all" | "stitch" | "wide" | "margin" | "cipher";

export type RosetteReview = "all" | "reviewed" | "fresh";

export type RosetteValue = string | { trader?: unknown; type?: unknown; worker?: unknown; title?: unknown; [key: string]: unknown } | null | undefined;

export type RosetteRow = { id: string; label: string; note: RosetteValue };

export type RosetteLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "ink", "tag", "rib", "span", "gilt"] as const;

const INKS = ["graphite", "ivory", "champagne"] as const;

const GAITS = ["hush", "stride", "rush"] as const;

const GAIT_CYCLE = ["hush", "stride", "rush"] as const;

const PEAK_BAYS = new Set([2, 7]);

const QUIET_BAYS = new Set([8]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const COFFER_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): CofferTray {
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
    if (!/^[def]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: CofferPanel, tray: CofferTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function cofferLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function cofferNote(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** An ink is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function inkOf(raw: unknown): string {
  const name = inkName(raw);
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

/** A span is 4, 12, or 24. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 4 | 12 | 24 | null {
  if (raw === 4 || raw === "4") return 4;
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  return null;
}

/** Rib is 1, 3, or 5. Anything else is not a rib. 1 is the resting rib. */
export function ribOf(raw: unknown): 1 | 3 | 5 | null {
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

/** Peak bays are 2 and 7. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 8. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the coffer is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** GRAPHITE and CHAMPAGNE are house inks. IVORY is a guest ink. A blank ink is not a house ink. */
export function houseInk(ink: unknown): boolean {
  return HOUSE.has(inkOf(ink));
}

export function rowDensity(raw: unknown): CofferDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function cofferSort(raw: unknown): CofferSort {
  return raw === "clerk" ? "clerk" : "bay";
}

function readOne(raw: unknown): CofferPanel | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = cofferLine(row.title);
  if (!id || !title) return null;
  const rib = ribOf(row.rib);
  return {
    id,
    title,
    note: cofferNote(row.note),
    clerk: clerkLabel(row.clerk),
    bay: bayOf(row.bay),
    ink: inkOf(row.ink),
    gait: gaitName(row.gait),
    span: spanOf(row.span),
    rib: rib === null ? 1 : rib,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    gilt: row.gilt === true,
    audit: auditCode(row.audit),
  };
}

export function readCoffers(raw: unknown): CofferPanel[] {
  if (!Array.isArray(raw)) return [];
  const out: CofferPanel[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, COFFER_CAP);
}

export function addCoffer(
  panels: readonly CofferPanel[],
  panel: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    bay?: unknown;
    ink?: string;
    gait?: string;
    span?: unknown;
    rib?: unknown;
    tags?: unknown;
  },
): CofferPanel[] {
  const current = readCoffers(panels);
  const id = String(panel.id || "").trim();
  const title = cofferLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rib = ribOf(panel.rib);
  const next: CofferPanel = {
    id,
    title,
    note: cofferNote(panel.note),
    clerk: clerkLabel(panel.clerk),
    bay: bayOf(panel.bay),
    ink: inkOf(panel.ink),
    gait: gaitName(panel.gait),
    span: spanOf(panel.span),
    rib: rib === null ? 1 : rib,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    gilt: false,
    audit: "save",
  };
  return [next, ...current].slice(0, COFFER_CAP);
}

/** A blank gait becomes hush, hush becomes stride, stride becomes rush, and rush returns to hush. */
export function cycleGait(panels: readonly CofferPanel[], id: string): CofferPanel[] {
  return readCoffers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = GAIT_CYCLE.indexOf(panel.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === panel.gait) return panel;
    return { ...panel, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editCoffer(panels: readonly CofferPanel[], id: string, title: unknown): CofferPanel[] {
  const next = cofferLine(title);
  if (!next) return readCoffers(panels);
  const current = readCoffers(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editCofferNote(panels: readonly CofferPanel[], id: string, note: unknown): CofferPanel[] {
  const next = cofferNote(note);
  return readCoffers(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addCofferTag(panels: readonly CofferPanel[], id: string, tag: unknown): CofferPanel[] {
  const next = tagsOf(tag);
  if (!next.length) return readCoffers(panels);
  return readCoffers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setCofferRib(panels: readonly CofferPanel[], id: string, rib: unknown): CofferPanel[] {
  const next = ribOf(rib);
  if (next === null) return readCoffers(panels);
  return readCoffers(panels).map((panel) => (panel.id === id && panel.rib !== next ? { ...panel, rib: next, audit: "rib" } : panel));
}

/** Snooze lengthens the span from blank to 4, from 4 to 12, and from 12 to 24. 24 stays. */
export function snoozeCoffer(panels: readonly CofferPanel[], id: string): CofferPanel[] {
  return readCoffers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.span === null ? 4 : panel.span === 4 ? 12 : panel.span === 12 ? 24 : null;
    if (next === null) return panel;
    return { ...panel, span: next, audit: "span" };
  });
}

export function setCofferPin(panels: readonly CofferPanel[], id: string, pinned: boolean): CofferPanel[] {
  return readCoffers(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedCoffer(panels: readonly CofferPanel[], shownIds: readonly string[], index: number): CofferPanel[] {
  const id = shownIds[index];
  if (!id) return readCoffers(panels);
  const panel = readCoffers(panels).find((item) => item.id === id);
  if (!panel) return readCoffers(panels);
  return setCofferPin(panels, id, !panel.pinned);
}

export function snoozeFocusedCoffer(panels: readonly CofferPanel[], shownIds: readonly string[], index: number): CofferPanel[] {
  const id = shownIds[index];
  return id ? snoozeCoffer(panels, id) : readCoffers(panels);
}

export function holdFocusedCoffer(panels: readonly CofferPanel[], shownIds: readonly string[], index: number): CofferPanel[] {
  const id = shownIds[index];
  if (!id) return readCoffers(panels);
  const panel = readCoffers(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readCoffers(panels);
  return setCofferHold(panels, id, !panel.held);
}

export function gaitFocusedCoffer(panels: readonly CofferPanel[], shownIds: readonly string[], index: number): CofferPanel[] {
  const id = shownIds[index];
  return id ? cycleGait(panels, id) : readCoffers(panels);
}

export function giltFocusedCoffer(panels: readonly CofferPanel[], shownIds: readonly string[], index: number): CofferPanel[] {
  const id = shownIds[index];
  if (!id) return readCoffers(panels);
  const panel = readCoffers(panels).find((item) => item.id === id);
  if (!panel) return readCoffers(panels);
  return setCofferGilt(panels, id, !panel.gilt);
}

export function setCofferHold(panels: readonly CofferPanel[], id: string, held: boolean): CofferPanel[] {
  return readCoffers(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setCofferArchive(panels: readonly CofferPanel[], id: string, archived: boolean): CofferPanel[] {
  return readCoffers(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setCofferGilt(panels: readonly CofferPanel[], id: string, gilt: boolean): CofferPanel[] {
  return readCoffers(panels).map((panel) => (panel.id === id && panel.gilt !== gilt ? { ...panel, gilt, audit: "gilt" } : panel));
}

export function bulkCofferInk(panels: readonly CofferPanel[], ids: readonly string[], ink: unknown): CofferPanel[] {
  const next = inkOf(ink);
  if (!next) return readCoffers(panels);
  const want = new Set(ids);
  return readCoffers(panels).map((panel) => (want.has(panel.id) && panel.ink !== next ? { ...panel, ink: next, audit: "ink" } : panel));
}

export function bulkCofferPin(panels: readonly CofferPanel[], ids: readonly string[], pinned: boolean): CofferPanel[] {
  const want = new Set(ids);
  return readCoffers(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkCofferArchive(panels: readonly CofferPanel[], ids: readonly string[], archived: boolean): CofferPanel[] {
  const want = new Set(ids);
  return readCoffers(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkCofferGait(panels: readonly CofferPanel[], ids: readonly string[], gait: unknown): CofferPanel[] {
  const next = gaitName(gait);
  if (!next) return readCoffers(panels);
  const want = new Set(ids);
  return readCoffers(panels).map((panel) => (want.has(panel.id) && panel.gait !== next ? { ...panel, gait: next, audit: "gait" } : panel));
}

export function bulkCofferTag(panels: readonly CofferPanel[], ids: readonly string[], tag: unknown): CofferPanel[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addCofferTag(rows, id, tag) : rows), readCoffers(panels));
}

export function resetCoffers(): CofferPanel[] {
  return [];
}

/** An open coffer whose bay sits more than four bays behind the desk. A raised rib, a hold, or an archive is not late. */
export function lateCoffer(panel: CofferPanel, desk: unknown): boolean {
  const gap = bayGap(panel.bay, desk);
  return inTray(panel, "open") && panel.rib === 1 && gap !== null && gap > 4;
}

/** An open coffer with a span of 4 is due now. A raised rib, a hold, or an archive is not. */
export function soonCoffer(panel: CofferPanel): boolean {
  return inTray(panel, "open") && panel.rib === 1 && panel.span === 4;
}

/** An open resting coffer on a rush gait whose bay is 8. That quiet rush is cooling. */
export function coolingCoffer(panel: CofferPanel): boolean {
  return inTray(panel, "open") && panel.rib === 1 && panel.gait === "rush" && panel.bay === 8;
}

/** Open coffers that are late or due now. A raised coffer stays off the reminder list. */
export function reminderCoffers(panels: readonly CofferPanel[], desk: unknown): CofferPanel[] {
  return readCoffers(panels).filter((panel) => lateCoffer(panel, desk) || soonCoffer(panel));
}

export function coolingCoffers(panels: readonly CofferPanel[]): CofferPanel[] {
  return readCoffers(panels).filter((panel) => coolingCoffer(panel));
}

/** Open coffers whose bay sits within four bays of the desk. A raised rib, a hold, or an archive stays out. */
export function windowCoffers(panels: readonly CofferPanel[], desk: unknown): CofferPanel[] {
  return readCoffers(panels).filter((panel) => {
    const gap = bayGap(panel.bay, desk);
    return inTray(panel, "open") && panel.rib === 1 && gap !== null && gap >= -4 && gap <= 4;
  });
}

export function matchedCoffers(panels: readonly CofferPanel[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.rib === 1 && panel.bay === at).length;
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
export function visibleCoffers(
  panels: readonly CofferPanel[],
  tray: CofferTray,
  query: string,
  clerk: string | null,
  ink: string | null,
  gait: string | null,
  exact: number | null,
  pick: BayPick | null,
  span: number | "blank" | null,
  rib: number | "blank" | null,
  rushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): CofferPanel[] {
  const text = query.trim().toLowerCase();
  return readCoffers(panels).filter((panel) => {
    if (!inTray(panel, tray)) return false;
    if (text) {
      const hay = `${panel.title} ${panel.note} ${panel.clerk} ${panel.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (clerk !== null && panel.clerk !== clerk) return false;
    if (ink === "blank" ? Boolean(panel.ink) : ink && panel.ink !== ink) return false;
    if (gait === "blank" ? Boolean(panel.gait) : gait && panel.gait !== gait) return false;
    if (!bayHit(panel.bay, exact, pick)) return false;
    if (span === "blank" ? panel.span !== null : span !== null && panel.span !== span) return false;
    if (rib === "blank" ? panel.rib !== 1 : rib !== null && panel.rib !== rib) return false;
    if (rushOnly && panel.gait !== "rush") return false;
    if (peakOnly && !peakBay(panel.bay)) return false;
    if (houseOnly && !houseInk(panel.ink)) return false;
    if (quietOnly && !quietBay(panel.bay)) return false;
    if (restingOnly && panel.rib !== 1) return false;
    return true;
  });
}

export function sortCoffers(panels: readonly CofferPanel[], mode: CofferSort): CofferPanel[] {
  const rows = panels.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function cofferIndex(panels: readonly CofferPanel[], query: string): CofferPanel[] {
  const text = query.trim().toLowerCase();
  return sortCoffers(
    readCoffers(panels).filter((panel) => panel.bay !== null && (!text || panel.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function cofferCounts(panels: readonly CofferPanel[], desk: unknown): CofferCounts {
  const rows = readCoffers(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.rib === 1 && peakBay(panel.bay)).length,
    late: rows.filter((panel) => lateCoffer(panel, desk)).length,
    soon: rows.filter((panel) => soonCoffer(panel)).length,
    rib: rows.filter((panel) => inTray(panel, "open") && panel.rib > 1).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseInk(panel.ink)).length,
    window: windowCoffers(rows, desk).length,
    matched: matchedCoffers(rows, desk),
    gilt: rows.filter((panel) => panel.gilt).length,
    cooling: rows.filter((panel) => coolingCoffer(panel)).length,
  };
}

export function cofferShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open coffers as a share of every open coffer. */
export function lateCofferShare(panels: readonly CofferPanel[], desk: unknown): number {
  const rows = readCoffers(panels).filter((panel) => inTray(panel, "open"));
  return cofferShare(rows.filter((panel) => lateCoffer(panel, desk)).length, rows.length);
}

export function usedBays(panels: readonly CofferPanel[]): number {
  return new Set(readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay)).size;
}

/** Open coffers that share a bay. */
export function clashBayCount(panels: readonly CofferPanel[]): number {
  const open = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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

/** Open coffers that share a span. */
export function spanClashCount(panels: readonly CofferPanel[]): number {
  const open = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.span !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].span === open[j].span) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open coffers whose bays sit exactly four bays apart. */
export function adjacentCofferCount(panels: readonly CofferPanel[]): number {
  const open = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].bay || 0) - (open[j].bay || 0)) === 4) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The ink with the fewest open coffers.
 * A tie keeps GRAPHITE, then CHAMPAGNE, then IVORY.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestInk(panels: readonly CofferPanel[]): "GRAPHITE" | "CHAMPAGNE" | "IVORY" {
  const rows = readCoffers(panels).filter((panel) => inTray(panel, "open"));
  const order = ["GRAPHITE", "CHAMPAGNE", "IVORY"] as const;
  let best: "GRAPHITE" | "CHAMPAGNE" | "IVORY" = "GRAPHITE";
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
 * The span with the fewest open coffers.
 * A tie keeps 12, then 4, then 24.
 * An empty desk still suggests 12.
 */
export function suggestSpan(panels: readonly CofferPanel[]): 4 | 12 | 24 {
  const rows = readCoffers(panels).filter((panel) => inTray(panel, "open"));
  const order = [12, 4, 24] as const;
  let best: 4 | 12 | 24 = 12;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((panel) => panel.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest clerk already written on a coffer. A blank clerk is skipped. */
export function suggestClerk(panels: readonly CofferPanel[]): string {
  const found = readCoffers(panels).find((panel) => panel.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open coffers.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairClerk(panels: readonly CofferPanel[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = clerkLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestClerk(panels);
  const open = readCoffers(panels).filter((panel) => inTray(panel, "open"));
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

/** The clerk with the most open coffers. A tie keeps the name that sorts later. */
export function busiestClerk(panels: readonly CofferPanel[]): string {
  const rows = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.clerk);
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

export function cofferClerks(panels: readonly CofferPanel[]): string[] {
  const out: string[] = [];
  for (const panel of readCoffers(panels)) {
    if (panel.clerk && !out.includes(panel.clerk)) out.push(panel.clerk);
  }
  return out;
}

export function cofferInks(panels: readonly CofferPanel[]): string[] {
  const out: string[] = [];
  for (const panel of readCoffers(panels)) {
    if (panel.ink && !out.includes(panel.ink)) out.push(panel.ink);
  }
  return out;
}

/** Open coffers whose clerk also watches another open coffer on a different bay. */
export function pairClerkCount(panels: readonly CofferPanel[]): number {
  const open = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.clerk && panel.bay !== null);
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

/** Open coffers that share an ink on different bays. */
export function sharedInkCount(panels: readonly CofferPanel[]): number {
  const open = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.ink && panel.bay !== null);
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

/** The rib of open coffers. The resting rib of 1 still counts. */
export function ribLoad(panels: readonly CofferPanel[]): number {
  return readCoffers(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.rib, 0);
}

/** Open coffers that are both the quiet bay and a house ink. */
export function quietHallCount(panels: readonly CofferPanel[]): number {
  return readCoffers(panels).filter((panel) => inTray(panel, "open") && quietBay(panel.bay) && houseInk(panel.ink)).length;
}

/** Open coffers whose gait is rush. */
export function rushLoad(panels: readonly CofferPanel[]): number {
  return readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.gait === "rush").length;
}

export function bayWidth(panels: readonly CofferPanel[]): number {
  const bays = readCoffers(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open coffer whose bay sits ahead of the desk. An unset desk has no next coffer. */
export function nextCoffer(panels: readonly CofferPanel[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readCoffers(panels)
    .filter((panel) => inTray(panel, "open") && panel.rib === 1 && panel.bay !== null && (panel.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveCofferFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function cofferCopy(panel: CofferPanel, desk: unknown): string {
  const gap = bayGap(panel.bay, desk);
  return [panel.title, panel.clerk, panel.bay ?? "", panel.ink, panel.gait, panel.span ?? "", panel.rib, panel.tags.join(" "), panel.gilt ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the coffers saved in this browser. The gap and the late mark use the bay you pass. */
export function coffersCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,bay,ink,gait,span,rib,tags,pinned,held,archived,gilt,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readCoffers(raw);
  const windowIds = new Set(windowCoffers(rows, desk).map((panel) => panel.id));
  const at = bayOf(desk);
  for (const panel of rows) {
    const gap = bayGap(panel.bay, desk);
    lines.push([
      panel.title,
      panel.clerk,
      panel.bay === null ? "" : String(panel.bay),
      panel.ink,
      panel.gait,
      panel.span === null ? "" : String(panel.span),
      String(panel.rib),
      panel.tags.join(" "),
      panel.pinned ? "1" : "0",
      panel.held ? "1" : "0",
      panel.archived ? "1" : "0",
      panel.gilt ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCoffer(panel, desk) ? "1" : "0",
      soonCoffer(panel) ? "1" : "0",
      houseInk(panel.ink) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.bay === at && panel.rib === 1 && inTray(panel, "open") ? "1" : "0",
      coolingCoffer(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeClerk(raw: string, clerks: readonly string[]): string {
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

export function activeSpan(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return spanOf(raw) === null ? "all" : raw;
}

export function activeRib(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribOf(raw) === null ? "all" : raw;
}

export function clerkArg(filter: string): string | null {
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

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

export function ribArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return ribOf(filter);
}

function readView(raw: unknown): CofferView | null {
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
    clerk: clip(row.clerk, 16),
    ink: clip(row.ink, 12),
    gait: clip(row.gait, 8),
    bay: clip(row.bay, 8),
    span: clip(row.span, 8),
    rib: clip(row.rib, 8),
  };
}

export function readCofferViews(raw: unknown): CofferView[] {
  if (!Array.isArray(raw)) return [];
  const out: CofferView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addCofferView(views: readonly CofferView[], view: CofferView): CofferView[] {
  const current = readCofferViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropCofferView(views: readonly CofferView[], id: string): CofferView[] {
  return readCofferViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function rosetteParts(value: RosetteValue): { trader: string; type: string; worker: string; title: string; ok: boolean } {
  if (typeof value === "string") return { trader: clip(value, 40), type: "", worker: "", title: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { trader: "", type: "", worker: "", title: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { trader: "", type: "", worker: "", title: "", ok: false };
  if (!("trader" in value) && !("type" in value) && !("worker" in value) && !("title" in value)) {
    return { trader: "", type: "", worker: "", title: "", ok: false };
  }
  const traderRaw = "trader" in value ? value.trader : "";
  const typeRaw = "type" in value ? value.type : "";
  const workerRaw = "worker" in value ? value.worker : "";
  const titleRaw = "title" in value ? value.title : "";
  if (!textOk(traderRaw) || !textOk(typeRaw) || !textOk(workerRaw) || !textOk(titleRaw)) {
    return { trader: "", type: "", worker: "", title: "", ok: false };
  }
  const type = clip(typeRaw, 8).toUpperCase();
  return {
    trader: clip(traderRaw, 40),
    type: type === "NOTE" || type === "CALL" || type === "CHAT" ? type : "",
    worker: clip(workerRaw, 24),
    title: clip(titleRaw, 40),
    ok: true,
  };
}

export function rosetteState(value: RosetteValue): RosetteState {
  const found = rosetteParts(value);
  if (!found.ok) return "";
  return found.trader ? "set" : "clear";
}

export function rosetteCopy(value: RosetteValue): string {
  const found = rosetteParts(value);
  return found.ok ? found.trader : "";
}

/** The mark is the first three letters of the trader. */
export function rosetteMark(value: RosetteValue): string {
  const text = rosetteCopy(value).replace(/\s+/g, "").toUpperCase();
  return text ? text.slice(0, 3) : "";
}

/**
 * A digit in the trader is a cipher. A CALL is a bell. A CHAT is a quill.
 * Any other named trader is a margin. A digit wins over the type.
 */
export function rosetteLane(value: RosetteValue): RosetteLane {
  const found = rosetteParts(value);
  if (!found.ok || !found.trader) return "";
  if (/\d/.test(found.trader)) return "cipher";
  if (found.type === "CALL") return "bell";
  if (found.type === "CHAT") return "quill";
  return "margin";
}

/**
 * A CALL with a worker is bright. A CALL without a worker is dim.
 * A NOTE with a worker is even. A CHAT without a worker is hush.
 * A name with neither a known type nor a worker is mist.
 */
export function rosetteTone(value: RosetteValue): RosetteTone {
  const found = rosetteParts(value);
  if (!found.ok || !found.trader) return "";
  if (found.type === "CALL" && found.worker) return "bright";
  if (found.type === "CALL") return "dim";
  if (found.type === "NOTE" && found.worker) return "even";
  if (found.type === "CHAT" && !found.worker) return "hush";
  if (found.type === "CHAT" && found.worker) return "even";
  if (!found.type && !found.worker) return "mist";
  if (found.worker) return "even";
  return "mist";
}

export function stitchedRosette(value: RosetteValue): boolean {
  return rosetteCopy(value).includes("-");
}

export function stitchedRosetteCount(rows: readonly RosetteRow[]): number {
  return rows.filter((row) => stitchedRosette(row.note)).length;
}

export function wideRosette(value: RosetteValue): boolean {
  return rosetteCopy(value).length >= 10;
}

export function wideRosetteCount(rows: readonly RosetteRow[]): number {
  return rows.filter((row) => wideRosette(row.note)).length;
}

export function brightRosetteCount(rows: readonly RosetteRow[]): number {
  return rows.filter((row) => rosetteTone(row.note) === "bright").length;
}

export function marginCount(rows: readonly RosetteRow[]): number {
  return rows.filter((row) => rosetteLane(row.note) === "margin").length;
}

export function cipherCount(rows: readonly RosetteRow[]): number {
  return rows.filter((row) => rosetteLane(row.note) === "cipher").length;
}

export function bellCount(rows: readonly RosetteRow[]): number {
  return rows.filter((row) => rosetteLane(row.note) === "bell").length;
}

export function sharedRosetteCount(rows: readonly RosetteRow[]): number {
  const marks = rows.map((row) => rosetteMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(rosetteMark(row.note))).length;
}

export function rosetteLanes(rows: readonly RosetteRow[]): RosetteLaneLine[] {
  const lanes = ["margin", "bell", "quill", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => rosetteLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingRosette(rows: readonly RosetteRow[]): string {
  const lines = rosetteLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingRosetteTone(rows: readonly RosetteRow[]): string {
  const tones = ["bright", "even", "dim", "hush", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => rosetteTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function rosetteShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function rosetteStep(value: RosetteValue): 0 | 1 | 2 | 3 {
  const text = rosetteCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentRosetteLanes(rows: readonly RosetteRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = rosetteState(row.note);
    const lane = state === "set" ? rosetteLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenRosettes(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "margin" || lane === "bell" || lane === "quill" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedRosettes(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleRosette(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleRosetteReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkRosetteReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleRosetteLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleRosettes(
  rows: readonly RosetteRow[],
  lane: RosetteLane | "blank" | null,
  tone: RosetteTone | null,
  query: string,
  review: RosetteReview,
  reviewed: readonly string[],
  shape: RosetteShape,
): RosetteRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = rosetteState(row.note);
    if (!state) return false;
    const token = state === "set" ? rosetteLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && rosetteTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${rosetteCopy(row.note)} ${rosetteMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "stitch" && !stitchedRosette(row.note)) return false;
    if (shape === "wide" && !wideRosette(row.note)) return false;
    if (shape === "margin" && rosetteLane(row.note) !== "margin") return false;
    if (shape === "cipher" && rosetteLane(row.note) !== "cipher") return false;
    return true;
  });
}

export function activeRosetteLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeRosetteTone(raw: string): string {
  return raw === "bright" || raw === "even" || raw === "dim" || raw === "hush" || raw === "mist" || raw === "all" ? raw : "all";
}

export function rosetteLaneArg(filter: string): RosetteLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "margin" || filter === "bell" || filter === "quill" || filter === "cipher") return filter;
  return null;
}

export function rosetteToneArg(filter: string): RosetteTone | null {
  if (filter === "all") return null;
  if (filter === "bright" || filter === "even" || filter === "dim" || filter === "hush" || filter === "mist") return filter;
  return null;
}

export function rosettesCsv(rows: readonly RosetteRow[]): string {
  const lines = ["lane,count"];
  for (const line of rosetteLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function rosetteRowsCsv(rows: readonly RosetteRow[], reviewed: readonly string[]): string {
  const lines = ["trader,mark,lane,tone,step,stitch,wide,margin,bell,quill,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = rosetteParts(row.note);
    if (!found.ok) continue;
    lines.push([
      found.trader,
      rosetteMark(row.note),
      rosetteLane(row.note),
      rosetteTone(row.note),
      String(rosetteStep(row.note)),
      stitchedRosette(row.note) ? "1" : "0",
      wideRosette(row.note) ? "1" : "0",
      rosetteLane(row.note) === "margin" ? "1" : "0",
      rosetteLane(row.note) === "bell" ? "1" : "0",
      rosetteLane(row.note) === "quill" ? "1" : "0",
      rosetteLane(row.note) === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
