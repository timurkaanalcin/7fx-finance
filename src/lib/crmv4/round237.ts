/**
 * Observatory slips for risk follow-ups, and posture marks already stored as name, validation, and account type.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_observatory_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   watcher text not null default '',
 *   bay integer,
 *   glass text not null default '',
 *   gait text not null default '',
 *   span integer,
 *   weight integer not null default 1,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   seal boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_posture_mark_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_posture_mark_review (
 *   trader_id text primary key
 * );
 */

export const OBV_KEY = "crmv4-observatory-slip";
export const OBV_VIEW_KEY = "crmv4-observatory-views";
export const OBV_DENSITY_KEY = "crmv4-observatory-density";
export const PSR_KEY = "crmv4-posture-hide";
export const PSR_REVIEW_KEY = "crmv4-posture-review";

export type GlassName = "blank" | "flint" | "crystal" | "smoke";

export type GaitName = "blank" | "still" | "walk" | "rush";

export type WatchTray = "open" | "held" | "archived";

export type BayPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type WatchDensity = "airy" | "tight";

export type WatchSort = "bay" | "watcher";

export type WatchCard = {
  id: string;
  title: string;
  note: string;
  watcher: string;
  bay: number | null;
  glass: string;
  gait: string;
  span: number | null;
  weight: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  seal: boolean;
  audit: string;
};

export type WatchView = {
  id: string;
  name: string;
  tray: WatchTray;
  query: string;
  watcher: string;
  glass: string;
  gait: string;
  bay: string;
  span: string;
  weight: string;
};

export type WatchCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  weight: number;
  house: number;
  window: number;
  matched: number;
  seal: number;
  cooling: number;
};

export type PostureLane = "" | "hall" | "seal" | "queue" | "gate" | "vault" | "cipher";

export type PostureTone = "" | "gilt" | "pale" | "linen" | "ash" | "haze";

export type PostureState = "" | "clear" | "set";

export type PostureShape = "all" | "join" | "wide" | "hall" | "cipher" | "seal";

export type PostureReview = "all" | "reviewed" | "fresh";

export type PostureValue = string | { name?: unknown; check?: unknown; tier?: unknown; [key: string]: unknown } | null | undefined;

export type PostureRow = { id: string; label: string; note: PostureValue };

export type PostureLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "gait", "pin", "unpin", "hold", "resume", "archive", "open", "glass", "tag", "weight", "span", "seal"] as const;

const GLASSES = ["flint", "crystal", "smoke"] as const;

const GAITS = ["still", "walk", "rush"] as const;

const GAIT_CYCLE = ["still", "walk", "rush"] as const;

const PEAK_BAYS = new Set([2, 6]);

const QUIET_BAYS = new Set([7]);

const HOUSE = new Set(["CRYSTAL", "SMOKE"]);

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const OBV_CAP = 9;

const VIEW_CAP = 6;

const TAG_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WatchTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function glassName(raw: unknown): Exclude<GlassName, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (GLASSES as readonly string[]).includes(text) ? (text as Exclude<GlassName, "blank">) : "";
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
    if (!/^[abcd]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: WatchCard, tray: WatchTray): boolean {
  if (tray === "held") return card.held && !card.archived;
  if (tray === "archived") return card.archived;
  return !card.held && !card.archived;
}

/** A blank title is left out. The saved title stays short. */
export function watchLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function watchNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank watcher stays blank. It is not filled in. */
export function watchWatcher(raw: unknown): string {
  return clip(raw, 20);
}

/** A glass is FLINT, CRYSTAL, or SMOKE. Anything else stays blank. Letters are stored in capitals. */
export function glassOf(raw: unknown): string {
  const name = glassName(raw);
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

/** A span is 5, 15, or 60 minutes. A blank value stays unset. */
export function spanOf(raw: unknown): 5 | 15 | 60 | null {
  if (raw === 5 || raw === "5") return 5;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** Weight is 1, 4, or 7. Anything else is not a weight. 1 is the resting weight. */
export function weightOf(raw: unknown): 1 | 4 | 7 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 4 || raw === "4") return 4;
  if (raw === 7 || raw === "7") return 7;
  return null;
}

export function bayBand(bay: unknown): "blank" | "early" | "mid" | "late" {
  const value = bayOf(bay);
  if (value === null) return "blank";
  if (value <= 2) return "early";
  if (value <= 5) return "mid";
  return "late";
}

/** Peak bays are 2 and 6. An unset bay is not a peak bay. */
export function peakBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && PEAK_BAYS.has(value);
}

