/**
 * Crypt chests for the document desk, and residency seals already stored as isResident on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_crypt_chest (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   bay integer,
 *   timber text not null default '',
 *   seal text not null default '',
 *   span integer,
 *   dust integer not null default 0,
 *   marks text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_residency_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_residency_seal_review (
 *   customer_id text primary key
 * );
 */

export const CRB_KEY = "crmv4-crypt-chest";
export const CRB_VIEW_KEY = "crmv4-crypt-views";
export const CRB_DENSITY_KEY = "crmv4-crypt-density";
export const RSD_KEY = "crmv4-residency-hide";
export const RSD_REVIEW_KEY = "crmv4-residency-review";

export type TimberName = "blank" | "oak" | "ash" | "yew";

export type SealName = "blank" | "wax" | "cord" | "lock";

export type ChestTray = "open" | "held" | "closed";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type ChestDensity = "tall" | "low";

export type ChestSort = "bay" | "clerk";

export type CryptChest = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  bay: number | null;
  timber: string;
  seal: string;
  span: number | null;
  dust: number;
  marks: string[];
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type ChestView = {
  id: string;
  name: string;
  tray: ChestTray;
  query: string;
  clerk: string;
  timber: string;
  seal: string;
  bay: string;
  span: string;
  dust: string;
};

export type ChestCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  dust: number;
  house: number;
  window: number;
  matched: number;
};

const AUDITS = ["save", "edit", "seal", "pin", "unpin", "hold", "lift", "close", "open", "timber", "mark", "dust", "span"] as const;

const TIMBERS = ["oak", "ash", "yew"] as const;

const SEALS = ["wax", "cord", "lock"] as const;

const SEAL_ORDER = ["", "wax", "cord", "lock"] as const;

const PEAK_BAYS = new Set([2, 5]);

const QUIET_BAYS = new Set([6]);

const HOUSE = new Set(["ASH", "YEW"]);

const CHEST_CAP = 7;

const VIEW_CAP = 5;

const MARK_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ChestTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function timberName(raw: unknown): Exclude<TimberName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TIMBERS as readonly string[]).includes(text) ? (text as Exclude<TimberName, "blank">) : "";
}

function sealNameOf(raw: unknown): Exclude<SealName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SEALS as readonly string[]).includes(text) ? (text as Exclude<SealName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function chestLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function chestNote(raw: unknown): string {
  return clip(raw, 42);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 20);
}

/** A timber is OAK, ASH, or YEW. Anything else stays blank. Letters are stored in capitals. */
export function timberOf(raw: unknown): string {
  const name = timberName(raw);
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

/** A span is 6, 12, or 24. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 6 | 12 | 24 | null {
  if (raw === 6 || raw === "6") return 6;
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  const text = clip(raw, 2);
  if (text === "6") return 6;
  if (text === "12") return 12;
  if (text === "24") return 24;
  return null;
}

/** Dust is 0, 3, or 9. Anything else is not dust. 0 clears the dust. */
export function dustOf(raw: unknown): 0 | 3 | 9 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 3 || raw === "3") return 3;
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
 * A positive gap means the chest is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** ASH and YEW are house timbers. OAK is a guest timber. A blank timber is not a house timber. */
export function houseTimber(timber: unknown): boolean {
  return HOUSE.has(timberOf(timber));
}

/** Tall or low. Anything else stays tall. */
export function densityOf(raw: unknown): ChestDensity {
  return raw === "low" ? "low" : "tall";
}

/** Bay or clerk. Anything else stays on the bay. */
export function sortMode(raw: unknown): ChestSort {
  return raw === "clerk" ? "clerk" : "bay";
}

function markOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[g-l]$/.test(text) ? text : "";
}

function marksOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,\s]+/);
  const out: string[] = [];
  for (const part of parts) {
    const mark = markOf(part);
    if (mark && !out.includes(mark)) out.push(mark);
    if (out.length >= MARK_CAP) break;
  }
  return out;
}

