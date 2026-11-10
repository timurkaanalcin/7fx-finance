/**
 * Vesper bells for the evening desk, and the trading server already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_vesper_bell (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   minute integer,
 *   tone text not null default '',
 *   code text not null default '',
 *   cadence text not null default '',
 *   span integer,
 *   pause integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_server_stem_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_server_stem_review (
 *   customer_id text primary key
 * );
 */

export const BELL_KEY = "crmv4-vesper-bells";
export const BELL_VIEW_KEY = "crmv4-vesper-bell-views";
export const STEM_KEY = "crmv4-server-stem-hide";
export const STEM_REVIEW_KEY = "crmv4-server-stem-review";

export type BellTone = "blank" | "ivory" | "ink" | "champagne" | "graphite";

export type BellCadence = "blank" | "still" | "soft" | "brisk";

export type BellTray = "open" | "held" | "done";

export type MinutePick = "blank" | "first" | "mid" | "late" | "peak" | "quiet";

export type Bell = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  minute: number | null;
  tone: string;
  code: string;
  cadence: string;
  span: number | null;
  pause: number | null;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type BellView = {
  id: string;
  name: string;
  tray: BellTray;
  query: string;
  keeper: string;
  tone: string;
  code: string;
  cadence: string;
  minute: string;
  span: string;
  pause: string;
};

export type BellCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type StemState = "" | "set" | "clear";

export type StemBand = "" | "seed" | "stem" | "trunk" | "canopy";

export type StemParity = "" | "even" | "odd";

export type StemShape = "all" | "catalog" | "wide" | "even";

export type StemValue =
  | { tradingServer?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type StemRow = { id?: string; note?: StemValue; label?: string | null };

export type StemBandLine = { band: string; count: number };

export type StemParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "cadence", "pin", "unpin", "hold", "lift", "done", "undo", "tone"] as const;

const TONES = ["ivory", "ink", "champagne", "graphite"] as const;

const CADENCES = ["still", "soft", "brisk"] as const;

const CADENCE_ORDER = ["", "still", "soft", "brisk"] as const;

const MINUTE_PICKS = ["blank", "first", "mid", "late", "peak", "quiet"] as const;

const PEAK_MINUTES = new Set([0, 30]);

const QUIET_MINUTES = new Set([5, 55]);

const SPANS = [3, 6, 12] as const;

const PAUSES = [5, 15, 45] as const;

const HOME = new Set(["GBR", "FRA", "CHE"]);

const STEM_BANDS = ["seed", "stem", "trunk", "canopy"] as const;

const PARITIES = ["even", "odd"] as const;

const CATALOG = new Set([6, 10, 14, 20]);

const STEM_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const BELL_CAP = 8;

const VIEW_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): BellTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function toneName(raw: unknown): Exclude<BellTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<BellTone, "blank">) : "";
}

function cadenceName(raw: unknown): Exclude<BellCadence, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CADENCES as readonly string[]).includes(text) ? (text as Exclude<BellCadence, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function bellLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function bellNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A code is exactly three letters. Anything else stays blank. Letters are stored in capitals. */
export function bellCode(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

/**
 * An minute is an integer from 0 through 23.
 * A blank value stays unset. 24 is not an minute.
 * A leading zero is the same minute: 00 is 0, and 09 is 9.
 */
export function minuteOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 59) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|[1-5][0-9]|0[0-9])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A span is 2, 4, or 8.
 * A blank value stays unset. 0 and 1 are not spans.
 * A leading zero is not a span.
 */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:3|6|12)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A pause is 10, 30, or 60 minutes. A blank value stays unset. A leading zero is not a pause. */