/** The quiet bay is 7. A peak bay is not quiet. An unset bay is not quiet. */
export function quietBay(bay: unknown): boolean {
  const value = bayOf(bay);
  return value !== null && QUIET_BAYS.has(value);
}

/**
 * How far a bay sits behind the desk bay.
 * A positive gap means the slip is behind. A negative gap means it is ahead.
 * A gap of zero means the same bay. An unset bay has no gap. Bays do not wrap.
 */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayOf(bay);
  const at = bayOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** CRYSTAL and SMOKE are house glass. FLINT is a guest glass. A blank glass is not house glass. */
export function houseGlass(glass: unknown): boolean {
  return HOUSE.has(glassOf(glass));
}

export function watchDensity(raw: unknown): WatchDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function watchSort(raw: unknown): WatchSort {
  return raw === "watcher" ? "watcher" : "bay";
}

function readOne(raw: unknown): WatchCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = clip(row.id, 40);
  const title = watchLine(row.title);
  if (!id || !title) return null;
  const weight = weightOf(row.weight);
  return {
    id,
    title,
    note: watchNote(row.note),
    watcher: watchWatcher(row.watcher),
    bay: bayOf(row.bay),
    glass: glassOf(row.glass),
    gait: gaitName(row.gait),
    span: spanOf(row.span),
    weight: weight === null ? 1 : weight,
    tags: tagsOf(row.tags),
    pinned: row.pinned === true,
    held: row.held === true,
    archived: row.archived === true,
    seal: row.seal === true,
    audit: auditCode(row.audit),
  };
}

export function readWatches(raw: unknown): WatchCard[] {
  if (!Array.isArray(raw)) return [];
  const out: WatchCard[] = [];
  for (const item of raw) {
    const card = readOne(item);
    if (!card || out.some((row) => row.id === card.id || row.title === card.title)) continue;
    out.push(card);
  }
  return out.slice(0, OBV_CAP);
}

export function addWatch(
  cards: readonly WatchCard[],
  card: {
    id: string;
    title: string;
    note?: string;
    watcher?: string;
    bay?: unknown;
    glass?: string;
    gait?: string;
    span?: unknown;
    weight?: unknown;
    tags?: unknown;
  },
): WatchCard[] {
  const current = readWatches(cards);
  const id = String(card.id || "").trim();
  const title = watchLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const weight = weightOf(card.weight);
  const next: WatchCard = {
    id,
    title,
    note: watchNote(card.note),
    watcher: watchWatcher(card.watcher),
    bay: bayOf(card.bay),
    glass: glassOf(card.glass),
    gait: gaitName(card.gait),
    span: spanOf(card.span),
    weight: weight === null ? 1 : weight,
    tags: tagsOf(card.tags),
    pinned: false,
    held: false,
    archived: false,
    seal: false,
    audit: "save",
  };
  return [next, ...current].slice(0, OBV_CAP);
}

/** A blank gait becomes still, still becomes walk, walk becomes rush, and rush returns to still. */
export function cycleGait(cards: readonly WatchCard[], id: string): WatchCard[] {
  return readWatches(cards).map((card) => {
    if (card.id !== id) return card;
    const at = GAIT_CYCLE.indexOf(card.gait as (typeof GAIT_CYCLE)[number]);
    const next = at < 0 ? GAIT_CYCLE[0] : GAIT_CYCLE[(at + 1) % GAIT_CYCLE.length];
    if (!next || next === card.gait) return card;
    return { ...card, gait: next, audit: "gait" };
  });
}

/** A blank title is left as it is. */
export function editWatch(cards: readonly WatchCard[], id: string, title: unknown): WatchCard[] {
  const next = watchLine(title);
  if (!next) return readWatches(cards);
  const current = readWatches(cards);
  if (current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

export function editWatchNote(cards: readonly WatchCard[], id: string, note: unknown): WatchCard[] {
  const next = watchNote(note);
  return readWatches(cards).map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "note" } : card));
}

export function addWatchTag(cards: readonly WatchCard[], id: string, tag: unknown): WatchCard[] {
  const next = tagsOf(tag);
  if (!next.length) return readWatches(cards);
  return readWatches(cards).map((card) => {
    if (card.id !== id) return card;
    const tags = tagsOf([...card.tags, ...next]);
    if (tags.join() === card.tags.join()) return card;
    return { ...card, tags, audit: "tag" };
  });
}

export function setWatchWeight(cards: readonly WatchCard[], id: string, weight: unknown): WatchCard[] {
  const next = weightOf(weight);
  if (next === null) return readWatches(cards);
  return readWatches(cards).map((card) => (card.id === id && card.weight !== next ? { ...card, weight: next, audit: "weight" } : card));
}

