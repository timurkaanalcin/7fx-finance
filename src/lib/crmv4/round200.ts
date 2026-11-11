/**
 * Atelier sittings for the retention desk, and surname crests already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_atelier_sitting (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   hour integer,
 *   room text not null default '',
 *   stage text not null default '',
 *   light integer,
 *   stay integer,
 *   tags text not null default '',
 *   pause integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_crest_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_crest_review (
 *   customer_id text primary key
 * );
 */

export const SIT_KEY = "crmv4-atelier-sitting";
export const SIT_VIEW_KEY = "crmv4-atelier-views";
export const SIT_DENSITY_KEY = "crmv4-atelier-density";
export const CRS_KEY = "crmv4-crest-hide";
export const CRS_REVIEW_KEY = "crmv4-crest-review";

export type SitRoom = "blank" | "ivory" | "graphite" | "champagne";

export type SitStage = "blank" | "listed" | "greeted" | "seated";

export type SitTray = "open" | "held" | "closed";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "quiet";

export type SitDensity = "roomy" | "tight";

export type SitSort = "hour" | "title";

export type AtelierSitting = {
  id: string;
  title: string;
  note: string;
  host: string;
  hour: number | null;
  room: string;
  stage: string;
  light: number | null;
  stay: number | null;
  tags: string[];
  pause: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type SitView = {
  id: string;
  name: string;
  tray: SitTray;
  query: string;
  host: string;
  room: string;
  stage: string;
  hour: string;
  light: string;
  stay: string;
};

export type SitCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  pause: number;
  house: number;
};

export type CrestState = "" | "set" | "clear";

export type CrestBand = "" | "seed" | "pair";

export type CrestTone = "" | "gilt" | "ink";

export type CrestShape = "all" | "catalog" | "pair" | "gilt";

export type CrestValue =
  | { name?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type CrestRow = { id: string; note?: CrestValue; label?: string | null };

export type CrestBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "stage", "pin", "unpin", "hold", "lift", "close", "open", "room", "tag", "pause"] as const;

const ROOMS = ["ivory", "graphite", "champagne"] as const;

const STAGES = ["listed", "greeted", "seated"] as const;

const STAGE_ORDER = ["", "listed", "greeted", "seated"] as const;

const PEAK_HOURS = new Set([10, 12, 16]);

const QUIET_HOURS = new Set([8, 18]);

const HOUSE = new Set(["IVORY", "CHAMPAGNE"]);

const CREST_BANDS = ["seed", "pair"] as const;

const CATALOG = new Set(["AN", "ER", "ON"]);

const CREST_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const SITTING_CAP = 8;

const VIEW_CAP = 5;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SitTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function roomName(raw: unknown): Exclude<SitRoom, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (ROOMS as readonly string[]).includes(text) ? (text as Exclude<SitRoom, "blank">) : "";
}

function stageName(raw: unknown): Exclude<SitStage, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (STAGES as readonly string[]).includes(text) ? (text as Exclude<SitStage, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function sittingLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function sittingNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A room is IVORY, GRAPHITE, or CHAMPAGNE. Anything else stays blank. Letters are stored in capitals. */
export function roomOf(raw: unknown): string {
  const name = roomName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An hour is an integer from 8 through 18.
 * A blank value stays unset. 7 and 19 are not hours.
 * A leading zero is not an hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 8 || raw > 18) return null;
    return raw;
  }
  const text = clip(raw, 3);
  if (!/^(8|9|1[0-8])$/.test(text)) return null;
  return Number(text);
}

/** A light is 1, 3, or 5. A blank value stays unset. A leading zero is not a light. */
export function lightOf(raw: unknown): 1 | 3 | 5 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 3 || raw === "3") return 3;
  if (raw === 5 || raw === "5") return 5;
  return null;
}

/** A stay is 20, 40, or 60 minutes. A blank value stays unset. A leading zero is not a stay. */
export function stayOf(raw: unknown): 20 | 40 | 60 | null {
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** A pause is 0, 20, or 40. Anything else is not a pause. */
export function pauseOf(raw: unknown): 0 | 20 | 40 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 20 || raw === "20") return 20;
  if (raw === 40 || raw === "40") return 40;
  return null;
}

