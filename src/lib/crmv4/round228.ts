/**
 * Sacristy drawers for the support desk, and antiphon marks already stored as customer, kind, and status on each loaded ticket or document.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sacristy_drawer (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   sexton text not null default '',
 *   shelf integer,
 *   pigment text not null default '',
 *   pace text not null default '',
 *   wick integer,
 *   stay integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   boss boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_antiphon_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_antiphon_review (
 *   ticket_id text primary key
 * );
 */

export const SDR_KEY = "crmv4-sacristy-drawer";
export const SDR_VIEW_KEY = "crmv4-sacristy-views";
export const SDR_DENSITY_KEY = "crmv4-sacristy-density";
export const ANT_KEY = "crmv4-antiphon-hide";
export const ANT_REVIEW_KEY = "crmv4-antiphon-review";

export type PigmentName = "blank" | "graphite" | "ivory" | "champagne";

export type PaceName = "blank" | "hush" | "stride" | "rush";

export type DrawerTray = "open" | "held" | "archived";

export type ShelfPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type DrawerDensity = "airy" | "tight";

export type DrawerSort = "shelf" | "sexton";

export type SacristyDrawer = {
  id: string;
  title: string;
  note: string;
  sexton: string;
  shelf: number | null;
  pigment: string;
  pace: string;
  wick: number | null;
  stay: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  boss: boolean;
  audit: string;
};

export type DrawerView = {
  id: string;
  name: string;
  tray: DrawerTray;
  query: string;
  sexton: string;
  pigment: string;
  pace: string;
  shelf: string;
  wick: string;
  stay: string;
};

export type DrawerCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  stay: number;
  house: number;
  window: number;
  matched: number;
  boss: number;
  cooling: number;
};

export type AntiphonLane = "" | "margin" | "bell" | "quill" | "cipher";

export type AntiphonTone = "" | "bright" | "even" | "dim" | "hush" | "mist";

export type AntiphonState = "" | "clear" | "set";

export type AntiphonShape = "all" | "stitch" | "wide" | "margin" | "cipher" | "quill";

export type AntiphonReview = "all" | "reviewed" | "fresh";

export type AntiphonValue = string | { customer?: unknown; kind?: unknown; status?: unknown; title?: unknown; [key: string]: unknown } | null | undefined;

export type AntiphonRow = { id: string; label: string; note: AntiphonValue };

export type AntiphonLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "pigment", "tag", "stay", "wick", "boss"] as const;

const INKS = ["graphite", "ivory", "champagne"] as const;

const GAITS = ["still", "walk", "flare"] as const;

const GAIT_CYCLE = ["still", "walk", "flare"] as const;

const PEAK_BAYS = new Set([3, 6]);

const QUIET_BAYS = new Set([1]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const DRAWER_CAP = 6;

const VIEW_CAP = 5;

const TAG_CAP = 3;

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

function pigmentName(raw: unknown): Exclude<PigmentName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<PigmentName, "blank">) : "";
}

