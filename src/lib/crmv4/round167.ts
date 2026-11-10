/**
 * Local reading-nook slips, and the withdrawal flag already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_nook_slip (
 *   id text primary key,
 *   title text not null,
 *   aside text not null default '',
 *   reader text not null default '',
 *   page integer,
 *   booth text not null default '',
 *   mark text not null default '',
 *   ink text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   done boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_bolt_hide (
 *   bolt text primary key
 * );
 */

export const NOOK_KEY = "crmv4-nook-slips";
export const NOOK_VIEW_KEY = "crmv4-nook-views";
export const BOLT_KEY = "crmv4-bolt-hide";

export type NookInk = "blank" | "soft" | "firm" | "sharp";

export type NookBooth = "blank" | "red" | "blue" | "green" | "ivory";

export type NookTray = "open" | "held" | "done";

export type PagePick = "blank" | "front" | "middle" | "back" | "quiet" | "day";

export type NookCard = {
  id: string;
  title: string;
  aside: string;
  reader: string;
  page: number | null;
  booth: string;
  mark: string;
  ink: string;
  pinned: boolean;
  held: boolean;
  done: boolean;
  audit: string;
};

export type NookView = {
  id: string;
  name: string;
  tray: NookTray;
  query: string;
  reader: string;
  booth: string;
  mark: string;
  ink: string;
  page: string;
};

export type NookCounts = {
  open: number;
  held: number;
  done: number;
  pinned: number;
  quiet: number;
};

export type BoltMark = "" | "free" | "held";

export type NameSpan = "" | "short" | "mid" | "long";

export type NameMark = "" | "pair" | "solo";

