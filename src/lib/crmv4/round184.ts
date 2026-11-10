/**
 * Retention keeps for the callback desk, and the invalid-lead stamp already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_retention_keep (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   hour integer,
 *   cloth text not null default '',
 *   mark text not null default '',
 *   tone text not null default '',
 *   grade integer,
 *   wait integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_invalid_stamp_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_invalid_stamp_review (
 *   customer_id text primary key
 * );
 */

export const KEEP_KEY = "crmv4-retention-keeps";
export const KEEP_VIEW_KEY = "crmv4-retention-keep-views";
export const STAMP_KEY = "crmv4-invalid-stamp-hide";
export const STAMP_REVIEW_KEY = "crmv4-invalid-stamp-review";
/** Stamp age is measured against this UTC day so the bands stay stable. */
export const STAMP_AS_OF = "2026-11-10";

export type KeepCloth = "blank" | "ivory" | "graphite" | "champagne";

export type KeepTone = "blank" | "hush" | "even" | "firm";

export type KeepTray = "open" | "held" | "filed";

export type HourPick = "blank" | "dawn" | "day" | "dusk" | "peak" | "quiet";

export type Keep = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  hour: number | null;
  cloth: string;
  mark: string;
  tone: string;
  grade: number | null;
  wait: number | null;
  pinned: boolean;
  held: boolean;
  filed: boolean;
  audit: string;
};

export type KeepView = {
  id: string;
  name: string;
  tray: KeepTray;
  query: string;
  keeper: string;
  cloth: string;
  mark: string;
  tone: string;
  hour: string;
  grade: string;
  wait: string;
};

export type KeepCounts = {
  open: number;
  held: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type StampState = "" | "set" | "clear";

export type StampBand = "" | "fresh" | "week" | "month" | "old";

export type StampDepth = "" | "dawn" | "day" | "dusk" | "night";

export type StampShape = "all" | "weekend" | "first" | "noon";

export type StampValue =
  | {
      leadInvalidAt?: unknown;
      affiliateA?: unknown;
      affiliateB?: unknown;
      affiliateC?: unknown;
      campaign?: unknown;
      referralCodeUsed?: unknown;
      email?: unknown;
      name?: unknown;
      phone?: unknown;
      city?: unknown;
      country?: unknown;
      leadInvalid?: unknown;
      leadInvalidReason?: unknown;
      leadInvalidSource?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type StampRow = { id?: string; note?: StampValue; label?: string | null };

export type StampBandLine = { band: string; count: number };

export type StampDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "tone", "pin", "unpin", "hold", "release", "file", "unfile", "cloth"] as const;

const CLOTHS = ["ivory", "graphite", "champagne"] as const;

const TONES = ["hush", "even", "firm"] as const;

const TONE_ORDER = ["", "hush", "even", "firm"] as const;

const PICKS = ["blank", "dawn", "day", "dusk", "peak", "quiet"] as const;

const PEAKS = new Set([3, 7]);

const QUIETS = new Set([1, 4, 8]);

const GRADES = [2, 4, 8] as const;

const WAITS = [20, 40, 80] as const;

const HOME = new Set(["EN", "TR", "AR"]);

const STAMP_BANDS = ["fresh", "week", "month", "old"] as const;

const DEPTHS = ["dawn", "day", "dusk", "night"] as const;

const STATES = ["set", "clear"] as const;

const STAMP_BLOCK = [
  "affiliateA",
  "affiliateB",
  "affiliateC",
  "campaign",
  "referralCodeUsed",
  "email",
  "name",
  "phone",
  "city",
  "country",
  "leadInvalid",
  "leadInvalidReason",
  "leadInvalidSource",
] as const;

const KEEP_CAP = 9;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): KeepTray {
  return raw === "held" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<KeepCloth, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<KeepCloth, "blank">) : "";
}

