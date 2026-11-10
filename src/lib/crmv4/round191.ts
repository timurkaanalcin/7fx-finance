/**
 * Review minutes for the document desk, and the campaign crest already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_review_minute (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   reader text not null default '',
 *   minute integer,
 *   cloth text not null default '',
 *   folio text not null default '',
 *   stage text not null default '',
 *   pages integer,
 *   span integer,
 *   pinned boolean not null default false,
 *   parked boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_notice_crest_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_notice_crest_review (
 *   customer_id text primary key
 * );
 */

export const REVIEW_KEY = "crmv4-review-minutes";
export const REVIEW_VIEW_KEY = "crmv4-review-minute-views";
export const CREST_KEY = "crmv4-notice-crest-hide";
export const CREST_REVIEW_KEY = "crmv4-notice-crest-review";

export type ReviewCloth = "blank" | "linen" | "graphite" | "champagne" | "ivory";

export type ReviewStage = "blank" | "draft" | "read" | "seal";

export type ReviewTray = "open" | "parked" | "filed";

export type MinutePick = "blank" | "night" | "day" | "eve" | "peak" | "quiet";

export type Review = {
  id: string;
  title: string;
  note: string;
  reader: string;
  minute: number | null;
  cloth: string;
  folio: string;
  stage: string;
  pages: number | null;
  span: number | null;
  pinned: boolean;
  parked: boolean;
  filed: boolean;
  audit: string;
};

export type ReviewView = {
  id: string;
  name: string;
  tray: ReviewTray;
  query: string;
  reader: string;
  cloth: string;
  folio: string;
  stage: string;
  minute: string;
  pages: string;
  span: string;
};

export type ReviewCounts = {
  open: number;
  parked: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  house: number;
};

export type CrestState = "" | "set" | "clear";

export type CrestBand = "" | "chip" | "plaque" | "shield";

export type CrestVoice = "" | "vowel" | "plain";

export type CrestShape = "all" | "catalog" | "wide" | "vowel";

export type CrestValue =
  | { campaign?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type CrestRow = { id?: string; note?: CrestValue; label?: string | null };

export type CrestBandLine = { band: string; count: number };

export type CrestVoiceLine = { voice: string; count: number };

const AUDITS = ["save", "edit", "stage", "pin", "unpin", "park", "lift", "file", "reopen", "cloth"] as const;

const CLOTHS = ["linen", "graphite", "champagne", "ivory"] as const;

const STAGES = ["draft", "read", "seal"] as const;

const STAGE_ORDER = ["", "draft", "read", "seal"] as const;

const MINUTE_PICKS = ["blank", "night", "day", "eve", "peak", "quiet"] as const;

const PEAK_MINUTES = new Set([12, 42]);

const QUIET_MINUTES = new Set([3, 48]);

const PAGE_SET = [2, 6, 12] as const;

const SPAN_SET = [2, 4, 9] as const;

const HOUSE = new Set(["KY", "PO", "ID"]);

const CREST_BANDS = ["chip", "plaque", "shield"] as const;

const VOICES = ["vowel", "plain"] as const;

const CATALOG = new Set(["IVY", "GOLD88", "CHAM1901"]);

const CREST_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const REVIEW_CAP = 9;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ReviewTray {
  return raw === "parked" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ReviewCloth, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ReviewCloth, "blank">) : "";
}