function paceName(raw: unknown): Exclude<PaceName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (GAITS as readonly string[]).includes(text) ? (text as Exclude<PaceName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: SacristyDrawer, tray: DrawerTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function drawerLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function drawerNote(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank sexton stays blank. It is not filled in. */
export function sextonLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** An pigment is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function pigmentOf(raw: unknown): string {
  const name = pigmentName(raw);
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

/** Stay is 2, 4, or 8. Anything else is not a stay. 2 is the resting stay. */
export function stayOf(raw: unknown): 2 | 4 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

export function shelfBand(shelf: unknown): "blank" | "early" | "mid" | "late" {
  const value = shelfOf(shelf);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak shelves are 3 and 6. An unset shelf is not a peak shelf. */
export function peakShelf(shelf: unknown): boolean {
  const value = shelfOf(shelf);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet shelf is 1. A peak shelf is not quiet. An unset shelf is not quiet. */
export function quietShelf(shelf: unknown): boolean {
  const value = shelfOf(shelf);
  return value !== null && QUIET_BAYS.has(value);
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

/** IVORY and CHAMPAGNE are house pigments. GRAPHITE is a guest pigment. A blank pigment is not a house pigment. */
export function housePigment(pigment: unknown): boolean {
  return HOUSE.has(pigmentOf(pigment));
}

export function rowDensity(raw: unknown): DrawerDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function drawerSort(raw: unknown): DrawerSort {
  return raw === "sexton" ? "sexton" : "shelf";
}

function readOne(raw: unknown): SacristyDrawer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = drawerLine(row.title);
  if (!id || !title) return null;
  const stay = stayOf(row.stay);
  return {
    id,
    title,
    note: drawerNote(row.note),
    sexton: sextonLabel(row.sexton),
    shelf: shelfOf(row.shelf),
    pigment: pigmentOf(row.pigment),
    pace: paceName(row.pace),
    wick: wickOf(row.wick),
    stay: stay === null ? 2 : stay,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    boss: row.boss === true,
    audit: auditCode(row.audit),
  };
}

export function readDrawers(raw: unknown): SacristyDrawer[] {
  if (!Array.isArray(raw)) return [];
  const out: SacristyDrawer[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, DRAWER_CAP);
}

export function addDrawer(
  panels: readonly SacristyDrawer[],
  panel: {
    id: string;
    title: string;
    note?: string;
    sexton?: string;
    shelf?: unknown;
    pigment?: string;
    pace?: string;
    wick?: unknown;
    stay?: unknown;
    tags?: unknown;
  },
): SacristyDrawer[] {
  const current = readDrawers(panels);
  const id = String(panel.id || "").trim();
  const title = drawerLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const stay = stayOf(panel.stay);
  const next: SacristyDrawer = {
    id,
    title,
    note: drawerNote(panel.note),
    sexton: sextonLabel(panel.sexton),
    shelf: shelfOf(panel.shelf),
    pigment: pigmentOf(panel.pigment),
    pace: paceName(panel.pace),
    wick: wickOf(panel.wick),
    stay: stay === null ? 2 : stay,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    boss: false,
    audit: "save",
  };
  return [next, ...current].slice(0, DRAWER_CAP);
}

/** A blank pace becomes hush, hush becomes stride, stride becomes rush, and rush returns to hush. */
export function cyclePace(panels: readonly SacristyDrawer[], id: string): SacristyDrawer[] {
  return readDrawers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = GAIT_CYCLE.indexOf(panel.pace as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === panel.pace) return panel;
    return { ...panel, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editDrawer(panels: readonly SacristyDrawer[], id: string, title: unknown): SacristyDrawer[] {
  const next = drawerLine(title);
  if (!next) return readDrawers(panels);
  const current = readDrawers(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editDrawerNote(panels: readonly SacristyDrawer[], id: string, note: unknown): SacristyDrawer[] {
  const next = drawerNote(note);
  return readDrawers(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addDrawerTag(panels: readonly SacristyDrawer[], id: string, tag: unknown): SacristyDrawer[] {
  const next = tagsOf(tag);
  if (!next.length) return readDrawers(panels);
  return readDrawers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setDrawerStay(panels: readonly SacristyDrawer[], id: string, stay: unknown): SacristyDrawer[] {
  const next = stayOf(stay);
  if (next === null) return readDrawers(panels);
  return readDrawers(panels).map((panel) => (panel.id === id && panel.stay !== next ? { ...panel, stay: next, audit: "stay" } : panel));
}

/** Snooze lengthens the wick from blank to 5, from 5 to 15, and from 15 to 45. 45 stays. */
export function snoozeDrawer(panels: readonly SacristyDrawer[], id: string): SacristyDrawer[] {
  return readDrawers(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.wick === null ? 5 : panel.wick === 5 ? 15 : panel.wick === 15 ? 45 : null;
    if (next === null) return panel;
    return { ...panel, wick: next, audit: "wick" };
  });
}

export function setDrawerPin(panels: readonly SacristyDrawer[], id: string, pinned: boolean): SacristyDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedDrawer(panels: readonly SacristyDrawer[], shownIds: readonly string[], index: number): SacristyDrawer[] {
  const id = shownIds[index];
  if (!id) return readDrawers(panels);
  const panel = readDrawers(panels).find((item) => item.id === id);
  if (!panel) return readDrawers(panels);
  return setDrawerPin(panels, id, !panel.pinned);
}

export function snoozeFocusedDrawer(panels: readonly SacristyDrawer[], shownIds: readonly string[], index: number): SacristyDrawer[] {
  const id = shownIds[index];
  return id ? snoozeDrawer(panels, id) : readDrawers(panels);
}

export function holdFocusedDrawer(panels: readonly SacristyDrawer[], shownIds: readonly string[], index: number): SacristyDrawer[] {
  const id = shownIds[index];
  if (!id) return readDrawers(panels);
  const panel = readDrawers(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readDrawers(panels);
  return setDrawerHold(panels, id, !panel.held);
}

export function paceFocusedDrawer(panels: readonly SacristyDrawer[], shownIds: readonly string[], index: number): SacristyDrawer[] {
  const id = shownIds[index];
  return id ? cyclePace(panels, id) : readDrawers(panels);
}

export function bossFocusedDrawer(panels: readonly SacristyDrawer[], shownIds: readonly string[], index: number): SacristyDrawer[] {
  const id = shownIds[index];
  if (!id) return readDrawers(panels);
  const panel = readDrawers(panels).find((item) => item.id === id);
  if (!panel) return readDrawers(panels);
  return setDrawerBoss(panels, id, !panel.boss);
}

export function setDrawerHold(panels: readonly SacristyDrawer[], id: string, held: boolean): SacristyDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setDrawerArchive(panels: readonly SacristyDrawer[], id: string, archived: boolean): SacristyDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setDrawerBoss(panels: readonly SacristyDrawer[], id: string, boss: boolean): SacristyDrawer[] {
  return readDrawers(panels).map((panel) => (panel.id === id && panel.boss !== boss ? { ...panel, boss, audit: "boss" } : panel));
}

export function bulkDrawerPigment(panels: readonly SacristyDrawer[], ids: readonly string[], pigment: unknown): SacristyDrawer[] {
  const next = pigmentOf(pigment);
  if (!next) return readDrawers(panels);
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.pigment !== next ? { ...panel, pigment: next, audit: "pigment" } : panel));
}

export function bulkDrawerPin(panels: readonly SacristyDrawer[], ids: readonly string[], pinned: boolean): SacristyDrawer[] {
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkDrawerArchive(panels: readonly SacristyDrawer[], ids: readonly string[], archived: boolean): SacristyDrawer[] {
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkDrawerPace(panels: readonly SacristyDrawer[], ids: readonly string[], pace: unknown): SacristyDrawer[] {
  const next = paceName(pace);
  if (!next) return readDrawers(panels);
  const want = new Set(ids);
  return readDrawers(panels).map((panel) => (want.has(panel.id) && panel.pace !== next ? { ...panel, pace: next, audit: "pace" } : panel));
}

export function bulkDrawerTag(panels: readonly SacristyDrawer[], ids: readonly string[], tag: unknown): SacristyDrawer[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addDrawerTag(rows, id, tag) : rows), readDrawers(panels));
}

export function resetDrawers(): SacristyDrawer[] {
  return [];
}

/** An open drawer whose shelf sits more than two shelves behind the desk. A raised stay, a hold, or an archive is not late. */
export function lateDrawer(panel: SacristyDrawer, desk: unknown): boolean {
  const gap = shelfGap(panel.shelf, desk);
  return inTray(panel, "open") && panel.stay === 2 && gap !== null && gap > 2;
}

/** An open drawer with a wick of 5 is due now. A raised stay, a hold, or an archive is not. */
export function soonDrawer(panel: SacristyDrawer): boolean {
  return inTray(panel, "open") && panel.stay === 2 && panel.wick === 5;
}

/** An open resting drawer on a walk pace whose shelf is 1. That quiet walk is cooling. */
export function coolingDrawer(panel: SacristyDrawer): boolean {
  return inTray(panel, "open") && panel.stay === 2 && panel.pace === "walk" && panel.shelf === 1;
}

/** Open drawers that are late or due now. A raised drawer stays off the reminder list. */
export function reminderDrawers(panels: readonly SacristyDrawer[], desk: unknown): SacristyDrawer[] {
  return readDrawers(panels).filter((panel) => lateDrawer(panel, desk) || soonDrawer(panel));
}

export function coolingDrawers(panels: readonly SacristyDrawer[]): SacristyDrawer[] {
  return readDrawers(panels).filter((panel) => coolingDrawer(panel));
}

/** Open drawers whose shelf sits within four shelves of the desk. A raised stay, a hold, or an archive stays out. */
export function windowDrawers(panels: readonly SacristyDrawer[], desk: unknown): SacristyDrawer[] {
  return readDrawers(panels).filter((panel) => {
    const gap = shelfGap(panel.shelf, desk);
    return inTray(panel, "open") && panel.stay === 2 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedDrawers(panels: readonly SacristyDrawer[], desk: unknown): number {
  const at = shelfOf(desk);
  if (at === null) return 0;
  return readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.stay === 2 && panel.shelf === at).length;
}

function shelfHit(shelf: number | null, exact: number | null, pick: ShelfPick | null): boolean {
  if (exact !== null) return shelf === exact;
  if (pick === null) return true;
  if (pick === "blank") return shelf === null;
  if (pick === "peak") return peakShelf(shelf);
  if (pick === "quiet") return quietShelf(shelf);
  return shelfBand(shelf) === pick;
}

/** Search matches the title, the note, the sexton, and the tags. */
export function visibleDrawers(
  panels: readonly SacristyDrawer[],
  tray: DrawerTray,
  query: string,
  sexton: string | null,
  pigment: string | null,
  pace: string | null,
  exact: number | null,
  pick: ShelfPick | null,
  wick: number | "blank" | null,
  stay: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): SacristyDrawer[] {
  const text = query.trim().toLowerCase();
  return readDrawers(panels).filter((panel) => {
    if (!inTray(panel, tray)) return false;
    if (text) {
      const hay = `${panel.title} ${panel.note} ${panel.sexton} ${panel.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (sexton !== null && panel.sexton !== sexton) return false;
    if (pigment === "blank" ? Boolean(panel.pigment) : pigment && panel.pigment !== pigment) return false;
    if (pace === "blank" ? Boolean(panel.pace) : pace && panel.pace !== pace) return false;
    if (!shelfHit(panel.shelf, exact, pick)) return false;
    if (wick === "blank" ? panel.wick !== null : wick !== null && panel.wick !== wick) return false;
    if (stay === "blank" ? panel.stay !== 2 : stay !== null && panel.stay !== stay) return false;
    if (flareOnly && panel.pace !== "flare") return false;
    if (peakOnly && !peakShelf(panel.shelf)) return false;
    if (houseOnly && !housePigment(panel.pigment)) return false;
    if (quietOnly && !quietShelf(panel.shelf)) return false;
    if (restingOnly && panel.stay !== 2) return false;
    return true;
  });
}

export function sortDrawers(panels: readonly SacristyDrawer[], mode: DrawerSort): SacristyDrawer[] {
  const rows = panels.slice();
  if (mode === "sexton") return rows.sort((a, b) => a.sexton.localeCompare(b.sexton) || (a.shelf ?? 99) - (b.shelf ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.shelf ?? 99) - (b.shelf ?? 99) || a.title.localeCompare(b.title));
}

export function drawerIndex(panels: readonly SacristyDrawer[], query: string): SacristyDrawer[] {
  const text = query.trim().toLowerCase();
  return sortDrawers(
    readDrawers(panels).filter((panel) => panel.shelf !== null && (!text || panel.title.toLowerCase().includes(text))),
    "shelf",
  );
}

export function drawerCounts(panels: readonly SacristyDrawer[], desk: unknown): DrawerCounts {
  const rows = readDrawers(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.stay === 2 && peakShelf(panel.shelf)).length,
    late: rows.filter((panel) => lateDrawer(panel, desk)).length,
    soon: rows.filter((panel) => soonDrawer(panel)).length,
    stay: rows.filter((panel) => inTray(panel, "open") && panel.stay > 2).length,
    house: rows.filter((panel) => inTray(panel, "open") && housePigment(panel.pigment)).length,
    window: windowDrawers(rows, desk).length,
    matched: matchedDrawers(rows, desk),
    boss: rows.filter((panel) => panel.boss).length,
    cooling: rows.filter((panel) => coolingDrawer(panel)).length,
  };
}

export function drawerShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open drawers as a share of every open drawer. */
export function lateDrawerShare(panels: readonly SacristyDrawer[], desk: unknown): number {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  return drawerShare(rows.filter((panel) => lateDrawer(panel, desk)).length, rows.length);
}

export function usedShelves(panels: readonly SacristyDrawer[]): number {
  return new Set(readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null).map((panel) => panel.shelf)).size;
}

/** Open drawers that share a shelf. */
export function clashShelfCount(panels: readonly SacristyDrawer[]): number {
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
export function wickClashCount(panels: readonly SacristyDrawer[]): number {
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

/** Open drawers whose shelves sit exactly two shelves apart. */
export function adjacentDrawerCount(panels: readonly SacristyDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].shelf || 0) - (open[j].shelf || 0)) === 2) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The pigment with the fewest open drawers.
 * A tie keeps IVORY, then CHAMPAGNE, then GRAPHITE.
 * An empty desk still suggests IVORY.
 */
export function suggestPigment(panels: readonly SacristyDrawer[]): "GRAPHITE" | "CHAMPAGNE" | "IVORY" {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  const order = ["IVORY", "CHAMPAGNE", "GRAPHITE"] as const;
  let best: "IVORY" | "CHAMPAGNE" | "GRAPHITE" = "IVORY";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pigment of order) {
    const count = rows.filter((panel) => panel.pigment === pigment).length;
    if (count < bestCount) {
      best = pigment;
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
export function suggestWick(panels: readonly SacristyDrawer[]): 5 | 15 | 45 {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  const order = [15, 5, 45] as const;
  let best: 5 | 15 | 45 = 15;
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

/** The newest sexton already written on a drawer. A blank sexton is skipped. */
export function suggestSexton(panels: readonly SacristyDrawer[]): string {
  const found = readDrawers(panels).find((panel) => panel.sexton);
  return found ? found.sexton : "";
}

/**
 * The sexton carrying the fewest open drawers.
 * A tie keeps the earlier name on the roster. A blank sexton is not a load.
 * An empty roster falls back to the newest sexton.
 */
export function fairSexton(panels: readonly SacristyDrawer[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = sextonLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSexton(panels);
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((panel) => panel.sexton === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The sexton with the most open drawers. A tie keeps the name that sorts later. */
export function busiestSexton(panels: readonly SacristyDrawer[]): string {
  const rows = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.sexton);
  const names: string[] = [];
  for (const panel of rows) if (!names.includes(panel.sexton)) names.push(panel.sexton);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((panel) => panel.sexton === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function drawerSextons(panels: readonly SacristyDrawer[]): string[] {
  const out: string[] = [];
  for (const panel of readDrawers(panels)) {
    if (panel.sexton && !out.includes(panel.sexton)) out.push(panel.sexton);
  }
  return out;
}

export function drawerPigments(panels: readonly SacristyDrawer[]): string[] {
  const out: string[] = [];
  for (const panel of readDrawers(panels)) {
    if (panel.pigment && !out.includes(panel.pigment)) out.push(panel.pigment);
  }
  return out;
}

/** Open drawers whose sexton also watches another open drawer on a different shelf. */
export function pairSextonCount(panels: readonly SacristyDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.sexton && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].sexton === open[j].sexton && open[i].shelf !== open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open drawers that share an pigment on different shelves. */
export function sharedPigmentCount(panels: readonly SacristyDrawer[]): number {
  const open = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.pigment && panel.shelf !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].pigment === open[j].pigment && open[i].shelf !== open[j].shelf) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The stay of open drawers. The resting stay of 1 still counts. */
export function stayLoad(panels: readonly SacristyDrawer[]): number {
  return readDrawers(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.stay, 0);
}

/** Open drawers that are both the quiet shelf and a house pigment. */
export function quietHallCount(panels: readonly SacristyDrawer[]): number {
  return readDrawers(panels).filter((panel) => inTray(panel, "open") && quietShelf(panel.shelf) && housePigment(panel.pigment)).length;
}

/** Open drawers whose pace is rush. */
export function flareLoad(panels: readonly SacristyDrawer[]): number {
  return readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.pace === "flare").length;
}

export function shelfWidth(panels: readonly SacristyDrawer[]): number {
  const shelves = readDrawers(panels).filter((panel) => inTray(panel, "open") && panel.shelf !== null).map((panel) => panel.shelf as number);
  if (!shelves.length) return 0;
  return Math.max(...shelves) - Math.min(...shelves);
}

/** The next open drawer whose shelf sits ahead of the desk. An unset desk has no next drawer. */
export function nextDrawer(panels: readonly SacristyDrawer[], desk: unknown): string {
  const at = shelfOf(desk);
  if (at === null) return "";
  const rows = readDrawers(panels)
    .filter((panel) => inTray(panel, "open") && panel.stay === 2 && panel.shelf !== null && (panel.shelf as number) > at)
    .sort((a, b) => (a.shelf || 0) - (b.shelf || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveDrawerFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function drawerCopy(panel: SacristyDrawer, desk: unknown): string {
  const gap = shelfGap(panel.shelf, desk);
  return [panel.title, panel.sexton, panel.shelf ?? "", panel.pigment, panel.pace, panel.wick ?? "", panel.stay, panel.tags.join(" "), panel.boss ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the drawers saved in this browser. The gap and the late mark use the shelf you pass. */
export function drawersCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,sexton,shelf,pigment,pace,wick,stay,tags,pinned,held,archived,boss,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readDrawers(raw);
  const windowIds = new Set(windowDrawers(rows, desk).map((panel) => panel.id));
  const at = shelfOf(desk);
  for (const panel of rows) {
    const gap = shelfGap(panel.shelf, desk);
    lines.push([
      panel.title,
      panel.sexton,
      panel.shelf === null ? "" : String(panel.shelf),
      panel.pigment,
      panel.pace,
      panel.wick === null ? "" : String(panel.wick),
      String(panel.stay),
      panel.tags.join(" "),
      panel.pinned ? "1" : "0",
      panel.held ? "1" : "0",
      panel.archived ? "1" : "0",
      panel.boss ? "1" : "0",
      gap === null ? "" : String(gap),
      lateDrawer(panel, desk) ? "1" : "0",
      soonDrawer(panel) ? "1" : "0",
      housePigment(panel.pigment) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.shelf === at && panel.stay === 2 && inTray(panel, "open") ? "1" : "0",
      coolingDrawer(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeSexton(raw: string, sextons: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return sextons.includes(raw) ? raw : "all";
}

export function activePigment(raw: string, pigments: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = pigmentOf(raw);
  return name && pigments.map((item) => item.toUpperCase()).includes(name) ? name : pigments.includes(raw) ? raw : "all";
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

export function activeStay(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return stayOf(raw) === null ? "all" : raw;
}

export function sextonArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function pigmentArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return pigmentOf(filter) || null;
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

export function stayArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stayOf(filter);
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
    sexton: clip(row.sexton, 16),
    pigment: clip(row.pigment, 12),
    pace: clip(row.pace, 8),
    shelf: clip(row.shelf, 8),
    wick: clip(row.wick, 8),
    stay: clip(row.stay, 8),
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

function antiphonParts(value: AntiphonValue): { customer: string; kind: string; status: string; ok: boolean } {
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

export function antiphonState(value: AntiphonValue): AntiphonState {
  const found = antiphonParts(value);
  if (!found.ok) return "";
  return found.customer ? "set" : "clear";
}

export function antiphonCopy(value: AntiphonValue): string {
  const found = antiphonParts(value);
  return found.ok ? found.customer : "";
}

/** The mark is the first letter of each word, up to three. Digits are not letters. */
export function antiphonMark(value: AntiphonValue): string {
  const text = antiphonCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the customer is a cipher. A DEPOSIT is a bell.
 * A MARGIN or a KYC document is a quill. Any other named customer is a margin.
 * A digit wins over the kind.
 */
export function antiphonLane(value: AntiphonValue): AntiphonLane {
  const found = antiphonParts(value);
  if (!found.ok || !found.customer) return "";
  if (/\d/.test(found.customer)) return "cipher";
  if (found.kind === "DEPOSIT") return "bell";
  if (found.kind === "MARGIN" || found.kind === "KYC") return "quill";
  return "margin";
}

/**
 * An approved deposit is bright. A pending row is dim. A rejected row is hush.
 * Any other approved kind is even. A withdraw with no status is even.
 * A name with neither kind nor status is mist.
 */
export function antiphonTone(value: AntiphonValue): AntiphonTone {
  const found = antiphonParts(value);
  if (!found.ok || !found.customer) return "";
  if (found.status === "APPROVED" && found.kind === "DEPOSIT") return "bright";
  if (found.status === "PENDING") return "dim";
  if (found.status === "REJECTED") return "hush";
  if (found.status === "APPROVED") return "even";
  if (!found.kind && !found.status) return "mist";
  if (found.kind === "WITHDRAW") return "even";
  return "mist";
}

export function stitchedAntiphon(value: AntiphonValue): boolean {
  return antiphonCopy(value).includes("/");
}

export function stitchedAntiphonCount(rows: readonly AntiphonRow[]): number {
  return rows.filter((row) => stitchedAntiphon(row.note)).length;
}

export function wideAntiphon(value: AntiphonValue): boolean {
  return antiphonCopy(value).length >= 12;
}

export function wideAntiphonCount(rows: readonly AntiphonRow[]): number {
  return rows.filter((row) => wideAntiphon(row.note)).length;
}

export function brightAntiphonCount(rows: readonly AntiphonRow[]): number {
  return rows.filter((row) => antiphonTone(row.note) === "bright").length;
}

export function marginCount(rows: readonly AntiphonRow[]): number {
  return rows.filter((row) => antiphonLane(row.note) === "margin").length;
}

export function cipherCount(rows: readonly AntiphonRow[]): number {
  return rows.filter((row) => antiphonLane(row.note) === "cipher").length;
}

export function bellCount(rows: readonly AntiphonRow[]): number {
  return rows.filter((row) => antiphonLane(row.note) === "bell").length;
}

export function sharedAntiphonCount(rows: readonly AntiphonRow[]): number {
  const marks = rows.map((row) => antiphonMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(antiphonMark(row.note))).length;
}

export function antiphonLanes(rows: readonly AntiphonRow[]): AntiphonLaneLine[] {
  const lanes = ["margin", "bell", "quill", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => antiphonLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingAntiphon(rows: readonly AntiphonRow[]): string {
  const lines = antiphonLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingAntiphonTone(rows: readonly AntiphonRow[]): string {
  const tones = ["bright", "even", "dim", "hush", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => antiphonTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function antiphonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function antiphonStep(value: AntiphonValue): 0 | 1 | 2 | 3 {
  const text = antiphonCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentAntiphonLanes(rows: readonly AntiphonRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = antiphonState(row.note);
    const lane = state === "set" ? antiphonLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenAntiphons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "margin" || lane === "bell" || lane === "quill" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedAntiphons(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleAntiphon(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleAntiphonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkAntiphonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleAntiphonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleAntiphons(
  rows: readonly AntiphonRow[],
  lane: AntiphonLane | "blank" | null,
  tone: AntiphonTone | null,
  query: string,
  review: AntiphonReview,
  reviewed: readonly string[],
  shape: AntiphonShape,
): AntiphonRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = antiphonState(row.note);
    if (!state) return false;
    const token = state === "set" ? antiphonLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && antiphonTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${antiphonCopy(row.note)} ${antiphonMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "stitch" && !stitchedAntiphon(row.note)) return false;
    if (shape === "wide" && !wideAntiphon(row.note)) return false;
    if (shape === "margin" && antiphonLane(row.note) !== "margin") return false;
    if (shape === "cipher" && antiphonLane(row.note) !== "cipher") return false;
    if (shape === "quill" && antiphonLane(row.note) !== "quill") return false;
    return true;
  });
}

export function activeAntiphonLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeAntiphonTone(raw: string): string {
  return raw === "bright" || raw === "even" || raw === "dim" || raw === "hush" || raw === "mist" || raw === "all" ? raw : "all";
}

export function antiphonLaneArg(filter: string): AntiphonLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "margin" || filter === "bell" || filter === "quill" || filter === "cipher") return filter;
  return null;
}

export function antiphonToneArg(filter: string): AntiphonTone | null {
  if (filter === "all") return null;
  if (filter === "bright" || filter === "even" || filter === "dim" || filter === "hush" || filter === "mist") return filter;
  return null;
}

export function antiphonsCsv(rows: readonly AntiphonRow[]): string {
  const lines = ["lane,count"];
  for (const line of antiphonLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function antiphonRowsCsv(rows: readonly AntiphonRow[], reviewed: readonly string[]): string {
  const lines = ["customer,mark,lane,tone,step,stitch,wide,margin,bell,quill,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = antiphonParts(row.note);
    if (!found.ok) continue;
    const lane = antiphonLane(row.note);
    lines.push([
      found.customer,
      antiphonMark(row.note),
      lane,
      antiphonTone(row.note),
      String(antiphonStep(row.note)),
      stitchedAntiphon(row.note) ? "1" : "0",
      wideAntiphon(row.note) ? "1" : "0",
      lane === "margin" ? "1" : "0",
      lane === "bell" ? "1" : "0",
      lane === "quill" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
