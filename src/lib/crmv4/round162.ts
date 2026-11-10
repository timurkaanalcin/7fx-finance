/**
 * Local quill reminders for follow-up, and last-contact seals already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_quill_slip (
 *   id text primary key,
 *   note text not null,
 *   keeper text not null default '',
 *   bell integer,
 *   hue text not null default '',
 *   tag text not null default '',
 *   pace text not null default '',
 *   pinned boolean not null default false,
 *   kept boolean not null default false,
 *   sent boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_contact_day_hide (
 *   day text primary key
 * );
 */

export const QUILL_KEY = "crmv4-quill-slips";
export const QUILL_VIEW_KEY = "crmv4-quill-views";
export const SEAL_KEY = "crmv4-contact-hide";

export type QuillPace = "blank" | "slow" | "even" | "brisk";

export type QuillHue = "blank" | "amber" | "slate" | "ivory" | "ink";

export type QuillTray = "open" | "kept" | "sent";

export type WatchPick = "blank" | "night" | "day" | "eve" | "early" | "late";

export type QuillCard = {
  id: string;
  text: string;
  keeper: string;
  bell: number | null;
  hue: string;
  tag: string;
  pace: string;
  pinned: boolean;
  kept: boolean;
  sent: boolean;
  audit: string;
};

export type QuillView = {
  id: string;
  name: string;
  tray: QuillTray;
  query: string;
  keeper: string;
  hue: string;
  tag: string;
  pace: string;
  bell: string;
};

export type QuillCounts = {
  open: number;
  kept: number;
  sent: number;
  pinned: number;
  late: number;
};

export type ContactBand = "" | "dawn" | "day" | "dusk";

export type ContactAge = "" | "fresh" | "quiet" | "cold";

