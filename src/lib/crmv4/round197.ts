/**
 * Waitlist slots for the appointment desk, and follow stamps already stored on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_wait_slot (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   hour integer,
 *   seat text not null default '',
 *   pace text not null default '',
 *   rank integer,
 *   span integer,
 *   tags text not null default '',
 *   hush integer not null default 0,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_follow_stamp_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_follow_stamp_review (
 *   customer_id text primary key
 * );
 */

export const WSL_KEY = "crmv4-wait-slot";
export const WSL_VIEW_KEY = "crmv4-wait-views";
export const WSL_DENSITY_KEY = "crmv4-wait-density";
export const STAMP_KEY = "crmv4-follow-stamp-hide";
export const STAMP_REVIEW_KEY = "crmv4-follow-stamp-review";

export type WslSeat = "blank" | "one" | "two" | "arc";

export type WslPace = "blank" | "call" | "hold" | "done";

export type WslTray = "open" | "held" | "closed";

export type HourPick = "blank" | "early" | "mid" | "late" | "peak" | "dusk";

export type WslDensity = "roomy" | "tight";

export type WslSort = "hour" | "title";

export type WaitSlot = {
  id: string;
  title: string;
  note: string;
  host: string;
  hour: number | null;
  seat: string;
  pace: string;
  rank: number | null;
  span: number | null;
  tags: string[];
  hush: number;
  pinned: boolean;
  held: boolean;
  closed: boolean;
  audit: string;
};

export type WslView = {
  id: string;
  name: string;
  tray: WslTray;
  query: string;
  host: string;
  seat: string;
  pace: string;
  hour: string;
  rank: string;
  span: string;
};

export type WslCounts = {
  open: number;
  held: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  hush: number;
  house: number;
};

export type StampState = "" | "set" | "clear";

export type StampBand = "" | "chip" | "pair" | "row";

export type StampTone = "" | "firm" | "soft";

export type StampShape = "all" | "catalog" | "row" | "firm";

export type StampValue =
  | { retentionNote?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type StampRow = { id: string; note?: StampValue; label?: string | null };

export type StampBandLine = { band: string; count: number };

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "hold", "lift", "close", "reopen", "seat", "tag", "hush"] as const;

const SEATS = ["one", "two", "arc"] as const;

const PACES = ["call", "hold", "done"] as const;

const PACE_ORDER = ["", "call", "hold", "done"] as const;

const HOUR_PICKS = ["blank", "early", "mid", "late", "peak", "dusk"] as const;

const PEAK_HOURS = new Set([2, 5, 8, 11]);

const DUSK_HOURS = new Set([1, 12]);

const HOUSE = new Set(["ONE", "TWO", "ARC"]);

const STAMP_BANDS = ["chip", "pair", "row"] as const;

const CATALOG = new Set(["MEET", "PING", "HOLD"]);

const STAMP_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const SLOT_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WslTray {
  return raw === "held" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function seatName(raw: unknown): Exclude<WslSeat, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SEATS as readonly string[]).includes(text) ? (text as Exclude<WslSeat, "blank">) : "";
}

function paceName(raw: unknown): Exclude<WslPace, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<WslPace, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slotLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function slotNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A seat is ONE, TWO, or ARC. Anything else stays blank. Letters are stored in capitals. */
export function seatOf(raw: unknown): string {
  const name = seatName(raw);
  return name ? name.toUpperCase() : "";
}

/**
 * An hour is an integer from 1 through 12.
 * A blank value stays unset. 0 and 13 are not hours.
 * A leading zero is not an hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 12) return null;
    return raw;
  }
  const text = clip(raw, 4);
  if (!/^[1-9]\d?$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= 12 ? value : null;
}

/** A rank is 1, 2, or 4. A blank value stays unset. A leading zero is not a rank. */
export function rankOf(raw: unknown): 1 | 2 | 4 | null {
  if (raw === 1 || raw === "1") return 1;
  if (raw === 2 || raw === "2") return 2;
  if (raw === 4 || raw === "4") return 4;
  return null;
}

