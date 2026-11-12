/**
 * Cabinet drawers for the document desk, and watermark marks already stored as customer, kind, and status on each loaded document.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_cabinet_drawer (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   shelf integer,
 *   weave text not null default '',
 *   pace text not null default '',
 *   wick integer,
 *   rib integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_watermark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_watermark_review (
 *   document_id text primary key
 * );
 */

export const CAB_KEY = "crmv4-cabinet-drawer";
export const CAB_VIEW_KEY = "crmv4-cabinet-views";
export const CAB_DENSITY_KEY = "crmv4-cabinet-density";
export const WMK_KEY = "crmv4-watermark-hide";
export const WMK_REVIEW_KEY = "crmv4-watermark-review";

export type WeaveName = "blank" | "graphite" | "ivory" | "champagne";

export type PaceName = "blank" | "hush" | "stride" | "rush";

export type DrawerTray = "open" | "held" | "archived";

export type ShelfPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type DrawerDensity = "airy" | "tight";

export type DrawerSort = "shelf" | "clerk";

export type CabinetDrawer = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  shelf: number | null;
  weave: string;
  pace: string;
  wick: number | null;
  rib: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type DrawerView = {
  id: string;
  name: string;
  tray: DrawerTray;
  query: string;
  clerk: string;
  weave: string;
  pace: string;
  shelf: string;
  wick: string;
  rib: string;
};

export type DrawerCounts = {
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
  seal: number;
  cooling: number;
};

export type WatermarkLane = "" | "plain" | "thread" | "ribbon" | "fold" | "stamp";

export type WatermarkTone = "" | "gilt" | "linen" | "pale" | "ash" | "haze";

export type WatermarkState = "" | "clear" | "set";

export type WatermarkShape = "all" | "stitch" | "wide" | "plain" | "stamp" | "ribbon";

export type WatermarkReview = "all" | "reviewed" | "fresh";

export type WatermarkValue = string | { customer?: unknown; kind?: unknown; status?: unknown; title?: unknown; [key: string]: unknown } | null | undefined;

export type WatermarkRow = { id: string; label: string; note: WatermarkValue };

export type WatermarkLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "weave", "tag", "rib", "wick", "seal"] as const;

const WEAVES = ["graphite", "ivory", "champagne"] as const;

const PACES = ["still", "walk", "flare"] as const;

const PACE_CYCLE = ["still", "walk", "flare"] as const;

const PEAK_SHELVES = new Set([2, 5]);

const QUIET_SHELVES = new Set([7]);

