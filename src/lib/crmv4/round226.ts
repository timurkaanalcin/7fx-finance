/**
 * Brocade swatches for the marketing desk, and pennant marks already stored as name, leads, valid, and invalid on each loaded affiliate.
 * Deposit and money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_brocade_swatch (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   weaver text not null default '',
 *   loom integer,
 *   dye text not null default '',
 *   pace text not null default '',
 *   thread integer,
 *   ply integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   wax boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_pennant_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_pennant_review (
 *   affiliate_name text primary key
 * );
 */

export const BRD_KEY = "crmv4-brocade-swatch";
export const BRD_VIEW_KEY = "crmv4-brocade-views";
export const BRD_DENSITY_KEY = "crmv4-brocade-density";
export const PNT_KEY = "crmv4-pennant-hide";
export const PNT_REVIEW_KEY = "crmv4-pennant-review";

export type DyeName = "blank" | "graphite" | "ivory" | "champagne";

export type PaceName = "blank" | "hush" | "glide" | "flare";

export type SwatchTray = "open" | "held" | "archived";

export type LoomPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SwatchDensity = "airy" | "tight";

export type SwatchSort = "loom" | "weaver";

export type BrocadeSwatch = {
  id: string;
  title: string;
  note: string;
  weaver: string;
  loom: number | null;
  dye: string;
  pace: string;
  thread: number | null;
  ply: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  wax: boolean;
  audit: string;
};

export type SwatchView = {
  id: string;
  name: string;
  tray: SwatchTray;
  query: string;
  weaver: string;
  dye: string;
  pace: string;
  loom: string;
  thread: string;
  ply: string;
};

export type SwatchCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  ply: number;
  house: number;
  window: number;
  matched: number;
  wax: number;
  cooling: number;
};

export type PennantLane = "" | "oriflamme" | "gonfalon" | "pennant";

export type PennantTone = "" | "bright" | "even" | "dim" | "hush" | "mist";

export type PennantState = "" | "clear" | "set";

export type PennantShape = "all" | "stitch" | "wide" | "oriflamme" | "gonfalon";

export type PennantReview = "all" | "reviewed" | "fresh";

export type PennantValue = string | { name?: unknown; leads?: unknown; valid?: unknown; invalid?: unknown; [key: string]: unknown } | null | undefined;

export type PennantRow = { id: string; label: string; note: PennantValue };

export type PennantLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "pace", "pin", "unpin", "hold", "resume", "archive", "open", "dye", "tag", "ply", "thread", "wax"] as const;

const DYES = ["graphite", "ivory", "champagne"] as const;

const PACES = ["hush", "glide", "flare"] as const;

const PACE_CYCLE = ["hush", "glide", "flare"] as const;

const PEAK_LOOMS = new Set([3, 5]);

const QUIET_LOOMS = new Set([6]);

const HOUSE = new Set(["GRAPHITE", "CHAMPAGNE"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const SWATCH_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SwatchTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function dyeName(raw: unknown): Exclude<DyeName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (DYES as readonly string[]).includes(text) ? (text as Exclude<DyeName, "blank">) : "";
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
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(swatch: BrocadeSwatch, tray: SwatchTray): boolean {
  if (tray === "held") return swatch.held && !swatch.archived;
  if (tray === "archived") return swatch.archived;
  return !swatch.held && !swatch.archived;
}

/** A blank title is left out. The saved title stays short. */
export function swatchLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function swatchNote(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank weaver stays blank. It is not filled in. */
export function weaverLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A dye is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function dyeOf(raw: unknown): string {
  const name = dyeName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A loom is an integer from 1 through 6.
 * A blank value stays unset. 0 is not a loom.
 * A second digit is not a loom.
 */
export function loomOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-6]$/.test(text)) return null;
  return Number(text);
}

/** A thread is 6, 18, or 36. A blank value stays unset. A leading zero is not a thread. */
export function threadOf(raw: unknown): 6 | 18 | 36 | null {
  if (raw === 6 || raw === "6") return 6;
  if (raw === 18 || raw === "18") return 18;
  if (raw === 36 || raw === "36") return 36;
  return null;
}

/** Ply is 2, 4, or 6. Anything else is not a ply. 2 is the resting ply. */
export function plyOf(raw: unknown): 2 | 4 | 6 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 6 || raw === "6") return 6;
  return null;
}

export function loomBand(loom: unknown): "blank" | "early" | "mid" | "late" {
  const value = loomOf(loom);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 4) return "mid";
  return "late";
}

/** Peak looms are 3 and 5. An unset loom is not a peak loom. */
export function peakLoom(loom: unknown): boolean {
  const value = loomOf(loom);
  return value !== null && PEAK_LOOMS.has(value);
}

