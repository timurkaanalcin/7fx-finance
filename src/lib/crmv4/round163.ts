/**
 * Local wax follow-up notes, and the follow-up time already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_wax_note (
 *   id text primary key,
 *   note text not null,
 *   keeper text not null default '',
 *   mark integer,
 *   hue text not null default '',
 *   tag text not null default '',
 *   pace text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_follow_day_hide (
 *   day text primary key
 * );
 */

export const WAX_KEY = "crmv4-wax-notes";
export const WAX_VIEW_KEY = "crmv4-wax-views";
export const LAMP_KEY = "crmv4-follow-hide";

export type WaxPace = "blank" | "still" | "steady" | "swift";

export type WaxHue = "blank" | "champagne" | "graphite" | "ivory" | "soot";

export type WaxTray = "open" | "held" | "filed";

export type WatchPick = "blank" | "night" | "day" | "eve" | "early" | "late";

export type WaxCard = {
  id: string;
  text: string;
  keeper: string;
  mark: number | null;
  hue: string;
  tag: string;
  pace: string;
  pinned: boolean;
  held: boolean;
  filed: boolean;
  audit: string;
};

export type WaxView = {
  id: string;
  name: string;
  tray: WaxTray;
  query: string;
  keeper: string;
  hue: string;
  tag: string;
  pace: string;
  mark: string;
};

export type WaxCounts = {
  open: number;
  held: number;
  filed: number;
  pinned: number;
  late: number;
};

export type FollowBand = "" | "morn" | "noon" | "eve";

export type FollowAge = "" | "near" | "week" | "over";