const HOUSE = new Set(["GRAPHITE", "IVORY"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const DRAWER_CAP = 7;

const VIEW_CAP = 4;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DrawerTray {
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

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
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

function inTray(panel: CabinetDrawer, tray: DrawerTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function drawerLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function drawerNote(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** An weave is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function weaveOf(raw: unknown): string {
  const name = weaveName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A shelf is an integer from 1 through 7.
 * A blank value stays unset. 0 is not a shelf.
 * A second digit is not a shelf.
 */
export function shelfOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 7) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-7]$/.test(text)) return null;
  return Number(text);
}

/** A wick is 5, 15, or 45. A blank value stays unset. A leading zero is not a wick. */
export function wickOf(raw: unknown): 5 | 15 | 45 | null {
  if (raw === 5 || raw === "5") return 5;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 45 || raw === "45") return 45;
  return null;
}

/** Rib is 2, 4, or 8. Anything else is not a rib. 2 is the resting rib. */
export function ribOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

export function shelfBand(shelf: unknown): "blank" | "early" | "mid" | "late" {
  const value = shelfOf(shelf);
  if (value === null) return "blank";
  if (value <= 3) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak shelves are 3 and 6. An unset shelf is not a peak shelf. */
export function peakShelf(shelf: unknown): boolean {
  const value = shelfOf(shelf);
  return value !== null && PEAK_SHELVES.has(value);
}

/** The quiet shelf is 1. A peak shelf is not quiet. An unset shelf is not quiet. */
export function quietShelf(shelf: unknown): boolean {
  const value = shelfOf(shelf);
  return value !== null && QUIET_SHELVES.has(value);
}

/**
 * How far a shelf sits behind the desk shelf.
 * A positive gap means the drawer is behind. A negative gap means it is ahead.
 * A gap of zero means the same shelf. An unset shelf has no gap. Shelves do not wrap.
 */
export function shelfGap(shelf: unknown, desk: unknown): number | null {
  const from = shelfOf(shelf);
  const at = shelfOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and CHAMPAGNE are house weaves. GRAPHITE is a guest weave. A blank weave is not a house weave. */
export function houseWeave(weave: unknown): boolean {
  return HOUSE.has(weaveOf(weave));
}

export function rowDensity(raw: unknown): DrawerDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function drawerSort(raw: unknown): DrawerSort {
  return raw === "clerk" ? "clerk" : "shelf";
}

function readOne(raw: unknown): CabinetDrawer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = drawerLine(row.title);
  if (!id || !title) return null;
  const rib = ribOf(row.rib);
  return {
    id,
    title,
    note: drawerNote(row.note),
    clerk: clerkLabel(row.clerk),
    shelf: shelfOf(row.shelf),
    weave: weaveOf(row.weave),
    pace: paceName(row.pace),
    wick: wickOf(row.wick),
    rib: rib === null ? 2 : rib,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readDrawers(raw: unknown): CabinetDrawer[] {
  if (!Array.isArray(raw)) return [];
  const out: CabinetDrawer[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, DRAWER_CAP);
}

export function addDrawer(
  panels: readonly CabinetDrawer[],
  panel: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    shelf?: unknown;
    weave?: string;
    pace?: string;
    wick?: unknown;
    rib?: unknown;
    tags?: unknown;
  },
): CabinetDrawer[] {
  const current = readDrawers(panels);
  const id = String(panel.id || "").trim();
  const title = drawerLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const rib = ribOf(panel.rib);
  const next: CabinetDrawer = {
    id,
    title,
    note: drawerNote(panel.note),
    clerk: clerkLabel(panel.clerk),
    shelf: shelfOf(panel.shelf),
    weave: weaveOf(panel.weave),
    pace: paceName(panel.pace),
    wick: wickOf(panel.wick),
    rib: rib === null ? 2 : rib,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, DRAWER_CAP);
}

/** A blank pace becomes hush, hush becomes stride, stride becomes rush, and rush returns to hush. */
export function cyclePace(panels: readonly CabinetDrawer[], id: string): CabinetDrawer[] {
  return readDrawers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = PACE_CYCLE.indexOf(panel.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === panel.pace) return panel;
    return { ...panel, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editDrawer(panels: readonly CabinetDrawer[], id: string, title: unknown): CabinetDrawer[] {
  const next = drawerLine(title);
  if (!next) return readDrawers(panels);
  const current = readDrawers(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editDrawerNote(panels: readonly CabinetDrawer[], id: string, note: unknown): CabinetDrawer[] {
  const next = drawerNote(note);
  return readDrawers(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addDrawerTag(panels: readonly CabinetDrawer[], id: string, tag: unknown): CabinetDrawer[] {
  const next = tagsOf(tag);
  if (!next.length) return readDrawers(panels);
  return readDrawers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setDrawerRib(panels: readonly CabinetDrawer[], id: string, rib: unknown): CabinetDrawer[] {
  const next = ribOf(rib);
  if (next === null) return readDrawers(panels);
  return readDrawers(panels).map((panel) => (panel.id === id && panel.rib !== next ? { ...panel, rib: next, audit: "rib" } : panel));
}

/** Snooze sets a blank wick, a wick of 5, or a wick of 15 to 45. A wick of 45 stays. */
export function snoozeDrawer(panels: readonly CabinetDrawer[], id: string): CabinetDrawer[] {
  return readDrawers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.wick === 45 ? null : 45;
    if (next === null) return panel;
    return { ...panel, wick: next, audit: "wick" };
  });
}

export function setDrawerPin(panels: readonly CabinetDrawer[], id: string, pinned: boolean): CabinetDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedDrawer(panels: readonly CabinetDrawer[], shownIds: readonly string[], index: number): CabinetDrawer[] {
  const id = shownIds[index];
  if (!id) return readDrawers(panels);
  const panel = readDrawers(panels).find((item) => item.id === id);
  if (!panel) return readDrawers(panels);
  return setDrawerPin(panels, id, !panel.pinned);
}

export function snoozeFocusedDrawer(panels: readonly CabinetDrawer[], shownIds: readonly string[], index: number): CabinetDrawer[] {
  const id = shownIds[index];
  return id ? snoozeDrawer(panels, id) : readDrawers(panels);
}

export function holdFocusedDrawer(panels: readonly CabinetDrawer[], shownIds: readonly string[], index: number): CabinetDrawer[] {
  const id = shownIds[index];
  if (!id) return readDrawers(panels);
  const panel = readDrawers(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readDrawers(panels);
  return setDrawerHold(panels, id, !panel.held);
}

export function paceFocusedDrawer(panels: readonly CabinetDrawer[], shownIds: readonly string[], index: number): CabinetDrawer[] {
  const id = shownIds[index];
  return id ? cyclePace(panels, id) : readDrawers(panels);
}

export function sealFocusedDrawer(panels: readonly CabinetDrawer[], shownIds: readonly string[], index: number): CabinetDrawer[] {
  const id = shownIds[index];
  if (!id) return readDrawers(panels);
  const panel = readDrawers(panels).find((item) => item.id === id);
  if (!panel) return readDrawers(panels);
  return setDrawerSeal(panels, id, !panel.seal);
}

export function setDrawerHold(panels: readonly CabinetDrawer[], id: string, held: boolean): CabinetDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setDrawerArchive(panels: readonly CabinetDrawer[], id: string, archived: boolean): CabinetDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setDrawerSeal(panels: readonly CabinetDrawer[], id: string, seal: boolean): CabinetDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && panel.seal !== seal ? { ...panel, seal, audit: "seal" } : panel));
}

export function bulkDrawerWeave(panels: readonly CabinetDrawer[], ids: readonly string[], weave: unknown): CabinetDrawer[] {
  const next = weaveOf(weave);
  if (!next) return readDrawers(panels);
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.weave !== next ? { ...panel, weave: next, audit: "weave" } : panel));
}

export function bulkDrawerPin(panels: readonly CabinetDrawer[], ids: readonly string[], pinned: boolean): CabinetDrawer[] {
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkDrawerArchive(panels: readonly CabinetDrawer[], ids: readonly string[], archived: boolean): CabinetDrawer[] {
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkDrawerPace(panels: readonly CabinetDrawer[], ids: readonly string[], pace: unknown): CabinetDrawer[] {
  const next = paceName(pace);
  if (!next) return readDrawers(panels);
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.pace !== next ? { ...panel, pace: next, audit: "pace" } : panel));
}

export function bulkDrawerTag(panels: readonly CabinetDrawer[], ids: readonly string[], tag: unknown): CabinetDrawer[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addDrawerTag(rows, id, tag) : rows), readDrawers(panels));
}

export function resetDrawers(): CabinetDrawer[] {
  return [];
}

/** An open drawer whose shelf sits more than two shelves behind the desk. A raised rib, a hold, or an archive is not late. */
export function lateDrawer(panel: CabinetDrawer, desk: unknown): boolean {
  const gap = shelfGap(panel.shelf, desk);
  return inTray(panel, "open") && panel.rib === 2 && gap !== null && gap > 3;
}

/** An open drawer with a wick of 5 is due now. A raised rib, a hold, or an archive is not. */
export function soonDrawer(panel: CabinetDrawer): boolean {
  return inTray(panel, "open") && panel.rib === 2 && panel.wick === 15;
}

/** An open resting drawer on a walk pace whose shelf is 1. That quiet walk is cooling. */
export function coolingDrawer(panel: CabinetDrawer): boolean {
  return inTray(panel, "open") && panel.rib === 2 && panel.pace === "flare" && panel.shelf === 7;
}

/** Open drawers that are late or due now. A raised drawer stays off the reminder list. */
export function reminderDrawers(panels: readonly CabinetDrawer[], desk: unknown): CabinetDrawer[] {
  return readDrawers(panels).filter((panel) => lateDrawer(panel, desk) || soonDrawer(panel));
}

export function coolingDrawers(panels: readonly CabinetDrawer[]): CabinetDrawer[] {
  return readDrawers(panels).filter((panel) => coolingDrawer(panel));
}

/** Open drawers whose shelf sits within four shelves of the desk. A raised rib, a hold, or an archive stays out. */
export function windowDrawers(panels: readonly CabinetDrawer[], desk: unknown): CabinetDrawer[] {
  return readDrawers(panels).filter((panel) => {
    const gap = shelfGap(panel.shelf, desk);
    return inTray(panel, "open") && panel.rib === 2 && gap !== null && gap >= -1 && gap <= 3;
  });
}

export function matchedDrawers(panels: readonly CabinetDrawer[], desk: unknown): number {
  const at = shelfOf(desk);
  if (at === null) return 0;
  return readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.rib === 2 && panel.shelf === at).length;
}

function shelfHit(shelf: number | null, exact: number | null, pick: ShelfPick | null): boolean {
  if (exact !== null) return shelf === exact;
  if (pick === null) return true;
  if (pick === "blank") return shelf === null;
  if (pick === "peak") return peakShelf(shelf);
  if (pick === "quiet") return quietShelf(shelf);
  return shelfBand(shelf) === pick;
}

/** Search matches the title, the note, the clerk, and the tags. */
export function visibleDrawers(
  panels: readonly CabinetDrawer[],
  tray: DrawerTray,
  query: string,
  clerk: string | null,
  weave: string | null,
  pace: string | null,
  exact: number | null,
  pick: ShelfPick | null,
  wick: number | "blank" | null,
  rib: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): CabinetDrawer[] {
  const text = query.trim().toLowerCase();
  return readDrawers(panels).filter((panel) => {
    if (!inTray(panel, tray)) return false;
    if (text) {
      const hay = `${panel.title} ${panel.note} ${panel.clerk} ${panel.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (clerk !== null && panel.clerk !== clerk) return false;
    if (weave === "blank" ? Boolean(panel.weave) : weave && panel.weave !== weave) return false;
    if (pace === "blank" ? Boolean(panel.pace) : pace && panel.pace !== pace) return false;
    if (!shelfHit(panel.shelf, exact, pick)) return false;
    if (wick === "blank" ? panel.wick !== null : wick !== null && panel.wick !== wick) return false;
    if (rib === "blank" ? panel.rib !== 2 : rib !== null && panel.rib !== rib) return false;
    if (flareOnly && panel.pace !== "flare") return false;
    if (peakOnly && !peakShelf(panel.shelf)) return false;
    if (houseOnly && !houseWeave(panel.weave)) return false;
    if (quietOnly && !quietShelf(panel.shelf)) return false;
    if (restingOnly && panel.rib !== 2) return false;
    return true;
  });
}

export function sortDrawers(panels: readonly CabinetDrawer[], mode: DrawerSort): CabinetDrawer[] {
  const rows = panels.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.shelf ?? 99) - (b.shelf ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.shelf ?? 99) - (b.shelf ?? 99) || a.title.localeCompare(b.title));
}

export function drawerIndex(panels: readonly CabinetDrawer[], query: string): CabinetDrawer[] {
  const text = query.trim().toLowerCase();
  return sortDrawers(
    readDrawers(panels).filter((panel) => panel.shelf !== null && (!text || panel.title.toLowerCase().includes(text))),
    "shelf",
  );
}

export function drawerCounts(panels: readonly CabinetDrawer[], desk: unknown): DrawerCounts {
  const rows = readDrawers(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.rib === 2 && peakShelf(panel.shelf)).length,
    late: rows.filter((panel) => lateDrawer(panel, desk)).length,
    soon: rows.filter((panel) => soonDrawer(panel)).length,
    rib: rows.filter((panel) => inTray(panel, "open") && panel.rib > 2).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseWeave(panel.weave)).length,
    window: windowDrawers(rows, desk).length,
    matched: matchedDrawers(rows, desk),
    seal: rows.filter((panel) => panel.seal).length,
    cooling: rows.filter((panel) => coolingDrawer(panel)).length,
  };
}

export function drawerShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open drawers as a share of every open drawer. */
export function lateDrawerShare(panels: readonly CabinetDrawer[], desk: unknown): number {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  return drawerShare(rows.filter((panel) => lateDrawer(panel, desk)).length, rows.length);
}

export function usedShelves(panels: readonly CabinetDrawer[]): number {
  return new Set(readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null).map((panel) => panel.shelf)).size;
}

/** Open drawers that share a shelf. */
export function clashShelfCount(panels: readonly CabinetDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].shelf === open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open drawers that share a wick. */
export function wickClashCount(panels: readonly CabinetDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.wick !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].wick === open[j].wick) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open drawers whose shelves sit exactly four shelves apart. */
export function adjacentDrawerCount(panels: readonly CabinetDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].shelf || 0) - (open[j].shelf || 0)) === 3) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The weave with the fewest open drawers.
 * A tie keeps IVORY, then CHAMPAGNE, then GRAPHITE.
 * An empty desk still suggests IVORY.
 */
export function suggestWeave(panels: readonly CabinetDrawer[]): "GRAPHITE" | "IVORY" | "CHAMPAGNE" {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  const order = ["GRAPHITE", "IVORY", "CHAMPAGNE"] as const;
  let best: "GRAPHITE" | "IVORY" | "CHAMPAGNE" = "GRAPHITE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const weave of order) {
    const count = rows.filter((panel) => panel.weave === weave).length;
    if (count < bestCount) {
      best = weave;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The wick with the fewest open drawers.
 * A tie keeps 15, then 5, then 45.
 * An empty desk still suggests 15.
 */
export function suggestWick(panels: readonly CabinetDrawer[]): 5 | 15 | 45 {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  const order = [45, 15, 5] as const;
  let best: 5 | 15 | 45 = 45;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wick of order) {
    const count = rows.filter((panel) => panel.wick === wick).length;
    if (count < bestCount) {
      best = wick;
      bestCount = count;
    }
  }
  return best;
}

/** The newest clerk already written on a drawer. A blank clerk is skipped. */
export function suggestClerk(panels: readonly CabinetDrawer[]): string {
  const found = readDrawers(panels).find((panel) => panel.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open drawers.
 * A tie keeps the earlier name on the roster. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairClerk(panels: readonly CabinetDrawer[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = clerkLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestClerk(panels);
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open"));
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

/** The clerk with the most open drawers. A tie keeps the name that sorts later. */
export function busiestClerk(panels: readonly CabinetDrawer[]): string {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.clerk);
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

export function drawerClerks(panels: readonly CabinetDrawer[]): string[] {
  const out: string[] = [];
  for (const panel of readDrawers(panels)) {
    if (panel.clerk && !out.includes(panel.clerk)) out.push(panel.clerk);
  }
  return out;
}

export function drawerWeaves(panels: readonly CabinetDrawer[]): string[] {
  const out: string[] = [];
  for (const panel of readDrawers(panels)) {
    if (panel.weave && !out.includes(panel.weave)) out.push(panel.weave);
  }
  return out;
}

/** Open drawers whose clerk also watches another open drawer on a different shelf. */
export function pairClerkCount(panels: readonly CabinetDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.clerk && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].clerk === open[j].clerk && open[i].shelf !== open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open drawers that share an weave on different shelves. */
export function sharedWeaveCount(panels: readonly CabinetDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.weave && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].weave === open[j].weave && open[i].shelf !== open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The rib of open drawers. The resting rib of 1 still counts. */
export function ribLoad(panels: readonly CabinetDrawer[]): number {
  return readDrawers(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.rib, 0);
}

/** Open drawers that are both the quiet shelf and a house weave. */
export function quietHallCount(panels: readonly CabinetDrawer[]): number {
  return readDrawers(panels).filter((panel) => inTray(panel, "open") && quietShelf(panel.shelf) && houseWeave(panel.weave)).length;
}

/** Open drawers whose pace is rush. */
export function flareLoad(panels: readonly CabinetDrawer[]): number {
  return readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.pace === "flare").length;
}

export function shelfWidth(panels: readonly CabinetDrawer[]): number {
  const shelves = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null).map((panel) => panel.shelf as number);
  if (!shelves.length) return 0;
  return Math.max(...shelves) - Math.min(...shelves);
}

/** The next open drawer whose shelf sits ahead of the desk. An unset desk has no next drawer. */
export function nextDrawer(panels: readonly CabinetDrawer[], desk: unknown): string {
  const at = shelfOf(desk);
  if (at === null) return "";
  const rows = readDrawers(panels)
    .filter((panel) => inTray(panel, "open") && panel.rib === 2 && panel.shelf !== null && (panel.shelf as number) > at)
    .sort((a, b) => (a.shelf || 0) - (b.shelf || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveDrawerFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function drawerCopy(panel: CabinetDrawer, desk: unknown): string {
  const gap = shelfGap(panel.shelf, desk);
  return [panel.title, panel.clerk, panel.shelf ?? "", panel.weave, panel.pace, panel.wick ?? "", panel.rib, panel.tags.join(" "), panel.seal ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the drawers saved in this browser. The gap and the late mark use the shelf you pass. */
export function drawersCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,shelf,weave,pace,wick,rib,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readDrawers(raw);
  const windowIds = new Set(windowDrawers(rows, desk).map((panel) => panel.id));
  const at = shelfOf(desk);
  for (const panel of rows) {
    const gap = shelfGap(panel.shelf, desk);
    lines.push([
      panel.title,
      panel.clerk,
      panel.shelf === null ? "" : String(panel.shelf),
      panel.weave,
      panel.pace,
      panel.wick === null ? "" : String(panel.wick),
      String(panel.rib),
      panel.tags.join(" "),
      panel.pinned ? "1" : "0",
      panel.held ? "1" : "0",
      panel.archived ? "1" : "0",
      panel.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateDrawer(panel, desk) ? "1" : "0",
      soonDrawer(panel) ? "1" : "0",
      houseWeave(panel.weave) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.shelf === at && panel.rib === 2 && inTray(panel, "open") ? "1" : "0",
      coolingDrawer(panel) ? "1" : "0",
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

export function activeWeave(raw: string, weaves: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = weaveOf(raw);
  return name && weaves.map((item) => item.toUpperCase()).includes(name) ? name : weaves.includes(raw) ? raw : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return paces.includes(raw) ? raw : "all";
}

export function activeShelf(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return shelfOf(raw) === null ? "all" : raw;
}

export function activeWick(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return wickOf(raw) === null ? "all" : raw;
}

export function activeRib(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribOf(raw) === null ? "all" : raw;
}

export function clerkArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function weaveArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weaveOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function shelfArg(filter: string): { exact: number | null; pick: ShelfPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: shelfOf(filter), pick: null };
}

export function wickArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return wickOf(filter);
}

export function ribArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return ribOf(filter);
}

function readView(raw: unknown): DrawerView | null {
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
    weave: clip(row.weave, 12),
    pace: clip(row.pace, 8),
    shelf: clip(row.shelf, 8),
    wick: clip(row.wick, 8),
    rib: clip(row.rib, 8),
  };
}

export function readDrawerViews(raw: unknown): DrawerView[] {
  if (!Array.isArray(raw)) return [];
  const out: DrawerView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addDrawerView(views: readonly DrawerView[], view: DrawerView): DrawerView[] {
  const current = readDrawerViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropDrawerView(views: readonly DrawerView[], id: string): DrawerView[] {
  return readDrawerViews(views).filter((view) => view.id !== id);
}


function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function watermarkParts(value: WatermarkValue): { customer: string; kind: string; status: string; ok: boolean } {
  if (typeof value === "string") return { customer: clip(value, 40), kind: "", status: "", ok: true };
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
  const kind = clip(kindRaw, 12).toUpperCase();
  const status = clip(statusRaw, 12).toUpperCase();
  return {
    customer: clip(customerRaw, 40),
    kind: kind === "DEPOSIT" || kind === "MARGIN" || kind === "WITHDRAW" || kind === "KYC" ? kind : "",
    status: status === "PENDING" || status === "APPROVED" || status === "REJECTED" ? status : "",
    ok: true,
  };
}

export function watermarkState(value: WatermarkValue): WatermarkState {
  const found = watermarkParts(value);
  if (!found.ok) return "";
  return found.customer ? "set" : "clear";
}

export function watermarkCopy(value: WatermarkValue): string {
  const found = watermarkParts(value);
  return found.ok ? found.customer : "";
}

/** The mark is the first letter of each word, up to two. Digits are not letters. */
export function watermarkMark(value: WatermarkValue): string {
  const text = watermarkCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the customer is a stamp. A KYC document is a ribbon.
 * A DEPOSIT is a thread. A WITHDRAW is a fold. Any other named customer is plain.
 * A digit wins over the kind.
 */
export function watermarkLane(value: WatermarkValue): WatermarkLane {
  const found = watermarkParts(value);
  if (!found.ok || !found.customer) return "";
  if (/\d/.test(found.customer)) return "stamp";
  if (found.kind === "KYC") return "ribbon";
  if (found.kind === "DEPOSIT") return "thread";
  if (found.kind === "WITHDRAW") return "fold";
  return "plain";
}

/**
 * An approved KYC document is gilt. A pending row is pale. A rejected row is ash.
 * Any other approved kind is linen. A withdraw with no status is linen.
 * A name with neither kind nor status is haze.
 */
export function watermarkTone(value: WatermarkValue): WatermarkTone {
  const found = watermarkParts(value);
  if (!found.ok || !found.customer) return "";
  if (found.status === "APPROVED" && found.kind === "KYC") return "gilt";
  if (found.status === "PENDING") return "pale";
  if (found.status === "REJECTED") return "ash";
  if (found.status === "APPROVED") return "linen";
  if (!found.kind && !found.status) return "haze";
  if (found.kind === "WITHDRAW") return "linen";
  return "haze";
}

export function stitchedWatermark(value: WatermarkValue): boolean {
  return watermarkCopy(value).includes("&");
}

export function stitchedWatermarkCount(rows: readonly WatermarkRow[]): number {
  return rows.filter((row) => stitchedWatermark(row.note)).length;
}

export function wideWatermark(value: WatermarkValue): boolean {
  return watermarkCopy(value).length >= 14;
}

export function wideWatermarkCount(rows: readonly WatermarkRow[]): number {
  return rows.filter((row) => wideWatermark(row.note)).length;
}

export function giltWatermarkCount(rows: readonly WatermarkRow[]): number {
  return rows.filter((row) => watermarkTone(row.note) === "gilt").length;
}

export function plainCount(rows: readonly WatermarkRow[]): number {
  return rows.filter((row) => watermarkLane(row.note) === "plain").length;
}

export function stampCount(rows: readonly WatermarkRow[]): number {
  return rows.filter((row) => watermarkLane(row.note) === "stamp").length;
}

export function threadCount(rows: readonly WatermarkRow[]): number {
  return rows.filter((row) => watermarkLane(row.note) === "thread").length;
}

export function sharedWatermarkCount(rows: readonly WatermarkRow[]): number {
  const marks = rows.map((row) => watermarkMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(watermarkMark(row.note))).length;
}

export function watermarkLanes(rows: readonly WatermarkRow[]): WatermarkLaneLine[] {
  const lanes = ["plain", "thread", "ribbon", "fold", "stamp"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => watermarkLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingWatermark(rows: readonly WatermarkRow[]): string {
  const lines = watermarkLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingWatermarkTone(rows: readonly WatermarkRow[]): string {
  const tones = ["gilt", "linen", "pale", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => watermarkTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function watermarkShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words or more. */
export function watermarkStep(value: WatermarkValue): 0 | 1 | 2 {
  const text = watermarkCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return words <= 1 ? 1 : 2;
}

export function presentWatermarkLanes(rows: readonly WatermarkRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = watermarkState(row.note);
    const lane = state === "set" ? watermarkLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenWatermarks(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "plain" || lane === "thread" || lane === "ribbon" || lane === "fold" || lane === "stamp" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedWatermarks(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleWatermark(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleWatermarkReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkWatermarkReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleWatermarkLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleWatermarks(
  rows: readonly WatermarkRow[],
  lane: WatermarkLane | "blank" | null,
  tone: WatermarkTone | null,
  query: string,
  review: WatermarkReview,
  reviewed: readonly string[],
  shape: WatermarkShape,
): WatermarkRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = watermarkState(row.note);
    if (!state) return false;
    const token = state === "set" ? watermarkLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && watermarkTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${watermarkCopy(row.note)} ${watermarkMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "stitch" && !stitchedWatermark(row.note)) return false;
    if (shape === "wide" && !wideWatermark(row.note)) return false;
    if (shape === "plain" && watermarkLane(row.note) !== "plain") return false;
    if (shape === "stamp" && watermarkLane(row.note) !== "stamp") return false;
    if (shape === "ribbon" && watermarkLane(row.note) !== "ribbon") return false;
    return true;
  });
}

export function activeWatermarkLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeWatermarkTone(raw: string): string {
  return raw === "gilt" || raw === "linen" || raw === "pale" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function watermarkLaneArg(filter: string): WatermarkLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "plain" || filter === "thread" || filter === "ribbon" || filter === "fold" || filter === "stamp") return filter;
  return null;
}

export function watermarkToneArg(filter: string): WatermarkTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "linen" || filter === "pale" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function watermarksCsv(rows: readonly WatermarkRow[]): string {
  const lines = ["lane,count"];
  for (const line of watermarkLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function watermarkRowsCsv(rows: readonly WatermarkRow[], reviewed: readonly string[]): string {
  const lines = ["customer,mark,lane,tone,step,stitch,wide,plain,thread,ribbon,fold,stamp,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = watermarkParts(row.note);
    if (!found.ok) continue;
    const lane = watermarkLane(row.note);
    lines.push([
      found.customer,
      watermarkMark(row.note),
      lane,
      watermarkTone(row.note),
      String(watermarkStep(row.note)),
      stitchedWatermark(row.note) ? "1" : "0",
      wideWatermark(row.note) ? "1" : "0",
      lane === "plain" ? "1" : "0",
      lane === "thread" ? "1" : "0",
      lane === "ribbon" ? "1" : "0",
      lane === "fold" ? "1" : "0",
      lane === "stamp" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
