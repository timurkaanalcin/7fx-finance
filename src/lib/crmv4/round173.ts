/**
 * Local glasshouse stools for the seating desk, and the retention note already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_glasshouse_stool (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   host text not null default '',
 *   seat integer,
 *   tempo text not null default '',
 *   aisle text not null default '',
 *   shade text not null default '',
 *   rank integer,
 *   pause integer,
 *   pinned boolean not null default false,
 *   seated boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_slip_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_slip_review (
 *   customer_id text primary key
 * );
 */

export const STOOL_KEY = "crmv4-glasshouse-stools";
export const STOOL_VIEW_KEY = "crmv4-glasshouse-views";
export const SLIP_KEY = "crmv4-slip-hide";
export const SLIP_REVIEW_KEY = "crmv4-slip-review";

export type StoolShade = "blank" | "mist" | "leaf" | "bloom";

export type StoolTempo = "blank" | "sit" | "lean" | "rise";

export type StoolTray = "open" | "seated" | "filed";

export type StoolPick = "blank" | "near" | "mid" | "far" | "end" | "body";

export type Stool = {
  id: string;
  title: string;
  note: string;
  host: string;
  seat: number | null;
  tempo: string;
  aisle: string;
  shade: string;
  rank: number | null;
  pause: number | null;
  pinned: boolean;
  seated: boolean;
  filed: boolean;
  audit: string;
};

export type StoolView = {
  id: string;
  name: string;
  tray: StoolTray;
  query: string;
  host: string;
  tempo: string;
  aisle: string;
  shade: string;
  seat: string;
  rank: string;
  pause: string;
};

export type StoolCounts = {
  open: number;
  seated: number;
  filed: number;
  pinned: number;
  end: number;
  late: number;
};

export type SlipState = "" | "set" | "clear";

export type SlipBand = "" | "whisper" | "line" | "page" | "folio";

export type SlipDepth = "" | "near" | "mid" | "far";

export type SlipValue =
  | {
      retentionNote?: unknown;
      failedLoginCount?: unknown;
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
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      validationStatus?: unknown;
      registrationDate?: unknown;
      birthDate?: unknown;
      lastContactAt?: unknown;
      lastSeenAt?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type SlipRow = { id?: string; note?: SlipValue; label?: string | null };

export type SlipBandLine = { band: string; count: number };

export type SlipDepthLine = { depth: string; count: number };

const AUDITS = ["save", "edit", "shade", "pin", "unpin", "seat", "stand", "file", "reopen", "move"] as const;

const TEMPOS = ["sit", "lean", "rise"] as const;

const SHADES = ["mist", "leaf", "bloom"] as const;

const SHADE_ORDER = ["", "mist", "leaf", "bloom"] as const;

const PICKS = ["blank", "near", "mid", "far", "end", "body"] as const;

const ENDS = new Set([1, 6]);

const RANKS = [1, 2, 3] as const;

const PAUSES = [4, 8, 12, 16] as const;

const SLIP_BANDS = ["whisper", "line", "page", "folio"] as const;

const DEPTHS = ["near", "mid", "far"] as const;

const STATES = ["set", "clear"] as const;

const SLIP_BLOCK = [
  "failedLoginCount",
  "loginBlockedAt",
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
  "lastSeenAt",
] as const;

const STOOL_CAP = 8;

const VIEW_CAP = 5;

const NOTE_CAP = 160;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): StoolTray {
  return raw === "seated" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function tempoName(raw: unknown): Exclude<StoolTempo, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TEMPOS as readonly string[]).includes(text) ? (text as Exclude<StoolTempo, "blank">) : "";
}