function readOne(raw: unknown): CryptChest | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CryptChest>;
  const id = clip(row.id, 24);
  const title = chestLine(row.title);
  if (!id || !title) return null;
  const dust = dustOf(row.dust);
  return {
    id,
    title,
    note: chestNote(row.note),
    clerk: clerkLabel(row.clerk),
    bay: bayOf(row.bay),
    timber: timberOf(row.timber),
    seal: sealNameOf(row.seal),
    span: spanOf(row.span),
    dust: dust === null ? 0 : dust,
    marks: marksOf(row.marks),
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readChests(raw: unknown): CryptChest[] {
  if (!Array.isArray(raw)) return [];
  const out: CryptChest[] = [];
  for (const item of raw) {
    const chest = readOne(item);
    if (!chest || out.some((row) => row.id === chest.id || row.title === chest.title)) continue;
    out.push(chest);
  }
  return out.slice(0, CHEST_CAP);
}

export function addChest(
  chests: readonly CryptChest[],
  chest: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    bay?: unknown;
    timber?: string;
    seal?: string;
    span?: unknown;
    dust?: unknown;
    marks?: unknown;
  },
): CryptChest[] {
  const current = readChests(chests);
  const id = String(chest.id || "").trim();
  const title = chestLine(chest.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const dust = dustOf(chest.dust);
  const next: CryptChest = {
    id,
    title,
    note: chestNote(chest.note),
    clerk: clerkLabel(chest.clerk),
    bay: bayOf(chest.bay),
    timber: timberOf(chest.timber),
    seal: sealNameOf(chest.seal),
    span: spanOf(chest.span),
    dust: dust === null ? 0 : dust,
    marks: marksOf(chest.marks),
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, CHEST_CAP);
}

export function cycleSeal(chests: readonly CryptChest[], id: string): CryptChest[] {
  return readChests(chests).map((chest) => {
    if (chest.id !== id) return chest;
    const at = SEAL_ORDER.indexOf(chest.seal as (typeof SEAL_ORDER)[number]);
    const next = at < 0 || at >= SEALS.length ? SEALS[0] : SEALS[at % SEALS.length];
    if (!next || next === chest.seal) return chest;
    return { ...chest, seal: next, audit: "seal" };
  });
}

/** A blank title is left as it is. */
export function editChest(chests: readonly CryptChest[], id: string, title: unknown): CryptChest[] {
  const next = chestLine(title);
  if (!next) return readChests(chests);
  const current = readChests(chests);
  if (current.some((chest) => chest.id !== id && chest.title === next)) return current;
  return current.map((chest) => (chest.id === id && chest.title !== next ? { ...chest, title: next, audit: "edit" } : chest));
}

/** A blank note is left as it is. */
export function editChestNote(chests: readonly CryptChest[], id: string, note: unknown): CryptChest[] {
  const next = chestNote(note);
  if (!next) return readChests(chests);
  return readChests(chests).map((chest) => (chest.id === id && chest.note !== next ? { ...chest, note: next, audit: "edit" } : chest));
}

/** A mark that is already on the chest, or a fifth mark, is left out. A mark is one letter from g to l. */
export function addChestMark(chests: readonly CryptChest[], id: string, mark: unknown): CryptChest[] {
  const next = markOf(mark);
  if (!next) return readChests(chests);
  return readChests(chests).map((chest) => {
    if (chest.id !== id || chest.marks.includes(next) || chest.marks.length >= MARK_CAP) return chest;
    return { ...chest, marks: [...chest.marks, next], audit: "mark" };
  });
}

/** An unknown dust is left as it is. 0 clears the dust. */
export function setChestDust(chests: readonly CryptChest[], id: string, dust: unknown): CryptChest[] {
  const next = dustOf(dust);
  if (next === null) return readChests(chests);
  return readChests(chests).map((chest) => (chest.id === id && chest.dust !== next ? { ...chest, dust: next, audit: "dust" } : chest));
}

/** A due span becomes 12, a measured span becomes 24, and a long span stays. An unset span becomes 6. */
export function snoozeChest(chests: readonly CryptChest[], id: string): CryptChest[] {
  return readChests(chests).map((chest) => {
    if (chest.id !== id) return chest;
    const next = chest.span === 6 ? 12 : chest.span === 12 ? 24 : chest.span === 24 ? 24 : 6;
    if (next === chest.span) return chest;
    return { ...chest, span: next, audit: "span" };
  });
}

export function setChestPin(chests: readonly CryptChest[], id: string, pinned: boolean): CryptChest[] {
  return readChests(chests).map((chest) => (chest.id === id && chest.pinned !== pinned ? { ...chest, pinned, audit: pinned ? "pin" : "unpin" } : chest));
}

/** P toggles the pin on the focused row of the board currently shown. */
export function pinFocused(chests: readonly CryptChest[], shownIds: readonly string[], index: number): CryptChest[] {
  if (!shownIds.length) return readChests(chests);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readChests(chests).find((chest) => chest.id === id);
  if (!row) return readChests(chests);
  return setChestPin(chests, id, !row.pinned);
}

/** S lengthens the span on the focused chest. */
export function snoozeFocused(chests: readonly CryptChest[], shownIds: readonly string[], index: number): CryptChest[] {
  if (!shownIds.length) return readChests(chests);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  if (!readChests(chests).some((chest) => chest.id === id)) return readChests(chests);
  return snoozeChest(chests, id);
}

/** H toggles the hold on the focused row. */
export function holdFocused(chests: readonly CryptChest[], shownIds: readonly string[], index: number): CryptChest[] {
  if (!shownIds.length) return readChests(chests);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readChests(chests).find((chest) => chest.id === id);
  if (!row) return readChests(chests);
  return setChestHold(chests, id, !row.held);
}

export function setChestHold(chests: readonly CryptChest[], id: string, held: boolean): CryptChest[] {
  return readChests(chests).map((chest) => (chest.id === id && chest.held !== held ? { ...chest, held, audit: held ? "hold" : "lift" } : chest));
}

export function setChestClose(chests: readonly CryptChest[], id: string, closed: boolean): CryptChest[] {
  return readChests(chests).map((chest) => (chest.id === id && chest.closed !== closed ? { ...chest, closed, audit: closed ? "close" : "open" } : chest));
}

export function bulkChestTimber(chests: readonly CryptChest[], ids: readonly string[], timber: unknown): CryptChest[] {
  const next = timberOf(timber);
  if (!next) return readChests(chests);
  const picked = new Set(ids);
  return readChests(chests).map((chest) => (picked.has(chest.id) && chest.timber !== next ? { ...chest, timber: next, audit: "timber" } : chest));
}

export function bulkChestPin(chests: readonly CryptChest[], ids: readonly string[], pinned: boolean): CryptChest[] {
  const picked = new Set(ids);
  return readChests(chests).map((chest) => (picked.has(chest.id) && chest.pinned !== pinned ? { ...chest, pinned, audit: pinned ? "pin" : "unpin" } : chest));
}

export function bulkChestClose(chests: readonly CryptChest[], ids: readonly string[], closed: boolean): CryptChest[] {
  const picked = new Set(ids);
  return readChests(chests).map((chest) => (picked.has(chest.id) && chest.closed !== closed ? { ...chest, closed, audit: closed ? "close" : "open" } : chest));
}

export function bulkChestSeal(chests: readonly CryptChest[], ids: readonly string[], seal: unknown): CryptChest[] {
  const next = sealNameOf(seal);
  if (!next) return readChests(chests);
  const picked = new Set(ids);
  return readChests(chests).map((chest) => (picked.has(chest.id) && chest.seal !== next ? { ...chest, seal: next, audit: "seal" } : chest));
}

export function bulkChestMark(chests: readonly CryptChest[], ids: readonly string[], mark: unknown): CryptChest[] {
  return ids.reduce((rows, id) => addChestMark(rows, id, mark), readChests(chests));
}

export function resetChests(): CryptChest[] {
  return [];
}

function inTray(chest: CryptChest, tray: ChestTray): boolean {
  if (tray === "closed") return chest.closed;
  if (tray === "held") return chest.held && !chest.closed;
  return !chest.held && !chest.closed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** An open chest whose bay sits more than one bay behind the desk. Dust, a hold, or a close is not late. */
export function lateChest(chest: CryptChest, desk: unknown): boolean {
  const gap = bayGap(chest.bay, desk);
  return inTray(chest, "open") && chest.dust === 0 && gap !== null && gap > 1;
}

/** An open chest with a span of 6 is due now. Dust, a hold, or a close is not. */
export function soonChest(chest: CryptChest): boolean {
  return inTray(chest, "open") && chest.dust === 0 && chest.span === 6;
}

/** Open chests that are late or due now. A dusty chest stays off the reminder list. */
export function reminderChests(chests: readonly CryptChest[], desk: unknown): CryptChest[] {
  return readChests(chests).filter((chest) => lateChest(chest, desk) || soonChest(chest));
}

/** Open chests whose bay sits within one bay of the desk. Dust, a hold, or a close stays out. */
export function windowChests(chests: readonly CryptChest[], desk: unknown): CryptChest[] {
  return readChests(chests).filter((chest) => {
    const gap = bayGap(chest.bay, desk);
    return inTray(chest, "open") && chest.dust === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Open dry chests whose bay is the desk bay. */
export function matchedChests(chests: readonly CryptChest[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readChests(chests).filter((chest) => inTray(chest, "open") && chest.dust === 0 && chest.bay === at).length;
}

/** Search matches the title, the note, the clerk, and the marks. */
export function visibleChests(
  chests: readonly CryptChest[],
  tray: ChestTray,
  query: string,
  clerk: string | null,
  timber: string | null,
  seal: string | null,
  exact: number | null,
  pick: BayPick | null,
  span: number | "blank" | null,
  dust: number | "blank" | null,
  lockOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  dryOnly: boolean,
): CryptChest[] {
  const text = query.trim().toLowerCase();
  return readChests(chests).filter((chest) => {
    if (!inTray(chest, tray)) return false;
    if (text) {
      const hay = `${chest.title} ${chest.note} ${chest.clerk} ${chest.marks.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (clerk !== null && chest.clerk !== clerk) return false;
    if (timber === "blank" ? Boolean(chest.timber) : timber && chest.timber !== timber) return false;
    if (seal === "blank" ? Boolean(chest.seal) : seal && chest.seal !== seal) return false;
    if (!bayHit(chest.bay, exact, pick)) return false;
    if (span === "blank" ? chest.span !== null : span !== null && chest.span !== span) return false;
    if (dust === "blank" ? chest.dust !== 0 : dust !== null && chest.dust !== dust) return false;
    if (lockOnly && chest.seal !== "lock") return false;
    if (peakOnly && !peakBay(chest.bay)) return false;
    if (houseOnly && !houseTimber(chest.timber)) return false;
    if (quietOnly && !quietBay(chest.bay)) return false;
    if (dryOnly && chest.dust !== 0) return false;
    return true;
  });
}

export function sortChests(chests: readonly CryptChest[], mode: ChestSort): CryptChest[] {
  const rows = chests.slice();
  if (mode === "clerk") return rows.sort((a, b) => a.clerk.localeCompare(b.clerk) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function chestLedger(chests: readonly CryptChest[], query: string): CryptChest[] {
  const text = query.trim().toLowerCase();
  return sortChests(
    readChests(chests).filter((chest) => chest.bay !== null && (!text || chest.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function chestCounts(chests: readonly CryptChest[], desk: unknown): ChestCounts {
  const rows = readChests(chests);
  return {
    open: rows.filter((chest) => inTray(chest, "open")).length,
    held: rows.filter((chest) => inTray(chest, "held")).length,
    closed: rows.filter((chest) => inTray(chest, "closed")).length,
    pinned: rows.filter((chest) => chest.pinned).length,
    peak: rows.filter((chest) => inTray(chest, "open") && chest.dust === 0 && peakBay(chest.bay)).length,
    late: rows.filter((chest) => lateChest(chest, desk)).length,
    soon: rows.filter((chest) => soonChest(chest)).length,
    dust: rows.filter((chest) => inTray(chest, "open") && chest.dust > 0).length,
    house: rows.filter((chest) => inTray(chest, "open") && houseTimber(chest.timber)).length,
    window: windowChests(rows, desk).length,
    matched: matchedChests(rows, desk),
  };
}

export function chestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open chests as a share of every open chest. */
export function lateShare(chests: readonly CryptChest[], desk: unknown): number {
  const rows = readChests(chests);
  const open = rows.filter((chest) => inTray(chest, "open")).length;
  const late = rows.filter((chest) => lateChest(chest, desk)).length;
  return chestShare(late, open);
}

/** Distinct bays on open chests. */
export function usedBays(chests: readonly CryptChest[]): number {
  const bays = new Set<number>();
  for (const chest of readChests(chests)) {
    if (inTray(chest, "open") && chest.bay !== null) bays.add(chest.bay);
  }
  return bays.size;
}

/** Open chests that share a bay and a timber. A different timber on the same bay is not a clash. */
export function clashBayCount(chests: readonly CryptChest[]): number {
  const groups = new Map<string, number>();
  for (const chest of readChests(chests)) {
    if (!inTray(chest, "open") || chest.bay === null || !chest.timber) continue;
    const key = `${chest.bay}:${chest.timber}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open chests that share a span. An unset span is not a clash. */
export function spanClashCount(chests: readonly CryptChest[]): number {
  const groups = new Map<number, number>();
  for (const chest of readChests(chests)) {
    if (!inTray(chest, "open") || chest.span === null) continue;
    groups.set(chest.span, (groups.get(chest.span) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open chests in the same timber whose bays differ by two.
 * The count is the chests that have at least one neighbor.
 */
export function adjacentChestCount(chests: readonly CryptChest[]): number {
  const open = readChests(chests).filter((chest) => inTray(chest, "open") && chest.bay !== null && chest.timber);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.timber === right.timber && Math.abs((left.bay ?? 0) - (right.bay ?? 0)) === 2) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The timber with the fewest open chests.
 * A tie keeps OAK, then ASH, then YEW.
 * An empty desk still suggests OAK.
 */
export function suggestTimber(chests: readonly CryptChest[]): "OAK" | "ASH" | "YEW" {
  const rows = readChests(chests).filter((chest) => inTray(chest, "open"));
  const order = ["OAK", "ASH", "YEW"] as const;
  let best: "OAK" | "ASH" | "YEW" = "OAK";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const timber of order) {
    const count = rows.filter((chest) => chest.timber === timber).length;
    if (count < bestCount) {
      best = timber;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open chests.
 * A tie keeps 12, then 6, then 24.
 * An empty desk still suggests 12.
 */
export function suggestSpan(chests: readonly CryptChest[]): 6 | 12 | 24 {
  const rows = readChests(chests).filter((chest) => inTray(chest, "open"));
  const order = [12, 6, 24] as const;
  let best: 6 | 12 | 24 = 12;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((chest) => chest.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open clerk. A blank clerk is skipped. An empty desk stays blank. */
export function suggestClerk(chests: readonly CryptChest[]): string {
  const found = readChests(chests).find((chest) => inTray(chest, "open") && chest.clerk);
  return found ? found.clerk : "";
}

/**
 * The clerk carrying the fewest open chests.
 * A tie keeps the earlier name. A blank clerk is not a load.
 * An empty roster falls back to the newest clerk.
 */
export function fairClerk(chests: readonly CryptChest[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = clerkLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestClerk(chests);
  const open = readChests(chests).filter((chest) => inTray(chest, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((chest) => chest.clerk === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The clerk with the most open chests. A tie keeps the newer name on the desk. */
export function busiestClerk(chests: readonly CryptChest[]): string {
  const rows = readChests(chests).filter((chest) => inTray(chest, "open") && chest.clerk);
  const names: string[] = [];
  for (const chest of rows) if (!names.includes(chest.clerk)) names.push(chest.clerk);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((chest) => chest.clerk === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function chestClerks(chests: readonly CryptChest[]): string[] {
  const out: string[] = [];
  for (const chest of readChests(chests)) {
    if (chest.clerk && !out.includes(chest.clerk)) out.push(chest.clerk);
  }
  return out;
}

export function chestTimbers(chests: readonly CryptChest[]): string[] {
  const out: string[] = [];
  for (const chest of readChests(chests)) {
    if (chest.timber && !out.includes(chest.timber)) out.push(chest.timber);
  }
  return out;
}

/** Open chests whose clerk also keeps another open chest on a different bay. */
export function pairClerkCount(chests: readonly CryptChest[]): number {
  const open = readChests(chests).filter((chest) => inTray(chest, "open") && chest.clerk && chest.bay !== null);
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

/** Open chests that share a timber on different bays. */
export function sharedTimberCount(chests: readonly CryptChest[]): number {
  const open = readChests(chests).filter((chest) => inTray(chest, "open") && chest.timber && chest.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].timber === open[j].timber && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The dust weight of open chests. A clear dust adds nothing. */
export function dustLoad(chests: readonly CryptChest[]): number {
  return readChests(chests).filter((chest) => inTray(chest, "open")).reduce((sum, chest) => sum + chest.dust, 0);
}

/** Open chests that are both the quiet bay and a house timber. */
export function quietHouseCount(chests: readonly CryptChest[]): number {
  return readChests(chests).filter((chest) => inTray(chest, "open") && quietBay(chest.bay) && houseTimber(chest.timber)).length;
}

/** Open chests whose seal is lock. */
export function lockLoad(chests: readonly CryptChest[]): number {
  return readChests(chests).filter((chest) => inTray(chest, "open") && chest.seal === "lock").length;
}

/** The span from the lowest open bay to the highest. Fewer than two bays spans nothing. */
export function baySpan(chests: readonly CryptChest[]): number {
  const bays = readChests(chests).filter((chest) => inTray(chest, "open") && chest.bay !== null).map((chest) => chest.bay as number);
  if (bays.length < 2) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/**
 * The next open chest at or after the desk bay.
 * A lock seal, dust, a hold, and a close stay off the list.
 * When every open bay is behind, the earliest bay is next.
 */
export function nextChest(chests: readonly CryptChest[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readChests(chests).filter((chest) => inTray(chest, "open") && chest.bay !== null && chest.seal !== "lock" && chest.dust === 0);
  if (!waiting.length) return "";
  const byBay = (a: CryptChest, b: CryptChest) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((chest) => (chest.bay ?? 0) >= now).sort(byBay);
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

export function chestCopy(chest: CryptChest, desk: unknown): string {
  const gap = bayGap(chest.bay, desk);
  return [chest.title, chest.clerk, chest.bay ?? "", chest.timber, chest.seal, chest.span ?? "", chest.dust, chest.marks.join(" "), chest.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the chests saved in this browser. The gap and the late mark use the bay you pass. */
export function chestsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,bay,timber,seal,span,dust,marks,pinned,held,closed,gap,late,soon,house,window,matched,note,audit"];
  const rows = readChests(raw);
  const windowIds = new Set(windowChests(rows, desk).map((chest) => chest.id));
  const at = bayOf(desk);
  for (const chest of rows) {
    const gap = bayGap(chest.bay, desk);
    lines.push([
      chest.title,
      chest.clerk,
      chest.bay === null ? "" : String(chest.bay),
      chest.timber,
      chest.seal,
      chest.span === null ? "" : String(chest.span),
      String(chest.dust),
      chest.marks.join(" "),
      chest.pinned ? "1" : "0",
      chest.held ? "1" : "0",
      chest.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateChest(chest, desk) ? "1" : "0",
      soonChest(chest) ? "1" : "0",
      houseTimber(chest.timber) ? "1" : "0",
      windowIds.has(chest.id) ? "1" : "0",
      at !== null && chest.bay === at && chest.dust === 0 && inTray(chest, "open") ? "1" : "0",
      chest.note,
      chest.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeClerk(raw: string, clerks: readonly string[]): string {
  if (raw === "blank") return "blank";
  return clerks.includes(raw) ? raw : "all";
}

export function activeTimber(raw: string, timbers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return timberOf(raw) && timbers.includes(timberOf(raw)) ? timberOf(raw) : "all";
}

export function activeSeal(raw: string, seals: readonly string[]): string {
  if (raw === "blank") return "blank";
  const seal = sealNameOf(raw);
  return seal && seals.includes(seal) ? seal : "all";
}

export function activeBay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bay = bayOf(raw);
  return bay === null ? "all" : String(bay);
}

export function activeSpan(raw: string): string {
  if (raw === "blank") return "blank";
  const span = spanOf(raw);
  return span === null ? "all" : String(span);
}

export function activeDust(raw: string): string {
  if (raw === "blank") return "blank";
  const dust = dustOf(raw);
  return dust === null ? "all" : String(dust);
}

export function clerkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function timberArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return timberOf(filter) || null;
}

export function sealArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return sealNameOf(filter) || null;
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

export function dustArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return dustOf(filter);
}

function readView(raw: unknown): ChestView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<ChestView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    clerk: row.clerk === "blank" ? "blank" : clip(row.clerk, 20) || "all",
    timber: row.timber === "blank" || row.timber === "all" ? (row.timber === "blank" ? "blank" : "all") : timberOf(row.timber) || "all",
    seal: row.seal === "blank" || row.seal === "all" ? (row.seal === "blank" ? "blank" : "all") : sealNameOf(row.seal) || "all",
    bay: activeBay(String(row.bay || "all")),
    span: activeSpan(String(row.span || "all")),
    dust: activeDust(String(row.dust || "all")),
  };
}

export function readChestViews(raw: unknown): ChestView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChestView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addChestView(views: readonly ChestView[], view: ChestView): ChestView[] {
  const current = readChestViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropChestView(views: readonly ChestView[], id: string): ChestView[] {
  return readChestViews(views).filter((view) => view.id !== id);
}

export type SealState = "" | "set" | "clear";

export type SealLane = "" | "house" | "court";

export type SealTone = "" | "gilt" | "ivory";

export type SealShape = "all" | "catalog" | "wide" | "gilt";

export type SealValue =
  | boolean
  | string
  | { isResident?: unknown; language?: unknown; address?: unknown; country?: unknown; email?: unknown; phone?: unknown; city?: unknown; desk?: unknown; name?: unknown; username?: unknown; accountType?: unknown; lastBrowser?: unknown }
  | null
  | undefined;

export type SealRow = { id: string; label?: string; note: SealValue };

export type SealLaneLine = { lane: string; count: number };

const SEAL_LANES = ["house", "court"] as const;

const SEAL_TONES = ["gilt", "ivory"] as const;

const SEAL_BLOCK = ["language", "address", "country", "email", "phone", "city", "desk", "name", "username", "accountType", "lastBrowser"] as const;

type ResidentKind = "" | "resident" | "visitor";

function residentKind(raw: unknown): { kind: ResidentKind; explicit: boolean } {
  if (raw === true) return { kind: "resident", explicit: true };
  if (raw === false) return { kind: "visitor", explicit: true };
  if (raw == null) return { kind: "", explicit: true };
  if (typeof raw !== "string") return { kind: "", explicit: false };
  const text = clip(raw, 16).toLowerCase();
  if (!text) return { kind: "", explicit: true };
  if (text === "1" || text === "true" || text === "yes" || text === "resident") return { kind: "resident", explicit: true };
  if (text === "0" || text === "false" || text === "no" || text === "visitor") return { kind: "visitor", explicit: true };
  return { kind: "", explicit: false };
}

function sealText(value: SealValue): { kind: ResidentKind; explicit: boolean } {
  if (typeof value === "boolean" || typeof value === "string" || value == null) return residentKind(value);
  if (typeof value !== "object" || Array.isArray(value)) return { kind: "", explicit: false };
  if (SEAL_BLOCK.some((key) => key in value)) return { kind: "", explicit: false };
  if (!("isResident" in value)) return { kind: "", explicit: false };
  return residentKind(value.isResident);
}

export function sealState(value: SealValue): SealState {
  const found = sealText(value);
  if (!found.explicit) return "";
  return found.kind ? "set" : "clear";
}

export function sealCopy(value: SealValue): string {
  const found = sealText(value);
  return found.explicit ? found.kind : "";
}

/** A resident seal is RES. A visitor seal is VIS. An unset flag stays blank. */
export function sealOf(value: SealValue): string {
  const kind = sealCopy(value);
  if (kind === "resident") return "RES";
  if (kind === "visitor") return "VIS";
  return "";
}

/** A resident sits in the house. A visitor sits in the court. */
export function sealLane(value: SealValue): SealLane {
  const kind = sealCopy(value);
  if (kind === "resident") return "house";
  if (kind === "visitor") return "court";
  return "";
}

/** Residents are gilt. Visitors are ivory. */
export function sealTone(value: SealValue): SealTone {
  const kind = sealCopy(value);
  if (kind === "resident") return "gilt";
  if (kind === "visitor") return "ivory";
  return "";
}

/** Only a resident belongs to the house catalog. */
export function catalogSeal(value: SealValue): boolean {
  return sealCopy(value) === "resident";
}

export function catalogSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => catalogSeal(row.note)).length;
}

/** The resident word is longer than seven letters. The visitor word is not. */
export function wideSeal(value: SealValue): boolean {
  return sealCopy(value).length > 7;
}

export function wideSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => wideSeal(row.note)).length;
}

export function giltSealCount(rows: readonly SealRow[]): number {
  return rows.filter((row) => sealTone(row.note) === "gilt").length;
}

/** Customers whose seal monogram is shared with at least one other customer. */
export function sharedSealCount(rows: readonly SealRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = sealOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function sealLanes(rows: readonly SealRow[]): SealLaneLine[] {
  return SEAL_LANES.map((lane) => ({ lane, count: rows.filter((row) => sealLane(row.note) === lane).length }));
}

/** The lane with the most set seals. A tie keeps house, then court. */
export function leadingSeal(rows: readonly SealRow[]): string {
  const lines = sealLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  const lead = lines.slice().sort((a, b) => b.count - a.count || SEAL_LANES.indexOf(a.lane as (typeof SEAL_LANES)[number]) - SEAL_LANES.indexOf(b.lane as (typeof SEAL_LANES)[number]))[0];
  return lead ? lead.lane : "";
}

/** The tone with the most set seals. A tie keeps gilt, then ivory. */
export function leadingSealTone(rows: readonly SealRow[]): string {
  const counts = SEAL_TONES.map((tone) => ({ tone, count: rows.filter((row) => sealTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  const lead = live.slice().sort((a, b) => b.count - a.count || SEAL_TONES.indexOf(a.tone) - SEAL_TONES.indexOf(b.tone))[0];
  return lead ? lead.tone : "";
}

export function sealShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentSeals(rows: readonly SealRow[]): string[] {
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
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = String(item);
    if (allow.has(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
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
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((lane) => !skip.has(lane));
}

export function visibleSealCustomers(
  rows: readonly SealRow[],
  lane: SealLane | "blank" | null,
  tone: SealTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: SealShape,
): SealRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = sealState(row.note);
    const mark = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && mark !== lane) return false;
    if (tone && sealTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogSeal(row.note)) return false;
    if (shape === "wide" && !wideSeal(row.note)) return false;
    if (shape === "gilt" && sealTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${sealCopy(row.note)} ${sealOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeSealLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeSealTone(raw: string): string {
  return raw === "gilt" || raw === "ivory" ? raw : "all";
}

export function sealLaneArg(filter: string): SealLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "house" || filter === "court") return filter;
  return null;
}

export function sealToneArg(filter: string): SealTone | null {
  if (filter === "gilt" || filter === "ivory") return filter;
  return null;
}

export function sealsCsv(rows: readonly SealRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of sealLanes(rows)) lines.push(`lane,${line.lane},${line.count}`);
  lines.push(`catalog,catalog,${catalogSealCount(rows)}`);
  lines.push(`wide,wide,${wideSealCount(rows)}`);
  lines.push(`tone,gilt,${giltSealCount(rows)}`);
  lines.push(`tone,ivory,${rows.filter((row) => sealTone(row.note) === "ivory").length}`);
  lines.push(`shared,shared,${sharedSealCount(rows)}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,seal,lane,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = sealState(row.note);
    const lane = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      sealOf(row.note),
      lane,
      state === "set" ? sealTone(row.note) : "",
      catalogSeal(row.note) ? "1" : "0",
      wideSeal(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
