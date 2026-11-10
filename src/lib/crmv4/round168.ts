/**
 * Local oriel sitting hours, and the test-account flag already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_oriel_hour (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   hour integer,
 *   bay text not null default '',
 *   mark text not null default '',
 *   tempo text not null default '',
 *   span integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_trial_hide (
 *   trial text primary key
 * );
 */

export const ORIEL_KEY = "crmv4-oriel-hours";
export const ORIEL_VIEW_KEY = "crmv4-oriel-views";
export const TRIAL_KEY = "crmv4-trial-hide";

export type OrielTempo = "blank" | "hush" | "even" | "brisk";

export type OrielBay = "blank" | "garden" | "gallery" | "library" | "terrace";

export type OrielTray = "open" | "held" | "done";

export type HourPick = "blank" | "dawn" | "noon" | "eve" | "quiet" | "day";

export type OrielCard = {
  id: string;
  title: string;
  note: string;
  host: string;
  hour: number | null;
  bay: string;
  mark: string;
  tempo: string;
  span: number | null;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type OrielView = {
  id: string;
  name: string;
  tray: OrielTray;
  query: string;
  host: string;
  bay: string;
  mark: string;
  tempo: string;
  hour: string;
  span: string;
};

export type OrielCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  quiet: number;
};

export type TrialMark = "" | "trial" | "live";

export type CaseMark = "" | "upper" | "lower" | "mixed";

export type WidthMark = "" | "code" | "name";

export type TrialValue =
  | {
      isTest?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      ftd?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      desk?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type TrialRow = { trial?: TrialValue; country?: unknown; label?: string | null };

export type TrialLine = { trial: string; count: number };

export type CaseLine = { tone: string; count: number };

export type WidthLine = { width: string; count: number };

const AUDITS = ["save", "edit", "tempo", "pin", "unpin", "hold", "release", "done", "reopen", "bay"] as const;

const BAYS = ["garden", "gallery", "library", "terrace"] as const;

const TEMPOS = ["hush", "even", "brisk"] as const;

const TEMPO_ORDER = ["", "hush", "even", "brisk"] as const;

const PICKS = ["blank", "dawn", "noon", "eve", "quiet", "day"] as const;

const BANDS = ["dawn", "noon", "eve"] as const;

const QUIET = new Set([0, 1, 2, 3, 4, 5, 22, 23]);

const TRIALS = ["trial", "live"] as const;

const CASES = ["upper", "lower", "mixed"] as const;

const WIDTHS = ["code", "name"] as const;

const TRIAL_BLOCK = [
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "ftd",
  "name",
  "email",
  "phone",
  "country",
  "desk",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "validationStatus",
  "registrationDate",
  "birthDate",
  "lastContactAt",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): OrielTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bayName(raw: unknown): Exclude<OrielBay, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (BAYS as readonly string[]).includes(text) ? (text as Exclude<OrielBay, "blank">) : "";
}

function tempoName(raw: unknown): Exclude<OrielTempo, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<OrielTempo, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function orielLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function orielNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank mark stays blank. It is not filled in. */
export function orielMark(raw: unknown): string {
  return clip(raw, 3);
}

/**
 * An hour is an integer from 0 through 23.
 * A blank value stays unset. 24 is not an hour.
 * A leading zero is the same hour: 08 is 8, and 00 is 0.
 */
export function hourOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|0[0-9]|1[0-9]|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A span is a quarter count from 1 through 4.
 * A blank value stays unset. 0 and 5 are not spans.
 * A leading zero is the same span: 01 is 1.
 */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 4) return raw;
  if (typeof raw === "string" && /^(?:[1-4]|0[1-4])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Garden, gallery, library, terrace, or blank. Anything else is blank. */
export function bayOf(raw: unknown): OrielBay {
  return bayName(raw) || "blank";
}

/** Hush, even, brisk, or blank. Anything else is blank. */
export function tempoOf(raw: unknown): OrielTempo {
  return tempoName(raw) || "blank";
}

/** Dawn is 0–7. Noon is 8–15. Eve is 16–23. An unset hour is blank. */
export function watchOf(hour: unknown): "blank" | "dawn" | "noon" | "eve" {
  const value = hourOf(hour);
  if (value === null) return "blank";
  if (value <= 7) return "dawn";
  if (value <= 15) return "noon";
  return "eve";
}

/** Quiet hours are 0 through 5 and 22 through 23. An unset hour is not quiet. */
export function quietHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && QUIET.has(value);
}

