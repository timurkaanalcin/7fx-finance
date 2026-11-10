/**
 * Local vestry chits for the day's appointments, and the login-block time already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_vestry_chit (
 *   id text primary key,
 *   subject text not null,
 *   aside text not null default '',
 *   clerk text not null default '',
 *   bell integer,
 *   aisle text not null default '',
 *   mark text not null default '',
 *   chime text not null default '',
 *   peg integer,
 *   span integer,
 *   pinned boolean not null default false,
 *   seated boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_shutter_hide (
 *   watch text primary key
 * );
 */

export const CHIT_KEY = "crmv4-vestry-chits";
export const CHIT_VIEW_KEY = "crmv4-vestry-views";
export const SHUTTER_KEY = "crmv4-shutter-hide";

export type ChitChime = "blank" | "hush" | "tone" | "peal";

export type ChitAisle = "blank" | "north" | "south" | "west" | "east";

export type ChitTray = "open" | "seated" | "closed";

export type BellPick = "blank" | "night" | "morning" | "afternoon" | "evening" | "edge" | "body";

export type Chit = {
  id: string;
  subject: string;
  aside: string;
  clerk: string;
  bell: number | null;
  aisle: string;
  mark: string;
  chime: string;
  peg: number | null;
  span: number | null;
  pinned: boolean;
  seated: boolean;
  closed: boolean;
  audit: string;
};

export type ChitView = {
  id: string;
  name: string;
  tray: ChitTray;
  query: string;
  clerk: string;
  aisle: string;
  mark: string;
  chime: string;
  bell: string;
  peg: string;
  span: string;
};

export type ChitCounts = {
  open: number;
  seated: number;
  closed: number;
  pinned: number;
  edge: number;
  late: number;
};

export type ShutterState = "" | "set" | "clear";

export type ShutterWatch = "" | "night" | "morning" | "afternoon" | "evening";

export type ShutterPhase = "" | "early" | "middle" | "late";

export type ShutterValue =
  | {
      loginBlockedAt?: unknown;
      loginBlockedMessage?: unknown;
      loginEnabled?: unknown;
      tradingEnabled?: unknown;
      withdrawalsEnabled?: unknown;
      isTest?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      country?: unknown;
      desk?: unknown;
    }
  | string
  | null
  | undefined;

export type ShutterRow = { at?: ShutterValue; label?: string | null };

export type WatchLine = { watch: string; count: number };

export type PhaseLine = { phase: string; count: number };

const AUDITS = ["save", "edit", "chime", "pin", "unpin", "seat", "rise", "close", "reopen", "aisle"] as const;

const AISLES = ["north", "south", "west", "east"] as const;

const CHIMES = ["hush", "tone", "peal"] as const;

const CHIME_ORDER = ["", "hush", "tone", "peal"] as const;

const PICKS = ["blank", "night", "morning", "afternoon", "evening", "edge", "body"] as const;

const WATCHES = ["night", "morning", "afternoon", "evening"] as const;

const EDGE = new Set([0, 1, 22, 23]);

const PEGS = [1, 2, 3] as const;

const SPANS = [15, 30, 45, 60] as const;

const STATES = ["set", "clear"] as const;

const PHASES = ["early", "middle", "late"] as const;

const SHUTTER_BLOCK = [
  "loginBlockedMessage",
  "loginEnabled",
  "tradingEnabled",
  "withdrawalsEnabled",
  "isTest",
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

function trayOf(raw: unknown): ChitTray {
  return raw === "seated" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function aisleName(raw: unknown): Exclude<ChitAisle, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (AISLES as readonly string[]).includes(text) ? (text as Exclude<ChitAisle, "blank">) : "";
}

function chimeName(raw: unknown): Exclude<ChitChime, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CHIMES as readonly string[]).includes(text) ? (text as Exclude<ChitChime, "blank">) : "";
}