/** A span is 15, 30, or 60. A blank value stays unset. A leading zero is not a span. */
export function spanOf(raw: unknown): 15 | 30 | 60 | null {
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  if (raw === 60 || raw === "60") return 60;
  return null;
}

/** A hush mark is 0, 15, or 30. Anything else stays unset. */
export function hushOf(raw: unknown): 0 | 15 | 30 | null {
  if (raw === 0 || raw === "0") return 0;
  if (raw === 15 || raw === "15") return 15;
  if (raw === 30 || raw === "30") return 30;
  return null;
}

/** Early is 1 through 4. Mid is 5 through 8. Late is 9 through 12. */
export function hourBand(hour: unknown): "blank" | "early" | "mid" | "late" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 4) return "early";
  if (value <= 8) return "mid";
  return "late";
}

/** Peak hours are 2, 5, 8, and 11. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Dusk hours are 1 and 12. A peak hour is not dusk. An unset hour is not dusk. */
export function duskHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && DUSK_HOURS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 12. A step of 6 stays. A step of -6 stays.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

/** ONE, TWO, and ARC are house seats. A blank seat is not. */
export function houseSeat(seat: unknown): boolean {
  return HOUSE.has(seatOf(seat));
}

/** Roomy or tight. Anything else stays roomy. */
export function densityOf(raw: unknown): WslDensity {
  return raw === "tight" ? "tight" : "roomy";
}

/** Hour or title. Anything else stays on the hour. */
export function sortMode(raw: unknown): WslSort {
  return raw === "title" ? "title" : "hour";
}

function tagOf(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return /^[a-z]+$/.test(text) ? text : "";
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

function readOne(raw: unknown): WaitSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<WaitSlot>;
  const id = clip(row.id, 24);
  const title = slotLine(row.title);
  if (!id || !title) return null;
  const hush = hushOf(row.hush);
  return {
    id,
    title,
    note: slotNote(row.note),
    host: hostLabel(row.host),
    hour: hourOf(row.hour),
    seat: seatOf(row.seat),
    pace: paceName(row.pace),
    rank: rankOf(row.rank),
    span: spanOf(row.span),
    tags: tagsOf(row.tags),
    hush: hush === null ? 0 : hush,
    pinned: row.pinned === true,
    held: row.held === true,
    closed: row.closed === true,
    audit: auditCode(row.audit),
  };
}

export function readSlots(raw: unknown): WaitSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: WaitSlot[] = [];
  for (const item of raw) {
    const slot = readOne(item);
    if (!slot || out.some((row) => row.id === slot.id || row.title === slot.title)) continue;
    out.push(slot);
  }
  return out.slice(0, SLOT_CAP);
}