export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 10) return "early";
  if (value <= 14) return "mid";
  return "late";
}

/** Peak hours are 10, 12, and 16. An unset hour is not a peak hour. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 8 and 18. A peak hour is not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * How far an hour sits behind the desk hour.
 * A positive gap means the sitting hour is behind. A negative gap means it is ahead.
 * A gap of zero means the same hour. An unset hour has no gap. Hours do not wrap.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

/** IVORY and CHAMPAGNE are house rooms. GRAPHITE is a guest room. A blank room is not a house room. */
export function houseRoom(room: unknown): boolean {
  return HOUSE.has(roomOf(room));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): SitDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): SitSort {
  return raw === "title" ? "title" : "hour";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 4).toLowerCase();
  return /^[a-z]$/.test(text) ? text : "";
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

function readOne(raw: unknown): AtelierSitting | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AtelierSitting>;
  const id = clip(row.id, 24);
  const title = sittingLine(row.title);
  if (!id || !title) return null;
  const pause = pauseOf(row.pause);
  return {
    id,
    title,
    note: sittingNote(row.note),
    host: hostLabel(row.host),
    hour: hourOf(row.hour),
    room: roomOf(row.room),
    stage: stageName(row.stage),
    light: lightOf(row.light),
    stay: stayOf(row.stay),
    tags: tagsOf(row.tags),
    pause: pause === null ? 0 : pause,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readSittings(raw: unknown): AtelierSitting[] {
  if (!Array.isArray(raw)) return [];
  const out: AtelierSitting[] = [];
  for (const item of raw) {
    const sitting = readOne(item);
    if (!sitting || out.some((row) => row.id === sitting.id || row.title === sitting.title)) continue;
    out.push(sitting);
  }
  return out.slice(0, SITTING_CAP);
}

export function addSitting(
  sittings: readonly AtelierSitting[],
  sitting: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    hour?: unknown;
    room?: string;
    stage?: string;
    light?: unknown;
    stay?: unknown;
    tags?: unknown;
    pause?: unknown;
  },
): AtelierSitting[] {
  const current = readSittings(sittings);
  const id = String(sitting.id || "").trim();
  const title = sittingLine(sitting.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const pause = pauseOf(sitting.pause);
  const next: AtelierSitting = {
    id,
    title,
    note: sittingNote(sitting.note),
    host: hostLabel(sitting.host),
    hour: hourOf(sitting.hour),
    room: roomOf(sitting.room),
    stage: stageName(sitting.stage),
    light: lightOf(sitting.light),
    stay: stayOf(sitting.stay),
    tags: tagsOf(sitting.tags),
    pause: pause === null ? 0 : pause,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SITTING_CAP);
}

export function cycleStage(sittings: readonly AtelierSitting[], id: string): AtelierSitting[] {
  return readSittings(sittings).map((sitting) => {
    if (sitting.id !== id) return sitting;
    const at = STAGE_ORDER.indexOf(sitting.stage as (typeof STAGE_ORDER)[number]);
    const next = at < 0 || at >= STAGES.length ? STAGES[0] : STAGES[at % STAGES.length];
    if (!next || next === sitting.stage) return sitting;
    return { ...sitting, stage: next, audit: "stage" };
  });
}

/** A blank title is left as it is. */
export function editSitting(sittings: readonly AtelierSitting[], id: string, title: unknown): AtelierSitting[] {
  const next = sittingLine(title);
  if (!next) return readSittings(sittings);
  const current = readSittings(sittings);
  if (current.some((sitting) => sitting.id !== id && sitting.title === next)) return current;
  return current.map((sitting) => (sitting.id === id && sitting.title !== next ? { ...sitting, title: next, audit: "edit" } : sitting));
}

/** A blank note is left as it is. */
export function editSittingNote(sittings: readonly AtelierSitting[], id: string, note: unknown): AtelierSitting[] {
  const next = sittingNote(note);
  if (!next) return readSittings(sittings);
  return readSittings(sittings).map((sitting) => (sitting.id === id && sitting.note !== next ? { ...sitting, note: next, audit: "edit" } : sitting));
}

/** A tag that is already on the sitting, or a fourth tag, is left out. A tag is one letter. */
export function addSittingTag(sittings: readonly AtelierSitting[], id: string, tag: unknown): AtelierSitting[] {
  const next = tagOf(tag);
  if (!next) return readSittings(sittings);
  return readSittings(sittings).map((sitting) => {
    if (sitting.id !== id || sitting.tags.includes(next) || sitting.tags.length >= TAG_CAP) return sitting;
    return { ...sitting, tags: [...sitting.tags, next], audit: "tag" };
  });
}

/** An unknown pause is left as it is. 0 clears the pause. */
export function setSittingPause(sittings: readonly AtelierSitting[], id: string, pause: unknown): AtelierSitting[] {
  const next = pauseOf(pause);
  if (next === null) return readSittings(sittings);
  return readSittings(sittings).map((sitting) => (sitting.id === id && sitting.pause !== next ? { ...sitting, pause: next, audit: "pause" } : sitting));
}

export function setSittingPin(sittings: readonly AtelierSitting[], id: string, pinned: boolean): AtelierSitting[] {
  return readSittings(sittings).map((sitting) => (sitting.id === id && sitting.pinned !== pinned ? { ...sitting, pinned, audit: pinned ? "pin" : "unpin" } : sitting));
}

export function setSittingHold(sittings: readonly AtelierSitting[], id: string, held: boolean): AtelierSitting[] {
  return readSittings(sittings).map((sitting) => (sitting.id === id && sitting.held !== held ? { ...sitting, held, audit: held ? "hold" : "lift" } : sitting));
}

export function setSittingClose(sittings: readonly AtelierSitting[], id: string, closed: boolean): AtelierSitting[] {
  return readSittings(sittings).map((sitting) => (sitting.id === id && sitting.closed !== closed ? { ...sitting, closed, audit: closed ? "close" : "open" } : sitting));
}

export function bulkSittingRoom(sittings: readonly AtelierSitting[], ids: readonly string[], room: unknown): AtelierSitting[] {
  const next = roomOf(room);
  if (!next) return readSittings(sittings);
  const picked = new Set(ids);
  return readSittings(sittings).map((sitting) => (picked.has(sitting.id) && sitting.room !== next ? { ...sitting, room: next, audit: "room" } : sitting));
}

export function bulkSittingPin(sittings: readonly AtelierSitting[], ids: readonly string[], pinned: boolean): AtelierSitting[] {
  const picked = new Set(ids);
  return readSittings(sittings).map((sitting) => (picked.has(sitting.id) && sitting.pinned !== pinned ? { ...sitting, pinned, audit: pinned ? "pin" : "unpin" } : sitting));
}

export function bulkSittingClose(sittings: readonly AtelierSitting[], ids: readonly string[], closed: boolean): AtelierSitting[] {
  const picked = new Set(ids);
  return readSittings(sittings).map((sitting) => (picked.has(sitting.id) && sitting.closed !== closed ? { ...sitting, closed, audit: closed ? "close" : "open" } : sitting));
}

export function bulkSittingTag(sittings: readonly AtelierSitting[], ids: readonly string[], tag: unknown): AtelierSitting[] {
  return ids.reduce((rows, id) => addSittingTag(rows, id, tag), readSittings(sittings));
}

export function resetSittings(): AtelierSitting[] {
  return [];
}

function inTray(sitting: AtelierSitting, tray: SitTray): boolean {
  if (tray === "closed") return sitting.closed;
  if (tray === "held") return sitting.held && !sitting.closed;
  return !sitting.held && !sitting.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

/** An open sitting whose hour sits more than three steps behind the desk hour. A pause, a hold, or a close is not late. */
export function lateSitting(sitting: AtelierSitting, desk: unknown): boolean {
  const gap = hourGap(sitting.hour, desk);
  return inTray(sitting, "open") && sitting.pause === 0 && gap !== null && gap > 3;
}

/** An open sitting with a stay of 20 is due now. A pause, a hold, or a close is not. */
export function soonSitting(sitting: AtelierSitting): boolean {
  return inTray(sitting, "open") && sitting.pause === 0 && sitting.stay === 20;
}

/** Open sittings that are late or due now. A paused sitting stays off the reminder list. */
export function reminderSittings(sittings: readonly AtelierSitting[], desk: unknown): AtelierSitting[] {
  return readSittings(sittings).filter((sitting) => lateSitting(sitting, desk) || soonSitting(sitting));
}

/** Search matches the title, the note, the host, and the tags. */
export function visibleSittings(
  sittings: readonly AtelierSitting[],
  tray: SitTray,
  query: string,
  host: string | null,
  room: string | null,
  stage: string | null,
  exact: number | null,
  pick: HourPick | null,
  light: number | "blank" | null,
  stay: number | "blank" | null,
  greetedOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
  awakeOnly: boolean,
): AtelierSitting[] {
  const text = query.trim().toLowerCase();
  return readSittings(sittings).filter((sitting) => {
    if (!inTray(sitting, tray)) return false;
    if (text) {
      const hay = `${sitting.title} ${sitting.note} ${sitting.host} ${sitting.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (host !== null && sitting.host !== host) return false;
    if (room === "blank" ? Boolean(sitting.room) : room && sitting.room !== room) return false;
    if (stage === "blank" ? Boolean(sitting.stage) : stage && sitting.stage !== stage) return false;
    if (!hourHit(sitting.hour, exact, pick)) return false;
    if (light === "blank" ? sitting.light !== null : light !== null && sitting.light !== light) return false;
    if (stay === "blank" ? sitting.stay !== null : stay !== null && sitting.stay !== stay) return false;
    if (greetedOnly && sitting.stage !== "greeted") return false;
    if (peakOnly && !peakHour(sitting.hour)) return false;
    if (houseOnly && !houseRoom(sitting.room)) return false;
    if (quietOnly && !quietHour(sitting.hour)) return false;
    if (awakeOnly && sitting.pause !== 0) return false;
    return true;
  });
}

export function sortSittings(sittings: readonly AtelierSitting[], mode: SitSort): AtelierSitting[] {
  const rows = sittings.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.hour ?? 99) - (b.hour ?? 99));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function sittingTimeline(sittings: readonly AtelierSitting[], query: string): AtelierSitting[] {
  const text = query.trim().toLowerCase();
  return sortSittings(
    readSittings(sittings).filter((sitting) => sitting.hour !== null && (!text || sitting.title.toLowerCase().includes(text))),
    "hour",
  );
}

export function sittingCounts(sittings: readonly AtelierSitting[], desk: unknown): SitCounts {
  const rows = readSittings(sittings);
  return {
    open: rows.filter((sitting) => inTray(sitting, "open")).length,
    held: rows.filter((sitting) => inTray(sitting, "held")).length,
    closed: rows.filter((sitting) => inTray(sitting, "closed")).length,
    pinned: rows.filter((sitting) => sitting.pinned).length,
    peak: rows.filter((sitting) => inTray(sitting, "open") && sitting.pause === 0 && peakHour(sitting.hour)).length,
    late: rows.filter((sitting) => lateSitting(sitting, desk)).length,
    soon: rows.filter((sitting) => soonSitting(sitting)).length,
    pause: rows.filter((sitting) => inTray(sitting, "open") && sitting.pause > 0).length,
    house: rows.filter((sitting) => inTray(sitting, "open") && houseRoom(sitting.room)).length,
  };
}

export function sittingShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Distinct hours on open sittings. */
export function usedHours(sittings: readonly AtelierSitting[]): number {
  const hours = new Set<number>();
  for (const sitting of readSittings(sittings)) {
    if (inTray(sitting, "open") && sitting.hour !== null) hours.add(sitting.hour);
  }
  return hours.size;
}

/** Open sittings that share an hour and a room. A different room on the same hour is not a clash. */
export function clashHourCount(sittings: readonly AtelierSitting[]): number {
  const groups = new Map<string, number>();
  for (const sitting of readSittings(sittings)) {
    if (!inTray(sitting, "open") || sitting.hour === null || !sitting.room) continue;
    const key = `${sitting.hour}:${sitting.room}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open sittings that share a light. An unset light is not a clash. */
export function lightClashCount(sittings: readonly AtelierSitting[]): number {
  const groups = new Map<number, number>();
  for (const sitting of readSittings(sittings)) {
    if (!inTray(sitting, "open") || sitting.light === null) continue;
    groups.set(sitting.light, (groups.get(sitting.light) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * The room with the fewest open sittings.
 * A tie keeps GRAPHITE, then IVORY, then CHAMPAGNE.
 * An empty desk still suggests GRAPHITE.
 */
export function suggestRoom(sittings: readonly AtelierSitting[]): "GRAPHITE" | "IVORY" | "CHAMPAGNE" {
  const rows = readSittings(sittings).filter((sitting) => inTray(sitting, "open"));
  const order = ["GRAPHITE", "IVORY", "CHAMPAGNE"] as const;
  let best: "GRAPHITE" | "IVORY" | "CHAMPAGNE" = "GRAPHITE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const room of order) {
    const count = rows.filter((sitting) => sitting.room === room).length;
    if (count < bestCount) {
      best = room;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The stay with the fewest open sittings.
 * A tie keeps 40, then 20, then 60.
 * An empty desk still suggests 40.
 */
export function suggestStay(sittings: readonly AtelierSitting[]): 20 | 40 | 60 {
  const rows = readSittings(sittings).filter((sitting) => inTray(sitting, "open"));
  const order = [40, 20, 60] as const;
  let best: 20 | 40 | 60 = 40;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const stay of order) {
    const count = rows.filter((sitting) => sitting.stay === stay).length;
    if (count < bestCount) {
      best = stay;
      bestCount = count;
    }
  }
  return best;
}

/** The newest open host. A blank host is skipped. An empty desk stays blank. */
export function suggestHost(sittings: readonly AtelierSitting[]): string {
  const found = readSittings(sittings).find((sitting) => inTray(sitting, "open") && sitting.host);
  return found ? sittingHost(found) : "";
}

function sittingHost(sitting: AtelierSitting): string {
  return sitting.host;
}

/**
 * The host carrying the fewest open sittings.
 * A tie keeps the earlier name. A blank host is not a load.
 * An empty roster falls back to the newest host.
 */
export function fairHost(sittings: readonly AtelierSitting[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = hostLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestHost(sittings);
  const open = readSittings(sittings).filter((sitting) => inTray(sitting, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((sitting) => sitting.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The host with the most open sittings. A tie keeps the earlier name. */
export function busiestHost(sittings: readonly AtelierSitting[]): string {
  const rows = readSittings(sittings).filter((sitting) => inTray(sitting, "open") && sitting.host);
  const names: string[] = [];
  for (const sitting of rows) if (!names.includes(sitting.host)) names.push(sitting.host);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((sitting) => sitting.host === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function sittingHosts(sittings: readonly AtelierSitting[]): string[] {
  const out: string[] = [];
  for (const sitting of readSittings(sittings)) {
    if (sitting.host && !out.includes(sitting.host)) out.push(sitting.host);
  }
  return out;
}

export function sittingRooms(sittings: readonly AtelierSitting[]): string[] {
  const out: string[] = [];
  for (const sitting of readSittings(sittings)) {
    if (sitting.room && !out.includes(sitting.room)) out.push(sitting.room);
  }
  return out;
}

/**
 * The next open sitting at or after the desk hour.
 * A seated stage, a pause, a hold, and a close stay off the list.
 * When every open hour is behind, the earliest hour is next.
 */
export function nextSitting(sittings: readonly AtelierSitting[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readSittings(sittings).filter((sitting) => inTray(sitting, "open") && sitting.hour !== null && sitting.stage !== "seated" && sitting.pause === 0);
  if (!waiting.length) return "";
  const byHour = (a: AtelierSitting, b: AtelierSitting) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((sitting) => (sitting.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function sittingCopy(sitting: AtelierSitting, desk: unknown): string {
  const gap = hourGap(sitting.hour, desk);
  return [sitting.title, sitting.host, sitting.hour ?? "", sitting.room, sitting.stage, sitting.light ?? "", sitting.stay ?? "", sitting.tags.join(" "), sitting.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the sittings saved in this browser. The gap and the late mark use the hour you pass. */
export function sittingsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,hour,room,stage,light,stay,tags,pause,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const sitting of readSittings(raw)) {
    const gap = hourGap(sitting.hour, desk);
    lines.push([
      sitting.title,
      sitting.host,
      sitting.hour === null ? "" : String(sitting.hour),
      sitting.room,
      sitting.stage,
      sitting.light === null ? "" : String(sitting.light),
      sitting.stay === null ? "" : String(sitting.stay),
      sitting.tags.join(" "),
      String(sitting.pause),
      sitting.pinned ? "1" : "0",
      sitting.held ? "1" : "0",
      sitting.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSitting(sitting, desk) ? "1" : "0",
      soonSitting(sitting) ? "1" : "0",
      houseRoom(sitting.room) ? "1" : "0",
      sitting.note,
      sitting.audit,
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function activeHost(raw: string, hosts: readonly string[]): string {
  if (raw === "blank") return "blank";
  return hosts.includes(raw) ? raw : "all";
}

export function activeRoom(raw: string, rooms: readonly string[]): string {
  if (raw === "blank") return "blank";
  const room = roomOf(raw);
  return room && rooms.includes(room) ? room : "all";
}

export function activeStage(raw: string, stages: readonly string[]): string {
  if (raw === "blank") return "blank";
  const stage = stageName(raw);
  return stage && stages.includes(stage) ? stage : "all";
}

export function activeHour(raw: string): string {
  if (raw === "blank" || raw === "early" || raw === "mid" || raw === "late" || raw === "peak" || raw === "quiet") return raw;
  const hour = hourOf(raw);
  return hour === null ? "all" : String(hour);
}

export function activeLight(raw: string): string {
  if (raw === "blank") return "blank";
  const light = lightOf(raw);
  return light === null ? "all" : String(light);
}

export function activeStay(raw: string): string {
  if (raw === "blank") return "blank";
  const stay = stayOf(raw);
  return stay === null ? "all" : String(stay);
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return filter;
}

export function roomArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return roomOf(filter) || null;
}

export function stageArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stageName(filter) || null;
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if (filter === "blank" || filter === "early" || filter === "mid" || filter === "late" || filter === "peak" || filter === "quiet") {
    return { exact: null, pick: filter };
  }
  return { exact: hourOf(filter), pick: null };
}

export function lightArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return lightOf(filter);
}

export function stayArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stayOf(filter);
}

function readView(raw: unknown): SitView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SitView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 32),
    host: row.host === "blank" ? "blank" : clip(row.host, 18) || "all",
    room: row.room === "blank" || row.room === "all" ? (row.room === "blank" ? "blank" : "all") : roomOf(row.room) || "all",
    stage: row.stage === "blank" || row.stage === "all" ? (row.stage === "blank" ? "blank" : "all") : stageName(row.stage) || "all",
    hour: activeHour(String(row.hour || "all")),
    light: activeLight(String(row.light || "all")),
    stay: activeStay(String(row.stay || "all")),
  };
}

export function readSittingViews(raw: unknown): SitView[] {
  if (!Array.isArray(raw)) return [];
  const out: SitView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSittingView(views: readonly SitView[], view: SitView): SitView[] {
  const current = readSittingViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSittingView(views: readonly SitView[], id: string): SitView[] {
  return readSittingViews(views).filter((view) => view.id !== id);
}

function crestBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function crestText(value: CrestValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: crestBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CREST_BLOCK.some((key) => key in value)) return { text: null, explicit: false };
  if (!("name" in value)) return { text: null, explicit: false };
  const inner = value.name;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: crestBody(inner), explicit: true };
}

export function crestState(value: CrestValue): CrestState {
  const found = crestText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function crestCopy(value: CrestValue): string {
  const found = crestText(value);
  if (!found.text) return "";
  return found.text.slice(0, 64);
}

/**
 * A crest is the first letter and the last letter of the surname.
 * The surname is the last word. A one-letter surname is a single letter.
 * A surname with no letter has no crest.
 */
export function crestOf(value: CrestValue): string {
  const text = crestCopy(value);
  if (!text) return "";
  const parts = text.split(" ").filter(Boolean);
  const surname = parts[parts.length - 1] || "";
  const letters = surname.match(/[A-Za-z]/g);
  if (!letters || !letters.length) return "";
  const first = letters[0].toUpperCase();
  if (letters.length === 1) return first;
  return first + letters[letters.length - 1].toUpperCase();
}

/** One letter is a seed. Two letters are a pair. No letter has no band. */
export function crestBand(value: CrestValue): CrestBand {
  const mark = crestOf(value);
  if (mark.length === 1) return "seed";
  if (mark.length === 2) return "pair";
  return "";
}

/** A vowel in the crest is gilt. Letters without a vowel are ink. */
export function crestTone(value: CrestValue): CrestTone {
  const mark = crestOf(value);
  if (!mark) return "";
  return /[AEIOU]/.test(mark) ? "gilt" : "ink";
}

/** AN, ER, and ON are the house catalog. Any other crest is not. */
export function catalogCrest(value: CrestValue): boolean {
  return CATALOG.has(crestOf(value));
}

export function catalogCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => catalogCrest(row.note)).length;
}

export function pairCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestBand(row.note) === "pair").length;
}

export function giltCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestTone(row.note) === "gilt").length;
}

/** Customers whose crest is shared with at least one other customer. */
export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const mark = crestOf(row.note);
    if (!mark) continue;
    groups.set(mark, (groups.get(mark) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function crestBands(rows: readonly CrestRow[]): CrestBandLine[] {
  return CREST_BANDS.map((band) => ({ band, count: rows.filter((row) => crestBand(row.note) === band).length }));
}

/** The band with the most set names. A tie keeps seed, then pair. */
export function leadingCrest(rows: readonly CrestRow[]): string {
  const lines = crestBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || CREST_BANDS.indexOf(a.band as (typeof CREST_BANDS)[number]) - CREST_BANDS.indexOf(b.band as (typeof CREST_BANDS)[number]))[0].band;
}

/** The tone with the most set names. A tie keeps gilt. */
export function leadingCrestTone(rows: readonly CrestRow[]): string {
  const gilt = giltCrestCount(rows);
  const ink = rows.filter((row) => crestTone(row.note) === "ink").length;
  if (!gilt && !ink) return "";
  return gilt >= ink ? "gilt" : "ink";
}

export function crestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentCrests(rows: readonly CrestRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = crestState(row.note);
    const band = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = String(item);
    if (allow.has(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readReviewedCrests(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item);
    if (allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleCrest(hidden: readonly string[], band: string): string[] {
  return hidden.includes(band) ? hidden.filter((item) => item !== band) : [...hidden, band];
}

export function toggleCrestReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleCrestBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const skip = new Set(hidden);
  return present.filter((band) => !skip.has(band));
}

export function visibleCrestCustomers(
  rows: readonly CrestRow[],
  band: CrestBand | "blank" | null,
  tone: CrestTone | null,
  query: string,
  review: string,
  reviewed: readonly string[],
  shape: CrestShape,
): CrestRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = crestState(row.note);
    const mark = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    if (band && mark !== band) return false;
    if (tone && crestTone(row.note) !== tone) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "open" && seen.has(row.id)) return false;
    if (shape === "catalog" && !catalogCrest(row.note)) return false;
    if (shape === "pair" && crestBand(row.note) !== "pair") return false;
    if (shape === "gilt" && crestTone(row.note) !== "gilt") return false;
    if (text) {
      const hay = `${row.label || ""} ${crestCopy(row.note)} ${crestOf(row.note)}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function activeCrestBand(raw: string, present: readonly string[]): string {
  if (raw === "all") return "all";
  return present.includes(raw) ? raw : "all";
}

export function activeCrestTone(raw: string): string {
  return raw === "gilt" || raw === "ink" ? raw : "all";
}

export function crestBandArg(filter: string): CrestBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank" || filter === "seed" || filter === "pair") return filter;
  return null;
}

export function crestToneArg(filter: string): CrestTone | null {
  if (filter === "gilt" || filter === "ink") return filter;
  return null;
}

export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of crestBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`catalog,catalog,${catalogCrestCount(rows)}`);
  lines.push(`tone,gilt,${giltCrestCount(rows)}`);
  lines.push(`tone,ink,${rows.filter((row) => crestTone(row.note) === "ink").length}`);
  return lines.join("\n");
}

export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,crest,band,tone,catalog,reviewed"];
  for (const row of rows) {
    const state = crestState(row.note);
    const band = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    lines.push([
      row.label || "",
      crestOf(row.note),
      band,
      state === "set" ? crestTone(row.note) : "",
      catalogCrest(row.note) ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].map(csvCell).join(","));
  }
  return lines.join("\n");
}