/** The quiet loom is 6. A peak loom is not quiet. An unset loom is not quiet. */
export function quietLoom(loom: unknown): boolean {
  const value = loomOf(loom);
  return value !== null && QUIET_LOOMS.has(value);
}

/**
 * How far a loom sits behind the desk loom.
 * A positive gap means the swatch is behind. A negative gap means it is ahead.
 * A gap of zero means the same loom. An unset loom has no gap. Looms do not wrap.
 */
export function loomGap(loom: unknown, desk: unknown): number | null {
  const from = loomOf(loom);
  const at = loomOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** GRAPHITE and CHAMPAGNE are house dyes. IVORY is a guest dye. A blank dye is not a house dye. */
export function houseDye(dye: unknown): boolean {
  return HOUSE.has(dyeOf(dye));
}

export function clothDensity(raw: unknown): SwatchDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function swatchSort(raw: unknown): SwatchSort {
  return raw === "weaver" ? "weaver" : "loom";
}

function readOne(raw: unknown): BrocadeSwatch | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = swatchLine(row.title);
  if (!id || !title) return null;
  const ply = plyOf(row.ply);
  return {
    id,
    title,
    note: swatchNote(row.note),
    weaver: weaverLabel(row.weaver),
    loom: loomOf(row.loom),
    dye: dyeOf(row.dye),
    pace: paceName(row.pace),
    thread: threadOf(row.thread),
    ply: ply === null ? 2 : ply,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    wax: row.wax === true,
    audit: auditCode(row.audit),
  };
}

export function readSwatches(raw: unknown): BrocadeSwatch[] {
  if (!Array.isArray(raw)) return [];
  const out: BrocadeSwatch[] = [];
  for (const item of raw) {
    const swatch = readOne(item);
    if (!swatch || out.some((row) => row.id === swatch.id || row.title === swatch.title)) continue;
    out.push(swatch);
  }
  return out.slice(0, SWATCH_CAP);
}

