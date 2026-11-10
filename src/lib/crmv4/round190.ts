/**
 * Callback windows for the retention desk, and the referral code already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_callback_window (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   owner text not null default '',
 *   hour integer,
 *   tone text not null default '',
 *   tag text not null default '',
 *   pace text not null default '',
 *   rank integer,
 *   wait integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_invite_ring_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_invite_ring_review (
 *   customer_id text primary key
 * );
 */

export const WINDOW_KEY = "crmv4-callback-windows";
export const WINDOW_VIEW_KEY = "crmv4-callback-window-views";
export const RING_KEY = "crmv4-invite-ring-hide";
export const RING_REVIEW_KEY = "crmv4-invite-ring-review";

export type WindowTone = "blank" | "paper" | "ink" | "gold" | "mist";

export type WindowPace = "blank" | "slow" | "even" | "brisk";

export type WindowTray = "open" | "held" | "done";

export type HourPick = "blank" | "night" | "day" | "eve" | "peak" | "quiet";

export type Callback = {
  id: string;
  title: string;
  note: string;
  owner: string;
  hour: number | null;
  tone: string;
  tag: string;
  pace: string;
  rank: number | null;
  wait: number | null;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type CallbackView = {
  id: string;
  name: string;
  tray: WindowTray;
  query: string;
  owner: string;
  tone: string;
  tag: string;
  pace: string;
  hour: string;
  rank: string;
  wait: string;
};

export type CallbackCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type RingState = "" | "set" | "clear";

export type RingBand = "" | "seed" | "stem" | "branch" | "crown";

export type RingParity = "" | "even" | "odd";

export type RingShape = "all" | "catalog" | "wide" | "even";

export type RingValue =
  | { referralCodeUsed?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type RingRow = { id?: string; note?: RingValue; label?: string | null };

export type RingBandLine = { band: string; count: number };

export type RingParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "hold", "lift", "done", "reopen", "tone"] as const;

const TONES = ["paper", "ink", "gold", "mist"] as const;

const PACES = ["slow", "even", "brisk"] as const;

const PACE_ORDER = ["", "slow", "even", "brisk"] as const;

const HOUR_PICKS = ["blank", "night", "day", "eve", "peak", "quiet"] as const;

const PEAK_HOURS = new Set([9, 15]);

const QUIET_HOURS = new Set([7, 21]);

const RANKS = [1, 2, 4] as const;

const WAITS = [1, 3, 7] as const;

const HOME = new Set(["ADA", "BEA", "CYA"]);

const RING_BANDS = ["seed", "stem", "branch", "crown"] as const;

const PARITIES = ["even", "odd"] as const;

const CATALOG = new Set(["7FXA", "DESK2", "IVORY88", "CHAMPAGN9"]);

const RING_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const WINDOW_CAP = 8;

const VIEW_CAP = 6;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WindowTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function toneName(raw: unknown): Exclude<WindowTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<WindowTone, "blank">) : "";
}

