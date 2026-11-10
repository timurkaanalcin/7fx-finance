/**
 * Local bindery stitches for follow-up review, and campaign cloths already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_bindery_stitch (
 *   id text primary key,
 *   note text not null,
 *   binder text not null default '',
 *   stitch integer,
 *   thread text not null default '',
 *   ticket text not null default '',
 *   tension text not null default '',
 *   pinned boolean not null default false,
 *   basted boolean not null default false,
 *   bound boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_cloth_hide (
 *   cloth text primary key
 * );
 */

export const STITCH_KEY = "crmv4-bindery-stitches";
export const STITCH_VIEW_KEY = "crmv4-bindery-views";
export const CLOTH_KEY = "crmv4-cloth-hide";

export type StitchTension = "blank" | "slack" | "even" | "taut";

export type StitchThread = "blank" | "silk" | "linen" | "cotton" | "wool";

export type StitchTray = "open" | "basted" | "bound";

export type BandPick = "blank" | "hem" | "seam" | "panel" | "cuff" | "near" | "far";

export type StitchCard = {
  id: string;
  text: string;
  binder: string;
  stitch: number | null;
  thread: string;
  ticket: string;
  tension: string;
  pinned: boolean;
  basted: boolean;
  bound: boolean;
  audit: string;
};

export type StitchView = {
  id: string;
  name: string;
  tray: StitchTray;
  query: string;
  binder: string;
  thread: string;
  ticket: string;
  tension: string;
  stitch: string;
};

export type StitchCounts = {
  open: number;
  basted: number;
  bound: number;
  pinned: number;
  late: number;
};

export type ClothLength = "" | "brief" | "name" | "long";

export type ClothGlyph = "" | "letter" | "digit" | "mark";

export type ClothFold = "" | "plain" | "split" | "coded";

