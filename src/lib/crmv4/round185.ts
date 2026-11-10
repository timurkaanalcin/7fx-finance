/**
 * Courtesy vows for the promise desk, and the leverage already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_courtesy_vow (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   caller text not null default '',
 *   lane integer,
 *   ribbon text not null default '',
 *   seal text not null default '',
 *   pace text not null default '',
 *   rank integer,
 *   span integer,
 *   pinned boolean not null default false,
 *   parked boolean not null default false,
 *   closed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_leverage_span_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_leverage_span_review (
 *   customer_id text primary key
 * );
 */

export const VOW_KEY = "crmv4-courtesy-vows";
export const VOW_VIEW_KEY = "crmv4-courtesy-vow-views";
export const SPAN_KEY = "crmv4-leverage-span-hide";
export const SPAN_REVIEW_KEY = "crmv4-leverage-span-review";

export type VowRibbon = "blank" | "ivory" | "graphite" | "champagne" | "ink";

export type VowPace = "blank" | "calm" | "steady" | "brisk";

export type VowTray = "open" | "parked" | "closed";

export type LanePick = "blank" | "dawn" | "day" | "dusk" | "peak" | "quiet";

export type Vow = {
  id: string;
  title: string;
  note: string;
  caller: string;
  lane: number | null;
  ribbon: string;
  seal: string;
  pace: string;
  rank: number | null;
  span: number | null;
  pinned: boolean;
  parked: boolean;
  closed: boolean;
  audit: string;
};

export type VowView = {
  id: string;
  name: string;
  tray: VowTray;
  query: string;
  caller: string;
  ribbon: string;
  seal: string;
  pace: string;
  lane: string;
  rank: string;
  span: string;
};

export type VowCounts = {
  open: number;
  parked: number;
  closed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type SpanState = "" | "set" | "clear";

export type SpanBand = "" | "soft" | "book" | "firm" | "steep";

export type SpanParity = "" | "even" | "odd";

export type SpanShape = "all" | "catalog" | "steep" | "even";

export type SpanValue =
  | {
      leverage?: unknown;
      balance?: unknown;
      equity?: unknown;
      credit?: unknown;
      bonus?: unknown;
      currency?: unknown;
      margin?: unknown;
      freeMargin?: unknown;
      amount?: unknown;
    }
  | string
  | number
  | null
  | undefined;

export type SpanRow = { id?: string; note?: SpanValue; label?: string | null };

export type SpanBandLine = { band: string; count: number };

export type SpanParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "park", "release", "close", "reopen", "ribbon"] as const;

const RIBBONS = ["ivory", "graphite", "champagne", "ink"] as const;

const PACES = ["calm", "steady", "brisk"] as const;

const PACE_ORDER = ["", "calm", "steady", "brisk"] as const;

const PICKS = ["blank", "dawn", "day", "dusk", "peak", "quiet"] as const;

const PEAKS = new Set([2, 5]);

const QUIETS = new Set([1, 3, 6]);

const RANKS = [1, 3, 9] as const;

const SPANS = [5, 15, 45] as const;

const HOME = new Set(["IST", "DXB", "LON"]);

const SPAN_BANDS = ["soft", "book", "firm", "steep"] as const;

const PARITIES = ["even", "odd"] as const;

const CATALOG = new Set([1, 50, 100, 200, 500]);

const SPAN_BLOCK = ["balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount"] as const;

const VOW_CAP = 8;

const VIEW_CAP = 4;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): VowTray {
  return raw === "parked" || raw === "closed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function ribbonName(raw: unknown): Exclude<VowRibbon, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (RIBBONS as readonly string[]).includes(text) ? (text as Exclude<VowRibbon, "blank">) : "";
}

function paceName(raw: unknown): Exclude<VowPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<VowPace, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function vowLine(raw: unknown): string {
  return clip(raw, 32);
}