function toneName(raw: unknown): Exclude<KeepTone, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<KeepTone, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function keepLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function keepNote(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A mark is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function keepMark(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * An hour is an integer from 1 through 8.
 * A blank value stays unset. 0 and 9 are not hours.
 * A leading zero is the same hour: 01 is 1, and 08 is 8. 09 is not an hour.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^(?:[1-8]|0[1-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A grade is 2, 4, or 8.
 * A blank value stays unset. 0 and 1 are not grades.
 * A leading zero is not a grade.
 */
export function gradeOf(raw: unknown): number | null {
  if (typeof raw === "number" && (GRADES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|8)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A wait is 20, 40, or 80 minutes. A blank value stays unset. A leading zero is not a wait. */
export function waitOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WAITS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:20|40|80)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Ivory, graphite, champagne, or blank. Anything else is blank. */
export function clothOf(raw: unknown): KeepCloth {
  return clothName(raw) || "blank";
}

/** Hush, even, firm, or blank. Anything else is blank. */
export function toneOf(raw: unknown): KeepTone {
  return toneName(raw) || "blank";
}

/** Dawn is 1–2. Day is 3–5. Dusk is 6–8. An unset hour is blank. */
export function hourBand(hour: unknown): "blank" | "dawn" | "day" | "dusk" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 2) return "dawn";
  if (value <= 5) return "day";
  return "dusk";
}

/** Peak hours are 3 and 7. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAKS.has(value);
}

/** Quiet hours are 1, 4, and 8. 3 and 7 are not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 8. A step of 4 stays. A step of -4 stays.
 * A positive step means the typed hour is ahead of the keep.
 */
export function hourGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 4) diff -= 8;
  if (diff < -4) diff += 8;
  return diff;
}

/** EN, TR, and AR are home marks. A blank mark is not. */
export function homeDesk(mark: unknown): boolean {
  return HOME.has(keepMark(mark));
}

export function readKeeps(raw: unknown): Keep[] {
  if (!Array.isArray(raw)) return [];
  const out: Keep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Keep>;
    const id = String(row.id || "").trim();
    const title = keepLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: keepNote(row.note),
      keeper: keeperLabel(row.keeper),
      hour: hourOf(row.hour),
      cloth: clothName(row.cloth),
      mark: keepMark(row.mark),
      tone: toneName(row.tone),
      grade: gradeOf(row.grade),
      wait: waitOf(row.wait),
      pinned: row.pinned === true,
      held: row.held === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, KEEP_CAP);
}

export function addKeep(
  cards: readonly Keep[],
  card: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    hour?: unknown;
    cloth?: string;
    mark?: string;
    tone?: string;
    grade?: unknown;
    wait?: unknown;
  },
): Keep[] {
  const current = readKeeps(cards);
  const id = String(card.id || "").trim();
  const title = keepLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Keep = {
    id,
    title,
    note: keepNote(card.note),
    keeper: keeperLabel(card.keeper),
    hour: hourOf(card.hour),
    cloth: clothName(card.cloth),
    mark: keepMark(card.mark),
    tone: toneName(card.tone),
    grade: gradeOf(card.grade),
    wait: waitOf(card.wait),
    pinned: false,
    held: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, KEEP_CAP);
}

/** Blank becomes hush. Hush becomes even, even becomes firm, and firm returns to hush. */
export function cycleTone(cards: readonly Keep[], id: string): Keep[] {
  return readKeeps(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TONE_ORDER.indexOf(card.tone as (typeof TONE_ORDER)[number]);
    const next = at < 0 || at >= TONES.length ? TONES[0] : TONES[at % TONES.length];
    if (!next || next === card.tone) return card;
    return { ...card, tone: next, audit: "tone" };
  });
}