export type ClothValue =
  | {
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
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type ClothRow = { campaign?: ClothValue; label?: string | null };

export type LengthLine = { length: string; count: number };

export type GlyphLine = { glyph: string; count: number };

export type FoldLine = { fold: string; count: number };

export type ClothLine = { cloth: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "baste", "free", "bind", "unbind"] as const;

const THREADS = ["silk", "linen", "cotton", "wool"] as const;

const TENSIONS = ["slack", "even", "taut"] as const;

const TENSION_ORDER = ["", "slack", "even", "taut"] as const;

const PICKS = ["blank", "hem", "seam", "panel", "cuff", "near", "far"] as const;

const BANDS = ["hem", "seam", "panel", "cuff"] as const;

const LENGTHS = ["brief", "name", "long"] as const;

const GLYPHS = ["", "letter", "digit", "mark"] as const;

const FOLDS = ["", "plain", "split", "coded"] as const;

const CLOTH_BLOCK = ["lastLoginAt", "lastSeenAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StitchTray {
  return raw === "basted" || raw === "bound" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function threadName(raw: unknown): Exclude<StitchThread, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (THREADS as readonly string[]).includes(text) ? (text as Exclude<StitchThread, "blank">) : "";
}

function tensionName(raw: unknown): Exclude<StitchTension, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TENSIONS as readonly string[]).includes(text) ? (text as Exclude<StitchTension, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function stitchText(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank binder stays blank. It is not filled in. */
export function binderLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank ticket stays blank. It is not filled in. */
export function stitchTicket(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A stitch is 1 through 12.
 * A blank value stays unset. 0 and 13 are not stitches.
 * A leading zero is still a stitch: 01 is 1, and 09 is 9.
 * 00 is not a stitch.
 */
export function stitchOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Silk, linen, cotton, wool, or blank. Anything else is blank. */
export function threadOf(raw: unknown): StitchThread {
  return threadName(raw) || "blank";
}

/** Slack, even, taut, or blank. Anything else is blank. */
export function tensionOf(raw: unknown): StitchTension {
  return tensionName(raw) || "blank";
}

/** Hem is 1–3. Seam is 4–6. Panel is 7–9. Cuff is 10–12. An unset stitch is blank. */
export function bandOf(stitch: unknown): "blank" | "hem" | "seam" | "panel" | "cuff" {
  const count = stitchOf(stitch);
  if (count === null) return "blank";
  if (count <= 3) return "hem";
  if (count <= 6) return "seam";
  if (count <= 9) return "panel";
  return "cuff";
}

/** Near is 1–6. Far is 7–12. An unset stitch is blank. */
export function reachOf(stitch: unknown): "blank" | "near" | "far" {
  const count = stitchOf(stitch);
  if (count === null) return "blank";
  return count <= 6 ? "near" : "far";
}

/** The typed stitch minus the slip stitch. A positive gap is past the stitch. */
export function stitchGap(stitch: unknown, desk: unknown): number | null {
  const from = stitchOf(stitch);
  const at = stitchOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readStitches(raw: unknown): StitchCard[] {
  if (!Array.isArray(raw)) return [];
  const out: StitchCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StitchCard>;
    const id = String(row.id || "").trim();
    const text = stitchText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      binder: binderLabel(row.binder),
      stitch: stitchOf(row.stitch),
      thread: threadName(row.thread),
      ticket: stitchTicket(row.ticket),
      tension: tensionName(row.tension),
      pinned: row.pinned === true,
      basted: row.basted === true,
      bound: row.bound === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addStitch(
  cards: readonly StitchCard[],
  card: { id: string; text: string; binder?: string; stitch?: unknown; thread?: string; ticket?: string; tension?: string },
): StitchCard[] {
  const current = readStitches(cards);
  const id = String(card.id || "").trim();
  const text = stitchText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: StitchCard = {
    id,
    text,
    binder: binderLabel(card.binder),
    stitch: stitchOf(card.stitch),
    thread: threadName(card.thread),
    ticket: stitchTicket(card.ticket),
    tension: tensionName(card.tension),
    pinned: false,
    basted: false,
    bound: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

export function stepStitchTension(cards: readonly StitchCard[], id: string, dir: 1 | -1): StitchCard[] {
  return readStitches(cards).map((card) => {
    if (card.id !== id) return card;
    const at = TENSION_ORDER.indexOf(card.tension as (typeof TENSION_ORDER)[number]);
    const next = TENSION_ORDER[Math.min(TENSIONS.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.tension) return card;
    return { ...card, tension: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setStitchPinned(cards: readonly StitchCard[], id: string, pinned: boolean): StitchCard[] {
  return readStitches(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setStitchBasted(cards: readonly StitchCard[], id: string, basted: boolean): StitchCard[] {
  return readStitches(cards).map((card) => (card.id === id ? { ...card, basted, audit: basted ? "baste" : "free" } : card));
}

export function setStitchBound(cards: readonly StitchCard[], id: string, bound: boolean): StitchCard[] {
  return readStitches(cards).map((card) => (card.id === id ? { ...card, bound, audit: bound ? "bind" : "unbind" } : card));
}

/** A blank edit is left out. A duplicate of another stitch is left out. */
export function editStitch(cards: readonly StitchCard[], id: string, text: string): StitchCard[] {
  const current = readStitches(cards);
  const next = stitchText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkStitchPinned(cards: readonly StitchCard[], ids: readonly string[], pinned: boolean): StitchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readStitches(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkStitchBound(cards: readonly StitchCard[], ids: readonly string[], bound: boolean): StitchCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readStitches(cards).map((card) => (want.has(card.id) ? { ...card, bound, audit: bound ? "bind" : "unbind" } : card));
}

export function resetStitches(): StitchCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function stitchCopy(raw: unknown): string {
  return stitchText(raw);
}

function inTray(card: StitchCard, tray: StitchTray): boolean {
  if (tray === "bound") return card.bound;
  if (tray === "basted") return card.basted && !card.bound;
  return !card.basted && !card.bound;
}

function stitchHit(stitch: number | null, exact: number | null, band: BandPick | null): boolean {
  if (exact !== null) return stitch === exact;
  if (band === null) return true;
  if (band === "blank") return stitch === null;
  if (band === "near" || band === "far") return reachOf(stitch) === band;
  return bandOf(stitch) === band;
}

function tensionScore(tension: string): number {
  if (tension === "taut") return 3;
  if (tension === "even") return 2;
  if (tension === "slack") return 1;
  return 0;
}

function slackLate(card: StitchCard, desk: unknown): boolean {
  const gap = stitchGap(card.stitch, desk);
  return gap !== null && gap > 0 && card.tension === "slack" && inTray(card, "open");
}

/** Search stays on the note. The binder, the stitch, the thread, the ticket, and the tension are not part of the query. */
export function visibleStitches(
  cards: readonly StitchCard[],
  tray: StitchTray,
  query: string,
  binder: string | null,
  thread: StitchThread | null,
  ticket: string | null,
  tension: StitchTension | null,
  exact: number | null,
  band: BandPick | null,
  tautOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): StitchCard[] {
  const text = query.trim().toLowerCase();
  const wantBinder = binder === null ? null : binderLabel(binder);
  const wantTicket = ticket === null ? null : stitchTicket(ticket);
  return readStitches(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (tautOnly && card.tension !== "taut") return false;
      if (wantBinder !== null && binderLabel(card.binder) !== wantBinder) return false;
      if (thread !== null && threadOf(card.thread) !== thread) return false;
      if (wantTicket !== null && stitchTicket(card.ticket) !== wantTicket) return false;
      if (tension !== null && tensionOf(card.tension) !== tension) return false;
      if (!stitchHit(card.stitch, exact, band)) return false;
      if (lateOnly && !slackLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (tensionScore(a.tension) !== tensionScore(b.tension)) return tensionScore(b.tension) - tensionScore(a.tension);
      return a.text.localeCompare(b.text);
    });
}

/** The stitch orders the desk. An unset stitch stays at the end. Search stays on the note. */
export function stitchTimeline(cards: readonly StitchCard[], query: string): StitchCard[] {
  const text = query.trim().toLowerCase();
  return readStitches(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.stitch === null && b.stitch !== null) return 1;
      if (a.stitch !== null && b.stitch === null) return -1;
      if (a.stitch !== null && b.stitch !== null && a.stitch !== b.stitch) return a.stitch - b.stitch;
      return a.text.localeCompare(b.text);
    });
}

export function stitchCounts(cards: readonly StitchCard[], desk: unknown): StitchCounts {
  const rows = readStitches(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    basted: rows.filter((card) => inTray(card, "basted")).length,
    bound: rows.filter((card) => inTray(card, "bound")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => slackLate(card, desk)).length,
  };
}

/** Share of the saved stitches. A zero total stays at zero. */
export function stitchShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function stitchBinders(cards: readonly StitchCard[]): string[] {
  const out: string[] = [];
  for (const card of readStitches(cards)) {
    if (card.binder && !out.includes(card.binder)) out.push(card.binder);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function stitchTickets(cards: readonly StitchCard[]): string[] {
  const out: string[] = [];
  for (const card of readStitches(cards)) {
    if (card.ticket && !out.includes(card.ticket)) out.push(card.ticket);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function stitchThreads(cards: readonly StitchCard[]): Exclude<StitchThread, "blank">[] {
  const seen = new Set<string>();
  for (const card of readStitches(cards)) if (card.thread) seen.add(card.thread);
  return THREADS.filter((thread) => seen.has(thread));
}

export function stitchTensions(cards: readonly StitchCard[]): Exclude<StitchTension, "blank">[] {
  const seen = new Set<string>();
  for (const card of readStitches(cards)) if (card.tension) seen.add(card.tension);
  return TENSIONS.filter((tension) => seen.has(tension));
}

/** Four bands. Index 0 is hem. Index 3 is cuff. */
export function bandCounts(cards: readonly StitchCard[]): number[] {
  const rows = readStitches(cards);
  return BANDS.map((band) => rows.filter((card) => bandOf(card.stitch) === band).length);
}

/** "all" and "blank" stay. A binder that is no longer on a stitch falls back to all. */
export function activeBinder(filter: string, binders: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const binder = binderLabel(filter);
  return binder && binders.includes(binder) ? binder : "all";
}

export function binderArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return binderLabel(filter);
}

/** "all" and "blank" stay. A thread that is no longer on a stitch falls back to all. */
export function activeThread(filter: string, threads: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const thread = threadName(filter);
  return thread && threads.includes(thread) ? thread : "all";
}

export function threadArg(filter: string): StitchThread | null {
  if (filter === "blank") return "blank";
  return threadName(filter) || null;
}

/** "all" and "blank" stay. A ticket that is no longer on a stitch falls back to all. */
export function activeTicket(filter: string, tickets: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ticket = stitchTicket(filter);
  return ticket && tickets.includes(ticket) ? ticket : "all";
}

export function ticketArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stitchTicket(filter);
}

/** "all" and "blank" stay. A tension that is no longer on a stitch falls back to all. */
export function activeTension(filter: string, tensions: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tension = tensionName(filter);
  return tension && tensions.includes(tension) ? tension : "all";
}

export function tensionArg(filter: string): StitchTension | null {
  if (filter === "blank") return "blank";
  return tensionName(filter) || null;
}

/** All, blank, the four bands, the two reaches, and the stitches 1 through 12 stay. Anything else is all. */
export function activeStitch(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const stitch = stitchOf(filter);
  return stitch === null ? "all" : String(stitch);
}

export function stitchArg(filter: string): { exact: number | null; band: BandPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as BandPick };
  const stitch = stitchOf(filter);
  return stitch === null ? { exact: null, band: null } : { exact: stitch, band: null };
}

/** Other stitches with the same thread and the same ticket. A blank thread or a blank ticket clashes with nothing. */
export function stitchClashIds(cards: readonly StitchCard[], id: string): string[] {
  const rows = readStitches(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.thread || !card.ticket) return [];
  return rows
    .filter((item) => item.id !== id && item.thread === card.thread && item.ticket === card.ticket)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved stitches share a thread and a ticket with another stitch. */
export function clashStitchCount(cards: readonly StitchCard[]): number {
  const rows = readStitches(cards);
  return rows.filter((card) => stitchClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open stitch at or after the stitch you type, skipping taut.
 * After the last stitch, the desk wraps to the earliest open stitch that is not taut.
 */
export function nextStitch(cards: readonly StitchCard[], desk: unknown): string {
  const now = stitchOf(desk);
  if (now === null) return "";
  const waiting = readStitches(cards).filter((card) => inTray(card, "open") && card.stitch !== null && card.tension !== "taut");
  if (!waiting.length) return "";
  const byStitch = (a: StitchCard, b: StitchCard) => (a.stitch ?? 0) - (b.stitch ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.stitch ?? 0) >= now).sort(byStitch);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byStitch)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the stitches saved in this browser. The gap uses the stitch you pass. */
export function stitchesCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,binder,stitch,thread,ticket,tension,band,pinned,basted,bound,gap,audit"];
  for (const card of readStitches(raw)) {
    const gap = stitchGap(card.stitch, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.binder),
      card.stitch === null ? "" : String(card.stitch),
      card.thread,
      csvCell(card.ticket),
      card.tension,
      bandOf(card.stitch),
      card.pinned ? "1" : "0",
      card.basted ? "1" : "0",
      card.bound ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function binderSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return binderLabel(raw) || "all";
}

function threadSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return threadName(raw) || "all";
}

function ticketSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stitchTicket(raw) || "all";
}

function tensionSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tensionName(raw) || "all";
}

export function readStitchViews(raw: unknown): StitchView[] {
  if (!Array.isArray(raw)) return [];
  const out: StitchView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StitchView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 48),
      binder: binderSlot(row.binder),
      thread: threadSlot(row.thread),
      ticket: ticketSlot(row.ticket),
      tension: tensionSlot(row.tension),
      stitch: activeStitch(String(row.stitch ?? "")),
    });
  }
  return out.slice(0, 4);
}

export function addStitchView(
  views: readonly StitchView[],
  view: { id: string; name: string; tray: StitchTray; query: string; binder: string; thread: string; ticket: string; tension: string; stitch: string },
): StitchView[] {
  const current = readStitchViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 48),
    binder: binderSlot(view.binder),
    thread: threadSlot(view.thread),
    ticket: ticketSlot(view.ticket),
    tension: tensionSlot(view.tension),
    stitch: activeStitch(view.stitch),
  }].slice(0, 4);
}

export function dropStitchView(views: readonly StitchView[], id: string): StitchView[] {
  return readStitchViews(views).filter((view) => view.id !== id);
}

function clothRaw(value: ClothValue): string {
  if (typeof value === "string") return clip(value, 24);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (CLOTH_BLOCK.some((key) => key in value)) return "";
  return clip(value.campaign, 24);
}

/** The campaign already on the row. A login, a name, an email, and the other blocked fields are not a cloth. A missing campaign stays blank. */
export function clothName(value: ClothValue): string {
  return clothRaw(value);
}

/**
 * A length from the campaign field, or blank.
 * A last login, a last-seen time, a timezone, a language, a country, a name, an email, a phone, a desk,
 * an address, a city, a given name, a family name, a last country, and a created time are not a cloth.
 * A missing campaign stays unmarked and is not filled in.
 */
export function assignedCloth(value: ClothValue): string {
  return lengthOf(value);
}

/** Brief is 1–4 letters. Name is 5–12. Long is 13 or more. An unmarked campaign stays blank. */
export function lengthOf(value: ClothValue): ClothLength {
  const text = clothRaw(value);
  if (!text) return "";
  if (text.length <= 4) return "brief";
  if (text.length <= 12) return "name";
  return "long";
}

function codePoint(ch: string): number {
  return ch.codePointAt(0) || 0;
}

/** Latin, Greek, Cyrillic, and Arabic letters. ASCII digits stay digits. */
function letterStart(ch: string): boolean {
  if (/[A-Za-z]/.test(ch)) return true;
  const code = codePoint(ch);
  return (code >= 0x00c0 && code <= 0x024f) || (code >= 0x0370 && code <= 0x03ff) || (code >= 0x0400 && code <= 0x052f) || (code >= 0x0600 && code <= 0x06ff);
}

function digitStart(ch: string): boolean {
  return /[0-9]/.test(ch);
}

/** Letter starts with a letter. Digit starts with a digit. Mark is anything else. An unmarked campaign stays blank. */
export function glyphOf(value: ClothValue): ClothGlyph {
  const text = clothRaw(value);
  if (!text) return "";
  const first = text[0] || "";
  if (letterStart(first)) return "letter";
  if (digitStart(first)) return "digit";
  return "mark";
}

/** Coded holds a digit. Split holds a space or a hyphen and no digit. Plain is the rest. An unmarked campaign stays blank. */
export function foldOf(value: ClothValue): ClothFold {
  const text = clothRaw(value);
  if (!text) return "";
  if (/[0-9]/.test(text)) return "coded";
  if (/[\s-]/.test(text)) return "split";
  return "plain";
}

export function lengthLines(rows: readonly ClothRow[]): LengthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const length = lengthOf(row.campaign);
    map.set(length, (map.get(length) || 0) + 1);
  }
  const out: LengthLine[] = [];
  for (const length of ["", ...LENGTHS]) {
    const count = map.get(length);
    if (count) out.push({ length, count });
  }
  return out;
}

export function namedLengths(rows: readonly ClothRow[]): string[] {
  return lengthLines(rows).map((line) => line.length).filter(Boolean);
}

export function glyphLines(rows: readonly ClothRow[]): GlyphLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const glyph = glyphOf(row.campaign);
    map.set(glyph, (map.get(glyph) || 0) + 1);
  }
  const out: GlyphLine[] = [];
  for (const glyph of GLYPHS) {
    const count = map.get(glyph);
    if (count) out.push({ glyph, count });
  }
  return out;
}

export function namedGlyphs(rows: readonly ClothRow[]): string[] {
  return glyphLines(rows).map((line) => line.glyph).filter(Boolean);
}

export function foldLines(rows: readonly ClothRow[]): FoldLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const fold = foldOf(row.campaign);
    map.set(fold, (map.get(fold) || 0) + 1);
  }
  const out: FoldLine[] = [];
  for (const fold of FOLDS) {
    const count = map.get(fold);
    if (count) out.push({ fold, count });
  }
  return out;
}