export function addSwatch(
  swatches: readonly BrocadeSwatch[],
  swatch: {
    id: string;
    title: string;
    note?: string;
    weaver?: string;
    loom?: unknown;
    dye?: string;
    pace?: string;
    thread?: unknown;
    ply?: unknown;
    tags?: unknown;
  },
): BrocadeSwatch[] {
  const current = readSwatches(swatches);
  const id = String(swatch.id || "").trim();
  const title = swatchLine(swatch.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const ply = plyOf(swatch.ply);
  const next: BrocadeSwatch = {
    id,
    title,
    note: swatchNote(swatch.note),
    weaver: weaverLabel(swatch.weaver),
    loom: loomOf(swatch.loom),
    dye: dyeOf(swatch.dye),
    pace: paceName(swatch.pace),
    thread: threadOf(swatch.thread),
    ply: ply === null ? 2 : ply,
    tags: tagsOf(swatch.tags),
    pinned: false,
    held: false,
    archived: false,
    wax: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SWATCH_CAP);
}

/** A blank pace becomes hush, hush becomes glide, glide becomes flare, and flare returns to hush. */
export function cyclePace(swatches: readonly BrocadeSwatch[], id: string): BrocadeSwatch[] {
  return readSwatches(swatches).map((swatch) => {
    if (swatch.id !== id) return swatch;
    const at = PACE_CYCLE.indexOf(swatch.pace as (typeof PACE_CYCLE)[number]);
    const next = at < 0 ? PACE_CYCLE[0] : PACE_CYCLE[(at + 1) % PACE_CYCLE.length];
    if (!next || next === swatch.pace) return swatch;
    return { ...swatch, pace: next, audit: "pace" };
  });
}

/** A blank title is left as it is. */
export function editSwatch(swatches: readonly BrocadeSwatch[], id: string, title: unknown): BrocadeSwatch[] {
  const next = swatchLine(title);
  if (!next) return readSwatches(swatches);
  const current = readSwatches(swatches);
  if (current.some((swatch) => swatch.id !== id && swatch.title === next)) return current;
  return current.map((swatch) => (swatch.id === id && swatch.title !== next ? { ...swatch, title: next, audit: "edit" } : swatch));
}

export function editSwatchNote(swatches: readonly BrocadeSwatch[], id: string, note: unknown): BrocadeSwatch[] {
  const next = swatchNote(note);
  return readSwatches(swatches).map((swatch) => (swatch.id === id && swatch.note !== next ? { ...swatch, note: next, audit: "note" } : swatch));
}

export function addSwatchTag(swatches: readonly BrocadeSwatch[], id: string, tag: unknown): BrocadeSwatch[] {
  const next = tagsOf(tag);
  if (!next.length) return readSwatches(swatches);
  return readSwatches(swatches).map((swatch) => {
    if (swatch.id !== id) return swatch;
    const tags = tagsOf([...swatch.tags, ...next]);
    if (tags.join() === swatch.tags.join()) return swatch;
    return { ...swatch, tags, audit: "tag" };
  });
}

export function setSwatchPly(swatches: readonly BrocadeSwatch[], id: string, ply: unknown): BrocadeSwatch[] {
  const next = plyOf(ply);
  if (next === null) return readSwatches(swatches);
  return readSwatches(swatches).map((swatch) => (swatch.id === id && swatch.ply !== next ? { ...swatch, ply: next, audit: "ply" } : swatch));
}

/** Snooze lengthens the thread from blank to 6, from 6 to 18, and from 18 to 36. 36 stays. */
export function snoozeSwatch(swatches: readonly BrocadeSwatch[], id: string): BrocadeSwatch[] {
  return readSwatches(swatches).map((swatch) => {
    if (swatch.id !== id) return swatch;
    const next = swatch.thread === null ? 6 : swatch.thread === 6 ? 18 : swatch.thread === 18 ? 36 : null;
    if (next === null) return swatch;
    return { ...swatch, thread: next, audit: "thread" };
  });
}

export function setSwatchPin(swatches: readonly BrocadeSwatch[], id: string, pinned: boolean): BrocadeSwatch[] {
  return readSwatches(swatches).map((swatch) => (swatch.id === id && swatch.pinned !== pinned ? { ...swatch, pinned, audit: pinned ? "pin" : "unpin" } : swatch));
}

export function pinFocusedSwatch(swatches: readonly BrocadeSwatch[], shownIds: readonly string[], index: number): BrocadeSwatch[] {
  const id = shownIds[index];
  if (!id) return readSwatches(swatches);
  const swatch = readSwatches(swatches).find((item) => item.id === id);
  if (!swatch) return readSwatches(swatches);
  return setSwatchPin(swatches, id, !swatch.pinned);
}

export function snoozeFocusedSwatch(swatches: readonly BrocadeSwatch[], shownIds: readonly string[], index: number): BrocadeSwatch[] {
  const id = shownIds[index];
  return id ? snoozeSwatch(swatches, id) : readSwatches(swatches);
}

export function holdFocusedSwatch(swatches: readonly BrocadeSwatch[], shownIds: readonly string[], index: number): BrocadeSwatch[] {
  const id = shownIds[index];
  if (!id) return readSwatches(swatches);
  const swatch = readSwatches(swatches).find((item) => item.id === id);
  if (!swatch || swatch.archived) return readSwatches(swatches);
  return setSwatchHold(swatches, id, !swatch.held);
}

export function paceFocusedSwatch(swatches: readonly BrocadeSwatch[], shownIds: readonly string[], index: number): BrocadeSwatch[] {
  const id = shownIds[index];
  return id ? cyclePace(swatches, id) : readSwatches(swatches);
}

export function waxFocusedSwatch(swatches: readonly BrocadeSwatch[], shownIds: readonly string[], index: number): BrocadeSwatch[] {
  const id = shownIds[index];
  if (!id) return readSwatches(swatches);
  const swatch = readSwatches(swatches).find((item) => item.id === id);
  if (!swatch) return readSwatches(swatches);
  return setSwatchWax(swatches, id, !swatch.wax);
}

export function setSwatchHold(swatches: readonly BrocadeSwatch[], id: string, held: boolean): BrocadeSwatch[] {
  return readSwatches(swatches).map((swatch) => (swatch.id === id && !swatch.archived && swatch.held !== held ? { ...swatch, held, audit: held ? "hold" : "resume" } : swatch));
}

export function setSwatchArchive(swatches: readonly BrocadeSwatch[], id: string, archived: boolean): BrocadeSwatch[] {
  return readSwatches(swatches).map((swatch) => (swatch.id === id && swatch.archived !== archived ? { ...swatch, archived, held: archived ? false : swatch.held, audit: archived ? "archive" : "open" } : swatch));
}

export function setSwatchWax(swatches: readonly BrocadeSwatch[], id: string, wax: boolean): BrocadeSwatch[] {
  return readSwatches(swatches).map((swatch) => (swatch.id === id && swatch.wax !== wax ? { ...swatch, wax, audit: "wax" } : swatch));
}

export function bulkSwatchDye(swatches: readonly BrocadeSwatch[], ids: readonly string[], dye: unknown): BrocadeSwatch[] {
  const next = dyeOf(dye);
  if (!next) return readSwatches(swatches);
  const want = new Set(ids);
  return readSwatches(swatches).map((swatch) => (want.has(swatch.id) && swatch.dye !== next ? { ...swatch, dye: next, audit: "dye" } : swatch));
}

export function bulkSwatchPin(swatches: readonly BrocadeSwatch[], ids: readonly string[], pinned: boolean): BrocadeSwatch[] {
  const want = new Set(ids);
  return readSwatches(swatches).map((swatch) => (want.has(swatch.id) && swatch.pinned !== pinned ? { ...swatch, pinned, audit: pinned ? "pin" : "unpin" } : swatch));
}

export function bulkSwatchArchive(swatches: readonly BrocadeSwatch[], ids: readonly string[], archived: boolean): BrocadeSwatch[] {
  const want = new Set(ids);
  return readSwatches(swatches).map((swatch) => (want.has(swatch.id) && swatch.archived !== archived ? { ...swatch, archived, held: archived ? false : swatch.held, audit: archived ? "archive" : "open" } : swatch));
}

export function bulkSwatchPace(swatches: readonly BrocadeSwatch[], ids: readonly string[], pace: unknown): BrocadeSwatch[] {
  const next = paceName(pace);
  if (!next) return readSwatches(swatches);
  const want = new Set(ids);
  return readSwatches(swatches).map((swatch) => (want.has(swatch.id) && swatch.pace !== next ? { ...swatch, pace: next, audit: "pace" } : swatch));
}

export function bulkSwatchTag(swatches: readonly BrocadeSwatch[], ids: readonly string[], tag: unknown): BrocadeSwatch[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addSwatchTag(rows, id, tag) : rows), readSwatches(swatches));
}