export function addSlot(
  slots: readonly WaitSlot[],
  slot: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    hour?: unknown;
    seat?: string;
    pace?: string;
    rank?: unknown;
    span?: unknown;
    tags?: unknown;
    hush?: unknown;
  },
): WaitSlot[] {
  const current = readSlots(slots);
  const id = String(slot.id || "").trim();
  const title = slotLine(slot.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const hush = hushOf(slot.hush);
  const next: WaitSlot = {
    id,
    title,
    note: slotNote(slot.note),
    host: hostLabel(slot.host),
    hour: hourOf(slot.hour),
    seat: seatOf(slot.seat),
    pace: paceName(slot.pace),
    rank: rankOf(slot.rank),
    span: spanOf(slot.span),
    tags: tagsOf(slot.tags),
    hush: hush === null ? 0 : hush,
    pinned: false,
    held: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLOT_CAP);
}

export function cyclePace(slots: readonly WaitSlot[], id: string): WaitSlot[] {
  return readSlots(slots).map((slot) => {
    if (slot.id !== id) return slot;
    const at = PACE_ORDER.indexOf(slot.pace as (typeof PACE_ORDER)[number]);
    const next = at < 0 || at >= PACES.length ? PACES[0] : PACES[at % PACES.length];
    if (!next || next === slot.pace) return slot;
    return { ...slot, pace: next, audit: "pace" };
  });
}

export function setSlotPin(slots: readonly WaitSlot[], id: string, pinned: boolean): WaitSlot[] {
  return readSlots(slots).map((slot) => (slot.id === id ? { ...slot, pinned, audit: pinned ? "pin" : "unpin" } : slot));
}

export function setSlotHold(slots: readonly WaitSlot[], id: string, held: boolean): WaitSlot[] {
  return readSlots(slots).map((slot) => (slot.id === id ? { ...slot, held, audit: held ? "hold" : "lift" } : slot));
}

export function setSlotClose(slots: readonly WaitSlot[], id: string, closed: boolean): WaitSlot[] {
  return readSlots(slots).map((slot) => (slot.id === id ? { ...slot, closed, audit: closed ? "close" : "reopen" } : slot));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSlot(slots: readonly WaitSlot[], id: string, title: string): WaitSlot[] {
  const current = readSlots(slots);
  const next = slotLine(title);
  if (!next || current.some((slot) => slot.id !== id && slot.title === next)) return current;
  return current.map((slot) => (slot.id === id && slot.title !== next ? { ...slot, title: next, audit: "edit" } : slot));
}

/** A blank note is left out. The same note is left as it is. */
export function editSlotNote(slots: readonly WaitSlot[], id: string, note: string): WaitSlot[] {
  const current = readSlots(slots);
  const next = slotNote(note);
  if (!next) return current;
  return current.map((slot) => (slot.id === id && slot.note !== next ? { ...slot, note: next, audit: "edit" } : slot));
}

/** A tag that is already on the slot, or a fourth tag, is left out. */
export function addSlotTag(slots: readonly WaitSlot[], id: string, tag: unknown): WaitSlot[] {
  const next = tagOf(tag);
  if (!next) return readSlots(slots);
  return readSlots(slots).map((slot) => {
    if (slot.id !== id || slot.tags.includes(next) || slot.tags.length >= TAG_CAP) return slot;
    return { ...slot, tags: [...slot.tags, next], audit: "tag" };
  });
}

/** An unknown hush mark is left as it is. 0 clears the hush mark. */
export function setSlotHush(slots: readonly WaitSlot[], id: string, hush: unknown): WaitSlot[] {
  const next = hushOf(hush);
  if (next === null) return readSlots(slots);
  return readSlots(slots).map((slot) => (slot.id === id && slot.hush !== next ? { ...slot, hush: next, audit: "hush" } : slot));
}

export function bulkSlotSeat(slots: readonly WaitSlot[], ids: readonly string[], seat: unknown): WaitSlot[] {
  const next = seatOf(seat);
  if (!next) return readSlots(slots);
  const picked = new Set(ids);
  return readSlots(slots).map((slot) => (picked.has(slot.id) && slot.seat !== next ? { ...slot, seat: next, audit: "seat" } : slot));
}

export function bulkSlotPin(slots: readonly WaitSlot[], ids: readonly string[], pinned: boolean): WaitSlot[] {
  const picked = new Set(ids);
  return readSlots(slots).map((slot) => (picked.has(slot.id) && slot.pinned !== pinned ? { ...slot, pinned, audit: pinned ? "pin" : "unpin" } : slot));
}

export function bulkSlotClose(slots: readonly WaitSlot[], ids: readonly string[], closed: boolean): WaitSlot[] {
  const picked = new Set(ids);
  return readSlots(slots).map((slot) => (picked.has(slot.id) && slot.closed !== closed ? { ...slot, closed, audit: closed ? "close" : "reopen" } : slot));
}

export function bulkSlotTag(slots: readonly WaitSlot[], ids: readonly string[], tag: unknown): WaitSlot[] {
  return ids.reduce((rows, id) => addSlotTag(rows, id, tag), readSlots(slots));
}

export function resetSlots(): WaitSlot[] {
  return [];
}

function inTray(slot: WaitSlot, tray: WslTray): boolean {
  if (tray === "closed") return slot.closed;
  if (tray === "held") return slot.held && !slot.closed;
  return !slot.held && !slot.closed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "dusk") return duskHour(hour);
  return hourBand(hour) === pick;
}

/** An open slot whose hour sits more than three steps behind the desk hour. A hush mark, a hold, or a close is not late. */
export function lateSlot(slot: WaitSlot, desk: unknown): boolean {
  const gap = hourGap(slot.hour, desk);
  return inTray(slot, "open") && slot.hush === 0 && gap !== null && gap > 3;
}

/** An open slot with a span of 15 is the reminder. A hush mark, a hold, or a close is not. */
export function soonSlot(slot: WaitSlot): boolean {
  return inTray(slot, "open") && slot.hush === 0 && slot.span === 15;
}

/** Open slots that are late or soon. A hushed slot stays off the reminder list. */
export function reminderSlots(slots: readonly WaitSlot[], desk: unknown): WaitSlot[] {
  return readSlots(slots).filter((slot) => lateSlot(slot, desk) || soonSlot(slot));
}

/** Search matches the title, the note, the host, and the tags. */
export function visibleSlots(
  slots: readonly WaitSlot[],
  tray: WslTray,
  query: string,
  host: string | null,
  seat: WslSeat | null,
  pace: WslPace | null,
  exact: number | null,
  pick: HourPick | null,
  rank: number | "blank" | null,
  span: number | "blank" | null,
  callingOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  duskOnly: boolean,
  awakeOnly: boolean,
): WaitSlot[] {
  const text = query.trim().toLowerCase();
  return readSlots(slots).filter((slot) => {
    if (!inTray(slot, tray)) return false;
    if (text) {
      const hay = `${slot.title} ${slot.note} ${slot.host} ${slot.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    if (host === "") {
      if (slot.host) return false;
    } else if (host && slot.host !== host) return false;
    if (seat === "blank") {
      if (slot.seat) return false;
    } else if (seat && slot.seat !== seatOf(seat)) return false;
    if (pace === "blank") {
      if (slot.pace) return false;
    } else if (pace && slot.pace !== pace) return false;
    if (!hourHit(slot.hour, exact, pick)) return false;
    if (rank === "blank") {
      if (slot.rank !== null) return false;
    } else if (typeof rank === "number" && slot.rank !== rank) return false;
    if (span === "blank") {
      if (slot.span !== null) return false;
    } else if (typeof span === "number" && slot.span !== span) return false;
    if (callingOnly && slot.pace !== "call") return false;
    if (peakOnly && !peakHour(slot.hour)) return false;
    if (houseOnly && !houseSeat(slot.seat)) return false;
    if (duskOnly && !duskHour(slot.hour)) return false;
    if (awakeOnly && slot.hush !== 0) return false;
    return true;
  });
}

export function slotCounts(slots: readonly WaitSlot[], desk: unknown): WslCounts {
  const rows = readSlots(slots);
  return {
    open: rows.filter((slot) => inTray(slot, "open")).length,
    held: rows.filter((slot) => inTray(slot, "held")).length,
    closed: rows.filter((slot) => inTray(slot, "closed")).length,
    pinned: rows.filter((slot) => slot.pinned).length,
    peak: rows.filter((slot) => peakHour(slot.hour) && inTray(slot, "open")).length,
    late: rows.filter((slot) => lateSlot(slot, desk)).length,
    soon: rows.filter((slot) => soonSlot(slot)).length,
    hush: rows.filter((slot) => inTray(slot, "open") && slot.hush !== 0).length,
    house: rows.filter((slot) => houseSeat(slot.seat)).length,
  };
}

export function slotShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function sortSlots(slots: readonly WaitSlot[], mode: WslSort): WaitSlot[] {
  const rows = slots.slice();
  if (mode === "title") return rows.sort((a, b) => a.title.localeCompare(b.title) || (a.hour ?? 99) - (b.hour ?? 99));
  return rows.sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99) || a.title.localeCompare(b.title));
}

export function slotTimeline(slots: readonly WaitSlot[], query: string): WaitSlot[] {
  const text = query.trim().toLowerCase();
  return sortSlots(
    readSlots(slots).filter((slot) => slot.hour !== null && (!text || slot.title.toLowerCase().includes(text))),
    "hour",
  );
}

/** Distinct hours on open slots. */
export function usedHours(slots: readonly WaitSlot[]): number {
  const hours = new Set<number>();
  for (const slot of readSlots(slots)) {
    if (inTray(slot, "open") && slot.hour !== null) hours.add(slot.hour);
  }
  return hours.size;
}

/** Open slots that share an hour and a seat. A different seat on the same hour is not a clash. */
export function clashHourCount(slots: readonly WaitSlot[]): number {
  const groups = new Map<string, number>();
  for (const slot of readSlots(slots)) {
    if (!inTray(slot, "open") || slot.hour === null || !slot.seat) continue;
    const key = `${slot.hour}:${slot.seat}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/** Open slots that share a rank. An unset rank is not a clash. */
export function rankClashCount(slots: readonly WaitSlot[]): number {
  const groups = new Map<number, number>();
  for (const slot of readSlots(slots)) {
    if (!inTray(slot, "open") || slot.rank === null) continue;
    groups.set(slot.rank, (groups.get(slot.rank) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

/**
 * The next open slot at or after the desk hour.
 * A done pace, a hush mark, a hold, or a close is not next.
 * When every waiting hour is earlier, the earliest hour wraps around.
 */
export function nextSlot(slots: readonly WaitSlot[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readSlots(slots).filter((slot) => inTray(slot, "open") && slot.hour !== null && slot.pace !== "done" && slot.hush === 0);
  if (!waiting.length) return "";
  const byHour = (a: WaitSlot, b: WaitSlot) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((slot) => (slot.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The seat with the fewest open slots.
 * A tie keeps ONE, then TWO, then ARC.
 * An empty desk still suggests ONE.
 */
export function suggestSeat(slots: readonly WaitSlot[]): "ONE" | "TWO" | "ARC" {
  const rows = readSlots(slots).filter((slot) => inTray(slot, "open"));
  let best: "ONE" | "TWO" | "ARC" = "ONE";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const seat of SEATS) {
    const stored = seat.toUpperCase() as "ONE" | "TWO" | "ARC";
    const count = rows.filter((slot) => slot.seat === stored).length;
    if (count < bestCount) {
      best = stored;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The host carrying the fewest open slots.
 * A tie keeps the earlier name. A blank host is not a load.
 * An empty desk stays blank.
 */
export function suggestHost(slots: readonly WaitSlot[]): string {
  const rows = readSlots(slots).filter((slot) => inTray(slot, "open") && slot.host);
  const names: string[] = [];
  for (const slot of rows) if (!names.includes(slot.host)) names.push(slot.host);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = rows.filter((slot) => slot.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open slots.
 * A tie keeps 30, then 15, then 60.
 * An empty desk suggests 30.
 */
export function suggestSpan(slots: readonly WaitSlot[]): 15 | 30 | 60 {
  const rows = readSlots(slots).filter((slot) => inTray(slot, "open"));
  const order = [30, 15, 60] as const;
  let best: 15 | 30 | 60 = 30;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const span of order) {
    const count = rows.filter((slot) => slot.span === span).length;
    if (count < bestCount) {
      best = span;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name carrying the fewest open slots.
 * A tie keeps the earlier name in the roster.
 * A blank roster falls back to the suggested host.
 */
export function fairHost(slots: readonly WaitSlot[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = hostLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestHost(slots);
  const open = readSlots(slots).filter((slot) => inTray(slot, "open"));
  let best = names[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slot) => slot.host === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/** The host on the most open slots. A tie keeps the earlier name. */
export function busiestHost(slots: readonly WaitSlot[]): string {
  const rows = readSlots(slots).filter((slot) => inTray(slot, "open") && slot.host);
  const names: string[] = [];
  for (const slot of rows) if (!names.includes(slot.host)) names.push(slot.host);
  if (!names.length) return "";
  let best = names[0];
  let bestCount = 0;
  for (const name of names) {
    const count = rows.filter((slot) => slot.host === name).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export function slotHosts(slots: readonly WaitSlot[]): string[] {
  const out: string[] = [];
  for (const slot of readSlots(slots)) if (slot.host && !out.includes(slot.host)) out.push(slot.host);
  return out;
}

export function slotSeats(slots: readonly WaitSlot[]): string[] {
  const out: string[] = [];
  for (const slot of readSlots(slots)) if (slot.seat && !out.includes(slot.seat)) out.push(slot.seat);
  return out;
}

export function moveFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  const next = index + step;
  return ((next % length) + length) % length;
}

export function slotCopy(slot: WaitSlot, desk: unknown): string {
  const gap = hourGap(slot.hour, desk);
  return [slot.title, slot.host, slot.hour ?? "", slot.seat, slot.pace, slot.rank ?? "", slot.span ?? "", slot.tags.join(" "), slot.note, gap ?? ""].join(" · ");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slots saved in this browser. The gap and the late mark use the hour you pass. */
export function slotsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,hour,seat,pace,rank,span,tags,hush,pinned,held,closed,gap,late,soon,house,note,audit"];
  for (const slot of readSlots(raw)) {
    const gap = hourGap(slot.hour, desk);
    lines.push([
      csvCell(slot.title),
      csvCell(slot.host),
      slot.hour === null ? "" : String(slot.hour),
      slot.seat,
      slot.pace,
      slot.rank === null ? "" : String(slot.rank),
      slot.span === null ? "" : String(slot.span),
      csvCell(slot.tags.join(" ")),
      String(slot.hush),
      slot.pinned ? "1" : "0",
      slot.held ? "1" : "0",
      slot.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlot(slot, desk) ? "1" : "0",
      soonSlot(slot) ? "1" : "0",
      houseSeat(slot.seat) ? "1" : "0",
      csvCell(slot.note),
      slot.audit,
    ].join(","));
  }
  return lines.join("\n");
}

function hostSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hostLabel(raw) || "all";
}

function seatSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return seatOf(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

function hourSlot(raw: unknown): string {
  if (raw === "all") return "all";
  return (HOUR_PICKS as readonly string[]).includes(String(raw)) ? String(raw) : "all";
}

function rankSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return raw === "1" || raw === "2" || raw === "4" ? raw : "all";
}

function spanSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return raw === "15" || raw === "30" || raw === "60" ? raw : "all";
}

export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const name = hostLabel(filter);
  return name && hosts.includes(name) ? name : "all";
}

export function activeSeat(filter: string, seats: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const seat = seatOf(filter);
  return seat && seats.includes(seat) ? seat : "all";
}

export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function activeHour(filter: string): string {
  return hourSlot(filter);
}

export function activeRank(filter: string): string {
  return rankSlot(filter);
}

export function activeSpan(filter: string): string {
  return spanSlot(filter);
}

export function hostArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return hostLabel(filter) || null;
}

export function seatArg(filter: string): WslSeat | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const seat = seatName(filter);
  return seat || null;
}

export function paceArg(filter: string): WslPace | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const pace = paceName(filter);
  return pace || null;
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if (filter === "all") return { exact: null, pick: null };
  if ((HOUR_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as HourPick };
  const exact = hourOf(filter);
  return exact === null ? { exact: null, pick: null } : { exact, pick: null };
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

function readView(raw: unknown): WslView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<WslView>;
  const id = clip(row.id, 24);
  const name = clip(row.name, 24);
  if (!id || !name) return null;
  return {
    id,
    name,
    tray: trayOf(row.tray),
    query: clip(row.query, 40),
    host: hostSlot(row.host),
    seat: seatSlot(row.seat),
    pace: paceSlot(row.pace),
    hour: hourSlot(row.hour),
    rank: rankSlot(row.rank),
    span: spanSlot(row.span),
  };
}

export function readSlotViews(raw: unknown): WslView[] {
  if (!Array.isArray(raw)) return [];
  const out: WslView[] = [];
  for (const item of raw) {
    const view = readView(item);
    if (!view || out.some((row) => row.id === view.id || row.name === view.name)) continue;
    out.push(view);
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlotView(views: readonly WslView[], view: WslView): WslView[] {
  const current = readSlotViews(views);
  const next = readView(view);
  if (!next || current.some((item) => item.id === next.id || item.name === next.name)) return current;
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropSlotView(views: readonly WslView[], id: string): WslView[] {
  return readSlotViews(views).filter((view) => view.id !== id);
}

function stampBody(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function stampBlocked(value: object): boolean {
  return STAMP_BLOCK.some((key) => key in value);
}

function stampText(value: StampValue): { text: string | null; explicit: boolean } {
  if (typeof value === "string") return { text: stampBody(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (stampBlocked(value)) return { text: null, explicit: false };
  if (!("retentionNote" in value)) return { text: null, explicit: false };
  const inner = value.retentionNote;
  if (inner == null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: null, explicit: false };
  return { text: stampBody(inner), explicit: true };
}

/** Letters only, spaces and hyphens ignored, stored in capitals. */
export function stampToken(raw: unknown): string {
  return stampBody(raw).replace(/[\s-]+/g, "").toUpperCase();
}

export function stampState(value: StampValue): StampState {
  const found = stampText(value);
  if (!found.explicit || found.text === null) return "";
  return found.text ? "set" : "clear";
}

export function stampCopy(value: StampValue): string {
  const found = stampText(value);
  if (!found.text) return "";
  return found.text.slice(0, 48);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** One word is a chip, two words are a pair, and three or more are a row. */
export function stampBand(value: StampValue): StampBand {
  const text = stampCopy(value);
  if (!text) return "";
  const words = wordCount(stampText(value).text || "");
  if (words <= 1) return "chip";
  if (words === 2) return "pair";
  return "row";
}

/** A firm stamp is written in capitals. A lowercase letter makes it soft. */
export function stampTone(value: StampValue): StampTone {
  const text = stampCopy(value);
  if (!text || !/[A-Za-z]/.test(text)) return "";
  return /[a-z]/.test(text) ? "soft" : "firm";
}

export function catalogStamp(value: StampValue): boolean {
  const found = stampText(value);
  if (!found.text) return false;
  return CATALOG.has(stampToken(found.text));
}

export function catalogStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => catalogStamp(row.note)).length;
}

export function rowStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampBand(row.note) === "row").length;
}

export function firmStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampTone(row.note) === "firm").length;
}

export function sharedStampCount(rows: readonly StampRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const token = stampToken(stampCopy(row.note));
    if (!token) continue;
    groups.set(token, (groups.get(token) || 0) + 1);
  }
  let count = 0;
  groups.forEach((size) => {
    if (size > 1) count += size;
  });
  return count;
}

export function stampBands(rows: readonly StampRow[]): StampBandLine[] {
  return STAMP_BANDS.map((band) => ({ band, count: rows.filter((row) => stampBand(row.note) === band).length }));
}

/** The band with the most set notes. A tie keeps chip, then pair, then row. */
export function leadingStamp(rows: readonly StampRow[]): string {
  const lines = stampBands(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || STAMP_BANDS.indexOf(a.band as (typeof STAMP_BANDS)[number]) - STAMP_BANDS.indexOf(b.band as (typeof STAMP_BANDS)[number]))[0].band;
}

/** The tone with the most set notes. A tie keeps firm. */
export function leadingStampTone(rows: readonly StampRow[]): string {
  const firm = firmStampCount(rows);
  const soft = rows.filter((row) => stampTone(row.note) === "soft").length;
  if (!firm && !soft) return "";
  return firm >= soft ? "firm" : "soft";
}

export function stampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function presentStamps(rows: readonly StampRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = stampState(row.note);
    const band = state === "set" ? stampBand(row.note) : state === "clear" ? "blank" : "";
    if (band && !out.includes(band)) out.push(band);
  }
  return out;
}

export function readHiddenStamps(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const band = clip(item, 12);
    if (present.includes(band) && !out.includes(band)) out.push(band);
  }
  return out;
}

export function toggleStamp(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  if (!present.includes(band)) return readHiddenStamps(hidden, present);
  const current = readHiddenStamps(hidden, present);
  return current.includes(band) ? current.filter((item) => item !== band) : [...current, band];
}

export function visibleStampBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  if (showHidden) return present.slice();
  const folded = new Set(hidden);
  return present.filter((band) => !folded.has(band));
}

export function readReviewedStamps(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (id && allow.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function toggleStampReview(reviewed: readonly string[], id: string, ids: readonly string[]): string[] {
  const current = readReviewedStamps(reviewed, ids);
  if (!ids.includes(id)) return current;
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

export function bulkStampReview(reviewed: readonly string[], picked: readonly string[], ids: readonly string[], on: boolean): string[] {
  const current = new Set(readReviewedStamps(reviewed, ids));
  for (const id of picked) {
    if (!ids.includes(id)) continue;
    if (on) current.add(id);
    else current.delete(id);
  }
  const next: string[] = [];
  current.forEach((id) => next.push(id));
  return readReviewedStamps(next, ids);
}

export function activeStampBand(filter: string, present: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (STAMP_BANDS as readonly string[]).includes(filter) && present.includes(filter) ? filter : "all";
}

export function activeStampTone(filter: string): string {
  return filter === "firm" || filter === "soft" || filter === "all" ? filter : "all";
}

export function stampBandArg(filter: string): StampBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return filter === "chip" || filter === "pair" || filter === "row" ? filter : null;
}

export function stampToneArg(filter: string): StampTone | null {
  if (filter === "all") return null;
  return filter === "firm" || filter === "soft" ? filter : null;
}

export function visibleStampCustomers(
  rows: readonly StampRow[],
  band: StampBand | "blank" | null,
  tone: StampTone | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: StampShape,
): StampRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = stampState(row.note);
    const mark = state === "set" ? stampBand(row.note) : state === "clear" ? "blank" : "";
    if (!mark) return false;
    if (band === "blank" && mark !== "blank") return false;
    if (band && band !== "blank" && mark !== band) return false;
    if (tone && stampTone(row.note) !== tone) return false;
    if (shape === "catalog" && !catalogStamp(row.note)) return false;
    if (shape === "row" && stampBand(row.note) !== "row") return false;
    if (shape === "firm" && stampTone(row.note) !== "firm") return false;
    if (review === "reviewed" && !seen.has(row.id || "")) return false;
    if (review === "open" && seen.has(row.id || "")) return false;
    if (!text) return true;
    const hay = `${row.label || ""} ${stampCopy(row.note)}`.toLowerCase();
    return hay.includes(text);
  });
}

export function stampsCsv(rows: readonly StampRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of stampBands(rows)) lines.push(`band,${line.band},${line.count}`);
  lines.push(`tone,firm,${firmStampCount(rows)}`);
  lines.push(`tone,soft,${rows.filter((row) => stampTone(row.note) === "soft").length}`);
  lines.push(`catalog,house,${catalogStampCount(rows)}`);
  lines.push(`shared,note,${sharedStampCount(rows)}`);
  return lines.join("\n");
}

export function stampRowsCsv(rows: readonly StampRow[], reviewed: readonly string[]): string {
  const seen = new Set(reviewed);
  const lines = ["name,note,band,tone,catalog,reviewed"];
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(stampCopy(row.note)),
      stampBand(row.note) || (stampState(row.note) === "clear" ? "blank" : ""),
      stampTone(row.note),
      catalogStamp(row.note) ? "1" : "0",
      seen.has(row.id || "") ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