function stageName(raw: unknown): Exclude<ReviewStage, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (STAGES as readonly string[]).includes(text) ? (text as Exclude<ReviewStage, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function reviewLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function reviewNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A folio is two letters. Anything else stays blank. Letters are stored in capitals. */
export function folioOf(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : "";
}

/**
 * A minute is an integer from 0 through 59.
 * A blank value stays unset. 60 is not a minute.
 * A leading zero is not a minute. The first minute is 0.
 */
export function minuteOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 59) return raw;
  if (typeof raw === "string" && /^(?:0|[1-9]|[1-5][0-9])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A page count is 2, 6, or 12.
 * A blank value stays unset. 0 and 4 are not page counts.
 * A leading zero is not a page count.
 */
export function pagesOf(raw: unknown): number | null {
  if (typeof raw === "number" && (PAGE_SET as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|6|12)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A span is 2, 4, or 9 days. A blank value stays unset. A leading zero is not a span. */
export function spanDays(raw: unknown): number | null {
  if (typeof raw === "number" && (SPAN_SET as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|9)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Linen, graphite, champagne, ivory, or blank. Anything else is blank. */
export function clothOf(raw: unknown): ReviewCloth {
  return clothName(raw) || "blank";
}

/** Draft, read, seal, or blank. Anything else is blank. */
export function stageOf(raw: unknown): ReviewStage {
  return stageName(raw) || "blank";
}

/** Night is 0–19. Day is 20–39. Eve is 40–59. An unset minute is blank. */
export function minuteBand(minute: unknown): "blank" | "night" | "day" | "eve" {
  const value = minuteOf(minute);
  if (value === null) return "blank";
  if (value <= 19) return "night";
  if (value <= 39) return "day";
  return "eve";
}

/** Peak minutes are 12 and 42. An unset minute is not a peak. */
export function peakMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && PEAK_MINUTES.has(value);
}

/** Quiet minutes are 3 and 48. 12 and 42 are not quiet. An unset minute is not quiet. */
export function quietMinute(minute: unknown): boolean {
  const value = minuteOf(minute);
  return value !== null && QUIET_MINUTES.has(value);
}

/**
 * The shortest signed step from the saved minute to the typed minute.
 * The ring wraps at 60. A step of 30 stays. A step of -30 stays.
 * A positive step means the typed minute is ahead of the pass.
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

/** KY, PO, and ID are house folios. A blank folio is not. */
export function houseFolio(folio: unknown): boolean {
  return HOUSE.has(folioOf(folio));
}

export function readReviews(raw: unknown): Review[] {
  if (!Array.isArray(raw)) return [];
  const out: Review[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Review>;
    const id = String(row.id || "").trim();
    const title = reviewLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: reviewNote(row.note),
      reader: readerLabel(row.reader),
      minute: minuteOf(row.minute),
      cloth: clothName(row.cloth),
      folio: folioOf(row.folio),
      stage: stageName(row.stage),
      pages: pagesOf(row.pages),
      span: spanDays(row.span),
      pinned: row.pinned === true,
      parked: row.parked === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, REVIEW_CAP);
}

export function addReview(
  cards: readonly Review[],
  card: {
    id: string;
    title: string;
    note?: string;
    reader?: string;
    minute?: unknown;
    cloth?: string;
    folio?: string;
    stage?: string;
    pages?: unknown;
    span?: unknown;
  },
): Review[] {
  const current = readReviews(cards);
  const id = String(card.id || "").trim();
  const title = reviewLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Review = {
    id,
    title,
    note: reviewNote(card.note),
    reader: readerLabel(card.reader),
    minute: minuteOf(card.minute),
    cloth: clothName(card.cloth),
    folio: folioOf(card.folio),
    stage: stageName(card.stage),
    pages: pagesOf(card.pages),
    span: spanDays(card.span),
    pinned: false,
    parked: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, REVIEW_CAP);
}

/** Blank becomes draft. Draft becomes read, read becomes seal, and seal returns to draft. */
export function cycleStage(cards: readonly Review[], id: string): Review[] {
  return readReviews(cards).map((card) => {
    if (card.id !== id) return card;
    const at = STAGE_ORDER.indexOf(card.stage as (typeof STAGE_ORDER)[number]);
    const next = at < 0 || at >= STAGES.length ? STAGES[0] : STAGES[at % STAGES.length];
    if (!next || next === card.stage) return card;
    return { ...card, stage: next, audit: "stage" };
  });
}

export function setReviewPin(cards: readonly Review[], id: string, pinned: boolean): Review[] {
  return readReviews(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setReviewPark(cards: readonly Review[], id: string, parked: boolean): Review[] {
  return readReviews(cards).map((card) => (card.id === id ? { ...card, parked, audit: parked ? "park" : "lift" } : card));
}

export function setReviewFile(cards: readonly Review[], id: string, filed: boolean): Review[] {
  return readReviews(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editReview(cards: readonly Review[], id: string, title: string): Review[] {
  const current = readReviews(cards);
  const next = reviewLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editReviewNote(cards: readonly Review[], id: string, note: string): Review[] {
  const current = readReviews(cards);
  const next = reviewNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkReviewPin(cards: readonly Review[], ids: readonly string[], pinned: boolean): Review[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readReviews(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkReviewCloth(cards: readonly Review[], ids: readonly string[], cloth: unknown): Review[] {
  const next = clothName(cloth);
  if (!next) return readReviews(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readReviews(cards).map((card) => (want.has(card.id) ? { ...card, cloth: next, audit: "cloth" } : card));
}

export function bulkReviewFile(cards: readonly Review[], ids: readonly string[], filed: boolean): Review[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readReviews(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

export function resetReviews(): Review[] {
  return [];
}

function inTray(card: Review, tray: ReviewTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "parked") return card.parked && !card.filed;
  return !card.parked && !card.filed;
}

function minuteHit(minute: number | null, exact: number | null, pick: MinutePick | null): boolean {
  if (exact !== null) return minute === exact;
  if (pick === null) return true;
  if (pick === "blank") return minute === null;
  if (pick === "peak") return peakMinute(minute);
  if (pick === "quiet") return quietMinute(minute);
  return minuteBand(minute) === pick;
}

function stageScore(stage: string): number {
  if (stage === "seal") return 3;
  if (stage === "read") return 2;
  if (stage === "draft") return 1;
  return 0;
}

/** An open pass whose minute sits more than six steps behind the desk minute. A parked or filed pass is not late. */
export function lateReview(card: Review, desk: unknown): boolean {
  const gap = minuteGap(card.minute, desk);
  return inTray(card, "open") && gap !== null && gap > 6;
}

/** An open pass with a 2 day span is the reminder. A parked or filed pass is not. */
export function soonReview(card: Review): boolean {
  return inTray(card, "open") && card.span === 2;
}

/** Search matches the title, the note, and the reader. The minute and the cloth are not part of the query. */
export function visibleReviews(
  cards: readonly Review[],
  tray: ReviewTray,
  query: string,
  reader: string | null,
  cloth: ReviewCloth | null,
  folio: string | null,
  stage: ReviewStage | null,
  exact: number | null,
  pick: MinutePick | null,
  pages: number | "blank" | null,
  span: number | "blank" | null,
  draftOnly: boolean,
  peakOnly: boolean,
  houseOnly: boolean,
  quietOnly: boolean,
): Review[] {
  const text = query.trim().toLowerCase();
  const wantReader = reader === null ? null : readerLabel(reader);
  const wantFolio = folio === null ? null : folioOf(folio);
  return readReviews(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantReader !== null && card.reader !== wantReader) return false;
      if (cloth !== null && clothOf(card.cloth) !== cloth) return false;
      if (wantFolio !== null && card.folio !== wantFolio) return false;
      if (stage !== null && stageOf(card.stage) !== stage) return false;
      if (!minuteHit(card.minute, exact, pick)) return false;
      if (pages === "blank" && card.pages !== null) return false;
      if (typeof pages === "number" && card.pages !== pages) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (draftOnly && card.stage !== "draft") return false;
      if (peakOnly && !peakMinute(card.minute)) return false;
      if (quietOnly && !quietMinute(card.minute)) return false;
      if (houseOnly && !houseFolio(card.folio)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.reader.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (stageScore(a.stage) !== stageScore(b.stage)) return stageScore(b.stage) - stageScore(a.stage);
      return a.title.localeCompare(b.title);
    });
}

export function reviewTimeline(cards: readonly Review[], query: string): Review[] {
  const text = query.trim().toLowerCase();
  return readReviews(cards)
    .filter((card) => card.minute !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.reader.toLowerCase().includes(text))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || a.title.localeCompare(b.title));
}

export function reviewCounts(cards: readonly Review[], desk: unknown): ReviewCounts {
  const rows = readReviews(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    parked: rows.filter((card) => inTray(card, "parked")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakMinute(card.minute) && inTray(card, "open")).length,
    late: rows.filter((card) => lateReview(card, desk)).length,
    soon: rows.filter((card) => soonReview(card)).length,
    house: rows.filter((card) => houseFolio(card.folio)).length,
  };
}

export function reviewShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function reviewReaders(cards: readonly Review[]): string[] {
  const seen = new Set<string>();
  for (const card of readReviews(cards)) if (card.reader) seen.add(card.reader);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function reviewFolios(cards: readonly Review[]): string[] {
  const seen = new Set<string>();
  for (const card of readReviews(cards)) if (card.folio) seen.add(card.folio);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function clothCounts(cards: readonly Review[]): { cloth: Exclude<ReviewCloth, "blank">; count: number }[] {
  const rows = readReviews(cards);
  return CLOTHS.map((cloth) => ({ cloth, count: rows.filter((card) => card.cloth === cloth).length })).filter((row) => row.count > 0);
}

export function usedMinutes(cards: readonly Review[]): number {
  return new Set(readReviews(cards).map((card) => card.minute).filter((minute): minute is number => minute !== null)).size;
}

export function clashMinuteIds(cards: readonly Review[]): string[] {
  const open = readReviews(cards).filter((card) => inTray(card, "open") && card.minute !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.minute === card.minute)).map((card) => card.id);
}

export function clashMinuteCount(cards: readonly Review[]): number {
  return clashMinuteIds(cards).length;
}

export function pageClashIds(cards: readonly Review[]): string[] {
  const open = readReviews(cards).filter((card) => inTray(card, "open") && card.pages !== null && card.cloth);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.cloth === card.cloth && other.pages === card.pages)).map((card) => card.id);
}

export function pageClashCount(cards: readonly Review[]): number {
  return pageClashIds(cards).length;
}

/** The next open pass at or after the desk minute. Sealed stages wait. A blank desk minute stays blank. */
export function nextReview(cards: readonly Review[], desk: unknown): string {
  const now = minuteOf(desk);
  if (now === null) return "";
  const waiting = readReviews(cards).filter((card) => inTray(card, "open") && card.minute !== null && card.stage !== "seal");
  if (!waiting.length) return "";
  const byMinute = (a: Review, b: Review) => (a.minute ?? 0) - (b.minute ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.minute ?? 0) >= now).sort(byMinute);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byMinute)[0].id;
}

/**
 * The cloth with the fewest open passes.
 * A tie keeps champagne, then linen, then graphite, then ivory.
 * Passes with no cloth are not a load. An empty desk still suggests champagne.
 */
export function suggestCloth(cards: readonly Review[]): Exclude<ReviewCloth, "blank"> {
  const rows = readReviews(cards).filter((card) => inTray(card, "open"));
  const order = ["champagne", "linen", "graphite", "ivory"] as const;
  let best: Exclude<ReviewCloth, "blank"> = "champagne";
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
 * The reader carrying the fewest open passes.
 * A tie keeps the earlier name. A blank reader is not a load.
 * An empty desk stays blank.
 */
export function suggestReader(cards: readonly Review[]): string {
  const rows = readReviews(cards).filter((card) => inTray(card, "open") && card.reader);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.reader))).sort((a, b) => a.localeCompare(b));
  for (const reader of names) {
    const count = rows.filter((card) => card.reader === reader).length;
    if (count < bestCount) {
      best = reader;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open passes.
 * A tie keeps 4, then 2, then 9.
 * An empty desk still suggests 4.
 */
export function suggestSpan(cards: readonly Review[]): (typeof SPAN_SET)[number] {
  const rows = readReviews(cards).filter((card) => inTray(card, "open"));
  const order = [4, 2, 9] as const;
  let best: (typeof SPAN_SET)[number] = 4;
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

/**
 * The roster name with the fewest open passes.
 * A blank roster falls back to the least-loaded reader already on the desk.
 * A tie keeps the earlier name.
 */
export function fairReader(cards: readonly Review[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = readerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestReader(cards);
  const open = readReviews(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.reader === name).length;
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

/** The CSV is the passes saved in this browser. The gap and the late mark use the minute you pass. */
export function reviewsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,reader,minute,cloth,folio,stage,pages,span,band,pinned,parked,filed,gap,late,soon,house,note,audit"];
  for (const card of readReviews(raw)) {
    const gap = minuteGap(card.minute, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.reader),
      card.minute === null ? "" : String(card.minute),
      card.cloth,
      csvCell(card.folio),
      card.stage,
      card.pages === null ? "" : String(card.pages),
      card.span === null ? "" : String(card.span),
      minuteBand(card.minute),
      card.pinned ? "1" : "0",
      card.parked ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateReview(card, desk) ? "1" : "0",
      soonReview(card) ? "1" : "0",
      houseFolio(card.folio) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function reviewCopy(card: Review): string {
  return [card.title, card.reader, card.minute ?? "", card.cloth, card.folio, card.stage, card.pages ?? "", card.span ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function readerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return readerLabel(raw) || "all";
}

function clothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clothName(raw) || "all";
}

function folioSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return folioOf(raw) || "all";
}

function stageSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stageName(raw) || "all";
}

/** "all" and a minute pick stay. A minute from 0 through 59 stays. Anything else is all. */
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

/** All, blank, and the page counts 2, 6, and 12 stay. Anything else is all. */
export function activePages(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const pages = pagesOf(filter);
  return pages === null ? "all" : String(pages);
}

export function pagesArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pagesOf(filter);
}

/** All, blank, and the spans 2, 4, and 9 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanDays(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanDays(filter);
}

export function activeReader(filter: string, readers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const reader = readerLabel(filter);
  return reader && readers.includes(reader) ? reader : "all";
}

export function readerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return readerLabel(filter) || null;
}

export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function clothArg(filter: string): ReviewCloth | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return clothName(filter) || null;
}

export function activeFolio(filter: string, folios: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const folio = folioOf(filter);
  return folio && folios.includes(folio) ? folio : "all";
}

export function folioArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return folioOf(filter) || null;
}

export function activeStage(filter: string, stages: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const stage = stageName(filter);
  return stage && stages.includes(stage) ? stage : "all";
}

export function stageArg(filter: string): ReviewStage | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return stageName(filter) || null;
}

export function readReviewViews(raw: unknown): ReviewView[] {
  if (!Array.isArray(raw)) return [];
  const out: ReviewView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ReviewView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      reader: readerSlot(row.reader),
      cloth: clothSlot(row.cloth),
      folio: folioSlot(row.folio),
      stage: stageSlot(row.stage),
      minute: activeMinute(String(row.minute || "all")),
      pages: activePages(String(row.pages || "all")),
      span: activeSpan(String(row.span || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addReviewView(views: readonly ReviewView[], view: ReviewView): ReviewView[] {
  const current = readReviewViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    reader: readerSlot(view.reader),
    cloth: clothSlot(view.cloth),
    folio: folioSlot(view.folio),
    stage: stageSlot(view.stage),
    minute: activeMinute(view.minute),
    pages: activePages(view.pages),
    span: activeSpan(view.span),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropReviewView(views: readonly ReviewView[], id: string): ReviewView[] {
  return readReviewViews(views).filter((view) => view.id !== id);
}

/**
 * A notice crest is a campaign code already stored on the account.
 * Lengths that stay are 3, 6, and 8. A blank value stays unset.
 */
export function crestToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,8}$/.test(text)) return null;
  const size = text.length;
  if (size !== 3 && size !== 6 && size !== 8) return null;
  return text;
}

function crestBody(value: CrestValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = crestToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (CREST_BLOCK.some((key) => key in value)) return null;
  if (!("campaign" in value)) return { text: null, explicit: false };
  const inner = value.campaign;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = crestToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set crest is a campaign code of length 3, 6, or 8.
 * A clear crest is an explicit blank. A missing field stays unmarked.
 */
export function crestState(value: CrestValue): CrestState {
  const body = crestBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The campaign code, or a blank string when the crest is clear or unmarked. */
export function crestCopy(value: CrestValue): string {
  return crestBody(value)?.text || "";
}

/**
 * Chip is 3. Plaque is 6. Shield is 8.
 * A blank code has no band.
 */
export function crestBand(value: CrestValue): CrestBand {
  const text = crestBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n === 3) return "chip";
  if (n === 6) return "plaque";
  return "shield";
}

/** Vowel or plain. A blank code has no voice. */
export function crestVoice(value: CrestValue): CrestVoice {
  const text = crestBody(value)?.text;
  if (!text) return "";
  return /[AEIOU]/.test(text) ? "vowel" : "plain";
}

/** IVY, GOLD88, and CHAM1901 are the house catalog. */
export function catalogCrest(value: CrestValue): boolean {
  const text = crestBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A code of 6 or 8. A clear code is not wide. */
export function wideCrest(value: CrestValue): boolean {
  const band = crestBand(value);
  return band === "plaque" || band === "shield";
}

/** A code that carries a vowel. A clear code is not a vowel crest. */
export function vowelCrest(value: CrestValue): boolean {
  return crestVoice(value) === "vowel";
}

export function catalogCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestState(row.note) === "set" && catalogCrest(row.note)).length;
}

export function wideCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestState(row.note) === "set" && wideCrest(row.note)).length;
}

export function vowelCrestCount(rows: readonly CrestRow[]): number {
  return rows.filter((row) => crestState(row.note) === "set" && vowelCrest(row.note)).length;
}

/** How many distinct campaign codes are shared by two or more customers. */
export function sharedCrestCount(rows: readonly CrestRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (crestState(row.note) !== "set") continue;
    const text = crestCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function crestBands(rows: readonly CrestRow[]): CrestBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = crestState(row.note);
    if (state === "") continue;
    const band = state === "set" ? crestBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: CrestBandLine[] = [];
  for (const band of ["", ...CREST_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function crestVoices(rows: readonly CrestRow[]): CrestVoiceLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const voice = crestVoice(row.note);
    map.set(voice, (map.get(voice) || 0) + 1);
  }
  const out: CrestVoiceLine[] = [];
  for (const voice of ["", ...VOICES]) {
    const count = map.get(voice);
    if (count) out.push({ voice, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps chip, then plaque, and shield. An unmarked field is not a lead. */
export function leadingCrest(rows: readonly CrestRow[]): string {
  const named = crestBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => CREST_BANDS.indexOf(band as (typeof CREST_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The voice with the most loaded rows. A tie keeps vowel, then plain. A blank code is not a lead. */
export function leadingCrestVoice(rows: readonly CrestRow[]): string {
  const named = crestVoices(rows).filter((line) => line.voice);
  if (!named.length) return "";
  const order = (voice: string) => VOICES.indexOf(voice as (typeof VOICES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.voice) - order(b.voice))[0].voice;
}

export function crestShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((CREST_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentCrests(rows: readonly CrestRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = crestState(row.note);
    const token = state === "set" ? crestBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenCrests(raw: unknown, present: readonly string[]): string[] {
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

export function toggleCrest(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenCrests(hidden, present);
  const current = readHiddenCrests(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleCrestBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCrests(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function crestBandArg(filter: string): CrestBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as CrestBand) : null;
}

export function activeCrestBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

function voiceOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (VOICES as readonly string[]).includes(text) ? text : "";
}

export function crestVoiceArg(filter: string): CrestVoice | null {
  if (filter === "all") return null;
  const voice = voiceOwner(filter);
  return voice ? (voice as CrestVoice) : null;
}

export function activeCrestVoice(filter: string): string {
  if (filter === "all") return "all";
  return voiceOwner(filter) || "all";
}

function rowId(row: CrestRow): string {
  return String(row.id || "").trim();
}

export function readReviewedCrests(raw: unknown, present: readonly string[]): string[] {
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

export function toggleCrestReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedCrests(reviewed, present);
  const current = readReviewedCrests(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkCrestReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedCrests(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the voice, and the code are not part of the query. */
export function visibleCrestCustomers<T extends CrestRow>(
  rows: readonly T[],
  band: CrestBand | "blank" | null,
  voice: CrestVoice | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: CrestShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = crestState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && crestBand(row.note) !== band) return false;
    if (voice !== null && crestVoice(row.note) !== voice) return false;
    if (shape === "catalog" && !catalogCrest(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideCrest(row.note))) return false;
    if (shape === "vowel" && !vowelCrest(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and voices on this page. */
export function crestsCsv(rows: readonly CrestRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = crestState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of crestBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of crestVoices(rows)) lines.push(["voice", csvCell(line.voice), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogCrestCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideCrestCount(rows))].join(","));
  lines.push(["shape", "vowel", String(vowelCrestCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedCrestCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function crestRowsCsv(rows: readonly CrestRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,voice,crest,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(crestBand(row.note)),
      csvCell(crestVoice(row.note)),
      csvCell(crestCopy(row.note)),
      catalogCrest(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