export function resetSwatches(): BrocadeSwatch[] {
  return [];
}

/** An open swatch whose loom sits more than three looms behind the desk. A raised ply, a hold, or an archive is not late. */
export function lateSwatch(swatch: BrocadeSwatch, desk: unknown): boolean {
  const gap = loomGap(swatch.loom, desk);
  return inTray(swatch, "open") && swatch.ply === 2 && gap !== null && gap > 3;
}

/** An open swatch with a thread of 6 is due now. A raised ply, a hold, or an archive is not. */
export function soonSwatch(swatch: BrocadeSwatch): boolean {
  return inTray(swatch, "open") && swatch.ply === 2 && swatch.thread === 6;
}

/** An open resting swatch on a flare pace whose loom is 6. That quiet flare is cooling. */
export function coolingSwatch(swatch: BrocadeSwatch): boolean {
  return inTray(swatch, "open") && swatch.ply === 2 && swatch.pace === "flare" && swatch.loom === 6;
}

/** Open swatches that are late or due now. A raised swatch stays off the reminder list. */
export function reminderSwatches(swatches: readonly BrocadeSwatch[], desk: unknown): BrocadeSwatch[] {
  return readSwatches(swatches).filter((swatch) => lateSwatch(swatch, desk) || soonSwatch(swatch));
}

export function coolingSwatches(swatches: readonly BrocadeSwatch[]): BrocadeSwatch[] {
  return readSwatches(swatches).filter((swatch) => coolingSwatch(swatch));
}

/** Open swatches whose loom sits within three looms of the desk. A raised ply, a hold, or an archive stays out. */
export function windowSwatches(swatches: readonly BrocadeSwatch[], desk: unknown): BrocadeSwatch[] {
  return readSwatches(swatches).filter((swatch) => {
    const gap = loomGap(swatch.loom, desk);
    return inTray(swatch, "open") && swatch.ply === 2 && gap !== null && gap >= -3 && gap <= 3;
  });
}

export function matchedSwatches(swatches: readonly BrocadeSwatch[], desk: unknown): number {
  const at = loomOf(desk);
  if (at === null) return 0;
  return readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.ply === 2 && swatch.loom === at).length;
}

function loomHit(loom: number | null, exact: number | null, pick: LoomPick | null): boolean {
  if (exact !== null) return loom === exact;
  if (pick === null) return true;
  if (pick === "blank") return loom === null;
  if (pick === "peak") return peakLoom(loom);
  if (pick === "quiet") return quietLoom(loom);
  return loomBand(loom) === pick;
}