export function setKeepPin(cards: readonly Keep[], id: string, pinned: boolean): Keep[] {
  return readKeeps(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setKeepHold(cards: readonly Keep[], id: string, held: boolean): Keep[] {
  return readKeeps(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setKeepFile(cards: readonly Keep[], id: string, filed: boolean): Keep[] {
  return readKeeps(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "unfile" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editKeep(cards: readonly Keep[], id: string, title: string): Keep[] {
  const current = readKeeps(cards);
  const next = keepLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editKeepNote(cards: readonly Keep[], id: string, note: string): Keep[] {
  const current = readKeeps(cards);
  const next = keepNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkKeepPin(cards: readonly Keep[], ids: readonly string[], pinned: boolean): Keep[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKeeps(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkKeepCloth(cards: readonly Keep[], ids: readonly string[], cloth: unknown): Keep[] {
  const next = clothName(cloth);
  if (!next) return readKeeps(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKeeps(cards).map((card) => (want.has(card.id) ? { ...card, cloth: next, audit: "cloth" } : card));
}

export function bulkKeepFile(cards: readonly Keep[], ids: readonly string[], filed: boolean): Keep[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKeeps(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "unfile" } : card));
}

export function resetKeeps(): Keep[] {
  return [];
}

function inTray(card: Keep, tray: KeepTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "held") return card.held && !card.filed;
  return !card.held && !card.filed;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "peak") return peakHour(hour);
  if (pick === "quiet") return quietHour(hour);
  return hourBand(hour) === pick;
}

function toneScore(tone: string): number {
  if (tone === "firm") return 3;
  if (tone === "even") return 2;
  if (tone === "hush") return 1;
  return 0;
}

function waitingPeak(card: Keep): boolean {
  return peakHour(card.hour) && inTray(card, "open");
}

/** An open keep whose hour sits more than two steps behind the desk clock. A held or filed keep is not late. */
export function lateKeep(card: Keep, desk: unknown): boolean {
  const gap = hourGap(card.hour, desk);
  return inTray(card, "open") && gap !== null && gap > 2;
}

/** An open keep with a 20 minute wait is the reminder. A held or filed keep is not. */
export function soonKeep(card: Keep): boolean {
  return inTray(card, "open") && card.wait === 20;
}

/** Search matches the title, the note, and the keeper. The hour and the cloth are not part of the query. */
export function visibleKeeps(
  cards: readonly Keep[],
  tray: KeepTray,
  query: string,
  keeper: string | null,
  cloth: KeepCloth | null,
  mark: string | null,
  tone: KeepTone | null,
  exact: number | null,
  pick: HourPick | null,
  grade: number | "blank" | null,
  wait: number | "blank" | null,
  firmOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Keep[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  const wantMark = mark === null ? null : keepMark(mark);
  return readKeeps(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantKeeper !== null && card.keeper !== wantKeeper) return false;
      if (cloth !== null && clothOf(card.cloth) !== cloth) return false;
      if (wantMark !== null && card.mark !== wantMark) return false;
      if (tone !== null && toneOf(card.tone) !== tone) return false;
      if (!hourHit(card.hour, exact, pick)) return false;
      if (grade === "blank" && card.grade !== null) return false;
      if (typeof grade === "number" && card.grade !== grade) return false;
      if (wait === "blank" && card.wait !== null) return false;
      if (typeof wait === "number" && card.wait !== wait) return false;
      if (firmOnly && card.tone !== "firm") return false;
      if (peakOnly && !peakHour(card.hour)) return false;
      if (homeOnly && !homeDesk(card.mark)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.keeper.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (toneScore(a.tone) !== toneScore(b.tone)) return toneScore(b.tone) - toneScore(a.tone);
      return a.title.localeCompare(b.title);
    });
}

export function keepTimeline(cards: readonly Keep[], query: string): Keep[] {
  const text = query.trim().toLowerCase();
  return readKeeps(cards)
    .filter((card) => card.hour !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.keeper.toLowerCase().includes(text))
    .sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title));
}

export function keepCounts(cards: readonly Keep[], desk: unknown): KeepCounts {
  const rows = readKeeps(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => waitingPeak(card)).length,
    late: rows.filter((card) => lateKeep(card, desk)).length,
    soon: rows.filter((card) => soonKeep(card)).length,
    home: rows.filter((card) => homeDesk(card.mark)).length,
  };
}

export function keepShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function keepKeepers(cards: readonly Keep[]): string[] {
  const seen = new Set<string>();
  for (const card of readKeeps(cards)) if (card.keeper) seen.add(card.keeper);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function keepMarks(cards: readonly Keep[]): string[] {
  const seen = new Set<string>();
  for (const card of readKeeps(cards)) if (card.mark) seen.add(card.mark);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function keepTones(cards: readonly Keep[]): Exclude<KeepTone, "blank">[] {
  const seen = new Set<string>();
  for (const card of readKeeps(cards)) if (card.tone) seen.add(card.tone);
  return TONES.filter((tone) => seen.has(tone));
}

export function clothCounts(cards: readonly Keep[]): { cloth: Exclude<KeepCloth, "blank">; count: number }[] {
  const rows = readKeeps(cards);
  return CLOTHS.map((cloth) => ({ cloth, count: rows.filter((card) => card.cloth === cloth).length })).filter((row) => row.count > 0);
}

export function usedHours(cards: readonly Keep[]): number {
  return new Set(readKeeps(cards).map((card) => card.hour).filter((hour): hour is number => hour !== null)).size;
}

export function clashHourIds(cards: readonly Keep[]): string[] {
  const open = readKeeps(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.hour === card.hour)).map((card) => card.id);
}

export function clashHourCount(cards: readonly Keep[]): number {
  return clashHourIds(cards).length;
}

export function gradeClashIds(cards: readonly Keep[]): string[] {
  const open = readKeeps(cards).filter((card) => inTray(card, "open") && card.grade !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.grade === card.grade)).map((card) => card.id);
}

export function gradeClashCount(cards: readonly Keep[]): number {
  return gradeClashIds(cards).length;
}

/** The next open keep at or after the desk hour. Firm tones wait. A blank desk hour stays blank. */
export function nextKeep(cards: readonly Keep[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readKeeps(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.tone !== "firm");
  if (!waiting.length) return "";
  const byHour = (a: Keep, b: Keep) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The cloth with the fewest open keeps.
 * A tie keeps champagne, then ivory, then graphite.
 * Keeps with no cloth are not a load. An empty desk still suggests champagne.
 */
export function suggestCloth(cards: readonly Keep[]): Exclude<KeepCloth, "blank"> {
  const rows = readKeeps(cards).filter((card) => inTray(card, "open"));
  const order = ["champagne", "ivory", "graphite"] as const;
  let best: Exclude<KeepCloth, "blank"> = "champagne";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const cloth of order) {
    const count = rows.filter((card) => card.cloth === cloth).length;
    if (count < bestCount) {
      best = cloth;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The keeper carrying the fewest open keeps.
 * A tie keeps the earlier name. A blank keeper is not a load.
 * An empty desk stays blank.
 */
export function suggestKeeper(cards: readonly Keep[]): string {
  const rows = readKeeps(cards).filter((card) => inTray(card, "open") && card.keeper);
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
 * The wait with the fewest open keeps.
 * A tie keeps 40, then 20, then 80.
 * An empty desk still suggests 40.
 */
export function suggestWait(cards: readonly Keep[]): (typeof WAITS)[number] {
  const rows = readKeeps(cards).filter((card) => inTray(card, "open"));
  const order = [40, 20, 80] as const;
  let best: (typeof WAITS)[number] = 40;
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
 * The roster name with the fewest open keeps.
 * A blank roster falls back to the least-loaded keeper already on the desk.
 * A tie keeps the earlier name.
 */
export function fairKeeper(cards: readonly Keep[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = keeperLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestKeeper(cards);
  const open = readKeeps(cards).filter((card) => inTray(card, "open"));
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

/** The CSV is the keeps saved in this browser. The gap and the late mark use the hour you pass. */
export function keepsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,keeper,hour,cloth,mark,tone,grade,wait,band,pinned,held,filed,gap,late,soon,home,note,audit"];
  for (const card of readKeeps(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.keeper),
      card.hour === null ? "" : String(card.hour),
      card.cloth,
      csvCell(card.mark),
      card.tone,
      card.grade === null ? "" : String(card.grade),
      card.wait === null ? "" : String(card.wait),
      hourBand(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateKeep(card, desk) ? "1" : "0",
      soonKeep(card) ? "1" : "0",
      homeDesk(card.mark) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function keepCopy(card: Keep): string {
  return [card.title, card.keeper, card.hour ?? "", card.cloth, card.mark, card.tone, card.grade ?? "", card.wait ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function keeperSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keeperLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keepMark(raw) || "all";
}

function toneSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return toneName(raw) || "all";
}

/** "all" and an hour pick stay. An hour from 1 through 8 stays. Anything else is all. */
export function activeHour(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const hour = hourOf(filter);
  return hour === null ? "all" : String(hour);
}

export function hourArg(filter: string): { exact: number | null; pick: HourPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as HourPick };
  const hour = hourOf(filter);
  return hour === null ? { exact: null, pick: null } : { exact: hour, pick: null };
}

/** All, blank, and the grades 2, 4, and 8 stay. Anything else is all. */
export function activeGrade(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const grade = gradeOf(filter);
  return grade === null ? "all" : String(grade);
}

export function gradeArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return gradeOf(filter);
}

/** All, blank, and the waits 20, 40, and 80 stay. Anything else is all. */
export function activeWait(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const wait = waitOf(filter);
  return wait === null ? "all" : String(wait);
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return waitOf(filter);
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

export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function clothArg(filter: string): KeepCloth | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothName(filter) || null;
}

export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = keepMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return keepMark(filter) || null;
}

export function activeTone(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tone = toneName(filter);
  return tone && tones.includes(tone) ? tone : "all";
}

export function toneArg(filter: string): KeepTone | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return toneName(filter) || null;
}

export function readKeepViews(raw: unknown): KeepView[] {
  if (!Array.isArray(raw)) return [];
  const out: KeepView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KeepView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      keeper: keeperSlot(row.keeper),
      cloth: clothSlot(row.cloth),
      mark: markSlot(row.mark),
      tone: toneSlot(row.tone),
      hour: activeHour(String(row.hour || "all")),
      grade: activeGrade(String(row.grade || "all")),
      wait: activeWait(String(row.wait || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addKeepView(views: readonly KeepView[], view: KeepView): KeepView[] {
  const current = readKeepViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    keeper: keeperSlot(view.keeper),
    cloth: clothSlot(view.cloth),
    mark: markSlot(view.mark),
    tone: toneSlot(view.tone),
    hour: activeHour(view.hour),
    grade: activeGrade(view.grade),
    wait: activeWait(view.wait),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropKeepView(views: readonly KeepView[], id: string): KeepView[] {
  return readKeepViews(views).filter((view) => view.id !== id);
}

function dayStamp(raw: string): { day: number; hour: number; text: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(raw.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  const hour = match[4] === undefined ? 0 : Number(match[4]);
  const minute = match[5] === undefined ? 0 : Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const utc = Date.UTC(year, month - 1, date);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return null;
  const text = match[4] === undefined
    ? `${match[1]}-${match[2]}-${match[3]}`
    : `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${String(second).padStart(2, "0")}Z`;
  return { day: utc, hour, text };
}

function stampIso(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return dayStamp(raw)?.text || "";
}

function stampParts(value: StampValue): { day: number; hour: number; text: string } | null {
  const body = stampBody(value);
  if (!body?.text) return null;
  return dayStamp(body.text);
}

function stampBody(value: StampValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") {
    const text = stampIso(value);
    if (text) return { text, explicit: true };
    return { text: "", explicit: value.trim() === "" };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (STAMP_BLOCK.some((key) => key in value)) return null;
  if (!("leadInvalidAt" in value)) return { text: "", explicit: false };
  const inner = value.leadInvalidAt;
  if (inner === null || inner === "") return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  const text = stampIso(inner);
  if (!text) return { text: "", explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set stamp is a real date. A clear stamp is an explicit blank. A missing field stays unmarked.
 * A reason, a source, and the other blocked fields are not this stamp.
 */
export function stampState(value: StampValue): StampState {
  const body = stampBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped stamp. A clear or unmarked value stays blank. */
export function stampCopy(value: StampValue): string {
  return stampBody(value)?.text || "";
}

/** Whole UTC days from the stamp's calendar day to 2026-11-10. A blank stamp stays unset. */
export function stampAge(value: StampValue): number | null {
  const parts = stampParts(value);
  if (!parts) return null;
  const asOf = dayStamp(STAMP_AS_OF);
  if (!asOf) return null;
  return Math.round((asOf.day - parts.day) / 86400000);
}

/**
 * Fresh is 0–7 days. Week is 8–30. Month is 31–90. Ninety-one and above is old.
 * A future stamp and a blank stamp have no band.
 */
export function stampBand(value: StampValue): StampBand {
  const age = stampAge(value);
  if (age === null || age < 0) return "";
  if (age <= 7) return "fresh";
  if (age <= 30) return "week";
  if (age <= 90) return "month";
  return "old";
}

/**
 * Dawn is 05–11. Day is 12–16. Dusk is 17–21. The rest is night.
 * A date with no clock is hour 0, which is night. A blank stamp has no depth.
 */
export function stampDepth(value: StampValue): StampDepth {
  const parts = stampParts(value);
  if (!parts) return "";
  const hour = parts.hour;
  if (hour >= 5 && hour <= 11) return "dawn";
  if (hour >= 12 && hour <= 16) return "day";
  if (hour >= 17 && hour <= 21) return "dusk";
  return "night";
}

/** A stamp that falls on Saturday or Sunday in UTC. A clear stamp is not a weekend. */
export function weekendStamp(value: StampValue): boolean {
  const parts = stampParts(value);
  if (!parts) return false;
  const day = new Date(parts.day).getUTCDay();
  return day === 0 || day === 6;
}

/** A stamp on the first UTC day of its month. A clear stamp is not a first. */
export function firstStamp(value: StampValue): boolean {
  const parts = stampParts(value);
  if (!parts) return false;
  return new Date(parts.day).getUTCDate() === 1;
}

/** A stamp whose clock hour is 12. A date with no clock is not noon. */
export function noonStamp(value: StampValue): boolean {
  const parts = stampParts(value);
  if (!parts) return false;
  return parts.hour === 12 && stampCopy(value).includes("T");
}

export function weekendStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampState(row.note) === "set" && weekendStamp(row.note)).length;
}

export function firstStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampState(row.note) === "set" && firstStamp(row.note)).length;
}

export function noonStampCount(rows: readonly StampRow[]): number {
  return rows.filter((row) => stampState(row.note) === "set" && noonStamp(row.note)).length;
}

/** How many distinct set days are shared by two or more customers. */
export function sharedStampCount(rows: readonly StampRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (stampState(row.note) !== "set") continue;
    const text = stampCopy(row.note).slice(0, 10);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function stampBands(rows: readonly StampRow[]): StampBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = stampState(row.note);
    if (state === "") continue;
    const band = state === "set" ? stampBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: StampBandLine[] = [];
  for (const band of ["", ...STAMP_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function stampDepths(rows: readonly StampRow[]): StampDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = stampDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: StampDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps fresh, then week, month, and old. An unmarked field is not a lead. */
export function leadingStamp(rows: readonly StampRow[]): string {
  const named = stampBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => STAMP_BANDS.indexOf(band as (typeof STAMP_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps the earlier depth. A blank stamp is not a lead. */
export function leadingStampDepth(rows: readonly StampRow[]): string {
  const named = stampDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

export function stampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandStamp(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((STAMP_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentStamps(rows: readonly StampRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = stampState(row.note);
    const token = state === "set" ? stampBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenStamps(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandStamp(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleStamp(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandStamp(band);
  if (!token || !present.includes(token)) return readHiddenStamps(hidden, present);
  const current = readHiddenStamps(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleStampBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenStamps(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function stampArg(filter: string): StampBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandStamp(filter);
  return band && band !== "blank" ? (band as StampBand) : null;
}

export function activeStamp(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandStamp(filter);
  return band && present.includes(band) ? band : "all";
}

function depthStamp(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (DEPTHS as readonly string[]).includes(text) ? text : "";
}

export function stampDepthArg(filter: string): StampDepth | null {
  if (filter === "all") return null;
  const depth = depthStamp(filter);
  return depth ? (depth as StampDepth) : null;
}

export function activeStampDepth(filter: string): string {
  if (filter === "all") return "all";
  return depthStamp(filter) || "all";
}

function rowId(row: StampRow): string {
  return String(row.id || "").trim();
}

export function readReviewedStamps(raw: unknown, present: readonly string[]): string[] {
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

export function toggleStampReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedStamps(reviewed, present);
  const current = readReviewedStamps(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkStampReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedStamps(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the stamp are not part of the query. */
export function visibleStampCustomers<T extends StampRow>(
  rows: readonly T[],
  band: StampBand | "blank" | null,
  depth: StampDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: StampShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = stampState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && stampBand(row.note) !== band) return false;
    if (depth !== null && stampDepth(row.note) !== depth) return false;
    if (shape === "weekend" && !weekendStamp(row.note)) return false;
    if (shape === "first" && (state !== "set" || !firstStamp(row.note))) return false;
    if (shape === "noon" && !noonStamp(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function stampsCsv(rows: readonly StampRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = stampState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of stampBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of stampDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  lines.push(["shape", "weekend", String(weekendStampCount(rows))].join(","));
  lines.push(["shape", "first", String(firstStampCount(rows))].join(","));
  lines.push(["shape", "noon", String(noonStampCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedStampCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function stampRowsCsv(rows: readonly StampRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,age,weekend,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const age = stampAge(row.note);
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(stampBand(row.note)),
      csvCell(stampDepth(row.note)),
      age === null ? "" : String(age),
      weekendStamp(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