function shadeName(raw: unknown): Exclude<StoolShade, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHADES as readonly string[]).includes(text) ? (text as Exclude<StoolShade, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function stoolLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function stoolNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank host stays blank. It is not filled in. */
export function hostLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank aisle stays blank. It is not filled in. */
export function stoolAisle(raw: unknown): string {
  return clip(raw, 4);
}

/**
 * A seat is an integer from 1 through 6.
 * A blank value stays unset. 0 and 7 are not seats.
 * A leading zero is the same seat: 01 is 1, and 06 is 6.
 */
export function seatOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 6) return raw;
  if (typeof raw === "string" && /^(?:[1-6]|0[1-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A rank is an integer from 1 through 3.
 * A blank value stays unset. 0 and 4 are not ranks.
 * A leading zero is the same rank: 01 is 1.
 */
export function rankOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && (RANKS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:[1-3]|0[1-3])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A pause is 4, 8, 12, or 16 minutes. A blank value stays unset. A leading zero is not a pause. */
export function pauseOf(raw: unknown): number | null {
  if (typeof raw === "number" && (PAUSES as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:4|8|12|16)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Sit, lean, rise, or blank. Anything else is blank. */
export function tempoOf(raw: unknown): StoolTempo {
  return tempoName(raw) || "blank";
}

/** Mist, leaf, bloom, or blank. Anything else is blank. */
export function shadeOf(raw: unknown): StoolShade {
  return shadeName(raw) || "blank";
}

/** Near is 1–2. Mid is 3–4. Far is 5–6. An unset seat is blank. */
export function seatBand(seat: unknown): "blank" | "near" | "mid" | "far" {
  const value = seatOf(seat);
  if (value === null) return "blank";
  if (value <= 2) return "near";
  if (value <= 4) return "mid";
  return "far";
}

/** End seats are 1 and 6. An unset seat is not an end. */
export function endSeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && ENDS.has(value);
}

/** Body seats are 2 through 5. An unset seat is not body. */
export function bodySeat(seat: unknown): boolean {
  const value = seatOf(seat);
  return value !== null && !ENDS.has(value);
}

/**
 * The shortest signed step from the saved seat to the typed seat.
 * The house wraps at 6. A step of 3 stays positive. A step of -3 becomes 3.
 * A positive step means the typed seat is ahead of the walk.
 */
export function seatGap(seat: unknown, desk: unknown): number | null {
  const from = seatOf(seat);
  const at = seatOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 3) diff -= 6;
  if (diff < -2) diff += 6;
  return diff;
}

export function readStools(raw: unknown): Stool[] {
  if (!Array.isArray(raw)) return [];
  const out: Stool[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Stool>;
    const id = String(row.id || "").trim();
    const title = stoolLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: stoolNote(row.note),
      host: hostLabel(row.host),
      seat: seatOf(row.seat),
      tempo: tempoName(row.tempo),
      aisle: stoolAisle(row.aisle),
      shade: shadeName(row.shade),
      rank: rankOf(row.rank),
      pause: pauseOf(row.pause),
      pinned: row.pinned === true,
      seated: row.seated === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, STOOL_CAP);
}

export function addStool(
  cards: readonly Stool[],
  card: {
    id: string;
    title: string;
    note?: string;
    host?: string;
    seat?: unknown;
    tempo?: string;
    aisle?: string;
    shade?: string;
    rank?: unknown;
    pause?: unknown;
  },
): Stool[] {
  const current = readStools(cards);
  const id = String(card.id || "").trim();
  const title = stoolLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Stool = {
    id,
    title,
    note: stoolNote(card.note),
    host: hostLabel(card.host),
    seat: seatOf(card.seat),
    tempo: tempoName(card.tempo),
    aisle: stoolAisle(card.aisle),
    shade: shadeName(card.shade),
    rank: rankOf(card.rank),
    pause: pauseOf(card.pause),
    pinned: false,
    seated: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, STOOL_CAP);
}

/** Blank becomes mist. Mist becomes leaf, leaf becomes bloom, and bloom returns to mist. */
export function cycleShade(cards: readonly Stool[], id: string): Stool[] {
  return readStools(cards).map((card) => {
    if (card.id !== id) return card;
    const at = SHADE_ORDER.indexOf(card.shade as (typeof SHADE_ORDER)[number]);
    const next = at < 0 || at >= SHADES.length ? SHADES[0] : SHADES[at % SHADES.length];
    if (!next || next === card.shade) return card;
    return { ...card, shade: next, audit: "shade" };
  });
}

export function setStoolPin(cards: readonly Stool[], id: string, pinned: boolean): Stool[] {
  return readStools(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setStoolSeat(cards: readonly Stool[], id: string, seated: boolean): Stool[] {
  return readStools(cards).map((card) => (card.id === id ? { ...card, seated, audit: seated ? "seat" : "stand" } : card));
}

export function setStoolFiled(cards: readonly Stool[], id: string, filed: boolean): Stool[] {
  return readStools(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editStool(cards: readonly Stool[], id: string, title: string): Stool[] {
  const current = readStools(cards);
  const next = stoolLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editStoolNote(cards: readonly Stool[], id: string, note: string): Stool[] {
  const current = readStools(cards);
  const next = stoolNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkStoolPin(cards: readonly Stool[], ids: readonly string[], pinned: boolean): Stool[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readStools(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkStoolFile(cards: readonly Stool[], ids: readonly string[], filed: boolean): Stool[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readStools(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank or unknown tempo is left out. A stool already at that tempo is left as it is. */
export function bulkStoolTempo(cards: readonly Stool[], ids: readonly string[], tempo: string): Stool[] {
  const name = tempoName(tempo);
  const current = readStools(cards);
  if (!name) return current;
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return current.map((card) => (want.has(card.id) && card.tempo !== name ? { ...card, tempo: name, audit: "move" } : card));
}

export function resetStools(): Stool[] {
  return [];
}

/** Copy uses the title. A blank title copies nothing. */
export function stoolCopy(raw: unknown): string {
  return stoolLine(raw);
}

function inTray(card: Stool, tray: StoolTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "seated") return card.seated && !card.filed;
  return !card.seated && !card.filed;
}

function seatHit(seat: number | null, exact: number | null, pick: StoolPick | null): boolean {
  if (exact !== null) return seat === exact;
  if (pick === null) return true;
  if (pick === "blank") return seat === null;
  if (pick === "end") return endSeat(seat);
  if (pick === "body") return bodySeat(seat);
  return seatBand(seat) === pick;
}

function shadeScore(shade: string): number {
  if (shade === "bloom") return 3;
  if (shade === "leaf") return 2;
  if (shade === "mist") return 1;
  return 0;
}

function waitingEnd(card: Stool): boolean {
  return endSeat(card.seat) && inTray(card, "open");
}

function haystack(card: Stool): string {
  return `${card.title}\n${card.note}\n${card.aisle}`.toLowerCase();
}

/** An open stool is late when the desk seat is more than two seats ahead. */
export function lateStool(card: Stool, desk: unknown): boolean {
  const gap = seatGap(card.seat, desk);
  return inTray(card, "open") && gap !== null && gap > 2;
}

/** Search matches the title, the note, and the aisle. The host, the seat, and the tempo are not part of the query. */
export function visibleStools(
  cards: readonly Stool[],
  tray: StoolTray,
  query: string,
  host: string | null,
  tempo: StoolTempo | null,
  aisle: string | null,
  shade: StoolShade | null,
  exact: number | null,
  pick: StoolPick | null,
  rank: number | "blank" | null,
  pause: number | "blank" | null,
  bloomOnly: boolean,
  endOnly: boolean,
): Stool[] {
  const text = query.trim().toLowerCase();
  const wantHost = host === null ? null : hostLabel(host);
  const wantAisle = aisle === null ? null : stoolAisle(aisle);
  return readStools(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (bloomOnly && card.shade !== "bloom") return false;
      if (wantHost !== null && hostLabel(card.host) !== wantHost) return false;
      if (tempo !== null && tempoOf(card.tempo) !== tempo) return false;
      if (wantAisle !== null && stoolAisle(card.aisle) !== wantAisle) return false;
      if (shade !== null && shadeOf(card.shade) !== shade) return false;
      if (!seatHit(card.seat, exact, pick)) return false;
      if (rank === "blank" && card.rank !== null) return false;
      if (typeof rank === "number" && card.rank !== rank) return false;
      if (pause === "blank" && card.pause !== null) return false;
      if (typeof pause === "number" && card.pause !== pause) return false;
      if (endOnly && !waitingEnd(card)) return false;
      return !text || haystack(card).includes(text);
    })
    .sort((a, b) => {
      if (shadeScore(a.shade) !== shadeScore(b.shade)) return shadeScore(b.shade) - shadeScore(a.shade);
      return a.title.localeCompare(b.title);
    });
}

/** The seat orders the house. An unset seat stays at the end. Search matches the title, the note, and the aisle. */
export function seatTimeline(cards: readonly Stool[], query: string): Stool[] {
  const text = query.trim().toLowerCase();
  return readStools(cards)
    .filter((card) => !text || haystack(card).includes(text))
    .sort((a, b) => {
      if (a.seat === null && b.seat !== null) return 1;
      if (a.seat !== null && b.seat === null) return -1;
      if (a.seat !== null && b.seat !== null && a.seat !== b.seat) return a.seat - b.seat;
      return a.title.localeCompare(b.title);
    });
}

export function stoolCounts(cards: readonly Stool[], desk: unknown): StoolCounts {
  const rows = readStools(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    seated: rows.filter((card) => inTray(card, "seated")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    end: rows.filter((card) => waitingEnd(card)).length,
    late: rows.filter((card) => lateStool(card, desk)).length,
  };
}

/** Share of the saved stools. A zero total stays at zero. */
export function stoolShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function stoolHosts(cards: readonly Stool[]): string[] {
  const out: string[] = [];
  for (const card of readStools(cards)) {
    if (card.host && !out.includes(card.host)) out.push(card.host);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function stoolAisles(cards: readonly Stool[]): string[] {
  const out: string[] = [];
  for (const card of readStools(cards)) {
    if (card.aisle && !out.includes(card.aisle)) out.push(card.aisle);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function stoolTempos(cards: readonly Stool[]): Exclude<StoolTempo, "blank">[] {
  const seen = new Set<string>();
  for (const card of readStools(cards)) if (card.tempo) seen.add(card.tempo);
  return TEMPOS.filter((tempo) => seen.has(tempo));
}

export function stoolShades(cards: readonly Stool[]): Exclude<StoolShade, "blank">[] {
  const seen = new Set<string>();
  for (const card of readStools(cards)) if (card.shade) seen.add(card.shade);
  return SHADES.filter((shade) => seen.has(shade));
}

/** How many open stools a host still holds. A blank host is not a load. */
export function hostLoad(cards: readonly Stool[], host: string): number {
  const name = hostLabel(host);
  if (!name) return 0;
  return readStools(cards).filter((card) => card.host === name && inTray(card, "open")).length;
}

/** Three tempos. Index 0 is sit. Index 2 is rise. */
export function tempoCounts(cards: readonly Stool[]): number[] {
  const rows = readStools(cards);
  return TEMPOS.map((tempo) => rows.filter((card) => tempoOf(card.tempo) === tempo).length);
}

/** "all" and "blank" stay. A host that is no longer on a stool falls back to all. */
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

/** "all" and "blank" stay. A tempo that is no longer on a stool falls back to all. */
export function activeTempo(filter: string, tempos: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tempo = tempoName(filter);
  return tempo && tempos.includes(tempo) ? tempo : "all";
}

export function tempoArg(filter: string): StoolTempo | null {
  if (filter === "blank") return "blank";
  return tempoName(filter) || null;
}

/** "all" and "blank" stay. An aisle that is no longer on a stool falls back to all. */
export function activeAisle(filter: string, aisles: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const aisle = stoolAisle(filter);
  return aisle && aisles.includes(aisle) ? aisle : "all";
}

export function aisleArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stoolAisle(filter);
}

/** "all" and "blank" stay. A shade that is no longer on a stool falls back to all. */
export function activeShade(filter: string, shades: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shade = shadeName(filter);
  return shade && shades.includes(shade) ? shade : "all";
}

export function shadeArg(filter: string): StoolShade | null {
  if (filter === "blank") return "blank";
  return shadeName(filter) || null;
}

/** All, blank, the bands, end, body, and the seats 1 through 6 stay. Anything else is all. */
export function activeSeat(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const seat = seatOf(filter);
  return seat === null ? "all" : String(seat);
}

export function seatArg(filter: string): { exact: number | null; pick: StoolPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as StoolPick };
  const seat = seatOf(filter);
  return seat === null ? { exact: null, pick: null } : { exact: seat, pick: null };
}

/** All, blank, and the ranks 1 through 3 stay. Anything else is all. */
export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rank = rankOf(filter);
  return rank === null ? "all" : String(rank);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

/** All, blank, and the pauses 4, 8, 12, and 16 stay. Anything else is all. */
export function activePause(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const pause = pauseOf(filter);
  return pause === null ? "all" : String(pause);
}

export function pauseArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return pauseOf(filter);
}

/** Other stools with the same tempo and the same seat. A blank tempo or a blank seat clashes with nothing. */
export function seatClashIds(cards: readonly Stool[], id: string): string[] {
  const rows = readStools(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.tempo || card.seat === null) return [];
  return rows
    .filter((item) => item.id !== id && item.tempo === card.tempo && item.seat === card.seat)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved stools share a tempo and a seat with another stool. */
export function clashSeatCount(cards: readonly Stool[]): number {
  const rows = readStools(cards);
  return rows.filter((card) => seatClashIds(rows, card.id).length > 0).length;
}

/** Other stools with the same tempo and the same rank. A blank tempo or a blank rank clashes with nothing. */
export function rankClashIds(cards: readonly Stool[], id: string): string[] {
  const rows = readStools(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.tempo || card.rank === null) return [];
  return rows
    .filter((item) => item.id !== id && item.tempo === card.tempo && item.rank === card.rank)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => item.id);
}

/** How many saved stools share a tempo and a rank with another stool. */
export function rankClashCount(cards: readonly Stool[]): number {
  const rows = readStools(cards);
  return rows.filter((card) => rankClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open stool at or after the seat you type, skipping bloom.
 * After 6, the house wraps to the earliest open stool that is not bloom.
 */
export function nextStool(cards: readonly Stool[], desk: unknown): string {
  const now = seatOf(desk);
  if (now === null) return "";
  const waiting = readStools(cards).filter((card) => inTray(card, "open") && card.seat !== null && card.shade !== "bloom");
  if (!waiting.length) return "";
  const bySeat = (a: Stool, b: Stool) => (a.seat ?? 0) - (b.seat ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.seat ?? 0) >= now).sort(bySeat);
  if (later.length) return later[0].id;
  return waiting.slice().sort(bySeat)[0].id;
}

/**
 * The tempo with the fewest open stools.
 * A tie keeps the earlier tempo: sit, then lean, then rise.
 * Stools with no tempo are not a load. An empty desk still suggests sit.
 */
export function suggestTempo(cards: readonly Stool[]): Exclude<StoolTempo, "blank"> {
  const rows = readStools(cards).filter((card) => inTray(card, "open"));
  let best: Exclude<StoolTempo, "blank"> = "sit";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const tempo of TEMPOS) {
    const count = rows.filter((card) => card.tempo === tempo).length;
    if (count < bestCount) {
      best = tempo;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The host with the fewest open stools.
 * A tie keeps the earlier name. A blank host is not a candidate.
 * A desk with no named host suggests nothing.
 */
export function suggestHost(cards: readonly Stool[]): string {
  const rows = readStools(cards).filter((card) => inTray(card, "open") && card.host);
  const hosts: string[] = [];
  for (const card of rows) {
    if (!hosts.includes(card.host)) hosts.push(card.host);
  }
  hosts.sort((a, b) => a.localeCompare(b));
  if (!hosts.length) return "";
  let best = hosts[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const host of hosts) {
    const count = rows.filter((card) => card.host === host).length;
    if (count < bestCount) {
      best = host;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the stools saved in this browser. The gap and the late mark use the seat you pass. */
export function stoolsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,host,seat,tempo,aisle,shade,rank,pause,band,pinned,seated,filed,gap,late,note,audit"];
  for (const card of readStools(raw)) {
    const gap = seatGap(card.seat, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.host),
      card.seat === null ? "" : String(card.seat),
      card.tempo,
      csvCell(card.aisle),
      card.shade,
      card.rank === null ? "" : String(card.rank),
      card.pause === null ? "" : String(card.pause),
      seatBand(card.seat),
      card.pinned ? "1" : "0",
      card.seated ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateStool(card, desk) ? "1" : "0",
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

function tempoSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tempoName(raw) || "all";
}

function aisleSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stoolAisle(raw) || "all";
}

function shadeSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return shadeName(raw) || "all";
}

export function readStoolViews(raw: unknown): StoolView[] {
  if (!Array.isArray(raw)) return [];
  const out: StoolView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StoolView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      host: hostSlot(row.host),
      tempo: tempoSlot(row.tempo),
      aisle: aisleSlot(row.aisle),
      shade: shadeSlot(row.shade),
      seat: activeSeat(String(row.seat ?? "")),
      rank: activeRank(String(row.rank ?? "")),
      pause: activePause(String(row.pause ?? "")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addStoolView(
  views: readonly StoolView[],
  view: {
    id: string;
    name: string;
    tray: StoolTray;
    query: string;
    host: string;
    tempo: string;
    aisle: string;
    shade: string;
    seat: string;
    rank: string;
    pause: string;
  },
): StoolView[] {
  const current = readStoolViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    host: hostSlot(view.host),
    tempo: tempoSlot(view.tempo),
    aisle: aisleSlot(view.aisle),
    shade: shadeSlot(view.shade),
    seat: activeSeat(view.seat),
    rank: activeRank(view.rank),
    pause: activePause(view.pause),
  }].slice(0, VIEW_CAP);
}

export function dropStoolView(views: readonly StoolView[], id: string): StoolView[] {
  return readStoolViews(views).filter((view) => view.id !== id);
}

function slipText(raw: unknown): string {
  return clip(raw, NOTE_CAP);
}

function slipBody(value: SlipValue): { text: string; explicit: boolean } | null {
  if (typeof value === "number") return { text: "", explicit: false };
  if (typeof value === "string") return { text: slipText(value), explicit: true };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: "", explicit: false };
  if (SLIP_BLOCK.some((key) => key in value)) return null;
  if (!("retentionNote" in value)) return { text: "", explicit: false };
  const inner = value.retentionNote;
  if (inner === null) return { text: "", explicit: true };
  if (typeof inner !== "string") return { text: "", explicit: false };
  return { text: slipText(inner), explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set note is text. A clear note is an explicit blank. A missing field stays unmarked.
 * A name, a failed-login count, and the other blocked fields are not a retention note.
 */
export function slipState(value: SlipValue): SlipState {
  const body = slipBody(value);
  if (!body) return "";
  if (body.text) return "set";
  return body.explicit ? "clear" : "";
}

/** The clipped length of a set note. A clear or unmarked value stays unset. */
export function slipLength(value: SlipValue): number | null {
  const body = slipBody(value);
  if (!body || !body.text) return null;
  return body.text.length;
}

/** The clipped note. A clear or unmarked value stays blank. */
export function slipCopy(value: SlipValue): string {
  const body = slipBody(value);
  return body?.text || "";
}

/**
 * Whisper is 1 through 12. Line is 13 through 40. Page is 41 through 80. Eighty-one and above is folio.
 * A blank note has no band.
 */
export function slipBand(value: SlipValue): SlipBand {
  const length = slipLength(value);
  if (length === null) return "";
  if (length <= 12) return "whisper";
  if (length <= 40) return "line";
  if (length <= 80) return "page";
  return "folio";
}

/**
 * Near, mid, or far inside the band.
 * Whisper cuts at 4 and 8. Line cuts at 20 and 30. Page cuts at 54 and 68.
 * Folio cuts at 110 and 140.
 */
export function slipDepth(value: SlipValue): SlipDepth {
  const band = slipBand(value);
  const length = slipLength(value);
  if (!band || length === null) return "";
  if (band === "whisper") return length <= 4 ? "near" : length <= 8 ? "mid" : "far";
  if (band === "line") return length <= 20 ? "near" : length <= 30 ? "mid" : "far";
  if (band === "page") return length <= 54 ? "near" : length <= 68 ? "mid" : "far";
  if (length <= 110) return "near";
  if (length <= 140) return "mid";
  return "far";
}

export function slipBands(rows: readonly SlipRow[]): SlipBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = slipState(row.note);
    if (state === "") continue;
    const band = state === "set" ? slipBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: SlipBandLine[] = [];
  for (const band of ["", ...SLIP_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function slipDepths(rows: readonly SlipRow[]): SlipDepthLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const depth = slipDepth(row.note);
    map.set(depth, (map.get(depth) || 0) + 1);
  }
  const out: SlipDepthLine[] = [];
  for (const depth of ["", ...DEPTHS]) {
    const count = map.get(depth);
    if (count) out.push({ depth, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps whisper, then line, page, and folio. An unmarked field is not a lead. */
export function leadingSlip(rows: readonly SlipRow[]): string {
  const named = slipBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const tie = ["whisper", "line", "page", "folio"];
  const order = (band: string) => tie.indexOf(band);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The depth with the most loaded rows. A tie keeps near, then mid, then far. A blank note is not a lead. */
export function leadingSlipDepth(rows: readonly SlipRow[]): string {
  const named = slipDepths(rows).filter((line) => line.depth);
  if (!named.length) return "";
  const order = (depth: string) => DEPTHS.indexOf(depth as (typeof DEPTHS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.depth) - order(b.depth))[0].depth;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandToken(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if ((SLIP_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentSlips(rows: readonly SlipRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = slipState(row.note);
    const token = state === "set" ? slipBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenSlips(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandToken(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleSlip(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandToken(band);
  if (!token || !present.includes(token)) return readHiddenSlips(hidden, present);
  const current = readHiddenSlips(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleSlipBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSlips(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

/** "all" and "blank" stay. A band that is no longer loaded falls back to all. */
export function activeSlip(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (SLIP_BANDS as readonly string[]).includes(filter) && bands.includes(filter) ? filter : "all";
}

export function slipArg(filter: string): SlipBand | "blank" | null {
  if (filter === "blank") return "blank";
  if (!filter || filter === "all") return null;
  return (SLIP_BANDS as readonly string[]).includes(filter) ? (filter as SlipBand) : null;
}

/** "all" and "blank" stay. A depth that is no longer loaded falls back to all. */
export function activeSlipDepth(filter: string, depths: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (DEPTHS as readonly string[]).includes(filter) && depths.includes(filter) ? filter : "all";
}

export function slipDepthArg(filter: string): SlipDepth | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (DEPTHS as readonly string[]).includes(filter) ? (filter as SlipDepth) : null;
}

function rowId(row: SlipRow): string {
  return String(row.id || "").trim();
}

export function readReviewed(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 40);
}

export function toggleReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewed(reviewed, present);
  const current = readReviewed(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewed(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 40);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the depth, and the note are not part of the query. */
export function visibleSlipCustomers<T extends SlipRow>(
  rows: readonly T[],
  band: SlipBand | "blank" | null,
  depth: SlipDepth | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = slipState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && slipBand(row.note) !== band) return false;
    if (depth !== null && slipDepth(row.note) !== depth) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and depths on this page. */
export function slipsCsv(rows: readonly SlipRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = slipState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", ...STATES]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of slipBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of slipDepths(rows)) lines.push(["depth", csvCell(line.depth), String(line.count)].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function slipRowsCsv(rows: readonly SlipRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,depth,length,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    const length = slipLength(row.note);
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(slipBand(row.note)),
      csvCell(slipDepth(row.note)),
      length === null ? "" : String(length),
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

export const STOOL_TEMPOS = TEMPOS;
export const STOOL_BANDS = ["near", "mid", "far"] as const;
