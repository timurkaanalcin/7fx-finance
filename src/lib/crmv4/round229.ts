/**
 * Aisle niches for the affiliate desk, and escutcheon marks already stored as customer, kind, and status on each loaded partner or document.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_aisle_niche (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   usher text not null default '',
 *   bay integer,
 *   cloth text not null default '',
 *   gait text not null default '',
 *   lamp integer,
 *   stay integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   crest boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_escutcheon_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_escutcheon_review (
 *   partner_id text primary key
 * );
 */

export const AIN_KEY = "crmv4-aisle-niche";
export const AIN_VIEW_KEY = "crmv4-aisle-views";
export const AIN_DENSITY_KEY = "crmv4-aisle-density";
export const ESC_KEY = "crmv4-escutcheon-hide";
export const ESC_REVIEW_KEY = "crmv4-escutcheon-review";

export type ClothName = "blank" | "graphite" | "ivory" | "champagne";

export type GaitName = "blank" | "hush" | "stride" | "rush";

export type NicheTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type NicheDensity = "airy" | "tight";

export type NicheSort = "bay" | "usher";

export type AisleNiche = {
  id: string;
  title: string;
  note: string;
  usher: string;
  bay: number | null;
  cloth: string;
  gait: string;
  lamp: number | null;
  stay: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  crest: boolean;
  audit: string;
};

export type NicheView = {
  id: string;
  name: string;
  tray: NicheTray;
  query: string;
  usher: string;
  cloth: string;
  gait: string;
  bay: string;
  lamp: string;
  stay: string;
};

export type NicheCounts = {
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
  crest: number;
  cooling: number;
};

export type EscutcheonLane = "" | "margin" | "bell" | "quill" | "cipher";

export type EscutcheonTone = "" | "bright" | "even" | "dim" | "hush" | "mist";

export type EscutcheonState = "" | "clear" | "set";

export type EscutcheonShape = "all" | "stitch" | "wide" | "margin" | "cipher" | "quill";

export type EscutcheonReview = "all" | "reviewed" | "fresh";

export type EscutcheonValue = string | { customer?: unknown; kind?: unknown; status?: unknown; title?: unknown; [key: string]: unknown } | null | undefined;

export type EscutcheonRow = { id: string; label: string; note: EscutcheonValue };

export type EscutcheonLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "cloth", "tag", "stay", "lamp", "crest"] as const;

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

function trayOf(raw: unknown): NicheTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
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
    if (!/^[abc]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(panel: AisleNiche, tray: NicheTray): boolean {
  if (tray === "held") return panel.held && !panel.archived;
  if (tray === "archived") return panel.archived;
  return !panel.held && !panel.archived;
}

/** A blank title is left out. The saved title stays short. */
export function nicheLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function nicheNote(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank usher stays blank. It is not filled in. */
export function usherLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** An cloth is GRAPHITE, IVORY, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function clothOf(raw: unknown): string {
  const name = clothName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * A bay is an integer from 1 through 7.
 * A blank value stays unset. 0 is not a bay.
 * A second digit is not a bay.
 */
export function bayOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 7) return null;
    return raw;
  }
  const text = clip(raw, 2);
  if (!/^[1-7]$/.test(text)) return null;
  return Number(text);
}

/** A lamp is 5, 15, or 45. A blank value stays unset. A leading zero is not a lamp. */
export function lampOf(raw: unknown): 5 | 15 | 45 | null {
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

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak shelves are 3 and 6. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 1. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the niche is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Shelves do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and CHAMPAGNE are house cloths. GRAPHITE is a guest cloth. A blank cloth is not a house cloth. */
export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

export function rowDensity(raw: unknown): NicheDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function nicheSort(raw: unknown): NicheSort {
  return raw === "usher" ? "usher" : "bay";
}

function readOne(raw: unknown): AisleNiche | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = nicheLine(row.title);
  if (!id || !title) return null;
  const stay = stayOf(row.stay);
  return {
    id,
    title,
    note: nicheNote(row.note),
    usher: usherLabel(row.usher),
    bay: bayOf(row.bay),
    cloth: clothOf(row.cloth),
    gait: gaitName(row.gait),
    lamp: lampOf(row.lamp),
    stay: stay === null ? 2 : stay,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    crest: row.crest === true,
    audit: auditCode(row.audit),
  };
}