/** Day hours are 6 through 21. An unset hour is not day. */
export function dayHour(hour: unknown): boolean {
  const value = hourOf(hour);
  return value !== null && !QUIET.has(value);
}

/**
 * The shortest signed step from the sitting hour to the typed hour.
 * The clock wraps. A step of 12 stays positive. A step of -12 becomes 12.
 * A positive step means the typed hour is ahead of the sitting.
 */
export function orielGap(hour: unknown, desk: unknown): number | null {
  const from = hourOf(hour);
  const at = hourOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 12) diff -= 24;
  if (diff < -11) diff += 24;
  return diff;
}

export function readOriels(raw: unknown): OrielCard[] {
  if (!Array.isArray(raw)) return [];
  const out: OrielCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrielCard>;
    const id = String(row.id || "").trim();
    const title = orielLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: orielNote(row.note),
      host: hostLabel(row.host),
      hour: hourOf(row.hour),
      bay: bayName(row.bay),
      mark: orielMark(row.mark),
      tempo: tempoName(row.tempo),
      span: spanOf(row.span),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addOriel(
  cards: readonly OrielCard[],
  card: { id: string; title: string; note?: string; host?: string; hour?: unknown; bay?: string; mark?: string; tempo?: string; span?: unknown },
): OrielCard[] {
  const current = readOriels(cards);
  const id = String(card.id || "").trim();
  const title = orielLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: OrielCard = {
    id,
    title,
    note: orielNote(card.note),
    host: hostLabel(card.host),
    hour: hourOf(card.hour),
    bay: bayName(card.bay),
    mark: orielMark(card.mark),
    tempo: tempoName(card.tempo),
    span: spanOf(card.span),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

/** Blank becomes hush. Hush becomes even, even becomes brisk, and brisk returns to hush. */
export function cycleOrielTempo(cards: readonly OrielCard[], id: string): OrielCard[] {
  return readOriels(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TEMPO_ORDER.indexOf(card.tempo as (typeof TEMPO_ORDER)[number]);
    const next = at < 0 || at >= TEMPOS.length ? TEMPOS[0] : TEMPOS[at % TEMPOS.length];
    if (!next || next === card.tempo) return card;
    return { ...card, tempo: next, audit: "tempo" };
  });
}

export function setOrielPin(cards: readonly OrielCard[], id: string, pinned: boolean): OrielCard[] {
  return readOriels(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setOrielHeld(cards: readonly OrielCard[], id: string, held: boolean): OrielCard[] {
  return readOriels(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setOrielDone(cards: readonly OrielCard[], id: string, done: boolean): OrielCard[] {
  return readOriels(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editOriel(cards: readonly OrielCard[], id: string, title: string): OrielCard[] {
  const current = readOriels(cards);
  const next = orielLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editOrielNote(cards: readonly OrielCard[], id: string, note: string): OrielCard[] {
  const current = readOriels(cards);
  const next = orielNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkOrielPin(cards: readonly OrielCard[], ids: readonly string[], pinned: boolean): OrielCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readOriels(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkOrielDone(cards: readonly OrielCard[], ids: readonly string[], done: boolean): OrielCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readOriels(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank or unknown bay is left out. A sitting already in that bay is left as it is. */
export function bulkOrielBay(cards: readonly OrielCard[], ids: readonly string[], bay: string): OrielCard[] {
  const name = bayName(bay);
  const current = readOriels(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.bay !== name ? { ...card, bay: name, audit: "bay" } : card));
}

export function resetOriels(): OrielCard[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function orielCopy(raw: unknown): string {
  return orielLine(raw);
}

function inTray(card: OrielCard, tray: OrielTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function hourHit(hour: number | null, exact: number | null, pick: HourPick | null): boolean {
  if (exact !== null) return hour === exact;
  if (pick === null) return true;
  if (pick === "blank") return hour === null;
  if (pick === "quiet") return quietHour(hour);
  if (pick === "day") return dayHour(hour);
  return watchOf(hour) === pick;
}

function tempoScore(tempo: string): number {
  if (tempo === "brisk") return 3;
  if (tempo === "even") return 2;
  if (tempo === "hush") return 1;
  return 0;
}

function waitingQuiet(card: OrielCard): boolean {
  return quietHour(card.hour) && inTray(card, "open");
}

function haystack(card: OrielCard): string {
  return `${card.title}\n${card.note}`.toLowerCase();
}

/** Search matches the title and the note. The host, the hour, the bay, and the tempo are not part of the query. */
export function visibleOriels(
  cards: readonly OrielCard[],
  tray: OrielTray,
  query: string,
  host: string | null,
  bay: OrielBay | null,
  mark: string | null,
  tempo: OrielTempo | null,
  exact: number | null,
  pick: HourPick | null,
  span: number | "blank" | null,
  briskOnly: boolean,
  quietOnly: boolean,
): OrielCard[] {
  const text = query.trim().toLowerCase();
  const wantHost = host === null ? null : hostLabel(host);
  const wantMark = mark === null ? null : orielMark(mark);
  return readOriels(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (briskOnly && card.tempo !== "brisk") return false;
      if (wantHost !== null && hostLabel(card.host) !== wantHost) return false;
      if (bay !== null && bayOf(card.bay) !== bay) return false;
      if (wantMark !== null && orielMark(card.mark) !== wantMark) return false;
      if (tempo !== null && tempoOf(card.tempo) !== tempo) return false;
      if (!hourHit(card.hour, exact, pick)) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (quietOnly && !waitingQuiet(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (tempoScore(a.tempo) !== tempoScore(b.tempo)) return tempoScore(b.tempo) - tempoScore(a.tempo);
      return a.title.localeCompare(b.title);
    });
}

/** The hour orders the day. An unset hour stays at the end. Search matches the title and the note. */
export function orielTimeline(cards: readonly OrielCard[], query: string): OrielCard[] {
  const text = query.trim().toLowerCase();
  return readOriels(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.hour === null && b.hour !== null) return 1;
      if (a.hour !== null && b.hour === null) return -1;
      if (a.hour !== null && b.hour !== null && a.hour !== b.hour) return a.hour - b.hour;
      return a.title.localeCompare(b.title);
    });
}

export function orielCounts(cards: readonly OrielCard[]): OrielCounts {
  const rows = readOriels(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    quiet: rows.filter((card) => waitingQuiet(card)).length,
  };
}

/** Share of the saved sittings. A zero total stays at zero. */
export function orielShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function orielHosts(cards: readonly OrielCard[]): string[] {
  const out: string[] = [];
  for (const card of readOriels(cards)) {
    if (card.host && !out.includes(card.host)) out.push(card.host);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function orielMarks(cards: readonly OrielCard[]): string[] {
  const out: string[] = [];
  for (const card of readOriels(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function orielBays(cards: readonly OrielCard[]): Exclude<OrielBay, "blank">[] {
  const seen = new Set<string>();
  for (const card of readOriels(cards)) if (card.bay) seen.add(card.bay);
  return BAYS.filter((bay) => seen.has(bay));
}

export function orielTempos(cards: readonly OrielCard[]): Exclude<OrielTempo, "blank">[] {
  const seen = new Set<string>();
  for (const card of readOriels(cards)) if (card.tempo) seen.add(card.tempo);
  return TEMPOS.filter((tempo) => seen.has(tempo));
}

/** How many open sittings a host still holds. A blank host is not a load. */
export function hostLoad(cards: readonly OrielCard[], host: string): number {
  const name = hostLabel(host);
  if (!name) return 0;
  return readOriels(cards).filter((card) => card.host === name && inTray(card, "open")).length;
}

/** Three watches. Index 0 is dawn. Index 2 is eve. */
export function watchCounts(cards: readonly OrielCard[]): number[] {
  const rows = readOriels(cards);
  return BANDS.map((band) => rows.filter((card) => watchOf(card.hour) === band).length);
}

/** "all" and "blank" stay. A host that is no longer on a sitting falls back to all. */
export function activeHost(filter: string, hosts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const host = hostLabel(filter);
  return host && hosts.includes(host) ? host : "all";
}

export function hostArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return hostLabel(filter);
}

/** "all" and "blank" stay. A bay that is no longer on a sitting falls back to all. */
export function activeBay(filter: string, bays: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bay = bayName(filter);
  return bay && bays.includes(bay) ? bay : "all";
}

export function bayArg(filter: string): OrielBay | null {
  if (filter === "blank") return "blank";
  return bayName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a sitting falls back to all. */
export function activeOrielMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = orielMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function orielMarkArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return orielMark(filter);
}

/** "all" and "blank" stay. A tempo that is no longer on a sitting falls back to all. */
export function activeTempo(filter: string, tempos: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tempo = tempoName(filter);
  return tempo && tempos.includes(tempo) ? tempo : "all";
}

export function tempoArg(filter: string): OrielTempo | null {
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

/** All, blank, the watches, quiet, day, and the hours 0 through 23 stay. Anything else is all. */
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

/** All, blank, and the spans 1 through 4 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** Other sittings with the same bay and the same hour. A blank bay or a blank hour clashes with nothing. */
export function orielClashIds(cards: readonly OrielCard[], id: string): string[] {
  const rows = readOriels(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.bay || card.hour === null) return [];
  return rows
    .filter((item) => item.id !== id && item.bay === card.bay && item.hour === card.hour)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved sittings share a bay and an hour with another sitting. */
export function clashOrielCount(cards: readonly OrielCard[]): number {
  const rows = readOriels(cards);
  return rows.filter((card) => orielClashIds(rows, card.id).length > 0).length;
}

/** Other sittings with the same bay and the same span. A blank bay or a blank span clashes with nothing. */
export function spanClashIds(cards: readonly OrielCard[], id: string): string[] {
  const rows = readOriels(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.bay || card.span === null) return [];
  return rows
    .filter((item) => item.id !== id && item.bay === card.bay && item.span === card.span)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved sittings share a bay and a span with another sitting. */
export function spanClashCount(cards: readonly OrielCard[]): number {
  const rows = readOriels(cards);
  return rows.filter((card) => spanClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open sitting at or after the hour you type, skipping brisk tempo.
 * After 23, the day wraps to the earliest open sitting that is not brisk.
 */
export function nextOriel(cards: readonly OrielCard[], desk: unknown): string {
  const now = hourOf(desk);
  if (now === null) return "";
  const waiting = readOriels(cards).filter((card) => inTray(card, "open") && card.hour !== null && card.tempo !== "brisk");
  if (!waiting.length) return "";
  const byHour = (a: OrielCard, b: OrielCard) => (a.hour ?? 0) - (b.hour ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.hour ?? 0) >= now).sort(byHour);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byHour)[0].id;
}

/**
 * The bay with the fewest open sittings.
 * A tie keeps the earlier bay: garden, then gallery, library, and terrace.
 * Sittings with no bay are not a load. An empty desk still suggests garden.
 */
export function suggestBay(cards: readonly OrielCard[]): Exclude<OrielBay, "blank"> {
  const rows = readOriels(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<OrielBay, "blank"> = "garden";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const bay of BAYS) {
    const count = rows.filter((card) => card.bay === bay).length;
    if (count < bestCount) {
      best = bay;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the sittings saved in this browser. The gap uses the hour you pass. */
export function orielsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,hour,bay,mark,tempo,span,watch,pinned,held,done,gap,note,audit"];
  for (const card of readOriels(raw)) {
    const gap = orielGap(card.hour, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.host),
      card.hour === null ? "" : String(card.hour),
      card.bay,
      csvCell(card.mark),
      card.tempo,
      card.span === null ? "" : String(card.span),
      watchOf(card.hour),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function hostSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hostLabel(raw) || "all";
}

function baySlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bayName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return orielMark(raw) || "all";
}

function tempoSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempoName(raw) || "all";
}

function spanSlot(raw: unknown): string {
  return activeSpan(String(raw ?? ""));
}

export function readOrielViews(raw: unknown): OrielView[] {
  if (!Array.isArray(raw)) return [];
  const out: OrielView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<OrielView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      host: hostSlot(row.host),
      bay: baySlot(row.bay),
      mark: markSlot(row.mark),
      tempo: tempoSlot(row.tempo),
      hour: activeHour(String(row.hour ?? "")),
      span: spanSlot(row.span),
    });
  }
  return out.slice(0, 6);
}

export function addOrielView(
  views: readonly OrielView[],
  view: { id: string; name: string; tray: OrielTray; query: string; host: string; bay: string; mark: string; tempo: string; hour: string; span: string },
): OrielView[] {
  const current = readOrielViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    host: hostSlot(view.host),
    bay: baySlot(view.bay),
    mark: markSlot(view.mark),
    tempo: tempoSlot(view.tempo),
    hour: activeHour(view.hour),
    span: spanSlot(view.span),
  }].slice(0, 6);
}

export function dropOrielView(views: readonly OrielView[], id: string): OrielView[] {
  return readOrielViews(views).filter((view) => view.id !== id);
}

function trialRaw(value: TrialValue): TrialMark {
  if (value === true || value === 1) return "trial";
  if (value === false || value === 0) return "live";
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (text === "true" || text === "1" || text === "yes" || text === "trial") return "trial";
    if (text === "false" || text === "0" || text === "no" || text === "live") return "live";
    return "";
  }
  if (!value || typeof value !== "object") return "";
  if (TRIAL_BLOCK.some((key) => key in value)) return "";
  if (!("isTest" in value)) return "";
  return trialRaw(value.isTest as TrialValue);
}

/**
 * Trial, live, or unmarked.
 * A login flag, a trading flag, a country, a name, and the other blocked fields are not a trial lamp.
 * A missing flag stays unmarked and is not filled in.
 */
export function trialOf(value: TrialValue): TrialMark {
  return trialRaw(value);
}

function countryText(country: unknown): string {
  return clip(country, 40);
}

/**
 * Upper, lower, mixed, or unmarked.
 * The case follows the letters in the country. Digits and marks are ignored.
 * A country with no letters stays unmarked.
 */
export function caseOf(country: unknown): CaseMark {
  const letters = countryText(country).replace(/[^A-Za-z]/g, "");
  if (!letters) return "";
  if (letters === letters.toUpperCase()) return "upper";
  if (letters === letters.toLowerCase()) return "lower";
  return "mixed";
}

/**
 * Code is two letters. Name is three or more letters.
 * Spaces are ignored. A digit, a mark, one letter, or a blank country stays unmarked.
 */
export function widthOf(country: unknown): WidthMark {
  const compact = countryText(country).replace(/\s+/g, "");
  if (!compact || /[^A-Za-z]/.test(compact)) return "";
  if (compact.length === 2) return "code";
  if (compact.length >= 3) return "name";
  return "";
}

export function trialLines(rows: readonly TrialRow[]): TrialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const trial = trialOf(row.trial);
    map.set(trial, (map.get(trial) || 0) + 1);
  }
  const out: TrialLine[] = [];
  for (const trial of ["", ...TRIALS]) {
    const count = map.get(trial);
    if (count) out.push({ trial, count });
  }
  return out;
}

export function namedTrials(rows: readonly TrialRow[]): string[] {
  return trialLines(rows).map((line) => line.trial).filter(Boolean);
}

export function caseLines(rows: readonly TrialRow[]): CaseLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const tone = caseOf(row.country);
    map.set(tone, (map.get(tone) || 0) + 1);
  }
  const out: CaseLine[] = [];
  for (const tone of ["", ...CASES]) {
    const count = map.get(tone);
    if (count) out.push({ tone, count });
  }
  return out;
}

export function namedCases(rows: readonly TrialRow[]): string[] {
  return caseLines(rows).map((line) => line.tone).filter(Boolean);
}

export function widthLines(rows: readonly TrialRow[]): WidthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const width = widthOf(row.country);
    map.set(width, (map.get(width) || 0) + 1);
  }
  const out: WidthLine[] = [];
  for (const width of ["", ...WIDTHS]) {
    const count = map.get(width);
    if (count) out.push({ width, count });
  }
  return out;
}

export function namedWidths(rows: readonly TrialRow[]): string[] {
  return widthLines(rows).map((line) => line.width).filter(Boolean);
}

/** The named lamp with the most loaded rows. A tie keeps trial before live. An unmarked flag is not a lead. */
export function leadingTrial(rows: readonly TrialRow[]): string {
  const named = trialLines(rows).filter((line) => line.trial);
  if (!named.length) return "";
  const order = (trial: string) => TRIALS.indexOf(trial as (typeof TRIALS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.trial) - order(b.trial))[0].trial;
}

/** The letter case with the most loaded rows. A tie keeps upper, then lower, then mixed. A blank country is not a lead. */
export function leadingCase(rows: readonly TrialRow[]): string {
  const named = caseLines(rows).filter((line) => line.tone);
  if (!named.length) return "";
  const order = (tone: string) => CASES.indexOf(tone as (typeof CASES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.tone) - order(b.tone))[0].tone;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function trlShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function trialToken(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "trial" || text === "live" || text === "blank") return text;
  return "";
}

export function presentTrials(rows: readonly TrialRow[]): string[] {
  const out: string[] = [];
  for (const line of trialLines(rows)) {
    const token = line.trial || "blank";
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenTrials(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const trial = trialToken(item);
    if (!trial || !known.has(trial) || out.includes(trial)) continue;
    out.push(trial);
  }
  return out;
}

export function toggleTrial(hidden: readonly string[], trial: string, present: readonly string[]): string[] {
  const token = trialToken(trial);
  if (!token || !present.includes(token)) return readHiddenTrials(hidden, present);
  const current = readHiddenTrials(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleTrials(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenTrials(hidden, present));
  return present.filter((trial) => (showHidden ? gone.has(trial) : !gone.has(trial)));
}

/** "all" and "blank" stay. A lamp that is no longer loaded falls back to all. */
export function activeTrial(filter: string, trials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (TRIALS as readonly string[]).includes(filter) && trials.includes(filter) ? filter : "all";
}

export function trialArg(filter: string): TrialMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (TRIALS as readonly string[]).includes(filter) ? (filter as TrialMark) : null;
}

/** "all" and "blank" stay. A case that is no longer loaded falls back to all. */
export function activeCase(filter: string, tones: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (CASES as readonly string[]).includes(filter) && tones.includes(filter) ? filter : "all";
}

export function caseArg(filter: string): CaseMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (CASES as readonly string[]).includes(filter) ? (filter as CaseMark) : null;
}

/** "all" and "blank" stay. A width that is no longer loaded falls back to all. */
export function activeWidth(filter: string, widths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (WIDTHS as readonly string[]).includes(filter) && widths.includes(filter) ? filter : "all";
}

export function widthArg(filter: string): WidthMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (WIDTHS as readonly string[]).includes(filter) ? (filter as WidthMark) : null;
}

/** Search stays on the name. The lamp, the letter case, and the country width are not part of the query. */
export function visibleTrialCustomers<T extends TrialRow>(
  rows: readonly T[],
  trial: TrialMark | null,
  tone: CaseMark | null,
  width: WidthMark | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (trial !== null && trialOf(row.trial) !== trial) return false;
    if (tone !== null && caseOf(row.country) !== tone) return false;
    if (width !== null && widthOf(row.country) !== width) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the lamps, letter cases, and country widths on this page. */
export function trialsCsv(rows: readonly TrialRow[]): string {
  const lines = ["kind,trial,count"];
  for (const line of trialLines(rows)) lines.push(["trial", csvCell(line.trial), String(line.count)].join(","));
  for (const line of caseLines(rows)) lines.push(["case", csvCell(line.tone), String(line.count)].join(","));
  for (const line of widthLines(rows)) lines.push(["width", csvCell(line.width), String(line.count)].join(","));
  return lines.join("\n");
}