/** A blank subject is left out. The saved subject stays short. */
export function chitLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank aside stays blank. It is not filled in. */
export function chitAside(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank mark stays blank. It is not filled in. */
export function chitMark(raw: unknown): string {
  return clip(raw, 3);
}

/**
 * A bell is an hour from 0 through 23.
 * A blank value stays unset. 24 is not a bell.
 * A leading zero is the same hour: 00 is 0, and 09 is 9.
 */
export function bellOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 23) return raw;
  if (typeof raw === "string" && /^(?:[0-9]|0[0-9]|1[0-9]|2[0-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A peg is an integer from 1 through 3.
 * A blank value stays unset. 0 and 4 are not pegs.
 * A leading zero is the same peg: 01 is 1.
 */
export function pegOf(raw: unknown): number | null {
  if (typeof raw === "number" && (PEGS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-3]|0[1-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A span is 15, 30, 45, or 60 minutes. A blank value stays unset. */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:15|30|45|60)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** North, south, west, east, or blank. Anything else is blank. */
export function aisleOf(raw: unknown): ChitAisle {
  return aisleName(raw) || "blank";
}

/** Hush, tone, peal, or blank. Anything else is blank. */
export function chimeOf(raw: unknown): ChitChime {
  return chimeName(raw) || "blank";
}

/** Night is 0–5. Morning is 6–11. Afternoon is 12–17. Evening is 18–23. An unset bell is blank. */
export function watchOf(bell: unknown): "blank" | "night" | "morning" | "afternoon" | "evening" {
  const value = bellOf(bell);
  if (value === null) return "blank";
  if (value <= 5) return "night";
  if (value <= 11) return "morning";
  if (value <= 17) return "afternoon";
  return "evening";
}

/** Edge hours are 0, 1, 22, and 23. An unset bell is not an edge. */
export function edgeBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && EDGE.has(value);
}

/** Body hours are 2 through 21. An unset bell is not body. */
export function bodyBell(bell: unknown): boolean {
  const value = bellOf(bell);
  return value !== null && !EDGE.has(value);
}

/**
 * The shortest signed step from the chit hour to the typed hour.
 * The day wraps at 24. A step of 12 stays positive. A step of -12 becomes 12.
 * A positive step means the typed hour is ahead of the chit.
 */
export function bellGap(bell: unknown, desk: unknown): number | null {
  const from = bellOf(bell);
  const at = bellOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 12) diff -= 24;
  if (diff < -11) diff += 24;
  return diff;
}

export function readChits(raw: unknown): Chit[] {
  if (!Array.isArray(raw)) return [];
  const out: Chit[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chit>;
    const id = String(row.id || "").trim();
    const subject = chitLine(row.subject);
    if (!id || !subject || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      subject,
      aside: chitAside(row.aside),
      clerk: clerkLabel(row.clerk),
      bell: bellOf(row.bell),
      aisle: aisleName(row.aisle),
      mark: chitMark(row.mark),
      chime: chimeName(row.chime),
      peg: pegOf(row.peg),
      span: spanOf(row.span),
      pinned: row.pinned === true,
      seated: row.seated === true,
      closed: row.closed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 10);
}

export function addChit(
  cards: readonly Chit[],
  card: {
    id: string;
    subject: string;
    aside?: string;
    clerk?: string;
    bell?: unknown;
    aisle?: string;
    mark?: string;
    chime?: string;
    peg?: unknown;
    span?: unknown;
  },
): Chit[] {
  const current = readChits(cards);
  const id = String(card.id || "").trim();
  const subject = chitLine(card.subject);
  if (!id || !subject || current.some((item) => item.id === id || item.subject === subject)) return current;
  const next: Chit = {
    id,
    subject,
    aside: chitAside(card.aside),
    clerk: clerkLabel(card.clerk),
    bell: bellOf(card.bell),
    aisle: aisleName(card.aisle),
    mark: chitMark(card.mark),
    chime: chimeName(card.chime),
    peg: pegOf(card.peg),
    span: spanOf(card.span),
    pinned: false,
    seated: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 10);
}

/** Blank becomes hush. Hush becomes tone, tone becomes peal, and peal returns to hush. */
export function cycleChime(cards: readonly Chit[], id: string): Chit[] {
  return readChits(cards).map((card) => {
    if (card.id !== id) return card;
    const at = CHIME_ORDER.indexOf(card.chime as (typeof CHIME_ORDER)[number]);
    const next = at < 0 || at >= CHIMES.length ? CHIMES[0] : CHIMES[at % CHIMES.length];
    if (!next || next === card.chime) return card;
    return { ...card, chime: next, audit: "chime" };
  });
}

export function setChitPin(cards: readonly Chit[], id: string, pinned: boolean): Chit[] {
  return readChits(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setChitSeat(cards: readonly Chit[], id: string, seated: boolean): Chit[] {
  return readChits(cards).map((card) => (card.id === id ? { ...card, seated, audit: seated ? "seat" : "rise" } : card));
}

export function setChitClosed(cards: readonly Chit[], id: string, closed: boolean): Chit[] {
  return readChits(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another subject is left out. */
export function editChit(cards: readonly Chit[], id: string, subject: string): Chit[] {
  const current = readChits(cards);
  const next = chitLine(subject);
  if (!next || current.some((card) => card.id !== id && card.subject === next)) return current;
  return current.map((card) => (card.id === id && card.subject !== next ? { ...card, subject: next, audit: "edit" } : card));
}

/** A blank aside is left out. The same aside is left as it is. */
export function editChitAside(cards: readonly Chit[], id: string, aside: string): Chit[] {
  const current = readChits(cards);
  const next = chitAside(aside);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.aside !== next ? { ...card, aside: next, audit: "edit" } : card));
}

export function bulkChitPin(cards: readonly Chit[], ids: readonly string[], pinned: boolean): Chit[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readChits(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkChitClose(cards: readonly Chit[], ids: readonly string[], closed: boolean): Chit[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readChits(cards).map((card) => (want.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank or unknown aisle is left out. A chit already in that aisle is left as it is. */
export function bulkChitAisle(cards: readonly Chit[], ids: readonly string[], aisle: string): Chit[] {
  const name = aisleName(aisle);
  const current = readChits(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.aisle !== name ? { ...card, aisle: name, audit: "aisle" } : card));
}

export function resetChits(): Chit[] {
  return [];
}

/** Copy uses the subject. A blank subject copies nothing. */
export function chitCopy(raw: unknown): string {
  return chitLine(raw);
}

function inTray(card: Chit, tray: ChitTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "seated") return card.seated && !card.closed;
  return !card.seated && !card.closed;
}

function bellHit(bell: number | null, exact: number | null, pick: BellPick | null): boolean {
  if (exact !== null) return bell === exact;
  if (pick === null) return true;
  if (pick === "blank") return bell === null;
  if (pick === "edge") return edgeBell(bell);
  if (pick === "body") return bodyBell(bell);
  return watchOf(bell) === pick;
}

function chimeScore(chime: string): number {
  if (chime === "peal") return 3;
  if (chime === "tone") return 2;
  if (chime === "hush") return 1;
  return 0;
}

function waitingEdge(card: Chit): boolean {
  return edgeBell(card.bell) && inTray(card, "open");
}

function haystack(card: Chit): string {
  return `${card.subject}\n${card.aside}`.toLowerCase();
}

/** An open chit is late when the desk hour is more than four hours ahead. */
export function lateChit(card: Chit, desk: unknown): boolean {
  const gap = bellGap(card.bell, desk);
  return inTray(card, "open") && gap !== null && gap > 4;
}

/** Search matches the subject and the aside. The clerk, the hour, the aisle, and the chime are not part of the query. */
export function visibleChits(
  cards: readonly Chit[],
  tray: ChitTray,
  query: string,
  clerk: string | null,
  aisle: ChitAisle | null,
  mark: string | null,
  chime: ChitChime | null,
  exact: number | null,
  pick: BellPick | null,
  peg: number | "blank" | null,
  span: number | "blank" | null,
  pealOnly: boolean,
  edgeOnly: boolean,
): Chit[] {
  const text = query.trim().toLowerCase();
  const wantClerk = clerk === null ? null : clerkLabel(clerk);
  const wantMark = mark === null ? null : chitMark(mark);
  return readChits(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (pealOnly && card.chime !== "peal") return false;
      if (wantClerk !== null && clerkLabel(card.clerk) !== wantClerk) return false;
      if (aisle !== null && aisleOf(card.aisle) !== aisle) return false;
      if (wantMark !== null && chitMark(card.mark) !== wantMark) return false;
      if (chime !== null && chimeOf(card.chime) !== chime) return false;
      if (!bellHit(card.bell, exact, pick)) return false;
      if (peg === "blank" && card.peg !== null) return false;
      if (typeof peg === "number" && card.peg !== peg) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (edgeOnly && !waitingEdge(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (chimeScore(a.chime) !== chimeScore(b.chime)) return chimeScore(b.chime) - chimeScore(a.chime);
      return a.subject.localeCompare(b.subject);
    });
}

/** The hour orders the day. An unset hour stays at the end. Search matches the subject and the aside. */
export function chitTimeline(cards: readonly Chit[], query: string): Chit[] {
  const text = query.trim().toLowerCase();
  return readChits(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.bell === null && b.bell !== null) return 1;
      if (a.bell !== null && b.bell === null) return -1;
      if (a.bell !== null && b.bell !== null && a.bell !== b.bell) return a.bell - b.bell;
      return a.subject.localeCompare(b.subject);
    });
}

export function chitCounts(cards: readonly Chit[], desk: unknown): ChitCounts {
  const rows = readChits(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    seated: rows.filter((card) => inTray(card, "seated")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    edge: rows.filter((card) => waitingEdge(card)).length,
    late: rows.filter((card) => lateChit(card, desk)).length,
  };
}

/** Share of the saved chits. A zero total stays at zero. */
export function chitShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function chitClerks(cards: readonly Chit[]): string[] {
  const out: string[] = [];
  for (const card of readChits(cards)) {
    if (card.clerk && !out.includes(card.clerk)) out.push(card.clerk);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function chitMarks(cards: readonly Chit[]): string[] {
  const out: string[] = [];
  for (const card of readChits(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function chitAisles(cards: readonly Chit[]): Exclude<ChitAisle, "blank">[] {
  const seen = new Set<string>();
  for (const card of readChits(cards)) if (card.aisle) seen.add(card.aisle);
  return AISLES.filter((aisle) => seen.has(aisle));
}

export function chitChimes(cards: readonly Chit[]): Exclude<ChitChime, "blank">[] {
  const seen = new Set<string>();
  for (const card of readChits(cards)) if (card.chime) seen.add(card.chime);
  return CHIMES.filter((chime) => seen.has(chime));
}

/** How many open chits a clerk still holds. A blank clerk is not a load. */
export function clerkLoad(cards: readonly Chit[], clerk: string): number {
  const name = clerkLabel(clerk);
  if (!name) return 0;
  return readChits(cards).filter((card) => card.clerk === name && inTray(card, "open")).length;
}

/** Four watches. Index 0 is night. Index 3 is evening. */
export function watchCounts(cards: readonly Chit[]): number[] {
  const rows = readChits(cards);
  return WATCHES.map((watch) => rows.filter((card) => watchOf(card.bell) === watch).length);
}

/** "all" and "blank" stay. A clerk that is no longer on a chit falls back to all. */
export function activeClerk(filter: string, clerks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const clerk = clerkLabel(filter);
  return clerk && clerks.includes(clerk) ? clerk : "all";
}

export function clerkArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return clerkLabel(filter);
}

/** "all" and "blank" stay. An aisle that is no longer on a chit falls back to all. */
export function activeAisle(filter: string, aisles: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const aisle = aisleName(filter);
  return aisle && aisles.includes(aisle) ? aisle : "all";
}

export function aisleArg(filter: string): ChitAisle | null {
  if (filter === "blank") return "blank";
  return aisleName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a chit falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = chitMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return chitMark(filter);
}

/** "all" and "blank" stay. A chime that is no longer on a chit falls back to all. */
export function activeChime(filter: string, chimes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const chime = chimeName(filter);
  return chime && chimes.includes(chime) ? chime : "all";
}

export function chimeArg(filter: string): ChitChime | null {
  if (filter === "blank") return "blank";
  return chimeName(filter) || null;
}

/** All, blank, the watches, edge, body, and the hours 0 through 23 stay. Anything else is all. */
export function activeBell(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const bell = bellOf(filter);
  return bell === null ? "all" : String(bell);
}

export function bellArg(filter: string): { exact: number | null; pick: BellPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as BellPick };
  const bell = bellOf(filter);
  return bell === null ? { exact: null, pick: null } : { exact: bell, pick: null };
}

/** All, blank, and the pegs 1 through 3 stay. Anything else is all. */
export function activePeg(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const peg = pegOf(filter);
  return peg === null ? "all" : String(peg);
}

export function pegArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pegOf(filter);
}

/** All, blank, and the spans 15, 30, 45, and 60 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** Other chits with the same aisle and the same hour. A blank aisle or a blank hour clashes with nothing. */
export function chitClashIds(cards: readonly Chit[], id: string): string[] {
  const rows = readChits(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.aisle || card.bell === null) return [];
  return rows
    .filter((item) => item.id !== id && item.aisle === card.aisle && item.bell === card.bell)
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .map((item) => item.id);
}

/** How many saved chits share an aisle and an hour with another chit. */
export function clashChitCount(cards: readonly Chit[]): number {
  const rows = readChits(cards);
  return rows.filter((card) => chitClashIds(rows, card.id).length > 0).length;
}

/** Other chits with the same aisle and the same peg. A blank aisle or a blank peg clashes with nothing. */
export function pegClashIds(cards: readonly Chit[], id: string): string[] {
  const rows = readChits(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.aisle || card.peg === null) return [];
  return rows
    .filter((item) => item.id !== id && item.aisle === card.aisle && item.peg === card.peg)
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .map((item) => item.id);
}

/** How many saved chits share an aisle and a peg with another chit. */
export function pegClashCount(cards: readonly Chit[]): number {
  const rows = readChits(cards);
  return rows.filter((card) => pegClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open chit at or after the hour you type, skipping peal.
 * After 23, the day wraps to the earliest open chit that is not peal.
 */
export function nextChit(cards: readonly Chit[], desk: unknown): string {
  const now = bellOf(desk);
  if (now === null) return "";
  const waiting = readChits(cards).filter((card) => inTray(card, "open") && card.bell !== null && card.chime !== "peal");
  if (!waiting.length) return "";
  const byBell = (a: Chit, b: Chit) => (a.bell ?? 0) - (b.bell ?? 0) || a.subject.localeCompare(b.subject);
  const later = waiting.filter((card) => (card.bell ?? 0) >= now).sort(byBell);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBell)[0].id;
}

/**
 * The aisle with the fewest open chits.
 * A tie keeps the earlier aisle: north, then south, west, and east.
 * Chits with no aisle are not a load. An empty desk still suggests north.
 */
export function suggestAisle(cards: readonly Chit[]): Exclude<ChitAisle, "blank"> {
  const rows = readChits(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<ChitAisle, "blank"> = "north";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const aisle of AISLES) {
    const count = rows.filter((card) => card.aisle === aisle).length;
    if (count < bestCount) {
      best = aisle;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The clerk with the fewest open chits.
 * A tie keeps the earlier name. A blank clerk is not a candidate.
 * A desk with no named clerk suggests nothing.
 */
export function suggestClerk(cards: readonly Chit[]): string {
  const rows = readChits(cards).filter((card) => inTray(card, "open") && card.clerk);
  const clerks: string[] = [];
  for (const card of rows) {
    if (!clerks.includes(card.clerk)) clerks.push(card.clerk);
  }
  clerks.sort((a, b) => a.localeCompare(b));
  if (!clerks.length) return "";
  let best = clerks[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const clerk of clerks) {
    const count = rows.filter((card) => card.clerk === clerk).length;
    if (count < bestCount) {
      best = clerk;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the chits saved in this browser. The gap and the late mark use the hour you pass. */
export function chitsCsv(raw: unknown, desk: unknown): string {
  const lines = ["subject,clerk,bell,aisle,mark,chime,peg,span,watch,pinned,seated,closed,gap,late,aside,audit"];
  for (const card of readChits(raw)) {
    const gap = bellGap(card.bell, desk);
    lines.push([
      csvCell(card.subject),
      csvCell(card.clerk),
      card.bell === null ? "" : String(card.bell),
      card.aisle,
      csvCell(card.mark),
      card.chime,
      card.peg === null ? "" : String(card.peg),
      card.span === null ? "" : String(card.span),
      watchOf(card.bell),
      card.pinned ? "1" : "0",
      card.seated ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateChit(card, desk) ? "1" : "0",
      csvCell(card.aside),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function clerkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerkLabel(raw) || "all";
}

function aisleSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return aisleName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return chitMark(raw) || "all";
}

function chimeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return chimeName(raw) || "all";
}

export function readChitViews(raw: unknown): ChitView[] {
  if (!Array.isArray(raw)) return [];
  const out: ChitView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ChitView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      clerk: clerkSlot(row.clerk),
      aisle: aisleSlot(row.aisle),
      mark: markSlot(row.mark),
      chime: chimeSlot(row.chime),
      bell: activeBell(String(row.bell ?? "")),
      peg: activePeg(String(row.peg ?? "")),
      span: activeSpan(String(row.span ?? "")),
    });
  }
  return out.slice(0, 6);
}

export function addChitView(
  views: readonly ChitView[],
  view: {
    id: string;
    name: string;
    tray: ChitTray;
    query: string;
    clerk: string;
    aisle: string;
    mark: string;
    chime: string;
    bell: string;
    peg: string;
    span: string;
  },
): ChitView[] {
  const current = readChitViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    clerk: clerkSlot(view.clerk),
    aisle: aisleSlot(view.aisle),
    mark: markSlot(view.mark),
    chime: chimeSlot(view.chime),
    bell: activeBell(view.bell),
    peg: activePeg(view.peg),
    span: activeSpan(view.span),
  }].slice(0, 6);
}

export function dropChitView(views: readonly ChitView[], id: string): ChitView[] {
  return readChitViews(views).filter((view) => view.id !== id);
}

function clockParts(text: string): { hour: number; minute: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  if (Number.isNaN(Date.parse(text))) return null;
  return { hour, minute };
}

function shutterBody(value: ShutterValue): { iso: string; explicit: boolean } | null {
  if (typeof value === "string") {
    const text = clip(value, 40);
    if (!text) return { iso: "", explicit: true };
    const parts = clockParts(text);
    return parts ? { iso: text, explicit: true } : { iso: "", explicit: false };
  }
  if (!value || typeof value !== "object") return { iso: "", explicit: false };
  if (SHUTTER_BLOCK.some((key) => key in value)) return null;
  if (!("loginBlockedAt" in value)) return { iso: "", explicit: false };
  const inner = value.loginBlockedAt;
  if (inner === null) return { iso: "", explicit: true };
  if (typeof inner !== "string") return { iso: "", explicit: false };
  const text = clip(inner, 40);
  if (!text) return { iso: "", explicit: true };
  const parts = clockParts(text);
  return parts ? { iso: text, explicit: true } : { iso: "", explicit: false };
}

/**
 * Set, clear, or unmarked.
 * A set time can be read as a clock. A clear time is an explicit blank. A missing field stays unmarked.
 * A login flag, a block message, a name, and the other blocked fields are not a shutter time.
 */
export function shutterState(value: ShutterValue): ShutterState {
  const body = shutterBody(value);
  if (!body) return "";
  if (body.iso) return "set";
  return body.explicit ? "clear" : "";
}

/**
 * Night is 0–5. Morning is 6–11. Afternoon is 12–17. Evening is 18–23.
 * The hour is read from the timestamp itself. A blank time has no watch.
 */
export function shutterWatch(value: ShutterValue): ShutterWatch {
  const body = shutterBody(value);
  if (!body?.iso) return "";
  const hour = clockParts(body.iso)?.hour;
  if (hour === undefined) return "";
  if (hour <= 5) return "night";
  if (hour <= 11) return "morning";
  if (hour <= 17) return "afternoon";
  return "evening";
}

/**
 * Early is minute 0–19. Middle is 20–39. Late is 40–59.
 * A blank time has no phase.
 */
export function shutterPhase(value: ShutterValue): ShutterPhase {
  const body = shutterBody(value);
  if (!body?.iso) return "";
  const minute = clockParts(body.iso)?.minute;
  if (minute === undefined) return "";
  if (minute <= 19) return "early";
  if (minute <= 39) return "middle";
  return "late";
}

export function watchLines(rows: readonly ShutterRow[]): WatchLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = shutterState(row.at);
    const watch = state === "set" ? shutterWatch(row.at) : state === "clear" ? "" : "";
    const key = state === "set" ? watch : state === "clear" ? "" : "";
    map.set(state === "" ? "" : key, (map.get(state === "" ? "" : key) || 0) + 1);
  }
  const out: WatchLine[] = [];
  for (const watch of ["", ...WATCHES]) {
    const count = map.get(watch);
    if (count) out.push({ watch, count });
  }
  return out;
}

export function namedWatches(rows: readonly ShutterRow[]): string[] {
  return watchLines(rows).map((line) => line.watch).filter(Boolean);
}

export function phaseLines(rows: readonly ShutterRow[]): PhaseLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const phase = shutterPhase(row.at);
    map.set(phase, (map.get(phase) || 0) + 1);
  }
  const out: PhaseLine[] = [];
  for (const phase of ["", ...PHASES]) {
    const count = map.get(phase);
    if (count) out.push({ phase, count });
  }
  return out;
}

export function namedPhases(rows: readonly ShutterRow[]): string[] {
  return phaseLines(rows).map((line) => line.phase).filter(Boolean);
}

/** The watch with the most loaded rows. A tie keeps night, then morning, afternoon, and evening. An unmarked field is not a lead. */
export function leadingWatch(rows: readonly ShutterRow[]): string {
  const named = watchLines(rows).filter((line) => line.watch);
  if (!named.length) return "";
  const order = (watch: string) => WATCHES.indexOf(watch as (typeof WATCHES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.watch) - order(b.watch))[0].watch;
}

/** The phase with the most loaded rows. A tie keeps early, then middle, then late. A blank time is not a lead. */
export function leadingPhase(rows: readonly ShutterRow[]): string {
  const named = phaseLines(rows).filter((line) => line.phase);
  if (!named.length) return "";
  const order = (phase: string) => PHASES.indexOf(phase as (typeof PHASES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.phase) - order(b.phase))[0].phase;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function shutterShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function watchToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((WATCHES as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentWatches(rows: readonly ShutterRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = shutterState(row.at);
    const token = state === "set" ? shutterWatch(row.at) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenWatches(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const watch = watchToken(item);
    if (!watch || !known.has(watch) || out.includes(watch)) continue;
    out.push(watch);
  }
  return out;
}

export function toggleWatch(hidden: readonly string[], watch: string, present: readonly string[]): string[] {
  const token = watchToken(watch);
  if (!token || !present.includes(token)) return readHiddenWatches(hidden, present);
  const current = readHiddenWatches(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleWatches(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenWatches(hidden, present));
  return present.filter((watch) => (showHidden ? gone.has(watch) : !gone.has(watch)));
}

/** "all" and "blank" stay. A watch that is no longer loaded falls back to all. */
export function activeWatch(filter: string, watches: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (WATCHES as readonly string[]).includes(filter) && watches.includes(filter) ? filter : "all";
}

export function watchArg(filter: string): ShutterWatch | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (WATCHES as readonly string[]).includes(filter) ? (filter as ShutterWatch) : null;
}

/** "all" and "blank" stay. A phase that is no longer loaded falls back to all. */
export function activePhase(filter: string, phases: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (PHASES as readonly string[]).includes(filter) && phases.includes(filter) ? filter : "all";
}

export function phaseArg(filter: string): ShutterPhase | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (PHASES as readonly string[]).includes(filter) ? (filter as ShutterPhase) : null;
}

/** Search stays on the name. The watch and the phase are not part of the query. */
export function visibleShutterCustomers<T extends ShutterRow>(
  rows: readonly T[],
  watch: ShutterWatch | "blank" | null,
  phase: ShutterPhase | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const state = shutterState(row.at);
    if (watch === "blank" && state !== "clear") return false;
    if (watch && watch !== "blank" && shutterWatch(row.at) !== watch) return false;
    if (phase !== null && shutterPhase(row.at) !== phase) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the watches and phases on this page. */
export function shuttersCsv(rows: readonly ShutterRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = shutterState(row.at);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of watchLines(rows)) if (line.watch) lines.push(["watch", csvCell(line.watch), String(line.count)].join(","));
  for (const line of phaseLines(rows)) lines.push(["phase", csvCell(line.phase), String(line.count)].join(","));
  return lines.join("\n");
}