export function readNiches(raw: unknown): AisleNiche[] {
  if (!Array.isArray(raw)) return [];
  const out: AisleNiche[] = [];
  for (const item of raw) {
    const panel = readOne(item);
    if (!panel || out.some((row) => row.id === panel.id || row.title === panel.title)) continue;
    out.push(panel);
  }
  return out.slice(0, DRAWER_CAP);
}

export function addNiche(
  panels: readonly AisleNiche[],
  panel: {
    id: string;
    title: string;
    note?: string;
    usher?: string;
    bay?: unknown;
    cloth?: string;
    gait?: string;
    lamp?: unknown;
    stay?: unknown;
    tags?: unknown;
  },
): AisleNiche[] {
  const current = readNiches(panels);
  const id = String(panel.id || "").trim();
  const title = nicheLine(panel.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const stay = stayOf(panel.stay);
  const next: AisleNiche = {
    id,
    title,
    note: nicheNote(panel.note),
    usher: usherLabel(panel.usher),
    bay: bayOf(panel.bay),
    cloth: clothOf(panel.cloth),
    gait: gaitName(panel.gait),
    lamp: lampOf(panel.lamp),
    stay: stay === null ? 2 : stay,
    tags: tagsOf(panel.tags),
    pinned: false,
    held: false,
    archived: false,
    crest: false,
    audit: "save",
  };
  return [next, ...current].slice(0, DRAWER_CAP);
}

/** A blank gait becomes hush, hush becomes stride, stride becomes rush, and rush returns to hush. */
export function cycleGait(panels: readonly AisleNiche[], id: string): AisleNiche[] {
  return readNiches(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const at = GAIT_CYCLE.indexOf(panel.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === panel.gait) return panel;
    return { ...panel, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editNiche(panels: readonly AisleNiche[], id: string, title: unknown): AisleNiche[] {
  const next = nicheLine(title);
  if (!next) return readNiches(panels);
  const current = readNiches(panels);
  if (current.some((panel) => panel.id !== id && panel.title === next)) return current;
  return current.map((panel) => (panel.id === id && panel.title !== next ? { ...panel, title: next, audit: "edit" } : panel));
}

export function editNicheNote(panels: readonly AisleNiche[], id: string, note: unknown): AisleNiche[] {
  const next = nicheNote(note);
  return readNiches(panels).map((panel) => (panel.id === id && panel.note !== next ? { ...panel, note: next, audit: "note" } : panel));
}

export function addNicheTag(panels: readonly AisleNiche[], id: string, tag: unknown): AisleNiche[] {
  const next = tagsOf(tag);
  if (!next.length) return readNiches(panels);
  return readNiches(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const tags = tagsOf([...panel.tags, ...next]);
    if (tags.join() === panel.tags.join()) return panel;
    return { ...panel, tags, audit: "tag" };
  });
}

export function setNicheStay(panels: readonly AisleNiche[], id: string, stay: unknown): AisleNiche[] {
  const next = stayOf(stay);
  if (next === null) return readNiches(panels);
  return readNiches(panels).map((panel) => (panel.id === id && panel.stay !== next ? { ...panel, stay: next, audit: "stay" } : panel));
}

/** Snooze lengthens the lamp from blank to 5, from 5 to 15, and from 15 to 45. 45 stays. */
export function snoozeNiche(panels: readonly AisleNiche[], id: string): AisleNiche[] {
  return readNiches(panels).map((panel) => {
    if (panel.id !== id) return panel;
    const next = panel.lamp === null ? 5 : panel.lamp === 5 ? 15 : panel.lamp === 15 ? 45 : null;
    if (next === null) return panel;
    return { ...panel, lamp: next, audit: "lamp" };
  });
}

export function setNichePin(panels: readonly AisleNiche[], id: string, pinned: boolean): AisleNiche[] {
  return readNiches(panels).map((panel) => (panel.id === id && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function pinFocusedNiche(panels: readonly AisleNiche[], shownIds: readonly string[], index: number): AisleNiche[] {
  const id = shownIds[index];
  if (!id) return readNiches(panels);
  const panel = readNiches(panels).find((item) => item.id === id);
  if (!panel) return readNiches(panels);
  return setNichePin(panels, id, !panel.pinned);
}

export function snoozeFocusedNiche(panels: readonly AisleNiche[], shownIds: readonly string[], index: number): AisleNiche[] {
  const id = shownIds[index];
  return id ? snoozeNiche(panels, id) : readNiches(panels);
}

export function holdFocusedNiche(panels: readonly AisleNiche[], shownIds: readonly string[], index: number): AisleNiche[] {
  const id = shownIds[index];
  if (!id) return readNiches(panels);
  const panel = readNiches(panels).find((item) => item.id === id);
  if (!panel || panel.archived) return readNiches(panels);
  return setNicheHold(panels, id, !panel.held);
}

export function gaitFocusedNiche(panels: readonly AisleNiche[], shownIds: readonly string[], index: number): AisleNiche[] {
  const id = shownIds[index];
  return id ? cycleGait(panels, id) : readNiches(panels);
}

export function crestFocusedNiche(panels: readonly AisleNiche[], shownIds: readonly string[], index: number): AisleNiche[] {
  const id = shownIds[index];
  if (!id) return readNiches(panels);
  const panel = readNiches(panels).find((item) => item.id === id);
  if (!panel) return readNiches(panels);
  return setNicheCrest(panels, id, !panel.crest);
}

export function setNicheHold(panels: readonly AisleNiche[], id: string, held: boolean): AisleNiche[] {
  return readNiches(panels).map((panel) => (panel.id === id && !panel.archived && panel.held !== held ? { ...panel, held, audit: held ? "hold" : "resume" } : panel));
}

export function setNicheArchive(panels: readonly AisleNiche[], id: string, archived: boolean): AisleNiche[] {
  return readNiches(panels).map((panel) => (panel.id === id && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function setNicheCrest(panels: readonly AisleNiche[], id: string, crest: boolean): AisleNiche[] {
  return readNiches(panels).map((panel) => (panel.id === id && panel.crest !== crest ? { ...panel, crest, audit: "crest" } : panel));
}

export function bulkNicheCloth(panels: readonly AisleNiche[], ids: readonly string[], cloth: unknown): AisleNiche[] {
  const next = clothOf(cloth);
  if (!next) return readNiches(panels);
  const want = new Set(ids);
  return readNiches(panels).map((panel) => (want.has(panel.id) && panel.cloth !== next ? { ...panel, cloth: next, audit: "cloth" } : panel));
}

export function bulkNichePin(panels: readonly AisleNiche[], ids: readonly string[], pinned: boolean): AisleNiche[] {
  const want = new Set(ids);
  return readNiches(panels).map((panel) => (want.has(panel.id) && panel.pinned !== pinned ? { ...panel, pinned, audit: pinned ? "pin" : "unpin" } : panel));
}

export function bulkNicheArchive(panels: readonly AisleNiche[], ids: readonly string[], archived: boolean): AisleNiche[] {
  const want = new Set(ids);
  return readNiches(panels).map((panel) => (want.has(panel.id) && panel.archived !== archived ? { ...panel, archived, held: archived ? false : panel.held, audit: archived ? "archive" : "open" } : panel));
}

export function bulkNicheGait(panels: readonly AisleNiche[], ids: readonly string[], gait: unknown): AisleNiche[] {
  const next = gaitName(gait);
  if (!next) return readNiches(panels);
  const want = new Set(ids);
  return readNiches(panels).map((panel) => (want.has(panel.id) && panel.gait !== next ? { ...panel, gait: next, audit: "gait" } : panel));
}

export function bulkNicheTag(panels: readonly AisleNiche[], ids: readonly string[], tag: unknown): AisleNiche[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addNicheTag(rows, id, tag) : rows), readNiches(panels));
}

export function resetNiches(): AisleNiche[] {
  return [];
}

/** An open niche whose bay sits more than two shelves behind the desk. A raised stay, a hold, or an archive is not late. */
export function lateNiche(panel: AisleNiche, desk: unknown): boolean {
  const gap = bayGap(panel.bay, desk);
  return inTray(panel, "open") && panel.stay === 2 && gap !== null && gap > 2;
}

/** An open niche with a lamp of 5 is due now. A raised stay, a hold, or an archive is not. */
export function soonNiche(panel: AisleNiche): boolean {
  return inTray(panel, "open") && panel.stay === 2 && panel.lamp === 5;
}

/** An open resting niche on a walk gait whose bay is 1. That quiet walk is cooling. */
export function coolingNiche(panel: AisleNiche): boolean {
  return inTray(panel, "open") && panel.stay === 2 && panel.gait === "walk" && panel.bay === 1;
}

/** Open niches that are late or due now. A raised niche stays off the reminder list. */
export function reminderNiches(panels: readonly AisleNiche[], desk: unknown): AisleNiche[] {
  return readNiches(panels).filter((panel) => lateNiche(panel, desk) || soonNiche(panel));
}

export function coolingNiches(panels: readonly AisleNiche[]): AisleNiche[] {
  return readNiches(panels).filter((panel) => coolingNiche(panel));
}

/** Open niches whose bay sits within four shelves of the desk. A raised stay, a hold, or an archive stays out. */
export function windowNiches(panels: readonly AisleNiche[], desk: unknown): AisleNiche[] {
  return readNiches(panels).filter((panel) => {
    const gap = bayGap(panel.bay, desk);
    return inTray(panel, "open") && panel.stay === 2 && gap !== null && gap >= -2 && gap <= 2;
  });
}

export function matchedNiches(panels: readonly AisleNiche[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readNiches(panels).filter((panel) => inTray(panel, "open") && panel.stay === 2 && panel.bay === at).length;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** Search matches the title, the note, the usher, and the tags. */
export function visibleNiches(
  panels: readonly AisleNiche[],
  tray: NicheTray,
  query: string,
  usher: string | null,
  cloth: string | null,
  gait: string | null,
  exact: number | null,
  pick: BayPick | null,
  lamp: number | "blank" | null,
  stay: number | "blank" | null,
  flareOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): AisleNiche[] {
  const text = query.trim().toLowerCase();
  return readNiches(panels).filter((panel) => {
    if (!inTray(panel, tray)) return false;
    if (text) {
      const hay = `${panel.title} ${panel.note} ${panel.usher} ${panel.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (usher !== null && panel.usher !== usher) return false;
    if (cloth === "blank" ? Boolean(panel.cloth) : cloth && panel.cloth !== cloth) return false;
    if (gait === "blank" ? Boolean(panel.gait) : gait && panel.gait !== gait) return false;
    if (!bayHit(panel.bay, exact, pick)) return false;
    if (lamp === "blank" ? panel.lamp !== null : lamp !== null && panel.lamp !== lamp) return false;
    if (stay === "blank" ? panel.stay !== 2 : stay !== null && panel.stay !== stay) return false;
    if (flareOnly && panel.gait !== "flare") return false;
    if (peakOnly && !peakBay(panel.bay)) return false;
    if (houseOnly && !houseCloth(panel.cloth)) return false;
    if (quietOnly && !quietBay(panel.bay)) return false;
    if (restingOnly && panel.stay !== 2) return false;
    return true;
  });
}

export function sortNiches(panels: readonly AisleNiche[], mode: NicheSort): AisleNiche[] {
  const rows = panels.slice();
  if (mode === "usher") return rows.sort((a, b) => a.usher.localeCompare(b.usher) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function nicheIndex(panels: readonly AisleNiche[], query: string): AisleNiche[] {
  const text = query.trim().toLowerCase();
  return sortNiches(
    readNiches(panels).filter((panel) => panel.bay !== null && (!text || panel.title.toLowerCase().includes(text))),
    "bay",
  );
}

export function nicheCounts(panels: readonly AisleNiche[], desk: unknown): NicheCounts {
  const rows = readNiches(panels);
  return {
    open: rows.filter((panel) => inTray(panel, "open")).length,
    held: rows.filter((panel) => inTray(panel, "held")).length,
    archived: rows.filter((panel) => inTray(panel, "archived")).length,
    pinned: rows.filter((panel) => panel.pinned).length,
    peak: rows.filter((panel) => inTray(panel, "open") && panel.stay === 2 && peakBay(panel.bay)).length,
    late: rows.filter((panel) => lateNiche(panel, desk)).length,
    soon: rows.filter((panel) => soonNiche(panel)).length,
    stay: rows.filter((panel) => inTray(panel, "open") && panel.stay > 2).length,
    house: rows.filter((panel) => inTray(panel, "open") && houseCloth(panel.cloth)).length,
    window: windowNiches(rows, desk).length,
    matched: matchedNiches(rows, desk),
    crest: rows.filter((panel) => panel.crest).length,
    cooling: rows.filter((panel) => coolingNiche(panel)).length,
  };
}

export function nicheShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open niches as a share of every open niche. */
export function lateNicheShare(panels: readonly AisleNiche[], desk: unknown): number {
  const rows = readNiches(panels).filter((panel) => inTray(panel, "open"));
  return nicheShare(rows.filter((panel) => lateNiche(panel, desk)).length, rows.length);
}

export function usedShelves(panels: readonly AisleNiche[]): number {
  return new Set(readNiches(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay)).size;
}

/** Open niches that share a bay. */
export function clashBayCount(panels: readonly AisleNiche[]): number {
  const open = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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

/** Open niches that share a lamp. */
export function lampClashCount(panels: readonly AisleNiche[]): number {
  const open = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.lamp !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].lamp === open[j].lamp) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open niches whose bays sit exactly four bays apart. */
export function adjacentNicheCount(panels: readonly AisleNiche[]): number {
  const open = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null);
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
 * The cloth with the fewest open niches.
 * A tie keeps IVORY, then CHAMPAGNE, then GRAPHITE.
 * An empty desk still suggests IVORY.
 */
export function suggestCloth(panels: readonly AisleNiche[]): "GRAPHITE" | "CHAMPAGNE" | "IVORY" {
  const rows = readNiches(panels).filter((panel) => inTray(panel, "open"));
  const order = ["IVORY", "CHAMPAGNE", "GRAPHITE"] as const;
  let best: "IVORY" | "CHAMPAGNE" | "GRAPHITE" = "IVORY";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((panel) => panel.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The lamp with the fewest open niches.
 * A tie keeps 15, then 5, then 45.
 * An empty desk still suggests 15.
 */
export function suggestLamp(panels: readonly AisleNiche[]): 5 | 15 | 45 {
  const rows = readNiches(panels).filter((panel) => inTray(panel, "open"));
  const order = [15, 5, 45] as const;
  let best: 5 | 15 | 45 = 15;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const lamp of order) {
    const count = rows.filter((panel) => panel.lamp === lamp).length;
    if (count < bestCount) {
      best = lamp;
      bestCount = count;
    }
  }
  return best;
}

/** The newest usher already written on a niche. A blank usher is skipped. */
export function suggestUsher(panels: readonly AisleNiche[]): string {
  const found = readNiches(panels).find((panel) => panel.usher);
  return found ? found.usher : "";
}

/**
 * The usher carrying the fewest open niches.
 * A tie keeps the earlier name on the roster. A blank usher is not a load.
 * An empty roster falls back to the newest usher.
 */
export function fairUsher(panels: readonly AisleNiche[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = usherLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestUsher(panels);
  const open = readNiches(panels).filter((panel) => inTray(panel, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((panel) => panel.usher === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The usher with the most open niches. A tie keeps the name that sorts later. */
export function busiestUsher(panels: readonly AisleNiche[]): string {
  const rows = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.usher);
  const names: string[] = [];
  for (const panel of rows) if (!names.includes(panel.usher)) names.push(panel.usher);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((panel) => panel.usher === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function nicheUshers(panels: readonly AisleNiche[]): string[] {
  const out: string[] = [];
  for (const panel of readNiches(panels)) {
    if (panel.usher && !out.includes(panel.usher)) out.push(panel.usher);
  }
  return out;
}

export function nicheCloths(panels: readonly AisleNiche[]): string[] {
  const out: string[] = [];
  for (const panel of readNiches(panels)) {
    if (panel.cloth && !out.includes(panel.cloth)) out.push(panel.cloth);
  }
  return out;
}

/** Open niches whose usher also watches another open niche on a different bay. */
export function pairUsherCount(panels: readonly AisleNiche[]): number {
  const open = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.usher && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].usher === open[j].usher && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open niches that share an cloth on different shelves. */
export function sharedClothCount(panels: readonly AisleNiche[]): number {
  const open = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.cloth && panel.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].cloth === open[j].cloth && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The stay of open niches. The resting stay of 1 still counts. */
export function stayLoad(panels: readonly AisleNiche[]): number {
  return readNiches(panels).filter((panel) => inTray(panel, "open")).reduce((sum, panel) => sum + panel.stay, 0);
}

/** Open niches that are both the quiet bay and a house cloth. */
export function quietHallCount(panels: readonly AisleNiche[]): number {
  return readNiches(panels).filter((panel) => inTray(panel, "open") && quietBay(panel.bay) && houseCloth(panel.cloth)).length;
}

/** Open niches whose gait is rush. */
export function flareLoad(panels: readonly AisleNiche[]): number {
  return readNiches(panels).filter((panel) => inTray(panel, "open") && panel.gait === "flare").length;
}

export function bayWidth(panels: readonly AisleNiche[]): number {
  const shelves = readNiches(panels).filter((panel) => inTray(panel, "open") && panel.bay !== null).map((panel) => panel.bay as number);
  if (!shelves.length) return 0;
  return Math.max(...shelves) - Math.min(...shelves);
}

/** The next open niche whose bay sits ahead of the desk. An unset desk has no next niche. */
export function nextNiche(panels: readonly AisleNiche[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readNiches(panels)
    .filter((panel) => inTray(panel, "open") && panel.stay === 2 && panel.bay !== null && (panel.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveNicheFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function nicheCopy(panel: AisleNiche, desk: unknown): string {
  const gap = bayGap(panel.bay, desk);
  return [panel.title, panel.usher, panel.bay ?? "", panel.cloth, panel.gait, panel.lamp ?? "", panel.stay, panel.tags.join(" "), panel.crest ? "1" : "0", panel.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the niches saved in this browser. The gap and the late mark use the bay you pass. */
export function nichesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,usher,bay,cloth,gait,lamp,stay,tags,pinned,held,archived,crest,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readNiches(raw);
  const windowIds = new Set(windowNiches(rows, desk).map((panel) => panel.id));
  const at = bayOf(desk);
  for (const panel of rows) {
    const gap = bayGap(panel.bay, desk);
    lines.push([
      panel.title,
      panel.usher,
      panel.bay === null ? "" : String(panel.bay),
      panel.cloth,
      panel.gait,
      panel.lamp === null ? "" : String(panel.lamp),
      String(panel.stay),
      panel.tags.join(" "),
      panel.pinned ? "1" : "0",
      panel.held ? "1" : "0",
      panel.archived ? "1" : "0",
      panel.crest ? "1" : "0",
      gap === null ? "" : String(gap),
      lateNiche(panel, desk) ? "1" : "0",
      soonNiche(panel) ? "1" : "0",
      houseCloth(panel.cloth) ? "1" : "0",
      windowIds.has(panel.id) ? "1" : "0",
      at !== null && panel.bay === at && panel.stay === 2 && inTray(panel, "open") ? "1" : "0",
      coolingNiche(panel) ? "1" : "0",
      panel.note,
      panel.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeUsher(raw: string, ushers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return ushers.includes(raw) ? raw : "all";
}

export function activeCloth(raw: string, cloths: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = clothOf(raw);
  return name && cloths.map((item) => item.toUpperCase()).includes(name) ? name : cloths.includes(raw) ? raw : "all";
}

export function activeGait(raw: string, gaits: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return gaits.includes(raw) ? raw : "all";
}

export function activeBay(raw: string): string {
  if (raw === "all" || raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  return bayOf(raw) === null ? "all" : raw;
}

export function activeLamp(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return lampOf(raw) === null ? "all" : raw;
}

export function activeStay(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return stayOf(raw) === null ? "all" : raw;
}

export function usherArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function clothArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothOf(filter) || null;
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

export function lampArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lampOf(filter);
}

export function stayArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stayOf(filter);
}

function readView(raw: unknown): NicheView | null {
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
    usher: clip(row.usher, 16),
    cloth: clip(row.cloth, 12),
    gait: clip(row.gait, 8),
    bay: clip(row.bay, 8),
    lamp: clip(row.lamp, 8),
    stay: clip(row.stay, 8),
  };
}

export function readNicheViews(raw: unknown): NicheView[] {
  if (!Array.isArray(raw)) return [];
  const out: NicheView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addNicheView(views: readonly NicheView[], view: NicheView): NicheView[] {
  const current = readNicheViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropNicheView(views: readonly NicheView[], id: string): NicheView[] {
  return readNicheViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function escutcheonParts(value: EscutcheonValue): { customer: string; kind: string; status: string; ok: boolean } {
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

export function escutcheonState(value: EscutcheonValue): EscutcheonState {
  const found = escutcheonParts(value);
  if (!found.ok) return "";
  return found.customer ? "set" : "clear";
}

export function escutcheonCopy(value: EscutcheonValue): string {
  const found = escutcheonParts(value);
  return found.ok ? found.customer : "";
}

/** The mark is the first letter of each word, up to three. Digits are not letters. */
export function escutcheonMark(value: EscutcheonValue): string {
  const text = escutcheonCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the customer is a cipher. A DEPOSIT is a bell.
 * A MARGIN or a KYC document is a quill. Any other named customer is a margin.
 * A digit wins over the kind.
 */
export function escutcheonLane(value: EscutcheonValue): EscutcheonLane {
  const found = escutcheonParts(value);
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
export function escutcheonTone(value: EscutcheonValue): EscutcheonTone {
  const found = escutcheonParts(value);
  if (!found.ok || !found.customer) return "";
  if (found.status === "APPROVED" && found.kind === "DEPOSIT") return "bright";
  if (found.status === "PENDING") return "dim";
  if (found.status === "REJECTED") return "hush";
  if (found.status === "APPROVED") return "even";
  if (!found.kind && !found.status) return "mist";
  if (found.kind === "WITHDRAW") return "even";
  return "mist";
}

export function stitchedEscutcheon(value: EscutcheonValue): boolean {
  return escutcheonCopy(value).includes("/");
}

export function stitchedEscutcheonCount(rows: readonly EscutcheonRow[]): number {
  return rows.filter((row) => stitchedEscutcheon(row.note)).length;
}

export function wideEscutcheon(value: EscutcheonValue): boolean {
  return escutcheonCopy(value).length >= 12;
}

export function wideEscutcheonCount(rows: readonly EscutcheonRow[]): number {
  return rows.filter((row) => wideEscutcheon(row.note)).length;
}

export function brightEscutcheonCount(rows: readonly EscutcheonRow[]): number {
  return rows.filter((row) => escutcheonTone(row.note) === "bright").length;
}

export function marginCount(rows: readonly EscutcheonRow[]): number {
  return rows.filter((row) => escutcheonLane(row.note) === "margin").length;
}

export function cipherCount(rows: readonly EscutcheonRow[]): number {
  return rows.filter((row) => escutcheonLane(row.note) === "cipher").length;
}

export function bellCount(rows: readonly EscutcheonRow[]): number {
  return rows.filter((row) => escutcheonLane(row.note) === "bell").length;
}

export function sharedEscutcheonCount(rows: readonly EscutcheonRow[]): number {
  const marks = rows.map((row) => escutcheonMark(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(escutcheonMark(row.note))).length;
}

export function escutcheonLanes(rows: readonly EscutcheonRow[]): EscutcheonLaneLine[] {
  const lanes = ["margin", "bell", "quill", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => escutcheonLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingEscutcheon(rows: readonly EscutcheonRow[]): string {
  const lines = escutcheonLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingEscutcheonTone(rows: readonly EscutcheonRow[]): string {
  const tones = ["bright", "even", "dim", "hush", "mist"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => escutcheonTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function escutcheonShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function escutcheonStep(value: EscutcheonValue): 0 | 1 | 2 | 3 {
  const text = escutcheonCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentEscutcheonLanes(rows: readonly EscutcheonRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = escutcheonState(row.note);
    const lane = state === "set" ? escutcheonLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenEscutcheons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "margin" || lane === "bell" || lane === "quill" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedEscutcheons(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleEscutcheon(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleEscutcheonReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkEscutcheonReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleEscutcheonLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visibleEscutcheons(
  rows: readonly EscutcheonRow[],
  lane: EscutcheonLane | "blank" | null,
  tone: EscutcheonTone | null,
  query: string,
  review: EscutcheonReview,
  reviewed: readonly string[],
  shape: EscutcheonShape,
): EscutcheonRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = escutcheonState(row.note);
    if (!state) return false;
    const token = state === "set" ? escutcheonLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && escutcheonTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${escutcheonCopy(row.note)} ${escutcheonMark(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "stitch" && !stitchedEscutcheon(row.note)) return false;
    if (shape === "wide" && !wideEscutcheon(row.note)) return false;
    if (shape === "margin" && escutcheonLane(row.note) !== "margin") return false;
    if (shape === "cipher" && escutcheonLane(row.note) !== "cipher") return false;
    if (shape === "quill" && escutcheonLane(row.note) !== "quill") return false;
    return true;
  });
}

export function activeEscutcheonLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activeEscutcheonTone(raw: string): string {
  return raw === "bright" || raw === "even" || raw === "dim" || raw === "hush" || raw === "mist" || raw === "all" ? raw : "all";
}

export function escutcheonLaneArg(filter: string): EscutcheonLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "margin" || filter === "bell" || filter === "quill" || filter === "cipher") return filter;
  return null;
}

export function escutcheonToneArg(filter: string): EscutcheonTone | null {
  if (filter === "all") return null;
  if (filter === "bright" || filter === "even" || filter === "dim" || filter === "hush" || filter === "mist") return filter;
  return null;
}

export function escutcheonsCsv(rows: readonly EscutcheonRow[]): string {
  const lines = ["lane,count"];
  for (const line of escutcheonLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function escutcheonRowsCsv(rows: readonly EscutcheonRow[], reviewed: readonly string[]): string {
  const lines = ["customer,mark,lane,tone,step,stitch,wide,margin,bell,quill,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = escutcheonParts(row.note);
    if (!found.ok) continue;
    const lane = escutcheonLane(row.note);
    lines.push([
      found.customer,
      escutcheonMark(row.note),
      lane,
      escutcheonTone(row.note),
      String(escutcheonStep(row.note)),
      stitchedEscutcheon(row.note) ? "1" : "0",
      wideEscutcheon(row.note) ? "1" : "0",
      lane === "margin" ? "1" : "0",
      lane === "bell" ? "1" : "0",
      lane === "quill" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