/** Snooze steps a blank span to 15, 5 to 15, and 15 to 60. A span of 60 stays. */
export function snoozeWatch(cards: readonly WatchCard[], id: string): WatchCard[] {
  return readWatches(cards).map((card) => {
    if (card.id !== id || card.span === 60) return card;
    const next = card.span === 15 ? 60 : 15;
    return { ...card, span: next, audit: "span" };
  });
}

export function setWatchPin(cards: readonly WatchCard[], id: string, pinned: boolean): WatchCard[] {
  return readWatches(cards).map((card) => (card.id === id && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function pinFocusedWatch(cards: readonly WatchCard[], shownIds: readonly string[], index: number): WatchCard[] {
  const id = shownIds[index];
  if (!id) return readWatches(cards);
  const card = readWatches(cards).find((item) => item.id === id);
  if (!card) return readWatches(cards);
  return setWatchPin(cards, id, !card.pinned);
}

export function snoozeFocusedWatch(cards: readonly WatchCard[], shownIds: readonly string[], index: number): WatchCard[] {
  const id = shownIds[index];
  return id ? snoozeWatch(cards, id) : readWatches(cards);
}

export function holdFocusedWatch(cards: readonly WatchCard[], shownIds: readonly string[], index: number): WatchCard[] {
  const id = shownIds[index];
  if (!id) return readWatches(cards);
  const card = readWatches(cards).find((item) => item.id === id);
  if (!card || card.archived) return readWatches(cards);
  return setWatchHold(cards, id, !card.held);
}

export function gaitFocusedWatch(cards: readonly WatchCard[], shownIds: readonly string[], index: number): WatchCard[] {
  const id = shownIds[index];
  return id ? cycleGait(cards, id) : readWatches(cards);
}

export function sealFocusedWatch(cards: readonly WatchCard[], shownIds: readonly string[], index: number): WatchCard[] {
  const id = shownIds[index];
  if (!id) return readWatches(cards);
  const card = readWatches(cards).find((item) => item.id === id);
  if (!card) return readWatches(cards);
  return setWatchSeal(cards, id, !card.seal);
}

export function setWatchHold(cards: readonly WatchCard[], id: string, held: boolean): WatchCard[] {
  return readWatches(cards).map((card) => (card.id === id && !card.archived && card.held !== held ? { ...card, held, audit: held ? "hold" : "resume" } : card));
}

export function setWatchArchive(cards: readonly WatchCard[], id: string, archived: boolean): WatchCard[] {
  return readWatches(cards).map((card) => (card.id === id && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function setWatchSeal(cards: readonly WatchCard[], id: string, seal: boolean): WatchCard[] {
  return readWatches(cards).map((card) => (card.id === id && card.seal !== seal ? { ...card, seal, audit: "seal" } : card));
}

export function bulkWatchGlass(cards: readonly WatchCard[], ids: readonly string[], glass: unknown): WatchCard[] {
  const next = glassOf(glass);
  if (!next) return readWatches(cards);
  const want = new Set(ids);
  return readWatches(cards).map((card) => (want.has(card.id) && card.glass !== next ? { ...card, glass: next, audit: "glass" } : card));
}

export function bulkWatchPin(cards: readonly WatchCard[], ids: readonly string[], pinned: boolean): WatchCard[] {
  const want = new Set(ids);
  return readWatches(cards).map((card) => (want.has(card.id) && card.pinned !== pinned ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkWatchArchive(cards: readonly WatchCard[], ids: readonly string[], archived: boolean): WatchCard[] {
  const want = new Set(ids);
  return readWatches(cards).map((card) => (want.has(card.id) && card.archived !== archived ? { ...card, archived, held: archived ? false : card.held, audit: archived ? "archive" : "open" } : card));
}

export function bulkWatchGait(cards: readonly WatchCard[], ids: readonly string[], gait: unknown): WatchCard[] {
  const next = gaitName(gait);
  if (!next) return readWatches(cards);
  const want = new Set(ids);
  return readWatches(cards).map((card) => (want.has(card.id) && card.gait !== next ? { ...card, gait: next, audit: "gait" } : card));
}

export function bulkWatchTag(cards: readonly WatchCard[], ids: readonly string[], tag: unknown): WatchCard[] {
  const want = new Set(ids);
  return ids.reduce((rows, id) => (want.has(id) ? addWatchTag(rows, id, tag) : rows), readWatches(cards));
}

export function resetWatches(): WatchCard[] {
  return [];
}

/** An open slip whose bay sits more than two bays behind the desk. A raised weight, a hold, or an archive is not late. */
export function lateWatch(card: WatchCard, desk: unknown): boolean {
  const gap = bayGap(card.bay, desk);
  return inTray(card, "open") && card.weight === 1 && gap !== null && gap > 2;
}

/** An open slip with a span of 5 minutes is due now. A raised weight, a hold, or an archive is not. */
export function soonWatch(card: WatchCard): boolean {
  return inTray(card, "open") && card.weight === 1 && card.span === 5;
}

/** An open resting slip on a rush gait whose bay is 7. That quiet rush is cooling. */
export function coolingWatch(card: WatchCard): boolean {
  return inTray(card, "open") && card.weight === 1 && card.gait === "rush" && card.bay === 7;
}

/** Open slips that are late or due now. A raised slip stays off the reminder list. */
export function reminderWatches(cards: readonly WatchCard[], desk: unknown): WatchCard[] {
  return readWatches(cards).filter((card) => lateWatch(card, desk) || soonWatch(card));
}

export function coolingWatches(cards: readonly WatchCard[]): WatchCard[] {
  return readWatches(cards).filter((card) => coolingWatch(card));
}

/** Open slips whose bay sits within three bays of the desk. A raised weight, a hold, or an archive stays out. */
export function windowWatches(cards: readonly WatchCard[], desk: unknown): WatchCard[] {
  return readWatches(cards).filter((card) => {
    const gap = bayGap(card.bay, desk);
    return inTray(card, "open") && card.weight === 1 && gap !== null && gap >= -3 && gap <= 3;
  });
}

export function matchedWatches(cards: readonly WatchCard[], desk: unknown): number {
  const at = bayOf(desk);
  if (at === null) return 0;
  return readWatches(cards).filter((card) => inTray(card, "open") && card.weight === 1 && card.bay === at).length;
}

function bayHit(bay: number | null, exact: number | null, pick: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (pick === null) return true;
  if (pick === "blank") return bay === null;
  if (pick === "peak") return peakBay(bay);
  if (pick === "quiet") return quietBay(bay);
  return bayBand(bay) === pick;
}

/** Search matches the title, the note, the watcher, and the tags. */
export function visibleWatches(
  cards: readonly WatchCard[],
  tray: WatchTray,
  query: string,
  watcher: string | null,
  glass: string | null,
  gait: string | null,
  exact: number | null,
  pick: BayPick | null,
  span: number | "blank" | null,
  weight: number | "blank" | null,
  rushOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  restingOnly: boolean,
): WatchCard[] {
  const text = query.trim().toLowerCase();
  return readWatches(cards).filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text) {
      const hay = `${card.title} ${card.note} ${card.watcher} ${card.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (watcher !== null && card.watcher !== watcher) return false;
    if (glass === "blank" ? Boolean(card.glass) : glass && card.glass !== glass) return false;
    if (gait === "blank" ? Boolean(card.gait) : gait && card.gait !== gait) return false;
    if (!bayHit(card.bay, exact, pick)) return false;
    if (span === "blank" ? card.span !== null : span !== null && card.span !== span) return false;
    if (weight === "blank" ? card.weight !== 1 : weight !== null && card.weight !== weight) return false;
    if (rushOnly && card.gait !== "rush") return false;
    if (peakOnly && !peakBay(card.bay)) return false;
    if (houseOnly && !houseGlass(card.glass)) return false;
    if (quietOnly && !quietBay(card.bay)) return false;
    if (restingOnly && card.weight !== 1) return false;
    return true;
  });
}

export function sortWatches(cards: readonly WatchCard[], mode: WatchSort): WatchCard[] {
  const rows = cards.slice();
  if (mode === "watcher") return rows.sort((a, b) => a.watcher.localeCompare(b.watcher) || (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
  return rows.sort((a, b) => (a.bay ?? 99) - (b.bay ?? 99) || a.title.localeCompare(b.title));
}

export function watchIndex(cards: readonly WatchCard[], query: string): WatchCard[] {
  const text = query.trim().toLowerCase();
  return sortWatches(
    readWatches(cards).filter((card) => card.bay !== null && (!text || card.title.toLowerCase().includes(text))),
    "bay",
  );
}

/** Open slips grouped by bay, earliest bay first. A blank bay stays off the timeline. */
export function watchTimeline(cards: readonly WatchCard[]): { bay: number; titles: string[] }[] {
  const rows = readWatches(cards).filter((card) => inTray(card, "open") && card.bay !== null);
  const bays = Array.from(new Set(rows.map((card) => card.bay as number))).sort((a, b) => a - b);
  return bays.map((bay) => ({
    bay,
    titles: rows.filter((card) => card.bay === bay).map((card) => card.title).sort((a, b) => a.localeCompare(b)),
  }));
}

export function watchCounts(cards: readonly WatchCard[], desk: unknown): WatchCounts {
  const rows = readWatches(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    archived: rows.filter((card) => inTray(card, "archived")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => inTray(card, "open") && card.weight === 1 && peakBay(card.bay)).length,
    late: rows.filter((card) => lateWatch(card, desk)).length,
    soon: rows.filter((card) => soonWatch(card)).length,
    weight: rows.filter((card) => inTray(card, "open") && card.weight > 1).length,
    house: rows.filter((card) => inTray(card, "open") && houseGlass(card.glass)).length,
    window: windowWatches(rows, desk).length,
    matched: matchedWatches(rows, desk),
    seal: rows.filter((card) => card.seal).length,
    cooling: rows.filter((card) => coolingWatch(card)).length,
  };
}

export function watchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Late open slips as a share of every open slip. */
export function lateWatchShare(cards: readonly WatchCard[], desk: unknown): number {
  const rows = readWatches(cards).filter((card) => inTray(card, "open"));
  return watchShare(rows.filter((card) => lateWatch(card, desk)).length, rows.length);
}

export function usedBays(cards: readonly WatchCard[]): number {
  return new Set(readWatches(cards).filter((card) => inTray(card, "open") && card.bay !== null).map((card) => card.bay)).size;
}

/** Open slips that share a bay. */
export function clashBayCount(cards: readonly WatchCard[]): number {
  const open = readWatches(cards).filter((card) => inTray(card, "open") && card.bay !== null);
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

/** Open slips that share a span. */
export function spanClashCount(cards: readonly WatchCard[]): number {
  const open = readWatches(cards).filter((card) => inTray(card, "open") && card.span !== null);
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

/** Open slips whose bays sit exactly three bays apart. */
export function adjacentWatchCount(cards: readonly WatchCard[]): number {
  const open = readWatches(cards).filter((card) => inTray(card, "open") && card.bay !== null);
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
 * The glass with the fewest open slips.
 * A tie keeps CRYSTAL, then SMOKE, then FLINT.
 * An empty desk still suggests CRYSTAL.
 */
export function suggestGlass(cards: readonly WatchCard[]): "CRYSTAL" | "SMOKE" | "FLINT" {
  const rows = readWatches(cards).filter((card) => inTray(card, "open"));
  const order = ["CRYSTAL", "SMOKE", "FLINT"] as const;
  let best: "CRYSTAL" | "SMOKE" | "FLINT" = "CRYSTAL";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const glass of order) {
    const count = rows.filter((card) => card.glass === glass).length;
    if (count < bestCount) {
      best = glass;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open slips.
 * A tie keeps 15, then 5, then 60.
 * An empty desk still suggests 15.
 */
export function suggestSpan(cards: readonly WatchCard[]): 5 | 15 | 60 {
  const rows = readWatches(cards).filter((card) => inTray(card, "open"));
  const order = [15, 5, 60] as const;
  let best: 5 | 15 | 60 = 15;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((card) => card.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/** The newest watcher already written on a slip. A blank watcher is skipped. */
export function suggestWatcher(cards: readonly WatchCard[]): string {
  const found = readWatches(cards).find((card) => card.watcher);
  return found ? found.watcher : "";
}

/**
 * The watcher carrying the fewest open slips.
 * A tie keeps the earlier name on the roster. A blank watcher is not a load.
 * An empty roster falls back to the newest watcher.
 */
export function fairWatcher(cards: readonly WatchCard[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = watchWatcher(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestWatcher(cards);
  const open = readWatches(cards).filter((card) => inTray(card, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.watcher === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The watcher with the most open slips. A tie keeps the name that sorts later. */
export function busiestWatcher(cards: readonly WatchCard[]): string {
  const rows = readWatches(cards).filter((card) => inTray(card, "open") && card.watcher);
  const names: string[] = [];
  for (const card of rows) if (!names.includes(card.watcher)) names.push(card.watcher);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((card) => card.watcher === name).length;
    if (count > bestCount || (count === bestCount && name.localeCompare(best) > 0)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function watchWatchers(cards: readonly WatchCard[]): string[] {
  const out: string[] = [];
  for (const card of readWatches(cards)) {
    if (card.watcher && !out.includes(card.watcher)) out.push(card.watcher);
  }
  return out;
}

export function watchGlasses(cards: readonly WatchCard[]): string[] {
  const out: string[] = [];
  for (const card of readWatches(cards)) {
    if (card.glass && !out.includes(card.glass)) out.push(card.glass);
  }
  return out;
}

/** Open slips whose watcher also watches another open slip on a different bay. */
export function pairWatchCount(cards: readonly WatchCard[]): number {
  const open = readWatches(cards).filter((card) => inTray(card, "open") && card.watcher && card.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].watcher === open[j].watcher && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** Open slips that share a glass on different bays. */
export function sharedGlassCount(cards: readonly WatchCard[]): number {
  const open = readWatches(cards).filter((card) => inTray(card, "open") && card.glass && card.bay !== null);
  const hit = new Set<string>();
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (open[i].glass === open[j].glass && open[i].bay !== open[j].bay) {
        hit.add(open[i].id);
        hit.add(open[j].id);
      }
    }
  }
  return hit.size;
}

/** The weight of open slips. The resting weight of 1 still counts. */
export function weightLoad(cards: readonly WatchCard[]): number {
  return readWatches(cards).filter((card) => inTray(card, "open")).reduce((sum, card) => sum + card.weight, 0);
}

/** Open slips that are both the quiet bay and a house glass. */
export function quietHallWatches(cards: readonly WatchCard[]): number {
  return readWatches(cards).filter((card) => inTray(card, "open") && quietBay(card.bay) && houseGlass(card.glass)).length;
}

/** Open slips whose gait is rush. */
export function rushWatchLoad(cards: readonly WatchCard[]): number {
  return readWatches(cards).filter((card) => inTray(card, "open") && card.gait === "rush").length;
}

export function bayWidth(cards: readonly WatchCard[]): number {
  const bays = readWatches(cards).filter((card) => inTray(card, "open") && card.bay !== null).map((card) => card.bay as number);
  if (!bays.length) return 0;
  return Math.max(...bays) - Math.min(...bays);
}

/** The next open slip whose bay sits ahead of the desk. An unset desk has no next slip. */
export function nextWatch(cards: readonly WatchCard[], desk: unknown): string {
  const at = bayOf(desk);
  if (at === null) return "";
  const rows = readWatches(cards)
    .filter((card) => inTray(card, "open") && card.weight === 1 && card.bay !== null && (card.bay as number) > at)
    .sort((a, b) => (a.bay || 0) - (b.bay || 0) || a.title.localeCompare(b.title));
  return rows[0]?.title || "";
}

export function moveWatchFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function watchCopy(card: WatchCard, desk: unknown): string {
  const gap = bayGap(card.bay, desk);
  return [card.title, card.watcher, card.bay ?? "", card.glass, card.gait, card.span ?? "", card.weight, card.tags.join(" "), card.seal ? "1" : "0", card.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the bay you pass. */
export function watchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,watcher,bay,glass,gait,span,weight,tags,pinned,held,archived,seal,gap,late,due,house,window,matched,cooling,note,audit"];
  const rows = readWatches(raw);
  const windowIds = new Set(windowWatches(rows, desk).map((card) => card.id));
  const at = bayOf(desk);
  for (const card of rows) {
    const gap = bayGap(card.bay, desk);
    lines.push([
      card.title,
      card.watcher,
      card.bay === null ? "" : String(card.bay),
      card.glass,
      card.gait,
      card.span === null ? "" : String(card.span),
      String(card.weight),
      card.tags.join(" "),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.archived ? "1" : "0",
      card.seal ? "1" : "0",
      gap === null ? "" : String(gap),
      lateWatch(card, desk) ? "1" : "0",
      soonWatch(card) ? "1" : "0",
      houseGlass(card.glass) ? "1" : "0",
      windowIds.has(card.id) ? "1" : "0",
      at !== null && card.bay === at && card.weight === 1 && inTray(card, "open") ? "1" : "0",
      coolingWatch(card) ? "1" : "0",
      card.note,
      card.audit,
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function activeWatcher(raw: string, watchers: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  return watchers.includes(raw) ? raw : "all";
}

export function activeGlass(raw: string, glasses: readonly string[]): string {
  if (raw === "all" || raw === "blank") return raw;
  const name = glassOf(raw);
  return name && glasses.map((item) => item.toUpperCase()).includes(name) ? name : glasses.includes(raw) ? raw : "all";
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

export function activeWeight(raw: string): string {
  if (raw === "all" || raw === "blank") return raw;
  return weightOf(raw) === null ? "all" : raw;
}

export function watcherArg(filter: string): string | null {
  if (filter === "all") return null;
  return filter === "blank" ? "" : filter;
}

export function glassArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return glassOf(filter) || null;
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

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

function readView(raw: unknown): WatchView | null {
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
    watcher: clip(row.watcher, 20),
    glass: clip(row.glass, 12),
    gait: clip(row.gait, 8),
    bay: clip(row.bay, 8),
    span: clip(row.span, 8),
    weight: clip(row.weight, 8),
  };
}

export function readWatchViews(raw: unknown): WatchView[] {
  if (!Array.isArray(raw)) return [];
  const out: WatchView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addWatchView(views: readonly WatchView[], view: WatchView): WatchView[] {
  const current = readWatchViews(views);
  const name = clip(view.name, 24);
  const id = clip(view.id, 40);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{ ...view, id, name }, ...current].slice(0, VIEW_CAP);
}

export function dropWatchView(views: readonly WatchView[], id: string): WatchView[] {
  return readWatchViews(views).filter((view) => view.id !== id);
}

function textOk(raw: unknown): boolean {
  return raw === undefined || raw === null || typeof raw === "string";
}

function postureParts(value: PostureValue): { name: string; check: string; tier: string; ok: boolean } {
  if (typeof value === "string") return { name: clip(value, 48), check: "", tier: "", ok: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { name: "", check: "", tier: "", ok: false };
  if (MONEY_KEYS.some((key) => key in value)) return { name: "", check: "", tier: "", ok: false };
  if (!("name" in value) && !("check" in value) && !("tier" in value)) {
    return { name: "", check: "", tier: "", ok: false };
  }
  const nameRaw = "name" in value ? value.name : "";
  const checkRaw = "check" in value ? value.check : "";
  const tierRaw = "tier" in value ? value.tier : "";
  if (!textOk(nameRaw) || !textOk(checkRaw) || !textOk(tierRaw)) {
    return { name: "", check: "", tier: "", ok: false };
  }
  return {
    name: clip(nameRaw, 48),
    check: clip(checkRaw, 16).toUpperCase(),
    tier: clip(tierRaw, 16).toUpperCase(),
    ok: true,
  };
}

export function postureState(value: PostureValue): PostureState {
  const found = postureParts(value);
  if (!found.ok) return "";
  return found.name ? "set" : "clear";
}

export function postureCopy(value: PostureValue): string {
  const found = postureParts(value);
  return found.ok ? found.name : "";
}

/** The posture mark is the first letter of each word, up to two. Digits are not letters. */
export function postureSigil(value: PostureValue): string {
  const text = postureCopy(value).replace(/[^A-Za-z\s]/g, " ").trim();
  if (!text) return "";
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * A digit in the name is a cipher. Verified is a seal. Pending is a queue.
 * Rejected is a gate. Unverified is a vault. A blank validation is a hall.
 * Any other validation is a vault. A digit wins.
 */
export function postureLane(value: PostureValue): PostureLane {
  const found = postureParts(value);
  if (!found.ok || !found.name) return "";
  if (/\d/.test(found.name)) return "cipher";
  if (!found.check) return "hall";
  if (found.check === "VERIFIED") return "seal";
  if (found.check === "PENDING") return "queue";
  if (found.check === "REJECTED") return "gate";
  return "vault";
}

/**
 * A demo account is ash. A VIP account is gilt. A pro account is linen.
 * A standard account is pale. A blank account type, or any other type, is haze.
 */
export function postureTone(value: PostureValue): PostureTone {
  const found = postureParts(value);
  if (!found.ok || !found.name) return "";
  if (found.tier === "DEMO") return "ash";
  if (found.tier === "VIP") return "gilt";
  if (found.tier === "PRO") return "linen";
  if (found.tier === "STANDARD") return "pale";
  return "haze";
}

export function joinedPosture(value: PostureValue): boolean {
  return postureCopy(value).includes("+");
}

export function joinedPostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => joinedPosture(row.note)).length;
}

export function widePosture(value: PostureValue): boolean {
  return postureCopy(value).length >= 12;
}

export function widePostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => widePosture(row.note)).length;
}

export function giltPostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureTone(row.note) === "gilt").length;
}

export function hallPostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureLane(row.note) === "hall").length;
}

export function queuePostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureLane(row.note) === "queue").length;
}

export function gatePostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureLane(row.note) === "gate").length;
}

export function sealPostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureLane(row.note) === "seal").length;
}

export function vaultPostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureLane(row.note) === "vault").length;
}

export function cipherPostureCount(rows: readonly PostureRow[]): number {
  return rows.filter((row) => postureLane(row.note) === "cipher").length;
}

export function sharedPostureCount(rows: readonly PostureRow[]): number {
  const marks = rows.map((row) => postureSigil(row.note)).filter(Boolean);
  const hit = new Set<string>();
  for (const mark of marks) {
    if (marks.filter((item) => item === mark).length > 1) hit.add(mark);
  }
  return rows.filter((row) => hit.has(postureSigil(row.note))).length;
}

export function postureLanes(rows: readonly PostureRow[]): PostureLaneLine[] {
  const lanes = ["hall", "seal", "queue", "gate", "vault", "cipher"] as const;
  return lanes.map((lane) => ({ lane, count: rows.filter((row) => postureLane(row.note) === lane).length })).filter((line) => line.count > 0);
}

/** The busiest lane. A tie keeps the lane that sorts later. */
export function leadingPosture(rows: readonly PostureRow[]): string {
  const lines = postureLanes(rows);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.lane.localeCompare(a.lane))[0].lane;
}

export function leadingPostureTone(rows: readonly PostureRow[]): string {
  const tones = ["gilt", "pale", "linen", "ash", "haze"] as const;
  const lines = tones.map((tone) => ({ tone, count: rows.filter((row) => postureTone(row.note) === tone).length })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || b.tone.localeCompare(a.tone))[0].tone;
}

export function postureShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** 0 is blank, 1 is one word, 2 is two words, 3 is three words or more. */
export function postureStep(value: PostureValue): 0 | 1 | 2 | 3 {
  const text = postureCopy(value);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 1) return 1;
  if (words === 2) return 2;
  return 3;
}

export function presentPostureLanes(rows: readonly PostureRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = postureState(row.note);
    const lane = state === "set" ? postureLane(row.note) : state === "clear" ? "blank" : "";
    if (lane && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readHiddenPostures(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if ((lane === "hall" || lane === "seal" || lane === "queue" || lane === "gate" || lane === "vault" || lane === "cipher" || lane === "blank") && present.includes(lane) && !out.includes(lane)) out.push(lane);
  }
  return out;
}

export function readReviewedPostures(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function togglePosture(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePostureReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPostureReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePostureLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return [...present];
  return present.filter((lane) => !hidden.includes(lane));
}

export function visiblePostures(
  rows: readonly PostureRow[],
  lane: PostureLane | "blank" | null,
  tone: PostureTone | null,
  query: string,
  review: PostureReview,
  reviewed: readonly string[],
  shape: PostureShape,
): PostureRow[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = postureState(row.note);
    if (!state) return false;
    const token = state === "set" ? postureLane(row.note) : "blank";
    if (lane === "blank" ? state !== "clear" : lane && token !== lane) return false;
    if (tone && postureTone(row.note) !== tone) return false;
    if (text && !`${row.label} ${postureCopy(row.note)} ${postureSigil(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !reviewed.includes(row.id)) return false;
    if (review === "fresh" && reviewed.includes(row.id)) return false;
    if (shape === "join" && !joinedPosture(row.note)) return false;
    if (shape === "wide" && !widePosture(row.note)) return false;
    if (shape === "hall" && postureLane(row.note) !== "hall") return false;
    if (shape === "cipher" && postureLane(row.note) !== "cipher") return false;
    if (shape === "seal" && postureLane(row.note) !== "seal") return false;
    return true;
  });
}

export function activePostureLane(raw: string, present: readonly string[]): string {
  if (raw === "all") return raw;
  return present.includes(raw) ? raw : "all";
}

export function activePostureTone(raw: string): string {
  return raw === "gilt" || raw === "pale" || raw === "linen" || raw === "ash" || raw === "haze" || raw === "all" ? raw : "all";
}

export function postureLaneArg(filter: string): PostureLane | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  if (filter === "hall" || filter === "seal" || filter === "queue" || filter === "gate" || filter === "vault" || filter === "cipher") return filter;
  return null;
}

export function postureToneArg(filter: string): PostureTone | null {
  if (filter === "all") return null;
  if (filter === "gilt" || filter === "pale" || filter === "linen" || filter === "ash" || filter === "haze") return filter;
  return null;
}

export function posturesCsv(rows: readonly PostureRow[]): string {
  const lines = ["lane,count"];
  for (const line of postureLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return `${lines.join("\n")}\n`;
}

export function postureRowsCsv(rows: readonly PostureRow[], reviewed: readonly string[]): string {
  const lines = ["name,mark,lane,tone,step,join,wide,hall,queue,gate,seal,vault,cipher,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const found = postureParts(row.note);
    if (!found.ok) continue;
    const lane = postureLane(row.note);
    lines.push([
      found.name,
      postureSigil(row.note),
      lane,
      postureTone(row.note),
      String(postureStep(row.note)),
      joinedPosture(row.note) ? "1" : "0",
      widePosture(row.note) ? "1" : "0",
      lane === "hall" ? "1" : "0",
      lane === "queue" ? "1" : "0",
      lane === "gate" ? "1" : "0",
      lane === "seal" ? "1" : "0",
      lane === "vault" ? "1" : "0",
      lane === "cipher" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}
