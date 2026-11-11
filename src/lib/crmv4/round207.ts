/**
 * Gallery mounts for the marketing desk, and device plates already stored as lastDevice on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_gallery_mount (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   steward text not null default '',
 *   bay integer,
 *   cloth text not null default '',
 *   glaze text not null default '',
 *   cord integer,
 *   stay integer,
 *   tags text not null default '',
 *   gilt integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_device_plate_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_device_plate_review (
 *   customer_id text primary key
 * );
 */

export const GLM_KEY = "crmv4-gallery-mount";
export const GLM_VIEW_KEY = "crmv4-gallery-views";
export const GLM_DENSITY_KEY = "crmv4-gallery-density";
export const DVP_KEY = "crmv4-device-hide";
export const DVP_REVIEW_KEY = "crmv4-device-review";

export type ClothName = "blank" | "champagne" | "ivory" | "graphite";

export type GlazeName = "blank" | "matte" | "gloss" | "satin";

export type MountTray = "open" | "held" | "closed";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type MountDensity = "roomy" | "tight";

export type MountSort = "bay" | "steward";

export type GalleryMount = {
  id: string;
  title: string;
  note: string;
  steward: string;
  bay: number | null;
  cloth: string;
  glaze: string;
  cord: number | null;
  stay: number | null;
  tags: string[];
  gilt: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type MountView = {
  id: string;
  name: string;
  tray: MountTray;
  query: string;
  steward: string;
  cloth: string;
  glaze: string;
  bay: string;
  cord: string;
  stay: string;
};

export type MountCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  gilt: number;
  house: number;
  window: number;
};

const AUDITS = ["save", "edit", "glaze", "pin", "unpin", "hold", "lift", "close", "open", "cloth", "tag", "gilt", "bulk"] as const;

const ALCOVES = ["champagne", "ivory", "graphite"] as const;

const FLAMES = ["matte", "gloss", "satin"] as const;

const FLAME_ORDER = ["", "matte", "gloss", "satin"] as const;

const PEAK_BAYS = new Set([3, 6]);

const QUIET_BAYS = new Set([2, 8]);

const HOUSE = new Set(["CHAMPAGNE", "IVORY"]);