export function pauseMinutes(raw: unknown): number | null {
  if (typeof raw === "number" && (PAUSES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:5|15|45)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Pearl, soot, gilt, mist, or blank. Anything else is blank. */
export function toneOf(raw: unknown): BellTone {
  return toneName(raw) || "blank";
}

/** Hush, walk, run, or blank. Anything else is blank. */
export function cadenceOf(raw: unknown): BellCadence {
  return cadenceName(raw) || "blank";
}

/** Night is 0–5. Day is 6–17. Eve is 18–23. An unset minute is blank. */
export function minuteBand(minute: unknown): "blank" | "first" | "mid" | "late" {
  const value = minuteOf(minute);
  if (value === null) return "blank";
  if (value <= 19) return "first";
  if (value <= 39) return "mid";
  return "late";
}

/** Peak minutes are 9 and 16. An unset minute is not a peak. */
export function peakMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && PEAK_MINUTES.has(value);
}

/** Quiet minutes are 0, 6, and 22. 9 and 16 are not quiet. An unset minute is not quiet. */
export function quietMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && QUIET_MINUTES.has(value);
}

/**
 * The shortest signed step from the saved minute to the typed minute.
 * The ring wraps at 24. A step of 12 stays. A step of -12 stays.
 * A positive step means the typed minute is ahead of the bell.
 */
export function minuteGap(minute: unknown, desk: unknown): number | null {
  const from = minuteOf(minute);
  const at = minuteOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 30) diff -= 60;
  if (diff < -30) diff += 60;
  return diff;
}

/** TR, DE, and AE are home codes. A blank code is not. */
export function homeCode(code: unknown): boolean {
  return HOME.has(bellCode(code));
}

export function readBells(raw: unknown): Bell[] {
  if (!Array.isArray(raw)) return [];
  const out: Bell[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Bell>;
    const id = String(row.id || "").trim();
    const title = bellLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: bellNote(row.note),
      keeper: keeperLabel(row.keeper),
      minute: minuteOf(row.minute),
      tone: toneName(row.tone),
      code: bellCode(row.code),
      cadence: cadenceName(row.cadence),
      span: spanOf(row.span),
      pause: pauseMinutes(row.pause),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, BELL_CAP);
}

export function addBell(
  cards: readonly Bell[],
  card: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    minute?: unknown;
    tone?: string;
    code?: string;
    cadence?: string;
    span?: unknown;
    pause?: unknown;
  },
): Bell[] {
  const current = readBells(cards);
  const id = String(card.id || "").trim();
  const title = bellLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Bell = {
    id,
    title,
    note: bellNote(card.note),
    keeper: keeperLabel(card.keeper),
    minute: minuteOf(card.minute),
    tone: toneName(card.tone),
    code: bellCode(card.code),
    cadence: cadenceName(card.cadence),
    span: spanOf(card.span),
    pause: pauseMinutes(card.pause),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, BELL_CAP);
}

/** Blank becomes hush. Hush becomes walk, walk becomes run, and run returns to hush. */
export function cycleCadence(cards: readonly Bell[], id: string): Bell[] {
  return readBells(cards).map((card) => {
    if (card.id !== id) return card;
    const at = CADENCE_ORDER.indexOf(card.cadence as (typeof CADENCE_ORDER)[number]);
    const next = at < 0 || at >= CADENCES.length ? CADENCES[0] : CADENCES[at % CADENCES.length];
    if (!next || next === card.cadence) return card;
    return { ...card, cadence: next, audit: "cadence" };
  });
}