/** Search matches the title, the note, the weaver, and the tags. */
export function visibleSwatches(
  swatches: readonly BrocadeSwatch[],
  tray: SwatchTray,
  query: string,
  weaver: string | null,
  dye: string | null,
  pace: string | null,
  exact: number | null,
  pick: LoomPick | null,
  thread: number | "blank" | null,
  ply: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): BrocadeSwatch[] {
  const text = query.trim().toLowerCase();
  return readSwatches(swatches).filter((swatch) => {
    if (!inTray(swatch, tray)) return false;
    if (text) {
      const hay = `${swatch.title} ${swatch.note} ${swatch.weaver} ${swatch.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (weaver !== null && swatch.weaver !== weaver) return false;
    if (dye === "blank" ? Boolean(swatch.dye) : dye && swatch.dye !== dye) return false;
    if (pace === "blank" ? Boolean(swatch.pace) : pace && swatch.pace !== pace) return false;
    if (!loomHit(swatch.loom, exact, pick)) return false;
    if (thread === "blank" ? swatch.thread !== null : thread !== null && swatch.thread !== thread) return false;
    if (ply === "blank" ? swatch.ply !== 2 : ply !== null && swatch.ply !== ply) return false;
    if (flareOnly && swatch.pace !== "flare") return false;
    if (peakOnly && !peakLoom(swatch.loom)) return false;
    if (houseOnly && !houseDye(swatch.dye)) return false;
    if (quietOnly && !quietLoom(swatch.loom)) return false;
    if (restingOnly && swatch.ply !== 2) return false;
    return true;
  });
}

export function sortSwatches(swatches: readonly BrocadeSwatch[], mode: SwatchSort): BrocadeSwatch[] {
  const rows = swatches.slice();
  if (mode === "weaver") return rows.sort((a, b) => a.weaver.localeCompare(b.weaver) || (a.loom ?? 99) - (b.loom ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.loom ?? 99) - (b.loom ?? 99) || a.title.localeCompare(b.title));
}

export function swatchBook(swatches: readonly BrocadeSwatch[], query: string): BrocadeSwatch[] {
  const text = query.trim().toLowerCase();
  return sortSwatches(
    readSwatches(swatches).filter((swatch) => swatch.loom !== null && (!text || swatch.title.toLowerCase().includes(text))),
    "loom",
  );
}

export function swatchCounts(swatches: readonly BrocadeSwatch[], desk: unknown): SwatchCounts {
  const rows = readSwatches(swatches);
  return {
    open: rows.filter((swatch) => inTray(swatch, "open")).length,
    held: rows.filter((swatch) => inTray(swatch, "held")).length,
    archived: rows.filter((swatch) => inTray(swatch, "archived")).length,
    pinned: rows.filter((swatch) => swatch.pinned).length,
    peak: rows.filter((swatch) => inTray(swatch, "open") && swatch.ply === 2 && peakLoom(swatch.loom)).length,
    late: rows.filter((swatch) => lateSwatch(swatch, desk)).length,
    soon: rows.filter((swatch) => soonSwatch(swatch)).length,
    ply: rows.filter((swatch) => inTray(swatch, "open") && swatch.ply > 2).length,
    house: rows.filter((swatch) => inTray(swatch, "open") && houseDye(swatch.dye)).length,
    window: windowSwatches(rows, desk).length,
    matched: matchedSwatches(rows, desk),
    wax: rows.filter((swatch) => swatch.wax).length,
    cooling: rows.filter((swatch) => coolingSwatch(swatch)).length,
  };
}

export function swatchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open swatches as a share of every open swatch. */
export function lateSwatchShare(swatches: readonly BrocadeSwatch[], desk: unknown): number {
  const rows = readSwatches(swatches).filter((swatch) => inTray(swatch, "open"));
  return swatchShare(rows.filter((swatch) => lateSwatch(swatch, desk)).length, rows.length);
}

export function usedLooms(swatches: readonly BrocadeSwatch[]): number {
  return new Set(readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.loom !== null).map((swatch) => swatch.loom)).size;
}

/** Open swatches that share a loom. */
export function clashLoomCount(swatches: readonly BrocadeSwatch[]): number {
  const open = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.loom !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].loom === open[j].loom) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open swatches that share a thread. */
export function threadClashCount(swatches: readonly BrocadeSwatch[]): number {
  const open = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.thread !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].thread === open[j].thread) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open swatches whose looms sit exactly three looms apart. */
export function adjacentSwatchCount(swatches: readonly BrocadeSwatch[]): number {
  const open = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.loom !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (Math.abs((open[i].loom || 0) - (open[j].loom || 0)) === 3) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/**
 * The dye with the fewest open swatches.
 * A tie keeps GRAPHITE, then CHAMPAGNE, then IVORY.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestDye(swatches: readonly BrocadeSwatch[]): "GRAPHITE" | "CHAMPAGNE" | "IVORY" {
  const rows = readSwatches(swatches).filter((swatch) => inTray(swatch, "open"));
  const order = ["GRAPHITE", "CHAMPAGNE", "IVORY"] as const;
  let best: "GRAPHITE" | "CHAMPAGNE" | "IVORY" = "GRAPHITE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const dye of order) {
    const count = rows.filter((swatch) => swatch.dye === dye).length;
    if (count < bestCount) {
      best = dye;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The thread with the fewest open swatches.
 * A tie keeps 18, then 6, then 36.
 * An empty desk still suggests 18.
 */
export function suggestThread(swatches: readonly BrocadeSwatch[]): 6 | 18 | 36 {
  const rows = readSwatches(swatches).filter((swatch) => inTray(swatch, "open"));
  const order = [18, 6, 36] as const;
  let best: 6 | 18 | 36 = 18;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const thread of order) {
    const count = rows.filter((swatch) => swatch.thread === thread).length;
    if (count < bestCount) {
      best = thread;
      bestCount = count;
    }
  }
  return best;
}

/** The newest weaver already written on a swatch. A blank weaver is skipped. */
export function suggestWeaver(swatches: readonly BrocadeSwatch[]): string {
  const found = readSwatches(swatches).find((swatch) => swatch.weaver);
  return found ? found.weaver : "";
}

/**
 * The weaver carrying the fewest open swatches.
 * A tie keeps the earlier name on the roster. A blank weaver is not a load.
 * An empty roster falls back to the newest weaver.
 */
export function fairWeaver(swatches: readonly BrocadeSwatch[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = weaverLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestWeaver(swatches);
  const open = readSwatches(swatches).filter((swatch) => inTray(swatch, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((swatch) => swatch.weaver === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The weaver with the most open swatches. A tie keeps the name that sorts later. */
export function busiestWeaver(swatches: readonly BrocadeSwatch[]): string {
  const rows = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.weaver);
  const names: string[] = [];
  for (const swatch of rows) if (!names.includes(swatch.weaver)) names.push(swatch.weaver);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((swatch) => swatch.weaver === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function swatchWeavers(swatches: readonly BrocadeSwatch[]): string[] {
  const out: string[] = [];
  for (const swatch of readSwatches(swatches)) {
    if (swatch.weaver && !out.includes(swatch.weaver)) out.push(swatch.weaver);
  }
  return out;
}

export function swatchDyes(swatches: readonly BrocadeSwatch[]): string[] {
  const out: string[] = [];
  for (const swatch of readSwatches(swatches)) {
    if (swatch.dye && !out.includes(swatch.dye)) out.push(swatch.dye);
  }
  return out;
}

/** Open swatches whose weaver also watches another open swatch on a different loom. */
export function pairWeaverCount(swatches: readonly BrocadeSwatch[]): number {
  const open = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.weaver && swatch.loom !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].weaver === open[j].weaver && open[i].loom !== open[j].loom) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open swatches that share a dye on different looms. */
export function sharedDyeCount(swatches: readonly BrocadeSwatch[]): number {
  const open = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.dye && swatch.loom !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].dye === open[j].dye && open[i].loom !== open[j].loom) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The ply of open swatches. The resting ply of 2 still counts. */
export function plyLoad(swatches: readonly BrocadeSwatch[]): number {
  return readSwatches(swatches).filter((swatch) => inTray(swatch, "open")).reduce((sum, swatch) => sum + swatch.ply, 0);
}

/** Open swatches that are both the quiet loom and a house dye. */
export function quietSalonCount(swatches: readonly BrocadeSwatch[]): number {
  return readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && quietLoom(swatch.loom) && houseDye(swatch.dye)).length;
}

/** Open swatches whose pace is flare. */
export function flareLoad(swatches: readonly BrocadeSwatch[]): number {
  return readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.pace === "flare").length;
}

export function loomWidth(swatches: readonly BrocadeSwatch[]): number {
  const looms = readSwatches(swatches).filter((swatch) => inTray(swatch, "open") && swatch.loom !== null).map((swatch) => swatch.loom as number);
  if (!looms.length) return 0;
  return Math.max(...looms) - Math.min(...looms);
}

/** The next open swatch whose loom sits ahead of the desk. An unset desk has no next swatch. */
export function nextSwatch(swatches: readonly BrocadeSwatch[], desk: unknown): string {
  const at = loomOf(desk);
  if (at === null) return "";
  const rows = readSwatches(swatches)
    .filter((swatch) => inTray(swatch, "open") && swatch.ply === 2 && swatch.loom !== null && (swatch.loom as number) > at)
    .sort((a, b) => (a.loom || 0) - (b.loom || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveSwatchFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function swatchCopy(swatch: BrocadeSwatch, desk: unknown): string {
  const gap = loomGap(swatch.loom, desk);
  return [swatch.title, swatch.weaver, swatch.loom ?? "", swatch.dye, swatch.pace, swatch.thread ?? "", swatch.ply, swatch.tags.join(" "), swatch.wax ? "1" : "0", swatch.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the swatches saved in this browser. The gap and the late mark use the loom you pass. */
export function swatchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,weaver,loom,dye,pace,thread,ply,tags,pinned,held,archived,wax,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readSwatches(raw);
  const windowIds = new Set(windowSwatches(rows, desk).map((swatch) => swatch.id));
  const at = loomOf(desk);
  for (const swatch of rows) {
    const gap = loomGap(swatch.loom, desk);
    lines.push([
      swatch.title,
      swatch.weaver,
      swatch.loom === null ? "" : String(swatch.loom),
      swatch.dye,
      swatch.pace,
      swatch.thread === null ? "" : String(swatch.thread),
      String(swatch.ply),
      swatch.tags.join(" "),
      swatch.pinned ? "1" : "0",
      swatch.held ? "1" : "0",
      swatch.archived ? "1" : "0",
      swatch.wax ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSwatch(swatch, desk) ? "1" : "0",
      soonSwatch(swatch) ? "1" : "0",
      houseDye(swatch.dye) ? "1" : "0",
      windowIds.has(swatch.id) ? "1" : "0",
      at !== null && swatch.loom === at && swatch.ply === 2 && inTray(swatch, "open") ? "1" : "0",
      coolingSwatch(swatch) ? "1" : "0",
      swatch.note,
      swatch.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeWeaver(raw: string, weavers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return weavers.includes(raw) ? raw : "all";
}

export function activeDye(raw: string, dyes: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = dyeOf(raw);
  return name && dyes.map((item) => item.toUpperCase()).includes(name) ? name : dyes.includes(raw) ? raw : "all";
}

export function activePace(raw: string, paces: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return paces.includes(raw) ? raw : "all";
}

export function activeLoom(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return loomOf(raw) === null ? "all" : raw;
}

export function activeThread(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return threadOf(raw) === null ? "all" : raw;
}

export function activePly(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return plyOf(raw) === null ? "all" : raw;
}

export function weaverArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function dyeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return dyeOf(filter) || null;
}

export function paceArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function loomArg(filter: string): { exact: number | null; pick: LoomPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: loomOf(filter), pick: null };
}

export function threadArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return threadOf(filter);
}

export function plyArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return plyOf(filter);
}

function readView(raw: unknown): SwatchView | null {
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
    weaver: clip(row.weaver, 16),
    dye: clip(row.dye, 12),
    pace: clip(row.pace, 8),
    loom: clip(row.loom, 8),
    thread: clip(row.thread, 8),
    ply: clip(row.ply, 8),
  };
}

export function readSwatchViews(raw: unknown): SwatchView[] {
  if (!Array.isArray(raw)) return [];
  const out: SwatchView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSwatchView(views: readonly SwatchView[], view: SwatchView): SwatchView[] {
  const current = readSwatchViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropSwatchView(views: readonly SwatchView[], id: string): SwatchView[] {
  return readSwatchViews(views).filter((view) => view.id !== id);
}

function countOk(raw: unknown): boolean {
  return raw === undefined || raw === null || (typeof raw === "number" && Number.isInteger(raw) && raw >= 0);
}

function countOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) return raw;
  return null;
}

function pennantParts(value: PennantValue): { name: string; leads: number | null; valid: number | null; invalid: number | null; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 40), leads: null, valid: null, invalid: null, ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", leads: null, valid: null, invalid: null, ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", leads: null, valid: null, invalid: null, ok: false };
  if (!("name" in value) && !("leads" in value) && !("valid" in value) && !("invalid" in value)) return { name: "", leads: null, valid: null, invalid: null, ok: false };
  const nameRaw = "name" in value ? value.name : "";
  const leadsRaw = "leads" in value ? value.leads : undefined;
  const validRaw = "valid" in value ? value.valid : undefined;
  const invalidRaw = "invalid" in value ? value.invalid : undefined;
  if ((nameRaw != null && typeof nameRaw !== "string") || !countOk(leadsRaw) || !countOk(validRaw) || !countOk(invalidRaw)) {
    return { name: "", leads: null, valid: null, invalid: null, ok: false };
  }
  return {
    name: clip(nameRaw, 40),
    leads: countOf(leadsRaw),
    valid: countOf(validRaw),
    invalid: countOf(invalidRaw),
    ok: true,
  };
}

export function pennantState(value: PennantValue): PennantState {
  const found = pennantParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function pennantCopy(value: PennantValue): string {
  const found = pennantParts(value);
  return found.ok ? found.name : "";
}

/** The mark is the first three letters of the name. */
export function pennantMark(value: PennantValue): string {
  const text = pennantCopy(value).replace(/\s+/g, "").toUpperCase();
  return text ? text.slice(0, 3) : "";
}

/**
 * A digit in the name is a gonfalon. A name that starts with a vowel is an oriflamme.
 * Any other name is a pennant. A digit wins over a vowel.
 */
export function pennantLane(value: PennantValue): PennantLane {
  const found = pennantParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "gonfalon";
  if (/^[aeiou]/i.test(found.name)) return "oriflamme";
  return "pennant";
}

/**
 * More valid than invalid is bright. Fewer valid than invalid is dim. Equal counts are even.
 * A name with a lead count and no valid pair is hush. A name with neither is mist.
 */
export function pennantTone(value: PennantValue): PennantTone {
  const found = pennantParts(value);
  if (!found.ok || !found.name) return "";
  if (found.valid === null && found.invalid === null) return found.leads === null ? "mist" : "hush";
  const valid = found.valid ?? 0;
  const invalid = found.invalid ?? 0;
  if (valid > invalid) return "bright";
  if (valid < invalid) return "dim";
  return "even";
}

export function stitchedPennant(value: PennantValue): boolean {
  return pennantCopy(value).includes("-");
}

export function stitchedPennantCount(rows: readonly PennantRow[]): number {
  return rows.filter((row) => stitchedPennant(row.note)).length;
}

export function widePennant(value: PennantValue): boolean {
  return pennantCopy(value).length >= 8;
}

export function widePennantCount(rows: readonly PennantRow[]): number {
  return rows.filter((row) => widePennant(row.note)).length;
}

export function brightPennantCount(rows: readonly PennantRow[]): number {
  return rows.filter((row) => pennantTone(row.note) === "bright").length;
}

export function oriflammeCount(rows: readonly PennantRow[]): number {
  return rows.filter((row) => pennantLane(row.note) === "oriflamme").length;
}

export function gonfalonCount(rows: readonly PennantRow[]): number {
  return rows.filter((row) => pennantLane(row.note) === "gonfalon").length;
}

export function sharedPennantCount(rows: readonly PennantRow[]): number {
  const marks = rows.map((row) => pennantMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(pennantMark(row.note))).length;
}

export function pennantLanes(rows: readonly PennantRow[]): PennantLaneLine[] {
  const lanes = ["oriflamme", "gonfalon", "pennant"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => pennantLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingPennant(rows: readonly PennantRow[]): string {
  const lines = pennantLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingPennantTone(rows: readonly PennantRow[]): string {
  const tones = ["bright", "even", "dim", "hush", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => pennantTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function pennantShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function pennantStep(value: PennantValue): 0 | 1 | 2 | 3 {
  const text = pennantCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentPennantLanes(rows: readonly PennantRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = pennantState(row.note);
    const lane = state === "set" ? pennantLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenPennants(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "oriflamme" || lane === "gonfalon" || lane === "pennant" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedPennants(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function togglePennant(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePennantReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPennantReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePennantLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visiblePennants(
  rows: readonly PennantRow[],
  lane: PennantLane | "blank" | null,
  tone: PennantTone | null,
  query: string,
  review: PennantReview,
  reviewed: readonly string[],
  shape: PennantShape,
): PennantRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = pennantState(row.note);
    if (!state) return false;
    const token = state === "set" ? pennantLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && pennantTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${pennantCopy(row.note)} ${pennantMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "stitch" && !stitchedPennant(row.note)) return false;
    if (shape === "wide" && !widePennant(row.note)) return false;
    if (shape === "oriflamme" && pennantLane(row.note) !== "oriflamme") return false;
    if (shape === "gonfalon" && pennantLane(row.note) !== "gonfalon") return false;
    return true;
  });
}

export function activePennantLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activePennantTone(raw: string): string {
  return raw === "bright" || raw === "even" || raw === "dim" || raw === "hush" || raw === "mist" || raw === "all" ? raw : "all";
}

export function pennantLaneArg(filter: string): PennantLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "oriflamme" || filter === "gonfalon" || filter === "pennant") return filter;
  return null;
}

export function pennantToneArg(filter: string): PennantTone | null {
  if (filter === "all") return null;
  if (filter === "bright" || filter === "even" || filter === "dim" || filter === "hush" || filter === "mist") return filter;
  return null;
}

export function pennantsCsv(rows: readonly PennantRow[]): string {
  const lines = ["lane,count"];
  for (const line of pennantLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function pennantRowsCsv(rows: readonly PennantRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,stitch,wide,oriflamme,gonfalon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = pennantParts(row.note);
    if (!found.ok) continue;
    lines.push([
      found.name,
      pennantMark(row.note),
      pennantLane(row.note),
      pennantTone(row.note),
      String(pennantStep(row.note)),
      stitchedPennant(row.note) ? "1" : "0",
      widePennant(row.note) ? "1" : "0",
      pennantLane(row.note) === "oriflamme" ? "1" : "0",
      pennantLane(row.note) === "gonfalon" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