const MOUNT_CAP = 7;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): MountTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 10).toLowerCase();
  return (ALCOVES as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function glazeNameOf(raw: unknown): Exclude<GlazeName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FLAMES as readonly string[]).includes(text) ? (text as Exclude<GlazeName, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function mountLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function mountNote(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** An cloth is INK, IVORY, or GRAPHITE. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An bay is an integer from 1 through 9.
 * A blank value stays unset. 0 is not an bay.
 * A second digit is not an bay.
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

/** A cord is 3, 6, or 9. A blank value stays unset. A leading zero is not a cord. */
export function cordOf(raw: unknown): 2 | 5 | 8 | null {
  if (raw === 2 || raw === "2") return 2;
  if (raw === 5 || raw === "5") return 5;
  if (raw === 8 || raw === "8") return 8;
  return null;
}

/** A stay is 10, 25, or 50. A blank value stays unset. A leading zero is not a stay. */
export function stayOf(raw: unknown): 12 | 24 | 48 | null {
  if (raw === 12 || raw === "12") return 12;
  if (raw === 24 || raw === "24") return 24;
  if (raw === 48 || raw === "48") return 48;
  return null;
}

/** A gilt is 0, 4, or 12. Anything else is not a gilt. 0 clears the gilt. */
export function giltOf(raw: unknown): 0 | 3 | 9 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 3 || raw === "3") return 3;
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

/** Peak hours are 4 and 5. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** Quiet hours are 1 and 9. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far an bay sits behind the desk bay.
 * A positive gap means the mount bay is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Hours do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** INK and IVORY are house alcoves. GRAPHITE is a guest cloth. A blank cloth is not a house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): MountDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Bay or title. Anything else stays on the bay. */
export function sortMode(raw: unknown): MountSort {
  return raw === "steward" ? "steward" : "bay";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 1).toLowerCase();
  return /^[a-f]$/.test(text) ? text : "";
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

function readOne(raw: unknown): GalleryMount | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<GalleryMount>;
  const id = clip(row.id, 24);
  const title = mountLine(row.title);
  if (!id || !title) return null;
  const gilt = giltOf(row.gilt);
  return {
    id,
    title,
    note: mountNote(row.note),
    steward: stewardLabel(row.steward),
    bay: bayOf(row.bay),
    cloth: clothOf(row.cloth),
    glaze: glazeNameOf(row.glaze),
    cord: cordOf(row.cord),
    stay: stayOf(row.stay),
    tags: tagsOf(row.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readMounts(raw: unknown): GalleryMount[] {
  if (!Array.isArray(raw)) return [];
  const out: GalleryMount[] = [];
  for (const item of raw) {
    const mount = readOne(item);
    if (!mount || out.some((row) => row.id === mount.id || row.title === mount.title)) continue;
    out.push(mount);
  }
  return out.slice(0, MOUNT_CAP);
}

export function addMount(
  lamps: readonly GalleryMount[],
  mount: {
    id: string;
    title: string;
    note?: string;
    steward?: string;
    bay?: unknown;
    cloth?: string;
    glaze?: string;
    cord?: unknown;
    stay?: unknown;
    tags?: unknown;
    gilt?: unknown;
  },
): GalleryMount[] {
  const current = readMounts(lamps);
  const id = String(mount.id || "").trim();
  const title = mountLine(mount.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const gilt = giltOf(mount.gilt);
  const next: GalleryMount = {
    id,
    title,
    note: mountNote(mount.note),
    steward: stewardLabel(mount.steward),
    bay: bayOf(mount.bay),
    cloth: clothOf(mount.cloth),
    glaze: glazeNameOf(mount.glaze),
    cord: cordOf(mount.cord),
    stay: stayOf(mount.stay),
    tags: tagsOf(mount.tags),
    gilt: gilt === null ? 0 : gilt,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, MOUNT_CAP);
}

export function cycleGlaze(lamps: readonly GalleryMount[], id: string): GalleryMount[] {
  return readMounts(lamps).map((mount) => {
    if (mount.id !== id) return mount;
    const at = FLAME_ORDER.indexOf(mount.glaze as (typeof FLAME_ORDER)[number]);
    const next = at < 0 || at >= FLAMES.length ? FLAMES[0] : FLAMES[at % FLAMES.length];
    if (!next || next === mount.glaze) return mount;
    return { ...mount, glaze: next, audit: "glaze" };
  });
}

/** A blank title is left as it is. */
export function editMount(lamps: readonly GalleryMount[], id: string, title: unknown): GalleryMount[] {
  const next = mountLine(title);
  if (!next) return readMounts(lamps);
  const current = readMounts(lamps);
  if (current.some((mount) => mount.id !== id && mount.title === next)) return current;
  return current.map((mount) => (mount.id === id && mount.title !== next ? { ...mount, title: next, audit: "edit" } : mount));
}

/** A blank note is left as it is. */
export function editMountNote(lamps: readonly GalleryMount[], id: string, note: unknown): GalleryMount[] {
  const next = mountNote(note);
  if (!next) return readMounts(lamps);
  return readMounts(lamps).map((mount) => (mount.id === id && mount.note !== next ? { ...mount, note: next, audit: "edit" } : mount));
}

/** A tag that is already on the mount, or a fifth tag, is left out. A tag is one letter from g to l. */
export function addMountTag(lamps: readonly GalleryMount[], id: string, tag: unknown): GalleryMount[] {
  const next = tagOf(tag);
  if (!next) return readMounts(lamps);
  return readMounts(lamps).map((mount) => {
    if (mount.id !== id || mount.tags.includes(next) || mount.tags.length >= TAG_CAP) return mount;
    return { ...mount, tags: [...mount.tags, next], audit: "tag" };
  });
}

/** An unknown gilt is left as it is. 0 clears the gilt. */
export function setMountGilt(lamps: readonly GalleryMount[], id: string, gilt: unknown): GalleryMount[] {
  const next = giltOf(gilt);
  if (next === null) return readMounts(lamps);
  return readMounts(lamps).map((mount) => (mount.id === id && mount.gilt !== next ? { ...mount, gilt: next, audit: "gilt" } : mount));
}

export function setMountPin(lamps: readonly GalleryMount[], id: string, pinned: boolean): GalleryMount[] {
  return readMounts(lamps).map((mount) => (mount.id === id && mount.pinned !== pinned ? { ...mount, pinned, audit: pinned ? "pin" : "unpin" } : mount));
}

/** P toggles the pin on the focused row of the wall currently shown. */
export function pinFocused(lamps: readonly GalleryMount[], shownIds: readonly string[], index: number): GalleryMount[] {
  if (!shownIds.length) return readMounts(lamps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readMounts(lamps).find((mount) => mount.id === id);
  if (!row) return readMounts(lamps);
  return setMountPin(lamps, id, !row.pinned);
}

/** S sets a gilt of 4 on the focused mount, or clears a gilt that is already set. */
export function giltFocused(lamps: readonly GalleryMount[], shownIds: readonly string[], index: number): GalleryMount[] {
  if (!shownIds.length) return readMounts(lamps);
  const id = shownIds[moveFocus(index, shownIds.length, 0)];
  const row = readMounts(lamps).find((mount) => mount.id === id);
  if (!row) return readMounts(lamps);
  return setMountGilt(lamps, id, row.gilt ? 0 : 4);
}

export function setMountHold(lamps: readonly GalleryMount[], id: string, held: boolean): GalleryMount[] {
  return readMounts(lamps).map((mount) => (mount.id === id && mount.held !== held ? { ...mount, held, audit: held ? "hold" : "lift" } : mount));
}

export function setMountClose(lamps: readonly GalleryMount[], id: string, closed: boolean): GalleryMount[] {
  return readMounts(lamps).map((mount) => (mount.id === id && mount.closed !== closed ? { ...mount, closed, audit: closed ? "close" : "open" } : mount));
}

export function bulkMountCloth(lamps: readonly GalleryMount[], ids: readonly string[], cloth: unknown): GalleryMount[] {
  const next = clothOf(cloth);
  if (!next) return readMounts(lamps);
  const picked = new Set(ids);
  return readMounts(lamps).map((mount) => (picked.has(mount.id) && mount.cloth !== next ? { ...mount, cloth: next, audit: "cloth" } : mount));
}

export function bulkMountPin(lamps: readonly GalleryMount[], ids: readonly string[], pinned: boolean): GalleryMount[] {
  const picked = new Set(ids);
  return readMounts(lamps).map((mount) => (picked.has(mount.id) && mount.pinned !== pinned ? { ...mount, pinned, audit: pinned ? "pin" : "unpin" } : mount));
}

export function bulkMountClose(lamps: readonly GalleryMount[], ids: readonly string[], closed: boolean): GalleryMount[] {
  const picked = new Set(ids);
  return readMounts(lamps).map((mount) => (picked.has(mount.id) && mount.closed !== closed ? { ...mount, closed, audit: closed ? "close" : "open" } : mount));
}

export function bulkMountGlaze(mounts: readonly GalleryMount[], ids: readonly string[], glaze: unknown): GalleryMount[] {
  const next = glazeNameOf(glaze);
  if (!next) return readMounts(mounts);
  const picked = new Set(ids);
  return readMounts(mounts).map((mount) => (picked.has(mount.id) && mount.glaze !== next ? { ...mount, glaze: next, audit: "glaze" } : mount));
}

export function bulkMountTag(lamps: readonly GalleryMount[], ids: readonly string[], tag: unknown): GalleryMount[] {
  return ids.reduce((rows, id) => addMountTag(rows, id, tag), readMounts(lamps));
}

export function resetMounts(): GalleryMount[] {
  return [];
}

function inTray(mount: GalleryMount, tray: MountTray): boolean {
  if (tray === "closed") return mount.closed;
  if (tray === "held") return mount.held && !mount.closed;
  return !mount.held && !mount.closed;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** An open mount whose bay sits more than two hours behind the desk bay. A gilt, a hold, or a close is not late. */
export function lateMount(mount: GalleryMount, desk: unknown): boolean {
  const gap = bayGap(mount.bay, desk);
  return inTray(mount, "open") && mount.gilt === 0 && gap !== null && gap > 1;
}

/** An open mount with a stay of 10 is due now. A gilt, a hold, or a close is not. */
export function soonMount(mount: GalleryMount): boolean {
  return inTray(mount, "open") && mount.gilt === 0 && mount.stay === 12;
}

/** Open lamps that are late or due now. A shaded mount stays off the reminder list. */
export function reminderMounts(lamps: readonly GalleryMount[], desk: unknown): GalleryMount[] {
  return readMounts(lamps).filter((mount) => lateMount(mount, desk) || soonMount(mount));
}

/** Open lamps whose bay sits within two hours of the desk bay. A gilt, a hold, or a close stays out. */
export function windowMounts(lamps: readonly GalleryMount[], desk: unknown): GalleryMount[] {
  return readMounts(lamps).filter((mount) => {
    const gap = bayGap(mount.bay, desk);
    return inTray(mount, "open") && mount.gilt === 0 && gap !== null && Math.abs(gap) <= 1;
  });
}

/** Search matches the title, the note, the steward, and the tags. */
export function visibleMounts(
  lamps: readonly GalleryMount[],
  tray: MountTray,
  query: string,
  steward: string | null,
  cloth: string | null,
  glaze: string | null,
  exact: number | null,
  pick: BayPick | null,
  cord: number | "blank" | null,
  stay: number | "blank" | null,
  glossOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): GalleryMount[] {
  const text = query.trim().toLowerCase();
  return readMounts(lamps).filter((mount) => {
    if (!inTray(mount, tray)) return false;
    if (text) {
      const hay = `${mount.title} ${mount.note} ${mount.steward} ${mount.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (steward !== null && mount.steward !== steward) return false;
    if (cloth === "blank" ? Boolean(mount.cloth) : cloth && mount.cloth !== cloth) return false;
    if (glaze === "blank" ? Boolean(mount.glaze) : glaze && mount.glaze !== glaze) return false;
    if (!bayHit(mount.bay, exact, pick)) return false;
    if (cord === "blank" ? mount.cord !== null : cord !== null && mount.cord !== cord) return false;
    if (stay === "blank" ? mount.stay !== null : stay !== null && mount.stay !== stay) return false;
    if (glossOnly && mount.glaze !== "gloss") return false;
    if (peakOnly && !peakBay(mount.bay)) return false;
    if (houseOnly && !houseCloth(mount.cloth)) return false;
    if (quietOnly && !quietBay(mount.bay)) return false;
    if (awakeOnly && mount.gilt !== 0) return false;
    return true;
  });
}

export function sortMounts(lamps: readonly GalleryMount[], mode: MountSort): GalleryMount[] {
  const rows = lamps.slice();
  if (mode === "steward") return rows.sort((a, b) => a.steward.localeCompare(b.steward) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function mountTimeline(lamps: readonly GalleryMount[], query: string): GalleryMount[] {
  const text = query.trim().toLowerCase();
  return sortMounts(
    readMounts(lamps).filter((mount) => mount.bay !== null && (!text || mount.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function mountCounts(lamps: readonly GalleryMount[], desk: unknown): MountCounts {
  const rows = readMounts(lamps);
  return {
    open: rows.filter((mount) => inTray(mount, "open")).length,
    held: rows.filter((mount) => inTray(mount, "held")).length,
    closed: rows.filter((mount) => inTray(mount, "closed")).length,
    pinned: rows.filter((mount) => mount.pinned).length,
    peak: rows.filter((mount) => inTray(mount, "open") && mount.gilt === 0 && peakBay(mount.bay)).length,
    late: rows.filter((mount) => lateMount(mount, desk)).length,
    soon: rows.filter((mount) => soonMount(mount)).length,
    gilt: rows.filter((mount) => inTray(mount, "open") && mount.gilt > 0).length,
    house: rows.filter((mount) => inTray(mount, "open") && houseCloth(mount.cloth)).length,
    window: windowMounts(rows, desk).length,
  };
}

export function mountShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open lamps as a share of every open mount. */
export function lateShare(lamps: readonly GalleryMount[], desk: unknown): number {
  const rows = readMounts(lamps);
  const open = rows.filter((mount) => inTray(mount, "open")).length;
  const late = rows.filter((mount) => lateMount(mount, desk)).length;
  return mountShare(late, open);
}

/** Distinct hours on open lamps. */
export function usedBays(lamps: readonly GalleryMount[]): number {
  const hours = new Set<number>();
  for (const mount of readMounts(lamps)) {
    if (inTray(mount, "open") && mount.bay !== null) hours.add(mount.bay);
  }
  return hours.size;
}

/** Open lamps that share an bay and an cloth. A different cloth on the same bay is not a clash. */
export function clashBayCount(lamps: readonly GalleryMount[]): number {
  const groups = new Map<string, number>();
  for (const mount of readMounts(lamps)) {
    if (!inTray(mount, "open") || mount.bay === null || !mount.cloth) continue;
    const key = `${mount.bay}:${mount.cloth}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open lamps that share a cord. An unset cord is not a clash. */
export function cordClashCount(lamps: readonly GalleryMount[]): number {
  const groups = new Map<number, number>();
  for (const mount of readMounts(lamps)) {
    if (!inTray(mount, "open") || mount.cord === null) continue;
    groups.set(mount.cord, (groups.get(mount.cord) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * Open lamps in the same cloth whose hours differ by two.
 * The count is the lamps that have at least one neighbor.
 */
export function adjacentMountCount(lamps: readonly GalleryMount[]): number {
  const open = readMounts(lamps).filter((mount) => inTray(mount, "open") && mount.bay !== null && mount.cloth);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      const left = open[i];
      const right = open[j];
      if (left.cloth === right.cloth && Math.abs((left.bay ?? 0) - (right.bay ?? 0)) === 1) {
        hit.add(left.id);
        hit.add(right.id);
      }
    }
  }
  return hit.size;
}

/**
 * The cloth with the fewest open lamps.
 * A tie keeps GRAPHITE, then INK, then IVORY.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestCloth(lamps: readonly GalleryMount[]): "CHAMPAGNE" | "IVORY" | "GRAPHITE" {
  const rows = readMounts(lamps).filter((mount) => inTray(mount, "open"));
  const order = ["CHAMPAGNE", "IVORY", "GRAPHITE"] as const;
  let best: "CHAMPAGNE" | "IVORY" | "GRAPHITE" = "CHAMPAGNE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((mount) => mount.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The stay with the fewest open lamps.
 * A tie keeps 25, then 10, then 50.
 * An empty desk still suggests 25.
 */
export function suggestStay(lamps: readonly GalleryMount[]): 12 | 24 | 48 {
  const rows = readMounts(lamps).filter((mount) => inTray(mount, "open"));
  const order = [24, 12, 48] as const;
  let best: 12 | 24 | 48 = 24;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const stay of order) {
    const count = rows.filter((mount) => mount.stay === stay).length;
    if (count < bestCount) {
      best = stay;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open steward. A blank steward is skipped. An empty desk stays blank. */
export function suggestSteward(lamps: readonly GalleryMount[]): string {
  const found = readMounts(lamps).find((mount) => inTray(mount, "open") && mount.steward);
  return found ? found.steward : "";
}

/**
 * The steward carrying the fewest open lamps.
 * A tie keeps the earlier name. A blank steward is not a load.
 * An empty roster falls back to the newest steward.
 */
export function fairSteward(lamps: readonly GalleryMount[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = stewardLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestSteward(lamps);
  const open = readMounts(lamps).filter((mount) => inTray(mount, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((mount) => mount.steward === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The steward with the most open lamps. A tie keeps the newer name on the desk. */
export function busiestSteward(lamps: readonly GalleryMount[]): string {
  const rows = readMounts(lamps).filter((mount) => inTray(mount, "open") && mount.steward);
  const names: string[] = [];
  for (const mount of rows) if (!names.includes(mount.steward)) names.push(mount.steward);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((mount) => mount.steward === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function mountStewards(lamps: readonly GalleryMount[]): string[] {
  const out: string[] = [];
  for (const mount of readMounts(lamps)) {
    if (mount.steward && !out.includes(mount.steward)) out.push(mount.steward);
  }
  return out;
}

export function mountCloths(lamps: readonly GalleryMount[]): string[] {
  const out: string[] = [];
  for (const mount of readMounts(lamps)) {
    if (mount.cloth && !out.includes(mount.cloth)) out.push(mount.cloth);
  }
  return out;
}

/**
 * The next open mount at or after the desk bay.
 * A dim glaze, a gilt, a hold, and a close stay off the list.
 * When every open bay is behind, the earliest bay is next.
 */
/** Open mounts whose steward also hangs another open mount on a different bay. */
export function pairStewardCount(mounts: readonly GalleryMount[]): number {
  const open = readMounts(mounts).filter((mount) => inTray(mount, "open") && mount.steward && mount.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].steward === open[j].steward && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The gilt weight of open mounts. A clear gilt adds nothing. */
export function giltLoad(mounts: readonly GalleryMount[]): number {
  return readMounts(mounts).filter((mount) => inTray(mount, "open")).reduce((sum, mount) => sum + mount.gilt, 0);
}

export function nextMount(lamps: readonly GalleryMount[], desk: unknown): string {
  const now = bayOf(desk);
  if (now === null) return "";
  const waiting = readMounts(lamps).filter((mount) => inTray(mount, "open") && mount.bay !== null && mount.glaze !== "satin" && mount.gilt === 0);
  if (!waiting.length) return "";
  const byHour = (a: GalleryMount, b: GalleryMount) => (a.bay ?? 0) - (b.bay ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((mount) => (mount.bay ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function mountCopy(mount: GalleryMount, desk: unknown): string {
  const gap = bayGap(mount.bay, desk);
  return [mount.title, mount.steward, mount.bay ?? "", mount.cloth, mount.glaze, mount.cord ?? "", mount.stay ?? "", mount.tags.join(" "), mount.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the lamps saved in this browser. The gap and the late mark use the bay you pass. */
export function mountsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,steward,bay,cloth,glaze,cord,stay,tags,gilt,pinned,held,closed,gap,late,soon,house,window,note,audit"];
  const rows = readMounts(raw);
  const windowIds = new Set(windowMounts(rows, desk).map((mount) => mount.id));
  for (const mount of rows) {
    const gap = bayGap(mount.bay, desk);
    lines.push([
      mount.title,
      mount.steward,
      mount.bay === null ? "" : String(mount.bay),
      mount.cloth,
      mount.glaze,
      mount.cord === null ? "" : String(mount.cord),
      mount.stay === null ? "" : String(mount.stay),
      mount.tags.join(" "),
      String(mount.gilt),
      mount.pinned ? "1" : "0",
      mount.held ? "1" : "0",
      mount.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateMount(mount, desk) ? "1" : "0",
      soonMount(mount) ? "1" : "0",
      houseCloth(mount.cloth) ? "1" : "0",
      windowIds.has(mount.id) ? "1" : "0",
      mount.note,
      mount.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeSteward(raw: string, readers: readonly string[]): string {
  if (raw === "blank") return "blank";
  return readers.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, alcoves: readonly string[]): string {
  if (raw === "blank") return "blank";
  const cloth = clothOf(raw);
  return cloth && alcoves.includes(cloth) ? cloth : "all";
}

export function activeGlaze(raw: string, flames: readonly string[]): string {
  if (raw === "blank") return "blank";
  const glaze = glazeNameOf(raw);
  return glaze && flames.includes(glaze) ? glaze : "all";
}

export function activeBay(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const bay = bayOf(raw);
  return bay === null ? "all" : String(bay);
}

export function activeCord(raw: string): string {
  if (raw === "blank") return "blank";
  const cord = cordOf(raw);
  return cord === null ? "all" : String(cord);
}

export function activeStay(raw: string): string {
  if (raw === "blank") return "blank";
  const stay = stayOf(raw);
  return stay === null ? "all" : String(stay);
}

export function stewardArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
}

export function glazeArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return glazeNameOf(filter) || null;
}

export function bayArg(filter: string): { exact: number | null; pick: BayPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: bayOf(filter), pick: null };
}

export function cordArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cordOf(filter);
}

export function stayArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stayOf(filter);
}

function readView(raw: unknown): MountView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MountView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    steward: row.steward === "blank" ? "blank" : clip(row.steward, 16) || "all",
    cloth: row.cloth === "blank" || row.cloth === "all" ? (row.cloth === "blank" ? "blank" : "all") : clothOf(row.cloth) || "all",
    glaze: row.glaze === "blank" || row.glaze === "all" ? (row.glaze === "blank" ? "blank" : "all") : glazeNameOf(row.glaze) || "all",
    bay: activeBay(String(row.bay || "all")),
    cord: activeCord(String(row.cord || "all")),
    stay: activeStay(String(row.stay || "all")),
  };
}

export function readMountViews(raw: unknown): MountView[] {
  if (!Array.isArray(raw)) return [];
  const out: MountView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addMountView(views: readonly MountView[], view: MountView): MountView[] {
  const current = readMountViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropMountView(views: readonly MountView[], id: string): MountView[] {
  return readMountViews(views).filter((view) => view.id !== id);
}


const DEVICE_BANDS = ["palm", "pocket", "desk", "plain"] as const;

const TONES = ["gilt", "ink", "ivory", "plain"] as const;

const CATALOG = new Set(["iphone 14", "pixel 8", "desk 7fx"]);

const DEVICE_BLOCK = ["lastIp", "timezone", "username", "phone", "assigneeId", "referralCodeUsed", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage", "name", "email"] as const;

export type DeviceState = "" | "set" | "clear";

export type DeviceBand = "" | "palm" | "pocket" | "desk" | "plain";

export type DeviceTone = "" | "gilt" | "ink" | "ivory" | "plain";

export type DeviceShape = "all" | "catalog" | "wide" | "gilt";

export type DeviceValue =
  | { lastDevice?: unknown; email?: unknown; lastIp?: unknown; timezone?: unknown; username?: unknown; phone?: unknown; assigneeId?: unknown; referralCodeUsed?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown; name?: unknown }
  | string
  | number
  | null
  | undefined;

export type DeviceRow = { id: string; note?: DeviceValue; label?: string | null };

export type DeviceBandLine = { band: string; count: number };

function deviceBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 48);
}

function deviceText(value: DeviceValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: deviceBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (DEVICE_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("lastDevice" in value)) return { text: null, explicit: false };
  const inner = value.lastDevice;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: deviceBody(inner), explicit: true };
}

export function deviceState(value: DeviceValue): DeviceState {
  const found = deviceText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function deviceCopy(value: DeviceValue): string {
  const found = deviceText(value);
  if (!found.text) return "";
  return found.text;
}

function makerWord(text: string): string {
  return text.split(" ").filter(Boolean)[0] || "";
}

/** A plate keeps the first letter of the maker and the first digit. A plate with no digit keeps the first letter and the last letter. */
export function deviceOf(value: DeviceValue): string {
  const text = deviceCopy(value);
  if (!text) return "";
  const letters = makerWord(text).match(/[a-z]/gi) || [];
  const first = letters[0] ? letters[0].toUpperCase() : "";
  const digit = (text.match(/\d/) || [""])[0];
  if (first && digit) return first + digit;
  const all = text.match(/[a-z]/gi) || [];
  const left = all[0];
  const right = all[all.length - 1];
  if (!left) return "";
  if (!right || all.length === 1) return left.toUpperCase();
  return left.toUpperCase() + right.toUpperCase();
}

/** iPhone, iPad, and Android are palm. Pixel and Galaxy are pocket. Mac, Windows, and Desk are desk. Any other mark is plain. */
export function deviceBand(value: DeviceValue): DeviceBand {
  const mark = deviceOf(value);
  if (!mark) return "";
  const text = deviceCopy(value);
  if (/iphone|ipad|android/i.test(text)) return "palm";
  if (/pixel|galaxy/i.test(text)) return "pocket";
  if (/mac|windows|desk/i.test(text)) return "desk";
  return "plain";
}

/** A maker that starts with i is gilt. A digit 8 that is not gilt is ink. Desk that is neither is ivory. Every other marked plate is plain. */
export function deviceTone(value: DeviceValue): DeviceTone {
  const text = deviceCopy(value);
  if (!text || !deviceOf(value)) return "";
  const maker = makerWord(text);
  if (maker.startsWith("i")) return "gilt";
  if (text.includes("8")) return "ink";
  if (text.includes("desk")) return "ivory";
  return "plain";
}

/** iPhone 14, Pixel 8, and Desk 7FX are the house catalog. Any other plate is not. */
export function catalogDevice(value: DeviceValue): boolean {
  return CATALOG.has(deviceCopy(value));
}

export function catalogDeviceCount(rows: readonly DeviceRow[]): number {
  return rows.filter((row) => catalogDevice(row.note)).length;
}

export function wideDeviceCount(rows: readonly DeviceRow[]): number {
  return rows.filter((row) => deviceCopy(row.note).length > 12).length;
}

export function giltDeviceCount(rows: readonly DeviceRow[]): number {
  return rows.filter((row) => deviceTone(row.note) === "gilt").length;
}

/** Customers whose maker word is shared with at least one other customer. */
export function sharedDeviceCount(rows: readonly DeviceRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const maker = makerWord(deviceCopy(row.note));
    if (!maker || !deviceOf(row.note)) continue;
    groups.set(maker, (groups.get(maker) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function deviceBands(rows: readonly DeviceRow[]): DeviceBandLine[] {
  return DEVICE_BANDS.map((band) => ({ band, count: rows.filter((row) => deviceBand(row.note) === band).length }));
}

/** The band with the most set plates. A tie keeps palm, then pocket, then desk, then plain. */
export function leadingDevice(rows: readonly DeviceRow[]): string {
  const lines = deviceBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || DEVICE_BANDS.indexOf(a.band as (typeof DEVICE_BANDS)[number]) - DEVICE_BANDS.indexOf(b.band as (typeof DEVICE_BANDS)[number]))[0].band;
}

/** The tone with the most set plates. A tie keeps gilt, then ink, then ivory, then plain. */
export function leadingDeviceTone(rows: readonly DeviceRow[]): string {
  const counts = TONES.map((tone) => ({ tone, count: rows.filter((row) => deviceTone(row.note) === tone).length }));
  const live = counts.filter((line) => line.count > 0);
  if (!live.length) return "";
  return live.slice().sort((a, b) => b.count - a.count || TONES.indexOf(a.tone) - TONES.indexOf(b.tone))[0].tone;
}

export function deviceShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentDevices(rows: readonly DeviceRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = deviceState(row.note);
    const band = state === "set" ? deviceBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenDevices(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedDevices(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleDevice(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleDeviceReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkDeviceReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleDeviceBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleDeviceCustomers(
  rows: readonly DeviceRow[],
  band: DeviceBand | "blank" | null,
  tone: DeviceTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: DeviceShape,
): DeviceRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = deviceState(row.note);
    const mark = state === "set" ? deviceBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && deviceTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogDevice(row.note)) return false;
    if (shape === "wide" && deviceCopy(row.note).length <= 12) return false;
    if (shape === "gilt" && deviceTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${deviceCopy(row.note)} ${deviceOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeDeviceBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeDeviceTone(raw: string): string {
  return raw === "gilt" || raw === "ink" || raw === "ivory" || raw === "plain" ? raw : "all";
}

export function deviceBandArg(filter: string): DeviceBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "palm" || filter === "pocket" || filter === "desk" || filter === "plain") return filter;
  return null;
}

export function deviceToneArg(filter: string): DeviceTone | null {
  if (filter === "gilt" || filter === "ink" || filter === "ivory" || filter === "plain") return filter;
  return null;
}

export function devicesCsv(rows: readonly DeviceRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of deviceBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogDeviceCount(rows)}`);
  lines.push(`wide,wide,${wideDeviceCount(rows)}`);
  lines.push(`tone,gilt,${giltDeviceCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => deviceTone(row.note) === "ink").length}`);
  lines.push(`tone,ivory,${rows.filter((row) => deviceTone(row.note) === "ivory").length}`);
  lines.push(`tone,plain,${rows.filter((row) => deviceTone(row.note) === "plain").length}`);
  lines.push(`shared,shared,${sharedDeviceCount(rows)}`);
  return lines.join("\n");
}

export function deviceRowsCsv(rows: readonly DeviceRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,plate,band,tone,catalog,wide,reviewed"];
  for (const row of rows) {
    const state = deviceState(row.note);
    const band = state === "set" ? deviceBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      deviceOf(row.note),
      band,
      state === "set" ? deviceTone(row.note) : "",
      catalogDevice(row.note) ? "1" : "0",
      deviceCopy(row.note).length > 12 ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