export type BoltValue =
  | {
      withdrawalsEnabled?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
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

export type BoltRow = { bolt?: BoltValue; label?: string | null };

export type BoltLine = { bolt: string; count: number };

export type SpanLine = { span: string; count: number };

export type MarkLine = { mark: string; count: number };

const AUDITS = ["save", "edit", "ink", "pin", "unpin", "hold", "release", "done", "reopen", "booth"] as const;

const BOOTHS = ["red", "blue", "green", "ivory"] as const;

const INKS = ["soft", "firm", "sharp"] as const;

const INK_ORDER = ["", "soft", "firm", "sharp"] as const;

const PICKS = ["blank", "front", "middle", "back", "quiet", "day"] as const;

const BANDS = ["front", "middle", "back"] as const;

const QUIET = new Set([1, 2, 3, 38, 39, 40]);

const BOLTS = ["free", "held"] as const;

const SPANS = ["short", "mid", "long"] as const;

const MARKS = ["pair", "solo"] as const;

const BOLT_BLOCK = ["loginEnabled", "tradingEnabled", "ftd", "name", "email", "phone", "country", "desk"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): NookTray {
  return raw === "held" || raw === "done" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function boothName(raw: unknown): Exclude<NookBooth, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (BOOTHS as readonly string[]).includes(text) ? (text as Exclude<NookBooth, "blank">) : "";
}

function inkName(raw: unknown): Exclude<NookInk, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (INKS as readonly string[]).includes(text) ? (text as Exclude<NookInk, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function nookLine(raw: unknown): string {
  return clip(raw, 36);
}

/** A blank note stays blank. It is not filled in. */
export function nookAside(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A blank mark stays blank. It is not filled in. */
export function nookMark(raw: unknown): string {
  return clip(raw, 4);
}

/**
 * A page is an integer from 1 through 40.
 * A blank value stays unset. 0 and 41 are not pages.
 * A leading zero is the same page: 08 is 8, and 01 is 1.
 */
export function pageOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 40) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|0[1-9]|[12][0-9]|3[0-9]|40)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Red, blue, green, ivory, or blank. Anything else is blank. */
export function boothOf(raw: unknown): NookBooth {
  return boothName(raw) || "blank";
}

/** Soft, firm, sharp, or blank. Anything else is blank. */
export function inkOf(raw: unknown): NookInk {
  return inkName(raw) || "blank";
}

/** Front is 1–10. Middle is 11–25. Back is 26–40. An unset page is blank. */
export function bandOf(page: unknown): "blank" | "front" | "middle" | "back" {
  const value = pageOf(page);
  if (value === null) return "blank";
  if (value <= 10) return "front";
  if (value <= 25) return "middle";
  return "back";
}

/** Quiet pages are 1 through 3 and 38 through 40. An unset page is not quiet. */
export function quietPage(page: unknown): boolean {
  const value = pageOf(page);
  return value !== null && QUIET.has(value);
}

/** Day pages are 4 through 37. An unset page is not day. */
export function dayPage(page: unknown): boolean {
  const value = pageOf(page);
  return value !== null && !QUIET.has(value);
}

/** The typed page minus the slip page. A positive gap is past the slip. The packet does not wrap. */
export function nookGap(page: unknown, desk: unknown): number | null {
  const from = pageOf(page);
  const at = pageOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readNooks(raw: unknown): NookCard[] {
  if (!Array.isArray(raw)) return [];
  const out: NookCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NookCard>;
    const id = String(row.id || "").trim();
    const title = nookLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      aside: nookAside(row.aside),
      reader: readerLabel(row.reader),
      page: pageOf(row.page),
      booth: boothName(row.booth),
      mark: nookMark(row.mark),
      ink: inkName(row.ink),
      pinned: row.pinned === true,
      held: row.held === true,
      done: row.done === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 8);
}

export function addNook(
  cards: readonly NookCard[],
  card: { id: string; title: string; aside?: string; reader?: string; page?: unknown; booth?: string; mark?: string; ink?: string },
): NookCard[] {
  const current = readNooks(cards);
  const id = String(card.id || "").trim();
  const title = nookLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: NookCard = {
    id,
    title,
    aside: nookAside(card.aside),
    reader: readerLabel(card.reader),
    page: pageOf(card.page),
    booth: boothName(card.booth),
    mark: nookMark(card.mark),
    ink: inkName(card.ink),
    pinned: false,
    held: false,
    done: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 8);
}

/** Blank becomes soft. Soft becomes firm, firm becomes sharp, and sharp returns to soft. */
export function cycleNookInk(cards: readonly NookCard[], id: string): NookCard[] {
  return readNooks(cards).map((card) => {
    if (card.id !== id) return card;
    const at = INK_ORDER.indexOf(card.ink as (typeof INK_ORDER)[number]);
    const next = at < 0 || at >= INKS.length ? INKS[0] : INKS[at % INKS.length];
    if (!next || next === card.ink) return card;
    return { ...card, ink: next, audit: "ink" };
  });
}

export function setNookPin(cards: readonly NookCard[], id: string, pinned: boolean): NookCard[] {
  return readNooks(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setNookHeld(cards: readonly NookCard[], id: string, held: boolean): NookCard[] {
  return readNooks(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setNookDone(cards: readonly NookCard[], id: string, done: boolean): NookCard[] {
  return readNooks(cards).map((card) => (card.id === id ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editNook(cards: readonly NookCard[], id: string, title: string): NookCard[] {
  const current = readNooks(cards);
  const next = nookLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editNookNote(cards: readonly NookCard[], id: string, aside: string): NookCard[] {
  const current = readNooks(cards);
  const next = nookAside(aside);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.aside !== next ? { ...card, aside: next, audit: "edit" } : card));
}

export function bulkNookPin(cards: readonly NookCard[], ids: readonly string[], pinned: boolean): NookCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readNooks(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkNookDone(cards: readonly NookCard[], ids: readonly string[], done: boolean): NookCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readNooks(cards).map((card) => (want.has(card.id) ? { ...card, done, audit: done ? "done" : "reopen" } : card));
}

/** A blank or unknown booth is left out. A slip already in that booth is left as it is. */
export function bulkNookBooth(cards: readonly NookCard[], ids: readonly string[], booth: string): NookCard[] {
  const name = boothName(booth);
  const current = readNooks(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.booth !== name ? { ...card, booth: name, audit: "booth" } : card));
}

export function resetNooks(): NookCard[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function nookCopy(raw: unknown): string {
  return nookLine(raw);
}

function inTray(card: NookCard, tray: NookTray): boolean {
  if (tray === "done") return card.done;
  if (tray === "held") return card.held && !card.done;
  return !card.held && !card.done;
}

function pageHit(page: number | null, exact: number | null, pick: PagePick | null): boolean {
  if (exact !== null) return page === exact;
  if (pick === null) return true;
  if (pick === "blank") return page === null;
  if (pick === "quiet") return quietPage(page);
  if (pick === "day") return dayPage(page);
  return bandOf(page) === pick;
}

function inkScore(ink: string): number {
  if (ink === "sharp") return 3;
  if (ink === "firm") return 2;
  if (ink === "soft") return 1;
  return 0;
}

function waitingQuiet(card: NookCard): boolean {
  return quietPage(card.page) && inTray(card, "open");
}

function haystack(card: NookCard): string {
  return `${card.title}\n${card.aside}`.toLowerCase();
}

/** Search matches the title and the note. The reader, the page, the booth, and the ink are not part of the query. */
export function visibleNooks(
  cards: readonly NookCard[],
  tray: NookTray,
  query: string,
  reader: string | null,
  booth: NookBooth | null,
  mark: string | null,
  ink: NookInk | null,
  exact: number | null,
  pick: PagePick | null,
  sharpOnly: boolean,
  quietOnly: boolean,
): NookCard[] {
  const text = query.trim().toLowerCase();
  const wantReader = reader === null ? null : readerLabel(reader);
  const wantMark = mark === null ? null : nookMark(mark);
  return readNooks(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (sharpOnly && card.ink !== "sharp") return false;
      if (wantReader !== null && readerLabel(card.reader) !== wantReader) return false;
      if (booth !== null && boothOf(card.booth) !== booth) return false;
      if (wantMark !== null && nookMark(card.mark) !== wantMark) return false;
      if (ink !== null && inkOf(card.ink) !== ink) return false;
      if (!pageHit(card.page, exact, pick)) return false;
      if (quietOnly && !waitingQuiet(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (inkScore(a.ink) !== inkScore(b.ink)) return inkScore(b.ink) - inkScore(a.ink);
      return a.title.localeCompare(b.title);
    });
}

/** The page orders the packet. An unset page stays at the end. Search matches the title and the note. */
export function nookTimeline(cards: readonly NookCard[], query: string): NookCard[] {
  const text = query.trim().toLowerCase();
  return readNooks(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.page === null && b.page !== null) return 1;
      if (a.page !== null && b.page === null) return -1;
      if (a.page !== null && b.page !== null && a.page !== b.page) return a.page - b.page;
      return a.title.localeCompare(b.title);
    });
}

export function nookCounts(cards: readonly NookCard[]): NookCounts {
  const rows = readNooks(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    done: rows.filter((card) => inTray(card, "done")).length,
    pinned: rows.filter((card) => card.pinned).length,
    quiet: rows.filter((card) => waitingQuiet(card)).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function nookShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function nookReaders(cards: readonly NookCard[]): string[] {
  const out: string[] = [];
  for (const card of readNooks(cards)) {
    if (card.reader && !out.includes(card.reader)) out.push(card.reader);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function nookMarks(cards: readonly NookCard[]): string[] {
  const out: string[] = [];
  for (const card of readNooks(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function nookBooths(cards: readonly NookCard[]): Exclude<NookBooth, "blank">[] {
  const seen = new Set<string>();
  for (const card of readNooks(cards)) if (card.booth) seen.add(card.booth);
  return BOOTHS.filter((booth) => seen.has(booth));
}

export function nookInks(cards: readonly NookCard[]): Exclude<NookInk, "blank">[] {
  const seen = new Set<string>();
  for (const card of readNooks(cards)) if (card.ink) seen.add(card.ink);
  return INKS.filter((ink) => seen.has(ink));
}

/** How many open slips a reader still holds. A blank reader is not a load. */
export function readerLoad(cards: readonly NookCard[], reader: string): number {
  const name = readerLabel(reader);
  if (!name) return 0;
  return readNooks(cards).filter((card) => card.reader === name && inTray(card, "open")).length;
}

/** Three bands. Index 0 is the front. Index 2 is the back. */
export function bandCounts(cards: readonly NookCard[]): number[] {
  const rows = readNooks(cards);
  return BANDS.map((band) => rows.filter((card) => bandOf(card.page) === band).length);
}

/** "all" and "blank" stay. A reader that is no longer on a slip falls back to all. */
export function activeReader(filter: string, readers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const reader = readerLabel(filter);
  return reader && readers.includes(reader) ? reader : "all";
}

export function readerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return readerLabel(filter);
}

/** "all" and "blank" stay. A booth that is no longer on a slip falls back to all. */
export function activeBooth(filter: string, booths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const booth = boothName(filter);
  return booth && booths.includes(booth) ? booth : "all";
}

export function boothArg(filter: string): NookBooth | null {
  if (filter === "blank") return "blank";
  return boothName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a slip falls back to all. */
export function activeNookMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = nookMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function nookMarkArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return nookMark(filter);
}

/** "all" and "blank" stay. An ink that is no longer on a slip falls back to all. */
export function activeInk(filter: string, inks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ink = inkName(filter);
  return ink && inks.includes(ink) ? ink : "all";
}

export function inkArg(filter: string): NookInk | null {
  if (filter === "blank") return "blank";
  return inkName(filter) || null;
}

/** All, blank, the bands, quiet, day, and the pages 1 through 40 stay. Anything else is all. */
export function activePage(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const page = pageOf(filter);
  return page === null ? "all" : String(page);
}

export function pageArg(filter: string): { exact: number | null; pick: PagePick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as PagePick };
  const page = pageOf(filter);
  return page === null ? { exact: null, pick: null } : { exact: page, pick: null };
}

/** Other slips with the same booth and the same page. A blank booth or a blank page clashes with nothing. */
export function nookClashIds(cards: readonly NookCard[], id: string): string[] {
  const rows = readNooks(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.booth || card.page === null) return [];
  return rows
    .filter((item) => item.id !== id && item.booth === card.booth && item.page === card.page)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved slips share a booth and a page with another slip. */
export function clashNookCount(cards: readonly NookCard[]): number {
  const rows = readNooks(cards);
  return rows.filter((card) => nookClashIds(rows, card.id).length > 0).length;
}

/** Other slips with the same booth and the same mark. A blank booth or a blank mark clashes with nothing. */
export function markClashIds(cards: readonly NookCard[], id: string): string[] {
  const rows = readNooks(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.booth || !card.mark) return [];
  return rows
    .filter((item) => item.id !== id && item.booth === card.booth && item.mark === card.mark)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved slips share a booth and a mark with another slip. */
export function markClashCount(cards: readonly NookCard[]): number {
  const rows = readNooks(cards);
  return rows.filter((card) => markClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open slip at or after the page you type, skipping sharp ink.
 * After the last page, the packet wraps to the earliest open slip that is not sharp.
 */
export function nextNook(cards: readonly NookCard[], desk: unknown): string {
  const now = pageOf(desk);
  if (now === null) return "";
  const waiting = readNooks(cards).filter((card) => inTray(card, "open") && card.page !== null && card.ink !== "sharp");
  if (!waiting.length) return "";
  const byPage = (a: NookCard, b: NookCard) => (a.page ?? 0) - (b.page ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.page ?? 0) >= now).sort(byPage);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byPage)[0].id;
}

/**
 * The booth with the fewest open slips.
 * A tie keeps the earlier booth: red, then blue, green, and ivory.
 * Slips with no booth are not a load. An empty desk still suggests red.
 */
export function suggestBooth(cards: readonly NookCard[]): Exclude<NookBooth, "blank"> {
  const rows = readNooks(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<NookBooth, "blank"> = "red";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const booth of BOOTHS) {
    const count = rows.filter((card) => card.booth === booth).length;
    if (count < bestCount) {
      best = booth;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the page you pass. */
export function nooksCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,reader,page,booth,mark,ink,band,pinned,held,done,gap,aside,audit"];
  for (const card of readNooks(raw)) {
    const gap = nookGap(card.page, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.reader),
      card.page === null ? "" : String(card.page),
      card.booth,
      csvCell(card.mark),
      card.ink,
      bandOf(card.page),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.done ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.aside),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function readerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return readerLabel(raw) || "all";
}

function boothSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return boothName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return nookMark(raw) || "all";
}

function inkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return inkName(raw) || "all";
}

export function readNookViews(raw: unknown): NookView[] {
  if (!Array.isArray(raw)) return [];
  const out: NookView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<NookView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      reader: readerSlot(row.reader),
      booth: boothSlot(row.booth),
      mark: markSlot(row.mark),
      ink: inkSlot(row.ink),
      page: activePage(String(row.page ?? "")),
    });
  }
  return out.slice(0, 5);
}

export function addNookView(
  views: readonly NookView[],
  view: { id: string; name: string; tray: NookTray; query: string; reader: string; booth: string; mark: string; ink: string; page: string },
): NookView[] {
  const current = readNookViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    reader: readerSlot(view.reader),
    booth: boothSlot(view.booth),
    mark: markSlot(view.mark),
    ink: inkSlot(view.ink),
    page: activePage(view.page),
  }].slice(0, 5);
}

export function dropNookView(views: readonly NookView[], id: string): NookView[] {
  return readNookViews(views).filter((view) => view.id !== id);
}

function boltRaw(value: BoltValue): BoltMark {
  if (value === true || value === 1) return "free";
  if (value === false || value === 0) return "held";
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (text === "true" || text === "1" || text === "yes" || text === "free") return "free";
    if (text === "false" || text === "0" || text === "no" || text === "held") return "held";
    return "";
  }
  if (!value || typeof value !== "object") return "";
  if (BOLT_BLOCK.some((key) => key in value)) return "";
  if (!("withdrawalsEnabled" in value)) return "";
  return boltRaw(value.withdrawalsEnabled as BoltValue);
}

/**
 * Free, held, or unmarked.
 * A login flag, a trading flag, a name, a phone, and the other blocked fields are not a withdrawal bolt.
 * A missing flag stays unmarked and is not filled in.
 */
export function boltOf(value: BoltValue): BoltMark {
  return boltRaw(value);
}

function nameText(name: unknown): string {
  return clip(name, 80);
}

/**
 * Short is 1–4 letters. Mid is 5–12. Long is 13 or more.
 * A blank name stays unmarked.
 */
export function nameSpanOf(name: unknown): NameSpan {
  const text = nameText(name);
  if (!text) return "";
  if (text.length <= 4) return "short";
  if (text.length <= 12) return "mid";
  return "long";
}

/** A space splits the name into two words. One word stays solo. A blank name stays unmarked. */
export function nameMarkOf(name: unknown): NameMark {
  const text = nameText(name);
  if (!text) return "";
  return /\s/.test(text) ? "pair" : "solo";
}

export function boltLines(rows: readonly BoltRow[]): BoltLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const bolt = boltOf(row.bolt);
    map.set(bolt, (map.get(bolt) || 0) + 1);
  }
  const out: BoltLine[] = [];
  for (const bolt of ["", ...BOLTS]) {
    const count = map.get(bolt);
    if (count) out.push({ bolt, count });
  }
  return out;
}

export function namedBolts(rows: readonly BoltRow[]): string[] {
  return boltLines(rows).map((line) => line.bolt).filter(Boolean);
}

export function spanLines(rows: readonly BoltRow[]): SpanLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const span = nameSpanOf(row.label);
    map.set(span, (map.get(span) || 0) + 1);
  }
  const out: SpanLine[] = [];
  for (const span of ["", ...SPANS]) {
    const count = map.get(span);
    if (count) out.push({ span, count });
  }
  return out;
}

export function namedSpans(rows: readonly BoltRow[]): string[] {
  return spanLines(rows).map((line) => line.span).filter(Boolean);
}

export function markLines(rows: readonly BoltRow[]): MarkLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const mark = nameMarkOf(row.label);
    map.set(mark, (map.get(mark) || 0) + 1);
  }
  const out: MarkLine[] = [];
  for (const mark of ["", ...MARKS]) {
    const count = map.get(mark);
    if (count) out.push({ mark, count });
  }
  return out;
}

export function namedMarks(rows: readonly BoltRow[]): string[] {
  return markLines(rows).map((line) => line.mark).filter(Boolean);
}

/** The named bolt with the most loaded rows. A tie keeps free before held. An unmarked flag is not a lead. */
export function leadingBolt(rows: readonly BoltRow[]): string {
  const named = boltLines(rows).filter((line) => line.bolt);
  if (!named.length) return "";
  const order = (bolt: string) => BOLTS.indexOf(bolt as (typeof BOLTS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.bolt) - order(b.bolt))[0].bolt;
}

/** The name span with the most loaded rows. A tie keeps short, then mid, then long. A blank name is not a lead. */
export function leadingSpan(rows: readonly BoltRow[]): string {
  const named = spanLines(rows).filter((line) => line.span);
  if (!named.length) return "";
  const order = (span: string) => SPANS.indexOf(span as (typeof SPANS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.span) - order(b.span))[0].span;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function bltShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function boltToken(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "free" || text === "held" || text === "blank") return text;
  return "";
}

export function presentBolts(rows: readonly BoltRow[]): string[] {
  const out: string[] = [];
  for (const line of boltLines(rows)) {
    const token = line.bolt || "blank";
    if (!out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenBolts(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const bolt = boltToken(item);
    if (!bolt || !known.has(bolt) || out.includes(bolt)) continue;
    out.push(bolt);
  }
  return out;
}

export function toggleBolt(hidden: readonly string[], bolt: string, present: readonly string[]): string[] {
  const token = boltToken(bolt);
  if (!token || !present.includes(token)) return readHiddenBolts(hidden, present);
  const current = readHiddenBolts(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleBolts(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenBolts(hidden, present));
  return present.filter((bolt) => (showHidden ? gone.has(bolt) : !gone.has(bolt)));
}

/** "all" and "blank" stay. A bolt that is no longer loaded falls back to all. */
export function activeBolt(filter: string, bolts: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (BOLTS as readonly string[]).includes(filter) && bolts.includes(filter) ? filter : "all";
}

export function boltArg(filter: string): BoltMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (BOLTS as readonly string[]).includes(filter) ? (filter as BoltMark) : null;
}

/** "all" and "blank" stay. A span that is no longer loaded falls back to all. */
export function activeSpan(filter: string, spans: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SPANS as readonly string[]).includes(filter) && spans.includes(filter) ? filter : "all";
}

export function spanArg(filter: string): NameSpan | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (SPANS as readonly string[]).includes(filter) ? (filter as NameSpan) : null;
}

/** "all" and "blank" stay. A name mark that is no longer loaded falls back to all. */
export function activeNameMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (MARKS as readonly string[]).includes(filter) && marks.includes(filter) ? filter : "all";
}

export function nameMarkArg(filter: string): NameMark | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (MARKS as readonly string[]).includes(filter) ? (filter as NameMark) : null;
}

/** Search stays on the name. The bolt, the name span, and the word mark are not part of the query. */
export function visibleBoltCustomers<T extends BoltRow>(
  rows: readonly T[],
  bolt: BoltMark | null,
  span: NameSpan | null,
  mark: NameMark | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (bolt !== null && boltOf(row.bolt) !== bolt) return false;
    if (span !== null && nameSpanOf(row.label) !== span) return false;
    if (mark !== null && nameMarkOf(row.label) !== mark) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bolts, name spans, and word marks on this page. */
export function boltsCsv(rows: readonly BoltRow[]): string {
  const lines = ["kind,bolt,count"];
  for (const line of boltLines(rows)) lines.push(["bolt", csvCell(line.bolt), String(line.count)].join(","));
  for (const line of spanLines(rows)) lines.push(["span", csvCell(line.span), String(line.count)].join(","));
  for (const line of markLines(rows)) lines.push(["mark", csvCell(line.mark), String(line.count)].join(","));
  return lines.join("\n");
}