export type FollowWeek = "" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type LampValue =
  | {
      retentionFollowUpAt?: unknown;
      affiliateA?: unknown;
      affiliateB?: unknown;
      affiliateC?: unknown;
      campaign?: unknown;
      lastLoginAt?: unknown;
      lastSeenAt?: unknown;
      lastContactAt?: unknown;
      timezone?: unknown;
      language?: unknown;
      country?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      desk?: unknown;
      address?: unknown;
      city?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      lastCountryName?: unknown;
      createdAt?: unknown;
      username?: unknown;
      accountLoginId?: unknown;
      retentionNote?: unknown;
      assigneeName?: unknown;
      brokerName?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type LampRow = { retentionFollowUpAt?: LampValue; label?: string | null };

export type BandLine = { band: string; count: number };

export type AgeLine = { age: string; count: number };

export type WeekLine = { week: string; count: number };

export type DayLine = { day: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "hold", "release", "file", "unfile"] as const;

const HUES = ["champagne", "graphite", "ivory", "soot"] as const;

const PACES = ["still", "steady", "swift"] as const;

const PACE_ORDER = ["", "still", "steady", "swift"] as const;

const PICKS = ["blank", "night", "day", "eve", "early", "late"] as const;

const WATCHES = ["night", "day", "eve"] as const;

const BANDS = ["morn", "noon", "eve"] as const;

const AGES = ["", "near", "week", "over"] as const;

const WEEKS = ["", "sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const LAMP_BLOCK = ["affiliateA", "affiliateB", "affiliateC", "campaign", "lastLoginAt", "lastSeenAt", "lastContactAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt", "username", "accountLoginId", "retentionNote", "assigneeName", "brokerName"] as const;

const DAY_MS = 86_400_000;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): WaxTray {
  return raw === "held" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function hueName(raw: unknown): Exclude<WaxHue, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (HUES as readonly string[]).includes(text) ? (text as Exclude<WaxHue, "blank">) : "";
}

function paceName(raw: unknown): Exclude<WaxPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<WaxPace, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function waxText(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A blank tag stays blank. It is not filled in. */
export function waxTag(raw: unknown): string {
  return clip(raw, 8);
}

/**
 * A mark is 0 through 4.
 * A blank value stays unset. 5 is not a mark.
 * A leading zero is still a mark: 00 is 0, and 04 is 4.
 * 05 is not a mark.
 */
export function markOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 4) return raw;
  if (typeof raw === "string" && /^(?:0?[0-4])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Champagne, graphite, ivory, soot, or blank. Anything else is blank. */
export function hueOf(raw: unknown): WaxHue {
  return hueName(raw) || "blank";
}

/** Still, steady, swift, or blank. Anything else is blank. */
export function paceOf(raw: unknown): WaxPace {
  return paceName(raw) || "blank";
}

/** Night is 0. Day is 1–2. Eve is 3–4. An unset mark is blank. */
export function watchOf(mark: unknown): "blank" | "night" | "day" | "eve" {
  const count = markOf(mark);
  if (count === null) return "blank";
  if (count <= 0) return "night";
  if (count <= 2) return "day";
  return "eve";
}

/** Early is 0–1. Late is 2–4. An unset mark is blank. */
export function halfOf(mark: unknown): "blank" | "early" | "late" {
  const count = markOf(mark);
  if (count === null) return "blank";
  return count <= 1 ? "early" : "late";
}

/** The typed mark minus the note mark. A positive gap is past the mark. */
export function waxGap(mark: unknown, desk: unknown): number | null {
  const from = markOf(mark);
  const at = markOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readWaxes(raw: unknown): WaxCard[] {
  if (!Array.isArray(raw)) return [];
  const out: WaxCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WaxCard>;
    const id = String(row.id || "").trim();
    const text = waxText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      keeper: keeperLabel(row.keeper),
      mark: markOf(row.mark),
      hue: hueName(row.hue),
      tag: waxTag(row.tag),
      pace: paceName(row.pace),
      pinned: row.pinned === true,
      held: row.held === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addWax(
  cards: readonly WaxCard[],
  card: { id: string; text: string; keeper?: string; mark?: unknown; hue?: string; tag?: string; pace?: string },
): WaxCard[] {
  const current = readWaxes(cards);
  const id = String(card.id || "").trim();
  const text = waxText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: WaxCard = {
    id,
    text,
    keeper: keeperLabel(card.keeper),
    mark: markOf(card.mark),
    hue: hueName(card.hue),
    tag: waxTag(card.tag),
    pace: paceName(card.pace),
    pinned: false,
    held: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

export function stepWaxPace(cards: readonly WaxCard[], id: string, dir: 1 | -1): WaxCard[] {
  return readWaxes(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = PACE_ORDER[Math.min(PACES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.pace) return card;
    return { ...card, pace: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setWaxPinned(cards: readonly WaxCard[], id: string, pinned: boolean): WaxCard[] {
  return readWaxes(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setWaxHeld(cards: readonly WaxCard[], id: string, held: boolean): WaxCard[] {
  return readWaxes(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setWaxFiled(cards: readonly WaxCard[], id: string, filed: boolean): WaxCard[] {
  return readWaxes(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "unfile" } : card));
}

/** A blank edit is left out. A duplicate of another note is left out. */
export function editWax(cards: readonly WaxCard[], id: string, text: string): WaxCard[] {
  const current = readWaxes(cards);
  const next = waxText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkWaxPinned(cards: readonly WaxCard[], ids: readonly string[], pinned: boolean): WaxCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readWaxes(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkWaxFiled(cards: readonly WaxCard[], ids: readonly string[], filed: boolean): WaxCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readWaxes(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "unfile" } : card));
}

export function resetWaxes(): WaxCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function waxCopy(raw: unknown): string {
  return waxText(raw);
}

function inTray(card: WaxCard, tray: WaxTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "held") return card.held && !card.filed;
  return !card.held && !card.filed;
}

function markHit(mark: number | null, exact: number | null, watch: WatchPick | null): boolean {
  if (exact !== null) return mark === exact;
  if (watch === null) return true;
  if (watch === "blank") return mark === null;
  if (watch === "early" || watch === "late") return halfOf(mark) === watch;
  return watchOf(mark) === watch;
}

function paceScore(pace: string): number {
  if (pace === "swift") return 3;
  if (pace === "steady") return 2;
  if (pace === "still") return 1;
  return 0;
}

function stillLate(card: WaxCard, desk: unknown): boolean {
  const gap = waxGap(card.mark, desk);
  return gap !== null && gap > 0 && card.pace === "still" && inTray(card, "open");
}

/** Search stays on the note. The keeper, the mark, the hue, the tag, and the pace are not part of the query. */
export function visibleWaxes(
  cards: readonly WaxCard[],
  tray: WaxTray,
  query: string,
  keeper: string | null,
  hue: WaxHue | null,
  tag: string | null,
  pace: WaxPace | null,
  exact: number | null,
  watch: WatchPick | null,
  swiftOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): WaxCard[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  const wantTag = tag === null ? null : waxTag(tag);
  return readWaxes(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (swiftOnly && card.pace !== "swift") return false;
      if (wantKeeper !== null && keeperLabel(card.keeper) !== wantKeeper) return false;
      if (hue !== null && hueOf(card.hue) !== hue) return false;
      if (wantTag !== null && waxTag(card.tag) !== wantTag) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!markHit(card.mark, exact, watch)) return false;
      if (lateOnly && !stillLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.text.localeCompare(b.text);
    });
}

/** The mark orders the desk. An unset mark stays at the end. Search stays on the note. */
export function waxTimeline(cards: readonly WaxCard[], query: string): WaxCard[] {
  const text = query.trim().toLowerCase();
  return readWaxes(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.mark === null && b.mark !== null) return 1;
      if (a.mark !== null && b.mark === null) return -1;
      if (a.mark !== null && b.mark !== null && a.mark !== b.mark) return a.mark - b.mark;
      return a.text.localeCompare(b.text);
    });
}

export function waxCounts(cards: readonly WaxCard[], desk: unknown): WaxCounts {
  const rows = readWaxes(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => stillLate(card, desk)).length,
  };
}

/** Share of the saved notes. A zero total stays at zero. */
export function waxShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function waxKeepers(cards: readonly WaxCard[]): string[] {
  const out: string[] = [];
  for (const card of readWaxes(cards)) {
    if (card.keeper && !out.includes(card.keeper)) out.push(card.keeper);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function waxTags(cards: readonly WaxCard[]): string[] {
  const out: string[] = [];
  for (const card of readWaxes(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function waxHues(cards: readonly WaxCard[]): Exclude<WaxHue, "blank">[] {
  const seen = new Set<string>();
  for (const card of readWaxes(cards)) if (card.hue) seen.add(card.hue);
  return HUES.filter((hue) => seen.has(hue));
}

export function waxPaces(cards: readonly WaxCard[]): Exclude<WaxPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readWaxes(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

/** How many open notes a keeper still holds. A blank keeper is not a load. */
export function keeperLoad(cards: readonly WaxCard[], keeper: string): number {
  const name = keeperLabel(keeper);
  if (!name) return 0;
  return readWaxes(cards).filter((card) => card.keeper === name && inTray(card, "open")).length;
}

/** Three watches. Index 0 is night. Index 2 is eve. */
export function watchCounts(cards: readonly WaxCard[]): number[] {
  const rows = readWaxes(cards);
  return WATCHES.map((watch) => rows.filter((card) => watchOf(card.mark) === watch).length);
}

/** "all" and "blank" stay. A keeper that is no longer on a note falls back to all. */
export function activeKeeper(filter: string, keepers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const keeper = keeperLabel(filter);
  return keeper && keepers.includes(keeper) ? keeper : "all";
}

export function keeperArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return keeperLabel(filter);
}

/** "all" and "blank" stay. A hue that is no longer on a note falls back to all. */
export function activeHue(filter: string, hues: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const hue = hueName(filter);
  return hue && hues.includes(hue) ? hue : "all";
}

export function hueArg(filter: string): WaxHue | null {
  if (filter === "blank") return "blank";
  return hueName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a note falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = waxTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return waxTag(filter);
}

/** "all" and "blank" stay. A pace that is no longer on a note falls back to all. */
export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): WaxPace | null {
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

/** All, blank, the three watches, the two halves, and the marks 0 through 4 stay. Anything else is all. */
export function activeMark(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const mark = markOf(filter);
  return mark === null ? "all" : String(mark);
}

export function markArg(filter: string): { exact: number | null; watch: WatchPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, watch: filter as WatchPick };
  const mark = markOf(filter);
  return mark === null ? { exact: null, watch: null } : { exact: mark, watch: null };
}

/** Other notes with the same hue and the same keeper. A blank hue or a blank keeper clashes with nothing. */
export function waxClashIds(cards: readonly WaxCard[], id: string): string[] {
  const rows = readWaxes(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.hue || !card.keeper) return [];
  return rows
    .filter((item) => item.id !== id && item.hue === card.hue && item.keeper === card.keeper)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved notes share a hue and a keeper with another note. */
export function clashWaxCount(cards: readonly WaxCard[]): number {
  const rows = readWaxes(cards);
  return rows.filter((card) => waxClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open note at or after the mark you type, skipping swift.
 * After the last mark, the desk wraps to the earliest open note that is not swift.
 */
export function nextWax(cards: readonly WaxCard[], desk: unknown): string {
  const now = markOf(desk);
  if (now === null) return "";
  const waiting = readWaxes(cards).filter((card) => inTray(card, "open") && card.mark !== null && card.pace !== "swift");
  if (!waiting.length) return "";
  const byMark = (a: WaxCard, b: WaxCard) => (a.mark ?? 0) - (b.mark ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.mark ?? 0) >= now).sort(byMark);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMark)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the notes saved in this browser. The gap uses the mark you pass. */
export function waxesCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,keeper,mark,hue,tag,pace,watch,pinned,held,filed,gap,audit"];
  for (const card of readWaxes(raw)) {
    const gap = waxGap(card.mark, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.keeper),
      card.mark === null ? "" : String(card.mark),
      card.hue,
      csvCell(card.tag),
      card.pace,
      watchOf(card.mark),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function keeperSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keeperLabel(raw) || "all";
}

function hueSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return hueName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return waxTag(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

export function readWaxViews(raw: unknown): WaxView[] {
  if (!Array.isArray(raw)) return [];
  const out: WaxView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<WaxView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: keeperSlot(row.keeper),
      hue: hueSlot(row.hue),
      tag: tagSlot(row.tag),
      pace: paceSlot(row.pace),
      mark: activeMark(String(row.mark ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addWaxView(
  views: readonly WaxView[],
  view: { id: string; name: string; tray: WaxTray; query: string; keeper: string; hue: string; tag: string; pace: string; mark: string },
): WaxView[] {
  const current = readWaxViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: keeperSlot(view.keeper),
    hue: hueSlot(view.hue),
    tag: tagSlot(view.tag),
    pace: paceSlot(view.pace),
    mark: activeMark(view.mark),
  }].slice(0, 5);
}

export function dropWaxView(views: readonly WaxView[], id: string): WaxView[] {
  return readWaxViews(views).filter((view) => view.id !== id);
}

function followRaw(value: LampValue): string {
  if (typeof value === "string") return clip(value, 40);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (LAMP_BLOCK.some((key) => key in value)) return "";
  return clip(value.retentionFollowUpAt, 40);
}

function followDate(value: LampValue): Date | null {
  const text = followRaw(value);
  if (!text) return null;
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

/** The follow-up stamp already on the row. A login, a name, a last contact, and the other blocked fields are not a follow-up. */
export function followStamp(value: LampValue): string {
  return followRaw(value);
}

/**
 * Days from the follow-up until the clock you pass.
 * A positive span is already past the follow-up. A missing stamp stays unset.
 */
export function followSpan(value: LampValue, now = Date.now()): number | null {
  const date = followDate(value);
  if (!date) return null;
  return Math.floor((now - date.getTime()) / DAY_MS);
}

/**
 * A band from the follow-up field, in UTC.
 * Morning is hours 0 through 7. Noon is 8 through 15. Evening is 16 through 23.
 * A missing or unreadable stamp stays unmarked and is not filled in.
 */
export function bandOf(value: LampValue): FollowBand {
  const date = followDate(value);
  if (!date) return "";
  const hour = date.getUTCHours();
  if (hour <= 7) return "morn";
  if (hour <= 15) return "noon";
  return "eve";
}

/**
 * Near is under 3 days, including a follow-up still ahead of now.
 * Week is 3 through 13 days. Over is 14 days or more.
 * A missing stamp stays unmarked. The age uses the clock you pass.
 */
export function ageOf(value: LampValue, now = Date.now()): FollowAge {
  const date = followDate(value);
  if (!date) return "";
  const days = Math.floor((now - date.getTime()) / DAY_MS);
  if (days < 3) return "near";
  if (days < 14) return "week";
  return "over";
}

/** The UTC weekday of the follow-up. An unmarked stamp stays blank. */
export function weekdayOf(value: LampValue): FollowWeek {
  const date = followDate(value);
  if (!date) return "";
  return WEEKS[date.getUTCDay() + 1] as FollowWeek;
}

/** The UTC calendar day, YYYY-MM-DD. An unmarked stamp stays blank. */
export function dayOf(value: LampValue): string {
  const date = followDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function bandLines(rows: readonly LampRow[]): BandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const band = bandOf(row.retentionFollowUpAt);
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: BandLine[] = [];
  for (const band of ["", ...BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function namedBands(rows: readonly LampRow[]): string[] {
  return bandLines(rows).map((line) => line.band).filter(Boolean);
}

export function ageLines(rows: readonly LampRow[], now = Date.now()): AgeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const age = ageOf(row.retentionFollowUpAt, now);
    map.set(age, (map.get(age) || 0) + 1);
  }
  const out: AgeLine[] = [];
  for (const age of AGES) {
    const count = map.get(age);
    if (count) out.push({ age, count });
  }
  return out;
}

export function namedAges(rows: readonly LampRow[], now = Date.now()): string[] {
  return ageLines(rows, now).map((line) => line.age).filter(Boolean);
}

export function weekdayLines(rows: readonly LampRow[]): WeekLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const week = weekdayOf(row.retentionFollowUpAt);
    map.set(week, (map.get(week) || 0) + 1);
  }
  const out: WeekLine[] = [];
  for (const week of WEEKS) {
    const count = map.get(week);
    if (count) out.push({ week, count });
  }
  return out;
}

export function namedWeekdays(rows: readonly LampRow[]): string[] {
  return weekdayLines(rows).map((line) => line.week).filter(Boolean);
}

export function dayLines(rows: readonly LampRow[]): DayLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const day = dayOf(row.retentionFollowUpAt);
    map.set(day, (map.get(day) || 0) + 1);
  }
  const out: DayLine[] = [];
  const names: string[] = [];
  map.forEach((_count, day) => {
    if (day) names.push(day);
  });
  names.sort((a, b) => a.localeCompare(b));
  if (map.get("")) out.push({ day: "", count: map.get("") || 0 });
  for (const day of names) out.push({ day, count: map.get(day) || 0 });
  return out;
}

export function namedDays(rows: readonly LampRow[]): string[] {
  return dayLines(rows).map((line) => line.day).filter(Boolean);
}

/** The named day with the most loaded rows. A tie keeps the earlier day. A blank day is not a lead. */
export function leadingDay(rows: readonly LampRow[]): string {
  const named = dayLines(rows).filter((line) => line.day);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.day.localeCompare(b.day))[0].day;
}

/** The band with the most loaded rows. A tie keeps the earlier band. An unmarked stamp is not a lead. */
export function leadingBand(rows: readonly LampRow[]): string {
  const named = bandLines(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => BANDS.indexOf(band as (typeof BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function lampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenDays(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = dayOf(clip(item, 40));
    if (!mark || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleDay(hidden: readonly string[], day: string, present: readonly string[]): string[] {
  const mark = dayOf(day);
  if (!mark || !present.includes(mark)) return readHiddenDays(hidden, present);
  const current = readHiddenDays(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleDays(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenDays(hidden, present));
  return present.filter((day) => (showHidden ? gone.has(day) : !gone.has(day)));
}

/** "all" and "blank" stay. A day that is no longer loaded falls back to all. */
export function activeDay(filter: string, days: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const day = dayOf(filter);
  return day && days.includes(day) ? day : "all";
}

export function dayArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const day = dayOf(filter);
  return day || null;
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeBand(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function bandArg(filter: string): FollowBand | null {
  if (filter === "blank") return "";
  if ((BANDS as readonly string[]).includes(filter)) return filter as FollowBand;
  return null;
}

/** "all" and "blank" stay. An age that is no longer loaded falls back to all. */
export function activeAge(filter: string, ages: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (AGES as readonly string[]).includes(filter) && ages.includes(filter) ? filter : "all";
}

export function ageArg(filter: string): FollowAge | null {
  if (filter === "blank") return "";
  if ((AGES as readonly string[]).includes(filter) && filter !== "") return filter as FollowAge;
  return null;
}

/** "all" and "blank" stay. A weekday that is no longer loaded falls back to all. */
export function activeWeekday(filter: string, weeks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (WEEKS as readonly string[]).includes(filter) && weeks.includes(filter) ? filter : "all";
}

export function weekdayArg(filter: string): FollowWeek | null {
  if (filter === "blank") return "";
  if ((WEEKS as readonly string[]).includes(filter) && filter !== "") return filter as FollowWeek;
  return null;
}

/** Search stays on the name. The follow-up stamp is not part of the query. */
export function visibleLampCustomers<T extends LampRow>(
  rows: readonly T[],
  band: FollowBand | null,
  age: FollowAge | null,
  week: FollowWeek | null,
  day: string | null,
  query: string,
  now = Date.now(),
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (band !== null && bandOf(row.retentionFollowUpAt) !== band) return false;
    if (age !== null && ageOf(row.retentionFollowUpAt, now) !== age) return false;
    if (week !== null && weekdayOf(row.retentionFollowUpAt) !== week) return false;
    if (day !== null && dayOf(row.retentionFollowUpAt) !== day) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the bands, ages, weekdays, and days on this page. */
export function lampsCsv(rows: readonly LampRow[], now = Date.now()): string {
  const lines = ["kind,mark,count"];
  for (const line of bandLines(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of ageLines(rows, now)) lines.push(["age", line.age, String(line.count)].join(","));
  for (const line of weekdayLines(rows)) lines.push(["week", line.week, String(line.count)].join(","));
  for (const line of dayLines(rows)) lines.push(["day", csvCell(line.day), String(line.count)].join(","));
  return lines.join("\n");
}