/** A blank note stays blank. It is not filled in. */
export function vowNote(raw: unknown): string {
  return clip(raw, 72);
}

/** A blank caller stays blank. It is not filled in. */
export function callerLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A seal is exactly three letters. Anything else stays blank. Letters are stored in capitals. */
export function vowSeal(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : "";
}

/**
 * A lane is an integer from 1 through 6.
 * A blank value stays unset. 0 and 7 are not lanes.
 * A leading zero is the same lane: 01 is 1, and 06 is 6. 07 is not a lane.
 */
export function laneOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 6) return raw;
  if (typeof raw === "string" && /^(?:[1-6]|0[1-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A rank is 1, 3, or 9.
 * A blank value stays unset. 0 and 2 are not ranks.
 * A leading zero is not a rank.
 */
export function rankOf(raw: unknown): number | null {
  if (typeof raw === "number" && (RANKS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|9)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A span is 5, 15, or 45 minutes. A blank value stays unset. A leading zero is not a span. */
export function spanMinutes(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:5|15|45)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Ivory, graphite, champagne, ink, or blank. Anything else is blank. */
export function ribbonOf(raw: unknown): VowRibbon {
  return ribbonName(raw) || "blank";
}

/** Calm, steady, brisk, or blank. Anything else is blank. */
export function paceOf(raw: unknown): VowPace {
  return paceName(raw) || "blank";
}

/** Dawn is lane 1. Day is 2–4. Dusk is 5–6. An unset lane is blank. */
export function laneBand(lane: unknown): "blank" | "dawn" | "day" | "dusk" {
  const value = laneOf(lane);
  if (value === null) return "blank";
  if (value === 1) return "dawn";
  if (value <= 4) return "day";
  return "dusk";
}

/** Peak lanes are 2 and 5. An unset lane is not a peak. */
export function peakLane(lane: unknown): boolean {
  const value = laneOf(lane);
  return value !== null && PEAKS.has(value);
}

/** Quiet lanes are 1, 3, and 6. 2 and 5 are not quiet. An unset lane is not quiet. */
export function quietLane(lane: unknown): boolean {
  const value = laneOf(lane);
  return value !== null && QUIETS.has(value);
}

/**
 * The shortest signed step from the saved lane to the typed lane.
 * The ring wraps at 6. A step of 3 stays. A step of -3 stays.
 * A positive step means the typed lane is ahead of the vow.
 */
export function laneGap(lane: unknown, desk: unknown): number | null {
  const from = laneOf(lane);
  const at = laneOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 3) diff -= 6;
  if (diff < -3) diff += 6;
  return diff;
}

/** IST, DXB, and LON are home seals. A blank seal is not. */
export function homeSeal(seal: unknown): boolean {
  return HOME.has(vowSeal(seal));
}

export function readVows(raw: unknown): Vow[] {
  if (!Array.isArray(raw)) return [];
  const out: Vow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Vow>;
    const id = String(row.id || "").trim();
    const title = vowLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: vowNote(row.note),
      caller: callerLabel(row.caller),
      lane: laneOf(row.lane),
      ribbon: ribbonName(row.ribbon),
      seal: vowSeal(row.seal),
      pace: paceName(row.pace),
      rank: rankOf(row.rank),
      span: spanMinutes(row.span),
      pinned: row.pinned === true,
      parked: row.parked === true,
      closed: row.closed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, VOW_CAP);
}

export function addVow(
  cards: readonly Vow[],
  card: {
    id: string;
    title: string;
    note?: string;
    caller?: string;
    lane?: unknown;
    ribbon?: string;
    seal?: string;
    pace?: string;
    rank?: unknown;
    span?: unknown;
  },
): Vow[] {
  const current = readVows(cards);
  const id = String(card.id || "").trim();
  const title = vowLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Vow = {
    id,
    title,
    note: vowNote(card.note),
    caller: callerLabel(card.caller),
    lane: laneOf(card.lane),
    ribbon: ribbonName(card.ribbon),
    seal: vowSeal(card.seal),
    pace: paceName(card.pace),
    rank: rankOf(card.rank),
    span: spanMinutes(card.span),
    pinned: false,
    parked: false,
    closed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, VOW_CAP);
}

/** Blank becomes calm. Calm becomes steady, steady becomes brisk, and brisk returns to calm. */
export function cyclePace(cards: readonly Vow[], id: string): Vow[] {
  return readVows(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = at < 0 || at >= PACES.length ? PACES[0] : PACES[at % PACES.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

export function setVowPin(cards: readonly Vow[], id: string, pinned: boolean): Vow[] {
  return readVows(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setVowPark(cards: readonly Vow[], id: string, parked: boolean): Vow[] {
  return readVows(cards).map((card) => (card.id === id ? { ...card, parked, audit: parked ? "park" : "release" } : card));
}

export function setVowClose(cards: readonly Vow[], id: string, closed: boolean): Vow[] {
  return readVows(cards).map((card) => (card.id === id ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editVow(cards: readonly Vow[], id: string, title: string): Vow[] {
  const current = readVows(cards);
  const next = vowLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editVowNote(cards: readonly Vow[], id: string, note: string): Vow[] {
  const current = readVows(cards);
  const next = vowNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkVowPin(cards: readonly Vow[], ids: readonly string[], pinned: boolean): Vow[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readVows(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkVowRibbon(cards: readonly Vow[], ids: readonly string[], ribbon: unknown): Vow[] {
  const next = ribbonName(ribbon);
  if (!next) return readVows(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readVows(cards).map((card) => (want.has(card.id) ? { ...card, ribbon: next, audit: "ribbon" } : card));
}

export function bulkVowClose(cards: readonly Vow[], ids: readonly string[], closed: boolean): Vow[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readVows(cards).map((card) => (want.has(card.id) ? { ...card, closed, audit: closed ? "close" : "reopen" } : card));
}

export function resetVows(): Vow[] {
  return [];
}

function inTray(card: Vow, tray: VowTray): boolean {
  if (tray === "closed") return card.closed;
  if (tray === "parked") return card.parked && !card.closed;
  return !card.parked && !card.closed;
}

function laneHit(lane: number | null, exact: number | null, pick: LanePick | null): boolean {
  if (exact !== null) return lane === exact;
  if (pick === null) return true;
  if (pick === "blank") return lane === null;
  if (pick === "peak") return peakLane(lane);
  if (pick === "quiet") return quietLane(lane);
  return laneBand(lane) === pick;
}

function paceScore(pace: string): number {
  if (pace === "brisk") return 3;
  if (pace === "steady") return 2;
  if (pace === "calm") return 1;
  return 0;
}

/** An open vow whose lane sits more than two steps behind the desk lane. A parked or closed vow is not late. */
export function lateVow(card: Vow, desk: unknown): boolean {
  const gap = laneGap(card.lane, desk);
  return inTray(card, "open") && gap !== null && gap > 2;
}

/** An open vow with a 5 minute span is the reminder. A parked or closed vow is not. */
export function soonVow(card: Vow): boolean {
  return inTray(card, "open") && card.span === 5;
}

/** Search matches the title, the note, and the caller. The lane and the ribbon are not part of the query. */
export function visibleVows(
  cards: readonly Vow[],
  tray: VowTray,
  query: string,
  caller: string | null,
  ribbon: VowRibbon | null,
  seal: string | null,
  pace: VowPace | null,
  exact: number | null,
  pick: LanePick | null,
  rank: number | "blank" | null,
  span: number | "blank" | null,
  briskOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Vow[] {
  const text = query.trim().toLowerCase();
  const wantCaller = caller === null ? null : callerLabel(caller);
  const wantSeal = seal === null ? null : vowSeal(seal);
  return readVows(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantCaller !== null && card.caller !== wantCaller) return false;
      if (ribbon !== null && ribbonOf(card.ribbon) !== ribbon) return false;
      if (wantSeal !== null && card.seal !== wantSeal) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!laneHit(card.lane, exact, pick)) return false;
      if (rank === "blank" && card.rank !== null) return false;
      if (typeof rank === "number" && card.rank !== rank) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (briskOnly && card.pace !== "brisk") return false;
      if (peakOnly && !peakLane(card.lane)) return false;
      if (homeOnly && !homeSeal(card.seal)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.caller.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.title.localeCompare(b.title);
    });
}

export function vowTimeline(cards: readonly Vow[], query: string): Vow[] {
  const text = query.trim().toLowerCase();
  return readVows(cards)
    .filter((card) => card.lane !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.caller.toLowerCase().includes(text))
    .sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0) || a.title.localeCompare(b.title));
}

export function vowCounts(cards: readonly Vow[], desk: unknown): VowCounts {
  const rows = readVows(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    parked: rows.filter((card) => inTray(card, "parked")).length,
    closed: rows.filter((card) => inTray(card, "closed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakLane(card.lane) && inTray(card, "open")).length,
    late: rows.filter((card) => lateVow(card, desk)).length,
    soon: rows.filter((card) => soonVow(card)).length,
    home: rows.filter((card) => homeSeal(card.seal)).length,
  };
}

export function vowShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function vowCallers(cards: readonly Vow[]): string[] {
  const seen = new Set<string>();
  for (const card of readVows(cards)) if (card.caller) seen.add(card.caller);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function vowSeals(cards: readonly Vow[]): string[] {
  const seen = new Set<string>();
  for (const card of readVows(cards)) if (card.seal) seen.add(card.seal);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function vowPaces(cards: readonly Vow[]): Exclude<VowPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readVows(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

export function ribbonCounts(cards: readonly Vow[]): { ribbon: Exclude<VowRibbon, "blank">; count: number }[] {
  const rows = readVows(cards);
  return RIBBONS.map((ribbon) => ({ ribbon, count: rows.filter((card) => card.ribbon === ribbon).length })).filter((row) => row.count > 0);
}

export function usedLanes(cards: readonly Vow[]): number {
  return new Set(readVows(cards).map((card) => card.lane).filter((lane): lane is number => lane !== null)).size;
}

export function clashLaneIds(cards: readonly Vow[]): string[] {
  const open = readVows(cards).filter((card) => inTray(card, "open") && card.lane !== null && card.ribbon);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ribbon === card.ribbon && other.lane === card.lane)).map((card) => card.id);
}

export function clashLaneCount(cards: readonly Vow[]): number {
  return clashLaneIds(cards).length;
}

export function rankClashIds(cards: readonly Vow[]): string[] {
  const open = readVows(cards).filter((card) => inTray(card, "open") && card.rank !== null && card.ribbon);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.ribbon === card.ribbon && other.rank === card.rank)).map((card) => card.id);
}

export function rankClashCount(cards: readonly Vow[]): number {
  return rankClashIds(cards).length;
}

/** The next open vow at or after the desk lane. Brisk paces wait. A blank desk lane stays blank. */
export function nextVow(cards: readonly Vow[], desk: unknown): string {
  const now = laneOf(desk);
  if (now === null) return "";
  const waiting = readVows(cards).filter((card) => inTray(card, "open") && card.lane !== null && card.pace !== "brisk");
  if (!waiting.length) return "";
  const byLane = (a: Vow, b: Vow) => (a.lane ?? 0) - (b.lane ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.lane ?? 0) >= now).sort(byLane);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byLane)[0].id;
}

/**
 * The ribbon with the fewest open vows.
 * A tie keeps ink, then champagne, then ivory, then graphite.
 * Vows with no ribbon are not a load. An empty desk still suggests ink.
 */
export function suggestRibbon(cards: readonly Vow[]): Exclude<VowRibbon, "blank"> {
  const rows = readVows(cards).filter((card) => inTray(card, "open"));
  const order = ["ink", "champagne", "ivory", "graphite"] as const;
  let best: Exclude<VowRibbon, "blank"> = "ink";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const ribbon of order) {
    const count = rows.filter((card) => card.ribbon === ribbon).length;
    if (count < bestCount) {
      best = ribbon;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The caller carrying the fewest open vows.
 * A tie keeps the earlier name. A blank caller is not a load.
 * An empty desk stays blank.
 */
export function suggestCaller(cards: readonly Vow[]): string {
  const rows = readVows(cards).filter((card) => inTray(card, "open") && card.caller);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.caller))).sort((a, b) => a.localeCompare(b));
  for (const caller of names) {
    const count = rows.filter((card) => card.caller === caller).length;
    if (count < bestCount) {
      best = caller;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The span with the fewest open vows.
 * A tie keeps 15, then 5, then 45.
 * An empty desk still suggests 15.
 */
export function suggestSpan(cards: readonly Vow[]): (typeof SPANS)[number] {
  const rows = readVows(cards).filter((card) => inTray(card, "open"));
  const order = [15, 5, 45] as const;
  let best: (typeof SPANS)[number] = 15;
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
 * The roster name with the fewest open vows.
 * A blank roster falls back to the least-loaded caller already on the desk.
 * A tie keeps the earlier name.
 */
export function fairCaller(cards: readonly Vow[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = callerLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestCaller(cards);
  const open = readVows(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.caller === name).length;
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

/** The CSV is the vows saved in this browser. The gap and the late mark use the lane you pass. */
export function vowsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,caller,lane,ribbon,seal,pace,rank,span,band,pinned,parked,closed,gap,late,soon,home,note,audit"];
  for (const card of readVows(raw)) {
    const gap = laneGap(card.lane, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.caller),
      card.lane === null ? "" : String(card.lane),
      card.ribbon,
      csvCell(card.seal),
      card.pace,
      card.rank === null ? "" : String(card.rank),
      card.span === null ? "" : String(card.span),
      laneBand(card.lane),
      card.pinned ? "1" : "0",
      card.parked ? "1" : "0",
      card.closed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateVow(card, desk) ? "1" : "0",
      soonVow(card) ? "1" : "0",
      homeSeal(card.seal) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function vowCopy(card: Vow): string {
  return [card.title, card.caller, card.lane ?? "", card.ribbon, card.seal, card.pace, card.rank ?? "", card.span ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function callerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return callerLabel(raw) || "all";
}

function ribbonSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribbonName(raw) || "all";
}

function sealSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return vowSeal(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

/** "all" and a lane pick stay. A lane from 1 through 6 stays. Anything else is all. */
export function activeLane(filter: string): string {
  if (filter === "all") return "all";
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const lane = laneOf(filter);
  return lane === null ? "all" : String(lane);
}

export function laneArg(filter: string): { exact: number | null; pick: LanePick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as LanePick };
  const lane = laneOf(filter);
  return lane === null ? { exact: null, pick: null } : { exact: lane, pick: null };
}

/** All, blank, and the ranks 1, 3, and 9 stay. Anything else is all. */
export function activeRank(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const rank = rankOf(filter);
  return rank === null ? "all" : String(rank);
}

export function rankArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return rankOf(filter);
}

/** All, blank, and the spans 5, 15, and 45 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanMinutes(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanMinutes(filter);
}

export function activeCaller(filter: string, callers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const caller = callerLabel(filter);
  return caller && callers.includes(caller) ? caller : "all";
}

export function callerArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return callerLabel(filter) || null;
}

export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = ribbonName(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): VowRibbon | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return ribbonName(filter) || null;
}

export function activeSeal(filter: string, seals: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const seal = vowSeal(filter);
  return seal && seals.includes(seal) ? seal : "all";
}

export function sealArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return vowSeal(filter) || null;
}

export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): VowPace | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function readVowViews(raw: unknown): VowView[] {
  if (!Array.isArray(raw)) return [];
  const out: VowView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VowView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      caller: callerSlot(row.caller),
      ribbon: ribbonSlot(row.ribbon),
      seal: sealSlot(row.seal),
      pace: paceSlot(row.pace),
      lane: activeLane(String(row.lane || "all")),
      rank: activeRank(String(row.rank || "all")),
      span: activeSpan(String(row.span || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addVowView(views: readonly VowView[], view: VowView): VowView[] {
  const current = readVowViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    caller: callerSlot(view.caller),
    ribbon: ribbonSlot(view.ribbon),
    seal: sealSlot(view.seal),
    pace: paceSlot(view.pace),
    lane: activeLane(view.lane),
    rank: activeRank(view.rank),
    span: activeSpan(view.span),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropVowView(views: readonly VowView[], id: string): VowView[] {
  return readVowViews(views).filter((view) => view.id !== id);
}

/**
 * A leverage is an integer from 1 through 500.
 * A blank value stays unset. 0 and 501 are not leverages.
 * A leading zero is not a leverage. 050 is not 50.
 */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 500) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|[1-9]\d|[1-4]\d{2}|500)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

function spanBody(value: SpanValue): { n: number | null; explicit: boolean } | null {
  if (typeof value === "number") return { n: spanOf(value), explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { n: null, explicit: true };
    const n = spanOf(value);
    return { n, explicit: n !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { n: null, explicit: false };
  if (SPAN_BLOCK.some((key) => key in value)) return null;
  if (!("leverage" in value)) return { n: null, explicit: false };
  const inner = value.leverage;
  if (inner === null || inner === "") return { n: null, explicit: true };
  const n = spanOf(inner);
  if (n === null) return { n: null, explicit: false };
  return { n, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set span is a leverage from 1 through 500. A clear span is an explicit blank.
 * A missing field stays unmarked. A balance and the other blocked fields are not this span.
 */
export function spanState(value: SpanValue): SpanState {
  const body = spanBody(value);
  if (!body) return "";
  if (body.n !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The leverage number, or a blank string when the span is clear or unmarked. */
export function spanCopy(value: SpanValue): string {
  const n = spanBody(value)?.n;
  return n === null || n === undefined ? "" : String(n);
}

/**
 * Soft is 1–20. Book is 21–100. Firm is 101–200. Steep is 201–500.
 * A blank span has no band.
 */
export function spanBand(value: SpanValue): SpanBand {
  const n = spanBody(value)?.n;
  if (n === null || n === undefined) return "";
  if (n <= 20) return "soft";
  if (n <= 100) return "book";
  if (n <= 200) return "firm";
  return "steep";
}

/** Even or odd. A blank span has no parity. */
export function spanParity(value: SpanValue): SpanParity {
  const n = spanBody(value)?.n;
  if (n === null || n === undefined) return "";
  return n % 2 === 0 ? "even" : "odd";
}

/** 1, 50, 100, 200, and 500 are the house catalog. A clear span is not catalog. */
export function catalogSpan(value: SpanValue): boolean {
  const n = spanBody(value)?.n;
  return n !== null && n !== undefined && CATALOG.has(n);
}

/** A span of 201 or more. A clear span is not steep. */
export function steepSpan(value: SpanValue): boolean {
  return spanBand(value) === "steep";
}

/** An even leverage. A clear span is not even. */
export function evenSpan(value: SpanValue): boolean {
  return spanParity(value) === "even";
}

export function catalogSpanCount(rows: readonly SpanRow[]): number {
  return rows.filter((row) => spanState(row.note) === "set" && catalogSpan(row.note)).length;
}

export function steepSpanCount(rows: readonly SpanRow[]): number {
  return rows.filter((row) => spanState(row.note) === "set" && steepSpan(row.note)).length;
}

export function evenSpanCount(rows: readonly SpanRow[]): number {
  return rows.filter((row) => spanState(row.note) === "set" && evenSpan(row.note)).length;
}

/** How many distinct leverages are shared by two or more customers. */
export function sharedSpanCount(rows: readonly SpanRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (spanState(row.note) !== "set") continue;
    const text = spanCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function spanBands(rows: readonly SpanRow[]): SpanBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = spanState(row.note);
    if (state === "") continue;
    const band = state === "set" ? spanBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: SpanBandLine[] = [];
  for (const band of ["", ...SPAN_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function spanParities(rows: readonly SpanRow[]): SpanParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = spanParity(row.note);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: SpanParityLine[] = [];
  for (const parity of ["", ...PARITIES]) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps soft, then book, firm, and steep. An unmarked field is not a lead. */
export function leadingSpan(rows: readonly SpanRow[]): string {
  const named = spanBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => SPAN_BANDS.indexOf(band as (typeof SPAN_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The parity with the most loaded rows. A tie keeps even, then odd. A blank span is not a lead. */
export function leadingSpanParity(rows: readonly SpanRow[]): string {
  const named = spanParities(rows).filter((line) => line.parity);
  if (!named.length) return "";
  const order = (parity: string) => PARITIES.indexOf(parity as (typeof PARITIES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.parity) - order(b.parity))[0].parity;
}

export function spanShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandSpan(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((SPAN_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentSpans(rows: readonly SpanRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = spanState(row.note);
    const token = state === "set" ? spanBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenSpans(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandSpan(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleSpan(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandSpan(band);
  if (!token || !present.includes(token)) return readHiddenSpans(hidden, present);
  const current = readHiddenSpans(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleSpanBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSpans(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function spanBandArg(filter: string): SpanBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandSpan(filter);
  return band && band !== "blank" ? (band as SpanBand) : null;
}

export function activeSpanBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandSpan(filter);
  return band && present.includes(band) ? band : "all";
}

function paritySpan(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (PARITIES as readonly string[]).includes(text) ? text : "";
}

export function spanParityArg(filter: string): SpanParity | null {
  if (filter === "all") return null;
  const parity = paritySpan(filter);
  return parity ? (parity as SpanParity) : null;
}

export function activeSpanParity(filter: string): string {
  if (filter === "all") return "all";
  return paritySpan(filter) || "all";
}

function rowId(row: SpanRow): string {
  return String(row.id || "").trim();
}

export function readReviewedSpans(raw: unknown, present: readonly string[]): string[] {
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

export function toggleSpanReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedSpans(reviewed, present);
  const current = readReviewedSpans(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkSpanReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedSpans(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the parity, and the leverage are not part of the query. */
export function visibleSpanCustomers<T extends SpanRow>(
  rows: readonly T[],
  band: SpanBand | "blank" | null,
  parity: SpanParity | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: SpanShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = spanState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && spanBand(row.note) !== band) return false;
    if (parity !== null && spanParity(row.note) !== parity) return false;
    if (shape === "catalog" && !catalogSpan(row.note)) return false;
    if (shape === "steep" && (state !== "set" || !steepSpan(row.note))) return false;
    if (shape === "even" && !evenSpan(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and parities on this page. */
export function spansCsv(rows: readonly SpanRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = spanState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of spanBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of spanParities(rows)) lines.push(["parity", csvCell(line.parity), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogSpanCount(rows))].join(","));
  lines.push(["shape", "steep", String(steepSpanCount(rows))].join(","));
  lines.push(["shape", "even", String(evenSpanCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedSpanCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function spanRowsCsv(rows: readonly SpanRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,parity,leverage,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(spanBand(row.note)),
      csvCell(spanParity(row.note)),
      csvCell(spanCopy(row.note)),
      catalogSpan(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
