/**
 * Slate watches for the night desk, and the assignee already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_slate_watch (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   owner text not null default '',
 *   hour integer,
 *   tint text not null default '',
 *   mark text not null default '',
 *   tempo text not null default '',
 *   weight integer,
 *   wait integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_owner_plate_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_owner_plate_review (
 *   customer_id text primary key
 * );
 */

export const SLATE_KEY = "crmv4-slate-watches";
export const SLATE_VIEW_KEY = "crmv4-slate-watch-views";
export const OWNER_KEY = "crmv4-owner-plate-hide";
export const OWNER_REVIEW_KEY = "crmv4-owner-plate-review";

export type SlateTint = "blank" | "pearl" | "soot" | "gilt" | "mist";

export type SlateTempo = "blank" | "hush" | "walk" | "run";

export type SlateTray = "open" | "held" | "done";

export type HourPick = "blank" | "night" | "day" | "eve" | "peak" | "quiet";

export type Slate = {
  id: string;
  title: string;
  note: string;
  owner: string;
  hour: number | null;
  tint: string;
  mark: string;
  tempo: string;
  weight: number | null;
  wait: number | null;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type SlateView = {
  id: string;
  name: string;
  tray: SlateTray;
  query: string;
  owner: string;
  tint: string;
  mark: string;
  tempo: string;
  hour: string;
  weight: string;
  wait: string;
};

export type SlateCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type OwnerState = "" | "set" | "clear";

export type OwnerBand = "" | "stub" | "slip" | "plate" | "wide";

export type OwnerParity = "" | "even" | "odd";

export type OwnerShape = "all" | "catalog" | "wide" | "even";

export type OwnerValue =
  | { assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type OwnerRow = { id?: string; note?: OwnerValue; label?: string | null };

export type OwnerBandLine = { band: string; count: number };

export type OwnerParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "tempo", "pin", "unpin", "hold", "lift", "done", "undo", "tint"] as const;

const TINTS = ["pearl", "soot", "gilt", "mist"] as const;

const TEMPOS = ["hush", "walk", "run"] as const;

const TEMPO_ORDER = ["", "hush", "walk", "run"] as const;

const PICKS = ["blank", "night", "day", "eve", "peak", "quiet"] as const;

const PEAKS = new Set([9, 16]);

const QUIETS = new Set([0, 6, 22]);

const WEIGHTS = [2, 4, 8] as const;

const WAITS = [10, 30, 60] as const;

const HOME = new Set(["TR", "DE", "AE"]);

const OWNER_BANDS = ["stub", "slip", "plate", "wide"] as const;

const PARITIES = ["even", "odd"] as const;

const CATALOG = new Set([8, 16, 24, 32]);

const OWNER_BLOCK = ["balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const SLATE_CAP = 7;

const VIEW_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlateTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function tintName(raw: unknown): Exclude<SlateTint, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TINTS as readonly string[]).includes(text) ? (text as Exclude<SlateTint, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<SlateTempo, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<SlateTempo, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slateLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function slateNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank owner stays blank. It is not filled in. */
export function ownerLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A mark is exactly two letters. Anything else stays blank. Letters are stored in capitals. */
export function slateMark(raw: unknown): string {
  const text = clip(raw, 6).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * An hour is an integer from 0 through 23.
 * A blank value stays unset. 24 is not an hour.
 * A leading zero is the same hour: 00 is 0, and 09 is 9.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|1[0-9]|2[0-3]|0[0-9])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A weight is 2, 4, or 8.
 * A blank value stays unset. 0 and 1 are not weights.
 * A leading zero is not a weight.
 */
export function weightOf(raw: unknown): number | null {
  if (typeof raw === "number" && (WEIGHTS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|8)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A wait is 10, 30, or 60 minutes. A blank value stays unset. A leading zero is not a wait. */
export function waitMinutes(raw: unknown): number | null {
  if (typeof raw === "number" && (WAITS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:10|30|60)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Pearl, soot, gilt, mist, or blank. Anything else is blank. */
export function tintOf(raw: unknown): SlateTint {
  return tintName(raw) || "blank";
}

/** Hush, walk, run, or blank. Anything else is blank. */
export function tempoOf(raw: unknown): SlateTempo {
  return tempoName(raw) || "blank";
}

/** Night is 0–5. Day is 6–17. Eve is 18–23. An unset hour is blank. */
export function hourBand(hour: unknown): "blank" | "night" | "day" | "eve" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 5) return "night";
  if (value <= 17) return "day";
  return "eve";
}

/** Peak hours are 9 and 16. An unset hour is not a peak. */
export function peakHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && PEAKS.has(value);
}

/** Quiet hours are 0, 6, and 22. 9 and 16 are not quiet. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved hour to the typed hour.
 * The ring wraps at 24. A step of 12 stays. A step of -12 stays.
 * A positive step means the typed hour is ahead of the slate.
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

/** TR, DE, and AE are home marks. A blank mark is not. */
export function homeMark(mark: unknown): boolean {
  return HOME.has(slateMark(mark));
}

export function readSlates(raw: unknown): Slate[] {
  if (!Array.isArray(raw)) return [];
  const out: Slate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Slate>;
    const id = String(row.id || "").trim();
    const title = slateLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: slateNote(row.note),
      owner: ownerLabel(row.owner),
      hour: hourOf(row.hour),
      tint: tintName(row.tint),
      mark: slateMark(row.mark),
      tempo: tempoName(row.tempo),
      weight: weightOf(row.weight),
      wait: waitMinutes(row.wait),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLATE_CAP);
}

export function addSlate(
  cards: readonly Slate[],
  card: {
    id: string;
    title: string;
    note?: string;
    owner?: string;
    hour?: unknown;
    tint?: string;
    mark?: string;
    tempo?: string;
    weight?: unknown;
    wait?: unknown;
  },
): Slate[] {
  const current = readSlates(cards);
  const id = String(card.id || "").trim();
  const title = slateLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Slate = {
    id,
    title,
    note: slateNote(card.note),
    owner: ownerLabel(card.owner),
    hour: hourOf(card.hour),
    tint: tintName(card.tint),
    mark: slateMark(card.mark),
    tempo: tempoName(card.tempo),
    weight: weightOf(card.weight),
    wait: waitMinutes(card.wait),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLATE_CAP);
}

/** Blank becomes hush. Hush becomes walk, walk becomes run, and run returns to hush. */
export function cycleTempo(cards: readonly Slate[], id: string): Slate[] {
  return readSlates(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TEMPO_ORDER.indexOf(card.tempo as (typeof TEMPO_ORDER)[number]);
    const next = at < 0 || at >= TEMPOS.length ? TEMPOS[0] : TEMPOS[at % TEMPOS.length];
    if (!next || next === card.tempo) return card;
    return { ...card, tempo: next, audit: "tempo" };
  });
}

export function setSlatePin(cards: readonly Slate[], id: string, pinned: boolean): Slate[] {
  return readSlates(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setSlateHold(cards: readonly Slate[], id: string, held: boolean): Slate[] {
  return readSlates(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setSlateDone(cards: readonly Slate[], id: string, done: boolean): Slate[] {
  return readSlates(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "undo" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSlate(cards: readonly Slate[], id: string, title: string): Slate[] {
  const current = readSlates(cards);
  const next = slateLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editSlateNote(cards: readonly Slate[], id: string, note: string): Slate[] {
  const current = readSlates(cards);
  const next = slateNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkSlatePin(cards: readonly Slate[], ids: readonly string[], pinned: boolean): Slate[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlates(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkSlateTint(cards: readonly Slate[], ids: readonly string[], tint: unknown): Slate[] {
  const next = tintName(tint);
  if (!next) return readSlates(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlates(cards).map((card) => (want.has(card.id) ? { ...card, tint: next, audit: "tint" } : card));
}

export function bulkSlateDone(cards: readonly Slate[], ids: readonly string[], done: boolean): Slate[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlates(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "undo" } : card));
}

export function resetSlates(): Slate[] {
  return [];
}

function inTray(card: Slate, tray: SlateTray): boolean {
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

function tempoScore(tempo: string): number {
  if (tempo === "run") return 3;
  if (tempo === "walk") return 2;
  if (tempo === "hush") return 1;
  return 0;
}

/** An open slate whose hour sits more than four steps behind the desk hour. A held or done slate is not late. */
export function lateSlate(card: Slate, desk: unknown): boolean {
  const gap = hourGap(card.hour, desk);
  return inTray(card, "open") && gap !== null && gap > 4;
}

/** An open slate with a 10 minute wait is the reminder. A held or done slate is not. */
export function soonSlate(card: Slate): boolean {
  return inTray(card, "open") && card.wait === 10;
}

/** Search matches the title, the note, and the owner. The hour and the tint are not part of the query. */
export function visibleSlates(
  cards: readonly Slate[],
  tray: SlateTray,
  query: string,
  owner: string | null,
  tint: SlateTint | null,
  mark: string | null,
  tempo: SlateTempo | null,
  exact: number | null,
  pick: HourPick | null,
  weight: number | "blank" | null,
  wait: number | "blank" | null,
  hushOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Slate[] {
  const text = query.trim().toLowerCase();
  const wantOwner = owner === null ? null : ownerLabel(owner);
  const wantMark = mark === null ? null : slateMark(mark);
  return readSlates(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantOwner !== null && card.owner !== wantOwner) return false;
      if (tint !== null && tintOf(card.tint) !== tint) return false;
      if (wantMark !== null && card.mark !== wantMark) return false;
      if (tempo !== null && tempoOf(card.tempo) !== tempo) return false;
      if (!hourHit(card.hour, exact, pick)) return false;
      if (weight === "blank" && card.weight !== null) return false;
      if (typeof weight === "number" && card.weight !== weight) return false;
      if (wait === "blank" && card.wait !== null) return false;
      if (typeof wait === "number" && card.wait !== wait) return false;
      if (hushOnly && card.tempo !== "hush") return false;
      if (peakOnly && !peakHour(card.hour)) return false;
      if (homeOnly && !homeMark(card.mark)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.owner.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (tempoScore(a.tempo) !== tempoScore(b.tempo)) return tempoScore(b.tempo) - tempoScore(a.tempo);
      return a.title.localeCompare(b.title);
    });
}

export function slateTimeline(cards: readonly Slate[], query: string): Slate[] {
  const text = query.trim().toLowerCase();
  return readSlates(cards)
    .filter((card) => card.hour !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.owner.toLowerCase().includes(text))
    .sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title));
}

export function slateCounts(cards: readonly Slate[], desk: unknown): SlateCounts {
  const rows = readSlates(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakHour(card.hour) && inTray(card, "open")).length,
    late: rows.filter((card) => lateSlate(card, desk)).length,
    soon: rows.filter((card) => soonSlate(card)).length,
    home: rows.filter((card) => homeMark(card.mark)).length,
  };
}

export function slateShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function slateOwners(cards: readonly Slate[]): string[] {
  const seen = new Set<string>();
  for (const card of readSlates(cards)) if (card.owner) seen.add(card.owner);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function slateMarks(cards: readonly Slate[]): string[] {
  const seen = new Set<string>();
  for (const card of readSlates(cards)) if (card.mark) seen.add(card.mark);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function slateTempos(cards: readonly Slate[]): Exclude<SlateTempo, "blank">[] {
  const seen = new Set<string>();
  for (const card of readSlates(cards)) if (card.tempo) seen.add(card.tempo);
  return TEMPOS.filter((tempo) => seen.has(tempo));
}

export function tintCounts(cards: readonly Slate[]): { tint: Exclude<SlateTint, "blank">; count: number }[] {
  const rows = readSlates(cards);
  return TINTS.map((tint) => ({ tint, count: rows.filter((card) => card.tint === tint).length })).filter((row) => row.count > 0);
}

export function usedHours(cards: readonly Slate[]): number {
  return new Set(readSlates(cards).map((card) => card.hour).filter((hour): hour is number => hour !== null)).size;
}

export function clashHourIds(cards: readonly Slate[]): string[] {
  const open = readSlates(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.tint);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tint === card.tint && other.hour === card.hour)).map((card) => card.id);
}

export function clashHourCount(cards: readonly Slate[]): number {
  return clashHourIds(cards).length;
}

export function weightClashIds(cards: readonly Slate[]): string[] {
  const open = readSlates(cards).filter((card) => inTray(card, "open") && card.weight !== null && card.tint);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.tint === card.tint && other.weight === card.weight)).map((card) => card.id);
}

export function weightClashCount(cards: readonly Slate[]): number {
  return weightClashIds(cards).length;
}

/** The next open slate at or after the desk hour. Run tempos wait. A blank desk hour stays blank. */
export function nextSlate(cards: readonly Slate[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readSlates(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.tempo !== "run");
  if (!waiting.length) return "";
  const byHour = (a: Slate, b: Slate) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The tint with the fewest open slates.
 * A tie keeps mist, then gilt, then pearl, then soot.
 * Slates with no tint are not a load. An empty desk still suggests mist.
 */
export function suggestTint(cards: readonly Slate[]): Exclude<SlateTint, "blank"> {
  const rows = readSlates(cards).filter((card) => inTray(card, "open"));
  const order = ["mist", "gilt", "pearl", "soot"] as const;
  let best: Exclude<SlateTint, "blank"> = "mist";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const tint of order) {
    const count = rows.filter((card) => card.tint === tint).length;
    if (count < bestCount) {
      best = tint;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The owner carrying the fewest open slates.
 * A tie keeps the earlier name. A blank owner is not a load.
 * An empty desk stays blank.
 */
export function suggestOwner(cards: readonly Slate[]): string {
  const rows = readSlates(cards).filter((card) => inTray(card, "open") && card.owner);
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
 * The wait with the fewest open slates.
 * A tie keeps 30, then 10, then 60.
 * An empty desk still suggests 30.
 */
export function suggestWait(cards: readonly Slate[]): (typeof WAITS)[number] {
  const rows = readSlates(cards).filter((card) => inTray(card, "open"));
  const order = [30, 10, 60] as const;
  let best: (typeof WAITS)[number] = 30;
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
 * The roster name with the fewest open slates.
 * A blank roster falls back to the least-loaded owner already on the desk.
 * A tie keeps the earlier name.
 */
export function fairOwner(cards: readonly Slate[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = ownerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestOwner(cards);
  const open = readSlates(cards).filter((card) => inTray(card, "open"));
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

/** The CSV is the slates saved in this browser. The gap and the late mark use the hour you pass. */
export function slatesCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,owner,hour,tint,mark,tempo,weight,wait,band,pinned,held,done,gap,late,soon,home,note,audit"];
  for (const card of readSlates(raw)) {
    const gap = hourGap(card.hour, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.owner),
      card.hour === null ? "" : String(card.hour),
      card.tint,
      csvCell(card.mark),
      card.tempo,
      card.weight === null ? "" : String(card.weight),
      card.wait === null ? "" : String(card.wait),
      hourBand(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlate(card, desk) ? "1" : "0",
      soonSlate(card) ? "1" : "0",
      homeMark(card.mark) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function slateCopy(card: Slate): string {
  return [card.title, card.owner, card.hour ?? "", card.tint, card.mark, card.tempo, card.weight ?? "", card.wait ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function ownerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ownerLabel(raw) || "all";
}

function tintSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tintName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return slateMark(raw) || "all";
}

function tempoSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempoName(raw) || "all";
}

/** "all" and an hour pick stay. An hour from 0 through 23 stays. Anything else is all. */
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

/** All, blank, and the weights 2, 4, and 8 stay. Anything else is all. */
export function activeWeight(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const weight = weightOf(filter);
  return weight === null ? "all" : String(weight);
}

export function weightArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return weightOf(filter);
}

/** All, blank, and the waits 10, 30, and 60 stay. Anything else is all. */
export function activeWait(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const wait = waitMinutes(filter);
  return wait === null ? "all" : String(wait);
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return waitMinutes(filter);
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

export function activeTint(filter: string, tints: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tint = tintName(filter);
  return tint && tints.includes(tint) ? tint : "all";
}

export function tintArg(filter: string): SlateTint | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return tintName(filter) || null;
}

export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = slateMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return slateMark(filter) || null;
}

export function activeTempo(filter: string, tempos: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tempo = tempoName(filter);
  return tempo && tempos.includes(tempo) ? tempo : "all";
}

export function tempoArg(filter: string): SlateTempo | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

export function readSlateViews(raw: unknown): SlateView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlateView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SlateView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      owner: ownerSlot(row.owner),
      tint: tintSlot(row.tint),
      mark: markSlot(row.mark),
      tempo: tempoSlot(row.tempo),
      hour: activeHour(String(row.hour || "all")),
      weight: activeWeight(String(row.weight || "all")),
      wait: activeWait(String(row.wait || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlateView(views: readonly SlateView[], view: SlateView): SlateView[] {
  const current = readSlateViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    owner: ownerSlot(view.owner),
    tint: tintSlot(view.tint),
    mark: markSlot(view.mark),
    tempo: tempoSlot(view.tempo),
    hour: activeHour(view.hour),
    weight: activeWeight(view.weight),
    wait: activeWait(view.wait),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropSlateView(views: readonly SlateView[], id: string): SlateView[] {
  return readSlateViews(views).filter((view) => view.id !== id);
}

/**
 * An assignee token is 8 to 32 letters or digits.
 * A blank value stays unset. A shorter token is not an assignee.
 * A hyphen is not part of a token.
 */
export function ownerToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  return /^[A-Za-z0-9]{8,32}$/.test(text) ? text : null;
}

function ownerBody(value: OwnerValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = ownerToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (OWNER_BLOCK.some((key) => key in value)) return null;
  if (!("assigneeId" in value)) return { text: null, explicit: false };
  const inner = value.assigneeId;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = ownerToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set plate is an assignee token. A clear plate is an explicit blank.
 * A missing field stays unmarked. A blocked field is not this plate.
 */
export function ownerState(value: OwnerValue): OwnerState {
  const body = ownerBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The assignee token, or a blank string when the plate is clear or unmarked. */
export function ownerCopy(value: OwnerValue): string {
  return ownerBody(value)?.text || "";
}

/**
 * Stub is 8–12. Slip is 13–18. Plate is 19–24. Wide is 25–32.
 * A blank assignee has no band.
 */
export function ownerBand(value: OwnerValue): OwnerBand {
  const text = ownerBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n <= 12) return "stub";
  if (n <= 18) return "slip";
  if (n <= 24) return "plate";
  return "wide";
}

/** Even or odd length. A blank assignee has no parity. */
export function ownerParity(value: OwnerValue): OwnerParity {
  const text = ownerBody(value)?.text;
  if (!text) return "";
  return text.length % 2 === 0 ? "even" : "odd";
}

/** Lengths 8, 16, 24, and 32 are the house catalog. A clear plate is not catalog. */
export function catalogOwner(value: OwnerValue): boolean {
  const text = ownerBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text.length);
}

/** A token of 25 or more. A clear plate is not wide. */
export function wideOwner(value: OwnerValue): boolean {
  return ownerBand(value) === "wide";
}

/** An even length. A clear plate is not even. */
export function evenOwner(value: OwnerValue): boolean {
  return ownerParity(value) === "even";
}

export function catalogOwnerCount(rows: readonly OwnerRow[]): number {
  return rows.filter((row) => ownerState(row.note) === "set" && catalogOwner(row.note)).length;
}

export function wideOwnerCount(rows: readonly OwnerRow[]): number {
  return rows.filter((row) => ownerState(row.note) === "set" && wideOwner(row.note)).length;
}

export function evenOwnerCount(rows: readonly OwnerRow[]): number {
  return rows.filter((row) => ownerState(row.note) === "set" && evenOwner(row.note)).length;
}

/** How many distinct assignee tokens are shared by two or more customers. */
export function sharedOwnerCount(rows: readonly OwnerRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (ownerState(row.note) !== "set") continue;
    const text = ownerCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function ownerBands(rows: readonly OwnerRow[]): OwnerBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = ownerState(row.note);
    if (state === "") continue;
    const band = state === "set" ? ownerBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: OwnerBandLine[] = [];
  for (const band of ["", ...OWNER_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function ownerParities(rows: readonly OwnerRow[]): OwnerParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = ownerParity(row.note);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: OwnerParityLine[] = [];
  for (const parity of ["", ...PARITIES]) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps stub, then slip, plate, and wide. An unmarked field is not a lead. */
export function leadingOwner(rows: readonly OwnerRow[]): string {
  const named = ownerBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => OWNER_BANDS.indexOf(band as (typeof OWNER_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The parity with the most loaded rows. A tie keeps even, then odd. A blank assignee is not a lead. */
export function leadingOwnerParity(rows: readonly OwnerRow[]): string {
  const named = ownerParities(rows).filter((line) => line.parity);
  if (!named.length) return "";
  const order = (parity: string) => PARITIES.indexOf(parity as (typeof PARITIES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.parity) - order(b.parity))[0].parity;
}

export function ownerShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((OWNER_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentOwners(rows: readonly OwnerRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = ownerState(row.note);
    const token = state === "set" ? ownerBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenOwners(raw: unknown, present: readonly string[]): string[] {
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

export function toggleOwner(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenOwners(hidden, present);
  const current = readHiddenOwners(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleOwnerBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenOwners(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function ownerBandArg(filter: string): OwnerBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as OwnerBand) : null;
}

export function activeOwnerBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

function parityOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (PARITIES as readonly string[]).includes(text) ? text : "";
}

export function ownerParityArg(filter: string): OwnerParity | null {
  if (filter === "all") return null;
  const parity = parityOwner(filter);
  return parity ? (parity as OwnerParity) : null;
}

export function activeOwnerParity(filter: string): string {
  if (filter === "all") return "all";
  return parityOwner(filter) || "all";
}

function rowId(row: OwnerRow): string {
  return String(row.id || "").trim();
}

export function readReviewedOwners(raw: unknown, present: readonly string[]): string[] {
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

export function toggleOwnerReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedOwners(reviewed, present);
  const current = readReviewedOwners(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkOwnerReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedOwners(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the parity, and the assignee are not part of the query. */
export function visibleOwnerCustomers<T extends OwnerRow>(
  rows: readonly T[],
  band: OwnerBand | "blank" | null,
  parity: OwnerParity | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: OwnerShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = ownerState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && ownerBand(row.note) !== band) return false;
    if (parity !== null && ownerParity(row.note) !== parity) return false;
    if (shape === "catalog" && !catalogOwner(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideOwner(row.note))) return false;
    if (shape === "even" && !evenOwner(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and parities on this page. */
export function ownersCsv(rows: readonly OwnerRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = ownerState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of ownerBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of ownerParities(rows)) lines.push(["parity", csvCell(line.parity), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogOwnerCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideOwnerCount(rows))].join(","));
  lines.push(["shape", "even", String(evenOwnerCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedOwnerCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function ownerRowsCsv(rows: readonly OwnerRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,parity,owner,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(ownerBand(row.note)),
      csvCell(ownerParity(row.note)),
      csvCell(ownerCopy(row.note)),
      catalogOwner(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