export function namedFolds(rows: readonly ClothRow[]): string[] {
  return foldLines(rows).map((line) => line.fold).filter(Boolean);
}

export function clothLines(rows: readonly ClothRow[]): ClothLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const cloth = clothName(row.campaign);
    map.set(cloth, (map.get(cloth) || 0) + 1);
  }
  const out: ClothLine[] = [];
  const names: string[] = [];
  map.forEach((_count, cloth) => {
    if (cloth) names.push(cloth);
  });
  names.sort((a, b) => a.localeCompare(b));
  if (map.get("")) out.push({ cloth: "", count: map.get("") || 0 });
  for (const cloth of names) out.push({ cloth, count: map.get(cloth) || 0 });
  return out;
}

export function namedCloths(rows: readonly ClothRow[]): string[] {
  return clothLines(rows).map((line) => line.cloth).filter(Boolean);
}

/** The named campaign with the most loaded rows. A tie keeps the earlier campaign. A blank campaign is not a lead. */
export function leadingCloth(rows: readonly ClothRow[]): string {
  const named = clothLines(rows).filter((line) => line.cloth);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.cloth.localeCompare(b.cloth))[0].cloth;
}

/** The length with the most loaded rows. A tie keeps the earlier length. An unmarked campaign is not a lead. */
export function leadingLength(rows: readonly ClothRow[]): string {
  const named = lengthLines(rows).filter((line) => line.length);
  if (!named.length) return "";
  const order = (length: string) => LENGTHS.indexOf(length as (typeof LENGTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.length) - order(b.length))[0].length;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function clothShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenCloths(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 24);
    if (!mark || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleCloth(hidden: readonly string[], cloth: string, present: readonly string[]): string[] {
  const mark = clothName(cloth);
  if (!mark || !present.includes(mark)) return readHiddenCloths(hidden, present);
  const current = readHiddenCloths(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleCloths(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCloths(hidden, present));
  return present.filter((cloth) => (showHidden ? gone.has(cloth) : !gone.has(cloth)));
}

/** "all" and "blank" stay. A campaign that is no longer loaded falls back to all. */
export function activeCloth(filter: string, cloths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cloth = clothName(filter);
  return cloth && cloths.includes(cloth) ? cloth : "all";
}

export function clothArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const cloth = clothName(filter);
  return cloth || null;
}

/** "all" and "blank" stay. A length that is no longer loaded falls back to all. */
export function activeLength(filter: string, lengths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (LENGTHS as readonly string[]).includes(filter) && lengths.includes(filter) ? filter : "all";
}

export function lengthArg(filter: string): ClothLength | null {
  if (filter === "blank") return "";
  if ((LENGTHS as readonly string[]).includes(filter)) return filter as ClothLength;
  return null;
}

/** "all" and "blank" stay. A glyph that is no longer loaded falls back to all. */
export function activeGlyph(filter: string, glyphs: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (GLYPHS as readonly string[]).includes(filter) && glyphs.includes(filter) ? filter : "all";
}

export function glyphArg(filter: string): ClothGlyph | null {
  if (filter === "blank") return "";
  if ((GLYPHS as readonly string[]).includes(filter) && filter !== "") return filter as ClothGlyph;
  return null;
}

/** "all" and "blank" stay. A fold that is no longer loaded falls back to all. */
export function activeFold(filter: string, folds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (FOLDS as readonly string[]).includes(filter) && folds.includes(filter) ? filter : "all";
}

export function foldArg(filter: string): ClothFold | null {
  if (filter === "blank") return "";
  if ((FOLDS as readonly string[]).includes(filter) && filter !== "") return filter as ClothFold;
  return null;
}

/** Search stays on the name. The campaign is not part of the query. */
export function visibleClothCustomers<T extends ClothRow>(
  rows: readonly T[],
  length: ClothLength | null,
  glyph: ClothGlyph | null,
  fold: ClothFold | null,
  cloth: string | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (length !== null && lengthOf(row.campaign) !== length) return false;
    if (glyph !== null && glyphOf(row.campaign) !== glyph) return false;
    if (fold !== null && foldOf(row.campaign) !== fold) return false;
    if (cloth !== null && clothName(row.campaign) !== cloth) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the lengths, glyphs, folds, and campaigns on this page. */
export function clothsCsv(rows: readonly ClothRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of lengthLines(rows)) lines.push(["length", csvCell(line.length), String(line.count)].join(","));
  for (const line of glyphLines(rows)) lines.push(["glyph", line.glyph, String(line.count)].join(","));
  for (const line of foldLines(rows)) lines.push(["fold", line.fold, String(line.count)].join(","));
  for (const line of clothLines(rows)) lines.push(["cloth", csvCell(line.cloth), String(line.count)].join(","));
  return lines.join("\n");
}