export type ContactWeek = "" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type SealValue =
  | {
      lastContactAt?: unknown;
      affiliateA?: unknown;
      affiliateB?: unknown;
      affiliateC?: unknown;
      campaign?: unknown;
      lastLoginAt?: unknown;
      lastSeenAt?: unknown;
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

export type SealRow = { lastContactAt?: SealValue; label?: string | null };

export type BandLine = { band: string; count: number };

export type AgeLine = { age: string; count: number };

export type WeekLine = { week: string; count: number };

export type DayLine = { day: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "keep", "release", "send", "recall"] as const;

const HUES = ["amber", "slate", "ivory", "ink"] as const;

const PACES = ["slow", "even", "brisk"] as const;

const PACE_ORDER = ["", "slow", "even", "brisk"] as const;

const PICKS = ["blank", "night", "day", "eve", "early", "late"] as const;

const WATCHES = ["night", "day", "eve"] as const;

const BANDS = ["dawn", "day", "dusk"] as const;

const AGES = ["", "fresh", "quiet", "cold"] as const;

const WEEKS = ["", "sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const SEAL_BLOCK = ["affiliateA", "affiliateB", "affiliateC", "campaign", "lastLoginAt", "lastSeenAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt", "username", "accountLoginId", "retentionNote", "assigneeName", "brokerName"] as const;

const DAY_MS = 86_400_000;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): QuillTray {
  return raw === "kept" || raw === "sent" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function hueName(raw: unknown): Exclude<QuillHue, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (HUES as readonly string[]).includes(text) ? (text as Exclude<QuillHue, "blank">) : "";
}

function paceName(raw: unknown): Exclude<QuillPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<QuillPace, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function quillText(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank keeper stays blank. It is not filled in. */
export function keeperLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank tag stays blank. It is not filled in. */
export function quillTag(raw: unknown): string {
  return clip(raw, 6);
}

/**
 * A bell is 0 through 5.
 * A blank value stays unset. 6 is not a bell.
 * A leading zero is still a bell: 00 is 0, and 05 is 5.
 * 06 is not a bell.
 */
export function bellOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 5) return raw;
  if (typeof raw === "string" && /^(?:0?[0-5])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Amber, slate, ivory, ink, or blank. Anything else is blank. */
export function hueOf(raw: unknown): QuillHue {
  return hueName(raw) || "blank";
}

/** Slow, even, brisk, or blank. Anything else is blank. */
export function paceOf(raw: unknown): QuillPace {
  return paceName(raw) || "blank";
}

/** Night is 0–1. Day is 2–3. Eve is 4–5. An unset bell is blank. */
export function watchOf(bell: unknown): "blank" | "night" | "day" | "eve" {
  const count = bellOf(bell);
  if (count === null) return "blank";
  if (count <= 1) return "night";
  if (count <= 3) return "day";
  return "eve";
}

/** Early is 0–2. Late is 3–5. An unset bell is blank. */
export function halfOf(bell: unknown): "blank" | "early" | "late" {
  const count = bellOf(bell);
  if (count === null) return "blank";
  return count <= 2 ? "early" : "late";
}

/** The typed bell minus the slip bell. A positive gap is past the bell. */
export function quillGap(bell: unknown, desk: unknown): number | null {
  const from = bellOf(bell);
  const at = bellOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readQuills(raw: unknown): QuillCard[] {
  if (!Array.isArray(raw)) return [];
  const out: QuillCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuillCard>;
    const id = String(row.id || "").trim();
    const text = quillText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      keeper: keeperLabel(row.keeper),
      bell: bellOf(row.bell),
      hue: hueName(row.hue),
      tag: quillTag(row.tag),
      pace: paceName(row.pace),
      pinned: row.pinned === true,
      kept: row.kept === true,
      sent: row.sent === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addQuill(
  cards: readonly QuillCard[],
  card: { id: string; text: string; keeper?: string; bell?: unknown; hue?: string; tag?: string; pace?: string },
): QuillCard[] {
  const current = readQuills(cards);
  const id = String(card.id || "").trim();
  const text = quillText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: QuillCard = {
    id,
    text,
    keeper: keeperLabel(card.keeper),
    bell: bellOf(card.bell),
    hue: hueName(card.hue),
    tag: quillTag(card.tag),
    pace: paceName(card.pace),
    pinned: false,
    kept: false,
    sent: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

export function stepQuillPace(cards: readonly QuillCard[], id: string, dir: 1 | -1): QuillCard[] {
  return readQuills(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = PACE_ORDER[Math.min(PACES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.pace) return card;
    return { ...card, pace: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setQuillPinned(cards: readonly QuillCard[], id: string, pinned: boolean): QuillCard[] {
  return readQuills(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setQuillKept(cards: readonly QuillCard[], id: string, kept: boolean): QuillCard[] {
  return readQuills(cards).map((card) => (card.id === id ? { ...card, kept, audit: kept ? "keep" : "release" } : card));
}

export function setQuillSent(cards: readonly QuillCard[], id: string, sent: boolean): QuillCard[] {
  return readQuills(cards).map((card) => (card.id === id ? { ...card, sent, audit: sent ? "send" : "recall" } : card));
}

/** A blank edit is left out. A duplicate of another reminder is left out. */
export function editQuill(cards: readonly QuillCard[], id: string, text: string): QuillCard[] {
  const current = readQuills(cards);
  const next = quillText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkQuillPinned(cards: readonly QuillCard[], ids: readonly string[], pinned: boolean): QuillCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readQuills(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkQuillSent(cards: readonly QuillCard[], ids: readonly string[], sent: boolean): QuillCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readQuills(cards).map((card) => (want.has(card.id) ? { ...card, sent, audit: sent ? "send" : "recall" } : card));
}

export function resetQuills(): QuillCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function quillCopy(raw: unknown): string {
  return quillText(raw);
}

function inTray(card: QuillCard, tray: QuillTray): boolean {
  if (tray === "sent") return card.sent;
  if (tray === "kept") return card.kept && !card.sent;
  return !card.kept && !card.sent;
}

function bellHit(bell: number | null, exact: number | null, watch: WatchPick | null): boolean {
  if (exact !== null) return bell === exact;
  if (watch === null) return true;
  if (watch === "blank") return bell === null;
  if (watch === "early" || watch === "late") return halfOf(bell) === watch;
  return watchOf(bell) === watch;
}

function paceScore(pace: string): number {
  if (pace === "brisk") return 3;
  if (pace === "even") return 2;
  if (pace === "slow") return 1;
  return 0;
}

function slowLate(card: QuillCard, desk: unknown): boolean {
  const gap = quillGap(card.bell, desk);
  return gap !== null && gap > 0 && card.pace === "slow" && inTray(card, "open");
}

/** Search stays on the note. The keeper, the bell, the hue, the tag, and the pace are not part of the query. */
export function visibleQuills(
  cards: readonly QuillCard[],
  tray: QuillTray,
  query: string,
  keeper: string | null,
  hue: QuillHue | null,
  tag: string | null,
  pace: QuillPace | null,
  exact: number | null,
  watch: WatchPick | null,
  briskOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): QuillCard[] {
  const text = query.trim().toLowerCase();
  const wantKeeper = keeper === null ? null : keeperLabel(keeper);
  const wantTag = tag === null ? null : quillTag(tag);
  return readQuills(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (briskOnly && card.pace !== "brisk") return false;
      if (wantKeeper !== null && keeperLabel(card.keeper) !== wantKeeper) return false;
      if (hue !== null && hueOf(card.hue) !== hue) return false;
      if (wantTag !== null && quillTag(card.tag) !== wantTag) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!bellHit(card.bell, exact, watch)) return false;
      if (lateOnly && !slowLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.text.localeCompare(b.text);
    });
}

/** The bell orders the desk. An unset bell stays at the end. Search stays on the note. */
export function quillTimeline(cards: readonly QuillCard[], query: string): QuillCard[] {
  const text = query.trim().toLowerCase();
  return readQuills(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.bell === null && b.bell !== null) return 1;
      if (a.bell !== null && b.bell === null) return -1;
      if (a.bell !== null && b.bell !== null && a.bell !== b.bell) return a.bell - b.bell;
      return a.text.localeCompare(b.text);
    });
}

export function quillCounts(cards: readonly QuillCard[], desk: unknown): QuillCounts {
  const rows = readQuills(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    kept: rows.filter((card) => inTray(card, "kept")).length,
    sent: rows.filter((card) => inTray(card, "sent")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => slowLate(card, desk)).length,
  };
}

/** Share of the saved reminders. A zero total stays at zero. */
export function quillShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function quillKeepers(cards: readonly QuillCard[]): string[] {
  const out: string[] = [];
  for (const card of readQuills(cards)) {
    if (card.keeper && !out.includes(card.keeper)) out.push(card.keeper);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function quillTags(cards: readonly QuillCard[]): string[] {
  const out: string[] = [];
  for (const card of readQuills(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function quillHues(cards: readonly QuillCard[]): Exclude<QuillHue, "blank">[] {
  const seen = new Set<string>();
  for (const card of readQuills(cards)) if (card.hue) seen.add(card.hue);
  return HUES.filter((hue) => seen.has(hue));
}

export function quillPaces(cards: readonly QuillCard[]): Exclude<QuillPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readQuills(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

/** Three watches. Index 0 is night. Index 2 is eve. */
export function watchCounts(cards: readonly QuillCard[]): number[] {
  const rows = readQuills(cards);
  return WATCHES.map((watch) => rows.filter((card) => watchOf(card.bell) === watch).length);
}

/** "all" and "blank" stay. A keeper that is no longer on a reminder falls back to all. */
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

/** "all" and "blank" stay. A hue that is no longer on a reminder falls back to all. */
export function activeHue(filter: string, hues: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const hue = hueName(filter);
  return hue && hues.includes(hue) ? hue : "all";
}

export function hueArg(filter: string): QuillHue | null {
  if (filter === "blank") return "blank";
  return hueName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a reminder falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = quillTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return quillTag(filter);
}

/** "all" and "blank" stay. A pace that is no longer on a reminder falls back to all. */
export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): QuillPace | null {
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

/** All, blank, the three watches, the two halves, and the bells 0 through 5 stay. Anything else is all. */
export function activeBell(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bell = bellOf(filter);
  return bell === null ? "all" : String(bell);
}

export function bellArg(filter: string): { exact: number | null; watch: WatchPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, watch: filter as WatchPick };
  const bell = bellOf(filter);
  return bell === null ? { exact: null, watch: null } : { exact: bell, watch: null };
}

/** Other reminders with the same hue and the same tag. A blank hue or a blank tag clashes with nothing. */
export function quillClashIds(cards: readonly QuillCard[], id: string): string[] {
  const rows = readQuills(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.hue || !card.tag) return [];
  return rows
    .filter((item) => item.id !== id && item.hue === card.hue && item.tag === card.tag)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved reminders share a hue and a tag with another reminder. */
export function clashQuillCount(cards: readonly QuillCard[]): number {
  const rows = readQuills(cards);
  return rows.filter((card) => quillClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open reminder at or after the bell you type, skipping brisk.
 * After the last bell, the desk wraps to the earliest open reminder that is not brisk.
 */
export function nextQuill(cards: readonly QuillCard[], desk: unknown): string {
  const now = bellOf(desk);
  if (now === null) return "";
  const waiting = readQuills(cards).filter((card) => inTray(card, "open") && card.bell !== null && card.pace !== "brisk");
  if (!waiting.length) return "";
  const byBell = (a: QuillCard, b: QuillCard) => (a.bell ?? 0) - (b.bell ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.bell ?? 0) >= now).sort(byBell);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBell)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the reminders saved in this browser. The gap uses the bell you pass. */
export function quillsCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,keeper,bell,hue,tag,pace,watch,pinned,kept,sent,gap,audit"];
  for (const card of readQuills(raw)) {
    const gap = quillGap(card.bell, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.keeper),
      card.bell === null ? "" : String(card.bell),
      card.hue,
      csvCell(card.tag),
      card.pace,
      watchOf(card.bell),
      card.pinned ? "1" : "0",
      card.kept ? "1" : "0",
      card.sent ? "1" : "0",
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
  return quillTag(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

export function readQuillViews(raw: unknown): QuillView[] {
  if (!Array.isArray(raw)) return [];
  const out: QuillView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<QuillView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 48),
      keeper: keeperSlot(row.keeper),
      hue: hueSlot(row.hue),
      tag: tagSlot(row.tag),
      pace: paceSlot(row.pace),
      bell: activeBell(String(row.bell ?? "")),
    });
  }
  return out.slice(0, 6);
}

export function addQuillView(
  views: readonly QuillView[],
  view: { id: string; name: string; tray: QuillTray; query: string; keeper: string; hue: string; tag: string; pace: string; bell: string },
): QuillView[] {
  const current = readQuillViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 48),
    keeper: keeperSlot(view.keeper),
    hue: hueSlot(view.hue),
    tag: tagSlot(view.tag),
    pace: paceSlot(view.pace),
    bell: activeBell(view.bell),
  }].slice(0, 6);
}

export function dropQuillView(views: readonly QuillView[], id: string): QuillView[] {
  return readQuillViews(views).filter((view) => view.id !== id);
}

function contactRaw(value: SealValue): string {
  if (typeof value === "string") return clip(value, 40);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (SEAL_BLOCK.some((key) => key in value)) return "";
  return clip(value.lastContactAt, 40);
}

function contactDate(value: SealValue): Date | null {
  const text = contactRaw(value);
  if (!text) return null;
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

/** The last-contact stamp already on the row. A login, a name, an email, and the other blocked fields are not a contact. */
export function contactStamp(value: SealValue): string {
  return contactRaw(value);
}

/**
 * A band from the last-contact field, in UTC.
 * Dawn is hours 0 through 7. Day is 8 through 15. Dusk is 16 through 23.
 * A missing or unreadable stamp stays unmarked and is not filled in.
 */
export function bandOf(value: SealValue): ContactBand {
  const date = contactDate(value);
  if (!date) return "";
  const hour = date.getUTCHours();
  if (hour <= 7) return "dawn";
  if (hour <= 15) return "day";
  return "dusk";
}

/**
 * Fresh is under 7 days, including a contact still ahead of now.
 * Quiet is 7 through 29 days. Cold is 30 days or more.
 * A missing stamp stays unmarked. The age uses the clock you pass.
 */
export function ageOf(value: SealValue, now = Date.now()): ContactAge {
  const date = contactDate(value);
  if (!date) return "";
  const days = Math.floor((now - date.getTime()) / DAY_MS);
  if (days < 7) return "fresh";
  if (days < 30) return "quiet";
  return "cold";
}

/** The UTC weekday of the last contact. An unmarked stamp stays blank. */
export function weekdayOf(value: SealValue): ContactWeek {
  const date = contactDate(value);
  if (!date) return "";
  return WEEKS[date.getUTCDay() + 1] as ContactWeek;
}

/** The UTC calendar day, YYYY-MM-DD. An unmarked stamp stays blank. */
export function dayOf(value: SealValue): string {
  const date = contactDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function bandLines(rows: readonly SealRow[]): BandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const band = bandOf(row.lastContactAt);
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: BandLine[] = [];
  for (const band of ["", ...BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function namedBands(rows: readonly SealRow[]): string[] {
  return bandLines(rows).map((line) => line.band).filter(Boolean);
}

export function ageLines(rows: readonly SealRow[], now = Date.now()): AgeLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const age = ageOf(row.lastContactAt, now);
    map.set(age, (map.get(age) || 0) + 1);
  }
  const out: AgeLine[] = [];
  for (const age of AGES) {
    const count = map.get(age);
    if (count) out.push({ age, count });
  }
  return out;
}

export function namedAges(rows: readonly SealRow[], now = Date.now()): string[] {
  return ageLines(rows, now).map((line) => line.age).filter(Boolean);
}

export function weekdayLines(rows: readonly SealRow[]): WeekLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const week = weekdayOf(row.lastContactAt);
    map.set(week, (map.get(week) || 0) + 1);
  }
  const out: WeekLine[] = [];
  for (const week of WEEKS) {
    const count = map.get(week);
    if (count) out.push({ week, count });
  }
  return out;
}

export function namedWeekdays(rows: readonly SealRow[]): string[] {
  return weekdayLines(rows).map((line) => line.week).filter(Boolean);
}

export function dayLines(rows: readonly SealRow[]): DayLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const day = dayOf(row.lastContactAt);
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

export function namedDays(rows: readonly SealRow[]): string[] {
  return dayLines(rows).map((line) => line.day).filter(Boolean);
}

/** The named day with the most loaded rows. A tie keeps the earlier day. A blank day is not a lead. */
export function leadingDay(rows: readonly SealRow[]): string {
  const named = dayLines(rows).filter((line) => line.day);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.day.localeCompare(b.day))[0].day;
}

/** The band with the most loaded rows. A tie keeps the earlier band. An unmarked stamp is not a lead. */
export function leadingBand(rows: readonly SealRow[]): string {
  const named = bandLines(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => BANDS.indexOf(band as (typeof BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function sealShare(count: number, total: number): number {
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

export function bandArg(filter: string): ContactBand | null {
  if (filter === "blank") return "";
  if ((BANDS as readonly string[]).includes(filter)) return filter as ContactBand;
  return null;
}

/** "all" and "blank" stay. An age that is no longer loaded falls back to all. */
export function activeAge(filter: string, ages: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (AGES as readonly string[]).includes(filter) && ages.includes(filter) ? filter : "all";
}

export function ageArg(filter: string): ContactAge | null {
  if (filter === "blank") return "";
  if ((AGES as readonly string[]).includes(filter) && filter !== "") return filter as ContactAge;
  return null;
}

/** "all" and "blank" stay. A weekday that is no longer loaded falls back to all. */
export function activeWeekday(filter: string, weeks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (WEEKS as readonly string[]).includes(filter) && weeks.includes(filter) ? filter : "all";
}

export function weekdayArg(filter: string): ContactWeek | null {
  if (filter === "blank") return "";
  if ((WEEKS as readonly string[]).includes(filter) && filter !== "") return filter as ContactWeek;
  return null;
}

/** Search stays on the name. The contact stamp is not part of the query. */
export function visibleSealCustomers<T extends SealRow>(
  rows: readonly T[],
  band: ContactBand | null,
  age: ContactAge | null,
  week: ContactWeek | null,
  day: string | null,
  query: string,
  now = Date.now(),
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (band !== null && bandOf(row.lastContactAt) !== band) return false;
    if (age !== null && ageOf(row.lastContactAt, now) !== age) return false;
    if (week !== null && weekdayOf(row.lastContactAt) !== week) return false;
    if (day !== null && dayOf(row.lastContactAt) !== day) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the bands, ages, weekdays, and days on this page. */
export function sealsCsv(rows: readonly SealRow[], now = Date.now()): string {
  const lines = ["kind,mark,count"];
  for (const line of bandLines(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of ageLines(rows, now)) lines.push(["age", line.age, String(line.count)].join(","));
  for (const line of weekdayLines(rows)) lines.push(["week", line.week, String(line.count)].join(","));
  for (const line of dayLines(rows)) lines.push(["day", csvCell(line.day), String(line.count)].join(","));
  return lines.join("\n");
}