export function setBellPin(cards: readonly Bell[], id: string, pinned: boolean): Bell[] {
  return readBells(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setBellHold(cards: readonly Bell[], id: string, held: boolean): Bell[] {
  return readBells(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setBellRing(cards: readonly Bell[], id: string, done: boolean): Bell[] {
  return readBells(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "undo" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editBell(cards: readonly Bell[], id: string, title: string): Bell[] {
  const current = readBells(cards);
  const next = bellLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editBellNote(cards: readonly Bell[], id: string, note: string): Bell[] {
  const current = readBells(cards);
  const next = bellNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkBellPin(cards: readonly Bell[], ids: readonly string[], pinned: boolean): Bell[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBells(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkBellTone(cards: readonly Bell[], ids: readonly string[], tone: unknown): Bell[] {
  const next = toneName(tone);
  if (!next) return readBells(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBells(cards).map((card) => (want.has(card.id) ? { ...card, tone: next, audit: "tone" } : card));
}

export function bulkBellRing(cards: readonly Bell[], ids: readonly string[], done: boolean): Bell[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readBells(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "undo" } : card));
}

export function resetBells(): Bell[] {
  return [];
}

function inTray(card: Bell, tray: BellTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function minuteHit(minute: number | null, exact: number | null, pick: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (pick === null) return true;
  if (pick === "blank") return minute === null;
  if (pick === "peak") return peakMinute(minute);
  if (pick === "quiet") return quietMinute(minute);
  return minuteBand(minute) === pick;
}

function cadenceScore(cadence: string): number {
  if (cadence === "brisk") return 3;
  if (cadence === "soft") return 2;
  if (cadence === "still") return 1;
  return 0;
}

/** An open bell whose minute sits more than four steps behind the desk minute. A held or done bell is not late. */
export function lateBell(card: Bell, desk: unknown): boolean {
  const gap = minuteGap(card.minute, desk);
  return inTray(card, "open") && gap !== null && gap > 8;
}

/** An open bell with a 10 minute pause is the reminder. A held or done bell is not. */
export function soonBell(card: Bell): boolean {
  return inTray(card, "open") && card.pause === 5;
}

/** Search matches the title, the note, and the keeper. The minute and the tone are not part of the query. */
export function visibleBells(
  cards: readonly Bell[],
  tray: BellTray,
  query: string,
  keeper: string | null,
  tone: BellTone | null,
  code: string | null,
  cadence: BellCadence | null,
  exact: number | null,
  pick: MinutePick | null,
  span: number | "blank" | null,
  pause: number | "blank" | null,
  stillOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Bell[] {
  const text = query.trim().toLowerCase();
  const wantOwner = keeper === null ? null : keeperLabel(keeper);
  const wantMark = code === null ? null : bellCode(code);
  return readBells(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantOwner !== null && card.keeper !== wantOwner) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (wantMark !== null && card.code !== wantMark) return false;
      if (cadence !== null && cadenceOf(card.cadence) !== cadence) return false;
      if (!minuteHit(card.minute, exact, pick)) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (pause === "blank" && card.pause !== null) return false;
      if (typeof pause === "number" && card.pause !== pause) return false;
      if (stillOnly && card.cadence !== "still") return false;
      if (peakOnly && !peakMinute(card.minute)) return false;
      if (homeOnly && !homeCode(card.code)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.keeper.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (cadenceScore(a.cadence) !== cadenceScore(b.cadence)) return cadenceScore(b.cadence) - cadenceScore(a.cadence);
      return a.title.localeCompare(b.title);
    });
}

export function bellTimeline(cards: readonly Bell[], query: string): Bell[] {
  const text = query.trim().toLowerCase();
  return readBells(cards)
    .filter((card) => card.minute !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.keeper.toLowerCase().includes(text))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || a.title.localeCompare(b.title));
}

export function bellCounts(cards: readonly Bell[], desk: unknown): BellCounts {
  const rows = readBells(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakMinute(card.minute) && inTray(card, "open")).length,
    late: rows.filter((card) => lateBell(card, desk)).length,
    soon: rows.filter((card) => soonBell(card)).length,
    home: rows.filter((card) => homeCode(card.code)).length,
  };
}

export function bellShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function bellKeepers(cards: readonly Bell[]): string[] {
  const seen = new Set<string>();
  for (const card of readBells(cards)) if (card.keeper) seen.add(card.keeper);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function bellCodes(cards: readonly Bell[]): string[] {
  const seen = new Set<string>();
  for (const card of readBells(cards)) if (card.code) seen.add(card.code);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function bellCadences(cards: readonly Bell[]): Exclude<BellCadence, "blank">[] {
  const seen = new Set<string>();
  for (const card of readBells(cards)) if (card.cadence) seen.add(card.cadence);
  return CADENCES.filter((cadence) => seen.has(cadence));
}

export function toneCounts(cards: readonly Bell[]): { tone: Exclude<BellTone, "blank">; count: number }[] {
  const rows = readBells(cards);
  return TONES.map((tone) => ({ tone, count: rows.filter((card) => card.tone === tone).length })).filter((row) => row.count > 0);
}

export function usedMinutes(cards: readonly Bell[]): number {
  return new Set(readBells(cards).map((card) => card.minute).filter((minute): minute is number => minute !== null)).size;
}

export function clashMinuteIds(cards: readonly Bell[]): string[] {
  const open = readBells(cards).filter((card) => inTray(card, "open") && card.minute !== null && card.tone);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tone === card.tone && other.minute === card.minute)).map((card) => card.id);
}

export function clashMinuteCount(cards: readonly Bell[]): number {
  return clashMinuteIds(cards).length;
}

export function spanClashIds(cards: readonly Bell[]): string[] {
  const open = readBells(cards).filter((card) => inTray(card, "open") && card.span !== null && card.tone);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tone === card.tone && other.span === card.span)).map((card) => card.id);
}

export function spanClashCount(cards: readonly Bell[]): number {
  return spanClashIds(cards).length;
}

/** The next open bell at or after the desk minute. Run cadences pause. A blank desk minute stays blank. */
export function nextBell(cards: readonly Bell[], desk: unknown): string {
  const now = minuteOf(desk);
  if (now === null) return "";
  const waiting = readBells(cards).filter((card) => inTray(card, "open") && card.minute !== null && card.cadence !== "brisk");
  if (!waiting.length) return "";
  const byHour = (a: Bell, b: Bell) => (a.minute ?? 0) - (b.minute ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.minute ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The tone with the fewest open bells.
 * A tie keeps mist, then gilt, then pearl, then soot.
 * Bells with no tone are not a load. An empty desk still suggests mist.
 */
export function suggestTone(cards: readonly Bell[]): Exclude<BellTone, "blank"> {
  const rows = readBells(cards).filter((card) => inTray(card, "open"));
  const order = ["graphite", "champagne", "ivory", "ink"] as const;
  let best: Exclude<BellTone, "blank"> = "graphite";
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
 * The keeper carrying the fewest open bells.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty desk stays blank.
 */
export function suggestKeeper(cards: readonly Bell[]): string {
  const rows = readBells(cards).filter((card) => inTray(card, "open") && card.keeper);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.keeper))).sort((a, b) => a.localeCompare(b));
  for (const keeper of names) {
    const count = rows.filter((card) => card.keeper === keeper).length;
    if (count < bestCount) {
      best = keeper;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The pause with the fewest open bells.
 * A tie keeps 30, then 10, then 60.
 * An empty desk still suggests 30.
 */
export function suggestPause(cards: readonly Bell[]): (typeof PAUSES)[number] {
  const rows = readBells(cards).filter((card) => inTray(card, "open"));
  const order = [15, 5, 45] as const;
  let best: (typeof PAUSES)[number] = 15;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const pause of order) {
    const count = rows.filter((card) => card.pause === pause).length;
    if (count < bestCount) {
      best = pause;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name with the fewest open bells.
 * A blank roster falls back to the least-loaded keeper already on the desk.
 * A tie keeps the earlier name.
 */
export function fairKeeper(cards: readonly Bell[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(cards);
  const open = readBells(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.keeper === name).length;
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

/** The CSV is the bells saved in this browser. The gap and the late code use the minute you pass. */
export function bellsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,minute,tone,code,cadence,span,pause,band,pinned,held,done,gap,late,soon,home,note,audit"];
  for (const card of readBells(raw)) {
    const gap = minuteGap(card.minute, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.minute === null ? "" : String(card.minute),
      card.tone,
      csvCell(card.code),
      card.cadence,
      card.span === null ? "" : String(card.span),
      card.pause === null ? "" : String(card.pause),
      minuteBand(card.minute),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      lateBell(card, desk) ? "1" : "0",
      soonBell(card) ? "1" : "0",
      homeCode(card.code) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function bellCopy(card: Bell): string {
  return [card.title, card.keeper, card.minute ?? "", card.tone, card.code, card.cadence, card.span ?? "", card.pause ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function keeperSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keeperLabel(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bellCode(raw) || "all";
}

function cadenceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return cadenceName(raw) || "all";
}

/** "all" and an minute pick stay. An minute from 0 through 23 stays. Anything else is all. */
export function activeMinute(filter: string): string {
  if (filter === "all") return "all";
  if ((MINUTE_PICKS as readonly string[]).includes(filter)) return filter;
  const minute = minuteOf(filter);
  return minute === null ? "all" : String(minute);
}

export function minuteArg(filter: string): { exact: number | null; pick: MinutePick | null } {
  if ((MINUTE_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as MinutePick };
  const minute = minuteOf(filter);
  return minute === null ? { exact: null, pick: null } : { exact: minute, pick: null };
}

/** All, blank, and the spans 2, 4, and 8 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** All, blank, and the pauses 10, 30, and 60 stay. Anything else is all. */
export function activePause(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const pause = pauseMinutes(filter);
  return pause === null ? "all" : String(pause);
}

export function pauseArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pauseMinutes(filter);
}

export function activeKeeper(filter: string, keepers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const keeper = keeperLabel(filter);
  return keeper && keepers.includes(keeper) ? keeper : "all";
}

export function keeperArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return keeperLabel(filter) || null;
}

export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): BellTone | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

export function activeMark(filter: string, codes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const code = bellCode(filter);
  return code && codes.includes(code) ? code : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return bellCode(filter) || null;
}

export function activeCadence(filter: string, cadences: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cadence = cadenceName(filter);
  return cadence && cadences.includes(cadence) ? cadence : "all";
}

export function cadenceArg(filter: string): BellCadence | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return cadenceName(filter) || null;
}

export function readBellViews(raw: unknown): BellView[] {
  if (!Array.isArray(raw)) return [];
  const out: BellView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BellView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      keeper: keeperSlot(row.keeper),
      tone: toneSlot(row.tone),
      code: markSlot(row.code),
      cadence: cadenceSlot(row.cadence),
      minute: activeMinute(String(row.minute || "all")),
      span: activeSpan(String(row.span || "all")),
      pause: activePause(String(row.pause || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addBellView(views: readonly BellView[], view: BellView): BellView[] {
  const current = readBellViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    keeper: keeperSlot(view.keeper),
    tone: toneSlot(view.tone),
    code: markSlot(view.code),
    cadence: cadenceSlot(view.cadence),
    minute: activeMinute(view.minute),
    span: activeSpan(view.span),
    pause: activePause(view.pause),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropBellView(views: readonly BellView[], id: string): BellView[] {
  return readBellViews(views).filter((view) => view.id !== id);
}

/**
 * An assignee token is 8 to 32 letters or digits.
 * A blank value stays unset. A shorter token is not an assignee.
 * A hyphen is not part of a token.
 */
export function stemToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  return /^[A-Za-z0-9]{6,20}$/.test(text) ? text : null;
}

function stemBody(value: StemValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = stemToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (STEM_BLOCK.some((key) => key in value)) return null;
  if (!("tradingServer" in value)) return { text: null, explicit: false };
  const inner = value.tradingServer;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = stemToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set plate is an assignee token. A clear plate is an explicit blank.
 * A missing field stays unmarked. A blocked field is not this plate.
 */
export function stemState(value: StemValue): StemState {
  const body = stemBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The assignee token, or a blank string when the plate is clear or unmarked. */
export function stemCopy(value: StemValue): string {
  return stemBody(value)?.text || "";
}

/**
 * Stub is 8–12. Slip is 13–18. Plate is 19–24. Wide is 25–32.
 * A blank assignee has no band.
 */
export function stemBand(value: StemValue): StemBand {
  const text = stemBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n <= 8) return "seed";
  if (n <= 12) return "stem";
  if (n <= 16) return "trunk";
  return "canopy";
}

/** Even or odd length. A blank assignee has no parity. */
export function stemParity(value: StemValue): StemParity {
  const text = stemBody(value)?.text;
  if (!text) return "";
  return text.length % 2 === 0 ? "even" : "odd";
}

/** Lengths 8, 16, 24, and 32 are the house catalog. A clear plate is not catalog. */
export function catalogStem(value: StemValue): boolean {
  const text = stemBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text.length);
}

/** A token of 25 or more. A clear plate is not wide. */
export function wideStem(value: StemValue): boolean {
  return stemBand(value) === "canopy";
}

/** An even length. A clear plate is not even. */
export function evenStem(value: StemValue): boolean {
  return stemParity(value) === "even";
}

export function catalogStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && catalogStem(row.note)).length;
}

export function wideStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && wideStem(row.note)).length;
}

export function evenStemCount(rows: readonly StemRow[]): number {
  return rows.filter((row) => stemState(row.note) === "set" && evenStem(row.note)).length;
}

/** How many distinct assignee tokens are shared by two or more customers. */
export function sharedStemCount(rows: readonly StemRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (stemState(row.note) !== "set") continue;
    const text = stemCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function stemBands(rows: readonly StemRow[]): StemBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = stemState(row.note);
    if (state === "") continue;
    const band = state === "set" ? stemBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: StemBandLine[] = [];
  for (const band of ["", ...STEM_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function stemParities(rows: readonly StemRow[]): StemParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = stemParity(row.note);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: StemParityLine[] = [];
  for (const parity of ["", ...PARITIES]) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps stub, then slip, plate, and wide. An unmarked field is not a lead. */
export function leadingStem(rows: readonly StemRow[]): string {
  const named = stemBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => STEM_BANDS.indexOf(band as (typeof STEM_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The parity with the most loaded rows. A tie keeps even, then odd. A blank assignee is not a lead. */
export function leadingStemParity(rows: readonly StemRow[]): string {
  const named = stemParities(rows).filter((line) => line.parity);
  if (!named.length) return "";
  const order = (parity: string) => PARITIES.indexOf(parity as (typeof PARITIES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.parity) - order(b.parity))[0].parity;
}

export function stemShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((STEM_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentStems(rows: readonly StemRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = stemState(row.note);
    const token = state === "set" ? stemBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenStems(raw: unknown, present: readonly string[]): string[] {
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

export function toggleStem(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenStems(hidden, present);
  const current = readHiddenStems(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleStemBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStems(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function stemBandArg(filter: string): StemBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as StemBand) : null;
}

export function activeStemBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

function parityOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (PARITIES as readonly string[]).includes(text) ? text : "";
}

export function stemParityArg(filter: string): StemParity | null {
  if (filter === "all") return null;
  const parity = parityOwner(filter);
  return parity ? (parity as StemParity) : null;
}

export function activeStemParity(filter: string): string {
  if (filter === "all") return "all";
  return parityOwner(filter) || "all";
}

function rowId(row: StemRow): string {
  return String(row.id || "").trim();
}

export function readReviewedStems(raw: unknown, present: readonly string[]): string[] {
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

export function toggleStemReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedStems(reviewed, present);
  const current = readReviewedStems(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkStemReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedStems(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the parity, and the assignee are not part of the query. */
export function visibleStemCustomers<T extends StemRow>(
  rows: readonly T[],
  band: StemBand | "blank" | null,
  parity: StemParity | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: StemShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = stemState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && stemBand(row.note) !== band) return false;
    if (parity !== null && stemParity(row.note) !== parity) return false;
    if (shape === "catalog" && !catalogStem(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideStem(row.note))) return false;
    if (shape === "even" && !evenStem(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and parities on this page. */
export function stemsCsv(rows: readonly StemRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = stemState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of stemBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of stemParities(rows)) lines.push(["parity", csvCell(line.parity), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogStemCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideStemCount(rows))].join(","));
  lines.push(["shape", "even", String(evenStemCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedStemCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function stemRowsCsv(rows: readonly StemRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,parity,server,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(stemBand(row.note)),
      csvCell(stemParity(row.note)),
      csvCell(stemCopy(row.note)),
      catalogStem(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