function paceName(raw: unknown): Exclude<WindowPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<WindowPace, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function callbackLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function callbackNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A tag is three letters. Anything else stays blank. Letters are stored in capitals. */
export function callbackTag(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

/**
 * An hour is an integer from 0 through 23.
 * A blank value stays unset. 24 is not an hour.
 * A leading zero is not an hour. Midnight is 0.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]|1[0-9]|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A rank is 1, 2, or 4.
 * A blank value stays unset. 0 and 3 are not ranks.
 * A leading zero is not a rank.
 */
export function rankOf(raw: unknown): number | null {
  if (typeof raw === "number" && (RANKS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|2|4)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A wait is 1, 3, or 7 days. A blank value stays unset. A leading zero is not a wait. */
export function waitDays(raw: unknown): number | null {
  if (typeof raw === "number" && (WAITS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|7)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Paper, ink, gold, mist, or blank. Anything else is blank. */
export function toneOf(raw: unknown): WindowTone {
  return toneName(raw) || "blank";
}

/** Slow, even, brisk, or blank. Anything else is blank. */
export function paceOf(raw: unknown): WindowPace {
  return paceName(raw) || "blank";
}

/** Night is 0–7. Day is 8–15. Eve is 16–23. An unset hour is blank. */
export function hourBand(hour: unknown): "blank" | "night" | "day" | "eve" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 7) return "night";
  if (value <= 15) return "day";
  return "eve";
}

/** Peak hours are 9 and 15. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAK_HOURS.has(value);
}

/** Quiet hours are 7 and 21. 9 and 15 are not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET_HOURS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 24. A step of 12 stays. A step of -12 stays.
 * A positive step means the typed hour is ahead of the window.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  return diff;
}

/** ADA, BEA, and CYA are home tags. A blank tag is not. */
export function homeTag(tag: unknown): boolean {
  return HOME.has(callbackTag(tag));
}

export function readCallbacks(raw: unknown): Callback[] {
  if (!Array.isArray(raw)) return [];
  const out: Callback[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Callback>;
    const id = String(row.id || "").trim();
    const title = callbackLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: callbackNote(row.note),
      owner: ownerLabel(row.owner),
      hour: hourOf(row.hour),
      tone: toneName(row.tone),
      tag: callbackTag(row.tag),
      pace: paceName(row.pace),
      rank: rankOf(row.rank),
      wait: waitDays(row.wait),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, WINDOW_CAP);
}

export function addCallback(
  cards: readonly Callback[],
  card: {
    id: string;
    title: string;
    note?: string;
    owner?: string;
    hour?: unknown;
    tone?: string;
    tag?: string;
    pace?: string;
    rank?: unknown;
    wait?: unknown;
  },
): Callback[] {
  const current = readCallbacks(cards);
  const id = String(card.id || "").trim();
  const title = callbackLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Callback = {
    id,
    title,
    note: callbackNote(card.note),
    owner: ownerLabel(card.owner),
    hour: hourOf(card.hour),
    tone: toneName(card.tone),
    tag: callbackTag(card.tag),
    pace: paceName(card.pace),
    rank: rankOf(card.rank),
    wait: waitDays(card.wait),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, WINDOW_CAP);
}

/** Blank becomes slow. Slow becomes even, even becomes brisk, and brisk returns to slow. */
export function cyclePace(cards: readonly Callback[], id: string): Callback[] {
  return readCallbacks(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = at < 0 || at >= PACES.length ? PACES[0] : PACES[at % PACES.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

export function setCallbackPin(cards: readonly Callback[], id: string, pinned: boolean): Callback[] {
  return readCallbacks(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setCallbackHold(cards: readonly Callback[], id: string, held: boolean): Callback[] {
  return readCallbacks(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setCallbackDone(cards: readonly Callback[], id: string, done: boolean): Callback[] {
  return readCallbacks(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editCallback(cards: readonly Callback[], id: string, title: string): Callback[] {
  const current = readCallbacks(cards);
  const next = callbackLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editCallbackNote(cards: readonly Callback[], id: string, note: string): Callback[] {
  const current = readCallbacks(cards);
  const next = callbackNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkCallbackPin(cards: readonly Callback[], ids: readonly string[], pinned: boolean): Callback[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCallbacks(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkCallbackTone(cards: readonly Callback[], ids: readonly string[], tone: unknown): Callback[] {
  const next = toneName(tone);
  if (!next) return readCallbacks(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCallbacks(cards).map((card) => (want.has(card.id) ? { ...card, tone: next, audit: "tone" } : card));
}

export function bulkCallbackDone(cards: readonly Callback[], ids: readonly string[], done: boolean): Callback[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readCallbacks(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

export function resetCallbacks(): Callback[] {
  return [];
}

function inTray(card: Callback, tray: WindowTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

function paceScore(pace: string): number {
  if (pace === "brisk") return 3;
  if (pace === "even") return 2;
  if (pace === "slow") return 1;
  return 0;
}

/** An open window whose hour sits more than four steps behind the desk hour. A held or done window is not late. */
export function lateCallback(card: Callback, desk: unknown): boolean {
  const gap = hourGap(card.hour, desk);
  return inTray(card, "open") && gap !== null && gap > 4;
}

/** An open window with a 1 day wait is the reminder. A held or done window is not. */
export function soonCallback(card: Callback): boolean {
  return inTray(card, "open") && card.wait === 1;
}

/** Search matches the title, the note, and the owner. The hour and the tone are not part of the query. */
export function visibleCallbacks(
  cards: readonly Callback[],
  tray: WindowTray,
  query: string,
  owner: string | null,
  tone: WindowTone | null,
  tag: string | null,
  pace: WindowPace | null,
  exact: number | null,
  pick: HourPick | null,
  rank: number | "blank" | null,
  wait: number | "blank" | null,
  slowOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
  quietOnly: boolean,
): Callback[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantTag = tag === null ? null : callbackTag(tag);
  return readCallbacks(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantOwner !== null && card.owner !== wantOwner) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (wantTag !== null && card.tag !== wantTag) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!hourHit(card.hour, exact, pick)) return false;
      if (rank === "blank" && card.rank !== null) return false;
      if (typeof rank === "number" && card.rank !== rank) return false;
      if (wait === "blank" && card.wait !== null) return false;
      if (typeof wait === "number" && card.wait !== wait) return false;
      if (slowOnly && card.pace !== "slow") return false;
      if (peakOnly && !peakHour(card.hour)) return false;
      if (quietOnly && !quietHour(card.hour)) return false;
      if (homeOnly && !homeTag(card.tag)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.owner.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.title.localeCompare(b.title);
    });
}

export function callbackTimeline(cards: readonly Callback[], query: string): Callback[] {
  const text = query.trim().toLowerCase();
  return readCallbacks(cards)
    .filter((card) => card.hour !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.owner.toLowerCase().includes(text))
    .sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title));
}

export function callbackCounts(cards: readonly Callback[], desk: unknown): CallbackCounts {
  const rows = readCallbacks(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakHour(card.hour) && inTray(card, "open")).length,
    late: rows.filter((card) => lateCallback(card, desk)).length,
    soon: rows.filter((card) => soonCallback(card)).length,
    home: rows.filter((card) => homeTag(card.tag)).length,
  };
}

export function callbackShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function callbackOwners(cards: readonly Callback[]): string[] {
  const seen = new Set<string>();
  for (const card of readCallbacks(cards)) if (card.owner) seen.add(card.owner);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function callbackTags(cards: readonly Callback[]): string[] {
  const seen = new Set<string>();
  for (const card of readCallbacks(cards)) if (card.tag) seen.add(card.tag);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function callbackPaces(cards: readonly Callback[]): Exclude<WindowPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readCallbacks(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

export function toneCounts(cards: readonly Callback[]): { tone: Exclude<WindowTone, "blank">; count: number }[] {
  const rows = readCallbacks(cards);
  return TONES.map((tone) => ({ tone, count: rows.filter((card) => card.tone === tone).length })).filter((row) => row.count > 0);
}

export function usedHours(cards: readonly Callback[]): number {
  return new Set(readCallbacks(cards).map((card) => card.hour).filter((hour): hour is number => hour !== null)).size;
}

export function clashHourIds(cards: readonly Callback[]): string[] {
  const open = readCallbacks(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.tone);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tone === card.tone && other.hour === card.hour)).map((card) => card.id);
}

export function clashHourCount(cards: readonly Callback[]): number {
  return clashHourIds(cards).length;
}

export function rankClashIds(cards: readonly Callback[]): string[] {
  const open = readCallbacks(cards).filter((card) => inTray(card, "open") && card.rank !== null && card.tone);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tone === card.tone && other.rank === card.rank)).map((card) => card.id);
}

export function rankClashCount(cards: readonly Callback[]): number {
  return rankClashIds(cards).length;
}

/** The next open window at or after the desk hour. Brisk paces wait. A blank desk hour stays blank. */
export function nextCallback(cards: readonly Callback[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readCallbacks(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.pace !== "brisk");
  if (!waiting.length) return "";
  const byHour = (a: Callback, b: Callback) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The tone with the fewest open windows.
 * A tie keeps gold, then paper, then ink, then mist.
 * Windows with no tone are not a load. An empty desk still suggests gold.
 */
export function suggestTone(cards: readonly Callback[]): Exclude<WindowTone, "blank"> {
  const rows = readCallbacks(cards).filter((card) => inTray(card, "open"));
  const order = ["gold", "paper", "ink", "mist"] as const;
  let best: Exclude<WindowTone, "blank"> = "gold";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const tone of order) {
    const count = rows.filter((card) => card.tone === tone).length;
    if (count < bestCount) {
      best = tone;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The owner carrying the fewest open windows.
 * A tie keeps the earlier name. A blank owner is not a load.
 * An empty desk stays blank.
 */
export function suggestOwner(cards: readonly Callback[]): string {
  const rows = readCallbacks(cards).filter((card) => inTray(card, "open") && card.owner);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.owner))).sort((a, b) => a.localeCompare(b));
  for (const owner of names) {
    const count = rows.filter((card) => card.owner === owner).length;
    if (count < bestCount) {
      best = owner;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The wait with the fewest open windows.
 * A tie keeps 3, then 1, then 7.
 * An empty desk still suggests 3.
 */
export function suggestWait(cards: readonly Callback[]): (typeof WAITS)[number] {
  const rows = readCallbacks(cards).filter((card) => inTray(card, "open"));
  const order = [3, 1, 7] as const;
  let best: (typeof WAITS)[number] = 3;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wait of order) {
    const count = rows.filter((card) => card.wait === wait).length;
    if (count < bestCount) {
      best = wait;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name with the fewest open windows.
 * A blank roster falls back to the least-loaded owner already on the desk.
 * A tie keeps the earlier name.
 */
export function fairOwner(cards: readonly Callback[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = ownerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestOwner(cards);
  const open = readCallbacks(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.owner === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the windows saved in this browser. The gap and the late mark use the hour you pass. */
export function callbacksCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,owner,hour,tone,tag,pace,rank,wait,band,pinned,held,done,gap,late,soon,home,note,audit"];
  for (const card of readCallbacks(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.owner),
      card.hour === null ? "" : String(card.hour),
      card.tone,
      csvCell(card.tag),
      card.pace,
      card.rank === null ? "" : String(card.rank),
      card.wait === null ? "" : String(card.wait),
      hourBand(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      lateCallback(card, desk) ? "1" : "0",
      soonCallback(card) ? "1" : "0",
      homeTag(card.tag) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function callbackCopy(card: Callback): string {
  return [card.title, card.owner, card.hour ?? "", card.tone, card.tag, card.pace, card.rank ?? "", card.wait ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function ownerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ownerLabel(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return callbackTag(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

/** "all" and an hour pick stay. An hour from 0 through 23 stays. Anything else is all. */
export function activeHour(filter: string): string {
  if (filter === "all") return "all";
  if ((HOUR_PICKS as readonly string[]).includes(filter)) return filter;
  const hour = hourOf(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if ((HOUR_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as HourPick };
  const hour = hourOf(filter);
  return hour === null ? { exact: null, pick: null } : { exact: hour, pick: null };
}

/** All, blank, and the ranks 1, 2, and 4 stay. Anything else is all. */
export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rank = rankOf(filter);
  return rank === null ? "all" : String(rank);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

/** All, blank, and the waits 1, 3, and 7 stay. Anything else is all. */
export function activeWait(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const wait = waitDays(filter);
  return wait === null ? "all" : String(wait);
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return waitDays(filter);
}

export function activeOwner(filter: string, owners: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const owner = ownerLabel(filter);
  return owner && owners.includes(owner) ? owner : "all";
}

export function ownerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return ownerLabel(filter) || null;
}

export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): WindowTone | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = callbackTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return callbackTag(filter) || null;
}

export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): WindowPace | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function readCallbackViews(raw: unknown): CallbackView[] {
  if (!Array.isArray(raw)) return [];
  const out: CallbackView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CallbackView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      owner: ownerSlot(row.owner),
      tone: toneSlot(row.tone),
      tag: tagSlot(row.tag),
      pace: paceSlot(row.pace),
      hour: activeHour(String(row.hour || "all")),
      rank: activeRank(String(row.rank || "all")),
      wait: activeWait(String(row.wait || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCallbackView(views: readonly CallbackView[], view: CallbackView): CallbackView[] {
  const current = readCallbackViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    owner: ownerSlot(view.owner),
    tone: toneSlot(view.tone),
    tag: tagSlot(view.tag),
    pace: paceSlot(view.pace),
    hour: activeHour(view.hour),
    rank: activeRank(view.rank),
    wait: activeWait(view.wait),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropCallbackView(views: readonly CallbackView[], id: string): CallbackView[] {
  return readCallbackViews(views).filter((view) => view.id !== id);
}

/**
 * An invite ring is a referral code already stored on the account.
 * It is letters and digits, so a house code such as 7FXA can lead with a digit.
 * Lengths that stay are 4, 5, 7, and 9. A blank value stays unset.
 */
export function inviteToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,9}$/.test(text)) return null;
  const size = text.length;
  if (size !== 4 && size !== 5 && size !== 7 && size !== 9) return null;
  return text;
}

function inviteBody(value: RingValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = inviteToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (RING_BLOCK.some((key) => key in value)) return null;
  if (!("referralCodeUsed" in value)) return { text: null, explicit: false };
  const inner = value.referralCodeUsed;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = inviteToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set ring is a referral code. A clear ring is an explicit blank.
 * A missing field stays unmarked. A blocked field is not this ring.
 */
export function inviteState(value: RingValue): RingState {
  const body = inviteBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The referral code, or a blank string when the ring is clear or unmarked. */
export function inviteCopy(value: RingValue): string {
  return inviteBody(value)?.text || "";
}

/**
 * Seed is 4. Stem is 5. Branch is 7. Crown is 9.
 * A blank code has no band.
 */
export function inviteBand(value: RingValue): RingBand {
  const text = inviteBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n === 4) return "seed";
  if (n === 5) return "stem";
  if (n === 7) return "branch";
  return "crown";
}

/** Even or odd length. A blank code has no parity. */
export function inviteParity(value: RingValue): RingParity {
  const text = inviteBody(value)?.text;
  if (!text) return "";
  return text.length % 2 === 0 ? "even" : "odd";
}

/** 7FXA, DESK2, IVORY88, and CHAMPAGN9 are the house catalog. */
export function catalogInvite(value: RingValue): boolean {
  const text = inviteBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A code of 7 or 9. A clear code is not wide. */
export function wideInvite(value: RingValue): boolean {
  const band = inviteBand(value);
  return band === "branch" || band === "crown";
}

/** An even length. A clear code is not even. */
export function evenInvite(value: RingValue): boolean {
  return inviteParity(value) === "even";
}

export function catalogInviteCount(rows: readonly RingRow[]): number {
  return rows.filter((row) => inviteState(row.note) === "set" && catalogInvite(row.note)).length;
}

export function wideInviteCount(rows: readonly RingRow[]): number {
  return rows.filter((row) => inviteState(row.note) === "set" && wideInvite(row.note)).length;
}

export function evenInviteCount(rows: readonly RingRow[]): number {
  return rows.filter((row) => inviteState(row.note) === "set" && evenInvite(row.note)).length;
}

/** How many distinct referral codes are shared by two or more customers. */
export function sharedInviteCount(rows: readonly RingRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (inviteState(row.note) !== "set") continue;
    const text = inviteCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function inviteBands(rows: readonly RingRow[]): RingBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = inviteState(row.note);
    if (state === "") continue;
    const band = state === "set" ? inviteBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: RingBandLine[] = [];
  for (const band of ["", ...RING_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function inviteParities(rows: readonly RingRow[]): RingParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = inviteParity(row.note);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: RingParityLine[] = [];
  for (const parity of ["", ...PARITIES]) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps seed, then stem, branch, and crown. An unmarked field is not a lead. */
export function leadingInvite(rows: readonly RingRow[]): string {
  const named = inviteBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => RING_BANDS.indexOf(band as (typeof RING_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The parity with the most loaded rows. A tie keeps even, then odd. A blank code is not a lead. */
export function leadingInviteParity(rows: readonly RingRow[]): string {
  const named = inviteParities(rows).filter((line) => line.parity);
  if (!named.length) return "";
  const order = (parity: string) => PARITIES.indexOf(parity as (typeof PARITIES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.parity) - order(b.parity))[0].parity;
}

export function inviteShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((RING_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentInvites(rows: readonly RingRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = inviteState(row.note);
    const token = state === "set" ? inviteBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenInvites(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandOwner(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleInvite(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenInvites(hidden, present);
  const current = readHiddenInvites(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleInviteBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenInvites(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function inviteBandArg(filter: string): RingBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as RingBand) : null;
}

export function activeInviteBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

function parityOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (PARITIES as readonly string[]).includes(text) ? text : "";
}

export function inviteParityArg(filter: string): RingParity | null {
  if (filter === "all") return null;
  const parity = parityOwner(filter);
  return parity ? (parity as RingParity) : null;
}

export function activeInviteParity(filter: string): string {
  if (filter === "all") return "all";
  return parityOwner(filter) || "all";
}

function rowId(row: RingRow): string {
  return String(row.id || "").trim();
}

export function readReviewedInvites(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 32);
}

export function toggleInviteReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedInvites(reviewed, present);
  const current = readReviewedInvites(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkInviteReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedInvites(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the parity, and the code are not part of the query. */
export function visibleInviteCustomers<T extends RingRow>(
  rows: readonly T[],
  band: RingBand | "blank" | null,
  parity: RingParity | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: RingShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = inviteState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && inviteBand(row.note) !== band) return false;
    if (parity !== null && inviteParity(row.note) !== parity) return false;
    if (shape === "catalog" && !catalogInvite(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideInvite(row.note))) return false;
    if (shape === "even" && !evenInvite(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and parities on this page. */
export function invitesCsv(rows: readonly RingRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = inviteState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of inviteBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of inviteParities(rows)) lines.push(["parity", csvCell(line.parity), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogInviteCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideInviteCount(rows))].join(","));
  lines.push(["shape", "even", String(evenInviteCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedInviteCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function inviteRowsCsv(rows: readonly RingRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,parity,invite,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(inviteBand(row.note)),
      csvCell(inviteParity(row.note)),
      csvCell(inviteCopy(row.note)),
      catalogInvite(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
